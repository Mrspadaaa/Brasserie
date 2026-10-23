#!/usr/bin/env node
// D109, D118, D119 (23.10, soir) : le retour d'un outil.
//   D109 : « Bouton retour souvent assez petit et pas très intuitif » (en commentaire sur « Fermer ») ; puis, sur la
//          pastille « ‹ Retour » : « UI pas terribles, toujours pas au point », « Juste une croix bien positionné,
//          facile, dans le thème suffirait ».
//   D118 : « Suivant où on est le bouton retour fait pas la même action. Je veux juste retour au "menu" pas principal ».
//   D119 : « Header qui change ??? ».
// Mesuré sur d332792c : « ‹ » de 28 × 28 px, icône de 16 px, gris, sans mot ; il ramène à Ma bière (#/biere) depuis
// Suggérer ; l'en-tête fait 41 px sur l'onglet Ma bière, 33 px sur Suggestions et Comparer.
//
// Règle, par route (suggerer, comparer, dryhopper, levure, substituer, biere), au repos, à 390 × 844 tactile puis à
// 1280 × 800. Le retour est `[data-role="retour"]` ; à défaut (version rejetée), le premier bouton visible de l'en-tête
// dont le nom accessible est « Fermer » ou commence par « Retour » : il est mesuré quand même, pour que l'échec dise
// la taille et la forme.
//   D109 forme   : une croix « × » (svg ou glyphe), pas un « ‹ ». Lue sur l'image même de l'icône (capture
//                  agrandie, masque d'encre : encre aux quatre coins, au centre, nulle au milieu des bords, symétrique).
//                  Aucun mot exigé ; un texte collé à la croix n'est pas une faute.
//   D109 taille  : zone touchable (boîte du bouton) de 44 × 44 px au moins ; icône de 20 px au moins de haut.
//   D109 encre   : couleur calculée de l'icône à 24 au plus par canal de la couleur la plus fréquente du texte de la
//                  page (au nombre de caractères visibles, hors le bouton), et non le gris secondaire.
//   D109 lieu    : la boîte du bouton est dans l'écran et dans l'en-tête ; son centre reçoit le toucher.
//   D118 retour  : un toucher sur la croix mène à #/ma-biere (l'étape Houblons), l'outil ouvert seul (etat.html).
//   D118 chemins : si le dossier a une page ma-biere et biere, on joue (390 px) Suggérer ouvert depuis l'étape (pont
//                  floral), Suggérer ouvert depuis l'onglet (pont floral ou d'objectif), puis Comparer ouvert depuis
//                  Suggérer : la croix mène à #/ma-biere dans chaque cas. Sans page ma-biere : non joué, dit.
//   D119 en-tête : sur biere, suggerer et comparer (ceux présents dans --routes), la croix est au même endroit à
//                  ±2 px (x et y du centre), l'en-tête (l'élément <header>) a la même hauteur à ±2 px, et le bloc
//                  qui l'étend jusqu'aux onglets (data-role="onglets") aussi.
// La fiche n'est pas concernée : feuille, elle se ferme sur l'écran qu'elle couvre.
// Usage : node controle-retour.mjs <dossier> [--routes=biere,suggerer,…] [--page=etat.html] [--parcours=oui|non]
// Imprime une ligne par route et largeur, puis RETOUR OK (n routes × 2 largeurs) (code 0), ou RETOUR ECHEC et une
// ligne « - D109|D118|D119 <route> <largeur> : … » par manque (code 1) ; code 2 si une page manque.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const args = process.argv.slice(2);
const opt = (nom, defaut) => { const a = args.find((x) => x.startsWith(`--${nom}=`)); return a ? a.slice(nom.length + 3) : defaut; };
const dossier = path.resolve(RACINE, args.find((a) => !a.startsWith('--')) ?? '.');
const routes = opt('routes', 'biere,suggerer,comparer,dryhopper,levure,substituer').split(',').map((r) => r.trim()).filter(Boolean);
const page = opt('page', 'etat.html');
const parcoursVoulus = opt('parcours', 'oui') !== 'non';
const LARGEURS = [{ l: 390, h: 844, tactile: true }, { l: 1280, h: 800, tactile: false }];
const MIN_ZONE = 44, MIN_ICONE = 20, MAX_ECART = 24, TOLERANCE_POSITION = 2;
const CIBLE = '#/ma-biere';
const ONGLETS = ['biere', 'suggerer', 'comparer'];

