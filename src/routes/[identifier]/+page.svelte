<script lang="ts">
  import { resolve } from '$app/paths';
  import { SvelteMap } from 'svelte/reactivity';
  import { ArrowRightOutline, ArrowDownOutline, ChevronLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import ImageScroller from '#lib/ImageScroller.svelte';
  import Artwork from '#lib/components/Artwork.svelte';
  import type { ArchivalObject } from '#lib/types.js';
  let { data } = $props();
  let selected = $state(0);
  const current = $derived(data.carouselItems[selected % (data.carouselItems.length || 1)]);
  const currentTitle = $derived(data.pages.find(category => category.identifier === current?.id)?.name ?? current?.title ?? data.name);
  const previews = new SvelteMap<string, {items: ArchivalObject[]; error?: string}>();
  async function loadPreview(identifier: string, category: string, signal?: AbortSignal) {
    previews.delete(`${identifier}/${category}`);
    try {
      const response = await fetch(resolve('/[identifier]/[category]', {identifier, category}), {headers: {Accept: 'application/json'}, signal});
      if (!response.ok) throw new Error('De beelden konden niet worden geladen.');
      const items: ArchivalObject[] = await response.json();
      if (!signal?.aborted) previews.set(`${identifier}/${category}`, {items});
    } catch (error) {
      if (!signal?.aborted) previews.set(`${identifier}/${category}`, {items: [], error: error instanceof Error ? error.message : 'Laden mislukt.'});
    }
  }
  $effect(() => {
    const controller = new AbortController();
    const identifier = data.identifier;
    for (const category of data.pages) if (category.identifier) void loadPreview(identifier, category.identifier, controller.signal);
    return () => controller.abort();
  });
</script>
<svelte:head><title>{data.name} — Erfgoedflix</title></svelte:head>
<div class="page-width collection-page">
  <div class="collection-kicker"><p class="eyebrow">Het verhaal</p><span>{data.pages.length} thema’s om te verkennen</span></div>
  <section class="collection-hero" aria-label="Uitgelicht in het verhaal">
    {#if current}<div class="hero-image"><Artwork src={current.src} alt={currentTitle} loading="eager" /></div>{/if}
    <div class="hero-shade"></div>
    <div class="hero-content"><p class="hero-eyebrow"><span></span> {data.name.replace('Beeldbank ', '')}</p><h1>{currentTitle}</h1><p>Een beeld zegt meer.<br />Ontdek de verhalen achter het verhaal.</p>
      {#if current?.id}<a class="hero-button" href={resolve('/[identifier]/[category]', {identifier: data.identifier, category: current.id})}>Verken dit thema <ArrowRightOutline size="sm" /></a>{:else}<a class="hero-button" href="#themas">Ontdek de thema’s <ArrowDownOutline size="sm" /></a>{/if}
    </div>
    {#if data.carouselItems.length > 1}
      <div class="hero-controls"><div class="hero-indicators">{#each data.carouselItems as item, index (item.id)}<button aria-label={`Toon ${item.title}`} aria-pressed={selected % data.carouselItems.length === index} class={{chosen: selected % data.carouselItems.length === index}} onclick={() => selected = index}></button>{/each}</div><span>{String(selected % data.carouselItems.length + 1).padStart(2, '0')} <span class="hero-count">/ {String(data.carouselItems.length).padStart(2, '0')}</span></span><button class="hero-control" aria-label="Vorig uitgelicht thema" onclick={() => selected = (selected - 1 + data.carouselItems.length) % data.carouselItems.length}><ChevronLeftOutline size="sm" /></button><button class="hero-control" aria-label="Volgend uitgelicht thema" onclick={() => selected = (selected + 1) % data.carouselItems.length}><ChevronRightOutline size="sm" /></button></div>
    {/if}
  </section>
  <div class="collection-caption"><span>BEELDEN DIE BLIJVEN</span><a href="#themas">Blader door de thema’s <ArrowDownOutline size="xs" /></a></div>
  <section id="themas" class="themes-section">
    <div class="section-heading"><div><p class="eyebrow">Volg je nieuwsgierigheid</p><h2>Duik in een thema</h2></div><span class="muted">Uit het verhaal</span></div>
    <nav class="theme-index" aria-label="Spring naar een thema">{#each data.pages as category, index (category.identifier)}<a href={`#thema-${category.identifier}`}><span>{String(index + 1).padStart(2, '0')}</span>{category.name}<ArrowDownOutline size="xs" /></a>{/each}</nav>
    {#each data.pages as category, index (category.identifier)}
      {@const preview = previews.get(`${data.identifier}/${category.identifier}`)}
      <section class="theme-row" id={`thema-${category.identifier}`}>
        <div class="section-heading"><div class="theme-title"><span class="theme-number">{String(index + 1).padStart(2, '0')}</span><h3>{category.name}</h3></div><a class="text-link" href={resolve('/[identifier]/[category]', {identifier: data.identifier, category: category.identifier!})}>Bekijk het thema <ArrowRightOutline size="sm" /></a></div>
        {#if preview?.error}<div class="empty-state" role="status"><p>{preview.error}</p><button class="text-link" onclick={() => loadPreview(data.identifier, category.identifier!)}>Opnieuw proberen <ArrowRightOutline size="sm" /></button></div>
        {:else if preview?.items.length === 0}<p class="empty-state">Er zijn nog geen beelden beschikbaar in dit thema.</p>
        {:else if preview}<ImageScroller label={category.name} images={preview.items.map(item => ({href: resolve('/[identifier]/[category]/[item]', {identifier: data.identifier, category: category.identifier!, item: encodeURIComponent(item.id)}), src: item.imageUrl[0], title: item.name[0], alt: item.name[0] ?? 'Erfgoedbeeld'}))} />
        {:else}<div class="skeleton-row" role="status" aria-label={`Beelden laden: ${category.name}`}>{#each [1, 2, 3, 4] as slot (slot)}<div class="skeleton"></div>{/each}</div>{/if}
      </section>
    {/each}
  </section>
</div>
