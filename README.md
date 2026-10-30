# LDMax SPARQL Flix

Voor onderhoud en hervatting: zie [projectstatus en architectuur](docs/project-status.md) en [werkafspraken voor agents](AGENTS.md).

Inspired by the [NDE Heritage FLix](https://github.com/netwerk-digitaal-erfgoed/heritageflix), this project aims to create a simple but visualy attractive website using SPARQL queries. Although this projectes uses [LDMax](https://ldmax.nl) SPARQL endpoints, you can build your own Flix using any publicaly available SPARQL endpoint. The configuration if the entire project is done in RDF, see the [./config/config.example.nl](example configuration).

> [!NOTE]
>
> This is a work-in-progress project. The aim is to provide a simple to use tool to create images-based websites based on SPARQL queries only.

A demo of this project is available via https://erfgoedflix.nl.

## Install

Gebruik Node.js 24 (`nvm use`, zie `.nvmrc`).

To run a local development Flix, follow these steps:
```bash
git clone https://github.com:mightymax/flix.ldmax.nl.git
cd flix.ldmax.nl
cp config/config.example.ttl config/config.ttl
npm install
npm run dev -- --open
```

This wil open your browser at http://localhost:5173 with the provided example configuration based on [WO2 Oorlogsbronnen](http://oorlogsbronnen.nl).

## Ontwikkelen en controleren

```sh
npm run check:config                       # meegeleverde voorbeeldconfiguratie
npm run check:config -- config/config.ttl  # eigen configuratie
npm test                                  # lokale regressietests, geen endpoints nodig
npm run check
npm run lint
npm run build
```

De configuratiecontrole controleert de root, identifiers binnen dezelfde bovenliggende
pagina, query-instellingen en CONSTRUCT-querybestanden zonder externe endpoints te
benaderen. Include- en querypaden blijven relatief aan de projectroot. Herhaalde
includes en cycli worden eenmaal ingelezen. De controle bevestigt geen bereikbaarheid
van endpoints of afbeeldingen. De GitHub-workflow `Checks` voert deze controles uit
op pull requests en pushes naar `main`.

## Using Docker
Using the example configuration:
```bash
docker run -it --rm -p 3000:3000 ghcr.io/mightymax/erfgoedflix-app
``` 

## Releases en deployment

Werkmap: `~/Code/cluster/flix.ldmax.nl`. Commit en push wijzigingen eerst naar `main`.

```sh
npm version patch  # of minor / major
```

Dit maakt een versiecommit en v-tag en pusht beide automatisch naar GitHub. De
releaseworkflow bouwt uitsluitend `linux/arm64`, publiceert naar
`ghcr.io/mightymax/erfgoedflix-app` en schrijft de versie plus image-digest naar
`infrastructure/overlays/prod/kustomization.yaml` op de branch `release`.
Argo CD volgt die branch en synchroniseert automatisch. Geen handmatige build,
`kubectl apply` of rollout restart nodig. Secrets blijven buiten Git.

Controle: `gh run list --workflow release.yml` en
`kubectl -n argocd get application erfgoedflix`.
Een mislukte build wijzigt de releasebranch niet.

De container gebruikt `config/config.example.ttl` als standaard wanneer het lokale,
door Git genegeerde `config/config.ttl` ontbreekt. Houd productieconfiguratie dus
in versiebeheer (of configureer daarvoor expliciet een mount).

## Coverafbeelding per collectie

Voeg `sdo:image` toe aan de collectienode in de RDF-configuratie, naast `sdo:name`:

```turtle
sdo:name "Mijn collectie" ;
sdo:headline "Verhalen die blijven" ;
sdo:image <https://jouw-server.nl/cover.jpg> ;
```

De startpagina toont de collectietitel over de cover. Zonder afbeelding of bij een
laadfout blijft de titel zichtbaar op de grafische achtergrond. Het WO2-voorbeeld
bevat een cover; Daguerreobase laat de variant zonder cover zien. Herstart de
server na een RDF-configuratiewijziging, omdat configuratie per proces wordt geladen.

Optioneel vervangt `sdo:headline` de subtitel “Een venster op het verleden” op de
collectiekaart. Zonder headline, of bij een lege waarde, blijft die standaardtekst staan.

## Verhalen uit LDMax

De optionele koppeling via `FLIX_REPOSITORY_URL` en de LDMax-beheeromgeving zijn
beschreven in [LDMax-verhalen](docs/ldmax-verhalen.md), inclusief databaseactivatie,
publicatierechten, AI-suggesties en NDE/IIIF-ondersteuning.

Een afzonderlijk verhaal kun je direct bekijken via
`/bekijk?url=<URL-gecodeerde LDMax-verhaallink>`. In de LDMax-beheeromgeving maakt
**Opslaan en voorbeeld maken** ook een tijdelijke link voor een ongepubliceerd
concept. Zie [directe voorbeeldlinks](docs/ldmax-verhalen.md#direct-bekijken-via-een-ldmax-verhaallink).

### Publieke LDMax-catalogus

De publieke verhalenpagina en RDF-repository staan op `https://www.ldmax.nl/verhalen`. Na het uitrollen van die LDMax-route gebruikt ErfgoedFlix de catalogus met:

```env
FLIX_REPOSITORY_URL=https://www.ldmax.nl/verhalen
```

De repository wordt als Turtle ingelezen, met automatische paginering en één minuut cache. `/verhalen.ttl` en `/verhalen.jsonld` zijn ook beschikbaar. Zie [de verhalenintegratie](docs/ldmax-verhalen.md) voor import en uitrolvolgorde en development.
