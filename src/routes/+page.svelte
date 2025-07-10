<script lang="ts">
  import { Navbar, NavBrand, NavHamburger, NavUl, NavLi, Heading, P, Hr } from "flowbite-svelte";
  import { Drawer, Button, CloseButton } from "flowbite-svelte";
  import { InfoCircleSolid, ArrowRightOutline } from "flowbite-svelte-icons";
  import { page } from "$app/state";
	import '../app.css';
	let {data} = $props();
  let hidden = $state(true);
  let activeUrl = $derived(page.url.pathname.replace(/\/item\/.+/, ''));
</script>

<svelte:head>
  <title>{data.name}</title>
</svelte:head>
<div class="relative px-8">

  <Navbar class="fixed start-0 top-0 z-20 w-full  bg-gray-200/90 px-2 py-2.5 sm:px-4">
    <NavBrand href="/">
      {#if data.logo}
        <img src={data.logo} class="me-3 h-6 sm:h-9" alt={data.name} />
      {/if}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">{data.name}</span>
    </NavBrand>
    <div class="flex md:order-2">
      <Button size="sm" class="cursor-pointer" onclick={() => (hidden = false)}><InfoCircleSolid/>
      </Button>
      <NavHamburger />
    </div>
    <NavUl {activeUrl}>
      <NavLi href="/">Home</NavLi>
      {#each data.flixers as flix}
        <NavLi href="/{flix.identifier}">{flix.name}</NavLi>
      {/each}
    </NavUl>
  </Navbar>
</div>
<div class="mt-20 p-8 min-h-screen flex flex-col">
  <div class="flex-1">
    <Heading tag="h1" class="text-3xl font-bold mb-4 text-primary-600">{data.name}</Heading>
    <P class="mb-6 text-xl">
      {@html data.description}
    </P>
    <Heading tag="h2" class="text-2xl uppercase text-gray-700">Beschikbare erfgoedflixers<sup class="text-primary-500">*</sup></Heading>
    {#each data.flixers as flix}
      <div class="mb-4 mt-4">
        <Heading tag="h3" class="text-xl mb-4 text-gray-600">{flix.name}</Heading>
        <p class="mb-2">
          {@html flix.description}
        </p>
        <Button href="/{flix.identifier}" class="px-4">Bekijk erfgoedflix <ArrowRightOutline class="ms-2 h-5 w-5" /></Button>
      </div>
    {/each}

    <p class="text-sm text-gray-500 mt-4"><sup class="text-primary-500">*</sup> Een "erfgoedflix" is een thematische samengesteelde beeldbank. De flix kan uit verschillende bronnen data gebruiken.</p>
  {#if data.about?.creator}
  <Hr class="my-8" />
    <Heading tag="h2" class="text-2xl mt-8 uppercase text-gr">Over de maker</Heading>
    {#if data.about.creator.logo}
      <img src={data.about.creator.logo} class="mb-4 h-16 w-16 " alt={data.about.creator.name} />
    {/if}
    {#if data.about.creator.url}
      <p class="mb-6">
        {@html data.about.creator.description}
      </p>
      <Button href={data.about.creator.url} class="px-4">Bezoek website <ArrowRightOutline class="ms-2 h-5 w-5" /></Button>
    {/if}
  {/if}
  </div>
</div>


<Drawer bind:hidden={hidden} id="sidebar1" aria-controls="sidebar1" aria-labelledby="sidebar1">
  <div class="flex items-center justify-between">
    <h5 id="drawer-label" class="mb-4 inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400">
      <InfoCircleSolid class="me-2.5 h-5 w-5" />Info
    </h5>
    <CloseButton onclick={() => (hidden = true)} class="mb-4 dark:text-white" />
  </div>
  <Heading tag="h3" class="text-lg mb-4 uppercase">{data.name}</Heading>
  <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
    {@html data.about?.description}
  </p>
  {#if data.about?.creator}
    <Heading tag="h4" class="text-lg mb-4 uppercase">Over de maker</Heading>
    {#if data.about.creator.logo}
      <img src={data.about.creator.logo} class="mb-4 h-16 w-16 " alt={data.about.creator.name} />
    {/if}
    {#if data.about.creator.url}
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {@html data.about.creator.description}
      </p>
      <Button href={data.about.creator.url} class="px-4">Bezoek website <ArrowRightOutline class="ms-2 h-5 w-5" /></Button>
    {/if}
  {/if}
</Drawer>
