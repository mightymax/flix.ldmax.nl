# LDMax integration and upstream operations

LDMax integration is optional. For an independent ErfgoedFlix installation, start
with [self-hosting](self-hosting.md) and [RDF configuration](configuration.md).
No LDMax account or database is required for local configuration mode.

## Public catalogue

`https://www.ldmax.nl/verhalen` is the public story catalogue, within LDMax's
existing layout and navigation. It lists covers, organisations, introductions
and theme counts, with search, organisation filtering, pagination and links to
ErfgoedFlix. Only published snapshots from public organisations with an active
registered source endpoint are visible. Drafts, user details and endpoint
credentials are never published. Source and publication visibility are checked
on every request.

The route uses LDMax content negotiation and extension routing:

- Browser requests or no specific Accept header: HTML.
- `Accept: text/turtle` or `/verhalen.ttl`: Turtle.
- `Accept: application/ld+json` or `/verhalen.jsonld`: JSON-LD.
- N-Triples, N-Quads, TriG, N3 and RDF/XML are also supported.
- An explicit extension takes precedence over Accept.
- `q`, `organisation`, `limit` (1–100) and `offset` control filtering and pagination.
  RDF includes a `hydra:next` link.

The catalogue is a `schema:Collection` whose `schema:hasPart` values are canonical
story URIs. Story metadata, organisation, source endpoint, ordered themes, filters
and manual queries are separate RDF properties, not JSON configuration literals.
Shared modules `src/lib/stories/repositoryRdf.js`, `contract.js` and
`selectionQuery.js` are kept identical in both repositories.

## Connecting ErfgoedFlix

After deploying the LDMax catalogue route, set this in the server environment:

```env
FLIX_REPOSITORY_URL=https://www.ldmax.nl/verhalen
```

ErfgoedFlix requests Turtle and also accepts N-Triples, N-Quads, TriG and N3.
There is no JSON fallback. The catalogue is cached for one minute and refreshed
on a subsequent request. Images and object metadata still come from the SPARQL
sources; no harvesting is required.

The client bounds document size and pagination, rejects redirects, checks unique
story IDs and validates RDF properties and canonical URIs. Remote configuration
supports inline queries only and cannot load local files.

Without `FLIX_REPOSITORY_URL`, ErfgoedFlix uses local Turtle files. Setting it
**replaces the local catalogue**; it does not merge both sources. Repository routes
are `/<organisation>--<story-slug>`. Imported local stories also retain their
original aliases `/wo2-oorlogsbronnen` and `/Daguerreobase`.

## Editing, publishing and queries

Management lives at `/organisaties/{organisation}/verhalen`: members edit drafts,
and organisation administrators publish. Existing stories are edited at
`/{uuid}/bewerken`, and new stories at `/nieuw`. The editor includes large text
fields, collapsible themes, primary actions in the LDMax theme colour and a
temporary ErfgoedFlix preview link. The idea-description action is available only
for new stories. AI suggestions use observed values through LDMax MCP and are
never saved or published automatically.

A manual per-theme selection uses `selectionQuery` with
`SELECT DISTINCT ?heritageObject`. Its modal provides testing, sample objects,
restoring automatic selection and a link to the organisation's SPARQL IDE.
ErfgoedFlix adds image metadata and pagination. Published content changes only
after republishing. Optimistic revision checks prevent concurrent edits from
overwriting each other.

New stories follow the NDE Schema.org profile using CreativeWork objects. Imported
legacy stories can supply a complete `constructQuery`, preserving Photograph or
Dublin Core fields and image transformations. Queries are parsed and checked:
updates, SERVICE and FROM are disallowed, including in nested queries. Testing
uses a derived, bounded SELECT query against the registered organisation endpoint.
Carousel queries are also checked. Page limits are adjusted at AST level while
preserving limits and text inside manual subqueries.

New stories retain `associatedMedia`, thumbnails, content URLs, formats and rights.
IIIF Presentation 2/3 opens in Tify; otherwise full images and thumbnails are used.

## Migration and deployment order

No additional configuration version, version history or compatibility layer was
introduced. Existing `stories` storage remains in use. Imported stories contain
their original source queries; deploy the new code to read those fields.

Deploy LDMax with `/verhalen` first, verify HTML and `/verhalen.ttl`, then deploy
ErfgoedFlix with `FLIX_REPOSITORY_URL=https://www.ldmax.nl/verhalen`. The existing
JSON API remains available, but ErfgoedFlix no longer uses it for the catalogue.

