<script lang="ts">
	interface Tab {
		id: string;
		label: string;
		icon?: string;
	}

	interface Props {
		tabs: Tab[];
		activeTab?: string;
		class?: string;
		onchange?: (tabId: string) => void;
		children?: import('svelte').Snippet<[{ activeTab: string }]>;
	}

	let { tabs, activeTab = $bindable(tabs[0]?.id ?? ''), class: className = '', onchange, children }: Props =
		$props();

	function selectTab(id: string) {
		activeTab = id;
		onchange?.(id);
	}
</script>

<div class={className}>
	<div class="flex gap-1 bg-surface-dark rounded-lg p-1 border border-border">
		{#each tabs as tab}
			<button
				onclick={() => selectTab(tab.id)}
				class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors {activeTab === tab.id
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text hover:bg-surface/50'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>
	<div class="mt-4">
		{@render children?.({ activeTab })}
	</div>
</div>
