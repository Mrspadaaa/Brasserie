import { describe, expect, it } from 'vitest';
import { applyYeastPitchingAdvice, createYeastPreparation, estimatePitchingWort, evaluateYeastPitching, keepIndependentPitchingWort, pitchingAdditionId, pitchingContext, rankYeastOffers, selectYeastProduct, yeastOfferState, yeastPreparationState } from '../../src/domain/yeastPitching';
import { readYeastPitchingPlan, readYeastSupply, type YeastProduct, type YeastOffer } from '../../functions/src/yeastSupplySchema';
import type { Fermentable, YeastSpec, StockItem } from '../../src/types';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { writeRecipeText, readRecipeText } from '../../src/domain/recipeTransfer';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import supplyBootstrap from '../../src/data/yeastSupplyBootstrap.json';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { parseBackup } from '../../functions/src/backupCore';

const now = Date.parse('2026-09-27T12:00:00Z');
const source = { url: 'https://maker.example/product-test', title: 'Notice fixture', checkedAt: '2026-09-27T10:00:00Z' };
const dry: YeastProduct = { id: 'dry-13', referenceId: 'strain-new', label: 'Produit 13 g', manufacturer: 'Fixture', form: 'sèche', source,
  format: { amount: 13, unit: 'g', label: '13 g', source }, dose: { range: { min: 50, max: 80 }, qualifier: 'range', unit: 'g/hL', conditions: 'Conditions documentées fixture', source } };
const liquid: YeastProduct = { id: 'liquid-new', referenceId: 'strain-liquid', label: 'Liquide', manufacturer: 'Fixture', form: 'liquide', source,
  format: { amount: 80, unit: 'mL', label: '80 mL', source },
  cellsPerPack: { range: { min: 100, max: 100 }, kind: 'total', qualifier: 'point', conditions: 'Cellules totales déclarées fixture', source },
  starter: { id: 'method-test', label: 'Méthode fixture', source, method: 'Agitation documentée', medium: 'malt-extract', targetSg: 1.04,
    conditions: 'Volume choisi selon notice, croissance non estimée', leadHours: { min: 24, max: 36 }, steps: ['Préparer le milieu', 'Contrôler la densité'] } };
const chosen = (product = dry): YeastSpec => ({ name: product.label, hopIndexId: product.referenceId, form: product.form, qty: 1, unit: 'sachet',
  pitching: { version: 1, product: structuredClone(product), wort: { volumeL: 40, sg: 1.05, basis: 'measured', volumeBasis: 'measured', sgBasis: 'measured' } } });
const recipe = (yeast = chosen()) => ({ yeast, volumeL: 40, efficiencyPct: 70, fermentables: [] as Fermentable[] });
const offer = (id: string, country: string): YeastOffer => ({ id, productId: dry.id, seller: id, sellerCountry: country, sellerSource: source, region: 'Europe',
  url: source.url, stock: { status: 'in-stock', source, text: 'En stock fixture' }, shipping: { destination: 'CH', status: 'yes', conditions: 'Livraison fixture', source } });

