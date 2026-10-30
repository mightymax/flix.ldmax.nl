# Verhalen in LDMax en ErfgoedFlix

## Publieke catalogus

`/verhalen` is de publieke verhalenpagina binnen de bestaande LDMax-layout en navigatie. De pagina toont covers, organisatie, introductie en thema-aantallen, met zoeken, een organisatiefilter, paginering en links naar ErfgoedFlix. Alleen gepubliceerde snapshots van openbare organisaties met een actief geregistreerd bronendpoint zijn zichtbaar. Concepten, gebruikersgegevens en endpointcredentials worden nooit gepubliceerd. Bron- en publicatiezichtbaarheid worden bij iedere aanvraag opnieuw gecontroleerd.

Dezelfde route ondersteunt de bestaande LDMax content negotiation en extensieroutering:

- Browser of geen specifieke Accept-header: HTML.
- `Accept: text/turtle` of `/verhalen.ttl`: Turtle.
- `Accept: application/ld+json` of `/verhalen.jsonld`: JSON-LD.
- Ook N-Triples, N-Quads, TriG, N3 en RDF/XML worden ondersteund.
- Een expliciete extensie heeft voorrang op Accept.
- `q`, `organisation`, `limit` (1–100) en `offset` sturen filters en paginering. RDF bevat een `hydra:next`-link.

De catalogus is een `schema:Collection` met canonieke verhaal-URI’s als `schema:hasPart`. Verhaalmetadata, organisatie, bronendpoint, gerangschikte thema’s, filters en handmatige queries staan als afzonderlijke RDF-eigenschappen in het document. De catalogus gebruikt **geen JSON-configuratieliterals**. De gedeelde modules `src/lib/stories/repositoryRdf.js`, `contract.js` en `selectionQuery.js` staan identiek in beide repositories.

## ErfgoedFlix aansluiten

Stel na het uitrollen van de LDMax-route in:

```env
FLIX_REPOSITORY_URL=https://www.ldmax.nl/verhalen
```

ErfgoedFlix vraagt Turtle aan en accepteert ook N-Triples, N-Quads, TriG en N3. Er is geen JSON-fallback voor de repository. Het aanbod wordt één minuut gecachet en bij een volgend verzoek vernieuwd. Afbeeldingen en objectmetadata blijven rechtstreeks uit de SPARQL-bronnen komen; harvesten is niet nodig.

De client begrenst documentgrootte en paginering, weigert redirects, controleert unieke verhaal-ID’s en valideert RDF-eigenschappen en canonieke URI’s. Alleen inline queries zijn mogelijk; een remote configuratie kan geen lokale bestanden inladen.

Zonder `FLIX_REPOSITORY_URL` blijven de lokale Turtle-bestanden werken. Met de repository worden de routes `/<organisatie>--<verhaalslug>`. De geïmporteerde lokale verhalen behouden ook hun oorspronkelijke Flix-routes (`/wo2-oorlogsbronnen` en `/Daguerreobase`).

## Beheer, publicatie en queries

Beheer staat op `/organisaties/{organisatie}/verhalen`; leden bewerken concepten en organisatiebeheerders publiceren. Bestaande verhalen worden bewerkt op `/{uuid}/bewerken`, nieuwe verhalen op `/nieuw`. De editor heeft ruime tekstvelden, inklapbare thema’s, primaire knoppen in de LDMax-themakleur en een tijdelijke ErfgoedFlix-voorbeeldlink. ‘Beschrijf je idee’ is alleen beschikbaar bij nieuwe verhalen. AI gebruikt waargenomen waarden via LDMax MCP; suggesties worden nooit automatisch opgeslagen of gepubliceerd.

Een handmatige objectselectie staat per thema in `selectionQuery` en gebruikt `SELECT DISTINCT ?heritageObject`. De modal biedt testen, voorbeeldobjecten, herstel naar de automatische selectie en een link naar de organisatiegebonden SPARQL IDE. ErfgoedFlix voegt beeldmetadata en paginering toe. Wijzigingen aan de gepubliceerde versie worden pas zichtbaar na opnieuw publiceren. Optimistische revisiecontrole voorkomt overschrijven bij gelijktijdige bewerkingen.

