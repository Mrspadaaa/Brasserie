// Lot 21 · v1, v2, v3 (« Des vrai donné, mieux présenté » ; « Je veux aussi des vrais valeur ») : le socle
// commun des trois variantes de vraies valeurs. Aucun chiffre recopié à la main : tout vient de
//   - prototypes/houblons-v4/data/composes-houblon.json (huiles, composés, transferts, durée, saturation,
//     levures, biotransformation, hop creep, style 16D, sources) ;
//   - prototypes/houblons-v4/data/pack-fiches.json (fiches, familles marquées ou citées, α des fiches, usage) ;
//   - fils15-s5-complexe/donnees/c1.json et c2.json (α et stock des lots, profil de ma bière, IBU) ;
//   - fils19-choix/donnees/*.json (sorties du moteur « pouvoir aromatique ») ;
//   - fils21-choisir/donnees/comparatifs-dryhop.json (mesures publiées en bière, panels) ;
//   - prototypes/houblons-v4/data/style-bands.json (16D).
// Le langage est celui de la baseline l8g (pictos au trait de l2 au crayon léger, habillage, fiche g1 au
// langage de la page, appui long, légende derrière « ? »), enrichi : bandes d'incertitude sur échelle
// logarithmique, duel à dose égale, chemin des moments, calendrier, profil simulé en barres de l5b.
// Le simulé vient de fils21-choisir/donnees/profils-simules.json (moteur profil-simule) ; la maquette du
// début (profils-stub.json, "stub": true) est retirée.
import fs from 'node:fs';
import path from 'node:path';
import { symboles, JET, ORDRE, NOM, COURT, runtime, CSS_FICHE, FICHES, REPO } from '../../fils18-baseline/l8g/noyau.mjs';
import { CSS_STRUCTURE, POLICES } from '../../fils18-baseline/l8g/matrice.mjs';
import { CSS as HABILLAGE } from '../../fils18-baseline/l8g/habillage.mjs';
import { EXTRA, net } from '../../fils18-baseline/l8g/pictos-trait.mjs';

export { JET, ORDRE, NOM, COURT, REPO };
export const E1 = REPO + '/work/refonte-frontend/v4/ecran-1';
export const D21 = E1 + '/fils21-choisir';
const lireT = (f) => fs.readFileSync(f, 'utf8');
const lire = (f) => JSON.parse(lireT(f));
export const CH = lire(REPO + '/prototypes/houblons-v4/data/composes-houblon.json');
const PF = lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const PACK = lire(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json');
export const C1 = lire(E1 + '/fils15-s5-complexe/donnees/c1.json');
const C2 = lire(E1 + '/fils15-s5-complexe/donnees/c2.json');
export const MOTEUR = (id) => lire(E1 + '/fils19-choix/donnees/' + id + '.json');
export const VERIF = lire(E1 + '/fils19-choix/donnees/verifications.json');
export const STY = lire(REPO + '/prototypes/houblons-v4/data/style-bands.json').styles['16D'];
const FCOMP = D21 + '/donnees/comparatifs-dryhop.json';
export const COMP = fs.existsSync(FCOMP) ? lire(FCOMP) : null;
export const etude = (id) => (COMP ? COMP.etudes.find((e) => e.id === id) : null);
export const SRC = CH.sources;

// ---------- les houblons de la page ----------
// α et stock : les lots de c2 (et c1) ; Citra T-90 n'est pas en stock (le stock a du Citra cryo, 24,8 %).
const alphaC = (nom) => { for (const C of [C2, C1]) for (const v of C.voies) for (const f of v.fiches || []) if (f.houblon === nom) return f.alpha; return null; };
const stockC = (nom) => { for (const C of [C2, C1]) { const v = C.voies.find((x) => x.type === 'ajouter' && x.actions.length === 1 && x.actions[0].houblon === nom); if (v) return v.stock; } return null; };
const packDe = (nom) => PF.find((x) => x.name === nom);
// La fiche du pack « Citra cryo » est celle de la variété Citra chez Beer Maverick (α 10–15 %, huile 1,5–3) :
// elle sert aussi de fiche à Citra T-90, sans le lot cryo.
const CITRA_FICHES = packDe('Citra cryo').alpha.sources.map((s) => [s.min, s.max])[0];
export const HOPS = {
  Citra: { cle: 'beermaverick-citra', couleur: '#184078', pack: 'Citra cryo', alpha: { lot: null, lotSource: null, fiches: CITRA_FICHES, horsFiches: false }, stock: 'à acheter', cas: 'cas-citra', forme: 'T-90' },
  Cascade: { cle: 'beermaverick-cascade', couleur: '#781838', pack: 'Cascade', cas: 'cas-cascade', forme: 'T-90' },
  Galaxy: { cle: 'beermaverick-galaxy', couleur: '#681878', pack: 'Galaxy', cas: 'cas-galaxy', forme: 'T-90' },
  'Idaho 7': { cle: 'beermaverick-idaho-7', couleur: '#e80030', pack: 'Idaho 7', cas: 'cas-idaho7', forme: 'T-90' },
  Nugget: { cle: 'beermaverick-nugget', couleur: '#2b68da', pack: 'Nugget' },
  'Citra cryo': { cle: 'beermaverick-citra:cryo', couleur: '#3f6fb0', pack: 'Citra cryo', forme: 'cryo' },
};
for (const [nom, H] of Object.entries(HOPS)) {
  if (!H.alpha) H.alpha = alphaC(nom);
  if (!H.stock) H.stock = stockC(nom) || 'à acheter';
  const f = packDe(H.pack);
  H.role = f.role ? { v: f.role.value, src: /^fournisseur/.test(f.role.source) ? 'fournisseur' : 'règle', txt: f.role.source } : null;
  H.niveaux = Object.fromEntries(f.aromes.map((a) => [a.family, a.level]));
}
export const QUATRE = ['Citra', 'Cascade', 'Galaxy', 'Idaho 7'];

// ---------- la fiche g1 de la baseline l8g, pour ces houblons (même forme que ficheDe de noyau.mjs) ----------
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
function fiche(nom) {
  const H = HOPS[nom], f = packDe(H.pack);
  const comp = (f.huiles && f.huiles.composants) || {};
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  return { nom, role: H.role, voie: nom.replace(/\W/g, ''), stock: H.stock, ajout: null, alphaC1: H.alpha, origine: f.origin || null,
    alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc), lot: H.alpha.lot,
    beta: ((f.beta && f.beta.sources) || []).map(plageSrc),
    huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
    aromes: (f.aromes || []).filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: ((f.aromes || [])[0] || {}).of || 0,
    sans: uniq((f.motsSansFamille || []).map((s) => s.mot)),
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
    subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [], subsRaison: f.substitutsRaison || null };
}
export const FD = Object.fromEntries(Object.keys(HOPS).map((n) => [n, fiche(n)]));

