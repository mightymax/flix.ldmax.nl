import type RDF from '@rdfjs/types';
import type Flix from '#lib/Flix.js';
import ns from './namespaces';
import ArchivalObject from './ArchivalObject';
import { Engine } from './Engine';
import { plainTextHtml } from '../server/flix/plainText.js';
import { iri } from '../stories/contract.js';
import { marked } from 'marked';
export default class Page {

  constructor(private flix: Flix, private page: RDF.NamedNode | RDF.BlankNode) {
  }

  public get name() {
    return this.flix.getProperty(this.page, ns.sdo.name as unknown as RDF.NamedNode)
  }

  public get identifier() {
    return this.flix.getProperty(this.page, ns.sdo.identifier)
  }

  public get headline(): string | undefined {
    return this.flix.getProperty(this.page, ns.sdo.headline);
  }

  public get coverImage(): string | undefined {
    return this.flix.getProperty(this.page, ns.sdo.image);
  }

  public get description() {
    const description = this.flix.getProperty(this.page, ns.sdo.description)
    if (this.flix.getProperty(this.page, ns.flix.managedStory) === 'true') return plainTextHtml(description ?? '');
    return description
      ? marked.parse(description.trim().replace(/^\s+/gm, ''), { async: false})
      : description
  }

  public async query(opts?: Partial<{ page: number, itemsPerPage: number}>) {
    return (new Engine(this.flix)).query(this.page, opts)
      .then(result => ArchivalObject.fromQuads(this.flix, result))
  }

  public async getArchivalObject(subject: string): Promise<ArchivalObject | undefined> {
    const engine = new Engine(this.flix);
    const result = await engine.query(this.page, { replace: (rq) => rq.replaceAll('#{ITEM_FILTER}', `filter(?heritageObject = ${iri(subject)})`)});
    if (result.length === 0) {
      return undefined;
    }
    return ArchivalObject.fromQuads(this.flix, result).shift();
  }

  public toJSON() {
    return {
      name: this.name,
      identifier: this.identifier,
      description: this.description,
      coverImage: this.coverImage,
      headline: this.headline
    };
  }
}
