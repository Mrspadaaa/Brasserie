// T4-2 (passe 5, 20.11) : « pas de conseil · fiche absente » pour LalBrew Windsor, alors que sa fiche donne « 50-100 g/hL » et « 15 - 25 °C ».
// Le test reproduit la carte Ma levure : le besoin (dose du fabricant) de Windsor choisi au catalogue, et celui du Windsor du stock.
import { describe, expect, it } from 'vitest';
import { readYeastSupply } from '../../../functions/src/yeastSupplySchema';
import bootstrap from '../../../src/data/yeastSupplyBootstrap.json';
import { applyCatalogueYeast } from '../../../src/domain/yeastCatalogue';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import { relierAuCatalogue } from '../../../src/domain/levure/relier';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import { besoinDeLaLevure, doseApresChoix } from '../../../src/ui/etapeLevure/dose';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';

const supply = readYeastSupply(bootstrap)!;
const refs = yeastReferences([]);
const windsor = refs.find(r => r.id === 'lalbrew-windsor')!;
const recette = () => recetteApercuEtapeLevure() as unknown as TrialRecipe;

describe('T4-2 : la dose du fabricant de LalBrew Windsor', () => {
  it('Windsor choisi au catalogue : le fabricant donne 50–100 g/hL au volume de la recette (30 L : 15–30 g)', () => {
    const choisie = applyCatalogueYeast(recette(), windsor, windsor.form);
    const suivante = doseApresChoix(choisie, { name: 'autre' }, supply, undefined, windsor);
    const besoin = besoinDeLaLevure(suivante, supply, undefined, windsor);
    expect(besoin?.fabricant).toEqual({ min: 15, max: 30, borne: false });
    expect(suivante.yeast.qty).toBeGreaterThan(0);
  });

  it('une recette dont la levure n’a que le nom (stock) : la fiche se relie par le nom, et la dose du fabricant s’en déduit', () => {
    const r = recette();
    r.yeast = { name: 'LalBrew Windsor', form: 'sèche' } as TrialRecipe['yeast'];
    const reliee = relierAuCatalogue(r.yeast, refs);
    expect(reliee?.id).toBe('lalbrew-windsor');
    expect(besoinDeLaLevure(r, supply, undefined, reliee)?.fabricant).toEqual({ min: 15, max: 30, borne: false });
  });

  it('la fiche sans produit au catalogue d’approvisionnement : le fabricant se lit quand même sur la fiche', () => {
    const r = recette();
    r.yeast = { name: 'LalBrew Windsor', hopIndexId: 'lalbrew-windsor', form: 'sèche', qty: 20, unit: 'g' } as TrialRecipe['yeast'];
    const besoin = besoinDeLaLevure(r, supply, undefined, windsor);
    expect(besoin?.fabricant).toEqual({ min: 15, max: 30, borne: false });
  });
});
