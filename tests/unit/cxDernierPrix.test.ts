// Voie cx, ST-T24 (14.11) : la fiche lisait « Dernier prix » dans le champ pricePerUnit de l'article, que l'enregistrement d'une facture n'écrit pas :
// « inconnu » après deux achats à 2,30 CHF/kg. Le dernier prix se lit maintenant dans les lignes d'achat.
import { describe, expect, it } from 'vitest';
import { latestBrewPrices } from '../../src/domain/finance/brewBudget';
import { prixDernierAchat, prixLu } from '../../src/domain/stock/ficheArticle';
import type { FinanceTransaction } from '../../src/domain/finance/types';

const achat = (id: string, date: string, ref: string, quantity: number, unit: string, amountCents: number): FinanceTransaction => ({
  id, date, description: id, amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: amountCents / 100, category: 'Matières premières', subcategory: '',
  finance: { version: 1, kind: 'expense', amountCents, vendor: 'Weyermann', lines: [{ id: `${id}-1`, description: 'Malt', amountCents, quantity, unit, stockItemRef: ref }] }
} as unknown as FinanceTransaction);

const maris = { ref: 'maris', unit: 'kg' };

describe('prixDernierAchat', () => {
  it('deux achats à 2,30 CHF/kg : 2,30 CHF le kg (le prix de la dernière ligne, rapporté à l\'unité de l\'article)', () => {
    const achats = latestBrewPrices([achat('a1', '03.11.2026', 'maris', 25, 'kg', 5750), achat('a2', '10.11.2026', 'maris', 10, 'kg', 2300)]);
    expect(prixDernierAchat(maris, achats)).toBeCloseTo(2.3, 6);
    expect(prixLu(prixDernierAchat(maris, achats), 'kg')).toBe('1 kg · 2,3 CHF');
  });
  it('le plus récent l\'emporte, quelle que soit l\'ordre de lecture', () => {
    const achats = latestBrewPrices([achat('b2', '10.11.2026', 'maris', 10, 'kg', 3000), achat('b1', '03.11.2026', 'maris', 10, 'kg', 2000)]);
    expect(prixDernierAchat(maris, achats)).toBeCloseTo(3, 6);
  });
  it('une ligne en g pour un article en kg est convertie ; un houblon à 100 g affiche le prix des 100 g', () => {
    const achats = latestBrewPrices([achat('c1', '03.11.2026', 'citra', 500, 'g', 5000)]);
    expect(prixDernierAchat({ ref: 'citra', unit: 'g' }, achats)).toBeCloseTo(0.1, 6);
    expect(prixLu(prixDernierAchat({ ref: 'citra', unit: 'g' }, achats), 'g')).toBe('100 g · 10 CHF');
    expect(prixDernierAchat({ ref: 'citra', unit: 'kg' }, achats)).toBeCloseTo(100, 6);
  });
  it('une facture annulée ne compte pas ; sans achat lu, l\'ancien champ ; sinon null (jamais 0)', () => {
    const annulee = achat('d1', '03.11.2026', 'maris', 10, 'kg', 9999);
    (annulee.finance as { voidedAt?: string }).voidedAt = '2026-11-04T10:00:00Z';
    expect(prixDernierAchat(maris, latestBrewPrices([annulee]))).toBeNull();
    expect(prixDernierAchat({ ...maris, pricePerUnit: 1.9 }, latestBrewPrices([annulee]))).toBe(1.9);
    expect(prixDernierAchat(maris, {})).toBeNull();
  });
  it('une unité qui ne se convertit pas (Stk pour des kg) ne donne aucun prix inventé', () => {
    const achats = latestBrewPrices([achat('e1', '03.11.2026', 'maris', 2, 'Stk', 900)]);
    expect(prixDernierAchat(maris, achats)).toBeNull();
  });
});
