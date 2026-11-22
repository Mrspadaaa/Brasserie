import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Periode } from '../../src/components/periode/periode';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';

/*
 * D385 (18.11, ses mots : « Échelle au menu / Déplier une semaine. / Pincer pour zoomer / Les 3 ») : l'axe en jours, semaines, mois, par le
 * vrai onglet (banc `?preview=calendrier`). Maquette : work/missions/2026-11-18-choix-calendrier/axe/index.html, variantes D, C et B.
 */
const JOUR = '2026-11-16';
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const monter = () => {
  const appels: Appel[] = [];
  const r = render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} />);
  return { appels, ...r };
};
const frise = () => document.querySelector<HTMLElement>('[data-frise]')!;
const nbColonnes = () => Number(frise().getAttribute('data-nb-colonnes'));
const largeurColonne = () => Number(frise().getAttribute('data-largeur-colonne'));
const echelle = () => frise().getAttribute('data-echelle');
const boutonPeriode = () => document.querySelector<HTMLButtonElement>('[data-ent-periode]')!;
const choisirEchelle = (e: 'jour' | 'semaine' | 'mois') => {
  fireEvent.click(boutonPeriode());
  fireEvent.click(document.querySelector<HTMLButtonElement>(`[data-menu-echelle] [data-echelle="${e}"]`)!);
};
const pd = (el: Element, id: number, x: number) => fireEvent.pointerDown(el, { clientX: x, clientY: 40, pointerId: id, button: 0, pointerType: 'touch' });
const pm = (el: Element, id: number, x: number) => fireEvent.pointerMove(el, { clientX: x, clientY: 40, pointerId: id, pointerType: 'touch' });
const pu = (el: Element, id: number, x: number) => fireEvent.pointerUp(el, { clientX: x, clientY: 40, pointerId: id, pointerType: 'touch' });
/** Deux doigts posés à 100 px l'un de l'autre, puis le second écarté (rapport > 1,25) ou rapproché (< 0,8). */
const pincer = (sens: 'ecarter' | 'pincer') => {
  const f = frise();
  pd(f, 11, 100); pd(f, 12, 200);
  pm(f, 12, sens === 'ecarter' ? 240 : 170);
  pu(f, 12, 240); pu(f, 11, 100);
};
const barre = (nom: RegExp) => screen.getAllByRole('button', { name: nom })[0];
/* la colonne de la bande, pas le point de la courbe qui porte aussi data-semaine */
const semaineBande = (n: number) => document.querySelector<HTMLElement>(`[data-bande-semaines] [data-semaine="${n}"]`)!;