// Dans la page : trouve le retour et mesure zone, icône, encre, en-tête (aucun mot n'est exigé).
function mesurer() {
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const nomAcc = (el) => (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim();
  const arrondi = (v) => Math.round(v * 10) / 10;
  let retour = [...document.querySelectorAll('[data-role="retour"]')].find(visible) ?? null;
  let repli = false;
  if (!retour) {
    const entetes = [...document.querySelectorAll('header, [data-page-titlebar]')];
    const boutons = entetes.flatMap((h) => [...h.querySelectorAll('button, a, [role="button"]')]);
    retour = boutons.find((b) => visible(b) && /^(fermer$|retour)/i.test(nomAcc(b))) ?? null;
    repli = !!retour;
  }

  // L'en-tête : celui du retour, à défaut le premier <header> visible ; le bloc l'étend jusqu'aux onglets.
  const entete = (retour && retour.closest('header')) ?? [...document.querySelectorAll('header')].find(visible) ?? null;
  const onglets = [...document.querySelectorAll('[data-role="onglets"]')].find(visible) ?? null;
  let enteteMesure = null;
  if (entete) {
    const r = entete.getBoundingClientRect();
    const o = onglets ? onglets.getBoundingClientRect() : null;
    const bas = o ? Math.max(r.bottom, o.bottom) : r.bottom;
    enteteMesure = { haut: arrondi(r.top), h: arrondi(r.height), bloc: arrondi(bas - r.top), ongletsDans: !!(onglets && entete.contains(onglets)), sansOnglets: !onglets };
  }
  if (!retour) return { trouve: false, entete: enteteMesure };

  const fondPage = (() => {
    for (const el of [document.body, document.documentElement]) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) > 0.99)) return m.slice(0, 3).map(Number);
    }
    return [255, 255, 255];
  })();
  const parse = (c) => { const m = c && c.match(/[\d.]+/g); return m && m.length >= 3 ? { rgb: m.slice(0, 3).map(Number), a: m.length > 3 ? Number(m[3]) : 1 } : null; };
  const opacite = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; };
  const effective = (c, el) => {
    const p = parse(c); if (!p) return null;
    const a = p.a * opacite(el);
    return p.rgb.map((v, i) => Math.round(v * a + fondPage[i] * (1 - a)));
  };

  const rb = retour.getBoundingClientRect();
  const zone = { w: arrondi(rb.width), h: arrondi(rb.height), cx: arrondi(rb.left + rb.width / 2), cy: arrondi(rb.top + rb.height / 2) };

  // Icône : le svg, sinon le glyphe (un caractère de symbole : ×, ✕, ‹ …).
  let icone = null;
  const svg = retour.querySelector('svg');
  if (svg && visible(svg)) {
    const s = getComputedStyle(svg), r = svg.getBoundingClientRect();
    // La peinture se lit sur le premier tracé (le svg peut ne la poser que sur ses enfants).
    const peint = (e) => { const c = getComputedStyle(e); return c.stroke && c.stroke !== 'none' ? c.stroke : (c.fill && c.fill !== 'none' ? c.fill : null); };
    const enfant = [...svg.querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse')].find((e) => peint(e));
    const trait = (enfant && peint(enfant)) ?? peint(svg) ?? s.color;
    icone = { genre: 'svg', h: arrondi(r.height), rgb: effective(trait, svg), rect: { x: r.left, y: r.top, w: r.width, h: r.height } };
  } else {
    const w = document.createTreeWalker(retour, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n && !icone; n = w.nextNode()) {
      const i = n.textContent.search(/[×✕✖✗✘╳‹›<>«»←→]/);
      if (i < 0) continue;
      const el = n.parentElement, s = getComputedStyle(el);
      const range = document.createRange(); range.setStart(n, i); range.setEnd(n, i + 1);
      const r = range.getBoundingClientRect();
      icone = { genre: 'glyphe', h: parseFloat(s.fontSize), rgb: effective(s.color, el), rect: { x: r.left, y: r.top, w: r.width, h: r.height } };
    }
  }

  // Encre du texte : la couleur la plus fréquente au nombre de caractères visibles, hors le bouton.
  const compte = new Map();
  const marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = marche.nextNode(); n; n = marche.nextNode()) {
    const t = n.textContent.replace(/\s+/g, '');
    if (!t || retour.contains(n)) continue;
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || el.closest('svg, [aria-hidden="true"]')) continue;
    if (!visible(el) || opacite(el) < 0.5) continue;
    const c = effective(getComputedStyle(el).color, el);
    if (c) compte.set(c.join(','), (compte.get(c.join(',')) ?? 0) + t.length);
  }
  const top = [...compte].sort((a, b) => b[1] - a[1])[0];
  const encre = top ? top[0].split(',').map(Number) : null;

  const haut = document.elementFromPoint(rb.left + rb.width / 2, rb.top + rb.height / 2);
  const er = entete ? entete.getBoundingClientRect() : null;
  return {
    trouve: true, repli, zone, icone, encre, nomAcc: nomAcc(retour).slice(0, 40), entete: enteteMesure,
    recouvert: !(haut && (haut === retour || retour.contains(haut))),
    dansEcran: rb.left >= -0.5 && rb.top >= -0.5 && rb.right <= innerWidth + 0.5 && rb.bottom <= innerHeight + 0.5,
    dansEntete: !er || (rb.left >= er.left - 1 && rb.top >= er.top - 1 && rb.right <= er.right + 1 && rb.bottom <= er.bottom + 1),
    hash: location.hash,
  };
}

