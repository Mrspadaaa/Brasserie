// c80 (tour 80, reel-80) : la MISE EN PAGE du Carnet se juge dans un VRAI navigateur (jsdom ne mesure rien), à 390 × 844, sur les VRAIS documents des fixtures
//   (tests/fixtures/c78 Chambre froide, c79 les ZZ, c75 Houblons citra et Embouteillage ; c80 : un seul document RECONSTRUIT, marqué tel).
//   R113 (R75-3, B) : le tableau de Chambre froide : aucun mot coupé au milieu (comparaison des mots du texte et des lignes rendues, Range.getClientRects) ;
//                     le nom sur 2 lignes au plus (ellipse au-delà), chaque cellule du tableau sur 2 lignes au plus.
//   R114 (EXA-1, B) : le ⋯ d'une bulle ouvre sa feuille ENTIÈRE dans la zone visible (sous l'en-tête de l'app, au-dessus du champ) : chaque entrée a sa boîte visible
//                     et touchable (elementFromPoint au centre = l'entrée). 6 carnets, 3 bulles (première, milieu, dernière), 3 positions de défilement.
//   R115            : les autres constats de mise en page de reel-80 (R80-1 à R80-4, R77-6, R75-6, R75-8) et les R73 de mise en page rouverts (R73-8, R73-10, R73-14), une mesure chacun.
// Sortie : « MISE-EN-PAGE OK … » ou « MISE-EN-PAGE KO <mesures> » (code 1 ; code 2 si le banc ne démarre pas).
// Banc : voies/c80-tests/banc (CarnetsVue réel dans le décor de l'écran Matériel : en-tête collé, rangée Matériel · Carnets, barre du bas ; données simulées, IA simulée, rien d'écrit).
// Serveur : celui de dev de Vite (config sans vite-plugin-pwa), lancé ici s'il ne répond pas, arrêté à la fin. Chrome de débug 127.0.0.1:9222 : un onglet à soi,
//   `page.close()` puis `browser.disconnect()` ; JAMAIS `browser.close()`.
// Usage : node scripts/controle-mise-en-page-carnet.mjs [--captures <dossier>] [--seulement R113,R114,R115]
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const DOSSIER_BANC = 'work/missions/2026-11-23-reprise-soir/voies/c80-tests/banc';
const PORT = 3080;
const URL_BANC = `http://localhost:${PORT}/${DOSSIER_BANC}/index.html?dev-local=1`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arg = (nom) => (process.argv.indexOf(nom) > 0 ? process.argv[process.argv.indexOf(nom) + 1] : null);
const capturesDe = arg('--captures');
const seulement = (arg('--seulement') ?? 'R113,R114,R115').split(',');

const CHAMBRE = 'CARNET-c78-03';
const EMBOUTEILLAGE = 'CARNET-c75-04';
/** Les 6 carnets d'exemple (vrais documents c79) dont la feuille ⋯ est jouée, reel-80 : « 6 carnets sur 6 ». Pas les Résolu (pompe, malt) : leur fil replié n'ouvre pas de feuille au banc. */
const CARNETS_BULLES = ['CARNET-c79-09', 'CARNET-c79-03', 'CARNET-c79-10', 'CARNET-c79-08', 'CARNET-c79-04', 'CARNET-c79-13'];

/** Tous les carnets des fixtures (id lu dans le fichier) : la règle « pas de jour sans bulle » se joue sur chacun. */
function tousLesCarnets() {
  const ids = [];
  for (const d of ['c75', 'c78', 'c79', 'c80']) {
    const dir = path.join(RACINE, 'tests/fixtures', d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      try { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (j?.carnet?.id && Array.isArray(j.messages)) ids.push(j.carnet.id); } catch { /* fichier d'un autre genre */ }
    }
  }
  return ids;
}

