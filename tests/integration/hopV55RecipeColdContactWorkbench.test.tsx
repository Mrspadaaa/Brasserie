// @vitest-environment jsdom
import React from 'react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Recipe } from '../../src/types';
import type { HopV55RecipeColdContactChange } from '../../src/ui/hopV55/RecipeStep';
import { HopV55RecipeColdContactWorkbench } from '../../src/ui/hopV55/RecipeColdContactWorkbench';
import { HopV55RecipeColdContactEvidencePanel } from '../../src/ui/hopV55/RecipeColdContactEvidencePanel';
import { HopV55RecipeColdContactSelection } from '../../src/ui/hopV55/RecipeColdContactSelection';
import type { HopV55RecipeColdContactSourceV1 } from '../../src/services/hopV55/recipeColdContactHost';
import { makeHopV55FixtureContext, createHopV55FixtureServices } from '../../src/services/hopV55/fixtureRuntime';
import { appendHopV55RecipeColdContactAssociation, createHopV55RecipeColdContactAssociationV1, hopV55RecipeColdSourceReference,
  readHopV55RecipeColdContactAssociationV1, type HopV55RecipeColdContactAssociationV1 } from '../../src/services/hopV55/recipeColdContactAssociation';
import { hopV55RecipeApplicationValueReference } from '../../src/services/hopV55/recipeDraftApplication';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { assessQualifiedColdHopContact, assertColdHopContactAssessmentCurrent, bindColdHopProgramContact, HopColdContactError,
  type AssessQualifiedColdHopContactInput } from '../../src/domain/hopDecision/coldIbuContact';
import { createHopColdContactEvidenceV1 } from '../../src/domain/hopDecision/coldContactEvidence';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { HopV55Services } from '../../src/services/hopV55/contracts';
import { adviceAssignment } from '../fixtures/hopAdviceJourney';

const fixtureServicesToClose: HopV55Services[] = [];
afterEach(() => {
  cleanup();
  fixtureServicesToClose.splice(0).forEach(services => services.close());
  vi.restoreAllMocks();
});

type LiveRecipe = { current: Recipe };
type HarnessControls = { setRecipe(recipe: Recipe): void };
type LoadProbe = { armed: boolean; calls: number; target: number; promise: Promise<void>; arm(target: number): void; note(): void };

function createLoadProbe(): LoadProbe {
  let resolve = () => {};
  return {
    armed: false, calls: 0, target: 0, promise: Promise.resolve(),
    arm(target) {
      this.armed = true; this.calls = 0; this.target = target;
      this.promise = new Promise<void>(done => { resolve = done; });
    },
    note() { if (this.armed && ++this.calls >= this.target) { this.armed = false; resolve(); } },
  };
}

function fixtureRecipe(): Recipe {
  const context = makeHopV55FixtureContext('planning');
  if (!context.recipe) throw new Error('La recette synthétique de planning est requise.');
  return structuredClone(context.recipe as Recipe);
}

function recipeContext(live: LiveRecipe) {
  const context = makeHopV55FixtureContext('planning');
  context.recipe = structuredClone(live.current);
  return context;
}

function fixtureServices(live: LiveRecipe, probe: LoadProbe): HopV55Services {
  const namespace = `cold-contact-workbench-${crypto.randomUUID()}`;
  const services = createHopV55FixtureServices(namespace, { mode: 'planning' });
  fixtureServicesToClose.push(services);
  // The fixture service stays the real local V5.5 service. This seam only makes
  // its exact recipe source follow the test's in-memory draft; it touches no
  // user store, network endpoint, or production data.
  services.loadContext = async () => {
    const context = structuredClone(recipeContext(live));
    probe.note();
    return context;
  };
  return services;
}

function WorkbenchHarness({ initial, live, services, onSave, controls }: {
  initial: Recipe;
  live: LiveRecipe;
  services: HopV55Services;
  onSave(change: HopV55RecipeColdContactChange): Promise<void>;
  controls: HarnessControls;
}) {
  const [shown, setShown] = React.useState(initial);
  controls.setRecipe = setShown;
  return <HopV55RecipeColdContactWorkbench services={services} ownerKey={services.ownerKey} draftId={initial.id}
    recipe={shown} workspaceId={null} readRecipe={() => live.current} onConserve={onSave} />;
}

function mountWorkbench(initial = fixtureRecipe()) {
  const live: LiveRecipe = { current: structuredClone(initial) };
  const probe = createLoadProbe();
  const services = fixtureServices(live, probe);
  const controls = {} as HarnessControls;
  const saved: HopV55RecipeColdContactChange[] = [];
  const onSave = vi.fn(async (change: HopV55RecipeColdContactChange) => {
    const current = live.current;
    expect(change.draftId).toBe(current.id);
    expect(change.association.sourceRecipeReference).toBe(hopV55RecipeColdSourceReference(current));
    expect(change.currentSourceBinding).toEqual(change.association.evidenceSnapshot.sourceBinding);
    saved.push(change);
    live.current = { ...current, hopV55ColdEvidenceAssociations:
      appendHopV55RecipeColdContactAssociation(current.hopV55ColdEvidenceAssociations, change.association) };
    controls.setRecipe(live.current);
  });
  const view = render(<WorkbenchHarness initial={initial} live={live} services={services} onSave={onSave} controls={controls} />);
  return { ...view, live, services, controls, saved, onSave, initial, probe };
}

function openWorkbench() {
  fireEvent.click(screen.getByText(/^Référence de contact à froid/));
}

