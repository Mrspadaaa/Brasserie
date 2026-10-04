import { describe, expect, it } from 'vitest';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import { bindHopRecipe } from '../../src/domain/hopDecision/recipeAdapter';
import { applyHopRecipeDraftPreview, previewHopRecipeDraft } from '../../src/domain/hopDecision/recipePreview';
import { previewHopProgramChanges } from '../../src/domain/hopDecision/programs';
import type { HopDecisionMaterial, HopProgramChange, HopProcessStage } from '../../src/domain/hopDecision/types';

const source = (id: string, kind: HopSource['kind'] = 'observation'): HopSource => ({
  title: `Fixture ${id}`, author: 'Tests approvisionnement futur', year: 2026, kind, reference: `fixture:future-procurement:${id}`,
  locator: 'Donnée synthétique ; aucun stock, lot ou brassin réel.',
});

const alphaChoices = (id = 'recipe-hop:0') => ({
  [id]: { value: 5, reason: 'Nominal de travail synthétique pour rendre le brouillon copiable.' },
});

const futureProcurement = { id: 'future-procurement:recipe-draft-1', reason: 'Prévoir l’achat avant le prochain brassin.' };

function fixture(options: { stage?: HopProcessStage; availableGrams?: number | null; capGL?: number; performedSecond?: boolean } = {}) {
  const stage = options.stage ?? 'planning';
  const dry = stage === 'fermenting';
  const hops = [{ name: 'Source', weightG: 10, alpha: 5,
    ...(dry ? { stage: 'dryHop' as const, aromaTiming: 'postFermentation' as const, aromaContactHours: 24, aromaTemperatureC: 16 }
      : { stage: 'boil' as const, timeMin: 30 }) },
  ...(options.performedSecond ? [{ name: 'Déjà effectué', weightG: 2, alpha: 5, stage: 'boil' as const, timeMin: 20 }] : [])];
  const recipe = { id: 'future-procurement-recipe', volumeL: 20, hops };
  const original: HopDecisionMaterial = { id: 'original', name: 'Source', form: 'pelletT90', stockItemRef: 'stock:original', availableGrams: 100 };
  const candidate: HopDecisionMaterial = { id: 'replacement', name: 'Remplacement', form: 'pelletT90', stockItemRef: 'stock:replacement',
    availableGrams: options.availableGrams === undefined ? 0 : options.availableGrams,
    declaredAnalysis: [{ analyte: 'alpha', kind: 'range', range: { min: 4, max: 6 }, unit: 'percentMass', basis: 'unknown',
      source: source('replacement-alpha', 'coa'), confidence: 'low' }],
    ...(options.capGL === undefined ? {} : { product: { id: 'product:limited', name: 'Produit plafonné', manufacturer: 'Fabricant de fixture',
      form: 'pelletT90' as const, supportedUses: [dry ? 'postFermentation' as const : 'boil' as const],
      source: source('manufacturer-product', 'manufacturer'), reviewedOn: '2026-10-02', cautions: [],
      replacement: { referenceForm: 'pelletT90' as const, uses: [dry ? 'postFermentation' as const : 'boil' as const],
        basis: 'manufacturerMassRatio' as const, gramsPerGram: { min: 1, max: 1 },
        source: source('manufacturer-limit', 'manufacturer'), limitations: ['Plafond synthétique.'], maxDoseGL: options.capGL } } }),
  };
  const binding = bindHopRecipe(recipe, { materials: [original], materialByIndex: Object.fromEntries(hops.map((_, index) => [index, original.id])),
    performedIndices: options.performedSecond ? [1] : [], stage, revision: 0, wortGravity: 1.05 });
  const materials = [...binding.materials, candidate];
  const targetId = 'recipe-hop:0';
  const currentAddition = binding.program.additions[0];
  const change: HopProgramChange = { kind: 'replace', additionId: targetId, additions: [{ ...currentAddition,
    materialId: candidate.id, grams: 15 }] };
  const proposal = previewHopProgramChanges(binding.program, [change], materials);
  return { recipe, binding, materials, proposal };
}

