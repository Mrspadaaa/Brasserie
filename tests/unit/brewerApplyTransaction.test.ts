import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ docs: new Map<string, any>(), failCommit: false, commits: 0 }));
const ref = (path: string) => ({ path });
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({
  FieldValue: { delete: () => '__DELETE_FIELD__' },
  getFirestore: () => ({ doc: ref, runTransaction: async (run: any) => {
    const writes: (() => void)[] = [];
    const result = await run({
      get: async (r: any) => ({ ref: r, exists: state.docs.has(r.path), data: () => structuredClone(state.docs.get(r.path)) }),
      update: (r: any, patch: any) => writes.push(() => {
        const next = { ...state.docs.get(r.path), ...structuredClone(patch) };
        for (const [key, value] of Object.entries(next)) if (value === '__DELETE_FIELD__') delete next[key];
        state.docs.set(r.path, next);
      }),
      create: (r: any, value: any) => writes.push(() => state.docs.set(r.path, structuredClone(value)))
    });
    if (state.failCommit) throw Error('Commit interrompu');
    writes.forEach(write => write()); state.commits++; return result;
  } })
}));
vi.mock('../../functions/src/brewSession', () => ({ requireBrewer: () => 'qa-user' }));
vi.mock('../../functions/src/brewerJobs', () => ({ publicJob: (job: any) => job }));
import { applyBrewerProposal, threadKey } from '../../functions/src/brewerChat';
import { prepareProposal } from '../../functions/src/brewerProposals';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { companionContext } from '../fixtures/companionRecipe';

const turnId = 'a'.repeat(64);
const arrange = (kind: 'recipe' | 'draft' = 'recipe') => {
  const c = companionContext(); c.recipe = normalizeRecipe(c.recipe);
  const scope = { kind, id: c.recipe.id }, threadId = threadKey('qa-user', scope);
  const proposal = prepareProposal(c, { target: 'recipe', title: 'Hypothèse de recette', changes: [
    { path: 'yeast.attenuationPct', valueJson: '75', reason: 'Essai demandé' },
    { path: 'fermentation.0.days', valueJson: '12', reason: 'Programme demandé' }
  ] });
  state.docs.set(`recipes/${scope.id}`, { ...structuredClone(c.recipe), brewDate: '20.09.2026', favorite: true });
  state.docs.set(`brewerChats/${turnId}`, { id: turnId, uid: 'qa-user', threadId, generation: 0, reviewed: true, contextId: 'qa-context', proposal });
  state.docs.set('brewerContexts/qa-context', { context: c });
  state.docs.set(`brewerConversations/${threadId}`, { generation: 0 });
  return { c, scope, data: { scope, turnId, selectedIds: ['C1', 'C2'], decision: 'apply', confirmed: true, ...(kind === 'draft' ? { draft: c.recipe } : {}) } };
};
const call = (data: any) => applyBrewerProposal.run({ data } as any);
beforeEach(() => { state.docs.clear(); state.failCommit = false; state.commits = 0; });

it('le vrai callable sauvegarde les champs et les nouveaux calculs dans la même transaction, puis accepte un retry identique', async () => {
  const { data, c } = arrange(); await call(data);
  const saved = state.docs.get(`recipes/${c.recipe.id}`);
  expect(saved.yeast.attenuationPct).toBe(75); expect(saved.fermentation[0].days).toBe(12);
  expect(saved.fgTarget).toBeCloseTo(1.0085, 10); expect(saved.abvTarget).toBeCloseTo(3.346875, 10);
  expect(saved.yeast.technicalFacts).toEqual(c.recipe.yeast.technicalFacts); expect(saved.hops).toEqual(c.recipe.hops);
  expect(saved).toMatchObject({ brewDate: '20.09.2026', favorite: true });
  const once = structuredClone([...state.docs]); await call(data); expect([...state.docs]).toEqual(once);
  await expect(call({ ...data, selectedIds: ['C1'] })).rejects.toThrow(/déjà été traitée/);
});
it('un brouillon ne sauvegarde pas la recette ni un faux statut appliqué côté serveur', async () => {
  const { data, c } = arrange('draft'), before = structuredClone([...state.docs]);
  const result = await call(data) as any;
  expect(result.value.yeast.attenuationPct).toBe(75); expect(result.value.fgTarget).toBeCloseTo(1.0085, 10);
  expect(result.turn.proposal.status).toBe('applied'); expect([...state.docs]).toEqual(before);
  expect(c.recipe.yeast.attenuationPct).toBe(78);
});
it('un échec de commit ne laisse ni recette modifiée ni proposition traitée et permet de réessayer', async () => {
  const { data } = arrange(), before = structuredClone([...state.docs]); state.failCommit = true;
  await expect(call(data)).rejects.toThrow(/interrompu/); expect([...state.docs]).toEqual(before);
  state.failCommit = false; await call(data); expect(state.docs.get(`brewerChats/${turnId}`).proposal.status).toBe('applied');
});
it('refuse une proposition devenue périmée sans écraser une saisie ultérieure', async () => {
  const { data, c } = arrange(); state.docs.get(`recipes/${c.recipe.id}`).yeast.qty = .25;
  const before = structuredClone([...state.docs]); await expect(call(data)).rejects.toThrow(/changé/); expect([...state.docs]).toEqual(before);
});
it('écarter ne modifie aucun champ et interdit ensuite l’application', async () => {
  const { data, c } = arrange(), before = structuredClone(state.docs.get(`recipes/${c.recipe.id}`));
  await call({ ...data, decision: 'dismiss', selectedIds: [] }); expect(state.docs.get(`recipes/${c.recipe.id}`)).toEqual(before);
  await expect(call(data)).rejects.toThrow(/déjà été traitée/);
});
it('retire réellement le référentiel de style devenu périmé après le changement du style', async () => {
  const { data, c } = arrange(); c.recipe.styleRef = { styleId: 'bjcp-2021-21c' };
  const saved = state.docs.get(`recipes/${c.recipe.id}`); saved.styleRef = structuredClone(c.recipe.styleRef);
  state.docs.get(`brewerChats/${turnId}`).proposal = prepareProposal(c, { target: 'recipe', title: 'Changer le style', changes: [
    { path: 'style', valueJson: '"Stout"', reason: 'Choix du brasseur' }
  ] });
  await call({ ...data, selectedIds: ['C1'] });
  expect(state.docs.get(`recipes/${c.recipe.id}`).style).toBe('Stout');
  expect(state.docs.get(`recipes/${c.recipe.id}`)).not.toHaveProperty('styleRef');
});
it('efface une ancienne estimation d’IBU lorsque les entrées ne permettent plus de la calculer', async () => {
  const { data, c } = arrange(); delete c.recipe.fermentables[0].potentialPpg;
  delete state.docs.get(`recipes/${c.recipe.id}`).fermentables[0].potentialPpg;
  state.docs.get(`brewerChats/${turnId}`).proposal = prepareProposal(c, { target: 'recipe', title: 'Changer le grain', changes: [
    { path: 'fermentables.0.weightKg', valueJson: '3.2', reason: 'Quantité choisie, potentiel inconnu' }
  ] });
  await call({ ...data, selectedIds: ['C1'] }); const saved = state.docs.get(`recipes/${c.recipe.id}`);
  expect(saved.ogTarget).toBeNull(); expect(saved.fgTarget).toBeNull(); expect(saved.abvTarget).toBeNull();
  expect(saved).not.toHaveProperty('ibuTarget');
});
