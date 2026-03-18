import { getServerById } from '$server/services/server.service';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const server = await getServerById(params.id);
	if (!server) {
		error(404, `Server "${params.id}" not found`);
	}
	return { server };
};
