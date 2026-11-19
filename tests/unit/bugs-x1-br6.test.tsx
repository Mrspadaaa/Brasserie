// @vitest-environment jsdom
/**
 * BR-6 (08.11) : « 0,1 kg » tapé dans un champ en g devenait 0,1 g en silence (IBU 60 → 0).
 * Rouge sur le code d'avant : « 0,1 » partait au parent à la frappe, « 0,1 kg » n'était plus lisible, la sortie du champ reprenait 0,1.
 * Règle : l'unité tapée est lue (kg → ×1000) ; une unité d'une autre famille ou un texte illisible est refusé avec un message au champ.
 */
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { lireAvecUnite } from '../../src/ui/numericInput';
import { QuantityStepper } from '../../src/ui/QuantityStepper';

afterEach(() => { cleanup(); });

describe('lireAvecUnite : le nombre tapé et son unité', () => {
  it('convertit dans l’unité du champ', () => {
    expect(lireAvecUnite('0,1 kg', 'g')).toMatchObject({ genre: 'valeur', valeur: 100, converti: true });
    expect(lireAvecUnite('0,1kg', 'g')).toMatchObject({ genre: 'valeur', valeur: 100 });
    expect(lireAvecUnite('250 g', 'kg')).toMatchObject({ genre: 'valeur', valeur: 0.25 });
    expect(lireAvecUnite('1,5 L', 'mL')).toMatchObject({ genre: 'valeur', valeur: 1500 });
  });
  it('la même unité, ou aucune, se lit tel quel', () => {
    expect(lireAvecUnite('12,5 g', 'g')).toMatchObject({ genre: 'valeur', valeur: 12.5, converti: false });
    expect(lireAvecUnite('12,5', 'g')).toBeNull();
  });
  it('une unité d’une autre famille est refusée, jamais devinée', () => {
    expect(lireAvecUnite('0,1 L', 'g')).toMatchObject({ genre: 'refus' });
    expect(lireAvecUnite('3 fûts', 'g')).toMatchObject({ genre: 'refus' });
  });
  it('une fin d’unité en cours de frappe attend', () => {
    expect(lireAvecUnite('0,1 k', 'g')).toMatchObject({ genre: 'attente' });
  });
});

function Hote({ depart = 50, unit = 'g', suivre }: { depart?: number; unit?: string; suivre: (v: number) => void }) {
  const [v, setV] = useState(depart);
  return <QuantityStepper value={v} unit={unit} label="Dose" onChange={n => { setV(n); suivre(n); }} compact />;
}
const taper = (texte: string) => {
  const champ = screen.getByRole('textbox', { name: 'Dose' }) as HTMLInputElement;
  fireEvent.focus(champ);
  fireEvent.change(champ, { target: { value: texte } });
  fireEvent.blur(champ);
  return champ;
};

describe('BR-6 : QuantityStepper en g, « 0,1 kg » tapé', () => {
  it('lit les kg : 100 g, et le dit', () => {
    const suivre = vi.fn();
    render(<Hote suivre={suivre} />);
    const champ = taper('0,1 kg');
    expect(suivre).toHaveBeenLastCalledWith(100);
    expect(champ.value).toBe('100');
    expect(screen.getByRole('status')).toHaveTextContent('0,1 kg lu comme 100 g');
  });
  it('lit les g dans un champ en kg', () => {
    const suivre = vi.fn();
    render(<Hote depart={2} unit="kg" suivre={suivre} />);
    const champ = taper('250 g');
    expect(suivre).toHaveBeenLastCalledWith(0.25);
    expect(champ.value).toBe('0,25');
  });
  it('refuse une autre famille d’unité avec un message, et garde la valeur d’avant', () => {
    const suivre = vi.fn();
    render(<Hote suivre={suivre} />);
    const champ = taper('0,1 L');
    expect(champ.value).toBe('50');
    expect(suivre).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('« 0,1 L » : ce champ est en g');
    expect(screen.getByRole('status')).toHaveTextContent('50 g');
  });
  it('en vrai frappe, « 0,1 » est parti au parent puis « 0,1 L » est refusé : le parent retrouve 50', () => {
    const suivre = vi.fn();
    render(<Hote suivre={suivre} />);
    const champ = screen.getByRole('textbox', { name: 'Dose' }) as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '0,1' } });
    fireEvent.change(champ, { target: { value: '0,1 L' } });
    fireEvent.blur(champ);
    expect(suivre).toHaveBeenNthCalledWith(1, 0.1);
    expect(suivre).toHaveBeenLastCalledWith(50);
    expect(champ.value).toBe('50');
  });
  it('refuse un texte illisible avec un message', () => {
    render(<Hote suivre={vi.fn()} />);
    taper('beaucoup');
    expect(screen.getByRole('status')).toHaveTextContent('« beaucoup » : pas un nombre');
  });
  it('un nombre sans unité reste lu dans l’unité du champ, sans message', () => {
    const suivre = vi.fn();
    render(<Hote suivre={suivre} />);
    taper('0,1');
    expect(suivre).toHaveBeenLastCalledWith(0.1);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
