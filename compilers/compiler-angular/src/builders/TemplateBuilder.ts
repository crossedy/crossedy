import type { Builder, BuilderOptions } from '../Builder';
import { NodeTypes } from '@vue/compiler-core';
import { DomElementSchemaRegistry } from '@angular/compiler';

function capitalize(str: string): string {
	str = str.trim();
	return str ? str[0].toUpperCase() + str.substring(1) : str;
}

function kebabToCamel(str: string): string {
	return str.replace(/-([a-z])/g, function (match, letter) {
		return letter.toUpperCase();
	});
}

const escapeHtmlAttribute = (str: string) => str.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;')
;

const domRegistry = new DomElementSchemaRegistry();

function mapAttr(tag: string, name: string) {
	return domRegistry.hasProperty(tag, name, []) ? name : `attr.${name}`;
}

const VOID_ELEMENTS = [
	'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
	'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
];

function isVoidElement(tagName: string) {
	return VOID_ELEMENTS.includes(tagName.toLowerCase());
}

const inlineExpDecorator = (content: string) => `{{ ${content} }}`;

export class TemplateBuilder {

	public cdyContent: string = '';
	public appendIndex: number = 0;
	public bindVariables: string[][] = [];

	private get cdyAppend() {
		return this._builder.cdyAppend;
	}

	private set cdyAppend(value: string) {
		this._builder.cdyAppend = value;
	}


	private get options() {
		return this._builder.options;
	}

	private set options(value: BuilderOptions) {
		this._builder.options = value;
	}

	constructor(
		private _builder: Builder,
	) {
	}

	public build(): string {

		const isRoot = (node: any) => {
			if (node.parent.type === NodeTypes.ROOT) {
				return true;
			}
			if (node.parent.type === NodeTypes.ELEMENT) {
				return false;
			}
			return isRoot(node.parent);
		};

		const addPrevNext = (node: any) => {

			const applyChild = (n: any, i: number, list: any[]) => {
				if (typeof n === 'string') return;
				n.parent = node;
				n.isRoot = isRoot(n);
				n.isComponent = n.tag?.indexOf(this.options.componentPrefixTag) === 0;
				n.prev = list[i - 1] || null;
				n.next = list[i + 1] || null;
				addPrevNext(n);
			};
			node.children?.forEach((n: any, i: number, list: any[]) => applyChild(n, i, list));
			node.branches?.forEach((n: any, i: number, list: any[]) => applyChild(n, i, list));
		};
		const ast = this._builder.compiled.ast;
		addPrevNext(ast);

		const content = this._buildNode(ast);

		return `
			${this.cdyContent}
			${content}
		`;
	}


	_buildBindFn(content: any) {
		const bindFn = `_b_${++this.appendIndex}`;

		const vars = this.bindVariables.flat().map(v => v+(this.options.generateTS ? ':any' : '')).join(',');
		const varsCall = this.bindVariables.flat().join(',');

		this.cdyAppend += `
			${bindFn}: (function(${vars})${this.options.generateTS ? ': any' : ''} {
				return ${content};
			}),
		`;
		return `$sds.${bindFn}(${varsCall})`;
	}

	_buildAttributeBind(tag: string, node: any, prop: any) {
		if (!prop.arg) {
			return [ this._buildNode(prop.exp, true) , null, null]
		}
		if (/^on[A-Z]/.test(prop.arg.content)) {
			const target = prop.arg.content[2].toLowerCase() + prop.arg.content.substring(3);
			this.bindVariables.push([ '$event' ]);
			const exp = this._buildNode(prop.exp, false, c => c);
			this.bindVariables.pop();
			return[ `(${target})`, target, `${exp}` ];
		}
		if (prop.arg.content === 'class') {
			if (node.isComponent) {
				return [
					'[$class]',
					'class',
					this._buildNode(prop.exp, false, c => c)
				];
			}
			return [
				'[class]',
				'class',
				`$sds._c(${this._buildNode(prop.exp, false, c => c)})`
			];
		}
		if (prop.arg.content === 'style') {
			if (node.isComponent) {
				return [
					'[$style]',
					'style',
					this._buildNode(prop.exp, false, c => c),
				];
			}
			return [
				'[ngStyle]',
				'style',
				`$sds._s(${this._buildNode(prop.exp, false, c => c)})`,
			];
		}
		return [
			`[${mapAttr(tag, prop.arg.content)}]`,
			prop.arg.content,
			`${this._buildNode(prop.exp, false, c => c)}`
		];
	}

