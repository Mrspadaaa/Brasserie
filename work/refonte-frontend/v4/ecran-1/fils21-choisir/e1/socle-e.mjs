// Lot 21 · socle commun de e1, e2 et e3 (les ladders). Il reprend le langage de la baseline l5e
// (fils18-baseline/l5e : pictos au trait au même <symbol>, α du lot puis des fiches, usage en mot,
// légende derrière le « ? », fiche à l'appui long dans le langage de la page, typographie de l'app) et
// lui ajoute ce que les ladders demandent : les houblons du pack et de composes-houblon.json avec leurs
// vraies valeurs, les sorties du moteur « pouvoir aromatique » (donnees/moteur-e.json), les comparatifs
// publiés en dry hop (fils21-choisir/donnees/comparatifs-dryhop.json) et le profil simulé (maquette
// fils21-choisir/donnees/profils-simules.json).
// Aucun chiffre recopié à la main : tout vient de ces fichiers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from '../../fils18-baseline/l5e/tuiles-l5e.mjs';

export const K = T.K;
export { T };
const { J, DB, NOM, COURT, ORDRE, esc, ico, SYM } = K;
export { J, NOM, COURT, ORDRE, esc, ico };
export const REPO = K.REPO;
const ici = path.dirname(fileURLToPath(import.meta.url));
export const D21 = path.join(ici, '..');
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// La fiche de la page ne porte pas les objectifs de c1 (floral +, résineux −) : ce ne sont pas ceux de la 16D ici.
DB.direction = [];

// ---------- icônes en plus (lucide-react 1.39.0, même grille que la baseline : trait rendu 1,5 px) ----------
function lucide(nom) {
  const t = fs.readFileSync(REPO + '/node_modules/lucide-react/dist/esm/icons/' + nom + '.mjs', 'utf8').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  const nodes = new Function('return ' + t)();
  return nodes.map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
}
for (const [id, n] of [['i-mesure', 'flask-conical'], ['i-calcul', 'calculator'], ['i-panel', 'users'], ['i-temps', 'clock'], ['i-paire', 'git-merge'], ['i-duel', 'arrow-left-right'], ['i-balance', 'scale'], ['i-couches', 'layers'], ['i-pourquoi', 'circle-question-mark'], ['i-drapeau', 'flag'], ['i-split', 'split']]) SYM[id] = lucide(n);

// ---------- les données ----------
const PF = lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const PROTO = lire(REPO + '/prototypes/houblons-v4/data/proto-data.json').varieties;
const CH = lire(REPO + '/prototypes/houblons-v4/data/composes-houblon.json');
export const MOTEUR = lire(path.join(ici, 'donnees', 'moteur-e.json'));
const fComp = path.join(D21, 'donnees', 'comparatifs-dryhop.json');
export const COMP = fs.existsSync(fComp) ? lire(fComp) : { stub: true, etudes: [] };
const fProf = path.join(D21, 'donnees', 'profils-simules.json');
// Le profil simulé : le vrai fichier du moteur « profil-simule » (le stub de e1 est retiré).
export const PROFILS = lire(fProf);
const C1 = K.C;

// ---------- la fiche de Citra T-90 (absente du pack) : ficheCatalogue de base/generateur/build.mjs ----------
// Recopiée de fils20-dryhop/d4/extraire-fiches.mjs (même règle que la base pour un houblon du catalogue).
const roleRegle = (a, marque) => (a >= 10 ? (marque ? 'double' : 'amérisant') : a <= 6 ? 'aromatique' : 'double');
function ficheCatalogue(v, orig, c) {
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  const src = (a) => (Array.isArray(a) ? [{ src: 'Beer Maverick', an: v.bmYear || null, min: a[0], max: a[1] }] : []);
  const M = (v.descriptions || []).length + (v.citedFacts || []).length;
  const corr = Object.fromEntries([...c.gagne, ...c.perd].map((x) => [x.family, x.a]));
  const aromes = orig.aromes.map((a) => { const lv = a.f in corr ? corr[a.f] : a.lv; return { f: a.f, lv, n: lv && M === 1 ? 1 : 0, of: M === 1 ? 1 : 0, auteurs: lv ? ['Beer Maverick'] : [], mots: [], premier: [] }; });
  const aMid = Array.isArray(v.alpha) ? (v.alpha[0] + v.alpha[1]) / 2 : null;
  const comp = { ...(v.oils || {}), linalool: Array.isArray(v.hsLinalool) ? v.hsLinalool : null };
  return {
    nom: v.name, origine: v.origin || null,
    role: aMid != null ? { v: roleRegle(aMid, aromes.some((a) => a.lv === 2)), src: 'règle : règle rôle-α v1 (prototype, à valider)' } : null,
    alpha: src(v.alpha), lot: null, lotOrigine: null, alphaRef: aMid, beta: src(v.beta), huiles: src(v.oil),
    composants: Object.entries(NOMS_H).map(([k, nom]) => (Array.isArray(comp[k]) ? { nom, min: comp[k][0], max: comp[k][1], src: k === 'linalool' ? 'Hopsteiner' : 'Beer Maverick' } : { nom, raison: k === 'farnesene' ? 'non importé (#131)' : 'non publié dans le catalogue' })),
    aromes, sansFamille: [], desc: v.tagsFr || [], subsCalc: [], subs: [], subsRaison: null,
    styles: [], stylesSrc: [], stylesRaison: 'styles d’emploi non publiés dans le dépôt', catalogue: true,
  };
}
// Une fiche du pack au format de la base (D.fichesH), pour les trois houblons du pack que la base n'a pas.
function ficheDePack(p) {
  const s = (o) => (o && o.sources ? o.sources.map((x) => ({ src: x.source, an: x.annee || null, min: x.min, max: x.max })) : []);
  const C = p.huiles && p.huiles.composants || {};
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  return {
    nom: p.name, origine: p.origin || null, role: p.role ? { v: p.role.value, src: p.role.source } : null,
    alpha: s(p.alpha), lot: p.alpha && p.alpha.retenu && p.alpha.retenu.from === 'fiche de stock' ? p.alpha.retenu.value : null, lotOrigine: null, alphaRef: p.alpha && p.alpha.retenu ? p.alpha.retenu.value : null,
    beta: s(p.beta), huiles: s(p.huiles && p.huiles.totale),
    composants: Object.entries(NOMS_H).map(([k, nom]) => (C[k] ? { nom, min: C[k].min, max: C[k].max, src: C[k].source } : { nom, raison: C[k + 'Raison'] || 'non publié dans le catalogue' })),
    aromes: (p.aromes || []).map((a) => ({ f: a.family, lv: a.level, n: a.sources, of: a.of, auteurs: a.authors || [], mots: a.mots || [], premier: a.premier || [] })),
    sansFamille: (p.motsSansFamille || []).map((m) => (typeof m === 'string' ? { mot: m } : m)), desc: p.descripteurs || [], subsCalc: [], subs: [], subsRaison: p.substitutsRaison || null,
    styles: [], stylesSrc: [], stylesRaison: 'styles d’emploi non publiés dans le dépôt',
  };
}
const cryoPF = PF.find((f) => f.key === 'beermaverick-citra:cryo');
const candC = cryoPF.substitutsCalcules.remplacants.find((r) => r.key === 'beermaverick-citra');
const F_CITRA = ficheCatalogue(PROTO.find((x) => x.id === 'beermaverick-citra'), DB.fichesH['beermaverick-citra:cryo'], { gagne: candC.gagne || [], perd: candC.perd || [] });

