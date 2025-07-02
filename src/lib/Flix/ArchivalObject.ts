import type RDF from '@rdfjs/types';
import ns from './namespaces';
export default class ArchivalObject {

  public constructor(node: RDF.Quad_Subject, private quads: RDF.Quad[]) {
    this.quads = quads.filter(q => q.subject.equals(node));
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

  public toJson() {
    return {
      id: this.quads[0].subject.value,
      name: this.name,
      description: this.description,
      imageUrl: this.getProperties(ns.sdo.imageUrl),
      dateCreated: this.dateCreated
    };
  }

  public static fromQuads(quads: RDF.Quad[]): ArchivalObject[] {
    const nodes = quads.filter(q => q.predicate.equals(ns.rdf.type) && q.object.equals(ns.sdo.ArchivalObject)).map(q => q.subject as RDF.NamedNode);
    const archivalObjects: ArchivalObject[] = [];
    for (const n of nodes) {
      const $quads = quads.filter(q => q.subject.equals(n));
      archivalObjects.push(new ArchivalObject(n, $quads));
    }
    return archivalObjects;
  }
}