// ---------- nombres ----------
export const fr = (x, d) => {
  if (x == null || Number.isNaN(x)) return '?';
  const a = Math.abs(x);
  const r = d != null ? Math.round(x * 10 ** d) / 10 ** d : a >= 100 ? Math.round(x) : a >= 10 ? Math.round(x) : a >= 1 ? Math.round(x * 10) / 10 : a >= 0.1 ? Math.round(x * 100) / 100 : Number(x.toPrecision(1));
  return String(r).replace('.', ',').replace('-', '−');
};
export const plg = (a, b, u = '') => (a == null && b == null ? 'inconnu' : a == null ? '≤' + fr(b) + u : b == null ? '≥' + fr(a) + u : fr(a) === fr(b) ? fr(a) + u : fr(a) + '–' + fr(b) + u);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const srcNom = (k) => (SRC[k] ? SRC[k].titre.split(/[,.]/)[0] + (SRC[k].annee ? ' ' + SRC[k].annee : '') : k);
export const srcAttr = (ks) => (Array.isArray(ks) ? ks : [ks]).filter(Boolean).join(' ');

// ---------- marques ----------
// Une vraie valeur : data-nature="mesure" et sa source ; une valeur simulée : data-nature="simule" et « ~ ».
export const M = (txt, src, cls = '', extra = '') => `<span class="vm ${cls}" data-nature="mesure" data-source="${esc(srcAttr(src))}"${extra}>${txt}</span>`;
export const S = (txt, cls = '', extra = '') => `<span class="vs ${cls}" data-nature="simule"${extra}>${txt}</span>`;
export const INC = (raison, src = 'H') => `<span class="inc" data-inconnu="${esc(raison)}" data-source="${esc(srcAttr(src))}">inconnu</span>`;
// Les mots de confiance (I, idée 10), en texte : mesuré, panel, calculé, simulé, inconnu.
const CONF = { mesure: ['flacon', 'mesuré'], panel: ['panel', 'panel'], calcule: ['calcul', 'calculé'], simule: ['simul', 'simulé'], inconnu: ['inconnu', 'inconnu'], verifier: ['loupe', 'à vérifier'] };
export const conf = (k, cls = '') => `<span class="cf-mot cf-${k} ${cls}">${ic(CONF[k][0], 12)}<span>${CONF[k][1]}</span></span>`;

// ---------- symboles : pictos au trait de l8g (crayon léger, ton texte), icônes lucide à 1,5 px ----------
const V3 = lireT(E1 + '/fils17-standard/v3/planche.html');
const SYMV3 = {};
for (const m of V3.matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYMV3[m[1]] = m[2];
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
function lucide(nom) {
  const t = lireT(REPO + '/node_modules/lucide-react/dist/esm/icons/' + nom + '.mjs').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  return new Function('return ' + t)().map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
}
const PLUS_ICONES = { flacon: 'flask-conical', panel: 'users', calcul: 'calculator', simul: 'sliders-horizontal', inconnu: 'circle-question-mark', loupe: 'search', horloge: 'clock', sablier: 'hourglass', thermo: 'thermometer', echange: 'arrow-left-right', fiole: 'test-tube', info: 'info', bas2: 'chevron-down', moins: 'minus', bulle: 'message-circle', vent: 'wind', calendrier: 'calendar-days' };
const TAILLES = [12, 14, 16, 18, 20];
const r3 = (x) => Math.round(x * 1000) / 1000;
let extra = '';
for (const z of TAILLES) for (const [k, n] of Object.entries(PLUS_ICONES)) extra += `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${r3(1.5 * 24 / z)}" stroke-linecap="round" stroke-linejoin="round">${lucide(n)}</symbol>`;
const TON = Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte]));
export const SYMB = symboles({ trait: 1.5, tailles: TAILLES })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${TON[f]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYMV3[f])}</g></symbol>`)
  .replace('</svg>', extra + '<defs>' + CRAYON + '</defs></svg>');
export const ic = (k, z = 16, cls = 'ic') => `<svg class="${cls}" width="${z}" height="${z}" aria-hidden="true"><use href="#i-${k}-${z}"/></svg>`;
export const pic = (f, z = 16) => `<svg class="pi" width="${z}" height="${z}" data-famille="${f}" role="img" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
export const pics = (fs, z = 16) => `<span class="pis">${fs.map((f) => pic(f, z)).join('')}</span>`;

