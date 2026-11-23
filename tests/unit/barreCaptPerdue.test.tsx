// @vitest-environment jsdom
/**
 * L-1 (T10-1, tour 10, bloquant) : une barre de la frise menée au bord gauche restait accrochée après le lever. Le navigateur a perdu la capture
 * du pointeur PENDANT le geste (journal M5 : `lostpointercapture` à x ≈ 23-29), puis le `pointerup` est tombé sur la rangée (`.cal-lane`) : la
 * barre n'écoutait que ses propres `pointerup` et `pointercancel`, le geste ne finissait jamais et le défilement au bord (rAF) continuait seul.
 * Règle : frise B R10 (le lâcher pose ou annule, toujours) ; méthode standard : écouter la fin du pointeur au niveau de la fenêtre pendant le geste.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { usePointeur } from '../../src/ui/calendrier/frise/usePointeur';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
});

function Banc({ onLache, defile, onGlisse }: { onLache: (k: number, annule: boolean) => void; defile: () => number; onGlisse?: (k: number) => void }) {
  const g = usePointeur({ largeurColonne: 50, borne: () => [-10, 10], marge: [20, 20], defile, onLacheGlisse: onLache, onGlisse });
  return <div data-frise=""><div data-testid="barre" {...g}>lol</div></div>;
}

const P = { clientY: 10, pointerId: 7, button: 0, pointerType: 'touch' };

function glisserAuBord(b: Element) {
  fireEvent.pointerDown(b, { ...P, clientX: 160 });
  for (const x of [140, 100, 60, 30, 10, 5]) fireEvent.pointerMove(b, { ...P, clientX: x });
}

describe('L-1 : la barre lâchée hors d\'elle (capture perdue) finit son geste', () => {
  it('capture perdue puis lever sur une autre pièce : le geste est lâché une fois, le défilement s\'arrête', () => {
    const onLache = vi.fn(), defile = vi.fn(() => 1);
    render(<Banc onLache={onLache} defile={defile} />);
    const b = screen.getByTestId('barre');
    glisserAuBord(b);
    act(() => { vi.advanceTimersByTime(400); });
    expect(defile, 'le doigt au bord défile').toHaveBeenCalled();
    fireEvent(b, new PointerEvent('lostpointercapture', { ...P, bubbles: true }));
    fireEvent.pointerUp(document.body, { ...P, clientX: 5 });
    expect(onLache).toHaveBeenCalledTimes(1);
    expect(onLache.mock.calls[0][1], 'un lâcher, pas une annulation').toBe(false);
    const n = defile.mock.calls.length;
    act(() => { vi.advanceTimersByTime(1000); });
    expect(defile.mock.calls.length, 'plus aucun défilement après le lever').toBe(n);
  });

  it('capture perdue : le doigt qui bouge encore ailleurs mène toujours la barre', () => {
    const onLache = vi.fn(), onGlisse = vi.fn();
    render(<Banc onLache={onLache} defile={() => false} onGlisse={onGlisse} />);
    const b = screen.getByTestId('barre');
    fireEvent.pointerDown(b, { ...P, clientX: 160 });
    fireEvent.pointerMove(b, { ...P, clientX: 140 });
    fireEvent(b, new PointerEvent('lostpointercapture', { ...P, bubbles: true }));
    fireEvent.pointerMove(document.body, { ...P, clientX: 60 });
    expect(onGlisse).toHaveBeenLastCalledWith(-2, -100);
    fireEvent.pointerUp(document.body, { ...P, clientX: 60 });
    expect(onLache).toHaveBeenCalledWith(-2, false);
  });

  it('pointercancel hors de la barre : le geste est annulé', () => {
    const onLache = vi.fn(), defile = vi.fn(() => 1);
    render(<Banc onLache={onLache} defile={defile} />);
    glisserAuBord(screen.getByTestId('barre'));
    fireEvent.pointerCancel(document.body, { ...P, clientX: 5 });
    expect(onLache).toHaveBeenCalledTimes(1);
    expect(onLache.mock.calls[0][1]).toBe(true);
  });

  it('lever sur la barre elle-même : un seul lâcher (pas de double fin par la fenêtre)', () => {
    const onLache = vi.fn();
    render(<Banc onLache={onLache} defile={() => false} />);
    const b = screen.getByTestId('barre');
    fireEvent.pointerDown(b, { ...P, clientX: 160 });
    fireEvent.pointerMove(b, { ...P, clientX: 100 });
    fireEvent.pointerUp(b, { ...P, clientX: 100 });
    expect(onLache).toHaveBeenCalledTimes(1);
  });
});
