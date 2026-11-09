import { describe, expect, it } from 'vitest';
import type { Recipe, StockItem } from '../../src/types';
import { platoFromSg } from '../../src/domain/alcohol';
import { BrewingMath } from '../../src/services/brewingMath';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings, type BrewBudgetSnapshot, type BrewPrice } from '../../src/domain/finance/brewBudget';
import { beerTaxPerFormat } from '../../src/domain/finance/swissBeerTax';
import type { FinancialAsset } from '../../src/domain/finance/types';
import { coutFormat, coutLitre, litresNets, troisNotions, usureLineaireAnnee, type TroisNotions } from '../../src/domain/finance/chaineLitre';

// Fixture (brief passe 3), 27 L nets : déjà payé 22,41 + à payer 64,26 (ingrédients 22,42, énergie 8,00, nettoyage 3,00, emballage 24,00,
// impôt 6,84) + année 116,10 (charges fixes 108,00, usure 8,10) = 202,77 ; 202,77 ÷ 27 = 7,51. Entrées construites à la main, dates fixes.
const notions: TroisNotions = { dejaPaye: 22.41, aPayer: 64.26, annee: 116.1, total: 202.77, emballage: 24, impot: 6.84, complet: true, manque: [] };
const stock = (patch: Partial<StockItem>): StockItem => ({ id: patch.ref!, ref: 'MP-1', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 0, minStock: 0, reorder: false, ...patch });
const price = (patch: Partial<BrewPrice> = {}): BrewPrice => ({ amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, date: '09.09.2026', source: 'manual', ...patch });
const settings: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
const recipe = { id: 'R1', name: 'Pale Ale', volumeL: 30, style: 'Pale Ale', hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' },
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }] } as unknown as Recipe;
const snapshot = (prices: Record<string, BrewPrice>): BrewBudgetSnapshot => estimateBrewBudget({ recipe, brewDate: '15.09.2026', batches: [], netVolumeL: 27, og: '1.048', settings, prices,
  stockItems: [stock({ ref: 'MP-1', name: 'Pilsner', currentStock: 6 }), stock({ ref: 'MP-2', name: 'Pale' })], now: '2026-09-09T12:00:00Z' });
const allPrices = { [demandKey('Pilsner', 'kg')]: price(), [demandKey('Pale', 'kg')]: price() };
const asset = (patch: Partial<FinancialAsset> = {}): FinancialAsset => ({ id: 'A1', name: 'Frigo', acquisitionDate: '2026-03-01', inServiceDate: '2026-03-01', acquisitionCents: 300000, businessUsePct: 100,
  category: 'production', method: 'declining', ratePct: 30, openingYear: 2026, openingValueCents: 300000, openingConfirmed: true, firstYearFraction: 1, ...patch } as FinancialAsset);

describe('litres nets : une seule source', () => {
  it('prend le conditionné réel, puis le net enregistré, puis le net attendu', () => {
    expect(litresNets({ conditionneL: 26.6, netEnregistreL: 27, netAttenduL: 28 })).toEqual({ litres: 26.6, source: 'conditionne' });
    expect(litresNets({ netEnregistreL: 27, netAttenduL: 28 })).toEqual({ litres: 27, source: 'enregistre' });
    expect(litresNets({ netAttenduL: 28 })).toEqual({ litres: 28, source: 'attendu' });
  });
  it('ignore 0, NaN et le négatif ; rien de valide donne null', () => {
    expect(litresNets({ conditionneL: 0, netEnregistreL: Number.NaN, netAttenduL: -3 })).toBeNull();
    expect(litresNets({})).toBeNull();
    expect(litresNets({ conditionneL: 0, netEnregistreL: 27 })?.source).toBe('enregistre');
  });
});

