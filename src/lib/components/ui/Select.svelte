<script lang="ts">
	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		label?: string;
		id?: string;
		value?: string;
		options?: Option[];
		error?: string;
		helperText?: string;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		onchange?: (e: Event & { currentTarget: HTMLSelectElement }) => void;
	}

	let {
		label,
		id,
		value = $bindable(''),
		options = [],
		error,
		helperText,
		disabled = false,
		required = false,
		class: className = '',
		onchange
	}: Props = $props();
</script>

<div class="flex flex-col gap-1 {className}">
	{#if label}
		<label for={id} class="text-sm font-medium text-text-muted">
			{label}{#if required}<span class="text-danger ml-1">*</span>{/if}
		</label>
	{/if}
	<select
		{id}
		{disabled}
		{required}
		bind:value
		{onchange}
		class="bg-surface-dark border {error ? 'border-danger' : 'border-border'} rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
	>
		{#each options as opt}
			<option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
		{/each}
	</select>
	{#if error}
		<p class="text-xs text-danger">{error}</p>
	{:else if helperText}
		<p class="text-xs text-text-muted">{helperText}</p>
	{/if}
</div>
