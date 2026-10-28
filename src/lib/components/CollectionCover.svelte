<script lang="ts">
  import { ArrowUpRightFromSquareOutline } from 'flowbite-svelte-icons';

  let { title, src, headline, alternate = false }: {
    title: string;
    src?: string;
    headline?: string;
    alternate?: boolean;
  } = $props();
  let failed = $state<string>();
  const hasCover = $derived(Boolean(src && failed !== src));
</script>

<div class={['collection-card-art', { alternate, 'with-cover': hasCover }]} aria-hidden="true">
  {#if hasCover}
    <img class="collection-cover-image" {src} alt="" loading="lazy" decoding="async" onerror={() => failed = src} />
    <div class="collection-cover-shade"></div>
  {/if}
  <span class="archive-label">ERFGOED / VERHAAL</span>
  <span class="archive-title">{title}</span>
  <span class="archive-arrow"><ArrowUpRightFromSquareOutline /></span>
  <span class="archive-caption">{headline?.trim() || 'Een venster op het verleden'}</span>
</div>
