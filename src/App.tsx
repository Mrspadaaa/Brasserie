import React, { useState, useEffect, useMemo, useRef, useContext, lazy } from 'react';
import { StorageService, defaultConfig } from './services/storage';
import { Header } from './components/Header';
import { PersistenceStatus } from './ui/PersistenceStatus';
import { BrewerActivity } from './ui/BrewerActivity';
import { brewerAppScreen } from '../functions/src/brewerAppScreens';
import { BottomNav, TabType } from './components/BottomNav';
import { FloatingActions } from './ui/FloatingActions';
import { ModalOpenerContext } from './ui/ModalShell';

import type { WizardSeed } from './pages/BrewWizard';

import { useFullScreenRoute, type LayerRoute, type Route } from './pages/useFullScreenRoute';
import { useHopPileDevHook } from './ui/hopIndex/devHook';
import { CommandPalette, type CommandGroup } from './ui/CommandPalette';
import { useStorageValue } from './hooks/useLiveData';
import { FinancialArchiveService } from './services/financialArchiveService';
import { FinancialLedgerLoading } from './ui/FinancialLedgerLoading';
import { archiveIndex, isTransactionArchived } from './domain/finance/archive';
import { isoDate } from './domain/finance/ledger';
import { fabActionFor, FabIntent, AnySubTab } from './domain/fabActions';
import { batchDisplayDate } from './domain/batchSchedule';
import { recipeInstallationAdoptionIssue, recipeInstallationIssues } from './domain/recipeInstallation';
import { isCurrent } from './domain/catalogOrganization';
import { nextUniqueRef } from './services/refs';

import { Units } from './services/units';
import { saveRecipeConfirmed } from './services/recipeSave';
import { Beaker, FlaskConical, Package, Users, Receipt } from 'lucide-react';
import { LoginPage } from './components/LoginPage';

import type { CreativeLabSectionRequest } from './components/CreativeLabTab';
import type { QuickActionScreen } from './components/QuickActionModal';

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

import { DeferredSurface, LazySurface } from './ui/LazySurface';
import { Sheet } from './ui/Sheet';
import { ActionDock, PageShell } from './pages/PageShell';
import { loadRecipePage, preparedRecipePage } from './pages/recipePageLoader';
import { HopV55SemanticAdviceCapabilityContext, qualifyHopV55SemanticAdviceCapabilityV3 } from './ui/hopV55/assistedAdviceUiContracts';

