// Voie g1-suggerer-moments (#181) : diagnostic de Suggérer à 60′ et au dry hop. MESURE seulement : rien dans src/.
// Lancement, depuis la racine : npx vite-node scripts/eval-hop/suggerer-moments.ts -- --sortie=<dossier>
// Sortie : suggerer-moments.json (déterministe : ni durée ni date). Le rapport.md de la voie est écrit à la main d'après ce fichier.
// Quatre parties :
//  A. deux recettes (21C « Hazy du jeudi » : Nugget 60′ + Cascade dry hop ; stout 16D de e1), trois visées (plus d'agrumes, plus
//     d'amertume, moins de résineux) : ce que l'écran reçoit (options par défaut du moteur, comme l'adaptateur), puis chaque moment
//     examiné seul (60′ compris) ;
//  B. l'effet d'une famille citée : varie-t-il d'une variété à l'autre, à 60′ et au dry hop ? (une dose fixe par moment) ;
//  C. le banc d'aller-retour de e1 pour Suggérer, rejoué sur les données d'aujourd'hui, au dry hop et à 60′ ;
//  D. inventaire de ce qui pourrait départager les houblons (intensité par variété) et groupes d'ex æquo que chaque clé lève.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../src/domain/hopIndex/v4';
import { arrondi, echantillon, mediane, rangMoyenGroupe, resume, type Obs } from './metriques';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/g1-suggerer-moments');
const GRAINE = 181;
const t0 = performance.now();
const chrono = (nom: string) => process.stderr.write(`[g1] ${nom} ${(performance.now() - t0).toFixed(0)} ms\n`);

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }); // pool = les 318 variétés, sans stock (comme le banc e1)
const mStock = creerMoteur();                                // fixtures : stock du prototype (ce que voit l'écran de la maquette)
const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
const nom = (id: string) => parId.get(id)?.name ?? id;

// ---------- Recettes ----------
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const RECETTES: [string, Recipe][] = [['21C', R21C], ['16D', R16D]];
// Trois visées. « Plus d'amertume » n'est pas une famille : la direction du moteur est vide (seul moyen d'exprimer « rien à viser »).
const VISEES: [string, Partial<Record<FamilyId, number>>][] = [['plus d’agrumes', { citrus: 1 }], ['plus d’amertume', {}], ['moins de résineux', { resin: -1 }]];
const MOMENTS_TOUS: MomentId[] = ['b60', 'b30', 'b15', 'b10', 'wp', 'dryActive', 'dryPost'];
const MOMENTS_ECRAN: MomentId[] = ['b10', 'wp', 'dryActive', 'dryPost']; // défaut de proposeVoies, jamais surchargé par l'adaptateur (proposer / leviersLevure)

const compte = <T,>(xs: T[], cle: (x: T) => string) => { const o: Record<string, number> = {}; for (const x of xs) { const k = cle(x); o[k] = (o[k] ?? 0) + 1; } return Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1))); };
const momentDe = (v: Voie) => v.actions[0]?.moment ?? null;
const ligne = (v: Voie) => ({ label: v.label, type: v.type, domaine: v.domain, rang: v.rank, exAequo: v.tieWith.length, distance: v.distance.total, derive: v.ibu.drift, conflits: v.conflicts.length, debord: v.overflowTotal, effets: Object.fromEntries(FAMILIES.filter((f) => v.effect[f].established).map((f) => [f, v.effect[f].central])) });
const tailleGroupe1 = (vs: Voie[]) => (vs.length ? vs.filter((v) => v.rank === vs[0].rank).length : 0);
const groupes = (vs: Voie[]) => new Set(vs.map((v) => v.rank)).size;

