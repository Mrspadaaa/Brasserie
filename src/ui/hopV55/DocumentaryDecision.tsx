import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { HopDescription, HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopProcessStage, HopDecisionMaterial } from '../../domain/hopDecision/types';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import { assertHopDocumentaryRequest, assertHopDocumentaryAnswer, readHopDocumentaryDossier,
  type HopDocumentaryAccess, type HopDocumentaryAnswer, type HopDocumentaryDossier,
  type HopDocumentaryNeedKind, type HopDocumentaryRoute, type HopDocumentaryScope } from '../../domain/hopDecision/documentaryAnswerSchema';
import { hopDocumentaryAnswerViewModel, type HopDocumentaryAnswerViewModel } from '../../domain/hopDecision/documentaryAnswerViewModel';
import { Input, Textarea } from '../Input';
import './documentary-decision.css';

export interface HopV55DocumentaryReinterpretRequest {
  request: HopDocumentaryAnswer['requestSnapshot'];
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  reason: string;
}

export interface HopV55DocumentaryDossierSaveRequest {
  motive: string;
  routeId: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  expectedRouteReference: string;
}

export interface HopV55DocumentaryCandidateChoiceRequest {
  expectedAnswerReference: string;
  needId: string;
  query: string;
  loadedMaterialIds: string[];
}

export interface HopV55DocumentaryDecisionProps {
  /** Canonical sealed response; the display view is derived locally without rebuilding evidence. */
  answer: HopDocumentaryAnswer;
  dossiers?: HopDocumentaryDossier[];
  readOnly?: boolean;
  onReinterpret?(input: HopV55DocumentaryReinterpretRequest): Promise<HopDocumentaryAnswer>;
  onSaveDossier?(input: HopV55DocumentaryDossierSaveRequest): Promise<HopDocumentaryDossier>;
  /** Optional explicit parent picker; returned rows are exact additions, never fabricated candidates. */
  onChooseCandidates?(input: HopV55DocumentaryCandidateChoiceRequest): Promise<HopDecisionMaterial[]>;
}

type AccessKey = keyof HopDocumentaryAnswer['requestSnapshot']['context']['access'];
type AccessState = HopDocumentaryAccess['state'];
type Need = HopDocumentaryAnswer['requestSnapshot']['needs'][number];
type CandidateRequestDraft = { request: HopDocumentaryAnswer['requestSnapshot']; interpretationText: string };
type AssertionDraft = {
  target: AccessKey;
  access: 'yes' | 'no' | '';
  statement: string;
  sourceTitle: string;
  sourceReference: string;
  locator: string;
};

const accessOptions: Array<{ value: AccessState; label: string }> = [
  { value: 'unknown', label: 'Inconnu / non déclaré' }, { value: 'yes', label: 'Oui, accès déclaré' }, { value: 'no', label: 'Non, accès absent' },
];
const needOptions: Array<{ value: HopDocumentaryNeedKind; label: string }> = [
  { value: 'balancePerceivedSweetness', label: 'Équilibre de sucrosité perçue' },
  { value: 'aromaPairing', label: 'Accord aromatique avec un partenaire' },
  { value: 'lowAlcoholCharacter', label: 'Caractère d’une bière à faible alcool' },
  { value: 'unresolved', label: 'À qualifier · propriété non résolue' },
];
const scopeLabels: Record<HopDocumentaryScope, string> = {
  bulkBeer: 'Lot de bière', sampling: 'Prélèvement', separatePortion: 'Portion séparée', futureBrew: 'Brassage futur', documentation: 'Documentation',
};
const accessLabels: Record<AccessKey, string> = {
  bulkBeer: 'Accès au lot', sampling: 'Accès à un prélèvement', separatePortion: 'Accès à une portion séparée',
};
const stageLabels: Record<HopProcessStage | 'unknown', string> = {
  unknown: 'Stade inconnu ou non établi', planning: 'Planification', hotSide: 'Brassage chaud', fermenting: 'Fermentation',
  conditioning: 'Conditionnement', packaged: 'Bière conditionnée',
};
const argumentKindLabels: Record<HopDocumentaryAnswer['arguments'][number]['kind'], string> = {
  userFact: 'Constat rapporté par l’utilisateur', userGoal: 'Objectif de l’utilisateur', proposedReading: 'Interprétation proposée',
  documentaryFact: 'Fait documentaire', adviceInference: 'Inférence conditionnelle', trialHypothesis: 'Hypothèse d’essai à qualifier',
};
const evaluationLabels: Record<HopDocumentaryAnswer['arguments'][number]['materialEvidence'][number]['evaluation']['status'], string> = {
  documentedSupport: 'Appui documentaire', documentedTension: 'Tension documentaire', documentedAgainst: 'Élément allant à l’encontre',
  documentedOverlap: 'Recouvrement documentaire', candidateOnly: 'Mention du candidat seulement', partnerOnly: 'Mention du partenaire seulement',
  observationToPreserve: 'Observation à conserver', notDocumented: 'Non documenté dans les descriptions', unknown: 'Inconnu',
  ambiguous: 'Ambigu', notApplicable: 'Non applicable',
};
const claimRoleLabels = { support: 'Appui', limit: 'Limite', context: 'Contexte' } as const;
const sourceNatureLabels = { manufacturerClaim: 'Déclaration fabricant', research: 'Recherche', brewerInterview: 'Entretien de brasseur', editorialMapping: 'Cartographie éditoriale' } as const;
const hopSourceKindLabels: Record<HopSource['kind'], string> = {
  coa: 'Certificat d’analyse', manufacturer: 'Fabricant', research: 'Recherche', review: 'Revue',
  observation: 'Observation', community: 'Communauté de brasseurs', judgment: 'Jugement ou déclaration',
};
const readingLevelLabels: Record<HopDocumentaryAnswer['corpusSnapshot']['sources'][number]['readingLevel'], string> = {
  primaryFullText: 'Texte intégral de source primaire', primaryAbstract: 'Résumé de source primaire', primaryExcerpt: 'Extrait de source primaire',
  secondary: 'Source secondaire', dossierSummary: 'Résumé de dossier', providedMaterialSource: 'Source fournie', curatedMapping: 'Correspondance éditoriale',
};
const operationalLabels = { notProvided: 'Aucune opération fournie', requiresReceivedAdapter: 'Adaptateur reçu requis' } as const;
const applicabilityLabels = { conditionsMet: 'Conditions déclarées satisfaites', missingConditions: 'Conditions encore inconnues',
  incompatible: 'Voie incompatible avec une contrainte', notEvaluated: 'Applicabilité non évaluée' } as const;
const dossierKindLabels = { choice: 'Dossier de choix', trialToQualify: 'Dossier d’essai à qualifier', futureStudy: 'Étude future' } as const;
const productFormLabels: Record<HopDecisionMaterial['form'], string> = {
  pelletT90: 'Granulés T-90', pelletT45: 'Granulés T-45', cryo: 'Houblon cryogénique', cone: 'Cônes', extract: 'Extrait', unknown: 'Forme inconnue',
};
const descriptionContextLabels = { rawHop: 'Houblon brut', infusion: 'Infusion', beer: 'Bière', unspecified: 'Contexte non précisé' } as const;
const criterionRoleLabels = { seek: 'Recherche', preserve: 'Préserver', avoid: 'Éviter', pairWith: 'Accord recherché', observation: 'Constat', constraint: 'Contrainte' } as const;

