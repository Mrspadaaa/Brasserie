import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Beer, Boxes, Calendar, Check, ChevronDown, ChevronRight,
  Copy, Plus, ReceiptText, ShieldCheck, Wallet
} from 'lucide-react';
import type { AppConfig, Batch, CreativeItem, GanttTask, StockItem, TimeFilterPeriod, Transaction } from '../../types';
import { compte } from '../../services/plural';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { DateUtils } from '../../services/dateUtils';
import { FinanceService } from '../../services/financeService';
import { formatCHF, summarizeLedger } from '../../domain/finance/ledger';
import { isCurrent } from '../../domain/catalogOrganization';
import { statusOf } from '../../domain/batchStatus';
import { fermentationReadings } from '../../domain/fermentationReadings';
import { daysSinceBrew } from '../../domain/productionInsights';

interface DashboardTabProps {
  transactions: Transaction[];
  batches: Batch[];
  stocks: { rawMaterials: StockItem[]; cleaning: StockItem[] };
  planning: GanttTask[];
  config: AppConfig;
  globalTimeFilter: TimeFilterPeriod;
  onNavigateTab: (tab: 'finances' | 'production' | 'stocks' | 'clients') => void;
  onOpenBatch: (batchId: string) => void;
  onNavigateToCreativeLab: () => void;
  onOpenCreateBatch: () => void;
  onOpenQuickAction: () => void;
}

const quantity = new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 3 });
const gravity = new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const rowAction = 'flex w-full min-h-7 items-center gap-2 px-2 py-1 text-left hover:bg-cave-850';
const smallAction = 'inline-flex min-h-7 items-center justify-center gap-1 rounded-control px-2 text-2xs font-semibold hover:bg-cave-850';
const summaryAction = 'flex min-h-8 cursor-pointer list-none items-center gap-2 px-2 py-1.5';
const dateOrder = (date?: string) => DateUtils.parseDate(date || '')?.getTime() ?? Infinity;
function displayDate(value?: string) {
  const date = DateUtils.parseDate(value || '');
  return date ? date.toLocaleDateString('fr-CH') : value || 'Date à préciser';
}

/** Le seuil est le repère affiché, pas une capacité ou une couverture supposée. */
function StockThreshold({ item }: { item: StockItem }) {
  if (!Number.isFinite(item.currentStock) || !Number.isFinite(item.minStock) || item.minStock <= 0) return null;
  const width = Math.min(1, Math.max(0, item.currentStock / item.minStock)) * 40;
  return <svg aria-hidden="true" viewBox="0 0 40 6" className="h-1.5 w-10 shrink-0">
    <rect y="1" width="40" height="4" rx="1" className="fill-cave-700" />
    <rect y="1" width={width} height="4" rx="1" className="fill-attention" />
    <path d="M39.5 0v6" className="stroke-cave-200" />
  </svg>;
}

/** A batch row always uses saved observations, at every viewport width. */
function BatchRow({ batch, onOpen }: { batch: Batch; onOpen: (id: string) => void }) {
  const status = statusOf(batch.status);
  const reading = fermentationReadings(batch);
  const days = daysSinceBrew(batch);
  const planned = batch.status === 'planifie';
  return <button type="button" onClick={() => onOpen(batch.id)} className={rowAction}>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-baseline justify-between gap-x-2 leading-4">
        <strong className="break-words font-semibold text-cave-50">{batch.name}</strong>
        <span className="text-xs text-cave-400">{batch.id}</span>
      </span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span className={`rounded border px-1 ${status.chip}`} title={status.hint}>
          <span className="text-cave-50">{status.label}</span>
        </span>
        {planned
          ? <span className="text-cave-200">{displayDate(batch.brewDate)} · {quantity.format(batch.volumeL)} L</span>
          : <>
            <span className="text-cave-400">{days === undefined ? 'Date à préciser' : days < 0 ? 'Date future à vérifier' : `J+${days}`}</span>
            <span className="font-mono text-2xs text-cave-200">
              {reading.latest === undefined ? 'SG non relevée' : `SG ${gravity.format(reading.latest)}`}
            </span>
          </>}
      </span>
    </span>
    <ChevronRight size={14} className="shrink-0 text-area-production" aria-hidden="true" />
  </button>;
}

