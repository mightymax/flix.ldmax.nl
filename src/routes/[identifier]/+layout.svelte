<script lang="ts">
  import { Navbar, NavBrand, NavHamburger, NavUl, NavLi, Heading, ButtonGroup } from "flowbite-svelte";
  import { Drawer, Button, CloseButton } from "flowbite-svelte";
  import { InfoCircleSolid, ArrowRightOutline, HomeSolid } from "flowbite-svelte-icons";
  import { page } from "$app/state";
	import '../../app.css';
	let { children, data } = $props();
  let hidden = $state(true);
  let activeUrl = $derived(`/${data.identifier}/${data.params?.category }`);
</script>

<svelte:head>
  <title>{data.name}</title>
</svelte:head>
<div class="relative px-8">

  <Navbar class="fixed start-0 top-0 z-20 w-full  bg-gray-200/90 px-2 py-2.5 sm:px-4">
    <NavBrand href="/{data.identifier}">
      {#if data.logo}
        <img src={data.logo} class="me-3 h-6 sm:h-9" alt={data.name} />
      {/if}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">{data.name}</span>
    </NavBrand>
    <div class="flex md:order-2">
      <ButtonGroup>
        <Button size="sm" href="/" color="primary"><HomeSolid/></Button>
        <Button size="sm" class="cursor-pointer" color="primary" onclick={() => (hidden = false)}><InfoCircleSolid/></Button>
      </ButtonGroup>
      <NavHamburger />
    </div>
    <NavUl {activeUrl}>
      <NavLi href="/{data.identifier}">Home</NavLi>
      {#each data.menu??[] as menuItem}
        <NavLi href={menuItem.url}>{menuItem.name}</NavLi>
      {/each}
    </NavUl>
  </Navbar>
</div>
<main class="mt-20 p-8 min-h-screen flex flex-col">
  <div class="flex-1">
    {@render children()}
  </div>
</main>


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