import type { WSMessage } from '$types/server';

type MessageHandler = (msg: WSMessage) => void;

let ws = $state<WebSocket | null>(null);
let connected = $state(false);
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const handlers = new Set<MessageHandler>();

export function getWebSocket() {
	return {
		get connected() {
			return connected;
		},
		get ws() {
			return ws;
		}
	};
}

export function connectWebSocket(sidecarPort = 3001): void {
	if (ws && ws.readyState === WebSocket.OPEN) return;

	const url = `ws://${window.location.hostname}:${sidecarPort}`;

	ws = new WebSocket(url);

	ws.onopen = () => {
		connected = true;
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
	};

	ws.onclose = () => {
		connected = false;
		ws = null;
		// Auto-reconnect after 3 seconds
		reconnectTimer = setTimeout(() => {
			connectWebSocket(sidecarPort);
		}, 3000);
	};

	ws.onerror = () => {
		connected = false;
	};

	ws.onmessage = (event) => {
		try {
			const msg: WSMessage = JSON.parse(event.data);
			handlers.forEach((h) => h(msg));
		} catch {
			// Ignore malformed messages
		}
	};
}

export function disconnectWebSocket(): void {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	ws?.close();
	ws = null;
	connected = false;
}

export function addMessageHandler(handler: MessageHandler): () => void {
	handlers.add(handler);
	return () => handlers.delete(handler);
}

export function sendMessage(msg: WSMessage): void {
	if (ws?.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(msg));
	}
}

export function subscribeToLogs(serverId: string): void {
	sendMessage({ type: 'subscribe_logs', serverId });
}

export function unsubscribeFromLogs(serverId: string): void {
	sendMessage({ type: 'unsubscribe_logs', serverId });
}

export function subscribeToStats(serverId: string): void {
	sendMessage({ type: 'subscribe_stats', serverId });
}

export function unsubscribeFromStats(serverId: string): void {
	sendMessage({ type: 'unsubscribe_stats', serverId });
}
