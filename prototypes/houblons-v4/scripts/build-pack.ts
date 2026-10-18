// Écrit data/pack-mini-protos.json (et data/pack-fiches.json si les fiches ne tiennent pas dans le
// pack) depuis le moteur. Usage : npm run pack (vite-node).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll, PACK_MAX_BYTES } from '../src/pack/buildPack';

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rel = (f: string) => path.relative(path.resolve(here, '../..'), f).replace(/\\/g, '/');
const file = path.join(here, 'data', 'pack-mini-protos.json');
const fichesFile = path.join(here, 'data', 'pack-fiches.json');
const { pack, fiches } = buildAll();
const text = JSON.stringify(pack) + '\n';
fs.writeFileSync(file, text);
const kb = Buffer.byteLength(text) / 1024;
console.log(`PACK-V4 ${rel(file)} ${kb.toFixed(1)} ko : ${pack.stock.length} houblons du stock, ${pack.catalogue.length} au catalogue, S1 ${pack.scenarios.S1.voies.length} voies, S2 ${pack.scenarios.S2.pairs.length} paires, S3 ${pack.scenarios.S3.ranked.length} houblons classés`);
if (fiches) {
  const t = JSON.stringify(fiches) + '\n';
  fs.writeFileSync(fichesFile, t);
  console.log(`FICHES-V4 ${rel(fichesFile)} ${(Buffer.byteLength(t) / 1024).toFixed(1)} ko : ${fiches.fichesHoublons.length} fiches houblons`);
} else if (fs.existsSync(fichesFile)) fs.rmSync(fichesFile);
// Plafond de 500 ko accepté par le pilote (18.10.2026).
if (Buffer.byteLength(text) > PACK_MAX_BYTES) { console.log('PACK-V4 TROP GROS (> 500 ko)'); process.exitCode = 1; }
