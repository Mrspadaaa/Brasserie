// Voie f1-affinage-diagnostic, parties 1 et 2 (D174 Citra cryo ; D175 les coupes). MESURE seulement : rien dans src/.
// Lancement : npx vite-node scripts/eval-hop/f1-diagnostic.ts -- --sortie=<dossier>
//   sortie : diagnostic.json (déterministe : ni durée ni date ; sha256 imprimé) ; durees.json (millisecondes, NON déterministe, hors empreinte).
// Recettes : la 21C (Nugget 20 g à 60′, Cascade 80 g en dry hop actif) et la stout 16D (Nugget 46 g à 60′), 20 L, stock des fixtures du prototype.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur, type Moteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { Substitute, Voie, VoieResult } from '../../src/domain/hopIndex/v4';
import { FAMILIES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import { citations, marquee } from '../../src/domain/hopIndex/v4/hops';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/f1-affinage-diagnostic');
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const RECETTES = [{ code: '21C', r: R21C }, { code: '16D', r: R16D }];
const VISEES: { recette: string; nom: string; dir: Partial<Record<FamilyId, number>> }[] = [
  { recette: '21C', nom: 'plus d’agrumes', dir: { citrus: 1 } },
  { recette: '16D', nom: 'moins de résineux', dir: { resin: -1 } },
  { recette: '16D', nom: 'plus floral', dir: { floral: 1 } },
];
const PHARES: [string, string][] = [['Citra', 'citra'], ['Nelson Sauvin', 'nelson-sauvin'], ['Galaxy', 'galaxy'], ['Mosaic', 'mosaic'], ['Motueka', 'motueka'],
  ['Idaho 7', 'idaho-7'], ['Strata', 'strata'], ['Simcoe', 'simcoe'], ['Cascade', 'cascade'], ['Hallertau Blanc', 'hallertau-blanc']];
const CLE = (id: string) => `beermaverick-${id}`;
const CITRA = CLE('citra'), CRYO = CLE('citra') + ':cryo';
const r1 = (x: number | null | undefined) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const r2 = (x: number | null | undefined) => (x === null || x === undefined ? null : Math.round(x * 100) / 100);
const ms: Record<string, number[]> = {};
const chrono = <T>(nom: string, f: () => T): T => { const t = performance.now(); const x = f(); (ms[nom] ??= []).push(Math.round((performance.now() - t) * 10) / 10); return x; };
const FIX = () => creerMoteur();

/** Tous les houblons de PHARES : présents au catalogue (sinon, arrêt). */
for (const [nom, id] of PHARES) if (!CATALOGUE.some((h) => h.id === CLE(id))) throw new Error(`phare absent du catalogue : ${nom}`);

// ---------------------------------------------------------------------------------------------------------------------------
// PARTIE 1a : Substituer (moteur v2). Ce que l'écran montre = composer() de src/ui/hopIndex/substituer/donnees.ts : 5 « à acheter » et 3 du stock.
// ---------------------------------------------------------------------------------------------------------------------------
const ligneSub = (s: Substitute | undefined, tous: Substitute[]) => !s ? null : ({
  rang: s.rank, rangDansLaListeTriee: tous.indexOf(s) + 1, score: s.score, palier: s.palier, composantes: s.composantes, stock: s.stock.etat, libreG: s.stock.libre,
  doseG: s.dose.grams, doseRegle: s.dose.regle, fiabilite: s.couverture.fiabilite, memeVariete: s.memeVariete, demotion: s.amertumeDeconseillee, conflitsStyle: s.conflitsStyle,
});
function ecranSubstituer(tous: Substitute[]) {
  const catalogue = tous.filter((s) => s.stock.etat !== 'en stock').slice(0, 5);
  const enStock = tous.filter((s) => s.stock.etat === 'en stock');
  let stock = enStock.slice(0, 3);
  const suffit = enStock.find((s) => s.stock.suffisant !== false);
  if (suffit && !stock.includes(suffit)) stock = [...stock.slice(0, 2), suffit];
  return { catalogue, stock };
}
const partie1a = RECETTES.flatMap(({ code, r }) => (['b60', 'dryActive'] as const).map((moment) => {
  const m = FIX();
  const style = getStyleScale(code);
  const base = { moment, grams: r.additions[0].grams, recipe: r, style };
  const res = m.substitutes(CLE('nugget'), { ...base, stockFirst: false });
  const resSF = m.substitutes(CLE('nugget'), { ...base, stockFirst: true });
  const ec = ecranSubstituer(res.remplacants);
  const parCle = (rs: Substitute[]) => Object.fromEntries([CITRA, CRYO].map((k) => [k, ligneSub(rs.find((s) => s.key === k), rs)]));
  const aStock = res.remplacants.filter((s) => s.stock.etat === 'en stock');
  return {
    recette: code, original: 'Nugget', moment, candidats: res.candidats, poids: res.poids,
    citra: parCle(res.remplacants), citraStockFirst: parCle(resSF.remplacants),
    ecran: { aAcheter: ec.catalogue.map((s) => `${s.rank} ${s.name} ${s.score}`), enStock: ec.stock.map((s) => `${s.rank} ${s.name} ${s.score} (${s.stock.etat})`),
      citraSimpleVisible: [...ec.catalogue, ...ec.stock].some((s) => s.key === CITRA), citraCryoVisible: [...ec.catalogue, ...ec.stock].some((s) => s.key === CRYO) },
    rangDeCitraParmiLesAAcheter: res.remplacants.filter((s) => s.stock.etat !== 'en stock').findIndex((s) => s.key === CITRA) + 1,
    rangDeCryoParmiLeStock: aStock.findIndex((s) => s.key === CRYO) + 1, nEnStock: aStock.length,
    ficheEnStockFirst: resSF.remplacants.filter((s) => s.stock.etat === 'en stock').slice(0, 3).map((s) => `${s.name} ${s.score} (rang général ${res.remplacants.find((x) => x.key === s.key)?.rank})`),
    tete10: res.remplacants.slice(0, 10).map((s) => `${s.rank} ${s.name} ${s.score}`),
    teteStockFirst10: resSF.remplacants.slice(0, 10).map((s) => `${s.name} ${s.score} ${s.stock.etat}`),
  };
}));
const alphaCryo = FIX().hopRef(CRYO)?.alpha ?? null, alphaSimple = FIX().hopRef(CITRA)?.alpha ?? null;
const aStockCryo = FIX().stock.find((s) => s.key === CRYO) ?? null;

// ---------------------------------------------------------------------------------------------------------------------------
// PARTIE 1b : Suggérer (proposeVoies, options par défaut puis options de g2b). Où sont Citra cryo et Citra simple ?
// ---------------------------------------------------------------------------------------------------------------------------
const ligneVoie = (v: Voie, famille: FamilyId | null) => ({
  rang: v.rank, label: v.label, type: v.type, domaine: v.domain, stock: v.stock.status, distance: v.distance.total, debordement: v.overflowTotal, conflits: v.conflicts.length,
  effetSurLaFamille: famille ? (v.effect[famille].central ?? null) : null, etabli: famille ? v.effect[famille].established : null, dose: v.dose ?? null, enStock: v.enStock ?? null,
  palier: v.palier ? { usage: v.palier.usage, alpha: v.palier.alpha, rang: v.palier.rang } : null, ibuApres: v.ibu.after,
});
const trouver = (vs: Voie[], k: string) => vs.filter((v) => v.actions.some((a) => a.hopKey === k)).map((v) => ligneVoie(v, null));
const partie1b = VISEES.map(({ recette, nom, dir }) => {
  const r = recette === '21C' ? R21C : R16D;
  const famille = (Object.keys(dir)[0] ?? null) as FamilyId | null;
  const m = FIX();
  const defaut = chrono(`suggerer-defaut-${recette}-${nom}`, () => m.proposeVoies(r, dir, { assemblages: true }));
  const g2b = m.proposeVoies(r, dir, { assemblages: true, palier60: { ibu: 10 }, dryHop: true });
  const sansStock = creerMoteur({ catalogue: CATALOGUE, stock: [] });
  const gSans = sansStock.proposeVoies(r, dir, { assemblages: true, palier60: { ibu: 10 }, dryHop: true });
  const trois = (res: VoieResult) => ({
    voies: res.voies.length, citraSimple: trouver(res.voies, CITRA), citraCryo: trouver(res.voies, CRYO),
    palier60: res.palier60 ? { n: res.palier60.voies.length, citraSimple: trouver(res.palier60.voies, CITRA), citraCryo: trouver(res.palier60.voies, CRYO), tete: res.palier60.voies.slice(0, 5).map((v) => `${v.rank} ${v.label}`) } : null,
    dryActif: res.dryHop ? { n: res.dryHop.actif.length, citraSimple: trouver(res.dryHop.actif, CITRA), citraCryo: trouver(res.dryHop.actif, CRYO), tete: res.dryHop.actif.slice(0, 5).map((v) => `${v.rank} ${v.label}`) } : null,
    dryApres: res.dryHop ? { n: res.dryHop.apres.length, citraSimple: trouver(res.dryHop.apres, CITRA), citraCryo: trouver(res.dryHop.apres, CRYO) } : null,
  });
  // L'effet du dry hop est-il plus fort pour le cryo que pour le simple, à dose égale (même moteur, même addition) ?
  const effetDose = famille ? [CITRA, CRYO].map((k) => {
    const e = m.additionEffect({ id: 'x', hopKey: k, moment: 'dryActive', grams: 30 }, r);
    return { cle: k, effetSurLaFamille: e ? (e[famille].central ?? null) : null };
  }) : null;
  return { recette, visee: nom, defaut: trois(defaut), g2b: trois(g2b), g2bSansStockDesFixtures: trois(gSans), effetAjout30gDryActif: effetDose };
});

// PARTIE 1c : sans plafond, avec et sans le stock des fixtures. Où serait Citra simple ? (Et sous l'option g2d « c », active par défaut au dry hop après D99 : mesurée à part.)
const GRAND = { assemblages: false, palier60: { ibu: 10 }, dryHop: true, maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100 } as const;
const rangDe = (vs: Voie[], k: string) => { const i = vs.findIndex((v) => v.actions.some((a) => a.hopKey === k)); return i < 0 ? null : { position: i + 1, rang: vs[i].rank, sur: vs.length, g: vs[i].actions[0].grams, distance: vs[i].distance.total, debordement: vs[i].overflowTotal }; };
const partie1c = [VISEES[0], VISEES[2]].flatMap(({ recette, nom, dir }) => {
  const r = recette === '21C' ? R21C : R16D;
  return (['aucun', 'c'] as const).flatMap((mode) => (['avec le stock des fixtures', 'sans stock'] as const).map((jeu) => {
    const m = jeu === 'sans stock' ? creerMoteur({ catalogue: CATALOGUE, stock: [] }) : FIX();
    const res = m.proposeVoies(r, dir, { ...GRAND, apportMinoritaire: mode });
    const lignes = (k: string) => ({ palier60: rangDe(res.palier60?.voies ?? [], k), dryActif: rangDe(res.dryHop?.actif ?? [], k), dryApres: rangDe(res.dryHop?.apres ?? [], k) });
    return { recette, visee: nom, apportMinoritaire: mode, jeu, citraSimple: lignes(CITRA), citraCryo: lignes(CRYO),
      parLeNom60: (res.palier60?.voies ?? []).slice(0, 12).map((v) => `${v.rank} ${v.actions[0].hopName} ${v.actions[0].grams} g α${v.palier?.alpha ?? '?'}`) };
  }));
});

// ---------------------------------------------------------------------------------------------------------------------------
// PARTIE 2 : inventaire des coupes (D175).
// ---------------------------------------------------------------------------------------------------------------------------
const nomDe = (k: string) => CATALOGUE.find((h) => h.id === k.replace(/:cryo$/, ''))?.name ?? k;
// 2a. Substituer : le moteur classe tout (317) ; l'écran en garde 8, l'IA 20. Où sont les phares, et quels sont les ordres décalés par les clés qui passent avant le score ?
const coupesSubstituer = RECETTES.flatMap(({ code, r }) => (['b60', 'dryActive'] as const).map((moment) => {
  const m = FIX();
  const res = m.substitutes(CLE('nugget'), { moment, grams: r.additions[0].grams, recipe: r, style: getStyleScale(code), stockFirst: false });
  const tous = res.remplacants;
  const ec = ecranSubstituer(tous);
  const visibles = new Set([...ec.catalogue, ...ec.stock].map((s) => s.key));
  const fenetreIA = new Set(tous.slice(0, 20).map((s) => s.key));
  const phares = PHARES.map(([nom, id]) => {
    const s = tous.find((x) => x.key === CLE(id));
    return { nom, rang: s?.rank ?? null, score: s?.score ?? null, visibleSurLEcran: !!s && visibles.has(s.key), dansLaFenetreIA20: !!s && fenetreIA.has(s.key), stock: s?.stock.etat ?? null,
      derriere: !s ? null : s.conflitsStyle.length ? 'conflit de style' : s.couverture.fiabilite === 'faible' ? 'couverture faible' : s.amertumeDeconseillee ? 'amertume déconseillée' : null };
  });
  const derriere = { conflitStyle: tous.filter((s) => s.conflitsStyle.length).length, couvertureFaible: tous.filter((s) => s.couverture.fiabilite === 'faible').length, amertumeDeconseillee: tous.filter((s) => !!s.amertumeDeconseillee).length };
  // Combien d'entre eux auraient été dans les 20 premiers sur le seul score (sans les trois clés qui passent avant) ?
  const parScore = [...tous].sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : 1));
  const dans20Score = new Set(parScore.slice(0, 20).map((s) => s.key)), dans20Rang = fenetreIA;
  const remontes = [...dans20Score].filter((k) => !dans20Rang.has(k));
  return {
    recette: code, moment, candidats: tous.length, ecran: { total: visibles.size, retires: tous.length - visibles.size }, fenetreIA: { total: 20, retires: tous.length - 20 }, derriere,
    sansLesClesAvantLeScore: { entrentDansLes20: remontes.length, noms: remontes.slice(0, 8).map((k) => `${nomDe(k)} ${tous.find((s) => s.key === k)!.score}`) }, phares,
  };
}));

