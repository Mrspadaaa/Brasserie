import { describe, it, expect } from 'vitest';
import { noteAcideProfil, type AcideProfilInput } from '../../src/ui/water/acideProfil';

const base: AcideProfilInput = {
  ra: -9, raBand: { min: -48, max: 2 }, placeAcide: 'bas', acidAmount: 4.8, manual: false,
  phSansAcide: { known: true, position: 1 }, profil: { code: '21A', name: 'American IPA' },
};

describe('RL-5 : note du dosage d’acide imposé par le profil de style', () => {
  it('alcalinité déjà dans le repère, acide dosé : dit que c’est le profil du style', () => {
    expect(noteAcideProfil(base)).toBe('Alcalinité déjà dans le repère ; acide dosé pour le profil American IPA.');
  });

  it('pH déjà dans la cible sans acide : le dit', () => {
    expect(noteAcideProfil({ ...base, phSansAcide: { known: true, position: 0 } }))
      .toBe('pH déjà dans la cible sans acide ; acide dosé pour le profil American IPA.');
  });

  it('pH sans acide inconnu : ne prétend rien sur le pH', () => {
    expect(noteAcideProfil({ ...base, phSansAcide: null })).toBe('Alcalinité déjà dans le repère ; acide dosé pour le profil American IPA.');
    expect(noteAcideProfil({ ...base, phSansAcide: { known: false, position: 0 } })).toMatch(/^Alcalinité déjà/);
  });

  it('se tait hors du cas : dose à la main, pas d’acide, alcalinité hors repère, acide qui reste dans le repère, pas de profil', () => {
    expect(noteAcideProfil({ ...base, manual: true })).toBeNull();
    expect(noteAcideProfil({ ...base, acidAmount: 0 })).toBeNull();
    expect(noteAcideProfil({ ...base, ra: 30 })).toBeNull();
    expect(noteAcideProfil({ ...base, ra: -60 })).toBeNull();
    expect(noteAcideProfil({ ...base, placeAcide: 'juste' })).toMatch(/acide dosé pour le profil/);
    expect(noteAcideProfil({ ...base, profil: { code: '—', name: '—' } })).toBeNull();
  });
});
