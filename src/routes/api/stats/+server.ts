import { json, error } from '@sveltejs/kit';
import { getAllServers } from '$server/services/server.service';
import { getContainerStats } from '$server/docker/stats';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const servers = await getAllServers();
		const stats = await Promise.all(
			servers
				.filter((s) => s.status === 'running')
				.map(async (s) => ({
					serverId: s.id,
					...(await getContainerStats(s.id))
				}))
		);
		return json(stats);
	} catch (err) {
		console.error('[API] GET /api/stats:', err);
		error(500, 'Failed to fetch stats');
	}
};
