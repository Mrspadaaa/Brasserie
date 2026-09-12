import { Input } from './Input';
import React, { useId, useMemo, useRef, useState } from 'react';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { NoloBrewToolsConfig, NoloOperation, NoloScience } from '../../functions/src/noloSchema';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { evaluateNoloRecipe } from '../domain/nolo';
import { wortTool, applyNoloWortSg, fruitSugarOperation, primingSugarOperation, aromaOperation, additionImpact, dilutionTool, noloVolumeAfterOperations, scaleBenchTrial, analyzeGravityTrial } from '../domain/noloBrewTools';
import { ToolNumber, ToolRange, ToolComparison, NoloSensitivityChart, noloNumber, noloToolRange } from './NoloToolControls';
import { NoloProcessComparison } from './NoloProcessComparison';
import { noloToolContext, keepObservationsBeforeNewAddition } from '../domain/noloToolContext';
import './nolo-tools.css';

const emptyTools: NoloBrewToolsConfig = { version: 1 };
type Tool = 'process' | 'wort' | 'additions' | 'dilution' | 'bench';
const tabs: { id: Tool; name: string }[] = [{ id: 'process', name: 'Procédés' }, { id: 'wort', name: 'Moût' }, { id: 'additions', name: 'Ajouts' }, { id: 'dilution', name: 'Dilution' }, { id: 'bench', name: 'Essais' }];
interface ToolProps { recipe: TrialRecipe; science: NoloScience; settings: NoloBrewToolsConfig; update: (patch: Partial<NoloBrewToolsConfig>) => void; onChange: (r: TrialRecipe) => void; navigate: (tool: Tool) => void; }
interface BaseProps extends ToolProps { volumeL: number | null; baseAbv: HopRange | null; result: ReturnType<typeof evaluateNoloRecipe>; }

