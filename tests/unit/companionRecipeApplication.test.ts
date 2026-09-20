import { describe, expect, it } from 'vitest';
import { applyProposal, prepareProposal } from '../../functions/src/brewerProposals';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { yeastRecipeComputedOg } from '../../src/domain/yeastProjection';
import { companionContext } from '../fixtures/companionRecipe';

const args = (...changes: [string, unknown][]) => ({ target: 'recipe', title: 'Ajustement demandé', changes:
  changes.map(([path, value]) => ({ path, valueJson: JSON.stringify(value), reason: 'Demande explicite de test' })) });
describe('Application des propositions à la recette', () => {
  it('recalcule les estimations après une hypothèse, sans modifier le dossier ni les contacts houblonnés', () => {
    const c = companionContext(), before = structuredClone(c);
    const proposal = prepareProposal(c, args(['yeast.attenuationPct', 75], ['fermentation.0.tempC', 20], ['fermentation.0.days', 12]));
    const result = applyProposal(c, proposal, proposal.changes.map(ch => ch.id));
    expect(result.fgTarget).toBeCloseTo(1.0085, 10); expect(result.abvTarget).toBeCloseTo(3.346875, 10);
    expect(result.ogTarget).toBe(c.recipe.ogTarget); expect(result.ibuTarget).toBe(c.recipe.ibuTarget);
    expect(result.yeast.technicalFacts).toEqual(c.recipe.yeast.technicalFacts);
    expect(result.hops).toEqual(c.recipe.hops); expect(c).toEqual(before);
    const preview = runBrewerTool('calculate_recipe', {}, { ...c, recipe: result }).data as any;
    expect(preview.fg).toBe(result.fgTarget); expect(preview.abv).toBe(result.abvTarget);
  });
  it.each([['fermentables.0.weightKg', 3.2], ['volumeL', 22], ['efficiencyPct', 70]] as const)('invalide la DI fournie quand %s change', (path, value) => {
    const c = companionContext(), p = prepareProposal(c, args([path, value]));
    const next = applyProposal(c, p, p.changes.map(ch => ch.id));
    expect(next.ogTarget).toBe(yeastRecipeComputedOg(next)); expect(next.ogTarget).not.toBe(c.recipe.ogTarget);
    const preview = runBrewerTool('calculate_recipe', {}, { ...c, recipe: next }).data as any;
    expect(next.fgTarget).toBe(preview.fg); expect(next.abvTarget).toBe(preview.abv); expect(next.ibuTarget).toBe(preview.ibu);
  });
  it('recalcule les IBU après un ajout amer sans perdre la DI fournie', () => {
    const c = companionContext(), p = prepareProposal(c, args(['hops.0.weightG', 10]));
    const next = applyProposal(c, p, ['C1']);
    expect(next.ogTarget).toBe(1.034); expect(next.ibuTarget).toBe(8); expect(next.hops[1]).toEqual(c.recipe.hops[1]);
  });
  it('garde une cible explicitement demandée et un nom indépendant', () => {
    const c = companionContext(), p = prepareProposal(c, args(['name', 'Nouvelle session'], ['abvTarget', 3]));
    const next = applyProposal(c, p, ['C2']);
    expect(next.abvTarget).toBe(3); expect(next.name).toBe(c.recipe.name); expect(next.fgTarget).toBe(c.recipe.fgTarget);
  });
  it('lie l’atténuation à sa base, sans imposer un autre changement indépendant', () => {
    const c = companionContext(); c.recipe.yeast.attenuationBasis = 'declared';
    const p = prepareProposal(c, args(['yeast.attenuationPct', 75], ['yeast.attenuationBasis', 'recipe'], ['name', 'Essai']));
    expect(p.changes.slice(0, 2).every(ch => ch.group === 'yeast-attenuation')).toBe(true);
    expect(() => applyProposal(c, p, ['C1'])).toThrow(/ensemble/);
    expect(applyProposal(c, p, ['C1', 'C2']).yeast).toMatchObject({ attenuationPct: 75, attenuationBasis: 'recipe' });
    expect(applyProposal(c, p, ['C3']).yeast).toEqual(c.recipe.yeast);
  });
  it('refuse la perte silencieuse du dossier et son transfert vers une autre souche', () => {
    const c = companionContext(), { technicalFacts: _, ...withoutFacts } = c.recipe.yeast;
    expect(() => prepareProposal(c, args(['yeast', { ...withoutFacts, qty: .25 }]))).toThrow(/dossier.*conservé/);
    expect(() => prepareProposal(c, args(['yeast.name', 'Autre culture']))).toThrow(/fiche complète/);
  });
  it('permet de compléter le laboratoire de la même levure en conservant les faits personnels', () => {
    const c = companionContext(), p = prepareProposal(c, args(['yeast.lab', 'Laboratoire renseigné par le brasseur']));
    expect(applyProposal(c, p, ['C1']).yeast.technicalFacts).toEqual(c.recipe.yeast.technicalFacts);
  });
  it('accepte une nouvelle culture inconnue sans inventer forme, quantité ou atténuation', () => {
    const c = companionContext(), p = prepareProposal(c, args(['yeast', { name: 'Culture rare inconnue' }]));
    const next = applyProposal(c, p, ['C1']);
    expect(next.yeast).toEqual({ name: 'Culture rare inconnue' }); expect(next.fgTarget).toBeNull(); expect(next.abvTarget).toBeNull();
  });
});