async function chooseColdLine() {
  const selector = await screen.findByLabelText('Programme à examiner');
  await waitFor(() => expect(selector).not.toBeDisabled());
  expect(selector).toHaveValue('');
  expect(screen.queryByRole('checkbox')).toBeNull();
  const sourceOption = Array.from((selector as HTMLSelectElement).options).find(option => option.value !== '');
  expect(sourceOption).toBeDefined();
  fireEvent.change(selector, { target: { value: sourceOption!.value } });

  const context = makeHopV55FixtureContext('planning');
  const program = prepareBrewingScenarioContext(context).runtime.current?.program;
  const addition = program?.additions.find(row => row.use === 'fermentation' || row.use === 'postFermentation');
  if (!program || !addition) throw new Error('La fixture doit porter un contact planifié à froid.');
  const checkbox = await screen.findByRole('checkbox', { name: `Sélectionner ${addition.materialId}` });
  expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);
  fireEvent.change(screen.getByLabelText('Pourquoi ces lignes représentent-elles un même contact ?'), {
    target: { value: 'Ces lignes sont regroupées comme hypothèse documentaire du même contact.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Préparer la référence de contact' }));
  await screen.findByText('Référence préparée; BU cible non calculée');
  return { program, addition };
}

/** Sealed post-fermentation archive built by the real domain and association services for its actual source recipe. */
function postFermentationArchive() {
  const recipe = fixtureRecipe();
  const material: HopDecisionMaterial = { id: 'archive-cold-material', name: 'Matière synthétique archivée', form: 'cone', availableGrams: 1000 };
  const program: HopDecisionProgram = { id: 'archive-cold-program', revision: 1, stage: 'conditioning', volumeL: 20, wortGravity: null,
    additions: [{ id: 'archive-line', materialId: material.id, grams: 58.6, use: 'postFermentation', status: 'planned',
      contactHours: 24, temperatureC: 14, dayOffset: 8 }] };
  const contact = bindColdHopProgramContact({ program, contactId: 'archive-contact', additionIds: ['archive-line'],
    grouping: { kind: 'singleHomogeneousContact', origin: 'userDeclaration', reason: 'Contact unique déclaré pour l’archive synthétique.' } });
  const assessment = assessQualifiedColdHopContact({ program, contact, qualificationInput: { variants: [adviceAssignment(material)] } });
  const evidence = createHopColdContactEvidenceV1({ assessment, ownerKey: 'archive-owner', scopeReference: 'archive-scope' });
  const created = createHopV55RecipeColdContactAssociationV1({ id: 'archive-association', ownerKey: 'archive-owner', recipeId: recipe.id,
    sourceRecipeReference: hopV55RecipeColdSourceReference(recipe), evidence, origin: { kind: 'localCalculation' },
    applicationRecord: null, applicationWitness: null, recordedAt: '2026-10-06T00:00:00.000Z' });
  if (created.status !== 'ready') throw new Error(`Archive synthétique refusée : ${created.status}`);
  return { association: created.association, recipe };
}

function decodedExport(anchor: HTMLAnchorElement): unknown {
  const href = anchor.getAttribute('href');
  if (!href?.startsWith('data:application/json;charset=utf-8,')) throw new Error('Export JSON embarqué attendu.');
  return JSON.parse(decodeURIComponent(href.slice(href.indexOf(',') + 1)));
}

const PROTOCOL = 'Protocole, source et limites';
const EXACT_REFERENCES = 'Origine et références exactes';
const CONSERVE = 'Conserver cette preuve avec la recette';
const SEALED_EMPLOYMENT_REASON = 'L’emploi déclaré situe le scénario; il ne prouve pas une opération déjà effectuée.';
const SHOWN_EMPLOYMENT_REASON = 'Le moment d’usage déclaré situe le scénario; il ne prouve pas une opération déjà effectuée.';
const SEALED_STATUS_LIMITATION = 'Les statuts planned/performed restent ceux de l’entrée; la courbe ne simule aucune exécution.';
const SHOWN_STATUS_LIMITATION = 'Les statuts prévu/effectué restent ceux de l’entrée; la courbe ne simule aucune exécution.';
const UNKNOWN_CONTEXT_REASONS = ['Base du volume', 'Teneur en alcool', 'Filtration avant contact', 'Traitement de la levure',
  'Mode de contact', 'Préparation de la matière', 'Description de la bière'].map(label => `${label} : donnée inconnue, non renseignée ou non résolue.`);

/** Delivered snapshots sealed by the original pre-A1 services; read as files and never regenerated by the current evaluator. */
const PRE_A1_SNAPSHOTS = {
  transfer: { file: 'public-history/hop-cold-contact-pre-a1-v1.json', sha256: '33903e22b40e8f4c7908007d612972333c609516c67b7b39d9d64a6fe936d936' },
  composite: { file: 'public-history/hop-cold-contact-composite-pre-a1-v1.json', sha256: 'f2512842aef3a3465e9abfebd29bc2025be3ab723ab72ccb9f7b34c6c3891373' },
} as const;
const fixturesDirectory = resolvePath(dirname(fileURLToPath(import.meta.url)), '../fixtures');

function readPreA1Snapshot(kind: keyof typeof PRE_A1_SNAPSHOTS) {
  const { file, sha256 } = PRE_A1_SNAPSHOTS[kind];
  const path = resolvePath(fixturesDirectory, file);
  const bytes = readFileSync(path);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha256);
  const text = bytes.toString('utf8');
  return { path, bytes, text, association: JSON.parse(text) as HopV55RecipeColdContactAssociationV1 };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as object).forEach(deepFreeze);
  }
  return value;
}

/** Host-owned historical entry; the frozen snapshot makes any write during rendering throw. */
function renderHistorical(association: HopV55RecipeColdContactAssociationV1, reason: string) {
  const onConserve = vi.fn();
  const { container } = render(<HopV55RecipeColdContactEvidencePanel
    entry={{ status: 'historical', association: deepFreeze(association), reason }} onConserve={onConserve} disabled />);
  return { panel: container.querySelector('section')!, onConserve };
}

