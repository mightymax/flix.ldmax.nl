import type RDF from '@rdfjs/types';
import Flix from '$lib/Flix';
import { queryParser, queryGenerator } from './helpers/queryParser';
import { QueryEngine } from '@comunica/query-sparql'
import ns from './namespaces';

type QueryReplaceFn = (rq: string) => string;
type QueryOpts = Partial<{
  page: number;
  itemsPerPage: number;
  replace: QueryReplaceFn;
}>;

export class Engine {
  public constructor(private flix: Flix) {
    // Initialize the engine with the Flix instance
  }

  private async getQuery(settings: RDF.NamedNode | RDF.BlankNode, opts?: QueryOpts) {
    const queryObject = this.flix.store.getObjects(settings, ns.comunica.query, null)
      .filter(o => o.termType === 'Literal')
      .shift();
    if (!queryObject) return Promise.reject(new Error(`Er is geen communica:settings/comunica:query eigenschap gevonden voor node ${settings.value}.`));
    return queryParser({ queryObject,...opts })
  }

  private getComunicaSettings(subject: RDF.NamedNode | RDF.BlankNode) {
    return this.flix.store.getObjects(subject, ns.comunica.settings, null)
      .filter(o => o.termType === 'NamedNode' || o.termType === 'BlankNode')
      .shift()
  }

  public async query(subject: RDF.NamedNode | RDF.BlankNode, opts?: QueryOpts) {
    const engine = new QueryEngine();
    const comunicaSettings = this.getComunicaSettings(subject);
    if (!comunicaSettings) return Promise.reject(new Error(`Er is geen communica:settings eigenschap gevonden voor node ${subject.value}.`));
    const source = this.flix.getProperty(comunicaSettings, ns.comunica.source)
    if (!source) return Promise.reject(new Error(`Er is geen communica:settings/comunica:source eigenschap gevonden voor node ${subject.value}.`));

    return this.getQuery(comunicaSettings, opts)
      .then(query => {
        const rq = queryGenerator(query);
        return engine.queryQuads(rq, {
          sources: [{
            type: this.flix.getProperty(comunicaSettings, ns.comunica.type) ?? 'sparql',
            value: source
          }],
        })
      })
      .then(result => result.toArray())
  }

}
