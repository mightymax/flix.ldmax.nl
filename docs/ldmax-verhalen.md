# Verhalen beheren in LDMax en publiceren in Erfgoedflix

## Afgesproken gedrag

Een verhaal is de nieuwe publieksnaam voor een Flix-collectie. Een verhaal heeft een titel, optionele headline en cover, introductie en één tot twaalf thema's. Een LDMax-gebruiker kan meerdere verhalen beheren. Concepten zijn privé; publicatie maakt een afzonderlijke versie openbaar. Een verhaal hoort bij één organisatie en gebruikt het openbare SPARQL-endpoint van die organisatie. Thema’s kunnen objecten uit meerdere datasets combineren; een datasetkeuze of `isPartOf`-filter is niet vereist. Een organisatie kan meerdere verhalen hebben.

## Verantwoordelijkheden

LDMax beheert gebruikers, organisatierechten, de organisatiebron, concepten, publicatie en AI-suggesties. Erfgoedflix leest alleen de openbare publicatieversies en verzorgt de presentatie. De brondata in het SPARQL-endpoint bepaalt welke thema's en objecten beschikbaar zijn. Een thema begint met een gestructureerde selectie. De gebruiker kan deze vervangen door een gecontroleerde SPARQL SELECT-objectselectie; AI schrijft geen uitvoerbare query’s.

### LDMax-platform

- Beheer: `/organisaties/[slug]/verhalen`, bereikbaar via de organisatiepagina voor gebruikers met bewerkrechten.
- Organisatieleden en beheerders bewerken concepten; alleen organisatiebeheerders publiceren of trekken publicaties in. Bestaande platformbeheerders behouden hun organisatierechten.
- Opslag: nieuwe tabel `stories`, met organisatie-id, unieke slug per organisatie, concept-JSON, gepubliceerde JSON-snapshot en revisienummer. Optimistische versiecontrole voorkomt dat gelijktijdige bewerkingen elkaar stil overschrijven.
- Een concept opslaan verandert de openbare versie niet. De URL van een gepubliceerd verhaal wordt niet via een concept gewijzigd: trek de publicatie eerst in. Daarmee blijven routes uniek.
- De organisatie in de route bepaalt de bron. Het geregistreerde openbare SPARQL-endpoint wordt server-side bepaald; de browser kan geen endpoint of servicetoken meegeven. Handmatige objectselecties worden server-side geparseerd en gecontroleerd.
- Themaonderzoek telt maximaal 50 veelvoorkomende geregistreerde waarden voor `about`, `genre`, `additionalType`, `contentLocation`, `locationCreated`, `creator` en legacy `keywords`. Dit is een begrensde verkenning, geen volledig overzicht. Lokale termnodes worden waar aanwezig via `sameAs` herkend.
- Voor opslaan en publiceren wordt elk filter met een begrensde query gecontroleerd. Een filter zonder objecten in het openbare organisatie-endpoint wordt afgewezen. Voorbeeldobjecten zijn vooraf opvraagbaar.
- Openbare repository: `GET /api/verhalen?limit=50&offset=0`. Het antwoord bevat contractversie 2, verhalen met publicatiesnapshot, organisatie-URL, openbaar endpoint en `nextOffset`. Geen concepten, gebruikersgegevens of endpointcredentials. De publicatiestatus van de organisatie en de actieve registratie van het openbare endpoint worden bij elke uitlezing opnieuw gecontroleerd. De publicatiestatus van afzonderlijke datasets is geen filter op het verhalenaanbod. De bron is het openbare endpoint; data die daarin staat is voor deze functionaliteit al openbaar.

### AI

De optionele voorstelknop gebruikt het bestaande `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL` en het bestaande organisatievragenbudget. Zonder ingeschakeld budget of sleutel blijft handmatig beheer beschikbaar.

Een interne MCP-client onderzoekt eerst organisatiemetadata, endpoint, voorbeelden, klassen en eigenschappen en haalt daarna de organisatiebrede themawaarden op via `execute_sparql`. De Responses API ontvangt de gebruikerswens en die waargenomen kandidaten. Structured Outputs begrenst het voorstel tot metadata en verwijzingen naar kandidaatindices. De server vertaalt deze indices terug naar echte filters en controleert de resultaten opnieuw. AI kan niets opslaan of publiceren. Het formulier vermeldt welke tekst naar OpenAI gaat. Er is in deze implementatieronde geen live OpenAI-aanroep gedaan.

### Erfgoedflix

Zonder `FLIX_REPOSITORY_URL` blijft lokale Turtle-configuratie werken. Met deze omgevingsvariabele komt het verhalenaanbod volledig uit LDMax:

