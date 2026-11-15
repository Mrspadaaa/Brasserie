import { describe, expect, it } from 'vitest';
import type { Recipe, StockItem } from '../../src/types';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings, type BrewPrice } from '../../src/domain/finance/brewBudget';
import { coutLitre, troisNotions } from '../../src/domain/finance/chaineLitre';
import { fluxDuBrassin, fr, frL, groupeIngredient, litreTroisTemps } from '../../src/ui/finance/CoutBrassinFlux';

const stock = (patch: Partial<StockItem>): StockItem => ({ id: patch.ref!, ref: 'MP-1', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 0, minStock: 0, reorder: false, ...patch });
const price = (patch: Partial<BrewPrice> = {}): BrewPrice => ({ amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, date: '09.09.2026', source: 'manual', ...patch });
const settings: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
const recipe = (patch: Partial<Recipe> = {}) => ({ id: 'R1', name: 'Pale Ale', volumeL: 30, style: 'Pale Ale', hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' },
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }], ...patch }) as unknown as Recipe;
const run = (r: Recipe = recipe(), extra = {}) => estimateBrewBudget({ recipe: r, brewDate: '15.09.2026', batches: [], netVolumeL: 27, og: '1.048', settings,
  prices: { [demandKey('Pilsner', 'kg')]: price(), [demandKey('Pale', 'kg')]: price(), [demandKey('Cascade', 'g')]: price({ amount: 0.05, unit: 'g' }) },
  stockItems: [stock({ ref: 'MP-1', name: 'Pilsner', currentStock: 6 }), stock({ ref: 'MP-2', name: 'Pale' })], now: '2026-09-09T12:00:00Z', ...extra });

describe('format de la maquette', () => {
  it('espace pour les milliers, virgule décimale, moins typographique', () => {
    expect(fr(7.51)).toBe('7,51'); expect(fr(1234.5)).toBe('1 234,50'); expect(fr(-3)).toBe('−3,00'); expect(fr(0)).toBe('0,00');
    expect(frL(27)).toBe('27'); expect(frL(26.6)).toBe('26,6'); expect(frL(100)).toBe('100'); expect(frL(0.5)).toBe('0,5');
  });
});

describe('groupes d’ingrédients', () => {
  const rs = run(recipe({ hops: [{ name: 'Cascade', weightG: 50, time: 60, use: 'ébullition' }] as never, yeast: { name: 'US-05', qty: 1, unit: 'sachet', form: 'dry' } as never })).recipeSnapshot;
  it('malt, houblon et levure ensemble, le reste en « autres »', () => {
    expect(groupeIngredient({ name: 'Pilsner', kind: 'ingredient' }, rs)).toBe('malt');
    expect(groupeIngredient({ name: ' cascade ', kind: 'ingredient' }, rs)).toBe('q');
    expect(groupeIngredient({ name: 'US-05', kind: 'ingredient' }, rs)).toBe('q');
    expect(groupeIngredient({ name: 'Vanille', kind: 'ingredient' }, rs)).toBe('autres');
    expect(groupeIngredient({ name: 'Eau du réseau', kind: 'water' }, rs)).toBe('autres');
    expect(groupeIngredient({ name: 'Gypse', kind: 'treatment' }, rs)).toBe('autres');
  });
});

describe('flux du brassin : la fixture de c3a', () => {
  const s = run();
  const f = fluxDuBrassin(s);
  it('trois sources : 22,41 · 64,26 · 116,10', () => { expect(f.sources).toEqual({ stock: 22.41, now: 64.26, an: 116.1 }); });
  it('destinations de la maquette, dans son ordre, avec leurs montants', () => {
    expect(f.destinations.map(d => [d.id, d.montant])).toEqual([['malt', 44.83], ['ener', 8], ['net', 3], ['emb', 24], ['imp', 6.84], ['q', null], ['mat', 8.1], ['fix', 108]]);
  });
  it('houblon et levure absents : « ? » hors recette, jamais 0', () => {
    const q = f.destinations.find(d => d.id === 'q')!;
    expect(q.montant).toBeNull(); expect(q.horsRecette).toBe(true);
    expect(f.flux.some(x => x.dest === 'q')).toBe(false);
  });
  it('la somme des flux = le coût total, au centime', () => {
    const cents = Math.round(f.flux.reduce((n, x) => n + Math.round(x.montant * 100), 0));
    expect(Math.abs(cents - Math.round(s.totalCost * 100))).toBeLessThanOrEqual(1);
    expect(Math.round(f.flux.filter(x => x.source === 'stock').reduce((n, x) => n + x.montant, 0) * 100)).toBe(2241);
    expect(Math.round(f.flux.filter(x => x.source === 'an').reduce((n, x) => n + x.montant, 0) * 100)).toBe(11610);
  });
  it('estimé : énergie, nettoyage, emballage, impôt par défaut ; l’impôt d’une OG mesurée est plein', () => {
    const e = (id: string, o = f) => o.destinations.find(d => d.id === id)!.estime;
    expect([e('ener'), e('net'), e('emb'), e('imp'), e('mat'), e('fix')]).toEqual([true, true, true, true, false, false]);
    expect(e('imp', fluxDuBrassin(s, { imp: false }))).toBe(false);
  });
});

