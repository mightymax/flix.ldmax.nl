<script lang="ts">
  import { resolve } from '$app/paths';
  import { ArrowUpRightFromSquareOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import Artwork from '#lib/components/Artwork.svelte';
  let { data } = $props();
</script>
<svelte:head><title>{data.page.name} — {data.flixName}</title></svelte:head>
<div class="page-width category-page">
  <nav class="breadcrumbs" aria-label="Kruimelpad"><a href={resolve('/')}>Verhalen</a><ChevronRightOutline size="xs" /><a href={resolve('/[identifier]', {identifier: data.params.identifier})}>{data.flixName?.replace('Beeldbank ', '')}</a><ChevronRightOutline size="xs" /><span aria-current="page">{data.page.name}</span></nav>
  <header class="category-header"><div><p class="eyebrow">Het verhaal / het thema</p><h1>{data.page.name}</h1><div class="rich-text intro-copy">{@html data.page.description ?? ''}</div></div><span class="count-label">{data.archivalObjects.length} beelden geladen</span></header>
  <div class="artwork-grid">
    {#each data.archivalObjects as item (item.id)}
      <a class="artwork-card" aria-label={item.name[0] ?? 'Bekijk dit beeld'} href={resolve('/[identifier]/[category]/[item]', {identifier: data.params.identifier, category: data.params.category, item: encodeURIComponent(item.id)})}>
        <div class="artwork-visual"><Artwork src={item.imageUrl[0]} alt={item.name[0] ?? 'Erfgoedbeeld'} /><span class="artwork-open" aria-hidden="true"><ArrowUpRightFromSquareOutline size="sm" /></span></div>
        <div class="artwork-caption"><h2>{item.name[0] ?? 'Zonder titel'}</h2>{#if item.dateCreated[0]}<span>{item.dateCreated[0]}</span>{/if}</div>
      </a>
    {:else}<p class="empty-state">In dit thema zijn nog geen beelden beschikbaar.</p>{/each}
  </div>
</div>