```sh
FLIX_REPOSITORY_URL=https://platform.ldmax.nl/api/verhalen npm run dev -- --host 127.0.0.1 --port 5175
```

De repository wordt server-side opgehaald met deadlines, paginering, maximale responsgrootte en strikte contractvalidatie. Een snapshot wordt maximaal één minuut hergebruikt. Na een mislukte verversing worden oude publicaties niet onbeperkt aangeboden; een volgende aanvraag probeert opnieuw. De repository-URL is een deploymentinstelling, geen bezoekersinvoer. Gebruik uitsluitend je eigen vertrouwde LDMax-repository.

Verhaalroutes worden `/<organisatie>--<verhaalslug>`. Bestaande lokale routes blijven werken in de lokale configuratiemodus. De JSON-configuratie wordt vertaald naar de bestaande RDF-store, uitsluitend met inline, door de applicatie gegenereerde queries. Een remote verhaal kan geen lokaal bestand includen of uitlezen. Beheerde beschrijvingen worden als ge-escapete gewone tekst weergegeven.

## NDE-profiel en IIIF

De gegenereerde queries ondersteunen beide Schema.org-namespaces en selecteren `CreativeWork`-objecten uit het openbare endpoint van de gekozen organisatie. `isPartOf` kan in de brondata naar één of meerdere datasets verwijzen, maar begrenst het verhaal niet. Objecten zonder zo’n koppeling kunnen ook worden getoond. Legacy data die alleen als `Photograph` zijn getypeerd worden niet stil als `CreativeWork` geïnterpreteerd; de editor legt uit wanneer passende waarden ontbreken.

`associatedMedia` blijft behouden in het queryresultaat, inclusief media-identiteit, `thumbnailUrl`, `contentUrl`, `encodingFormat`, `license` en `copyrightNotice`. Manifesten worden herkend aan het gedeclareerde IIIF-mediatype. Op de detailpagina heeft een Presentation-manifest voorrang en opent Tify de paginering en zoom. Versies 2 en 3 worden herkend. Zonder manifest wordt een volledige afbeelding gebruikt, daarna de thumbnail. De rechten van iedere digitale reproductie worden afzonderlijk getoond.

Dit is profielbewuste consumptie, geen volledige SHACL-certificering van een dataset. De bronsystemen blijven verantwoordelijk voor hun profielconformiteit. Het verhaal is presentatieconfiguratie; het wordt niet verward met een erfgoedrecord van het subtype `Article`.

## Activeren en controleren

De code is toegevoegd in beide repositories. De nieuwe tabel vereist platformmigratie `drizzle/0025_stories.sql`. Die is op 27 oktober 2026 uitgevoerd met `ENV=production npm run db:migrate`. Alleen `0025_stories` stond open. De tabel, kolommen, primaire sleutel, foreign keys en unieke organisatie/slug-index zijn gecontroleerd; er stonden daarna geen migraties meer open. De nieuwe tabel is leeg. Bestaande verhalen zijn niet automatisch geïmporteerd en de Flix-developmentserver blijft voorlopig in de lokale configuratiemodus. Lokale verificatie: 15 Flix-tests (waaronder echte queries op RDF-fixtures en directe verhaallinks) en 20 platformtests voor toegang, publicatiesnapshots, AI-validatie en tijdelijke voorbeeldlinks slagen. Typecontrole, lint en builds zijn in beide repositories uitgevoerd.

Een volledige live acceptatietest met een LDMax-account, publicatie en een betaalde AI-aanroep moet na migratie volgen.

Concrete activatiestappen:

1. Database gereed: migratie `0025_stories` is uitgevoerd met `ENV=production npm run db:migrate`.
2. Controleer in een LDMax-organisatie met een openbaar endpoint en NDE-brondata: themaonderzoek, concept opslaan, bewerken, publiceren en intrekken.
3. Configureer `FLIX_REPOSITORY_URL` op de juiste omgeving en herstart de Flix-server. Houd de developmentserver beschikbaar.
4. Controleer een gepubliceerd verhaal en een object met IIIF-manifest; controleer dat conceptwijzigingen pas zichtbaar worden na opnieuw publiceren.

De omschakeling naar organisatieniveau gebruikt contractversie 2: concepten bevatten geen `datasetSlug`; de publicatiesnapshot bevat `source: { scope: "organisation", endpoint, url }` in plaats van datasetmetadata. Versie 1 wordt expliciet afgewezen, zodat een oude datasetselectie nooit stil wordt verbreed. Bij de omschakeling is met `ENV=production` gecontroleerd dat de tabel nog nul verhalen bevatte. De repository op de bestaande platform-developmentserver is daarna gecontroleerd: HTTP 200 met `version: 2`, een lege verhalenlijst en `nextOffset: null`. De SQL-tabel en bestaande migratie hoeven niet te veranderen. Platform en Erfgoedflix moeten samen met dezelfde contractversie worden uitgerold.

