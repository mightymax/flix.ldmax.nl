<script lang="ts">
  import { Img, Breadcrumb, BreadcrumbItem, Heading, P, paragraph } from "flowbite-svelte";
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
<svelte:head>
  <title>{data.archivalObject?.name[0]}</title>
</svelte:head>
<Heading class="mb-4 text-md md:text-4xl" tag="h1">{data.archivalObject?.name[0]}</Heading>
<Img src={data.archivalObject?.imageUrl[0]} alt={data.archivalObject?.name[0]} class="max-w-lg rounded-lg mb-4" />
<P size="lg">{data.archivalObject?.description[0]}</P>
