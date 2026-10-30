# ErfgoedFlix design

The interface uses a warm archive-inspired style with a light canvas background
and dark green night mode. Coral highlights actions and active navigation. Serif
headings give the image presentation an editorial character; navigation uses a
local sans-serif font. No external web fonts are loaded.

## Structure

- The root layout provides the shared header, collection navigation, theme
  switcher, information modal and footer.
- The collection layout adds collection and category navigation, horizontally
  scrollable on mobile.
- Home-page collection cards show full titles. Optional `sdo:headline` overrides
  the default subtitle; `sdo:image` supplies the cover. A missing or failed image
  leaves the graphic background visible. Covers require no additional SPARQL query.
- Collection pages show a manually controlled image hero, category shortcuts and
  image rows. There is no automatic movement; reduced-motion preferences are respected.
- Category pages use a responsive image grid with titles. The counter reports
  loaded images, not the total at the source.
- Object details place the full image beside metadata, stacked on mobile.
  CONSTRUCT metadata remains visible when the additional bindings query returns nothing.

## Components and conventions

`src/app.css` defines colours and shared responsive styling. A `dark` class on the
HTML element activates night mode. Flowbite DarkMode initially follows system
preferences and stores manual choices locally. The root layout keeps the switch
available during navigation. Flowbite Modal presents collection information.

`Artwork.svelte` provides a fallback for missing or unreachable images.
`ImageScroller.svelte` uses ordinary links, horizontal swipe/scroll interaction
and buttons. Collection pages resolve and encode object IRIs before passing links
to the scroller.

Previews follow the current collection. Requests are cancelled during navigation;
empty results and loading errors are visible, with retry available after an error.
Shared object metadata types live in `src/lib/types.ts`.

Local configuration descriptions contain administrator-controlled Markdown/HTML
and are rendered as HTML. Do not expose these files for public editing without
sanitization. Error pages no longer render raw HTML error messages.

The documentation wordmark is in `docs/assets/erfgoedflix.svg`. It uses the same
dark green, warm light background colour and coral accent, with the product name
consistently written as **ErfgoedFlix**. It does not change application branding
or configuration values.

## Verification recorded on 27 October 2026

- Type checking, lint, production build, seven regression tests and offline
  configuration validation passed at that time.
- Browser checks covered both collections and WO2 → Bevrijding → object details,
  including live images and metadata.
- Day/night switching, persistence after reload, information modal and navigation
  were checked.
- At 390px, the mobile menu opened and closed through collection navigation;
  collection and detail layouts were inspected. No horizontal page overflow was
  measured on the collection page.
- The design changes did not rewrite SPARQL pagination or bindings conversion,
  or add full search and additional result pages.

These are historical checks, not verification of the current documentation update.
