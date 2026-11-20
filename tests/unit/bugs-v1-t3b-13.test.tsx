import { describe, expect, it } from 'vitest';
import { prixDeTuile } from '../../src/domain/tarifs/tuileVente';
import { formatsDuBrassin, tarifDuFormat } from '../../src/ui/vente/formatsVente';
import type { PricingItem } from '../../src/types';

const tarif = (product: string, priceHT: number): PricingItem => ({ id: product, product, priceHT } as unknown as PricingItem);

describe('T3B-13 · la tuile Vendre ne propose pas un prix hors de toute vraisemblance', () => {
  it('« 75 cl · 569,50 CHF » (759 CHF le litre) : pas de prix, « à vérifier »', () => {
    expect(prixDeTuile(569.5, 0.75)).toEqual({ prix: null, suspect: true });
  });
  it('« 33 cl · 3,00 CHF » (9,09 CHF le litre) reste proposé', () => {
    expect(prixDeTuile(3, 0.33)).toEqual({ prix: 3, suspect: false });
  });
  it('un 75 cl à 7,50 CHF, un fût de 20 L à 120 CHF restent proposés', () => {
    expect(prixDeTuile(7.5, 0.75)).toEqual({ prix: 7.5, suspect: false });
    expect(prixDeTuile(120, 20)).toEqual({ prix: 120, suspect: false });
  });
  it('un tarif absent ou nul reste inconnu, sans « à vérifier » : l\'inconnu n\'est jamais 0', () => {
    expect(prixDeTuile(null, 0.75)).toEqual({ prix: null, suspect: false });
    expect(prixDeTuile(0, 0.75)).toEqual({ prix: null, suspect: false });
    expect(prixDeTuile(undefined, 0.33)).toEqual({ prix: null, suspect: false });
  });
  it('avec les vrais tarifs du brasseur (33 cl 3,00 ; 75 cl 569,50), seul le 75 cl est refusé', () => {
    const tarifs = [tarif('Pale Ale 33 cl', 3), tarif('Pale Ale 75 cl', 569.5)];
    const formats = formatsDuBrassin(undefined, []);
    const tuiles = formats.map(({ format }) => ({ id: format.id, ...prixDeTuile(tarifDuFormat(tarifs, format.id, 'Pale Ale')?.priceHT, format.volumeL) }));
    expect(tuiles.find(t => t.id === '33cl')).toMatchObject({ prix: 3, suspect: false });
    expect(tuiles.find(t => t.id === '75cl')).toMatchObject({ prix: null, suspect: true });
  });
});