// Dans la page : forme d'une icône lue sur sa capture agrandie. Masque = pixels éloignés de la couleur la plus fréquente.
function lireForme(url) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onerror = () => ko(new Error('capture illisible'));
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, w, h).data, n = new Map();
      for (let i = 0; i < d.length; i += 4) { const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3); n.set(k, (n.get(k) ?? 0) + 1); }
      const fond = [...n].sort((a, b) => b[1] - a[1])[0][0];
      const f = [((fond >> 10) << 3) + 4, (((fond >> 5) & 31) << 3) + 4, ((fond & 31) << 3) + 4];
      const m = new Uint8Array(w * h);
      let x0 = w, x1 = -1, y0 = h, y1 = -1;
      for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
        const p = (j * w + i) * 4;
        if (Math.max(Math.abs(d[p] - f[0]), Math.abs(d[p + 1] - f[1]), Math.abs(d[p + 2] - f[2])) > 70) { m[j * w + i] = 1; if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      }
      if (x1 < 0) return ok({ vide: true });
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const part = (u0, v0, u1, v1) => {
        let a = 0, t = 0;
        for (let j = Math.floor(v0 * bh); j < Math.max(Math.floor(v0 * bh) + 1, Math.ceil(v1 * bh)); j += 1) for (let i = Math.floor(u0 * bw); i < Math.max(Math.floor(u0 * bw) + 1, Math.ceil(u1 * bw)); i += 1) { t += 1; if (m[(y0 + Math.min(j, bh - 1)) * w + x0 + Math.min(i, bw - 1)]) a += 1; }
        return t ? a / t : 0;
      };
      const coins = [part(0, 0, .25, .25), part(.75, 0, 1, .25), part(0, .75, .25, 1), part(.75, .75, 1, 1)];
      const centre = part(.4, .4, .6, .6);
      const bords = [part(.4, 0, .6, .12), part(.4, .88, .6, 1), part(0, .4, .12, .6), part(.88, .4, 1, .6)];
      let tot = 0, hh = 0, vv = 0;
      for (let j = 0; j < bh; j += 1) for (let i = 0; i < bw; i += 1) {
        if (!m[(y0 + j) * w + x0 + i]) continue;
        tot += 1;
        if (m[(y0 + j) * w + x0 + (bw - 1 - i)]) hh += 1;
        if (m[(y0 + (bh - 1 - j)) * w + x0 + i]) vv += 1;
      }
      const proche = Math.abs(bw - bh) / Math.max(bw, bh) <= 0.25;
      const croix = proche && coins.every((v) => v >= 0.12) && centre >= 0.3 && bords.every((v) => v <= 0.1) && hh / tot >= 0.7 && vv / tot >= 0.7;
      ok({ croix, coins: coins.map((v) => Math.round(v * 100)), centre: Math.round(centre * 100), bords: bords.map((v) => Math.round(v * 100)), symH: Math.round(100 * hh / tot), symV: Math.round(100 * vv / tot), proche });
    };
    img.src = url;
  });
}

