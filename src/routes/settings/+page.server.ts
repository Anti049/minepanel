import { db } from '$server/db/index';
import { settings } from '$server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db.select().from(settings);
	const settingsMap: Record<string, unknown> = {};
	for (const row of rows) {
		settingsMap[row.key] = row.value;
	}
	return { settings: settingsMap };
};