describe('coût du litre : complet et liquide', () => {
  it('202,77 ÷ 27 = 7,51 ; les trois notions somment au total au centime', () => {
    const c = coutLitre({ notions, litres: 27 })!;
    expect(c.affiche.complet).toBe(7.51);
    expect(Math.round(notions.dejaPaye * 100) + Math.round(notions.aPayer * 100) + Math.round(notions.annee * 100)).toBe(Math.round(notions.total * 100));
  });
  it('le litre liquide ôte emballage et impôt : (202,77 − 24,00 − 6,84) ÷ 27, rendu exact et arrondi à part', () => {
    const c = coutLitre({ notions, litres: 27 })!;
    expect(c.liquide).toBeCloseTo(171.93 / 27, 9);
    expect(c.affiche.liquide).toBe(6.37);
    expect(c.liquide).not.toBe(6.37);
  });
  it('un morceau inconnu ou des litres invalides donnent null, jamais 0', () => {
    expect(coutLitre({ notions: { ...notions, complet: false, manque: ['Pale'] }, litres: 27 })).toBeNull();
    expect(coutLitre({ notions: { ...notions, emballage: null }, litres: 27 })!.liquide).toBeNull();
    expect(coutLitre({ notions, litres: 0 })).toBeNull();
    expect(coutLitre({ notions: null, litres: 27 })).toBeNull();
  });
});

describe('coût d’un format', () => {
  const litreLiquide = 171.93 / 27;
  const impot33 = beerTaxPerFormat({ plato: 12, volumeL: 0.33 })!;
  it('33 cl, brassin tout en 33 cl : retombe sur 7,51 × 0,33 = 2,48', () => {
    const f = coutFormat({ litreLiquide, format: { id: 'b33', label: '33 cl', volumeL: 0.33 }, emballageUnite: 24 / (27 / 0.33), impotUnite: impot33 })!;
    expect(Math.round(f.total * 100) / 100).toBe(2.48);
    expect(Math.round(7.51 * 0.33 * 100) / 100).toBe(2.48);
  });
  it('fût 20 L : le litre exact est gardé (127,356 de liquide), pas le 6,37 arrondi', () => {
    const f = coutFormat({ litreLiquide, format: { id: 'k20', label: 'Fût 20 L', volumeL: 20 }, emballageUnite: 0, impotUnite: 5.064 })!;
    expect(f.liquide).toBeCloseTo(127.356, 3);
  });
  it('75 cl : emballage et impôt de l’unité s’ajoutent', () => {
    const f = coutFormat({ litreLiquide, format: { id: 'b75', label: '75 cl', volumeL: 0.75 }, emballageUnite: 0.5, impotUnite: beerTaxPerFormat({ plato: 12, volumeL: 0.75 })! })!;
    expect(f.total).toBeCloseTo(litreLiquide * 0.75 + 0.5 + 0.18990, 4);
  });
  it('un emballage inconnu laisse le total à null et le morceau à null', () => {
    const f = coutFormat({ litreLiquide, format: { id: 'k20', label: 'Fût 20 L', volumeL: 20 }, emballageUnite: null, impotUnite: 5.064 })!;
    expect(f.total).toBeNull();
    expect(f.emballage).toBeNull();
    expect(coutFormat({ litreLiquide: null, format: { id: 'b33', label: '33 cl', volumeL: 0.33 }, emballageUnite: 0.3, impotUnite: 0.08 })).toBeNull();
  });
});