async function repond() { try { return (await fetch(`http://localhost:${PORT}/${DOSSIER_BANC}/index.html`)).ok; } catch { return false; } }
let serveur = null;
async function demarrerServeur() {
  if (await repond()) return;
  serveur = spawn('npx', ['vite', '--config', `${DOSSIER_BANC}/vite.banc.config.mjs`], { cwd: RACINE, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 120; i += 1) { if (await repond()) return; await sleep(1000); }
  throw new Error(`le serveur de dev ne répond pas sur ${PORT}`);
}
function arreterServeur() {
  if (!serveur) return;
  /* synchrone : le script sort aussitôt après, un taskkill asynchrone serait perdu */
  try { if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(serveur.pid), '/T', '/F'], { stdio: 'ignore' }); else serveur.kill(); } catch { /* déjà arrêté */ }
}

/* ------------------------------------------------------------------------------------------------ mesures dans la page (rien n'est supposé : des boîtes et des lignes lues) */

/** Mots coupés et lignes d'un bloc : chaque mot (suite de signes sans espace ni trait d'union) est un Range ; ses rectangles par ligne disent s'il est coupé.
 *  Les lignes masquées par une ellipse (`-webkit-line-clamp`) ne comptent pas : l'ellipse est la coupe voulue. */
function mesurerTexte(selRacine, motifBloc) {
  const seulementSi = motifBloc ? new RegExp(motifBloc, 'i') : null;
  const racines = [...document.querySelectorAll(selRacine)];
  const grappes = (tops) => { const t = [...tops].sort((a, b) => a - b); const g = []; for (const v of t) if (!g.length || v - g[g.length - 1] > 4) g.push(v); return g; };
  const coupe = (el) => { let e = el; while (e && e !== document.body) { const c = getComputedStyle(e); if (c.webkitLineClamp && c.webkitLineClamp !== 'none') return { el: e, lignes: Number(c.webkitLineClamp) }; e = e.parentElement; } return null; };
  const visibles = (rects, el) => { const c = coupe(el); if (!c) return rects; const b = c.el.getBoundingClientRect().bottom; return rects.filter((x) => x.top < b - 2); };
  const coupes = []; const lignesTrop = []; let mots = 0; let blocs = 0;
  const r = document.createRange();
  for (const racine of racines) {
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    const feuilles = new Set();
    while (w.nextNode()) {
      const n = w.currentNode; const parent = n.parentElement;
      if (!parent || !n.nodeValue.trim() || !parent.getClientRects().length || getComputedStyle(parent).visibility === 'hidden') continue;
      feuilles.add(parent);
      const re = /[^\s   -]+-?/g; let m;
      while ((m = re.exec(n.nodeValue))) {
        if (m[0].length < 2) continue;
        r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const rects = visibles([...r.getClientRects()].filter((x) => x.width > 0.5), parent);
        mots += 1;
        if (grappes(rects.map((x) => x.top)).length > 1) coupes.push(`${m[0]}`);
      }
    }
    for (const el of feuilles) {
      const directs = [...el.childNodes].filter((c) => c.nodeType === 3 && c.nodeValue.trim());
      if (!directs.length) continue;
      if (seulementSi && (!seulementSi.test(el.textContent) || el.children.length)) continue;
      r.selectNodeContents(el);
      const toutes = [...r.getClientRects()].filter((x) => x.width > 0.5);
      const g = grappes(toutes.map((x) => x.top)).length;
      const v = grappes(visibles(toutes, el).map((x) => x.top)).length;
      blocs += 1;
      const clamp = coupe(el);
      if (v > 2 || (g > v && !clamp)) lignesTrop.push(`« ${el.textContent.replace(/\s+/g, ' ').trim().slice(0, 36)} » ${g} lignes${clamp ? ' (ellipse)' : ''}`);
    }
  }
  return { coupes, lignesTrop, mots, blocs };
}

/** La feuille ⋯ ouverte : chaque entrée doit être dans la zone visible (sous l'en-tête de l'app : en-tête collé ET rangée Matériel · Carnets ; au-dessus du champ du bas
 *  et de la barre) et touchable (elementFromPoint au centre = l'entrée). */
