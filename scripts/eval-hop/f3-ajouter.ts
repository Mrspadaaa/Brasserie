// Voie f3-ajouter-diagnostic (D179) : pourquoi la liste « Ajouter — houblon… » met Citra cryo, Galaxy puis Pacific Sunrise.
//   npx vite-node scripts/eval-hop/f3-ajouter.ts -- [--sortie=<dossier>]
// Sorties : ajouter.json (déterministe : l'empreinte sha256 est imprimée) et durees.json (ms, non déterministe, hors empreinte).
// Rien dans src/ : le script ne fait que lire quickAdds() (la fonction de l'écran) et rejouer des variantes de tri sur ses lignes.
// Recettes : la 21C de f2 (20 L, Nugget 60′ + Cascade dry hop actif), la 21C « écran » (24 L, Nugget seul : 3 propositions et 12 g,
// comme la capture du brasseur) et la stout 16D (20 L, Nugget 46 g à 60′). Stock : celui des fixtures (Citra cryo 65 g, Galaxy 60 g…).
// Dégustation : celle de la 16D est la phrase réelle du brasseur du 18.10 (S1_TASTING) ; celle de la 21C est SIMULÉE (résine marquée),
// seulement pour exercer la clé « conflit avec la dégustation ».
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chargerCataloguePlein, CATALOGUE, DONNEES_FIXTURE, hopRef, type CatalogueHop, type StockHop } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { quickAdds, quickAddKey, QUICK_ADD_RULE, type QuickAdd } from '../../src/domain/hopIndex/v4/quickAdd';
import { searchDoses, recipeIbu, type Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';
import { tastingFrom, type Tasting } from '../../src/domain/hopIndex/v4/tasting';
import { ibuByMoment } from '../../src/domain/hopIndex/v4/ibuMoments';
import { FAMILY_NAMES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import bandes from '../../src/data/hopV4/style-bands.json';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.slice(9) ?? 'work/missions/2026-10-25-integration-houblons/voies/f3-ajouter-diagnostic');
const CLE = (id: string) => `beermaverick-${id}`;
const NUGGET = { id: 'a1', hopKey: CLE('nugget'), moment: 'b60' as const };
const RECETTES: { nom: string; style: string; r: Recipe }[] = [
  { nom: '21C f2 (20 L, Nugget 60′ + Cascade dry hop)', style: '21C', r: { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
    { ...NUGGET, grams: 20 }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] } },
  { nom: '21C écran (24 L, Nugget 20 g à 60′ seul)', style: '21C', r: { name: '21C', styleCode: '21C', volumeL: 24, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ ...NUGGET, grams: 20 }] } },
  // Reproduit la capture du brasseur (voir « reproductionCapture » : seules 21A, 22A et 18B donnent Citra cryo puis Galaxy ; 21A et 22A, Pacific Sunrise).
  { nom: '21A American IPA (24 L, Nugget 20 g à 60′ seul) : la capture', style: '21A', r: { name: '21A', styleCode: '21A', volumeL: 24, og: 1.065, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ ...NUGGET, grams: 20 }] } },
  { nom: '16D stout (20 L, Nugget 46 g à 60′)', style: '16D', r: { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ ...NUGGET, grams: 46 }] } },
];
const DEGUSTATIONS: Record<string, { nom: string; t: Tasting | null }[]> = {
  '21C': [{ nom: 'sans dégustation', t: null }, { nom: 'dégustation SIMULÉE : résine marquée', t: tastingFrom({ resin: 'marqué' }, { origin: 'simulée (f3)', date: '2026-10-26', quote: null, source: 'SIMULÉE pour la mesure' }) }],
  '21A': [{ nom: 'sans dégustation', t: null }, { nom: 'dégustation SIMULÉE : résine marquée', t: tastingFrom({ resin: 'marqué' }, { origin: 'simulée (f3)', date: '2026-10-26', quote: null, source: 'SIMULÉE pour la mesure' }) }],
  '16D': [{ nom: 'sans dégustation', t: null }, { nom: 'dégustation réelle du 18.10 : résine marquée (« trop résineuses »)', t: tastingFrom({ resin: 'marqué' }, { origin: 'parole du brasseur', date: '2026-10-18', quote: 'ma stout est trop résineuses, je la veux plus floral', source: 'brief-v4 § 1' }) }],
};
const PHARES = ['Citra', 'Nelson Sauvin', 'Motueka', 'Mosaic', 'Galaxy', 'Strata', 'Krush', 'Nectaron'];
const r1 = (x: number, n = 1) => Math.round(x * 10 ** n) / 10 ** n;

