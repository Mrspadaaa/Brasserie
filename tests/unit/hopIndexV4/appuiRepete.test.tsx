// @vitest-environment jsdom
// s2-sources-une-fois, D173 (26.10) : « Aussi ajouter des gramme de houblons, un appui long doit en ajouter en continu. »
// Les boutons − et + des grammes d'un ajout : un toucher court = un seul pas ; un appui long répète le pas, de plus en plus vite après
// 0,5 s ; il s'arrête au relâché ou quand le doigt sort du bouton ; la borne (0 g) arrête la répétition. Timers simulés, aucune donnée réelle.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import { ACCELERATION, DELAI_REPETITION, PAS_LENT, PAS_RAPIDE, useAppuiRepete } from '../../../src/ui/hopIndex/maBiere/appuiRepete';

/** Un compteur de grammes comme la carte : pas de 2 g, 0 g au minimum, valeur lue dans une réserve (Carte.tsx, `doser`). */
function Grammes({ depart }: { depart: number }) {
  const [g, setG] = useState(depart);
  const courant = useRef(g); courant.current = g;
  const doser = (d: number): boolean => {
    const s = Math.max(0, Math.round((courant.current + d) * 10) / 10);
    if (s === courant.current) return false;
    courant.current = s; setG(s);
    return true;
  };
  const moins = useAppuiRepete(() => doser(-2));
  const plus = useAppuiRepete(() => doser(2));
  return (
    <div>
      <button type="button" data-testid="moins" {...moins}>−</button>
      <output data-testid="g">{g}</output>
      <button type="button" data-testid="plus" {...plus}>+</button>
    </div>
  );
}

const lire = (c: HTMLElement) => Number(c.querySelector('[data-testid="g"]')!.textContent);
const bouton = (c: HTMLElement, id: string) => c.querySelector(`[data-testid="${id}"]`) as HTMLElement;
const avancer = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('appui long sur les grammes', () => {
  it('un toucher court ajoute un seul pas', () => {
    const { container } = render(<Grammes depart={10} />);
    const b = bouton(container, 'plus');
    fireEvent.pointerDown(b); avancer(120); fireEvent.pointerUp(b); fireEvent.click(b);
    avancer(3000);
    expect(lire(container)).toBe(12);
  });

  it('un appui de 1,5 s ajoute plusieurs pas, le clic final n\'en ajoute pas un de plus', () => {
    const { container } = render(<Grammes depart={10} />);
    const b = bouton(container, 'plus');
    fireEvent.pointerDown(b);
    avancer(DELAI_REPETITION - 10);
    expect(lire(container)).toBe(10); // rien avant 0,5 s
    avancer(1500 - DELAI_REPETITION + 10);
    const apres = lire(container);
    expect(apres).toBeGreaterThanOrEqual(10 + 2 * 5); // au moins cinq pas en 1 s de répétition
    fireEvent.pointerUp(b); fireEvent.click(b);
    expect(lire(container)).toBe(apres);
    avancer(2000);
    expect(lire(container)).toBe(apres); // arrêtée au relâché
  });

  it('la répétition accélère', () => {
    const { container } = render(<Grammes depart={0} />);
    const b = bouton(container, 'plus');
    fireEvent.pointerDown(b);
    avancer(DELAI_REPETITION + 1);
    const t0 = lire(container);
    avancer(PAS_LENT * 4);
    const lent = lire(container) - t0;
    // Bien plus tard, le pas est au plus rapide : plus de pas dans la même durée.
    avancer(PAS_LENT * 10);
    const t1 = lire(container);
    avancer(PAS_LENT * 4);
    const vite = lire(container) - t1;
    expect(vite).toBeGreaterThan(lent);
    expect(PAS_LENT - ACCELERATION * 20).toBeLessThan(PAS_RAPIDE + 1);
  });

  it('s\'arrête quand le doigt sort du bouton', () => {
    const { container } = render(<Grammes depart={10} />);
    const b = bouton(container, 'plus');
    b.getBoundingClientRect = () => ({ left: 0, right: 30, top: 0, bottom: 30, width: 30, height: 30, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(b);
    avancer(DELAI_REPETITION + 700);
    fireEvent.pointerMove(b, { clientX: 15, clientY: 15 });
    const dedans = lire(container);
    expect(dedans).toBeGreaterThan(10);
    fireEvent.pointerMove(b, { clientX: 90, clientY: 15 });
    avancer(2000);
    expect(lire(container)).toBe(dedans);
  });

  it('− garde sa borne : 0 g au minimum, la répétition s\'y arrête', () => {
    const { container } = render(<Grammes depart={7} />);
    const b = bouton(container, 'moins');
    fireEvent.pointerDown(b);
    avancer(DELAI_REPETITION + 4000);
    expect(lire(container)).toBe(0);
    fireEvent.pointerUp(b); fireEvent.click(b);
    expect(lire(container)).toBe(0);
  });

  it('au clavier, un clic = un pas', () => {
    const { container } = render(<Grammes depart={10} />);
    fireEvent.click(bouton(container, 'plus'));
    fireEvent.click(bouton(container, 'plus'));
    expect(lire(container)).toBe(14);
  });
});
