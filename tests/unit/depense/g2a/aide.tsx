// Voie g2a-ecran : l'aide commune des tests de l'écran « Nouvelle dépense » sur une pièce FICTIVE (quincaillerie : « Brico Fictif SA »), jamais une valeur de sa pièce.
// Les `vi.mock` restent dans chaque fichier de test (ils sont remontés par vitest) ; ici seulement le rendu d'une lecture simulée.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';

export type Item = ReturnType<typeof ligne>;
export const ligne = (id: number, name: string, kind: string, quantity: number | null, unit: string, price: number | null, amountTTC: number | null, stockCategory = '', variant = '') =>
  ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC, reference: '', variant, stockCategory, evidence: `${name} (page 1)`, ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null });

/** Rend la feuille sur une lecture simulée de `items` (sinon la pièce `renovation` de l'aperçu) ; `scanned` est le mock de `scanDocument`. */
export async function lirePiece(scanned: { mockResolvedValueOnce: (v: unknown) => unknown }, items?: Item[], retouche?: (result: any) => void) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const result = JSON.parse(JSON.stringify((apercuDepense('renovation').outcome as any).result));
  if (items) { result.items = items; result.printedLineCount = items.length; result.amountTTC = Math.round(items.reduce((a, i) => a + (i.amountTTC ?? 0), 0) * 100) / 100; }
  retouche?.(result);
  scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-travaux.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
}
export type Vue = ReturnType<typeof render>;
export const ligneDe = (v: Vue, n: number) => v.container.querySelector<HTMLElement>(`[data-dp-ligne="line-${n}"]`)!;
