import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ASOF, atelier, brassin, cuve, frigo, loyer, profil, stocks } from './previsionsFixture';

// CP-13 (10.11) : « Les prévisions viennent d'ici ??? Avec des revois !!! » — Brassins › Atelier › Matériel › À venir ne disait pas que ses projets
// n'étaient pas dans Finances › Prévisions, et Prévisions ne disait pas qu'elle les écartait. Le calcul (`forecast.ts`) ne change pas ; on le dit, des deux côtés, avec des renvois.
const read = () => StorageService.getTransactions();
const lots = [brassin()];
function Ecran({ requete }: { requete?: { onglet: string; at: number } | null }) {
  const transactions = useStorageValue(read);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={lots} stockItems={stocks()} ongletRequest={requete} />;
}
const projet = (id: string, title: string, cents: number | null, patch: Partial<FinancialPlan> = {}, timing: 'soon' | 'next' | 'later' = 'later'): FinancialPlan => ({
  id, title, date: '', amountCents: cents ?? 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: '2026-10-01T00:00:00Z',
  upgrade: { version: 1, timing, stage: 'ready', budgetKnown: cents != null, datePrecision: 'month', estimateSource: 'estimate', ...(cents != null ? { purchaseCents: cents } : {}) }, ...patch });
const SA_CAPTURE = [projet('B100', 'B100 aio brewtool', 320_000, {}, 'soon'), projet('CHAMBRE', 'Chambre chaude régulée', 35_000), projet('EMBOUT', 'Système d’embouteillage 4 becs inox', 120_000)];
function semer(plans: FinancialPlan[]) {
  FinanceService.saveProfile({ ...FinanceService.getProfile(), ...profil() } as never);
  FinanceService.saveAsset(cuve());
  for (const p of [loyer, ...plans]) FinanceService.savePlan(p);
}
const ouvrirPrevisions = () => { render(<Ecran />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' })); };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00Z`));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'forecast');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Prévisions dit les projets de matériel qu’elle ne compte pas (CP-13)', () => {
  it('(a) trois projets sans date : « 3 achats de matériel pas comptés », le premier nommé, le toucher ouvre « Mes projets de matériel »', () => {
    semer(SA_CAPTURE); ouvrirPrevisions();
    const ligne = screen.getByRole('button', { name: /3 achats de matériel pas comptés/ });
    expect(ligne).toHaveClass('prv-depart');
    expect(ligne).toHaveTextContent('date ou budget à compléter : B100 aio brewtool 3 200,00, Chambre chaude régulée 350,00 +1');
    expect(screen.queryByRole('dialog', { name: 'Mes projets de matériel' })).not.toBeInTheDocument();
    fireEvent.click(ligne);
    const feuille = screen.getByRole('dialog', { name: 'Mes projets de matériel' });
    expect(within(feuille).getByText('B100 aio brewtool')).toBeVisible();
  });
  it('(a bis) un seul projet : le singulier ; un budget inconnu n’est jamais 0,00', () => {
    semer([projet('IDEE', 'Nouvelle cuverie', null)]); ouvrirPrevisions();
    const ligne = screen.getByRole('button', { name: /1 achat de matériel pas compté/ });
    expect(ligne).toHaveTextContent('date ou budget à compléter : Nouvelle cuverie');
    expect(ligne).not.toHaveTextContent('0,00');
  });
  it('(a ter) un projet complet mais pas inclus (brouillon) est dit aussi, avec son geste', () => {
    semer([projet('PRET', 'Hotte', 90_000, { date: '2026-12-10' })]); ouvrirPrevisions();
    expect(screen.getByRole('button', { name: /1 achat de matériel pas compté/ })).toHaveTextContent('à inclure : Hotte 900,00');
  });
  it('(b) un projet daté, budgété et inclus compte déjà (la marche « frigo »), sans ligne', () => {
    semer([frigo()]); ouvrirPrevisions();
    expect(screen.queryByRole('button', { name: /achats? de matériel pas compté/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /Avec ou sans/ })).getByRole('button', { name: /Avec frigo/ })).toBeVisible();
  });
  it('(b bis) un projet annulé ou réalisé n’est pas « pas compté »', () => {
    semer([projet('FAIT', 'Vieille cuve', 50_000, { status: 'completed' }), projet('ANN', 'Idée morte', 10_000, { status: 'cancelled' })]); ouvrirPrevisions();
    expect(screen.queryByRole('button', { name: /de matériel pas compté/ })).not.toBeInTheDocument();
  });
});

