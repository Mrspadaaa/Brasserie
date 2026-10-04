import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopTiming } from '../../../functions/src/hopPredictionSchema';
import type { BrewingNuanceParameterChoice, BrewingNuanceParameterTarget, BrewingNuancePlan } from '../../domain/brewingNuanceProjection';

export interface BrewingNuanceParameterOption {
  key: string;
  label: string;
  target: BrewingNuanceParameterTarget;
  range: { min: number; max: number };
  central: number;
  source: HopSource;
  strictlyPositive: boolean;
}

const HOP_USES: HopTiming[] = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];

export function samePlanTarget(left: BrewingNuanceParameterTarget, right: BrewingNuanceParameterTarget): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function targetOptions(plan: BrewingNuancePlan): BrewingNuanceParameterOption[] {
  const model = plan.sourceModel;
  const doseParameter = model.axes.find((axis) => axis.id === plan.doseAxis.id && axis.version === plan.doseAxis.version)?.doseScale;
  const options: BrewingNuanceParameterOption[] = [
    { key: JSON.stringify({ kind: 'gain' }), label: 'Gain générique du modèle', target: { kind: 'gain' }, range: model.gain.range,
      central: model.gain.central, source: model.gain.source, strictlyPositive: true },
    { key: JSON.stringify({ kind: 'matrix' }), label: 'Matrice de bière', target: { kind: 'matrix' }, range: model.matrix.range,
      central: model.matrix.central, source: model.matrix.source, strictlyPositive: true },
  ];
  for (const timing of HOP_USES) {
    const row = model.timings[timing];
    for (const parameter of ['expression', 'halfSaturationGL', 'extractionHours', 'decayHours'] as const) {
      const value = row[parameter];
      if (!value) continue;
      const target: BrewingNuanceParameterTarget = { kind: 'timing', timing, parameter };
      options.push({ key: JSON.stringify(target), label: `${timing} · ${parameter}`, target, range: value.range,
        central: value.central, source: value.source,
        strictlyPositive: parameter === 'halfSaturationGL' || parameter === 'extractionHours' || parameter === 'decayHours' });
    }
  }
  if (doseParameter) {
    for (const definition of plan.definitions) {
      const dimensionReference = definition.contentReference;
      const doseTarget: BrewingNuanceParameterTarget = { kind: 'dimension', dimensionReference, parameter: 'doseScale' };
      options.push({ key: JSON.stringify(doseTarget), label: `Dose · ${definition.dimension.name}`, target: doseTarget,
        range: doseParameter.range, central: doseParameter.central, source: doseParameter.source, strictlyPositive: true });
      for (const parameter of ['yeastAroma', 'yeastExpression'] as const) {
        const prior = model.defaultYeast[parameter === 'yeastAroma' ? 'aroma' : 'expression'];
        const target: BrewingNuanceParameterTarget = { kind: 'dimension', dimensionReference, parameter };
        options.push({ key: JSON.stringify(target), label: `${parameter === 'yeastAroma' ? 'Arôme propre de levure' : 'Expression de levure'} · ${definition.dimension.name}`,
          target, range: prior.range, central: prior.central, source: prior.source, strictlyPositive: false });
      }
    }
  }
  return options;
}

export function parameterChoiceFor(plan: BrewingNuancePlan, target: BrewingNuanceParameterTarget): BrewingNuanceParameterChoice | undefined {
  return plan.parameterChoices.find((choice) => samePlanTarget(choice.target, target));
}

export function parameterOriginLabel(origin: BrewingNuanceParameterChoice['origin']): string {
  const labels: Record<BrewingNuanceParameterChoice['origin'], string> = {
    userHypothesis: 'Hypothèse du brasseur',
    assistantHypothesis: 'Hypothèse assistée',
    modelHypothesis: 'Hypothèse du modèle',
    analogy: 'Analogie déclarée',
    sourceRange: 'Plage reprise d’une source',
  };
  return labels[origin];
}

export function planParameterDomain(plan: BrewingNuancePlan): Array<{
  label: string; range: { min: number; max: number }; central?: number; source: HopSource;
}> {
  const rows: Array<{ label: string; range: { min: number; max: number }; central?: number; source: HopSource }> = [];
  const model = plan.sourceModel;
  rows.push({ label: 'Gain', range: model.gain.range, central: model.gain.central, source: model.gain.source });
  rows.push({ label: 'Matrice', range: model.matrix.range, central: model.matrix.central, source: model.matrix.source });
  rows.push({ label: 'Résidu', range: model.residual.range, central: model.residual.central, source: model.residual.source });
  rows.push({ label: 'Descripteur mentionné', range: model.descriptor.mentioned.range, central: model.descriptor.mentioned.central, source: model.descriptor.mentioned.source });
  rows.push({ label: 'Descripteur non mentionné', range: model.descriptor.unmentioned.range, central: model.descriptor.unmentioned.central, source: model.descriptor.unmentioned.source });
  rows.push({ label: 'Descripteur inconnu', range: model.descriptor.unknown.range, central: model.descriptor.unknown.central, source: model.descriptor.unknown.source });
  rows.push({ label: 'Arôme propre de levure · prior générique', range: model.defaultYeast.aroma.range, central: model.defaultYeast.aroma.central, source: model.defaultYeast.aroma.source });
  rows.push({ label: 'Expression de levure · prior générique', range: model.defaultYeast.expression.range, central: model.defaultYeast.expression.central, source: model.defaultYeast.expression.source });
  for (const timing of HOP_USES) {
    const row = model.timings[timing];
    for (const name of ['expression', 'halfSaturationGL', 'extractionHours', 'decayHours', 'temperatureC', 'outsideTemperatureUncertainty'] as const) {
      const parameter = row[name];
      if (parameter) rows.push({ label: `${timing} · ${name}`, range: parameter.range, central: parameter.central, source: parameter.source });
    }
  }
  rows.push({ label: 'Incertitude de forme inconnue', range: model.unknownFormUncertainty.range, central: model.unknownFormUncertainty.central, source: model.unknownFormUncertainty.source });
  rows.push({ label: 'Incertitude de date absente', range: model.undatedUncertainty.range, central: model.undatedUncertainty.central, source: model.undatedUncertainty.source });
  return rows;
}
