// Lot D125 · la liste de la fiche · série c (« les vraies valeurs d'abord : d'où vient chaque mot »).
// Le commun technique des huit concepts flc1 à flc8 : les données lues dans le dépôt, jamais recopiées à la main,
// les pièces de la baseline (pictos au trait, α, usage en mot, stock en badge, croix, lentille au style, « ? »,
// la vraie fiche g1 à l'appui long) et l'assemblage de la page. Aucune mise en page ici : chaque concept compose
// la sienne (M14). Classes préfixées par l'id du concept (L26) ; assemblage par split/join, jamais String.replace.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../../fils21-choisir/w1/socle-w.mjs';
import { runtime } from '../../fils18-baseline/l8g/noyau.mjs';

export { S };
export const ICI = path.dirname(fileURLToPath(import.meta.url));
export const LOT = path.resolve(ICI, '..');
const REPO = S.REPO;
const lire = (f) => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8'));
const PACK = lire('prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
export const JET = lire('work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json');
export const { esc, fr, ic, pic, NOM, COURT, ORDRE } = S;
export const ACC = '#c2410c';

// La roue du radar de la base (agrumes en haut, sens horaire, D39) et l'ordre au style 16D (fils12 : Floral,
// Herbacé, Terreux d'abord, les familles que la 16D accueille, BANDE 0–55 au lieu de 0–30).
export const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
export const STYLE16D = ORDRE.filter((f) => S.BANDE[f][1] > 30);
if (STYLE16D.join() !== 'floral,herbal,earthy') throw new Error('16D : familles attendues changées ' + STYLE16D);

// ---------- les fiches : qui dit quoi, en quelle année ----------
const AN = (f, src) => { const s = (f.alpha.sources || []).find((x) => x.source === src); return s ? s.annee : null; };
// Traduction des mots anglais des fiches (D97) ; l'original reste lisible dans le détail.
const TRAD = {
  'white wine': 'vin blanc', fruity: 'fruité', grape: 'raisin', gooseberry: 'groseille à maquereau', pineapple: 'ananas',
  floral: 'floral', woody: 'boisé', resiny: 'résineux', resinous: 'résineux', 'fresh lime': 'citron vert', 'lemon zest': 'zeste de citron',
  citrus: 'agrumes', mojito: 'mojito', lime: 'citron vert', 'black currant': 'cassis',
};
const tr = (w) => { const k = w.trim().toLowerCase(); return TRAD[k] || k; };
const COURTSRC = { 'Beer Maverick': 'BM', Hopsteiner: 'HS', 'Hopsteiner (boutique US)': 'HS US', 'Yakima Chief Hops': 'YCH' };
// Une fiche lue : son auteur, son année (celle de sa plage α ; « ? » si le dépôt ne la donne pas), ses mots dans
// l'ordre de la fiche, et pour chacun : le mot tel qu'écrit, sa langue, sa nature (mot de dégustation, ou
// famille déclarée / étiquette : un rangement du fournisseur, pas un mot goûté).
function fichesDe(f) {
  const out = [];
  const bm = f.descripteurs.beerMaverick || [];
  if (bm.length) out.push({ src: 'Beer Maverick', an: AN(f, 'Beer Maverick'), mots: bm.map((w, i) => ({ fr: tr(w), orig: w, en: false, nature: 'mot', rang: i + 1 })) });
  const hs = f.descripteurs.hopsteiner || [];
  if (hs.length) {
    const cat = (hs.find((x) => /^Familles déclarées/.test(x)) || '').replace(/^[^:]+:\s*/, '').replace(/\.$/, '').split(/,\s*/).filter(Boolean);
    const des = (hs.find((x) => /^Descripteurs de la fiche/.test(x)) || '').replace(/^[^:]+:\s*/, '').replace(/\.$/, '').split(/,\s*/).filter(Boolean);
    out.push({ src: 'Hopsteiner', an: AN(f, 'Hopsteiner'), mots: [
      ...des.map((w, i) => ({ fr: tr(w), orig: w, en: true, nature: 'mot', rang: i + 1 })),
      ...cat.map((w) => ({ fr: tr(w), orig: w, en: false, nature: 'famille déclarée', rang: null })),
    ] });
  }
  for (const c of f.descripteurs.cites || []) {
    const m = c.text.replace(/^[^:]+:\s*/, '').replace(/\.$/, '');
    const [d, et] = m.split(/\s*;\s*étiquette\s*/);
    const ws = d.split(/\s*(?:,|\band\b)\s*/).filter(Boolean);
    out.push({ src: c.author, an: AN(f, c.author), url: c.url, mots: [
      ...ws.map((w, i) => ({ fr: tr(w), orig: w, en: true, nature: 'mot', rang: i + 1 })),
      ...(et ? [{ fr: tr(et), orig: et, en: true, nature: 'étiquette', rang: null }] : []),
    ] });
  }
  return out;
}
// La famille d'un mot : celle où le pack le range (aromes[].mots), sinon aucune (motsSansFamille).
function familleDe(f, src, orig) {
  for (const a of f.aromes) for (const m of a.mots || []) if (m.source === src && m.mots.some((x) => x.toLowerCase() === orig.toLowerCase())) return a.family;
  return null;
}
const QUI = { Nugget: 'Nugget', 'Nelson Sauvin': 'Nelson Sauvin', 'Citra cryo': 'Citra cryo', Motueka: 'Motueka', Cascade: 'Cascade' };
const CLE_FD = { 'Citra cryo': 'Citra' }; // la fiche g1 du socle : « Citra » est construite sur la fiche du cryo.
export const H = {};
for (const nom of Object.keys(QUI)) {
  const f = PACK.find((x) => x.name === nom);
  if (!f) throw new Error('fiche absente : ' + nom);
  const fiches = fichesDe(f);
  const N = (f.aromes[0] || {}).of;
  if (N !== fiches.length) throw new Error(nom + ' : ' + fiches.length + ' fiches lues, ' + N + ' dans le pack');
  // Les mots, dédoublonnés par leur forme française : un mot = qui le dit, sous quelle forme, en quel rang.
  const M = new Map();
  for (const fi of fiches) for (const m of fi.mots) {
    const fam = familleDe(f, fi.src, m.orig);
    const x = M.get(m.fr) || { fr: m.fr, fam: null, par: [] };
    if (fam && !x.fam) x.fam = fam;
    if (!x.par.some((p) => p.src === fi.src)) x.par.push({ src: fi.src, an: fi.an, orig: m.orig, en: m.en, nature: m.nature, rang: m.rang });
    else { const p = x.par.find((p) => p.src === fi.src); if (p.nature !== 'mot' && m.nature === 'mot') Object.assign(p, { orig: m.orig, en: m.en, nature: 'mot', rang: m.rang }); }
    M.set(m.fr, x);
  }
  const mots = [...M.values()].map((x) => ({ ...x, n: x.par.length, gout: x.par.some((p) => p.nature === 'mot'), premier: x.par.filter((p) => p.rang === 1).map((p) => p.src) }))
    .sort((a, b) => b.n - a.n || (b.gout - a.gout) || ((a.par[0].rang || 99) - (b.par[0].rang || 99)));
  // Vérifie qu'aucun mot n'est inventé : chaque forme écrite est dans les descripteurs ou les familles du pack.
  const tout = JSON.stringify(f.descripteurs) + JSON.stringify(f.aromes) + JSON.stringify(f.motsSansFamille);
  for (const x of mots) for (const p of x.par) if (!tout.toLowerCase().includes(p.orig.toLowerCase())) throw new Error(nom + ' : mot introuvable ' + p.orig);
  const fam = Object.fromEntries(ORDRE.map((k) => { const a = f.aromes.find((y) => y.family === k); return [k, { n: a.sources, of: a.of, auteurs: a.authors, mots: mots.filter((m) => m.fam === k) }]; }));
  const al = f.alpha.sources.map((s) => ({ src: s.source, an: s.annee, min: s.min, max: s.max }));
  const recente = al.reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
  const hop = S.HOP[CLE_FD[nom] || nom];
  H[nom] = {
    nom, cle: CLE_FD[nom] || nom, couleur: hop.couleur, origine: f.origin, N, fiches: fiches.map((x) => ({ src: x.src, an: x.an, court: COURTSRC[x.src] || x.src, n: x.mots.length })),
    mots, fam, hors: mots.filter((m) => !m.fam), alpha: { sources: al, recente, lot: f.alpha.retenu ? f.alpha.retenu.value : null, lotDe: f.alpha.retenu ? f.alpha.retenu.from : null, cryo: /cryo/i.test(nom) },
    role: { v: f.role.value, regle: /^règle/.test(f.role.source) }, stock: { g: f.stock.grams, etat: f.stock.etat },
  };
}
export const HOPS = Object.keys(H);
export const SRC_AN = (p) => (p.an ? p.src + ' ' + p.an : p.src + ', année ?');
export const anTxt = (an) => (an ? String(an) : '?');

// ---------- pièces de la baseline ----------
const ROLE_MOT = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'double usage' };
export const nomH = (h, cls = '') => `<span class="hn ${cls}" data-houblon="${esc(H[h].cle)}" data-couleur="${H[h].couleur}" tabindex="0">${esc(h)}</span>`;
export const role = (h, cls = '') => `<span class="us us-mot${H[h].role.regle ? ' deduit' : ''} ${cls}" data-role="usage" data-usage="${H[h].role.v}" aria-label="Usage : ${ROLE_MOT[H[h].role.v]}${H[h].role.regle ? ', déduit de l’α, à valider' : ', dit par le fournisseur'}"><span class="us-m">${ROLE_MOT[H[h].role.v]}</span></span>`;
export const roleMot = (h) => ROLE_MOT[H[h].role.v];
export const plage = (s) => (s.min === s.max ? fr(s.min) : fr(s.min) + '–' + fr(s.max));
// α : la plage de la fiche la plus récente en gros, le lot à côté (fiche g1) ; Citra cryo : le lot, la fiche est celle des pellets.
export function alpha(h, P) {
  const A = H[h].alpha, r = A.recente;
  if (A.cryo) return `<span class="${P}-al" data-role="alpha"><span class="${P}-alg">α <b class="mono">${fr(A.lot)} %</b></span><span class="${P}-all">lot · fiche ${plage(r)} % en pellets</span></span>`;
  const lo = Math.min(...A.sources.map((x) => x.min)), hi = Math.max(...A.sources.map((x) => x.max)), hors = A.lot != null && (A.lot < lo || A.lot > hi);
  return `<span class="${P}-al" data-role="alpha"><span class="${P}-alg">α <b class="mono">${plage(r)} %</b></span><span class="${P}-all">${esc(r.src)} ${r.an} · lot ${fr(A.lot)} %${hors ? ' hors de ses fiches' : ''}</span></span>`;
}
export function stock(h, cls = '') {
  const s = H[h].stock, k = s.g > 0 ? ['stock', s.g + ' g'] : ['achat', 'épuisé'];
  return `<span class="${cls}" role="img" aria-label="Stock : ${s.g > 0 ? s.g + ' g en stock' : 'épuisé, à acheter'}">${ic(k[0], 14)}<span>${k[1]}</span></span>`;
}
export const croix = (P) => `<button type="button" class="${P}-x" data-role="sortir" aria-label="Fermer la fiche">${ic('x', 18)}</button>`;
export const lentille = (P) => `<span class="seg lentille ${P}-lent" role="radiogroup" aria-label="Lecture au style ou absolue"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>`;
export const legB = (P) => `<button type="button" class="leg-b ${P}-lb" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Lire la légende">?</button>`;
// Le changement de houblon (contexte de la maquette : on regarde la même forme sur ses cinq houblons de référence).
// Toucher court : la liste de ce houblon ; appui long : sa vraie fiche g1.
export const choix = (P, actif, cls = '') => `<nav class="${P}-hs ${cls}" aria-label="Voir la fiche d’un autre houblon">${HOPS.map((h) => `<button type="button" class="${P}-hb" data-hsel="${esc(h)}" aria-pressed="${h === actif}"><span class="hn" data-houblon="${esc(H[h].cle)}" data-couleur="${H[h].couleur}"><i class="${P}-hp" style="background:${H[h].couleur}" aria-hidden="true"></i>${esc(h)}</span></button>`).join('')}</nav>`;
// Une marque de source : ses initiales et son année, au trait ; pleine si c'est un mot goûté, creuse si c'est un rangement.
export const marque = (P, p) => `<span class="${P}-sm${p.nature === 'mot' ? '' : ' cat'}" aria-label="${esc(SRC_AN(p))}${p.nature === 'mot' ? '' : ' (' + p.nature + ')'}${p.en ? ', écrit « ' + esc(p.orig) + ' »' : ''}">${esc(COURTSRC[p.src] || p.src)}<sup>${p.an ? String(p.an).slice(2) : '?'}</sup></span>`;
export { COURTSRC };

