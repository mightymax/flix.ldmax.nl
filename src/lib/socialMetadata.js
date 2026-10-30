export const defaultDescription = 'Ontdek erfgoed in beeld. Bijzondere beelden en verhalen uit de collecties van archieven en instellingen.';

/** Convert configured HTML to a compact plain-text preview. @param {string | undefined} html */
export function previewText(html) {
  /** @type {Record<string, string>} */
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return (html ?? '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? match;
      const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : ' ';
    }).replace(/\s+/g, ' ').trim().slice(0, 240);
}

/** @param {{title?: string, description?: string, image?: string, imageAlt?: string, url: string | URL, fallbackImage: string}} input */
export function socialMetadata(input) {
  const url = new URL(input.url);
  const canonical = new URL(url.pathname, url.origin).href;
  const fallback = new URL(input.fallbackImage, url.origin).href;
  let image = fallback;
  try {
    const candidate = new URL(input.image || fallback, url);
    if (['http:', 'https:'].includes(candidate.protocol) && !/\.svg(?:$|[?#])/i.test(candidate.pathname)) image = candidate.href;
  } catch { /* Keep the bundled preview if the configured URL is invalid. */ }
  return {
    title: previewText(input.title) || 'ErfgoedFlix — Verhalen in beeld',
    description: previewText(input.description) || defaultDescription,
    canonical,
    image,
    imageAlt: input.imageAlt || 'ErfgoedFlix — ontdek erfgoed in beeld',
    defaultImage: image === fallback
  };
}
