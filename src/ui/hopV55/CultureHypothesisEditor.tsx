import React, { useEffect, useId, useRef, useState } from 'react';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import type { BrewingScenarioCultureContext, BrewingScenarioCultureMember } from '../../domain/brewingScenario';
import { formatDecimal, parseDecimal } from '../numericInput';
import { Input, Textarea } from '../Input';
import './culture-hypothesis-editor.css';

type CultureStateDraft = '' | BrewingScenarioCultureContext['state'];
type IdentityMode = '' | 'preserved' | 'documented' | 'freeName';
type ProportionMode = 'notProvided' | 'exact' | 'range';

interface MemberDraft {
  key: string;
  original?: BrewingScenarioCultureMember;
  identityMode: IdentityMode;
  yeastId: string;
  freeName: string;
  proportionMode: ProportionMode;
  exactPercent: string;
  minimumPercent: string;
  maximumPercent: string;
}

export interface HopV55CultureHypothesisEditorProps {
  /** Existing hypothesis to revise. Omission starts with no declared culture state. */
  initialCulture?: BrewingScenarioCultureContext;
  /** Catalog identities are the only IDs offered as documented choices. */
  documentedYeasts?: readonly Pick<HopYeast, 'id' | 'name' | 'source'>[];
  /** Exact visible label for the comparative reference that owns this hypothesis. */
  sourceLabel?: string;
  onConfirm(culture: BrewingScenarioCultureContext, reason: string): Promise<void>;
  readOnly?: boolean;
}

let nextDraftKey = 0;
const draftKey = () => `culture-member-draft-${++nextDraftKey}`;
const clone = <T,>(value: T): T => structuredClone(value);

function initialMemberDraft(member: BrewingScenarioCultureMember): MemberDraft {
  const proportion = member.proportion;
  const exact = proportion && proportion.min === proportion.max;
  return {
    key: draftKey(), original: clone(member), identityMode: 'preserved', yeastId: member.yeastId ?? '', freeName: member.name ?? '',
    proportionMode: !proportion ? 'notProvided' : exact ? 'exact' : 'range',
    exactPercent: exact ? formatDecimal(proportion.min * 100) : '',
    minimumPercent: proportion && !exact ? formatDecimal(proportion.min * 100) : '',
    maximumPercent: proportion && !exact ? formatDecimal(proportion.max * 100) : '',
  };
}

function blankMemberDraft(): MemberDraft {
  return { key: draftKey(), identityMode: '', yeastId: '', freeName: '', proportionMode: 'notProvided',
    exactPercent: '', minimumPercent: '', maximumPercent: '' };
}

function cultureState(value: BrewingScenarioCultureContext | undefined): CultureStateDraft {
  return value?.state ?? '';
}

function cultureMembers(value: BrewingScenarioCultureContext | undefined): MemberDraft[] {
  return value?.members.map(initialMemberDraft) ?? [];
}

function sourceLabel(source: HopYeast['source']): string {
  return [source.title, source.author, source.year ?? 'non datée', source.reference].filter(Boolean).join(' · ');
}

function sourceLabelOfMember(member: BrewingScenarioCultureMember): string | undefined {
  const source = member.source;
  return source ? [source.title, source.author, source.year ?? 'non datée', source.reference].filter(Boolean).join(' · ') : undefined;
}

function knownPercent(value: string, label: string): number {
  const parsed = parseDecimal(value);
  if (parsed === null || parsed < 0 || parsed > 100) throw new Error(`${label} doit être compris entre 0 et 100 %.`);
  return parsed;
}

