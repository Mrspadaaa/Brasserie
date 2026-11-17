import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier, etatBanc, type EtatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import type { Batch } from '../../src/types';

const JOUR = '2026-11-16';
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const down = (el: Element, x = 100) => fireEvent.pointerDown(el, { clientX: x, clientY: 10, pointerId: 1, button: 0 });
const move = (el: Element, x: number) => fireEvent.pointerMove(el, { clientX: x, clientY: 10, pointerId: 1 });
const up = (el: Element, x = 100) => fireEvent.pointerUp(el, { clientX: x, clientY: 10, pointerId: 1 });
const toucher = (el: Element) => { down(el); up(el); };
const glisser = (el: Element, dx: number) => { down(el, 100); move(el, 100 + dx); up(el, 100 + dx); };
const appuiLong = (el: Element) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  down(el);
  act(() => { vi.advanceTimersByTime(500); });
  vi.useRealTimers();
  up(el);
};
const colonne = () => Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur-colonne'));
const barre = (nom: RegExp) => screen.getByRole('button', { name: nom });
const messages = () => [...document.querySelectorAll('[role="status"], [role="alert"]')];
const monter = (props: React.ComponentProps<typeof BancCalendrier> = {}) => {
  const appels: Appel[] = [];
  const r = render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} {...props} />);
  return { appels, ...r };
};

describe('C3 : glisser une barre l’écrit dans sa source, avec son message et son inverse', () => {
  it('deux colonnes : deplacer +2 semaines ; « S… : a → b · Annuler » ; Annuler appelle l’inverse', async () => {
    const { appels } = monter();
    glisser(barre(/^Hotte/), 2 * colonne());
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'financialPlans', id: 'P-HOTTE', patch: { date: '2026-12-14' } });
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/S\d+ : [\d −]+ → [\d −]+ ?· ?Annuler/);
    fireEvent.click(within(m).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(appels).toHaveLength(2));
    expect(appels[1]).toMatchObject({ op: 'patch', collection: 'financialPlans', id: 'P-HOTTE', patch: { date: '2026-11-30' } });
    expect(messages()).toHaveLength(0);
  });

  it('un geste de moins de 8 px ne bouge rien ; un glisser annulé (pointercancel) non plus', async () => {
    const { appels } = monter();
    const b = barre(/^Hotte/);
    glisser(b, 4);
    down(b); move(b, 100 + 2 * colonne()); fireEvent.pointerCancel(b, { clientX: 100, clientY: 10, pointerId: 1 });
    await new Promise(r => setTimeout(r, 30));
    expect(appels).toHaveLength(0);
  });

  it('une charge fixe ne bouge pas : le message dit où la régler et renvoie à Finances', async () => {
    const onOpenFinances = vi.fn();
    const { appels } = monter({ callbacks: { onOpenFinances } });
    glisser(barre(/^Loyer du local, proposé, 26 nov/), 2 * colonne());
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/Finances/);
    fireEvent.click(within(m).getByRole('button', { name: /Finances ›/ }));
    expect(onOpenFinances).toHaveBeenCalledTimes(1);
    expect(appels).toHaveLength(0);
  });
});

describe('C4 : appui long, le menu (f5-a)', () => {
  it('500 ms ouvrent le menu : Épingler, Étoile, « Fêtes seules », Dupliquer, Lier et Retirer ; Retirer enlève la date, jamais une suppression', async () => {
    const { appels } = monter();
    appuiLong(barre(/^Marché de Noël/));
    const menu = within(await screen.findByRole('menu'));
    const noms = [...screen.getByRole('menu').querySelectorAll('[role^="menuitem"]')].map(i => i.textContent ?? '');
    expect(noms.join('|')).toMatch(/Épingler.*Étoile.*Fêtes seules.*Dupliquer en S\d+.*Lier à un brassin, un client.*Retirer/);
    fireEvent.click(menu.getByRole('menuitem', { name: /Retirer/ }));
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'creativeItems', id: 'CR-NOEL', patch: { date: '' } });
    expect(appels.some(a => a.op === 'supprimer')).toBe(false);
  });

  it('un appui bref n’ouvre pas le menu mais le détail', () => {
    monter();
    toucher(barre(/^Marché de Noël/));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('region', { name: /Détail : Marché de Noël/ })).toBeInTheDocument();
  });
});

