import type RDF from '@rdfjs/types';
import { Store, Parser } from 'n3';
import ns from '$lib/Flix/namespaces.js';
import fs from 'fs/promises';
import { marked } from "marked";

import path from 'path';
import Page from './Flix/Page';
import { Engine } from './Flix/Engine';
// import { QueryEngine } from '@comunica/query-sparql';

export default class Flix {
  public store: Store = new Store();

  /**
   * Singleton instance of Flix
   */
  private static instance: Flix | null = null;

  static #pages: Page[] | undefined

  public flix: RDF.NamedNode | RDF.BlankNode | undefined = undefined;

  protected constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static async getInstance(): Promise<Flix> {
    if (Flix.instance) {
      // return Flix.instance;
    }
    Flix.instance = new Flix();
    return await Flix.instance.load();
  }

  private async load(): Promise<Flix> {
    const settingsPath = path.resolve('config/settings.ttl');
    console.log(`Loading Flix configuration from ${settingsPath}`);
    const parser = new Parser();
    return await fs.readFile(settingsPath, 'utf-8')
      .then(text => {
        const quads = parser.parse(text);
        this.store.addQuads(quads)
        this.flix = this.store.getQuads(null, ns.rdf.type, ns.sdo.WebApplication, null).shift()?.subject as RDF.NamedNode | RDF.BlankNode;
        return this;
      })
      .catch((error) => {
        console.error(`Error loading Flix configuration from ${path}:`, error);
        throw error;
      });
  }

  public async carouselItems() {
    const engine = new Engine(this);
    if (!this.flix) {
      throw new Error('Flix instance is not loaded.');
    }
    const store = new Store(await engine.query(this.flix));
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
    if (Flix.#pages) return Flix.#pages
    const quads = this.flix ?
      this.store.getQuads(this.flix, ns.sdo.hasPart, null, null) :
      [];
    Flix.#pages = quads.map(quad => {
      if (quad.object.termType !== 'NamedNode' && quad.object.termType !== 'BlankNode') {
        throw new Error(`Expected NamedNode or BlankNode, got ${quad.object.termType} for quad: ${quad}`);
      }
      return new Page(this, quad.object)
    });
    return Flix.#pages
  }

  public getPage(identifier: string): Page | undefined {
    return this.pages.find(page => page.identifier === identifier);
  }

  public getProperty(subject: RDF.NamedNode | RDF.BlankNode | undefined, property: RDF.NamedNode) {
    if (subject === undefined) return undefined
    return this.store.getObjects(subject, property, null).map(o => o.value).shift();
  }

  public get name(): string {
    return this.getProperty(this.flix, ns.sdo.name as unknown as RDF.NamedNode) || 'Flix'
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
    let description = this.getProperty(this.flix, ns.sdo.description) || '';
    if (description) {
      description = marked.parse(description.trim().replace(/^\s+/gm, ''), { async: false});
    }
    return {
      name: this.name,
      description,
      url: this.getProperty(this.flix, ns.sdo.url) || '',
      creator
    }
  }

  public get logo(): string | undefined {
    return this.getProperty(this.flix, ns.sdo.logo) 
  }
}