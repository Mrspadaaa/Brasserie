import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* h1 (20.11, CPL-1, DEFAUTS CARNET-PLANNING) : « Mais et le carnet ??? » ; « ça correspond pas du tout à ce que j'ai choisi ??? ».
   Toute entrée du Carnet ouvre CarnetsVue (son choix ra+p5f), jamais l'ancien carnet de CreativeLabTab (filtres Tout / Bières / Contacts /
   À faire, « Réfléchir à mes projets »). Les 19 projets portés du Planning paraissent dans Brassins › Atelier › Carnet, quelle que soit la
   période du haut (01.09–30.09 compris). Données : la fixture du Planning, portée par planMigration ; aucune donnée réelle, aucune IA. */

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import type { CreativeLabSectionRequest } from '../../src/components/CreativeLabTab';
import type { Periode } from '../../src/components/periode/periode';
import type { CreativeItem } from '../../src/types';
import PLANNING from '../../scripts/planning-vers-carnet/fixture-planning.json';
import { planMigration, type TachePlanning } from '../../scripts/planning-vers-carnet/correspondance';

const SEPTEMBRE: Periode = { genre: 'dates', du: '2026-09-01', au: '2026-09-30' };
const DOCS = planMigration(PLANNING as TachePlanning[], new Set(), '2026-11-20T12:00:00.000Z').aEcrire.flatMap(c => c.docs) as CreativeItem[];
const PROJETS = DOCS.filter(d => d.type === 'carnet');
/* Un élément de l'ancien carnet (une note brute) : il ne doit plus servir de porte d'entrée. */
const ANCIEN: CreativeItem = { id: 'ZZ-H1-NOTE', type: 'recipe-idea', title: 'ZZ TEST — idée de l’ancien carnet', status: 'idea', createdAt: '2026-11-20T08:00:00.000Z' } as CreativeItem;

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  localStorage.clear();
  FirestoreRepo.startSync();
  for (const d of [...DOCS, ANCIEN]) FirestoreRepo.put('creativeItems', d.id, d);
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); });

const monter = (extra: Partial<React.ComponentProps<typeof ProductionTab>> = {}) => render(
  <ProductionTab batches={[]} recipes={[]} brewhouses={[]} activeBrewhouseId="" globalTimeFilter={SEPTEMBRE} targetSubTab="lab"
    onOpenCreateBatch={() => {}} onOpenRecipe={() => {}} onOpenBrewDay={() => {}} onDraftRecipe={() => {}} {...extra} />
);
/* Les vues sont chargées à la demande (lazy, deux niveaux) : attendre qu'aucun « Chargement… » ne reste à l'écran. */
const attendre = async () => {
  await act(async () => { await new Promise(r => setTimeout(r, 30)); });
  await waitFor(() => {
    const charge = [...document.querySelectorAll('[role="status"]')].some(s => /^Chargement/.test(s.textContent ?? ''));
    expect(charge).toBe(false);
  }, { timeout: 15000 });
  await act(async () => { await new Promise(r => setTimeout(r, 30)); });
};
const ancienCarnet = () => {
  expect(screen.queryByText('Réfléchir à mes projets')).toBeNull();
  for (const filtre of ['Bières', 'Contacts', 'À faire']) expect(screen.queryByRole('button', { name: filtre })).toBeNull();
  expect(screen.queryByText(ANCIEN.title)).toBeNull();
};
const nouveauCarnet = () => {
  expect(document.querySelector('[data-carnets]')).not.toBeNull();
  ancienCarnet();
};

