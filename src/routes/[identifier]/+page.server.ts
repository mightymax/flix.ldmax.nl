export const load = async ({ locals }) => {
  const { flix } = locals;
  const carouselItems = await flix.carouselItems();
  const pages = flix.pages
  return { name: flix.name, logo: flix.logo, carouselItems, pages: pages.map(p => p.toJSON()) };
}
