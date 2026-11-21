// Reconnaissance : `node recon.mjs <étapes…>` ; chaque étape = un texte à toucher (préfixe « ~ » : contient). Capture et liste des contrôles à la fin.
import path from 'node:path'; import fs from 'node:fs';
import { lancer, sleep } from './banc.mjs'; import { fixtureAchat, lectureBrouwland } from './fixture-achat.mjs';
const S = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad';
const out = path.join(S, 'recon'); fs.mkdirSync(out, { recursive: true });
const auj = new Date().toISOString().slice(0, 10);
const b = await lancer({ build: path.join(S, 'build'), fixture: fixtureAchat(auj).entrees, lecture: lectureBrouwland(auj), sortie: out });
try {
  console.log('ouverture ms', await b.ouvrir());
  for (const e of process.argv.slice(2)) {
    if (e.startsWith('wait:')) { await sleep(Number(e.slice(5))); continue; }
    if (e.startsWith('cap:')) { await b.cap(e.slice(4)); continue; }
    await b.toucher(e.replace(/^~/, ''), { contient: e.startsWith('~') });
  }
  await b.cap('fin'); console.log((await b.texte()).slice(0, 1500)); console.log((await b.boutons()).join('\n'));
} catch (e) { console.log('ERR', e.message); await b.cap('erreur'); console.log((await b.boutons()).join('\n')); }
console.log('traces', JSON.stringify(b.traces));
console.log('bloquees', b.journal.bloquees, 'ai', b.journal.ai, 'erreurs', b.journal.erreurs.slice(0, 5));
await b.fin();
