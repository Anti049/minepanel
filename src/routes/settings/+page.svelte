<script lang="ts">
	import Input from '$components/ui/Input.svelte';
	import Button from '$components/ui/Button.svelte';
	import Card from '$components/ui/Card.svelte';

	let { data } = $props();

	let basePort = $state(String(data.settings?.basePort ?? '25565'));
	let portBlockSize = $state(String(data.settings?.portBlockSize ?? '10'));
	let saving = $state(false);
	let saved = $state(false);

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			await fetch('/api/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					basePort: parseInt(basePort),
					portBlockSize: parseInt(portBlockSize)
				})
			});
			saved = true;
			setTimeout(() => (saved = false), 2000);
		} finally {
			saving = false;
		}
	}
</script>

<div class="p-6 max-w-2xl mx-auto">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-text">Settings</h1>
		<p class="text-text-muted mt-1">Configure MinePanel global settings</p>
	</div>

	<form onsubmit={handleSave} class="space-y-6">
		<Card>
			{#snippet header()}
				<h2 class="text-base font-semibold text-text">Port Allocation</h2>
			{/snippet}
			{#snippet children()}
				<div class="space-y-4">
					<Input
						id="base-port"
						label="Base Port"
						type="number"
						bind:value={basePort}
						helperText="Starting port for server allocation (default: 25565)"
					/>
					<Input
						id="port-block-size"
						label="Port Block Size"
						type="number"
						bind:value={portBlockSize}
						helperText="Ports reserved per server (game + RCON + voice chat, default: 10)"
					/>
				</div>
			{/snippet}
		</Card>

		<div class="flex items-center gap-3">
			<Button type="submit" variant="primary" loading={saving}>
				Save Settings
			</Button>
			{#if saved}
				<span class="text-green-400 text-sm">✓ Saved!</span>
			{/if}
		</div>
	</form>
</div>
