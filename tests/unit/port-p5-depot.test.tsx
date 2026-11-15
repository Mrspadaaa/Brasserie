// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { jjmm } from '../../src/ui/production/fiche/PostFiche';
import { StageLadder } from '../../src/ui/production/fiche/StageLadder';

// jsdom n'a pas PointerEvent : une sous-classe de MouseEvent garde clientX/clientY.
beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class PE extends MouseEvent { pointerId: number; constructor(t: string, i: PointerEventInit = {}) { super(t, i); this.pointerId = i.pointerId ?? 1; } }
    (window as unknown as { PointerEvent: unknown }).PointerEvent = PE;
  }
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); delete (document as { elementsFromPoint?: unknown }).elementsFromPoint; });

const batch = { id: 'ZZ-T', name: 'ZZ test', style: 'Pils', status: 'garde', volumeBrewedL: '20', og: '1.050', fg: '1.010' } as unknown as Batch;
const rendre = () => render(<StageLadder batch={batch} now={Date.UTC(2026, 10, 14, 10)} kegs={[]} onClose={() => {}} onAvancer={vi.fn()} onConditionner={vi.fn()} onRetour={vi.fn()} onAbandonner={vi.fn()} />);

describe('port p5 : e4c n° 3, le dépôt du palet glissable', () => {
  it('le palet refuse le glissement de la feuille (Vaul) : sinon elle se ferme sous le doigt', () => {
    rendre();
    expect(screen.getByLabelText(/Palet d’étape/).hasAttribute('data-vaul-no-drag')).toBe(true);
  });

  it('relâché sur la bande Abandonner : la confirmation s’ouvre, l’acte n’est pas fait', () => {
    rendre();
    const bande = document.querySelector('[data-depot="abandon"]') as HTMLElement;
    expect(bande).not.toBeNull();
    document.elementsFromPoint = () => [bande];
    const palet = screen.getByLabelText(/Palet d’étape/);
    fireEvent.pointerDown(palet, { clientX: 20, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(palet, { clientX: 20, clientY: 160, pointerId: 1 });
    fireEvent.pointerUp(palet, { clientX: 20, clientY: 400, pointerId: 1 });
    expect(screen.getByRole('button', { name: 'Garder le lot' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abandonner' })).toBeTruthy();
  });

  it('un déplacement sous 8 px reste un toucher : pas de dépôt', () => {
    rendre();
    const bande = document.querySelector('[data-depot="abandon"]') as HTMLElement;
    document.elementsFromPoint = () => [bande];
    const palet = screen.getByLabelText(/Palet d’étape/);
    fireEvent.pointerDown(palet, { clientX: 20, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(palet, { clientX: 20, clientY: 104, pointerId: 1 });
    fireEvent.pointerUp(palet, { clientX: 20, clientY: 104, pointerId: 1 });
    expect(screen.queryByRole('button', { name: 'Garder le lot' })).toBeNull();
  });
});

describe('port p5 : e2a, la date du brassage', () => {
  it('jjmm lit une date ISO (brewDate) comme une date suisse', () => {
    expect(jjmm('2026-09-01')).toBe('01.09');
    expect(jjmm('31.08.2026')).toBe('31.08');
  });
});
