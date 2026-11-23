// Contrôle du rail des étapes (étape houblons), réécrit le 18.10 au soir pour la loupe (D47).
// Les mots du brasseur, dans l'ordre où ils ont fait naître chaque règle :
//   D27 « j'aimerais aussi pouvoir une fois mon houblons sélectionner pouvoir glisser comme un
//       slider le moment de l'ajout » ;
//   D28 « J'aime beaucoup l'intégration de la levure directement dans la p8 mais la p2 a un
//       meilleur visuel » ;
//   D34 « Je veux choisir pas de 10' défini, pas de timing imposé hein » ; « Soit pas supide,
//       c'est des tranche de 5'. » ;
//   D35 « Ça semble un peu bancale, c'est l'idée mais pas hyper bien réalisé » ;
//   D36 « Parcontre prendre en compte que le boil peut durer 120' ou d'autres timing que 60 » ;
//   D37 « toujours garder des variables dynamique » ; puis « C'est defini ailleur dans
//       l'application... » (l'ébullition se lit dans la recette, elle ne se règle pas ici) ;
//   D41 « On a un 10' qui sort de null part. […] les possible ajoute d'houblon sont vraiment à
//       la bonne place ? » ; D42 « Pourquoi celui choisi à de l'ombre ? » ;
//   D43 « Que de j+3 » ; D44 « Que du j+3 SI on est en dehors du boil » ; « Le slider
//       fonctionne pour le boil mais pas pour les autres étape, pas dechelle pour les autres que
//       des choix fix » ; D45 « le passage entre 10' et 5' de fait très mal car on doit passe au
//       dessus des houblons... » ; D46 « Et le slider est clancky pas fluide du tout » ;
//       « Probablement lié au recalcule de l'ibu pas forcément utile à la volée instantané.. » ;
//   D47 « Pas besoin d'afficher une échelle linéaire avec tout les gradient du raille, ça doit
//       rester cohérent. Juste les affiches quand on est à cette emplacement lors du changement
//       avec le houblon. Genre quand on focus sur un type on affiche mieux l'échelle un peu un
//       truc type UX apple qui zoom focus la où on est. »
//
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs <dossier> [ids…]
// Convention auteur, sur l'étape (index.html et cas-*) :
//   data-etape="<code>"   les étapes nommées du rail, visibles au repos : wp (whirlpool),
//                         levure, dryActive (fermentation), dryPost (post-fermentation) ; et les
//                         graduations, qui portent aussi data-graduation="ebullition|whirlpool|
//                         fermentation|post" : b<minute> (par 5′), wp<°C> (par 5), f<jour>,
//                         p<jour> (J+0 à J+14). Les graduations sont CACHÉES au repos et seules
//                         celles du segment sous le doigt se montrent pendant le geste (loupe).
//   data-role="glisser-moment"  la poignée de chaque ligne-houblon ; data-glisse sur l'élément
//                         qui suit le doigt pendant le geste ; data-role="quand" le moment écrit.
//   data-role="ebullition"  la durée de la recette, avec un renvoi (lien ou
//                         data-action="renvoi-ebullition"), sans champ ni −/+.
// Imprime RAIL OK si tout passe, sinon RAIL ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

// ===== Mode --parcours (voie c1-rail, mission controles-parcours, 23.10, passe 2 le même jour) =====
// Rejoue les plaintes du brasseur sur le rail de la maquette jouable (ARCHITECTURE.md, « Contrat d'un écran ») :
//   node controle-rail.mjs <dossier> <id…> --page=etat.html --parcours
// Il ne lit que les marqueurs du contrat, jamais la mise en page :
//   - la poignée [data-role="glisser-moment"][role="slider"] de chaque houblon (dans sa ligne
//     [data-role="ligne-houblon"], ou sur un rail commun et rattachée à sa ligne par data-houblon), ou la frise
//     [data-role="frise"] avec son [role="slider"] (Dryhopper) ;
//   - le moment se lit dans aria-valuenow / aria-valuetext ; l'IBU dans [data-role="ibu-ajout"] ou
//     [data-role="ibu-dry"] (data-valeur) ; le pouce dans [data-role="moment-pouce"] ou .pq-dry-pouce ;
//   - les graduations sont des [data-cran], montrées seulement pendant le geste (sur le rail, ou dans une bulle
//     [data-role="loupe"]) ;
//   - l'axe du rail est horizontal, sauf aria-orientation="vertical" (sur la poignée ou son conteneur), ou un rail
//     plus haut que large, ou, à défaut, l'axe où un essai du doigt change le cran : toutes les mesures se font le long
//     de cet axe. Une poignée courte (moins du quart de l'écran) est un repère qui se déplace avec le moment : le
//     doigt la prend au centre.
// Règles jouées, avec leurs mots : work/missions/2026-10-23-controles-parcours/voies/c1-rail/NOTE.md.
// Plusieurs houblons (au moins deux poignées, ou <route>/cas-k3.html) : D45, D56, D61 bis, D64. Sans objet sur ce
// format : D28, D55. Non joués faute de cas d'essai : D36, D37 (cas-ebu<N>.html).
const PARCOURS = process.argv.includes('--parcours');

