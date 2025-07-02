// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import Flix from '$lib/Flix';

export const handle: Handle = async ({ event, resolve }) => {
	// Attach global instance to locals
	event.locals.flix = await Flix.getInstance();

	const response = await resolve(event);
	return response;
};
