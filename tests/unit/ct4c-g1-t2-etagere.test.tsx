// @vitest-environment jsdom
// CT4C (g1, tour 2) n° 4 : les briques Levures « U » et « S » : la lettre seule ne dit pas la souche sans ouvrir la Légende.
// Règle : le nom court de la souche (US-05, S-04) se lit sous la brique, sur la rangée, sans toucher.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { StockItem } from '../../src/types';
import { MurStock } from '../../src/ui/stock/MurStock';
import { nomCourtSouche } from '../../src/domain/stock/murDonnees';

afterEach(cleanup);
const item = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o } as StockItem);
const LEVURES = [
  item({ ref: 'l1', name: 'ZZ TEST — SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 2, yeastStrain: 'US-05' } as Partial<StockItem>),
  item({ ref: 'l2', name: 'ZZ TEST — SafAle S-04', category: 'Levure', unit: 'sachet', currentStock: 1, yeastStrain: 'S-04' } as Partial<StockItem>)
];

describe('CT4C n° 4 : la souche se lit sans la Légende', () => {
  it('nomCourtSouche : le nom de la souche sans la marque du labo ; rien lu : null, jamais inventé', () => {
    expect(nomCourtSouche('US-05')).toBe('US-05');
    expect(nomCourtSouche('SafAle S-04')).toBe('S-04');
    expect(nomCourtSouche('Nottingham')).toBe('Nottingham');
    expect(nomCourtSouche('')).toBeNull();
  });
  it('sous chaque colonne de levures, le nom court de ses souches est écrit à côté du compte', () => {
    const { container } = render(<MurStock items={LEVURES} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" />);
    const groupes = [...container.querySelectorAll('[data-mur] [data-groupe]')];
    const textes = groupes.map((g) => g.querySelector('.l1e-t')?.textContent ?? '');
    expect(textes.some((t) => t.includes('US-05'))).toBe(true);
    expect(textes.some((t) => t.includes('S-04'))).toBe(true);
    // le nom est lisible à voix haute aussi (pas aria-hidden)
    const nom = container.querySelector('.sx-sn');
    expect(nom).not.toBeNull();
    expect(nom!.closest('[aria-hidden="true"]')).toBeNull();
  });
});