function panelDetails(panel: Element, summary: string): HTMLDetailsElement {
  const found = Array.from(panel.querySelectorAll('details')).find(node => node.querySelector('summary')?.textContent === summary);
  if (!found) throw new Error(`Section « ${summary} » attendue.`);
  return found;
}

function openSection(panel: Element, summary: string): HTMLDetailsElement {
  const section = panelDetails(panel, summary);
  expect(section.open).toBe(false);
  fireEvent.click(section.querySelector('summary')!);
  expect(section.open).toBe(true);
  return section;
}

/** Brewer-facing prose: the panel without its exact-reference zone, whose canonical values stay verbatim. */
function proseText(panel: Element): string {
  const copy = panel.cloneNode(true) as Element;
  panelDetails(copy, EXACT_REFERENCES).remove();
  return copy.textContent ?? '';
}

const conditionText = (panel: Element, property: string) => panel.querySelector(`li[data-property="${property}"]`)?.textContent ?? '';

function transferReasons(panel: Element): string[] {
  const transfer = Array.from(panel.querySelectorAll('p')).find(node => node.textContent?.startsWith('Transfert à la bière ·'));
  return Array.from(transfer?.nextElementSibling?.querySelectorAll('li') ?? [], item => item.textContent ?? '');
}

const exactWordings = (panel: Element) => Array.from(
  panel.querySelectorAll('ul[aria-label="Formulation exacte de l’instantané"] code'), node => node.textContent ?? '');

type ComparedSnapshot = { evidenceSnapshot: { assessment: { domainComparisons: Array<{ property: string }> } } };

/** Recognized structured keys stay in data attributes, JSON and exact references, never in the prose. */
function expectNoTechnicalKeys(prose: string, association: ComparedSnapshot) {
  const keys = [...association.evidenceSnapshot.assessment.domainComparisons.map(row => row.property),
    'postFermentation', 'contactHours', 'temperatureC', 'dayOffset', 'planned', 'performed'];
  expect(keys.filter(key => prose.includes(key))).toEqual([]);
}

function expectExactReferences(panel: Element, association: HopV55RecipeColdContactAssociationV1) {
  const zone = panelDetails(panel, EXACT_REFERENCES).textContent ?? '';
  const binding = association.evidenceSnapshot.sourceBinding;
  for (const value of [association.recipeId, hopV55RecipeApplicationValueReference('sourceRecipe', association.sourceRecipeReference),
    association.evidenceReference, binding.programReference, binding.contactReference, binding.qualificationReference,
    binding.contextReference, binding.scopeReference, binding.ownerKey, association.reference, association.recordedAt]) {
    expect(zone).toContain(value);
  }
}

/** Explicit evaluation freshness: a deliberate recalculation, distinct from archive reading and from source freshness. */
function assessmentFreshnessFailure(association: HopV55RecipeColdContactAssociationV1): unknown {
  const assessment = structuredClone(association.evidenceSnapshot.assessment);
  const { program, contact, qualificationInput, context } = assessment.inputSnapshot;
  const input: AssessQualifiedColdHopContactInput = { program, contact, qualificationInput, ...(context ? { context } : {}) };
  try {
    assertColdHopContactAssessmentCurrent(assessment, input);
    return null;
  } catch (error) {
    return error;
  }
}

function expectStaleAssessment(association: HopV55RecipeColdContactAssociationV1) {
  const failure = assessmentFreshnessFailure(association);
  expect(failure).toBeInstanceOf(HopColdContactError);
  expect((failure as HopColdContactError).code).toBe('staleAssessment');
}

function expectReadOnly(association: HopV55RecipeColdContactAssociationV1) {
  const read = readHopV55RecipeColdContactAssociationV1(association);
  expect(read).toMatchObject({ status: 'readOnly', applicationLink: { status: 'notApplicable' } });
  if (read.status !== 'readOnly') throw new Error('Lecture archivistique attendue.');
  expect(read.association).toEqual(association);
}

