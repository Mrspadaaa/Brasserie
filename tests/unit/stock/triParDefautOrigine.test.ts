import { describe, expect, it } from 'vitest';
import { classerHoublons } from '../../../src/domain/stock/mur';

// Repli « par défaut » d'un houblon peu typé : l'origine affine la famille (RESULTAT-2 de la voie ta, décision 1).
describe('houblon peu typé : colonne par défaut selon l\'origine', () => {
  const col = (h: Parameters<typeof classerHoublons>[0][number]) => classerHoublons([h])[h.id];
  it('un houblon anglais d\'α bas va en Pale & Session, pas en Lager', () => {
    expect(col({ id: 'fuggles', parts: null, famille: 'nobles', origine: 'UK', alpha: 4.5 })).toMatchObject({ colonne: 'pale', parDefaut: true });
  });
  it('un amérisant tchèque va en Lager', () => {
    expect(col({ id: 'premiant', parts: null, famille: 'amerisants', origine: 'CZ', alpha: 8 }).colonne).toBe('lager');
  });
  it('un américain d\'α bas (Liberty) va en Pale & Session, pas en W. Coast', () => {
    expect(col({ id: 'liberty', parts: null, famille: 'classiques', origine: 'US', alpha: 4 }).colonne).toBe('pale');
  });
  it('un noble allemand reste en Lager, un moderne en Hazy', () => {
    expect(col({ id: 'hallertau', parts: null, famille: 'nobles', origine: 'DE', alpha: 4 }).colonne).toBe('lager');
    expect(col({ id: 'x', parts: null, famille: 'modernes', origine: 'US', alpha: 5 }).colonne).toBe('hazy');
  });
});
