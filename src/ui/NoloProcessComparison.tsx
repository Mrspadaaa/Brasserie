import React, { useMemo, useState } from 'react';
import type { NoloOperation, NoloProcess, NoloScience } from '../../functions/src/noloSchema';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { changeNoloProcess } from '../../functions/src/noloScenario';
import { evaluateNoloRecipe, noloPlanningSource } from '../domain/nolo';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { ToolComparison, ToolNumber, ToolRange, noloNumber } from './NoloToolControls';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';

import { noloProcessLabels } from '../domain/noloPresentation';
export { noloProcessLabels } from '../domain/noloPresentation';
const routeNeeds: Record<NoloProcess, string> = {
  restricted: 'Souche adaptée et moût caractérisé', restored: 'Fermentation limitée et essais de dosage',
  lowExtract: 'Peu d’extrait, équilibre à déguster', coldExtraction: 'Rendement du procédé à mesurer',
  coldContact: 'Contact et alcool à caractériser par essai', arrested: 'Densité d’arrêt et stabilisation',
  dealcoholized: 'Retrait d’alcool et volume après traitement', secondRunnings: 'Volume et densité du moût récupéré',
};
const known = (r: { min: number; max: number | null } | undefined) => r?.max != null ? { min: r.min, max: r.max } : null;

export function NoloProcessComparison({ recipe, science, onChange, saved, current }: { recipe: TrialRecipe; science: NoloScience; onChange: (r: TrialRecipe) => void; saved: HopKnowledge[]; current: ReturnType<typeof evaluateNoloRecipe> }) {
  const [process, setProcess] = useState<NoloProcess>(recipe.nolo!.process);
  const [stopSg, setStopSg] = useState<HopRange | null>(recipe.nolo?.planning?.stopSg ?? null);
  const [removed, setRemoved] = useState<HopRange | null>(null);
  const [finalVolume, setFinalVolume] = useState<number | null>(null);
  const [recoveredL, setRecoveredL] = useState<number | null>(recipe.nolo?.secondRunnings?.recoveredL ?? null);
  const [recoveredSg, setRecoveredSg] = useState<number | null>(recipe.nolo?.secondRunnings?.sg ?? null);
  const [notice, setNotice] = useState('');
  const [invalidRange, setInvalidRange] = useState(false);
  const preview = useMemo(() => {
    let config = changeNoloProcess(recipe.nolo!, process);
    if (process === 'arrested') config = { ...config, planning: { ...config.planning, version: 1, source: noloPlanningSource, stopSg, stopAttenuationPct: undefined } };
    if (process === 'secondRunnings') config = { ...config, secondRunnings: { sourceBatchId: '', previousExtraction: '', waterAddedL: null, alkalinityPpm: null, temperatureC: null, minutes: null, ph: null, ...config.secondRunnings, recoveredL, sg: recoveredSg } };
    if (process === 'dealcoholized' && !config.operations.some(o => o.kind === 'removal')) {
      const operation: NoloOperation = { id: 'nolo-process-removal', kind: 'removal', name: 'Désalcoolisation envisagée', ethanolRemovedPct: removed, finalVolumeL: finalVolume, source: 'Hypothèse de préparation personnelle' };
      config = { ...config, operations: [...config.operations, operation] };
    }
    const next = { ...recipe, nolo: config };
    try { return { recipe: next, result: evaluateNoloRecipe(next, saved), error: '' }; }
    catch (e) { return { recipe: next, result: null, error: e instanceof Error ? e.message : 'Vérifie les hypothèses.' }; }
  }, [recipe, process, stopSg, removed, finalVolume, recoveredL, recoveredSg, saved]);
  const note = science.processes.find(p => p.id === process);
  const changed = JSON.stringify(preview.recipe.nolo) !== JSON.stringify(changeNoloProcess(recipe.nolo!, recipe.nolo!.process));
  return <div className="nolo-tool-body">
    <label className="nolo-field">Procédé à comparer<select className="nolo-input" value={process} onChange={e => { setProcess(e.target.value as NoloProcess); setInvalidRange(false); setNotice(''); }}>{Object.entries(noloProcessLabels).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    <p className="nolo-note">{routeNeeds[process]}</p>
    {process === 'arrested' && <ToolRange label="Densité d’arrêt à comparer" value={stopSg} onChange={setStopSg} onInvalidChange={setInvalidRange} unit="SG"/>}
    {process === 'secondRunnings' && <div className="nolo-grid"><ToolNumber label="Volume récupéré à comparer" unit="L" value={recoveredL} onChange={setRecoveredL}/><ToolNumber label="Densité récupérée à comparer" unit="SG" value={recoveredSg} onChange={setRecoveredSg}/></div>}
    {process === 'dealcoholized' && !changeNoloProcess(recipe.nolo!, process).operations.some(o => o.kind === 'removal') && <>
      <ToolRange label="Retrait d’alcool envisagé" value={removed} onChange={setRemoved} onInvalidChange={setInvalidRange}/>
      <ToolNumber label="Volume après traitement" unit="L" value={finalVolume} onChange={setFinalVolume}/>
    </>}
    <ToolComparison before={known(current?.projection)} after={known(preview.result?.projection)} target={recipe.nolo!.targetAbvPct} beforeLabel={`Actuel · ${noloProcessLabels[recipe.nolo!.process]}`} afterLabel={`Variante · ${noloProcessLabels[process]}`}/>
    {preview.result?.projection.max != null && preview.result.projection.max > recipe.nolo!.targetAbvPct && <p className="nolo-error">Cette variante peut dépasser la cible avec les hypothèses retenues.</p>}
    <table className="nolo-table" aria-label="Décisions pour le procédé comparé"><tbody>
      <tr><th>Levure en place</th><td>{recipe.yeast.name || 'À choisir'}</td></tr>
      <tr><th>Extrait du moût</th><td>{preview.result?.plato ? `${noloNumber(preview.result.plato.min)}–${noloNumber(preview.result.plato.max)} °P` : 'À déterminer'}</td></tr>
      <tr><th>Prochaine donnée</th><td>{preview.error || preview.result?.nextAction || 'Caractériser le pilote.'}</td></tr>
    </tbody></table>
    <p className="nolo-note">Comparaison à ingrédients et levure actuels. Changer de procédé ne mesure pas son rendement ni sa stabilité.</p>
    {process === 'coldExtraction' && <p className="nolo-note">L’OG du rendement d’empâtage chaud est écartée. Mesure le moût extrait à froid pour alimenter ce bilan.</p>}
    {preview.error && <p role="alert" className="nolo-error">{preview.error}</p>}
    <button type="button" className="nolo-action" disabled={!changed || !!preview.error || invalidRange} onClick={() => { onChange(preview.recipe); setNotice('Procédé appliqué au brouillon. Prépare les réglages et mesures indiqués.'); }}>Appliquer ce procédé</button>
    {notice && <p role="status" className="nolo-note">{notice}</p>}
    {note && <details><summary>Matériel, conduite et limites</summary><dl className="nolo-facts"><dt>Matériel</dt><dd>{note.equipment}</dd><dt>Travail</dt><dd>{note.work}</dd><dt>Arômes</dt><dd>{note.aroma}</dd><dt>Limites</dt><dd>{note.limitation}</dd></dl><HopSourceLink source={note.source}/></details>}
  </div>;
}
