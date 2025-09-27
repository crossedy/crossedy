import { defineComponent as vueDefineComponent, type DefineComponent } from 'vue';
import { buildProps, type PropsFromSetup } from '@crossedy/wrapper-vue3/implement/buildProps';
import { buildSetup, type VueSetupFromSetup } from '@crossedy/wrapper-vue3/implement/buildSetup';
import { SetupFn, type SetupFnParam } from '@crossedy/wrapper-common';

export function defineComponent<S extends SetupFnParam = SetupFnParam, SF extends SetupFn<S> = any>(
	setupFn: SF<S>,
	render: Function,
): DefineComponent<PropsFromSetupFn<SF>, VueSetupFromSetupFn<SF>> {
	return vueDefineComponent({
		props: buildProps(setupFn),
		setup() {
			return buildSetup(setupFn);
		},
		render,
	}) as any;
}