// ---------- les houblons : tous ceux du pack, et Citra T-90 (composes-houblon.json) ----------
const C1F = {};
for (const v of C1.voies) for (const h of v.fiches || []) if (!C1F[h.houblon]) C1F[h.houblon] = h;
const env = (l) => { const a = l.filter((x) => x.min != null), b = l.filter((x) => x.max != null); return a.length || b.length ? [a.length ? Math.min(...a.map((x) => x.min)) : null, b.length ? Math.max(...b.map((x) => x.max)) : null] : null; };
const mil = (p) => (p && p[0] != null && p[1] != null ? (p[0] + p[1]) / 2 : null);
const CLES = [...PF.map((p) => p.key), 'beermaverick-citra'];
export const HOPS = {};
for (const cle of CLES) {
  const p = PF.find((x) => x.key === cle);
  const F = DB.fichesH[cle] || (cle === 'beermaverick-citra' ? F_CITRA : ficheDePack(p));
  const nom = F.nom;
  const M = MOTEUR.varietes[cle] || null;
  const fiAlpha = env(F.alpha);
  const c1 = C1F[nom];
  const lot = c1 ? c1.alpha.lot : F.lot;
  const alpha = { lot: lot ?? null, lotSource: c1 ? c1.alpha.lotSource : F.lotOrigine === 'stock' ? 'fiche de stock' : F.lotOrigine === 'article' ? 'lu sur l’article' : null, fiches: c1 ? c1.alpha.fiches : fiAlpha, horsFiches: lot != null && fiAlpha ? lot < fiAlpha[0] || lot > fiAlpha[1] : false };
  const w = {};
  for (const a of F.aromes) if (a.lv > 0 && a.of > 0) w[a.f] = Math.round((a.lv === 2 ? 1 : 0.6) * (a.n / a.of) * 1000) / 1000;
  // L'huile : le moteur (composes-houblon.json, enveloppe des sources) ou les fiches du pack.
  const hEnv = M ? M.huile.plage : env(F.huiles);
  const huile = hEnv && hEnv[0] != null && hEnv[1] != null ? [hEnv[0], hEnv[1], M ? hEnv[2] : mil(hEnv)] : null;
  const comp = (k, nomFiche) => {
    if (M && M.teneurs[k] && M.teneurs[k].plage) return { plage: M.teneurs[k].plage, unite: M.teneurs[k].unite, sources: M.teneurs[k].sources, de: 'composes', bc: M.teneurs[k].bc };
    const c = (F.composants || []).find((x) => x.nom === nomFiche && x.min != null);
    return c ? { plage: [c.min, c.max, mil([c.min, c.max])], unite: '% de l’huile', sources: [c.src], de: 'fiches' } : null;
  };
  const vraies = { myrcene: comp('myrcene', 'myrcène'), linalol: comp('linalol', 'linalol'), geraniol: comp('geraniol', 'géraniol'), humulene: comp('humulene', 'humulène'), caryophyllene: comp('caryophyllene', 'caryophyllène'), '4MMP': comp('4MMP', '4MMP'), '3MH': comp('3MH', '3MH') };
  const thiol = M && M.classeHopsteiner.length ? M.classeHopsteiner[0].classe : null;
  HOPS[nom] = {
    nom, cle, F, alpha, usage: F.role ? { houblon: nom, role: F.role.v, roleSource: F.role.src } : null, stock: lot != null,
    w, huile, huileSources: M ? M.huile.sources : (F.huiles || []).map((x) => x.src + (x.an ? ' ' + x.an : '')), huileDe: M ? 'composes' : huile ? 'fiches' : null,
    vraies, thiol, geraniol: vraies.geraniol ? vraies.geraniol.plage[2] : null, linalol: vraies.linalol ? vraies.linalol.plage[2] : null,
    precurseurs: !!(CH.varietes[cle] && (CH.varietes[cle].precurseurs || []).length), moteur: M ? cle : null, cryo: /cryo$/i.test(nom),
    lots: M ? M.lots : [], panel: M ? M.panel : [], classe: M ? M.classeHopsteiner : [],
  };
}
export const NOMS = Object.keys(HOPS);

// ---------- le profil simulé (profils-simules.json) : index compacts pour les pages ----------
// Une famille : [bas, centre, haut, crans, largeur, hautPartiel] (formatGrille) ; delta = après − avant (centre).
const FG = PROFILS.formatGrille;
const arr = (x) => (Array.isArray(x) ? x : x ? FG.map((k) => (k === 'hautPartiel' ? (x.hautPartiel && x.hautPartiel.length ? 1 : 0) : x[k] ?? null)) : null);
const r2 = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const fam12 = (o) => Object.fromEntries(ORDRE.map((f) => [f, (arr(o[f]) || []).map(r2)]));
export const SIMULES = [...new Set(PROFILS.grille.map((g) => g.nom))];
export function indexGrille() {
  const out = {};
  for (const g of PROFILS.grille) out[[g.nom, g.moment, g.dose_gL, g.jours ?? '', g.levure].join('|')] = { a: fam12(g.apres), d: Object.fromEntries(ORDRE.map((f) => [f, r2(g.delta[f])])), c: g.confiance, dr: g.drapeaux };
  return out;
}
export function indexPaires() {
  const out = {};
  for (const g of PROFILS.grillePaires) out[[...g.noms].sort().join('+') + '|' + g.moment + '|' + g.levure] = { noms: g.noms, a: fam12(g.apres), d: Object.fromEntries(ORDRE.map((f) => [f, r2(g.delta[f])])), ap: Object.fromEntries(Object.entries(g.apports || {}).map(([k, v]) => [HOPS_PAR_CLE(k), Object.fromEntries(ORDRE.map((f) => [f, r2(v[f])]))])), s: Object.fromEntries(Object.entries(g.seuls || {}).map(([k, v]) => [HOPS_PAR_CLE(k), Object.fromEntries(ORDRE.map((f) => [f, r2(v[f])]))])), c: g.confiance, dr: g.drapeaux };
  return out;
}
const HOPS_PAR_CLE = (k) => (Object.values(HOPS).find((h) => h.cle === k) || { nom: k }).nom;
// Les textes « §n » du fichier, et l'avant de la bière.
export const SIM_TEXTES = PROFILS.textes;
export const AVANT = Object.fromEntries(ORDRE.map((f) => [f, arr(PROFILS.biere.avant[f]).map(r2)]));
export const ECHELLE = PROFILS.echelle.parFamille;

