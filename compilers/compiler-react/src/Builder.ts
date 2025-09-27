import path from 'node:path';
import {
	CodegenResult,
	type ElementNode,
	type ForNode,
	type IfNode,
	type Node,
	NodeTypes,
	type TemplateChildNode
} from '@vue/compiler-core';
import eventMapping from './eventMapping';

function capitalize(str: string) {
	str = str.trim();
	return str ? str[0].toUpperCase() + str.substring(1) : null;
}
function kebabToCamel(str: string) {
	return str.replace(/-([a-z])/g, function(match, letter) {
		return letter.toUpperCase();
	});
}
function mapEvent(htmlEventName: string) {
	return eventMapping[htmlEventName as keyof typeof eventMapping] || htmlEventName;
}

export interface BuilderOptions {
	componentPrefixTag?: string, // TODO Change to regex
	componentPath?: string
}

export type GeneryNode = Node|string;

export class Builder {

	public importList: string[] = [];

	private _compiled: CodegenResult
	private _options: BuilderOptions;
	private _appendIndex: number = 0;
	private _levelRealNode: number = 0;
	private _inSlot: number = 0;

	public constructor(compiled: CodegenResult, options: BuilderOptions = {}) {
		this._options = {
			componentPrefixTag: 'cdy-',
			componentPath: path.resolve(process.cwd(), '/src/components'),
			...options
		};
		this._compiled = compiled;
	}

	build() {
		return this._buildNode(this._compiled.ast);
	}

	_extractElement(node: Node) {
		switch (node.type) {
			case NodeTypes.ELEMENT:
				const nodeElement: ElementNode = node as ElementNode;
				if (nodeElement.tag.indexOf(this._options.componentPrefixTag!) === 0) {
					const id = ++this._appendIndex;

					const tag = `SdsComponent${id}`;
					const name = capitalize(kebabToCamel(nodeElement.tag.substring(this._options.componentPrefixTag!.length)));
					this.importList.push(
						`import { default as ${tag} } from ${JSON.stringify(`${this._options.componentPath}/${name}`)}`
					)

					return tag;
				}

				if (nodeElement.tag === 'template') {
					return '_F';
				}
				return nodeElement.tag ? `${JSON.stringify(nodeElement.tag)}` : '_F';
			default: return '_F'
		}
	}

	_buildAttributeBind(prop: any) {
		if (!prop.arg) {
			return [
				`...(${this._buildNode(prop.exp)})`,
				null
			];
		}
		if (/^on[A-Z]/.test(prop.arg.content)) {
			let target =  prop.arg.content[2].toLowerCase() + prop.arg.content.substring(3);
			return [
				`on${capitalize(mapEvent(kebabToCamel(target)))}`,
				`$event => (${this._buildNode(prop.exp)})`
			];
		}
		if (prop.arg.content === 'class') {
			return [
				'className',
				`_c(${this._buildNode(prop.exp)})`
			];
		}
		if (prop.arg.content === 'style') {
			return [
				'style',
				`_s(${this._buildNode(prop.exp)})`
			];
		}
		return [
			prop.arg.content,
			`(${this._buildNode(prop.exp)})`
		];
	}

	_buildAttributeOn(prop: any) {
		return [
			`on${capitalize(mapEvent(kebabToCamel(prop.arg?.content)))}`,
			`$event => (${this._buildNode(prop.exp)})`
		];
	}

	_buildAttributeSlot(node: any, prop: any) {

		const arg: string = prop?.arg?.content || 'default';
		const isScopedSlot = !!prop?.exp;
		const children = this._extractChildrenFromNode(node);
		const name = `slot${kebabToCamel(capitalize(arg) as any)}`;
		let value = `_ce(_F, null, ${children})`;
		if (isScopedSlot) {
			const callbackArgs = this._buildNode(prop.exp, '');
			value = `${callbackArgs} => ${value}`
		}

		const ifProps: any = this._findAttribute(node, 'if');
		if (ifProps && ifProps.exp) {
			const condition = this._buildNode(ifProps.exp);
			value = `((${condition}) ? (${value}) : null)`
		}
		node.skip = true;

		return [ name, value ];
	}

	_buildAttributeStyle(prop: any) {
		return [
			`style`,
			`_s(${JSON.stringify(prop.value?.content || '')})`
		];
	}

	_extractAttributes(node: ElementNode, element: string = '_F') {
		if (!node.props)  {
			return 'null';
		}

		let listAttributes = Object.fromEntries(
			node.props.map((prop: any) => [ prop.name, prop ])
		);

		if (element !== '_F' && this._levelRealNode === 0) {
			const value = listAttributes['ref']?.value?.content || null;
			listAttributes['ref'] = {
				name: 'ref',
				value: {
					content: '$ref',
					content2: value,
				}
			};
		}

		const attributes: any[] = Object.entries(listAttributes).map(([ name, prop ]: [ string|null, any ]) => {
			let value = null;
			switch (name) {
				case 'ref':
					value = prop.value?.content2 ? `_cr(_ctx.${prop.value?.content || ''}, _ctx.${prop.value?.content2 || ''})` : `_ctx.${prop.value?.content || ''}`;
					break;
				case 'bind': [ name, value ] = this._buildAttributeBind(prop); break;
				case 'on': [ name, value ] = this._buildAttributeOn(prop); break;
				case 'slot':
					if (node.tag === 'template' && ((prop as any)?.arg?.content || 'default') === 'default') {
						name = null;
						break
					}
					[ name, value ] = this._buildAttributeSlot(node, prop); break;
				case 'style': [ name, value ] = this._buildAttributeStyle(prop); break;
				case 'class': name = 'className';
				default: value = JSON.stringify((prop as any).value?.content || '')
			}

			if (!name) {
				return null;
			}

			return value !== null ? `${JSON.stringify(name)}: ${value}` : name;
		});

		for (const child of node.children || []) {
			if ((child as ElementNode).tag === 'template') {
				const propSlot: any = this._findAttribute(child as ElementNode, 'slot');
				if (propSlot) {
					const isScopedSlot = !!propSlot?.exp;
					if (isScopedSlot || propSlot.arg.content !== 'default') {
						(child as any).props.splice((child as any).props.indexOf(propSlot), 1);
						const [ name, value ] = this._buildAttributeSlot(child, propSlot);
						attributes.push(`${JSON.stringify(name)}: ${value}`);
						(child as any).skip = true;
					}
				}
			}
		}

		const result = `{${attributes.filter(attr => !!attr).join(',\n\t')}}`;
		return result !== '{}' ? result : 'null';
	}