Nieuwe verhalen volgen het NDE Schema.org-profiel en gebruiken CreativeWork-objecten. Geïmporteerde oudere verhalen kunnen expliciet een volledige `constructQuery` gebruiken om oude Photograph-/Dublin Core-velden en afbeeldingsbewerkingen te behouden. Ook deze queries worden geparseerd en gecontroleerd: geen updates, SERVICE of FROM, ook niet genest. Testen verloopt via een afgeleide, begrensde SELECT-query tegen het geregistreerde organisatie-endpoint. Carrouselqueries worden eveneens gecontroleerd. Pagina-limieten worden op AST-niveau aangepast; limieten en tekst binnen handmatige subqueries blijven behouden.

`associatedMedia`, thumbnails, content-URL’s, formaten en rechten blijven voor nieuwe verhalen behouden. IIIF Presentation 2/3 opent met Tify; anders worden volledige afbeeldingen en thumbnails gebruikt.

## Inladen en uitrollen

Er is geen extra configuratieversie, versiegeschiedenis of compatibiliteitslaag toegevoegd. De bestaande opslag in `stories` blijft in gebruik. De twee geïmporteerde verhalen bevatten hun oorspronkelijke bronqueries; de nieuwe code moet worden uitgerold om die velden te kunnen lezen.

Rol eerst LDMax met `/verhalen` uit, controleer HTML en `/verhalen.ttl`, en rol daarna ErfgoedFlix met `FLIX_REPOSITORY_URL=https://www.ldmax.nl/verhalen` uit. De bestaande JSON-API blijft beschikbaar, maar ErfgoedFlix gebruikt die niet meer voor het repository-aanbod.

## Uitgevoerde import op 30 oktober 2026

De lokale configuraties zijn gecontroleerd, inclusief alle acht themaquery’s tegen de geregistreerde organisatiebronnen, en gepubliceerd in de productie-database:

| Organisatie | Verhaalslug | ID |
| --- | --- | --- |
| `wo2net` | `wo2-oorlogsbronnen` | `297cca2d-485a-4506-a34b-1d05941a3b26` |
| `nederlands-fotomuseum-daguerreobase` | `daguerreobase` | `e14fa497-85dd-455d-8b90-9883fc98cb91` |

Queries, thema’s, titel/introductie, oorspronkelijke coverinstelling, maker, datums en carrousel blijven behouden. De twee overige experimentele verhalen zijn op verzoek verwijderd, nadat een herstelbare lokale export van alle vier verhalen is gemaakt. Alleen de twee oorspronkelijke ErfgoedFlix-verhalen staan nog in de database. De scripts zijn herhaalbaar; een bestaande organisatie/slug wordt overgeslagen. De import heeft geen AI gebruikt en is als systeemimport zonder gebruikers-ID opgeslagen.

```sh
# In de Flix-repo: offline export naar een te controleren bestand
node scripts/export-legacy-stories.js > /tmp/legacy-stories.json
# In de platform-repo: broncontroles en dry run, daarna optioneel uitvoeren
ENV=production node scripts/import-legacy-stories.js /tmp/legacy-stories.json
ENV=production node scripts/import-legacy-stories.js /tmp/legacy-stories.json --apply
```

## Losse verhaal- en conceptlinks

Canonieke URL: `/organisaties/{organisatie}/verhalen/{verhaal-slug}`. Deze biedt HTML, JSON en RDF-extensies. Een openbare link toont alleen de gepubliceerde snapshot. ErfgoedFlix accepteert `/?ldmax-verhaal={URL}` of `/bekijk?url={URL}`. De standaard vertrouwde productie-origins zijn `https://www.ldmax.nl` en `https://platform.ldmax.nl`; extra origins komen uit `FLIX_PREVIEW_ORIGINS` en de repository-origin.

Conceptlinks vereisen een versleutelde token, verlopen na vijftien minuten en worden ongeldig na een nieuwe opgeslagen revisie. Flix bewaart alleen een korte HttpOnly-sessie, bouwt de configuratie per verzoek en voegt concepten nooit toe aan de globale repository. Conceptantwoorden hebben private/no-store, no-referrer en noindex.

## Development en controles

LDMax start met `ENV=production npm run dev` op `https://platform.ldmax:5173`. Flix draait op `http://localhost:5175` met de LDMax-developmentcatalogus:

```sh
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" \
FLIX_REPOSITORY_URL=https://platform.ldmax:5173/verhalen \
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

De ontwikkeling gebruikt de bestaande LDMax-reroute, content-negotiationmiddleware, publicatievoorwaarden, organisatie-endpoints, layout en Flowbite-componenten. Geen tweede geïsoleerde beheerapplicatie of nieuwe database is toegevoegd.
