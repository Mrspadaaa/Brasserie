// Fiche détaillée d'un houblon (appui long, survol long) : uniquement des données du dépôt, sourcées ;
// null avec une raison quand la donnée manque. Aucune valeur inventée.
import { stock as stockDuMoteur, hopRef } from './data';
import { nombreFr } from './nombres';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { describeFamilies, familyWords } from './hops';
import { additionIbu, MOMENTS, type Recipe } from './recipe';
import { ibuByMoment } from './ibuMoments';
import { goutsSets, type Gouts } from './gouts';
import { SUBSTITUTION_METHOD, substitutes, type Substitute } from './substitution';

type Span = [number, number] | null;
interface SourcedRange { source: string; min: number; max: number; annee: number | null; url: string | null }
const overlap = (rows: SourcedRange[]): 'identiques' | 'recouvrantes' | 'disjointes' | null => {
  if (rows.length < 2) return null;
  const [a, b] = rows;
  if (a.min === b.min && a.max === b.max) return 'identiques';
  return Math.max(a.min, b.min) <= Math.min(a.max, b.max) ? 'recouvrantes' : 'disjointes';
};
const rows = (bm: Span, bmYear: number | null, bmUrl: string | null, hs: Span, hsYear: number | null, hsUrl: string | null): SourcedRange[] => [
  ...(bm ? [{ source: 'Beer Maverick', min: bm[0], max: bm[1], annee: bmYear, url: bmUrl }] : []),
  ...(hs ? [{ source: 'Hopsteiner', min: hs[0], max: hs[1], annee: hsYear, url: hsUrl }] : []),
];

export interface HopSheetContext { recipes: { scenario: string; recipe: Recipe }[]; ibuBase: Recipe; gouts?: Gouts }

export function hopSheet(key: string, ctx: HopSheetContext) {
  const h = hopRef(key);
  if (!h) throw Error(`Houblon inconnu : ${key}`);
  const c = h.catalogue, hs = c.hs;
  const alphaRows = rows(c.alpha, c.bmYear, c.url, hs?.alpha ?? null, hs?.year ?? null, hs?.reference ?? null);
  const betaRows = rows(c.beta, c.bmYear, c.url, hs?.beta ?? null, hs?.year ?? null, hs?.reference ?? null);
  const oilRows = rows(c.oil, c.bmYear, c.url, hs?.totalOil ?? null, hs?.year ?? null, hs?.reference ?? null);
  const comp = (r: Span) => (r ? { min: r[0], max: r[1], unite: '% de l’huile', source: 'Beer Maverick', annee: c.bmYear, url: c.url } : null);
  const desc = describeFamilies(h.varietyId);
  const mots = familyWords(h.varietyId, c);
  const s = h.stock;
  const { excludedVarieties, liked } = goutsSets(ctx.gouts);
  return {
    key, name: h.name, origin: c.origin,
    usage: c.usage ?? null, ...(c.usage ? {} : { usageRaison: 'Aucun usage attesté dans le dépôt (usages fournisseurs connus pour les IPA seulement).' }),
    alpha: { unite: '% masse', sources: alphaRows, divergence: overlap(alphaRows),
      retenu: h.alpha ? { value: h.alpha.value, min: h.alpha.min, max: h.alpha.max, from: h.alpha.from } : null },
    beta: { unite: '% masse', sources: betaRows, divergence: overlap(betaRows) },
    huiles: {
      totale: { unite: 'mL/100 g', sources: oilRows, divergence: overlap(oilRows) },
      composants: {
        myrcene: comp(c.oils.myrcene), humulene: comp(c.oils.humulene), caryophyllene: comp(c.oils.caryophyllene),
        farnesene: null, farneseneRaison: 'Publié par Beer Maverick, non importé dans le dépôt.',
        linalool: c.hsLinalool ? { min: c.hsLinalool.range[0], max: c.hsLinalool.range[1], unite: '% de l’huile', source: 'Hopsteiner', annee: c.hsLinalool.year, url: c.hsLinalool.reference } : null,
      },
    },
    // #140 : les mots des fiches qui font chaque famille, et les fiches qui la nomment en premier.
    aromes: FAMILIES.map((f: FamilyId) => ({ family: f, name: FAMILY_NAMES[f], level: desc[f].level === 'marqué' ? 2 : desc[f].level === 'cité' ? 1 : 0, label: desc[f].level, sources: desc[f].sources, of: desc[f].of, authors: desc[f].authors, mots: mots.mots[f], premier: mots.premier[f] })),
    motsSansFamille: mots.sansFamille,
    descripteurs: { beerMaverick: c.tagsFr, hopsteiner: c.descriptions.filter((d) => d.source.author === 'Hopsteiner').map((d) => d.text),
      cites: c.descriptions.filter((d) => d.source.author !== 'Hopsteiner' && d.source.author !== 'Beer Maverick').map((d) => ({ text: d.text, author: d.source.author, url: d.source.reference })) },
    substituts: null, substitutsRaison: 'Aucune donnée de substitution dans le dépôt (les scores de substitution de Beer Maverick n’ont pas été importés). Remplaçants calculés depuis les fiches du dépôt : substitutsCalcules.',
    substitutsCalcules: computedSubstitutes(key, ctx),
    stock: { grams: s ? s.grams : 0, etat: !s ? 'hors stock' : s.grams <= 0 ? 'épuisé' : 'en stock',
      libre: Object.fromEntries(ctx.recipes.map(({ scenario, recipe }) => [scenario, s ? Math.round((s.grams - recipe.additions.filter((a) => a.hopKey === key).reduce((t, a) => t + a.grams, 0)) * 10) / 10 : null])) },
    dansRecette: ctx.recipes.flatMap(({ scenario, recipe }) => recipe.additions.filter((a) => a.hopKey === key).map((a) => {
      const ibu = additionIbu(a, recipe);
      const cold = MOMENTS[a.moment].timing === 'fermentation' || MOMENTS[a.moment].timing === 'postFermentation';
      return { scenario, additionId: a.id, moment: a.moment, momentLabel: MOMENTS[a.moment].label, ...(a.day ? { jour: `J+${a.day}` } : {}), grams: a.grams, ibu: cold ? null : Math.round(ibu.value * 10) / 10 };
    })),
    ibuParGramme: { base: `${ctx.ibuBase.volumeL} L, DI ${nombreFr(ctx.ibuBase.og, { minimumFractionDigits: 3 })}, ébullition ${ctx.ibuBase.boilMin} min`,
      moments: ibuByMoment(key, 1, ctx.ibuBase).map((m) => ({ code: m.code, ibuPerGram: m.ibuPerGram, ...(m.raison ? { raison: m.raison } : {}) })) },
    gout: { aime: liked.has(key) || liked.has(h.varietyId), exclu: excludedVarieties.has(h.varietyId) },
  };
}
/** Remplaçants calculés d'une fiche (top 5, et les 3 meilleurs du stock, « en stock d'abord »).
 * Référence de dose : premier ajout du houblon dans une recette des scénarios (son moment règle aussi les
 * poids : Nugget à 60′ → amertume) ; sinon 1 g à 60′ sur la base d'IBU, poids par défaut. */
