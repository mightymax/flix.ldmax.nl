import type Flix from '$lib/Flix';
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {

  namespace FlixObject {
    interface ArchivalObject {
      id: string;
      title: string;
      description?: string;
      imageUrl?: string;
    }
  }

	namespace App {
		// interface Error {}
		interface Locals {
      flix: Flix;
    }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'grapoi';

export {};
