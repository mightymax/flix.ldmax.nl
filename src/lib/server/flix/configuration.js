import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { DataFactory, Parser, Store } from 'n3';
import sparqljs from 'sparqljs';

const iri = DataFactory.namedNode;
const type = iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
/** @param {string} name */
const schema = (name) => iri(`https://schema.org/${name}`);
const include = iri('https://erfgoedflix.nl/vocabulary#loadConfig');
/** @param {string} name */
const comunica = (name) => iri(`https://comunica.dev/vocabulary#${name}`);

/** Load each file once. Existing include paths remain relative to the project root. */
export async function loadConfiguration(filename = 'config/config.ttl', baseDirectory = process.cwd()) {
  const store = new Store();
  const files = new Set();
  const pending = [path.resolve(baseDirectory, filename)];
  while (pending.length) {
    const requested = pending.shift();
    if (!requested) break;
    let file;
    let quads;
    try {
      file = await realpath(requested);
      if (files.has(file)) continue;
      quads = new Parser().parse(await readFile(file, 'utf8'));
    } catch (cause) {
      throw new Error(`Cannot load Flix configuration ${requested}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
    }
    files.add(file);
    store.addQuads(quads);
    for (const quad of quads.filter((q) => q.predicate.equals(include))) {
      if (quad.object.termType !== 'Literal' || !quad.object.value.trim()) {
        throw new Error(`Expected a non-empty literal for flix:loadConfig in ${file}`);
      }
      pending.push(path.resolve(baseDirectory, quad.object.value));
    }
  }
  const roots = store.getSubjects(type, schema('WebApplication'), null);
  if (roots.length !== 1 || !['NamedNode', 'BlankNode'].includes(roots[0].termType)) {
    throw new Error('Flix configuration must contain exactly one sdo:WebApplication.');
  }
  return { store, root: roots[0], files: [...files] };
}

/** Offline validation: inspect identifiers and parse queries without contacting endpoints.
 * @param {Awaited<ReturnType<typeof loadConfiguration>>} configuration
 */
export async function validateConfiguration(configuration, baseDirectory = process.cwd()) {
  const { store, root } = configuration;
  const visited = new Set();
  const pending = [root];
  let queries = 0;
  while (pending.length) {
    const parent = pending.shift();
    if (!parent) break;
    if (visited.has(parent.id)) continue;
    visited.add(parent.id);
    const children = new Map([
      ...store.getObjects(parent, schema('hasPart'), null),
      ...store.getSubjects(schema('isPartOf'), parent, null)
    ].map((child) => [child.id, child]));
    const identifiers = new Set();
    for (const child of children.values()) {
      if (child.termType !== 'NamedNode' && child.termType !== 'BlankNode') {
        throw new Error(`Expected a resource for child of ${parent.value}`);
      }
      const ids = store.getObjects(child, schema('identifier'), null);
      if (ids.length !== 1 || ids[0].termType !== 'Literal' || !ids[0].value.trim() || /[/?#]/.test(ids[0].value)) {
        throw new Error(`Expected one route identifier for ${child.value}`);
      }
      if (identifiers.has(ids[0].value)) throw new Error(`Duplicate identifier "${ids[0].value}" under ${parent.value}`);
      identifiers.add(ids[0].value);
      pending.push(child);
    }
  }
  for (const settings of store.getObjects(null, comunica('settings'), null)) {
    const sources = store.getObjects(settings, comunica('source'), null);
    const queryValues = store.getObjects(settings, comunica('query'), null);
    if (sources.length !== 1 || !sources[0].value.trim() || queryValues.length !== 1 || queryValues[0].termType !== 'Literal') {
      throw new Error(`Expected one source and one literal query for ${settings.value}`);
    }
    const value = queryValues[0];
    const query = value.datatype.value === 'https://erfgoedflix.nl/vocabulary#file'
      ? await readFile(path.resolve(baseDirectory, value.value), 'utf8')
      : value.value;
    try {
      const parsed = new sparqljs.Parser().parse(query);
      if (parsed.type !== 'query' || parsed.queryType !== 'CONSTRUCT') throw new Error('Expected a CONSTRUCT query');
    } catch (cause) {
      throw new Error(`Invalid query ${value.value} for ${settings.value}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
    }
    queries++;
  }
  return { files: configuration.files.length, queries };
}
