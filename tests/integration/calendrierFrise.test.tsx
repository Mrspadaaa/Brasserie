import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier, etatBanc, type EtatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, lundiDe } from '../../src/domain/calendrier';
import type { Batch, Recipe } from '../../src/types';

const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
/** Une période « du … au » de n semaines à partir du lundi du jour (la période de l'app). */
const plage = (semaines: number, du = L) => ({ genre: 'dates' as const, du, au: ajouterJours(du, semaines * 7 - 1) });

beforeEach(() => {
  localStorage.clear();
  /* l'état d'écran gardé vit dans le cache du service : on le remet à zéro entre deux tests */
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const down = (el: Element, x = 10) => fireEvent.pointerDown(el, { clientX: x, clientY: 10, pointerId: 1, button: 0 });
const move = (el: Element, x: number) => fireEvent.pointerMove(el, { clientX: x, clientY: 10, pointerId: 1 });
const up = (el: Element, x = 10) => fireEvent.pointerUp(el, { clientX: x, clientY: 10, pointerId: 1 });
const toucher = (el: Element) => { down(el); up(el); };
const appuiLong = (el: Element) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  down(el);
  act(() => { vi.advanceTimersByTime(500); });
  vi.useRealTimers();
  up(el);
};
const largeurColonne = () => Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur-colonne'));
const rangee = (nom: string) => document.querySelector(`section[data-rangee][aria-label="${nom}"]`) as HTMLElement;
const monter = (props: React.ComponentProps<typeof BancCalendrier> = {}) => render(<BancCalendrier aujourdhui={JOUR} sansChrome {...props} />);
const dialogue = (nom: string) => within(screen.getByRole('dialog', { name: nom }));

describe('C2 : sept rangées en clair, carrés +, œil', () => {
  it('les 7 rangées sont dans l’ordre, avec leur nom ; chaque carré + est dans une colonne ; aucune case « + » en pointillé', () => {
    monter();
    const noms = [...document.querySelectorAll('section[data-rangee] > header h3')].map(h => h.textContent);
    expect(noms).toEqual(['Brassins', 'Fêtes', 'Ventes', 'Achats', 'Travaux', 'Activités', 'Papiers']);
    const plus = [...document.querySelectorAll('button[data-plus]')];
    expect(plus).toHaveLength(7);
    expect(document.querySelectorAll('[data-chose][data-vide], .cal-pose, [data-case-plus]')).toHaveLength(0);
    expect(screen.getByText('banc — données simulées')).toBeInTheDocument();
  });

  it('chaque carré + ouvre la feuille d’ajout déjà réglée sur sa rangée', () => {
    monter();
    for (const [id, nom] of [['brassins', 'Brassins'], ['fetes', 'Fêtes'], ['ventes', 'Ventes'], ['achats', 'Achats'], ['travaux', 'Travaux'], ['activites', 'Activités'], ['papiers', 'Papiers']] as const) {
      fireEvent.click(document.querySelector(`button[data-plus="${id}"]`)!);
      const d = screen.getByRole('dialog', { name: nom });
      expect(d.querySelector(`[data-feuille-rangee="${id}"]`)).not.toBeNull();
      fireEvent.click(within(d).getByRole('button', { name: nom, pressed: true }));
      fireEvent.keyDown(d, { key: 'Escape' });
      cleanup();
      monter();
    }
  });

  it('l’œil masque la rangée, « n choses cachées » s’affiche et un toucher la réaffiche', () => {
    monter();
    expect(within(rangee('Achats')).getAllByRole('button').some(b => /^Hotte/.test(b.getAttribute('aria-label') ?? '') || b.hasAttribute('data-marque'))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Masquer Achats' }));
    const cachees = within(rangee('Achats')).getByRole('button', { name: /Afficher Achats : \d+ chose/ });
    expect(cachees).toHaveTextContent(/^\d+ choses? cachées?$/);
    expect(within(rangee('Achats')).queryByRole('button', { name: /^Hotte/ })).toBeNull();
    fireEvent.click(cachees);
    expect(within(rangee('Achats')).getByRole('button', { name: /^Hotte/ })).toBeInTheDocument();
  });
});

describe('C9 : aucune donnée « exemple » ; vide, la frise garde ses sept rangées', () => {
  it('sans rien de posé : 7 rangées « vide », le + reste la voie d’ajout, le mot exemple n’apparaît pas', () => {
    const vide: EtatBanc = { batches: [], plans: [], items: [], recettes: [], clients: [], transactions: [] };
    monter({ etat: vide });
    expect(document.querySelectorAll('section[data-rangee]')).toHaveLength(7);
    expect(document.querySelectorAll('.cal-vide')).toHaveLength(7);
    expect(document.querySelectorAll('button[data-plus]')).toHaveLength(7);
    expect(document.body.textContent?.toLowerCase()).not.toContain('exemple');
    expect(document.body.textContent).not.toMatch(/Sans date/);
  });
});

describe('C8 : une barre de moins de 24 px devient une marque (3 mois, 6 mois, An)', () => {
  const marqueHotte = () => document.querySelector('[data-marque][data-rangee="achats"]');
  const nomsBarres = () => [...document.querySelectorAll('[data-barre]')].map(b => b.getAttribute('aria-label') ?? '');

  it('en 3 mois et en 6 mois : la chose d’une semaine est une marque nommée, aucune barre n’est plus étroite que 24 px', () => {
    for (const semaines of [13, 26]) {
      monter({ callbacks: { periode: plage(semaines) } });
      const lc = largeurColonne();
      expect(lc * semaines).toBeCloseTo(360, 0);
      const marque = [...document.querySelectorAll('[data-marque]')].find(m => /^Hotte/.test(m.getAttribute('aria-label') ?? ''));
      expect(marque, `${semaines} sem. : Hotte devient une marque`).toBeTruthy();
      expect(marque!.getAttribute('aria-label')).toMatch(/^Hotte, 30 nov\., S49/);
      for (const b of document.querySelectorAll<HTMLElement>('[data-barre]')) expect(parseFloat(b.style.width)).toBeGreaterThanOrEqual(24);
      cleanup();
    }
    expect(nomsBarres()).toEqual([]);
  });

  it('en An : les choses gardent leur vraie durée, la courte devient une marque', () => {
    monter();
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /^An/ }));
    expect(document.querySelector('[data-calendrier]')!.getAttribute('data-vue')).toBe('annee');
    expect(document.querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('12');
    expect(marqueHotte()).not.toBeNull();
    for (const b of document.querySelectorAll<HTMLElement>('[data-barre]')) expect(parseFloat(b.style.width)).toBeGreaterThanOrEqual(24);
  });

  it('un appui long sur la marque ouvre 6 semaines centrées sur sa semaine, où la chose est une barre', () => {
    monter({ callbacks: { periode: plage(13) } });
    const marque = [...document.querySelectorAll('[data-marque]')].find(m => /^Hotte/.test(m.getAttribute('aria-label') ?? ''))!;
    appuiLong(marque);
    expect(document.querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('6');
    expect(screen.getByRole('button', { name: /^Hotte/ })).toHaveAttribute('data-barre');
  });
});

describe('C14 : épingles, étoiles, rangées masquées, ordre : gardés ; le filtre, non', () => {
  const ouvrirMenu = (nom: RegExp) => appuiLong(screen.getByRole('button', { name: nom }));
  it('épingler, étoiler, masquer, trier : tout revient après fermeture et réouverture de l’onglet', async () => {
    const { unmount } = monter();
    ouvrirMenu(/^Marché de Noël/);
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Épingler/ }));
    ouvrirMenu(/^Noël privés/);
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Étoile/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Masquer Achats' }));
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /Trier les rangées/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Trier les rangées' })).getByRole('button', { name: 'Monter Papiers' }));
    expect(StorageService.getUiState<string[]>('calendrier_epingles', [])).toEqual([expect.stringMatching(/Marché de Noël|CR-NOEL/)]);
    expect(StorageService.getUiState<string[]>('calendrier_etoiles', [])).toHaveLength(1);
    expect(StorageService.getUiState<string[]>('calendrier_masquees', [])).toEqual(['achats']);
    const ordre = StorageService.getUiState<string[]>('calendrier_ordre', []);
    expect(ordre.indexOf('papiers')).toBe(5);
    unmount(); cleanup();

    monter();
    const noms = [...document.querySelectorAll('section[data-rangee] > header h3')].map(h => h.textContent);
    expect(noms).toEqual(['Brassins', 'Fêtes', 'Ventes', 'Achats', 'Travaux', 'Papiers', 'Activités']);
    expect(within(rangee('Achats')).getByRole('button', { name: /Afficher Achats : \d+ chose/ })).toBeInTheDocument();
    expect(document.querySelector('[data-etoile-courbe]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /^Marché de Noël/ }).className).toContain('cal-epi');
  });

  it('« Fêtes seules » ne laisse que Fêtes et les choses épinglées ; « Tout afficher » rend les 7 rangées ; le filtre ne revient pas', async () => {
    const { unmount } = monter();
    ouvrirMenu(/^Hotte/);
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Épingler/ }));
    ouvrirMenu(/^Marché de Noël/);
    fireEvent.click(await screen.findByRole('menuitem', { name: /Fêtes seules/ }));
    const noms = [...document.querySelectorAll('section[data-rangee] > header h3')].map(h => h.textContent);
    expect(noms).toEqual(['Fêtes', 'Achats']);
    expect(within(rangee('Achats')).getByRole('button', { name: /^Hotte/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tout afficher' }));
    expect(document.querySelectorAll('section[data-rangee]')).toHaveLength(7);
    ouvrirMenu(/^Marché de Noël/);
    fireEvent.click(await screen.findByRole('menuitem', { name: /Fêtes seules/ }));
    expect(document.querySelectorAll('section[data-rangee]')).toHaveLength(2);
    unmount(); cleanup();
    monter();
    expect(document.querySelectorAll('section[data-rangee]')).toHaveLength(7);
  });

  it('une chose épinglée d’une rangée masquée reste visible', async () => {
    monter();
    ouvrirMenu(/^Hotte/);
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Épingler/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Masquer Achats' }));
    expect(within(rangee('Achats')).getByRole('button', { name: /^Hotte/ })).toBeInTheDocument();
    expect(within(rangee('Achats')).getByRole('button', { name: /Afficher Achats : \d+ chose/ })).toBeInTheDocument();
  });
});

