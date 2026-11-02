import type { StockItem } from '../../../../src/types';

/** Voie n1-nom-fr : fixtures fictives communes (aucun nom ni adresse du brasseur, Gemini jamais appelé). */
export const art = (ref: string, name: string, category = 'Malt', unit = 'kg', more: Record<string, unknown> = {}): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock: 10, minStock: 0, reorder: false, ...more }) as StockItem;

/** Une ligne lue : les champs de `StockLineInput` (dont `nomFr` et `nomLu`, lus par cast tant que le code ne les type pas). */
export const ligne = (description: string, more: Record<string, unknown> = {}): any =>
  ({ description, unit: 'Kg', quantity: 5, kind: 'ingredient', stockCategory: 'malt', ...more });

/** La ligne du brouillon (PurchaseLineDraft) d'une saisie. */
export const brouillon = (id: string, description: string, more: Record<string, unknown> = {}): any =>
  ({ id, description, kind: 'ingredient', amount: 1, quantity: 5, unit: 'Kg', stockAction: 'new', equipmentAction: 'none', stockCategory: 'malt', ...more });
