// Chaîne ACHETER jouée au doigt de bout en bout (21.11) : état avant (Bord, Courses, Finances, Calendrier) → facture photographiée
// (lecture SIMULÉE) → chaque ligne gardée → Confirmer → état après aux mêmes endroits. Gestes et temps relevés par segment.
// `node chaine.mjs [largeur]` ; captures dans captures/ (ou $SORTIE).
import path from 'node:path'; import fs from 'node:fs';
import { lancer, sleep } from './banc.mjs'; import { fixtureAchat, lectureBrouwland } from './fixture-achat.mjs';
const S = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad';
const ICI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const out = process.env.SORTIE || path.join(ICI, 'captures'); fs.mkdirSync(out, { recursive: true });
const auj = new Date().toISOString().slice(0, 10);
const photo = path.join(S, 'recon', '01-courses.png');
const b = await lancer({ build: path.join(S, 'build'), fixture: fixtureAchat(auj).entrees, lecture: lectureBrouwland(auj), sortie: out });
const log = (...a) => console.log(...a);
const extrait = async (re, n = 400) => { const t = await b.texte(); const i = t.search(re); return i < 0 ? `(absent : ${re})` : t.slice(i, i + n).replace(/\n/g, ' | '); };
const segments = [];
const segment = async (nom, f) => { b.raz(); const t0 = Date.now(); try { await f(); } catch (e) { log(`ERR ${nom} : ${e.message}`); await b.cap(`erreur-${nom}`); } segments.push({ nom, gestes: b.gestes(), ms: Date.now() - t0, traces: [...b.traces] }); };
const onglet = async (n) => { await b.toucher(n, { dans: 'nav button' }); await sleep(300); };
async function etat(tag) {
  await onglet('Bord'); log(`[${tag}] Bord :`, await extrait(/\d+ articles? à commander|Stocks/, 160), '||', await extrait(/Finances\n/, 120));
  await onglet('Stocks'); await b.toucher('Courses'); await b.cap(`${tag}-courses`); log(`[${tag}] Courses :`, await extrait(/manque|rien|Tout voir|À commander/, 300));
  if (await b.visible('Tout voir')) { await b.toucher('Tout voir'); await b.cap(`${tag}-courses-tout`); log(`[${tag}] Courses tout :`, await extrait(/Brouwland|Hygiène/, 500)); }
  await b.toucher('Articles'); log(`[${tag}] Articles :`, await extrait(/Malts/, 160));
  await b.toucher('Matériel'); await b.cap(`${tag}-materiel`); log(`[${tag}] Matériel :`, await extrait(/Pompe|À venir|Parc/, 300));
  await onglet('Finances'); await b.cap(`${tag}-finances`); log(`[${tag}] Finances :`, await extrait(/CHF|Caisse|Solde/, 500));
  await onglet('Calendrier'); await sleep(800); await b.cap(`${tag}-calendrier`); log(`[${tag}] Calendrier :`, await extrait(/CHF|à dépenser|Malt|Brouwland|IPA/, 400));
  const lbl = await b.p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((l) => /CHF|solde|caisse|Brouwland|malt/i.test(l)).slice(0, 12));
  log(`[${tag}] Calendrier labels :`, JSON.stringify(lbl));
}
try {
  log('ouverture ms', await b.ouvrir());
  await etat('avant');
  await onglet('Bord');
  await segment('ouvrir-facture', async () => {
    await b.toucher('Actions rapides'); await b.toucher('Facture, photo ou PDF');
    const [fc] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }), b.toucher('Photographier le ticket')]);
    const t0 = Date.now(); await fc.accept([photo]);
    await b.p.waitForFunction(() => /Doute|ligne sûre|Confirmer/.test(document.body.innerText), { timeout: 30000 });
    log('lecture visible après ms', Date.now() - t0); await b.calme(3000); await b.cap('facture-lue');
  });
  await segment('relire-lignes', async () => {
    await b.toucher('Ouvrir la ligne');
    for (let k = 0; k < 3; k++) {
      await b.cap(`ligne-${k + 1}`);
      log(`ligne ${k + 1} :`, await extrait(/FACTURE/, 220));
      if (await b.visible('Garder')) await b.toucher('Garder');
      if (k < 2 && await b.visible('Suivant', { prefixe: true })) await b.toucher('Suivant', { prefixe: true });
    }
    await b.cap('lignes-gardees');
    log('pied :', await extrait(/reliés|Pour quoi/, 300));
  });
  await segment('confirmer', async () => {
    await b.toucher('Confirmer', { prefixe: true });
    await sleep(1500); await b.cap('apres-confirmer'); log('après confirmer :', (await b.texte()).slice(-700).replace(/\n/g, ' | '));
    if (await b.visible('Confirmer', { prefixe: true })) { log('Confirmer encore visible : refus ?', await extrait(/Corrige|manque|erreur|requis|obligatoire/i, 300)); }
  });
  await etat('apres');
} catch (e) { log('ERR', e.message); await b.cap('erreur'); }
for (const s of segments) log(`SEGMENT ${s.nom} : ${s.gestes} gestes, ${s.ms} ms ; ${s.traces.map((t) => `${t.geste}[${t.cible}] ${t.ms}ms`).join(' · ')}`);
log('ai', b.journal.ai, 'erreurs', b.journal.erreurs.filter((x) => !/ERR_FAILED/.test(x)).slice(0, 6));
log('captures', b.caps.length, out);
await b.fin();
