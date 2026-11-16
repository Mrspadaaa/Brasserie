// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KegAddSheet } from '../../src/ui/KegAddSheet';
import { remettreALaver, ligneDate } from '../../src/domain/stock/futsFiche';

afterEach(() => cleanup());

describe('Fûts, jeu en ligne nuit 16.11', () => {
  it('28 : « Ajouter des fûts » en colonne centrée à l’ordinateur, pas en pleine largeur', () => {
    render(<KegAddSheet existants={['F-001']} today="16.11.2026" onClose={vi.fn()} onAdd={vi.fn()}/>);
    const c = screen.getByRole('dialog', { name: 'Ajouter des fûts' }).className;
    expect(c).toMatch(/lg:max-w-xl/);
    expect(c).toMatch(/lg:mx-auto/);
  });
  it('29 : un fût neuf (propre) se remet à laver ; sa ligne le date', () => {
    const neuf = { id: 'F-009', capacityL: 30, state: 'propre' as const, historique: [{ date: '16.11.2026', quoi: 'ajoute' as const }] };
    const sale = remettreALaver(neuf, '16.11.2026');
    expect(sale.state).toBe('lavage');
    expect(sale.historique?.at(-1)).toEqual({ date: '16.11.2026', quoi: 'a-laver' });
    expect(ligneDate(sale, '16.11.2026')?.texte).toBe('Remis à laver le 16.11');
  });
});
