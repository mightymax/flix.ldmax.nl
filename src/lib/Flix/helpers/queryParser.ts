import { Parser, type ConstructQuery, Generator } from 'sparqljs';
import path from 'path';
import { readFile } from 'node:fs/promises';
import Literal from '@rdfjs/data-model/lib/Literal';
import ns from '../namespaces';


export async function queryParser(opts: { queryObject: Literal, page?: number, itemsPerPage?: number, replace?: (rq: string) => string }): Promise<ConstructQuery> {
  const limit = opts?.itemsPerPage ?? 20
  const offset = opts?.page ? (opts.page - 1) * limit : 0;

  let content: string
  if (opts.queryObject.datatype.equals(ns.flix.file)) {
    const rqPath = path.resolve(opts.queryObject.value);
    content = await readFile(rqPath, 'utf-8')
      .catch(err => {
        throw new Error(`Fout bij het lezen van SPARQL query bestand ${rqPath}: ${err.message}`);
      });
  } else {
    content = opts.queryObject.value;
  }
  content = content.replace(/limit \d+/gi, `limit ${limit}`);
  content = content.replace(/offset \d+/gi, `offset ${offset}`);
  if (opts.replace) {
    content = opts.replace(content);
  }
  const query = new Parser().parse(content);
  if (query.type !== 'query' || !query.queryType || query.queryType !== 'CONSTRUCT') {
    return Promise.reject(new Error(`De opgegeven query is geen CONSTRUCT query.`));
  }
  return query
}

export function queryGenerator(query: ConstructQuery): string {
  const generator = new Generator();
  return generator.stringify(query);
}