// ---------- un houblon : nom (appui long : sa fiche), α du lot puis des fiches, usage en mot, stock ----------
export function alpha(nom, { plage = true } = {}) {
  const A = HOPS[nom].alpha, cryo = /cryo$/.test(nom);
  const hors = !!(A.horsFiches && !cryo && A.lot != null);
  let s = '';
  if (A.lot != null) s += `<span class="al lot${hors ? ' hors' : ''}" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot en stock : ${fr(A.lot, 1)} %${hors ? ', hors des plages de ses fiches' : ''}">${fr(A.lot, 1)}%${hors ? ic('diff', 12) : ''}</span>`;
  if (A.fiches && (plage || A.lot == null)) s += `<span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure" aria-label="α des fiches${cryo ? ' du Citra en pellets' : ''} : ${fr(A.fiches[0])} à ${fr(A.fiches[1])} %">${ic('livre', 12)}${fr(A.fiches[0])}–${fr(A.fiches[1])}%${cryo ? '<span class="pel">pellets</span>' : ''}</span>`;
  return s;
}
const MOT_US = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'mixte' };
export function usage(nom) {
  const R = HOPS[nom].role; if (!R) return '';
  return `<span class="us us-mot${R.src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${R.v}" data-source="${R.src}" data-pour="${esc(nom)}" aria-label="${esc(nom)} : ${MOT_US[R.v]}, ${R.src === 'règle' ? 'déduit de l’α, à valider' : 'attesté par le fournisseur'}"><span class="us-m">${MOT_US[R.v]}</span></span>`;
}
const STOCK = { suffisant: ['en stock', 'stock'], 'à acheter': ['à acheter', 'achat'], manque: ['stock insuffisant', 'manque'] };
export const stock = (nom) => { const s = STOCK[HOPS[nom].stock] || STOCK['à acheter']; return `<span class="stk" role="img" aria-label="${s[0]}">${ic(s[1], 14)}</span>`; };
export const hn = (nom, cls = '') => `<span class="hn ${cls}" data-houblon="${esc(nom)}" data-couleur="${HOPS[nom].couleur}">${esc(nom)}</span>`;
export const point = (nom, forme = 'plein') => `<i class="hpt ${forme}" style="--hc:${HOPS[nom].couleur}" aria-hidden="true"></i>`;

// ---------- l'échelle logarithmique du rapport au seuil, et ses bandes d'incertitude ----------
// Une plage énorme se voit (« Si il y a des écart x100 justement il faut que ça se voit pas que ce soit
// effacé ») : une bande sur une échelle log, ses bornes écrites aux deux bouts, le repère central en trait.
export const LOG = { min: 1e-3, max: 1e4 };
export const posLog = (x, L = LOG) => Math.max(0, Math.min(100, ((Math.log10(x) - Math.log10(L.min)) / (Math.log10(L.max) - Math.log10(L.min))) * 100));
export const facteur = (x) => (x == null ? '?' : '×' + fr(x));
/* Une ligne : la piste (zone du style ≤ ×10 au style, seuil ×1), puis une bande par houblon. */
export function piste({ bandes, zone = 10, hauteur = 'n', etiquette = '' }) {
  const z = posLog(zone), s = posLog(1);
  const b = bandes.map((x) => {
    const lo = x.min == null ? 0 : posLog(x.min), hi = x.max == null ? 100 : posLog(x.max);
    const c = x.c != null ? posLog(x.c) : null;
    const larg = Math.max(1.2, hi - lo);
    const ouvert = (x.min == null ? ' ouv-g' : '') + (x.max == null ? ' ouv-d' : '');
    const hors = x.min != null && x.min > zone ? ' tout-hors' : x.max == null || x.max > zone ? ' part-hors' : '';
    return `<div class="lb-l"><i class="lb${ouvert}${hors} ${x.forme || 'plein'}" data-role="incertitude" ${x.nature === 'simule' ? 'data-nature="simule"' : `data-nature="mesure" data-source="${esc(x.src || '')}"`} style="left:${lo}%;width:${larg}%;--hc:${x.couleur}" aria-label="${esc(x.label || '')}">${c != null ? `<b class="lb-c" style="left:${((c - lo) / larg) * 100}%"></b>` : ''}</i>`
      + `<span class="lb-g mono" style="right:${100 - lo}%">${x.min == null ? '' : facteur(x.min)}</span><span class="lb-d mono" style="left:${Math.min(hi, 100)}%">${x.max == null ? '…' : facteur(x.max)}</span></div>`;
  }).join('');
  return `<div class="lpiste ${hauteur}">${etiquette}<div class="lpi-t"><i class="lz" data-role="zone" style="width:${z}%"></i><i class="lh" style="left:${z}%"></i><i class="ls" style="left:${s}%"></i>${b}</div></div>`;
}
export const axeLog = (marques = [0.01, 1, 10, 100, 1000]) => `<div class="axe-log" aria-hidden="true">${marques.map((m) => `<span class="mono" style="left:${posLog(m)}%">${m === 1 ? 'seuil' : '×' + fr(m)}</span>`).join('')}</div>`;