function WortTool({ recipe, science, settings: s, update, onChange }: ToolProps) {
  const [notice, setNotice] = useState('');
  const plan = wortTool(recipe, { targetAbvPct: recipe.nolo!.targetAbvPct, reserveAbvPct: s.reserveAbvPct, attenuationPct: s.attenuationPct, simulationSg: s.simulationSg }, science);
  const value = plan.value;
  const exploredSg = s.simulationSg ?? null;
  const scaled = exploredSg == null ? null : applyNoloWortSg(recipe, exploredSg);
  return <div className="nolo-tool-body">
    <p className="nolo-note">Quel extrait viser pour garder de la place aux ajouts ?</p>
    <ToolRange label="Atténuation envisagée" value={s.attenuationPct} onChange={attenuationPct => update({ attenuationPct })}/>
    <div className="nolo-grid"><ToolNumber label="Réserve au volume de base" unit="point de % vol." value={s.reserveAbvPct} onChange={reserveAbvPct => update({ reserveAbvPct })}/>
      <ToolNumber label="OG à simuler" unit="SG" value={s.simulationSg} onChange={simulationSg => { update({ simulationSg }); setNotice(''); }}/></div>
    <div className="nolo-action-row"><button type="button" className="nolo-action" onClick={() => update({ reserveAbvPct: 0 })}>Sans réserve</button>
      {value?.currentSg != null && <button type="button" className="nolo-action" onClick={() => update({ simulationSg: value.currentSg })}>Reprendre mon OG</button>}
      {value && <button type="button" className="nolo-action" onClick={() => update({ simulationSg: Math.floor(value.maxSg * 100000) / 100000 })}>Essayer l’OG limite</button>}
    </div>
    {plan.issue && <p className="nolo-note" role="status">{plan.issue}</p>}
    {value && <>
      <dl className="nolo-grid nolo-comparison"><div><dt>Budget du moût</dt><dd>{noloNumber(value.wortBudgetAbvPct, 3)} % vol.</dd></div><div><dt>OG limite sous hypothèses</dt><dd>≤ {noloNumber(Math.floor(value.maxSg * 100000) / 100000, 5)}</dd></div></dl>
      {exploredSg != null && <label className="nolo-field">Explorer l’OG<input type="range" aria-label="Explorer l’OG" min={1} max={value.curve[value.curve.length - 1].sg} step={.00001} value={exploredSg} onChange={e => update({ simulationSg: Number(e.target.value) })}/></label>}
      <NoloSensitivityChart points={value.curve.map(p => ({ x: p.sg, abvPct: p.abvPct }))} target={value.wortBudgetAbvPct} selectedX={exploredSg} label="Sensibilité de l’alcool à l’extrait du moût" xLabel="Densité initiale · SG" digits={4}/>
      <ToolComparison before={value.currentAbvPct} after={value.simulationAbvPct} target={value.wortBudgetAbvPct} beforeLabel="Moût actuel · hypothèse" afterLabel="Moût simulé · hypothèse" valuesOnly/>
      {value.currentIssue && <p className="nolo-note">{value.currentIssue}</p>}
      {!['coldExtraction','secondRunnings'].includes(recipe.nolo!.process) && <ToolNumber label="Rendement d’extraction utilisé" unit="%" value={recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct} onChange={efficiencyPct => onChange({ ...recipe, efficiencyPct: efficiencyPct ?? undefined })}/>}
      {scaled?.value && <>
        <table className="nolo-table" aria-label="Quantités de fermentescibles avant et après"><thead><tr><th>Avant fermentation</th><th>Actuel · kg</th><th>Simulé · kg</th></tr></thead><tbody>{recipe.fermentables.map((f, i) => f.use !== 'fermentation' && f.weightKg > 0 ? <tr key={i}><th>{f.name}</th><td className="font-mono">{noloNumber(f.weightKg, 3)}</td><td className="font-mono">{noloNumber(scaled.value!.fermentables[i].weightKg, 3)}</td></tr> : null)}</tbody></table>
        <button type="button" className="nolo-action" disabled={Math.abs((value.currentSg ?? 1) - (exploredSg ?? 1)) < 1e-8} onClick={() => { onChange(scaled.value!); setNotice('Quantités du moût appliquées. Vérifie les eaux d’empâtage, le pH et le houblonnage.'); }}>Appliquer ces quantités</button>
      </>}
      {scaled?.issue && scaled.issue !== value.currentIssue && <p className="nolo-note">{scaled.issue}</p>}
    </>}
    {notice && <p role="status" className="nolo-note">{notice}</p>}
    <details><summary>Hypothèses et cas réel</summary><p className="nolo-note">Approximation de conception : (OG − 1) × atténuation / 100 × {science.planningModels ? noloNumber(science.planningModels.sgAbvFactor.value) : 'coefficient indisponible'}. L’atténuation apparente exprimée en °P n’est pas exactement celle en SG. Utilise une plage issue de tes essais. Ni mesure d’alcool ni garantie de fin de fermentation.</p><p className="nolo-note">Cible et réserve sont ramenées ici au volume de la bière de base. Les outils Ajouts et Dilution calculent ensuite au volume final ; aucune dilution future n’est supposée.</p><p className="nolo-note">Dans un essai publié à environ 6,6 °P, LA-01 et LoNa ont légèrement dépassé 0,5 % vol. Le nom de la souche ne suffit pas à fixer la cible.</p><a href="https://www.mdpi.com/2076-3417/15/12/6797" target="_blank" rel="noreferrer" className="text-xs underline text-cave-200">Essai comparatif Schubert et al., 2025</a></details>
  </div>;
}

function BaseEditor({ settings: s, update, baseAbv, volumeL, result }: BaseProps) {
  return <div className="space-y-1">
    <div className="nolo-grid"><label className="nolo-field">Base du calcul<select className="nolo-input" value={s.baseMode ?? 'recipe'} onChange={e => update({ baseMode: e.target.value as 'recipe' | 'hypothesis' })}><option value="recipe">Recette</option><option value="hypothesis">Hypothèse</option></select></label>
      <dl className="nolo-comparison"><dt>Volume avant opération</dt><dd>{volumeL == null ? 'À déterminer' : `${noloNumber(volumeL)} L`}</dd></dl></div>
    {s.baseMode === 'hypothesis' ? <ToolRange label="Alcool avant opération" value={s.baseAbvPct} onChange={baseAbvPct => update({ baseAbvPct })}/> : <p className="nolo-note">{baseAbv ? `Projection actuelle : ${noloToolRange(baseAbv)} vol.` : result?.nextAction || 'Projection indisponible : renseigne une hypothèse personnelle pour explorer.'}</p>}
    {s.baseMode === 'hypothesis' && <p className="nolo-note">Hypothèse du mélange actuel, ajouts déjà enregistrés inclus.</p>}
  </div>;
}

