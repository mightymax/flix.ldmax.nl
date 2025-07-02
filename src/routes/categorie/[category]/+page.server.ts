import { error } from '@sveltejs/kit';

export const load = async ( { params, locals } ) => {
  const page = locals.flix.getPage(params.category);
  if (!page) {
    error(404, { message: `Pagina "${params.category}" niet gevonden.` });
  }
  return await page.query()
    .then(archivalObjects => {
      return { page: page.toJSON(), params: {...params}, archivalObjects: archivalObjects.map(a => a.toJson()) };
    })
    .catch(e => {
      console.error(`⚠️ Error loading page ${params.category}:`, e.message);
      error(500, { message: e.message });
    })
}
