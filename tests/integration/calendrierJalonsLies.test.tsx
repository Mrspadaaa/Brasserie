/**
 * D386 au banc : Foire du Valais (vendredi à dimanche de S+2) en barre dans Fêtes ; la Tireuse (Achats, un jour) liée à la foire ; « Dédé,
 * 1 fût » (Ventes, un jour) sans lien. Toucher la foire allume la tireuse (et son fil), pâlit Dédé ; Lier vers une fête écrit `evenementId`.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, lundiDe } from '../../src/domain/calendrier';
import { obstaclesTraverses } from '../../src/ui/calendrier/frise/routageFil';

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
    /* D390 : toucher le jalon lié l'allume aussi (son fil se dessine), les autres jalons pâlissent */
    toucher(bouton(/^Tireuse/));
    await waitFor(() => expect(bouton(/^Dédé, 1 fût/)).toHaveAttribute('data-ton', 'pale'));
    expect(bouton(/^Tireuse/)).toHaveAttribute('data-ton', 'allume');
    /* un jalon sans lien touché n'éclaire rien : tout revient au repos */
    toucher(bouton(/^Dédé, 1 fût/));
    await waitFor(() => expect(document.querySelectorAll('[data-ton]')).toHaveLength(0));
  });

  it('D390 : au repos, aucun fil ; le jalon lié porte un point de la couleur de sa barre (Fêtes), Dédé aucun', () => {
    monter();
    const point = bouton(/^Tireuse/).querySelector('[data-point-lie]');
    expect(point).not.toBeNull();
    expect(point!.getAttribute('data-point-lie')).toBe('fetes');
    expect(point!.className).toMatch(/cal-t-fetes/);
    expect(bouton(/^Dédé, 1 fût/).querySelector('[data-point-lie]')).toBeNull();
    const css = readFileSync(resolve(process.cwd(), 'src/ui/calendrier/frise/frise.css'), 'utf8');
    expect(css).toMatch(/\.cal-point-lie \{[^}]*background: var\(--c\)/);
  });

  it('D390 : le fil part de la tireuse vers la foire, seulement au toucher de la foire ou de la tireuse ; jamais au repos', async () => {
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
    /* au repos : aucun fil (il traversait Dédé et semblait le relier, test en ligne du lot A) */
    await new Promise(r => setTimeout(r, 30));
    expect(fil()).toBeNull();
    toucher(bouton(/^Foire du Valais/));
    await waitFor(() => expect(fil()).not.toBeNull());
    expect(fil()!.getAttribute('data-fil')).toBe(bouton(/^Tireuse/).getAttribute('data-chose'));
    expect(fil()!.getAttribute('class')).toBe('cal-fil cal-fil-allume');
    expect(fil()!.getAttribute('d')).toBe('M174.0 220.0V86.0');
    /* refermer : plus de fil */
    toucher(bouton(/^Foire du Valais/));
    await waitFor(() => expect(fil()).toBeNull());
    /* toucher la tireuse : son fil se dessine aussi */
    toucher(bouton(/^Tireuse/));
    await waitFor(() => expect(fil()?.getAttribute('class')).toBe('cal-fil cal-fil-allume'));
    expect(document.querySelectorAll('path[data-fil]')).toHaveLength(1);
  });

  it('CAL-FIL-SOUS-INFO : le calque du fil est peint sous les noms, les icônes, les barres et la fiche ; le masque l’interrompt sous chaque info', async () => {
    /* l'ordre des couches : la frise est isolée, le calque des traits y est le premier et le plus bas (z-index −1), toute info au-dessus */
    const css = readFileSync(resolve(process.cwd(), 'src/ui/calendrier/frise/frise.css'), 'utf8');
    const regle = (sel: string) => [...css.matchAll(/^([^{}\n]+)\{([^}]*)\}/gm)].filter(m => m[1].split(',').map(s => s.trim()).includes(sel)).map(m => m[2]).join(';');
    const zIndex = (sel: string) => { const m = regle(sel).match(/z-index:\s*(-?\d+)/g); return m ? Number(m[m.length - 1].replace(/z-index:\s*/, '')) : null; };
    expect(regle('.cal-frise')).toMatch(/isolation:\s*isolate/);
    expect(zIndex('.cal-traits')).toBe(-1);
    for (const sel of ['.cal-lbl', '.cal-det', '.cal-barre', '.cal-marque', '.cal-renvoi', '.cal-caddie']) expect(zIndex(sel), sel).toBeGreaterThan(-1);

    /* jsdom ne pose rien : la foire en haut, la fiche sous elle, le nom de Dédé et la tireuse plus bas ; le fil (x = 174) les traverse */
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const id = this.getAttribute('data-chose');
      const r = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
      if (id === 'creatif-CR-FOIRE' && !this.hasAttribute('data-marque')) return r(150, 60, 50, 26);
      if (this.getAttribute('data-titre') === 'Tireuse') return r(160, 220, 28, 28);
      if (this.classList.contains('cal-det')) return r(0, 100, 390, 40);
      if (this.classList.contains('cal-lbl-t') && (this.textContent ?? '').startsWith('Dédé')) return r(150, 160, 70, 18);
      if (this.classList.contains('cal-marque') && (this.getAttribute('aria-label') ?? '').startsWith('Dédé')) return r(226, 156, 28, 28);
      return r(0, 0, 390, 800);
    });
    monter();
    toucher(bouton(/^Foire du Valais/));
    await waitFor(() => expect(document.querySelector('.cal-det')).not.toBeNull());
    const frise = document.querySelector('[data-frise]')!;
    const calque = frise.querySelector('svg[data-traits]')!;
    expect(frise.firstElementChild).toBe(calque);
    const fil = calque.querySelector('path[data-fil]')!;
    /* paquet D n° 1 : le fil ne passe plus tout droit sous Dédé (« M174.0 220.0V86.0 ») ; il prend une voie libre à côté de son nom et de
       son icône, et ne traverse que la fiche, qui couvre toute la largeur (le masque l'y coupe) */
    const d = fil.getAttribute('d') ?? '';
    expect(d).not.toBe('M174.0 220.0V86.0');
    expect(d).toMatch(/^M174\.0 220\.0V/);
    expect(d).toMatch(/V86\.0$/);
    const pts: Array<[number, number]> = []; let px = 0, py = 0;
    for (const m of d.matchAll(/([MHV])(-?[\d.]+)(?: (-?[\d.]+))?/g)) {
      if (m[1] === 'M') { px = Number(m[2]); py = Number(m[3]); } else if (m[1] === 'H') px = Number(m[2]); else py = Number(m[2]);
      pts.push([px, py]);
    }
    const nomDede = { left: 150, top: 160, right: 220, bottom: 178 }, iconeDede = { left: 226, top: 156, right: 254, bottom: 184 };
    expect(obstaclesTraverses(pts, [nomDede, iconeDede])).toBe(0);
    const groupe = fil.parentElement!;
    const id = /^url\(#(.+)\)$/.exec(groupe.getAttribute('mask') ?? '')?.[1];
    expect(id).toBeTruthy();
    const masque = calque.querySelector(`mask[id="${id}"]`)!;
    expect(masque).not.toBeNull();
    const trous = [...masque.querySelectorAll('rect[data-trou]')].map(t => ['x', 'y', 'width', 'height'].map(a => t.getAttribute(a)).join(' '));
    /* la fiche, sans marge ; le nom de Dédé, 2 px sur les côtés et 1 px en haut et en bas ; la foire et la tireuse, au bord exact (le fil les touche) */
    expect(trous).toContain('0.0 100.0 390.0 40.0');
    expect(trous).toContain('148.0 159.0 74.0 20.0');
    expect(trous).toContain('150.0 60.0 50.0 26.0');
    expect(trous).toContain('160.0 220.0 28.0 28.0');
    /* le nom de Dédé et son icône, à 6 px de lui, font un seul bloc : le fil ne passe pas entre eux */
    expect(trous).toContain('148.0 159.0 108.0 20.0');
  });

  it('paquet D n° 2 : en vue Semaine, la tireuse glissée d’une colonne et demie (1,4) va une semaine plus loin, même jour de la semaine (+7 j, pas +10)', async () => {
    const { appels } = monter();
    const tireuse = bouton(/^Tireuse/);
    const avant = tireuse.getAttribute('data-ponctuel')!;
    const lc = Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur-colonne'));
    expect(document.querySelector('[data-frise]')!.getAttribute('data-echelle')).toBe('semaine');
    expect(lc).toBeGreaterThan(0);
    const pas = (x: number) => fireEvent.pointerMove(tireuse, { clientX: x, clientY: 10, pointerId: 1 });
    fireEvent.pointerDown(tireuse, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
    for (let i = 1; i <= 14; i++) pas(100 + (lc * 1.4 * i) / 14);
    fireEvent.pointerUp(tireuse, { clientX: 100 + lc * 1.4, clientY: 10, pointerId: 1 });
    await waitFor(() => expect(appels.filter(a => a.collection === 'financialPlans' && a.patch && 'date' in a.patch)).toHaveLength(1));
    const patch = appels.find(a => a.collection === 'financialPlans' && a.patch && 'date' in a.patch)!;
    expect(patch.id).toBe('P-TIREUSE');
    expect(String(patch.patch!.date).slice(0, 10)).toBe(ajouterJours(avant, 7));
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