describe('Atelier › Matériel › À venir dit l’état de chaque projet et renvoie (CP-13)', () => {
  const atelierSemé = () => semer([...SA_CAPTURE, frigo({ title: 'Frigo' })]);
  it('(c) « pas dans les prévisions » pour un projet à compléter, « dans les prévisions · nov. 2026 » pour une marche', () => {
    atelierSemé(); render(<UpgradeWorkspace />);
    const b100 = screen.getByText('B100 aio brewtool').closest('article')!;
    expect(b100).toHaveTextContent('pas dans les prévisions');
    expect(b100).not.toHaveTextContent('dans les prévisions ·');
    const f = screen.getByText('Frigo').closest('article')!;
    expect(f).toHaveTextContent(/dans les prévisions · nov\. 2026/);
    expect(f).not.toHaveTextContent('pas dans les prévisions');
  });
  it('(c bis) la ligne-renvoi est UNE, en tête de la liste ; elle émet affinee:ouvrir-finances (previsions)', () => {
    atelierSemé(); render(<UpgradeWorkspace />);
    const renvois = screen.getAllByRole('button', { name: /Datés et budgétés, ils entrent dans Finances › Prévisions/ });
    expect(renvois).toHaveLength(1);
    const ecoute = vi.fn((e: Event) => e.preventDefault()); window.addEventListener('affinee:ouvrir-finances', ecoute);
    fireEvent.click(renvois[0]);
    window.removeEventListener('affinee:ouvrir-finances', ecoute);
    expect(ecoute).toHaveBeenCalledTimes(1);
    expect((ecoute.mock.calls[0][0] as CustomEvent).detail).toEqual({ onglet: 'previsions' });
  });
  it('(c ter) sans écouteur, la ligne dit où aller au lieu de se taire', () => {
    atelierSemé(); render(<UpgradeWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /Datés et budgétés, ils entrent dans Finances › Prévisions/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Finances › Prévisions');
  });
  it('(c quater) ouvert depuis Prévisions (prop), le renvoi ferme la feuille et n’émet rien', () => {
    atelierSemé(); const ferme = vi.fn(); const ecoute = vi.fn(); window.addEventListener('affinee:ouvrir-finances', ecoute);
    render(<UpgradeWorkspace onVoirPrevisions={ferme} />);
    fireEvent.click(screen.getByRole('button', { name: /Datés et budgétés, ils entrent dans Finances › Prévisions/ }));
    window.removeEventListener('affinee:ouvrir-finances', ecoute);
    expect(ferme).toHaveBeenCalledTimes(1); expect(ecoute).not.toHaveBeenCalled();
  });
  it('(c quinquies) pas de renvoi ni d’état dans Réalisés et Archives', () => {
    semer([...SA_CAPTURE, projet('FAIT', 'Vieille cuve', 50_000, { status: 'completed', date: '2026-03-01' })]); render(<UpgradeWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Réalisés' }));
    expect(screen.queryByRole('button', { name: /Datés et budgétés/ })).not.toBeInTheDocument();
    expect(screen.getByText('Vieille cuve').closest('article')).not.toHaveTextContent('prévisions');
  });
});

describe('FinancesTab choisit le sous-onglet reçu (CP-13)', () => {
  it('(d) une demande « previsions » ouvre Finances › Prévisions, depuis la Synthèse', () => {
    semer([frigo()]); StorageService.setUiState('finances_workspace', 'overview');
    const { rerender } = render(<Ecran />);
    expect(screen.getByRole('tab', { name: 'Synthèse' })).toHaveAttribute('aria-selected', 'true');
    rerender(<Ecran requete={{ onglet: 'previsions', at: 1 }} />);
    expect(screen.getByRole('tab', { name: 'Prévisions' })).toHaveAttribute('aria-selected', 'true');
  });
  it('(d bis) la même demande ne rejoue pas : le brasseur peut revenir à la Synthèse', () => {
    semer([frigo()]); StorageService.setUiState('finances_workspace', 'overview');
    const requete = { onglet: 'previsions', at: 7 };
    const { rerender } = render(<Ecran requete={requete} />);
    expect(screen.getByRole('tab', { name: 'Prévisions' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Synthèse' }));
    rerender(<Ecran requete={requete} />);
    expect(screen.getByRole('tab', { name: 'Synthèse' })).toHaveAttribute('aria-selected', 'true');
  });
  it('(d ter) un onglet inconnu est ignoré', () => {
    semer([frigo()]); StorageService.setUiState('finances_workspace', 'overview');
    render(<Ecran requete={{ onglet: 'nimporte', at: 3 }} />);
    expect(screen.getByRole('tab', { name: 'Synthèse' })).toHaveAttribute('aria-selected', 'true');
  });
  it('(d quater) depuis Prévisions, la feuille « Mes projets de matériel » : son renvoi la ferme', () => {
    semer(SA_CAPTURE); ouvrirPrevisions();
    fireEvent.click(screen.getByRole('button', { name: /3 achats de matériel pas comptés/ }));
    const feuille = screen.getByRole('dialog', { name: 'Mes projets de matériel' });
    fireEvent.click(within(feuille).getByRole('button', { name: /Datés et budgétés, ils entrent dans Finances › Prévisions/ }));
    expect(screen.queryByRole('dialog', { name: 'Mes projets de matériel' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Prévisions' })).toHaveAttribute('aria-selected', 'true');
  });
});
void act;
