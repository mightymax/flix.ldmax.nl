import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const { flix } = locals;
  const subFlix = flix.getFlix(params.identifier);
  if (!subFlix) {
    throw error(404, { message: `Flix ${params.identifier} not found` });
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