	_buildAttributeOn(tag: string, prop: any) {
		this.bindVariables.push([ '$event' ]);
		const exp = this._buildNode(prop.exp, false, c => c);
		this.bindVariables.pop();
		return [
			`(${prop.arg.content})`,
			prop.arg.content,
			`${exp}`
		];
	}

	_buildAttributeStyle(tag: string, node: any, prop: any) {
		if (node.isComponent) {
			return [
				'[$style]',
				'style',
				JSON.stringify(prop.value?.content),
			];
		}
		return [
			'[ngStyle]',
			'style',
			`$sds._s(${JSON.stringify(prop.value?.content || '')})`,
		];
	}

	_buildAttributeClass(tag: string, node: any, prop: any) {
		if (node.isComponent) {
			return [
				'[$class]',
				'class',
				JSON.stringify(prop.value?.content || ''),
			];
		}
		return [
			'class',
			'class',
			prop.value?.content || '',
		];
	}

	_extractAttributes(tag: string, node: any) {
		if (!tag || !node.props) return '';

		const spreads: string[] = [];
		const spreadsExclude: string[] = [];
		const $bind: string[] = [];
		const isBindAttr = (name: string) => node.isComponent && name && name !== 'class' && name !== 'style';

		const attributes = node.props
			.map((prop: any) => {
				let name = prop.name;
				let targetName = prop.name;
				let value = null;

				switch (prop.name) {
					case 'bind':
						[ name, targetName, value ] = this._buildAttributeBind(tag, node, prop);
						if (value === null) {
							spreads.push(name);
							name = null;
						}
						if (isBindAttr(targetName)) {
							$bind.push(`${JSON.stringify(kebabToCamel(targetName))}:${value}`);
							return '';
						}
						break;
					case 'on':
						[ name, targetName, value ] = this._buildAttributeOn(tag, prop);
						if (isBindAttr(targetName)) {
							value = this._buildBindFn(`($event${this.options.generateTS ? ': any' : ''}) => _ctx.${value}`);
							$bind.push(`${JSON.stringify(`on${targetName[0].toUpperCase()}${kebabToCamel(targetName.substring(1))}`)}:${value}`);
							return '';
						}
						break;
					case 'style':
						[ name, targetName, value ] = this._buildAttributeStyle(tag, node, prop);
						break;
					case 'class':
						[ name, targetName, value ] = this._buildAttributeClass(tag, node, prop);
						break;
					default:
						value = `${prop.value?.content}` || null;
						if (isBindAttr(targetName)) {
							if (value === null) {
								$bind.push(`${JSON.stringify(kebabToCamel(targetName))}: true`);
							} else {
								$bind.push(`${JSON.stringify(kebabToCamel(targetName))}:"${escapeHtmlAttribute(value)}"`);
							}
							return '';
						}
				}
				if (typeof name === 'undefined' || name === null) {
					return '';
				}

				if (targetName !== null) {
					spreadsExclude.push(targetName);
				}

				return value !== null ? `${name}="${escapeHtmlAttribute(value)}"` : name
			})
			.filter((attribute: any) => !!attribute)
		;

		if ($bind.length) {
			attributes.push(`[$bind]="{${escapeHtmlAttribute($bind.join(','))}}"`);
		}

		let renderingSpreads = ''
		if (spreads.length) {
			renderingSpreads = ` [sdsSpreads]="${this._buildBindFn(`[${spreads.join(',')}]`)}" [sdsSpreadsExclude]="${escapeHtmlAttribute(JSON.stringify(spreadsExclude))}"`;
		}

		return attributes.join(' ') + renderingSpreads;
	}

	_extractChildren(node: any) {
		if (node.skip) {
			return '';
		}
		const propSlot = this._findAttribute(node, 'slot');
		if (propSlot && node.tag !== 'template') {
			return this._buildContentSlot(propSlot, {
				...node,
				tag: 'template',
			});
		}
		const children = node.children?.map((c: any) => this._buildNode(c)) || [];
		return children.length ? children.join('') : '';
	}

	_buildNodeText(node: any, jsSide: boolean) {
		return jsSide ? JSON.stringify(node.content) : node.content;
	}

