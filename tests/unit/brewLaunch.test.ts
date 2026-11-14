import { describe, expect, it } from 'vitest';
import type { BrewhouseProfile, Recipe } from '../../src/types';
import { scaleBrewBudgetRecipe } from '../../src/domain/finance/brewBudgetScaling';
import { apercuLancement, contenanceCuveL, contenanceFermenteurL, volumeDeDepart, detailMoment, echelleRegleL, etapesLancement, facteurVolume, levureArrondir, recetteAdaptee } from '../../src/domain/brewLaunch';

const systeme30: BrewhouseProfile = { id: 'bh-30', name: 'Système 30L', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2 };
const systeme50: BrewhouseProfile = { id: 'bh-50', name: 'Système 50L', volumeL: 50, efficiencyPct: 78, boilOffRatePct: 10, deadSpaceL: 2, mashRatioLPerKg: 4.2 };

/** Une NEIPA de 19 L : premier moût, ébullition à 15 min, fin d'ébullition, whirlpool, dry hop à trois jours. Fictive. */
const neipa = (): Recipe => ({
  id: 'R-NEIPA', name: 'New England IPA', style: 'NEIPA', volumeL: 19, ogTarget: 1.061, fgTarget: 1.014, abvTarget: 6.2, ibuTarget: 61, totalGristKg: 5.2, boilMin: 60,
  brewhouse: systeme30,
  fermentables: [
    { name: 'US 2-row', kind: 'grain', use: 'empatage', weightKg: 4.09 },
    { name: 'Golden Promise', kind: 'grain', use: 'empatage', weightKg: 0.91 },
    { name: 'Flaked wheat', kind: 'grain', use: 'empatage', weightKg: 0.45 },
    { name: 'Flaked oats', kind: 'grain', use: 'empatage', weightKg: 0.34 }
  ],
  hops: [
    { name: 'Amarillo', stage: 'firstWort', weightG: 43, alpha: 8.6 },
    { name: 'Magnum', stage: 'boil', weightG: 10, alpha: 12, timeMin: 15 },
    { name: 'Amarillo', stage: 'boil', weightG: 43, alpha: 8.6, timeMin: 0 },
    { name: 'Citra', stage: 'whirlpool', weightG: 28, alpha: 12, timeMin: 20, tempC: 82 },
    { name: 'Galaxy', stage: 'whirlpool', weightG: 28, alpha: 14, timeMin: 20, tempC: 82 },
    { name: 'Mosaic', stage: 'whirlpool', weightG: 28, alpha: 12.5, timeMin: 20, tempC: 82 },
    { name: 'Mosaic', stage: 'dryHop', weightG: 43, alpha: 12.5, dayOffset: 9 },
    { name: 'Citra', stage: 'dryHop', weightG: 85, alpha: 12, dayOffset: 2 },
    { name: 'Galaxy', stage: 'dryHop', weightG: 43, alpha: 14, dayOffset: 6 }
  ],
  yeast: { name: 'Vermont IPA', qty: 1, unit: 'flacon', form: 'liquide' },
  mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], spargeType: 'batch' },
  steps: [], notes: []
} as unknown as Recipe);

const ids = (r: Recipe) => etapesLancement(r).map((e) => e.id);

