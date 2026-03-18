<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '🏠' },
		{ href: '/servers', label: 'Servers', icon: '🖥️' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' }
	];

	const isActive = (href: string) => {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	};
</script>

<div class="flex h-screen bg-surface-dark text-text overflow-hidden">
	<!-- Sidebar -->
	<aside class="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col">
		<!-- Logo -->
		<div class="px-6 py-5 border-b border-border">
			<div class="flex items-center gap-3">
				<span class="text-3xl">⛏️</span>
				<div>
					<h1 class="text-lg font-bold text-text leading-tight">MinePanel</h1>
					<p class="text-xs text-text-muted">Minecraft Server Manager</p>
				</div>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(item.href)
						? 'bg-primary/10 text-primary'
						: 'text-text-muted hover:text-text hover:bg-surface-light'}"
				>
					<span class="text-lg">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Footer -->
		<div class="px-6 py-4 border-t border-border">
			<p class="text-xs text-text-muted">MinePanel v0.1.0</p>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 flex flex-col overflow-hidden">
		<div class="flex-1 overflow-y-auto">
			{@render children()}
		</div>
	</main>
</div>
