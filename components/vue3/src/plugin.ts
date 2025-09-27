import { App, getCurrentInstance } from 'vue';
import { styleToObject } from '@crossedy/wrapper-vue3';

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$class: string;
		$style: Object;
		$bind: Object;
	}
}

export class CrossedyPlugin {
	install(app: App) {
		Object.defineProperty(app.config.globalProperties, '$class', {
			get() {
				const instance = getCurrentInstance();
				return instance?.proxy?.$attrs?.class as string ?? '';
			}
		});
		Object.defineProperty(app.config.globalProperties, '$style', {
			get() {
				const instance = getCurrentInstance();
				return styleToObject(instance?.proxy?.$attrs?.style || '');
			}
		});
		Object.defineProperty(app.config.globalProperties, '$bind', {
			get() {
				const instance = getCurrentInstance();
				const {  class: _class, _style,  ...$bind } = instance?.proxy?.$attrs ?? {};
				return $bind;
			}
		});
	}
}