// 2b. Suggérer : chaque coupe, mesurée en retirant les plafonds un à un (les voies « ajouter » sont celles dont le pool est coupé).
type Opts = Parameters<Moteur['proposeVoies']>[2];
const ouverts: { nom: string; o: Opts }[] = [
  { nom: 'défaut (maxBuy 6, limit 10, buyLimit 4, perHop 2, 2 assemblages)', o: { assemblages: true } },
  { nom: 'maxBuy 400', o: { assemblages: true, maxBuy: 400 } },
  { nom: 'maxBuy 400 + limit/buyLimit 2000', o: { assemblages: true, maxBuy: 400, limit: 2000, buyLimit: 2000 } },
  { nom: 'tout ouvert (+ perHop 100)', o: { assemblages: true, maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100 } },
];
const varietesAjoutees = (res: VoieResult) => new Set(res.voies.filter((v) => v.type === 'ajouter' || v.type === 'assemblage').flatMap((v) => v.actions.map((a) => a.hopKey.replace(/:cryo$/, ''))));
const coupesSuggerer = VISEES.map(({ recette, nom, dir }) => {
  const r = recette === '21C' ? R21C : R16D;
  const style = getStyleScale(r.styleCode);
  const plus = FAMILIES.filter((f) => (dir[f] ?? 0) > 0), minus = FAMILIES.filter((f) => (dir[f] ?? 0) < 0);
  const m = FIX();
  const dispo = new Set(m.stock.filter((s) => s.grams > 0).map((s) => s.varietyId));
  // Les exclusions « avant le classement » (voies.ts : buyPoolDe), recalculées avec les mêmes prédicats (hops.ts : citations, marquee ; style).
  const lignes = CATALOGUE.map((h) => {
    const cit = citations(h.id);
    const nPlus = plus.filter((f) => cit[f].status === 'cité').length;
    const causeBad = minus.find((f) => marquee(h.id, f)) ?? FAMILIES.find((f) => style.families[f].status === 'indésirable' && marquee(h.id, f)) ?? null;
    return { id: h.id, nom: h.name, nPlus, bad: causeBad, enStock: dispo.has(h.id) };
  });
  const eligibles = lignes.filter((l) => !l.enStock && !l.bad && (plus.length === 0 || l.nPlus > 0));
  const parOuverture = ouverts.map(({ nom: n, o }) => {
    const res = chrono(`suggerer-${n.slice(0, 14)}-${recette}-${nom}`, () => FIX().proposeVoies(r, dir, o));
    const v = varietesAjoutees(res);
    return { ouverture: n, voies: res.voies.length, evalues: res.evaluated, houblonsDistinctsAjoutes: v.size, phares: PHARES.filter(([, id]) => v.has(CLE(id))).map(([n2]) => n2), notes: res.notes.filter((x) => /voies examinées/.test(x)) };
  });
  const gRes = FIX().proposeVoies(r, dir, { assemblages: true, palier60: { ibu: 10 }, dryHop: true, maxBuy: 6 });
  const ids60 = new Set(gRes.palier60?.voies.map((v) => v.actions[0].hopKey.replace(/:cryo$/, '')) ?? []);
  const grand = FIX().proposeVoies(r, dir, { assemblages: true, palier60: { ibu: 10 }, dryHop: true, maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100 });
  const idsDry = (g: Voie[]) => new Set(g.map((v) => v.actions[0].hopKey.replace(/:cryo$/, '')));
  return {
    recette, visee: nom, catalogue: CATALOGUE.length,
    avantLeClassement: {
      enStockLibre: lignes.filter((l) => l.enStock).length, exclusParUneFamilleMarquee: lignes.filter((l) => !l.enStock && l.bad).length,
      sansFamilleVisee: plus.length ? lignes.filter((l) => !l.enStock && !l.bad && l.nPlus === 0).length : null,
      poolAAcheterEligible: eligibles.length, coupeParMaxBuy6: Math.max(0, eligibles.length - 6),
    },
    pharesAvantLeClassement: PHARES.map(([n2, id]) => { const l = lignes.find((x) => x.id === CLE(id))!; return { nom: n2, enStock: l.enStock, exclu: l.bad, famillesVisees: l.nPlus, eligible: eligibles.some((e) => e.id === l.id) }; }),
    parOuverture,
    palier60: { n: gRes.palier60?.voies.length ?? 0, notes: gRes.palier60?.notes ?? [], phares: PHARES.filter(([, id]) => ids60.has(CLE(id))).map(([n2]) => n2),
      sansPlafond: { n: grand.palier60?.voies.length ?? 0, phares: PHARES.filter(([, id]) => idsDry(grand.palier60?.voies ?? []).has(CLE(id))).map(([n2]) => n2) } },
    dryHopActif: { n: gRes.dryHop?.actif.length ?? 0, phares: PHARES.filter(([, id]) => idsDry(gRes.dryHop?.actif ?? []).has(CLE(id))).map(([n2]) => n2),
      sansPlafond: { n: grand.dryHop?.actif.length ?? 0, phares: PHARES.filter(([, id]) => idsDry(grand.dryHop?.actif ?? []).has(CLE(id))).map(([n2]) => n2) } },
  };
});

