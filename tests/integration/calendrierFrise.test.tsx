import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier, etatBanc, type EtatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, lundiDe, type ChoseCalendrier, type JalonBrassin } from '../../src/domain/calendrier';
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
