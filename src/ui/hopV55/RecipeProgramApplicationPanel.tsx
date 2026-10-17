import React, { useMemo, useRef, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { BrewingScenarioResult } from '../../domain/brewingScenario';
import type { HopDecisionMaterial, HopNumericResult } from '../../domain/hopDecision/types';
import type { HopRecipeAlphaChoice } from '../../domain/hopDecision/recipePreview';
import type { HopIngredient, Recipe } from '../../types';
import type { HopV55BranchPreviewResult } from '../../services/hopV55/application';
import { applyHopV55RecipeDraftApplication, previewHopV55RecipeDraftApplication,
  hopV55RecipeApplicationValueReference,
  type HopV55RecipeApplicationRecordV1, type HopV55RecipeDraftTarget } from '../../services/hopV55/recipeDraftApplication';
import { HopV55ExactInput } from './ExactInput';
import { Input } from '../Input';
import { hopV55TraceLine } from './traceLabels';
import './recipe-step.css';

export interface HopV55RecipeProgramApplicationPanelProps {
  target: HopV55RecipeDraftTarget;
  /** Owner of the V5.5 services that produced this result; must equal the draft owner. */
  servicesOwnerKey: string;
  workspaceId: string | null;
  result: BrewingScenarioResult;
  branchId: string;
  materials: readonly HopDecisionMaterial[];
  /** Re-reads the live draft context; never a cached copy. */
  getContext(): Promise<BrewerContext>;
  onApplied(record: HopV55RecipeApplicationRecordV1): void | Promise<void>;
  disabled?: boolean;
}

type AlphaDraft = { value?: number; reason: string };
const uid = () => globalThis.crypto.randomUUID();
/** Resolves after the pending render had a frame to paint (frame, then task); a hidden tab, without frames, goes on after 100 ms. */
const afterPaint = () => new Promise<void>(resolve => {
  if (typeof requestAnimationFrame !== 'function') { setTimeout(resolve, 0); return; }
  const fallback = setTimeout(resolve, 100);
  requestAnimationFrame(() => setTimeout(() => { clearTimeout(fallback); resolve(); }, 0));
});
const number = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? 'inconnu' : value.toLocaleString('fr-CH', { maximumFractionDigits: 3 });
const useLabels: Record<string, string> = {
  firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool', dryHop: 'À cru', mash: 'Empâtage',
  fermentation: 'Fermentation active', postFermentation: 'Après fermentation',
};

function numericText(value: HopNumericResult | undefined): string {
  if (!value || value.status === 'unknown') return 'inconnu';
  if (value.status === 'conflict') return 'références en conflit';
  if (value.status === 'range' && value.range) return `${number(value.range.min)}–${number(value.range.max)} ${value.unit}`;
  return `${number(value.value)} ${value.unit}`;
}

function hopLine(hop: HopIngredient): string {
  const moment = hop.stage === 'dryHop'
    ? [useLabels[hop.aromaTiming ?? ''] ?? 'phase à cru à préciser', hop.dayOffset != null ? `jour ${number(hop.dayOffset)}` : '',
      hop.aromaContactHours != null ? `${number(hop.aromaContactHours)} h de contact` : '',
      hop.aromaTemperatureC != null ? `${number(hop.aromaTemperatureC)} °C` : ''].filter(Boolean).join(' · ')
    : [useLabels[hop.stage] ?? hop.stage, hop.timeMin != null ? `${number(hop.timeMin)} min` : 'durée inconnue',
      hop.stage === 'whirlpool' ? hop.tempC != null ? `${number(hop.tempC)} °C` : 'température inconnue' : ''].filter(Boolean).join(' · ');
  return `${hop.name} · ${number(hop.weightG)} g · α ${hop.alpha ? `${number(hop.alpha)} %` : 'inconnu'} · ${moment}`;
}

/**
 * Explicit application of a selected V5.5 branch to the open recipe draft.
 * Preview and application are both recomputed on the live draft with the
 * canonical validators; the wizard keeps its own save.
 */
export function HopV55RecipeProgramApplicationPanel({ target, servicesOwnerKey, workspaceId, result, branchId, materials,
  getContext, onApplied, disabled = false }: HopV55RecipeProgramApplicationPanelProps) {
  const [outcome, setOutcome] = useState<HopV55BranchPreviewResult>();
  const [before, setBefore] = useState<HopIngredient[]>();
  const [alphaDrafts, setAlphaDrafts] = useState<Record<string, AlphaDraft>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // #81: after the commit, the workshop rereads the draft; say so instead of « verifying » next to a reset preview.
  const [refreshing, setRefreshing] = useState(false);
  const running = useRef(false);
  const command = useRef<{ previewReference: string; id: string; appliedAt: string } | undefined>(undefined);
  const staged = useRef<Extract<ReturnType<typeof applyHopV55RecipeDraftApplication>, { status: 'ready' }> | undefined>(undefined);
  const branch = result.branches.find(row => row.id === branchId);
  const materialName = (id: string) => materials.find(row => row.id === id)?.name ?? id;

  const completeChoices = (): Record<string, HopRecipeAlphaChoice> => Object.fromEntries(Object.entries(alphaDrafts)
    .flatMap(([id, row]) => row.value !== undefined && Number.isFinite(row.value) && row.reason.trim()
      ? [[id, { value: row.value, reason: row.reason.trim() }]] : []));

  async function guard(action: () => Promise<void>) {
    // #81: a ref, not the rendered `busy`: two activations in one task (double click, key repeat) start one operation.
    if (running.current || busy || disabled) return;
    running.current = true;
    setBusy(true); setError(''); setRefreshing(false);
    try {
      // Let the busy state paint before the canonical CPU work; the action then reads its fresh
      // context and the target rechecks it before mutation.
      await afterPaint();
      await action();
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'L’opération n’a pas abouti; le brouillon reste inchangé.'); }
    finally { running.current = false; setBusy(false); setRefreshing(false); }
  }

  const preview = () => guard(async () => {
    const context = await getContext();
    const checked = previewHopV55RecipeDraftApplication({ identity: target, servicesOwnerKey, result, branchId, context,
      alphaChoices: completeChoices() });
    staged.current = undefined;
    command.current = checked.status === 'ready' ? { previewReference: checked.preview.reference, id: uid(), appliedAt: new Date().toISOString() } : undefined;
    setBefore(structuredClone((context.recipe as Recipe | undefined)?.hops ?? []));
    setOutcome(checked);
    if (checked.status === 'blocked') setError(checked.reason);
  });

  const apply = () => guard(async () => {
    if (outcome?.status !== 'ready') throw new Error('Prépare d’abord un aperçu final de l’application au brouillon.');
    const context = await getContext();
    if (!command.current || command.current.previewReference !== outcome.preview.reference)
      command.current = { previewReference: outcome.preview.reference, id: uid(), appliedAt: new Date().toISOString() };
    const act = command.current;
    const checked = staged.current ?? applyHopV55RecipeDraftApplication({ identity: target, servicesOwnerKey, preview: outcome.preview, context,
      workspaceId, appliedAt: act.appliedAt, newId: () => act.id });
    if (checked.status === 'blocked') {
      if (checked.recompute) setOutcome(undefined);
      throw new Error(checked.reason);
    }
    staged.current = checked;
    await target.apply(checked.application);
    setRefreshing(true);
    staged.current = undefined; command.current = undefined;
    setOutcome(undefined); setBefore(undefined);
    // The page confirms the application once, next to its origin; this panel adds no second notice.
    // The wizard has durably committed. Let its controlled draft render before
    // Page rereads that draft, so the visible programme reflects the actual commit.
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    await onApplied(checked.application.record);
  });

  const pendingAlphaAdditions = outcome?.status === 'needsAlphaSelection'
    ? (branch?.programProposal?.program.additions ?? []).filter(addition => addition.status === 'planned'
      && outcome.materialIds.includes(addition.materialId)) : [];
  const ready = outcome?.status === 'ready' ? outcome.preview : undefined;
  const after = ready?.recipePreview.draft.recipe.hops;
  // #81: the preview reference is a long canonical text; its short fingerprint is computed once per preview, not per render.
  const previewReference = useMemo(() => ready ? hopV55RecipeApplicationValueReference('preview', ready.reference) : '', [ready]);
  // Trace lines name materials and moments; exact identifiers stay in the sealed record and the small reference line.
  const traceNames = new Map<string, string>([
    ...materials.map(row => [row.id, row.name] as const),
    ...(before ?? []).map((hop, index) => [`recipe-hop:${index}`, `${hop.name} · ${useLabels[hop.stage] ?? hop.stage}`] as const),
    ...(branch?.programProposal?.program.additions ?? []).map(addition =>
      [addition.id, `${materialName(addition.materialId)} · ${useLabels[addition.use] ?? addition.use}`] as const),
  ]);
  const trace = (line: string) => hopV55TraceLine(line, traceNames);

  if (branchId === result.baseline.id) return <section className="hv-copy hv-draft-application" aria-label="Appliquer ce programme au brouillon de recette">
    <h3>Appliquer ce programme au brouillon</h3>
    <p role="status">Cette branche est le programme actuel du brouillon : rien à appliquer. Choisis une branche réglée dans la comparaison.</p>
  </section>;

  return <section className="hv-copy hv-draft-application" aria-label="Appliquer ce programme au brouillon de recette">
    <h3>Appliquer ce programme au brouillon</h3>
    <p>Seules les lignes de houblon du brouillon ouvert changent. Volumes, fermentescibles, levure, eau, fermentation et style restent tels quels; aucun stock ni brassin n’est écrit.</p>
    <div className="hv-actions">
      <button type="button" className={ready ? undefined : 'hv-primary'} disabled={busy || disabled} onClick={() => void preview()}>
        {outcome ? 'Recalculer l’aperçu sur le brouillon actuel' : 'Prévisualiser l’application au brouillon'}
      </button>
    </div>
    {/* Once a preview exists, progress and errors sit next to « Appliquer », the command they concern. */}
    {busy && !(ready && after) ? <p role="status">{refreshing ? 'Mise à jour de l’atelier avec le brouillon appliqué…' : 'Vérification sur le brouillon actuel…'}</p> : null}
    {error && !(ready && after) ? <p role="alert" className="hv-error">{error}</p> : null}
    {outcome?.status === 'blocked' && target.onCorrectContext ? <div className="hv-actions" aria-label="Corriger le contexte avant une nouvelle prévision">
      <button type="button" onClick={() => target.onCorrectContext?.('identite')}>Vérifier le volume et l’identité</button>
      <button type="button" onClick={() => target.onCorrectContext?.('levure')}>Choisir ou corriger la culture</button>
      <button type="button" onClick={() => target.onCorrectContext?.('paliers')}>Vérifier les conditions de fermentation</button>
    </div> : null}

    {outcome?.status === 'needsAlphaSelection' ? <div className="hv-draft-alpha">
      <p><strong>Alpha à choisir avant application.</strong> {outcome.reasons.filter(reason => !/alpha scalaire/u.test(reason)).map(trace).join(' ')}</p>
      <p className="hv-muted">Le champ alpha de la recette exige un nombre. Une plage ou une inconnue ne devient ni zéro ni valeur par défaut; indique un nominal de travail et pourquoi.</p>
      {pendingAlphaAdditions.length ? pendingAlphaAdditions.map(addition => {
        const row = alphaDrafts[addition.id] ?? { reason: '' };
        const name = materialName(addition.materialId);
        return <fieldset key={addition.id} className="hv-draft-alpha-row">
          <legend>{name} · {useLabels[addition.use] ?? addition.use} · {number(addition.grams)} g</legend>
          <HopV55ExactInput label={`Alpha de travail pour ${name}`} unit="%" min={0} max={100} value={row.value}
            onValue={value => setAlphaDrafts(previous => ({ ...previous, [addition.id]: { ...row, value } }))} />
          <label className="hv-field"><span>Motif du choix alpha pour {name}</span>
            <Input aria-label={`Motif du choix alpha pour ${name}`} value={row.reason}
              onChange={event => setAlphaDrafts(previous => ({ ...previous, [addition.id]: { ...row, reason: event.target.value } }))} />
          </label>
          <small>Ce nominal reste une hypothèse de travail, pas une analyse du lot.</small>
        </fieldset>;
      }) : <p role="status">Les ajouts concernés ne sont plus dans ce résultat; recalcule la prévision.</p>}
      <button type="button" disabled={busy || disabled} onClick={() => void preview()}>Recalculer l’aperçu avec ces choix</button>
    </div> : null}

    {ready && after ? <div className="hv-draft-preview">
      <h4>Lignes de houblon après application</h4>
      <ul>{after.map((hop, index) => <li key={`${hop.name}-${index}`}>{hopLine(hop)}</li>)}</ul>
      <details className="hv-details"><summary>Lignes actuelles du brouillon · {before?.length ?? 0}</summary>
        {before?.length ? <ul>{before.map((hop, index) => <li key={`${hop.name}-${index}`}>{hopLine(hop)}</li>)}</ul> : <p>Aucune ligne de houblon dans le brouillon.</p>}
      </details>
      <p>IBU chauds estimés après application · {numericText(ready.recipePreview.analysis.hotIbu)} <small>Estimation du modèle, pas une mesure de la bière.</small></p>
      {Object.keys(ready.recipePreview.alphaChoices).length ? <p>Alpha choisi · {Object.entries(ready.recipePreview.alphaChoices)
        .map(([id, choice]) => `${traceNames.get(id) ?? trace(id)} : ${number(choice.value)} % (${choice.reason})`).join(' · ')}</p> : null}
      <details className="hv-details"><summary>Hypothèses, conditions et disponibilité</summary>
        <ul>
          {ready.recipePreview.draft.dossier.assumptions.map((line, index) => <li key={`assumption-${index}`}>{trace(line)}</li>)}
          {(ready.recipePreview.conditions ?? []).map((line, index) => <li key={`condition-${index}`}>{trace(line)}</li>)}
          {ready.recipePreview.programApplication.proposal.conditions.map((line, index) => <li key={`proposal-${index}`}>{trace(line)}</li>)}
          {ready.recipePreview.programApplication.proposal.stock.map((row, index) => <li key={`stock-${index}`}>
            {materialName(row.materialId)} · besoin {row.neededGrams == null ? 'inconnu' : `${number(row.neededGrams)} g`} · {row.availableGrams == null ? 'disponibilité inconnue' : `${number(row.availableGrams)} g déclarés`} · {row.status === 'available' ? 'suffisant' : row.status === 'insufficient' ? 'insuffisant' : row.status === 'referenceOnly' ? 'référence seule' : 'à vérifier'} · aucune réservation
          </li>)}
          {ready.recipePreview.analysis.limits.map((line, index) => <li key={`limit-${index}`}>{trace(line)}</li>)}
        </ul>
        <small>Scénario {ready.scenarioId} · branche {ready.branchId} · aperçu {previewReference}</small>
      </details>
      {busy ? <p role="status">Vérification sur le brouillon actuel…</p> : null}
      {error ? <p role="alert" className="hv-error">{error}</p> : null}
      <div className="hv-actions">
        <button type="button" className="hv-primary" disabled={busy || disabled} onClick={() => void apply()}>Appliquer au brouillon de recette</button>
      </div>
    </div> : null}
  </section>;
}
