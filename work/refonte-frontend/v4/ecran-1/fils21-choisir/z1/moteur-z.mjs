// Lot 21 · série z · le profil simulé VRAI (fils21-choisir/donnees/profils-simules.json, moteur
// profil-simule.ts, note PROFIL-SIMULE.md), compacté pour les pages : la grille des houblons seuls
// (houblon × moment × dose 1/2/4/8 × jours 1–7 × US-05/Pomona), les paires (2 + 2 g/L, 3 j, trois
// levures), les cas K3 et K4 (enchaînements, quatre levures, jour par jour), l'avant de ma bière, les
// IBU des cas K1. Aucune valeur n'est recalculée ici : un agencement absent de la grille est dit
// « non simulé », jamais inventé. Les pages chargent DATA_JS puis MOTEUR_JS (navigateur et Node).
import fs from 'node:fs';
const D21 = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils21-choisir';
export const PS = JSON.parse(fs.readFileSync(D21 + '/donnees/profils-simules.json', 'utf8'));
const r1 = (x) => Math.round(x * 10) / 10;
export const HID = { 'beermaverick-citra': 'Citra', 'beermaverick-cascade': 'Cascade', 'beermaverick-galaxy': 'Galaxy', 'beermaverick-idaho-7': 'Idaho 7' };
export const LID = { 'fermentis-us05': 'US-05', 'lalbrew-pomona': 'Pomona', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-diamond': 'Diamond' };
const F = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const ORD = Object.keys(HID).map((k) => HID[k]);
const fam = (a) => (Array.isArray(a) ? [r1(a[0]), r1(a[1]), r1(a[2]), a[3], a[5] ? 1 : 0] : [r1(a.bas), r1(a.centre), r1(a.haut), a.crans, a.hautPartiel && a.hautPartiel.length ? 1 : 0]);
const prof = (o) => Object.fromEntries(F.map((f) => [f, fam(o[f])]));
const delta = (o) => Object.fromEntries(F.map((f) => [f, r1(typeof o[f] === 'number' ? o[f] : o[f].centre)]));
const txt = (s) => (typeof s === 'string' && s.startsWith('§') && PS.textes[s] ? PS.textes[s] : s);
const sig = (ajouts) => ajouts.map((a) => (HID[a.houblon] || a.nom) + ':' + a.moment + ':' + a.dose_gL + ':' + (a.jours == null ? '' : a.jours) + ':' + (a.jourDebut == null ? '' : a.jourDebut)).sort().join('|') + '|' + LID[ajouts[0].levure];

const GRILLE = {};
for (const e of PS.grille) { const h = HID[e.houblon]; if (!h) continue; GRILLE[h + '|' + e.moment + '|' + e.dose_gL + '|' + (e.jours == null ? '' : e.jours) + '|' + LID[e.levure]] = { p: prof(e.apres), c: e.confiance, dr: e.drapeaux }; }
const PAIRES = {};
for (const e of PS.grillePaires) { const ns = e.houblons.map((k) => HID[k]); if (ns.some((x) => !x)) continue; const [A, B] = ns.slice().sort((a, b) => ORD.indexOf(a) - ORD.indexOf(b)); PAIRES[A + '+' + B + '|' + e.moment + '|' + LID[e.levure]] = { p: prof(e.apres), ap: Object.fromEntries(e.houblons.map((k) => [HID[k], delta(e.apports[k])])), seuls: e.seuls ? Object.fromEntries(Object.keys(e.seuls).map((k) => [HID[k], delta(e.seuls[k])])) : null, fs: e.facteurSaturation, c: e.confiance, dr: e.drapeaux }; }
const CAS = {};
const IBU = {};
for (const c of PS.cas) {
  for (const m of c.mesures || []) if (m.type === 'ibu' && c.ajouts.length === 1) IBU[HID[c.ajouts[0].houblon] + '|' + c.ajouts[0].moment + '|' + c.ajouts[0].dose_gL] = { min: r1(m.plage.min), max: r1(m.plage.max), central: r1(m.valeur), src: 'moteur pouvoir, α des fiches ; ' + String(txt(m.texte) || txt(m.base) || '').slice(0, 80) };
  if (!/^K[34]/.test(c.id)) continue;
  if (CAS[sig(c.ajouts)] && CAS[sig(c.ajouts)].pj.length) continue;
  CAS[sig(c.ajouts)] = { id: c.id, titre: c.titre, p: prof(c.apres), d: delta(c.delta), pj: (/^K3/.test(c.id) ? c.parJour || [] : []).map((j) => ({ jour: j.jour, jr: j.jourRecette, p: prof(j.familles) })), c: c.confiance.niveau, cp: (c.confiance.pourquoi || []).map(txt), dr: c.drapeaux.map((d) => d.id), hors: (c.drapeaux.find((d) => d.id === 'hors-du-style') || {}).familles || [], ap: Object.fromEntries((c.apportsParHoublon || []).map((a) => [HID[a.houblon], { seul: delta(a.seul), apport: delta(a.apport) }])), fs: c.saturation && c.saturation.facteur, bio: c.biotransformation ? { actif: c.biotransformation.actif, gc: c.biotransformation.geraniolCitronellol, th: c.biotransformation.rendementThiolsPct, par: (c.biotransformation.parAjout || []).map((x) => ({ ajout: x.ajout, cit: x.citronellol_ugL && r1(x.citronellol_ugL.centre), citH: x.citronellol_ugL && r1(x.citronellol_ugL.haut), th: x.thiolsLiberes_ngL && r1(x.thiolsLiberes_ngL.centre), thH: x.thiolsLiberes_ngL && r1(x.thiolsLiberes_ngL.haut), raison: txt(x.raison) })) } : null };
}
const AVANT = prof(PS.biere.avant);
export const DATA = { AVANT, GRILLE, PAIRES, CAS, IBU, DOSES: [1, 2, 4, 8], JOURS: [1, 2, 3, 5, 7], MENTION: PS.mention, DEGUSTATION: PS.biere.degustation.citation, STYLE: { attendu: PS.style.attendu, citation: PS.style.citation } };
export const DATA_JS = 'var DATA = ' + JSON.stringify(DATA) + ';\n';

// Le moteur de lecture : il résout un agencement d'ajouts vers la grille, une paire ou un cas ; sinon « non simulé ».
export const MOTEUR_JS = String.raw`
var MOTEUR = (function () {
  var F = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
  var NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
  var COURT = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
  var B55 = { floral: 1, herbal: 1, earthy: 1 };
  function bande(f) { return B55[f] ? [0, 55] : [0, 30]; }
  function cran(f) { var b = bande(f); return Math.max(15, b[1] - b[0]) / 3; }
  var MOMENT = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };
  var MOMENT_COURT = { b60: '60′', b10: '10′', wp: 'WP', dryActive: 'DH actif', dryPost: 'DH après' };
  var LEVURES = ['US-05', 'Verdant', 'Pomona', 'Diamond'];
  var ORD = ['Citra', 'Cascade', 'Galaxy', 'Idaho 7'];
  var BIO = {
    'US-05': { mot: 'géraniol → citronellol 0 au centre (jusqu’à 87 %)', detail: 'Fermentis ne publie pas de biotransformation ; le moteur garde 0 au centre et 87 % au plus haut (H41) ; thiols libérés : 0', nature: 'simule' },
    Verdant: { mot: '~ thiols libérés 0,1 % (0,01–0,35 %)', detail: 'Lallemand : β-lyase « high / medium », qualitatif ; le moteur libère 0,1 % des précurseurs [convention H42] ; géraniol 0 au centre', nature: 'simule' },
    Pomona: { mot: '~ géraniol → citronellol 50 % (jusqu’à 87 %)', detail: 'Lallemand : terpènes « medium », citronellol produit depuis le géraniol (H41) : du floral glisse vers les agrumes ; thiols : 0', nature: 'simule' },
    Diamond: { mot: '~ thiols libérés 0,1 % (0,01–0,35 %)', detail: 'même convention que Verdant ; Samia : Diamond produit le plus de thiols mesurés mais le fruité perçu le plus faible (écrit, pas simulé)', nature: 'simule' }
  };
  var DR = {
    'amertume': { titre: 'à 60′ : surtout de l’amertume', sens: 'l’arôme y est peu chiffré ; le centre à chaud vaut le dixième de la borne haute [convention]', src: 'H §8.2 ; Kishimoto 2008' },
    'hors-du-style': { titre: 'sort du style 16D (simulé)', sens: 'le style attend un arôme de houblon faible et facultatif : terreux, herbacé ou floral', src: 'BJCP 2021' },
    'saturation': { titre: 'saturation vers 4–8 g/L à cru', sens: 'agrumes plafonnent à 8 g/L, herbacé monte ; preuve : Cascade seule, 24 h', src: 'Lafontaine 2018' },
    'saturation-partagee': { titre: 'saturation partagée : la dose totale compte', sens: 'les ajouts s’additionnent avant la courbe : ensemble, moins que la somme de chacun seul', src: 'Lafontaine 2018 ; H' },
    'ordre': { titre: 'ordre des ajouts : inconnu', sens: 'aucune étude ; le moteur additionne', src: 'H §7.3' },
    'synergie': { titre: 'synergie : inconnue', sens: 'effets additifs ou synergiques en mélange modèle, aucune pondération transposable', src: 'Takoi 2016 ; Lafontaine 2019' },
    'masquage': { titre: 'masquage : inconnu', sens: 'par un autre houblon ou par la bière noire : aucune étude', src: 'H' },
    'hop-creep': { titre: 'hop creep possible', sens: 'levure vivante au contact du houblon : refermentation, diacétyle', src: 'Kirkpatrick 2018 ; Klimczak 2023' },
    'geraniol-citronellol': { titre: 'géraniol → citronellol', sens: 'le floral peut glisser vers les agrumes en fermentation active ; après fermentation, non documenté', src: 'Takoi 2011 ; Svedlund 2022' },
    'biere-noire': { titre: 'perception en bière noire : non documentée', sens: 'aucun seuil mesuré dans une stout ; pars de ta dégustation', src: 'H §8.3' },
    'duree': { titre: 'au-delà de 3 j : rien de plus à l’arôme', sens: 'l’essentiel est extrait en 24 h ; végétal et hop creep possibles, non chiffrés', src: 'Wolfe 2012 ; Schmidt 2019' }
  };
  function r1(x) { return Math.round(x * 10) / 10; }
  // Un tableau [bas, centre, haut, crans, hautPartiel] → la famille lisible.
  function lire(f, a) {
    var b = bande(f), c = (a[1] - b[0]) / cran(f), inc = a[1] === 0 && a[2] === 0;
    return { f: f, bas: a[0], centre: a[1], haut: a[2], crans: a[3], c: r1(c), cHaut: r1((a[2] - b[0]) / cran(f)), hp: !!a[4], inc: inc, hors: a[1] > b[1], basNul: a[0] === 0 };
  }
  function profil(p) { var o = {}; F.forEach(function (f) { o[f] = lire(f, p[f]); }); return o; }
  function estDry(m) { return m === 'dryActive' || m === 'dryPost'; }
  function doseCru(ajouts) { var t = 0; ajouts.forEach(function (a) { if (a && estDry(a.moment)) t += a.dose_gL || 0; }); return t; }
  function sig(ajouts) { return ajouts.map(function (a) { return a.houblon + ':' + a.moment + ':' + a.dose_gL + ':' + (a.jours == null ? '' : a.jours) + ':' + (a.jourDebut == null ? '' : a.jourDebut); }).sort().join('|') + '|' + ajouts[0].levure; }
  // La résolution : avant, grille (un houblon), paire (deux ensemble, 2 + 2 g/L, 3 j), cas K3/K4 (l'un après l'autre) ; sinon raison.
  function resoudre(ajouts) {
    ajouts = (ajouts || []).filter(function (a) { return a && a.houblon; });
    var lev = ajouts.length ? ajouts[0].levure || 'US-05' : 'US-05';
    if (!ajouts.length) return { profil: profil(DATA.AVANT), source: 'avant', confiance: 'dégustation', drapeaux: ['biere-noire'], ibu: null };
    if (ajouts.length === 1) {
      var a = ajouts[0], k = a.houblon + '|' + a.moment + '|' + a.dose_gL + '|' + (estDry(a.moment) ? a.jours : '') + '|' + lev, g = DATA.GRILLE[k];
      if (!g) return { profil: null, raison: (lev === 'US-05' || lev === 'Pomona' ? 'hors de la grille (doses 1, 2, 4, 8 g/L ; 1, 2, 3, 5, 7 j)' : lev + ' : non simulée pour un houblon seul (grille : US-05, Pomona)'), source: 'aucune' };
      var dr = g.dr.slice(); if (a.jours > 3) dr.push('duree');
      return { profil: profil(g.p), source: 'grille', confiance: g.c, drapeaux: dr, ibu: DATA.IBU[a.houblon + '|' + a.moment + '|' + a.dose_gL] || null };
    }
    if (ajouts.length === 2) {
      var x = ajouts[0], y = ajouts[1];
      if (x.moment === y.moment && estDry(x.moment) && (x.jourDebut == null || y.jourDebut == null || x.jourDebut === y.jourDebut)) {
        var ns = [x.houblon, y.houblon].sort(function (p, q) { return ORD.indexOf(p) - ORD.indexOf(q); });
        if (x.houblon === y.houblon) return { profil: null, raison: 'deux fois le même houblon : règle sa dose plutôt', source: 'aucune' };
        if (!(x.dose_gL === 2 && y.dose_gL === 2 && x.jours === 3 && y.jours === 3)) return { profil: null, raison: 'paire simulée seulement à 2 + 2 g/L et 3 j', source: 'aucune' };
        var pk = ns[0] + '+' + ns[1] + '|' + x.moment + '|' + lev, pr = DATA.PAIRES[pk];
        if (!pr) return { profil: null, raison: lev + ' : paire non simulée (US-05, Pomona, Verdant)', source: 'aucune' };
        return { profil: profil(pr.p), source: 'paire', confiance: pr.c, drapeaux: pr.dr, apports: pr.ap, seuls: pr.seuls, facteur: pr.fs, ibu: null };
      }
      var cs = DATA.CAS[sig(ajouts)];
      if (cs) return { profil: profil(cs.p), delta: cs.d, source: 'cas', cas: cs, confiance: cs.c, confiancePourquoi: cs.cp, drapeaux: cs.dr.concat(ajouts.some(function (a) { return a.jours > 3; }) ? ['duree'] : []), apports: cs.ap, facteur: cs.fs, parJour: cs.pj, bio: cs.bio, ibu: null };
      return { profil: null, raison: 'enchaînement non simulé : seuls Citra 2 g/L 3 j puis Galaxy 2 g/L 7 j, et Citra 2 g/L 3 j puis Idaho 7 2 g/L 5 j (quatre levures, actif ou après)', source: 'aucune' };
    }
    return { profil: null, raison: 'trois ajouts et plus : non simulé', source: 'aucune' };
  }
  function levuresDispo(ajouts) { return LEVURES.filter(function (l) { var r = resoudre(ajouts.map(function (a) { var b = {}; for (var k in a) b[k] = a[k]; b.levure = l; return b; })); return !!r.profil; }); }
  function horsStyle(p) { return F.filter(function (f) { return p[f].hors; }); }
  var ORDRE_DR = ['hors-du-style', 'amertume', 'saturation-partagee', 'saturation', 'duree', 'ordre', 'synergie', 'masquage', 'hop-creep', 'geraniol-citronellol', 'biere-noire'];
  function drapeauxLisibles(ids) {
    var out = [];
    (ids || []).forEach(function (id) { if (DR[id] && !out.some(function (o) { return o.id === id; })) { var d = DR[id]; out.push({ id: id, titre: d.titre, sens: d.sens, src: d.src }); } });
    return out.sort(function (a, b) { return ORDRE_DR.indexOf(a.id) - ORDRE_DR.indexOf(b.id); });
  }
  return { F: F, NOM: NOM, COURT: COURT, bande: bande, cran: cran, MOMENT: MOMENT, MOMENT_COURT: MOMENT_COURT, LEVURES: LEVURES, BIO: BIO, DR: DR, ORD: ORD, DOSES: DATA.DOSES, JOURS: DATA.JOURS, AVANT: DATA.AVANT, resoudre: resoudre, levuresDispo: levuresDispo, horsStyle: horsStyle, doseCru: doseCru, drapeauxLisibles: drapeauxLisibles, profil: profil, estDry: estDry, r1: r1 };
})();
`;
