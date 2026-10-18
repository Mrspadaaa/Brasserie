// Fiche détaillée d'un houblon (appui long, survol long) : uniquement des données du dépôt, sourcées ;
// null avec une raison quand la donnée manque. Aucune valeur inventée.
import { STOCK, hopRef } from './data';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { describeFamilies } from './hops';
import { additionIbu, MOMENTS, type Recipe } from './recipe';
import { ibuByMoment } from './ibuMoments';
import { goutsSets, type Gouts } from './gouts';

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
    aromes: FAMILIES.map((f: FamilyId) => ({ family: f, name: FAMILY_NAMES[f], level: desc[f].level === 'marqué' ? 2 : desc[f].level === 'cité' ? 1 : 0, label: desc[f].level, sources: desc[f].sources, of: desc[f].of, authors: desc[f].authors })),
    descripteurs: { beerMaverick: c.tagsFr, hopsteiner: c.descriptions.filter((d) => d.source.author === 'Hopsteiner').map((d) => d.text),
      cites: c.descriptions.filter((d) => d.source.author !== 'Hopsteiner' && d.source.author !== 'Beer Maverick').map((d) => ({ text: d.text, author: d.source.author, url: d.source.reference })) },
    substituts: null, substitutsRaison: 'Aucune donnée de substitution dans le dépôt (les scores de substitution de Beer Maverick n’ont pas été importés).',
    stock: { grams: s ? s.grams : 0, etat: !s ? 'hors stock' : s.grams <= 0 ? 'épuisé' : 'en stock',
      libre: Object.fromEntries(ctx.recipes.map(({ scenario, recipe }) => [scenario, s ? Math.round((s.grams - recipe.additions.filter((a) => a.hopKey === key).reduce((t, a) => t + a.grams, 0)) * 10) / 10 : null])) },
    dansRecette: ctx.recipes.flatMap(({ scenario, recipe }) => recipe.additions.filter((a) => a.hopKey === key).map((a) => {
      const ibu = additionIbu(a, recipe);
      const cold = MOMENTS[a.moment].timing === 'fermentation' || MOMENTS[a.moment].timing === 'postFermentation';
      return { scenario, additionId: a.id, moment: a.moment, momentLabel: MOMENTS[a.moment].label, ...(a.day ? { jour: `J+${a.day}` } : {}), grams: a.grams, ibu: cold ? null : Math.round(ibu.value * 10) / 10 };
    })),
    ibuParGramme: { base: `${ctx.ibuBase.volumeL} L, DI ${ctx.ibuBase.og.toLocaleString('fr-CH', { minimumFractionDigits: 3 })}, ébullition ${ctx.ibuBase.boilMin} min`,
      moments: ibuByMoment(key, 1, ctx.ibuBase).map((m) => ({ code: m.code, ibuPerGram: m.ibuPerGram, ...(m.raison ? { raison: m.raison } : {}) })) },
    gout: { aime: liked.has(key) || liked.has(h.varietyId), exclu: excludedVarieties.has(h.varietyId) },
  };
}
export const sheetKeys = (keys: string[]) => [...new Set(keys)].filter((k) => !!hopRef(k)).sort((a, b) => hopRef(a)!.name.localeCompare(hopRef(b)!.name, 'fr'));
export const stockKeyOf = (varietyId: string) => STOCK.find((s) => s.varietyId === varietyId)?.key ?? varietyId;
