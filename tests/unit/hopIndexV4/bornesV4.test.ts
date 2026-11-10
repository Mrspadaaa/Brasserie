// Critique du 08.11 (build 0c3f4d41), constat bloquant : 99 999 g de Lotus dans 24 L donnaient « IBU 49067 » à l'étape Houblons, alors que
// l'étape Fermentescibles refuse déjà 40 g/L. Le chemin v4 ne lisait pas la table unique des bornes (src/domain/bornesMetier.ts).
// Ici : le chemin v4 lit LA MÊME table (houblon par litre, α au-delà de 30 % non confirmé, OG hors bornes) ; l'ajout concerné devient
// incalculable (il entre dans `inconnus`, avec sa raison), le total affiche « — » avec la raison, jamais un nombre absurde, jamais 0.
// RJ-4 : 9 000 kg de grain donnaient « IBU 0 » (OG de 105 acceptée comme finie). Aucune donnée réelle : fixtures.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Recipe } from '../../../src/types';
import { BORNES } from '../../../src/domain/bornesMetier';
import { chargerCataloguePlein } from '../../../src/domain/hopIndex/v4/data';
import { libelleIbu, raisonIbuIncalculable, toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { kettleHopGrammesBornes, ogAffichable } from '../../../src/domain/hopIndex/v4/bornesV4';
import { BrewingMath } from '../../../src/services/brewingMath';
import { configurerDonnees, lireBiere } from '../../../src/ui/hopIndex/parcours/adaptateur';

type Etape = Record<string, unknown>;
const VOLUME = 24;
const MALTS = [{ name: 'Pilsner', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 }];
const recette = (houblons: Etape[]): Recipe => ({
  id: 'REC-BORNES', name: 'Double IPA de banc', style: 'Double IPA', styleRef: { styleId: 'double-ipa' }, volumeL: VOLUME, boilMin: 60,
  ogTarget: 1.081, totalGristKg: 6.6, fermentables: MALTS, hops: houblons, yeast: { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' },
}) as unknown as Recipe;
const lotus = (e: Etape = {}): Etape => ({ name: 'Lotus', alpha: 15, weightG: 84, hopVarietyId: 'beermaverick-lotus', stage: 'boil', timeMin: 60, ...e });
function lire(houblons: Etape[], boilOg: number | null = 1.081) {
  const b = lireBiere(toHopRecipe(recette(houblons), { boilOg }).recette);
  return { b, l: libelleIbu(b) };
}

beforeAll(async () => {
  await chargerCataloguePlein();
  configurerDonnees({});
});

describe('houblon par litre : la borne de Fermentescibles (BORNES.houblonGParL)', () => {
  it('99 999 g de Lotus dans 24 L : l’ajout est incalculable, avec sa raison ; le total est « — », jamais 49 067', () => {
    const { b, l } = lire([lotus({ weightG: 99999 })]);
    expect(b.ibu.inconnus).toEqual(['a1']);
    expect(b.ibuParAjout.a1.ibu).toBeNull();
    expect(b.ibuParAjout.a1.raison).toMatch(/40 g\/L/);
    expect(l.texte).toBeNull();
    expect(l.titre).toMatch(/40 g\/L/);
    expect(raisonIbuIncalculable(b)).toMatch(/40 g\/L/);
  });

  it('la borne est lue dans la table : à la limite exacte l’IBU se calcule, un gramme de plus et il attend', () => {
    const limite = BORNES.houblonGParL.max * VOLUME;
    const dedans = lire([lotus({ weightG: limite })]);
    expect(dedans.b.ibu.inconnus).toEqual([]);
    expect(dedans.l.texte).not.toBeNull();
    const dehors = lire([lotus({ weightG: limite + 1 })]);
    expect(dehors.b.ibu.inconnus).toEqual(['a1']);
    expect(dehors.l.texte).toBeNull();
  });

  it('la borne vaut pour toute la recette, dry hop compris : tous les ajouts à chaud attendent (comme hotBitterness)', () => {
    const { b, l } = lire([lotus({ weightG: 20 }), { name: 'Citra', alpha: 12, weightG: 1000, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 72 }]);
    expect(b.ibu.inconnus).toEqual(['a1']);
    expect(l.texte).toBeNull();
  });
});

describe('α au-delà de 30 % : à confirmer (BORNES.alphaPct)', () => {
  it('« 80 » tapé pour 8,0 : l’ajout est incalculable avec sa raison ; confirmé, il se calcule', () => {
    const non = lire([lotus({ alpha: 80 })]);
    expect(non.b.ibu.inconnus).toEqual(['a1']);
    expect(non.b.ibuParAjout.a1.raison).toMatch(/à confirmer/);
    expect(non.l.texte).toBeNull();
    const oui = lire([lotus({ alpha: 80, alphaConfirme: 80 })]);
    expect(oui.b.ibu.inconnus).toEqual([]);
    expect(oui.l.texte).not.toBeNull();
  });
  it('un α de 30 % exactement est dans la borne', () => {
    expect(lire([lotus({ alpha: BORNES.alphaPct.max })]).b.ibu.inconnus).toEqual([]);
  });
});

describe('OG hors bornes (BORNES.og) : jamais un IBU, jamais 0', () => {
  it('DI de 1,5 : les ajouts à chaud sont incalculables et le total est « — » avec la raison', () => {
    const { b, l } = lire([lotus()], 1.5);
    expect(b.ibu.inconnus).toEqual(['a1']);
    expect(b.ibuParAjout.a1.ibu).toBeNull();
    expect(l.texte).toBeNull();
    expect(l.titre).toMatch(/1,130/);
  });
  it('RJ-4 : 9 000 kg de grain (DI de 105) : « — » et non « IBU 0 », même sans ajout inconnu', () => {
    const mesures = { og: 105.224, ibu: { valeur: 0, min: 0, max: 0, inconnus: [] as string[] } };
    expect(raisonIbuIncalculable(mesures)).toMatch(/1,130/);
    expect(libelleIbu(mesures).texte).toBeNull();
    const { l } = lire([lotus({ weightG: 30 })], 105.224);
    expect(l.texte).toBeNull();
  });
  it('à la borne (1,130) l’IBU se calcule', () => {
    expect(lire([lotus()], BORNES.og.max).l.texte).not.toBeNull();
  });
});

describe('repères : une OG hors bornes ne se montre pas (RJ-4, repères de l’étape Fermentescibles)', () => {
  it('ogAffichable : null hors bornes, inconnue ou ≤ 1 ; sinon la valeur', () => {
    expect(ogAffichable(105.224)).toBeNull();
    expect(ogAffichable(1.29)).toBeNull();
    expect(ogAffichable(1.131)).toBeNull();
    expect(ogAffichable(0)).toBeNull();
    expect(ogAffichable(Number.NaN)).toBeNull();
    expect(ogAffichable(null)).toBeNull();
    expect(ogAffichable(1.08)).toBe(1.08);
    expect(ogAffichable(BORNES.og.max)).toBe(BORNES.og.max);
  });
});

describe('plan d’eau : un houblon absurde n’ajoute pas d’eau', () => {
  const hops = [{ stage: 'boil', weightG: 99999 }, { stage: 'dryHop', weightG: 50 }];
  it('99 999 g dans 24 L : la perte des houblons n’entre pas dans le plan (sinon 634 L pour 24 L)', () => {
    const g = kettleHopGrammesBornes(hops, VOLUME);
    const plan = BrewingMath.waterVolumes(6.6, VOLUME, undefined, 'batch', 60, g);
    expect(plan.hopLossL).toBeLessThan(1);
    expect(plan.mashWaterL + plan.spargeWaterL).toBeLessThan(60);
  });
  it('dans la borne : les houblons restés dans la cuve comptent comme avant, le dry hop jamais', () => {
    expect(kettleHopGrammesBornes([{ stage: 'boil', weightG: 100 }, { stage: 'dryHop', weightG: 50 }], VOLUME)).toBe(100);
  });
});
