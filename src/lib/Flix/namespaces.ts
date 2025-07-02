import rdf from 'rdf-ext'
const ns = {
  rdf: rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  sdo: rdf.namespace('https://schema.org/'),
  xsd: rdf.namespace('http://www.w3.org/2001/XMLSchema#'),
  flix: rdf.namespace('https://erfgoedflix.nl/vocabulary#'),
  comunica: rdf.namespace('https://comunica.dev/vocabulary#'),
}

export default ns;