// ---------- le profil simulé : fils21-choisir/donnees/profils-simules.json (moteur profil-simule) ----------
// La maquette du début (profils-stub.json) est retirée depuis que le vrai fichier existe ; simuler()
// reste pour mémoire, inutilisé par les pages.
export const SIMU = lire(D21 + '/donnees/profils-simules.json');
export const STUB = null;
const ZONE = SIMU.style.zone;
const AV = SIMU.biere.avant;
// Ce dont les barres ont besoin : la bande de la 16D, le cran (bande ÷ 3), ma bière avant (centre), les tons.
export const PS = { familles: ORDRE, bande: Object.fromEntries(ORDRE.map((f) => [f, ZONE[f].bande])), cran: Object.fromEntries(ORDRE.map((f) => [f, (ZONE[f].bande[1] - ZONE[f].bande[0]) / 3])), avant: Object.fromEntries(ORDRE.map((f) => [f, AV[f].centre])), avantSource: Object.fromEntries(ORDRE.map((f) => [f, AV[f].source])) };
export const LEV = { us05: 'fermentis-us05', pomona: 'lalbrew-pomona', verdant: 'lalbrew-verdant-ipa', diamond: 'lalbrew-diamond' };
// Un profil de la grille, réduit à { famille: [bas, centre, haut] } (formatGrille : bas, centre, haut, crans…).
const reduit = (ap) => Object.fromEntries(ORDRE.map((f) => [f, ap[f].slice(0, 3).map((x) => Math.round(x * 10) / 10)]));
export const grilleDe = (noms) => SIMU.grille.filter((g) => noms.includes(g.nom)).map((g) => ({ n: g.nom, m: g.moment, d: g.dose_gL, j: g.jours, l: g.levure, p: reduit(g.apres), c: g.confiance, dr: g.drapeaux }));
export const pairesDe = (noms) => SIMU.grillePaires.filter((g) => g.noms.every((n) => noms.includes(n))).map((g) => ({ n: g.noms, m: g.moment, d: g.doses_gL, j: g.jours, l: g.levure, p: reduit(g.apres), fs: g.facteurSaturation, c: g.confiance, dr: g.drapeaux }));
export const casSim = (id) => SIMU.cas.find((c) => c.id === id);
export const texteSim = (t) => (typeof t === 'string' && /^§\d+$/.test(t) ? SIMU.textes[t] || t : t);
/* simuler() tourne dans Node (pour écrire la maquette) et dans la page (curseurs) : aucune dépendance. */
export function simuler(P, ajouts, levure) {
  const sec = (m) => m === 'dryActive' || m === 'dryPost';
  const lin = (pts, x) => { if (x <= 0) return 0; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, ga] = pts[i - 1], [b, gb] = pts[i]; return ga + ((x - a) / (b - a)) * (gb - ga); } const n = pts.length; return pts[n - 1][1]; };
  const D = ajouts.filter((a) => sec(a.moment)).reduce((s, a) => s + a.dose, 0);
  const out = {};
  for (const f of P.familles) out[f] = { avant: P.avant[f], d: [0, 0, 0] };
  for (const a of ajouts) {
    const H = P.hops[a.houblon]; if (!H) continue;
    const part = P.part[a.moment];
    let dose = a.dose;
    const jk = sec(a.moment) ? (a.jours >= 3 ? 1 : P.jours[a.jours] ?? 0) : 1;
    for (const f of P.familles) {
      const w = P.poids[H.niveaux[f] || 0]; if (!w) continue;
      if (sec(a.moment) && D > 0) { const g = P.gains[P.groupeGain[f] || 'agrumes']; dose = (lin(g, D) / (g[1][1] / g[1][0])) * (a.dose / D); }
      let m = 1;
      if (levure && P.levures[levure] && a.moment === 'dryActive') m *= (P.levures[levure].bio || {})[f] || 1;
      const base = P.K * w * (H.nuance[f] || 1) * dose * jk * m;
      out[f].d[0] += base * H.huile[0] * part[0];
      out[f].d[1] += base * H.huile[1] * part[1];
      out[f].d[2] += base * H.huile[2] * part[2];
    }
  }
  if (levure && P.levures[levure]) for (const [f, pts] of Object.entries(P.levures[levure].esters || {})) { out[f].d[0] += pts * 0.5; out[f].d[1] += pts; out[f].d[2] += pts * 1.5; }
  for (const f of P.familles) { const o = out[f], av = o.avant == null ? 0 : o.avant; o.a = o.d.map((x) => av + x); o.cr = o.d.map((x) => x / P.cran[f]); }
  return out;
}

