# Projectverkenning — 27 oktober 2026

## Verhalenintegratie

De verhalenfunctionaliteit werkt op organisatieniveau, zonder datasetkeuze of `isPartOf`-filter. Contractversie 2 gebruikt de geregistreerde openbare organisatiebron. Een eerste implementatie in beide repos staat beschreven in `docs/ldmax-verhalen.md`. De databasemigratie is uitgevoerd met `ENV=production`; live activering van de repository en de volledige acceptatietest moeten nog volgen.

## Inmiddels uitgevoerd

De eerste onderhoudsstap is geïmplementeerd:

- Node 24.21.0 vastgelegd in `.nvmrc` en de Node-engine in package.json.
- Configuratieladen verplaatst naar `src/lib/server/flix/configuration.js`, met een wachtrij en canonieke bestandspaden. Alle include-takken worden verwerkt; herhaalde bestanden en cycli worden eenmaal gelezen. Elke Turtle-file heeft een eigen parser; het hoofdbestand wordt eenmaal gelezen. Er moet precies één applicatieroot zijn.
- `Flix.getInstance()` deelt de initialisatiepromise en laat een nieuwe poging toe na een fout. Geen request ontvangt meer een gedeeltelijk geladen instance.
- `npm run check:config` valideert offline de voorbeeldconfiguratie of een opgegeven bestand: route-identifiers, query-instellingen en CONSTRUCT-queries. De uitgebreidere controle is een expliciet commando; tijdens runtime worden bestanden en de applicatieroot gecontroleerd.
- Zeven lokale tests dekken includes, cycli, foutmeldingen, identifiers, querybestanden, de voorbeelden en gedeelde initialisatie/herstel.
- GitHub-workflow `Checks` controleert configuratie, tests, types, lint en build.

Alle genoemde controles slagen lokaal met Node 24. De developmentserver draait op `http://127.0.0.1:5175`; homepage en `/config.ttl` geven HTTP 200 en beide voorbeeldcollecties staan in de servergerenderde homepage. Daarna is de vormgeving vernieuwd en zijn ook echte collectie-/detailqueries en de browserweergave gecontroleerd; zie `docs/design.md`. De CI-workflow is lokaal toegevoegd en nog niet op GitHub uitgevoerd.

De nieuwe vormgeving, navigatie, dag-/nachtmodus, preview-foutafhandeling en gedeelde objecttypes staan beschreven in `docs/design.md`.

De analyse hieronder beschrijft de oorspronkelijke uitgangssituatie; de hierboven genoemde punten zijn inmiddels opgelost. De overige aandachtspunten blijven de backlog.

## Doel en huidige basis

Erfgoedflix toont thematische beeldbanken op basis van openbare SPARQL-endpoints. RDF bepaalt de website, deelcollecties, categorieën, metadata en querybestanden. De voorbeelden zijn WO2 Oorlogsbronnen en Daguerreobase. Behoud die configureerbaarheid bij modernisering.

De dependencies zijn al recent bijgewerkt: Svelte 5, SvelteKit 3, Tailwind 4, Flowbite-Svelte 1, Vite 8 en TypeScript 6 volgens package.json. Het voornaamste werk zit in betrouwbaarheid en onderhoudbaarheid, niet in een algemene upgrade. De productiecontainer gebruikt Node 24 en adapter-node.

## Architectuur en datastroom

1. `src/hooks.server.ts` haalt een gedeelde `Flix`-instance op en plaatst die in `locals`.
2. `src/lib/Flix.ts` leest `config/config.ttl` en extra bestanden via `flix:loadConfig` in een N3 Store. `sdo:WebApplication` is de root; `hasPart` en `isPartOf` koppelen collecties en categorieën.
3. `Page` beschrijft categorieën en haalt objecten op. `Engine` leest `comunica:settings`, maakt een Comunica QueryEngine en voert queries uit.
4. `helpers/queryParser.ts` leest inline queries of bestanden met datatype `flix:file`, vervangt LIMIT/OFFSET en verwerkt een optionele tekstvervanging voor het gekozen object. sparqljs parseert en genereert de CONSTRUCT-query.
5. `ArchivalObject` zet resultaatquads om naar objectmetadata. Detailpagina's vragen daarnaast alle predicate/object-bindings op.
6. Flowbite-componenten tonen carrousels, horizontale beeldrijen, categoriegalerijen en objectdetails.

| Route | Functie |
| --- | --- |
| `/` | Overzicht van geconfigureerde Flix-collecties |
| `/[identifier]` | Collectie met carrousel en categorievoorbeelden |
| `/[identifier]/[category]` | Categoriepagina; JSON bij Accept: application/json via +server.ts |
| `/[identifier]/[category]/[item]` | Detail van een object; item is een URL-gecodeerde IRI |
| `/config.ttl` | Samengevoegde configuratie als publieke Turtle |

Er is geen database of accountlaag in deze repo. De collectiepagina haalt de categorievoorbeelden client-side op in `onMount`; de carrousel wordt server-side geladen.

## Vastgestelde aandachtspunten

