import {
	type Ctx,
	PRIMITIVE_COMPUTED_TAG,
	PRIMITIVE_INIT_TAG,
	PRIMITIVE_MAIN_TAG,
	type PRIMITIVE_MARKER,
	PRIMITIVE_PROP_TAG,
	PRIMITIVE_REF_TAG,
	PRIMITIVE_SET_IMPLEMENT_VALUE_TAG,
	PRIMITIVE_SET_INIT_TAG,
	type PRIMITIVE_SETUP_TAG,
	type SetupFn,
	type SetupFnParam
} from '@crossedy/wrapper-common';
import type { CdyProps } from '@crossedy/wrapper-react/implement/wrapComponent';
import { useEffect, useMemo, useState } from 'react';


type PrimitiveVueSetupKeys<S> = {
	[K in keyof S]-?: S[K] extends { [PRIMITIVE_SETUP_TAG]: unknown } ? K : never
}[keyof S];

type MarkerKey = typeof PRIMITIVE_MARKER;
type UnwrapPrimitive<T> = MarkerKey extends keyof T ? T[MarkerKey] : T;

export type ReturnFromSetup<S> = { [K in PrimitiveVueSetupKeys<S>]: UnwrapPrimitive<S[K]>; }
export type ReturnFromSetupFn<SF extends SetupFn> = ReturnFromSetup<ReturnType<SF>>;


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

//TODO PropsFromSetup
export function buildSetup<S extends SetupFnParam = SetupFnParam, SF extends SetupFn<S> = any>(props: CdyProps, setupFn: SF): ReturnFromSetupFn<SF> {
	try {
		const result: Record<string, any> = {};

		const { $class, $style, ...$bind } = props; // TODO Etract bind of props

		const [ { ctxVal, setup } ] = useState(() => {
			const ctxVal = {
				$class,
				$style,
				$bind,
			};
			const ctx: Ctx = {
				$class: () => ctxVal.$class,
				$style: () => ctxVal.$style,
				$bind: () => ctxVal.$bind,
			}
			return {
				setup: setupFn(ctx),
				ctxVal,
			};
		});
		ctxVal.$class = $class;
		ctxVal.$style = $style;
		ctxVal.$bind = $bind;

		result['children'] = (props as any)['children'];

		let data: any = {};
		let setData = (name: string, value: any) => data = {
			...data,
			[name]: value,
		};
		const effects: { cb: () => void, deps: any[] }[] = [];

		const memosData: any = {};
		const memos: { name: string, cb: () => any, deps: any[] }[] = [];

		for (const [ name, impl ] of Object.entries(setup)) {
			((name, impl) => {

				if (impl[PRIMITIVE_PROP_TAG]) {
					impl[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG](() => props[name as keyof typeof props]);
					result[name] = props[name as keyof typeof props];
				}
				if (impl[PRIMITIVE_COMPUTED_TAG]) {
					memos.push({
						name,
						cb: impl.compute,
						deps: impl.deps,
					});
				}
			}) (name, impl);
		}
		let isFirst = false;
		const state = useState(() => {
			isFirst = true;
			for (const [ name, impl ] of Object.entries(setup)) {
				((name, impl) => {
					if (impl[PRIMITIVE_REF_TAG]) {
						setData(name, null);
						impl[PRIMITIVE_SET_INIT_TAG](() => {
							setData(name, impl.defaultValue())
							Object.defineProperty(result, name, {
								get() {
									return data[name];
								},
								set(value: any) {
									setData(name, value)
								}
							})
							impl[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG](() => data[name]);
						});
					}
					if (impl[PRIMITIVE_COMPUTED_TAG]) {
						impl[PRIMITIVE_SET_INIT_TAG](() => {
							memosData[name] = impl.compute();
							impl[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG](() => memosData[name]);
						});
					}
				}) (name, impl);
			}

			for (const impl of Object.values(setup)) {
				impl[PRIMITIVE_INIT_TAG]?.();
			}

			return data;
		});
		data = state[0];
		setData = (name: string, value: any) => {
			state[1]((data: any) => ({
				...data,
				[name]: value,
			}));
		};

		for (const memo of memos) {
			result[memo.name] = useMemo(() => {
				if (!isFirst) {
					memosData[memo.name] = memo.cb();
				}
				return memosData[memo.name];
			}, buildDeps(memo.deps));
		}
		for (const effect of effects) {
			useEffect(effect.cb, buildDeps(effect.deps));
		}

		return result as unknown as ReturnFromSetupFn<SF>;

	} catch (e) {
		console.error(e);
		throw e;
	}
}
