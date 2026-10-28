/** Apply paging to the managed query without changing literals or nested user limits.
 * @param {import('sparqljs').ConstructQuery} query @param {number} limit @param {number} offset
 */
export function paginateQuery(query, limit, offset) {
  /** @param {unknown} value @returns {{limit?: number; offset?: number} | undefined} */
  function findPage(value) {
    if (!value || typeof value !== 'object') return;
    const node = /** @type {Record<string, unknown>} */ (value);
    if (node.type === 'query' && typeof node.limit === 'number') return /** @type {{limit: number; offset?: number}} */ (node);
    for (const child of Object.values(node)) {
      for (const item of Array.isArray(child) ? child : [child]) {
        const found = findPage(item);
        if (found) return found;
      }
    }
  }
  const paginated = findPage(query) ?? /** @type {{limit?: number; offset?: number}} */ (/** @type {unknown} */ (query));
  paginated.limit = limit;
  paginated.offset = offset;
}
