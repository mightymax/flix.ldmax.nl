import test from 'node:test';
import assert from 'node:assert/strict';
import {storyLink, fetchLinkedStory} from '../src/lib/server/flix/storyLink.js';
const id = '293ba028-e70a-4548-8a9d-b8a3829ea5ad';
const url = `https://platform.ldmax.nl/api/verhalen/${id}`;
const story = {id, organisation: 'museum', revision: 2, config: {version: 2, slug: 'portretten', title: 'Portretten', themes: [{id: 'mensen', title: 'Mensen', selection: {property: 'about', kind: 'literal', value: 'portret'}}]}, source: {scope: 'organisation', endpoint: 'https://data.example/sparql', url: 'https://platform.ldmax.nl/organisaties/museum'}};
test('story links are limited to known origins and the single-story route', () => {
  assert.equal(storyLink(url).href, url);
  for (const invalid of [url.replace('platform.ldmax.nl', 'attacker.example'), url.replace('/api/verhalen/', '/admin/'), url + '?redirect=https://attacker.example', url.replace('https://', 'https://user:password@')]) assert.throws(() => storyLink(invalid));
  assert.throws(() => storyLink(url + '?preview=one&preview=two'));
  assert.throws(() => storyLink(url.replace('https://platform.ldmax.nl', 'https://localhost:5173')));
  assert.ok(storyLink(url.replace('https://platform.ldmax.nl', 'https://localhost:5173'), {development: true}));
  assert.ok(storyLink(url.replace('https://platform.ldmax.nl', 'https://platform.example'), {origins: 'https://platform.example'}));
});
test('published story links use the same strict story contract', async () => {
  const result = await fetchLinkedStory(new URL(url), async (_url, options) => {
    assert.equal(options.redirect, 'error');
    return Response.json({story});
  });
  assert.equal(result.story.config.title, 'Portretten');
  assert.equal(result.preview, undefined);
});
test('preview responses require a matching unexpired preview token context', async () => {
  const target = new URL(url + '?preview=opaque-token');
  const response = {story, preview: {expiresAt: Date.now() + 60000}};
  assert.ok((await fetchLinkedStory(target, async () => Response.json(response))).preview);
  await assert.rejects(fetchLinkedStory(new URL(url), async () => Response.json(response)), /onverwachte/);
  await assert.rejects(fetchLinkedStory(target, async () => Response.json({story})), /onverwachte/);
  await assert.rejects(fetchLinkedStory(target, async () => Response.json({...response, preview: {expiresAt: Date.now() - 1}})), /verlopen/);
  await assert.rejects(fetchLinkedStory(new URL(url), async () => Response.json({story: {...story, id: 'a52cc86b-f98b-4483-a01c-7e2e44eff737'}})), /ander verhaal/);
  await assert.rejects(fetchLinkedStory(target, async () => new Response('', {status: 401})), /401/);
});

test('readable story URLs accept RDF extensions and verify organisation and slug', async () => {
  const canonical = 'https://platform.ldmax.nl/organisaties/museum/verhalen/portretten';
  for (const ext of ['', '.ttl', '.jsonld']) {
    const target = storyLink(canonical + ext);
    assert.equal(target.href, canonical);
    assert.equal((await fetchLinkedStory(target, async () => Response.json({story}))).story.id, id);
  }
  await assert.rejects(fetchLinkedStory(new URL(canonical.replace('/museum/', '/another/')), async () => Response.json({story})), /ander verhaal/);
  await assert.rejects(fetchLinkedStory(new URL(canonical + '-wrong'), async () => Response.json({story})), /ander verhaal/);
  assert.throws(() => storyLink(canonical.replace('platform.ldmax.nl', 'attacker.example')));
});

test('accepts the production www.ldmax.nl story origin without accepting lookalike hosts', async () => {
  const canonical = 'https://www.ldmax.nl/organisaties/museum/verhalen/portretten';
  assert.equal(storyLink(canonical).href, canonical);
  assert.equal((await fetchLinkedStory(storyLink(canonical), async () => Response.json({story}))).story.id, id);
  for (const host of ['www.ldmax.nl.attacker.example', 'www-ldmax.nl', 'attacker.example']) assert.throws(() => storyLink(canonical.replace('www.ldmax.nl', host)));
  assert.throws(() => storyLink(canonical.replace('https:', 'http:')));
});
