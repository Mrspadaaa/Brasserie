import { describe, expect, it } from 'vitest';
import { plusMenuFor } from '../../src/domain/plusEcran';

/** Décision du pilote (16.11) : la partie écran de la pile de Brassins = Nouveau brassin, Saisir une densité (si un brassin est en fermentation), Créer une recette ; pas de Courses. */
describe('Le + sur Brassins : Nouveau brassin, Saisir une densité, Créer une recette', () => {
  it('avec un brassin en fermentation : « Saisir une densité · B-031 · J+4 », puis Créer une recette ; pas de Courses ; le titre dit « Brassins »', () => {
    const m = plusMenuFor('production', 'batches', { enFermentation: { id: 'B-031', jours: 4 } });
    expect(m.chemin).toBe('Brassins');
    expect(m.action?.label).toBe('Nouveau brassin');
    expect(m.autres.map(e => e.cle)).toEqual(['densite', 'recette']);
    expect(m.autres[0]).toMatchObject({ label: 'Saisir une densité', hint: 'B-031 · J+4' });
    expect(m.autres.map(e => e.cle)).not.toContain('courses');
  });

  it('le jour inconnu n\'est pas écrit ; sans brassin en fermentation, la densité n\'existe pas (jamais un geste vide)', () => {
    expect(plusMenuFor('production', 'batches', { enFermentation: { id: 'B-031' } }).autres[0].hint).toBe('B-031');
    expect(plusMenuFor('production', 'batches', {}).autres.map(e => e.cle)).toEqual(['recette']);
  });
});
