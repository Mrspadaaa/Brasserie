#!/usr/bin/env node
// Voie s6-fiche, G7 : l'écran « Nouvelle dépense » servi propose et écrit le bon article pour trois lignes, à 390 (tactile) et à 1280.
//   - Target 11.3% face à « Target » (α 11,8)        → « Créer « Target bis » »
//   - Cascade CH face à « Cascade US »                → « Créer « Cascade CH » », fiche Cascade US « approchée »
//   - Sabro® 13.4% (produit inconnu du stock)         → le menu « Créer un nouvel article » donne « Sabro »
//   - Münchner Malz 15 EBC face à colorEbc 20         → « Créer « Münchner Malz bis » » (jouée en plus : l'EBC)
// Fixtures seulement : `?dev-local&depense=s6` (apercuDev.ts, SIMULÉ ; la lecture est la sortie du vrai rapprochement, tests/unit/depense/fiche/fixture-s6.test.ts).
// « L'article écrit » est celui de `articlesNeufsDe`, la fonction même de `savePurchase`, exposé sur `window.__s6Banc` avec le stock existant avant et après.
// Usage (le serveur tourne dans le dossier de travail, jamais dans Documents/Brasserie) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5617 --strictPort" --port 5617 --env VITE_FIREBASE_API_KEY=fake \
//     -- node work/missions/2026-10-31-ecran-depense/voies/s6-fiche/capturer-s6.mjs --sortie=<dossier>
// Sortie : « S6 OK » (code 0) ou « S6 ECHEC n » et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: 'pc1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];
const SEULEMENT = valeur('mode');
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
// L'index.html de l'app demande les polices Google : la requête est ABORTÉE ici, elle ne part jamais ; elle n'est pas comptée comme sortante.
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], infos = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 170)); infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };

async function ouvrir(nav, mode) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = []; p.hors = [];
  p.on('pageerror', (e) => p.erreurs.push('PAGE ' + e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT|favicon|Failed to load resource/.test(m.text())) p.erreurs.push(m.text().slice(0, 160)); });
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (local(r.url())) r.continue(); else { if (!POLICES.test(r.url())) p.hors.push(r.url().slice(0, 80)); r.abort('blockedbyclient'); } });
  p.setDefaultNavigationTimeout(150000);
  // Vite recharge la page quand il découvre des dépendances (1re ouverture) : jusqu'à trois essais.
  for (let essai = 1; essai <= 3; essai++) {
    try {
      await p.goto(`${ADRESSE}/?dev-local&depense=s6`, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
      await dormir(800);
      await p.click('[aria-label="Actions rapides"]');
      await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
      await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
      await p.waitForFunction((e) => document.body.dataset.apercu === e, { timeout: 45000 }, 's6');
      await p.waitForFunction(() => document.querySelectorAll('[data-purchase-line]').length >= 4, { timeout: 45000 });
      break;
    } catch (e) {
      if (essai === 3) { await p.screenshot({ path: path.join(SORTIE, `echec-ouverture-${mode.id}.png`) }); throw new Error(`l’écran ne s’est pas ouvert : ${String(e.message).slice(0, 100)} · erreurs ${p.erreurs.join(' / ')}`); }
    }
  }
  await dormir(500);
  return p;
}
const boutons = (p) => p.evaluate(() => [...document.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim()));
const cliquerBouton = (p, nom) => p.evaluate((n) => { const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') ?? x.textContent ?? '').trim() === n); if (!b) throw new Error('bouton introuvable : ' + n); b.scrollIntoView({ block: 'center' }); b.click(); }, nom).then(() => dormir(350));
const pastille = (p, ligne) => p.evaluate((n) => document.querySelectorAll('[data-purchase-line]')[n - 1]?.querySelector('[data-dp-pastille]')?.textContent?.trim() ?? null, ligne);
const mesures = (p) => p.evaluate(() => {
  const d = document.querySelector('[role="dialog"]'), pied = d?.querySelector('footer')?.getBoundingClientRect();
  return { debordeX: Math.max(document.documentElement.scrollWidth - innerWidth, (d?.scrollWidth ?? 0) - (d?.clientWidth ?? 0)), piedBas: pied ? Math.round(pied.bottom) : null, piedHaut: pied ? Math.round(pied.top) : null, vh: innerHeight };
});
async function coupe(p, fichier, ligne) {
  // La capture est cadrée sur la ligne demandée (elle défile au centre), sans changer l'état.
  await p.evaluate((n) => document.querySelectorAll('[data-purchase-line]')[n - 1]?.scrollIntoView({ block: 'center' }), ligne);
  await dormir(250);
  await p.screenshot({ path: path.join(SORTIE, fichier) });
}

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000 });
const ATTENDU = { target: 'Créer « Target bis »', cascade: 'Créer « Cascade CH »', munchner: 'Créer « Münchner Malz bis »' };
async function jouerMode(mode) {
  const e = (s) => `${mode.id} · ${s}`;
  const p = await ouvrir(nav, mode);
  // ---- au repos : les noms proposés sont ceux de la table
  const noms = await boutons(p);
  for (const [cle, nom] of Object.entries(ATTENDU)) noter(noms.includes(nom), e(`le bouton « ${nom} » est proposé (${cle})`));
  noter(noms.filter((n) => n === 'Choisir un autre article').length === 3, e('le ⇄ de r2b, « Choisir un autre article », est posé sur les trois lignes (tri n° 14)'));
  noter(!noms.some((n) => /^Créer « (Target 11\.3%|Cascade CH 8%)/.test(n)), e('aucun bouton ne propose le libellé brut'));
  const m0 = await mesures(p);
  noter(m0.debordeX <= 1, e(`aucun débordement horizontal au repos (${m0.debordeX} px)`));
  noter(m0.piedHaut !== null && m0.piedBas <= m0.vh + 1, e(`le pied est visible au repos (${m0.piedHaut}–${m0.piedBas} sur ${m0.vh})`));
  await coupe(p, `${mode.id}-01-repos.png`, 1);
  noter(noms.includes('Créer « Sabro »'), e('Sabro (aucun article voisin) a son bouton « Créer « Sabro » » sur la ligne, sans ⇄ (tri n° 9)'));
  const valeurs = await p.evaluate(() => [...document.querySelectorAll('[data-purchase-line]')].slice(0, 4).map((l) => l.textContent));
  noter(/α.*11,3/.test(valeurs[0]) && /Target α 11,8/.test(valeurs[0]), e(`Target : « 40 g · α 11,3 » et l’article grisé « Target α 11,8 » (tri n° 5)`));
  noter(/15.*EBC/.test(valeurs[2]) && /Münchner Malz 20 EBC/.test(valeurs[2]), e('Münchner : « 15 EBC » lu et l’article grisé « Münchner Malz 20 EBC »'));
  noter(!/α/.test(valeurs[1]) && /Cascade US/.test(valeurs[1]), e('Cascade CH : aucune α inventée, l’article grisé « Cascade US »'));
  const court = await p.evaluate(() => [...document.querySelectorAll('[data-dp-creer] button')].map((b) => b.textContent));
  noter(JSON.stringify(court.slice(0, 6)) === JSON.stringify(['Target bis', 'Créer CH', 'Münchner Malz bis', '⇄', '⇄', '⇄']) || (court.includes('Target bis') && court.includes('Créer CH') && court.includes('Münchner Malz bis')), e(`boutons courts comme r2b : ${court.join(' | ')}`));
  const seul = await p.evaluate(() => [...document.querySelectorAll('[data-dp-creer]')].every((g) => { const bs = [...g.querySelectorAll('button')]; return bs.length < 2 || bs[1].getBoundingClientRect().top < bs[0].getBoundingClientRect().bottom; }));
  noter(seul, e('le ⇄ n’est jamais seul sous son bouton (même ligne visuelle)'));
  // ---- Les gestes un à un (tri n° 10) : un seul « Créer » à côté de lignes encore proposées, puis ⇄ sur Cascade
  await cliquerBouton(p, ATTENDU.target);
  const encore = await boutons(p);
  noter(encore.includes(ATTENDU.cascade) && encore.includes(ATTENDU.munchner) && !encore.includes(ATTENDU.target), e('une ligne créée à côté de deux lignes encore proposées'));
  await coupe(p, `${mode.id}-02a-un-creer-seul.png`, 2);
  // ⇄ (r2b : « Choisir un autre article ») ouvre le plateau de la ligne sur le choix de l'article, sans relier d'un toucher ; l'article se choisit dans le plateau.
  await p.evaluate(() => document.querySelectorAll('[data-purchase-line]')[1].querySelector('[data-dp-creer] button[aria-label="Choisir un autre article"]').click());
  await dormir(700);
  const apresFleche = await p.evaluate(() => { const l = document.querySelectorAll('[data-purchase-line]')[1]; return { ouvert: l.querySelector('details').open, pastille: l.querySelector('[data-dp-pastille]')?.textContent ?? null, champ: Boolean(l.querySelector('[aria-label="Article"]')), sousBande: (() => { const b = document.querySelector('[data-dp="bande"]'); return b ? l.getBoundingClientRect().top < b.getBoundingClientRect().bottom - 1 : false; })() }; });
  noter(apresFleche.ouvert && apresFleche.champ && apresFleche.pastille === 'article ?', e('⇄ ouvre le plateau sur le choix de l’article ; rien n’est relié d’un toucher (pastille « ' + apresFleche.pastille + ' »)'));
  noter(!apresFleche.sousBande, e('la ligne ouverte ne finit pas sous la bande collante (scroll-margin-top, tri n° 15)'));
  await coupe(p, `${mode.id}-02b0-fleche-plateau.png`, 2);
  await p.evaluate(() => document.querySelectorAll('[data-purchase-line]')[1].querySelector('[aria-label="Article"]').scrollIntoView({ block: 'center' }));
  await p.evaluate(() => document.querySelectorAll('[data-purchase-line]')[1].querySelector('[aria-label="Article"]').focus());
  await p.keyboard.type('Cascade US');
  await dormir(500);
  await p.evaluate(() => { const o = [...document.querySelectorAll('[role="option"]')].find((x) => /Cascade US/.test(x.textContent ?? '')); if (!o) throw new Error('option Cascade US introuvable'); o.click(); });
  await dormir(500);
  const relie = await pastille(p, 2);
  noter(relie === '+30 g', e(`Cascade US choisi dans le plateau : reliée, pastille « ${relie} »`));
  await coupe(p, `${mode.id}-02b-relie-cascade.png`, 2);
  await p.evaluate(() => document.querySelector('[role="switch"][aria-label="Mettre en stock, ligne 2"]')?.click());
  await dormir(400);
  // ---- Créer les autres : le nom, la fiche et sa marque se voient
  for (const nom of [ATTENDU.cascade, ATTENDU.munchner, 'Créer « Sabro »']) await cliquerBouton(p, nom);
  await p.waitForFunction(() => [...document.querySelectorAll('[data-purchase-line]')].some((l) => /fiche Cascade US · approchée/.test(l.querySelector('[data-dp-pastille]')?.textContent ?? '')), { timeout: 30000 }).catch(() => undefined);
  const pastilles = [await pastille(p, 1), await pastille(p, 2), await pastille(p, 3)];
  noter(/^fiche Target UK$/.test(pastilles[0] ?? ''), e(`Target : « ${pastilles[0]} » (fiche exacte, pas de marque)`));
  noter(/^fiche Cascade US · approchée$/.test(pastilles[1] ?? ''), e(`Cascade CH : « ${pastilles[1]} »`));
  noter(/^fiche Münchner Malz$/.test(pastilles[2] ?? ''), e(`Münchner : « ${pastilles[2]} »`));
  // Sabro : produit inconnu du stock, créé par son bouton « Créer « Sabro » » (tri n° 9)
  await dormir(500);
  const nomSabro = await p.evaluate(() => document.querySelector('[aria-label="Nom de l’article, ligne 4"]')?.value ?? null);
  noter(nomSabro === 'Sabro', e(`Sabro : le menu « Créer un nouvel article » propose « ${nomSabro} » (le libellé brut est « Sabro® 13.4% »)`));
  const noms3 = await p.evaluate(() => [1, 2, 3, 4].map((n) => document.querySelector(`[aria-label="Nom de l’article, ligne ${n}"]`)?.value ?? null));
  noter(JSON.stringify(noms3) === JSON.stringify(['Target bis', 'Cascade CH', 'Münchner Malz bis', 'Sabro']), e(`les quatre champs « Nom de l’article » : ${noms3.join(' | ')}`));
  // Un nom tapé déjà pris (celui d'un article du stock) : dit à l'écran ; vidé, le champ rend la main au nom proposé.
  const champ = '[aria-label="Nom de l’article, ligne 1"]';
  await p.evaluate(() => { const d = document.querySelectorAll('[data-purchase-line]')[0]?.querySelector('details'); if (d && !d.open) d.querySelector('summary').click(); });
  await dormir(400);
  await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), champ);
  await dormir(250);
  await p.click(champ); await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
  await p.keyboard.type('Cascade US');
  await dormir(400);
  const alerte = await p.evaluate(() => document.querySelectorAll('[data-purchase-line]')[0]?.querySelector('[role="alert"]')?.textContent ?? null);
  noter(/Un article porte déjà ce nom/.test(alerte ?? ''), e(`un nom tapé déjà pris est dit : « ${alerte} »`));
  const tape = await p.evaluate((s) => document.querySelector(s)?.value, champ);
  noter(tape === 'Cascade US', e(`le nom tapé est gardé tel quel (« ${tape} »)`));
  await coupe(p, `${mode.id}-02c-nom-pris.png`, 1);
  await p.click(champ); await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  await p.waitForFunction((s) => document.querySelector(s)?.value === 'Target bis', { timeout: 5000 }, champ).catch(() => undefined);
  const rendu = await p.evaluate((s) => document.querySelector(s)?.value, champ);
  noter(rendu === 'Target bis', e(`vidé, le champ rend la main au nom proposé (« ${rendu} »)`));
  const m1 = await mesures(p);
  noter(m1.debordeX <= 1, e(`aucun débordement horizontal après « Créer » (${m1.debordeX} px)`));
  noter(m1.piedHaut !== null && m1.piedBas <= m1.vh + 1, e(`le pied reste visible après « Créer » (${m1.piedHaut}–${m1.piedBas} sur ${m1.vh})`));
  await coupe(p, `${mode.id}-02-creer-cascade.png`, 2);
  await coupe(p, `${mode.id}-03-creer-target.png`, 1);
  await coupe(p, `${mode.id}-04-creer-sabro.png`, 4);
  // Le plateau de la ligne Cascade CH, ouvert au toucher : le champ « Nom de l’article » et la phrase de la fiche.
  await p.evaluate(() => { const d = document.querySelectorAll('[data-purchase-line]')[1]?.querySelector('details'); if (d && !d.open) d.querySelector('summary').click(); });
  await dormir(400);
  const phrase = await p.evaluate(() => document.querySelectorAll('[data-purchase-line]')[1]?.querySelector('[data-dp-fiche]')?.textContent ?? null);
  noter(phrase === 'fiche Cascade US · approchée (pas exactement la bonne)', e(`le plateau de Cascade CH dit « ${phrase} »`));
  const m2 = await mesures(p);
  noter(m2.debordeX <= 1, e(`aucun débordement horizontal, plateau ouvert (${m2.debordeX} px)`));
  await coupe(p, `${mode.id}-06-plateau-cascade.png`, 2);
  // ---- Enregistrer : l'article écrit porte son nom, son α et sa fiche ; l'article existant est inchangé
  const confirmer = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Confirmer et enregistrer/.test(x.getAttribute('aria-label') ?? x.textContent ?? '')); b?.scrollIntoView({ block: 'center' }); return Boolean(b) && !b.disabled; });
  noter(confirmer, e('« Confirmer et enregistrer » est actif'));
  await cliquerBouton(p, 'Confirmer et enregistrer');
  await p.waitForFunction(() => window.__s6Banc, { timeout: 20000 }).catch(() => undefined);
  const banc = await p.evaluate(() => window.__s6Banc ?? null);
  noter(Boolean(banc), e('le banc a reçu la saisie (articles écrits exposés)'));
  if (banc) {
    const par = Object.fromEntries(banc.ecrits.map((x) => [x.item.name, x.item]));
    noter(JSON.stringify(banc.ecrits.map((x) => x.item.name)) === JSON.stringify(['Target bis', 'Cascade CH', 'Münchner Malz bis', 'Sabro']), e(`noms écrits : ${banc.ecrits.map((x) => x.item.name).join(' | ')}`));
    noter(par['Target bis']?.alphaPct === 11.3 && par['Target bis']?.fiche?.id === 'beermaverick-target' && par['Target bis']?.fiche?.approchee === false, e(`Target bis : α ${par['Target bis']?.alphaPct}, fiche ${JSON.stringify(par['Target bis']?.fiche)}`));
    noter(par['Cascade CH']?.origin === 'CH' && par['Cascade CH']?.alphaPct === undefined && par['Cascade CH']?.fiche?.id === 'beermaverick-cascade' && par['Cascade CH']?.fiche?.approchee === true, e(`Cascade CH : origine ${par['Cascade CH']?.origin}, pas d’α inventée, fiche ${JSON.stringify(par['Cascade CH']?.fiche)}`));
    noter(par['Münchner Malz bis']?.colorEbc === 15 && par['Münchner Malz bis']?.fiche?.id === 'munich-malt', e(`Münchner Malz bis : EBC ${par['Münchner Malz bis']?.colorEbc}, fiche ${JSON.stringify(par['Münchner Malz bis']?.fiche)}`));
    noter(par.Sabro?.alphaPct === 13.4 && par.Sabro?.name === 'Sabro' && typeof par.Sabro?.fiche?.id === 'string', e(`Sabro : α ${par.Sabro?.alphaPct}, fiche ${JSON.stringify(par.Sabro?.fiche)}`));
    noter(banc.ecrits.every((x) => x.item.unit && x.item.currentStock > 0 && x.item.ref.startsWith('MP-')), e('quantité, unité et référence de chaque article écrit sont ceux de la ligne'));
    noter(JSON.stringify(banc.existantsAvant) === JSON.stringify(banc.existantsApres), e('les trois articles existants (Target, Cascade US, Münchner Malz) sont identiques avant et après'));
    noter(banc.lignes.filter((l) => l.stockAction === 'new').length === 4 && banc.lignes.every((l) => l.articleName === undefined), e('aucun nom n’est gardé dans le brouillon tant que le brasseur n’en a pas tapé un'));
  }
  noter(p.erreurs.length === 0, e(`aucune erreur de console (${p.erreurs.join(' / ') || 'aucune'})`));
  noter(p.hors.length === 0, e(`aucune requête hors localhost (${p.hors.join(' / ') || 'aucune'})`));
  await p.screenshot({ path: path.join(SORTIE, `${mode.id}-05-enregistre.png`) });
  await p.close();
}
// Chaque mode se rejoue (3 essais) si la page a été rechargée sous nos pieds : Vite recharge quand une autre voie écrit dans le dépôt.
const ESSAIS = process.env.SANS_RETRY ? 1 : 3;
for (const mode of MODES.filter((m) => !SEULEMENT || m.id === SEULEMENT)) {
  for (let essai = 1; essai <= ESSAIS; essai++) {
    const n0 = infos.length, f0 = fautes.length;
    try { await jouerMode(mode); break; }
    catch (err) {
      infos.length = n0; fautes.length = f0;
      if (essai === ESSAIS) noter(false, `${mode.id} · exception : ${String(err.stack ?? err).slice(0, 300)}`);
    }
  }
}
await nav.close();
// S6 OK seulement si les captures des gestes existent (tri n° 10) : un seul « Créer », ⇄ sur Cascade, un nom tapé refusé.
for (const mode of MODES.filter((m) => !SEULEMENT || m.id === SEULEMENT)) {
  for (const f of ['02a-un-creer-seul', '02b0-fleche-plateau', '02b-relie-cascade', '02c-nom-pris', '06-plateau-cascade']) noter(fs.existsSync(path.join(SORTIE, `${mode.id}-${f}.png`)), `${mode.id} · la capture ${f} existe`);
}
console.log(infos.join('\n'));
console.log(fautes.length ? `S6 ECHEC ${fautes.length}\n  - ${fautes.join('\n  - ')}` : 'S6 OK');
process.exitCode = fautes.length ? 1 : 0;
