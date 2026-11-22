// Rebâtir : node work/missions/2026-11-16-carnet-decision/ra-p5f/build.mjs (insère ../fixture.json dans proto.src.html)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const d = path.dirname(fileURLToPath(import.meta.url));
const s = fs.readFileSync(path.join(d, 'proto.src.html'), 'utf8').split('__FIXTURE__');
if (s.length !== 2) throw new Error('marque __FIXTURE__ absente ou double');
const fx = fs.readFileSync(path.join(d, '..', 'fixture.json'), 'utf8').replace(/<\//g, '<\/');
fs.writeFileSync(path.join(d, 'proto.html'), s.join(fx)); console.log('BUILD OK');
