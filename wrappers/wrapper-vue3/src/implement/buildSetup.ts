import { getCurrentInstance, ref, watch } from 'vue';
import {
	PRIMITIVE_COMPUTED_TAG,
	PRIMITIVE_INIT_TAG,
	PRIMITIVE_MAIN_TAG,
	type PRIMITIVE_MARKER,
	PRIMITIVE_PROP_TAG,
	PRIMITIVE_REF_TAG,
	PRIMITIVE_SET_IMPLEMENT_VALUE_TAG,
	PRIMITIVE_SET_INIT_TAG,
	type SetupFn,
	type SetupFnParam,
	styleToObject
} from '@crossedy/wrapper-common';


type PrimitiveVueSetupKeys<S> = {
	[K in keyof S]-?: S[K] extends { [PRIMITIVE_MAIN_TAG]: unknown } ? K : never
}[keyof S];
type MarkerKey = typeof PRIMITIVE_MARKER;
type UnwrapPrimitive<T> = MarkerKey extends keyof T ? T[MarkerKey] : T;
export type ReturnedFromSetup<S> = { [K in PrimitiveVueSetupKeys<S>]: UnwrapPrimitive<S[K]>; }
export type ReturnedFromSetupFn<SF extends SetupFn> = ReturnedFromSetup<ReturnType<SF>>;

function unPrimitive(value: any): any {
	if (value[PRIMITIVE_MAIN_TAG]) {
		return value.value;
	}
	return value;
}
function buildDeps(deps: any []): any[] {
	return deps.map(dep => {
		return unPrimitive(dep);
	})
}

export function buildSetup<SF extends SetupFn<S> = any, S extends SetupFnParam = SetupFnParam>(setupFn: SetupFn<S>): ReturnedFromSetupFn<SF> {
	try {
		const result: Record<string, any> = {};
		const instance = getCurrentInstance();
		const setup = setupFn({
			$class: () => instance?.proxy?.$attrs?.class as string ?? '',
			$style: () => styleToObject(instance?.proxy?.$attrs?.style || ''),
			$bind: () => {
				const {  class: _class, _style,  ...$bind } = instance?.proxy?.$attrs ?? {};
				return $bind;
			},
		});

		for (const [name, impl] of Object.entries(setup)) {
			if (impl[PRIMITIVE_PROP_TAG]) {
				impl[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG](() => instance?.props?.[name]);
			}
			if (impl[PRIMITIVE_REF_TAG]) {
				impl[PRIMITIVE_SET_INIT_TAG](() => {
					result[name] = ref(impl.defaultValue());
					impl[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG](() => result.value);
				});
			}
			if (impl[PRIMITIVE_COMPUTED_TAG]) {
				impl[PRIMITIVE_SET_INIT_TAG](() => {
					result[name] = ref(impl.compute());
					impl[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG](() => result[name].value);
					watch(buildDeps(impl.deps), () => {
						result[name].value = impl.compute();
					})
				});
			}
		}
		for (const impl of Object.values(setup)) {
			impl[PRIMITIVE_INIT_TAG]?.();
		}

		return result as unknown as ReturnedFromSetupFn<SF>;
	} catch (e) {
		console.error(e);
		throw e;
	}
}
