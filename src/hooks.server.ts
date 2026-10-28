import type { Handle } from '@sveltejs/kit/hooks';
import {error, redirect} from '@sveltejs/kit';
import {dev} from '$app/env';
import Flix from '#lib/Flix.js';
import {STORY_COOKIE, storyContextSchema, storyLink, fetchLinkedStory} from '#lib/server/flix/storyLink.js';

export const handle: Handle = async ({event, resolve}) => {
  if (event.url.searchParams.has('ldmax-verhaal')) {
    const target = new URL('/bekijk', event.url);
    target.searchParams.set('url', event.url.searchParams.get('ldmax-verhaal')!);
    redirect(303, target.pathname + target.search);
  }
  if (event.route.id === '/bekijk') return resolve(event);
  const cookie = event.cookies.get(STORY_COOKIE);
  let context;
  try {context = cookie ? storyContextSchema.parse(JSON.parse(cookie)) : undefined;}
  catch {event.cookies.delete(STORY_COOKIE, {path: '/'});}
  event.locals.hasStoryLink = Boolean(context);
  if (context && event.params.identifier === context.identifier) {
    if (context.expiresAt <= Date.now()) {
      event.cookies.delete(STORY_COOKIE, {path: '/'});
      error(410, 'Deze voorbeeldsessie is verlopen. Open het verhaal opnieuw vanuit LDMax.');
    }
    try {
      const target = storyLink(context.url, {origins: process.env.FLIX_PREVIEW_ORIGINS, repository: process.env.FLIX_REPOSITORY_URL, development: dev});
      const result = await fetchLinkedStory(target);
      if (`${result.story.organisation}--${result.story.config.slug}` !== context.identifier) throw new Error('Het verhaal is gewijzigd. Maak een nieuwe voorbeeldlink.');
      event.locals.flix = Flix.fromStory(result.story);
      event.locals.storyPreview = {draft: Boolean(result.preview), expiresAt: context.expiresAt};
    } catch (cause) {error(502, cause instanceof Error ? cause.message : 'Het voorbeeld kon niet worden geladen.');}
    const response = await resolve(event);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }
  event.locals.flix = await Flix.getInstance();
  return resolve(event);
};
