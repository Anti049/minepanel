import type { Server } from '$types/server';

let servers = $state<Server[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export function getServers() {
	return {
		get servers() {
			return servers;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		}
	};
}

export async function fetchServers(): Promise<void> {
	loading = true;
	error = null;
	try {
		const res = await fetch('/api/servers');
		if (!res.ok) throw new Error(`Failed to fetch servers: ${res.statusText}`);
		servers = await res.json();
	} catch (err) {
		error = err instanceof Error ? err.message : 'Unknown error';
	} finally {
		loading = false;
	}
}

export async function deleteServer(id: string): Promise<boolean> {
	try {
		const res = await fetch(`/api/servers/${id}`, { method: 'DELETE' });
		if (!res.ok) return false;
		servers = servers.filter((s) => s.id !== id);
		return true;
	} catch {
		return false;
	}
}

export async function startServer(id: string): Promise<boolean> {
	try {
		const res = await fetch(`/api/servers/${id}/start`, { method: 'POST' });
		if (!res.ok) return false;
		servers = servers.map((s) => (s.id === id ? { ...s, status: 'starting' } : s));
		return true;
	} catch {
		return false;
	}
}

export async function stopServer(id: string): Promise<boolean> {
	try {
		const res = await fetch(`/api/servers/${id}/stop`, { method: 'POST' });
		if (!res.ok) return false;
		servers = servers.map((s) => (s.id === id ? { ...s, status: 'stopping' } : s));
		return true;
	} catch {
		return false;
	}
}
