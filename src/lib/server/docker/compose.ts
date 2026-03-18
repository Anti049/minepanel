import yaml from 'js-yaml';
import type { Server } from '$types/server.js';
import type { DockerComposeFile, DockerComposeService } from '$types/docker.js';

const MINECRAFT_NETWORK = 'minepanel-net';

export function generateDockerCompose(server: Server): string {
	const config = server.config;

	const env: Record<string, string | number | boolean> = {
		EULA: 'TRUE',
		TYPE: server.serverType,
		VERSION: server.version,
		MEMORY: server.memoryMax,
		INIT_MEMORY: server.memoryMin,
		SERVER_NAME: server.name
	};

	if (config) {
		if (config.difficulty) env['DIFFICULTY'] = config.difficulty;
		if (config.gamemode) env['MODE'] = config.gamemode;
		if (config.maxPlayers) env['MAX_PLAYERS'] = config.maxPlayers;
		if (config.viewDistance) env['VIEW_DISTANCE'] = config.viewDistance;
		if (config.simulationDistance) env['SIMULATION_DISTANCE'] = config.simulationDistance;
		if (config.onlineMode !== undefined) env['ONLINE_MODE'] = config.onlineMode;
		if (config.whitelist !== undefined) env['ENABLE_WHITELIST'] = config.whitelist;
		if (config.pvp !== undefined) env['PVP'] = config.pvp;
		if (config.motd) env['MOTD'] = config.motd;
		if (config.levelName) env['LEVEL'] = config.levelName;
		if (config.levelSeed) env['SEED'] = config.levelSeed;
		if (config.spawnProtection !== undefined)
			env['SPAWN_PROTECTION'] = config.spawnProtection;
		if (config.enableCommandBlock !== undefined)
			env['ENABLE_COMMAND_BLOCK'] = config.enableCommandBlock;

		if (config.enableRcon) {
			env['ENABLE_RCON'] = 'true';
			env['RCON_PORT'] = server.rconPort ?? server.port + 1;
			env['RCON_PASSWORD'] = config.rconPassword || 'changeme';
		}

		// Extra env vars
		if (config.extraEnv) {
			Object.assign(env, config.extraEnv);
		}
	}

	const ports: string[] = [`${server.port}:25565/tcp`];
	if (server.rconPort && config?.enableRcon) {
		ports.push(`${server.rconPort}:${server.rconPort}/tcp`);
	}
	if (server.voiceChatPort) {
		ports.push(`${server.voiceChatPort}:${server.voiceChatPort}/udp`);
	}

	const image =
		server.edition === 'BEDROCK'
			? 'itzg/minecraft-bedrock-server:latest'
			: 'itzg/minecraft-server:latest';

	const mainService: DockerComposeService = {
		image,
		container_name: `mc-${server.id}`,
		restart: 'unless-stopped',
		environment: env,
		ports,
		volumes: [`./mc-data:/data`],
		networks: [MINECRAFT_NETWORK],
		mem_limit: server.memoryMax,
		cpus: parseFloat(server.cpuLimit),
		labels: {
			'minepanel.managed': 'true',
			'minepanel.server-id': server.id,
			'minepanel.server-name': server.name
		}
	};

	const compose: DockerComposeFile = {
		services: {
			minecraft: mainService
		},
		networks: {
			[MINECRAFT_NETWORK]: {
				external: true
			}
		}
	};

	// Add backup sidecar if enabled
	// (backup config is handled separately in server.service.ts)

	return yaml.dump(compose, { lineWidth: 120, noRefs: true });
}
