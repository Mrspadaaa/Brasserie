// #132 : choisir une autre levure ne doit plus effacer la dose. Elle se recalcule depuis yeastPitching.ts pour la nouvelle
// levure et le volume de la recette (L13 : ce test échoue sur HEAD, où le choix faisait `delete next.yeast.qty` sans rien recalculer).
import { describe, expect, it } from 'vitest';
import { readYeastSupply } from '../../../functions/src/yeastSupplySchema';
import bootstrap from '../../../src/data/yeastSupplyBootstrap.json';
import { applyCatalogueYeast } from '../../../src/domain/yeastCatalogue';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import { evaluateYeastPitching } from '../../../src/domain/yeastPitching';
import { recetteApercuAncienne, recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
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

  // Défaut trouvé en ligne (09.11), recette « ZZ TEST — Recette » : Ma levure disait « dose à saisir » au lieu de la plage de sachets.
  describe('ancienne recette : sans forme, qty 0 enregistrée, sans pitching, moût non estimable par les fermentables', () => {
    const ancienne = () => recetteApercuAncienne() as unknown as TrialRecipe;
    it('le produit unique de la référence est retenu même sans forme ; le moût vient du volume et de la DI de la recette (celles du bandeau)', () => {
      const { yeast, conseil } = doseDeLaLevure(ancienne(), supply);
      expect(yeast.form).toBe('sèche');
      expect(yeast.pitching?.product?.referenceId).toBe('fermentis-us05');
      expect(yeast.pitching?.wort).toMatchObject({ volumeL: 24, sg: 1.085, basis: 'recipe-estimate' });
      expect(conseil.range!.min).toBeCloseTo(12, 5);                                  // 50–80 g/hL × 24 L
      expect(conseil.range!.max).toBeCloseTo(19.2, 5);
      expect(conseil.packs).toEqual({ min: 2, max: 2 });                              // sachets de 11,5 g
    });
    it('la DI du moteur (celle du bandeau) prime sur le champ de la recette quand l’appelant la donne', () => {
      const { yeast } = doseDeLaLevure(ancienne(), supply, 1.072);
      expect(yeast.pitching?.wort?.sg).toBe(1.072);
    });
    it('sans DI ni fermentables calculables, la dose reste inconnue (jamais 0, jamais inventée)', () => {
      const sans = { ...ancienne(), ogTarget: undefined } as TrialRecipe;
      expect(doseDeLaLevure(sans, supply).conseil.packs).toBeUndefined();
    });
  });
});