// ---------- les comparatifs publiés : par famille, les études qui la mesurent ----------
// Un nom d'étude vers un houblon de la page : « Idaho-7 » → Idaho 7, « Saaz » → Saaz (CZ) ; sinon hors du pack.
const ALIAS = { 'Idaho-7': 'Idaho 7', Saaz: 'Saaz (CZ)', 'Hallertau Mittelfrüh': 'Hallertau Mittelfrüh' };
export const nomPage = (v) => { const b = String(v).replace(/\s*\(.*\)$/, '').trim(); const n = ALIAS[b] || b; return HOPS[n] ? n : null; };
export const aVerifier = (m) => /vérifier/i.test((m.note || '') + ' ' + (m.lecture || ''));
export const surFigure = (m) => /figure/i.test(m.lecture || '');
export const ETUDES = COMP.etudes || [];

// ---------- mise en forme française ----------
export const fr = (x, d) => {
  if (x == null || !Number.isFinite(x)) return '';
  const a = Math.abs(x);
  const k = d != null ? d : a >= 100 ? 0 : a >= 10 ? 0 : a >= 1 ? 1 : a >= 0.1 ? 2 : 3;
  let s = (Math.round(x * 10 ** k) / 10 ** k).toFixed(k).replace(/\.?0+$/, (m) => (m.startsWith('.') ? '' : m));
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  const [e, dec] = s.split('.');
  const ent = e.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (x < 0 ? '−' : '') + ent + (dec ? ',' + dec : '');
};
export const plageTxt = (p, u = '') => (!p ? '' : p[0] === p[1] ? fr(p[0]) : (p[0] == null ? '≤ ' + fr(p[1]) : p[1] == null ? '≥ ' + fr(p[0]) : fr(p[0]) + '–' + fr(p[1]))) + (u ? ' ' + u : '');

// ---------- briques HTML de la baseline ----------
export const picto = T.picto;
export const usage = (h) => (h.usage ? T.usage(h.usage) : '');
export const alphaHTML = (h) => T.alpha({ houblon: h.nom, alpha: h.alpha });
export const stockHTML = (h) => (h.stock ? `<span class="stk" role="img" aria-label="en stock">${ico('j-stock', 14)}</span>` : '');
// Le nom d'un houblon : appui long → sa fiche (data-houblon) ; la puce de couleur n'est pas utilisée ici.
export const nomHTML = (h) => `<span class="hn" data-houblon="${esc(h.nom)}">${esc(h.nom)}</span>`;

