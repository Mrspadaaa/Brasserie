import React, { useRef, useState } from 'react';
import { Archive, ChevronRight, RotateCcw } from 'lucide-react';
import type { Transaction } from '../../types';
import type { EquipmentUpgrade, FinancialPlan } from '../../domain/finance/types';
import { UPGRADE_STAGES, UPGRADE_TIMINGS, upgradeBudget, upgradeDetails, upgradeProgress, upgradeReadiness } from '../../domain/finance/upgrades';
import { formatCHF, isActiveTransaction, isoDate, planInvoiceAllocation, transactionKind } from '../../domain/finance/ledger';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { Sheet } from '../Sheet';
import { Field, MoneyInput, idFor } from './FinanceForms';

const readPurchases = () => ({ transactions: StorageService.getTransactions(), payments: FinanceService.getPayments() });
export function UpgradeSheet({ plan, onClose, onSaved, onOpenTransaction }: { plan?: FinancialPlan; onClose: () => void; onSaved?: () => void; onOpenTransaction?: (transaction: Transaction) => void }) {
  const purchases = useStorageValue(readPurchases);
  const [draft, setDraft] = useState<FinancialPlan>(() => plan ? { ...plan, upgrade: upgradeDetails(plan) } : {
    id: idFor('UPGRADE'), title: '', date: '', amountCents: 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: new Date().toISOString(),
    upgrade: { version: 1, timing: 'later', stage: 'idea', budgetKnown: false, datePrecision: 'month', estimateSource: 'estimate' },
  });
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const detail = draft.upgrade!;
  const patch = (value: Partial<EquipmentUpgrade>) => setDraft(previous => {
    const upgrade = { ...previous.upgrade!, ...value }, total = upgradeBudget(upgrade);
    return { ...previous, upgrade: { ...upgrade, budgetKnown: total !== null }, amountCents: total ?? 0 };
  });
  const setMonth = (value: string) => setDraft(previous => ({ ...previous, date: value ? `${value}-01` : '', upgrade: { ...previous.upgrade!, datePrecision: 'month' } }));
  const save = async (status = draft.status) => {
    if (locked.current) return;
    if (!draft.title.trim()) { setError('Nomme le matériel ou l’aménagement à prévoir.'); return; }
    locked.current = true; setBusy(true); setError('');
    try { await FinanceService.saveUpgrade({ ...draft, title: draft.title.trim(), status }); onSaved?.(); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Le projet n’a pas pu être enregistré.'); }
    finally { locked.current = false; setBusy(false); }
  };
  const missing = upgradeReadiness(draft);
  const progress = upgradeProgress(draft, purchases.transactions, purchases.payments);
  const invoices = purchases.transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && tx.finance?.planId === draft.id);
  return <Sheet open title={plan ? 'Mon projet de matériel' : 'Prévoir du matériel'} subtitle="Du besoin à l’achat" className="finance-sheet" dismissible={!busy} onClose={onClose}
    footer={<div className="finance-actions"><button className="finance-action secondary" disabled={busy} onClick={onClose}>Annuler</button><button className="finance-action" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer le projet'}</button></div>}>
    <div className="finance-form">
      {error && <p role="alert" className="finance-error">{error}</p>}
      <Field label="Matériel ou aménagement"><input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Hotte, fermenteur, nouvelle cuverie…" autoComplete="off" /></Field>
      <Field label="À quoi va-t-il servir ?"><textarea rows={2} value={detail.purpose ?? ''} onChange={e => patch({ purpose: e.target.value })} placeholder="Évacuer la vapeur, libérer un fermenteur, augmenter le volume…" /></Field>
      <div role="group" aria-label="Quand ce projet devient-il utile ?" className="finance-filter upgrade-timings">
        {Object.entries(UPGRADE_TIMINGS).map(([value, label]) => <button key={value} aria-pressed={detail.timing === value} onClick={() => patch({ timing: value as EquipmentUpgrade['timing'] })}>{label}</button>)}
      </div>
      <div className="finance-form-grid">
        <MoneyInput label="Prix estimé TTC (CHF)" value={detail.purchaseCents} onChange={value => patch({ purchaseCents: value })} />
        <Field label="Paiement prévu en"><input type="month" value={draft.date.slice(0, 7)} onInput={e => setMonth(e.currentTarget.value)} onChange={e => setMonth(e.target.value)} /></Field>
      </div>
      <details className="finance-disclosure"><summary>Livraison, installation et devis</summary><div className="finance-form">
        <MoneyInput label="Livraison TTC (CHF)" value={detail.deliveryCents} onChange={value => patch({ deliveryCents: value })} />
        <MoneyInput label="Installation TTC (CHF)" value={detail.installationCents} onChange={value => patch({ installationCents: value })} />
        <Field label="D’où vient le prix ?"><select value={detail.estimateSource} onChange={e => patch({ estimateSource: e.target.value as EquipmentUpgrade['estimateSource'] })}><option value="estimate">Mon estimation</option><option value="quote">Devis fournisseur</option></select></Field>
        <Field label="Fournisseur"><input value={draft.vendor ?? ''} onChange={e => setDraft({ ...draft, vendor: e.target.value })} /></Field>
        <Field label="Référence ou détails du devis"><textarea rows={2} value={detail.quoteReference ?? ''} onChange={e => patch({ quoteReference: e.target.value })} placeholder="Référence, date, durée de validité, ce qui est compris…" /></Field>
        <p className="finance-muted">Pour une hotte, pense à la pose et au raccordement. Pour un fermenteur, au refroidissement et aux accessoires nécessaires.</p>
      </div></details>
      <div className="upgrade-budget"><span>Budget total TTC</span><strong className="finance-money">{detail.budgetKnown ? formatCHF(draft.amountCents) : 'À estimer'}</strong></div>
      <p className="finance-muted">Les frais laissés vides ne sont pas chiffrés. Tu peux garder une idée sans prix ni date.</p>
      {draft.date && detail.datePrecision === 'month' && <p className="finance-muted">Dans la simulation, le paiement est placé au début du mois choisi. La facture précisera l’échéance réelle.</p>}
      {['draft', 'active'].includes(draft.status) ? <div className="upgrade-inclusion">
        <label className="finance-check"><input type="checkbox" checked={draft.status === 'active'} onChange={e => setDraft({ ...draft, status: e.target.checked ? 'active' : 'draft' })} />Inclure dans mes prévisions</label>
        <p className="finance-muted">{draft.status === 'active' ? missing.length ? missing.join(' ') : 'Ce budget sera visible dans les sorties et la trésorerie prévues.' : 'Le projet reste dans tes idées de matériel.'}</p>
      </div> : <p className="finance-notice">{draft.status === 'completed' ? 'Projet réalisé. Les achats liés restent dans les analyses.' : 'Projet archivé. Tu peux le reprendre quand il redevient utile.'}</p>}
      {invoices.length > 0 && <details className="finance-disclosure"><summary>Achats liés · {progress.invoicedComplete ? formatCHF(progress.invoicedCents) : 'montants à répartir'}</summary><div className="finance-form">
        <p className="finance-muted">Facturé pour ce projet, avoirs déduits. Les achats restent dans les comptes même si tu retires ou archives le projet.</p>
        <div className="upgrade-budget"><span>Paiements enregistrés, remboursements déduits</span><strong>{progress.paymentKnown ? formatCHF(progress.paidCents) : 'À confirmer'}</strong></div>
        {!progress.invoicedComplete && <p className="finance-notice">Une facture mixte ou un avoir reste à répartir. Ouvre la facture dans le journal pour confirmer la part liée au projet.</p>}
        {invoices.map(tx => {
          const allocation = planInvoiceAllocation(tx).amountCents;
          const content = <><span className="finance-row-main"><strong>{tx.description}</strong><span className="finance-muted">{isoDate(tx.date) ? new Date(`${isoDate(tx.date)}T12:00:00`).toLocaleDateString('fr-CH') : 'Date à confirmer'} · Part du projet</span></span><span className="finance-money">{allocation == null ? 'À répartir' : formatCHF(allocation)}</span></>;
          return onOpenTransaction ? <button className="finance-row" key={tx.id} onClick={() => onOpenTransaction(tx)}>{content}<ChevronRight size={16}/></button> : <div className="finance-row" key={tx.id}>{content}</div>;
        })}
      </div></details>}
      <details className="finance-disclosure"><summary>Avancement et notes</summary><div className="finance-form">
        <Field label="Avancement du projet"><select value={detail.stage} onChange={e => patch({ stage: e.target.value as EquipmentUpgrade['stage'] })}>{Object.entries(UPGRADE_STAGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Notes du projet"><textarea rows={3} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field>
      </div></details>
      {plan && <div className="finance-divider">
        {['cancelled', 'completed'].includes(plan.status) ? <button className="finance-link" disabled={busy} onClick={() => void save('draft')}><RotateCcw size={18} />Reprendre ce projet</button> : <>
          <button className="finance-link" disabled={busy} onClick={() => void save('completed')}>Marquer comme réalisé</button>
          <button className="finance-link" disabled={busy} onClick={() => void save('cancelled')}><Archive size={18} />Archiver ce projet</button>
        </>}
      </div>}
    </div>
  </Sheet>;
}
