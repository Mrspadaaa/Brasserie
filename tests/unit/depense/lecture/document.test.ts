// A6 (pro-forma), A9 (α), A3 (prompt) et forme du résultat. Ecrit AVANT la correction (L13).
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { TASKS } from '../../../../functions/src/prompts';
import { entete, lecture372765, ligne, trouve } from './aide';

const lire = (raw: any) => normalizeInvoiceScan(raw) as any;
const unePiece = (over: Record<string, unknown> = {}) => entete({ amountTTC: 10, items: [ligne({ price: 10, amountTTC: 10 })], ...over });

describe('A6 — pro-forma payée : un type à part, jamais « À payer » quand le paiement est imprimé', () => {
  it('lue « devis » mais payée : documentType reste tel que lu, documentTypeRetenu = invoice, point type-deduit', () => {
    const r = lire(unePiece({ documentType: 'quote', proForma: true, paymentEvidence: 'paid' }));
    expect(r.proForma).toBe(true);
    expect(r.documentType).toBe('quote');
    expect(r.documentTypeLu).toBe('quote');
    expect(r.documentTypeRetenu).toBe('invoice');
    expect(trouve(r.points, 'type-deduit')).toEqual([expect.objectContaining({ champ: 'documentType', unite: 'texte', luTexte: 'quote' })]);
    expect(r.issues.join(' ')).not.toContain('Devis');
  });

  it('pro-forma lue facture et payée (sa facture) : aucun point, aucune phrase', () => {
    const r = lire(unePiece({ documentType: 'invoice', proForma: true, paymentEvidence: 'paid' }));
    expect(r.documentTypeRetenu).toBe('invoice');
    expect(r.points).toEqual([]);
  });

  it('pro-forma sans paiement imprimé : demande de paiement, point inverifiable', () => {
    const r = lire(unePiece({ documentType: 'invoice', proForma: true, paymentEvidence: 'unknown' }));
    expect(trouve(r.points, 'pro-forma-non-payee')).toEqual([expect.objectContaining({ gravite: 'inverifiable', champ: 'documentType' })]);
    expect(r.documentTypeRetenu).toBe('invoice');
  });

  it('un vrai devis (pas pro-forma) garde sa phrase et reçoit un point inverifiable', () => {
    const r = lire(unePiece({ documentType: 'quote', proForma: false, paymentEvidence: 'unknown' }));
    expect(r.issues.join(' ')).toContain('Devis');
    expect(trouve(r.points, 'devis')).toHaveLength(1);
    expect(r.documentTypeRetenu).toBe('quote');
  });

  it('le rapprochement de trois lectures ne perd ni le type retenu ni son point', () => {
    const lecture = () => lire(unePiece({ documentType: 'quote', proForma: true, paymentEvidence: 'paid' }));
    const { result } = reconcileInvoiceVision([lecture(), lecture(), lecture()]) as any;
    expect(result.documentType).toBe('quote');
    expect(result.documentTypeRetenu).toBe('invoice');
    expect(trouve(result.points, 'type-deduit')).toHaveLength(1);
  });
});

