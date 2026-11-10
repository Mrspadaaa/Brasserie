// @vitest-environment jsdom
/* Voie f2 (CP-1) : Opérations (v6b) dans l'état de la vraie app (`?finance-demo=reel`) : une seule vente de 10 pièces, client dans le titre, une pile par catégorie.
   Forme de v6b : la colonne d'une catégorie a une largeur de colonne, pas celle de l'écran ; la ligne dit « 10 pièces » ; le client ne s'écrit pas deux fois. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { financeDemoEntries } from '../../src/dev/financeDemo';
import { Piles, colonnesDe } from '../../src/ui/finance/operations/Piles';
import { detailLigne, pieceDe, tiersAAfficher } from '../../src/ui/finance/operations/calculs';
import type { PeriodeSynthese } from '../../src/domain/finance/periodeSynthese';
import type { Transaction } from '../../src/types';

afterEach(cleanup);
const vente = () => financeDemoEntries('reel').entries.find(e => e.id === 'REC-REEL-1')!.data as Transaction;
const periodeUneVente = { entreCents: 569_500, entreAEncaisserCents: 0, postes: [], materielCents: 0, payeCents: 0, aPayerCents: 0, depenseCents: 0 } as unknown as PeriodeSynthese;

describe('Opérations v6b, la vente unique de la vraie app', () => {
  it('une seule vente : une seule pile, « Ventes », avec son montant, sans séparateur ; la colonne est plafonnée dans le CSS', () => {
    const c = colonnesDe(periodeUneVente);
    expect(c.ventes?.cents).toBe(569_500); expect(c.charges).toEqual([]); expect(c.materiel).toBeNull();
    const { container } = render(<Piles periode={periodeUneVente} />);
    expect(container.querySelectorAll('.ops-pile')).toHaveLength(1);
    expect(container.querySelector('.ops-sep')).toBeNull();
    expect((container.querySelector('.ops-pile')?.textContent ?? '').replace(/\s/g, ' ')).toContain('5 695,00');
    const css = readFileSync('src/ui/finance/operations.css', 'utf8');
    expect(css).toMatch(/\.ops-pile \{[^}]*max-width:\s*76px/);
    expect(css).toMatch(/\.ops-piles \{[^}]*justify-content:\s*space-evenly/);
  });
  it('la ligne de la vente dit « 10 pièces » (ex-« 75 cl 10 pièce ») ; un kilo garde son libellé', () => {
    const tx = { ...vente(), finance: { ...vente().finance!, proofDocumentId: 'DOC', sourceDocumentType: 'receipt' } } as Transaction;
    expect(pieceDe(tx)).toEqual({ texte: 'ticket · 10 pièces', manque: false });
    expect(detailLigne({ description: 'Bière · 75 cl', quantity: 1, unit: 'pièce' })).toBe('1 pièce');
    expect(detailLigne({ description: 'Pilsner', quantity: 25, unit: 'kg' })).toBe('Pilsner 25 kg');
    expect(detailLigne({ description: 'Houblon', quantity: 0.5, unit: 'kg' })).toBe('Houblon 0,5 kg');
  });
  it('le client déjà dans le titre ne s’écrit pas deux fois ; un tiers absent du titre s’écrit', () => {
    const v = vente();
    expect(v.description).toContain('Restaurant du Lac');
    expect(tiersAAfficher(v.description, v.finance?.vendor)).toBeNull();
    expect(tiersAAfficher('Vente au marché', 'Marché du village')).toBe('Marché du village');
    expect(tiersAAfficher('Électricité', 'Énergie')).toBe('Énergie');
    expect(tiersAAfficher('Restaurant du Lac — vente', 'restaurant du lac')).toBeNull();
    expect(tiersAAfficher('Vente', '')).toBeNull();
  });
  it('le titre long reste sur une ligne, comme v6b (toutes les opérations à la même hauteur) : coupé par « … », nom complet dans le nom accessible et le survol (voie vo, 10.11)', () => {
    // Remplace l'ancienne règle de f2 (deux lignes), contraire à la maquette choisie : « nom sur deux lignes » était l'un de ses reproches.
    const css = readFileSync('src/ui/finance/operations.css', 'utf8');
    expect(css).toMatch(/\.ops-q \{[^}]*white-space:\s*nowrap[^}]*text-overflow:\s*ellipsis/);
    expect(css).not.toMatch(/\.ops-q \{[^}]*-webkit-line-clamp/);
  });
});
