import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import type { NoloProcess, NoloScience } from '../../functions/src/noloSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { NoloBound } from '../../functions/src/noloCore';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { evaluateNoloRecipe } from '../domain/nolo';
import { noloProcessLabels } from '../domain/noloPresentation';
import { noloYeastCandidates } from '../domain/noloYeastSelection';
import { prepareNoloRecipe, adjustNoloRecipe, applyNoloRecipeProposal, noloRecipeProposalBasis,
  type NoloRecipeSettings, type NoloRecipeProposal } from '../domain/noloRecipeSolver';
import { Input } from './Input';
import { parseDecimal, useNumericDraft } from './numericInput';
import { noloDisplayRangeLabel } from './NoloAlcoholChart';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';
import './nolo-simulator.css';

const number = (value: number, digits = 2) => value.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const emptyKnowledge: HopKnowledge[] = [];
const DraftValidity = createContext<(label: string, invalid: boolean) => void>(() => {});

function Setting({ label, value, unit, onChange, min = 0, max, digits = 3, slider }: {
  label: string; value: number | null; unit?: string; onChange: (n: number) => void;
  min?: number; max?: number; digits?: number; slider?: { min: number; max: number; step: number };
}) {
  const id = useId();
  const report = useContext(DraftValidity);
  const { draft, push, settle } = useNumericDraft(value == null ? undefined : Number(value.toFixed(digits)),
    n => { if (typeof n === 'number' && Number.isFinite(n) && n >= min && (max == null || n <= max)) onChange(n); }, { emptyValue: undefined });
  const parsed = parseDecimal(draft);
  const invalid = parsed == null || parsed < min || (max != null && parsed > max);
  useEffect(() => { report(label, invalid); return () => report(label, false); }, [report, label, invalid]);
  return <div className="nolo-setting"><label htmlFor={id}>{label}</label><span className="nolo-setting-value">
    <Input id={id} name={`nolo_${id}`} type="text" inputMode="decimal" enterKeyHint="next" autoComplete="off"
      autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
      value={draft} aria-describedby={unit ? id + '-unit' : undefined} aria-invalid={invalid || undefined}
      required placeholder="À préciser" className="nolo-number" onFocus={event => event.currentTarget.select()}
      onChange={event => push(event.target.value)} onBlur={() => { if (!invalid) settle({ min, max }); }}/>
    {unit && <span id={id + '-unit'}>{unit}</span>}
  </span>{slider && value != null && <input type="range" name="nolo_simulation_range" autoComplete="off" data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
    aria-label={label + ' — curseur'} className="nolo-knob-slider" value={value} min={slider.min} max={Math.max(slider.max, value)} step={slider.step}
    onChange={event => onChange(Number(event.target.value))}/>}</div>;
}

function RangeSetting({ label, value, unit, onChange, min = 0, max = 100, digits = 2 }: {
  label: string; value: HopRange; unit: string; onChange: (range: HopRange) => void;
  min?: number; max?: number; digits?: number;
}) {
  return <fieldset className="nolo-range-setting"><legend>{label} · {unit}</legend><div>
    <Setting label={label + ' minimum'} value={value.min} min={min} max={max} digits={digits} onChange={n => onChange({ ...value, min: n })}/>
    <span aria-hidden="true">–</span>
    <Setting label={label + ' maximum'} value={value.max} min={min} max={max} digits={digits} onChange={n => onChange({ ...value, max: n })}/>
  </div></fieldset>;
}

