# Working on ErfgoedFlix

This project builds configurable heritage image collections using RDF configuration
and SPARQL. Read `docs/project-status.md` first for architecture, known issues and
next steps. Write documentation in English and use the product name **ErfgoedFlix**.

## Workflow

- Work in small, reviewable steps. Preserve RDF configuration and existing public
  routes during refactors.
- Check `git status` first and preserve the user's changes.
- Use the official Svelte MCP server for Svelte/SvelteKit work and Flowbite
  documentation for component changes. Use Svelte 5 runes and Flowbite-Svelte
  where appropriate. Check changed components with the Svelte autofixer.
- Follow the reference-repository guidance in `docs/ldmax.md#upstream-development`
  for existing Svelte, Tailwind and Flowbite patterns, platform version differences
  and the scope of authorised integration work.
- Keep filesystem access, RDF configuration and SPARQL execution on the server.
  Return simple, explicitly typed objects to the UI.
- Add focused regression tests with local fixtures when changing query logic or
  configuration loading. External endpoints are not a reliable basis for unit tests.
- For code changes, run `npm run check`, `npm run lint` and `npm run build`.
  Report runtime and browser verification separately.
- Use Node 24 (`nvm use`). Also run `npm test` and `npm run check:config` when
  changing configuration or the backend. Tests use Node's built-in runner and
  local fixtures.
- Update documentation when architecture, commands or known limitations change.

## Development server

- First check for an existing server for this repository, including the process's
  working directory. Other projects may use port 5173.
- Local operation requires `config/config.ttl`. Only create it if missing, by
  copying `config/config.example.ttl`; never overwrite local configuration.
- If needed, start `npm run dev -- --host 127.0.0.1`, choose an available port and
  share the actual URL.
- Always leave a development server you start running so Mark can inspect it.
  Do not stop or restart other projects' servers.
- ErfgoedFlix does not require `ENV=production`; integration-specific environment
  conventions are documented separately in `docs/ldmax.md`.

## Configuration and releases

- Git ignores `config/config.ttl`. Do not read secrets for documentation or commit
  local configuration or credentials.
- `/config.ttl` currently publishes the merged RDF configuration. Never put secrets
  in it.
- `npm version` automatically pushes to `main` through `postversion` and triggers
  deployment. Use it only for an explicit release request.
- Upstream releases build an ARM64 container in GHCR, update the `release` branch
  and deploy through Argo CD. See `docs/ldmax.md#upstream-releases` and
  `.github/workflows/release.yml`.
