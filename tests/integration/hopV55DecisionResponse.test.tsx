import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { HopAdviceEvidenceSource, HopAdviceOption, HopStrategyAdviceResult } from '../../src/domain/hopDecision/adviceSchema';
import { hopAdviceOptionReference, hopAdviceResultReference } from '../../src/domain/hopDecision/adviceSchema';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import { type HopDecisionResponse } from '../../src/domain/hopDecision/service';
import { answerHopDecision } from '../../src/domain/hopDecision/service';
import { HOP_COMMERCIAL_PRODUCTS } from '../../src/domain/hopDecision/products';
import { HOP_DECISION_VERSION } from '../../src/domain/hopDecision/types';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { HopV55QuestionReading } from '../../src/services/hopV55/decision';
import * as decisionReader from '../../src/services/hopV55/decision';
import * as programPreparationService from '../../src/services/hopV55/decisionProgramPreparation';
import type { HopV55ProgramOperationV1 } from '../../src/services/hopV55/decisionProgramPreparation';
import {
  createHopV55DecisionReadingArchive,
  createHopV55DecisionReadingArchiveV2,
  readHopV55DecisionReadingArchive,
} from '../../src/services/hopV55/decisionArchive';
import { HopV55DecisionResponse } from '../../src/ui/hopV55/DecisionResponse';

const originalQuestion = 'Plus de poire, préserver le floral, ne pas augmenter l’amertume.';
const adviceInputReference = 'hop-advice-input-v1:fixture';
const criteria = [
  { id: 'criterion-pear', label: 'Poire exacte', direction: 'increase' as const },
  { id: 'criterion-floral', label: 'Floral', direction: 'keep' as const },
  { id: 'criterion-bitterness', label: 'Amertume', direction: 'exclude' as const },
];

function material(id: string, name: string): HopDecisionMaterial {
  return { id, name, form: 'unknown' } as HopDecisionMaterial;
}

function source(id: string, title: string, established: string): HopAdviceEvidenceSource {
  return {
    id,
    source: { title, author: `Brasseur ${id}`, year: 2025, kind: 'judgment', reference: `source:${id}` },
    locator: `section ${id}`,
    readingLevel: 'primaryExcerpt',
    domain: 'Description de matière crue',
    established,
    limits: ['Ne décrit pas la bière finie.'],
  };
}

function option(input: {
  id: string;
  title: string;
  materialId?: string;
  relevance?: HopAdviceOption['relevance'];
  scope?: HopAdviceOption['programScope'];
  criterionEffects?: HopAdviceOption['criterionEffects'];
  dimensionEffects?: HopAdviceOption['dimensionEffects'];
  conditions?: string[];
  evidenceIds?: string[];
}): HopAdviceOption {
  const content = {
    title: input.title,
    materialIds: input.materialId ? [input.materialId] : [],
    relevance: input.relevance ?? 'conditional' as const,
    programScope: input.scope ?? { kind: 'none' as const },
    criterionEffects: input.criterionEffects ?? [],
    dimensionEffects: input.dimensionEffects ?? [],
    exclusions: [],
    conditions: input.conditions ?? [],
    nonConclusions: ['Aucun caractère sensoriel de la bière finie n’est prédit.'],
    informationRequestIds: [],
  };
  return {
    id: input.id,
    reference: hopAdviceOptionReference(adviceInputReference, content),
    ...content,
  };
}

const pearCriterion = {
  criterionId: 'criterion-pear', status: 'documentedSupport' as const,
  reason: 'La source de ce houblon nomme « poire » dans une description de matière crue.', evidenceIds: ['evidence-admiral'],
};
const floralCriterion = {
  criterionId: 'criterion-floral', status: 'unknown' as const,
  reason: 'La source ne documente pas le floral pour cette matière; cela ne prouve pas son absence.', evidenceIds: [],
};
const aromaEffect = {
  dimension: 'aroma' as const, status: 'documentarySupport' as const,
  statement: 'Le lexique cité contient le terme « poire ».',
  reason: 'Description de houblon cru; aucune dégustation de la bière n’est rapportée.',
  evidenceIds: ['evidence-admiral'], assertionIds: [], criterionIds: ['criterion-pear'],
};

