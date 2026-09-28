import { assertHopKnowledge, type HopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import type { YeastCatalogueFact, YeastFactKey } from '../../functions/src/yeastCatalogueSchema';
import type { TrialRecipe } from './hopIndex/trials';
import type { YeastSpec } from '../types';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';

export const YEAST_FACT_LABELS: Record<YeastFactKey, string> = {
  temperature: 'Fermentation', attenuation: 'Atténuation apparente', alcoholTolerance: 'Tolérance à l’alcool', pitchRate: 'Ensemencement', fermentationTime: 'Durée de fermentation', flocculation: 'Floculation', pof: 'Phénols · POF', sta1: 'Gène STA1', diastatic: 'Caractère diastatique', betaLyase: 'β-lyase · thiols', biotransformation: 'Biotransformation', species: 'Espèce / culture', aroma: 'Arômes décrits', esters: 'Esters', higherAlcohols: 'Alcools supérieurs', h2s: 'H₂S', styles: 'Styles cités', application: 'Usage', form: 'Forme', availability: 'Disponibilité déclarée', nutrientNeed: 'Besoins nutritifs', ph: 'pH', residualSugar: 'Sucres résiduels', fermentationRate: 'Vitesse de fermentation', foam: 'Mousse', so2: 'SO₂', volatileAcidity: 'Acidité volatile', glycerol: 'Glycérol', malolacticCompatibility: 'Compatibilité malolactique'
};
export const normalizedYeastText = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const translations: Record<string,string> = { banane:'banana', girofle:'clove', phenols:'phenolic', epices:'spice', seche:'dry', liquide:'liquid', levure:'yeast' };
const compactYeastText = (s: string) => normalizedYeastText(s).replace(/ /g, '');
const letterDigitRuns = (word: string) => word.match(/[a-z]+|[0-9]+/g) ?? [];
/** Keys shared by the usual spellings of one printed identity: "US-05", "us05", "US 05", "W-34/70". */
function identityKeys(phrase: string) {
  const words = normalizedYeastText(phrase).split(' ').filter(Boolean);
  return words.flatMap((word, at) => [word, ...letterDigitRuns(word),
    ...[2, 3, 4].filter(size => at + size <= words.length).map(size => words.slice(at, at + size).join(''))]);
}
export type YeastSearchIndex = { phrases: Set<string>; keys: string[]; keySet: Set<string>; text: string };
export type YeastSearchIdentity = {
  id?: string;
  name: string;
  manufacturer?: string;
  productCode?: string | null;
  aliases?: readonly string[];
  /** Search hints only. They never add a product identity or an equivalence. */
  descriptive?: readonly string[];
};
/** Build the shared name / maker / printed-code index for catalogue and stock rows. */
export function yeastIdentitySearchIndex(identity: YeastSearchIdentity, extra: { names?: string[]; makers?: string[]; descriptive?: string[] } = {}): YeastSearchIndex {
  const names = [identity.name, identity.productCode ?? '', ...(identity.aliases ?? []), ...(extra.names ?? [])].filter(Boolean);
  const makers = [identity.manufacturer ?? '', ...(extra.makers ?? [])].filter(Boolean);
  const phrases = [...names, ...makers.flatMap(maker => names.map(name => `${maker} ${name}`))];
  const keys = [...new Set([...makers, ...names].flatMap(identityKeys))];
  const text = normalizedYeastText([identity.id ?? '', ...makers, ...names, ...(identity.descriptive ?? []), ...(extra.descriptive ?? [])].join(' '));
  return { phrases: new Set(phrases.map(compactYeastText).filter(Boolean)), keys, keySet: new Set(keys), text };
}
/** Name, maker, printed code and aliases are identity; categories and reported facts are descriptive text.
 * One index per reference: homonyms keep their own row, id and sources. */
export function yeastSearchIndex(yeast: HopYeast & { aliases?: string[] }, extra: { names?: string[]; makers?: string[]; descriptive?: string[] } = {}): YeastSearchIndex {
  const catalogue = yeast.catalogue;
  return yeastIdentitySearchIndex({
    id: yeast.id,
    name: yeast.name,
    manufacturer: catalogue?.manufacturer,
    productCode: catalogue?.productCode,
    aliases: [...(yeast.aliases ?? []), ...(catalogue?.aliases ?? [])],
    // Source product IDs and descriptive facts help locate a row, but score
    // below every manufacturer name, printed code and alias.
    descriptive: [catalogue?.productId ?? '', yeast.form ?? '', ...(catalogue?.categories ?? []),
      ...(catalogue?.facts ?? []).map(f => f.reported)]
  }, extra);
}
/** Optimal string alignment distance \u2264 1: one insertion, deletion, substitution or adjacent swap. */
function withinOneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let at = 0; while (at < a.length && a[at] === b[at]) at++;
  if (a.length === b.length) return a.slice(at + 1) === b.slice(at + 1)
    || (a[at] === b[at + 1] && a[at + 1] === b[at] && a.slice(at + 2) === b.slice(at + 2));
  return a.length > b.length ? a.slice(at + 1) === b.slice(at) : a.slice(at) === b.slice(at + 1);
}
const nearIdentityWord = (term: string, key: string) => [term.length - 1, term.length, term.length + 1]
  .some(length => length >= 3 && length <= key.length && withinOneEdit(term, key.slice(0, length)));
