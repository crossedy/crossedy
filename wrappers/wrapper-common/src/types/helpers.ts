/** Flat type for Ide */
export type Flatten<T> = { [K in keyof T]: T[K] } & {}

/** Tranform { key: undefined|T } to { key?: T } */
export type UndefinedToOptional<T> =
	{ [K in keyof T as undefined extends T[K] ? never : K]: T[K] } &
	{ [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined> };

