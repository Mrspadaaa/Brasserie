// Lot 21 · socle commun de r1 (le verre), r2 (la frise) et r3 (la carte).
// Repris de la baseline l8g (fils18-baseline/l8g) : pictos au trait (ton texte, crayon léger), fiche g1 à
// l'appui long (500 ms) ou au survol long, lentille au style / absolu, habillage. Ajouté ici :
//   - les données côté page : profils simulés du moteur (fils21-choisir/donnees/profils-simules.json), vraies valeurs (α du lot c2, huile et composés de
//     composes-houblon.json, 29 lots de Cascade, comparatifs-dryhop.json) et leurs sources ;
//   - la source au toucher : toute vraie valeur ([data-nature="mesure"]) dit d'où elle vient en une ligne ;
//   - la feuille de détail commune, la légende derrière « ? ».
import fs from 'node:fs';
import { REPO, JET, ORDRE, NOM, COURT, symboles, CSS_FAMILLES, CSS_FICHE, runtime, FICHES, ecrire } from '../../fils18-baseline/l8g/noyau.mjs';
import { CSS as HABILLAGE } from '../../fils18-baseline/l8g/habillage.mjs';
import { EXTRA, net } from '../../fils18-baseline/l8g/pictos-trait.mjs';

export { REPO, JET, ORDRE, NOM, COURT, ecrire };
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const E1 = REPO + '/work/refonte-frontend/v4/ecran-1';
export const D21 = E1 + '/fils21-choisir';
const VRAI = D21 + '/donnees/profils-simules.json';
export const SIM = lire(VRAI);
export const SOURCE_SIM = 'fils21-choisir/donnees/profils-simules.json (moteur profil-simule)';
const CH = lire(REPO + '/prototypes/houblons-v4/data/composes-houblon.json');
const C2 = lire(E1 + '/fils15-s5-complexe/donnees/c2.json');
const C13 = ['c1', 'c3'].map((k) => lire(E1 + '/fils15-s5-complexe/donnees/' + k + '.json'));
const PF = lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const SB = lire(REPO + '/prototypes/houblons-v4/data/style-bands.json');
const COMP = lire(D21 + '/donnees/comparatifs-dryhop.json');
const LOTS = lire(REPO + '/src/data/hopStudies/lafontaine2018.cascade2015.json');

export const HOPS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade'];
export const CLE = { Citra: 'Citra cryo', Galaxy: 'Galaxy', 'Idaho 7': 'Idaho 7', Cascade: 'Cascade', Motueka: 'Motueka', 'Nelson Sauvin': 'Nelson Sauvin', Nugget: 'Nugget' };
const VAR = { Citra: 'beermaverick-citra', Galaxy: 'beermaverick-galaxy', 'Idaho 7': 'beermaverick-idaho-7', Cascade: 'beermaverick-cascade', Motueka: 'beermaverick-motueka', 'Nelson Sauvin': 'beermaverick-nelson-sauvin', Nugget: 'beermaverick-nugget' };

