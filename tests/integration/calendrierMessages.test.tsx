import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { sansPointDouble, textePromesse } from '../../src/components/tabs/CalendrierTab';
import { dateDeSemaine } from '../../src/domain/calendrier';
import type { Promesse } from '../../src/domain/calendrierGestes';

/*
 * CRITIQUE-3 n° 7, 20, 37 (E32, E33, D-200, CAL-GESTE-BRUIT) : un seul canal de message pour tout l'onglet. L'en-tête y passe par `onMessage` :
 * on capte ses props (le vrai composant est rendu) pour jouer « Tire jusqu'au bout : l'année » sans dépendre du geste de la poignée.
 */
const capte = vi.hoisted(() => ({ props: null as null | { onMessage?: (m: { genre: 'annee' | 'invite'; texte: string } | null) => void } }));
vi.mock('../../src/ui/calendrier/entete/EnTete', async importOriginal => {
  const vrai = await importOriginal<typeof import('../../src/ui/calendrier/entete/EnTete')>();
  const EnTeteCalendrier = (p: Parameters<typeof vrai.EnTeteCalendrier>[0]) => { capte.props = p as typeof capte.props; return vrai.EnTeteCalendrier(p); };
  return { ...vrai, EnTeteCalendrier };
});

const JOUR = '2026-11-16';
beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const down = (el: Element, x = 100) => fireEvent.pointerDown(el, { clientX: x, clientY: 10, pointerId: 1, button: 0 });
const move = (el: Element, x: number) => fireEvent.pointerMove(el, { clientX: x, clientY: 10, pointerId: 1 });
const up = (el: Element, x = 100) => fireEvent.pointerUp(el, { clientX: x, clientY: 10, pointerId: 1 });
const glisser = (el: Element, dx: number) => { down(el, 100); move(el, 100 + dx); up(el, 100 + dx); };
const toucher = (el: Element) => { down(el); up(el); fireEvent.click(el); };
const colonne = () => Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur-colonne'));
const barre = (nom: RegExp) => screen.getByRole('button', { name: nom });
const messages = () => [...document.querySelectorAll('[role="status"], [role="alert"]')].filter(m => m.closest('[data-message]'));
const tousLesMessages = () => [...document.querySelectorAll('[role="status"], [role="alert"]')];
const monter = () => render(<BancCalendrier aujourdhui={JOUR} sansChrome />);

describe('d1 : un seul canal de message (n° 7)', () => {
  it('f1-a, puis f6-b, puis « Tire jusqu’au bout » de l’en-tête : un seul role=status|alert, sur deux lignes au plus', async () => {
    monter();
    glisser(barre(/^Hotte/), colonne());
    await screen.findByRole('status');
    glisser(barre(/^Blonde d’automne, 23 nov/), colonne());
    await screen.findByRole('alert');
    expect(tousLesMessages()).toHaveLength(1);
    expect(capte.props?.onMessage).toBeTypeOf('function');
    act(() => { capte.props!.onMessage!({ genre: 'annee', texte: 'Tire jusqu’au bout : l’année' }); });
    const restants = tousLesMessages();
    expect(restants).toHaveLength(1);
    expect(restants[0]).toHaveTextContent('Tire jusqu’au bout : l’année');
    expect(restants[0].querySelectorAll('.cal-msg-ligne')).toHaveLength(1);
    /* son retrait par l'en-tête ne chasse que lui */
    act(() => { capte.props!.onMessage!(null); });
    expect(tousLesMessages()).toHaveLength(0);
  });

  it('un défilement de 30 px le chasse ; 10 px non', async () => {
    monter();
    glisser(barre(/^Hotte/), colonne());
    await screen.findByRole('status');
    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true, writable: true });
    fireEvent.scroll(window);
    expect(messages()).toHaveLength(1);
    Object.defineProperty(window, 'scrollY', { value: 30, configurable: true, writable: true });
    fireEvent.scroll(window);
    await waitFor(() => expect(messages()).toHaveLength(0));
  });

  it('un défilement de la frise (son conteneur) de 30 px le chasse aussi', async () => {
    monter();
    glisser(barre(/^Hotte/), colonne());
    await screen.findByRole('status');
    const frise = document.querySelector('[data-frise]') as HTMLElement;
    /* un conteneur qu'on découvre en défilant : sa première position fait foi */
    fireEvent.scroll(frise);
    frise.scrollTop = 30;
    fireEvent.scroll(frise);
    await waitFor(() => expect(messages()).toHaveLength(0));
  });

  it('l’ouverture d’un détail le chasse', async () => {
    monter();
    glisser(barre(/^Hotte/), colonne());
    await screen.findByRole('status');
    toucher(barre(/^Marché de Noël/));
    await waitFor(() => expect(messages()).toHaveLength(0));
  });

  it('un nouveau toucher hors du message le chasse ; un toucher sur son Annuler non', async () => {
    monter();
    glisser(barre(/^Hotte/), colonne());
    const m = await screen.findByRole('status');
    fireEvent.pointerDown(m.querySelector('button')!, { pointerId: 2 });
    expect(messages()).toHaveLength(1);
    fireEvent.pointerDown(document.querySelector('[data-frise]')!, { pointerId: 3 });
    await waitFor(() => expect(messages()).toHaveLength(0));
  });
});

