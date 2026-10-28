<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
</script>
<svelte:head><title>{page.status === 404 ? 'Niet gevonden' : 'Laden mislukt'} — Erfgoedflix</title></svelte:head>
<section class="page-width error-page">
  <p class="eyebrow">{page.status} / Erfgoedflix</p>
  <h1>{page.status === 404 ? 'Even het spoor bijster.' : 'Het verhaal laat op zich wachten.'}</h1>
  <p>{page.status === 404 ? 'Deze pagina bestaat niet. Ontdek een ander verhaal of ga terug naar het overzicht.' : 'We konden deze pagina niet laden. Probeer het later opnieuw of bekijk een ander verhaal.'}</p>
  <a class="text-link" href={resolve('/')}><ArrowLeftOutline size="sm" />Naar de verhalen</a>
</section>
