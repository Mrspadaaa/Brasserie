import React, { useState } from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayMeasurements, measureScale } from '../../src/ui/BrewDayMeasurements';
import { departCurseur } from '../../src/domain/measureSlider';
import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

/**
 * VB-3 (10.11, « C'est toujours assez mauvaise le jour de brassage ») : Mesurer › Temp. à l'ébullition n'avait ni curseur (aucune cible),
 * ni champ visible (le CSS visait `input`, l'app rend un `textarea` au doigt). Ces tests échouent sur en-ligne/2026-11-10-fiches.
 */
const sansCibleRecette = { volumeL: 24 } as unknown as RecipeSnapshot; // ni OG visée, ni pré-ébullition, ni plan d'eau
const ebullition: BrewDayStep = { id: 'boil-0', label: 'Ébullition', durationMin: 60, boilElapsedMin: 0 };
const refroidi: BrewDayStep = { id: 'refroidissement', label: 'Refroidissement', durationMin: 0 };
const avantEbu: BrewDayStep = { id: 'preboil', label: 'Contrôle avant chauffe', durationMin: 0 };
const etat = (step: BrewDayStep): BrewDayState => ({ steps: [step], currentIndex: 0, readings: [] });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('measureScale : une échelle pour toute mesure, une bande seulement s’il y a une cible', () => {
  const sans = (kind: Parameters<typeof measureScale>[0], step: BrewDayStep, recipe = sansCibleRecette) => measureScale(kind, step, recipe)!;
  it('température : ~90–102 °C à l’ébullition, 10–30 °C refroidi, jamais de bande inventée', () => {
    const e = sans('temperature', ebullition);
    expect([e.min, e.max, e.cible]).toEqual([90, 102, false]);
    const r = sans('temperature', refroidi);
    expect([r.min, r.max, r.cible]).toEqual([10, 30, false]);
  });
  it('pH 4,8–6,0 · densité 1,000–1,120 · volume : jamais le fermenteur en repère (lot F, 13)', () => {
    const ph = sans('ph', avantEbu);
    expect([ph.min, ph.max, ph.cible]).toEqual([4.8, 6, false]);
    const d = sans('densite', refroidi);
    expect([d.min, d.max, d.cible]).toEqual([1, 1.12, false]);
    const v = sans('volume', ebullition);
    expect(v.cible).toBe(false);
    // Le 24 L de la recette est le volume au fermenteur, pas celui de l'ébullition : aucune cible d'étape, aucun repère.
    expect(v.milieu).not.toBe(24);
    expect(v.ticks).toEqual([v.min, v.max]);
  });
  it('rien d’inventé : sans recette, le volume garde une échelle large, jamais 0 en départ', () => {
    const v = measureScale('volume', ebullition, undefined)!;
    expect(v.cible).toBe(false);
    expect(v.milieu).toBeGreaterThan(0);
  });
  it('avec une cible, la bande reste (la température de consigne, ± 1 °C)', () => {
    const e = measureScale('temperature', { ...ebullition, tempC: 67 }, sansCibleRecette)!;
    expect(e.cible).toBe(true);
    expect([e.bandMin, e.bandMax]).toEqual([66, 68]);
  });
  it('un relevé hors de l’échelle l’étire', () => {
    const e = measureScale('temperature', ebullition, sansCibleRecette, 108)!;
    expect(e.max).toBeGreaterThan(108);
  });
  it('le pouce part du milieu de l’échelle, ou du dernier relevé', () => {
    const e = sans('temperature', ebullition);
    expect(departCurseur('temperature', e)).toBe(96);
    expect(departCurseur('temperature', e, 99.4)).toBe(99.4);
  });
});

function Feuille({ step, onState }: { step: BrewDayStep; onState?: (s: BrewDayState) => void }) {
  const [state, setState] = useState(etat(step));
  return <BrewDayMeasurements step={step} state={state} recipe={sansCibleRecette}
    update={(change) => setState((p) => { const n = change(p); onState?.(n); return n; })} />;
}
const ouvrir = (step: BrewDayStep, nom: string, onState?: (s: BrewDayState) => void) => {
  const r = render(<Feuille step={step} onState={onState} />);
  fireEvent.click(screen.getByRole('button', { name: nom }));
  return r;
};
const valeur = () => screen.getByRole('button', { name: 'Taper la valeur' });

