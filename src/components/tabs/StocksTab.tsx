import React, { lazy, Suspense, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, ShoppingCart, Copy, Check, Boxes, Beer, Wrench, Hop, Undo2 } from 'lucide-react';
import { StockItem, EquipmentItem, KegItem, Batch, Recipe, Client } from '../../types';
import { StorageService } from '../../services/storage';
import { latestBrewPrices } from '../../domain/finance/brewBudget';
import { Units } from '../../services/units';
import { articlesACommander, compareRecipeWithStock, type RecipeStockComparison } from '../../domain/stockLevel';
import { EnteteRayon } from '../../ui/stock/EnteteRayon';
import { dernierMouvementDit, mouvementsParRef } from '../../domain/stock/dernierMouvement';
import type { MouvementBrut } from '../../domain/stock/mouvementsArticle';
import { libellesSources, type SourceBesoin } from '../../domain/stock/disponibilite';
import { lignesDeReglage, phraseReglage, vueHorizon } from '../../domain/stock/horizon';
import { CommandeRepliee } from '../../ui/stock/ChiffreACommander';
import { estFamilleAutre, FAMILLES_AUTRES } from '../../domain/stock/murDonnees';
import { aujourdhuiLocal, useHorizonStock } from '../../ui/stock/useHorizonStock';
import { nextUniqueRef } from '../../services/refs';
import { EntityList } from '../../ui/EntityList';
import { StockRow } from '../../ui/StockRow';
import { StockDetailSheet } from '../../ui/StockDetailSheet';
import { KegBoard } from '../../ui/KegBoard';
import { EquipmentList, aujourdhuiIso } from '../../ui/EquipmentList';
import { EquipmentDetail } from '../../ui/equipment/Detail';
import { aTraiter } from '../../domain/equipment';
import type { FinanceTransaction } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { isUpgradePlan } from '../../domain/finance/upgrades';
import { estRealise } from '../../domain/finance/upgradeRing';
import { BARRE_BASE, BARRE_MATERIEL, BARRE_SUR_DEFILEMENT, UpgradeWorkspace } from '../../ui/finance/UpgradeWorkspace';
/* Critique 5, n° 41 : la barre de Matériel ancre le + volant au bord de la colonne (règle dans carnets-decider.css). */
import '../../ui/carnets/carnets-decider.css';
import { Sheet } from '../../ui/Sheet';
import { Button } from '../ui/Button';
import { FormNav, Field, TextInput, inputClass } from '../../ui/FormNav';
import { Combobox } from '../../ui/Combobox';
import { Suggestions } from '../../services/suggestions';
import { InventoryCorrectionSheet } from '../../ui/InventoryCorrectionSheet';
import { INVENTORY_REASONS, InventoryReason } from '../../services/storage';
import { ExpenseSheet } from '../../ui/finance/ExpenseSheet';
import { EquipmentSheet } from '../../ui/EquipmentSheet';
import { useLiveSelection, useStorageValue } from '../../hooks/useLiveData';
import { ViewNavigation, MobileDetails } from '../../ui/ViewNavigation';
import { useMobileLayout } from '../../ui/useViewport';
import '../../ui/stocks.css';
import { formatLitres } from '../../domain/recipeMetrics';
import { quantiteLue } from '../../domain/stock/regles';
import { createSearch, runSearch } from '../../services/search';
import { rechercherStock } from '../../domain/stock/recherche';
import { infoLigne, compterEtats, trierArticles, resumeRayon, familleRecompter, TRIS, type TriListe } from '../../domain/stock/liste';
import { GROUPES_LISTE, LIBELLE_FAMILLE, groupeListe, lignesRetenues, texteFiltre, type FiltreListe } from '../../domain/stock/listeFiltres';
import { BasculeVue, Recherche, Pastilles, LigneFiltre, LigneTri, type VueStock } from '../../ui/stock/OutilsStock';
import { RecompterStock } from '../../ui/stock/RecompterStock';

/* Carnet d'idées (R01 à R08) : chargé à l'ouverture du segment Carnets seulement. */
const CarnetsVue = lazy(() => import('../../ui/carnets/CarnetsVue').then(({ CarnetsVue }) => ({ default: CarnetsVue })));
const MurStock = lazy(() => import('../../ui/stock/MurStock').then(({ MurStock }) => ({ default: MurStock })));
const HopIndexPanel = lazy(() =>
  import('../../ui/hopIndex/HopIndexWorkspace').then(({ HopIndexWorkspace }) => ({
    default: HopIndexWorkspace,
  })),
);

const readRecipes = () => StorageService.getRecipes();
// Hors du composant : `useStorageValue` relit à chaque changement de `read` ; une flèche écrite dans le rendu
// le changerait à chaque rendu, et `getStockMovements()` rend un tableau neuf tant que la collection est absente (boucle).
const readMovements = () => StorageService.getStockMovements();
const readTransactions = () => StorageService.getTransactions();
/** Les comptes du segment de Matériel (p2:g05-1 « À venir 1 · Carnets 4 · Réalisés 0 ») : la règle même d'À venir et Réalisés (`estRealise`, UpgradeWorkspace). */
const readSegments = () => {
  const { plans, payments } = FinanceService.snapshot();
  const transactions = StorageService.getTransactions() as unknown as FinanceTransaction[];
  const projets = plans.filter(isUpgradePlan);
  const realise = (p: (typeof projets)[number]) => ['draft', 'active'].includes(p.status) && estRealise(p, transactions, payments);
  const carnets = StorageService.getCreativeItems().filter(i => i.type === 'carnet' && !(i as { carnet?: { archive?: unknown } }).carnet?.archive).length;
  return {
    avenir: projets.filter(p => ['draft', 'active'].includes(p.status) && !realise(p)).length,
    realises: projets.filter(p => p.status === 'completed' || realise(p)).length,
    carnets
  };
};
/** Stocks › Matériel : le parc tel qu'il est (Points ouverts 1 : « Parc » en tête, rien ne se perd, D-41), puis le segment figé « À venir · Carnets · Réalisés » (R08). */
type SegMateriel = 'parc' | 'avenir' | 'carnets' | 'realises';
const SEGMENTS_MATERIEL: SegMateriel[] = ['parc', 'avenir', 'carnets', 'realises'];

