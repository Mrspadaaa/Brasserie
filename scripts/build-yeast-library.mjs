import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const sourcePath = fileURLToPath(new URL('../src/data/yeastCatalogueBootstrap.json', import.meta.url));
const outputPath = fileURLToPath(new URL('../src/data/yeastCatalogueLibrary.json', import.meta.url));

/** Lossless JSON graph. First intern every value, then retain only values with
 * multiple incoming edges in the dictionary. Unique values stay inline.
 * Numbers are dictionary references; [0, ...values] is an array, [1, number]
 * a number literal, [2] negative zero, [shapeId + 3, ...values] an object.
 * Dictionary children precede parents. No brewing field is selected or rewritten. */
export function buildYeastLibrary(sourceText) {
  const references = JSON.parse(sourceText);
  if (!Array.isArray(references) || references.some(row => row?.kind !== 'yeast' || typeof row.id !== 'string')) {
    throw Error('Le catalogue source doit être une liste de références de levure.');
  }
  if (new Set(references.map(row => row.id)).size !== references.length) throw Error('Identité de levure dupliquée.');

  const nodes = [], shapes = [], nodeIds = new Map(), shapeIds = new Map();
  const intern = value => {
    let node = value;
    if (Array.isArray(value)) node = [0, ...value.map(intern)];
    else if (value !== null && typeof value === 'object') {
      const keys = Object.keys(value), signature = JSON.stringify(keys);
      let shape = shapeIds.get(signature);
      if (shape === undefined) { shape = shapes.length; shapes.push(keys); shapeIds.set(signature, shape); }
      node = [1, shape, ...keys.map(key => intern(value[key]))];
    } else if (Object.is(value, -0)) node = [2];
    const signature = JSON.stringify(node);
    let id = nodeIds.get(signature);
    if (id === undefined) { id = nodes.length; nodes.push(node); nodeIds.set(signature, id); }
    return id;
  };
  const rootId = intern(references);
  const incoming = nodes.map(() => 0);
  for (const node of nodes) {
    if (Array.isArray(node) && node[0] !== 2) {
      for (const id of node.slice(node[0] === 0 ? 1 : 2)) incoming[id]++;
    }
  }
  incoming[rootId]++;
  const dictionary = [], values = [];
  for (let id = 0; id < nodes.length; id++) {
    const node = nodes[id];
    let value = node;
    if (Array.isArray(node)) {
      value = node[0] === 0 ? [0, ...node.slice(1).map(child => values[child])]
        : node[0] === 1 ? [node[1] + 3, ...node.slice(2).map(child => values[child])] : [2];
    } else if (typeof node === 'number') value = [1, node];
    if (incoming[id] > 1) { values[id] = dictionary.length; dictionary.push(value); }
    else values[id] = value;
  }
  return {
    version: 1,
    sourceSha256: createHash('sha256').update(sourceText).digest('hex'),
    entryCount: references.length,
    shapes,
    nodes: dictionary,
    root: values[rootId]
  };
}

export function serializeYeastLibrary(sourceText) {
  return `${JSON.stringify(buildYeastLibrary(sourceText))}\n`;
}

// Importing the generator from a test never writes files or runs a command.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check')) throw Error('Usage : node scripts/build-yeast-library.mjs [--check]');
  const source = readFileSync(sourcePath, 'utf8'), packed = serializeYeastLibrary(source);
  if (args.includes('--check')) {
    if (readFileSync(outputPath, 'utf8') !== packed) throw Error('Bibliothèque périmée : lancer node scripts/build-yeast-library.mjs');
  } else writeFileSync(outputPath, packed, 'utf8');
  const graph = JSON.parse(packed), minified = JSON.stringify(JSON.parse(source));
  console.log(JSON.stringify({
    status: args.includes('--check') ? 'fresh' : 'generated',
    entryCount: graph.entryCount,
    sourceSha256: graph.sourceSha256,
    sourceBytes: Buffer.byteLength(source),
    minifiedSourceBytes: Buffer.byteLength(minified),
    packedBytes: Buffer.byteLength(packed),
    minifiedSourceGzipBytes: gzipSync(minified).length,
    packedGzipBytes: gzipSync(packed).length,
    dictionaryEntries: graph.nodes.length,
    objectShapes: graph.shapes.length
  }, null, 2));
}
