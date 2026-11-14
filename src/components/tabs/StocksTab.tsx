import React, { lazy, Suspense, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, ShoppingCart, Copy, Check, Boxes, Beer, Wrench, Hop } from 'lucide-react';
import { StockItem, EquipmentItem, KegItem, Batch, Recipe } from '../../types';
import { StorageService } from '../../services/storage';
import { latestBrewPrices } from '../../domain/finance/brewBudget';
import { Units } from '../../services/units';
import { articlesACommander, compareRecipeWithStock, type RecipeStockComparison } from '../../domain/stockLevel';
import { EnteteRayon } from '../../ui/stock/EnteteRayon';
import { dernierMouvementDit, mouvementsParRef } from '../../domain/stock/dernierMouvement';
import type { MouvementBrut } from '../../domain/stock/mouvementsArticle';
import { libelleSource, type SourceBesoin } from '../../domain/stock/disponibilite';
import { nextUniqueRef } from '../../services/refs';
import { EntityList } from '../../ui/EntityList';
import { StockRow } from '../../ui/StockRow';
import { StockDetailSheet } from '../../ui/StockDetailSheet';
import { KegBoard } from '../../ui/KegBoard';
import { EquipmentList } from '../../ui/EquipmentList';
import { Sheet } from '../../ui/Sheet';
import { Button } from '../ui/Button';
import { FormNav, Field, TextInput, inputClass } from '../../ui/FormNav';
import { Combobox } from '../../ui/Combobox';
import { Suggestions } from '../../services/suggestions';
import { InventoryCorrectionSheet } from '../../ui/InventoryCorrectionSheet';
import { INVENTORY_REASONS, InventoryReason } from '../../services/storage';
import { ExpenseSheet } from '../../ui/finance/ExpenseSheet';
import { EquipmentSheet } from '../../ui/EquipmentSheet';
import { KegSheet } from '../../ui/KegSheet';
import { useLiveSelection, useStorageValue } from '../../hooks/useLiveData';
import { ViewNavigation, MobileDetails } from '../../ui/ViewNavigation';
import { useMobileLayout } from '../../ui/useViewport';
import '../../ui/stocks.css';
import { formatLitres } from '../../domain/recipeMetrics';
import { quantiteLue } from '../../domain/stock/regles';
import { createSearch, runSearch } from '../../services/search';
import { rechercherStock } from '../../domain/stock/recherche';
import { infoLigne, compterEtats, trierArticles, resumeRayon, TRIS, type TriListe } from '../../domain/stock/liste';
import { GROUPES_LISTE, groupeListe, lignesRetenues, texteFiltre, type FiltreListe } from '../../domain/stock/listeFiltres';
import { BasculeVue, Recherche, Pastilles, LigneFiltre, LigneTri, type VueStock } from '../../ui/stock/OutilsStock';
import { RecompterStock } from '../../ui/stock/RecompterStock';

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

