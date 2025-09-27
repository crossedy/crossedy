import type { PRIMITIVE_SET_IMPLEMENT_VALUE_TAG } from '@crossedy/wrapper-common/types/contants';

export type PrimitiveImplementValueFn<T> = () => T;
export type PrimitiveSetImplementValueFn<T> = (value: PrimitiveImplementValueFn<T>) => void;

export interface PrimitiveSetImplementValue<T> {
	[PRIMITIVE_SET_IMPLEMENT_VALUE_TAG]: PrimitiveSetImplementValueFn<T>,
}