describe('workbench réel de contact à froid · recette locale', () => {
  it('part sans source ni ligne choisies, prépare la source canonique et transmet une preuve complète sans application', async () => {
    const mounted = mountWorkbench();
    openWorkbench();
    const { program, addition } = await chooseColdLine();

    const sourceReference = hopV55RecipeColdSourceReference(mounted.initial);
    expect(mounted.saved).toHaveLength(0);
    expect(mounted.live.current).toEqual(mounted.initial);
    const proposedExport = screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement;
    const exported = decodedExport(proposedExport) as Record<string, any>;
    expect(exported.evidenceReference).toBe(exported.evidenceSnapshot.reference);
    expect(exported.reference).toEqual(expect.any(String));
    expect(exported.evidenceSnapshot.assessment.limitations.length).toBeGreaterThan(0);
    expect(exported.evidenceSnapshot.protocolSupplement.hopStorage).toBeDefined();
    expect(exported.evidenceSnapshot.assessment.inputSnapshot.contact.grouping.reason)
      .toBe('Ces lignes sont regroupées comme hypothèse documentaire du même contact.');
    expect(exported.evidenceSnapshot.assessment.inputSnapshot.contact.additionIds).toContain(addition.id);
    expect(exported).toMatchObject({
      ownerKey: mounted.services.ownerKey,
      recipeId: mounted.initial.id,
      sourceRecipeReference: sourceReference,
      origin: { kind: 'localCalculation' },
      applicationRecordReference: null,
      applicationWitness: null,
      evidenceSnapshot: {
        sourceBinding: { programReference: programFingerprint(program) },
        assessment: { inputSnapshot: { program: { additions: expect.arrayContaining([
          expect.objectContaining({ id: addition.id, materialId: addition.materialId, grams: addition.grams }),
        ]) } }, targetAssessment: { valueBU: null }, limitations: expect.any(Array) },
      },
    });
    const read = readHopV55RecipeColdContactAssociationV1(exported);
    expect(read).toMatchObject({ status: 'readOnly', applicationLink: { status: 'notApplicable' } });

    // Fixture: dry hop declared during fermentation, and this workbench passes no beer context.
    const comparisons = exported.evidenceSnapshot.assessment.domainComparisons as Array<{ property: string; status: string }>;
    const statusOf = (property: string) => comparisons.find(row => row.property === property)?.status;
    expect(statusOf('employment')).toBe('different');
    expect(statusOf('abvPct')).toBe('unknown');
    const transfer = screen.getByText(/^Transfert à la bière ·/u);
    const renderedReasons = Array.from(transfer.nextElementSibling?.querySelectorAll('li') ?? [], item => item.textContent ?? '');
    const usage = renderedReasons.filter(text => text.startsWith('Moment d’usage :'));
    const alcohol = renderedReasons.filter(text => text.startsWith('Teneur en alcool :'));
    expect(usage).toEqual([expect.stringMatching(/après la fermentation/u)]);
    expect(usage[0]).not.toMatch(/inconnue/u);
    expect(alcohol).toEqual([expect.stringMatching(/donnée inconnue/u)]);
    expect(alcohol[0]).not.toMatch(/écart|\d/u);
    const proposedPanel = transfer.closest('section')!;
    const prose = proseText(proposedPanel);
    expect(prose).not.toBe('');
    for (const { property } of comparisons) expect(prose).not.toContain(property);
    expectNoTechnicalKeys(prose, exported as ComparedSnapshot);
    expect(proposedPanel).toHaveTextContent('moment d’usage déclaré : pendant la fermentation');
    expect(prose).not.toMatch(/ · (?:fermentation|postFermentation) · |postFermentation/u);
    expect(conditionText(proposedPanel, 'employment'))
      .toMatch(/^Moment d’usage · Écart au protocole publié · déclaré : pendant la fermentation · publié : après la fermentation · /u);
    expect(conditionText(proposedPanel, 'employment').endsWith(SHOWN_EMPLOYMENT_REASON)).toBe(true);
    expect(conditionText(proposedPanel, 'reportedMeanTemperatures')).toContain('moyennes observées publiées : 13,3–15 °C');
    expect(conditionText(proposedPanel, 'abvPct')).toMatch(/^Teneur en alcool · Donnée inconnue · publié : 4,75 % vol\. · /u);
    expect(conditionText(proposedPanel, 'abvPct')).not.toMatch(/déclaré :/u);
    // Canonical values stay verbatim in their own zone, even when they carry structured identifiers.
    expect(panelDetails(proposedPanel, EXACT_REFERENCES).textContent).toContain(exported.evidenceSnapshot.sourceBinding.programReference);

    fireEvent.click(screen.getByRole('button', { name: CONSERVE }));
    await waitFor(() => expect(mounted.onSave).toHaveBeenCalledTimes(1));
    expect(mounted.saved[0].association).toEqual(exported);
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toEqual([exported]);
    expect(mounted.live.current.hops).toEqual(mounted.initial.hops);
    expect(mounted.live.current.ibuTarget).toBe(mounted.initial.ibuTarget);
    expect(mounted.live.current.hopPredictionIds).toEqual(mounted.initial.hopPredictionIds);
    expect(mounted.live.current.hopTrialId).toEqual(mounted.initial.hopTrialId);

    // Reading the conserved archive shows the same wording and leaves its JSON, seals and identifiers untouched.
    const archived = (await screen.findByText('Source actuelle vérifiée')).closest('section')!;
    expect(archived).toHaveTextContent('moment d’usage déclaré : pendant la fermentation');
    expect(conditionText(archived, 'employment')).toMatch(/^Moment d’usage · Écart au protocole publié · /u);
    expect(decodedExport(screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement)).toEqual(exported);
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toEqual([exported]);
    expect(exported.evidenceSnapshot.assessment.programBinding.selectedAdditions.map((row: { use: string }) => row.use)).toEqual(['fermentation']);
  });

  it('#75 : la dose de la référence suit la règle unique, avec sa coordonnée exacte et des unités insécables', async () => {
    mountWorkbench();
    openWorkbench();
    await chooseColdLine();
    const valueOf = (term: string) => screen.getByText(term).nextElementSibling?.textContent ?? '';
    // At most 3 decimals, then the sealed exact coordinate; number and unit never split at 390 px.
    expect(valueOf('Dose dans la référence')).toMatch(/^\d+(,\d{1,3})?\u00a0g\/h?L \(\d+(\/\d+)?\u00a0g\/hL exacts\)$/u);
    expect(valueOf('BU de référence')).not.toMatch(/\d (BU|EBC|IBU)/u);
    expect(valueOf('Masse totale')).not.toMatch(/\d g\b/u);
  });

  it('rend une archive après fermentation en français sans réécrire son JSON, ses sceaux ni ses identifiants', () => {
    const { association, recipe } = postFermentationArchive();
    const sealedJson = JSON.stringify(association);
    expect(association.recipeId).toBe(recipe.id);
    expect(association.sourceRecipeReference).toBe(hopV55RecipeColdSourceReference(recipe));
    expect(JSON.parse(association.sourceRecipeReference)).toMatchObject({ id: association.recipeId });
    expectReadOnly(association);
    // A snapshot sealed with the current wording passes the explicit recalculation; reading never depends on it.
    expect(assessmentFreshnessFailure(association)).toBeNull();

    const { panel, onConserve } = renderHistorical(association, 'Archive synthétique relue.');
    openSection(panel, PROTOCOL);
    openSection(panel, EXACT_REFERENCES);
    const prose = proseText(panel);
    expect(panel).toHaveTextContent('moment d’usage déclaré : après la fermentation · prévu');
    expectNoTechnicalKeys(prose, association);
    expect(conditionText(panel, 'employment'))
      .toBe(`Moment d’usage · Coordonnées comparables · déclaré : après la fermentation · publié : après la fermentation · ${SHOWN_EMPLOYMENT_REASON}`);
    expect(prose).not.toContain('L’emploi déclaré');
    expect(prose).toContain(SHOWN_STATUS_LIMITATION);
    expect(conditionText(panel, 'contactMode')).toMatch(/^Mode de contact · Donnée inconnue · publié : statique · /u);
    // Current-wording reasons are shown exactly as sealed.
    expect(transferReasons(panel)).toEqual(association.evidenceSnapshot.assessment.targetAssessment.reasons);
    expect(exactWordings(panel)).toEqual([SEALED_STATUS_LIMITATION, SEALED_EMPLOYMENT_REASON]);
    // The canonical program reference keeps its exact value, structured `postFermentation` use included.
    expect(association.evidenceSnapshot.sourceBinding.programReference).toContain('"use":"postFermentation"');
    expectExactReferences(panel, association);

    expect(JSON.stringify(association)).toBe(sealedJson);
    expect(association.evidenceSnapshot.assessment.programBinding.selectedAdditions[0].use).toBe('postFermentation');
    expect(association.evidenceSnapshot.assessment.domainComparisons.map(row => row.property)).toContain('employment');
    expect(onConserve).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: CONSERVE })).toBeNull();
  });

  it('relit une enveloppe pré-A1 scellée telle quelle et présente ses anciennes raisons en français sans réévaluation', () => {
    const snapshot = readPreA1Snapshot('transfer');
    const archived = snapshot.association;
    const assessment = archived.evidenceSnapshot.assessment;
    const sealedReasons = assessment.targetAssessment.reasons;
    // Original archive content: technical wording inside the sealed assessment, coherent recipe identity.
    expect(sealedReasons).toContain('employment diffère de la référence publiée.');
    expect(sealedReasons).toContain('abvPct n’est pas renseigné ou résolu.');
    expect(assessment.limitations).toContain(SEALED_STATUS_LIMITATION);
    expect(assessment.domainComparisons.find(row => row.property === 'employment')?.reason).toBe(SEALED_EMPLOYMENT_REASON);
    expect(JSON.parse(archived.sourceRecipeReference)).toMatchObject({ id: archived.recipeId });
    expectReadOnly(archived);
    expectStaleAssessment(archived);

    const { panel, onConserve } = renderHistorical(archived, 'Instantané pré-A1 relu.');
    expect(panel).toHaveTextContent('Historique · source actuelle non vérifiée');
    expect(panel).toHaveTextContent('moment d’usage déclaré : pendant la fermentation · prévu · 58,6 g · 48 h · 19 °C');
    const protocol = openSection(panel, PROTOCOL);
    openSection(panel, EXACT_REFERENCES);
    expect(protocol).toHaveTextContent('Transfert à la bière · conditions différentes');
    expect(transferReasons(panel)).toEqual([
      'Moment d’usage : écart au protocole publié (déclaré : pendant la fermentation; publié : après la fermentation).',
      'Durée de contact : écart au protocole publié (déclaré : 48 h; publié : 24 h).',
      'Température du contact : écart au protocole publié (déclaré : 19 °C; moyennes observées publiées : 13,3–15 °C).',
      ...UNKNOWN_CONTEXT_REASONS,
      sealedReasons[sealedReasons.length - 1],
    ]);
    expect(conditionText(panel, 'employment'))
      .toBe(`Moment d’usage · Écart au protocole publié · déclaré : pendant la fermentation · publié : après la fermentation · ${SHOWN_EMPLOYMENT_REASON}`);
    const prose = proseText(panel);
    expectNoTechnicalKeys(prose, archived);
    expect(prose).not.toContain('L’emploi déclaré');
    expect(prose).toContain(SHOWN_STATUS_LIMITATION);
    expect(protocol).toHaveTextContent('Présentation actuelle · 12 textes de l’instantané sont formulés ici en français');
    expect(protocol).toHaveTextContent('ce n’est pas une nouvelle évaluation');

    // The original wording stays reachable verbatim, apart from the prose, with every exact reference.
    expect(exactWordings(panel)).toEqual([...sealedReasons.slice(0, -1), SEALED_STATUS_LIMITATION, SEALED_EMPLOYMENT_REASON]);
    expectExactReferences(panel, archived);

    // Reading wrote nothing: same object, same file bytes, no conservation.
    expect(JSON.stringify(archived)).toBe(JSON.stringify(JSON.parse(snapshot.text)));
    expect(readFileSync(snapshot.path).equals(snapshot.bytes)).toBe(true);
    expect(onConserve).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: CONSERVE })).toBeNull();
  });

  it('relit un contact composite pré-A1 en nommant les propriétés qui diffèrent, sans fusion ni réécriture', () => {
    const snapshot = readPreA1Snapshot('composite');
    const archived = snapshot.association;
    const assessment = archived.evidenceSnapshot.assessment;
    const sealedReasons = assessment.targetAssessment.reasons;
    const lines = assessment.programBinding.selectedAdditions;
    // Property invariants of the conserved lines, independent of fixture names.
    expect(assessment.programBinding.status).toBe('unsupportedCompositeContact');
    expect(new Set(lines.map(row => row.contactHours)).size).toBe(2);
    expect(new Set(lines.map(row => row.temperatureC)).size).toBe(2);
    expect(new Set(lines.map(row => row.use)).size).toBe(1);
    expect(new Set(lines.map(row => row.status)).size).toBe(1);
    expect(assessment.programBinding.compositeReasons).toEqual([
      'Les lignes diffèrent sur contactHours; aucune fusion en un contact unique n’est établie.',
      'Les lignes diffèrent sur temperatureC; aucune fusion en un contact unique n’est établie.',
    ]);
    expect(JSON.parse(archived.sourceRecipeReference)).toMatchObject({ id: archived.recipeId });
    expectReadOnly(archived);
    expectStaleAssessment(archived);

    const { panel, onConserve } = renderHistorical(archived, 'Instantané composite pré-A1 relu.');
    expect(panel).toHaveTextContent('Contact composite non assimilé à une ligne unique');
    expect(panel).toHaveTextContent('après la fermentation · prévu · 30 g · 24 h · 14 °C');
    expect(panel).toHaveTextContent('après la fermentation · prévu · 28,6 g · 48 h · 19 °C');
    const protocol = openSection(panel, PROTOCOL);
    openSection(panel, EXACT_REFERENCES);
    expect(protocol).toHaveTextContent('Transfert à la bière · conditions différentes');
    expect(transferReasons(panel)).toEqual([
      'Les lignes diffèrent sur la durée de contact; aucune fusion en un contact unique n’est établie.',
      'Les lignes diffèrent sur la température déclarée; aucune fusion en un contact unique n’est établie.',
      'Durée de contact : écart au protocole publié (déclaré : 24 h, 48 h; publié : 24 h).',
      'Température du contact : écart au protocole publié (déclaré : 14 °C, 19 °C; moyennes observées publiées : 13,3–15 °C).',
      ...UNKNOWN_CONTEXT_REASONS,
      sealedReasons[sealedReasons.length - 1],
    ]);
    expect(conditionText(panel, 'durationHours')).toMatch(/^Durée de contact · Écart au protocole publié · déclaré : 24 h, 48 h · publié : 24 h · /u);
    expect(conditionText(panel, 'reportedMeanTemperatures'))
      .toMatch(/^Température du contact · Écart au protocole publié · déclaré : 14 °C, 19 °C · moyennes observées publiées : 13,3–15 °C · /u);
    expect(conditionText(panel, 'employment'))
      .toBe(`Moment d’usage · Coordonnées comparables · déclaré : après la fermentation · publié : après la fermentation · ${SHOWN_EMPLOYMENT_REASON}`);
    const prose = proseText(panel);
    expectNoTechnicalKeys(prose, archived);
    expect(prose).not.toContain('L’emploi déclaré');
    expect(protocol).toHaveTextContent('Présentation actuelle · 13 textes de l’instantané sont formulés ici en français');

    expect(exactWordings(panel)).toEqual([...sealedReasons.slice(0, -1), SEALED_STATUS_LIMITATION, SEALED_EMPLOYMENT_REASON]);
    expectExactReferences(panel, archived);

    expect(JSON.stringify(archived)).toBe(JSON.stringify(JSON.parse(snapshot.text)));
    expect(readFileSync(snapshot.path).equals(snapshot.bytes)).toBe(true);
    expect(onConserve).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: CONSERVE })).toBeNull();
  });

  it('refuse une conservation si la masse change pendant la relecture, puis retire la proposition périmée', async () => {
    const mounted = mountWorkbench();
    openWorkbench();
    await chooseColdLine();
    const changed = structuredClone(mounted.initial);
    changed.hops[1].weightG += 1;
    // Simulate an external wizard update between prepare and conserve while
    // keeping the mounted proposal visible until the next render.
    mounted.live.current = changed;
    fireEvent.click(screen.getByRole('button', { name: CONSERVE }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/génération de contexte a changé|Les sources ont changé|brouillon a changé/u);
    expect(mounted.onSave).not.toHaveBeenCalled();
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toBeUndefined();

    act(() => mounted.controls.setRecipe(changed));
    await waitFor(() => expect(screen.queryByRole('button', { name: CONSERVE })).toBeNull());
    expect(mounted.live.current.hops).toEqual(changed.hops);
    expect(mounted.live.current.ibuTarget).toBe(mounted.initial.ibuTarget);
  });

  it('relit A comme historique après changement de masse en B, en gardant son instantané et son export', async () => {
    const mounted = mountWorkbench();
    openWorkbench();
    const { addition } = await chooseColdLine();
    const proposed = decodedExport(screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement) as any;
    const oldMass = addition.grams;
    fireEvent.click(screen.getByRole('button', { name: CONSERVE }));
    await waitFor(() => expect(mounted.onSave).toHaveBeenCalledTimes(1));
    await screen.findByText(/Source actuelle vérifiée/u);

    const recipeB = structuredClone(mounted.live.current);
    recipeB.hops[1].weightG += 2;
    const oldAssociation = structuredClone(proposed);
    mounted.probe.arm(4);
    act(() => {
      mounted.live.current = recipeB;
      mounted.controls.setRecipe(recipeB);
    });
    await mounted.probe.promise;
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await screen.findByText(/Historique · source actuelle non vérifiée/u);
    const historicalExport = screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement;
    expect(decodedExport(historicalExport)).toEqual(oldAssociation);
    const sourceAddition = oldAssociation.evidenceSnapshot.assessment.inputSnapshot.program.additions
      .find((row: { id: string }) => row.id === addition.id);
    expect(sourceAddition.grams).toBe(oldMass);
    expect(oldAssociation.evidenceSnapshot.sourceBinding.programReference).toBe(proposed.evidenceSnapshot.sourceBinding.programReference);
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toEqual([oldAssociation]);
    expect(mounted.live.current.hops[1].weightG).toBe(recipeB.hops[1].weightG);
    expect(mounted.live.current.ibuTarget).toBe(mounted.initial.ibuTarget);
  });

  it('nomme en français les écarts de source d’une preuve devenue historique, sans clé interne, et garde les clés exactes hors de la prose', async () => {
    const mounted = mountWorkbench();
    openWorkbench();
    await chooseColdLine();
    const proposed = decodedExport(screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement);
    fireEvent.click(screen.getByRole('button', { name: CONSERVE }));
    await waitFor(() => expect(mounted.onSave).toHaveBeenCalledTimes(1));
    await screen.findByText(/Source actuelle vérifiée/u);

    // Same recipe, same program: only the catalogue facts behind the qualification change.
    mounted.services.loadContext = async () => {
      const context = structuredClone(recipeContext(mounted.live));
      context.hopIndex!.varieties = context.hopIndex!.varieties.map(variety => variety.id === 'hop-v55-fixture-identity-b'
        ? { ...variety, aliases: ['Variante de fixture B relue'] } : variety);
      return context;
    };
    // Close then reopen the journal: the reading runs again against the changed catalogue.
    const summary = mounted.container.querySelector('.recipe-hop-v55-cold > summary')!;
    fireEvent.click(summary);
    await waitFor(() => expect(mounted.container.querySelector('.recipe-hop-v55-cold > div')).toBeNull());
    fireEvent.click(summary);
    await screen.findByText(/Historique · source actuelle non vérifiée/u);

    const status = screen.getByText(/Cette preuve reste liée à son ancien instantané/u);
    const prose = status.textContent ?? '';
    expect(prose).toMatch(/Écarts avec la source actuelle : [^.]*qualification des matières/u);
    expect(prose).not.toMatch(/(?:evidence|application)\.[A-Za-z]|Reference\b|ownerKey|recipeId|Références différentes/u);
    expect(status.getAttribute('data-mismatches')).toContain('evidence.qualificationReference');
    expect(decodedExport(screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement)).toEqual(proposed);
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toEqual([proposed]);
  });

  it('#40 : ne propose pas une ligne d’ébullition comme contact à froid et nomme la vraie raison', async () => {
    mountWorkbench();
    openWorkbench();
    const selector = await screen.findByLabelText('Programme à examiner');
    await waitFor(() => expect(selector).not.toBeDisabled());
    const sourceOption = Array.from((selector as HTMLSelectElement).options).find(option => option.value !== '');
    fireEvent.change(selector, { target: { value: sourceOption!.value } });
    const program = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning')).runtime.current?.program;
    const hot = program?.additions.find(row => row.use === 'boil');
    const cold = program?.additions.find(row => row.use === 'fermentation' || row.use === 'postFermentation');
    if (!hot || !cold) throw new Error('La fixture doit porter une ligne d’ébullition et une ligne à froid.');
    await screen.findByRole('checkbox', { name: `Sélectionner ${cold.materialId}` });
    expect(screen.queryByRole('checkbox', { name: `Sélectionner ${hot.materialId}` })).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    const section = screen.getByRole('region', { name: 'Sélection du contact à froid' });
    expect(section).toHaveTextContent(/Identité fictive A · ébullition : pas un contact à froid/u);
    // Visible prose names the material and its moment, never internal keys, forms or IDs.
    expect(section.textContent).not.toMatch(/forme unknown|durée inconnu\b|température inconnu\b|ID matière|ID de ligne|J5/u);
  });

  it('#40 : relit une preuve déjà conservée sur une ligne d’ébullition sans la réécrire, avec le vrai motif', () => {
    const recipe = fixtureRecipe();
    const material: HopDecisionMaterial = { id: 'archive-hot-material', name: 'Matière chaude archivée', form: 'cone', availableGrams: 1000 };
    const program: HopDecisionProgram = { id: 'archive-hot-program', revision: 1, stage: 'planning', volumeL: 20, wortGravity: null,
      additions: [{ id: 'archive-hot-line', materialId: material.id, grams: 30, use: 'boil', status: 'planned', boilMinutes: 60 }] };
    const contact = bindColdHopProgramContact({ program, contactId: 'archive-hot-contact', additionIds: ['archive-hot-line'],
      grouping: { kind: 'singleHomogeneousContact', origin: 'userDeclaration', reason: 'Ligne choisie avant le correctif #40.' } });
    const assessment = assessQualifiedColdHopContact({ program, contact, qualificationInput: { variants: [adviceAssignment(material)] } });
    const evidence = createHopColdContactEvidenceV1({ assessment, ownerKey: 'archive-owner', scopeReference: 'archive-scope' });
    const created = createHopV55RecipeColdContactAssociationV1({ id: 'archive-hot-association', ownerKey: 'archive-owner', recipeId: recipe.id,
      sourceRecipeReference: hopV55RecipeColdSourceReference(recipe), evidence, origin: { kind: 'localCalculation' },
      applicationRecord: null, applicationWitness: null, recordedAt: '2026-10-12T00:00:00.000Z' });
    if (created.status !== 'ready') throw new Error(`Archive chaude refusée : ${created.status}`);
    const before = JSON.stringify(created.association);
    const { panel } = renderHistorical(created.association, 'Source relue.');
    expect(panel).toHaveTextContent(/ébullition : pas un contact à froid/u);
    expect(panel).not.toHaveTextContent('Contact composite non assimilé à une ligne unique');
    expect(JSON.stringify(created.association)).toBe(before);
    expectReadOnly(created.association);
  });

  it('REV-WIZ M7 : nomme en français les écarts d’une source périmée et garde les clés exactes hors de la prose', async () => {
    const source: HopV55RecipeColdContactSourceV1 = { key: 'source:stale', reference: 'source-reference:stale', kind: 'currentProgram',
      label: 'Programme courant · Brouillon synthétique', scopeReference: 'scope:stale', programReference: 'program:stale',
      program: { id: 'program:stale', revision: 1, stage: 'planning', volumeL: 20, wortGravity: null,
        additions: [{ id: 'stale-line', materialId: 'stale-material', grams: 40, use: 'fermentation', status: 'planned', contactHours: 48, temperatureC: 19 }] },
      materials: [{ id: 'stale-material', name: 'Cascade synthétique', form: 'pellet' }], contextReference: 'context:stale', coldContext: null };
    const host = { readSources: async () => ({ status: 'ready' as const, generation: 1, sources: [source], notices: [] }),
      prepare: async () => ({ status: 'prepared' as const, source,
        result: { status: 'staleSource' as const, mismatches: ['programReference', 'qualificationReference', 'scope', 'programContent'] } }) };
    render(<HopV55RecipeColdContactSelection host={host as never} onPrepared={vi.fn()} />);
    const selector = await screen.findByLabelText('Programme à examiner');
    fireEvent.change(selector, { target: { value: source.key } });
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Sélectionner stale-material' }));
    fireEvent.change(screen.getByLabelText('Pourquoi ces lignes représentent-elles un même contact ?'), { target: { value: 'Un seul contact.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer la référence de contact' }));
    const alert = await screen.findByText('Source périmée');
    const block = alert.closest('[role="alert"]')!;
    expect(block.textContent).toMatch(/programme de houblonnage/u);
    expect(block.textContent).toMatch(/qualification des matières/u);
    expect(block.textContent).not.toMatch(/programReference|qualificationReference|programContent|\bscope\b/u);
    expect(block.querySelector('[data-mismatches]')?.getAttribute('data-mismatches')).toBe('programReference qualificationReference scope programContent');
  });

  it('REV-WIZ M1 : nomme « contenu du brouillon d’origine » quand seule la levure a changé, programme intact', async () => {
    const mounted = mountWorkbench();
    openWorkbench();
    await chooseColdLine();
    const proposed = decodedExport(screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement);
    fireEvent.click(screen.getByRole('button', { name: CONSERVE }));
    await waitFor(() => expect(mounted.onSave).toHaveBeenCalledTimes(1));
    await screen.findByText(/Source actuelle vérifiée/u);

    const renamed = structuredClone(mounted.live.current);
    renamed.yeast = { ...renamed.yeast, name: `${renamed.yeast.name} renommée` };
    act(() => { mounted.live.current = renamed; mounted.controls.setRecipe(renamed); });
    await screen.findByText(/Historique · source actuelle non vérifiée/u);
    const status = screen.getByText(/Cette preuve reste liée à son ancien instantané/u);
    expect(status.textContent).toMatch(/Écarts avec la source actuelle : contenu du brouillon d’origine\./u);
    expect(status.textContent).not.toMatch(/Le programme d’origine ne correspond plus/u);
    expect(status.getAttribute('data-mismatches')).toContain('sourceRecipeReference');
    expect(decodedExport(screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement)).toEqual(proposed);
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toEqual([proposed]);
  });

  it('REV-WIZ M2 : relit une preuve règle 1 dès qu’un champ non ensemencé de la levure change, sans attendre la réouverture', async () => {
    const mounted = mountWorkbench();
    openWorkbench();
    await chooseColdLine();
    const proposed = decodedExport(screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement) as HopV55RecipeColdContactAssociationV1;
    // A proof sealed before decision n°22 (rule 1): the whole recipe except the journal.
    const { hopV55ColdEvidenceAssociations: _journal, ...whole } = mounted.live.current;
    const ruleOne = createHopV55RecipeColdContactAssociationV1({ id: 'rule-one-cold-proof', ownerKey: mounted.services.ownerKey,
      recipeId: mounted.initial.id, sourceRecipeReference: hopDecisionReference(whole), evidence: proposed.evidenceSnapshot,
      origin: { kind: 'localCalculation' }, applicationRecord: null, applicationWitness: null, recordedAt: '2026-10-08T00:00:00.000Z' });
    if (ruleOne.status !== 'ready') throw new Error(`Preuve règle 1 attendue : ${ruleOne.status}`);
    const withRuleOne = { ...mounted.live.current, hopV55ColdEvidenceAssociations: [ruleOne.association] };
    act(() => { mounted.live.current = withRuleOne; mounted.controls.setRecipe(withRuleOne); });
    // The journal reading re-prepares the source (catalogue and assessment): allow it the same time as a real reopening.
    await screen.findByText('Source actuelle vérifiée', {}, { timeout: 8000, interval: 1000 });

    // The Lots/COA editor of the same step changes only the yeast reference: rule 2 is unchanged, rule 1 is not.
    const relinked = { ...withRuleOne, yeast: { ...withRuleOne.yeast, hopIndexId: 'autre-culture-de-reference' } };
    act(() => { mounted.live.current = relinked; mounted.controls.setRecipe(relinked); });
    await screen.findByText(/Historique · source actuelle non vérifiée/u, {}, { timeout: 8000, interval: 1000 });
    expect(screen.queryByText('Source actuelle vérifiée')).toBeNull();
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toEqual([ruleOne.association]);
  });

  it('exporte sans réécriture une enveloppe de journal froide d’un format futur', async () => {
    const future = { format: 'hop-v55-recipe-cold-evidence-association-v99', id: 'future:cold-proof', raw: { keep: ['as-is'] } };
    const initial = fixtureRecipe();
    initial.hopV55ColdEvidenceAssociations = [future];
    const mounted = mountWorkbench(initial);
    openWorkbench();
    await screen.findByText('Format futur · lecture seule');
    const futureExport = screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement;
    expect(decodedExport(futureExport)).toEqual(future);
    expect(mounted.live.current.hopV55ColdEvidenceAssociations).toEqual([future]);
    expect(mounted.live.current.hops).toEqual(initial.hops);
    expect(mounted.live.current.ibuTarget).toBe(initial.ibuTarget);
  });
});
