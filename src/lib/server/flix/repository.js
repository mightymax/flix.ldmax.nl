import {validateSelectionQuery} from '../../stories/selectionQuery.js';
import { DataFactory, Store } from 'n3';
import { publishedStorySchema, repositorySchema, storyQuery } from '../../stories/contract.js';
const { namedNode, literal } = DataFactory;
/** @param {string} name */
const sdo = name => namedNode(`https://schema.org/${name}`);
/** @param {string} name */
const flix = name => namedNode(`https://erfgoedflix.nl/vocabulary#${name}`);
/** @param {string} name */
const comunica = name => namedNode(`https://comunica.dev/vocabulary#${name}`);
const rdfType = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

/** @param {string} url @param {typeof fetch} [fetcher] */
export async function fetchRepository(url, fetcher = fetch) {
  const stories = [];
  let offset = 0;
  for (let page = 0; page < 100; page++) {
    const target = new URL(url);
    target.searchParams.set('offset', String(offset));
    target.searchParams.set('limit', '50');
    const response = await fetcher(target, { headers: { Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Story repository returned ${response.status}`); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty story repository response');
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 2_000_000) { await reader.cancel(); throw new Error('Story repository response too large'); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const body = repositorySchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    stories.push(...body.stories);
    if (body.nextOffset === null) {
      if (new Set(stories.map(story => story.id)).size !== stories.length) throw new Error('Duplicate stories in repository');
      return stories;
    }
    if (body.nextOffset <= offset) throw new Error('Invalid repository pagination');
    offset = body.nextOffset;
  }
  throw new Error('Story repository pagination limit exceeded');
}

/** No remote file references or model-authored SPARQL are accepted.
 * @param {import('zod').infer<typeof publishedStorySchema>[]} stories
 */
export function repositoryConfiguration(stories) {
  const store = new Store();
  const root = namedNode('urn:erfgoedflix:repository');
  store.addQuad(root, rdfType, sdo('WebApplication'));
  store.addQuad(root, sdo('name'), literal('Erfgoedflix'));
  for (const input of stories) {
    const story = publishedStorySchema.parse(input);
    const node = namedNode(`urn:erfgoedflix:story:${story.id}`);
    const settings = namedNode(`${node.value}:settings`);
    /** @param {import('@rdfjs/types').NamedNode} subject @param {string} key @param {string} value */
    const addText = (subject, key, value) => { if (value) store.addQuad(subject, sdo(key), literal(value)); };
    store.addQuad(root, sdo('hasPart'), node);
    store.addQuad(node, rdfType, sdo('WebPage'));
    addText(node, 'identifier', `${story.organisation}--${story.config.slug}`);
    addText(node, 'name', story.config.title);
    addText(node, 'headline', story.config.headline);
    addText(node, 'description', story.config.description);
    addText(node, 'image', story.config.coverImage);
    store.addQuad(node, flix('managedStory'), literal('true'));
    store.addQuad(node, comunica('settings'), settings);
    store.addQuad(settings, comunica('source'), literal(story.source.endpoint));
    // This settings node supports the existing metadata lookup on the detail page.
    for (const theme of story.config.themes) {
      const themeNode = namedNode(`${node.value}:theme:${theme.id}`);
      const themeSettings = namedNode(`${themeNode.value}:settings`);
      store.addQuad(node, sdo('hasPart'), themeNode);
      store.addQuad(themeNode, rdfType, sdo('WebPage'));
      store.addQuad(themeNode, flix('managedStory'), literal('true'));
      addText(themeNode, 'identifier', theme.id);
      addText(themeNode, 'name', theme.title);
      addText(themeNode, 'description', theme.description);
      store.addQuad(themeNode, comunica('settings'), themeSettings);
      store.addQuad(themeSettings, comunica('source'), literal(story.source.endpoint));
      store.addQuad(themeSettings, comunica('query'), literal(storyQuery(theme.selection, theme.selectionQuery ? validateSelectionQuery(theme.selectionQuery) : undefined)));
    }
  }
  return { store, root, files: [] };
}
