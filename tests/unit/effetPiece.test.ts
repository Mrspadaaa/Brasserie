import { describe, expect, it } from 'vitest';
import type { FinanceLine, FinanceTransaction, FinancialPayment, TransactionFinance } from '../../src/domain/finance/types';
import { periodeSynthese } from '../../src/domain/finance/periodeSynthese';
import { effetPiece, pieceProvisoire, type PieceEnSaisie } from '../../src/domain/finance/effetPiece';

// Fixture : la démo de la maquette g3a (vente 720 ; nettoyage 42, brassage 186,80, électricité 68 payés ; loyer 400 à payer ; joints 28,60 matériel), novembre 2026.
const AUJOURDHUI = '2026-11-10';
const tx = (id: string, cents: number, category: string, finance: Partial<TransactionFinance> = {}, date = '2026-11-05'): FinanceTransaction => ({
  id, description: id, date, category: category as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', ...finance },
});
const paiement = (t: FinanceTransaction): FinancialPayment => ({ id: `P-${t.id}`, transactionId: t.id, date: t.date, amountCents: t.finance!.amountCents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: `${t.date}T10:00:00Z` });
const ligne = (id: string, kind: FinanceLine['kind'], cents: number): FinanceLine => ({ id, kind, description: id, amountCents: cents });

const vente = tx('V', 72000, 'recettes'), nettoyage = tx('N', 4200, 'nettoyage'), brassage = tx('B', 18680, 'brassage', { lines: [ligne('malt', 'ingredient', 18680)] });
const elec = tx('E', 6800, 'chargesFixes'), loyer = tx('L', 40000, 'chargesFixes', { dueDate: '2026-11-25' }), joints = tx('J', 2860, 'materiel');
const octobre = tx('O', 99900, 'brassage', {}, '2026-10-12');
const transactions = [vente, nettoyage, brassage, elec, loyer, joints, octobre];
const payments = [vente, nettoyage, brassage, elec, joints, octobre].map(paiement);

const depense = (patch: Partial<PieceEnSaisie> = {}): PieceEnSaisie => ({ sens: 'out', date: '10.11.2026', montantCents: 5840, categorie: 'brassage', description: 'ZZ Malt Pilsner 25 kg', reglement: 'paye', ...patch });
const effet = (piece: PieceEnSaisie, avecTx = transactions, avecPay = payments, idFinal?: string) => effetPiece({ piece, transactions: avecTx, payments: avecPay, aujourdhui: AUJOURDHUI, idFinal });

