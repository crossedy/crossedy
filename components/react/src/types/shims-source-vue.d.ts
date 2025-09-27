declare module '*.cdy.vue' {
	import { ReactElement } from 'react';
	const render: <P = any>(param: any) => ReactElement<P & { $class: string, $style: any }>;
	export default render;
}
