import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../src/types';
import { decoderLigneVente, encoderLigneVente } from '../../src/ui/vente/ligneVente';
import { raisonAVerifier, separerAVerifier, ventesAuLitre } from '../../src/domain/tarifs/ventesAuLitre';

/** Fixture anonymisée (« ZZ ») : la forme de la ligne de caisse du jeu en ligne du 16.11 ; aucune donnée réelle. */
const vente = (id: string, date: string, vendor: string, format: string, litres: number, quantite: number, cents: number) => ({
  id, date, description: '', amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: 0, category: 'recettes', subcategory: '',
  finance: { version: 1, kind: 'income', amountCents: cents, vendor, lines: [{ id: `${id}-0`, description: '', kind: 'other', quantity: quantite, unit: 'pièce', amountCents: cents, sourceReference: encoderLigneVente('B1', format, litres) }] }
}) as unknown as Transaction;
const lire = (transactions: Transaction[]) => ventesAuLitre({ transactions, clients: [], decoder: decoderLigneVente, biereDuLot: () => 'Blonde', estDemo: () => false });

describe('constat 12 · la raison du « à vérifier » vient de la ligne de la vente', () => {
  it('la vente porte sa quantité, son montant et sa transaction', () => {
    const v = lire([vente('T3', '10.11.2026', 'ZZ Bar du Test', '75cl', 0.75, 10, 569500)])[0];
    expect(v.quantite).toBe(10);
    expect(v.montantLigne).toBe(5695);
    expect(v.transactionId).toBe('T3');
  });

  it('une ligne : « 10 × 75 cl à 5 695,00 : 569,50 la bouteille »', () => {
    const v = lire([vente('T3', '10.11.2026', 'ZZ Bar du Test', '75cl', 0.75, 10, 569500)])[0];
    expect(raisonAVerifier(v).replace(/\s/g, ' ')).toBe('10 × 75 cl à 5 695,00 : 569,50 la bouteille');
  });

  it('un fût : « 1 × fût 20 L à 4 000,00 : 4 000,00 le fût »', () => {
    const v = lire([vente('T4', '10.11.2026', 'ZZ Bar du Test', 'fut', 20, 1, 400000)])[0];
    expect(raisonAVerifier(v).replace(/\s/g, ' ')).toBe('1 × fût 20 L à 4 000,00 : 4 000,00 le fût');
  });

  it('une vente corrigée (569,50 → 5,695 par bouteille) revient dans la plage, l’ancienne saisie reste « à vérifier »', () => {
    const avant = separerAVerifier(lire([vente('T3', '10.11.2026', 'ZZ Bar du Test', '75cl', 0.75, 10, 569500)]));
    expect(avant.aVerifier.map((v) => v.transactionId)).toEqual(['T3']);
    expect(avant.sures).toHaveLength(0);
    // Le brasseur corrige la saisie : 10 bouteilles à 56,95 (CHF 75,93 le litre) — la ligne est réécrite, rien d'autre ne change.
    const apres = separerAVerifier(lire([vente('T3', '10.11.2026', 'ZZ Bar du Test', '75cl', 0.75, 10, 56950)]));
    expect(apres.aVerifier).toHaveLength(0);
    expect(apres.sures.map((v) => v.transactionId)).toEqual(['T3']);
  });
});
