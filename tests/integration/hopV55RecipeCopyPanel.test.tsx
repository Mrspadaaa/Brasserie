import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { Recipe } from '../../src/types';
import type { HopV55Copy } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import {
  brewingScenarioCurrentReference,
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioBranchRequest,
} from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { HopV55RecipeCopyPanel } from '../../src/ui/hopV55/RecipeCopyPanel';
import type { HopV55FullRecipeCopyReceipt } from '../../src/services/hopV55/fullRecipeCopy';

function fixture(options: { sourcePitchTemperatureC?: number; sourceTemperatureRange?: boolean } = {}): { context: BrewerContext; result: ReturnType<typeof simulateBrewingScenario> } {
  const context = structuredClone(makeHopV55FixtureContext('planning'));
  if (!context.recipe || !context.hopIndex) throw Error('Fixture context must contain a Recipe and a loaded index.');
  context.recipe.boilMin = 60;
  if (options.sourcePitchTemperatureC !== undefined) context.recipe.yeast.pitchTempC = options.sourcePitchTemperatureC;
  if (options.sourceTemperatureRange) context.recipe.yeast.technicalFacts = [{ key: 'temperature', reported: '15–20 °C',
    range: { min: 15, max: 20 }, unit: '°C', qualifier: 'range', origin: 'manufacturer' }];
  const loaded = context.hopIndex.knowledge.find((row): row is HopYeast => row.kind === 'yeast');
  if (!loaded) throw Error('Fixture yeast identity missing.');
  const homebrew: HopYeast = { id: 'yeast-homebrew', kind: 'yeast', name: 'Culture maison identifiée',
    betaLyase: 'unknown', source: loaded.source };
  context.hopIndex.knowledge.push(homebrew);

  const prepared = prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  if (!current) throw Error('Fixture Recipe input missing.');
  const request = buildBrewingScenarioRequest({ scenarioId: 'panel-full-copy', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
    ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current),
  } });
  const branch: BrewingScenarioBranchRequest = {
    id: 'homebrew-copy', label: 'Culture maison identifiée',
    assumptions: [{ id: 'homebrew-selection', path: 'recipe.yeastId', label: 'Culture maison', status: 'selected',
      origin: 'userHypothesis', value: homebrew.id, explanation: 'Identité maison explicitement sélectionnée.' }],
    inputOverrides: { yeastId: homebrew.id },
    culture: { state: 'single', members: [{ yeastId: homebrew.id }], explanation: 'Une culture maison identifiée.' },
  };
  request.branches.push(branch);
  return { context, result: simulateBrewingScenario(request, prepared.runtime) };
}