describe('cas limites du flux', () => {
  it('un prix manquant rend le nœud « ? » et sort ses flux, sans 0', () => {
    const s = run(recipe(), { prices: {} });
    const f = fluxDuBrassin(s);
    expect(f.destinations.find(d => d.id === 'malt')!.montant).toBeNull();
    expect(f.flux.some(x => x.dest === 'malt')).toBe(false);
  });
  it('houblon avec prix : un nœud plein, groupé avec la levure', () => {
    const s = run(recipe({ hops: [{ name: 'Cascade', weightG: 50, time: 60, use: 'ébullition' }] as never }));
    const q = fluxDuBrassin(s).destinations.find(d => d.id === 'q')!;
    expect(q.horsRecette).toBeUndefined(); expect(q.montant).toBe(2.5);
  });
  it('houblon sans prix : « ? » mais pas « hors recette »', () => {
    const s = run(recipe({ hops: [{ name: 'Cascade', weightG: 50, time: 60, use: 'ébullition' }] as never }), { prices: { [demandKey('Pilsner', 'kg')]: price(), [demandKey('Pale', 'kg')]: price() } });
    const q = fluxDuBrassin(s).destinations.find(d => d.id === 'q')!;
    expect(q.montant).toBeNull(); expect(q.horsRecette).toBeUndefined();
  });
  it('poste désactivé : pas de nœud ; production annuelle inconnue : charges « ? »', () => {
    const off = run(recipe(), { settings: { ...settings, costs: { ...settings.costs, energy: { enabled: false } } } });
    expect(fluxDuBrassin(off).destinations.some(d => d.id === 'ener')).toBe(false);
    const sansVolume = run(recipe(), { settings: { ...settings, annualVolumeL: undefined } });
    expect(fluxDuBrassin(sansVolume).destinations.find(d => d.id === 'fix')!.montant).toBeNull();
    const sansUsure = run(recipe(), { settings: { ...settings, annualDepreciationCHF: undefined } });
    expect(fluxDuBrassin(sansUsure).destinations.find(d => d.id === 'mat')!.montant).toBeNull();
    const usureOff = run(recipe(), { settings: { ...settings, includeDepreciation: false } });
    expect(fluxDuBrassin(usureOff).destinations.some(d => d.id === 'mat')).toBe(false);
  });
  it('un frais inconnu : « ? »', () => {
    const s = run(recipe(), { settings: { ...settings, costs: { ...settings.costs, packaging: { enabled: true } } } });
    expect(fluxDuBrassin(s).destinations.find(d => d.id === 'emb')!.montant).toBeNull();
  });
});

describe('le litre en trois temps', () => {
  const s = run();
  const n = troisNotions(s)!;
  it('0,83 · 2,38 · 4,30 = 7,51', () => {
    const c = coutLitre({ notions: n, litres: 27 })!;
    const p = litreTroisTemps(n, 27, c.affiche.complet);
    expect(p).toEqual([0.83, 2.38, 4.3]);
    expect(Math.round(p.reduce((a, b) => a + b, 0) * 100)).toBe(751);
  });
  it('trois parts à 0,5 centime : le total affiché est tenu, égalité départagée payé, à payer, année', () => {
    expect(litreTroisTemps({ dejaPaye: 1.005, aPayer: 2.495, annee: 4.01 }, 1, 7.51)).toEqual([1.01, 2.49, 4.01]);
    expect(litreTroisTemps({ dejaPaye: 4.01, aPayer: 2.495, annee: 1.005 }, 1, 7.51)).toEqual([4.01, 2.5, 1.0]);
  });
  it('quelle que soit la répartition, la somme des parts = le litre affiché', () => {
    for (const [a, b, c, l] of [[10, 20, 30, 7], [1, 1, 1, 3], [0.01, 0.02, 100, 13], [33.33, 33.33, 33.34, 9]]) {
      const total = a + b + c, complet = Math.round(total / l * 100) / 100;
      const p = litreTroisTemps({ dejaPaye: a, aPayer: b, annee: c }, l, complet);
      expect(Math.round(p.reduce((x, y) => x + y, 0) * 100)).toBe(Math.round(complet * 100));
    }
  });
});