interface StocksTabProps {
  stocks: {
    rawMaterials: StockItem[];
    cleaning: StockItem[];
    equipment: EquipmentItem[];
    kegs: KegItem[];
  };
  batches: Batch[];
  /** Les clients de l'onglet Clients : la fiche d'un fût plein en choisit un pour livrer. */
  clients?: Client[];
  /** Remonte le sous-onglet courant : le bouton d'action en dépend. */
  onSubTabChange?: (sub: string) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
  /** Article à ouvrir directement, demandé depuis un autre écran (une facture). */
  openItemRequest?: { ref: string; at: number } | null;
  onOpenItemRequestHandled?: () => void;
  onSuccessMessage?: (msg: string) => void;
  onOpenEquipmentProjects?: () => void;
  /** Fiche d'article : « voir la facture » et « voir le bilan » (absents : les lignes ne sont pas cliquables). */
  onOpenTransaction?: (id: string) => void;
  onOpenBatch?: (id: string) => void;
  /** Ouvrir un carnet d'idées précis (« Ouvrir le carnet » d'À venir, icône d'idée du calendrier) : Stocks › Matériel › Carnets, ce carnet ouvert. */
  openCarnetRequest?: { id: string; at: number } | null;
  onOpenCarnetRequestHandled?: () => void;
}

type SubTab = 'stock' | 'courses' | 'futs' | 'materiel' | 'hops';

/**
 * Écran Stocks.
 *
 * Il ne reste **qu'une** liste, virtualisée et groupée par catégorie, pour les
 * matières premières et l'hygiène confondues. La version précédente comptait
 * cinq sous-onglets et cinq fonctions de rendu écrites à la main, chacune avec
 * ses propres unités codées en dur — c'est de là que venait le houblon affiché
 * « 20000g ».
 *
 * L'ordre des groupes suit le déroulé d'un brassage : ce qu'on pèse d'abord,
 * puis ce qu'on ajoute, puis ce qui conditionne, puis ce qui nettoie.
 */
const GROUP_ORDER = [
  'Malt',
  'Houblon',
  'Levure',
  'Sucre',
  'Additif',
  'Emballage',
  'CIP alcalin',
  'CIP acide',
  'Désinfectant',
  'Détergent',
  'Sols',
  'EPI',
  'Consommable'
];

