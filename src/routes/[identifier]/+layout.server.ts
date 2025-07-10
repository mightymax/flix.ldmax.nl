export const load = async ({ locals, params }) => {
  const identifier = params.identifier;
  const flix = locals.flix.getFlix(identifier);
  if (!flix) {
    return { status: 404, error: new Error('Flix not found') };
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