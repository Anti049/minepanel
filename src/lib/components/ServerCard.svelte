<script lang="ts">
	import Badge from './ui/Badge.svelte';
	import Button from './ui/Button.svelte';
	import type { Server } from '$types/server';
	import { startServer, stopServer, deleteServer } from '$stores/servers.svelte';

	interface Props {
		server: Server;
		onrefresh?: () => void;
	}

	let { server, onrefresh }: Props = $props();

	let actionLoading = $state(false);

	async function handleStart() {
		actionLoading = true;
		await startServer(server.id);
		onrefresh?.();
		actionLoading = false;
	}

	async function handleStop() {
		actionLoading = true;
		await stopServer(server.id);
		onrefresh?.();
		actionLoading = false;
	}

	async function handleDelete() {
		if (!confirm(`Delete server "${server.name}"? This cannot be undone.`)) return;
		actionLoading = true;
		await deleteServer(server.id);
		onrefresh?.();
		actionLoading = false;
	}

	const editionIcon = $derived(server.edition === 'BEDROCK' ? '📱' : '☕');
</script>

<div class="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors">
	<div class="flex items-start justify-between gap-3">
		<div class="flex items-center gap-3 min-w-0">
			<span class="text-2xl" aria-hidden="true">{editionIcon}</span>
			<div class="min-w-0">
				<h3 class="font-semibold text-text truncate">{server.name}</h3>
				<p class="text-xs text-text-muted">
					{server.serverType} · {server.version} · Port {server.port}
				</p>
			</div>
		</div>
		<Badge variant={server.status}>
			{server.status}
		</Badge>
	</div>

	<div class="grid grid-cols-3 gap-3 text-center">
		<div class="bg-surface-dark rounded-lg p-2">
			<div class="text-xs text-text-muted mb-0.5">Memory</div>
			<div class="text-sm font-medium text-text">{server.memoryMax}</div>
		</div>
		<div class="bg-surface-dark rounded-lg p-2">
			<div class="text-xs text-text-muted mb-0.5">CPU</div>
			<div class="text-sm font-medium text-text">{server.cpuLimit} cores</div>
		</div>
		<div class="bg-surface-dark rounded-lg p-2">
			<div class="text-xs text-text-muted mb-0.5">Edition</div>
			<div class="text-sm font-medium text-text">{server.edition}</div>
		</div>
	</div>

	<div class="flex gap-2">
		{#if server.status === 'stopped' || server.status === 'error'}
			<Button variant="primary" size="sm" loading={actionLoading} onclick={handleStart} class="flex-1">
				▶ Start
			</Button>
		{:else if server.status === 'running'}
			<Button variant="secondary" size="sm" loading={actionLoading} onclick={handleStop} class="flex-1">
				⏹ Stop
			</Button>
		{:else}
			<Button variant="secondary" size="sm" disabled class="flex-1">
				{server.status}...
			</Button>
		{/if}
		<a
			href="/servers/{server.id}"
			class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg bg-surface-light text-text border border-border hover:bg-border transition-colors"
		>
			Details →
		</a>
		<Button variant="danger" size="sm" loading={actionLoading} onclick={handleDelete}>
			🗑
		</Button>
	</div>
</div>
