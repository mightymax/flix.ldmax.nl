export const load = async ({ locals, params }) => {
  const identifier = params.identifier;
  const flix = locals.flix.getFlix(identifier);
  const menu = flix.pages.map(page => {
    return {
      name: page.name,
      url: `/categorie/${page.identifier}`,
      description: page.description
    };
  });

  const about = locals.flix.about
  return { menu, name: flix.name, logo: flix.logo, about };
}