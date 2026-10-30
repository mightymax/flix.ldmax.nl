<p align="center"><img src="docs/assets/erfgoedflix.svg" alt="ErfgoedFlix" width="480"></p>

# ErfgoedFlix

Build your own visual heritage collection website with RDF configuration and
SPARQL queries. ErfgoedFlix connects to public SPARQL endpoints and presents
collections, categories and object details. You can host it independently with
your own branding and data sources, without an account or application database.

Inspired by [NDE HeritageFlix](https://github.com/netwerk-digitaal-erfgoed/heritageflix).
Explore the [demo](https://erfgoedflix.nl).

## Get started

Read the [self-hosting guide](docs/self-hosting.md) for installation, production
hosting with Node or Docker, HTTPS, updates and troubleshooting. See
[RDF configuration](docs/configuration.md) to create your own collections and queries.

To try the examples locally, install Git and Node.js 24 (see [.nvmrc](.nvmrc)):

```sh
git clone https://github.com/mightymax/flix.ldmax.nl.git
cd flix.ldmax.nl
nvm use
npm ci
# Only create the local configuration if it does not already exist:
test -f config/config.ttl || cp config/config.example.ttl config/config.ttl
npm run check:config -- config/config.ttl
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. The examples use
WO2 Oorlogsbronnen and Daguerreobase. Image results require access to their external
SPARQL endpoints and image servers.

## Development

```sh
npm run check:config                       # bundled example configuration
npm run check:config -- config/config.ttl  # your local configuration
npm test                                  # local fixtures; no endpoints required
npm run check
npm run lint
npm run build
```

Configuration validation does not test endpoint or image availability. The
`Checks` GitHub workflow runs the project checks on pull requests and pushes to
`main`. See [project status](docs/project-status.md), [design](docs/design.md) and
[contributor instructions](AGENTS.md) for architecture and maintenance guidance.

## Integrations and upstream operations

The optional [LDMax integration](docs/ldmax.md) provides a remote story catalogue
and preview links. It is not required for a standalone installation. The same
document records upstream-specific development and deployment details.

## Licence

Copyright © 2026 Mark Lindeman and contributors.

ErfgoedFlix is licensed under the **European Union Public Licence 1.2 (EUPL-1.2)**.
See [LICENSE](LICENSE) for the complete text and the
[official EUPL resources](https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12).
Third-party dependencies retain their own licences. Heritage data and images
remain subject to their source licences and rights.