describe('Mesurer sans cible : le curseur est là, à toute étape et pour toute mesure', () => {
  const CAS: Array<[string, BrewDayStep, string, string, string]> = [
    ['Température à l’ébullition', ebullition, 'Température', '90', '102'],
    ['Température au refroidi', refroidi, 'Température', '10', '30'],
    ['Densité au refroidi', refroidi, 'Densité', '1', '1.12'],
    ['pH avant chauffe', avantEbu, 'pH', '4.8', '6'],
    ['Volume à l’ébullition', ebullition, 'Volume', '', '']
  ];
  it.each(CAS)('%s : un role=slider, pouce en pointillé, aucune bande, Enregistrer grisé', (_n, step, onglet, min, max) => {
    const { container } = ouvrir(step, onglet);
    const s = screen.getByRole('slider', { name: new RegExp(onglet) }) as HTMLInputElement;
    expect(s.type).toBe('range');
    if (min) { expect(s.min).toBe(min); expect(s.max).toBe(max); }
    expect(container.querySelector('input[type="number"]')).toBeNull();
    expect(container.querySelector('.bz-pouce[data-vide]')).not.toBeNull();
    expect(container.querySelector('.bz-echelle-cible')).toBeNull();
    expect(screen.queryByText(/cible/, { selector: '.bz-ecart' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });
  it('toucher le pouce pose le milieu (96,0 °C à l’ébullition) ; rien ne part sans geste', () => {
    const onState = vi.fn();
    ouvrir(ebullition, 'Température', onState);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onState).not.toHaveBeenCalled();
    fireEvent.pointerUp(screen.getByRole('slider', { name: /Température/ }));
    expect(valeur()).toHaveTextContent('96,0');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const s = onState.mock.calls.at(-1)![0] as BrewDayState;
    expect(s.readings![0]).toMatchObject({ kind: 'temperature', value: 96, stepId: 'boil-0' });
  });
  it('glisser pose la valeur ; la valeur posée n’a ni « sous » ni « dans la cible » (aucune cible)', () => {
    ouvrir(ebullition, 'Température');
    fireEvent.change(screen.getByRole('slider', { name: /Température/ }), { target: { value: '98.3' } });
    expect(valeur()).toHaveTextContent('98,3');
    expect(screen.queryByText(/dans la cible|sous la cible|au-dessus de la cible/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });
  it('le dernier relevé de l’étape est le point de départ du pouce', () => {
    const onState = vi.fn();
    ouvrir(ebullition, 'Température', onState);
    fireEvent.change(screen.getByRole('slider', { name: /Température/ }), { target: { value: '99.1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Température' }));
    expect(screen.getByRole('slider', { name: /Température/ })).toHaveAttribute('aria-valuetext', expect.stringContaining('99,1'));
  });
  it('la valeur tapée (crayon) reste possible et Enregistrer suit la valeur', () => {
    ouvrir(ebullition, 'Température');
    fireEvent.click(valeur());
    const champ = screen.getByRole('textbox', { name: /Température/ });
    fireEvent.change(champ, { target: { value: '97,4' } });
    expect((screen.getByRole('slider', { name: /Température/ }) as HTMLInputElement).value).toBe('97.4');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });
});

describe('Le champ tapé, au doigt : ni coupé au bord, ni disparu (le téléphone rend un textarea)', () => {
  const css = readFileSync('src/pages/brew-day.css', 'utf8');
  it('toute règle `.bz-saisie input` couvre aussi le textarea que le téléphone rend', () => {
    const regles = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter((sel) => /\.bz-saisie[^,]*\binput\b/.test(sel));
    expect(regles.length).toBeGreaterThan(0);
    const sansTextarea = regles.filter((sel) => !/textarea/.test(sel));
    expect(sansTextarea).toEqual([]);
  });
  it('au doigt (pointer: coarse), le champ de la feuille est un textarea visible dans le DOM et suit la saisie', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({ matches: /pointer:\s*coarse/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as unknown as MediaQueryList);
    ouvrir(ebullition, 'Température');
    fireEvent.click(valeur());
    const champ = screen.getByRole('textbox', { name: /Température/ });
    expect(champ.tagName).toBe('TEXTAREA');
    expect(champ.closest('.bz-lecture')).toHaveAttribute('data-champ');
    fireEvent.change(champ, { target: { value: '96,5' } });
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });
});
