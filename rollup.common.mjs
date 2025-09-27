import path from 'node:path';
import fs from 'node:fs';
import { builtinModules } from 'node:module';
import typescript from '@rollup/plugin-typescript';

export async function common(options = {}) {

	const rootProject = options.rootProject ?? process.cwd();
	const preserveModules = options.preserveModules ?? true;
	const plugins = options.plugins ?? [];
	const pkgPath = options.pkgPath ?? path.resolve(rootProject, 'package.json');
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	let babel;
	if (options.umd) {
		babel = await import('@rollup/plugin-babel').then(m => m.default);
	}

	async function pluginOptional(name, options = {}) {
		try {
			return [ (await import(name).then(m => m.default))(options) ];
		} catch(e)  {
		}
		return []
	}

	const tsConfigPath = await pluginOptional('rollup-plugin-tsconfig-paths');
	const scssIgnore = await pluginOptional('rollup-plugin-scss', { output: false });

	const aliasPlugin = {
		name: 'tsc-aliases',
		async writeBundle(outputOptions) {
			try {
				if (!outputOptions?.dir) return;

				const { replaceTscAliasPaths } = await import('tsc-alias');
				await replaceTscAliasPaths({
					configFile: path.resolve(rootProject, 'tsconfig.json'),
					outDir: path.resolve(rootProject, outputOptions?.dir),
				});
			} catch (e) {
			}
		}
	};

	const nodeBuiltins = [
		...builtinModules.map(m => `node:${m}`),
	];
	const deps = [
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.peerDependencies || {})
	]

	const external = [
		...nodeBuiltins,
		...deps,
		...options.external ?? [],
	];

	async function buildCssEntry(input, name) {
		return {
			input,
			external,
			output: {
				file: 'dist/css/index.js',
				format: 'esm',
			},
			plugins: [
				...tsConfigPath,
				...(await pluginOptional('rollup-plugin-scss', {
					fileName: name,
					sourceMap: true,
					// processor: () => postcss([
					// 	autoprefixer()
					// ])
				})),
				...plugins,
				typescript({ tsconfig: './tsconfig.json', preserveSymlinks: true }),
				{ writeBundle() {
						fs.rmSync(path.resolve(rootProject, 'dist/css/index.js'));
					} },
			],
		}
	}

	return [
		// CJS
		{
			input: 'src/index.ts',
			external,
			output: [
				{
					dir: 'dist/cjs/',
					format: 'cjs',
					preserveModules,
					sourcemap: true,
					exports: "named",
					entryFileNames: '[name].cjs',
					chunkFileNames: '[name].cjs',
				},
			],
			plugins: [
				...tsConfigPath,
				...scssIgnore,
				...plugins,
				typescript({ tsconfig: './tsconfig.json', preserveSymlinks: true }),
			],
		},

		// ESM
		{
			input: 'src/index.ts',
			external: [
				external,
				/\.css$/,
				/\.scss$/,
			],
			output: [
				{
					dir: 'dist/esm',
					format: 'esm',
					preserveModules,
					sourcemap: true,
					entryFileNames: '[name].mjs',
					chunkFileNames: '[name].mjs',
				},
			],
			plugins: [
				...tsConfigPath,
				...scssIgnore,
				...plugins,
				typescript({ tsconfig: './tsconfig.json', preserveSymlinks: true }),
			],
		},

		// UMD
		...(options.umd ? [{
			input: 'src/index.ts',
			external,
			output: [
				{
					...options.umd.output,
					name: 'Crossedy',
					extend: true,
					format: 'umd',
					sourcemap: true,
				}
			],
			plugins: [
				...tsConfigPath,
				...scssIgnore,
				...plugins,
				typescript({ tsconfig: './tsconfig.json', preserveSymlinks: true }),
				babel({
					babelHelpers: 'bundled',
					exclude: 'node_modules/**',
				}),
			],
		}] : []),

		// CSS
		...(await Promise.all((options.css?.builds ?? []).map(async b =>
			await buildCssEntry(b.input, b.out),
		))),

		// Typing
		{
			input: 'src/index.ts',
			output: { dir: 'dist/types', format: 'esm' },
			plugins: [
				...tsConfigPath,
				...scssIgnore,
				...plugins,
				typescript({
					tsconfig: './tsconfig.json',
					preserveSymlinks: true,
					declaration: true,
					declarationMap: true,
					emitDeclarationOnly: true,
					declarationDir: 'dist/types',
					exclude: [ "" ]
				}),
				...tsConfigPath,
				aliasPlugin,
				{ writeBundle() {
						fs.rmSync(path.resolve(rootProject, 'dist/types/index.js'));
					} },
			],
			external,

		}
	]
}
