<script lang="ts">
  import { onMount } from 'svelte';
  import { asset } from '$app/paths';
  import 'tify/dist/tify.css';
  let { manifestUrl }: {manifestUrl: string} = $props();
  let container: HTMLDivElement;
  let failed = $state(false);
  onMount(() => {
    let disposed = false;
    let viewer: {destroy?: () => void} | undefined;
    void import('tify').then(({default: Tify}) => {
      if (disposed) return;
      viewer = new Tify({container, manifestUrl, language: 'nl', translationsDirUrl: asset('tify/translations/nl.json').replace(/nl\.json$/, '')});
    }).catch(() => { if (!disposed) failed = true; });
    return () => {disposed = true; viewer?.destroy?.();};
  });
</script>
<div class="iiif-viewer" bind:this={container} aria-label="IIIF beeldviewer"></div>
{#if failed}<p class="empty-state">De IIIF-viewer kon niet worden geopend. Je kunt het manifest bij de bron bekijken.</p>{/if}
<a class="text-link" href={manifestUrl} rel="external">Open IIIF-manifest bij de bron ↗</a>
