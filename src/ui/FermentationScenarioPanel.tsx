import React, { useMemo } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { evaluateFermentationScenario } from '../domain/fermentationScenario';
import type { FermentationGuide, FermentationGoal } from '../../functions/src/fermentationGuideSchema';
import type { GuideYeast } from './hopIndex/guideData';
import type { FermentationScience } from '../../functions/src/fermentationScienceSchema';
import { FermentationTemperatureChart } from './FermentationTemperatureChart';
import { FermentationLeversPanel } from './FermentationSciencePanel';
import { fermentationRangeLabel } from './fermentationPresentation';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';
import { YeastCatalogueDetails } from './YeastCataloguePanel';
import { HopField } from './hopIndex/HopFactsEditor';
import { NumberInput } from './NumberInput';
import { inputClass } from './FormNav';
import { fermentationDose } from '../domain/fermentationGuide';

/** Real recipe inputs, local calculations only; manufacturer prose is never
 * converted to an invented radar or an ester concentration. */
export function FermentationScenarioPanel({ recipe, yeasts, guides, science, goal, onChange, programOnly = false }: {
  recipe: TrialRecipe; yeasts: GuideYeast[]; guides: FermentationGuide[]; science?: FermentationScience;
  goal: FermentationGoal; onChange?: (recipe: TrialRecipe) => void; programOnly?: boolean;
}) {
  const result = useMemo(() => evaluateFermentationScenario(recipe, yeasts, guides), [recipe, yeasts, guides]);
  const dose = result.guide && fermentationDose(result.guide, recipe.volumeL);
  return <section aria-label="Résultat de ma fermentation" className="space-y-3" data-engine={result.version}>
    <div><h4 className="font-sans text-base font-semibold text-ebc-straw">{result.yeast?.name || recipe.yeast.name || 'Levure à choisir'}</h4>
      <p className="text-sm text-cave-400">{result.yeast && !recipe.yeast.hopIndexId ? 'Souche reconnue par son nom · ' : ''}Lecture du programme saisi</p></div>
    {!programOnly && <><dl className="grid grid-cols-2 gap-3 text-sm">
      <div><dt className="text-cave-400">Fenêtre fabricant</dt><dd className="text-cave-50">{result.temperature ? fermentationRangeLabel(result.temperature.range, '°C', 0) : 'Non documentée'}</dd></div>
      <div data-value="final-gravity"><dt className="text-cave-400">DF documentaire</dt><dd className="text-cave-50">{result.fg.range ? fermentationRangeLabel(result.fg.range, 'SG', 3) : 'Non quantifiable'}</dd><dd className="text-sm text-cave-400">Confiance faible</dd></div>
    </dl>
    {result.guide && <p className="text-sm text-cave-200">{result.guide.aroma.summary ?? result.guide.aroma.banana}</p>}</>}
    <FermentationTemperatureChart steps={recipe.fermentation ?? []} pitchTempC={recipe.yeast.pitchTempC} />
    {!programOnly && result.warnings.length > 0 && <details className="rounded-control border border-ebc-straw/30 p-2"><summary className="cursor-pointer min-h-touch flex items-center text-sm text-ebc-straw">{result.issues.some(i => i.code === 'outside' || i.code === 'pitch') ? 'Température hors fenêtre · ' : ''}{result.warnings.length} point{result.warnings.length > 1 ? 's' : ''} à vérifier</summary><ul className="text-sm text-cave-200 space-y-2 pt-2">{result.warnings.map(w => <li key={w}>{w}</li>)}</ul></details>}
    {onChange && <details><summary className="cursor-pointer min-h-touch flex items-center text-water">Tester mes températures et durées</summary><div className="space-y-3 py-2">
      <p className="text-sm text-cave-400">Modifie les consignes pour vérifier leur domaine. Aucun multiplicateur universel d’arôme n’est appliqué.</p>
      {(recipe.fermentation ?? []).map((s, i) => <div key={i}><p className="text-sm text-cave-200">{s.name || `Palier ${i+1}`}</p><div className="grid grid-cols-2 gap-2">
        {(['tempC', 'days'] as const).map(key => <HopField key={key} label={`${key === 'tempC' ? 'Température' : 'Durée'} du scénario ${i+1} (${key === 'tempC' ? '°C' : 'j'})`}><NumberInput className={inputClass} value={s[key]} emptyValue={undefined} onValue={v => onChange({ ...recipe, fermentation: recipe.fermentation?.map((row,j) => j === i ? { ...row, [key]: v } : row) })}/></HopField>)}
      </div></div>)}
      {!recipe.fermentation?.length && <p className="text-sm text-cave-400">Ajoute les paliers dans la recette ou choisis une conduite documentée.</p>}
    </div></details>}
    {!programOnly && <details><summary className="cursor-pointer min-h-touch flex items-center text-water">Arômes, chimie et portée de l’estimation</summary><div className="space-y-3 py-2">
      <FermentationLeversPanel science={science} goal={goal} guide={result.guide} yeastId={result.yeast?.id}/>
      <p className="text-sm text-cave-400">{result.fg.reasons[0]}</p>
      {recipe.yeast.attenuationPct != null && <p className="text-sm text-cave-400">Atténuation saisie pour la recette : {recipe.yeast.attenuationPct} %. Elle n’est pas substituée à la plage fabricant de cette DF documentaire.</p>}
      {dose && <p className="text-sm text-cave-200">Dose fabricant au volume : {fermentationRangeLabel(dose.range, 'g', 1)} · confiance faible pour ce brassin. Masse de sachet et viabilité non supposées.<HopSourceLink source={dose.source}/></p>}
      <p className="text-sm text-cave-400">Les descriptions documentent un potentiel. Température, durée, pression et dose ne permettent pas ici de calculer les concentrations finales d’esters, phénols ou thiols.</p>
      {result.temperature && <HopSourceLink source={result.temperature.source}/>}
      {result.fg.sources.map((s,i) => <HopSourceLink key={i} source={s}/>)}
      {result.yeast?.catalogue && <YeastCatalogueDetails yeast={result.yeast}/>}
    </div></details>}
  </section>;
}
