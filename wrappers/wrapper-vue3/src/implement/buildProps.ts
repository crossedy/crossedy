import type { Prop } from 'vue';
import { type PRIMITIVE_MARKER, PRIMITIVE_PROP_TAG, type SetupFn, type SetupFnParam } from '@crossedy/wrapper-common';

type PrimitivePropKeys<S> = {
	[K in keyof S]-?: S[K] extends { [PRIMITIVE_PROP_TAG]: unknown } ? K : never
}[keyof S];
type MarkerKey = typeof PRIMITIVE_MARKER;
type UnwrapPrimitive<T> = MarkerKey extends keyof T ? T[MarkerKey] : T;
export type PropsFromSetup<S> = { [K in PrimitivePropKeys<S>]: Prop<UnwrapPrimitive<S[K]>>; }
export type PropsFromSetupFn<SF extends SetupFn> = PropsFromSetup<ReturnType<SF>>;

export function buildProps<S extends SetupFnParam = SetupFnParam, SF extends SetupFn<S> = any>(setup: SF): PropsFromSetupFn<SF> {
	try {
		const props: Record<string, Prop<any>> = {};
		for (const [name, imp] of Object.entries(setup({
				$class: () => '',
				$style: () => ({}),
				$bind: () => ({}),
			}))) {
			if (imp[PRIMITIVE_PROP_TAG]) {
				props[name] = imp.options; // TODO Check generated default
			}
		}

		return props as unknown as PropsFromSetupFn<SF>;
	} catch (e) {
		console.error(e);
		throw e;
	}
}
