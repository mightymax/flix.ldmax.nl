// Public story contract v2 (organisation-scoped). Kept identical in Erfgoedflix and platform.ldmax.nl.
import {embeddedSelectionQuery} from './selectionQuery.js';
import { z } from 'zod';

export const webUrl = z.string().url().max(2000).refine(value => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}, 'Expected a public HTTP(S) URL without credentials');
export const storySlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
export const selectionSchema = z.object({
  property: z.enum(['about', 'genre', 'additionalType', 'contentLocation', 'locationCreated', 'creator', 'keywords']),
  kind: z.enum(['iri', 'literal']),
  value: z.string().trim().min(1).max(2000)
}).strict().refine(value => value.kind !== 'iri' || webUrl.safeParse(value.value).success, 'Invalid term IRI');
export const themeSchema = z.object({
  id: storySlug, title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).default(''), selection: selectionSchema,
  selectionQuery: z.string().trim().min(1).max(16000).optional(),
  constructQuery: z.string().trim().min(1).max(24000).optional()
}).strict();
export const storyDraftSchema = z.object({
  version: z.literal(2).default(2), slug: storySlug, title: z.string().trim().min(1).max(200),
  headline: z.string().max(300).default(''), description: z.string().max(10000).default(''),
  coverImage: z.union([webUrl, z.literal('')]).default(''),
  legacyIdentifier: z.string().regex(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/).max(100).optional(),
  carouselQuery: z.string().min(1).max(24000).optional(),
  creator: z.object({url: webUrl, name: z.string().max(200), description: z.string().max(10000).default(''), logo: z.union([webUrl, z.literal('')]).default('')}).strict().optional(),
  dateCreated: z.string().datetime().optional(), dateModified: z.string().datetime().optional(),
  themes: z.array(themeSchema).min(1).max(12)
}).strict().refine(value => new Set(value.themes.map(theme => theme.id)).size === value.themes.length, 'Theme identifiers must be unique');
export const publishedStorySchema = z.object({
  id: z.string().uuid(), organisation: z.string().regex(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/).max(100), revision: z.number().int().positive(),
  config: storyDraftSchema,
  source: z.object({ scope: z.literal('organisation'), endpoint: webUrl, url: webUrl }).strict()
}).strict();
export const repositorySchema = z.object({
  version: z.literal(2), stories: z.array(publishedStorySchema).max(100),
  nextOffset: z.number().int().nonnegative().nullable()
}).strict();

/** @param {string} value */
export function iri(value) {
  webUrl.parse(value);
  if (/[<>"{}|^`\\\p{Cc}\s]/u.test(value)) throw new Error('Unsafe IRI');
  return `<${value}>`;
}
/** @param {string} value */
export const literal = value => JSON.stringify(value);
/** @param {string} name */
export const property = name => `(<https://schema.org/${name}>|<http://schema.org/${name}>)`;
/** Scope is the registered public organisation endpoint, supplied by the caller.
 * @param {z.infer<typeof selectionSchema>} [selection]
 */
export function objectPattern(selection) {
  return `?heritageObject a ?objectType .
    VALUES ?objectType { <https://schema.org/CreativeWork> <http://schema.org/CreativeWork> }
    FILTER(isIRI(?heritageObject))
    ${selection ? `?heritageObject ${property(selection.property)} ?selectedTerm .
      ${selection.kind === 'iri' ? `FILTER(?selectedTerm = ${iri(selection.value)} || EXISTS { ?selectedTerm ${property('sameAs')} ${iri(selection.value)} })`
      : `FILTER(isLiteral(?selectedTerm) && STR(?selectedTerm) = ${literal(selection.value)})`}` : ''}`;
}
/** Organisation-wide values actually observed in the endpoint; not invented model keywords. */
export function discoveryQuery() {
  return `SELECT ?property ?kind ?value (SAMPLE(?termName) AS ?label) (COUNT(DISTINCT ?heritageObject) AS ?count) WHERE {
    ${objectPattern()}
    VALUES ?property { "about" "genre" "additionalType" "contentLocation" "locationCreated" "creator" "keywords" }
    BIND(IRI(CONCAT("https://schema.org/", ?property)) AS ?httpsProperty)
    BIND(IRI(CONCAT("http://schema.org/", ?property)) AS ?httpProperty)
    { ?heritageObject ?httpsProperty ?term } UNION { ?heritageObject ?httpProperty ?term }
    OPTIONAL { ?term ${property('sameAs')} ?canonical . FILTER(isIRI(?canonical)) }
    OPTIONAL { ?term ${property('name')} ?termName }
    BIND(IF(isLiteral(?term), "literal", "iri") AS ?kind)
    BIND(IF(isLiteral(?term), STR(?term), STR(COALESCE(?canonical, ?term))) AS ?value)
    FILTER(isLiteral(?term) || isIRI(?canonical) || isIRI(?term))
  } GROUP BY ?property ?kind ?value ORDER BY DESC(?count) ?property ?value LIMIT 50`;
}
/** @param {z.infer<typeof selectionSchema>} selection
 * @param {string} [selectionQuery] */
export function previewQuery(selection, selectionQuery) {
  return `SELECT DISTINCT ?heritageObject ?name ?thumbnail WHERE {
    ${selectionQuery ? `{ ${embeddedSelectionQuery(selectionQuery)} }\n    ${objectPattern()}` : objectPattern(selection)}
    OPTIONAL { ?heritageObject ${property('name')} ?name }
    OPTIONAL { ?heritageObject ${property('associatedMedia')}/${property('thumbnailUrl')} ?thumbnail }
  } ORDER BY ?heritageObject LIMIT 5`;
}
/** @param {z.infer<typeof selectionSchema>} selection
 * @param {string} [selectionQuery] */
export function storyQuery(selection, selectionQuery) {
  return `PREFIX sdo: <https://schema.org/>
  CONSTRUCT {
    ?heritageObject a sdo:ArchivalObject; sdo:name ?name; sdo:description ?description;
      sdo:dateCreated ?date; sdo:imageUrl ?thumbnail; sdo:associatedMedia ?media .
    ?media a ?mediaType; sdo:contentUrl ?content; sdo:thumbnailUrl ?thumbnail;
      sdo:encodingFormat ?format; sdo:license ?license; sdo:copyrightNotice ?notice .
  } WHERE {
    { SELECT DISTINCT ?heritageObject WHERE {
      ${selectionQuery ? `{ ${embeddedSelectionQuery(selectionQuery)} }\n    ${objectPattern()}` : objectPattern(selection)}
      #{ITEM_FILTER}
    } ORDER BY ?heritageObject LIMIT 20 OFFSET 0 }
    OPTIONAL { ?heritageObject ${property('name')} ?name }
    OPTIONAL { ?heritageObject ${property('description')} ?description }
    OPTIONAL { ?heritageObject ${property('dateCreated')} ?date }
    OPTIONAL { ?heritageObject ${property('associatedMedia')} ?media .
      OPTIONAL { ?media a ?mediaType }
      OPTIONAL { ?media ${property('contentUrl')} ?content }
      OPTIONAL { ?media ${property('thumbnailUrl')} ?thumbnail }
      OPTIONAL { ?media ${property('encodingFormat')} ?format }
      OPTIONAL { ?media ${property('license')} ?license }
      OPTIONAL { ?media ${property('copyrightNotice')} ?notice }
    }
  }`;
}

/** @param {z.infer<typeof selectionSchema>} selection */
export function defaultSelectionQuery(selection) {
  return `SELECT DISTINCT ?heritageObject WHERE {\n  ${objectPattern(selection)}\n} ORDER BY ?heritageObject`;
}
