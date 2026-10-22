import type { Handle } from '@sveltejs/kit/hooks';
import Flix from '#lib/Flix.js';


export const handle: Handle = async ({ event, resolve }) => {
	// Attach global instance to locals
	event.locals.flix = await Flix.getInstance();

	const response = await resolve(event);
	return response;
};