describe('approvisionnement futur dans le brouillon de recette', () => {
  it('refuse le stock nul par défaut et garde la déclaration hors des statuts d’applicabilité', () => {
    const f = fixture();
    expect(f.proposal.applicability).toBe('unavailable');
    expect(f.proposal.stock).toContainEqual(expect.objectContaining({ materialId: 'replacement', availableGrams: 0, status: 'insufficient' }));
    expect(() => previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices())).toThrow(/stock insuffisant/i);

    const needsAlpha = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, {}, { futureProcurement });
    expect(needsAlpha.status).toBe('needsAlphaSelection');
    expect(needsAlpha.futureProcurement).toEqual(futureProcurement);
    expect(needsAlpha.conditions?.[0]).toMatch(/brouillon local/i);

    const preview = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(), { futureProcurement });
    expect(preview.status).toBe('ready');
    if (preview.status !== 'ready') throw Error('Le brouillon local explicite doit être prêt à copier.');
    expect(preview.sourceProposal.applicability).toBe('unavailable');
    expect(preview.programApplication.proposal.applicability).toBe('unavailable');
    expect(preview.futureProcurement).toEqual(futureProcurement);
    expect(preview.draft.dossier.futureProcurement).toEqual(futureProcurement);
    expect(preview.conditions?.[0]).toMatch(/approvisionnement futur déclaré.*aucun achat, aucune réservation ni écriture de stock/i);
    expect(preview.draft.dossier.conditions).toEqual(preview.conditions);

    const applied = applyHopRecipeDraftPreview(f.recipe, f.binding, preview, f.materials);
    expect(applied.dossier.futureProcurement).toEqual(futureProcurement);
    expect(applied.recipe.hops[0].weightG).toBe(15);
    expect(f.recipe.hops[0].weightG).toBe(10);
    expect(f.materials.find(material => material.id === 'replacement')?.availableGrams).toBe(0);
  });

  it('garde une déclaration au planning avec stock suffisant ou inconnu sans changer l’applicabilité', () => {
    for (const scenario of [
      { availableGrams: 100, applicability: 'available' as const },
      { availableGrams: null, applicability: 'conditional' as const },
    ]) {
      const f = fixture({ availableGrams: scenario.availableGrams });
      expect(f.proposal.applicability).toBe(scenario.applicability);
      const preview = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(), { futureProcurement });
      expect(preview.status).toBe('ready');
      if (preview.status !== 'ready') throw Error('Brouillon local attendu.');
      expect(preview.sourceProposal.applicability).toBe(scenario.applicability);
      expect(preview.programApplication.proposal.applicability).toBe(scenario.applicability);
      expect(preview.futureProcurement).toEqual(futureProcurement);
      expect(applyHopRecipeDraftPreview(f.recipe, f.binding, preview, f.materials).dossier.futureProcurement).toEqual(futureProcurement);
    }
  });

  it('fige id et raison dans la référence, refuse choix modifié ou ajouté après l’aperçu', () => {
    const f = fixture();
    const first = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(), { futureProcurement });
    const otherReason = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(),
      { futureProcurement: { ...futureProcurement, reason: 'Autre décision synthétique.' } });
    const otherId = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(),
      { futureProcurement: { ...futureProcurement, id: 'future-procurement:another-declaration' } });
    if (first.status !== 'ready' || otherReason.status !== 'ready' || otherId.status !== 'ready') throw Error('Aperçus attendus.');
    expect(first.reference).not.toBe(otherReason.reference);
    expect(first.reference).not.toBe(otherId.reference);
    for (const field of ['id', 'reason'] as const) {
      const changed = structuredClone(first);
      changed.futureProcurement![field] = field === 'id' ? 'future-procurement:tampered' : 'Raison modifiée après aperçu.';
      expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, changed, f.materials)).toThrow();
    }

    const stocked = fixture({ availableGrams: 100 });
    const historicalPreview = previewHopRecipeDraft(stocked.recipe, stocked.binding, stocked.proposal, stocked.materials, alphaChoices());
    if (historicalPreview.status !== 'ready') throw Error('Aperçu sans déclaration attendu.');
    const emptyOptionsPreview = previewHopRecipeDraft(stocked.recipe, stocked.binding, stocked.proposal, stocked.materials, alphaChoices(), {});
    expect(emptyOptionsPreview).toEqual(historicalPreview);
    expect(historicalPreview).not.toHaveProperty('futureProcurement');
    expect(historicalPreview.draft.dossier).not.toHaveProperty('futureProcurement');
    const lateChoice = { ...historicalPreview, futureProcurement };
    expect(() => applyHopRecipeDraftPreview(stocked.recipe, stocked.binding, lateChoice, stocked.materials))
      .toThrow(/ne correspondent plus à l’aperçu final/i);
  });

  it('refuse un aperçu après changement du stock courant', () => {
    const f = fixture();
    const preview = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(), { futureProcurement });
    if (preview.status !== 'ready') throw Error('Aperçu attendu.');
    const restocked = structuredClone(f.materials);
    restocked.find(material => material.id === 'replacement')!.availableGrams = 100;
    expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, preview, restocked)).toThrow();
  });

  it('n’étend pas la dérogation au stade en cours ni au plafond fabricant', () => {
    const underway = fixture({ stage: 'fermenting' });
    expect(underway.proposal.applicability).toBe('unavailable');
    expect(() => previewHopRecipeDraft(underway.recipe, underway.binding, underway.proposal, underway.materials,
      alphaChoices(), { futureProcurement })).toThrow(/stock insuffisant/i);

    const capped = fixture({ capGL: 0.5 });
    expect(capped.proposal.applicability).toBe('unavailable');
    expect(() => previewHopRecipeDraft(capped.recipe, capped.binding, capped.proposal, capped.materials,
      alphaChoices(), { futureProcurement })).toThrow(/plafond fabricant dépassé/i);
  });

  it('conserve les ajouts effectués et valide strictement la déclaration', () => {
    const f = fixture({ performedSecond: true });
    const preview = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(), { futureProcurement });
    if (preview.status !== 'ready') throw Error('Aperçu attendu.');
    expect(preview.programApplication.after.additions[1]).toEqual(preview.programApplication.before.additions[1]);
    expect(() => previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: 'recipe-hop:1',
      additions: [{ ...f.binding.program.additions[1], grams: 12 }] }], f.materials)).toThrow(/effectué/i);

    for (const invalid of [
      { futureProcurement: { id: '', reason: 'Raison' } },
      { futureProcurement: { id: 'id-valide', reason: '   ' } },
      { futureProcurement: { id: 'id-valide', reason: 'Raison', extra: 'inconnu' } },
      { futureProcurement, extra: true },
    ]) {
      expect(() => previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, alphaChoices(), invalid as never)).toThrow();
    }
  });
});
