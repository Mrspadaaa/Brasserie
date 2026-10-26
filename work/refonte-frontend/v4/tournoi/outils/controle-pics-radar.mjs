#!/usr/bin/env node
// D143 (25.10), ses mots : « Les Spider graph radargraph doivent être plus comme ça » (sa capture de cmb3b, des courbes
// orange dessinées sur le radar), puis « Mais l'affichage des pic du radar sont toujours pas bon » (sur rpz2 et cmb3). Les
// contours des houblons sont des polygones en étoile : une famille à zéro tire le contour jusqu'au centre, une famille seule
// forte fait une aiguille jusqu'au bord. Il veut des courbes, sans pointe.
//
// Pour chaque page, à 390 x 844, et pour chaque moment du sélecteur [data-role="quand-comparer"] (sans sélecteur : une seule
// mesure, au repos), chaque contour de houblon du radar (les <path>, <polygon>, <polyline> sous un [data-serie] ; les cercles
// de sommet sont ignorés) doit être :
//   1. lisse : un <path> sans commande L, H ni V (ni lineto implicite après M), ni polygon, ni polyline : courbes C, S, Q, T ou A seulement ;
//   2. sans plongée au centre : échantillonné par getPointAtLength (200 points au moins, un point tous les 2 unités au plus),
//      sa distance minimale au centre reste au moins à 12 % du rayon ;
//   3. sans angle vif : sur cet échantillon, le changement de direction entre deux pas voisins reste sous 60°.
// Repères lus : radar = [data-role="radar"], sinon le svg qui contient des [data-serie] ; centre et rayon = lignes d'axe (point
// de départ commun, la plus longue), sinon le plus grand cercle hors série. Si le rayon est illisible, le contrôle le dit.
// Usage : node controle-pics-radar.mjs <dossier> <id...> [--page=etat.html]   (page lue : <dossier>/<id>/<page>)
// Sortie : une ligne par page et par moment, puis le nom du contrôle suivi de OK ou « ECHEC (n) ». Ne s'arrête pas au premier échec (M16).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const pageNom = (args.find((a) => a.startsWith('--page=')) ?? '--page=etat.html').slice(7);
const [dossier, ...ids] = args.filter((a) => !a.startsWith('--'));
if (!dossier || !ids.length) {
  console.log('Usage : node controle-pics-radar.mjs <dossier> <id...> [--page=etat.html]');
  process.exit(2);
}
const SEUIL_CENTRE = 12; // % du rayon
const SEUIL_ANGLE = 60; // degrés
const POINTS_MIN = 200;
const PAS_MAX = 2; // unités de l'utilisateur entre deux points

// Dans la page : liste les moments du sélecteur et les marque data-pr (index).
function moments() {
  const racine = document.querySelector('[data-role="quand-comparer"]');
  if (!racine) return { racine: false, liste: [] };
  const vu = (e) => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  };
  let cands = [...racine.querySelectorAll('[data-moment]')];
  if (!cands.length) cands = [...racine.querySelectorAll('button,[role=tab],[role=radio],[role=button],[role=option],a,label,li,[onclick],[tabindex]')];
  cands = cands.filter((e) => vu(e));
  cands = cands.filter((e) => !cands.some((o) => o !== e && e.contains(o)));
  racine.querySelectorAll('[data-pr]').forEach((e) => e.removeAttribute('data-pr'));
  const liste = [];
  cands.forEach((e, i) => {
    e.setAttribute('data-pr', String(i));
    const nom = (e.getAttribute('data-moment') || e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim() || 'moment ' + i;
    liste.push(/^[0-9]+$/.test(nom) ? nom + "′" : nom.replace(/^dryhop-/, "dry hop "));
  });
  return { racine: true, liste };
}

