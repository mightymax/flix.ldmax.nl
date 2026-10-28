import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadConfiguration, validateConfiguration } from '../src/lib/server/flix/configuration.js';
import { sharedInitialization } from '../src/lib/server/flix/initialization.js';

const prefixes = '@prefix s: <https://schema.org/>. @prefix f: <https://erfgoedflix.nl/vocabulary#>. @prefix c: <https://comunica.dev/vocabulary#>. ';
async function fixture(t, contents) {
  const directory = await mkdtemp(path.join(tmpdir(), 'flix-config-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [file, content] of Object.entries(contents)) {
    await writeFile(path.join(directory, file), prefixes + content);
  }
  return directory;
}

test('loads both branches, nested includes, repeated files and cycles once', async (t) => {
  const directory = await fixture(t, {
    'root.ttl': '<urn:app> a s:WebApplication. [] f:loadConfig "a.ttl", "b.ttl".',
    'a.ttl': '[] f:loadConfig "nested-a.ttl".',
    'b.ttl': '[] f:loadConfig "nested-b.ttl", "a.ttl".',
    'nested-a.ttl': '<urn:a> s:name "A". [] f:loadConfig "root.ttl".',
    'nested-b.ttl': '<urn:b> s:name "B".'
  });
  const result = await loadConfiguration('root.ttl', directory);
  assert.equal(result.files.length, 5);
  assert.deepEqual(result.store.getQuads('urn:a', null, null, null).map(q => q.subject.value), ['urn:a']);
  assert.equal(result.store.getQuads('urn:b', null, null, null).length, 1);
});

test('reports missing files, malformed Turtle, invalid includes and ambiguous roots', async (t) => {
  const directory = await fixture(t, {
    'missing.ttl': '<urn:app> a s:WebApplication. [] f:loadConfig "absent.ttl".',
    'broken.ttl': 'this is invalid',
    'include.ttl': '<urn:app> a s:WebApplication. [] f:loadConfig <urn:file>.',
    'roots.ttl': '<urn:a> a s:WebApplication. <urn:b> a s:WebApplication.',
    'empty.ttl': '<urn:a> s:name "A".'
  });
  await assert.rejects(loadConfiguration('missing.ttl', directory), /absent.ttl/);
  await assert.rejects(loadConfiguration('broken.ttl', directory), /broken.ttl/);
  await assert.rejects(loadConfiguration('include.ttl', directory), /literal/);
  await assert.rejects(loadConfiguration('roots.ttl', directory), /exactly one/);
  await assert.rejects(loadConfiguration('empty.ttl', directory), /exactly one/);
});

test('validates identifiers and queries without network access', async (t) => {
  const directory = await fixture(t, {
    'valid.ttl': '<urn:app> a s:WebApplication; s:hasPart <urn:a>. <urn:a> s:identifier "photos"; c:settings [c:source "https://example.invalid/sparql"; c:query "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"] .',
    'duplicate.ttl': '<urn:app> a s:WebApplication; s:hasPart <urn:a>, <urn:b>. <urn:a> s:identifier "same". <urn:b> s:identifier "same".',
    'query.ttl': '<urn:app> a s:WebApplication; c:settings [c:source "https://example.invalid"; c:query "SELECT * WHERE {?s ?p ?o}"] .',
    'identifier.ttl': '<urn:app> a s:WebApplication; s:hasPart <urn:a>.'
  });
  assert.deepEqual(await validateConfiguration(await loadConfiguration('valid.ttl', directory)), { files: 1, queries: 1 });
  await assert.rejects(validateConfiguration(await loadConfiguration('duplicate.ttl', directory)), /Duplicate identifier/);
  await assert.rejects(validateConfiguration(await loadConfiguration('query.ttl', directory)), /CONSTRUCT/);
  await assert.rejects(validateConfiguration(await loadConfiguration('identifier.ttl', directory)), /route identifier/);
});

test('repository example configuration and query files are valid', async () => {
  const result = await validateConfiguration(await loadConfiguration('config/config.example.ttl'));
  assert.equal(result.files, 3);
  assert.equal(result.queries, 10);
});

test('reports missing query files and incomplete settings', async (t) => {
  const directory = await fixture(t, {
    'file.ttl': '<urn:app> a s:WebApplication; c:settings [c:source "https://example.invalid"; c:query "absent.rq"^^f:file].',
    'source.ttl': '<urn:app> a s:WebApplication; c:settings [c:query "CONSTRUCT {?s ?p ?o} WHERE {?s ?p ?o}"].',
    'literal.ttl': '<urn:app> a s:WebApplication; s:hasPart "invalid".'
  });
  await assert.rejects(validateConfiguration(await loadConfiguration('file.ttl', directory), directory), /absent.rq/);
  await assert.rejects(validateConfiguration(await loadConfiguration('source.ttl', directory)), /one source/);
  await assert.rejects(validateConfiguration(await loadConfiguration('literal.ttl', directory)), /resource/);
});

test('concurrent callers wait for the same fully initialized value', async () => {
  let finish;
  let calls = 0;
  const get = sharedInitialization(() => {
    calls++;
    return new Promise(resolve => { finish = resolve; });
  });
  const first = get();
  const second = get();
  assert.equal(first, second);
  await Promise.resolve();
  finish({ ready: true });
  assert.deepEqual(await second, { ready: true });
  assert.equal(await first, await get());
  assert.equal(calls, 1);
});

test('failed initialization can be retried', async () => {
  let attempts = 0;
  const get = sharedInitialization(async () => {
    if (++attempts === 1) throw new Error('temporary failure');
    return 'ready';
  });
  await assert.rejects(get(), /temporary failure/);
  assert.equal(await get(), 'ready');
  assert.equal(attempts, 2);
});
