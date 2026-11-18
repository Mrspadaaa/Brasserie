// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), TE-21 : au récapitulatif, α 150 % devenait 30 % et une durée −5 devenait 0 sans message ; BR-42 : masse de houblon −1 g devenait 0 sans message.
// Règle commune (comme VI-9) : une saisie refusée garde la valeur précédente ET le dit (role="alert", aria-invalid).
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewSheet, type BrewSheetProps } from '../../../src/ui/BrewSheet';
import { messageRefus } from '../../../src/ui/numericInput';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

// Valeurs de test, simulées.
function props(): BrewSheetProps {
  return {
    name: 'Pale de septembre', onName: vi.fn(), style: 'American Pale Ale', onStyle: vi.fn(),
    volumeL: 20.5, onVolumeL: vi.fn(), boilMin: 60, onBoilMin: vi.fn(),
    carboTarget: '', onCarboTarget: vi.fn(),
    fermentables: [{ name: 'Pale Ale', kind: 'grain', use: 'empatage', weightKg: 4.2, colorEbc: 5, potentialPpg: 37 }],
    onFermentables: vi.fn(), totalGristKg: 4.2,
    hops: [{ name: 'Cascade', weightG: 58, alpha: 5.5, stage: 'boil', timeMin: 10 }],
    onHops: vi.fn(), hopIbu: () => 3.1,
    yeast: { name: 'Levure sèche', form: 'sèche', qty: 12.5, unit: 'g' }, onYeast: vi.fn(),
    mashSteps: [{ name: 'Saccharification', tempC: 66.5, durationMin: 60 }], onMashSteps: vi.fn(),
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19.5, days: 10 }], onFermentation: vi.fn(),
    mashWaterL: 17.5, onMashWaterL: vi.fn(), spargeWaterL: 11.7, onSpargeWaterL: vi.fn(), water: undefined as never,
    notes: '', onNotes: vi.fn(), shortages: [],
  };
}
function ouvrirHoublons(container: HTMLElement) {
  const node = Array.from(container.querySelectorAll<HTMLDetailsElement>('[data-recipe-section]')).find((d) => d.dataset.recipeSection === 'Houblons')!;
  fireEvent.click(node.querySelector('summary')!);
}
function saisir(label: string, valeur: string) {
  const champ = screen.getByRole('textbox', { name: label, exact: true });
  fireEvent.focus(champ);
  fireEvent.change(champ, { target: { value: valeur } });
  fireEvent.blur(champ);
  return champ as HTMLInputElement;
}

describe('messageRefus', () => {
  it('dit la saisie, la raison et la valeur gardée, à la virgule', () => {
    expect(messageRefus(-5, 10, { min: 0, unite: 'min' })).toBe('-5 min : une valeur négative n’existe pas ici. La valeur précédente (10 min) est conservée.');
    expect(messageRefus(150, 5.5, { min: 0, max: 30, unite: '%' })).toBe('150 % : au-delà de 30 %. La valeur précédente (5,5 %) est conservée.');
  });
});

describe('TE-21, BR-42 — le récapitulatif refuse et le dit', () => {
  it('α 150 % : 5,5 reste, message, champ aria-invalid', () => {
    const p = props();
    const { container } = render(<BrewSheet {...p} />);
    ouvrirHoublons(container);
    const champ = saisir('Alpha de Cascade', '150');
    expect(champ.value).toBe('5,5');
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toMatch(/150 % : au-delà de 30 %.*5,5 %.*conservée/);
    expect(vi.mocked(p.onHops).mock.lastCall![0][0].alpha).toBe(5.5);
  });

  it('durée −5 min : 10 reste, message', () => {
    const p = props();
    const { container } = render(<BrewSheet {...p} />);
    ouvrirHoublons(container);
    const champ = saisir('Durée de Cascade', '-5');
    expect(champ.value).toBe('10');
    expect(screen.getByRole('alert').textContent).toMatch(/négative.*10 min.*conservée/);
    expect(vi.mocked(p.onHops).mock.lastCall![0][0].timeMin).toBe(10);
  });

  it('masse −1 g : 58 reste, message', () => {
    const p = props();
    const { container } = render(<BrewSheet {...p} />);
    ouvrirHoublons(container);
    const champ = saisir('Masse de Cascade', '-1');
    expect(champ.value).toBe('58');
    expect(screen.getByRole('alert').textContent).toMatch(/négative.*58 g.*conservée/);
    expect(vi.mocked(p.onHops).mock.lastCall![0][0].weightG).toBe(58);
  });

  it('une saisie permise ensuite efface le message', () => {
    const { container } = render(<BrewSheet {...props()} />);
    ouvrirHoublons(container);
    saisir('Masse de Cascade', '-1');
    expect(screen.queryByRole('alert')).not.toBeNull();
    const champ = screen.getByRole('textbox', { name: 'Masse de Cascade', exact: true });
    fireEvent.change(champ, { target: { value: '40' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
