// @vitest-environment jsdom
// Voie sz, correctif du 13.11 : le mur plantait au montage sur ?dev-local (TypeError getBoundingClientRect dans <Mur>).
// Cause : la mise en page mesurée de la maquette suppose chaque rayon garni ; un rayon sans aucun article (aucun malt, par exemple)
// a une planche sans colonne `.l1e-g`, et `over()` mesurait `gs[gs.length-1]`, donc undefined. Le test monte le vrai composant,
// avec le vrai CSS du mur (la pastille « rien en stock » y est posée en absolu, ce qui déclenche le repli sur la dernière colonne).
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { StockItem } from '../../../src/types';
import { MurStock } from '../../../src/ui/stock/MurStock';

afterEach(cleanup);
beforeAll(() => {
  const st = document.createElement('style');
  st.textContent = readFileSync(join(process.cwd(), 'src/ui/stock/mur.css'), 'utf8');
  document.head.appendChild(st);
});

const item = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o } as StockItem);
const monter = (items: StockItem[]) => render(<MurStock items={items} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" />);

describe('mur du stock : montage', () => {
  it('se monte quand un rayon est entièrement vide (aucun malt, aucune levure)', () => {
    const { container } = monter([item({ ref: 'h1', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 500, alphaPct: 12 })]);
    expect(container.querySelector('[data-mur]')).not.toBeNull();
    const malts = container.querySelector('.l1e-r[data-f="f0"]');
    expect(malts?.querySelectorAll('.l1e-g').length).toBe(0);
    expect(malts?.querySelector('.sx-vd')).not.toBeNull();
    expect(container.querySelectorAll('.l1e-r[data-f="f1"] .l1e-g').length).toBeGreaterThan(0);
  });
  it('se monte sans aucun article', () => {
    const { container } = monter([]);
    expect(container.querySelector('[data-mur]')).not.toBeNull();
    expect(container.querySelectorAll('.l1e-g').length).toBe(0);
  });
  it('une pile de levures reste à 5 briques (hauteur de la rangée) et le total garde le compte exact', () => {
    const { container } = monter([item({ ref: 'l1', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 8, yeastAttenuationPct: 80 })]);
    expect(container.querySelectorAll('.l1e-r[data-f="f2"] .l1e-sk .l1e-s1').length).toBe(5);
    expect(container.querySelector('.l1e-r[data-f="f2"] .sx-tk')?.getAttribute('aria-label')).toBe('8 sachets');
  });
  it('se monte avec les trois rayons garnis, puis se démonte sans erreur', () => {
    const { container, unmount } = monter([
      item({ ref: 'm1', name: 'Pilsner Malz', colorEbc: 3.5, currentStock: 50 }),
      item({ ref: 'h1', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 500, alphaPct: 12 }),
      item({ ref: 'l1', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 3, yeastAttenuationPct: 80 }),
    ]);
    expect(container.querySelectorAll('.l1e-r[data-f] .l1e-g').length).toBeGreaterThanOrEqual(3);
    expect(() => unmount()).not.toThrow();
  });
});
