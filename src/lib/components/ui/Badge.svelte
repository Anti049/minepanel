<script lang="ts">
	import type { ServerStatus } from '$types/server';

	type BadgeVariant = ServerStatus | 'info' | 'warning' | 'default';

	interface Props {
		variant?: BadgeVariant;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { variant = 'default', class: className = '', children }: Props = $props();

	const variantClasses: Record<BadgeVariant, string> = {
		running: 'bg-green-500/20 text-green-400 border border-green-500/30',
		starting: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
		stopping: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
		stopped: 'bg-surface-light text-text-muted border border-border',
		error: 'bg-danger/20 text-danger border border-danger/30',
		info: 'bg-info/20 text-blue-400 border border-info/30',
		warning: 'bg-warning/20 text-yellow-400 border border-warning/30',
		default: 'bg-surface-light text-text-muted border border-border'
	};
</script>

<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium {variantClasses[variant]} {className}">
	{#if variant === 'running'}
		<span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
	{:else if variant === 'starting' || variant === 'stopping'}
		<span class="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
	{:else if variant === 'error'}
		<span class="w-1.5 h-1.5 rounded-full bg-danger"></span>
	{:else}
		<span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
	{/if}
	{@render children?.()}
</span>