// Dans la page : mesure chaque contour de chaque radar. Rend {radars:[{contours:[...]}], manque:[...]}.
function mesurer(cfg) {
  const manque = [];
  let svgs = [...document.querySelectorAll('[data-role="radar"]')].map((e) => (e instanceof SVGSVGElement ? e : e.querySelector('svg')) ?? e.closest('svg')).filter(Boolean);
  if (!svgs.length) svgs = [...new Set([...document.querySelectorAll('[data-serie]')].map((e) => e.closest('svg')).filter(Boolean))];
  if (!svgs.length) return { radars: [], manque: ['radar : aucun svg avec des [data-serie] (ou [data-role="radar"])'] };
  const radars = [];
  for (const s of svgs) {
    const rc = s.getBoundingClientRect();
    if (rc.width <= 0 || rc.height <= 0) continue;
    let cx = null; let cy = null; let rayon = 0;
    const axes = [...s.querySelectorAll('line')];
    if (axes.length) {
      const compte = new Map();
      axes.forEach((l) => { const k = l.getAttribute('x1') + ',' + l.getAttribute('y1'); compte.set(k, (compte.get(k) ?? 0) + 1); });
      const [k] = [...compte.entries()].sort((a, b) => b[1] - a[1])[0];
      [cx, cy] = k.split(',').map(Number);
      axes.filter((l) => l.getAttribute('x1') + ',' + l.getAttribute('y1') === k).forEach((l) => {
        rayon = Math.max(rayon, Math.hypot(+l.getAttribute('x2') - cx, +l.getAttribute('y2') - cy));
      });
    }
    if (!(rayon > 0)) {
      const cercles = [...s.querySelectorAll('circle')].filter((c) => !c.closest('[data-serie]') && !c.hasAttribute('data-serie'));
      if (cercles.length) {
        const g = cercles.sort((a, b) => +b.getAttribute('r') - +a.getAttribute('r'))[0];
        cx = +g.getAttribute('cx'); cy = +g.getAttribute('cy'); rayon = +g.getAttribute('r');
      }
    }
    if (!(rayon > 0)) { manque.push('radar : lignes d\'axe (<line> partant du centre) ou cercle de grille pour lire le rayon'); continue; }

    // Contours : formes sous un [data-serie] (ou le [data-serie] lui-même), regroupées par nom de série.
    const formes = [];
    for (const e of s.querySelectorAll('[data-serie]')) {
      const nom = e.getAttribute('data-serie');
      const cibles = ['path', 'polygon', 'polyline'].includes(e.tagName.toLowerCase()) ? [e] : [...e.querySelectorAll('path,polygon,polyline')];
      cibles.forEach((f) => formes.push({ nom, f }));
    }
    const parNom = new Map();
    const inv = s.getScreenCTM() ? s.getScreenCTM().inverse() : null;
    for (const { nom, f } of formes) {
      const t = f.tagName.toLowerCase();
      const r = parNom.get(nom) ?? { nom, formes: 0, nonLisses: [], centreMin: null, angleMax: 0, points: 0 };
      parNom.set(nom, r);
      r.formes += 1;
      // 1. lisse
      if (t === 'polygon' || t === 'polyline') r.nonLisses.push(t);
      else {
        const d = f.getAttribute('d') ?? '';
        const commandes = [...d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)];
        const droit = new Set();
        for (const [, c, nums] of commandes) {
          if ('LlHhVv'.includes(c)) droit.add(c.toUpperCase());
          if ((c === 'M' || c === 'm') && (nums.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).length > 2) droit.add('L');
        }
        if (droit.size) r.nonLisses.push('path ' + [...droit].join(''));
      }
      // 2 et 3. échantillon
      let longueur = 0;
      try { longueur = f.getTotalLength(); } catch { longueur = 0; }
      if (!(longueur > 0)) continue;
      const n = Math.max(cfg.pointsMin, Math.ceil(longueur / cfg.pasMax));
      const m = inv && f.getScreenCTM() ? inv.multiply(f.getScreenCTM()) : null;
      const pts = [];
      const ferme = t === 'polygon' || /[zZ]\s*$/.test(f.getAttribute('d') ?? '');
      for (let i = 0; i < n; i += 1) {
        const p = f.getPointAtLength((longueur * i) / (ferme ? n : n - 1));
        const q = m ? new DOMPoint(p.x, p.y).matrixTransform(m) : p;
        pts.push([q.x, q.y]);
      }
      r.points += pts.length;
      for (const [x, y] of pts) {
        const dd = (Math.hypot(x - cx, y - cy) / rayon) * 100;
        if (r.centreMin === null || dd < r.centreMin) r.centreMin = dd;
      }
      const vers = [];
      for (let i = 0; i < pts.length - (ferme ? 0 : 1); i += 1) {
        const a = pts[i]; const b = pts[(i + 1) % pts.length];
        const vx = b[0] - a[0]; const vy = b[1] - a[1];
        if (Math.hypot(vx, vy) > 1e-6) vers.push([vx, vy]);
      }
      const tour = ferme ? vers.length : vers.length - 1;
      for (let i = 0; i < tour; i += 1) {
        const u = vers[i]; const v = vers[(i + 1) % vers.length];
        const ang = Math.abs((Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]) * 180) / Math.PI);
        if (ang > r.angleMax) r.angleMax = ang;
      }
    }
    radars.push({ rayon, contours: [...parNom.values()] });
  }
  return { radars, manque: [...new Set(manque)] };
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const cfg = { pointsMin: POINTS_MIN, pasMax: PAS_MAX };
async function stable(p) {
  let prec = JSON.stringify(await p.evaluate(mesurer, cfg));
  for (let i = 0; i < 8; i += 1) {
    await attendre(250);
    const cur = JSON.stringify(await p.evaluate(mesurer, cfg));
    if (cur === prec) return JSON.parse(cur);
    prec = cur;
  }
  return null;
}

