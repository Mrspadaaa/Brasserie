// @vitest-environment jsdom
// CT4C-2 (critique de vision, tour 4, BLOQUANT) : à 390, les libellés de l'étagère (Torréfiés, Fumé, Sucres, Hazy, W. Coast, Belge/Blé, Anglaise)
// et les poids sous les barres faisaient moins de 12 px (10 et 11 px) : illisibles au téléphone. Règle : aucun texte du mur sous 12 px.
// CT4C-3 : le « ? » rond de la ligne Levures était une icône muette : il porte un mot.
// Le test monte le vrai mur avec ses vraies feuilles (mur.css puis murAjustements.css, dans l'ordre de MurStock) ; jsdom n'applique ni @media
// ni @container : on juge donc les règles de base, celles du téléphone (390, mur étroit).
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { StockItem } from '../../src/types';
import { MurStock } from '../../src/ui/stock/MurStock';

afterEach(cleanup);
beforeAll(() => {
  for (const f of ['mur.css', 'murAjustements.css']) {
    const st = document.createElement('style');
    st.textContent = readFileSync(join(process.cwd(), 'src/ui/stock', f), 'utf8');
    document.head.appendChild(st);
  }
});

const item = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o } as StockItem);
const STOCK = [
  item({ ref: 'm1', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 23, minStock: 5, ebc: 3.5 } as Partial<StockItem>),
  item({ ref: 'm2', name: 'Carapils', category: 'Malt', unit: 'kg', currentStock: 0, minStock: 1, ebc: 5 } as Partial<StockItem>),
  item({ ref: 'h1', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 300, minStock: 200, alphaPct: 12.5 }),
  item({ ref: 'h2', name: 'Saaz', category: 'Houblon', unit: 'g', currentStock: 500, alphaPct: 3.5 }),
  item({ ref: 'l1', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 2, yeastStrain: 'US-05' } as Partial<StockItem>)
];

/** La taille de police calculée de l'élément qui porte chaque texte du mur (parent de chaque nœud texte non vide). */
function tailles(racine: Element): Array<{ t: string; px: number; cls: string }> {
  const out: Array<{ t: string; px: number; cls: string }> = [];
  const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = (n.textContent ?? '').trim();
    const e = n.parentElement;
    if (!t || !e || e.closest('[hidden]')) continue;
    // La taille effective : la première déclaration qui la donne, de l'élément vers ses parents (jsdom n'hérite pas « font » pour nous).
    let px = NaN;
    for (let x: Element | null = e; x && Number.isNaN(px); x = x.parentElement) {
      const v = getComputedStyle(x).fontSize;
      if (v && /px$/.test(v)) px = parseFloat(v);
    }
    out.push({ t, px, cls: String(e.className) });
  }
  return out;
}

describe('CT4C-2 : étagère à 390, aucun texte sous 12 px', () => {
  it('pastilles « rien en stock » (Torréfiés, Hazy, Anglaise…), poids sous les barres, lettres et totaux : 12 px au moins', () => {
    const { container } = render(<MurStock items={STOCK} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" />);
    const mur = container.querySelector('[data-mur]')!;
    const mesures = tailles(mur);
    // le mur porte bien les textes jugés par la critique
    const textes = mesures.map((m) => m.t);
    expect(textes).toEqual(expect.arrayContaining(['Torréfiés', 'Hazy', 'Anglaise']));
    expect(textes.some((t) => /^\d+ (kg|g)$/.test(t))).toBe(true);
    const petits = mesures.filter((m) => !(m.px >= 12)).map((m) => `${m.px}px « ${m.t} » .${m.cls}`);
    expect(petits).toEqual([]);
  });
});

describe('CT4C-3 : la ligne Levures dit ce que sont ses pictos', () => {
  it('le bouton de légende porte un mot visible, pas un « ? » seul', () => {
    const { container } = render(<MurStock items={STOCK} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" />);
    const b = container.querySelector<HTMLButtonElement>('.l1e-r[data-f="f2"] .sx-q')!;
    expect(b).not.toBeNull();
    expect(b.textContent?.trim()).toMatch(/Légende/);
  });
  it('la légende des levures dit ce que sont la brique et sa lettre', () => {
    const { container } = render(<MurStock items={STOCK} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" />);
    const leg = container.querySelector('#sv-leg-f2')!;
    expect(leg.textContent).toMatch(/sachet/);
    expect(leg.textContent).toMatch(/lettre : la souche/);
  });
});
