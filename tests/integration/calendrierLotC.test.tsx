/**
 * Lot C (18.11, test en ligne du lot A et captures du lot B) : un test par correctif, chacun rouge sur HEAD 779baa990.
 * 2. l'interrupteur D387 ne couvre jamais « CHF à dépenser » : au téléphone (390, paysage), il vit dans le menu de la période ;
 * 3. vue Jour : la ligne d'aujourd'hui passe sous les textes (calque des traits et son masque, comme le fil) ;
 * 4. le bouton « 2 sem. · j » : rien ne déborde, le « j » ne touche pas le chevron ;
 * 5. « Lier » d'un achat ou d'une vente : Fêtes et activités en premier ; un achat ne propose pas de clients ;
 * 6. la fiche dit à quoi la chose est liée et permet de délier.
 */
import React from 'react';
import { choseFrise } from '../helpers/choseFrise';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';

const JOUR = '2026-11-16';
interface Appel { collection: string; id: string; patch?: Record<string, unknown> }
const largeurAvant = window.innerWidth;

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.useRealTimers();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: largeurAvant });
});

const monter = () => {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} />);
  return { appels };
};
const bouton = choseFrise;
const toucher = (el: Element) => {
  fireEvent.pointerDown(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
  fireEvent.pointerUp(el, { clientX: 10, clientY: 10, pointerId: 1 });
};
const lireCss = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const regle = (css: string, sel: string) => [...css.matchAll(/^([^{}\n]+)\{([^}]*)\}/gm)].filter(m => m[1].split(',').map(s => s.trim()).includes(sel)).map(m => m[2]).join(';');
const fiche = (nom: RegExp) => screen.getByRole('region', { name: nom });

describe('2. D387 : un bouton à bascule dans la rangée du chiffre, jamais au menu', () => {
  // Décision du pilote (18.11) sur « un bouton qui match les deux ou pas genre un toggle switch » : ni ligne de menu ni deux lignes ; un
  // bouton-icône à bascule (aria-pressed) de la taille des autres. Le non-chevauchement des boîtes se mesure dans Chrome (390, 844, 1280).
  for (const largeur of [390, 1280]) {
    it(`à ${largeur} px : présent dans la rangée du chiffre, aria-pressed bascule, la courbe s’aligne ; aucune ligne au menu`, () => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: largeur });
      StorageService.setUiState('calendrier_courbe_alignee', false);
      monter();
      const b = within(document.querySelector<HTMLElement>('.ent-t')!).getByRole('button', { name: 'Aligner la courbe sur la frise' });
      expect(b).not.toHaveAttribute('role', 'switch');
      expect(b).toHaveAttribute('aria-pressed', 'false');
      expect(document.querySelector('.ent-cbz .ent-cb')).not.toHaveAttribute('data-courbe-alignee');
      fireEvent.click(b);
      expect(within(document.querySelector<HTMLElement>('.ent-t')!).getByRole('button', { name: 'Aligner la courbe sur la frise' })).toHaveAttribute('aria-pressed', 'true');
      expect(document.querySelector('.ent-cbz .ent-cb')).toHaveAttribute('data-courbe-alignee');
      fireEvent.click(document.querySelector('[data-ent-periode]')!);
      expect(document.querySelector('[data-menu-periode] [data-ent-aligne]')).toBeNull();
      expect(document.querySelector('[data-menu-periode] [role="switch"]')).toBeNull();
    });
  }

  it('au téléphone, la rangée se resserre sans toucher aux textes ; en paysage, le bouton se pose au bout de la ligne du chiffre', () => {
    const css = lireCss('src/ui/calendrier/entete/entete.css');
    expect(regle(css, '.ent-al[aria-pressed=\'true\']')).toMatch(/background:/);
    expect(css).toMatch(/@media \(max-width: 699px\)/);
    expect(regle(css, '.ent--paysage[data-bouton-al]:not([data-aligne]) .ent-al')).toMatch(/position:\s*absolute/);
    expect(regle(css, '.ent--paysage[data-bouton-al]:not([data-aligne]) .ent-t > :first-child')).toMatch(/max-width:\s*calc\(100% - 30px\)/);
  });
});

