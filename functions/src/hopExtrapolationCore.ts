import { hopSourceError, type HopRange, type HopSource, type HopVariety } from './hopIndexSchema.js';
import type { HopAxis, HopEstimate, HopTriplet, HopYeast } from './hopPredictionSchema.js';
import type { HopExtrapolation } from './hopExtrapolationSchema.js';

const unit = (x: number) => Math.max(0, Math.min(1, x));
/** Positive products are evaluated together: an intermediate underflow must not
 * erase a later compensating factor. These are floating approximations, not
 * certified outward-rounded intervals. */
const product = (values: number[]) => values.some(v => v === 0) ? 0 : Math.exp(values.reduce((sum, v) => sum + Math.log(v), 0));
const multiply = (...ranges: HopRange[]): HopRange => ({ min: product(ranges.map(r => r.min)), max: product(ranges.map(r => r.max)) });
/** Keep K's factors separate, including when their product is subnormal. */
export function hopDoseResponse(dose: number, halfDose: number, scale: number): number {
  if (dose === 0) return 0;
  const logRatio = Math.log(halfDose) + Math.log(scale) - Math.log(dose);
  if (logRatio >= 0) { const inverse = Math.exp(-logRatio); return inverse / (1 + inverse); }
  return 1 / (1 + Math.exp(logRatio));
}
/** Convex mixture, retaining the same weight in BOTH terms. Not independent
 * observations: the full transfer-weight interval preserves alternative shapes. */
export function mixHopDoseShapes(a: HopRange, b: HopRange, weight: HopRange): HopRange {
  const mix = (x: number, y: number, w: number) => (1-w)*x+w*y;
  return {min:Math.min(mix(a.min,b.min,weight.min),mix(a.min,b.min,weight.max)),max:Math.max(mix(a.max,b.max,weight.min),mix(a.max,b.max,weight.max))};
}
function referencedDose(dose: number, reference: NonNullable<HopExtrapolation['doseReferences']>[number]) {
  if(dose===0)return {range:{min:0,max:0},central:0};
  const i=reference.points.findIndex((p,i)=>i>0&&dose<=p.doseGL);
  if(i<1)return {range:{min:0,max:1},central:undefined};
  const l=reference.points[i-1],r=reference.points[i];
  const central=l.value+(r.value-l.value)*(dose-l.doseGL)/(r.doseGL-l.doseGL);
  return {central,range:{min:unit(central*(1-reference.relativeError.range.max)),max:unit(central*(1+reference.relativeError.range.max))}};
}
const text = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export interface HopExtrapolationCache {
  sourceKeys: WeakMap<HopSource, string>;
  descriptors: WeakMap<HopVariety, Map<string[], HopVariety['descriptions']>>;
  descriptorTexts: WeakMap<HopVariety, {description:HopVariety['descriptions'][number];words:string}[]>;
  descriptorTerms: WeakMap<string[], {token:string;negated:string[]}[]>;
}
/** Scoped to a single immutable search context, never shared across data revisions. */
export const createHopExtrapolationCache = (): HopExtrapolationCache => ({ sourceKeys:new WeakMap(), descriptors:new WeakMap(), descriptorTexts:new WeakMap(), descriptorTerms:new WeakMap() });
const unique = (sources: HopSource[], cache?: HopExtrapolationCache) => [...new Map(sources.map(s => {
  let key=cache?.sourceKeys.get(s);
  if(key===undefined){key=JSON.stringify(s);cache?.sourceKeys.set(s,key)}
  return [key,s] as const;
})).values()];
const descriptionsOf = (variety: HopVariety) => (Array.isArray(variety.descriptions) ? variety.descriptions : []).filter(d => d && typeof d.text === 'string' && !hopSourceError(d.source));

/** Lexical evidence, not a concentration. Repetition never increases intensity. */
export function hopDescriptorEvidence(variety: HopVariety, terms: string[], cache?: HopExtrapolationCache): HopVariety['descriptions'] {
  const prior=cache?.descriptors.get(variety)?.get(terms);
  if(prior)return prior;
  // Normalization and provenance validation do not depend on the dose, strain or axis.
  let descriptions=cache?.descriptorTexts.get(variety),tokens=cache?.descriptorTerms.get(terms);
  if(!descriptions){descriptions=descriptionsOf(variety).filter(d=>d.context!=='beer').map(description=>({description,words:` ${text(description.text)} `}));cache?.descriptorTexts.set(variety,descriptions);}
  if(!tokens){tokens=terms.map(term=>text(term)).filter(Boolean).map(term=>({token:` ${term} `,negated:['no','not','non','sans','pas de'].map(n=>` ${n} ${term} `)}));cache?.descriptorTerms.set(terms,tokens);}
  const evidence=descriptions.filter(d=>tokens!.some(t=>d.words.includes(t.token)&&!t.negated.some(n=>d.words.includes(n)))).map(d=>d.description);
  if(cache){let rows=cache.descriptors.get(variety);if(!rows){rows=new Map();cache.descriptors.set(variety,rows)}rows.set(terms,evidence);}
  return evidence;
}

