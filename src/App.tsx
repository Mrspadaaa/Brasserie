import React, { useState, useEffect } from 'react';
import { StorageService, defaultConfig } from './services/storage';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { QuickActionModal } from './components/QuickActionModal';
import { SettingsModal } from './components/SettingsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { CloudConfigModal } from './components/CloudConfigModal';
import { RecipePage } from './pages/RecipePage';
import { BrewWizard, WizardSeed } from './pages/BrewWizard';
import { BrewDayPage } from './pages/BrewDayPage';
import { useFullScreenRoute } from './pages/useFullScreenRoute';
import { CommandPalette, CommandGroup } from './ui/CommandPalette';
import { fabActionFor, FabIntent, AnySubTab } from './domain/fabActions';
import { captureSnapshot } from './domain/recipeSnapshot';
import { nextUniqueRef, nextBatchId } from './services/refs';
import { Suggestions } from './services/suggestions';
import { Units } from './services/units';
import { Beaker, FlaskConical, Package, Users, Receipt } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { DashboardTab } from './components/tabs/DashboardTab';
import { FinancesTab } from './components/tabs/FinancesTab';
import { ProductionTab } from './components/tabs/ProductionTab';
import { StocksTab } from './components/tabs/StocksTab';
import { ClientsTab } from './components/tabs/ClientsTab';
import { 
  AppConfig, 
  TimeFilterPeriod, 
  Transaction, 
  StockItem,
  EquipmentItem,
  KegItem,
  Batch, 
  Recipe, 
  WaterSource,

  Client, 
  GanttTask, 
  BudgetLine, 
  PricingItem, 
  AuditLog, 
  CreativeItem 
} from './types';
import { FirebaseAuthService } from './services/firebaseAuth';
import { runMigrationIfNeeded } from './services/migration';
import { User } from 'firebase/auth';

/**
 * Compte factice pour le DÉVELOPPEMENT LOCAL, et rien d'autre.
 *
 * ⚠️ Sans lui, `npm run dev` ne montre que la page de connexion Google : on ne
 * peut vérifier aucun écran sans ouvrir une vraie session, ce qui rend le
 * contrôle local impossible.
 *
 * ⚠️ DEUX VERROUS, et il faut les deux :
 *
 *   1. `import.meta.env.DEV` — Vite remplace cette constante par `false` au
 *      build. Le `if (false)` qui en résulte est éliminé par le bundler : ni le
 *      code, ni la chaîne « dev-local » ne survivent dans `dist/`. C'est
 *      vérifiable, et c'est vérifié par `scripts/check-no-dev-auth.mjs`.
 *   2. `?dev-local` dans l'URL — même en développement, le contournement
 *      n'existe que si on le demande explicitement. Ouvrir `localhost` sans ce
 *      paramètre montre la vraie page de connexion.
 *
 * ⚠️ CE COMPTE N'OUVRE AUCUNE DONNÉE. Les règles Firestore sont appliquées par
 * le SERVEUR : un utilisateur fabriqué côté navigateur n'a pas de jeton, donc
 * les lectures sont refusées et l'application s'ouvre VIDE. C'est voulu — le
 * contournement donne accès aux écrans, jamais aux données de la brasserie.
 */
function devLocalUser(): User | null {
  if (import.meta.env.DEV) {
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local')) {
      return {
        uid: 'dev-local',
        email: 'dev-local@localhost',
        displayName: 'Développement local'
      } as unknown as User;
    }
  }
  return null;
}

