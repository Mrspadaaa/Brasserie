import { describe, expect, it } from 'vitest';
import { echeanceImpotSoldeePar, estPieceImpot, retirerSoldees } from '../../src/domain/finance/soldeImpot';
import type { ForecastItem } from '../../src/domain/finance/forecast';

const sortie = (id: string, date: string, amountCents: number, o: Partial<ForecastItem> = {}): ForecastItem =>
  ({ id, date, label: id, amountCents, direction: 'out', source: 'brew', category: 'brassage', ...o });

describe('PD-2 : la facture de l\'impôt solde l\'échéance d\'impôt dérivée des brassins', () => {
  it('reconnaît une facture d\'impôt par son fournisseur ou son libellé, pas par la catégorie', () => {
    expect(estPieceImpot({ vendor: 'ZZ TEST OFDF' })).toBe(true);
    expect(estPieceImpot({ description: 'Impôt sur la bière T4' })).toBe(true);
    expect(estPieceImpot({ vendor: 'Brewferm', description: 'Pompe' })).toBe(false);
  });
  it('prend l\'échéance la plus proche de la pièce, tous les brassins du même jour ; un montant 0 (litres nets inconnus) compte', () => {
    const items = [sortie('brew:A:impot', '2027-01-30', 0), sortie('brew:B:impot', '2027-01-30', 1200), sortie('brew:C:impot', '2026-12-10', 500), sortie('brew:A:achats', '2026-11-22', 900)];
    const e = echeanceImpotSoldeePar(items, { vendor: 'OFDF', dateIso: '2027-01-25' });
    expect(e?.ids.sort()).toEqual(['brew:A:impot', 'brew:B:impot']);
    expect(e?.nbBrassins).toBe(2);
    expect(echeanceImpotSoldeePar(items, { vendor: 'OFDF', dateIso: '2026-12-01' })?.ids).toEqual(['brew:C:impot']);
  });
  it('rien pour une autre pièce ou sans échéance dérivée ; retirerSoldees ne retire que les ids dits soldés', () => {
    expect(echeanceImpotSoldeePar([sortie('brew:A:impot', '2027-01-30', 0)], { vendor: 'Brouwland' })).toBeNull();
    expect(echeanceImpotSoldeePar([], { vendor: 'OFDF' })).toBeNull();
    expect(retirerSoldees([{ id: 'a' }, { id: 'b' }], new Set(['a']))).toEqual([{ id: 'b' }]);
  });
});
