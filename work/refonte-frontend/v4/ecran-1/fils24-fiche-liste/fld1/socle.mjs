// Série d (voie fl-d, lot D125) : le socle des huit concepts « Que sent ce houblon, dit avec ses mots ? ».
// Approche : des représentations distinctes (rangées, puces, nuage, échelle, carte, roue, cible, iceberg).
// Ce socle porte le cadre de la fiche g1 (son choix, règle n° 1) : feuille, nom et ⊙, α en plage puis lot et
// jauge, usage en mot, stock en petit badge, radar d'abord (D115), « + Floral / − Résineux » de sa demande, ♡ ⊘ et
// « Comparer » en pied, croix pour sortir (D109). La liste, seul facteur libre, vient de chaque concept.
// Baseline : pictos au trait (épicé : cannelle et clou croisés, planche fils17-standard/v3), couleurs des familles,
// au style par défaut (absolu à un toucher), légende derrière « ? », appui long → fiche courte (D25).
// Honnêteté : chaque mot vient d'une fiche (pack-fiches.json), traduit en français (D97) avec son mot d'origine ;
// n/N = nombre de fiches qui le citent ; une famille non décrite est « ? » hachurée, jamais zéro.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ici = path.dirname(fileURLToPath(import.meta.url));
const R = path.join(ici, '../../../../../..');
const lire = (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
const PACK = lire('prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
export const JET = lire('work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json');
const STOUT = lire('work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json').style;
const PLANCHE = fs.readFileSync(path.join(R, 'work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html'), 'utf8');
const SYMS = {};
for (const s of PLANCHE.match(/<symbol id="p-[a-zA-Z]+"[^]*?<\/symbol>/g)) { const id = s.match(/id="([^"]+)"/)[1]; if (!SYMS[id]) SYMS[id] = s; }
export const SYMBOLES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.values(SYMS).join('')}</defs></svg>`;

export const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
export const STYLE = { code: '16D', nom: 'Foreign Extra Stout', attendues: Object.entries(STOUT.zone).filter(([, v]) => v.statut === 'attendue').map(([k]) => k), citation: STOUT.citation };
// Couleurs de houblon reprises des lots précédents (D83 S1 : une couleur par houblon, partout).
export const COULEUR = { Nugget: '#2b68da', 'Nelson Sauvin': '#0b6e63', 'Citra cryo': '#c2185b', Motueka: '#4a1fd6', Cascade: '#781838' };
export const NOMS = ['Nugget', 'Nelson Sauvin', 'Citra cryo', 'Motueka', 'Cascade'];
export const slug = (n) => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');

// Les mots anglais des fiches, en français (D97 : « black currant » → cassis). Le mot d'origine reste lisible.
const TRAD = { pineapple: 'ananas', floral: 'floral', woody: 'boisé', resinous: 'résineux', resiny: 'résineux', 'white wine': 'vin blanc', fruity: 'fruité', grape: 'raisin', gooseberry: 'groseille à maquereau', 'fresh lime': 'citron vert', 'lemon zest': 'zeste de citron', citrus: 'agrumes', lime: 'citron vert', 'black currant': 'cassis' };
const tr = (m) => TRAD[m.toLowerCase()] || m.toLowerCase();
const anglais = (m) => !!TRAD[m.toLowerCase()] && TRAD[m.toLowerCase()] !== m.toLowerCase();
const GENERIQUES = new Set(['fruité']); // « fruité » : 77 variétés du catalogue (descripteurs-hors-familles)
const ABR = { 'Beer Maverick': 'Beer Maverick', Hopsteiner: 'Hopsteiner', 'Hopsteiner (boutique US)': 'Hopsteiner US', 'Yakima Chief Hops': 'Yakima Chief' };
const ROLE = { aromatique: 'aromatique', double: 'double usage', amérisant: 'amérisant' };

function analyser(h) {
  const N = h.aromes[0].of;
  const decl = (h.descripteurs.hopsteiner || []).find((t) => /^Familles déclarées/.test(t));
  const fine = ((h.descripteurs.hopsteiner || []).find((t) => /^Descripteurs/.test(t)) || '').toLowerCase();
  const cats = new Set(decl ? decl.replace(/^[^:]*:\s*/, '').replace(/\.$/, '').split(/,\s*/).map((x) => x.toLowerCase()) : []);
  const brut = [];
  for (const a of h.aromes) for (const g of a.mots) g.mots.forEach((m, i) => brut.push({ orig: m, fr: tr(m), fam: a.family, s: g.source, rang: i, premierFam: a.premier.includes(g.source) && i === 0 }));
  for (const x of h.motsSansFamille) brut.push({ orig: x.mot, fr: tr(x.mot), fam: null, s: x.source, rang: 99 });
  const parMot = new Map();
  for (const b of brut) {
    // Une catégorie Hopsteiner (« Familles déclarées sur houblon brut ») n'est pas un descripteur, sauf si la ligne fine le cite aussi.
    const estCat = b.s === 'Hopsteiner' && b.orig[0] === b.orig[0].toUpperCase() && cats.has(b.orig.toLowerCase()) && !fine.includes(b.orig.toLowerCase().replace('fruité', 'fruity'));
    const k = b.fr;
    if (!parMot.has(k)) parMot.set(k, { fr: k, fam: b.fam, src: [], cat: true, premier: [] });
    const w = parMot.get(k);
    if (!w.fam && b.fam) w.fam = b.fam;
    if (!w.src.some((x) => x.s === b.s)) w.src.push({ s: b.s, court: ABR[b.s] || b.s, orig: b.orig, anglais: anglais(b.orig) });
    if (!estCat) w.cat = false;
    if (b.premierFam && !w.premier.includes(b.s)) w.premier.push(b.s);
  }
  const mots = [...parMot.values()].map((w) => ({ ...w, n: w.src.length, N, gen: GENERIQUES.has(w.fr), nomFam: !!w.fam && w.fr === COURT[w.fam].toLowerCase(), style: w.fam ? (STYLE.attendues.includes(w.fam) ? 'dans' : 'hors') : 'inconnu', en: w.src.filter((x) => x.anglais).map((x) => x.orig) }));
  const ordreFam = (f) => (f ? ROUE.indexOf(f) : 99);
  mots.sort((a, b) => b.n - a.n || (a.cat - b.cat) || (a.gen - b.gen) || ordreFam(a.fam) - ordreFam(b.fam));
  const familles = h.aromes.filter((a) => a.level > 0).map((a) => ({ f: a.family, nom: COURT[a.family], n: a.sources, N: a.of, level: a.level, premier: a.premier.length > 0, mots: mots.filter((m) => m.fam === a.family), dans: STYLE.attendues.includes(a.family) }))
    .sort((a, b) => b.n - a.n || b.level - a.level || ROUE.indexOf(a.f) - ROUE.indexOf(b.f));
  const nonDecrites = h.aromes.filter((a) => a.level === 0).map((a) => a.family);
  const horsFam = mots.filter((m) => !m.fam);
  const nbMotsFiches = h.aromes.reduce((s, a) => s + a.mots.reduce((t, g) => t + g.mots.length, 0), 0) + h.motsSansFamille.length;
  const part = h.motsSansFamille.length / nbMotsFiches;
  const A = h.alpha, amin = Math.min(...A.sources.map((s) => s.min)), amax = Math.max(...A.sources.map((s) => s.max));
  const sources = [...new Set(brut.map((b) => b.s))];
  return {
    nom: h.name, key: h.key, slug: slug(h.name), couleur: COULEUR[h.name], N, mots, familles, nonDecrites, horsFam, part, nbMotsFiches, nbHors: h.motsSansFamille.length,
    alpha: { lot: A.retenu.value, min: amin, max: amax, horsFiches: A.retenu.value < amin || A.retenu.value > amax, sources: A.sources.map((s) => s.source + ' ' + s.annee) },
    role: h.role.value, usage: ROLE[h.role.value] || h.role.value, stock: h.stock, sources, origine: h.origin,
    radarMax: Math.max(1, ...familles.map((f) => f.n)),
  };
}
export const HOPS = Object.fromEntries(NOMS.map((n) => [n, analyser(PACK.find((x) => x.name === n))]));

export const fr = (x, d = 0) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
export const fr1 = (x) => (Number.isInteger(x) ? String(x) : fr(x, 1));
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const T = (f) => JET[f].texte, B = (f) => JET[f].base, F = (f) => JET[f].fond;
export const pic = (f, t = 16, cls = 'fd-pi') => `<svg class="${cls}" width="${t}" height="${t}" viewBox="0 0 24 24" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
export const nf = (w) => `${w.n}/${w.N}`;
export const origine = (w) => w.src.map((s) => s.court + (s.anglais ? ' « ' + s.orig + ' »' : '')).join(' · ');

// Icônes dessinées : une seule épaisseur rendue partout (D83 S4) : viewBox = taille, trait 1,8.
const IC = {
  croix: (t = 20) => `<svg width="${t}" height="${t}" viewBox="0 0 ${t} ${t}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M${t * 0.22} ${t * 0.22}L${t * 0.78} ${t * 0.78}M${t * 0.78} ${t * 0.22}L${t * 0.22} ${t * 0.78}"/></svg>`,
  coeur: (t = 18) => `<svg width="${t}" height="${t}" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M9 15.2S2.4 11.3 2.4 6.8a3.3 3.3 0 0 1 6.6-1.1 3.3 3.3 0 0 1 6.6 1.1c0 4.5-6.6 8.4-6.6 8.4Z"/></svg>`,
  exclu: (t = 18) => `<svg width="${t}" height="${t}" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="9" r="6.6"/><path d="M4.4 13.6l9.2-9.2"/></svg>`,
  repere: (t = 14) => `<svg width="${t}" height="${t}" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="7" cy="7" r="5.6"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/></svg>`,
  sac: (t = 14) => `<svg width="${t}" height="${t}" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3.2 5h7.6l-.8 7H4z"/><path d="M5.2 5V3.6a1.8 1.8 0 0 1 3.6 0V5"/></svg>`,
};
export { IC };

// ---------- le cadre g1 ----------
export const fond = (h) => `<div class="fd-fond" aria-hidden="true"><span class="fd-fond-t">‹ Houblons <small>3/7</small></span><span class="fd-fond-v">IBU 60 · OG 1,066 · EBC 70</span><span class="fd-fond-s">16D hypothèse</span></div>`;
export const titre = (h, extra = '') => `<div class="fd-tete"><span class="fd-nom" data-houblon="${esc(h.nom)}" data-couleur="${h.couleur}" data-appui>${esc(h.nom)}</span><span class="fd-rep" style="color:${h.couleur}" aria-label="Repère : houblon de la fiche">${IC.repere()}</span>${extra}<button type="button" class="fd-x" aria-label="Fermer la fiche et revenir aux houblons">${IC.croix()}</button></div>`;
export const stock = (h) => `<span class="fd-stock" title="stock">${IC.sac(14)}<span>${h.stock.grams ? h.stock.grams + ' g' : 'épuisé'}</span></span>`;
export function jauge(h) {
  const lo = 0, hi = 26, x = (v) => ((v - lo) / (hi - lo)) * 100;
  return `<span class="fd-jauge" aria-label="α du lot dans la plage des fiches"><i class="fd-jauge-p" style="left:${x(h.alpha.min)}%;width:${x(h.alpha.max) - x(h.alpha.min)}%"></i><i class="fd-jauge-l" style="left:${x(h.alpha.lot)}%"></i></span>`;
}
export const alpha = (h) => `<div class="fd-alpha"><span class="fd-a-g"><span class="fd-a-sym">α</span> <b class="num">${fr1(h.alpha.min)}–${fr1(h.alpha.max)} %</b></span><span class="fd-a-lot">lot <span class="num">${fr1(h.alpha.lot)} %</span>${h.alpha.horsFiches ? ' <b class="fd-hf">≠ fiches</b>' : ''}</span>${jauge(h)}<span class="fd-usage" data-role="usage">${h.usage}</span>${stock(h)}</div>`;

// Le radar de g1 (radar d'abord, D115) : 12 axes, « n/N », inconnus « ? » hachurés, flèches de sa demande.
export function radar(h, { taille = 300, etiquettes = true, cls = '', extra = '', marge = 1, haut = null } = {}) {
  const W = 390, Hh = haut || taille, c = [W / 2, Hh / 2], r = Math.min(W / 2 - 84, Hh / 2 - 22) * marge, n = 12;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const P = (i, k) => [c[0] + k * r * Math.cos(ang(i)), c[1] + k * r * Math.sin(ang(i))];
  const pt = (i, k) => P(i, k).map((v) => v.toFixed(1)).join(',');
  const lv = Object.fromEntries(h.familles.map((f) => [f.f, f]));
  let s = `<svg class="fd-radar ${cls}" viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="Radar de ${esc(h.nom)} selon ses fiches ; hachuré : non décrit"><defs><pattern id="fd-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#c4c5cc" stroke-width="1.2"/></pattern></defs>`;
  for (const k of [0.5, 1]) s += `<polygon points="${ROUE.map((f, i) => pt(i, k)).join(' ')}" fill="none" stroke="#d4d5db" stroke-width="1"/>`;
  ROUE.forEach((f, i) => { if (!lv[f]) s += `<path d="M${c[0]},${c[1]}L${pt(i - 0.5, 1)}L${pt(i + 0.5, 1)}Z" fill="url(#fd-hach)"/>`; });
  ROUE.forEach((f, i) => { s += `<line x1="${c[0]}" y1="${c[1]}" x2="${P(i, 1)[0].toFixed(1)}" y2="${P(i, 1)[1].toFixed(1)}" stroke="${lv[f] ? B(f) : '#e2e3e8'}" stroke-width="${lv[f] ? 1.6 : 1}"/>`; });
  const k = (f) => (lv[f] ? lv[f].n / h.radarMax : 0.06);
  s += `<polygon points="${ROUE.map((f, i) => pt(i, k(f))).join(' ')}" fill="rgba(22,22,26,.08)" stroke="#16161a" stroke-width="2" stroke-linejoin="round"/>`;
  ROUE.forEach((f, i) => { if (lv[f]) { const [x, y] = P(i, k(f)); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${lv[f].n === h.radarMax ? '#16161a' : '#fff'}" stroke="#16161a" stroke-width="1.6"/>`; } });
  if (etiquettes) ROUE.forEach((f, i) => {
    const x = c[0] + (r + 12) * Math.cos(ang(i)), y = c[1] + (r + 12) * Math.sin(ang(i)) + (Math.sin(ang(i)) > 0.9 ? 16 : Math.sin(ang(i)) < -0.9 ? -2 : 0), a = Math.cos(ang(i));
    const anc = a > 0.3 ? 'start' : a < -0.3 ? 'end' : 'middle';
    const d = lv[f];
    s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anc}" class="fd-rl${d ? '' : ' fd-rl-i'}">${COURT[f]}${d ? ` <tspan class="fd-rn">${d.n}/${d.N}</tspan>` : '?'}</text>`;
  });
  // Les flèches de sa demande : « ma stout est trop résineuse, je la veux plus florale » (18.10).
  for (const [f, sens] of [['floral', 1], ['resin', -1]]) {
    const i = ROUE.indexOf(f), [x1, y1] = P(i, 1.02), [x2, y2] = P(i, sens > 0 ? 1.12 : 0.92);
    if (lv[f]) s += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}" stroke="#16161a" stroke-width="2" marker-end="url(#fd-fl)"/>`;
  }
  s += `<defs><marker id="fd-fl" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8z" fill="#16161a"/></marker></defs>`;
  return s + extra + '</svg>';
}
export function demande(h) {
  const fl = h.familles.find((f) => f.f === 'floral'), rs = h.familles.find((f) => f.f === 'resin');
  return `<p class="fd-dem" aria-label="Ce que ${esc(h.nom)} fait pour ta demande"><span>+ <b>Floral</b> ${fl ? nf(fl) : '?'}</span><span>− <b>Résineux</b> ${rs ? nf(rs) : '?'}</span></p>`;
}
export const lentille = (id, legende, cls = '') => `<div class="fd-lent ${cls}"><button type="button" class="fd-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="${id}" aria-label="Lire la légende">?</button><div class="fd-leg" id="${id}" data-role="legende" hidden>${legende.map((l) => `<span>${l}</span>`).join('')}</div><span class="fd-seg" data-lecture role="radiogroup" aria-label="Lecture au style ou absolue"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>`;
export const contexte = (h) => `<p class="fd-ctx" data-role="contexte"><span data-contexte="houblon">${esc(h.nom)}</span><span data-contexte="base">Stout ${STYLE.code}</span><span class="fd-ctx-f">${h.sources.length} fiche${h.sources.length > 1 ? 's' : ''}</span></p>`;
export const actions = (h) => `<footer class="fd-pied"><span class="fd-gout"><button type="button" aria-label="Aimer ${esc(h.nom)}">${IC.coeur()}</button><button type="button" aria-label="Exclure ${esc(h.nom)}">${IC.exclu()}</button></span><a class="fd-cmp" href="#comparer">Comparer</a></footer>`;
export const autres = (h, { w = 60, cls = '' } = {}) => `<span class="fd-autres ${cls}" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : mots hors des 12 familles" style="width:${w}px"></span>`;
export function navHoublons(id, h) {
  return `<nav class="fd-nav" aria-label="La même vue pour un autre houblon"><span>Même vue :</span>${NOMS.map((n) => (n === h.nom ? `<b>${esc(n)}</b>` : `<a href="${n === DEFAUT[id] ? 'etat.html' : 'h-' + slug(n) + '.html'}">${esc(n)}</a>`)).join('')}</nav>`;
}
export const DEFAUT = {};

// La fiche courte (appui long sur le nom, D25 ; « la fiche courte de type Citra cryo »).
function radarCourt(h) {
  const r = 46, c = 60, ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 12;
  const p = (i, k) => [c + k * r * Math.cos(ang(i)), c + k * r * Math.sin(ang(i))].map((x) => x.toFixed(1)).join(',');
  const lv = Object.fromEntries(h.familles.map((f) => [f.f, f.n / h.radarMax]));
  let s = `<svg class="fd-rc" data-radar data-objet="fiche" viewBox="0 0 120 120" width="112" height="112" role="img" aria-label="Silhouette de ${esc(h.nom)} ; hachuré : non décrit">`;
  for (const k of [0.5, 1]) s += `<polygon points="${ROUE.map((f, i) => p(i, k)).join(' ')}" fill="none" stroke="#d4d5db"/>`;
  ROUE.forEach((f, i) => { if (!lv[f]) s += `<path d="M${c},${c}L${p(i - 0.5, 1)}L${p(i + 0.5, 1)}Z" fill="url(#fd-hach)"/>`; });
  s += `<polygon points="${ROUE.map((f, i) => p(i, Math.max(0.06, lv[f] || 0))).join(' ')}" fill="none" stroke="${h.couleur}" stroke-width="2" stroke-linejoin="round"/>`;
  return s + '</svg>';
}
export function ficheCourte(h) {
  const top = h.familles.slice(0, 4);
  return `<section class="fd-fiche" role="dialog" aria-label="Fiche courte de ${esc(h.nom)}" data-role="fiche" hidden>
<header class="fd-fc-h"><i class="fd-pt" style="background:${h.couleur}" aria-hidden="true"></i><b class="fd-fc-n">${esc(h.nom)}</b><span class="fd-usage">${h.usage}</span><button type="button" class="fd-x fd-x-c" data-role="fermer-fiche" aria-label="Fermer la fiche courte">${IC.croix()}</button></header>
<p data-role="fiche-alpha" class="fd-fc-a"><b class="num">α ${fr1(h.alpha.lot)} %</b> lot · <span class="num">${fr1(h.alpha.min)}–${fr1(h.alpha.max)} %</span> fiches</p>
<div class="fd-fc-c">${radarCourt(h)}<ul>${top.map((f) => `<li data-role="fiche-arome">${pic(f.f, 14)}<b style="color:${T(f.f)}">${f.nom}</b> <span class="num">${f.n}/${f.N}</span> fiche${f.N > 1 ? 's' : ''}</li>`).join('')}${h.horsFam.length ? `<li class="fd-fc-hors">${h.horsFam.length} mot${h.horsFam.length > 1 ? 's' : ''} hors des 12</li>` : ''}</ul></div>
<div class="fd-gout" role="group" data-role="gout" aria-label="Mon goût pour ${esc(h.nom)}"><button type="button" aria-pressed="false" aria-label="Aimer ${esc(h.nom)}">${IC.coeur()}</button><button type="button" aria-pressed="false" aria-label="Exclure ${esc(h.nom)}">${IC.exclu()}</button></div>
</section>`;
}

export const CSS = `
:root { --encre:#16161a; --gris:#5b5b66; --trait:#e3e4e9; --surf:#f6f6f8; --surf2:#ececf1; --acc:#c2410c; --zone:#27467a; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html { background:#d6d7dc; }
body { background:#d6d7dc; color:var(--encre); font:400 14px/1.3 var(--sans); -webkit-tap-highlight-color:transparent; }
::selection { background:#cfd6e4; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; }
svg { display:block; flex:none; }
:focus-visible { outline:2px solid var(--encre); outline-offset:2px; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
.fd-ecran { max-width:390px; margin:0 auto; min-height:100vh; }
.fd-fond { display:flex; align-items:center; gap:8px; height:46px; padding:0 14px; color:var(--encre); font-size:13px; }
.fd-fond-t { font-weight:600; font-size:15px; } .fd-fond-t small { font-weight:400; color:#45454e; }
.fd-fond-v { color:#3a3a42; } .fd-fond-s { margin-left:auto; height:22px; padding:0 8px; border-radius:11px; border:1px solid #9c9ca6; display:inline-flex; align-items:center; font-size:12px; }
.fd-feuille { background:#fff; border-radius:24px 24px 0 0; min-height:calc(100vh - 46px); padding:6px 12px 16px; position:relative; }
.fd-feuille::before { content:""; display:block; width:36px; height:4px; border-radius:2px; background:#d0d1d6; margin:0 auto 4px; }
.fd-tete { display:flex; align-items:center; gap:6px; min-height:40px; }
.fd-nom { font:700 20px/1.1 var(--sans); -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; cursor:default; }
.fd-rep { color:var(--gris); }
.fd-x { margin-left:auto; width:44px; height:44px; margin-right:-6px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--encre); }
.fd-x svg { width:20px; height:20px; }
.fd-x::before { content:""; position:absolute; width:34px; height:34px; border-radius:50%; background:var(--surf2); z-index:0; }
.fd-x { position:relative; } .fd-x svg { position:relative; z-index:1; }
.fd-alpha { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-height:30px; }
.fd-a-g { font-size:18px; } .fd-a-sym { color:var(--gris); } .fd-a-g b { font-size:19px; }
.fd-a-lot { font-size:13px; color:var(--gris); } .fd-hf { color:var(--acc); font-weight:600; }
.fd-jauge { position:relative; width:64px; height:6px; border-radius:2px; background:var(--surf2); }
.fd-jauge-p { position:absolute; top:0; bottom:0; border-radius:2px; background:#9a9aa5; }
.fd-jauge-l { position:absolute; top:-4px; width:3px; height:14px; margin-left:-1.5px; border-radius:2px; background:var(--encre); }
.fd-usage { height:22px; padding:0 9px; border-radius:11px; border:1px solid #a2a2ad; display:inline-flex; align-items:center; font-size:12px; color:var(--encre); white-space:nowrap; }
.fd-stock { display:inline-flex; align-items:center; gap:3px; font-size:12px; color:var(--gris); }
.fd-radar { display:block; margin:0 auto; }
.fd-rl { font:400 12px var(--sans); fill:#3e3e47; } .fd-rl-i { fill:#5b5b66; } .fd-rn { font-weight:600; fill:#16161a; }
.fd-dem { display:flex; justify-content:center; gap:18px; font-size:14px; margin:2px 0 6px; }
.fd-lent { display:flex; align-items:center; gap:6px; position:relative; }
.fd-aide { width:26px; height:26px; border-radius:50%; border:1px solid #b9bac2; background:#fff; font-weight:700; color:var(--gris); flex:none; }
.fd-leg { position:absolute; top:32px; left:0; z-index:20; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:300px; box-shadow:0 6px 18px rgba(22,22,26,.16); }
.fd-seg { display:inline-flex; background:var(--surf2); border-radius:14px; padding:2px; margin-left:auto; }
.fd-seg button { white-space:nowrap; height:24px; padding:0 10px; border-radius:12px; font-size:12px; color:var(--gris); }
.fd-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; box-shadow:0 1px 2px rgba(22,22,26,.12); }
.fd-ctx { display:flex; gap:4px; flex-wrap:wrap; font-size:12px; color:var(--gris); }
.fd-ctx span { height:20px; padding:0 7px; border-radius:10px; background:var(--surf); display:inline-flex; align-items:center; }
.fd-pied { display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:8px; border-top:1px solid var(--trait); }
.fd-gout { display:inline-flex; gap:4px; background:var(--surf2); border-radius:18px; padding:3px; }
.fd-gout button { width:36px; height:30px; border-radius:15px; display:inline-flex; align-items:center; justify-content:center; }
.fd-gout button[aria-pressed="true"] { background:var(--encre); color:#fff; }
.fd-cmp { height:34px; padding:0 18px; border-radius:17px; border:1px solid #a2a2ad; display:inline-flex; align-items:center; text-decoration:none; font-weight:600; }
.fd-autres { display:inline-block; height:8px; border-radius:2px; background:#8d8d96; vertical-align:middle; }
.fd-nav { display:flex; flex-wrap:wrap; gap:4px 8px; font-size:13px; color:var(--gris); padding-top:4px; border-top:1px solid var(--trait); order:9; }
.fd-nav a { color:var(--encre); } .fd-nav b { color:var(--encre); }
.fd-pi { width:16px; height:16px; }
.fd-zone { background:var(--zone); color:#fff; font-size:12px; font-weight:600; height:18px; padding:0 6px; border-radius:9px; display:inline-flex; align-items:center; white-space:nowrap; }
body.abs .fd-zone, body.abs [data-style-seul] { display:none !important; }
body:not(.abs) [data-abs-seul] { display:none !important; }
/* fiche courte */
.fd-fiche { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-radius:24px 24px 0 0; box-shadow:0 -8px 28px rgba(0,0,0,.25); padding:10px 14px 16px; z-index:40; display:flex; flex-direction:column; gap:8px; }
.fd-fc-h { display:flex; align-items:center; gap:6px; } .fd-fc-n { font-size:18px; }
.fd-pt { width:10px; height:10px; border-radius:50%; display:inline-block; }
.fd-fc-a { font-size:13px; color:var(--gris); } .fd-fc-a b { color:var(--encre); }
.fd-fc-c { display:flex; gap:10px; align-items:center; } .fd-fc-c ul { list-style:none; display:flex; flex-direction:column; gap:4px; font-size:13px; }
.fd-fiche .fd-gout { align-self:flex-start; }
.fd-fc-c li { display:flex; align-items:center; gap:5px; } .fd-fc-hors { color:var(--gris); }
`;

export const JS = `
(function () {
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  $$('[data-e]').forEach(function (b) { b.addEventListener('click', function () {
    $$('[data-e]').forEach(function (z) { z.setAttribute('aria-checked', String(z === b)); });
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
    document.dispatchEvent(new CustomEvent('fd-lecture', { detail: b.dataset.e })); }); });
  $$('[data-role=legende-bouton]').forEach(function (b) { b.addEventListener('click', function () {
    var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); }); });
  function fiche(o) { var f = document.querySelector('[data-role="fiche"]'); if (f) f.hidden = !o; }
  $$('[data-role="fermer-fiche"]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); fiche(false); }); });
  $$('[data-role="gout"] button').forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; $$('[data-role="gout"] button').forEach(function (z) { z.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', String(on)); }); });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fiche(false);
    $$('[data-role=legende]').forEach(function (l) { l.hidden = true; }); $$('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); });
  $$('[data-appui]').forEach(function (c) { var t = null, hv = null, x0 = 0, y0 = 0;
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    c.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; clearTimeout(t); t = setTimeout(function () { fiche(true); }, 520); });
    c.addEventListener('pointermove', function (e) { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 12) { clearTimeout(t); t = null; } });
    ['pointerup', 'pointercancel'].forEach(function (k) { c.addEventListener(k, function () { clearTimeout(t); t = null; }); });
    c.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(hv); hv = setTimeout(function () { fiche(true); }, 700); });
    c.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') clearTimeout(hv); }); });
})();
`;

// Assemble une page ; chaque concept donne sa composition de la feuille (corps).
export function doc({ id, h, titre: t, corps, css = '', js = '' }) {
  // La même vue pour les autres houblons : dans la légende, pour ne pas nommer au repos un houblon que la page ne montre pas.
  const m = 'data-role="legende" hidden>', k = corps.indexOf(m);
  if (k >= 0) corps = corps.slice(0, k + m.length) + navHoublons(id, h) + corps.slice(k + m.length);
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)} · ${esc(h.nom)} · fiche, la liste (série d, ${id})</title>
<style>${CSS}
${css}</style></head>
<body>
${SYMBOLES}
<div class="fd-ecran ${id}">
${fond(h)}
<main class="fd-feuille" role="dialog" aria-label="Fiche de ${esc(h.nom)}">
${corps}
${actions(h)}
</main>
</div>
${ficheCourte(h)}
<script>${JS}</script>
${js ? `<script>(function(){${js}})();</script>` : ''}
</body></html>`;
}

// Écrit etat.html (houblon par défaut) et h-<houblon>.html pour les quatre autres.
export function ecrire(id, defaut, rendu) {
  DEFAUT[id] = defaut;
  const dir = path.join(ici, '..', id);
  fs.mkdirSync(dir, { recursive: true });
  for (const n of NOMS) {
    const html = rendu(HOPS[n]);
    fs.writeFileSync(path.join(dir, n === defaut ? 'etat.html' : 'h-' + slug(n) + '.html'), html);
  }
}