describe('C5 (BRUIT) : un seul message à la fois', () => {
  it('après f1-a puis f6-b : un seul role="status" ou "alert", sur deux lignes au plus, qui parle de la promesse', async () => {
    const { appels } = monter();
    glisser(barre(/^Hotte/), colonne());
    await screen.findByRole('status');
    glisser(barre(/^Blonde d’automne, 23 nov/), colonne());
    const alerte = await screen.findByRole('alert');
    expect(messages()).toHaveLength(1);
    expect(alerte.textContent).toMatch(/3 fûts La Cigogne promis le 23 déc\. · prête le 28 déc\./);
    expect(within(alerte).getByRole('button', { name: /Livrer le 29 déc\./ })).toBeInTheDocument();
    expect(alerte.querySelectorAll('.cal-msg-ligne')).toHaveLength(1);
    fireEvent.click(within(alerte).getByRole('button', { name: /Livrer le/ }));
    await waitFor(() => expect(appels.some(a => a.collection === 'financialPlans' && a.id === 'P-CIGOGNE' && a.patch?.date === '2026-12-29')).toBe(true));
    await waitFor(() => expect(messages().map(m => m.getAttribute('role'))).toEqual(['status']));
  });
});

describe('C12 (D-103) : glisser un brassin planifié, son jalon de fin, un jalon intermédiaire', () => {
  const mini: Batch = {
    id: 'LOT-MINI', name: 'Mini', style: 'Saison', volumeL: 10, brewDate: '', plannedBrewDate: '30.11.2026', status: 'planifie', gravityLog: [],
    recipeSnapshot: { fermentation: [{ kind: 'primaire', name: 'P', tempC: 19, days: 3 }], hops: [{ name: 'Citra', stage: 'dryHop', dayOffset: 2, grams: 10 }] }
  } as unknown as Batch;
  const etat = (): EtatBanc => ({ ...etatBanc(JOUR), batches: [mini], plans: [], items: [], transactions: [] });

  it('la barre de 1 colonne : +1 semaine ; ses jalons bougent avec elle ; Annuler la rend à sa place', async () => {
    const { appels } = monter({ etat: etat() });
    const b = barre(/^Mini/);
    const avant = parseFloat((b as HTMLElement).style.left);
    expect(b.querySelectorAll('[data-jalon]').length).toBeGreaterThanOrEqual(3);
    glisser(b, colonne());
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'batches', id: 'LOT-MINI' });
    expect(JSON.stringify(appels[0].patch)).toMatch(/2026-12-07|07\.12\.2026/);
    await waitFor(() => expect(parseFloat((barre(/^Mini/) as HTMLElement).style.left)).toBeCloseTo(avant + colonne(), 0));
    expect(barre(/^Mini/).querySelectorAll('[data-jalon]').length).toBeGreaterThanOrEqual(3);
    fireEvent.click(within(await screen.findByRole('status')).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(parseFloat((barre(/^Mini/) as HTMLElement).style.left)).toBeCloseTo(avant, 0));
  });

  it('le jalon de fin glissé écrit finPrevue', async () => {
    const { appels } = monter({ etat: etat() });
    const fin = barre(/^Mini/).querySelector('[data-jalon="conditionnement"]')!;
    glisser(fin, colonne());
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'batches', id: 'LOT-MINI', patch: { finPrevue: '2026-12-10' } });
  });

  it('un jalon intermédiaire ne déplace rien : « … suit la recette du brassin · Ouvrir le brassin › », un seul message', async () => {
    const onOpenBatch = vi.fn();
    const { appels } = monter({ etat: etat(), callbacks: { onOpenBatch } });
    const dry = barre(/^Mini/).querySelector('[data-jalon="dry-hop"]')!;
    glisser(dry, 30);
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/suit la recette du brassin ?· ?Ouvrir le brassin ›/);
    expect(messages()).toHaveLength(1);
    expect(appels).toHaveLength(0);
    fireEvent.click(within(m).getByRole('button', { name: /Ouvrir le brassin ›/ }));
    expect(onOpenBatch).toHaveBeenCalledWith('LOT-MINI');
  });
});

