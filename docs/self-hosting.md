# Self-hosting ErfgoedFlix

This guide creates an independent website using local RDF configuration. You do
not need an account, application database, AI service or Kubernetes. ErfgoedFlix
runs as a Node server; static-only hosting is insufficient. The server executes
SPARQL queries and visitors' browsers retrieve images from their sources.

## 1. Install and try the examples

Install Git and Node.js 24 as specified in `.nvmrc` (currently 24.21.0). With nvm:

```sh
git clone https://github.com/mightymax/ErfgoedFlix.git
cd ErfgoedFlix
nvm use
npm ci
test -f config/config.ttl || cp config/config.example.ttl config/config.ttl
npm run check:config -- config/config.ttl
npm run dev -- --host 127.0.0.1
```

Use the URL printed in the terminal; Vite may select another port if the default
is occupied. The server needs network access to your SPARQL sources, and visitors
need access to the image servers. The bundled examples do not require endpoint
credentials. There is no built-in account system or editor for local configuration.

## 2. Configure your collections

Follow [RDF configuration](configuration.md). Start with a copy of a bundled
collection and its `.rq` files. Change the application name, description, URL and
creator in `config/config.ttl`. If you change the RDF namespace, update every
collection reference to the application root as well.

Use local configuration mode without a remote repository environment variable;
see [optional integration settings](ldmax.md#connecting-erfgoedflix) if you have
previously enabled the catalogue integration. No special `ENV` value is required.

```sh
npm run check:config -- config/config.ttl
```

The validator reads local files and parses queries. It does not test external
sources or completeness of image metadata. Restart the process after RDF changes.

## 3. Run in production with Node

From the project root:

```sh
npm ci
npm run check:config -- config/config.ttl
npm test
npm run check
npm run lint
npm run build
NODE_ENV=production HOST=127.0.0.1 PORT=3000 ORIGIN=https://images.example.org node build
```

Replace `https://images.example.org` with your public URL. Always use the project
root as the working directory: configuration, includes and query files are
resolved relative to it. To deploy to another server, provide `build/`,
`node_modules/` (production dependencies), `package.json` and the complete custom
`config/` directory, plus any query files stored elsewhere. Install production
dependencies on the target platform with `npm ci --omit=dev --ignore-scripts`;
include `package-lock.json` for this step. Build with devDependencies first.

Use a process manager such as systemd to start and restart the server with the
correct working directory and environment variables. `npm run dev` and
`npm run preview` are development and verification commands, not the production
entry point. Set variables through your process manager; do not assume `node build`
automatically loads `.env`.

Place an HTTPS reverse proxy in front of `127.0.0.1:3000` and forward the public
host and all routes. Set `ORIGIN` to the external HTTPS origin. Configure your own
domain, DNS and certificate on your hosting platform. This guide assumes a domain
or subdomain served at `/`; it does not configure deployment under a subpath.

## 4. Run in production with Docker

Build your own image on your target architecture, including a typical AMD64
server. The Dockerfile uses Node 24. From the project root:

```sh
docker build -t my-erfgoedflix:local .
docker run -d --name my-erfgoedflix --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e HOST=0.0.0.0 -e PORT=3000 \
  -e ORIGIN=https://images.example.org \
  --mount type=bind,source="$(pwd)/config",target=/app/config,readonly \
  my-erfgoedflix:local
```

The mount must contain your `config.ttl` and all included files and queries.
Paths such as `config/my-collection/objects.rq` resolve from `/app` inside the
container. Mount files outside `config/` at their corresponding paths separately.
The mount replaces the entire bundled configuration directory. Without a mount,
the image uses the `config/config.ttl` present during the build, or falls back to
the examples. `.dockerignore` currently does not exclude local `config/config.ttl`;
review your build context before publishing an image.

Use the HTTPS proxy described above to forward to port 3000. Inspect errors with
`docker logs my-erfgoedflix`. After changing configuration:

```sh
docker restart my-erfgoedflix
```

For the published upstream image and its architecture restrictions, see
[upstream releases](ldmax.md#upstream-releases). The bundled Kubernetes overlays
and release workflow are specific to the upstream deployment; adapt them before
using them with your domain or registry.

## 5. Verify, update and recover

After deployment, check:

- `/`: your title, description and collection cards.
- `/<collection>`: carousel and category previews.
- `/<collection>/<category>`: images and titles.
- An object detail page: the selected object, metadata and return navigation.
- `/config.ttl`: the merged configuration is public and contains no secrets.

Use the identifiers in your configuration. The bundled examples include
`/Daguerreobase` and `/Daguerreobase/portrait` (case-sensitive). Also test in a
browser at your public HTTPS address; a successful build does not prove that
SPARQL sources or images work.

Back up custom configuration and queries, or keep them in your own version control.
Git ignores `config/config.ttl`: cloning or pulling does not restore it. There is
no application database to back up. Record the deployed commit or image version.
Test updates with a copy of your configuration, run the checks above, rebuild and
restart or replace the process/container. Keep the previous version and
configuration for rollback. Do not use `npm version` for routine updates: the
project's `postversion` script automatically pushes to `main`.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `Cannot load Flix configuration` | Does `config/config.ttl` exist? Is the working directory correct? Does the Docker mount include every referenced file? |
| Root or identifier validation error | There must be exactly one `sdo:WebApplication`; identifiers must be unique within each parent. Run `check:config`. |
| Missing custom collections | Check local configuration mode, the root IRI and `hasPart`/`isPartOf`; restart after changes. |
| Query error or empty category | Test the query at your endpoint; check the source URL, `sdo:ArchivalObject` type and image fields. Inspect server logs. |
| Wrong object on detail page | Use `?heritageObject` and `#{ITEM_FILTER}` in category queries; see the configuration guide. |
| Images fail to load | Check the URL, usage rights, HTTPS, browser console and access to the source server. |
| Upstream image fails on AMD64 | Build your own image; upstream releases currently target ARM64 only. |

Only load configuration you trust: local Turtle can load files and queries, and
its descriptions support Markdown/HTML. Do not store passwords, tokens or private
endpoint URLs in configuration: `/config.ttl` publishes the merged RDF. Check
heritage data and image rights with their sources.