describe('Plan levure : propriétés indépendantes du nom ou style', () => {
  it('charge les offres sourcées et leurs références sans association nominale', () => {
    const supply = readYeastSupply(supplyBootstrap); expect(supply).toBeDefined();
    const references = new Set(yeastReferences([]).map(y => y.id));
    expect(supply!.products.filter(p => !references.has(p.referenceId)).map(p => p.referenceId)).toEqual([]);
  });
  it('conserve dose et plage de packs, sans poids universel ou écrasement manuel', () => {
    const r = recipe(); const before = structuredClone(r); const advice = evaluateYeastPitching(r);
    expect(advice.range).toEqual({ min: 20, max: 32 }); expect(advice.packs).toEqual({ min: 2, max: 3 });
    expect(r).toEqual(before); expect(advice.plannedPacks).toBe(1); expect(advice.packsToBuy).toBeUndefined();
    expect(applyYeastPitchingAdvice(r.yeast, advice, 3).qty).toBe(3);
    expect(() => applyYeastPitchingAdvice(r.yeast, advice, 2.5)).toThrow();
  });
  it('refuse conseil précédent après changement du volume physique', () => {
    const r = recipe(), advice = evaluateYeastPitching(r);
    const next = { ...r.yeast, pitching: { ...r.yeast.pitching!, wort: { ...r.yeast.pitching!.wort!, volumeL: 80 } } };
    expect(() => applyYeastPitchingAdvice(next, advice, 3)).toThrow(/périmé/);
  });
  it('reste valable après réordonnancement de clés et changement sans effet sur la densité', () => {
    const y = chosen(), key = pitchingContext(y);
    const p = y.pitching!.product!;
    y.pitching!.product = { source: p.source, dose: p.dose, format: p.format, form: p.form, manufacturer: p.manufacturer, label: p.label, referenceId: p.referenceId, id: p.id };
    expect(pitchingContext(y)).toBe(key);
    const r = { ...recipe(), fermentables: [{ name: 'Extrait', kind: 'extrait' as const, use: 'ebullition' as const, weightKg: 2, potentialPpg: 40, colorEbc: 5 }] };
    r.yeast.pitching!.wort = estimatePitchingWort(r).wort;
    r.fermentables[0].colorEbc = 20; r.efficiencyPct = 85;
    expect(evaluateYeastPitching(r).stale).toBe(false);
  });
  it('transporte une dose fabricant bornée sans la convertir en point ni packs exacts', () => {
    const product: YeastProduct = { ...dry, dose: { ...dry.dose!, qualifier: 'lower-bound', range: { min: 50, max: 50 } } };
    const advice = evaluateYeastPitching(recipe(chosen(product)));
    expect(advice.bound).toEqual({ operator: '>=', value: 20 }); expect(advice.range).toBeUndefined(); expect(advice.packs).toBeUndefined();
  });
  it('garde les signes stricts et inclusifs des bornes fabricant >, ≥, < et ≤', () => {
    const cases = [
      { qualifier: 'strict-lower-bound', value: 50, operator: '>' },
      { qualifier: 'lower-bound', value: 50, operator: '>=' },
      { qualifier: 'strict-upper-bound', value: 80, operator: '<' },
      { qualifier: 'upper-bound', value: 80, operator: '<=' }
    ] as const;
    for (const { qualifier, value, operator } of cases) {
      const product: YeastProduct = { ...dry, dose: { ...dry.dose!, qualifier, range: { min: value, max: value } } };
      const advice = evaluateYeastPitching(recipe(chosen(product)));
      expect(advice.bound).toEqual({ operator, value: value * 40 / 100 });
      expect(advice.range).toBeUndefined(); expect(advice.packs).toBeUndefined();
      expect(readYeastPitchingPlan({ version: 1, product })).toMatchObject({ product: { dose: { qualifier } } });
    }
    const invalidStrictRange = { ...dry, dose: { ...dry.dose!, qualifier: 'strict-lower-bound' as const, range: { min: 50, max: 51 } } };
    expect(readYeastPitchingPlan({ version: 1, product: invalidStrictRange })).toBeUndefined();
  });
  it('respecte zéro cellules viables mesurées sans retrancher un pack détenu mais mort', () => {
    const yeast = chosen({ ...liquid, cellsPerPack: { ...liquid.cellsPerPack!, kind: 'viable' } });
    yeast.stockItemRef = 'LOT-TEST';
    yeast.pitching!.rate = { value: 1, conditions: 'Taux fixture', source };
    yeast.pitching!.lot = { productId: liquid.id, viableCellsBillion: 0, cellsBasis: 'measured', cellMeasurement: { at: source.checkedAt, method: 'Comptage viable fixture' } };
    expect(readYeastPitchingPlan(yeast.pitching)).toBeDefined();
    const stock: StockItem = { id: 'LOT-TEST', ref: 'LOT-TEST', name: liquid.label, category: 'Levure', unit: 'pack', currentStock: 1, minStock: 0, reorder: false, yeastLot: { productId: liquid.id } };
    const advice = evaluateYeastPitching(recipe(yeast), [stock]);
    expect(advice.availableCellsBillion).toBe(0); expect(advice.balanceCellsBillion).toBeLessThan(0);
    expect(advice.packsToBuy).toEqual(advice.packs);
  });
  it('n’invente aucun format ni cellules viables depuis mL/cellules totales/bornes', () => {
    const r = recipe(chosen(liquid)); r.yeast.pitching!.rate = { value: 1, conditions: 'Taux fixture explicitement choisi', source };
    expect(evaluateYeastPitching(r).range!.min).toBeGreaterThan(0); expect(evaluateYeastPitching(r).packs).toBeUndefined();
    r.yeast.pitching!.product!.cellsPerPack!.kind = 'viable'; r.yeast.pitching!.product!.cellsPerPack!.qualifier = 'lower-bound';
    expect(evaluateYeastPitching(r).packs).toBeUndefined();
    const noFormat = { ...dry, format: undefined }; expect(evaluateYeastPitching(recipe(chosen(noFormat))).packs).toBeUndefined();
    delete (r.yeast.pitching!.product!.cellsPerPack! as any).qualifier;
    expect(readYeastPitchingPlan(r.yeast.pitching)).toBeUndefined();
    expect(evaluateYeastPitching(r).packs).toBeUndefined();
  });
  it('distingue un ajout avant/après pitch, sans soustraction sur une mesure ou maltodextrine', () => {
    const f: Fermentable = { name: 'Dextrines fixture', kind: 'extrait', use: 'fermentation', weightKg: 0.5, potentialPpg: 40, fermentabilityPct: 0 };
    const base: Fermentable = { name: 'Extrait', kind: 'extrait', use: 'ebullition', weightKg: 2, potentialPpg: 40 };
    const r = { ...recipe(), fermentables: [base, f] }, id = pitchingAdditionId(1, f.name);
    expect(estimatePitchingWort(r).wort).toBeUndefined();
    const before = estimatePitchingWort(r, { [id]: 'before' }), after = estimatePitchingWort(r, { [id]: 'after' });
    expect(before.wort!.sg).toBeGreaterThan(after.wort!.sg!);
    expect(evaluateYeastPitching(r).range).toEqual(evaluateYeastPitching(recipe()).range);
  });
  it('conserve une correction indépendante du moût lors Undo et retire le lot au nouveau produit', () => {
    const previous = chosen(), current = chosen(); current.pitching!.wort!.volumeL = 30;
    expect(keepIndependentPitchingWort(previous, current).pitching!.wort!.volumeL).toBe(30);
    previous.pitching!.lot = { lotNumber: 'A' };
    const next = selectYeastProduct(previous, { ...dry, id: 'other-format' });
    expect(next.qty).toBe(1); expect(next.pitching!.lot).toBeUndefined(); expect(next.pitching!.wort).toEqual(previous.pitching!.wort);
  });
  it('préserve aussi un effacement du moût lors Undo au lieu de ressusciter l’ancien', () => {
    const previous = chosen(), current = chosen();
    delete current.pitching!.wort;
    const restored = keepIndependentPitchingWort(previous, current);
    expect(restored.pitching?.wort).toBeUndefined();
    expect(previous.pitching?.wort).toBeDefined();
    expect(restored.pitching?.product?.id).toBe(previous.pitching?.product?.id);
  });
  it('date séparément stock/livraison et classe FR/DE au même rang, laboratoire sans effet', () => {
    expect(rankYeastOffers([offer('de', 'DE'), offer('ch', 'CH'), offer('fr', 'FR'), offer('nl', 'NL')], now).map(o => o.sellerCountry)).toEqual(['CH', 'DE', 'FR', 'NL']);
    const old = offer('old', 'CH'); old.stock.source = { ...source, checkedAt: '2026-09-24T10:00:00Z' };
    expect(yeastOfferState(old, now).buyable).toBe(false);
    const blocked = offer('blocked', 'FR'); blocked.shipping!.status = 'no'; expect(yeastOfferState(blocked, now).buyable).toBe(false);
    expect(readYeastSupply({ version: 1, products: [dry], offers: [{ ...old, productId: 'unrelated' }] })).toBeUndefined();
  });
  it('prépare avant J0 selon méthode sourcée sans promesse de croissance et refuse trop tard', () => {
    const yeast = chosen(liquid);
    const options = { targetPitchAt: '2026-09-30T12:00:00Z', volumeL: 1, equipment: 'Agitateur', inoculum: '1 pack documenté', now };
    const plan = createYeastPreparation(yeast, options); expect(plan.startAt).toBe('2026-09-29T00:00:00.000Z');
    yeast.pitching!.preparation = plan; expect(readYeastPitchingPlan(yeast.pitching)).toEqual(yeast.pitching);
    expect(() => createYeastPreparation(chosen(), options)).toThrow(/méthode/);
    expect(() => createYeastPreparation(yeast, { ...options, targetPitchAt: '2026-09-28T12:00:00Z' })).toThrow(/Échéance/);
  });
  it('retire le démarrage sous le minimum publié tout en gardant la fenêtre partielle comme repère', () => {
    const yeast = chosen(liquid);
    const targetPitchAt = '2026-09-30T12:00:00.000Z';
    const plan = createYeastPreparation(yeast, { targetPitchAt, volumeL: 1, equipment: 'Agitateur', inoculum: '1 pack documenté', now });
    yeast.pitching!.preparation = plan;
    const pitchAt = Date.parse(targetPitchAt);
    expect(yeastPreparationState(yeast, undefined, pitchAt - 30 * 3600000)).toBe('due');
    expect(yeastPreparationState(yeast, undefined, pitchAt - 24 * 3600000)).toBe('due');
    expect(yeastPreparationState(yeast, undefined, pitchAt - 23 * 3600000)).toBe('too-late');
  });
  it('garde une marge de début choisie et une checklist sans horaires inventés, en refusant des qualifications inconnues', () => {
    const yeast = chosen(liquid);
    const plan = createYeastPreparation(yeast, { targetPitchAt: '2026-09-30T12:00:00Z', startAt: '2026-09-28T18:00:00Z',
      volumeL: 1, equipment: 'Agitateur QA', inoculum: '1 pack documenté QA', now });
    expect(plan.startBasis).toBe('manual');
    expect(plan.startAt).toBe('2026-09-28T18:00:00.000Z');
    expect(plan.steps.slice(0, -1).every(step => step.dueAt === undefined)).toBe(true);
    expect(plan.steps.at(-1)?.dueAt).toBe(plan.targetPitchAt);
    yeast.pitching!.preparation = plan;
    expect(readYeastPitchingPlan(yeast.pitching)).toEqual(yeast.pitching);
    const badStart = structuredClone(yeast.pitching) as any; badStart.preparation.startBasis = 'guess';
    expect(readYeastPitchingPlan(badStart)).toBeUndefined();
    const badWindow = structuredClone(yeast.pitching) as any; badWindow.preparation.protocol.leadHoursMeaning = 'guess';
    expect(readYeastPitchingPlan(badWindow)).toBeUndefined();
    const badRate = { ...yeast.pitching, rate: { value: .75, unit: 'g/hL', source, conditions: 'Mauvaise dimension QA' } };
    expect(readYeastPitchingPlan(badRate)).toBeUndefined();
  });
  it('transporte le plan dans le texte et le snapshot, sans réécriture du brassin lancé', () => {
    const r = yeastFlowRecipe(); r.yeast = chosen();
    const snap = captureSnapshot(r); const text = writeRecipeText(r); const copy = readRecipeText(text);
    expect(copy!.yeast!.pitching).toEqual(r.yeast.pitching);
    r.yeast.pitching!.wort!.volumeL = 99; expect(snap.yeast.pitching!.wort!.volumeL).toBe(40);
  });
  it('valide la collection canonique lors backup et protège les préparations commencées', () => {
    const doc = { id: dry.id, version: 1, revision: 0, product: dry, offers: [offer('shop', 'CH')] };
    const input = { schemaVersion: 3, source: 'device', exportedAt: source.checkedAt, collections: { yeastProducts: [{ id: dry.id, data: doc }] } };
    expect(parseBackup(JSON.stringify(input)).collections.yeastProducts![0].data).toEqual(doc);
    const bad = structuredClone(input); bad.collections.yeastProducts[0].data.offers[0].productId = 'foreign';
    expect(() => parseBackup(JSON.stringify(bad))).toThrow();
  });
});
