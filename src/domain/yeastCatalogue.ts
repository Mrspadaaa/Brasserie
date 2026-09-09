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
export function catalogueMatches(yeast: HopYeast, query: string) {
  const hay = normalizedYeastText([yeast.name, yeast.id, yeast.form, ...(yeast.catalogue?.aliases ?? []), ...(yeast.catalogue?.categories ?? []), ...(yeast.catalogue?.facts ?? []).map(f=>f.reported)].join(' '));
  return normalizedYeastText(query).split(' ').filter(Boolean).every(term => hay.includes(term) || hay.includes(translations[term] ?? term));
}
/** Conflicting or qualified values remain separate; no midpoint or merged envelope is invented. */
export function catalogueFacts(yeast: HopYeast, key?: YeastFactKey): YeastCatalogueFact[] {
  const facts = (yeast.catalogue?.facts ?? []).filter(f=>!key || f.key===key);
  return [...new Map(facts.map(f=>[JSON.stringify([f.key,f.reported,f.context,f.range]),f])).values()];
}
export function catalogueYeasts(knowledge: HopKnowledge[]): HopYeast[] {
  return knowledge.filter((k): k is HopYeast => { try { assertHopKnowledge(k); return k.kind==='yeast' && !!k.catalogue; } catch { return false; } });
}
/** Feed documented conditions to the triplet guide only when the sources agree. */
export function catalogueSolverFacts(knowledge: HopKnowledge[]) {
  const yeastPhenols: {yeastId:string;status:'positive'|'negative';source:YeastCatalogueFact['source']}[]=[], yeastConditions: {yeastId:string;temperatureC:NonNullable<YeastCatalogueFact['range']>;source:YeastCatalogueFact['source']}[]=[];
  for(const yeast of catalogueYeasts(knowledge)){
    const facts=catalogueFacts(yeast);
    const phenols=facts.filter(f=>f.key==='pof').map(f=>({f,status:/^(?:positive|yes|phenolic|pof\s*\+)$/i.test(f.reported)?'positive':/^(?:negative|no|non[ -]?phenolic|pof\s*-)$/i.test(f.reported)?'negative':undefined}));
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
  return { ...recipe, yeast: next, yeastGuide: undefined, hopPredictionIds: undefined, hopTrialId: undefined, hopMatrixId: undefined };
}
