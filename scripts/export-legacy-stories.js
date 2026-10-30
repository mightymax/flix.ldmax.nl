// Reproducible, offline export; deliberately never writes to the database.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Parser, Store, DataFactory} from 'n3';
import {storyDraftSchema} from '../src/lib/stories/contract.js';
import {validateConstructQuery} from '../src/lib/stories/selectionQuery.js';
const nn = DataFactory.namedNode;
const S = 'https://schema.org/'; const C = 'https://comunica.dev/vocabulary#';
const profiles = [{file: 'wo2-oorlogsbronnen', organisation: 'wo2net', slug: 'wo2-oorlogsbronnen'}, {file: 'daguerreobase', organisation: 'nederlands-fotomuseum-daguerreobase', slug: 'daguerreobase'}];
const output = [];
for (const profile of profiles) {
  const store = new Store(new Parser().parse(await readFile(resolve('config/example/' + profile.file + '.ttl'), 'utf8')));
  const node = store.getSubjects(nn(S + 'identifier'), null, null).find(n => store.getObjects(n, nn(S + 'isPartOf'), null).length);
  if (!node) throw new Error('Missing collection');
  const text = (subject, key, namespace = S) => store.getObjects(subject, nn(namespace + key), null)[0]?.value ?? '';
  const query = async (subject, requireObject = true) => {const settings = store.getObjects(subject, nn(C + 'settings'), null)[0];const file = text(settings, 'query', C);const content = await readFile(resolve(file), 'utf8');validateConstructQuery(content, requireObject);return content;};
  const themes = [];
  for (const part of store.getObjects(node, nn(S + 'hasPart'), null)) {
    const id = text(part, 'identifier');
    themes.push({id, title: text(part, 'name'), description: text(part, 'description').trim(), selection: {property: 'keywords', kind: 'literal', value: id}, constructQuery: await query(part)});
  }
  const creator = store.getObjects(node, nn(S + 'creator'), null)[0];
  const config = storyDraftSchema.parse({version: 2, slug: profile.slug, title: text(node, 'name'), headline: text(node, 'headline'), description: text(node, 'description').trim(), coverImage: text(node, 'image'), themes,
    legacyIdentifier: text(node, 'identifier'), carouselQuery: await query(node, false),
    ...(creator ? {creator: {url: creator.value, name: text(creator, 'name') || (profile.file === 'daguerreobase' ? 'Daguerreobase' : creator.value), description: text(creator, 'description').trim(), logo: text(creator, 'logo')}} : {}),
    dateCreated: text(node, 'dateCreated'), dateModified: text(node, 'dateModified')});
  output.push({organisation: profile.organisation, config});
}
process.stdout.write(JSON.stringify(output, null, 2) + '\n');