/** All coefficients are supplied by a versioned, editable knowledge document.
 * This is an expert interval model of sensory salience, NOT a chemical mass balance,
 * learned regression, probability distribution, or calibrated confidence interval.
 */
export function extrapolateHopProfile(triplet: HopTriplet, variety: HopVariety, yeast: HopYeast,
  axes: HopAxis[], model: HopExtrapolation, formKnown: boolean, cache?: HopExtrapolationCache): Record<string, HopEstimate> {
  const descriptorEvidence = (terms:string[]) => hopDescriptorEvidence(variety,terms,cache);
  const timing = model.timings[triplet.timing!];
  const strain = model.yeasts.find(y => y.yeastId === yeast.id);
  const profile: Record<string, HopEstimate> = {};
  const time = triplet.contactHours;
  const contact: HopRange = time === null ? { min: 0, max: 1 } : timing.decayHours ? {
    min: Math.exp(-time / timing.decayHours.range.min), max: Math.exp(-time / timing.decayHours.range.max)
  } : {
    min: -Math.expm1(-time / timing.extractionHours.range.max), max: -Math.expm1(-time / timing.extractionHours.range.min)
  };
  const temperatureUncertain = triplet.temperatureC === null || triplet.temperatureC < timing.temperatureC.range.min || triplet.temperatureC > timing.temperatureC.range.max;
  const descriptionsKnown = model.axes.some(a => descriptorEvidence(a.terms).length);
  for (const axis of axes) {
    const definition = model.axes.find(a => a.id === axis.id && a.version === axis.version);
    if (!definition) continue;
    let dose = triplet.doseGL === null ? { min: 0, max: 1 } : {
      // Same dose in numerator/denominator; monotonic in d, antitonic in K.
      min: hopDoseResponse(triplet.doseGL, timing.halfSaturationGL.range.max, definition.doseScale.range.max),
      max: hopDoseResponse(triplet.doseGL, timing.halfSaturationGL.range.min, definition.doseScale.range.min)
    };
    const doseReference=model.doseReferences?.find(r=>r.axisId===axis.id&&r.timings.includes(triplet.timing!));
    const observedShape=doseReference&&triplet.doseGL!==null?referencedDose(triplet.doseGL,doseReference):undefined;
    if(observedShape&&doseReference)dose=mixHopDoseShapes(dose,observedShape.range,doseReference.transferWeight.range);
    const matches = descriptorEvidence(definition.terms);
    const descriptor = matches.length ? model.descriptor.mentioned : descriptionsKnown ? model.descriptor.unmentioned : model.descriptor.unknown;
    const aroma = strain?.aroma[axis.id] ?? strain?.otherAroma ?? model.defaultYeast.aroma;
    const expression = strain?.expression[axis.id] ?? strain?.otherExpression ?? model.defaultYeast.expression;
    const hop = multiply(descriptor.range, dose, contact, timing.expression.range, expression.range, model.gain.range, model.matrix.range);
    // A matching description is a constraint, not another independent vote.
    // Use the strongest available documentary constraint. Forgetting it can
    // only increase the margin. Unmentioned families retain the unknown prior,
    // irrespective of good sources about OTHER families.
    const evidence = matches;
    const undated = !evidence.length || evidence.some(d => d.source.year === null);
    const documentary = evidence.length ? Math.min(...evidence.map(d => model.sourceUncertainty[d.source.kind].range.max
      + (d.source.year === null ? model.undatedUncertainty.range.max : 0)))
      : Math.max(...Object.values(model.sourceUncertainty).map(p => p.range.max)) + model.undatedUncertainty.range.max;
    const margin = documentary + (formKnown ? 0 : model.unknownFormUncertainty.range.max)
      + (temperatureUncertain ? timing.outsideTemperatureUncertainty.range.max : 0);
    // Hop-specific ignorance vanishes continuously with the possible hop signal.
    // The structural residual remains on the total output, including at zero dose.
    const uncertainty = margin * -Math.expm1(-hop.max);
    // Error remains on the output scale; saturation cannot create false precision.
    const low = unit(-Math.expm1(-(hop.min + aroma.range.min)) + model.residual.range.min - uncertainty);
    const high = unit(-Math.expm1(-(hop.max + aroma.range.max)) + model.residual.range.max + uncertainty);
    const span = axis.scale.max - axis.scale.min;
    // Missing dose/contact has no central scenario: no number is imputed into
    // the process. Complete scenarios use the data's explicit central values.
    let centralDose = triplet.doseGL === null ? null : hopDoseResponse(triplet.doseGL, timing.halfSaturationGL.central, definition.doseScale.central);
    if(centralDose!==null&&observedShape&&doseReference){
      const w=doseReference.transferWeight.central;
      centralDose=observedShape.central===undefined ? w===0?centralDose:null : (1-w)*centralDose+w*observedShape.central;
    }
    const centralContact = time === null ? null : timing.decayHours ? Math.exp(-time / timing.decayHours.central) : -Math.expm1(-time / timing.extractionHours.central);
    const central = centralDose !== null && centralContact !== null ? axis.scale.min + span * unit(-Math.expm1(-(
      product([descriptor.central, centralDose, centralContact, timing.expression.central, expression.central, model.gain.central, model.matrix.central]) + aroma.central
    )) + model.residual.central) : undefined;
    const reasons = [
      matches.length ? `Famille citée dans ${matches.length} description(s) du houblon ; intensité extrapolée, non mesurée.` : 'Famille non renseignée dans les descripteurs : domaine complet conservé, aucune absence supposée.',
      strain ? `Profil fermentaire de ${yeast.name} et expression du houblon traités séparément.` : 'Profil de cette souche non caractérisé : enveloppe de levure inconnue, sans neutralité supposée.',
      'Plage d’hypothèses expertes, sans taux de couverture statistique. Le modèle estime une présence sensorielle sur l’échelle locale ; aucun rendement enzymatique n’est calculé.',
      'La source la plus informative fixe la marge documentaire ; les répétitions ne la réduisent pas. Cette marge porte sur l’apport possible du houblon et s’annule avec lui. Le résidu structurel reste présent.',
      ...(doseReference ? ['Réponse à la dose informée par un essai publié : effet relatif au témoin non houblonné, puis transfert exploratoire. La plage conserve les formes alternatives ; elle ne transforme pas les données Cascade en essai de cette combinaison.',...doseReference.limitations] : []),
      ...(observedShape?.central===undefined&&doseReference&&triplet.doseGL!==null ? ['Dose au-delà de la courbe publiée : forme inconnue, plage élargie et aucun repère central transféré.'] : []),
      'Le repère central, lorsqu’il est affiché, utilise les valeurs centrales explicitement enregistrées dans les paramètres. Ce n’est ni une moyenne de dégustations ni une valeur attendue probabiliste.',
      ...(!formKnown ? ['Forme commerciale inconnue : marge supplémentaire.'] : []),
      ...(triplet.doseGL === null ? ['Dose manquante : union de toutes les doses, sans moyenne imputée.'] : []),
      ...(time === null ? ['Contact manquant : union de toutes les durées, sans durée inventée.'] : []),
      ...(temperatureUncertain ? ['Température manquante ou hors des conditions usuelles du modèle : plage élargie ; aucune loi thermique étalonnée.'] : []),
      ...(undated ? ['Source documentaire non datée : marge supplémentaire.'] : []),
      'Matrice, récolte et interactions sensorielles restent incertaines. Les analyses d’huile ou de thiols ne sont pas transformées en intensité par cette formule.',
      ...(strain?.notes ?? []), ...model.limitations
    ];
    const sources = unique([model.source, ...model.evidence, axis.source, definition.source, descriptor.source, aroma.source, expression.source,
      ...(doseReference?[doseReference.source,doseReference.evidence,doseReference.transferWeight.source,doseReference.relativeError.source]:[]),
      model.gain.source, model.matrix.source, model.residual.source, definition.doseScale.source, timing.expression.source, timing.halfSaturationGL.source,
      (timing.decayHours ?? timing.extractionHours).source, timing.temperatureC.source,
      ...(temperatureUncertain ? [timing.outsideTemperatureUncertainty.source] : []),
      ...(!formKnown ? [model.unknownFormUncertainty.source] : []),
      ...(undated ? [model.undatedUncertainty.source] : []),
      ...evidence.flatMap(d => [d.source, model.sourceUncertainty[d.source.kind].source]),
      ...(!evidence.length ? Object.values(model.sourceUncertainty).map(p => p.source) : []),
      ...(strain ? [strain.source, ...strain.evidence] : [])], cache);
    profile[axis.id] = { range: { min: axis.scale.min + low * span, max: axis.scale.min + high * span }, ...(central === undefined ? {} : { central }), confidence: 'low', reasons, sources };
  }
  return profile;
}
