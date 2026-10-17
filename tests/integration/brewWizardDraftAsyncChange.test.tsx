import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { BrewerChat as api } from '../../src/services/brewerChat';
import { brewerJobs } from '../../src/services/brewerJobs';
import { brewerLauncher } from '../../src/services/brewerLauncher';
import { prepareProposal, applyProposal } from '../../functions/src/brewerProposals';
import { pick, RECIPE_FIELDS } from '../../functions/src/brewerContext';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { readRecipeDraft } from '../../src/services/recipeDraft';
import { companionRecipe, companionContext } from '../fixtures/companionRecipe';
import { allerEtape } from '../helpers/wizard';
import type { BrewerContext, BrewerTurn } from '../../functions/src/companionTypes';

/*
 * #97, V3 n°1 : une décision du brasseur appliquée après une réponse asynchrone (ici la validation d'une proposition du
 * compagnon, appliquée au retour du serveur) est une vraie modification. Elle crée le brouillon comme une saisie.
 */
vi.mock('../../src/services/brewerChat', () => ({ BrewerChat: {
  userKey: vi.fn(), history: vi.fn(), activity: vi.fn(), submit: vi.fn(), status: vi.fn(), markRead: vi.fn(), apply: vi.fn()
}, brewerChatError: (e: Error) => e.message }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer, onClose }: any) => open ?
  <div role="dialog" aria-label={title}>{children}{footer}<button onClick={onClose}>Fermer le compagnon</button></div> : null }));

const KEY = 'fixture-owner:QA-COMPANION';
let context: BrewerContext, turn: BrewerTurn;
beforeEach(() => {
  brewerJobs.stop(); localStorage.clear(); vi.clearAllMocks();
  vi.mocked(api.userKey).mockResolvedValue('qa-companion'); vi.mocked(api.history).mockResolvedValue([]);
  vi.mocked(api.activity).mockResolvedValue([]); vi.mocked(api.status).mockResolvedValue({}); vi.mocked(api.markRead).mockResolvedValue(undefined);
  vi.mocked(api.submit).mockImplementation(async input => {
    context = { ...companionContext(), recipe: normalizeRecipe(pick(input.draft, RECIPE_FIELDS)) };
    const proposal = prepareProposal(context, { target: 'recipe', title: 'Ajustement prêt à valider', changes: [
      ['yeast.attenuationPct', 75]
    ].map(([path, value]) => ({ path: path as string, valueJson: JSON.stringify(value), reason: 'Demande explicite' })) });
    turn = { id: 'qa-turn', operationId: input.operationId, question: input.question, createdAt: Date.now(), model: 'Fixture déterministe', reviewed: true,
      contextLabel: context.recipe.name, evidence: [], proposal,
      advice: { level: 'info', summary: 'Champ préparé', action: 'Valider le champ', why: 'Hypothèse demandée', watch: 'Contrôler la densité', evidenceIds: [] } };
    return { turn };
  });
  // Like the server: the answer arrives in a later task, well after the click that asked for it.
  vi.mocked(api.apply).mockImplementation(async (_scope, _id, ids, decision, draft) => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return {
      turn: { ...turn, proposal: { ...turn.proposal!, status: decision === 'apply' ? 'applied' : 'dismissed', acceptedIds: ids } },
      ...(decision === 'apply' ? { value: applyProposal({ ...context, recipe: normalizeRecipe(pick(draft, RECIPE_FIELDS)) }, turn.proposal!, ids) } : {})
    };
  });
});
afterEach(() => { cleanup(); brewerJobs.stop(); localStorage.clear(); });

const mount = () => render(<BrewWizard draftKey={KEY} seed={{ recipe: companionRecipe() }} config={defaultConfig} stockItems={[]}
  knownStyles={['NEIPA']} onSave={vi.fn()} onClose={vi.fn()} onSaveWaterSource={vi.fn()} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} />);
const settle = (ms = 0) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)); });

describe('#97 V3 n°1 — une décision appliquée après une réponse asynchrone crée le brouillon (B1)', () => {
  it('valider une proposition du compagnon : brouillon écrit, fermer ne perd pas la valeur appliquée', async () => {
    const view = mount();
    allerEtape(/^Levure/);
    act(() => { expect(brewerLauncher.open()).toBe(true); });
    await waitFor(() => expect(screen.queryByText('Chargement des échanges…')).not.toBeInTheDocument());
    const dialog = within(screen.getByRole('dialog', { name: 'Compagnon brasseur' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Question au compagnon brasseur' }), { target: { value: 'Atténuation à 75 %.' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Envoyer la question' }));
    fireEvent.click(await dialog.findByRole('button', { name: /^Valider 1 modification/ }));
    await dialog.findByText('Champs appliqués au brouillon');
    await settle(20);
    fireEvent.click(dialog.getByRole('button', { name: 'Fermer le compagnon' }));
    view.unmount();
    expect(companionRecipe().yeast.attenuationPct).not.toBe(75);
    expect(readRecipeDraft(KEY)?.recipe.yeast.attenuationPct).toBe(75);
  });
});
