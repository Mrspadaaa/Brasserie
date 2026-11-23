// D272 (01.11, nuit) : la pastille TVA de sa commande. Aucun HT n'y est imprimé (prix TVA comprise) ; les quatre lectures du banc k6
// (Flash-Lite et 3.8) prennent pourtant le sous-total des articles, avant port, pour le HT. HT + TVA ≠ TTC pose alors `ht-tva-ttc`,
// qui pèse : rond sur la tuile TVA. Ce « HT » est un sous-total TTC : il n'est pas tenu pour lu (null), jamais recalculé.
// Un vrai HT, et un HT faux qui n'est pas un sous-total, gardent la règle d'avant.
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { chipsDeLecture } from '../../../../src/ui/depense/etat';
import { TVA_SOMME, items, lecture, lire, sommeLignes, trouve } from './piece';

const sousTotal = sommeLignes(items().slice(0, -1));

describe('D272 — un sous-total TTC lu comme HT', () => {
  it('le sous-total des articles avant port lu comme HT : ni ht-tva-ttc, ni HT gardé', () => {
    const r = lire(lecture({ amountHT: sousTotal }));
    expect(trouve(r.points, 'ht-tva-ttc')).toEqual([]);
    expect(r.amountHT).toBeNull();
    expect(r.controls.totals.statut).toBe('non-verifiable');
  });

  it('une seule des deux lectures prend le sous-total pour le HT, l’autre lit null : plus de désaccord sur le HT', () => {
    const r = reconcileInvoiceVision([lire(lecture({ amountHT: sousTotal })), lire(lecture())]);
    const points = (r.result as any).points as any[];
    expect(points.filter(p => p.code === 'lectures-divergentes' && p.champ === 'amountHT')).toEqual([]);
  });

  it('le TTC lu comme HT n’est pas un sous-total : la règle d’avant reste (hors D272)', () => {
    const l = lecture();
    expect(trouve(lire({ ...l, amountHT: l.amountTTC }).points, 'ht-tva-ttc')).toHaveLength(1);
  });

  it('deux lectures qui prennent le sous-total pour le HT : aucune pastille TVA', () => {
    const r = reconcileInvoiceVision([lire(lecture({ amountHT: sousTotal })), lire(lecture({ amountHT: sousTotal }))]);
    const points = (r.result as any).points as any[];
    expect(trouve(points, 'ht-tva-ttc')).toEqual([]);
    expect(chipsDeLecture(points, []).map(c => c.nom)).not.toContain('TVA');
  });

  it('un vrai HT reste : HT + TVA = TTC, contrôle vérifié', () => {
    const l = lecture();
    const ht = Math.round((l.amountTTC - TVA_SOMME) * 100) / 100;
    const r = lire({ ...l, amountHT: ht });
    expect(r.amountHT).toBe(ht);
    expect(r.controls.totals.statut).toBe('ok');
  });

  it('un HT faux qui n’est ni le TTC ni un sous-total garde son écart', () => {
    const r = lire(lecture({ amountHT: 50 }));
    expect(trouve(r.points, 'ht-tva-ttc')).toHaveLength(1);
    expect(r.amountHT).toBe(50);
  });
});
