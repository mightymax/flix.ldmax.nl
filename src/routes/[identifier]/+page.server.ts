import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const { flix } = locals;
  const subFlix = flix.getFlix(params.identifier);
  if (!subFlix) {
    throw error(404, `Flix ${params.identifier} not found`);
  }
  const carouselItems = await subFlix.carouselItems();
  const pages = subFlix.pages
  return {
    name: subFlix.name,
    logo: subFlix.logo,
    description: subFlix.description,
    coverImage: flix.pages.find(page => page.identifier === params.identifier)?.coverImage,
    carouselItems,
    identifier: params.identifier,
    pages: pages.map(p => p.toJSON()) };
}
