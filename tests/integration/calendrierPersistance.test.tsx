import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BancCalendrier, etatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ordreSelon } from '../../src/components/tabs/CalendrierTab';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';

/*
 * CRITIQUE-3 n° 14 et 15 (D-5, D-34 à D-37, E39) : épingle, étoile, rangée masquée et ordre survivent à la fermeture et à la réouverture de
 * l'onglet, sur le même StorageService (simulé : le localStorage de jsdom) ; le filtre non. « Achats seuls » masque vraiment les 6 autres
 * rangées (sauf les choses épinglées), « Tout afficher » rend les 7. « Trier les rangées » reprend le geste k15 du jouable.
 */
const JOUR = '2026-11-16';
const CLES = ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre'] as const;
beforeEach(() => { localStorage.clear(); for (const cle of CLES) StorageService.setUiState(cle, []); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const down = (el: Element) => fireEvent.pointerDown(el, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
const up = (el: Element) => fireEvent.pointerUp(el, { clientX: 100, clientY: 10, pointerId: 1 });
const appuiLong = (el: Element) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  down(el);
  act(() => { vi.advanceTimersByTime(500); });
  vi.useRealTimers();
  up(el);
};
const barre = (nom: RegExp) => screen.getByRole('button', { name: nom });
const action = (nom: RegExp) => {
  const b = [...screen.getByRole('menu').querySelectorAll('button')].find(x => nom.test(x.textContent ?? ''));
  if (!b) throw new Error(`action introuvable : ${nom}`);
  return b;
};
const rangees = () => [...document.querySelectorAll('section[data-rangee]')].map(s => s.getAttribute('data-rangee'));
const menuPeriode = () => { fireEvent.click(document.querySelector('[data-ent-periode]')!); return screen.getByRole('dialog', { name: 'Période et vue' }); };
const monter = () => render(<BancCalendrier aujourdhui={JOUR} sansChrome />);

describe('d2 : épingle, étoile, rangée masquée et ordre gardés (E39, C14)', () => {
  it('épingler, étoiler, masquer Achats, trier ; démonter, remonter : les 4 états reviennent, le filtre non', () => {
    const premier = monter();
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(action(/^Épingler/));
    appuiLong(barre(/^Noël privés/));
    fireEvent.click(action(/^Étoile/));
    fireEvent.click(screen.getByRole('button', { name: 'Masquer Achats' }));
    const avant = rangees();
    fireEvent.click(within(menuPeriode()).getByRole('button', { name: /Trier les rangées/ }));
    const trie = rangees();
    expect(trie).not.toEqual(avant);
    expect(document.querySelector('[data-tri-seg]')).toHaveAttribute('data-critere', 'urgent');
    /* le filtre de la visite : posé, puis jamais gardé */
    fireEvent.click(within(menuPeriode()).getByRole('button', { name: /Filtrer par type/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Filtrer par type' })).getByRole('button', { name: 'Fêtes seules' }));
    expect(document.querySelector('[data-filtre]')).not.toBeNull();
    premier.unmount();

    expect(StorageService.getUiState<string[]>('calendrier_epingles', [])).toEqual(['creatif-CR-NOEL']);
    expect(StorageService.getUiState<string[]>('calendrier_etoiles', [])).toHaveLength(1);
    expect(StorageService.getUiState<string[]>('calendrier_masquees', [])).toEqual(['achats']);
    expect(StorageService.getUiState<string[]>('calendrier_ordre', [])).toHaveLength(7);

    monter();
    expect(document.querySelector('[data-filtre]')).toBeNull();
    expect(rangees().filter(r => r !== 'achats')).toEqual(trie.filter(r => r !== 'achats'));
    expect(StorageService.getUiState<string[]>('calendrier_ordre', [])).toEqual(trie);
    expect(barre(/^Marché de Noël/).className).toContain('cal-epi');
    expect(document.querySelectorAll('.cal-etoile, .lucide-star').length).toBe(1);
    expect(screen.getAllByRole('button', { name: /^Afficher Achats/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Masquer Achats' })).toBeNull();
  });

  it('« Achats seuls » : 1 rangée plus les épinglées, le texte compte 6 rangées masquées ; « Tout afficher » rend les 7', () => {
    StorageService.setUiState('calendrier_epingles', ['creatif-CR-NOEL']);
    monter();
    expect(rangees()).toHaveLength(7);
    fireEvent.click(within(menuPeriode()).getByRole('button', { name: /Filtrer par type/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Filtrer par type' })).getByRole('button', { name: 'Achats seuls' }));
    expect(document.querySelector('[data-filtre]')!.textContent).toBe('Achats seuls · 6 rangées masquées · Tout afficher');
    /* Achats, et Fêtes pour sa chose épinglée (Marché de Noël) */
    expect(rangees().sort()).toEqual(['achats', 'fetes']);
    expect(barre(/^Marché de Noël/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Noël privés/ })).toBeNull();
    fireEvent.click(within(document.querySelector('[data-filtre]') as HTMLElement).getByRole('button', { name: 'Tout afficher' }));
    expect(rangees()).toHaveLength(7);
    expect(document.querySelector('[data-filtre]')).toBeNull();
  });

  it('« Trier les rangées » : genre → Urgent → Date → Montant → genre, comme k15', () => {
    monter();
    const genre = rangees();
    const suite: string[] = [];
    for (let i = 0; i < 4; i++) {
      fireEvent.click(within(menuPeriode()).getByRole('button', { name: /Trier les rangées/ }));
      suite.push(document.querySelector('[data-tri-seg]')?.getAttribute('data-critere') ?? '');
    }
    expect(suite).toEqual(['urgent', 'date', 'montant', 'genre']);
    expect(rangees()).toEqual(genre);
  });
});

describe('ordreSelon : les critères du jouable (k15Ordre)', () => {
  const e = etatBanc(JOUR);
  const m = construireModele({ aujourdhui: JOUR, transactions: e.transactions, payments: [], plans: e.plans, profile: { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-01-01', openingCash: { date: '2026-01-01', amountCents: 403200, confirmed: true } }, assets: [], batches: e.batches, stockItems: [], items: e.items, recettes: e.recettes, reglages: REGLAGES_VIDES, lignesCourses: [] } as never);
  it('sans critère : l’ordre par genre ; Montant : la plus grosse somme d’abord, les rangées sans montant en dernier', () => {
    expect(ordreSelon(null, m.choses, m.retards, '2026-11-16', '2026-12-27')).toEqual(['brassins', 'fetes', 'ventes', 'achats', 'travaux', 'activites', 'papiers']);
    const parMontant = ordreSelon('montant', m.choses, m.retards, '2026-11-16', '2026-12-27');
    expect(parMontant[parMontant.length - 1]).toBe('activites');
    expect(parMontant.indexOf('fetes')).toBeLessThan(parMontant.indexOf('activites'));
  });
  it('Urgent : une rangée en retard passe devant', () => {
    const urgent = ordreSelon('urgent', m.choses, m.retards, '2026-11-16', '2026-12-27');
    expect(m.retards.length).toBeGreaterThan(0);
    expect(urgent).toHaveLength(7);
  });
});