// ---------- le profil simulé en barres de l5b (rendu dans la page à chaque réglage) ----------
// Au style : 8 px par cran du style, la zone du style = 3 crans (24 px), l'orangé au-delà ; absolu :
// 0,5 px par point de l'échelle 0–100. Une série « a » pleine, « b » en contour (la forme distingue, pas
// la couleur seule) ; « seul » au milieu. Le trait fin va de bas à haut ; le tiret noir est ma bière avant.
export const barres = (fams, series, P, COURT_, picF) => {
  const PX = 11, AB = 0.55, H = 60, cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const f1 = (x) => (Math.abs(x) < 0.05 ? '0' : (x > 0 ? '+' : '−') + String(Math.round(Math.abs(x) * 10) / 10).replace('.', ','));
  return '<div class="sbars" style="--n:' + fams.length + '">' + fams.map((f) => {
    const cr = P.cran[f], top = P.bande[f][1], av = P.avant[f] || 0;
    let bars = '', vals = '';
    for (const s of series) {
      const a = s.res[f], k = s.cle, d = (a[1] - av) / cr;
      const hs = cl((a[1] / cr) * PX, 2, H), ha = cl(a[1] * AB, 2, H), xs = Math.max(0, Math.min(hs, H) - 3 * PX);
      const rb = cl((a[0] / cr) * PX, 0, H), rt = (a[2] / cr) * PX, rba = cl(a[0] * AB, 0, H), rta = a[2] * AB;
      const deb = rt > H ? ' deb' : '', deba = rta > H ? ' deba' : '';
      bars += '<i class="sb-b ' + k + '" data-nature="simule" style="--hs:' + hs.toFixed(1) + 'px;--ha:' + ha.toFixed(1) + 'px;--xs:' + xs.toFixed(1) + 'px" aria-label="' + s.nom + ' : ~' + f1(d) + ' crans"><i></i></i>'
        + '<i class="sb-r ' + k + deb + deba + '" style="--rb:' + rb.toFixed(1) + 'px;--rh:' + Math.max(1, Math.min(rt, H) - rb).toFixed(1) + 'px;--rba:' + rba.toFixed(1) + 'px;--rha:' + Math.max(1, Math.min(rta, H) - rba).toFixed(1) + 'px"></i>';
      vals += '<span class="sb-v ' + k + (a[1] > top ? ' hst' : '') + '" data-nature="simule">~' + f1(d) + '</span>';
    }
    const avs = '<i class="sb-av" style="--av:' + cl((av / cr) * PX, 0, H).toFixed(1) + 'px;--ava:' + cl(av * AB, 0, H).toFixed(1) + 'px"></i>';
    return '<button type="button" class="sb" data-f="' + f + '" style="--b:' + P.tons[f].base + ';--t:' + P.tons[f].texte + ';--f:' + P.tons[f].fond + '" aria-label="' + COURT_[f] + ' : le détail"><span class="sb-z"><i class="sb-zone" data-role="zone" style="--zs:' + 3 * PX + 'px;--za:' + (top * AB).toFixed(1) + 'px"></i>' + bars + avs + '</span>' + picF(f, 16) + '<span class="sb-n">' + COURT_[f] + '</span>' + vals + '</button>';
  }).join('') + '</div>';
};

