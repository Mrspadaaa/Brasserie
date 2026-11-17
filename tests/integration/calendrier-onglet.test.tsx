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
