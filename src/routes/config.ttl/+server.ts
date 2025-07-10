import { error, json, text, type RequestHandler } from '@sveltejs/kit';
export const GET: RequestHandler = async ({ locals, params }) => {
    const ttl = await locals.flix.getConfig();
    if (!ttl) {
        throw error(404, 'Config not found');
    }
    return text(ttl, {
        headers: {
            'Content-Type': 'text/turtle',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
    });
}
