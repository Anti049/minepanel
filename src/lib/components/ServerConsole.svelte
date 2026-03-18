<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		connectWebSocket,
		subscribeToLogs,
		unsubscribeFromLogs,
		addMessageHandler,
		sendMessage,
		getWebSocket
	} from '$stores/websocket.svelte';
	import Button from './ui/Button.svelte';

	interface LogEntry {
		text: string;
		timestamp: string;
		level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'DEBUG' | 'UNKNOWN';
	}

	interface Props {
		serverId: string;
		class?: string;
	}

	let { serverId, class: className = '' }: Props = $props();

	const wsState = getWebSocket();

	let logs = $state<LogEntry[]>([]);
	let command = $state('');
	let filter = $state('');
	let autoScroll = $state(true);
	let commandLoading = $state(false);
	let consoleEl = $state<HTMLDivElement | null>(null);

	const filteredLogs = $derived(
		filter
			? logs.filter((l) => l.text.toLowerCase().includes(filter.toLowerCase()))
			: logs
	);

	const levelColors: Record<LogEntry['level'], string> = {
		INFO: 'text-text',
		DEBUG: 'text-text-muted',
		WARN: 'text-warning',
		ERROR: 'text-danger',
		FATAL: 'text-danger font-bold',
		UNKNOWN: 'text-text-muted'
	};

	function detectLevel(text: string): LogEntry['level'] {
		if (/\bFATAL\b/i.test(text)) return 'FATAL';
		if (/\bERROR\b/i.test(text)) return 'ERROR';
		if (/\bWARN(ING)?\b/i.test(text)) return 'WARN';
		if (/\bDEBUG\b/i.test(text)) return 'DEBUG';
		if (/\bINFO\b/i.test(text)) return 'INFO';
		return 'UNKNOWN';
	}

	function appendLog(data: string, timestamp: string) {
		const entry: LogEntry = {
			text: data,
			timestamp,
			level: detectLevel(data)
		};
		logs = [...logs.slice(-1999), entry]; // Keep last 2000 lines
		if (autoScroll && consoleEl) {
			requestAnimationFrame(() => {
				if (consoleEl) consoleEl.scrollTop = consoleEl.scrollHeight;
			});
		}
	}

	async function sendCommand() {
		if (!command.trim()) return;
		commandLoading = true;
		try {
			const res = await fetch(`/api/servers/${serverId}/command`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ command: command.trim() })
			});
			if (res.ok) {
				appendLog(`> ${command}`, new Date().toISOString());
				command = '';
			}
		} finally {
			commandLoading = false;
		}
	}

	let removeHandler: (() => void) | null = null;

	onMount(() => {
		connectWebSocket();
		subscribeToLogs(serverId);

		removeHandler = addMessageHandler((msg) => {
			if (msg.type === 'log_data' && msg.serverId === serverId) {
				appendLog(msg.data, msg.timestamp);
			}
		});
	});

	onDestroy(() => {
		unsubscribeFromLogs(serverId);
		removeHandler?.();
	});
</script>

<div class="flex flex-col h-full {className}">
	<!-- Toolbar -->
	<div class="flex items-center gap-3 mb-3">
		<div class="flex-1 relative">
			<input
				type="text"
				placeholder="Filter logs..."
				bind:value={filter}
				class="w-full bg-surface-dark border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
			/>
		</div>
		<label class="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
			<input type="checkbox" bind:checked={autoScroll} class="rounded" />
			Auto-scroll
		</label>
		<button
			onclick={() => (logs = [])}
			class="text-xs text-text-muted hover:text-text px-2 py-1 rounded hover:bg-surface-light transition-colors"
		>
			Clear
		</button>
		<span class="text-xs {wsState.connected ? 'text-green-400' : 'text-danger'}">
			{wsState.connected ? '● Connected' : '○ Disconnected'}
		</span>
	</div>

	<!-- Log output -->
	<div
		bind:this={consoleEl}
		onscroll={() => {
			if (!consoleEl) return;
			const atBottom =
				consoleEl.scrollHeight - consoleEl.scrollTop <= consoleEl.clientHeight + 50;
			autoScroll = atBottom;
		}}
		class="flex-1 bg-surface-dark rounded-lg border border-border overflow-y-auto font-mono text-xs p-3 min-h-0"
	>
		{#if filteredLogs.length === 0}
			<p class="text-text-muted italic text-center py-8">No logs yet. Start the server to see output.</p>
		{:else}
			{#each filteredLogs as log}
				<div class="leading-5 hover:bg-surface-light/30 px-1 rounded {levelColors[log.level]}">
					<span class="text-text-muted mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>{log.text}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Command input -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			sendCommand();
		}}
		class="flex gap-2 mt-3"
	>
		<input
			type="text"
			bind:value={command}
			placeholder="Enter command..."
			class="flex-1 bg-surface-dark border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary font-mono"
		/>
		<Button type="submit" variant="primary" size="sm" loading={commandLoading}>
			Send
		</Button>
	</form>
</div>
