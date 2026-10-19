// Lot 21 · série « au doigt » (y1–y5) : le socle commun.
//   - le profil simulé : donnees/profils-simules.json, le moteur du pilote (le stub du début est retiré) ;
//   - les vraies valeurs, chacune avec sa source : α et huile (fiches de la base, composes-houblon.json),
//     rapport au seuil (moteur « pouvoir », fils19-choix/donnees), mesures en bière
//     (fils21-choisir/donnees/comparatifs-dryhop.json), faits de H (composes-houblon.json) ;
//   - le langage de la baseline (l5e) : pictos au trait, « au style » / absolu, α du lot puis des fiches,
//     usage en mot, légende derrière « ? », la vraie fiche à l'appui long ; enrichi : le spectre des 12
//     familles en grand (bande d'incertitude, fantôme de comparaison, parts, points tirés), la plage énorme
//     sur une échelle logarithmique, les mots de confiance (mesuré, panel, calculé, simulé, inconnu).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from '../../../fils18-baseline/l5e/tuiles-l5e.mjs';

export const K = T.K;
export { T };
const ici = path.dirname(fileURLToPath(import.meta.url));
export const D21 = path.resolve(ici, '../..');
const REPO = K.REPO, E1 = K.E1;
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const esc = K.esc;
export const FAM = K.ORDRE;
export const NOM = K.NOM, COURT = K.COURT, J = K.J;
export const ico = K.ico, picto = T.picto;
export const fr = (x, d = 1) => (x == null ? '' : String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',').replace('-', '−'));
const fr3 = (x) => { if (x == null) return '?'; const a = Math.abs(x); const d = a >= 100 ? 0 : a >= 10 ? 0 : a >= 1 ? 1 : a >= 0.1 ? 2 : 3; return fr(x, d); };
export const minus = (s) => String(s).replace(/-/g, '−');

