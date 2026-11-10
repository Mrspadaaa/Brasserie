import { describe, expect, it } from 'vitest';
import { amertumeRecette, fgRecette, formatDensite, formatLitres, ibuListe, ogRecette } from '../../src/domain/recipeMetrics';
import { recipeEntries } from '../../src/domain/productionCatalog';
import type { Recipe } from '../../src/types';

/**
 * Test en ligne du 07.11, n° 1 à 3 : une recette, un chiffre. Fixture : un stout dont les cibles retenues (OG 1,085, FG 1,024,
 * IBU annoncé 65) ne sont plus celles que le calcul donne sur ses ingrédients (le cas vu en ligne).
 */
const stout = (patch: Partial<Recipe> = {}): Recipe => ({
  id: 'R-STOUT', name: 'Stout fixture', style: 'Imperial stout', volumeL: 24, brewDate: '01.11.2026', boilMin: 60,
  fermentables: [
    { name: 'Maris Otter', weightKg: 8.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 },
    { name: 'Orge torréfiée', weightKg: 0.9, kind: 'grain', use: 'empatage', potentialPpg: 25, colorEbc: 1000 },
  ],
  hops: [{ name: 'Nugget', weightG: 60, stage: 'boil', timeMin: 60, alpha: 13 }],
  yeast: { name: 'US-05', form: 'sèche', qty: 2, unit: 'sachet' },
  ogTarget: 1.085, fgTarget: 1.024, ibuTarget: 65, efficiencyPct: 75,
  ...patch,
} as Recipe);

describe('OG, FG : la cible retenue d\'abord, le calcul sinon, partout pareil', () => {
  it('la cible retenue gagne sur le calcul, l\'absence de cible laisse le calcul', () => {
    const calcule = ogRecette(stout({ ogTarget: undefined }), 75)!;
    expect(calcule).toBeGreaterThan(1.08);
    expect(ogRecette(stout(), 75)).toBe(1.085);
    expect(ogRecette(stout({ ogTarget: 0 }), 75)).toBe(calcule);
    expect(fgRecette({ fgTarget: 1.024 }, 1.021)).toBe(1.024);
    expect(fgRecette({ fgTarget: undefined }, 1.021)).toBe(1.021);
    expect(fgRecette({ fgTarget: undefined }, null)).toBeNull();
  });

  it('une densité s\'écrit avec la virgule et trois décimales, jamais 1.085', () => {
    expect(formatDensite(1.085)).toBe('1,085');
    expect(formatDensite(1.0475)).toBe('1,048');
    expect(formatDensite(1.1)).toBe('1,100');
    expect(formatDensite(null)).toBe('');
    expect(formatDensite(0)).toBe('');
    expect(formatDensite(Number.NaN)).toBe('');
  });
});

describe('IBU : la liste montre le nombre de la fiche', () => {
  it('l\'entrée de la liste porte l\'IBU calculé, pas l\'IBU annoncé (65 avant, au HEAD d\'avant la correction)', () => {
    const recette = stout();
    const fiche = Math.round(amertumeRecette(recette, 75).total!);
    expect(fiche).not.toBe(65);
    expect(ibuListe(recette, 75)).toBe(fiche);
    expect(recipeEntries([recette], [])[0].ibu).toBe(fiche);
  });

  it('l\'IBU calculé suit l\'OG retenue, comme la fiche', () => {
    const haute = amertumeRecette(stout({ ogTarget: 1.1 }), 75).total!;
    const basse = amertumeRecette(stout({ ogTarget: 1.04 }), 75).total!;
    expect(haute).toBeLessThan(basse);
  });

  it('alpha inconnu : le calcul est impossible, la liste garde l\'annoncé ; sans annoncé, rien (jamais 0)', () => {
    const sansAlpha = { hops: [{ name: 'Nuget', weightG: 60, stage: 'boil' as const, timeMin: 60 }] };
    expect(amertumeRecette(stout(sansAlpha), 75).total).toBeNull();
    expect(ibuListe(stout(sansAlpha), 75)).toBe(65);
    expect(ibuListe(stout({ ...sansAlpha, ibuTarget: undefined }), 75)).toBeUndefined();
  });

  it('sans houblon à chaud (dry hop seul), la liste garde la valeur saisie', () => {
    const cru = { hops: [{ name: 'Citra', weightG: 100, stage: 'dryHop' as const, alpha: 12 }] };
    expect(ibuListe(stout(cru), 75)).toBe(65);
  });

  it('TE-33 : un IBU annoncé à 0 (houblon sans dose) est un inconnu, pas « 0 IBU »', () => {
    const sansDose = { ibuTarget: 0, hops: [{ name: 'Galaxy', weightG: 0, stage: 'boil' as const, timeMin: 60, alpha: 14 }] };
    expect(ibuListe(stout(sansDose), 75)).toBeUndefined();
    expect(recipeEntries([stout(sansDose)], [])[0].ibu).toBeUndefined();
  });
});

describe('Pluriels', () => {
  it('1 palier, 2 paliers, 0 ajout', async () => {
    const { nombreAccorde } = await import('../../src/domain/recipeMetrics');
    expect(nombreAccorde(1, 'palier')).toBe('1 palier');
    expect(nombreAccorde(2, 'palier')).toBe('2 paliers');
    expect(nombreAccorde(0, 'ajout')).toBe('0 ajout');
    expect(nombreAccorde(3, 'bateau', 'bateaux')).toBe('3 bateaux');
  });
});

describe('volume affiché (test en ligne n° 15, en-tête de fiche)', () => {
  it('se lit au décilitre, à la virgule, jamais « 24.012 L »', () => {
    expect(formatLitres(24.012)).toBe('24 L');
    expect(formatLitres(23.75)).toBe('23,8 L');
    expect(formatLitres(20)).toBe('20 L');
    expect(formatLitres(undefined)).toBe('— L');
  });
});
