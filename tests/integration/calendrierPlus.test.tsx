import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* « Prévoir une dépense » (PlanSheet) lit Finances : un service simulé, comme les tests de la feuille (previsionAjout). Aucune donnée réelle. */
const etat = vi.hoisted(() => ({ savePlan: vi.fn(), profile: null as unknown, plans: [] as unknown[] }));
vi.mock('../../src/services/financeService', () => {
  const FinanceService = {
    getPayments: () => [], getPlans: () => etat.plans, getProfile: () => etat.profile, getAssets: () => [], getClosings: () => [],
    snapshot: () => ({ profile: etat.profile, plans: etat.plans, payments: [], assets: [], closings: [] }),
    savePlan: (...a: unknown[]) => etat.savePlan(...a)
  };
  return { FinanceService };
});
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { PlanSheet } from '../../src/ui/finance/FinanceForms';
import { StorageService } from '../../src/services/storage';
import { usePlusPageActions } from '../../src/ui/plusPage';
import type { FinancialProfile } from '../../src/domain/finance/types';

const JOUR = '2026-11-16';
const profilConnu: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-01-01', amountCents: 400_000, confirmed: true } } as FinancialProfile;
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  etat.profile = profilConnu; etat.plans = []; etat.savePlan.mockReset();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const monter = (props: React.ComponentProps<typeof BancCalendrier> = {}) => {
  const appels: Appel[] = [];
  const r = render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} {...props} />);
  return { appels, ...r };
};
const dialogue = (nom: string) => within(screen.getByRole('dialog', { name: nom }));
function Lecteur() {
  const decl = usePlusPageActions();
  return <ul data-lecteur>{decl?.actions.map(a => <li key={a.id}><button type="button" onClick={a.lancer}>{a.label}</button></li>)}</ul>;
}

describe('C6 : le + volant porte les gestes du calendrier, dans l’ordre de la frise', () => {
  const ATTENDU: Array<[string, string]> = [
    ['Poser un brassin', 'Brassins'], ['Poser une fête', 'Fêtes'], ['Poser une vente', 'Ventes'], ['Prévoir un achat', 'Achats'],
    ['Prévoir des travaux', 'Travaux'], ['Noter une activité', 'Activités'], ['Prévoir un papier', 'Papiers'], ['Noter une idée', 'Noter une idée']
  ];
  it('usePlusPageActions rend les huit lignes dans l’ordre ; chacune ouvre la feuille sur sa rangée ; aucun « S\\d+ » sur le +', () => {
    render(<><BancCalendrier aujourdhui={JOUR} /><Lecteur /></>);
    const lecteur = within(document.querySelector('[data-lecteur]') as HTMLElement);
    expect(lecteur.getAllByRole('button').map(b => b.textContent)).toEqual(ATTENDU.map(a => a[0]));
    for (const [ligne, titre] of ATTENDU) {
      fireEvent.click(lecteur.getByRole('button', { name: ligne }));
      const d = screen.getByRole('dialog', { name: titre });
      if (titre !== 'Noter une idée') expect(d.querySelector(`[data-feuille-rangee]`)).not.toBeNull();
      fireEvent.keyDown(d, { key: 'Escape' });
    }
    const plus = screen.getByRole('button', { name: /Actions rapides/ });
    expect(plus.getAttribute('aria-label')).not.toMatch(/S\d+/);
    for (const [ligne] of ATTENDU) expect(ligne).not.toMatch(/S\d+/);
  });

  it('le + de l’app ouvre la pile : « Sur Calendrier » en tête (huit lignes), « Partout » au-dessus', () => {
    render(<BancCalendrier aujourdhui={JOUR} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    const menu = screen.getByRole('menu');
    const textes = [...menu.querySelectorAll('[role="menuitem"]')].map(i => i.textContent ?? '');
    for (const [ligne] of ATTENDU) expect(textes.some(t => t.includes(ligne)), ligne).toBe(true);
    expect(menu.textContent).toMatch(/Sur\s*le calendrier/);
    expect(menu.textContent).toMatch(/Partout/);
    expect(menu.textContent).not.toMatch(/\bS\d{2}\b/);
  });
});

describe('C7 (CAL-CLAV) : une fête, une vente probable et un brassin s’ajoutent sans clavier, en 2 touchers', () => {
  const ouvrir = (id: string) => fireEvent.click(document.querySelector(`button[data-plus="${id}"]`)!);

  it('fête : une puce, « Ajouter » ; aucun champ numérique', async () => {
    const { appels } = monter();
    ouvrir('fetes');
    const d = dialogue('Fêtes');
    let touchers = 0;
    fireEvent.click(d.getByRole('button', { name: 'Fête de village' })); touchers += 1;
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ })); touchers += 1;
    expect(touchers).toBeLessThanOrEqual(2);
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'creativeItems', patch: { type: 'event', title: 'Fête de village', date: '2026-11-16' } });
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });

  it('vente probable : la puce porte le client et le montant, « Ajouter »', async () => {
    const { appels } = monter();
    ouvrir('ventes');
    const d = dialogue('Ventes');
    fireEvent.click(d.getByRole('button', { name: /Café du Pont, 1 fût/ }));
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'financialPlans', patch: { title: 'Café du Pont, 1 fût', amountCents: 13000, direction: 'in', status: 'draft' } });
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });

  it('brassin : la puce de la recette, « Ajouter » : un brassin planifié avec sa recette', async () => {
    const { appels } = monter();
    ouvrir('brassins');
    const d = dialogue('Brassins');
    fireEvent.click(d.getByRole('button', { name: 'Porter d’hiver' }));
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'batches', patch: { recipeRef: 'R-PORTER', status: 'planifie', plannedBrewDate: '2026-11-16' } });
  });

  it('une somme au-delà de 10 fois la plus grosse de la rangée demande confirmation', async () => {
    const { appels } = monter();
    ouvrir('achats');
    const d = dialogue('Achats');
    fireEvent.click(d.getByRole('button', { name: 'Hotte' }));
    const champ = d.getByLabelText('Montant en CHF');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '90000' } }); fireEvent.blur(champ);
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    expect(await screen.findByText(/plus de 10 fois/)).toBeInTheDocument();
    expect(appels).toHaveLength(0);
    fireEvent.click(d.getByRole('button', { name: /^Oui, 90 000 CHF/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
  });
});

