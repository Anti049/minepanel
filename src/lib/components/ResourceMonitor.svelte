<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		connectWebSocket,
		subscribeToStats,
		unsubscribeFromStats,
		addMessageHandler
	} from '$stores/websocket.svelte';

	interface Props {
		serverId: string;
		class?: string;
	}

	let { serverId, class: className = '' }: Props = $props();

	let cpu = $state('0.00');
	let memory = $state('0 B');
	let memoryLimit = $state('0 B');
	let cpuHistory = $state<number[]>([]);
	let memHistory = $state<number[]>([]);

	const MAX_HISTORY = 30;

	function parsePercent(val: string): number {
		return parseFloat(val.replace('%', '')) || 0;
	}

	function parseBytes(val: string): number {
		const m = val.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
		if (!m) return 0;
		const num = parseFloat(m[1]);
		const unit = m[2].toUpperCase();
		const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
		return num * (multipliers[unit] ?? 1);
	}

	function formatPercent(val: string): string {
		const n = parseFloat(val);
		return isNaN(n) ? '0.00%' : `${n.toFixed(2)}%`;
	}

	let removeHandler: (() => void) | null = null;

	onMount(() => {
		connectWebSocket();
		subscribeToStats(serverId);

		removeHandler = addMessageHandler((msg) => {
			if (msg.type === 'stats_data' && msg.serverId === serverId) {
				cpu = msg.cpu;
				memory = msg.memory;
				memoryLimit = msg.memoryLimit;

				cpuHistory = [...cpuHistory.slice(-(MAX_HISTORY - 1)), parsePercent(msg.cpu)];
				const usedBytes = parseBytes(msg.memory);
				const limitBytes = parseBytes(msg.memoryLimit);
				const memPct = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;
				memHistory = [...memHistory.slice(-(MAX_HISTORY - 1)), memPct];
			}
		});
	});

	onDestroy(() => {
		unsubscribeFromStats(serverId);
		removeHandler?.();
	});

	function sparkline(data: number[], width = 120, height = 40): string {
		if (data.length < 2) return '';
		const max = Math.max(...data, 1);
		const step = width / (data.length - 1);
		const points = data
			.map((v, i) => `${i * step},${height - (v / max) * height}`)
			.join(' ');
		return `M ${points.replace(/ /g, ' L ')}`;
	}
</script>

<div class="grid grid-cols-2 gap-4 {className}">
	<!-- CPU -->
	<div class="bg-surface-dark rounded-xl border border-border p-4">
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium text-text-muted">CPU Usage</span>
			<span class="text-lg font-bold text-text">{formatPercent(cpu)}</span>
		</div>
		<svg viewBox="0 0 120 40" class="w-full h-10 overflow-visible">
			{#if cpuHistory.length >= 2}
				<path d={sparkline(cpuHistory)} fill="none" stroke="var(--color-primary)" stroke-width="1.5" />
			{/if}
		</svg>
	</div>

	<!-- Memory -->
	<div class="bg-surface-dark rounded-xl border border-border p-4">
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium text-text-muted">Memory</span>
			<span class="text-lg font-bold text-text">{memory}</span>
		</div>
		<div class="text-xs text-text-muted mb-2">of {memoryLimit}</div>
		<div class="h-2 bg-surface rounded-full overflow-hidden">
			<div
				class="h-full bg-primary rounded-full transition-all duration-300"
				style="width: {memHistory.at(-1)?.toFixed(1) ?? 0}%"
			></div>
		</div>
		<svg viewBox="0 0 120 40" class="w-full h-10 overflow-visible mt-2">
			{#if memHistory.length >= 2}
				<path d={sparkline(memHistory)} fill="none" stroke="var(--color-info)" stroke-width="1.5" />
			{/if}
		</svg>
	</div>
</div>
