// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* h1, tour 2 (20.11, CPL-1, DEFAUTS CARNET-PLANNING). Décisions du pilote :
   D3 : Carnet › Tout montre les 19 projets portés du Planning quelle que soit la période et l'archivage ; un projet du Planning archivé
        (« fait », 5f20de011) paraît dans un groupe « Faits · n », en fin de liste, lisible ; la donnée ne change pas.
   D2 : les anciennes notes de l'Atelier sans place (contact, idée de bière, note brute) restent visibles : un repli fermé « Anciennes
        notes de l'Atelier · N » en bas, en lecture seule (titre, genre en mot, date) ; masqué si N = 0 ; aucune écriture.
   Données : la fixture du Planning (planMigration), états du 20.11 (planEtats : 5 faits) ; aucune donnée réelle, aucune IA. */

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import { CarnetsVue, type FinancesCarnet } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { titreAffiche } from '../../src/ui/carnets/titre';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import type { Periode } from '../../src/components/periode/periode';
import type { CreativeItem } from '../../src/types';
import PLANNING from '../../scripts/planning-vers-carnet/fixture-planning.json';
import { planMigration, type TachePlanning } from '../../scripts/planning-vers-carnet/correspondance';
import { planEtats } from '../../scripts/planning-vers-carnet/etats';

const LE = '2026-11-20T12:00:00.000Z';
const PORTES = planMigration(PLANNING as TachePlanning[], new Set(), LE).aEcrire.flatMap(c => c.docs) as CreativeItem[];
/* Les états du 20.11 : 1 à 5 archivées (faites), 6 en cours, 7 à 11 pas encore faites (notes). */
const DOCS = appliquerEcritures(PORTES, planEtats(PORTES, LE).ecritures) as CreativeItem[];
const TOUS = lireCarnets(DOCS, { archives: true });
const ARCHIVES = TOUS.filter(c => c.carnet.archive);
const OUVERTS = TOUS.filter(c => !c.carnet.archive);

const SEPTEMBRE: Periode = { genre: 'dates', du: '2026-09-01', au: '2026-09-30' };
const vides = (): FinancesCarnet => ({ plans: [], transactions: [], payments: [] });
const monter = (items: CreativeItem[]) => {
  const magasin = magasinMemoire(items);
  render(<CarnetsVue magasin={magasin} finances={vides()} mode="simule" appels={appelsSimules('normal', 0)} aides={aidesCarnet('simule', {})} anciens={items} />);
  return magasin;
};
const titres = (racine: ParentNode = document) => [...racine.querySelectorAll('.cn-carnet-titre')].map(e => e.textContent);

/* Les anciens éléments de CreativeLab, tels que l'ancien carnet les écrivait. */
const CONTACT = { id: 'ZZ-H1T2-P', type: 'prospect', title: 'ZZ TEST — Le Carnotzet', status: 'idea', date: '12.11.2026', contactName: 'Paul' } as CreativeItem;
const BIERE = { id: 'ZZ-H1T2-R', type: 'recipe-idea', title: 'ZZ TEST — Bière d’hiver au miel', status: 'idea', date: '03.10.2026' } as CreativeItem;
const NOTE = { id: 'CR-1763380800000', type: 'note', title: 'ZZ TEST — Ventilation', status: 'idea' } as unknown as CreativeItem;
/* Ceux qui ont déjà leur place ailleurs : jamais dans le repli. */
const AILLEURS = [
  { id: 'ZZ-H1T2-E', type: 'equipment', title: 'ZZ TEST — Fermenteur', status: 'idea' },
  { id: 'ZZ-H1T2-V', type: 'event', title: 'ZZ TEST — Marché', status: 'todo', date: '05.12.2026' },
  { id: 'ZZ-H1T2-T', type: 'pricing-test', title: 'ZZ TEST — Prix IPA', status: 'idea' }
] as CreativeItem[];

afterEach(() => cleanup());

describe('h1 tour 2 · D3 : les 19 projets du Planning, faits compris', () => {
  it('la fixture compte 19 projets dont 5 archivés (faits)', () => {
    expect(TOUS).toHaveLength(19);
    expect(ARCHIVES).toHaveLength(5);
  });

  it('Carnet › Tout : les 19 titres paraissent, les 5 faits dans « Faits · 5 », en fin de liste', () => {
    monter(DOCS);
    const vus = titres();
    for (const c of TOUS) expect(vus).toContain(titreAffiche(c.title));
    expect(vus).toHaveLength(19);
    const faits = screen.getByRole('region', { name: 'Faits' });
    expect(within(faits).getByText('Faits')).toBeTruthy();
    expect(faits.textContent).toMatch(/Faits\s*5/);
    expect(titres(faits).sort()).toEqual(ARCHIVES.map(c => titreAffiche(c.title)).sort());
    /* fait : aucun « Coller un lien » (rien à acheter) */
    expect(within(faits).queryByText(/Coller un lien/)).toBeNull();
    /* en fin de liste : après tout groupe d'état */
    const groupes = [...document.querySelectorAll('.cn-liste > section')];
    const iFaits = groupes.indexOf(faits);
    for (const s of ['Idée', 'En recherche', 'Choisi']) {
      const g = groupes.find(x => x.getAttribute('aria-label') === s);
      if (g) expect(groupes.indexOf(g)).toBeLessThan(iFaits);
    }
  });

  it('un fait se rouvre d’un toucher (lisible, pas masqué)', () => {
    monter(DOCS);
    const faits = screen.getByRole('region', { name: 'Faits' });
    fireEvent.click(within(faits).getAllByRole('button')[0]);
    expect(screen.queryByRole('region', { name: 'Faits' })).toBeNull();
  });

  it('la donnée ne change pas : aucune écriture au montage', () => {
    const m = monter(DOCS);
    expect(m.ecritures).toHaveLength(0);
    expect(lireCarnets(m.lire(), { archives: true }).filter(c => c.carnet.archive)).toHaveLength(5);
  });

  it('un carnet archivé qui n’est pas du Planning reste hors de « Faits » (il vit dans Réalisés)', () => {
    const autre = { ...OUVERTS[0], id: 'ZZ-H1T2-AUTRE', title: 'ZZ TEST — Frigo réalisé', carnet: { ...OUVERTS[0].carnet, archive: { le: LE, raison: 'plan réalisé' } } } as unknown as CreativeItem;
    monter([...DOCS, autre]);
    expect(titres()).not.toContain('ZZ TEST — Frigo réalisé');
    expect(titres(screen.getByRole('region', { name: 'Faits' }))).toHaveLength(5);
  });

  it('tous archivés : la liste montre encore « Faits · 19 » (pas l’écran du premier usage)', () => {
    const archives = TOUS.map(c => ({ ...c, carnet: { ...c.carnet, archive: c.carnet.archive ?? { le: LE, raison: 'Fait' } } })) as unknown as CreativeItem[];
    monter(archives);
    expect(titres(screen.getByRole('region', { name: 'Faits' }))).toHaveLength(19);
  });
});

