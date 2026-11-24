// @vitest-environment jsdom
/**
 * Voie ecr-saisie (reprise du soir, 23.11) : les sept constats du test en ligne des écritures (E35-4, 5, 7, 8, 11, 12, 14).
 * Fixtures simulées ; la preuve en ligne revient au pilote.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { ChoixDate } from '../../src/ui/ChoixDate';

const LARGEUR = 300;
const J = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const ajouter = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

const souris = (type: string, x: number) => new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button: 0 });
function piste(): HTMLElement { return document.querySelector<HTMLElement>('.cal-f-duree-piste')!; }
/** Un glisser : poser en `x0`, passer par chaque `x`, lâcher. `entre` rend ce que la pastille (onBrouillon) dit à chaque pas. */
function glisser(x0: number, xs: number[]) {
  const el = piste();
  act(() => { el.dispatchEvent(souris('pointerdown', x0)); });
  for (const x of xs) act(() => { el.dispatchEvent(souris('pointermove', x)); });
}
const lacher = (x: number) => act(() => { piste().dispatchEvent(souris('pointerup', x)); });

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ left: 0, top: 0, right: LARGEUR, bottom: 40, width: LARGEUR, height: 40, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect);
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => LARGEUR });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function monter(extra: Partial<React.ComponentProps<typeof ChoixDate>> = {}) {
  const vus: string[] = [], ecrits: string[] = [];
  const Cadre = () => {
    const [v, setV] = React.useState(J);
    return React.createElement(ChoixDate, { ouvert: true, valeur: v, label: 'Date', max: J, rangee: 'achats', onBrouillon: (d: string) => vus.push(d), onChange: (d: string) => { ecrits.push(d); setV(d); }, ...extra });
  };
  render(React.createElement(Cadre));
  return { vus, ecrits };
}

describe('E35-4 / E35-8 : la date lâchée est celle que la pastille montrait', () => {
  it('vers le passé : la dernière date montrée au doigt est celle qu’on écrit', () => {
    const { vus, ecrits } = monter();
    glisser(150, [140, 120, 100, 90, 85]);
    lacher(85);
    expect(vus.length).toBeGreaterThan(0);
    expect(ecrits).toHaveLength(1);
    expect(ecrits[0]).toBe(vus[vus.length - 1]);
    expect(ecrits[0] < J).toBe(true);
  });
  it('doigt tenu au bord gauche (la frise défile seule) : au lâcher, la date écrite est la dernière montrée, pas une autre', async () => {
    const { vus, ecrits } = monter({ saisie: true });
    glisser(150, [120, 60, 20]);
    await act(async () => { await new Promise(r => setTimeout(r, 400)); });
    lacher(20);
    expect(ecrits).toHaveLength(1);
    expect(ecrits[0]).toBe(vus[vus.length - 1]);
  });
  it('vers l’avant : la pastille ne dépasse pas la borne (aujourd’hui), elle ne montre jamais un jour qu’on ne peut pas écrire', () => {
    const { vus, ecrits } = monter({ saisie: true });
    glisser(150, [170, 200, 230, 250]);
    lacher(250);
    expect(vus.every(d => d <= J)).toBe(true);
    expect(ecrits.every(d => d <= J)).toBe(true);
  });
});

describe('E35-14 : toucher la piste pose la date', () => {
  it('à droite du curseur : sans option, un toucher ne pose rien (R1 des autres écrans)', () => {
    const { ecrits } = monter({ saisie: false, max: ajouter(J, 400) });
    const el = piste();
    act(() => { el.dispatchEvent(souris('pointerdown', 220)); el.dispatchEvent(souris('pointerup', 220)); el.dispatchEvent(souris('click', 220)); });
    expect(ecrits).toHaveLength(0);
  });
  it('avec toucherPose : le jour touché devient la date (au-delà de la borne, la borne)', () => {
    const { ecrits } = monter({ saisie: true, max: ajouter(J, 400) });
    const el = piste();
    act(() => { el.dispatchEvent(souris('pointerdown', 220)); el.dispatchEvent(souris('pointerup', 220)); el.dispatchEvent(souris('click', 220)); });
    expect(ecrits).toHaveLength(1);
    expect(ecrits[0] > J).toBe(true);
  });
  it('à gauche du curseur : un jour passé', () => {
    const { ecrits } = monter({ saisie: true });
    const el = piste();
    act(() => { el.dispatchEvent(souris('pointerdown', 40)); el.dispatchEvent(souris('pointerup', 40)); el.dispatchEvent(souris('click', 40)); });
    expect(ecrits).toHaveLength(1);
    expect(ecrits[0] < J).toBe(true);
  });
});
