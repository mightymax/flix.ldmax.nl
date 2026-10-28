<script lang="ts">
  import { ChevronLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import Artwork from './components/Artwork.svelte';
  let { images, label = 'Beelden' }: {images: {href: string; src?: string; alt?: string; title?: string}[]; label?: string} = $props();
  let container: HTMLDivElement;
  function scroll(direction: number) {
    container.scrollBy({left: direction * container.clientWidth * .8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
</script>
<div class="image-scroller">
  <div class="image-track" bind:this={container}>
    {#each images as image (image.href)}
      <!-- URLs are resolved by the collection page before being passed in. -->
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="image-card" href={image.href} aria-label={image.title || image.alt || 'Bekijk dit beeld'}>
        <div class="image-card-visual"><Artwork src={image.src} alt={image.alt ?? image.title ?? 'Erfgoedbeeld'} /></div>
        <span class="image-card-title">{image.title || image.alt || 'Bekijk dit beeld'}</span>
      </a>
    {/each}
  </div>
  {#if images.length > 3}
    <div class="scroller-controls"><span>Er is meer te zien</span><button class="icon-button" aria-label={`Vorige beelden: ${label}`} onclick={() => scroll(-1)}><ChevronLeftOutline size="sm" /></button><button class="icon-button" aria-label={`Volgende beelden: ${label}`} onclick={() => scroll(1)}><ChevronRightOutline size="sm" /></button></div>
  {/if}
</div>
