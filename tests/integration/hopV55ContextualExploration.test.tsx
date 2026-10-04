import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { createHopV55DecisionReadingArchiveV4, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import { createHopV55ExplorationTrialOriginContextV1, type HopV55ExplorationTrialOriginContextV1 } from '../../src/services/hopV55/explorationTrialPreparation';
import { HopV55Explorer, type HopV55ExplorerProps } from '../../src/ui/hopV55/Explorer';
import { HopV55ExplorationProfileArchive } from '../../src/ui/hopV55/ContextualExploration';
import { createHopV55ExplorationProfile, type HopV55ExplorationProfileV1 } from '../../src/ui/hopV55/contextualExplorationModel';

afterEach(() => cleanup());

const source = (title: string) => ({
  title, author: 'Brasserie témoin', year: 2025, kind: 'observation' as const, reference: `https://example.test/${encodeURIComponent(title)}`,
});

const varieties: HopVariety[] = [
  { id: 'saazer', name: 'Saazer', aliases: [], form: 'pelletT90', analysis: [],
    descriptions: [{ text: 'Résine et pin marqués', context: 'rawHop', source: source('Fiche Saazer') }] },
  { id: 'styrian', name: 'Styrian Golding', aliases: [], form: 'pelletT90', analysis: [],
    descriptions: [{ text: 'Floral et miel, sans résine', context: 'beer', source: source('Dégustation Styrian') }] },
  { id: 'silent', name: 'Houblon maison', aliases: [], form: 'unknown', analysis: [], descriptions: [] },
];

const axis = (id: string, name: string): HopAxis => ({
  id, kind: 'axis', name, version: '1', description: `Axe ${name}.`, scale: { min: 0, max: 5 }, lowMax: 1, mediumMax: 3,
  weight: { range: { min: 1, max: 1 }, source: source(`Définition ${name}`) }, source: source(`Définition ${name}`),
});

// Only the fields read by the Explorer catalogue are needed; numeric model parameters are not used here.
const model = {
  id: 'documentary-model', kind: 'extrapolation', name: 'Modèle documentaire', version: '1', enabled: true, source: source('Modèle documentaire'),
  axes: [
    { id: 'resin', version: '1', terms: ['résine', 'pin'], source: source('Termes résine') },
    { id: 'floral', version: '1', terms: ['floral'], source: source('Termes floral') },
  ],
} as unknown as HopExtrapolation;

const materials: HopDecisionMaterial[] = varieties.map((variety) => ({ id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety }));

const prepared = {
  version: 'brewing-scenario-context-v1', limitations: [], provenance: [],
  runtime: { engineData: { varieties, lots: [], knowledge: [axis('resin', 'Résine'), axis('floral', 'Floral'), model], predictions: [], tastings: [], truncated: [] }, materials },
} as unknown as PreparedBrewingScenarioContext;

const programA: HopDecisionProgram = { id: 'program:exploration', revision: 3, stage: 'planning', volumeL: 20, wortGravity: null,
  additions: [
    { id: 'addition:saazer', materialId: 'variety:saazer', grams: 40, use: 'boil', status: 'planned', boilMinutes: 60 },
    { id: 'addition:done', materialId: 'variety:other', grams: 5, use: 'boil', status: 'performed', boilMinutes: 60 },
  ] } as HopDecisionProgram;
const programB: HopDecisionProgram = { ...programA, additions: [{ ...programA.additions[0], grams: 25 }, programA.additions[1]] } as HopDecisionProgram;

const intent = { question: 'Une light lager florale sans résine', criteria: [
  { id: 'resin', label: 'Éviter la résine', direction: 'exclude' as const, axisId: 'resin' },
] };

function trialOrigin(program: HopDecisionProgram, recipeId = 'recipe:fixture-a', ownerKey = 'owner:fixture', workspaceId = 'workspace:fixture'):
  HopV55ExplorationTrialOriginContextV1 {
  const sourceReference = `recipe-reference:${recipeId}`;
  return createHopV55ExplorationTrialOriginContextV1({
    ownerKey, workspaceId,
    source: { kind: 'recipe', recipeId }, sourceReference, runtimeReference: `runtime:${ownerKey}:${workspaceId}:${recipeId}`,
    cultureBindingReference: null, readingReference: null,
    programOrigin: { kind: 'physicalSource', reference: sourceReference }, programReference: programFingerprint(program),
  });
}

function baseProps(overrides: Partial<HopV55ExplorerProps> = {}): HopV55ExplorerProps {
  const props = { prepared, intent, onCompose: vi.fn(), ...overrides };
  if (props.onPrepareTrial && props.program && !Object.prototype.hasOwnProperty.call(overrides, 'originContext')) {
    return { ...props, originContext: trialOrigin(props.program) };
  }
  return props;
}

function chooseCouple() {
  fireEvent.change(screen.getByRole('combobox', { name: 'Source de la comparaison' }), { target: { value: 'variety:saazer' } });
  expect(screen.queryByRole('heading', { name: 'Ce que disent les descriptions' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Alternative de la comparaison' }), { target: { value: 'variety:styrian' } });
}

function declareTargetProfile(label: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Déclarer un profil libre' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Nom du profil' }), { target: { value: label } });
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser ce profil comme lentille' }));
  expect(screen.getByText('Choisis si ce profil est une cible ou une hypothèse.')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Cible visée'));
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter un critère' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Relation du critère 1' }), { target: { value: 'seek' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Formulation du critère 1' }), { target: { value: 'Florale' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Lien documentaire du critère 1' }), { target: { value: 'family' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Famille du critère 1' }), { target: { value: 'floral@1:["floral"]' } });
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser ce profil comme lentille' }));
}

describe('Exploration contextualisée · comparaison documentaire hors recette', () => {
  it('compare une source et une alternative exactes sans choisir de fiche, de masse ni de centre', () => {
    const onCompose = vi.fn();
    render(<HopV55Explorer {...baseProps({ onCompose })} />);

    expect(screen.getByText(/Une recherche, une famille ou l’ordre du catalogue ne sélectionnent aucune fiche/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Matière, lot, variété, description, source ou terme documentaire' }), { target: { value: 'floral' } });
    expect(screen.getByRole('combobox', { name: 'Source de la comparaison' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Alternative de la comparaison' })).toHaveValue('');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Matière, lot, variété, description, source ou terme documentaire' }), { target: { value: '' } });

    chooseCouple();
    expect(screen.getByRole('heading', { name: 'Ce que disent les descriptions' })).toBeInTheDocument();
    expect(screen.getByText('Mention présente dans la source initiale seulement · pas une perte mesurée')).toBeInTheDocument();
    expect(screen.getByText('Mention ajoutée dans la description de l’alternative · aucune mesure sensorielle')).toBeInTheDocument();
    expect(screen.getAllByText(/mentionné par une négation/).length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, element) => {
      const text = element?.textContent?.replace(/\s+/gu, ' ').trim() ?? '';
      return text.includes('Alternative') && text.includes('mentionné par une négation') && text.includes('bière');
    }).length).toBeGreaterThan(0);
    expect(screen.getByText('Aucune analyse lisible pour ces deux matières. Les champs inconnus ne sont pas traités comme zéro.')).toBeInTheDocument();
    expect(screen.getByText(/Une plage rapportée n’a pas de centre/)).toBeInTheDocument();

    const readings = within(screen.getByRole('heading', { name: 'Confrontation à l’intention' }).closest('section') as HTMLElement);
    expect(readings.getByText('Question actuelle')).toBeInTheDocument();
    expect(readings.getByText('Non mentionné · pas une garantie')).toBeInTheDocument();
    expect(readings.queryByText('Tension documentaire')).not.toBeInTheDocument();

    expect(screen.getByText(/Aucune matière choisie/)).toBeInTheDocument();
    expect(onCompose).not.toHaveBeenCalled();
  });

  it('garde une description absente inconnue et refuse de comparer une identité à elle-même', () => {
    render(<HopV55Explorer {...baseProps()} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Source de la comparaison' }), { target: { value: 'variety:silent' } });
    const alternative = screen.getByRole('combobox', { name: 'Alternative de la comparaison' });
    expect(within(alternative).getByRole('option', { name: /Houblon maison/ })).toBeDisabled();
    expect(alternative).toHaveValue('');
    fireEvent.change(screen.getByRole('combobox', { name: 'Source de la comparaison' }), { target: { value: 'variety:saazer' } });
    fireEvent.change(alternative, { target: { value: 'variety:silent' } });
    expect(screen.getByText(/Aucun écart documentaire lisible dans les familles chargées/)).toBeInTheDocument();
    expect(screen.getAllByText(/Une description manque · comparaison indéterminée/).length).toBeGreaterThan(0);
    const readings = within(screen.getByRole('heading', { name: 'Confrontation à l’intention' }).closest('section') as HTMLElement);
    expect(readings.getByText('Inconnu')).toBeInTheDocument();
    expect(readings.getAllByText(/Aucune description documentaire chargée pour cette variété/).length).toBeGreaterThan(0);
  });
});

describe('Exploration contextualisée · profil libre', () => {
  it('sans raccord de conservation, le profil reste un brouillon déclaré tel quel et non un style', () => {
    render(<HopV55Explorer {...baseProps()} />);
    declareTargetProfile('Light lager florale');
    expect(screen.getByText(/brouillon de cette vue, non conservé/)).toBeInTheDocument();
    expect(screen.getByText('La conservation n’est pas raccordée ici : ce brouillon disparaît au rechargement.')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Lentille de confrontation' })).toHaveValue('session');

    chooseCouple();
    expect(screen.getByText('Profil cible « Light lager florale » · brouillon non conservé')).toBeInTheDocument();
    expect(screen.getByText('Mention dans la source alternative')).toBeInTheDocument();
    expect(screen.getByText(/ni guide de style, même si son nom évoque un style/)).toBeInTheDocument();
  });

  it('transmet une version immuable au parent et ne la dit conservée qu’après son retour', async () => {
    const onDeclareProfile = vi.fn(async (_profile: HopV55ExplorationProfileV1) => undefined);
    const props = baseProps({ onDeclareProfile, profiles: [] });
    const view = render(<HopV55Explorer {...props} />);
    declareTargetProfile('Bière de Champagne libre');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Conserver ce profil dans l’espace' })); });
    await vi.waitFor(() => expect(onDeclareProfile).toHaveBeenCalledOnce());
    const declared = onDeclareProfile.mock.calls[0][0];
    expect(declared).toMatchObject({ format: 'hop-v55-exploration-profile-v1', version: 1, status: 'target', scope: 'explorationOnly', styleGuideRef: null,
      criteria: [{ direction: 'seek', label: 'Florale', family: { axisId: 'floral', version: '1', terms: ['floral'] } }] });
    expect(screen.getByText(/brouillon de cette vue, non conservé/)).toBeInTheDocument();

    view.rerender(<HopV55Explorer {...props} profiles={[declared, { format: 'hop-v55-exploration-profile-v9' }]} />);
    expect(screen.queryByText(/brouillon de cette vue, non conservé/)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Lentille de confrontation' })).toHaveValue(declared.reference);
    expect(screen.getByText('Profils conservés · 1 · versions 1')).toBeInTheDocument();
    expect(screen.getByText('Format hop-v55-exploration-profile-v9 conservé en lecture seule.')).toBeInTheDocument();
  });

  it('relit les profils conservés à côté d’une prévision sans les convertir', () => {
    const profile = createHopV55ExplorationProfile({ label: 'Blanche tropicale', status: 'hypothesis', description: 'Banane et fruits tropicaux.', criteria: [] },
      { recordedAt: '2026-10-04T08:00:00.000Z', profileId: 'exploration-profile:blanche', newId: () => 'c1' });
    render(<HopV55ExplorationProfileArchive profiles={[profile, { format: 'future-profile' }]} />);
    expect(screen.getByText(/ni fait de cette prévision, ni guide de style/)).toBeInTheDocument();
    expect(screen.getByText('« Banane et fruits tropicaux. »')).toBeInTheDocument();
    expect(screen.getByText('Format future-profile conservé en lecture seule; non converti.')).toBeInTheDocument();
  });

  it('garde le profil V1 exact lié à une branche même si V2 est la dernière version', () => {
    const first = createHopV55ExplorationProfile({ label: 'Profil V1', status: 'hypothesis', description: 'Version liée au calcul.', criteria: [] },
      { recordedAt: '2026-10-04T08:00:00.000Z', profileId: 'exploration-profile:branch', newId: () => 'unused' });
    const second = createHopV55ExplorationProfile({ label: 'Profil V2', status: 'hypothesis', description: 'Nouvelle version.', criteria: [] },
      { recordedAt: '2026-10-04T09:00:00.000Z', profileId: first.profileId, previous: first, newId: () => 'unused' });
    render(<HopV55ExplorationProfileArchive profiles={[first, second]} branchProfile={{ kind: 'persisted', profile: first }} />);
    const linked = screen.getByText(/Profil lié à cette branche/).closest('[data-profile-reference]');
    expect(linked).toHaveAttribute('data-profile-reference', first.reference);
    expect(linked).toHaveTextContent('version exacte 1');
    expect(linked).toHaveTextContent('Profil V1');
    expect(screen.getByText('Profil V2').closest('li')).toHaveTextContent('version 2');
  });
});

describe('Exploration contextualisée · archive sémantique source', () => {
  it('affiche l’archive V4 exacte avec cible qualitative et constat de compensation sans reparsing', async () => {
    const question = 'Je veux une bière avec une faible amertume. Je trouve ma bière trop douce. Comment envisager une compensation avec mon houblon de jardin, tout en conservant la poire ?';
    const reading = readHopV55QuestionSemanticV1(question, prepared);
    const archive = createHopV55DecisionReadingArchiveV4({
      id: 'reading:contextual-semantic-source', ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture',
      recordedAt: '2026-10-04T08:00:00.000Z', reading, source: { kind: 'exploration' }, runtimeReference: 'runtime:fixture',
    });
    const checked = readHopV55DecisionReadingArchive(archive);
    expect(checked.status).toBe('available');
    if (checked.status !== 'available' || checked.archive.format !== 'hop-v55-decision-reading-v4') throw new Error('Fixture V4 illisible.');
    const bitterTarget = checked.archive.reading.annotations.find((annotation) => annotation.term === 'amertume');
    const sweetObservation = checked.archive.reading.annotations.find((annotation) => annotation.term === 'douce');
    const compensation = checked.archive.reading.annotations.find((annotation) => annotation.inquiry === 'compensation');
    expect(bitterTarget).toMatchObject({ sense: 'qualitativeTarget', direction: null, qualification: 'faible' });
    expect(sweetObservation).toMatchObject({ sense: 'reportedObservation', direction: null });
    expect(compensation).toMatchObject({ sense: 'investigation', direction: 'investigate', inquiry: 'compensation' });
    expect(compensation?.relatedAnnotationIds).toContain(sweetObservation?.id);
    expect(checked.archive.reading.projectionCoverage.notProjected.map((row) => row.annotationId)).toEqual(
      expect.arrayContaining([bitterTarget?.id, sweetObservation?.id, compensation?.id]));

    const reread = vi.spyOn(await import('../../src/services/hopV55/questionSemanticReading'), 'readHopV55QuestionSemanticV1');
    render(<HopV55Explorer {...baseProps({ readingArchive: checked.archive })} />);
    expect(reread).not.toHaveBeenCalled();
    expect(screen.getByText(/Lecture archivée exacte ·/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Question et annotations V4/));
    expect(screen.getByText('amertume')).toBeInTheDocument();
    expect(screen.getByText('cible qualitative')).toBeInTheDocument();
    expect(screen.getByText('constat rapporté')).toBeInTheDocument();
    expect(screen.getAllByText('compensation').length).toBeGreaterThan(0);
    expect(screen.getByText(/Annotations liées\s*:/)).toBeInTheDocument();
    expect(screen.getByText(/non projetées :/)).toBeInTheDocument();
    expect(screen.queryByText(/Hausse choisie · amertume/)).not.toBeInTheDocument();
  });
});

describe('Exploration contextualisée · essai explicite', () => {
  it('prépare un ajout par ligne via le contrôle canonique puis refuse une préparation A envoyée sur B', async () => {
    const onPrepareTrial = vi.fn();
    const props = baseProps({ program: programA, onPrepareTrial });
    const view = render(<HopV55Explorer {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /Tout le catalogue/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Styrian Golding à l’essai' }));
    expect(screen.getByRole('textbox', { name: 'Masse de Styrian Golding' })).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText('Essai incomplet')).toBeInTheDocument();
    expect(screen.getByText('Quantité à préciser')).toBeInTheDocument();
    expect(screen.getByText('Emploi à choisir')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Masse de Styrian Golding' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Emploi de Styrian Golding' }), { target: { value: 'whirlpool' } });
    expect(screen.getByText(/une ligne.*volume.*souche.*profil.*comparaison a changé/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText('Conditions à préciser')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Emploi de Styrian Golding' }), { target: { value: 'firstWort' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText('Essai prêt à simuler')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Charges introduites avant et après l’essai' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    await screen.findByText(/Essai transmis au parent pour la prévision J5/);
    expect(onPrepareTrial).toHaveBeenCalledOnce();
    const request = onPrepareTrial.mock.calls[0][0];
    expect(request).toMatchObject({ format: 'hop-v55-exploration-trial-entry-v1', programReference: programFingerprint(programA),
      originProgramReference: programFingerprint(programA), overrides: {}, profileSnapshot: null, comparisonSnapshot: null });
    expect(request.preparationInput.program).toEqual(programA);
    expect(request.preparationInput.operations).toEqual(request.preparation.operations);
    expect(request.lineOrigins.map((row: { operationId: string }) => row.operationId))
      .toEqual(request.preparationInput.operations.map((operation: { id: string }) => operation.id));
    expect(request.branch.programChanges).toEqual([{ kind: 'append', addition: expect.objectContaining({
      materialId: 'variety:styrian', grams: 12, use: 'firstWort', status: 'planned' }) }]);
    expect(request.branch.id).toMatch(/^exploration-trial-/);

    view.rerender(<HopV55Explorer {...props} program={programB} originContext={trialOrigin(programB, 'recipe:fixture-b')} />);
    expect(screen.getByText(/Le programme de référence a changé depuis la préparation/)).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Simuler et comparer cet essai' });
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(onPrepareTrial).toHaveBeenCalledOnce();
  });

  it('refuse source A→B puis retour A sous un autre owner/workspace avant préparation, même avec le même programme', () => {
    const onPrepareTrial = vi.fn();
    const frameA = trialOrigin(programA, 'recipe:A', 'owner:A', 'workspace:A');
    const frameB = trialOrigin(programA, 'recipe:B', 'owner:B', 'workspace:B');
    const frameARestoredUnderB = trialOrigin(programA, 'recipe:A', 'owner:B', 'workspace:B');
    expect(frameA.programReference).toBe(frameB.programReference);
    expect(new Set([frameA.reference, frameB.reference, frameARestoredUnderB.reference]).size).toBe(3);
    const props = baseProps({ program: programA, originContext: frameA, onPrepareTrial });
    const view = render(<HopV55Explorer {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout le catalogue/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Styrian Golding à l’essai' }));

    view.rerender(<HopV55Explorer {...props} originContext={frameB} />);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText(/source ou le contexte a changé depuis ce geste/)).toBeInTheDocument();
    expect(screen.queryByText('Essai prêt à simuler')).not.toBeInTheDocument();

    view.rerender(<HopV55Explorer {...props} originContext={frameARestoredUnderB} />);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText(/source ou le contexte a changé depuis ce geste/)).toBeInTheDocument();
    expect(onPrepareTrial).not.toHaveBeenCalled();
  });

  it('désactive l’envoi si une autre source conserve exactement le même programme', () => {
    const onPrepareTrial = vi.fn();
    const frameA = trialOrigin(programA, 'recipe:A', 'owner:A', 'workspace:A');
    const frameB = trialOrigin(programA, 'recipe:B', 'owner:B', 'workspace:B');
    const props = baseProps({ program: programA, originContext: frameA, onPrepareTrial });
    const view = render(<HopV55Explorer {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout le catalogue/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Styrian Golding à l’essai' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Masse de Styrian Golding' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Emploi de Styrian Golding' }), { target: { value: 'firstWort' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText('Essai prêt à simuler')).toBeInTheDocument();

    view.rerender(<HopV55Explorer {...props} originContext={frameB} />);
    expect(screen.getByText(/source, le runtime, la lecture, le programme/)).toBeInTheDocument();
    expect(screen.getByText(/source ou le contexte exact a changé/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simuler et comparer cet essai' })).toBeDisabled();
    expect(onPrepareTrial).not.toHaveBeenCalled();
  });

  it('bloque le premier geste de ligne quand Page ne fournit pas de cadre exact', () => {
    const onPrepareTrial = vi.fn();
    render(<HopV55Explorer {...baseProps({ program: programA, originContext: null, onPrepareTrial })} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout le catalogue/ }));
    expect(screen.getByText(/cadre exact propriétaire\/source\/runtime\/lecture\/programme manque/)).toBeInTheDocument();
    const add = screen.getByRole('button', { name: 'Ajouter Styrian Golding à l’essai' });
    expect(add).toBeDisabled();
    fireEvent.click(add);
    expect(screen.queryByRole('list', { name: 'Lignes de l’essai' })).not.toBeInTheDocument();
    expect(onPrepareTrial).not.toHaveBeenCalled();
  });

  it('désactive une entrée prête si le volume hypothétique change après préparation', () => {
    const onPrepareTrial = vi.fn();
    render(<HopV55Explorer {...baseProps({ program: programA, onPrepareTrial })} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout le catalogue/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Styrian Golding à l’essai' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Masse de Styrian Golding' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Emploi de Styrian Golding' }), { target: { value: 'firstWort' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText('Essai prêt à simuler')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hypothèses de contexte · facultatif'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Volume hypothétique' }), { target: { value: '24' } });
    expect(screen.getByText(/volume.*a changé depuis la préparation/i)).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Simuler et comparer cet essai' });
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(onPrepareTrial).not.toHaveBeenCalled();
  });

  it('réessaie la même entrée avec le même commandId après un refus réseau du parent', async () => {
    const onPrepareTrial = vi.fn().mockRejectedValueOnce(new Error('Connexion interrompue.')).mockResolvedValueOnce(undefined);
    render(<HopV55Explorer {...baseProps({ program: programA, onPrepareTrial })} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout le catalogue/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Styrian Golding à l’essai' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Masse de Styrian Golding' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Emploi de Styrian Golding' }), { target: { value: 'firstWort' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' })); });
    expect(await screen.findByRole('alert')).toHaveTextContent('Connexion interrompue.');
    const firstEntry = onPrepareTrial.mock.calls[0][0];
    expect(firstEntry.originContext.reference).toBe(trialOrigin(programA).reference);
    expect(firstEntry.preparationInput.program).toEqual(programA);
    expect(firstEntry.preparationInput.operations).toEqual(firstEntry.preparation.operations);
    expect(firstEntry.preparationInput.operations.map((operation: { id: string }) => operation.id))
      .toEqual(firstEntry.lineOrigins.map((row: { operationId: string }) => row.operationId));
    expect(firstEntry.lineOrigins).toEqual(firstEntry.lineOrigins.map((row: { operationId: string; originProgramReference: string; originContextReference: string }) => ({
      operationId: row.operationId, originProgramReference: programFingerprint(programA), originContextReference: firstEntry.originContext.reference,
    })));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' })); });
    await vi.waitFor(() => expect(onPrepareTrial).toHaveBeenCalledTimes(2));
    expect(onPrepareTrial.mock.calls[1][0]).toEqual(firstEntry);
    expect(onPrepareTrial.mock.calls[1][0].commandId).toBe(firstEntry.commandId);
  });

  it('transforme la comparaison en remplacement de ligne sans dose implicite', async () => {
    const onPrepareTrial = vi.fn();
    const profile = createHopV55ExplorationProfile({ label: 'Lentille de cette branche', status: 'hypothesis', description: 'Version exacte.', criteria: [] },
      { recordedAt: '2026-10-04T08:00:00.000Z', profileId: 'profile:trial-entry', newId: () => 'unused' });
    render(<HopV55Explorer {...baseProps({ program: programA, profiles: [profile], onPrepareTrial })} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Lentille de confrontation' }), { target: { value: profile.reference } });
    chooseCouple();
    expect(screen.getByText('La seule ligne prévue de cette source est reprise; la dose ou la convention reste à choisir.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai : remplacer Saazer par Styrian Golding' }));

    const line = screen.getByRole('combobox', { name: 'Ligne du programme · essai 1' });
    expect(line).toHaveValue('addition:saazer');
    expect(within(line).getByRole('option', { name: /effectuée, non modifiable/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText('Essai incomplet')).toBeInTheDocument();
    expect(screen.getByText('Convention à choisir')).toBeInTheDocument();
    expect(onPrepareTrial).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('combobox', { name: 'Dose de remplacement · essai 1' }), { target: { value: 'explicit' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Masse de Styrian Golding' }), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    expect(screen.getByText('Essai prêt à simuler')).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' })); });
    await vi.waitFor(() => expect(onPrepareTrial).toHaveBeenCalledOnce());
    const request = onPrepareTrial.mock.calls[0][0];
    expect(request.comparisonSnapshot).toMatchObject({
      format: 'hop-v55-contextual-comparison-snapshot-v1', sourceId: 'variety:saazer', alternativeId: 'variety:styrian',
      readingReference: null, profileSnapshotReference: profile.reference,
    });
    expect(request.profileSnapshot).toEqual({ kind: 'persisted', profile });
    expect(request.branch.programChanges).toEqual([{ kind: 'replace', additionId: 'addition:saazer', additions: [expect.objectContaining({
      id: 'addition:saazer', materialId: 'variety:styrian', grams: 30, use: 'boil', boilMinutes: 60 })] }]);
  });

  it('sans programme, l’essai l’explique et la comparaison reste disponible', () => {
    render(<HopV55Explorer {...baseProps({ program: null, onPrepareTrial: vi.fn() })} />);
    expect(screen.getByText(/Aucun programme de référence n’est transmis/)).toBeInTheDocument();
    chooseCouple();
    expect(screen.getByRole('heading', { name: 'Ce que disent les descriptions' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Préparer l’essai : remplacer/ })).not.toBeInTheDocument();
  });
});
