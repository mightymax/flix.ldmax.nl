<script lang="ts">
  import { Gallery , P, Heading, Popover, Breadcrumb, BreadcrumbItem } from "flowbite-svelte";
  let loading = $state(true);
  import { onMount } from 'svelte';
	onMount(() => loading = false);

  const { data } = $props();
  let i = 0
  const images = $derived(
    data.archivalObjects.map((archivalObject) => ({
      src: archivalObject.imageUrl[0],
      alt: archivalObject.description.join(' '),
      id: `image-${i++}`,
      href: `/${data.params.identifier}/${data.params.category}/${encodeURIComponent(archivalObject.id)}`
    }))
  );
</script>
<Breadcrumb aria-label="Kruimelpad" class="mb-4">
  <BreadcrumbItem href="/" home>Home</BreadcrumbItem>
  <BreadcrumbItem href="/{data.identifier}">{data.flixName}</BreadcrumbItem>
  <BreadcrumbItem>{data.page.name}</BreadcrumbItem>
</Breadcrumb>
<svelte:head>
  <title>{data.page.name}</title>
</svelte:head>
{#if loading}
  <div class="flex items-center justify-center h-screen">
    <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
{:else}
  <Heading class="mb-4 text-md md:text-4xl" tag="h1">{data.page.name}</Heading>
  <P class="mb-4">{@html data.page.description}</P>
  <Gallery items={images} class="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
  {#snippet figure(item)}
    <a href="{(item as {href: string}).href}">
      <img src={item.src} alt={item.alt} id={(item as {id: string}).id} class="h-auto max-w-full" />
    </a>
    <Popover class="w-64 text-sm font-light " placement="bottom-end"  triggeredBy="#{(item as {id: string}).id}" trigger="hover">{item.alt}</Popover>
  {/snippet}
  </Gallery>
{/if}
