// Hors ligne sur état neuf (sans facture déjà enregistrée) : photo de facture refusée par le réseau, banc.
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const A = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-21-workflows-app/acheter';
const { lancer, sleep } = await import(pathToFileURL(path.join(A, 'banc.mjs')).href);
const { fixtureAchat, lectureBrouwland } = await import(pathToFileURL(path.join(A, 'fixture-achat.mjs')).href);
const S = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad';
const out = path.join(A, 'captures', 'hors-ligne'); fs.mkdirSync(out, { recursive: true });
const auj = new Date().toISOString().slice(0, 10);
const photo = path.join(S, 'recon', '01-courses.png');
const b = await lancer({ build: path.join(S, 'build'), fixture: fixtureAchat(auj).entrees, lecture: lectureBrouwland(auj), sortie: out });
const bouton = async () => (await b.boutons()).filter((x) => /Saisir|main|Réessayer|Annuler|Fermer|Garder|Enregistrer|Ouvrir|Ajout|Facture|Ferm/i.test(x)).join(' ; ').slice(0, 900);
try {
  await b.ouvrir();
  await b.p.evaluate(() => { window.__horsLigne = true; });
  await b.toucher('Actions rapides'); await b.toucher('Facture, photo ou PDF');
  const [fc] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }), b.toucher('Photographier le ticket')]);
  const t0 = Date.now(); await fc.accept([photo]); await sleep(4000); await b.calme(3000);
  console.log('ATTENTE ms', Date.now() - t0);
  await b.cap('hors-ligne-photo');
  console.log('TEXTE', (await b.texte()).slice(0, 900).replace(/\n/g, ' | '));
  console.log('BOUTONS', await bouton());
  await b.toucher('Saisir à la main', { prefixe: true }).catch((e) => console.log('ERR saisie', e.message));
  await sleep(600); await b.cap('hors-ligne-saisie');
  console.log('SAISIE', (await b.texte()).slice(-900).replace(/\n/g, ' | '));
  console.log('BOUTONS-SAISIE', await bouton());
  console.log('IA appels', JSON.stringify(b.journal.ai), 'erreurs', JSON.stringify(b.journal.erreurs.filter((x) => !/wasm/.test(x)).slice(0, 4)));
} catch (e) { console.log('ERR', e.message); await b.cap('erreur-hl'); }
console.log('caps', b.caps.length, out);
await b.fin();
