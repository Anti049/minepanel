<script lang="ts">
	import ServerCard from '$components/ServerCard.svelte';
	import { fetchServers, getServers } from '$stores/servers.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	const serverState = getServers();

	onMount(async () => {
		await fetchServers();
	});

	const servers = $derived(serverState.servers.length > 0 ? serverState.servers : data.servers);

	const stats = $derived({
		total: servers.length,
		running: servers.filter((s) => s.status === 'running').length,
		stopped: servers.filter((s) => s.status === 'stopped').length,
		error: servers.filter((s) => s.status === 'error').length
	});
</script>

<div class="p-6 max-w-7xl mx-auto">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-text">Dashboard</h1>
		<p class="text-text-muted mt-1">Overview of your Minecraft servers</p>
	</div>

	<!-- Stats row -->
	<div class="grid grid-cols-4 gap-4 mb-8">
		<div class="bg-surface border border-border rounded-xl p-5">
			<div class="text-3xl font-bold text-text">{stats.total}</div>
			<div class="text-sm text-text-muted mt-1">Total Servers</div>
		</div>
		<div class="bg-surface border border-border rounded-xl p-5">
			<div class="text-3xl font-bold text-green-400">{stats.running}</div>
			<div class="text-sm text-text-muted mt-1">Running</div>
		</div>
		<div class="bg-surface border border-border rounded-xl p-5">
			<div class="text-3xl font-bold text-text-muted">{stats.stopped}</div>
			<div class="text-sm text-text-muted mt-1">Stopped</div>
		</div>
		<div class="bg-surface border border-border rounded-xl p-5">
			<div class="text-3xl font-bold text-danger">{stats.error}</div>
			<div class="text-sm text-text-muted mt-1">Errors</div>
		</div>
	</div>

	<!-- Server cards -->
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-xl font-semibold text-text">Servers</h2>
		<a
			href="/servers/create"
			class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ New Server
		</a>
	</div>

	{#if serverState.loading}
		<div class="text-center py-12 text-text-muted">Loading servers...</div>
	{:else if servers.length === 0}
		<div class="text-center py-12">
			<div class="text-5xl mb-4">🖥️</div>
			<h3 class="text-lg font-semibold text-text mb-2">No servers yet</h3>
			<p class="text-text-muted mb-6">Create your first Minecraft server to get started.</p>
			<a
				href="/servers/create"
				class="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
			>
				Create Server
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each servers as server (server.id)}
				<ServerCard {server} onrefresh={fetchServers} />
			{/each}
		</div>
	{/if}
</div>