	_extractChildrenFromNode(node: ElementNode, groupMulti: boolean = false) {
		if ((node as any).skip) {
			return 'null';
		}
		return this._extractChildren(node.children, groupMulti);
	}

	_extractChildren(children: TemplateChildNode[], groupMulti: boolean = false) {
		const row = children?.map(c => this._buildNode(c)) || [];

		// Optimisation if no children return null
		if (row.length === 0) {
			return 'null';
		} else if(row.length === 1){ // If only one child no create Fragment node
			return `${row[0]}`;
		} else if(groupMulti) { // And multi child create Fragment node
			return `_ce(_F, null, ${row.join(',\n\t')})`;
		}
		// If no group flat only with comma
		return row.join(',\n\t');
	}

	_buildNodeElement(node: ElementNode) {

		if (node.tag === 'slot') {
			this._inSlot++;
			const result =  this._buildNodeSlot(node);
			this._inSlot--;
			return result;
		}

		const element = this._extractElement(node);
		const attributes: any = this._extractAttributes(node, element);
		if (element !== '_F') {
			this._levelRealNode++;
		}
		const children = this._extractChildrenFromNode(node);
		if (element !== '_F') {
			this._levelRealNode--;
		}

		return `_ce(${element}, ${attributes}, ${children})`;
	}

	_buildNodeCompoundExpression(node: any) {
		const  expression = node.children.map((child: any) => this._buildNode(child, '')).join('');
		return `(${expression})`;
	}

	_buildNodeSimpleExpression(node: any) {
		return node.content;
	}

	_buildNodeText(node: any) {
		return JSON.stringify(node.content);
	}

	_buildNodeFor(node: any) {
		const source = this._buildNode(node.source);
		const children = this._extractChildrenFromNode(node as any, true);
		const value = node.valueAlias.content;
		const key = node.keyAlias?.content;

		return `..._e(${source}, (${value}${key ? `,${key}` : ''}) => (${children}))`;
	}

	_buildNodeSlot(node: any) {
		const attr: any = this._findAttribute(node, 'name');
		const slotAttributes = this._extractAttributes(node);
		let firstName = '_ctx.slotDefault';
		let secondName = '_ctx.children';

		if (attr && attr.value.content !== 'default') {
			firstName = `_ctx.slot${capitalize(kebabToCamel(attr.value.content))}`;
			secondName = firstName;
		}

		const fallback = `_ce(_F, null, ${this._extractChildrenFromNode(node)})`;

		return `(_rs(${firstName}, ${secondName}, ${slotAttributes}) || ${fallback})`;
	}

	_buildNodeBranches(node: ElementNode, branches: any) {
		if (!branches.length) {
			return 'null';
		}
		const branche = branches.shift();
		const condition = branche.condition ? this._buildNode(branche.condition) : null;
		const children = this._extractChildren(branche.children, true);
		const elseBranche: any = this._buildNodeBranches(node, branches);

		return condition ? `((${condition}) ? ${children} : (${elseBranche}))` : `${children}`;
	}
	_buildNodeIf(node: IfNode) {

		if (node.branches) {
			return this._buildNodeBranches(node as any, [...node.branches]);
		}

		return 'null';
	}

	_buildNode(node: GeneryNode, defaultReturn = 'null'): string {
		if (typeof node === "string") {
			return node;
		}
		if ((node as any).skip) {
			return defaultReturn;
		}
		switch (node.type) {
			case NodeTypes.ROOT:
			case NodeTypes.ELEMENT: return this._buildNodeElement(node as ElementNode);
			case NodeTypes.TEXT:
				return this._buildNodeText(node);
			case NodeTypes.SIMPLE_EXPRESSION:
				return this._buildNodeSimpleExpression(node);
			case NodeTypes.COMPOUND_EXPRESSION:
				return this._buildNodeCompoundExpression(node);
			case NodeTypes.TEXT_CALL:
			case NodeTypes.INTERPOLATION:
				return this._buildNode((node as any).content, defaultReturn);
			case NodeTypes.IF:
				return this._buildNodeIf(node as IfNode);
			case NodeTypes.FOR:
				return this._buildNodeFor(node as ForNode);
			default: return defaultReturn;
		}
	}
	_findAttribute(node: ElementNode, name: string) {
		return node?.props?.find(p => p.name === name);
	}
}