function computedSubstitutes(key: string, ctx: HopSheetContext) {
  const use = ctx.recipes.flatMap(({ scenario, recipe }) => recipe.additions.filter((a) => a.hopKey === key).map((a) => ({ scenario, recipe, moment: a.moment, grams: a.grams })))[0] ?? null;
  const opts = use ? { moment: use.moment, grams: use.grams, recipe: use.recipe } : { moment: 'b60' as const, grams: 1, recipe: ctx.ibuBase, context: 'défaut' as const };
  const all = substitutes(key, opts), stockFirst = substitutes(key, { ...opts, stockFirst: true });
  const generalRank = new Map(all.remplacants.map((s) => [s.key, s.rank]));
  const compact = (s: Substitute) => ({
    rang: s.rank, key: s.key, name: s.name, score: s.score, palier: s.palier, composantes: s.composantes, couverture: s.couverture,
    gagne: s.familles.gagne, perd: s.familles.perd,
    dose: { grams: s.dose.grams, min: s.dose.min, max: s.dose.max, regle: s.dose.regle, ...(s.dose.raison ? { raison: s.dose.raison } : {}) },
    stock: s.stock, ...(s.memeVariete ? { memeVariete: true } : {}), ...(s.amertumeDeconseillee ? { amertumeDeconseillee: s.amertumeDeconseillee } : {}), raison: s.raison,
  });
  return {
    methode: SUBSTITUTION_METHOD.nom, date: SUBSTITUTION_METHOD.date, statut: SUBSTITUTION_METHOD.statut,
    contexte: all.contexte, poids: all.poids,
    reference: { scenario: use?.scenario ?? null, moment: all.reference.moment, momentLabel: all.reference.momentLabel, grams: all.reference.grams, ibu: all.reference.ibu,
      base: use ? `ajout de la recette ${use.scenario}` : `1 g à 60′ (${ctx.ibuBase.volumeL} L, DI ${nombreFr(ctx.ibuBase.og, { minimumFractionDigits: 3 })}) : la dose se lit en g par g` },
    candidats: all.candidats, manque: all.manque,
    remplacants: all.remplacants.slice(0, 5).map(compact),
    enStock: stockFirst.remplacants.filter((s) => s.stock.etat === 'en stock').slice(0, 3).map((s) => ({ ...compact(s), rangGeneral: generalRank.get(s.key)! })),
  };
}
export const sheetKeys = (keys: string[]) => [...new Set(keys)].filter((k) => !!hopRef(k)).sort((a, b) => hopRef(a)!.name.localeCompare(hopRef(b)!.name, 'fr'));
export const stockKeyOf = (varietyId: string) => stockDuMoteur().find((s) => s.varietyId === varietyId)?.key ?? varietyId;
