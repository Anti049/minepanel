import { WebSocketServer } from 'ws';
import Dockerode from 'dockerode';
import {
	subscribeToLogs,
	unsubscribeFromLogs,
	unsubscribeAll
} from './log-streamer.js';
import {
	subscribeToStats,
	unsubscribeFromStats,
	unsubscribeAllStats
} from './stats-collector.js';
import type { WSMessage } from './types.js';

const PORT = parseInt(process.env.SIDECAR_PORT ?? '3001');
const DOCKER_SOCKET = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock';

const docker = new Dockerode({ socketPath: DOCKER_SOCKET });

const wss = new WebSocketServer({ port: PORT });

console.log(`[Sidecar] WebSocket server listening on port ${PORT}`);

wss.on('connection', (ws) => {
	console.log('[Sidecar] Client connected');

	ws.on('message', (rawData) => {
		try {
			const msg: WSMessage = JSON.parse(rawData.toString());

			switch (msg.type) {
				case 'subscribe_logs':
					subscribeToLogs(msg.serverId, ws);
					break;
				case 'unsubscribe_logs':
					unsubscribeFromLogs(msg.serverId, ws);
					break;
				case 'subscribe_stats':
					subscribeToStats(msg.serverId, ws);
					break;
				case 'unsubscribe_stats':
					unsubscribeFromStats(msg.serverId, ws);
					break;
				default:
					ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
			}
		} catch {
			ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON message' }));
		}
	});

	ws.on('close', () => {
		console.log('[Sidecar] Client disconnected');
		unsubscribeAll(ws);
		unsubscribeAllStats(ws);
	});

	ws.on('error', (err) => {
		console.error('[Sidecar] WebSocket error:', err);
	});
});

// Listen to Docker events to emit server_event messages
async function watchDockerEvents() {
	try {
		const events = await docker.getEvents({
			filters: { label: ['minepanel.managed=true'] }
		});

		// @ts-expect-error - events is a stream
		events.on('data', (chunk: Buffer) => {
			try {
				const event = JSON.parse(chunk.toString());
				const serverId = event.Actor?.Attributes?.['minepanel.server-id'];
				if (!serverId) return;

				type EventType = 'started' | 'stopped' | 'died' | 'created' | 'destroyed';
				const eventMap: Record<string, EventType> = {
					start: 'started',
					stop: 'stopped',
					die: 'died',
					create: 'created',
					destroy: 'destroyed'
				};

				const mappedEvent = eventMap[event.Action];
				if (!mappedEvent) return;

				const msg: WSMessage = {
					type: 'server_event',
					serverId,
					event: mappedEvent
				};

				// Broadcast to all connected clients
				wss.clients.forEach((client) => {
					if (client.readyState === client.OPEN) {
						client.send(JSON.stringify(msg));
					}
				});
			} catch {
				// Ignore parse errors
			}
		});

		// @ts-expect-error - events is a stream
		events.on('error', (err: Error) => {
			console.error('[Sidecar] Docker events error:', err);
			setTimeout(watchDockerEvents, 5000);
		});
	} catch (err) {
		console.error('[Sidecar] Failed to connect to Docker events:', err);
		setTimeout(watchDockerEvents, 5000);
	}
}

watchDockerEvents();
