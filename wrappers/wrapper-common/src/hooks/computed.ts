import {
	type Primitive,
	PRIMITIVE_COMPUTED_TAG,
	PRIMITIVE_INIT_TAG,
	PRIMITIVE_MAIN_TAG,
	PRIMITIVE_SET_IMPLEMENT_VALUE_TAG,
	PRIMITIVE_SET_INIT_TAG,
	PRIMITIVE_SETUP_TAG,
	type PrimitiveDeps,
	type PrimitiveImplementValueFn,
	type PrimitiveInit,
	type PrimitiveInitFn,
	type PrimitiveMarker,
	type PrimitiveSetImplementValue,
	type PrimitiveSetup
} from '@crossedy/wrapper-common/types';
import { NotImplementedError, NotInitializedError } from '@crossedy/wrapper-common/errors';

export interface PrimitiveComputed<T> extends Primitive, PrimitiveSetup, PrimitiveInit, PrimitiveSetImplementValue<T>, PrimitiveDeps, PrimitiveMarker<T> {
	[PRIMITIVE_COMPUTED_TAG]: true,
	compute: () => T;
	readonly value: T;
}
type PrimitiveComputedCtor = new <T>(compute: () => T, deps: any[]) => PrimitiveComputed<T>;

const PrimitiveComputedImpl = function<T>(
	this: PrimitiveComputed<T>,
	compute: () => T,
	deps: any[]
) {
	this.compute = compute;
	this.deps = deps;

	let _implValue: PrimitiveImplementValueFn<T>|null = null;
	let _init: PrimitiveInitFn|null = null;
	let _isInit = false;
	Object.defineProperties(this, {
		[PRIMITIVE_COMPUTED_TAG]: { value: true, enumerable: false, writable: false },
		[PRIMITIVE_MAIN_TAG]: { value: true, enumerable: false, writable: false },
		[PRIMITIVE_SETUP_TAG]: { value: true, enumerable: false, writable: false },
		[PRIMITIVE_SET_INIT_TAG]: {
			value(value: PrimitiveInitFn) {
				_init = value;
			},
			enumerable: false,
			writable: false
		},
		[PRIMITIVE_INIT_TAG]: {
			value() {
				if (!_init) throw new NotInitializedError(`Computed")`);
				if (!_isInit) {
					_isInit = true;
					_init();
				}
			},
			enumerable: false,
			writable: false
		},
		[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG]: {
			value(value: PrimitiveImplementValueFn<T>) {
				_implValue = value;
			},
			enumerable: false,
			writable: false
		},
		value: {
			get() {
				if (!_isInit) { this[PRIMITIVE_INIT_TAG]() }
				if (!_implValue) throw new NotImplementedError(`Computed")`);
				return _implValue();
			}
		}
	})

} as unknown as PrimitiveComputedCtor;

export function computed<T = any>(compute: () => T, deps: any[]): PrimitiveComputed<T> {
	return new PrimitiveComputedImpl(compute, deps);
}
