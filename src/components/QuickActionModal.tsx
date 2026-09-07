import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  UploadCloud, 
  Zap, 
  TrendingUp, 
  Beer, 
  Boxes, 
  Check, 
  Sparkles, 
  FileText, 
  ChevronRight,
  ArrowLeft,
  Package,
  Plus,
  Minus,
  RefreshCw,
  FolderTree,
  Cloud,
  Download,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../services/storage';
import { nextUniqueRef } from '../services/refs';
import { GeminiScannerService, ScannedInvoiceResult } from '../services/geminiScanner';
import { AiTier, TIER_LABEL, TIER_HINT } from '../services/aiClient';
import { DriveService } from '../services/driveService';
import { GoogleDriveService } from '../services/googleDriveService';
import { ReceiptService } from '../services/receiptService';
import { CloudConfigModal } from './CloudConfigModal';
import { FinanceCategory, Transaction, Recipe, StockItem } from '../types';
import { Units } from '../services/units';
import { nextBatchId } from '../services/refs';
import { captureSnapshot } from '../domain/recipeSnapshot';
import { BrewingMath } from '../services/brewingMath';
import { Combobox, ComboOption } from '../ui/Combobox';
import { QuantityStepper } from '../ui/QuantityStepper';
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { useDensity } from '../ui/useViewport';
import { NumericField } from '../ui/NumericField';
import { MoneyField, splitTva } from '../ui/MoneyField';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  geminiApiKey?: string;
  onSuccessMessage?: (msg: string) => void;
  onOpenCreateBatch?: () => void;
}

type ModalScreen = 'menu' | 'scan' | 'matching' | 'quick-expense' | 'quick-sale' | 'brew-batch';

