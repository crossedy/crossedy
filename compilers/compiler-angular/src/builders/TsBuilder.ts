import type { Builder } from '../Builder';

export class TsBuilder {

	constructor(
		private _builder: Builder,
	) {
	}

	public build(): string {
		return `
			import { inject, ElementRef } from '@angular/core';
			import { _c, _s } from '${this._builder.options.wrapperModulePath!.replace(/'/s, '/\\\'')}';

			export abstract class SdsComponent {

				public $elRoot = inject(ElementRef);
				public $class: string;
				public $style: any;
				public set $bind(_: any) {};
				public get $bind(): any {
					return {
						...this.$sds._$bindSpread,
						...this.$sds._$bindInputs,
						...this.getOverrideBind(),
					};
				};

				protected getOverrideBind(): any {
					return {};
				}

				$cdy: any;

				constructor() {
					const _ctx: any = this;
					this.$cdy = {
						_c,
						_s,
						_$bindSpread: {},
						_$bindInputs: {},
						${this._builder.cdyAppend}
					}
					this.$class = '';
					this.$style = {};
					Object.defineProperty(this.$elRoot.nativeElement, '__cdy__', {
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
