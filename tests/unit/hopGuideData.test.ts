import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { findRecipeYeastMatches } from '../../src/domain/hopIndex/recipeGuide';

const memory = vi.hoisted(() => ({
  ready: true,
  varieties: [] as HopVariety[],
  knowledge: [] as HopKnowledge[],
  importPack: vi.fn<(json: string) => Promise<number>>()
}));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  isReady: () => memory.ready,
  getHopVarieties: () => memory.varieties,
  getHopKnowledge: () => memory.knowledge,
  importHopIndex: memory.importPack
} }));

import { ensureGuideReferences, guideAxes, guideRiskPolicies, guideYeasts, loadGuideVarieties } from '../../src/ui/hopIndex/guideData';

async function applyPack(json: string): Promise<number> {
  const pack: { hopVarieties?: HopVariety[]; hopKnowledge?: HopKnowledge[] } = JSON.parse(json);
  memory.varieties.push(...pack.hopVarieties ?? []);
  memory.knowledge.push(...pack.hopKnowledge ?? []);
  return (pack.hopVarieties?.length ?? 0) + (pack.hopKnowledge?.length ?? 0);
}

beforeEach(() => {
  memory.ready = true;
  memory.varieties = [];
  memory.knowledge = [];
  memory.importPack.mockReset().mockImplementation(applyPack);
});

describe('Références proposées dans le guide de recette', () => {
  it('propose des axes et US-05 sourcés sans écrire ni inventer de capacité enzymatique', () => {
    expect(guideAxes([])).toHaveLength(12);
    expect(guideYeasts([]).find(row => row.id === 'fermentis-us05')).toMatchObject({
      name: 'SafAle US-05 (Fermentis)', betaLyase: 'unknown',
      source: { author: 'Fermentis', year: null, reference: 'https://fermentis.com/fr/produit/safale-us-05/' }
    });
    expect(memory.importPack).not.toHaveBeenCalled();
  });

  it('retrouve explicitement US-05 dans le nom de recette sans assimiler d’autres souches', () => {
    const yeasts = guideYeasts([]);
    expect(findRecipeYeastMatches('Fermentis Levure Safale US-05', yeasts)).toMatchObject([{
      item: { id: 'fermentis-us05', betaLyase: 'unknown' }, via: 'alias', matchedName: 'Fermentis Levure SafAle US-05'
    }]);
    for (const name of ['WLP001', 'Wyeast 1056', 'Chico']) {
      expect(findRecipeYeastMatches(name, yeasts)).toEqual([]);
    }
    expect(memory.importPack).not.toHaveBeenCalled();
  });

  it('conserve les versions et les identités éditées tout en ignorant les fiches invalides pour les choix', () => {
    const axis = { ...guideAxes([])[0], name: 'Mes agrumes', version: 'personnelle-2' };
    const yeast = { ...guideYeasts([])[0], name: 'US-05 de mon référentiel' };
    const invalid = { ...guideAxes([])[1], version: '' };
    const extra = { ...axis, id: 'personal-axis', name: 'Autre famille' };
    const knowledge: HopKnowledge[] = [axis, yeast, invalid, extra];
    const before = JSON.stringify(knowledge);
    expect(guideAxes(knowledge).find(row => row.id === axis.id)).toEqual(axis);
    expect(guideAxes(knowledge).find(row => row.id === invalid.id)?.version).toBe('local-1');
    expect(guideAxes(knowledge).filter(row => row.id === axis.id)).toHaveLength(1);
    expect(guideAxes(knowledge)).toContainEqual(extra);
    expect(guideYeasts(knowledge).find(row => row.id === yeast.id)).toEqual(yeast);
    expect(JSON.stringify(knowledge)).toBe(before);
  });

  it('charge uniquement les fabricants et garde Idaho 7 documentaire, sans analyse supposée', async () => {
    const varieties = await loadGuideVarieties();
    expect(varieties.some(row => row.id === 'hopsteiner-cas')).toBe(true);
    expect(varieties.find(row => row.id === 'ych-idaho7')).toMatchObject({
      name: 'Idaho 7', aliases: ['Idaho 7® Brand', 'J-007'], form: 'unknown', analysis: [],
      descriptions: [{ context: 'rawHop', source: { author: 'Yakima Chief Hops', kind: 'manufacturer', year: null } }]
    });
    expect(varieties.every(row => row.descriptions.every(description => description.source.kind === 'manufacturer'))).toBe(true);
    expect(memory.importPack).not.toHaveBeenCalled();
  });

  it('propose les trois vigilances sourcées sans les activer dans le stockage', () => {
    const policies = guideRiskPolicies([]);
    expect(policies.map(policy => policy.risk)).toEqual(['hopCreep', 'fourMmp', 'precursors']);
    for (const policy of policies) {
      expect(policy.kind).toBe('risk');
      expect(() => assertHopKnowledge(policy)).not.toThrow();
    }
    expect(memory.knowledge).toEqual([]);
    expect(memory.importPack).not.toHaveBeenCalled();
  });

  it('préserve les vigilances modifiées ou désactivées et complète seulement les choix manquants', async () => {
    const initial = guideRiskPolicies([]);
    const disabled = { ...initial[0], enabled: false, advice: 'Consigne personnelle conservée.' };
    const extra = { ...initial[1], id: 'personal-risk', name: 'Vigilance personnelle' };
    const invalid = { ...initial[2], source: { ...initial[2].source, reference: '' } };
    const knowledge: HopKnowledge[] = [disabled, extra, invalid, ...guideAxes([])];
    const before = JSON.stringify(knowledge);
    const policies = guideRiskPolicies(knowledge);
    expect(policies).toHaveLength(4);
    expect(policies.find(policy => policy.id === disabled.id)).toEqual(disabled);
    expect(policies.find(policy => policy.id === invalid.id)).toEqual(initial[2]);
    expect(policies).toContainEqual(extra);
    expect(JSON.stringify(knowledge)).toBe(before);
    expect(memory.importPack).not.toHaveBeenCalled();

    memory.knowledge = [disabled, extra];
    await ensureGuideReferences({ knowledge: policies });
    await ensureGuideReferences({ knowledge: policies });
    expect(memory.importPack).toHaveBeenCalledTimes(1);
    expect(memory.knowledge.find(policy => policy.id === disabled.id)).toEqual(disabled);
    expect(memory.knowledge).toHaveLength(4);
  });
});

