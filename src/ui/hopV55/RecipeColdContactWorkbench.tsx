import { useEffect, useMemo, useRef, useState } from 'react';
import type { Recipe } from '../../types';
import type { HopV55Services } from '../../services/hopV55/contracts';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { canonicalizeHopV55RecipeDraft } from '../../services/hopV55/recipeStepContext';
import {
  createHopV55RecipeColdContactHost,
  type HopV55RecipeColdContactPrepareResultV1,
} from '../../services/hopV55/recipeColdContactHost';
import {
  compareHopV55RecipeColdContactAssociationSourceV1,
  createHopV55RecipeColdContactAssociationV1,
  describeHopV55RecipeColdContactMismatchesV1,
  hopV55RecipeColdSourceReference,
  hopV55RecipeColdSourceReferenceFor,
  readHopV55RecipeColdContactAssociationV1,
  type HopV55RecipeColdContactAssociationV1,
} from '../../services/hopV55/recipeColdContactAssociation';
import { readHopV55RecipeApplication } from '../../services/hopV55/recipeDraftApplication';
import type { HopV55RecipeColdContactChange } from './RecipeStep';
import { HopV55RecipeColdContactSelection } from './RecipeColdContactSelection';
import {
  HopV55RecipeColdContactEvidencePanel,
  type HopV55RecipeColdContactEvidencePanelEntryV1,
} from './RecipeColdContactEvidencePanel';

type Prepared = Extract<HopV55RecipeColdContactPrepareResultV1, { status: 'prepared' }>;
type Proposal = { prepared: Prepared; association: HopV55RecipeColdContactAssociationV1; generation: string | number };

export interface HopV55RecipeColdContactWorkbenchProps {
  services: HopV55Services;
  ownerKey: string;
  draftId: string;
  recipe: Recipe;
  workspaceId: string | null;
  /** The recipe step checks mount and identity before returning its live draft. */
  readRecipe(): Recipe | undefined;
  onConserve?(change: HopV55RecipeColdContactChange): Promise<void>;
}

function applicationFor(recipe: Recipe, reference: string | null): unknown {
  if (reference === null) return undefined;
  return (Array.isArray(recipe.hopV55Applications) ? recipe.hopV55Applications : []).find(raw => {
    const read = readHopV55RecipeApplication(raw);
    return read.status === 'current' && read.record.reference === reference;
  });
}

