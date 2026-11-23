// C3 et A10 (TVA par taux), C4 (HT + TVA = TTC, garde-fou). Ecrit AVANT la correction (L13).
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { invoiceFieldHints } from '../../../../src/services/purchasePrefill';
import { entete, lecture372765, ligne, trouve } from './aide';

const lire = (raw: any) => normalizeInvoiceScan(raw) as any;
const relations = (point: any) => point.details.map((d: any) => d.relation);

describe('C3 / A10 — le bloc TVA imprimé de la facture 372765 ne se recoupe pas', () => {
  const r = lire(lecture372765());

  it('un seul point « tva-incoherente », avec ses relations en défaut, base TTC', () => {
    const points = trouve(r.points, 'tva-incoherente');
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ gravite: 'ecart', champ: 'vat', ligne: null, cle: 'tva-incoherente:-:vat' });
    expect(relations(points[0])).toEqual(expect.arrayContaining(['somme-tva', 'somme-bases', 'base-par-code:N', 'base-par-code:R']));
    const parCode = Object.fromEntries(points[0].details.map((d: any) => [d.relation, d]));
    expect(parCode['somme-bases']).toMatchObject({ lu: 11040, calcule: 8650 });
    expect(parCode['somme-tva']).toMatchObject({ lu: 280, calcule: 415 });
    expect(parCode['base-par-code:N']).toMatchObject({ lu: 2620, calcule: 1120 });
    expect(parCode['base-par-code:R']).toMatchObject({ lu: 8420, calcule: 7530 });
    const ecarts = points[0].details.map((d: any) => Math.abs(d.ecart));
    expect(ecarts).toEqual([...ecarts].sort((a, b) => b - a));
    expect(r.controls.vat).toEqual({ statut: 'ecart', base: 'TTC' });
  });

  it('rien n’est corrigé en silence : TVA 2,80, TTC 86,50, HT toujours vide, bloc inchangé', () => {
    expect(r.tvaAmount).toBe(2.8);
    expect(r.amountTTC).toBe(86.5);
    expect(r.amountHT).toBeNull();
    expect(r.vat).toEqual(lecture372765().vat);
  });

  it('la phrase ne déclenche ni la 3ᵉ lecture ni un mauvais champ de l’écran', () => {
    const phrase = r.issues.find((m: string) => m.startsWith('TVA imprimée incohérente'));
    expect(phrase).toBeTruthy();
    expect(phrase.length).toBeLessThanOrEqual(250);
    expect(phrase).not.toMatch(/totaux HT \+ TVA|somme des lignes|Taux TVA incohérent/);
    const hints = invoiceFieldHints({ ...r, issues: [phrase], fieldWarnings: [], review: { status: 'checked', findings: [] } });
    expect(hints.items).toBeUndefined();
    expect(hints.amountTTC).toBeUndefined();
  });

  it('le code de rangée « N 8.1% » se joint aux lignes de code « N »', () => {
    const raw = lecture372765();
    raw.vat[0].code = 'N 8.1%';
    const p = trouve(lire(raw).points, 'tva-incoherente')[0];
    expect(relations(p)).toContain('base-par-code:N');
  });
});

describe('C3 — blocs cohérents : aucun faux point', () => {
  it('base TTC : 108,10 dont 8,10 de TVA à 8,1 %', () => {
    const r = lire(entete({ amountTTC: 108.1, tvaAmount: 8.1, items: [ligne({ price: 108.1, amountTTC: 108.1, vatCode: 'N' })], vat: [{ code: 'N', rate: 0.081, base: 108.1, amount: 8.1 }] }));
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
    expect(r.controls.vat).toEqual({ statut: 'ok', base: 'TTC' });
  });

  it('base HT : 100,00 + 8,10 = 108,10 est reconnu', () => {
    const r = lire(entete({ amountTTC: 108.1, tvaAmount: 8.1, items: [ligne({ price: 108.1, amountTTC: 108.1, vatCode: 'N' })], vat: [{ code: 'N', rate: 0.081, base: 100, amount: 8.1 }] }));
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
    expect(r.controls.vat).toEqual({ statut: 'ok', base: 'HT' });
  });

  it('TVA arrondie ligne par ligne (10 lignes de 1,10 → 0,80 de TVA au lieu de 0,82) : sous la tolérance, pas de point', () => {
    const items = Array.from({ length: 10 }, (_, i) => ligne({ name: `Houblon ${i}`, unit: 'g', price: 1.1, amountTTC: 1.1, vatCode: 'N' }));
    const r = lire(entete({ amountTTC: 11, tvaAmount: 0.8, items, vat: [{ code: 'N', rate: 0.081, base: 11, amount: 0.8 }] }));
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
    expect(r.controls.vat.statut).toBe('ok');
  });

  it('pas de bloc imprimé : TVA non vérifiable, aucun point (valeur absente par nature)', () => {
    const r = lire(entete({ amountTTC: 5, items: [ligne({ price: 5, amountTTC: 5 })] }));
    expect(r.controls.vat.statut).toBe('non-verifiable');
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
  });
});

describe('C4 — HT + TVA = TTC : conforme, un HT calculé n’est jamais lu', () => {
  it('HT non imprimé reste vide ; la lecture ne le calcule pas', () => {
    const r = lire(entete({ amountHT: null, tvaAmount: 4.15, amountTTC: 86.5 }));
    expect(r.amountHT).toBeNull();
    expect(trouve(r.points, 'ht-tva-ttc')).toEqual([]);
    expect(r.controls.totals.statut).toBe('non-verifiable');
  });

  it('HT 83,70 + TVA 4,15 ≠ 86,50 : point typé et même phrase qu’avant', () => {
    const r = lire(entete({ amountHT: 83.7, tvaAmount: 4.15, amountTTC: 86.5 }));
    expect(trouve(r.points, 'ht-tva-ttc')).toEqual([expect.objectContaining({ gravite: 'ecart', lu: 8650, calcule: 8785, ecart: -135 })]);
    expect(r.issues).toContain('Les totaux HT + TVA ne correspondent pas au TTC du document.');
    expect(r.controls.totals.statut).toBe('ecart');
  });

  it('HT 82,35 + TVA 4,15 = 86,50 : ok', () => {
    const r = lire(entete({ amountHT: 82.35, tvaAmount: 4.15, amountTTC: 86.5, items: [ligne({ price: 86.5, amountTTC: 86.5 })] }));
    expect(r.controls.totals.statut).toBe('ok');
    expect(r.points).toEqual([]);
  });
});
