import type { PRIMITIVE_MARKER } from '@crossedy/wrapper-common/types/contants';

export interface PrimitiveMarker<T> {
	/** phantom */ [PRIMITIVE_MARKER]: T
}