function mesurerFeuille() {
  const f = document.querySelector('.cn-feuille');
  if (!f) return { erreur: 'la feuille ⋯ ne s’est pas ouverte' };
  const r = (e) => e.getBoundingClientRect();
  const hauts = ['entete', 'rangee'].map((n) => document.querySelector(`[data-banc-cadre="${n}"]`)).filter(Boolean).map((e) => r(e).bottom);
  const champ = document.querySelector('.cn-champ-zone');
  const barre = document.querySelector('[data-banc-cadre="barre"]');
  const z = { haut: Math.max(...hauts), bas: Math.min(champ ? r(champ).top : innerHeight, barre ? r(barre).top : innerHeight) };
  const items = [...f.querySelectorAll('.cn-feuille-item')].filter((e) => e.getClientRects().length);
  const fb = f.getBoundingClientRect();
  const mal = [];
  const lus = items.map((e) => {
    const b = e.getBoundingClientRect();
    const nom = e.textContent.replace(/\s+/g, ' ').trim().slice(0, 28);
    const cx = b.left + b.width / 2; const cy = b.top + b.height / 2;
    const dessus = cy >= 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null;
    const touchable = !!dessus && (e === dessus || e.contains(dessus));
    const entier = b.top >= z.haut - 1 && b.bottom <= z.bas + 1;
    if (!entier || !touchable) mal.push({ nom, y: Math.round(b.top), entier, touchable, sous: dessus ? `${dessus.tagName.toLowerCase()}.${String(dessus.className).split(' ')[0]}` : 'hors de l’écran' });
    return { nom, y: Math.round(b.top) };
  });
  return { haut: Math.round(z.haut), bas: Math.round(z.bas), feuille: [Math.round(fb.top), Math.round(fb.bottom)], n: items.length, mal, lus };
}

/** Les lignes de la liste des carnets (boutons `cnl-*`) : texte rendu (innerText, donc ce qui se lit) et montant en CHF coupé ou non. */
function lireLignesListe() {
  const lignes = [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length && /cnl-/.test(b.className)).map((b) => {
    const bb = b.getBoundingClientRect();
    const txt = b.innerText.replace(/\s+/g, ' ').trim();
    let montantCoupe = false;
    const mm = /\d[\d   ]*[.,]\d\d\s*CHF/.exec(txt);
    if (mm) {
      const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); const r = document.createRange();
      while (w.nextNode()) { const n = w.currentNode; const i = n.nodeValue.search(/\d[\d   ]*[.,]\d\d/); if (i >= 0) { r.setStart(n, i); r.setEnd(n, n.nodeValue.length); const x = r.getBoundingClientRect(); const clip = getComputedStyle(n.parentElement); montantCoupe = x.right > bb.right + 1 || (clip.textOverflow === 'ellipsis' && n.parentElement.scrollWidth > n.parentElement.clientWidth + 1); break; } }
    }
    /* R77-6 (« ·à compar…2697,74 CHF ») : deux bouts de texte voisins sur une même ligne, collés (moins de 3 px) alors que l'un finit par « · » (ou l'autre en commence)
       ou que le premier est coupé par une ellipse : la coupe ne laisse alors aucun blanc devant ce qui suit. */
    const noeuds = [];
    const w2 = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    while (w2.nextNode()) {
      const n = w2.currentNode; if (!n.nodeValue.trim()) continue;
      const el = n.parentElement; const cs = getComputedStyle(el);
      const rg = document.createRange(); rg.selectNodeContents(n);
      const x = rg.getBoundingClientRect(); const bornes = el.getBoundingClientRect();
      const coupe = cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1;
      noeuds.push({ t: n.nodeValue.trim(), g: x.left, d: coupe ? Math.min(x.right, bornes.right) : x.right, top: x.top, coupe });
    }
    const serres = [];
    for (let i = 1; i < noeuds.length; i += 1) {
      const p = noeuds[i - 1]; const q = noeuds[i];
      if (Math.abs(p.top - q.top) > 6) continue;
      if (q.g - p.d < 3 && (p.t.endsWith('·') || q.t.startsWith('·') || p.coupe)) serres.push(`${p.t.slice(-9)}${p.coupe ? '…' : ''}|${q.t.slice(0, 9)}`);
    }
    return { txt, montantCoupe, serres };
  });
  return lignes;
}

/* ------------------------------------------------------------------------------------------------ gestes */

