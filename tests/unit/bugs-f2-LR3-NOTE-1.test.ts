import { describe, expect, it } from 'vitest';
import { alertePrixLigne } from '../../src/domain/tarifs/tuileVente';

/** LR3-NOTE-1 : « 10 × Bière 75 cl » à 5 695 CHF (569,50 la bouteille) : une alerte, jamais un refus ni un 0. */
describe('LR3-NOTE-1 alerte d’un prix de ligne', () => {
  it('prix d’une bouteille de 75 cl à plus de 10 fois son tarif : alerte avec le tarif et le prix au litre', () => {
    const a = alertePrixLigne({ prixUnitaire: 569.5, volumeL: 0.75, prixTarif: 10 });
    expect(a).not.toBeNull();
    expect(a).toContain('569,50');
    expect(a).toContain('10,00');
    expect(a).toContain('759,33');
  });
  it('exactement 10 fois le tarif : pas d’alerte (seuil strict) ; au-dessus : alerte', () => {
    expect(alertePrixLigne({ prixUnitaire: 100, volumeL: 0.75, prixTarif: 10 })).toBeNull();
    expect(alertePrixLigne({ prixUnitaire: 100.05, volumeL: 0.75, prixTarif: 10 })).not.toBeNull();
  });
  it('sans tarif sûr, le prix au litre hors de la plage plausible alerte aussi ; un prix normal se tait', () => {
    expect(alertePrixLigne({ prixUnitaire: 569.5, volumeL: 0.75, prixTarif: null })).not.toBeNull();
    expect(alertePrixLigne({ prixUnitaire: 4.5, volumeL: 0.75, prixTarif: null })).toBeNull();
    expect(alertePrixLigne({ prixUnitaire: 9.5, volumeL: 0.75, prixTarif: 10 })).toBeNull();
  });
  it('un prix inconnu ou une ligne libre sans volume : jamais d’alerte inventée', () => {
    expect(alertePrixLigne({ prixUnitaire: null, volumeL: 0.75, prixTarif: 10 })).toBeNull();
    expect(alertePrixLigne({ prixUnitaire: 5000, volumeL: 0, prixTarif: null })).toBeNull();
  });
});
