import type RDF from '@rdfjs/types';
import { Store, Parser, Writer } from 'n3';
import ns from '$lib/Flix/namespaces.js';
import fs from 'fs/promises';
import { marked } from "marked";
import { readFileSync } from 'fs';

import path from 'path';
import Page from './Flix/Page';
import { Engine } from './Flix/Engine';

export default class Flix {
  public store: Store = new Store();

  /**
   * Singleton instance of Flix
   */
  private static instance: Flix | undefined = undefined;

  public flix: RDF.NamedNode | RDF.BlankNode | undefined = undefined;
  
  protected constructor(flix?: RDF.NamedNode | RDF.BlankNode) {
    if (flix) this.flix = flix;
    // Private constructor to enforce singleton pattern
  }

  public static async getInstance(): Promise<Flix> {
    if (!Flix.instance) {
      Flix.instance = new Flix();
      return Flix.instance.load()
    } else {
      return Promise.resolve(Flix.instance);
    }
  }

  private async load(): Promise<Flix> {
    if (this.flix) return this
    const settingsPath = path.resolve('config/config.ttl');
    console.log(`Loading Flix configuration from ${settingsPath}`);
    const parser = new Parser();
    const quads = parser.parse(readFileSync(settingsPath, 'utf-8'));
    this.store.addQuads(quads)
    let extraConfigQuads = quads.filter(quad => quad.predicate.equals(ns.flix.loadConfig));
    while(true) {
      if (extraConfigQuads.length === 0) break;
      for (const config of extraConfigQuads) {
        if (config.object.termType !== 'Literal') {
          throw new Error(`Expected Literal for config, got ${config.object.termType}`);
        }
        console.log(`Loading extra Flix configuration from ${config.object.value}`);
        const quads = parser.parse(readFileSync(path.resolve(config.object.value), 'utf-8'));
        this.store.addQuads(quads);
        extraConfigQuads = quads.filter(quad => quad.predicate.equals(ns.flix.loadConfig));
      }
    }
    return await fs.readFile(settingsPath, 'utf-8')
      .then(text => {
        const quads = parser.parse(text);
        this.store.addQuads(quads)
        const flix = this.store.getQuads(null, ns.rdf.type, ns.sdo.WebApplication, null).shift()?.subject;
        if (!flix) {
          throw new Error('Flix instance not found in configuration.');
        }
        if (flix.termType !== 'NamedNode' && flix.termType !== 'BlankNode') {
          throw new Error(`Expected NamedNode or BlankNode, got ${flix.termType} for Flix instance.`);
        }
        this.flix = flix
        return this;
      })
      .catch((error) => {
        console.error(`Error loading Flix configuration from ${path}:`, error);
        throw error;
      });
  }

  public async getConfig(format: string = 'text/turtle'): Promise<string | undefined> {
    const prefixes: Record<string, string> = {}
    for (const [key, value] of Object.entries(ns)) {
      prefixes[key] = value().value;
    }
    const writer = new Writer({ format, prefixes });
    writer.addQuads(this.store.getQuads(null, null, null, null));
    return new Promise<string | undefined>((resolve, reject) => {
      writer.end((error, result) => {
      if (error) reject(error);
      else resolve(result);
      });
    });
  }

  public async carouselItems() {
    const engine = new Engine(this);
    await this.load()
    const store = new Store(await engine.query(this.flix!));
    const images: {title: string, src: string, id: string }[] = []
    store.getSubjects(ns.rdf.type, ns.sdo.ArchivalObject, null)
      .forEach(subject => {
        const title = store.getObjects(subject, ns.sdo.name, null).shift()?.value || 'Onbekend';
        const src = store.getObjects(subject, ns.sdo.imageUrl, null).shift()?.value || '';
        const id = store.getObjects(subject, ns.sdo.identifier, null).shift()?.value || '';
        images.push({ title, src, id });
      });
    return images;
  }

  public get pages() {
    const pages = this.flix ?
      [
        ...this.store.getObjects(this.flix, ns.sdo.hasPart, null),
        ...this.store.getSubjects(ns.sdo.isPartOf, this.flix, null),
      ] :
      [];
    return pages.map(page => {
      if (page.termType !== 'NamedNode' && page.termType !== 'BlankNode') {
        throw new Error(`Expected NamedNode or BlankNode, got ${page.termType} for page: ${page.value}`);
      }
      return new Page(this, page)
    });
  }

  public getFlix(identifier: string): Flix | undefined {
    // construct a new flix based on this identifier
    if (!this.flix) throw new Error('Flix instance not loaded. Call load() first.');
    const subFlix = this.store.getObjects(this.flix, ns.sdo.hasPart, null)
      .find(subject => {
        const id = this.store.getObjects(subject, ns.sdo.identifier, null).shift()?.value;
        return id === identifier;
      })
    if (subFlix) {
      if (subFlix.termType !== 'NamedNode' && subFlix.termType !== 'BlankNode') {
        throw new Error(`Expected NamedNode or BlankNode, got ${subFlix.termType} for subFlix: ${subFlix}`);
      }
      const flix = new Flix(subFlix)
      flix.flix = subFlix; // Set the flix property to the subFlix
      flix.store = this.store; // Share the same store instance
      return flix;
    } else {
      console.warn(`No Flix found with identifier: ${identifier}`);
      return undefined;
    }
  }

  public getPage(identifier: string): Page | undefined {
    return this.pages.find(page => page.identifier === identifier);
  }

  public getProperty(subject: RDF.NamedNode | RDF.BlankNode | undefined, property: RDF.NamedNode) {
    if (subject === undefined) return undefined
    return this.store.getObjects(subject, property, null).map(o => o.value).shift();
  }

  // Getters for metadata of the Flix instance

  public get name(): string {
    return this.getProperty(this.flix, ns.sdo.name as unknown as RDF.NamedNode) || 'Flix'
  }

  public get description(): string {
    const description = this.getProperty(this.flix, ns.sdo.description)
    return description ? marked.parse(description.trim().replace(/^\s+/gm, ''), { async: false}) : ''
  }

  public get logo(): string | undefined {
    return this.getProperty(this.flix, ns.sdo.logo) 
  }

  public get about() {
    if (!this.flix) return
    const creatorNode = this.store.getQuads(this.flix, ns.sdo.creator, null, null).shift()?.object as RDF.NamedNode | RDF.BlankNode;
    let creator: { name: string, description: string, url: string, logo: string } | undefined = undefined;
    if (creatorNode) {
      let description = this.getProperty(creatorNode, ns.sdo.description) || '';
      if (description) {
        description = marked.parse(description.trim().replace(/^\s+/gm, ''), { async: false});
      }
      creator = {
        name: this.getProperty(creatorNode, ns.sdo.name as unknown as RDF.NamedNode) || '',
        description,
        url: this.getProperty(creatorNode, ns.sdo.url) || '',
        logo: this.getProperty(creatorNode, ns.sdo.logo) || ''
      }
    }
    return {
      name: this.name,
      description: this.description,
      url: this.getProperty(this.flix, ns.sdo.url) || '',
      creator
    }
  }

}