function AdditionsTool(props: BaseProps) {
  const { recipe, science, settings: s, update, onChange, volumeL, baseAbv } = props;
  const [notice, setNotice] = useState('');
  const kind = s.additionKind ?? 'fruit';
  const name = s.additionName?.trim() || (kind === 'fruit' ? 'Fruit' : kind === 'priming' ? 'Resucrage' : kind === 'blend' ? 'Bière d’assemblage' : 'Produit aromatique');
  const selectedFruit = s.fruitRecipeIndex == null ? null : recipe.fermentables[s.fruitRecipeIndex];
  const fruitLinkIssue = kind === 'fruit' && s.fruitRecipeIndex != null && (selectedFruit?.use !== 'fermentation' || recipe.nolo!.operations.some(o => o.kind === 'sugar' && o.recipeAddition?.index === s.fruitRecipeIndex));
  const operation = kind === 'fruit' ? fruitSugarOperation({ id: 'nolo-addition-preview', name, fruitKg: s.fruitKg, sugarsGPer100G: s.fruitSugarGPer100G, addedVolumeL: s.fruitVolumeL })
    : kind === 'priming' ? primingSugarOperation({ id: 'nolo-addition-preview', name, doseGL: s.primingGL, beerVolumeL: volumeL, sugar: s.primingSugar ?? 'sucrose' })
    : kind === 'blend' ? { value: { id: 'nolo-addition-preview', name, kind: 'blend' as const, volumeL: s.blendVolumeL ?? null, abvPct: s.blendAbvPct ?? null, remainingSugarG: s.blendVolumeL != null && s.blendSugarGL != null ? { min: s.blendVolumeL * s.blendSugarGL, max: s.blendVolumeL * s.blendSugarGL } : null }, issue: null }
    : aromaOperation({ id: 'nolo-addition-preview', name, doseML: s.aromaML, carrierAbvPct: s.carrierAbvPct == null ? null : { min: s.carrierAbvPct, max: s.carrierAbvPct }, sugarG: s.aromaSugarG });
  const impact = additionImpact({ baseVolumeL: volumeL, baseAbvPct: baseAbv, targetAbvPct: recipe.nolo!.targetAbvPct, operation: operation.value }, science);
  const apply = () => {
    if (!operation.value || fruitLinkIssue || kind === 'blend' && !impact.value) return;
    let fermentables = recipe.fermentables;
    let added: NoloOperation = { ...operation.value, id: kind === 'priming' ? 'planned-priming' : crypto.randomUUID() };
    if (kind === 'fruit' && added.kind === 'sugar') {
      const index = s.fruitRecipeIndex ?? fermentables.length;
      const fruit = { ...(selectedFruit ?? { kind: 'fruit' as const, use: 'fermentation' as const }), name, weightKg: s.fruitKg! };
      fermentables = index === fermentables.length ? [...fermentables, fruit] : fermentables.map((f, i) => i === index ? fruit : f);
      added = { ...added, recipeAddition: { index, basis: JSON.stringify(fruit) } };
    }
    const reset: Partial<NoloBrewToolsConfig> = kind === 'fruit' ? { fruitKg: null, fruitRecipeIndex: null, fruitVolumeL: null } : kind === 'priming' ? { primingGL: null } : kind === 'blend' ? { blendVolumeL: null } : { aromaML: null, aromaSugarG: null };
    const operations = recipe.nolo!.operations.some(o => o.id === added.id)
      ? recipe.nolo!.operations.map(o => o.id === added.id ? added : o) : [...recipe.nolo!.operations, added];
    const next = { ...recipe, fermentables, nolo: { ...recipe.nolo!, operations, brewTools: { ...s, ...reset, baseAbvPct: null } } };
    onChange(kind === 'fruit' && s.fruitRecipeIndex == null ? keepObservationsBeforeNewAddition(recipe, next) : next);
    setNotice(kind === 'fruit' ? `${name} inscrit dans les ingrédients et lié à un seul apport au bilan NOLO.` : `${name} inscrit au bilan NOLO. La dose de simulation est remise à renseigner pour le prochain ajout.`);
  };
  return <div className="nolo-tool-body">
    <BaseEditor {...props}/>
    <div className="nolo-grid"><label className="nolo-field">Type d’ajout<select className="nolo-input" value={kind} onChange={e => { update({ additionKind: e.target.value as NoloBrewToolsConfig['additionKind'] }); setNotice(''); }}><option value="fruit">Fruit / purée</option><option value="priming">Resucrage</option><option value="aroma">Arôme / extrait liquide</option><option value="blend">Bière d’assemblage</option></select></label><label className="nolo-field">Nom de l’ajout<Input className="nolo-input" value={s.additionName ?? ''} placeholder={name} onChange={e => update({ additionName: e.target.value })}/></label></div>
    {kind === 'fruit' && <label className="nolo-field">Ingrédient lié<select className="nolo-input" value={s.fruitRecipeIndex ?? ''} onChange={e => { const index = e.target.value === '' ? null : Number(e.target.value); update(index == null ? { fruitRecipeIndex: null } : { fruitRecipeIndex: index, additionName: recipe.fermentables[index].name, fruitKg: recipe.fermentables[index].weightKg }); }}><option value="">Créer le fruit dans la recette</option>{recipe.fermentables.map((f, i) => f.use === 'fermentation' && <option key={i} value={i} disabled={recipe.nolo!.operations.some(o => o.kind === 'sugar' && o.recipeAddition?.index === i)}>{f.name} · {noloNumber(f.weightKg)} kg</option>)}</select></label>}
    {kind === 'fruit' && <><div className="nolo-grid"><ToolNumber label="Masse de fruit" unit="kg" value={s.fruitKg} onChange={fruitKg => update({ fruitKg })}/><ToolNumber label="Sucres de la fiche produit" unit="g/100 g" value={s.fruitSugarGPer100G} onChange={fruitSugarGPer100G => update({ fruitSugarGPer100G })}/></div><ToolNumber label="Volume net apporté" unit="L" value={s.fruitVolumeL} onChange={fruitVolumeL => update({ fruitVolumeL })}/><p className="nolo-note">Le °Brix ne donne pas à lui seul la masse de sucres fermentescibles. Utilise la fiche produit ; le volume reste une hypothèse à mesurer.</p></>}
    {kind === 'priming' && <><div className="nolo-grid"><ToolNumber label="Dose de resucrage" unit="g/L" value={s.primingGL} onChange={primingGL => update({ primingGL })}/><label className="nolo-field">Sucre sec<select className="nolo-input" value={s.primingSugar ?? 'sucrose'} onChange={e => update({ primingSugar: e.target.value as 'sucrose' | 'glucose' })}><option value="sucrose">Saccharose</option><option value="glucose">Glucose anhydre</option></select></label></div><p className="nolo-note">Bilan de l’alcool apporté par le resucrage. Le CO₂ déjà dissous et la tenue du contenant demandent un calcul de conditionnement distinct.</p></>}
    {kind === 'aroma' && <><div className="nolo-grid"><ToolNumber label="Dose de produit" unit="mL" value={s.aromaML} onChange={aromaML => update({ aromaML })}/><ToolNumber label="Alcool du support" unit="% vol." value={s.carrierAbvPct} onChange={carrierAbvPct => update({ carrierAbvPct })}/></div><ToolNumber label="Sucre dans cette dose" unit="g" value={s.aromaSugarG} onChange={aromaSugarG => update({ aromaSugarG })}/></>}
    {kind === 'blend' && <><div className="nolo-grid"><ToolNumber label="Bière à assembler" unit="L" value={s.blendVolumeL} onChange={blendVolumeL => update({ blendVolumeL })}/><ToolNumber label="Sucres résiduels de cette bière" unit="g/L" value={s.blendSugarGL} onChange={blendSugarGL => update({ blendSugarGL })}/></div><ToolRange label="Alcool de la bière ajoutée" unit="% vol." value={s.blendAbvPct} onChange={blendAbvPct => update({ blendAbvPct })}/></>}
    <ToolComparison before={baseAbv} after={impact.value?.abvPct ?? null} target={recipe.nolo!.targetAbvPct}/>
    {impact.value && <table className="nolo-table" aria-label="Bilan de l’ajout"><tbody><tr><th>Sucres ajoutés</th><td>{noloNumber(impact.value.sugarG.max)} g</td></tr><tr><th>Volume final</th><td>{noloNumber(impact.value.finalVolumeL)} L</td></tr><tr><th>Marge à la borne haute</th><td className={impact.value.marginAbvPct < 0 ? 'text-alert-strong' : ''}>{noloNumber(impact.value.marginAbvPct, 3)} point de % vol.</td></tr></tbody></table>}
    {impact.value && impact.value.marginAbvPct < 0 && <p className="nolo-error">Cet ajout peut dépasser la cible. Réduis la dose ou réserve davantage de marge dans le moût.</p>}
    {(operation.issue || impact.issue) && <p role="status" className="nolo-note">{operation.issue || impact.issue}</p>}
    {fruitLinkIssue && <p className="nolo-error" role="alert">Choisis un ingrédient encore sans bilan d’ajout, ou crée un nouveau fruit.</p>}
    <button type="button" className="nolo-action" disabled={!operation.value || fruitLinkIssue || kind === 'blend' && !impact.value || kind === 'priming' && recipe.nolo!.operations.some(o => o.id === 'planned-priming' || o.id === 'batch-priming')} onClick={apply}>{kind === 'fruit' ? 'Appliquer le fruit et son bilan' : 'Ajouter au bilan NOLO'}</button>
    {kind === 'priming' && recipe.nolo!.operations.some(o => o.id === 'planned-priming' || o.id === 'batch-priming') && <p className="nolo-note">Un resucrage figure déjà au bilan. Retire le resucrage prévu pour le remplacer, ou modifie le conditionnement du brassin.</p>}
    {notice && <p role="status" className="nolo-note">{notice}</p>}
    <p className="nolo-note">La plage va de l’absence de fermentation des sucres ajoutés à leur conversion maximale. La reprise sur les sucres résiduels de la bière n’est pas quantifiée ici.</p>
  </div>;
}

