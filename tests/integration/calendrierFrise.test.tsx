import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier, etatBanc, type EtatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, anneeEnMois, etiquetteS, lundiDe, type ChoseCalendrier, type JalonBrassin } from '../../src/domain/calendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { disposer, largeurEtiquette, pastille, texteCaddie, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { Barre, formesDuree, montantBarre } from '../../src/ui/calendrier/frise/Barre';
import { largeurTexte, nomAccessible } from '../../src/ui/calendrier/frise/Marque';
import { Frise } from '../../src/ui/calendrier/frise/Frise';
import { DetailChose } from '../../src/ui/calendrier/frise/DetailChose';
import { VueListe } from '../../src/ui/calendrier/frise/VueListe';
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
    /* CRITIQUE-5 n° 2 (lot 1) : les mois de toutes les semaines de la courbe : douze, ou treize quand la dernière semaine y tombe */
    expect(document.querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe(String(anneeEnMois(JOUR).length));
    expect(anneeEnMois(JOUR).length).toBeGreaterThanOrEqual(12);
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
    /* le segment de critères (k15) : « Date » range les rangées et le critère reste gardé */
    fireEvent.click(within(document.querySelector('[data-tri-seg]') as HTMLElement).getByRole('button', { name: 'Date' }));
    expect(StorageService.getUiState<string[]>('calendrier_epingles', [])).toEqual([expect.stringMatching(/Marché de Noël|CR-NOEL/)]);
    expect(StorageService.getUiState<string[]>('calendrier_etoiles', [])).toHaveLength(1);
    expect(StorageService.getUiState<string[]>('calendrier_masquees', [])).toEqual(['achats']);
    const ordre = StorageService.getUiState<string[]>('calendrier_ordre', []);
    expect(ordre).toHaveLength(7);
    const ordreNoms = [...document.querySelectorAll('section[data-rangee] > header h3')].map(h => h.textContent);
    unmount(); cleanup();

    monter();
    const noms = [...document.querySelectorAll('section[data-rangee] > header h3')].map(h => h.textContent);
    expect(noms).toEqual(ordreNoms);
    expect(within(rangee('Achats')).getByRole('button', { name: /Afficher Achats : \d+ chose/ })).toBeInTheDocument();
    /* l'étoile revient sur la marque ; sa ligne sur la courbe est prouvée par les tests b6 de l'en-tête (jsdom n'y mesure aucune largeur) */
    expect(screen.getByRole('button', { name: /^Noël privés/ }).querySelector('.cal-etoile, .lucide-star')).not.toBeNull();
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
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
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

describe('CRITIQUE-2 (corr. 2, L2) : ventes sans chevauchement, caddies nommés, ajout qui réaffiche sa rangée', () => {
  it('n° 40 : deux ventes de la même semaine ont des boîtes disjointes', () => {
    const etat = etatBanc(JOUR);
    etat.plans.push({ ...etat.plans.find(p => p.id === 'P-NOEL-PRIVES')!, id: 'P-NOEL-2', title: 'Noël entreprises' });
    monter({ etat });
    const boites = [...rangee('Ventes').querySelectorAll<HTMLElement>('[data-marque], [data-barre]')]
      .filter(e => /^Noël/.test(e.getAttribute('aria-label') ?? ''))
      .map(e => ({ g: parseFloat(e.style.left), h: parseFloat(e.style.top), l: parseFloat(e.style.width), t: parseFloat(e.style.height) }));
    expect(boites).toHaveLength(2);
    const [a, b] = boites;
    expect(a.g + a.l <= b.g || b.g + b.l <= a.g || a.h + a.t <= b.h || b.h + b.t <= a.h).toBe(true);
  });

  it('n° 11 : aucune file de caddies anonymes dans Achats ; les courses d’un brassin se lisent sur sa barre, son caddie porte son nom', () => {
    monter();
    /* plus aucune sortie dérivée d'un brassin dans Achats (« Énergie · Saison de ferme ») */
    expect([...rangee('Achats').querySelectorAll('[data-chose]')].filter(m => / · (Saison de ferme|Blonde d’automne|Porter d’hiver|IPA de printemps)/.test(m.getAttribute('aria-label') ?? ''))).toHaveLength(0);
    const avecCourses = [...rangee('Brassins').querySelectorAll('[data-barre]')].filter(b => /courses : /.test(b.getAttribute('aria-label') ?? ''));
    expect(avecCourses.length).toBeGreaterThan(0);
    for (const c of [...document.querySelectorAll('[data-brassin-lie], [data-jalon="commander"]')]) expect(c.getAttribute('aria-label')).toMatch(/ · \S/);
  });

  it('n° 15 : un ajout dans une rangée masquée la réaffiche', async () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Masquer Fêtes' }));
    expect(screen.getAllByRole('button', { name: /^Afficher Fêtes/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter dans Fêtes' }));
    const d = within(screen.getByRole('dialog'));
    fireEvent.click(d.getByRole('button', { name: 'Marché de Noël' }));
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Masquer Fêtes' })).toBeInTheDocument());
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
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
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

describe('CRITIQUE-3 (lot t3-c-frise) : marque, détail, pastille « lié à », liste, feuille', () => {
  const treize = Array.from({ length: 13 }, (_, i) => ({ debut: ajouterJours(L, 7 * i), fin: ajouterJours(L, 7 * i + 6), etiquette: `S${47 + i}` }));
  const chose = (p: Partial<ChoseCalendrier> & Pick<ChoseCalendrier, 'id' | 'rangee' | 'titre' | 'debut' | 'fin'>): ChoseCalendrier => ({
    source: { genre: 'creative', id: p.id, type: 'event' } as ChoseCalendrier['source'], ouvre: { ecran: 'agenda', id: p.id }, deplacable: true, ...p
  });
  const frise = (choses: ChoseCalendrier[], extra: Partial<React.ComponentProps<typeof Frise>> = {}) => {
    const barre = { onToucher: vi.fn(), onAppuiLong: vi.fn(), onGlisse: vi.fn(), onLacheGlisse: vi.fn(), onBord: vi.fn(), onLacheBord: vi.fn(), onRefus: vi.fn() };
    render(
      <Frise
        choses={choses} colonnes={treize} paysage={false} ordre={[]} masquees={[]} filtre={null} epingles={[]} etoiles={[]} drag={null} largeurRepli={844}
        onAjouter={vi.fn()} onBasculerMasque={vi.fn()} barre={barre} {...extra}
      />
    );
    return barre;
  };

  it('c3 (n° 5, D-199) : en 3 mois, l’appui long sur une marque appelle onSixSemaines avec la chose, sans menu ; le toucher court donne son nom', () => {
    const vente = chose({ id: 'V-CIGOGNE', rangee: 'ventes', titre: '3 fûts La Cigogne', debut: ajouterJours(L, 35), fin: ajouterJours(L, 35), centimes: 90000 });
    const onSixSemaines = vi.fn();
    const barre = frise([vente], { onSixSemaines });
    const m = document.querySelector('[data-marque][data-chose="V-CIGOGNE"]')!;
    expect(m).not.toBeNull();
    expect(m.getAttribute('aria-label')).toMatch(/^3 fûts La Cigogne/);
    appuiLong(m);
    expect(onSixSemaines).toHaveBeenCalledTimes(1);
    expect(onSixSemaines).toHaveBeenCalledWith(vente);
    expect(barre.onAppuiLong).not.toHaveBeenCalled();
    toucher(m);
    expect(barre.onToucher).toHaveBeenCalledTimes(1);
    /* sans la prop : rien, ni menu ni vue */
    cleanup();
    const b2 = frise([vente]);
    appuiLong(document.querySelector('[data-marque][data-chose="V-CIGOGNE"]')!);
    expect(b2.onAppuiLong).not.toHaveBeenCalled();
  });

  it('c4 (n° 2) : le détail d’un brassin liste ses 5 étapes datées, nomme les courses qui manquent, sans « . . »', () => {
    const j = (id: JalonBrassin['id'], libelle: string, ecart: number): JalonBrassin => ({ id, libelle, jour: ajouterJours('2026-11-09', ecart), ecart, glissable: id === 'conditionnement' ? 'fin' : id === 'brassage' ? 'barre' : false });
    const commander = { ...j('commander', 'Commander', -5), articles: ['Malt', 'Houblon'] } as JalonBrassin;
    const ipa = chose({
      id: 'brassin-IPA', rangee: 'brassins', titre: 'IPA de printemps', debut: '2026-11-09', fin: '2026-12-07', preteLe: '2026-12-07',
      source: { genre: 'batch', id: 'IPA', statut: 'fermenting' } as ChoseCalendrier['source'], ouvre: { ecran: 'brassin', id: 'IPA' },
      jalons: [j('brassage', 'Brassage', 0), j('fermentation', 'Fermentation', 1), j('dry-hop', 'Dry hop', 7), j('garde', 'Garde', 14), j('conditionnement', 'Conditionnement', 28), commander]
    });
    const { container } = render(<DetailChose chose={ipa} onFermer={vi.fn()} onOuvrir={vi.fn()} onCommander={vi.fn()} />);
    for (const nom of ['Brassage', 'Fermentation', 'Dry hop', 'Garde', 'Conditionnement']) expect(within(container).getByText(nom)).toBeInTheDocument();
    expect(container.textContent).toMatch(/[Mm]alt, houblon/);
    expect(container.textContent).toMatch(/Il manque malt, houblon : à acheter avant le 4 nov\./);
    expect(container.textContent).not.toMatch(/\. \.|\.\./);
    cleanup();
    const sans = { ...ipa, jalons: [j('brassage', 'Brassage', 0), j('commander', 'Commander', -5)] };
    const r2 = render(<DetailChose chose={sans} onFermer={vi.fn()} onOuvrir={vi.fn()} />);
    expect(r2.container.textContent).toMatch(/Il manque des courses : à acheter avant le 4 nov\.(?!\s*\.)/);
    expect(r2.container.textContent).not.toMatch(/\. \.|\.\./);
  });

  it('c5 (n° 13) : une chose liée porte la pastille « lié à La Cigogne », qui se touche et montre l’aperçu sur place', () => {
    const fete = chose({ id: 'CR-NOEL', rangee: 'fetes', titre: 'Marché de Noël', debut: ajouterJours(L, 35), fin: ajouterJours(L, 35), centimes: 118000, lie: { texte: 'lié à La Cigogne', apercu: 'La Cigogne · client · 3 fûts', client: 'La Cigogne' } });
    const barre = frise([fete], { paysage: false, colonnes: treize.slice(0, 6) });
    const p = screen.getByRole('button', { name: 'lié à La Cigogne : aperçu' });
    expect(p).toHaveTextContent('lié à La Cigogne');
    fireEvent.click(p);
    expect(screen.getByRole('note')).toHaveTextContent('La Cigogne · client · 3 fûts');
    expect(barre.onToucher).not.toHaveBeenCalled();
  });

  it('c6 (n° 35, n° 37) : la Liste met le brassin en cuve dans « En cours », « À venir » commence aujourd’hui ; « Sans date · 1 »', () => {
    const ipa = chose({ id: 'brassin-IPA', rangee: 'brassins', titre: 'IPA de printemps', debut: '2026-11-09', fin: '2026-12-07', preteLe: '2026-12-07', source: { genre: 'batch', id: 'IPA', statut: 'fermenting' } as ChoseCalendrier['source'] });
    const fete = chose({ id: 'CR-NOEL', rangee: 'fetes', titre: 'Marché de Noël', debut: '2026-12-21', fin: '2026-12-21' });
    const poche = chose({ id: 'CR-ASSU', rangee: 'activites', titre: 'Appeler l’assurance', debut: '', fin: '', sansDate: true });
    render(<VueListe choses={[ipa, fete]} sansDate={[poche]} aujourdhui={JOUR} onChose={vi.fn()} />);
    const aVenir = [...document.querySelectorAll('[data-a-venir-mois] [data-liste-chose]')].map(e => e.getAttribute('data-liste-chose'));
    expect(aVenir[0]).toBe('CR-NOEL');
    expect(aVenir).not.toContain('brassin-IPA');
    expect(document.querySelector('[data-en-cours] [data-liste-chose="brassin-IPA"]')).not.toBeNull();
    expect(screen.getByText('Sans date · 1')).toBeInTheDocument();
    expect(screen.queryByText(/Sans Date/)).toBeNull();
  });

  it('c7 (n° 28, E34) : à 390, la feuille d’ajout montre 13 semaines dans sa largeur, cases de 24 px au moins, et défile jusqu’à S20 et au-delà', () => {
    const W0 = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 390 });
    try {
      monter({ callbacks: { periode: plage(52) } });
      fireEvent.click(document.querySelector('button[data-plus="travaux"]')!);
      const groupe = dialogue('Travaux').getByRole('group', { name: 'Semaine' });
      expect(groupe).toHaveAttribute('data-visibles', '13');
      const cases = [...groupe.querySelectorAll<HTMLElement>('button[data-semaine]')];
      expect(cases.length).toBeGreaterThanOrEqual(52);
      const w = parseFloat(cases[0].style.width);
      expect(w).toBeGreaterThanOrEqual(24);
      expect(13 * w + 12 * 4).toBeLessThanOrEqual(390 - 24);
      expect(within(groupe).getByRole('button', { name: /^S20,/ })).toBeInTheDocument();
      expect(within(groupe).getByRole('button', { name: /^S40,/ })).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: W0 });
    }
  });
});

describe('CRITIQUE-4 (lot q3-donnees) : Lier, filtre, fenêtre au pied, vente habituelle', () => {
  const pastilles = (r: string) => [...(document.querySelector(`section[data-rangee="${r}"]`) as HTMLElement).querySelectorAll('button')].filter(b => /^lié à La Cigogne/.test(b.getAttribute('aria-label') ?? '')).length;

  it('n° 6 (D-126) : Lier « Noël privés » à La Cigogne écrit clientId, la pastille vient aussitôt, l’aperçu s’ouvre, « Liée à La Cigogne · Annuler » ; Annuler l’ôte', async () => {
    const appels: Array<{ op: string; collection: string; id: string; patch?: Record<string, unknown> }> = [];
    monter({ onAppel: a => appels.push(a) });
    const avant = pastilles('ventes');
    appuiLong(screen.getByRole('button', { name: /^Noël privés/ }));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Lier à un brassin, un client/ }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /La Cigogne/ }));
    await waitFor(() => expect(appels).toContainEqual(expect.objectContaining({ op: 'patch', collection: 'financialPlans', id: 'P-NOEL-PRIVES', patch: { clientId: 'CL-CIGOGNE' } })));
    await waitFor(() => expect(pastilles('ventes')).toBe(avant + 1));
    const message = screen.getAllByRole('status').find(s => /Liée à La Cigogne/.test(s.textContent ?? ''));
    expect(message).toBeDefined();
    /* l'aperçu sur place : le détail de la chose, avec la ligne du lien */
    const det = screen.getByRole('region', { name: /^Détail : Noël privés/ });
    expect(det.querySelector('[data-apercu-lien]')?.textContent).toMatch(/lié à La Cigogne/);
    /* le « click » fantôme qui suit le lâcher (même endroit, aussitôt) n'annule rien ; un vrai toucher, plus tard, annule */
    fireEvent.click(within(message!).getByRole('button', { name: /Annuler/ }));
    expect(pastilles('ventes')).toBe(avant + 1);
    await new Promise(r => setTimeout(r, 450));
    fireEvent.click(within(message!).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(pastilles('ventes')).toBe(avant));
  });

  it('n° 8 (D-5, D-34) : « Achats seuls » ne laisse que Achats et les épinglées ; « 6 rangées masquées · Tout afficher » ; Tout afficher rend les 7 ; non gardé', () => {
    StorageService.setUiState('calendrier_epingles', ['creatif-CR-NOEL']);
    const { unmount } = monter();
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /Filtrer par type/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Filtrer par type' })).getByRole('button', { name: 'Achats seuls' }));
    const ligne = document.querySelector('[data-filtre]')!;
    expect(ligne.textContent).toBe('Achats seuls · 6 rangées masquées · Tout afficher');
    const rangees = [...document.querySelectorAll('section[data-rangee]')].map(s => s.getAttribute('data-rangee'));
    expect(rangees.sort()).toEqual(['achats', 'fetes']);
    expect(screen.getByRole('button', { name: /^Marché de Noël/ })).toBeInTheDocument();
    fireEvent.click(within(ligne as HTMLElement).getByRole('button', { name: 'Tout afficher' }));
    expect(document.querySelectorAll('section[data-rangee]')).toHaveLength(7);
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /Filtrer par type/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Filtrer par type' })).getByRole('button', { name: 'Achats seuls' }));
    unmount(); cleanup();
    monter();
    expect(document.querySelectorAll('section[data-rangee]')).toHaveLength(7);
    expect(document.querySelector('[data-filtre]')).toBeNull();
  });

  it('n° 10 (E45, D-8) : « S20 → S40 · 21 sem. » est au pied de la feuille, hors du corps qui défile ; puces 1, 2, 3, 5, 10 j', () => {
    monter({ callbacks: { periode: plage(52) } });
    fireEvent.click(document.querySelector('button[data-plus="travaux"]')!);
    const d = dialogue('Travaux');
    const sem = (nom: RegExp) => fireEvent.click(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: nom }));
    sem(/^S20/); sem(/^S40/);
    const resume = d.getByText('S20 → S40 · 21 sem.');
    expect(resume.closest('.cal-feuille-corps')).toBeNull();
    expect(resume.closest('[data-fenetre-pied]')).not.toBeNull();
    expect(within(d.getByRole('group', { name: 'Jours actifs' })).getAllByRole('button').map(b => b.textContent)).toEqual(['1 j', '2 j', '3 j', '5 j', '10 j']);
    fireEvent.click(d.getByRole('button', { name: '5 j' }));
    expect(d.getByText(/5 j actifs/)).toBeInTheDocument();
  });

  it('n° 16 (E34, D-39) : Café du Pont propose sa vente habituelle « 1 fût +130 » ; un toucher la choisit (130) sans clavier, sans « Indique un montant »', async () => {
    const appels: Array<{ op: string; collection: string; patch?: Record<string, unknown> }> = [];
    monter({ onAppel: a => appels.push(a) });
    fireEvent.click(document.querySelector('button[data-plus="ventes"]')!);
    const d = dialogue('Ventes');
    const pont = within(d.getByRole('group', { name: 'Clients et ventes probables' })).getByRole('button', { name: 'Café du Pont' });
    expect(pont.textContent).toMatch(/Café du Pont.*1 fût.*\+130/);
    fireEvent.click(pont);
    expect(d.queryByText(/Indique un montant/)).toBeNull();
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.some(a => a.op === 'creer' && a.collection === 'financialPlans')).toBe(true));
    expect(appels.find(a => a.op === 'creer')!.patch).toMatchObject({ amountCents: 13000, direction: 'in', clientId: 'CL-PONT', title: 'Café du Pont, 1 fût' });
    expect(screen.queryByText(/Indique un montant/)).toBeNull();
  });
});

