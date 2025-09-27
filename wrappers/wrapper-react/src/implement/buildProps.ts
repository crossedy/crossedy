import {
	type Flatten,
	type PRIMITIVE_MARKER,
	PRIMITIVE_PROP_TAG,
	type SetupFn,
	type UndefinedToOptional
} from '@crossedy/wrapper-common';
import type { CdyPropsOut } from '@crossedy/wrapper-react/implement/wrapComponent';

type PrimitivePropKeys<S> = {
	[K in keyof S]-?: S[K] extends { [PRIMITIVE_PROP_TAG]: unknown } ? K : never
}[keyof S];

type MarkerKey = typeof PRIMITIVE_MARKER;
type UnwrapPrimitive<T> = MarkerKey extends keyof T ? T[MarkerKey] : T;

export type MinimalPropsFromSetup<S> = Flatten<UndefinedToOptional<{ [K in PrimitivePropKeys<S>]: UnwrapPrimitive<S[K]>; }>>;

export type PropsFromSetup<S, E = {}> = Flatten<CdyPropsOut<MinimalPropsFromSetup<S>>> & Omit<E, 'className'|'style'|'children'>;
export type PropsFromSetupFn<SF extends SetupFn, E = {}> = Flatten<PropsFromSetup<ReturnType<SF>, E>>;


export function buildProps<P extends Object = {}>(props: P, setup: SetupFn): P {
	try {
		const { children, ...$bind } = props as any;
		const final: any = {
			children,
			$bind,
		}
		for (const [ name, value ] of Object.entries(final.$bind)) {
			if (name.startsWith('$')) {
				final[name] = value;
				delete final.$bind[name];
			}
		}
		for (const [name, imp] of Object.entries(setup({
			$class: () => '',
			$style: () => ({}),
			$bind: () => ({}),
		})) as [ keyof typeof props, any ][]) {
			if (imp[PRIMITIVE_PROP_TAG]) {
				final[name] = props[name];
				delete final.$bind[name];
				if (typeof final[name] === 'undefined' && imp.options.default) {
					final[name] = imp.options.default();
				}
				// TODO warn if bad Type
				// TODO warn if undefined and required
			}
		}

		return final;
	} catch (e) {
		console.error(e);
		throw e;
	}
}
