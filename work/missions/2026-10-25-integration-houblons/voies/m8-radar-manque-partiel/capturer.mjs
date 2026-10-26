// Voie m8-radar-manque-partiel (D183) : rendre très visible la donnée manquante d'un houblon sur 3 (ou 2 sur 3) au radar de
// Substituer. Ses mots du 26.10, sur sa capture r2 où il a entouré les points de Lotus et Solero près du centre : « Comment c'est
// affiché le donnée manquantes pour que 1 des 3 ? Ou 2 des 3... Ça doit être très visible ».
// Méthode de m5 et m6 : l'écran Substituer de l'app tel quel (`?dev-local&etape=houblons`, VITE_HOP_V4=on, fixtures locales), Lotus
// contre Solero et Calypso (les deux premiers de la liste, comme r2 et sa capture). Les données de l'app, telles quelles :
//   - 1 sur 3 : floral (Calypso, 0 fiche sur 4) ; 2 sur 3 : melon, noyau, pépins, herbacé (Lotus et Solero), baies (Solero et
//     Calypso), résineux (Lotus et Calypso) ; 3 sur 3 : végétal, épicé, terreux (le secteur « sans donnée » regroupé, rdg5).
//   Aucun cas construit : la recette de Lotus les donne tous les trois (donnees-lues.json, lu par lire-donnees.mjs).
// Chaque variante AJOUTE des nœuds préfixés m8r- dans le radar de l'app (L26 : classes m8r-, code dans une fonction, aucun
// remplacement de chaîne). G change en plus des attributs de dessin (rayon, remplissage) des points à 0 ; D est rendue à part,
// par le radar commun de l'app (radar-d.tsx), au-dessus du radar de l'app qui reste intact ; aucun nœud n'est caché ni retiré, tout est rendu tel quel après la capture. L'écran est mesuré avant et après
// chaque variante (fidelite.json, lu par controle-capture-fidele.mjs).
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5268 --strictPort" --port 5268 --timeout 120 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/m8-radar-manque-partiel/capturer.mjs
// M8_SEULE=b,c pour ne refaire que certaines variantes (A est toujours prise).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ICI = import.meta.dirname;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const IMG = path.join(ICI, 'img');
const ZOOM = path.join(os.tmpdir(), 'm8');
fs.mkdirSync(IMG, { recursive: true });
fs.mkdirSync(ZOOM, { recursive: true });
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);
const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
await page.click(champ, { clickCount: 3 });
await page.type(champ, 'Lotus', { delay: 15 });
await page.waitForSelector('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]', { timeout: 30000 });
const lotus = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout'));
await page.click('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]');
await dormir(900);
await page.evaluate((k) => window.__hopPile.open({ view: 'hopSubstitute', hopKey: k }), lotus);
await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 90000 });
await dormir(800);
const liste = await page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((x) => ({ cle: x.getAttribute('data-remplacant'), nom: x.getAttribute('data-houblon-rang') })));
for (const x of liste.slice(0, 2)) { await page.evaluate((c) => document.querySelector(`[data-ecran="substituer"] [data-remplacant="${c}"]`)?.click(), x.cle); await dormir(600); }
await page.waitForSelector('[data-ecran="substituer"] svg[data-radar="base"]', { timeout: 30000 });
await dormir(800);

// Les fiches lues par l'app (niveau, fiches qui citent / fiches lues) : la phrase de la page en dépend.
const FICHES = await page.evaluate(async (cles) => {
  const A = await import('/src/ui/hopIndex/parcours/adaptateur.ts');
  return Object.fromEntries(cles.map((c) => { const h = A.houblon(c); return [h.nom, Object.fromEntries(Object.entries(h.familles).map(([f, v]) => [f, { niveau: v.niveau, fiches: v.fiches, sur: v.sur }]))]; }));
}, [lotus, ...liste.slice(0, 2).map((x) => x.cle)]);

