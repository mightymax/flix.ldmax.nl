# Vormgeving Erfgoedflix

De interface gebruikt een warme archiefstijl met een lichte canvasachtergrond en een donkergroene nachtmodus. Koraal markeert acties en actieve navigatie. Serifkoppen geven de beeldpresentatie een redactioneel karakter; de navigatie gebruikt het lokale sans-seriflettertype. Er worden geen externe webfonts geladen.

## Structuur

- De rootlayout verzorgt de gedeelde header, collectienavigatie, themaschakelaar, informatiemodal en footer.
- De collectielayout toont een tweede navigatieniveau met collectieoverzicht en thema's. Op mobiel blijft dit horizontaal scrollbaar.
- De startpagina introduceert de collecties met collectiekaarten waarop de volledige collectietitel staat. Een optionele `sdo:headline` vervangt de kaartsubtitel “Een venster op het verleden”. Een optionele `sdo:image` op de collectienode levert de cover; zonder cover of bij een laadfout blijft de grafische achtergrond zichtbaar. Deze vereist geen extra SPARQL-requests voor covers.
- De collectiepagina toont een handmatig bediende fotohero, themasnelkoppelingen en beeldrijen. Geen automatische beweging; reduced-motion wordt gerespecteerd.
- Categorieën hebben een responsief beeldraster met titels. De teller vermeldt het aantal geladen beelden, niet het totaal in de bron.
- Objectdetails tonen de volledige afbeelding naast metadata, op mobiel onder elkaar. CONSTRUCT-metadata blijft zichtbaar als de aanvullende bindingsquery geen gegevens oplevert.

## Onderdelen en afspraken

`src/app.css` bevat de kleurvariabelen en gedeelde responsieve vormgeving. De `dark`-klasse op het html-element activeert de nachtmodus. Flowbite DarkMode volgt bij het eerste bezoek de systeemvoorkeur en bewaart een handmatige keuze lokaal; de rootlayout houdt deze bediening beschikbaar tijdens navigatie. Flowbite Modal verzorgt de collectie-informatie.

`Artwork.svelte` toont een terugval bij ontbrekende of onbereikbare beelden. `ImageScroller.svelte` gebruikt gewone links, horizontale swipe-/scrollbediening en knoppen. De collectiepagina resolveert en encodeert object-IRI's voordat links aan de scroller worden doorgegeven.

Previews reageren op de huidige collectie. Requests worden bij navigatie geannuleerd; lege resultaten en laadfouten zijn zichtbaar. Bij een fout kan de bezoeker opnieuw proberen. Gedeelde objectmetadata staat in `src/lib/types.ts`.

Configuratiebeschrijvingen zijn bestaande Markdown/HTML uit door de beheerder gecontroleerde RDF-bestanden. Zij worden nog als HTML weergegeven; maak deze bron niet publiek bewerkbaar zonder sanitization. Foutpagina's tonen geen ruwe HTML-foutmeldingen meer.

## Controle op 27 oktober 2026

- Typecontrole, lint, productiebuild, zeven regressietests en offline configuratiecontrole slagen.
- In de browser: beide collecties geopend; WO2-collectie → Bevrijding → objectdetail gecontroleerd, inclusief echte afbeeldingen en metadata.
- Dag-/nachtwisseling, nachtmodus na herladen, informatiemodal en navigatie gecontroleerd.
- Op 390px: mobiel menu geopend en via collectielink gesloten; collectie- en detailweergave bekeken. Geen horizontale pagina-overloop gemeten op de collectiepagina.
- De bestaande SPARQL-paginering en bindingsconversie zijn niet herschreven. De nieuwe UI voegt geen volledige zoekfunctie of extra resultaatpagina's toe.
