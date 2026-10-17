import { useEffect, useState } from 'react';
import type { HopV55QualifiedColdContactEvidenceResultV1 } from '../../services/hopV55/qualifiedColdContactEvidence';
import type {
  HopV55RecipeColdContactEvidenceReadyV1,
  HopV55RecipeColdContactHostV1,
  HopV55RecipeColdContactPrepareResultV1,
  HopV55RecipeColdContactSourceReadV1,
  HopV55RecipeColdContactSourceV1,
} from '../../services/hopV55/recipeColdContactHost';
import type { HopUse } from '../../domain/hopDecision/types';
import { Textarea } from '../Input';
import { HOP_V55_FORM_LABELS } from './contextualExplorationModel';

export interface HopV55RecipeColdContactSelectionProps<TScope = unknown> {
  host: HopV55RecipeColdContactHostV1<TScope>;
  /** Called only with an integrity-checked ready evidence; refusals stay visible in this panel. */
  onPrepared(result: HopV55RecipeColdContactEvidenceReadyV1): void | Promise<void>;
  disabled?: boolean;
}

const useLabels: Record<HopUse, string> = {
  firstWort: 'première trempe', boil: 'ébullition', whirlpool: 'whirlpool',
  fermentation: 'fermentation', postFermentation: 'après fermentation',
};
/** Only fermentation-side lines are a cold contact; a hot line is listed with that reason, never offered. */
const coldUses: ReadonlySet<HopUse> = new Set<HopUse>(['fermentation', 'postFermentation']);
/** A value and its unit never wrap apart (« 12 °C » stays on one line at 390 px). */
const formatNumber = (value: number | null | undefined, suffix: string, unknown = 'inconnu') => value == null || !Number.isFinite(value)
  ? unknown : `${value.toLocaleString('fr-CH', { maximumFractionDigits: 3 })} ${suffix}`;
const materialName = (source: HopV55RecipeColdContactSourceV1, materialId: string) =>
  source.materials.find(row => row.id === materialId)?.name ?? 'Matière inconnue';

function additionDescription(source: HopV55RecipeColdContactSourceV1, additionId: string): string {
  const addition = source.program.additions.find(row => row.id === additionId);
  if (!addition) return 'Ligne absente du programme relu.';
  const material = source.materials.find(row => row.id === addition.materialId);
  return `${material ? HOP_V55_FORM_LABELS[material.form] ?? 'Forme inconnue' : 'Forme inconnue'} · ${useLabels[addition.use]} · ${addition.status === 'performed' ? 'effectué selon le programme' : 'prévu'} · masse ${formatNumber(addition.grams, 'g', 'inconnue')} · durée ${formatNumber(addition.contactHours, 'h', 'inconnue')} · température ${formatNumber(addition.temperatureC, '°C', 'inconnue')}`;
}

const mismatchLabels: Record<string, string> = {
  programReference: 'programme de houblonnage', programContent: 'contenu du programme',
  qualificationReference: 'qualification des matières', qualificationContent: 'contenu de la qualification',
  contextReference: 'contexte de bière au contact', contextContent: 'contenu du contexte froid',
  scope: 'cadre de la source', scopeReference: 'référence du cadre', ownerKey: 'propriétaire',
};

function contextSummary(source: HopV55RecipeColdContactSourceV1): string {
  const context = source.coldContext;
  if (context === null) return 'Contexte de bière au contact non attesté. Le volume du programme ne remplit pas ce manque.';
  const parts = [
    context.volumeBasis === 'beerAtContact' ? 'volume fondé sur la bière au contact' : 'base de volume non qualifiée',
    `alcool ${formatNumber(context.abvPct, '% vol.')}`,
    `filtration avant contact ${context.filteredBeforeContact == null ? 'inconnue' : context.filteredBeforeContact ? 'oui' : 'non'}`,
    `levure ${context.yeastStatus ?? 'inconnue'}`,
    `mode ${context.contactMode ?? 'inconnu'}`,
  ];
  if (context.materialPreparation) parts.push(`préparation ${context.materialPreparation}`);
  if (context.beerDescription) parts.push(`bière ${context.beerDescription}`);
  return parts.join(' · ');
}