// ---------- D93 : la fiche dans le langage de la page (copie adaptée de tuiles-l5e.mjs, pour tous les houblons) ----------
const r3 = (x) => Math.round(x * 1000) / 1000;
const nbF = (v) => String(v).replace('.', ',');
const plageF = (s) => (s.min === s.max ? nbF(s.min) : nbF(s.min) + '–' + nbF(s.max));
const recente = (arr) => (arr || []).reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
const pct = (x) => fr(x) + '%';
const plageP = (a, b) => (a === b ? pct(a) : fr(a) + '–' + pct(b));
const LIVRE = ico('i-livre', 12), DIFF = ico('i-diff', 12, 'class="dif"');
const HCF = 24;
const rgba = T.rgba;
function barresFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const of = (F.aromes[0] || {}).of || 0;
  const col = (f, k) => {
    const x = par[f], n = x ? x.n : 0, sep = k === DB.attendues.length ? ' sep' : '';
    if (!n) return `<span class="mb fi-mb nd${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : non décrit par ses fiches"><span class="mb-z"><i class="mb-i"></i></span>${picto(f, 14)}</span>`;
    const hh = Math.max(5, n / of * HCF);
    return `<span class="mb fi-mb ${n >= 2 ? 'mq' : 'ci'}${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : ${of === 1 ? 'cité par sa seule fiche' : n + ' fiches sur ' + of}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)};--hc:${HCF}px"><span class="mb-z"><i class="mb-b" style="--s:${hh.toFixed(1)}px;--a:${hh.toFixed(1)}px"></i></span>${picto(f, 14)}</span>`;
  };
  const seule = of === 1 ? (F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] : null;
  return `<div class="fi-bars"><span class="fi-bars-c" aria-label="Les familles citées par les fiches de ${esc(F.nom)}">${DB.ordre.map(col).join('')}</span>${seule ? `<span class="fi-seule">1 seule fiche : ${esc(seule)}</span>` : ''}</div>`;
}
function lignesFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  return DB.ordre.filter((f) => par[f] && par[f].n > 0).map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of;
    const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))].slice(0, 5);
    return `<div class="fi-lab" data-explique="${f}">${picto(f, 16)}<span class="fi-lab-t"><span class="fi-lab-n" style="--t:${J[f].texte}">${COURT[f]}</span>${cpt ? ` <span class="fi-cpt nb">${cpt}</span>` : ''}${mots.length ? `${cpt ? ' <span class="fi-sep" aria-hidden="true">·</span>' : ''} <span class="fi-mots">${esc(mots.join(', '))}</span>` : ''}</span></div>`;
  }).join('');
}
function alphaFiche(F, nom, lot) {
  const cryo = /cryo$/i.test(nom), base = nom.replace(/\s*cryo$/i, '');
  const srcs = [...F.alpha].sort((a, b) => (a.an || 0) - (b.an || 0));
  const hors = !cryo && lot != null && srcs.length && srcs.every((s) => lot < s.min || lot > s.max);
  const l = lot != null ? `<span class="al lot" data-role="alpha" data-source="lot" role="img" aria-label="α du lot en stock : ${fr(lot)} %${hors ? ' ; hors des plages de ses fiches' : ''}">${pct(lot)}${hors ? DIFF : ''}</span>` : '';
  const fi = srcs.length ? `<span class="al af" data-role="alpha" data-source="fiches" role="img" aria-label="${cryo ? 'α des fiches du ' + base + ' en pellets' : 'α de ses fiches'} : ${srcs.map((s) => plageP(s.min, s.max).replace('%', ' %') + ' (' + s.src + (s.an ? ' ' + s.an : '') + ')').join(', ')}">${LIVRE}${srcs.map((s) => plageP(s.min, s.max)).join(' · ')}${cryo ? '<span class="pel">pellets</span>' : ''}</span>` : '';
  const txt = !l && !fi ? '<span class="al af" data-role="alpha" data-source="fiches">non renseigné</span>' : '';
  return `<span class="fi-alpha" data-role="fiche-alpha">${l}${fi}${txt}</span>`;
}
// Les vraies valeurs du dry hop dans la fiche : huile, composés rattachés à leur famille par leur picto.
const COMPO_FAM = { myrcene: 'resin', linalol: 'floral', geraniol: 'floral', humulene: 'spice', caryophyllene: 'spice', '4MMP': 'tropical', '3MH': 'citrus' };
const COMPO_NOM = { myrcene: 'myrcène', linalol: 'linalol', geraniol: 'géraniol', humulene: 'humulène', caryophyllene: 'caryophyllène', '4MMP': '4MMP', '3MH': '3MH' };
export { COMPO_FAM, COMPO_NOM };
function vraiesFiche(h) {
  const l = [];
  if (h.huile) l.push(`<span class="fv" data-nature="mesure" data-source="${esc(h.huileSources.join(', '))}"><span class="fv-n">huile</span> <b class="nb">${plageTxt(h.huile)}</b> <span class="fv-u">mL/100 g</span></span>`);
  for (const [k, v] of Object.entries(h.vraies)) if (v) l.push(`<span class="fv" data-nature="mesure" data-source="${esc(v.sources.join(', '))}">${picto(COMPO_FAM[k], 14)}<span class="fv-n">${COMPO_NOM[k]}</span> <b class="nb">${plageTxt(v.plage)}</b> <span class="fv-u">${v.unite === 'µg/kg' ? 'µg/kg' : '%'}</span></span>`);
  return l.length ? `<div class="fi-vraies">${l.join('')}</div>` : '<p class="fi-gris">Huile et composés : non publiés dans le dépôt.</p>';
}
function partsFiche(F, nom) {
  const a = recente(F.alpha);
  const W = 60, x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  const reglette = a ? `<svg class="fi-reg" width="${W}" height="12" viewBox="0 0 ${W} 12" aria-hidden="true"><rect x="2" y="4" width="${W - 4}" height="4" rx="2" fill="#e9ecf2"/>${F.alpha.map((s) => `<rect x="${r3(x(s.min) - 1)}" y="2" width="${r3(Math.max(3, x(s.max) - x(s.min) + 2))}" height="8" rx="2" fill="${s === a ? '#16161a' : '#aeb3be'}"/>`).join('')}</svg>` : '';
  const note = /cryo$/i.test(nom) ? `<p class="fi-note">α : plages de ${nom.replace(/\s*cryo$/i, '')} en pellets ; la fiche du cryo manque.</p>` : F.catalogue ? '<p class="fi-note">Pas dans le pack : fiche du catalogue (Beer Maverick).</p>' : '';
  const par = Object.fromEntries(F.aromes.map((y) => [y.f, y]));
  const nd = DB.ordre.filter((f) => !par[f] || !par[f].n);
  const sans = (F.sansFamille || []).length ? `<p class="fi-sans">sans famille : ${esc(F.sansFamille.map((s) => s.mot).join(', '))}</p>` : '';
  const ndP = nd.length ? `<p class="fi-nd">${nd.length} non décrite${nd.length > 1 ? 's' : ''}</p>` : '';
  const rg = (n, v) => `<div class="fi-rg"><span>${esc(n)}</span><b>${esc(v)}</b></div>`;
  const tags = (arr) => `<div class="fi-tags">${arr.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;
  const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
  const SECTIONS = [
    ['huiles', 'Huiles', (F.huiles.length ? F.huiles.map((s) => rg('totale, ' + srcTxt(s), plageF(s) + ' mL/100 g')).join('') : rg('totale', 'non renseigné')) + F.composants.map((c) => rg(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || 'non renseigné')).join('')],
    ['sources', 'Sources', F.alpha.map((s) => rg('α ' + srcTxt(s), plageF(s) + ' %')).join('') + (F.beta.length ? F.beta.map((s) => rg('β ' + srcTxt(s), plageF(s) + ' %')).join('') : rg('β', 'non renseigné'))
      + `<p class="fi-txt">Origine : ${esc(F.origine || 'non renseigné')}</p>` + F.aromes.filter((y) => y.n > 0).map((y) => `<p class="fi-txt"><b>${COURT[y.f]}${y.of === 1 ? '' : ' ' + y.n + '/' + y.of}</b> ${esc((y.auteurs || []).join(', ') || 'non renseigné')}</p>`).join('') + ((F.desc || []).length ? tags(F.desc) : '')],
  ];
  return { reglette, note, sans, nd: ndP, roue: K.roueSVG(F, { W: 330, id: nom.replace(/\W+/g, ''), gris: '#55555f', grille: '#e3e5eb' }), sections: SECTIONS };
}
export const FICHES = {};
for (const h of Object.values(HOPS)) {
  const F = h.F, P = partsFiche(F, h.nom);
  FICHES[h.nom] = `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
  <section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(h.nom)}">
    <div class="fi-poignee" aria-hidden="true"></div>
    <header class="fi-t"><h2>${esc(h.nom)}</h2>${h.usage ? T.usage(h.usage, { fiche: true }) : ''}${stockHTML(h)}<button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ${esc(h.nom)}">${ico('i-x', 16)}</button></header>
    <div class="w fi-duo">${alphaFiche(F, h.nom, h.alpha.lot)}${P.reglette}${P.note}</div>
    <div class="w w-ar" data-role="fiche-arome">${barresFiche(F)}${lignesFiche(F)}${P.sans}${P.nd}<div class="fi-r">${P.roue}</div></div>
    <div class="w">${vraiesFiche(h)}</div>
    <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(h.nom)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(h.nom)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(h.nom)}">${ico('i-ban', 16)}</button></span><button class="fi-b fi-b1" data-k="ajouter">Ajouter en dry hop</button></div>
    <div class="fi-replis" role="group" aria-label="Détail de la fiche">${P.sections.map(([id, t]) => `<button data-k="repli" data-sec="${id}" aria-expanded="false">${t}${ico('i-chev-d', 14)}</button>`).join('')}</div>
    ${P.sections.map(([id, t, corps]) => `<div class="w fi-sec" data-sec-corps="${id}" hidden aria-label="${t}">${corps}</div>`).join('')}
  </section>`;
}
// Les fiches embarquées : toutes (e1–e3), ou seulement celles des houblons que la page nomme (e4, page allégée).
export const ficheJS = (noms) => `
const FICHES = ${JSON.stringify(noms ? Object.fromEntries(noms.map((n) => [n, FICHES[n]])) : FICHES)};
const VOIES = {};
function rendFiche(nom, mode) { RACINE.className = 'mode-' + mode; const html = FICHES[nom]; RACINE.innerHTML = mode === 'bulle' ? html.replace(/<div class="fi-voile"[^>]*><\\/div>/, '') : html; }
${K.GESTE_JS}`;
export const FICHE_JS = ficheJS(null);

// ---------- la légende (derrière le « ? ») ----------
const li = (c, m) => `<span class="leg-i"><span class="leg-c">${c}</span><span>${m}</span></span>`;
export const MOTS_CONFIANCE = [
  ['mesure', 'mesuré', 'en bière, par une étude, ou sur un lot'],
  ['calcule', 'calculé', 'par le moteur, depuis les fiches publiées'],
  ['estime', 'estimé ~', 'simulé : une forme, pas une mesure'],
  ['inconnu', 'inconnu', 'pas de donnée : jamais zéro'],
];
export const motConfiance = (k, extra = '') => { const m = MOTS_CONFIANCE.find((x) => x[0] === k); return `<span class="mc mc-${k}"${extra}>${k === 'inconnu' ? '<i class="hach" aria-hidden="true"></i>' : ''}${m[1]}</span>`; };
export function legende(sections) {
  return `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <i class="leg-bec" aria-hidden="true"></i>
    <div class="leg-in">
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ico('i-x', 16)}</button></div>
    <div class="leg-s"><h3>Familles</h3><div class="leg-g">${ORDRE.map((f) => li(picto(f, 18), COURT[f])).join('')}</div></div>
    <div class="leg-s"><h3>Quatre mots de confiance</h3><div class="leg-g l1">${MOTS_CONFIANCE.map(([k, , t]) => li(motConfiance(k), t)).join('')}</div></div>
    ${sections}
    <div class="leg-s"><h3>Houblon</h3><div class="leg-g l2">
      ${li('<span class="al lot">8,1%</span>', 'α du lot en stock')}${li(`<span class="al af">${LIVRE}3,5–5,7%</span>`, 'sans lot : α de ses fiches')}
      ${li(`<span class="stk">${ico('j-stock', 14)}</span>`, 'en stock')}${li('<span class="us">arôme</span>', 'usage, en mot')}
      ${li('<span class="leg-doigt" aria-hidden="true"></span>', 'appui long : sa fiche')}${li(`<span class="stk">${ico('i-chev-r', 14)}</span>`, 'toucher : les preuves')}
    </div></div>
    <div class="leg-s"><h3>Données</h3><p class="leg-p">Mesuré : comparatifs publiés en dry hop (${ETUDES.length} études). Calculé : moteur « pouvoir aromatique », rapport au seuil, pas une intensité. Estimé : profil simulé (moteur « profil-simule »), conventions à valider par le brasseur.</p></div>
    </div>
  </section>`;
}

// ---------- la feuille de style commune (celle de l5e, plus les ladders) ----------
export const CSS = T.CSS + `
  .hn { font-weight: 600; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; white-space: nowrap; }
  .nb { font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .mc { display: inline-flex; align-items: center; gap: 3px; height: 18px; padding: 0 6px; border-radius: 9px; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .mc-mesure { background: #16161a; color: #fff; }
  .mc-calcule { background: #fff; color: #16161a; box-shadow: inset 0 0 0 1.5px #16161a; }
  .mc-estime { background: #ececf1; color: #3d3d47; }
  .mc-inconnu { background: #fff; color: #55555f; box-shadow: inset 0 0 0 1px #aeb3be; }
  .hach { width: 14px; height: 8px; border-radius: 2px; flex: none; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; display: inline-block; }
  .leg-g.l1 { grid-template-columns: 1fr; }
  .leg-p { font-size: 12px; line-height: 1.35; color: var(--encre); }
  .fi-vraies { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 13px; }
  .fv { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
  .fv-n { color: var(--gris); } .fv-u { color: var(--gris); font-size: 12px; } .fv b { font-weight: 600; font-size: 13px; }
  /* les réglages du simulateur : des pastilles qui changent de valeur au toucher */
  .regs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; padding: 1px; }
  .regs::-webkit-scrollbar { display: none; }
  .rg { flex: none; height: 28px; padding: 0 9px 0 7px; border-radius: 14px; background: #fff; box-shadow: var(--ombre), inset 0 0 0 1px rgba(22,22,26,.08); display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; white-space: nowrap; color: var(--encre); }
  .rg .pts { display: inline-flex; gap: 2px; margin-left: 2px; }
  .rg .pts i { width: 4px; height: 4px; border-radius: 50%; background: #c4c6ce; }
  .rg .pts i.on { background: var(--encre); }
  .rg.change { animation: rg-ch .5s cubic-bezier(.2,.8,.2,1); }
  @keyframes rg-ch { 0% { box-shadow: 0 0 0 3px rgba(22,22,26,.35); } 100% { box-shadow: var(--ombre), inset 0 0 0 1px rgba(22,22,26,.08); } }
  .rg[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .rg svg { color: currentColor; }
  /* les familles : une pastille par famille, picto et nom */
  .fams { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; padding: 1px; }
  .fams::-webkit-scrollbar { display: none; }
  .fa { flex: none; height: 30px; padding: 0 10px 0 7px; border-radius: 15px; background: rgba(255,255,255,.75); display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: var(--t); box-shadow: inset 0 0 0 1px rgba(22,22,26,.06); white-space: nowrap; }
  .fa[aria-checked="true"] { background: var(--f); box-shadow: inset 0 0 0 2px var(--b); }
  .fa .pi { width: 18px; height: 18px; }
  .pq { font-size: 13px; line-height: 1.3; color: var(--encre); display: flex; gap: 6px; align-items: flex-start; }
  .pq svg { color: var(--gris); margin-top: 1px; }
  .pq .src { white-space: nowrap; }
  /* la feuille des preuves (plan 2) */
  .pv-voile { position: fixed; inset: 0; z-index: 24; background: rgba(22,22,26,.32); }
  .preuves { position: fixed; z-index: 25; left: 0; right: 0; bottom: 0; max-width: 390px; margin: 0 auto; max-height: 82vh; overflow-y: auto; overscroll-behavior: contain; background: var(--mur); border-radius: 8px 8px 0 0; box-shadow: 0 -10px 30px -16px rgba(22,22,26,.6); padding: 4px 10px 14px; display: flex; flex-direction: column; gap: 6px; }
  .preuves[hidden], .pv-voile[hidden] { display: none; }
  .pr-t { display: flex; align-items: center; gap: 8px; min-height: 32px; font-size: 15px; font-weight: 700; }
  .pr-t button { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; background: #fff; box-shadow: var(--ombre); display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .pr-b { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; font-size: 13px; }
  .pr-b h3 { font-size: 12px; font-weight: 700; color: var(--gris); display: flex; align-items: center; gap: 6px; }
  .pr-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pr-l .src, .pr-src { color: var(--gris); font-size: 12px; }
  .av { display: inline-flex; padding: 0 5px; border-radius: 4px; background: #fdf0ea; color: #9a3412; font-size: 12px; font-weight: 600; }
  .fig { display: inline-flex; padding: 0 5px; border-radius: 4px; background: #ececf1; color: #3d3d47; font-size: 12px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .rg.off { color: var(--gris); }
  .xs { color: var(--acc); }
  body.abs .seul-style { display: none !important; }
  body:not(.abs) .seul-absolu { display: none !important; }
  /* la piste du calculé : log, seuil en noir, ×10 (convention « hors du style ») en orangé */
  .ll { position: relative; height: 42px; }
  .ll::before { content: ''; position: absolute; left: 0; right: 0; top: 17px; height: 8px; border-radius: 4px; background: #ececf1; }
  .ll-t { position: absolute; top: 14px; height: 14px; width: 1px; background: #c4c6ce; }
  .ll-t.s1 { background: var(--encre); width: 2px; margin-left: -1px; }
  .ll-t.s10 { background: var(--acc); width: 2px; margin-left: -1px; }
  .ll-tx { position: absolute; top: 29px; transform: translateX(-50%); font: 500 12px var(--mono); color: var(--gris); white-space: nowrap; }
  .ll-tx.x1 { color: var(--encre); font-weight: 600; font-family: var(--sans); }
  .ll-tx.x10 { color: var(--acc); font-weight: 600; }
  .ll-b { position: absolute; top: 15px; height: 12px; background: color-mix(in srgb, var(--c) 45%, #fff); box-shadow: inset 0 0 0 1.5px var(--c); border-radius: 4px; }
  .ll-b.ouvert-d { border-radius: 4px 0 0 4px; box-shadow: inset 1.5px 0 0 var(--c), inset 0 1.5px 0 var(--c), inset 0 -1.5px 0 var(--c); background: linear-gradient(90deg, color-mix(in srgb, var(--c) 45%, #fff) 60%, rgba(255,255,255,0)); }
  .ll-b.ouvert-g { border-radius: 0 4px 4px 0; box-shadow: inset -1.5px 0 0 var(--c), inset 0 1.5px 0 var(--c), inset 0 -1.5px 0 var(--c); background: linear-gradient(270deg, color-mix(in srgb, var(--c) 45%, #fff) 60%, rgba(255,255,255,0)); }
  .ll-c { position: absolute; top: 11px; height: 20px; width: 3px; margin-left: -1.5px; background: var(--encre); border-radius: 1px; }
  .ll-g, .ll-d { position: absolute; top: 0; font: 600 12px var(--mono); color: var(--encre); white-space: nowrap; line-height: 13px; }
  .ll-d { transform: translateX(-100%); }
  .ll-inc { position: absolute; left: 0; right: 0; top: 13px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); background: #fff; padding: 0 4px; }
  .ll-inc .hach { width: 40px; height: 12px; }
  /* la mini piste de l'estimé */
  .pe { position: relative; display: inline-block; width: 64px; height: 14px; flex: none; }
  .pe::before { content: ''; position: absolute; left: 0; right: 0; top: 5px; height: 4px; background: #ececf1; border-radius: 2px; }
  .pe-z { position: absolute; left: 0; top: 1px; bottom: 1px; width: var(--zs); background: color-mix(in srgb, var(--b) 24%, #fff); box-shadow: inset -1.5px 0 0 color-mix(in srgb, var(--b) 80%, #16161a); border-radius: 2px 0 0 2px; }
  body.abs .pe-z { width: var(--za); }
  .pe-b { position: absolute; top: 4px; height: 6px; left: var(--bs); width: var(--ws); background: var(--b); border-radius: 3px; }
  body.abs .pe-b { left: var(--ba); width: var(--wa); }
  .pe-x { position: absolute; top: 4px; height: 6px; left: var(--xls); width: var(--xws); background: var(--acc); border-radius: 0 3px 3px 0; }
  body.abs .pe-x { left: var(--xla); width: var(--xwa); }
  .pe-c { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; left: var(--cs); background: var(--encre); border-radius: 1px; }
  body.abs .pe-c { left: var(--ca); }
  .pe-dep { position: absolute; right: -5px; top: 3px; border: 4px solid transparent; border-left: 5px solid var(--acc); border-right: 0; }
  .pe.inc .hach { position: absolute; left: 0; top: 3px; width: 64px; height: 8px; }
  .ve { font-size: 13px; font-weight: 600; white-space: nowrap; }
  .ve.inc { color: var(--gris); font-weight: 400; }
  .bio { display: inline-flex; align-items: center; gap: 1px; height: 18px; padding: 0 4px; border-radius: 9px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .bio.pale { box-shadow: inset 0 0 0 1px #9a9aa6; }
  .bio svg:not(.pi) { color: var(--gris); }
  .bio-l { align-items: center; }
  .bio-l .pi { margin-top: 0; }
  /* la feuille des preuves */
  .pr-et { display: flex; flex-direction: column; gap: 2px; padding-top: 2px; }
  .pr-et + .pr-et { border-top: 1px solid var(--trait); padding-top: 5px; }
  .pr-l b { font-weight: 600; }
  .pr-fs { display: flex; flex-wrap: wrap; gap: 4px 10px; }
  .pr-f { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; }
  .pr-b .fi-b { align-self: flex-start; margin-top: 2px; display: inline-flex; align-items: center; gap: 3px; }
  .pe-l { display: flex; align-items: center; gap: 8px; }
  .dots { position: relative; height: 34px; margin: 2px 0; }
  .dots::before { content: ''; position: absolute; left: 0; right: 0; top: 11px; height: 2px; background: #c4c6ce; }
  .dots-b { position: absolute; top: 6px; height: 12px; background: #ececf1; box-shadow: inset 0 0 0 1px #aeb3be; border-radius: 4px; }
  .dot { position: absolute; top: 6px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: var(--encre); box-shadow: 0 0 0 1.5px #fff; }
  .dots-0, .dots-1 { position: absolute; top: 20px; font-size: 12px; color: var(--gris); }
  .dots-0 { left: 0; } .dots-1 { right: 0; }
`;

// ---------- le gabarit ----------
export const page = ({ titre, commentaire, css = '', corps, donnees, script, fiches = null }) => `<!doctype html>
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
<div class="pv-voile" data-role="preuves-voile" hidden></div>
<section class="preuves" data-role="preuves" role="dialog" aria-label="Les preuves" hidden></section>
<div id="fiche-racine"></div>
<script>const DONNEES = ${JSON.stringify(donnees)};</script>
<script>${K.LENTILLE_JS}${T.LEGENDE_JS}${fiches ? ficheJS(fiches) : FICHE_JS}</script>
<script>${script}</script>
</body>
</html>
`;
export const ecrire = K.ecrire;
// Une vue fixe pour une capture : la page dans un cadre de 390 × 844, dans l'état demandé.
export const vue = T.vue;

// ---------- les données embarquées dans les pages ----------
// Les comparatifs mesurés, par famille : une option = une étude et un composé (ou un descripteur), avec
// ses valeurs par variété (µg/L ; mg/L converti, dit), le témoin, les drapeaux « à vérifier » et « figure ».
const ref = (e) => { const m = e.ref.match(/^([^,.]+)[^]*?(\d{4})/); return m ? m[1].split(' ')[0] + ' ' + m[2] : e.id; };
const condTxt = (e) => [e.conditions.dose_gL == null ? 'dose non publiée' : typeof e.conditions.dose_gL === 'number' ? fr(e.conditions.dose_gL) + ' g/L' : 'doses par variété', e.conditions.jours == null ? 'durée non publiée' : typeof e.conditions.jours === 'number' ? fr(e.conditions.jours) + ' j' : String(e.conditions.jours).replace(/\s*\(.*\)/, '') + ' j', /pitch/i.test(e.conditions.moment) ? 'au pitch, pas un dry hop' : null].filter(Boolean).join(' · ');
export function optionsMesure() {
  const out = Object.fromEntries(ORDRE.map((f) => [f, []]));
  for (const e of ETUDES) {
    const par = {};
    for (const m of e.mesures) { if (!m.famille || !out[m.famille]) continue; const k = m.compose || m.descripteur; (par[m.famille + '|' + k] ||= []).push(m); }
    for (const [k, ms] of Object.entries(par)) {
      const [f, quoi] = k.split('|');
      const num = ms.filter((m) => typeof m.valeur === 'number' && !/plage/.test(m.variete));
      const base = { etude: e.id, ref: ref(e), niveau: e.niveau, url: e.url, quoi, conditions: condTxt(e), note: e.note || '' };
      if (num.length >= 2 && !/part extraite|extraction/.test(quoi)) {
        const mg = num.every((m) => m.unite === 'mg/L'), k1 = mg ? 1000 : 1;
        const unite = mg ? 'µg/L' : num[0].unite;
        const temoin = num.find((m) => /témoin/.test(m.variete));
        out[f].push({ ...base, unite, publie: mg ? 'publié en mg/L' : null, temoin: temoin ? { valeur: temoin.valeur * k1, ecart: temoin.ecart != null ? temoin.ecart * k1 : null } : null,
          valeurs: num.filter((m) => m !== temoin).map((m) => ({ variete: m.variete.replace(/\s*\(.*\)$/, ''), nom: nomPage(m.variete), valeur: m.valeur * k1, ecart: m.ecart != null ? m.ecart * k1 : null, av: aVerifier(m), fig: surFigure(m), lecture: m.lecture || '' })).sort((a, b) => b.valeur - a.valeur) });
      } else {
        const q = ms.filter((m) => /plus élevé|plus élevée/.test(String(m.valeur)));
        if (q.length) out[f].push({ ...base, qualitatif: true, valeurs: q.map((m) => ({ variete: m.variete, nom: nomPage(m.variete), texte: m.valeur, lecture: m.lecture || '', fig: surFigure(m), av: aVerifier(m) })) });
      }
    }
  }
  // D'abord l'option qui compte le plus de houblons du pack, puis la plus longue.
  for (const f of ORDRE) out[f].sort((a, b) => (b.valeurs.filter((v) => v.nom).length - a.valeurs.filter((v) => v.nom).length) || (!!a.qualitatif - !!b.qualitatif) || (b.valeurs.length - a.valeurs.length));
  return out;
}
// Toutes les mesures publiées d'un houblon du pack, par étude (pour la feuille des preuves).
export function mesuresDe(nom) {
  const out = [];
  for (const e of ETUDES) {
    const ms = e.mesures.filter((m) => nomPage(m.variete) === nom);
    if (ms.length) out.push({ etude: e.id, ref: ref(e), niveau: e.niveau, url: e.url, conditions: condTxt(e), mesures: ms.map((m) => ({ quoi: m.compose || m.descripteur, famille: m.famille, valeur: m.valeur, ecart: m.ecart ?? null, unite: m.unite, av: aVerifier(m), fig: surFigure(m), dose: m.dose_gL ?? null })) });
  }
  return out;
}
// Le moteur pour un houblon : teneurs (vraies valeurs), signaux par dose et moment, drapeaux de levure et de durée.
export function moteurDe(cle) {
  const M = MOTEUR.varietes[cle]; if (!M) return null;
  const sig = {};
  for (const [k, v] of Object.entries(M.signaux)) sig[k] = Object.fromEntries(Object.entries(v.f).map(([f, x]) => [f, x.s ? [x.s, x.m, x.bc] : [null, null, null, x.inc]]));
  return { teneurs: M.teneurs, huile: M.huile, sig, bio: M.bio, duree: M.duree, classe: M.classeHopsteiner, lots: M.lots, panel: M.panel, style: Object.fromEntries(Object.entries(M.signaux).map(([k, v]) => [k, v.style])) };
}
export const SOURCES = MOTEUR.sources;
// « Pourquoi ? » en une phrase, selon le dernier réglage touché (faits de H et des comparatifs, sourcés).
export const POURQUOI = {
  defaut: ['À dose égale, l’écart vient de l’huile et des thiols par gramme.', 'I §1, H §0–1'],
  'moment:b60': ['À 60′, presque tout part : il reste l’amertume.', 'H30, H13'],
  'moment:b10': ['À 10′, une part reste ; le dry hop en garde le plus.', 'I §Profil simulé (ordres de grandeur relayés)'],
  'moment:wp': ['Au whirlpool, environ la moitié reste : ordre de grandeur relayé, non validé.', 'I S10'],
  'moment:dryActive': ['En fermentation active, la levure peut transformer.', 'H33, H41'],
  'moment:dryPost': ['Après fermentation : la référence des panels (4 g/L, 3 j).', 'H21'],
  'jours:1': ['L’essentiel est extrait en 24 h.', 'H73, H92'],
  'jours:3': ['À 3 j, l’extraction est faite ; au-delà, rien de mesuré en plus.', 'H73'],
  'jours:7': ['Au-delà de 3 j : rien de mesuré en plus.', 'H73, H22, H68'],
  'dose:2': ['À 2 g/L, la part extraite est la plus haute (Cascade : linalol 23 %).', 'E04'],
  'dose:4': ['4 g/L : la dose des panels ; l’agrume monte encore.', 'E04, H21'],
  'dose:8': ['Vers 8 g/L, les agrumes plafonnent (Cascade, mesuré).', 'E04'],
  'levure:fermentis-us05': ['US-05 : esters bas ; biotransformation non publiée.', 'H50-us05'],
  'levure:lalbrew-verdant-ipa': ['Verdant : esters abricot, tropical ; β-lyase qualitative, rendement inconnu.', 'H49, H50-verdant'],
  'levure:lalbrew-pomona': ['Pomona : géraniol → citronellol, en fermentation active.', 'H50-pomona, H51'],
  'levure:lalbrew-diamond': ['Diamond : le plus de thiols mesurés, mais le fruité perçu le plus faible.', 'samia2026'],
  'part:on': ['Ensemble, la dose totale compte ; synergie inconnue.', 'H22, H67, H72'],
  'part:off': ['Un houblon seul, à la dose écrite.', ''],
};
export const LEVURES = { 'fermentis-us05': 'US-05', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-pomona': 'Pomona', 'lalbrew-diamond': 'Diamond' };
export const MOMENTS = { dryPost: 'après', dryActive: 'actif', wp: 'whirlpool', b10: '10′', b60: '60′' };
export const MOMENTS_LONG = { dryPost: 'dry hop après fermentation', dryActive: 'dry hop en fermentation active', wp: 'whirlpool', b10: 'à 10′', b60: 'à 60′' };
// Le paquet commun d'une page : familles, tons, houblons (simulateur et HTML), mesures, moteur.
export function donneesCommunes(noms = NOMS) {
  return {
    ORDRE, NOM, COURT, J: Object.fromEntries(ORDRE.map((f) => [f, { base: J[f].base, texte: J[f].texte, fond: J[f].fond }])),
    BANDE: Object.fromEntries(ORDRE.map((f) => [f, ECHELLE[f].bande[1]])), ECHELLE, AVANT, SIMULES, SIM_TEXTES, LEVURES, MOMENTS, MOMENTS_LONG, POURQUOI,
    HOPS: Object.fromEntries(noms.map((n) => { const h = HOPS[n]; return [n, { nom: n, w: h.w, cle: h.cle, stock: h.stock, cryo: h.cryo, moteur: h.moteur, simule: SIMULES.includes(n), alpha: h.alpha, usage: h.usage ? h.usage.role : null,
      html: { nom: nomHTML(h), alpha: alphaHTML(h), stock: stockHTML(h), usage: usage(h) }, huileSources: h.huileSources, huileDe: h.huileDe,
      vraies: h.vraies, fiches: h.F.aromes.filter((a) => a.n > 0).map((a) => [a.f, a.n, a.of, a.lv]) }]; })),
    MESURES: optionsMesure(),
    MESURES_HOP: Object.fromEntries(noms.map((n) => [n, mesuresDe(n)])),
    // La bière sans houblon de chaque étude, par composé : ce qu'un houblon ajoute se lit au-dessus d'elle.
    TEMOINS: Object.fromEntries(ETUDES.flatMap((e) => e.mesures.filter((m) => /témoin/.test(m.variete) && typeof m.valeur === 'number').map((m) => [e.id + '|' + (m.compose || m.descripteur), m.valeur]))),
    MOTEUR: Object.fromEntries(noms.filter((n) => HOPS[n].moteur).map((n) => [n, moteurDe(HOPS[n].cle)])),
    SOURCES: Object.fromEntries(Object.entries(SOURCES).map(([k, s]) => [k, { titre: s.titre, niveau: s.niveau }])),
    ETUDES: ETUDES.map((e) => ({ id: e.id, ref: ref(e), niveau: e.niveau, conditions: condTxt(e), varietes: e.varietes })),
    ICO: { goutte: ico('j-goutte', 14), cuve: ico('j-cuve-p', 14), whirl: ico('j-whirl', 14), ebu: ico('j-ebu', 14), temps: ico('i-temps', 14), levure: ico('j-levure', 14),
      pourquoi: ico('i-pourquoi', 14), fleche: ico('i-arrow-r', 12), x: ico('i-x', 16), chev: ico('i-chev-r', 14), mesure: ico('i-mesure', 14), calcul: ico('i-calcul', 14),
      paire: ico('i-paire', 14), duel: ico('i-duel', 14), livre: ico('i-livre', 12), plus: ico('i-plus', 14), stock: ico('j-stock', 14) },
  };
}
