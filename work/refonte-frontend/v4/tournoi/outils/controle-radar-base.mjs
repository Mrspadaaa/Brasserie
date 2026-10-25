#!/usr/bin/env node
// Voie rb-radar-commun (25.10), ses mots : « Ensuite utiliser ce radar graph comme Baseline et l'utiliser partout dans
// les vue où il y en a » (le radar de cmc2h, son choix : « C'est quasiment parfait », sur cmc2g). Et D68 : « SI choisi
// absolu, plus de normalisation, pour le radar et pour les barre et le reste !! ».
//
// Sur chaque vue à radar de la maquette construite (Comparer au repos, en Absolu, à 60′ ; la fiche ; Suggérer en mode
// Radar, au style et en Absolu ; Substituer), à 390 × 844 tactile, chaque radar visible doit :
//   B1 porter data-radar="base" (le radar commun, commun/RadarBase.tsx) et 12 axes ;
//   B2 n'avoir aucun point sur un axe inconnu : ni dans le secteur « sans donnée » (inconnu de tous), ni sur l'axe d'une
//      pastille « ? » de sa série (inconnu de ce houblon) ; et aucun point au centre ;
//   B3 n'avoir aucun remplissage qui touche le centre (isPointInFill au centre du radar, et à 3 px autour) ;
//   B4 avoir ses anneaux chiffrés : 3 anneaux au moins ; en Absolu, une étiquette par anneau ; au style, le maximum de
//      chaque axe connu écrit près de son picto.
// Une ligne par vue, puis RADAR-BASE OK ou RADAR-BASE ECHEC (n). Ne s'arrête pas au premier échec (M16).
// Témoin : la maquette construite depuis HEAD (28989963) → ECHEC (aucun radar ne porte data-radar="base").
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs <dossier construit>
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { versUrl, existe } from './lib/cible.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dossier = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '');
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// Les vues : la page, puis les gestes (texte d'un bouton, ou sélecteur) qui posent le radar à lire.
const VUES = [
  { nom: 'comparer · au style, dry hop', route: 'comparer', gestes: [] },
  { nom: 'comparer · absolu, dry hop', route: 'comparer', gestes: [{ texte: 'Absolu' }] },
  { nom: 'comparer · au style, 60′', route: 'comparer', gestes: [{ sel: '[data-etape="b60"]', haut: '[role="button"]' }] },
  { nom: 'comparer · absolu, 60′', route: 'comparer', gestes: [{ sel: '[data-etape="b60"]', haut: '[role="button"]' }, { texte: 'Absolu' }] },
  { nom: 'fiche', route: 'fiche', gestes: [] },
  { nom: 'suggerer · radar, au style', route: 'suggerer', gestes: [{ texte: 'Radar' }] },
  { nom: 'suggerer · radar, absolu', route: 'suggerer', gestes: [{ texte: 'Radar' }, { texte: 'Absolu' }] },
  { nom: 'substituer', route: 'substituer', gestes: [] },
];