function zeroStockScenario(context: BrewerContext) {
  if (!context.recipe || !context.hopIndex) throw Error('Fixture context incomplete.');
  const prepared = prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  const addition = prepared.binding?.program.additions[0];
  if (!current || !addition) throw Error('Fixture J1 program missing.');
  const candidateVariety = { ...structuredClone(context.hopIndex.varieties[0]), id: 'hop-zero-stock', name: 'Houblon zéro', aliases: [] };
  const request = buildBrewingScenarioRequest({ scenarioId: 'panel-zero-stock', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
    ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push({ id: 'zero-stock', label: 'Dose future sans stock',
    assumptions: [{ id: 'zero-stock-hop', path: 'program.changes', label: 'Dose choisie', status: 'selected',
      origin: 'userHypothesis', value: '10 g', unit: 'g', explanation: 'Dose choisie pour une future commande.' }],
    programChanges: [{ kind: 'replace', additionId: addition.id, additions: [{ ...addition, materialId: 'variety:hop-zero-stock', grams: 10 }] }],
    materials: { hops: [{ id: 'variety:hop-zero-stock', name: 'Houblon zéro', form: 'pelletT90', variety: candidateVariety,
      stockItemRef: 'stock-zero', availableGrams: 0 }] },
  });
  return simulateBrewingScenario(request, prepared.runtime);
}

function conditionalStockScenario(context: BrewerContext) {
  if (!context.recipe || !context.hopIndex) throw Error('Fixture context incomplete.');
  context.recipe.boilMin = 60;
  const prepared = prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  const addition = prepared.binding?.program.additions[0];
  const target = context.hopIndex.varieties.find(row => row.id !== context.recipe!.hops[0]?.hopVarietyId);
  if (!current || !addition || !target) throw Error('Fixture material/program missing.');
  const request = buildBrewingScenarioRequest({ scenarioId: 'panel-future-procurement', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
    ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push({ id: 'conditional-stock', label: 'Remplacement chargé sans solde connu',
    assumptions: [{ id: 'conditional-hop', path: 'program.changes', label: 'Remplacement futur', status: 'selected',
      origin: 'userHypothesis', value: target.name, explanation: 'Matière chargée; quantité disponible inconnue.' }],
    programChanges: [{ kind: 'replace', additionId: addition.id,
      additions: [{ ...addition, materialId: `variety:${target.id}`, grams: 12 }] }],
  });
  return simulateBrewingScenario(request, prepared.runtime);
}

function sourceStockVolumeScenario(context: BrewerContext) {
  if (!context.recipe) throw Error('Fixture context incomplete.');
  context.recipe.hops[0].weightG = 80;
  context.recipe.hops[0].stockItemRef = 'source-hop-stock';
  context.inventory = [{ id: 'source-hop-stock-item', ref: 'source-hop-stock', name: 'Houblon source', category: 'Houblon',
    unit: 'g', currentStock: 0, minStock: 0, reorder: false }];
  const prepared = prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  if (!current) throw Error('Fixture source Recipe input missing.');
  const request = buildBrewingScenarioRequest({ scenarioId: 'panel-volume-future-procurement', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
    ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push({ id: 'source-volume-22', label: 'Volume final choisi',
    assumptions: [
      { id: 'source-volume-input', path: 'recipe.volumeL', label: 'Volume final', status: 'selected', origin: 'userHypothesis',
        value: 22, unit: 'L', explanation: 'Volume final explicitement choisi.' },
      { id: 'source-volume-program', path: 'program.volumeL', label: 'Volume du programme', status: 'selected', origin: 'userHypothesis',
        value: 22, unit: 'L', explanation: 'Volume du programme aligné sur le choix de recette.' },
    ], inputOverrides: { volumeL: 22 }, programOverrides: { volumeL: 22 },
  });
  return simulateBrewingScenario(request, prepared.runtime);
}

function alphaRangeScenario(context: BrewerContext) {
  if (!context.recipe || !context.hopIndex) throw Error('Fixture context incomplete.');
  const source: HopSource = { title: 'Fiche alpha variétale fixture', author: 'Fiche fabricant fixture', year: 2026,
    kind: 'manufacturer', reference: 'fixture:alpha-variety-range', locator: 'Plage alpha variétale · méthode déclarée pour les cônes.' };
  const baseVariety = context.hopIndex.varieties[0];
  if (!baseVariety) throw Error('Fixture variety missing.');
  const target = { ...structuredClone(baseVariety), id: 'alpha-variety-range', name: 'Variété avec plage alpha', form: 'pelletT90' as const,
    analysis: [{ analyte: 'alpha' as const, unit: 'percentMass' as const, basis: 'asIs' as const, kind: 'range' as const,
      range: { min: 9, max: 12 }, source, confidence: 'high' as const, method: 'Méthode déclarée dans la fixture' }] };
  context.hopIndex.varieties.push(target);
  const prepared = prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  const addition = prepared.binding?.program.additions[0];
  if (!current || !addition) throw Error('Fixture Recipe program missing.');
  const request = buildBrewingScenarioRequest({ scenarioId: 'panel-alpha-domain-witness', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
    ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push({ id: 'alpha-domain', label: 'Choix alpha variétal explicite',
    assumptions: [{ id: 'alpha-domain-choice', path: 'program.changes', label: 'Matière cible', status: 'selected',
      origin: 'userHypothesis', value: target.name, explanation: 'Référence exacte choisie dans la fixture.' }],
    programChanges: [{ kind: 'replace', additionId: addition.id,
      additions: [{ ...addition, materialId: `variety:${target.id}`, grams: 17.625 }] }],
  });
  return simulateBrewingScenario(request, prepared.runtime);
}

describe('copie complète Recipe V5.5 dans l’atelier', () => {
  it('expose la plage variétale, conserve un nominal refusé et accepte un choix motivé dans le domaine', async () => {
    const user = userEvent.setup();
    const { context } = fixture();
    const result = alphaRangeScenario(context);
    const alphaBranch = result.branches.find(row => row.id === 'alpha-domain')!;
    const additionName = alphaBranch.input.additions[0].name;
    const getContext = vi.fn(async () => structuredClone(context));
    const onCopy = vi.fn(async (_copy: HopV55Copy, _receipt: HopV55FullRecipeCopyReceipt) => undefined);
    render(<HopV55RecipeCopyPanel result={result} branchId="alpha-domain" context={context} getContext={getContext} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    const input = await screen.findByLabelText(`Alpha de travail · ${additionName}`);
    expect(screen.getAllByText('Domaine utilisé par la validation · 9–12 % alpha').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Portée variétale.*ce n’est pas une analyse du lot/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Fiche alpha variétale fixture · Fiche fabricant fixture/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Plage alpha variétale · méthode déclarée pour les cônes/).length).toBeGreaterThan(0);

    await user.type(input, '5.875');
    await user.type(screen.getByLabelText(`Motif alpha pour ${additionName}`), 'Valeur discriminante volontairement hors de la plage sourcée.');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Alpha choisi hors du domaine documenté/);
    expect(screen.getByLabelText(`Alpha de travail · ${additionName}`)).toHaveValue('5.875');
    expect(screen.getAllByText('Domaine utilisé par la validation · 9–12 % alpha').length).toBeGreaterThan(0);
    expect(onCopy).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(`Alpha de travail · ${additionName}`));
    await user.type(screen.getByLabelText(`Alpha de travail · ${additionName}`), '10.375');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });
    await user.click(screen.getByText(/Domaine alpha et portée utilisés pour ce choix/));
    expect(screen.getByText(/Nominal retenu.*10[.,]375 %/)).toBeInTheDocument();
    expect(screen.getByText(/Portée variétale.*ce n’est pas une analyse du lot/)).toBeInTheDocument();
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('prépare une culture maison sans fabricant ni produit inventé, puis réessaie le même ID si la transmission échoue', async () => {
    const user = userEvent.setup();
    const { context, result } = fixture();
    const getContext = vi.fn(async () => structuredClone(context));
    let attempts = 0;
    const onCopy = vi.fn(async (_copy: HopV55Copy, _receipt: HopV55FullRecipeCopyReceipt) => {
      attempts++;
      if (attempts === 1) throw Error('stockage local hors ligne');
    });
    const onRecompute = vi.fn(async (_candidate: Recipe) => undefined);
    render(<HopV55RecipeCopyPanel result={result} branchId="homebrew-copy" context={context} getContext={getContext}
      onCopy={onCopy} onRecompute={onRecompute} />);

    expect(getContext).not.toHaveBeenCalled();
    expect(screen.getAllByText('Scénario hypothétique').length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText('Quantité déclarée'), '1');
    await user.type(screen.getByLabelText('Unité de levure'), 'g');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Inconnu ou non déclaré/)).toBeInTheDocument();
    expect(screen.getByText(/Enregistrement de la recette/i)).toBeInTheDocument();
    expect(screen.getByText(/À compléter avant brassage/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Créer la copie complète locale' }));
    await screen.findByRole('button', { name: 'Réessayer l’enregistrement local' });
    expect(getContext).toHaveBeenCalledTimes(2);
    expect(onCopy).toHaveBeenCalledTimes(1);
    const firstCall = onCopy.mock.calls[0];
    const firstCopy = firstCall[0];
    const firstReceipt = firstCall[1];
    const stableId = firstCopy.id;
    expect(firstCopy.recipe.yeast).toEqual({ name: 'Culture maison identifiée', hopIndexId: 'yeast-homebrew', qty: 1, unit: 'g' });
    expect(firstCopy.recipe.yeast).not.toHaveProperty('lab');
    expect(firstCopy.recipe.yeast).not.toHaveProperty('stockItemRef');
    expect(firstCopy.recipe.yeast).not.toHaveProperty('technicalFacts');
    expect(firstReceipt.plan.yeast?.product).toBeUndefined();
    expect(firstReceipt.readiness.saveConfirmed).toBe(false);
    expect(onRecompute).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Réessayer l’enregistrement local' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(2));
    expect(onCopy.mock.calls[1][0].id).toBe(stableId);
    expect(onCopy.mock.calls[1][1].copyId).toBe(stableId);
    expect(getContext).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(/transmise au dossier/i).length).toBeGreaterThan(0);
  });

  it('n’appelle le contexte frais qu’au moment de prévisualiser et ne force pas le statut J5 à available', async () => {
    const user = userEvent.setup();
    const { context, result } = fixture();
    const getContext = vi.fn(async () => structuredClone(context));
    const onCopy = vi.fn(async () => undefined);
    render(<HopV55RecipeCopyPanel result={result} branchId="homebrew-copy" context={context} getContext={getContext} onCopy={onCopy} />);
    expect(getContext).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Quantité déclarée'), '1');
    await user.type(screen.getByLabelText('Unité de levure'), 'g');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await waitFor(() => expect(getContext).toHaveBeenCalledTimes(1));
    expect(screen.getAllByText('Scénario hypothétique').length).toBeGreaterThan(0);
    expect(result.branches[0].applicability).toBe('hypotheticalOnly');
  });

  it('garde les choix saisis et exige de choisir la cible de température avant toute reprise', async () => {
    const user = userEvent.setup();
    const { context, result } = fixture({ sourcePitchTemperatureC: 19 });
    const getContext = vi.fn(async () => structuredClone(context));
    const onCopy = vi.fn(async () => undefined);
    const onRecompute = vi.fn(async (_candidate: Recipe) => undefined);
    render(<HopV55RecipeCopyPanel result={result} branchId="homebrew-copy" context={context} getContext={getContext}
      onCopy={onCopy} onRecompute={onRecompute} />);
    await user.clear(screen.getByLabelText('Nom de la nouvelle recette'));
    await user.type(screen.getByLabelText('Nom de la nouvelle recette'), 'Brouillon maison');
    await user.type(screen.getByLabelText('Quantité déclarée'), '1');
    await user.type(screen.getByLabelText('Unité de levure'), 'g');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));

    await screen.findByText(/change sur cible d’ensemencement/);
    expect(screen.getByLabelText('Nom de la nouvelle recette')).toHaveValue('Brouillon maison');
    expect(screen.getByLabelText('Quantité déclarée')).toHaveValue('1');
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(onRecompute).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Prévoir cette candidate explicitement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cible d’ensemencement.*19 °C.*n’a pas été choisie/i);
    expect(onRecompute).not.toHaveBeenCalled();
    expect(getContext).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('checkbox', { name: /Reprendre la cible d’ensemencement explicite · 19 °C/ }));
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });
    expect(screen.getByLabelText('Nom de la nouvelle recette')).toHaveValue('Brouillon maison');
    expect(screen.getByLabelText('Quantité déclarée')).toHaveValue('1');
    expect(getContext).toHaveBeenCalledTimes(3);
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('termine une reprise besoinRecompute par une nouvelle prévision J5 puis une copie exacte', async () => {
    const user = userEvent.setup();
    const { context, result } = fixture({ sourceTemperatureRange: true });
    const originalReference = result.reference;
    const getContext = vi.fn(async () => structuredClone(context));
    const onCopy = vi.fn(async (_copy: HopV55Copy, _receipt: HopV55FullRecipeCopyReceipt) => undefined);
    const onRecompute = vi.fn(async (_candidate: Recipe, _payload: Parameters<NonNullable<React.ComponentProps<typeof HopV55RecipeCopyPanel>['onRecompute']>>[1]) => undefined);
    function Harness() {
      const [active, setActive] = React.useState({ result, branchId: 'homebrew-copy' });
      return <HopV55RecipeCopyPanel result={active.result} branchId={active.branchId} context={context} getContext={getContext}
        onCopy={onCopy} onRecompute={async (candidate, payload) => {
          await onRecompute(candidate, payload);
          setActive({ result: payload.result, branchId: payload.branchId });
        }} />;
    }
    render(<Harness />);

    await user.clear(screen.getByLabelText('Nom de la nouvelle recette'));
    await user.type(screen.getByLabelText('Nom de la nouvelle recette'), 'Brouillon culture maison');
    await user.type(screen.getByLabelText('Quantité déclarée'), '1');
    await user.type(screen.getByLabelText('Unité de levure'), 'g');
    await user.click(screen.getByRole('checkbox', { name: 'Reprendre les phases de fermentation choisies' }));
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Prévoir cette candidate explicitement' });
    expect(screen.getByRole('alert')).toHaveTextContent(/change sur la plage de fermentation/i);
    expect(onRecompute).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Prévoir cette candidate explicitement' }));
    await waitFor(() => expect(onRecompute).toHaveBeenCalledTimes(1));
    const payload = onRecompute.mock.calls[0][1];
    expect(payload.request.baseline.kind).toBe('recipe');
    if (payload.request.baseline.kind !== 'recipe') throw Error('La reprise doit garder la recette réelle comme base.');
    expect(payload.request.baseline.recipeReference).not.toBe(
      prepareBrewingScenarioContext({ ...context, recipe: onRecompute.mock.calls[0][0] }).runtime.current?.recipeReference);
    expect(payload.request.branches[0].inputOverrides?.yeastTemperature).toBeNull();
    expect(payload.plan.yeast?.quantity).toEqual({ value: 1, unit: 'g' });
    expect(payload.supersedes.snapshotReference).toBe(originalReference);
    expect(result.reference).toBe(originalReference);
    expect(getContext).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });
    expect(screen.getByLabelText('Nom de la nouvelle recette')).toHaveValue('Brouillon culture maison');
    expect(screen.getByLabelText('Quantité déclarée')).toHaveValue('1');
    expect(getContext).toHaveBeenCalledTimes(3);
    await user.click(screen.getByRole('button', { name: 'Créer la copie complète locale' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(onCopy.mock.calls[0][0].recipe).toMatchObject({ name: 'Brouillon culture maison',
      yeast: { name: 'Culture maison identifiée', hopIndexId: 'yeast-homebrew', qty: 1, unit: 'g' } });
    expect(onCopy.mock.calls[0][0].recipe.yeast).not.toHaveProperty('technicalFacts');
    expect(onCopy.mock.calls[0][1].scenarioApplicability).toBe('hypotheticalOnly');
    expect(getContext).toHaveBeenCalledTimes(4);
  });

  it('garde la condition stock nulle en annexe et permet un brouillon avec le houblon source', async () => {
    const user = userEvent.setup();
    const { context } = fixture();
    const result = zeroStockScenario(context);
    expect(result.branches[0].programProposal?.applicability).toBe('unavailable');
    const getContext = vi.fn(async () => structuredClone(context));
    const onCopy = vi.fn(async (_copy: HopV55Copy, _receipt: HopV55FullRecipeCopyReceipt) => undefined);
    render(<HopV55RecipeCopyPanel result={result} branchId="zero-stock" context={context} getContext={getContext} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('alert');
    expect(result.branches[0].applicability).toBe('unavailable');
    await user.click(screen.getByText(/Besoin de houblon et état du stock/));
    expect(screen.getAllByText(/Approvisionnement nécessaire/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('checkbox', { name: 'Reprendre le programme de houblon proposé et validé' }));
    expect(screen.getByText(/La nouvelle recette gardera les houblons de la recette source/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });
    expect(screen.getByText(/Programme indisponible pour un brassage immédiat/)).toBeInTheDocument();
    expect(screen.getAllByText(/Approvisionnement nécessaire/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Identité fictive A/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Créer la copie complète locale' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(onCopy.mock.calls[0][0].recipe.hops[0].weightG).toBe(context.recipe!.hops[0].weightG);
    expect(onCopy.mock.calls[0][1].procurementAnnex).toMatchObject({ applicability: 'unavailable',
      stock: expect.arrayContaining([expect.objectContaining({ status: 'insufficient', neededGrams: 10, availableGrams: 0 })]) });
    expect(result.branches[0].programProposal?.applicability).toBe('unavailable');
  });

  it('exige un motif d’approvisionnement futur et conserve le choix quand le stock reste inconnu', async () => {
    const user = userEvent.setup();
    const { context } = fixture();
    const result = conditionalStockScenario(context);
    expect(result.branches[0].programProposal?.applicability).toBe('conditional');
    const getContext = vi.fn(async () => structuredClone(context));
    const onCopy = vi.fn(async (_copy: HopV55Copy, _receipt: HopV55FullRecipeCopyReceipt) => undefined);
    render(<HopV55RecipeCopyPanel result={result} branchId="conditional-stock" context={context} getContext={getContext} onCopy={onCopy} />);

    await user.click(screen.getByRole('checkbox', { name: /Prévoir l’achat du houblon avant brassage · programme proposé/ }));
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/motif/i);
    expect(getContext).not.toHaveBeenCalled();
    const reason = 'Prévoir l’achat avant le brassin. <script>window.pwned = true</script>';
    await user.type(screen.getByLabelText('Motif de l’approvisionnement futur'), reason);
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByLabelText(/Alpha de travail/);
    expect(getContext).toHaveBeenCalledTimes(1);
    const alphaAdditionName = result.branches[0].input.additions[0].name;
    await user.type(screen.getByLabelText(new RegExp(`^Alpha de travail · ${alphaAdditionName}`)), '6');
    await user.type(screen.getByLabelText(new RegExp(`^Motif alpha pour ${alphaAdditionName}`)), 'Nominal de travail retenu pour ce lot.');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });

    expect(screen.getByText(reason)).toBeInTheDocument();
    expect(document.body.textContent).toContain(reason);
    expect(document.querySelector('script')).toBeNull();
    expect(document.body.textContent).not.toMatch(/future-procurement-/);
    expect(getContext).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Créer la copie complète locale' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    const receipt = onCopy.mock.calls[0][1];
    expect(receipt.futureProcurement).toMatchObject({ reason, id: expect.stringMatching(/^future-procurement-/) });
    expect(receipt.procurementAnnex?.applicability).toBe('conditional');
    expect(document.body.textContent).not.toContain(receipt.futureProcurement!.id);
  });

  it('ne force pas le programme proposé pour un volume futur et exige l’approvisionnement des houblons source à stock nul', async () => {
    const user = userEvent.setup();
    const { context } = fixture();
    const result = sourceStockVolumeScenario(context);
    const getContext = vi.fn(async () => structuredClone(context));
    const onCopy = vi.fn(async (_copy: HopV55Copy, _receipt: HopV55FullRecipeCopyReceipt) => undefined);
    const view = render(<HopV55RecipeCopyPanel result={result} branchId="source-volume-22" context={context} getContext={getContext} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent(/approvisionnement futur/i);
    expect(getContext).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('checkbox', { name: /Prévoir l’achat du houblon avant brassage · houblons de la recette source/ }));
    await user.type(screen.getByLabelText('Motif de l’approvisionnement futur'), 'Acheter avant le prochain brassin.');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });
    expect(screen.getByText(/Programme de la recette proposée · Programme indisponible/)).toBeInTheDocument();
    expect(result.requestSnapshot.branches[0].programChanges).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'Créer la copie complète locale' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(onCopy.mock.calls[0][0].recipe.volumeL).toBe(22);
    expect(onCopy.mock.calls[0][0].recipe.hops[0].weightG).toBe(80);
    expect(onCopy.mock.calls[0][1].candidateProgramAnnex?.stock).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'insufficient', neededGrams: 80, availableGrams: 0 }),
    ]));
    const receipt = onCopy.mock.calls[0][1];
    expect(receipt.futureProcurement?.reason).toBe('Acheter avant le prochain brassin.');
    expect(receipt.futureProcurement?.id).toMatch(/^future-procurement-/);
    expect(getContext).toHaveBeenCalledTimes(3);
    expect(context.recipe!.volumeL).toBe(20);
    expect(context.recipe!.hops[0].weightG).toBe(80);

    view.unmount();
    const reloadedOnCopy = vi.fn(async (_copy: HopV55Copy, _receipt: HopV55FullRecipeCopyReceipt) => undefined);
    render(<HopV55RecipeCopyPanel result={result} branchId="source-volume-22" context={context} getContext={getContext}
      onCopy={reloadedOnCopy} initialPlan={receipt.plan} initialAlphaChoices={receipt.alphaChoices} originAnnex={receipt.originAnnex} />);
    expect(screen.getByRole('checkbox', { name: /Reprendre le volume de recette/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Prévoir l’achat du houblon avant brassage · houblons de la recette source/ })).toBeChecked();
    expect(screen.getByLabelText('Motif de l’approvisionnement futur')).toHaveValue('Acheter avant le prochain brassin.');
    await user.click(screen.getByRole('button', { name: 'Prévisualiser la copie complète' }));
    await screen.findByRole('button', { name: 'Créer la copie complète locale' });
    expect(screen.getByText(/Scénario J5 antérieur conservé/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Créer la copie complète locale' }));
    await waitFor(() => expect(reloadedOnCopy).toHaveBeenCalledTimes(1));
    expect(reloadedOnCopy.mock.calls[0][1].futureProcurement).toEqual(receipt.futureProcurement);
  });
});
