import { getAllServers } from '$server/services/server.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	try {
		const servers = await getAllServers();
		return { servers };
	} catch {
		return { servers: [] };
	}
};