// ---------- le radar de la fiche (un seul composant, D39/D48 : 12 axes, agrumes en haut ; rayon = fiches qui citent / fiches lues) ----------
export function radar(h, o = {}) {
  const P = o.P, R = o.r || 70, L = o.lab ?? 30, W = o.w || 2 * (R + L), HV = 2 * (R + (o.labv ?? L)), C = W / 2, CY = HV / 2, X = H[h];
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 12;
  const pt = (i, v) => [C + Math.cos(ang(i)) * R * v, CY + Math.sin(ang(i)) * R * v];
  const v = ROUE.map((f) => (X.fam[f].n ? X.fam[f].n / X.N : 0));
  const anneaux = Array.from({ length: X.N }, (_, k) => (k + 1) / X.N).map((q) => `<polygon points="${ROUE.map((_, i) => pt(i, q).map((z) => z.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#d4d6dc" stroke-width="1"/>`).join('');
  const hach = ROUE.map((f, i) => (X.fam[f].n ? '' : `<path d="M${C},${CY} L${pt(i - 0.5, 1).join(',')} A${R},${R} 0 0 1 ${pt(i + 0.5, 1).join(',')} Z" fill="url(#${P}-hach)"/>`)).join('');
  const rayons = ROUE.map((f, i) => `<line x1="${C}" y1="${CY}" x2="${pt(i, 1)[0].toFixed(1)}" y2="${pt(i, 1)[1].toFixed(1)}" stroke="#e1e3e8" stroke-width="1"/>`).join('');
  const bras = ROUE.map((f, i) => (v[i] ? `<line data-famille="${f}" x1="${C}" y1="${CY}" x2="${pt(i, v[i])[0].toFixed(1)}" y2="${pt(i, v[i])[1].toFixed(1)}" stroke="${JET[f].base}" stroke-width="2.5"/>` : '')).join('');
  const poly = `<polygon points="${ROUE.map((_, i) => pt(i, Math.max(v[i], 0.04)).map((z) => z.toFixed(1)).join(',')).join(' ')}" fill="rgba(22,22,26,.10)" stroke="#16161a" stroke-width="1.5" stroke-linejoin="round"/>`;
  const pts = ROUE.map((f, i) => (v[i] ? `<circle cx="${pt(i, v[i])[0].toFixed(1)}" cy="${pt(i, v[i])[1].toFixed(1)}" r="3.2" fill="#16161a"/>` : `<circle cx="${pt(i, 0.1)[0].toFixed(1)}" cy="${pt(i, 0.1)[1].toFixed(1)}" r="2.4" fill="#fff" stroke="#6b6f78" stroke-width="1.2"/>`)).join('');
  const lab = o.nolab ? '' : ROUE.map((f, i) => {
    const [x, y] = pt(i, 1 + (o.ecart || 0.2)), a = Math.cos(ang(i)), ta = Math.abs(a) < 0.3 ? 'middle' : a > 0 ? 'start' : 'end';
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${ta}" class="${P}-rl${X.fam[f].n ? '' : ' inc'}">${COURT[f]}${o.nn === false ? '' : X.fam[f].n ? ' ' + X.fam[f].n + '/' + X.N : '?'}</text>`;
  }).join('');
  return `<svg class="${P}-radar" width="${W}" height="${HV}" viewBox="0 0 ${W} ${HV}" data-radar data-objet="liste" role="img" aria-label="Radar de ${esc(h)} : ${ROUE.filter((f) => X.fam[f].n).map((f) => COURT[f] + ' ' + X.fam[f].n + ' fiche(s) sur ' + X.N).join(', ')} ; autres familles non décrites">
  <defs><pattern id="${P}-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c3c6cd" stroke-width="1.2"/></pattern></defs>
  ${hach}${anneaux}${rayons}${poly}${bras}${pts}${lab}</svg>`;
}