De gedeelde contract-/querymodule `src/lib/stories/contract.js` staat identiek in beide repositories. Bij veranderingen moeten beide kopieën en tests tegelijk worden bijgewerkt. Een apart gedeeld package is een logische vervolgstap zodra het contract stabiel is.

## Bronnen

- NDE: https://docs.nde.nl/schema-profile/ — met name namespaces, termverwijzingen, datasetlidmaatschap en associatedMedia.
- IIIF Presentation 3: https://iiif.io/api/presentation/3.0/
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

## Direct bekijken via een LDMax-verhaallink

In LDMax kun je **Opslaan en voorbeeld maken** kiezen en daarna **Open voorbeeld in Erfgoedflix**. Ook een nog ongepubliceerd verhaal kan zo worden gecontroleerd. De link toont de opgeslagen versie; na bewerken en opnieuw opslaan maak je een nieuwe link. Er is geen publicatie nodig en het concept wordt niet aan de openbare repository toegevoegd.

- `GET /api/verhalen/[id]` levert uitsluitend de gepubliceerde versie, met dezelfde zichtbaarheidscontrole als de repository.
- De beheer-API kan na controle van organisatierechten een tijdelijke conceptlink maken. Deze gebruikt de bestaande authenticated encryption van LDMax en is gebonden aan verhaal-ID, opgeslagen revisie en een vervaltijd van vijftien minuten. Een gewijzigde revisie maakt de oude link ongeldig. De link geeft tijdelijk toegang tot het concept: deel hem alleen met mensen die mogen meekijken.
- Erfgoedflix ontvangt de link op `/bekijk?url=<URL-gecodeerde LDMax-link>`. Dit werkt ook wanneer `FLIX_REPOSITORY_URL` niet is ingesteld.
- Erfgoedflix haalt het verhaal server-side op en bewaart de link in een korte HttpOnly-browsersessie. De voorbeeldconfiguratie wordt per request aangemaakt en komt nooit in de globale Flix-singleton terecht. Navigatie naar thema’s en objectdetails blijft binnen dezelfde versie. Een banner geeft aan dat een voorbeeld actief is en biedt **Voorbeeld sluiten**.
- Voorbeelden krijgen `private, no-store`, `noindex, nofollow` en `no-referrer`. De token staat niet op de uiteindelijke verhaal-URL, in paginadata of in links naar beelden. Een gedeelde link blijft wel een tijdelijk toegangsbewijs.
- Alleen de afzonderlijke verhalen-API op vertrouwde LDMax-origins mag worden opgehaald; redirects naar andere servers worden geweigerd. De standaard productie-origin is `https://platform.ldmax.nl`; de origin van `FLIX_REPOSITORY_URL` wordt ook vertrouwd. Extra origins kun je expliciet instellen met `FLIX_PREVIEW_ORIGINS` (kommagescheiden). In development zijn ook de lokale HTTPS-platformorigins op poort 5173 toegestaan.
- LDMax gebruikt `ERFGOEDFLIX_URL` als optionele bestemming voor de voorbeeldknop. Zonder instelling is dit in development `http://localhost:5175` en in productie `https://erfgoedflix.nl`.

Voor het lokale mkcert-certificaat moet Node de bestaande ontwikkel-CA vertrouwen. Start Erfgoedflix indien nodig met:

```sh
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" npm run dev -- --host 127.0.0.1 --port 5175
```

Er is geen nieuwe databasekolom, migratie of gedeeld previewsecret tussen LDMax en Erfgoedflix nodig. De bestaande Flix-developmentserver draait met deze lokale CA. Tokencontrole en de scheiding van openbare en conceptversies zijn met lokale tests gecontroleerd; er stond nog geen opgeslagen verhaal in LDMax voor een volledige live voorbeeldtest.

## Herstel AI-voorstellen (28 oktober 2026)

De lokale productieconfiguratie gebruikte `gpt-4.1-nano`, dat sinds 23 oktober niet meer beschikbaar is voor generatie. `OPENAI_CHAT_MODEL` is lokaal naar de officiële vervanger `gpt-5.6-luna` gezet. Bij `model_not_found` toont de editor voortaan een configuratiefout met een verwijzing naar deze instelling. Een echte aanvraag voor organisatie `Q1852477` is gecontroleerd: HTTP 200, een concept met zes thema’s; niets opgeslagen of gepubliceerd. Het gedeelde contract accepteert ook organisatiecodes met hoofdletters, terwijl verhaal-slugs kleine letters blijven gebruiken.

