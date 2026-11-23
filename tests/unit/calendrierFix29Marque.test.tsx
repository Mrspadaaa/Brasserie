// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChoseCalendrier } from '../../src/domain/calendrier';
import { Marque } from '../../src/ui/calendrier/frise/Marque';
import { APPUI_LONG_MS } from '../../src/ui/calendrier/frise/usePointeur';

/* T29-3 / T28-16 (23.11, test en ligne) : tenir une barre ne change jamais l'échelle. Une petite marque (3 mois, 6 mois, An) tenue 500 ms
   ouvrait les 6 semaines : la fenêtre passait de 6 mois à 6 sem. sous le doigt, le pas du glisser se relisait dans une autre géométrie et
   l'événement se posait une semaine plus tôt. Tenue, elle n'appelle plus que le menu. */

const chose = { id: 'c1', rangee: 'activites', titre: 'ZZ TEST — barre', debut: '2026-11-23', fin: '2026-11-23', source: { genre: 'creative', id: 'c1' }, deplacable: true } as unknown as ChoseCalendrier;

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('T29-3 : tenir une marque', () => {
  it('l’appui long n’appelle jamais les 6 semaines (échelle inchangée) ; il ouvre le menu quand il existe', () => {
    vi.useFakeTimers();
    const sixSemaines = vi.fn(), menu = vi.fn();
    const { container } = render(<Marque chose={chose} centre={14} haut={0} largeurColonne={14} bornes={[-1, 5]} onToucher={vi.fn()} onSixSemaines={sixSemaines} onAppuiLong={menu} />);
    const bouton = container.querySelector('[data-marque]') as HTMLElement;
    fireEvent.pointerDown(bouton, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10, button: 0 });
    act(() => { vi.advanceTimersByTime(APPUI_LONG_MS + 50); });
    expect(sixSemaines).not.toHaveBeenCalled();
    expect(menu).toHaveBeenCalledTimes(1);
  });
  it('sans menu (une marque qui ne se glisse pas), tenue : rien ne change non plus', () => {
    vi.useFakeTimers();
    const sixSemaines = vi.fn();
    const { container } = render(<Marque chose={chose} centre={14} haut={0} largeurColonne={14} onToucher={vi.fn()} onSixSemaines={sixSemaines} />);
    const bouton = container.querySelector('[data-marque]') as HTMLElement;
    fireEvent.pointerDown(bouton, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10, button: 0 });
    act(() => { vi.advanceTimersByTime(APPUI_LONG_MS + 50); });
    expect(sixSemaines).not.toHaveBeenCalled();
  });
});
