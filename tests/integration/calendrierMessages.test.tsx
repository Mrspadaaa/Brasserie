import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { sansPointDouble, textePromesse } from '../../src/components/tabs/CalendrierTab';
import { dateDeSemaine } from '../../src/domain/calendrier';
import type { Promesse } from '../../src/domain/calendrierGestes';
import { Message, NOMS_MESSAGE, separerEffet, type MessageCal } from '../../src/ui/calendrier/frise/Message';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/* le vrai CSS du message (sous vitest, `?raw` d'un .css rend une chaîne vide) */
const cssMessage = readFileSync(resolve(__dirname, '../../src/ui/calendrier/message.css'), 'utf8');

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

  it('CRITIQUE-7 : la page qui raccourcit après le geste (une rangée de moins) et que le navigateur ramène au nouveau bas ne chasse pas « Annuler » ; un vrai défilement, si', async () => {
    /* au bout du défilement (1 051 − 800 = 251), la rangée Achats perd 30 px : la page fait 1 021 et le navigateur la remet à 221 de lui-même */
    const page = { scrollHeight: 1051, clientHeight: 800 };
    Object.defineProperty(document, 'scrollingElement', { configurable: true, get: () => page });
    Object.defineProperty(window, 'scrollY', { value: 251, configurable: true, writable: true });
    try {
      monter();
      glisser(barre(/^Hotte/), colonne());
      await screen.findByRole('status');
      page.scrollHeight = 1021;
      Object.defineProperty(window, 'scrollY', { value: 221, configurable: true, writable: true });
      fireEvent.scroll(window);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });
      expect(messages()).toHaveLength(1);
      /* le brasseur défile ensuite de 30 px : le message part */
      Object.defineProperty(window, 'scrollY', { value: 191, configurable: true, writable: true });
      fireEvent.scroll(window);
      await waitFor(() => expect(messages()).toHaveLength(0));
    } finally {
      delete (document as unknown as Record<string, unknown>).scrollingElement;
    }
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

  it('CRITIQUE-13 n° 1 (règle n° 1, as/cap/p-f6b-apres) : l’alerte est dans la rangée Ventes, sous la vente promise, dans le flux ; elle pousse Achats', async () => {
    monter();
    glisser(barre(/^Blonde d’automne, 23 nov/), colonne());
    const alerte = (await screen.findByRole('alert')).closest<HTMLElement>('[data-message]')!;
    expect(messages()).toHaveLength(1);
    expect(alerte.hasAttribute('data-flux')).toBe(true);
    const rangee = alerte.closest('[data-frise] [data-rangee]');
    expect(rangee?.getAttribute('data-rangee')).toBe('ventes');
    const ancre = alerte.dataset.ancre!;
    const vente = rangee!.querySelector(`[data-chose="${ancre}"]`) ?? rangee!.querySelector(`[data-chose^="${ancre}"]`);
    expect(vente).not.toBeNull();
    /* la vente promise d'abord, puis l'alerte, puis la rangée suivante : l'alerte ne couvre rien, elle pousse la suite */
    expect(vente!.compareDocumentPosition(alerte) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const achats = document.querySelector('[data-frise] [data-rangee="achats"]');
    expect(achats).not.toBeNull();
    expect(alerte.compareDocumentPosition(achats!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    /* le vrai CSS : dans le flux, jamais en surimpression */
    expect(cssMessage).toMatch(/\.cal-msg\[data-message\]\[data-flux\]\s*\{[^}]*position:\s*relative/);
    /* Annuler la retire, et le canal reste unique */
    fireEvent.click(within(alerte).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(document.querySelector('[data-frise] [data-message][data-flux]')).toBeNull());
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

describe('CRITIQUE-4 (lot q2-frise) : le bandeau garde son effet entier ; l’alerte attend la décision', () => {
  it('n° 13 b : « Café du Pont, 1 fût · S47 · vente confirmée · S47 : 3 510 → 3 640 » : le nom cède, l’effet reste entier sur sa ligne', () => {
    expect(separerEffet('Café du Pont, 1 fût · S47 · vente confirmée · S47 : 3 510 → 3 640'))
      .toEqual({ nom: 'Café du Pont, 1 fût · S47 · vente confirmée', effet: 'S47 : 3 510 → 3 640' });
    expect(separerEffet('Hotte : S50 · S50 : 5 120 → 4 220 · rangée Achats réaffichée'))
      .toEqual({ nom: 'Hotte : S50 · rangée Achats réaffichée', effet: 'S50 : 5 120 → 4 220' });
    expect(separerEffet('La garde suit la recette du brassin')).toEqual({ nom: 'La garde suit la recette du brassin', effet: null });
    render(<Message message={{ id: 1, role: 'status', texte: 'Café du Pont, 1 fût · S47 · vente confirmée · S47 : 3 510 → 3 640', annuler: () => undefined }} onFermer={() => undefined} />);
    const ligne = document.querySelector('.cal-msg-ligne')!;
    expect(ligne).toHaveClass('cal-msg-2l');
    expect(ligne.querySelector('[data-msg-effet]')?.textContent).toBe('S47 : 3 510 → 3 640');
    expect(ligne.querySelector('[data-msg-texte]')?.textContent).toMatch(/^Café du Pont, 1 fût · S47 · vente confirmée/);
    expect(screen.getByRole('status').textContent).toMatch(/S47 : 3 510 → 3 640 · Annuler$/);
  });

  it('n° 13 b : au glisser réel, le bandeau porte l’effet chiffré entier (« S49 : 1 588 → 2 488 »), dans sa propre ligne s’il suit un nom', async () => {
    monter();
    glisser(barre(/^Hotte/), colonne());
    const m = await screen.findByRole('status');
    const effet = m.querySelector('[data-msg-effet]') ?? m.querySelector('[data-msg-texte]');
    expect(effet?.textContent).toMatch(/^S\d+ : [\d\s −−]+ → [\d\s −−]+$/);
  });

  it('n° 20 : l’alerte « Livrer le … » ne part pas seule au bout de 7 s ; « Livrer » agit une fois ; le bandeau Annuler, lui, part seul', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const agir = vi.fn(), fermer = vi.fn();
    const { rerender } = render(<Message message={{ id: 1, role: 'alert', texte: '3 fûts promis à La Cigogne le 23 déc. · prête le 4 janv.', livrer: { texte: 'Livrer le 5 janv.', agir }, annuler: () => undefined }} onFermer={fermer} />);
    act(() => { vi.advanceTimersByTime(20000); });
    expect(fermer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Livrer le 5 janv.' }));
    expect(agir).toHaveBeenCalledTimes(1);
    rerender(<Message message={{ id: 2, role: 'status', texte: 'S51 : 5 064 → 4 524', annuler: () => undefined }} onFermer={fermer} />);
    act(() => { vi.advanceTimersByTime(7100); });
    expect(fermer).toHaveBeenCalledTimes(1);
  });
});

/* ---------- CRITIQUE-5 n° 5 (E31, E33, D-114) et n° 13 (E33, D-200) ---------- */

describe('CRITIQUE-5 n° 5 : le message de Retirer d’un plan manuel garde son lien entier', () => {
  it('« Annulé · S49 : 1 088 → 1 988 » sur la ligne du texte ; « Finances › » (forme courte) et « Annuler » avec les boutons', () => {
    const agir = vi.fn();
    render(<Message message={{ id: 1, role: 'status', texte: 'Annulé · S49 : 1 088 → 1 988', lien: { texte: 'dans Finances ›', agir }, annuler: () => undefined }} onFermer={() => undefined} />);
    const m = screen.getByRole('status');
    const ligne = m.querySelector('.cal-msg-ligne')!;
    /* la ligne du texte : le nom et l'effet entier, sans le lien (rien ne peut le couper au milieu d'un mot) */
    expect(ligne.textContent).toBe('Annulé · S49 : 1 088 → 1 988');
    expect(ligne.querySelector('button')).toBeNull();
    const boutons = m.querySelector('[data-msg-boutons]')!;
    const lien = screen.getByRole('button', { name: 'dans Finances ›' });
    expect(boutons.contains(lien)).toBe(true);
    expect(lien.textContent).toBe('Finances ›');
    expect(boutons.textContent).toMatch(/Finances › · Annuler$/);
    expect(m.textContent).toBe('Annulé · S49 : 1 088 → 1 988 · Finances › · Annuler');
    fireEvent.click(lien);
    expect(agir).toHaveBeenCalledTimes(1);
  });

  it('au banc, Retirer d’un plan manuel (Hotte) : « Annulé · S… : a → b », le lien « Finances › » entier, « Annuler »', async () => {
    monter();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const b = barre(/^Hotte/);
    fireEvent.pointerDown(b, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();
    fireEvent.pointerUp(b, { clientX: 100, clientY: 10, pointerId: 1 });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Retirer/ }));
    const m = await screen.findByRole('status');
    expect(m.querySelector('.cal-msg-ligne')!.textContent).toMatch(/^Annulé · S\d+ : [\d\s −]+ → [\d\s −]+$/);
    expect(within(m).getByRole('button', { name: /Finances ›/ }).textContent).toBe('Finances ›');
    expect(within(m).getByRole('button', { name: /Annuler/ })).toBeInTheDocument();
  });
});

/* CRITIQUE-5 n° 13, CRITIQUE-9 n° 7, CRITIQUE-10 (doute m38) : la remontée en bande jusque sous l'en-tête et la place « au pied de l'en-tête »
   sont retirées par CRITIQUE-12 n° 1 (règle n° 1 : la place de sa maquette). Leur exigence (jamais sur un nom, ni sur une barre en paysage) est
   rejouée par le bloc « CRITIQUE-12 n° 1 » plus bas, à 390, 844 et 1280. */

describe('CRITIQUE-11 et 12 : le message ne déplace rien ; au grand écran et pour Lier, il se pose près de la chose ou en bas, jamais sous l’en-tête', () => {
  type R = { top: number; left: number; width: number; height: number };
  const taille = (w: number, h: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h });
  };
  const [W0, H0] = [window.innerWidth, window.innerHeight];
  const MM0 = window.matchMedia;
  let espion: ReturnType<typeof vi.spyOn> | null = null;
  let feuille: HTMLStyleElement | null = null;
  afterEach(() => {
    espion?.mockRestore(); espion = null; feuille?.remove(); feuille = null;
    taille(W0, H0); window.matchMedia = MM0; document.body.innerHTML = '';
  });
  const grandEcranSimule = () => {
    window.matchMedia = ((q: string) => ({
      matches: /min-width:\s*1024px/.test(q), media: q, onchange: null,
      addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false
    })) as typeof window.matchMedia;
  };
  const appuiLong = (el: Element) => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.pointerDown(el, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();
    fireEvent.pointerUp(el, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
  };

  it('n° 2 b (E33 « ne déplace rien sous le doigt », D-200, E43) : à 390, l’alerte f6-b se pose sans pousser les rangées, hors de l’en-tête', () => {
    taille(390, 844);
    /* le vrai CSS du message : la mise en page simulée lit `position` comme le navigateur (dans le flux, ou en surimpression) */
    feuille = document.createElement('style'); feuille.textContent = cssMessage; document.head.appendChild(feuille);
    const zone = document.createElement('div'); zone.setAttribute('data-entete-zone', '');
    const frise = document.createElement('div'); frise.setAttribute('data-frise', '');
    const brassins = document.createElement('section'); brassins.setAttribute('data-rangee', 'brassins');
    const titre = document.createElement('h3'); titre.className = 'cal-nom'; titre.textContent = 'Brassins';
    brassins.appendChild(titre); frise.appendChild(brassins);
    /* des étiquettes de 30 en 30 px jusqu'aux onglets : aucune bande libre, le message va au pied de l'en-tête */
    for (let k = 0; k < 22; k++) { const t = document.createElement('span'); t.className = 'cal-lbl-t'; t.textContent = 'Chose'; t.dataset.k = String(k); frise.appendChild(t); }
    document.body.append(zone, frise);
    const H_ENTETE = 180, H_MSG = 85;
    /* l'en-tête grandit de ce qui est dans son flux ; les rangées commencent sous lui */
    const dansLeFlux = () => [...zone.querySelectorAll<HTMLElement>('[data-message]')].filter(m => {
      for (let e: HTMLElement | null = m; e && e !== zone; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'absolute' || p === 'fixed') return false; }
      return true;
    }).length * H_MSG;
    const bas = () => H_ENTETE + dansLeFlux();
    espion = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      let r: R = { top: 0, left: 0, width: 0, height: 0 };
      if (this === zone) r = { top: 0, left: 0, width: 390, height: bas() };
      else if (this.hasAttribute('data-message')) r = this.closest('[data-entete-zone]') ? { top: H_ENTETE + 4, left: 8, width: 374, height: H_MSG } : { top: 680, left: 8, width: 374, height: H_MSG };
      else if (this === brassins) r = { top: bas() + 4, left: 0, width: 390, height: 120 };
      else if (this === titre) r = { top: bas() + 4, left: 24, width: 110, height: 24 };
      else if (this.classList.contains('cal-lbl-t')) r = { top: bas() + 34 + Number(this.dataset.k) * 30, left: 20, width: 300, height: 26 };
      return { ...r, bottom: r.top + r.height, right: r.left + r.width, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect;
    });
    const avant = brassins.getBoundingClientRect().top;
    render(<Message message={{ id: 1, role: 'alert', texte: '3 fûts promis à La Cigogne le 23 déc. · prête le 28 déc.', livrer: { texte: 'Livrer le 29 déc.', agir: () => undefined }, annuler: () => undefined }} onFermer={() => undefined} />);
    const m = screen.getByRole('alert');
    expect(['pres', 'bas']).toContain(m.dataset.place);
    expect(zone.contains(m)).toBe(false);
    expect(document.querySelector('[data-msg-bande]')).toBeNull();
    /* rien ne bouge à l'écran : le haut de Brassins à 2 px près ; l'en-tête garde ses 180 px, sans réserve vide au repos */
    expect(Math.abs(brassins.getBoundingClientRect().top - avant)).toBeLessThanOrEqual(2);
    expect(zone.getBoundingClientRect().height).toBeLessThanOrEqual(180);
  });

  it('n° 3 (E33, E35, D-200) : à 1280, le message de f1-a (Hotte) et celui de Retirer (Marché de Noël) portent leur chose (ancre), hors de l’en-tête', async () => {
    grandEcranSimule();
    monter();
    glisser(barre(/^Hotte/), colonne());
    const f1a = await screen.findByRole('status');
    expect(f1a.textContent).toMatch(/Annuler$/);
    /* CRITIQUE-12 n° 1 : CalendrierTab passe la chose touchée ; la place se calcule près d'elle (géométrie : bloc CRITIQUE-12) */
    expect(f1a.closest('[data-message]')).toHaveAttribute('data-ancre', barre(/^Hotte/).closest('[data-chose]')!.getAttribute('data-chose'));
    expect(f1a.closest('[data-entete-zone]')).toBeNull();
    expect(document.querySelector('[data-msg-bande]')).toBeNull();
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /^Retirer/ }));
    await waitFor(() => expect(messages().some(x => /^Retirée de S52/.test(x.textContent ?? ''))).toBe(true));
    const ret = messages().find(x => /^Retirée de S52/.test(x.textContent ?? ''))!;
    expect(ret.closest('[data-message]')!.getAttribute('data-ancre')).toBeTruthy();
    expect(ret.textContent).toMatch(/^Retirée de S52 · Sans date › · Annuler$/);
    expect(ret.closest('[data-entete-zone]')).toBeNull();
  });

  it('n° 8 (E31, E37, D-113, D-126) : après Lier, « Liée à Blonde d’automne · Annuler » ET le détail de la Hotte avec sa pastille ; Annuler retire le lien', async () => {
    const appels: Array<{ op: string; collection: string; id: string; patch?: Record<string, unknown> }> = [];
    render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as (typeof appels)[number])} />);
    const lies = () => screen.queryAllByRole('button', { name: /^lié à Blonde d’automne/ }).length;
    const avant = lies();
    appuiLong(barre(/^Hotte/));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Lier à un brassin, un client/ }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /Blonde d’automne/ }));
    await waitFor(() => expect(appels).toContainEqual(expect.objectContaining({ op: 'patch', collection: 'financialPlans', id: 'P-HOTTE', patch: { batchId: 'LOT-BLONDE' } })));
    const det = await screen.findByRole('region', { name: /^Détail : Hotte/ });
    await waitFor(() => expect(det.querySelector('[data-apercu-lien]')?.textContent).toMatch(/lié à Blonde d’automne/));
    const m = screen.getByRole('status');
    expect(m.textContent).toMatch(/^Liée à Blonde d’automne · Annuler$/);
    expect(within(m).getByRole('button', { name: /Annuler/ })).toBeInTheDocument();
    /* marqué comme le message d'un geste qui ouvre son détail ; ancré sur la Hotte, hors de l'en-tête (CRITIQUE-12 n° 1 ; le détail est un
       obstacle : bloc CRITIQUE-12, « Lier ») */
    expect(m).toHaveAttribute('data-ouvre-son-detail');
    expect(m).toHaveAttribute('data-ancre', det.getAttribute('data-detail'));
    expect(m.closest('[data-entete-zone]')).toBeNull();
    /* le défilement qui dégage le détail du + ne le chasse pas */
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true, writable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole('status')).toBe(m);
    expect(lies()).toBe(avant + 1);
    await new Promise(r => setTimeout(r, 450));
    fireEvent.click(within(m).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(appels.some(a => a.op === 'patch' && a.id === 'P-HOTTE' && 'batchId' in (a.patch ?? {}) && a.patch!.batchId === undefined)).toBe(true));
    await waitFor(() => expect(lies()).toBe(avant));
  });

  it('non-régression (E33) : un autre message part à l’ouverture d’un détail', async () => {
    monter();
    glisser(barre(/^Hotte/), colonne());
    const f1a = await screen.findByRole('status');
    expect(f1a).not.toHaveAttribute('data-ouvre-son-detail');
    toucher(barre(/^Blonde d’automne/));
    await screen.findByRole('region', { name: /^Détail : Blonde d’automne/ });
    expect(messages()).toHaveLength(0);
  });
});