// ---------- les pictos au trait de l8g (ton texte des jetons, crayon léger, trait rendu de 1,6 px) ----------
const SYM = {};
for (const m of fs.readFileSync(E1 + '/fils17-standard/v3/planche.html', 'utf8').matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
export const SYMB = symboles({ trait: 1.5, tailles: [12, 14, 16, 18, 20] })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${JET[f].texte}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYM[f])}</g></symbol>`)
  .replace('</svg>', '<defs>' + CRAYON + '</defs></svg>');

// ---------- la fiche g1 (comme ficheDe de l8g, sur c2 qui porte tous nos houblons) ----------
const FC2 = {}; for (const C of [C2, ...C13]) for (const v of C.voies) for (const h of v.fiches || []) if (!FC2[h.houblon]) FC2[h.houblon] = { ...h, stock: v.stock };
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
function ficheDe(nom) {
  const c = FC2[nom], f = PF.find((x) => x.name === nom);
  const role = c && c.role ? { v: c.role, src: /^fournisseur/.test(c.roleSource || '') ? 'fournisseur' : 'règle', txt: c.roleSource } : null;
  const de = f.alpha && f.alpha.retenu ? f.alpha.retenu.from : null, comp = (f.huiles && f.huiles.composants) || {};
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  return { nom, role, voie: null, stock: c ? c.stock : null, ajout: null, alphaC1: (c && c.alpha) || null, origine: f.origin || null,
    alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc), lot: de === 'fiche de stock' || de === 'lu sur l’article' ? f.alpha.retenu.value : null,
    beta: ((f.beta && f.beta.sources) || []).map(plageSrc), huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
    aromes: (f.aromes || []).filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: ((f.aromes || [])[0] || {}).of || 0, sans: uniq((f.motsSansFamille || []).map((s) => s.mot)),
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
    subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [], subsRaison: f.substitutsRaison || null };
}
const FD = Object.fromEntries(Object.values(CLE).map((n) => [n, ficheDe(n)]));
// Le script de l8g, avec nos fiches à la place de celles de c1, et sans les objectifs de c1 (« demande »).
export const RUNTIME = runtime().replace(JSON.stringify(FICHES), JSON.stringify(FD)).replace(/DEMANDE = \[[^\]]*\]/, 'DEMANDE = []');

// ---------- les vraies valeurs, par houblon ----------
const env = (vals) => { const lo = vals.map((v) => v.plage[0]).filter((x) => x != null), hi = vals.map((v) => v.plage[1]).filter((x) => x != null);
  return { min: lo.length ? Math.min(...lo) : null, max: hi.length ? Math.max(...hi) : null, src: [...new Set(vals.flatMap((v) => v.sources))] }; };
const compose = (h, k) => { const x = CH.varietes[VAR[h]].composes[k]; if (!x || !x.valeurs || !x.valeurs.length) return { inconnu: (x && (x.raison || x.inconnu)) || 'non publié' }; const e = env(x.valeurs); return { ...e, texte: x.valeurs[0].texte || null }; };
export const VRAIES = Object.fromEntries([...HOPS, 'Motueka', 'Nelson Sauvin', 'Nugget'].map((h) => {
  const c = FC2[CLE[h]];
  return [h, { cle: CLE[h], alpha: c.alpha, role: c.role, roleSource: c.roleSource, stock: c.stock, fiches: Math.max(...c.familles.map((x) => x.sur)),
    huile: env(CH.varietes[VAR[h]].huile.valeurs), huileCryo: h === 'Citra' ? env(CH.varietes['beermaverick-citra:cryo'].huile.valeurs) : null,
    m4: compose(h, '4MMP'), linalol: compose(h, 'linalol'), geraniol: compose(h, 'geraniol') }];
}));
const srcTitre = (k) => { const s = CH.sources[k]; return s ? s.titre + (s.annee ? '' : '') : k === 'H' ? 'Rapport H du dépôt (recherche/H-choisir-deux-houblons.md)' : k; };
export const SOURCES = Object.fromEntries(Object.keys(CH.sources).map((k) => [k, { t: CH.sources[k].titre, n: CH.sources[k].niveau }]));
SOURCES.H = { t: 'Rapport H du dépôt (recherche/H-choisir-deux-houblons.md)', n: 'H' };
SOURCES.recette = { t: 'Ton scénario : dose et jours que tu règles', n: 'recette' };
SOURCES.c2 = { t: 'Lot en stock (fils15-s5-complexe/donnees/c2.json : voies[].fiches[].alpha)', n: 'lot' };
SOURCES.lots = { t: LOTS.source.author + ' ' + LOTS.source.year + ', ' + LOTS.source.title + ' (tableau S6)', n: 'P' };
for (const e of COMP.etudes) SOURCES[e.id] = { t: e.ref, n: e.niveau };
export { srcTitre };

// Les comparatifs en bière (comparatifs-dryhop.json) qui servent nos houblons : E06 (Citra en bière),
// E04 (dose, Cascade), E05 / E08 / E10 (durée), E03 (Idaho 7, au pitch), E07 (moment, qualitatif).
const E = Object.fromEntries(COMP.etudes.map((e) => [e.id, e]));
const m = (id, pred) => E[id].mesures.filter(pred);
export const COMPARATIFS = {
  E06: { id: 'E06', niveau: E.E06.niveau, lecture: 'diapositive 17', cond: 'dry hop, dose et durée non indiquées', linalol: m('E06', (x) => x.compose === 'linalol').map((x) => ({ v: x.variete, val: x.valeur, ec: x.ecart ?? null })),
    myrcene: m('E06', (x) => x.compose === 'myrcène').map((x) => ({ v: x.variete, val: x.valeur })) },
  E04: { id: 'E04', niveau: E.E04.niveau, doses: [0, 2, 3.86, 8, 16], extrait: '23 % à 2 g/L, 7 % à 16 g/L' },
  E08: { id: 'E08', niveau: E.E08.niveau, texte: 'Eureka!, 2,5 g/L : l’essentiel passe en 2 jours (4MMP, linalol, géraniol)' },
  E10: { id: 'E10', niveau: E.E10.niveau, texte: 'Cascade, 1,43 g/L : aucune différence perçue entre 1 h et 96 h (bière jeune)' },
  E05: { id: 'E05', niveau: E.E05.niveau, texte: 'Cascade, 3,86 g/L : linalol extrait 43 % au repos, 89 % agité, dès 6 h' },
  E03: { id: 'E03', niveau: E.E03.niveau, texte: 'Idaho 7 au pitch (co-fermentation) : linalol 38 µg/L, myrcène 85 µg/L (à vérifier)' },
  E07: { id: 'E07', niveau: E.E07.niveau, texte: 'Simcoe et Hallertau, 1,5 g/L : 60′, whirlpool et dry hop donnent des profils différents ; herbacé lié à l’ébullition' },
  trous: ['Aucune étude lue ne mesure Citra contre Cascade en bière à dose égale.', 'Galaxy : aucune comparaison chiffrée en bière.', 'Idaho 7 : une seule étude, au pitch, pas en dry hop.', 'Aucune mesure qui croise variété, levure et dry hop.'],
};
export const LOTS_CASCADE = { valeurs: LOTS.rows.map((r) => r[2]), echelle: [0, 15], dose: 3.86, heures: 24 };

// ---------- les faits sourcés (composes-houblon.json), indépendants de la simulation ----------
const DUR = CH.duree, SAT = CH.saturation, AS = CH.ajoutsSuccessifs;
export const FAITS = {
  moment60: { t: 'À 60′, presque tout part : l’amertume reste.', d: 'Le 4MMP perd 91 % en 60 min à 100 °C ; un ajout plus long n’en garde pas plus qu’un ajout tardif.', s: ['H13', 'H'] },
  tardif: { t: 'Ajout tardif : 60–63 % du linalol retrouvé.', d: 'Part retrouvée en bière du linalol d’un ajout en fin d’ébullition ou au whirlpool.', s: ['H30'] },
  essentiel24h: { t: 'L’essentiel est extrait en 24 h.', d: DUR.essentiel24h.texte, s: DUR.essentiel24h.sources },
  thiols2j: { t: 'Les thiols passent surtout les 2 premiers jours.', d: DUR.thiols.texte, s: DUR.thiols.sources },
  plafond3j: { t: 'Au-delà de 3 j : aucun gain d’arôme mesuré.', d: DUR.auDela.texte, s: DUR.auDela.sources },
  vegetal: { t: 'Végétal : aucune donnée selon le temps ; lié à la dose.', d: DUR.vegetal.texte, s: DUR.vegetal.sources },
  saturation: { t: 'Zone 4–8 g/L : les agrumes plafonnent, l’herbacé monte.', d: SAT.texte + ' Portée : ' + SAT.portee + '.', s: SAT.sources },
  hopCreep: { t: 'Levure vivante : hop creep.', d: 'Exige une levure vivante. 10 g/L, 7 j, levure ale : +0,92 % vol. (T-90), +1,05 (cryo) ; Cascade et Citra parmi les plus forts ; Galaxy et Idaho 7 non trouvés.', s: ['H68'] },
  ordre: { t: 'Ordre des ajouts : aucune étude.', d: AS.ordre.texte, s: AS.ordre.sources },
  synergie: { t: 'Synergie et masquage : inconnus.', d: AS.synergie.texte + ' ' + AS.masquage.texte, s: [...AS.synergie.sources, ...AS.masquage.sources] },
  co2: { t: 'Fermentation active : le CO₂ emporte le myrcène.', d: CH.transferts.fermentationActive.texte, s: CH.transferts.fermentationActive.sources || ['H33'] },
  biereNoire: { t: 'Perception en bière noire non documentée.', d: CH.biereNoire.texte, s: CH.biereNoire.sources },
  cryo: { t: 'Ton lot est du cryo : huile 2–6 mL/100 g.', d: 'Fiche Yakima Chief, onglet Cryo : 2–6 mL/100 g, contre 1–3 en T-90. Le moteur ne simule pas le cryo (composés inconnus) : il lit le Citra T-90.', s: ['H1'] },
};

// ---------- les profils simulés du moteur, compactés pour la page ----------
// Formats du moteur : grille[] et parJour[] en tableaux [bas, centre, haut, crans, largeur, hautPartiel]
// (formatGrille) ; cas[].apres et biere.avant en objets. Page : [centre, bas, haut, hautPartiel 0/1].
const TX = SIM.textes || {};
export const txt = (x) => (typeof x === 'string' && TX[x] ? TX[x] : x);
export const FAM = SIM.familles.map((f) => (typeof f === 'string' ? f : f.id));
export const LEV = { 'fermentis-us05': 'US-05', 'lalbrew-pomona': 'Pomona', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-diamond': 'Diamond' };
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const pkA = (a) => [r1(a[1]), r1(a[0]), r1(a[2]), a[5] ? 1 : 0];
const pkO = (o) => [r1(o.centre), r1(o.bas), r1(o.haut), o.hautPartiel && o.hautPartiel.length ? 1 : 0];
const pkP = (p) => FAM.map((f) => (Array.isArray(p[f]) ? pkA(p[f]) : pkO(p[f])));
export const grilleCle = (h, m, d, j, l) => [h, m, d, j == null ? '-' : j, l].join('|');
const plg = (p) => (p ? [p.min ?? null, p.max ?? null, p.central ?? null] : null);
function mesuresDe(c) {
  return c.mesures.map((m) => ({ ty: m.type, h: m.houblon, co: txt(m.nom || m.compose) || null, fa: m.famille || null, v: m.valeur ?? null, ec: m.ecart ?? null, u: txt(m.unite), p: plg(m.plage),
    cc: m.concentration && m.concentration.plage ? [...plg(m.concentration.plage), m.concentration.unite] : null,
    rp: m.rapport && m.rapport.plage ? plg(m.rapport.plage) : null, rpi: m.rapport && m.rapport.inconnu ? txt(m.rapport.inconnu) : null,
    rl: m.rapport ? txt(m.rapport.lecture) : null, d: m.dose_gL ?? null, t: txt(m.texte) || null, b: txt(m.base) || null, n: m.niveau || null, s: m.source || [] }));
}
const drap = (d) => ({ id: d.id, t: txt(d.titre), st: txt(d.statut), d: txt(d.pourquoi), s: d.sources || [], fa: d.familles || null });
export function donnees({ cas = () => false, parJour = false, mesures = true } = {}) {
  const G = {};
  for (const g of SIM.grille || []) G[grilleCle(g.nom, g.moment, g.dose_gL, g.jours, LEV[g.levure] || g.levure)] = { p: pkP(g.apres), cf: g.confiance, dr: (g.drapeaux || []).map((d) => (typeof d === 'string' ? d : d.id)) };
  const GP = {};
  for (const g of SIM.grillePaires || []) {
    const v = { p: pkP(g.apres), cf: g.confiance, fs: g.facteurSaturation, noms: g.noms, seuls: Object.fromEntries(Object.entries(g.seuls || {}).map(([k, x]) => [k, FAM.map((f) => r1(x[f]))])), dr: (g.drapeaux || []).map((d) => (typeof d === 'string' ? d : d.id)) };
    for (const k of [g.noms.join('+'), g.noms.slice().reverse().join('+')]) GP[[k, g.moment, LEV[g.levure] || g.levure].join('|')] = v;
  }
  const CAS = {};
  for (const c of SIM.cas.filter(cas)) CAS[c.id] = { titre: c.titre, groupe: c.groupe, lev: LEV[c.levure] || c.levure,
    ajouts: c.ajouts.map((a) => ({ houblon: a.nom, dose_gL: a.dose_gL, moment: a.moment, jourDebut: a.jourDebut == null ? null : a.jourDebut - c.ajouts[0].jourDebut, jours: a.jours, lev: LEV[a.levure] || a.levure })),
    p: pkP(c.apres), dr: c.drapeaux.map(drap), cf: { n: c.confiance.niveau, t: (c.confiance.pourquoi || []).map(txt) }, m: mesures ? mesuresDe(c) : [],
    bio: c.biotransformation || null, sat: c.saturation ? { dose: c.saturation.doseTotale_gL, zone: c.saturation.zone, f: c.saturation.facteur, t: txt(c.saturation.texte) } : null,
    j: parJour ? (c.parJour || []).map((x) => [x.jour - (c.parJour[0] ? c.parJour[0].jour : 0), pkP(x.familles)]) : null };
  const Z = SIM.style.zone;
  const AN = Object.fromEntries(['16D', '18B', '21A', '21C'].map((k) => [k, { nom: SB.styles[k].name, z: FAM.map((f) => SB.styles[k].families[f].band[1]) }]));
  const srcs = { ...SOURCES }; for (const [k, v] of Object.entries(SIM.sources || {})) if (!srcs[k]) srcs[k] = { t: v.titre, n: v.niveau };
  return { sourceSim: SOURCE_SIM, FAM, NOM, COURT, TON: Object.fromEntries(FAM.map((f) => [f, JET[f]])),
    B16: Object.fromEntries(FAM.map((f) => [f, Z[f].bande])), ST16: Object.fromEntries(FAM.map((f) => [f, Z[f].statut])), citation: SIM.style.citation,
    AN, avant: pkP(SIM.biere.avant), avantSrc: Object.fromEntries(FAM.map((f) => [f, SIM.biere.avant[f].source])), degust: SIM.biere.degustation ? { c: SIM.biere.degustation.citation, d: SIM.biere.degustation.date } : null,
    G, GP, CAS, DR: FAITS, V: VRAIES, CLE, SOURCES: srcs, COMP: COMPARATIFS, LOTS: LOTS_CASCADE, mention: SIM.mention };
}

// ---------- la page ----------
export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">';
export const CSS_BASE = `
  ${CSS_FAMILLES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background-color: var(--page); color: var(--encre); }
  body { font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button, a { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-decoration: none; }
  svg { display: block; flex: none; overflow: visible; }
  svg.pi { color: var(--t); }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 40px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .mono, .al, .mv b { font-family: var(--mono); }
  .barre { display: flex; align-items: center; gap: 8px; min-height: 36px; }
  .titre { font-size: 18px; font-weight: 700; }
  .biere { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); }
  .biere .hn { font-size: 12px; font-weight: 600; color: var(--encre); }
  .barre .seg { margin-left: auto; }
  .seg { display: flex; }
  .seg button { height: 28px; padding: 0 10px; font-size: 12px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .leg-b { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--gris); position: relative; }
  .leg-b[aria-expanded="true"] { z-index: 32; background: #fff; color: var(--encre); box-shadow: 0 0 0 2px var(--encre); }
  .doigt { display: none; }
  .hn { font-weight: 700; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; text-decoration: underline dotted 1.5px; text-decoration-color: #9a9aa6; text-underline-offset: 3px; }
  .al { display: inline-flex; align-items: center; gap: 2px; font: 600 12px/1 var(--mono); color: var(--encre); }
  .al.lot::before { content: 'α'; font: 400 12px var(--sans); color: var(--gris); margin-right: 1px; }
  .al.fi { font-weight: 400; color: var(--gris); }
  .al .ic { color: var(--gris); }
  .al .pel { font: 400 12px var(--sans); margin-left: 3px; }
  .us { display: inline-flex; align-items: center; }
  .us-mot { font-size: 12px; font-weight: 600; color: var(--encre); } .us-mot.deduit { font-weight: 400; color: var(--gris); }
  .f-ab { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; } .f-note { flex-basis: 100%; order: 9; font-size: 12px; color: var(--fi-gris); }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 8px; } .f-alpha .al { font-size: 16px; } .f-alpha .al.fi { font-size: 14px; }
  .f-bande { gap: 2px; align-items: flex-end; } .f-col { width: 20px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .f-colz { position: relative; width: 13px; height: 22px; } .f-colz::after { content: ''; position: absolute; left: -2px; right: -2px; bottom: 0; height: 1px; background: var(--trait2); }
  .f-colb { position: absolute; left: 0; right: 0; bottom: 1px; height: var(--h); background: var(--b); border-radius: 2px 2px 0 0; }
  .f-col.ci .f-colb { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); } .f-col .pi { width: 14px; height: 14px; }
  .f-lab { grid-template-columns: 16px 1fr; } .f-lab .pi { grid-row: span 2; align-self: start; margin-top: 1px; }
  .f-nom { font-size: 16px; font-weight: 700; } .f-cpt, .f-lab-mots, .f-lab-sans, .f-lab-nd, .f-seule, .f-dem, .f-repli, .f-sec, .f-tag { font-size: 12px; }

  /* Réglages : des boutons pleine rangée, au moins 32 px de haut, l'état pressé en encre. */
  .regl { display: flex; align-items: center; gap: 6px; }
  .regl > .lab { font-size: 12px; color: var(--gris); width: 52px; flex: none; }
  .pas { display: flex; flex: 1; gap: 2px; background: #ececf1; border-radius: 8px; padding: 2px; }
  .pas button { flex: 1; min-height: 32px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--gris); display: inline-flex; align-items: center; justify-content: center; gap: 3px; padding: 0 2px; }
  .pas button[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .pas button[aria-pressed="true"] .al, .pas button[aria-pressed="true"] .al.lot::before, .pas button[aria-pressed="true"] .hn { color: #fff; }
  .pas button:disabled { color: #8a8a96; background: repeating-linear-gradient(135deg, transparent 0 3px, rgba(0,0,0,.06) 3px 5px); }
  .pas.hops button { flex-direction: column; gap: 1px; min-height: 40px; }
  .pas.hops .hn { font-size: 13px; text-decoration: none; }

  /* Valeurs : mesuré (encre, mono) et simulé (« ~ », gris tireté). */
  .mv { display: inline-flex; align-items: baseline; gap: 3px; font-size: 12px; color: var(--gris); }
  .mv b { font-weight: 600; color: var(--encre); font-size: 13px; }
  .conf { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 4px; font-size: 12px; font-weight: 600; }
  .conf.estime { color: #4a4a55; box-shadow: inset 0 0 0 1px #9a9aa6; background: repeating-linear-gradient(135deg, #fff 0 4px, #f1f1f4 4px 7px); }
  .conf.mesure { color: #fff; background: var(--encre); }
  .conf.panel { color: var(--encre); background: #ececf1; }
  .conf.inconnu { color: #4a4a55; box-shadow: inset 0 0 0 1px #9a9aa6; }
  .conf.verif { color: #8a3a0a; box-shadow: inset 0 0 0 1px #c2410c; }
  .sim-t { font-size: 12px; color: var(--gris); }
  .hors { color: var(--acc); font-weight: 700; }

  /* La source au toucher, et la feuille de détail. */
  [data-nature="mesure"] { cursor: help; }
  .srcb { font-size: 12px; color: var(--gris); text-decoration: underline; text-underline-offset: 2px; min-height: 24px; padding: 0 2px; }
  .toast { position: fixed; z-index: 45; left: 50%; bottom: 14px; transform: translateX(-50%); width: 358px; max-width: calc(100% - 24px); padding: 10px 12px; border-radius: 8px; background: var(--encre); color: #fff; font-size: 13px; line-height: 1.3; box-shadow: 0 8px 22px rgba(0,0,0,.28); }
  .toast b { font-weight: 700; } .toast .niv { color: #d5d5dc; }
  .toast[hidden] { display: none; }
  .voile { position: fixed; inset: 0; z-index: 30; background: var(--fi-voile); } .voile[hidden] { display: none; }
  .feuille { position: fixed; z-index: 31; left: 0; right: 0; bottom: 0; max-width: 390px; margin: 0 auto; max-height: 86vh; overflow-y: auto; padding: 4px 16px 18px; border-radius: 8px 8px 0 0; background: #fff; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 -8px 28px rgba(0,0,0,.2); }
  .feuille[hidden] { display: none; }
  .fe-t { display: flex; align-items: center; justify-content: space-between; min-height: 40px; font-size: 16px; font-weight: 700; position: sticky; top: 0; background: #fff; z-index: 2; }
  .fe-x { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #ececf1; }
  .fe-s { display: flex; flex-direction: column; gap: 6px; }
  .fe-s h3 { font-size: 12px; font-weight: 700; color: var(--gris); text-transform: none; }
  .fe-l { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 6px; font-size: 13px; line-height: 1.3; }
  .fe-l .pi { width: 16px; height: 16px; }
  .src { color: var(--gris); font-size: 12px; }
  .ouvre { display: inline-flex; align-items: center; gap: 2px; min-height: 32px; padding: 0 4px; font-size: 13px; font-weight: 600; color: var(--encre); text-decoration: underline; text-underline-offset: 3px; }

  /* La légende. */
  .leg-v { position: fixed; inset: 0; z-index: 30; background: var(--fi-voile); }
  .legende { position: fixed; z-index: 31; left: 0; right: 0; bottom: 0; max-width: 390px; margin: 0 auto; max-height: 82vh; overflow-y: auto; padding: 4px 16px 16px; border-radius: 8px 8px 0 0; background: var(--fi-bg); color: var(--fi-tx); display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
  .legende[hidden], .leg-v[hidden] { display: none; }
  .leg-t { display: flex; align-items: center; justify-content: space-between; min-height: 36px; font-size: 14px; font-weight: 700; }
  .leg-x { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
  .leg-s { display: flex; flex-direction: column; gap: 6px; }
  .leg-s h3 { font-size: 12px; font-weight: 700; color: var(--fi-gris); }
  .leg-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 8px; } .leg-g.l2 { grid-template-columns: repeat(2, 1fr); } .leg-g.l1 { grid-template-columns: 1fr; }
  .leg-i { display: flex; align-items: center; gap: 6px; min-height: 24px; }
  .leg-i .pi { width: 18px; height: 18px; }`;
export const CSS = HABILLAGE + EXTRA + CSS_BASE + CSS_FICHE;

// L'en-tête : la bière, la lentille au style / absolu (au style par défaut), le « ? » de la légende.
export const tete = (ic, sous = '') => `
  <div class="barre">
    <b class="titre">Ma 16D</b>
    <span class="biere" data-voie="biere"><span class="hn" data-houblon="Nugget">Nugget</span> 60′ <span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure" data-src="c2" aria-label="α du lot en stock : 13 %">13%</span></span>
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">${ic('aide', 18)}</button>
  </div>${sous}`;

export const legende = (ic, picto, sections) => `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
    ${sections}
    <div class="leg-s"><h3>Familles</h3><div class="leg-g">${ORDRE.map((f) => `<span class="leg-i">${picto(f, 18)}<span>${COURT[f]}</span></span>`).join('')}</div></div>
    <div class="leg-s"><h3>Nature des chiffres</h3><div class="leg-g l1">
      <span class="leg-i"><span class="conf mesure">mesuré</span><span>vraie valeur, sa source au toucher (lot, fiche, article)</span></span>
      <span class="leg-i"><span class="conf panel">panel</span><span>dégustation d'un jury, dans une étude</span></span>
      <span class="leg-i"><span class="conf estime">~ estimé</span><span>simulé par l'outil : forme des fiches × dose × moment × jours</span></span>
      <span class="leg-i"><span class="conf inconnu">inconnu</span><span>pas de donnée : ni zéro, ni moyenne</span></span>
      <span class="leg-i"><span class="conf verif">à vérifier</span><span>valeur lue, attribution incertaine</span></span>
      <span class="leg-i"><span class="al lot">24,8%</span><span>α du lot en stock ; la fiche à l'appui long sur le nom (souligné de points)</span></span>
    </div></div>
    <div class="leg-s"><h3>Style</h3><p>16D, Foreign Extra Stout (BJCP 2021) : « ${SIM.style.citation} » Bandes du prototype, à valider : fruits 0–30, floral, herbacé et terreux 0–55 sur 100. L'orangé ne dit qu'une chose : hors du style.</p></div>
    <div class="leg-s"><h3>Données</h3><p>Profils simulés : ${SOURCE_SIM}. ${SIM.mention || ''} Conventions du moteur à valider par le brasseur (donnees/PROFIL-SIMULE.md).</p></div>
  </section>`;

// Le script commun : légende, source au toucher, feuilles, réglages génériques ; puis la fiche (l8g).
export const JS_COMMUN = `
const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.querySelector('[data-role="legende"]'), LV = document.querySelector('[data-role="legende-voile"]');
const legende = (on) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); if (on) LG.querySelector('[data-role="legende-fermer"]').focus({ preventScroll: true }); };
LB.addEventListener('click', () => legende(LG.hidden));
LV.addEventListener('click', () => legende(false));
LG.querySelector('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !LG.hidden) legende(false); });
if (/[?&]legende\\b/.test(location.search)) legende(true);
/* La source au toucher : une ligne, en bas, qui dit d'où vient la vraie valeur touchée. */
const TOAST = document.createElement('div'); TOAST.className = 'toast'; TOAST.hidden = true; TOAST.setAttribute('role', 'status'); document.body.append(TOAST);
let tToast = 0;
function direSource(el) {
  const k = el.dataset.src, s = D.SOURCES[k] || null, txt = el.dataset.srcTexte || '';
  TOAST.innerHTML = '';
  const b = document.createElement('b'); b.textContent = (el.getAttribute('aria-label') || el.textContent).trim(); TOAST.append(b);
  TOAST.append(document.createTextNode(' · ' + (txt ? txt + ' · ' : '') + (s ? s.t : (k || el.dataset.source || 'source non dite'))));
  if (s && s.n) { const n = document.createElement('span'); n.className = 'niv'; n.textContent = ' [' + ({ P: 'article à comité de lecture', F: 'fournisseur', S: 'autre : thèse, poster, catalogue', H: 'dépôt', lot: 'ton stock' }[s.n] || s.n) + ']'; TOAST.append(n); }
  TOAST.hidden = false; clearTimeout(tToast); tToast = setTimeout(() => { TOAST.hidden = true; }, 6000);
}
document.addEventListener('click', (e) => { const m = e.target.closest('[data-nature="mesure"], [data-src]'); if (m && !e.target.closest('[data-role="fiche"]')) { direSource(m); } else if (!e.target.closest('.toast')) TOAST.hidden = true; });
/* Les feuilles de détail. */
const VOILE = document.createElement('div'); VOILE.className = 'voile'; VOILE.hidden = true; document.body.append(VOILE);
const FEUILLE = document.createElement('section'); FEUILLE.className = 'feuille'; FEUILLE.hidden = true; FEUILLE.setAttribute('role', 'dialog'); FEUILLE.setAttribute('data-role', 'detail'); document.body.append(FEUILLE);
function ouvrirFeuille(titre, corps) {
  FEUILLE.replaceChildren();
  const t = h('div', { class: 'fe-t' }, h('span', {}, titre), h('button', { class: 'fe-x', 'aria-label': 'Fermer', onclick: () => fermerFeuille() }, icone('x', 18)));
  FEUILLE.append(t, ...[].concat(corps)); FEUILLE.hidden = false; VOILE.hidden = false; FEUILLE.scrollTop = 0;
}
function fermerFeuille() { FEUILLE.hidden = true; VOILE.hidden = true; }
VOILE.addEventListener('click', fermerFeuille);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !FEUILLE.hidden) fermerFeuille(); });
`;

// La bibliothèque de la page : nombres, profils, style, analogies, chances, éléments.
export const JS_LIB = `
const NSV = 'http://www.w3.org/2000/svg';
function h(t, a, ...k) { const e = document.createElement(t); for (const [x, y] of Object.entries(a || {})) { if (y == null || y === false) continue; if (x.startsWith('on')) e.addEventListener(x.slice(2), y); else e.setAttribute(x, y); } for (const c of k.flat()) if (c != null && c !== false) e.append(c); return e; }
function s(t, a, p) { const e = document.createElementNS(NSV, t); for (const [x, y] of Object.entries(a || {})) if (y != null) e.setAttribute(x, y); if (p) p.append(e); return e; }
const icone = (k, z) => { const v = s('svg', { width: z, height: z, 'aria-hidden': 'true', class: 'ic' }); s('use', { href: '#i-' + k + '-' + z }, v); return v; };
const pic = (f, z) => { const v = s('svg', { width: z, height: z, class: 'pi', 'data-famille': f, role: 'img', 'aria-label': D.NOM[f] }); s('use', { href: '#p-' + f }, v); return v; };
const fr = (x, d = 0) => (x == null ? '?' : String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',').replace('-', '−'));
const frp = (a, b, d = 1) => (a == null && b == null ? 'inconnu' : a == null ? '≤ ' + fr(b, d) : b == null ? '≥ ' + fr(a, d) : a === b ? fr(a, d) : fr(a, d) + '–' + fr(b, d));
const FAM = D.FAM, IX = Object.fromEntries(FAM.map((f, i) => [f, i]));
const FRUITS = ['citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon'];
const ACC = '#c2410c';
/* Un profil : { f: { c, b, h, hp } } depuis les tableaux compacts [centre, bas, haut, hautPartiel].
   Rien n'est rogné : un haut au-delà de 100 reste tel quel ; hp = borne haute non publiée (le vrai haut peut être plus haut). */
const prof = (pk) => Object.fromEntries(FAM.map((f, i) => [f, { c: pk[i][0], b: pk[i][1], h: pk[i][2], hp: pk[i][3] }]));
const AVANT = prof(D.avant);
const Ge = (hop, m, d, j, l) => D.G[[hop, m, d, j == null ? '-' : j, l].join('|')] || null;
const G = (hop, m, d, j, l) => { const e = Ge(hop, m, d, j, l); return e ? prof(e.p) : null; };
const GPe = (a, b, m, l) => D.GP[[a + '+' + b, m, l].join('|')] || null;
const GP = (a, b, m, l) => { const e = GPe(a, b, m, l); return e ? prof(e.p) : null; };
const lim = (f) => D.B16[f][1];
const niv = (f, v) => v / lim(f);
/* Ma bière est déjà hors du style par la dégustation (résineux marqué) : ce n'est pas l'ajout. */
const DEJA = FAM.filter((f) => AVANT[f].c > lim(f));
const horsStyle = (p) => FAM.filter((f) => p[f].c > lim(f) && !DEJA.includes(f));
const peutEtre = (p) => FAM.filter((f) => p[f].c <= lim(f) && p[f].h > lim(f) && !DEJA.includes(f));
const tri = (p) => FAM.slice().sort((a, b) => p[b].c - p[a].c);
const cran = (v) => (v <= 5 ? 0 : v <= 33 ? 1 : v <= 66 ? 2 : 3);
/* L'analogie : le style BJCP dont les bandes contiennent le mieux le profil (bandes du prototype), sans
   compter ce que ma bière a déjà par la dégustation. */
function analogie(p) {
  const exces = (z) => FAM.reduce((a, f, i) => a + (DEJA.includes(f) ? 0 : Math.max(0, p[f].c - z[i])), 0);
  if (exces(D.AN['16D'].z) <= 3) return { code: '16D', texte: 'reste une 16D' };
  const c = ['18B', '21A', '21C'].map((k) => [k, exces(D.AN[k].z)]).sort((a, b) => a[1] - b[1])[0];
  if (c[1] > 25) return { code: null, texte: 'au-delà de ces styles' };
  return { code: c[0], texte: '≈ ' + ({ '18B': 'pale ale US', '21A': 'IPA US', '21C': 'Hazy IPA' })[c[0]] };
}
/* Les chances : 20 brassins simulés, tirés aux quantiles (un facteur commun, un bruit par famille). */
const QZ = Array.from({ length: 20 }, (_, i) => { const q = (i + 0.5) / 20; const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637], b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833], c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863, 0.0038405729373609, 0.0003951896511919, 0.0000321767881768, 0.0000002888167364, 0.0000003960315187];
  const y = q - 0.5; if (Math.abs(y) < 0.42) { const r = y * y; return y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]) / ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1); }
  let r = q; if (y > 0) r = 1 - q; r = Math.log(-Math.log(r)); let x = c[0] + r * (c[1] + r * (c[2] + r * (c[3] + r * (c[4] + r * (c[5] + r * (c[6] + r * (c[7] + r * c[8]))))))); return y < 0 ? -x : x; });
function tirages(p) {
  return QZ.map((z, i) => Object.fromEntries(FAM.map((f, k) => { const e = QZ[(i * 7 + k * 5 + 3) % 20] * 0.45, zz = z * 0.9 + e; const x = p[f];
    const v = zz >= 0 ? x.c + zz * (x.h - x.c) / 1.28 : x.c + zz * (x.c - x.b) / 1.28; return [f, Math.max(0, v)]; })));
}
const dansStyle = (t) => FAM.every((f) => DEJA.includes(f) || t[f] <= lim(f));
const chances = (p) => tirages(p).filter(dansStyle).length;
/* Vraies valeurs et simulé, balisés. */
function mesure(texte, src, o = {}) { return h(o.tag || 'span', { class: 'mv ' + (o.cls || ''), 'data-nature': 'mesure', 'data-source': o.source || src, 'data-src': src, 'data-src-texte': o.dit || null, 'aria-label': o.label || null, role: 'button', tabindex: '0' }, ...(o.avant || []), h('b', {}, texte), o.unite ? ' ' + o.unite : null); }
function simule(texte, o = {}) { return h(o.tag || 'span', { class: 'sv ' + (o.cls || ''), 'data-nature': 'simule', 'aria-label': o.label || null }, texte); }
function alphaEl(hop) { const A = D.V[hop].alpha; const hors = A.horsFiches && hop !== 'Citra';
  return h('span', { class: 'al lot', 'data-role': 'alpha', 'data-source': 'lot', 'data-nature': 'mesure', 'data-src': 'c2', 'data-src-texte': 'lot ' + A.lotSource + (hop === 'Citra' ? ', Citra cryo' : '') + ' ; fiches ' + fr(A.fiches[0], 1) + '–' + fr(A.fiches[1], 1) + ' %' + (hop === 'Citra' ? ' (pellets)' : ''), 'aria-label': 'α du lot ' + fr(A.lot, 1) + ' %' + (hors ? ', hors des plages de ses fiches' : '') }, fr(A.lot, 1) + '%', hors ? icone('diff', 12) : null); }
const nomH = (hop) => h('span', { class: 'hn', 'data-houblon': D.CLE[hop] }, hop);
const USM = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'mixte' };
function usageEl(hop) { const V = D.V[hop], regle = !/^fournisseur/.test(V.roleSource || ''); return h('span', { class: 'us us-mot' + (regle ? ' deduit' : ''), 'data-role': 'usage', 'data-usage': V.role, 'data-source': regle ? 'règle' : 'fournisseur', 'data-houblon': D.CLE[hop], 'aria-label': 'Usage : ' + USM[V.role] + (regle ? ', déduit de l’α' : ', attesté par le fournisseur') }, USM[V.role]); }
const conf = (mot, cls) => h('span', { class: 'conf ' + cls }, mot);
/* Un renvoi vers la source d'un fait (pas une valeur) : la ligne de source au toucher. */
const srcB = (k, dit, label) => h('button', { class: 'srcb', 'data-src': k, 'data-src-texte': dit || null, 'aria-label': label || 'source' }, 'source');
`;

// Les réglages : un groupe de boutons pressables (data-role="reglage", data-reglage="…").
export const pas = (nom, lab, valeurs, actif, o = {}) => `<div class="regl"${o.attrs || ''}>${lab ? `<span class="lab">${lab}</span>` : ''}<div class="pas${o.cls ? ' ' + o.cls : ''}" role="group" aria-label="${o.aria || lab}">${valeurs.map(([v, t, a]) => `<button data-role="reglage" data-reglage="${nom}" data-valeur="${v}" aria-pressed="${String(v === actif)}"${a || ''}>${t}</button>`).join('')}</div></div>`;

export const page = ({ titre, description, css, corps, js, donneesJS }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${description} -->${POLICES}
<style>${css}</style>
</head>
<body>
${SYMB}
<main class="ecran">${corps}
</main>
<script>
(() => {
const D = ${donneesJS};
${JS_LIB}
${JS_COMMUN}
${js}
})();
</script>
<script>${RUNTIME}</script>
</body>
</html>
`;
