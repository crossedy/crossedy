import { compile as compileVue, type RawSourceMap } from '@vue/compiler-dom';
import { Builder, type BuilderOptions } from './Builder';
import prettier from 'prettier';

export interface CompileOption extends BuilderOptions{
	filename?: string;
	sourceMap?: boolean;
	reactWrapperModulePath?: string,
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
		reactWrapperModulePath = '@crossedy/wrapper-react',
		logOutResult = false,
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
	const build = builder.build();

	let code = `
		import * as sdsWrapper from '${reactWrapperModulePath.replace(/'/g, '\\\'')}';
		${builder.importList.join('\n')}

		const { _ce, _F, _c, _e, _s, _rs } = sdsWrapper;

		export default function(_ctx) {
			return ${build};
		};
	`;

	try {
		code = await prettier.format(code, {
			tabWidth: 4,
			parser: 'babel'
		});
	} catch (e) {
		console.error('File generated:', filename, 'ERROR: ', e);
	}

	if (logOutResult) {
		console.log(`File result "${filename}":\n`, code);
	}

	return {
		code,
		map: compiled.map,
	};
}

