import type { PRIMITIVE_INIT_TAG, PRIMITIVE_SET_INIT_TAG } from '@crossedy/wrapper-common/types/contants';

export type PrimitiveInitFn = () => void;
export type PrimitiveSetInitFn = (fn: PrimitiveInitFn) => void;

export interface PrimitiveInit {
	[PRIMITIVE_INIT_TAG]: PrimitiveInitFn;
	[PRIMITIVE_SET_INIT_TAG]: PrimitiveSetInitFn;
}
