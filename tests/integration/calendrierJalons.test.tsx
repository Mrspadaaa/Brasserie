import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';

/*
 * CRITIQUE-5 n° 11 (D-103, E25, MISSION § Vérification 7) : sur le banc (la fixture de la vraie app), le jalon de fin d'un brassin planifié se
 * saisit et se glisse : il écrit `finPrevue` ; un jalon intermédiaire (le dry hop) refuse : aucune écriture, un seul message qui dit pourquoi et
 * mène au brassin.
 */

const JOUR = '2026-11-16';
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); });

const down = (el: Element, x: number) => fireEvent.pointerDown(el, { clientX: x, clientY: 10, pointerId: 1, button: 0 });
const move = (el: Element, x: number) => fireEvent.pointerMove(el, { clientX: x, clientY: 10, pointerId: 1 });
const up = (el: Element, x: number) => fireEvent.pointerUp(el, { clientX: x, clientY: 10, pointerId: 1 });
const largeurColonne = () => Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur-colonne'));
const blonde = () => document.querySelector('[data-chose="brassin-LOT-BLONDE"]') as HTMLElement;

function monter() {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} />);
  return appels;
}

describe('CRITIQUE-5 n° 11 (D-103) : le jalon de fin se glisse, le jalon intermédiaire refuse', () => {
  it('le jalon de fin de la Blonde planifiée, glissé d’une colonne, écrit finPrevue sept jours plus loin ; la barre garde son jour de brassage', async () => {
    const appels = monter();
    const fin = blonde().querySelector('[data-jalon="conditionnement"]') as HTMLElement;
    expect(fin).not.toBeNull();
    /* il porte le bord (tirer la fin) et sa zone de prise est la plus grande (frise.css : 44 px) */
    expect(fin).toHaveAttribute('data-bord');
    expect(fin).toHaveAttribute('data-glissable', 'fin');
    const lc = largeurColonne();
    expect(lc).toBeGreaterThan(0);
    down(fin, 100);
    move(fin, 100 + lc / 2);
    move(fin, 100 + lc);
    up(fin, 100 + lc);
    await waitFor(() => expect(appels.filter(a => a.op === 'patch' && a.collection === 'batches')).toHaveLength(1));
    const patch = appels.find(a => a.op === 'patch' && a.collection === 'batches')!;
    expect(patch.id).toBe('LOT-BLONDE');
    expect(Object.keys(patch.patch ?? {})).toEqual(['finPrevue']);
    expect(String(patch.patch!.finPrevue)).toMatch(/^\d{4}-\d{2}-\d{2}$|^\d{2}\.\d{2}\.\d{4}$/);
    /* aucune date de brassage n'est écrite : seul le jalon de fin a bougé */
    expect(appels.some(a => a.patch && 'plannedBrewDate' in a.patch)).toBe(false);
  });

  it('le dry hop de la Blonde, saisi et tiré : aucune écriture, un seul role=status « Le dry hop suit la recette du brassin » avec « Ouvrir le brassin »', async () => {
    const appels = monter();
    const dry = blonde().querySelector('[data-jalon="dry-hop"]') as HTMLElement;
    expect(dry).not.toBeNull();
    expect(dry).toHaveAttribute('data-glissable', 'false');
    expect(dry.hasAttribute('data-bord')).toBe(false);
    const lc = largeurColonne();
    down(dry, 100);
    move(dry, 100 + 12);
    move(dry, 100 + lc);
    up(dry, 100 + lc);
    const statut = await screen.findByRole('status');
    expect(statut).toHaveTextContent(/suit la recette du brassin/);
    expect(statut).toHaveTextContent(/Ouvrir le brassin/);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(appels).toHaveLength(0);
  });
});
