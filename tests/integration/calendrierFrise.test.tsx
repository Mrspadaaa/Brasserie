import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier, etatBanc, type EtatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, anneeEnMois, etiquetteS, lundiDe, type ChoseCalendrier, type JalonBrassin } from '../../src/domain/calendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { MESURES_PORTRAIT, Rangee, clientDe, disposer, largeurEtiquette, pastille, texteCaddie, texteRenvoi, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { Barre, dureeDansBarre, formesDuree, montantBarre } from '../../src/ui/calendrier/frise/Barre';
import { MenuAppuiLong } from '../../src/ui/calendrier/frise/MenuAppuiLong';
import { couperNom, dureeVue, largeurTexte, lieMontre, nomAccessible } from '../../src/ui/calendrier/frise/Marque';
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
          /* CRITIQUE-6 n° 6 : « Commande groupée » / « de malt −540 » (la coupe garde le montant au bout du nom, hors paysage) */
          expect(d.deuxLignes === false || !!c.lie || (d.deuxLignes === 'duree' && c.rangee === 'brassins' && !vue.paysage) || (d.deuxLignes === 'coupe' && !vue.paysage), ctx).toBe(true);
          if (d.deuxLignes === 'coupe') { expect(d.place, ctx).toBeGreaterThanOrEqual(couperNom(c.etiquette ?? c.titre, m)!.largeur); continue; }
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
    /* CRITIQUE-6 n° 15 : la pastille d'un lien vers un brassin (« Blonde d’automne ») ; celle qui répéterait « La Cigogne » n'est plus montrée */
    const vente = { id: 'argent-cig', rangee: 'ventes', titre: '3 fûts La Cigogne', debut: ajouterJours(L, 30), fin: ajouterJours(L, 30), centimes: 90000, lie: { texte: 'lié à Blonde d’automne', apercu: 'La Cigogne · client ; Blonde d’automne · prête 21 déc.' }, source: { genre: 'plan', id: 'P', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true } as ChoseCalendrier;
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

describe('CRITIQUE-6 (lot C-frise) : noms entiers, caddie après un déplacement, pastille redondante', () => {
  /* six semaines de 56 px, une frise de 366 px dont 60 à droite sous le + volant (bord à 306) */
  const COLS: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
  const LC = 56, LARGEUR = 366, RESERVE = 60;
  const rien = () => undefined;
  const gestes = { onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien };

  it('n° 6 : « Commande groupée de malt −540 » avec 218 px libres à gauche (pas assez pour une ligne) : le nom entier sur deux lignes, jamais « … »', () => {
    const cmd = { id: 'plan-cmd', rangee: 'achats', titre: 'Commande groupée de malt', debut: ajouterJours(L, 28), fin: ajouterJours(L, 28), centimes: -54000, source: { genre: 'plan', id: 'P-CMD', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true } as ChoseCalendrier;
    const { items } = disposer([cmd], COLS, LC, LARGEUR, { reserveDroite: RESERVE });
    const d = items[0];
    /* la place libre : 218 px à gauche, 20 à droite ; une ligne demande plus que 218 */
    expect(d.gauche - 8).toBeGreaterThanOrEqual(200);
    expect(largeurEtiquette(cmd, false)).toBeGreaterThan(d.gauche - 8);
    expect(d.cote).toBe('gauche');
    expect(d.deuxLignes).toBe('coupe');
    const coupe = couperNom(cmd.titre, montantBarre(cmd))!;
    expect(`${coupe.l1} ${coupe.l2}`).toBe('Commande groupée de malt');
    expect(d.place).toBeGreaterThanOrEqual(coupe.largeur);
    render(<div style={{ position: 'relative' }}><Barre chose={cmd} gauche={d.gauche} largeur={d.largeur} haut={0} hauteur={26} cote={d.cote} placeEtiquette={d.place} deuxLignes={d.deuxLignes} largeurColonne={LC} bornes={[0, 1]} {...gestes} /></div>);
    const lbl = document.querySelector('.cal-lbl')!;
    expect(lbl.textContent).toBe('Commande groupéede malt−540');
    expect(lbl.textContent).not.toMatch(/…/);
    /* aucune ligne du nom ne peut se couper (`text-overflow` inactif : `cal-lbl-ent`, flex: none) */
    const lignes = [...lbl.querySelectorAll('.cal-lbl-t')];
    expect(lignes).toHaveLength(2);
    for (const l of lignes) expect(l.classList.contains('cal-lbl-ent')).toBe(true);
  });

  it('n° 6 : avec la place sur une ligne, le nom reste sur une ligne (la coupe ne vient qu’en manque de place)', () => {
    const cmd = { id: 'plan-cmd', rangee: 'achats', titre: 'Commande groupée de malt', debut: L, fin: L, centimes: -54000, source: { genre: 'plan', id: 'P-CMD', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true } as ChoseCalendrier;
    const d = disposer([cmd], COLS, LC, LARGEUR, { reserveDroite: RESERVE }).items[0];
    expect(d.deuxLignes).toBe(false);
    expect(d.place).toBeGreaterThanOrEqual(largeurEtiquette(cmd, false) - 4);
    /* la ligne déjà prise par une autre chose : une ligne neuve porte le nom entier, plutôt qu'une coupe (« Noël / privés ») */
    const autre = { ...cmd, id: 'plan-autre', titre: 'Loyer', debut: ajouterJours(L, 14), fin: ajouterJours(L, 14) } as ChoseCalendrier;
    const deux = disposer([cmd, autre], COLS, LC, LARGEUR, { reserveDroite: RESERVE }).items.find(x => x.chose.id === 'plan-cmd')!;
    expect(deux.deuxLignes).toBe(false);
    /* une coupe ne commence jamais une ligne par le point médian */
    expect(couperNom('Brouwland · malt', '−420')).toMatchObject({ l1: 'Brouwland ·', l2: 'malt' });
  });

  it('n° 17 : le caddie garde « Blonde d’automne » avant et après un déplacement (même largeur) ; le nom court jamais quand deux lignes tiennent', () => {
    const jalon = (jour: string) => ({ id: 'commander', libelle: 'Commander', jour, ecart: -5, glissable: false, articles: ['Malt pilsner', 'Saaz'] }) as JalonBrassin;
    const blonde = (k: number) => ({
      id: 'brassin-LOT-BLONDE', rangee: 'brassins', titre: 'Blonde d’automne', debut: ajouterJours(L, 7 * k + 5), fin: ajouterJours(L, 7 * k + 33), centimes: -15800,
      duree: 'J0 / 28 · prête 21 déc.', source: { genre: 'batch', id: 'LOT-BLONDE', statut: 'planifie' }, ouvre: { ecran: 'brassin', id: 'LOT-BLONDE' }, deplacable: true,
      jalons: [jalon(ajouterJours(L, 7 * k))]
    }) as ChoseCalendrier;
    for (const k of [0, 3]) {
      const { caddies } = disposer([blonde(k)], COLS, LC, LARGEUR, { reserveDroite: RESERVE });
      expect(caddies).toHaveLength(1);
      const c = caddies[0];
      const vu = c.lignes ? c.lignes.join(' · ') : c.texte;
      expect(vu, `S+${k}`).toBe('Blonde d’automne · malt pilsner, saaz');
    }
    /* rendu : deux lignes, le nom du brassin entier sur la première */
    render(<Rangee id="brassins" choses={[blonde(3)]} colonnes={COLS} largeurColonne={LC} largeur={LARGEUR} mesures={MESURES_PORTRAIT} reserveDroite={RESERVE} masquee={false} cause={null} epingles={[]} etoiles={[]} partMax={1} drag={null} onAjouter={rien} onBasculerMasque={rien} barre={gestes} />);
    const lbl = document.querySelector('.cal-lbl-caddie')!;
    expect(lbl.textContent).toBe('Blonde d’automnemalt pilsner, saaz');
    expect(lbl.textContent).not.toMatch(/…/);
  });

  it('n° 15 : la pastille qui répète le nom n’est pas montrée ; Lier vers un brassin garde la sienne ; le renvoi garde « Livraison La Cigogne »', () => {
    const base = { rangee: 'ventes', debut: ajouterJours(L, 14), fin: ajouterJours(L, 14), centimes: 90000, source: { genre: 'plan', id: 'P', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true };
    const cigogne = { ...base, id: 'v1', titre: 'La Cigogne', lie: { texte: 'lié à La Cigogne', apercu: 'La Cigogne · client', client: 'La Cigogne' } } as ChoseCalendrier;
    const hotte = { ...base, id: 'v2', rangee: 'achats', titre: 'Hotte', centimes: -90000, lie: { texte: 'lié à Blonde d’automne', apercu: 'Blonde d’automne · prête 21 déc.' } } as ChoseCalendrier;
    expect(lieMontre(cigogne)).toBeUndefined();
    expect(lieMontre({ ...cigogne, titre: 'Épicerie du Bourg, 2 cartons', lie: { texte: 'lié à Épicerie du Bourg', apercu: 'Épicerie du Bourg · client', client: 'Épicerie du Bourg' } })).toBeUndefined();
    expect(lieMontre(hotte)).toEqual(hotte.lie);
    render(<div style={{ position: 'relative' }}>
      <Barre chose={cigogne} gauche={10} largeur={50} haut={0} hauteur={26} cote="droite" placeEtiquette={200} largeurColonne={LC} bornes={[0, 1]} {...gestes} />
      <Barre chose={hotte} gauche={10} largeur={50} haut={40} hauteur={26} cote="droite" placeEtiquette={200} largeurColonne={LC} bornes={[0, 1]} {...gestes} />
    </div>);
    const lbls = [...document.querySelectorAll('.cal-lbl')];
    expect(lbls[0].querySelector('[data-lie]')).toBeNull();
    expect(lbls[1].querySelector('[data-lie]')).not.toBeNull();
    /* la largeur réservée suit : sans pastille, l'étiquette ne compte que le nom et le montant */
    expect(largeurEtiquette(cigogne, false)).toBe(largeurEtiquette({ ...cigogne, lie: undefined }, false));
    /* E32 : le lien ne porte plus `client` quand le titre le dit (lot A) ; le renvoi le lit dans l'aperçu */
    const promise = { ...cigogne, titre: '3 fûts La Cigogne', debut: '2027-01-04', lie: { texte: 'lié à Blonde d’automne', apercu: 'La Cigogne · client ; Blonde d’automne · prête 21 déc.' } } as ChoseCalendrier;
    expect(clientDe(promise)).toBe('La Cigogne');
    expect(texteRenvoi(promise)).toMatch(/^Livraison La Cigogne · S1$/);
  });

  it('doute Lier (m390-49a) : la pastille « Blonde d’automne » sans place d’aucun côté de la Hotte n’est pas posée ; « Hotte −900 » reste entier, dans la frise', () => {
    const hotte = { id: 'plan-hotte', rangee: 'achats', titre: 'Hotte', debut: ajouterJours(L, 14), fin: ajouterJours(L, 14), centimes: -90000, liens: { batchId: 'LOT-BLONDE' }, lie: { texte: 'lié à Blonde d’automne', apercu: 'Blonde d’automne · prête 21 déc.' }, source: { genre: 'plan', id: 'P-H', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true } as ChoseCalendrier;
    const d = disposer([hotte], COLS, LC, LARGEUR, { reserveDroite: RESERVE, lieCourt: true }).items[0];
    expect(d.sansLie).toBe(true);
    const nomMontant = largeurTexte('Hotte', 600) + largeurTexte(montantBarre(hotte)!, 700) + 6;
    expect(d.place).toBeGreaterThanOrEqual(nomMontant);
    /* l'étiquette tient entre le bord gauche de la frise et le + volant */
    if (d.cote === 'droite') expect(d.gauche + d.largeur + 6 + d.place).toBeLessThanOrEqual(LARGEUR - RESERVE);
    else expect(d.gauche - 6 - d.place).toBeGreaterThanOrEqual(0);
    render(<div style={{ position: 'relative' }}><Barre chose={hotte} gauche={d.gauche} largeur={d.largeur} haut={0} hauteur={26} cote={d.cote} placeEtiquette={d.place} sansLie={d.sansLie} largeurColonne={LC} bornes={[0, 1]} lieCourt {...gestes} /></div>);
    const lbl = document.querySelector('.cal-lbl')!;
    expect(lbl.querySelector('[data-lie]')).toBeNull();
    expect(lbl.textContent).toBe('Hotte−900');
    /* le lien reste lisible : le badge de la barre et son nom accessible */
    expect(document.querySelector('[data-chose="plan-hotte"] .cal-badges')).not.toBeNull();
    expect(document.querySelector('[data-chose="plan-hotte"]')!.getAttribute('aria-label')).toMatch(/lié à Blonde d’automne/);
  });
});

describe('CRITIQUE-7 (lot corr7-C-frise) : lien sans nom répété, points de la barre posée, rien sous le + volant', () => {
  const rien = () => undefined;
  const gestes = { onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien };
  /** Les morceaux « a · b · c » d'un texte, sans « lié à » ni accents : deux morceaux voisins égaux, c'est un nom répété. */
  const repete = (t: string) => {
    const m = t.replace(/^lié à /i, '').split(/ · | ; /).map(x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase().trim());
    return m.some((x, i) => i > 0 && x === m[i - 1]);
  };
  const hotte = (lie: ChoseCalendrier['lie']): ChoseCalendrier => ({
    id: 'plan-hotte', rangee: 'achats', titre: 'Hotte', debut: '2026-11-30', fin: '2026-11-30', centimes: -90000, lie,
    source: { genre: 'plan', id: 'P-HOTTE', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true
  } as ChoseCalendrier);

  it('n° 6 (D-113, D-126) : le détail de la Hotte liée dit « lié à Blonde d’automne · brassage 23 nov. · prête 21 déc. », sans le nom deux fois', () => {
    const lie = { texte: 'lié à Blonde d’automne', apercu: 'Blonde d’automne · brassage 23 nov. · prête 21 déc.' };
    render(<DetailChose chose={hotte(lie)} onFermer={rien} onOuvrir={rien} />);
    const t = document.querySelector('[data-apercu-lien]')!.textContent ?? '';
    expect(t).toBe('lié à Blonde d’automne · brassage 23 nov. · prête 21 déc.');
    expect(repete(t)).toBe(false);
    expect(t.match(/Blonde d’automne/g)).toHaveLength(1);
    /* le témoin (la version rejetée) répétait le nom : le contrôle le voit */
    expect(repete(`${lie.texte} · ${lie.apercu}`)).toBe(true);
  });

  it('n° 6 : avec deux liens (client et brassin), chaque morceau garde son nom', () => {
    const lie = { texte: 'lié à Blonde d’automne', apercu: 'La Cigogne · client ; Blonde d’automne · prête 21 déc.' };
    render(<DetailChose chose={hotte(lie)} onFermer={rien} onOuvrir={rien} />);
    const t = document.querySelector('[data-apercu-lien]')!.textContent ?? '';
    expect(t).toContain('La Cigogne · client');
    expect(t).toContain('Blonde d’automne · prête 21 déc.');
  });

  it('n° 6 : l’aperçu de la pastille, une note à part sous son bouton, ne répète aucun nom à la suite', () => {
    const lie = { texte: 'lié à Blonde d’automne', apercu: 'Blonde d’automne · brassage 23 nov. · prête 21 déc.' };
    render(<div style={{ position: 'relative' }}><Barre chose={hotte(lie)} gauche={100} largeur={56} haut={0} hauteur={26} cote="droite" placeEtiquette={240} largeurColonne={56} bornes={[0, 1]} {...gestes} /></div>);
    fireEvent.click(screen.getByRole('button', { name: 'lié à Blonde d’automne : aperçu' }));
    expect(repete(screen.getByRole('note').textContent ?? '')).toBe(false);
  });

  /* E24, E45, D-8, D-9 : la barre Travaux posée de S20 à S40 2027 avec 5 jours actifs */
  const sols = {
    id: 'plan-sols', rangee: 'travaux', titre: 'Rénovation des sols', debut: '2027-05-17', fin: '2027-10-03', centimes: -60000, joursActifs: 5,
    fenetre: { du: '2027-05-17', au: '2027-10-03', joursActifs: 5 },
    source: { genre: 'plan', id: 'P-SOLS', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true
  } as ChoseCalendrier;
  const friseDe = (colonnes: Colonne[]) => render(
    <Frise choses={[sols]} colonnes={colonnes} paysage={false} ordre={[]} masquees={[]} filtre={null} epingles={[]} etoiles={[]} drag={null} largeurRepli={360} onAjouter={rien} onBasculerMasque={rien} barre={gestes} />
  );
  const verifierSols = (vue: string) => {
    const b = document.querySelector<HTMLElement>('[data-chose="plan-sols"]')!;
    expect(b, vue).not.toBeNull();
    expect(b.hasAttribute('data-barre'), `${vue} : une barre, pas une marque`).toBe(true);
    expect(b.hasAttribute('data-marque'), vue).toBe(false);
    expect(parseFloat(b.style.width), vue).toBeGreaterThanOrEqual(24);
    const points = [...b.querySelectorAll<HTMLElement>('[data-point]')];
    expect(points, vue).toHaveLength(5);
    /* à égale distance dans la fenêtre (E45) : 10 %, 30 %, 50 %, 70 %, 90 % */
    expect(points.map(p => Math.round(parseFloat(p.style.left)))).toEqual([10, 30, 50, 70, 90]);
  };

  it('n° 3 (E24, E45) : en An, la barre S20 → S40 garde ses 5 points et ses 24 px au moins', () => {
    const mois = anneeEnMois(JOUR).map(m => ({ debut: m.debut, fin: m.fin, etiquette: m.court }));
    expect(mois.some(m => m.debut <= '2027-05-17' && m.fin >= '2027-05-17')).toBe(true);
    friseDe(mois);
    verifierSols('An');
  });

  it('n° 3 : en 6 mois, la fenêtre glissée sur S20 à S40 2027 : la même barre, ses 5 points', () => {
    const six = Array.from({ length: 26 }, (_, i) => ({ debut: ajouterJours('2027-05-17', i * 7), fin: ajouterJours('2027-05-17', i * 7 + 6), etiquette: etiquetteS(ajouterJours('2027-05-17', i * 7)) }));
    friseDe(six);
    verifierSols('6 mois');
  });

  /* CRITIQUE-10 n° 2 (E24, D-9, option a) : les 5 points ne sont couverts ni par le nom ni par le montant */
  const pointsLibres = (vue: string) => {
    const b = document.querySelector<HTMLElement>('[data-chose="plan-sols"]')!;
    const pts = b.querySelector<HTMLElement>('[data-points]')!;
    expect(pts, vue).not.toBeNull();
    expect(pts.getAttribute('data-points'), vue).toBe('5');
    const points = [...pts.querySelectorAll<HTMLElement>('[data-point]')];
    expect(points.map(p => Math.round(parseFloat(p.style.left) * 10) / 10), vue).toEqual([0, 1, 2, 3, 4].map(i => Math.round(((i + 0.5) / 5) * 1000) / 10));
    const lbl = document.querySelector<HTMLElement>('.cal-lbl.cal-t-travaux')!;
    expect(lbl.textContent, vue).toMatch(/Rénovation\s*des sols/);
    /* un conteneur distinct du libellé, jamais l'un dans l'autre */
    expect(lbl.contains(pts) || pts.contains(lbl), vue).toBe(false);
    if (lbl.classList.contains('cal-lbl-dedans')) {
      /* le nom dans la barre : la barre est haute, le nom sur sa ligne du haut, les points sur la ligne du dessous (bas : 8 px, 7 px de haut) */
      expect(b, vue).toHaveClass('cal-barre-2l');
      expect(pts, vue).toHaveClass('cal-pts-bas');
      const basNom = parseFloat(lbl.style.top) + parseFloat(lbl.style.height);
      const hautPoints = parseFloat(b.style.top) + parseFloat(b.style.height) - 8 - 7;
      expect(basNom, vue).toBeLessThanOrEqual(hautPoints);
    } else {
      /* à côté, du côté libre (E24) : hors de la barre */
      expect(lbl.classList.contains('cal-lbl-droite') || lbl.classList.contains('cal-lbl-gauche'), vue).toBe(true);
    }
  };

  it('CRITIQUE-10 n° 2 : à 390 en 6 mois et dans l’An, les 5 points sont sur leur ligne, sous le nom, dans [data-points]', () => {
    const six = Array.from({ length: 26 }, (_, i) => ({ debut: ajouterJours('2027-05-17', i * 7), fin: ajouterJours('2027-05-17', i * 7 + 6), etiquette: etiquetteS(ajouterJours('2027-05-17', i * 7)) }));
    const { unmount } = friseDe(six);
    pointsLibres('6 mois');
    expect(document.querySelector('.cal-lbl.cal-t-travaux')).toHaveClass('cal-lbl-dedans');
    unmount();
    friseDe(anneeEnMois(JOUR).map(m => ({ debut: m.debut, fin: m.fin, etiquette: m.court })));
    pointsLibres('An');
  });

  it('CRITIQUE-10 n° 2 : une barre sans jours actifs reste d’une ligne (rien ne change pour elle)', () => {
    render(
      <Frise choses={[{ ...sols, id: 'plan-sans', joursActifs: undefined, fenetre: { du: '2027-05-17', au: '2027-10-03' } } as ChoseCalendrier]} colonnes={anneeEnMois(JOUR).map(m => ({ debut: m.debut, fin: m.fin, etiquette: m.court }))} paysage={false} ordre={[]} masquees={[]} filtre={null} epingles={[]} etoiles={[]} drag={null} largeurRepli={360} onAjouter={rien} onBasculerMasque={rien} barre={gestes} />
    );
    const b = document.querySelector<HTMLElement>('[data-chose="plan-sans"]')!;
    expect(b).not.toHaveClass('cal-barre-2l');
    expect(b.querySelector('[data-points]')).toBeNull();
  });

  it('CRITIQUE-10, doute m22 : après un toucher dans la frise, aucun cadre de focus (data-doigt) ; une touche du clavier le rend', () => {
    friseDe(anneeEnMois(JOUR).map(m => ({ debut: m.debut, fin: m.fin, etiquette: m.court })));
    const frise = document.querySelector<HTMLElement>('[data-frise]')!;
    const b = document.querySelector<HTMLElement>('[data-chose="plan-sols"]')!;
    fireEvent.pointerDown(b, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerUp(b, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(frise).toHaveAttribute('data-doigt');
    fireEvent.keyDown(b, { key: 'Tab' });
    expect(frise).not.toHaveAttribute('data-doigt');
  });

  it('n° 7 : la rangée qui passe sous le + après défilement ou rotation : aucun nom ne se pose sous le +', async () => {
    const cols: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
    const malt = { id: 'plan-brouwland', rangee: 'achats', titre: 'Brouwland · malt', debut: ajouterJours(L, 14), fin: ajouterJours(L, 14), centimes: -42000, source: { genre: 'plan', id: 'P-BW', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true } as ChoseCalendrier;
    /* le + volant de l'app, fixe : 56 px, à 16 px du bord droit d'un écran de 390 */
    const fab = document.createElement('button');
    fab.setAttribute('aria-label', 'Actions rapides');
    document.body.appendChild(fab);
    const FAB = { left: 318, right: 374, top: 720, bottom: 776 };
    let achatsSousFab = false;
    const rect = (r: { left: number; right: number; top: number; bottom: number }) => ({ ...r, width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top, toJSON: () => ({}) }) as DOMRect;
    const espion = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this === fab) return rect(FAB);
      if (this.hasAttribute('data-frise')) return rect({ left: 12, right: 372, top: 300, bottom: 1400 });
      const r = this.getAttribute('data-rangee');
      if (this.tagName === 'SECTION' && r) return rect(r === 'achats' && achatsSousFab ? { left: 12, right: 372, top: 690, bottom: 790 } : { left: 12, right: 372, top: 100, bottom: 160 });
      return rect({ left: 0, right: 0, top: 0, bottom: 0 });
    });
    try {
      render(<Frise choses={[malt]} colonnes={cols} paysage={false} ordre={[]} masquees={[]} filtre={null} epingles={[]} etoiles={[]} drag={null} largeurRepli={360} reserveDroite={76} onAjouter={rien} onBasculerMasque={rien} barre={gestes} />);
      const lbl = () => document.querySelector<HTMLElement>('[data-rangee="achats"] .cal-lbl')!;
      const droite = (el: HTMLElement) => parseFloat(el.style.left) + parseFloat(el.style.maxWidth);
      /* au repos, la rangée Achats est loin du + : le nom se pose à droite de sa barre (S49), jusque dans la zone du + */
      expect(lbl().className).toMatch(/cal-lbl-droite/);
      expect(droite(lbl())).toBeGreaterThan(360 - 76);
      /* la page défile (ou tourne et revient en portrait) : Achats passe sous le +, sans nouveau rendu de la frise */
      achatsSousFab = true;
      await act(async () => { window.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 200)); });
      const bord = 360 - 76;
      const l = lbl();
      if (/cal-lbl-droite/.test(l.className)) expect(droite(l)).toBeLessThanOrEqual(bord + 1);
      else expect(l.className).toMatch(/cal-lbl-gauche/);
      expect(l.textContent).toMatch(/Brouwland/);
      expect(l.textContent).toMatch(/−420/);
    } finally {
      espion.mockRestore();
      fab.remove();
    }
  });
});

describe('CRITIQUE-9 (lot corr9-C-frise) : « prête le … » jamais perdue, icône lien touchable, Dupliquer avec effet, bord à 18 px', () => {
  const rien = () => undefined;
  const gestes = { onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien };
  const PRETE = /prête (le )?\d+ \p{L}+/u;

  it('n° 3 (E25, E29) : à 390 en 6 sem., chaque brassin qui a une date « prête » la montre entière dans sa rangée', () => {
    const choses = chosesDuBanc();
    const brassins = choses.filter(c => c.rangee === 'brassins' && !c.brassinLie && !c.conditionne && PRETE.test(dureeVue(c) ?? ''));
    /* les cinq de la critique sont dans la fixture : Saison, Blonde, Stout, Porter, Ambrée */
    for (const n of [/^Saison/, /^Blonde/, /^Stout/, /^Porter/, /^Ambrée/]) expect(brassins.some(c => n.test(c.titre)), String(n)).toBe(true);
    /* témoin : sur la ligne du nom, la barre de la Blonde (presque pleine largeur à 390) ne porte que « J0 / 28 » (le HEAD s'arrêtait là) */
    const blonde = brassins.find(c => /^Blonde/.test(c.titre))!;
    expect(dureeDansBarre(blonde, 301, true)).not.toMatch(PRETE);
    render(<Frise choses={choses} colonnes={semainesDe(6)} paysage={false} ordre={[]} masquees={[]} filtre={null} epingles={[]} etoiles={[]} drag={null} largeurRepli={366} reserveDroite={76} onAjouter={rien} onBasculerMasque={rien} barre={gestes} />);
    const rangeeB = document.querySelector('section[data-rangee="brassins"]')!;
    let vus = 0;
    for (const c of brassins) {
      const barre = rangeeB.querySelector(`[data-chose="${c.id}"]`);
      if (!barre) continue;
      vus++;
      const lu = [barre.textContent, barre.nextElementSibling?.textContent, rangeeB.querySelector(`[data-phrase-sous="${c.id}"]`)?.textContent].join(' | ');
      expect(lu, c.titre).toMatch(PRETE);
      /* jamais coupée */
      expect(lu, c.titre).not.toMatch(/…/);
    }
    expect(vus).toBeGreaterThanOrEqual(5);
    /* la Blonde et la Saison : la barre haute de as/cap/p-repos (le nom en haut, la phrase en bas), ou la phrase sous la barre */
    for (const n of ['Blonde', 'Saison']) {
      const id = brassins.find(c => c.titre.startsWith(n))!.id;
      const b = rangeeB.querySelector<HTMLElement>(`[data-chose="${id}"]`)!;
      expect(b.classList.contains('cal-barre-2l') || !!rangeeB.querySelector(`[data-phrase-sous="${id}"]`), n).toBe(true);
    }
  });

  it('n° 3 : la phrase posée en bas prend la ligne au-dessous ; aucune autre chose ne s’y pose', () => {
    const choses = chosesDuBanc().filter(c => c.rangee === 'brassins');
    const { items } = disposer(choses, semainesDe(6), 61, 366, { reserveDroite: 76, lieCourt: true });
    const hautes = items.filter(d => d.phraseBas);
    expect(hautes.length).toBeGreaterThan(0);
    for (const h of hautes) {
      const [x0, x1] = h.phraseBas!.ou === 'barre' ? [h.gauche, h.gauche + h.largeur] : [h.phraseBas!.x0, h.phraseBas!.x1];
      for (const d of items) if (d !== h && d.ligne === h.ligne + 1) expect(d.gauche + d.largeur <= x0 || d.gauche >= x1, `${h.chose.titre} / ${d.chose.titre}`).toBe(true);
      if (h.phraseBas!.ou === 'dessous') { expect(h.phraseBas!.x0).toBeGreaterThanOrEqual(0); expect(h.phraseBas!.x1).toBeLessThanOrEqual(366 - 76 + 1); }
    }
  });

  it('n° 3 : en paysage (une ligne de 20 px), aucune barre haute ni phrase dessous', () => {
    const { items } = disposer(chosesDuBanc().filter(c => c.rangee === 'brassins'), semainesDe(13), 740 / 13, 740, { reserveDroite: 76, paysage: true, vueLarge: true, lieCourt: true });
    expect(items.length).toBeGreaterThan(0);
    expect(items.some(d => d.phraseBas)).toBe(false);
  });

  it('n° 10 (D-113, D-126) : sans place pour sa pastille, l’icône lien de la Hotte est un bouton [data-lie] « Hotte, liée à Blonde d’automne : aperçu » ; l’aperçu ne répète pas le nom', () => {
    const lie = { texte: 'lié à Blonde d’automne', apercu: 'Blonde d’automne · brassage 23 nov. · prête 21 déc.' };
    const hotte = { id: 'plan-hotte', rangee: 'achats', titre: 'Hotte', debut: '2026-11-30', fin: '2026-11-30', centimes: -90000, lie, liens: { batchId: 'LOT-BLONDE' }, source: { genre: 'plan', id: 'P-HOTTE', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true } as unknown as ChoseCalendrier;
    render(<div style={{ position: 'relative' }}><Barre chose={hotte} gauche={240} largeur={56} haut={0} hauteur={26} cote="gauche" placeEtiquette={90} sansLie lieCourt largeurColonne={61} bornes={[0, 0]} {...gestes} /></div>);
    const b = screen.getByRole('button', { name: 'Hotte, liée à Blonde d’automne : aperçu' });
    expect(b).toHaveAttribute('data-lie');
    /* hors de la barre (jamais un bouton dans un bouton), posé sur l'icône du badge : une seule icône lien à l'image */
    expect(b.closest('[data-chose]')).toBeNull();
    expect(document.querySelectorAll('[data-chose] .cal-badges svg')).toHaveLength(1);
    expect(b.querySelector('svg')).toBeNull();
    fireEvent.click(b);
    const ap = document.querySelector('[data-apercu-lien]')!.textContent ?? '';
    expect(ap).toBe('Blonde d’automne · brassage 23 nov. · prête 21 déc.');
    expect(ap.split(' · ').filter(x => x === 'Blonde d’automne')).toHaveLength(1);
  });

  it('n° 8 (E31) : « Dupliquer en S48 » d’un brassin dit son effet quand il est fourni, sur sa ligne', () => {
    const blonde = chosesDuBanc().find(c => c.rangee === 'brassins' && /^Blonde/.test(c.titre))!;
    const ancre = document.createElement('div');
    document.body.appendChild(ancre);
    render(<MenuAppuiLong chose={blonde} nomRangee="Brassins seuls" ancre={ancre} epinglee={false} etoilee={false} autresRangees={6} dupliquer={{ libelle: 'S48', effet: 'S48 : 1 154 → 1 017' }} retirer={{ raison: 'Un brassin se règle dans sa fiche' }} liens={{ brassins: [], clients: [] }}
      onEpingler={rien} onEtoile={rien} onSeules={rien} onDupliquer={rien} onLier={rien} onRetirer={rien} onFermer={rien} />);
    const item = screen.getByRole('menuitem', { name: /^Dupliquer en S48/ });
    expect(item.textContent).toBe('Dupliquer en S48 · S48 : 1 154 → 1 017');
    expect(item.querySelector('[data-effet-dupliquer]')!.textContent).toBe('S48 : 1 154 → 1 017');
    ancre.remove();
  });

  it('doute f2-a (E29, D-47) : en paysage (barre de 18 px), un doigt à 8 px du bord, dedans ou dehors, tire le bord ; au milieu, il déplace', () => {
    const saison = chosesDuBanc().find(c => c.rangee === 'brassins' && /^Saison/.test(c.titre))!;
    for (const [x, attendu] of [[292, 'bord'], [308, 'bord'], [200, 'glisse']] as const) {
      const onBord = vi.fn(), onGlisse = vi.fn();
      const { unmount } = render(<div style={{ position: 'relative' }}><Barre chose={{ ...saison, deplacable: true }} gauche={100} largeur={200} haut={0} hauteur={18} cote="dedans" placeEtiquette={0} largeurColonne={57} bornes={[-5, 5]} {...gestes} onBord={onBord} onGlisse={onGlisse} /></div>);
      const b = document.querySelector<HTMLElement>('[data-chose]')!;
      const espion = vi.spyOn(b, 'getBoundingClientRect').mockReturnValue({ left: 100, right: 300, top: 0, bottom: 18, width: 200, height: 18, x: 100, y: 0, toJSON: () => ({}) } as DOMRect);
      fireEvent.pointerDown(b, { clientX: x, clientY: 9, pointerId: 1, button: 0 });
      fireEvent.pointerMove(b, { clientX: x + 57, clientY: 9, pointerId: 1 });
      fireEvent.pointerUp(b, { clientX: x + 57, clientY: 9, pointerId: 1 });
      if (attendu === 'bord') { expect(onBord, `x = ${x}`).toHaveBeenCalledWith(expect.anything(), 7); expect(onGlisse).not.toHaveBeenCalled(); }
      else { expect(onGlisse, `x = ${x}`).toHaveBeenCalled(); expect(onBord).not.toHaveBeenCalled(); }
      espion.mockRestore();
      unmount();
    }
  });
});

/* CRITIQUE-11 n° 7 (E40, D-204) : à 390, « prête 7 » puis « déc. » seul à la ligne (IPA, m390-clair-34) */
describe('CRITIQUE-11 n° 7 : dans la Liste, aucune date ni plage ne se coupe à la ligne', () => {
  it('chaque date d’une ligne est un nœud insécable ; « prête 7 déc. » de l’IPA en est un seul ; liste.css rend `cal-nowrap` insécable', async () => {
    monter();
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(dialogue('Période et vue').getByRole('button', { name: /^Liste/ }));
    const liste = await screen.findByText((_, el) => el?.hasAttribute('data-vue-liste') ?? false);
    const sous = [...liste.querySelectorAll('[data-liste-chose] small')];
    expect(sous.length).toBeGreaterThan(5);
    for (const s of sous) {
      /* hors des nœuds insécables, seuls le nom de la rangée et les « · » : aucun chiffre (donc aucune date, plage, semaine ni durée) */
      const libres = [...s.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent ?? '').join('');
      expect(libres, s.textContent ?? '').not.toMatch(/\d/);
      for (const d of s.querySelectorAll('[data-date]')) expect(d.classList.contains('cal-nowrap')).toBe(true);
    }
    const ipa = liste.querySelector('[data-liste-chose*="IPA"] small')!;
    const morceaux = [...ipa.querySelectorAll('[data-date]')].map(d => d.textContent);
    expect(morceaux.some(m => /^prête \d+ déc\.$/.test(m ?? ''))).toBe(true);
    const css = (await import('node:fs')).readFileSync(`${process.cwd()}/src/ui/calendrier/frise/liste.css`, 'utf8');
    expect(css).toMatch(/\.cal-nowrap\s*\{\s*white-space:\s*nowrap;?\s*\}/);
  });
});
