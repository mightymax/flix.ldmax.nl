import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
    // this is not safe, but what to do ...
    // @see https://svelte.dev/docs/kit/configuration#csrf
    csrf: {
      checkOrigin: false
    }
	}
};

export default config;
