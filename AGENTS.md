# Werken aan Erfgoedflix

Dit project maakt configureerbare erfgoedbeeldbanken met RDF-configuratie en SPARQL. Lees eerst `docs/project-status.md` voor architectuur, bekende problemen en vervolgstappen.

## Werkwijze

- Werk in kleine, controleerbare stappen. Behoud RDF-configuratie en bestaande publieke routes bij refactors.
- Controleer eerst `git status`; behoud wijzigingen van de gebruiker.
- Gebruik de officiële Svelte MCP-server bij Svelte/SvelteKit-werk en Flowbite-documentatie bij componentwijzigingen. Gebruik Svelte 5-runes en Flowbite-Svelte waar passend. Controleer gewijzigde componenten met de Svelte-autofixer.
- Raadpleeg `/Users/marklindeman/Code/LDMax/platform.ldmax.nl` voor bestaande Svelte-, Tailwind- en Flowbite-patronen. Die repo is standaard referentie; wijzig hem alleen bij een expliciete opdracht voor de koppeling of platformwerk. Voor de verhalenintegratie is die opdracht gegeven; zie `docs/ldmax-verhalen.md`. Neem versiegebonden configuratie niet blind over: Flix gebruikt SvelteKit 3, platform momenteel SvelteKit 2.
- Houd filesystem-, RDF-configuratie- en SPARQL-uitvoering op de server. Geef eenvoudige, expliciet getypeerde objecten terug aan de UI.
- Voeg bij wijzigingen aan querylogica en configuratieladen gerichte regressietests met lokale fixtures toe. Externe endpoints zijn geen betrouwbare basis voor unit-tests.
- Voer bij codewijzigingen `npm run check`, `npm run lint` en `npm run build` uit. Rapporteer afzonderlijk wat runtime en in de browser is gecontroleerd.
- Gebruik Node 24 (`nvm use`). Voer ook `npm test` en `npm run check:config` uit bij wijzigingen aan configuratie of backend. De tests gebruiken de ingebouwde Node-test runner en lokale fixtures.
- Werk documentatie bij wanneer architectuur, commando's of bekende beperkingen veranderen.

## Developmentserver

- Controleer eerst of er al een server voor deze repo draait, inclusief de werkdirectory van het proces. Andere projecten kunnen poort 5173 gebruiken.
- Lokaal is `config/config.ttl` nodig. Maak die uitsluitend als hij ontbreekt met een kopie van `config/config.example.ttl`; overschrijf geen lokale configuratie.
- Start indien nodig met `npm run dev -- --host 127.0.0.1`, kies een vrije poort en deel de werkelijke URL.
- Laat een gestarte developmentserver altijd draaien zodat Mark in zijn browser kan meekijken. Stop of herstart geen servers van andere projecten.
- Voor Flix is geen `ENV=production` vereist; dat is een afspraak van platform, geen Flix-configuratie.

## Configuratie en releases

- `config/config.ttl` is genegeerd door Git. Lees geen secrets voor documentatie en commit geen lokale configuratie of credentials.
- `/config.ttl` publiceert momenteel de samengevoegde RDF-configuratie. Zet daar dus geen geheimen in.
- `npm version` pusht via `postversion` automatisch naar main en activeert deployment. Gebruik dit alleen bij een expliciete releaseopdracht.
- Releases bouwen een ARM64-container naar GHCR; de workflow werkt de `release`-branch bij en Argo CD verzorgt deployment. Zie README en `.github/workflows/release.yml`.