	_buildNodeSlot(node: any) {
		const attr = this._findAttribute(node, 'name');


		const props = node.props
			?.filter((prop: any) => prop.name !== 'name')
			?.map((prop: any) => {
				if (prop.name === 'bind') {
					const exp = prop.exp ? this._buildNode(prop.exp, false, c => c) : 'null';
					return `${JSON.stringify(prop.arg.content)}: ${exp}`
				}
				return `${JSON.stringify(prop.name)}: ${JSON.stringify(prop.value?.content || '')}`
			}) || []
		;
		const contextAppend = `; context: { $implicit: { ${escapeHtmlAttribute(props.join(','))} } }`;


		const slotName = attr?.value?.content || 'default';
		const fallback =  this._extractChildren(node);

		if (slotName !== 'default') {
			const propName = `slot${capitalize(kebabToCamel(slotName))}`;
			return `
				<ng-container *ngIf="${propName}">
					<ng-container *ngTemplateOutlet="${propName}${contextAppend}"></ng-container>
				</ng-container>
				<ng-container *ngIf="!${propName}">
					${fallback}
				</ng-container>
			`;
		}

		this.cdyContent = `<ng-template #_sdsContent_><ng-content></ng-content></ng-template>`;

		return `
			<ng-container *ngIf="slotDefault">
				<ng-container *ngTemplateOutlet="slotDefault${contextAppend}"></ng-container>
			</ng-container>
			<ng-container *ngIf="!slotDefault">
				<ng-container *sdsContent="_sdsContent_">
					${fallback}
				</ng-container>
			</ng-container>
		`;
	}

	_parseDestructure(str: string) {
		let stack = [];
		let start = 0;
		let parts = [];

		for (let i = 0; i < str.length; i++) {
			const char = str[i];
			if (char === '{') {
				stack.push(char);
			} else if (char === '}') {
				stack.pop();
			}

			if (stack.length === 0 && char === ',') {
				parts.push(str.substring(start, i).trim());
				start = i + 1;
			}
		}

		parts.push(str.substring(start, str.length).trim());

		return parts.filter(Boolean);
	}

	_buildDestruct(value: any, ctxName: string, buildContent: any) {

		const list = this._parseDestructure(value);

		const variables: string[][] = [];
		for (const item of list) {
			const index = item.indexOf(':');
			if (index === -1) {
				variables.push([ item, item ]);
			} else {
				const name = item.substring(0, index).trim();
				const value = item.substring(index + 1).trim();

				const [ ctxName, buildContent2 ] = this._parseVarNameDestruct(value, buildContent);
				buildContent = buildContent2;
				variables.push([ name, ctxName ]);
			}
		}

		const varsBuilt = variables.map(([ name, value ]) => `let-${name}="${value}"`).join(' ');

		return () => {
			this.bindVariables.push(variables.map(([name]) => name));
			const content = `
				<ng-template [sdsDestructure]="${ctxName}" ${varsBuilt}>
					${buildContent()}
				</ng-template>
			`
			this.bindVariables.pop();
			return content;
		};
	}

	_parseVarNameDestruct(value: any, buildContent: any) {

		value = value?.trim();

		if (!value) {
			return [ null, buildContent ];
		}

		let ctxName = value;
		const match = [ ...value.matchAll(/\{(.+)}/mg) ][0]?.[1];
		if (match) {
			ctxName = `_ctx_${this.appendIndex++}`;
			buildContent = this._buildDestruct(match, ctxName, buildContent);
		}

		return [ ctxName, () => {
			this.bindVariables.push([ ctxName ]);
			const content = buildContent();
			this.bindVariables.pop();
			return content;
		} ];
	}

	_buildContentSlot(propSlot: any, node: any) {
		node.props.splice(node.props.indexOf(propSlot), 1);

		const value = propSlot.exp?.loc?.source || null;
		const [ ctxName, buildContent ] = this._parseVarNameDestruct(value, () => this._extractChildren(node));

		let condition = '';
		const ifProps = this._findAttribute(node, 'if');
		if (ifProps && ifProps.exp) {
			condition = `*ngIf="${escapeHtmlAttribute(this._buildNode(ifProps.exp, false, c => c))}" `;
		}

		return `
			<ng-template ${condition}#${kebabToCamel(propSlot.arg?.content || 'default')} ${ctxName ? `let-${ctxName}="$implicit"` : ''}>
				${buildContent()}
			</ng-template>
		`;
	}

	_extractElement(node: any) {
		switch (node.type) {
			case 1:
				if (node.tag === 'template') {
					return null;
				}
				return node.tag;
			default:
				return null
		}
	}

