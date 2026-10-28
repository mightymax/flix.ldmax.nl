import {redirect, error} from '@sveltejs/kit';
import {dev} from '$app/env';
import {resolve} from '$app/paths';
import {STORY_COOKIE, storyLink, fetchLinkedStory} from '#lib/server/flix/storyLink.js';
import type {RequestHandler} from './$types';
export const GET: RequestHandler = async ({url, cookies, setHeaders}) => {
  setHeaders({'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow'});
  if (url.searchParams.has('stop')) {cookies.delete(STORY_COOKIE, {path: '/'}); redirect(303, resolve('/'));}
  const input = url.searchParams.get('url');
  if (!input || input.length > 4000) error(400, 'Geef een LDMax-verhaallink mee via ?url=.');
  let target;
  try {target = storyLink(input, {origins: process.env.FLIX_PREVIEW_ORIGINS, repository: process.env.FLIX_REPOSITORY_URL, development: dev});}
  catch {error(400, 'Deze URL is geen toegestane LDMax-verhaallink.');}
  let result;
  try {result = await fetchLinkedStory(target);}
  catch (cause) {error(502, cause instanceof Error ? cause.message : 'Het verhaal kon niet worden geladen.');}
  const identifier = `${result.story.organisation}--${result.story.config.slug}`;
  const expiresAt = Math.min(result.preview?.expiresAt ?? Infinity, Date.now() + 15 * 60_000);
  cookies.set(STORY_COOKIE, JSON.stringify({url: target.href, identifier, expiresAt, draft: Boolean(result.preview)}), {
    path: '/', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', maxAge: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000))
  });
  redirect(303, resolve('/[identifier]', {identifier}));
};
