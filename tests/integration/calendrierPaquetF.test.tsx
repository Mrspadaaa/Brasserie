import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier, etatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import type { Periode } from '../../src/components/periode/periode';
import type { CreativeItem } from '../../src/types';

/*
 * Paquet F du calendrier (19.11, test en ligne de la vue Mois : PC-138 à PC-142), par le vrai onglet (banc `?preview=calendrier`).
 * Lundi 16 nov. 2026. « Appeler l’assurance » est dans Sans date ; Dédé (vente d'un jour) au sam. 5 déc. ; le Marché de Noël (fête d'un jour) en S52.
 */
const JOUR = '2026-11-16';
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
  StorageService.setUiState('calendrier_echelle', 'semaine');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const FETE_3J: CreativeItem = { id: 'CR-F3', type: 'event', title: 'Fête trois jours', status: 'todo', date: '2026-12-14', fenetre: { du: '2026-12-14', au: '2026-12-20', joursActifs: 3 } };

const monter = (o: { items?: CreativeItem[]; callbacks?: Record<string, unknown> } = {}) => {
  const appels: Appel[] = [];
  const base = etatBanc(JOUR);
  const etat = o.items ? { ...base, items: [...base.items, ...o.items] } : base;
  const r = render(<BancCalendrier aujourdhui={JOUR} sansChrome etat={etat} onAppel={a => appels.push(a as Appel)} {...(o.callbacks ? { callbacks: o.callbacks } : {})} />);
  return { appels, ...r };
};
const toucher = (el: Element) => {
  fireEvent.pointerDown(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
  fireEvent.pointerUp(el, { clientX: 10, clientY: 10, pointerId: 1 });
};
const chose = (nom: RegExp) => screen.getAllByRole('button', { name: nom })[0];
const fiche = () => document.querySelector<HTMLElement>('[data-detail]')!;
const frise = () => document.querySelector<HTMLElement>('[data-frise]')!;
const menuPeriode = () => {
  fireEvent.click(document.querySelector('[data-ent-periode]')!);
  return within(screen.getByRole('dialog', { name: 'Période et vue' }));
};
const ouvrirSansDate = async () => {
  fireEvent.click(menuPeriode().getByRole('button', { name: /Sans date · 1/ }));
  return waitFor(() => { const p = document.querySelector('[data-poche]'); if (!p) throw new Error('pas de poche'); return p as HTMLElement; });
};

describe('paquet F n° 1 (PC-142) : Supprimer dans Sans date, avec Annuler, sans dialogue', () => {
  it('la fiche d’une chose sans date offre Supprimer ; le geste efface pour de vrai, Annuler la remet', async () => {
    const confirmer = vi.spyOn(window, 'confirm');
    const { appels } = monter();
    const poche = await ouvrirSansDate();
    fireEvent.click(within(poche).getByRole('button', { name: /Appeler l’assurance/ }));
    fireEvent.click(await within(fiche()).findByRole('button', { name: 'Plus d’actions' })); /* D412 : sous « Plus d’actions » */
    const b = await within(fiche()).findByRole('button', { name: 'Supprimer' });
    fireEvent.click(b);
    await waitFor(() => expect(appels.some(a => a.op === 'supprimer' && a.collection === 'creativeItems' && a.id === 'CR-SANS')).toBe(true));
    expect(confirmer).not.toHaveBeenCalled();
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/Supprimée? : Appeler l’assurance/);
    await waitFor(() => expect(document.querySelector('[data-poche]')?.textContent ?? '').not.toContain('Appeler l’assurance'));
    fireEvent.click(within(m).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(appels.some(a => a.op === 'creer' && a.id === 'CR-SANS')).toBe(true));
  });
});

