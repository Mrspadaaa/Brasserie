import { describe, it, expect } from 'vitest';
import {
  prepareProposal,
  applyProposal,
  editableFields
} from '../../functions/src/brewerProposals';
import { refreshCompanionRecipe } from '../../src/domain/brewerRecipeRefresh';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { testHopData } from '../fixtures/hopPrediction';
const context = (): BrewerContext => ({
  recipe: {
    name: 'Pale',
    volumeL: 24,
    boilMin: 60,
    fermentables: [{ name: 'Pale', weightKg: 5, kind: 'grain', use: 'empatage' }],
    hops: [{ name: 'Cascade', weightG: 30, alpha: 6, stage: 'boil', timeMin: 60 }],
    yeast: {
      name: 'US-05',
      form: 'sèche',
      qty: 2,
      unit: 'sachet',
      fermTempMinC: 18,
      fermTempMaxC: 25
    },
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }] }
  },
  journal: {
    steps: [{ id: 'mash-0', label: 'Empâtage', tempC: 67, durationMin: 60 }],
    currentIndex: 0,
    revision: 3
  },
  batch: { volumeL: 24, status: 'planifie' },
  inventory: [],
  material: [],
  waterSources: [],
  phase: 'Empâtage',
  now: 1770000000000,
  provenance: [],
  editableTargets: ['recipe', 'journal', 'batch']
});
const args = (path: string, value: any, target = 'recipe') => ({
  target,
  title: 'Ajuster la recette',
  changes: [{ path, valueJson: JSON.stringify(value), reason: 'À ta demande' }]
});
describe('Propositions de champs : aucune écriture avant validation', () => {
  it('ne propose pas un échantillon documentaire comme lot de brassage', () => {
    const c = context(); c.hopIndex = { ...testHopData(), predictions: [], tastings: [], truncated: [] };
    c.hopIndex.lots[0].referenceOnly = true;
    c.recipe.hops[0].hopVarietyId = c.hopIndex.lots[0].varietyId;
    expect(() => prepareProposal(c, args('hops.0.hopLotId', c.hopIndex.lots[0].id))).toThrow(/documentaire/);
  });
  it.each([
    ['stage', 'whirlpool', 'aromaTiming', 'boil'],
    ['timeMin', 30, 'aromaContactHours', 1],
    ['tempC', 80, 'aromaTemperatureC', 100]
  ])('retire explicitement le contexte devenu périmé quand %s change', (field, value, aromaField, prior) => {
    const c = context(); c.recipe.hops[0][aromaField] = prior;
    const a = args(`hops.0.${field}`, value);
    expect(() => prepareProposal(c, a)).toThrow(/procédé change/);
    a.changes.push({ path: `hops.0.${aromaField}`, valueJson: 'null', reason: 'Précision à redocumenter après ce changement' });
    const p = prepareProposal(c, a);
    expect(() => applyProposal(c, p, ['C1'])).toThrow(/procédé change/);
    expect(applyProposal(c, p, p.changes.map(ch => ch.id)).hops[0][aromaField]).toBeUndefined();
    expect(c.recipe.hops[0][aromaField]).toBe(prior);
  });
  it('propose un contexte et une plage aromatiques, en gardant les deux bornes liées', () => {
    const c = context(); c.hopIndex = { ...testHopData(), predictions: [], tastings: [], truncated: [] };
    const a = args('hopMatrixId', 'fixture-beer');
    a.changes.push({ path: 'hopAromaTarget.citrus.min', valueJson: '3', reason: 'Cible demandée' },
      { path: 'hopAromaTarget.citrus.max', valueJson: '7', reason: 'Cible demandée' });
    const p = prepareProposal(c, a);
    expect(applyProposal(c, p, p.changes.map(ch => ch.id))).toMatchObject({ hopMatrixId: 'fixture-beer', hopAromaTarget: { citrus: { min: 3, max: 7 } } });
    expect(() => applyProposal(c, p, p.changes.filter(ch => !ch.path.endsWith('.max')).map(ch => ch.id))).toThrow(/ensemble/);
  });
  it('prépare un avant/après sans toucher au contexte, puis applique seulement la sélection', () => {
    const c = context(),
      copy = structuredClone(c);
    const a = args('boilMin', 70);
    a.changes.push({ path: 'name', valueJson: '"Nouvelle pale"', reason: 'Nouveau nom' });
    const proposal = prepareProposal(c, a);
    expect(c).toEqual(copy);
    expect(proposal.changes[0].before).toBe(60);
    const next = applyProposal(c, proposal, ['C1']);
    expect(next.boilMin).toBe(70);
    expect(next.name).toBe('Pale');
    expect(c).toEqual(copy);
  });
  it('refuse les chemins hors liste et toute pollution de prototype', () => {
    for (const path of [
      '__proto__.polluted',
      'constructor.prototype',
      'favorite',
      'id',
      'steps.0.startedAt'
    ])
      expect(() => prepareProposal(context(), args(path, 70))).toThrow();
    expect(({} as any).polluted).toBeUndefined();
  });
  it('refuse les champs imbriqués et doublons dans la même proposition', () => {
    const a = args('yeast', context().recipe.yeast);
    a.changes.push({ path: 'yeast.qty', valueJson: '3', reason: 'Test' });
    expect(() => prepareProposal(context(), a)).toThrow(/imbriqués/);
  });
  it('refuse les modifications périmées, même si un autre ingrédient a changé', () => {
    const c = context(),
      p = prepareProposal(c, args('boilMin', 70));
    c.recipe.fermentables[0].weightKg = 6;
    expect(() => applyProposal(c, p, ['C1'])).toThrow(/changé/);
  });
  it('refuse une sélection partielle qui casse les horaires de houblon', () => {
    const c = context(),
      a = args('boilMin', 30);
    a.changes.push({ path: 'hops.0.timeMin', valueJson: '30', reason: 'Adapter le contact' });
    const p = prepareProposal(c, a);
    expect(() => applyProposal(c, p, ['C1'])).toThrow(/houblon/);
    expect(applyProposal(c, p, ['C1', 'C2']).boilMin).toBe(30);
  });
  it('refuse les températures incohérentes et les nombres hors limites', () => {
    expect(() => prepareProposal(context(), args('yeast.fermTempMinC', 30))).toThrow(/minimum/);
    expect(() => prepareProposal(context(), args('boilMin', -1))).toThrow(/limites/);
    expect(() => prepareProposal(context(), args('volumeL', '24'))).toThrow(/limites/);
  });
  it('complète une donnée manquante et permet une nouvelle ligne complète', () => {
    const c = context();
    const p = prepareProposal(c, args('fermentables.0.colorEbc', 6));
    expect(p.changes[0].before).toBeNull();
    const a = prepareProposal(
      c,
      args('fermentables', [
        ...c.recipe.fermentables,
        { name: 'Avoine', weightKg: 0.5, kind: 'grain', use: 'empatage' }
      ])
    );
    expect(applyProposal(c, a, ['C1']).fermentables).toHaveLength(2);
    expect(() => prepareProposal(c, args('fermentables', [{ name: 'Incomplet' }]))).toThrow(
      /incomplète/
    );
  });
  it('interdit de modifier un geste terminé ou une horloge', () => {
    const c = context();
    c.journal.steps[0].doneAt = c.now;
    expect(editableFields(c, 'journal')['steps.0.durationMin']).toBeUndefined();
    expect(() => prepareProposal(c, args('startedAt', 1, 'journal'))).toThrow();
    expect(() => prepareProposal(c, args('status', 'termine', 'batch'))).toThrow();
  });
  it('un relevé est seulement ajouté à la validation, avec unité et date contrôlées', () => {
    const c = context(),
      p = prepareProposal(
        c,
        args('newReading', { kind: 'temperature', value: 62, unit: '°C' }, 'journal')
      );
    expect(c.journal.readings).toBeUndefined();
    expect(p.changes[0].value.at).toBe(c.now);
    const next = applyProposal(c, p, ['C1']);
    expect(next.readings[0]).toMatchObject({ value: 62, unit: '°C', stepId: 'mash-0' });
    expect(next.newReading).toBeUndefined();
    const ph = prepareProposal(
      c,
      args('newReading', { kind: 'ph', value: 5.4, unit: 'pH', roomTemp: true }, 'journal')
    );
    expect(applyProposal(c, ph, ['C1']).readings[0].roomTemp).toBe(true);
    expect(() =>
      prepareProposal(
        c,
        args('newReading', { kind: 'densite', value: 1050, unit: 'SG' }, 'journal')
      )
    ).toThrow(/unité/);
    expect(() =>
      prepareProposal(
        c,
        args(
          'newReading',
          { kind: 'temperature', value: 60, unit: '°C', at: c.now + 100 },
          'journal'
        )
      )
    ).toThrow(/date/);
  });
  it('une proposition traitée ne peut être rejouée comme une nouvelle écriture', () => {
    const c = context(),
      p = prepareProposal(c, args('boilMin', 70));
    p.status = 'applied';
    expect(() => applyProposal(c, p, ['C1'])).toThrow();
  });
  it('ne donne aucun champ éditable à une ancienne interface sans capacités explicites', () => {
    const c = context();
    delete c.editableTargets;
    expect(editableFields(c, 'recipe')).toEqual({});
    expect(() => prepareProposal(c, args('boilMin', 70))).toThrow();
  });
  it('recalcule les ions affichés sans changer les doses physiques', () => {
    const c = context();
    c.recipe.waterPlan = {
      sourceSnapshot: { ca: 60, mg: 5, na: 10, so4: 25, cl: 20, hco3: 180 },
      mashWaterL: 20,
      spargeWaterL: 5,
      diRatioPct: 100,
      mash: {},
      sparge: {},
      acid: { id: 'lactique', mash: 0, sparge: 0 },
      wortIons: { ca: 999 }
    };
    const next = refreshCompanionRecipe(c.recipe);
    expect(next.waterPlan?.wortIons?.ca).toBe(0);
    expect(next.waterPlan?.acid).toEqual(c.recipe.waterPlan.acid);
  });
});
