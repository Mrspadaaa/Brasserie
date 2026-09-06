import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Copy, 
  Check, 
  FolderTree, 
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Camera,
  UploadCloud
} from 'lucide-react';
import { Transaction, FinanceCategory, BudgetLine, AppConfig, TimeFilterPeriod } from '../../types';
import { StorageService } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { DriveService } from '../../services/driveService';
import { ReceiptService } from '../../services/receiptService';
import { EditTransactionModal } from '../EditTransactionModal';
import { ConfirmModal } from '../ConfirmModal';
import { ExpenseDonutChart } from '../charts/ExpenseDonutChart';
import { CashflowBarChart } from '../charts/CashflowBarChart';
import { DateUtils } from '../../services/dateUtils';

interface FinancesTabProps {
  transactions: Transaction[];
  budgetLines: BudgetLine[];
  config: AppConfig;
  globalTimeFilter: TimeFilterPeriod;
  onOpenQuickAction: () => void;
}

export const FinancesTab: React.FC<FinancesTabProps> = ({
  transactions,
  budgetLines,
  config,
  globalTimeFilter,
  onOpenQuickAction
}) => {
  // Persistent Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(() => 
    StorageService.getUiState('finances_category', 'all')
  );
  const [searchTerm, setSearchTerm] = useState<string>(() => 
    StorageService.getUiState('finances_search', '')
  );
  const [viewMode, setViewMode] = useState<'by_month' | 'by_vendor' | 'flat'>(() =>
    StorageService.getUiState('finances_view_mode', 'by_month')
  );
  const [showCharts, setShowCharts] = useState<boolean>(() => 
    StorageService.getUiState('finances_show_charts', true)
  );

  // Pagination for flat view (15 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 15;

  // Collapsible monthly sections (persisted)
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>(() =>
    StorageService.getUiState('finances_open_months', { '2026-04': true, '2026-01': true })
  );

  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [revertingTxId, setRevertingTxId] = useState<string | null>(null);
  const [activeProofModal, setActiveProofModal] = useState<string | null>(null);
  const [copiedDriveId, setCopiedDriveId] = useState<string | null>(null);

  useEffect(() => {
    StorageService.setUiState('finances_category', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    StorageService.setUiState('finances_search', searchTerm);
    setCurrentPage(1); // Reset page on search
  }, [searchTerm]);

  useEffect(() => {
    StorageService.setUiState('finances_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    StorageService.setUiState('finances_show_charts', showCharts);
  }, [showCharts]);

  useEffect(() => {
    StorageService.setUiState('finances_open_months', openMonths);
  }, [openMonths]);

  const toggleMonth = (monthKey: string) => {
    setOpenMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  // Helper to parse date "DD.MM.YYYY"
  const parseDate = (dStr?: string) => {
    if (!dStr) return null;
    const parts = dStr.split('.');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  };

  // 1. Filter by Global Time Period
  const timeFilteredTxs = useMemo(() => {
    return transactions.filter((tx) => DateUtils.isDateInPeriod(tx.date, globalTimeFilter));
  }, [transactions, globalTimeFilter]);

  // 2. Filter by Category & Search
  const filteredTxs = useMemo(() => {
    return timeFilteredTxs.filter((tx) => {
      const matchesCat = selectedCategory === 'all' || tx.category === selectedCategory;
      const matchesSearch = 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.subcategory && tx.subcategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.proofNotes && tx.proofNotes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [timeFilteredTxs, selectedCategory, searchTerm]);

  // Totals (Strict TTC Accounting & Memoized)
  const { totalApports, totalRecettes, totalCharges, totalChargesTTC, cashDispo } = useMemo(() => {
    let apports = 0;
    let recettes = 0;
    let chargesHT = 0;
    let chargesTTC = 0;

    filteredTxs.forEach((t) => {
      if (t.category === 'apports') {
        apports += t.amountHT;
      } else if (t.category === 'recettes') {
        recettes += t.amountHT;
      } else {
        chargesHT += t.amountHT;
        chargesTTC += (t.amountTTC || t.amountHT);
      }
    });

    const dispo = apports + recettes - chargesTTC;

    return {
      totalApports: apports,
      totalRecettes: recettes,
      totalCharges: chargesHT,
      totalChargesTTC: chargesTTC,
      cashDispo: dispo
    };
  }, [filteredTxs]);

  // 3. Grouping by Month
  const monthlyGroups = useMemo(() => {
    const groups: Record<string, { label: string; count: number; totalTTC: number; txs: Transaction[] }> = {};

    filteredTxs.forEach((tx) => {
      const d = parseDate(tx.date);
      let key = 'Inconnu';
      let label = 'Date inconnue';
      if (d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        key = `${y}-${m}`;
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        label = `${monthNames[d.getMonth()]} ${y}`;
      }

      if (!groups[key]) {
        groups[key] = { label, count: 0, totalTTC: 0, txs: [] };
      }
      groups[key].count += 1;
      groups[key].totalTTC += (tx.amountTTC || tx.amountHT);
      groups[key].txs.push(tx);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTxs]);

  // 4. Grouping by Vendor
  const vendorGroups = useMemo(() => {
    const groups: Record<string, { count: number; totalTTC: number; txs: Transaction[] }> = {};

    filteredTxs.forEach((tx) => {
      const vendor = tx.proofNotes?.replace('Fournisseur: ', '').trim() || tx.description || 'Divers';
      if (!groups[vendor]) groups[vendor] = { count: 0, totalTTC: 0, txs: [] };
      groups[vendor].count += 1;
      groups[vendor].totalTTC += (tx.amountTTC || tx.amountHT);
      groups[vendor].txs.push(tx);
    });

    return Object.entries(groups).sort((a, b) => b[1].totalTTC - a[1].totalTTC);
  }, [filteredTxs]);

  // 5. Pagination for Flat View
  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / ITEMS_PER_PAGE));
  const paginatedTxs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTxs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTxs, currentPage]);

  const handleConfirmDelete = () => {
    if (deletingTxId) {
      StorageService.deleteTransaction(deletingTxId);
      setDeletingTxId(null);
    }
  };

  const handleConfirmRevert = () => {
    if (revertingTxId) {
      StorageService.revertTransaction(revertingTxId);
      setRevertingTxId(null);
    }
  };

  const handleCopyDrivePath = (tx: Transaction) => {
    const p = DriveService.generateDrivePath(tx);
    navigator.clipboard.writeText(p);
    setCopiedDriveId(tx.id);
    setTimeout(() => setCopiedDriveId(null), 2000);
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* 1. Global Period Active Banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-cave-900 rounded-2xl border border-cave-800 shadow-sm">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-ebc-straw" />
          <span className="text-sm font-bold text-cave-200">
            {DateUtils.getPeriodLabel(globalTimeFilter)}
          </span>
        </div>
        <span className="text-sm font-mono text-cave-400 font-bold">
          {filteredTxs.length} opération(s)
        </span>
      </div>

      {/* 2. Top Controls Bar: Charts toggle & View mode */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition ${
              showCharts 
                ? 'bg-ebc-straw text-cave-950 border-ebc-gold shadow-md' 
                : 'bg-cave-900 text-cave-400 border-cave-800'
            }`}
          >
            {showCharts ? '📊 Masquer Graphiques' : '📊 Afficher Graphiques'}
          </button>
        </div>

        {/* View Mode Selector (Mois / Fournisseur / Liste) */}
        <div className="flex bg-cave-900 p-1 rounded-xl border border-cave-800 text-sm font-bold">
          <button
            onClick={() => setViewMode('by_month')}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewMode === 'by_month' ? 'bg-ebc-straw text-cave-950' : 'text-cave-400'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setViewMode('by_vendor')}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewMode === 'by_vendor' ? 'bg-ebc-straw text-cave-950' : 'text-cave-400'
            }`}
          >
            Tiers
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewMode === 'flat' ? 'bg-ebc-straw text-cave-950' : 'text-cave-400'
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {/* 3. VISUAL CHARTS (RECHARTS) */}
      {showCharts && (
        <div className="space-y-3">
          <ExpenseDonutChart
            transactions={timeFilteredTxs}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          <CashflowBarChart
            apports={totalApports}
            charges={totalChargesTTC}
            disponible={cashDispo}
          />
        </div>
      )}

      {/* 4. Search & Category Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-cave-400 absolute left-3.5 top-3" />
          <input
            type="text"
            name="finances_search_query"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            placeholder="Rechercher par libellé, fournisseur, montant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cave-900 border border-cave-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-cave-50 placeholder-cave-600 focus:outline-none focus:border-ebc-straw"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'all', label: 'Tous flux', icon: '📋' },
            { key: 'brassage', label: 'Brassage', icon: '🌾' },
            { key: 'materiel', label: 'Matériel', icon: '⚙️' },
            { key: 'nettoyage', label: 'CIP & Hygiène', icon: '🧼' },
            { key: 'chargesFixes', label: 'Charges Fixes', icon: '🏢' },
            { key: 'renovation', label: 'Local & Rénov', icon: '🔨' },
            { key: 'divers', label: 'Divers', icon: '📦' },
            { key: 'apports', label: 'Apports', icon: '💎' },
            { key: 'recettes', label: 'Ventes', icon: '💰' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold shrink-0 flex items-center space-x-1 border transition ${
                selectedCategory === cat.key
                  ? 'bg-ebc-straw text-cave-950 border-ebc-gold font-bold shadow-md scale-102'
                  : 'bg-cave-900 text-cave-400 border-cave-800 hover:text-cave-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Active Filter Summary */}
      <div className="p-3 bg-cave-900 rounded-2xl border border-cave-800 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-cave-200">{filteredTxs.length} écriture(s)</span>
          <span className="text-cave-500">·</span>
          <span className="text-cave-400">
            Total : <strong className="text-ebc-straw font-mono">{totalChargesTTC.toFixed(2)} CHF TTC</strong>
          </span>
        </div>
        <button
          onClick={onOpenQuickAction}
          className="px-3 py-1.5 bg-ebc-straw hover:bg-ebc-gold text-cave-950 font-black text-sm rounded-xl shadow transition"
        >
          + Saisie
        </button>
      </div>

      {/* 6. CONTENT VIEWS (ORGANISÉES POUR DES DIZAINES DE MILLIERS DE DONNÉES) */}

      {/* VIEW 1: GROUPED BY MONTH (ACCORDÉONS MENSUELS REPLIABLES) */}
      {viewMode === 'by_month' && (
        <div className="space-y-3">
          {monthlyGroups.map(([monthKey, group]) => {
            const isOpen = openMonths[monthKey] ?? true;
            return (
              <div key={monthKey} className="rounded-3xl bg-cave-900 border border-cave-800 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full p-4 flex items-center justify-between bg-cave-900 hover:bg-cave-850/60 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-2xl bg-ebc-straw/10 border border-ebc-straw/20 text-ebc-straw flex items-center justify-center font-bold text-sm">
                      📅
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-cave-50">{group.label}</h4>
                      <span className="text-sm text-cave-400 font-mono">
                        {group.count} opération(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-black text-ebc-straw text-sm">
                      {group.totalTTC.toLocaleString('fr-CH', { minimumFractionDigits: 2 })} CHF
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-cave-400" /> : <ChevronDown className="w-4 h-4 text-cave-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-3 pt-0 space-y-2 border-t border-cave-800/80">
                    {group.txs.map((tx) => renderTransactionRow(tx, expandedTxId, setExpandedTxId, setEditingTx, setDeletingTxId, setRevertingTxId, handleCopyDrivePath, copiedDriveId, setActiveProofModal))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: GROUPED BY VENDOR (VUE PAR FOURNISSEUR & TIERS) */}
      {viewMode === 'by_vendor' && (
        <div className="space-y-3">
          {vendorGroups.map(([vendorName, group]) => (
            <div key={vendorName} className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-2.5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-cave-50">{vendorName}</h4>
                  <span className="text-sm text-cave-400 font-mono">{group.count} achat(s)</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-ebc-straw text-sm">
                    {group.totalTTC.toLocaleString('fr-CH', { minimumFractionDigits: 2 })} CHF
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-cave-800/80">
                {group.txs.map((tx) => renderTransactionRow(tx, expandedTxId, setExpandedTxId, setEditingTx, setDeletingTxId, setRevertingTxId, handleCopyDrivePath, copiedDriveId, setActiveProofModal))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: FLAT PAGINATED VIEW (PAGES DE 15 LIGNES SANS AUCUN LAG) */}
      {viewMode === 'flat' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {paginatedTxs.map((tx) => renderTransactionRow(tx, expandedTxId, setExpandedTxId, setEditingTx, setDeletingTxId, setRevertingTxId, handleCopyDrivePath, copiedDriveId, setActiveProofModal))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-3 bg-cave-900 rounded-2xl border border-cave-800 text-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-cave-850 disabled:opacity-30 rounded-xl font-bold transition flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Précédent
            </button>
            <span className="font-mono font-bold text-cave-200">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-cave-850 disabled:opacity-30 rounded-xl font-bold transition flex items-center space-x-1"
            >
              Suivant <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditTransactionModal
        isOpen={Boolean(editingTx)}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onSave={() => setEditingTx(null)}
      />

      <ConfirmModal
        isOpen={Boolean(revertingTxId)}
        title="Annuler cette saisie et restaurer les stocks ?"
        message="Cette action va supprimer l'écriture comptable ET soustraire automatiquement les quantités ajoutées pour remettre le stock exactement à son état antérieur."
        confirmLabel="Annuler & Restaurer les stocks"
        isDanger={true}
        onConfirm={handleConfirmRevert}
        onCancel={() => setRevertingTxId(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deletingTxId)}
        title="Supprimer cette écriture ?"
        message="Cette action retirera la transaction du journal comptable sans toucher aux stocks."
        confirmLabel="Supprimer"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTxId(null)}
      />

      {activeProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cave-950/80 backdrop-blur-sm animate-in fade-in">
          {/*
            ⚠️ `role` / `aria-modal` / `aria-labelledby` manquaient, et le bouton
            de fermeture n'était qu'un caractère « ✕ » sans nom : au lecteur
            d'écran, l'ouverture ne s'annonçait pas et la sortie ne se trouvait
            pas.
          */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="justificatif-titre"
            className="bg-cave-900 border border-cave-800 rounded-2xl p-4 max-w-lg w-full space-y-3"
          >
            <div className="flex justify-between items-center">
              <h4 id="justificatif-titre" className="text-sm font-bold text-cave-200">
                Justificatif comptable
              </h4>
              <button
                onClick={() => setActiveProofModal(null)}
                aria-label="Fermer le justificatif"
                className="p-3 text-cave-400 hover:text-cave-50"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-cave-800 bg-cave-950 flex items-center justify-center p-2">
              {activeProofModal.startsWith('data:application/pdf') ? (
                <iframe 
                  src={activeProofModal} 
                  title="Justificatif PDF" 
                  className="w-full h-[65vh] rounded-lg border-0 bg-white" 
                />
              ) : (
                <img 
                  src={activeProofModal} 
                  alt="Justificatif" 
                  className="max-h-[65vh] object-contain rounded-lg" 
                />
              )}
            </div>
            <div className="flex justify-end">
              <a
                href={activeProofModal}
                download={activeProofModal.startsWith('data:application/pdf') ? 'justificatif_comptable.pdf' : 'justificatif_comptable.jpg'}
                className="px-4 py-2 bg-ebc-straw hover:bg-ebc-gold text-cave-950 font-bold text-sm rounded-xl transition flex items-center shadow-lg"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Render an individual transaction row with full interactive actions
function renderTransactionRow(
  tx: Transaction,
  expandedTxId: string | null,
  setExpandedTxId: (id: string | null) => void,
  setEditingTx: (tx: Transaction) => void,
  setDeletingTxId: (id: string) => void,
  setRevertingTxId: (id: string) => void,
  handleCopyDrivePath: (tx: Transaction) => void,
  copiedDriveId: string | null,
  setActiveProofModal: (url: string) => void
) {
  const isExpanded = expandedTxId === tx.id;
  const isRevenue = tx.category === 'recettes' || tx.category === 'apports';
  const drivePath = DriveService.generateDrivePath(tx);
  const hasStockImpact = tx.stockImpact && tx.stockImpact.length > 0;

  return (
    <div 
      key={tx.id}
      className="rounded-2xl bg-cave-950/70 border border-cave-800 hover:border-cave-700 transition overflow-hidden shadow-sm"
    >
      <div 
        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
        className="p-3.5 flex items-center justify-between cursor-pointer active:bg-cave-850/50"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
            isRevenue
              ? 'bg-hop/10 text-hop border border-hop/20'
              : 'bg-cave-850 text-cave-200 border border-cave-700'
          }`}>
            {tx.category === 'apports' && '💎'}
            {tx.category === 'recettes' && '💰'}
            {tx.category === 'brassage' && '🌾'}
            {tx.category === 'materiel' && '⚙️'}
            {tx.category === 'nettoyage' && '🧼'}
            {tx.category === 'chargesFixes' && '🏢'}
            {tx.category === 'renovation' && '🔨'}
            {tx.category === 'divers' && '📦'}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-cave-50">{tx.description}</span>
            </div>
            <div className="text-sm text-cave-400 flex items-center space-x-1.5 mt-0.5 font-mono">
              <span>{tx.date}</span>
              <span>·</span>
              <span className="text-ebc-straw/90 font-sans">{tx.subcategory}</span>
              {hasStockImpact && (
                <span className="text-footnote bg-hop/20 text-hop px-1 py-0.5 rounded font-sans font-bold">
                  Stock
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="text-right">
            <div className={`text-sm xs:text-sm font-black font-mono ${
              isRevenue ? 'text-hop' : 'text-cave-50'
            }`}>
              {isRevenue ? '+' : '-'}
              {tx.amountTTC ? tx.amountTTC.toFixed(2) : tx.amountHT.toFixed(2)} <span className="text-footnote font-normal">CHF</span>
            </div>
            <div className="text-footnote text-cave-400 font-mono">
              HT: {tx.amountHT.toFixed(2)}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-cave-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cave-500" />
          )}
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-cave-800/80 bg-cave-950/70 space-y-2.5 text-sm animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-2 text-sm text-cave-400">
            <div>
              <span>TVA : </span>
              <strong className="text-cave-200">{(tx.tvaRate * 100).toFixed(1)}% ({tx.tvaAmount.toFixed(2)} CHF)</strong>
            </div>
            <div>
              <span>Fournisseur / Notes : </span>
              <strong className="text-cave-200">{tx.proofNotes || '—'}</strong>
            </div>
          </div>

          {/* Stock impact details if present */}
          {hasStockImpact && (
            <div className="p-2 rounded-xl bg-hop/10 border border-hop/20 text-sm space-y-1">
              <span className="font-bold text-hop flex items-center">
                📦 Impact sur le stock :
              </span>
              {tx.stockImpact!.map((imp, idx) => (
                <div key={idx} className="flex justify-between text-footnote text-emerald-200 font-mono">
                  <span>{imp.itemName} :</span>
                  <span>+{imp.addedQty} {imp.unit} (était: {imp.previousStock} ➔ actuel: {imp.newStock})</span>
                </div>
              ))}
            </div>
          )}

          {/* Google Drive Path Box */}
          <div className="p-2 rounded-xl bg-water/10 border border-water/20 flex items-center justify-between text-sm">
            <div className="truncate max-w-[240px] text-water font-mono text-footnote">
              📁 {drivePath}
            </div>
            <button
              onClick={() => handleCopyDrivePath(tx)}
              className="px-2 py-0.5 bg-water/20 hover:bg-water/30 text-water rounded text-footnote font-semibold transition flex items-center shrink-0 ml-2"
            >
              {copiedDriveId === tx.id ? <Check className="w-3 h-3 mr-0.5" /> : <Copy className="w-3 h-3 mr-0.5" />}
              {copiedDriveId === tx.id ? 'Copié' : 'Copier'}
            </button>
          </div>

          {/* Actions: Revert, Edit, View Proof, Delete */}
          <div className="flex items-center justify-between pt-1 border-t border-cave-800/60">
            {hasStockImpact ? (
              <button
                onClick={() => setRevertingTxId(tx.id)}
                className="px-2.5 py-1 bg-ebc-straw/10 hover:bg-ebc-straw/20 text-ebc-gold border border-ebc-straw/30 rounded-lg text-sm font-bold flex items-center transition"
                title="Annuler l'écriture et remettre les stocks à leur niveau antérieur"
              >
                <RotateCcw className="w-3 h-3 mr-1 text-ebc-straw" /> Annuler & Restaurer
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-1.5">
              {/* If sale (recettes): Download Official Quittance PDF (Point Clé de Gaëtan) */}
              {isRevenue && (
                <button
                  onClick={() => {
                    const cfg = StorageService.getConfig();
                    ReceiptService.downloadReceipt(
                      {
                        clientName: tx.proofNotes?.replace(/Client:\s*/, '').split('·')[0].trim() || 'Client Comptoir',
                        beerName: tx.description.replace('Vente bière ', '').replace('Vente ', '').split('—')[0].trim() || 'Bière artisanale',
                        amountTTC: tx.amountTTC || tx.amountHT,
                        tvaRate: tx.tvaRate || 0.026,
                        paymentMethod: tx.proofNotes?.includes('TWINT') ? 'TWINT' : (tx.proofNotes?.includes('Espèces') ? 'Espèces' : 'Virement'),
                        date: tx.date,
                        receiptNumber: `QUITTANCE-${tx.id.replace(/[^0-9]/g, '').slice(-6)}`
                      },
                      cfg
                    );
                  }}
                  className="px-2.5 py-1 bg-hop/10 hover:bg-hop/20 text-hop border border-hop/30 rounded-lg text-sm font-bold flex items-center transition"
                  title="Télécharger la quittance / justificatif de vente officiel suisse"
                >
                  <FileText className="w-3 h-3 mr-1 text-hop" /> Quittance PDF
                </button>
              )}

              {tx.proofUrl ? (
                <button
                  onClick={() => setActiveProofModal(tx.proofUrl!)}
                  className="px-2.5 py-1 bg-cave-850 hover:bg-cave-800 text-cave-200 rounded-lg text-sm font-medium flex items-center transition"
                  title="Voir la pièce justificative attachée"
                >
                  <FileText className="w-3 h-3 mr-1 text-ebc-straw" /> Reçu
                </button>
              ) : (
                <label 
                  className="px-2.5 py-1 bg-cave-850 hover:bg-cave-800 text-cave-400 hover:text-cave-200 rounded-lg text-sm font-medium flex items-center cursor-pointer transition" 
                  title="Joindre une photo ou scan de justificatif"
                >
                  <Camera className="w-3 h-3 mr-1 text-ebc-straw" /> + Preuve
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          const updated: Transaction = {
                            ...tx,
                            proofUrl: dataUrl,
                            proofFileName: f.name,
                            proofType: f.type || 'image/jpeg'
                          };
                          StorageService.updateTransaction(updated);
                        };
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
              )}
              <button
                onClick={() => setEditingTx(tx)}
                className="px-3 py-1 bg-ebc-straw/20 hover:bg-ebc-straw/30 text-ebc-gold border border-ebc-straw/40 rounded-lg text-sm font-bold flex items-center transition"
              >
                <Edit3 className="w-3 h-3 mr-1" /> Modifier
              </button>
              <button
                onClick={() => setDeletingTxId(tx.id)}
                className="px-2.5 py-1 bg-alert/10 hover:bg-alert/20 text-alert border border-alert/30 rounded-lg text-sm font-medium flex items-center transition"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
