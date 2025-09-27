import {
	type Primitive,
	PRIMITIVE_MAIN_TAG,
	PRIMITIVE_PROP_TAG,
	PRIMITIVE_SET_IMPLEMENT_VALUE_TAG,
	type PrimitiveImplementValueFn,
	type PrimitiveInitFn,
	type PrimitiveMarker,
	type PrimitiveSetImplementValue
} from '@crossedy/wrapper-common/types';
import { NotImplementedError } from '@crossedy/wrapper-common/errors';

export interface PropOptions<T = any> {
	type?: any,
	default?: () => T
}

export interface PrimitiveProp<T> extends Primitive, PrimitiveSetImplementValue<T>, PrimitiveMarker<T> {
	[PRIMITIVE_PROP_TAG]: true,
	options: PropOptions<T> & { required: boolean };
	readonly value: T;
}

type PrimitivePropCtor = new <T>(options: PropOptions<T>, required?: boolean) => PrimitiveProp<T>;

const PrimitivePropImpl = function<T>(
	this: PrimitiveProp<T>,
	options: PropOptions<T>,
	required: boolean = false,
) {
	this.options = { ...options, required };

	let _implValue: PrimitiveImplementValueFn<T>|null = null;
	Object.defineProperties(this, {
		[PRIMITIVE_PROP_TAG]: { value: true, enumerable: false, writable: false },
		[PRIMITIVE_MAIN_TAG]: { value: true, enumerable: false, writable: false },
		[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG]: {
			value(value: PrimitiveImplementValueFn<T>) {
				_implValue = value;
			},
			enumerable: false,
			writable: false
		},
		value: {
			get() {
				if (!_implValue) throw new NotImplementedError(`Prop")`);
				return _implValue();
			}
		}
	})

} as unknown as PrimitivePropCtor;

export function prop<T = any>(options: PropOptions<T> = {}): PrimitiveProp<T|undefined> {
	return new PrimitivePropImpl<T|undefined>(options);
}
export function propR<T = any>(options: PropOptions<T> = {}): PrimitiveProp<T> {
	return new PrimitivePropImpl(options, true);
}
