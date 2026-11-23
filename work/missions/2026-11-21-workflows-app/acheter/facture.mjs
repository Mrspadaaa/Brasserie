// Chaîne ACHETER, maillon facture : + → Facture, photo ou PDF → photo (image du banc) → lecture SIMULÉE → relecture → enregistrer,
// puis Stocks, Finances, Calendrier relus. `node facture.mjs <étape-max> [hors-ligne]`.
import path from 'node:path'; import fs from 'node:fs';
import { lancer, sleep } from './banc.mjs'; import { fixtureAchat, lectureBrouwland } from './fixture-achat.mjs';
const S = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad';
const out = process.env.SORTIE || path.join(S, 'facture'); fs.mkdirSync(out, { recursive: true });
const auj = new Date().toISOString().slice(0, 10);
const photo = path.join(S, 'recon', '01-courses.png'); // une image quelconque : la lecture est simulée
const b = await lancer({ build: path.join(S, 'build'), fixture: fixtureAchat(auj).entrees, lecture: lectureBrouwland(auj), sortie: out });
const log = (...a) => console.log(...a);
const voir = async (n = 1200) => log((await b.texte()).slice(0, n));
const controles = async () => log((await b.boutons()).filter((l) => !/«(Bord|Finances|Calendrier|Brassins|Stocks|Clients|Période|Retour au|Rechercher|Plus :)/.test(l)).join('\n'));
const etapes = process.argv.slice(2);
try {
  await b.ouvrir();
  await b.toucher('Actions rapides');
  const [fc] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }).catch(() => null), b.toucher('Facture, photo ou PDF')]);
  log('sélecteur de fichier ouvert directement :', !!fc);
  let input = fc;
  if (!fc) { await b.cap('facture-ouverte'); await controles(); const [fc2] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }).catch(() => null), b.toucher('Photo', { prefixe: true }).catch((e) => log(e.message))]); input = fc2; }
  if (!input) throw new Error('aucun sélecteur de fichier');
  const t0 = Date.now(); await input.accept([photo]); b.raz();
  await b.cap('lecture-en-cours');
  await b.p.waitForFunction(() => /Brouwland/.test(document.body.innerText), { timeout: 30000 }).catch(() => log('Brouwland jamais affiché'));
  log('photo → lecture affichée ms', Date.now() - t0, 'ai', b.journal.ai);
  await b.calme(3000); await b.cap('lecture-faite'); await voir(2500); await controles();
  for (const e of etapes) {
    if (e.startsWith('cap:')) { await b.cap(e.slice(4)); continue; }
    if (e === 'texte') { await voir(3000); await controles(); continue; }
    if (e.startsWith('defiler:')) { await b.p.evaluate((y) => { const s = [...document.querySelectorAll('*')].filter((x) => x.scrollHeight > x.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(x).overflowY)).pop(); (s || document.scrollingElement).scrollBy(0, y); }, Number(e.slice(8))); await sleep(400); continue; }
    if (e.startsWith('wait:')) { await sleep(Number(e.slice(5))); continue; }
    await b.toucher(e.replace(/^[~^]/, ''), { contient: e.startsWith('~'), prefixe: e.startsWith('^') });
  }
  await b.cap('fin'); await voir(2500); await controles();
} catch (e) { log('ERR', e.message); await b.cap('erreur'); await controles(); }
log('gestes', b.gestes(), 'traces', JSON.stringify(b.traces));
log('ai', b.journal.ai, 'erreurs', b.journal.erreurs.filter((x) => !/ERR_FAILED/.test(x)).slice(0, 6));
await b.fin();
