// @vitest-environment jsdom
/**
 * Voie v3, BK3-1 : à 390, « +8 290,00 » (barre Apports) dépassait le cadre et « +1 520,00 » était traversé par le pointillé. Quand un montant écrit
 * en entier ne tient pas dans la colonne d'une pile, toutes les étiquettes passent au franc ; les centimes restent au nom accessible (title).
 * La mesure réelle (boîtes, cadre, pointillés) se fait au banc `voies/v3/banc-bk31.mjs`.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Piles, libellesTiennent } from '../../src/ui/finance/operations/Piles';
import type { PeriodeSynthese } from '../../src/domain/finance/periodeSynthese';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const periode = { entreCents: 152_000, entreAEncaisserCents: 0, postes: [{ categorie: 'chargesFixes', cents: 52_800, aPayerCents: 0 }, { categorie: 'brassage', cents: 30_680, aPayerCents: 0 }], materielCents: 0, payeCents: 0, aPayerCents: 0, depenseCents: 83_480 } as unknown as PeriodeSynthese;
const largeurColonne = (px: number) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(px);
const textes = (c: HTMLElement) => [...c.querySelectorAll('.ops-pile > b')].map(b => b.textContent?.replace(/[\s  ]/g, ' '));

describe('libellesTiennent : la place d’un montant écrit en entier', () => {
  it('« +8 290,00 » (9 signes, 65 px) ne tient pas dans 46 px, tient dans 76 px', () => {
    expect(libellesTiennent(46, ['+8 290,00'])).toBe(false);
    expect(libellesTiennent(76, ['+8 290,00'])).toBe(true);
  });
  it('largeur inconnue (0) : tient, l’inconnu n’est pas un manque de place', () => {
    expect(libellesTiennent(0, ['+8 290,00'])).toBe(true);
  });
});

describe('BK3-1 : les étiquettes du graphe', () => {
  it('colonnes de 46 px : montants au franc, centimes exacts au nom accessible', () => {
    largeurColonne(46);
    const { container } = render(<Piles periode={periode} apports={829_000} />);
    expect(textes(container)).toEqual(['+1 520', '528', '307', '+8 290']);
    expect(container.querySelector('[data-pile="apports"] b')?.getAttribute('title')?.replace(/[\s  ]/g, ' ')).toBe('+8 290,00');
  });
  it('colonnes larges (76 px) : les centimes restent', () => {
    largeurColonne(76);
    const { container } = render(<Piles periode={periode} />);
    expect(textes(container)).toEqual(['+1 520,00', '528,00', '306,80']);
  });
});
