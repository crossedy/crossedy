#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const projectRoot = process.cwd();
const monorepoRoot = path.resolve(path.dirname(process.argv[1]), '../');
const modulesPath = path.resolve(projectRoot, 'node_modules/@crossedy')

async function main() {

	const modules = await fs.readdir(modulesPath);

	for (const m of modules) {
		const fullPath = path.resolve(modulesPath, m);

		let subProject;
		let subffixPath = '.';
		switch (m.split('-')[0]) {
			case 'compiler': subProject = 'compilers'; break;
			case 'unplugin': subProject = 'unplugin'; break;
			case 'wrapper': subProject = 'wrappers'; subffixPath = 'src'; break;
			default: subProject = 'components'; break;
		}
		try {
			await fs.unlink(fullPath);
		} catch (e) {
			await fs.rm(fullPath, { recursive: true });
		}
		const target = path.relative(modulesPath, path.resolve(monorepoRoot, subProject, m, subffixPath));
		await fs.symlink(target, fullPath, 'dir');
		console.log(`Link: ${target} => ${path.relative(projectRoot, fullPath)}`);
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});