export const App: React.FC = () => {
  // Official Firebase Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  useEffect(() => {
    // Développement local : on court-circuite Google, sans toucher au reste.
    const local = devLocalUser();
    if (local) {
      setCurrentUser(local);
      setIsAuthLoading(false);
      return;
    }

    // Safety timer: Never leave user stuck on loading spinner for more than 1000ms
    const timer = setTimeout(() => {
      setIsAuthLoading(false);
    }, 1000);

    const unsubscribe = FirebaseAuthService.onUserChange((user) => {
      clearTimeout(timer);
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Persistent active tab
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    StorageService.getUiState('app_active_tab', 'dashboard')
  );

  // Persistent Global Time Filter (Single Source of Truth across the ENTIRE APP)
  const [globalTimeFilter, setGlobalTimeFilter] = useState<TimeFilterPeriod>(() =>
    StorageService.getUiState('app_global_time_filter', 'all')
  );

  // SubTab targeting for Production (e.g. from 💡 or 🧰 in Header)
  const [productionSubTab, setProductionSubTab] = useState<'batches' | 'recipes' | 'lab' | 'scaler'>('batches');

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [wizardSeed, setWizardSeed] = useState<WizardSeed | undefined>(undefined);
  /** Sous-onglet courant, remonté par l'onglet actif. */
  const [subTab, setSubTab] = useState<AnySubTab>(null);
  /**
   * Demande de création adressée à l'écran courant.
   *
   * L'horodatage rend chaque demande unique : sans lui, deux appuis successifs
   * sur le même bouton produiraient la même valeur et le second serait ignoré.
   */
  const [createRequest, setCreateRequest] = useState<{ kind: FabIntent; at: number } | null>(null);
  const route = useFullScreenRoute();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);

  // Reactive state from StorageService (STRICTLY ISOLATED: Empty by default until Google auth validates!)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<{ rawMaterials: StockItem[]; cleaning: StockItem[]; equipment: EquipmentItem[]; kegs: KegItem[] }>({
    rawMaterials: [],
    cleaning: [],
    equipment: [],
    kegs: []
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [planning, setPlanning] = useState<GanttTask[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [tarifs, setTarifs] = useState<PricingItem[]>([]);
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [creativeItems, setCreativeItems] = useState<CreativeItem[]>([]);

  // Démarre la synchronisation Firestore dès que le compte Google est validé,
  // puis rejoue une seule fois la migration depuis l'ancien localStorage.
  useEffect(() => {
    if (!currentUser) {
      StorageService.clearMemoryCache();
      setIsDataReady(false);
      return;
    }

    StorageService.startSync();

    let cancelled = false;
    runMigrationIfNeeded().then((report) => {
      if (cancelled) return;
      if (report.error) {
        setWriteError(report.error);
      } else if (report.ran) {
        const total = Object.values(report.counts).reduce((a, b) => a + b, 0);
        showToast(
          report.source === 'localStorage'
            ? `${total} enregistrements repris depuis ce navigateur et synchronisés.`
            : `Base initialisée avec ${total} enregistrements.`
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Recopie les données de la façade vers l'état React à chaque snapshot.
  useEffect(() => {
    if (currentUser) {
      setTransactions([...StorageService.getTransactions()]);
      setStocks({ ...StorageService.getStocks() });
      setBatches([...StorageService.getBatches()]);
      setRecipes([...StorageService.getRecipes()]);
      setClients([...StorageService.getClients()]);
      setPlanning([...StorageService.getPlanning()]);
      setBudgetLines([...StorageService.getBudgetLines()]);
      setTarifs([...StorageService.getTarifs()]);
      setConfig({ ...StorageService.getConfig() });
      setAuditLogs([...StorageService.getAuditLogs()]);
      setCreativeItems([...StorageService.getCreativeItems()]);
      setIsDataReady(StorageService.isReady());
    } else {
      setTransactions([]);
      setStocks({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] });
      setBatches([]);
      setRecipes([]);
      setClients([]);
      setPlanning([]);
      setBudgetLines([]);
      setTarifs([]);
      setAuditLogs([]);
      setCreativeItems([]);
    }
  }, [currentUser]);

  // Save active tab
  useEffect(() => {
    if (currentUser) {
      StorageService.setUiState('app_active_tab', activeTab);
    }
  }, [activeTab, currentUser]);

  // Save global time filter
  useEffect(() => {
    if (currentUser) {
      StorageService.setUiState('app_global_time_filter', globalTimeFilter);
    }
  }, [globalTimeFilter, currentUser]);

  // Subscribe to storage changes ONLY when authenticated
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = StorageService.subscribe(() => {
      setTransactions([...StorageService.getTransactions()]);
      setStocks({ ...StorageService.getStocks() });
      setBatches([...StorageService.getBatches()]);
      setRecipes([...StorageService.getRecipes()]);
      setClients([...StorageService.getClients()]);
      setPlanning([...StorageService.getPlanning()]);
      setBudgetLines([...StorageService.getBudgetLines()]);
      setTarifs([...StorageService.getTarifs()]);
      setConfig({ ...StorageService.getConfig() });
      setAuditLogs([...StorageService.getAuditLogs()]);
      setCreativeItems([...StorageService.getCreativeItems()]);
      setIsDataReady(StorageService.isReady());
    });
    return unsubscribe;
  }, [currentUser]);

  // Une sauvegarde qui échoue (quota du navigateur saturé) ne doit jamais
  // passer inaperçue dans une app de comptabilité : on la remonte à l'écran.
  useEffect(() => {
    if (!currentUser) return;
    const check = () => {
      const err = StorageService.consumeWriteError();
      if (err) setWriteError(err);
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Protection globale contre la barre d'autocomplétion / mot de passe Android Gboard (clé / carte / localisation)
  useEffect(() => {
    const applyAntiAutofill = (el: Element) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
        if (!el.getAttribute('autocorrect')) el.setAttribute('autocorrect', 'off');
        if (!el.getAttribute('spellcheck')) el.setAttribute('spellcheck', 'false');
        if (!el.getAttribute('data-form-type')) el.setAttribute('data-form-type', 'other');
        if (!el.getAttribute('data-lpignore')) el.setAttribute('data-lpignore', 'true');
        if (!el.getAttribute('data-1p-ignore')) el.setAttribute('data-1p-ignore', 'true');
        if (!el.getAttribute('data-bwignore')) el.setAttribute('data-bwignore', 'true');
      }
      if (el instanceof HTMLFormElement) {
        if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (e.target && e.target instanceof HTMLElement) {
        applyAntiAutofill(e.target);
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);

    // Initial scan and MutationObserver
    document.querySelectorAll('input, textarea, select, form').forEach(applyAntiAutofill);
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement) {
            applyAntiAutofill(node);
            node.querySelectorAll('input, textarea, select, form').forEach(applyAntiAutofill);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      observer.disconnect();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Critical stock count
  const criticalStockCount = [
    ...stocks.rawMaterials.filter((s) => s.currentStock <= s.minStock),
    ...stocks.cleaning.filter((s) => s.currentStock <= s.minStock)
  ].length;

  // Pending To-Do count from Creative Lab
  const pendingTodosCount = creativeItems.filter(
    (i) => i.type === 'event' && i.status !== 'done'
  ).length;

  const navigateToCreativeLab = () => {
    setProductionSubTab('lab');
    setActiveTab('production');
  };

  const navigateToBrewAssistant = () => {
    setProductionSubTab('batches');
    setActiveTab('production');
  };

  // --- Pages plein écran du brassage ---------------------------------------

  const openRecipe = (recipe: Recipe) => route.open({ view: 'recipe', recipeId: recipe.id });
  const openBrewDay = (batch: Batch) => route.open({ view: 'brewday', batchId: batch.id });

  const openWizard = (seed?: WizardSeed) => {
    setWizardSeed(seed);
    route.open({ view: 'wizard' });
  };

  /**
   * Ce que crée le bouton d'action, ici et maintenant.
   *
   * ⚠️ Il ouvrait toujours le même menu de saisie rapide, quel que soit
   * l'écran : sur l'onglet Fûts il proposait d'enregistrer une facture, sur
   * Tarifs de brasser. Le geste le plus visible de l'application ne créait
   * jamais ce qu'on avait sous les yeux.
   */
  const fabAction = fabActionFor(activeTab, subTab);

  const runFabAction = () => {
    switch (fabAction.intent) {
      case 'newBatch':
      case 'newRecipe':
        openWizard();
        break;
      case 'newIdea':
        setProductionSubTab('lab');
        setActiveTab('production');
        setCreateRequest({ kind: 'newIdea', at: Date.now() });
        break;
      case 'newStockItem':
      case 'newKeg':
      case 'newEquipment':
      case 'newClient':
      case 'newTarif':
      case 'copyShoppingList':
        // L'écran concerné sait quoi faire : on lui passe la demande, il ouvre
        // sa propre feuille de création. L'App n'a pas à connaître ses formulaires.
        setCreateRequest({ kind: fabAction.intent, at: Date.now() });
        break;
      case 'newTransaction':
      case 'quickAction':
      default:
        setIsQuickActionOpen(true);
    }
  };

  // Déstructuré pour que TypeScript sache restreindre l'union : la
  // restriction ne traverse pas un accès de propriété (`route.route.view`).
  const view = route.route;
  const routedRecipe =
    view.view === 'recipe' ? recipes.find((r) => r.id === view.recipeId) : undefined;
  const routedBatch =
    view.view === 'brewday' ? batches.find((b) => b.id === view.batchId) : undefined;

  const allStockItems = [...stocks.rawMaterials, ...stocks.cleaning];

  /**
   * Crée un article de stock à ZÉRO depuis l'assistant de recette.
   *
   * À zéro, parce qu'on ne l'a pas encore acheté : lui inventer une quantité
   * fausserait la liste de courses au moment précis où elle sert.
   */
  const createStockItem = (name: string, category: string, unit: string): StockItem => {
    const kind: 'rawMaterials' | 'cleaning' = 'rawMaterials';
    const item: StockItem = {
      id: name,
      ref: nextUniqueRef('MP', allStockItems.map((s) => s.ref)),
      name,
      category,
      unit,
      currentStock: 0,
      minStock: 0,
      reorder: false
    };
    StorageService.addStockItem(kind, item);
    return item;
  };

  /**
   * Retient une fiche technique retrouvée par l'IA, sur l'article de stock.
   *
   * ⚠️ « L'EBC d'un malt ne changera jamais. » Ces valeurs sont des constantes
   * du produit, pas des choix de recette : elles doivent survivre au brassin
   * qui les a fait chercher. Sans ça, chaque nouvelle recette repartait d'une
   * fiche vide et repayait le même appel pour le même chiffre.
   *
   * ⚠️ On n'écrase JAMAIS une valeur déjà présente. Ce que Gaëtan a saisi à la
   * main — ou lu sur le sac qu'il a réellement acheté — prime sur ce qu'un
   * modèle a trouvé en ligne : le lot dans sa cave peut différer de la fiche
   * générique du malteur, et lui seul le sait. On ne comble que les trous.
   */
  const learnIngredient = (name: string, facts: Partial<StockItem>) => {
    StorageService.learnIngredient(name, facts);
  };

  /** Enregistre la recette, et lance éventuellement le brassin dans la foulée. */
  const saveFromWizard = (recipe: Recipe, thenBrew: boolean) => {
    const exists = recipes.some((r) => r.id === recipe.id);
    if (exists) StorageService.updateRecipe(recipe);
    else StorageService.addRecipe(recipe);

    if (!thenBrew) {
      showToast(`Recette « ${recipe.name} » enregistrée.`);
      route.close();
      return;
    }

    // Le brassin FIGE la recette : la modifier plus tard ne réécrira pas ce
    // qui a réellement été mis dans la cuve.
    const batch: Batch = {
      id: nextBatchId(batches.map((b) => b.id)),
      name: recipe.name,
      style: recipe.style,
      volumeL: recipe.volumeL,
      brewDate: recipe.brewDate ?? new Date().toLocaleDateString('fr-CH'),
      status: 'planifie',
      recipeRef: recipe.id,
      recipeSnapshot: captureSnapshot(recipe),
      malts: recipe.malts,
      hops: recipe.hops,
      adjuncts: recipe.adjuncts,
      yeast: recipe.yeast
    };
    StorageService.addBatch(batch);
    showToast(`Brassin ${batch.id} planifié depuis « ${recipe.name} ».`);
    route.open({ view: 'brewday', batchId: batch.id });
  };

  /**
   * Enregistre l'analyse d'eau. Elle vit dans la configuration, pas dans la
   * recette : c'est l'eau de la brasserie, la même pour tous les brassins.
   */
  const saveWaterSource = (updated: WaterSource) => {
    const others = (config.waterSources ?? []).filter((w) => w.id !== updated.id);
    StorageService.saveConfig({
      ...config,
      waterSources: [...others, updated],
      activeWaterSourceId: updated.id
    });
    showToast(`Analyse « ${updated.name} » enregistrée.`);
  };

  /** Clôture du jour de brassage : sauvegarde des relevés, puis fermentation. */
  const finishBrewDay = (updated: Batch) => {
    StorageService.updateBatch(updated);
    showToast(`${updated.id} en fermentation. Relevés de brassage enregistrés.`);
    route.close();
  };

  // --- Recherche universelle ------------------------------------------------

  const commandGroups: CommandGroup[] = [
    {
      heading: 'Recettes',
      items: recipes.map((r) => ({
        id: `rec-${r.id}`,
        label: r.name,
        detail: [r.style, `${r.volumeL} L`].filter(Boolean).join(' · '),
        icon: <Beaker className="w-4 h-4" />,
        keywords: [r.style, r.id],
        onSelect: () => openRecipe(r)
      }))
    },
    {
      heading: 'Brassins',
      items: batches.map((b) => ({
        id: `bat-${b.id}`,
        label: `${b.id} — ${b.name}`,
        detail: [b.style, b.brewDate, b.status].filter(Boolean).join(' · '),
        icon: <FlaskConical className="w-4 h-4" />,
        keywords: [b.style, b.status],
        onSelect: () => openBrewDay(b)
      }))
    },
    {
      heading: 'Stock',
      items: allStockItems.map((s) => ({
        id: `stk-${s.ref}`,
        label: s.name,
        detail: `${Units.format(s.currentStock, s.unit)} · ${s.category}`,
        icon: <Package className="w-4 h-4" />,
        keywords: [s.ref, s.category, s.supplier ?? ''],
        onSelect: () => setActiveTab('stocks')
      }))
    },
    {
      heading: 'Clients',
      items: clients.map((c) => ({
        id: `cli-${c.id}`,
        label: c.name,
        detail: [c.type, c.contact].filter(Boolean).join(' · '),
        icon: <Users className="w-4 h-4" />,
        keywords: [c.email, c.phone],
        onSelect: () => setActiveTab('clients')
      }))
    },
    {
      heading: 'Écritures',
      items: transactions.slice(0, 200).map((t) => ({
        id: `tx-${t.id}`,
        label: t.description,
        detail: `${t.date} · ${t.amountTTC.toFixed(2)} CHF · ${t.subcategory}`,
        icon: <Receipt className="w-4 h-4" />,
        keywords: [t.category, t.subcategory],
        onSelect: () => setActiveTab('finances')
      }))
    }
  ].filter((g) => g.items.length > 0);

  const handleLogout = async () => {
    await FirebaseAuthService.logout();
    StorageService.clearMemoryCache();
    setCurrentUser(null);
    setTransactions([]);
    setStocks({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] });
    setBatches([]);
    setRecipes([]);
    setClients([]);
    setPlanning([]);
    setBudgetLines([]);
    setTarifs([]);
    setConfig(defaultConfig);
    setAuditLogs([]);
    setCreativeItems([]);
    showToast("Session Google déconnectée.");
  };

  // Loading official auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-cave-950 flex flex-col items-center justify-center text-cave-400 space-y-3 font-sans">
        <div className="w-10 h-10 border-2 border-ebc-straw/30 border-t-ebc-straw rounded-full animate-spin" />
        <span className="text-sm font-medium tracking-wide">Vérification de la session Google...</span>
      </div>
    );
  }

  // If not authenticated with allowed Google account, show standard LoginPage
  if (!currentUser) {
    return <LoginPage />;
  }

  // Première synchronisation Firestore. Le cache IndexedDB rend cet écran
  // quasi instantané dès la deuxième ouverture, y compris hors-ligne.
  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-cave-950 flex flex-col items-center justify-center text-cave-400 space-y-3 font-sans px-6">
        <div className="w-10 h-10 border-2 border-ebc-straw/30 border-t-ebc-straw rounded-full animate-spin" />
        <span className="text-sm font-medium tracking-wide text-center">
          Synchronisation des données de la brasserie...
        </span>
        {writeError && (
          <p className="text-sm text-alert text-center max-w-xs leading-relaxed">{writeError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cave-950 text-cave-50 flex flex-col font-sans">
      {/* Erreur de sauvegarde : bandeau persistant, fermé manuellement.
          Contrairement au toast, il ne disparaît pas tout seul : perdre une
          écriture comptable sans s'en apercevoir n'est pas acceptable. */}
      {writeError && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-alert text-white px-4 py-3 shadow-2xl flex items-start gap-3">
          <span className="text-lg leading-none shrink-0">⚠️</span>
          <div className="flex-1 text-sm leading-relaxed font-medium">{writeError}</div>
          <button
            onClick={() => setWriteError(null)}
            className="shrink-0 px-3 py-1 bg-rose-800/60 hover:bg-rose-800 rounded-lg text-sm font-bold min-h-[32px]"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ebc-straw text-cave-950 px-4 py-2.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 border border-ebc-gold max-w-sm text-center">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header with Global Time Filter, Direct Quick-Nav & To-Do Badge */}
      <Header
        config={config}
        globalTimeFilter={globalTimeFilter}
        onChangeGlobalTimeFilter={(p) => setGlobalTimeFilter(p)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCloudConfig={() => setIsCloudConfigOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onNavigateToBrewAssistant={navigateToBrewAssistant}
        onNavigateToCreativeLab={navigateToCreativeLab}
        onOpenSearch={() => setIsPaletteOpen(true)}
        onGoHome={() => setActiveTab('dashboard')}
        onLogout={handleLogout}
        pendingTodosCount={pendingTodosCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 xs:px-4">
        {activeTab === 'dashboard' && (
          <DashboardTab
            transactions={transactions}
            batches={batches}
            stocks={stocks}
            planning={planning}
            config={config}
            globalTimeFilter={globalTimeFilter}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onNavigateToCreativeLab={navigateToCreativeLab}
            onOpenCreateBatch={() => openWizard()}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
          />
        )}

        {activeTab === 'finances' && (
          <FinancesTab
            transactions={transactions}
            budgetLines={budgetLines}
            config={config}
            globalTimeFilter={globalTimeFilter}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
          />
        )}

        {activeTab === 'production' && (
          <ProductionTab
            batches={batches}
            recipes={recipes}
            brewhouses={config.brewhouses}
            activeBrewhouseId={config.activeBrewhouseId}
            globalTimeFilter={globalTimeFilter}
            targetSubTab={productionSubTab}
            onOpenCreateBatch={() => openWizard()}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
            onOpenRecipe={openRecipe}
            onOpenBrewDay={openBrewDay}
            onSubTabChange={(sub) => setSubTab(sub as never)}
            createRequest={createRequest}
            onDraftRecipe={(seed) => openWizard(seed)}
            onSuccessMessage={showToast}
          />
        )}

        {activeTab === 'stocks' && (
          <StocksTab
            stocks={stocks}
            batches={batches}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
            onSubTabChange={(sub) => setSubTab(sub as never)}
            createRequest={createRequest}
            onSuccessMessage={showToast}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            clients={clients}
            batches={batches}
            tarifs={tarifs}
            config={config}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
            onSubTabChange={(sub) => setSubTab(sub as never)}
            createRequest={createRequest}
            onSuccessMessage={showToast}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          // Le sous-onglet du nouvel écran se remontera tout seul ; on le vide
          // en attendant pour ne pas garder celui de l'onglet qu'on quitte.
          setSubTab(null);
          setActiveTab(tab);
        }}
        action={fabAction}
        onAction={runFabAction}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        criticalStockCount={criticalStockCount}
      />

      {/* Quick Action Modal (Scanner IA, Matching Stock interactif, Brassin, Vente) */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        recipes={recipes}
        geminiApiKey={config.geminiApiKey}
        onSuccessMessage={showToast}
        onOpenCreateBatch={() => openWizard()}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigUpdated={(newCfg) => setConfig(newCfg)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
      />

      {/* Audit Logbook Modal */}
      <AuditLogModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
        logs={auditLogs}
      />

      {/* Cloud & AI Config Modal (Google Drive & Gemini API) */}
      <CloudConfigModal
        isOpen={isCloudConfigOpen}
        onClose={() => setIsCloudConfigOpen(false)}
        onSaved={() => showToast('Configuration Cloud & IA mise à jour !')}
      />

      {/* Recherche universelle — ⌘K / Ctrl+K depuis n'importe où. */}
      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        groups={commandGroups}
      />

      {/* --- Pages plein écran ------------------------------------------
          Elles se ferment au geste retour du téléphone, contrairement aux
          modales qu'elles remplacent. */}

      {routedRecipe && (
        <RecipePage
          recipe={routedRecipe}
          batches={batches}
          config={config}
          onClose={route.close}
          onEdit={() => openWizard({ recipe: routedRecipe })}
          onDuplicate={() =>
            openWizard({
              recipe: {
                ...routedRecipe,
                id: `REC-${Date.now().toString(36).toUpperCase()}`,
                name: `${routedRecipe.name} (copie)`
              }
            })
          }
          onDelete={() => {
            StorageService.deleteRecipe(routedRecipe.id);
            showToast(`Recette « ${routedRecipe.name} » supprimée.`);
            route.close();
          }}
          onBrew={() => saveFromWizard(routedRecipe, true)}
          onOpenBatch={openBrewDay}
        />
      )}

      {routedBatch && (
        <BrewDayPage
          key={routedBatch.id}
          batch={routedBatch}
          config={config}
          stockItems={allStockItems}
          onClose={route.close}
          onSave={(b) => StorageService.updateBatch(b)}
          onFinish={finishBrewDay}
        />
      )}

      {view.view === 'wizard' && (
        <BrewWizard
          seed={wizardSeed}
          stockItems={allStockItems}
          config={config}
          knownStyles={Suggestions.knownStyles()}
          onClose={route.close}
          onCreateStockItem={createStockItem}
          onLearnIngredient={learnIngredient}
          onSaveWaterSource={saveWaterSource}
          onSave={saveFromWizard}
        />
      )}
    </div>
  );
};