const QuickActionModal = lazy(() => import('./components/QuickActionModal').then(module => ({ default: module.QuickActionModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(module => ({ default: module.SettingsModal })));
const AuditLogModal = lazy(() => import('./components/AuditLogModal').then(module => ({ default: module.AuditLogModal })));
const CloudConfigModal = lazy(() => import('./components/CloudConfigModal').then(module => ({ default: module.CloudConfigModal })));
const RecipePage = lazy(() => loadRecipePage().then(module => ({ default: module.RecipePage })));
const BrewDayPage = lazy(() => import('./pages/BrewDayPage').then(module => ({ default: module.BrewDayPage })));
const DashboardTab = lazy(() => import('./components/tabs/DashboardTab').then(module => ({ default: module.DashboardTab })));
const FinancesTab = lazy(() => import('./components/tabs/FinancesTab').then(module => ({ default: module.FinancesTab })));
const ProductionTab = lazy(() => import('./components/tabs/ProductionTab').then(module => ({ default: module.ProductionTab })));
const StocksTab = lazy(() => import('./components/tabs/StocksTab').then(module => ({ default: module.StocksTab })));
const ClientsTab = lazy(() => import('./components/tabs/ClientsTab').then(module => ({ default: module.ClientsTab })));
const BrewWizard = lazy(() => import('./pages/BrewWizardEntry'));
const HopV55Host = lazy(() => import('./ui/hopV55/Host').then(module => ({ default: module.HopV55Host })));
// Écran provisoire des outils houblons v4 (#162) : atteint seulement par le crochet de développement tant que le
// drapeau `hopV4` (src/ui/hopIndex/flags.ts) est éteint.
// Une couche préchargée (precharge.ts) se rend d'un coup : la fabrique rend alors un thenable synchrone, car React garde sinon
// 300 ms le repli de Suspense même quand le module est déjà là (mesuré : 311 ms à la première ouverture).
type CoucheOutils = typeof import('./ui/hopIndex/HopToolLayer');
let coucheOutils: CoucheOutils | undefined;
const HopToolLayer = lazy(() => coucheOutils
  ? ({ then: (ok: (m: CoucheOutils) => unknown) => ok(coucheOutils!) } as unknown as Promise<CoucheOutils>)
  : import('./ui/hopIndex/HopToolLayer').then(m => (coucheOutils = m)));

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
  // Relayed as provided by the entry point (default: unavailable). App installs no transport and never derives a
  // provider from the UID, a URL or a flag; a malformed declaration is relayed as unavailable with its reason.
  // The Host's classic lane and the recipe creator's Wizard lane each open only for a factory declared here.
  const providedSemanticAdviceCapability = useContext(HopV55SemanticAdviceCapabilityContext);
  const semanticAdviceCapability = useMemo(() => qualifyHopV55SemanticAdviceCapabilityV3(providedSemanticAdviceCapability),
    [providedSemanticAdviceCapability]);
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
    StorageService.getUiState('app_global_time_filter', 'this-month')
  );

  // SubTab targeting for Production (e.g. from 💡 or 🧰 in Header)
  const [productionSubTab, setProductionSubTab] = useState<'batches' | 'recipes' | 'lab' | 'scaler'>(() => StorageService.getUiState('production_subtab', 'batches'));

  /**
   * Écran de saisie rapide demandé, `null` quand la feuille est fermée.
   *
   * ⚠️ Le bouton d'action ouvre désormais chaque saisie à son écran — facture,
   * vente, brassin — plutôt qu'au sommaire. Un booléen ne pouvait pas dire
   * lequel, et le brasseur repassait par un menu pour la seule action qu'il
   * venait de choisir.
   */
  const [quickAction, setQuickActionState] = useState<QuickActionScreen | null>(null);
  const quickActionOpener = useRef<HTMLElement | null>(null);
  const actionLauncherRef = useRef<HTMLButtonElement | null>(null);
  // Capture avant que la surface ne masque le lanceur et ne retire son focus.
  const setQuickAction = React.useCallback((screen: QuickActionScreen | null, opener?: HTMLElement | null) => {
    if (screen) {
      const target = opener?.isConnected ? opener : document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!target?.closest('[role="dialog"], [role="alertdialog"]')) {
        quickActionOpener.current = target === document.body ? null : target;
      }
    }
    setQuickActionState(screen);
  }, []);
  const quickActionWasOpen = useRef(false);
  useEffect(() => {
    const wasOpen = quickActionWasOpen.current;
    quickActionWasOpen.current = quickAction !== null;
    if (!wasOpen || quickAction !== null) return;
    const opener = quickActionOpener.current;
    if (!opener?.isConnected) return;
    // Laisser les focus scopes et leur DOM de fermeture terminer avant le retour.
    const restore = () => {
      if (document.querySelector('[role="dialog"][aria-modal="true"], [role="alertdialog"]')) return;
      if (opener.closest('[inert], [aria-hidden="true"]')) return;
      if (document.activeElement === document.body && opener.isConnected) opener.focus({ preventScroll: true });
      observer.disconnect();
    };
    const observer = new MutationObserver(restore);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['inert', 'aria-hidden'] });
    const frame = requestAnimationFrame(restore);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [quickAction]);
  const [brewRecipeId, setBrewRecipeId] = useState<string>();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [financeOpenRequest, setFinanceOpenRequest] = useState<{ id: string; at: number } | null>(null);
  const [batchOpenRequest, setBatchOpenRequest] = useState<{ id: string; at: number } | null>(null);
  /** Renvoi depuis une écriture financière vers l'article qu'elle a acheté. */
  const [stockOpenRequest, setStockOpenRequest] = useState<{ ref: string; at: number } | null>(null);
  const [labSectionRequest, setLabSectionRequest] = useState<CreativeLabSectionRequest | null>(null);
  useEffect(() => {
    if (activeTab !== 'finances') setFinanceOpenRequest(null);
  }, [activeTab]);
  useEffect(() => {
    if (activeTab !== 'production') setBatchOpenRequest(null);
  }, [activeTab]);
  useEffect(() => {
    if (activeTab !== 'production' || productionSubTab !== 'lab') setLabSectionRequest(null);
  }, [activeTab, productionSubTab]);
  const [wizardSeed, setWizardSeed] = useState<WizardSeed | undefined>(undefined);
  /** Sous-onglet courant, remonté par l'onglet actif. */
  const [subTab, setSubTab] = useState<AnySubTab>(null);
  const handleProductionSubTabChange = React.useCallback((sub: string) => {
    setSubTab(sub as AnySubTab);
    setProductionSubTab(sub as 'batches' | 'recipes' | 'lab' | 'scaler');
  }, []);
  /**
   * Demande de création adressée à l'écran courant.
   *
   * L'horodatage rend chaque demande unique : sans lui, deux appuis successifs
   * sur le même bouton produiraient la même valeur et le second serait ignoré.
   */
  const [createRequest, setCreateRequest] = useState<{ kind: FabIntent; at: number } | null>(null);
  const route = useFullScreenRoute();
  /** Dernier rendu de la page de base, réemployé tel quel tant qu'une couche la couvre. */
  const frozenBase = useRef<{ route: Route; element: React.ReactNode } | null>(null);
  /*
   * La pile (#162, D65) : la PAGE de base (onglets, recette, brassin, wizard) et, au-dessus, les COUCHES
   * (atelier V5.5, outils houblons v4). La base reste montée sous les couches : le wizard garde son instance,
   * son étape et son brouillon, sans repasser par la lecture du brouillon ni par `DraftFreshnessChoice`.
   * Un crochet sans `pile` (faux crochet des tests) vaut une pile d'un seul étage : sa route est la base.
   */
  const routePile: Route[] = route.pile ?? [route.route];
  const baseRoute: Route = route.base ?? route.route;
  const layerRoutes: LayerRoute[] = route.layers ?? [];
  const baseIndex = routePile.length - 1 - layerRoutes.length;
  useHopPileDevHook({ open: route.open, close: route.close, closeTo: route.closeTo, pile: routePile });
  // Outils houblons v4 (#167) : préchargés au repos, en ligne, drapeau allumé seulement ; rien sur le chemin du démarrage.
  // Le drapeau est lu en clair : éteint, Vite retire tout le bloc (ni code ni requête) ; allumé, le programmateur est un petit
  // chunk à part, demandé après le montage, qui attend la fin du chargement et un instant de repos avant de rien charger.
  useEffect(() => {
    if (import.meta.env.VITE_HOP_V4 !== 'on') return;
    let annuler = () => {};
    let demonte = false;
    void import('./ui/hopIndex/precharge').then(m => { if (!demonte) annuler = m.prechargerOutilsAuRepos(c => { coucheOutils = c; }); });
    return () => { demonte = true; annuler(); };
  }, []);
  const [hopV55Journal, setHopV55Journal] = useState<{ batchId: string; journal: import('./types').BrewDayState }>();
  // A resolved background import should not still mount a Suspense fallback.
  // Lock the surface for this route so later data updates preserve local UI state.
  const RecipeSurface = useMemo(() => preparedRecipePage()?.RecipePage ?? RecipePage,
    [baseRoute.view === 'recipe' ? baseRoute.recipeId : undefined]);
  const currentRoute = useRef(route.route);
  currentRoute.current = route.route;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const isDevLocal = import.meta.env.DEV && currentUser?.email === 'dev-local@localhost';

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
      setIsDataReady(false);
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
    const refresh = () => {
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
      // Once opened, keep cached screens and their drafts mounted during a stream outage.
      // PersistenceStatus exposes the error; signing out still resets readiness above.
      setIsDataReady(ready => ready || StorageService.isReady());
    };
    const unsubscribe = StorageService.subscribe(refresh);
    refresh();
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Un message informatif ne doit pas recouvrir la commande qui suit une
  // navigation ; les erreurs de sauvegarde restent, elles, persistantes.
  useEffect(() => {
    setToastMessage(null);
  }, [activeTab, route.route]);

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

  const openWizard = (seed?: WizardSeed, duplicateOf?: string) => {
    setWizardSeed(seed);
    route.open({ view: 'wizard', recipeId: duplicateOf ?? seed?.recipe?.id,
      duplicate: !!duplicateOf, title: seed?.title, description: seed?.description });
  };

  /**
   * Le bouton + conserve l'action de création de l'écran courant
   * (article, recette, écriture…). Le compagnon dispose de son propre bouton.
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
      case 'newHopVariety':
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
        // Le formulaire d'écriture directement, sans repasser par le sommaire.
        setQuickAction('quick-expense', actionLauncherRef.current);
        break;
      case 'quickAction':
      default:
        setQuickAction('menu');
    }
  };

  // Déstructuré pour que TypeScript sache restreindre l'union : la
  // restriction ne traverse pas un accès de propriété (`route.route.view`).
  // `view` : l'écran au premier plan ; `base` : la page restée montée sous les couches.
  const view = route.route;
  const base = baseRoute;
  const wizardDraftId = base.view === 'wizard' && base.recipeId
    ? `${base.duplicate ? 'duplicate:' : ''}${base.recipeId}`
    : base.view === 'wizard' && base.title ? `idea:${base.title}` : 'new';
  const routedRecipe =
    base.view === 'recipe' ? recipes.find((r) => r.id === base.recipeId) : undefined;
  const routedBatch =
    base.view === 'brewday' ? batches.find((b) => b.id === base.batchId) : undefined;
  const baseCovered = layerRoutes.length > 0;

  /**
   * Ce dont le compagnon parle ici, affiché sous son entrée dans le menu.
   *
   * Les pages plein écran montent leur propre conversation — recette, brouillon
   * d'assistant, brassin du jour — et `brewerLauncher` la retrouve avant le
   * repli sur l'écran d'onglet. Le libellé doit donc nommer la page, pas
   * l'onglet qu'on a quitté pour l'ouvrir.
   */
  const companionLabel =
    view.view === 'recipe' ? routedRecipe?.name ?? 'Cette recette'
    : view.view === 'brewday' ? routedBatch?.name ?? 'Ce brassin'
    : view.view === 'wizard' ? 'Recette en cours d’écriture'
    : brewerAppScreen(activeTab, subTab).label;

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
  const saveFromWizard = async (recipe: Recipe, thenBrew: boolean) => {
    const sourceRoute = route.route;
    const activeProfile = config.brewhouses.find(b => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];
    if (thenBrew) {
      const adoptionIssue = recipeInstallationAdoptionIssue(recipe, activeProfile);
      if (adoptionIssue) throw new Error(adoptionIssue);
    }
    recipe = await saveRecipeConfirmed(recipe);
    if (thenBrew) {
      const installationIssues=recipeInstallationIssues(recipe, activeProfile);
      if(installationIssues.length) throw new Error(`Recette enregistrée. Avant de lancer : ${installationIssues.join(' ')}`);
    }

    if (!thenBrew) {
      showToast(`Recette « ${recipe.name} » enregistrée.`);
      if (currentRoute.current === sourceRoute) route.close();
      return;
    }

    showToast(`Recette « ${recipe.name} » enregistrée.`);
    if (currentRoute.current === sourceRoute) {
      route.open({ view: 'recipe', recipeId: recipe.id });
      setBrewRecipeId(recipe.id);
      setQuickAction('brew-batch');
    }
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
    const result = StorageService.completeBrewStock(updated);
    showToast(result.success ? `${updated.id} en fermentation. Consommation enregistrée.` : `${updated.id} enregistré. Stock à vérifier dans le dossier du brassin.`);
    route.close();
  };

  // --- Recherche universelle ------------------------------------------------

  const financialArchives = useStorageValue(FinancialArchiveService.getArchives);
  const financialArchiveIndex = useMemo(() => archiveIndex(financialArchives), [financialArchives]);
  const commandGroups: CommandGroup[] = [
    {
      heading: 'Recettes',
      items: recipes.filter(isCurrent).map((r) => ({
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
      items: batches.filter(isCurrent).map((b) => ({
        id: `bat-${b.id}`,
        label: `${b.id} — ${b.name}`,
        detail: [b.style, batchDisplayDate(b), b.status].filter(Boolean).join(' · '),
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
      items: [...transactions].sort((a, b) => (isoDate(b.date) ?? '').localeCompare(isoDate(a.date) ?? '') || b.id.localeCompare(a.id)).map((t) => ({
        id: `tx-${t.id}`,
        label: t.description,
        detail: `${t.date} · ${t.amountTTC.toFixed(2)} CHF · ${t.subcategory}`,
        icon: <Receipt className="w-4 h-4" />,
        keywords: [t.id, t.category, t.subcategory, t.finance?.vendor ?? '', t.finance?.invoiceNumber ?? ''],
        archived: isTransactionArchived(t, financialArchiveIndex),
        onSelect: () => {
          setActiveTab('finances');
          setFinanceOpenRequest({ id: t.id, at: Date.now() });
        }
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
        <FinancialLedgerLoading />
        {writeError && (
          <div className="text-center space-y-3">
            <p className="text-sm text-alert max-w-xs leading-relaxed">{writeError}</p>
            <button type="button" className="min-h-11 rounded-xl border border-cave-700 px-4" onClick={() => window.location.reload()}>Réessayer la synchronisation</button>
          </div>
        )}
      </div>
    );
  }

  /*
   * La page de base. Couverte par une couche, elle garde le MÊME élément React : React n'en refait ni le rendu ni le
   * style (ouvrir une couche ne coûte que la couche), et son état vit tant qu'elle est montée. Découverte, elle
   * reçoit de nouveau des props fraîches. Couverte, elle n'est jamais visible (couche opaque au-dessus, dans l'ordre
   * du DOM) ni atteignable (PageShell rend inerte la branche sous la page du premier plan ; `aria-hidden` ici).
   */
  const baseContent = baseCovered && frozenBase.current?.route === base ? frozenBase.current.element : (
    <LazySurface resetKey={base.view} fallback={<PageShell title="Chargement…" onClose={route.close}><p role="status">Ouverture de la page…</p></PageShell>}>
    {routedRecipe && (
      <RecipeSurface
        key={routedRecipe.id}
        recipe={routedRecipe}
        batches={batches}
        config={config}
        onClose={route.close}
        onEdit={() => openWizard({ recipe: routedRecipe })}
        onDuplicate={() =>
          openWizard({
            recipe: {
              ...routedRecipe,
              archivedAt: null,
              id: `REC-${Date.now().toString(36).toUpperCase()}`,
              name: `${routedRecipe.name} (copie)`
            }
          }, routedRecipe.id)
        }
        onDelete={() => {
          StorageService.deleteRecipe(routedRecipe.id);
          showToast(`Recette « ${routedRecipe.name} » supprimée.`);
          route.close();
        }}
        onBrew={() => { setBrewRecipeId(routedRecipe.id); setQuickAction('brew-batch'); }}
        onOpenBatch={openBrewDay}
        onOpenHopV55={() => route.open({ view: 'hopV55', recipeId: routedRecipe.id })}
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
        onOpenHopV55={journal => { setHopV55Journal({ batchId: routedBatch.id, journal }); route.open({ view: 'hopV55', batchId: routedBatch.id }); }}
      />
    )}
  
    {base.view === 'wizard' && (
      <BrewWizard
        key={`${currentUser.uid}:${wizardDraftId}`}
        draftKey={`${currentUser.uid}:${wizardDraftId}`}
        ownerKey={currentUser.uid}
        localOnly={isDevLocal}
        seed={wizardSeed}
        stockItems={allStockItems}
        config={config}
        onClose={route.close}
        onCreateStockItem={createStockItem}
        onLearnIngredient={learnIngredient}
        onSaveWaterSource={saveWaterSource}
        onSave={saveFromWizard}
        writeError={writeError}
        onDismissWriteError={() => setWriteError(null)}
      />
    )}
    </LazySurface>
  );
  frozenBase.current = { route: base, element: baseContent };

  return (
    <div className="min-h-screen bg-cave-950 text-cave-50 flex flex-col font-sans">
      <BrewerActivity
        context={brewerAppScreen(activeTab, subTab)}
        localOnly={isDevLocal}
        hideActivityPill={activeTab === 'finances' || activeTab === 'production' && subTab === 'lab'}
      />
      {/* Erreur de sauvegarde : bandeau persistant, fermé manuellement.
          Contrairement au toast, il ne disparaît pas tout seul : perdre une
          écriture comptable sans s'en apercevoir n'est pas acceptable. */}
      {writeError && view.view !== 'wizard' && view.view !== 'hopV55' && (
        <div role="alert" className="fixed top-0 inset-x-0 z-[60] bg-alert text-white px-4 py-3 shadow-2xl flex items-start gap-3">
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
        <div role="status" className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ebc-straw text-cave-950 px-4 py-2.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 border border-ebc-gold max-w-sm text-center">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header with Global Time Filter, Direct Quick-Nav & To-Do Badge */}
      <PersistenceStatus />
      <Header
        compactLayout
        hidePeriod={activeTab === 'finances' || activeTab === 'production' && subTab === 'lab'}
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
      <main data-floating-actions-gap="nav" className="flex-1 max-w-4xl w-full mx-auto px-2 xs:px-3">
        <LazySurface resetKey={activeTab}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            transactions={transactions}
            batches={batches}
            stocks={stocks}
            planning={planning}
            config={config}
            globalTimeFilter={globalTimeFilter}
            onNavigateTab={(tab) => { if(tab==='production') setProductionSubTab('batches'); setActiveTab(tab); }}
            onOpenBatch={(batchId) => {
              setProductionSubTab('batches');
              setBatchOpenRequest({ id: batchId, at: Date.now() });
              setActiveTab('production');
            }}
            onNavigateToCreativeLab={() => {
              setLabSectionRequest({ section: 'event', at: Date.now() });
              navigateToCreativeLab();
            }}
          />
        )}

        {activeTab === 'finances' && (
          <FinancesTab
            transactions={transactions}
            openTransactionRequest={financeOpenRequest}
            recipes={recipes}
            batches={batches}
            stockItems={[...stocks.rawMaterials, ...stocks.cleaning]}
            budgetLines={budgetLines}
            config={config}
            globalTimeFilter={globalTimeFilter}
            onOpenStockItem={(ref) => {
              setStockOpenRequest({ ref, at: Date.now() });
              setActiveTab('stocks');
            }}
            onOpenRecipe={(recipeId) => {
              const recipe = recipes.find((r) => r.id === recipeId);
              if (recipe) openRecipe(recipe);
            }}
          />
        )}

        {activeTab === 'production' && (
          <ProductionTab
            visible={view.view === 'tabs'}
            batches={batches}
            recipes={recipes}
            brewhouses={config.brewhouses}
            activeBrewhouseId={config.activeBrewhouseId}
            globalTimeFilter={globalTimeFilter}
            targetSubTab={productionSubTab}
            onOpenCreateBatch={() => openWizard()}
            onOpenRecipe={openRecipe}
            onOpenHopV55={() => route.open({ view: 'hopV55' })}
            onEditRecipe={(recipe) => openWizard({ recipe })}
            onOpenBrewDay={openBrewDay}
            onSubTabChange={handleProductionSubTabChange}
            createRequest={createRequest}
            openBatchRequest={batchOpenRequest}
            onOpenBatchRequestHandled={() => setBatchOpenRequest(null)}
            openLabSectionRequest={labSectionRequest}
            onOpenLabSectionRequestHandled={() => setLabSectionRequest(null)}
            onDraftRecipe={(seed) => openWizard(seed)}
            onCreateRequestHandled={() => setCreateRequest(null)}
            onSuccessMessage={showToast}
          />
        )}

        {activeTab === 'stocks' && (
          <StocksTab
            stocks={stocks}
            batches={batches}
            onOpenHopV55={() => route.open({ view: 'hopV55' })}
            onOpenEquipmentProjects={() => { StorageService.setUiState('finances_workspace', 'projects'); setFinanceOpenRequest(null); setActiveTab('finances'); }}
            onSubTabChange={(sub) => setSubTab(sub as never)}
            openItemRequest={stockOpenRequest}
            onOpenItemRequestHandled={() => setStockOpenRequest(null)}
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
            onSubTabChange={(sub) => setSubTab(sub as never)}
            createRequest={createRequest}
            onSuccessMessage={showToast}
          />
        )}
        </LazySurface>
      </main>

      {/* Bottom Navigation Bar, et la case réservée au bouton d'action à sa droite :
          sur les onglets, le bouton ne flotte pas au-dessus du contenu défilant. */}
      <div className="app-bottom-dock">
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            // Le sous-onglet du nouvel écran se remontera tout seul ; on le vide
            // en attendant pour ne pas garder celui de l'onglet qu'on quitte.
            setSubTab(null);
            setActiveTab(tab);
          }}
          criticalStockCount={criticalStockCount}
        />
        <div aria-hidden="true" className="app-bottom-dock-cell fixed bottom-0 right-0 z-40 bg-cave-900 pb-safe">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cave-800" />
          <ActionDock kind="nav" className="h-10 w-16 ml-1 mr-3" />
        </div>
      </div>

      {/* Le geste d'action : présent sur les onglets ET sur les pages plein écran,
          posé sur la case que la barre ou la page lui réserve. */}
      <FloatingActions
        launcherRef={actionLauncherRef}
        // `quickAction` ne crée rien de propre à l'écran : il rouvrirait le
        // sommaire des saisies que le menu liste déjà en clair.
        action={view.view === 'tabs' && fabAction.intent !== 'quickAction' ? fabAction : null}
        onAction={runFabAction}
        companionLabel={companionLabel}
        anchor={view.view === 'tabs' ? 'nav' : 'page'}
        onInvoice={() => setQuickAction('scan', actionLauncherRef.current)}
        onSale={() => setQuickAction('quick-sale', actionLauncherRef.current)}
        onRecipe={() => openWizard()}
        onBrew={() => setQuickAction('brew-batch', actionLauncherRef.current)}
      />

      {/* Quick Action Modal (Scanner IA, Matching Stock interactif, Brassin, Vente) */}
      <ModalOpenerContext.Provider value={quickActionOpener.current}><DeferredSurface active={quickAction !== null} fallback={<Sheet open={quickAction !== null} title="Chargement…" onClose={() => setQuickAction(null)}><p role="status">Ouverture…</p></Sheet>}><QuickActionModal
        isOpen={quickAction !== null}
        initialScreen={quickAction ?? 'menu'}
        onClose={() => { setQuickAction(null); setBrewRecipeId(undefined); }}
        initialRecipeId={brewRecipeId}
        onBatchCreated={batch => route.open({ view: 'brewday', batchId: batch.id })}
        recipes={recipes}
        geminiApiKey={config.geminiApiKey}
        onSuccessMessage={showToast}
        onOpenCreateBatch={() => openWizard()}
      /></DeferredSurface></ModalOpenerContext.Provider>

      {/* Settings Modal */}
      <DeferredSurface active={isSettingsOpen} fallback={<Sheet open={isSettingsOpen} title="Chargement…" onClose={() => setIsSettingsOpen(false)}><p role="status">Ouverture…</p></Sheet>}><SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigUpdated={(newCfg) => setConfig(newCfg)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
      /></DeferredSurface>

      {/* Audit Logbook Modal */}
      <DeferredSurface active={isAuditLogsOpen} fallback={<Sheet open={isAuditLogsOpen} title="Chargement…" onClose={() => setIsAuditLogsOpen(false)}><p role="status">Ouverture…</p></Sheet>}><AuditLogModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
        logs={auditLogs}
      /></DeferredSurface>

      {/* Cloud & AI Config Modal (Google Drive & Gemini API) */}
      <DeferredSurface active={isCloudConfigOpen} fallback={<Sheet open={isCloudConfigOpen} title="Chargement…" onClose={() => setIsCloudConfigOpen(false)}><p role="status">Ouverture…</p></Sheet>}><CloudConfigModal
        isOpen={isCloudConfigOpen}
        onClose={() => setIsCloudConfigOpen(false)}
        onSaved={() => showToast('Configuration Cloud & IA mise à jour !')}
      /></DeferredSurface>

      {/* Recherche universelle — ⌘K / Ctrl+K depuis n'importe où. */}
      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        groups={commandGroups}
      />

      {/* --- Pages plein écran ------------------------------------------
          Elles se ferment au geste retour du téléphone, contrairement aux
          modales qu'elles remplacent. */}

      <HopV55SemanticAdviceCapabilityContext.Provider value={semanticAdviceCapability}>
      {/* La base reste à la même place de l'arbre, couverte ou non : React garde son instance. Couverte, elle est
          cachée (sans perdre sa mise en page ni son défilement) ; PageShell rend inerte la branche sous la couche. */}
      <div data-route-base={base.view} aria-hidden={baseCovered || undefined} style={{ display: 'contents' }}>
      {baseContent}
      </div>

      {/* Les couches, du bas vers le haut ; chacune garde sa place (clé = son niveau) et son chargement à part,
          pour qu'une couche qui se charge ne masque pas celles du dessous. */}
      {layerRoutes.map((layer, i) => {
        const covered = i < layerRoutes.length - 1;
        return (
          <div key={`${baseIndex + 1 + i}:${layer.view}`} data-route-layer={layer.view} aria-hidden={covered || undefined}
            style={{ display: 'contents' }}>
            <LazySurface resetKey={layer.view} fallback={<PageShell title="Chargement…" onClose={route.close}><p role="status">Ouverture de la page…</p></PageShell>}>
              {layer.view === 'hopV55'
                ? <HopV55Host key={`${currentUser.uid}:${layer.recipeId ?? layer.batchId ?? 'explore'}`} ownerKey={currentUser.uid}
                    recipe={layer.recipeId ? recipes.find(recipe => recipe.id === layer.recipeId) : undefined}
                    batch={layer.batchId ? batches.find(batch => batch.id === layer.batchId) : undefined}
                    journal={layer.batchId === hopV55Journal?.batchId ? hopV55Journal?.journal : undefined}
                    onClose={route.close} onOpenRecipe={openRecipe} writeError={writeError} onDismissWriteError={() => setWriteError(null)} />
                : <HopToolLayer route={layer} level={i + 1} onClose={route.close} />}
            </LazySurface>
          </div>
        );
      })}
      </HopV55SemanticAdviceCapabilityContext.Provider>
    </div>
  );
};
