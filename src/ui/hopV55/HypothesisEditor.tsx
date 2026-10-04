import React, { useEffect, useMemo, useState } from 'react';
import type { BrewingScenarioBranchRequest, BrewingScenarioModelParameter } from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { Input, Textarea } from '../Input';
import { NumberInput } from '../NumberInput';
import {
  getHopV55ScenarioHypothesisOptions,
  reviseHopV55Analogy,
  reviseHopV55ModelHypothesis,
  type HopV55ModelParameterOption,
  type HopV55ScenarioAnalogyEdit,
} from '../../services/hopV55/scenarioHypotheses';
import './hypothesis-editor.css';

export interface HopV55HypothesisEditorProps {
  prepared: PreparedBrewingScenarioContext;
  branch?: BrewingScenarioBranchRequest;
  onRevise(branch: BrewingScenarioBranchRequest): void;
}

function sourceLabel(source: { title: string; author: string; year: number | null; reference: string; locator?: string }): string {
  return [source.title, source.author, source.year ?? 'non datée', source.reference, source.locator].filter(Boolean).join(' · ');
}

function visibleValue(option: HopV55ModelParameterOption): string {
  return `${option.current.range.min}–${option.current.range.max} ${option.unit} · central chargé ${option.current.central}`;
}

function assumptionValue(row: BrewingScenarioBranchRequest['assumptions'][number]): string {
  if (row.range) return `${row.range.min}–${row.range.max}${row.unit ? ` ${row.unit}` : ''}${row.central !== undefined ? ` · central ${row.central}` : ''}`;
  if (row.value !== undefined) return `${String(row.value)}${row.unit ? ` ${row.unit}` : ''}`;
  return 'Valeur non indiquée';
}

function parameterValue(parameter: BrewingScenarioModelParameter): string {
  return JSON.stringify(parameter);
}

