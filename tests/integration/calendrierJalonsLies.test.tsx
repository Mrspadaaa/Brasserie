/**
 * D386 au banc : Foire du Valais (vendredi à dimanche de S+2) en barre dans Fêtes ; la Tireuse (Achats, un jour) liée à la foire ; « Dédé,
 * 1 fût » (Ventes, un jour) sans lien. Toucher la foire allume la tireuse (et son fil), pâlit Dédé ; Lier vers une fête écrit `evenementId`.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, lundiDe } from '../../src/domain/calendrier';

const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
interface Appel { collection: string; id: string; patch?: Record<string, unknown> }

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const monter = () => {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} />);
  return { appels };
};
const bouton = (nom: RegExp) => screen.getByRole('button', { name: nom });
const down = (el: Element) => fireEvent.pointerDown(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
const up = (el: Element) => fireEvent.pointerUp(el, { clientX: 10, clientY: 10, pointerId: 1 });
const toucher = (el: Element) => { down(el); up(el); };
const appuiLong = (el: Element) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  down(el);
  act(() => { vi.advanceTimersByTime(500); });
  vi.useRealTimers();
  up(el);
};

describe('D386 au banc : la foire, sa tireuse, Dédé', () => {
  it('la foire est une barre dans Fêtes ; la tireuse un jalon d’Achats lié à elle ; Dédé un jalon de Ventes sans lien', () => {
    monter();
    const foire = bouton(/^Foire du Valais/);
    expect(foire).toHaveAttribute('data-barre');
    expect(foire).not.toHaveAttribute('data-ponctuel');
    expect(foire.getAttribute('data-rangee')).toBe('fetes');
    const tireuse = bouton(/^Tireuse/);
    expect(tireuse.getAttribute('data-rangee')).toBe('achats');
    expect(tireuse).toHaveAttribute('data-ponctuel', ajouterJours(L, 18));
    expect(tireuse).toHaveAttribute('data-lie-a', foire.getAttribute('data-chose'));
    const dede = bouton(/^Dédé, 1 fût/);
    expect(dede.getAttribute('data-rangee')).toBe('ventes');
    expect(dede).toHaveAttribute('data-ponctuel', ajouterJours(L, 19));
    expect(dede).not.toHaveAttribute('data-lie-a');
    /* au repos, aucun jalon allumé ni pâli */
    expect(document.querySelectorAll('[data-ton]')).toHaveLength(0);
  });

  it('toucher la foire : la tireuse s’allume, Dédé et les autres jalons pâlissent ; leurs noms aussi', async () => {
    monter();
    toucher(bouton(/^Foire du Valais/));
    await waitFor(() => expect(bouton(/^Tireuse/)).toHaveAttribute('data-ton', 'allume'));
    expect(bouton(/^Tireuse/).className).toMatch(/cal-ponctuel-allume/);
    expect(bouton(/^Dédé, 1 fût/)).toHaveAttribute('data-ton', 'pale');
    expect(bouton(/^Hotte/)).toHaveAttribute('data-ton', 'pale');
    const lblDede = bouton(/^Dédé, 1 fût/).parentElement!.querySelector('.cal-lbl');
    expect(lblDede?.className).toMatch(/cal-ponctuel-pale/);
    /* un jalon touché n'éclaire rien : la tireuse et Dédé reviennent au repos */
    toucher(bouton(/^Tireuse/));
    await waitFor(() => expect(document.querySelectorAll('[data-ton]')).toHaveLength(0));
  });

  it('le fil part de la tireuse vers la foire ; repos, puis allumé quand la foire est touchée', async () => {
    /* jsdom ne pose rien : la foire en haut (Fêtes), la tireuse plus bas (Achats), sous elle */
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const id = this.getAttribute('data-chose');
      const r = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
      if (id === 'creatif-CR-FOIRE' && !this.hasAttribute('data-marque')) return r(150, 60, 50, 26);
      if (this.getAttribute('data-titre') === 'Tireuse') return r(160, 220, 28, 28);
      return r(0, 0, 390, 800);
    });
    monter();
    const fil = () => document.querySelector('path[data-fil]');
    await waitFor(() => expect(fil()).not.toBeNull());
    expect(fil()!.getAttribute('data-fil')).toBe(bouton(/^Tireuse/).getAttribute('data-chose'));
    expect(fil()!.getAttribute('class')).toBe('cal-fil cal-fil-repos');
    expect(fil()!.getAttribute('d')).toBe('M174.0 220.0V86.0');
    toucher(bouton(/^Foire du Valais/));
    await waitFor(() => expect(fil()!.getAttribute('class')).toBe('cal-fil cal-fil-allume'));
  });

  it('Lier Dédé à la foire : le groupe « Fêtes et activités » ne propose que ce qui dure ; la source reçoit { evenementId } et Dédé se relie', async () => {
    const { appels } = monter();
    appuiLong(bouton(/^Dédé, 1 fût/));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Lier/ }));
    const groupe = screen.getByRole('group', { name: 'Fêtes et activités' });
    const noms = within(groupe).getAllByRole('menuitem').map(b => b.textContent);
    expect(noms).toContain('Foire du Valais');
    expect(noms).toContain('Ranger la réserve');
    /* le Marché de Noël arrive un jour : un jalon, pas une barre à laquelle se lier */
    expect(noms).not.toContain('Marché de Noël');
    fireEvent.click(within(groupe).getByRole('menuitem', { name: 'Foire du Valais' }));
    await waitFor(() => expect(appels.some(a => a.collection === 'financialPlans' && a.id === 'P-DEDE')).toBe(true));
    expect(appels.find(a => a.id === 'P-DEDE')!.patch).toEqual({ evenementId: 'CR-FOIRE' });
    await waitFor(() => expect(bouton(/^Dédé, 1 fût/)).toHaveAttribute('data-lie-a', 'creatif-CR-FOIRE'));
    expect((await screen.findByRole('status')).textContent).toMatch(/Foire du Valais/);
  });
});