describe('C13 (D-117) : « Mettre de côté » ne crée aucun plan dans Finances', () => {
  it('Activités avec fenêtre et montant : « Mettre de côté » s’active ; la chose porte fenetre.miseDeCote ; 0 écriture de FinancialPlan', async () => {
    const { appels } = monter({ callbacks: { periode: { genre: 'dates', du: '2026-11-16', au: '2027-11-14' } } });
    fireEvent.click(document.querySelector('button[data-plus="activites"]')!);
    const d = dialogue('Activités');
    expect(d.queryByRole('button', { name: /Mettre de côté/ })).toBeNull();
    fireEvent.click(d.getByRole('button', { name: 'Inventaire du stock' }));
    const semaines = within(d.getByRole('group', { name: 'Semaine' }));
    fireEvent.click(semaines.getByRole('button', { name: /^S20/ }));
    fireEvent.click(semaines.getByRole('button', { name: /^S40/ }));
    const champ = d.getByLabelText('Montant en CHF');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '600' } }); fireEvent.blur(champ);
    const mise = d.getByRole('button', { name: /Mettre de côté/ });
    fireEvent.click(mise);
    expect(mise).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'creativeItems', patch: { fenetre: { du: '2027-05-17', au: '2027-10-10', miseDeCote: true } } });
    expect(appels.filter(a => a.collection === 'financialPlans')).toHaveLength(0);
    expect(etat.savePlan).not.toHaveBeenCalled();
  });

  it('Achats avec fenêtre et montant : « Mettre de côté » est proposé', () => {
    monter();
    fireEvent.click(document.querySelector('button[data-plus="achats"]')!);
    const d = dialogue('Achats');
    const semaines = within(d.getByRole('group', { name: 'Semaine' }));
    fireEvent.click(semaines.getByRole('button', { name: /^S49/ }));
    fireEvent.click(semaines.getByRole('button', { name: /^S52/ }));
    const champ = d.getByLabelText('Montant en CHF');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '300' } }); fireEvent.blur(champ);
    expect(d.getByRole('button', { name: /Mettre de côté/ })).toBeInTheDocument();
  });
});

describe('C17 (D-68) : « Plus de détails › » ouvre Prévoir une dépense, datée du lundi de la semaine choisie', () => {
  it('sur la feuille Achats, S50 choisie : PlanSheet titrée « Prévoir une dépense », date = lundi de S50 (prop existante `date`)', () => {
    function Harnais() {
      const [date, setDate] = React.useState<string | null>(null);
      return <><BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserDepense: setDate }} />{date && <PlanSheet date={date} onClose={() => setDate(null)} />}</>;
    }
    render(<Harnais />);
    fireEvent.click(document.querySelector('button[data-plus="achats"]')!);
    const d = dialogue('Achats');
    fireEvent.click(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: /^S50/ }));
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    const plan = within(screen.getByRole('dialog', { name: 'Prévoir une dépense' }));
    expect(plan.getByLabelText('Date de paiement prévue')).toHaveValue('2026-12-07');
  });

  it('ouverte depuis Finances sans date, elle garde la date du jour', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
    render(<PlanSheet onClose={() => undefined} />);
    expect(within(screen.getByRole('dialog', { name: 'Prévoir une dépense' })).getByLabelText('Date de paiement prévue')).toHaveValue('2026-11-15');
  });

  it('aucune prop dateInitiale n’existe dans le code', () => {
    const racine = join(process.cwd(), 'src');
    const fichiers = (readdirSync(racine, { recursive: true }) as string[]).filter(f => /\.(ts|tsx)$/.test(f));
    const trouves = fichiers.filter(f => readFileSync(join(racine, f), 'utf8').includes('dateInitiale'));
    expect(trouves).toEqual([]);
  });
});