// La mesure de l'écran de l'app : nœuds visibles hors ajouts, et ses blocs (data-role, data-etat, data-element, titres).
const MESURE = () => {
  const ecran = document.querySelector('[data-ecran="substituer"]');
  const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
  const tous = [...ecran.querySelectorAll('*')].filter((e) => !e.closest('.m8r-ajout')).filter(visible);
  const blocs = new Set();
  for (const e of tous) {
    for (const a of ['data-role', 'data-etat', 'data-element', 'data-serie', 'data-point']) { const v = e.getAttribute(a); if (v) blocs.add(`${a.slice(5)}:${v}`); }
    if (/^(H1|H2|H3|SUMMARY)$/.test(e.tagName)) blocs.add(`${e.tagName.toLowerCase()}:${e.textContent.trim().slice(0, 40)}`);
  }
  const ajouts = [...ecran.querySelectorAll('.m8r-ajout')].length;
  return { noeudsHorsRangs: tous.length, blocs: [...blocs].sort(), ajouts };
};

// Les variantes, dans la page rendue.
function injecter(nom) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.querySelector('[data-ecran="substituer"] svg[data-radar="base"]');
  const axes = svg.getAttribute('data-axes').split(',');
  const [CX, CY] = svg.getAttribute('data-centre').split(',').map(Number);
  const RR = 124, N = axes.length, PAS = (2 * Math.PI) / N, R0 = RR / 3;
  const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  const T12 = Math.max(12, 12 / k); // aucun texte sous 12 px à l'écran
  const pt = (i, r) => [CX + Math.sin(i * PAS) * r, CY - Math.cos(i * PAS) * r];
  const rd = (x) => Math.round(x * 10) / 10;
  window.__m8rRendre = window.__m8rRendre ?? [];
  const changer = (el, a, v) => { window.__m8rRendre.push([el, a, el.getAttribute(a)]); el.setAttribute(a, v); };
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); n.setAttribute('class', 'm8r-ajout'); for (const [a, v] of Object.entries(attrs)) n.setAttribute(a, v); (parent ?? svg).appendChild(n); return n; };
  const texte = (x, y, t, attrs, parent) => { const n = el('text', { x: rd(x), y: rd(y), 'text-anchor': 'middle', ...attrs }, parent); n.textContent = t; return n; };

  // Les séries, dans l'ordre de la légende de l'app (l'original d'abord), et leurs valeurs par axe ('' : sans donnée de tous).
  const legende = [...document.querySelectorAll('[data-ecran="substituer"] .pq-substituer-legende-radar > span')].map((s) => s.textContent.replace(/\s*\(.*$/, '').trim());
  const series = [...svg.querySelectorAll('g[data-serie]')].map((g) => ({ g, nom: g.getAttribute('data-serie'), couleur: g.getAttribute('data-couleur'), valeurs: g.getAttribute('data-valeurs').split(','), original: !!g.querySelector('circle[data-point][fill="none"]') }))
    .sort((a, b) => legende.indexOf(a.nom) - legende.indexOf(b.nom));
  // Un manque partiel : une série à 0 (non décrit : aucune de ses fiches ne cite la famille) sur un axe qu'une autre décrit.
  const manques = [];
  axes.forEach((f, i) => {
    const v = series.map((s) => s.valeurs[i]);
    if (v.every((x) => x === '')) return;
    if (!v.some((x) => x !== '' && Number(x.replace(',', '.')) > 0)) return;
    series.forEach((s, j) => { if (v[j] === '0') manques.push({ f, i, s, j, de: v.filter((x) => x === '0').length }); });
  });
  const pointDe = (m) => m.s.g.querySelector(`circle[data-point="${m.f}"]`);
  const traitsDe = (m) => { const c = pointDe(m), x = Number(c.getAttribute('cx')), y = Number(c.getAttribute('cy'));
    return [...m.s.g.querySelectorAll('line[data-role="trait"]')].filter((l) => [['x1', 'y1'], ['x2', 'y2']].some(([a, b]) => Math.abs(Number(l.getAttribute(a)) - x) < 0.3 && Math.abs(Number(l.getAttribute(b)) - y) < 0.3)); };
  const parAxe = new Map();
  for (const m of manques) { if (!parAxe.has(m.i)) parAxe.set(m.i, []); parAxe.get(m.i).push(m); }
  const st = document.createElementNS(NS, 'style'); st.setAttribute('class', 'm8r-ajout');
  st.textContent = `.m8r-q { font: 800 ${T12}px/1 system-ui, sans-serif; fill: #fff; }
.m8r-l { font: 700 ${T12}px/1 system-ui, sans-serif; paint-order: stroke; stroke: #fff; stroke-width: 3.5px; stroke-linejoin: round; }`;
  svg.appendChild(st);
  const avant = (n, ref) => { ref.parentNode.insertBefore(n, ref); return n; };
  const grille = svg.querySelector('g.rb-grille');

  // B · un « ? » posé sur l'axe, à la place des points à 0 : un disque par houblon qui manque, à sa couleur. Deux manques : les
  // deux disques empilés le long de l'axe, le premier sur le 0, le second un cran vers le bord (critique : un disque coupé en deux
  // ne se lisait pas, « 2 sur 3 » passait pour « Solero seul » ; de travers, les axes voisins ne sont qu'à 21 px).
  if (nom === 'b') {
    for (const [i, ms] of parAxe) ms.forEach((m, n) => {
      const [x, y] = pt(i, R0 + n * 19.5), g = el('g', { 'data-m8r': `${m.f} ${m.s.nom}` });
      el('circle', { cx: rd(x), cy: rd(y), r: 8.6, fill: m.s.couleur, stroke: '#fff', 'stroke-width': 1.8 }, g);
      texte(x, y + T12 * 0.36, '?', { class: 'm8r-ajout m8r-q' }, g);
    });
  }

  // C · le secteur de l'axe en trois tranches, une par houblon (dans l'ordre de la légende) : la tranche du houblon dont les
  // fiches ne citent pas la famille est hachurée à sa couleur. Trois tranches hachurées, c'est le secteur « sans donnée ».
  if (nom === 'c') {
    const defs = el('defs', {});
    for (const s of series) {
      const p = el('pattern', { id: `m8r-h-${s.nom}`, width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      // Critique : les hachures pesaient sur l'aire de Calypso. Elles sont sous la grille et sous les aires (insérées avant la
      // grille) ; plus fines et plus claires, l'aire et les contours se lisent par-dessus.
      el('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: s.couleur, 'stroke-width': 1.5, 'stroke-opacity': 0.5 }, p);
    }
    const ang = (a, r) => [CX + Math.sin(a) * r, CY - Math.cos(a) * r];
    for (const m of manques) {
      const a0 = (m.i - 0.5) * PAS + (m.j * PAS) / 3, a1 = a0 + PAS / 3, r = RR - 1, r0 = R0;
      const d = `M${ang(a0, r0).map(rd)} L${ang(a0, r).map(rd)} A${r} ${r} 0 0 1 ${ang(a1, r).map(rd)} L${ang(a1, r0).map(rd)} A${rd(r0)} ${rd(r0)} 0 0 0 ${ang(a0, r0).map(rd)} Z`;
      avant(el('path', { d, fill: `url(#m8r-h-${m.s.nom})`, stroke: m.s.couleur, 'stroke-width': 1, 'stroke-opacity': 0.5, 'data-m8r': `${m.f} ${m.s.nom}` }), grille);
    }
  }

  // D : voir injecterD (le radar commun de l'app, rendu à côté, avec le manque partiel en inconnu de la série).

  // E · au bord, contre le picto de la famille : un « ? » par houblon dont les fiches ne la citent pas, à sa couleur.
  if (nom === 'e') {
    // De part et d'autre du picto, le long du bord (la tangente) : rien ne sort de la largeur du radar.
    for (const [i, ms] of parAxe) {
      const q = pt(i, RR + 16), u = [Math.cos(i * PAS), Math.sin(i * PAS)];
      ms.forEach((m, n) => {
        const d = ms.length === 1 ? 20 : n ? 20 : -20, x = q[0] + u[0] * d, y = q[1] + u[1] * d;
        const g = el('g', { 'data-m8r': `${m.f} ${m.s.nom}` });
        el('circle', { cx: rd(x), cy: rd(y), r: 8.6, fill: m.s.couleur, stroke: '#fff', 'stroke-width': 1.8 }, g);
        texte(x, y + T12 * 0.36, '?', { class: 'm8r-ajout m8r-q' }, g);
      });
    }
  }

  // F (petit point gris) est retiré après la critique : Lotus et Solero au même endroit devenaient le même point gris, « 1 sur 3 »
  // et « 2 sur 3 » ne se distinguaient plus (D183).

  // G · le trou du zéro : le disque du 0 est teinté d'un gris uni très clair (critique : hachuré et nommé, il prenait l'habit du
  // bloc « sans donnée » ; le « 0 » de l'anneau suffit) ; un point qui y tombe devient un rond creux.
  if (nom === 'g') {
    avant(el('polygon', { points: axes.map((_f, i) => pt(i, R0).map(rd).join(',')).join(' '), fill: '#e6e8eb', stroke: '#9ea3aa', 'stroke-width': 1.2, 'data-m8r': 'trou' }), grille);
    for (const m of manques) {
      const c = pointDe(m);
      if (m.s.original) continue; // l'original est déjà un anneau creux (6,2) : le remplaçant, plus petit, se lit dedans
      changer(c, 'r', 4.2); changer(c, 'fill', '#fff'); changer(c, 'stroke', m.s.couleur); changer(c, 'stroke-width', 2);
      const ici = c.parentNode; window.__m8rRendre.push([c, '__parent', ici, c.nextSibling]); svg.appendChild(c);
    }
  }

  // H · la couronne des fiches : autour de chaque picto, trois arcs, un par houblon (ordre de la légende, depuis le haut) ; plein à
  // sa couleur si ses fiches citent la famille, absent (un trait gris en pointillés) sinon. Couronne pleine : les trois en parlent.
  if (nom === 'h') {
    axes.forEach((f, i) => {
      const v = series.map((s) => s.valeurs[i]);
      if (v.every((x) => x === '')) return;
      const q = pt(i, RR + 17), r = 14, g = el('g', { 'data-m8r': `couronne ${f}` });
      series.forEach((s, j) => {
        const a0 = (-90 + j * 120 + 6) * Math.PI / 180, a1 = (-90 + (j + 1) * 120 - 6) * Math.PI / 180;
        const A = [q[0] + Math.cos(a0) * r, q[1] + Math.sin(a0) * r], B = [q[0] + Math.cos(a1) * r, q[1] + Math.sin(a1) * r];
        const cite = v[j] !== '0' && v[j] !== '';
        el('path', { d: `M${A.map(rd)} A${r} ${r} 0 0 1 ${B.map(rd)}`, fill: 'none', stroke: cite ? s.couleur : '#a3a8ae', 'stroke-width': cite ? 3.4 : 1.6, 'stroke-dasharray': cite ? 'none' : '2 2.5', 'stroke-linecap': cite ? 'round' : 'butt' }, g);
      });
    });
  }

  // I · sous le radar, dans la légende de l'app : à côté du nom de chaque houblon, les pictos des familles que ses fiches ne
  // citent pas (alors qu'un autre houblon les cite), barrés. Le radar ne change pas.
  if (nom === 'i') {
    const spans = [...document.querySelectorAll('[data-ecran="substituer"] .pq-substituer-legende-radar > span')];
    for (const s of series) {
      const sp = spans.find((x) => x.textContent.trim().startsWith(s.nom));
      const ms = manques.filter((m) => m.s === s);
      if (!sp || !ms.length) continue;
      const b = document.createElement('span'); b.className = 'm8r-ajout m8r-muet';
      b.setAttribute('aria-label', `${s.nom} : ses fiches ne citent pas ${ms.map((m) => m.f).join(', ')}`);
      b.style.cssText = `display:inline-flex;align-items:center;gap:3px;margin-left:6px;padding:1px 6px 1px 5px;border-radius:9px;border:1.5px dashed ${s.couleur};background:#fff;vertical-align:middle;`;
      const t = document.createElement('b'); t.textContent = 'rien sur'; t.style.cssText = `font:700 14px/1.2 system-ui,sans-serif;color:${s.couleur};margin-right:2px;white-space:nowrap;`;
      b.appendChild(t);
      for (const m of ms) {
        const src = svg.querySelector(`g[data-axe="${m.f}"] > svg`);
        const w = document.createElement('span'); w.style.cssText = 'position:relative;display:inline-block;width:18px;height:18px;';
        const c = src.cloneNode(true); c.removeAttribute('x'); c.removeAttribute('y'); c.setAttribute('width', 18); c.setAttribute('height', 18); c.style.cssText = 'display:block;opacity:.8;';
        const barre = document.createElementNS(NS, 'svg'); barre.setAttribute('width', 18); barre.setAttribute('height', 18); barre.style.cssText = 'position:absolute;inset:0;';
        barre.innerHTML = `<line x1="2" y1="16" x2="16" y2="2" stroke="${s.couleur}" stroke-width="2" stroke-linecap="round"/>`;
        w.append(c, barre); b.appendChild(w);
      }
      sp.appendChild(b);
    }
  }
  return { manques: manques.map((m) => `${m.f}:${m.s.nom} (${m.de} sur ${series.length})`) };
}

// D · la grammaire de l'inconnu de Comparer, dessinée par le radar commun de l'app (radar-d.tsx, RadarBase tel quel) : le manque
// partiel passé comme inconnu de la série (null) au lieu de 0. Pas de point ; le trait qui l'enjambe en tireté, le long de l'anneau
// ou du bord (r2, D180), jamais à travers le radar ; la pastille « ? » à sa couleur au bord ; les points connus inchangés (D181).
// Le radar est rendu en tête de la section, avec une copie de la légende et de la note de l'app ; le radar de l'app reste dessous,
// intact et visible. La capture prend le bloc ajouté.
async function injecterD() {
  const svg = document.querySelector('[data-ecran="substituer"] svg[data-radar="base"]');
  const axes = svg.getAttribute('data-axes').split(',');
  const groupes = [...svg.querySelectorAll('g[data-serie]')];
  const vals = groupes.map((g) => g.getAttribute('data-valeurs').split(','));
  const series = groupes.map((g, j) => {
    const original = !!g.querySelector('circle[data-point][fill="none"]');
    const valeurs = {};
    axes.forEach((f, i) => {
      const x = vals[j][i];
      const autre = vals.some((v, k) => k !== j && v[i] !== '' && Number(v[i]) > 0);
      valeurs[f] = x === '' || (x === '0' && autre) ? null : Number(x);
    });
    return { cle: g.getAttribute('data-serie'), nom: g.getAttribute('data-serie'), couleur: g.getAttribute('data-couleur'), role: original ? 'contour' : g.getAttribute('class') === 'plein' ? 'retenu' : 'autre', valeurs };
  });
  const marquees = [...svg.querySelectorAll('[data-statut-style="attendue"]')].map((g) => g.getAttribute('data-axe') ?? g.getAttribute('data-axe-inconnu'));
  const sec = document.querySelector('[data-ecran="substituer"] [data-etat="etat-subst-radar"]');
  const bloc = document.createElement('div'); bloc.className = 'm8r-ajout m8r-d'; bloc.style.cssText = 'background:#fff;padding:0 0 4px;';
  const boite = document.createElement('div'); boite.className = 'pq-substituer-graphe';
  bloc.appendChild(boite);
  const nettoyer = (n) => { for (const e of [n, ...n.querySelectorAll('*')]) for (const a of [...e.attributes]) if (a.name.startsWith('data-') || a.name === 'id') e.removeAttribute(a.name); return n; };
  for (const p of sec.querySelectorAll(':scope > p')) bloc.appendChild(nettoyer(p.cloneNode(true)));
  sec.insertBefore(bloc, sec.firstChild);
  const M = await import('/work/missions/2026-10-25-integration-houblons/voies/m8-radar-manque-partiel/radar-d.tsx');
  M.rendre(boite, series, marquees);
  window.__m8rD = M;
  await new Promise((r) => setTimeout(r, 600));
  return { series: series.map((s) => `${s.nom} ${s.role} ${axes.map((f) => s.valeurs[f] ?? '·').join('')}`) };
}

const rendre = () => {
  window.__m8rD?.defaire(); window.__m8rD = null;
  for (const r of (window.__m8rRendre ?? []).reverse()) {
    const [n, a, v, suivant] = r;
    if (a === '__parent') v.insertBefore(n, suivant && suivant.parentNode === v ? suivant : null);
    else if (v == null) n.removeAttribute(a); else n.setAttribute(a, v);
  }
  window.__m8rRendre = [];
  document.querySelectorAll('.m8r-ajout').forEach((n) => n.remove());
};

const VARIANTES = [
  { nom: 'a', image: 'a-actuel.png' },
  { nom: 'b', image: 'b-point-interrogation.png' },
  { nom: 'c', image: 'c-tiers-hachures.png' },
  { nom: 'd', image: 'd-inconnu-de-la-serie.png' },
  { nom: 'e', image: 'e-au-picto.png' },
  { nom: 'g', image: 'g-trou-rien-cite.png' },
  { nom: 'h', image: 'h-couronne-fiches.png' },
  { nom: 'i', image: 'i-legende-rien-sur.png' },
];
const seule = process.env.M8_SEULE;
const mesures = [];
let reference = null, manques = null;
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.$eval('[data-ecran="substituer"] [data-etat="etat-subst-radar"]', (e) => e.scrollIntoView({ block: 'center' }));
await dormir(600);
for (const v of VARIANTES) {
  if (seule && v.nom !== 'a' && !seule.split(',').includes(v.nom)) continue;
  const avant = await page.evaluate(MESURE);
  if (v.nom === 'd') console.log('D :', JSON.stringify((await page.evaluate(injecterD)).series));
  else if (v.nom !== 'a') { const r = await page.evaluate(injecter, v.nom); manques = r.manques; }
  await page.mouse.move(1, 1);
  await dormir(400);
  const apres = await page.evaluate(MESURE);
  if (v.nom === 'a') reference = apres;
  const sec = await page.$(v.nom === 'd' ? '.m8r-d' : '[data-ecran="substituer"] [data-etat="etat-subst-radar"]');
  await sec.screenshot({ path: path.join(IMG, v.image) });
  const svgE = await page.$(v.nom === 'd' ? '.m8r-d svg[data-radar="base"]' : '[data-ecran="substituer"] svg[data-radar="base"]');
  await svgE.screenshot({ path: path.join(ZOOM, `zoom-${v.image}`) });
  mesures.push({ image: v.image, colonne: v.nom, avant: { noeudsHorsRangs: avant.noeudsHorsRangs, blocs: avant.blocs }, apres: { noeudsHorsRangs: apres.noeudsHorsRangs, blocs: apres.blocs }, ajouts: apres.ajouts, reference: { blocs: reference.blocs } });
  console.log(v.image, `${avant.noeudsHorsRangs} → ${apres.noeudsHorsRangs} nœuds de l'app, ${apres.ajouts} ajoutés`);
  await page.evaluate(rendre);
  await dormir(200);
}
console.log('manques partiels :', manques?.join(', '));
if (!seule) fs.writeFileSync(path.join(ICI, 'fidelite.json'), JSON.stringify({ lecture: "Radar de Substituer de l'app (Lotus contre Solero et Calypso), mesuré sans puis avec les ajouts m8r-, même état.", compares: liste.slice(0, 2).map((x) => x.nom), fiches: FICHES, manques, mesures }, null, 1) + '\n');
const erreurs = journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));
console.log(erreurs.length ? 'erreurs de page : ' + erreurs.slice(0, 3).join(' | ') : 'aucune erreur de page');
await browser.close();
console.log('CAPTURES', IMG, 'ZOOM', ZOOM);