function DilutionTool(props: BaseProps) {
  const { settings: s, update, baseAbv, volumeL, recipe, onChange } = props;
  const [notice, setNotice] = useState('');
  const plan = dilutionTool({ baseVolumeL: volumeL, baseAbvPct: baseAbv, targetAbvPct: recipe.nolo!.targetAbvPct, waterL: s.waterL, initialIbu: s.initialIbu, capacityL: s.capacityL });
  const value = plan.value;
  return <div className="nolo-tool-body">
    <BaseEditor {...props}/>
    <ToolNumber label="Eau à ajouter" unit="L" value={s.waterL} onChange={waterL => update({ waterL })}/>
    <div className="nolo-action-row"><button type="button" className="nolo-action" onClick={() => update({ waterL: 0 })}>Partir sans dilution</button>{value?.requiredWaterL != null && <button type="button" className="nolo-action" onClick={() => update({ waterL: value.requiredWaterL })}>Essayer {noloNumber(value.requiredWaterL)} L pour la cible</button>}</div>
    {value && <>
      <label className="nolo-field">Explorer la dilution<input type="range" aria-label="Explorer la dilution" min={0} max={Math.max(value.requiredWaterL ?? 0, s.waterL ?? 0, volumeL ?? 0, 1)} step={.1} value={s.waterL ?? 0} onChange={e => update({ waterL: Number(e.target.value) })}/></label>
      <ToolComparison before={baseAbv} after={value.abvPct} target={recipe.nolo!.targetAbvPct}/>
      <table className="nolo-table" aria-label="Effets de la dilution"><tbody><tr><th>Volume après dilution</th><td>{noloNumber(value.finalVolumeL)} L</td></tr><tr><th>Part de bière conservée</th><td>{noloNumber(value.beerFractionPct)} % du mélange</td></tr><tr><th>IBU après dilution</th><td>{value.ibu == null ? 'IBU de départ à renseigner' : noloNumber(value.ibu)}</td></tr></tbody></table>
      {value.capacityExceeded && <p className="nolo-error">Le volume dépasse la capacité utile renseignée. Répartis le lot ou revois la dilution.</p>}
      {value.requiredIssue && <p className="nolo-note">{value.requiredIssue}</p>}
      {value.requiredCapacityExceeded && !value.capacityExceeded && <p className="nolo-note">La dilution nécessaire à la cible dépasserait la capacité utile.</p>}
      <button type="button" className="nolo-action" disabled={!(s.waterL! > 0) || value.capacityExceeded} onClick={() => {
        const operation: NoloOperation = { id: crypto.randomUUID(), name: 'Dilution du lot', kind: 'dilution', volumeL: s.waterL! };
        const next = { ...recipe, nolo: { ...recipe.nolo!, operations: [...recipe.nolo!.operations, operation], brewTools: { ...s, waterL: null, baseAbvPct: null, initialIbu: value.ibu } } };
        next.nolo.brewTools.ibuBasis = noloToolContext(next);
        onChange(next); setNotice(`${noloNumber(s.waterL!)} L d’eau inscrits au bilan. Volume prévu : ${noloNumber(value.finalVolumeL)} L. Prépare une eau adaptée et maîtrise l’apport d’oxygène.`);
      }}>Ajouter cette dilution au bilan</button>
    </>}
    {plan.issue && <p className="nolo-note" role="status">{plan.issue}</p>}
    <details><summary>Amertume et capacité utile</summary><div className="nolo-grid"><ToolNumber label="IBU avant dilution" value={s.initialIbu} onChange={initialIbu => update({ initialIbu })}/><ToolNumber label="Capacité utile du contenant" unit="L" value={s.capacityL} onChange={capacityL => update({ capacityL })}/></div></details>
    <p className="nolo-note">L’eau dilue aussi l’extrait et l’amertume. La part de bière représente une dilution physique ; elle ne prédit pas le corps ni les arômes perçus.</p>
    {notice && <p role="status" className="nolo-note">{notice}</p>}
  </div>;
}