// ---------- la légende (derrière « ? ») ----------
export const legende = (extra = '') => `<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <div class="w-leg-s"><h3>Les familles</h3><div class="w-leg-g">${ORDRE.map((f) => `<span class="w-leg-i">${pic(f, 18)}${COURT[f]}</span>`).join('')}</div></div>
  <div class="w-leg-s"><h3>D’où vient un mot</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><b>BM</b>Beer Maverick (2023)</span><span class="w-leg-i"><b>HS</b>Hopsteiner (2025)</span>
    <span class="w-leg-i"><b>HS US</b>boutique US de Hopsteiner, année absente du dépôt</span><span class="w-leg-i"><b>YCH</b>Yakima Chief Hops, année absente</span>
    <span class="w-leg-i"><b>2/2</b>fiches qui citent le mot, sur les fiches lues</span><span class="w-leg-i"><b>contour</b>famille déclarée par le fournisseur : un rangement, pas un mot goûté</span>
    <span class="w-leg-i"><b>gris</b>mot hors des 12 familles : le radar ne sait pas le dessiner</span><span class="w-leg-i"><b>hachuré</b>aucune fiche ne le dit : inconnu, jamais zéro</span>
    <span class="w-leg-i"><b>Au style</b>les familles que ta 16D accueille d’abord (floral, herbacé, terreux)</span><span class="w-leg-i">${ic('main', 16)}appui long sur un nom : sa fiche complète</span></div></div>
  ${extra}
</section>`;