describe('d4 : l’alerte f6-b entière (n° 20, E32)', () => {
  it('« 3 fûts promis à La Cigogne le … · prête le … », puis [Livrer le …] [Annuler]', async () => {
    monter();
    glisser(barre(/^Blonde d’automne, 23 nov/), colonne());
    const alerte = await screen.findByRole('alert');
    const texte = alerte.querySelector('[data-msg-texte]')!.textContent!;
    expect(texte).toContain('promis');
    expect(texte).toContain('prête le');
    expect(texte).toMatch(/^3 fûts promis à La Cigogne le \d+ \S+ · prête le \d+ \S+$/);
    expect(texte).not.toMatch(/\.\s*\./);
    const boutons = [...alerte.querySelectorAll('.cal-msg-bt button')].map(b => b.textContent);
    expect(boutons[0]).toMatch(/^Livrer le \d+ \S+$/);
    expect(boutons[1]).toMatch(/Annuler/);
  });

  it('client inconnu : la phrase du domaine, rien d’inventé ; client dans le titre ou non', () => {
    const p: Promesse = { planId: 'P', titre: '3 fûts La Cigogne', jourPromis: '2026-12-15', preteLe: '2027-01-04', livrerLe: '2027-01-05', texte: '3 fûts La Cigogne promis le 15 déc. · prête le 4 janv.', clientId: 'C' };
    expect(textePromesse(p, [{ id: 'C', name: 'La Cigogne' }])).toBe('3 fûts promis à La Cigogne le 15 déc. · prête le 4 janv.');
    expect(textePromesse({ ...p, titre: '3 fûts' }, [{ id: 'C', name: 'La Cigogne' }])).toBe('3 fûts promis à La Cigogne le 15 déc. · prête le 4 janv.');
    expect(textePromesse(p, [])).toBe(p.texte);
    expect(textePromesse({ ...p, clientId: undefined }, [{ id: 'C', name: 'La Cigogne' }])).toBe(p.texte);
  });
});

describe('n° 37 : aucun « .. » dans les messages composés', () => {
  it('« S52, 21 – 27 déc.. » et « 22 nov. . » deviennent « déc. » et « nov. »', () => {
    expect(sansPointDouble(`${dateDeSemaine('2026-12-21')}. Elle arrive dans le carnet.`)).toBe('S52, 21 – 27 déc. Elle arrive dans le carnet.');
    expect(sansPointDouble('à acheter avant le 22 nov. .')).toBe('à acheter avant le 22 nov.');
    expect(sansPointDouble('Rien à dire. Fin.')).toBe('Rien à dire. Fin.');
  });
});
