import { describe, expect, it } from 'vitest';
import * as AN from '../../../../src/domain/stock/articleNeuf';
import * as F from '../../../../src/domain/stock/fiche';
import { brouillon } from './aide';

/** Plan § D-d.5 : la fiche du catalogue se cherche sur le nom imprimé, puis, s'il ne trouve rien, sur le nom français. */
const neuf = (ligne: any) => AN.articleNeufDe((AN.ligneDeBrouillon as any)(ligne), [], {}, undefined, []);
const trouve = (nom: string) => F.ficheLaPlusProche(nom, 'Malt', undefined, undefined, undefined, {});

describe('la fiche par le nom français, en repli', () => {
  it('l\'imprimé qui trouve une fiche : inchangé', () => {
    const n = neuf(brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne' }));
    expect(n.fiche?.id).toBe(trouve('Wiener Malz')?.id);
    expect(n.fiche).toBeDefined();
  });
  it('un imprimé sans fiche, un français qui en trouve une : la fiche du français, avec son `approchee`', () => {
    const imprime = 'Zzyx Spezialmalz';
    expect(trouve(imprime)).toBeUndefined();
    // « Viennois » est un alias de la fiche « Wiener Malz » (pas son nom canonique) : trouvée seulement par le français, elle est APPROCHÉE.
    const n = neuf(brouillon('l1', imprime, { nameFr: 'Viennois' }));
    expect(trouve('Viennois')).toMatchObject({ id: 'vienna-malt', approchee: true });
    expect(n.fiche).toEqual({ id: 'vienna-malt', approchee: true });
  });
  it('ni l\'un ni l\'autre : aucune fiche', () => {
    expect(neuf(brouillon('l1', 'Zzyx Spezialmalz', { nameFr: 'Qqq Inconnu' })).fiche).toBeUndefined();
  });
});
