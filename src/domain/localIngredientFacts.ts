import type { Fermentable, HopIngredient, StockItem, YeastSpec } from '../types';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import { applyMaltFacts, applyHopFacts, applyYeastFacts, factsFromStock, ingredientKey, type IngredientFacts } from './ingredientFacts';
import { yeastReferences } from './yeastReferences';
import { resolveFermentationYeast } from './fermentationScenario';
import type { TrialRecipe } from './hopIndex/trials';
import { noloScience } from './nolo';

export function localYeastFacts(yeast: YeastSpec, knowledge: HopKnowledge[]): IngredientFacts | undefined {
  const ref = resolveFermentationYeast({yeast} as TrialRecipe, yeastReferences(knowledge));
  if (!ref) return;
  const temp = agreedFermentationFact(ref, 'temperature', '°C');
  const attenuation = agreedFermentationFact(ref, 'attenuation', '%');
  const pitch = agreedFermentationFact(ref, 'pitchRate', 'g/hL');
  const pofs = ref.catalogue?.facts.filter(f=>f.key==='pof').map(f=>f.reported.toLowerCase()) ?? [];
  const pof = pofs.length && pofs.every(p=>/^(negative|no|pof\s*−|pof\s*-|non[ -]?phenolic)$/.test(p)) ? 'negative' as const
    : pofs.length && pofs.every(p=>/^(positive|yes|pof\s*\+|phenolic)$/.test(p)) ? 'positive' as const : 'unknown' as const;
  const strain = noloScience(knowledge)?.strains.find(s => s.yeastId === ref.id);
  return { found:true, name:ref.name, source:ref.source.reference, lab:ref.catalogue?.manufacturer, form:ref.form,
    hopIndexId:ref.id, tempMinC:temp?.range.min ?? strain?.temperatureC?.min, tempMaxC:temp?.range.max ?? strain?.temperatureC?.max,
    // A range is not collapsed into a pseudo-exact attenuation.
    ...(attenuation?.range.min === attenuation?.range.max ? {attenuationPct:attenuation?.range.min} : {}),
    ...(strain ? { fermentation:{version:1, strainName:strain.name, source:strain.source, retrievedAt:'2026-09-09', conditions:strain.limitation,
      sugars:strain.sugars, pof:strain.pof, hydrolysis:strain.hydrolysis, ...(strain.pitchGL?{pitchGL:strain.pitchGL}:{}),
      ...(strain.temperatureC?{temperatureC:strain.temperatureC}:{}), ...(strain.durationDays?{durationDays:strain.durationDays}:{})} }
    : ref.catalogue ? {fermentation:{version:1, strainName:ref.name, source:temp?.source ?? ref.source,
      retrievedAt:ref.catalogue.retrievals.map(r=>r.retrievedAt).sort().at(-1)!.slice(0,10),
      conditions:'Fiche de souche : aucune relation quantitative NOLO ni assimilation non publiée déduite. '+[temp?.source.reference,pitch?.source.reference].filter(Boolean).join(' ; '),
      sugars:{},pof,hydrolysis:'unknown',...(temp?{temperatureC:temp.range}:{}),...(pitch?{pitchGL:{min:pitch.range.min/100,max:pitch.range.max/100}}:{})}} : {}) };
}
/** Exact product + unique local record only. A generic oat name never becomes
 * another manufacturer's analysed malt. Reading references performs no writes. */
export function completeFromLocalReferences(fermentables: Fermentable[], hops: HopIngredient[], yeast: YeastSpec, stock: StockItem[], knowledge: HopKnowledge[]) {
  const cached = (kind: 'malt'|'houblon'|'levure', name: string) => {
    const rows = stock.filter(s => ingredientKey(kind, s.name) === ingredientKey(kind, name) && s.category.toLocaleLowerCase('fr') === kind && s.technicalSource?.trim());
    return rows.length === 1 ? factsFromStock(rows[0]) : undefined;
  };
  const malt = fermentables.map(f => { const facts = cached('malt',f.name); return facts ? applyMaltFacts(f,facts) : f; });
  const hop = hops.map(h => { const facts = cached('houblon',h.name); return facts ? applyHopFacts(h,facts) : h; });
  const stockYeast = cached('levure',yeast.name), reference = localYeastFacts(yeast,knowledge);
  let y = stockYeast ? applyYeastFacts(yeast,stockYeast) : yeast;
  if (reference) y = applyYeastFacts(y,reference);
  return { fermentables:malt, hops:hop, yeast:y };
}
