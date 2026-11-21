// @vitest-environment jsdom
// D393 A2 : le crochet d'appui long (seuil 450 ms, tolérance 6 px, clic fantôme avalé, équivalent clavier et clic droit).
import { createElement } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { APPUI_LONG_MS, TOLERANCE_PX, useAppuiLong, type InfoAppuiLong } from '../../src/ui/gestes/useAppuiLong';

beforeAll(() => {
  // jsdom n'a pas PointerEvent : une version minimale, pour que pointerId, pointerType et clientX arrivent au gestionnaire.
  if (typeof window.PointerEvent === 'undefined') {
    class PE extends MouseEvent {
      pointerId: number; pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 0; this.pointerType = init.pointerType ?? ''; }
    }
    (window as unknown as { PointerEvent: unknown }).PointerEvent = PE;
  }
});

const onLong = vi.fn<(cle: string, info: InfoAppuiLong) => void>();
const onTap = vi.fn();

function Tuile() {
  const lier = useAppuiLong<string>({ onAppuiLong: onLong });
  return createElement('button', { type: 'button', ...lier('33cl', onTap) }, '33 cl', createElement('span', { role: 'button', 'aria-label': 'Retirer un 33 cl' }, '−'));
}

const tuile = () => screen.getByText('33 cl', { selector: 'button' });
const doigt = { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 };

beforeEach(() => { vi.useFakeTimers(); onLong.mockReset(); onTap.mockReset(); render(createElement(Tuile)); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('useAppuiLong', () => {
  it('suit la méthode standard : ≈ 450 ms, 6 px', () => {
    expect(APPUI_LONG_MS).toBe(450);
    expect(TOLERANCE_PX).toBe(6);
  });

  it('un toucher bref ajoute (onToucher), sans appui long', () => {
    fireEvent.pointerDown(tuile(), doigt);
    vi.advanceTimersByTime(150);
    fireEvent.pointerUp(tuile(), doigt);
    fireEvent.click(tuile(), { detail: 1 });
    vi.advanceTimersByTime(1000);
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onLong).not.toHaveBeenCalled();
  });

  it('tenu 450 ms : appui long une fois, et le clic du lâcher est avalé (pas de +1 fantôme)', () => {
    fireEvent.pointerDown(tuile(), doigt);
    vi.advanceTimersByTime(APPUI_LONG_MS - 1);
    expect(onLong).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onLong).toHaveBeenCalledTimes(1);
    expect(onLong.mock.calls[0][0]).toBe('33cl');
    expect(onLong.mock.calls[0][1].clavier).toBe(false);
    // Chrome émet aussi contextmenu vers 500 ms : empêché, sans second déclenchement.
    const menu = fireEvent.contextMenu(tuile());
    expect(menu).toBe(false);
    fireEvent.pointerUp(tuile(), doigt);
    fireEvent.click(tuile(), { detail: 1 });
    expect(onTap).not.toHaveBeenCalled();
    expect(onLong).toHaveBeenCalledTimes(1);
    // Le toucher suivant ajoute de nouveau.
    fireEvent.pointerDown(tuile(), doigt); fireEvent.pointerUp(tuile(), doigt); fireEvent.click(tuile(), { detail: 1 });
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('le doigt qui bouge de plus de 6 px annule (défilement) ; 5 px ne l\'annule pas', () => {
    fireEvent.pointerDown(tuile(), doigt);
    fireEvent.pointerMove(tuile(), { ...doigt, clientX: 100 + TOLERANCE_PX + 1 });
    vi.advanceTimersByTime(1000);
    expect(onLong).not.toHaveBeenCalled();
    fireEvent.pointerUp(tuile(), doigt);

    fireEvent.pointerDown(tuile(), doigt);
    fireEvent.pointerMove(tuile(), { ...doigt, clientX: 103, clientY: 104 });
    vi.advanceTimersByTime(APPUI_LONG_MS);
    expect(onLong).toHaveBeenCalledTimes(1);
  });

  it('lâché ou repris par le navigateur avant 450 ms : rien', () => {
    fireEvent.pointerDown(tuile(), doigt); vi.advanceTimersByTime(300); fireEvent.pointerCancel(tuile(), doigt);
    fireEvent.pointerDown(tuile(), doigt); vi.advanceTimersByTime(300); fireEvent.pointerUp(tuile(), doigt);
    vi.advanceTimersByTime(1000);
    expect(onLong).not.toHaveBeenCalled();
  });

  it('équivalent clavier : Maj+F10 et la touche Menu ; Entrée garde le toucher simple', () => {
    expect(tuile().getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
    fireEvent.keyDown(tuile(), { key: 'F10', shiftKey: true });
    expect(onLong).toHaveBeenCalledTimes(1);
    expect(onLong.mock.calls[0][1].clavier).toBe(true);
    // Le contextmenu que la touche émet ensuite ne redéclenche pas.
    fireEvent.contextMenu(tuile());
    expect(onLong).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1500);
    fireEvent.keyDown(tuile(), { key: 'ContextMenu' });
    expect(onLong).toHaveBeenCalledTimes(2);
    fireEvent.click(tuile(), { detail: 0 }); // Entrée ou Espace sur un bouton
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('à la souris, le clic droit vaut l\'appui long ; le bouton droit ne lance pas la minuterie', () => {
    fireEvent.pointerDown(tuile(), { ...doigt, pointerType: 'mouse', button: 2 });
    vi.advanceTimersByTime(1000);
    expect(onLong).not.toHaveBeenCalled();
    fireEvent.contextMenu(tuile());
    expect(onLong).toHaveBeenCalledTimes(1);
    fireEvent.click(tuile(), { detail: 1 });
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('le « − » posé dans la tuile garde son geste : l\'appui n\'y commence pas', () => {
    const moins = screen.getByLabelText('Retirer un 33 cl');
    fireEvent.pointerDown(moins, doigt);
    vi.advanceTimersByTime(1000);
    expect(onLong).not.toHaveBeenCalled();
  });

  it('démonté pendant l\'appui : la minuterie est arrêtée', () => {
    fireEvent.pointerDown(tuile(), doigt);
    cleanup();
    vi.advanceTimersByTime(1000);
    expect(onLong).not.toHaveBeenCalled();
  });
});
