import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { HopAdviceOption } from '../../src/domain/hopDecision/adviceSchema';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import { answerHopDecision } from '../../src/domain/hopDecision/service';
import { HOP_COMMERCIAL_PRODUCTS } from '../../src/domain/hopDecision/products';
import type { HopV55QuestionReading } from '../../src/services/hopV55/decision';
import type { HopV55ProgramOperationV1 } from '../../src/services/hopV55/decisionProgramPreparation';
import * as decisionReader from '../../src/services/hopV55/decision';
import * as programPreparationService from '../../src/services/hopV55/decisionProgramPreparation';
import { createHopV55DecisionReadingArchive, createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive, hopV55DecisionReadingForDisplay } from '../../src/services/hopV55/decisionArchive';
import { HopV55DecisionPreparation, HopV55DecisionProgramPreparation, type HopV55QuestionCriterionDraft } from '../../src/ui/hopV55/DecisionPreparation';
import { HopV55DecisionResponse } from '../../src/ui/hopV55/DecisionResponse';

const question = 'Je veux éviter la résine, garder une amertume élevée; le tropical est facultatif.';

function source(text: string) {
  const start = question.indexOf(text);
  if (start < 0) throw Error(`Fixture text missing from question: ${text}`);
  return { start, end: start + text.length, text };
}

function criterionDrafts(): HopV55QuestionCriterionDraft[] {
  return [
    { id: 'criterion-resin', source: source('résine'), term: 'résine', direction: 'investigate', requirement: 'required', familyId: 'resin',
      dimension: 'aroma', reportedProblem: 'Terme à vérifier', origin: 'parser' },
    { id: 'criterion-bitter', source: source('amertume'), term: 'amertume', direction: 'exclude', qualification: 'élevée', requirement: 'required', origin: 'parser' },
    { id: 'criterion-tropical', source: source('tropical'), term: 'tropical', direction: 'exclude', requirement: 'required', familyId: 'tropical', origin: 'parser' },
  ];
}

const program: HopDecisionProgram = { id: 'program:decision-preparation', revision: 4, stage: 'planning', volumeL: 20, wortGravity: null,
  additions: [
    { id: 'addition:saazer', materialId: 'variety:saazer', grams: 40, use: 'boil', status: 'planned', boilMinutes: 60 },
    { id: 'addition:performed', materialId: 'variety:other', grams: 5, use: 'boil', status: 'performed', boilMinutes: 60 },
  ] };

function hopMaterial(id: string, name: string, description?: string): HopDecisionMaterial {
  const source = { title: `Fiche ${name}`, author: 'Catalogue local', year: 2025, kind: 'manufacturer', reference: `source:${id}`, locator: 'Fiche variétale de la fixture.' };
  return { id, name, form: 'unknown', variety: { id, name, form: 'unknown', analysis: [], descriptions: description
    ? [{ text: description, context: 'rawHop', source }] : [] } } as unknown as HopDecisionMaterial;
}