function BenchTool({ settings: s, update, recipe, onChange, volumeL, science, navigate }: BaseProps) {
  const [notice, setNotice] = useState('');
  const plan = scaleBenchTrial({ sampleML: s.benchSampleML, doseML: s.benchDoseML, beerVolumeL: volumeL });
  const gravity = analyzeGravityTrial({ ogSg: s.trialOgSg, fgSg: s.trialFgSg, readingToleranceSg: s.readingToleranceSg }, science);
  const duplicate = recipe.nolo?.trials?.some(t => t.product === (s.additionName || '') && t.volumeL === (s.benchSampleML ?? 0) / 1000 && t.dosageML === s.benchDoseML);
  return <div className="nolo-tool-body">
    <p className="nolo-note">Compare un témoin et plusieurs doses dans la même bière avant de traiter le lot.</p>
    <label className="nolo-field">Produit à tester<Input className="nolo-input" value={s.additionName ?? ''} onChange={e => update({ additionName: e.target.value })} placeholder="Arôme, extrait, produit à titrer…"/></label>
    <div className="nolo-grid"><ToolNumber label="Bière par échantillon" unit="mL" value={s.benchSampleML} onChange={benchSampleML => update({ benchSampleML })}/><ToolNumber label="Dose centrale à tester" unit="mL" value={s.benchDoseML} onChange={benchDoseML => update({ benchDoseML })}/></div>
    {plan.value && <><table className="nolo-table" aria-label="Plan des verres de dégustation"><thead><tr><th>Échantillon</th><th>Bière · mL</th><th>Produit · mL</th></tr></thead><tbody>{plan.value.aliquots.map(a => <tr key={a.factor}><th>{a.factor === 0 ? 'Témoin' : `Dose × ${noloNumber(a.factor)}`}</th><td>{noloNumber(a.sampleML)}</td><td>{noloNumber(a.doseML, 3)}</td></tr>)}</tbody></table>
      <dl className="nolo-comparison"><dt>Équivalent de la dose centrale pour {noloNumber(volumeL!)} L</dt><dd>{noloNumber(plan.value.batchDoseML, 2)} mL de produit</dd></dl>
      <div className="nolo-action-row"><button type="button" className="nolo-action" disabled={!s.additionName?.trim() || duplicate} onClick={() => {
        onChange({ ...recipe, nolo: { ...recipe.nolo!, trials: [...(recipe.nolo!.trials ?? []), { id: crypto.randomUUID(), name: `Essai ${s.additionName}`, product: s.additionName!, volumeL: s.benchSampleML! / 1000, dosageML: s.benchDoseML!, composition: '', carrierAbvPct: s.carrierAbvPct == null ? null : { min: s.carrierAbvPct, max: s.carrierAbvPct }, moment: '', tasting: '', comparator: 'Témoin du même lot sans ajout' }] } }); setNotice('Essai conservé. Renseigne la dégustation et la composition dans les détails du pilote.');
      }}>Conserver cet essai</button><button type="button" className="nolo-action" onClick={() => { update({ additionKind: 'aroma', aromaML: plan.value!.batchDoseML, aromaSugarG: null }); navigate('additions'); }}>Reporter la dose dans Ajouts</button></div>
    </>}
    {plan.issue && <p role="status" className="nolo-note">{plan.issue}</p>}
    {notice && <p role="status" className="nolo-note">{notice}</p>}
    <p className="nolo-note">Mise à l’échelle volumique uniquement. Pour un acide, le pH final demande une titration et une mesure ; pour un arôme, une dégustation. La dose équivalente n’est pas appliquée au lot.</p>
    <details><summary>Relire l’atténuation d’un pilote</summary><div className="nolo-grid"><ToolNumber label="OG relevée" unit="SG" value={s.trialOgSg} onChange={trialOgSg => update({ trialOgSg })}/><ToolNumber label="FG relevée" unit="SG" value={s.trialFgSg} onChange={trialFgSg => update({ trialFgSg })}/></div><ToolNumber label="Tolérance de chaque lecture" unit="± SG" value={s.readingToleranceSg} onChange={readingToleranceSg => update({ readingToleranceSg })}/>{gravity.value ? <><dl className="nolo-grid nolo-comparison"><div><dt>Atténuation apparente en SG</dt><dd>{noloToolRange(gravity.value.attenuationPct)}</dd></div><div><dt>Estimation OG–FG</dt><dd>{noloToolRange(gravity.value.abvPct)} vol.</dd></div></dl><button type="button" className="nolo-action" onClick={() => { update({ attenuationPct: gravity.value!.attenuationPct }); navigate('wort'); }}>Explorer cette atténuation dans Moût</button></> : <p className="nolo-note">{gravity.issue}</p>}<p className="nolo-note">Lectures corrigées en température. La plage décrit seulement l’erreur de lecture renseignée ; elle ne remplace pas une analyse d’alcool adaptée au NOLO, ni la variabilité entre brassins.</p></details>
    <details><summary>Préparer les mesures du pilote</summary><table className="nolo-table"><thead><tr><th>Moment</th><th>Données utiles</th></tr></thead><tbody><tr><th>Moût</th><td>Volume, densité, pH ; méthode de mesure</td></tr><tr><th>Avant ajouts</th><td>Alcool analysé avec incertitude, volume</td></tr><tr><th>Après conditionnement</th><td>Alcool du produit fini et validation de conservation</td></tr></tbody></table><p className="nolo-note">La section « Analyses rattachées à une étape » du bilan détaillé conserve les résultats et leur contexte.</p></details>
  </div>;
}

