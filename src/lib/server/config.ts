import { env } from '$env/dynamic/private';
import { resolve } from 'path';

const DATA_DIR = env.DATA_DIR ?? '/data';

export const config = {
	databaseUrl: env.DATABASE_URL ?? resolve(DATA_DIR, 'db/minepanel.db'),
	dataDir: DATA_DIR,
	serversDir: resolve(DATA_DIR, 'servers'),
	backupsDir: resolve(DATA_DIR, 'backups'),
	mcRouterConfigDir: resolve(DATA_DIR, 'mc-router'),
	port: parseInt(env.PORT ?? '3000'),
	sidecarPort: parseInt(env.SIDECAR_PORT ?? '3001'),
	basePort: parseInt(env.BASE_PORT ?? '25565'),
	portBlockSize: parseInt(env.PORT_BLOCK_SIZE ?? '10'),
	dockerSocket: env.DOCKER_SOCKET ?? '/var/run/docker.sock'
} as const;
