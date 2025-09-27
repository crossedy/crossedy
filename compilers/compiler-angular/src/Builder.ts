import type { CodegenResult } from '@vue/compiler-core';
import path from 'node:path';
import prettier from 'prettier';
import { JsBuilder, TemplateBuilder, TsBuilder } from './builders';

export interface BuilderOptions {
	componentPrefixTag?: string, // TODO Change to regex
	componentPath?: string
	wrapperModulePath?: string,
	generateTS?: boolean,
	onlyHtml?: true;
	onlyJs?: true;
	onlyTs?: true;
}

export class Builder {

	public options: BuilderOptions;
	public compiled: CodegenResult;
	public cdyAppend: string = '';

	public builders = {
		js: new JsBuilder(this),
		ts: new TsBuilder(this),
		template: new TemplateBuilder(this),
	}

	public constructor(compiled: CodegenResult, options: BuilderOptions = {}) {
		this.options = {
			componentPrefixTag: 'cdy-',
			componentPath: path.resolve(process.cwd(), '/src/components'),
			wrapperModulePath: '@crossedy/wrapper-angular',
			...options
		};
		this.options.generateTS = !!(options.generateTS || options.onlyTs)
		this.compiled = compiled;
	}

	async build(): Promise<string> {
		let buildTemplate = this.builders.template.build();

		try {
			buildTemplate = await prettier.format(buildTemplate, {
				tabWidth: 4,
				parser: 'html'
			});
		} catch (e) {
			console.warn(e);
		}

		if (this.options.onlyHtml) {
			return buildTemplate;
		}

		if (this.options.onlyTs) {
			return this.builders.ts.build();
		}
		let buildJs = this.builders.js.build();
		if (this.options.onlyJs) {
			return buildJs;
		}

		return `
			${buildJs}
			export const template = ${JSON.stringify(buildTemplate)};
			export default template;
		`
	}
}