// 2c. Coût de couper plus tard : Substituer (une demande = 317 remplaçants rendus : l'écran n'en prend pas de limite) et Suggérer (plafonds levés).
function coutSubstituer() {
  const base = { moment: 'dryActive' as const, grams: 20, recipe: R21C, style: getStyleScale('21C'), stockFirst: false };
  const sortie: Record<string, unknown> = {};
  for (const [nom, lim] of [['limit 8 (rendus)', 8], ['limit 20', 20], ['sans limite (ce que l\'écran demande)', undefined]] as const) {
    const froid: number[] = [], chaud: number[] = [];
    for (let i = 0; i < 3; i++) { const m = FIX(); const o = { ...base, ...(lim ? { limit: lim } : {}) }; froid.push(chrono(`substituer-froid-${nom}`, () => m.substitutes(CLE('nugget'), o)) && ms[`substituer-froid-${nom}`].at(-1)!); }
    const m = FIX(); m.substitutes(CLE('nugget'), { ...base, ...(lim ? { limit: lim } : {}) });
    for (let i = 0; i < 5; i++) { const o = { ...base, ...(lim ? { limit: lim } : {}), grams: 20 + i }; chaud.push(chrono(`substituer-chaud-${nom}`, () => m.substitutes(CLE('nugget'), o)) && ms[`substituer-chaud-${nom}`].at(-1)!); }
    sortie[nom] = { froidMs: froid, chaudMs: chaud };
  }
  return sortie;
}
const dursSubstituer = coutSubstituer();
const dursSuggerer = (() => {
  const out: Record<string, unknown> = {};
  for (const { nom, o } of ouverts) {
    const froid: number[] = [], chaud: number[] = [];
    const m0 = FIX(); chaud.push(0); chaud.pop();
    froid.push(chrono(`suggerer-froid-${nom}`, () => m0.proposeVoies(R21C, { citrus: 1 }, o)) && ms[`suggerer-froid-${nom}`].at(-1)!);
    for (let i = 0; i < 3; i++) chaud.push(chrono(`suggerer-chaud-${nom}`, () => m0.proposeVoies({ ...R21C, additions: [{ ...R21C.additions[0], grams: 20 + i }, R21C.additions[1]] }, { citrus: 1 }, o)) && ms[`suggerer-chaud-${nom}`].at(-1)!);
    out[nom] = { froidMs: froid, chaudMs: chaud };
  }
  const g = FIX();
  const t0 = performance.now(); g.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, palier60: { ibu: 10 }, dryHop: true }); const froidG2b = Math.round(performance.now() - t0);
  const t1 = performance.now(); g.proposeVoies({ ...R21C, additions: [{ ...R21C.additions[0], grams: 21 }, R21C.additions[1]] }, { citrus: 1 }, { assemblages: true, palier60: { ibu: 10 }, dryHop: true }); const chaudG2b = Math.round(performance.now() - t1);
  const t2 = performance.now(); FIX().proposeVoies(R21C, { citrus: 1 }, { assemblages: true, palier60: { ibu: 10 }, dryHop: true, maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100 }); const froidGrand = Math.round(performance.now() - t2);
  out['options g2b (limites par défaut)'] = { froidMs: froidG2b, chaudMs: chaudG2b };
  out['options g2b, tout ouvert'] = { froidMs: froidGrand };
  return out;
})();

const sortie = {
  voie: 'f1-affinage-diagnostic, parties 1 et 2',
  stockFixtures: { citraCryo: aStockCryo ? { cle: aStockCryo.key, grams: aStockCryo.grams, alpha: aStockCryo.alpha, alphaFrom: aStockCryo.alphaFrom, items: aStockCryo.items } : null },
  alphaUtilise: { citraCryo: alphaCryo, citraSimple: alphaSimple, fichePlageVarietale: CATALOGUE.find((h) => h.id === CITRA)?.alpha ?? null },
  partie1a, partie1b, partie1c, partie2: { substituer: coupesSubstituer, suggerer: coupesSuggerer },
};
const json = JSON.stringify(sortie, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'diagnostic.json'), json);
writeFileSync(join(SORTIE, 'durees.json'), JSON.stringify({ lecture: 'Millisecondes mesurées (non déterministes, hors empreinte de diagnostic.json). Froid : moteur neuf, premier appel.', substituer: dursSubstituer, suggerer: dursSuggerer }, null, 1) + '\n');
process.stdout.write(`sha256 ${createHash('sha256').update(json).digest('hex')}\n`);
