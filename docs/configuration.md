# ErfgoedFlix RDF configuration and SPARQL queries

For installation, see [self-hosting](self-hosting.md). The local entry point is
always `config/config.ttl`. There must be exactly one resource with type
`sdo:WebApplication`. Schema.org terms use **`https://schema.org/`** throughout.

## Structure and routes

The application contains collections; collections contain categories. Connect a
child using `sdo:hasPart` on its parent **or** `sdo:isPartOf` on the child. Do not
use both for the same relationship: the runtime may display the child twice.

Every collection and category needs a literal `sdo:identifier`, unique within
its parent. Use simple slugs without `/`, `?` or `#`. Values are case-sensitive
and determine the public routes:

| Resource | Route |
| --- | --- |
| Application | `/` |
| Collection `my-collection` | `/my-collection` |
| Category `objects` | `/my-collection/objects` |
| Object | `/my-collection/objects/<URL-encoded object IRI>` |

RDF IRIs identify configuration resources; they do not need to resolve to files
or working web pages. When changing the root IRI, update every collection
reference to that root.

## Your first configuration

The example below can replace `config/config.ttl`. Back up existing configuration
first. Replace the domain, text and endpoint URL. The query assumes source objects
have `sdo:name` and `sdo:image`; adapt the WHERE clause to your source's RDF model.
This is a starting point, not a universal query for every heritage endpoint.

```turtle
@prefix sdo: <https://schema.org/> .
@prefix comunica: <https://comunica.dev/vocabulary#> .
@prefix ex: <https://images.example.org/config#> .

ex:app a sdo:WebApplication ;
  sdo:name "My ErfgoedFlix" ;
  sdo:description "Explore our collection." ;
  sdo:url "https://images.example.org/" ;
  sdo:creator [
    sdo:name "My organisation" ;
    sdo:url "https://example.org/"
  ] ;
  sdo:hasPart ex:collection .

ex:collection a sdo:WebPage ;
  sdo:identifier "my-collection" ;
  sdo:name "My collection" ;
  sdo:description "Images from our archive." ;
  sdo:headline "Stories that stay with you" ;
  comunica:settings ex:query ;
  sdo:hasPart ex:category .

ex:category a sdo:WebPage ;
  sdo:identifier "objects" ;
  sdo:name "Objects" ;
  sdo:description "A selection from the collection." ;
  comunica:settings ex:query .

ex:query
  comunica:type "sparql" ;
  comunica:source "https://sparql.example.org/query" ;
  comunica:query """
    PREFIX sdo: <https://schema.org/>
    CONSTRUCT {
      ?heritageObject a sdo:ArchivalObject ;
        sdo:name ?name ;
        sdo:imageUrl ?image .
    }
    WHERE {
      ?heritageObject sdo:name ?name ; sdo:image ?image .
      #{ITEM_FILTER}
    }
    ORDER BY ?heritageObject
    LIMIT 20
  """ .
```

Collection settings provide the carousel query and the endpoint used for
additional object metadata. Category settings provide image previews, category
pages and object selection. This example shares one query; create separate
settings resources for distinct category queries or a different carousel.

## Query contract

Source data can use any vocabulary, but CONSTRUCT results must match the viewer:

- `?heritageObject` is the object IRI and receives `a sdo:ArchivalObject`.
- `sdo:name` supplies titles; `sdo:imageUrl` supplies image URLs.
- `sdo:description` and `sdo:dateCreated` are optional object metadata.
- Put `#{ITEM_FILTER}` on its own comment line inside the WHERE clause where
  `?heritageObject` is bound. For detail pages, ErfgoedFlix replaces it with a filter
  for the selected IRI. Omitting it can make the detail page show another object.

The source itself need not use `sdo:ArchivalObject`: the query constructs this
viewer representation. A SELECT query alone is insufficient for local
configuration. Additional detail metadata is fetched with
`SELECT * WHERE { <object-IRI> ?p ?o }` at the **collection endpoint**. Use the same
source for a collection and its categories if you want these details to work.

The runtime sets the page limit (20 by default, 10 for category previews). It
adjusts the first query with a LIMIT, or the outer CONSTRUCT if none has a LIMIT.
With subqueries, LIMIT placement therefore matters; follow the
[bundled queries](../config/example/daguerreobase/portrait.rq). The interface does
not currently offer controls for browsing every page of a category.

## Split configuration into files

Larger configurations can use separate Turtle and SPARQL files:

```turtle
@prefix flix: <https://erfgoedflix.nl/vocabulary#> .

# In config/config.ttl, alongside the application root:
[] flix:loadConfig "config/my-collection.ttl" .

# Inside a comunica:settings resource, instead of an inline query:
# comunica:query "config/my-collection/objects.rq"^^flix:file ;
```

Include and query paths are relative to the **project root**, not the file that
references them. Each Turtle file declares its own prefixes. Repeated includes
and cycles are read once. Included files must not introduce a second
`WebApplication`. For larger examples, see
[WO2](../config/example/wo2-oorlogsbronnen.ttl) and
[Daguerreobase](../config/example/daguerreobase.ttl).

## Presentation and publication

On the application root, `sdo:name`, `sdo:description`, `sdo:url` and `sdo:creator`
define general metadata. The creator can be a resource with `sdo:name`,
`sdo:description`, `sdo:url` and `sdo:logo`. The application also exposes `sdo:logo`
in page data.

On a collection, `sdo:image <https://…/cover.jpg>` provides its home-page cover.
Without a usable image, the title remains visible against a graphic background.
`sdo:headline` overrides the default card subtitle (currently the Dutch UI text
“Een venster op het verleden”, meaning “A window onto the past”). Descriptions
support Markdown. Treat local configuration as trusted input and do not put
secrets in it: `/config.ttl` publishes the merged RDF.

```sh
npm run check:config -- config/config.ttl
```

Restart the server and check collection, category and object detail pages in a
browser. Valid configuration does not guarantee external source availability or
usable image results. The documentation is English; the current application UI
and bundled heritage content still contain Dutch text.
