import { describe, expect, it } from 'vitest';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition } from '../../src/domain/hopDecision/types';
import {
  applyHopProgramProposal,
  previewHopProgramChanges,
  programFingerprint,
  inspectHopProgramAvailability,
  undoHopProgramApplication,
} from '../../src/domain/hopDecision/programs';

const material = (over: Partial<HopDecisionMaterial> = {}): HopDecisionMaterial => ({
  id: 'lot-a', name: 'Lot A', form: 'pelletT90', availableGrams: 100,
  variety: { id: 'var-a', name: 'Variété A', aliases: [], form: 'pelletT90', analysis: [], descriptions: [] },
  lot: { id: 'lot-a', varietyId: 'var-a', name: 'Lot A', form: 'pelletT90', analysis: [] },
  ...over,
});

const addition = (over: Partial<HopProgramAddition> = {}): HopProgramAddition => ({
  id: 'dry-a', materialId: 'lot-a', grams: 10, use: 'postFermentation', status: 'planned',
  contactHours: 48, temperatureC: 16,
  ...over,
});

const program = (over: Partial<HopDecisionProgram> = {}): HopDecisionProgram => ({
  id: 'brew-a', revision: 3, stage: 'planning', volumeL: 20, wortGravity: 1.05,
  additions: [addition()],
  ...over,
});
const source = { title: 'Analyse documentée', author: 'Laboratoire', year: 2026, kind: 'research' as const, reference: 'https://example.invalid/analysis' };
const alphaMeasurement = (value: number) => ({ analyte: 'alpha' as const, unit: 'percentMass' as const, basis: 'asIs' as const,
  kind: 'point' as const, value, source, confidence: 'medium' as const });

