import Dockerode from 'dockerode';
import type { WebSocket } from 'ws';
import type { WSMessage } from './types.js';

const DOCKER_SOCKET = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock';
const docker = new Dockerode({ socketPath: DOCKER_SOCKET });

const statsSubscribers = new Map<string, Set<WebSocket>>();
const statsIntervals = new Map<string, ReturnType<typeof setInterval>>();

const STATS_INTERVAL_MS = 2000;

function send(ws: WebSocket, msg: WSMessage) {
	try {
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify(msg));
		}
	} catch {
		// Client disconnected
	}
}

function formatBytes(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(1)} ${units[unit]}`;
}

export function subscribeToStats(serverId: string, ws: WebSocket) {
	if (!statsSubscribers.has(serverId)) {
		statsSubscribers.set(serverId, new Set());
	}
	statsSubscribers.get(serverId)!.add(ws);

	if (!statsIntervals.has(serverId)) {
		startStatsCollection(serverId);
	}
}

export function unsubscribeFromStats(serverId: string, ws: WebSocket) {
	const subs = statsSubscribers.get(serverId);
	if (!subs) return;
	subs.delete(ws);

	if (subs.size === 0) {
		statsSubscribers.delete(serverId);
		const interval = statsIntervals.get(serverId);
		if (interval) clearInterval(interval);
		statsIntervals.delete(serverId);
	}
}

export function unsubscribeAllStats(ws: WebSocket) {
	for (const [serverId, subs] of statsSubscribers) {
		if (subs.has(ws)) {
			unsubscribeFromStats(serverId, ws);
		}
	}
}

function startStatsCollection(serverId: string) {
	const interval = setInterval(async () => {
		const subs = statsSubscribers.get(serverId);
		if (!subs || subs.size === 0) {
			clearInterval(interval);
			statsIntervals.delete(serverId);
			return;
		}

		try {
			const container = docker.getContainer(`mc-${serverId}`);
			const stats = await container.stats({ stream: false });

			const cpuDelta =
				stats.cpu_stats.cpu_usage.total_usage -
				stats.precpu_stats.cpu_usage.total_usage;
			const systemDelta =
				stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
			const numCpus =
				stats.cpu_stats.online_cpus ??
				stats.cpu_stats.cpu_usage.percpu_usage?.length ??
				1;
			const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

			const memUsage = stats.memory_stats.usage ?? 0;
			const memLimit = stats.memory_stats.limit ?? 1;

			const msg: WSMessage = {
				type: 'stats_data',
				serverId,
				cpu: `${cpuPercent.toFixed(2)}%`,
				memory: formatBytes(memUsage),
				memoryLimit: formatBytes(memLimit)
			};

			for (const ws of subs) {
				send(ws, msg);
			}
		} catch {
			// Container may not be running — skip
		}
	}, STATS_INTERVAL_MS);

	statsIntervals.set(serverId, interval);
}