const clone = <T,>(value: T): T => structuredClone(value);
const displayValue = (value: string | number | boolean | null): string => value === null ? 'valeur inconnue'
  : typeof value === 'boolean' ? value ? 'oui' : 'non' : String(value);
const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);
const candidateMaterialName = (answer: HopDocumentaryAnswer, id: string): string | undefined => answer.requestSnapshot.materials.find((row) => row.id === id)?.name;
const sameDisplayText = (left: string, right: string): boolean => left.trim().replace(/\s+/g, ' ').replace(/[.!?…]+$/u, '').toLocaleLowerCase('fr-CH')
  === right.trim().replace(/\s+/g, ' ').replace(/[.!?…]+$/u, '').toLocaleLowerCase('fr-CH');

function stageLabel(stage: HopProcessStage | 'unknown'): string { return stageLabels[stage]; }
function needKindLabel(kind: HopDocumentaryNeedKind): string { return needOptions.find((option) => option.value === kind)?.label ?? 'Point documentaire'; }
function coverageLabel(status: HopDocumentaryAnswer['coverage']['status']): string {
  return status === 'answered' ? 'Réponse dans le domaine fourni' : status === 'partial' ? 'Réponse partielle · lacunes nommées' : 'Hors du domaine de réponse';
}
function applicabilityLabel(status: HopDocumentaryRoute['applicability']['status']): string {
  return status === 'conditionsMet' ? 'Conditions déclarées satisfaites' : status === 'missingConditions' ? 'Conditions encore inconnues'
    : status === 'incompatible' ? 'Voie incompatible avec une contrainte' : 'Applicabilité non évaluée';
}
function interventionLabel(value: HopDocumentaryRoute['intervention']): string {
  return value === 'none' ? 'Aucune intervention définie' : value === 'changeBitterness' ? 'Modifier l’amertume'
    : value === 'changeAroma' ? 'Modifier l’arôme' : 'Impliquer une culture';
}
function operationalLabel(status: HopDocumentaryRoute['preparation']['operational']['status']): string {
  return status === 'notProvided' ? 'Aucune suite opérationnelle fournie' : 'Adaptateur opérationnel reçu requis';
}
function dossierKindLabel(kind: HopDocumentaryRoute['preparation']['documentaryDossier']['kind']): string {
  return kind === 'choice' ? 'Dossier de choix' : kind === 'trialToQualify' ? 'Dossier d’essai à qualifier' : 'Étude future';
}

interface CorrectionEditorProps {
  draft: CandidateRequestDraft;
  onChange(draft: CandidateRequestDraft): void;
  reason: string;
  onReasonChange(value: string): void;
  assertionDraft: AssertionDraft;
  onAssertionDraftChange(value: AssertionDraft): void;
  onAddAssertion(): void;
  candidateSearchByNeed: Record<string, string>;
  onCandidateSearchChange(needId: string, value: string): void;
  candidateBusy: boolean;
  onChooseCandidates?(needId: string): void;
  answer: HopDocumentaryAnswer;
  busy: boolean;
  onCancel(): void;
  onSubmit(): void;
}

function partnerLabel(criterion: HopDocumentaryAnswer['requestSnapshot']['criteria'][number]): string | undefined {
  const partner = criterion.partner;
  if (!partner) return undefined;
  return partner.kind === 'material' ? `Matière liée · ${partner.id}`
    : partner.kind === 'observation' ? `Observation · ${partner.id}` : `Contexte libre · ${partner.text}`;
}