describe('paquet F n° 2 (PC-138) : le libellé de Retirer dit ce qu’il fait', () => {
  it('une fête : « Ranger sans date », et le message le redit', async () => {
    monter();
    toucher(chose(/^Marché de Noël/));
    const f = fiche();
    expect(within(f).queryByRole('button', { name: 'Retirer' })).toBeNull();
    fireEvent.click(within(f).getByRole('button', { name: 'Plus d’actions' }));
    fireEvent.click(within(f).getByRole('button', { name: 'Ranger sans date' }));
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/Rangée sans date/);
    expect(within(m).getByRole('button', { name: 'Sans date ›' })).toBeInTheDocument();
    expect(within(m).getByRole('button', { name: /Annuler/ })).toBeInTheDocument();
  });

  it('une vente : « Annuler la vente », et le message dit « Vente annulée »', async () => {
    const { appels } = monter();
    toucher(chose(/^Dédé, 1 fût/));
    const f = fiche();
    expect(within(f).queryByRole('button', { name: 'Retirer' })).toBeNull();
    fireEvent.click(within(f).getByRole('button', { name: 'Plus d’actions' }));
    fireEvent.click(within(f).getByRole('button', { name: 'Annuler la vente' }));
    await waitFor(() => expect(appels.some(a => a.id === 'P-DEDE' && a.patch?.status === 'cancelled')).toBe(true));
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/^Vente annulée/);
    expect(within(m).getByRole('button', { name: /Annuler/ })).toBeInTheDocument();
  });

  it('l’appui long dit aussi « Ranger sans date » pour une fête', async () => {
    monter();
    const b = chose(/^Marché de Noël/);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.pointerDown(b, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();
    fireEvent.pointerUp(b, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(await screen.findByRole('menuitem', { name: /Ranger sans date/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /^Retirer/ })).toBeNull();
  });
});

describe('paquet F n° 3 (PC-139) : l’échelle se garde comme la plage', () => {
  it('Mois choisi, puis rechargé avec la même plage : l’échelle reste Mois', async () => {
    const periodes: Periode[] = [];
    const premier = monter({ callbacks: { onPeriode: (p: Periode) => periodes.push(p) } });
    fireEvent.click(menuPeriode().getByRole('button', { name: '3 mois' }));
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(document.querySelector<HTMLButtonElement>('[data-menu-echelle] [data-echelle="mois"]')!);
    fireEvent.click(menuPeriode().getByRole('button', { name: '3 mois' }));
    await waitFor(() => expect(frise().getAttribute('data-echelle')).toBe('mois'));
    const plage = periodes[periodes.length - 1];
    premier.unmount();
    monter({ callbacks: { periode: plage } });
    await waitFor(() => expect(frise().getAttribute('data-echelle')).toBe('mois'));
  });
});

describe('paquet F n° 4 (PC-140) : « 3 mois » en Mois montre trois mois', () => {
  it('trois colonnes de mois, pas quatre', async () => {
    monter();
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(document.querySelector<HTMLButtonElement>('[data-menu-echelle] [data-echelle="mois"]')!);
    fireEvent.click(menuPeriode().getByRole('button', { name: '3 mois' }));
    await waitFor(() => expect(frise().getAttribute('data-echelle')).toBe('mois'));
    const bande = document.querySelector('[data-bande-colonnes="mois"]')!;
    expect(bande.children.length).toBe(3);
  });
});

describe('paquet F n° 5 (PC-141) : la fiche d’une fête de 3 jours dit ses jours, pas la semaine', () => {
  it('« 3 j » dans la ligne Date, jamais « 14 déc. → 20 déc. »', async () => {
    monter({ items: [FETE_3J] });
    toucher(chose(/^Fête trois jours/));
    fireEvent.click(fiche().querySelector('[data-souche]')!); /* D412 : la ligne Date est dans le volet « dates » */
    const ligne = [...fiche().querySelectorAll('.cal-det-et > div')].find(d => d.querySelector('span')?.textContent === 'Date')!;
    expect(ligne.textContent).not.toMatch(/14 déc\.\s*→\s*20 déc\./);
    expect(ligne.textContent).toMatch(/3 j/);
  });
});

describe('PC-143 et PC-NOTE-2 (paquet F, lot A) : les points d’une fête de 3 j ne font pas croire à des jours choisis', () => {
  it('en échelle Jour, ses 3 points sont groupés (« 3 j »), jamais répartis sur les 7 jours de la semaine ; en Semaine, inchangés', () => {
    StorageService.setUiState('calendrier_echelle', 'jour');
    monter({ items: [FETE_3J], callbacks: { periode: { genre: 'dates', du: '2026-12-14', au: '2026-12-27' } as Periode } });
    const pts = chose(/^Fête trois jours/).closest('[data-barre]')?.querySelector<HTMLElement>('[data-points]')
      ?? document.querySelector<HTMLElement>('[data-points="3"]')!;
    expect(document.querySelector('[data-frise]')!.getAttribute('data-echelle')).toBe('jour');
    expect(pts.getAttribute('data-points-groupes')).toBe('');
    const gauches = [...pts.querySelectorAll<HTMLElement>('[data-point]')].map(i => i.style.left);
    expect(gauches.some(g => g.endsWith('%'))).toBe(false);
  });
});