describe('brewLaunch — les étapes de la journée', () => {
  it('suit l’ordre du brasseur : empâtage, premier moût, ébullition, fin d’ébullition, whirlpool, levure, puis dry hop', () => {
    const { etapes } = apercuLancement(neipa(), 30, systeme30);
    expect(etapes.map((e) => e.id)).toEqual(['empatage', 'rincage', 'premier-mout', 'ebullition-15', 'fin-ebullition', 'whirlpool', 'levure', 'dry-hop']);
    expect(etapes.map((e) => e.groupe)).toEqual(['brassage', 'brassage', 'brassage', 'brassage', 'brassage', 'brassage', 'brassage', 'fermentation']);
  });

  it('prend ses quantités à scaleBrewBudgetRecipe, à 30 L comme à 45 L', () => {
    for (const volume of [30, 45]) {
      const attendue = scaleBrewBudgetRecipe(neipa(), volume, systeme30);
      const { etapes, adaptee } = apercuLancement(neipa(), volume, systeme30);
      expect(adaptee.volumeL).toBe(volume);
      const parId = Object.fromEntries(etapes.map((e) => [e.id, e]));
      expect(parId.empatage.pastilles.map((p) => p.quantite)).toEqual(attendue.fermentables.map((f) => f.weightKg));
      expect(parId.empatage.pastilles.every((p) => p.unite === 'kg')).toBe(true);
      expect(parId['premier-mout'].pastilles[0].quantite).toBe(attendue.hops.find((h) => h.stage === 'firstWort')!.weightG);
      expect(parId.whirlpool.pastilles.map((p) => p.quantite)).toEqual(attendue.hops.filter((h) => h.stage === 'whirlpool').map((h) => h.weightG));
      expect(parId['dry-hop'].pastilles.map((p) => p.quantite).sort()).toEqual(attendue.hops.filter((h) => h.stage === 'dryHop').map((h) => h.weightG).sort());
      expect(parId.empatage.eauL).toBeGreaterThan(0);
      expect(parId.rincage.eauL).toBeGreaterThan(0);
    }
  });

  it('range le houblon premier moût en pastille sous « Premier moût », avec son nom, son α et sa dose en g', () => {
    const { etapes } = apercuLancement(neipa(), 30, systeme30);
    const pm = etapes.find((e) => e.id === 'premier-mout')!;
    expect(pm.titre).toBe('Premier moût');
    expect(pm.matiere).toBe('houblon');
    expect(pm.pastilles).toHaveLength(1);
    expect(pm.pastilles[0]).toMatchObject({ nom: 'Amarillo', alpha: 8.6, unite: 'g' });
    expect(pm.pastilles[0].quantite).toBeGreaterThan(43);
    // La fin d'ébullition porte la même pastille, pas du texte nu.
    const fin = etapes.find((e) => e.id === 'fin-ebullition')!;
    expect(fin.pastilles[0]).toMatchObject({ nom: 'Amarillo', alpha: 8.6, unite: 'g' });
    expect(etapes.find((e) => e.id === 'ebullition-15')!.detail).toBe('15 min');
  });

  it('range par le champ stage, jamais par le nom : un houblon nommé « Premier moût » en ébullition reste en ébullition', () => {
    const r = neipa();
    r.hops = [{ name: 'Premier moût', stage: 'boil', weightG: 20, alpha: 10, timeMin: 30 }];
    expect(ids(r)).toEqual(['empatage', 'ebullition-30', 'levure']);
  });

  it('porte le whirlpool avec ses minutes et sa température, et le dry hop avec ses jours, triés', () => {
    const { etapes } = apercuLancement(neipa(), 30, systeme30);
    expect(etapes.find((e) => e.id === 'whirlpool')!.detail).toBe('20 min à 82 °C');
    const dry = etapes.find((e) => e.id === 'dry-hop')!;
    expect(dry.pastilles.map((p) => [p.nom, p.jour])).toEqual([['Citra', 2], ['Galaxy', 6], ['Mosaic', 9]]);
  });

  it('n’invente ni jour, ni α, ni dose : l’inconnu reste absent', () => {
    const r = neipa();
    r.hops = [
      { name: 'Citra', stage: 'dryHop', weightG: 50, alpha: 0 },
      { name: 'Vide', stage: 'dryHop', weightG: 0, alpha: 12, dayOffset: 3 }
    ] as Recipe['hops'];
    const dry = etapesLancement(r).find((e) => e.id === 'dry-hop')!;
    expect(dry.pastilles).toHaveLength(1);
    expect(dry.pastilles[0].jour).toBeUndefined();
    expect(dry.pastilles[0].alpha).toBeUndefined();
  });

  it('marque la levure « à arrondir » quand le compte de flacons n’est pas entier', () => {
    const { etapes } = apercuLancement(neipa(), 30, systeme30);
    const levure = etapes.find((e) => e.id === 'levure')!.levure!;
    expect(levure).toMatchObject({ nom: 'Vermont IPA', unite: 'flacon', arrondir: true });
    expect(levure.quantite).toBeCloseTo(30 / 19, 5);
    expect(etapesLancement(neipa()).find((e) => e.id === 'levure')!.levure!.arrondir).toBe(false);
    expect(levureArrondir(7.5, 'g')).toBe(false);
    expect(levureArrondir(2, 'sachet')).toBe(false);
    expect(levureArrondir(1.5, 'sachet')).toBe(true);
    expect(levureArrondir(undefined, 'sachet')).toBe(false);
  });

  it('une levure sans quantité reste sans quantité (jamais 0)', () => {
    const r = neipa();
    r.yeast = { name: 'US-05' } as Recipe['yeast'];
    const levure = etapesLancement(r).find((e) => e.id === 'levure')!.levure!;
    expect(levure.quantite).toBeUndefined();
    expect(levure.arrondir).toBe(false);
  });

  it('n’affiche pas une étape sans ingrédient', () => {
    const r = neipa();
    r.hops = r.hops.filter((h) => h.stage === 'boil' && h.timeMin === 15);
    r.yeast = undefined as unknown as Recipe['yeast'];
    r.mash = { steps: [], spargeType: 'none' } as unknown as Recipe['mash'];
    const resultat = etapesLancement(r).map((e) => e.id);
    expect(resultat).toEqual(['empatage', 'ebullition-15']);
    for (const id of ['premier-mout', 'fin-ebullition', 'whirlpool', 'levure', 'dry-hop']) expect(resultat).not.toContain(id);
  });

  it('une eau absente de la recette adaptée et du moteur ne donne pas de litres', () => {
    const r = neipa();
    r.fermentables = [];
    const e = etapesLancement(r);
    expect(e.find((x) => x.id === 'empatage')).toBeUndefined();
    expect(e.find((x) => x.id === 'rincage')).toBeUndefined();
  });

  it('place les sucres d’ébullition et les ajouts de fermentation dans leur moment', () => {
    const r = neipa();
    r.fermentables = [...r.fermentables, { name: 'Candi', kind: 'sucre', use: 'ebullition', weightKg: 0.4 }, { name: 'Dextrose', kind: 'sucre', use: 'fermentation', weightKg: 0.2, dayOffset: 3 }] as Recipe['fermentables'];
    const etapes = etapesLancement(r);
    expect(etapes.find((e) => e.id === 'sucres-ebullition')!.pastilles[0]).toMatchObject({ nom: 'Candi', quantite: 0.4, unite: 'kg' });
    expect(etapes.find((e) => e.id === 'ajouts-fermentation')!.pastilles[0]).toMatchObject({ nom: 'Dextrose', jour: 3 });
    expect(etapes.find((e) => e.id === 'empatage')!.pastilles.map((p) => p.nom)).not.toContain('Candi');
  });
});