// La bibliothèque de la page : les mêmes fonctions, recopiées telles quelles dans le script.
export const CLIENT = (P) => [
  'const COURT_ = ' + JSON.stringify(COURT) + ';',
  'const P = ' + JSON.stringify({ ...P, tons: JET }) + ';',
  'const LOG = ' + JSON.stringify(LOG) + ';',
  'const fr = ' + fr.toString() + ';', 'const plg = ' + plg.toString() + ';', 'const esc = ' + esc.toString() + ';',
  'const ic = ' + ic.toString() + ';', 'const pic = ' + pic.toString().replace(/COURT\[/g, 'COURT_[') + ';',
  'const posLog = ' + posLog.toString() + ';', 'const facteur = ' + facteur.toString() + ';', 'const piste = ' + piste.toString() + ';', 'const axeLog = ' + axeLog.toString() + ';',
  'const simuler = ' + simuler.toString() + ';', 'const barres = ' + barres.toString() + ';',
].join('\n');

// ---------- CSS : la structure de l8g, son habillage, puis ce que ces variantes ajoutent ----------
export const CSS_BASE = CSS_STRUCTURE + HABILLAGE + EXTRA + CSS_FICHE + `
  .ecran { gap: 10px; padding: 6px 16px 40px; }
  .mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .barre { height: 40px; gap: 4px; }
  .barre h1 { flex: 1; font-size: 16px; font-weight: 700; line-height: 1.15; }
  .outils { align-items: center; }
  .lentille button { height: 28px; }
  .ctx { font: 500 12px var(--mono); color: var(--gris); white-space: nowrap; }
  .pis { display: inline-flex; gap: 1px; align-items: center; }
  .pi { flex: none; }
  /* Les mots de confiance : du texte, une icône, jamais une couleur seule. */
  .cf-mot { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 6px; border-radius: 10px; font-size: 12px; font-weight: 600; color: var(--encre); background: #ececf1; white-space: nowrap; }
  .cf-mot .ic { color: var(--gris); }
  .cf-simule { background: #fff; box-shadow: inset 0 0 0 1px #8a8a96; border-radius: 10px; }
  .cf-inconnu { background: repeating-linear-gradient(135deg, #fff 0 3px, #e4e4ea 3px 5px); }
  .cf-verifier { background: #fff4d6; }
  .vm { font-family: var(--mono); font-weight: 600; }
  .vm.txt { font-family: var(--sans); font-weight: 400; }
  .vs { font-family: var(--mono); color: var(--encre); }
  .inc { display: inline-flex; align-items: center; height: 18px; padding: 0 5px; border-radius: 2px; font-size: 12px; color: var(--encre); background: repeating-linear-gradient(135deg, #fff 0 3px, #dcdce3 3px 5px); box-shadow: inset 0 0 0 1px #9a9aa6; }
  .hn { font-weight: 700; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .hpt { display: inline-block; width: 10px; height: 10px; border-radius: 2px; flex: none; }
  .hpt.plein { background: var(--hc); } .hpt.contour { background: #fff; box-shadow: inset 0 0 0 2px var(--hc); }
  .carte { background: #fff; border-radius: 8px; box-shadow: 0 0 0 1px var(--trait); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
  .carte > h2, .sec-t { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .sec-t small, .carte > h2 small { font: 400 12px var(--sans); color: var(--gris); }
  .gris { color: var(--gris); } .petit { font-size: 12px; }
  .pourquoi { font-size: 14px; line-height: 1.3; }
  .pourquoi b { font-weight: 700; }
  details.det > summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; min-height: 28px; font-size: 12px; font-weight: 600; color: var(--encre); }
  details.det > summary::-webkit-details-marker { display: none; }
  details.det > summary .ic { transition: transform .15s; } details.det[open] > summary .ic { transform: rotate(180deg); }
  details.det .det-c { display: flex; flex-direction: column; gap: 6px; font-size: 12px; line-height: 1.35; padding: 4px 0 2px; }
  .src-l { font-size: 12px; color: var(--gris); }
  /* La piste logarithmique : zone du style pâle (≤ ×10, convention du moteur), seuil en trait, orangé au-delà. */
  .lpiste { display: flex; flex-direction: column; gap: 2px; }
  .lpi-t { position: relative; min-height: 30px; padding-bottom: 3px; margin: 0 26px 0 30px; }
  .lz { position: absolute; left: 0; top: 0; bottom: 0; background: #eceaf4; border-right: 1.5px solid #8a8a96; }
  body.abs .lz, body.abs .lh { display: none; }
  .lh { position: absolute; right: 0; top: 0; bottom: 0; background: repeating-linear-gradient(135deg, #fff 0 4px, #fbe3d6 4px 6px); }
  .ls { position: absolute; top: -2px; bottom: -2px; width: 0; border-left: 1.5px dashed var(--encre); }
  .lb-l { position: relative; height: 12px; margin-top: 3px; }
  .lb { position: absolute; top: 2px; height: 8px; border-radius: 4px; background: var(--hc); }
  .lb.contour { background: #fff; box-shadow: inset 0 0 0 2px var(--hc); }
  .lb.ouv-d { border-top-right-radius: 0; border-bottom-right-radius: 0; -webkit-mask: linear-gradient(90deg, #000 85%, transparent); mask: linear-gradient(90deg, #000 85%, transparent); }
  .lb.ouv-g { border-top-left-radius: 0; border-bottom-left-radius: 0; -webkit-mask: linear-gradient(270deg, #000 85%, transparent); mask: linear-gradient(270deg, #000 85%, transparent); }
  .lb-c { position: absolute; top: -3px; width: 3px; height: 14px; margin-left: -1.5px; background: var(--encre); border-radius: 2px; }
  .lb-g, .lb-d { position: absolute; top: -2px; font-size: 12px; line-height: 16px; color: var(--encre); white-space: nowrap; padding: 0 3px; }
  .axe-log { position: relative; height: 16px; margin: 0 26px 0 30px; }
  .axe-log span { position: absolute; transform: translateX(-50%); font-size: 12px; color: var(--gris); white-space: nowrap; }
  /* Le profil simulé : les barres de l5b, debout, devant la zone du style ; l'orangé au-delà. */
  .sim { display: flex; flex-direction: column; gap: 6px; }
  .sim-t { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; font-weight: 700; }
  .sbars { display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 2px; align-items: end; }
  .sb { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; padding: 4px 0 2px; border-radius: 4px; }
  .sb[aria-pressed="true"] { background: #f0f0f4; }
  .sb-v.b { color: var(--gris); } .sb-v.b.hst { color: var(--acc); }
  .sb-z { position: relative; width: 30px; height: 60px; border-bottom: 1px solid var(--trait2); margin-top: 6px; }
  .sb-zone { position: absolute; left: 0; right: 0; bottom: 0; height: var(--zs); background: var(--f); border-top: 1.5px solid var(--t); }
  body.abs .sb-zone { height: var(--za); }
  .sb-b { position: absolute; bottom: 0; width: 11px; height: var(--hs); background: var(--b); border-radius: 2px 2px 0 0; overflow: hidden; }
  body.abs .sb-b { height: var(--ha); }
  .sb-b.a { left: 3px; } .sb-b.b { right: 3px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--b); }
  .sb-b.seul { left: 9.5px; }
  .sb-b i { position: absolute; left: 0; right: 0; top: 0; height: var(--xs); background: var(--acc); }
  body.abs .sb-b i { display: none; }
  .sb-r { position: absolute; width: 2px; bottom: var(--rb); height: var(--rh); background: var(--encre); opacity: .55; }
  .sb-r.deb::after, body.abs .sb-r.deba::after { content: ""; position: absolute; left: -3px; top: -5px; border: 4px solid transparent; border-bottom: 5px solid var(--encre); border-top: 0; }
  body.abs .sb-r.deb:not(.deba)::after { display: none; }
  .sb-r.a { left: 7.5px; } .sb-r.b { right: 7.5px; } .sb-r.seul { left: 14px; }
  body.abs .sb-r { bottom: var(--rba); height: var(--rha); }
  .sb-av { position: absolute; left: -2px; right: -2px; height: 2px; bottom: var(--av); background: var(--encre); }
  body.abs .sb-av { bottom: var(--ava); }
  .sb-n { font-size: 12px; color: var(--encre); white-space: nowrap; }
  .sb-v { font: 500 12px var(--mono); color: var(--encre); white-space: nowrap; }
  .sb-v.hst, .hst { color: var(--acc); font-weight: 700; }
  /* Les réglages : grands, au doigt. */
  .regl { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { min-height: 32px; padding: 0 9px; border-radius: 16px; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; background: #ececf1; color: var(--encre); }
  .chip[aria-pressed="true"], .chip[aria-checked="true"] { background: var(--encre); color: #fff; }
  .chip[aria-pressed="true"] .ic, .chip[aria-checked="true"] .ic { color: #fff; }
  .flag { display: flex; gap: 6px; align-items: flex-start; font-size: 12px; line-height: 1.3; }
  .flag .ic { margin-top: 1px; color: var(--gris); }
  .trou { border-radius: 8px; padding: 8px 10px; font-size: 12px; line-height: 1.35; background: repeating-linear-gradient(135deg, #fff 0 4px, #f0f0f4 4px 7px); box-shadow: inset 0 0 0 1px #c4c4cc; display: flex; gap: 6px; align-items: flex-start; }
  .trou b { font-weight: 700; }
  .f-dem-t { flex-basis: 100%; text-align: center; font-size: 12px; color: var(--fi-gris); }
  [data-role="biotransformation"] { border-radius: 8px; padding: 8px 10px; background: #f6f6f9; display: flex; flex-direction: column; gap: 4px; font-size: 12px; line-height: 1.35; }`;

// ---------- légende : derrière « ? », fermée au repos ----------
export const li = (c, m) => `<span class="leg-i">${c}<span>${m}</span></span>`;
export const legende = (sections) => `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
    ${sections.map(([t, items, l2]) => `<div class="leg-s"><h3>${t}</h3><div class="leg-g${l2 ? ' l2' : ''}">${items.join('')}</div></div>`).join('')}
  </section>`;
export const LEG_FAMILLES = ['Familles', ORDRE.map((f) => li(pic(f, 18), COURT[f]))];
export const LEG_CONF = ['Ce que vaut un chiffre', [li(conf('mesure'), 'publié ou lot'), li(conf('panel'), 'goûté par un panel'), li(conf('calcule'), 'moteur, en plage'), li(conf('simule'), 'moteur profil-simulé, ~, conventions à valider'), li(conf('inconnu'), 'pas de donnée, pas zéro'), li(conf('verifier'), 'lecture à vérifier')], true];
export const LEG_HOUBLON = ['Houblon', [li('<span class="al lot">6,5%</span>', 'α du lot en stock'), li('<span class="al fi">' + ic('livre', 12) + '10–15%</span>', 'α de ses fiches'), li('<span class="al lot">17,2%' + ic('diff', 12) + '</span>', 'lot hors de ses fiches'), li('<span class="us us-mot"><span class="us-m">mixte</span></span>', 'usage du fournisseur'), li('<span class="stk">' + ic('stock', 14) + '</span>', 'en stock'), li('<span class="stk">' + ic('achat', 14) + '</span>', 'à acheter'), li('<b class="hn">Citra</b>', 'appui long : sa fiche')], true];
export const LEG_PISTE = ['La piste du seuil', [li('<span class="lg-mini"><i class="lg-z"></i></span>', 'pâle : la 16D, jusqu’à ×10 (règle du moteur, à valider)'), li('<span class="lg-mini"><i class="lg-s"></i></span>', 'tirets : le seuil de perception'), li('<span class="lg-mini"><i class="lg-h"></i></span>', 'hachures : au-delà de la 16D'), li('<span class="lg-mini"><i class="lg-b"></i></span>', 'bande : de la plus petite à la plus grande valeur publiée, trait : le milieu')], true];
export const LEG_SIM = ['Le profil simulé', [li('<span class="lg-sb"><i class="z"></i><i class="b"></i></span>', 'barre : après l’ajout, ~'), li('<span class="lg-sb"><i class="z"></i></span>', 'pâle : la zone de la 16D'), li('<span class="lg-sb"><i class="z"></i><i class="b x"></i></span>', 'orangé : au-delà de la 16D'), li('<span class="lg-sb"><i class="z"></i><i class="r"></i></span>', 'trait fin : de bas à haut, ~')], true];
export const CSS_LEG = `
  .lg-mini { position: relative; width: 44px; height: 14px; display: inline-block; flex: none; }
  .lg-mini i { position: absolute; top: 2px; bottom: 2px; }
  .lg-z { left: 0; width: 30px; background: #eceaf4; border-right: 1.5px solid #8a8a96; }
  .lg-s { left: 20px; width: 0; border-left: 1.5px dashed var(--encre); }
  .lg-h { left: 0; right: 0; background: repeating-linear-gradient(135deg, #fff 0 4px, #fbe3d6 4px 6px); }
  .lg-b { left: 4px; right: 4px; top: 4px !important; bottom: 4px !important; border-radius: 4px; background: #184078; }
  .lg-sb { position: relative; width: 22px; height: 26px; display: inline-block; flex: none; border-bottom: 1px solid var(--trait2); }
  .lg-sb i { position: absolute; bottom: 0; }
  .lg-sb .z { left: 0; right: 0; height: 14px; background: #fcf8e3; border-top: 1.5px solid #856e0c; }
  .lg-sb .b { left: 6px; width: 10px; height: 10px; background: #d9b414; border-radius: 2px 2px 0 0; }
  .lg-sb .b.x { height: 22px; background: linear-gradient(#c2410c 0 6px, #d9b414 6px); }
  .lg-sb .r { left: 10px; width: 2px; height: 20px; bottom: 2px; background: var(--encre); opacity: .55; }`;
export const JS_LEGENDE = `
const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.querySelector('[data-role="legende"]'), LV = document.querySelector('[data-role="legende-voile"]');
const legende = (on) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); if (on) LG.querySelector('[data-role="legende-fermer"]').focus({ preventScroll: true }); else LB.focus({ preventScroll: true }); };
LB.addEventListener('click', () => legende(LG.hidden));
LV.addEventListener('click', () => legende(false));
LG.querySelector('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !LG.hidden) legende(false); });
if (/[?&]legende\\b/.test(location.search)) legende(true);`;

// ---------- en-tête commun : retour, question, « ? » ; la lentille au style / absolu ----------
export const barre = (titre) => `<header class="barre"><a class="retour" href="#" aria-label="Retour">${ic('chev-l', 20)}</a><h1>${titre}</h1><button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">${ic('aide', 18)}<i class="doigt" aria-hidden="true"></i></button></header>`;
export const lentille = () => `<span class="seg lentille" role="radiogroup" aria-label="Lecture"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>`;

// ---------- la page : l'habillage de l8g, la fiche g1 au langage de la page, les gestes ----------
// La fiche reprend le script de l8g tel quel, nourri des fiches de ces houblons ; « + / − » de la demande
// devient ce que la 16D attend (terreux, herbacé, floral), selon les fiches du houblon.
const D16 = STY.statements[0].families.map((f) => ({ f, s: 1 }));
export function scriptFiche(extraJs = '') {
  let js = runtime({ extra: JS_LEGENDE + extraJs });
  js = js.replace(JSON.stringify(FICHES), JSON.stringify(FD)).replace(/DEMANDE = \[[^\]]*\]/, 'DEMANDE = ' + JSON.stringify(D16));
  js = js.replace("h('b', {}, (d.s > 0 ? '+ ' : '− ') + COURT[d.f])", "h('b', {}, COURT[d.f])")
    .replace("h('p', { class: 'f-dem', 'data-role': 'demande' }, DEMANDE.map(", "h('p', { class: 'f-dem', 'data-role': 'demande' }, h('span', { class: 'f-dem-t' }, 'La 16D attend, selon ses fiches :'), DEMANDE.map(");
  if (!js.includes("'La 16D attend")) throw new Error('script de la fiche : adaptation de la demande introuvable');
  return js;
}
export const page = ({ titre, desc, css = '', corps, js = '' }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${desc} -->${POLICES}
<style>${CSS_BASE}${CSS_LEG}${css}</style>
</head>
<body>
${SYMB}
<main class="ecran">${corps}
</main>
<script>${scriptFiche(js)}</script>
</body>
</html>
`;
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(REPO, f).replace(/\\/g, '/') + ' (' + s.length + ' o)'); };
export const lireJSON = lire;