// Fonctions de lecture injectées dans chaque page (window.__rc) : positions rendues, jamais le code.
function outilsDePage() {
  const R = (window.__rc = {});
  const C = () => window.__rcCfg || {};
  R.vis = (e) => {
    if (!e || !e.isConnected || e.closest('[inert]')) return false;
    const r = e.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false;
    return !e.checkVisibility || e.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  };
  R.SEL = '[data-role="glisser-moment"][role="slider"], [data-role="frise"] [role="slider"]';
  R.cle = (s) => s.getAttribute('data-houblon') || s.getAttribute('data-ajout-repere') || s.getAttribute('data-ajout') || s.getAttribute('aria-label') || '';
  R.sliders = () => [...document.querySelectorAll(R.SEL)].filter(R.vis);
  R.slider = () => { const l = R.sliders(), c = C().cle; return (c && l.find((s) => R.cle(s) === c)) || l[0] || null; };
  R.declare = (s) => { const e = s.closest('[aria-orientation]'); return e ? e.getAttribute('aria-orientation') : null; };
  R.axe = (s) => {
    if (C().axe) return C().axe;
    const o = R.declare(s);
    if (o === 'vertical') return 'y';
    if (o === 'horizontal') return 'x';
    const r = s.getBoundingClientRect();
    return r.height > 1.5 * r.width ? 'y' : 'x';
  };
  R.ambigu = (s) => { if (C().axe || R.declare(s)) return false; const r = s.getBoundingClientRect(); return r.height <= 1.5 * r.width && r.width <= 1.5 * r.height; };
  // La ligne de la poignée : celle qui porte le même data-houblon, sinon celle qui la contient.
  R.ligneDe = (s) => {
    const k = s.getAttribute('data-houblon');
    if (k) { const l = [...document.querySelectorAll('[data-role="ligne-houblon"]')].find((x) => x.getAttribute('data-houblon') === k || x.querySelector('[data-houblon="' + k + '"]')); if (l) return l; }
    return s.closest('[data-role="ligne-houblon"]');
  };
  // Les zones du rail de cette poignée : sa ligne et elle-même, ou, sans ligne, le bloc de la frise.
  R.racines = (s) => {
    const l = R.ligneDe(s);
    if (l) return l.contains(s) ? [l] : [l, s];
    const z = s.closest('[data-acquis="frise"]') || (s.closest('[data-role="frise"]') || {}).parentElement || s.parentElement;
    return [z];
  };
  R.pouce = (s) => s.querySelector('[data-role="moment-pouce"], .pq-dry-pouce, [data-pouce]');
  R.ibu = (s) => {
    const q = '[data-role="ibu-ajout"], [data-role="ibu-dry"]';
    const e = R.racines(s).flatMap((z) => [...z.querySelectorAll(q)]).find(R.vis) || [...document.querySelectorAll(q)].find(R.vis);
    return e ? Number(e.getAttribute('data-valeur')) : null;
  };
  R.lecture = () => {
    const s = R.slider();
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const ax = R.axe(s) === 'x';
    const p = R.pouce(s);
    const pr = p && R.vis(p) ? p.getBoundingClientRect() : null;
    const lon = ax ? r.width : r.height, ext = ax ? innerWidth : innerHeight;
    const poignee = lon < 0.25 * ext;
    const tete = poignee ? (document.querySelector('[data-rang="T-ebu"]') || s.closest('[data-role="frise"]') || document.querySelector('[data-role="frise-brassin"]')) : null;
    const rr = tete ? tete.getBoundingClientRect() : r;
    return {
      cle: R.cle(s), now: Number(s.getAttribute('aria-valuenow')), max: Number(s.getAttribute('aria-valuemax')), text: s.getAttribute('aria-valuetext') || '',
      axe: ax ? 'x' : 'y', ambigu: R.ambigu(s), poignee, deb: ax ? r.left : r.top, lon, trans: ax ? r.top + r.height / 2 : r.left + r.width / 2, ext,
      ref: { t: rr.top, l: rr.left, connu: !poignee || !!tete },
      pouce: pr ? (ax ? pr.left + pr.width / 2 : pr.top + pr.height / 2) : null,
      ibu: R.ibu(s), zoneTexte: R.racines(s).map((z) => z.innerText || '').join(' '),
    };
  };
  // Toutes les poignées : leur place le long de l'axe et en travers, leur moment.
  R.lignes = () => {
    const l = R.sliders();
    const ax = !l.length || R.axe(l[0]) === 'x';
    return l.map((s) => { const r = s.getBoundingClientRect(); return { cle: R.cle(s), pos: ax ? r.left + r.width / 2 : r.top + r.height / 2, trans: ax ? r.top + r.height / 2 : r.left + r.width / 2, text: s.getAttribute('aria-valuetext') || '', now: Number(s.getAttribute('aria-valuenow')) }; });
  };
  // Les nœuds nommés de la frise (whirlpool, fermentation, post-fermentation), lus à leur texte.
  R.noeuds = () => {
    const s = R.slider(), ax = !s || R.axe(s) === 'x', out = {};
    for (const e of document.querySelectorAll('body *')) {
      if (e.children.length || !R.vis(e)) continue;
      const t = (e.textContent || '').trim().toLowerCase();
      const k = t === 'whirlpool' ? 'wp' : t === 'fermentation' ? 'ferm' : t === 'post-fermentation' ? 'post' : null;
      if (!k) continue;
      const r = e.getBoundingClientRect();
      out[k] = ax ? r.left + r.width / 2 : r.top + r.height / 2;
    }
    return out;
  };
  R.grads = () => {
    const s = R.slider(), ax = !s || R.axe(s) === 'x';
    return [...document.querySelectorAll('[data-cran], [data-graduation]')].filter(R.vis).map((e) => {
      const r = e.getBoundingClientRect();
      return { k: e.hasAttribute('data-cran') ? Number(e.getAttribute('data-cran')) : null, pos: ax ? r.left + r.width / 2 : r.top + r.height / 2, loin: /loin|autre|hors/i.test(String(e.getAttribute('class') || '')) || e.hasAttribute('data-hors-segment'), bulle: !!e.closest('[data-role="loupe"]') };
    });
  };
  R.loupeVisible = () => [...document.querySelectorAll('[data-role="loupe"]')].some(R.vis);
  R.textes = (racine, tout) => {
    const out = [];
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    for (let nd = w.nextNode(); nd; nd = w.nextNode()) {
      const t = nd.textContent.trim();
      const el = nd.parentElement;
      if (!t || !el || ['SCRIPT', 'STYLE', 'TITLE'].includes(el.tagName) || !R.vis(el)) continue;
      const rg = document.createRange();
      rg.selectNodeContents(nd);
      for (const b of rg.getClientRects()) if (b.width > 1 && b.height > 1 && (tout || (b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth))) out.push({ t, el, x0: b.left, x1: b.right, y0: b.top, y1: b.bottom });
    }
    return out;
  };
  // Deux textes l'un sur l'autre. mode « geste » (D35) : au moins l'un est dans la zone de la poignée tenue (sa ligne,
  // son pouce, sa loupe) ; mode « hors-carte » (D56) : aucun des deux n'est dans la carte ni sur le repère du houblon tenu,
  // seuls à suivre le doigt (le rail, la loupe, les autres houblons restent à leur place).
  R.chevauchements = (mode) => {
    const s = R.slider(), rac = s ? R.racines(s) : [];
    const dans = (el) => rac.some((z) => z.contains(el)) || !!el.closest('[data-role="loupe"]');
    const rects = R.textes(document.body), out = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.el === b.el) continue;
      if (!(Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 2 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 2)) continue;
      const touche = dans(a.el) || dans(b.el);
      if (mode === 'hors-carte' ? rac.some((z) => z.contains(a.el) || z.contains(b.el)) : !touche) continue;
      out.push('« ' + a.t.slice(0, 12) + ' » sur « ' + b.t.slice(0, 12) + ' »');
    }
    return out;
  };
  R.minutes = (s) => {
    const out = [];
    for (const z of R.racines(s)) for (const x of R.textes(z)) for (const m of x.t.matchAll(/(\d+)\s*[′']/g)) out.push(Number(m[1]));
    return out;
  };
  R.ombres = (s) => {
    const out = [];
    for (const z of R.racines(s)) for (const e of [z, ...z.querySelectorAll('*')]) {
      if (!R.vis(e)) continue;
      const bs = getComputedStyle(e).boxShadow;
      if (!bs || bs === 'none') continue;
      for (const part of bs.split(/,(?![^(]*\))/)) {
        const nums = (part.replace(/\w+\([^)]*\)/g, '').match(/-?\d*\.?\d+px/g) || []).map(parseFloat);
        const [x = 0, y = 0, flou = 0] = nums;
        if (!/inset/.test(part) && (flou > 0 || x !== 0 || y !== 0)) out.push((e.getAttribute('class') || e.tagName).slice(0, 24) + ' : ' + part.trim().slice(0, 50));
      }
    }
    return out;
  };
  R.champs = (s) => R.racines(s).flatMap((z) => [...z.querySelectorAll('input, select, textarea, [data-action^="ebullition"]')]).filter(R.vis).length;
  // D55 : sur une frise verticale, le plus grand vide entre deux éléments du rail (textes et cartes des houblons).
  R.vide = () => {
    const s = R.slider();
    if (!s || R.axe(s) !== 'y') return null;
    const c = s.closest('[data-role="frise"]') || document.querySelector('[data-role="frise"], [data-role="frise-brassin"]');
    if (!c) return null;
    const items = R.textes(c, true).map((x) => [x.y0, x.y1]);
    for (const e of c.querySelectorAll('[data-role="ligne-houblon"]')) if (R.vis(e)) { const r = e.getBoundingClientRect(); items.push([r.top, r.bottom]); }
    items.sort((a, b) => a[0] - b[0]);
    let fin = -Infinity, vide = 0, ou = null;
    for (const [a, b] of items) { if (fin > -Infinity && a - fin > vide) { vide = a - fin; ou = [Math.round(fin), Math.round(a)]; } fin = Math.max(fin, b); }
    return { vide, ou, n: items.length };
  };
  R.joursBoutons = () => [...document.querySelectorAll('[data-jour]')].filter(R.vis).map((e) => { const r = e.getBoundingClientRect(); return { j: Number(e.getAttribute('data-jour')), x: r.left + r.width / 2, y: r.top + r.height / 2, off: e.getAttribute('aria-disabled') === 'true' }; });
  // Loupe : l'écart de deux crans voisins sous le doigt contre l'écart au loin (D63, D67, L12). Crans dans une bulle :
  // l'écart au loin est celui du repos (farRef, ou longueur du rail ÷ intervalles).
  R.mesureLoupe = (farRef) => {
    const L = R.lecture();
    const g = R.grads().filter((x) => x.k !== null).sort((a, b) => a.k - b.k);
    if (g.length < 5) return { err: g.length + ' graduation(s) visible(s) sous le doigt (5 au moins)' };
    const bulle = g.every((x) => x.bulle);
    let a = g.findIndex((x) => x.k === L.now), best = 1e9;
    if (a < 0) g.forEach((x, i) => { const d = Math.abs(x.k - L.now); if (d < best) { best = d; a = i; } });
    const gap = (i) => Math.abs(g[i + 1].pos - g[i].pos);
    const near = Math.min(a > 0 ? gap(a - 1) : Infinity, a < g.length - 1 ? gap(a) : Infinity);
    const far = bulle ? (farRef || L.lon / Math.max(1, L.max)) : a < g.length / 2 ? gap(g.length - 2) : gap(0);
    return { near, far, ratio: near / far, bulle, n: g.length };
  };
  // D45 : les cinq crans les plus proches du doigt, dans la bulle, sont à intervalles réguliers (écart-type ÷ moyenne).
  R.regularite = () => {
    const L = R.lecture();
    const g = R.grads().filter((x) => x.k !== null && x.bulle).sort((a, b) => Math.abs(a.k - L.now) - Math.abs(b.k - L.now)).slice(0, 5).sort((a, b) => a.k - b.k);
    if (g.length < 4) return null;
    const gaps = g.slice(1).map((x, i) => Math.abs(x.pos - g[i].pos));
    const m = gaps.reduce((s, d) => s + d, 0) / gaps.length;
    const sd = Math.sqrt(gaps.reduce((s, d) => s + (d - m) ** 2, 0) / gaps.length);
    return { cv: m > 0 ? sd / m : 0, mini: Math.min(...gaps), maxi: Math.max(...gaps) };
  };
}

class Arret extends Error {}

async function modeParcours() {
  const args = process.argv.slice(2);
  const positionnels = args.filter((a) => !a.startsWith('--'));
  const racine = path.resolve(positionnels[0] || '.');
  const ids = positionnels.slice(1);
  const nomPage = ((args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice('--page='.length)) || 'etat.html';
  const attente = (ms) => new Promise((r) => setTimeout(r, ms));
  const probs = [];
  const total = ids.length;
  let sains = 0;
  const ctx = { axe: null, cle: null, dernier: null };
  const bloque = () => ' (le geste s\'arrête à « ' + (ctx.dernier ? ctx.dernier.text : '?') + ' » : le repère change de segment, pointeur perdu ?)';
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });

  const ouvrirP = async (f, { w = 390, H = 844, tactile = true, cle } = {}) => {
    const page = await nav.newPage();
    await page.evaluateOnNewDocument(outilsDePage);
    await page.evaluateOnNewDocument((c) => { window.__rcCfg = c; }, { axe: ctx.axe, cle: cle === undefined ? ctx.cle : cle });
    await page.setViewport(tactile ? { width: w, height: H, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { width: w, height: H, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(f).href, { waitUntil: 'load', timeout: 30000 });
    for (let i = 0; i < 60; i++) { if (await page.evaluate(() => !!(window.__rc && window.__rc.slider()))) break; await attente(100); }
    await attente(250);
    return page;
  };
  const lec = (page) => page.evaluate(() => window.__rc.lecture());
  // Un doigt (ou une souris) sur le rail : a = position le long de l'axe du rail, c = position en travers.
  const doigtSur = async (page, L, a, tactile = true) => {
    let ca = a;
    const xy = (v) => (L.axe === 'x' ? [v, L.trans] : [L.trans, v]);
    let t = null;
    const [x0, y0] = xy(a);
    if (tactile) t = await page.touchscreen.touchStart(x0, y0); else { await page.mouse.move(x0, y0); await page.mouse.down(); }
    return {
      get a() { return ca; },
      async vers(na) { ca = na; const [x, y] = xy(ca); if (t) await t.move(x, y); else await page.mouse.move(x, y); },
      async lever() { if (t) await t.end(); else await page.mouse.up(); },
    };
  };
  const classer = (t) => {
    let m;
    if (/apr[èe]s/i.test(t) && (m = t.match(/(\d+)\s*j/))) return { seg: 3, j: Number(m[1]) };
    if (/actif|en fermentation/i.test(t) && (m = t.match(/(\d+)\s*j/))) return { seg: 2, j: Number(m[1]) };
    if (/whirlpool|\bWP\b/i.test(t)) return { seg: 1 };
    if ((m = t.match(/(\d+)\s*[′']/))) return { seg: 0, m: Number(m[1]) };
    return null;
  };
  // Le doigt marche vers le cran d'indice idx (relu à chaque pas : la loupe peut déplacer les crans).
  const aller = async (page, d, idx, ext) => {
    let pas = 4, sens = 0, fige = 0, derniere = null;
    for (let i = 0; i < 600; i++) {
      const L = await lec(page);
      ctx.dernier = L;
      if (L.now === idx) return true;
      fige = L.now === derniere ? fige + 1 : 0;
      derniere = L.now;
      if (fige > 80) return false;
      const s = Math.sign(idx - L.now);
      if (sens && s !== sens) pas = Math.max(1, pas / 2);
      sens = s;
      const na = Math.max(4, Math.min(ext - 4, d.a + s * pas));
      if (na === d.a) return false;
      await d.vers(na);
      await attente(14);
    }
    return false;
  };
  // L'échelle du rail, lue au clavier (flèches) : un texte par cran. Ne sert qu'à connaître les crans.
  const echelle = async (page) => {
    const ax = (await lec(page)).axe;
    const [prev, next] = ax === 'x' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    const garder = () => page.evaluate(() => window.__rc.slider().focus());
    await garder();
    for (let i = 0; i < 80; i++) { const L = await lec(page); if (L.now <= 0) break; await page.keyboard.press(prev); await attente(22); await garder(); }
    const out = [];
    for (let i = 0; i < 90; i++) {
      const L = await lec(page);
      out.push({ now: L.now, text: L.text, pos: L.pouce, ...(classer(L.text) || { seg: null }) });
      if (L.now >= L.max) break;
      await page.keyboard.press(next);
      await attente(26);
      await garder();
    }
    return out;
  };
  const plusProche = (liste, seg, cle, valeur) => {
    const l = liste.filter((c) => c.seg === seg && c[cle] !== undefined);
    return l.length ? l.reduce((a, b) => (Math.abs(b[cle] - valeur) < Math.abs(a[cle] - valeur) ? b : a)) : null;
  };

  for (const id of ids) {
    const defauts = new Set();
    const pb = [];
    const infos = [];
    const jouee = (...d) => d.forEach((x) => defauts.add(x));
    const p = (d, msg) => { jouee(d); pb.push(d + ' : ' + id + ', ' + msg); };
    ctx.axe = null;
    ctx.cle = null;
    const f = path.join(racine, id, nomPage);
    if (!fs.existsSync(f)) { probs.push('D27 : ' + id + ', page absente (' + path.relative(process.cwd(), f) + ')'); console.log(id + ' · page absente'); continue; }
    try {
      // ---- 1. Au repos ----
      let page = await ouvrirP(f);
      let L0 = await lec(page);
      if (!L0) { probs.push('D27 : ' + id + ', aucun rail repérable (poignée [data-role="glisser-moment"] d\'une ligne, ou [data-role="frise"] avec son [role="slider"])'); console.log(id + ' · aucun rail'); await page.close(); continue; }
      if (L0.ambigu) {
        // Poignée carrée, rien ne dit son axe : l'essai du doigt (le cran change le long de l'axe du rail).
        const cx = L0.deb + L0.lon / 2, cy = L0.trans;
        const t = await page.touchscreen.touchStart(cx, cy);
        for (let i = 1; i <= 6; i++) { await t.move(cx + 6 * i, cy); await attente(24); }
        const n1 = (await lec(page)).now;
        await t.move(cx, cy); await attente(60);
        const b1 = (await lec(page)).now;
        for (let i = 1; i <= 6; i++) { await t.move(cx, cy + 6 * i); await attente(24); }
        const n2 = (await lec(page)).now;
        await t.end();
        ctx.axe = Math.abs(n2 - b1) > Math.abs(n1 - L0.now) ? 'y' : 'x';
        await page.close();
        page = await ouvrirP(f);
        L0 = await lec(page);
      }
      ctx.cle = L0.cle;
      const nPoignees = await page.evaluate(() => window.__rc.sliders().length);
      const repos = await page.evaluate(() => { const s = window.__rc.slider(); return { grads: window.__rc.grads().length, loupe: window.__rc.loupeVisible(), ombres: window.__rc.ombres(s), minutes: window.__rc.minutes(s), champs: window.__rc.champs(s), vide: window.__rc.vide() }; });
      jouee('D47');
      if (repos.grads || repos.loupe) p('D47', 'au repos, ' + repos.grads + ' graduation(s)' + (repos.loupe ? ' et une loupe' : '') + ' visibles : l\'échelle ne s\'ouvre que sous le doigt');
      jouee('D42');
      if (repos.ombres.length) p('D42', 'au repos, ' + repos.ombres.length + ' ombre(s) sur le rail (' + repos.ombres[0] + ')');
      if (repos.vide) { jouee('D55'); if (repos.vide.vide > 80) p('D55', 'au repos, un vide de ' + Math.round(repos.vide.vide) + ' px dans la frise (entre ' + repos.vide.ou[0] + ' et ' + repos.vide.ou[1] + ' px, 80 au plus) : un rail à la Apple se resserre, il ne s\'étire pas'); }
      jouee('D37');
      if (repos.champs) p('D37', 'un champ ou des − / + règlent l\'ébullition sur le rail alors que sa durée se lit dans la recette');
      const debut = (L) => (L.poignee ? L.deb + L.lon / 2 : L.deb + 14);
      const ext = L0.ext;
      let L, d, dep2 = 0;
      // ---- 3. Un balayage d'un trait, pas de 10 px : le moment se glisse, ne remonte jamais ----
      await page.close();
      page = await ouvrirP(f);
      L = await lec(page);
      d = await doigtSur(page, L, debut(L));
      await attente(150);
      const suite = [(await lec(page)).now];
      while (d.a < ext - 6) {
        await d.vers(Math.min(ext - 6, d.a + 10));
        await attente(24);
        const q = await lec(page);
        suite.push(q.now);
        dep2 = Math.max(dep2, Math.abs(q.ref.t - L0.ref.t), Math.abs(q.ref.l - L0.ref.l));
      }
      await d.lever();
      await page.close();
      jouee('D27');
      const valeurs = new Set(suite);
      if (valeurs.size < 3) { p('D27', 'un glissé complet ne prend que ' + valeurs.size + ' valeur(s) : le moment ne se glisse pas comme un curseur (les autres règles du rail ne sont pas jouées)'); throw new Arret(); }
      {
        jouee('D61 bis');
        let faute = null;
        for (let i = 1; i < suite.length && !faute; i++) {
          if (suite[i] < suite[i - 1]) faute = 'le cran passe de ' + suite[i - 1] + ' à ' + suite[i] + ' en avançant';
          else if (suite[i] - suite[i - 1] > 2) faute = 'le cran saute de ' + (suite[i] - suite[i - 1]) + ' crans en 10 px (' + suite[i - 1] + ' → ' + suite[i] + ')';
        }
        if (faute) p('D61 bis', 'en avançant par pas de 10 px, ' + faute + ' : l\'échelle ne tient pas sous le doigt');
      }
      if (L0.ref.connu && dep2 > 40) p('D68', 'le rail se déplace de ' + Math.round(dep2) + ' px pendant le balayage (au plus 40)');

      page = await ouvrirP(f);
      const eche = await echelle(page);
      await page.close();
      const eb = eche.filter((c) => c.seg === 0);
      // Écart de deux crans voisins au repos le long de l'axe (médiane, ébullition) : la référence de « l'écart au loin ».
      const pasRepos = (() => {
        const e = eb.filter((c) => c.pos !== null && c.pos !== undefined).slice(2, 10);
        const d = e.slice(1).map((c, i) => Math.abs(c.pos - e[i].pos)).filter((x) => x > 0.5).sort((x, y) => x - y);
        return d.length ? d[Math.floor(d.length / 2)] : null;
      })();
      // D34 : tranches de 5′, sans repère imposé.
      jouee('D34');
      const mins = eb.map((c) => c.m);
      const ecarts = mins.slice(1).map((m, i) => mins[i] - m);
      if (mins.length < 3) p('D34', 'l\'ébullition n\'a que ' + mins.length + ' cran(s) lisible(s) (aria-valuetext « 45′ ») : pas de tranches de 5′');
      else if (mins.some((m) => m % 5) || ecarts.some((e) => e !== 5)) p('D34', 'l\'ébullition se règle par ' + [...new Set(ecarts)].join(', ') + '′ (' + mins.slice(0, 6).join('′, ') + '′…) au lieu de tranches de 5′');
      // D41 : au repos, une minute écrite est la durée, 0′ ou le moment d'un ajout.
      jouee('D41');
      const duree = mins.length ? Math.max(...mins) : null;
      const moments = new Set([0, duree]);
      const c0 = classer(L0.text);
      if (c0 && c0.seg === 0) moments.add(c0.m);
      const orphelines = [...new Set(repos.minutes)].filter((m) => !moments.has(m));
      if (orphelines.length) p('D41', 'au repos, ' + orphelines.map((m) => m + '′').join(', ') + ' écrit(e) sur le rail sans être la durée (' + duree + '′), ni 0′, ni le moment d\'un ajout (' + (c0 && c0.seg === 0 ? c0.m + '′' : L0.text) + ')');
      if (!eche.length || eb.length === 0) p('D27', 'le rail ne dit aucun moment lisible (aria-valuetext)');
      const idxEb = (m) => { const c = plusProche(eche, 0, 'm', m); return c ? c.now : null; };
      const idxAct = (j) => { const c = plusProche(eche, 2, 'j', j); return c ? c.now : null; };
      const idxApr = (j) => { const c = plusProche(eche, 3, 'j', j); return c ? c.now : null; };

      // ---- 2. Un geste posé, mené cran par cran : loupe, ombre, textes, déplacement, fluidité ----
      page = await ouvrirP(f);
      L = await lec(page);
      d = await doigtSur(page, L, debut(L));
      await attente(200);
      const maxDep = { v: 0, ou: '' };
      const dep = async (ou) => { const a = await lec(page); const v = Math.max(Math.abs(a.ref.t - L0.ref.t), Math.abs(a.ref.l - L0.ref.l)); if (v > maxDep.v) { maxDep.v = v; maxDep.ou = ou; } };
      const cibles = [['ebullition', idxEb(35)], ['fermentation active', idxAct(3)], ['après fermentation', idxApr(3)]];
      let ok63 = true;
      for (const [nom, idx] of cibles) {
        if (idx === null) { infos.push('D63/D67 : pas de cran « ' + nom + ' » lu, loupe non mesurée là'); continue; }
        const atteint = await aller(page, d, idx, ext);
        if (!atteint) { p(nom === 'ebullition' ? 'D63' : 'D67', 'le doigt n\'atteint pas le cran « ' + nom + ' » (cran ' + idx + ')' + bloque()); continue; }
        await attente(90);
        const m = await page.evaluate((far) => ({ loupe: window.__rc.mesureLoupe(far), chev: window.__rc.chevauchements(), loin: window.__rc.grads().filter((x) => x.loin).length, vide: window.__rc.vide(), text: window.__rc.lecture().text }), L0.poignee ? pasRepos : null);
        await dep(nom);
        jouee('D35', 'D47', 'D68');
        if (m.vide) { jouee('D55'); if (m.vide.vide > 80) p('D55', 'pendant le geste (' + nom + ', « ' + m.text + ' »), un vide de ' + Math.round(m.vide.vide) + ' px dans la frise (entre ' + m.vide.ou[0] + ' et ' + m.vide.ou[1] + ' px, 80 au plus)'); }
        if (m.chev.length) p('D35', 'pendant le geste (' + nom + ', « ' + m.text + ' »), ' + m.chev.length + ' chevauchement(s) de textes : ' + m.chev.slice(0, 2).join(' ; '));
        if (m.loin) p('D47', 'pendant le geste (' + nom + '), ' + m.loin + ' graduation(s) d\'autres segments restent visibles : seules celles du segment sous le doigt s\'ouvrent');
        const D = nom === 'ebullition' ? 'D63' : 'D67';
        if (D === 'D67' && !ok63) continue;
        jouee(D);
        if (m.loupe.err) { p(D, 'tenu à « ' + m.text + ' » : ' + m.loupe.err); if (D === 'D63') ok63 = false; }
        else if (!(m.loupe.ratio >= 3)) { p(D, 'tenu à « ' + m.text + ' » : l\'écart entre deux crans voisins fait ' + m.loupe.near.toFixed(1) + ' px sous le doigt et ' + m.loupe.far.toFixed(1) + ' px au loin (×' + m.loupe.ratio.toFixed(2) + ', ×3 au moins) : pas de loupe'); if (D === 'D63') ok63 = false; }
        if (nom === 'ebullition') {
          // D46 : dix pas de 6 px, la poignée bouge au moins 9 fois et reste à 4 px au plus du doigt.
          jouee('D46');
          const pos = [(await lec(page)).pouce];
          for (let i = 0; i < 10; i++) { await d.vers(Math.min(ext - 6, d.a + 6)); await attente(28); pos.push((await lec(page)).pouce); }
          if (pos.some((x) => x === null)) p('D46', 'la poignée (pouce) n\'est pas repérable pendant le geste ([data-role="moment-pouce"])');
          else {
            let bouge = 0, pire = 0;
            for (let i = 1; i < pos.length; i++) { const dx = pos[i] - pos[i - 1]; if (Math.abs(dx) > 0.5) bouge += 1; pire = Math.max(pire, Math.abs(dx - 6)); }
            if (bouge < 9 || pire > 4) p('D46', 'sur 10 pas de 6 px, la poignée bouge ' + bouge + ' fois et s\'écarte du doigt jusqu\'à ' + pire.toFixed(1) + ' px (9 fois et 4 px au plus) : geste saccadé');
          }
        }
      }
      jouee('D68');
      if (L0.ref.connu && maxDep.v > 40) p('D68', 'le rail se déplace de ' + Math.round(maxDep.v) + ' px pendant le geste (au plus 40), tenu à « ' + maxDep.ou + ' »');
      await d.lever();
      await attente(450);
      const apres = await page.evaluate(() => { const s = window.__rc.slider(); return { grads: window.__rc.grads().length, loupe: window.__rc.loupeVisible(), ombres: window.__rc.ombres(s) }; });
      if (apres.grads > repos.grads || (apres.loupe && !repos.loupe)) p('D47', 'après le lâcher, l\'échelle reste ouverte (' + apres.grads + ' graduation(s)' + (apres.loupe ? ', loupe' : '') + ')');
      if (apres.ombres.length > repos.ombres.length) p('D42', 'après le lâcher, ' + apres.ombres.length + ' ombre(s) restent sur le rail');
      await page.close();

      // ---- 4. Des lâchers : D34, D27 (IBU), D61 (la place dit le temps) ----
      const lacher = async (idx, cas) => {
        const pg = await ouvrirP(cas || f);
        const a = await lec(pg);
        const dg = await doigtSur(pg, a, debut(a));
        await attente(120);
        const ok = await aller(pg, dg, idx, a.ext);
        await dg.lever();
        await attente(450);
        const r = await lec(pg);
        await pg.close();
        return { ok, ...r };
      };
      if (mins.length >= 3) {
        const cibles34 = [45, 25, 5].map((m) => plusProche(eche, 0, 'm', m)).filter(Boolean);
        const lach = [];
        for (const c of cibles34) lach.push({ c, r: await lacher(c.now) });
        for (const { c, r } of lach) {
          if (!r.ok) { p('D34', 'le doigt n\'atteint pas ' + c.m + '′' + bloque()); continue; }
          const cl = classer(r.text);
          if (!cl || cl.m !== c.m) p('D34', 'lâchée sur ' + c.m + '′, le rail dit « ' + r.text + ' »');
          else if (!new RegExp('(^|\\D)' + c.m + '\\s*[′\']').test(r.zoneTexte)) p('D34', 'lâchée sur ' + c.m + '′, le rail n\'écrit pas ce moment (« ' + r.zoneTexte.split(/\s+/).join(' ').slice(0, 40) + ' »)');
        }
        const ibus = lach.filter((x) => x.r.ok && x.r.ibu !== null).map((x) => ({ m: x.c.m, ibu: x.r.ibu }));
        if (ibus.length >= 2) {
          for (let i = 0; i < ibus.length; i++) for (let j2 = i + 1; j2 < ibus.length; j2++) if (Math.abs(ibus[i].ibu - ibus[j2].ibu) < 0.01) p('D34', ibus[i].m + '′ et ' + ibus[j2].m + '′ donnent le même IBU (' + ibus[i].ibu + ') : le moment ne change pas l\'amertume');
        } else infos.push('D27, D34 : l\'IBU de l\'ajout n\'est pas lisible ([data-role="ibu-ajout"] ou "ibu-dry", data-valeur) : comparaison non jouée');
        // D61 : la place dit le temps (45′, 25′, 5′ à intervalles égaux sur le rail au repos).
        const pts = lach.filter((x) => x.r.ok && x.r.pouce !== null);
        if (nPoignees > 1) infos.push('D61 (place) : non joué à plusieurs houblons (les cartes des autres s\'intercalent entre deux minutes) : D61 bis et D64 les jouent');
        else if (pts.length === 3) {
          jouee('D61');
          const [a, b, c] = pts;
          const att = (a.c.m - b.c.m) / (a.c.m - c.c.m), vu = (b.r.pouce - a.r.pouce) / (c.r.pouce - a.r.pouce);
          if (!(Math.abs(vu - att) <= 0.12)) p('D61', 'la place ne dit pas le temps : 25′ est posé à ' + Math.round(vu * 100) + ' % du chemin de 45′ à 5′ (' + Math.round(att * 100) + ' % attendus)');
        }
      }
      // D44 : deux lâchers en fermentation, deux jours (le whirlpool n'a qu'un cran : rien à régler).
      const act = eche.filter((c) => c.seg === 2);
      jouee('D44');
      if (act.length >= 2) {
        const pa = act[0], pz = act[act.length - 1];
        const r1 = await lacher(pa.now), r2 = await lacher(pz.now);
        const j1 = (classer(r1.text) || {}).j, j2 = (classer(r2.text) || {}).j;
        if (!r1.ok || !r2.ok) p('D44', 'le doigt n\'atteint pas les crans de la fermentation (' + pa.text + ', ' + pz.text + ')' + bloque());
        else if (j1 === undefined || j2 === undefined) p('D44', 'lâchée en fermentation, le rail ne dit pas de jours (« ' + r1.text + ' », « ' + r2.text + ' »)');
        else if (j1 === j2) p('D44', 'deux lâchers en fermentation (premier et dernier cran) donnent le même jour (« ' + r1.text + ' ») : choix figé');
      } else p('D44', 'la fermentation n\'a pas deux crans de jours sur le rail (' + act.length + ')');
      if (eche.filter((c) => c.seg === 1).length < 2) infos.push('D44 (whirlpool) : un seul cran, aucun réglage (°C ou durée) à lâcher : à brancher');
      // D43 : les jours de contact se règlent aussi à la touche (boutons [data-jour]).
      {
        const pg = await ouvrirP(f);
        let jb = await pg.evaluate(() => window.__rc.joursBoutons());
        if (jb.length) {
          jouee('D43');
          await pg.evaluate(() => window.__rc.slider().focus());
          for (let i = 0; i < 40; i++) { const a = await lec(pg); const c = classer(a.text); if (c && c.seg >= 2) break; await pg.keyboard.press(L0.axe === 'x' ? 'ArrowRight' : 'ArrowDown'); await attente(24); }
          const lus = [];
          const actifs = jb.filter((x) => !x.off).map((x) => x.j);
          const jours43 = actifs.length >= 2 ? [actifs[0], actifs[actifs.length - 1]] : [];
          for (const jour of jours43) {
            jb = await pg.evaluate(() => window.__rc.joursBoutons());
            const b = jb.find((x) => x.j === jour);
            if (!b || b.off) { lus.push(null); continue; }
            await pg.touchscreen.tap(b.x, b.y);
            await attente(250);
            const cl = classer((await lec(pg)).text);
            lus.push(cl && cl.j !== undefined ? cl.j : null);
          }
          if (jours43.length < 2 || lus[0] !== jours43[0] || lus[1] !== jours43[1]) p('D43', 'toucher « ' + jours43.join(' j » puis « ') + ' j » donne ' + lus.map((x) => (x === null ? '?' : x + ' j')).join(' puis ') + ' : le jour de contact ne se règle pas');
        }
        await pg.close();
      }

      // ---- 5. D61 : la même course du doigt, lente puis d'un trait, donne le même moment ----
      {
        const lire2 = async (rapide) => {
          const pg = await ouvrirP(f);
          const a = await lec(pg);
          const dg = await doigtSur(pg, a, debut(a));
          await attente(150);
          const dep0 = debut(a), cible = a.poignee ? dep0 + 70 : a.deb + 14 + (a.lon - 28) * 0.3;
          if (rapide) { for (let i = 1; i <= 3; i++) { await dg.vers(dep0 + ((cible - dep0) * i) / 3); await attente(16); } }
          else { while (dg.a < cible) { await dg.vers(Math.min(cible, dg.a + 5)); await attente(16); } }
          await attente(160);
          const r = await lec(pg);
          await dg.lever();
          await pg.close();
          return r;
        };
        const lent = await lire2(false), vite = await lire2(true);
        jouee('D61');
        if (Math.abs(lent.now - vite.now) > 1) p('D61', 'la même course du doigt donne « ' + lent.text + ' » lentement et « ' + vite.text + ' » d\'un trait : le moment dépend de la vitesse du doigt');
      }

      // ---- 6. D42 : un geste interrompu rend le repos ----
      {
        const pg = await ouvrirP(f);
        const a = await lec(pg);
        const client = await pg.target().createCDPSession();
        const pt = (v) => (a.axe === 'x' ? { x: v, y: a.trans } : { x: a.trans, y: v });
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(debut(a))] });
        for (let i = 1; i <= 8; i++) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(debut(a) + i * 12)] }); await attente(25); }
        await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await attente(500);
        const r = await pg.evaluate(() => { const s = window.__rc.slider(); return { grads: window.__rc.grads().length, loupe: window.__rc.loupeVisible(), ombres: window.__rc.ombres(s) }; });
        jouee('D42');
        if (r.grads > repos.grads || (r.loupe && !repos.loupe)) p('D42', 'après un geste interrompu (touchcancel), l\'échelle reste ouverte (' + r.grads + ' graduation(s)' + (r.loupe ? ', loupe' : '') + ')');
        if (r.ombres.length > repos.ombres.length) p('D42', 'après un geste interrompu, ' + r.ombres.length + ' ombre(s) restent sur le rail');
        await pg.close();
      }

      // ---- 7. D69 : d'un seul geste, d'un bout à l'autre, sur des écrans de 620 et de 844 px de haut ----
      for (const H of [620, 844]) {
        const pg = await ouvrirP(f, { H });
        await pg.evaluate(() => window.__rc.slider().scrollIntoView({ block: 'center' }));
        await attente(250);
        const a = await lec(pg);
        jouee('D69');
        if (a.poignee) {
          // Un repère qui se déplace avec le moment : posé au premier puis au dernier cran (clavier), le doigt le prend au centre.
          await pg.close();
          for (const sens of ['avant', 'arrière']) {
            const q = await ouvrirP(f, { H });
            const [prev, next] = a.axe === 'x' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
            const but = sens === 'avant' ? 0 : a.max;
            for (let i = 0; i < 90; i++) { await q.evaluate(() => window.__rc.slider().focus()); const c = await lec(q); if (c.now === but) break; await q.keyboard.press(c.now > but ? prev : next); await attente(26); }
            await q.evaluate(() => window.__rc.slider().scrollIntoView({ block: 'center' }));
            await attente(250);
            const b = await lec(q);
            if (b.deb < -1 || b.deb + b.lon > b.ext + 1) { p('D69', 'écran de ' + H + ' px de haut : le repère du ' + (sens === 'avant' ? 'premier' : 'dernier') + ' cran est à ' + Math.round(b.deb) + ' px, hors de l\'écran même défilé'); await q.close(); continue; }
            const dg = await doigtSur(q, b, b.deb + b.lon / 2);
            await attente(120);
            const fin = sens === 'avant' ? b.ext - 6 : 6;
            while (Math.abs(fin - dg.a) > 0.5) { await dg.vers(dg.a + Math.sign(fin - dg.a) * Math.min(6, Math.abs(fin - dg.a))); await attente(14); }
            await attente(200);
            const r = await lec(q);
            await dg.lever();
            const vise = sens === 'avant' ? r.max : 0;
            if (r.now !== vise) p('D69', 'écran de ' + H + ' px de haut : d\'un geste du ' + (sens === 'avant' ? 'premier' : 'dernier') + ' cran (repère à ' + Math.round(b.deb + b.lon / 2) + ' px) au bord de l\'écran, le doigt tient « ' + r.text + ' » (cran ' + r.now + ' sur ' + r.max + ', ' + vise + ' visé) : l\'autre bout n\'est pas atteint');
            await q.close();
          }
          continue;
        }
        const hautDeb = a.axe === 'x' ? a.t : a.deb, hautFin = a.axe === 'x' ? a.t + 10 : a.deb + a.lon;
        if (hautDeb < -1 || hautFin > H + 1) { p('D69', 'écran de ' + H + ' px de haut : le rail est à ' + Math.round(hautDeb) + '–' + Math.round(hautFin) + ' px, hors de l\'écran même défilé'); await pg.close(); continue; }
        for (const sens of ['avant', 'arrière']) {
          const depart = sens === 'avant' ? a.deb + 14 : a.deb + a.lon - 14;
          const dg = await doigtSur(pg, a, depart);
          await attente(120);
          const fin = sens === 'avant' ? a.ext - 6 : 6;
          while (Math.abs(fin - dg.a) > 0.5) { await dg.vers(dg.a + Math.sign(fin - dg.a) * Math.min(6, Math.abs(fin - dg.a))); await attente(14); }
          await attente(200);
          const r = await lec(pg);
          await dg.lever();
          await attente(300);
          const vise = sens === 'avant' ? r.max : 0;
          if (r.now !== vise) p('D69', 'écran de ' + H + ' px de haut : d\'un geste du ' + (sens === 'avant' ? 'premier' : 'dernier') + ' cran au bord de l\'écran, le doigt tient « ' + r.text + ' » (cran ' + r.now + ' sur ' + r.max + ', ' + vise + ' visé) : l\'autre bout n\'est pas atteint');
          const fin2 = r.deb + r.lon;
          if (sens === 'avant' ? fin2 > r.ext + 1 : r.deb < -1) p('D69', 'écran de ' + H + ' px de haut : pendant le geste, le ' + (sens === 'avant' ? 'bas' : 'haut') + ' du rail sort de l\'écran (' + Math.round(r.deb) + ' à ' + Math.round(fin2) + ' px pour ' + Math.round(r.ext) + ')');
        }
        await pg.close();
      }

      // ---- 8. D27 à la souris, à 1280 px ----
      {
        const pg = await ouvrirP(f, { w: 1280, H: 900, tactile: false });
        const a = await lec(pg);
        if (!a) p('D27', 'à 1280 px, aucun rail repérable');
        else {
          const dg = await doigtSur(pg, a, debut(a), false);
          await attente(100);
          const vus = new Set([(await lec(pg)).now]);
          const fin = a.poignee ? Math.min(a.ext - 6, debut(a) + 300) : a.deb + a.lon - 14;
          while (dg.a < fin) { await dg.vers(Math.min(fin, dg.a + 6)); await attente(16); vus.add((await lec(pg)).now); }
          await dg.lever();
          jouee('D27');
          if (vus.size < 3) p('D27', 'à la souris (1280 px), un glissé complet ne prend que ' + vus.size + ' valeur(s)');
        }
        await pg.close();
      }

      // ---- 9. D36, D37 : la même recette avec une autre durée d'ébullition ----
      {
        const absents = [];
        for (const N of [45, 120]) {
          const cas = path.join(racine, id, 'cas-ebu' + N + '.html');
          if (!fs.existsSync(cas)) { absents.push('cas-ebu' + N + '.html'); continue; }
          const pg = await ouvrirP(cas);
          const e2 = await echelle(pg);
          await pg.close();
          jouee('D36', 'D37');
          const m2 = e2.filter((c) => c.seg === 0).map((c) => c.m);
          if (!m2.length || Math.max(...m2) !== N) p('D37', 'à ' + N + '′ d\'ébullition, le rail commence à ' + (m2.length ? Math.max(...m2) : '?') + '′ (' + N + '′ attendu) et ne doit rien porter au-delà');
          const cible = plusProche(e2, 0, 'm', Math.round((N * 0.75) / 5) * 5);
          if (cible) {
            const r = await lacher(cible.now, cas);
            if (!r.ok || (classer(r.text) || {}).m !== cible.m) p('D36', 'à ' + N + '′, la ligne ne se pose pas à ' + cible.m + '′ (« ' + r.text + ' »)');
          }
        }
        if (absents.length) infos.push('D36, D37 : non joués, ' + absents.join(' et ') + ' absent(s) : la maquette n\'a qu\'une ébullition de 60′ (à demander : une route ou un état d\'essai à 45′ et 120′, body data-ebullition)');
      }

      // ---- 10. Plusieurs houblons sur le même rail : D45, D56, D61 bis, D64 ----
      {
        const k3 = path.join(racine, id, 'cas-k3.html');
        const fm = fs.existsSync(k3) ? k3 : f;
        let pg = await ouvrirP(fm, { cle: null });
        const l0 = await pg.evaluate(() => window.__rc.lignes());
        await pg.close();
        if (l0.length < 2) infos.push('D45, D56, D61 bis, D64 : non joués, une seule poignée de houblon sur la page (à demander : un état d\'essai à plusieurs houblons, cas-k3.html)');
        else {
          const cleT = l0[0].cle;
          pg = await ouvrirP(fm, { cle: cleT });
          const a = await lec(pg);
          const dg = await doigtSur(pg, a, debut(a));
          await attente(150);
          const rel = () => pg.evaluate(() => { const L = window.__rc.lecture(); return { lignes: window.__rc.lignes(), noeuds: window.__rc.noeuds(), autres: window.__rc.chevauchements('hors-carte'), reg: window.__rc.regularite(), text: L.text, now: L.now }; });
          let prec = await rel();
          const repos10 = prec;
          jouee('D45', 'D56', 'D61 bis', 'D64');
          const f10 = { bis: null, saut: null, cote: null, segment: null, chev: null };
          let regPire = null, regVu = false;
          for (let i = 0; i < 70; i++) {
            const av = dg.a;
            await dg.vers(Math.min(a.ext - 6, dg.a + 10));
            if (dg.a === av) break;
            await attente(30);
            const cur = await rel();
            const cT = classer(cur.text);
            if (cur.now < prec.now) f10.bis = f10.bis || 'le moment tenu passe de « ' + prec.text + ' » à « ' + cur.text + ' » en avançant de 10 px';
            else if (cur.now - prec.now > 2) f10.bis = f10.bis || 'le moment tenu saute de ' + (cur.now - prec.now) + ' crans en 10 px (« ' + prec.text + ' » → « ' + cur.text + ' »)';
            for (const l of cur.lignes.filter((x) => x.cle !== cleT)) {
              const avant = prec.lignes.find((x) => x.cle === l.cle), depart = repos10.lignes.find((x) => x.cle === l.cle);
              if (avant && Math.abs(l.pos - avant.pos) > 24) f10.saut = f10.saut || l.cle + ' (« ' + l.text + ' ») bondit de ' + Math.round(l.pos - avant.pos) + ' px en un pas de 10 px, le moment tenu étant « ' + cur.text + ' »';
              if (depart && Math.abs(l.trans - depart.trans) > 8) f10.cote = f10.cote || l.cle + ' (« ' + l.text + ' ») saute de côté de ' + Math.round(l.trans - depart.trans) + ' px quand le moment tenu passe à « ' + cur.text + ' »';
              const c = classer(l.text), n = cur.noeuds;
              const hors = !c ? null
                : c.seg === 0 && n.wp !== undefined && l.pos > n.wp + 4 ? 'sous le whirlpool'
                : c.seg === 1 && ((n.wp !== undefined && l.pos < n.wp - 4) || (n.ferm !== undefined && l.pos > n.ferm + 4)) ? 'hors du whirlpool'
                : c.seg === 2 && ((n.ferm !== undefined && l.pos < n.ferm - 4) || (n.post !== undefined && l.pos > n.post + 4)) ? 'hors de la fermentation'
                : c.seg === 3 && n.post !== undefined && l.pos < n.post - 4 ? 'au-dessus de la post-fermentation' : null;
              if (hors) f10.segment = f10.segment || l.cle + ' (« ' + l.text + ' ») sort de son segment (' + hors + ') quand le moment tenu passe à « ' + cur.text + ' »';
            }
            if (cur.autres.length) f10.chev = f10.chev || cur.autres.length + ' chevauchement(s) de textes du rail hors de la carte tenue (« ' + cur.text + ' ») : ' + cur.autres.slice(0, 2).join(' ; ');
            if (cT && cT.seg === 0 && cur.reg) { regVu = true; if (!regPire || cur.reg.cv > regPire.cv) regPire = { ...cur.reg, text: cur.text }; }
            prec = cur;
          }
          await dg.lever();
          await pg.close();
          if (f10.bis) p('D61 bis', 'à plusieurs houblons, en descendant par pas de 10 px, ' + f10.bis);
          if (f10.saut) p('D61 bis', 'à plusieurs houblons, ' + f10.saut + ' : l\'échelle ne tient pas quand on passe sur un autre houblon');
          if (f10.cote) p('D64', f10.cote + ' : un houblon déjà posé reste à sa place');
          if (f10.segment) p('D64', f10.segment);
          if (f10.chev) p('D56', 'à plusieurs houblons, pendant le geste, ' + f10.chev);
          if (regVu && regPire.cv > 0.25) p('D45', 'les crans de l\'ébullition voisins du doigt sont irréguliers (écarts de ' + Math.round(regPire.mini) + ' à ' + Math.round(regPire.maxi) + ' px, écart-type ÷ moyenne ' + regPire.cv.toFixed(2) + ', 0,25 au plus), tenu à « ' + regPire.text + ' »');
          if (!regVu) infos.push('D45 : non joué, aucun cran [data-cran] en bulle autour du doigt dans l\'ébullition (graduations sur le rail : la loupe les déforme volontairement, D63)');
        }
      }
    } catch (e) {
      if (e instanceof Arret) { /* rail inerte : déjà dit */ } else pb.push('D27 : ' + id + ', le contrôle n\'a pas pu jouer le rail (' + String(e && e.message ? e.message : e).slice(0, 120) + ')');
    }
    console.log(id + ' · ' + defauts.size + ' règles jouées');
    for (const x of infos) console.log('  non joué : ' + x);
    if (!pb.length) sains += 1;
    probs.push(...pb);
  }
  await nav.close();
  if (!total) probs.push('RAIL : aucune page à lire (donner au moins un id de route après le dossier) : ce contrôle ne garde rien ici');
  if (!probs.length) console.log('RAIL OK ' + sains + '/' + total);
  else { console.log('RAIL ECHEC ' + probs.length + ' problème(s)'); for (const x of probs) console.log('  ' + x); }
  return probs.length ? 1 : 0;
}
if (PARCOURS) process.exit(await modeParcours());