/** A bounded interval on an honest shared scale; the goal is a limit, not a mean. */
function SimulationRange({ bound, target, current }: { bound: NoloBound; target: number; current: NoloBound | null }) {
  const limit = Math.max(.6, Math.ceil(Math.max(bound.max ?? target, target) * 10) / 10 + .1);
  const position = (n: number) => Math.min(100, Math.max(0, n / limit * 100));
  const crosses = bound.max != null && bound.min <= target && bound.max > target;
  return <figure className="nolo-simulation-range" aria-label="Résultat de la simulation NOLO" data-nolo-min={bound.min} data-nolo-max={bound.max ?? 'unknown'}>
    <figcaption><span>Alcool estimé</span><strong>{noloDisplayRangeLabel(bound)}</strong></figcaption>
    {bound.max != null && <>
      <div className="nolo-simulation-track" role="img" aria-label={`${noloDisplayRangeLabel(bound)} ; cible au maximum ${number(target)} % vol.`}>
        <span className="nolo-simulation-safe" style={{ width: position(target) + '%' }}/>
        <span className="nolo-simulation-band" style={{ left: position(bound.min) + '%', width: Math.max(.4, position(bound.max) - position(bound.min)) + '%' }}/>
        <span className="nolo-simulation-target" style={{ left: position(target) + '%' }}/>
      </div>
      <div className="nolo-simulation-axis"><span>0 %</span><span>{number(limit)} %</span></div>
    </>}
    <p className={bound.min > target || crosses ? 'text-attention' : 'text-cave-200'}>
      <span className="nolo-target-legend">Cible ≤ {number(target)} %</span> ·{' '}
      {bound.max == null ? 'Compléter les points signalés pour calculer la plage.' : bound.min > target ? 'Toute la plage dépasse la consigne.' : crosses ? 'La borne haute dépasse la consigne.' : 'Plage sous la consigne, avec ces hypothèses.'}
    </p>
    <p className="text-cave-400">Recette actuelle : {current ? noloDisplayRangeLabel(current) : 'à caractériser'}</p>
    <p className="sr-only" aria-live="polite" aria-atomic="true">Estimation : {noloDisplayRangeLabel(bound)} ; cible au maximum {number(target)} % vol.{bound.max != null && bound.max > target ? ' Dépassement de la cible.' : ''}</p>
  </figure>;
}