export function HopV55HypothesisEditor({ prepared, branch, onRevise }: HopV55HypothesisEditorProps) {
  const options = useMemo(() => getHopV55ScenarioHypothesisOptions(prepared), [prepared]);
  const [modelId, setModelId] = useState('');
  const [parameterKey, setParameterKey] = useState('');
  const [rangeMode, setRangeMode] = useState<'exact' | 'range'>('exact');
  const [exactValue, setExactValue] = useState<number>();
  const [minimum, setMinimum] = useState<number>();
  const [maximum, setMaximum] = useState<number>();
  const [central, setCentral] = useState<number>();
  const [explanation, setExplanation] = useState('');
  const [analogyKind, setAnalogyKind] = useState<'hopDescriptions' | 'yeastProfile'>('hopDescriptions');
  const [targetId, setTargetId] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [analogyExplanation, setAnalogyExplanation] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const modelOptions = options.models;
  const parameters = options.modelParameters.filter(row => row.modelId === modelId);
  const selectedParameter = parameters.find(row => parameterValue(row.parameter) === parameterKey);
  const selectedAssumptions = (branch?.assumptions ?? []).filter(row => row.status === 'selected');
  const proposedAssumptions = (branch?.assumptions ?? []).filter(row => row.status === 'proposed');
  const varietyById = new Map(options.varieties.map(row => [row.id, row]));
  const yeastById = new Map(options.yeasts.map(row => [row.id, row]));
  const analogyTargets = analogyKind === 'hopDescriptions' ? options.varieties : options.yeasts;
  const analogyReferences = analogyKind === 'hopDescriptions' ? options.varieties : options.yeastAnalogyReferences.map(row => row.yeast);

  useEffect(() => {
    setModelId(''); setParameterKey(''); setExactValue(undefined); setMinimum(undefined); setMaximum(undefined); setCentral(undefined);
    setTargetId(''); setReferenceId(''); setError(''); setNotice('');
  }, [prepared]);

  function resetFeedback() { setError(''); setNotice(''); }

  function submitModel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); resetFeedback();
    if (!branch || !selectedParameter) return;
    const numeric = (value: number | undefined, label: string): number => {
      if (value === undefined || !Number.isFinite(value)) throw new Error(`${label} doit être déclaré comme nombre fini.`);
      return value;
    };
    try {
      const next = reviseHopV55ModelHypothesis({ prepared, branch, modelId, parameter: selectedParameter.parameter,
        unit: selectedParameter.unit,
        ...(rangeMode === 'exact' ? { value: numeric(exactValue, 'La valeur') } : {
          range: { min: numeric(minimum, 'La borne basse'), max: numeric(maximum, 'La borne haute') },
          central: numeric(central, 'Le central'),
        }), explanation });
      onRevise(next);
      setNotice('Hypothèse ajoutée à la branche. Le résultat doit être recalculé pour afficher son effet.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Hypothèse refusée.'); }
  }

  function submitAnalogy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); resetFeedback();
    if (!branch) return;
    try {
      const edit: HopV55ScenarioAnalogyEdit = analogyKind === 'hopDescriptions'
        ? { kind: 'hopDescriptions', targetVarietyId: targetId, referenceVarietyId: referenceId, explanation: analogyExplanation }
        : { kind: 'yeastProfile', targetYeastId: targetId, referenceYeastId: referenceId, explanation: analogyExplanation };
      const next = reviseHopV55Analogy({ prepared, branch, edit });
      onRevise(next);
      setNotice('Analogie ajoutée à la branche. Les données sources restent intactes; le résultat doit être recalculé.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Analogie refusée.'); }
  }

  return <section className="hv-hypothesis" aria-label="Hypothèses et analogies de la branche">
    <div className="hv-hypothesis-current">
      <h3>Choix déclarés dans la branche</h3>
      {!branch ? <p>Prépare une branche à comparer avant de réviser ses hypothèses.</p> : <>
        {selectedAssumptions.length ? <ul className="hv-hypothesis-list">{selectedAssumptions.map(row => {
          const override = branch.modelOverrides?.find(item => item.assumptionId === row.id);
          const parameterOption = override ? options.modelParameters.find(item => item.modelId === override.modelId
            && parameterValue(item.parameter) === parameterValue(override.parameter)) : undefined;
          const model = override ? options.models.find(item => item.id === override.modelId) : undefined;
          return <li key={row.id}>
            <div><strong>{row.label}</strong><span>{assumptionValue(row)} · hypothèse sélectionnée</span>
              {override ? <small>Modèle : {model?.name ?? override.modelId} · v{model?.version ?? 'version conservée'} · {override.modelId} · {parameterOption?.label ?? JSON.stringify(override.parameter)}</small> : null}
              <small>{row.explanation}</small>{row.source ? <small>Source déclarée : {sourceLabel(row.source)}</small> : null}
              {parameterOption ? <details><summary>Sources du paramètre chargé</summary><ul>{parameterOption.sources.map((source, index) => <li key={`${source.reference}-${index}`}>{sourceLabel(source)}</li>)}</ul></details> : null}
            </div>
          </li>;
        })}</ul> : <p>Aucune hypothèse n’est sélectionnée dans cette branche.</p>}
        {proposedAssumptions.length ? <details className="hv-hypothesis-context"><summary>Hypothèses proposées ou remplacées · {proposedAssumptions.length}</summary>
          <ul>{proposedAssumptions.map(row => <li key={row.id}><strong>{row.label}</strong> · {assumptionValue(row)}<br />{row.explanation}</li>)}</ul>
        </details> : null}
        {(branch.analogies ?? []).length ? <div className="hv-hypothesis-analogies"><h4>Analogies déclarées</h4>
          {(branch.analogies ?? []).map((row, index) => {
            const target = row.kind === 'hopDescriptions' ? varietyById.get(row.targetVarietyId)?.name : yeastById.get(row.targetYeastId)?.name;
            const reference = row.kind === 'hopDescriptions' ? varietyById.get(row.referenceVarietyId)?.name : yeastById.get(row.referenceYeastId)?.name;
            return <p key={`${row.kind}-${row.assumptionId ?? index}`}><strong>{target ?? 'Identité cible conservée'}</strong> ← {reference ?? 'Identité de référence conservée'}
              <small>{row.explanation}</small></p>;
          })}
        </div> : null}
      </>}
      {prepared.limitations.length ? <details className="hv-hypothesis-context"><summary>Conditions et limites du contexte chargé</summary>
        <ul>{prepared.limitations.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ul>
      </details> : null}
      {branch?.biologicalInputs?.length ? <details className="hv-hypothesis-context"><summary>Contributions biologiques conservées · lecture seule</summary>
        <p>Le contrat distingue analyte, unité, base, source, matrice et point temporel. Cette révision ne modifie pas ces nœuds imbriqués et n’infère aucune conversion.</p>
        <ul>{branch.biologicalInputs.map(row => <li key={row.id}>{row.kind} · {row.id}</li>)}</ul>
      </details> : null}
    </div>

    {branch ? <details className="hv-hypothesis-edit">
      <summary>Réviser une hypothèse ou un analogue</summary>
      <p className="hv-hypothesis-note">La révision change la branche de prévision. Elle n’écrit ni le modèle, ni le catalogue, ni une recette ou un fait du brassin.</p>
      {options.ambiguousModels.length ? <p className="hv-hypothesis-error">Modèles non sélectionnables : l’identité est dupliquée dans le contexte chargé ({options.ambiguousModels.map(row => `${row.id} · versions ${row.versions.join(', ')}`).join(' ; ')}). Recharge une seule version avant de réviser ces paramètres.</p> : null}
      <form autoComplete="off" className="hv-hypothesis-form" onSubmit={submitModel}>
        <h4>Paramètre d’un modèle chargé</h4>
        {!modelOptions.length ? <p role="status" className="hv-hypothesis-wide">Aucun modèle d’extrapolation activé n’est chargé dans ce contexte.</p> : null}
        <label><span>Modèle exact</span><select value={modelId} onChange={event => { setModelId(event.target.value); setParameterKey(''); }} required disabled={!modelOptions.length}>
          <option value="">Choisir un modèle chargé</option>{modelOptions.map(model => <option key={`${model.id}@${model.version}`} value={model.id}>{model.name} · v{model.version} · {model.id}</option>)}
        </select></label>
        <label><span>Paramètre typé</span><select value={parameterKey} onChange={event => { setParameterKey(event.target.value); setExactValue(undefined); setMinimum(undefined); setMaximum(undefined); setCentral(undefined); }} required disabled={!modelId}>
          <option value="">Choisir un paramètre déclaré</option>{parameters.map(row => <option key={parameterValue(row.parameter)} value={parameterValue(row.parameter)}>{row.label}</option>)}
        </select></label>
        {selectedParameter ? <div className="hv-hypothesis-source hv-hypothesis-wide">
          <p><strong>Valeur actuellement chargée</strong> · {visibleValue(selectedParameter)}</p>
          <p>{selectedParameter.note ?? 'Paramètre typé du modèle, sans correspondance à une analyse de matière.'}</p>
          <ul>{selectedParameter.sources.map((source, index) => <li key={`${source.reference}-${index}`}>{sourceLabel(source)}</li>)}</ul>
        </div> : null}
        <label><span>Forme de la déclaration</span><select value={rangeMode} onChange={event => setRangeMode(event.target.value as 'exact' | 'range')}>
          <option value="exact">Valeur exacte choisie</option><option value="range">Plage avec central déclaré</option>
        </select></label>
        {rangeMode === 'exact' ? <label><span>Valeur · {selectedParameter?.unit ?? 'unité du paramètre'}</span>
          <NumberInput value={exactValue} onValue={setExactValue} emptyValue={undefined} min={selectedParameter?.minimum} required /></label>
          : <>
            <label><span>Borne basse · {selectedParameter?.unit ?? 'unité du paramètre'}</span><NumberInput value={minimum} onValue={setMinimum} emptyValue={undefined} min={selectedParameter?.minimum} required /></label>
            <label><span>Borne haute · {selectedParameter?.unit ?? 'unité du paramètre'}</span><NumberInput value={maximum} onValue={setMaximum} emptyValue={undefined} min={selectedParameter?.minimum} required /></label>
            <label><span>Central explicite</span><NumberInput value={central} onValue={setCentral} emptyValue={undefined} min={selectedParameter?.minimum} required /></label>
          </>}
        <label className="hv-hypothesis-wide"><span>Pourquoi cette hypothèse ?</span><Textarea value={explanation} onChange={event => setExplanation(event.target.value)} rows={2} required /></label>
        <button type="submit" disabled={!modelId || !parameterKey || !explanation.trim()}>Réviser la branche</button>
      </form>

      <form autoComplete="off" className="hv-hypothesis-form hv-hypothesis-analogy" onSubmit={submitAnalogy}>
        <h4>Analogie sourcée entre identités chargées</h4>
        {!analogyTargets.length || !analogyReferences.length ? <p role="status" className="hv-hypothesis-wide">Aucune paire d’identités exactes et utilisables n’est chargée pour cette analogie.</p> : null}
        <label><span>Type d’analogie</span><select value={analogyKind} onChange={event => { setAnalogyKind(event.target.value as typeof analogyKind); setTargetId(''); setReferenceId(''); }}>
          <option value="hopDescriptions">Descripteurs de houblon</option><option value="yeastProfile">Profil de levure</option>
        </select></label>
        <label><span>Identité cible exacte</span><select value={targetId} onChange={event => setTargetId(event.target.value)} required>
          <option value="">Choisir l’identité cible</option>{analogyTargets.map(row => <option key={row.id} value={row.id}>{row.name} · {row.id}</option>)}
        </select></label>
        <label><span>Référence chargée exacte</span><select value={referenceId} onChange={event => setReferenceId(event.target.value)} required>
          <option value="">Choisir la référence</option>{analogyReferences.map(row => <option key={row.id} value={row.id}>
            {row.name} · {row.id}{analogyKind === 'yeastProfile' ? ` · profil dans ${(options.yeastAnalogyReferences.find(item => item.yeast.id === row.id)?.modelIds ?? []).join(', ')}` : ''}
          </option>)}
        </select></label>
        {targetId && referenceId && analogyKind === 'hopDescriptions' ? <div className="hv-hypothesis-source hv-hypothesis-wide">
          {(varietyById.get(referenceId)?.descriptions ?? []).map((row, index) => <p key={`${row.source.reference}-${index}`}>
            {row.text} · {row.context}<small>{sourceLabel(row.source)}</small>
          </p>)}
        </div> : null}
        {targetId && referenceId && analogyKind === 'yeastProfile' ? <div className="hv-hypothesis-source hv-hypothesis-wide">
          <p>La référence correspond à un profil exact chargé dans un modèle. Son profil est une analogie de modèle, pas une mesure de la souche cible.</p>
          {(options.yeastAnalogyReferences.find(row => row.yeast.id === referenceId)?.sources ?? []).map((source, index) => <small key={`${source.reference}-${index}`}>{sourceLabel(source)}</small>)}
        </div> : null}
        <label className="hv-hypothesis-wide"><span>Pourquoi cette analogie ?</span><Textarea value={analogyExplanation} onChange={event => setAnalogyExplanation(event.target.value)} rows={2} required /></label>
        <button type="submit" disabled={!targetId || !referenceId || !analogyExplanation.trim()}>Réviser la branche</button>
      </form>
    </details> : null}
    {error ? <p role="alert" className="hv-hypothesis-error">{error}</p> : null}
    {notice ? <p role="status" className="hv-hypothesis-notice">{notice}</p> : null}
  </section>;
}

export default HopV55HypothesisEditor;