describe('h1 tour 2 · D2 : anciennes notes de l’Atelier, en repli', () => {
  it('fermé par défaut, en bas, avec le compte ; rien d’autre n’y entre', () => {
    monter([...DOCS, CONTACT, BIERE, NOTE, ...AILLEURS]);
    const bouton = screen.getByRole('button', { name: /Anciennes notes de l’Atelier\s*·?\s*3/ });
    expect(bouton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(CONTACT.title)).toBeNull();
    /* en bas : après le groupe Faits */
    const faits = screen.getByRole('region', { name: 'Faits' });
    expect(faits.compareDocumentPosition(bouton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('ouvert : titre, genre en mot et date, en lecture seule ; aucune écriture', () => {
    const m = monter([...DOCS, CONTACT, BIERE, NOTE, ...AILLEURS]);
    fireEvent.click(screen.getByRole('button', { name: /Anciennes notes de l’Atelier/ }));
    const liste = screen.getByRole('list', { name: 'Anciennes notes de l’Atelier' });
    const lignes = within(liste).getAllByRole('listitem');
    expect(lignes).toHaveLength(3);
    const texte = (t: string) => lignes.find(l => l.textContent?.includes(t))?.textContent ?? '';
    expect(texte(CONTACT.title)).toMatch(/contact/);
    expect(texte(CONTACT.title)).toMatch(/12\.11\.2026/);
    expect(texte(BIERE.title)).toMatch(/idée de bière/);
    expect(texte(BIERE.title)).toMatch(/03\.10\.2026/);
    expect(texte(NOTE.title)).toMatch(/note/);
    expect(texte(NOTE.title)).toMatch(/\d{2}\.\d{2}\.20\d{2}/);
    for (const a of AILLEURS) expect(within(liste).queryByText(a.title)).toBeNull();
    /* lecture seule : ni bouton, ni champ, ni lien dans la liste */
    expect(liste.querySelectorAll('button, input, textarea, a, select')).toHaveLength(0);
    expect(m.ecritures).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Anciennes notes de l’Atelier/ }));
    expect(screen.queryByRole('list', { name: 'Anciennes notes de l’Atelier' })).toBeNull();
  });

  it('masqué si aucune ancienne note', () => {
    monter([...DOCS, ...AILLEURS]);
    expect(screen.queryByText(/Anciennes notes/)).toBeNull();
  });

  it('sans aucun carnet, les anciennes notes restent atteignables', () => {
    monter([CONTACT]);
    expect(screen.getByRole('button', { name: /Anciennes notes de l’Atelier\s*·?\s*1/ })).toBeTruthy();
  });
});

describe('h1 tour 2 · Brassins › Atelier › Carnet, période 01.09–30.09', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?dev-local');
    localStorage.clear();
    FirestoreRepo.startSync();
    for (const d of [...DOCS, BIERE]) FirestoreRepo.put('creativeItems', d.id, d);
  });
  afterEach(() => { FirestoreRepo.stopSync(); window.history.replaceState({}, '', '/'); });

  it('les 19 projets (5 faits) et le repli des anciennes notes', { timeout: 40000 }, async () => {
    render(<ProductionTab batches={[]} recipes={[]} brewhouses={[]} activeBrewhouseId="" globalTimeFilter={SEPTEMBRE} targetSubTab="lab"
      onOpenCreateBatch={() => {}} onOpenRecipe={() => {}} onOpenBrewDay={() => {}} onDraftRecipe={() => {}} />);
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });
    await waitFor(() => expect(document.querySelector('[data-carnets]')).not.toBeNull(), { timeout: 15000 });
    await waitFor(() => expect(titres()).toHaveLength(19), { timeout: 15000 });
    expect(titres(screen.getByRole('region', { name: 'Faits' }))).toHaveLength(5);
    expect(screen.getByRole('button', { name: /Anciennes notes de l’Atelier\s*·?\s*1/ })).toBeTruthy();
  });
});
