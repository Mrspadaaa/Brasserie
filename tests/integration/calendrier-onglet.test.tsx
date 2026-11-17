import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { CalendrierTab } from '../../src/components/tabs/CalendrierTab';
import { BottomNav } from '../../src/components/BottomNav';
import { plusMenuFor } from '../../src/domain/plusEcran';
import { fabActionFor } from '../../src/domain/fabActions';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { ajouterJours, lundiDe } from '../../src/domain/calendrier';
import { todayISO } from '../../src/domain/finance/ledger';
import { recipe as recetteDeBanc } from '../fixtures/brewCompanion';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { FinanceService } from '../../src/services/financeService';
import type { FinancialProfile } from '../../src/domain/finance/types';

/* App : les mêmes services simulés que les autres tests de l'App (aucun Firebase, aucune donnée réelle). */
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/migration', () => ({ runMigrationIfNeeded: async () => ({ ran: false }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/BrewerActivity', () => ({ BrewerActivity: () => null }));
vi.mock('../../src/ui/PersistenceStatus', () => ({ PersistenceStatus: () => null }));
vi.mock('../../src/ui/CommandPalette', () => ({ CommandPalette: () => null }));

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/'); });

const props = (batches: Batch[] = []) => ({
  transactions: [], batches, stockItems: [], onOpenBatch: vi.fn(), onOpenFinances: vi.fn(), onOpenAgenda: vi.fn(),
  onOpenCourses: vi.fn(), onPoserBrassin: vi.fn(), onPoserFete: vi.fn(), onPoserDepense: vi.fn()
});

describe('Onglet Calendrier : en place dans la barre (E41, D-212)', () => {
  it('la barre compte six onglets, Calendrier entre Finances et Brassins', () => {
    render(<BottomNav activeTab="calendrier" onChangeTab={() => undefined} criticalStockCount={0} />);
    const noms = within(screen.getByRole('navigation', { name: 'Navigation principale' })).getAllByRole('button').map(b => b.textContent?.trim()).filter(t => t !== 'Compagnon');
    expect(noms).toEqual(['Bord', 'Finances', 'Calendrier', 'Brassins', 'Stocks', 'Clients']);
    expect(screen.getByRole('button', { name: 'Calendrier' })).toHaveAttribute('aria-current', 'page');
  });

  it('le + du Calendrier : pas d’action pleine, la pile de l’écran se déclare', () => {
    expect(fabActionFor('calendrier').intent).toBe('quickAction');
    expect(plusMenuFor('calendrier').ecran).toBe('calendrier');
  });
});

describe('C9 : l’onglet sur les vraies lectures, données vides', () => {
  it('aucun « exemple » ; 7 rangées vides ; le + reste la voie d’ajout ; l’ancien bloc « Cette semaine » a disparu', () => {
    render(<CalendrierTab {...props()} aujourdhui="2026-11-16" />);
    expect(document.querySelectorAll('section[data-rangee]')).toHaveLength(7);
    expect(document.querySelectorAll('.cal-vide')).toHaveLength(7);
    expect(document.querySelectorAll('button[data-plus]')).toHaveLength(7);
    expect(document.body.textContent?.toLowerCase()).not.toContain('exemple');
    expect(screen.queryByText('Cette semaine')).toBeNull();
    expect(screen.queryByText('Rien de posé sur ces 6 semaines.')).toBeNull();
  });
});

describe('E07, ET-PER : la période de l’onglet est la période de l’app', () => {
  it('« 3 mois » écrit la période de l’app (du lundi au dimanche + 12 semaines) et la frise passe à 13 colonnes', () => {
    const onPeriode = vi.fn();
    const lundi = lundiDe('2026-11-16');
    render(<CalendrierTab {...props()} aujourdhui="2026-11-16" periode={{ genre: 'mois', annee: 2026, mois: 11 }} onPeriode={onPeriode} />);
    expect(document.querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('6');
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /^3 mois/ }));
    expect(onPeriode).toHaveBeenCalledWith({ genre: 'dates', du: lundi, au: ajouterJours(lundi, 13 * 7 - 1) });
    expect(document.querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('13');
  });

  it('une période « du … au » de Finances règle la fenêtre', () => {
    const lundi = lundiDe('2026-11-16');
    render(<CalendrierTab {...props()} aujourdhui="2026-11-16" periode={{ genre: 'dates', du: lundi, au: ajouterJours(lundi, 4 * 7 - 1) }} />);
    expect(document.querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('4');
  });
});