describe('h1 · une seule porte du Carnet : CarnetsVue', () => {
  it('fixture : 19 projets du Planning (CARNET-PLANNING-T-06 à T-24)', () => {
    expect(PROJETS.length).toBe(19);
    expect(PROJETS.map(p => p.id)).toContain('CARNET-PLANNING-T-06');
    expect(PROJETS.map(p => p.id)).toContain('CARNET-PLANNING-T-24');
  });

  it('Brassins › Atelier › Carnet, période 01.09–30.09 : CarnetsVue avec les 19 projets, sans l’ancien carnet', async () => {
    monter();
    await attendre();
    fireEvent.click(await screen.findByRole('button', { name: /^Carnet$/ }));
    await attendre();
    nouveauCarnet();
    const texte = document.querySelector('[data-carnets]')!.textContent ?? '';
    const absents = PROJETS.filter(p => !texte.includes(p.title)).map(p => p.title);
    expect(absents).toEqual([]);
  });

  it('les 19 projets restent quelle que soit la période du haut (tout, mois, année passée)', async () => {
    for (const periode of [{ genre: 'tout' }, { genre: 'mois', annee: 2026, mois: 11 }, { genre: 'annee', annee: 2024 }] as Periode[]) {
      const vue = monter({ globalTimeFilter: periode, openLabSectionRequest: { section: 'carnet', at: 1 } });
      await attendre();
      const texte = document.querySelector('[data-carnets]')?.textContent ?? '';
      expect(PROJETS.filter(p => !texte.includes(p.title)).length).toBe(0);
      vue.unmount();
    }
  });

  /* Chaque demande que l'app envoie à l'Atelier (App.tsx) : Bord « Gérer » / « Voir tout l'agenda » et Calendrier « agenda » (event),
     Calendrier fête « Plus de détails › » (event + date + saisie), « Noter une idée » (carnet + newIdea), anciennes rubriques. */
  const DEMANDES: [string, CreativeLabSectionRequest][] = [
    ['Bord › Agenda › Gérer', { section: 'event', at: 2 }],
    ['Calendrier › agenda', { section: 'event', at: 3 }],
    ['Calendrier › fête › Plus de détails', { section: 'event', at: 4, date: '2026-12-07', saisie: { titre: 'ZZ TEST — fête de Noël', centimes: 15000, direction: 'out' } }],
    ['Noter une idée', { section: 'carnet', at: 5 }],
    ['ancienne rubrique Bières', { section: 'recipe-idea', at: 6 }],
    ['ancienne rubrique Contacts', { section: 'prospect', at: 7 }]
  ];
  for (const [nom, demande] of DEMANDES) {
    it(`${nom} → CarnetsVue`, async () => {
      monter({ openLabSectionRequest: demande, ...(nom === 'Noter une idée' ? { createRequest: { kind: 'newIdea', at: 9 } } : {}) });
      await attendre();
      nouveauCarnet();
    });
  }

  it('la fête du Calendrier arrive dans le champ du carnet (rien de tapé ne se perd)', async () => {
    monter({ openLabSectionRequest: DEMANDES[2][1] });
    await attendre();
    const champ = document.querySelector('[data-carnets] textarea') as HTMLTextAreaElement;
    expect(champ.value).toContain('ZZ TEST — fête de Noël');
  });

  it('+ « Nouvelle idée » sur Atelier › Carnet : le champ du carnet prend le focus', async () => {
    const vue = monter({ openLabSectionRequest: { section: 'carnet', at: 10 } });
    await attendre();
    vue.rerender(<ProductionTab batches={[]} recipes={[]} brewhouses={[]} activeBrewhouseId="" globalTimeFilter={SEPTEMBRE} targetSubTab="lab"
      onOpenCreateBatch={() => {}} onOpenRecipe={() => {}} onOpenBrewDay={() => {}} onDraftRecipe={() => {}}
      openLabSectionRequest={{ section: 'carnet', at: 10 }} createRequest={{ kind: 'newIdea', at: 11 }} />);
    await attendre();
    expect(document.activeElement).toBe(document.querySelector('[data-carnets] textarea'));
  });

  it('Atelier › Tarifs reste tel quel (vue parallèle à trancher) ; une seule rangée visible, celle de l’Atelier', async () => {
    monter({ openLabSectionRequest: { section: 'pricing-test', at: 12 } });
    await attendre();
    expect(await screen.findByRole('button', { name: 'Noter' })).toBeTruthy();
    expect(document.querySelector('[data-carnets]')).toBeNull();
    /* Tarifs garde son « Réfléchir à mes projets » (tel quel) ; l'ancien carnet, lui, n'y est pas */
    for (const filtre of ['Bières', 'Contacts', 'À faire']) expect(screen.queryByRole('button', { name: filtre })).toBeNull();
    expect(screen.queryByText(ANCIEN.title)).toBeNull();
    /* la rangée propre à CreativeLabTab est sous .atp-tarifs > div (masquée par atelier-porte.css) ; hors d'elle, une seule rangée */
    const rangees = [...document.querySelectorAll('[role="group"][aria-label="Mon atelier"]')];
    expect(rangees.filter(r => !r.closest('.atp-tarifs')).length).toBe(1);
    expect(rangees.filter(r => r.closest('.atp-tarifs')).every(r => r.matches('.atp-tarifs > div > .nc-seg'))).toBe(true);
  });

  it('Atelier › Matériel : l’UpgradeWorkspace d’À venir comme Stocks (vue=), sans CreativeLabTab ni ancien carnet', async () => {
    monter({ openLabSectionRequest: { section: 'equipment', at: 14 } });
    await attendre();
    expect(document.querySelector('.atp-tarifs')).toBeNull();
    expect(screen.getAllByRole('group', { name: 'Mon atelier' }).length).toBe(1);
    expect(screen.getByRole('button', { name: /Matériel/ }).getAttribute('aria-pressed')).toBe('true');
    ancienCarnet();
  });
});
