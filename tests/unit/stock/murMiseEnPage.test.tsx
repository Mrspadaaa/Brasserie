// @vitest-environment jsdom
// Voie sz, correction du 13.11 (critique c25, points de mise en page). jsdom ne mesure rien : on prouve ici le geste (le bouton du nom d'un
// rayon filtre et se marque), le liseré des marques claires, et les règles écrites de la feuille d'ajustements ; le rendu est jugé sur capture.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { StockItem } from '../../../src/types';
import { MurStock } from '../../../src/ui/stock/MurStock';

afterEach(cleanup);
const item = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o } as StockItem);
const items = [
  item({ ref: 'm1', name: 'Pilsner Malz', colorEbc: 3.5, currentStock: 50 }),
  item({ ref: 'h1', name: 'Saaz', category: 'Houblon', unit: 'g', currentStock: 300, alphaPct: 3.5, origin: 'CZ' } as Partial<StockItem>),
  item({ ref: 'l1', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 3, yeastAttenuationPct: 80 }),
];
const css = readFileSync(join(process.cwd(), 'src/ui/stock/murAjustements.css'), 'utf8');

describe('mur du stock : mise en page (c25)', () => {
  it('toucher le nom d\'un rayon filtre ; le rayon actif porte aria-pressed', () => {
    const onFiltre = vi.fn();
    const { container, rerender } = render(<MurStock items={items} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" onFiltre={onFiltre} filtre={null} />);
    const bouton = container.querySelector<HTMLButtonElement>('.l1e-n[data-filtre="Houblons"]')!;
    expect(bouton.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(bouton);
    expect(onFiltre).toHaveBeenCalledWith('Houblons');
    rerender(<MurStock items={items} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" onFiltre={onFiltre} filtre="Houblons" />);
    expect(container.querySelector('.l1e-n[data-filtre="Houblons"]')!.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(container.querySelector('.l1e-n[data-filtre="Houblons"]')!);
    expect(onFiltre).toHaveBeenLastCalledWith(null);
  });
  it('une marque de houblon claire (Saaz) a un liseré ; elle reste visible sur le fond clair', () => {
    const { container } = render(<MurStock items={items} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" />);
    const trace = container.querySelector('.l1e-r[data-f="f1"] svg.l1e-hs path')!;
    expect(trace.getAttribute('stroke')).toBe('var(--l1-t2)');
  });
  it('la feuille d\'ajustements : échelle sans toucher, rayons empilés à toute largeur, pile dégagée du titre, texte ≥ 12 px en mur large', () => {
    expect(css).toMatch(/\.l1e-cl[^{]*\{pointer-events:none\}/);
    expect(css).toMatch(/@media \(min-width:900px\)\{\s*\.stock-mur \.l1-mur\{display:block/);
    expect(css).toMatch(/\[data-f=f2\] \.l1e-gb\{height:auto;min-height:var\(--hm\)\}/);
    expect(css).toMatch(/@container mur \(min-width:440px\)[\s\S]*\.sx-vd\{font-size:12px/);
  });
  it('c26 n° 1 : en sombre, les tirets de repère prennent un jeton du thème, jamais le noir fixe de mur.css (la couleur calculée se contrôle dans Chrome : voies/sz/controle-tirets-sombre.mjs)', () => {
    const regle = (sel: string) => new RegExp(sel.replace(/[.[\]()*+?]/g, '\\$&') + '[^{]*\\{[^}]*border-top-color:color-mix\\(in srgb,var\\(--l1-t1\\)').test(css);
    expect(regle('html[data-theme="cave"] .stock-mur .sw-rln')).toBe(true);
    expect(regle('html[data-theme="cave"] .stock-mur .sv-tir')).toBe(true);
    expect(regle('html[data-theme="cave"] .stock-mur .l1e-r:not(.l1e-sansc) .l1e-gb::after')).toBe(true);
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/rgba\(17,\s*17,\s*17/);
  });
  it('c26 n° 4 : le mur borne ses traits à sa largeur (la ligne « 1 kg » ne déborde pas dans la gouttière de la fiche)', () => {
    expect(css).toMatch(/\.stock-mur \.l1-mur\{overflow-x:clip\}/);
  });
  it('af0763f4 n° 3 : sans aucune levure, le rayon Levures garde le « ? » et une hauteur qui le tient (le « ? » est posé à 29 px + 28 px de haut, marge de 6 px)', () => {
    const sansLevure = items.filter((i) => i.category !== 'Levure');
    const { container } = render(<MurStock items={sansLevure} onOpen={vi.fn()} onOnglet={vi.fn()} onglet="ing" />);
    expect(container.querySelectorAll('.l1e-r[data-f="f2"] [data-art]')).toHaveLength(0);
    expect(container.querySelectorAll('.l1e-r[data-f="f2"] .sx-q')).toHaveLength(1);
    const m = css.match(/\.stock-mur \.l1e-r\[data-f=f2\]\{min-height:(\d+)px\}/);
    expect(m, 'règle min-height du rayon Levures').not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(29 + 28 + 6);
  });
});