const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const STANDARD = new Set([60, 30, 15, 10, 5, 0]);

// État : la ligne (clé, moment, IBU, poignée) et les étapes VISIBLES du rail.
const etat = (page, cle) => page.evaluate((cle) => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
  const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"]')];
  const l = cle ? lignes.find((x) => x.querySelector('[data-houblon="' + cle + '"]') || x.getAttribute('data-houblon') === cle) : lignes[0];
  const etapes = [...document.querySelectorAll('[data-etape]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { code: e.getAttribute('data-etape'), grad: e.getAttribute('data-graduation'), y: r.top + r.height / 2, levure: !!(e.matches('[data-role="levure"]') || e.querySelector('[data-role="levure"]')) }; });
  if (!l) return { etapes };
  const h = l.querySelector('[data-role="glisser-moment"]') || (l.matches('[data-role="glisser-moment"]') ? l : null);
  const hr = h ? h.getBoundingClientRect() : null;
  const q = l.querySelector('[data-role="quand"]');
  const ibu = (l.innerText.match(/(\d+([,.]\d+)?)\s*IBU|aucun IBU|sans IBU/i) || [''])[0];
  const k = l.querySelector('[data-houblon]')?.getAttribute('data-houblon') || l.getAttribute('data-houblon');
  return { cle: k, quand: q ? q.innerText.trim() : null, ibu, top: l.getBoundingClientRect().top, poignee: hr ? { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2 } : null, etapes };
}, cle);

// Un geste comme celui du brasseur : poser, attendre la loupe, aller vers une graduation (sa
// position est relue à chaque pas, la loupe pouvant la déplacer), lâcher.
async function poser(page, mode) {
  const a = await etat(page);
  if (!a.poignee) return null;
  let y = a.poignee.y;
  const x = a.poignee.x;
  let t = null;
  if (mode === 'souris') { await page.mouse.move(x, y); await page.mouse.down(); }
  else t = await page.touchscreen.touchStart(x, y);
  const bouger = async (ny) => { y = ny; if (t) await t.move(x, y); else await page.mouse.move(x, y); await wait(25); };
  await bouger(y + 3);
  await wait(200);
  return {
    a, x, get y() { return y; }, bouger,
    async vers(code) {
      for (let i = 0; i < 200; i++) {
        const e = (await etat(page)).etapes.find((s) => s.code === code);
        if (!e) {
          // Graduation encore cachée : approcher de l'étape nommée de son segment, ou descendre.
          const seg = /^wp\d/.test(code) ? 'wp' : /^f\d/.test(code) ? 'dryActive' : /^p\d/.test(code) ? 'dryPost' : null;
          const s = seg && (await etat(page)).etapes.find((q) => q.code === seg);
          await bouger(s ? y + Math.sign(s.y + 6 - y) * Math.min(10, Math.abs(s.y + 6 - y)) : y + 6);
          continue;
        }
        const dy = e.y - y;
        if (Math.abs(dy) < 1.5) return true;
        await bouger(y + Math.sign(dy) * Math.min(8, Math.abs(dy)));
      }
      return false;
    },
    async lacher() { if (t) await t.end(); else await page.mouse.up(); await wait(450); },
  };
}
async function lacherSur(page, code, mode = 'doigt') {
  const g = await poser(page, mode);
  if (!g) return { ok: false, apres: null, avant: null };
  const ok = await g.vers(code);
  await g.lacher();
  return { ok, avant: g.a, apres: await etat(page, g.a.cle) };
}
const minute = (q) => { const m = (q || '').match(/(\d+)\s*(′|'|min)/); return m ? Number(m[1]) : null; };

// D35 : propreté du geste (le doigt posé, puis après le lâcher).
const propre = (page) => page.evaluate(() => {
  const out = [];
  const g = document.querySelector('[data-glisse]');
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.2; };
  const feuilles = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  if (g) {
    const r = g.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(14, r.height / 2));
    if (top && !g.contains(top)) out.push('la ligne glissée passe sous un autre élément');
    const caches = feuilles.filter((e) => !g.contains(e)).filter((e) => { const b = e.getBoundingClientRect(); return inter(r, b) > 0.3 * b.width * b.height; });
    if (caches.length) out.push('la ligne glissée cache ' + caches.length + ' texte(s) (« ' + caches[0].innerText.trim().slice(0, 18) + ' ») au lieu de se faire une place');
  }
  const libres = feuilles.filter((e) => !g || !g.contains(e));
  let chev = 0, ex = '';
  for (let i = 0; i < libres.length; i++) for (let j = i + 1; j < libres.length; j++) {
    const a = libres[i], b = libres[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if (inter(ra, rb) > 0.3 * Math.min(ra.width * ra.height, rb.width * rb.height)) { chev++; ex = ex || a.innerText.trim().slice(0, 10) + ' / ' + b.innerText.trim().slice(0, 10); }
  }
  if (chev) out.push(chev + ' chevauchement(s) de textes (' + ex + ')');
  const et = [...document.querySelectorAll('[data-etape]')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0);
  if (et.length) {
    const y0 = Math.max(0, Math.min(...et.map((r) => r.top))), y1 = Math.min(innerHeight, Math.max(...et.map((r) => r.bottom)));
    const rows = new Uint8Array(Math.max(0, Math.ceil(y1 - y0)));
    for (const e of [...feuilles, ...document.querySelectorAll('[data-role="ligne-houblon"], [data-role="ajout-rapide"], input, [data-etape], [data-etape] > *')]) { const b = e.getBoundingClientRect(); if (!b.height) continue; for (let y = Math.max(y0, Math.floor(b.top)); y < Math.min(y1, Math.ceil(b.bottom)); y++) rows[y - Math.floor(y0)] = 1; }
    let run = 0, max = 0; for (const v of rows) { run = v ? 0 : run + 1; max = Math.max(max, run); }
    if (max > 64) out.push('vide de ' + max + ' px dans la colonne du rail');
  }
  return out;
});
const ombre = (page) => page.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"], [data-glisse]')].filter((e) => getComputedStyle(e).boxShadow !== 'none').length);
const gradsVisibles = (page) => page.evaluate(() => [...document.querySelectorAll('[data-graduation]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; }).map((e) => { const r = e.getBoundingClientRect(); return { seg: e.getAttribute('data-graduation'), code: e.getAttribute('data-etape'), y: r.top + r.height / 2 }; }));

async function ouvrir(f, w = 390, H = 844) {
  const page = await browser.newPage();
  if (w === 390) await page.setViewport({ width: 390, height: H, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  else await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  return page;
}

for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const index = path.join(dir, id, 'index.html');
  let page = await ouvrir(index);
  const recharger = async () => { await page.close(); page = await ouvrir(index); };
  const e = await etat(page);
  if (!e.cle) { p('D27 : aucune ligne de houblon repérable (data-role="ligne-houblon" et data-houblon)'); await page.close(); continue; }
  if (!e.poignee) { p('D27 : pas de poignée data-role="glisser-moment" sur la première ligne'); await page.close(); continue; }
  const y = (c) => e.etapes.find((x) => x.code === c)?.y;
  // D28 : la levure, étape du rail entre le whirlpool et la fermentation.
  const lev = e.etapes.find((x) => x.code === 'levure');
  if (!lev) p('D28 : la levure n\'est pas une étape du rail (data-etape="levure")');
  else {
    if (!lev.levure) p('D28 : l\'étape levure du rail ne porte pas la levure (data-role="levure")');
    if (y('wp') === undefined || y('dryActive') === undefined) p('D28 : le rail ne montre pas le whirlpool (wp) et la fermentation (dryActive) autour de la levure');
    else if (!(y('wp') < lev.y && lev.y < y('dryActive'))) p('D28 : la levure n\'est pas entre le whirlpool et la fermentation');
  }
  // D47 : au repos, aucune graduation ; D41 : le rail ne porte que la recette ; D42 : pas d'ombre.
  const repos = await gradsVisibles(page);
  if (repos.length) p('D47 : au repos, ' + repos.length + ' graduation(s) visibles : l\'échelle ne s\'ouvre que sous le doigt');
  const r41 = await page.evaluate(() => {
    const out = [];
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const dansRail = [...document.querySelectorAll('[data-role="ajout-rapide"]')].filter(vis).filter((a) => a.closest('[data-etape]'));
    if (dansRail.length) out.push(dansRail.length + ' ajout(s) proposé(s) rangé(s) dans une étape du rail');
    const quand = new Set([...document.querySelectorAll('[data-role="ligne-houblon"] [data-role="quand"]')].map((q) => (q.innerText.match(/(\d+)\s*(′|')/) || [])[1]).filter(Boolean).map(Number));
    const eb = (document.querySelector('[data-role="ebullition"]')?.innerText.match(/(\d+)\s*(′|')/) || [])[1];
    if (eb) quand.add(Number(eb));
    quand.add(0);
    const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"], [data-role="ajout-rapide"]')];
    const libres = [...document.querySelectorAll('[data-etape], [data-etape] *')].filter(vis).filter((x) => !lignes.some((l) => l.contains(x)))
      .filter((x) => [...x.childNodes].some((n) => n.nodeType === 3 && /^\s*\d+\s*(′|')\s*$/.test(n.textContent)))
      .map((x) => Number(x.innerText.match(/\d+/)[0])).filter((m) => !quand.has(m));
    if (libres.length) out.push('minute(s) écrite(s) sur le rail sans ligne de la recette : ' + [...new Set(libres)].map((m) => m + '′').join(', '));
    return out;
  });
  for (const x of r41) p('D41 : ' + x);
  if (await ombre(page)) p('D42 : au repos, une carte du rail porte une ombre');
  // D37 : l'ébullition lue dans la recette, avec un renvoi.
  const eb = await page.evaluate(() => {
    const el = document.querySelector('[data-role="ebullition"]');
    if (!el) return null;
    return { valeur: /\d+\s*(′|'|min)/.test(el.innerText), champ: !!el.querySelector('input, select, textarea') || el.matches('input'), plusMoins: !!document.querySelector('[data-action="ebullition-plus"], [data-action="ebullition-moins"]'), renvoi: !!(el.querySelector('a, [data-action="renvoi-ebullition"]') || el.matches('a, [data-action="renvoi-ebullition"]')) };
  });
  if (!eb) p('D37 : la durée d\'ébullition de la recette n\'est pas affichée sur l\'étape (data-role="ebullition")');
  else {
    if (!eb.valeur) p('D37 : data-role="ebullition" ne dit pas la durée (« 60′ »)');
    if (eb.champ || eb.plusMoins) p('D37 : l\'ébullition se modifie sur l\'étape alors qu\'elle est « defini ailleur dans l\'application » : un renvoi suffit');
    if (!eb.renvoi) p('D37 : pas de renvoi vers l\'endroit où se règle l\'ébullition');
  }

  // D47, D45, D35, D46, D55 pendant un même geste dans l'ébullition.
  {
    // D55 (18.10, soir, capture de la base v4 entourée) : « Ça semble un peu étrange d'avoir autant
    // d'espace, j'avais dit à la apple en mode zoom loop ». Une loupe grossit le voisinage du doigt ;
    // le reste du rail reste compact et presque à sa place. Pendant le geste : aucun vide de plus de
    // 80 px entre deux éléments du rail, et le premier ajout proposé (sous le rail) ne descend pas de
    // plus de 120 px.
    const releve = () => page.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.15 && (!e.checkVisibility || e.checkVisibility({ opacityProperty: true, visibilityProperty: true })); };
      const items = [...document.querySelectorAll('[data-etape], [data-role="ligne-houblon"], [data-role="levure"]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY }; }).sort((a, b) => a.top - b.top);
      let fin = -Infinity, vide = 0;
      for (const it of items) { if (fin > -Infinity) vide = Math.max(vide, it.top - fin); fin = Math.max(fin, it.bottom); }
      const a = [...document.querySelectorAll('[data-role="ajout-rapide"]')].find(vis);
      return { vide, apres: a ? a.getBoundingClientRect().top + scrollY : null };
    });
    const auRepos = await releve();
    const g = await poser(page, 'doigt');
    const pendant = await gradsVisibles(page);
    const eb5 = pendant.filter((x) => x.seg === 'ebullition');
    if (eb5.length < 6) p('D47 : le doigt posé dans l\'ébullition, l\'échelle des minutes ne s\'ouvre pas (' + eb5.length + ' graduation(s) visibles)');
    if (pendant.some((x) => x.seg && x.seg !== 'ebullition')) p('D47 : pendant le geste dans l\'ébullition, des graduations d\'autres segments restent ouvertes (pas de focus)');
    const enGeste = await releve();
    if (enGeste.vide > 80) p('D55 : pendant le geste, un vide de ' + Math.round(enGeste.vide) + ' px dans le rail (80 au plus) : la loupe grossit le voisinage du doigt, elle n\'étire pas le rail');
    if (auRepos.apres !== null && enGeste.apres !== null && enGeste.apres - auRepos.apres > 120) p('D55 : pendant le geste, les ajouts proposés descendent de ' + Math.round(enGeste.apres - auRepos.apres) + ' px (120 au plus) : le reste du rail doit rester compact');
    // D45 : régularité mesurée sur les 5 graduations voisines du doigt (une loupe resserre au loin).
    const proches = [...eb5].sort((a, b) => Math.abs(a.y - g.y) - Math.abs(b.y - g.y)).slice(0, 5);
    if (proches.length >= 4) {
      const tri = [...proches].sort((a, b) => a.y - b.y);
      const gaps = tri.slice(1).map((t, i) => t.y - tri[i].y).filter((d) => d > 0);
      const m = gaps.reduce((s, d) => s + d, 0) / gaps.length, sd = Math.sqrt(gaps.reduce((s, d) => s + (d - m) ** 2, 0) / gaps.length);
      if (m > 0 && sd / m > 0.25) p('D45 : échelle d\'ébullition irrégulière sous le doigt (' + Math.round(Math.min(...gaps)) + ' à ' + Math.round(Math.max(...gaps)) + ' px)');
    }
    if (!(await page.$('[data-glisse]'))) p('D35 : pendant le glissement, rien ne porte data-glisse (l\'élément qui suit le doigt)');
    // D46 : la carte suit le doigt.
    const haut = () => page.evaluate(() => { const x = document.querySelector('[data-glisse]'); return x ? x.getBoundingClientRect().top : null; });
    let prec = await haut(), bouge = 0, ecarts = [];
    for (let i = 1; i <= 10; i++) { await g.bouger(g.y + 6); await wait(15); const h = await haut(); if (h !== null && prec !== null) { if (Math.abs(h - prec) > 0.5) bouge++; ecarts.push(h - prec - 6); } prec = h; }
    if (!ecarts.length) p('D46 : impossible de suivre la carte (rien ne porte data-glisse)');
    else { const pire = Math.max(...ecarts.map(Math.abs)); if (bouge < 9 || pire > 4) p('D46 : la carte ne suit pas le doigt (' + bouge + ' mouvements sur 10, écart jusqu\'à ' + Math.round(pire) + ' px) : geste saccadé'); }
    for (const x of await propre(page)) p('D35 pendant : ' + x);
    await g.lacher();
    for (const x of await propre(page)) p('D35 après : ' + x);
    if ((await gradsVisibles(page)).length) p('D47 : après le lâcher, l\'échelle reste ouverte');
  }
  // D27, D34 : poser à 45′ puis à 20′ (tranches libres), le moment et l'IBU suivent.
  await recharger();
  const r45 = await lacherSur(page, 'b45');
  await recharger();
  const r20 = await lacherSur(page, 'b20');
  if (!r45.ok || !r20.ok) p('D34 : le doigt n\'atteint pas les graduations 45′ et 20′ (data-etape="b45", "b20" pendant le geste)');
  else {
    const m45 = minute(r45.apres.quand), m20 = minute(r20.apres.quand);
    if (m45 !== 45 || m20 !== 20) p('D34 : lâchée sur 45′ puis 20′, la ligne dit « ' + r45.apres.quand + ' » puis « ' + r20.apres.quand + ' »');
    if (r45.apres.ibu === r45.avant.ibu) p('D27 : le moment change mais pas les IBU de la ligne (' + r45.avant.ibu + ')');
    if (r45.apres.ibu === r20.apres.ibu) p('D34 : 45′ et 20′ donnent le même IBU (' + r20.apres.ibu + ')');
  }
  // D44 : whirlpool (85 °C / 70 °C) puis fermentation (J+2 / J+6).
  for (const [c1, c2, re, nom] of [['wp85', 'wp70', /(\d+)\s*°C/, 'whirlpool'], ['f2', 'f6', /J\s*\+\s*(\d+)/i, 'fermentation']]) {
    await recharger();
    const a1 = await lacherSur(page, c1);
    await recharger();
    const a2 = await lacherSur(page, c2);
    if (!a1.ok || !a2.ok) { p('D44 : le doigt n\'atteint pas les graduations ' + c1 + ' et ' + c2 + ' du segment ' + nom + ' (pas d\'échelle sous le doigt)'); continue; }
    const v1 = (a1.apres.quand || '').match(re), v2 = (a2.apres.quand || '').match(re);
    if (!v1 || !v2) p('D44 : lâchée dans le segment ' + nom + ', la ligne ne dit pas son réglage (« ' + a1.apres.quand + ' », « ' + a2.apres.quand + ' »)');
    else if (v1[0] === v2[0]) p('D44 : deux graduations du segment ' + nom + ' donnent le même réglage (« ' + v1[0] + ' ») : choix figé');
  }
  // D42 : geste interrompu.
  await recharger();
  {
    const client = await page.target().createCDPSession();
    const a = await etat(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.poignee.x, y: a.poignee.y }] });
    for (let i = 1; i <= 8; i++) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.poignee.x, y: a.poignee.y + i * 12 }] }); await wait(25); }
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await wait(500);
    if (await page.$('[data-glisse]')) p('D42 : après un geste interrompu (touchcancel), la carte reste soulevée');
    if (await ombre(page)) p('D42 : après un geste interrompu, une carte garde son ombre');
  }
  await page.close();
  // D27 à la souris, à 1280.
  {
    const d = await ouvrir(index, 1280);
    const r = await lacherSur(d, 'b30', 'souris');
    if (!r.ok || minute(r.apres?.quand) !== 30) p('D27 (1280 px, à la souris) : glisser vers 30′ ne pose pas la ligne à 30′ (« ' + (r.apres?.quand || '') + ' »)');
    await d.close();
  }
  // D36, D37 : la même recette à 45′, 120′, 200′ d'ébullition.
  for (const [c, cible] of [[45, null], [120, 'b90'], [200, 'b150']]) {
    const f = path.join(dir, id, 'cas-ebu' + c + '.html');
    if (!fs.existsSync(f)) { p('D37 : cas-ebu' + c + '.html absente (la même recette avec une ébullition de ' + c + '′)'); continue; }
    const q = await ouvrir(f);
    const dom = await q.evaluate((c) => ({ debut: !!document.querySelector('[data-etape="b' + c + '"]'), audela: [...document.querySelectorAll('[data-etape^="b"]')].map((e) => Number(e.getAttribute('data-etape').slice(1))).filter((m) => m > c).length }), c);
    if (!dom.debut) p('D37 : à ' + c + '′ d\'ébullition, le rail ne commence pas à ' + c + '′ (data-etape="b' + c + '")');
    if (dom.audela) p('D37 : à ' + c + '′, le rail a des graduations au-delà de ' + c + '′');
    if (c === 45) { const m = minute((await etat(q)).quand); if (m !== null && m > 45) p('D37 : à 45′, la première ligne reste à ' + m + '′'); }
    if (cible) {
      const r = await lacherSur(q, cible);
      if (!r.ok || minute(r.apres?.quand) !== Number(cible.slice(1))) p('D36 : à ' + c + '′, la ligne ne se pose pas à ' + cible.slice(1) + '′ (« ' + (r.apres?.quand || '') + ' »)');
    }
    await q.close();
  }
  // D43 : le jour de l'ajout à froid se règle (recette chargée).
  const k3 = path.join(dir, id, 'cas-k3.html');
  if (fs.existsSync(k3)) {
    const q = await ouvrir(k3);
    const jour = () => q.evaluate(() => { const l = [...document.querySelectorAll('[data-role="ligne-houblon"]')].find((x) => /J\s*\+\s*\d+/.test(x.innerText)); const m = l && l.innerText.match(/J\s*\+\s*(\d+)/); return m ? Number(m[1]) : null; });
    const j0 = await jour();
    if (j0 === null) p('D43 : cas-k3.html sans ajout à froid daté (J+N)');
    else for (const [action, attendu] of [['jour-plus', j0 + 1], ['jour-moins', j0]]) {
      const b = await q.$('[data-role="ligne-houblon"] [data-action="' + action + '"]');
      if (!b) { p('D43 : pas de geste data-action="' + action + '" sur la ligne à froid'); break; }
      try { await b.tap(); } catch { await b.click(); }
      await wait(350);
      const j = await jour();
      if (j !== attendu) { p('D43 : « ' + action + ' » laisse le jour à J+' + j + ' (J+' + attendu + ' attendu)'); break; }
    }
    await q.close();
  }
  // D56 (18.10, soir, sa capture à deux houblons : « 0′ » et « Nugget » l'un sur l'autre) : « Avec
  // deux houblons ça marche aussi un peu moins bien ». Recette à plusieurs houblons (cas-k3) : la
  // première ligne descend dans l'ébullition par pas de 10 px ; à chaque pas, aucun texte du rail
  // (graduations, étapes, autres lignes) n'en chevauche un autre, hors de la carte qui suit le doigt.
  if (fs.existsSync(k3)) {
    const q = await ouvrir(k3);
    const chevauche = () => q.evaluate(() => {
      const glisse = document.querySelector('[data-glisse]');
      const vus = new Set(), rects = [];
      for (const z of document.querySelectorAll('[data-etape], [data-role="ligne-houblon"], [data-role="levure"]')) {
        const w = document.createTreeWalker(z, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (vus.has(n) || !n.textContent.trim()) continue;
          vus.add(n);
          const el = n.parentElement;
          if (!el || (glisse && glisse.contains(el))) continue;
          if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
          const r = document.createRange(); r.selectNodeContents(n);
          for (const b of r.getClientRects()) if (b.width > 1 && b.height > 1) rects.push({ t: n.textContent.trim().slice(0, 14), el, x0: b.left, x1: b.right, y0: b.top, y1: b.bottom });
        }
      }
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.el === b.el) continue;
        if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 2 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 2) return '« ' + a.t + ' » sur « ' + b.t + ' »';
      }
      return null;
    });
    const g = await poser(q, 'doigt');
    if (g) {
      let vu = null;
      for (let i = 0; i < 40 && !vu; i++) { await g.bouger(g.y + 10); await wait(20); vu = await chevauche(); }
      await g.lacher();
      if (vu) p('D56 : cas-k3.html, pendant le geste, ' + vu + ' (textes du rail l\'un sur l\'autre)');
    } else p('D56 : cas-k3.html, aucune ligne à saisir');
    await q.close();
  }
  // D61 (18.10, soir, ses deux captures de la base v4.1 au téléphone) : « on est à 35' et on a
  // l'impression d'être quasiment à 60' » ; « Aussi les deux sont à 25' mais on dirait que l'autre
  // est à 0' ». Pendant le geste dans l'ébullition, la hauteur dit le temps : chaque houblon de
  // l'ébullition (celui qu'on tient et les autres) est à sa place entre le début (E′) et 0′, à
  // 12 % de la descente près ; deux houblons au même moment sont à la même hauteur.
  {
    const place = (q, cleTenue) => q.evaluate((cleTenue) => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
      const yc = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
      const ebEl = document.querySelector('[data-role="ebullition"]');
      const E = Number(((ebEl && ebEl.innerText) || '').match(/(\d+)\s*(′|'|min)/)?.[1] || 60);
      const tete = [...document.querySelectorAll('[data-etape="b' + E + '"]')].find(vis) || ebEl;
      const zero = [...document.querySelectorAll('[data-etape="b0"]')].find(vis)
        || [...document.querySelectorAll('[data-etape] *, [data-etape]')].filter(vis).find((e) => /^\s*0\s*(′|')\s*$/.test(e.innerText || ''));
      if (!tete || !zero) return { E, err: 'début ' + (tete ? 'vu' : 'introuvable') + ', 0′ ' + (zero ? 'vu' : 'introuvable') };
      const y0 = yc(tete), y1 = yc(zero);
      const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => {
        const k = l.querySelector('[data-houblon]')?.getAttribute('data-houblon') || l.getAttribute('data-houblon');
        const h = l.querySelector('[data-role="glisser-moment"]') || l;
        const q = l.querySelector('[data-role="quand"]');
        const m = ((q && q.innerText) || h.innerText || '').match(/^\s*(\d+)\s*(′|')/);
        return { k, tenue: k === cleTenue, t: m ? Number(m[1]) : null, y: vis(h) ? yc(h) : null };
      });
      return { E, y0, y1, lignes };
    }, cleTenue);
    const juger = (cas, r, tTenue) => {
      if (r.err) { p('D61 : ' + cas + ', ' + r.err + ' pendant le geste'); return; }
      const L = r.y1 - r.y0;
      if (L <= 0) { p('D61 : ' + cas + ', 0′ n\'est pas sous le début de l\'ébullition'); return; }
      for (const l of r.lignes) {
        const t = l.tenue ? tTenue : l.t;
        if (t === null || t > r.E || l.y === null) continue;
        const f = (l.y - r.y0) / L, att = (r.E - t) / r.E;
        if (Math.abs(f - att) > 0.12) p('D61 : ' + cas + ', ' + l.k + (l.tenue ? ' (tenu)' : '') + ' à ' + t + '′ est placé aux ' + Math.round(f * 100) + ' % de la descente ' + r.E + '′ → 0′ (' + Math.round(att * 100) + ' % attendus) : la hauteur ne dit plus le temps');
      }
    };
    const q1 = await ouvrir(index);
    const g1 = await poser(q1, 'doigt');
    let descente = null;
    if (g1 && await g1.vers('b35')) {
      juger('index, tenu à 35′', await place(q1, g1.a.cle), 35); descente = g1.y - g1.a.poignee.y;
      // D63 (18.10, soir, base v4.2 : « Ça fait pas zoom focus sur l'emplacement ») : une loupe
      // sous le doigt, mesurée ici où rien ne s'intercale dans l'ébullition : une bulle
      // [data-role="loupe"] qui écrit au moins 5 minutes, ou une tranche de 5′ au moins 2 fois
      // plus haute (et de 12 px au moins) près du doigt qu'au loin (médiane, à 20′ et plus).
      const lp = await q1.evaluate(() => {
        const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
        const bulle = [...document.querySelectorAll('[data-role="loupe"]')].find(vis);
        const grads = Object.fromEntries([...document.querySelectorAll('[data-graduation="ebullition"]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return [Number((e.getAttribute('data-etape') || '').slice(1)), r.top + r.height / 2]; }));
        return { minutesBulle: bulle ? (bulle.innerText.match(/\d+\s*(′|')/g) || []).length : 0, grads };
      });
      if (lp.minutesBulle < 5) {
        const pas = Object.keys(lp.grads).map(Number).filter((m) => lp.grads[m - 5] !== undefined).map((m) => ({ m: m - 2.5, d: Math.abs(lp.grads[m - 5] - lp.grads[m]) }));
        const pres = pas.filter((x) => Math.abs(x.m - 35) <= 5), loin = pas.filter((x) => Math.abs(x.m - 35) >= 20);
        if (!pres.length || !loin.length) p('D63 : index, tenu à 35′, pas de loupe mesurable (' + pas.length + ' tranches de 5′ visibles, aucune bulle data-role="loupe")');
        else {
          const s = loin.map((x) => x.d).sort((u, v) => u - v), dl = s[Math.floor(s.length / 2)], dp = Math.min(...pres.map((x) => x.d));
          if (!(dp >= 12 && dp >= 2 * dl)) p('D63 : index, tenu à 35′, pas de loupe : une tranche de 5′ fait ' + Math.round(dp) + ' px sous le doigt et ' + Math.round(dl) + ' px au loin (2 fois plus et 12 px au moins), aucune bulle data-role="loupe"');
        }
      }
    }
    else p('D61 : index, le doigt n\'atteint pas 35′');
    if (g1) await g1.lacher();
    await q1.close();
    // La même descente du doigt, d'un trait (trois bonds) : le même point du rail doit donner le
    // même moment, quelle que soit la vitesse du doigt (± 5′).
    if (descente !== null) {
      const q3 = await ouvrir(index);
      const g3 = await poser(q3, 'doigt');
      if (g3) {
        const y0 = g3.y;
        for (let i = 1; i <= 3; i++) { await g3.bouger(y0 + (descente * i) / 3); await wait(16); }
        await wait(150);
        const lu = await q3.evaluate((cle) => { const l = [...document.querySelectorAll('[data-role="ligne-houblon"]')].find((x) => x.querySelector('[data-houblon="' + cle + '"]')); const q = l && l.querySelector('[data-role="quand"]'); return q ? q.innerText.trim() : null; }, g3.a.cle);
        const m = (lu || '').match(/^(\d+)\s*(′|')/);
        if (!m || Math.abs(Number(m[1]) - 35) > 5) p('D61 : index, la même descente du doigt (' + Math.round(descente) + ' px) donne 35′ lentement et « ' + lu + ' » d\'un trait : le moment dépend de la vitesse du doigt');
        else juger('index, d\'un trait jusqu\'à ' + m[1] + '′', await place(q3, g3.a.cle), Number(m[1]));
        await g3.lacher();
      }
      await q3.close();
    }
    if (fs.existsSync(k3)) {
      const q2 = await ouvrir(k3);
      const g2 = await poser(q2, 'doigt');
      if (g2) {
        for (const [code, t] of [['b35', 35], ['b10', 10]]) {
          if (await g2.vers(code)) juger('cas-k3, tenu à ' + t + '′', await place(q2, g2.a.cle), t);
          else p('D61 : cas-k3, le doigt n\'atteint pas ' + t + '′');
        }
        await g2.lacher();
      }
      await q2.close();
    }
  }
  // D67 (19.10, au téléphone, base v4.5 : Nugget glissé de 60′ jusqu'au whirlpool, à 75 °C) :
  // « L'échelle ne s'adapte pas ni de focus, pas là où je suis. L'échelle ébullition est très grande
  // alors que celle où l'on est, Whirlpool, est toute petite ». Le doigt passé dans un autre segment,
  // ce segment devient la loupe : une tranche sous le doigt (deux graduations voisines du doigt) fait
  // au moins 2 fois une tranche du segment quitté (sa descente ÷ ses intervalles) et 12 px au moins.
  // D68 (19.10, au téléphone, base v4.6 : Nugget glissé à J+2, la tête du rail descendue de 220 px
  // sous la barre d'IBU) : « Toujours un petit soucis... ». Le rail ne se détache pas du haut : quand la
  // loupe passe dans un segment plus bas, la tête de l'ébullition reste à 40 px au plus de sa place au repos.
  {
    const q = await ouvrir(index);
    const tete = () => q.evaluate(() => { const e = document.querySelector('[data-rang="T-ebu"]'); if (!e) return null; const r = e.getBoundingClientRect(); return r.top + r.height / 2; });
    const t0 = await tete();
    const g = await poser(q, 'doigt');
    for (const [code, lib] of [['wp75', '75 °C'], ['f2', 'J+2']]) {
      if (!g || !(await g.vers(code))) { p('D68 : index, le doigt n\'atteint pas ' + lib); break; }
      await wait(250);
      const t = await tete();
      if (t0 !== null && t !== null && Math.abs(t - t0) > 40) p('D68 : index, Nugget glissé à ' + lib + ' : la tête du rail bouge de ' + Math.round(t - t0) + ' px (40 au plus) : un vide s\'ouvre au-dessus du rail');
    }
    if (g) await g.lacher();
    await q.close();
  }
  // D69 (19.10, au téléphone, dans la page partagée, page jouable d'environ 390 × 620) : « On arrive
  // pas à aller de l'extrême haut, à l'extrême bas ». D'un seul geste et sans défiler : le houblon le
  // plus haut de l'écran glissé jusqu'au bas de l'écran atteint J+14 de la post-fermentation ; le plus
  // bas glissé jusqu'en haut atteint la durée d'ébullition ; pendant le geste, le bout visé du rail
  // reste dans l'écran. Écrans de 620 et 844 px, page en haut et page défilée jusqu'au dernier houblon.
  {
    const f69 = fs.existsSync(k3) ? k3 : index, nom69 = path.basename(f69, '.html');
    for (const H of [620, 844]) for (const defile of ['en haut', 'défilée']) for (const sens of ['bas', 'haut']) {
      const q = await ouvrir(f69, 390, H);
      if (defile === 'défilée') await q.evaluate(() => { const ls = [...document.querySelectorAll('[data-role="ligne-houblon"]')]; ls[ls.length - 1].scrollIntoView({ block: 'end' }); scrollBy(0, 40); });
      await wait(200);
      const ebu = await q.evaluate(() => (document.querySelector('[data-role="ebullition"]')?.innerText.match(/(\d+)\s*(′|')/) || [])[1]);
      const ls = (await q.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => {
        const r = l.querySelector('[data-role="glisser-moment"]').getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, quand: l.querySelector('[data-role="quand"]').innerText.trim() };
      }))).filter((l) => l.y > 40 && l.y < H - 40);
      const l = sens === 'bas' ? ls[0] : ls[ls.length - 1];
      const ou = nom69 + ', écran ' + H + ' px, page ' + defile + ', ' + (l ? l.quand : '') + ' glissé jusqu\'en ' + sens;
      if (!l) { p('D69 : ' + ou + ' : aucun houblon dans l\'écran'); await q.close(); continue; }
      const t = await q.touchscreen.touchStart(l.x, l.y);
      let yF = l.y;
      await t.move(l.x, yF + 3); await wait(200);
      const fin = sens === 'bas' ? H - 6 : 6;
      let m = null;
      while (Math.abs(fin - yF) > 0.5) {
        yF += Math.sign(fin - yF) * Math.min(6, Math.abs(fin - yF));
        await t.move(l.x, yF); await wait(20);
      }
      await wait(300);
      m = await q.evaluate(() => {
        const g = document.querySelector('[data-glisse] [data-role="quand"]');
        const f = document.querySelector('[data-rang].focus');
        const ax = document.querySelector('[data-geste] .axe')?.getBoundingClientRect();
        return { quand: g ? g.innerText.trim() : null, seg: f ? f.dataset.rang : null, axe: ax ? [ax.top, ax.bottom] : null };
      });
      await t.end(); await wait(400);
      const vise = sens === 'bas' ? { quand: 'J+14', seg: 'T-dryPost', lib: 'J+14 de la post-fermentation' } : { quand: ebu + '′', seg: 'T-ebu', lib: ebu + '′' };
      if (m.quand !== vise.quand || m.seg !== vise.seg) p('D69 : ' + ou + ' : le doigt au bord de l\'écran tient ' + (m.quand || '?') + ' (' + (m.seg || '?') + '), pas ' + vise.lib + ' : on n\'atteint pas l\'extrémité du rail');
      // Le bout visé reste dans l'écran (l'autre bout peut en sortir quand le houblon est près du bord).
      if (m.axe && (sens === 'bas' ? m.axe[1] > H + 1 : m.axe[0] < -1)) p('D69 : ' + ou + ' : pendant le geste, le ' + sens + ' du rail sort de l\'écran (' + Math.round(m.axe[0]) + ' à ' + Math.round(m.axe[1]) + ' px pour ' + H + ')');
      await q.close();
    }
  }
  {
    const q = await ouvrir(index);
    const g = await poser(q, 'doigt');
    if (g && await g.vers('wp75')) {
      const m = await q.evaluate((yF) => {
        const yc = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
        const wp = [...document.querySelectorAll('[data-graduation="whirlpool"]')].map(yc).sort((a, b) => a - b);
        const eb = [...document.querySelectorAll('[data-graduation="ebullition"]')].map(yc).sort((a, b) => a - b);
        let gap = null;
        for (let i = 1; i < wp.length; i++) if (wp[i - 1] <= yF + 0.5 && wp[i] >= yF - 0.5) { const d = Math.max(wp[i] - wp[i - 1], i + 1 < wp.length ? wp[i + 1] - wp[i] : 0); gap = gap === null ? d : Math.max(gap, d); }
        return { gap, pas: eb.length > 1 ? (eb[eb.length - 1] - eb[0]) / (eb.length - 1) : null };
      }, g.y);
      if (m.gap === null || m.pas === null) p('D67 : index, tenu à 75 °C, graduations du whirlpool ou de l\'ébullition introuvables');
      else if (!(m.gap >= 12 && m.gap >= 2 * m.pas)) p('D67 : index, Nugget glissé au whirlpool (75 °C) : une tranche sous le doigt fait ' + Math.round(m.gap) + ' px, une tranche de l\'ébullition quittée ' + Math.round(m.pas * 10) / 10 + ' px : la loupe n\'a pas suivi le doigt dans son segment');
    } else p('D67 : index, le doigt n\'atteint pas 75 °C dans le whirlpool');
    if (g) await g.lacher();
    await q.close();
  }
  // D63, D64, D61 bis (18.10, soir, base v4.2 au téléphone) : « Ça fait pas zoom focus sur
  // l'emplacement. Les ajouter déjà présent saute à droite. C'est moins bien qu'avant... » ;
  // « L'échelle est plus du tout respecter quand on passe dessus... ». La loupe (D47, D55) et la
  // hauteur qui dit le temps (D61) tiennent ensemble.
  // D63 : pendant le geste, une loupe : une bulle [data-role="loupe"] visible qui écrit au moins
  //   5 minutes, ou, sur le rail, les graduations voisines du doigt au moins 2 fois plus espacées
  //   que les plus lointaines de l'ébullition (et 12 px au moins).
  // D64 : les houblons déjà posés ne sautent pas de côté (x à 8 px près de leur place au repos)
  //   et restent dans le segment de leur moment (whirlpool entre wp et la levure ; à froid sous
  //   la fermentation).
  // D61 bis : en descendant l'ébullition par pas de 10 px, le moment tenu ne remonte jamais et ne
  //   saute pas de plus de 10′ ; aucun autre houblon ne bouge de plus de 24 px d'un pas à l'autre.
  if (fs.existsSync(k3)) {
    const lignes = (q) => q.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => {
      const k = l.querySelector('[data-houblon]')?.getAttribute('data-houblon') || l.getAttribute('data-houblon');
      const h = l.querySelector('[data-role="glisser-moment"]') || l;
      const r = h.getBoundingClientRect();
      const qd = l.querySelector('[data-role="quand"]');
      return { k, x: r.left + r.width / 2, y: r.top + r.height / 2, quand: qd ? qd.innerText.trim() : '', glisse: !!l.closest('[data-glisse]') };
    }));
    const q = await ouvrir(k3);
    const repos = await lignes(q);
    const g = await poser(q, 'doigt');
    if (g && await g.vers('b35')) {
      const now = await lignes(q);
      const et = (await etat(q)).etapes;
      const yE = (c) => et.find((x) => x.code === c)?.y;
      for (const l of now.filter((x) => !x.glisse && x.k !== g.a.cle)) {
        const r0 = repos.find((x) => x.k === l.k);
        if (r0 && Math.abs(l.x - r0.x) > 8) p('D64 : cas-k3, pendant le geste, ' + l.k + ' (' + l.quand + ') saute de côté de ' + Math.round(l.x - r0.x) + ' px : un houblon déjà posé reste à sa place');
        if (/°C/.test(l.quand) && yE('wp') !== undefined && yE('levure') !== undefined && !(l.y >= yE('wp') - 4 && l.y <= yE('levure') + 4)) p('D64 : cas-k3, pendant le geste, ' + l.k + ' (' + l.quand + ') n\'est plus dans le segment du whirlpool');
        if (/J\s*\+/.test(l.quand) && yE('dryActive') !== undefined && l.y < yE('dryActive') - 4) p('D64 : cas-k3, pendant le geste, ' + l.k + ' (' + l.quand + ') remonte au-dessus de la fermentation');
      }
    } else p('D63 : cas-k3, le doigt n\'atteint pas 35′');
    if (g) await g.lacher();
    await q.close();
    const q2 = await ouvrir(k3);
    const g2 = await poser(q2, 'doigt');
    if (g2) {
      let prevT = null, prevPos = null, pire = null, cote = false;
      for (let i = 0; i < 60 && !pire; i++) {
        await g2.bouger(g2.y + 10); await wait(30);
        const ls = await lignes(q2);
        const tenu = ls.find((x) => x.k === g2.a.cle);
        const m = tenu && tenu.quand.match(/^(\d+)\s*(′|')/);
        if (!m) break;
        const t = Number(m[1]);
        if (prevT !== null && (t > prevT || prevT - t > 10)) pire = 'le moment tenu passe de ' + prevT + '′ à ' + t + '′ en 10 px';
        const pos = Object.fromEntries(ls.filter((x) => x.k !== g2.a.cle).map((x) => [x.k, x]));
        if (prevPos && !pire) for (const [k, l] of Object.entries(pos)) {
          const a = prevPos[k]; if (!a) continue;
          if (Math.abs(l.y - a.y) > 24) { pire = k + ' bondit de ' + Math.round(l.y - a.y) + ' px en un pas de 10 px (tenu à ' + t + '′)'; break; }
          if (Math.abs(l.x - a.x) > 8 && !cote) { p('D64 : cas-k3, en passant à ' + t + '′, ' + k + ' (' + l.quand + ') saute de côté de ' + Math.round(l.x - a.x) + ' px : un houblon déjà posé reste à sa place'); cote = true; }
        }
        prevT = t; prevPos = pos;
      }
      await g2.lacher();
      if (pire) p('D61 bis : cas-k3, en descendant l\'ébullition par pas de 10 px, ' + pire + ' : l\'échelle ne tient pas quand on passe sur un autre houblon');
    }
    await q2.close();
  }
  console.log(id + ' · rail contrôlé');
}
await browser.close();
// Audit du 23.10 (a1-audit-defauts) : sur une page au format actuel, ce contrôle ne lisait rien et sortait « RAIL OK 0/0 ». Un contrôle qui ne lit rien n'est pas un OK.
if (ids.length === 0) problems.push('aucune maquette lue : 0 page au format attendu ; ce contrôle ne garde rien ici (voir portee-defauts.json)');
if (problems.length === 0) console.log('RAIL OK ' + ids.length + '/' + ids.length);
else { console.log('RAIL ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