function exactExport(raw: unknown, name: string) {
  return <a className="hv-cold-export" download={`${name}.json`}
    href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(raw, null, 2))}`}>
    Exporter la preuve complète (JSON)
  </a>;
}

/** Native recipe host: source resolution, explicit conservation and immutable historical reading. */
export function HopV55RecipeColdContactWorkbench({ services, ownerKey, draftId, recipe, workspaceId,
  readRecipe, onConserve }: HopV55RecipeColdContactWorkbenchProps) {
  const recipeReader = useRef(readRecipe); recipeReader.current = readRecipe;
  const writer = useRef(onConserve); writer.current = onConserve;
  const workspace = useRef(workspaceId); workspace.current = workspaceId;
  const [open, setOpen] = useState(false);
  const [proposal, setProposal] = useState<Proposal>();
  const [entries, setEntries] = useState<HopV55RecipeColdContactEvidencePanelEntryV1[]>([]);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const sourceRecipeReference = hopV55RecipeColdSourceReference(recipe);
  const journal = recipe.hopV55ColdEvidenceAssociations;
  // A proof sealed under rule 1 (decision n°22) covers the whole draft except the journal: reread it as soon as that changes.
  const ruleOneSignal = useMemo(() => {
    if (!journal?.length) return '';
    const { hopV55ColdEvidenceAssociations: _journal, ...physical } = recipe;
    return hopDecisionReference(physical);
  }, [recipe, journal]);

  const host = useMemo(() => {
    const scope = { kind: 'draft' as const, id: draftId };
    const scopeReference = hopAdviceContentReference('hop-v55-recipe-cold-contact-scope-v1', { ownerKey, scope });
    return createHopV55RecipeColdContactHost({ services,
      getFrame: async () => {
        const before = recipeReader.current();
        if (!before || before.id !== draftId || services.ownerKey !== ownerKey) return null;
        const beforeReference = hopV55RecipeColdSourceReference(before);
        const context = await services.loadContext();
        const after = recipeReader.current();
        if (!after || after.id !== draftId || beforeReference !== hopV55RecipeColdSourceReference(after)
          || !context.recipe || context.recipe.id !== draftId || context.batch) return null;
        const canonical = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: after });
        if (hopDecisionReference(context.recipe) !== hopDecisionReference(canonical.recipe)) return null;
        // The append-only cold journal is not part of the physical recipe source; all other fields stay exact.
        const projectedRecipe = { ...context.recipe };
        delete projectedRecipe.hopV55ColdEvidenceAssociations;
        return { ownerKey, scope, scopeReference,
          generation: hopAdviceContentReference('hop-v55-recipe-cold-contact-generation-v1', beforeReference),
          context: { ...context, recipe: projectedRecipe }, coldContext: null };
      },
      getWorkspace: async () => {
        const id = workspace.current;
        if (!id) return null;
        const current = await services.workspaces.read(ownerKey, id);
        if (workspace.current !== id || current?.ownerKey !== ownerKey || current.sourceRecipeId !== draftId
          || current.sourceBatchId) return null;
        return current;
      },
      catalogueInput: context => ({ saved: { varieties: context.hopIndex?.varieties ?? [], lots: context.hopIndex?.lots ?? [] } }),
    });
  }, [services, ownerKey, draftId]);

  useEffect(() => { setProposal(undefined); setError(''); }, [sourceRecipeReference, workspaceId]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setReading(true);
    void (async () => {
      const currentRecipe = recipeReader.current();
      if (!currentRecipe) return [];
      if (journal !== undefined && !Array.isArray(journal)) return [{ status: 'invalid' as const, raw: journal,
        reason: 'Le journal froid est illisible; il reste conservé sans modification.' }];
      const sources = await host.readSources();
      const rows: HopV55RecipeColdContactEvidencePanelEntryV1[] = [];
      for (const raw of journal ?? []) {
        const initialRead = readHopV55RecipeColdContactAssociationV1(raw);
        if (initialRead.status !== 'readOnly') {
          rows.push({ status: initialRead.status === 'invalid' ? 'invalid' : 'unsupported', raw,
            reason: initialRead.reason });
          continue;
        }
        const association = initialRead.association;
        const receipt = applicationFor(currentRecipe, association.applicationRecordReference);
        const read = readHopV55RecipeColdContactAssociationV1(raw, receipt);
        if (read.status !== 'readOnly') {
          rows.push({ status: read.status === 'invalid' ? 'invalid' : 'unsupported', raw, reason: read.reason });
          continue;
        }
        const source = sources.status === 'ready' ? sources.sources.find(row =>
          row.programReference === association.evidenceSnapshot.sourceBinding.programReference) : undefined;
        let reason = sources.status === 'unavailable' ? sources.reason : 'Le programme d’origine ne correspond plus à une source actuelle.';
        let mismatches: string[] | undefined;
        // A conserved proof is compared under the rule it was sealed with (decision n°22).
        const conservedSourceReference = hopV55RecipeColdSourceReferenceFor(association.sourceRecipeReference, currentRecipe);
        if (source && sources.status === 'ready' && association.ownerKey === ownerKey && association.recipeId === draftId
          && association.sourceRecipeReference !== conservedSourceReference) {
          mismatches = ['sourceRecipeReference'];
          reason = `Écarts avec la source actuelle : ${describeHopV55RecipeColdContactMismatchesV1(mismatches)}.`;
        } else if (source && sources.status === 'ready' && association.ownerKey === ownerKey
          && association.recipeId === draftId) {
          const contact = association.evidenceSnapshot.assessment.inputSnapshot.contact;
          const fresh = await host.prepare({ sourceKey: source.key, sourceReference: source.reference,
            generation: sources.generation, additionIds: [...contact.additionIds], groupingReason: contact.grouping.reason });
          if (fresh.status === 'prepared' && fresh.result.status === 'ready') {
            const compared = compareHopV55RecipeColdContactAssociationSourceV1({ association, applicationRecord: receipt,
              current: { ownerKey, recipeId: draftId, sourceRecipeReference: conservedSourceReference,
                sourceBinding: fresh.result.evidence.sourceBinding } });
            const latestRecipe = recipeReader.current();
            if (compared.status === 'current' && latestRecipe
              && hopV55RecipeColdSourceReferenceFor(association.sourceRecipeReference, latestRecipe) === conservedSourceReference) {
              rows.push({ status: 'current', association }); continue;
            }
            if (compared.status === 'historical') mismatches = compared.mismatches;
            reason = compared.status === 'historical'
              ? `Écarts avec la source actuelle : ${describeHopV55RecipeColdContactMismatchesV1(compared.mismatches)}.`
              : 'Le brouillon a changé pendant la vérification des sources.';
          } else reason = fresh.status === 'refused' ? fresh.reason : 'La qualification actuelle de cette source ne peut pas être vérifiée.';
        }
        rows.push({ status: 'historical', association, reason, ...(mismatches ? { mismatches } : {}) });
      }
      return rows;
    })().then(rows => { if (active) setEntries(rows); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Le journal froid ne peut pas être relu.'); })
      .finally(() => { if (active) setReading(false); });
    return () => { active = false; };
  }, [open, host, journal, sourceRecipeReference, ruleOneSignal, workspaceId, refresh, ownerKey, draftId]);

  const prepare = async (prepared: Prepared) => {
    setProposal(undefined); setError('');
    if (prepared.result.status !== 'ready') return;
    if (prepared.result.evidence.assessment.programBinding.selectedAdditions
      .some(row => row.use !== 'fermentation' && row.use !== 'postFermentation')) {
      setError('Une ligne d’ébullition, de whirlpool ou de premier moût n’est pas un contact à froid : choisis seulement des lignes de fermentation.');
      return;
    }
    const current = recipeReader.current();
    const sources = await host.readSources();
    if (!current || sources.status !== 'ready' || !sources.sources.some(row => row.reference === prepared.source.reference)) {
      throw new Error('La source a changé avant la présentation de la preuve; actualise le programme.');
    }
    const created = createHopV55RecipeColdContactAssociationV1({
      id: `hop-v55-recipe-cold-evidence:${crypto.randomUUID()}`, ownerKey, recipeId: draftId,
      sourceRecipeReference: hopV55RecipeColdSourceReference(current), evidence: prepared.result.evidence,
      origin: { kind: 'localCalculation' }, applicationRecord: null, applicationWitness: null, recordedAt: new Date().toISOString(),
    });
    if (created.status !== 'ready') throw new Error(created.status === 'tooLarge'
      ? `La preuve complète dépasse les limites de conservation (${created.payload.utf8Bytes} octets, profondeur ${created.payload.maxDepth}).`
      : created.reason);
    setProposal({ prepared, association: created.association, generation: sources.generation });
  };

  const conserve = async (association: HopV55RecipeColdContactAssociationV1) => {
    if (!writer.current || !proposal || association.reference !== proposal.association.reference) {
      throw new Error('Cette preuve ne correspond plus à la proposition active.');
    }
    const contact = association.evidenceSnapshot.assessment.inputSnapshot.contact;
    const fresh = await host.prepare({ sourceKey: proposal.prepared.source.key, sourceReference: proposal.prepared.source.reference,
      generation: proposal.generation, additionIds: [...contact.additionIds], groupingReason: contact.grouping.reason });
    if (fresh.status !== 'prepared' || fresh.result.status !== 'ready'
      || fresh.result.evidence.reference !== association.evidenceReference) {
      throw new Error(fresh.status === 'refused' ? fresh.reason : 'Les sources ont changé; prépare une nouvelle preuve avant conservation.');
    }
    const current = recipeReader.current();
    if (!current || association.sourceRecipeReference !== hopV55RecipeColdSourceReference(current)) {
      throw new Error('Le brouillon a changé avant la conservation; aucune preuve n’est écrite.');
    }
    await writer.current({ draftId, association, currentSourceBinding: fresh.result.evidence.sourceBinding });
    setProposal(undefined); setRefresh(value => value + 1);
  };

  return <details className="hop-v55 recipe-hop-v55-cold" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Référence de contact à froid{Array.isArray(journal) && journal.length ? ` · ${journal.length} preuve${journal.length > 1 ? 's' : ''} conservée${journal.length > 1 ? 's' : ''}` : ''}</summary>
    {open ? <div>
      <p>Le programme et ses sources sont relus avant conservation. Les mesures de bière au contact ne sont pas renseignées dans ce brouillon.</p>
      <HopV55RecipeColdContactSelection host={host} onPrepared={prepare} />
      {proposal ? <><HopV55RecipeColdContactEvidencePanel entry={{ status: 'proposed', association: proposal.association }}
        onConserve={conserve} disabled={!onConserve} />{exactExport(proposal.association, 'preuve-contact-froid')}</> : null}
      {reading ? <p role="status">Vérification des sources des preuves conservées…</p> : entries.map((entry, index) => <div key={index}>
        <HopV55RecipeColdContactEvidencePanel entry={entry} onConserve={conserve} disabled />
        {exactExport('association' in entry ? entry.association : entry.raw, `preuve-contact-froid-${index + 1}`)}
      </div>)}
      {error ? <p role="alert" className="hv-error">{error}</p> : null}
      <p className="hv-muted">Le JSON conserve la preuve entière et ses limites. L’export texte de recette résume son origine; la sauvegarde complète conserve toutes les annexes.</p>
    </div> : null}
  </details>;
}
