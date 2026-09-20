import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { BrewerChat as api } from '../../src/services/brewerChat';
import { brewerJobs } from '../../src/services/brewerJobs';
import { brewerLauncher } from '../../src/services/brewerLauncher';
import { prepareProposal, applyProposal } from '../../functions/src/brewerProposals';
import { pick, RECIPE_FIELDS } from '../../functions/src/brewerContext';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { companionRecipe, companionContext } from '../fixtures/companionRecipe';
import { allerEtape } from '../helpers/wizard';
import type { BrewerContext, BrewerTurn } from '../../functions/src/companionTypes';
import type { Recipe } from '../../src/types';
vi.mock('../../src/services/brewerChat', () => ({ BrewerChat: {
  userKey: vi.fn(), history: vi.fn(), activity: vi.fn(), submit: vi.fn(), status: vi.fn(), markRead: vi.fn(), apply: vi.fn()
}, brewerChatError: (e: Error) => e.message }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
// The real dialog is exercised by the browser suite; keep focus/portal behavior
// out of this test of form state, proposal controls and save callbacks.
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer, onClose }: any) => open ?
  <div role="dialog" aria-label={title}>{children}{footer}<button onClick={onClose}>Fermer le compagnon</button></div> : null }));
let context: BrewerContext, turn: BrewerTurn;
beforeEach(() => {
  brewerJobs.stop(); localStorage.clear(); vi.clearAllMocks();
  vi.mocked(api.userKey).mockResolvedValue('qa-companion'); vi.mocked(api.history).mockResolvedValue([]);
  vi.mocked(api.activity).mockResolvedValue([]); vi.mocked(api.status).mockResolvedValue({}); vi.mocked(api.markRead).mockResolvedValue(undefined);
  vi.mocked(api.submit).mockImplementation(async input => {
    context = { ...companionContext(), recipe: normalizeRecipe(pick(input.draft, RECIPE_FIELDS)) };
    const proposal = prepareProposal(context, { target: 'recipe', title: 'Ajustements prêts à valider', changes: [
      ['name', 'QA session — essai 75 %'], ['yeast.attenuationPct', 75], ['yeast.pitchTempC', 20],
      ['fermentation.0.tempC', 20], ['fermentation.0.days', 12], ['hops.0.weightG', 10]
    ].map(([path, value]) => ({ path, valueJson: JSON.stringify(value), reason: 'Demande explicite' })) });
    turn = { id: 'qa-turn', operationId: input.operationId, question: input.question, createdAt: Date.now(), model: 'Fixture déterministe', reviewed: true,
      contextLabel: context.recipe.name, evidence: [], proposal,
      advice: { level: 'info', summary: 'Champs préparés', action: 'Valider les champs choisis', why: 'Hypothèse demandée', watch: 'Contrôler la densité', evidenceIds: [] } };
    return { turn };
  });
  vi.mocked(api.apply).mockImplementation(async (_scope, _id, ids, decision, draft) => ({
    turn: { ...turn, proposal: { ...turn.proposal!, status: decision === 'apply' ? 'applied' : 'dismissed', acceptedIds: ids } },
    ...(decision === 'apply' ? { value: applyProposal({ ...context, recipe: normalizeRecipe(pick(draft, RECIPE_FIELDS)) }, turn.proposal!, ids) } : {})
  }));
});
afterEach(() => { cleanup(); brewerJobs.stop(); });
const mount = (recipe: Recipe, save = vi.fn()) => render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]} knownStyles={['NEIPA']}
  onSave={save} onClose={vi.fn()} onSaveWaterSource={vi.fn()} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} />);
async function propose() {
  act(() => { expect(brewerLauncher.open()).toBe(true); });
  await waitFor(() => expect(screen.queryByText('Chargement des échanges…')).not.toBeInTheDocument());
  const dialog = within(screen.getByRole('dialog', { name: 'Compagnon brasseur' }));
  fireEvent.change(dialog.getByRole('textbox', { name: 'Question au compagnon brasseur' }), { target: { value: 'Prépare les six ajustements demandés.' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Envoyer la question' }));
  await dialog.findByRole('button', { name: 'Valider 6 modifications' }); return dialog;
}
it('applique la sélection au vrai brouillon, conserve date et dossier, puis enregistre et rouvre les nouvelles valeurs', async () => {
  const initial = { ...companionRecipe(), brewDate: '24.10.2026' }, save = vi.fn(), view = mount(initial, save);
  allerEtape(/^Levure/); const dialog = await propose();
  expect(save).not.toHaveBeenCalled(); expect(api.apply).not.toHaveBeenCalled();
  expect(dialog.getByText('78 %')).toBeInTheDocument(); expect(dialog.getByText('75 %')).toBeInTheDocument();
  fireEvent.click(dialog.getByRole('checkbox', { name: 'Nom de la recette' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Valider 5 modifications' }));
  await dialog.findByText('Champs appliqués au brouillon'); expect(save).not.toHaveBeenCalled();
  fireEvent.click(dialog.getByRole('button', { name: 'Fermer le compagnon' }));
  allerEtape('Récapitulatif'); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
  expect(save).toHaveBeenCalledOnce();
  const saved = save.mock.calls[0][0] as Recipe;
  expect(saved.name).toBe(initial.name); expect(saved.brewDate).toBe(initial.brewDate);
  expect(saved.yeast).toEqual({ ...initial.yeast, attenuationPct: 75, pitchTempC: 20 });
  expect(saved.fermentation).toEqual([{ ...initial.fermentation[0], tempC: 20, days: 12 }, initial.fermentation[1]]);
  expect(saved.hops).toEqual([{ ...initial.hops[0], weightG: 10 }, initial.hops[1]]);
  expect(saved.fgTarget).toBeCloseTo(1.0085, 10); expect(saved.abvTarget).toBeCloseTo(3.346875, 10); expect(saved.ibuTarget).toBe(8);
  view.unmount(); const reopened = vi.fn(); mount(JSON.parse(JSON.stringify(saved)), reopened); allerEtape('Récapitulatif');
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
  expect(reopened.mock.calls[0][0]).toMatchObject({ brewDate: initial.brewDate, yeast: saved.yeast, fermentation: saved.fermentation, hops: saved.hops,
    fgTarget: saved.fgTarget, abvTarget: saved.abvTarget, ibuTarget: 8 });
});
it('écarter garde les ingrédients, les paramètres de fermentation et la date', async () => {
  const initial = { ...companionRecipe(), brewDate: '24.10.2026' }, save = vi.fn(); mount(initial, save);
  const dialog = await propose(); fireEvent.click(dialog.getByRole('button', { name: 'Écarter' })); await dialog.findByText('Proposition écartée');
  fireEvent.click(dialog.getByRole('button', { name: 'Fermer le compagnon' })); allerEtape('Récapitulatif');
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
  expect(save.mock.calls[0][0]).toMatchObject({ brewDate: initial.brewDate, yeast: initial.yeast, fermentation: initial.fermentation, hops: initial.hops });
});