// ---------- A. Ce que l'écran reçoit, puis chaque moment ----------
const partieA = RECETTES.map(([code, recette]) => ({
  recette: code, ibuRecette: mStock.recipeIbu(recette).value,
  visees: VISEES.map(([libelle, dir]) => {
    // Appel de l'écran (adaptateur.proposer) : options par défaut, assemblages vrais ; stock des fixtures ; aucune dégustation.
    const ecran = mStock.proposeVoies(recette, dir, { assemblages: true });
    // Appel des leviers (adaptateur.leviersLevure) : dry hop actif et levures.
    const leviers = mStock.proposeVoies(recette, dir, { assemblages: false, leviersLevure: true });
    const momentsEcran = compte(ecran.voies, (v) => `${v.type}@${momentDe(v) ?? '-'}`);
    const parMoment = Object.fromEntries(MOMENTS_TOUS.map((mo) => {
      // Un moment examiné seul, tout le pool (la maquette ne montre qu'un extrait, ceci mesure ce que le moteur saurait rendre).
      const r = m.proposeVoies(recette, dir, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, moments: [mo], assemblages: false });
      const aj = r.voies.filter((v) => v.type === 'ajouter');
      const etablis = aj.filter((v) => Object.entries(dir).every(([f]) => v.effect[f as FamilyId].established));
      return [mo, {
        evalue: r.evaluated, voiesRetenues: r.voies.length, ajouts: aj.length, ajoutsParVariete: new Set(aj.map((v) => v.actions[0].hopKey)).size,
        groupesDistincts: groupes(aj), premierGroupe: tailleGroupe1(aj), ajoutsAvecEffetEtabli: etablis.length,
        autresTypes: compte(r.voies.filter((v) => v.type !== 'ajouter'), (v) => v.type),
        top5: aj.slice(0, 5).map(ligne), notes: r.notes,
      }];
    }));
    return {
      visee: libelle, direction: dir,
      ecran: { voies: ecran.voies.length, evalue: ecran.evaluated, parGesteEtMoment: momentsEcran, groupesDistincts: groupes(ecran.voies), premierGroupe: tailleGroupe1(ecran.voies), top: ecran.voies.slice(0, 12).map(ligne), notes: ecran.notes, momentsDemandes: MOMENTS_ECRAN },
      leviers: { voies: leviers.voies.length, dry: leviers.voies.filter((v) => v.type === 'levure' && !v.yeastChange).map(ligne), souches: leviers.voies.filter((v) => !!v.yeastChange).length },
      parMoment,
    };
  }),
}));
chrono('A');

// ---------- B. L'effet d'une famille citée change-t-il avec la variété ? ----------
// Une dose fixe par moment (g/L), la même pour toutes les variétés ; la recette de base est la 21C sans houblon.
const BASE_VIDE: Recipe = { ...R21C, additions: [] };
const DOSES: Record<string, number> = { b60: 1, b10: 2, wp: 3, dryActive: 4, dryPost: 4 };
const FAM_B: FamilyId[] = ['citrus', 'tropical', 'floral', 'resin'];
const partieB = Object.fromEntries((['b60', 'b10', 'wp', 'dryActive', 'dryPost'] as MomentId[]).map((mo) => [mo, Object.fromEntries(FAM_B.map((f) => {
  const valeurs: number[] = [];
  let citent = 0, sansEffet = 0;
  for (const h of CATALOGUE) {
    if (m.citations(h.id)[f].status !== 'cité') continue;
    citent++;
    const e = m.additionEffect({ id: 'b', hopKey: h.id, moment: mo, grams: DOSES[mo] * BASE_VIDE.volumeL }, BASE_VIDE);
    const c = e?.[f].established ? e[f].central : null;
    if (c === null || c === undefined) sansEffet++; else valeurs.push(c);
  }
  const distincts = [...new Set(valeurs)].sort((a, b) => a - b);
  return [f, { dose_g_par_L: DOSES[mo], varietesQuiCitent: citent, effetNonEtabli: sansEffet, effetEtabli: valeurs.length, valeursDistinctes: distincts.length, min: distincts[0] ?? null, max: distincts[distincts.length - 1] ?? null, valeurs: distincts.slice(0, 8) }];
}))]));
chrono('B');

