import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewDayMeasurements } from '../../src/ui/BrewDayMeasurements';
import { BrewReadingsSummary } from '../../src/ui/BrewReadingsSummary';
import { mesuresAttendues } from '../../src/domain/brewMeasures';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

const T0 = 1_700_000_000_000;
const palier: BrewDayStep = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0 };
const recette = { ogTarget: 1.062, volumeL: 24 } as unknown as RecipeSnapshot;
const vide = (readings: BrewDayReading[] = []): BrewDayState => ({ steps: [palier], currentIndex: 0, readings });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Feuille({ initial = vide(), onState }: { initial?: BrewDayState; onState?: (s: BrewDayState) => void }) {
  const [state, setState] = useState(initial);
  return <BrewDayMeasurements step={palier} state={state} recipe={recette}
    update={(change) => setState((p) => { const n = change(p); onState?.(n); return n; })} />;
}
const curseur = () => screen.getByRole('slider', { name: /Température/ });
// Le palier mash-1 ouvre Mesurer sur le pH (mesure par défaut) : la température est un onglet à toucher.
const rendreTemp = (props: Parameters<typeof Feuille>[0] = {}) => {
  const r = render(<Feuille {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Température' }));
  return r;
};
const enregistrer = () => screen.getByRole('button', { name: 'Enregistrer' });

describe('Mesurer : le curseur sur l’échelle cible, geste principal', () => {
  it('a un curseur (role slider) sur l’échelle de la cible, sans type="number", et rien n’est posé au départ', () => {
    const { container } = rendreTemp();
    const s = curseur() as HTMLInputElement;
    expect(s.type).toBe('range');
    expect(container.querySelector('input[type="number"]')).toBeNull();
    expect(s.min).toBe('61'); expect(s.max).toBe('73'); expect(s.step).toBe('0.1');
    expect(enregistrer()).toBeDisabled();
    expect(container.querySelector('.bz-pouce[data-vide]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('?');
  });
  it('un toucher sur le pouce (sans le bouger) pose la cible 67,0 et active Enregistrer', () => {
    const { container } = rendreTemp();
    fireEvent.pointerUp(curseur());
    expect(enregistrer()).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('67,0');
    expect(container.querySelector('.bz-pouce[data-vide]')).toBeNull();
  });
  it('un geste sur la piste pose la valeur ; hors cible, l’écart est dit', () => {
    rendreTemp();
    fireEvent.change(curseur(), { target: { value: '65.2' } });
    expect(screen.getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('65,2');
    expect(screen.getByText(/sous/, { selector: 'span' })).toHaveTextContent('−0,8 sous la cible 66–68 °C');
    expect(enregistrer()).toBeEnabled();
  });
  it('±0,1 : le premier pas part de la cible, puis de la valeur posée', () => {
    rendreTemp();
    fireEvent.click(screen.getByRole('button', { name: 'plus 0,1' }));
    expect(screen.getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('67,1');
    fireEvent.click(screen.getByRole('button', { name: 'moins 0,1' }));
    fireEvent.click(screen.getByRole('button', { name: 'moins 0,1' }));
    expect(screen.getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('66,9');
  });
  it('Entrée au clavier sur le pouce pose la valeur, comme un toucher', () => {
    rendreTemp();
    fireEvent.keyDown(curseur(), { key: 'Enter' });
    expect(enregistrer()).toBeEnabled();
  });
  it('Enregistrer écrit la valeur posée au journal, en nombre (virgule décimale à l’affichage)', () => {
    const onState = vi.fn();
    rendreTemp({ onState });
    fireEvent.change(curseur(), { target: { value: '66.4' } });
    fireEvent.click(enregistrer());
    const s = onState.mock.calls.at(-1)![0] as BrewDayState;
    expect(s.readings).toHaveLength(1);
    expect(s.readings![0]).toMatchObject({ kind: 'temperature', value: 66.4, stepId: 'mash-1' });
  });
  it('jamais une valeur enregistrée sans geste', () => {
    const onState = vi.fn();
    rendreTemp({ onState });
    fireEvent.click(enregistrer());
    expect(onState).not.toHaveBeenCalled();
  });
  it('la valeur tapée reste possible (crayon), et le curseur la suit', () => {
    rendreTemp();
    fireEvent.click(screen.getByRole('button', { name: 'Taper la valeur' }));
    const champ = screen.getByRole('textbox', { name: /Température/ });
    expect(champ).toHaveAttribute('inputmode', 'decimal');
    expect(champ).not.toHaveAttribute('type', 'number');
    fireEvent.change(champ, { target: { value: '68,3' } });
    expect((curseur() as HTMLInputElement).value).toBe('68.3');
  });
  it('« Pourquoi maintenant » s’ouvre à un toucher', () => {
    rendreTemp();
    const b = screen.getByRole('button', { name: /Pourquoi maintenant/ });
    expect(b).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(b);
    expect(b).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/se juge à cœur/)).toBeVisible();
  });
  it('le pH a son curseur 5 à 5,8 au pas de 0,01', () => {
    render(<Feuille />);
    fireEvent.click(screen.getByRole('button', { name: 'pH' }));
    const s = screen.getByRole('slider', { name: /pH/ }) as HTMLInputElement;
    expect(s.min).toBe('5'); expect(s.max).toBe('5.8'); expect(s.step).toBe('0.01');
    fireEvent.pointerUp(s);
    expect(screen.getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('5,35');
  });
  it('sans cible documentée (pH hors empâtage), le curseur vient des bornes plausibles, sans bande (VB-3, c2)', () => {
    const autre: BrewDayStep = { id: 'whirlpool', label: 'Whirlpool', durationMin: 15 };
    const { container } = render(<BrewDayMeasurements step={autre} state={{ steps: [autre], currentIndex: 0, readings: [] }} recipe={recette} update={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'pH' }));
    const s = screen.getByRole('slider') as HTMLInputElement;
    expect([s.min, s.max]).toEqual(['4.8', '6']);
    expect(container.querySelector('.bz-echelle-cible')).toBeNull();
  });
});

describe('Relevés du jour : la case « ? » de chaque mesure attendue', () => {
  const rendre = (state: BrewDayState, onMeasure = vi.fn()) => {
    const attendues = mesuresAttendues(palier, state, recette, T0 + 12 * 60000);
    render(<BrewReadingsSummary state={state} step={palier} recipe={recette} attendues={attendues} onMeasure={onMeasure} />);
    return onMeasure;
  };
  it('à vide : une case « ? » par mesure attendue, avec sa cible et son moment', () => {
    rendre(vide());
    const maische = screen.getByRole('button', { name: /Relever Maische/ });
    expect(maische).toHaveTextContent('?');
    expect(within(maische.closest('.bz-row') as HTMLElement).getByText(/cible/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Relever pH d’empâtage/ })).toHaveTextContent('?');
    expect(screen.getByText('0/2')).toBeInTheDocument();
  });
  it('toucher la case ouvre Mesurer sur le bon onglet', () => {
    const onMeasure = rendre(vide());
    fireEvent.click(screen.getByRole('button', { name: /Relever pH d’empâtage/ }));
    expect(onMeasure).toHaveBeenCalledWith('ph');
    fireEvent.click(screen.getByRole('button', { name: /Relever Maische/ }));
    expect(onMeasure).toHaveBeenLastCalledWith('temperature');
  });
  it('après le relevé : la valeur est dans la ligne, avec « dans la cible », et le compte avance', () => {
    const r: BrewDayReading = { id: 'r1', at: T0 + 11 * 60000, stepId: 'mash-1', kind: 'temperature', value: 66.4, unit: '°C' };
    rendre(vide([r]));
    const ligne = screen.getByRole('button', { name: /Corriger Maische/ });
    expect(ligne).toHaveTextContent('66,4');
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Relever pH d’empâtage/ })).toHaveTextContent('?');
    expect(within(screen.getByLabelText('Relevés de cette étape')).getByText("dans la cible")).toBeInTheDocument();
  });
});
