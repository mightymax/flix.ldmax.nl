/** @param {string | undefined} value */
function safeUrl(value) {
  if (!value) return undefined;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? value : undefined; }
  catch { return undefined; }
}
/** @param {string} value */
export function isPresentationManifest(value) {
  return /^application\/(?:ld\+json|json)\s*;\s*profile\s*=\s*["']?https?:\/\/iiif\.io\/api\/presentation\/[23]\/context\.json["']?\s*$/i.test(value);
}
/** Preserve media identity, content/thumbnail separation, and rights.
 * @param {import('@rdfjs/types').Quad[]} quads
 * @param {import('@rdfjs/types').Quad_Subject} subject
 */
export function mediaFromQuads(quads, subject) {
  /** @param {import('@rdfjs/types').Term} node @param {string} key */
  const values = (node, key) => quads.filter(q => q.subject.equals(node) && ['https://schema.org/', 'http://schema.org/'].some(ns => q.predicate.value === ns + key)).map(q => q.object);
  const media = [...new Map(values(subject, 'associatedMedia').map(node => [node.termType + ':' + node.value, node])).values()];
  return media.map(node => {
    const format = values(node, 'encodingFormat')[0]?.value ?? '';
    return {
      id: node.value,
      manifestUrl: isPresentationManifest(format) && node.termType === 'NamedNode' ? safeUrl(node.value) : undefined,
      contentUrl: safeUrl(values(node, 'contentUrl')[0]?.value),
      thumbnailUrl: safeUrl(values(node, 'thumbnailUrl')[0]?.value),
      license: safeUrl(values(node, 'license')[0]?.value),
      copyrightNotice: values(node, 'copyrightNotice')[0]?.value
    };
  });
}
