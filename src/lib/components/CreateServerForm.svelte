<script lang="ts">
	import Button from './ui/Button.svelte';
	import Input from './ui/Input.svelte';
	import Select from './ui/Select.svelte';
	import type { CreateServerInput, ServerEdition } from '$types/server';

	interface Props {
		onsubmit?: (input: CreateServerInput) => Promise<void>;
		loading?: boolean;
	}

	let { onsubmit, loading = false }: Props = $props();

	let id = $state('');
	let name = $state('');
	let edition = $state<ServerEdition>('JAVA');
	let serverType = $state('VANILLA');
	let version = $state('latest');
	let memoryMin = $state('2G');
	let memoryMax = $state('4G');
	let cpuLimit = $state('2');

	let errors = $state<Record<string, string>>({});

	const javaTypeOptions = [
		{ value: 'VANILLA', label: 'Vanilla' },
		{ value: 'PAPER', label: 'Paper' },
		{ value: 'PURPUR', label: 'Purpur' },
		{ value: 'SPIGOT', label: 'Spigot' },
		{ value: 'FABRIC', label: 'Fabric' },
		{ value: 'FORGE', label: 'Forge' },
		{ value: 'QUILT', label: 'Quilt' },
		{ value: 'FOLIA', label: 'Folia' },
		{ value: 'VELOCITY', label: 'Velocity' },
		{ value: 'BUNGEECORD', label: 'BungeeCord' }
	];

	const bedrockTypeOptions = [{ value: 'VANILLA', label: 'Vanilla' }];

	const typeOptions = $derived(edition === 'JAVA' ? javaTypeOptions : bedrockTypeOptions);

	function validate(): boolean {
		const e: Record<string, string> = {};
		if (!id.trim()) e.id = 'Server ID is required';
		else if (!/^[a-z0-9-]+$/.test(id)) e.id = 'ID must be lowercase letters, numbers, hyphens only';
		if (!name.trim()) e.name = 'Server name is required';
		errors = e;
		return Object.keys(e).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		await onsubmit?.({
			id: id.trim(),
			name: name.trim(),
			edition,
			serverType,
			version: version.trim() || 'latest',
			config: {
				memoryMin,
				memoryMax,
				cpuLimit
			}
		});
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-5">
	<div class="grid grid-cols-2 gap-4">
		<Input
			id="server-id"
			label="Server ID"
			placeholder="survival"
			bind:value={id}
			error={errors.id}
			helperText="Lowercase letters, numbers, hyphens"
			required
		/>
		<Input
			id="server-name"
			label="Server Name"
			placeholder="Survival World"
			bind:value={name}
			error={errors.name}
			required
		/>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<Select
			id="edition"
			label="Edition"
			bind:value={edition}
			options={[
				{ value: 'JAVA', label: '☕ Java Edition' },
				{ value: 'BEDROCK', label: '📱 Bedrock Edition' }
			]}
		/>
		<Select
			id="server-type"
			label="Server Type"
			bind:value={serverType}
			options={typeOptions}
		/>
	</div>

	<Input
		id="version"
		label="Version"
		placeholder="latest"
		bind:value={version}
		helperText="Use 'latest' for the most recent release"
	/>

	<div class="grid grid-cols-3 gap-4">
		<Input
			id="memory-min"
			label="Min Memory"
			placeholder="2G"
			bind:value={memoryMin}
			helperText="e.g. 1G, 512M"
		/>
		<Input
			id="memory-max"
			label="Max Memory"
			placeholder="4G"
			bind:value={memoryMax}
			helperText="e.g. 4G, 8G"
		/>
		<Input
			id="cpu-limit"
			label="CPU Cores"
			placeholder="2"
			bind:value={cpuLimit}
			helperText="Number of CPU cores"
		/>
	</div>

	<div class="flex justify-end gap-3 pt-2">
		<Button type="submit" variant="primary" {loading}>
			Create Server
		</Button>
	</div>
</form>
