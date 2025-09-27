import { createApp } from 'vue';
import App from './App.vue';
import { CrossedyPlugin } from './index';

import './style';

const app = createApp(App)
	.use(new CrossedyPlugin())
;


app.config.errorHandler = (err, instance, info) => {
	console.error('Vue render error:', err, '\nInfo:', info, '\nInstance:', instance);
	debugger; // met en pause dans DevTools au moment de l’erreur
}

app.config.warnHandler = (msg, instance, trace) => {
	console.warn('Vue warn:', msg, '\nTrace:', trace);
}

app.mount('#app');
