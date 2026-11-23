// Voie u2 (26.10) : « Avec lotus toujours aucune modification des barres au style » (neipa v3 : 22A Double IPA, 24 L, OG 1,081,
// Verdant IPA, un seul houblon : Lotus 84 g, 15 % α, ébullition 40′). Les 12 familles restaient hachurées.
// Cause mesurée : 40′ n'est ni 60′ ni 10′, les deux seuls moments d'ébullition du simulateur ; l'ajout était « non simulé » et
// aucune famille n'était située. La densité (OG), elle, n'y est pour rien (hypothèse 1 écartée, testée ici).
// Correction D177 : entre 10′ et 60′ exclus, l'activité est INTERPOLÉE linéairement en minutes entre celles de 10′ et de 60′ ;
// le résultat le dit (`interpoles`, `FamilleLue.interpole`). Hors de cet intervalle (5′, 70′), rien n'est inventé : l'ajout reste
// non simulé, avec sa raison. Aucune donnée réelle : la recette est une fixture d'après l'export collé par le brasseur.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Recipe } from '../../../src/types';
import { chargerCataloguePlein } from '../../../src/domain/hopIndex/v4/data';
import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { poidsInterpole, simulerCas } from '../../../src/domain/hopIndex/v4/profil-simule';
import { FAMILIES } from '../../../src/domain/hopIndex/v4';
import { configurerDonnees, lireBiere } from '../../../src/ui/hopIndex/parcours/adaptateur';