describe('A9 — l’α d’un houblon est un champ de la ligne', () => {
  const houblon = (name: string, alphaPct: unknown, evidence = '') => lire(entete({ amountTTC: 1.6, items: [ligne({ name, unit: 'g', quantity: 40, price: 0.04, amountTTC: 1.6, alphaPct, evidence })] }));

  it('« Target 11.3% » lu avec α 11,3 : conservé, aucun point', () => {
    const r = houblon('Target 11.3%', 11.3);
    expect(r.items[0]).toMatchObject({ alphaPct: 11.3, alphaPctLu: 11.3 });
    expect(r.points).toEqual([]);
  });

  it('α lu 11,8 sur un libellé qui imprime 11.3 % : point alpha-libelle, valeur lue gardée', () => {
    const r = houblon('Target 11.3%', 11.8);
    expect(r.items[0].alphaPct).toBe(11.8);
    expect(trouve(r.points, 'alpha-libelle')).toEqual([expect.objectContaining({ gravite: 'ecart', ligne: 1, unite: 'pourcent', lu: 11.8, calcule: 11.3, enjeu: 'stock' })]);
  });

  it('l’extrait cite la TVA « 8.1% » : seul le nom compte, aucun faux point', () => {
    const r = houblon('Target 11.3%', 11.3, 'HO0102 Target 11.3% 40 g R 0.040 1.60 (TVA 8.1%)');
    expect(trouve(r.points, 'alpha-libelle')).toEqual([]);
  });

  it('α absent (null) : rien n’est déduit du nom', () => {
    const r = houblon('Target 11.3%', null);
    expect(r.items[0].alphaPct).toBeNull();
    expect(r.points).toEqual([]);
  });

  it('α 250 : hors plage, devient null, la valeur lue reste tracée et signalée, y compris après rapprochement', () => {
    const r = houblon('Target 11.3%', 250);
    expect(r.items[0]).toMatchObject({ alphaPct: null, alphaPctLu: 250 });
    expect(trouve(r.points, 'forme-rejetee')).toEqual([expect.objectContaining({ gravite: 'inverifiable', origine: 'forme', ligne: 1 })]);
    const { result } = reconcileInvoiceVision([houblon('Target 11.3%', 250), houblon('Target 11.3%', 250), houblon('Target 11.3%', 250)]) as any;
    expect(result.items[0].alphaPctLu).toBe(250);
    expect(trouve(result.points, 'forme-rejetee')).toHaveLength(1);
  });

  it('sa facture : les 7 houblons portent leur α, lu', () => {
    const r = lire(lecture372765());
    const alphas = r.items.filter((i: any) => i.alphaPct !== null).map((i: any) => [i.name, i.alphaPct]);
    expect(alphas).toHaveLength(7);
    expect(alphas[0]).toEqual(['Target 11.3%', 11.3]);
  });
});

describe('Forme du résultat', () => {
  it('aucune clé à undefined (Firestore) : le résultat survit à JSON à l’identique', () => {
    for (const raw of [lecture372765(), unePiece(), entete(), unePiece({ documentType: 'quote', proForma: true })]) {
      const r = lire(raw);
      expect(JSON.parse(JSON.stringify(r))).toStrictEqual(r);
    }
  });

  it('une réponse ancienne, sans les nouveaux champs, reste lisible avec des valeurs par défaut', () => {
    const r = lire({ vendor: 'X', currency: 'CHF', date: '09.09.2026', amountTTC: 10, items: [{ name: 'Malt', kind: 'stock', quantity: 2, unit: 'kg', price: 5, amountTTC: 10 }] });
    expect(r).toMatchObject({ proForma: false, vat: [], linesLost: 0, printedLineCount: null, points: [] });
    expect(r.items[0]).toMatchObject({ vatCode: '', alphaPct: null });
  });

  it('un taux de TVA lu hors de 0 à 1 est rejeté avec trace (point forme-rejetee), jamais corrigé en silence', () => {
    const r = lire(unePiece({ amountTTC: 10, vat: [{ code: 'N', rate: 8.1, base: 10, amount: 0.8 }] }));
    expect(r.vat[0].rate).toBeNull();
    expect(r.rejets).toEqual([expect.objectContaining({ champ: 'vat.rate' })]);
    expect(trouve(r.points, 'forme-rejetee')).toHaveLength(1);
  });

  it('plus de 6 rangées de TVA : coupé, dit', () => {
    const vat = Array.from({ length: 8 }, (_, i) => ({ code: `C${i}`, rate: 0.01, base: 1, amount: 0.01 }));
    const r = lire(unePiece({ vat }));
    expect(r.vat).toHaveLength(6);
    expect(trouve(r.points, 'forme-rejetee').length).toBeGreaterThan(0);
  });
});

describe('A3 — le prompt n’avertit que d’un doute réel', () => {
  const task: any = TASKS.scanInvoice;
  const system: string = task.system;

  it('plus de « certitude de 100 % » ; les trois doutes réels sont nommés ; les absences par nature ne sont pas des doutes', () => {
    expect(system).not.toMatch(/100\s?%/);
    for (const mot of ['illisible', 'confondable', 'absente alors qu', 'amountHT = null', 'proForma']) expect(system).toContain(mot);
    expect(system).toMatch(/jamais d.avertissement pour une valeur lue sans hésitation/);
  });


});