describe('effetPiece : avant et après sont deux appels de periodeSynthese', () => {
  it('« avant » est exactement periodeSynthese du mois, sans la pièce', () => {
    const e = effet(depense())!;
    expect(e.avant).toEqual(periodeSynthese({ transactions, payments, mois: '2026-11', aujourdhui: AUJOURDHUI }));
    expect(e.mois).toBe('2026-11');
  });

  it('dépense payée : dépensé et payé montent de 58,40, l’à payer ne bouge pas, la pile Brassage prend la pièce', () => {
    const e = effet(depense())!;
    expect(e.ecart).toMatchObject({ depenseCents: 5840, payeCents: 5840, aPayerCents: 0, entreCents: 0, materielCents: 0, principal: 'depense', principalCents: 5840 });
    expect(e.apres.depenseCents).toBe(e.avant.depenseCents + 5840);
    expect(e.apres.postes.find(p => p.categorie === 'brassage')).toMatchObject({ cents: 18680 + 5840, aPayerCents: 0 });
  });

  it('dépense à payer : le même dépensé, mais c’est l’à payer qui monte (pièce hachurée) ; le payé ne bouge pas', () => {
    const e = effet(depense({ reglement: 'a-payer', echeance: '30.11.2026' }))!;
    expect(e.ecart).toMatchObject({ depenseCents: 5840, payeCents: 0, aPayerCents: 5840, principal: 'depense' });
    expect(e.apres.postes.find(p => p.categorie === 'brassage')).toMatchObject({ cents: 18680 + 5840, aPayerCents: 5840 });
    expect(e.apres.aPayer.find(r => r.libelle === 'ZZ Malt Pilsner 25 kg')).toMatchObject({ cents: 5840, echeance: '2026-11-30' });
  });

  it('payée puis à payer : le dépensé est identique, seule la répartition payé / à payer change (la bascule ne change pas le fait)', () => {
    const paye = effet(depense())!, ouverte = effet(depense({ reglement: 'a-payer' }))!;
    expect(paye.apres.depenseCents).toBe(ouverte.apres.depenseCents);
    expect(paye.apres.payeCents - ouverte.apres.payeCents).toBe(5840);
    expect(ouverte.apres.aPayerCents - paye.apres.aPayerCents).toBe(5840);
  });

  it('règlement inconnu : compté plein et non hachuré, l’à payer ne bouge pas (l’inconnu n’est pas un à payer inventé)', () => {
    const e = effet(depense({ reglement: 'inconnu' }))!;
    expect(e.ecart.depenseCents).toBe(5840);
    expect(e.ecart.aPayerCents).toBe(0);
    expect(e.apres.aVerifier.paiementsAConfirmer).toContain('PIECE-EN-SAISIE');
  });

  it('encaissement : la vente payée monte l’entré et l’encaissé ; rien à encaisser ; le dépensé ne bouge pas', () => {
    const e = effet({ sens: 'in', date: '10.11.2026', montantCents: 5400, categorie: 'recettes', description: 'ZZ Vente caisse · 12 × 33 cl', reglement: 'paye', moyen: 'twint' })!;
    expect(e.ecart).toMatchObject({ entreCents: 5400, encaisseCents: 5400, aEncaisserCents: 0, depenseCents: 0, principal: 'entre', principalCents: 5400 });
    expect(e.apres.entreCents).toBe(72000 + 5400);
  });

  it('facture QR : la vente monte l’entré, mais c’est « à encaisser » qui prend 54,00 (Ventes hachurée) ; l’encaissé ne bouge pas', () => {
    const e = effet({ sens: 'in', date: '10.11.2026', montantCents: 5400, categorie: 'recettes', description: 'Facture 2026-004', reglement: 'a-payer', echeance: '10.12.2026' })!;
    expect(e.ecart).toMatchObject({ entreCents: 5400, encaisseCents: 0, aEncaisserCents: 5400, depenseCents: 0 });
    expect(e.apres.entreAEncaisserCents).toBe(5400);
    expect(e.apres.aEncaisser[0]).toMatchObject({ cents: 5400, echeance: '2026-12-10' });
  });

  it('pièce d’octobre : le mois est octobre, jamais novembre', () => {
    const e = effet(depense({ date: '20.10.2026' }))!;
    expect(e.mois).toBe('2026-10');
    expect(e.avant.depenseCents).toBe(99900);
    expect(e.apres.depenseCents).toBe(99900 + 5840);
    expect(e.ecart.depenseCents).toBe(5840);
  });

  it('matériel : la pièce va à part (colonne Matériel), le dépensé et l’à payer ne bougent pas', () => {
    const e = effet(depense({ categorie: 'materiel', montantCents: 12000, lignes: [ligne('cuve', 'equipment', 12000)] }))!;
    expect(e.ecart).toMatchObject({ materielCents: 12000, depenseCents: 0, payeCents: 0, aPayerCents: 0, principal: 'materiel', principalCents: 12000 });
    expect(e.apres.materielCents).toBe(2860 + 12000);
  });

  it('matériel sans ligne : la catégorie de la pièce suffit (même règle que la Synthèse)', () => {
    expect(effet(depense({ categorie: 'materiel' }))!.ecart).toMatchObject({ materielCents: 5840, depenseCents: 0 });
  });

  it('plusieurs lignes : la pièce se répartit en catégories comme à l’enregistrement', () => {
    const e = effet(depense({ montantCents: 10000, lignes: [ligne('malt', 'ingredient', 6000), ligne('soude', 'cleaning', 4000)] }))!;
    const parCat = (p: typeof e.apres, c: string) => p.postes.find(x => x.categorie === c)?.cents ?? 0;
    expect(parCat(e.apres, 'brassage') - parCat(e.avant, 'brassage')).toBe(6000);
    expect(parCat(e.apres, 'nettoyage') - parCat(e.avant, 'nettoyage')).toBe(4000);
    expect(e.ecart.depenseCents).toBe(10000);
  });

  it('montant vide, nul ou négatif : pas d’effet (onglet neutre, pas de faux écart)', () => {
    expect(effet(depense({ montantCents: 0 }))).toBeNull();
    expect(effet(depense({ montantCents: Number.NaN }))).toBeNull();
    expect(effet(depense({ montantCents: -500 }))).toBeNull();
  });

  it('catégorie absente ou date invalide : pas d’effet', () => {
    expect(effet(depense({ categorie: '' }))).toBeNull();
    expect(effet(depense({ categorie: undefined }))).toBeNull();
    expect(effet(depense({ date: '' }))).toBeNull();
    expect(effet(depense({ date: '31.02.2026' }))).toBeNull();
  });

  it('une pièce déjà écrite sous son identifiant final n’est pas comptée deux fois dans « avant »', () => {
    const deja = { ...tx('TX-abc', 5840, 'brassage'), date: '2026-11-10' };
    const e = effet(depense(), [...transactions, deja], [...payments, paiement(deja)], 'TX-abc')!;
    expect(e.avant).toEqual(effet(depense())!.avant);
    expect(e.ecart.depenseCents).toBe(5840);
  });

  it('une base vide : avant à zéro, après = la pièce seule', () => {
    const e = effet(depense(), [], [])!;
    expect(e.avant.depenseCents).toBe(0);
    expect(e.apres.depenseCents).toBe(5840);
    expect(e.ecart.principalCents).toBe(5840);
  });

  it('les entrées ne sont pas modifiées', () => {
    const avant = JSON.stringify([transactions, payments]);
    effet(depense());
    expect(JSON.stringify([transactions, payments])).toBe(avant);
  });
});

describe('pieceProvisoire', () => {
  it('payée : un paiement à la date du règlement, dans le sens de la pièce ; à payer : aucun paiement et l’état « impayé »', () => {
    const paye = pieceProvisoire(depense({ dateReglement: '12.11.2026', moyen: 'cash' }))!;
    expect(paye.payment).toMatchObject({ date: '2026-11-12', amountCents: 5840, direction: 'out', method: 'cash' });
    const ouverte = pieceProvisoire(depense({ reglement: 'a-payer' }))!;
    expect(ouverte.payment).toBeNull();
    expect(ouverte.transaction.finance?.paymentStatus).toBe('unpaid');
    expect(pieceProvisoire(depense({ reglement: 'inconnu' }))!.transaction.finance?.paymentStatus).toBe('unknown');
  });
  it('un paiement daté après aujourd’hui reste à payer aujourd’hui (la règle de la Synthèse)', () => {
    const e = effet(depense({ dateReglement: '25.11.2026' }))!;
    expect(e.ecart).toMatchObject({ payeCents: 0, aPayerCents: 5840 });
  });
});
