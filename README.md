# LDMax SPARQL Flix
Inspired by the [NDE Heritage FLix](https://github.com/netwerk-digitaal-erfgoed/heritageflix), this project aims to create a simple but visualy attractive website using SPARQL queries. Although this projectes uses [LDMax](https://ldmax.nl) SPARQL endpoints, you can build your own Flix using any publicaly available SPARQL endpoint. The configuration if the entire project is done in RDF, see the [./config/config.exampl.nl](example configuration).

> [!NOTE]
>
> This is a work-in-progress project. The aim is to provide a simple to use tool to create images-based websites based on SPARQL queries only.

A demo of this project is available via https://erfgoedflix.nl.

## Install
To run a local development Flix, follow these steps:
```bash
git clone https://github.com:mightymax/flix.ldmax.nl.git
cd flix.ldmax.nl
cp config/config.example.ttl config/config.ttl
npm install
npm run dev -- --open
```

This wil open your browser at http://localhost:5173 with the provided example configuration based on [WO2 Oorlogsbronnen](http://oorlogsbronnen.nl).

## Using Docker
Using the example configuration:
```bash
docker run -it --rm -p 3000:3000 ghcr.io/mightymax/flix.ldmax.nl
``` 
