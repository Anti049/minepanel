import { json, error } from '@sveltejs/kit';
import { stopServer } from '$server/docker/lifecycle';
import { db } from '$server/db/index';
import { servers } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	try {
		const rows = await db.select().from(servers).where(eq(servers.id, params.id));
		if (rows.length === 0) error(404, `Server "${params.id}" not found`);

		await stopServer(params.id);
		return json({ success: true, status: 'stopping' });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('[API] POST /api/servers/:id/stop:', err);
		error(500, 'Failed to stop server');
	}
};
