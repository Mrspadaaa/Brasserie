// Banc local de la voie t4a (dev seulement, jamais livré, données SIMULÉES « ZZ TEST ») : monte la VRAIE liste Stocks › Matériel › À venir (UpgradeWorkspace vue="future")
// sur trois projets chiffrés dont un prochain achat de 3 200 CHF, pour lire « Les suivants » (T4-3). ?dev-local&theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { UpgradeWorkspace } from '../../../../../../src/ui/finance/UpgradeWorkspace';
import { FloatingActions } from '../../../../../../src/ui/FloatingActions';
import { FirestoreRepo } from '../../../../../../src/services/firestoreRepo';
import { FinanceService } from '../../../../../../src/services/financeService';
import type { FinancialPlan } from '../../../../../../src/domain/finance/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }
document.documentElement.style.setProperty('--main-navigation-height', '56px');
FirestoreRepo.startSync();

const plan = (id: string, title: string, cents: number, timing: 'soon' | 'later'): FinancialPlan => ({
  id, title, date: '', amountCents: cents, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: '2026-11-01T10:00:00.000Z',
  upgrade: { version: 1, timing, stage: 'idea', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: cents } });
FinanceService.savePlan(plan('ZZ-1', 'ZZ TEST — Frigo de garde pour fûts', 320000, 'soon'));
FinanceService.savePlan(plan('ZZ-2', 'ZZ TEST — Cuve de fermentation 100 L', 35000, 'later'));
FinanceService.savePlan(plan('ZZ-3', 'ZZ TEST — Pompe et tuyaux inox', 120000, 'later'));
const rien = () => undefined;

const Banc = () => (
  <>
    <div className="px-3 pt-3 pb-24">
      <UpgradeWorkspace vue="future" onVue={rien} />
    </div>
    <div className="app-bottom-dock"><nav className="nav-principale fixed left-0 right-0 bottom-0 z-40 flex border-t border-cave-800 bg-cave-950" style={{ height: 56 }} aria-label="Onglets (banc)">
      {['Bord', 'Finances', 'Calendrier', 'Brassins', 'Stocks'].map((n) => <span key={n} className="flex-1 grid place-items-center text-sm text-cave-400">{n}</span>)}
    </nav></div>
    <FloatingActions action={null} onAction={rien} companionLabel="Stocks" anchor="nav" />
  </>
);
createRoot(document.getElementById('root')!).render(<Banc />);