// ---------- C. Aller-retour de e1 pour Suggérer, rejoué ----------
interface Cible { id: string; attendus: string[] }
const cibles: Cible[] = CATALOGUE.filter((h) => h.bm?.substituts && h.bm.substituts.length > 0).map((h) => ({
  id: h.id, attendus: [...new Set(h.bm!.substituts!.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && parId.has(x)))],
})).filter((c) => c.attendus.length > 0).sort((a, b) => (a.id < b.id ? -1 : 1));
const direction = (id: string): Partial<Record<FamilyId, number>> | null => {
  const d = m.describeFamilies(id);
  const f = FAMILIES.filter((x) => d[x].level !== 'non décrit').sort((a, b) => (d[b].level === 'marqué' ? 1 : 0) - (d[a].level === 'marqué' ? 1 : 0) || (d[b].sources / (d[b].of || 1)) - (d[a].sources / (d[a].of || 1)) || (FAMILIES.indexOf(a) - FAMILIES.indexOf(b)));
  const marquees = f.filter((x) => d[x].level === 'marqué');
  const choix = (marquees.length ? marquees : f.slice(0, 1)).slice(0, 3);
  return choix.length ? Object.fromEntries(choix.map((x) => [x, 1])) : null;
};
const eligibles = cibles.filter((c) => direction(c.id)).map((c) => c.id);
const PHARES = ['nelson-sauvin', 'citra', 'motueka', 'mosaic', 'galaxy', 'simcoe', 'saaz-cz', 'cascade', 'idaho-7'].map((s) => `beermaverick-${s}`);
const echant = [...new Set([...echantillon(eligibles, GRAINE, 60), ...PHARES.filter((p) => eligibles.includes(p))])].sort();
const BASE_NEUTRE: Recipe = { name: 'neutre', styleCode: '', volumeL: 20, og: 1.050, boilMin: 60, yeastId: 'fermentis-us05', additions: [] };
function allerRetour(mo: MomentId) {
  const lignes = echant.map((id) => {
    const dir = direction(id)!;
    const r = m.proposeVoies(BASE_NEUTRE, dir, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, moments: [mo], assemblages: false });
    const voies = r.voies.filter((v) => v.type === 'ajouter');
    const rangs = new Map<string, number>();
    for (const v of voies) { const k = v.actions[0].hopKey; if (!rangs.has(k) || v.rank < rangs.get(k)!) rangs.set(k, v.rank); }
    const tailles = new Map<number, number>();
    for (const rk of rangs.values()) tailles.set(rk, (tailles.get(rk) ?? 0) + 1);
    const moyen = (k: string): number | null => { const x = rangs.get(k); return x === undefined ? null : rangMoyenGroupe(x, tailles.get(x)!); };
    const rx = moyen(id), c = cibles.find((x) => x.id === id)!;
    const obs: Obs = { rangs: c.attendus.map((k) => { const x = moyen(k); return x === null ? null : rx !== null && rx < x ? x - 1 : x; }) };
    const premier = rangs.size ? Math.min(...rangs.values()) : 0;
    return { id, nListe: rangs.size, rangX: rx, premierGroupe: rangs.size ? tailles.get(premier)! : 0, distincts: tailles.size, obs, enTete: voies.length };
  });
  const avecListe = lignes.filter((l) => l.nListe > 0);
  return {
    houblons: lignes.length, aucuneVoie: lignes.length - avecListe.length,
    X: { dansLaListe: lignes.filter((l) => l.rangX !== null).length, rangMoyenMedian: mediane(lignes.filter((l) => l.rangX !== null).map((l) => l.rangX!)), dansLesDix: lignes.filter((l) => l.rangX !== null && l.rangX <= 10).length,
      premierGroupeMedian: mediane(avecListe.map((l) => l.premierGroupe)), groupesDistinctsMedian: mediane(avecListe.map((l) => l.distincts)), listeMediane: mediane(avecListe.map((l) => l.nListe)) },
    substitutsBM: resume(lignes.map((l) => l.obs)),
    absentsDeLaListe: (() => { let a = 0, t = 0; for (const l of lignes) for (const r of l.obs.rangs) { t++; if (r === null) a++; } return { absents: a, total: t }; })(),
  };
}
const partieC = { echantillon: echant.length, graine: GRAINE, dryActive: allerRetour('dryActive'), b60: allerRetour('b60') };
chrono('C');

