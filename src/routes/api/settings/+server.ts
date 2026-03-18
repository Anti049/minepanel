import { json, error } from '@sveltejs/kit';
import { db } from '$server/db/index';
import { settings } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const rows = await db.select().from(settings);
		const result: Record<string, unknown> = {};
		for (const row of rows) {
			result[row.key] = row.value;
		}
		return json(result);
	} catch (err) {
		console.error('[API] GET /api/settings:', err);
		error(500, 'Failed to fetch settings');
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		for (const [key, value] of Object.entries(body)) {
			await db
				.insert(settings)
				.values({ key, value: value as string })
				.onConflictDoUpdate({ target: settings.key, set: { value: value as string } });
		}
		return json({ success: true });
	} catch (err) {
		console.error('[API] PUT /api/settings:', err);
		error(500, 'Failed to update settings');
	}
};
