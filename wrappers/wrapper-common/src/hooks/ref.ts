import {
	type Primitive,
	PRIMITIVE_INIT_TAG,
	PRIMITIVE_MAIN_TAG,
	PRIMITIVE_REF_TAG,
	PRIMITIVE_SET_IMPLEMENT_VALUE_TAG,
	PRIMITIVE_SET_INIT_TAG,
	PRIMITIVE_SETUP_TAG,
	type PrimitiveImplementValueFn,
	type PrimitiveInit,
	type PrimitiveInitFn,
	type PrimitiveMarker,
	PrimitiveSetInitFn,
	type PrimitiveSetup
} from '@crossedy/wrapper-common/types';
import {NotImplementedError, NotInitializedError} from '@crossedy/wrapper-common/errors';

export interface PrimitiveRef<T> extends Primitive, PrimitiveSetup, PrimitiveInit, PrimitiveSetInitFn, PrimitiveMarker<T> {
	[PRIMITIVE_REF_TAG]: true,
	defaultValue: () => T;
	readonly value: T;
};

type PrimitiveRefCtor = new <T>(defaultValue: () => T) => PrimitiveRef<T>;

const PrimitiveRefImpl = function<T>(
	this: PrimitiveRef<T>,
	defaultValue: () => T,
) {
	this.defaultValue = defaultValue;

	let _implValue: PrimitiveImplementValueFn<T>|null = null;
	let _init: PrimitiveInitFn|null = null;
	let _isInit = false;
	Object.defineProperties(this, {
		[PRIMITIVE_REF_TAG]: { value: true, enumerable: false, writable: false },
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
				if (!_init) throw new NotInitializedError(`Ref")`);
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
				if (!_implValue) throw new NotImplementedError(`Ref")`);
				return _implValue();
			}
		}
	})

} as unknown as PrimitiveRefCtor;

export function ref<T = any>(defaultValue: () => T): PrimitiveRef<T> {
	return new PrimitiveRefImpl(defaultValue);
}