// ---------- D. Ce qui pourrait départager : inventaire, et groupes d'ex æquo levés par chaque clé ----------
const mid = (r: [number, number] | null | undefined) => (r ? (r[0] + r[1]) / 2 : null);
const huileTotale = (h: (typeof CATALOGUE)[number]) => mid(h.hs?.totalOil) ?? mid(h.oil);
const nbComposantsHuile = (h: (typeof CATALOGUE)[number]) => (['myrcene', 'humulene', 'caryophyllene', 'farnesene'] as const).filter((o) => h.oils[o]).length + (h.hsLinalool ? 1 : 0);
const inventaire = {
  varietes: CATALOGUE.length,
  alpha: CATALOGUE.filter((h) => h.alpha).length, beta: CATALOGUE.filter((h) => h.beta).length, cohumulone: CATALOGUE.filter((h) => h.cohumulone).length,
  huileTotale: CATALOGUE.filter((h) => huileTotale(h) !== null).length,
  aumoins2ComposantsHuile: CATALOGUE.filter((h) => nbComposantsHuile(h) >= 2).length,
  linalolHopsteiner: CATALOGUE.filter((h) => h.hsLinalool).length, classeThiolHopsteiner: CATALOGUE.filter((h) => h.hsThiol).length,
  usage: CATALOGUE.filter((h) => h.purpose).length, radarBM: CATALOGUE.filter((h) => h.bm?.arome).length,
  fichesAvecMots: CATALOGUE.filter((h) => m.familyWords(h.id).sansFamille.length + FAMILIES.reduce((s, f) => s + m.familyWords(h.id).mots[f].length, 0) > 0).length,
};
// Pour chaque visée d'une famille (agrumes, tropical, résineux), parmi les variétés qui la citent : combien de groupes d'ex æquo
// avec les clés actuelles (cité / non cité : un seul), puis avec chaque clé candidate seule et avec leur cascade.
const cle = (id: string, f: FamilyId) => {
  const d = m.describeFamilies(id)[f], h = parId.get(id)!;
  return { marque: d.level === 'marqué' ? 1 : 0, premier: d.first ? 1 : 0, part: d.of ? d.sources / d.of : 0, huile: huileTotale(h), composants: nbComposantsHuile(h) };
};
const partieD = (['citrus', 'tropical', 'resin', 'floral'] as FamilyId[]).map((f) => {
  const ids = CATALOGUE.filter((h) => m.citations(h.id)[f].status === 'cité').map((h) => h.id);
  const ks = ids.map((id) => ({ id, ...cle(id, f) }));
  const distincts = (fn: (k: (typeof ks)[number]) => string) => new Set(ks.map(fn)).size;
  const cascade = [...ks].sort((a, b) => b.marque - a.marque || b.premier - a.premier || b.part - a.part || (b.huile ?? -1) - (a.huile ?? -1) || (a.id < b.id ? -1 : 1));
  return {
    famille: f, citent: ids.length, groupesAujourdhui: 1,
    cles: {
      marque: distincts((k) => String(k.marque)), premierDescripteur: distincts((k) => String(k.premier)), partDesFichesQuiLaCitent: distincts((k) => k.part.toFixed(2)),
      huileTotale: distincts((k) => String(k.huile)), huileTotaleAbsente: ks.filter((k) => k.huile === null).length,
      cascadeMarque_Premier_Part_Huile: distincts((k) => `${k.marque}|${k.premier}|${k.part.toFixed(2)}|${k.huile}`),
    },
    dixPremiersCascade: cascade.slice(0, 10).map((k) => ({ nom: nom(k.id), marque: k.marque, premier: k.premier, part: arrondi(k.part, 2), huile: k.huile })),
    dixPremiersAujourdhui: [...ids].map(nom).sort((a, b) => a.localeCompare(b, 'fr')).slice(0, 10),
  };
});
chrono('D');

const resultats = {
  diagnostic: { voie: 'g1-suggerer-moments', moteur: 'creerMoteur(fixtures) pour l’écran ; creerMoteur({catalogue, stock: []}) pour les mesures sur tout le pool', graine: GRAINE },
  A: partieA, B: partieB, C: partieC, D: { inventaire, parFamille: partieD },
};
const json = JSON.stringify(resultats, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'suggerer-moments.json'), json);
process.stdout.write(`sha256 ${createHash('sha256').update(json).digest('hex')}\n`);
