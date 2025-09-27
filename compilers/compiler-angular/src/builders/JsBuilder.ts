import type { Builder } from '../Builder';

export class JsBuilder {

	constructor(
		private _builder: Builder,
	) {
	}

	public build(): string {
		return `
			import { inject, ElementRef } from '@angular/core';
			import { _c, _s, _toStyleStr } from '${this._builder.options.wrapperModulePath!.replace(/'/s, '/\\\'')}';
			export class SdsComponent {

				$elRoot = inject(ElementRef);

				set $bind(_) {};
				get $bind() {
					return {
						...this.$sds._$bindSpread,
						...this.$sds._$bindInputs,
						...this.getOverrideBind(),
					};
				}

				getOverrideBind() {
					return {};
				}

				constructor() {
					const _ctx = this;
					this.$sds = {
						_c,
						_s,
						_toStyleStr,
						_$bindSpread: {},
						_$bindInputs: {},
						${this._builder.cdyAppend}
					}
					this.$class = '';
					this.$style = {};
					Object.defineProperty(this.$elRoot.nativeElement, '__sds__', {
						value: this,
						enumerable: false,
						writable: false,
						configurable: false
					});
				}
			}
		`;
	}
}
