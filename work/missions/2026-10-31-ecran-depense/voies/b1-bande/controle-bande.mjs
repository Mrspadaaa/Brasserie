#!/usr/bin/env node
// Voie b1-bande (D233), contrôle Chrome réel : la bande collante « ① Date · y aller » ne fait plus sautiller l'écran, et « y aller » va toujours quelque part.
// Banc : `?dev-local&depense=date` (apercuDev.ts, SIMULÉ : une facture de sept lignes, sans date, un seul point `date-absente`). Fixtures seulement.
// Usage (le serveur tourne dans le dossier de travail, jamais dans Documents/Brasserie) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5617 --strictPort" --port 5617 --env VITE_FIREBASE_API_KEY=fake \
//     -- node work/missions/2026-10-31-ecran-depense/voies/b1-bande/controle-bande.mjs [--sortie=<dossier>] [--mode=tactile390|souris390]
// B0 la chip Date est seule · B1 pas de saut · B2 pas de boucle · B3 « y aller » (bloc fermé, puis panneau Règlement ouvert avant) · B4 la chip ①
// B5 la date posée règle le point (la date du paiement suit : dite, pas exigée) · B6 aucune erreur, aucune requête sortante.
// Le focus est TOUJOURS dans la date de l'ACHAT (`[data-purchase-date]`), jamais dans la date du paiement ni l'échéance (`[data-purchase-payment]`).
// Sortie : « BANDE OK » (code 0) ou « BANDE ECHEC n » et la liste ; aucun arrêt au premier échec (M16).
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
  { id: 'souris390', l: 390, h: 844, tactile: false, echelle: 1 },
];
const SEULEMENT = valeur('mode');
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//; // l'index.html de l'app demande les polices : abortées, jamais envoyées, non comptées
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], infos = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 170)); infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };
const info = (texte) => { console.error('info ' + texte.slice(0, 170)); infos.push(`INFO  ${texte}`); };

async function ouvrir(nav, mode) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = []; p.hors = [];
  p.on('pageerror', (e) => p.erreurs.push('PAGE ' + e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT|favicon|Failed to load resource/.test(m.text())) p.erreurs.push(m.text().slice(0, 160)); });
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (local(r.url())) r.continue(); else { if (!POLICES.test(r.url())) p.hors.push(r.url().slice(0, 80)); r.abort('blockedbyclient'); } });
  p.setDefaultNavigationTimeout(150000);
  let ouvert = false;
  for (let essai = 1; essai <= 3 && !ouvert; essai++) {
    try {
      await p.goto(`${ADRESSE}/?dev-local&depense=date`, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
      await dormir(800);
      await p.click('[aria-label="Actions rapides"]');
      await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
      await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
      await p.waitForFunction(() => document.body.dataset.apercu === 'date', { timeout: 45000 });
      ouvert = true;
    } catch (e) {
      if (essai === 3) throw new Error(`l’écran ne s’est pas ouvert : ${String(e.message).slice(0, 100)} · erreurs ${p.erreurs.join(' / ')}`);
    }
  }
  await dormir(600);
  // Les aides de la page : le défilant, le repère (tuile Règlement, sous le bandeau), la bande, le haut du bandeau.
  await p.evaluate(() => {
    const sc = () => { let e = document.querySelector('[data-dp="bandeau"]'); while (e && !/(auto|scroll)/.test(getComputedStyle(e).overflowY)) e = e.parentElement; return e; };
    window.__b1 = {
      sc,
      bandeBas0: () => { const s = sc(); return document.querySelector('[data-dp="bandeau"]').getBoundingClientRect().bottom - s.getBoundingClientRect().top + s.scrollTop; },
      repere: () => { const s = sc(), r = document.querySelector('[data-dp="tuile-paye"]').getBoundingClientRect(); return r.top - s.getBoundingClientRect().top + s.scrollTop; },
      bande: () => !!document.querySelector('[data-dp="bande"]'),
    };
  });
  return p;
}

