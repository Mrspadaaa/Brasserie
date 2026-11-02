// C2 et P2 : somme des lignes = total au centime ; aucune ligne jetée en silence. Ecrit AVANT la correction (L13).
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { invoiceFieldHints } from '../../../../src/services/purchasePrefill';
import { avecLigne, entete, lecture372765, ligne, trouve } from './aide';

const lire = (raw: any) => normalizeInvoiceScan(raw) as any;
const plat = (n: number) => Array.from({ length: n }, (_, i) => ligne({ name: `Article ${i + 1}`, price: 1, amountTTC: 1 }));

describe('C2 — somme des lignes = total, au centime', () => {
  it('23 lignes vraies : somme 86,50 = 86,50 → ok sur la base TTC', () => {
    const r = lire(lecture372765());
    expect(r.controls.sum).toEqual({ statut: 'ok', base: 'TTC' });
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
  });

  it('une ligne lue 0,63 au lieu de 0,60 : écart de 3 centimes (l’ancienne tolérance de 5 le laissait passer)', () => {
    const r = lire(avecLigne(lecture372765(), 1, { amountTTC: 0.63 }));
    const [p] = trouve(r.points, 'somme-ecart');
    expect(p).toMatchObject({ gravite: 'ecart', champ: 'amountTTC', ligne: null, unite: 'centimes', lu: 8650, calcule: 8653, ecart: -3, bloque: true });
    expect(p.message).toContain('Rundung');
    expect(r.controls.sum.statut).toBe('ecart');
    expect(r.issues.join(' ')).toContain('somme des lignes');
    expect(invoiceFieldHints({ ...r, issues: r.issues, fieldWarnings: [], review: { status: 'checked', findings: [] } }).amountTTC).toBeTruthy();
  });

  it('une ligne sans montant (cas b) : point somme-incomplete qui nomme la ligne, jamais « vérifié »', () => {
    // fn-montant-seul : une ligne à `price` seul reçoit amountTTC = price ; ici la ligne n'a AUCUN montant (ni price ni amountTTC).
    const r = lire(avecLigne(lecture372765(), 3, { amountTTC: null, price: null }));
    const [p] = trouve(r.points, 'somme-incomplete');
    expect(p).toMatchObject({ gravite: 'inverifiable', lignes: [4], champ: 'amountTTC' });
    expect(r.controls.sum.statut).toBe('incomplet');
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
  });

  it('lignes en HT : Σ lignes = HT lu au centime → ok, base HT, pas d’écart contre le TTC', () => {
    const r = lire(entete({ amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, items: [ligne({ price: 100, amountTTC: 100 })] }));
    expect(r.controls.sum).toEqual({ statut: 'ok', base: 'HT' });
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
    expect(r.controls.totals.statut).toBe('ok');
  });

  it('facture sans aucune ligne : somme non vérifiable, ni point ni phrase', () => {
    const r = lire(entete({ amountTTC: 0.3, items: [] }));
    expect(r.points).toEqual([]);
    expect(r.controls.sum.statut).toBe('non-verifiable');
    expect(r.issues.join(' ')).not.toContain('somme des lignes');
  });

  it('total TTC absent : somme non vérifiable, pas de point de somme', () => {
    const r = lire(entete({ amountTTC: null, items: plat(2) }));
    expect(r.controls.sum.statut).toBe('non-verifiable');
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
  });
});

describe('P2 — aucune ligne jetée en silence', () => {
  it('36 lignes : une perdue, dite en nombre ; la somme des 35 vaut le TTC mais n’est JAMAIS déclarée vérifiée', () => {
    const r = lire(entete({ amountTTC: 35, items: plat(36) }));
    expect(r.items).toHaveLength(35);
    expect(r.linesLost).toBe(1);
    const [p] = trouve(r.points, 'lignes-perdues');
    expect(p).toMatchObject({ gravite: 'ecart', champ: 'items', unite: 'lignes', calcule: 36, lu: 35, ecart: -1 });
    expect(r.controls.sum.statut).toBe('incomplet');
    expect(r.issues.filter((m: string) => m.startsWith('Plus de 35 lignes'))).toHaveLength(1);
    expect(r.issues.join(' ')).toMatch(/35 lignes/);
  });

  it('après le rapprochement, « Plus de 35 lignes » n’apparaît qu’une fois et linesLost est gardé', () => {
    const a = lire(entete({ amountTTC: 35, items: plat(36) }));
    const { result } = reconcileInvoiceVision([a, lire(entete({ amountTTC: 35, items: plat(36) }))]);
    expect((result as any).linesLost).toBe(1);
    expect((result as any).controls.sum.statut).toBe('incomplet');
    expect(result.issues.filter((m: string) => m.startsWith('Plus de 35 lignes'))).toHaveLength(1);
  });

  it('le modèle annonce 25 lignes imprimées, en transcrit 23, somme exacte : seulement un point inverifiable, la somme reste ok', () => {
    const r = lire({ ...lecture372765(), printedLineCount: 25 });
    expect(r.linesLost).toBe(0);
    expect(trouve(r.points, 'lignes-annoncees')).toEqual([expect.objectContaining({ gravite: 'inverifiable' })]);
    expect(r.controls.sum.statut).toBe('ok');
  });

  it('même annonce, mais la somme ne tombe pas juste : les 2 lignes comptent comme perdues, somme incomplète', () => {
    const r = lire({ ...avecLigne(lecture372765(), 1, { amountTTC: 0.63 }), printedLineCount: 25 });
    expect(r.linesLost).toBe(2);
    expect(r.points).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'lignes-perdues' })]));
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
    expect(r.controls.sum.statut).toBe('incomplet');
  });

  it('un second passage sur son propre résultat rend les mêmes points et le même linesLost', () => {
    const premier = lire({ ...avecLigne(lecture372765(), 1, { amountTTC: 0.63 }), printedLineCount: 25 });
    const second = lire(premier);
    expect(second.linesLost).toBe(premier.linesLost);
    expect(second.points).toEqual(premier.points);
    expect(second.controls).toEqual(premier.controls);
  });
});