function makeReading(options: HopAdviceOption[], evidenceSources: HopAdviceEvidenceSource[] = [
  source('evidence-admiral', 'Fiche Admiral · source distincte', 'La description emploie le mot poire.'),
  source('evidence-akoya', 'Fiche Akoya · autre source', 'La description documente le floral, pas la poire.'),
]): HopV55QuestionReading {
  const intent = { question: originalQuestion, criteria };
  const resultContent: Omit<HopStrategyAdviceResult, 'reference'> = {
    version: 'hop-strategy-advice-v1',
    inputReference: adviceInputReference,
    stage: 'planning',
    status: 'conditional',
    options,
    informationRequests: [],
    evidenceSources,
    coverage: {
      status: 'partial', consideredMaterialIds: [...new Set(options.flatMap(row => row.materialIds))],
      excludedMaterialIds: [], contextOnlyMaterialIds: [], omittedMaterials: [], conditionalMaterials: [],
      limits: ['Le périmètre documentaire est celui des matières transmises.'],
    },
    limitations: ['Une description de matière ne prédit pas la bière finie.'],
  };
  const result: HopStrategyAdviceResult = { ...resultContent, reference: hopAdviceResultReference(resultContent) };
  const response: HopDecisionResponse<'exploreStrategies'> = {
    version: HOP_DECISION_VERSION,
    intent: { originalQuestion, criteria: [] },
    actionKind: 'exploreStrategies',
    status: 'conditional',
    answer: 'Deux pistes documentaires diffèrent; leurs termes ne suffisent pas à promettre un goût.',
    result,
    criteria: [],
    missingInformation: ['Le contact et la souche réels peuvent changer le choix.'],
    sources: [],
    boundaries: { offline: true, writesRecipe: false, writesBatch: false, sensoryValidation: 'notEstablished' },
  };
  const criterionDrafts = [
    { id: 'criterion-pear', source: { start: originalQuestion.indexOf('poire'), end: originalQuestion.indexOf('poire') + 'poire'.length, text: 'poire' },
      term: 'poire', direction: 'increase' as const, requirement: 'required' as const, origin: 'parser' as const },
    { id: 'criterion-floral', source: { start: originalQuestion.indexOf('floral'), end: originalQuestion.indexOf('floral') + 'floral'.length, text: 'floral' },
      term: 'floral', direction: 'keep' as const, requirement: 'required' as const, origin: 'parser' as const },
    { id: 'criterion-bitterness', source: { start: originalQuestion.indexOf('amertume'), end: originalQuestion.indexOf('amertume') + 'amertume'.length, text: 'amertume' },
      term: 'amertume', direction: 'exclude' as const, requirement: 'required' as const, origin: 'parser' as const },
  ];
  return { intent, criterionDrafts, interpretation: 'La demande originale reste conservée.', response, branches: [], unresolved: ['Souche non renseignée.'] };
}

function legacyReading(reading: HopV55QuestionReading) {
  const { criterionDrafts: _drafts, correction: _correction, ...v1 } = reading;
  return v1;
}

function asLegacyReading(reading: HopV55QuestionReading) {
  const { criterionDrafts: _criterionDrafts, correction: _correction, ...legacy } = reading;
  return legacy;
}

function prepared(materials: HopDecisionMaterial[], additions: Array<{ id: string; materialId: string; use: 'whirlpool'; status: 'planned' }> = []): PreparedBrewingScenarioContext {
  return { runtime: { materials, engineData: { varieties: [], lots: [], knowledge: [] }, current: {
    recipeReference: 'recipe-reference:fixture', inputReference: 'input-reference:fixture',
    program: { id: 'program:fixture', revision: 1, stage: 'planning', volumeL: 20, wortGravity: null, additions: additions.map(row => ({
      ...row, grams: null,
    })) },
  } }, limitations: [], provenance: [], version: 'brewing-scenario-context-v1' } as unknown as PreparedBrewingScenarioContext;
}

