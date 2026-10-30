import { error, redirect } from '@sveltejs/kit';
import { storyCover } from '#lib/server/flix/storyCover.js';

export const GET = async ({ locals, params, setHeaders }) => {
  const story = locals.flix.getFlix(params.identifier);
  if (!story) error(404, 'Verhaal niet gevonden');
  const image = await storyCover(story);
  if (!image) error(404, 'Geen afbeelding beschikbaar');
  setHeaders({ 'cache-control': 'private, max-age=300' });
  redirect(307, image, { external: true });
};
