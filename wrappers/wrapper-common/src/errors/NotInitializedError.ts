export class NotInitializedError extends Error {
	constructor(what: string) { super(`${what} not initialized`); }
}
