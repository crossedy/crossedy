export class NotImplementedError extends Error {
	constructor(what: string) { super(`${what} not implemented`); }
}