// ---------- le profil simulé ----------
// Le moteur du pilote (donnees/profils-simules.json, « simule »: true). Chaque famille est ramenée à [bas, centre, haut,
// partiel] (partiel = 1 : le vrai haut peut être plus haut, hautPartiel du moteur). Une famille à [0, 0, 0]
// n'est pas nulle : rien n'y est simulé (moteur, §1), elle se dessine « inconnu ».
const REEL = path.join(D21, 'donnees/profils-simules.json');
const brut = lire(REEL);
const MOTEUR = true;
const LEVC = { 'fermentis-us05': 'US-05', 'lalbrew-pomona': 'Pomona', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-diamond': 'Diamond' };
export const levCourt = (k) => LEVC[k] || k;
const f4 = (v) => (Array.isArray(v) ? [v[0], v[1], v[2], v[5] ? 1 : 0] : [v.bas, v.centre, v.haut, v.hautPartiel && v.hautPartiel.length ? 1 : 0]).map((x, i) => (i < 3 ? Math.round(x * 10) / 10 : x));
const arr = (p) => FAM.map((f) => f4(p[f]));
const nomDe = (g) => g.nom || g.houblon;
const zonesDe = (st) => Object.fromEntries(FAM.map((f) => [f, (st.zone || st.zones)[f].bande]));
// Plusieurs ajouts : la courbe du moteur (regle[] : points = P × x ÷ (x + K), K = 4,5 agrumes, 16 herbacé,
// 5,6 l'intensité, prise ici pour les autres familles ; vérifié : depuis la dose 1, la grille est redonnée à < 1 point).
const KCOURBE = Object.fromEntries(FAM.map((f) => [f, f === 'citrus' ? 4.5 : f === 'herbal' || f === 'green' ? 16 : 5.6]));
export const SIM = {
  source: MOTEUR ? 'moteur' : 'stub',
  fichier: MOTEUR ? 'donnees/profils-simules.json' : 'y1/socle/profils-simules.stub.json',
  avant: Object.fromEntries(FAM.map((f) => [f, f4(brut.biere.avant[f])])),
  zones: zonesDe(brut.style),
  courbe: MOTEUR ? { type: 'hyperbole', K: KCOURBE, P: Object.fromEntries(FAM.map((f) => [f, Math.round(26 * (3.86 + KCOURBE[f]) / 3.86 * 10) / 10])) } : { type: 'exp', P: brut.echelle.plafond },
  style: brut.style, biere: brut.biere, cas: brut.cas, constantes: brut.constantes || {},
  textes: brut.textes || {}, sources: brut.sources || {}, mention: brut.mention || '', degustation: brut.biere.degustation || null,
};
export const ESSAI = !MOTEUR;
export const texte = (s) => String(s || '').replace(/§\d+/g, (k) => SIM.textes[k] || k);
export const cle = (h, m, d, j, lv) => [h, m, d, j == null ? '' : j, lv].join('|');
const GRILLE = new Map(brut.grille.map((g) => [cle(nomDe(g), g.moment, g.dose_gL, g.jours, levCourt(g.levure)), g]));
export const DIMS = {
  doses: [...new Set(brut.grille.map((g) => g.dose_gL))].sort((a, b) => a - b),
  jours: [...new Set(brut.grille.map((g) => g.jours).filter((j) => j != null))].sort((a, b) => a - b),
  levures: [...new Set(brut.grille.map((g) => levCourt(g.levure)))],
  houblons: [...new Set(brut.grille.map(nomDe))],
};
export function grille(h, m, d, j, lv) {
  if (d === 0) return FAM.map((f) => SIM.avant[f]);
  const g = GRILLE.get(cle(h, m, d, m.startsWith('dry') ? j : null, lv));
  if (!g) throw new Error('grille : ' + cle(h, m, d, j, lv));
  return arr(g.apres || g.profil);
}
export const aGrille = (h, m, d, j, lv) => d === 0 || GRILLE.has(cle(h, m, d, m.startsWith('dry') ? j : null, lv));
/** Une tranche de la grille pour la page : { clé : [[bas, centre, haut, partiel] × 12] } ; ce qui manque est absent. */
export function tranche(hs, ms, ds, js, lvs) {
  const o = {};
  for (const h of hs) for (const m of ms) for (const d of ds) for (const lv of lvs) for (const j of m.startsWith('dry') ? js : [null]) if (aGrille(h, m, d, j, lv)) o[cle(h, m, d, j, lv)] = grille(h, m, d, j, lv);
  return o;
}
const PAIRES = (brut.grillePaires || brut.paires || []).map((p) => ({ ...p, noms: p.noms || p.houblons, lv: levCourt(p.levure) }));
/** Deux houblons dans le même ajout (2 + 2 g/L, 3 j) : profil, apport de chacun par famille, facteur de saturation. */
export function paire(a, b, m, lv) {
  const p = PAIRES.find((x) => x.moment === m && x.lv === lv && x.noms.includes(a) && x.noms.includes(b));
  if (!p) return null;
  const ap = p.apports ? Object.fromEntries(Object.entries(p.apports).map(([k, v], i) => [p.noms[i], v])) : null;
  return { profil: arr(p.apres || p.profil), parts: FAM.map((f) => (ap ? [ap[a][f] || 0, ap[b][f] || 0] : [p.parts[f]?.[a] ?? 0, p.parts[f]?.[b] ?? 0])), saturation: p.facteurSaturation ?? null, drapeaux: p.drapeaux || [] };
}
export const pairesDispo = () => PAIRES.map((p) => ({ noms: p.noms, moment: p.moment, levure: p.lv }));
export const casDe = (id) => SIM.cas.find((c) => c.id === id);
/** La saturation partagée, côté générateur (même règle que cumule() dans la page) : la courbe du moteur. */
export function cumuleN(ps) {
  return FAM.map((f, i) => {
    const av = SIM.avant[f], inc = (x) => x[0] === 0 && x[1] === 0 && x[2] === 0;
    if (ps.every((p) => inc(p[i]))) return [0, 0, 0, 0];
    const P = SIM.courbe.P[f], Kf = SIM.courbe.K[f];
    const X = ps.reduce((s, p) => { const d = Math.max(0, Math.min(P * 0.98, p[i][1] - av[1])); return s + Kf * d / (P - d); }, 0);
    const c = av[1] + P * X / (X + Kf), r = (x) => Math.round(x * 10) / 10;
    return [r(Math.min(c, ...ps.map((p) => p[i][0]))), r(c), r(Math.max(c, av[2] + ps.reduce((s, p) => s + Math.max(0, p[i][2] - av[2]), 0))), ps.some((p) => p[i][3]) ? 1 : 0];
  });
}
export const casApres = (id) => arr(casDe(id).apres);
export const casParJour = (id) => (casDe(id).parJour || []).map((j) => ({ jour: j.jour, jourRecette: j.jourRecette, p: arr(j.familles || j.profil) }));
/** Une vraie valeur des cas du moteur (mesures[]), avec sa source résolue. */
export function mesureCas(id, filtre) { const m = (casDe(id).mesures || []).find(filtre); return m || null; }
export const srcCles = (cles) => (Array.isArray(cles) ? cles : [cles]).map((k) => { const s = SIM.sources[k]; return s ? k + ' · ' + String(s.titre).split(/[.,]/)[0] + (s.annee ? ' ' + s.annee : '') : k; }).join(' ; ');

// ---------- les vraies valeurs ----------
const CH = lire(REPO + '/prototypes/houblons-v4/data/composes-houblon.json');
const CMP = lire(path.join(D21, 'donnees/comparatifs-dryhop.json'));
const F19 = (n) => lire(E1 + '/fils19-choix/donnees/' + n + '.json');
export const ETUDE = Object.fromEntries(CMP.etudes.map((e) => [e.id, e]));
const auteur = (e) => e.ref.split(',')[0].replace(/\s+[A-Z]{1,3}$/, '') + ' ' + ((e.ref.match(/(19|20)\d\d/) || [''])[0]);
export const srcEtude = (id) => { const e = ETUDE[id]; return id + ' · ' + auteur(e) + ' (' + (e.niveau === 'P' ? 'revue à comité' : 'non relu') + ')'; };
// Les fiches de la base (objet D de base/consolide/fiche.html), pour l'α, l'usage, la forme.
const FICHE_NOM = { Citra: 'Citra cryo', Cascade: 'Cascade', Galaxy: 'Galaxy', 'Idaho 7': 'Idaho 7', Motueka: 'Motueka', 'Nelson Sauvin': 'Nelson Sauvin', Nugget: 'Nugget' };
const CLE_CH = { Citra: 'beermaverick-citra', Cascade: 'beermaverick-cascade', Galaxy: 'beermaverick-galaxy', 'Idaho 7': 'beermaverick-idaho-7', Motueka: 'beermaverick-motueka', 'Nelson Sauvin': 'beermaverick-nelson-sauvin', Nugget: 'beermaverick-nugget' };
export const HOP = {};
for (const [h, n] of Object.entries(FICHE_NOM)) {
  const F0 = K.fiche(n), V = CH.varietes[CLE_CH[h]];
  // Citra : la base n'a que la fiche du cryo (le lot du stock, 24,8 %) ; les cas parlent de Citra T-90
  // (pellets), comme le moteur « pouvoir » : α et arômes de la fiche Beer Maverick, sans lot.
  const F = h === 'Citra' ? { ...F0, nom: 'Citra', lot: null, alphaRef: null, huiles: V.huile.valeurs.filter((v) => v.plage[0] != null).map((v) => ({ src: v.sources.join(', ').replace('bm-citra', 'Beer Maverick').replace('H1', 'YCH (H1)').replace('H7c', 'Haas (H7c)'), min: v.plage[0], max: v.plage[1] })), noteCitra: true } : F0;
  const a = F.alpha.map((s) => [s.min, s.max]);
  const lo = Math.min(...a.map((x) => x[0])), hi = Math.max(...a.map((x) => x[1]));
  HOP[h] = {
    nom: h, F, role: F.role ? F.role.v : 'inconnu', roleSource: F.role ? F.role.src : '',
    alpha: { lot: F.lot, lotSource: F.lot != null ? 'fiche de stock' : null, fiches: [lo, hi], horsFiches: F.lot != null && (F.lot < lo || F.lot > hi) },
    huile: V.huile.valeurs.filter((v) => v.plage[0] != null && v.plage[1] != null).map((v) => ({ min: v.plage[0], max: v.plage[1], src: v.sources.join(', '), texte: v.texte || '' })),
  };
}
// Couleurs des houblons : celles du lot 20 (donnees-h.json), une par houblon sur toute la série.
export const COUL = { Citra: '#184078', Cascade: '#781838', Galaxy: '#681878', 'Idaho 7': '#e80030', Motueka: '#4a1fd6', 'Nelson Sauvin': '#a0081f' };
export const huilePlage = (h) => { const x = HOP[h].huile; return [Math.min(...x.map((v) => v.min)), Math.max(...x.map((v) => v.max))]; };
// Rapport au seuil (moteur « pouvoir », fils19-choix/donnees/cas-*.json) : composés et familles.
const RAP_CAS = { Citra: 'cas-citra', Cascade: 'cas-cascade', Galaxy: 'cas-galaxy', 'Idaho 7': 'cas-idaho7', 'Citra+Galaxy': 'cas-citra3-galaxy7', 'Citra+Idaho 7': 'cas-citra3-idaho7-5', 'Citra+Idaho 7 Pomona actif': 'cas-citra3-idaho7-5-pomona-actif' };
const RAP_ID = { Citra: 'K2-citra', Cascade: 'K1-cascade-dryPost', Galaxy: 'K2-galaxy', 'Idaho 7': 'K2-idaho-7' };
const CLE_COMP = { linalol: 'linalol', géraniol: 'geraniol', '4MMP': '4MMP', myrcène: 'myrcene' };
export function rapport(cas, compose, o = {}) {
  if (MOTEUR && RAP_ID[cas]) {
    const m = mesureCas(RAP_ID[cas], (x) => x.type === 'compose' && x.compose === CLE_COMP[compose] && x.rapport && x.rapport.plage);
    // « base commune » : deux houblons comparés sur la même base de mesure (moteur, §26), quand elle existe.
    const r = o.baseCommune && m && m.rapportBaseCommune && m.rapportBaseCommune.plage ? m.rapportBaseCommune.plage : m && m.rapport.plage;
    if (m) return { min: r.min, central: r.central, max: r.max, titre: casDe(RAP_ID[cas]).titre + (o.baseCommune ? ' · base commune' : ''), source: 'moteur du pilote, cas ' + RAP_ID[cas] + ' (mesures[]' + (o.baseCommune ? ', rapportBaseCommune' : '') + ') : ' + srcCles(m.source) };
  }
  const c = F19(RAP_CAS[cas]);
  const x = Object.values(c.pouvoir.composes).find((v) => v.nom.startsWith(compose));
  if (!x || !x.lecture || !x.lecture.facteur) return null;
  const f = x.lecture.facteur;
  return { min: f.min, central: f.central, max: f.max, titre: c.titre, source: 'moteur « pouvoir », fils19-choix/donnees/' + RAP_CAS[cas] + '.json (H)' };
}
export const FAIT = CH; // composes-houblon.json : transferts, duree, saturation, levures, biotransformation…
// Les quatre levures : ce que disent les fiches (composes-houblon.json, levures), en vrai ; la règle du
// moteur (regle[]) pour ce qu'il simule.
const LV_CLE = { 'US-05': 'fermentis-us05', Verdant: 'lalbrew-verdant-ipa', Pomona: 'lalbrew-pomona', Diamond: 'lalbrew-diamond' };
export const LEVURES = ['US-05', 'Pomona', 'Verdant', 'Diamond'];
export const BIO = Object.fromEntries(LEVURES.map((l) => {
  const x = CH.levures[LV_CLE[l]];
  const statut = l === 'Pomona' ? 'documentée' : l === 'Verdant' ? 'qualitative' : l === 'Diamond' ? 'paradoxe' : 'non publiée';
  const texte = l === 'Pomona' ? 'géraniol → citronellol « medium » (fiche)' : l === 'Verdant' ? 'β-lyase qualitative, aucun chiffre' : l === 'Diamond' ? 'le plus de thiols mesurés, le fruité perçu le plus faible' : 'rien de publié par Fermentis';
  return [l, { nom: x.nom, statut, texte, attenuation: x.attenuation, esters: x.esters.replace(/«s*lows*»/i, 'faibles'), source: x.sources.join(', ') }];
}));
export const regleLevure = () => (brut.regle || []).find((r) => /^Levure/.test(r)) || '';
/** La biotransformation simulée d'un cas du moteur (citronellol, thiols libérés), par ajout. */
export const casBio = (id) => { const c = casDe(id); return c && c.biotransformation ? c.biotransformation : null; };

// ---------- le balisage : vrai, simulé, inconnu ----------
/** Une vraie valeur : data-nature="mesure", sa source ; « à vérifier » et « figure » se voient. */
export const M = (texte, source, o = {}) => `<span class="ms${o.cls ? ' ' + o.cls : ''}" data-nature="mesure" data-source="${esc(source)}"${o.attrs || ''}>${texte}${o.verifier ? '<i class="av">à vérifier</i>' : ''}${o.figure ? '<i class="av">figure</i>' : ''}</span>`;
/** Une valeur simulée : data-nature="simule", avec son signe. */
export const S = (texte, o = {}) => `<span class="sm${o.cls ? ' ' + o.cls : ''}" data-nature="simule"${o.attrs || ''}>${texte}</span>`;
export const INC = (texte = 'inconnu', raison = '') => `<span class="inc" data-inconnu="${esc(raison)}"><i class="hach" aria-hidden="true"></i>${texte}</span>`;
export const tagSim = () => `<span class="tag-sim">~ simulé${ESSAI ? '<span class="essai"> · essai</span>' : ''}</span>`;
/** Un composé : son nom, et le picto de sa famille dans sa ligne (D94, L2). */
export const C = (nom, fams) => `<span class="cp">${fams.map((f) => picto(f, 14)).join('')}${nom}</span>`;

/** La plage énorme sur une échelle logarithmique (D94, L3) : bande de 120 px au moins, bornes écrites, seuil ×1. */
export function plageLog(o) {
  const L0 = -3, L1 = 4, W = o.W || 300;
  const x = (v) => Math.max(0, Math.min(W, ((Math.log10(v) - L0) / (L1 - L0)) * W));
  const a = o.min, b = o.max, ouvert = b == null;
  const xa = x(a), xb = ouvert ? W : x(b), xs = x(1), xc = o.central != null ? x(o.central) : null;
  const txt = ouvert ? `≥ ×${fr3(a)}` : `×${fr3(a)}–${fr3(b)}`; // × le seuil du composé
  return `<div class="plg" data-nature="mesure" data-source="${esc(o.source)}"${o.attrs || ''} aria-label="${esc((o.aria || '') + ' : ' + txt + ' le seuil ; ' + (o.titre || ''))}">
    <span class="plg-n">${C(o.compose, o.fams)}</span>
    <span class="plg-t">${txt}<small> seuil</small></span>
    <span class="plg-e" style="width:${W}px" aria-hidden="true">
      <i class="plg-r"></i>${[-2, 0, 2].map((d) => `<i class="plg-dec" style="left:${x(10 ** d).toFixed(1)}px"></i>`).join('')}
      <i class="plg-b${ouvert ? ' ouvert' : ''}" data-role="incertitude" style="left:${xa.toFixed(1)}px;width:${Math.max(4, xb - xa).toFixed(1)}px"></i>
      <i class="plg-s" style="left:${xs.toFixed(1)}px"></i>
      <span class="plg-l" style="left:${xa.toFixed(1)}px">${fr3(a)}</span>${ouvert ? '<span class="plg-l d" style="right:0">?</span>' : `<span class="plg-l d" style="left:${xb.toFixed(1)}px">${fr3(b)}</span>`}
      <span class="plg-sl" style="left:${xs.toFixed(1)}px">seuil ×1</span>
    </span>
  </div>`;
}

// ---------- le houblon : nom, usage en mot, α du lot puis des fiches (D87, D90) ----------
export const usage = (h) => T.usage({ houblon: h, role: HOP[h].role, roleSource: HOP[h].roleSource });
export const alpha = (h) => T.alpha({ houblon: h, alpha: HOP[h].alpha });
export const nomH = (h, o = {}) => `<span class="hn" data-houblon="${esc(h)}"${o.couleur !== false && COUL[h] ? ` data-couleur="${COUL[h]}"` : ''}>${COUL[h] ? `<i class="hpt" style="--h:${COUL[h]}"></i>` : ''}${esc(h)}</span>`;
export const huile = (h) => { const [a, b] = huilePlage(h); return M(`${fr(a)}–${fr(b)} <small>mL/100 g</small>`, 'huile totale : ' + HOP[h].huile.map((v) => v.src).join(' ; ') + ' (composes-houblon.json)', { cls: 'hu-l' }); };

// ---------- l'IBU, comme l'app (Tinseth ; whirlpool : × 2^((T − 100) / 10)) ----------
export const OG = 1.066;
export function ibuParGL(alphaPct, minutes, o = {}) {
  const big = 1.65 * 0.000125 ** (OG - 1);
  const u = (m) => big * (1 - Math.exp(-0.04 * m)) / 4.15;
  if (o.whirlpool) return (alphaPct / 100) * 1000 * u(o.minutes || 20) * 2 ** (((o.T || 85) - 100) / 10);
  return (alphaPct / 100) * 1000 * u(minutes);
}

// ---------- le spectre des 12 familles (client) ----------
export const SPECTRE_CSS = `
  .spec { display: flex; flex-direction: column; gap: 1px; position: relative; }
  .sp-axe { position: relative; height: 14px; margin-left: 98px; margin-right: 76px; }
  .sp-axe-t span { position: absolute; top: 0; transform: translateX(-50%); font: 500 12px/14px var(--sans); color: var(--gris); white-space: nowrap; }
  .sp-axe-t span:first-child { transform: none; }
  .sp-axe-t span.z { color: var(--encre); font-weight: 600; }
  .sp-axe-t span.u { transform: translateX(4px); }
  .sp-l { display: flex; align-items: center; gap: 4px; height: 17px; }
  .sp-l .pi { width: 16px; height: 16px; flex: none; }
  .sp-n { width: 74px; flex: none; font-size: 12px; line-height: 1; color: var(--encre); white-space: nowrap; overflow: hidden; }
  .sp-p { position: relative; flex: 1; height: 15px; background: #f3f4f7; border-radius: 2px; }
  .sp-z { position: absolute; left: 0; top: 0; bottom: 0; width: var(--zx); background: var(--zf); border-right: 1.5px solid var(--zt); }
  .sp-b { position: absolute; left: 0; top: 3px; height: 9px; width: var(--bx); background: var(--c); border-radius: 0 2px 2px 0; transition: width .09s linear; z-index: 1; }
  .sp-x { position: absolute; left: var(--zx); top: 3px; height: 9px; width: var(--xx); background: var(--acc); border-radius: 0 2px 2px 0; z-index: 2; transition: width .09s linear; }
  .sp-f { position: absolute; top: 7px; height: 1px; left: var(--fb); width: var(--fw); background: #6b6f7a; z-index: 3; transition: left .09s linear, width .09s linear; }
  .sp-f::before, .sp-f::after { content: ''; position: absolute; top: -3px; width: 1px; height: 7px; background: #6b6f7a; }
  .sp-f::before { left: 0; } .sp-f::after { right: 0; }
  .sp-f.ouvert::after { right: -5px; top: -3.5px; width: 0; height: 0; background: none; border: 4px solid transparent; border-left: 6px solid #6b6f7a; border-right: 0; }
  .sp-g { position: absolute; left: 0; top: 1px; height: 13px; width: var(--gx); border: 1.5px dashed var(--encre); border-left: 0; border-radius: 0 2px 2px 0; z-index: 4; transition: width .09s linear; pointer-events: none; box-sizing: border-box; }
  .sp-g[hidden], .sp-a[hidden], .sp-m[hidden], .sp-i[hidden] { display: none; }
  .sp-a { position: absolute; top: -1px; height: 17px; width: 2px; left: var(--ax); margin-left: -1px; background: var(--encre); z-index: 5; }
  .sp-m { position: absolute; top: 3px; height: 9px; left: var(--mx); width: var(--mw); z-index: 1; background: repeating-linear-gradient(135deg, var(--c) 0 2px, #fff 2px 4px); box-shadow: inset 0 0 0 1px var(--c); transition: left .09s linear, width .09s linear; }
  .sp-i { position: absolute; left: 0; top: 2px; height: 11px; width: 30px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; z-index: 2; }
  .sp-dots { position: absolute; inset: 0; z-index: 6; pointer-events: none; }
  .sp-dots i { position: absolute; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; background: var(--encre); box-shadow: 0 0 0 1px #fff; }
  .sp-dots i.ho { background: var(--acc); }
  .sp-q { width: 72px; flex: none; font-size: 12px; line-height: 1; white-space: nowrap; color: var(--gris); }
  .sp-q.ho { color: var(--acc); font-weight: 600; }
  .spec.mini .sp-n { width: 62px; } .spec.mini .sp-axe { margin-left: 84px; margin-right: 62px; } .spec.mini .sp-q { width: 58px; } .spec.mini .sp-l { height: 15px; } .spec.mini .sp-p { height: 13px; }
  .spec.mini .sp-l .pi { width: 14px; height: 14px; }`;
// Le dessin, en JS dans la page : Spectre(el, { hmax, pxc }).set({ p, ghost, avant, motif, dots }).
export const SPECTRE_JS = `
const FAM = ${JSON.stringify(FAM)};
const NOMF = ${JSON.stringify(Object.fromEntries(FAM.map((f) => [f, COURT[f].toLowerCase()])))};
const ZONE = ${JSON.stringify(SIM.zones)};
const JET = ${JSON.stringify(Object.fromEntries(FAM.map((f) => [f, J[f]])))};
const AVANT = ${JSON.stringify(FAM.map((f) => SIM.avant[f]))};
const COURBE = ${JSON.stringify(SIM.courbe)};
const ABS_MAX = 125; // l'échelle absolue n'est jamais rognée : le moteur donne des hauts au-delà de 100
const absolu = () => document.body.classList.contains('abs');
const crans = (i, v) => { const z = ZONE[FAM[i]]; return (v - z[0]) / ((z[1] - z[0]) / 3); };
const inconnuP = (x) => !x || (x[0] === 0 && x[1] === 0 && x[2] === 0);
const frn = (x, d = 0) => String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',').replace('-', '−');
const sg = (x) => (x > 0 ? '+' : x < 0 ? '−' : '±') + frn(Math.abs(x));
const rgbaJ = (h, a) => 'rgba(' + [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)).join(',') + ',' + a + ')';
// Saturation partagée (la dose totale compte), par la courbe du moteur : chaque apport Iᵢ (centre − avant)
// est ramené à son activité xᵢ = K Iᵢ ÷ (P − Iᵢ), les activités s'additionnent, puis I = P X ÷ (X + K).
// Bas : le plus bas des seuls ; haut : la somme des hauts (synergie et masquage inconnus).
function cumule(ps) {
  return FAM.map((f, i) => {
    const av = AVANT[i];
    if (ps.every((p) => inconnuP(p[i]))) return [0, 0, 0, 0];
    let I;
    if (COURBE.type === 'hyperbole') {
      const P = COURBE.P[f], K = COURBE.K[f];
      const X = ps.reduce((s, p) => { const d = Math.max(0, Math.min(P * 0.98, p[i][1] - av[1])); return s + K * d / (P - d); }, 0);
      I = P * X / (X + K);
    } else { const A = COURBE.P[f]; I = A * (1 - ps.reduce((q, p) => q * (1 - Math.max(0, Math.min(A * 0.999, p[i][1] - av[1])) / A), 1)); }
    const bas = Math.min(...ps.map((p) => p[i][0]));
    const haut = av[2] + ps.reduce((s, p) => s + Math.max(0, p[i][2] - av[2]), 0);
    return [Math.min(bas, av[1] + I), av[1] + I, Math.max(haut, av[1] + I), ps.some((p) => p[i][3]) ? 1 : 0];
  });
}
const lerpP = (a, b, t) => a.map((x, i) => x.map((v, k) => (k === 3 ? Math.max(v, b[i][k]) : v + (b[i][k] - v) * t)));
class Spectre {
  // Douze lignes nommées (le nom de la famille toujours écrit, pas un picto seul) : la zone du style en pâle,
  // le centre simulé en barre, la plage possible en trait, ma bière en repère, la comparaison en pointillé ;
  // l'orangé au-delà du style porte le mot « hors du style », une famille sans simulation le mot « inconnu ».
  constructor(el, o = {}) {
    this.el = el; this.o = Object.assign({ crans: 7 }, o);
    el.classList.add('spec'); if (o.mini) el.classList.add('mini');
    el.innerHTML = '<div class="sp-axe" aria-hidden="true"><span class="sp-axe-t"></span></div>' + FAM.map((f) => '<div class="sp-l" data-famille="' + f + '" role="img">' + pictoH(f, o.mini ? 14 : 16) + '<span class="sp-n">' + NOMF[f] + '</span><span class="sp-p" style="--c:' + JET[f].base + ';--zf:' + rgbaJ(JET[f].base, 0.24) + ';--zt:' + JET[f].texte + '"><i class="sp-z" data-role="zone"></i><i class="sp-b" data-nature="simule"></i><i class="sp-m" hidden></i><i class="sp-x"></i><i class="sp-f"></i><i class="sp-g" hidden></i><i class="sp-a"></i><i class="sp-i" hidden></i><span class="sp-dots"></span></span><span class="sp-q"></span></div>').join('');
    this.rows = [...el.querySelectorAll('.sp-l')];
    this.cols = this.rows;
    this.W = 0;
  }
  // Position en % de la piste : au style, en crans (0 à o.crans) ; en absolu, 0–125 de l'échelle.
  x(i, v) { if (absolu()) return Math.max(0, Math.min(ABS_MAX, v)) / ABS_MAX * 100; return Math.max(0, Math.min(this.o.crans, crans(i, v))) / this.o.crans * 100; }
  dehors(i, v) { return absolu() ? v > ABS_MAX : crans(i, v) > this.o.crans; }
  axe() {
    const t = this.el.querySelector('.sp-axe-t');
    if (absolu()) t.innerHTML = [0, 50, 100].map((v) => '<span style="left:' + (v / ABS_MAX * 100) + '%">' + v + '</span>').join('') + '<span class="u" style="left:100%">sur 100</span>';
    else t.innerHTML = '<span style="left:0">0</span><span class="z" style="left:' + (3 / this.o.crans * 100) + '%">haut du style</span><span style="left:' + (6 / this.o.crans * 100) + '%">6 crans</span>';
  }
  set(s) {
    this.s = s; this.axe();
    const ref = s.ref || AVANT, pc = (v) => v.toFixed(2) + '%';
    this.rows.forEach((c, i) => {
      const P = c.querySelector('.sp-p'), x = s.p[i], z = ZONE[FAM[i]], q = c.querySelector('.sp-q');
      const inc = inconnuP(x);
      P.querySelector('.sp-i').hidden = !inc;
      for (const k of ['.sp-b', '.sp-x', '.sp-f']) P.querySelector(k).style.visibility = inc ? 'hidden' : '';
      const [b, m, h, partiel] = inc ? [0, 0, 0, 0] : x;
      const zx = this.x(i, z[1]), X = this.x(i, m);
      P.style.setProperty('--zx', pc(zx));
      P.style.setProperty('--bx', pc(X));
      P.style.setProperty('--xx', pc(Math.max(0, X - zx)));
      P.style.setProperty('--fb', pc(this.x(i, b)));
      P.style.setProperty('--fw', pc(Math.max(0.6, this.x(i, h) - this.x(i, b))));
      P.querySelector('.sp-f').classList.toggle('ouvert', !!partiel || this.dehors(i, h));
      const g = P.querySelector('.sp-g');
      if (s.ghost && !inconnuP(s.ghost[i])) { g.hidden = false; P.style.setProperty('--gx', pc(this.x(i, s.ghost[i][1]))); } else g.hidden = true;
      const a = P.querySelector('.sp-a'); a.hidden = !!s.sansAvant || inconnuP(AVANT[i]); P.style.setProperty('--ax', pc(this.x(i, AVANT[i][1])));
      const mo = P.querySelector('.sp-m');
      if (s.parts && !inc) { const pa = s.parts[i][0], pb = s.parts[i][1], tot = pa + pb || 1, base = this.x(i, AVANT[i][1]), wb = (X - base) * pb / tot; mo.hidden = !(wb > 0.8); P.style.setProperty('--mx', pc(X - wb)); P.style.setProperty('--mw', pc(wb)); } else mo.hidden = true;
      const dots = P.querySelector('.sp-dots');
      if (s.dots && !inc) dots.innerHTML = (s.dots[i] || []).map((v, k) => '<i class="' + (v > z[1] ? 'ho' : '') + '" style="left:' + pc(this.x(i, v)) + ';top:' + (1 + ((k * 5) % 9)) + 'px"></i>').join(''); else dots.innerHTML = '';
      const hors = !inc && m > z[1];
      q.textContent = inc ? 'inconnu' : hors ? 'hors style' : '';
      q.className = 'sp-q' + (inc ? ' inc' : hors ? ' ho' : '');
      c.setAttribute('aria-label', NOMF[FAM[i]] + (inc ? ' : inconnu, rien de simulé (pas zéro)' : ' ~' + frn(crans(i, m), 1) + ' crans du style, simulé, plage de ' + frn(crans(i, b), 1) + ' à ' + frn(crans(i, h), 1) + ' crans' + (partiel ? ' au moins' : '') + (hors ? ', hors du style' : '')));
      c.dataset.crans = inc ? 'inconnu' : frn(crans(i, m), 1); c.dataset.hors = hors ? '1' : '0';
    });
  }
  // Ce que ça change, en mots : les familles qui bougent le plus (en crans), face à la référence.
  ecarts(n = 3) {
    const ref = this.s.ref || AVANT;
    return FAM.map((f, i) => ({ f, i, d: inconnuP(this.s.p[i]) || inconnuP(ref[i]) ? 0 : crans(i, this.s.p[i][1]) - crans(i, ref[i][1]), hors: !inconnuP(this.s.p[i]) && this.s.p[i][1] > ZONE[f][1] })).filter((x) => Math.abs(x.d) >= 0.75).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, n);
  }
  hors() { return FAM.filter((f, i) => !inconnuP(this.s.p[i]) && this.s.p[i][1] > ZONE[f][1]); }
  inconnues() { return FAM.filter((f, i) => inconnuP(this.s.p[i])); }
}
const pictoH = (f, s = 14) => '<svg class="pi" width="' + s + '" height="' + s + '" data-famille="' + f + '" aria-label="' + NOMF[f] + '"><use href="#p-' + f + '"/></svg>';
function phraseEcarts(sp, n = 3) {
  const e = sp.ecarts(n);
  if (!e.length) return '<span class="cq-0" data-nature="simule">~ presque rien ne bouge</span>';
  return e.map((x) => '<span class="cq' + (x.hors ? ' ho' : '') + '">' + pictoH(x.f) + NOMF[x.f] + ' <b data-nature="simule">~' + sg(x.d) + (Math.round(Math.abs(x.d)) >= 2 ? ' crans' : ' cran') + '</b></span>').join('');
}
`;

// ---------- la fiche, au langage de la page (D25, D93), enrichie des mesures en bière ----------
const pct = (x) => fr(x) + '%';
const plage = (a, b) => (a === b ? pct(a) : fr(a) + '–' + pct(b));
const LIVRE = ico('i-livre', 12), DIFF = ico('i-diff', 12, 'class="dif"');
const HCF = 24;
function barresFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x])), of = (F.aromes[0] || {}).of || 0;
  const col = (f, k) => {
    const x = par[f], n = x ? x.n : 0, sep = k === K.DB.attendues.length ? ' sep' : '';
    if (!n) return `<span class="mb fi-mb nd${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : non décrit par ses fiches"><span class="mb-z"><i class="mb-i"></i></span>${picto(f, 14)}</span>`;
    const h = Math.max(5, (n / of) * HCF);
    return `<span class="mb fi-mb ${n >= 2 ? 'mq' : 'ci'}${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : ${of === 1 ? 'cité par sa seule fiche' : n + ' fiches sur ' + of}" style="--c:${J[f].base};--cf:${T.rgba(J[f].base, 0.4)};--hc:${HCF}px"><span class="mb-z"><i class="mb-b" style="--s:${h.toFixed(1)}px;--a:${h.toFixed(1)}px"></i></span>${picto(f, 14)}</span>`;
  };
  const seule = of === 1 ? (F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] : null;
  return `<div class="fi-bars"><span class="fi-bars-c" aria-label="Les familles citées par les fiches de ${esc(F.nom)}">${K.DB.ordre.map(col).join('')}</span>${seule ? `<span class="fi-seule">1 seule fiche : ${esc(seule)}</span>` : ''}</div>`;
}
function lignesFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  return K.DB.ordre.filter((f) => par[f] && par[f].n > 0).map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of;
    const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
    return `<div class="fi-lab" data-explique="${f}">${picto(f, 16)}<span class="fi-lab-t"><span class="fi-lab-n" style="--t:${J[f].texte}">${COURT[f]}</span>${cpt ? ` <span class="fi-cpt nb">${cpt}</span>` : ''}${mots.length ? ` <span class="fi-sep" aria-hidden="true">·</span> <span class="fi-mots">${esc(mots.join(', '))}</span>` : ''}</span></div>`;
  }).join('');
}
function alphaFiche(h) {
  const F = HOP[h].F, srcs = [...F.alpha].sort((a, b) => (a.an || 0) - (b.an || 0));
  const hors = F.lot != null && srcs.length && srcs.every((s) => F.lot < s.min || F.lot > s.max);
  const lot = F.lot != null ? `<span class="al lot" data-role="alpha" data-source="lot" role="img" aria-label="α du lot en stock : ${fr(F.lot)} %${hors ? ' ; hors des plages de ses fiches' : ''}">${pct(F.lot)}${hors ? DIFF : ''}</span>` : '';
  const fi = `<span class="al af" data-role="alpha" data-source="fiches" role="img" aria-label="α de ses fiches : ${srcs.map((s) => plage(s.min, s.max).replace('%', ' %') + ' (' + s.src + (s.an ? ' ' + s.an : '') + ')').join(', ')}">${LIVRE}${srcs.map((s) => plage(s.min, s.max)).join(' · ')}${h === 'Citra' ? '<span class="pel">pellets</span>' : ''}</span>`;
  return `<span class="fi-alpha" data-role="fiche-alpha">${lot}${fi}</span>`;
}
// En bière : ce que disent les comparatifs (mesuré, panel, à vérifier, figure) ; un trou se dit.
const EN_BIERE = {
  Citra: [['E06', (m) => m.variete === 'Citra' && m.compose === 'linalol', (m) => `linalol ${fr(m.valeur)} µg/L, dose non indiquée`, ['floral', 'citrus']], ['E01', (m) => /Citra/.test(m.variete) && /citronellol/.test(m.compose), () => 'β-citronellol au-dessus du seuil', ['floral']]],
  Cascade: [['E04', (m) => m.dose_gL === 2 && /linalol/.test(m.compose || ''), (m) => `linalol extrait ${m.valeur} % à 2 g/L`, ['floral']], ['E04', (m) => m.dose_gL === 16 && /linalol/.test(m.compose || ''), (m) => `${m.valeur} % à 16 g/L (saturation)`, ['floral']]],
  'Idaho 7': [['E03', (m) => m.variete === 'Idaho-7' && m.compose === 'linalol', (m) => `linalol ${fr(m.valeur * 1000)} µg/L, au pitch`, ['floral', 'citrus']]],
  Galaxy: [],
  Nugget: [],
};
function enBiere(h) {
  const L = (EN_BIERE[h] || []).map(([id, filtre, texte, fams]) => { const m = ETUDE[id].mesures.find(filtre); if (!m) return ''; const verif = /vérifier/.test((m.lecture || '') + ' ' + (m.note || '')); return `<div class="fi-eb">${fams.map((f) => picto(f, 14)).join('')}${M(esc(texte(m)), srcEtude(id) + ' · ' + (m.lecture || ''), { verifier: verif, figure: m.lecture === 'figure' })}<span class="fi-gris">${id}</span></div>`; }).join('');
  return L || `<div class="fi-eb">${INC('aucune mesure en bière lue', 'comparatifs-dryhop.json : rien pour ' + h)}</div>`;
}
function ficheParts(h) {
  const F = HOP[h].F;
  const W = 60, x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4), a = K.recente(F.alpha);
  const reglette = a ? `<svg class="fi-reg" width="${W}" height="12" viewBox="0 0 ${W} 12" aria-hidden="true"><rect x="2" y="4" width="${W - 4}" height="4" rx="2" fill="#e9ecf2"/>${F.alpha.map((s) => `<rect x="${(x(s.min) - 1).toFixed(2)}" y="2" width="${Math.max(3, x(s.max) - x(s.min) + 2).toFixed(2)}" height="8" rx="2" fill="${s === a ? '#16161a' : '#aeb3be'}"/>`).join('')}${F.lot != null ? `<rect x="${(x(F.lot) - 1.5).toFixed(2)}" y="0" width="3" height="12" rx="1" fill="#16161a" stroke="#fff" stroke-width="1"/>` : ''}</svg>` : '';
  const note = h === 'Citra' ? '<p class="fi-note">α et arômes : fiche Beer Maverick (pellets). Mon stock : Citra cryo, α 24,8 %, une autre forme.</p>'
    : F.lot != null && F.alpha.every((s) => F.lot < s.min || F.lot > s.max) ? `<p class="fi-note">Mon lot ${fr(F.lot)} % : hors des plages de ses fiches.</p>` : '';
  const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
  const rg = (n, v) => `<div class="fi-rg"><span>${esc(n)}</span><b>${esc(v)}</b></div>`;
  const tags = (arr) => `<div class="fi-tags">${arr.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;
  const sections = [
    ['bière', 'En bière', enBiere(h)],
    ['huiles', 'Huiles', HOP[h].huile.map((v) => rg('totale, ' + v.src, fr(v.min) + '–' + fr(v.max) + ' mL/100 g')).join('') + (F.composants || []).map((c) => rg(c.nom, c.min != null ? K.plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || 'non renseigné')).join('')],
    ['sources', 'Sources', F.alpha.map((s) => rg('α ' + srcTxt(s), K.plageF(s) + ' %')).join('') + (F.lot != null ? rg('α mon lot', K.nbF(F.lot) + ' %') : '') + F.aromes.filter((x) => x.n > 0).map((x) => `<p class="fi-txt"><b>${COURT[x.f]}${x.of === 1 ? '' : ' ' + x.n + '/' + x.of}</b> ${esc(x.auteurs.join(', ') || 'non renseigné')}</p>`).join('')],
    ['styles', 'Styles', F.styles && F.styles.length ? tags(F.styles) : `<p class="fi-gris">${esc(F.stylesRaison || 'non renseigné')}</p>`],
  ];
  return { F, reglette, note, sections, roue: K.roueSVG(F, { W: 330, id: h.replace(/\W+/g, ''), gris: '#55555f', grille: '#e3e5eb' }) };
}
export function ficheHTML(h) {
  const P = ficheParts(h), F = P.F;
  const nd = K.DB.ordre.filter((f) => !F.aromes.find((x) => x.f === f && x.n));
  return `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
  <section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(h)}">
    <div class="fi-poignee" aria-hidden="true"></div>
    <header class="fi-t"><h2>${esc(h)}</h2>${usage(h).replace(/ data-houblon="[^"]*"/, '')}<button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ${esc(h)}">${ico('i-x', 16)}</button></header>
    <div class="w fi-duo">${alphaFiche(h)}${P.reglette}${P.note}</div>
    <div class="w w-ar" data-role="fiche-arome">${barresFiche(F)}${lignesFiche(F)}${nd.length ? `<p class="fi-nd">${nd.length} non décrite${nd.length > 1 ? 's' : ''} : inconnues, pas à zéro</p>` : ''}<div class="fi-r">${P.roue}</div></div>
    <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(h)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(h)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(h)}">${ico('i-ban', 16)}</button></span><button class="fi-b" data-k="fermer">Fermer</button></div>
    <div class="fi-replis" role="group" aria-label="Détail de la fiche">${P.sections.map(([id, t]) => `<button data-k="repli" data-sec="${id}" aria-expanded="false">${t}${ico('i-chev-d', 14)}</button>`).join('')}</div>
    ${P.sections.map(([id, t, corps]) => `<div class="w fi-sec" data-sec-corps="${id}" hidden aria-label="${t}">${corps}</div>`).join('')}
  </section>`;
}
export const ficheJS = (hs) => `
const FICHES = ${JSON.stringify(Object.fromEntries(hs.map((h) => [h, ficheHTML(h)])))};
const VOIES = {};
function rendFiche(nom, mode) { RACINE.className = 'mode-' + mode; RACINE.innerHTML = mode === 'bulle' ? FICHES[nom].replace(/<div class="fi-voile"[^>]*><\\/div>/, '') : FICHES[nom]; }
${K.GESTE_JS}`;

// ---------- la légende, derrière le « ? » (D89) ----------
const li = (c, m) => `<span class="leg-i"><span class="leg-c">${c}</span><span>${m}</span></span>`;
export function legende(sections) {
  return `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <i class="leg-bec" aria-hidden="true"></i>
    <div class="leg-in">
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ico('i-x', 16)}</button></div>
    <div class="leg-s"><h3>Familles</h3><div class="leg-g">${FAM.map((f) => li(picto(f, 18), COURT[f])).join('')}</div></div>
    <div class="leg-s"><h3>Colonnes</h3><div class="leg-g l2">
      ${li('<i class="lx lx-b"></i>', '~ simulé : le centre')}${li('<i class="lx lx-f"></i>', 'la plage possible')}
      ${li('<i class="lx lx-z"></i>', 'zone du style 16D')}${li('<i class="lx lx-x"></i>', 'orangé : hors du style')}
      ${li('<i class="lx lx-a"></i>', 'ma bière aujourd’hui')}${li('<i class="lx lx-g"></i>', 'pointillé : comparaison')}
      ${li('<span class="cb-lex">~+2</span>', 'deux crans du style de plus')}${li(INC(''), 'inconnu, jamais zéro')}
    </div></div>
    <div class="leg-s"><h3>Confiance</h3><div class="leg-g l2">
      ${li('<span class="ms">144</span>', 'mesuré, avec sa source')}${li('<span class="tag-sim">~</span>', 'simulé par le moteur')}
      ${li('<i class="av">à vérifier</i>', 'lecture à confirmer')}${li('<span class="plg-mini"></span>', 'plage énorme, échelle ×10')}
    </div></div>
    ${sections.join('')}
    <div class="leg-s"><h3>Houblon</h3><div class="leg-g l2">
      ${li('<span class="us">arôme</span>', 'usage : amer, arôme, mixte')}${li('<span class="al lot">6,5%</span>', 'α du lot en stock')}
      ${li(`<span class="al af">${LIVRE}10–15%</span>`, 'sans lot : α des fiches')}${li('<span class="leg-doigt" aria-hidden="true"></span>', 'appui long : sa fiche')}
    </div></div>
    ${ESSAI ? '<p class="leg-essai">Données d’essai (stub) : le profil simulé attend le moteur du pilote.</p>' : ''}
    </div>
  </section>`;
}
export const legendeSection = (titre, items) => `<div class="leg-s"><h3>${titre}</h3><div class="leg-g l2">${items.map(([c, m]) => li(c, m)).join('')}</div></div>`;

// ---------- l'en-tête, la lentille, la page ----------
export const tete = (titre) => `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <h1 class="titre">${titre}</h1>
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">${ico('i-aide', 18)}</button>
  </header>`;
const LENTILLE = `
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  if (window.rendre) window.rendre();
}));
if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
`;
export const CSS = T.CSS + SPECTRE_CSS + `
  html, body { background: #eef0f4; } body { background-image: none; }
  .ecran { gap: 8px; padding-bottom: 40px; }
  .barre { height: 36px; gap: 6px; }
  .titre { flex: 1; min-width: 0; font-size: 16px; font-weight: 700; line-height: 1.1; }
  .lentille button { padding: 0 8px; }
  .bloc { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; position: relative; }
  .bloc-h { display: flex; align-items: center; gap: 6px; min-height: 20px; font-size: 13px; font-weight: 600; flex-wrap: wrap; }
  .tag-sim { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 9px; background: #ececf1; font: 600 12px var(--sans); color: var(--encre); white-space: nowrap; }
  .tag-sim .essai { font-weight: 400; color: var(--gris); }
  .ms { font-family: var(--mono); font-variant-numeric: tabular-nums; font-weight: 600; font-size: 13px; color: var(--encre); white-space: nowrap; }
  .ms small { font: 400 12px var(--sans); color: var(--gris); }
  .sm { font-family: var(--mono); font-variant-numeric: tabular-nums; font-weight: 600; }
  .av { font: italic 400 12px var(--sans); color: #8a3a12; margin-left: 4px; padding: 0 4px; border-radius: 2px; box-shadow: inset 0 0 0 1px #d9b8a6; white-space: nowrap; }
  .inc { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); white-space: nowrap; }
  .inc .hach { display: inline-block; width: 14px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .cp { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
  .cp .pi { width: 14px; height: 14px; }
  .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; text-decoration: underline dotted #9a9aa6; text-underline-offset: 3px; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .hpt { width: 9px; height: 9px; border-radius: 50%; background: var(--h); flex: none; }
  .cq { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; white-space: nowrap; }
  .cq b { font-weight: 600; }
  .cq.ho b { color: var(--acc); }
  .cqs { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 2px 12px; min-height: 42px; }
  .cq-0 { font-size: 13px; color: var(--gris); }
  .hors-l { font-size: 13px; font-weight: 600; color: var(--acc); }
  /* la plage énorme */
  .plg { display: flex; align-items: center; gap: 4px 8px; flex-wrap: wrap; }
  .plg-n { font-size: 13px; font-weight: 600; min-width: 64px; }
  .plg-t { font: 600 13px var(--mono); white-space: nowrap; }
  .plg-e { position: relative; height: 40px; flex: none; margin: 0 auto; }
  .plg-r { position: absolute; left: 0; right: 0; top: 21px; height: 2px; background: #c4c6ce; }
  .plg-dec { position: absolute; top: 18px; width: 1px; height: 8px; background: #8a909b; }
  .plg-b { position: absolute; top: 17px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(90deg, rgba(22,22,26,.55) 0 2px, rgba(22,22,26,.18) 2px 6px); box-shadow: inset 0 0 0 1px var(--encre); }
  .plg-b.ouvert { border-radius: 2px 0 0 2px; -webkit-mask: linear-gradient(90deg, #000 70%, transparent); mask: linear-gradient(90deg, #000 70%, transparent); }
  .plg-s { position: absolute; top: 13px; width: 2px; height: 18px; margin-left: -1px; background: var(--acc); }
  .plg-c { position: absolute; top: 4px; width: 8px; height: 12px; margin-left: -4px; border-radius: 2px; background: var(--encre); box-shadow: 0 0 0 1.5px #fff; }
  .plg-l { position: absolute; top: 29px; font: 500 12px/1 var(--mono); color: var(--gris); transform: translateX(-50%); white-space: nowrap; }
  .plg-l.d { transform: translateX(-50%); }
  .plg-sl { position: absolute; top: 0; font: 600 12px/1 var(--sans); color: #8a3a12; transform: translateX(-50%); }
  .plg-mini { display: inline-block; width: 30px; height: 8px; border-radius: 2px; background: repeating-linear-gradient(90deg, rgba(22,22,26,.55) 0 2px, rgba(22,22,26,.18) 2px 6px); box-shadow: inset 0 0 0 1px var(--encre); }
  /* les voies : un houblon par ligne, α et huile en vrai */
  .voies { display: flex; flex-direction: column; gap: 4px; }
  .vh { display: flex; align-items: center; gap: 8px; min-height: 32px; padding: 3px 8px; border-radius: 8px; background: #fff; box-shadow: var(--ombre); flex-wrap: wrap; transition: transform .16s cubic-bezier(.2,.8,.2,1); }
  .vh.appui { transform: scale(.98); }
  .vh .q { margin-left: auto; }
  .hu-l { font-size: 12px; }
  .fi-eb { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 13px; }
  .leg-essai { font-size: 12px; color: var(--gris); }
  .lx { display: inline-block; width: 12px; height: 16px; }
  .lx-b { background: ${J.citrus.base}; border-radius: 2px 2px 0 0; }
  .lx-f { width: 2px; background: #55555f; }
  .lx-z { width: 18px; height: 10px; background: ${T.rgba(J.citrus.base, 0.24)}; border-top: 1.5px solid ${J.citrus.texte}; }
  .lx-x { background: var(--acc); }
  .lx-a { width: 18px; height: 2px; background: var(--encre); }
  .lx-g { width: 12px; border: 1.5px dashed var(--encre); border-bottom: 0; }
  .lev { display: flex; gap: 4px; flex-wrap: wrap; }
  .lev button, .chip { height: 28px; padding: 0 10px; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; color: var(--encre); display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .lev button[aria-pressed="true"], .chip[aria-pressed="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .bio { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; min-height: 24px; }
  .bio .st { font-weight: 600; }
  .bio .st.doc { color: #2f6b5f; }
  .src-l { font-size: 12px; color: var(--gris); }
  .pq { font-size: 13px; line-height: 1.35; }
  .pq b { font-weight: 600; }
  @media (prefers-reduced-motion: reduce) { .sp-b, .sp-x, .sp-f, .sp-g, .sp-m { transition: none; } }`;
export function page({ titre, commentaire, css = '', corps, script = '', hs = [], data = {} }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
${T.POLICES}
<style>${CSS}${css}</style>
</head>
<body>
${T.SPRITE}
<main class="ecran">${corps}
</main>
<div id="fiche-racine"></div>
<script>
const DONNEES = ${JSON.stringify(data)};
${SPECTRE_JS}${LENTILLE}${T.LEGENDE_JS}${ficheJS(hs)}
${script}
</script>
</body>
</html>
`;
}
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(D21, f).replace(/\\/g, '/') + ' (' + Math.round(s.length / 1024) + ' Ko) · profil : ' + SIM.source); };