// ---------- la page ----------
export const CSS_BASE = `
  html, body { background: #fff; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 0; gap: 0; }
  .hn { text-decoration: none; }
  svg[data-radar] { overflow: visible; }
  .seg.lentille { border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad2; overflow: hidden; }
  .seg.lentille button[aria-checked="true"] { background: #16161a; color: #fff; }
  .w-leg-i b { font: 600 12px var(--mono); min-width: 44px; display: inline-block; }`;
// Le script commun : changer de houblon (sections [data-h]), et rien d'autre ; chaque concept ajoute le sien.
const JS_CHOIX = `(function () {
  const montrer = (h) => {
    document.querySelectorAll('[data-h]').forEach((s) => { s.hidden = s.dataset.h !== h; });
    document.querySelectorAll('[data-hsel]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hsel === h)));
    const abs = document.body.classList.contains('abs');
    document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String((x.dataset.e === 'absolu') === abs)));
    document.dispatchEvent(new CustomEvent('houblon', { detail: h }));
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-hsel]'); if (b) montrer(b.dataset.hsel); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-role="sortir"]'); if (b) b.closest('main').classList.toggle('ferme-demande'); });
  const q = new URLSearchParams(location.search).get('h'); if (q && document.querySelector('[data-h="' + q + '"]')) montrer(q);
})();`;
export function page({ id, chaleur, titre, resume, corps, css = '', js = '', extraLegende = '', fond = '#fff' }) {
  const FD = JSON.parse(JSON.stringify(S.FICHES));
  for (const h of HOPS) { const k = H[h].cle; if (FD[k]) FD[k].stock = H[h].stock.g > 0 ? 'suffisant' : 'à acheter'; }
  const rt = runtime({ extra: '' }).split(/const FD = [^\n]*;\nconst ROUE/).join('const FD = ' + JSON.stringify(FD) + ';\nconst ROUE');
  if (!rt.includes('"Nelson Sauvin"')) throw new Error('fiche : FD non remplacé');
  const SIM = { B: S.BANDE, C: S.CRAN, NOM, AV: {} };
  return ['<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n',
    `<title>${esc(id)} · la liste de la fiche · ${esc(titre)}</title>\n`,
    `<!-- Lot D125 · série c (les vraies valeurs d'abord) · ${esc(id)} · chaleur ${esc(chaleur)} · ${esc(resume)} -->\n`,
    S.POLICES, '\n<style>', S.CSS, CSS_BASE, `\n  html, body { background: ${fond}; }\n`, css, '</style>\n</head>\n<body>\n', S.SYMB,
    '\n<main class="ecran">', corps, '\n</main>\n', legende(extraLegende),
    '\n<div class="w-voile" data-role="feuille-voile" hidden></div><div class="w-feuille" role="dialog" aria-label="Détail"></div>\n',
    '<script>const SIM = ', JSON.stringify(SIM), ';\n', S.JS_COMMUN, '\n', JS_CHOIX, '\n', js, '</script>\n<script>', rt, '</script>\n</body>\n</html>\n'].join('');
}
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(REPO, f).split(path.sep).join('/') + ' (' + Math.round(s.length / 1024) + ' Ko)'); };
// Une section par houblon : le concept la dessine pour chacun, seule la première est visible.
export const sections = (P, defaut, rendu) => [defaut, ...HOPS.filter((h) => h !== defaut)].map((h) => `<section class="${P}-sec" data-h="${esc(h)}"${h === defaut ? '' : ' hidden'}>${rendu(h)}</section>`).join('');
