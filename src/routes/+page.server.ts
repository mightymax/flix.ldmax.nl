export const load = async ({ locals }) => {
  const { flix } = locals;
  return {
    name: flix.name,
    description: flix.description,
    logo: flix.logo,
    about: flix.about,
    flixers: flix.pages.map(page => page.toJSON())
  }
}