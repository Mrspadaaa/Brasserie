/**
 * D287 : le nom d'une rangée ne garde pas la ponctuation d'un libellé de facture (« Frais de port : », lu en ligne le 02.11 sur doc14).
 */
import {describe,it,expect} from 'vitest';
import {nomAffiche} from '../../../../src/ui/depense/etat';

describe('D287 — nomAffiche',()=>{
  it('retire le deux-points final, imprimé ou traduit',()=>{
    expect(nomAffiche('Frais de port :')).toBe('Frais de port');
    expect(nomAffiche('Versandkosten:')).toBe('Versandkosten');
  });
  it('garde un deux-points au milieu du nom',()=>{
    expect(nomAffiche('Carton 24 alvéoles : naturel')).toMatch(/:/u);
  });
});
