// Parcours ACHETER au doigt (21.11) : facture → Confirmer → stock ; Finances et Calendrier ; matériel → Parc ; hors ligne.
// `node parcours.mjs <1|4>` : 1 = CPU 1×, 4 = CPU ralenti ×4 (INP). Lecture simulée (banc), jamais Gemini.
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const A = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-21-workflows-app/acheter';
const { lancer, sleep } = await import(pathToFileURL(path.join(A, 'banc.mjs')).href);
const { fixtureAchat, lectureBrouwland } = await import(pathToFileURL(path.join(A, 'fixture-achat.mjs')).href);
const S = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad';
const rate = Number(process.argv[2] || 1);
const out = path.join(A, 'captures', `parcours-${rate}x`); fs.mkdirSync(out, { recursive: true });
const photo = path.join(S, 'recon', '01-courses.png');
const auj = new Date().toISOString().slice(0, 10);
const b = await lancer({ build: path.join(S, 'build'), fixture: fixtureAchat(auj).entrees, lecture: lectureBrouwland(auj), sortie: out });
await b.p.evaluateOnNewDocument(() => {
  window.__inp = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__inp.push({ nom: e.name, d: Math.round(e.duration), t: Math.round(e.startTime) }); })
    .observe({ type: 'event', durationThreshold: 16, buffered: true });
});
await b.cdp.send('Emulation.setCPUThrottlingRate', { rate });
const log = (...a) => console.log(...a);
const texte = async (re, n = 300) => { const t = await b.texte(); const i = t.search(re); return i < 0 ? `(absent : ${re})` : t.slice(i, i + n).replace(/\n/g, ' | '); };
const bas = async () => (await b.boutons()).filter((x) => /@\d+,(7|8)\d\d/.test(x)).join(' ; ');
const etapes = [];
// geste chronométré ; un blocage fait une capture et une sonde de la barre basse
async function etape(nom, f) {
  b.raz(); const t0 = Date.now(); const a0 = await b.p.evaluate(() => Math.round(performance.now()));
  try { await f(); } catch (e) {
    log(`BLOCAGE ${nom} : ${e.message}`); log(`  barre basse : ${await bas()}`);
    await b.cap(`blocage-${nom}`);
  }
  const a1 = await b.p.evaluate(() => Math.round(performance.now()));
  etapes.push({ nom, gestes: b.gestes(), ms: Date.now() - t0, abs: `${a0}-${a1}`, traces: b.traces.map((t) => `${t.geste} ${t.ms}ms`).join(' · ') });
}
async function onglet(n) {
  // la barre basse nomme Stocks « Stocks, N article(s) à commander » : préfixe
  await b.toucher(n, { dans: 'nav button', prefixe: true }); await sleep(300);
}
try {
  log('ouverture ms', await b.ouvrir());
  // 1. facture jusqu'à Confirmer
  await etape('facture-photo', async () => {
    await b.toucher('Actions rapides'); await b.toucher('Facture, photo ou PDF');
    const [fc] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }), b.toucher('Photographier le ticket')]);
    await fc.accept([photo]);
    await b.p.waitForFunction(() => /Doute|ligne sûre|Confirmer/.test(document.body.innerText), { timeout: 30000 });
    await b.calme(3000); await b.cap('facture-lue');
  });
  await etape('lignes', async () => {
    await b.toucher('Ouvrir la ligne');
    for (let k = 0; k < 3; k++) {
      log(`  ligne ${k + 1} :`, await texte(/FACTURE/, 160));
      if (k === 0 || await b.visible('Garder')) await b.toucher('Garder');
      if (k < 2 && await b.visible('Suivant', { prefixe: true })) await b.toucher('Suivant', { prefixe: true });
    }
    await b.cap('lignes-gardees');
    log('  pied :', await texte(/reliés/, 120));
  });
  await etape('confirmer', async () => {
    await b.toucher('Confirmer', { prefixe: true }); await sleep(1500); await b.cap('apres-confirmer');
    if (await b.visible('Confirmer', { prefixe: true })) throw new Error('Confirmer encore visible (refus)');
  });
  // feuille « Tes finances, avant → après » qui reste ouverte après Confirmer : OK pour la fermer
  await etape('ok-feuille', async () => {
    if (!(await b.visible('OK'))) { log('  pas de feuille avant → après'); return; }
    await b.cap('feuille-avant-apres'); await b.toucher('OK');
  });
  // 2. stock après réception, puis Finances et Calendrier
  await etape('bord-stock', async () => { await onglet('Bord'); log('  Bord :', await texte(/à commander|Stocks/, 200)); await b.cap('apres-bord'); });
  await etape('stocks-courses', async () => {
    await onglet('Stocks'); await b.toucher('Courses'); await b.cap('apres-courses');
    log('  Courses :', await texte(/manque|rien|Tout voir|À commander/, 240));
    if (await b.visible('Tout voir')) await b.toucher('Tout voir');
    await b.cap('apres-courses-tout'); log('  Courses tout :', await texte(/Brouwland/, 300));
  });
  await etape('finances', async () => { await onglet('Finances'); await b.cap('apres-finances'); log('  Finances :', await texte(/Charges|CHF|paiement/, 320)); });
  await etape('calendrier', async () => {
    await onglet('Calendrier'); await sleep(800); await b.cap('apres-calendrier');
    const lbl = await b.p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((l) => /CHF|Brouwland|malt|Achat/i.test(l)).slice(0, 8));
    log('  Calendrier labels :', JSON.stringify(lbl));
  });
  // 3. besoin matériel → parc
  await etape('materiel-pompe', async () => {
    await onglet('Stocks'); await b.toucher('Matériel'); await b.toucher('À venir', { prefixe: true });
    await b.cap('materiel-avenir'); log('  À venir :', await texte(/Pompe/, 240));
    await b.toucher('Pompe de transfert', { prefixe: true }); await b.cap('materiel-pompe');
    log('  Pompe :', await texte(/Pompe de transfert/, 300));
  });
  // 3b. l'appareil passe au Parc (« Marquer comme réalisé » ; la voie facture de la Pompe n'a pas de fixture)
  await etape('pompe-au-parc', async () => {
    await b.toucher('Marquer comme réalisé'); await b.cap('pompe-realisee');
    await b.toucher('Parc', { prefixe: true }); await b.cap('parc');
    log('  Parc :', await texte(/Pompe de transfert/, 200));
  });
  await etape('calendrier-pompe', async () => {
    await onglet('Calendrier'); await sleep(800); await b.cap('calendrier-pompe');
    log('  Calendrier pompe :', JSON.stringify(await b.p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((l) => /Pompe|CHF à dépenser/i.test(l)).slice(0, 4))));
  });
  // 4. hors ligne : photo de facture avec le réseau coupé (aiTask refusé par le banc)
  await etape('hors-ligne-facture', async () => {
    await onglet('Bord');
    await b.p.evaluate(() => { window.__horsLigne = true; });
    await b.toucher('Actions rapides'); await b.toucher('Facture, photo ou PDF');
    const [fc] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }), b.toucher('Photographier le ticket')]);
    await fc.accept([photo]); await sleep(4000); await b.calme(3000); await b.cap('hors-ligne-facture');
    log('  message HL :', await texte(/hors ligne|connexion|réseau|Réessayer|impossible|erreur|à la main/i, 300));
    log('  boutons HL :', (await b.boutons()).filter((x) => /Saisir|main|Réessayer|Annuler|Fermer|Garder|Confirmer|Suivant|Ajout/i.test(x)).join(' ; ').slice(0, 800));
    await b.p.evaluate(() => { window.__horsLigne = false; });
  });
  log('BOUTONS fin :', (await b.boutons()).slice(0, 12).join(' ; ').slice(0, 900));
} catch (e) { log('ERR', e.message); await b.cap('erreur'); }
log('--- gestes et temps (CPU ×' + rate + ')');
for (const s of etapes) log(`${s.nom} : ${s.gestes} gestes, ${s.ms} ms ; ${s.traces}`);
const inp = await b.p.evaluate(() => window.__inp);
const max = inp.reduce((m, e) => Math.max(m, e.d), 0);
log(`INP max (CPU ×${rate}) : ${max} ms ; interactions ${inp.length}`, JSON.stringify(inp.sort((x, y) => y.d - x.d).slice(0, 6)));
log('captures', b.caps.length, out);
await b.fin();
