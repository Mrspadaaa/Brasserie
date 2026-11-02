// D261b (01.11, nuit) : « Détail : 170,21 CHF / 170,20 CHF » en couleur d'alerte et pastille « Total » (`somme-ecart`, bloquant) alors que
// la somme des lignes arrondie à 5 centimes (arrondi suisse, « Rundung ») donne le total imprimé.
// Cause prouvée ici : `sumCheck` (functions/src/invoiceControls.ts) compare `sum === ttc` au centime près ; un écart de 1 à 2 centimes est un
// `somme-ecart` bloquant (`bloque: true`), seul le message ajoute « Rundung » en indice. Le client refait la même règle (`recomputeInvoicePoints`).
// Les tests « Correctif posé » sont le contrat du correctif posé le 01.11 (k6-correctifs) ; les tests de non-régression passent déjà.
import { describe, expect, it } from 'vitest';
import { recomputeInvoicePoints } from '../../../../src/domain/finance/invoicePoints';
import { arrondi5, items, lecture, lire, sommeLignes, trouve } from './piece';

const SOMME = sommeLignes();   // 124,48 : la pièce imitée
const apres = (r: any) => (r.points as any[]).filter(p => p.code === 'somme-ecart');

describe('D261b — un total imprimé arrondi à 5 centimes n’est pas un écart de somme', () => {
  it('la pièce imitée : somme 124,48, total imprimé 124,50 (arrondi au 5 centimes le plus proche)', () => {
    expect(SOMME).toBe(124.48);
    expect(arrondi5(SOMME)).toBe(124.5);
  });

  it('Correctif posé — 124,48 → 124,50 (arrondi vers le haut) : aucun somme-ecart, aucun point bloquant, la somme est « ok »', () => {
    const r = lire(lecture({ amountTTC: 124.5 }));
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
    expect(r.points.some((p: any) => p.bloque)).toBe(false);
    expect(r.controls.sum.statut).toBe('ok');
  });

  it('Correctif posé — 124,41 → 124,40 (arrondi vers le bas) : idem', () => {
    const list = items([{}, {}, {}, {}, {}, {}, { quantity: 1, price: 3.41, amountTTC: 3.41 }]);   // la ligne 7 vaut 3,41 au lieu de 3,48 : somme 124,41 → 124,40
    const somme = sommeLignes(list);
    expect(somme % 0.05).not.toBeCloseTo(0, 6);
    const r = lire(lecture({ amountTTC: arrondi5(somme) }, list));
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
    expect(r.controls.sum.statut).toBe('ok');
  });

  it('Correctif posé — le même cas, recalculé côté client (`recomputeInvoicePoints`) : pas de point bloquant', () => {
    const lignes = items().map((l: any, i: number) => ({ id: `line-${i + 1}`, name: l.name, kind: l.kind, quantity: l.quantity, unit: l.unit, price: l.price, amountTTC: l.amountTTC }));
    const r = recomputeInvoicePoints({ items: lignes, amountTTC: 124.5, amountHT: null, tvaAmount: null });
    expect(apres(r)).toEqual([]);
    expect(r.statut).toBe('ok');
  });

  it('non-régression — un total qui n’est PAS un multiple de 5 centimes reste un écart bloquant (124,49 pour 124,48)', () => {
    const [p] = trouve(lire(lecture({ amountTTC: 124.49 })).points, 'somme-ecart');
    expect(p).toMatchObject({ bloque: true, lu: 12449, calcule: 12448, ecart: 1 });
  });

  it('non-régression — un multiple de 5 centimes qui n’est PAS l’arrondi de la somme reste un écart (124,55 pour 124,48 : 7 centimes)', () => {
    const [p] = trouve(lire(lecture({ amountTTC: 124.55 })).points, 'somme-ecart');
    expect(p).toMatchObject({ bloque: true, ecart: 7 });
  });

  it('non-régression — un arrondi à 5 centimes dans l’autre sens (124,45 pour 124,48 : 3 centimes) reste un écart : le plus proche est 124,50', () => {
    const [p] = trouve(lire(lecture({ amountTTC: 124.45 })).points, 'somme-ecart');
    expect(p).toMatchObject({ bloque: true, ecart: -3 });
  });
});