const hex = (rgb) => (rgb ? `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}` : '—');
const ecart = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const chemin = (h) => (h ?? '').split('?')[0];
const arr1 = (v) => Math.round(v * 10) / 10;

const manquantes = routes.map((r) => path.join(dossier, r, page)).filter((f) => !fs.existsSync(f));
if (manquantes.length) {
  for (const f of manquantes) console.log(`RETOUR PAGE ABSENTE : ${path.relative(RACINE, f)}`);
  process.exit(2);
}

// Toucher (tactile) ou clic (souris) en un point de la page.
async function toucher(p, tactile, x, y) { if (tactile) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); }
async function poser(p, v, route) {
  await p.setViewport({ width: v.l, height: v.h, deviceScaleFactor: 1, hasTouch: v.tactile, isMobile: v.tactile });
  await p.goto(pathToFileURL(path.join(dossier, route, page)).href, { waitUntil: 'networkidle0' });
  await pause(500);
}
// Un toucher sur la première commande visible `[data-role=…]` de la liste, puis attend `attendre` dans la page.
async function aller(p, v, roles, attendre) {
  for (const role of roles) {
    const c = await p.evaluate((r) => {
      const el = [...document.querySelectorAll(`[data-role="${r}"]`)].find((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !e.disabled; });
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }, role);
    if (!c) continue;
    await toucher(p, v.tactile, c.x, c.y);
    try { await p.waitForSelector(attendre, { timeout: 3000 }); await pause(400); return role; } catch { return `${role} (sans effet : ${attendre} n'apparaît pas)`; }
  }
  return null;
}
async function apresToucher(p, tactile, m) {
  await toucher(p, tactile, m.zone.cx, m.zone.cy);
  let apres = m.hash;
  for (let i = 0; i < 12 && apres === m.hash; i += 1) { await pause(100); apres = await p.evaluate(() => location.hash); }
  await pause(300);
  return p.evaluate(() => location.hash);
}

