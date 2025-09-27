// Plugins
import { defineConfig } from 'vite';
import Crossedy from '@crossedy/unplugin-vue3';
import Vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools'

// Utilities
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
let config = {
	plugins: [
		Crossedy.vite(),
		Vue(),
		vueDevTools(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
		preserveSymlinks: true,
	},
	server: {
		host: '0.0.0.0',
		port: 3000
	}
};

export default defineConfig(config)
