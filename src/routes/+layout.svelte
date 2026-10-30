<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { DarkMode, Modal, Input } from 'flowbite-svelte';
  import { ArrowUpRightFromSquareOutline, BarsOutline, CloseOutline } from 'flowbite-svelte-icons';
  let { children, data } = $props();
  let menuOpen = $state(false);
  let aboutOpen = $state(false);
  let siteAbout = $state(false);
  let search = $state('');
  const collections = $derived(data.collections.filter(collection => `${collection.name ?? ''} ${collection.headline ?? ''}`.toLocaleLowerCase('nl').includes(search.trim().toLocaleLowerCase('nl'))));
  const about = $derived(siteAbout ? data.siteAbout : (page.data.about ?? data.siteAbout));
  afterNavigate(() => { menuOpen = false; aboutOpen = false; search = '';  });
</script>

<svelte:window onkeydown={(event) => { if (event.key === 'Escape') menuOpen = false; }} />
<a class="skip-link" href="#main-content">Direct naar inhoud</a>
<header class="site-header" data-sveltekit-reload={data.hasStoryLink}>
  <div class="header-inner">
    <a href={resolve('/')} class="brand" aria-label="Erfgoedflix — alle verhalen">
      <span class="brand-mark" aria-hidden="true">e<span>f</span></span>
      <span>erfgoed<span class="brand-light">flix</span><span class="brand-dot">.</span></span>
    </a>
    <nav class="desktop-nav" aria-label="Verhalen">
      <a href={resolve('/')} class={{ active: !page.params.identifier }} aria-current={!page.params.identifier ? 'page' : undefined}>Ontdek</a>
      <button class="text-link" onclick={() => menuOpen = true}>Zoek verhalen</button>
    </nav>
    <div class="header-actions">
      <button class="about-button" onclick={() => { siteAbout = false; aboutOpen = true; }}>{page.params.identifier ? 'Over dit verhaal' : 'Over Erfgoedflix'} <ArrowUpRightFromSquareOutline size="xs" /></button>
      <span class="header-divider"></span>
      <DarkMode ariaLabel="Wissel tussen dag- en nachtmodus" title="Dag- / nachtmodus" class="theme-toggle" />
      <button class="icon-button mobile-menu-toggle" aria-label={menuOpen ? 'Verhalen sluiten' : 'Zoek verhalen'} aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}>
        {#if menuOpen}<CloseOutline size="sm" />{:else}<BarsOutline size="sm" />{/if}
      </button>
    </div>
  </div>
</header>
{#if data.storyPreview}
  <div class="story-preview-banner" role="status"><span>{data.storyPreview.draft ? 'Conceptvoorbeeld' : 'Verhaal via LDMax-link'} · Dit voorbeeld is alleen zichtbaar in deze browsersessie.</span><a href={resolve('/bekijk?stop=1')} data-sveltekit-reload>Voorbeeld sluiten</a></div>
{/if}
<main id="main-content" tabindex="-1" data-sveltekit-reload={data.hasStoryLink}>
  {@render children()}
</main>
<footer class="site-footer page-width" data-sveltekit-reload={data.hasStoryLink}>
  <a class="footer-brand" href={resolve('/')}>erfgoedflix<span>.</span></a>
  <p>Het verleden in beeld. Verbonden door open verhalen.</p>
  <button onclick={() => { siteAbout = true; aboutOpen = true; }}>Over Erfgoedflix <ArrowUpRightFromSquareOutline size="xs" /></button>
</footer>
<Modal bind:open={menuOpen} title="Zoek verhalen" size="lg">
  <Input type="search" aria-label="Zoek op titel of ondertitel" placeholder="Zoek op titel of ondertitel…" bind:value={search} />
  <p class="muted" role="status">{collections.length} verhalen</p>
  <nav class="story-search-results" aria-label="Verhalen">
    <a href={resolve('/')}>Alle verhalen bekijken</a>
    {#each collections as collection (collection.identifier)}
      <a href={resolve('/[identifier]', { identifier: collection.identifier! })} aria-current={page.params.identifier === collection.identifier ? 'page' : undefined}>{collection.name}</a>
    {/each}
  </nav>
  {#if collections.length === 0}<p>Geen verhalen gevonden. Probeer een andere zoekterm.</p>{/if}
</Modal>
<Modal bind:open={aboutOpen} title={about?.name ?? data.siteName} size="lg" class="about-modal">
  <!-- HTML originates from the repository-controlled RDF Markdown configuration. -->
  {#if about?.description?.trim()}
    <div class="rich-text">{@html about.description}</div>
  {:else}
    <div class="rich-text">
      <p>Erfgoedflix brengt erfgoed in beeld. Ontdek verhalen met historische foto's en objecten uit de collecties van verschillende archieven en instellingen.</p>
      <p>Elk verhaal verbindt beelden uit openbare erfgoedbronnen. Bij de objecten vind je meer informatie en een verwijzing naar de oorspronkelijke bron.</p>
    </div>
  {/if}
  {#if about?.creator}
    <div class="creator-block">
      <p class="eyebrow">Over de maker</p>
      <h2>{about.creator.name}</h2>
      {#if about.creator.logo}<img src={about.creator.logo} alt={about.creator.name} class="creator-logo" />{/if}
      <div class="rich-text">{@html about.creator.description}</div>
      {#if about.creator.url}<a class="text-link" href={about.creator.url} rel="external">Bezoek de website <ArrowUpRightFromSquareOutline size="sm" /></a>{/if}
    </div>
  {/if}
</Modal>
