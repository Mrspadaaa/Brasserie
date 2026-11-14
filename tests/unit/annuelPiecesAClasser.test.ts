import { describe, expect, it } from 'vitest';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import type { FinanceTransaction, FinancialAsset, FinancialProfile } from '../../src/domain/finance/types';
import { colonnesAnnee, piecesAClasser, piecesNonClassees, resultatEnAttente } from '../../src/ui/finance/annuel/calculs';

/* Voie a1 (14.11) : une pièce de travaux sans classement sort du « Dépensé + usure » ferme et la tête attend. Pièces à la main : aucune fixture partagée. */
const YEAR = 2026;
const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' } as FinancialProfile;
const tx = (id: string, description: string, chf: number, category: string, over: Partial<NonNullable<FinanceTransaction['finance']>> | null = {}): FinanceTransaction => ({
  id, date: `${YEAR}-06-15`, description, amountHT: chf, amountTTC: chf, tvaAmount: 0, tvaRate: 0, category, subcategory: '',
  ...(over === null ? {} : { finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: Math.round(chf * 100), vendor: 'x', lines: [], paymentStatus: 'paid', recordedAt: `${YEAR}-06-15T10:00:00Z`, ...over } })
} as unknown as FinanceTransaction);
const rapport = (transactions: FinanceTransaction[], assets: FinancialAsset[] = []) => buildAnnualReport({ year: YEAR, transactions, payments: [], assets, profile });

const vente = tx('V1', 'Vente', 5695, 'recettes'), travaux = tx('T1', 'Local et travaux', 5500, 'renovation'), divers = tx('T2', 'Achats divers', 250.2, 'divers');

describe('Annuel : pièce à classer', () => {
  it('des travaux sans ligne ni fiche : à classer, leur charge sort du ferme', () => {
    const txs = [vente, travaux, divers], r = rapport(txs);
    const pieces = piecesAClasser(txs, [], YEAR);
    expect(pieces).toEqual([{ id: 'T1', description: 'Local et travaux', categorie: 'renovation', chargeCents: 550000 }]);
    const col = colonnesAnnee(r, pieces);
    expect(r.operatingExpensesCents).toBe(575020);           // le domaine compte tout en charge : on n'y touche pas
    expect(col.depenseCents).toBe(25020);
    expect(col.totalDepenseCents).toBe(25020);               // « Dépensé + usure » ferme
    expect(col.aClasserCents).toBe(550000);
    expect(col.totalAvecAClasserCents).toBe(575020);         // la hauteur de la colonne ne change pas
    expect(col.postes.map(p => p.categorie)).toEqual(['divers']); // plus de poste « renovation » plein
    expect(resultatEnAttente(r, pieces)).toBe(true);
  });
  it('sans pièce à classer, rien ne bouge : la tête reste ferme', () => {
    const txs = [vente, divers], r = rapport(txs), pieces = piecesAClasser(txs, [], YEAR);
    expect(pieces).toEqual([]);
    const col = colonnesAnnee(r, pieces);
    expect(col.totalDepenseCents).toBe(r.operatingExpensesCents + r.depreciationCents);
    expect(col.aClasserCents).toBe(0);
    expect(resultatEnAttente(r, pieces)).toBe(false);
  });
  it('classée : une fiche au registre, ou une ligne equipment, sort la pièce de la liste', () => {
    const fiche = { id: 'A1', name: 'Agencement', transactionId: 'T1', acquisitionCents: 550000 } as unknown as FinancialAsset;
    expect(piecesAClasser([travaux], [fiche], YEAR)).toEqual([]);
    const avecLigne = tx('T3', 'Local et travaux', 1000, 'renovation', { lines: [{ id: 'l', description: 'Cloison', kind: 'equipment', amountCents: 100000, capitalTreatment: 'expense' }] as never });
    expect(piecesAClasser([avecLigne], [], YEAR)).toEqual([]);
  });
  it('le petit achat de matériel avec fiche reste un « petit achat » (g6) ; sans fiche, c\'est le domaine qui le dit', () => {
    expect(piecesAClasser([tx('J1', 'Joints', 28.6, 'materiel')], [], YEAR)).toEqual([]);
    const ancienne = tx('J2', 'Pompe', 300, 'materiel', null), r = rapport([ancienne]);
    expect(piecesAClasser([ancienne], [], YEAR).map(p => p.id)).toEqual(['J2']);
    expect(piecesNonClassees(r).length).toBeGreaterThan(0);  // même pièce, dite aussi par `annual.ts`
  });
  it('la part pro, l\'année et une pièce annulée sont respectées', () => {
    const partielle = tx('T4', 'Atelier', 1000, 'renovation', { businessUsePct: 60 });
    expect(piecesAClasser([partielle], [], YEAR)[0].chargeCents).toBe(60000);
    const autreAnnee = { ...tx('T5', 'Vieux travaux', 900, 'renovation'), date: '2025-03-01' } as FinanceTransaction;
    const annulee = tx('T6', 'Annulée', 900, 'renovation', { voidedAt: `${YEAR}-07-01T00:00:00Z` });
    expect(piecesAClasser([autreAnnee, annulee], [], YEAR)).toEqual([]);
  });
  it('une alerte du domaine sans pièce à carrer (capital non rangé) met aussi la tête en attente', () => {
    const r = rapport([vente, tx('E1', 'Cuve', 2000, 'materiel', { lines: [{ id: 'l1', description: 'Cuve', kind: 'equipment', amountCents: 200000 }] as never })]);
    expect(piecesAClasser([vente], [], YEAR)).toEqual([]);
    expect(piecesNonClassees(r).length).toBeGreaterThan(0);
    expect(resultatEnAttente(r, [])).toBe(true);
  });
});
