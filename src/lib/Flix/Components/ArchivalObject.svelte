<script lang="ts">
  import { ArrowUpRightFromSquareOutline } from 'flowbite-svelte-icons';
  import IIIFViewer from '#lib/components/IIIFViewer.svelte';
  import Artwork from '#lib/components/Artwork.svelte';
  import type { ArchivalObject } from '#lib/types.js';
  import propertyMapping from '../helpers/propertyMapping';
  let { bindings, object }: {bindings: {p: string; o: string}[]; object: ArchivalObject} = $props();
  function properties(property: string, literals = false): string[] {
    const entry = propertyMapping.get(property);
    return bindings.filter(b => entry?.iris.includes(b.p) && (!literals || b.o.startsWith('"'))).map(b => b.o.replace(/^"(.*)"(?:@[\w-]+|\^\^.*)?$/s, '$1'));
  }
  const name = $derived(object.name[0] || properties('name')[0] || 'Zonder titel');
  const manifest = $derived(object.media?.find(media => media.manifestUrl)?.manifestUrl);
  const fullImages = $derived(object.media?.flatMap(media => media.contentUrl ? [media.contentUrl] : []) ?? []);
  const images = $derived(fullImages.length ? fullImages : object.imageUrl.length ? object.imageUrl : properties('imageUrl'));
  const descriptions = $derived(object.description.length ? object.description : properties('description'));
  const source = $derived(properties('source').find(url => /^https?:\/\//.test(url)));
</script>
<svelte:head><title>{name} — Erfgoedflix</title></svelte:head>
<article class="object-detail">
  <div class="object-images">
    {#if manifest}{#key manifest}<IIIFViewer manifestUrl={manifest} />{/key}{:else}
    {#each images as image (image)}<div class="object-image"><Artwork src={image} alt={name} loading="eager" /></div>{:else}<div class="object-image"><Artwork alt={name} /></div>{/each}
    {/if}
  </div>
  <div class="object-info"><p class="eyebrow">Uit het verhaal</p><h1>{name}</h1>
    {#if object.dateCreated.length}<p class="object-date">{object.dateCreated.join(' · ')}</p>{/if}
    {#if descriptions.length}<section><h2>Het verhaal achter het beeld</h2>{#each descriptions as description (description)}<p>{description}</p>{/each}</section>{/if}
    {#each object.media ?? [] as media (media.id)}
      {#if media.license || media.copyrightNotice}<section><h2>Rechten van deze reproductie</h2>{#if media.copyrightNotice}<p>{media.copyrightNotice}</p>{/if}{#if media.license}<a class="text-link" href={media.license} rel="external">Rechtenverklaring ↗</a>{/if}</section>{/if}
    {/each}
    {#if properties('rights').length}<section><h2>Rechten</h2><p>{properties('rights').join(' · ')}</p></section>{/if}
    {#if properties('subject', true).length}<section><h2>Onderwerpen</h2><div class="tag-list">{#each properties('subject', true) as subject (subject)}<span>{subject}</span>{/each}</div></section>{/if}
    {#if properties('identifier', true).length}<section><h2>Objectnummer</h2><p class="object-identifier">{properties('identifier', true).join(' · ')}</p></section>{/if}
    {#if source}<a class="text-link" href={source} rel="external">Bekijk bij de bron <ArrowUpRightFromSquareOutline size="sm" /></a>{/if}
  </div>
</article>