function lire() {
  const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  return [...document.querySelectorAll('svg[data-radar]')].filter(vis).filter((s) => !s.parentElement.closest('svg[data-radar]')).map((svg) => {
    const f = [];
    const base = svg.getAttribute('data-radar') === 'base';
    if (!base) f.push(`B1 data-radar="${svg.getAttribute('data-radar')}" (objet ${svg.getAttribute('data-objet') ?? '?'}) : pas le radar commun`);
    const axes = (svg.getAttribute('data-axes') ?? '').split(',').filter(Boolean);
    if (axes.length !== 12) f.push(`B1 ${axes.length} axes (12 attendus)`);
    const mode = svg.getAttribute('data-mode') ?? '?';
    // Le centre : data-centre du radar commun, sinon le milieu des anneaux.
    let [cx, cy] = (svg.getAttribute('data-centre') ?? '').split(',').map(Number);
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
      const g = svg.querySelector('[data-role="anneaux"], g') ?? svg; const b = g.getBBox(); cx = b.x + b.width / 2; cy = b.y + b.height / 2;
    }
    // B2 : les inconnus.
    const sansDonnee = new Set();
    for (const p of svg.querySelectorAll('[data-role="secteur-sans-donnee"], polygon[data-inconnu], path[data-inconnu]')) for (const x of (p.getAttribute('data-inconnu') ?? '').split(/\s+/).filter(Boolean)) sansDonnee.add(x);
    const inconnuDe = new Set([...svg.querySelectorAll('g[data-inconnu]')].map((g) => g.getAttribute('data-inconnu')));
    let points = 0;
    for (const g of svg.querySelectorAll('g[data-serie]')) {
      const serie = g.getAttribute('data-serie');
      for (const c of g.querySelectorAll('circle[data-point], circle[data-famille]')) {
        points++;
        const fam = c.getAttribute('data-point') ?? c.getAttribute('data-famille');
        if (sansDonnee.has(fam)) f.push(`B2 ${serie} : un point sur ${fam}, inconnu de tous (secteur « sans donnée »)`);
        if (inconnuDe.has(`${fam} ${serie}`)) f.push(`B2 ${serie} : un point sur ${fam}, inconnu pour lui (pastille « ? »)`);
        const d = Math.hypot(Number(c.getAttribute('cx')) - cx, Number(c.getAttribute('cy')) - cy);
        if (d < 2) f.push(`B2 ${serie} : un point au centre (${fam})`);
      }
    }
    if (base && !points) f.push('B2 aucun point de valeur (circle[data-point]) : rien n\'est lu');
    // B3 : aucun remplissage au centre.
    const pt = svg.createSVGPoint();
    let remplis = 0;
    for (const e of svg.querySelectorAll('g[data-serie] polygon, g[data-serie] path')) {
      const cs = getComputedStyle(e);
      const fill = cs.fill, op = Number(cs.fillOpacity) * Number(cs.opacity);
      if (!fill || fill === 'none' || /rgba\(0, 0, 0, 0\)|transparent/.test(fill) || !(op > 0.01)) continue;
      remplis++;
      for (const [dx, dy] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]]) {
        pt.x = cx + dx; pt.y = cy + dy;
        if (e.isPointInFill(pt)) { f.push(`B3 ${e.closest('g[data-serie]').getAttribute('data-serie')} : le remplissage touche le centre`); break; }
      }
    }
    // B4 : les anneaux chiffrés.
    const anneaux = svg.querySelectorAll('[data-role="anneaux"] polygon, [data-role="anneaux"] circle').length;
    if (anneaux < 3) f.push(`B4 ${anneaux} anneaux marqués (data-role="anneaux", 3 au moins)`);
    const etiquettes = [...svg.querySelectorAll('[data-role="echelle"] text')].map((t) => t.textContent.trim()).filter(Boolean);
    const maxAxes = [...svg.querySelectorAll('[data-axe] [data-role="max-axe"]')].map((t) => t.textContent.trim()).filter(Boolean);
    const axesConnus = svg.querySelectorAll('[data-axe]').length;
    if (mode === 'absolu') { if (etiquettes.length < anneaux || anneaux < 3) f.push(`B4 absolu : ${etiquettes.length} étiquettes pour ${anneaux} anneaux`); }
    else if (mode === 'style') { if (!axesConnus || maxAxes.length < axesConnus) f.push(`B4 au style : ${maxAxes.length} maximums écrits pour ${axesConnus} axes connus`); }
    else f.push('B4 mode inconnu (data-mode : style ou absolu)');
    return { objet: svg.getAttribute('data-objet') ?? '?', base, mode, moment: svg.getAttribute('data-moment') ?? '', points, remplis, sansDonnee: sansDonnee.size, inconnus: inconnuDe.size, etiquettes, maxAxes: maxAxes.length, f };
  });
}

async function geste(page, g) {
  const ok = await page.evaluate(({ texte, sel, haut }) => {
    let e = null;
    if (texte) e = [...document.querySelectorAll('button,[role="radio"],[role="button"]')].find((x) => x.getClientRects().length && (x.innerText || '').trim() === texte);
    else { e = document.querySelector(sel); if (e && haut) e = e.closest(haut) ?? e; }
    if (!e) return false;
    e.scrollIntoView({ block: 'center' }); e.click(); return true;
  }, g);
  await attendre(500);
  return ok;
}

let echecs = 0;
if (!existe(dossier)) { console.log(`RADAR-BASE ECHEC (1) : dossier absent ${dossier}`); process.exit(1); }
const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const v of VUES) {
    const fichier = path.join(dossier, v.route, 'etat.html');
    if (!existe(fichier)) { echecs++; console.log(`ECHEC ${v.nom} : page absente (${v.route}/etat.html)`); continue; }
    const page = await navigateur.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(versUrl(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await attendre(700);
    const manques = [];
    for (const g of v.gestes) if (!(await geste(page, g))) manques.push(g.texte ?? g.sel);
    const radars = await page.evaluate(lire);
    await page.close();
    const f = manques.map((m) => `geste introuvable : ${m}`);
    if (!radars.length) f.push('aucun radar visible (svg[data-radar])');
    for (const r of radars) f.push(...r.f);
    const dit = radars.map((r) => `${r.objet} ${r.base ? 'base' : 'ancien'} ${r.mode}${r.moment ? ` « ${r.moment} »` : ''} · ${r.points} points, ${r.remplis} remplis, sans donnée ${r.sansDonnee}, « ? » ${r.inconnus}, ${r.mode === 'absolu' ? `anneaux ${r.etiquettes.join(' ')}` : `${r.maxAxes} maximums d'axe`}`).join(' | ');
    if (f.length) { echecs++; console.log(`ECHEC ${v.nom} : ${dit || '—'}`); for (const x of [...new Set(f)]) console.log(`  ${x}`); }
    else console.log(`tenu  ${v.nom} : ${dit}`);
  }
} finally { await navigateur.close(); }
const jeton = ['RADAR', 'BASE'].join('-');
if (echecs) { console.log(`${jeton} ECHEC (${echecs})`); process.exitCode = 1; }
else console.log(`${jeton} OK (${VUES.length} vues)`);
