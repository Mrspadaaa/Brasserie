// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AppelMesure } from '../../src/ui/brassage/AppelMesure';
import { appelPalier } from '../../src/domain/appelMesure';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

const MIN = 60000;
const T0 = 1_700_000_000_000;
const palier: BrewDayStep = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0 };
const etat = (readings: BrewDayReading[] = [], step: BrewDayStep = palier): BrewDayState => ({ steps: [step], currentIndex: 0, readings });
const recette = { waterPlan: { targetPh: 5.3 } } as unknown as RecipeSnapshot;

afterEach(cleanup);

const monter = (opts: { readings?: BrewDayReading[]; step?: BrewDayStep; dans?: number } = {}) => {
  const step = opts.step ?? palier;
  const appel = appelPalier(step, etat(opts.readings, step), recette, T0 + (opts.dans ?? 5) * MIN)!;
  const onReleve = vi.fn();
  render(<AppelMesure appel={appel} onReleve={onReleve} />);
  return { onReleve, appel };
};

describe('la carte du palier (maquette pm1)', () => {
  it('montre, dans l’ordre de la maquette : la température à relever (proposée), le pH à 15′, Relever, Plus tard', () => {
    monter();
    expect(screen.getByText('Température du palier')).toBeTruthy();
    expect(screen.getByText(/à relever/)).toBeTruthy();
    expect(screen.getByText('67 °C')).toBeTruthy();
    expect(screen.getByText('proposé, à confirmer')).toBeTruthy();
    expect(screen.getByText('pH d’empâtage')).toBeTruthy();
    expect(screen.getByText(/à 15′/)).toBeTruthy();
    expect(screen.getByText('5,3')).toBeTruthy();
    expect(screen.getByText('cible 5,2 à 5,5')).toBeTruthy();
    const noms = screen.getAllByRole('button').map((b) => b.textContent);
    expect(noms).toEqual(['Relever', 'Plus tard']);
  });

  it('deux curseurs posés sur la cible, jamais un champ numérique (saisie mobile)', () => {
    monter();
    const curseurs = screen.getAllByRole('slider') as HTMLInputElement[];
    expect(curseurs).toHaveLength(2);
    expect(Number(curseurs[0].value)).toBeCloseTo(67, 5);
    expect(Number(curseurs[1].value)).toBeCloseTo(5.3, 5);
    expect(document.querySelector('input[type="number"]')).toBeNull();
  });

  it('« Relever » écrit la valeur proposée de la température ; le pH pas dû reste non noté', () => {
    const { onReleve } = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Relever' }));
    expect(onReleve).toHaveBeenCalledTimes(1);
    expect(onReleve).toHaveBeenCalledWith([{ kind: 'temperature', value: 67 }]);
  });

  it('un curseur touché : « Relever » écrit sa valeur, et « proposé, à confirmer » cède la place à l’écart', () => {
    const { onReleve } = monter();
    const [temp, ph] = screen.getAllByRole('slider');
    fireEvent.change(temp, { target: { value: '68.6' } });
    expect(screen.queryByText('proposé, à confirmer')).toBeNull();
    expect(screen.getByText('68,6 °C')).toBeTruthy();
    expect(screen.getByText(/\+1,6 au-dessus · cible 66 à 68/)).toBeTruthy();
    fireEvent.change(ph, { target: { value: '5.28' } });
    fireEvent.click(screen.getByRole('button', { name: 'Relever' }));
    expect(onReleve).toHaveBeenCalledWith([{ kind: 'temperature', value: 68.6 }, { kind: 'ph', value: 5.28 }]);
  });

  it('11 · pH dû, rien de posé, température déjà relevée : « Relever » est inactif et dit pourquoi ; un toucher sans déplacement ne change rien (frise B, R1), Entrée l’active', () => {
    const t: BrewDayReading = { id: 'r1', at: T0 + 3 * MIN, stepId: 'mash-1', kind: 'temperature', value: 67, unit: '°C' };
    const { onReleve } = monter({ readings: [t], dans: 16 });
    const releve = screen.getByRole('button', { name: 'Relever' }) as HTMLButtonElement;
    expect(releve.disabled).toBe(true);
    expect(screen.getByText(/glisse le curseur de pH sur ta mesure/i)).toBeTruthy();
    const ph = screen.getByRole('slider');
    fireEvent.pointerUp(ph);
    expect(releve.disabled).toBe(true);
    fireEvent.keyDown(ph, { key: 'Enter' });
    expect(releve.disabled).toBe(false);
    expect(screen.queryByText(/glisse le curseur de pH sur ta mesure/i)).toBeNull();
    fireEvent.click(releve);
    expect(onReleve).toHaveBeenCalledWith([{ kind: 'ph', value: 5.3 }]);
  });

  it('11 · un clic de lecteur d’écran (sans pointeur, detail 0) sur le curseur de pH compte aussi ; celui d’une souris non (R1)', () => {
    const t: BrewDayReading = { id: 'r1', at: T0 + 3 * MIN, stepId: 'mash-1', kind: 'temperature', value: 67, unit: '°C' };
    monter({ readings: [t], dans: 16 });
    fireEvent.click(screen.getByRole('slider'), { detail: 1 });
    expect((screen.getByRole('button', { name: 'Relever' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('slider'));
    expect((screen.getByRole('button', { name: 'Relever' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('« Plus tard » n’écrit rien, replie la carte en une ligne « à relever » ; « Relever » la rouvre', () => {
    const { onReleve } = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(onReleve).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(screen.getByText(/Température du palier/)).toBeTruthy();
    expect(screen.getByText(/à relever/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Relever/ }));
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(onReleve).not.toHaveBeenCalled();
  });

  it('pH dû (15 min passées) : sa carte dit « à relever » au lieu de « à 15′ »', () => {
    monter({ dans: 16 });
    expect(screen.queryByText(/à 15′/)).toBeNull();
    const cartePh = screen.getByText('pH d’empâtage').closest('[data-carte]') as HTMLElement;
    expect(within(cartePh).getByText(/à relever/)).toBeTruthy();
    expect(cartePh.getAttribute('data-due')).toBe('');
  });

  it('cible inconnue : « — », pas de valeur proposée, « Relever » désactivé tant que le curseur est intact', () => {
    const sans: BrewDayStep = { ...palier, tempC: undefined };
    const appel = appelPalier(sans, etat([], sans), { waterPlan: undefined } as unknown as RecipeSnapshot, T0 + MIN)!;
    const onReleve = vi.fn();
    render(<AppelMesure appel={appel} onReleve={onReleve} />);
    const carte = screen.getByText('Température du palier').closest('[data-carte]') as HTMLElement;
    expect(within(carte).getByText('—')).toBeTruthy();
    expect(within(carte).queryByText('proposé, à confirmer')).toBeNull();
    // le pH, lui, a la bande documentée par le code : « Relever » reste utilisable pour lui seulement s'il est dû ou touché
    expect((screen.getByRole('button', { name: 'Relever' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(within(carte).getByRole('slider'), { target: { value: '65' } });
    expect((screen.getByRole('button', { name: 'Relever' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('relevé fait : la carte dit « relevé » avec l’heure et la valeur, sans curseur ; les boutons restent tant que le pH reste à relever', () => {
    const t: BrewDayReading = { id: 'r1', at: T0 + 3 * MIN, stepId: 'mash-1', kind: 'temperature', value: 66.4, unit: '°C' };
    monter({ readings: [t] });
    const carte = screen.getByText('Température du palier').closest('[data-carte]') as HTMLElement;
    expect(within(carte).getByText(/relevé/)).toBeTruthy();
    expect(within(carte).getByText('66,4 °C')).toBeTruthy();
    expect(within(carte).queryByRole('slider')).toBeNull();
    expect(screen.getAllByRole('slider')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Relever' })).toBeTruthy();
  });

  it('tout est relevé : une ligne verte, plus de boutons', () => {
    const t: BrewDayReading = { id: 'r1', at: T0 + 3 * MIN, stepId: 'mash-1', kind: 'temperature', value: 66.4, unit: '°C' };
    const p: BrewDayReading = { id: 'r2', at: T0 + 16 * MIN, stepId: 'mash-1', kind: 'ph', value: 5.3, unit: '' };
    monter({ readings: [t, p], dans: 17 });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(screen.getByText('66,4 °C')).toBeTruthy();
    expect(screen.getByText('5,3')).toBeTruthy();
  });
});
