import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/services/storage';
import { beerTaxBracket } from '../../src/domain/finance/swissBeerTax';

// Contre-calcul du 08.11, CF-NOTE-2 : le défaut de réglage `beerTaxFullRatePerHl` valait 25,2 (ancien taux) alors que
// swissBeerTax.ts applique 25,32 CHF/hL à la bière normale (10,1 à 14,0 °P, LIB art. 14, OFDF). Le calcul ne lit plus ce champ ;
// le défaut ne doit pas contredire le tarif qui sert au calcul. Les réglages déjà stockés ne sont pas touchés.
describe('CF-NOTE-2 — taux plein de l’impôt sur la bière par défaut', () => {
  it('le défaut vaut le taux de la bière normale appliqué par le calcul (25,32 CHF/hL)', () => {
    expect(beerTaxBracket(12)).toBe(25.32);
    expect(defaultConfig.fiscal.beerTaxFullRatePerHl).toBe(beerTaxBracket(12));
  });
});