const plein: CatalogueHop[] = await chargerCataloguePlein();
const moteurAvec = (stock: StockHop[], catalogue: CatalogueHop[] = plein) => creerMoteur({ catalogue, stock });
const calcul = (m: ReturnType<typeof creerMoteur>, r: Recipe, style: string, t: Tasting | null) =>
  m.dans(() => quickAdds(r, getStyleScale(style), t, { catalogueLimit: 10000, aromatique: true }));

type Liste = 'stock' | 'épuisé' | 'à acheter';
interface Ligne extends QuickAdd { liste: Liste; pos: number }
/** Le même calcul sans l'article « Citra cryo » du stock : la variété Citra (pellets, à acheter) redevient candidate. */
const qSansCryo = (r: Recipe, style: string, t: Tasting | null) => calcul(moteurAvec(DONNEES_FIXTURE.stock.filter((s) => s.key !== `${CLE('citra')}:cryo`)), r, style, t);
type Statut = (f: FamilyId) => 'attendue' | 'neutre' | 'indésirable';
const pds = (x: QuickAdd, f: FamilyId) => (x.cited.find((c) => c.family === f)?.level === 'marqué' ? 2 : 1);
/** Variantes de tri rejouées sur les lignes de quickAdds : ce qui changerait si on corrigeait l'ordre (sans toucher à l'écran). */
const ALTERNATIVES: { nom: string; cle: (x: QuickAdd, st: Statut) => number[] }[] = [
  { nom: 'K0 actuelle', cle: (x) => quickAddKey(x) },
  // K1 : une famille neutre du style n'est pas un défaut ; seules les indésirables pèsent (D90 : « hors style » ne vise déjà que l'indésirable marquée).
  { nom: 'K1 seules les familles indésirables pèsent', cle: (x, st) => [FIT_RANK[x.fit], x.tastingConflicts.length ? 1 : 0, x.cited.filter((c) => st(c.family) === 'indésirable').reduce((s, c) => s + pds(x, c.family), 0), -x.supports.length, -x.stock.free] },
  // K2 : K1, et les familles attendues pèsent par leur niveau (marqué 2, cité 1), pas par leur nombre.
  { nom: 'K2 = K1 + attendues pondérées par le niveau', cle: (x, st) => [FIT_RANK[x.fit], x.tastingConflicts.length ? 1 : 0, x.cited.filter((c) => st(c.family) === 'indésirable').reduce((s, c) => s + pds(x, c.family), 0), -x.supports.reduce((s, f) => s + pds(x, f), 0), -x.stock.free] },
  // K3 : K2, les neutres reviennent après les attendues (un léger frein, jamais devant elles).
  { nom: 'K3 = K2 + neutres en frein après les attendues', cle: (x, st) => [FIT_RANK[x.fit], x.tastingConflicts.length ? 1 : 0, x.cited.filter((c) => st(c.family) === 'indésirable').reduce((s, c) => s + pds(x, c.family), 0), -x.supports.reduce((s, f) => s + pds(x, f), 0), x.cited.filter((c) => st(c.family) === 'neutre').reduce((s, c) => s + pds(x, c.family), 0), -x.stock.free] },
];
const FIT_RANK: Record<string, number> = { 'usage attesté': 0, cohérent: 1, 'peu documenté': 2, 'non documenté': 3, 'hors style': 4 };
/** L'ordre de l'écran : les disponibles, puis les épuisés, puis les « à acheter », chacun dans son rang. */
const lignes = (q: ReturnType<typeof quickAdds>): Ligne[] => [
  ...q.disponibles.map((r, i) => ({ ...r, liste: 'stock' as Liste, pos: i + 1 })),
  ...q.epuises.map((r, i) => ({ ...r, liste: 'épuisé' as Liste, pos: i + 1 })),
  ...q.catalogue.map((r, i) => ({ ...r, liste: 'à acheter' as Liste, pos: i + 1 }))];