describe('trois notions lues sur un instantané', () => {
  it('l’instantané de la fixture rend 22,41 / 64,26 / 116,10 et 7,51 CHF/L', () => {
    const n = troisNotions(snapshot(allPrices))!;
    expect([n.dejaPaye, n.aPayer, n.annee, n.total, n.emballage, n.impot, n.complet]).toEqual([22.41, 64.26, 116.1, 202.77, 24, 6.84, true]);
    expect(coutLitre({ notions: n, litres: 27 })!.affiche.complet).toBe(7.51);
  });
  it('un prix inconnu : valeurs connues, complet faux, coût du litre null', () => {
    const n = troisNotions(snapshot({ [demandKey('Pilsner', 'kg')]: price() }))!;
    expect(n.complet).toBe(false);
    expect(n.manque).toContain('Pale');
    expect(n.dejaPaye).toBe(22.41);
    expect(coutLitre({ notions: n, litres: 27 })).toBeNull();
  });
  it('des litres nets pris sur le volume à brasser rendent le coût du litre inconnu : 7,21 flatteur, jamais affiché', () => {
    const estime = estimateBrewBudget({ recipe, brewDate: '15.09.2026', batches: [], og: '1.048', settings, prices: allPrices, now: '2026-09-09T12:00:00Z',
      stockItems: [stock({ ref: 'MP-1', name: 'Pilsner', currentStock: 6 }), stock({ ref: 'MP-2', name: 'Pale' })] });
    const n = troisNotions(estime)!;
    expect([estime.netVolumeSource, n.complet, n.manque]).toEqual(['volume-a-brasser', false, ['litres nets']]);
    expect(coutLitre({ notions: n, litres: 30 })).toBeNull();
  });
  it('un instantané enregistré avant ces champs rend null, pas 0', () => {
    const { dejaPaye, aPayer, annee, ...ancien } = snapshot(allPrices);
    expect(troisNotions(ancien as BrewBudgetSnapshot)).toBeNull();
  });
});

describe('°Plato : une formule', () => {
  it('platoFromSg et BrewingMath.sgToPlato donnent les mêmes valeurs de 1,030 à 1,100', () => {
    for (let sg = 1.03; sg <= 1.1001; sg += 0.005) expect(Math.round(platoFromSg(sg) * 10) / 10).toBe(BrewingMath.sgToPlato(sg));
    expect(platoFromSg(1.048)).toBeCloseTo(11.912, 2);
  });
});

describe('usure du litre : linéaire, comptée une seule fois', () => {
  it('un frigo de 3 000 CHF « machines de production » (15 % linéaire) use 450 CHF/an, pas les 900 du dégressif', () => {
    const r = usureLineaireAnnee([asset()], 2026);
    expect(r.amountCHF).toBe(450);
    expect(r.warnings).toEqual([]);
  });
  it('la première année suit la fraction de mise en service, l’actif cédé ne use plus', () => {
    expect(usureLineaireAnnee([asset({ firstYearFraction: 0.5 })], 2026).amountCHF).toBe(225);
    expect(usureLineaireAnnee([asset({ disposedDate: '2027-02-01' })], 2028).amountCHF).toBe(0);
    expect(usureLineaireAnnee([asset()], 2025).amountCHF).toBe(0);
  });
  it('s’arrête quand le coût est entièrement usé (10 % sur 10 ans)', () => {
    const vieux = asset({ category: 'tanks', acquisitionDate: '2010-01-01', inServiceDate: '2010-01-01', openingYear: 2010 });
    expect(usureLineaireAnnee([vieux], 2019).amountCHF).toBe(300);
    expect(usureLineaireAnnee([vieux], 2020).amountCHF).toBe(0);
  });
  it('aucun actif, ou une catégorie à confirmer : inconnu (undefined), jamais 0', () => {
    expect(usureLineaireAnnee([], 2026).amountCHF).toBeUndefined();
    const r = usureLineaireAnnee([asset({ category: 'custom', ratePct: 0 })], 2026);
    expect(r.amountCHF).toBeUndefined();
    expect(r.warnings[0]).toMatch(/Frigo/);
  });
  it('le coût du litre prend cette usure une fois : l’actif enregistré, sans ajout d’un projet', () => {
    const usure = usureLineaireAnnee([asset()], 2026).amountCHF!;
    const avec = estimateBrewBudget({ recipe, brewDate: '15.09.2026', batches: [], netVolumeL: 27, og: '1.048', prices: allPrices, now: '2026-09-09T12:00:00Z',
      stockItems: [stock({ ref: 'MP-1', name: 'Pilsner', currentStock: 6 }), stock({ ref: 'MP-2', name: 'Pale' })], settings: { ...settings, annualDepreciationCHF: usure } });
    expect(avec.depreciationAllocation).toBe(10.13); // 450 ÷ 1 200 × 27 : une fois
    expect(avec.annee).toBe(118.13);
  });
});
