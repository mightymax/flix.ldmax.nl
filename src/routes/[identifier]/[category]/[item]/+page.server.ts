import { error } from '@sveltejs/kit';

export const load = async ( { params, locals } ) => {
  const item = params.item;
  const subFlix = locals.flix.getFlix(params.identifier ?? '');
  if (!subFlix) {
    throw error(404, { message: `Flix "${params.identifier}" niet gevonden.`  });
  }
  const page = subFlix.getPage(params.category);
  if (!page) {
    throw error(404, { message: `Pagina "${params.category}" niet gevonden.` });
  }
  const archivalObject = await page.getArchivalObject(item).then(obj => obj?.toJson());
  return { flixName: subFlix.name, item, archivalObject, page: page.toJSON(), params: { ...params } };
}