export function NoloBrewTools({ recipe, onChange, science, result, saved }: { recipe: TrialRecipe; onChange: (r: TrialRecipe) => void; science: NoloScience; result: ReturnType<typeof evaluateNoloRecipe>; saved: HopKnowledge[] }) {
  const [tool, setTool] = useState<Tool>('process');
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stored = recipe.nolo?.brewTools ?? emptyTools;
  const context = noloToolContext(recipe);
  const settings: NoloBrewToolsConfig = { ...stored, baseAbvPct: stored.baseBasis === context ? stored.baseAbvPct : null, initialIbu: stored.ibuBasis === context ? stored.initialIbu : null };
  const update = (patch: Partial<NoloBrewToolsConfig>) => onChange({ ...recipe, nolo: { ...recipe.nolo!, brewTools: { ...settings, ...patch, ...('baseAbvPct' in patch ? { baseBasis: context } : {}), ...('initialIbu' in patch ? { ibuBasis: context } : {}), version: 1 } } });
  const volume = useMemo(() => noloVolumeAfterOperations(recipe.nolo?.process === 'secondRunnings' ? recipe.nolo.secondRunnings?.recoveredL : recipe.volumeL, result?.activeOperations ?? recipe.nolo!.operations), [recipe.volumeL, recipe.nolo, result?.activeOperations]);
  const baseAbv = settings.baseMode === 'hypothesis' ? settings.baseAbvPct ?? null : result?.projection.max != null ? { min: result.projection.min, max: result.projection.max } : null;
  const props: BaseProps = { recipe, onChange, science, settings, update, volumeL: result ? result.volumeL : volume.value, baseAbv, result, navigate: setTool };
  return <section className="nolo-tools" aria-label="Outils de préparation NOLO">
    {((stored.baseAbvPct && stored.baseBasis !== context) || (stored.initialIbu != null && stored.ibuBasis !== context)) && <p className="nolo-note" role="status">Le mélange a changé. Renseigne à nouveau ses hypothèses d’alcool ou d’IBU avant le prochain calcul.</p>}
    <div role="tablist" aria-label="Outils NOLO" className="nolo-tabs">{tabs.map((tab, index) => <button key={tab.id} ref={el => { tabRefs.current[index] = el; }} type="button" role="tab" id={`${id}-${tab.id}`} aria-selected={tool === tab.id} aria-controls={`${id}-${tab.id}-panel`} tabIndex={tool === tab.id ? 0 : -1} onClick={() => setTool(tab.id)} onKeyDown={e => {
      const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length : e.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (next !== null) { e.preventDefault(); setTool(tabs[next].id); tabRefs.current[next]?.focus(); }
    }}>{tab.name}</button>)}</div>
    <div role="tabpanel" id={`${id}-process-panel`} aria-labelledby={`${id}-process`} hidden={tool !== 'process'}>
      <NoloProcessComparison recipe={recipe} science={science} onChange={onChange} saved={saved} current={result}/>
    </div>
    {tool !== 'process' && <div role="tabpanel" id={`${id}-${tool}-panel`} aria-labelledby={`${id}-${tool}`}>
      {tool === 'wort' && <WortTool {...props}/>}
      {tool === 'additions' && <AdditionsTool {...props}/>}
      {tool === 'dilution' && <DilutionTool {...props}/>}
      {tool === 'bench' && <BenchTool {...props}/>}
    </div>}
    {!!recipe.nolo!.operations.length && <details className="mt-2"><summary>Opérations inscrites au bilan · {recipe.nolo!.operations.length}</summary><table className="nolo-table"><tbody>{recipe.nolo!.operations.map((o, i) => <tr key={o.id}><th>{i + 1}. {o.name}</th><td>{'volumeL' in o && o.volumeL != null ? `${noloNumber(o.volumeL)} L` : o.kind === 'aroma' && o.volumeML != null ? `${noloNumber(o.volumeML)} mL` : 'À préciser'}</td><td><button type="button" className="nolo-action" disabled={o.id === 'batch-priming'} aria-label={`Retirer ${o.name}`} onClick={() => onChange({ ...recipe, nolo: { ...recipe.nolo!, operations: recipe.nolo!.operations.filter(item => item.id !== o.id) } })}>Retirer</button></td></tr>)}</tbody></table></details>}
  </section>;
}