/** Ce que montre Ajouter.tsx (l. 106-112) : n = 4 − ajouts, dont une place pour un « à acheter », les disponibles d'abord. */
const ecran = (q: ReturnType<typeof quickAdds>, nAjouts: number) => {
  const n = Math.max(0, 4 - nAjouts), pris = new Set<string>(), ca = q.catalogue.slice(0, 1);
  return { n, liste: [...q.disponibles.filter((r) => !pris.has(r.key)).slice(0, n - ca.length), ...ca] };
};
const cles = (r: QuickAdd) => quickAddKey(r);
/** Première clé de quickAddKey où a et b diffèrent (0 à 4), ou 5 : égalité, départagés par le nom. */
const decisive = (a: QuickAdd, b: QuickAdd) => { const ka = cles(a), kb = cles(b); const i = ka.findIndex((x, k) => x !== kb[k]); return i < 0 ? 5 : i; };
const NOM_CLE = ['usage (fit)', 'conflit dégustation', 'familles hors style', 'familles attendues citées', 'stock libre', 'égalité : le nom'];
const resume = (r: Ligne, suivant?: Ligne) => ({
  rang: r.rank, liste: r.liste, nom: r.name, cle: r.key, cles: cles(r), fit: r.fit,
  appuis: r.supports.map((f) => FAMILY_NAMES[f]), conflitsDegustation: r.tastingConflicts.map((f) => FAMILY_NAMES[f]), horsStylePoids: r.offStyleWeight,
  stockLibreG: r.stock.free, alphaPct: r.alpha?.value ?? null, alphaDe: r.alpha?.source ?? null, role: r.role.value, peuDeDonnees: r.peuDeDonnees ?? false,
  doseG: r.dose?.grams ?? null, doseRegle: r.dose?.rule ?? null, moment: r.momentLabel, ibu: r.ibuAdded?.value ?? null,
  ...(suivant ? { departageDuSuivantPar: NOM_CLE[decisive(r, suivant)] } : {}),
});
const idsDe = (motif: string) => plein.filter((h) => h.name === motif || h.name.startsWith(`${motif} `) && /cryo|lupulin|t-?90|pellet|incognito|hyper/i.test(h.name)).map((h) => h.id);