function resultText(result: HopV55QualifiedColdContactEvidenceResultV1): { heading: string; details: string; alert?: boolean; mismatches?: string[] } {
  if (result.status === 'ready') return {
    heading: 'Référence préparée; BU cible non calculée',
    details: `Charge scellée : ${result.payload.utf8Bytes.toLocaleString('fr-CH')} octets · profondeur ${result.payload.maxDepth}. Cette préparation n’applique pas le programme.`,
  };
  if (result.status === 'tooLarge') return {
    heading: 'Référence trop volumineuse',
    details: `${result.payload.utf8Bytes.toLocaleString('fr-CH')} octets / profondeur ${result.payload.maxDepth}; limites ${result.maxBytes.toLocaleString('fr-CH')} octets et ${result.maxDepth}. Aucune partie du catalogue n’a été coupée pour produire une référence.`,
    alert: true,
  };
  if ('reason' in result) return { heading: 'Préparation refusée', details: result.reason, alert: true };
  if (result.status === 'unknownReference') return { heading: 'Référence non reconnue',
    details: `La référence ${result.reference} ne fait pas partie des sources actuelles.`, alert: true };
  const changed = [...new Set(result.mismatches.map(key => mismatchLabels[key] ?? 'autre élément de la source'))];
  return { heading: 'Source périmée', details: `Les éléments suivants ont changé : ${changed.join(', ')}. Relis la source avant de recommencer.`,
    alert: true, mismatches: result.mismatches };
}

