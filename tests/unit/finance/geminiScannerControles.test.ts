// d2 (09.11) : `normalizeResult` du client garde les champs des contrôles croisés que le serveur ajoute (c1). Sans cela ils étaient jetés en silence : « Payé · non lu » partout.
// Une clé n'existe que si la lecture la porte (convention l2) ; un montant 0 lu est un montant, une absence est un inconnu, jamais 0. Gemini n'est jamais appelé.
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
import { GeminiScannerService } from '../../../src/services/geminiScanner';

const base = { vendor: 'X', items: [{ name: 'A', kind: 'stock', quantity: 1, unit: 'kg', amountTTC: 1 }] };
const lire = (extra: object) => GeminiScannerService.normalizeResult({ ...base, ...extra }) as any;

describe('d2 — normalizeResult garde les champs des contrôles de la pièce', () => {
  it('garde le payé, le terminal, les comptages, l\'heure, les lignes écartées et la photo incomplète', () => {
    const r = lire({
      amountPaid: 352.05, terminalAmount: 163.85, printedItemCount: 31, countedAmounts: 29, countedEans: 27, printedTime: '12:31',
      ignoredLines: [{ label: 'Montant en EUR', amount: 370.92, kind: 'foreign_currency' }, { label: 'TWINT', amount: null, kind: 'payment' }],
      photoIncomplete: true, photoIncompleteNote: 'bas du ticket taché',
    });
    expect(r).toMatchObject({ amountPaid: 352.05, terminalAmount: 163.85, printedItemCount: 31, countedAmounts: 29, countedEans: 27, printedTime: '12:31', photoIncomplete: true, photoIncompleteNote: 'bas du ticket taché' });
    expect(r.ignoredLines).toEqual([{ label: 'Montant en EUR', amount: 370.92, kind: 'foreign_currency' }, { label: 'TWINT', amount: null, kind: 'payment' }]);
  });

  it('un ancien résultat sort sans aucune de ces clés (jamais 0, jamais faux)', () => {
    const r = lire({});
    for (const cle of ['amountPaid', 'terminalAmount', 'printedItemCount', 'countedAmounts', 'countedEans', 'printedTime', 'ignoredLines', 'photoIncomplete', 'photoIncompleteNote']) expect(r, cle).not.toHaveProperty(cle);
  });

  it('un payé de 0 est un montant lu ; un comptage de 0 aussi ; une valeur absente ou null reste absente', () => {
    expect(lire({ amountPaid: 0 })).toHaveProperty('amountPaid', 0);
    expect(lire({ countedAmounts: 0 })).toHaveProperty('countedAmounts', 0);
    const r = lire({ amountPaid: null, countedAmounts: null, printedItemCount: null, photoIncomplete: null });
    for (const cle of ['amountPaid', 'countedAmounts', 'printedItemCount', 'photoIncomplete']) expect(r, cle).not.toHaveProperty(cle);
  });

  it('rejette le négatif, le comptage non entier, l\'heure impossible et le genre inconnu', () => {
    const r = lire({ amountPaid: -3, terminalAmount: -1, printedItemCount: 2.5, countedAmounts: -1, countedEans: 'beaucoup', printedTime: '25:99', ignoredLines: [{ label: 'x', amount: 1, kind: 'autre' }, { amount: 2 }] });
    for (const cle of ['amountPaid', 'terminalAmount', 'printedItemCount', 'countedAmounts', 'countedEans', 'printedTime']) expect(r, cle).not.toHaveProperty(cle);
    expect(r.ignoredLines).toEqual([{ label: 'x', amount: 1, kind: 'other' }]);
  });

  it('accepte l\'heure « 9h05 » ou « 9:05 » et la rend en HH:MM', () => {
    expect(lire({ printedTime: '9h05' }).printedTime).toBe('09:05');
    expect(lire({ printedTime: '9:05' }).printedTime).toBe('09:05');
  });

  it('une liste de lignes écartées vide est une liste vide lue (« rien écarté »), pas un inconnu', () => {
    expect(lire({ ignoredLines: [] }).ignoredLines).toEqual([]);
  });
});