function proportionForDraft(draft: MemberDraft): HopRange | undefined {
  if (draft.proportionMode === 'notProvided') return undefined;

  // Values are edited/displayed as percentages for brewers, then stored in the
  // domain's declared ratio [0,1]. This is a unit conversion only: no total,
  // missing share, equal split, midpoint, or normalization is ever calculated.
  if (draft.original?.proportion) {
    const original = draft.original.proportion;
    const originalExact = original.min === original.max;
    const sameMode = draft.proportionMode === (originalExact ? 'exact' : 'range');
    const sameText = originalExact
      ? draft.exactPercent === formatDecimal(original.min * 100)
      : draft.minimumPercent === formatDecimal(original.min * 100) && draft.maximumPercent === formatDecimal(original.max * 100);
    if (sameMode && sameText) return clone(original);
  }

  if (draft.proportionMode === 'exact') {
    const exact = knownPercent(draft.exactPercent, 'La proportion exacte') / 100;
    return { min: exact, max: exact };
  }
  const min = knownPercent(draft.minimumPercent, 'La borne basse') / 100;
  const max = knownPercent(draft.maximumPercent, 'La borne haute') / 100;
  if (min > max) throw new Error('La borne basse de la proportion ne peut pas dépasser la borne haute.');
  return { min, max };
}

function memberForDraft(draft: MemberDraft, documentedYeasts: HopV55CultureHypothesisEditorProps['documentedYeasts']): BrewingScenarioCultureMember {
  let member: BrewingScenarioCultureMember;
  if (draft.identityMode === 'preserved' && draft.original) {
    member = clone(draft.original);
  } else if (draft.identityMode === 'documented') {
    const yeast = documentedYeasts?.find(row => row.id === draft.yeastId);
    if (!yeast) throw new Error('Choisis une levure exacte dans le catalogue chargé.');
    member = { yeastId: yeast.id, name: yeast.name, source: clone(yeast.source) };
  } else if (draft.identityMode === 'freeName') {
    if (!draft.freeName.trim()) throw new Error('Saisis le nom exact du membre ou choisis une identité documentée.');
    member = { name: draft.freeName };
  } else {
    throw new Error('Choisis comment identifier chaque membre de culture.');
  }

  const proportion = proportionForDraft(draft);
  if (proportion === undefined) delete member.proportion;
  else member.proportion = proportion;
  return member;
}

function readyCulture(state: CultureStateDraft, members: MemberDraft[], documentedYeasts: HopV55CultureHypothesisEditorProps['documentedYeasts'],
  explanation: string): BrewingScenarioCultureContext {
  if (!state) throw new Error('Choisis explicitement unknown, une souche ou une culture mixte.');
  if (state === 'unknown' && members.length !== 0) throw new Error('Retire les membres conservés avant de confirmer une culture inconnue.');
  if (state === 'single' && members.length !== 1) throw new Error('Une souche unique doit contenir exactement un membre. Ajoute ou retire une ligne explicitement.');
  if (state === 'mixed' && members.length < 2) throw new Error('Une culture mixte doit contenir au moins deux membres explicites.');
  const resolvedMembers = state === 'unknown' ? [] : members.map(member => memberForDraft(member, documentedYeasts));
  const yeastIds = resolvedMembers.flatMap(member => member.yeastId ? [member.yeastId] : []);
  if (new Set(yeastIds).size !== yeastIds.length) throw new Error('Une même identité de catalogue ne peut apparaître deux fois.');
  return { state, members: resolvedMembers, ...(explanation.trim() ? { explanation: explanation.trim() } : {}) };
}

