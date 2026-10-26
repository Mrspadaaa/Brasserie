// Contrôle Chrome (D156) : le contour de l'original se voit sur le radar de Substituer.
// Cas du brasseur (26.10) : Galaxy au dry hop, Nectaron et Citra cryo comparés ; son tableau Arômes 21C donne à Galaxy
// agrumes, tropicaux et noyau, donc au moins 3 sommets. Ce n'est pas un test vitest (nom sans .test) : il lance Chrome.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5251 --strictPort" --port 5251 --env VITE_HOP_V4=on -- node tests/integration/controle-contour-original.mjs [--etat=avant|apres] [--rendre=<dossier des captures>]
// Chaque largeur (390 × 844 et 1280 × 800) vérifie : le chemin du contour existe (polygone, rayon ou segments) ; trait d'au
// moins 1,5 px ; contraste au moins 3:1 avec le fond du radar et avec la grille ; au moins 3 sommets.
// Sortie : « CONTOUR OK » ou « CONTOUR ECHEC n » (code 1). Les captures du radar sont écrites pour être ouvertes (L12).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ETAT = arg('etat', 'controle');
const SORTIE = arg('rendre', path.join(os.tmpdir(), 'controle-contour-original'));
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const echecs = [];
const bilan = {};

for (const [largeur, hauteur] of [[390, 844], [1280, 800]]) {
  const { browser, page } = await ouvrir({ largeur, hauteur, mobile: largeur < 600, echelle: 2 });
  await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
  await dormir(800);
  const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
  await page.waitForSelector(champ, { timeout: 30000 });
  await page.type(champ, 'Galaxy', { delay: 15 });
  const plus = '[data-role="ajout-rapide"][data-houblon-ajout="beermaverick-galaxy"] [data-role="ajout-rapide-plus"]';
  await page.waitForSelector(plus, { timeout: 30000 });
  await page.click(plus);
  await dormir(1000);
  await page.evaluate(() => window.__hopPile.open({ view: 'hopSubstitute', hopKey: 'beermaverick-galaxy' }));
  await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 90000 });
  await dormir(500);
  await page.click('[data-ecran="substituer"] .pq-substituer-moments [data-moment="dryhop"]');
  await dormir(1500);
  // Deux remplaçants comparés : Nectaron et Citra cryo, comme sur sa capture (s'ils sont dans la liste).
  // La liste du moteur change : si un des deux manque, le premier de la liste prend sa place (le défaut se voit quand un
  // remplaçant décrit les mêmes familles aux mêmes niveaux que l'original).
  const voulus = ['Nectaron', 'Citra cryo'];
  const noms = await page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((x) => x.getAttribute('data-houblon-rang')));
  const choisis = voulus.filter((n) => noms.includes(n));
  for (const n of noms) if (choisis.length < 2 && !choisis.includes(n)) choisis.push(n);
  bilan[`${largeur}-compares`] = choisis;
  for (const nom of choisis) {
    await page.evaluate((n) => { const e = [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].find((x) => x.getAttribute('data-houblon-rang') === n); e?.click(); }, nom);
    await dormir(500);
  }
  await page.waitForSelector('svg[data-radar="base"][data-objet="houblons"]', { timeout: 30000 });
  const svg = await page.$('svg[data-radar="base"][data-objet="houblons"]');
  await svg.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await dormir(400);
  const m = await page.evaluate(() => {
    const svgE = document.querySelector('svg[data-radar="base"][data-objet="houblons"]');
    const g = [...svgE.querySelectorAll('g[data-serie]')].find((x) => /^Galaxy/.test(x.getAttribute('data-serie')));
    const lum = (c) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const rgb = (s) => { const r = /rgba?\(([^)]+)\)/.exec(s); if (!r) return null; const p = r[1].split(/[ ,/]+/).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
    // Le fond du radar : le premier ancêtre au fond opaque.
    let f = svgE, fond = null;
    while (f && !fond) { const b = rgb(getComputedStyle(f).backgroundColor); if (b && b.a > 0.9) fond = b.c; f = f.parentElement; }
    fond = fond ?? [255, 255, 255];
    const grille = svgE.querySelector('[data-role="anneaux"] polygon');
    const gc = rgb(getComputedStyle(grille).stroke)?.c ?? null;
    const series = [...svgE.querySelectorAll('g[data-serie]')].map((x) => x.getAttribute('data-serie'));
    if (!g) return { present: false, series, fond };
    const traits = [...g.querySelectorAll('polygon[data-role="contour"], line[data-role="trait"], line[data-role="tirete"], line[data-role="rayon"]')];
    const cs = traits.map((t) => ({ role: t.getAttribute('data-role'), stroke: getComputedStyle(t).stroke, largeur: parseFloat(getComputedStyle(t).strokeWidth) }));
    const col = rgb(cs[0]?.stroke ?? '');
    const sommets = g.querySelectorAll('circle[data-point]').length;
    const rect = svgE.getBoundingClientRect();
    const ctr = (a, b) => (a && b ? (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05) : 0);
    return { present: true, nom: g.getAttribute('data-serie'), valeurs: g.getAttribute('data-valeurs'), traits: cs, sommets, couleur: col?.c ?? null, fond, grille: gc,
      contraste: ctr(col?.c, fond), contrasteGrille: ctr(col?.c, gc), echelle: rect.width / 358, series };
  });
  const png = await svg.screenshot({ path: path.join(SORTIE, `radar-${largeur}-${ETAT}.png`) });
  // Au pixel : on lit la capture, pas le DOM. Le long de chaque côté de Galaxy (son axe central), la part des points à la
  // couleur de Galaxy ; autour de chaque sommet, à 5,5-7 px du centre (hors du point plein du remplaçant en avant, r = 4),
  // la part des points à sa couleur. Un chemin présent dans le DOM mais recouvert par un autre trait ne passe pas.
  if (m.present) {
    m.pixels = await page.evaluate(async (b64, dpr, info) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const px = (x, y) => cx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data;
      const gris = (x, y) => { const d = px(x, y); return Math.hypot(d[0] - info.c[0], d[1] - info.c[1], d[2] - info.c[2]) < 45; };
      const svgE = document.querySelector('svg[data-radar="base"][data-objet="houblons"]');
      const g = [...svgE.querySelectorAll('g[data-serie]')].find((x) => /^Galaxy/.test(x.getAttribute('data-serie')));
      const k = svgE.getBoundingClientRect().width / 358; // pixels CSS par unité du viewBox
      const sommets = [...g.querySelectorAll('circle[data-point]')].map((c) => [Number(c.getAttribute('cx')) * k, Number(c.getAttribute('cy')) * k]);
      const cotes = [];
      const lignes = [...g.querySelectorAll('line[data-role="trait"], line[data-role="tirete"]')].map((l) => [l.getAttribute('data-role'), [+l.getAttribute('x1') * k, +l.getAttribute('y1') * k], [+l.getAttribute('x2') * k, +l.getAttribute('y2') * k]]);
      const poly = g.querySelector('polygon[data-role="contour"]');
      if (poly) { const P = poly.getAttribute('points').trim().split(/\s+/).map((s) => s.split(',').map((x) => Number(x) * k)); P.forEach((p, i) => lignes.push(['trait', p, P[(i + 1) % P.length]])); }
      for (const [role, a, b] of lignes) {
        // Les 12 premiers et derniers px de chaque côté sont dans les points : on mesure entre les deux.
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]); let n = 0, tot = 0;
        for (let s = 9; s < L - 9; s += 1) { const t = s / L; tot++; if (gris(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) n++; }
        cotes.push({ role, part: tot ? n / tot : 0 });
      }
      const anneaux = sommets.map(([x, y]) => { let n = 0, tot = 0; for (let r = 5.5; r <= 7; r += 0.5) for (let a = 0; a < 360; a += 15) { tot++; if (gris(x + r * Math.cos((a * Math.PI) / 180), y + r * Math.sin((a * Math.PI) / 180))) n++; } return n / tot; });
      return { cotes, anneaux };
    }, png.toString('base64'), 2, { c: m.couleur });
  }
  bilan[largeur] = m;
  const t = `${largeur}`;
  if (!m.present) echecs.push(`${t} : aucune série Galaxy sur le radar (${m.series?.join(', ')})`);
  else {
    if (!m.traits.length) echecs.push(`${t} : aucun chemin de contour pour Galaxy`);
    else if (m.traits[0].largeur < 1.5) echecs.push(`${t} : trait de ${m.traits[0].largeur} px (1,5 px au moins)`);
    if (m.contraste < 3) echecs.push(`${t} : contraste ${m.contraste.toFixed(2)}:1 avec le fond (3:1 au moins), trait ${m.couleur}, fond ${m.fond}`);
    if (m.contrasteGrille < 3) echecs.push(`${t} : contraste ${m.contrasteGrille.toFixed(2)}:1 avec la grille (3:1 au moins), trait ${m.couleur}, grille ${m.grille}`);
    if (m.sommets < 3) echecs.push(`${t} : ${m.sommets} sommets (3 au moins ; valeurs ${m.valeurs})`);
    // Visibilité au pixel : un côté plein montre sa couleur sur 70 % au moins de sa longueur, un côté tireté (5 4) sur 40 %.
    m.pixels.cotes.forEach((c, i) => { const seuil = c.role === 'tirete' ? 0.4 : 0.7; if (c.part < seuil) echecs.push(`${t} : côté ${i + 1} (${c.role}) visible sur ${Math.round(c.part * 100)} % de sa longueur (${Math.round(seuil * 100)} % au moins) : recouvert`); });
    m.pixels.anneaux.forEach((a, i) => { if (a < 0.3) echecs.push(`${t} : sommet ${i + 1} sans anneau à la couleur de Galaxy (${Math.round(a * 100)} % des points autour)`); });
  }
  await browser.close();
}
fs.writeFileSync(path.join(SORTIE, `bilan-${ETAT}.json`), JSON.stringify(bilan, null, 1) + '\n');
console.log(JSON.stringify(bilan));
if (echecs.length) { console.log(`CONTOUR ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('CONTOUR OK');
