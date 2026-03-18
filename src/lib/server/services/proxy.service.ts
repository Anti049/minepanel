import { writeFile, mkdir, readFile } from 'fs/promises';
import { resolve } from 'path';
import { config } from '../config.js';

interface RouteMapping {
	mappings: Record<string, string>;
}

const ROUTES_FILE = resolve(config.mcRouterConfigDir, 'routes.json');

export async function getRoutes(): Promise<RouteMapping> {
	try {
		const content = await readFile(ROUTES_FILE, 'utf-8');
		return JSON.parse(content);
	} catch {
		return { mappings: {} };
	}
}

export async function addRoute(hostname: string, backend: string): Promise<void> {
	const routes = await getRoutes();
	routes.mappings[hostname] = backend;
	await saveRoutes(routes);
}

export async function removeRoute(hostname: string): Promise<void> {
	const routes = await getRoutes();
	delete routes.mappings[hostname];
	await saveRoutes(routes);
}

async function saveRoutes(routes: RouteMapping): Promise<void> {
	await mkdir(config.mcRouterConfigDir, { recursive: true });
	await writeFile(ROUTES_FILE, JSON.stringify(routes, null, 2));
}