describe('brewLaunch — volume, règle, cuve, brasserie', () => {
  it('donne le facteur de la recette (× 1,58) et rien si le volume de la recette est inconnu', () => {
    expect(facteurVolume(30, { volumeL: 19 })).toBeCloseTo(1.5789, 3);
    expect(facteurVolume(30, { volumeL: 0 })).toBeUndefined();
  });

  it('garde une échelle de règle stable et de 60 L au moins', () => {
    expect(echelleRegleL(19, 30)).toBe(60);
    expect(echelleRegleL(60, 100)).toBe(200);
    expect(echelleRegleL(19)).toBe(60);
  });

  it('ne connaît la contenance de la cuve que si elle est renseignée', () => {
    expect(contenanceCuveL(systeme30)).toBeUndefined();
    expect(contenanceCuveL(undefined)).toBeUndefined();
    expect(contenanceCuveL({ equipment: { kettleCapacityL: 45 } as BrewhouseProfile['equipment'] })).toBe(45);
    expect(contenanceCuveL({ equipment: { kettleCapacityL: 0 } as BrewhouseProfile['equipment'] })).toBeUndefined();
  });

  it('adapte comme le moteur du lancement par défaut, et à la brasserie choisie sinon', () => {
    const defaut = recetteAdaptee(neipa(), 30, systeme30);
    expect(defaut.fermentables.map((f) => f.weightKg)).toEqual(scaleBrewBudgetRecipe(neipa(), 30, systeme30).fermentables.map((f) => f.weightKg));
    const autre = recetteAdaptee(neipa(), 30, systeme30, systeme50);
    expect(autre.brewhouse?.id).toBe('bh-50');
    expect(autre.fermentables[0].weightKg).toBeLessThan(defaut.fermentables[0].weightKg); // rendement 78 % contre 75 %
  });

  it('ne connaît la capacité du fermenteur que si elle est renseignée (jamais 0)', () => {
    expect(contenanceFermenteurL(systeme30)).toBeUndefined();
    expect(contenanceFermenteurL(undefined)).toBeUndefined();
    expect(contenanceFermenteurL({ equipment: { fermenterCapacityL: 60 } as BrewhouseProfile['equipment'] })).toBe(60);
    expect(contenanceFermenteurL({ equipment: { fermenterCapacityL: 0 } as BrewhouseProfile['equipment'] })).toBeUndefined();
  });

  it('part du volume de la brasserie choisie ; sans brasserie, du volume de la recette', () => {
    expect(volumeDeDepart(neipa(), systeme30)).toBe(30);
    expect(volumeDeDepart(neipa(), systeme50)).toBe(50);
    expect(volumeDeDepart(neipa(), undefined)).toBe(19);
    expect(volumeDeDepart(neipa(), { volumeL: 0 })).toBe(19);
    expect(facteurVolume(volumeDeDepart(neipa(), systeme30), neipa())).toBeCloseTo(30 / 19, 6);
  });

  it('lève l’erreur du moteur pour un volume invalide', () => {
    expect(() => recetteAdaptee(neipa(), 0, systeme30)).toThrow('Volume à brasser invalide.');
  });

  it('écrit les moments sans inventer', () => {
    expect(detailMoment(20, 82)).toBe('20 min à 82 °C');
    expect(detailMoment(undefined, 82)).toBe('82 °C');
    expect(detailMoment(0, undefined)).toBeUndefined();
  });
});
