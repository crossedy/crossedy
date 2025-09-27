import { common } from './.rollup.common.mjs';

export default common({
	umd: {
		output: {
			file: 'dist/umd/crossedy.wrapper-react.js',
			globals: {
				'react': 'React',
				'react-dom': 'ReactDOM',
				'@crossedy/wrapper-common': 'Crossedy',
			}
		}
	},
});
