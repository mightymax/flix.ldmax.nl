<script lang="ts">
    import ArchivalObject from "$lib/Flix/Components/ArchivalObject.svelte";
  import { Breadcrumb, BreadcrumbItem } from "flowbite-svelte";
  let { data } = $props();
  const truncate = (text: string, length: number = 50) => {
    return text.length > length ? text.substring(0, length) + '…' : text;
  };
</script>
<Breadcrumb aria-label="Kruimelpad" class="mb-4">
  <BreadcrumbItem href="/" home>Home</BreadcrumbItem>
  <BreadcrumbItem href="/{data.params.identifier}">{data.flixName}</BreadcrumbItem>
  <BreadcrumbItem href="/{data.params.identifier}/{data.page.identifier}">{data.page.name}</BreadcrumbItem>
  <BreadcrumbItem>{truncate(data.archivalObject?.name[0] ?? '')}</BreadcrumbItem>
</Breadcrumb>
<ArchivalObject bindings={data.bindings} />