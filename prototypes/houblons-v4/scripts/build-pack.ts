// Écrit data/pack-mini-protos.json depuis le moteur. Usage : npm run pack (vite-node).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPack } from '../src/pack/buildPack';

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(here, 'data', 'pack-mini-protos.json');
const pack = buildPack();
const text = JSON.stringify(pack) + '\n';
fs.writeFileSync(file, text);
const kb = Buffer.byteLength(text) / 1024;
console.log(`PACK-V4 ${path.relative(path.resolve(here, '../..'), file).replace(/\\/g, '/')} ${kb.toFixed(1)} ko : ${pack.stock.length} houblons du stock, ${pack.catalogue.length} au catalogue, S1 ${pack.scenarios.S1.voies.length} voies, S2 ${pack.scenarios.S2.pairs.length} paires, S3 ${pack.scenarios.S3.ranked.length} houblons classés`);
// Plafond relevé de 400 à 500 ko le 18.10.2026 (catalogue à acheter, cas S4 et S5) : décision réversible, à confirmer par le pilote.
if (kb > 500) { console.log('PACK-V4 TROP GROS (> 500 ko)'); process.exitCode = 1; }
