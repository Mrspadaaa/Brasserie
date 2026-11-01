#!/usr/bin/env node
// Voie e-port, G7 : l'écran « Nouvelle dépense » servi joue la maquette r2b geste par geste, à 390 tactile, 390 souris et 1280.
// Chaque scène est écrite côte à côte (l'app à gauche, la maquette à droite). Fixtures seulement : `?dev-local&depense=<état>` (apercuDev.ts, SIMULÉ).
// Usage (le serveur tourne dans le dossier de travail, jamais dans Documents/Brasserie) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5616 --strictPort" --port 5616 --env VITE_FIREBASE_API_KEY=fake \
//     -- node work/missions/2026-10-31-ecran-depense/voies/e-port/capturer-depense.mjs --sortie=<dossier>
// Sortie : « DEPENSE OK » (code 0) ou « DEPENSE ECHEC n » et la liste. Mécanique : à confier à l'exécutant si la série est à refaire.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
fs.mkdirSync(SORTIE, { recursive: true });
const MAQUETTE = pathToFileURL(path.join(RACINE, 'work/missions/2026-10-31-ecran-depense/v1/r2b/etat.html')).href;
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: 'souris390', l: 390, h: 844, tactile: false, echelle: 1 },
  { id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: 'pc1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];
const SEULEMENT = valeur('mode');
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
// L'index.html de l'app (hors de mon Possède) demande les polices Google : la requête est ABORTÉE ici, elle ne part jamais ; elle n'est pas comptée comme sortante.
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], infos = [], motsMesures = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 150)); infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };

async function ouvrir(nav, mode, cible, etat) {
  const t0 = Date.now(); try { return await ouvrir0(nav, mode, cible, etat); } finally { console.error(`[temps] ouvrir ${cible} ${etat} ${mode.id}: ${Date.now() - t0} ms`); }
}
async function ouvrir0(nav, mode, cible, etat) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = []; p.hors = [];
  p.on('pageerror', (e) => p.erreurs.push('PAGE ' + e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT|favicon|Failed to load resource/.test(m.text())) p.erreurs.push(m.text().slice(0, 160)); });
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (local(r.url())) r.continue(); else { if (cible === 'app' && !POLICES.test(r.url())) p.hors.push(r.url().slice(0, 80)); r.abort('blockedbyclient'); } });
  p.setDefaultNavigationTimeout(150000);
  if (cible === 'app') {
    // Vite recharge la page quand il découvre des dépendances (1re ouverture) : jusqu'à trois essais.
    let ouvert = false;
    for (let essai = 1; essai <= 3 && !ouvert; essai++) {
      try {
        await p.goto(`${ADRESSE}/?dev-local&depense=${etat}`, { waitUntil: 'domcontentloaded' });
        await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
        await dormir(800);
        await p.click('[aria-label="Actions rapides"]');
        await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
        await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
        await p.waitForFunction((e) => document.body.dataset.apercu === e, { timeout: 45000 }, etat);
        ouvert = true;
      } catch (e) {
        if (essai === 3) { await p.screenshot({ path: path.join(SORTIE, `echec-ouverture-${mode.id}-${etat}.png`) }); throw new Error(`l’écran ne s’est pas ouvert (état ${etat}) : ${String(e.message).slice(0, 100)} · erreurs ${p.erreurs.join(' / ')}`); }
      }
    }
  } else {
    await p.goto(`${MAQUETTE}?etat=${etat}`);
    await p.waitForSelector('#r2b-bd', { timeout: 30000 });
  }
  await dormir(500);
  return p;
}
const clic = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) throw new Error('introuvable ' + s); e.click(); }, sel).then(() => dormir(250));
const texte = (p) => p.evaluate(() => (document.querySelector('[role="dialog"]') ?? document.body).innerText);
async function coteACote(nav, mode, nom, app, maq) {
  await app.bringToFront(); await dormir(150);
  const a = await app.screenshot({ encoding: 'base64' });
  await maq.bringToFront(); await dormir(150);
  const m = await maq.screenshot({ encoding: 'base64' });
  const q = await nav.newPage();
  await q.setViewport({ width: mode.l * 2 + 12, height: mode.h });
  await q.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px"><img style="width:${mode.l}px" src="data:image/png;base64,${a}"><img style="width:${mode.l}px" src="data:image/png;base64,${m}"></body>`);
  await q.screenshot({ path: path.join(SORTIE, `${mode.id}-${nom}.png`) });
  await q.close();
}
const mesures = (p) => p.evaluate(() => {
  const d = document.querySelector('[role="dialog"]'), pied = d?.querySelector('footer')?.getBoundingClientRect();
  const vh = innerHeight, mots = [];
  const marcheur = document.createTreeWalker(d ?? document.body, NodeFilter.SHOW_TEXT);
  for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
    const e = n.parentElement, r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (!n.textContent.trim() || r.width <= 1 || r.height <= 1 || cs.display === 'none' || cs.visibility === 'hidden' || (e.checkVisibility && !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true }))) continue;
    if (r.bottom <= 0 || r.top >= (pied ? pied.top : vh) || e.closest('footer')) continue;
    mots.push(...n.textContent.trim().split(/\s+/));
  }
  return { debordeX: Math.max(document.documentElement.scrollWidth - innerWidth, (d?.scrollWidth ?? 0) - (d?.clientWidth ?? 0)), piedBas: pied ? Math.round(pied.bottom) : null, vh, piedHaut: pied ? Math.round(pied.top) : null, mots: mots.length };
});

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000 });
async function jouerMode(mode) {
  const etiquette = (s) => `${mode.id} · ${s}`;
  // ---- le repos (état 3) : mesures, six chips, pied
  let app = await ouvrir(nav, mode, 'app', '3'), maq = await ouvrir(nav, mode, 'maquette', '3');
  const m3 = await mesures(app);
  noter(m3.debordeX <= 1, etiquette(`aucun débordement horizontal (${m3.debordeX} px)`));
  noter(m3.piedHaut !== null && m3.piedBas <= m3.vh + 1 && m3.piedHaut > 100, etiquette(`le pied est visible au repos (${m3.piedHaut}–${m3.piedBas} sur ${m3.vh})`));
  motsMesures.push(`${mode.id}: ${m3.mots} mots au premier écran (maquette : 98)`);
  const chips = await app.evaluate(() => [...document.querySelectorAll('[data-dp-chip]')].map((c) => ({ nom: c.textContent, haut: Math.round(c.getBoundingClientRect().bottom) })));
  noter(chips.length >= 5, etiquette(`les points qui pèsent sont des chips numérotées (${chips.map((c) => c.nom).join(' | ')})`));
  const piedHaut = m3.piedHaut ?? 0;
  noter(mode.l >= 900 || chips.slice(0, 4).every((c) => c.haut < piedHaut), etiquette('les premières chips sont lisibles au-dessus du pied'));
  const tot = await app.evaluate(() => document.querySelector('#purchase-total')?.value);
  noter(/86/.test(tot ?? ''), etiquette(`le total est 86,50 (${tot})`));
  const t0 = await texte(app);
  noter(/Lecture à confirmer|Lecture vérifiée|Corrections proposées|Vérification incomplète/.test(t0) || (await app.evaluate(() => !!document.querySelector('[aria-label="Détails de la lecture"]'))), etiquette('le verdict de la lecture est là'));
  await coteACote(nav, mode, '01-repos', app, maq);

  // ---- la preuve (R3) : à un toucher à 390 ; ouverte d'office à 1280
  if (mode.l < 900) await clic(app, '[aria-label="Détails de la lecture"]');
  const preuve = await app.evaluate(() => { const e = document.querySelector('[data-dp="preuve"]'); const r = e?.getBoundingClientRect(); return { vu: !!r && r.width > 0 && r.height > 0, txt: e?.innerText.replace(/\n/g, ' | ') ?? '' }; });
  noter(preuve.vu && /Lecture à confirmer/.test(preuve.txt) && /86,50/.test(preuve.txt) && /\d+\/23/.test(preuve.txt), etiquette(`la preuve se lit : ${preuve.txt.slice(0, 120)}`));
  if (mode.l < 900) await clic(maq, '#r2b-pbtn'); else await clic(maq, '#r2b-ref');
  await coteACote(nav, mode, '02-preuve', app, maq);
  if (mode.l < 900) await clic(app, '[aria-label="Détails de la lecture"]');

  // ---- la TVA : deux valeurs lues côte à côte, choix « — » (HT vide) règle la chip
  await clic(app, '[data-dp="tuile-tva"]'); await clic(maq, '#r2b-ttva');
  const tva = await app.evaluate(() => ({ panneau: document.querySelector('[data-dp="panneau-tva"]')?.innerText.replace(/\n/g, ' | ') ?? '', tuile: document.querySelector('[data-dp="tuile-tva"]')?.innerText.replace(/\n/g, ' ') ?? '' }));
  noter(/2,80/.test(tva.panneau) && /4,15/.test(tva.panneau) && /2,80 · 4,15/.test(tva.tuile) && !/assujetti/i.test(tva.panneau), etiquette(`la TVA montre 2,80 · 4,15 sans « assujetti » : ${tva.panneau.slice(0, 110)}`));
  await coteACote(nav, mode, '03-tva', app, maq);
  await app.evaluate(() => { const b = [...document.querySelectorAll('[data-dp="panneau-tva"] button')].find((x) => /proposé/.test(x.textContent)); b?.click(); });
  await dormir(300);
  const tvaFait = await app.evaluate(() => (() => { const e = document.querySelector('[data-dp-chip^="TVA"]'); return !!e && (/réglé/.test(e.getAttribute('aria-label') ?? '') || e.dataset.dpFait === '1'); })());
  noter(tvaFait, etiquette('choisir « — » règle la chip TVA (barrée)'));

  // ---- Payé le : « C'est la date » règle
  await clic(app, '[data-dp="tuile-paye"]'); await clic(maq, '#r2b-tpay');
  const paye0 = await app.evaluate(() => document.querySelector('[data-dp="tuile-paye"]')?.innerText.replace(/\n/g, ' '));
  noter(/Payé le 27\.04\.2026/.test(paye0) && /supposée/.test(paye0), etiquette(`le paiement est « supposé » (${paye0})`));
  await coteACote(nav, mode, '04-paye', app, maq);
  await app.evaluate(() => [...document.querySelectorAll('[data-dp="panneau-paye"] button')].find((x) => /C’est la date/.test(x.textContent))?.click()); await dormir(300);
  const paye1 = await app.evaluate(() => ({ t: document.querySelector('[data-dp="tuile-paye"]')?.innerText, chip: (() => { const e = document.querySelector('[data-dp-chip="paye"]'); return e && (e.dataset.dpFait === '1' ? 'réglé' : e.getAttribute('aria-label')); })() }));
  noter(!/supposée/.test(paye1.t) && /réglé/.test(paye1.chip ?? ''), etiquette('« C’est la date » règle le paiement'));

  // ---- T4 : Confirmer avec une unité à préciser ne part pas, dit sa raison, mène à la ligne
  await app.evaluate(() => document.querySelector('[role="dialog"] footer button:last-child')?.click()); await dormir(500);
  const t4 = await app.evaluate(() => ({ alerte: document.querySelector('[role="alert"]')?.innerText.replace(/\n/g, ' ') ?? '', pied: document.querySelector('footer')?.innerText ?? '', actif: !document.querySelector('footer button:last-child')?.disabled, focus: document.activeElement?.getAttribute('aria-label') ?? '' }));
  noter(/À corriger/.test(t4.alerte) && /1 unité à préciser/.test(t4.pied) && t4.actif && /Unité ligne/.test(t4.focus), etiquette(`Confirmer refuse avec sa raison (« ${t4.pied.replace(/\n/g, ' ').slice(0, 60)} », focus ${t4.focus})`));
  await coteACote(nav, mode, '05-erreur-unite', app, maq);

  // ---- les autres gestes de R2 : unité, mouture, deux voisins : tous sans plateau ouvert
  await app.evaluate(() => [...document.querySelectorAll('[data-dp-ligne] button')].find((b) => b.textContent === 'g')?.click()); await dormir(250);
  await app.evaluate(() => document.querySelector('[data-dp-mouture-tous]')?.click()); await dormir(250);
  await app.evaluate(() => { for (const b of [...document.querySelectorAll('[data-dp-ligne] button')].filter((x) => /^Créer «/.test(x.textContent))) b.click(); }); await dormir(400);
  const r2 = await app.evaluate(() => ({ barrees: [...document.querySelectorAll('[data-dp-chip]')]  .filter((c) => /réglé/.test(c.getAttribute('aria-label') ?? '') || c.dataset.dpFait === '1').length, total: [...document.querySelectorAll('[data-dp-chip]')].length, revus: /points revus/.test(document.body.innerText), detail: (document.body.innerText.match(/Détail : [^\n]*/) ?? [''])[0] }));
  noter(r2.barrees === r2.total && r2.total >= 5 && r2.revus, etiquette(`les ${r2.total} points se règlent sur leur ligne (${r2.barrees} barrés, « points revus » ${r2.revus})`));
  noter(/86[.,’ ]?50[^\/]*\/[^\/]*86[.,’ ]?50/.test(r2.detail),etiquette(`le détail reste 86,50 / 86,50 (${r2.detail})`));
  const mout = await app.evaluate(() => /mouture → Maris Otter/.test(document.body.innerText) && /✓ 2[.,]40\/Kg/i.test(document.body.innerText));
  noter(mout, etiquette('la mouture rattachée dit « mouture → Maris Otter » et « ✓ 2,40/Kg »'));
  await app.evaluate(() => document.querySelector('[data-dp-ligne]')?.scrollIntoView({ block: 'start' }));
  await coteACote(nav, mode, '06-points-regles', app, maq);

  // ---- enregistrer : envoi, puis le reçu qui reste ; « Terminé »
  await app.evaluate(() => document.querySelector('[role="dialog"] footer button:last-child')?.click()); await dormir(500);
  const envoi = await app.evaluate(() => document.querySelector('footer')?.innerText.replace(/\n/g, ' '));
  noter(/Envoi au Drive/.test(envoi) && !/tu peux fermer/.test(envoi), etiquette(`pendant l’envoi : « ${envoi} »`));
  await clic(maq, '#r2b-go'); await dormir(600);
  await coteACote(nav, mode, '07-envoi', app, maq);
  await app.waitForFunction(() => /2026-04-27 Brau- und Rauchshop 372765\.jpg/.test(document.querySelector('footer')?.innerText ?? ''), { timeout: 15000 }).catch(() => {});
  const recu = await app.evaluate(() => ({ pied: document.querySelector('footer')?.innerText.replace(/\n/g, ' ') ?? '', termine: !![...document.querySelectorAll('footer button')].find((b) => b.textContent.includes('Terminé')), ouvert: !!document.querySelector('[role="dialog"]') }));
  noter(/2026-04-27 Brau- und Rauchshop 372765\.jpg/.test(recu.pied) && /Ouvrir dans Drive/.test(recu.pied) && /octets · taille vérifiée/.test(recu.pied) && recu.termine && recu.ouvert, etiquette(`le reçu reste affiché : ${recu.pied.slice(0, 150)}`));
  await dormir(2200);
  await coteACote(nav, mode, '08-recu', app, maq);
  noter(app.erreurs.length === 0, etiquette(`aucune erreur de console (${app.erreurs.join(' / ') || 'aucune'})`));
  noter(app.hors.length === 0, etiquette(`aucune requête hors localhost (${app.hors.join(' / ') || 'aucune'})`));
  await app.close(); await maq.close();

  // ---- les états 1, 2, 5, 6, 8, 9
  const attendu = {
    '1': [/Lecture et vérification…/, 'la lecture est en cours'], '2': [/Lecture vérifiée/, 'lue, sans point : « Lecture vérifiée »'], '5': [/Lecture impossible/, 'l’erreur de lecture est dite'],
    '6': [/Drive à connecter/, 'Drive pas connecté est dit'], '8': [/Même commande, autre numéro : 380001/, 'S8 : autre numéro, même commande'], '9': [/Hors ligne · brouillon gardé/, 'hors ligne est dit'],
  };
  for (const etat of Object.keys(attendu)) {
    const a = await ouvrir(nav, mode, 'app', etat), mq = await ouvrir(nav, mode, 'maquette', etat);
    if (etat === '2' && mode.l < 900) await clic(a, '[aria-label="Détails de la lecture"]');
    const t = await texte(a), mm = await mesures(a);
    noter(attendu[etat][0].test(t), etiquette(`état ${etat} : ${attendu[etat][1]}`));
    noter(mm.debordeX <= 1, etiquette(`état ${etat} : aucun débordement horizontal`));
    noter(etat === '1' || (mm.piedHaut !== null && mm.piedBas <= mm.vh + 1), etiquette(`état ${etat} : le pied est visible`));
    if (etat === '8') {
      await a.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Même achat · ne rien enregistrer')?.click()); await dormir(300);
      noter(await a.evaluate(() => /Fermer sans rien enregistrer/.test(document.querySelector('footer')?.innerText ?? '')), etiquette('état 8 : « Même achat » ne double pas, le pied le dit'));
    }
    await coteACote(nav, mode, `09-etat${etat}`, a, mq);
    noter(a.erreurs.length === 0 && a.hors.length === 0, etiquette(`état ${etat} : console propre, rien hors localhost`));
    await a.close(); await mq.close();
  }
}
// Chaque mode se rejoue (3 essais) si la page a été rechargée sous nos pieds : Vite recharge quand une autre voie écrit dans le dépôt.
const ESSAIS = process.env.SANS_RETRY ? 1 : 3;
const MODES_JOUES = MODES.filter((m) => !SEULEMENT || m.id === SEULEMENT);
for (const mode of MODES_JOUES) {
  for (let essai = 1; essai <= ESSAIS; essai++) {
    const n0 = infos.length, f0 = fautes.length, m0 = motsMesures.length;
    try { await jouerMode(mode); break; }
    catch (e) {
      infos.length = n0; fautes.length = f0; motsMesures.length = m0;
      if (essai === ESSAIS) noter(false, `${mode.id} · exception : ${String(e.stack ?? e).slice(0, 300)}`);
    }
  }
}
await nav.close();
console.log(infos.join('\n'));
console.log('MOTS ' + motsMesures.join(' ; '));
console.log(fautes.length ? `DEPENSE ECHEC ${fautes.length}\n  - ${fautes.join('\n  - ')}` : 'DEPENSE OK');
process.exitCode = fautes.length ? 1 : 0;
