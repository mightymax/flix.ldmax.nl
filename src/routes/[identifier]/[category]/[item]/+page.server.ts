import { error } from '@sveltejs/kit';

export const load = async ( { params, locals } ) => {
  const item = params.item;
  const subFlix = locals.flix.getFlix(params.identifier ?? '');
  if (!subFlix) {
    throw error(404, `Flix "${params.identifier}" niet gevonden.`);
  }
  const page = subFlix.getPage(params.category);
  if (!page) {
    throw error(404, `Pagina "${params.category}" niet gevonden.`);
  }
  const archivalObject = await page.getArchivalObject(item);
  if (!archivalObject) {
    throw error(404, `Item "${item}" niet gevonden in pagina "${params.category}".`);
  }
  let bindings: {o: string, p: string}[] = []
  try {
    bindings = (await archivalObject.loadBindings()).flatMap(binding => {
      const predicate = binding.get('p');
      const object = binding.get('o');
      if (!predicate || !object) return [];
      return [{p: predicate.value, o: object.termType === 'Literal' ? JSON.stringify(object.value) : object.value}];
    });
  } catch {
    console.error(`Error fetching bindings for item "${item}" in page "${params.category}" of flix "${params.identifier}".`);
  }

  return { bindings, flixName: subFlix.name, item, archivalObject: archivalObject.toJson(), page: page.toJSON(), params: { ...params } };
}
