// LR2-4 (g1, 20.11) : doc14 relu en réel (lot 2, tirage 2) : 17 lignes lues dont le port 30,00, `printedLineCount` 16. Le bandeau disait « 16 lignes · dont port 30,00 » et la rangée
// « Articles 17 lus · non imprimé » : deux nombres pour la même pièce. Le port est dit à part (« dont port ») : la rangée des articles ne le compte pas, quel que soit le comptage annoncé.
import { describe, expect, it } from 'vitest';
import { controlesCroises, type EntreeControles } from '../../src/ui/finance/controlesCroises';
import { lireFixture } from './depense/g1/lire';

const entree = (o: Partial<EntreeControles> = {}): EntreeControles => ({ lignesCents: 17021, nLignes: 17, nAjoutes: 0, ajoutsCents: 0, totalCents: 17020, attendus: null, attendusIndependant: null, nRabais: 0, nSansMontant: 0, nPort: 1,
  payeCents: null, moyen: null, qte: null, ...o } as EntreeControles);
const articles = (e: EntreeControles) => controlesCroises(e).rangs.find(r => r.cle === 'articles')!;

describe('LR2-4 : « 16 lignes · dont port » et « Articles 17 lus » sur le même écran', () => {
  it('la lecture réelle (17 lignes dont le port 30,00, 16 annoncées) : la lecture finale garde le port à part', async () => {
    const r = await lireFixture('doc14-port-en-ligne');
    expect(r.items).toHaveLength(17);
    expect(r.items.filter((i: any) => i.kind === 'shipping').map((i: any) => i.amountTTC)).toEqual([30]);
    expect(r.printedLineCount).toBe(16);
  });
  it('comptage annoncé (16) : la rangée dit 16, pas 17', () => {
    const r = articles(entree({ attendus: 16 }));
    expect(r.valeurs).toBe('16');
  });
  it('comptage non imprimé : « 16 lus · non imprimé », le port n’est pas un article', () => {
    expect(articles(entree({ attendus: null })).valeurs).toBe('16 lus · non imprimé');
  });
  it('sans port, rien ne change', () => {
    expect(articles(entree({ attendus: null, nLignes: 16, nPort: 0 })).valeurs).toBe('16 lus · non imprimé');
  });
});