describe('Installation explicite des références du guide', () => {
  it('importe seulement les collections demandées et ne réécrit rien au rejeu', async () => {
    const knowledge = guideAxes([]);
    await ensureGuideReferences({ knowledge });
    await ensureGuideReferences({ knowledge });
    await ensureGuideReferences({});
    expect(memory.importPack).toHaveBeenCalledTimes(1);
    expect(Object.keys(JSON.parse(memory.importPack.mock.calls[0][0]))).toEqual(['hopKnowledge']);
    expect(memory.knowledge).toEqual(knowledge);
  });

  it('préserve les fiches déjà présentes même si le pack contient une version différente', async () => {
    const varieties = await loadGuideVarieties();
    const variety = { ...varieties[0], name: 'Variété déjà personnalisée' };
    const axis = { ...guideAxes([])[0], name: 'Axe déjà personnalisé', version: 'personnelle-3' };
    memory.varieties.push(variety);
    memory.knowledge.push(axis);
    const yeast = guideYeasts([])[0];
    const { aliases: _aliases, ...storedYeast } = yeast;
    await ensureGuideReferences({ varieties: [varieties[0]], knowledge: [guideAxes([])[0], yeast] });
    expect(memory.varieties).toEqual([variety]);
    expect(memory.knowledge).toEqual([axis, storedYeast]);
    expect(JSON.parse(memory.importPack.mock.calls[0][0])).toEqual({ hopKnowledge: [storedYeast] });
  });

  it('retire les alias du guide avant validation et import sans modifier le candidat', async () => {
    const name = 'Fermentis Levure Safale US-05';
    const candidate = findRecipeYeastMatches(name, guideYeasts([]))[0].item;
    const before = structuredClone(candidate);
    await ensureGuideReferences({ knowledge: [candidate] });
    await ensureGuideReferences({ knowledge: [candidate] });
    expect(memory.importPack).toHaveBeenCalledTimes(1);
    expect(memory.knowledge[0]).not.toHaveProperty('aliases');
    expect(() => assertHopKnowledge(memory.knowledge[0])).not.toThrow();
    expect(candidate).toEqual(before);
    expect(findRecipeYeastMatches(name, guideYeasts(memory.knowledge))).toMatchObject([{ item: { id: candidate.id }, via: 'alias' }]);
  });

  it('sérialise les appels concurrents et relit les identifiants après le premier import', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => { release = resolve; });
    memory.importPack.mockImplementationOnce(async json => { await gate; return applyPack(json); });
    const knowledge = guideAxes([]);
    const first = ensureGuideReferences({ knowledge });
    const second = ensureGuideReferences({ knowledge });
    await Promise.resolve();
    expect(memory.importPack).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, second]);
    expect(memory.importPack).toHaveBeenCalledTimes(1);
    expect(memory.knowledge).toHaveLength(knowledge.length);
  });

  it('refuse une base non prête sans import puis permet une nouvelle action', async () => {
    memory.ready = false;
    await expect(ensureGuideReferences({ knowledge: guideYeasts([]) })).rejects.toThrow('n’est pas encore prête');
    expect(memory.importPack).not.toHaveBeenCalled();
    memory.ready = true;
    await expect(ensureGuideReferences({ knowledge: guideYeasts([]) })).resolves.toBeUndefined();
    expect(memory.importPack).toHaveBeenCalledTimes(1);
  });

  it('valide toutes les références avant de transmettre un import', async () => {
    const varieties = await loadGuideVarieties();
    const invalid = { ...guideYeasts([])[0], source: { ...guideYeasts([])[0].source, reference: '' } };
    await expect(ensureGuideReferences({ varieties: [varieties[0]], knowledge: [invalid] })).rejects.toThrow('provenance');
    expect(memory.importPack).not.toHaveBeenCalled();
  });

  it('propage un échec d’écriture et libère la file pour une nouvelle tentative', async () => {
    const failure = new Error('Écriture refusée');
    memory.importPack.mockRejectedValueOnce(failure);
    const references = { knowledge: guideYeasts([]) };
    await expect(ensureGuideReferences(references)).rejects.toBe(failure);
    expect(memory.knowledge).toEqual([]);
    await expect(ensureGuideReferences(references)).resolves.toBeUndefined();
    expect(memory.importPack).toHaveBeenCalledTimes(2);
    expect(memory.knowledge).toEqual(references.knowledge.map(({ aliases: _aliases, ...stored }) => stored));
  });
});