export const StocksTab: React.FC<StocksTabProps> = ({
  stocks,
  batches,
  clients = [],
  onSubTabChange,
  createRequest,
  openItemRequest,
  onOpenItemRequestHandled,
  onSuccessMessage,
  onOpenEquipmentProjects,
  onOpenTransaction,
  onOpenBatch,
  openCarnetRequest,
  onOpenCarnetRequestHandled
}) => {
  const [subTab, setSubTab] = useState<SubTab>(() =>
    StorageService.getUiState<SubTab>('stocks_subtab', 'stock')
  );
  const [segMateriel, setSegMaterielEtat] = useState<SegMateriel>(() => {
    const lu = StorageService.getUiState<SegMateriel>('stocks_materiel', 'parc');
    return SEGMENTS_MATERIEL.includes(lu) ? lu : 'parc';
  });
  const setSegMateriel = (seg: SegMateriel) => { setSegMaterielEtat(seg); StorageService.setUiState('stocks_materiel', seg); };
  const segments = useStorageValue(readSegments);
  /** Une demande d'ouverture (carnet précis) ou de focus du champ (+ « Nouvelle idée ») pour la vue Carnets. */
  const [carnetOuvert, setCarnetOuvert] = useState<{ id: string; at: number } | null>(null);
  const [focusChamp, setFocusChamp] = useState<number | null>(null);
  const tabsRef = useRef<HTMLElement>(null);
  useEffect(() => { tabsRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [subTab]);
  const allItems = useMemo(
    () => [...stocks.rawMaterials, ...stocks.cleaning],
    [stocks.rawMaterials, stocks.cleaning]
  );
  const savedRecipes = useStorageValue(readRecipes);
  const movements = useStorageValue(readMovements);
  // Colonne « Dernier mouvement » du tableau (≥ 900 px) : les mouvements regroupés une fois par article, la phrase calculée à la demande de chaque ligne.
  const mouvementsDeLArticle = useMemo(() => mouvementsParRef(movements as MouvementBrut[]), [movements]);
  const mouvementDit = (item: StockItem) => dernierMouvementDit(item, mouvementsDeLArticle.get(item.ref) ?? [], batches);
  // « Dernier prix » de la fiche : la dernière ligne d'achat de chaque article (cx, ST-T24).
  const transactions = useStorageValue(readTransactions);
  const achats = useMemo(() => latestBrewPrices(transactions), [transactions]);
  const recipes = useMemo(() => savedRecipes
    .filter(recipe => !recipe.archivedAt)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  [savedRecipes]);
  const [recipeId, setRecipeId] = useState('');
  const selectedRecipe = recipes.find(recipe => recipe.id === recipeId) ?? null;
  const recipeComparison = useMemo(() => selectedRecipe
    ? compareRecipeWithStock(selectedRecipe, batches, allItems, savedRecipes)
    : [], [selectedRecipe, batches, allItems, savedRecipes]);
  const [selected, setSelected] = useLiveSelection(allItems, 'ref');
  const [creating, setCreating] = useState(false);
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);
  // Un seul filtre à la fois (pastille, nom d'un rayon du mur, tuile de Recompter), une recherche et un tri : l'étagère et Recompter les partagent (maquette sy/fA).
  const [filtre, setFiltre] = useState<FiltreListe | null>(null);
  const [q, setQ] = useState('');
  const [tri, setTriEtat] = useState<TriListe>(() => {
    const t = StorageService.getUiState<TriListe>('stock_tri', 'defaut');
    return TRIS.some(x => x.id === t) ? t : 'defaut';
  });
  const setTri = (t: TriListe) => { setTriEtat(t); StorageService.setUiState('stock_tri', t); };
  const [vue, setVueEtat] = useState<VueStock>(() => StorageService.getUiState<VueStock>('stock_vue', 'etagere') === 'recompter' ? 'recompter' : 'etagere');
  const setVue = (v: VueStock) => { setVueEtat(v); StorageService.setUiState('stock_vue', v); };

  /*
   * Matériel et fûts : ils n'étaient consultables qu'en lecture. Une fiche
   * ouverte à `null` ferme la feuille ; une fiche vide vaut création.
   */
  const [equipmentSheet, setEquipmentSheet] = useLiveSelection(stocks.equipment, 'ref');
  const [purchasingEquipment, setPurchasingEquipment] = useState(false);
  /** « Ajouter un besoin » demandé par le + volant sur À venir (P39) : transmis à l'UpgradeWorkspace, qui ouvre sa feuille. */
  const [besoinDemande, setBesoinDemande] = useState<{ kind: string; at: number } | null>(null);
  // Matériel (za3) : à ≥ 1024 px la fiche s'ouvre à côté de la liste (premier appareil à traiter par défaut), en dessous dans la feuille.
  const [grandEcran, setGrandEcran] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 1024px)').matches);
  useEffect(() => {
    const q = typeof window !== 'undefined' ? window.matchMedia?.('(min-width: 1024px)') : undefined;
    if (!q) return;
    const maj = () => setGrandEcran(q.matches);
    q.addEventListener?.('change', maj);
    return () => q.removeEventListener?.('change', maj);
  }, []);
  const [paneRef, setPaneRef] = useState<string | null>(null);
  const [payingMaintenance, setPayingMaintenance] = useState<string | null>(null);
  const [annulerMateriel, setAnnulerMateriel] = useState<{ message: string; previous: EquipmentItem } | null>(null);
  /** Un geste fait dans la fiche (Étalonné, Fait) : la liste en tire la note « à jour jusqu'au » et la ligne surlignée à sa nouvelle date (N1). */
  const [traiteMateriel, setTraiteMateriel] = useState<{ avant: EquipmentItem; apres: EquipmentItem; id: number } | null>(null);
  const changerDepuisFiche = (item: EquipmentItem, toast?: string) => {
    const avant = stocks.equipment.find((e) => e.ref === item.ref);
    ecrireMateriel(item, undefined, toast);
    if (toast && avant) setTraiteMateriel({ avant, apres: item, id: Date.now() });
  };
  const nomPaiement = payingMaintenance ? stocks.equipment.find((e) => e.ref === payingMaintenance)?.name : undefined;
  useEffect(() => { if (!annulerMateriel) return; const t = setTimeout(() => setAnnulerMateriel(null), 8000); return () => clearTimeout(t); }, [annulerMateriel]);
  const vivantsMateriel = useMemo(() => stocks.equipment.filter((e) => !e.retired), [stocks.equipment]);
  const volet = useMemo(() => vivantsMateriel.find((e) => e.ref === paneRef)
    ?? aTraiter(vivantsMateriel, { today: aujourdhuiIso(), batches })[0]?.item ?? vivantsMateriel[0] ?? null, [vivantsMateriel, paneRef, batches]);
  /** Un geste ou un changement de fiche : on écrit l'appareil neuf ; avec un toast, l'ancien reste pour « Annuler ». */
  const ecrireMateriel = (next: EquipmentItem, previous?: EquipmentItem, toast?: string) => {
    StorageService.updateEquipment(next);
    const avant = previous ?? stocks.equipment.find((e) => e.ref === next.ref);
    if (toast && avant) setAnnulerMateriel({ message: toast, previous: avant });
  };
  /** « Ajouter des fûts » : ouvert par le bouton rond « + » de l'onglet Fûts. */
  const [addingKegs, setAddingKegs] = useState(false);

  const blankEquipment = (): EquipmentItem => ({
    id: `EQ-${Date.now()}`,
    ref: nextUniqueRef('EQ', stocks.equipment.map((e) => e.ref)),
    name: '',
    category: 'Brassage',
    state: 'Neuf'
  });

  const setCreatingEquipment = (on: boolean) => setEquipmentSheet(on ? blankEquipment() : null);

  /** Toute la liste de courses, tous fournisseurs confondus. */
  const copyEverything = () => {
    if (shoppingBySupplier.length === 0) {
      onSuccessMessage?.(aCommander.length > 0
        ? `Rien à commander ${phraseReglage(vueH, horizon)} : ${aCommander.length} ${typeof horizon === 'string' ? 'plus tard' : 'hors de la fenêtre'}, touchez Tout.`
        : 'Rien à commander : le stock couvre les brassins planifiés et les recettes écrites.');
      return;
    }
    const text = [
      `Commande — Brasserie L'Affinée`,
      '',
      ...shoppingBySupplier.flatMap(([supplier, list]) => [
        `${supplier} :`,
        ...list.map((l) => `  - ${l.item.name} : ${l.missing > 0 ? `${l.auMoins ? 'au moins ' : ''}${Units.format(l.missing, l.item.unit)}` : 'seuil atteint, quantité à définir'}`),
        ''
      ])
    ].join('\n');
    navigator.clipboard.writeText(text);
    onSuccessMessage?.(`Liste de ${totalToOrder} articles copiée.`);
  };

  // Le bouton d'action doit savoir où l'on est : il crée ce que l'écran montre.
  // Sur Matériel › Carnets, l'écran remonte `carnets` : le + y porte l'action du carnet (R28, D-42).
  useEffect(() => {
    onSubTabChange?.(subTab === 'materiel' && segMateriel === 'carnets' ? 'carnets' : subTab);
  }, [subTab, segMateriel, onSubTabChange]);

  useEffect(() => {
    if (!openCarnetRequest) return;
    setSubTab('materiel');
    setSegMateriel('carnets');
    setCarnetOuvert({ id: openCarnetRequest.id, at: openCarnetRequest.at });
    onOpenCarnetRequestHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCarnetRequest?.at]);

  /**
   * Le bouton d'action a demandé une création : c'est l'écran qui sait quoi
   * ouvrir. L'App n'a pas à connaître les formulaires de chaque onglet.
   */
  useEffect(() => {
    if (!createRequest) return;
    switch (createRequest.kind) {
      case 'newStockItem':
        setCreating(true);
        break;
      case 'newKeg':
        setAddingKegs(true);
        break;
      case 'newEquipment':
        // P39 (h05-9, R28) : sur Matériel › À venir, le + volant ajoute un besoin (l'action de l'écran) ; ailleurs, l'achat de matériel.
        if (subTab === 'materiel' && segMateriel === 'avenir') { setBesoinDemande({ kind: 'newBesoin', at: createRequest.at }); break; }
        setPurchasingEquipment(true);
        break;
      case 'newIdea':
        // « Nouvelle idée » (+ sur Carnets) : le champ du bas prend le focus, rien d'autre (R28).
        setSubTab('materiel');
        setSegMateriel('carnets');
        setFocusChamp(createRequest.at);
        break;
      case 'copyShoppingList':
        copyEverything();
        break;
      default:
        break;
    }
    // `at` change à chaque appui : deux demandes identiques restent distinctes.
  }, [createRequest?.at]);

  /**
   * Un autre écran demande d'ouvrir un article précis — typiquement la ligne
   * d'une facture qui vient d'acheter ce produit. On revient sur la liste des
   * stocks et on ouvre sa fiche : le renvoi doit aboutir sur la donnée, pas
   * seulement sur l'onglet.
   */
  useEffect(() => {
    if (!openItemRequest) return;
    const item = allItems.find((candidate) => candidate.ref === openItemRequest.ref);
    setSubTab('stock');
    if (item) setSelected(item);
    onOpenItemRequestHandled?.();
    // `at` change à chaque demande : deux renvois vers le même article restent distincts.
  }, [openItemRequest?.at]);

  useEffect(() => {
    StorageService.setUiState('stocks_subtab', subTab);
  }, [subTab]);

  const typeOf = (item: StockItem): 'rawMaterials' | 'cleaning' =>
    stocks.cleaning.some((c) => c.ref === item.ref) ? 'cleaning' : 'rawMaterials';

  /**
   * Correction d'inventaire — remplace l'ajustement rapide qui vivait sur
   * chaque ligne. On saisit le stock COMPTÉ et un motif ; l'écart est calculé
   * et journalisé. Le stock ne bouge autrement que par achat et par brassage.
   */
  const [correcting, setCorrecting] = useLiveSelection(allItems, 'ref');

  const applyCorrection = (
    item: StockItem,
    countedQty: number,
    reason: InventoryReason,
    note?: string
  ) => {
    const result = StorageService.adjustInventory(typeOf(item), item.ref, countedQty, reason, note);
    if (!result) {
      onSuccessMessage?.(`${item.name} : correction refusée, le stock n’a pas changé.`);
      return;
    }
    onSuccessMessage?.(
      result.delta === 0
        ? `${item.name} : inventaire confirmé.`
        : `${item.name} : ${result.delta > 0 ? '+' : ''}${Units.format(
            result.delta,
            item.unit
          )} — ${INVENTORY_REASONS[reason]}.`
    );
  };

  // Le même compte que le badge de la barre et « À commander » (test en ligne n° 49, 08.11 : « Stock (1) » au-dessus de « À commander · 0 »).
  const aCommander = useMemo(() => articlesACommander(allItems, batches, savedRecipes), [allItems, batches, savedRecipes]);
  // Pastille C (16.11) : un seul horizon (S49 · 6 sem. · Tout) règle le chiffre clé, la pastille de l'onglet et la liste de courses.
  const [horizon, setHorizon] = useHorizonStock();
  const vueH = useMemo(() => vueHorizon(aCommander, batches, aujourdhuiLocal()), [aCommander, batches]);
  const refsHorizon = useMemo(() => new Set(lignesDeReglage(vueH, horizon).map(l => l.item.ref)), [vueH, horizon]);

  /**
   * Liste de courses : ce qui manque pour couvrir les brassins planifiés,
   * regroupé par fournisseur habituel. Entièrement calculé, jamais saisi.
   */
  const shoppingBySupplier = useMemo(() => {
    const map = new Map<string, Array<{ item: StockItem; missing: number; auMoins: boolean; sources: SourceBesoin[] }>>();

    aCommander.filter(a => refsHorizon.has(a.item.ref)).forEach(({ item, missing: toOrder, auMoins, sources }) => {
      const supplier = item.supplier?.trim() || 'Fournisseur à préciser';
      const arr = map.get(supplier) ?? [];
      arr.push({ item, missing: toOrder, auMoins, sources });
      map.set(supplier, arr);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [aCommander, refsHorizon]);

  const totalToOrder = shoppingBySupplier.reduce((n, [, list]) => n + list.length, 0);
  const [ongletMur, setOngletMur] = useState<'ing' | 'autres'>('ing');
  // Les états de chaque ligne (pastilles, barres), d'une seule règle : domain/stock/liste.ts. Les compteurs des pastilles et du mur comptent tout le stock.
  const infos = useMemo(() => {
    const parRef = new Map(aCommander.map(a => [a.item.ref, a]));
    const aujourdhui = new Date().toISOString().slice(0, 10);
    return new Map(allItems.map(i => [i.ref, infoLigne(i, parRef, aujourdhui)] as const));
  }, [allItems, aCommander]);
  const aCommanderParRef = useMemo(() => new Map(aCommander.map(a => [a.item.ref, a] as const)), [aCommander]);
  const comptesEtats = useMemo(() => compterEtats([...infos.values()]), [infos]);
  // Le total de chaque rayon, pour « 2 sur 15 » dans l'en-tête quand un filtre ou une recherche est actif.
  const totauxGroupes = useMemo(() => { const m = new Map<string, number>(); allItems.forEach(i => { const g = groupeListe(i); m.set(g, (m.get(g) ?? 0) + 1); }); return m; }, [allItems]);
  const nEpingles = allItems.filter(i => i.favorite).length;
  const fuse = useMemo(() => createSearch(allItems, ['name', 'ref', 'category', 'supplier']), [allItems]);
  // Des mots, pas des ressemblances (vd, ST-V4) : « cit » ne ramène que Citra ; le flou de Fuse ne sert que s'il n'y a aucun mot exact.
  const recherche = useMemo(() => q.trim().length >= 2 ? new Set(rechercherStock(allItems, q.trim(), (s) => runSearch(fuse, s)).map(i => i.ref)) : null, [allItems, fuse, q]);
  const retenus = useMemo(() => lignesRetenues(allItems, infos, { filtre, recherche }), [allItems, infos, filtre, recherche]);
  // Le mur suit la liste : ses marques hors filtre ou recherche pâlissent (maquette fA).
  const refsRetenues = useMemo(() => (filtre || recherche) ? new Set(retenus.map(i => i.ref)) : null, [filtre, recherche, retenus]);
  // Autres stocks (STK-AUTRES-MORT, 19.11) : la liste ne garde que les familles hors du mur (Additifs, Emballage, Nettoyage), sans le tri des ingrédients ;
  // Ingrédients rend la liste entière et son tri. Recompter garde ses tuiles (l'onglet du mur n'y paraît pas).
  const autresStocks = ongletMur === 'autres' && vue === 'etagere';
  const visibleItems = useMemo(() => {
    const tries = trierArticles(retenus, tri, infos);
    return autresStocks ? tries.filter(i => estFamilleAutre(familleRecompter(i))) : tries;
  }, [retenus, tri, infos, autresStocks]);
  const groupesVisibles = useMemo(() => autresStocks ? FAMILLES_AUTRES.map(f => LIBELLE_FAMILLE[f]) : GROUPES_LISTE, [autresStocks]);
  const changerOngletMur = (o: 'ing' | 'autres') => {
    setOngletMur(o);
    // Un filtre de l'autre onglet viderait la liste : il s'ôte au passage (Malts en Autres stocks, Additifs en Ingrédients).
    if (o === 'autres' ? filtre === 'Malts' || filtre === 'Houblons' || filtre === 'Levures' : estFamilleAutre(filtre)) setFiltre(null);
  };
  // Une carte d'Autres stocks : Additifs, Emballage, Nettoyage filtrent la liste (re-toucher l'ôte) ; Fûts et Matériel ouvrent leur sous-onglet, où vivent leurs articles.
  const toucherCarte = (id: string) => {
    if (id === 'Fûts') setSubTab('futs');
    else if (id === 'Matériel') { setSegMateriel('parc'); setSubTab('materiel'); }
    else if (estFamilleAutre(id)) setFiltre(f => (f === id ? null : id));
  };
  // Un rayon se plie (chevron ⌃ de la maquette g6) : son en-tête garde son compte et dit en une ligne ce qui compte (manque, épuisés, bas…). L'état vit le temps de l'écran.
  const [plies, setPlies] = useState<ReadonlySet<string>>(() => new Set());
  const basculerPli = useCallback((nom: string) => setPlies(p => { const n = new Set(p); if (!n.delete(nom)) n.add(nom); return n; }), []);
  const resumes = useMemo(() => { const m = new Map<string, string>(); GROUPES_LISTE.forEach(g => m.set(g, resumeRayon(visibleItems.filter(i => groupeListe(i) === g), infos))); return m; }, [visibleItems, infos]);
  const phraseFiltre = texteFiltre({ filtre, q }, retenus.length);
  const toutVoir = () => { setFiltre(null); setQ(''); };
  // Un comptage de Recompter : le stock devient la quantité comptée, un mouvement « comptage » garde l'écart.
  const compter = (item: StockItem, quantite: number): boolean => {
    const r = StorageService.adjustInventory(typeOf(item), item.ref, quantite, 'comptage');
    if (r) onSuccessMessage?.(`${item.name} compté : ${Units.format(quantite, item.unit)}.`);
    return !!r;
  };

  const copyList = (supplier: string, list: Array<{ item: StockItem; missing: number; auMoins: boolean }>) => {
    const text = [
      `Commande — Brasserie L'Affinée`,
      `Fournisseur : ${supplier}`,
      '',
      ...list.map((l) => `- ${l.item.name} : ${l.missing > 0 ? `${l.auMoins ? 'au moins ' : ''}${Units.format(l.missing, l.item.unit)}` : 'seuil atteint, quantité à définir'}`)
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSupplier(supplier);
    setTimeout(() => setCopiedSupplier(null), 2500);
  };

  const handleCreate = (draft: Partial<StockItem>) => {
    const isCleaning = /CIP|Désinfectant|Détergent|Sols|EPI|Consommable/i.test(
      draft.category || ''
    );
    const ref = nextUniqueRef(
      isCleaning ? 'NT' : 'MP',
      allItems.map((i) => i.ref)
    );
    StorageService.addStockItem(isCleaning ? 'cleaning' : 'rawMaterials', {
      id: `RM-${Date.now()}`,
      ref,
      name: (draft.name || '').trim(),
      category: draft.category || 'Divers',
      unit: draft.unit || 'kg',
      currentStock: draft.currentStock ?? 0,
      minStock: draft.minStock ?? 0,
      reorder: (draft.currentStock ?? 0) <= (draft.minStock ?? 0),
      supplier: draft.supplier?.trim() || undefined
    });
    setCreating(false);
  };

  const tabs: Array<{ id: SubTab; label: string; Icon: typeof Boxes; badge?: number }> = [
    // Pas de chiffre sur les sous-onglets (maquette C) : le chiffre clé et la pastille de l'onglet le disent déjà, d'un seul horizon.
    { id: 'stock', label: 'Articles', Icon: Boxes },
    { id: 'courses', label: 'Courses', Icon: ShoppingCart },
    { id: 'futs', label: 'Fûts', Icon: Beer },
    { id: 'materiel', label: 'Matériel', Icon: Wrench },
    { id: 'hops', label: 'Houblons', Icon: Hop }
  ];

  const mobile = useMobileLayout();
  // Une frappe ou un filtre ne cache jamais le champ de recherche ni la ligne de filtre (vd, verdict bdd71433 n° 2 et 3) : le bloc défile avec la liste, donc si l'on avait
  // descendu, on remonte juste assez pour que le champ soit en haut de l'écran ; si le champ est déjà visible, rien ne bouge.
  const refPanneau = useRef<HTMLDivElement>(null);
  const refHaut = useRef<HTMLDivElement>(null);
  const filtreDejaLu = useRef(false);
  useEffect(() => {
    if (!filtreDejaLu.current) { filtreDejaLu.current = true; return; }
    const el = refPanneau.current;
    if (!el) return;
    // APP-ENTETE-COLLE (19.11) : c'est la fenêtre qui défile (EntityList `defileFenetre`).
    const cible = window.scrollY + el.getBoundingClientRect().top - 4;
    if (window.scrollY > cible) window.scrollTo(window.scrollX, Math.max(0, cible));
  }, [filtre, q]);
  // La liste virtualisée mesure sa distance au haut du bloc : quand les outils ou le mur changent de hauteur (onglet Autres stocks plus bas que le mur, légende), on le lui redit (verdict n° 5).
  useEffect(() => {
    const haut = refHaut.current;
    if (!haut || typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(() => window.dispatchEvent(new Event('scroll')));
    o.observe(haut);
    return () => o.disconnect();
  }, []);
  // Le bloc d'outils (segment, recherche, pastilles, ligne de filtre) : fixe en Recompter, il défile avec le mur et la liste en Étagère (sinon la liste n'avait que 158 px à 390).
  const blocOutils = (
    <div className="stock-outils shrink-0 pt-1">
      <BasculeVue vue={vue} onVue={setVue} />
      <div ref={refPanneau} className="sz-pan-h mt-1 px-[10px]">
        <Recherche q={q} onQ={setQ} action={!mobile && <Button intent="secondary" aria-label="Ajouter un article" onClick={() => setCreating(true)} icon={<Plus className="w-4 h-4" />}><span className="hidden sm:inline">Ajouter un article</span></Button>} />
        <Pastilles comptes={comptesEtats} filtre={filtre} onFiltre={setFiltre} nEpingles={nEpingles} />
        <LigneFiltre texte={phraseFiltre} onToutVoir={toutVoir} />
      </div>
    </div>
  );

  return (
    // Articles et Courses défilent avec la fenêtre : l'en-tête de l'app part comme ailleurs (APP-ENTETE-COLLE, 19.11). Fûts, Matériel, Houblons gardent leur hauteur.
    <div className={`stocks-screen flex flex-col ${subTab === 'stock' || subTab === 'courses' ? 'stocks-fenetre' : 'h-[calc(100dvh-8.5rem)]'} pt-1 gap-1`}>
      <div className="min-w-0 shrink-0">
      <ViewNavigation<typeof subTab> label="Vue des stocks" value={subTab} onChange={setSubTab} options={tabs.map(tab => ({value:tab.id,label:tab.label+(tab.badge ? ` (${tab.badge})` : ''),shortLabel:tab.label}))}>
      <nav ref={tabsRef} className="shrink-0 flex gap-1 p-1 rounded-control bg-cave-900 border border-cave-800 overflow-x-auto">
        {tabs.map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            aria-current={subTab === id ? 'page' : undefined}
            className={`flex-1 min-w-fit px-2 min-h-touch rounded-control flex items-center justify-center gap-1.5
                        text-sm font-medium transition-colors ${
                          subTab === id
                            ? 'bg-ebc-straw text-cave-950'
                            : 'text-cave-400 hover:text-cave-50'
                        }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={`font-mono text-footnote px-1.5 rounded-full ${
                  subTab === id ? 'bg-cave-950/20' : 'bg-alert text-cave-50'
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      </ViewNavigation>
      </div>

      {subTab === 'hops' && <>
        <Suspense fallback={<div role="status" className="py-3 text-sm text-cave-400">Chargement de l’index houblon…</div>}><HopIndexPanel createRequest={createRequest} onNotice={onSuccessMessage} /></Suspense>
      </>}

      {subTab === 'stock' && (
        <>
        <details className="shrink-0 border-b border-cave-800">
          <summary className="flex min-h-touch cursor-pointer items-center justify-between gap-2 py-1.5 text-sm text-cave-50">
            <span className="font-semibold">Comparer une recette</span>
            <span className="min-w-0 text-right text-xs text-cave-400">{selectedRecipe?.name ?? 'Besoin prévu face au stock'}</span>
          </summary>
          <div className="space-y-2 pb-2">
            {recipes.length === 0
              ? <p className="text-xs text-cave-400">Aucune recette enregistrée.</p>
              : <Combobox
                  id="stock-recipe-comparison"
                  ariaLabel="Recette à comparer"
                  value={selectedRecipe?.id ?? ''}
                  onChange={setRecipeId}
                  options={recipes.map(recipe => ({
                    value: recipe.id,
                    label: recipe.name,
                    detail: [recipe.style, Number.isFinite(recipe.volumeL) ? formatLitres(recipe.volumeL) : ''].filter(Boolean).join(' · '),
                    keywords: recipe.style
                  }))}
                  placeholder="Choisir une recette…"
                  compact
                />}
            {selectedRecipe && <>
              <p className="text-xs leading-snug text-cave-400">
                Même règle que « À commander » : le manque compte aussi ce que les brassins planifiés et les autres recettes écrites prévoient déjà ; les consommations sont déjà retirées du stock. Commandes entrantes non suivies.
              </p>
              {recipeComparison.some(row => row.stockItem) && <div aria-label="Légende de la barre de stock" className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                <span className="text-water">Prévu ailleurs</span><span className="text-attention">Besoin prévu</span><span className="text-hop">Reste</span><span className="text-alert-strong">Manque</span>
              </div>}
              {recipeComparison.length === 0
                ? <p className="text-xs text-cave-400">Aucun ingrédient renseigné dans cette recette.</p>
                : <ul className="space-y-1.5">
                    {recipeComparison.map((comparison: RecipeStockComparison) => comparison.stockItem
                      ? <li key={comparison.key}>
                          <StockRow
                            item={comparison.stockItem}
                            batches={batches}
                            stockItems={allItems}
                            comparison={comparison}
                            onOpen={setSelected}
                            onToggleFavorite={item => StorageService.toggleFavorite('stockItem', item.ref)}
                          />
                        </li>
                      : <li key={comparison.key} className="border-b border-cave-800 py-1.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                            <span className="text-sm font-medium text-cave-50 break-words">{comparison.label}</span>
                            <span className="shrink-0 font-mono text-sm text-cave-200">{comparison.quantity === null || !comparison.unit ? 'Inconnu' : quantiteLue(comparison.quantity, comparison.unit)}</span>
                          </div>
                          <p className="text-xs text-attention">{comparison.issue}</p>
                        </li>)}
                  </ul>}
            </>}
          </div>
        </details>
        {vue === 'recompter'
          ? <>
            {/* En Recompter, les outils restent sous le doigt : collés en haut de la fenêtre pendant que les tuiles défilent. */}
            <div className="sticky top-0 z-10 bg-cave-950">{blocOutils}</div>
            <div className={`stock-outils ${mobile ? 'pb-16' : ''}`}>
              <RecompterStock items={allItems} retenus={retenus} infos={infos} aCommander={aCommanderParRef} mouvements={movements} filtre={filtre} onFiltre={setFiltre} filtreActif={!!filtre || !!recherche} onOuvrir={setSelected} onCompter={compter} />
            </div>
          </>
          : <div data-testid="stock-defile">
        <div ref={refHaut}>
        {blocOutils}
        {/* STK-COMMANDE-REPLIEE (19.11) : le bloc « à commander » vit replié en tête de Courses ; Articles s'ouvre sur le mur et la liste. */}
        <Suspense fallback={<div role="status" className="py-3 text-sm text-cave-400">Chargement du mur du stock…</div>}>
          <MurStock items={allItems} equipements={stocks.equipment} futs={stocks.kegs} onOpen={setSelected} onFiltre={(r) => setFiltre(r)} filtre={filtre === 'Malts' || filtre === 'Houblons' || filtre === 'Levures' ? filtre : null} retenus={refsRetenues} onglet={ongletMur} onOnglet={changerOngletMur} infos={infos}
            onCarte={toucherCarte} carteActive={estFamilleAutre(filtre) ? filtre : null} />
        </Suspense>
        </div>
        <EntityList
          className={mobile ? 'pb-16' : 'pb-10'}
          repartDuHaut={false}
          defileFenetre
          items={visibleItems}
          keyOf={(i) => i.ref}
          groupOf={groupeListe}
          groupOrder={groupesVisibles}
          groupesPlies={plies}
          renderGroupHeader={(nom, compte) => <EnteteRayon nom={nom} compte={compte} sur={totauxGroupes.get(nom)} tri={tri} onTri={setTri} plie={plies.has(nom)} onPli={() => basculerPli(nom)} resume={resumes.get(nom)} />}
          isFavorite={(i) => !!i.favorite}
          resetKey={tri}
          header={allItems.length > 0 && !autresStocks && <LigneTri tri={tri} onTri={setTri} />}
          emptyState={
            allItems.length > 0 ? <div className="py-6 text-center space-y-2" role="status">
              <p className="text-sm text-cave-200">Aucun article ne correspond</p>
              <p className="text-xs text-cave-400">{filtre === 'epingles' ? 'Touchez l’étoile d’un article pour le retrouver ici.' : filtre === 'manque' && aCommander.length === 0 ? 'Les besoins planifiés et les seuils sont couverts.' : 'Changez de filtre ou de recherche.'}</p>
              <Button size="sm" onClick={toutVoir}>Voir tous les articles</Button>
            </div> : <div className="py-6 text-center space-y-3">
              <p className="text-base text-cave-200">Aucun article en stock</p>
              <p className="text-sm text-cave-400 max-w-xs mx-auto leading-relaxed">
                Les articles se créent ici, ou automatiquement en enregistrant un achat.
              </p>
              <Button intent="primary" onClick={() => setCreating(true)}>
                Ajouter le premier article
              </Button>
            </div>
          }
          renderItem={(item) => (
            <StockRow stockItems={allItems}
              item={item}
              info={infos.get(item.ref)}
              cmd={aCommanderParRef.get(item.ref)}
              batches={batches}
              mouvementDit={mouvementDit(item)}
              onOpen={setSelected}
              onToggleFavorite={(i) => StorageService.toggleFavorite('stockItem', i.ref)}
            />
          )}
        />
          </div>}
        </>
      )}

      {subTab === 'courses' && (
        <div className={`space-y-2 ${mobile ? 'pb-20' : 'pb-4'}`}>
          {/* Le chiffre clé, son horizon et son histogramme (Pastille C), repliés en une ligne discrète : un toucher les déplie (19.11). */}
          <CommandeRepliee vue={vueH} horizon={horizon} onHorizon={setHorizon} onOuvrir={setSelected} manquent={comptesEtats.manque + comptesEtats.manquePlus} />
          {/* Vision du 19.11, n° 2 et 3 : la ligne repliée dit seule le compte (horizon, puis total) ; ici, le seul geste « Tout voir ». */}
          {aCommander.length > totalToOrder && (
            <p className="flex items-center px-1" data-testid="courses-horizon">
              <button type="button" className="min-h-[44px] px-2 text-sm font-semibold underline underline-offset-4 text-cave-50" onClick={() => setHorizon('tout')}>Tout voir</button>
            </p>
          )}
          {totalToOrder === 0 ? (
            aCommander.length === 0 && <p className="py-8 text-center text-sm text-cave-400 max-w-xs mx-auto leading-relaxed" role="status">
              Le stock couvre les brassins planifiés, les recettes écrites et les seuils minimums.
            </p>
          ) : (
            shoppingBySupplier.map(([supplier, list]) => (
              <section key={supplier} className="panel p-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="min-w-0 text-sm font-semibold text-cave-50 break-words">{supplier}</h3>
                  <Button intent="secondary" onClick={() => copyList(supplier, list)}>
                    {copiedSupplier === supplier ? (
                      <>
                        <Check className="w-4 h-4" /> Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copier
                      </>
                    )}
                  </Button>
                </div>

                <ul>
                  {list.map(({ item, missing, auMoins, sources }) => (
                    <li
                      key={item.ref}
                      className="flex items-baseline justify-between gap-2 py-1.5
                                 border-b border-cave-800 last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-cave-200 break-words">{item.name}</span>
                        {sources.length > 0 && <span data-stock-sources className="block text-xs text-cave-400 break-words">
                          {libellesSources(sources).join(' · ')}
                        </span>}
                      </span>
                      <span className="font-mono text-sm text-ebc-straw shrink-0">
                        {missing > 0 ? `${auMoins ? 'au moins ' : ''}${Units.format(missing, item.unit)}` : 'à définir'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}

      {subTab === 'futs' && <KegBoard kegs={stocks.kegs} batches={batches} clients={clients} className="flex-1"
        addOpen={addingKegs} onAddClose={() => setAddingKegs(false)} onMessage={onSuccessMessage} />}

      {subTab === 'materiel' && (
        /* m390-6 : barre opaque, avec l'ombre `shadow-lift` (voir BARRE_MATERIEL). */
        <nav aria-label="Vue du matériel" className={segMateriel === 'parc' ? BARRE_BASE : `${BARRE_MATERIEL} ${BARRE_SUR_DEFILEMENT}`}>
          {SEGMENTS_MATERIEL.map((seg) => {
            const libelle = seg === 'parc' ? 'Parc' : seg === 'avenir' ? 'À venir' : seg === 'carnets' ? 'Carnets' : 'Réalisés';
            const n = seg === 'avenir' ? segments.avenir : seg === 'carnets' ? segments.carnets : seg === 'realises' ? segments.realises : undefined;
            return (
              <button key={seg} type="button" onClick={() => setSegMateriel(seg)} aria-current={segMateriel === seg ? 'page' : undefined}
                className={`flex-1 min-w-fit px-2 min-h-touch rounded-control flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${segMateriel === seg ? 'bg-ebc-straw text-cave-950' : 'text-cave-400 hover:text-cave-50'}`}>
                <span>{libelle}</span>{n !== undefined && <span className="font-mono">{n}</span>}
              </button>
            );
          })}
        </nav>
      )}

      {subTab === 'materiel' && (segMateriel === 'avenir' || segMateriel === 'realises') && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <UpgradeWorkspace vue={segMateriel === 'avenir' ? 'future' : 'completed'} onVue={(v) => setSegMateriel(v === 'future' ? 'avenir' : 'realises')}
            createRequest={besoinDemande} onCreateRequestHandled={() => setBesoinDemande(null)}
            onOpenCarnet={(id) => { setSegMateriel('carnets'); setCarnetOuvert({ id, at: Date.now() }); }} />
        </div>
      )}

      {subTab === 'materiel' && segMateriel === 'carnets' && (
        <Suspense fallback={<div role="status" className="py-3 text-sm text-cave-400">Chargement des carnets…</div>}>
          <CarnetsVue className="min-h-0 flex-1" ouvrir={carnetOuvert} focusChamp={focusChamp}
            onVoirAVenir={() => setSegMateriel('avenir')} onVoirRealises={() => setSegMateriel('realises')} onMessage={onSuccessMessage} />
        </Suspense>
      )}

      {subTab === 'materiel' && segMateriel === 'parc' && (
        <div className={grandEcran ? 'mt mt-wide' : undefined}>
          <div className={grandEcran ? 'mt-gauche' : undefined}>
            <EquipmentList
              equipment={stocks.equipment}
              batches={batches}
              wide={grandEcran}
              selectedRef={grandEcran ? volet?.ref ?? null : null}
              onOpen={(item) => (grandEcran ? setPaneRef(item.ref) : setEquipmentSheet(item))}
              onWrite={ecrireMateriel}
              traite={traiteMateriel}
              onAdd={(item) => { StorageService.addEquipment(item); onSuccessMessage?.(`${item.name} ajouté.`); }}
              onBuy={() => setPurchasingEquipment(true)}
              onProjects={onOpenEquipmentProjects}
              className="flex-1"
            />
          </div>
          {grandEcran && volet && (
            <section className="mt-droite" aria-label={`Fiche : ${volet.name}`}>
              <EquipmentDetail
                key={volet.ref} item={volet} batches={batches} transactions={transactions as unknown as FinanceTransaction[]} today={aujourdhuiIso()} layout="pane"
                onChange={changerDepuisFiche}
                onClose={() => setPaneRef(null)}
                onPayMaintenance={(item) => setPayingMaintenance(item.ref)}
                onDelete={(item) => { StorageService.deleteEquipment(item.ref); setPaneRef(null); onSuccessMessage?.(`${item.name} supprimé.`); }}
              />
            </section>
          )}
        </div>
      )}

      {annulerMateriel && (
        <div className="mt mt-toast" role="status"><Check size={18} aria-hidden="true" /><span>{(() => { const [verbe, ...suite] = annulerMateriel.message.split(' · '); return suite.length ? <><b>{verbe}</b> · {suite.join(' · ')}</> : <b>{verbe}</b>; })()}</span><span className="flex-1" />
          <button type="button" onClick={() => { StorageService.updateEquipment(annulerMateriel.previous); setAnnulerMateriel(null); }}><Undo2 size={18} aria-hidden="true" />Annuler</button></div>
      )}

      {purchasingEquipment && <ExpenseSheet initialIntent="equipment" onClose={()=>setPurchasingEquipment(false)} onSaved={()=>onSuccessMessage?.("Achat et matériel enregistrés.")}/>}
      {payingMaintenance && <ExpenseSheet initialIntent="expense" existingEquipmentId={payingMaintenance} existingEquipmentName={nomPaiement} onClose={()=>setPayingMaintenance(null)} onSaved={()=>onSuccessMessage?.("Dépense enregistrée.")}/>}
      {/* Le matériel se modifie et se supprime : il n'était que consultable. */}
      <EquipmentSheet
        item={equipmentSheet}
        batches={batches}
        transactions={transactions as unknown as FinanceTransaction[]}
        today={aujourdhuiIso()}
        onClose={() => setEquipmentSheet(null)}
        onChange={changerDepuisFiche}
        onPayMaintenance={(item) => { setEquipmentSheet(null); setPayingMaintenance(item.ref); }}
        onSave={(item) => {
          const exists = stocks.equipment.some((e) => e.ref === item.ref);
          if (exists) StorageService.updateEquipment(item);
          else StorageService.addEquipment(item);
          onSuccessMessage?.(`${item.name} enregistré.`);
        }}
        onDelete={(item) => {
          StorageService.deleteEquipment(item.ref);
          onSuccessMessage?.(`${item.name} supprimé.`);
        }}
      />

      <StockDetailSheet stockItems={allItems}
        item={selected}
        batches={batches}
        recipeCheck={selectedRecipe && selected ? (() => {
          const comparison = recipeComparison.find(row => row.stockItem?.ref === selected.ref);
          return comparison ? { recipeName: selectedRecipe.name, comparison } : null;
        })() : null}
        onClose={() => setSelected(null)}
        recipes={savedRecipes}
        onSave={(item, base) => StorageService.saveStockItemFiche(typeOf(item), base, item)}
        onDelete={(item) => {
          const result = StorageService.deleteStockItem(typeOf(item), item.ref);
          if (!result.ok && result.refus) onSuccessMessage?.(result.refus);
        }}
        movements={movements}
        achats={achats}
        onCorrect={applyCorrection}
        onCommander={() => { setSelected(null); setSubTab('courses'); }}
        onOpenTransaction={onOpenTransaction}
        onOpenBatch={onOpenBatch}
        onToggleFavorite={(item) => {
          StorageService.toggleFavorite('stockItem', item.ref);
        }}
      />

      <InventoryCorrectionSheet
        open={Boolean(correcting)}
        item={correcting}
        onClose={() => setCorrecting(null)}
        onConfirm={(qty, reason, note) =>
          correcting && applyCorrection(correcting, qty, reason, note)
        }
      />

      <NewStockItemSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

/**
 * Ordre des catégories proposées à la création : d'abord celles du déroulé d'un brassage (Malt, Houblon, Levure…), puis les autres
 * catégories déjà présentes en stock, triées. Sur téléphone la liste ne montre que 2 lignes sous l'en-tête de la feuille (PC-2 a) :
 * triée par ordre alphabétique, « Malt » était la 10e ligne, hors de vue, et le brasseur recevait « Divers ».
 */
export const ordonnerCategories = (connues: string[]): string[] => {
  const autres = Array.from(new Set(connues)).filter((c) => !GROUP_ORDER.includes(c)).sort((x, y) => x.localeCompare(y, 'fr'));
  return [...GROUP_ORDER, ...autres];
};

/** Création d'un article : le strict minimum, le reste se complète depuis la fiche. */
export const NewStockItemSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (draft: Partial<StockItem>) => void;
}> = ({ open, onClose, onCreate }) => {
  const [draft, setDraft] = useState<Partial<StockItem>>({
    unit: 'kg',
    currentStock: 0,
    minStock: 0
  });

  useEffect(() => {
    if (open) setDraft({ unit: 'kg', currentStock: 0, minStock: 0 });
  }, [open]);

  // Catégories et unités proposées d'après ce qui existe DÉJÀ en stock,
  // complétées par les catégories métier connues. Rien d'inventé.
  const categoryOptions = ordonnerCategories(Suggestions.knownCategories())
    .map((c) => ({ value: c, label: c }));
  const unitOptions = Suggestions.knownUnits().map((u) => ({ value: u, label: u }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nouvel article"
      className="sm:max-w-2xl sm:mx-auto"
      subtitle="La référence est attribuée automatiquement"
      footer={
        <div className="flex gap-2">
          <Button intent="secondary" full onClick={onClose}>
            Annuler
          </Button>
          <Button
            intent="primary"
            full
            disabled={!draft.name?.trim()}
            onClick={() => onCreate(draft)}
          >
            Créer l'article
          </Button>
        </div>
      }
    >
      <FormNav
        className="stock-form space-y-2"
        onSubmit={() => draft.name?.trim() && onCreate(draft)}
      >
        <Field label="Nom" htmlFor="new-stock-item">
          <TextInput
            id="new-stock-item"
            name="stock_creation_item_title"
            placeholder="Malt Pale Ale, Houblon Citra…"
            value={draft.name || ''}
            onChange={(name) => setDraft({ ...draft, name })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Catégorie" htmlFor="new-stock-category">
            <Combobox
              id="new-stock-category"
              ariaLabel="Catégorie"
              value={draft.category || ''}
              onChange={(category) => setDraft({ ...draft, category })}
              options={categoryOptions}
              placeholder="Malt, Houblon…"
              allowCreate
              onCreate={(category) => setDraft({ ...draft, category })}
              createLabel={(v) => `Nouvelle catégorie « ${v} »`}
            />
          </Field>

          <Field label="Unité" htmlFor="new-stock-unit">
            <Combobox
              id="new-stock-unit"
              ariaLabel="Unité"
              value={draft.unit || ''}
              onChange={(unit) => setDraft({ ...draft, unit })}
              options={unitOptions}
              placeholder="kg, g…"
              allowCreate
              onCreate={(unit) => setDraft({ ...draft, unit })}
              createLabel={(v) => `Nouvelle unité « ${v} »`}
            />
          </Field>
        </div>

        <p className="text-sm text-cave-400 leading-relaxed">
          Le stock démarre à zéro. Enregistrez un achat pour le remplir, ou un comptage depuis la fiche article.
        </p>
      </FormNav>
    </Sheet>
  );
};
