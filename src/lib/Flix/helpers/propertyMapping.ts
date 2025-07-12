const propertyMapping =new Map<string, {label: string, iris: string[]}>([
  [
    'name', {
    iris: ['http://purl.org/dc/elements/1.1/title', 'https://schema.org/name'],
    label: 'Naam'
    }
  ],
  [
    'description', {
    iris: ['http://purl.org/dc/elements/1.1/description', 'https://schema.org/description'],
    label: 'Beschrijving'
  }],
  [
    'imageUrl', {
    iris: ['https://schema.org/thumbnail'],
    label: 'Afbeelding'
  }],
  [
    'collection', {
    iris: ['http://purl.org/dc/dcmitype/Collection'],
    label: 'Collectie'
  }],
  [
    'publisher', {
    iris: ['http://purl.org/dc/elements/1.1/publisher', 'https://schema.org/publisher'],
    label: 'Uitgever'
  }],
  [
    'rights', {
    iris: ['http://purl.org/dc/elements/1.1/rights'],
    label: 'Rechten'
  }],
  [
    'subject', {
    iris: ['http://purl.org/dc/elements/1.1/subject'],
    label: 'Onderwerpen'
  }],
  [
    'source', {
    iris: ['http://purl.org/dc/elements/1.1/source'],
    label: 'Bron'
  }],
  [
    'identifier', {
    iris: ['http://purl.org/dc/elements/1.1/identifier', 'https://schema.org/identifier'],
    label: 'Identifier'
  }],
])

// https v.s. http for schema.org:
for (const [_key, value] of propertyMapping) {
  for (const iri of value.iris.filter(url => url.startsWith('https://schema.org/'))) {
    value.iris.push(iri.replace('https://', 'http://'));
  }
}

export default propertyMapping;