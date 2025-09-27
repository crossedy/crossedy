import path from 'node:path';
import fs from 'node:fs/promises';
import { createUnplugin } from 'unplugin';
import { createFilter, type FilterPattern } from '@rollup/pluginutils';
import { compile, type CompileOption } from '@crossedy/compiler-angular';

export interface CdyVueUnpluginOptions extends Omit<CompileOption, 'filename'> {
	include?: FilterPattern; // défaut: voir logique par bundler ci-dessous
	exclude?: FilterPattern;
	sourceMap?: boolean;     // défaut: true
}

const VIRTUAL_PREFIX = '\0cdy:';

const Unplugin = createUnplugin<CdyVueUnpluginOptions | undefined>((userOptions, meta) => {
	const {
		include = /\.cdy\.vue$/,
		exclude,
		sourceMap = true,
		...compileOptions
	} = userOptions || {};
	const filter = createFilter(include, exclude);

	function normalizePath(id: string): string {
		return id.split(path.win32.sep).join(path.posix.sep);
	}

	function toAbsPosix(id: string, importer?: string) {
		const noQuery = id.split('?')[0];
		const abs = importer && !path.isAbsolute(noQuery)
			? path.resolve(path.dirname(importer), noQuery)
			: noQuery;
		return normalizePath(abs);
	};

	return {
		name: 'cdy-angular-plugin',
		enforce: 'pre',

		resolveId(id, importer) {
			const abs = toAbsPosix(id, importer);
			if (!filter(abs)) return null;
			if (abs.startsWith(VIRTUAL_PREFIX)) return abs;
			return VIRTUAL_PREFIX + abs
		},

		async load(id) {
			const isVirtual = id.startsWith(VIRTUAL_PREFIX);
			const original = isVirtual ? id.slice(VIRTUAL_PREFIX.length) : id;
			const abs = normalizePath(original);
			if (!filter(abs)) return null;

			this.addWatchFile?.(abs);

			const filename = path.basename(abs);
			const source = await fs.readFile(abs, 'utf8');
			const { code, map } = await compile(source, {
				...compileOptions,
				filename,
				sourceMap,
			});

			return {
				code,
				map: (map as any) ?? {mappings: ''},
			};
		},

		vite: {
			// 🛡️ Spécifique au dep-scan Vite: ne **pas** renvoyer d’ID virtuel
			// et externaliser pour empêcher esbuild d’essayer de lire "\0cdy:..."
			resolveId(id: string, importer: string | undefined, options: any) {
				const abs = toAbsPosix(id, importer);
				if (!filter(abs)) return null;

				if (options?.scan) {
					// Le scanner n’a pas besoin du contenu, juste de la graine de graphe.
					// On le marque externe pour qu’esbuild n’essaie pas d’ouvrir le chemin virtuel.
					return { id: abs, external: true };
				}

				// Hors scan, on retombe sur le flux normal (ID virtuel)
				if (abs.startsWith(VIRTUAL_PREFIX)) return abs;
				return VIRTUAL_PREFIX + abs;
			},

			handleHotUpdate(ctx: any) {
				// On ne s’intéresse qu’aux fichiers ciblés par le filtre
				const file = normalizePath(ctx.file);
				if (!filter(file)) return;

				// ID du module virtuel correspondant
				const virtualId = VIRTUAL_PREFIX + file;

				// Récupérer le module virtuel et l’invalider
				const mod = ctx.server.moduleGraph.getModuleById(virtualId);
				if (mod) {
					// Invalide pour forcer un reload/transform
					ctx.server.moduleGraph.invalidateModule(mod);
					// Retourner explicitement le module à recharger pour le HMR
					return [mod];
				}

				// Si non présent (p.ex. première importation tardive), rien de spécial
				return;
			},
		},
	};
});

export default Unplugin;

// Adapters
export const vite = Unplugin.vite;
export const rollup = Unplugin.rollup;
export const webpack = Unplugin.webpack;
export const esbuild = Unplugin.esbuild;
export const raw = Unplugin.raw;
export const farm = Unplugin.farm;
export const rspack = Unplugin.rspack;
export const rolldownd = Unplugin.rolldown;