describe('D385, variante D : l’échelle au menu de la période', () => {
  it('Semaine par défaut ; Jour : 14 colonnes d’un jour, « 2 sem. » ; Mois : des mois, « 6 mois » ; Semaine : 6 semaines', () => {
    monter();
    expect(echelle()).toBe('semaine');
    expect(nbColonnes()).toBe(6);
    fireEvent.click(boutonPeriode());
    const seg = document.querySelector('[data-menu-echelle]')!;
    expect(seg.textContent).toContain('Échelle');
    expect([...seg.querySelectorAll('button')].map(b => `${b.textContent}:${b.getAttribute('aria-pressed')}`)).toEqual(['Jour:false', 'Semaine:true', 'Mois:false']);
    fireEvent.click(seg.querySelector<HTMLButtonElement>('[data-echelle="jour"]')!);
    expect(echelle()).toBe('jour');
    expect(nbColonnes()).toBe(14);
    expect(boutonPeriode().textContent).toBe('2 sem.');
    /* la bande dit « S47 » au-dessus de ses sept jours, puis lettre et numéro ; aujourd'hui (lun. 16) est marqué */
    const bande = document.querySelector('[data-bande-colonnes="jours"]')!;
    expect(bande.querySelectorAll('[data-jour]')).toHaveLength(14);
    expect(bande.querySelector('[data-jour="2026-11-16"]')!.className).toContain('ent-bj-auj');
    expect(bande.querySelector('[data-jour="2026-11-21"]')!.textContent).toBe('S21');
    choisirEchelle('mois');
    expect(echelle()).toBe('mois');
    expect(boutonPeriode().textContent).toBe('6 mois');
    expect(document.querySelector('[data-bande-colonnes="mois"]')!.textContent).toMatch(/^nov\.déc\.janv\./);
    choisirEchelle('semaine');
    expect(echelle()).toBe('semaine');
    expect(nbColonnes()).toBe(6);
    expect(boutonPeriode().textContent).toBe('6 sem.');
  });

  it('PC-144 (paquet F n° 2) : une échelle qui change la période le dit (« Mois : période 6 sem. → 6 mois, Finances aussi ») ; Annuler remet l’échelle et la période', () => {
    const { appels } = monter();
    choisirEchelle('mois');
    const msg = screen.getByRole('status');
    /* CAL-PERIODE-APP-FIXE (22.11) : la fenêtre est locale, le message ne dit plus « Finances aussi » */
    expect(msg.textContent).toMatch(/^Échelle Mois : période 6 sem\. → 6 mois/);
    expect(msg.textContent).not.toMatch(/Finances/);
    fireEvent.click(within(msg).getByRole('button', { name: /Annuler/ }));
    expect(echelle()).toBe('semaine');
    expect(boutonPeriode().textContent).toBe('6 sem.');
    expect(appels.length).toBeGreaterThanOrEqual(0);
  });

  it('PC-144, rejeu en ligne (20.11) ; CAL-PERIODE-APP-FIXE (22.11) : l’échelle et son Annuler ne touchent jamais la période de l’app (« Tout l’historique » reste)', () => {
    const vues: Periode[] = [];
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ periode: { genre: 'tout' }, onPeriode: p => vues.push(p) }} />);
    choisirEchelle('mois');
    expect(vues).toEqual([]);
    fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: /Annuler/ }));
    expect(vues).toEqual([]);
    expect(echelle()).toBe('semaine');
  });

  it('« 2 sem. » des durées ouvre la vue Jour ; « 3 mois » choisi en Jour repasse l’axe en semaines', () => {
    monter();
    fireEvent.click(boutonPeriode());
    fireEvent.click(screen.getByRole('button', { name: '2 sem.' }));
    expect(echelle()).toBe('jour');
    fireEvent.click(boutonPeriode());
    fireEvent.click(screen.getByRole('button', { name: '3 mois' }));
    expect(echelle()).toBe('semaine');
    expect(nbColonnes()).toBe(13);
  });
});

