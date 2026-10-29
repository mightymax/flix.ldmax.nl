import { z } from 'zod';
import { publishedStorySchema } from '../../stories/contract.js';
export const STORY_COOKIE = 'flix-story-preview';
export const storyResponseSchema = z.object({story: publishedStorySchema,
  preview: z.object({expiresAt: z.number().int().positive()}).strict().optional()
}).strict();
export const storyContextSchema = z.object({url: z.string().max(4000), identifier: z.string().max(220),
  expiresAt: z.number().int().positive(), draft: z.boolean()}).strict();

/** Only known LDMax servers and canonical story or single-story API routes may be fetched.
 * @param {string} input @param {{origins?: string; repository?: string; development?: boolean}} [options]
 */
export function storyLink(input, options = {}) {
  const url = new URL(input);
  const origins = new Set(['https://www.ldmax.nl', 'https://ldmax.nl', 'https://platform.ldmax.nl']);
  if (options.repository) origins.add(new URL(options.repository).origin);
  for (const origin of (options.origins ?? '').split(',').map(value => value.trim()).filter(Boolean)) origins.add(new URL(origin).origin);
  if (options.development) {
    for (const host of ['platform.ldmax', 'localhost', '127.0.0.1']) origins.add(`https://${host}:5173`);
  }
  if (!origins.has(url.origin) || url.username || url.password || url.hash || !(/^\/api\/verhalen\/[0-9a-f-]{36}$/i.test(url.pathname) || /^\/organisaties\/[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\/verhalen\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\.(?:ttl|jsonld|json|nt|nq|trig|n3|rdfxml))?$/.test(url.pathname)) ||
    [...url.searchParams.keys()].some(key => key !== 'preview') || url.searchParams.getAll('preview').length > 1) throw new Error('Gebruik een verhaallink van een toegestane LDMax-server.');
  url.pathname = url.pathname.replace(/\.(ttl|jsonld|json|nt|nq|trig|n3|rdfxml)$/, '');
  return url;
}
/** @param {URL} url @param {typeof fetch} [fetcher] */
export async function fetchLinkedStory(url, fetcher = fetch) {
  const response = await fetcher(url, {redirect: 'error', signal: AbortSignal.timeout(10000), headers: {Accept: 'application/json'}});
  if (!response.ok) {await response.body?.cancel(); throw new Error(`LDMax kon het verhaal niet leveren (${response.status}). Maak zo nodig een nieuwe voorbeeldlink.`);}
  const reader = response.body?.getReader();
  if (!reader) throw new Error('LDMax gaf een leeg antwoord.');
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 256_000) {await reader.cancel(); throw new Error('Het verhaal is te groot.');}
      chunks.push(part.value);
    }
  } finally {reader.releaseLock();}
  const result = storyResponseSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  const parts = url.pathname.split('/');
  if (parts[1] === 'organisaties' ? (result.story.organisation !== parts[2] || result.story.config.slug !== parts[4]) : result.story.id !== parts.at(-1)) throw new Error('De verhaallink verwijst naar een ander verhaal.');
  if (url.searchParams.has('preview') !== Boolean(result.preview)) throw new Error('LDMax gaf een onverwachte voorbeeldversie terug.');
  if (result.preview && result.preview.expiresAt <= Date.now()) throw new Error('De voorbeeldlink is verlopen.');
  return result;
}
