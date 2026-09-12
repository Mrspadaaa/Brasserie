import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Plus, Wrench } from 'lucide-react';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { isUpgradePlan, UPGRADE_STAGES, UPGRADE_TIMINGS, upgradeDetails, upgradeProgress, upgradeReadiness } from '../../domain/finance/upgrades';
import { formatCHF, isoDate } from '../../domain/finance/ledger';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { UpgradeSheet } from './UpgradeSheet';
import { ExpenseSheet } from './ExpenseSheet';
import { useMobileLayout } from '../useViewport';
import { ViewNavigation } from '../ViewNavigation';
import './finance.css';
import './upgrades.css';

const read = () => ({ ...FinanceService.snapshot(), transactions: StorageService.getTransactions() });
export const upgradeDateLabel = (plan: FinancialPlan) => {
  const date = isoDate(plan.date);
  return date ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric', ...(upgradeDetails(plan).datePrecision === 'day' ? { day: 'numeric' } : {}) }) : 'Date à choisir';
};

export function UpgradeWorkspace({ onOpenProject, createRequest, onCreateRequestHandled }: { onOpenProject?: (plan: FinancialPlan | null) => void; createRequest?: { kind: string; at: number } | null; onCreateRequestHandled?: () => void }) {
  const mobile = useMobileLayout();
  const data = useStorageValue(read);
  const [scope, setScope] = useState('future');
  const [editing, setEditing] = useState<FinancialPlan | null | undefined>();
  const [purchase, setPurchase] = useState<FinancialPlan>();
  const [busy, setBusy] = useState<string>(), [error, setError] = useState('');
  const open = (plan: FinancialPlan | null) => onOpenProject ? onOpenProject(plan) : setEditing(plan);
  const handled = React.useRef<number>(undefined);
  React.useEffect(() => { if (createRequest?.kind === 'newIdea' && createRequest.at !== handled.current) { handled.current = createRequest.at; open(null); onCreateRequestHandled?.(); } }, [createRequest?.at]);
  const projects = data.plans.filter(isUpgradePlan);
  const visible = projects.filter(p => scope === 'future' ? ['draft', 'active'].includes(p.status) : scope === 'completed' ? p.status === 'completed' : p.status === 'cancelled');
  const changeInclusion = async (plan: FinancialPlan, include: boolean) => {
    if (busy) return;
    if (include && upgradeReadiness(plan).length) { open(plan); return; }
    setBusy(plan.id); setError('');
    try { await FinanceService.saveUpgrade({ ...plan, status: include ? 'active' : 'draft' }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Le projet n’a pas pu être mis à jour.'); }
    finally { setBusy(undefined); }
  };
  const renderProject = (plan: FinancialPlan) => {
    const detail = upgradeDetails(plan), progress = upgradeProgress(plan, data.transactions, data.payments), missing = upgradeReadiness(plan);
    return <article className="upgrade-item" key={plan.id}>
      <button className="upgrade-project" onClick={() => open(plan)}>
        <span className="finance-row-main"><strong>{plan.title}</strong><span className="finance-muted">{upgradeDateLabel(plan)}{scope === 'future' ? ` · ${UPGRADE_STAGES[detail.stage]}` : ''}</span>{!mobile && detail.purpose && <span className="upgrade-purpose">{detail.purpose}</span>}</span>
        <span className="upgrade-price">{detail.budgetKnown ? formatCHF(plan.amountCents) : 'À estimer'}<ChevronRight size={16}/></span>
      </button>
      {progress.invoiceCount > 0 && <p className="finance-muted upgrade-actual">Achats liés : {progress.invoicedComplete?formatCHF(progress.invoicedCents):'À répartir'}{detail.budgetKnown ? ` sur ${formatCHF(plan.amountCents)} prévus` : ''}</p>}
      {scope === 'future' && <div className="upgrade-project-actions">
        {missing.length && plan.status !== 'active' ? <button className="finance-link" onClick={() => open(plan)}>Budget ou date à compléter<ChevronRight size={16}/></button> : <label className="finance-check"><input type="checkbox" aria-label={`Inclure ${plan.title} dans les prévisions`} checked={plan.status === 'active'} disabled={!!busy} onChange={e => void changeInclusion(plan, e.target.checked)}/>{plan.status === 'active' ? 'Dans les prévisions' : 'Inclure dans les prévisions'}</label>}
        <button className="finance-link" onClick={() => setPurchase(plan)}>Noter l’achat<ArrowRight size={16}/></button>
      </div>}
    </article>;
  };
  return <div className="finance upgrade-workspace">
    {!mobile && <>
    <p className="finance-muted">Priorise tes équipements et choisis les achats à inclure dans tes prévisions.</p>
    <div className="upgrade-toolbar"><button className="finance-action" onClick={() => open(null)}><Plus size={18}/>Ajouter un projet</button></div>
    </>}
    <div className="flex items-center gap-2"><div className="min-w-0 flex-1">
      <ViewNavigation label="Afficher les projets" value={scope} onChange={setScope} options={[{value:'future',label:'À venir'},{value:'completed',label:'Réalisés'},{value:'archived',label:'Archives'}]}>
        <div className="finance-filter upgrade-scopes" role="group" aria-label="Afficher les projets"><button aria-pressed={scope === 'future'} onClick={() => setScope('future')}>À venir</button><button aria-pressed={scope === 'completed'} onClick={() => setScope('completed')}>Réalisés</button><button aria-pressed={scope === 'archived'} onClick={() => setScope('archived')}>Archives</button></div>
      </ViewNavigation>
    </div>{mobile && <button type="button" aria-label="Ajouter un projet" onClick={()=>open(null)} className="touch-target rounded-control bg-ebc-straw text-cave-950"><Plus size={21}/></button>}</div>
    {error && <p className="finance-error" role="alert">{error}</p>}
    {scope === 'future' ? Object.entries(UPGRADE_TIMINGS).map(([timing, label]) => {
      const rows = visible.filter(p => upgradeDetails(p).timing === timing).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title, 'fr'));
      return rows.length ? <section className="upgrade-stage" key={timing}><h3>{label}</h3>{rows.map(renderProject)}</section> : null;
    }) : visible.map(renderProject)}
    {!visible.length && <div className="finance-empty"><Wrench className="mx-auto"/><h3>{scope === 'future' ? 'Quel matériel te manque ?' : scope === 'completed' ? 'Tes projets réalisés' : 'Tes projets mis de côté'}</h3><p>{scope === 'future' ? 'Commence par le besoin. Le prix et la date pourront venir ensuite.' : scope === 'completed' ? 'Marque un projet comme réalisé pour le retrouver ici avec ses achats.' : 'Un projet archivé se retrouve ici et peut être repris.'}</p></div>}
    {editing !== undefined && <UpgradeSheet plan={editing ?? undefined} onClose={() => setEditing(undefined)}/>}
    {purchase && <ExpenseSheet initialIntent="equipment" initialPlanId={purchase.id} onSaved={() => {}} onClose={() => setPurchase(undefined)}/>}
  </div>;
}

