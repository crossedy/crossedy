import { forwardRef, RefObject, ReactElement, useRef, type ReactNode } from 'react';
import { type Flatten, styleToObject } from '@crossedy/wrapper-common';
import { _c } from '@crossedy/wrapper-react/implement/renderFunctions';

export type OmitParamIn<T> =  Omit<T, '$class'|'$style'|'$ref'>;
export type OmitParamOut<T> =  Omit<T, 'className'|'style'>;

export type CdyProps<T = {}> = Flatten<OmitParamOut<T> & { $class: string, $style: any, $ref?: RefObject<any> }>;
export type CdyPropsOut<T> = Flatten<OmitParamIn<T> & { className?: string|string[]|Record<string, boolean>, style?: string|any, ref?: RefObject<any>, children?: ReactNode }>;

export function wrapComponent<P>(componentFn: (params: P) => ReactElement<P>):
	(params: Flatten<CdyPropsOut<OmitParamIn<P>>>) => ReactElement<Flatten<CdyPropsOut<OmitParamIn<P>>>>
{
	const Component = forwardRef(function ({ className, style, ...rest }: any, forward) {
		const baseRef = useRef<HTMLElement>(undefined);
		const $ref = forward || baseRef;

		return componentFn({
			...rest,
			$ref,
			$class: _c(className) || '',
			$style: styleToObject(style),
		});
	});
	(Component as any).displayName = (componentFn as any).displayName || componentFn.name || '';
	return Component as any;
}