describe('3. vue Jour : la ligne d’aujourd’hui passe sous les textes', () => {
  it('elle se trace dans le calque des traits, sous un masque troué par les textes ; la grille ne la peint plus', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const r = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
      if (this.hasAttribute('data-auj')) return r(77, 300, 2, 60);
      if (this.classList.contains('cal-duree')) return r(75, 320, 115, 18);
      return r(0, 0, 390, 800);
    });
    monter();
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(document.querySelector('[data-menu-echelle] [data-echelle="jour"]')!);
    await waitFor(() => expect(document.querySelector('path[data-auj-trait]')).not.toBeNull());
    const trait = document.querySelector('path[data-auj-trait]')!;
    expect(trait.getAttribute('d')).toMatch(/^M78\.0 300\.0V360\.0$/);
    const id = /^url\(#(.+)\)$/.exec(trait.parentElement!.getAttribute('mask') ?? '')?.[1];
    const trous = [...document.querySelectorAll(`mask[id="${id}"] rect[data-trou]`)].map(t => ['x', 'y', 'width', 'height'].map(a => t.getAttribute(a)).join(' '));
    /* « J0 / 15 » : 2 px sur les côtés, 1 px en haut et en bas */
    expect(trous).toContain('73.0 319.0 119.0 20.0');
    expect(regle(lireCss('src/ui/calendrier/frise/frise.css'), '.cal-g-auj')).not.toMatch(/border-left:\s*2px solid/);
  });
});

describe('4. le bouton de la période ne déborde pas', () => {
  it('« 2 sem. · j » : il ne rétrécit pas, son texte et son chevron ont de l’air, des deux côtés', () => {
    const r = regle(lireCss('src/ui/calendrier/entete/entete.css'), '.ent-per');
    expect(r).toMatch(/flex:\s*none/);
    const pad = /padding:\s*0 (\d+)px 0 (\d+)px/.exec(r);
    expect(pad).not.toBeNull();
    expect(Number(pad![1])).toBeGreaterThanOrEqual(6);
    expect(Math.abs(Number(pad![1]) - Number(pad![2]))).toBeLessThanOrEqual(2);
    expect(Number(/gap:\s*(\d+)px/.exec(r)?.[1] ?? 0)).toBeGreaterThanOrEqual(2);
  });
});

describe('5. Lier un achat ou une vente : Fêtes et activités d’abord', () => {
  it('la tireuse (achat) : Fêtes et activités en premier, aucun client ; Dédé (vente) : Fêtes et activités en premier, les clients restent', async () => {
    monter();
    toucher(bouton(/^Tireuse/));
    let f = within(await waitFor(() => fiche(/Détail : Tireuse/)));
    fireEvent.click(f.getByRole('button', { name: /^Lier/ }));
    let groupes = f.getAllByRole('group').map(g => g.getAttribute('aria-label'));
    expect(groupes[0]).toBe('Fêtes et activités');
    expect(groupes).not.toContain('Clients');
    toucher(bouton(/^Dédé, 1 fût/));
    f = within(await waitFor(() => fiche(/Détail : Dédé/)));
    fireEvent.click(f.getByRole('button', { name: /^Lier/ }));
    groupes = f.getAllByRole('group').map(g => g.getAttribute('aria-label'));
    expect(groupes[0]).toBe('Fêtes et activités');
    expect(groupes).toContain('Clients');
  });
});

describe('6. la fiche dit à quoi la chose est liée, et délie', () => {
  it('la tireuse : « lié à Foire du Valais » dans sa fiche ; « Délier » retire le lien dans la source', async () => {
    const { appels } = monter();
    toucher(bouton(/^Tireuse/));
    const f = within(await waitFor(() => fiche(/Détail : Tireuse/)));
    /* D412 : le lien se lit dans le volet « dates » (souche), « Délier » est sous « Plus d’actions » */
    fireEvent.click(document.querySelector('[data-souche]')!);
    expect(f.getByText(/lié à Foire du Valais/)).toBeTruthy();
    fireEvent.click(fiche(/Détail : Tireuse/).querySelector('[data-plus]')!);
    fireEvent.click(within(fiche(/Détail : Tireuse/)).getByRole('button', { name: /^Délier/ }));
    await waitFor(() => expect(appels.some(a => a.collection === 'financialPlans' && a.patch && 'evenementId' in a.patch)).toBe(true));
    const a = appels.find(x => x.collection === 'financialPlans' && x.patch && 'evenementId' in x.patch)!;
    expect(a.patch!.evenementId).toBeUndefined();
    await waitFor(() => expect(bouton(/^Tireuse/)).not.toHaveAttribute('data-lie-a'));
  });
});
