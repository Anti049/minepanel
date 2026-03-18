import { getDockerClient } from './client.js';
import type { ContainerStats } from '$types/docker.js';

export async function getContainerStats(serverId: string): Promise<ContainerStats | null> {
	const docker = getDockerClient();
	const name = `mc-${serverId}`;

	try {
		const container = docker.getContainer(name);
		const stats = await container.stats({ stream: false });

		const cpuDelta =
			stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
		const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
		const numCpus = stats.cpu_stats.online_cpus ?? stats.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;
		const cpuPercent = (cpuDelta / systemDelta) * numCpus * 100;

		const memoryUsage = stats.memory_stats.usage ?? 0;
		const memoryLimit = stats.memory_stats.limit ?? 1;
		const memoryPercent = (memoryUsage / memoryLimit) * 100;

		const networkStats = stats.networks
			? Object.values(stats.networks).reduce(
					(acc, net) => {
						acc.rx += net.rx_bytes ?? 0;
						acc.tx += net.tx_bytes ?? 0;
						return acc;
					},
					{ rx: 0, tx: 0 }
				)
			: { rx: 0, tx: 0 };

		return {
			cpuPercent: Math.round(cpuPercent * 100) / 100,
			memoryUsage,
			memoryLimit,
			memoryPercent: Math.round(memoryPercent * 100) / 100,
			networkRx: networkStats.rx,
			networkTx: networkStats.tx
		};
	} catch {
		return null;
	}
}

export function formatBytes(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(1)} ${units[unit]}`;
}
