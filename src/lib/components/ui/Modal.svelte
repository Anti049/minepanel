<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		class?: string;
		onclose?: () => void;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let { open = $bindable(false), title, class: className = '', onclose, children, footer }: Props =
		$props();

	function close() {
		open = false;
		onclose?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
		role="presentation"
		onclick={close}
	></div>

	<!-- Modal -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col {className}">
			{#if title}
				<div class="flex items-center justify-between px-6 py-4 border-b border-border">
					<h2 class="text-lg font-semibold text-text">{title}</h2>
					<button
						onclick={close}
						class="text-text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-surface-light"
						aria-label="Close"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}
			<div class="px-6 py-4 overflow-y-auto flex-1">
				{@render children?.()}
			</div>
			{#if footer}
				<div class="px-6 py-4 border-t border-border">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
