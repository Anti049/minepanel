<script lang="ts">
	interface Props {
		label?: string;
		id?: string;
		placeholder?: string;
		value?: string;
		type?: string;
		error?: string;
		helperText?: string;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
	}

	let {
		label,
		id,
		placeholder,
		value = $bindable(''),
		type = 'text',
		error,
		helperText,
		disabled = false,
		required = false,
		class: className = '',
		oninput,
		onchange
	}: Props = $props();
</script>

<div class="flex flex-col gap-1 {className}">
	{#if label}
		<label for={id} class="text-sm font-medium text-text-muted">
			{label}{#if required}<span class="text-danger ml-1">*</span>{/if}
		</label>
	{/if}
	<input
		{id}
		{type}
		{placeholder}
		{disabled}
		{required}
		bind:value
		{oninput}
		{onchange}
		class="bg-surface-dark border {error ? 'border-danger' : 'border-border'} rounded-lg px-3 py-2 text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
	/>
	{#if error}
		<p class="text-xs text-danger">{error}</p>
	{:else if helperText}
		<p class="text-xs text-text-muted">{helperText}</p>
	{/if}
</div>