describe('C16 (D-67, D-93, E46) : Retirer, la poche « Sans date », Poser, Fait', () => {
  it('Retirer une fête : « Sans date › » ; un toucher ouvre la Liste sur la poche ; « Poser » rouvre la feuille et la remet sur la frise', async () => {
    const { appels } = monter();
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Retirer/ }));
    const m = await screen.findByRole('status');
    expect(m.textContent).toContain('Sans date ›');
    fireEvent.click(within(m).getByRole('button', { name: 'Sans date ›' }));
    const poche = await waitFor(() => { const p = document.querySelector('[data-poche]'); if (!p) throw new Error('pas de poche'); return p as HTMLElement; });
    expect(within(poche).getByText('Marché de Noël')).toBeInTheDocument();
    fireEvent.click(within(poche).getByRole('button', { name: /Marché de Noël/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Poser' }));
    const feuille = screen.getByRole('dialog', { name: 'Fêtes' });
    fireEvent.click(within(feuille).getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(appels.some(a => a.id === 'CR-NOEL' && typeof a.patch?.date === 'string' && a.patch.date !== '')).toBe(true));
    await waitFor(() => expect(document.querySelector('[data-calendrier]')!.getAttribute('data-vue')).toBe('semaines'));
    expect(await screen.findByRole('button', { name: /^Marché de Noël/ })).toHaveAttribute('data-barre');
  });

  it('une tâche sans date « Fait » d’un toucher quitte la poche', async () => {
    const { appels } = monter();
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    const menu = within(screen.getByRole('dialog', { name: 'Période et vue' }));
    fireEvent.click(menu.getByRole('button', { name: /Sans date · 1/ }));
    const poche = await waitFor(() => { const p = document.querySelector('[data-poche]'); if (!p) throw new Error('pas de poche'); return p as HTMLElement; });
    fireEvent.click(within(poche).getByRole('button', { name: /Appeler l’assurance/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Fait/ }));
    await waitFor(() => expect(appels.some(a => a.id === 'CR-SANS' && a.patch?.status === 'done')).toBe(true));
    await waitFor(() => expect(document.querySelector('[data-poche]')).toBeNull());
  });

  it('poche vide : aucun texte « Sans date » dans l’onglet', () => {
    monter({ etat: { ...etatBanc(JOUR), items: etatBanc(JOUR).items.filter(i => i.id !== 'CR-SANS') } });
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    expect(document.body.textContent).not.toMatch(/Sans date/);
  });
});

describe('C19 (D-71) : « Budget › » d’un brassin', () => {
  it('toucher un brassin, puis « Budget › », appelle onOuvrirBudget une fois avec l’id du brassin', () => {
    const onOuvrirBudget = vi.fn();
    monter({ callbacks: { onOuvrirBudget } });
    toucher(barre(/^Blonde d’automne, 23 nov/));
    const d = within(screen.getByRole('region', { name: /Détail : Blonde d’automne/ }));
    expect(d.getByRole('button', { name: /Ouvrir le brassin/ })).toBeInTheDocument();
    fireEvent.click(d.getByRole('button', { name: 'Budget ›' }));
    expect(onOuvrirBudget).toHaveBeenCalledTimes(1);
    expect(onOuvrirBudget).toHaveBeenCalledWith('LOT-BLONDE');
  });
});
