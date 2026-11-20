// #132 : choisir une autre levure ne doit plus effacer la dose. Elle se recalcule depuis yeastPitching.ts pour la nouvelle
// levure et le volume de la recette (L13 : ce test échoue sur HEAD, où le choix faisait `delete next.yeast.qty` sans rien recalculer).
import { describe, expect, it } from 'vitest';
import { readYeastSupply } from '../../../functions/src/yeastSupplySchema';
import bootstrap from '../../../src/data/yeastSupplyBootstrap.json';
import { applyCatalogueYeast } from '../../../src/domain/yeastCatalogue';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import { evaluateYeastPitching } from '../../../src/domain/yeastPitching';
import { recetteApercuAncienne, recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import { besoinDeLaLevure, doseApresChoix, doseDeLaLevure, sachetsAuChoix } from '../../../src/ui/etapeLevure/dose';
import { BrewingMath } from '../../../src/services/brewingMath';
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
    // B1 bis (20.11) : la dose écrite est le plus petit nombre de sachets qui couvre le besoin de la recette (0,75 M/mL/°P en ale × 30 L × °P),
    // sachet de 11 g au calage du moteur (150 milliards pour 11,5 g) ; ni le milieu de la plage, ni le 3 de l'ancienne levure.
    const besoin = 0.75 * 30 * BrewingMath.sgToPlato(suivante.yeast.pitching!.wort!.sg) / (11 * 150 / 11.5);
    expect(suivante.yeast.qty).toBe(Math.ceil(besoin));
    expect(suivante.yeast.unit).toBe('sachet');
  });

  it('une plage réduite à un nombre est posée comme dose ; zéro n’est jamais écrit pour un inconnu', () => {
    const petite = { ...recette(), volumeL: 10 };                            // 5–8 g : un seul sachet de 11,5 g
    const us05 = reference('fermentis-us05');
    const choisie = applyCatalogueYeast(petite, us05, us05.form);
    const suivante = doseApresChoix(choisie, { name: 'autre' }, supply);
    // 8 kg de Pilsner dans 10 L : moût très dense (estimé des fermentables) ; le besoin, pas la plage du fabricant, fixe la dose.
    expect(suivante.yeast.qty).toBe(sachetsAuChoix(besoinDeLaLevure(suivante, supply, undefined, us05)));
    expect(suivante.yeast.qty).toBeGreaterThan(0);
    expect(suivante.yeast.unit).toBe('sachet');
  });

  it('une levure sèche sans produit documenté : le besoin au sachet de 11,5 g (à confirmer), jamais 0 ni la valeur reprise', () => {
    const avant = recette();
    const sans = refs.find(r => !supply.products.some(p => p.referenceId === r.id) && r.form === 'sèche')!;
    const choisie = applyCatalogueYeast(avant, sans, sans.form);
    const suivante = doseApresChoix(choisie, { ...avant.yeast, qty: 9, unit: 'sachet' }, supply);
    expect(suivante.yeast.pitching?.product).toBeUndefined();
    const b = besoinDeLaLevure(suivante, supply, undefined, sans)!;
    expect(b.sachet).toMatchObject({ grammes: 11.5, poidsAConfirmer: true, estime: true });
    expect(suivante.yeast.qty).toBe(Math.ceil(b.sachets!));
    expect(suivante.yeast.qty).toBeGreaterThan(0);
    expect(suivante.yeast.qty).not.toBe(9);
  });

  // B1 bis (20.11) : « je vous même pas combien et quel levure j'ai choisi » ; sa lager (OG 1,026, 20 L) : besoin lager ≈ 1,3 sachet → 2 sachets écrits.
  it('une lager : taux 1,5 M/mL/°P, besoin entre 1 et 2 sachets, 2 sachets écrits au choix', () => {
    const lager = { ...recette(), name: 'ZZ TEST — Lager', style: 'Munich Helles', volumeL: 20, ogTarget: 1.026, fermentables: [] } as unknown as TrialRecipe;
    const sans = refs.find(r => !supply.products.some(p => p.referenceId === r.id) && r.form === 'sèche')!;
    const choisie = applyCatalogueYeast(lager, sans, sans.form);
    const suivante = doseApresChoix(choisie, lager.yeast, supply);
    const b = besoinDeLaLevure(suivante, supply, undefined, sans)!;
    expect(b.regime).toBe('lager');
    expect(b.taux).toBe(1.5);
    expect(b.sachets!).toBeCloseTo(1.5 * 20 * BrewingMath.sgToPlato(1.026) / 150, 5);
    expect(b.sachets!).toBeGreaterThan(1); expect(b.sachets!).toBeLessThan(2);                    // ≈ 1,3 (la maquette disait 1,7 : chiffre d'exemple)
    expect(suivante.yeast).toMatchObject({ qty: 2, unit: 'sachet' });
  });

  it('une levure liquide sans cellules par pack ni dose du fabricant : rien n’est écrit, des packs estimés sont proposés (jamais 0)', () => {
    const avant = recette();
    const liquide = refs.find(r => !supply.products.some(p => p.referenceId === r.id) && r.form === 'liquide' && !r.catalogue?.facts?.some(f => f.key === 'pitchRate'))!;
    const suivante = doseApresChoix(applyCatalogueYeast(avant, liquide, liquide.form), avant.yeast, supply);
    expect(suivante.yeast.qty).toBeUndefined();
    // Plainte du 20.11 : la carte propose des packs estimés (≈ 100 Md chacun), jamais écrits au choix ni à 0.
    const b = besoinDeLaLevure(suivante, supply, undefined, liquide)!;
    expect(b.sachet).toMatchObject({ unite: 'pack', estime: true });
    expect(sachetsAuChoix(b)).toBeGreaterThan(0);
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
