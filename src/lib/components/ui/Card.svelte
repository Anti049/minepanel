<script lang="ts">
	interface Props {
		class?: string;
		header?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let { class: className = '', header, children, footer }: Props = $props();
</script>

<div class="bg-surface border border-border rounded-xl overflow-hidden {className}">
	{#if header}
		<div class="px-6 py-4 border-b border-border">
			{@render header()}
		</div>
	{/if}
	{#if children}
		<div class="px-6 py-4">
			{@render children()}
		</div>
	{/if}
	{#if footer}
		<div class="px-6 py-4 border-t border-border">
			{@render footer()}
		</div>
	{/if}
</div>