/* ---------- CRITIQUE-5 (tour 5, lot lot2-frise-rangees) ---------- */

/** Les choses du banc, telles que l'onglet les pose (la fixture de la vraie app, `construireModele`). */
function chosesDuBanc(jour = JOUR): ChoseCalendrier[] {
  const e = etatBanc(jour);
  const profile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-01-01', openingCash: { date: '2026-01-01', amountCents: 403200, confirmed: true } };
  return construireModele({
    aujourdhui: jour, transactions: e.transactions, payments: e.paiements ?? [], plans: e.plans, profile: profile as never, assets: [], batches: e.batches, stockItems: [],
    items: e.items, recettes: e.recettes, reglages: e.reglages ?? REGLAGES_VIDES, lignesCourses: e.lignesCourses ?? []
  } as never).choses;
}
/** n semaines, du lundi du jour : les colonnes de la frise. */
const semainesDe = (n: number): Colonne[] => Array.from({ length: n }, (_, i) => {
  const debut = ajouterJours(L, i * 7);
  return { debut, fin: ajouterJours(debut, 6), etiquette: etiquetteS(debut) };
});

describe('CRITIQUE-5 (lot2-frise-rangees) : noms entiers, durée, pastille, échéance, caddie', () => {
  /* les largeurs simulées : la piste à 390 (portrait, 6 semaines), en paysage 844 × 390 (13 semaines) et au 1280 (6 semaines) */
  const VUES = [
    { nom: 'm390', largeur: 366, n: 6, paysage: false, reserve: 76 },
    { nom: 'paysage', largeur: 740, n: 13, paysage: true, reserve: 76 },
    { nom: 'd1280', largeur: 872, n: 6, paysage: false, reserve: 0 }
  ] as const;

  it('n° 14, 26, 28 : aucun nom n’est coupé quand la piste a la place ; nom et montant restent ensemble ; rien ne passe le bord droit', () => {
    const choses = chosesDuBanc();
    const noms = ['Blonde d’automne', 'Ambrée maison', 'Café du Pont, 1 fût', 'IPA de printemps', 'Saison de ferme', 'Livraison Brouwland', '3 fûts La Cigogne', 'Hotte', 'Commande groupée de malt'];
    for (const vue of VUES) {
      const colonnes = semainesDe(vue.n);
      const lc = vue.largeur / vue.n;
      const vueLarge = vue.n > 6;
      const lieCourt = vue.largeur < 700 || vueLarge;
      const bord = vue.largeur - vue.reserve;
      const vus = new Set<string>();
      for (const r of ['brassins', 'fetes', 'ventes', 'achats', 'travaux', 'activites', 'papiers'] as const) {
        const dedans = choses.filter(c => c.rangee === r);
        const { items } = disposer(dedans, colonnes, lc, vue.largeur, { reserveDroite: vue.reserve, paysage: vue.paysage, vueLarge, lieCourt });
        for (const d of items) {
          if (d.marque && !d.avecLibelle) continue;
          const c = d.chose;
          vus.add(c.titre);
          const o0 = d.gauche, o1 = d.gauche + d.largeur;
          const m = montantBarre(c);
          /* nom + montant (+ pastille), sans la durée : ce qui ne doit jamais être coupé */
          const besoin = largeurEtiquette(c, false, lieCourt);
          const nomMontant = largeurTexte(c.etiquette ?? c.titre, 600) + (m ? largeurTexte(m, 700) + 6 : 0);
          const placeLibre = Math.max(bord - o1 - 8, o0 - 8, d.marque ? 0 : d.largeur - 16);
          const ctx = `${vue.nom} · ${c.titre} · ${d.cote} ${Math.round(d.place)} / ${Math.round(besoin)}`;
          /* n° 28 : plus aucun texte en flot ; deux lignes seulement pour une chose liée */
          expect(d.deuxLignes === false || !!c.lie || (d.deuxLignes === 'duree' && c.rangee === 'brassins' && !vue.paysage), ctx).toBe(true);
          if (placeLibre < besoin) continue;
          if (d.cote === 'dedans') expect(d.largeur - 16, ctx).toBeGreaterThanOrEqual(besoin - 1);
          else if (d.deuxLignes === 'nom' || d.deuxLignes === 'duree') expect(d.place, ctx).toBeGreaterThanOrEqual(nomMontant);
          else if (d.deuxLignes === 'nomSeul') expect(d.place, ctx).toBeGreaterThanOrEqual(largeurTexte(c.etiquette ?? c.titre, 600));
          else expect(d.place, ctx).toBeGreaterThanOrEqual(besoin - 4);
          /* n° 28 : l'étiquette posée à droite s'arrête avant le bord (le + volant compris) */
          if (d.cote === 'droite') expect((d.marque ? d.gauche + 28 : o1) + 6 + d.place, ctx).toBeLessThanOrEqual(bord + 1);
        }
      }
      /* les noms de la critique sont bien jugés dans cette vue (sinon le test ne prouverait rien) */
      for (const n of noms) if (choses.some(c => c.titre === n && c.debut <= colonnes[colonnes.length - 1].fin && (c.fin || c.debut) >= colonnes[0].debut)) expect(vus.has(n), `${vue.nom} : ${n}`).toBe(true);
    }
  });

  it('n° 14 : sur le banc à 390, chaque étiquette visible a la largeur de son nom et de son montant (jamais « … »)', () => {
    monter();
    /* les noms de la critique (m390-01, m390-25) ; jsdom estime 7,6 px par lettre, plus large que la police : un nom plus long que la moitié
       de la piste peut y manquer de place, ce que le test de `disposer` ci-dessus juge avec la place libre */
    const critique = /^(Blonde d’automne|Ambrée maison|Café du Pont, 1 fût|IPA de printemps|Saison de ferme|Livraison Brouwland|Hotte|Commande groupée de malt|Stout maison|Porter d’hiver|Marché de Noël|Noël privés|Inventaire du stock)$/;
    const etiquettes = [...document.querySelectorAll<HTMLElement>('.cal-lbl')].filter(l => !l.classList.contains('cal-lbl-caddie') && critique.test(l.querySelector('.cal-lbl-t')?.textContent ?? ''));
    expect(etiquettes.length).toBeGreaterThan(8);
    for (const l of etiquettes) {
      const nom = l.querySelector('.cal-lbl-t')?.textContent ?? '';
      const m = l.querySelector('.cal-lbl-m')?.textContent ?? '';
      const max = parseFloat(l.style.maxWidth);
      /* deux lignes « nomSeul » : le montant est sur la seconde ligne, la première ne porte que le nom */
      const montantDessous = !!l.querySelector('.cal-lbl-l2 .cal-lbl-m');
      const besoin = largeurTexte(nom, 600) + (m && !montantDessous ? largeurTexte(m, 700) + 6 : 0);
      expect(nom.endsWith('…'), nom).toBe(false);
      /* la place libre de la piste, mesurée sur l'objet de l'étiquette (sa barre ou sa marque, juste avant elle) */
      const objet = l.previousElementSibling as HTMLElement;
      const o0 = parseFloat(objet.style.left), w = parseFloat(objet.style.width), bord = Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur'));
      const placeLibre = Math.max(bord - (o0 + w) - 8, o0 - 8, objet.hasAttribute('data-barre') ? w - 16 : 0);
      if (placeLibre < besoin) continue;
      expect(max, `${nom} ${m}`).toBeGreaterThanOrEqual(besoin);
    }
  });

  it('n° 23 : une seule forme de durée, « J0 / 28 » avec ses espaces, pour deux brassins de longueurs différentes ; « · prête … » cède d’abord', () => {
    expect(formesDuree('J0 / 28 · prête 21 déc.')).toEqual(['J0 / 28 · prête 21 déc.', 'J0 / 28']);
    expect(formesDuree('J8 / 28 · prête 7 déc.')).toEqual(['J8 / 28 · prête 7 déc.', 'J8 / 28']);
    expect(formesDuree('pas brassée · prête le 24 nov.')).toEqual(['pas brassée · prête le 24 nov.', 'pas brassée']);
    monter();
    const durees = [...document.querySelectorAll('[data-duree], .cal-lbl-j')].map(e => e.textContent ?? '').filter(t => /^J\d/.test(t));
    const brassins = new Set([...document.querySelectorAll('[data-duree], .cal-lbl-j')].filter(e => /^J\d/.test(e.textContent ?? '')).map(e => e.closest('[data-chose]')?.getAttribute('data-chose') ?? e.parentElement?.previousElementSibling?.getAttribute('data-chose') ?? '?'));
    expect(durees.length).toBeGreaterThanOrEqual(2);
    expect(brassins.size).toBeGreaterThanOrEqual(2);
    for (const t of durees) {
      expect(t).toMatch(/^J\d+ \/ \d+/);
      expect(t).not.toMatch(/J\d+\/\d+/);
    }
  });

  it('n° 19 (E23) : une rangée dont un brassin a un coût à venir le dit en mots, jamais « 1 » seul', () => {
    const colonnes = semainesDe(6);
    const base: ChoseCalendrier = {
      id: 'brassin-ZZ', rangee: 'brassins', titre: 'ZZ TEST — Blonde du banc', debut: ajouterJours(L, 7), fin: ajouterJours(L, 34),
      source: { genre: 'batch', id: 'ZZ', statut: 'planifie' }, ouvre: { ecran: 'brassin', id: 'ZZ' }, deplacable: true
    } as ChoseCalendrier;
    for (const c of [{ ...base, coutAVenir: true as const }, { ...base, partiel: true }, { ...base, coutAVenir: true as const, partiel: true }]) {
      const p = pastille('brassins', [c], colonnes);
      expect(p.texte).toBe('coût à venir');
      expect(p.lecture).toMatch(/coût à venir/);
      expect(p.lecture).not.toMatch(/0 CHF|solde 0/);
    }
    /* avec un brassin chiffré à côté : le montant, puis « + coût à venir » */
    const chiffre = { ...base, id: 'brassin-Y', titre: 'Stout', centimes: -14200 };
    expect(pastille('brassins', [chiffre, { ...base, coutAVenir: true as const }], colonnes).texte).toMatch(/^−142 \+ coût à venir$/);
    /* jamais un chiffre seul : une chose sans montant se compte en mots */
    const sans = pastille('activites', [{ ...base, rangee: 'activites', source: { genre: 'creative', id: 'A', type: 'event' } } as ChoseCalendrier], colonnes);
    expect(sans.texte).toBe('1 chose');
    expect(sans.texte).not.toMatch(/^\d+$/);
  });

  it('n° 21 (E47 c) : le loyer récurrent se dit « à payer », jamais « proposé » ; la vente probable reste « proposé »', () => {
    const loyer = { id: 'argent-loyer', rangee: 'papiers', titre: 'Loyer du local', debut: ajouterJours(L, 10), fin: ajouterJours(L, 10), proposition: 'echeance', source: { genre: 'plan', id: 'P', origine: 'recurring', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: { raison: 'x' } } as ChoseCalendrier;
    expect(nomAccessible(loyer)).toMatch(/^Loyer du local, à payer, /);
    expect(nomAccessible(loyer)).not.toMatch(/proposé/);
    expect(nomAccessible({ ...loyer, proposition: 'vente' })).toMatch(/proposé/);
    expect(nomAccessible({ ...loyer, proposition: 'brassin-habituel' })).toMatch(/proposé/);
    monter();
    const surFrise = [...document.querySelectorAll('[data-proposition="echeance"]')];
    expect(surFrise.length).toBeGreaterThan(0);
    for (const e of surFrise) {
      expect(e.getAttribute('aria-label')).toMatch(/à payer/);
      expect(e.getAttribute('aria-label')).not.toMatch(/proposé/);
    }
    const vente = document.querySelector('[data-proposition="vente"]');
    expect(vente?.getAttribute('aria-label')).toMatch(/proposé/);
  });

  it('n° 26 : deux lignes « nom » : le nom et son montant ensemble sur la première ligne, la pastille « lié à » seule sur la seconde', () => {
    const vente = { id: 'argent-cig', rangee: 'ventes', titre: '3 fûts La Cigogne', debut: ajouterJours(L, 30), fin: ajouterJours(L, 30), centimes: 90000, lie: { texte: 'lié à La Cigogne', apercu: 'La Cigogne · client', client: 'La Cigogne' }, source: { genre: 'plan', id: 'P', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true } as ChoseCalendrier;
    const rien = () => undefined;
    render(<div style={{ position: 'relative' }}><Barre chose={vente} gauche={200} largeur={60} haut={0} hauteur={26} cote="gauche" placeEtiquette={200} deuxLignes="nom" largeurColonne={60} bornes={[0, 0]} onToucher={rien} onAppuiLong={rien} onGlisse={rien} onLacheGlisse={rien} onBord={rien} onLacheBord={rien} onRefus={rien} /></div>);
    const l1 = document.querySelector('.cal-lbl-l1')!, l2 = document.querySelector('.cal-lbl-l2')!;
    expect(l1.textContent).toBe('3 fûts La Cigogne+900');
    expect(l2.querySelector('.cal-lbl-m')).toBeNull();
    expect(l2.querySelector('[data-lie]')).not.toBeNull();
  });

  it('n° 32 : le caddie nomme toujours son brassin, en entier ou court (« Blonde · malt pilsner, saaz ») ; sur le banc à 390 aussi', () => {
    const chose = { titre: 'Blonde d’automne' } as ChoseCalendrier;
    const jalon = { id: 'commander', libelle: 'Commander', jour: L, ecart: -5, glissable: false, articles: ['Malt pilsner', 'Saaz'] } as JalonBrassin;
    expect(texteCaddie(chose, jalon)).toBe('Blonde d’automne · malt pilsner, saaz');
    expect(texteCaddie(chose, jalon, true)).toBe('Blonde · malt pilsner, saaz');
    expect(texteCaddie(chose, { ...jalon, articles: undefined }, true)).toBe('Blonde · courses');
    monter();
    const caddies = [...document.querySelectorAll('.cal-lbl-caddie')].map(e => e.textContent ?? '');
    expect(caddies.length).toBeGreaterThan(0);
    for (const t of caddies) expect(t).toMatch(/^(Blonde|Stout|Porter|IPA|Saison)\b.* · /);
  });

  it('n° 1 (E29) : pendant f2-a, la durée tirée qui ne tient pas dans une barre courte se lit entière, à côté de la barre', () => {
    const saison = { id: 'brassin-LOT-SAISON', rangee: 'brassins', titre: 'Saison de ferme', debut: ajouterJours(L, -6), fin: L, pasBrassee: true, duree: 'pas brassée · prévue le 10 nov.', source: { genre: 'batch', id: 'LOT-SAISON', statut: 'planifie' }, ouvre: { ecran: 'brassin', id: 'LOT-SAISON' }, deplacable: true } as ChoseCalendrier;
    const rien = () => undefined;
    render(<div style={{ position: 'relative' }}><Barre chose={saison} gauche={2} largeur={56} haut={0} hauteur={26} cote="droite" placeEtiquette={200} largeurColonne={60} bornes={[0, 5]} allongement={60} etiquetteDuree="pas brassée · prête le 24 nov." onToucher={rien} onAppuiLong={rien} onGlisse={rien} onLacheGlisse={rien} onBord={rien} onLacheBord={rien} onRefus={rien} /></div>);
    const barre = document.querySelector('[data-chose="brassin-LOT-SAISON"]') as HTMLElement;
    /* la barre s'allonge à l'image : sa largeur + l'allongement d'une colonne */
    expect(parseFloat(barre.style.width)).toBe(116);
    const em = barre.querySelector('em[data-duree]')!;
    expect(em.textContent).toBe('pas brassée · prête le 24 nov.');
    expect(em.classList.contains('cal-duree-hors')).toBe(true);
    expect(em.textContent).not.toMatch(/J\d/);
  });
});