function termScore(index: YeastSearchIndex, term: string) {
  if (index.keySet.has(term)) return 10;
  if (index.keys.some(key => key.startsWith(term))) return 7;
  // A typo is tolerated in a word, never in a code: "1056" and "1065" are distinct products.
  if (term.length >= 4 && /^[a-z]+$/.test(term) && index.keys.some(key => /^[a-z]+$/.test(key) && nearIdentityWord(term, key))) return 4;
  const translated = translations[term];
  return index.text.includes(term) || (!!translated && index.text.includes(translated)) ? 1 : 0;
}
/** 0 when a term is missing. Exact identity > identity word or code (prefix, one typo) > descriptive text. */
export function yeastSearchScore(index: YeastSearchIndex, query: string) {
  const terms = normalizedYeastText(query).split(' ').filter(Boolean);
  if (!terms.length) return 0;
  if (index.phrases.has(terms.join(''))) return 10_000;
  let weakest = Infinity, total = 0;
  for (const term of terms) {
    const score = termScore(index, term);
    if (!score) return 0;
    weakest = Math.min(weakest, score); total += score;
  }
  return weakest * 100 + total;
}
export function catalogueMatches(yeast: HopYeast, query: string) {
  return !normalizedYeastText(query) || yeastSearchScore(yeastSearchIndex(yeast), query) > 0;
}
/** Same displayed product name once separators, word order and the maker's own name are ignored. */
export function yeastHomonymKey(label: string, maker = '') {
  const makerWords = new Set(normalizedYeastText(maker).split(' '));
  return normalizedYeastText(label).split(' ').filter(word => word && !makerWords.has(word)).flatMap(letterDigitRuns).sort().join(' ');
}
/** Conflicting or qualified values remain separate; no midpoint or merged envelope is invented. */
export function catalogueFacts(yeast: HopYeast, key?: YeastFactKey): YeastCatalogueFact[] {
  const facts = (yeast.catalogue?.facts ?? []).filter(f=>!key || f.key===key);
  return [...new Map(facts.map(f=>[JSON.stringify([f.key,f.reported,f.context,f.range]),f])).values()];
}
export function catalogueYeasts(knowledge: HopKnowledge[]): HopYeast[] {
  return knowledge.filter((k): k is HopYeast => {
    try {
      // `yeastReferences` adds an internal aliases index to its HopYeast
      // rows. Validate the persisted HopKnowledge shape without rejecting
      // that non-persisted helper field.
      const { aliases: _aliases, ...persisted } = k as HopYeast & { aliases?: string[] };
      assertHopKnowledge(persisted);
      return persisted.kind === 'yeast' && !!persisted.catalogue;
    } catch { return false; }
  });
}
/** Feed documented conditions to the triplet guide only when the sources agree. */
export function catalogueSolverFacts(knowledge: HopKnowledge[]) {
  const yeastPhenols: {yeastId:string;status:'positive'|'negative';source:YeastCatalogueFact['source']}[]=[], yeastConditions: {yeastId:string;temperatureC:NonNullable<YeastCatalogueFact['range']>;source:YeastCatalogueFact['source']}[]=[];
  for(const yeast of catalogueYeasts(knowledge)){
    const facts=catalogueFacts(yeast);
    const phenols=facts.filter(f=>f.key==='pof').map(f=>({f,status:/^(?:positive|yes|phenolic|pof\s*\+|\+)$/i.test(f.reported.trim())?'positive':/^(?:negative|no|non[ -]?phenolic|pof\s*[-−]|[-−])$/i.test(f.reported.trim())?'negative':undefined}));
    if(phenols.length&&phenols.every(p=>p.status&&p.status===phenols[0].status))yeastPhenols.push({yeastId:yeast.id,status:phenols[0].status as 'positive'|'negative',source:phenols[0].f.source});
    else if (phenols.some(p => p.status === 'positive') && phenols.some(p => p.status === 'negative')) {
      for (const p of phenols) if (p.status) yeastPhenols.push({yeastId:yeast.id,status:p.status as 'positive'|'negative',source:p.f.source});
    }
    const temperature = agreedFermentationFact(yeast, 'temperature', '°C');
    if(temperature)yeastConditions.push({yeastId:yeast.id,temperatureC:temperature.range,source:temperature.source});
  }
  return {yeastPhenols,yeastConditions};
}
export function applyCatalogueYeast<T extends TrialRecipe>(recipe: T, yeast: HopYeast, form: YeastSpec['form']): T {
  // Applying a reference is explicit. Never carry a previous strain's pitch, attenuation or schedule claim.
  const same = recipe.yeast.hopIndexId === yeast.id && recipe.yeast.form === form;
  const next: YeastSpec = same ? { ...recipe.yeast, form } : { name: yeast.name, hopIndexId: yeast.id, lab: yeast.catalogue?.manufacturer, strain: yeast.catalogue?.productCode ?? undefined, form, qty: 0, unit: form === 'sèche' ? 'g' : 'mL', notes: `Référence fabricant : ${yeast.source.reference}. Quantité et conduite à définir pour le moût.` };
  return { ...recipe, yeast: next, yeastDesign: same ? recipe.yeastDesign : undefined, yeastGuide: undefined, hopPredictionIds: undefined, hopTrialId: undefined, hopMatrixId: undefined };
}