const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const problemes = [];
const releves = []; // une entrée par route et largeur, pour D119
let bons = 0, parcoursJoues = 0;
try {
  for (const route of routes) {
    for (const v of LARGEURS) {
      const p = await nav.newPage();
      const etiq = `${route} ${v.l}`;
      const fautes = [];
      try {
        await poser(p, v, route);
        const m = await p.evaluate(mesurer);
        releves.push({ route, v, m });
        if (!m.trouve) {
          fautes.push(`D109 ${etiq} : aucune croix de retour dans l'en-tête (ni [data-role="retour"], ni bouton « Fermer » ou « Retour… » visible)`);
          console.log(`${etiq} · retour introuvable${m.entete ? ` · en-tête ${m.entete.h} px (bloc ${m.entete.bloc})` : ''}`);
        } else {
          let forme = { croix: false, vide: true };
          if (m.icone && m.icone.rect.w > 0 && m.icone.rect.h > 0) {
            const r = m.icone.rect, rem = 2;
            const clip = { x: Math.max(0, r.x - rem), y: Math.max(0, r.y - rem), width: r.w + 2 * rem, height: r.h + 2 * rem, scale: 4 };
            const png = await p.screenshot({ clip, encoding: 'base64' });
            forme = await p.evaluate(lireForme, `data:image/png;base64,${png}`);
          }
          if (m.zone.w < MIN_ZONE - 0.5 || m.zone.h < MIN_ZONE - 0.5) fautes.push(`D109 ${etiq} : zone touchable ${m.zone.w} × ${m.zone.h} px, 44 × 44 au moins${m.repli ? ` (bouton « ${m.nomAcc} », sans data-role="retour")` : ''}`);
          if (!m.icone) fautes.push(`D109 ${etiq} : aucune icône (svg ou glyphe) dans le retour`);
          else {
            if (m.icone.h < MIN_ICONE - 0.5) fautes.push(`D109 ${etiq} : icône de ${m.icone.h} px de haut (${m.icone.genre}), 20 au moins`);
            if (!forme.croix) fautes.push(`D109 ${etiq} : l'icône n'est pas une croix « × » (${forme.vide ? 'rien de dessiné' : `coins ${forme.coins} %, centre ${forme.centre} %, milieux des bords ${forme.bords} %, symétrie ${forme.symH}/${forme.symV} %`}) ; un « ‹ » ne passe pas`);
          }
          if (m.icone?.rgb && m.encre) {
            const e = ecart(m.icone.rgb, m.encre);
            if (e > MAX_ECART) fautes.push(`D109 ${etiq} : icône ${hex(m.icone.rgb)}, encre du texte ${hex(m.encre)} (écart ${e}, 24 au plus) : pas à l'encre (le gris secondaire ne passe pas)`);
          } else if (!m.encre) fautes.push(`D109 ${etiq} : pas de texte visible dans la page, encre introuvable`);
          if (!m.dansEcran) fautes.push(`D109 ${etiq} : la boîte du retour déborde de l'écran`);
          if (!m.dansEntete) fautes.push(`D109 ${etiq} : la boîte du retour déborde de l'en-tête`);
          let destination = 'non testé';
          if (m.recouvert) {
            fautes.push(`D109 ${etiq} : le centre du retour (${Math.round(m.zone.cx)}, ${Math.round(m.zone.cy)}) est recouvert par un autre élément`);
            destination = 'recouvert';
          } else {
            destination = await apresToucher(p, v.tactile, m);
            if (chemin(destination) !== CIBLE) fautes.push(`D118 ${etiq} : la croix mène à « ${destination} » (hash avant « ${m.hash} »), pas à l'étape Houblons (${CIBLE})`);
          }
          console.log(`${etiq} · croix ${m.zone.w}×${m.zone.h} · icône ${m.icone ? `${m.icone.h} px ${hex(m.icone.rgb)}` : 'aucune'} (encre ${hex(m.encre)}) · forme ${forme.croix ? 'croix' : 'pas une croix'} · en-tête ${m.entete ? `${m.entete.h} px (bloc ${m.entete.bloc})` : '—'} · centre (${m.zone.cx}, ${m.zone.cy}) · mène à ${destination}`);
        }
      } finally {
        await p.close();
      }
      if (fautes.length) problemes.push(...fautes); else bons += 1;
    }
  }

  // D119 : la croix et l'en-tête ne bougent pas d'un onglet à l'autre.
  for (const v of LARGEURS) {
    const lot = releves.filter((r) => r.v.l === v.l && ONGLETS.includes(r.route));
    if (lot.length < 2) continue;
    const ref = lot[0];
    for (const r of lot.slice(1)) {
      const a = ref.m, b = r.m;
      if (a.entete && b.entete) {
        if (Math.abs(a.entete.h - b.entete.h) > TOLERANCE_POSITION) problemes.push(`D119 ${v.l} : l'en-tête fait ${a.entete.h} px sur ${ref.route} et ${b.entete.h} px sur ${r.route} (écart ${arr1(Math.abs(a.entete.h - b.entete.h))}, ${TOLERANCE_POSITION} au plus)`);
        if (Math.abs(a.entete.bloc - b.entete.bloc) > TOLERANCE_POSITION) problemes.push(`D119 ${v.l} : le bloc d'en-tête jusqu'aux onglets fait ${a.entete.bloc} px sur ${ref.route} et ${b.entete.bloc} px sur ${r.route} (écart ${arr1(Math.abs(a.entete.bloc - b.entete.bloc))}, ${TOLERANCE_POSITION} au plus)`);
      } else problemes.push(`D119 ${v.l} : pas d'en-tête (<header>) sur ${!a.entete ? ref.route : r.route}`);
      if (a.trouve && b.trouve) {
        const dx = Math.abs(a.zone.cx - b.zone.cx), dy = Math.abs(a.zone.cy - b.zone.cy);
        if (dx > TOLERANCE_POSITION || dy > TOLERANCE_POSITION) problemes.push(`D119 ${v.l} : la croix est en (${a.zone.cx}, ${a.zone.cy}) sur ${ref.route} et en (${b.zone.cx}, ${b.zone.cy}) sur ${r.route} (écart ${arr1(dx)} en x, ${arr1(dy)} en y, ${TOLERANCE_POSITION} au plus)`);
      } else problemes.push(`D119 ${v.l} : croix absente sur ${!a.trouve ? ref.route : r.route}, position non comparable`);
    }
  }

  // D118 : la croix ramène à l'étape Houblons quel que soit le chemin d'arrivée (390 px, tactile).
  const v0 = LARGEURS[0];
  const possible = parcoursVoulus && fs.existsSync(path.join(dossier, 'ma-biere', page)) && fs.existsSync(path.join(dossier, 'biere', page));
  if (!possible) console.log(`parcours non joués : ${parcoursVoulus ? `pas de page ma-biere et biere dans ${path.relative(RACINE, dossier)}` : '--parcours=non'} (la croix est testée outil ouvert seul)`);
  else {
    const floral = { roles: ['pont-floral'], attendre: '[data-ecran="suggerer"]', nom: 'pont floral' };
    const chemins = [
      { nom: 'Suggérer ouvert depuis l\'étape', depart: 'ma-biere', pas: [floral] },
      { nom: 'Suggérer ouvert depuis l\'onglet', depart: 'biere', pas: [{ roles: ['pont-floral', 'pont-objectif-autre', 'pont-objectif-resin'], attendre: '[data-ecran="suggerer"]', nom: 'pont d\'objectif' }] },
      { nom: 'Comparer ouvert depuis Suggérer', depart: 'ma-biere', pas: [floral, { roles: ['pont-comparer'], attendre: '[data-ecran="comparer"]', nom: 'pont Comparer' }] },
    ];
    for (const c of chemins) {
      const p = await nav.newPage();
      try {
        await poser(p, v0, c.depart);
        let ok = true;
        for (const pas of c.pas) {
          const r = await aller(p, v0, pas.roles, pas.attendre);
          if (!r || r.includes('sans effet')) { problemes.push(`D118 parcours « ${c.nom} » : ${pas.nom} ${r ? `(${r})` : `introuvable sur ${c.depart}`}, chemin non joué`); console.log(`parcours ${c.nom} · ${pas.nom} sans arrivée`); ok = false; break; }
        }
        if (!ok) continue;
        const m = await p.evaluate(mesurer);
        if (!m.trouve) { problemes.push(`D118 parcours « ${c.nom} » : aucune croix de retour à l'arrivée`); console.log(`parcours ${c.nom} · croix introuvable`); continue; }
        const apres = await apresToucher(p, v0.tactile, m);
        parcoursJoues += 1;
        console.log(`parcours ${c.nom} · croix ${m.zone.w}×${m.zone.h} · mène à ${apres}`);
        if (chemin(apres) !== CIBLE) problemes.push(`D118 parcours « ${c.nom} » : la croix mène à « ${apres} », pas à l'étape Houblons (${CIBLE})`);
      } finally {
        await p.close();
      }
    }
  }
} finally {
  await nav.close();
}
for (const p of problemes) console.log(`  - ${p}`);
const total = routes.length * LARGEURS.length;
console.log(problemes.length
  ? `RETOUR ECHEC (${bons}/${total} conformes, ${problemes.length} manques)`
  : `RETOUR OK (${routes.length} routes × ${LARGEURS.length} largeurs${parcoursJoues ? `, ${parcoursJoues} parcours` : ''})`);
process.exitCode = problemes.length ? 1 : 0;
