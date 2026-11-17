import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { DetailChose } from '../../src/ui/calendrier/frise/DetailChose';
import { StorageService } from '../../src/services/storage';
import type { ChoseCalendrier } from '../../src/domain/calendrier';

/*
 * CRITIQUE-4 n° 1 (D-191, E30, f4-b) : le détail d'un brassin montre « Commander » dès qu'il a des courses (ou un manque), pas seulement un
 * manque ; le bouton ouvre les Courses (`onOpenCourses`). L'ordre de f4-b : Ouvrir le brassin, Commander, Budget ›.
 */
const JOUR = '2026-11-16';
beforeEach(() => { localStorage.clear(); for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []); });
afterEach(() => cleanup());

const brassin = (extra: Partial<ChoseCalendrier> = {}): ChoseCalendrier => ({
  id: 'brassin-LOT-STOUT', rangee: 'brassins', titre: 'Stout maison', debut: '2026-11-23', fin: '2026-12-21', centimes: -14200,
  source: { genre: 'batch', id: 'LOT-STOUT' }, ouvre: { ecran: 'brassin', id: 'LOT-STOUT' }, deplacable: true,
  courses: 'Malt pale ale, Orge torréfiée le 18 nov. · −73', ...extra
} as ChoseCalendrier);

describe('n° 1 : « Commander » dans le détail d’un brassin (f4-b)', () => {
  it('un brassin avec des courses, sans manque : « Commander » est là ; un toucher appelle onOpenCourses une fois', () => {
    const onCommander = vi.fn();
    render(<DetailChose chose={brassin()} onFermer={() => {}} onOuvrir={() => {}} onCommander={onCommander} onBudget={() => {}} />);
    const det = within(screen.getByRole('region', { name: 'Détail : Stout maison' }));
    expect(det.queryByText(/Il manque/)).toBeNull();
    fireEvent.click(det.getByRole('button', { name: /Commander/ }));
    expect(onCommander).toHaveBeenCalledTimes(1);
  });

  it('l’ordre de f4-b : Ouvrir le brassin, Commander, Budget ›', () => {
    render(<DetailChose chose={brassin()} onFermer={() => {}} onOuvrir={() => {}} onCommander={() => {}} onBudget={() => {}} />);
    const noms = [...screen.getByRole('region').querySelectorAll('.cal-det-bt button')].map(b => b.textContent?.trim());
    expect(noms).toEqual(['Ouvrir le brassin', 'Commander', 'Budget ›']);
  });

  it('un brassin sans courses ni manque : pas de « Commander » (rien à commander)', () => {
    render(<DetailChose chose={brassin({ courses: undefined })} onFermer={() => {}} onOuvrir={() => {}} onCommander={() => {}} onBudget={() => {}} />);
    expect(screen.queryByRole('button', { name: /Commander/ })).toBeNull();
  });

  it('sur le banc : toucher le Stout maison, puis « Commander », ouvre les Courses (onOpenCourses, 1 appel)', () => {
    const onOpenCourses = vi.fn();
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onOpenCourses }} />);
    const stout = screen.getAllByRole('button', { name: /^Stout maison/ })[0];
    fireEvent.pointerDown(stout, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerUp(stout, { clientX: 10, clientY: 10, pointerId: 1 });
    const det = within(screen.getByRole('region', { name: /^Détail : Stout maison/ }));
    expect(det.getByText(/^Courses :/)).toBeInTheDocument();
    const noms = [...screen.getByRole('region', { name: /^Détail : Stout maison/ }).querySelectorAll('.cal-det-bt button')].map(b => b.textContent?.trim());
    expect(noms.slice(0, 3)).toEqual(['Ouvrir le brassin', 'Commander', 'Budget ›']);
    fireEvent.click(det.getByRole('button', { name: /Commander/ }));
    expect(onOpenCourses).toHaveBeenCalledTimes(1);
  });
});