describe('C15 : la feuille Travaux : une fenêtre et des jours actifs, sans clavier', () => {
  const ouvrirTravaux = () => { fireEvent.click(document.querySelector('button[data-plus="travaux"]')!); return dialogue('Travaux'); };
  const semaine = (d: ReturnType<typeof dialogue>, nom: RegExp) => fireEvent.click(d.getByRole('group', { name: 'Semaine' }).querySelector(`button[data-semaine]`) && within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: nom }));

  it('puce de nom, S20, S40, 5 j : « S20 → S40 · 21 sem. » ; « Ajouter » écrit la fenêtre ; la barre va de S20 à S40 avec 5 points', async () => {
    const appels: Array<{ op: string; collection: string; patch?: Record<string, unknown> }> = [];
    monter({ onAppel: a => appels.push(a), callbacks: { periode: plage(52) } });
    const d = ouvrirTravaux();
    fireEvent.click(d.getByRole('button', { name: 'Sols : colle et joints' }));
    semaine(d, /^S20/);
    semaine(d, /^S40/);
    fireEvent.click(d.getByRole('button', { name: '5 j' }));
    expect(d.getByText('S20 → S40 · 21 sem.')).toBeInTheDocument();
    const champ = d.getByLabelText('Montant en CHF');
    expect(champ).toHaveAttribute('inputmode', 'decimal');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '600' } }); fireEvent.blur(champ);
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
    fireEvent.click(d.getByRole('button', { name: 'Ajouter' }));
    await waitFor(() => expect(appels.some(a => a.op === 'creer' && a.collection === 'financialPlans')).toBe(true));
    const plan = appels.find(a => a.op === 'creer')!.patch as { fenetre: unknown; amountCents: number; category: string; date: string };
    expect(plan.fenetre).toEqual({ du: '2027-05-17', au: '2027-10-10', joursActifs: 5 });
    expect(plan.amountCents).toBe(60000);
    expect(plan.category).toBe('renovation');
    expect(plan.date).toBe('2027-05-17');
    const barre = await screen.findByRole('button', { name: /^Sols : colle et joints, .*S20/ });
    expect(barre.querySelectorAll('[data-point]')).toHaveLength(5);
  });

  it('toucher une semaine avant S20 repart d’une seule semaine ; une vente ne prend qu’une date', () => {
    monter({ callbacks: { periode: plage(52) } });
    const d = ouvrirTravaux();
    semaine(d, /^S20/); semaine(d, /^S40/);
    expect(d.getByText('S20 → S40 · 21 sem.')).toBeInTheDocument();
    semaine(d, /^S10/);
    expect(d.queryByText(/→/)).toBeNull();
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Travaux' }), { key: 'Escape' });
    cleanup();
    monter({ callbacks: { periode: plage(52) } });
    fireEvent.click(document.querySelector('button[data-plus="ventes"]')!);
    const v = dialogue('Ventes');
    semaine(v, /^S20/); semaine(v, /^S40/);
    expect(v.queryByText(/→/)).toBeNull();
    expect(v.queryByRole('group', { name: 'Jours actifs' })).toBeNull();
    expect(within(v.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: /^S40/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('C18 : propositions en pointillé, acceptées d’un toucher (E47)', () => {
  const stout = (n: number, jour: string): Batch => ({
    id: `LOT-S${n}`, name: 'Stout maison', style: 'Stout', volumeL: 100, brewDate: `${jour.slice(8)}.${jour.slice(5, 7)}.${jour.slice(0, 4)}`, status: 'conditionne', recipeRef: 'R-STOUT', gravityLog: [],
    bottlingDate: `${jour.slice(8)}.${jour.slice(5, 7)}.${jour.slice(0, 4)}`
  } as unknown as Batch);
  const etat = (nb: number): EtatBanc => {
    const base = etatBanc('2026-05-15');
    return { ...base, batches: ['2026-01-06', '2026-03-03', '2026-04-28'].slice(3 - nb).map((j, i) => stout(i, j)), plans: [], items: [], transactions: [], recettes: [{ id: 'R-STOUT', name: 'Stout maison', style: 'Stout', volumeL: 100 } as unknown as Recipe] };
  };
  const monterMai = (nb = 3, extra: React.ComponentProps<typeof BancCalendrier>['callbacks'] = {}, onAppel?: React.ComponentProps<typeof BancCalendrier>['onAppel']) =>
    render(<BancCalendrier aujourdhui="2026-05-15" sansChrome etat={etat(nb)} onAppel={onAppel} callbacks={{ periode: plage(13, '2026-05-11'), ...extra }} />);

  it('trois brassages : la chose proposée est en pointillé en S26 ; un toucher ouvre la feuille Brassins prête ; « Ajouter » écrit la semaine', async () => {
    const appels: Array<{ op: string; collection: string; patch?: Record<string, unknown> }> = [];
    monterMai(3, {}, a => appels.push(a));
    const p = document.querySelector('[data-proposition="brassin-habituel"]') as HTMLElement;
    expect(p).not.toBeNull();
    expect(p.getAttribute('aria-label')).toMatch(/Stout maison.*proposé.*S26/);
    toucher(p);
    const d = dialogue('Brassins');
    expect(d.getByRole('button', { name: 'Stout maison', pressed: true })).toBeInTheDocument();
    expect(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: /^S26/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /Plus de détails/ })).toBeNull();
    expect(document.querySelector('[data-quick-action], [role="dialog"][aria-label="Nouvelle action"]')).toBeNull();
    fireEvent.click(d.getByRole('button', { name: 'Ajouter' }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels.find(a => a.op === 'creer')!.patch).toMatchObject({ recipeRef: 'R-STOUT', plannedBrewDate: '2026-06-22' });
    await waitFor(() => expect(document.querySelector('[data-proposition="brassin-habituel"]')).toBeNull());
    const pose = [...document.querySelectorAll('[data-chose]')].find(c => /^Stout maison, 22 juin, S26/.test(c.getAttribute('aria-label') ?? ''));
    expect(pose).toBeTruthy();
    expect(pose!.hasAttribute('data-probable')).toBe(false);
  });

  it('un seul brassage : aucune chose proposée dans Brassins', () => {
    monterMai(1);
    expect(document.querySelector('[data-proposition="brassin-habituel"]')).toBeNull();
  });

  it('une échéance récurrente non payée est en pointillé ; un toucher ouvre Finances', () => {
    const onOpenFinances = vi.fn();
    monter({ callbacks: { onOpenFinances, periode: plage(13) } });
    const e = document.querySelector('[data-proposition="echeance"]') as HTMLElement;
    expect(e).not.toBeNull();
    toucher(e);
    expect(onOpenFinances).toHaveBeenCalledTimes(1);
  });
});
