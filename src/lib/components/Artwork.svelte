<script lang="ts">
  import { ImageOutline } from 'flowbite-svelte-icons';
  let { src, alt, loading = 'lazy' }: {src?: string; alt: string; loading?: 'lazy' | 'eager'} = $props();
  let failed = $state<string>();
</script>
{#if src && failed !== src}
  <img {src} {alt} {loading} decoding="async" onerror={() => failed = src} />
{:else}
  <div class="image-fallback"><ImageOutline size="lg" /><span>Beeld niet beschikbaar</span></div>
{/if}
