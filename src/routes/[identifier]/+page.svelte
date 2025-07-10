<script lang="ts">
  import type { HTMLImgAttributes } from "svelte/elements";
  import { Spinner, Carousel, Controls, Heading, Button, Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
  import ImageScroller from '$lib/ImageScroller.svelte';
  import { onMount } from 'svelte';
  import { ChevronDoubleRightOutline } from 'flowbite-svelte-icons';
  const { data } = $props();
  const images = $derived(data.carouselItems ?? []);
  let archivalObjectsPerPage = $state(new Map<string, FlixObject.ArchivalObject[]>())
  onMount(() => {
    (data.pages ?? []).forEach(async (page) => {
      fetch(`/${data.identifier}/${page.identifier}`, { headers: { 'Accept': 'application/json' } })
        .then(response => response.json())
        .then((archivalObjects: FlixObject.ArchivalObject[]) => {
          archivalObjectsPerPage.set(page.identifier!, archivalObjects);
          archivalObjectsPerPage = new Map(archivalObjectsPerPage);
        })
        .catch(e =>console.error(`Failed to load "/${data.identifier}/${page.identifier}": ${e.message}`))
    });
  }); 
  let image: HTMLImgAttributes | undefined = $state();
</script>
<Breadcrumb aria-label="Kruimelpad" class="mb-4">
  <BreadcrumbItem href="/" home>Home</BreadcrumbItem>
  <BreadcrumbItem href="/{data.identifier}">{data.name}</BreadcrumbItem>
</Breadcrumb>
<Carousel {images} onchange={(detail) => (image = detail)} class="min-h-[480px] mb-4">
    {#snippet slide({ index, Slide })}
      <a href="/{data.identifier}/{images[index]?.id}">
        <Slide image={images[index]} />
      </a>
      <a href="/{data.identifier}/{images[index]?.id}">
        <Heading tag="h2" class="uppercase h-20 rounded-sm bg-gray-300/50 p-5 text-center relative">{images[index].title}</Heading>
      </a>
    {/snippet}
    <Controls />
</Carousel>
{#each (data.pages ?? []) as page}
<div class="flex items-center justify-between">
  <Heading tag="h3" class="my-4 uppercase" hidden={!archivalObjectsPerPage.has(page.identifier!)}>{page.name}</Heading>
  <Button href="/{data.identifier}/{page.identifier}">Bekijk alles <ChevronDoubleRightOutline /></Button>
</div>
<span class:hidden={archivalObjectsPerPage.has(page.identifier!)}><Spinner /></span>
<ImageScroller images={archivalObjectsPerPage.get(page.identifier!)?.map(i => { return {href: `/${data.identifier}/${page.identifier}/${encodeURIComponent(i.id)}`, src: i.imageUrl![0]}}) ?? []} />
{/each}
