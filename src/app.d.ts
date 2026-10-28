import type Flix from '#lib/Flix.js';
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {


	namespace App {
		// interface Error {}
		interface Locals {
      flix: Flix;
      hasStoryLink?: boolean;
      storyPreview?: {draft: boolean; expiresAt: number};
    }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'grapoi';

export {};