function programReading(questionText = 'Je veux déplacer 20 g de Saazer vers le houblonnage à froid.') : HopV55QuestionReading {
  return { intent: { question: questionText, criteria: [] }, criterionDrafts: [], interpretation: 'La demande est conservée.', branches: [], unresolved: [] };
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('HopV55DecisionPreparation — correction explicite des critères', () => {
  it('conserve les extraits exacts, corrige les relations et laisse le facultatif hors des critères requis', async () => {
    const onPrepareDecision = vi.fn();
    const onDraftChange = vi.fn();
    render(<HopV55DecisionPreparation question={question} criterionDrafts={criterionDrafts()}
      sourceReadingReference="reading:original:sealed" onPrepareDecision={onPrepareDecision} onDraftChange={onDraftChange} />);

    expect(screen.getByText(/Lecture proposée · à vérifier/)).toBeVisible();
    expect(document.querySelector('.hv-decision-preparation__original')).toHaveTextContent(question);
    fireEvent.click(screen.getByText('Vérifier ou corriger les critères · 3'));
    expect(screen.getByText('résine', { selector: 'mark' })).toBeVisible();
    expect(screen.getByText('amertume', { selector: 'mark' })).toBeVisible();
    expect(screen.getByText('tropical', { selector: 'mark' })).toBeVisible();

    fireEvent.change(screen.getByRole('combobox', { name: 'Relation du fragment 1' }), { target: { value: 'exclude' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Relation du fragment 2' }), { target: { value: 'keep' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Relation du fragment 3' }), { target: { value: 'optional' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Précision du fragment 2' }), { target: { value: 'élevée' } });

    expect(screen.getByText(/Les voies affichées plus bas correspondent encore à ces critères d’origine/)).toBeVisible();
    expect(onDraftChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Corriger et recalculer cette lecture' }));

    expect(onPrepareDecision).toHaveBeenCalledTimes(1);
    const request = onPrepareDecision.mock.calls[0][0];
    expect(request.sourceReadingReference).toBe('reading:original:sealed');
    expect(request.criterionDrafts).toMatchObject([
      { id: 'criterion-resin', source: source('résine'), direction: 'exclude', requirement: 'required', familyId: 'resin' },
      { id: 'criterion-bitter', source: source('amertume'), direction: 'keep', qualification: 'élevée', requirement: 'required' },
      { id: 'criterion-tropical', source: source('tropical'), direction: null, requirement: 'optional', familyId: 'tropical' },
    ]);
    expect(request.criterionDrafts.every((row: HopV55QuestionCriterionDraft) => row.origin === 'parser')).toBe(true);
  });

  it('efface une association lexicale quand le terme change et ne modifie pas le fragment source', () => {
    const onPrepareDecision = vi.fn();
    render(<HopV55DecisionPreparation question={question} criterionDrafts={criterionDrafts()}
      sourceReadingReference="reading:original:sealed" onPrepareDecision={onPrepareDecision} />);
    fireEvent.click(screen.getByText('Vérifier ou corriger les critères · 3'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Terme exact du fragment 1' }), { target: { value: 'boisé' } });

    expect(screen.getByText('résine', { selector: 'mark' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Famille documentaire du fragment 1' })).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Corriger et recalculer cette lecture' }));
    expect(onPrepareDecision.mock.calls[0][0].criterionDrafts[0]).toMatchObject({
      term: 'boisé', source: source('résine'), familyId: undefined, dimension: undefined, reportedProblem: undefined,
    });
  });

  it('garde les archives historiques en lecture seule et refuse une correction sans référence de lecture', () => {
    const onPrepareDecision = vi.fn();
    const historical = render(<HopV55DecisionPreparation question={question} criterionDrafts={criterionDrafts()}
      sourceReadingReference="reading:old" historical onPrepareDecision={onPrepareDecision} />);
    fireEvent.click(screen.getByText('Vérifier ou corriger les critères · 3'));
    expect(screen.getByRole('textbox', { name: 'Terme exact du fragment 1' })).toBeDisabled();
    expect(onPrepareDecision).not.toHaveBeenCalled();
    historical.unmount();

    render(<HopV55DecisionPreparation question={question} criterionDrafts={criterionDrafts()} onPrepareDecision={onPrepareDecision} />);
    fireEvent.click(screen.getByText('Vérifier ou corriger les critères · 3'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Terme exact du fragment 1' }), { target: { value: 'résineux' } });
    expect(screen.getByRole('button', { name: 'Corriger et recalculer cette lecture' })).toBeDisabled();
  });

  it('compare une source à une cible exactes avant de demander la convention de dose', () => {
    const saaz = hopMaterial('variety:saazer', 'Saazer', 'La fiche source décrit une note herbacée.');
    const styrian = hopMaterial('variety:styrian-golding', 'Styrian Golding (Celeia)', 'La fiche cible décrit une note florale.');
    const option: HopAdviceOption = {
      id: 'option:replace', reference: 'option-reference:replace', title: 'Comparer Styrian Golding à la ligne Saazer',
      materialIds: [styrian.id], relevance: 'conditional', programScope: { kind: 'addOrReplace', materialIds: [styrian.id], uses: ['boil'], additionIds: ['addition:saazer'], allowAppend: false },
      criterionEffects: [], dimensionEffects: [], exclusions: [], conditions: [], nonConclusions: [], informationRequestIds: [],
    };
    render(<HopV55DecisionProgramPreparation reading={programReading()} sourceReadingReference="reading:corrected"
      program={program} materials={[saaz, styrian]} initialOption={option} onPrepareProgram={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Source → cible · différences documentées' })).toBeVisible();
    expect([...document.querySelectorAll('.hv-decision-preparation__material-comparison>p')]
      .some(node => node.textContent?.includes('Saazer vers Styrian Golding (Celeia)'))).toBe(true);
    const visibleDescriptions = document.querySelector('.hv-decision-preparation__description-pair');
    expect([...visibleDescriptions?.querySelectorAll('blockquote') ?? []].some(node => node.textContent?.includes('La fiche source décrit une note herbacée.'))).toBe(true);
    expect([...visibleDescriptions?.querySelectorAll('blockquote') ?? []].some(node => node.textContent?.includes('La fiche cible décrit une note florale.'))).toBe(true);
    expect(screen.getByText(/Aucune analyse comparative lisible/)).toBeVisible();
    expect(screen.getByRole('combobox', { name: /Mode de dose pour/ })).toHaveValue('');
    expect(screen.queryByRole('button', { name: /Comparer cette proposition/ })).not.toBeInTheDocument();
  });

  it('garde un retrait partiel et un ajout à froid séparés dans une seule soumission incomplète, sans zéro ni simulation', () => {
    const saaz = hopMaterial('variety:saazer', 'Saazer');
    const styrian = hopMaterial('variety:styrian-golding', 'Styrian Golding (Celeia)');
    const submit = vi.fn();
    const compare = vi.fn();
    render(<HopV55DecisionProgramPreparation reading={programReading()} sourceReadingReference="reading:corrected"
      program={program} materials={[saaz, styrian]} onPrepareProgram={submit} onCompareProgramPreparation={compare} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Type du nouveau geste' }), { target: { value: 'remove' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Ligne source de l’opération/ }), { target: { value: 'addition:saazer' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Quantité à retirer/ }), { target: { value: 'partial' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Masse à retirer/ }), { target: { value: '20' } });

    fireEvent.change(screen.getByRole('combobox', { name: 'Type du nouveau geste' }), { target: { value: 'add' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Identité cible de l’opération/ }), { target: { value: 'variety:styrian-golding' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Masse à ajouter/ }), { target: { value: 'abc' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Emploi de l’opération/ }), { target: { value: 'postFermentation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' }));

    expect(submit).toHaveBeenCalledTimes(1);
    const request = submit.mock.calls[0][0];
    expect(request.sourceReadingReference).toBe('reading:corrected');
    expect(request.operations).toHaveLength(2);
    expect(request.operations[0]).toMatchObject({ kind: 'remove', additionId: 'addition:saazer', quantity: { kind: 'partial', grams: 20 } });
    expect(request.operations[1]).toMatchObject({ kind: 'add', materialId: 'variety:styrian-golding', grams: null, use: 'postFermentation' });
    expect(request.operations[1].conditions).toBeUndefined();
    expect(compare).not.toHaveBeenCalled();
    expect(screen.getByText(/Aucun changement n’est appliqué à la recette/)).toBeVisible();
  });

  it('rend une préparation needsInput archivée avec ses opérations et besoins exacts, puis reprend le premier choix sans J5', () => {
    const saaz = hopMaterial('variety:saazer', 'Saazer');
    const styrian = hopMaterial('variety:styrian-golding', 'Styrian Golding (Celeia)');
    const questionText = 'Retirer 20 g de Saazer côté moût puis ajouter à cru de Styrian sans dose ni phase précises.';
    const removeSpan = 'Retirer 20 g de Saazer côté moût';
    const addSpan = 'ajouter à cru de Styrian sans dose ni phase précises';
    const operations: HopV55ProgramOperationV1[] = [
      { id: 'operation:remove-20', label: 'Retirer une partie de la ligne prévue', kind: 'remove', additionId: 'addition:saazer',
        sourceMaterialId: saaz.id, sourceUse: 'boil', sourceScope: 'hotSide', quantity: { kind: 'partial', grams: 20 },
        sourceSpan: { start: questionText.indexOf(removeSpan), end: questionText.indexOf(removeSpan) + removeSpan.length, text: removeSpan } },
      { id: 'operation:add-cold', label: 'Ajouter à froid', kind: 'add', additionId: 'scenario-hop:cold', materialId: styrian.id,
        grams: null, targetScope: 'coldSide', sourceSpan: { start: questionText.indexOf(addSpan), end: questionText.indexOf(addSpan) + addSpan.length, text: addSpan } },
    ];
    const input = { branch: { id: 'branch:incomplete', label: 'Retrait et ajout à froid' }, program,
      materials: [saaz, styrian], intent: { question: questionText, interpretation: 'Deux opérations proposées.', criteria: [] }, operations };
    const result = programPreparationService.prepareHopV55DecisionProgram(input);
    expect(result.status).toBe('needsInput');
    expect(result.branch).toBeUndefined();
    expect(result.needs.length).toBeGreaterThan(0);
    const onPrepareProgram = vi.fn();
    const onCompareProgramPreparation = vi.fn();

    render(<HopV55DecisionProgramPreparation reading={programReading(questionText)} sourceReadingReference="reading:incomplete"
      program={program} materials={[saaz, styrian]} preparation={{ input, result }} preparationReference="reading:incomplete-v2"
      onPrepareProgram={onPrepareProgram} onCompareProgramPreparation={onCompareProgramPreparation} />);

    const archive = screen.getByRole('region', { name: 'Préparation de programme archivée' });
    expect(archive).toBeVisible();
    expect(within(archive).getByText('Préparation incomplète')).toBeVisible();
    expect(archive.querySelector('.hv-decision-preparation__archived-source')).toHaveTextContent(removeSpan);
    expect(archive.querySelectorAll('.hv-decision-preparation__archived-source')[1]).toHaveTextContent(addSpan);
    expect(archive.querySelector('[aria-label="Entrée exacte de l’opération 1"]')).toHaveTextContent(/Retirer 20 g/);
    const archivedInput = archive.querySelector('[aria-label="Entrée exacte de l’opération 2"]') as HTMLElement;
    expect(archivedInput).toBeInTheDocument();
    expect(archivedInput).toHaveTextContent(/masse inconnue/i);
    expect(archivedInput).toHaveTextContent(/emploi non choisi/i);
    expect(within(archive).getByText('Emploi à choisir')).toBeVisible();
    expect(within(archive).getByText(/Aucune branche n’a été créée/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reprendre les choix manquants' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Comparer cette proposition à la référence' })).not.toBeInTheDocument();
    expect(onPrepareProgram).not.toHaveBeenCalled();
    expect(onCompareProgramPreparation).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les choix manquants' }));
    const focusedOperation = document.activeElement?.closest('[data-operation-id]');
    expect(focusedOperation).toHaveAttribute('data-operation-id', 'operation:add-cold');
    expect(document.activeElement?.tagName).toMatch(/INPUT|SELECT/);
    expect(onPrepareProgram).not.toHaveBeenCalled();
    expect(onCompareProgramPreparation).not.toHaveBeenCalled();
  });

  it('transmet une préparation archivée incomplète intacte pour une reprise contrôlée dans le contexte actif', async () => {
    const sourceA = hopMaterial('fixture:source-a', 'Identité fictive A');
    const hallertau = hopMaterial('variety:hallertau-blanc', 'Hallertau Blanc');
    const questionText = 'Remplacer la ligne A par Hallertau Blanc sans fixer la dose.';
    const sourceSpan = 'Remplacer la ligne A par Hallertau Blanc';
    const archivedProgram: HopDecisionProgram = { ...program, id: 'program:archived', revision: 4, additions: [
      { id: 'addition:source-a', materialId: sourceA.id, grams: 40, use: 'boil', status: 'planned', boilMinutes: 5 },
    ] };
    const currentProgram: HopDecisionProgram = { ...archivedProgram, revision: 5 };
    const operations: HopV55ProgramOperationV1[] = [{ id: 'operation:replace-a', label: 'Remplacer A par Hallertau Blanc', kind: 'replace',
      additionId: 'addition:source-a', sourceMaterialId: sourceA.id, sourceUse: 'boil', materialId: hallertau.id,
      dose: { kind: 'explicit', grams: null },
      sourceSpan: { start: questionText.indexOf(sourceSpan), end: questionText.indexOf(sourceSpan) + sourceSpan.length, text: sourceSpan } }];
    const input = { branch: { id: 'branch:incomplete-replacement', label: 'Remplacement à compléter' }, program: archivedProgram,
      materials: [sourceA, hallertau], intent: { question: questionText, interpretation: 'La masse exacte reste inconnue.', criteria: [] }, operations };
    const result = programPreparationService.prepareHopV55DecisionProgram(input);
    expect(result.status).toBe('needsInput');
    expect(result.needs.map(need => need.field)).toEqual(['quantity']);
    const preparation = { input, result };
    const preparationSnapshot = structuredClone(preparation);
    const expectedContext = { program: currentProgram, materials: [sourceA, hallertau], runtimeReferences: {
      recipeReference: 'recipe:active-v5', inputReference: 'input:active-v5', stockAvailabilityReference: 'stock:active-v5', dataRevision: 'catalogue:active-v5',
    } };
    const onResume = vi.fn(request => {
      const reevaluated = programPreparationService.prepareHopV55DecisionProgram({
        ...request.preparation.input,
        program: request.expectedContext.program,
        materials: request.expectedContext.materials,
        operations: request.preparation.input.operations,
      });
      expect(reevaluated.status).toBe('needsInput');
      expect(reevaluated.needs.map(need => need.field)).toEqual(['quantity']);
      expect(reevaluated.operations[0]).toMatchObject({ additionId: 'addition:source-a', sourceMaterialId: sourceA.id,
        materialId: hallertau.id, dose: { kind: 'explicit', grams: null } });
    });
    const onCompareProgramPreparation = vi.fn();
    const onPrepareProgram = vi.fn();

    const view = render(<HopV55DecisionProgramPreparation reading={programReading(questionText)} sourceReadingReference="reading:archived"
      program={currentProgram} materials={[sourceA, hallertau]} preparation={preparation} preparationReference="archive:exact:content-ref"
      historical resumeExpectedContext={expectedContext} onResumeArchivedProgramPreparation={onResume}
      onPrepareProgram={onPrepareProgram} onCompareProgramPreparation={onCompareProgramPreparation} />);

    const archive = screen.getByRole('region', { name: 'Préparation de programme archivée' });
    expect(archive).toHaveTextContent('Identité fictive A vers Hallertau Blanc');
    expect(archive.querySelector('[aria-label="Entrée exacte de l’opération 1"]')).toHaveTextContent(/masse inconnue/i);
    expect(within(archive).getByText('Quantité à préciser')).toBeVisible();
    expect(within(archive).getByRole('button', { name: 'Reprendre cette préparation dans le contexte actif' })).toBeVisible();
    expect(within(archive).queryByRole('button', { name: /Comparer cette proposition/ })).not.toBeInTheDocument();

    await act(async () => { fireEvent.click(within(archive).getByRole('button', { name: 'Reprendre cette préparation dans le contexte actif' })); });

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onResume.mock.calls[0][0]).toEqual({ archiveReference: 'archive:exact:content-ref', preparation: preparationSnapshot, expectedContext });
    expect(onPrepareProgram).not.toHaveBeenCalled();
    expect(onCompareProgramPreparation).not.toHaveBeenCalled();
    expect(preparation).toEqual(preparationSnapshot);
    expect(archive).toHaveTextContent('Identité fictive A vers Hallertau Blanc');

    view.unmount();
    render(<HopV55DecisionProgramPreparation reading={programReading(questionText)} materials={[sourceA, hallertau]}
      preparation={preparation} preparationReference="archive:exact:content-ref" historical
      onResumeArchivedProgramPreparation={onResume} />);
    expect(screen.queryByRole('button', { name: 'Reprendre cette préparation dans le contexte actif' })).not.toBeInTheDocument();
    expect(screen.getByText(/la référence de cette archive ou le programme actif exact manque/)).toBeVisible();
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('reprend des opérations sourcespanned sans perdre 20 g et laisse dose/phase de l’ajout froid inconnues', () => {
    const questionText = 'Dans ma blanche, enlever 20 g de Saazer côté moût et ajouter du houblon à froid.';
    const removeSpan = 'enlever 20 g de Saazer côté moût';
    const addSpan = 'ajouter du houblon à froid';
    const operations: HopV55ProgramOperationV1[] = [
      { id: 'operation:remove-20', label: 'Retirer 20 g du moût', kind: 'remove', additionId: 'addition:saazer',
        sourceMaterialId: 'variety:saazer', sourceUse: 'boil', sourceScope: 'hotSide', quantity: { kind: 'partial', grams: 20 },
        sourceSpan: { start: questionText.indexOf(removeSpan), end: questionText.indexOf(removeSpan) + removeSpan.length, text: removeSpan } },
      { id: 'operation:add-cold', label: 'Ajouter à froid', kind: 'add', additionId: 'scenario-hop:cold', grams: null,
        targetScope: 'coldSide', sourceSpan: { start: questionText.indexOf(addSpan), end: questionText.indexOf(addSpan) + addSpan.length, text: addSpan } },
    ];
    const seedArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:q04-seed', ownerKey: 'qa-owner', workspaceId: 'workspace:q04',
      recordedAt: '2026-10-02T15:10:00.000Z', reading: { ...programReading(questionText), operationDrafts: operations },
      source: { kind: 'recipe', id: 'recipe:q04' }, runtimeReference: 'runtime:q04' });
    const seedRead = readHopV55DecisionReadingArchive(seedArchive);
    expect(seedRead.status).toBe('available');
    if (seedRead.status !== 'available' || seedRead.archive.format !== 'hop-v55-decision-reading-v2') throw Error('V2 operation seed archive expected.');
    expect(seedRead.archive.reading.operationDrafts?.[0]).toMatchObject({ sourceScope: 'hotSide', quantity: { kind: 'partial', grams: 20 }, sourceSpan: { text: removeSpan } });
    expect(seedRead.archive.reading.operationDrafts?.[1]).toMatchObject({ targetScope: 'coldSide', grams: null, sourceSpan: { text: addSpan } });
    const submit = vi.fn();
    render(<HopV55DecisionProgramPreparation reading={programReading(questionText)} sourceReadingReference="reading:q04"
      program={program} materials={[hopMaterial('variety:saazer', 'Saazer'), hopMaterial('variety:styrian-golding', 'Styrian Golding')]}
      operationDrafts={operations} onPrepareProgram={submit} />);

    expect(screen.getByDisplayValue('20')).toBeVisible();
    expect(screen.getByText(removeSpan, { selector: 'mark' })).toBeVisible();
    expect(screen.getByText(addSpan, { selector: 'mark' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: /Portée du côté d’emploi de l’opération operation:add-cold/ })).toHaveValue('coldSide');
    expect(screen.getByRole('combobox', { name: /Emploi de l’opération operation:add-cold/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Masse à ajouter pour l’opération operation:add-cold/ })).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' }));

    expect(submit).toHaveBeenCalledTimes(1);
    const request = submit.mock.calls[0][0];
    expect(request.operations[0]).toMatchObject({ quantity: { kind: 'partial', grams: 20 }, sourceSpan: { text: removeSpan } });
    expect(request.operations[1]).toMatchObject({ grams: null, sourceSpan: { text: addSpan } });
    expect(request.operations[1].use).toBeUndefined();

    const historicReading = { ...programReading(questionText), operationDrafts: operations };
    render(<HopV55DecisionResponse reading={historicReading} prepared={{ runtime: { materials: [], engineData: { varieties: [], lots: [], knowledge: [] }, current: undefined },
      limitations: [], provenance: [], version: 'brewing-scenario-context-v1' } as never} historical onPrepare={vi.fn()} onExplore={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Opérations proposées par lecture' })).toBeVisible();
    expect(screen.getByText(/Retirer 20 g · côté chaud/)).toBeVisible();
    expect(screen.getByText(/Ajouter masse inconnue · emploi à choisir · côté froid/)).toBeVisible();
    expect(screen.getByText(/Aucune recette ou simulation n’est modifiée/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Comparer cette proposition à la référence' })).not.toBeInTheDocument();
  });

  it('ne choisit pas entre deux lignes source compatibles et n’affiche la paire exacte qu’après le choix', () => {
    const saaz = hopMaterial('variety:saazer', 'Saazer', 'Source documentaire Saazer.');
    const styrian = hopMaterial('variety:styrian-golding', 'Styrian Golding', 'Cible documentaire Styrian.');
    const multipleProgram: HopDecisionProgram = { ...program, additions: [
      { id: 'addition:saazer:boil', materialId: saaz.id, grams: 20, use: 'boil', status: 'planned', boilMinutes: 60 },
      { id: 'addition:saazer:whirlpool', materialId: saaz.id, grams: 10, use: 'whirlpool', status: 'planned', contactHours: 1, temperatureC: 85 },
    ] };
    const operations: HopV55ProgramOperationV1[] = [{ id: 'operation:replace', label: 'Remplacer Saazer par Styrian', kind: 'replace',
      sourceMaterialId: saaz.id, sourceScope: 'hotSide', materialId: styrian.id }];
    render(<HopV55DecisionProgramPreparation reading={programReading()} sourceReadingReference="reading:ambiguous-source"
      program={multipleProgram} materials={[saaz, styrian]} operationDrafts={operations} onPrepareProgram={vi.fn()} />);

    const sourceSelect = screen.getByRole('combobox', { name: 'Ligne source de l’opération operation:replace' });
    expect(sourceSelect).toHaveValue('');
    expect(screen.queryByRole('heading', { name: 'Source → cible · différences documentées' })).not.toBeInTheDocument();
    fireEvent.change(sourceSelect, { target: { value: 'addition:saazer:whirlpool' } });
    expect(screen.getByRole('heading', { name: 'Source → cible · différences documentées' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: /Mode de dose pour l’opération operation:replace/ })).toHaveValue('');
  });

  it('distingue une fiche canonique des deux identités de ligne liées par varietyId sans sélectionner leurs lignes', () => {
    const varietyId = 'catalogue:styrian-fixture-id';
    const withVarietyId = (id: string): HopDecisionMaterial => {
      const row = hopMaterial(id, 'Styrian Golding');
      return { ...row, variety: { ...row.variety!, id: varietyId } };
    };
    const copiedLine0 = withVarietyId('recipe-copy:recipe-hop:0');
    const copiedLine1 = withVarietyId('recipe-copy:recipe-hop:1');
    const canonical = withVarietyId('variety:catalogue-styrian');
    const copyProgram: HopDecisionProgram = { ...program, id: 'program:q06-copy-same-variety', additions: [
      { id: 'recipe-hop:0', materialId: copiedLine0.id, grams: 20, use: 'boil', status: 'planned', boilMinutes: 5 },
      { id: 'recipe-hop:1', materialId: copiedLine1.id, grams: 30, use: 'fermentation', status: 'planned', contactHours: 48, temperatureC: 19 },
    ] };
    const questionText = 'Ce houblon manque, avec quoi le remplacer ?';
    const operation: HopV55ProgramOperationV1 = { id: 'operation:unavailable-same-variety',
      label: 'Examiner une matière indisponible', kind: 'replaceUnavailable' };
    const submit = vi.fn();
    render(<HopV55DecisionProgramPreparation reading={programReading(questionText)} sourceReadingReference="reading:unavailable-same-variety"
      program={copyProgram} materials={[copiedLine0, copiedLine1, canonical]} operationDrafts={[operation]} onPrepareProgram={submit} />);

    const source = screen.getByRole('combobox', { name: 'Source indisponible exacte pour operation:unavailable-same-variety' });
    expect(source).toHaveValue('');
    const options = [...source.querySelectorAll('option')];
    const line0Label = options.find(option => option.value === copiedLine0.id)?.textContent ?? '';
    const line1Label = options.find(option => option.value === copiedLine1.id)?.textContent ?? '';
    const canonicalLabel = options.find(option => option.value === canonical.id)?.textContent ?? '';
    expect(line0Label).toContain('recipe-hop:0');
    expect(line0Label).toContain('20 g');
    expect(line0Label).toContain('Ébullition');
    expect(line1Label).toContain('recipe-hop:1');
    expect(line1Label).toContain('30 g');
    expect(line1Label).toContain('Fermentation active');
    expect(canonicalLabel).toContain('Fiche sans ligne exacte');
    expect(canonicalLabel).toContain(`varietyId ${varietyId}`);
    expect(canonicalLabel).toContain('recipe-hop:0');
    expect(canonicalLabel).toContain('recipe-hop:1');
    expect(new Set([copiedLine0.id, copiedLine1.id, canonical.id]).size).toBe(3);

    fireEvent.change(source, { target: { value: canonical.id } });
    expect(source).toHaveValue(canonical.id);
    const basis = screen.getByRole('region', { name: 'Conventions de remplacement par emploi' });
    expect(within(basis).getByText(/La fiche choisie n’est portée par aucune ligne exacte du programme/)).toBeVisible();
    const linked = within(basis).getByRole('region', { name: 'Lignes prévues liées par varietyId' });
    expect(linked).toHaveTextContent('recipe-hop:0');
    expect(linked).toHaveTextContent('20 g');
    expect(linked).toHaveTextContent('Ébullition');
    expect(linked).toHaveTextContent('recipe-hop:1');
    expect(linked).toHaveTextContent('30 g');
    expect(linked).toHaveTextContent('Fermentation active');
    expect(within(basis).queryByRole('combobox', { name: /Convention/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0].operations[0]).toMatchObject({ kind: 'replaceUnavailable', sourceMaterialId: canonical.id });
    expect(submit.mock.calls[0][0].operations[0].coverage).toBeUndefined();
    expect(submit.mock.calls[0][0].operations[0].basisByUse).toBeUndefined();
  });

  it('refuse la ligne partielle, puis choisit explicitement toute la portée, chaque emploi et une voie du planificateur', async () => {
    const styrian = hopMaterial('variety:hopsteiner-sgc', 'Styrian Golding (Celeia)');
    const saazer = hopMaterial('variety:hopsteiner-saz', 'Saazer');
    const source22Program: HopDecisionProgram = { ...program, id: 'copy:q04-source22', additions: [
      { id: 'recipe-hop:0', materialId: styrian.id, grams: 20, use: 'boil', status: 'planned', boilMinutes: 5 },
      { id: 'recipe-hop:1', materialId: styrian.id, grams: 30, use: 'fermentation', status: 'planned', contactHours: 48, temperatureC: 19 },
    ] };
    const questionText = 'J’ai ce houblon conseillé dans ma recette mais je l’ai actuellement pas disponible, avec quoi le mettre. Qu’est-ce que je gagne ou perds ?';
    const operation: HopV55ProgramOperationV1 = { id: 'operation:q06-unavailable', label: 'Remplacer le houblon indisponible', kind: 'replaceUnavailable' };
    const intent = { question: questionText, interpretation: 'Matière indisponible déclarée; source et convention à choisir.', criteria: [] };
    const baseInput = { branch: { id: 'branch:q06', label: 'Remplacement à examiner' }, program: source22Program,
      materials: [styrian, saazer], intent, operations: [operation] };
    const initial = programPreparationService.prepareHopV55DecisionProgram(baseInput);
    expect(initial.status).toBe('needsInput');
    expect(initial.branch).toBeUndefined();

    let latestPreparation: { input: typeof baseInput; result: ReturnType<typeof programPreparationService.prepareHopV55DecisionProgram> } | undefined;
    const savePreparation = vi.fn((request: { sourceReadingReference: string; branchLabel: string; operations: HopV55ProgramOperationV1[] }) => {
      const input = { ...baseInput, branch: { ...baseInput.branch, label: request.branchLabel }, operations: request.operations };
      latestPreparation = { input, result: programPreparationService.prepareHopV55DecisionProgram(input) };
    });
    const response = programReading(questionText);
    response.interpretation = intent.interpretation;
    const onCompareProgramPreparation = vi.fn();
    const saveCountBefore = () => savePreparation.mock.calls.length;
    const makeArchive = (id: string, recordedAt: string) => createHopV55DecisionReadingArchiveV2({ id, ownerKey: 'qa:q06', workspaceId: 'workspace:q06',
      recordedAt, reading: response, source: { kind: 'recipe', id: 'copy:q04-source22' }, runtimeReference: 'runtime:source22',
      programPreparation: latestPreparation! });
    const readPreparation = (archive: ReturnType<typeof makeArchive>) => {
      const read = readHopV55DecisionReadingArchive(archive);
      expect(read.status).toBe('available');
      if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v2') throw Error('Archive V2 de Q06 attendue.');
      return read.archive.programPreparation!;
    };
    const view = render(<HopV55DecisionProgramPreparation reading={response} sourceReadingReference="reading:q06-source22"
      program={source22Program} materials={baseInput.materials} operationDrafts={[operation]} onPrepareProgram={savePreparation}
      onCompareProgramPreparation={onCompareProgramPreparation} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Source indisponible exacte pour operation:q06-unavailable' }),
      { target: { value: styrian.id } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Portée de la substitution operation:q06-unavailable' }),
      { target: { value: 'selectedLines' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Ligne concernée par la substitution operation:q06-unavailable' }),
      { target: { value: 'recipe-hop:0' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif d’indisponibilité operation:q06-unavailable' }),
      { target: { value: 'Matière indiquée indisponible pour cette copie; aucun relevé de stock ou de lot.' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Matière candidate exacte à ajouter pour operation:q06-unavailable' }),
      { target: { value: saazer.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter cette identité candidate' }));

    const basisSection = screen.getByRole('region', { name: 'Conventions de remplacement par emploi' });
    expect(within(basisSection).getByText(/Ligne ciblée · recipe-hop:0 · Ébullition/)).toBeVisible();
    const boilBasis = within(basisSection).getByRole('combobox', { name: 'Convention Ébullition pour operation:q06-unavailable' });
    expect(boilBasis).toHaveValue('');
    expect(within(basisSection).queryByRole('combobox', { name: 'Convention Fermentation active pour operation:q06-unavailable' })).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' })); });
    expect(savePreparation).toHaveBeenCalledTimes(1);
    expect(latestPreparation?.input.operations[0]).toMatchObject({ kind: 'replaceUnavailable', sourceMaterialId: styrian.id,
      coverage: { kind: 'selectedLines', additionIds: ['recipe-hop:0'] }, candidateMaterialIds: [saazer.id] });
    expect(latestPreparation?.input.operations[0]).not.toHaveProperty('basisByUse');
    expect(latestPreparation?.result.needs).toContainEqual(expect.objectContaining({ operationId: operation.id, field: 'basis' }));
    expect(latestPreparation?.result.branch).toBeUndefined();

    const archiveWithoutBasis = makeArchive('reading:q06-basis-empty', '2026-10-03T12:00:00.000Z');
    const firstPreparation = readPreparation(archiveWithoutBasis);
    expect(firstPreparation.input.operations[0]).not.toHaveProperty('basisByUse');
    view.unmount();

    const firstResume = render(<HopV55DecisionProgramPreparation reading={response} sourceReadingReference="reading:q06-source22"
      program={source22Program} materials={baseInput.materials} preparation={firstPreparation}
      preparationReference={archiveWithoutBasis.contentReference} onPrepareProgram={savePreparation}
      onCompareProgramPreparation={onCompareProgramPreparation} />);
    const firstBoil = screen.getByRole('combobox', { name: 'Convention Ébullition pour operation:q06-unavailable' });
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les choix manquants' }));
    expect(document.activeElement).toBe(firstBoil);
    expect(firstBoil).toHaveValue('');
    fireEvent.change(firstBoil, { target: { value: 'sameMass' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' })); });
    expect(savePreparation).toHaveBeenCalledTimes(2);
    expect(latestPreparation?.input.operations[0]).toMatchObject({ basisByUse: { boil: 'sameMass' },
      coverage: { kind: 'selectedLines', additionIds: ['recipe-hop:0'] } });
    expect(latestPreparation?.result.evaluations[0].planner?.affectedAdditionIds).toEqual(['recipe-hop:0', 'recipe-hop:1']);
    expect(latestPreparation?.result.evaluations[0].needs).toContainEqual(expect.objectContaining({ field: 'coverage' }));
    expect(latestPreparation?.result.evaluations[0].needs).not.toContainEqual(expect.objectContaining({ field: 'replacementPath' }));
    expect(latestPreparation?.result.branch).toBeUndefined();

    const partialCoverageArchive = makeArchive('reading:q06-partial-coverage', '2026-10-03T12:05:00.000Z');
    const partialCoveragePreparation = readPreparation(partialCoverageArchive);
    firstResume.unmount();
    const partialResume = render(<HopV55DecisionProgramPreparation reading={response} sourceReadingReference="reading:q06-source22"
      program={source22Program} materials={baseInput.materials} preparation={partialCoveragePreparation}
      preparationReference={partialCoverageArchive.contentReference} onPrepareProgram={savePreparation}
      onCompareProgramPreparation={onCompareProgramPreparation} />);
    const coverageWarning = screen.getByRole('region', { name: 'Portée des lignes évaluées' });
    expect(coverageWarning).toHaveTextContent('recipe-hop:0');
    expect(coverageWarning).toHaveTextContent('recipe-hop:1');
    expect(screen.queryByRole('combobox', { name: 'Voie de remplacement pour operation:q06-unavailable' })).not.toBeInTheDocument();
    const scope = screen.getByRole('combobox', { name: 'Portée de la substitution operation:q06-unavailable' });
    expect(scope).toHaveValue('selectedLines');
    fireEvent.change(scope, { target: { value: 'allFuture' } });
    expect(screen.queryByRole('combobox', { name: 'Voie de remplacement pour operation:q06-unavailable' })).not.toBeInTheDocument();
    expect(screen.getByText(/Réévalue les choix avant d’ouvrir une voie/)).toBeVisible();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' })); });
    expect(savePreparation).toHaveBeenCalledTimes(3);
    expect(latestPreparation?.input.operations[0]).toMatchObject({ coverage: { kind: 'allFuture' }, basisByUse: { boil: 'sameMass' } });
    expect(latestPreparation?.result.evaluations[0].needs).toContainEqual(expect.objectContaining({ field: 'replacementPath' }));
    const pathWithUnresolvedUse = latestPreparation?.result.evaluations[0].planner?.paths[0];
    expect(pathWithUnresolvedUse).toBeDefined();
    expect(pathWithUnresolvedUse?.assignments.find(assignment => assignment.use === 'fermentation')).toMatchObject({ basis: null,
      doseGrams: { status: 'unknown' } });
    expect(latestPreparation?.result.branch).toBeUndefined();

    const allFutureNeedArchive = makeArchive('reading:q06-all-uses-need-basis', '2026-10-03T12:10:00.000Z');
    const allFutureNeedPreparation = readPreparation(allFutureNeedArchive);
    partialResume.unmount();
    const allFutureResume = render(<HopV55DecisionProgramPreparation reading={response} sourceReadingReference="reading:q06-source22"
      program={source22Program} materials={baseInput.materials} preparation={allFutureNeedPreparation}
      preparationReference={allFutureNeedArchive.contentReference} onPrepareProgram={savePreparation}
      onCompareProgramPreparation={onCompareProgramPreparation} />);
    const allBasis = screen.getByRole('region', { name: 'Conventions de remplacement par emploi' });
    const retainedBoil = within(allBasis).getByRole('combobox', { name: 'Convention Ébullition pour operation:q06-unavailable' });
    const missingFermentation = within(allBasis).getByRole('combobox', { name: 'Convention Fermentation active pour operation:q06-unavailable' });
    expect(retainedBoil).toHaveValue('sameMass');
    expect(missingFermentation).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les choix manquants' }));
    expect(document.activeElement).toBe(missingFermentation);
    fireEvent.change(missingFermentation, { target: { value: 'sameMass' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' })); });
    expect(savePreparation).toHaveBeenCalledTimes(4);
    expect(latestPreparation?.input.operations[0]).toMatchObject({ basisByUse: { boil: 'sameMass', fermentation: 'sameMass' },
      coverage: { kind: 'allFuture' }, candidateMaterialIds: [saazer.id] });
    expect(latestPreparation?.result.status).toBe('needsInput');
    expect(latestPreparation?.result.evaluations[0].needs).toContainEqual(expect.objectContaining({ field: 'replacementPath' }));
    expect(latestPreparation?.result.branch).toBeUndefined();

    const pathArchive = makeArchive('reading:q06-path-choice', '2026-10-03T12:15:00.000Z');
    const pathPreparation = readPreparation(pathArchive);
    const planner = latestPreparation!.result.evaluations[0].planner!;
    expect(planner.paths.length).toBeGreaterThan(0);
    const selectedPath = planner.paths.find(path => path.complete && path.applicability !== 'unavailable');
    expect(selectedPath).toBeDefined();
    expect(selectedPath!.assignments.map(assignment => assignment.additionId).sort()).toEqual(['recipe-hop:0', 'recipe-hop:1']);
    expect(selectedPath!.assignments.every(assignment => assignment.candidateMaterialId === saazer.id)).toBe(true);
    allFutureResume.unmount();
    const pathResume = render(<HopV55DecisionProgramPreparation reading={response} sourceReadingReference="reading:q06-source22"
      program={source22Program} materials={baseInput.materials} preparation={pathPreparation}
      preparationReference={pathArchive.contentReference} onPrepareProgram={savePreparation}
      onCompareProgramPreparation={onCompareProgramPreparation} />);
    const pathEditor = screen.getByRole('region', { name: 'Voies de remplacement calculées' });
    const pathSelect = within(pathEditor).getByRole('combobox', { name: 'Voie de remplacement pour operation:q06-unavailable' });
    expect(pathSelect).toHaveValue('');
    fireEvent.change(pathSelect, { target: { value: selectedPath!.pathId } });
    expect(pathSelect).toHaveValue(selectedPath!.pathId);
    const selectedPathDetails = within(pathEditor).getByRole('article', { name: 'Détails de la voie choisie' });
    expect(selectedPathDetails).toHaveTextContent('recipe-hop:0');
    expect(selectedPathDetails).toHaveTextContent('recipe-hop:1');
    expect(selectedPathDetails).toHaveTextContent(saazer.id);
    expect(selectedPathDetails).toHaveTextContent('Ébullition');
    expect(selectedPathDetails).toHaveTextContent('Fermentation active');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' })); });
    expect(savePreparation).toHaveBeenCalledTimes(5);
    expect(latestPreparation?.result.status).toBe('ready');
    expect(latestPreparation?.result.branch?.programChanges).toHaveLength(2);
    expect(latestPreparation?.result.proposal?.program.additions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'recipe-hop:0', materialId: saazer.id, use: 'boil', grams: 20 }),
      expect.objectContaining({ id: 'recipe-hop:1', materialId: saazer.id, use: 'fermentation', grams: 30 }),
    ]));
    expect(onCompareProgramPreparation).not.toHaveBeenCalled();

    const readyArchive = makeArchive('reading:q06-ready', '2026-10-03T12:20:00.000Z');
    const readyPreparation = readPreparation(readyArchive);
    pathResume.unmount();
    render(<HopV55DecisionProgramPreparation reading={response} sourceReadingReference="reading:q06-source22"
      program={source22Program} materials={baseInput.materials} preparation={readyPreparation}
      preparationReference={readyArchive.contentReference} onCompareProgramPreparation={onCompareProgramPreparation} />);
    expect(screen.getByRole('heading', { name: 'Programme proposé · application distincte' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Comparer cette proposition à la référence' }));
    expect(onCompareProgramPreparation).toHaveBeenCalledWith({ preparationReference: readyArchive.contentReference });
  });

  it('scelle V2 correction, produits et opération incomplète puis la relit sans moteur ni contexte actif', () => {
    const correctedCriterion = { id: 'criterion-resin', description: 'Éviter la résine', role: 'avoid' as const, origin: 'user' as const, familyId: 'resin' };
    const correctedReading: HopV55QuestionReading = {
      intent: { question, criteria: [{ id: 'criterion-resin', label: 'Éviter · résine', direction: 'exclude', familyId: 'resin' }] },
      criterionDrafts: [{ id: 'criterion-resin', source: source('résine'), term: 'résine', direction: 'exclude', qualification: 'élevée',
        requirement: 'required', familyId: 'resin', dimension: 'aroma', origin: 'brasseur' }],
      correction: { sourceReadingReference: 'reading:source', recordedAt: '2026-10-02T15:00:00.000Z', actor: { label: 'Brasseur' }, changedCriterionIds: ['criterion-resin'] },
      interpretation: 'Lecture corrigée par le brasseur; aucune intensité ni effet de bière ne sont déduits.',
      response: answerHopDecision({ intent: { originalQuestion: question, criteria: [correctedCriterion] }, action: { kind: 'understandProducts', productIds: ['ych-cryo-hops'] },
        materials: [], products: HOP_COMMERCIAL_PRODUCTS }),
      branches: [], unresolved: [],
    };
    const sourceMaterial = hopMaterial('variety:saazer', 'Saazer');
    const targetMaterial = hopMaterial('variety:styrian', 'Styrian Golding (Celeia)');
    const input = { branch: { id: 'branch:replacement', label: 'Remplacement à examiner' }, program,
      materials: [sourceMaterial, targetMaterial], intent: { question, interpretation: correctedReading.interpretation, criteria: [correctedCriterion] },
      operations: [{ id: 'operation:replace', label: 'Remplacer la ligne Saazer', kind: 'replace' as const,
        additionId: 'addition:saazer', sourceMaterialId: sourceMaterial.id, sourceUse: 'boil' as const, materialId: targetMaterial.id }] };
    const result = programPreparationService.prepareHopV55DecisionProgram(input);
    expect(result.status).toBe('needsInput');
    expect(result.branch).toBeUndefined();
    expect(result.evaluations[0].comparison).toBeDefined();
    expect(result.needs.map(row => row.field)).toContain('basis');
    const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:corrected', ownerKey: 'qa-owner', workspaceId: 'workspace:decision',
      recordedAt: '2026-10-02T15:01:00.000Z', reading: correctedReading,
      source: { kind: 'recipe', id: 'recipe:source' }, runtimeReference: 'runtime:source', programPreparation: { input, result } });

    const readerSpy = vi.spyOn(decisionReader, 'readHopV55Question');
    const preparationSpy = vi.spyOn(programPreparationService, 'prepareHopV55DecisionProgram');
    const read = readHopV55DecisionReadingArchive(archive);
    expect(read.status).toBe('available');
    if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v2') throw Error('V2 archive expected.');
    expect(read.archive.contentReference).toBe(archive.contentReference);
    expect(read.archive.reading.criterionDrafts[0]).toMatchObject({ term: 'résine', direction: 'exclude', origin: 'brasseur' });
    expect(read.archive.programPreparation?.result.status).toBe('needsInput');
    expect(read.archive.programPreparation?.result.evaluations[0].comparison?.rightId).toBe(targetMaterial.id);
    expect(read.archive.reading.response?.actionKind).toBe('understandProducts');
    expect(readerSpy).not.toHaveBeenCalled();
    expect(preparationSpy).not.toHaveBeenCalled();

    const altered = structuredClone(archive);
    altered.programPreparation!.input.operations[0] = { ...altered.programPreparation!.input.operations[0], materialId: 'variety:another' } as typeof input.operations[number];
    expect(readHopV55DecisionReadingArchive(altered)).toMatchObject({ status: 'invalidRecord' });

    const { criterionDrafts: _drafts, correction: _correction, ...legacyReading } = correctedReading;
    const legacy = createHopV55DecisionReadingArchive({ id: 'reading:legacy', ownerKey: 'qa-owner', workspaceId: 'workspace:decision',
      recordedAt: '2026-10-02T14:59:00.000Z', reading: legacyReading,
      source: { kind: 'recipe', id: 'recipe:source' }, runtimeReference: 'runtime:source' });
    expect(hopV55DecisionReadingForDisplay(legacy).criterionDrafts).toEqual([]);
    expect(readerSpy).not.toHaveBeenCalled();

    const readyInput = { ...input, branch: { id: 'branch:ready', label: 'Ajout à comparer' }, operations: [{ id: 'operation:add', label: 'Ajouter 12 g au premier moût',
      kind: 'add' as const, additionId: 'addition:new', materialId: targetMaterial.id, grams: 12, use: 'firstWort' as const }] };
    const readyResult = programPreparationService.prepareHopV55DecisionProgram(readyInput);
    expect(readyResult.status).toBe('ready');
    const onCompareProgramPreparation = vi.fn();
    const active = render(<HopV55DecisionProgramPreparation reading={correctedReading} sourceReadingReference="reading:corrected"
      program={program} materials={[sourceMaterial, targetMaterial]} preparation={{ input: readyInput, result: readyResult }}
      preparationReference="reading:ready" onCompareProgramPreparation={onCompareProgramPreparation} />);
    expect(screen.getByRole('heading', { name: 'Programme proposé · application distincte' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Comparer cette proposition à la référence' }));
    expect(onCompareProgramPreparation).toHaveBeenCalledWith({ preparationReference: 'reading:ready' });
    active.unmount();
    render(<HopV55DecisionProgramPreparation reading={correctedReading} sourceReadingReference="reading:corrected"
      program={program} materials={[sourceMaterial, targetMaterial]} preparation={{ input: readyInput, result: readyResult }}
      preparationReference="reading:ready" historical onCompareProgramPreparation={onCompareProgramPreparation} />);
    expect(screen.queryByRole('button', { name: 'Comparer cette proposition à la référence' })).not.toBeInTheDocument();
    expect(onCompareProgramPreparation).toHaveBeenCalledTimes(1);
  });
});
