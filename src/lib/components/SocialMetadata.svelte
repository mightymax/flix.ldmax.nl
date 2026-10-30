<script lang="ts">
  import { page } from '$app/state';
  import { asset } from '$app/paths';
  import { socialMetadata } from '#lib/socialMetadata.js';
  const object = $derived(page.data.archivalObject);
  const theme = $derived(page.data.page);
  const title = $derived(object?.name[0] || theme?.name || (page.params.identifier ? page.data.name : undefined));
  const metadata = $derived(socialMetadata({
    title: title ? `${title} — ErfgoedFlix` : undefined,
    description: object?.description[0] || theme?.description || page.data.description,
    image: object?.imageUrl[0] || theme?.coverImage || page.data.archivalObjects?.find((item: {imageUrl: string[]}) => item.imageUrl[0])?.imageUrl[0] || page.data.coverImage || page.data.carouselItems?.find((item: {src: string}) => item.src)?.src,
    imageAlt: title,
    url: page.url.href,
    fallbackImage: asset('images/social-preview.png')
  }));
</script>

<svelte:head>
  <meta name="description" content={metadata.description} />
  <link rel="canonical" href={metadata.canonical} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ErfgoedFlix" />
  <meta property="og:locale" content="nl_NL" />
  <meta property="og:title" content={metadata.title} />
  <meta property="og:description" content={metadata.description} />
  <meta property="og:url" content={metadata.canonical} />
  <meta property="og:image" content={metadata.image} />
  <meta property="og:image:alt" content={metadata.imageAlt} />
  {#if metadata.defaultImage}
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={metadata.title} />
  <meta name="twitter:description" content={metadata.description} />
  <meta name="twitter:image" content={metadata.image} />
  <meta name="twitter:image:alt" content={metadata.imageAlt} />
  {#if page.data.hasStoryLink}<meta name="robots" content="noindex, nofollow" />{/if}
</svelte:head>