export function UpgradeAnalytics({ plans, transactions, payments, onOpen, onBrowse }: { plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[]; onOpen: (plan: FinancialPlan) => void; onBrowse: () => void }) {
  const projects = plans.filter(isUpgradePlan);
  if (!projects.length) return null;
  const selected = projects.filter(p => p.status === 'active'), retained = selected.reduce((sum, p) => sum + p.amountCents, 0);
  const undecided = projects.filter(p => p.status === 'draft');
  const timingOrder = Object.keys(UPGRADE_TIMINGS);
  const comparisons = [...projects].sort((a,b) => Number(b.status==='active')-Number(a.status==='active') || timingOrder.indexOf(upgradeDetails(a).timing)-timingOrder.indexOf(upgradeDetails(b).timing) || (a.date||'9999').localeCompare(b.date||'9999'))
    .map(plan => ({ plan, progress: upgradeProgress(plan, transactions, payments) })).filter(row => row.plan.status === 'active' || row.progress.invoiceCount > 0).slice(0, 4);
  return <section className="finance-section upgrade-analytics">
    <div className="finance-heading"><h3>Évolution de la brasserie</h3></div>
    <div className="upgrade-budget"><span>Budgets retenus · tous horizons</span><strong className="finance-money">{formatCHF(retained)}</strong></div>
    <p className="finance-muted mt-2">{selected.length} projet{selected.length>1?'s':''} dans les prévisions · {undecided.length} idée{undecided.length>1?'s':''} gardée{undecided.length>1?'s':''} pour plus tard.</p>
    {comparisons.length > 0 && <div className="finance-list mt-3">{comparisons.map(({ plan, progress }) => <button className="finance-row" key={plan.id} onClick={() => onOpen(plan)}><span className="finance-row-main"><strong>{plan.title}</strong><span className="finance-muted">Depuis le début du projet · {progress.invoiceCount} facture{progress.invoiceCount>1?'s':''}</span></span><span className="finance-row-tail"><span className="finance-money">{progress.invoicedComplete?formatCHF(progress.invoicedCents):'À répartir'}</span><br/><span className="finance-muted">{upgradeDetails(plan).budgetKnown ? `sur ${formatCHF(plan.amountCents)} prévus` : 'Budget à estimer'}</span></span><ChevronRight size={16}/></button>)}</div>}
    <p className="finance-muted mt-2">Les budgets sont des intentions. Seules les factures entrent dans tes dépenses et ton dossier annuel.</p>
    <button className="finance-link" onClick={onBrowse}>Voir tous mes projets<ChevronRight size={16}/></button>
  </section>;
}
