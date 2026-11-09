// #132 : choisir une autre levure ne doit plus effacer la dose. Elle se recalcule depuis yeastPitching.ts pour la nouvelle
// levure et le volume de la recette (L13 : ce test échoue sur HEAD, où le choix faisait `delete next.yeast.qty` sans rien recalculer).
import { describe, expect, it } from 'vitest';
import { readYeastSupply } from '../../../functions/src/yeastSupplySchema';
import bootstrap from '../../../src/data/yeastSupplyBootstrap.json';
import { applyCatalogueYeast } from '../../../src/domain/yeastCatalogue';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import { evaluateYeastPitching } from '../../../src/domain/yeastPitching';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import { doseApresChoix, doseDeLaLevure } from '../../../src/ui/etapeLevure/dose';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';

const supply = readYeastSupply(bootstrap)!;
const refs = yeastReferences([]);
const reference = (id: string) => refs.find(r => r.id === id)!;
const recette = () => recetteApercuEtapeLevure() as unknown as TrialRecipe;

describe('dose au choix de la levure (#132)', () => {
  it('US-05 à 30 L : la plage de sachets vient du produit et du volume, sans milieu', () => {
    const { conseil } = doseDeLaLevure(recette(), supply);
    expect(conseil.packs).toEqual({ min: 2, max: 3 });                       // 50–80 g/hL × 30 L = 15–24 g, sachets de 11,5 g
    expect(conseil.range!.min).toBeCloseTo(15, 5);
    expect(conseil.range!.max).toBeCloseTo(24, 5);
  });

  it('choisir Verdant : le produit et le moût de la nouvelle levure sont recalculés, la dose de l’ancienne n’est pas reprise', () => {
    const avant = recette();
    avant.yeast = { ...avant.yeast, qty: 3, unit: 'sachet' };
    const verdant = reference('lalbrew-verdant-ipa');
    const choisie = applyCatalogueYeast(avant, verdant, verdant.form);
    const suivante = doseApresChoix(choisie, avant.yeast, supply);
    expect(suivante.yeast.hopIndexId).toBe('lalbrew-verdant-ipa');
    expect(suivante.yeast.pitching?.product?.referenceId).toBe('lalbrew-verdant-ipa');
    expect(suivante.yeast.pitching?.wort?.volumeL).toBe(30);
    expect(suivante.yeast.pitching?.wort?.basis).toBe('recipe-estimate');
    const conseil = evaluateYeastPitching(suivante);
    expect(conseil.packs).toEqual({ min: 2, max: 3 });                       // 50–100 g/hL × 30 L = 15–30 g, sachets de 11 g
    // Une plage n'est jamais remplacée par son milieu : la dose reste à saisir, et n'est pas le 3 de l'ancienne levure.
    expect(suivante.yeast.qty).toBeUndefined();
    expect(suivante.yeast.unit).toBeUndefined();
  });

  it('une plage réduite à un nombre est posée comme dose ; zéro n’est jamais écrit pour un inconnu', () => {
    const petite = { ...recette(), volumeL: 10 };                            // 5–8 g : un seul sachet de 11,5 g
    const us05 = reference('fermentis-us05');
    const choisie = applyCatalogueYeast(petite, us05, us05.form);
    const suivante = doseApresChoix(choisie, { name: 'autre' }, supply);
    expect(suivante.yeast.qty).toBe(1);
    expect(suivante.yeast.unit).toBe('sachet');
  });

  it('une levure sans produit documenté : dose inconnue (ni 0, ni valeur reprise)', () => {
    const avant = recette();
    const sans = refs.find(r => !supply.products.some(p => p.referenceId === r.id) && r.form === 'sèche')!;
    const choisie = applyCatalogueYeast(avant, sans, sans.form);
    const suivante = doseApresChoix(choisie, avant.yeast, supply);
    expect(suivante.yeast.qty).toBeUndefined();
    expect(suivante.yeast.pitching?.product).toBeUndefined();
    expect(doseDeLaLevure(suivante, supply).conseil.packs).toBeUndefined();
  });
});
