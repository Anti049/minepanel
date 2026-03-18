import Dockerode from 'dockerode';
import type { WebSocket } from 'ws';
import type { WSMessage } from './types.js';

const DOCKER_SOCKET = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock';
const docker = new Dockerode({ socketPath: DOCKER_SOCKET });

// Map of serverId → Set of subscribed WebSocket clients
const logSubscribers = new Map<string, Set<WebSocket>>();

// Map of serverId → cleanup function
const activeStreams = new Map<string, () => void>();

function send(ws: WebSocket, msg: WSMessage) {
	try {
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify(msg));
		}
	} catch {
		// Client disconnected
	}
}

export function subscribeToLogs(serverId: string, ws: WebSocket) {
	if (!logSubscribers.has(serverId)) {
		logSubscribers.set(serverId, new Set());
	}
	logSubscribers.get(serverId)!.add(ws);

	// Start streaming if not already active
	if (!activeStreams.has(serverId)) {
		startLogStream(serverId);
	}
}

export function unsubscribeFromLogs(serverId: string, ws: WebSocket) {
	const subs = logSubscribers.get(serverId);
	if (!subs) return;
	subs.delete(ws);

	// Stop stream if no more subscribers
	if (subs.size === 0) {
		logSubscribers.delete(serverId);
		const cleanup = activeStreams.get(serverId);
		cleanup?.();
		activeStreams.delete(serverId);
	}
}

export function unsubscribeAll(ws: WebSocket) {
	for (const [serverId, subs] of logSubscribers) {
		if (subs.has(ws)) {
			unsubscribeFromLogs(serverId, ws);
		}
	}
}

async function startLogStream(serverId: string) {
	const containerName = `mc-${serverId}`;

	try {
		const container = docker.getContainer(containerName);
		const stream = await container.logs({
			follow: true,
			stdout: true,
			stderr: true,
			timestamps: false,
			tail: 100
		});

		let destroyed = false;

		activeStreams.set(serverId, () => {
			destroyed = true;
			// @ts-expect-error - stream is a Duplex
			stream.destroy?.();
		});

		// @ts-expect-error - stream is a Duplex
		stream.on('data', (chunk: Buffer) => {
			if (destroyed) return;

			const subs = logSubscribers.get(serverId);
			if (!subs || subs.size === 0) return;

			// Docker log stream header: 8 bytes (stream type + size)
			// Strip the Docker multiplexing header
			let offset = 0;
			while (offset < chunk.length) {
				if (chunk.length - offset < 8) break;
				const size = chunk.readUInt32BE(offset + 4);
				offset += 8;
				const line = chunk.slice(offset, offset + size).toString('utf-8').trim();
				offset += size;

				if (line) {
					const msg: WSMessage = {
						type: 'log_data',
						serverId,
						data: line,
						timestamp: new Date().toISOString()
					};
					for (const ws of subs) {
						send(ws, msg);
					}
				}
			}
		});

		// @ts-expect-error - stream is a Duplex
		stream.on('end', () => {
			activeStreams.delete(serverId);
		});

		// @ts-expect-error - stream is a Duplex
		stream.on('error', () => {
			activeStreams.delete(serverId);
		});
	} catch (err) {
		console.error(`[LogStreamer] Failed to start stream for ${containerName}:`, err);
		activeStreams.delete(serverId);

		// Notify subscribers of the error
		const subs = logSubscribers.get(serverId);
		if (subs) {
			for (const ws of subs) {
				send(ws, { type: 'error', message: `Failed to connect to server logs: ${serverId}` });
			}
		}
	}
}