De gebruiker heeft daarna `gpt-5-nano` ingesteld. De AI-resultaatschema’s leggen nu dezelfde slug-regex op als de verhaalconfiguratie, inclusief thema-ID’s. Ongeldige of dubbele ID’s leveren een leesbare 502-melding op in plaats van een onbehandelde ZodError (500). Regressietests controleren beide gevallen.

## Beheer en leesbare verhaal-URL’s (28 oktober 2026)

Het beheeroverzicht `/organisaties/{organisatie}/verhalen` toont kaarten met covers, status, zoeken en filters. Nieuwe verhalen staan op `/nieuw`; bestaande verhalen worden bewerkt op `/{uuid}/bewerken`. De editor gebruikt ruime tekstvelden en inklapbare thema’s. Primaire acties gebruiken de centrale LDMax-kleur (`primary`, petrolgroen); secundaire acties zijn neutraal. Ook links en actieve filters volgen dit thema.

De canonieke openbare verhaal-URL is `/organisaties/{organisatie}/verhalen/{verhaal-slug}`. Deze ondersteunt HTML, `Accept: application/json` (het bestaande `{story}`-contract) en RDF via content negotiation of `.ttl`, `.jsonld`, `.nt`, `.nq`, `.trig`, `.n3`, `.rdfxml`. RDF bevat Schema.org-metadata, thema’s, het bronendpoint en een verliesvrije configuratie als `rdf:JSON`. De openbare leesroute controleert dezelfde publicatie- en bronvoorwaarden als de repository. UUID-API-links blijven ondersteund.

De knop **Bekijk dit verhaal op ErfgoedFlix** gebruikt `{ERFGOEDFLIX_URL}/?ldmax-verhaal={gecodeerde canonieke URL}`. Flix accepteert uitsluitend vertrouwde LDMax-origins en valideert organisatie en verhaal-slug tegen het antwoord. RDF-extensies worden bij het ophalen naar de canonieke JSON-representatie omgezet. Concepten vereisen een tijdelijke previewtoken; het maken van een voorbeeld slaat het concept op en geeft vervolgens een tijdelijke kijklink. Een publieke link toont uitsluitend de gepubliceerde versie.

Verificatie: overzicht en editor op desktop en mobiel bekeken; zoeken en statusfilter interactief getest; nachtmodus bekeken. Het bestaande gepubliceerde verhaal `verzet-zeeland-tweede-wereldoorlog` geeft HTTP 200 als Turtle via Accept en `.ttl`, en als JSON-LD via `.jsonld`. De ErfgoedFlix-link laadt dit verhaal met HTTP 200. Een tijdelijke previewlink op de bestaande revisie geeft een geldig conceptantwoord; er is voor deze controles niets aan het verhaal opgeslagen of gepubliceerd.

De verhaalkaarten gebruiken de ingestelde cover, of automatisch een veilige thumbnail uit de eerste vijf voorbeeldobjecten van het eerste thema. Dit gaat via een afgeschermde `/{uuid}/cover`-route met organisatiecontrole en private caching van één minuut. Afbeeldingen laden lui; een ontbrekende of onbereikbare afbeelding valt terug op de grafische kaart. De conceptrevisie staat in de afbeelding-URL om verouderde covers na opslaan te vermijden.

## Themaquery’s bewerken

Bij bestaande verhalen ontbreekt het blok ‘Beschrijf je idee’. Thema’s toevoegen uit de bron blijft beschikbaar. Per thema opent **SPARQL bekijken en aanpassen** een modal met de objectselectie (`SELECT DISTINCT ?heritageObject`), een testknop, voorbeeldobjecten, herstel naar de automatische selectie en een link naar de organisatiegebonden SPARQL IDE. De volledige CONSTRUCT-query is in dezelfde modal te bekijken.

Een aangepaste selectie staat in het optionele themaveld `selectionQuery` en gaat mee in concept, preview, publicatiesnapshot en de RDF/JSON-configuratie. Alleen SELECT met uitsluitend de projectie `?heritageObject` wordt geaccepteerd; updates, SERVICE en FROM (ook genest) worden afgewezen. Prefixen worden bij het inbedden naar volledige IRI’s omgezet. De selectie draait tegen de geregistreerde openbare organisatiebron. ErfgoedFlix combineert deze met CreativeWork-objecten en voegt metadata en paginering toe. Opslaan en publiceren controleren opnieuw of de query resultaten oplevert.

De Flix-paginering past nu de AST van de beheerde selectie aan; limieten, offsets en letterlijke teksten binnen handmatige subquery’s blijven behouden. De modal is live getest met een eigen LIMIT 1: testresultaten, query overnemen in het lokale formulier en de IDE-link werkten. Voor deze controle is niets opgeslagen of gepubliceerd.
