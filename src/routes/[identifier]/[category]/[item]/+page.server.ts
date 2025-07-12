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
  const archivalObject = await page.getArchivalObject(item);
  if (!archivalObject) {
    throw error(404, { message: `Item "${item}" niet gevonden in pagina "${params.category}".` });
  }
  let bindings: {o: string, p: string}[] = []
  try {
    bindings = JSON.parse(`[${await archivalObject.loadBindings()}]`);
  } catch {
    console.error(`Error fetching bindings for item "${item}" in page "${params.category}" of flix "${params.identifier}".`);
  }

  return { bindings, flixName: subFlix.name, item, archivalObject: archivalObject.toJson(), page: page.toJSON(), params: { ...params } };
}
