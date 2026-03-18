import { json, error } from '@sveltejs/kit';
import { getAllServers, createServer } from '$server/services/server.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const servers = await getAllServers();
		return json(servers);
	} catch (err) {
		console.error('[API] GET /api/servers:', err);
		error(500, 'Failed to fetch servers');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.id || !body.name) {
			error(400, 'id and name are required');
		}

		// Validate ID format
		if (!/^[a-z0-9-]+$/.test(body.id)) {
			error(400, 'Server ID must be lowercase letters, numbers, and hyphens only');
		}

		const server = await createServer({
			id: body.id,
			name: body.name,
			edition: body.edition,
			serverType: body.serverType,
			version: body.version,
			basePort: body.basePort,
			config: body.config
		});

		return json(server, { status: 201 });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('[API] POST /api/servers:', err);
		error(500, 'Failed to create server');
	}
};
