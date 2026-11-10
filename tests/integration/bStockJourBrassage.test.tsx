// Mission levure-port, voie b-stock (09.11) : bugs du jour de brassage rejoués sur HEAD.
import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayMeasurements } from '../../src/ui/BrewDayMeasurements';
import { BrewJournal } from '../../src/ui/BrewJournal';
import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

const step: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
function Harness({ onState }: { onState: (s: BrewDayState) => void }) {
  const [state, setState] = useState<BrewDayState>({ steps: [step], currentIndex: 0, readings: [] });
  return (
    <BrewDayMeasurements
      step={step}
      state={state}
      update={(f) => setState((p) => { const n = f(p); onState(n); return n; })}
    />
  );
}
afterEach(() => cleanup());

describe('BR-51 / BE-32 : un relevé de volume absurde n’entre pas au journal', () => {
  it('« 99999 » L : Noter éteint, la borne est dite, rien n’est écrit', () => {
    let last: BrewDayState | undefined;
    render(<Harness onState={(s) => { last = s; }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Volume' }));
    const champ = screen.getByLabelText(/Volume \(L\)/);
    fireEvent.change(champ, { target: { value: '99999' } });
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(screen.getByText(/Saisis 0,1 à 2000 L\./)).toBeInTheDocument();
    fireEvent.submit(champ.closest('form')!);
    expect(last).toBeUndefined();
    expect(screen.queryByText(/ajouté au journal/)).toBeNull();
  });
});

describe('BR-60 / BE-41 : « Exporter .txt » sur un journal vide', () => {
  const recipe = { id: 'R1', name: 'Essai', fermentables: [], hops: [] } as unknown as RecipeSnapshot;
  const etat = (extra: Partial<BrewDayState> = {}): BrewDayState => ({ steps: [step], currentIndex: 0, readings: [], ...extra });
  it('éteint et expliqué quand il n’y a aucune entrée', () => {
    render(<BrewJournal state={etat()} recipe={recipe} update={() => {}} />);
    expect(screen.getByText('Aucune entrée')).toBeInTheDocument();
    const bouton = screen.getByRole('button', { name: /Exporter \.txt/ });
    expect(bouton).toBeDisabled();
    expect(bouton).toHaveAttribute('title', expect.stringMatching(/Rien à exporter/));
  });
  it('actif dès qu’une mesure est consignée', () => {
    const lecture = { id: 'r1', at: 1000, stepId: 'ensemencement', kind: 'volume', value: 20, unit: 'L', roomTemp: false } as const;
    render(<BrewJournal state={etat({ readings: [lecture as never] })} recipe={recipe} update={() => {}} />);
    expect(screen.getByRole('button', { name: /Exporter \.txt/ })).toBeEnabled();
  });
});

describe('BE-37 / BR-56 : la virgule dans les mesures et le journal', () => {
  const recipe = { id: 'R1', name: 'Essai', fermentables: [], hops: [] } as unknown as RecipeSnapshot;
  const lecture = { id: 'r1', at: 1000, stepId: 'ensemencement', kind: 'volume', value: 2.5, unit: 'L', roomTemp: false } as never;
  const etat: BrewDayState = { steps: [step], currentIndex: 0, readings: [lecture] };
  it('« Précédent » (ex « Dernier relevé ») écrit 2,5 L', () => {
    render(<BrewDayMeasurements step={step} state={etat} update={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Volume' }));
    const texte = document.body.textContent ?? '';
    expect(texte).toMatch(/Précédent.*2,5 L/);
    expect(texte).not.toMatch(/\d\.\d/);
  });
  it('le journal écrit 2,5 L', () => {
    render(<BrewJournal state={etat} recipe={recipe} update={() => {}} />);
    const texte = document.body.textContent ?? '';
    expect(texte).toMatch(/2,5/);
    expect(texte).not.toMatch(/\d\.\d/);
  });
});
