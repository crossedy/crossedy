import type { Ctx } from './Ctx';

export type SetupFnParam = Record<string, any>;
export type SetupFn<T extends SetupFnParam = SetupFnParam> = (ctx: Ctx) => T;
