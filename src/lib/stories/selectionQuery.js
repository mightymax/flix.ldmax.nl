import sparqljs from 'sparqljs';
/** A theme selects object IRIs; media construction and pagination stay managed.
 * @param {string} query
 */
export function validateSelectionQuery(query) {
  let parsed;
  try {parsed = new sparqljs.Parser().parse(query);}
  catch {throw new Error('De SPARQL-query bevat een syntaxfout.');}
  if (parsed.type !== 'query' || parsed.queryType !== 'SELECT' || parsed.variables.length !== 1 ||
      !('termType' in parsed.variables[0]) || parsed.variables[0].termType !== 'Variable' || !('value' in parsed.variables[0]) || parsed.variables[0].value !== 'heritageObject') {
    throw new Error('Gebruik SELECT DISTINCT ?heritageObject om de objecten voor dit thema te selecteren.');
  }
  /** @param {unknown} value */
  function inspect(value) {
    if (!value || typeof value !== 'object') return;
    const node = /** @type {Record<string, unknown>} */ (value);
    if (node.type === 'service' || node.from) throw new Error('Gebruik de organisatiebron zonder SERVICE of FROM.');
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(inspect);
      else inspect(child);
    }
  }
  inspect(parsed);
  return query;
}

/** Normalize prefixes before embedding a SELECT as a subquery. @param {string} query */
export function embeddedSelectionQuery(query) {
  validateSelectionQuery(query);
  const parsed = new sparqljs.Parser().parse(query);
  if (parsed.type !== 'query') throw new Error('Ongeldige query.');
  parsed.prefixes = {};
  return new sparqljs.Generator().stringify(parsed);
}

/** Preserve legacy metadata mappings without permitting remote services or writes.
 * @param {string} query @param {boolean} [requireObject] */
export function validateConstructQuery(query, requireObject = true) {
  let parsed;
  try {parsed = new sparqljs.Parser().parse(query);} catch {throw new Error('Ongeldige CONSTRUCT-query.');}
  if (parsed.type !== 'query' || parsed.queryType !== 'CONSTRUCT') throw new Error('Gebruik een CONSTRUCT-query.');
  /** @param {unknown} value */
  function inspect(value) {
    if (!value || typeof value !== 'object') return;
    const node = /** @type {Record<string, unknown>} */ (value);
    if (node.type === 'service' || node.from) throw new Error('SERVICE en FROM zijn niet toegestaan.');
    Object.values(node).forEach(child => Array.isArray(child) ? child.forEach(inspect) : inspect(child));
  }
  inspect(parsed);
  if (requireObject && !parsed.template?.some(t => t.subject.termType === 'Variable' && t.subject.value === 'heritageObject')) throw new Error('De query moet ?heritageObject beschrijven.');
  return query;
}
/** Preview legacy CONSTRUCT mappings through the existing read-only SELECT service.
 * @param {string} query */
export function constructPreviewQuery(query) {
  validateConstructQuery(query);
  const parsed = new sparqljs.Parser().parse(query);
  if (parsed.type !== 'query' || parsed.queryType !== 'CONSTRUCT') throw new Error('Ongeldige query.');
  const variables = [{termType: 'Variable', value: 'heritageObject'}, {termType: 'Variable', value: 'name'},
    {expression: {termType: 'Variable', value: 'imageUrl'}, variable: {termType: 'Variable', value: 'thumbnail'}}];
  return new sparqljs.Generator().stringify(/** @type {import('sparqljs').SelectQuery} */ (/** @type {unknown} */ ({type: 'query', queryType: 'SELECT', prefixes: parsed.prefixes, distinct: true, variables, where: parsed.where, limit: 5})));
}
