/** Mission 2026-11-10-lecture-robuste, jeu en ligne 1 (bloquant 3) : « 1 article en trop » rouge faux, puis « Voir la ligne en trop » ouvrait un vrai article. */
import { describe, expect, it } from 'vitest';
import { controlesCroises, type EntreeControles } from '../../../src/ui/finance/controlesCroises';

const entree = (o: Partial<EntreeControles> = {}): EntreeControles => ({ lignesCents: 76855, nLignes: 6, nAjoutes: 0, ajoutsCents: 0, totalCents: 76855, attendus: null, attendusIndependant: null, nRabais: 0, payeCents: null, terminalCents: null, qte: { ok: true, valeur: '5/5' }, photo: true, ...o } as EntreeControles);
const articles = (e: EntreeControles) => controlesCroises(e).rangs.find(r => r.cle === 'articles')!;

describe('le comptage des articles ne compte que ce que le comptage voit', () => {
  it('doc2 : une ligne imprimée sans montant n’est pas dans la colonne des montants (6 lignes, 5 montants comptés)', () => {
    expect(articles(entree({ attendusIndependant: 5 })).verdict).toBe('ecart');
    const r = articles(entree({ attendusIndependant: 5, nSansMontant: 1 }));
    expect(r.verdict).toBe('ok');
    expect(r.geste).toBeUndefined();
  });
  it('doc14 : la ligne de port rangée à part n’est pas une ligne annoncée (17 lignes dont le port, 16 annoncées)', () => {
    const r = articles(entree({ nLignes: 17, attendus: 16, nPort: 1 }));
    expect(r.verdict).not.toBe('ecart');
    expect(articles(entree({ nLignes: 17, attendus: 16 })).geste).toBe('Voir la ligne en trop');
  });
  it('une vraie ligne en trop reste dite', () => {
    expect(articles(entree({ nLignes: 7, attendusIndependant: 5, nSansMontant: 1 })).verdict).toBe('ecart');
  });
});
