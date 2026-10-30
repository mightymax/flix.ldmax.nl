// Native RDF contract shared by LDMax and ErfgoedFlix. No JSON configuration literals.
import {DataFactory, Store, Parser} from 'n3';
import {repositorySchema} from './contract.js';
const {namedNode: nn, literal: lit, quad} = DataFactory;
export const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
export const SDO = 'https://schema.org/';
export const FLIX = 'https://erfgoedflix.nl/vocabulary#';
export const HYDRA = 'http://www.w3.org/ns/hydra/core#';
/** @param {string} origin @param {string} organisation @param {string} slug */
export const canonicalStory = (origin, organisation, slug) => new URL(`/organisaties/${encodeURIComponent(organisation)}/verhalen/${encodeURIComponent(slug)}`, origin).href;
/** @param {import('zod').infer<typeof repositorySchema>} repository @param {string} document */
export function repositoryDataset(repository, document) {
  repositorySchema.parse(repository);
  const url = new URL(document); url.pathname = url.pathname.replace(/\.(ttl|jsonld|nt|nq|trig|n3|rdfxml|json)$/, '');
  const root = nn(url.href); const store = new Store();
  /** @param {import('@rdfjs/types').NamedNode} subject @param {string} predicate @param {string} value @param {boolean} [iri] */
  const add = (subject, predicate, value, iri = false) => store.addQuad(quad(subject, nn(predicate), iri ? nn(value) : lit(value)));
  add(root, RDF + 'type', SDO + 'Collection', true);
  add(root, SDO + 'name', 'Verhalen op ErfgoedFlix');
  add(root, FLIX + 'contractVersion', '2');
  if (repository.nextOffset !== null) {const next = new URL(url); next.searchParams.set('offset', String(repository.nextOffset)); add(root, HYDRA + 'next', next.href, true);}
  for (const story of repository.stories) {
    const node = nn(canonicalStory(url.origin, story.organisation, story.config.slug));
    add(root, SDO + 'hasPart', node.value, true);
    add(node, RDF + 'type', SDO + 'CreativeWork', true);
    add(node, FLIX + 'id', story.id); add(node, FLIX + 'organisation', story.organisation);
    add(node, SDO + 'version', String(story.revision));
    add(node, SDO + 'identifier', story.config.slug); add(node, SDO + 'name', story.config.title);
    add(node, SDO + 'headline', story.config.headline); add(node, SDO + 'description', story.config.description);
    if (story.config.coverImage) add(node, SDO + 'image', story.config.coverImage, true);
    if (story.config.legacyIdentifier) add(node, FLIX + 'legacyIdentifier', story.config.legacyIdentifier);
    if (story.config.carouselQuery) add(node, FLIX + 'carouselQuery', story.config.carouselQuery);
    if (story.config.dateCreated) add(node, SDO + 'dateCreated', story.config.dateCreated);
    if (story.config.dateModified) add(node, SDO + 'dateModified', story.config.dateModified);
    if (story.config.creator) {const creator = nn(story.config.creator.url); add(node, SDO + 'creator', creator.value, true); add(creator, SDO + 'name', story.config.creator.name); add(creator, SDO + 'description', story.config.creator.description); if (story.config.creator.logo) add(creator, SDO + 'logo', story.config.creator.logo, true);}
    add(node, SDO + 'publisher', story.source.url, true); add(node, FLIX + 'endpoint', story.source.endpoint, true);
    for (const [index, theme] of story.config.themes.entries()) {
      const part = nn(node.value + '#' + theme.id);
      add(node, SDO + 'hasPart', part.value, true); add(part, RDF + 'type', SDO + 'CreativeWork', true);
      add(part, SDO + 'position', String(index)); add(part, SDO + 'identifier', theme.id);
      add(part, SDO + 'name', theme.title); add(part, SDO + 'description', theme.description);
      add(part, FLIX + 'property', SDO + theme.selection.property, true);
      add(part, FLIX + 'value', theme.selection.value, theme.selection.kind === 'iri');
      if (theme.selectionQuery) add(part, FLIX + 'selectionQuery', theme.selectionQuery);
      if (theme.constructQuery) add(part, FLIX + 'constructQuery', theme.constructQuery);
    }
  }
  return {store, root};
}
/** @param {string} text @param {string} document @param {string} [format] */
export function readRepositoryRdf(text, document, format = 'text/turtle') {
  const store = new Store(new Parser({baseIRI: document, format}).parse(text));
  const roots = store.getSubjects(nn(RDF + 'type'), nn(SDO + 'Collection'), null);
  if (roots.length !== 1) throw new Error('Expected one story Collection');
  const root = roots[0];
  /** @param {import('@rdfjs/types').Term} node @param {string} predicate */
  const objects = (node, predicate) => store.getObjects(node, nn(predicate), null);
  /** @param {import('@rdfjs/types').Term} node @param {string} predicate @param {boolean} [optional] */
  const value = (node, predicate, optional = false) => {const terms = objects(node, predicate); if (terms.length > 1 || (!optional && terms.length !== 1)) throw new Error('Missing or ambiguous RDF property: ' + predicate); return terms[0]?.value ?? '';};
  if (value(root, FLIX + 'contractVersion') !== '2') throw new Error('Unsupported story RDF contract');
  const members = objects(root, SDO + 'hasPart');
  if (new Set(members.map(n => n.value)).size !== members.length) throw new Error('Duplicate story members');
  const stories = members.map(node => {
    const themes = objects(node, SDO + 'hasPart').map(part => {
      const terms = objects(part, FLIX + 'value');
      if (terms.length !== 1 || !['NamedNode', 'Literal'].includes(terms[0].termType)) throw new Error('Invalid RDF selection value');
      const property = value(part, FLIX + 'property'); if (!property.startsWith(SDO)) throw new Error('Invalid selection property');
      const selectionQuery = value(part, FLIX + 'selectionQuery', true); const constructQuery = value(part, FLIX + 'constructQuery', true);
      return {position: Number(value(part, SDO + 'position')), theme: {id: value(part, SDO + 'identifier'), title: value(part, SDO + 'name'), description: value(part, SDO + 'description', true), selection: {property: property.slice(SDO.length), kind: terms[0].termType === 'NamedNode' ? 'iri' : 'literal', value: terms[0].value}, ...(selectionQuery ? {selectionQuery} : {}), ...(constructQuery ? {constructQuery} : {})}};
    });
    if (themes.some(t => !Number.isSafeInteger(t.position) || t.position < 0) || new Set(themes.map(t => t.position)).size !== themes.length) throw new Error('Invalid theme order');
    themes.sort((a,b) => a.position - b.position);
    const extra = /** @type {Record<string, unknown>} */ ({});
    for (const [key, predicate] of [['legacyIdentifier', FLIX + 'legacyIdentifier'], ['carouselQuery', FLIX + 'carouselQuery'], ['dateCreated', SDO + 'dateCreated'], ['dateModified', SDO + 'dateModified']]) {const v = value(node, predicate, true); if (v) extra[key] = v;}
    const creator = objects(node, SDO + 'creator')[0];
    if (creator) extra.creator = {url: creator.value, name: value(creator, SDO + 'name'), description: value(creator, SDO + 'description', true), logo: value(creator, SDO + 'logo', true)};
    const organisation = value(node, FLIX + 'organisation'); const slug = value(node, SDO + 'identifier');
    if (node.termType !== 'NamedNode' || node.value !== canonicalStory(new URL(document).origin, organisation, slug)) throw new Error('Invalid canonical story identity');
    return {id: value(node, FLIX + 'id'), organisation, revision: Number(value(node, SDO + 'version')), config: {version: 2, slug, title: value(node, SDO + 'name'), headline: value(node, SDO + 'headline', true), description: value(node, SDO + 'description', true), coverImage: value(node, SDO + 'image', true), themes: themes.map(t => t.theme), ...extra}, source: {scope: 'organisation', endpoint: value(node, FLIX + 'endpoint'), url: value(node, SDO + 'publisher')}};
  });
  const next = value(root, HYDRA + 'next', true);
  let nextOffset = null;
  if (next) {const target = new URL(next, document); const here = new URL(document); if (target.origin !== here.origin || target.pathname.replace(/\.(ttl|nt|nq|trig|n3)$/, '') !== here.pathname.replace(/\.(ttl|nt|nq|trig|n3)$/, '')) throw new Error('Unsafe repository pagination'); nextOffset = Number(target.searchParams.get('offset')); if (!target.searchParams.has('offset')) throw new Error('Missing offset');}
  return repositorySchema.parse({version: 2, stories, nextOffset});
}
