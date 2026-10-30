# ErfgoedFlix project status

## Independent hosting documentation — 30 October 2026

The README links to `docs/self-hosting.md` and `docs/configuration.md` for independent
instances using local RDF, Node or Docker. Project documentation is English and
uses the ErfgoedFlix name. The README includes a documentation wordmark at
`docs/assets/erfgoedflix.svg`. The project licence is EUPL-1.2; see `LICENSE`.
Third-party dependencies and heritage content retain their own licences and rights.

Optional integration, import history, reference-repository conventions and
maintainer-specific deployment instructions are consolidated in
[LDMax integration and upstream operations](ldmax.md). Legacy documentation paths
remain as pointers. Upstream images are ARM64-only and have no `latest` tag.

The earlier documentation pass validated the copyable RDF example, bundled and
local configuration, local links and whitespace. It did not perform a new runtime
or browser test. Documentation updates do not translate the application UI or
bundled heritage content.

## Public catalogue and story integration — 30 October 2026

The optional remote catalogue reads native RDF and replaces the local catalogue
when enabled. The two bundled stories were imported into the upstream production
database with their source queries, carousels and route aliases. Experimental
stories were removed after backup. The new integration code was tested locally
and still needed deployment when this status was recorded: platform first, then
ErfgoedFlix. See [integration deployment order](ldmax.md#migration-and-deployment-order).

Story management operates at organisation level without dataset selection or an
`isPartOf` filter. Contract version 2 uses the registered public organisation
source. The database migration was run in the platform's production environment;
live repository activation and full acceptance testing were still pending at the
time of the integration notes.

## Maintenance already completed

- Node 24.21.0 is pinned in `.nvmrc` and the package engine requirement.
- Configuration loading lives in `src/lib/server/flix/configuration.js`, using a
  queue and canonical paths. All include branches are processed; repeated files
  and cycles are read once. Each Turtle file gets its own parser; the root file
  is read once. Exactly one application root is required.
- `Flix.getInstance()` shares the initialization promise and permits retry after
  failure. Requests no longer receive a partially initialized instance.
- `npm run check:config` validates the example or a specified file offline:
  route identifiers, query settings and CONSTRUCT queries. Runtime checks files
  and the root; the broader validation remains an explicit command.
- The initial seven local tests covered includes, cycles, errors, identifiers,
  query files, examples and shared initialization/recovery. Later integration
  changes add further fixtures; run the suite for the current count.
- The `Checks` GitHub workflow validates configuration, tests, types, lint and build.

All checks passed locally with Node 24 during the initial maintenance work.
A development server then ran at `http://127.0.0.1:5175`; home and `/config.ttl`
returned HTTP 200 and both examples appeared in the server-rendered home page.
This is a historical URL, not a guarantee that a server is currently running.
The design update also checked live collection/detail queries and browser output;
see [design verification](design.md#verification-recorded-on-27-october-2026).
The CI workflow had been added locally but not yet run on GitHub at that point.

## Purpose and technology

ErfgoedFlix presents themed image collections from public SPARQL endpoints. RDF
defines the website, collections, categories, metadata and query files. The
bundled examples are WO2 Oorlogsbronnen and Daguerreobase. Preserve this
configurability during maintenance.

The dependency baseline includes Svelte 5, SvelteKit 3, Tailwind 4,
Flowbite-Svelte 1, Vite 8 and TypeScript 6. The production container uses Node 24
and adapter-node. The main maintenance priorities are reliability and clarity,
not a general framework upgrade.

## Architecture and data flow

1. `src/hooks.server.ts` gets a shared `Flix` instance and puts it in `locals`.
2. `src/lib/Flix.ts` uses the server-side configuration loader to read
   `config/config.ttl` and `flix:loadConfig` includes into an N3 Store.
   `sdo:WebApplication` is the root; `hasPart`/`isPartOf` connect collections and
   categories. The optional remote catalogue builds an alternative store.
3. `Page` describes categories and retrieves objects. `Engine` reads
   `comunica:settings`, creates a Comunica QueryEngine and executes queries.
4. `helpers/queryParser.ts` reads inline queries or `flix:file` files, applies
   optional object filtering and delegates pagination. sparqljs parses and
   generates CONSTRUCT queries.
5. `ArchivalObject` maps result quads to object metadata. Detail pages also request
   predicate/object bindings.
6. Flowbite components display carousels, horizontal image rows, category grids
   and object details.

| Route | Purpose |
| --- | --- |
| `/` | Configured collection overview |
| `/[identifier]` | Collection carousel and category previews |
| `/[identifier]/[category]` | Category page; JSON with `Accept: application/json` |
| `/[identifier]/[category]/[item]` | Object details; item is a URL-encoded IRI |
| `/config.ttl` | Public merged Turtle configuration |
| `/bekijk` | Optional remote story/preview entry point; see integration guide |

Local configuration mode has no database or account layer. The collection page
loads category previews client-side; the carousel is loaded server-side.

## Original audit findings — 27 October 2026

The following records the initial audit, not a claim that every issue remains
unfixed. Configuration initialization/loading and the design issues addressed
above have since changed. Later story work also added safe IRI construction and
AST-level pagination. Check current code and fixtures before selecting work.

### Configuration and query findings

- Initialization originally stored the instance before loading completed, exposing
  partial state and preventing recovery after failure. Shared initialization fixes this.
- Include traversal originally lost branches, lacked cycle detection and read the
  root twice. The queue-based loader fixes this.
- Central validation of identifiers, required properties and query files was
  missing. Offline configuration validation now covers identifiers and query settings,
  but is not a complete schema or external source check.
- Pagination originally replaced LIMIT/OFFSET text, including nested queries, and
  did not insert absent clauses. The current AST helper adjusts the first query
  with a limit or the outer query; nested-query behaviour still deserves care.
- Object IRIs were interpolated directly into SPARQL. Current object selection
  and metadata lookup use the shared `iri()` helper.
- Detail bindings were converted through stringification and `JSON.parse`.
  Explicit RDF-term mapping that preserves language and datatype was recommended.

### Runtime and UI findings

- Category previews originally only loaded in `onMount`, making reused collection
  components stale during navigation. The design update makes previews follow
  current data and cancels requests.
- Failed previews originally logged only to the console and left spinners visible.
  Empty, error and retry states have since been added.
- Shared metadata types originally differed from server output. DTOs now live in
  `src/lib/types.ts`.
- Local Markdown/HTML remains trusted administrator input. Error pages no longer
  render raw HTML errors; review trust boundaries before exposing public editing.
- The audit found an unknown-collection layout returning a status/error object
  instead of throwing an HTTP 404. Verify current route behaviour before fixing.
- Each query creates a new QueryEngine; the audit recommended measuring before
  adding application timeout, cache or failure policies.
- Category pages default to 20 objects and previews to 10. There are no controls
  for browsing further result pages.
- Server code and components remain partly mixed under `src/lib/Flix` despite
  the dedicated `src/lib/server/flix` modules. Further separation remains useful.

## Historical verification and next steps

On 27 October 2026, the initial baseline passed `npm run check` with zero errors
and warnings, `npm run lint` and the adapter-node production build. At the start
of that audit there were no local regression tests or checks workflow; those were
added in the maintenance step above. A successful build alone does not verify
external endpoints, images, navigation or object detail pages.

The proposed maintenance sequence was:

1. Make the baseline reproducible with a pinned Node version, configuration checks,
   local fixtures and CI. This initial step is complete.
2. Repair initialization/includes, object selection, pagination and bindings
   conversion with regression coverage. Several parts are implemented; review
   remaining term conversion and pagination semantics against current tests.
3. Further separate server code, DTOs and UI while preserving routes and RDF vocabulary.
4. Extend browser coverage for collection → category → detail → back and unknown
   identifiers, including loading failures, empty results and navigation.
5. Improve search, filtering, pagination, image presentation and measured performance.

Reference-platform version differences and conventions are documented in the
[integration guide](ldmax.md#upstream-development), rather than being requirements
for independently hosted ErfgoedFlix instances.
