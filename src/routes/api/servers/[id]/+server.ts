import { json, error } from '@sveltejs/kit';
import {
	getServerById,
	updateServer,
	deleteServer
} from '$server/services/server.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const server = await getServerById(params.id);
	if (!server) error(404, `Server "${params.id}" not found`);
	return json(server);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const server = await updateServer(params.id, body);
		if (!server) error(404, `Server "${params.id}" not found`);
		return json(server);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('[API] PUT /api/servers/:id:', err);
		error(500, 'Failed to update server');
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const deleted = await deleteServer(params.id);
		if (!deleted) error(404, `Server "${params.id}" not found`);
		return new Response(null, { status: 204 });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('[API] DELETE /api/servers/:id:', err);
		error(500, 'Failed to delete server');
	}
};
