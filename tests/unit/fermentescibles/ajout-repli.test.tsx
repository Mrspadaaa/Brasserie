// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FermentableKind, StockItem } from '../../../src/types';
import { Ajout, type DefFamille } from '../../../src/ui/fermentescibles/Ajout';
import { stockApercu } from '../../../src/ui/fermentescibles/apercuDev';

// p9-clic (01.11) : les tuiles ne se replient jamais pendant l'appui qui a pris le focus au champ (sinon la page remonte sous la souris et le clic se perd).
const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};

function Banc() {
  const stock: StockItem[] = React.useMemo(() => stockApercu(), []);
  return (
    <div>
      <Ajout famille="grain" familles={['grain', 'sucre']} defs={DEFS} onFamille={() => {}} stockItems={stock} fermentables={[]}
        onChoisir={() => {}} onCreer={() => {}} />
      <button type="button" data-testid="ailleurs">Ailleurs</button>
    </div>
  );
}

const champ = () => screen.getByRole('combobox') as HTMLInputElement;
const ouvertes = () => champ().getAttribute('aria-expanded') === 'true';
const pointeur = (type: string) => ({ pointerType: type, pointerId: 1, isPrimary: true });
const tourSuivant = async () => { await act(async () => { vi.advanceTimersByTime(1); }); };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Ajout : le repli des tuiles attend la fin de l\'appui (p9-clic)', () => {
  it('souris : le blur pendant l\'appui laisse les tuiles ; pointerup puis le tour suivant les replie', async () => {
    render(<Banc />);
    act(() => { champ().focus(); });
    expect(ouvertes()).toBe(true);
    const ailleurs = screen.getByTestId('ailleurs');
    // L'appui : pointerdown souris, puis mousedown qui prend le focus (blur du champ).
    fireEvent.pointerDown(ailleurs, pointeur('mouse'));
    act(() => { ailleurs.focus(); });
    await tourSuivant();
    expect(document.activeElement).toBe(ailleurs);
    expect(ouvertes()).toBe(true);
    // Le bouton est relâché : le tour suivant seulement, le repli.
    fireEvent.pointerUp(ailleurs, pointeur('mouse'));
    expect(ouvertes()).toBe(true);
    await tourSuivant();
    expect(ouvertes()).toBe(false);
  });

  it('clavier : le blur replie au tour suivant, pas avant', async () => {
    render(<Banc />);
    act(() => { champ().focus(); });
    expect(ouvertes()).toBe(true);
    act(() => { screen.getByTestId('ailleurs').focus(); });
    expect(ouvertes()).toBe(true);
    await tourSuivant();
    expect(ouvertes()).toBe(false);
  });

  it('doigt : le pointerup précède le blur, le repli suit au tour suivant', async () => {
    render(<Banc />);
    act(() => { champ().focus(); });
    const ailleurs = screen.getByTestId('ailleurs');
    fireEvent.pointerDown(ailleurs, pointeur('touch'));
    fireEvent.pointerUp(ailleurs, pointeur('touch'));
    act(() => { ailleurs.focus(); });
    expect(ouvertes()).toBe(true);
    await tourSuivant();
    expect(ouvertes()).toBe(false);
  });

  it('le champ reprend le focus avant le repli : les tuiles restent', async () => {
    render(<Banc />);
    act(() => { champ().focus(); });
    act(() => { screen.getByTestId('ailleurs').focus(); });
    act(() => { champ().focus(); });
    await tourSuivant();
    expect(ouvertes()).toBe(true);
  });

  it('le démontage pendant l\'appui ne laisse ni minuterie ni écouteur', async () => {
    const ajout = vi.spyOn(document, 'addEventListener');
    const retrait = vi.spyOn(document, 'removeEventListener');
    // Blur clavier : une minuterie de repli, retirée au démontage (les autres minuteries du montage ne sont pas à nous : on compte l'écart).
    const un = render(<Banc />);
    act(() => { champ().focus(); });
    const base = vi.getTimerCount();
    act(() => { screen.getByTestId('ailleurs').focus(); });
    const pendant = vi.getTimerCount();
    expect(pendant).toBeGreaterThan(base);
    un.unmount();
    expect(vi.getTimerCount()).toBeLessThan(pendant);
    cleanup();
    // Souris tenue : un écouteur de fin d'appui, retiré au démontage.
    const { unmount } = render(<Banc />);
    act(() => { champ().focus(); });
    const ailleurs = screen.getByTestId('ailleurs');
    fireEvent.pointerDown(ailleurs, pointeur('mouse'));
    act(() => { ailleurs.focus(); });
    unmount();
    const posees = ajout.mock.calls.filter(([t]) => String(t).startsWith('pointer')).length;
    const otees = retrait.mock.calls.filter(([t]) => String(t).startsWith('pointer')).length;
    expect(otees).toBe(posees);
    expect(() => { fireEvent.pointerUp(document.body, pointeur('mouse')); vi.advanceTimersByTime(5); }).not.toThrow();
    ajout.mockRestore(); retrait.mockRestore();
  });
});
