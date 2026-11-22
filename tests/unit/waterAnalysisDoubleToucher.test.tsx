// @vitest-environment jsdom
// BR-81 / BE-5 (08.11) : double toucher sur « Modifier » : le 2e toucher tombe sur ✓ (même place) et enregistre l'analyse, donc la configuration
// de la brasserie. Écrit avant le correctif (L13) : rouge sur le code d'alors.
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WaterAnalysisTable } from '../../src/ui/WaterAnalysisTable';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

// Valeurs de test, simulées.
const source = { id: 'src', name: 'Réseau — essai', ca: 40, mg: 8, na: 10, cl: 20, so4: 30, hco3: 120 } as never;

describe('« Modifier » puis ✓ à la même place', () => {
  it('un 2e toucher aussitôt (double toucher) n’enregistre rien', () => {
    const onChange = vi.fn();
    render(<WaterAnalysisTable source={source} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Modifier/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’analyse' }));
    expect(onChange).not.toHaveBeenCalled();
    // L'édition reste ouverte : le toucher de trop est ignoré, pas converti en « Annuler ».
    expect(screen.getByRole('button', { name: 'Enregistrer l’analyse' })).toBeTruthy();
  });
  it('un geste voulu, après 600 ms, enregistre', () => {
    const onChange = vi.fn();
    render(<WaterAnalysisTable source={source} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Modifier/ }));
    act(() => { vi.advanceTimersByTime(700); });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’analyse' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('une valeur corrigée puis ✓ aussitôt est un geste voulu (régression vue par la suite complète : recipeEditing)', () => {
  it('le nom change, ✓ immédiat : l’analyse est enregistrée avec le nom corrigé', () => {
    const onChange = vi.fn();
    render(<WaterAnalysisTable source={source} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Modifier/ }));
    fireEvent.change(screen.getByLabelText('Nom du réseau ou de la source'), { target: { value: 'Analyse corrigée' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’analyse' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].name).toBe('Analyse corrigée');
  });
});
