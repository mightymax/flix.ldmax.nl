<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements';
  import { A, ControlButton, Img, img } from 'flowbite-svelte';
  import { goto } from '$app/navigation';

  let { images, ...restProps }: { images: (HTMLImgAttributes & {href: string})[]} = $props();

  let container: HTMLDivElement;

  const scrollByAmount = 300;

  function scrollLeft() {
    container.scrollBy({ left: -scrollByAmount, behavior: 'smooth' });
  }

  function scrollRight() {
    container.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
  }
</script>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
<div class="relative w-100% overflow-hidden">
  <!-- Scrollable image container -->
  <div
    bind:this={container}
    class="flex overflow-x-auto scroll-smooth whitespace-nowrap no-scrollbar px-4 py-2"
  >
    {#each images as image}
      <Img
        src={image.src}
        alt={image.alt || 'Image'}
        class="inline-block h-48 object-cover rounded mr-4 shadow cursor-pointer"
        onclick={() => goto(image.href)}
      />
    {/each}
  </div>

  <!-- Left arrow -->
  <ControlButton forward={false} onclick={scrollLeft}/>
  <!-- <button
    onclick={scrollLeft}
    class="absolute top-1/2 left-2 transform -translate-y-1/2 z-10 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 shadow"
    aria-label="Scroll left"
  >
    ◀
  </button> -->

  <!-- Right arrow -->
  <ControlButton forward={true} onclick={scrollRight}/>
  <!-- <button
    onclick={scrollRight}
    class="absolute top-1/2 right-2 transform -translate-y-1/2 z-10 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 shadow"
    aria-label="Scroll right"
  >
    ▶
  </button> -->
</div>
