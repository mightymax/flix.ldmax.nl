<script lang="ts">
  import { page } from '$app/state';
  import { Alert, Heading, P } from 'flowbite-svelte';
  let errorMessage = $derived.by(() => {
    if (page?.error?.message === undefined) return '';
    try {
      const e = JSON.parse(page?.error?.message);
      return '<pre>' + JSON.stringify(e, null, 2) + '</pre>';
    } catch {
      return page?.error?.message;
    }
  })
</script>
<div class="max-w-3xl flex flex-col space-y-4">
  <Heading>Er is iets mis gegaan.</Heading>
  <Alert color="orange">
    <P><code class="font-bold text-red-500">{page.status}</code></P>
    {@html errorMessage}
  </Alert>
</div>
