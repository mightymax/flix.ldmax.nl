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
