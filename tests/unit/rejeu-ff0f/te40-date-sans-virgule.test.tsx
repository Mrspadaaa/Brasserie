// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), TE-40 : fiche LOT-002, « Planifié ~06,2026 » : une date ne porte pas de virgule. Les dates de l'app s'écrivent « 03.09.2026 »
// (jour.mois.année) ; un mois et une année s'écrivent « 06.2026 ».
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Batch } from '../../../src/types';
import { BatchSchedule } from '../../../src/ui/production/BatchSchedule';
import { indicationDeDate } from '../../../src/domain/batchSchedule';

afterEach(cleanup);

describe('TE-40 — une indication de date ancienne s’écrit à la suisse, sans virgule', () => {
  it('« Planifié ~06,2026 » devient « Planifié ~06.2026 » ; une vraie date et un texte sans date restent tels quels', () => {
    expect(indicationDeDate('Planifié ~06,2026')).toBe('Planifié ~06.2026');
    expect(indicationDeDate('6,2026')).toBe('6.2026');
    expect(indicationDeDate('03.09.2026')).toBe('03.09.2026');
    expect(indicationDeDate('vers la mi-juin, 2 fûts')).toBe('vers la mi-juin, 2 fûts');
    expect(indicationDeDate('Lot 12,5 L')).toBe('Lot 12,5 L');
  });

  it('la fiche d’un brassin commencé affiche la note sans virgule', () => {
    const brewDay = { currentIndex: 0, steps: [], startedAt: Date.parse('2026-09-03T08:00:00Z') } as Batch['brewDay'];
    const batch = { id: 'B1', name: 'IPA', style: 'IPA', volumeL: 30, brewDate: 'Planifié ~06,2026', status: 'fermentation', stockAccountingVersion: 1, brewDay } as Batch;
    render(<BatchSchedule batch={batch} onSave={() => {}} />);
    expect(screen.getByText(/Ancienne indication de date, conservée : Planifié ~06\.2026/)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('06,2026');
  });
});
