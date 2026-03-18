import { getAllServers } from '$server/services/server.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const servers = await getAllServers();
	return { servers };
};
