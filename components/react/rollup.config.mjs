import { globSync } from 'node:fs';
import { basename } from 'node:path';
import { common } from './.rollup.common.mjs';
import Crossedy from '@crossedy/unplugin-react';

const components = globSync('src/common/components/*');

console.log();

export default common({
	umd: {
		output: {
			file: 'dist/umd/crossedy.react.js',
			globals: {
				'react': 'React',
				'react-dom': 'ReactDOM',
				'@crossedy/wrapper-common': 'Crossedy',
				'@crossedy/wrapper-react': 'Crossedy',
			}
		}
	},
	plugins: [
		Crossedy.rollup()
	],
	css: {
		builds: [
			{ input: 'src/umd.ts', out: 'crossedy.react.css' },
			{ input: 'src/style.ts', out: 'main.css' },
			...components.map(c => (
				{ input: `${c}/${basename(c)}.scss`, out: `components/${basename(c)}.css` }
			)),
		]
	}
});