// ---------- Mesure par cas ----------
const cas = RECETTES.flatMap(({ nom, style, r }) => DEGUSTATIONS[style].map(({ nom: dnom, t }) => {
  const m = moteurAvec(DONNEES_FIXTURE.stock);
  const q = calcul(m, r, style, t);
  const L = lignes(q);
  const ec = ecran(q, r.additions.length);
  // 1. les 10 premiers
  // Les 10 premiers d'Ajouter : les disponibles (stock libre > 0) puis les « à acheter » (les épuisés ne sont proposés que par la recherche, l. 94).
  const ordreAjouter = L.filter((x) => x.liste !== 'épuisé');
  const dix = ordreAjouter.slice(0, 10).map((x, i) => resume(x, ordreAjouter[i + 1] && ordreAjouter[i + 1].liste === x.liste ? ordreAjouter[i + 1] : undefined));
  const dixAchats = L.filter((x) => x.liste === 'à acheter').slice(0, 10).map((x, i, a) => resume(x, a[i + 1]));
  const sc = getStyleScale(style), ibu0 = recipeIbu(r).value;
  const bande = sc.ibu ?? null;
  const depassent = ordreAjouter.slice(0, 10).filter((x) => bande && x.ibuAdded && ibu0 + x.ibuAdded.value > bande[1]).map((x) => x.name);
  // Variantes de tri (ordre seulement, rejouées sur les lignes de quickAdds) : voir ALTERNATIVES.
  const statutDe = (f: FamilyId) => sc.families[f].status;
  const alternatives = ALTERNATIVES.map((alt) => {
    const rangsDe = (xs: Ligne[]) => { const k = xs.map((x) => ({ x, k: alt.cle(x, statutDe) })); const cmpK = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
      k.sort((a, b) => cmpK(a.k, b.k) || Number(!!a.x.peuDeDonnees) - Number(!!b.x.peuDeDonnees) || a.x.name.localeCompare(b.x.name, 'fr'));
      return new Map(k.map((e) => [e.x.key, k.filter((o) => cmpK(o.k, e.k) < 0).length + 1])); };
    const dispo = L.filter((x) => x.liste === 'stock' && x.stock.free > 0), achat = L.filter((x) => x.liste === 'à acheter');
    const rd = rangsDe(dispo), ra = rangsDe(achat);
    const trie = (xs: Ligne[], rg: Map<string, number>) => [...xs].sort((a, b) => rg.get(a.key)! - rg.get(b.key)! || Number(!!a.peuDeDonnees) - Number(!!b.peuDeDonnees) || a.name.localeCompare(b.name, 'fr'));
    const d = trie(dispo, rd), a = trie(achat, ra);
    const nEc = Math.max(0, 4 - r.additions.length);
    const phares = PHARES.map((p) => { const ids = idsDe(p); const y = [...dispo, ...achat].filter((z) => ids.includes(z.key.replace(/:cryo$/, ''))); return { phare: p, rangs: y.map((z) => `${z.key.replace('beermaverick-', '')} ${z.liste === 'stock' ? 'stock' : 'achat'} r${(z.liste === 'stock' ? rd : ra).get(z.key)}`) }; });
    
    return { variante: alt.nom, ecran: [...d.slice(0, nEc - 1).map((x) => x.name), a[0]?.name], dispo: d.slice(0, 6).map((x) => `${rd.get(x.key)} ${x.name}`), achat: a.slice(0, 8).map((x) => `${ra.get(x.key)} ${x.name}`), phares };
  });
  // 2. Citra cryo : ablations
  const cryo = L.find((x) => x.key === `${CLE('citra')}:cryo`)!;
  const stockSeul = L.filter((x) => x.liste === 'stock');
  const memeStyle = stockSeul.filter((x) => cles(x).slice(0, 4).join() === cles(cryo).slice(0, 4).join());
  // ablation α : l'α du lot de Citra cryo à 5 % (le tri ne doit pas bouger s'il ne lit pas l'α)
  const stockAlpha = DONNEES_FIXTURE.stock.map((s) => (s.key === cryo.key ? { ...s, alpha: 5 } : s));
  const qAlpha = calcul(moteurAvec(stockAlpha), r, style, t);
  // ablation stock : tous les lots à 50 g (le stock ne départage plus)
  const stockEgal = DONNEES_FIXTURE.stock.map((s) => ({ ...s, grams: 50 }));
  const qEgal = calcul(moteurAvec(stockEgal), r, style, t);
  // ablation stock : aucun stock (tout le catalogue « à acheter », le tri ne garde que le style puis le nom)
  const qSans = calcul(moteurAvec([]), r, style, t);
  const tete = (qq: ReturnType<typeof quickAdds>) => lignes(qq).slice(0, 6).map((x) => `${x.rank}. ${x.name}`);
  // 4. coupes
  const candidatsStock = DONNEES_FIXTURE.stock.length;
  const varietesDuStock = new Set(DONNEES_FIXTURE.stock.map((s) => s.varietyId));
  const cacheesParStock = plein.filter((c) => varietesDuStock.has(c.id)).map((c) => c.id).filter((id) => !DONNEES_FIXTURE.stock.some((s) => s.key === id));
  const parFit = (xs: Ligne[]) => xs.reduce<Record<string, number>>((o, x) => ({ ...o, [x.fit]: (o[x.fit] ?? 0) + 1 }), {});
  const groupes1 = new Map<string, number>(); for (const x of L.filter((y) => y.liste === 'à acheter')) { const k = cles(x).join(); groupes1.set(k, (groupes1.get(k) ?? 0) + 1); }
  const tousAchat = L.filter((x) => x.liste === 'à acheter');
  const taillePremierAchat = tousAchat.filter((x) => cles(x).join() === cles(tousAchat[0]).join()).length;
  const tailleRang1Stock = stockSeul.filter((x) => x.rank === 1).length;
  // 5. phares
  const rangs = PHARES.map((p) => {
    const ids = idsDe(p);
    const sorties = ids.map((id) => {
      const x = L.find((y) => y.key === id || y.key === `${id}:cryo`);
      const vu = L.filter((y) => y.key.replace(/:cryo$/, '') === id);
      return vu.length ? vu.map((y) => ({ cle: y.key, liste: y.liste, rangDansSaListe: y.rank, positionDansSaListe: y.pos, positionDansLOrdreEcran: L.indexOf(y) + 1,
        surLaListeDeLEcran: ec.liste.some((e) => e.key === y.key), cles: cles(y), fit: y.fit, stockLibreG: y.stock.free, alphaPct: y.alpha?.value ?? null })) : [{ cle: id, absent: x ? false : 'caché avant le rang (voir coupes)' }];
    }).flat();
    return { phare: p, trouves: sorties };
  });
  return {
    recette: nom, degustation: dnom, style,
    tastingTrop: q.tastingTrop,
    ecran: { n: ec.n, propositions: ec.liste.map((x) => ({ nom: x.name, liste: x.stock.status, rang: x.rank, doseG: x.dose?.grams, moment: x.momentLabel, ibu: x.ibuAdded?.value, alpha: x.alpha?.value })) },
    dix, dixAchats,
    ibuRecette: { avantAjout: r1(ibu0), bandeStyle: bande, premiersDontLAjoutDepasseLeHautDeBande: depassent },
    alternatives,
    citraCryo: {
      memesClesQueLaVariete: (() => { const s = lignes(qSansCryo(r, style, t)).find((x) => x.key === CLE('citra')); return s ? { cle: s.key, cles: cles(s), cryo: cles(cryo), clesDeStyleIdentiques: cles(s).slice(0, 4).join() === cles(cryo).slice(0, 4).join() } : null; })(),
      cles: cles(cryo), fit: cryo.fit, appuis: cryo.supports.map((f) => FAMILY_NAMES[f]), stockLibreG: cryo.stock.free, alphaLot: cryo.alpha?.value,
      memesClesDeStyleEnStock: memeStyle.map((x) => ({ nom: x.name, stockLibreG: x.stock.free, rang: x.rank })),
      rangSiAlphaLotA5: lignes(qAlpha).find((x) => x.key === cryo.key)?.rank, teteSiAlphaLotA5: tete(qAlpha),
      teteSiStocksEgaux50g: tete(qEgal), teteSansStockDuTout: tete(qSans),
    },
    dose: { regle: QUICK_ADD_RULE[3], graineGParL: searchDoses('b10')[0], doseTheoriqueG: r1(searchDoses('b10')[0] * r.volumeL, 2),
      dosesDistinctes: [...new Set(L.map((x) => x.dose?.grams))], momentsDistincts: [...new Set(L.map((x) => x.momentLabel))],
      limiteesParLeStockLibre: L.filter((x) => x.dose?.rule === 'stock libre').map((x) => `${x.name} ${x.stock.free} g`) },
    coupes: {
      catalogueEntrant: plein.length, candidatsStock, candidatsAchat: tousAchat.length, total: L.length,
      varietesCacheesParLeStock: cacheesParStock, // une variété hors forme dont une forme est en stock (Citra pour Citra cryo)
      disponibles: q.disponibles.length, epuises: q.epuises.length, aAcheter: tousAchat.length,
      fitDisponibles: parFit(L.filter((x) => x.liste === 'stock' && x.stock.free > 0)), fitAAcheter: parFit(tousAchat),
      affichesSurLEcran: ec.liste.length, nonAffiches: L.length - ec.liste.length,
      premierAAcheterEgalesDansSonRang: taillePremierAchat, disponiblesAuRang1: tailleRang1Stock,
      groupesDeClesIdentiquesParmiLesAAcheter: groupes1.size,
    },
    phares: rangs,
  };
}));