const poser = (p, haut) => p.evaluate((h) => { window.__b1.sc().scrollTo({ top: h, behavior: 'instant' }); }, haut);
/** Pose le défilement pour que le bas du bandeau soit à `rel` px sous le haut du défilant (négatif : le bandeau est sorti) ; `B0` mesuré à 0. */
const poserRel = (p, B0, rel) => poser(p, Math.max(0, B0 - rel));
const echantillonner = (p, ms) => p.evaluate((duree) => new Promise((fin) => {
  const sc = window.__b1.sc(), sorties = [], t0 = performance.now();
  const tick = () => {
    sorties.push({ bande: window.__b1.bande(), st: sc.scrollTop, rep: window.__b1.repere() });
    if (performance.now() - t0 < duree) requestAnimationFrame(tick); else fin(sorties);
  };
  requestAnimationFrame(tick);
}), ms);
const centre = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }, sel);
async function toucher(p, mode, sel, exigeDessus) {
  const c = await centre(p, sel);
  if (!c) throw new Error('introuvable ' + sel);
  const dessus = await p.evaluate((x, y, s) => { const e = document.elementFromPoint(x, y); const cible = document.querySelector(s); return !!e && !!cible && (cible === e || cible.contains(e)); }, c.x, c.y, sel);
  if (exigeDessus && !dessus) throw new Error(`${sel} est recouvert au point de toucher (${Math.round(c.x)},${Math.round(c.y)})`);
  if (mode.tactile) await p.touchscreen.tap(c.x, c.y); else await p.mouse.click(c.x, c.y);
  return c;
}
/** Où est le focus : dans l'achat, dans le paiement, ailleurs. */
const focus = (p) => p.evaluate(() => {
  const a = document.activeElement;
  return { achat: !!a?.closest('[data-purchase-date]'), paiement: !!a?.closest('[data-purchase-payment]'), type: a?.getAttribute?.('type') ?? a?.tagName, etiquette: (a?.getAttribute?.('aria-label') ?? a?.id ?? '').slice(0, 40) };
});
/** Attend (≤ 1,2 s) que le champ de la date de l'achat soit ouvert, focalisé et visible entre le bas de la bande et le bas du défilant. */
async function attendreLaDate(p) {
  const t0 = Date.now(); let dernier = null;
  while (Date.now() - t0 < 1200) {
    dernier = await p.evaluate(() => {
      const bloc = document.querySelector('[data-purchase-date]'), champ = bloc?.querySelector('input[type="date"]'), a = document.activeElement;
      const s = window.__b1.sc().getBoundingClientRect(), bande = document.querySelector('[data-dp="bande"]')?.getBoundingClientRect();
      const r = champ?.getBoundingClientRect();
      return { ouvert: !!bloc?.open, focusDansBloc: !!a && !!bloc?.contains(a), focusPaiement: !!a?.closest('[data-purchase-payment]'), focusChamp: a === champ,
        visible: !!r && r.top >= (bande ? bande.bottom : s.top) - 1 && r.bottom <= s.bottom + 1, haut: r ? Math.round(r.top) : null, bas: r ? Math.round(r.bottom) : null, bandeBas: bande ? Math.round(bande.bottom) : null, defilantBas: Math.round(s.bottom) };
    });
    if (dernier.ouvert && dernier.focusChamp && dernier.visible) break;
    await dormir(60);
  }
  return { ...dernier, ms: Date.now() - t0 };
}
const fermerLaDate = (p) => p.evaluate(() => { const b = document.querySelector('[data-purchase-date]'); b.open = false; if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });

async function jouerMode(nav, mode) {
  const e = (s) => `${mode.id} · ${s}`;
  const nomCapture = (n) => path.join(SORTIE, `${mode.id}-${n}.png`);

  // ---- S1 : le repos, B0, B1, B2 (une page neuve)
  let p = await ouvrir(nav, mode);
  const chips = await p.evaluate(() => [...document.querySelectorAll('[data-dp="chips"] [data-dp-chip]')].map((c) => c.getAttribute('aria-label')));
  noter(chips.length === 1 && /^1 Date$/.test(chips[0]), e(`B0 la chip « Date » est seule (${chips.join(' | ')})`));
  const long = await p.evaluate(() => { const s = window.__b1.sc(); return { defilable: s.scrollHeight - s.clientHeight, B0: window.__b1.bandeBas0() }; });
  noter(long.defilable > 400, e(`l’écran défile (${Math.round(long.defilable)} px de plus que la fenêtre)`));
  const B0 = long.B0;
  await poser(p, 0); await dormir(300);
  noter(!(await p.evaluate(() => window.__b1.bande())), e('au repos (défilement 0) la bande est cachée'));
  const rep0 = await p.evaluate(() => window.__b1.repere());

  // B1 : « juste avant » (bandeau encore à l'écran) et « juste après » (bandeau sorti, bande apparue) : le repère ne bouge pas.
  await poserRel(p, B0, 14); await dormir(500);
  const avant = { bande: await p.evaluate(() => window.__b1.bande()), rep: await p.evaluate(() => window.__b1.repere()) };
  await poserRel(p, B0, -14); await dormir(500);
  const apres = { bande: await p.evaluate(() => window.__b1.bande()), rep: await p.evaluate(() => window.__b1.repere()) };
  noter(!avant.bande && apres.bande, e(`B1 la bande apparaît quand le bandeau sort (avant ${avant.bande}, après ${apres.bande})`));
  noter(Math.abs(apres.rep - avant.rep) <= 1 && Math.abs(avant.rep - rep0) <= 1, e(`B1 le repère ne saute pas : repos ${rep0.toFixed(1)}, avant ${avant.rep.toFixed(1)}, après ${apres.rep.toFixed(1)} (écart ${(apres.rep - avant.rep).toFixed(1)} px)`));

  // B2 : chaque défilement de la zone frontière, 600 ms d'images : au plus une bascule, le repère immobile.
  let pires = { bascules: 0, mvt: 0, rel: null, stMvt: 0 }, tousSteps = 0;
  for (let rel = -60; rel <= 10; rel += 4) {
    await poser(p, 0); await dormir(160);
    await poserRel(p, B0, rel);
    const s = await echantillonner(p, 600);
    let bascules = 0; for (let i = 1; i < s.length; i++) if (s[i].bande !== s[i - 1].bande) bascules++;
    const reps = s.map((x) => x.rep), mvt = Math.max(...reps) - Math.min(...reps), sts = s.map((x) => x.st), stMvt = Math.max(...sts) - Math.min(...sts);
    tousSteps++;
    if (bascules > pires.bascules || mvt > pires.mvt) pires = { bascules: Math.max(bascules, pires.bascules), mvt: Math.max(mvt, pires.mvt), rel, stMvt: Math.max(stMvt, pires.stMvt) };
    if (bascules > 1 || mvt > 1) noter(false, e(`B2 rel ${rel} : ${bascules} bascules, repère ${mvt.toFixed(1)} px (${s.length} images, défilement bougé de ${stMvt.toFixed(1)} px)`));
  }
  if (pires.bascules <= 1 && pires.mvt <= 1) noter(true, e(`B2 pas de boucle sur ${tousSteps} positions : au plus ${pires.bascules} bascule, repère au plus ${pires.mvt.toFixed(2)} px`));
  noter(p.erreurs.length === 0, e(`B6 aucune erreur de page (${p.erreurs.join(' / ') || 'aucune'})`));
  noter(p.hors.length === 0, e(`B6 aucune requête hors localhost (${p.hors.join(' / ') || 'aucune'})`));
  await p.close();

  // ---- S2 : B3 « y aller » depuis la bande (bloc de la date fermé), vrai toucher / clic
  p = await ouvrir(nav, mode);
  const B0b = await p.evaluate(() => window.__b1.bandeBas0());
  await fermerLaDate(p); await dormir(200);
  const B0c = await p.evaluate(() => window.__b1.bandeBas0());
  await poserRel(p, B0c, -40); await dormir(500);
  noter(await p.evaluate(() => window.__b1.bande()), e('B3 la bande est visible avant le geste'));
  await p.screenshot({ path: nomCapture('1-bande-visible') });
  const texteBande = await p.evaluate(() => document.querySelector('[data-dp="bande"]')?.innerText.replace(/\n/g, ' | '));
  noter(/Date/.test(texteBande ?? '') && /y aller/.test(texteBande ?? ''), e(`B3 la bande dit « Date » et « y aller » (${texteBande})`));
  try {
    await toucher(p, mode, '[data-dp="bande"] button', true);
    const r = await attendreLaDate(p);
    noter(r.ouvert && r.focusChamp && r.visible && !r.focusPaiement, e(`B3 « y aller » ouvre la date de l’achat, focus dans son champ, visible (${JSON.stringify(r)})`));
    await p.screenshot({ path: nomCapture('2-apres-y-aller') });
  } catch (x) { noter(false, e(`B3 exception : ${String(x.message).slice(0, 120)}`)); }
  await p.close();

  // ---- S3 : B3 bis, le panneau Règlement ouvert avant (date du paiement vide) : le focus va dans la date de l'ACHAT, jamais dans celle du paiement
  p = await ouvrir(nav, mode);
  await p.evaluate(() => document.querySelector('[data-dp="tuile-paye"]').click()); await dormir(300);
  const panneau = await p.evaluate(() => { const d = document.querySelector('[data-purchase-payment]'); return { visible: !!d && d.getBoundingClientRect().height > 0 }; });
  noter(panneau.visible, e('B3 bis le panneau Règlement est ouvert avant le geste'));
  await fermerLaDate(p); await dormir(200);
  const B0d = await p.evaluate(() => window.__b1.bandeBas0());
  await poserRel(p, B0d, -40); await dormir(500);
  try {
    await toucher(p, mode, '[data-dp="bande"] button', true);
    const r = await attendreLaDate(p);
    const f = await focus(p);
    noter(r.ouvert && r.focusChamp && r.visible && !r.focusPaiement && f.achat && !f.paiement, e(`B3 bis « y aller », panneau Règlement ouvert : focus dans la date de l’achat, pas dans le paiement (${JSON.stringify({ ...r, f })})`));
    await p.screenshot({ path: nomCapture('3-panneau-ouvert-apres-y-aller') });
  } catch (x) { noter(false, e(`B3 bis exception : ${String(x.message).slice(0, 120)}`)); }
  await p.close();

  // ---- S4 : B4 la chip ①, puis B5 la date posée règle le point
  p = await ouvrir(nav, mode);
  await fermerLaDate(p); await dormir(200);
  await poser(p, 0); await dormir(300);
  try {
    await toucher(p, mode, '[data-dp="chips"] [data-dp-chip="Date|"]', true);
    const r = await attendreLaDate(p);
    const f = await focus(p);
    noter(r.ouvert && r.focusChamp && r.visible && f.achat && !f.paiement, e(`B4 la chip ① ouvre la date de l’achat et y met le focus (${JSON.stringify({ ...r, f })})`));
  } catch (x) { noter(false, e(`B4 exception : ${String(x.message).slice(0, 120)}`)); }
  // B5 : « Aujourd'hui » du bloc
  try {
    const sel = '[data-purchase-date] [aria-pressed]';
    await p.evaluate(() => { const b = [...document.querySelectorAll('[data-purchase-date] button')].find((x) => /^Aujourd/.test(x.textContent)); b.setAttribute('data-b1-auj', '1'); b.scrollIntoView({ block: 'center', behavior: 'instant' }); });
    await dormir(300);
    await toucher(p, mode, '[data-b1-auj]', true);
    await dormir(500);
    const apresDate = await p.evaluate(() => {
      const chip = document.querySelector('[data-dp="chips"] [data-dp-chip="Date|"]');
      const jour = new Date(), jj = String(jour.getDate()).padStart(2, '0'), mm = String(jour.getMonth() + 1).padStart(2, '0');
      return { label: chip?.getAttribute('aria-label') ?? null, regle: /réglé/.test(chip?.getAttribute('aria-label') ?? ''), barre: chip ? /line-through/.test(chip.className) : false, revus: /points revus/.test(document.body.innerText),
        paye: document.querySelector('[data-dp="tuile-paye"]')?.innerText.replace(/\n/g, ' ') ?? '', aujourdhui: `${jj}.${mm}.${jour.getFullYear()}` };
    });
    noter(apresDate.regle && apresDate.barre, e(`B5 la date posée barre la chip (aria-label « ${apresDate.label} »)`));
    const suit = apresDate.paye.includes(apresDate.aujourdhui);
    info(`${mode.id} · B5 la date du paiement ${suit ? 'SUIT' : 'NE SUIT PAS'} la date de l’achat posée (tuile Règlement : « ${apresDate.paye} », attendu ${apresDate.aujourdhui})`);
    noter(suit && /Payé le/.test(apresDate.paye), e(`B7 une date de l’achat posée : la tuile Règlement dit « Payé le <cette date> » (${apresDate.paye})`));
    await poserRel(p, await p.evaluate(() => window.__b1.bandeBas0()), -40); await dormir(500);
    const bandeApres = await p.evaluate(() => { const b = document.querySelector('[data-dp="bande"]'); return b ? { texte: b.innerText.replace(/\n/g, ' | '), aller: !!b.querySelector('button') } : null; });
    noter(bandeApres === null ? false : !bandeApres.aller && /points revus/.test(bandeApres.texte), e(`B5 la bande ne propose plus « y aller » pour Date (${bandeApres ? bandeApres.texte : 'bande absente'})`));
    await p.screenshot({ path: nomCapture('4-date-posee-bande') });
  } catch (x) { noter(false, e(`B5 exception : ${String(x.message).slice(0, 120)}`)); }
  noter(p.erreurs.length === 0, e(`B6 aucune erreur de page (${p.erreurs.join(' / ') || 'aucune'})`));
  noter(p.hors.length === 0, e(`B6 aucune requête hors localhost (${p.hors.join(' / ') || 'aucune'})`));
  await p.close();

  // ---- S5 : B7 une seule date visible par défaut ; « Autre date » fait apparaître la date du paiement
  p = await ouvrir(nav, mode);
  try {
    await toucher(p, mode, '[data-dp="tuile-paye"]', false); await dormir(400);
    const etatPanneau = await p.evaluate(() => {
      const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
      const dates = [...document.querySelectorAll('[role="dialog"] input[type="date"]')].filter(visible);
      const panneau = document.querySelector('[data-purchase-payment]');
      return { total: dates.length, dansAchat: dates.filter((d) => d.closest('[data-purchase-date]')).length, dansPaiement: dates.filter((d) => d.closest('[data-purchase-payment]')).length, panneau: !!panneau && visible(panneau),
        texte: panneau?.innerText.replace(/\n/g, ' | ').slice(0, 160) ?? '', moyen: !!panneau?.querySelector('select') && visible(panneau.querySelector('select')) };
    });
    noter(etatPanneau.panneau && etatPanneau.total === 1 && etatPanneau.dansAchat === 1 && etatPanneau.dansPaiement === 0, e(`B7 « Déjà payé » : un seul champ de date visible, celui de l’achat (${JSON.stringify(etatPanneau)})`));
    noter(etatPanneau.moyen, e('B7 le moyen de paiement reste atteignable'));
    await p.screenshot({ path: nomCapture('5-paiement-une-seule-date') });
    await p.evaluate(() => document.querySelector('[data-dp="paye-suit"] button')?.setAttribute('data-b1-autre', '1'));
    await toucher(p, mode, '[data-b1-autre]', true); await dormir(400);
    const apres = await p.evaluate(() => { const i = document.querySelector('[data-purchase-payment] input[type="date"]'); return { la: !!i, visible: !!i && i.getBoundingClientRect().height > 0 }; });
    noter(apres.la && apres.visible, e(`B7 « Autre date » fait apparaître la date du paiement (${JSON.stringify(apres)})`));
  } catch (x) { noter(false, e(`B7 exception : ${String(x.message).slice(0, 120)}`)); }
  await p.close();
}

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000 });
const ESSAIS = process.env.SANS_RETRY ? 1 : 3; // Vite recharge la page quand une autre voie écrit dans le dépôt : un mode se rejoue
for (const mode of MODES.filter((m) => !SEULEMENT || m.id === SEULEMENT)) {
  for (let essai = 1; essai <= ESSAIS; essai++) {
    const n0 = infos.length, f0 = fautes.length;
    try { await jouerMode(nav, mode); break; }
    catch (x) {
      infos.length = n0; fautes.length = f0;
      if (essai === ESSAIS) noter(false, `${mode.id} · exception : ${String(x.stack ?? x).slice(0, 300)}`);
    }
  }
}
await nav.close();
console.log(infos.join('\n'));
console.log(fautes.length ? `BANDE ECHEC ${fautes.length}\n  - ${fautes.join('\n  - ')}` : 'BANDE OK');
process.exitCode = fautes.length ? 1 : 0;