/* ---------- CRITIQUE-2 n° 35, 36, 38, 39 : la feuille, la poche, la proposition, les livraisons (banc, port en mémoire, aucune donnée réelle) ---------- */
const JOUR = '2026-11-16';
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };
const monterBanc = (props: Partial<React.ComponentProps<typeof BancCalendrier>> = {}) => {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} {...props} />);
  return appels;
};
const toucher = (el: Element) => {
  fireEvent.pointerDown(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
  fireEvent.pointerUp(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
};
const boutonDe = (selecteur: string) => {
  const el = document.querySelector(selecteur);
  if (!el) throw new Error(`absent : ${selecteur}`);
  return (el.matches('button') ? el : el.querySelector('button') ?? el) as HTMLElement;
};

describe('C15 (n° 36, E45, E03) : feuille Travaux, fenêtre S20 → S40, 5 j, « Mettre de côté » sans plan de plus', () => {
  it('S20, S40 : « S20 → S40 · 21 sem. » ; 5 j ; 10 j reste permis, puis une seule semaine grise 10 j ; « Mettre de côté » écrit fenetre.miseDeCote et aucun autre plan', async () => {
    const savePlan = vi.spyOn(FinanceService, 'savePlan');
    const appels = monterBanc({ callbacks: { periode: { genre: 'dates', du: JOUR, au: '2027-11-14' } } });
    fireEvent.click(document.querySelector('button[data-plus="travaux"]')!);
    const d = within(screen.getByRole('dialog', { name: 'Travaux' }));
    expect(d.getByRole('group', { name: 'Semaine' }).querySelectorAll('button[data-semaine]')).toHaveLength(52);
    fireEvent.click(d.getByRole('button', { name: 'Sols : colle et joints' }));
    const semaines = within(d.getByRole('group', { name: 'Semaine' }));
    fireEvent.click(semaines.getByRole('button', { name: /^S20/ }));
    expect(d.getByRole('button', { name: '10 j' })).toBeDisabled();
    fireEvent.click(semaines.getByRole('button', { name: /^S40/ }));
    expect(d.getByText('S20 → S40 · 21 sem.')).toBeInTheDocument();
    expect(d.getByRole('button', { name: '10 j' })).toBeEnabled();
    fireEvent.click(d.getByRole('button', { name: '5 j' }));
    const mise = d.getByRole('button', { name: /Mettre de côté/ });
    fireEvent.click(mise);
    expect(mise).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    /* une seule écriture : la chose elle-même (un plan manuel de travaux), qui porte le drapeau ; aucun plan récurrent de mise de côté (P7) */
    expect(appels).toHaveLength(1);
    expect(appels[0]).toMatchObject({ collection: 'financialPlans', patch: { title: 'Sols : colle et joints', amountCents: 32000, date: '2027-10-10', fenetre: { du: '2027-05-17', au: '2027-10-10', joursActifs: 5, miseDeCote: true } } });
    expect(savePlan).not.toHaveBeenCalled();
  });

  it('toucher le début, ou une semaine avant lui, repart d’une seule semaine', () => {
    monterBanc();
    fireEvent.click(document.querySelector('button[data-plus="travaux"]')!);
    const d = within(screen.getByRole('dialog', { name: 'Travaux' }));
    const semaines = within(d.getByRole('group', { name: 'Semaine' }));
    fireEvent.click(semaines.getByRole('button', { name: /^S20/ }));
    fireEvent.click(semaines.getByRole('button', { name: /^S40/ }));
    fireEvent.click(semaines.getByRole('button', { name: /^S20/ }));
    expect(d.queryByText(/→/)).toBeNull();
    fireEvent.click(semaines.getByRole('button', { name: /^S40/ }));
    fireEvent.click(semaines.getByRole('button', { name: /^S12/ }));
    expect(d.queryByText(/→/)).toBeNull();
  });
});

describe('C16 (n° 35, E40, E46) : la vue Liste et la poche « Sans date »', () => {
  it('Retirer une fête : « Sans date › » ouvre la Liste sur la poche, qui la contient ; un toucher ouvre son détail ; « Poser » la remet', async () => {
    const appels = monterBanc();
    toucher(boutonDe('[data-chose$="CR-NOEL"]'));
    fireEvent.click(await screen.findByRole('button', { name: /^Retirer/ }));
    const lien = await screen.findByRole('button', { name: 'Sans date ›' });
    fireEvent.click(lien);
    const liste = document.querySelector('[data-vue-liste]') as HTMLElement;
    expect(liste).not.toBeNull();
    const poche = liste.querySelector('[data-poche]') as HTMLElement;
    expect(within(poche).getByText(/Sans date · \d/)).toBeInTheDocument();
    expect(poche.textContent).toContain('Marché de Noël');
    expect(document.activeElement).toBe(poche);
    /* à venir, par date, sans grille : aucune frise dans la liste */
    expect(liste.querySelector('[data-frise]')).toBeNull();
    fireEvent.click(within(poche).getByRole('button', { name: /Marché de Noël/ }));
    fireEvent.click(await screen.findByRole('button', { name: /^Poser/ }));
    const f = within(screen.getByRole('dialog', { name: 'Fêtes' }));
    fireEvent.click(f.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(appels.filter(a => a.op === 'patch' && a.collection === 'creativeItems' && a.patch?.date)).toHaveLength(1));
  });

  it('poche vide : la Liste n’a aucune section « Sans date »', () => {
    render(<CalendrierTab {...props()} aujourdhui={JOUR} />);
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    const menu = screen.getByRole('dialog', { name: 'Période et vue' });
    expect(menu.textContent).not.toMatch(/Sans date/);
    fireEvent.click(within(menu).getByRole('button', { name: /^Liste/ }));
    expect(document.querySelector('[data-vue-liste]')).not.toBeNull();
    expect(document.querySelector('[data-poche]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Sans date · 0/);
  });
});

describe('C18 (n° 38, E47 b) : la feuille ouverte depuis un brassin habituel est préréglée', () => {
  it('la puce de la recette pressée, la semaine proposée choisie, sans « Plus de détails › » ; « Ajouter » écrit cette semaine', async () => {
    const appels = monterBanc();
    const proposee = document.querySelector('[data-proposition="brassin-habituel"]');
    expect(proposee).not.toBeNull();
    toucher(boutonDe('[data-proposition="brassin-habituel"]'));
    const d = within(screen.getByRole('dialog', { name: 'Brassins' }));
    expect(d.getByRole('button', { name: 'Stout maison' })).toHaveAttribute('aria-pressed', 'true');
    const choisie = d.getByRole('group', { name: 'Semaine' }).querySelector('button[aria-pressed="true"]') as HTMLElement;
    const lundi = choisie.getAttribute('data-semaine');
    /* le dernier brassage du banc il y a 20 jours, 56 jours d'écart : la semaine du lundi de J+36 */
    expect(lundi).toBe(lundiDe(ajouterJours(JOUR, 36)));
    expect(d.queryByRole('button', { name: 'Plus de détails ›' })).toBeNull();
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'batches', patch: { recipeRef: 'R-STOUT', plannedBrewDate: lundi } });
  });
});

describe('n° 39 (E38, D-118) : les livraisons attendues arrivent dans Achats', () => {
  const profil = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 100_000, confirmed: true } } as FinancialProfile;
  const modele = (commandes: Record<string, Array<{ le: string; recue?: string }>>) => construireModele({
    aujourdhui: JOUR, transactions: [], payments: [], plans: [], profile: profil, assets: [], batches: [], stockItems: [], items: [], recettes: [],
    reglages: { ...REGLAGES_VIDES, commandes }
  });

  it('commande passée le 20 nov., délai appris 14 j, non reçue : « Livraison Brouwland » en S49, dans la rangée Achats', () => {
    const m = modele({ brouwland: [{ le: '2026-10-01', recue: '2026-10-15' }, { le: '2026-11-20' }] });
    const l = m.choses.find(c => c.titre === 'Livraison Brouwland');
    expect(l).toMatchObject({ rangee: 'achats', debut: '2026-12-04' });
    render(<CalendrierTab {...props()} aujourdhui={JOUR} donnees={{ modele: m, plans: [], batches: [], recettes: [], clients: [], items: [], aujourdhui: JOUR }} />);
    const achats = document.querySelector('section[data-rangee="achats"]') as HTMLElement;
    expect(achats.textContent).toContain('Livraison Brouwland');
  });

  it('délai inconnu (aucune commande reçue) : rien n’est posé', () => {
    const m = modele({ brouwland: [{ le: '2026-11-20' }] });
    expect(m.choses.filter(c => c.titre.startsWith('Livraison'))).toEqual([]);
  });
});

