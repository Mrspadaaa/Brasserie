// Lot 21 · w1–w5 : toutes les données, à un seul endroit. Rien n'est recopié à la main quand un fichier du
// dépôt le donne ; chaque valeur garde sa source.
//   simulé   : fils21-choisir/donnees/profils-simules.json (moteur profil-simule), adapté ci-dessous ;
//   vraies   : pack-fiches (α, familles des fiches), proto-data (stock), composes-houblon, fils20 donnees-h (H),
//              fils19 moteur « pouvoir aromatique » (rapports au seuil, IBU par moment), fils19 verifications
//              (mesures en bière), fils21 comparatifs-dryhop (10 études, mesures en bière et panels).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const E1 = REPO + '/work/refonte-frontend/v4/ecran-1';
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// ---------- le simulé : profils-simules.json du moteur profil-simule (feu vert du pilote, 23 h 45) ----------
// Adapté au format interne des générateurs : familles en objets { bas, centre, haut, crans, inconnu },
// crans exacts lus sur le centre (CRANS_RULE arrondit et plafonne à 4 ; on garde la règle dans cransRegle),
// levures en noms courts, §n résolus. Rien n'est rogné : un haut au-delà de 100 reste tel quel.
const VRAI = E1 + '/fils21-choisir/donnees/profils-simules.json';
export const BRUT = lire(VRAI);
const LEV = { 'fermentis-us05': 'US-05', 'lalbrew-pomona': 'Pomona', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-diamond': 'Diamond' };
export const txt = (t) => (typeof t === 'string' ? t.replace(/§\d+/g, (k) => BRUT.textes[k] || k) : t);
function adapter(P) {
  const ordre = P.style.ordre;
  const bande = Object.fromEntries(ordre.map((f) => [f, P.style.zone[f].bande]));
  const cran = Object.fromEntries(ordre.map((f) => [f, (bande[f][1] - bande[f][0]) / 3]));
  const r1 = (x) => Math.round(x * 10) / 10;
  const fam = (f, o) => ({ bas: o.bas, centre: o.centre, haut: o.haut, crans: r1((o.centre - bande[f][0]) / cran[f]), cransRegle: o.crans, largeur: o.largeur, inconnu: o.inconnu ? txt(o.inconnu) : null, hautPartiel: o.hautPartiel || null, source: o.source || 'simulé' });
  const famA = (f, a) => fam(f, { bas: a[0], centre: a[1], haut: a[2], crans: a[3], largeur: a[4], hautPartiel: a[5] ? ['borne haute non publiée'] : null });
  const prof = (o) => Object.fromEntries(ordre.map((f) => [f, Array.isArray(o[f]) ? famA(f, o[f]) : fam(f, o[f])]));
  const drap = (d) => ({ id: d.id, titre: txt(d.titre), statut: txt(d.statut), texte: txt(d.pourquoi), sources: d.sources || [], familles: d.familles || [], ajout: d.ajout || null });
  return {
    stub: false, source: 'profils-simules.json (moteur profil-simule, ' + P.date + ')', mention: P.mention, mentionRapport: P.mentionRapport,
    familles: ordre, noms: Object.fromEntries(P.familles.map((x) => [x.id, x.nom])),
    echelle: { familles: Object.fromEntries(ordre.map((f) => [f, { bande: bande[f], cran: cran[f] }])) },
    style: P.style, ancre: P.ancre,
    biere: { titre: P.biere.titre, degustation: P.biere.degustation, avant: prof(P.biere.avant), drapeaux: P.biere.drapeaux.map(drap) },
    cas: P.cas.map((c) => ({ id: c.id, groupe: c.groupe, titre: c.titre, levure: LEV[c.levure] || c.levure, ajouts: c.ajouts.map((x) => ({ ...x, houblon: x.nom, levure: LEV[x.levure] || x.levure })),
      apres: prof(c.apres), parJour: (c.parJour || []).map((j) => ({ jour: j.jour, jourRecette: j.jourRecette, profil: prof(j.familles) })),
      apports: (c.apportsParHoublon || []).map((a) => ({ nom: a.nom, dose_gL: a.dose_gL, seul: a.seul, apport: a.apport, part: a.part })),
      saturation: c.saturation || null, bio: c.biotransformation || null, drapeaux: (c.drapeaux || []).map(drap),
      confiance: { niveau: c.confiance.niveau, raison: (c.confiance.pourquoi || []).map(txt).join(' ; ') }, mesures: c.mesures || [] })),
    grille: P.grille.map((g) => ({ houblon: g.nom, moment: g.moment, dose_gL: g.dose_gL, jours: g.jours, levure: LEV[g.levure] || g.levure, profil: prof(g.apres), confiance: g.confiance, drapeaux: g.drapeaux })),
    paires: P.grillePaires.map((g) => ({ noms: g.noms, moment: g.moment, doses: g.doses_gL, jours: g.jours, levure: LEV[g.levure] || g.levure, profil: prof(g.apres),
      apports: Object.fromEntries(g.noms.map((n, i) => [n, g.apports[g.houblons[i]]])), seuls: Object.fromEntries(g.noms.map((n, i) => [n, g.seuls[g.houblons[i]]])), facteur: g.facteurSaturation, confiance: g.confiance, drapeaux: g.drapeaux })),
  };
}
export const PROFILS = adapter(BRUT);
export const STUB = false;
export const ORDRE = PROFILS.familles;
export const BANDE = Object.fromEntries(ORDRE.map((f) => [f, PROFILS.echelle.familles[f].bande]));
export const CRAN = Object.fromEntries(ORDRE.map((f) => [f, PROFILS.echelle.familles[f].cran]));
export const AVANT = PROFILS.biere.avant;
export const AVANT_LEVURE = { 'US-05': AVANT };
export const cas = (id) => PROFILS.cas.find((c) => c.id === id);
export const point = (houblon, moment, dose, jours, levure = 'US-05') => PROFILS.grille.find((g) => g.houblon === houblon && g.moment === moment && g.dose_gL === dose && (g.jours ?? null) === (jours ?? null) && g.levure === levure);
export const paire = (a, b, moment, levure = 'US-05') => PROFILS.paires.find((p) => p.noms.includes(a) && p.noms.includes(b) && a !== b && p.moment === moment && p.levure === levure);
const uniq = (xs) => [...new Set(xs)];
export const VALEURS = { houblons: uniq(PROFILS.grille.map((g) => g.houblon)), doses: uniq(PROFILS.grille.map((g) => g.dose_gL)).sort((a, b) => a - b), jours: uniq(PROFILS.grille.map((g) => g.jours).filter((j) => j != null)).sort((a, b) => a - b), levuresGrille: uniq(PROFILS.grille.map((g) => g.levure)), levuresPaires: uniq(PROFILS.paires.map((p) => p.levure)) };
export const SOURCE_TXT = 'profil-simule, ' + BRUT.date;

// ---------- les houblons : α, usage, huile, stock, couleur ----------
const PF = lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const PD = lire(REPO + '/prototypes/houblons-v4/data/proto-data.json');
const H = lire(E1 + '/fils20-dryhop/donnees-h.json');
const CH = lire(REPO + '/prototypes/houblons-v4/data/composes-houblon.json');
const COULEUR = { Citra: H.houblons.citra.couleur, Cascade: H.houblons.cascade.couleur, Galaxy: H.houblons.galaxy.couleur, 'Idaho 7': H.houblons.idaho7.couleur, Nugget: '#4b5a12', Motueka: '#4a1fd6', 'Nelson Sauvin': '#a0081f' };
const FICHE_PACK = { Citra: 'Citra cryo', Cascade: 'Cascade', Galaxy: 'Galaxy', 'Idaho 7': 'Idaho 7', Nugget: 'Nugget', Motueka: 'Motueka', 'Nelson Sauvin': 'Nelson Sauvin' };
const BITTER = ['Amertume', 'Début d’ébullition', 'Milieu d’ébullition'];
const AROMA = ['Ajouts tardifs', 'Houblonnage à cru', 'Arôme', 'Whirlpool', 'Extinction de la chauffe'];
function usageDe(f, alpha) {
  const uses = f.usage || [], roles = uses.flatMap((u) => u.roles || []);
  const b = roles.some((r) => BITTER.includes(r)), a = roles.some((r) => AROMA.includes(r));
  if (b || a) return { v: b && a ? 'double' : b ? 'amérisant' : 'aromatique', src: 'fournisseur', txt: 'fournisseur : ' + (uses.find((u) => (u.roles || []).length) || {}).source };
  const marque = (f.aromes || []).some((x) => x.level === 2);
  return { v: alpha >= 10 ? (marque ? 'double' : 'amérisant') : alpha <= 6 ? 'aromatique' : 'double', src: 'règle', txt: 'règle : règle rôle-α v1 (prototype, à valider)' };
}
const plageAlpha = (f) => { const s = (f.alpha && f.alpha.sources) || []; return s.length ? [Math.min(...s.map((x) => x.min)), Math.max(...s.map((x) => x.max))] : null; };
export const HOP = {};
for (const nom of Object.keys(FICHE_PACK)) {
  const f = PF.find((x) => x.name === FICHE_PACK[nom]);
  const fiches = plageAlpha(f);
  const st = PD.stock.find((s) => s.items.some((i) => i === nom) && !/cryo/i.test(s.key));
  // Citra : le pack n'a que la fiche du Citra cryo ; la plage des fiches est celle du Citra en pellets (T-90).
  const lot = nom === 'Citra' ? null : f.alpha && f.alpha.retenu ? f.alpha.retenu.value : null;
  const lotSource = nom === 'Citra' ? null : f.alpha && f.alpha.retenu ? f.alpha.retenu.from : null;
  const alphaRef = lot ?? (fiches ? (fiches[0] + fiches[1]) / 2 : null);
  const cryo = nom === 'Citra' ? PD.stock.find((s) => /citra:cryo/.test(s.key)) : null;
  HOP[nom] = {
    nom, couleur: COULEUR[nom], cle: f.key.replace(':cryo', ''),
    alpha: { lot, lotSource, fiches, horsFiches: lot != null && fiches && (lot < fiches[0] || lot > fiches[1]), sources: ((f.alpha && f.alpha.sources) || []).map((s) => s.source + ' ' + (s.annee || '')).join(' ; ') },
    usage: usageDe(f, alphaRef),
    huile: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map((s) => ({ min: s.min, max: s.max, src: s.source + ' ' + (s.annee || '') })),
    stock: st ? st.grams : ((H.d5.alpha[{ Cascade: 'cascade', Galaxy: 'galaxy', 'Idaho 7': 'idaho7' }[nom]] || {}).lot || {}).grammes || 0, cryo: cryo ? { grammes: cryo.grams, alpha: cryo.alpha } : null,
    pack: f,
  };
}
// Huile totale de composes-houblon (sources H) : la plage la plus large publiée, avec ses sources.
for (const [nom, k] of [['Citra', 'beermaverick-citra'], ['Cascade', 'beermaverick-cascade'], ['Galaxy', 'beermaverick-galaxy'], ['Idaho 7', 'beermaverick-idaho-7'], ['Nugget', 'beermaverick-nugget'], ['Motueka', 'beermaverick-motueka'], ['Nelson Sauvin', 'beermaverick-nelson-sauvin']]) {
  const v = CH.varietes[k]; if (!v || !v.huile) continue;
  const vals = v.huile.valeurs.filter((x) => x.plage && x.plage[0] != null && x.plage[1] != null);
  HOP[nom].huileH = { min: Math.min(...vals.map((x) => x.plage[0])), max: Math.max(...vals.map((x) => x.plage[1])), src: [...new Set(vals.flatMap((x) => x.sources))].join(', ') };
}
// Thiols libres (4MMP, µg/kg), Schmidt 2024 [H11], tels que H les a relevés.
export const MMP4 = { Citra: { txt: '10–38', src: 'H11', note: 'le plus haut des 97 variétés' }, Cascade: { txt: '2,4–3,8', src: 'H11' }, Galaxy: { txt: '> 10', src: 'H11' }, 'Idaho 7': { txt: '< 10', src: 'H11', note: 'à confirmer' } };

// ---------- les études publiées (comparatifs-dryhop.json) ----------
const CD = lire(E1 + '/fils21-choisir/donnees/comparatifs-dryhop.json');
export const ETUDES = Object.fromEntries(CD.etudes.map((e) => [e.id, e]));
const court = (e) => { const m = e.ref.match(/^([^,]+?)\s+[A-Z]{1,3}[,.]/); const an = (e.ref.match(/(19|20)\d\d/) || [''])[0]; return (m ? m[1] : e.ref.split(' ')[0]) + ' ' + an; };
export const refCourte = (id) => court(ETUDES[id]);
// Une mesure d'étude, avec ce qui doit se voir : « à vérifier », « lu sur figure ».
export function mesureEtude(id, test) {
  const e = ETUDES[id], m = e.mesures.find(test); if (!m) return null;
  const t = (m.note || '') + ' ' + (m.lecture || '');
  return { ...m, etude: id, ref: court(e), niveau: e.niveau, url: e.url, aVerifier: /à vérifier|aplati/i.test(t), figure: /figure/i.test(m.lecture || '') && !/non lue/i.test(m.lecture || ''), conditions: e.conditions };
}

// ---------- H, le moteur pouvoir aromatique, les vérifications ----------
export { H, CH };
const F19 = E1 + '/fils19-choix/donnees/';
export const VERIFS = lire(F19 + 'verifications.json').verifications;
export const MOTEUR = (f) => lire(F19 + f);
const IDX = lire(F19 + 'index.json');
// IBU de Citra et Cascade à 4 g/L, moment par moment (moteur, recette 16D S1).
export const IBU = {};
for (const l of IDX.resume) { const m = l.match(/^\s+(60′|10′|whirlpool) ; IBU Citra ([\d,]+) \(α ([\d,]+) %\), Cascade ([\d,]+)/); if (m) IBU[m[1]] = { citra: m[2], cascade: m[4], alphaCitra: m[3] }; }
export const RESUME = IDX.resume;
// Lecture du moteur, cas par cas : { compose: { min, max, central, auMoins, classe } }.
export function rapports(fichier) {
  const P = MOTEUR(fichier).pouvoir;
  return Object.fromEntries(P.pouvoir.composes.map((c) => [c.nom, { ...(c.lecture && c.lecture.facteur ? c.lecture.facteur : {}), classe: c.lecture ? c.lecture.classe : 'inconnu', texte: c.lecture ? c.lecture.texte : '' }]));
}
export const NIVEAU = { P: 'publié, à comité de lecture', S: 'secondaire : congrès, thèse, diapositives', F: 'fiche de fabricant', H: 'calcul du dépôt' };
