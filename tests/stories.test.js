import test from 'node:test';
import assert from 'node:assert/strict';
import { Parser, Store } from 'n3';
import { QueryEngine } from '@comunica/query-sparql';
import sparqljs from 'sparqljs';
import { storyDraftSchema, repositorySchema, storyQuery, discoveryQuery, previewQuery, iri } from '../src/lib/stories/contract.js';
import { repositoryConfiguration, fetchRepository } from '../src/lib/server/flix/repository.js';
import { mediaFromQuads, isPresentationManifest } from '../src/lib/server/flix/media.js';
import { plainTextHtml } from '../src/lib/server/flix/plainText.js';

const draft = {version: 2, slug: 'portretten', title: 'Mensen in beeld', themes: [{id: 'gezichten', title: 'Gezichten', selection: {property: 'about', kind: 'iri', value: 'https://terms.example/portrait'}}]};
const story = {id: '293ba028-e70a-4548-8a9d-b8a3829ea5ad', organisation: 'museum', revision: 1, config: draft, source: {scope: 'organisation', endpoint: 'https://data.example/sparql', url: 'https://platform.example/organisaties/museum'}};
const turtle = `@prefix s: <https://schema.org/>. @prefix h: <http://schema.org/>.
<https://data.example/one> a s:CreativeWork; s:isPartOf <https://data.example/dataset>; s:name "Portret"@nl; s:about [s:sameAs <https://terms.example/portrait>; s:name "Portret"@nl]; s:associatedMedia <https://images.example/manifest>, [a s:MediaObject, s:ImageObject; s:thumbnailUrl <https://images.example/thumb.jpg>; s:contentUrl <https://images.example/full.jpg>; s:license <https://creativecommons.org/licenses/by/4.0/>; s:copyrightNotice "Maker"@nl].
<https://images.example/manifest> s:encodingFormat 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json"'; s:license <https://creativecommons.org/licenses/by/4.0/>.
<https://data.example/two> a h:CreativeWork; h:isPartOf <https://data.example/dataset>; h:name "Second"@en; h:about <https://terms.example/portrait>.
<https://data.example/unassigned> a s:CreativeWork; s:about <https://terms.example/portrait>.
<https://data.example/nonmatch> a s:CreativeWork; s:about <https://terms.example/landscape>.
<https://data.example/other> a s:CreativeWork; s:isPartOf <https://data.example/other-dataset>; s:about <https://terms.example/portrait>.`;

test('strict contract rejects executable configuration and ambiguous themes', () => {
  assert.equal(storyDraftSchema.parse(draft).headline, '');
  assert.equal(repositorySchema.parse({version: 2, stories: [{...story, organisation: 'Q1852477'}], nextOffset: null}).stories[0].organisation, 'Q1852477');
  assert.throws(() => storyDraftSchema.parse({...draft, slug: 'Uppercase'}));
  assert.throws(() => storyDraftSchema.parse({...draft, datasetSlug: 'old-scope'}));
  assert.throws(() => storyDraftSchema.parse({...draft, version: 1}));
  assert.throws(() => storyDraftSchema.parse({...draft, query: 'SERVICE <http://localhost> {}'}));
  assert.throws(() => storyDraftSchema.parse({...draft, themes: [draft.themes[0], draft.themes[0]]}));
  assert.throws(() => iri('https://example.org/> } UNION { ?s ?p ?o } #'));
  assert.throws(() => repositorySchema.parse({version: 1, stories: [], nextOffset: null}));
});
test('organisation-wide selection includes multiple datasets and unassigned objects with canonical terms and both namespaces', async () => {
  const engine = new QueryEngine();
  const source = new Store(new Parser().parse(turtle));
  const query = storyQuery(draft.themes[0].selection);
  assert.ok(!query.includes('isPartOf'));
  assert.ok(!discoveryQuery().includes('isPartOf'));
  assert.ok(!previewQuery(draft.themes[0].selection).includes('isPartOf'));
  const quads = await (await engine.queryQuads(query, {sources: [source]})).toArray();
  const objects = quads.filter(q => q.predicate.value.endsWith('#type') && q.object.value.endsWith('/ArchivalObject'));
  assert.deepEqual([...new Set(objects.map(q => q.subject.value))].sort(), ['https://data.example/one', 'https://data.example/other', 'https://data.example/two', 'https://data.example/unassigned']);
  const media = mediaFromQuads(quads, objects.find(q => q.subject.value.endsWith('/one')).subject);
  assert.equal(media.find(item => item.manifestUrl)?.manifestUrl, 'https://images.example/manifest');
  assert.equal(media.find(item => item.contentUrl)?.contentUrl, 'https://images.example/full.jpg');
  assert.equal(media.find(item => item.contentUrl)?.copyrightNotice, 'Maker');
  assert.ok(media.every(item => item.license === 'https://creativecommons.org/licenses/by/4.0/'));
  for (const query of [discoveryQuery(), previewQuery(draft.themes[0].selection)]) {
    assert.equal(new sparqljs.Parser().parse(query).queryType, 'SELECT');
    const rows = await (await engine.queryBindings(query, {sources: [source]})).toArray();
    assert.ok(rows.length > 0);
    if (query === discoveryQuery()) {
      const portrait = rows.find(row => row.get('value')?.value === 'https://terms.example/portrait');
      assert.equal(portrait?.get('count')?.value, '4');
    } else {
      assert.deepEqual([...new Set(rows.map(row => row.get('heritageObject').value))].sort(), ['https://data.example/one', 'https://data.example/other', 'https://data.example/two', 'https://data.example/unassigned']);
    }
  }
});
test('repository generates only inline queries, isolates story routes and escapes descriptions', () => {
  const config = repositoryConfiguration([story]);
  assert.equal(config.store.getQuads(null, 'https://schema.org/identifier', null, null)[0].object.value, 'museum--portretten');
  assert.equal(config.store.getQuads(null, 'https://comunica.dev/vocabulary#query', null, null).length, 1);
  assert.equal(config.store.getQuads(null, 'https://erfgoedflix.nl/vocabulary#loadConfig', null, null).length, 0);
  assert.equal(plainTextHtml('<script>bad()</script>'), '<p>&lt;script&gt;bad()&lt;/script&gt;</p>');
});
test('repository follows bounded pagination and rejects repeating pages and duplicates', async () => {
  let calls = 0;
  const result = await fetchRepository('https://platform.example/api/verhalen', async () => Response.json({version: 2, stories: ++calls === 1 ? [story] : [], nextOffset: calls === 1 ? 50 : null}));
  assert.equal(result.length, 1);
  assert.equal(calls, 2);
  await assert.rejects(fetchRepository('https://platform.example/api/verhalen', async () => Response.json({version: 2, stories: [], nextOffset: 0})), /pagination/);
  await assert.rejects(fetchRepository('https://platform.example/api/verhalen', async () => Response.json({version: 2, stories: [story, story], nextOffset: null})), /Duplicate/);
  await assert.rejects(fetchRepository('https://platform.example/api/verhalen', async () => new Response('', {status: 503})), /503/);
});
test('IIIF manifest detection uses declared media format, not guessed image paths', () => {
  assert.equal(isPresentationManifest('application/ld+json;profile="http://iiif.io/api/presentation/3/context.json"'), true);
  assert.equal(isPresentationManifest('application/json; profile="http://iiif.io/api/presentation/2/context.json"'), true);
  assert.equal(isPresentationManifest('image/jpeg'), false);
});