describe('Programmes de houblon versionnés', () => {
  it('fingerprint le contenu de manière canonique et distingue une révision ou un historique différent', () => {
    const left = program();
    const right = { additions: structuredClone(left.additions), wortGravity: left.wortGravity, volumeL: left.volumeL,
      stage: left.stage, revision: left.revision, id: left.id };
    expect(programFingerprint(left)).toBe(programFingerprint(right));
    expect(programFingerprint({ ...left, revision: left.revision + 1 })).not.toBe(programFingerprint(left));
    expect(programFingerprint({ ...left, additions: [addition({ status: 'performed' })] })).not.toBe(programFingerprint(left));
  });

  it('prévisualise, applique puis annule une modification prévue sans muter les entrées', () => {
    const before = program({ additions: [addition({ id: 'performed', use: 'firstWort', status: 'performed', grams: 12 }), addition()] });
    const saved = structuredClone(before);
    const stock = [material()];
    const change = { kind: 'replace' as const, additionId: 'dry-a', additions: [addition({ grams: 8 })] };
    const preview = previewHopProgramChanges(before, [change], stock);

    expect(preview).toMatchObject({ baseline: programFingerprint(before), applicability: 'available', program: { revision: 4 } });
    expect(preview.stock).toEqual([{ materialId: 'lot-a', neededGrams: 8, availableGrams: 100, status: 'available' }]);
    const applied = applyHopProgramProposal(before, preview, stock);
    expect(applied.after).toEqual(preview.program);
    expect(applied.before).toEqual(saved);
    expect(before).toEqual(saved);
    const undone = undoHopProgramApplication(applied.after, applied, stock);
    expect({ ...undone, revision: before.revision }).toEqual(before);
    expect(undone.revision).toBe(5);
    expect(undone.additions.find(item => item.id === 'performed')).toEqual(before.additions[0]);
  });

  it('cumule seulement le stock des opérations prévues et refuse le manque explicite par défaut', () => {
    const current = program({ additions: [
      addition({ id: 'already-done', grams: 50, status: 'performed' }),
      addition({ id: 'planned-one', grams: 6 }),
      addition({ id: 'planned-two', grams: 5 }),
    ] });
    const stock = [material({ availableGrams: 12 })];
    const proposal = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'planned-three', grams: 2 }) }], stock);
    expect(proposal.stock).toEqual([{ materialId: 'lot-a', neededGrams: 13, availableGrams: 12, status: 'insufficient' }]);
    expect(proposal.applicability).toBe('unavailable');
    expect(() => applyHopProgramProposal(current, proposal, stock)).toThrow(/stock insuffisant/i);
    const procurementPlan = applyHopProgramProposal(current, proposal, stock, { allowFutureProcurement: true });
    expect(procurementPlan.after.additions).toHaveLength(4);
    expect(procurementPlan.proposal.applicability).toBe('unavailable');
    expect(() => applyHopProgramProposal({ ...current, stage: 'hotSide' }, proposal, stock, { allowFutureProcurement: true })).toThrow(/changé depuis l’aperçu/i);
  });

  it('garde une masse inconnue conditionnelle sans l’imputer et exige une dose pour un nouvel ajout', () => {
    const current = program({ additions: [addition({ grams: null })] });
    const proposal = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'known-dose', grams: 2 }) }], [material()]);
    expect(proposal.stock).toEqual([{ materialId: 'lot-a', neededGrams: null, availableGrams: 100, status: 'unknown' }]);
    expect(proposal.applicability).toBe('conditional');
    expect(proposal.conditions.join(' ')).toMatch(/besoin ou stock restant inconnu|masse à choisir/i);
    expect(applyHopProgramProposal(current, proposal, [material()]).after.additions[0].grams).toBeNull();

    expect(() => previewHopProgramChanges(program(), [{ kind: 'append', addition: addition({ id: 'unknown-dose', grams: null }) }], [material()]))
      .toThrow(/masse inconnue/i);
  });

  it('ne traite jamais un lot documentaire comme du stock, même avec une quantité annoncée', () => {
    const current = program({ additions: [] });
    const documentary = material({ lot: { id: 'paper-lot', varietyId: 'var-a', name: 'Lot publié', form: 'pelletT90', referenceOnly: true, analysis: [] }, availableGrams: 500 });
    const proposal = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'paper-reference', materialId: documentary.id, grams: 4 }) }], [documentary]);
    expect(proposal.stock).toEqual([{ materialId: documentary.id, neededGrams: 4, availableGrams: null, status: 'referenceOnly' }]);
    expect(proposal.applicability).toBe('conditional');
    expect(proposal.conditions.join(' ')).toMatch(/lot documentaire uniquement/i);
    expect(applyHopProgramProposal(current, proposal, [documentary]).after.additions[0].materialId).toBe(documentary.id);
  });

  it('regroupe plusieurs identités matière reliées au même stock physique', () => {
    const current = program({ additions: [addition({ id: 'alias-a', materialId: 'material-a', grams: 60 })] });
    const materials = [
      material({ id: 'material-a', stockItemRef: 'MP-HOP-1', availableGrams: 100, lot: undefined }),
      material({ id: 'material-b', name: 'Même stock, autre alias', stockItemRef: 'MP-HOP-1', availableGrams: 100, lot: undefined }),
    ];
    const proposal = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'alias-b', materialId: 'material-b', grams: 60 }) }], materials);
    expect(proposal.stock).toEqual([{
      materialId: 'material-a', materialIds: ['material-a', 'material-b'], stockItemRef: 'MP-HOP-1',
      neededGrams: 120, availableGrams: 100, status: 'insufficient',
    }]);
    expect(proposal.applicability).toBe('unavailable');
    expect(() => applyHopProgramProposal(current, proposal, materials)).toThrow(/stock insuffisant/i);

    const contradictory = materials.map((item, index) => ({ ...item, availableGrams: index === 0 ? 100 : 90 }));
    const uncertain = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'alias-b', materialId: 'material-b', grams: 20 }) }], contradictory);
    expect(uncertain.stock[0]).toMatchObject({ materialIds: ['material-a', 'material-b'], stockItemRef: 'MP-HOP-1', availableGrams: null, status: 'unknown' });
    expect(uncertain.applicability).toBe('conditional');
  });

  it('résout le stockItemRef du lot et refuse les liens explicites contradictoires', () => {
    const current = program({ additions: [addition({ id: 'lot-a', materialId: 'v1', grams: 8 })] });
    const lotStock = material({ id: 'v1', stockItemRef: undefined, availableGrams: 10,
      lot: { ...material().lot!, stockItemRef: 'same-stock' } });
    const lotAlias = material({ id: 'v2', stockItemRef: undefined, availableGrams: 10,
      lot: { ...material().lot!, id: 'lot-alias', stockItemRef: 'same-stock' } });
    const proposal = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'lot-b', materialId: 'v2', grams: 8 }) }], [lotStock, lotAlias]);
    expect(proposal.stock).toEqual([{
      materialId: 'v1', materialIds: ['v1', 'v2'], stockItemRef: 'same-stock',
      neededGrams: 16, availableGrams: 10, status: 'insufficient',
    }]);
    const contradictory = material({ id: 'bad-link', stockItemRef: 'stock-material',
      lot: { ...material().lot!, stockItemRef: 'stock-lot' } });
    expect(() => inspectHopProgramAvailability(program({ additions: [addition({ materialId: contradictory.id })] }), [contradictory]))
      .toThrow(/références de stock contradictoires/i);
  });

  it('vérifie les usages documentés d’un produit commercial pour chaque nouvel ajout', () => {
    const source = { title: 'Fiche fabricant', author: 'Fabricant', year: 2026, kind: 'manufacturer' as const, reference: 'https://example.invalid/hop' };
    const product = { id: 'product-a', name: 'Produit A', manufacturer: 'Fabricant', form: 'pelletT90' as const,
      supportedUses: ['boil' as const], source, reviewedOn: '2026-09-30', cautions: [] };
    const candidate = material({ id: 'product-material', product, lot: undefined });
    expect(() => previewHopProgramChanges(program({ additions: [] }), [
      { kind: 'append', addition: addition({ id: 'dry-product', materialId: candidate.id, use: 'postFermentation' }) },
    ], [candidate])).toThrow(/ne documente pas l’emploi/i);
  });

  it.each([
    ['analyse du lot', material({ declaredAnalysis: [alphaMeasurement(8)] })],
    ['identité du lot', material({ lot: { ...material().lot!, lotNumber: 'LOT-CHANGÉ' } })],
    ['identité du produit', material({ product: { id: 'product-a', name: 'Produit A', manufacturer: 'Fabricant A', form: 'pelletT90',
      supportedUses: ['postFermentation'], source, reviewedOn: '2026-09-30', cautions: [] } })],
  ])('refuse une application si l’%s change sous le même identifiant matière', (_, changedMaterial) => {
    const current = program();
    const originalMaterial = material({ declaredAnalysis: [alphaMeasurement(7)] });
    const proposal = previewHopProgramChanges(current, [{ kind: 'replace', additionId: 'dry-a', additions: [addition({ grams: 12 })] }], [originalMaterial]);
    expect(() => applyHopProgramProposal(current, proposal, [changedMaterial])).toThrow(/aperçu calculé/i);
  });

  it('protège les ajouts effectués et détecte deux historiques différents au même stade', () => {
    const planned = program();
    const sameStageDifferentHistory = program({ additions: [addition({ status: 'performed' })] });
    const preview = previewHopProgramChanges(planned, [{ kind: 'append', addition: addition({ id: 'new-hop', grams: 1 }) }], [material()]);
    expect(() => applyHopProgramProposal(sameStageDifferentHistory, preview, [material()])).toThrow(/programme a changé/i);
    expect(() => previewHopProgramChanges(sameStageDifferentHistory, [{ kind: 'remove', additionId: 'dry-a' }], [material()])).toThrow(/effectué/i);
    expect(() => previewHopProgramChanges(sameStageDifferentHistory, [{ kind: 'replace', additionId: 'dry-a', additions: [addition()] }], [material()])).toThrow(/effectué/i);
    expect(() => previewHopProgramChanges(planned, [{ kind: 'append', addition: addition({ id: 'false-history', status: 'performed' }) }], [material()])).toThrow(/doit rester prévu/i);
  });

  it('refuse les emplois passés au stade courant et toute modification d’un programme conditionné', () => {
    const hotSide = program({ stage: 'hotSide', additions: [] });
    expect(() => previewHopProgramChanges(hotSide, [{ kind: 'append', addition: addition({ id: 'too-late', use: 'firstWort' }) }], [material()]))
      .toThrow(/déjà passé/i);
    expect(previewHopProgramChanges(hotSide, [{ kind: 'append', addition: addition({ id: 'boil-now', use: 'boil', boilMinutes: 30 }) }], [material()]).program.additions[0].use)
      .toBe('boil');
    expect(() => previewHopProgramChanges(program({ stage: 'packaged' }), [{ kind: 'remove', additionId: 'dry-a' }], [material()]))
      .toThrow(/conditionné/i);
  });

  it('refuse un aperçu falsifié, une base obsolète et un undo après une autre modification', () => {
    const current = program();
    const stock = [material()];
    const proposal = previewHopProgramChanges(current, [{ kind: 'replace', additionId: 'dry-a', additions: [addition({ grams: 9 })] }], stock);
    const forged = structuredClone(proposal);
    forged.program.additions[0].grams = 1;
    expect(() => applyHopProgramProposal(current, forged, stock)).toThrow(/ne correspond plus à l’aperçu/i);
    expect(() => applyHopProgramProposal({ ...current, revision: 4 }, proposal, stock)).toThrow(/changé depuis l’aperçu/i);

    const applied = applyHopProgramProposal(current, proposal, stock);
    const edited = { ...applied.after, additions: applied.after.additions.map(item => ({ ...item, grams: 7 })) };
    expect(() => undoHopProgramApplication(edited, applied, stock)).toThrow(/changé depuis l’application/i);
  });

  it('inspecte un programme sans changement, y compris après conditionnement', () => {
    const current = program({ stage: 'packaged' });
    const before = structuredClone(current);
    const availability = inspectHopProgramAvailability(current, [material()]);
    expect(availability.applicability).toBe('conditional');
    expect(availability.conditions.join(' ')).toMatch(/déjà passé/i);
    expect(availability).not.toHaveProperty('program');
    expect(availability).not.toHaveProperty('changes');
    expect(current).toEqual(before);
  });

  it('applique les plafonds de dose cumulés au produit dans la portée d’usage documentée', () => {
    const product = { id: 'spectrum', name: 'SPECTRUM', manufacturer: 'HPA', form: 'extract' as const,
      supportedUses: ['fermentation', 'postFermentation'] as const,
      source: { title: 'TDS', author: 'HPA', year: 2024, kind: 'manufacturer' as const, reference: 'https://example.invalid/tds' },
      reviewedOn: '2026-09-30', cautions: [], replacement: { referenceForm: 'pelletT90' as const, uses: ['fermentation' as const],
        basis: 'manufacturerMassRatio' as const, gramsPerGram: { min: 0.125, max: 0.2 }, source: { title: 'TDS', author: 'HPA', year: 2024,
          kind: 'manufacturer' as const, reference: 'https://example.invalid/tds' }, limitations: ['Fermentation seulement.'], maxDoseGL: 1 } };
    const s1 = material({ id: 's1', name: 'SPECTRUM alias 1', form: 'extract', product, variety: undefined, lot: undefined,
      stockItemRef: 'stock-s1', availableGrams: 500 });
    const s2 = material({ id: 's2', name: 'SPECTRUM alias 2', form: 'extract', product: structuredClone(product), variety: undefined, lot: undefined,
      stockItemRef: 'stock-s2', availableGrams: 500 });
    const base = program({ stage: 'fermenting', additions: [] });
    const changes = [s1, s2].map((candidate, index) => ({ kind: 'append' as const,
      addition: addition({ id: `spectrum-${index}`, materialId: candidate.id, grams: 12, use: 'fermentation', contactHours: 48, temperatureC: 20 }) }));
    const proposal = previewHopProgramChanges(base, changes, [s1, s2]);
    expect(proposal.applicability).toBe('unavailable');
    expect(proposal.conditions.join(' ')).toMatch(/1\.2 g\/L.*maximum documenté/i);
    expect(() => applyHopProgramProposal(base, proposal, [s1, s2], { allowFutureProcurement: true })).toThrow(/plafond fabricant dépassé/i);

    const postFermentation = program({ stage: 'fermenting', volumeL: 20, additions: [addition({ id: 'dry-product', materialId: 's1', grams: 30,
      use: 'postFermentation', contactHours: 48, temperatureC: 20 })] });
    const outOfScope = inspectHopProgramAvailability(postFermentation, [s1]);
    expect(outOfScope.applicability).toBe('conditional');
    expect(outOfScope.applicability).not.toBe('available');
    expect(outOfScope.conditions.join(' ')).toMatch(/ne couvre pas l’emploi/i);

    const unknownVolume = inspectHopProgramAvailability({ ...postFermentation, volumeL: null, additions: [addition({ id: 'known-scope', materialId: 's1', grams: 30,
      use: 'fermentation', contactHours: 48, temperatureC: 20 })] }, [s1]);
    expect(unknownVolume.applicability).toBe('conditional');
    expect(unknownVolume.conditions.join(' ')).toMatch(/volume inconnu/i);
  });

  it('signale un dépassement historique sans bloquer un autre produit, mais refuse une dose ajoutée du même produit', () => {
    const product = { id: 'spectrum', name: 'SPECTRUM', manufacturer: 'HPA', form: 'extract' as const,
      supportedUses: ['fermentation'] as const,
      source: { title: 'TDS', author: 'HPA', year: 2024, kind: 'manufacturer' as const, reference: 'https://example.invalid/tds' },
      reviewedOn: '2026-09-30', cautions: [], replacement: { referenceForm: 'pelletT90' as const, uses: ['fermentation' as const],
        basis: 'manufacturerMassRatio' as const, gramsPerGram: { min: 0.125, max: 0.2 }, source: { title: 'TDS', author: 'HPA', year: 2024,
          kind: 'manufacturer' as const, reference: 'https://example.invalid/tds' }, limitations: [], maxDoseGL: 1 } };
    const s = material({ id: 'spectrum-alias', form: 'extract', product, variety: undefined, lot: undefined, stockItemRef: 'stock-s', availableGrams: 500 });
    const current = program({ stage: 'fermenting', additions: [addition({ id: 'done-s', materialId: s.id, grams: 30,
      use: 'fermentation', status: 'performed', contactHours: 48, temperatureC: 20 })] });
    const inspected = inspectHopProgramAvailability(current, [s]);
    expect(inspected.applicability).toBe('conditional');
    expect(inspected.applicability).not.toBe('unavailable');
    expect(inspected.conditions.join(' ')).toMatch(/figurent déjà dans les opérations/i);
    const other = material({ id: 'other', stockItemRef: 'stock-other', availableGrams: 100 });
    const unrelated = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'other-hop', materialId: other.id, grams: 4,
      use: 'fermentation', contactHours: 48, temperatureC: 20 }) }], [s, other]);
    expect(unrelated.applicability).toBe('conditional');
    const moreS = previewHopProgramChanges(current, [{ kind: 'append', addition: addition({ id: 'more-s', materialId: s.id, grams: 1,
      use: 'fermentation', contactHours: 48, temperatureC: 20 }) }], [s]);
    expect(moreS.applicability).toBe('unavailable');
  });

  it('annule avec le stock rafraîchi si la restauration reste possible, et refuse si elle ne l’est plus', () => {
    const before = program({ additions: [addition({ grams: 10 })] });
    const stock = [material({ availableGrams: 100 })];
    const proposal = previewHopProgramChanges(before, [{ kind: 'replace', additionId: 'dry-a', additions: [addition({ grams: 9 })] }], stock);
    const application = applyHopProgramProposal(before, proposal, stock);
    const refreshed = [material({ availableGrams: 99 })];
    expect(undoHopProgramApplication(application.after, application, refreshed)).toMatchObject({ revision: 5, additions: before.additions });

    const largerBefore = program({ additions: [addition({ grams: 100 })] });
    const smaller = previewHopProgramChanges(largerBefore, [{ kind: 'replace', additionId: 'dry-a', additions: [addition({ grams: 10 })] }], stock);
    const reduced = applyHopProgramProposal(largerBefore, smaller, stock);
    expect(() => undoHopProgramApplication(reduced.after, reduced, refreshed)).toThrow(/stock insuffisant pour restaurer/i);
  });

  it('refuse undo quand les faits de la matière référencée ont changé', () => {
    const before = program();
    const originalMaterial = material({ declaredAnalysis: [alphaMeasurement(7)] });
    const proposal = previewHopProgramChanges(before, [{ kind: 'replace', additionId: 'dry-a', additions: [addition({ grams: 9 })] }], [originalMaterial]);
    const applied = applyHopProgramProposal(before, proposal, [originalMaterial]);
    const changedMaterial = material({ declaredAnalysis: [alphaMeasurement(9)] });
    expect(() => undoHopProgramApplication(applied.after, applied, [changedMaterial])).toThrow(/faits ou l’identité/i);
  });
});
