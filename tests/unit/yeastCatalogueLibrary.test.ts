import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { runInNewContext } from 'node:vm';
import { deepStrictEqual } from 'node:assert';
import { build } from 'esbuild';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { yeastCatalogueLibrary } from '../../src/domain/yeastCatalogueLibrary';
import packed from '../../src/data/yeastCatalogueLibrary.json';
import { buildYeastLibrary, serializeYeastLibrary } from '../../scripts/build-yeast-library.mjs';

const sourceText = readFileSync(new URL('../../src/data/yeastCatalogueBootstrap.json', import.meta.url), 'utf8');
const source = JSON.parse(sourceText) as HopYeast[];
const packedText = readFileSync(new URL('../../src/data/yeastCatalogueLibrary.json', import.meta.url), 'utf8');

async function libraryUsing(pack: unknown) {
  vi.doMock('../../src/data/yeastCatalogueLibrary.json', () => ({ default: pack }));
  return (await import('../../src/domain/yeastCatalogueLibrary')).yeastCatalogueLibrary;
}
afterEach(() => { vi.doUnmock('../../src/data/yeastCatalogueLibrary.json'); vi.resetModules(); });

describe('Bibliothèque complète de levures sans import personnel', () => {
  it('restitue exactement les 1 733 références, faits, conditions et reçus de la source', () => {
    const references = yeastCatalogueLibrary();
    expect(references).toHaveLength(1733);
    expect(new Set(references.map(row => row.id)).size).toBe(references.length);
    for (let index = 0; index < source.length; index++) {
      // Deep strict equality detects absent/null changes, numeric changes and
      // fields lost from forms, statuses, sources, conditions or retrievals.
      deepStrictEqual(references[index], source[index], source[index].id);
      assertHopKnowledge(references[index]);
    }
    expect(JSON.stringify(references)).toBe(JSON.stringify(source));
  });

  it('génère le fichier courant de façon déterministe et lie son empreinte aux octets source', () => {
    expect(serializeYeastLibrary(sourceText)).toBe(packedText);
    expect(serializeYeastLibrary(sourceText)).toBe(serializeYeastLibrary(sourceText));
    expect(packed.sourceSha256).toBe(createHash('sha256').update(sourceText).digest('hex'));
    const corrected = structuredClone(source);
    corrected[0].name += ' — correction de contrôle';
    expect(serializeYeastLibrary(JSON.stringify(corrected))).not.toBe(packedText);
    expect(() => buildYeastLibrary(JSON.stringify([source[0], source[0]]))).toThrow('dupliquée');
  });

  it('réduit le JSON et le transfert gzip sans conserver une seconde copie complète', () => {
    const minified = JSON.stringify(source);
    expect(Buffer.byteLength(packedText)).toBeLessThan(Buffer.byteLength(minified) * 0.3);
    expect(gzipSync(packedText).length).toBeLessThan(gzipSync(minified).length);
  });

  it('partage un cache profondément immuable et laisse une copie explicite modifiable', () => {
    const references = yeastCatalogueLibrary();
    expect(yeastCatalogueLibrary()).toBe(references);
    const seen = new Set<object>();
    let occurrences = 0;
    const inspect = (value: unknown) => {
      if (!value || typeof value !== 'object') return;
      occurrences++;
      if (seen.has(value)) return;
      seen.add(value);
      expect(Object.isFrozen(value)).toBe(true);
      Object.values(value).forEach(inspect);
    };
    inspect(references);
    expect(occurrences).toBeGreaterThan(seen.size);
    const copy = structuredClone(references[0]);
    copy.catalogue!.facts[0].reported = 'Correction personnelle';
    expect(references[0].catalogue!.facts[0].reported).toBe(source[0].catalogue!.facts[0].reported);
    expect(() => { references[0].catalogue!.facts[0].reported = 'Mutation globale'; }).toThrow();
  });

  it('refuse un format futur, une référence cyclique et un nombre de fiches incohérent', async () => {
    for (const invalid of [
      { ...packed, version: 999 },
      { ...packed, nodes: [[0, 0], ...packed.nodes.slice(1)] },
      { ...packed, entryCount: packed.entryCount + 1 }
    ]) {
      vi.resetModules();
      const read = await libraryUsing(invalid);
      expect(read).toThrow('Bibliothèque de levures invalide');
    }
  });

  it('valide la sémantique des fiches après décodage au lieu de masquer une corruption', async () => {
    const invalid = structuredClone(source[0]) as any;
    invalid.betaLyase = 'invented';
    const read = await libraryUsing(buildYeastLibrary(JSON.stringify([invalid])));
    expect(read).toThrow('Statut β-lyase invalide');
  });

  it('préserve le zéro signé, les champs absents et les données nulles', async () => {
    const original = structuredClone(source[0]);
    delete original.form;
    original.catalogue!.facts[0].range = { min: 0, max: 0 };
    const text = JSON.stringify([original]).replace('"min":0', '"min":-0');
    const read = await libraryUsing(buildYeastLibrary(text));
    const restored = read();
    deepStrictEqual(restored, JSON.parse(text));
    expect(Object.is(restored[0].catalogue!.facts[0].range!.min, -0)).toBe(true);
    expect(restored[0]).not.toHaveProperty('form');
    expect(restored[0].catalogue!.publishedAt).toBeNull();
  });

  it('exécute le même catalogue dans un bundle navigateur sans Node, DOM ou stockage', async () => {
    const bundle = await build({
      entryPoints: [fileURLToPath(new URL('../../src/domain/yeastCatalogueLibrary.ts', import.meta.url))],
      bundle: true, platform: 'browser', format: 'iife', globalName: 'LibraryProbe',
      target: 'es2020', minify: true, write: false, metafile: true, logLevel: 'silent'
    });
    expect(Object.keys(bundle.metafile!.inputs).some(path => /yeastCatalogueBootstrap|firestore|firebase|dexie/i.test(path))).toBe(false);
    const probe = `${bundle.outputFiles![0].text}\n(() => {
      const start = performance.now();
      const rows = LibraryProbe.yeastCatalogueLibrary();
      const coldMs = performance.now() - start;
      const cachedStart = performance.now();
      for (let index = 0; index < 10000; index++) LibraryProbe.yeastCatalogueLibrary();
      const cachedMs = (performance.now() - cachedStart) / 10000;
      return { rows, coldMs, cachedMs, json: JSON.stringify(rows), same: rows === LibraryProbe.yeastCatalogueLibrary(), frozen: Object.isFrozen(rows) };
    })()`;
    const result = runInNewContext(probe, { URL, performance }, { timeout: 10000 });
    expect(result.json).toBe(JSON.stringify(source));
    expect(result.same).toBe(true);
    expect(result.frozen).toBe(true);
    if (import.meta.env.MODE === 'yeast-library-measure') {
      const samples = [result];
      for (let index = 1; index < 20; index++) {
        const { coldMs, cachedMs } = runInNewContext(probe, { URL, performance }, { timeout: 10000 });
        samples.push({ coldMs, cachedMs });
      }
      const spread = (key: 'coldMs' | 'cachedMs') => {
        const values = samples.map(row => row[key]).sort((a, b) => a - b);
        return { median: values[10], min: values[0], max: values[19] };
      };
      const countObjects = (root: unknown) => {
        const seen = new Set<object>();
        const visit = (value: unknown) => {
          if (!value || typeof value !== 'object' || seen.has(value)) return;
          seen.add(value); Object.values(value).forEach(visit);
        };
        visit(root); return seen.size;
      };
      console.log('YEAST_LIBRARY_MEASURES', JSON.stringify({
        node: process.version, samples: samples.length,
        browserBundleBytes: bundle.outputFiles![0].contents.length,
        browserBundleGzipBytes: gzipSync(bundle.outputFiles![0].contents).length,
        firstDecodeValidateFreezeMs: spread('coldMs'), cachedReadMs: spread('cachedMs'),
        sourceObjects: countObjects(source), reconstructedObjects: countObjects(result.rows),
        factCount: source.reduce((total, row) => total + (row.catalogue?.facts.length ?? 0), 0),
        receiptCount: source.reduce((total, row) => total + (row.catalogue?.retrievals.length ?? 0), 0)
      }));
    }
  });
});
