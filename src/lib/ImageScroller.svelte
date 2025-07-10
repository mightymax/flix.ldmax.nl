<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements';
  import { ControlButton, Img } from 'flowbite-svelte';
  import { goto } from '$app/navigation';

  let { images, ..._restProps }: { images: (HTMLImgAttributes & {href: string})[]} = $props();

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

  <ControlButton forward={false} onclick={scrollLeft}/>
  <ControlButton forward={true} onclick={scrollRight}/>
</div>
