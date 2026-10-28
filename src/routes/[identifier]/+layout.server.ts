import { error } from '@sveltejs/kit';
export const load = async ({ locals, params }) => {
  const identifier = params.identifier;
  const flix = locals.flix.getFlix(identifier);
  if (!flix) {
    error(404, 'Collectie niet gevonden.');
  }
  const menu = flix.pages.map(page => {
    return {
      name: page.name,
      url: `/${identifier}/${page.identifier}`,
      description: page.description
    };
  });

  const about = flix.about
  return { menu, name: flix.name, logo: flix.logo, about, identifier, params: {...params} };
}