function CorrectionEditor({ draft, onChange, reason, onReasonChange, assertionDraft, onAssertionDraftChange,
  onAddAssertion, candidateSearchByNeed, onCandidateSearchChange, candidateBusy, onChooseCandidates, onCancel, onSubmit, answer, busy }: CorrectionEditorProps) {
  const request = draft.request;
  const updateRequest = (change: (current: HopDocumentaryAnswer['requestSnapshot']) => HopDocumentaryAnswer['requestSnapshot']) => {
    onChange({ ...draft, request: change(draft.request) });
  };
  const updateNeed = (index: number, patch: Partial<Need>) => updateRequest((row) => ({ ...row,
    needs: row.needs.map((need, rowIndex) => rowIndex === index ? { ...need, ...patch } : need) }));
  const toggleNeedCandidate = (index: number, materialId: string, checked: boolean) => {
    const need = request.needs[index]; if (!need) return;
    const ids = new Set(need.candidateIds ?? []);
    if (checked) ids.add(materialId); else ids.delete(materialId);
    updateNeed(index, { candidateIds: [...ids] });
  };
  const updateAccess = (scope: AccessKey, change: Partial<HopDocumentaryAccess>) => updateRequest((row) => ({ ...row,
    context: { ...row.context, access: { ...row.context.access, [scope]: { ...row.context.access[scope], ...change } } } }));
  const toggleAssertion = (scope: AccessKey, id: string, checked: boolean) => {
    const current = new Set(request.context.access[scope].assertionIds);
    if (checked) current.add(id); else current.delete(id);
    const access = { ...request.context.access, [scope]: { ...request.context.access[scope], assertionIds: [...current] } };
    updateRequest((row) => ({ ...row, context: { ...row.context, access } }));
  };
  return <fieldset className="hv-doc-correction-editor" disabled={busy}>
    <legend className="hv-doc-visually-hidden">Corriger l’interprétation, les besoins et le contexte</legend>
    <label><span>Interprétation corrigée</span><Textarea value={draft.interpretationText}
      onChange={(event) => onChange({ ...draft, interpretationText: event.target.value })}
      placeholder="Lecture structurée par l’utilisateur; ne modifie pas la question originale." />
    </label>
    <p className="hv-doc-original-question"><b>Question conservée verbatim :</b> {request.originalQuestion}</p>

    <section className="hv-doc-edit-group" aria-labelledby="hv-doc-needs-edit-title">
      <div className="hv-doc-section-heading"><div><h4 id="hv-doc-needs-edit-title">Besoins documentaires interprétés</h4>
        <p>Chaque besoin et ses critères restent séparés; la prose de la question n’est pas reclassée automatiquement.</p></div>
        <button type="button" className="hv-doc-secondary" onClick={() => updateRequest((row) => ({ ...row,
          needs: [...row.needs, { id: `need-${crypto.randomUUID()}`, kind: 'unresolved', criterionIds: [], explanation: '' }] }))}>Ajouter un besoin à qualifier</button>
      </div>
      {request.needs.map((need, index) => <article className="hv-doc-need-editor" key={need.id}>
        <label><span>Type du besoin</span><select aria-label={`Type du besoin ${index + 1}`} value={need.kind}
          onChange={(event) => updateRequest((row) => ({ ...row, needs: row.needs.map((item, rowIndex) => rowIndex === index
            ? { ...item, kind: event.target.value as HopDocumentaryNeedKind } : item) }))}>
          {needOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
        <label><span>Pourquoi ce besoin est-il retenu ?</span><Textarea aria-label={`Explication du besoin ${index + 1}`}
          value={need.explanation} onChange={(event) => updateRequest((row) => ({ ...row, needs: row.needs.map((item, rowIndex) => rowIndex === index
            ? { ...item, explanation: event.target.value } : item) }))} /></label>
        <div className="hv-doc-criterion-links"><b>Critères exacts liés</b>
          {request.criteria.map((criterion) => <label key={criterion.id}>
            <input type="checkbox" checked={need.criterionIds.includes(criterion.id)} onChange={(event) => {
              const ids = new Set(need.criterionIds); if (event.target.checked) ids.add(criterion.id); else ids.delete(criterion.id);
              updateRequest((row) => ({ ...row, needs: row.needs.map((item, rowIndex) => rowIndex === index ? { ...item, criterionIds: [...ids] } : item) }));
            }} />
            <span>{criterion.description} · {criterionRoleLabels[criterion.role]} · {criterion.origin === 'proposal' ? 'interprétation proposée' : 'déclaration utilisateur'}</span>
            {partnerLabel(criterion) ? <small>{partnerLabel(criterion)}</small> : null}
          </label>)}
        </div>
        <details className="hv-doc-candidate-picker"><summary>Matières exactes liées · {need.candidateIds?.length ?? 0} sélectionnée(s)</summary>
          {(need.candidateIds ?? []).filter((id) => !request.materials.some((material) => material.id === id)).map((id) => <p className="hv-doc-missing" key={id}>
            Candidat demandé mais non chargé; son identité est conservée · <code>{id}</code>
          </p>)}
          <label><span>Rechercher dans les matières explicitement chargées</span><Input aria-label={`Rechercher les candidats du besoin ${index + 1}`}
            value={candidateSearchByNeed[need.id] ?? ''} onChange={(event) => onCandidateSearchChange(need.id, event.target.value)}
            placeholder="Nom ou identifiant, 2 caractères minimum" /></label>
          {(candidateSearchByNeed[need.id]?.trim().length ?? 0) < 2 ? <p className="hv-doc-missing">Saisis au moins deux caractères pour rechercher uniquement les candidats disponibles.</p>
            : request.materials.filter((material) => `${material.name} ${material.id}`.toLocaleLowerCase('fr-CH')
              .includes(candidateSearchByNeed[need.id].trim().toLocaleLowerCase('fr-CH'))).slice(0, 8).map((material) => <label className="hv-doc-candidate-option" key={material.id}>
                <input type="checkbox" checked={(need.candidateIds ?? []).includes(material.id)}
                  onChange={(event) => toggleNeedCandidate(index, material.id, event.target.checked)} />
                <span>{material.name}<small>{productFormLabels[material.form]} · identifiant exact dans les détails <code>{material.id}</code></small></span>
              </label>)}
          {onChooseCandidates ? <button type="button" className="hv-doc-secondary" disabled={candidateBusy} onClick={() => onChooseCandidates(need.id)}>
            Choisir d’autres matières exactes dans les références chargées
          </button> : null}
        </details>
        <button type="button" className="hv-doc-text-button" onClick={() => updateRequest((row) => ({ ...row, needs: row.needs.filter((_, rowIndex) => rowIndex !== index) }))}>
          Retirer ce besoin de l’interprétation
        </button>
      </article>)}
    </section>

    <section className="hv-doc-edit-group" aria-labelledby="hv-doc-context-edit-title">
      <div className="hv-doc-section-heading"><div><h4 id="hv-doc-context-edit-title">Stade fourni et accès déclarés</h4>
        <p>Le stade provient de la source préparée et reste figé dans cette correction. Chaque accès reste un constat distinct.</p></div></div>
      <div className="hv-doc-stage-source" role="group" aria-label="Stade fourni par la source">
        <b>Stade fourni dans cette source</b><span>{stageLabel(request.context.stage)}</span>
        <p>{request.context.stageBasis}</p>
        <p>Pour changer de phase, relis ou actualise la source de cette réponse. Les accès et besoins peuvent être corrigés ici sans modifier le stade préparé.</p>
        {request.context.assertions.some((assertion) => assertion.subject === 'batch-stage') ? <details>
          <summary>Constats sourcés avec le stade</summary>
          {request.context.assertions.filter((assertion) => assertion.subject === 'batch-stage').map((assertion) => <AssertionSummary key={assertion.id}
            answer={answer} assertions={request.context.assertions} assertionId={assertion.id} />)}
        </details> : null}
      </div>
      <div className="hv-doc-access-grid">{(Object.keys(accessLabels) as AccessKey[]).map((scope) => {
        const access = request.context.access[scope];
        return <fieldset className="hv-doc-access" key={scope}>
          <legend>{accessLabels[scope]}</legend>
          <label><span>État explicite</span><select aria-label={`État ${accessLabels[scope]}`} value={access.state}
            onChange={(event) => updateAccess(scope, { state: event.target.value as AccessState, assertionIds: [], basis: '' })}>
            {accessOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>
          <label><span>Base du choix</span><Input aria-label={`Base ${accessLabels[scope]}`} value={access.basis}
            onChange={(event) => updateAccess(scope, { basis: event.target.value })} /></label>
          {access.state === 'unknown' ? <p className="hv-doc-missing">Inconnu reste inconnu; aucune assertion n’est ajoutée automatiquement.</p>
            : <div className="hv-doc-access-evidence"><b>Assertions explicitement rattachées</b>
              {request.context.assertions.filter((assertion) => assertion.subject === `access.${scope}` || assertion.subject === scope).map((assertion) => <label key={assertion.id}>
                <input type="checkbox" checked={access.assertionIds.includes(assertion.id)} onChange={(event) => toggleAssertion(scope, assertion.id, event.target.checked)} />
                <span>{assertion.statement}<small>{assertion.state} · {displayValue(assertion.value)}</small></span>
              </label>)}
              {!access.assertionIds.length ? <small>Une réponse oui/non exige au moins une assertion de cette portée.</small> : null}
            </div>}
        </fieldset>;
      })}</div>

      <details className="hv-doc-add-assertion"><summary>Ajouter un constat utilisateur sourcé</summary>
        <p>Ajoute une assertion explicite d’accès; elle n’est pas déduite du texte de la question ni du stade source.</p>
        <label><span>Portée du constat</span><select aria-label="Portée de la nouvelle assertion" value={assertionDraft.target}
          onChange={(event) => onAssertionDraftChange({ ...assertionDraft, target: event.target.value as AssertionDraft['target'] })}>
          {(Object.keys(accessLabels) as AccessKey[]).map((scope) => <option key={scope} value={scope}>{accessLabels[scope]}</option>)}
        </select></label>
        <label><span>Accès constaté</span><select aria-label="Accès constaté" value={assertionDraft.access}
          onChange={(event) => onAssertionDraftChange({ ...assertionDraft, access: event.target.value as 'yes' | 'no' })}>
          <option value="yes">Oui, accès déclaré</option><option value="no">Non, accès absent</option>
        </select></label>
        <label><span>Texte du constat</span><Textarea aria-label="Texte du constat" value={assertionDraft.statement}
          onChange={(event) => onAssertionDraftChange({ ...assertionDraft, statement: event.target.value })} /></label>
        <label><span>Titre de la source</span><Input aria-label="Titre de la source" value={assertionDraft.sourceTitle}
          onChange={(event) => onAssertionDraftChange({ ...assertionDraft, sourceTitle: event.target.value })} /></label>
        <label><span>Référence source · URL ou identifiant facultatif</span><Input aria-label="Référence source" value={assertionDraft.sourceReference}
          onChange={(event) => onAssertionDraftChange({ ...assertionDraft, sourceReference: event.target.value })} /></label>
        <label><span>Repère exact de la source ou de la déclaration</span><Input aria-label="Repère de source" value={assertionDraft.locator}
          onChange={(event) => onAssertionDraftChange({ ...assertionDraft, locator: event.target.value })} /></label>
        <button type="button" className="hv-doc-secondary" onClick={onAddAssertion}>Ajouter et rattacher explicitement ce constat</button>
      </details>
      {request.context.assertions.length ? <details className="hv-doc-assertion-list"><summary>Constats et sources de la lecture ({request.context.assertions.length})</summary>
        {request.context.assertions.map((assertion) => <AssertionSummary key={assertion.id} answer={answer}
          assertions={request.context.assertions} assertionId={assertion.id} />)}
      </details> : null}
    </section>

    <label className="hv-doc-correction-reason"><span>Pourquoi corriger cette lecture ?</span><Textarea value={reason}
      onChange={(event) => onReasonChange(event.target.value)} placeholder="Motif de correction, distinct de la question originale." /></label>
    <div className="hv-doc-actions">
      <button type="button" className="hv-doc-secondary" onClick={onCancel}>Annuler la correction</button>
      <button type="button" className="hv-doc-primary" disabled={!reason.trim() || !draft.interpretationText.trim()
        || !draft.request.needs.length || draft.request.needs.some((need) => !need.explanation.trim())
        || !draft.request.context.stageBasis.trim()
        || (Object.keys(draft.request.context.access) as AccessKey[]).some((scope) => !draft.request.context.access[scope].basis.trim())
        || (Object.keys(draft.request.context.access) as AccessKey[]).some((scope) => draft.request.context.access[scope].state !== 'unknown'
          && !draft.request.context.access[scope].assertionIds.length)} onClick={onSubmit}>Créer une nouvelle réponse documentaire</button>
    </div>
  </fieldset>;
}

function SourceCard({ answer, source }: { answer: HopDocumentaryAnswer; source: HopSource }) {
  const record = answer.corpusSnapshot.sources.find((row) => same(row.source, source));
  const url = /^https?:\/\//i.test(source.reference);
  return <div className="hv-doc-source-card">
    <b>{source.title}</b><span>{source.author}{source.year === null ? '' : ` · ${source.year}`}</span>
    {record ? <><span>{sourceNatureLabels[record.nature]} · {readingLevelLabels[record.readingLevel]}</span>
      <span>Repère : {record.locator}</span><span>Domaine : {record.domain}</span>
      {record.limits.map((limit, index) => <small key={`${index}-${limit}`}>Limite : {limit}</small>)}
    </> : <><span>Nature de source : {hopSourceKindLabels[source.kind]}</span>
      {source.locator ? <span>Repère : {source.locator}</span> : null}
      <small>Niveau de lecture non indiqué dans le corpus de cette réponse.</small></>}
    {url ? <a href={source.reference} target="_blank" rel="noreferrer">Consulter la source</a> : null}
    <details><summary>Référence technique</summary><code>{source.reference}</code></details>
  </div>;
}

function AssertionSummary({ answer, assertionId, assertions = answer.requestSnapshot.context.assertions }: {
  answer: HopDocumentaryAnswer; assertionId: string; assertions?: HopAdviceAssertion[];
}) {
  const assertion = assertions.find((row) => row.id === assertionId);
  if (!assertion) return <p className="hv-doc-missing">Assertion non retrouvée dans la réponse; la référence reste visible.</p>;
  return <article className="hv-doc-assertion">
    <b>{assertion.statement}</b>
    <span>{assertion.state === 'reported' ? 'Rapporté' : assertion.state === 'measured' ? 'Mesuré' : assertion.state === 'planned' ? 'Prévu' : assertion.state === 'performed' ? 'Effectué' : 'Inconnu'}
      {assertion.value === null ? '' : ` · ${displayValue(assertion.value)}`}{assertion.unit ? ` ${assertion.unit}` : ''}</span>
    {assertion.source ? <SourceCard answer={answer} source={assertion.source} /> : <small>Source documentaire non jointe à cette assertion.</small>}
  </article>;
}

function DocumentaryArgument({ answer, argumentId, duplicateBodyText = false }: {
  answer: HopDocumentaryAnswer; argumentId: string; duplicateBodyText?: boolean;
}) {
  const argument = answer.arguments.find((row) => row.id === argumentId);
  if (!argument) return null;
  const criteria = answer.requestSnapshot.criteria.filter((criterion) => argument.criterionIds.includes(criterion.id));
  const claims = answer.corpusSnapshot.claims.filter((claim) => argument.claimIds.includes(claim.id));
  const sources = claims.flatMap((claim) => answer.corpusSnapshot.sources.filter((source) => claim.sourceIds.includes(source.id)));
  return <article className="hv-doc-argument">
    <span className={`hv-doc-kind hv-doc-kind-${argument.kind}`}>{argumentKindLabels[argument.kind]}</span>
    {duplicateBodyText ? <details className="hv-doc-argument-development">
      <summary>Développement de cette raison</summary><p>{argument.text}</p>
    </details> : <p>{argument.text}</p>}
    {criteria.length ? <small>Critères liés : {criteria.map((criterion) => criterion.description).join(' · ')}</small> : null}
    {argument.assertionIds.length ? <details><summary>Constats utilisés ({argument.assertionIds.length})</summary>
      {argument.assertionIds.map((id) => <AssertionSummary key={id} answer={answer} assertionId={id} />)}
    </details> : null}
    {argument.materialEvidence.some((row) => row.evaluation.candidateDescriptions.length || row.evaluation.partnerDescriptions.length)
      ? <details><summary>Descriptions originales et contexte</summary>
        {argument.materialEvidence.flatMap((row) => [
          ...row.evaluation.candidateDescriptions.map((description) => ({ materialId: row.materialId, side: 'candidat' as const, description })),
          ...row.evaluation.partnerDescriptions.map((description) => ({ materialId: row.materialId, side: 'partenaire' as const, description })),
        ]).map(({ materialId, side, description }, index) => <article className="hv-doc-description" key={`${materialId}-${side}-${index}`}>
          <span>{candidateMaterialName(answer, materialId) ?? 'Candidat non chargé'} · {side} · contexte {description.context}</span>
          <blockquote>« {description.text} »</blockquote><SourceCard answer={answer} source={description.source} />
        </article>)}
      </details> : null}
    {claims.length || argument.materialEvidence.length ? <details><summary>Sources et évaluations liées</summary>
      {claims.map((claim) => <article className="hv-doc-claim" key={claim.id}>
        <b>{claimRoleLabels[claim.role]} · {claim.statement}</b><small>Domaine : {claim.domain}</small>
        {claim.transferConditions.length ? <small>Conditions de transfert : {claim.transferConditions.join(' · ')}</small> : null}
        {claim.forbiddenInferences.length ? <small>À ne pas déduire : {claim.forbiddenInferences.join(' · ')}</small> : null}
      </article>)}
      {sources.map((source) => <SourceCard key={source.id} answer={answer} source={source.source} />)}
      {argument.materialEvidence.map((row, index) => <article className="hv-doc-evaluation" key={`${row.materialId}-${row.criterionId}-${index}`}>
        <b>{candidateMaterialName(answer, row.materialId) ?? 'Candidat non chargé'} · {evaluationLabels[row.evaluation.status]}</b>
        <p>{row.evaluation.consequence}</p>
        {row.evaluation.missingInformation.map((missing, i) => <small key={`${i}-${missing}`}>Information manquante : {missing}</small>)}
        {[...row.evaluation.candidateEvidence, ...row.evaluation.partnerEvidence].map((evidence, evidenceIndex) => <article className="hv-doc-evidence" key={`${evidence.side}-${evidenceIndex}`}>
          <blockquote>« {evidence.quote} »</blockquote>
          <span>{evidence.side === 'candidate' ? 'Candidat' : 'Partenaire'} · {evidence.term} · {descriptionContextLabels[evidence.context]} · {evidence.polarity === 'positiveMention' ? 'mention positive' : evidence.polarity === 'explicitNegation' ? 'négation explicite' : 'mention ambiguë'}</span>
          <SourceCard answer={answer} source={evidence.source} />
          <SourceCard answer={answer} source={evidence.mappingSource} />
        </article>)}
      </article>)}
    </details> : null}
  </article>;
}

function scopeLabel(scope: HopDocumentaryScope): string { return scopeLabels[scope]; }
export function HopV55DocumentaryDecision({ answer, dossiers = [], readOnly = false, onReinterpret, onSaveDossier, onChooseCandidates }: HopV55DocumentaryDecisionProps) {
  const [currentAnswer, setCurrentAnswer] = useState(answer);
  const currentAnswerRef = useRef(answer);
  currentAnswerRef.current = currentAnswer;
  const [priorAnswers, setPriorAnswers] = useState<HopDocumentaryAnswer[]>([]);
  const [viewedAnswerReference, setViewedAnswerReference] = useState<string>();
  const [correctionDraft, setCorrectionDraft] = useState<CandidateRequestDraft>();
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionAssertionDraft, setCorrectionAssertionDraft] = useState<AssertionDraft>({
    target: 'bulkBeer', access: '', statement: '', sourceTitle: '', sourceReference: '', locator: '',
  });
  const [correctionError, setCorrectionError] = useState('');
  const [candidateSearchByNeed, setCandidateSearchByNeed] = useState<Record<string, string>>({});
  const [candidateBusy, setCandidateBusy] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [motiveByRoute, setMotiveByRoute] = useState<Record<string, string>>({});
  const [pendingDossierSave, setPendingDossierSave] = useState<HopV55DocumentaryDossierSaveRequest>();
  const [savingDossier, setSavingDossier] = useState(false);
  const [savedDossiers, setSavedDossiers] = useState<HopDocumentaryDossier[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (answer.reference === currentAnswerRef.current.reference) return;
    setPriorAnswers((rows) => rows.some((row) => row.reference === currentAnswerRef.current.reference)
      ? rows : [...rows, clone(currentAnswerRef.current)]);
    setCurrentAnswer(answer); setViewedAnswerReference(undefined); setCorrectionDraft(undefined);
    currentAnswerRef.current = answer;
  }, [answer.reference]);

  const answerHistory = useMemo(() => {
    const byReference = new Map<string, HopDocumentaryAnswer>();
    priorAnswers.forEach((row) => byReference.set(row.reference, row));
    return [...byReference.values()];
  }, [priorAnswers]);
  const viewingAnswer = viewedAnswerReference ? answerHistory.find((row) => row.reference === viewedAnswerReference) ?? currentAnswer : currentAnswer;
  const isViewingHistory = viewingAnswer.reference !== currentAnswer.reference;
  const view = useMemo<HopDocumentaryAnswerViewModel>(() => hopDocumentaryAnswerViewModel(viewingAnswer), [viewingAnswer.reference]);
  const materialsById = useMemo<Map<string, HopDecisionMaterial>>(() =>
    new Map(view.requestSnapshot.materials.map((material) => [material.id, material])), [view.answerReference]);
  const allDossiers = useMemo(() => {
    const byReference = new Map<string, HopDocumentaryDossier>();
    [...dossiers, ...savedDossiers].forEach((row) => byReference.set(row.reference, row));
    return [...byReference.values()];
  }, [dossiers, savedDossiers]);
  const dossiersForAnswer = allDossiers.filter((dossier) => dossier.answerReference === view.answerReference);
  const editorEnabled = !readOnly && !isViewingHistory;

  const startCorrection = () => {
    setCorrectionDraft({ request: clone(viewingAnswer.requestSnapshot), interpretationText: viewingAnswer.requestSnapshot.interpretation.text });
    setCorrectionReason(''); setCorrectionError(''); setError(''); setNotice('');
  };

  const addUserAssertion = () => {
    if (!correctionDraft) return;
    const sourceTitle = correctionAssertionDraft.sourceTitle.trim();
    const statement = correctionAssertionDraft.statement.trim();
    const locator = correctionAssertionDraft.locator.trim();
    if (!sourceTitle || !statement || !locator) { setCorrectionError('Renseigne le constat, son titre de source et son repère.'); return; }
    if (!correctionAssertionDraft.access) {
      setCorrectionError('Choisis explicitement si cet accès est oui ou non avant de rattacher le constat.'); return;
    }
    const source: HopSource = { title: sourceTitle, author: 'Utilisateur local', year: null, kind: 'judgment',
      reference: correctionAssertionDraft.sourceReference.trim() || `hop-documentary-user:${crypto.randomUUID()}`, locator };
    const assertion: HopAdviceAssertion = { id: `assertion-${crypto.randomUUID()}`,
      subject: `access.${correctionAssertionDraft.target}`,
      statement, state: 'reported', value: correctionAssertionDraft.access === 'yes',
      dimension: 'process', source };
    const context = correctionDraft.request.context;
    const nextAssertions = [...context.assertions, assertion];
    const nextContext = { ...context, assertions: nextAssertions, access: { ...context.access,
      [correctionAssertionDraft.target]: { state: correctionAssertionDraft.access as 'yes' | 'no',
        basis: `${statement} · Source : ${source.title} · ${source.reference}`, assertionIds: [assertion.id] } } };
    setCorrectionDraft({ ...correctionDraft, request: { ...correctionDraft.request, context: nextContext } });
    setCorrectionAssertionDraft({ ...correctionAssertionDraft, statement: '', sourceTitle: '', sourceReference: '', locator: '' });
    setCorrectionError('');
  };

  const removeNeed = (index: number) => setCorrectionDraft((current) => current ? { ...current,
    request: { ...current.request, needs: current.request.needs.filter((_, rowIndex) => rowIndex !== index) } } : current);

  const chooseCandidates = async (needId: string) => {
    if (!correctionDraft || !onChooseCandidates) return;
    const query = candidateSearchByNeed[needId]?.trim() ?? '';
    if (query.length < 2) { setCorrectionError('Saisis deux caractères ou plus pour demander un candidat exact au parent.'); return; }
    try {
      setCandidateBusy(true); setCorrectionError('');
      const chosen = await onChooseCandidates({ expectedAnswerReference: viewingAnswer.reference,
        needId, query, loadedMaterialIds: correctionDraft.request.materials.map((material) => material.id) });
      const byId = new Map(correctionDraft.request.materials.map((material) => [material.id, material]));
      for (const material of chosen) {
        const prior = byId.get(material.id);
        if (prior && !same(prior, material)) throw Error(`La matière ${material.name} change de contenu sous la même identité; relis la réponse source.`);
        byId.set(material.id, clone(material));
      }
      const request = { ...correctionDraft.request, materials: [...byId.values()] };
      assertHopDocumentaryRequest(request);
      setCorrectionDraft({ ...correctionDraft, request });
      setNotice(chosen.length ? `${chosen.length} matière(s) exacte(s) ajoutée(s) au brouillon de correction; attribue-les explicitement à un besoin.` : 'Aucune matière exacte n’a été ajoutée.');
    } catch (cause) { setCorrectionError((cause as Error).message || 'Le choix de candidats a échoué.'); }
    finally { setCandidateBusy(false); }
  };

  const submitCorrection = async () => {
    if (!correctionDraft || !onReinterpret) return;
    const reason = correctionReason.trim();
    if (!reason) { setCorrectionError('Explique pourquoi tu corriges cette lecture.'); return; }
    if (!correctionDraft.interpretationText.trim()) { setCorrectionError('Décris l’interprétation corrigée sans réécrire la question originale.'); return; }
    const request = clone(correctionDraft.request);
    if (!request.context.stageBasis.trim()) { setCorrectionError('Renseigne une base explicite pour le stade, même s’il reste inconnu.'); return; }
    const missingAccessBasis = (Object.keys(request.context.access) as AccessKey[]).find((scope) => !request.context.access[scope].basis.trim());
    if (missingAccessBasis) { setCorrectionError(`Renseigne la base de l’état « ${accessLabels[missingAccessBasis]} », y compris s’il reste inconnu.`); return; }
    const ungroundedAccess = (Object.keys(request.context.access) as AccessKey[]).find((scope) =>
      request.context.access[scope].state !== 'unknown' && !request.context.access[scope].assertionIds.length);
    if (ungroundedAccess) { setCorrectionError(`L’état oui/non de « ${accessLabels[ungroundedAccess]} » exige une assertion source explicite; sinon garde-le inconnu.`); return; }
    request.interpretation = { id: `interpretation-${crypto.randomUUID()}`, version: '1',
      text: correctionDraft.interpretationText.trim(), origin: 'user' };
    if (request.originalQuestion !== viewingAnswer.requestSnapshot.originalQuestion) {
      setCorrectionError('La question originale reste verbatim; corrige la lecture structurée à la place.'); return;
    }
    try { assertHopDocumentaryRequest(request); }
    catch (cause) { setCorrectionError((cause as Error).message || 'La correction doit respecter les références et états explicites.'); return; }
    try {
      setCorrecting(true); setCorrectionError(''); setError(''); setNotice('');
      const next = await onReinterpret({ request, expectedAnswerReference: viewingAnswer.reference,
        expectedInterpretationReference: viewingAnswer.interpretationReference, reason });
      assertHopDocumentaryAnswer(next);
      if (next.requestSnapshot.id !== request.id || next.requestSnapshot.originalQuestion !== request.originalQuestion) {
        throw Error('La réponse réinterprétée ne conserve pas la question exacte et son identité.');
      }
      setPriorAnswers((rows) => rows.some((row) => row.reference === viewingAnswer.reference) ? rows : [...rows, clone(viewingAnswer)]);
      setCurrentAnswer(next); currentAnswerRef.current = next; setViewedAnswerReference(undefined); setCorrectionDraft(undefined);
      setNotice('Nouvelle réponse documentaire conservée comme une lecture distincte. La réponse précédente reste figée.');
    } catch (cause) { setCorrectionError((cause as Error).message || 'La réponse n’a pas pu être réinterprétée. La version précédente reste intacte.'); }
    finally { setCorrecting(false); }
  };

  const submitDossierRequest = async (request: HopV55DocumentaryDossierSaveRequest) => {
    if (!onSaveDossier || readOnly) return;
    setPendingDossierSave(request); setSavingDossier(true); setError(''); setNotice('');
    try {
      const saved = await onSaveDossier(request);
      const read = readHopDocumentaryDossier(saved);
      if (read.status !== 'readOnly') throw Error('Le dossier retourné n’est pas lisible dans ce format; il reste conservé sans interprétation.');
      if (read.dossier.answerReference !== request.expectedAnswerReference || read.dossier.interpretationReference !== request.expectedInterpretationReference
        || read.dossier.routeId !== request.routeId || read.dossier.routeReference !== request.expectedRouteReference) {
        throw Error('Le dossier sauvegardé ne correspond pas aux références attendues; reprends ce choix sur la réponse courante.');
      }
      setSavedDossiers((rows) => rows.some((row) => row.reference === read.dossier.reference) ? rows : [...rows, clone(read.dossier)]);
      setPendingDossierSave(undefined); setNotice('Dossier documentaire conservé. Aucune opération ni recette n’a été créée.');
    } catch (cause) { setError((cause as Error).message || 'Le dossier reste prêt à être enregistré de nouveau.'); }
    finally { setSavingDossier(false); }
  };

  const saveDossier = async (route: HopDocumentaryRoute) => {
    if (!onSaveDossier || !editorEnabled) return;
    const motive = motiveByRoute[route.id]?.trim();
    if (!motive) { setError('Explique pourquoi tu conserves ce dossier documentaire.'); return; }
    await submitDossierRequest({ motive, routeId: route.id,
      expectedAnswerReference: viewingAnswer.reference, expectedInterpretationReference: viewingAnswer.interpretationReference,
      expectedRouteReference: route.reference });
  };

  const retryDossierSave = async () => {
    if (!pendingDossierSave || !onSaveDossier) return;
    const route = viewingAnswer.routes.find((row) => row.id === pendingDossierSave.routeId);
    if (!route || route.reference !== pendingDossierSave.expectedRouteReference
      || viewingAnswer.reference !== pendingDossierSave.expectedAnswerReference) {
      setError('La réponse ou la voie a changé; reprends le choix du dossier sur la réponse courante.'); return;
    }
    await submitDossierRequest(pendingDossierSave);
  };

  const argumentById = useMemo<Map<string, HopDocumentaryAnswer['arguments'][number]>>(() =>
    new Map(view.arguments.map((argument) => [argument.id, argument])), [view.answerReference]);

  return <section className="hop-v55 hv-documentary-decision" aria-labelledby="hv-doc-title">
    <header className="hv-doc-header">
      <div><p className="hv-doc-eyebrow">Synthèse documentaire</p>
        <h2 id="hv-doc-title">{view.requestSnapshot.originalQuestion}</h2>
        <p><b>Interprétation {view.requestSnapshot.interpretation.origin === 'user' ? 'déclarée' : 'proposée'} :</b> {view.requestSnapshot.interpretation.text}</p>
        <p>Stade : <b>{stageLabel(view.requestSnapshot.context.stage)}</b> · {view.requestSnapshot.context.stageBasis}</p>
      </div>
      <details className="hv-doc-identity"><summary>Réponse et lecture</summary>
        <p>Référence réponse · <code>{view.answerReference}</code></p>
        <p>Référence interprétation · <code>{view.interpretationReference}</code></p>
        <p>Corpus · v{view.corpusSnapshot.version} · <code>{view.corpusSnapshot.reference}</code></p>
      </details>
    </header>

    {isViewingHistory ? <p className="hv-doc-history-banner" role="status">Réponse antérieure en lecture figée. Aucune synthèse n’a été reconstruite.</p>
      : readOnly ? <p className="hv-doc-history-banner" role="status">Cette réponse est affichée en lecture seule.</p> : null}

    <section className="hv-doc-section hv-doc-answer" aria-labelledby="hv-doc-answer-title">
      <h3 id="hv-doc-answer-title">Réponse directe et raisons</h3>
      {view.body.length ? view.body.map((paragraph) => <article className="hv-doc-body-paragraph" key={paragraph.id}>
        <p>{paragraph.text}</p>
        <div className="hv-doc-arguments">{paragraph.argumentIds.map((id) => argumentById.has(id)
          ? <DocumentaryArgument key={id} answer={viewingAnswer} argumentId={id}
            duplicateBodyText={sameDisplayText(paragraph.text, argumentById.get(id)!.text)} /> : null)}</div>
      </article>) : <p className="hv-doc-missing">Aucune réponse substantielle n’est fournie dans cette portée documentaire.</p>}
    </section>

    <section className="hv-doc-section hv-doc-context" aria-labelledby="hv-doc-context-title">
      <h3 id="hv-doc-context-title">Contexte déclaré</h3>
      <p>Stade : <b>{stageLabel(view.requestSnapshot.context.stage)}</b> · {view.requestSnapshot.context.stageBasis}</p>
      <div className="hv-doc-context-grid">{(Object.keys(accessLabels) as AccessKey[]).map((scope) => {
        const access = view.requestSnapshot.context.access[scope];
        return <article key={scope}>
          <b>{accessLabels[scope]}</b><span>{access.state === 'yes' ? 'Oui, accès explicitement déclaré' : access.state === 'no' ? 'Non, accès explicitement déclaré' : 'Inconnu / non déclaré'}</span>
          <p>{access.basis}</p>{access.assertionIds.map((id) => <AssertionSummary key={id} answer={viewingAnswer} assertionId={id} />)}
        </article>;
      })}</div>
      {view.requestSnapshot.context.assertions.length ? <details><summary>Constats fournis ({view.requestSnapshot.context.assertions.length})</summary>
        {view.requestSnapshot.context.assertions.map((assertion) => <AssertionSummary key={assertion.id} answer={viewingAnswer} assertionId={assertion.id} />)}
      </details> : null}
    </section>

    <section className="hv-doc-section hv-doc-coverage" aria-labelledby="hv-doc-coverage-title">
      <div className="hv-doc-section-heading"><h3 id="hv-doc-coverage-title">Portée de la réponse</h3>
        <strong className={`hv-doc-status hv-doc-status-${view.coverage.status}`}>{coverageLabel(view.coverage.status)}</strong></div>
      <div className="hv-doc-points">{view.coverage.points.map((point) => <article key={point.needId}>
        {(() => {
          const need = view.requestSnapshot.needs.find((row) => row.id === point.needId);
          const criteria = need ? view.requestSnapshot.criteria.filter((criterion) => need.criterionIds.includes(criterion.id)) : [];
          return <>
            <b>{need ? needKindLabel(need.kind) : 'Point documentaire'}</b>
            {criteria.length ? <span>Critères liés : {criteria.map((criterion) => criterion.description).join(' · ')}</span>
              : <span>Aucun critère précis n’est rattaché à ce besoin.</span>}
            <span>{point.status === 'answered' ? 'Examiné' : point.status === 'partial' ? 'Réponse partielle' : 'À qualifier'}</span>
            <details className="hv-doc-coverage-detail"><summary>Détails de la qualification</summary>
              {need ? <><p>Besoin : {need.explanation}</p><code>{need.id}</code></> : null}
              <p>{point.reason}</p>
              {criteria.map((criterion) => <p key={criterion.id}>{criterion.description} · {criterionRoleLabels[criterion.role]} · {criterion.origin === 'proposal' ? 'interprétation proposée' : 'déclaration utilisateur'} · <code>{criterion.id}</code></p>)}
              {need?.criterionIds.filter((id) => !criteria.some((criterion) => criterion.id === id)).map((id) => <p key={id}>Critère non retrouvé · <code>{id}</code></p>)}
            </details>
          </>;
        })()}
      </article>)}</div>
      <details className="hv-doc-coverage-detail"><summary>Périmètre général de cette réponse</summary><p>{view.coverage.domain}</p></details>
      {view.coverage.unresolvedCriteria.length ? <details><summary>Critères non résolus ({view.coverage.unresolvedCriteria.length})</summary>
        <ul>{view.coverage.unresolvedCriteria.map((row) => <li key={row.criterionId}>{view.requestSnapshot.criteria.find((criterion) => criterion.id === row.criterionId)?.description ?? 'Critère absent'} · {row.reason} · <code>{row.criterionId}</code></li>)}</ul>
      </details> : null}
    </section>

    <section className="hv-doc-section hv-doc-routes" aria-labelledby="hv-doc-routes-title">
      <div className="hv-doc-section-heading"><div><h3 id="hv-doc-routes-title">Voies documentaires à examiner</h3>
        <p>Chaque voie distingue conditions, préparation documentaire et frontière opérationnelle.</p></div></div>
      {view.routes.length ? <div className="hv-doc-route-list">{view.routes.map((route) => {
        const existingDossier = dossiersForAnswer.find((row) => row.routeId === route.id && row.routeReference === route.reference);
        const savedLocalDossier = savedDossiers.find((row) => row.answerReference === view.answerReference && row.routeId === route.id && row.routeReference === route.reference);
        const alreadySaved = !!existingDossier || !!savedLocalDossier;
        return <article className="hv-doc-route" key={route.reference}>
          <div className="hv-doc-route-heading"><div><h4>{route.title}</h4><p>{route.purpose}</p></div>
            <span className={`hv-doc-status hv-doc-status-${route.applicability.status}`}>{applicabilityLabel(route.applicability.status)}</span></div>
          <dl className="hv-doc-route-meta">
            <div><dt>Portée</dt><dd>{scopeLabel(route.scope)}</dd></div>
            <div><dt>Intervention envisagée</dt><dd>{interventionLabel(route.intervention)}</dd></div>
            <div><dt>Préparation documentaire</dt><dd>{route.preparation.documentaryDossier.status === 'available' ? 'Dossier conservable' : 'Dossier indisponible'} · {dossierKindLabel(route.preparation.documentaryDossier.kind)} · {route.preparation.documentaryDossier.label}</dd></div>
            <div><dt>Frontière opérationnelle</dt><dd>{operationalLabel(route.preparation.operational.status)} · {route.preparation.operational.reason}</dd></div>
          </dl>
          {route.applicability.conditions.length ? <details className="hv-doc-conditions"><summary>Conditions de cette voie</summary>
            {route.applicability.conditions.map((condition) => <article key={condition.id}>
              <b>{condition.state === 'met' ? 'Déclarée satisfaite' : condition.state === 'unmet' ? 'Déclarée incompatible' : 'Inconnue'}</b>
              <p>{condition.description}</p>
              {condition.criterionIds.length ? <small>Critères : {condition.criterionIds.map((id) => view.requestSnapshot.criteria.find((criterion) => criterion.id === id)?.description ?? id).join(' · ')}</small> : null}
              {condition.assertionIds.map((id) => <AssertionSummary key={id} answer={viewingAnswer} assertionId={id} />)}
            </article>)}
          </details> : <p className="hv-doc-missing">Aucune condition n’a été évaluée pour cette voie.</p>}
          {route.preparation.missingRequirements.length ? <ul className="hv-doc-requirements">
            {route.preparation.missingRequirements.map((item, index) => <li key={`${index}-${item}`}>À qualifier : {item}</li>)}
          </ul> : null}
          {route.preparation.refusalReasons.length ? <ul className="hv-doc-refusals">
            {route.preparation.refusalReasons.map((item, index) => <li key={`${index}-${item}`}>Voie écartée : {item}</li>)}
          </ul> : null}
          {route.argumentIds.length ? <details><summary>Raisons liées à cette voie</summary>
            {route.argumentIds.map((id) => argumentById.has(id) ? <DocumentaryArgument key={id} answer={viewingAnswer} argumentId={id} /> : null)}
          </details> : null}
          {route.materialIds.length ? <details><summary>Matières exactes fournies ({route.materialIds.length})</summary>
            <ul>{route.materialIds.map((id) => <li key={id}>{materialsById.get(id)?.name ?? 'Candidat explicitement demandé, non chargé'}</li>)}</ul>
          </details> : null}
          {route.documentaryProductRefs.length ? <details className="hv-doc-products"><summary>Produits cités dans les sources · pas des matières ni des stocks</summary>
            {route.documentaryProductRefs.map((product) => <article key={product.id}>
              <b>{product.name}</b><p>Référence de produit documentaire; aucune identité de stock ou permission d’emploi n’en découle.</p>
              <details><summary>Claims liés</summary>{product.claimIds.map((claimId) => {
                const claim = view.corpusSnapshot.claims.find((row) => row.id === claimId);
                return claim ? <article key={claimId}><p>{claim.statement} · {claimRoleLabels[claim.role]}</p>
                  {claim.sourceIds.map((sourceId) => {
                    const source = view.corpusSnapshot.sources.find((row) => row.id === sourceId);
                    return source ? <SourceCard key={sourceId} answer={viewingAnswer} source={source.source} /> : null;
                  })}
                </article> : null;
              })}<code>{product.id}</code></details>
            </article>)}
          </details> : null}
          {!readOnly && !isViewingHistory && onSaveDossier && route.preparation.documentaryDossier.status === 'available' ? <div className="hv-doc-save-dossier">
            {alreadySaved ? <p className="hv-doc-saved" role="status">Dossier documentaire déjà conservé pour cette réponse et cette voie.</p> : <>
              <label><span>Pourquoi conserver ce dossier ?</span><Textarea value={motiveByRoute[route.id] ?? ''}
                onChange={(event) => setMotiveByRoute((current) => ({ ...current, [route.id]: event.target.value }))}
                placeholder="Motif du choix documentaire, sans le présenter comme une opération." disabled={savingDossier} /></label>
        <button type="button" className="hv-doc-primary" disabled={savingDossier || !!pendingDossierSave || !motiveByRoute[route.id]?.trim()}
                onClick={() => void saveDossier(route)}>Conserver ce dossier documentaire</button>
            </>}
          </div> : null}
        </article>;
      })}</div> : <p className="hv-doc-missing">Aucune voie documentaire n’est fournie; conserve la réponse et ses lacunes.</p>}
    </section>

    {!readOnly && !isViewingHistory && onReinterpret ? <section className="hv-doc-section hv-doc-correction" aria-labelledby="hv-doc-correction-title">
      <div className="hv-doc-section-heading"><div><h3 id="hv-doc-correction-title">Corriger la lecture structurée</h3>
        <p>La question originale reste verbatim. Les changements produisent une nouvelle réponse; cette lecture et ses dossiers restent figés.</p></div>
        {!correctionDraft ? <button type="button" className="hv-doc-secondary" onClick={startCorrection}>Corriger cette lecture</button> : null}
      </div>
      {correctionDraft ? <CorrectionEditor draft={correctionDraft} onChange={setCorrectionDraft} reason={correctionReason}
        onReasonChange={setCorrectionReason} assertionDraft={correctionAssertionDraft} onAssertionDraftChange={setCorrectionAssertionDraft}
        onAddAssertion={addUserAssertion} candidateSearchByNeed={candidateSearchByNeed}
        onCandidateSearchChange={(needId, value) => setCandidateSearchByNeed((current) => ({ ...current, [needId]: value }))}
        candidateBusy={candidateBusy} busy={correcting || candidateBusy || !!pendingDossierSave}
         onChooseCandidates={onChooseCandidates ? (needId) => void chooseCandidates(needId) : undefined}
        answer={viewingAnswer} onCancel={() => { setCorrectionDraft(undefined); setCorrectionError(''); }}
        onSubmit={() => void submitCorrection()} /> : null}
      {correctionError ? <p className="hv-doc-error" role="alert">{correctionError}</p> : null}
    </section> : null}

    {pendingDossierSave ? <p className="hv-doc-pending" role="status">Le dossier reste prêt à enregistrer avec les mêmes références.
      {!readOnly && onSaveDossier ? <button type="button" className="hv-doc-secondary" disabled={savingDossier} onClick={() => void retryDossierSave()}>Réessayer le même dossier</button> : null}
    </p> : null}
    {error ? <p className="hv-doc-error" role="alert">{error}</p> : null}
    {notice ? <p className="hv-doc-notice" role="status">{notice}</p> : null}

    {answerHistory.length ? <section className="hv-doc-section hv-doc-history" aria-labelledby="hv-doc-history-title">
      <div className="hv-doc-section-heading"><div><h3 id="hv-doc-history-title">Réponses antérieures</h3>
        <p>Chaque version garde sa question, interprétation, corpus et références exacts; la relecture ne reconstruit rien.</p></div>
        {isViewingHistory ? <button type="button" className="hv-doc-secondary" onClick={() => setViewedAnswerReference(undefined)}>Retour à la réponse courante</button> : null}
      </div>
      <ul>{answerHistory.map((prior) => <li key={prior.reference}>
        <span>{prior.requestSnapshot.originalQuestion} · {coverageLabel(prior.coverage.status)}</span>
        <details><summary>Références de cette réponse antérieure</summary><code>{prior.reference}</code> · corpus <code>{prior.corpusSnapshot.reference}</code></details>
        {!isViewingHistory || viewingAnswer.reference !== prior.reference ? <button type="button" className="hv-doc-text-button" onClick={() => setViewedAnswerReference(prior.reference)}>Ouvrir en lecture figée</button> : <b>Lecture ouverte</b>}
      </li>)}</ul>
    </section> : null}

    {allDossiers.length ? <section className="hv-doc-section hv-doc-history" aria-labelledby="hv-doc-dossiers-title">
      <div className="hv-doc-section-heading"><div><h3 id="hv-doc-dossiers-title">Dossiers documentaires conservés</h3>
        <p>Un dossier fige une réponse et une voie; il ne réserve pas de matière et ne constitue pas une opération.</p></div></div>
      <ul>{allDossiers.map((dossier) => <li key={dossier.reference}>
        <b>{dossier.answerSnapshot.routes.find((route) => route.id === dossier.routeId)?.title ?? 'Voie documentaire archivée'}</b>
        <span>{dossier.answerSnapshot.requestSnapshot.originalQuestion} · {dossier.createdAt}</span>
        <span>Motif : {dossier.motive}</span>
        <details><summary>Réponse, voie et préparation figées</summary>
          <p>Réponse <code>{dossier.answerReference}</code> · interprétation <code>{dossier.interpretationReference}</code></p>
          <p>Voie <code>{dossier.routeReference}</code> · opération {operationalLabel(dossier.preparation.operational.status)}</p>
          <p>Corpus versionné · <code>{dossier.answerSnapshot.corpusSnapshot.reference}</code></p>
        </details>
      </li>)}</ul>
    </section> : null}
  </section>;
}
