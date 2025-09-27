import { compile as compileVue, type RawSourceMap } from '@vue/compiler-dom';
import { Builder, type BuilderOptions } from './Builder';

export interface CompileOption extends BuilderOptions{
	filename?: string;
	sourceMap?: boolean;
	logOutResult?: boolean;
}

export interface CompileResult {
	code: string;
	map?: RawSourceMap;
}

export async function compile(
	source: string,
	{
		filename = 'component.cdy.vue',
		sourceMap = false,
		logOutResult = true,
		...builderOptions
	}: CompileOption
): Promise<CompileResult> {

	const compiled = compileVue(source, {
		mode: 'module',
		optimizeImports: true,
		filename,
		sourceMap,
	});

	const builder = new Builder(compiled, builderOptions);
	const code = await builder.build();

	if (logOutResult) {
		console.log(`File result "${filename}":\n`, code);
	}

	return {
		code,
		map: compiled.map,
	};
}

