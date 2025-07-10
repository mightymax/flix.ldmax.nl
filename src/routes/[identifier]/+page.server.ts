export const load = async ({ locals, params }) => {
  const { flix } = locals;
  const subFlix = flix.getFlix(params.identifier);
  if (!subFlix) {
    return { status: 404, error: new Error('Flix not found') };
  }
  const carouselItems = await subFlix.carouselItems();
  const pages = subFlix.pages
  return { 
    name: subFlix.name, 
    logo: subFlix.logo, 
    carouselItems, 
    identifier: params.identifier,
    pages: pages.map(p => p.toJSON()) };
}
