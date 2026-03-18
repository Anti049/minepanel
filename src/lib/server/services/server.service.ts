import { db } from '../db/index.js';
import { servers, backupConfigs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { generateDockerCompose } from '../docker/compose.js';
import { removeContainer, getContainerStatus } from '../docker/lifecycle.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { resolve } from 'path';
import type { Server, CreateServerInput, UpdateServerInput, ServerConfig } from '$types/server.js';

function getServerDir(serverId: string) {
	return resolve(config.serversDir, serverId);
}

export async function getAllServers(): Promise<Server[]> {
	const rows = await db.select().from(servers);
	return rows.map(rowToServer);
}

export async function getServerById(id: string): Promise<Server | null> {
	const rows = await db.select().from(servers).where(eq(servers.id, id));
	return rows.length > 0 ? rowToServer(rows[0]) : null;
}

export async function createServer(input: CreateServerInput): Promise<Server> {
	const now = new Date();
	const basePort = input.basePort ?? (await findAvailableBasePort());
	const edition = input.edition ?? 'JAVA';

	const serverConfig: Partial<ServerConfig> = {
		edition,
		serverType: (input.serverType ?? 'VANILLA') as ServerConfig['serverType'],
		version: input.version ?? 'latest',
		port: basePort,
		rconPort: basePort + 1,
		voiceChatPort: basePort + 2,
		enableRcon: true,
		rconPassword: generateRconPassword(),
		difficulty: 'normal',
		gamemode: 'survival',
		maxPlayers: 20,
		onlineMode: true,
		pvp: true,
		memoryMin: '2G',
		memoryMax: '4G',
		cpuLimit: '2',
		...input.config
	};

	const [row] = await db
		.insert(servers)
		.values({
			id: input.id,
			name: input.name,
			edition,
			serverType: input.serverType ?? 'VANILLA',
			version: input.version ?? 'latest',
			port: basePort,
			rconPort: basePort + 1,
			voiceChatPort: basePort + 2,
			memoryMin: serverConfig.memoryMin ?? '2G',
			memoryMax: serverConfig.memoryMax ?? '4G',
			cpuLimit: serverConfig.cpuLimit ?? '2',
			config: serverConfig,
			status: 'stopped',
			createdAt: now,
			updatedAt: now
		})
		.returning();

	const server = rowToServer(row);

	// Create server directory and docker-compose.yml
	const serverDir = getServerDir(server.id);
	await mkdir(resolve(serverDir, 'mc-data'), { recursive: true });
	await mkdir(resolve(serverDir, 'backups'), { recursive: true });
	await writeFile(resolve(serverDir, 'docker-compose.yml'), generateDockerCompose(server));

	return server;
}

export async function updateServer(id: string, input: UpdateServerInput): Promise<Server | null> {
	const existing = await getServerById(id);
	if (!existing) return null;

	const merged = {
		...(existing.config ?? {}),
		...(input.config ?? {})
	};

	const [row] = await db
		.update(servers)
		.set({
			...(input.name && { name: input.name }),
			...(input.serverType && { serverType: input.serverType }),
			...(input.version && { version: input.version }),
			...(input.memoryMin && { memoryMin: input.memoryMin }),
			...(input.memoryMax && { memoryMax: input.memoryMax }),
			...(input.cpuLimit && { cpuLimit: input.cpuLimit }),
			config: merged,
			updatedAt: new Date()
		})
		.where(eq(servers.id, id))
		.returning();

	const updated = rowToServer(row);

	// Regenerate docker-compose.yml
	const serverDir = getServerDir(id);
	await writeFile(resolve(serverDir, 'docker-compose.yml'), generateDockerCompose(updated));

	return updated;
}

export async function deleteServer(id: string): Promise<boolean> {
	const existing = await getServerById(id);
	if (!existing) return false;

	// Stop and remove Docker container
	try {
		await removeContainer(id);
	} catch {
		// Container may not exist, that's okay
	}

	// Delete from DB (cascade deletes backup config)
	await db.delete(backupConfigs).where(eq(backupConfigs.serverId, id));
	await db.delete(servers).where(eq(servers.id, id));

	// Remove server directory
	try {
		await rm(getServerDir(id), { recursive: true, force: true });
	} catch {
		// Directory may not exist
	}

	return true;
}

export async function refreshServerStatuses(): Promise<void> {
	const allServers = await getAllServers();
	await Promise.all(
		allServers.map(async (server) => {
			const status = await getContainerStatus(server.id);
			if (status !== server.status) {
				await db
					.update(servers)
					.set({ status, updatedAt: new Date() })
					.where(eq(servers.id, server.id));
			}
		})
	);
}

async function findAvailableBasePort(): Promise<number> {
	const allServers = await db.select({ port: servers.port }).from(servers);
	const usedPorts = new Set(allServers.map((s) => s.port));

	let candidate = config.basePort;
	while (usedPorts.has(candidate)) {
		candidate += config.portBlockSize;
	}
	return candidate;
}

function generateRconPassword(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 16; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToServer(row: any): Server {
	return {
		id: row.id,
		name: row.name,
		edition: row.edition,
		serverType: row.serverType,
		version: row.version,
		port: row.port,
		rconPort: row.rconPort,
		voiceChatPort: row.voiceChatPort,
		memoryMin: row.memoryMin ?? '2G',
		memoryMax: row.memoryMax ?? '4G',
		cpuLimit: row.cpuLimit ?? '2',
		config: row.config as ServerConfig | null,
		status: row.status ?? 'stopped',
		createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt * 1000),
		updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt * 1000)
	};
}