/*
 * CRITIQUE-12 n° 1 (règle n° 1, E33, E32, D-20, D-200, D-126) : le message d'un geste se posait en haut, sur le titre Brassins et les premières
 * barres (390, 844, 1280). Sa maquette (`as/src/as-gestes.js`, `toast`, et `as/cap/p-f1a-apres.png`) : près de la chose touchée là où il ne
 * cache aucun texte, sinon en bas, au-dessus des onglets, à gauche du + volant ; jamais sous l'en-tête.
 * Écran simulé : en-tête collé, titres de rangée, barres avec leur nom et leur montant, le + volant, les onglets (barre basse, ou rail à 1280).
 */
describe('CRITIQUE-12 n° 1 : le message se pose près de la chose ou en bas à gauche du +, jamais sur un titre, un nom ni le +', () => {
  type R = { top: number; left: number; width: number; height: number };
  type Chose = { id: string; rangee: number; bar: R; nom: R; montant?: R };
  /* `detail` : la place du détail de la Hotte ouvert après Lier (sous elle au téléphone, à côté en paysage) ; `alerte` : la hauteur de l'alerte f6-b
     (texte puis boutons en hauteur ; une ligne en paysage et au grand écran) */
  type Ecran = { w: number; h: number; entete: number; titres: R[]; choses: Chose[]; fab: R; nav: R; detail: R; alerte: number };
  const taille = (w: number, h: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h });
    window.matchMedia = ((q: string) => {
      const min = /min-width:\s*(\d+)px/.exec(q), maxH = /max-height:\s*(\d+)px/.exec(q);
      const matches = (!min || w >= Number(min[1])) && (!maxH || h <= Number(maxH[1])) && (!/landscape/.test(q) || w > h) && (!/portrait/.test(q) || h >= w);
      return { matches, media: q, onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false };
    }) as typeof window.matchMedia;
  };
  const [W0, H0] = [window.innerWidth, window.innerHeight];
  const MM0 = window.matchMedia;
  let espion: ReturnType<typeof vi.spyOn> | null = null;
  afterEach(() => { espion?.mockRestore(); espion = null; taille(W0, H0); window.matchMedia = MM0; document.body.innerHTML = ''; });

  /* 390 × 844 : la frise de 6 semaines, comme `p-f1a-apres` (la frise finit au-dessus du + : la place du bas est libre) */
  const T = (top: number, left = 40, width = 76): R => ({ top, left, width, height: 22 });
  const PORTRAIT: Ecran = {
    w: 390, h: 844, entete: 180,
    titres: [T(186), T(402), T(470), T(560)],
    choses: [
      { id: 'blonde', rangee: 0, bar: { top: 212, left: 12, width: 120, height: 40 }, nom: { top: 214, left: 140, width: 150, height: 18 }, montant: { top: 214, left: 294, width: 44, height: 18 } },
      { id: 'ipa', rangee: 0, bar: { top: 258, left: 12, width: 60, height: 40 }, nom: { top: 260, left: 80, width: 140, height: 18 }, montant: { top: 260, left: 224, width: 34, height: 18 } },
      { id: 'saison', rangee: 0, bar: { top: 304, left: 140, width: 120, height: 40 }, nom: { top: 306, left: 266, width: 104, height: 18 }, montant: { top: 326, left: 266, width: 40, height: 18 } },
      { id: 'porter', rangee: 0, bar: { top: 350, left: 200, width: 170, height: 40 }, nom: { top: 352, left: 60, width: 130, height: 18 }, montant: { top: 372, left: 60, width: 40, height: 18 } },
      { id: 'marche', rangee: 1, bar: { top: 428, left: 200, width: 60, height: 30 }, nom: { top: 432, left: 60, width: 130, height: 18 } },
      { id: 'cigogne', rangee: 2, bar: { top: 496, left: 280, width: 32, height: 32 }, nom: { top: 502, left: 110, width: 160, height: 18 }, montant: { top: 532, left: 278, width: 36, height: 16 } },
      { id: 'hotte', rangee: 3, bar: { top: 586, left: 230, width: 80, height: 30 }, nom: { top: 590, left: 60, width: 160, height: 18 } }
    ],
    fab: { top: 716, left: 318, width: 56, height: 56 },
    nav: { top: 788, left: 0, width: 390, height: 56 },
    detail: { top: 620, left: 30, width: 330, height: 90 }, alerte: 96
  };
  /* 844 × 390 : la colonne des titres à gauche, des rangées de 22 px, les barres dès x = 120 */
  const PAYSAGE: Ecran = {
    w: 844, h: 390, entete: 120,
    titres: [124, 168, 190, 234].map(top => ({ top, left: 8, width: 90, height: 18 })),
    choses: [
      { id: 'blonde', rangee: 0, bar: { top: 124, left: 120, width: 220, height: 20 }, nom: { top: 125, left: 124, width: 150, height: 18 } },
      { id: 'saison', rangee: 0, bar: { top: 146, left: 360, width: 220, height: 20 }, nom: { top: 147, left: 364, width: 160, height: 18 } },
      { id: 'porter', rangee: 0, bar: { top: 146, left: 600, width: 200, height: 20 }, nom: { top: 147, left: 604, width: 150, height: 18 } },
      { id: 'marche', rangee: 1, bar: { top: 168, left: 500, width: 60, height: 20 }, nom: { top: 169, left: 330, width: 160, height: 18 } },
      { id: 'cigogne', rangee: 2, bar: { top: 190, left: 640, width: 20, height: 20 }, nom: { top: 191, left: 470, width: 160, height: 18 } },
      { id: 'hotte', rangee: 3, bar: { top: 234, left: 300, width: 120, height: 20 }, nom: { top: 235, left: 130, width: 160, height: 18 } }
    ],
    fab: { top: 286, left: 772, width: 56, height: 56 },
    nav: { top: 350, left: 0, width: 844, height: 40 },
    detail: { top: 236, left: 440, width: 320, height: 100 }, alerte: 52
  };
  /* 1280 × 800 : le rail à gauche (les onglets), la frise à sa droite */
  const LARGE: Ecran = {
    w: 1280, h: 800, entete: 180,
    titres: [T(186, 110), T(402, 110), T(470, 110), T(560, 110)],
    choses: [
      { id: 'blonde', rangee: 0, bar: { top: 212, left: 110, width: 300, height: 40 }, nom: { top: 214, left: 420, width: 150, height: 18 } },
      { id: 'saison', rangee: 0, bar: { top: 304, left: 400, width: 300, height: 40 }, nom: { top: 306, left: 710, width: 160, height: 18 } },
      { id: 'porter', rangee: 0, bar: { top: 350, left: 600, width: 400, height: 40 }, nom: { top: 352, left: 440, width: 150, height: 18 } },
      { id: 'marche', rangee: 1, bar: { top: 428, left: 800, width: 120, height: 30 }, nom: { top: 432, left: 630, width: 160, height: 18 } },
      { id: 'cigogne', rangee: 2, bar: { top: 496, left: 900, width: 32, height: 32 }, nom: { top: 502, left: 730, width: 160, height: 18 } },
      { id: 'hotte', rangee: 3, bar: { top: 586, left: 600, width: 160, height: 30 }, nom: { top: 590, left: 430, width: 160, height: 18 } }
    ],
    fab: { top: 720, left: 1196, width: 56, height: 56 },
    nav: { top: 0, left: 0, width: 88, height: 800 },
    detail: { top: 620, left: 430, width: 360, height: 90 }, alerte: 52
  };

  /** Monte l'écran simulé. Le message a une taille propre (`w`, `h`), bornée par son `max-width` ; il est posé à son `left`/`top`, sinon à la
   *  place du CSS (bande basse) ; au pied de l'en-tête s'il y est accroché (la place que le n° 1 retire). */
  const monterEcran = (e: Ecran, msg: { w: number; h: number }, detail?: R) => {
    taille(e.w, e.h);
    const r = (el: HTMLElement, x: R) => { el.dataset.r = JSON.stringify(x); return el; };
    const zone = r(document.createElement('div'), { top: 0, left: 0, width: e.w, height: e.entete }); zone.setAttribute('data-entete-zone', '');
    const frise = document.createElement('div'); frise.setAttribute('data-frise', '');
    const rangees = e.titres.map((t, i) => {
      const s = document.createElement('section'); s.setAttribute('data-rangee', `r${i}`);
      s.dataset.r = JSON.stringify({ top: t.top, left: 0, width: e.w, height: (e.titres[i + 1]?.top ?? t.top + 60) - t.top });
      const h = r(document.createElement('h3'), t); h.className = 'cal-nom'; h.textContent = ['Brassins', 'Fêtes', 'Ventes', 'Achats'][i] ?? 'Rangée';
      s.appendChild(h); frise.appendChild(s); return s;
    });
    for (const c of e.choses) {
      const b = r(document.createElement('div'), c.bar); b.setAttribute('data-chose', c.id);
      const n = r(document.createElement('span'), c.nom); n.className = 'cal-lbl-t'; n.textContent = c.id; b.appendChild(n);
      if (c.montant) { const m = r(document.createElement('span'), c.montant); m.className = 'cal-lbl-m'; m.textContent = '−100'; b.appendChild(m); }
      rangees[c.rangee].appendChild(b);
    }
    const fa = document.createElement('div'); fa.className = 'floating-actions';
    const fab = r(document.createElement('button'), e.fab); fab.textContent = '+'; fa.appendChild(fab);
    const nav = r(document.createElement('nav'), e.nav); nav.className = 'nav-principale';
    document.body.append(zone, frise, fa, nav);
    if (detail) { const d = r(document.createElement('div'), detail); d.setAttribute('data-detail', 'hotte'); d.setAttribute('role', 'region'); frise.appendChild(d); }
    const navBasse = e.nav.width > e.nav.height;
    espion = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      let x: R = { top: 0, left: 0, width: 0, height: 0 };
      if (this.hasAttribute('data-message')) {
        const maxW = parseFloat(this.style.maxWidth) || Infinity;
        const w = this.style.width.endsWith('px') ? parseFloat(this.style.width) : Math.min(msg.w, maxW);
        if (this.closest('[data-entete-zone]')) x = { top: e.entete + 4, left: 8, width: Math.min(msg.w, e.w - 16), height: msg.h };
        else {
          x = { left: this.style.left ? parseFloat(this.style.left) : 8, top: this.style.top ? parseFloat(this.style.top) : (navBasse ? e.nav.top : e.h) - 10 - msg.h, width: w, height: msg.h };
          const t = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(this.style.transform);
          if (t) { x.left += Number(t[1]); x.top += Number(t[2]); }
        }
      } else if (this.dataset.r) x = JSON.parse(this.dataset.r) as R;
      return { ...x, bottom: x.top + x.height, right: x.left + x.width, x: x.left, y: x.top, toJSON: () => ({}) } as DOMRect;
    });
  };
  const croise = (a: DOMRect, b: DOMRect, marge = 2) => a.left < b.right + marge && a.right > b.left - marge && a.top < b.bottom + marge && a.bottom > b.top - marge;

  const SEPT: Array<{ nom: string; msg: MessageCal & { ancre?: string }; taille: { w: number; h: number }; detail?: boolean }> = [
    { nom: 'f1-a glissé (Saison)', msg: { id: 1, role: 'status', texte: 'S47 : 3 268 → 3 292', annuler: () => undefined, ancre: 'saison' }, taille: { w: 280, h: 46 } },
    { nom: 'f2-a allongé (Saison)', msg: { id: 2, role: 'status', texte: 'Saison de ferme : J0 / 35 · prête 4 janv.', annuler: () => undefined, ancre: 'saison' }, taille: { w: 300, h: 46 } },
    { nom: 'alerte f6-b (Blonde, vente La Cigogne)', msg: { id: 3, role: 'alert', texte: '3 fûts promis à La Cigogne le 15 déc. · prête le 4 janv.', livrer: { texte: 'Livrer le 5 janv.', agir: () => undefined }, annuler: () => undefined, ancre: 'cigogne' }, taille: { w: 560, h: 96 } },
    { nom: 'Livrer', msg: { id: 4, role: 'status', texte: '3 fûts La Cigogne : 5 janv. · S2 : 4 168 → 4 168', annuler: () => undefined, ancre: 'cigogne' }, taille: { w: 330, h: 46 } },
    { nom: 'Lier (avec le détail ouvert)', msg: { id: 5, role: 'status', texte: 'Liée à Blonde d’automne', annuler: () => undefined, ancre: 'hotte', ouvreSonDetail: true }, taille: { w: 260, h: 46 }, detail: true },
    { nom: 'Retirer (la chose n’est plus dans la frise)', msg: { id: 6, role: 'status', texte: 'Retirée de S52', lien: { texte: 'Sans date ›', agir: () => undefined }, annuler: () => undefined, ancre: 'noel' }, taille: { w: 290, h: 46 } },
    { nom: 'refus de jalon (Porter)', msg: { id: 7, role: 'status', texte: 'La fermentation suit la recette du brassin', lien: { texte: 'Ouvrir le brassin ›', agir: () => undefined }, ancre: 'porter' }, taille: { w: 400, h: 46 } }
  ];
  const TAILLES: Array<[string, Ecran]> = [['390 × 844', PORTRAIT], ['844 × 390', PAYSAGE], ['1280 × 800', LARGE]];

  for (const [t, e] of TAILLES) {
    for (const s of SEPT) {
      it(`${t} · ${s.nom} : près de la chose ou en bas, aucun titre ni nom couvert, ni le +, jamais sous l’en-tête`, () => {
        /* Lier : le détail de la chose liée est ouvert sous elle (D-126 : le message ET le détail) */
        monterEcran(e, s.msg.role === 'alert' ? { ...s.taille, h: e.alerte } : s.taille, s.detail ? e.detail : undefined);
        render(<Message message={s.msg} onFermer={() => undefined} detailOuvert={s.detail ? 'hotte' : null} />);
        const m = document.querySelector<HTMLElement>('[data-message]')!;
        expect(document.querySelector('[data-msg-bande]')).toBeNull();
        expect(m.closest('[data-entete-zone]')).toBeNull();
        expect(['pres', 'bas']).toContain(m.dataset.place);
        const b = m.getBoundingClientRect();
        const couverts = [...document.querySelectorAll(NOMS_MESSAGE)].filter(n => croise(b, n.getBoundingClientRect())).map(n => n.textContent);
        expect(couverts).toEqual([]);
        expect(croise(b, document.querySelector('.floating-actions button')!.getBoundingClientRect(), 0)).toBe(false);
        if (s.detail) expect(croise(b, document.querySelector('[data-detail]')!.getBoundingClientRect(), 0)).toBe(false);
        /* jamais plus haut que la première rangée, jamais sur les onglets (barre basse) ni sur le rail */
        expect(b.top).toBeGreaterThanOrEqual(e.entete);
        if (e.nav.width > e.nav.height) expect(b.bottom).toBeLessThanOrEqual(e.nav.top);
        else expect(b.left).toBeGreaterThanOrEqual(e.nav.left + e.nav.width);
        expect(b.right).toBeLessThanOrEqual(e.w);
      });
    }
  }

  it('390 × 844 : l’alerte f6-b se pose sous la vente promise quand elle n’y cache aucun nom (Ventes en dernière rangée)', () => {
    const e: Ecran = { ...PORTRAIT, titres: PORTRAIT.titres.slice(0, 3), choses: PORTRAIT.choses.filter(c => c.id !== 'hotte' && c.id !== 'cigogne').concat({ id: 'cigogne', rangee: 2, bar: { top: 496, left: 280, width: 32, height: 32 }, nom: { top: 502, left: 110, width: 160, height: 18 } }) };
    monterEcran(e, { w: 374, h: 96 });
    render(<Message message={SEPT[2].msg} onFermer={() => undefined} />);
    const m = document.querySelector<HTMLElement>('[data-message]')!;
    expect(m.dataset.place).toBe('pres');
    expect(m.getBoundingClientRect().top).toBeGreaterThanOrEqual(528);
    expect(m.getBoundingClientRect().top).toBeLessThan(560);
  });

  it('390 × 844 : f1-a de la Saison sans place libre près d’elle : en bas, à gauche du + (left 8, largeur bornée par le +), au-dessus des onglets', () => {
    monterEcran(PORTRAIT, { w: 500, h: 46 });
    render(<Message message={SEPT[0].msg} onFermer={() => undefined} />);
    const m = document.querySelector<HTMLElement>('[data-message]')!;
    const b = m.getBoundingClientRect();
    expect(m.dataset.place).toBe('bas');
    expect(b.left).toBe(8);
    expect(b.right).toBeLessThanOrEqual(PORTRAIT.fab.left - 8);
    expect(b.bottom).toBeLessThanOrEqual(PORTRAIT.nav.top - 8 + 1);
    expect(b.bottom).toBeGreaterThan(PORTRAIT.nav.top - 20);
  });
});
