<script lang="ts">
  import { resolve } from '$app/paths';
  import { ArrowLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import ArchivalObject from '#lib/Flix/Components/ArchivalObject.svelte';
  let { data } = $props();
</script>
<div class="page-width detail-page">
  <nav class="breadcrumbs" aria-label="Kruimelpad"><a href={resolve('/')}>Verhalen</a><ChevronRightOutline size="xs" /><a href={resolve('/[identifier]', {identifier: data.params.identifier})}>{data.flixName?.replace('Beeldbank ', '')}</a><ChevronRightOutline size="xs" /><a href={resolve('/[identifier]/[category]', {identifier: data.params.identifier, category: data.params.category})}>{data.page.name}</a><ChevronRightOutline size="xs" /><span aria-current="page">Beelddetail</span></nav>
  <a class="text-link back-link" href={resolve('/[identifier]/[category]', {identifier: data.params.identifier, category: data.params.category})}><ArrowLeftOutline size="sm" />Terug naar {data.page.name}</a>
  <ArchivalObject bindings={data.bindings} object={data.archivalObject} />
</div>
