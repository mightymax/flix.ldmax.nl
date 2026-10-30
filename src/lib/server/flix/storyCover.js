/** @param {{ carouselItems(): Promise<Array<{ src: string }>> }} story */
export async function storyCover(story) {
  try {
    const images = await story.carouselItems();
    return images.find(image => /^https?:\/\//i.test(image.src))?.src;
  } catch {
    // An unavailable source must not prevent browsing the story catalogue.
    return undefined;
  }
}