### Eerst: configuratie en querycorrectheid

- `Flix.getInstance()` bewaart de instance voordat `load()` klaar is. Gelijktijdige requests kunnen een onvolledig geladen instance krijgen; na een laadfout blijft die instance bestaan. Bewaar de initialisatiepromise en herstel na fouten.
- De include-lus in `Flix.load()` overschrijft de volgende include-lijst per bestand. Bij vertakkingen kunnen geneste includes verloren gaan; cycli worden niet gedetecteerd. Gebruik een wachtrij en een verzameling bezochte bestanden. Het hoofdbestand wordt ook tweemaal gelezen/geparseerd.
- Er is geen centrale validatie van unieke identifiers, vereiste eigenschappen of querybestanden. Voeg een afzonderlijk lokaal uitvoerbaar configuratiecontrolecommando toe.
- Paginering vervangt alle overeenkomende LIMIT/OFFSET-teksten, ook in subqueries, en voegt ontbrekende clausules niet toe. Leg eerst met fixtures vast op welk queryniveau paginering hoort te werken.
- Object-IRI's worden rechtstreeks geïnterpoleerd in SPARQL (`Page.getArchivalObject` en `Engine.allBindings`). Valideer invoer en construeer RDF-termen/querystructuren veilig.
- De detailroute maakt bindings via `JSON.parse` van stringconversies van RDF.Bindings. Map RDF-termen expliciet naar een gedeeld datatype; behoud taal en datatype waar nodig.

### Daarna: runtime en UI

- De collectiepagina laadt voorbeelden alleen in `onMount`. Navigatie tussen collecties kan dezelfde component hergebruiken; de map en requests volgen gewijzigde paginadata dan niet vanzelf.
- Mislukte categorie-fetches leveren alleen een consolemelding op; de spinner blijft zichtbaar. Er ontbreken een zichtbare foutstatus, een lege toestand en controle van `response.ok`.
- Het gedeelde `FlixObject.ArchivalObject` type noemt `title` en een enkele imageUrl, terwijl de server `name` en arrays retourneert. Introduceer gedeelde DTO-types en type de load-functies.
- Markdown en foutmeldingen worden met `{@html}` weergegeven zonder zichtbare sanitization. Onderzoek per bron de vertrouwensgrens; foutmeldingen kunnen beter als tekst worden getoond.
- Een onbekende collectie in `+layout.server.ts` retourneert een object met status/error in plaats van een HTTP-404 te werpen.
- Elke query krijgt een nieuwe QueryEngine; een expliciet timeout-, cache- en foutbeleid ontbreekt in de applicatiecode. Meet eerst voordat caching wordt toegevoegd.
- Een categorie toont standaard maximaal 20 objecten; de JSON-preview toont 10. De UI biedt geen verdere paginering.
- Backend en componenten staan door elkaar onder `src/lib/Flix`. Een `src/lib/server/flix`-grens en aparte componenten/types zouden de afhankelijkheden duidelijker maken.

## Verificatie van de uitgangssituatie

Op 27 oktober 2026 zijn succesvol uitgevoerd:

- `npm run check`: 0 fouten en 0 waarschuwingen.
- `npm run lint`.
- `npm run build`: client en SSR, adapter-node.

Er is geen testsuite of CI-workflow voor deze kwaliteitscontroles aanwezig. De releaseworkflow bouwt wel de container. Een geslaagde build bewijst niet dat externe endpoints, afbeeldingen, navigatie en detailpagina's werken. In deze verkenning zijn die niet live of in de browser getest en is geen developmentserver gestart.

## Referentie platform.ldmax.nl

De lokale platform-repo is bekeken: AGENTS.md, dependencies, Svelte/Vite-configuratie en documentatiestructuur. Bruikbare afspraken zijn Flowbite-Svelte als componentbasis, officiële MCP-documentatie en aparte server-/browsertests. Platform heeft al Vitest en Playwright; Flix nog niet.

Platform gebruikt momenteel SvelteKit 2 en TypeScript 5, Flix SvelteKit 3 en TypeScript 6. De configuratievormen verschillen daardoor; het ontbreken van svelte.config.js in Flix is op zichzelf geen defect. Platformspecifieke database-, authenticatie- en ENV=production-afspraken horen niet automatisch bij Flix.

## Voorgestelde volgorde

1. Maak de basis reproduceerbaar: Node-versie vastleggen, configuratiecontrole, lokale fixtures en CI voor check/lint/build en gerichte tests.
2. Repareer initialisatie/includes, veilige objectselectie, paginering en expliciete bindingsconversie met regressietests.
3. Scheid servercode, DTO-types en UI; behoud bestaande routes en RDF-vocabulaire.
4. Maak laden, fouten, lege resultaten en navigatie betrouwbaar; voeg browserdekking toe voor collectie → categorie → detail en terug, plus onbekende identifiers.
5. Verbeter daarna zoek-/filtermogelijkheden, paginering, beeldpresentatie en gemeten performance.

Deze verkenning voegt documentatie en agentinstructies toe. De genoemde applicatieproblemen zijn nog niet aangepast.