/** Read-only source picker for the cold-contact host. It selects programme lines, never a dose. */
export function HopV55RecipeColdContactSelection<TScope = unknown>({ host, onPrepared, disabled = false }: HopV55RecipeColdContactSelectionProps<TScope>) {
  const [sourcesRead, setSourcesRead] = useState<HopV55RecipeColdContactSourceReadV1 | null>(null);
  const [sourceKey, setSourceKey] = useState('');
  const [additionIds, setAdditionIds] = useState<string[]>([]);
  const [groupingReason, setGroupingReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState<HopV55RecipeColdContactPrepareResultV1 | null>(null);
  const [error, setError] = useState('');

  const refresh = async () => {
    setSourcesRead(null);
    setError('');
    setPrepared(null);
    try {
      const result = await host.readSources();
      setSourcesRead(result);
      if (result.status === 'ready' && !result.sources.some(source => source.key === sourceKey)) {
        setSourceKey(''); setAdditionIds([]); setGroupingReason('');
      }
    } catch (cause) {
      setSourcesRead({ status: 'unavailable', reason: cause instanceof Error ? cause.message : 'Les sources locales ne peuvent pas être relues.' });
    }
  };

  useEffect(() => {
    let active = true;
    void host.readSources().then(result => { if (active) setSourcesRead(result); })
      .catch(cause => { if (active) setSourcesRead({ status: 'unavailable', reason: cause instanceof Error ? cause.message : 'Les sources locales ne peuvent pas être relues.' }); });
    return () => { active = false; };
  }, [host]);

  const source = sourcesRead?.status === 'ready' ? sourcesRead.sources.find(row => row.key === sourceKey) : undefined;
  const toggleAddition = (id: string) => {
    setPrepared(null); setError('');
    setAdditionIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  };

  const prepare = async () => {
    if (disabled || busy || sourcesRead?.status !== 'ready' || !source) return;
    setBusy(true); setPrepared(null); setError('');
    try {
      const result = await host.prepare({ sourceKey: source.key, sourceReference: source.reference,
        generation: sourcesRead.generation, additionIds: [...additionIds], groupingReason });
      setPrepared(result);
      if (result.status === 'prepared' && result.result.status === 'ready') {
        await onPrepared({ status: 'prepared', source: result.source, result: result.result });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La préparation du contact froid n’a pas abouti.');
    } finally { setBusy(false); }
  };

  const output = prepared?.status === 'prepared' ? resultText(prepared.result) : null;

  return <section className="hv-copy hv-cold-contact-selection" aria-label="Sélection du contact à froid">
    <div className="hv-section-title">
      <h3>Contact à froid · source et lignes</h3>
      <button type="button" className="hv-secondary" disabled={disabled || busy} onClick={() => void refresh()}>Actualiser</button>
    </div>
    <p className="hv-muted">Choisis un programme et ses lignes exactes. Le regroupement reste une hypothèse de scénario; cette étape ne modifie ni recette, ni brassin, ni stock.</p>

    {sourcesRead === null ? <p role="status">Relecture du programme courant et de la branche choisie dans la comparaison…</p> : null}
    {sourcesRead?.status === 'unavailable' ? <p role="alert" className="hv-error">{sourcesRead.reason}</p> : null}
    {sourcesRead?.status === 'ready' ? <>
      {sourcesRead.notices.map((notice, index) => <p key={`${index}:${notice}`} className="hv-muted">{notice}</p>)}
      <label className="block text-xs font-medium" htmlFor="hv-cold-contact-source">Programme à examiner</label>
      <select id="hv-cold-contact-source" className="w-full rounded-control border border-cave-600 bg-cave-900 px-2 py-1.5 text-sm"
        value={sourceKey} disabled={disabled || busy} onChange={event => {
          setSourceKey(event.target.value); setAdditionIds([]); setGroupingReason(''); setPrepared(null); setError('');
        }}>
        <option value="">Choisir explicitement une source</option>
        {sourcesRead.sources.map(row => <option value={row.key} key={row.key}>{row.label}</option>)}
      </select>
      {sourcesRead.sources.length === 0 ? <p className="hv-muted">Aucun programme ni branche de comparaison vérifiable n’est proposé dans ce contexte.</p> : null}
    </> : null}

    {source ? <>
      <div className="rounded-control border border-cave-700 p-2">
        <p><strong>{source.label}</strong></p>
        <p className="hv-muted">{contextSummary(source)}</p>
        <p className="hv-muted">{source.program.volumeL == null ? 'Volume du programme inconnu.'
          : `Volume du programme · ${formatNumber(source.program.volumeL, 'L')} — il ne prouve pas le volume de bière au contact.`}</p>
        <details className="hv-details">
          <summary>Source et références exactes</summary>
          <p>Programme · {source.programReference}</p>
          <p>Cadre · {source.scopeReference}</p>
          <p>Contexte froid · {source.contextReference}</p>
          <p>Source · {source.reference}</p>
          {source.scenario ? <>
            <p>Scénario · {source.scenario.scenarioId} · workspace {source.scenario.workspaceId}</p>
            <p>Snapshot · {source.scenario.snapshotReference}</p>
            <p>Branche · {source.scenario.branchId} · {source.scenario.branchReference}</p>
          </> : null}
          {source.program.additions.map(addition => <p key={addition.id}>Ligne · {addition.id} · matière {addition.materialId}</p>)}
        </details>
      </div>
      <fieldset disabled={disabled || busy} className="space-y-2">
        <legend className="text-xs font-semibold">Lignes de houblon à regrouper</legend>
        {source.program.additions.map(addition => coldUses.has(addition.use)
          ? <label key={addition.id} className="flex items-start gap-2 rounded-control border border-cave-700 p-2 text-xs">
            <input type="checkbox" checked={additionIds.includes(addition.id)} onChange={() => toggleAddition(addition.id)} aria-label={`Sélectionner ${addition.materialId}`} />
            <span className="min-w-0"><strong>{materialName(source, addition.materialId)}</strong><br />
              <span className="hv-muted">{additionDescription(source, addition.id)}</span>
            </span>
          </label>
          : <p key={addition.id} className="px-2 text-xs hv-muted">{materialName(source, addition.materialId)} · {useLabels[addition.use]} : pas un contact à froid</p>)}
        {source.program.additions.length === 0 ? <p className="hv-muted">Ce programme ne contient aucune ligne à sélectionner.</p>
          : !source.program.additions.some(addition => coldUses.has(addition.use))
            ? <p className="hv-muted">Aucune ligne de fermentation ou d’après fermentation : rien à regrouper comme contact à froid.</p> : null}
      </fieldset>
      <label className="block text-xs font-medium" htmlFor="hv-cold-contact-grouping">Pourquoi ces lignes représentent-elles un même contact ?</label>
      <Textarea id="hv-cold-contact-grouping" className="w-full rounded-control border border-cave-600 bg-cave-900 px-2 py-1.5 text-sm"
        rows={2} value={groupingReason} disabled={disabled || busy}
        onChange={event => { setGroupingReason(event.target.value); setPrepared(null); }}
        placeholder="Explique le regroupement pour cette hypothèse de scénario." />
      <button type="button" className="hv-primary" disabled={disabled || busy || additionIds.length === 0 || !groupingReason.trim()}
        onClick={() => void prepare()}>{busy ? 'Vérification des sources…' : 'Préparer la référence de contact'}</button>
    </> : null}

    {prepared?.status === 'refused' ? <p role="alert" className="hv-error">{prepared.reason}</p> : null}
    {output ? <div role={output.alert ? 'alert' : 'status'} className={output.alert ? 'hv-error' : 'hv-muted'}>
      <strong>{output.heading}</strong><p data-mismatches={output.mismatches?.join(' ')}>{output.details}</p>
    </div> : null}
    {error ? <p role="alert" className="hv-error">{error}</p> : null}
  </section>;
}