function criterionPair(materialId: string, reason: string, evidenceId: string) {
  return [
    { ...pearCriterion, evidenceIds: [evidenceId], reason },
    { ...floralCriterion, criterionId: 'criterion-floral', status: 'unknown' as const,
      reason: `Le floral pour ${materialId} n’est pas établi par cette source.`, evidenceIds: [evidenceId] },
  ];
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HopV55DecisionResponse', () => {
  it('groupe uniquement les signatures identiques tout en gardant raisons, conditions et sources propres à chaque matière', () => {
    const admiral = material('hop:admiral', 'Admiral QA');
    const akoya = material('hop:akoya', 'Akoya QA');
    const admiralAgain = option({ id: 'admiral-source-2', title: 'Rechercher une autre référence pour Admiral', materialId: admiral.id,
      criterionEffects: criterionPair(admiral.id, 'Cette seconde source associe poire à une matière crue selon son propre contexte.', 'evidence-admiral'),
      dimensionEffects: [aromaEffect], conditions: ['La forme de cette ligne reste inconnue.'] });
    const admiralFirst = option({ id: 'admiral-source-1', title: 'Comparer la description sourcée de Admiral', materialId: admiral.id,
      criterionEffects: criterionPair(admiral.id, pearCriterion.reason, 'evidence-admiral'),
      dimensionEffects: [aromaEffect], conditions: ['Stock inconnu; aucune disponibilité n’est présumée.'] });
    const akoyaOption = option({ id: 'akoya-source', title: 'Comparer la description sourcée de Akoya', materialId: akoya.id,
      relevance: 'mixed', criterionEffects: [
        { criterionId: 'criterion-pear', status: 'unknown', reason: 'La fiche Akoya ne mentionne pas la poire; son absence du texte ne signifie pas zéro.', evidenceIds: ['evidence-akoya'] },
        { criterionId: 'criterion-floral', status: 'documentedSupport', reason: 'La source Akoya documente le floral dans le contexte de houblon cru.', evidenceIds: ['evidence-akoya'] },
      ],
      dimensionEffects: [{ ...aromaEffect, status: 'documentaryTension', statement: 'La poire n’apparaît pas dans cette description.', reason: 'L’absence du mot ne démontre pas l’absence du caractère.', evidenceIds: ['evidence-akoya'], criterionIds: ['criterion-pear'] }],
      conditions: ['Aucune description de bière fermentée n’est fournie pour cette matière.'] });
    const reading = makeReading([admiralFirst, admiralAgain, akoyaOption]);
    const tree = render(<HopV55DecisionResponse reading={reading} prepared={prepared([admiral, akoya])}
      onPrepare={vi.fn()} onExplore={vi.fn()} />);

    expect(tree.container.querySelectorAll('.hv-decision__group')).toHaveLength(2);
    const admiralGroup = screen.getByRole('heading', { name: 'Admiral QA' }).closest('article');
    expect(admiralGroup).not.toBeNull();
    expect(within(admiralGroup as HTMLElement).getByText(pearCriterion.reason, { selector: '.hv-decision__lead-reason span' })).toBeVisible();
    expect(within(admiralGroup as HTMLElement).getByText('Stock inconnu; aucune disponibilité n’est présumée.',
      { selector: '.hv-decision__primary-condition' })).toBeVisible();
    expect(screen.getByText(/Plus de poire, préserver le floral, ne pas augmenter l’amertume/, { selector: '.hv-decision__question' })).toBeVisible();
    expect(screen.getByText('Souche non renseignée.')).toBeVisible();
    expect(screen.queryByText(/Total inconnu|0\/5 satisfait|intensité calculée/i)).not.toBeInTheDocument();

    const firstAdmiralOption = screen.getByRole('heading', { name: 'Comparer la description sourcée de Admiral' }).closest('.hv-decision__option');
    expect(firstAdmiralOption).not.toBeNull();
    fireEvent.click(within(firstAdmiralOption as HTMLElement).getByText('Raisons, conditions et sources exactes · 1 autre référence de même portée'));
    expect(within(firstAdmiralOption as HTMLElement).getByText(/seconde source associe poire/)).toBeVisible();
    expect(within(firstAdmiralOption as HTMLElement).getByText('La forme de cette ligne reste inconnue.')).toBeVisible();
    expect(within(firstAdmiralOption as HTMLElement).getByText(/Fiche Admiral · source distincte/,
      { selector: '.hv-decision__primary-source' })).toBeVisible();
    expect(within(firstAdmiralOption as HTMLElement).getAllByText('Aucun caractère sensoriel de la bière finie n’est prédit.')).toHaveLength(2);
  });

  it('classe d’abord les appuis sourcés sur les critères, sans score global ni ordre alphabétique', () => {
    const alphaUnknown = material('hop:alpha-unknown', 'Aardvark Alpha');
    const supported = material('hop:z-supported', 'Zeta appui documenté');
    const unknownOption = option({ id: 'alpha-unknown', title: 'Étudier une matière sans appui exact · Aardvark Alpha', materialId: alphaUnknown.id,
      relevance: 'unknown', criterionEffects: [
        { criterionId: 'criterion-pear', status: 'unknown', reason: 'Aucune source de cette matière ne qualifie la poire.', evidenceIds: [] },
        { criterionId: 'criterion-floral', status: 'unknown', reason: 'Le floral n’est pas relié à une source.', evidenceIds: [] },
        { criterionId: 'criterion-bitterness', status: 'constraintUnverified', reason: 'La contrainte d’amertume n’est pas vérifiée.', evidenceIds: [] },
      ] });
    const supportedOption = option({ id: 'z-supported', title: 'Comparer la source liée à Zeta', materialId: supported.id,
      relevance: 'supportsCriteria', criterionEffects: [
        { criterionId: 'criterion-pear', status: 'documentedSupport', reason: 'La source nomme la poire dans le contexte fourni.', evidenceIds: ['evidence-admiral'] },
        { criterionId: 'criterion-floral', status: 'unknown', reason: 'Le floral reste à examiner.', evidenceIds: [] },
        { criterionId: 'criterion-bitterness', status: 'constraintUnverified', reason: 'La contrainte d’amertume doit être vérifiée.', evidenceIds: [] },
      ] });
    const tree = render(<HopV55DecisionResponse reading={makeReading([unknownOption, supportedOption])}
      prepared={prepared([alphaUnknown, supported])} onPrepare={vi.fn()} onExplore={vi.fn()} />);

    const orderedGroups = [...tree.container.querySelectorAll('.hv-decision__group-heading h3')].map(node => node.textContent);
    expect(orderedGroups).toEqual(['Zeta appui documenté', 'Aardvark Alpha']);
    const supportedGroup = screen.getByRole('heading', { name: 'Zeta appui documenté' }).closest('article');
    expect(within(supportedGroup as HTMLElement).getByText('Appui lié à un critère')).toBeVisible();
    expect(screen.getByText(/Ordre documentaire, sans score total/)).toBeVisible();
    expect(screen.getByText('La source nomme la poire dans le contexte fourni.', { selector: '.hv-decision__lead-reason span' })).toBeVisible();
    expect(screen.queryByText(/Aucune voie ne relie un appui documentaire/)).not.toBeInTheDocument();
  });

  it('annonce quand aucune source ne documente de gain et garde l’inconnu distinct de zéro', () => {
    const unknown = material('hop:unknown-only', 'Matière sans mention');
    const reading = makeReading([option({ id: 'unknown-only', title: 'Lire la fiche de Matière sans mention', materialId: unknown.id,
      relevance: 'unknown', criterionEffects: [
        { criterionId: 'criterion-pear', status: 'unknown', reason: 'La fiche ne mentionne pas la poire; son absence du texte ne prouve pas son absence.', evidenceIds: [] },
      ] })]);
    render(<HopV55DecisionResponse reading={reading} prepared={prepared([unknown])} onPrepare={vi.fn()} onExplore={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent(/Aucune voie ne relie un appui documentaire aux critères exacts/);
    expect(screen.getByText(/absence de mention ne prouve pas l’absence/)).toBeVisible();
  });

  it('rend les vrais contrats produits avec emplois, ratios limités, précautions et sources fabricant', () => {
    const response = answerHopDecision({ intent: { originalQuestion: 'Quels produits commerciaux sont documentés ?' },
      action: { kind: 'understandProducts' }, materials: [], products: HOP_COMMERCIAL_PRODUCTS });
    expect(response.actionKind).toBe('understandProducts');
    if (response.actionKind !== 'understandProducts') throw Error('La fixture doit produire la réponse produit typée.');
    render(<HopV55DecisionResponse reading={{ ...makeReading([]), intent: { question: 'Quels produits commerciaux sont documentés ?', criteria: [] },
      response, interpretation: 'Consultation des dossiers produits documentaires.', branches: [], unresolved: [] }}
      prepared={prepared([])} onPrepare={vi.fn()} onExplore={vi.fn()} />);

    const products = screen.getByRole('region', { name: 'Produits commerciaux documentés' });
    expect(within(products).getAllByRole('article')).toHaveLength(6);
    expect(within(products).getByRole('heading', { name: 'Cryo Hops®' })).toBeVisible();
    expect(within(products).getByRole('heading', { name: 'HyperBoost®' })).toBeVisible();
    expect(within(products).getByRole('heading', { name: 'SPECTRUM' })).toBeVisible();
    expect(within(products).getByRole('heading', { name: 'INCOGNITO®' })).toBeVisible();
    expect(within(products).getByRole('heading', { name: 'LUPOMAX®' })).toBeVisible();
    expect(within(products).getByRole('heading', { name: 'CO₂ Hop Extract' })).toBeVisible();

    const cryo = screen.getByRole('heading', { name: 'Cryo Hops®' }).closest('article');
    expect(cryo).not.toBeNull();
    expect(within(cryo as HTMLElement).getByText(/0[.,]4–0[.,]5 g\/g/)).toBeVisible();
    expect(within(cryo as HTMLElement).getAllByRole('link', { name: /Cryo Hops product page · Yakima Chief Hops/ })
      .every(link => link.getAttribute('href') === 'https://www.yakimachief.com/products/cryo-hops')).toBe(true);
    expect(within(cryo as HTMLElement).getByText(/pas une équivalence d’alpha, d’IBU ou de goût/)).toBeVisible();

    const hyperboost = screen.getByRole('heading', { name: 'HyperBoost®' }).closest('article');
    expect(hyperboost).not.toBeNull();
    expect(within(hyperboost as HTMLElement).getByText(/0[.,]008–0[.,]01 g\/g/)).toBeVisible();
    expect(within(hyperboost as HTMLElement).getByText(/emplois : Fermentation active/)).toBeVisible();
    expect([...hyperboost!.querySelectorAll('p')].some(node => node.textContent?.includes('Emplois documentés · Fermentation active · Whirlpool'))).toBe(true);
    expect([...hyperboost!.querySelectorAll('.hv-decision__product-limit')].some(node => node.textContent?.includes('Emplois documentés sans ratio massique fourni · Whirlpool'))).toBe(true);
    expect(within(hyperboost as HTMLElement).getAllByRole('link', { name: /HyperBoost® Technical One Sheet 2025/ })
      .every(link => link.getAttribute('href') === 'https://www.yakimachief.com/media/wysiwyg/documents/HyperBoost_-_Technical_One_Sheet_2025.pdf')).toBe(true);
    expect(within(products).getByText(/ne déclarent ni stock, ni variété associée, ni équivalence de goût/)).toBeVisible();
    expect(within(products).queryByText(/disponibilité confirmée|stock disponible/i)).not.toBeInTheDocument();
  });

  it('recherche dans tout le résultat, prépare seulement une portée résolue et n’ouvre que les identités disponibles', () => {
    const rows = Array.from({ length: 9 }, (_, index) => material(`hop:${index}`, index === 8 ? 'Calypso QA rare' : `Variété QA ${index + 1}`));
    const documentOptions = rows.map((row, index) => option({ id: `option-${index}`, title: `Comparer la description de ${row.name}`,
      materialId: row.id, criterionEffects: [{ ...pearCriterion, evidenceIds: ['evidence-admiral'] }], dimensionEffects: [aromaEffect] }));
    const programOption = option({ id: 'program-option', title: 'Étudier un ajout futur pour Calypso QA rare', materialId: rows[8].id,
      relevance: 'conditional', scope: { kind: 'addOrReplace', materialIds: [rows[8].id], uses: ['whirlpool'], additionIds: [], allowAppend: true },
      criterionEffects: [{ ...pearCriterion, status: 'unknown', reason: 'La source ne permet pas encore de qualifier ce changement.', evidenceIds: [] }], conditions: ['La masse et la disponibilité restent à choisir.'] });
    const unresolvedOption = option({ id: 'unresolved-option', title: 'Comparer une matière absente du runtime', materialId: 'missing:catalogue-entry',
      criterionEffects: [{ ...pearCriterion, status: 'unknown', evidenceIds: [] }] });
    const prepare = vi.fn();
    const explore = vi.fn();
    render(<HopV55DecisionResponse reading={makeReading([...documentOptions, programOption, unresolvedOption])}
      prepared={prepared(rows)} onPrepare={prepare} onExplore={explore} />);

    expect(screen.queryByRole('heading', { name: 'Calypso QA rare' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans toutes les matières, raisons et sources' }), { target: { value: 'Calypso QA rare' } });
    expect(screen.getAllByRole('heading', { name: 'Calypso QA rare' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer cette voie dans l’éditeur' }));
    expect(prepare).toHaveBeenCalledWith(programOption);
    fireEvent.click(screen.getAllByRole('button', { name: 'Explorer cette matière' })[0]);
    expect(explore).toHaveBeenCalledWith(expect.objectContaining({ materialIds: [rows[8].id], terms: ['Poire exacte'], query: originalQuestion }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans toutes les matières, raisons et sources' }), { target: { value: 'missing:catalogue-entry' } });
    const unresolvedGroup = screen.getByRole('heading', { name: 'Voie liée au contexte transmis' }).closest('article');
    expect(unresolvedGroup).not.toBeNull();
    expect(within(unresolvedGroup as HTMLElement).getByText(/Identité non résolue/)).toBeVisible();
    expect(within(unresolvedGroup as HTMLElement).queryByRole('button', { name: /Explorer/ })).not.toBeInTheDocument();
  });

  it('bloque les anciennes voies pendant une correction locale et appelle la correction V2 avant toute préparation', () => {
    const candidate = material('hop:target', 'Styrian précis');
    const programOption = option({ id: 'program-candidate', title: 'Étudier Styrian précis pour un ajout futur', materialId: candidate.id,
      relevance: 'conditional', scope: { kind: 'addOrReplace', materialIds: [candidate.id], uses: ['whirlpool'], additionIds: [], allowAppend: true },
      criterionEffects: [{ ...pearCriterion, status: 'unknown', reason: 'À recalculer sur les critères confirmés.', evidenceIds: [] }] });
    const reading = makeReading([programOption]);
    const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:correction-source', ownerKey: 'qa-owner', workspaceId: 'workspace:criteria',
      recordedAt: '2026-10-02T16:00:00.000Z', reading, source: { kind: 'recipe', id: 'recipe:current' }, runtimeReference: 'runtime:current' });
    const prepare = vi.fn();
    const explore = vi.fn();
    const correct = vi.fn();
    render(<HopV55DecisionResponse reading={reading} prepared={prepared([candidate])} archive={archive}
      onPrepare={prepare} onPrepareDecision={correct} onExplore={explore} />);
    expect(screen.getByRole('button', { name: 'Préparer cette voie dans l’éditeur' })).toBeVisible();

    fireEvent.click(screen.getByText('Vérifier ou corriger les critères · 3'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Relation du fragment 1' }), { target: { value: 'exclude' } });
    expect(screen.getByText(/Les voies affichées plus bas correspondent encore à ces critères d’origine/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Préparer cette voie dans l’éditeur' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Explorer cette matière' })).not.toBeInTheDocument();
    expect(prepare).not.toHaveBeenCalled();
    expect(explore).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Corriger et recalculer cette lecture' }));
    expect(correct).toHaveBeenCalledWith(expect.objectContaining({ sourceReadingReference: archive.contentReference,
      criterionDrafts: expect.arrayContaining([expect.objectContaining({ id: 'criterion-pear', direction: 'exclude', origin: 'parser' })]) }));
    expect(prepare).not.toHaveBeenCalled();
  });

  it('restitue une lecture historique sans substituer le contexte actif ni réexposer ses actions', () => {
    const oldMaterial = material('hop:archive', 'Houblon archivé');
    const currentMaterial = material('hop:current', 'Houblon courant');
    const reading = makeReading([option({ id: 'archived-option', title: 'Retirer l’ajout prévu addition:old du brouillon', materialId: oldMaterial.id,
      scope: { kind: 'removePlanned', additionIds: ['addition:old'] },
      criterionEffects: [{ ...pearCriterion, evidenceIds: ['evidence-admiral'] }], dimensionEffects: [aromaEffect] })]);
    const archive = createHopV55DecisionReadingArchive({ id: 'decision-reading:old', ownerKey: 'qa-owner', workspaceId: 'workspace:old',
      recordedAt: '2026-10-02T10:00:00.000Z', reading: legacyReading(reading),
      source: { kind: 'localRecipeCopy', workspaceId: 'workspace:copy', copyId: 'copy:old', recipeId: 'copy-recipe:old', recipeReference: 'hop-recipe-reference:exact' },
      runtimeReference: 'runtime:old' });
    const prepare = vi.fn();
    const explore = vi.fn();
    const reread = vi.fn();
    render(<HopV55DecisionResponse reading={reading} prepared={prepared([currentMaterial])} context={{ recipe: { name: 'Recette courante', style: 'Style courant' } } as never}
      historical archive={archive} onPrepare={prepare} onExplore={explore} onReread={reread} />);

    expect(screen.getByText(/Copie locale de recette archivée/)).toBeVisible();
    expect(screen.queryByText(/Recette courante|Style courant|Houblon courant/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Retirer l’ajout prévu de la copie locale de recette archivée/ })).toBeVisible();
    expect(screen.queryByText(/du brouillon\b/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Préparer cette voie/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Explorer cette matière/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Références scellées de cette lecture'));
    expect(screen.getByText(/copyId copy:old/)).toBeVisible();
    expect(screen.getByText(/hop-recipe-reference:exact/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Relire cette demande dans le contexte actif' }));
    expect(screen.getByText(/Une nouvelle lecture sera conservée; l’archive consultée reste inchangée/)).toBeVisible();
    expect(reread).toHaveBeenCalledTimes(1);
    expect(prepare).not.toHaveBeenCalled();
    expect(explore).not.toHaveBeenCalled();
  });

  it('relit une préparation V2 incomplète en lecture seule sans moteur ni contexte courant', async () => {
    const saaz = material('variety:saazer', 'Saazer archivé');
    const styrian = material('variety:styrian-golding', 'Styrian Golding archivé');
    const question = 'Ajouter du Styrian à froid, dose et phase à préciser.';
    const span = 'Ajouter du Styrian à froid';
    const reading: HopV55QuestionReading = { intent: { question, criteria: [] }, criterionDrafts: [],
      interpretation: 'La masse et la phase restent à préciser.', branches: [], unresolved: [] };
    const program: HopDecisionProgram = { id: 'program:archived-incomplete', revision: 2, stage: 'planning', volumeL: 20,
      wortGravity: null, additions: [{ id: 'addition:saazer', materialId: saaz.id, grams: 40, use: 'boil', status: 'planned', boilMinutes: 60 }] };
    const operations: HopV55ProgramOperationV1[] = [{ id: 'operation:add-cold', label: 'Ajouter à froid', kind: 'add',
      additionId: 'addition:styrian', materialId: styrian.id, grams: null, targetScope: 'coldSide',
      sourceSpan: { start: question.indexOf(span), end: question.indexOf(span) + span.length, text: span } }];
    const input = { branch: { id: 'branch:incomplete', label: 'Ajout à froid à préciser' }, program, materials: [saaz, styrian],
      intent: { question, interpretation: 'La phase précise reste à choisir.', criteria: [] }, operations };
    const result = programPreparationService.prepareHopV55DecisionProgram(input);
    expect(result.status).toBe('needsInput');
    expect(result.branch).toBeUndefined();
    const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:incomplete-program', ownerKey: 'qa-owner', workspaceId: 'workspace:incomplete',
      recordedAt: '2026-10-02T17:00:00.000Z', reading, source: { kind: 'recipe', id: 'recipe:source' },
      runtimeReference: 'runtime:source', programPreparation: { input, result } });
    const parserSpy = vi.spyOn(decisionReader, 'readHopV55Question');
    const preparationSpy = vi.spyOn(programPreparationService, 'prepareHopV55DecisionProgram');
    const decoded = readHopV55DecisionReadingArchive(archive);
    expect(decoded.status).toBe('available');
    if (decoded.status !== 'available' || decoded.archive.format !== 'hop-v55-decision-reading-v2') throw Error('V2 archive expected.');
    const compare = vi.fn();
    const currentProgram: HopDecisionProgram = { ...program, revision: 3 };
    const currentMaterials = [saaz, styrian];
    const currentPrepared = prepared(currentMaterials);
    const resume = vi.fn();
    render(<HopV55DecisionResponse reading={decoded.archive.reading} prepared={currentPrepared}
      program={currentProgram} programMaterials={currentMaterials} historical archive={decoded.archive}
      onPrepare={vi.fn()} onExplore={vi.fn()} onCompareProgramPreparation={compare} onResumeArchivedProgramPreparation={resume} />);

    const archivedPreparation = await screen.findByRole('region', { name: 'Préparation de programme archivée' });
    expect(archivedPreparation).toBeVisible();
    const archivedInput = archivedPreparation.querySelector('[aria-label="Entrée exacte de l’opération 1"]') as HTMLElement;
    expect(archivedInput).toHaveTextContent(/masse inconnue/i);
    expect(archivedInput).toHaveTextContent(/emploi non choisi/i);
    expect(archivedPreparation.querySelector('.hv-decision-preparation__archived-source')).toHaveTextContent(span);
    expect(within(archivedPreparation).getByText('Emploi à choisir')).toBeVisible();
    expect(within(archivedPreparation).queryByRole('button', { name: 'Comparer cette proposition à la référence' })).not.toBeInTheDocument();
    expect(within(archivedPreparation).getByText(/identités de ligne, des matières et des références actives/)).toBeVisible();
    await act(async () => { fireEvent.click(within(archivedPreparation).getByRole('button', { name: 'Reprendre cette préparation dans le contexte actif' })); });
    expect(resume).toHaveBeenCalledTimes(1);
    expect(resume.mock.calls[0][0]).toEqual({ archiveReference: decoded.archive.contentReference,
      preparation: decoded.archive.programPreparation,
      expectedContext: { program: currentProgram, materials: currentMaterials, runtimeReferences: {
        recipeReference: 'recipe-reference:fixture', inputReference: 'input-reference:fixture',
        stockAvailabilityReference: undefined, dataRevision: undefined,
      } } });
    expect(within(archivedPreparation).queryByRole('button', { name: 'Reprendre les choix manquants' })).not.toBeInTheDocument();
    expect(screen.queryByText('Matière actuelle')).not.toBeInTheDocument();
    expect(parserSpy).not.toHaveBeenCalled();
    expect(preparationSpy).not.toHaveBeenCalled();
    expect(compare).not.toHaveBeenCalled();
  });
});

describe('HopV55DecisionReadingArchive', () => {
  it('relit le contenu scellé, accepte une source brouillon exacte et refuse un contenu altéré sans relire le moteur', () => {
    const reading = makeReading([]);
    const readSpy = vi.spyOn(decisionReader, 'readHopV55Question');
    const archive = createHopV55DecisionReadingArchive({
      id: 'decision-reading:draft', ownerKey: 'qa-owner', workspaceId: 'workspace:reading',
      recordedAt: '2026-10-02T12:00:00.000Z', reading: legacyReading(reading),
      source: { kind: 'localFutureDraft', workspaceId: 'workspace:draft', draftId: 'draft:1', revision: 2, contentReference: 'draft:sha256:exact' },
      runtimeReference: 'runtime-reference:exact',
    });
    const read = readHopV55DecisionReadingArchive(archive);
    expect(read).toEqual({ status: 'available', archive });
    expect(archive.reading).not.toBe(reading);
    expect(archive.reading.intent.question).toBe(originalQuestion);
    expect(readSpy).not.toHaveBeenCalled();

    const altered = structuredClone(archive);
    altered.reading.intent.question = 'Question retouchée après la lecture';
    expect(readHopV55DecisionReadingArchive(altered)).toMatchObject({ status: 'invalidRecord' });
    const malformedKnownArchive = { ...archive, format: 'hop-v55-decision-reading-v3' };
    expect(readHopV55DecisionReadingArchive(malformedKnownArchive)).toMatchObject({ status: 'invalidRecord' });
    const futureArchive = { ...archive, format: 'hop-v55-decision-reading-v99' };
    expect(readHopV55DecisionReadingArchive(futureArchive)).toMatchObject({ status: 'unsupportedFormat', raw: futureArchive });
    expect(readSpy).not.toHaveBeenCalled();
  });
});