describe('C19 (D-71) : le bloc calendrier de l’App ouvre le budget du brassin', () => {
  it('« Budget › » dans le détail d’un brassin ouvre BrewBudgetSheet sur le Batch de cet id, avec son nom', async () => {
    const aujourdhui = todayISO();
    const prevu = ajouterJours(lundiDe(aujourdhui), 7);
    const batch = {
      id: 'LOT-BUDGET', name: 'Porter du budget', style: 'Porter', volumeL: 100, brewDate: '', status: 'planifie', gravityLog: [],
      recipeSnapshot: { ...recetteDeBanc(), name: 'Porter du budget' },
      plannedBrewDate: `${prevu.slice(8)}.${prevu.slice(5, 7)}.${prevu.slice(0, 4)}`
    } as unknown as Batch;
    window.history.replaceState(null, '', '/?dev-local');
    vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
    vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
    vi.spyOn(StorageService, 'getConfig').mockReturnValue(defaultConfig);
    vi.spyOn(StorageService, 'getBatches').mockImplementation(() => [batch]);
    const { App } = await import('../../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Calendrier' }));
    const barre = await screen.findByRole('button', { name: /^Porter du budget/ }, { timeout: 10000 });
    fireEvent.pointerDown(barre, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerUp(barre, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.click(await screen.findByRole('button', { name: 'Budget ›' }));
    const feuille = await screen.findByRole('dialog', {}, { timeout: 10000 });
    await waitFor(() => expect(within(feuille).getAllByText(/Porter du budget/).length).toBeGreaterThan(0), { timeout: 10000 });
  }, 40000);
});
