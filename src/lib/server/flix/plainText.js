/** Managed story descriptions are plain text, never executable HTML/Markdown.
 * @param {string} text
 */
export function plainTextHtml(text) {
  return '<p>' + text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('\n', '<br>') + '</p>';
}
