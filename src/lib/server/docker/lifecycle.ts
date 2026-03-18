import { getDockerClient } from './client.js';
import { db } from '../db/index.js';
import { servers } from '../db/schema.js';
import { eq } from 'drizzle-orm';

function containerName(serverId: string) {
	return `mc-${serverId}`;
}

export async function startServer(serverId: string): Promise<void> {
	const docker = getDockerClient();
	const name = containerName(serverId);

	await db
		.update(servers)
		.set({ status: 'starting', updatedAt: new Date() })
		.where(eq(servers.id, serverId));

	try {
		const container = docker.getContainer(name);
		const info = await container.inspect();
		if (info.State.Running) return;
		await container.start();
	} catch (err: unknown) {
		const error = err as { statusCode?: number };
		if (error.statusCode === 404) {
			throw new Error(`Container ${name} not found. Did you create the server?`);
		}
		throw err;
	}
}

export async function stopServer(serverId: string): Promise<void> {
	const docker = getDockerClient();
	const name = containerName(serverId);

	await db
		.update(servers)
		.set({ status: 'stopping', updatedAt: new Date() })
		.where(eq(servers.id, serverId));

	try {
		const container = docker.getContainer(name);
		await container.stop({ t: 30 });
	} catch (err: unknown) {
		const error = err as { statusCode?: number; reason?: string };
		if (error.statusCode === 404 || error.reason === 'container already stopped') {
			// Already stopped, update status
			await db
				.update(servers)
				.set({ status: 'stopped', updatedAt: new Date() })
				.where(eq(servers.id, serverId));
			return;
		}
		throw err;
	}
}

export async function restartServer(serverId: string): Promise<void> {
	const docker = getDockerClient();
	const name = containerName(serverId);

	try {
		const container = docker.getContainer(name);
		await container.restart({ t: 30 });
	} catch (err: unknown) {
		const error = err as { statusCode?: number };
		if (error.statusCode === 404) {
			// Not running, just start it
			await startServer(serverId);
		} else {
			throw err;
		}
	}
}

export async function removeContainer(serverId: string): Promise<void> {
	const docker = getDockerClient();
	const name = containerName(serverId);

	try {
		const container = docker.getContainer(name);
		const info = await container.inspect();
		if (info.State.Running) {
			await container.stop({ t: 10 });
		}
		await container.remove();
	} catch (err: unknown) {
		const error = err as { statusCode?: number };
		if (error.statusCode === 404) {
			// Already removed, that's fine
			return;
		}
		throw err;
	}
}

export async function getContainerStatus(
	serverId: string
): Promise<'running' | 'stopped' | 'starting' | 'stopping' | 'error'> {
	const docker = getDockerClient();
	const name = containerName(serverId);

	try {
		const container = docker.getContainer(name);
		const info = await container.inspect();
		const state = info.State;

		if (state.Running) return 'running';
		if (state.Paused) return 'stopped';
		if (state.Restarting) return 'starting';
		if (state.Dead || state.OOMKilled) return 'error';
		return 'stopped';
	} catch (err: unknown) {
		const error = err as { statusCode?: number };
		if (error.statusCode === 404) return 'stopped';
		throw err;
	}
}
