<script lang="ts">
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Tabs from '$components/ui/Tabs.svelte';
	import ServerConsole from '$components/ServerConsole.svelte';
	import ResourceMonitor from '$components/ResourceMonitor.svelte';
	import { startServer, stopServer } from '$stores/servers.svelte';

	let { data } = $props();
	// eslint-disable-next-line svelte/reactivity-lost
	let server = $state(data.server);
	let actionLoading = $state(false);

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'console', label: 'Console' },
		{ id: 'resources', label: 'Resources' },
		{ id: 'config', label: 'Configuration' }
	];

	async function handleStart() {
		actionLoading = true;
		await startServer(server.id);
		server = { ...server, status: 'starting' };
		actionLoading = false;
	}

	async function handleStop() {
		actionLoading = true;
		await stopServer(server.id);
		server = { ...server, status: 'stopping' };
		actionLoading = false;
	}

	async function handleRestart() {
		actionLoading = true;
		await fetch(`/api/servers/${server.id}/restart`, { method: 'POST' });
		server = { ...server, status: 'starting' };
		actionLoading = false;
	}
</script>

<div class="p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-start justify-between mb-8">
		<div>
			<a href="/servers" class="text-text-muted hover:text-text text-sm transition-colors">← Back to Servers</a>
			<div class="flex items-center gap-4 mt-3">
				<h1 class="text-3xl font-bold text-text">{server.name}</h1>
				<Badge variant={server.status}>{server.status}</Badge>
			</div>
			<p class="text-text-muted mt-1">
				{server.edition} · {server.serverType} · {server.version} · Port {server.port}
			</p>
		</div>
		<div class="flex gap-2">
			{#if server.status === 'stopped' || server.status === 'error'}
				<Button variant="primary" loading={actionLoading} onclick={handleStart}>▶ Start</Button>
			{:else if server.status === 'running'}
				<Button variant="secondary" loading={actionLoading} onclick={handleRestart}>↺ Restart</Button>
				<Button variant="danger" loading={actionLoading} onclick={handleStop}>⏹ Stop</Button>
			{:else}
				<Button variant="secondary" disabled>{server.status}...</Button>
			{/if}
		</div>
	</div>

	<!-- Tabs -->
	<Tabs {tabs}>
		{#snippet children({ activeTab })}
			{#if activeTab === 'overview'}
				<div class="grid grid-cols-2 gap-6">
					<div class="bg-surface border border-border rounded-xl p-5">
						<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Server Info</h3>
						<dl class="space-y-3">
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">ID</dt>
								<dd class="text-text text-sm font-mono">{server.id}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">Edition</dt>
								<dd class="text-text text-sm">{server.edition}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">Type</dt>
								<dd class="text-text text-sm">{server.serverType}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">Version</dt>
								<dd class="text-text text-sm">{server.version}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">Game Port</dt>
								<dd class="text-text text-sm font-mono">{server.port}</dd>
							</div>
							{#if server.rconPort}
								<div class="flex justify-between">
									<dt class="text-text-muted text-sm">RCON Port</dt>
									<dd class="text-text text-sm font-mono">{server.rconPort}</dd>
								</div>
							{/if}
							{#if server.voiceChatPort}
								<div class="flex justify-between">
									<dt class="text-text-muted text-sm">Voice Chat Port</dt>
									<dd class="text-text text-sm font-mono">{server.voiceChatPort}</dd>
								</div>
							{/if}
						</dl>
					</div>
					<div class="bg-surface border border-border rounded-xl p-5">
						<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Resources</h3>
						<dl class="space-y-3">
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">Min Memory</dt>
								<dd class="text-text text-sm">{server.memoryMin}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">Max Memory</dt>
								<dd class="text-text text-sm">{server.memoryMax}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-text-muted text-sm">CPU Limit</dt>
								<dd class="text-text text-sm">{server.cpuLimit} cores</dd>
							</div>
						</dl>
					</div>
				</div>

			{:else if activeTab === 'console'}
				<div class="h-[600px] flex flex-col">
					<ServerConsole serverId={server.id} class="flex-1" />
				</div>

			{:else if activeTab === 'resources'}
				<div>
					{#if server.status === 'running'}
						<ResourceMonitor serverId={server.id} />
					{:else}
						<div class="text-center py-12 text-text-muted">
							Start the server to view resource usage.
						</div>
					{/if}
				</div>

			{:else if activeTab === 'config'}
				<div class="bg-surface border border-border rounded-xl p-5">
					<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Configuration</h3>
					<pre class="text-xs text-text-muted font-mono overflow-auto">{JSON.stringify(server.config, null, 2)}</pre>
				</div>
			{/if}
		{/snippet}
	</Tabs>
</div>
