import React, { useEffect, useState } from 'react';
import type { HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingScenarioCultureContext } from '../../domain/brewingScenario';
import { suggestNextBrewingReferenceVersion, type BrewingReferenceIdentityV1, type BrewingReferenceVersionV1 } from '../../domain/brewingReference';
import type { HopV55Workspace } from '../../services/hopV55/contracts';
import type { HopProgramAddition, HopUse } from '../../domain/hopDecision/types';
import { Input } from '../Input';
import { HopV55CultureHypothesisEditor } from './CultureHypothesisEditor';
import { HopV55ExactInput } from './ExactInput';
import { hopV55Uses } from './ProgramEditor';

type Hypothesis = HopV55Workspace['referenceHypotheses'][number];

function sameIdentity(reference: BrewingReferenceVersionV1, identity: BrewingReferenceIdentityV1): boolean {
  return reference.id === identity.id && reference.version === identity.version && reference.contentReference === identity.contentReference;
}

export function HopV55ReferenceEditor({ prepared, hypotheses, references, currentReference, initialCulture, cultureSourceLabel, onAdopt }: {
  prepared: PreparedBrewingScenarioContext;
  hypotheses: Hypothesis[];
  references: readonly BrewingReferenceVersionV1[];
  currentReference: BrewingReferenceIdentityV1 | null;
  initialCulture?: BrewingScenarioCultureContext;
  cultureSourceLabel?: string;
  onAdopt(hypothesis: Hypothesis, referenceVersion: string): void;
}) {
  const lastHypothesis = hypotheses[hypotheses.length - 1];
  const [draftReferenceId] = useState(() => `reference:${crypto.randomUUID()}`);
  const referenceId = currentReference?.id ?? lastHypothesis?.id ?? draftReferenceId;
  const seriesHypotheses = hypotheses.filter(row => row.id === referenceId);
  const seriesReferences = references.filter(row => row.id === referenceId);
  const revisionBase = currentReference
    ? seriesHypotheses.find(row => String(row.version) === currentReference.version)
    : seriesHypotheses[seriesHypotheses.length - 1];
  const versionSuggestion = suggestNextBrewingReferenceVersion(references, referenceId);
  const historyKey = seriesReferences.map(row => `${row.version}:${row.contentReference}`).join('|');
  const [label, setLabel] = useState('Ma référence de travail');
  const [explicitVersion, setExplicitVersion] = useState<{ id: string; historyKey: string; value: string }>();
  const [volumeL, setVolumeL] = useState<number>();
  const [cultureDraft, setCultureDraft] = useState<BrewingScenarioCultureContext>();
  const [cultureReason, setCultureReason] = useState('');
  const [cultureConfirmed, setCultureConfirmed] = useState(false);
  const [materialId, setMaterialId] = useState('');
  const [grams, setGrams] = useState<number>();
  const [use, setUse] = useState<HopUse | ''>('');
  const [temperature, setTemperature] = useState<number>();
  const [hours, setHours] = useState<number>();
  const [additions, setAdditions] = useState<HopProgramAddition[]>([]);
  const [knownEmpty, setKnownEmpty] = useState(false);
  const [error, setError] = useState('');
  const yeasts = prepared.runtime.engineData.knowledge.filter((row): row is HopYeast => row.kind === 'yeast');
  const initialCultureKey = JSON.stringify({ culture: initialCulture ?? null, source: cultureSourceLabel ?? null });
  useEffect(() => {
    setCultureDraft(initialCulture ? structuredClone(initialCulture) : undefined);
    setCultureReason(''); setCultureConfirmed(false);
  }, [initialCultureKey]);

  async function confirmCulture(culture: BrewingScenarioCultureContext, reason: string): Promise<void> {
    setCultureDraft(structuredClone(culture));
    setCultureReason(reason);
    setCultureConfirmed(true);
    setError('');
  }

  function add() {
    if (!materialId || grams === undefined || !use) return setError('Précise la matière, la masse et l’emploi de cette hypothèse.');
    setAdditions(rows => [...rows, { id: `hyp-hop:${crypto.randomUUID()}`, materialId, grams, use,
      status: 'planned', contactHours: hours ?? null, temperatureC: temperature ?? null }]);
    setKnownEmpty(false); setError('');
  }
  function adopt(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim() || volumeL === undefined || volumeL <= 0 || !additions.length && !knownEmpty) return setError('Nomme la référence, renseigne son volume et déclare son programme. Une donnée absente n’est pas zéro.');
    if (!cultureConfirmed || !cultureDraft || !cultureReason.trim()) return setError('Confirme explicitement une hypothèse de culture et son motif avant l’adoption de la référence.');
    const inputYeastId = cultureDraft.state === 'single' && cultureDraft.members.length === 1
      ? cultureDraft.members[0].yeastId ?? null : null;
    const input: HopRecipeInput = { volumeL, yeastId: inputYeastId, fermentation: [], additions: additions.map(addition => {
      const material = prepared.runtime.materials.find(row => row.id === addition.materialId)!;
      return { id: addition.id, name: material.name, triplet: { varietyId: material.variety?.id ?? material.lot?.varietyId ?? null,
        lotId: material.lot?.id ?? null, yeastId: inputYeastId, timing: addition.use, doseGL: addition.grams! / volumeL,
        temperatureC: addition.temperatureC ?? null, contactHours: addition.contactHours ?? null, matrixId: null } };
    }) };
    const referenceVersion = versionSuggestion.status === 'suggested'
      ? versionSuggestion.version : explicitVersion?.id === referenceId && explicitVersion.historyKey === historyKey
        ? explicitVersion.value : '';
    if (!referenceVersion) return setError('Les versions archivées sont opaques; saisis explicitement le prochain libellé de version.');
    if (!referenceVersion.trim()) return setError('Le libellé explicite de version doit contenir au moins un caractère non blanc.');
    if (seriesReferences.some(row => row.version === referenceVersion)) return setError('Cette version exacte existe déjà dans l’historique de cette référence.');
    const eventVersion = Math.max(seriesReferences.length, ...seriesHypotheses.map(row => row.version), 0) + 1;
    const knownProgramRevisions = seriesHypotheses.flatMap(row => row.baseline.kind === 'hypothetical' && row.baseline.program
      ? [row.baseline.program.revision] : []);
    const programRevision = (revisionBase?.baseline.kind === 'hypothetical'
      ? revisionBase.baseline.program?.revision ?? 0 : Math.max(0, ...knownProgramRevisions)) + 1;
    const id = referenceId;
    const cultureForReference: BrewingScenarioCultureContext = {
      ...structuredClone(cultureDraft),
      explanation: cultureDraft.explanation
        ? `${cultureDraft.explanation}\nMotif de l’hypothèse : ${cultureReason.trim()}`
        : `Motif de l’hypothèse : ${cultureReason.trim()}`,
    };
    onAdopt({ id, version: eventVersion, label: label.trim(), recordedAt: new Date().toISOString(),
      baseline: { kind: 'hypothetical', label: label.trim(), input, program: { id, revision: programRevision,
        stage: 'planning', volumeL, wortGravity: null, additions: structuredClone(additions) }, culture: cultureForReference } }, referenceVersion);
    setError('');
  }
  const versionInput = versionSuggestion.status === 'explicitVersionRequired'
    ? explicitVersion?.id === referenceId && explicitVersion.historyKey === historyKey ? explicitVersion.value : ''
    : versionSuggestion.version;
  const versionAlreadyExists = seriesReferences.some(row => row.version === versionInput);
  const invalidVersion = versionSuggestion.status === 'explicitVersionRequired' && (!versionInput.trim() || versionAlreadyExists);
  return <details className="hv-details" open={!lastHypothesis}><summary>{currentReference
    ? `${revisionBase ? 'Réviser la référence active' : 'Nouvelle version de la référence active'} · v${currentReference.version}`
    : lastHypothesis ? `Référence hypothétique v${lastHypothesis.version} · ${lastHypothesis.label}` : 'Déclarer une hypothèse de référence'}</summary>
    <p>Cette référence estime un programme possible. Elle ne décrit pas un fait observé et ne modifie aucune recette.</p>
    {currentReference && !revisionBase ? <p>La version courante est opaque pour l’ancien éditeur numérique. Saisis les valeurs de cette nouvelle hypothèse; aucun contenu historique n’est repris implicitement.</p> : null}
    {revisionBase ? <button type="button" onClick={() => {
      if (revisionBase.baseline.kind !== 'hypothetical') return;
      setLabel(revisionBase.label); setVolumeL(revisionBase.baseline.input.volumeL);
      setAdditions(structuredClone(revisionBase.baseline.program?.additions ?? [])); setKnownEmpty(revisionBase.baseline.input.additions.length === 0);
      setCultureConfirmed(false);
    }}>Reprendre les valeurs de la référence active pour une révision</button> : null}
    <p role="status">{versionSuggestion.status === 'suggested'
      ? `Prochaine version de cette série · v${versionSuggestion.version}${currentReference ? ` · filiation depuis v${currentReference.version}` : ''}.`
      : `Les versions conservées ne sont pas toutes des entiers décimaux canoniques (${versionSuggestion.opaqueVersions.join(', ')}); une nouvelle version explicite est requise sans conversion.`}</p>
    <HopV55CultureHypothesisEditor initialCulture={initialCulture} documentedYeasts={yeasts} sourceLabel={cultureSourceLabel}
      readOnly={cultureConfirmed} onConfirm={confirmCulture} />
    {cultureConfirmed ? <button type="button" onClick={() => { setCultureConfirmed(false); setError(''); }}>
      Réviser la culture avant adoption
    </button> : null}
    <p className="hv-muted">Le motif est conservé dans l’explication de culture. Pour le calcul de cette hypothèse, l’ID de levure est repris uniquement pour une souche unique documentée; une culture mixte ou un nom libre ne sont pas réduits à une seule souche.</p>
    <form autoComplete="off" onSubmit={adopt}><div className="hv-fields">
      <label className="hv-field"><span>Nom de la référence</span><Input aria-label="Nom de la référence" value={label} onChange={e => setLabel(e.target.value)} /></label>
      <HopV55ExactInput label="Volume de la référence" unit="L" value={volumeL} min={0} required onValue={setVolumeL} />
      {versionSuggestion.status === 'explicitVersionRequired' ? <label className="hv-field hv-wide"><span>Nouvelle version explicite</span><Input aria-label="Nouvelle version explicite" value={versionInput}
        aria-invalid={invalidVersion || undefined} onChange={event => setExplicitVersion({ id: referenceId, historyKey, value: event.target.value })} /></label> : null}
      <label className="hv-field hv-wide"><span>Matière de la référence</span><select aria-label="Matière de la référence" value={materialId} onChange={e => setMaterialId(e.target.value)}><option value="">Choisir</option>{prepared.runtime.materials.map(row => <option key={row.id} value={row.id}>{row.name} · {row.form}</option>)}</select></label>
      <HopV55ExactInput label="Masse de référence" unit="g" min={0} value={grams} onValue={setGrams} />
      <label className="hv-field"><span>Emploi supposé</span><select aria-label="Emploi supposé" value={use} onChange={e => setUse(e.target.value as HopUse)}><option value="">À préciser</option>{hopV55Uses.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
      <HopV55ExactInput label="Température supposée" unit="°C" min={-273.15} value={temperature} onValue={setTemperature} />
      <HopV55ExactInput label="Contact supposé" unit="h" min={0} value={hours} onValue={setHours} />
      <button type="button" onClick={add}>Ajouter à la référence</button>
    </div><ul>{additions.map(row => <li key={row.id}>{prepared.runtime.materials.find(material => material.id === row.materialId)?.name} · {row.grams?.toLocaleString('fr-CH')} g · {hopV55Uses.find(use => use.value === row.use)?.label}<button type="button" onClick={() => setAdditions(rows => rows.filter(item => item.id !== row.id))}>Retirer de l’hypothèse</button></li>)}</ul>
      {!additions.length ? <label className="hv-checkbox"><input type="checkbox" checked={knownEmpty} onChange={e => setKnownEmpty(e.target.checked)} />Cette référence est déclarée sans ajout de houblon.</label> : null}
      {error ? <p role="alert" className="hv-error">{error}</p> : null}
      <button type="submit" className="hv-primary" disabled={invalidVersion || !cultureConfirmed}>{revisionBase || lastHypothesis ? 'Proposer et adopter cette nouvelle version' : 'Adopter cette hypothèse de référence'}</button>
    </form>
  </details>;
}