interface StocksTabProps {
  stocks: {
    rawMaterials: StockItem[];
    cleaning: StockItem[];
    equipment: EquipmentItem[];
    kegs: KegItem[];
  };
  batches: Batch[];
  /** Remonte le sous-onglet courant : le bouton d'action en dépend. */
  onSubTabChange?: (sub: string) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
  /** Article à ouvrir directement, demandé depuis un autre écran (une facture). */
  openItemRequest?: { ref: string; at: number } | null;
  onOpenItemRequestHandled?: () => void;
  onSuccessMessage?: (msg: string) => void;
  onOpenEquipmentProjects?: () => void;
  /** Ouvre le parcours catalogue houblon V5.5 de l’application. */
  onOpenHopV55?: () => void;
  /** Fiche d'article : « voir la facture » et « voir le bilan » (absents : les lignes ne sont pas cliquables). */
  onOpenTransaction?: (id: string) => void;
  onOpenBatch?: (id: string) => void;
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
  onSubTabChange,
  createRequest,
  openItemRequest,
  onOpenItemRequestHandled,
  onSuccessMessage,
  onOpenEquipmentProjects,
  onOpenHopV55,
  onOpenTransaction,
  onOpenBatch
}) => {
  const [subTab, setSubTab] = useState<SubTab>(() =>
    StorageService.getUiState<SubTab>('stocks_subtab', 'stock')
  );
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
  // Le conteneur qui défile en Étagère : la liste virtualisée s'y appuie (customScrollParent).
  const [parentListe, setParentListe] = useState<HTMLDivElement | null>(null);
  const setVue = (v: VueStock) => { setVueEtat(v); StorageService.setUiState('stock_vue', v); };

  /*
   * Matériel et fûts : ils n'étaient consultables qu'en lecture. Une fiche
   * ouverte à `null` ferme la feuille ; une fiche vide vaut création.
   */
  const [equipmentSheet, setEquipmentSheet] = useLiveSelection(stocks.equipment, 'ref');
  const [purchasingEquipment, setPurchasingEquipment] = useState(false);
  const [kegSheet, setKegSheet] = useLiveSelection(stocks.kegs, 'id');

  const blankEquipment = (): EquipmentItem => ({
    id: `EQ-${Date.now()}`,
    ref: nextUniqueRef('EQ', stocks.equipment.map((e) => e.ref)),
    name: '',
    category: 'Brassage',
    state: 'Neuf'
  });

  const blankKeg = (): KegItem => ({
    id: nextUniqueRef('F', stocks.kegs.map((k) => k.id)),
    capacityL: 30,
    state: 'propre'
  });

  const setCreatingEquipment = (on: boolean) => setEquipmentSheet(on ? blankEquipment() : null);
  const setCreatingKeg = (on: boolean) => setKegSheet(on ? blankKeg() : null);

  /** Toute la liste de courses, tous fournisseurs confondus. */
  const copyEverything = () => {
    if (shoppingBySupplier.length === 0) {
      onSuccessMessage?.('Rien à commander : le stock couvre les brassins planifiés et les recettes écrites.');
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
  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [subTab, onSubTabChange]);

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
        setCreatingKeg(true);
        break;
      case 'newEquipment':
        setPurchasingEquipment(true);
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
  const criticalCount = aCommander.length;

  /**
   * Liste de courses : ce qui manque pour couvrir les brassins planifiés,
   * regroupé par fournisseur habituel. Entièrement calculé, jamais saisi.
   */
  const shoppingBySupplier = useMemo(() => {
    const map = new Map<string, Array<{ item: StockItem; missing: number; auMoins: boolean; sources: SourceBesoin[] }>>();

    aCommander.forEach(({ item, missing: toOrder, auMoins, sources }) => {
      const supplier = item.supplier?.trim() || 'Fournisseur à préciser';
      const arr = map.get(supplier) ?? [];
      arr.push({ item, missing: toOrder, auMoins, sources });
      map.set(supplier, arr);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [aCommander]);

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
  const visibleItems = useMemo(() => trierArticles(retenus, tri, infos), [retenus, tri, infos]);
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
    { id: 'stock', label: 'Articles', Icon: Boxes, badge: criticalCount },
    { id: 'courses', label: 'Courses', Icon: ShoppingCart, badge: totalToOrder },
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
    const sc = parentListe; const el = refPanneau.current;
    if (!sc || !el) return;
    const cible = sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 4;
    if (sc.scrollTop > cible) sc.scrollTop = Math.max(0, cible);
  }, [filtre, q]);
  // La liste virtualisée mesure sa distance au haut du bloc : quand les outils ou le mur changent de hauteur (onglet Autres stocks plus bas que le mur, légende), on le lui redit (verdict n° 5).
  useEffect(() => {
    const haut = refHaut.current; const sc = parentListe;
    if (!haut || !sc || typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(() => sc.dispatchEvent(new Event('scroll')));
    o.observe(haut);
    return () => o.disconnect();
  }, [parentListe]);
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
    <div className={`stocks-screen flex flex-col h-[calc(100dvh-8.5rem)] pt-1 gap-1`}>
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
        {onOpenHopV55 && <section aria-label="Catalogue houblon V5.5" className="shrink-0">
          {/* BR-109 : une ligne, un bouton. Trois lignes de texte collées sous la barre prenaient 22 % de l'écran à 390. */}
          <Button intent="secondary" size="sm" full onClick={onOpenHopV55}>Explorer les houblons dans V5.5</Button>
        </section>}
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
            {blocOutils}
            <div className={`stock-outils min-h-0 flex-1 overflow-y-auto ${mobile ? 'pb-16' : ''}`}>
              <RecompterStock items={allItems} retenus={retenus} infos={infos} aCommander={aCommanderParRef} mouvements={movements} filtre={filtre} onFiltre={setFiltre} filtreActif={!!filtre || !!recherche} onOuvrir={setSelected} onCompter={compter} />
            </div>
          </>
          : <div ref={setParentListe} className="min-h-0 flex-1 overflow-y-auto" data-testid="stock-defile">
        <div ref={refHaut}>
        {blocOutils}
        <Suspense fallback={<div role="status" className="py-3 text-sm text-cave-400">Chargement du mur du stock…</div>}>
          <MurStock items={allItems} equipements={stocks.equipment} futs={stocks.kegs} onOpen={setSelected} onFiltre={(r) => setFiltre(r)} filtre={filtre === 'Malts' || filtre === 'Houblons' || filtre === 'Levures' ? filtre : null} retenus={refsRetenues} onglet={ongletMur} onOnglet={setOngletMur} infos={infos} />
        </Suspense>
        </div>
        <EntityList
          className={mobile ? 'pb-16' : ''}
          repartDuHaut={false}
          scrollParent={parentListe}
          items={visibleItems}
          keyOf={(i) => i.ref}
          groupOf={groupeListe}
          groupOrder={GROUPES_LISTE}
          groupesPlies={plies}
          renderGroupHeader={(nom, compte) => <EnteteRayon nom={nom} compte={compte} sur={totauxGroupes.get(nom)} tri={tri} onTri={setTri} plie={plies.has(nom)} onPli={() => basculerPli(nom)} resume={resumes.get(nom)} />}
          isFavorite={(i) => !!i.favorite}
          resetKey={tri}
          header={allItems.length > 0 && <LigneTri tri={tri} onTri={setTri} />}
          emptyState={
            allItems.length > 0 ? <div className="py-6 text-center space-y-2" role="status">
              <p className="text-sm text-cave-200">Aucun article ne correspond</p>
              <p className="text-xs text-cave-400">{filtre === 'epingles' ? 'Touchez l’étoile d’un article pour le retrouver ici.' : filtre === 'manque' && totalToOrder === 0 ? 'Les besoins planifiés et les seuils sont couverts.' : 'Changez de filtre ou de recherche.'}</p>
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
        <div className="flex-1 overflow-y-auto space-y-2 pb-4">
          {totalToOrder === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-base text-cave-200">Rien à commander</p>
              <p className="text-sm text-cave-400 max-w-xs mx-auto leading-relaxed">
                Le stock couvre les brassins planifiés, les recettes écrites et les seuils minimums.
              </p>
            </div>
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
                          {sources.map(libelleSource).join(' · ')}
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

      {subTab === 'futs' && <KegBoard kegs={stocks.kegs} batches={batches} className="flex-1"
        toolbarAction={<Button intent="secondary" aria-label="Ajouter un fût" onClick={() => setCreatingKeg(true)} icon={<Plus className="w-4 h-4" />}><span className="hidden sm:inline">Ajouter un fût</span></Button>} />}

      {subTab === 'materiel' && (
        <><MobileDetails title="Actions du matériel"><div className="flex flex-wrap gap-1"><Button intent="primary" size="sm" onClick={()=>setPurchasingEquipment(true)}>Enregistrer un achat</Button><Button intent="secondary" size="sm" onClick={()=>setCreatingEquipment(true)}>Matériel déjà possédé</Button>{onOpenEquipmentProjects&&<Button intent="ghost" size="sm" onClick={onOpenEquipmentProjects} icon={<Wrench size={14}/>}>Projets d’équipement</Button>}</div></MobileDetails><EquipmentList
          equipment={stocks.equipment}
          onOpen={setEquipmentSheet}
          className="flex-1"
        /></>
      )}

      {purchasingEquipment && <ExpenseSheet initialIntent="equipment" onClose={()=>setPurchasingEquipment(false)} onSaved={()=>onSuccessMessage?.("Achat et matériel enregistrés.")}/>}
      {/* Le matériel se modifie et se supprime : il n'était que consultable. */}
      <EquipmentSheet
        item={equipmentSheet}
        onClose={() => setEquipmentSheet(null)}
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

      <KegSheet
        keg={kegSheet}
        batches={batches}
        kegs={stocks.kegs}
        onClose={() => setKegSheet(null)}
        onSave={(keg) => {
          const exists = stocks.kegs.some((k) => k.id === keg.id);
          if (exists) StorageService.updateKeg(keg);
          else StorageService.addKeg(keg);
          onSuccessMessage?.(`Fût ${keg.id} enregistré.`);
        }}
        onDelete={(keg) => {
          StorageService.deleteKeg(keg.id);
          onSuccessMessage?.(`Fût ${keg.id} supprimé.`);
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
        onOpenHops={onOpenHopV55}
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