### Import recorded on 30 October 2026

The local configurations were checked, including all eight theme queries against
the registered organisation sources, and published in the production database:

| Organisation | Story slug | ID |
| --- | --- | --- |
| `wo2net` | `wo2-oorlogsbronnen` | `297cca2d-485a-4506-a34b-1d05941a3b26` |
| `nederlands-fotomuseum-daguerreobase` | `daguerreobase` | `e14fa497-85dd-455d-8b90-9883fc98cb91` |

Queries, themes, title/introduction, cover settings, creator, dates and carousel
were preserved. Two experimental stories were removed at the owner's request
after a recoverable local export of all four stories. Only the two original
ErfgoedFlix stories remained in that database. Scripts skip an existing
organisation/slug and can be rerun. The import did not use AI and was stored as a
system import without a user ID.

```sh
# In the ErfgoedFlix repository: export offline for review
node scripts/export-legacy-stories.js > /tmp/legacy-stories.json
# In the platform repository: validate sources and dry-run; optionally apply
ENV=production node scripts/import-legacy-stories.js /tmp/legacy-stories.json
ENV=production node scripts/import-legacy-stories.js /tmp/legacy-stories.json --apply
```

## Direct story and draft links

The canonical LDMax URL is
`/organisaties/{organisation}/verhalen/{story-slug}` and supports HTML, JSON and RDF
extensions. Public links expose only the published snapshot. ErfgoedFlix accepts
`/?ldmax-verhaal={URL}` or `/bekijk?url={URL}`. URL-encode the story URL when building
a query string. The default trusted production origins are `https://www.ldmax.nl`
and `https://platform.ldmax.nl`; `FLIX_PREVIEW_ORIGINS` and the repository origin
can extend the trusted origins.

Draft links require an encrypted token, expire after fifteen minutes and become
invalid after a new saved revision. ErfgoedFlix keeps only a short HttpOnly
session, constructs configuration per request and never adds drafts to the global
repository. Draft responses use private/no-store, no-referrer and noindex.

## Upstream development

The reference platform repository is
`/Users/marklindeman/Code/LDMax/platform.ldmax.nl`. Consult it for existing Svelte,
Tailwind and Flowbite patterns. It is a reference by default; modify it only when
explicitly asked to work on the integration or platform. Story integration work
has been authorised. Do not copy version-specific settings blindly: ErfgoedFlix
uses SvelteKit 3, while the platform currently uses SvelteKit 2.

LDMax development starts with `ENV=production npm run dev` at
`https://platform.ldmax:5173`. This environment convention is specific to the
platform and is not required by ErfgoedFlix. To connect ErfgoedFlix locally:

```sh
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" \
FLIX_REPOSITORY_URL=https://platform.ldmax:5173/verhalen \
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Development reuses the existing reroute, content negotiation, publication rules,
organisation endpoints, layout and Flowbite components. It adds no second
standalone management application or database.

## Upstream releases

These instructions apply to maintainers of the original installation. Independent
operators should follow [self-hosting](self-hosting.md). The GitHub release
workflow and Kubernetes overlays contain the upstream registry and infrastructure;
adapt them before using them in a fork.

The maintainer checkout is `~/Code/cluster/flix.ldmax.nl`. Commit changes on `main` before an explicitly requested release. Local commits
may be ahead of `origin/main`; a separate push is not required. The preversion
check fetches `origin/main` and refuses a dirty working tree, another branch, or
remote commits that have not been integrated locally:

```sh
npm version patch  # or minor / major
```

This creates a version commit and `v` tag, then automatically pushes both through
`postversion`. The release workflow builds **only `linux/arm64`**, publishes
`ghcr.io/mightymax/erfgoedflix-app` with the version tag, and writes the version and
image digest to `infrastructure/overlays/prod/kustomization.yaml` on the `release`
branch. It does not publish a `latest` tag. Use an existing version tag or digest;
build your own image on AMD64.

Argo CD follows `release` and synchronises automatically. No manual build,
`kubectl apply` or rollout restart is needed. Keep secrets outside Git. A failed
build does not update the release branch. Inspect with:

```sh
gh run list --workflow release.yml
kubectl -n argocd get application erfgoedflix
```

The container falls back to `config/config.example.ttl` when no local
`config/config.ttl` exists during the build. Keep production configuration in your
own version control or supply an explicit mount. Never put secrets in the public
RDF configuration.
