import { error } from '@sveltejs/kit';

export const load = async ( { params, locals } ) => {
  const item = params.item;
  const page = locals.flix.getPage(params.category);
  if (!page) {
    throw error(404, { message: `Pagina "${params.category}" niet gevonden.` });
  }
  const archivalObject = await page.getArchivalObject(item).then(obj => obj?.toJson());
  return { item, archivalObject, page: page.toJSON()}
}