/** Structured editor for a comparative culture hypothesis. It only emits a typed draft. */
export function HopV55CultureHypothesisEditor({ initialCulture, documentedYeasts = [], sourceLabel: comparisonSourceLabel,
  onConfirm, readOnly = false }: HopV55CultureHypothesisEditorProps) {
  const titleId = useId();
  const stateLegendId = useId();
  const [state, setState] = useState<CultureStateDraft>(() => cultureState(initialCulture));
  const [members, setMembers] = useState<MemberDraft[]>(() => cultureMembers(initialCulture));
  const [explanation, setExplanation] = useState(() => initialCulture?.explanation ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const initialKey = JSON.stringify({ culture: initialCulture ?? null, source: comparisonSourceLabel ?? null });

  useEffect(() => {
    setState(cultureState(initialCulture));
    setMembers(cultureMembers(initialCulture));
    setExplanation(initialCulture?.explanation ?? '');
    setReason(''); setError(''); setNotice('');
  }, [initialKey]);

  useEffect(() => {
    if (!readOnly) setNotice('');
  }, [readOnly]);

  function clearFeedback() { setError(''); setNotice(''); }
  function updateMember(key: string, update: (row: MemberDraft) => MemberDraft) {
    setMembers(rows => rows.map(row => row.key === key ? update(row) : row));
    clearFeedback();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearFeedback();
    if (readOnly || busyRef.current) return;
    let culture: BrewingScenarioCultureContext;
    const why = reason.trim();
    try {
      if (!why) throw new Error('Précise le motif de cette proposition ou correction.');
      culture = readyCulture(state, members, documentedYeasts, explanation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La culture déclarée est incomplète.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await onConfirm(clone(culture), why);
      setNotice('Culture confirmée pour l’adoption explicite de la référence. Cet éditeur ne modifie ni recette, ni brassin, ni journal NR.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La proposition n’a pas été confirmée. Tu peux réessayer.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return <section className="hv-culture-hypothesis" aria-labelledby={titleId} aria-busy={busy}>
    <div className="hv-culture-heading">
      <div>
        <h3 id={titleId}>Culture hypothétique de comparaison</h3>
        <p>Décris les identités retenues pour cette hypothèse. Une sélection de levure ne démontre ni activité, ni proportion, ni résultat réel.</p>
      </div>
      {readOnly ? <span className="hv-culture-status">Lecture seule</span> : null}
    </div>
    {comparisonSourceLabel ? <p className="hv-culture-source"><strong>Référence comparative adoptée</strong><span>{comparisonSourceLabel}</span></p> : null}
    <p className="hv-culture-note">Les noms libres restent sans ID documenté. Les proportions sont facultatives; les plages sont conservées. Aucune somme, moyenne ou normalisation n’est calculée.</p>

    <form autoComplete="off" onSubmit={event => void submit(event)}>
      <fieldset className="hv-culture-state" disabled={readOnly || busy}>
        <legend id={stateLegendId}>Composition déclarée</legend>
        <div role="radiogroup" aria-labelledby={stateLegendId} className="hv-culture-state-options">
          {([
            ['unknown', 'Inconnue'], ['single', 'Une souche'], ['mixed', 'Mixte'],
          ] as const).map(([value, label]) => <label key={value} className={state === value ? 'is-selected' : ''}>
            <input type="radio" name={`culture-state-${titleId}`} value={value} checked={state === value}
              onChange={() => { setState(value); clearFeedback(); }} />
            <span>{label}</span>
          </label>)}
        </div>
        {!state ? <p className="hv-culture-help">Aucun état n’est présélectionné. Choisis explicitement unknown, une souche ou mixte.</p> : null}
      </fieldset>

      {state === 'unknown' ? <p className="hv-culture-help">Une culture inconnue ne porte aucun membre. Si des membres sont conservés ci-dessous, retire-les avant confirmation.</p> : null}
      {state === 'single' && members.length !== 1 ? <p className="hv-culture-help">Prépare exactement une ligne de membre. Les lignes existantes restent visibles jusqu’à leur retrait explicite.</p> : null}
      {state === 'mixed' && members.length < 2 ? <p className="hv-culture-help">Ajoute au moins deux membres explicitement. Le mélange ne sera jamais déduit de rôles successifs.</p> : null}

      {members.length ? <div className="hv-culture-members" aria-label="Membres de culture déclarés">
        {members.map((member, index) => {
          const currentDocumented = documentedYeasts.find(row => row.id === member.original?.yeastId);
          const originalIdentityLabel = member.original?.yeastId
            ? `ID conservé · non vérifié ici · ${member.original.name ?? member.original.yeastId} · ${member.original.yeastId}`
            : member.original?.name ? `Nom conservé · sans ID documenté · ${member.original.name}` : 'Identité conservée';
          const originalSource = member.original ? sourceLabelOfMember(member.original) : undefined;
          const proportionName = `Proportion du membre ${index + 1}`;
          return <fieldset key={member.key} className="hv-culture-member" disabled={readOnly || busy}>
            <legend>Membre {index + 1}</legend>
            <div className="hv-culture-member-grid">
              <label className="hv-culture-field hv-culture-wide"><span>Type d’identité</span>
                <select aria-label={`Type d’identité du membre ${index + 1}`} value={member.identityMode}
                  onChange={event => {
                    const mode = event.target.value as IdentityMode;
                    updateMember(member.key, row => ({ ...row, identityMode: mode,
                      yeastId: mode === 'documented' && documentedYeasts.some(yeast => yeast.id === row.original?.yeastId) ? row.original!.yeastId! : '',
                      freeName: mode === 'freeName' ? row.original?.name ?? row.freeName : row.freeName }));
                  }}>
                  <option value="">Choisir comment identifier ce membre</option>
                  {member.original ? <option value="preserved">Conserver l’identité initiale exacte</option> : null}
                  {documentedYeasts.length ? <option value="documented">Levure du catalogue chargé · ID documenté</option> : null}
                  <option value="freeName">Nom exact libre · sans ID documenté</option>
                </select>
              </label>

              {member.identityMode === 'preserved' && member.original ? <div className="hv-culture-identity hv-culture-wide">
                <strong>{originalIdentityLabel}</strong>
                {originalSource ? <small>Source déjà conservée · {originalSource}</small> : null}
                {currentDocumented ? <small>Correspond aussi à une identité exacte actuellement chargée; l’éditeur garde toutefois le snapshot initial tant que tu ne choisis pas le catalogue.</small> : null}
              </div> : null}

              {member.identityMode === 'documented' ? <label className="hv-culture-field hv-culture-wide"><span>Levure documentée</span>
                <select aria-label={`Levure documentée du membre ${index + 1}`} value={member.yeastId}
                  onChange={event => updateMember(member.key, row => ({ ...row, yeastId: event.target.value }))}>
                  <option value="">Choisir une identité chargée</option>
                  {documentedYeasts.map(yeast => <option key={yeast.id} value={yeast.id}>{yeast.name} · {yeast.id}</option>)}
                </select>
                {documentedYeasts.find(yeast => yeast.id === member.yeastId) ? <small>Source chargée · {sourceLabel(documentedYeasts.find(yeast => yeast.id === member.yeastId)!.source)}</small> : null}
              </label> : null}

              {member.identityMode === 'freeName' ? <label className="hv-culture-field hv-culture-wide"><span>Nom exact communiqué</span>
                <Input aria-label={`Nom libre du membre ${index + 1}`} value={member.freeName} autoComplete="off"
                  onChange={event => updateMember(member.key, row => ({ ...row, freeName: event.target.value }))} />
                <small>Ce nom est conservé tel quel; il ne devient pas une identité du catalogue.</small>
              </label> : null}

              <label className="hv-culture-field hv-culture-wide"><span>Proportion déclarée</span>
                <select aria-label={`Nature de la proportion du membre ${index + 1}`} value={member.proportionMode}
                  onChange={event => updateMember(member.key, row => ({ ...row, proportionMode: event.target.value as ProportionMode,
                    exactPercent: event.target.value === 'exact' ? '' : row.exactPercent,
                    minimumPercent: event.target.value === 'range' ? '' : row.minimumPercent,
                    maximumPercent: event.target.value === 'range' ? '' : row.maximumPercent }))}>
                  <option value="notProvided">Non fournie</option><option value="exact">Valeur exacte déclarée</option><option value="range">Plage déclarée</option>
                </select>
              </label>
              {member.proportionMode === 'exact' ? <label className="hv-culture-field"><span>{proportionName} · %</span>
                <Input aria-label={`${proportionName} exacte en pourcentage`} inputMode="decimal" value={member.exactPercent}
                  aria-invalid={member.exactPercent !== '' && (parseDecimal(member.exactPercent) === null || parseDecimal(member.exactPercent)! < 0 || parseDecimal(member.exactPercent)! > 100)}
                  onChange={event => updateMember(member.key, row => ({ ...row, exactPercent: event.target.value }))} />
              </label> : null}
              {member.proportionMode === 'range' ? <>
                <label className="hv-culture-field"><span>{proportionName} · borne basse %</span>
                  <Input aria-label={`${proportionName} borne basse en pourcentage`} inputMode="decimal" value={member.minimumPercent}
                    aria-invalid={member.minimumPercent !== '' && (parseDecimal(member.minimumPercent) === null || parseDecimal(member.minimumPercent)! < 0 || parseDecimal(member.minimumPercent)! > 100)}
                    onChange={event => updateMember(member.key, row => ({ ...row, minimumPercent: event.target.value }))} />
                </label>
                <label className="hv-culture-field"><span>{proportionName} · borne haute %</span>
                  <Input aria-label={`${proportionName} borne haute en pourcentage`} inputMode="decimal" value={member.maximumPercent}
                    aria-invalid={member.maximumPercent !== '' && (parseDecimal(member.maximumPercent) === null || parseDecimal(member.maximumPercent)! < 0 || parseDecimal(member.maximumPercent)! > 100)}
                    onChange={event => updateMember(member.key, row => ({ ...row, maximumPercent: event.target.value }))} />
                </label>
              </> : null}
              <div className="hv-culture-member-actions hv-culture-wide">
                <span>{member.proportionMode === 'notProvided' ? 'Aucune proportion retenue pour ce membre.'
                  : 'Saisie en %; le contrat conserve le ratio exact dans [0,1]. Aucun total n’est calculé.'}</span>
                <button type="button" onClick={() => { setMembers(rows => rows.filter(row => row.key !== member.key)); clearFeedback(); }}>
                  Retirer le membre {index + 1}
                </button>
              </div>
            </div>
          </fieldset>;
        })}
      </div> : null}

      {state && state !== 'unknown' ? <button type="button" className="hv-culture-add" disabled={readOnly || busy}
        onClick={() => { setMembers(rows => [...rows, blankMemberDraft()]); clearFeedback(); }}>
        Ajouter un membre de culture
      </button> : null}

      <label className="hv-culture-field hv-culture-wide"><span>Contexte ou limites de cette hypothèse · facultatif</span>
        <Textarea aria-label="Contexte ou limites de la culture hypothétique" rows={2} value={explanation} disabled={readOnly || busy}
          onChange={event => { setExplanation(event.target.value); clearFeedback(); }} />
      </label>
      <label className="hv-culture-field hv-culture-wide"><span>Motif de cette proposition ou correction</span>
        <Textarea aria-label="Motif de la proposition ou correction" rows={2} value={reason} disabled={readOnly || busy}
          onChange={event => { setReason(event.target.value); clearFeedback(); }} required />
      </label>
      {error ? <p className="hv-culture-error" role="alert">{error}</p> : null}
      {notice ? <p className="hv-culture-notice" role="status">{notice}</p> : null}
      <div className="hv-culture-actions">
        <button className="hv-primary" type="submit" disabled={readOnly || busy}>
          {busy ? 'Transmission…' : initialCulture ? 'Confirmer la révision de l’hypothèse' : 'Confirmer cette hypothèse'}
        </button>
      </div>
    </form>
  </section>;
}

export default HopV55CultureHypothesisEditor;
