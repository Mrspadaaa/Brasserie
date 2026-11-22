// Stock après Confirmer : Stocks › Articles (malt, Citra, US-05, soude) pour mesurer « le stock qui monte ».
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const A = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-21-workflows-app/acheter';
const { lancer, sleep } = await import(pathToFileURL(path.join(A, 'banc.mjs')).href);
const { fixtureAchat, lectureBrouwland } = await import(pathToFileURL(path.join(A, 'fixture-achat.mjs')).href);
const S = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad';
const out = path.join(A, 'captures', 'stock-apres'); fs.mkdirSync(out, { recursive: true });
const auj = new Date().toISOString().slice(0, 10);
const photo = path.join(S, 'recon', '01-courses.png');
const b = await lancer({ build: path.join(S, 'build'), fixture: fixtureAchat(auj).entrees, lecture: lectureBrouwland(auj), sortie: out });
const texte = async (re, n = 260) => { const t = await b.texte(); const i = t.search(re); return i < 0 ? `(absent ${re})` : t.slice(i, i + n).replace(/\n/g, ' | '); };
try {
  await b.ouvrir();
  await b.toucher('Actions rapides'); await b.toucher('Facture, photo ou PDF');
  const [fc] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }), b.toucher('Photographier le ticket')]);
  await fc.accept([photo]);
  await b.p.waitForFunction(() => /Doute|ligne sûre|Confirmer/.test(document.body.innerText), { timeout: 30000 });
  await b.calme(3000);
  await b.toucher('Ouvrir la ligne'); await b.toucher('Garder');
  await b.toucher('Confirmer', { prefixe: true }); await sleep(1500);
  if (await b.visible('OK')) await b.toucher('OK');
  await b.toucher('Stocks', { dans: 'nav button', prefixe: true }); await b.toucher('Articles');
  await sleep(500); await b.cap('articles-apres');
  console.log('ARTICLES', await texte(/Malts/, 420));
  console.log('MALT', await texte(/Malt pilsner/, 200));
  console.log('CITRA', await texte(/Citra/, 160));
  console.log('US05', await texte(/US-05/, 160));
} catch (e) { console.log('ERR', e.message); await b.cap('erreur-stock'); }
await b.fin();