async function aller(page, id) {
  await page.goto(`${URL_BANC}${id ? `&carnet=${id}` : ''}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  if (!id) { /* la liste : sans l'état gardé par le carnet ouvert juste avant, comme un premier passage */
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* sans stockage */ } });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
  }
  await page.waitForSelector(id ? '.cn-ouvert, .cn-fiche' : 'button.cnl-pb', { timeout: 60000 });
  await sleep(1200);
}
const cliquerBouton = (page, motif, classe) => page.evaluate((m, c) => {
  const re = new RegExp(m, 'i');
  const b = [...document.querySelectorAll(c ? `button.${c}` : 'button')].find((x) => x.getClientRects().length && re.test(`${x.getAttribute('aria-label') ?? ''} ${x.textContent ?? ''}`.trim()));
  if (b) b.click();
  return !!b;
}, motif, classe ?? null);
const cliquerCase = (page, etat) => page.evaluate((e) => { const c = document.querySelector(`.cnl-case[data-etat="${e}"]`); if (c) c.click(); return !!c; }, etat);
const photo = async (page, nom) => { if (!capturesDe) return; fs.mkdirSync(capturesDe, { recursive: true }); await page.screenshot({ path: path.join(capturesDe, `${nom}.png`) }); };

/* ------------------------------------------------------------------------------------------------ les règles */

async function r113(page) {
  await aller(page, CHAMBRE);
  await page.waitForSelector('.cn-tab-ligne');
  const m = await page.evaluate(mesurerTexte, '.cn-tableau-zone, .cn-tab-bloc, [data-carnets] .cn-tab', null);
  await photo(page, 'R113-tableau');
  const ko = m.coupes.length > 0 || m.lignesTrop.length > 0;
  const dit = `${m.coupes.length} mot(s) coupé(s) sur ${m.mots} [${[...new Set(m.coupes)].slice(0, 6).join(', ')}] ; ${m.lignesTrop.length} bloc(s) de plus de 2 lignes sur ${m.blocs} [${m.lignesTrop.slice(0, 3).join(' ; ')}]`;
  return { id: 'R113', ko, dit, vide: m.mots === 0 };
}

async function r114(page) {
  const jouees = []; const ko = [];
  for (const id of CARNETS_BULLES) {
    await aller(page, id);
    const compter = () => page.evaluate(() => document.querySelectorAll('button[aria-label^="Note :"][aria-label$="actions"], button[aria-label^="Message :"][aria-label$="actions"]').length);
    let n = await compter();
    if (!n && await cliquerBouton(page, 'Le fil', null)) { await sleep(700); n = await compter(); } // un carnet résolu replie son fil : on le déplie, comme au toucher
    if (!n) { ko.push(`${id} : aucune bulle avec ⋯`); continue; }
    const indices = [...new Set([0, Math.floor((n - 1) / 2), n - 1])];
    for (const i of indices) for (const pos of ['center', 'end', 'start']) {
      await page.evaluate((idx, p) => { const b = document.querySelectorAll('button[aria-label^="Note :"][aria-label$="actions"], button[aria-label^="Message :"][aria-label$="actions"]')[idx]; b.scrollIntoView({ block: p }); }, i, pos);
      await sleep(250);
      await page.evaluate((idx) => document.querySelectorAll('button[aria-label^="Note :"][aria-label$="actions"], button[aria-label^="Message :"][aria-label$="actions"]')[idx].click(), i);
      await sleep(500);
      const m = await page.evaluate(mesurerFeuille);
      jouees.push(m);
      if (m.erreur || m.mal.length) {
        ko.push(`${id.slice(-5)} bulle ${i + 1}/${n} ${pos} : ${m.erreur ?? m.mal.map((x) => `« ${x.nom} » y ${x.y}${x.entier ? '' : ' hors zone'}${x.touchable ? '' : ` non touchable (sous : ${x.sous})`}`).slice(0, 3).join(', ')} (zone ${m.haut ?? '?'}–${m.bas ?? '?'})`);
        if (capturesDe && !ko.some((k, j) => j < ko.length - 1 && k.startsWith(id.slice(-5)))) await photo(page, `R114-feuille-${id.slice(-5)}-${pos}`);
      }
      await page.evaluate(() => { const f = [...document.querySelectorAll('.cn-feuille .cn-feuille-item')].find((e) => /Fermer/.test(e.textContent)); if (f) f.click(); });
      await sleep(250);
    }
  }
  const dit = `${ko.length} feuille(s) ⋯ pas entière(s) ou pas touchable(s) sur ${jouees.length} ouvertes, ${CARNETS_BULLES.length} carnets${ko.length ? ` ; ex. ${ko.slice(0, 3).join(' | ')}` : ''}`;
  return { id: 'R114', ko: ko.length > 0, dit, vide: jouees.length === 0 };
}

async function r115(page) {
  const mesures = []; // { id, ko, dit }
  const m = (id, ko, dit) => mesures.push({ id, ko, dit });
  let quand = '';

  try {
  // --- R80-2 : le prix au m³ n'a pas de cercle de rang vide (carnet et Comparer)
  await aller(page, CHAMBRE);
  const videsCarnet = await page.evaluate(() => [...document.querySelectorAll('.cn-rang')].filter((e) => e.getClientRects().length && !e.textContent.trim()).length);
  await cliquerBouton(page, '(^| )Comparer', 'cn-comparer-lien'); await sleep(1200);
  const videsComparer = await page.evaluate(() => [...document.querySelectorAll('.cn-rang')].filter((e) => e.getClientRects().length && !e.textContent.trim()).length);
  await photo(page, 'R115-comparer');
  m('R80-2', videsCarnet + videsComparer > 0, `${videsCarnet} cercle(s) de rang vide(s) au carnet, ${videsComparer} dans Comparer`);

  } catch (e) { for (const id of 'R80-2'.split(', ')) m(id, true, `erreur : ${String(e).slice(0, 140)}`); }
  try {
  // --- R73-8 : le bloc Offre ne laisse pas de vide entre le prix et ses gestes ; R73-14 : la photo absente ne laisse pas un bandeau gris vide ; R75-6 : les valeurs de la fiche ont toutes la même chasse
  await aller(page, CHAMBRE);
  await page.evaluate(() => document.querySelector('button.cn-tab-ligne').click()); await sleep(1200);
  const fiche = await page.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    const corps = document.querySelector('.cn-offre-corps'); const gestes = document.querySelector('.cn-offre-gestes');
    const cadre = document.querySelector('.cn-fiche-photo'); const img = cadre?.querySelector('img, .cn-vignette, svg');
    const familles = new Map();
    for (const dd of document.querySelectorAll('.cn-carac dd')) {
      const w = document.createTreeWalker(dd, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; const i = n.nodeValue.search(/\d/); if (i >= 0) { const f = getComputedStyle(n.parentElement).fontFamily.split(',')[0].trim(); familles.set(f, (familles.get(f) ?? 0) + 1); break; } }
    }
    return {
      ecart: corps && gestes ? (() => {
        const rg = document.createRange(); rg.selectNodeContents(corps);
        const basTexte = Math.max(...[...rg.getClientRects()].filter((x) => x.width > 0.5).map((x) => x.bottom));
        const hautGeste = Math.min(...[...gestes.querySelectorAll('svg')].map((x) => r(x).top), ...[...gestes.querySelectorAll('a')].map((x) => { const t = document.createRange(); t.selectNodeContents(x); return t.getBoundingClientRect().top; }));
        return Math.round(hautGeste - basTexte);
      })() : null,
      cadre: cadre ? [Math.round(r(cadre).width), Math.round(r(cadre).height)] : null,
      img: img ? [Math.round(r(img).width), Math.round(r(img).height)] : null,
      familles: [...familles.entries()].map(([f, n]) => `${f.replace(/"/g, '')}×${n}`),
    };
  });
  await photo(page, 'R115-fiche');
  m('R73-8', fiche.ecart === null || fiche.ecart > 8, `vide entre le bas du texte du prix et le haut du crayon ou d'Ouvrir : ${fiche.ecart} px (attendu : même ligne, donc ≤ 0, ou ≤ 8 px)`);
  const ratio = fiche.cadre && fiche.img ? (fiche.cadre[0] * fiche.cadre[1] > 0 ? (fiche.img[0] * fiche.img[1]) / (fiche.cadre[0] * fiche.cadre[1]) : 0) : 0;
  m('R73-14', !fiche.cadre || (fiche.cadre[1] > 64 && ratio < 0.35), `photo absente : bandeau ${fiche.cadre?.join('×')} px, pictogramme ${fiche.img?.join('×')} px = ${Math.round(ratio * 100)} % du bandeau (attendu : bandeau ≤ 64 px ou pictogramme ≥ 35 %)`);
  m('R75-6', fiche.familles.length > 1, `chasse des valeurs de Caractéristiques : ${fiche.familles.join(' + ')} (attendu : une seule)`);

  } catch (e) { for (const id of 'R73-8, R73-14, R75-6'.split(', ')) m(id, true, `erreur : ${String(e).slice(0, 140)}`); }
  try {
  // --- R73-10 : Choisir, le nom d'un article sur 2 lignes au plus, sans mot coupé ; R75-6 : mêmes chasses dans Choisir
  await cliquerBouton(page, '(^| )Choisir', 'cn-action-vert'); await sleep(1500);
  const choisir = await page.evaluate(mesurerTexte, '.cn-defile', 'groupe|frigorifique');
  const chasse = await page.evaluate(() => {
    const familles = new Map();
    for (const tr of document.querySelectorAll('.cn-defile table tr')) {
      const th = tr.querySelector('th'); if (!th || /^(prix|ses autres|rang)/i.test(th.textContent.trim())) continue;
      const td = tr.querySelector('td'); if (!td) continue;
      const w = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (/\d/.test(n.nodeValue)) { const f = getComputedStyle(n.parentElement).fontFamily.split(',')[0].trim().replace(/"/g, ''); familles.set(f, (familles.get(f) ?? 0) + 1); break; } }
    }
    return [...familles.entries()].map(([f, n]) => `${f}×${n}`);
  });
  await photo(page, 'R115-choisir');
  m('R73-10', choisir.coupes.length > 0 || choisir.lignesTrop.length > 0, `nom de l'article dans Choisir : ${choisir.coupes.length} mot(s) coupé(s) [${[...new Set(choisir.coupes)].slice(0, 4).join(', ')}], ${choisir.lignesTrop.length} nom(s) sur plus de 2 lignes [${choisir.lignesTrop.slice(0, 2).join(' ; ')}] (blocs lus : ${choisir.blocs})`);
  m('R75-6b', chasse.length > 1, `chasse des valeurs dans Choisir : ${chasse.join(' + ')} (attendu : une seule)`);

  } catch (e) { for (const id of 'R73-10, R75-6b'.split(', ')) m(id, true, `erreur : ${String(e).slice(0, 140)}`); }
  try {
  // --- R80-1 / R75-8 : Quand dit début ou échéance, une seule forme, un seul mot pour le budget
  await aller(page, EMBOUTEILLAGE);
  await cliquerBouton(page, 'Quand', 'cnq-replie'); await sleep(900);
  quand = await page.evaluate(() => (document.querySelector('.cn-quand .cn-rubrique-tete')?.textContent ?? '').replace(/\s+/g, ' ').trim());
  await photo(page, 'R115-quand');
  m('R80-1', !/(^|[^\p{L}])(dès|avant|jusqu)/iu.test(quand), `Quand de « Embouteillage » dit « ${quand} » (attendu : « dès … » ou « avant … » comme À faire)`);

  } catch (e) { for (const id of 'R80-1'.split(', ')) m(id, true, `erreur : ${String(e).slice(0, 140)}`); }
  try {
  // --- la liste : R80-4 (aucun lien brut), R77-6 (montant entier, séparateur, espace), R75-8 (budget / estimé)
  await aller(page, null);
  const liste = await page.evaluate(lireLignesListe);
  await cliquerCase(page, 'cherche'); await sleep(900);
  const listeFiltree = await page.evaluate(lireLignesListe);
  await photo(page, 'R115-liste');
  const liens = [...liste, ...listeFiltree].filter((l) => /https?:\/\//i.test(l.txt));
  m('R80-4', liens.length > 0, `${liens.length} ligne(s) de la liste citent un lien brut : ${liens.slice(0, 2).map((l) => `« ${l.txt.slice(0, 70)} »`).join(' ; ')}`);
  const chf = [...liste.map((l) => ({ ...l, ou: 'repos' })), ...listeFiltree.map((l) => ({ ...l, ou: 'filtre' }))].filter((l) => /CHF/.test(l.txt) && /froide|compar/i.test(l.txt));
  const mauvais = chf.filter((l) => /·\S/.test(l.txt) || /\b\d{4},\d\d\s*CHF/.test(l.txt) || l.montantCoupe || l.serres.length > 0);
  m('R77-6', mauvais.length > 0 || chf.length === 0, `${mauvais.length} ligne(s) au montant coupé, sans espace après « · » ou sans séparateur de milliers sur ${chf.length} lues : ${mauvais.slice(0, 2).map((l) => `[${l.ou}] « ${l.txt.slice(0, 70)} »${l.montantCoupe ? ' (coupé)' : ''}${l.serres.length ? ` (collé : ${l.serres.join(', ')})` : ''}`).join(' ; ')}`);
  const budgetListe = liste.find((l) => /Embouteillage/.test(l.txt))?.txt ?? '';
  const mots = new Set([...(budgetListe + ' ' + quand).matchAll(/\b(budget|estim\p{L}*)\b/giu)].map((x) => (/^estim/i.test(x[1]) ? 'estimé' : 'budget')));
  m('R75-8', mots.size > 1, `le même montant du Planning est dit « ${[...mots].join(' » et « ')} » (liste : « ${budgetListe.slice(-40)} » ; Quand : « ${quand.slice(-40)} »)`);

  } catch (e) { for (const id of 'R80-4, R77-6, R75-8'.split(', ')) m(id, true, `erreur : ${String(e).slice(0, 140)}`); }
  try {
  // --- R80-3 : aucun jour du fil sans bulle, sur chaque carnet des fixtures
  const sansBulle = [];
  const ids = tousLesCarnets();
  for (const id of ids) {
    await aller(page, id);
    const v = await page.evaluate(() => [...document.querySelectorAll('.cnp-j')].filter((j) => { const s = j.nextElementSibling; return !s || s.classList.contains('cnp-j'); }).map((j) => j.textContent.trim()));
    if (v.length) sansBulle.push(`${id.slice(-5)} (${v.join(', ')})`);
  }
  m('R80-3', sansBulle.length > 0, `${sansBulle.length} jour(s) du fil sans bulle sur ${ids.length} carnets${sansBulle.length ? ` : ${sansBulle.slice(0, 3).join(' ; ')}` : ''}`);
  } catch (e) { for (const id of 'R80-3'.split(', ')) m(id, true, `erreur : ${String(e).slice(0, 140)}`); }
  return mesures;
}

/* ------------------------------------------------------------------------------------------------ main */

let sortie = 1;
try {
  await demarrerServeur();
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await browser.newPage();
  try {
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1.5, mobile: true });
    page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
    const rendu = [];
    if (seulement.includes('R113')) rendu.push(await r113(page));
    if (seulement.includes('R114')) rendu.push(await r114(page));
    if (seulement.includes('R115')) for (const x of await r115(page)) rendu.push(x);
    const ko = rendu.filter((x) => x.ko);
    for (const x of rendu) console.log(`${x.ko ? 'KO' : 'ok'} ${x.id} — ${x.dit}`);
    const vides = rendu.filter((x) => x.vide);
    if (vides.length) { console.log(`MISE-EN-PAGE KO rien mesuré : ${vides.map((x) => x.id).join(', ')}`); sortie = 1; }
    else if (ko.length) { console.log(`MISE-EN-PAGE KO ${ko.length}/${rendu.length} mesures : ${ko.map((x) => x.id).join(', ')}`); sortie = 1; }
    else { console.log(`MISE-EN-PAGE OK ${rendu.length} mesures`); sortie = 0; }
  } finally { await page.close().catch(() => {}); browser.disconnect(); }
} catch (e) {
  console.log(`MISE-EN-PAGE KO erreur : ${String(e).slice(0, 300)}`);
  sortie = 2;
} finally { arreterServeur(); }
process.exit(sortie);
