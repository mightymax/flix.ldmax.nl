export const load = ({ locals }) => ({
  hasStoryLink: locals.hasStoryLink ?? false,
  storyPreview: locals.storyPreview ?? null,
  siteName: locals.flix.name,
  siteAbout: locals.flix.about,
  collections: locals.flix.pages.map(collection => collection.toJSON())
});
