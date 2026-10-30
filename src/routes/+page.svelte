<script lang="ts">
  import { Input } from 'flowbite-svelte';
  import { resolve } from '$app/paths';
  import { ArrowRightOutline } from 'flowbite-svelte-icons';
  import CollectionCover from '#lib/components/CollectionCover.svelte';
  let { data } = $props();
  let search = $state('');
  const stories = $derived(data.flixers.filter(story => `${story.name ?? ''} ${story.headline ?? ''}`.toLocaleLowerCase('nl').includes(search.trim().toLocaleLowerCase('nl'))));
</script>
<svelte:head><title>Ontdek de verhalen — Erfgoedflix</title></svelte:head>
<div class="page-width home-page">
  <section class="home-intro">
    <p class="eyebrow"><span class="accent-line"></span> Een andere kijk op vroeger</p>
    <h1>Er is zoveel te <em>ontdekken.</em></h1>
    <p class="intro-copy">Bijzondere beelden, grote verhalen en kleine details.<br class="desktop-break" /> Dwaal door het verleden, één verhaal tegelijk.</p>
    <a class="text-link" href="#verhalen">Ontdek de verhalen <ArrowRightOutline size="sm" /></a>
    <span class="intro-index" aria-hidden="true">EF / OPEN ARCHIEF</span>
  </section>
  <section id="verhalen" class="home-collections">
    <div class="section-heading"><div><p class="eyebrow">Open om te ontdekken</p><h2>De verhalen</h2></div><span class="muted">{String(data.flixers.length).padStart(2, '0')} verhalen</span></div>
    <div class="story-filter"><Input type="search" aria-label="Zoek verhalen op titel of ondertitel" placeholder="Zoek een verhaal…" bind:value={search} /></div>
    <p class="muted story-result-count" role="status">{stories.length} verhalen gevonden</p>
    <div class="collection-grid">
      {#each stories as flix, index (flix.identifier)}
        <a class="collection-card" href={resolve('/[identifier]', {identifier: flix.identifier!})}>
          <CollectionCover title={flix.name ?? 'Collectie'} src={flix.coverImage || resolve('/api/story-cover/[identifier]', { identifier: flix.identifier! })} headline={flix.headline} alternate={index % 2 === 1} />
          <div class="collection-card-content"><h3>{flix.name?.replace('Beeldbank ', '')}</h3><div class="rich-text collection-description">{@html flix.description ?? ''}</div><span class="text-link">Bekijk het verhaal <ArrowRightOutline size="sm" /></span></div>
        </a>
      {/each}
    </div>
    {#if stories.length === 0}<p>Geen verhalen gevonden. Probeer een andere zoekterm.</p>{/if}
  </section>
  <section class="home-note"><span class="eyebrow">Verbonden erfgoed</span><h2>Verschillende bronnen.<br />Eindeloos veel verhalen.</h2><div class="rich-text">{@html data.description}</div></section>
</div>