const MALTS = [
  { name: 'Pilsner', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
  { name: 'Flocons d\'avoine', weightKg: 2, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 },
];
type Etape = Record<string, unknown>;
function neipa(houblons: Etape[], avecMalts = true): Recipe {
  return {
    id: 'REC-U2', name: 'neipa v3', style: 'Double IPA', styleRef: { styleId: 'double-ipa' }, volumeL: 24, boilMin: 60,
    ogTarget: avecMalts ? 1.081 : null, totalGristKg: avecMalts ? 8.6 : 0, fermentables: avecMalts ? MALTS : [],
    hops: houblons, yeast: { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' },
  } as unknown as Recipe;
}
const lotus = (etape: Etape): Etape => ({ name: 'Lotus', alpha: 15, weightG: 84, hopVarietyId: 'beermaverick-lotus', ...etape });
const ebullition = (minutes: number): Etape => ({ stage: 'boil', timeMin: minutes });
function lire(houblons: Etape[], avecMalts = true) {
  const conv = toHopRecipe(neipa(houblons, avecMalts), { boilOg: avecMalts ? 1.081 : null });
  const b = lireBiere(conv.recette);
  return { b, hachurees: FAMILIES.filter((f) => b.profil[f].valeur === null).length };
}
const centre = (b: ReturnType<typeof lire>['b'], f: (typeof FAMILIES)[number]) => b.profil[f].valeur?.centre ?? null;

beforeAll(async () => {
  await chargerCataloguePlein();
  configurerDonnees({}); // comme l'app : aucune dégustation, catalogue plein
});

describe('u2 : la cause n\'est pas la densité', () => {
  it('sans malts (OG inconnue) ou avec (1,081) : les mêmes familles situées ; seul l\'IBU est inconnu', () => {
    const avec = lire([lotus(ebullition(60))], true), sans = lire([lotus(ebullition(60))], false);
    expect(sans.hachurees).toBe(avec.hachurees);
    expect(avec.hachurees).toBeLessThan(12);
    expect(FAMILIES.map((f) => centre(sans.b, f))).toEqual(FAMILIES.map((f) => centre(avec.b, f)));
    expect(avec.b.ibu.inconnus).toEqual([]);
    expect(sans.b.ibu.inconnus).toEqual(['a1']);   // la densité n'ôte que l'IBU à chaud
  });
});

describe('D177 : Lotus 84 g à 40′ (sa recette)', () => {
  it('ne laisse plus les 12 familles hachurées : autant situées qu\'à 60′ et à 10′', () => {
    const a40 = lire([lotus(ebullition(40))]), a60 = lire([lotus(ebullition(60))]), a10 = lire([lotus(ebullition(10))]);
    expect(a60.hachurees).toBe(8);
    expect(a10.hachurees).toBe(8);
    expect(a40.hachurees).toBe(8);
    expect(a40.b.nonSimules).toEqual([]);
  });
  it('ses valeurs sont comprises entre celles de 60′ et de 10′, jamais 0', () => {
    const a40 = lire([lotus(ebullition(40))]).b, a60 = lire([lotus(ebullition(60))]).b, a10 = lire([lotus(ebullition(10))]).b;
    let situees = 0;
    for (const f of FAMILIES) {
      const v = a40.profil[f].valeur;
      if (!v) { expect(a60.profil[f].valeur).toBeNull(); expect(a10.profil[f].valeur).toBeNull(); continue; }
      situees++;
      for (const k of ['bas', 'centre', 'haut'] as const) {
        const [p, q] = [a60.profil[f].valeur![k], a10.profil[f].valeur![k]];
        expect(v[k]).toBeGreaterThanOrEqual(Math.min(p, q) - 0.011);
        expect(v[k]).toBeLessThanOrEqual(Math.max(p, q) + 0.011);
      }
      expect(v.centre).toBeGreaterThan(0);
    }
    expect(situees).toBe(4);
  });
  it('est dit interpolé : `interpoles` et `interpole` sur chaque famille placée, pas sur 60′ ni 10′', () => {
    const a40 = lire([lotus(ebullition(40))]).b;
    expect(a40.interpoles).toEqual([{ ajoutId: 'a1', minutes: 40 }]);
    for (const f of FAMILIES) expect(!!a40.profil[f].interpole).toBe(a40.profil[f].valeur !== null);
    for (const m of [60, 10]) {
      const b = lire([lotus(ebullition(m))]).b;
      expect(b.interpoles).toEqual([]);
      for (const f of FAMILIES) expect(b.profil[f].interpole).toBeUndefined();
    }
  });
  it('est continu et monotone : 55′, 40′, 25′, 11′ se rangent entre 60′ et 10′, et se rapprochent de 10′ en descendant', () => {
    const f = 'citrus' as const;
    const v = (m: number) => centre(lire([lotus(ebullition(m))]).b, f)!;
    const [v60, v10] = [v(60), v(10)];
    const suite = [55, 40, 25, 11].map(v);
    expect(Math.abs(v60 - v10)).toBeGreaterThan(0.01);                   // 60′ et 10′ diffèrent : l'interpolation a un sens
    const sens = Math.sign(v10 - v60);
    for (let i = 1; i < suite.length; i++) expect(Math.sign(suite[i] - suite[i - 1])).toBe(sens);
    expect(Math.abs(suite[0] - v60)).toBeLessThan(Math.abs(suite[3] - v60));
    expect(Math.abs(suite[3] - v10)).toBeLessThan(Math.abs(suite[0] - v10));
  });
  it('poidsInterpole : 0,5 à 35′, rien à 60′, à 10′, à 5′, à 70′ ni hors ébullition', () => {
    expect(poidsInterpole({ moment: 'b60', minutes: 35 })).toBeCloseTo(0.5);
    for (const m of [60, 10, 5, 70, null, undefined]) expect(poidsInterpole({ moment: 'b60', minutes: m })).toBeNull();
    expect(poidsInterpole({ moment: 'wp', minutes: 35 })).toBeNull();
    expect(poidsInterpole({ moment: 'b10', minutes: 35 })).toBeNull();
  });
  it('plusieurs ajouts : Citra à 60′ et Lotus à 40′ se cumulent, avec une seule ligne interpolée', () => {
    const citra: Etape = { name: 'Citra', alpha: 12, weightG: 50, hopVarietyId: 'beermaverick-citra', stage: 'boil', timeMin: 60 };
    const seul = lire([citra]).b, deux = lire([citra, lotus(ebullition(40))]).b;
    expect(deux.interpoles).toEqual([{ ajoutId: 'a2', minutes: 40 }]);
    expect(FAMILIES.some((f) => (centre(deux, f) ?? 0) > (centre(seul, f) ?? 0))).toBe(true);
  });
});

describe('D177 : ce qui reste non simulé, avec sa raison (aucun chiffre inventé)', () => {
  it('5′ et 0′ (flame-out) : hors de 10′–60′, rien n\'est extrapolé ; 12 hachurées et la raison dite', () => {
    for (const m of [5, 0]) {
      const x = lire([lotus(ebullition(m))]);
      expect(x.hachurees).toBe(12);
      expect(x.b.nonSimules[0].raison).toMatch(/10′ à 60′/);
      expect(x.b.interpoles).toEqual([]);
    }
  });
  it('whirlpool sans température : simulé au préréglage de 80 °C (D113, voie u3), plus hachuré en entier', () => {
    const x = lire([lotus({ stage: 'whirlpool', timeMin: 20 })]);
    expect(x.hachurees).toBeLessThan(12);
    expect(x.b.nonSimules).toEqual([]);
    expect(x.b.supposes).toEqual([{ ajoutId: 'a1', raison: '80 °C supposé' }]);
  });
  it('whirlpool sans durée : toujours non simulé, avec sa raison', () => {
    const x = lire([lotus({ stage: 'whirlpool' })]);
    expect(x.hachurees).toBe(12);
    expect(x.b.nonSimules[0].raison).toMatch(/durée de whirlpool inconnue/);
  });
  it('houblon hors des fiches (Krush) : 12 hachurées, « houblon absent des fiches du moteur »', () => {
    const x = lire([{ name: 'Houblon inventé', alpha: 10, weightG: 30, stage: 'boil', timeMin: 40 }]);
    expect(x.hachurees).toBe(12);
    expect(x.b.nonSimules[0].raison).toMatch(/absent des fiches/);
  });
});

describe('D177 : la bière de départ (dégustation) accepte aussi une ébullition à 40′', () => {
  it('simulerCas ne lève plus « Moment non simulé : b30 » et interpole l\'avant', () => {
    const conv = toHopRecipe(neipa([lotus(ebullition(40))]), { boilOg: 1.081 });
    const rec = { ...conv.recette, additions: conv.recette.additions.map((a) => ({ ...a, dureeJours: undefined })) };
    const cas = simulerCas({ id: 'u2', titre: 'avant 40′', ajouts: [], levure: 'lalbrew-verdant-ipa', recette: rec, complet: false });
    expect(FAMILIES.filter((f) => cas.avant[f].haut > 0).length).toBe(4);
    const cas60 = simulerCas({ id: 'u2b', titre: 'avant 60′', ajouts: [], levure: 'lalbrew-verdant-ipa', recette: { ...rec, additions: rec.additions.map((a) => ({ ...a, moment: 'b60' as const, minutes: 60 })) }, complet: false });
    const c = (p: typeof cas.avant) => p.citrus.centre;
    expect(c(cas.avant)).not.toBe(c(cas60.avant));
  });
});