	_buildNodeElement(node: any) {
		if (node.skip) {
			return '';
		}

		if (node.tag === 'slot') {
			return this._buildNodeSlot(node);
		}
		if (node.tag === 'template') {
			const propSlot = this._findAttribute(node, 'slot');
			if (propSlot) {
				return this._buildContentSlot(propSlot, node);
			}
		}

		const tag = this._extractElement(node);
		const attributes = this._extractAttributes(tag, node);
		const children = this._extractChildren(node);

		if (tag) {
			if (isVoidElement(tag)) {
				return `<${tag} ${attributes} />`;
			}
			return `<${tag} ${attributes}>${children}</${tag}>`;
		}
		return children;
	}

	_buildInterpolation(node: any, jsSide: boolean, decorator = inlineExpDecorator): any {
		const result = this._buildNode(node.content, true);
		if (jsSide) {
			return result;
		}
		return decorator(this._buildBindFn(result));
	}

	_buildNodeSimpleExpression(node: any, jsSide: boolean, decorator = inlineExpDecorator) {
		if (jsSide) {
			return node.content;
		}
		return decorator(this._buildBindFn(node.content));
	}

	_buildNodeCompoundExpression(node: any, jsSide: boolean, decorator = inlineExpDecorator) {
		const result = node.children.map((child: any) => this._buildNode(child, true)).join('');
		if (jsSide) {
			return result;
		}
		return decorator(this._buildBindFn(result));
	}


	_buildNodeBranches(node: any, branches: any[]): any {
		if (!branches.length) {
			return '';
		}
		const branche = branches.shift();
		let elseRender = '';
		let append = '';

		const condition = branche.condition ? this._buildBindFn(this._buildNode(branche.condition, true, c => c)) : null;
		const elseBranche = this._buildNodeBranches(node, branches);
		const children = branche.children?.map((child: any) => this._buildNode(child)).join('') || '';

		if (elseBranche) {
			const id = ++this.appendIndex;
			elseRender = `; else _sdsElseTpl${id}`;
			append = `<ng-template #_sdsElseTpl${id}>${elseBranche}</ng-template>`;
		}

		if (!condition) {
			return children;
		}

		return `<ng-container *ngIf="${condition}${elseRender}">${children}</ng-container>${append}`;
	}

	_buildNodeIf(node: any) {
		if (node.branches) {
			return this._buildNodeBranches(node, [...node.branches]);
		}
		return '';
	}

	_buildNodeFor(node: any) {
		const source = this._buildBindFn(this._buildNode(node.source, true, c => c));
		const value = node.valueAlias.content as string;
		const key = node.keyAlias?.content || 'index' as string;


		const propKey = this._findBindAttribute(node, 'key');
		const tsAppend = this.options.generateTS ? ':any' : '';
		const trackFn = this._buildBindFn(`function(${key}${tsAppend}, ${value}${tsAppend}) {
			return ${propKey?.exp ? this._buildNode(propKey.exp) : key}
		}`)

		this.bindVariables.push([ value, key ]);
		const children = node.children?.map((child: any) => this._buildNode(child, false)).join('') || '';
		this.bindVariables.pop();

		return `
			<ng-template
				sdsFor
				let-${value}
				[sdsForOf]="${source}"
				let-index="${key}"
				[sdsForTrackBy]="${trackFn}"
			>
				${children}
			</ng-template>
		`;
	}

	_buildNode(node: any, jsSide = false, decorator = inlineExpDecorator) {

		if (typeof node === "string") {
			return node;
		}
		switch (node.type) {
			case NodeTypes.ROOT:
			case NodeTypes.ELEMENT: return this._buildNodeElement(node);
			case NodeTypes.TEXT: return this._buildNodeText(node, jsSide);
			case NodeTypes.SIMPLE_EXPRESSION:
				return this._buildNodeSimpleExpression(node, jsSide, decorator);
			case NodeTypes.COMPOUND_EXPRESSION:
				return this._buildNodeCompoundExpression(node, jsSide, decorator);
			case NodeTypes.TEXT_CALL:
			case NodeTypes.INTERPOLATION:
				return this._buildInterpolation(node, jsSide, decorator);
			case NodeTypes.IF:
				return this._buildNodeIf(node);
			case NodeTypes.FOR:
				return this._buildNodeFor(node);
			default: return '';
		}
	}

	_findBindAttribute(node: any, name: string) {
		return node?.props?.find((p: any) => p.name === 'bind' && p.arg?.content === name);
	}

	_findAttribute(node: any, name: string) {
		return node?.props?.find((p: any) => p.name === name);
	}
}