// ---------- Reproduction de la capture : quels styles donnent « Citra cryo, Galaxy, Pacific Sunrise » (Nugget seul, 24 L, stock des fixtures) ? ----------
const styles = Object.keys((bandes as { styles: Record<string, unknown> }).styles);
const balayage = styles.flatMap((code) => (['sans', 'resine'] as const).map((d) => {
  const r: Recipe = { name: code, styleCode: code, volumeL: 24, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ ...NUGGET, grams: 20 }] };
  const t = d === 'sans' ? null : tastingFrom({ resin: 'marqué' }, { origin: 'simulée (f3)', date: '2026-10-26', quote: null, source: 'SIMULÉE' });
  const q = calcul(moteurAvec(DONNEES_FIXTURE.stock), r, code, t);
  return { style: code, nom: getStyleScale(code).name, degustation: d, ecran: ecran(q, 1).liste.map((x) => `${x.name}${x.stock.status === 'à acheter' ? ' (à acheter)' : ''} ${x.dose?.grams} g +${x.ibuAdded?.value}`) };
}));
const correspond = balayage.filter((b) => b.ecran[0]?.startsWith('Citra cryo') && b.ecran[1]?.startsWith('Galaxy'));

// ---------- Durées (hors empreinte) ----------
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const durees = (['base 317', 'plein 505'] as const).map((jeu) => {
  const cat = jeu === 'base 317' ? CATALOGUE : plein;
  const r = RECETTES[1].r;
  const t0 = performance.now(); const m = moteurAvec(DONNEES_FIXTURE.stock, cat); calcul(m, r, '21C', null); const froid = performance.now() - t0;
  const chaud: number[] = [];
  for (let i = 0; i < 9; i++) { const rr = { ...r, og: 1.058 + i / 1000 }; const a = performance.now(); calcul(m, rr, '21C', null); chaud.push(performance.now() - a); }
  // Part de ibuByMoment (l. 106 de quickAdd.ts : calculé pour chaque ligne, puis supprimé des épuisés et du catalogue, l. 119).
  const ibuMs: number[] = [];
  for (let i = 0; i < 9; i++) { const a = performance.now(); m.dans(() => { for (const h of cat) ibuByMoment(h.id, 12, r); }); ibuMs.push(performance.now() - a); }
  const ordre: number[] = [];
  const q0 = calcul(m, r, '21C', null); const L0 = lignes(q0); const fam21 = getStyleScale('21C').families; const st21: Statut = (f) => fam21[f].status;
  for (let i = 0; i < 9; i++) { const a = performance.now(); for (const alt of ALTERNATIVES) { const k = L0.map((x) => alt.cle(x, st21)); k.sort((p, s) => { for (let j = 0; j < p.length; j++) if (p[j] !== s[j]) return p[j] - s[j]; return 0; }); } ordre.push((performance.now() - a) / ALTERNATIVES.length); }
  return { catalogue: `${jeu} (${cat.length} variétés)`, premierCalculAvecContexteMs: r1(froid, 0), recetteNouvelleMedianeMs: r1(med(chaud), 1), min: r1(Math.min(...chaud), 1), max: r1(Math.max(...chaud), 1),
    dontIbuParMomentPourToutesLesLignesMs: r1(med(ibuMs), 1), triParVarianteSurToutesLesLignesMs: r1(med(ordre), 2) };
});

