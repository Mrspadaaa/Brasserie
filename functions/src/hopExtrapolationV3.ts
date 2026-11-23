import { hopSourceError, type HopRange, type HopSource, type HopVariety } from './hopIndexSchema.js';
import type { HopAxis, HopEstimate, HopTriplet, HopYeast } from './hopPredictionSchema.js';
import type { HopExtrapolation } from './hopExtrapolationSchema.js';

const unit = (x: number) => Math.max(0, Math.min(1, x));
const multiply = (...ranges: HopRange[]): HopRange => ranges.reduce((a, b) => ({ min: a.min * b.min, max: a.max * b.max }), { min: 1, max: 1 });
const text = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const unique = (sources: HopSource[]) => [...new Map(sources.map(s => [JSON.stringify(s), s])).values()];
const descriptionsOf = (variety: HopVariety) => (Array.isArray(variety.descriptions) ? variety.descriptions : []).filter(d => d && typeof d.text === 'string' && !hopSourceError(d.source));

/** Lexical evidence, not a concentration. Repetition never increases intensity. */
export function hopDescriptorEvidence(variety: HopVariety, terms: string[]) {
  return descriptionsOf(variety).filter(d => terms.some(term => {
    const words = ` ${text(d.text)} `, token = ` ${text(term)} `;
    if (!token.trim() || !words.includes(token)) return false;
    return !['no', 'not', 'non', 'sans', 'pas de'].some(negation => words.includes(` ${negation}${token}`));
  }));
}

/** All coefficients are supplied by a versioned, editable knowledge document.
 * This is an expert interval model of sensory salience, NOT a chemical mass balance,
 * learned regression, probability distribution, or calibrated confidence interval.
 */
export function extrapolateHopProfile(triplet: HopTriplet, variety: HopVariety, yeast: HopYeast,
  axes: HopAxis[], model: HopExtrapolation, formKnown: boolean): Record<string, HopEstimate> {
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
  const descriptionsKnown = model.axes.some(a => hopDescriptorEvidence(variety, a.terms).length);
  for (const axis of axes) {
    const definition = model.axes.find(a => a.id === axis.id && a.version === axis.version);
    if (!definition) continue;
    const halfDose = multiply(timing.halfSaturationGL.range, definition.doseScale.range);
    const dose = triplet.doseGL === null ? { min: 0, max: 1 } : {
      // Same dose in numerator/denominator; monotonic in d, antitonic in K.
      min: 1 / (1 + halfDose.max / triplet.doseGL), max: 1 / (1 + halfDose.min / triplet.doseGL)
    };
    const matches = hopDescriptorEvidence(variety, definition.terms);
    const descriptor = matches.length ? model.descriptor.mentioned : descriptionsKnown ? model.descriptor.unmentioned : model.descriptor.unknown;
    const aroma = strain?.aroma[axis.id] ?? strain?.otherAroma ?? model.defaultYeast.aroma;
    const expression = strain?.expression[axis.id] ?? strain?.otherExpression ?? model.defaultYeast.expression;
    const hop = multiply(descriptor.range, dose, contact, timing.expression.range, expression.range, model.gain.range, model.matrix.range);
    const evidence = matches.length ? matches : descriptionsOf(variety);
    const sourceUncertainty = evidence.length ? Math.max(...evidence.map(d => model.sourceUncertainty[d.source.kind].range.max))
      : Math.max(...Object.values(model.sourceUncertainty).map(p => p.range.max));
    const undated = !evidence.length || evidence.some(d => d.source.year === null) ? model.undatedUncertainty.range.max : 0;
    const uncertainty = sourceUncertainty + undated + (formKnown ? 0 : model.unknownFormUncertainty.range.max)
      + (temperatureUncertain ? timing.outsideTemperatureUncertainty.range.max : 0);
    // Error remains on the output scale; saturation cannot create false precision.
    const low = unit(-Math.expm1(-(hop.min + aroma.range.min)) + model.residual.range.min - uncertainty);
    const high = unit(-Math.expm1(-(hop.max + aroma.range.max)) + model.residual.range.max + uncertainty);
    const span = axis.scale.max - axis.scale.min;
    // Missing dose/contact has no central scenario: no number is imputed into
    // the process. Complete scenarios use the data's explicit central values.
    const centralDose = triplet.doseGL === null ? null : 1 / (1 + timing.halfSaturationGL.central * definition.doseScale.central / triplet.doseGL);
    const centralContact = time === null ? null : timing.decayHours ? Math.exp(-time / timing.decayHours.central) : -Math.expm1(-time / timing.extractionHours.central);
    const central = centralDose !== null && centralContact !== null ? axis.scale.min + span * unit(-Math.expm1(-(
      descriptor.central * centralDose * centralContact * timing.expression.central * expression.central * model.gain.central * model.matrix.central + aroma.central
    )) + model.residual.central) : undefined;
    const reasons = [
      matches.length ? `Famille citée dans ${matches.length} description(s) du houblon ; intensité extrapolée, non mesurée.` : 'Famille non renseignée dans les descripteurs : domaine complet conservé, aucune absence supposée.',
      strain ? `Profil fermentaire de ${yeast.name} et expression du houblon traités séparément.` : 'Profil de cette souche non caractérisé : enveloppe de levure inconnue, sans neutralité supposée.',
      'Plage d’hypothèses expertes, sans taux de couverture statistique. Le modèle estime une présence sensorielle sur l’échelle locale ; aucun rendement enzymatique n’est calculé.',
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
      model.gain.source, model.matrix.source, model.residual.source, definition.doseScale.source, timing.expression.source, timing.halfSaturationGL.source,
      (timing.decayHours ?? timing.extractionHours).source, timing.temperatureC.source,
      ...(temperatureUncertain ? [timing.outsideTemperatureUncertainty.source] : []),
      ...(!formKnown ? [model.unknownFormUncertainty.source] : []),
      ...(undated ? [model.undatedUncertainty.source] : []),
      ...evidence.flatMap(d => [d.source, model.sourceUncertainty[d.source.kind].source]),
      ...(!evidence.length ? Object.values(model.sourceUncertainty).map(p => p.source) : []),
      ...(strain ? [strain.source, ...strain.evidence] : [])]);
    profile[axis.id] = { range: { min: axis.scale.min + low * span, max: axis.scale.min + high * span }, ...(central === undefined ? {} : { central }), confidence: 'low', reasons, sources };
  }
  return profile;
}
