<script lang="ts">
  import { Badge, Heading, Img, P } from 'flowbite-svelte';
  import propertyMapping from '../helpers/propertyMapping';
  const { bindings, ...others }: { bindings: {p: string, o: string}[] } & {[key: string]: unknown} = $props();
  
  function getProperties(property: string, onlyLiterals: boolean = false): { label: string; values: string[] } {
    const entry = propertyMapping.get(property);
    if (!entry) return { label: property, values: [] };

    const values = bindings
      .filter((b) => entry.iris.includes(b.p))
      .filter((b) => !onlyLiterals || b.o.startsWith('"')) // Filter only literals if required
      .map((b) => b.o.replace(/"(.+)"/, '$1')) // Remove quotes from string values;

    return {
      label: entry.label,
      values,
    };
  }
  const name = $derived(getProperties('name').values.shift() || '');

</script>
<svelte:head>
  <title>{name}</title>
</svelte:head>
<div class={others.class || ''}>

</div>
<Heading class="mb-4 text-md md:text-4xl" tag="h1">{getProperties('name')?.values.shift()}</Heading>
{#each getProperties('imageUrl')?.values as image}
  <Img src={image} alt={name} class="max-w-lg rounded-lg mb-4" />
{/each}
{#if getProperties('source')?.values.length > 0}
  <P class="text-lg mb-4">Bron: <a href="{getProperties('source')?.values.shift()}">{getProperties('source')?.values.shift()}</a></P>
{/if}
{#if getProperties('rights')?.values.length > 0}
  <P class="text-lg mb-4">Rechten: {getProperties('rights')?.values.shift()}</P>
{/if}
<Heading class="mt-8 mb-4 text-lg" tag="h2">Beschrijving</Heading>
{#each getProperties('description')?.values as description}
  <P size="lg">{description}</P>
{/each}
<Heading class="mt-8 mb-4 text-lg" tag="h2">Identifier</Heading>
{#each getProperties('identifier', true)?.values as subject}
  <Badge color="gray" class="text-md p-2 mr-2">{subject}</Badge>
{/each}
<Heading class="mt-8 mb-4 text-lg" tag="h2">Onderwerpen</Heading>
{#each getProperties('subject', true)?.values as subject}
  <Badge color="gray" class="text-md p-2 mr-2">{subject}</Badge>
{/each}
<pre hidden={true}>{JSON.stringify(bindings, null, 2)}</pre>