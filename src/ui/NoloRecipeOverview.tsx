import React, { useMemo } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { evaluateNoloRecipe, noloInput } from '../domain/nolo';
import { noloDecimal, noloProcessLabels } from '../domain/noloPresentation';
import { BoundGraph } from './NoloAlcoholChart';
import { NoloOperationList } from './NoloOperationList';

const emptyKnowledge: HopKnowledge[] = [];
/** The saved plan, including applied operations. Calculator drafts never enter this summary. */
export function NoloRecipeOverview({ recipe, saved = emptyKnowledge }: { recipe: TrialRecipe; saved?: HopKnowledge[] }) {
  const evaluated = useMemo(() => {
    try { return { result: evaluateNoloRecipe(recipe, saved), error: '' }; }
    catch (error) { return { result: null, error: error instanceof Error ? error.message : 'Configuration NOLO invalide.' }; }
  }, [recipe, saved]);
  if (!recipe.nolo?.enabled) return null;
  const { result, error } = evaluated, config = recipe.nolo;
  const baseVolume = noloInput(recipe).volumeL;
  const status = !result || result.projection.max === null ? 'Projection à compléter'
    : result.projectionStatus === 'exceeds' ? 'Au-dessus de la cible'
    : result.projection.max > config.targetAbvPct ? 'La plage traverse la cible'
    : result.projection.kind === 'measurement' ? 'Analyse sous la cible' : 'Sous la cible · sous hypothèses';
  const needsAttention = result?.projection.max != null && result.projection.max > config.targetAbvPct;
  return <section aria-label="Aperçu NOLO" className="nolo-overview min-w-0 space-y-1">
    <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
      <h3 className="text-sm font-semibold text-cave-50">{noloProcessLabels[config.process]}</h3>
      <span className="text-attention">Cible ≤ {noloDecimal(config.targetAbvPct)} % vol.</span>
    </div>
    {result ? <BoundGraph compact bound={result.projection} target={config.targetAbvPct}
      label={result.projection.kind === 'measurement' ? result.measuredPackaged ? 'Alcool analysé · bière conditionnée' : 'Alcool analysé · avant conditionnement' : 'Projection au conditionnement'}/>
      : <p role="alert" className="nolo-error">{error || 'Références NOLO à compléter pour calculer la projection.'}</p>}
    <p className={`text-xs ${needsAttention ? 'text-alert-strong' : 'text-cave-200'}`}>{status}</p>
    <dl className="grid grid-cols-2 gap-2 border-t border-cave-800 pt-1 text-xs">
      <div><dt className="text-cave-400">{config.process === 'secondRunnings' ? 'Moût récupéré' : 'Volume de base'}</dt><dd className="reading text-sm">{baseVolume > 0 ? noloDecimal(baseVolume) + ' L' : 'À mesurer'}</dd></div>
      <div><dt className="text-cave-400">Après opérations</dt><dd className="reading text-sm">{result?.volumeL != null ? noloDecimal(result.volumeL) + ' L' : 'À compléter'}</dd></div>
    </dl>
    {result && <p className="text-xs text-cave-200 leading-snug">{result.nextAction}</p>}
    {!!result?.activeOperations.length && <details>
      <summary className="min-h-touch cursor-pointer text-xs text-cave-200">{result.activeOperations.length} {result.activeOperations.length === 1 ? 'opération prévue' : 'opérations prévues'} · doses et ordre</summary>
      <NoloOperationList operations={result.activeOperations} recipe={recipe}/>
      <p className="text-xs text-cave-400">Prévisions de recette. Les réalisations et mesures sont consignées dans le journal du brassin.</p>
    </details>}
  </section>;
}