import {validateSelectionQuery, embeddedSelectionQuery} from '../src/lib/stories/selectionQuery.js';
import {defaultSelectionQuery} from '../src/lib/stories/contract.js';
test('manual theme selections support prefixes and stay read-only on the organisation endpoint', async () => {
  const selection = 'PREFIX s: <https://schema.org/> SELECT DISTINCT ?heritageObject WHERE { ?heritageObject s:name "Portret"@nl } LIMIT 1';
  assert.equal(validateSelectionQuery(selection), selection);
  assert.ok(!embeddedSelectionQuery(selection).includes('PREFIX'));
  for (const query of ['DELETE WHERE { ?s ?p ?o }', 'SELECT * WHERE {?s ?p ?o}', 'SELECT ?heritageObject FROM <https://other.example/> WHERE {?heritageObject ?p ?o}', 'SELECT ?heritageObject WHERE { SERVICE <https://other.example/> {?heritageObject ?p ?o}}', 'SELECT ?heritageObject WHERE {{SELECT ?heritageObject WHERE {SERVICE <https://other.example/> {?heritageObject ?p ?o}}}}']) assert.throws(() => validateSelectionQuery(query));
  const engine = new QueryEngine();
  const source = new Store(new Parser().parse(turtle));
  const quads = await (await engine.queryQuads(storyQuery(draft.themes[0].selection, selection), {sources: [source]})).toArray();
  assert.ok(quads.some(q => q.subject.value === 'https://data.example/one' && q.object.value.endsWith('/ArchivalObject')));
  assert.ok(!quads.some(q => q.subject.value === 'https://data.example/two'));
  const customStory = {...story, config: {...draft, themes: [{...draft.themes[0], selectionQuery: selection}]}};
  assert.ok(repositoryConfiguration([customStory]).store.getQuads(null, 'https://comunica.dev/vocabulary#query', null, null)[0].object.value.includes('LIMIT 1'));
  assert.throws(() => repositoryConfiguration([{...customStory, config: {...draft, themes: [{...draft.themes[0], selectionQuery: 'SELECT ?heritageObject WHERE { SERVICE <http://localhost/> { ?heritageObject ?p ?o }}'}]}}]));
  assert.ok(defaultSelectionQuery(draft.themes[0].selection).includes('SELECT DISTINCT ?heritageObject'));
});

import {paginateQuery} from '../src/lib/server/flix/pagination.js';
test('paging preserves manual subquery limits and text containing LIMIT/OFFSET', () => {
  const custom = 'SELECT DISTINCT ?heritageObject WHERE { ?heritageObject <https://schema.org/name> "LIMIT 99 OFFSET 7" } LIMIT 3 OFFSET 1';
  const parsed = new sparqljs.Parser().parse(storyQuery(draft.themes[0].selection, custom));
  paginateQuery(parsed, 10, 20);
  const generated = new sparqljs.Generator().stringify(parsed);
  assert.ok(generated.includes('"LIMIT 99 OFFSET 7"'));
  assert.ok(generated.includes('LIMIT 3'));
  assert.ok(generated.includes('OFFSET 1'));
  assert.ok(generated.includes('LIMIT 10'));
  assert.ok(generated.includes('OFFSET 20'));
});