const ent = (v) => Math.round(v);
function juger(m) {
  if (m.manque.length) return { ok: false, texte: 'repère manquant : ' + m.manque.join(' ; ') };
  const contours = m.radars.flatMap((r) => r.contours);
  if (!contours.length) return { ok: false, texte: 'aucun contour [data-serie] à juger' };
  const pb = [];
  for (const c of contours) {
    const p = [];
    if (c.nonLisses.length) p.push(`pas lisse (${[...new Set(c.nonLisses)].join(', ')})`);
    if (c.centreMin !== null && c.centreMin < SEUIL_CENTRE) p.push(`plonge à ${ent(c.centreMin)} % du rayon du centre (${SEUIL_CENTRE} % au moins)`);
    if (c.angleMax >= SEUIL_ANGLE) p.push(`angle vif de ${ent(c.angleMax)}° (sous ${SEUIL_ANGLE}°)`);
    if (c.points === 0) p.push('contour sans longueur mesurable');
    if (p.length) pb.push(`${c.nom} : ${p.join(', ')}`);
  }
  const centres = contours.map((c) => c.centreMin).filter((v) => v !== null);
  const resume = `${contours.length} contours ; centre au plus près ${centres.length ? ent(Math.min(...centres)) : '-'} % du rayon ; angle max ${ent(Math.max(...contours.map((c) => c.angleMax)))}°`;
  return pb.length ? { ok: false, texte: pb.join(' ; ') + ' — ' + resume } : { ok: true, texte: resume };
}

async function page(navigateur, id) {
  const fichier = path.resolve(RACINE, dossier, id, pageNom);
  if (!fs.existsSync(fichier)) return [{ ok: false, nom: '-', texte: `page absente (${path.relative(RACINE, fichier)})` }];
  const p = await navigateur.newPage();
  const lignes = [];
  try {
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await attendre(500);
    const etat = await p.evaluate(moments);
    if (!etat.racine || !etat.liste.length) {
      const mesure = await stable(p);
      lignes.push(mesure === null ? { ok: false, nom: 'sans sélecteur', texte: 'valeurs instables (la page bouge seule)' } : { nom: 'sans sélecteur', ...juger(mesure) });
      return lignes;
    }
    for (let i = 0; i < etat.liste.length; i += 1) {
      await p.evaluate(moments);
      const h = await p.$(`[data-role="quand-comparer"] [data-pr="${i}"]`);
      if (!h) { lignes.push({ ok: false, nom: etat.liste[i], texte: 'moment impossible à toucher' }); continue; }
      await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await h.click();
      await attendre(300);
      const mesure = await stable(p);
      if (mesure === null) { lignes.push({ ok: false, nom: etat.liste[i], texte: 'valeurs instables après le toucher' }); continue; }
      lignes.push({ nom: etat.liste[i], ...juger(mesure) });
    }
  } catch (e) {
    lignes.push({ ok: false, nom: '-', texte: `plantage de la page : ${String(e.message ?? e).slice(0, 120)}` });
  } finally {
    await p.close();
  }
  return lignes;
}

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
let echecs = 0;
for (const id of ids) {
  for (const l of await page(navigateur, id)) {
    if (!l.ok) echecs += 1;
    console.log(`${id} · ${l.nom} : ${l.ok ? 'OK' : 'ECHEC'} — ${l.texte}`);
  }
}
await navigateur.close();
const jeton = ['PIC', 'S'].join('');
console.log(echecs ? `${jeton} ECHEC (${echecs})` : `${jeton} OK`);
process.exit(echecs ? 1 : 0);
