import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { sansPointDouble, textePromesse } from '../../src/components/tabs/CalendrierTab';
import { dateDeSemaine } from '../../src/domain/calendrier';
import type { Promesse } from '../../src/domain/calendrierGestes';
import { Message, separerEffet } from '../../src/ui/calendrier/frise/Message';

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

describe('CRITIQUE-5 n° 13 : aucun message sur un nom de rangée ou de chose', () => {
  type R = { top: number; left: number; width: number; height: number };
  const taille = (w: number, h: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h });
  };
  const [W0, H0] = [window.innerWidth, window.innerHeight];
  let espion: ReturnType<typeof vi.spyOn> | null = null;
  afterEach(() => { espion?.mockRestore(); espion = null; taille(W0, H0); document.body.innerHTML = ''; });

  /**
   * Un faux écran : l'en-tête collé, une frise (qui défile ou non) avec ses noms de rangée et ses étiquettes, et la place du message (sa bande
   * basse, le CSS ne s'appliquant pas sous jsdom). Les rectangles se lisent dans `data-r` ; ceux de la frise suivent son défilement ; celui du
   * message suit son `transform` et son `left`.
   */
  const ecran = (o: { entete: number; noms: R[]; etiquettes: R[]; message: R; defile?: number }) => {
    const e = document.createElement('div'); e.setAttribute('data-entete-zone', ''); e.dataset.r = JSON.stringify({ top: 0, left: 0, width: window.innerWidth, height: o.entete });
    const frise = document.createElement('div'); frise.setAttribute('data-frise', '');
    let haut = 0;
    if (o.defile) {
      frise.style.overflowY = 'auto';
      Object.defineProperty(frise, 'scrollHeight', { configurable: true, value: 3000 });
      Object.defineProperty(frise, 'clientHeight', { configurable: true, value: 3000 - o.defile });
      Object.defineProperty(frise, 'scrollTop', { configurable: true, get: () => haut, set: (v: number) => { haut = v; } });
    }
    for (const r of o.noms) {
      const s = document.createElement('section'); s.setAttribute('data-rangee', '');
      const h = document.createElement('h3'); h.className = 'cal-nom'; h.textContent = 'Rangée'; h.dataset.r = JSON.stringify(r); h.dataset.defile = '';
      s.appendChild(h); frise.appendChild(s);
    }
    for (const r of o.etiquettes) {
      const t = document.createElement('span'); t.className = 'cal-lbl-t'; t.textContent = 'Chose'; t.dataset.r = JSON.stringify(r); t.dataset.defile = '';
      frise.appendChild(t);
    }
    document.body.append(e, frise);
    espion = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      let r: R = { top: 0, left: 0, width: 0, height: 0 };
      if (this.hasAttribute('data-message')) {
        r = { ...o.message };
        const t = /translate(?:Y)?\((-?[\d.]+)px(?:, (-?[\d.]+)px)?\)/.exec(this.style.transform);
        if (t) { if (/translateY/.test(this.style.transform)) r.top += Number(t[1]); else { r.left += Number(t[1]); r.top += Number(t[2] ?? 0); } }
        if (this.style.left) { const g = parseFloat(this.style.left); r.width -= g - r.left; r.left = g; }
      } else if (this.dataset.r) {
        r = JSON.parse(this.dataset.r) as R;
        if (this.dataset.defile !== undefined) r = { ...r, top: r.top - haut };
      }
      return { ...r, bottom: r.top + r.height, right: r.left + r.width, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect;
    });
    return { frise, defile: () => haut };
  };
  const rect = (el: Element) => el.getBoundingClientRect();
  const croise = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const surUnNom = () => {
    const m = document.querySelector('[data-message]')!;
    return [...document.querySelectorAll('[data-nom-rangee], [data-rangee] .cal-nom, [data-frise] .cal-lbl-t')].filter(n => croise(rect(m), rect(n)));
  };
  const bandeau = (texte = 'Hotte : S50 · S50 : 5 120 → 4 220') => render(<Message message={{ id: 1, role: 'status', texte, annuler: () => undefined }} onFermer={() => undefined} />);

  it('390 × 844 : le bandeau couvrait « Inventaire du stock » ; il monte dans la première bande libre, sous l’en-tête au plus haut', () => {
    taille(390, 844);
    ecran({
      entete: 430,
      noms: [{ top: 440, left: 24, width: 110, height: 24 }, { top: 640, left: 24, width: 110, height: 24 }],
      etiquettes: [{ top: 700, left: 140, width: 180, height: 40 }, { top: 520, left: 140, width: 180, height: 20 }],
      message: { top: 700, left: 8, width: 298, height: 48 }
    });
    bandeau();
    expect(surUnNom()).toHaveLength(0);
    expect(rect(document.querySelector('[data-message]')!).top).toBeGreaterThanOrEqual(430);
  });

  it('844 × 390 (paysage) : l’alerte f6-b, posée sur Fêtes et Ventes, se place dans une bande libre', () => {
    taille(844, 390);
    ecran({
      entete: 120,
      noms: [{ top: 130, left: 12, width: 70, height: 20 }, { top: 230, left: 12, width: 70, height: 20 }, { top: 280, left: 12, width: 70, height: 20 }],
      etiquettes: [{ top: 236, left: 300, width: 200, height: 20 }, { top: 160, left: 200, width: 200, height: 20 }],
      message: { top: 280, left: 8, width: 760, height: 48 }
    });
    render(<Message message={{ id: 1, role: 'alert', texte: '3 fûts promis à La Cigogne le 15 déc. · prête le 4 janv.', livrer: { texte: 'Livrer le 5 janv.', agir: () => undefined }, annuler: () => undefined }} onFermer={() => undefined} />);
    expect(surUnNom()).toHaveLength(0);
  });

  it('CRITIQUE-9 n° 7 (E33, D-200) : en paysage, le refus d’un jalon ne couvre ni une barre ni « J0 / 28 · prête … » ; un seul role=status, deux lignes au plus', () => {
    taille(844, 390);
    /* l'écran de paysage-49 : titres à gauche, des barres dès x = 120 sur toutes les rangées, leur durée dedans */
    const noms: R[] = [], etiquettes: R[] = [];
    for (let top = 124; top < 390; top += 22) noms.push({ top, left: 8, width: 90, height: 18 });
    const { frise } = ecran({ entete: 120, noms, etiquettes, message: { top: 300, left: 8, width: 760, height: 44 } });
    frise.querySelector('section')!.classList.add('cal-rangee-l');
    const barres: R[] = [];
    for (let top = 124; top < 390; top += 22) barres.push({ top, left: 120, width: 300, height: 18 }, { top, left: 470, width: 220, height: 18 });
    for (const [i, r] of barres.entries()) {
      const b = document.createElement('div'); b.setAttribute('data-chose', `b${i}`); b.dataset.r = JSON.stringify(r);
      const d = document.createElement('em'); d.className = 'cal-duree'; d.textContent = 'J0 / 28 · prête 21 déc.'; d.dataset.r = JSON.stringify({ ...r, left: r.left + r.width - 170, width: 160 });
      b.appendChild(d); frise.appendChild(b);
    }
    render(<Message message={{ id: 1, role: 'status', texte: 'La fermentation suit la recette du brassin', lien: { texte: 'Ouvrir le brassin ›', agir: () => undefined } }} onFermer={() => undefined} />);
    const m = document.querySelector<HTMLElement>('[data-message]')!;
    const place = m.dataset.place;
    /* jamais « à droite de la colonne des titres » (le HEAD l'y posait, sur les barres) : une bande libre, sinon au pied de l'en-tête collé,
       dans son flux (la frise descend de sa hauteur : rien n'est couvert par construction ; le faux écran ne déplace pas les rectangles) */
    expect(place).not.toBe('cote');
    if (place === 'sous-entete') expect(m.closest('[data-entete-zone]')).not.toBeNull();
    else expect([...document.querySelectorAll('[data-frise] [data-chose], [data-frise] .cal-duree, [data-rangee] .cal-nom')].filter(n => croise(rect(m), rect(n)))).toHaveLength(0);
    /* ici, aucune bande libre entre la bande et les rangées : il entre sous l'en-tête */
    expect(place).toBe('sous-entete');
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(m.querySelector('[data-msg-texte]')!.textContent).toBe('La fermentation suit la recette du brassin');
  });

  it('390 × 844, aucune bande libre (« Tourne le téléphone » sur les Papiers) : il entre au pied de l’en-tête collé, dans son flux, la frise passe dessous', () => {
    taille(390, 844);
    /* des noms partout entre l'en-tête et les onglets */
    const noms: R[] = [{ top: 436, left: 24, width: 110, height: 24 }], etiquettes: R[] = [];
    for (let top = 436; top < 844; top += 30) etiquettes.push({ top, left: 20, width: 300, height: 26 });
    ecran({ entete: 430, noms, etiquettes, message: { top: 700, left: 8, width: 298, height: 40 } });
    const { rerender } = render(<Message message={{ id: 1, role: 'status', texte: 'Tourne le téléphone : 13 semaines', origine: 'entete' }} onFermer={() => undefined} />);
    const m = document.querySelector('[data-message]')!;
    expect(m.closest('[data-entete-zone]')).not.toBeNull();
    expect(m).toHaveAttribute('data-place', 'sous-entete');
    expect(m).toHaveClass('cal-msg-entete');
    /* le message suivant reprend sa place flottante, puis cherche à nouveau */
    rerender(<Message message={{ id: 2, role: 'status', texte: 'S51 : 5 064 → 4 524', annuler: () => undefined }} onFermer={() => undefined} />);
    expect(screen.getByRole('status').textContent).toMatch(/^S51 : 5 064 → 4 524/);
    expect(document.querySelectorAll('[data-message]')).toHaveLength(1);
  });

  describe('CRITIQUE-10, doute m38 (E33) : « Tourne le téléphone » ne reste jamais sur un nom après défilement', () => {
    const Y0 = window.scrollY;
    let scrollBy: ReturnType<typeof vi.fn>;
    beforeEach(() => {
      scrollBy = vi.fn();
      Object.defineProperty(window, 'scrollBy', { configurable: true, writable: true, value: scrollBy });
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 200 });
      Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 3000 });
    });
    afterEach(() => { Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: Y0 }); });
    const image = () => act(() => new Promise<void>(r => setTimeout(r, 40)));
    /* des noms partout entre l'en-tête et les onglets, un toutes les 30 px depuis `depuis` : aucune bande libre */
    const plein = (depuis: number, extra: R[] = []) => {
      const etiquettes: R[] = [...extra];
      for (let top = depuis; top < 844; top += 30) etiquettes.push({ top, left: 20, width: 300, height: 26 });
      return etiquettes;
    };
    const tourne = (onFermer: () => void) => render(<Message message={{ id: 1, role: 'status', texte: 'Tourne le téléphone : 13 semaines', origine: 'entete' }} onFermer={onFermer} />);

    it('entré sous l’en-tête collé, page défilée, un nom à moitié sous lui : la page se décale du plus petit pas (< 24 px) qui le dégage', () => {
      taille(390, 844);
      /* le message (700 → 740) coupe l'étiquette 736 → 762 : 6 px vers le haut la montrent entière */
      ecran({ entete: 430, noms: [{ top: 436, left: 24, width: 110, height: 24 }], etiquettes: plein(436), message: { top: 700, left: 8, width: 298, height: 40 } });
      const onFermer = vi.fn();
      tourne(onFermer);
      expect(document.querySelector('[data-message]')).toHaveAttribute('data-place', 'sous-entete');
      expect(scrollBy).toHaveBeenCalledWith({ top: -6, left: 0, behavior: 'auto' });
      expect(Math.abs((scrollBy.mock.calls[0][0] as { top: number }).top)).toBeLessThan(24);
      expect(onFermer).not.toHaveBeenCalled();
    });

    it('sans un pas de moins de 24 px qui dégage le nom, le message part (jamais posé dessus)', () => {
      taille(390, 844);
      ecran({ entete: 430, noms: [{ top: 436, left: 24, width: 110, height: 24 }], etiquettes: plein(440, [{ top: 690, left: 20, width: 300, height: 80 }]), message: { top: 700, left: 8, width: 298, height: 40 } });
      const onFermer = vi.fn();
      tourne(onFermer);
      expect(scrollBy).not.toHaveBeenCalled();
      expect(onFermer).toHaveBeenCalledTimes(1);
    });

    it('constat D n° 1 : « Liée à X · Annuler » (un bandeau de geste, pas l’invite de l’en-tête) ne part pas et la page ne bouge pas', () => {
      taille(390, 844);
      ecran({ entete: 430, noms: [{ top: 436, left: 24, width: 110, height: 24 }], etiquettes: plein(440, [{ top: 690, left: 20, width: 300, height: 80 }]), message: { top: 700, left: 8, width: 298, height: 40 } });
      const onFermer = vi.fn();
      render(<Message message={{ id: 1, role: 'status', texte: 'Liée à Blonde d’automne', annuler: () => undefined }} onFermer={onFermer} />);
      expect(scrollBy).not.toHaveBeenCalled();
      expect(onFermer).not.toHaveBeenCalled();
    });

    it('au pied de l’en-tête, un défilement qui fait passer un nom sous lui le fait partir aussitôt (avant ses 24 px)', async () => {
      taille(390, 844);
      /* étiquettes 710 → 736 et 740 → 766 : aucune coupée par le message (700 → 740) */
      ecran({ entete: 430, noms: [{ top: 436, left: 24, width: 110, height: 24 }], etiquettes: plein(440), message: { top: 700, left: 8, width: 298, height: 40 }, defile: 500 });
      const onFermer = vi.fn();
      tourne(onFermer);
      expect(onFermer).not.toHaveBeenCalled();
      const frise = document.querySelector<HTMLElement>('[data-frise]')!;
      frise.scrollTop = 10;
      fireEvent.scroll(frise);
      await image();
      expect(onFermer).toHaveBeenCalledTimes(1);
    });

    it('flottant, un défilement de moins de 24 px amène un nom sous lui : il se replace dans une bande libre', async () => {
      taille(390, 844);
      ecran({ entete: 430, noms: [{ top: 436, left: 24, width: 110, height: 24 }], etiquettes: [{ top: 760, left: 20, width: 300, height: 26 }], message: { top: 700, left: 8, width: 298, height: 40 }, defile: 500 });
      bandeau();
      const m = document.querySelector<HTMLElement>('[data-message]')!;
      expect(m.dataset.place).toBe('bas');
      const frise = document.querySelector<HTMLElement>('[data-frise]')!;
      frise.scrollTop = 30;
      fireEvent.scroll(frise);
      await image();
      expect(surUnNom()).toHaveLength(0);
      expect(m.dataset.place).toBe('bande');
    });
  });
});
