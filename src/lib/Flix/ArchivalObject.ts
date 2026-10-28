import type RDF from '@rdfjs/types';
import { Store } from 'n3';
import type { ArchivalObject as ArchivalObjectDTO } from '../types.js';
import ns from './namespaces';
import type Flix from '#lib/Flix.js';
import { mediaFromQuads } from '../server/flix/media.js';
import { Engine } from './Engine';
export default class ArchivalObject {
  private mediaQuads: RDF.Quad[];

  public constructor(private flix: Flix, private subject: RDF.Quad_Subject, private quads: RDF.Quad[]) {
    if (subject.termType !== 'NamedNode' && subject.termType !== 'BlankNode') {
      throw new Error(`Invalid subject type: ${subject.termType}. Expected NamedNode or BlankNode.`);
    }
    this.mediaQuads = quads;
    this.quads = quads.filter(q => q.subject.equals(subject));
  }

  private getProperties(predicate: RDF.NamedNode) {
    return this.quads
      .filter(q => q.predicate.equals(predicate))
      .map(q => q.object.value);
  }

  public get name() {
    return this.getProperties(ns.sdo.name as unknown as RDF.NamedNode);
  }

  public get description() {
    return this.getProperties(ns.sdo.description);
  }

  public get imageUrl() {
    return this.getProperties(ns.sdo.imageUrl);
  }

  public get dateCreated() {
    return this.getProperties(ns.sdo.dateCreated);
  }

  public toJson(): ArchivalObjectDTO {
    return {
      id: this.quads[0].subject.value,
      name: this.name,
      description: this.description,
      imageUrl: this.getProperties(ns.sdo.imageUrl),
      dateCreated: this.dateCreated,
      media: mediaFromQuads(this.mediaQuads, this.subject)
    };
  }

  public static fromQuads(flix: Flix, quads: RDF.Quad[]): ArchivalObject[] {
    quads = new Store(quads).getQuads(null, null, null, null);
    const nodes = quads.filter(q => q.predicate.equals(ns.rdf.type) && q.object.equals(ns.sdo.ArchivalObject)).map(q => q.subject as RDF.NamedNode);
    const archivalObjects: ArchivalObject[] = [];
    for (const n of nodes) {
      archivalObjects.push(new ArchivalObject(flix, n, quads));
    }
    return archivalObjects;
  }

  public loadBindings(): Promise<RDF.Bindings[]> {
    return new Engine(this.flix).allBindings(this.flix.flix!, this.subject as RDF.NamedNode | RDF.BlankNode);
  }
}