/** Existing administrative reminders; checking one records the user's follow-up only. */
function administrativeReminders(config: AppConfig) {
  return [
    {
      id: 'ofdf', title: 'Impôt fédéral sur la bière — Taxas',
      description: 'Selon le régime OFDF confirmé : déclaration dans les 20 jours et paiement dans les 30 jours après la fin du trimestre ou de l’année. La réserve de l’app ne remplace pas les relevés de sorties.',
      deadline: 'Régime OFDF à confirmer'
    },
    {
      id: 'tva', title: 'Décompte TVA Trimestriel AFC',
      description: config.fiscal.isTvaRegistered ? 'Bière alcoolisée : taux normal de 8,1 %. Décompte selon la méthode et la périodicité confirmées auprès de l’AFC.' : 'Brasserie non assujettie : aucune TVA facturée ni récupérée. Surveiller l’évolution de la situation.',
      deadline: config.fiscal.isTvaRegistered ? 'Selon le régime AFC' : 'Non assujettie'
    },
    {
      id: 'saav', title: 'Autocontrôle & Hygiène SAAV Fribourg',
      description: 'Plan HACCP de sécurité alimentaire, traçabilité des lots et hygiène de la salle de brassage',
      deadline: 'Permanent'
    },
    {
      id: 'patente_b', title: 'Patente Cantonale B (Police du Commerce)',
      description: 'Si une patente de commerce au détail s’applique : 2 % du chiffre d’affaires concerné de l’année précédente, minimum 100 CHF. Vérifier la décision cantonale.',
      deadline: 'Selon la décision cantonale'
    },
    {
      id: 'metas', title: 'Contrôle Métrologique des Instruments (METAS)',
      description: 'Étalonnage des balances et manomètres officiels utilisés pour le pesage et le conditionnement',
      deadline: 'Contrôle bisannuel'
    },
    {
      id: 'fiscale', title: 'Clôture Comptable & Déclaration Fiscale Fribourg',
      description: 'Bilan et compte d’exploitation de l’activité indépendante pour les impôts cantonaux',
      deadline: '31 mars'
    }
  ];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  transactions, batches, stocks, config, globalTimeFilter, onNavigateTab, onOpenBatch,
  onNavigateToCreativeLab, onOpenCreateBatch, onOpenQuickAction
}) => {
  const creativeItems = useStorageValue(StorageService.getCreativeItems);
  const financeProfile = useStorageValue(FinanceService.getProfile);
  const financePayments = useStorageValue(FinanceService.getPayments);
  const [showAllBatches, setShowAllBatches] = useState(false);
  const [completedDeadlines, setCompletedDeadlines] = useState<Record<string, boolean>>(
    () => StorageService.getUiState('dashboard_completed_deadlines', {})
  );
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const activeBatches = useMemo(() => batches.filter(batch =>
    isCurrent(batch) && (batch.status === 'fermentation' || batch.status === 'garde')
  ), [batches]);
  const plannedBatches = useMemo(() => batches.filter(batch =>
    isCurrent(batch) && batch.status === 'planifie'
  ).sort((a, b) => dateOrder(a.brewDate) - dateOrder(b.brewDate)), [batches]);
  const itemsToOrder = useMemo(() => [...stocks.rawMaterials, ...stocks.cleaning]
    .filter(item => item.currentStock <= item.minStock)
    .sort((a, b) => Number(b.currentStock <= 0) - Number(a.currentStock <= 0))
    .map(item => ({ ...item, missing: Math.max(0, item.minStock - item.currentStock) })), [stocks]);
  const ruptures = itemsToOrder.filter(item => item.currentStock <= 0).length;
  const events = useMemo(() => creativeItems.filter(item => item.type === 'event')
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') ||
      dateOrder(a.date) - dateOrder(b.date)), [creativeItems]);
  const pendingEvents = events.filter(item => item.status !== 'done');

  const periodTxs = useMemo(() => transactions.filter(tx =>
    DateUtils.isDateInPeriod(tx.date, globalTimeFilter)), [transactions, globalTimeFilter]);
  const ledger = useMemo(() => summarizeLedger(transactions, financePayments, financeProfile),
    [transactions, financePayments, financeProfile]);
  const periodLedger = useMemo(() => summarizeLedger(periodTxs, financePayments, financeProfile),
    [periodTxs, financePayments, financeProfile]);
  const periodNet = periodLedger.incomeCents - periodLedger.expenseCents;
  const periodLabel = DateUtils.getPeriodLabel(globalTimeFilter);
  const reminders = administrativeReminders(config);
  const remainingReminders = reminders.filter(item => !completedDeadlines[item.id]).length;

  async function copyShoppingList() {
    clearTimeout(copyTimer.current);
    setCopyState('copying');
    const text = [
      "LISTE DE RÉAPPROVISIONNEMENT — L'AFFINÉE",
      `Date : ${new Date().toLocaleDateString('fr-CH')}`,
      'Quantités pour retrouver le seuil de stock.',
      ...itemsToOrder.map(item =>
        `- ${item.name} : ${item.missing > 0 ? `manque ${quantity.format(item.missing)} ${item.unit}` : 'seuil atteint, quantité à définir'}${item.supplier ? ` (${item.supplier})` : ''}`
      )
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      copyTimer.current = setTimeout(() => setCopyState('idle'), 2500);
    } catch {
      setCopyState('error');
    }
  }

  function toggleEvent(item: CreativeItem) {
    StorageService.updateCreativeItem({ ...item, status: item.status === 'done' ? 'todo' : 'done' });
  }

  function toggleDeadline(id: string) {
    const updated = { ...completedDeadlines, [id]: !completedDeadlines[id] };
    setCompletedDeadlines(updated);
    StorageService.setUiState('dashboard_completed_deadlines', updated);
  }

  return <div className="space-y-2 pt-1 pb-[calc(var(--main-navigation-height,2.5rem)+0.5rem)] text-sm">
    <header className="flex min-h-9 flex-wrap items-center justify-between gap-1">
      <h2 className="text-[1.125rem] font-semibold text-cave-50">À la brasserie</h2>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onOpenQuickAction} aria-label="Saisie rapide" title="Saisie rapide"
          className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-control border border-cave-700 text-cave-200 hover:bg-cave-850">
          <ReceiptText size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={onOpenCreateBatch}
          className="inline-flex min-h-8 items-center gap-1 rounded-control bg-ebc-straw px-2 text-2xs font-semibold text-cave-950 hover:bg-ebc-gold">
          <Plus size={16} aria-hidden="true" />Brassin
        </button>
      </div>
    </header>

    <div className="grid gap-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="dashboard-production" className="order-1 min-w-0 rounded-panel border border-area-production/30 bg-cave-900">
          <div className="flex min-h-8 flex-wrap items-center gap-x-2 rounded-t-panel bg-area-production/10 px-2">
            <Beer size={16} className="shrink-0 text-area-production" aria-hidden="true" />
            <h3 id="dashboard-production" className="flex-1 font-semibold text-area-production">Brassins</h3>
            <span className="text-xs text-cave-200">{activeBatches.length} en cuve</span>
            <button type="button" onClick={() => onNavigateTab('production')} className={`${smallAction} text-area-production`}>Tous<ChevronRight size={12} aria-hidden="true" /></button>
          </div>
          <div className="divide-y divide-cave-800">
            {(showAllBatches ? activeBatches : activeBatches.slice(0, 4)).map(batch =>
              <BatchRow key={batch.id} batch={batch} onOpen={onOpenBatch} />)}
          </div>
          {!activeBatches.length && <p className="px-2 py-2 text-cave-400">Aucun brassin en cuve.</p>}
          {activeBatches.length > 4 && <button type="button" onClick={() => setShowAllBatches(value => !value)}
            aria-expanded={showAllBatches} className={`${smallAction} text-area-production`}>
            {showAllBatches ? 'Réduire la liste' : `Voir les ${activeBatches.length - 4} autres en cuve`}
            <ChevronDown size={14} className={showAllBatches ? 'rotate-180' : ''} aria-hidden="true" />
          </button>}
          {plannedBatches.length > 0 && <details className="group/planned border-t border-cave-800">
            <summary className={`${summaryAction} text-2xs`}>
              <Calendar size={14} className="shrink-0 text-area-production" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-area-production">À brasser · {plannedBatches.length}</span>
                <span className="ml-2 text-cave-200">{plannedBatches[0].name}</span>
                <span className="block text-xs text-cave-400">Prochain : {displayDate(plannedBatches[0].brewDate)}</span>
              </span>
              <ChevronDown size={14} className="shrink-0 text-area-production group-open/planned:rotate-180" aria-hidden="true" />
            </summary>
            <div className="divide-y divide-cave-800">{plannedBatches.map(batch =>
              <BatchRow key={batch.id} batch={batch} onOpen={onOpenBatch} />)}</div>
          </details>}
        </section>


        <section aria-labelledby="dashboard-stocks" className="order-2 min-w-0 rounded-panel border border-area-stocks/30 bg-cave-900">
          <div className="flex min-h-8 flex-wrap items-center gap-x-2 rounded-t-panel bg-area-stocks/10 px-2">
            <Boxes size={16} className="shrink-0 text-area-stocks" aria-hidden="true" />
            <h3 id="dashboard-stocks" className="flex-1 font-semibold text-area-stocks">Stocks</h3>
            <button type="button" onClick={() => onNavigateTab('stocks')} className={`${smallAction} text-area-stocks`}>Voir<ChevronRight size={12} aria-hidden="true" /></button>
          </div>
          {itemsToOrder.length === 0
            ? <p className="flex items-center gap-2 px-2 py-2 text-2xs text-cave-200"><Check size={14} className="text-area-stocks" aria-hidden="true" />Stocks suffisants</p>
            : <>
              <div className="flex flex-wrap items-center gap-x-2 px-2 py-1 text-xs">
                <span className="text-attention">{compte(itemsToOrder.length, 'article')} au seuil ou en dessous</span>
                {ruptures > 0 && <span className="inline-flex items-center gap-1 font-semibold text-alert-strong"><AlertTriangle size={12} aria-hidden="true" />{compte(ruptures, 'rupture')}</span>}
              </div>
              <div className="divide-y divide-cave-800">
                {itemsToOrder.slice(0, 3).map(item => <button type="button" key={item.id || item.ref}
                  onClick={() => onNavigateTab('stocks')} className={rowAction}>
                  <span className="min-w-0 flex-1">
                    <strong className="block break-words font-semibold leading-4 text-cave-50">{item.name}</strong>
                    <span className="flex flex-wrap items-center gap-x-1 text-xs text-cave-400">
                      <StockThreshold item={item} />
                      <span>Stock {quantity.format(item.currentStock)} / seuil {quantity.format(item.minStock)} {item.unit}</span>
                    </span>
                  </span>
                  <span className={`shrink-0 text-right text-xs ${item.currentStock <= 0 ? 'text-alert-strong' : 'text-attention'}`}>
                    <span className="block">{item.currentStock <= 0 ? 'Rupture' : item.missing > 0 ? 'À compléter' : 'Seuil atteint'}</span>
                    {item.missing > 0 && <span className="font-mono text-2xs">+{quantity.format(item.missing)} {item.unit}</span>}
                  </span>
                </button>)}
              </div>
              {itemsToOrder.length > 3 && <button type="button" onClick={() => onNavigateTab('stocks')}
                className={`${smallAction} text-area-stocks`}>Voir les {itemsToOrder.length - 3} autres articles<ChevronRight size={14} aria-hidden="true" /></button>}
              <div className="border-t border-cave-800 px-1 py-0.5">
                <button type="button" onClick={copyShoppingList} disabled={copyState === 'copying'}
                  className={`${smallAction} text-area-stocks disabled:opacity-50`}>
                  {copyState === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {copyState === 'copying' ? 'Copie…' : copyState === 'copied' ? 'Liste copiée' : copyState === 'error' ? 'Réessayer la copie' : 'Copier la liste'}
                </button>
                {copyState === 'copied' && <span role="status" className="sr-only">Liste copiée dans le presse-papiers.</span>}
                {copyState === 'error' && <p role="alert" className="px-1 pb-1 text-xs text-alert-strong">Copie impossible. Autorisez le presse-papiers puis réessayez.</p>}
              </div>
            </>}
        </section>

        <section aria-label="Finances" className="order-3 min-w-0 rounded-panel border border-area-finances/30 bg-cave-900">
          <details className="group/finance">
            <summary className={`${summaryAction} rounded-panel bg-area-finances/10`}>
              <Wallet size={16} className="shrink-0 self-start mt-0.5 text-area-finances" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-semibold text-area-finances">Finances</span>
                  <span className="text-xs text-cave-200">{periodLabel}</span>
                </span>
                <span className="mt-0.5 flex flex-wrap justify-between gap-x-2 text-2xs">
                  <span className="text-cave-200">Charges</span>
                  <span className="font-mono text-cave-50">{formatCHF(periodLedger.expenseCents)}</span>
                </span>
              </span>
              <ChevronDown size={14} className="shrink-0 text-area-finances group-open/finance:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-2 pb-1">
              <dl className="divide-y divide-cave-800 text-2xs">
                {[
                  ['Recettes de la période', formatCHF(periodLedger.incomeCents)],
                  ['Résultat de la période', formatCHF(periodNet)],
                  ['Trésorerie suivie', ledger.cashCents == null ? 'À initialiser' : formatCHF(ledger.cashCents)],
                  ['Apports privés depuis le début', formatCHF(ledger.contributionCents)]
                ].map(([label, value]) => <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-2 py-1">
                  <dt className="text-cave-200">{label}</dt>
                  <dd className={`max-w-full break-words text-right font-mono ${label === 'Résultat de la période' && periodNet < 0 ? 'text-alert-strong' : 'text-cave-50'}`}>{value}</dd>
                </div>)}
              </dl>
              {!ledger.cashComplete && <p className="py-1 text-xs text-attention">Solde initial et paiements à compléter.</p>}
              <button type="button" onClick={() => onNavigateTab('finances')} className={`${smallAction} text-area-finances`}>Ouvrir les finances<ChevronRight size={14} aria-hidden="true" /></button>
            </div>
          </details>
        </section>

        <section aria-labelledby="dashboard-agenda" className="order-4 min-w-0 rounded-panel border border-area-agenda/30 bg-cave-900">
          <div className="flex min-h-8 flex-wrap items-center gap-x-2 rounded-t-panel bg-area-agenda/10 px-2">
            <Calendar size={16} className="shrink-0 text-area-agenda" aria-hidden="true" />
            <h3 id="dashboard-agenda" className="flex-1 font-semibold text-area-agenda">Agenda</h3>
            <span className="text-xs text-cave-200">{pendingEvents.length} à faire</span>
            <button type="button" onClick={onNavigateToCreativeLab} className={`${smallAction} text-area-agenda`}>Gérer<ChevronRight size={12} aria-hidden="true" /></button>
          </div>
          {events.length === 0 && <p className="px-2 py-2 text-2xs text-cave-400">Aucune tâche prévue.</p>}
          <div className="divide-y divide-cave-800">
            {events.slice(0, 3).map(item => <label key={item.id} className="flex min-h-8 cursor-pointer items-center gap-2 px-2 py-1">
              <input type="checkbox" checked={item.status === 'done'} onChange={() => toggleEvent(item)}
                className="h-4 w-4 shrink-0 accent-area-agenda" />
              <span className="min-w-0 flex-1">
                <span className={`block break-words text-2xs ${item.status === 'done' ? 'text-cave-400 line-through' : 'text-cave-50'}`}>{item.title}</span>
                {item.date && <span className="block text-xs text-cave-400">{displayDate(item.date)}</span>}
              </span>
              {item.status === 'done' && <span className="text-xs text-cave-400">Fait</span>}
            </label>)}
          </div>
          {events.length > 3 && <button type="button" onClick={onNavigateToCreativeLab} className={`${smallAction} text-area-agenda`}>Voir tout l’agenda<ChevronRight size={14} aria-hidden="true" /></button>}
        </section>

        <section aria-label="Échéances et démarches" className="order-5 lg:col-start-2 min-w-0 rounded-panel border border-area-agenda/30 bg-cave-900">
          <details className="group/reminders">
            <summary className={`${summaryAction} rounded-panel bg-area-agenda/10`}>
              <ShieldCheck size={16} className="shrink-0 text-area-agenda" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-area-agenda">Échéances et démarches</span>
                <span className="block text-xs text-cave-200">{compte(remainingReminders, 'point')} à suivre · Fribourg / OFDF</span>
              </span>
              <ChevronDown size={14} className="shrink-0 text-area-agenda group-open/reminders:rotate-180" aria-hidden="true" />
            </summary>
            <div className="divide-y divide-cave-800 px-2">
              {reminders.map(item => <div key={item.id} className="py-1">
                <label className="flex min-h-6 cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={!!completedDeadlines[item.id]} onChange={() => toggleDeadline(item.id)}
                    className="h-4 w-4 shrink-0 accent-area-agenda" />
                  <span className={`min-w-0 text-2xs ${completedDeadlines[item.id] ? 'text-cave-400 line-through' : 'text-cave-50'}`}>{item.title}</span>
                </label>
                <details className="group/reminder ml-6">
                  <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-2 text-xs text-cave-200">
                    {item.deadline}<ChevronDown size={12} className="shrink-0 text-area-agenda group-open/reminder:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-1 text-sm text-cave-200">{item.description}</p>
                </details>
              </div>)}
            </div>
          </details>
        </section>
    </div>
  </div>;
};