mkdirSync(SORTIE, { recursive: true });
const corps = JSON.stringify({ cas, reproductionCapture: { cible: 'Citra cryo, Galaxy, Pacific Sunrise (à acheter)', correspondances: correspond, balayage } }, null, 1);
writeFileSync(join(SORTIE, 'ajouter.json'), corps);
writeFileSync(join(SORTIE, 'durees.json'), JSON.stringify({ durees, note: 'ms, vite-node, non déterministe' }, null, 1));
console.log('empreinte', createHash('sha256').update(corps).digest('hex').slice(0, 16));
for (const c of cas) {
  console.log(`\n=== ${c.recette} | ${c.degustation}`);
  console.log('écran :', c.ecran.propositions.map((p) => `${p.nom} [${p.liste}, rang ${p.rang}] ${p.doseG} g ${p.moment} +${p.ibu} IBU α${p.alpha}`).join(' | '));
  for (const d of c.dix) console.log(' ', d.rang, d.liste, d.nom, JSON.stringify(d.cles), d.fit, `α${d.alphaPct}`, d.role, 'dép.', d.departageDuSuivantPar ?? '-');
  console.log('  achats :', c.dixAchats.map((d) => `${d.rang} ${d.nom} ${JSON.stringify(d.cles)}${d.peuDeDonnees ? ' (peu de données)' : ''}`).join(' ; '));
  console.log('IBU :', JSON.stringify(c.ibuRecette), 'Citra simple :', JSON.stringify(c.citraCryo.memesClesQueLaVariete));
  for (const a of c.alternatives) console.log(' ', a.variante, 'écran:', a.ecran.join(' | '), '\n     stock:', a.dispo.join(' ; '), '\n     achat:', a.achat.join(' ; '), '\n     phares:', a.phares.map((p) => `${p.phare}→${p.rangs.join('/')}`).join(' ; '));
  console.log('cryo :', JSON.stringify(c.citraCryo.memesClesDeStyleEnStock.map((x) => `${x.nom} ${x.stockLibreG}g r${x.rang}`)), 'α5 → rang', c.citraCryo.rangSiAlphaLotA5);
  console.log('  stocks égaux :', c.citraCryo.teteSiStocksEgaux50g.join(' ; '));
  console.log('  sans stock :', c.citraCryo.teteSansStockDuTout.join(' ; '));
  console.log('dose :', JSON.stringify(c.dose));
  console.log('coupes :', JSON.stringify(c.coupes));
  for (const p of c.phares) console.log(' phare', p.phare, JSON.stringify(p.trouves.map((t) => 'absent' in t ? t : `${t.cle} ${t.liste} r${t.rangDansSaListe} pos${t.positionDansLOrdreEcran} écran:${t.surLaListeDeLEcran} ${t.fit} ${t.cles.join('/')}`)));
}
console.log('\ncapture : styles dont l’écran commence par Citra cryo puis Galaxy :', JSON.stringify(correspond));
for (const b of balayage.filter((x) => x.degustation === 'sans')) console.log(' ', b.style, b.nom, '→', b.ecran.join(' | '));
console.log('\ndurées', JSON.stringify(durees));
void hopRef;
