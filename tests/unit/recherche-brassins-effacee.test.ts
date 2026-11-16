import { describe, expect, it } from 'vitest';
import { restoreCatalogFilters } from '../../src/domain/catalogPreferences';

/** BUGS 32 (nuit du 16.11) : « Rien pour ZZ TEST » restait sur Brassins, sans recherche saisie : le texte cherché était rendu à l'écran depuis l'état gardé. Une recherche est un geste d'un instant : elle ne se rouvre jamais. */
describe('La liste des brassins ne rouvre pas un texte cherché', () => {
  it('Brassins : le texte de recherche gardé n’est pas restauré, les autres réglages le sont', () => {
    const r = restoreCatalogFilters('batches', { search: 'ZZ TEST', folder: 'archived', sort: 'volume' });
    expect(r.search).toBe('');
    expect(r.folder).toBe('archived');
    expect(r.sort).toBe('volume');
  });

  it('Recettes garde son comportement (texte restauré)', () => {
    expect(restoreCatalogFilters('recipes', { search: 'Citra' }).search).toBe('Citra');
  });
});
