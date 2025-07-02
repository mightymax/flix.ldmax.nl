export const load = async ({ locals }) => {
  const menu = locals.flix.pages.map(page => {
    return {
      name: page.name,
      url: `/categorie/${page.identifier}`,
      description: page.description
    };
  });

  const about = locals.flix.about
  return { menu, name: locals.flix.name, logo: locals.flix.logo, about };
}