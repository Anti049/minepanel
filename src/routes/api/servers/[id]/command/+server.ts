import { json, error } from '@sveltejs/kit';
import { getServerById } from '$server/services/server.service';
import { Rcon } from 'rcon-client';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const server = await getServerById(params.id);
		if (!server) error(404, `Server "${params.id}" not found`);
		if (server.status !== 'running') error(400, 'Server is not running');

		const body = await request.json();
		if (!body.command) error(400, 'command is required');

		const rconPort = server.rconPort ?? server.port + 1;
		const rconPassword = server.config?.rconPassword ?? 'changeme';

		const rcon = new Rcon({
			host: '127.0.0.1',
			port: rconPort,
			password: rconPassword,
			timeout: 5000
		});

		await rcon.connect();
		const response = await rcon.send(body.command);
		await rcon.end();

		return json({ response });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('[API] POST /api/servers/:id/command:', err);
		error(500, 'Failed to send command');
	}
};