export function NoloRecipeSimulator({ recipe, onChange, science, saved = emptyKnowledge, variant = false }: {
  recipe: TrialRecipe; onChange: (next: TrialRecipe) => void; science: NoloScience; saved?: HopKnowledge[]; variant?: boolean;
}) {
  const [process, setProcess] = useState<NoloProcess>(recipe.nolo?.process ?? 'restricted');
  const [target, setTarget] = useState(recipe.nolo?.targetAbvPct ?? .5);
  const [yeastId, setYeastId] = useState(recipe.yeast.hopIndexId ?? '');
  // Wizard build() creates new objects on every keystroke. A name edit has no
  // brewing effect; keep it outside the calculation and merge it on application.
  const recipeInputsKey = noloRecipeProposalBasis({ ...recipe, name: '' });
  const sourceRecipe = useMemo(() => JSON.parse(recipeInputsKey) as TrialRecipe, [recipeInputsKey]);
  const candidates = useMemo(() => noloYeastCandidates({ ...sourceRecipe, nolo: { ...sourceRecipe.nolo!, process } }, science, saved), [sourceRecipe, process, science, saved]);
  const selected = candidates.find(candidate => candidate.strain.yeastId === yeastId) ?? candidates[0];
  const [edited, setEdited] = useState<NoloRecipeProposal | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const reportValidity = useCallback((label: string, invalid: boolean) => setInvalidFields(previous =>
    invalid === previous.includes(label) ? previous : invalid ? [...previous, label] : previous.filter(item => item !== label)), []);
  const prepared = useMemo(() => {
    if (!selected) return { proposal: null, error: 'Aucune souche documentée pour ce procédé. Choisir une autre méthode ou compléter les références.' };
    try { return { proposal: prepareNoloRecipe(sourceRecipe, science, selected.strain, { process, targetAbvPct: target }), error: '' }; }
    catch (cause) { return { proposal: null, error: cause instanceof Error ? cause.message : 'Recette à compléter pour préparer la simulation.' }; }
  }, [sourceRecipe, science, selected, process, target]);
  const proposal = edited ?? prepared.proposal;
  const stale = proposal != null && proposal.basis !== recipeInputsKey;
  const current = useMemo(() => { try { return evaluateNoloRecipe(sourceRecipe, saved)?.projection ?? null; } catch { return null; } }, [sourceRecipe, saved]);
  const choose = () => { setEdited(null); setError(''); setNotice(''); };
  const adjust = (patch: Partial<NoloRecipeSettings>) => {
    if (!proposal || stale) return;
    try { setEdited(adjustNoloRecipe(proposal, patch, science)); setError(''); setNotice(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Vérifier ce réglage.'); }
  };
  const apply = () => {
    if (!proposal || stale || invalidFields.length) return;
    try {
      const next = applyNoloRecipeProposal(recipe, { ...proposal, basis: noloRecipeProposalBasis(recipe),
        sourceRecipe: recipe, recipe: { ...proposal.recipe, name: recipe.name } });
      onChange(next);
      setEdited(null);
      setError('');
      setNotice(`Programme appliqué à la ${variant ? 'variante' : 'recette'}. Les quantités, paliers et consignes restent modifiables.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible d’appliquer cette simulation.'); }
  };
  const s = proposal?.settings;
  const baseGrainKg = proposal?.sourceRecipe.fermentables.filter(f => (f.kind ?? 'grain') === 'grain' && f.use !== 'fermentation').reduce((sum, f) => sum + f.weightKg, 0) ?? 0;
  return <DraftValidity.Provider value={reportValidity}><section key={resetKey} className="nolo-simulator" aria-label="Simulateur de recette NOLO">
    <div className="nolo-solver-goal">
      <label>Procédé<select aria-label="Procédé à simuler" value={process} onChange={event => { setProcess(event.target.value as NoloProcess); setYeastId(''); choose(); }}>
        {Object.entries(noloProcessLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <Setting label="Consigne d’alcool" value={target} unit="%" max={.5} onChange={value => { setTarget(value); choose(); }}/>
    </div>
    <label className="nolo-solver-yeast">Levure · {candidates.length} propositions pour ce procédé
      <select aria-label="Levure de la simulation" value={selected?.strain.yeastId ?? ''} onChange={event => { setYeastId(event.target.value); choose(); }}>
        {candidates.map(({ strain }) => <option key={strain.yeastId} value={strain.yeastId}>{strain.name}</option>)}
      </select>
    </label>
    {selected && <p className="nolo-solver-reason">{selected.reason}</p>}
    {(error || prepared.error) && <p role="alert" className="nolo-error">{error || prepared.error}</p>}
    {stale && <p role="alert" className="nolo-error">La recette a changé. Réinitialiser l’essai pour reprendre ses nouvelles données.</p>}
    {invalidFields.length > 0 && <p role="alert" className="nolo-error">Saisie à corriger : {invalidFields.join(', ')}. Entrer un nombre dans les limites du champ.</p>}
    {proposal && s && <>
      <SimulationRange bound={!invalidFields.length && proposal.result?.projection || { min: 0, max: null, kind: 'unknown', confidence: 'low' }} target={target} current={current}/>
      <div className="nolo-solver-knobs" aria-label="Réglages préremplis de la simulation">
        <Setting label="Densité initiale visée" value={s.ogSg} unit="SG" min={1} max={1.3} digits={4} slider={{ min: 1, max: Math.max(1.025, s.ogSg * 1.02), step: .0005 }} onChange={ogSg => adjust({ ogSg })}/>
        {process !== 'secondRunnings' && <Setting label="Charge de grain" value={baseGrainKg * s.grainScale} unit="kg" max={100000} digits={3} onChange={value => { if (baseGrainKg > 0) adjust({ grainScale: value / baseGrainKg }); }}/ >}
        <RangeSetting label="Atténuation envisagée" value={s.attenuationPct} unit="%" onChange={attenuationPct => adjust({ attenuationPct })}/>
        <Setting label="Température de fermentation" value={s.fermentationTempC} unit="°C" max={50} digits={1} onChange={fermentationTempC => adjust({ fermentationTempC })}/>
        <Setting label="Variation de l’extrait" value={s.extractTolerancePct} unit="± %" max={80} digits={1} onChange={extractTolerancePct => adjust({ extractTolerancePct })}/>
        {process === 'arrested' && s.stopSg && <RangeSetting label="Densité d’arrêt" value={s.stopSg} unit="SG" min={1} max={1.3} digits={4} onChange={stopSg => adjust({ stopSg })}/>}
        {process === 'dealcoholized' && <>
          {s.removedPct && <RangeSetting label="Retrait de l’alcool" value={s.removedPct} unit="%" onChange={removedPct => adjust({ removedPct })}/>}
          <Setting label="Volume après traitement" value={s.finalVolumeL} unit="L" max={100000} onChange={finalVolumeL => adjust({ finalVolumeL })}/>
        </>}
        {process === 'coldContact' && <Setting label="Contact à froid" value={s.contactHours} unit="h" max={1000} onChange={contactHours => adjust({ contactHours })}/>}
        {['coldExtraction', 'secondRunnings'].includes(process) && <>
          <Setting label="Température d’extraction" value={s.extractionTempC} unit="°C" max={100} onChange={extractionTempC => adjust({ extractionTempC })}/>
          <Setting label="Durée d’extraction" value={s.extractionHours} unit="h" max={1000} onChange={extractionHours => adjust({ extractionHours })}/>
        </>}
        {process === 'secondRunnings' && <Setting label="Volume de récupération visé" value={s.recoveredVolumeL} unit="L" max={100000} onChange={recoveredVolumeL => adjust({ recoveredVolumeL })}/>}
      </div>
      <p className="nolo-solver-confidence"><strong>Plage de simulation</strong> · {proposal.confidence.level === 'documented' ? 'atténuation publiée, extrait à confirmer par un pilote.' : 'atténuation et extrait à calibrer sur un pilote.'}</p>
      {proposal.blocking.length > 0 && <ul role="alert" className="nolo-solver-errors">{proposal.blocking.map((message, index) => <li key={index}>{message}</li>)}</ul>}
      <div className="nolo-solver-actions">
        <button type="button" className="nolo-solver-apply" disabled={stale || !!error || invalidFields.length > 0 || proposal.blocking.length > 0} onClick={apply}><Sparkles size={14} aria-hidden="true"/>Appliquer à la {variant ? 'variante' : 'recette'}</button>
        <button type="button" className="nolo-solver-reset" onClick={() => { choose(); setResetKey(key => key + 1); }} title="Revenir aux réglages préremplis depuis la recette et la consigne"><RotateCcw size={13} aria-hidden="true"/>Réinitialiser</button>
      </div>
      <details className="nolo-solver-details"><summary>Programme prérempli · {number(s.yeastQty)} {s.yeastUnit} · {number(s.fermentationDays)} j</summary>
        <div className="nolo-solver-knobs">
          <Setting label="Quantité de levure" value={s.yeastQty} unit={s.yeastUnit} max={100000} onChange={yeastQty => adjust({ yeastQty })}/>
          <Setting label="Durée de fermentation prévue" value={s.fermentationDays} unit="j" max={1000} onChange={fermentationDays => adjust({ fermentationDays })}/>
          {!['coldExtraction', 'secondRunnings'].includes(process) && <>
            <Setting label="Palier d’empâtage" value={s.mashTempC} unit="°C" max={100} onChange={mashTempC => adjust({ mashTempC })}/>
            <Setting label="Durée du palier" value={s.mashMinutes} unit="min" max={1000} onChange={mashMinutes => adjust({ mashMinutes })}/>
            <Setting label="Eau d’empâtage par kg" value={s.mashRatioLKg} unit="L/kg" max={100} onChange={mashRatioLKg => adjust({ mashRatioLKg })}/>
          </>}
          <Setting label="Efficacité envisagée" value={s.efficiencyPct} unit="%" min={1} max={100} onChange={efficiencyPct => adjust({ efficiencyPct })}/>
          <Setting label="Réserve pour les ajouts" value={s.reserveAbvPct} unit="% vol." max={.5} onChange={reserveAbvPct => adjust({ reserveAbvPct })}/>
        </div>
        <p>Température et durée sont des consignes de conduite. Leur modification ne donne pas artificiellement un taux d’alcool.</p>
      </details>
      <details className="nolo-solver-details"><summary>Champs de la recette · {proposal.changes.length} changement{proposal.changes.length > 1 ? 's' : ''} proposé{proposal.changes.length > 1 ? 's' : ''}</summary>
        <table aria-label="Changements proposés dans la recette NOLO"><thead><tr><th>Champ</th><th>Actuel</th><th>Proposé</th></tr></thead>
          <tbody>{proposal.changes.map((change, index) => <tr key={index}><th scope="row">{change.label}</th><td>{change.before}</td><td>{change.after}</td></tr>)}</tbody>
        </table>
      </details>
      <details className="nolo-solver-details"><summary>Hypothèses, limites et sources{proposal.warnings.length ? ` · ${proposal.warnings.length} point${proposal.warnings.length > 1 ? 's' : ''} à vérifier` : ''}</summary>
        <p><strong>{proposal.confidence.label}</strong> · {proposal.confidence.detail}</p>
        <ul>{[...proposal.warnings, ...proposal.assumptions].map((message, index) => <li key={index}>{message}</li>)}</ul>
        <p>Intervalle de simulation, sans probabilité statistique attribuée. Un pilote mesuré permet de resserrer les hypothèses ; l’analyse d’alcool vérifie le produit final.</p>
        {proposal.sources.map((source, index) => <HopSourceLink key={index} source={source}/>)}
      </details>
    </>}
    {notice && <p role="status" className="nolo-solver-notice">{notice}</p>}
  </section></DraftValidity.Provider>;
}
