import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Beer, 
  Boxes, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Calendar,
  Lightbulb,
  Activity,
  Flame,
  Droplets,
  Package,
  Plus,
  ShoppingCart,
  Copy,
  Tag
} from 'lucide-react';
import { Transaction, Batch, StockItem, GanttTask, AppConfig, TimeFilterPeriod, CreativeItem } from '../../types';
import { StorageService } from '../../services/storage';
import { DateUtils } from '../../services/dateUtils';
import { BrewingMath } from '../../services/brewingMath';

interface DashboardTabProps {
  transactions: Transaction[];
  batches: Batch[];
  stocks: { rawMaterials: StockItem[]; cleaning: StockItem[] };
  planning: GanttTask[];
  config: AppConfig;
  globalTimeFilter: TimeFilterPeriod;
  onNavigateTab: (tab: 'finances' | 'production' | 'stocks' | 'clients') => void;
  onNavigateToCreativeLab: () => void;
  onOpenCreateBatch: () => void;
  onOpenQuickAction: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  transactions,
  batches,
  stocks,
  planning,
  config,
  globalTimeFilter,
  onNavigateTab,
  onNavigateToCreativeLab,
  onOpenCreateBatch,
  onOpenQuickAction
}) => {
  // Read creative tasks/events from storage
  const [creativeItems, setCreativeItems] = useState<CreativeItem[]>(() => StorageService.getCreativeItems());

  // Interactive checklist state for official Swiss deadlines
  const [completedDeadlines, setCompletedDeadlines] = useState<Record<string, boolean>>(() =>
    StorageService.getUiState('dashboard_completed_deadlines', { 'saav': true })
  );

  const toggleDeadline = (id: string) => {
    const updated = { ...completedDeadlines, [id]: !completedDeadlines[id] };
    setCompletedDeadlines(updated);
    StorageService.setUiState('dashboard_completed_deadlines', updated);
  };

  // 1. Filter transactions according to GLOBAL TIME FILTER (Memoized)
  const periodTxs = useMemo(() => {
    return transactions.filter((tx) => DateUtils.isDateInPeriod(tx.date, globalTimeFilter));
  }, [transactions, globalTimeFilter]);

  const { periodRevenue, periodExpenses, periodNet, totalApports, cashAvailable } = useMemo(() => {
    let rev = 0;
    let exp = 0;

    periodTxs.forEach((tx) => {
      if (tx.category === 'recettes') {
        rev += tx.amountHT;
      } else if (tx.category !== 'apports') {
        exp += (tx.amountTTC || tx.amountHT);
      }
    });

    const apports = transactions
      .filter((t) => t.category === 'apports')
      .reduce((sum, t) => sum + t.amountHT, 0);

    const chargesAll = transactions
      .filter((t) => t.category !== 'apports' && t.category !== 'recettes')
      .reduce((sum, t) => sum + (t.amountTTC || t.amountHT), 0);

    const recettesAll = transactions
      .filter((t) => t.category === 'recettes')
      .reduce((sum, t) => sum + (t.amountTTC || t.amountHT), 0);

    const available = apports + recettesAll - chargesAll;

    return {
      periodRevenue: rev,
      periodExpenses: exp,
      periodNet: rev - exp,
      totalApports: apports,
      cashAvailable: available
    };
  }, [periodTxs, transactions]);

  // Stocks alerts & Shopping List Items
  const [quickCopied, setQuickCopied] = useState(false);
  const criticalItems = useMemo(() => [
    ...stocks.rawMaterials.filter((s) => s.currentStock <= s.minStock),
    ...stocks.cleaning.filter((s) => s.currentStock <= s.minStock)
  ], [stocks]);

  const itemsToOrder = useMemo(() => {
    return [
      ...stocks.rawMaterials.filter((s) => s.currentStock <= s.minStock).map((s) => {
        const sName = s.name.toLowerCase();
        const neededFor = batches
          .filter((b) => b.status === 'planifie' || b.status === 'fermentation')
          .filter((b) => 
            b.malts?.some((m) => m.name.toLowerCase().includes(sName) || sName.includes(m.name.toLowerCase())) ||
            b.hops?.some((h) => h.name.toLowerCase().includes(sName) || sName.includes(h.name.toLowerCase())) ||
            (s.category === 'Levure' && b.yeastName && (b.yeastName.toLowerCase().includes(sName) || sName.includes(b.yeastName.toLowerCase()))) ||
            b.adjuncts?.some((a) => a.name.toLowerCase().includes(sName) || sName.includes(a.name.toLowerCase()))
          )
          .map((b) => b.id);

        return {
          name: s.name,
          missing: Math.max(0.1, Math.round((s.minStock - s.currentStock) * 10) / 10),
          unit: s.unit,
          supplier: s.supplier || 'Brau-Rauchshop',
          neededFor
        };
      }),
      ...stocks.cleaning.filter((s) => s.currentStock <= s.minStock).map((s) => ({
        name: s.name,
        missing: Math.max(1, s.minStock - s.currentStock),
        unit: s.unit,
        supplier: s.supplier || 'Brau-Rauchshop',
        neededFor: [] as string[]
      }))
    ];
  }, [stocks, batches]);

  const handleCopyQuickShopping = () => {
    const lines = [
      `🛒 LISTE DE COURSES EXPRESS — BRASSERIE L'AFFINÉE`,
      `Date : ${new Date().toLocaleDateString('fr-CH')}`,
      `------------------------------------------`,
      itemsToOrder.map((i) => `- ${i.name} : MANQUE ${i.missing} ${i.unit} (${i.supplier})${i.neededFor.length > 0 ? ` ➔ 🏷️ Pour ${i.neededFor.join(', ')}` : ''}`).join('\n'),
      `------------------------------------------`
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 2500);
  };

  // Active & In-Progress Batches
  const activeBatches = useMemo(() => batches.filter((b) => 
    b.status === 'fermentation' || b.status === 'garde'
  ), [batches]);

  // Planned Future Batches
  const plannedBatches = useMemo(() => batches.filter((b) => b.status === 'planifie'), [batches]);

  // Filter batches for this period & tax
  const periodBatches = batches.filter((b) => DateUtils.isDateInPeriod(b.brewDate, globalTimeFilter));
  const beerTaxResult = BrewingMath.calculateSwissBeerTax(periodBatches);

  // Todo items / Events from Creative Lab
  const todoEvents = creativeItems.filter((i) => i.type === 'event');

  const handleToggleTodo = (item: CreativeItem) => {
    const nextStatus = item.status === 'done' ? 'todo' : 'done';
    const updated = { ...item, status: nextStatus as any };
    StorageService.updateCreativeItem(updated);
    setCreativeItems([...StorageService.getCreativeItems()]);
  };

  const periodLabel = DateUtils.getPeriodLabel(globalTimeFilter);

  // Calculate days elapsed in fermentation for a batch
  const getFermentationDays = (brewDateStr?: string) => {
    if (!brewDateStr) return 0;
    const d = DateUtils.parseDate(brewDateStr);
    if (!d) return 0;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Swiss Legal & Administrative Deadlines List
  const swissDeadlines = [
    {
      id: 'ofdf',
      title: 'Impôt Fédéral sur la Bière (OFDF 45.60)',
      description: 'Déclaration mensuelle obligatoire avant le 15 du mois (17.64 CHF/hl pour micro-brasserie)',
      deadline: '15 du mois',
      category: 'Fédéral 🇨🇭'
    },
    {
      id: 'tva',
      title: 'Décompte TVA Trimestriel AFC',
      description: 'TVA 2.6% (bière) & 8.1% (matériel/services). Échéances : 31 mai (T1), 31 août (T2), 30 nov (T3), 28 fév (T4)',
      deadline: 'Fin de trimestre',
      category: 'Fédéral 🇨🇭'
    },
    {
      id: 'saav',
      title: 'Autocontrôle & Hygiène SAAV Fribourg',
      description: 'Plan HACCP de sécurité alimentaire, traçabilité des lots et hygiène de la salle de brassage',
      deadline: 'Permanent',
      category: 'Fribourg 🛡️'
    },
    {
      id: 'patente_b',
      title: 'Patente Cantonale B (Police du Commerce)',
      description: 'Taxe fribourgeoise de 2% sur le chiffre d’affaires des ventes de boissons alcoolisées',
      deadline: 'Annuel (30 avril)',
      category: 'Fribourg 📜'
    },
    {
      id: 'metas',
      title: 'Contrôle Métrologique des Instruments (METAS)',
      description: 'Étalonnage des balances et manomètres officiels utilisés pour le pesage et le conditionnement',
      deadline: 'Contrôle bisannuel',
      category: 'Fédéral 🇨🇭'
    },
    {
      id: 'fiscale',
      title: 'Clôture Comptable & Déclaration Fiscale Fribourg',
      description: 'Bilan et compte d’exploitation de l’activité indépendante pour les impôts cantonaux',
      deadline: '31 mars',
      category: 'Fribourg 📑'
    }
  ];

  return (
    <div className="space-y-4 pb-28 pt-2 text-sm">
      {/* 1. Global Period Active Banner */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-4 h-4 text-ebc-straw" />
          <span className="font-bold text-cave-200">{periodLabel}</span>
        </div>
        <span className="text-sm font-mono text-cave-400">
          {periodTxs.length} opération(s)
        </span>
      </div>

      {/* 2. Top Metric Cards (Charges vs Trésorerie) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Period Cashflow Card */}
        <div 
          onClick={() => onNavigateTab('finances')}
          className="p-4 rounded-3xl bg-cave-900 border border-cave-800 hover:border-ebc-straw/50 transition cursor-pointer shadow-sm relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-cave-400 font-medium">Charges Période</span>
            <div className="w-7 h-7 rounded-xl bg-cave-850 flex items-center justify-center text-cave-400 group-hover:text-ebc-straw transition">
              <TrendingDown className="w-4 h-4 text-alert" />
            </div>
          </div>
          <div className="text-xl xs:text-2xl font-black font-mono text-cave-50">
            {periodExpenses.toFixed(2)} <span className="text-sm font-normal text-cave-400">CHF</span>
          </div>
          <div className="text-footnote text-cave-500 mt-1 flex items-center justify-between">
            <span>Recettes : {periodRevenue.toFixed(2)} CHF</span>
            <span className={periodNet >= 0 ? 'text-hop font-bold' : 'text-alert font-bold'}>
              {periodNet >= 0 ? `+${periodNet.toFixed(2)}` : periodNet.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Total Available Treasury Card */}
        <div 
          onClick={() => onNavigateTab('finances')}
          className="p-4 rounded-3xl bg-cave-900 border border-cave-800 hover:border-hop/50 transition cursor-pointer shadow-sm relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-cave-400 font-medium">Solde Disponible</span>
            <div className="w-7 h-7 rounded-xl bg-cave-850 flex items-center justify-center text-cave-400 group-hover:text-hop transition">
              <TrendingUp className="w-4 h-4 text-hop" />
            </div>
          </div>
          <div className="text-xl xs:text-2xl font-black font-mono text-hop">
            {cashAvailable.toFixed(2)} <span className="text-sm font-normal text-cave-400">CHF</span>
          </div>
          <div className="text-footnote text-cave-500 mt-1">
            Apports Gaëtan : {totalApports.toFixed(2)} CHF
          </div>
        </div>
      </div>

      {/* 3. CENTRE DES OPÉRATIONS EN COURS & TEMPS DE FERMENTATION (DEMANDE MAJEURE GAËTAN) */}
      <div className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-hop" />
            <h3 className="font-bold text-sm text-cave-50">Opérations en Cours à la Brasserie</h3>
          </div>
          <button
            onClick={onOpenCreateBatch}
            className="px-3 py-1 bg-ebc-straw hover:bg-ebc-gold text-cave-950 font-black text-sm rounded-xl shadow transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Brassin</span>
          </button>
        </div>

        {activeBatches.length === 0 ? (
          <div className="p-4 rounded-2xl bg-cave-950/60 border border-cave-800 text-center text-cave-400">
            Aucun brassin actif actuellement. Lancez-en un avec le bouton ci-dessus !
          </div>
        ) : (
          <div className="space-y-3">
            {activeBatches.map((b) => {
              const days = getFermentationDays(b.brewDate);
              const progressPct = Math.min(100, Math.round((days / 21) * 100));

              // Fermentation Stage Description
              let stageLabel = 'Fermentation tumultueuse';
              let stageColor = 'text-ebc-straw';
              if (days > 14) {
                stageLabel = 'Garde froide / Cold crash (Prêt)';
                stageColor = 'text-water';
              } else if (days >= 7) {
                stageLabel = 'Fermentation secondaire & affinage';
                stageColor = 'text-hop';
              }

              return (
                <div
                  key={b.id}
                  onClick={() => onNavigateTab('production')}
                  className="p-3.5 rounded-2xl bg-cave-950/80 border border-cave-800 hover:border-ebc-straw/50 transition cursor-pointer space-y-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono font-bold text-ebc-straw text-sm">{b.id}</span>
                        <h4 className="font-bold text-sm text-cave-50">{b.name}</h4>
                      </div>
                      <span className="text-sm text-cave-400">
                        {b.style} · {b.volumeL}L · Brassé le {b.brewDate}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="px-2 py-0.5 rounded-lg bg-hop/20 text-hop font-black text-sm border border-hop/30">
                        J+{days} de fermentation
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar (21-Day Cycle) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-footnote text-cave-400">
                      <span className={`font-bold ${stageColor}`}>{stageLabel}</span>
                      <span className="font-mono">{days} / 21 jours</span>
                    </div>
                    <div className="w-full bg-cave-900 rounded-full h-2 overflow-hidden p-0.5 border border-cave-800">
                      <div
                        className="bg-gradient-to-r from-ebc-straw to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, progressPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-sm bg-cave-900/60 p-2 rounded-xl border border-cave-800/80">
                    <div>
                      <span className="text-footnote text-cave-500 block font-sans">OG Initiale</span>
                      <strong className="text-cave-200">{b.og || '1.060'}</strong>
                    </div>
                    <div>
                      <span className="text-footnote text-cave-500 block font-sans">FG Actuelle</span>
                      <strong className="text-ebc-straw">{b.fg || '1.018'}</strong>
                    </div>
                    <div>
                      <span className="text-footnote text-cave-500 block font-sans">Alcool</span>
                      <strong className="text-hop">{b.abv || '~5.8%'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Prochains Brassins Planifiés */}
        {plannedBatches.length > 0 && (
          <div className="pt-2.5 border-t border-cave-800/80 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-cave-200 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-ebc-straw" />
                <span>Brassins Planifiés ({plannedBatches.length})</span>
              </span>
              <button
                onClick={() => onNavigateTab('production')}
                className="text-footnote text-ebc-straw hover:underline font-bold"
              >
                Gérer dans Production →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plannedBatches.map((pb) => (
                <div
                  key={pb.id}
                  onClick={() => onNavigateTab('production')}
                  className="p-2.5 rounded-xl bg-cave-950/70 border border-cave-800/80 hover:border-cave-700 transition cursor-pointer flex items-center justify-between text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-ebc-gold" />
                    <div>
                      <div className="font-bold text-cave-200">{pb.name}</div>
                      <span className="text-footnote text-cave-400">{pb.style} · {pb.volumeL}L</span>
                    </div>
                  </div>
                  <span className="text-footnote font-mono text-cave-500">Prévu {pb.brewDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. WIDGET LISTE DE COURSES SIMPLIFIÉE (DEMANDE GAËTAN) */}
      <div className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-ebc-straw" />
            <h3 className="font-bold text-sm text-cave-50">Liste de Courses & Réapprovisionnement</h3>
          </div>
          <button
            onClick={() => onNavigateTab('stocks')}
            className="text-sm text-ebc-straw hover:underline font-bold flex items-center space-x-1"
          >
            <span>Ouvrir Hub Full →</span>
          </button>
        </div>

        {itemsToOrder.length === 0 ? (
          <div className="p-3 bg-cave-950/60 rounded-2xl border border-cave-800 text-sm text-cave-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-hop" />
              <span>Tous les ingrédients et produits sont en stock suffisant !</span>
            </div>
            <span className="text-footnote text-cave-500">0 rupture</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-alert font-bold">
                ⚠️ {itemsToOrder.length} article(s) sous le seuil mini à commander :
              </span>
              <button
                onClick={handleCopyQuickShopping}
                className="px-2.5 py-1 bg-cave-850 hover:bg-cave-800 text-ebc-gold font-bold text-footnote rounded-xl border border-cave-700 flex items-center space-x-1 transition"
              >
                <Copy className="w-3 h-3" />
                <span>{quickCopied ? 'Copié ! ✅' : 'Copier express'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
              {itemsToOrder.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab('stocks')}
                  className="p-2 rounded-xl bg-cave-950/70 border border-cave-800/80 hover:border-cave-700 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <span className="font-bold text-cave-200 block truncate">{item.name}</span>
                    <div className="flex items-center space-x-1.5 text-footnote">
                      <span className="text-cave-500">{item.supplier}</span>
                      {item.neededFor.length > 0 && (
                        <span className="text-ebc-straw font-bold flex items-center">
                          <Tag className="w-2.5 h-2.5 mr-0.5" />
                          <span>Pour {item.neededFor[0]}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-alert font-black shrink-0 text-sm">
                    -{item.missing} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            {itemsToOrder.length > 4 && (
              <p 
                onClick={() => onNavigateTab('stocks')} 
                className="text-footnote text-cave-400 text-center hover:text-ebc-straw cursor-pointer pt-1"
              >
                + {itemsToOrder.length - 4} autre(s) article(s) dans l'onglet Stocks →
              </p>
            )}
          </div>
        )}
      </div>

      {/* 5. TO-DO & ÉVÉNEMENTS BRASSERIE */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-cave-900 to-cave-950 border border-ebc-straw/30 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-ebc-straw" />
            <h3 className="font-bold text-sm text-cave-50">To-Do & Agenda Brasserie</h3>
          </div>
          <button
            onClick={onNavigateToCreativeLab}
            className="text-sm text-ebc-straw hover:text-ebc-gold font-bold flex items-center space-x-0.5"
          >
            <span>Atelier R&D</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {todoEvents.length === 0 ? (
            <p className="text-sm text-cave-500 italic py-2 text-center">
              Aucune tâche en attente. Ajoutez-en dans l'Atelier R&D !
            </p>
          ) : (
            todoEvents.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-cave-950/70 border border-cave-800/80 flex items-center justify-between transition hover:border-cave-700"
              >
                <div className="flex items-center space-x-2.5">
                  {/*
                    ⚠️ Bouton sans texte : sans `aria-label`, le lecteur d'écran
                    annonçait « bouton » sans dire lequel ni son état. C'est une
                    case à cocher, donc `aria-pressed` porte l'état.
                  */}
                  <button
                    onClick={() => handleToggleTodo(item)}
                    aria-pressed={item.status === 'done'}
                    aria-label={`${item.title} — ${item.status === 'done' ? 'fait' : 'à faire'}`}
                    className="text-cave-400 hover:text-hop transition shrink-0"
                  >
                    {item.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-hop" />
                    ) : (
                      <Circle className="w-5 h-5 text-cave-500" />
                    )}
                  </button>
                  <div>
                    <h4 className={`font-bold text-sm ${item.status === 'done' ? 'line-through text-cave-500' : 'text-cave-200'}`}>
                      {item.title}
                    </h4>
                    {item.date && (
                      <span className="text-footnote text-cave-400 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1 text-ebc-straw" /> {item.date}
                      </span>
                    )}
                  </div>
                </div>

                <span className={`text-footnote font-bold px-2 py-0.5 rounded-lg border ${
                  item.status === 'done'
                    ? 'bg-hop/10 text-hop border-hop/20'
                    : 'bg-ebc-straw/10 text-ebc-gold border-ebc-straw/20'
                }`}>
                  {item.status === 'done' ? 'Terminé' : 'À faire'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. ÉCHÉANCES LÉGALES & ADMINISTRATIVES SUISSES & FRIBOURGEOISES (ENRICHI) */}
      <div className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-ebc-straw" />
            <h3 className="font-bold text-sm text-cave-50">Échéances & Conformité Fribourg / OFDF</h3>
          </div>
          <span className="text-footnote bg-cave-850 text-cave-200 px-2 py-0.5 rounded-full font-bold">
            {Object.values(completedDeadlines).filter(Boolean).length} / {swissDeadlines.length} acquises
          </span>
        </div>

        <div className="space-y-2">
          {swissDeadlines.map((dl) => {
            const isDone = completedDeadlines[dl.id] ?? false;

            return (
              <div
                key={dl.id}
                className="p-3 rounded-2xl bg-cave-950/70 border border-cave-800/80 flex items-start justify-between space-x-2 transition hover:border-cave-700"
              >
                {/*
                  ⚠️ `min-w-0` : la pastille de droite est `shrink-0`, et sans
                  ceci le bloc de gauche refusait lui aussi de rétrécir
                  (`min-width: auto` sur un élément de flex). Sur un écran de
                  320 px, la ligne réclamait 303 px pour 254 disponibles et
                  débordait de la carte.
                */}
                <div className="flex items-start space-x-2.5 min-w-0">
                  <button
                    onClick={() => toggleDeadline(dl.id)}
                    aria-pressed={isDone}
                    aria-label={`${dl.title} — ${isDone ? 'fait' : 'à faire'}`}
                    className="text-cave-400 hover:text-hop mt-0.5 transition shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-hop" />
                    ) : (
                      <Circle className="w-5 h-5 text-cave-500" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-bold text-sm ${isDone ? 'line-through text-cave-500' : 'text-cave-200'}`}>
                        {dl.title}
                      </span>
                      <span className="text-footnote text-cave-500 font-mono">({dl.category})</span>
                    </div>
                    <p className="text-sm text-cave-400 mt-0.5 leading-relaxed">
                      {dl.description}
                    </p>
                  </div>
                </div>

                <span className={`text-footnote font-bold px-2 py-0.5 rounded-xl shrink-0 border ${
                  isDone 
                    ? 'bg-hop/10 text-hop border-hop/20' 
                    : 'bg-ebc-straw/20 text-ebc-gold border-ebc-straw/30'
                }`}>
                  {dl.deadline}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