interface MatchingRow {
  extractedName: string;
  extractedQty: number;
  extractedUnit: string;
  action: 'match' | 'new' | 'skip';
  matchedItemRef: string;
  matchedItemType: 'rawMaterials' | 'cleaning';
  finalQty: number;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  recipes,
  geminiApiKey,
  onSuccessMessage,
  onOpenCreateBatch
}) => {
  const [screen, setScreen] = useState<ModalScreen>('menu');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedInvoiceResult | null>(null);
  /** Message d'échec du scan, affiché au-dessus de la saisie manuelle. */
  const [scanError, setScanError] = useState<string | null>(null);
  /** Niveau d'IA employé pour la lecture du justificatif. */
  const [aiTier, setAiTier] = useState<AiTier>('fast');
  /** Modèle réellement utilisé, affiché pour garder le résultat traçable. */
  const [scanModel, setScanModel] = useState<string | null>(null);
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');

  // Interactive Matching Rows
  const [matchingRows, setMatchingRows] = useState<MatchingRow[]>([]);

  // Manual Stock Impact for Expenses (Point Clé de Gaëtan)
  const [manualStockImpacts, setManualStockImpacts] = useState<Array<{
    ref: string;
    type: 'rawMaterials' | 'cleaning';
    name: string;
    qty: number;
    unit: string;
  }>>([]);

  // Quick Expense Form State
  /*
   * ⚠️ On saisit le TTC — c'est le seul montant lisible sur un ticket de
   * caisse. Le HT en est déduit à l'enregistrement. L'inverse obligeait à
   * calculer de tête devant la caisse, et les écarts d'arrondi ne se
   * découvraient qu'au bouclement.
   */
  const [amountTTC, setAmountTTC] = useState<number>(0);
  const [category, setCategory] = useState<FinanceCategory>('brassage');
  const [subcategory, setSubcategory] = useState<string>('Malt');
  const [tvaRate, setTvaRate] = useState<number>(0.026);
  const [description, setDescription] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');

  // Quick Sale State (Point Clé Justificatifs de Vente & Quittance)
  const [saleAmount, setSaleAmount] = useState<number>(0);
  const [saleClient, setSaleClient] = useState<string>('Restaurant du Lac');
  const [saleBeer, setSaleBeer] = useState<string>('Milk Stout');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'TWINT' | 'Espèces' | 'Virement' | 'Facture'>('TWINT');
  const [saleProofUrl, setSaleProofUrl] = useState<string | null>(null);
  const [saleProofFileName, setSaleProofFileName] = useState<string>('');

  // Cloud & AI Config Modal
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);

  // Brew Batch State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || 'REC-001');
  const [batchVolumeL, setBatchVolumeL] = useState<number>(30);
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  /*
   * Tant que la brasserie n'est pas assujettie, il n'y a aucune TVA à ventiler
   * ni à récupérer : le TTC saisi EST le HT enregistré.
   */
  const isTvaRegistered = StorageService.getConfig().fiscal.isTvaRegistered;
  /* Clavier ouvert, l'en-tête et les marges cèdent la place aux champs. */
  const tight = useDensity() === 'tight';
  const allStocks = StorageService.getStocks();
  const allAvailableItems = [
    ...allStocks.rawMaterials.map((i) => ({ ...i, type: 'rawMaterials' as const })),
    ...allStocks.cleaning.map((i) => ({ ...i, type: 'cleaning' as const }))
  ];

  /**
   * Options d'articles pour l'autocomplétion, avec le stock affiché.
   *
   * ⚠️ Ce que ça remplace : deux `<select>` natifs déroulant les 33 articles
   * du catalogue, sans recherche. Gaëtan : « pour rentrer les stock depuis un
   * nouvel achat c'est infernal, liste de toutes les marchandises plus pas la
   * possibilité d'en ajouter des nouvelles. »
   */
  const itemOptions: ComboOption[] = allAvailableItems.map((st) => ({
    value: st.ref,
    label: st.name,
    detail: `${st.category} · ${Units.format(st.currentStock, st.unit)} en stock`,
    favorite: st.favorite
  }));

  /**
   * Crée l'article à la volée, à stock ZÉRO — la réception qu'on est en train
   * de saisir viendra l'alimenter juste après. Lui donner d'emblée la quantité
   * reçue la compterait deux fois.
   */
  const createItemInline = (name: string, isCleaning = false) => {
    const ref = nextUniqueRef(
      isCleaning ? 'NT' : 'MP',
      allAvailableItems.map((i) => i.ref)
    );
    const item: StockItem = {
      id: `RM-${Date.now()}`,
      ref,
      name: name.trim(),
      category: isCleaning ? 'Consommable' : 'Divers',
      unit: 'kg',
      currentStock: 0,
      minStock: 0,
      reorder: false
    };
    StorageService.addStockItem(isCleaning ? 'cleaning' : 'rawMaterials', item);
    return item;
  };

  if (!isOpen) return null;

  const resetAndClose = () => {
    setScreen('menu');
    setIsScanning(false);
    setScanResult(null);
    setScanError(null);
    setProofDataUrl(null);
    setMatchingRows([]);
    setAmountTTC(0);
    setDescription('');
    setVendor('');
    onClose();
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#F59E0B', '#D97706', '#10B981']
      });
    } catch {
      // ignore
    }
  };

  /**
   * Propose l'article de stock le plus proche du libellé lu sur la facture.
   *
   * Renvoie `bestItem: null` quand rien ne correspond — surtout PAS le premier
   * article de la liste : le rapprochement s'affichait alors comme validé et un
   * simple tap créditait un article au hasard.
   *
   * Les mots trop génériques ne comptent pas : « malt » seul ne doit pas
   * rapprocher « Malt Pale Ale » de n'importe quel malt du stock.
   */
  const findBestStockMatch = (extractedName: string) => {
    const GENERIC = new Set(['malt', 'houblon', 'levure', 'hopfen', 'malz', 'hefe', 'bio', 'kg', 'sachet']);
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    const queryTokens = norm(extractedName)
      .split(/[\s,.\-/]+/)
      .filter((t) => t.length > 2);
    const distinctiveTokens = queryTokens.filter((t) => !GENERIC.has(t));

    let bestItem: (typeof allAvailableItems)[number] | null = null;
    let highestScore = 0;

    allAvailableItems.forEach((item) => {
      const itemText = norm(`${item.name} ${item.ref} ${item.category}`);
      // Un mot distinctif vaut 2 points, un mot générique 0.5 : un rapprochement
      // ne peut pas reposer uniquement sur des mots génériques.
      let score = 0;
      queryTokens.forEach((tok) => {
        if (itemText.includes(tok)) score += GENERIC.has(tok) ? 0.5 : 2;
      });
      if (score > highestScore) {
        highestScore = score;
        bestItem = item;
      }
    });

    // Il faut au moins un mot distinctif en commun pour parler de correspondance.
    const hasMatch = highestScore >= 2 && distinctiveTokens.length > 0;
    return { bestItem: hasMatch ? bestItem : null, hasMatch };
  };

  // Handle Document Upload & Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);
    setScanModel(null);
    setProofFileName(file.name);

    try {
      const outcome = await GeminiScannerService.scanDocument(file, aiTier);
      // Le justificatif est conservé DANS TOUS LES CAS, même si la lecture rate.
      setProofDataUrl(outcome.proofDataUrl);

      if (!outcome.ok || !outcome.result) {
        // Échec assumé : on n'invente aucun montant, on bascule sur une saisie
        // manuelle VIDE avec le justificatif déjà attaché.
        setScanResult(null);
        setScanError(outcome.error || "Le document n'a pas pu être analysé.");
        setScreen('quick-expense');
        return;
      }

      const result = outcome.result;
      setScanResult(result);
      setScanModel(outcome.model ?? null);

      // Pre-fill finance fields
      setAmountTTC(
        result.amountHT ? Math.round(result.amountHT * (1 + result.tvaRate) * 100) / 100 : 0
      );
      setTvaRate(result.tvaRate);
      setCategory(result.category);
      setSubcategory(result.subcategory);
      setVendor(result.vendor);
      setDescription(result.description);

      // Initialize Interactive Matching rows
      if (result.items && result.items.length > 0) {
        const rows: MatchingRow[] = result.items.map((it) => {
          const { bestItem, hasMatch } = findBestStockMatch(it.name);
          const isService = it.name.toLowerCase().includes('porto') || it.name.toLowerCase().includes('verpackung') || it.name.toLowerCase().includes('frais de port');
          return {
            extractedName: it.name,
            extractedQty: it.quantity || 1,
            extractedUnit: it.unit || (bestItem ? bestItem.unit : 'kg'),
            // Sans correspondance trouvée, on propose de CRÉER l'article plutôt
            // que de pointer un article au hasard qu'un tap validerait par erreur.
            action: isService ? 'skip' : (hasMatch ? 'match' : 'new'),
            matchedItemRef: hasMatch && bestItem ? bestItem.ref : '',
            matchedItemType: hasMatch && bestItem ? bestItem.type : 'rawMaterials',
            finalQty: it.quantity || 1
          };
        });
        setMatchingRows(rows);
        setScreen('matching');
      } else {
        // Aucun article détecté : on va directement à l'écriture comptable.
        setScreen('quick-expense');
      }
    } catch (err: any) {
      console.error('[Scan]', err);
      setScanResult(null);
      setScanError(err?.message || "Le document n'a pas pu être analysé.");
      setScreen('quick-expense');
    } finally {
      setIsScanning(false);
      // Permet de re-sélectionner le même fichier après un échec.
      e.target.value = '';
    }
  };

  // Save Document with Validated Stock Matching
  const handleFinalizeMatchedExpense = () => {
    // `splitTva` porte l'unique règle d'arrondi de l'application.
    const { ht, tva } = splitTva(amountTTC, isTvaRegistered ? tvaRate : 0);
    const ttc = amountTTC;
    const today = new Date().toLocaleDateString('fr-CH');

    const stockImpact: Transaction['stockImpact'] = [];
    // Références créées pendant CETTE validation : le cache Firestore n'étant pas
    // encore rafraîchi, il faut s'en souvenir pour ne pas les réattribuer.
    const createdRefs: string[] = [];

    // 1. Process each matching row
    matchingRows.forEach((row) => {
      if (row.action === 'match') {
        const target = allAvailableItems.find((i) => i.ref === row.matchedItemRef);
        if (target) {
          const prevStock = target.currentStock;
          const newStock = Math.round((prevStock + row.finalQty) * 100) / 100;
          StorageService.updateStockItem(target.type, {
            ...target,
            currentStock: newStock,
            reorder: newStock <= target.minStock
          });
          stockImpact.push({
            itemRef: target.ref,
            itemType: target.type,
            itemName: target.name,
            addedQty: row.finalQty,
            unit: target.unit,
            previousStock: prevStock,
            newStock
          });
        }
      } else if (row.action === 'new') {
        const isCleaning = category.includes('nettoyage');
        const type = isCleaning ? 'cleaning' : 'rawMaterials';
        // Référence séquentielle : une collision écraserait un article du stock.
        // On recalcule à chaque ligne pour que deux nouveaux articles d'une même
        // facture ne reçoivent pas la même référence.
        const liveStocks = StorageService.getStocks();
        const newRef = nextUniqueRef(isCleaning ? 'NT' : 'MP', [
          ...liveStocks.rawMaterials.map((i) => i.ref),
          ...liveStocks.cleaning.map((i) => i.ref),
          ...createdRefs
        ]);
        createdRefs.push(newRef);
        const newItem: StockItem = {
          id: `STOCK-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ref: newRef,
          name: row.extractedName,
          category: subcategory || 'Malt',
          unit: row.extractedUnit || 'kg',
          currentStock: row.finalQty,
          minStock: 1,
          reorder: false,
          supplier: vendor
        };
        StorageService.addStockItem(type, newItem);
        stockImpact.push({
          itemRef: newRef,
          itemType: type,
          itemName: row.extractedName,
          addedQty: row.finalQty,
          unit: row.extractedUnit || 'kg',
          previousStock: 0,
          newStock: row.finalQty
        });
      }
    });

    // 1.b Process Manual Stock Impacts (if entered manually)
    manualStockImpacts.forEach((imp) => {
      const target = allAvailableItems.find((i) => i.ref === imp.ref);
      if (target) {
        const prevStock = target.currentStock;
        const newStock = Math.round((prevStock + imp.qty) * 100) / 100;
        StorageService.updateStockItem(target.type, {
          ...target,
          currentStock: newStock,
          reorder: newStock <= target.minStock
        });
        stockImpact.push({
          itemRef: target.ref,
          itemType: target.type,
          itemName: target.name,
          addedQty: imp.qty,
          unit: target.unit,
          previousStock: prevStock,
          newStock
        });
      }
    });

    // 2. Create Transaction with Google Drive path & stock impact snapshot
    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      date: scanResult?.date || today,
      description: description || `Facture ${vendor || 'divers'}`,
      amountHT: ht,
      tvaRate,
      tvaAmount: tva,
      amountTTC: ttc,
      category,
      subcategory: subcategory || 'Divers',
      proofNotes: vendor ? `Fournisseur: ${vendor}` : '',
      proofUrl: proofDataUrl || undefined,
      proofFileName: proofFileName || undefined,
      syncedToDrive: true,
      stockImpact: stockImpact.length > 0 ? stockImpact : undefined
    };

    StorageService.addTransaction(newTx);
    triggerConfetti();

    // 3. Real Google Drive Upload (if connected)
    if (proofDataUrl) {
      GoogleDriveService.uploadInvoiceFile(
        newTx, 
        proofDataUrl, 
        proofFileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
      );
    }

    const drivePath = DriveService.generateDrivePath(newTx);
    if (onSuccessMessage) {
      onSuccessMessage(
        `Facture de ${ttc.toFixed(2)} CHF enregistrée (Stock mis à jour) ! Drive : ${drivePath}`
      );
    }
    resetAndClose();
  };

  // Quick Sale with Official Receipt & Proof (Pillar 3 & 4)
  const handleSaveSale = () => {
    const ttc = saleAmount;
    if (ttc <= 0) return;
    const tvaRate = 0.026;
    const cfg = StorageService.getConfig();

    const saleTx = ReceiptService.createSaleTransactionWithReceipt(
      {
        clientName: saleClient || 'Client Comptoir',
        beerName: saleBeer || 'Bière artisanale',
        amountTTC: ttc,
        tvaRate,
        paymentMethod: salePaymentMethod,
        notes: `Règlement : ${salePaymentMethod}`
      },
      cfg,
      saleProofUrl || undefined
    );

    StorageService.addTransaction(saleTx);
    triggerConfetti();

    // Upload to Google Drive if connected
    if (saleTx.proofUrl) {
      GoogleDriveService.uploadInvoiceFile(
        saleTx, 
        saleTx.proofUrl, 
        saleTx.proofType || 'application/pdf'
      );
    }

    if (onSuccessMessage) {
      onSuccessMessage(`Vente de ${ttc.toFixed(2)} CHF enregistrée avec Quittance officielle !`);
    }
    resetAndClose();
  };

  const handleDownloadSaleReceipt = () => {
    const ttc = saleAmount;
    if (ttc <= 0) return;
    const cfg = StorageService.getConfig();
    ReceiptService.downloadReceipt(
      {
        clientName: saleClient || 'Client Comptoir',
        beerName: saleBeer || 'Bière artisanale',
        amountTTC: ttc,
        tvaRate: 0.026,
        paymentMethod: salePaymentMethod,
        notes: `Règlement : ${salePaymentMethod}`
      },
      cfg
    );
  };

  // Launch Brew Batch
  const handleLaunchBrew = () => {
    const selected = recipes.find((r) => r.id === selectedRecipeId);
    if (!selected || !(batchVolumeL > 0)) return;
    const cfg = StorageService.getConfig();
    const profile = cfg.brewhouses.find(b => b.id === cfg.activeBrewhouseId) ?? cfg.brewhouses[0];
    const recipe = batchVolumeL === selected.volumeL ? selected : BrewingMath.scaleRecipe(selected, batchVolumeL, profile, profile).scaledRecipe;

    const newBatchId = nextBatchId(StorageService.getBatches().map(b => b.id));

    if (autoDeductStock) {
      StorageService.brewRecipeAndDeductStocks(recipe, newBatchId);
    } else {
      const today = new Date().toLocaleDateString('fr-CH');
      StorageService.addBatch({
        id: newBatchId,
        brewDate: today,
        name: recipe.name,
        style: recipe.style,
        volumeL: batchVolumeL,
        status: 'planifie',
        recipeRef: recipe.id,
        recipeSnapshot: captureSnapshot(recipe)
      });
    }

    triggerConfetti();
    if (onSuccessMessage) {
      onSuccessMessage(`Brassin ${newBatchId} (${recipe.name} ${batchVolumeL}L) lancé avec succès ! 🍺`);
    }
    resetAndClose();
  };

  return (
    <>
      <ModalShell open={isOpen} onClose={resetAndClose} size="lg">
        {/* En-tête : réduit au titre et aux deux boutons quand le clavier
            occupe l'écran — c'est 28 px rendus à la saisie. */}
        <div
          className={`shrink-0 flex items-center justify-between border-b border-cave-800 bg-cave-900/60 ${
            tight ? 'px-2 py-1.5' : 'px-5 py-4'
          }`}
        >
          <div className="flex items-center space-x-2">
            {screen !== 'menu' && (
              <button
                onClick={() => setScreen('menu')}
                className="p-3 text-cave-400 hover:text-cave-50 mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Sparkles className="w-5 h-5 text-ebc-straw" />
            <h3 className="font-bold text-base text-cave-50">
              {screen === 'menu' && 'Action Express'}
              {screen === 'scan' && 'Scanner une Facture'}
              {screen === 'matching' && 'Matching & Contrôle Stocks'}
              {screen === 'quick-expense' && 'Saisie Dépense'}
              {screen === 'quick-sale' && 'Saisie Vente'}
              {screen === 'brew-batch' && 'Lancer un Brassin'}
            </h3>
          </div>
          <button
            onClick={resetAndClose}
            className="p-3 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input for Document Scan */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/*
          `scroll-pb-24` réserve la place de la rangée d'actions collée en bas :
          sans elle, le navigateur amène un champ « en vue » juste dessous.
        */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pb-24 ${
            tight ? 'p-3 space-y-2' : 'p-5 space-y-4'
          }`}
        >
          {/* SCREEN 1: MENU */}
          {screen === 'menu' && (
            <div className="space-y-3">
              {/* Option 1 : lire un justificatif */}
              <div className="rounded-panel border border-ebc-straw/40 bg-cave-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 flex items-center gap-3.5 text-left hover:bg-cave-850 transition-colors"
                >
                  <span className="w-touch h-touch rounded-control bg-ebc-straw text-cave-950 flex items-center justify-center shrink-0">
                    <Camera className="w-6 h-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-cave-50">
                      Photographier une facture
                    </span>
                    <span className="block text-sm text-cave-400">
                      L'IA en extrait le fournisseur, les montants et les articles
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-ebc-straw shrink-0" />
                </button>

                {/* Niveau d'IA : un choix d'usage, pas un réglage technique. */}
                <div className="px-4 pb-3 pt-1 border-t border-cave-800 flex items-center gap-2">
                  {(['fast', 'max'] as AiTier[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTier(t)}
                      aria-pressed={aiTier === t}
                      className={`flex-1 min-h-touch px-3 rounded-control border text-sm transition-colors ${
                        aiTier === t
                          ? 'bg-ebc-straw/15 border-ebc-straw text-ebc-straw'
                          : 'bg-cave-950 border-cave-700 text-cave-400 hover:text-cave-200'
                      }`}
                    >
                      <span className="block font-semibold">{TIER_LABEL[t]}</span>
                      <span className="block text-footnote opacity-80">{TIER_HINT[t]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cloud & AI Status Bar */}
              <div 
                onClick={() => setIsCloudConfigOpen(true)}
                className="p-3 rounded-2xl bg-cave-950/70 border border-cave-800 hover:border-ebc-straw/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-ebc-straw/10 flex items-center justify-center text-ebc-straw">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm text-cave-200 font-bold block">
                      IA hébergée sur le serveur de la brasserie
                    </span>
                    <span className="text-footnote text-cave-400">
                      {GoogleDriveService.isConnected() ? '📁 Google Drive Cloud Activé' : '📁 Drive : Mode Dossier Local'}
                    </span>
                  </div>
                </div>
                <span className="text-sm bg-cave-850 group-hover:bg-ebc-straw group-hover:text-cave-950 text-cave-200 px-2.5 py-1 rounded-xl font-bold transition">
                  Configurer ⚙️
                </span>
              </div>

              {/* Option 2: Dépense manuelle */}
              <div
                onClick={() => setScreen('quick-expense')}
                className="p-3.5 rounded-2xl bg-cave-850/40 border border-cave-800 hover:border-cave-700 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cave-850 text-cave-200 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-ebc-straw" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-cave-200">Dépense Express (sans justificatif)</h4>
                    <p className="text-footnote text-cave-400">Saisie en 10 secondes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-cave-500" />
              </div>

              {/* Option 3: Lancer Brassin */}
              <div
                onClick={() => {
                  if (onOpenCreateBatch) {
                    onClose();
                    onOpenCreateBatch();
                  } else {
                    setScreen('brew-batch');
                  }
                }}
                className="p-3.5 rounded-2xl bg-cave-850/40 border border-cave-800 hover:border-cave-700 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cave-850 text-cave-200 flex items-center justify-center">
                    <Beer className="w-4 h-4 text-ebc-straw" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-cave-200">Lancer un Brassin</h4>
                    <p className="text-footnote text-cave-400">Déduction automatique des malts & houblons</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-cave-500" />
              </div>

              {/* Option 4: Vente Rapide */}
              <div
                onClick={() => setScreen('quick-sale')}
                className="p-3.5 rounded-2xl bg-cave-850/40 border border-cave-800 hover:border-cave-700 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cave-850 text-cave-200 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-hop" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-cave-200">Encaisser une Vente</h4>
                    <p className="text-footnote text-cave-400">Carton, fût ou vente directe</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-cave-500" />
              </div>
            </div>
          )}

          {/* SCREEN 2: SCANNING IN PROGRESS */}
          {isScanning && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-ebc-straw animate-spin mx-auto" />
              <h4 className="font-bold text-sm text-cave-50">Analyse du document par l'IA...</h4>
              <p className="text-sm text-cave-400 max-w-xs mx-auto">
                Extraction des montants HT/TVA/TTC, fournisseur et identification des ingrédients.
              </p>
            </div>
          )}

          {/* SCREEN 3: INTERACTIVE STOCK MATCHING SCREEN (LE POINT CLÉ DE GAËTAN) */}
          {screen === 'matching' && (
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-water/10 border border-water/30 rounded-2xl space-y-1">
                <div className="flex justify-between items-center text-water font-bold">
                  <span>Fournisseur : {vendor || 'Détecté'}</span>
                  <span className="font-mono text-ebc-straw font-black">{amountTTC.toFixed(2)} CHF TTC</span>
                </div>
                <p className="text-sm text-water/80">
                  Vérifiez le rapprochement automatique de chaque article. Vous avez le contrôle total pour modifier ou exclure une ligne avant validation.
                </p>
              </div>

              {/* Matching rows list */}
              <div className="space-y-2.5">
                {matchingRows.map((row, idx) => (
                  <div key={idx} className="p-3.5 bg-cave-950/70 border border-cave-800 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-footnote text-cave-500 uppercase font-bold">Sur le document :</span>
                        <div className="font-bold text-cave-50 text-sm mt-0.5">{row.extractedName}</div>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...matchingRows];
                            updated[idx].finalQty = Math.max(0.1, Math.round((updated[idx].finalQty - 0.5) * 10) / 10);
                            setMatchingRows(updated);
                          }}
                          className="w-6 h-6 rounded-lg bg-cave-850 text-cave-200 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-black text-ebc-straw px-1">{row.finalQty} {row.extractedUnit}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...matchingRows];
                            updated[idx].finalQty = Math.round((updated[idx].finalQty + 0.5) * 10) / 10;
                            setMatchingRows(updated);
                          }}
                          className="w-6 h-6 rounded-lg bg-cave-850 text-ebc-straw flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Action Selector: Matcher, Créer nouveau, Ignorer */}
                    <div className="grid grid-cols-3 gap-1.5 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...matchingRows];
                          updated[idx].action = 'match';
                          setMatchingRows(updated);
                        }}
                        className={`py-1.5 rounded-xl font-bold border transition ${
                          row.action === 'match'
                            ? 'bg-ebc-straw text-cave-950 border-ebc-gold'
                            : 'bg-cave-850 text-cave-400 border-cave-700'
                        }`}
                      >
                        Matcher stock
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...matchingRows];
                          updated[idx].action = 'new';
                          setMatchingRows(updated);
                        }}
                        className={`py-1.5 rounded-xl font-bold border transition ${
                          row.action === 'new'
                            ? 'bg-ebc-straw text-cave-950 border-ebc-gold'
                            : 'bg-cave-850 text-cave-400 border-cave-700'
                        }`}
                      >
                        + Nouvel article
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...matchingRows];
                          updated[idx].action = 'skip';
                          setMatchingRows(updated);
                        }}
                        className={`py-1.5 rounded-xl font-bold border transition ${
                          row.action === 'skip'
                            ? 'bg-alert/20 text-alert border-alert/40'
                            : 'bg-cave-850 text-cave-400 border-cave-700'
                        }`}
                      >
                        Ne pas stocker
                      </button>
                    </div>

                    {/* If Match: Dropdown of existing stock items */}
                    {row.action === 'match' && (
                      <div>
                        <label className="text-footnote text-cave-400 block mb-1">Article cible en stock :</label>
                        <Combobox
                          value={row.matchedItemRef}
                          onChange={(chosenRef) => {
                            const item = allAvailableItems.find((i) => i.ref === chosenRef);
                            const updated = [...matchingRows];
                            updated[idx].matchedItemRef = chosenRef;
                            if (item) updated[idx].matchedItemType = item.type;
                            setMatchingRows(updated);
                          }}
                          options={itemOptions}
                          /* Aucune correspondance sûre : on force un choix explicite
                             plutôt que de créditer le premier article de la liste. */
                          placeholder="Chercher l'article à créditer…"
                          allowCreate
                          onCreate={(name) => {
                            const created = createItemInline(name);
                            const updated = [...matchingRows];
                            updated[idx].matchedItemRef = created.ref;
                            updated[idx].matchedItemType = 'rawMaterials';
                            setMatchingRows(updated);
                          }}
                          createLabel={(v) => `Créer l'article « ${v} »`}
                        />
                        {!row.matchedItemRef && (
                          <p className="text-footnote text-alert mt-1">
                            Sélectionne l'article, sinon cette ligne sera ignorée.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Google Drive Path Preview */}
              <div className="p-2.5 bg-cave-950/80 rounded-xl border border-cave-800 text-sm text-cave-400 flex items-center space-x-2">
                <FolderTree className="w-4 h-4 text-water shrink-0" />
                <span className="truncate font-mono text-footnote">
                  Drive : {DriveService.generateDrivePath({ category, amountHT: splitTva(amountTTC, isTvaRegistered ? tvaRate : 0).ht, proofNotes: vendor, date: scanResult?.date })}
                </span>
              </div>

              {/* Actions, collées en pied : clavier ouvert, valider ne doit
                  pas demander de faire défiler jusqu'en bas à l'aveugle. */}
              <StickyActions>
                <button
                  type="button"
                  onClick={() => setScreen('quick-expense')}
                  className="flex-1 py-2.5 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition"
                >
                  Modifier compta
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeMatchedExpense}
                  className="flex-1 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  <span>Valider & Mettre à jour</span>
                </button>
              </StickyActions>
            </div>
          )}

          {/* SCREEN 4: QUICK EXPENSE EDIT */}
          {screen === 'quick-expense' && (
            <div className="space-y-3.5 text-sm">
              {/* Échec de lecture IA : on le dit, on n'invente pas de montant */}
              {scanError && (
                <div className="p-3 bg-alert/10 border border-alert/40 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-alert font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Lecture automatique impossible</span>
                  </div>
                  <p className="text-sm text-alert/90 leading-relaxed">{scanError}</p>
                  <p className="text-sm text-cave-200">
                    {proofDataUrl
                      ? '✅ Le justificatif reste attaché à cette écriture. Saisis les montants à la main.'
                      : 'Saisis les montants à la main.'}
                  </p>
                </div>
              )}

              {/* 1-Click Expense Templates */}
              <div className="space-y-1.5 bg-cave-950/60 p-3 rounded-2xl border border-cave-800">
                <span className="text-footnote text-ebc-straw font-bold uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" /> Gabarits Fréquents 1-Clic :
                </span>
                <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {StorageService.getExpenseTemplates().map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setDescription(tpl.description);
                        setVendor(tpl.vendor);
                        setCategory(tpl.category);
                        setSubcategory(tpl.subcategory);
                        setTvaRate(tpl.tvaRate);
                        // Le gabarit porte un HT ; le champ attend le TTC.
                        if (tpl.defaultAmountHT) {
                          setAmountTTC(
                            Math.round(tpl.defaultAmountHT * (1 + tpl.tvaRate) * 100) / 100
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 bg-cave-900 hover:bg-cave-850 text-cave-200 border border-cave-700/80 rounded-xl whitespace-nowrap text-sm font-medium transition active:scale-95 flex items-center space-x-1"
                    >
                      <span>{tpl.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-cave-200 font-semibold block mb-1">Description / Motif</label>
                <input
                  type="text"
                  name="qa_expense_reason"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="ex: Commande malt, robinetterie, électricité..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium"
                />
              </div>

              {/* Vendor & Quick Autocompletion Chips */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-cave-200 font-semibold">Fournisseur</label>
                  <span className="text-footnote text-cave-500">Suggestions rapides :</span>
                </div>
                <input
                  type="text"
                  name="qa_expense_vendor_label"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="Brau-Rauchshop, Bauhaus, Groupe E..."
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 mb-1.5"
                />

                {/* Quick Vendor Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {StorageService.getFrequentVendors().slice(0, 5).map((fv) => (
                    <button
                      key={fv.name}
                      type="button"
                      onClick={() => {
                        setVendor(fv.name);
                        setCategory(fv.category);
                        setTvaRate(fv.tvaRate);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-footnote font-bold border transition ${
                        vendor === fv.name
                          ? 'bg-ebc-straw text-cave-950 border-ebc-gold'
                          : 'bg-cave-850 text-cave-200 border-cave-700 hover:border-cave-600'
                      }`}
                    >
                      {fv.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-cave-200 font-semibold block mb-1">Catégorie</label>
                  <select
                    name="qa_expense_category"
                    autoComplete="off"
                    data-form-type="other"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FinanceCategory)}
                    className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium"
                  >
                    <option value="brassage">🌾 Brassage (Malt/Houblon)</option>
                    <option value="materiel">⚙️ Matériel & Équipement</option>
                    <option value="nettoyage">🧼 Nettoyage & CIP</option>
                    <option value="chargesFixes">🏢 Charges Fixes (Élec)</option>
                    <option value="renovation">🔨 Local & Rénovation</option>
                    <option value="divers">📦 Divers</option>
                  </select>
                </div>
                <div>
                  <label className="text-cave-200 font-semibold block mb-1">Sous-catégorie</label>
                  <input
                    type="text"
                    name="qa_expense_subcategory"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Malt, Tuyaux, Bacs..."
                    className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50"
                  />
                </div>
              </div>

              {/*
                Le montant du TICKET, et la ventilation qui s'affiche dessous.
                Le taux passe sous le champ plutôt qu'à côté : à deux colonnes
                sur un téléphone, le montant tombait à sept caractères de large.
              */}
              <MoneyField
                label="Montant payé (TTC, comme sur le ticket)"
                valueTTC={amountTTC}
                onChange={setAmountTTC}
                tvaRate={tvaRate}
                isTvaRegistered={isTvaRegistered}
              />

              {isTvaRegistered && (
                <div>
                  <label className="text-cave-200 font-semibold block mb-1">Taux TVA</label>
                  <select
                    name="qa_expense_tva_rate"
                    autoComplete="off"
                    data-form-type="other"
                    value={tvaRate}
                    onChange={(e) => setTvaRate(parseFloat(e.target.value))}
                    className="w-full min-h-touch bg-cave-850 border border-cave-700 rounded-xl px-3 text-cave-50 font-medium"
                  >
                    <option value={0.026}>2.6% (Bière / Aliments)</option>
                    <option value={0.081}>8.1% (Matériel / Services)</option>
                    <option value={0.0}>0.0% (Exonéré)</option>
                  </select>
                </div>
              )}

              {/* SECTION: RÉCEPTION DE MARCHANDISES & ENTRÉE EN STOCK MANUELLE (Point Clé de Gaëtan) */}
              <div className="p-3 bg-cave-950/80 rounded-2xl border border-cave-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cave-200 text-sm flex items-center space-x-1.5">
                    <Boxes className="w-3.5 h-3.5 text-ebc-straw" />
                    <span>Réception de marchandises & Entrée en stock</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const first = allAvailableItems[0];
                      if (first) {
                        // Ligne VIDE : ni article présélectionné, ni quantité de
                        // 10 tombée du ciel. Choisir le premier article de la
                        // liste et lui affecter un nombre rond, c'est exactement
                        // ce qui faisait créditer le mauvais article.
                        setManualStockImpacts([
                          ...manualStockImpacts,
                          { ref: '', type: 'rawMaterials', name: '', qty: 0, unit: first.unit }
                        ]);
                      }
                    }}
                    className="text-footnote bg-ebc-straw/20 hover:bg-ebc-straw/30 text-ebc-gold px-2 py-0.5 rounded-lg font-bold flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    <span>+ Ajouter article</span>
                  </button>
                </div>

                {manualStockImpacts.length === 0 ? (
                  <p className="text-sm text-cave-500 italic py-1">
                    Aucun article de stock ajouté (facture de charges fixes ou service). Cliquez sur "+ Ajouter article" si vous avez reçu des ingrédients ou produits !
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {manualStockImpacts.map((imp, idx) => {
                      const targetItem = allAvailableItems.find((i) => i.ref === imp.ref);
                      const currentQty = targetItem ? targetItem.currentStock : 0;
                      const nextQty = Math.round((currentQty + imp.qty) * 100) / 100;

                      return (
                        <div key={idx} className="panel p-3 space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <Combobox
                                value={imp.ref}
                                onChange={(ref) => {
                                  const chosen = allAvailableItems.find((i) => i.ref === ref);
                                  if (!chosen) return;
                                  const updated = [...manualStockImpacts];
                                  updated[idx] = {
                                    ref: chosen.ref,
                                    type: chosen.type,
                                    name: chosen.name,
                                    qty: imp.qty,
                                    unit: chosen.unit
                                  };
                                  setManualStockImpacts(updated);
                                }}
                                options={itemOptions}
                                placeholder="Chercher un article…"
                                allowCreate
                                onCreate={(name) => {
                                  const created = createItemInline(name);
                                  const updated = [...manualStockImpacts];
                                  updated[idx] = {
                                    ref: created.ref,
                                    type: 'rawMaterials',
                                    name: created.name,
                                    qty: imp.qty,
                                    unit: created.unit
                                  };
                                  setManualStockImpacts(updated);
                                }}
                                createLabel={(v) => `Créer l'article « ${v} »`}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setManualStockImpacts(manualStockImpacts.filter((_, i) => i !== idx))
                              }
                              aria-label={`Retirer ${imp.name}`}
                              className="touch-target rounded-control text-cave-500 hover:text-alert shrink-0"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Paliers dictés par l'unité de l'article : le houblon
                              se reçoit par centaines de grammes, le malt par kilos. */}
                          <QuantityStepper
                            label={`Quantité reçue (${imp.unit})`}
                            value={imp.qty}
                            onChange={(qty) => {
                              const updated = [...manualStockImpacts];
                              updated[idx].qty = qty;
                              setManualStockImpacts(updated);
                            }}
                            unit={imp.unit}
                            category={targetItem?.category}
                            // Une réception aligne cinq à dix articles : trois
                            // rangées de paliers chacun ne tiennent pas à l'écran.
                            compact
                            projection={
                              <>
                                <span className="font-mono text-cave-400">
                                  {Units.format(currentQty, imp.unit)}
                                </span>
                                <span className="text-cave-600"> ➔ </span>
                                <span className="font-mono text-hop">
                                  {Units.format(nextQty, imp.unit)}
                                </span>
                              </>
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <StickyActions>
                <button
                  type="button"
                  onClick={handleFinalizeMatchedExpense}
                  className="flex-1 min-h-touch bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  <span>Enregistrer la dépense {manualStockImpacts.length > 0 && `(+${manualStockImpacts.length} stock)`}</span>
                </button>
              </StickyActions>
            </div>
          )}

          {/* SCREEN 5: QUICK SALE (JUSTIFICATIF TWINT & QUITTANCE OFFICIELLE) */}
          {screen === 'quick-sale' && (
            <div className="space-y-3.5 text-sm">
              <div>
                <label className="text-cave-200 font-semibold block mb-1">Client / Bénéficiaire</label>
                <input
                  type="text"
                  name="qa_sale_client_label"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  value={saleClient}
                  onChange={(e) => setSaleClient(e.target.value)}
                  placeholder="ex: Client Comptoir, Restaurant du Lac, Bar..."
                  className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium"
                />
              </div>

              <div>
                <label className="text-cave-200 font-semibold block mb-1">Bière vendue / Conditionnement</label>
                <input
                  type="text"
                  name="qa_sale_beer_item"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  value={saleBeer}
                  onChange={(e) => setSaleBeer(e.target.value)}
                  placeholder="ex: Carton 12x 75cl Milk Stout, Fût 30L..."
                  className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium"
                />
              </div>

              <MoneyField
                label="Montant TTC encaissé"
                valueTTC={saleAmount}
                onChange={setSaleAmount}
                tvaRate={0.026}
                isTvaRegistered={isTvaRegistered}
              />

              {/* Mode de règlement */}
              <div>
                <label className="text-cave-200 font-semibold block mb-1">Mode de règlement :</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['TWINT', 'Espèces', 'Virement', 'Facture'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSalePaymentMethod(m)}
                      className={`py-2 rounded-xl text-sm font-bold border transition ${
                        salePaymentMethod === m
                          ? 'bg-ebc-straw text-cave-950 border-ebc-gold shadow'
                          : 'bg-cave-850 text-cave-200 border-cave-700 hover:border-cave-600'
                      }`}
                    >
                      {m === 'TWINT' && '📱 TWINT'}
                      {m === 'Espèces' && '💵 Cash'}
                      {m === 'Virement' && '🏦 Virement'}
                      {m === 'Facture' && '📄 Facture'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Justificatif de vente (Screenshot TWINT ou ticket) */}
              <div className="p-3 bg-cave-950/70 border border-cave-800 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-cave-200 flex items-center space-x-1">
                    <Camera className="w-3.5 h-3.5 text-ebc-straw" />
                    <span>Justificatif de paiement (Capture TWINT, ticket, reçu) :</span>
                  </span>
                  {saleProofUrl && (
                    <button
                      type="button"
                      onClick={() => { setSaleProofUrl(null); setSaleProofFileName(''); }}
                      className="text-footnote text-alert font-bold"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                {saleProofUrl ? (
                  <div className="flex items-center space-x-2 text-sm text-hop bg-cave-900 p-2 rounded-xl border border-hop/30">
                    <Check className="w-4 h-4" />
                    <span className="truncate">Justificatif joint : {saleProofFileName || 'capture_twint.jpg'}</span>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-cave-700 hover:border-ebc-gold bg-cave-900/60 cursor-pointer transition text-sm text-cave-400 hover:text-cave-200">
                      <UploadCloud className="w-4 h-4 mr-2 text-ebc-straw" />
                      <span>Joindre une capture TWINT ou photo</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const data = await GeminiScannerService.fileToDataUrl(f);
                            setSaleProofUrl(data);
                            setSaleProofFileName(f.name);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Boutons d'action : Quittance PDF officielle ou Validation */}
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadSaleReceipt}
                  disabled={saleAmount <= 0}
                  className="py-3 px-3 bg-cave-850 hover:bg-cave-800 text-ebc-straw font-bold text-sm rounded-xl border border-cave-700 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  title="Télécharger une quittance officielle suisse pour le client"
                >
                  <FileText className="w-4 h-4" />
                  <span>🧾 Quittance PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSale}
                  disabled={saleAmount <= 0}
                  className="flex-1 py-3 bg-gradient-to-r from-hop to-hop hover:from-hop text-cave-950 font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-1 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 mr-1" />
                  <span>Valider l'encaissement</span>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 6: BREW BATCH */}
          {screen === 'brew-batch' && (
            <div className="space-y-3.5 text-sm">
              <div>
                <label className="text-cave-200 font-semibold block mb-1">Choisir la recette</label>
                <select
                  name="qa_brew_recipe_select"
                  autoComplete="off"
                  data-form-type="other"
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-bold"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.volumeL}L - {r.style})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-cave-200 font-semibold block mb-1">Volume du brassin</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 50, 100].map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setBatchVolumeL(vol)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        batchVolumeL === vol
                          ? 'bg-ebc-straw text-cave-950 border-ebc-gold'
                          : 'bg-cave-850 text-cave-400 border-cave-700'
                      }`}
                    >
                      {vol} L {vol === 30 && '🍺'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-ebc-straw/10 border border-ebc-straw/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-ebc-gold block">Déduction automatique des stocks</span>
                  <p className="text-footnote text-cave-400">Soustrait automatiquement les malts & houblons</p>
                </div>
                <input
                  type="checkbox"
                  name="qa_brew_auto_deduct"
                  autoComplete="off"
                  data-form-type="other"
                  checked={autoDeductStock}
                  onChange={(e) => setAutoDeductStock(e.target.checked)}
                  className="w-5 h-5 accent-ebc-straw rounded cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleLaunchBrew}
                className="w-full py-3 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-1"
              >
                <Beer className="w-4 h-4 mr-1" />
                <span>Démarrer le brassin</span>
              </button>
            </div>
          )}
        </div>
      </ModalShell>

      {/* Cloud & AI Configuration Modal */}
      <CloudConfigModal
        isOpen={isCloudConfigOpen}
        onClose={() => setIsCloudConfigOpen(false)}
      />
    </>
  );
};
