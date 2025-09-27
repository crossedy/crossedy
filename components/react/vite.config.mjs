import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Crossedy from '@crossedy/unplugin-react';

// Utilities
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		Crossedy.vite({
			logOutResult: true
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
		preserveSymlinks: true,
	},
	server: {
		host: '0.0.0.0',
		port: 3001
	}
})
