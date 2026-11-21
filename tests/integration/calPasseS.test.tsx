// @vitest-environment jsdom
/**
 * CAL-PASSE voie S (21.11), R2-4 : la bulle de glisse annonce la date qui sera écrite (le jour de la semaine de la barre est gardé), pas le lundi de la colonne.
 * Avant : « S40 · 28 sept. · lâcher ici », puis Hefe se posait le mardi 29 sept.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, jourLisible } from '../../src/domain/calendrier';

const JOUR = '2026-11-16';
beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => cleanup());

describe('R2-4 : la bulle « lâcher ici » dit le jour écrit', () => {
  it('Stout maison (un mercredi) glissé de 2 colonnes : la bulle dit le mercredi, et c’est ce jour que le brassin reçoit', async () => {
    const appels: Array<{ id: string; patch?: Record<string, unknown> }> = [];
    render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as never)} />);
    const b = screen.getByRole('button', { name: /^Stout maison/ });
    const lc = Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur-colonne'));
    fireEvent.pointerDown(b, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerMove(b, { clientX: 100 + 2 * lc, clientY: 10, pointerId: 1 });
    const bulle = document.querySelector('[data-ici]')?.textContent ?? '';
    fireEvent.pointerUp(b, { clientX: 100 + 2 * lc, clientY: 10, pointerId: 1 });
    await waitFor(() => expect(appels.length).toBeGreaterThan(0));
    const ecrit = appels[0].patch?.plannedBrewDate as string | undefined;
    expect(ecrit, 'le patch écrit la date de brassage').toBeTruthy();
    /* le jour écrit (iso, ou JJ.MM.AAAA du banc) */
    const iso = /^\d{4}-/.test(ecrit!) ? ecrit! : ecrit!.split('.').reverse().join('-');
    expect(bulle).toContain(jourLisible(iso));
    const lundi = ajouterJours(iso, -((new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7));
    expect(lundi).not.toBe(iso); /* le brassin n'est pas un lundi : l'ancienne bulle annonçait un autre jour */
    expect(bulle).not.toContain(jourLisible(lundi));
  });
});
