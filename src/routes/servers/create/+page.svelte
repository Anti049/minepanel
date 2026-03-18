<script lang="ts">
	import CreateServerForm from '$components/CreateServerForm.svelte';
	import { goto } from '$app/navigation';
	import type { CreateServerInput } from '$types/server';

	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleCreate(input: CreateServerInput) {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/servers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input)
			});
			if (!res.ok) {
				const data = await res.json();
				error = data.error ?? 'Failed to create server';
				return;
			}
			const server = await res.json();
			await goto(`/servers/${server.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="p-6 max-w-2xl mx-auto">
	<div class="mb-8">
		<a href="/servers" class="text-text-muted hover:text-text text-sm transition-colors">← Back to Servers</a>
		<h1 class="text-3xl font-bold text-text mt-3">Create Server</h1>
		<p class="text-text-muted mt-1">Configure and launch a new Minecraft server</p>
	</div>

	{#if error}
		<div class="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
			{error}
		</div>
	{/if}

	<div class="bg-surface border border-border rounded-xl p-6">
		<CreateServerForm onsubmit={handleCreate} {loading} />
	</div>
</div>