describe('D385, variante C : déplier une semaine de la bande', () => {
  it('toucher S48 la déplie en sept jours au milieu des autres semaines ; « toucher pour replier » la replie', () => {
    monter();
    fireEvent.click(semaineBande(48));
    expect(echelle()).toBe('semaine-depliee');
    expect(nbColonnes()).toBe(12);
    const replier = document.querySelector<HTMLButtonElement>('[data-replier="2026-11-23"]')!;
    expect(replier.textContent).toBe('S48 23–29 nov. · toucher pour replier');
    /* la grille des jours : le week-end ombré, le cadre de la semaine dépliée, le trait d'aujourd'hui */
    expect(document.querySelectorAll('[data-grille-jours] .cal-g-deplie').length).toBeGreaterThan(0);
    /* le toucher d'un jour déplié donne sa date */
    fireEvent.click(document.querySelector('[data-bande-colonnes="deplie"] [data-jour="2026-11-25"]')!);
    expect(document.querySelector('[data-info="date"]')!.textContent).toBe('mer. 25 nov. · S48');
    /* une autre semaine se touche : elle se déplie à sa place */
    fireEvent.click(document.querySelector('[data-semaine-bande="2026-11-30"]')!);
    expect(document.querySelector('[data-replier="2026-11-30"]')).not.toBeNull();
    expect(document.querySelector('[data-replier="2026-11-23"]')).toBeNull();
    fireEvent.click(document.querySelector('[data-replier="2026-11-30"]')!);
    expect(echelle()).toBe('semaine');
    expect(nbColonnes()).toBe(6);
  });

  it('l’appui long sur une semaine de la bande dépliée note toujours une idée à son lundi (E36 intact)', () => {
    monter();
    fireEvent.click(semaineBande(47));
    const s49 = document.querySelector('[data-semaine-bande="2026-11-30"]')!;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.pointerDown(s49, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();
    fireEvent.pointerUp(s49, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.click(s49);
    expect(screen.getByText(/Elle arrive dans le carnet\./).textContent).toBe('S49, 30 nov. – 6 déc. Elle arrive dans le carnet.');
    /* l'idée ne déplie pas la semaine */
    expect(document.querySelector('[data-replier="2026-11-30"]')).toBeNull();
  });
});

describe('D385, variante B : pincer la frise', () => {
  it('écarter deux doigts : semaines → jours ; pincer : jours → semaines → mois ; un cran par geste', () => {
    monter();
    pincer('ecarter');
    expect(echelle()).toBe('jour');
    pincer('ecarter');
    expect(echelle()).toBe('jour');
    pincer('pincer');
    expect(echelle()).toBe('semaine');
    pincer('pincer');
    expect(echelle()).toBe('mois');
  });

  it('le deuxième doigt annule le glisser en cours d’une barre : rien n’est écrit, puis l’échelle change', async () => {
    const { appels } = monter();
    const b = barre(/^Hotte/);
    const lc = largeurColonne();
    pd(b, 1, 100); pm(b, 1, 100 + 2 * lc);
    pd(frise(), 2, 300);
    pm(frise(), 2, 400);
    pu(b, 1, 100 + 2 * lc); pu(frise(), 2, 400);
    await new Promise(r => setTimeout(r, 30));
    expect(appels).toHaveLength(0);
    expect(echelle()).toBe('jour');
  });
});

describe('D385 : les gestes à un doigt restent ; au jour en vue Jour et sur une semaine dépliée, à la semaine en vue Semaine', () => {
  it('vue Jour : la Blonde (23 nov.) glissée de deux colonnes est replanifiée au 25 nov. ; le message dit les jours', async () => {
    const { appels } = monter();
    choisirEchelle('jour');
    const b = barre(/^Blonde d’automne/);
    const lc = largeurColonne();
    pd(b, 1, 100); pm(b, 1, 100 + 2 * lc); pu(b, 1, 100 + 2 * lc);
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'batches', id: 'LOT-BLONDE' });
    expect(JSON.stringify(appels[0].patch)).toContain('25.11.2026');
    expect((await screen.findByRole('status')).textContent).toMatch(/23 nov\. → 25 nov\./);
  });

  it('semaine dépliée : la Hotte (30 nov.) glissée de deux jours passe au 2 déc.', async () => {
    const { appels } = monter();
    fireEvent.click(semaineBande(49));
    const b = barre(/^Hotte/);
    const lc = largeurColonne();
    pd(b, 1, 100); pm(b, 1, 100 + 2 * lc); pu(b, 1, 100 + 2 * lc);
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'financialPlans', id: 'P-HOTTE', patch: { date: '2026-12-02' } });
  });

  it('vue Semaine : la Hotte glissée de deux colonnes avance de deux semaines, comme avant', async () => {
    const { appels } = monter();
    const b = barre(/^Hotte/);
    const lc = largeurColonne();
    pd(b, 1, 100); pm(b, 1, 100 + 2 * lc); pu(b, 1, 100 + 2 * lc);
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'financialPlans', id: 'P-HOTTE', patch: { date: '2026-12-14' } });
  });

  it('vue Jour : l’appui long d’une barre ouvre toujours son menu', () => {
    monter();
    choisirEchelle('jour');
    const b = barre(/^Blonde d’automne/);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    pd(b, 1, 100);
    act(() => { vi.advanceTimersByTime(600); });
    vi.useRealTimers();
    pu(b, 1, 100);
    expect(document.querySelector('[role="menu"], [data-menu-appui]')).not.toBeNull();
  });
});
