import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';

/* V12 de la chasse Calendrier (CHN-3, CHN-9, CHN-13), par le vrai onglet (banc `?preview=calendrier`). Lundi 16 nov. 2026. */
const JOUR = '2026-11-16';
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); });

const monter = () => render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={() => {}} />);
const ouvrir = () => fireEvent.click(document.querySelector<HTMLButtonElement>('[data-ent-periode]')!);
const coches = () => [...document.querySelectorAll('[data-menu-periode] button[aria-pressed="true"]')].map(b => b.textContent?.trim());
const ligne = (nom: string) => [...document.querySelectorAll<HTMLButtonElement>('[data-menu-periode] button')].find(b => b.textContent?.trim() === nom)!;
const cadre = () => document.querySelector('.ent-cadre')?.getAttribute('aria-label');

describe('CHN-13 : le menu de période ne coche qu’une ligne', () => {
  it('au repos, Semaine seule ; Jour ou « 2 sem. » : une seule ligne ; 3 mois : « 3 mois » seule', () => {
    monter();
    ouvrir();
    expect(coches()).toEqual(['Semaine']);
    fireEvent.click(ligne('2 sem.'));
    ouvrir();
    expect(coches()).toEqual(['Jour']);
    fireEvent.click(ligne('3 mois'));
    ouvrir();
    expect(coches()).toEqual(['3 mois']);
    fireEvent.click(ligne('An'));
    ouvrir();
    expect(coches()).toEqual(['An']);
  });
});

describe('CHN-3 : « 2 sem. » et « Jour » posent la semaine d’aujourd’hui', () => {
  it('depuis une fenêtre reculée (An, puis 6 sem.), « 2 sem. » ouvre S47 – S48, qui contient le lundi 16 nov.', () => {
    monter();
    ouvrir(); fireEvent.click(ligne('An'));
    ouvrir(); fireEvent.click(ligne('2 sem.'));
    expect(cadre()).toBe('Fenêtre : S47 – S48');
    ouvrir(); fireEvent.click(ligne('3 mois'));
    ouvrir(); fireEvent.click(ligne('Jour'));
    expect(cadre()).toBe('Fenêtre : S47 – S48');
  });
});

describe('CHN-9 : le réglage ± se garde', () => {
  it('un toucher sur ± l’allume et l’écrit ; remonté, il reste allumé', () => {
    monter();
    const pm = () => [...document.querySelectorAll<HTMLButtonElement>('button.ent-mb')].find(b => b.textContent?.trim() === '±')!;
    expect(pm().getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(pm());
    expect(pm().getAttribute('aria-pressed')).toBe('true');
    expect(StorageService.getUiState<boolean>('calendrier_mouvements', false)).toBe(true);
    cleanup();
    monter();
    expect(pm().getAttribute('aria-pressed')).toBe('true');
  });
});
