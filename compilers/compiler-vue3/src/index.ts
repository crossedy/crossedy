import { compile as compileVue, type RawSourceMap } from '@vue/compiler-dom';

export interface CompileOption {
	filename?: string;
	sourceMap?: boolean;
}

export interface CompileResult {
	code: string;
	map?: RawSourceMap;
}

export function compile(
	source: string,
	{
		filename = 'component.cdy.vue',
		sourceMap = false,
	}: CompileOption
): CompileResult {
	const compiled = compileVue(source, {
		mode: 'module',
		optimizeImports: true,
		filename,
		sourceMap,
	});
	return {
		code: compiled.code + '; export default render;',
		map: compiled.map,
	};
}

