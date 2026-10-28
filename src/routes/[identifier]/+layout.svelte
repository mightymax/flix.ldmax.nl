<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  let { children, data } = $props();
</script>
<svelte:head><title>{data.name} — Erfgoedflix</title></svelte:head>
<div class="collection-nav-wrap">
  <nav class="collection-nav page-width" aria-label="Thema’s in dit verhaal">
    <a class="collection-overview" href={resolve('/[identifier]', {identifier: data.identifier!})} aria-current={!page.params.category ? 'page' : undefined}>Verhaaloverzicht</a>
    <span class="nav-separator" aria-hidden="true"></span>
    {#each data.menu ?? [] as item (item.url)}
      <a href={item.url} aria-current={page.url.pathname === item.url || page.url.pathname.startsWith(item.url + '/') ? 'page' : undefined}>{item.name}</a>
    {/each}
  </nav>
</div>
{@render children()}
