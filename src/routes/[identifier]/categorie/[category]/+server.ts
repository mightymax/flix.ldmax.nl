import { error, json, type RequestHandler } from '@sveltejs/kit';
export const GET: RequestHandler = async ({ locals, params }) => {
  const page = locals.flix.getPage(params.category!);
  if (!page) {
    error(404, { message: `Pagina "${params.category}" niet gevonden.` });
  }
  const itemsPerPage = 10
  return await page.query({ itemsPerPage })
    .then(archivalObjects => {
      return json(archivalObjects.map(a => a.toJson()));
    })
    .catch(e => {
      console.error(`⚠️ Error loading page ${params.category}:`, e.message);
      error(500, { message: e.message });
    })
}
