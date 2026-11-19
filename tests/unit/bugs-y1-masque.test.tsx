// @vitest-environment jsdom
// Voie y1, BR-28 / BR-89 / BR-103 / TL-31 / BE-13 / BE-56 / T3-10 : « le + flottant couvre des valeurs EN COURS de défilement ».
// Décision du pilote (19.11), lecture étroite et réversible : motif standard « masquer au défilement vers le bas, réafficher au défilement vers le haut
// ou à l'arrêt » (Material, hide on scroll). Jamais masqué quand sa pile est ouverte ou qu'il a le focus clavier.
// La mesure à l'écran (recouvrement réel) : voies/y1/banc/mesurer-fiche.mjs et mesurer-wizard.mjs (TOUT=1), 390×660, 844×340, 1280.
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FloatingActions } from '../../src/ui/FloatingActions';
import { resetFakeJobs } from '../integration/stubs/brewerJobs';

const ATTENTE_MS = 700;
let defilant: HTMLElement;

beforeEach(() => {
  resetFakeJobs();
  vi.useFakeTimers();
  defilant = document.createElement('main');
  document.body.appendChild(defilant);
});
afterEach(() => { cleanup(); defilant.remove(); vi.useRealTimers(); });

const racine = () => screen.getByRole('button', { name: 'Actions rapides' }).parentElement as HTMLElement;
const masque = () => racine().getAttribute('data-floating-actions-masque');
/** Une position de défilement du conteneur, puis son événement `scroll` (le navigateur le pose après chaque déplacement). */
function defiler(y: number) {
  Object.defineProperty(defilant, 'scrollTop', { value: y, configurable: true, writable: true });
  act(() => { fireEvent.scroll(defilant); });
}
function monter() {
  render(<FloatingActions action={{ intent: 'newEquipment', label: 'Nouveau matériel' }} onAction={vi.fn()} companionLabel="Matériel" anchor="nav" />);
}

describe('+ flottant : masqué au défilement vers le bas', () => {
  it('repos : visible', () => {
    monter();
    expect(masque()).toBe('false');
  });

  it('défilement vers le bas : masqué ; vers le haut : réaffiché', () => {
    monter();
    defiler(0); defiler(30); defiler(90);
    expect(masque(), 'masqué en descendant').toBe('true');
    defiler(60);
    expect(masque(), 'réaffiché dès qu’on remonte').toBe('false');
  });

  it('à l’arrêt : réaffiché après ' + ATTENTE_MS + ' ms', () => {
    monter();
    defiler(0); defiler(30); defiler(90);
    expect(masque()).toBe('true');
    act(() => { vi.advanceTimersByTime(ATTENTE_MS - 50); });
    expect(masque(), 'pas encore : le défilement vient de s’arrêter').toBe('true');
    act(() => { vi.advanceTimersByTime(100); });
    expect(masque()).toBe('false');
  });

  it('un tressaillement de quelques pixels ne le masque pas', () => {
    monter();
    defiler(0); defiler(3);
    expect(masque()).toBe('false');
  });

  it('jamais masqué pile ouverte', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
    defiler(0); defiler(30); defiler(90);
    expect(masque()).toBe('false');
  });

  it('masqué, il reste atteignable au clavier : le focus le réaffiche', () => {
    monter();
    defiler(0); defiler(30); defiler(90);
    expect(masque()).toBe('true');
    // Une commande masquée reste atteignable au clavier : elle reprend le focus, donc elle réapparaît.
    fireEvent.focus(screen.getByRole('button', { name: 'Actions rapides' }));
    expect(masque()).toBe('false');
  });

  it('le défilement de sa propre pile ne le masque pas', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
    const pile = screen.getByRole('menu', { name: 'Actions rapides' });
    Object.defineProperty(pile, 'scrollTop', { value: 0, configurable: true, writable: true });
    act(() => { fireEvent.scroll(pile); });
    Object.defineProperty(pile, 'scrollTop', { value: 40, configurable: true, writable: true });
    act(() => { fireEvent.scroll(pile); });
    expect(masque()).toBe('false');
  });
});

describe('+ flottant : feuille de style du masque', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '..', '..', 'src', 'ui', 'floating-actions.css'), 'utf8');
  it('masqué : transparent et sans toucher (rien ne reçoit un geste sous un + invisible)', () => {
    const i = css.indexOf('[data-floating-actions-masque="true"]');
    expect(i).toBeGreaterThan(-1);
    const bloc = css.slice(i, css.indexOf('}', i));
    expect(bloc).toMatch(/opacity:\s*0/);
    expect(bloc).toMatch(/pointer-events:\s*none/);
  });
  it('la transition ne joue que si le brasseur n’a pas demandé moins de mouvement', () => {
    const media = css.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(media, 'transition sous prefers-reduced-motion: no-preference').toBeGreaterThan(-1);
    expect(css.slice(media, css.indexOf('\n}', media))).toMatch(/transition:[^;]*opacity/);
  });
});
