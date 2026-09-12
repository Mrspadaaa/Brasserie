import { Input } from '../ui/Input';
import React, { useState, useRef, useMemo, useEffect, useLayoutEffect, useId } from 'react';
import { isCurrent } from '../domain/catalogOrganization';
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
import { scaleBrewBudgetRecipe } from '../domain/finance/brewBudgetScaling';
import { Combobox, ComboOption } from '../ui/Combobox';
import { QuantityStepper } from '../ui/QuantityStepper';
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { useDensity } from '../ui/useViewport';
import { NumericField } from '../ui/NumericField';
import { MoneyField, splitTva } from '../ui/MoneyField';
import { ExpenseSheet } from '../ui/finance/ExpenseSheet';
import { saveIncomeEntry, type IncomeEntry } from '../services/incomeEntry';
import { prepareFinanceDocument } from '../services/financeDocuments';
import { DriveConnection } from '../ui/finance/DriveConnection';
import { FirestoreRepo } from '../services/firestoreRepo';
import { purchaseIsoDate } from '../services/purchaseEntry';
import { TextInput } from '../ui/TextInput';
import { Field, inputClass } from '../ui/FormNav';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  geminiApiKey?: string;
  onSuccessMessage?: (msg: string) => void;
  onOpenCreateBatch?: () => void;
  initialScreen?: 'menu' | 'quick-sale' | 'quick-expense' | 'scan';
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
  recipes: allRecipes,
  geminiApiKey,
  onSuccessMessage,
  onOpenCreateBatch,
  initialScreen = 'menu'
}) => {
  const recipes = useMemo(() => allRecipes.filter(isCurrent), [allRecipes]);
  const [screen, setScreen] = useState<ModalScreen>(initialScreen);
  const [expenseMode, setExpenseMode] = useState<'manual'|'scan'|null>(initialScreen === 'quick-expense' ? 'manual' : initialScreen === 'scan' ? 'scan' : null);
  const wasOpen = useRef(false);
  const titleId = useId();
  useLayoutEffect(() => {
    if (isOpen && !wasOpen.current) {
      setScreen(initialScreen);
      setExpenseMode(initialScreen === 'quick-expense' ? 'manual' : initialScreen === 'scan' ? 'scan' : null);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialScreen]);
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
  const [saleClient, setSaleClient] = useState<string>('');
  const [saleBeer, setSaleBeer] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'TWINT' | 'Espèces' | 'Virement' | 'Facture'>('TWINT');
  const [saleProofUrl, setSaleProofUrl] = useState<string | null>(null);
  const [saleProofFileName, setSaleProofFileName] = useState<string>('');
  const [saleSaving, setSaleSaving] = useState(false), [saleError, setSaleError] = useState('');
  const saleBusy = useRef(false), pendingSale = useRef<IncomeEntry | undefined>(undefined);

  // Cloud & AI Config Modal
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);

  // Brew Batch State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  useEffect(() => {
    if (!recipes.some(r => r.id === selectedRecipeId)) setSelectedRecipeId(recipes[0]?.id || '');
  }, [recipes, selectedRecipeId]);
  const [batchVolumeL, setBatchVolumeL] = useState<number>(30);
  const [brewError, setBrewError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saleFileInputRef = useRef<HTMLInputElement>(null);
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
    if (saleBusy.current) return;
    setExpenseMode(null);
    setScreen('menu');
    setIsScanning(false);
    setScanResult(null);
    setScanError(null);
    setProofDataUrl(null);
    setMatchingRows([]);
    setAmountTTC(0);
    setDescription('');
    setVendor('');
    setBrewError('');
    pendingSale.current = undefined; setSaleError(''); setSaleAmount(0); setSaleClient(''); setSaleBeer(''); setSalePaymentMethod('TWINT'); setSaleProofUrl(null); setSaleProofFileName('');
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
  const handleSaveSale = async () => {
    if (saleBusy.current || !(saleAmount > 0)) return;
    saleBusy.current = true; setSaleSaving(true); setSaleError('');
    try {
      if (!pendingSale.current) {
        const ttc = saleAmount, cfg = StorageService.getConfig(), id = `REC-${crypto.randomUUID()}`;
        const saleTx = ReceiptService.createSaleTransactionWithReceipt({ clientName: saleClient || 'Client Comptoir', beerName: saleBeer || 'Bière artisanale', amountTTC: ttc, tvaRate: cfg.fiscal.tvaNormalRate, paymentMethod: salePaymentMethod, notes: `Règlement : ${salePaymentMethod}`, receiptNumber: id }, cfg, saleProofUrl || undefined);
        saleTx.id = id;
        const dataUrl = saleTx.proofUrl!.replace(/^data:application\/pdf;[^,]*base64,/, 'data:application/pdf;base64,');
        const mimeType = /^data:([^;]+);/.exec(dataUrl)?.[1] ?? 'application/pdf';
        const proof = prepareFinanceDocument(`proof-${crypto.randomUUID()}`, dataUrl, saleProofFileName || saleTx.proofFileName || 'Quittance.pdf', mimeType);
        delete saleTx.proofUrl; saleTx.proofFileName = proof.fileName; saleTx.proofType = mimeType; saleTx.syncedToDrive = true;
        const paid = salePaymentMethod !== 'Facture', at = new Date().toISOString();
        saleTx.finance = { version: 1, kind: 'income', amountCents: Math.round(ttc * 100), lines: [{ id: 'sale', description: saleBeer || 'Bière artisanale', kind: 'other', amountCents: Math.round(ttc * 100) }], paymentStatus: paid ? 'paid' : 'unpaid', recordedAt: at, proofDocumentId: proof.id };
        const payment = paid ? { id: `PAY-${id}`, transactionId: id, date: purchaseIsoDate(saleTx.date), amountCents: Math.round(ttc * 100), direction: 'in' as const, method: salePaymentMethod === 'TWINT' ? 'twint' as const : salePaymentMethod === 'Espèces' ? 'cash' as const : 'bank' as const, recordedAt: at } : undefined;
        pendingSale.current = { transaction: saleTx, proof, payment };
      }
      await saveIncomeEntry(pendingSale.current);
      triggerConfetti();
      onSuccessMessage?.(`Vente de ${pendingSale.current.transaction.amountTTC.toFixed(2)} CHF enregistrée. Justificatif conservé dans Drive.`);
      saleBusy.current = false;
      resetAndClose();
    } catch (error) { setSaleError(error instanceof Error ? error.message : 'La vente reste à confirmer. Le brouillon est conservé.'); }
    finally { saleBusy.current = false; setSaleSaving(false); }
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
        tvaRate: 0.081,
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
    const profile = selected.brewhouse ?? cfg.brewhouses.find(b => b.id === cfg.activeBrewhouseId) ?? cfg.brewhouses[0];
    let recipe: Recipe;
    try {
      recipe = scaleBrewBudgetRecipe(selected, batchVolumeL, profile);
    } catch (error) {
      setBrewError(error instanceof Error ? error.message : 'La recette ne peut pas être adaptée à ce volume.');
      return;
    }

    const newBatchId = nextBatchId(StorageService.getBatches().map(b => b.id));

    // Compatibility method name: this plans the batch; it never consumes stock.
    StorageService.brewRecipeAndDeductStocks(recipe, newBatchId);

    triggerConfetti();
    if (onSuccessMessage) {
      onSuccessMessage(`Brassin ${newBatchId} (${recipe.name} ${batchVolumeL}L) lancé avec succès ! 🍺`);
    }
    resetAndClose();
  };

  if (!isOpen) return null;
  if(expenseMode) return <ExpenseSheet onClose={resetAndClose} onSaved={()=>onSuccessMessage?.('Achat enregistré.')} startWithScan={expenseMode==='scan'}/>;

  return (
    <>
      <ModalShell open={isOpen} onClose={resetAndClose} size="lg" labelledBy={titleId} dismissible={!saleSaving}>
        {/* En-tête : réduit au titre et aux deux boutons quand le clavier
            occupe l'écran — c'est 28 px rendus à la saisie. */}
        <div
          className={`shrink-0 flex items-center justify-between border-b border-cave-800 bg-cave-900/60 ${
            tight ? 'min-h-9 px-2 py-0.5' : 'min-h-9 px-3 py-0.5'
          }`}
        >
          <div className="flex items-center space-x-2">
            {screen !== 'menu' && initialScreen === 'menu' && (
              <button
                disabled={saleSaving}
                type="button"
                aria-label="Toutes les actions"
                onClick={() => setScreen('menu')}
                className="min-h-7 min-w-7 flex items-center justify-center rounded-control text-cave-400 hover:text-cave-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Sparkles className="w-4 h-4 text-area-finances" />
            <h2 id={titleId} className="font-semibold text-lg text-cave-50">
              {screen === 'menu' && 'Nouvelle action'}
              {screen === 'scan' && 'Lire un justificatif'}
              {screen === 'matching' && 'Matching & Contrôle Stocks'}
              {screen === 'quick-expense' && 'Saisie Dépense'}
              {screen === 'quick-sale' && 'Enregistrer une vente'}
              {screen === 'brew-batch' && 'Lancer un Brassin'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            disabled={saleSaving}
            onClick={resetAndClose}
            className="min-h-7 min-w-7 flex items-center justify-center text-cave-400 hover:text-cave-200 rounded-control transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input for Document Scan */}
        <input
          ref={fileInputRef}
          hidden
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
            tight ? 'p-2 space-y-2' : 'p-3 space-y-3'
          }`}
        >
          {/* Les entrées nomment le résultat ; la saisie manuelle ne repasse pas par le scan. */}
          {screen === 'menu' && (
            <div className="divide-y divide-cave-800">
              <button type="button" onClick={() => setExpenseMode('scan')} className="w-full min-h-10 py-2 flex items-center gap-2 text-left text-[13px] text-cave-200 hover:bg-cave-850 rounded-control">
                <Camera size={16} className="text-area-finances shrink-0"/><span className="flex-1 min-w-0">Lire un justificatif <span className="block text-xs text-cave-400">Photo ou fichier, puis vérification</span></span><ChevronRight size={14}/>
              </button>
              <button type="button" onClick={() => setExpenseMode('manual')} className="w-full min-h-9 py-1 flex items-center gap-2 text-left text-[13px] text-cave-200 hover:bg-cave-850 rounded-control">
                <Zap size={16} className="text-area-finances shrink-0"/><span className="flex-1">Saisir une dépense</span><ChevronRight size={14}/>
              </button>
              <button type="button" onClick={() => setScreen('quick-sale')} className="w-full min-h-9 py-1 flex items-center gap-2 text-left text-[13px] text-cave-200 hover:bg-cave-850 rounded-control">
                <TrendingUp size={16} className="text-area-finances shrink-0"/><span className="flex-1">Encaisser une vente</span><ChevronRight size={14}/>
              </button>
              <button type="button" onClick={() => { if (onOpenCreateBatch) { onClose(); onOpenCreateBatch(); } else setScreen('brew-batch'); }} className="w-full min-h-9 py-1 flex items-center gap-2 text-left text-[13px] text-cave-200 hover:bg-cave-850 rounded-control">
                <Beer size={16} className="text-area-production shrink-0"/><span className="flex-1">Préparer un brassin</span><ChevronRight size={14}/>
              </button>
              <button type="button" onClick={() => setIsCloudConfigOpen(true)} className="min-h-7 py-1 inline-flex items-center gap-2 text-xs text-cave-400 hover:text-cave-50">
                <Cloud size={14}/>Connexion et justificatifs
              </button>
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
                        <span className="text-footnote text-cave-400 uppercase font-bold">Sur le document :</span>
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
                <Input
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
                  <span className="text-footnote text-cave-400">Suggestions rapides :</span>
                </div>
                <Input
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
                  <Input
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
                  <p className="text-sm text-cave-400 italic py-1">
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
                              className="touch-target rounded-control text-cave-400 hover:text-alert shrink-0"
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
                                <span className="text-cave-400"> ➔ </span>
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

          {/* Une vente, son montant et son règlement ; justificatif facultatif. */}
          {screen === 'quick-sale' && (
            <div className="space-y-2 text-[13px] [&_label]:text-xs [&_input]:min-h-8 [&_input]:py-0.5 [&_input]:text-base [&_[role=textbox]]:min-h-8 [&_[role=textbox]]:py-0.5 [&_p]:text-xs">
              {pendingSale.current && <p className="text-amber-200">La vente est conservée à l’identique. Réessaie pour confirmer cet enregistrement.</p>}
              <fieldset disabled={saleSaving || Boolean(pendingSale.current)} className="space-y-2 border-0 p-0 m-0 min-w-0">
                <MoneyField label={salePaymentMethod === 'Facture' ? 'Montant TTC à encaisser' : 'Montant TTC encaissé'} valueTTC={saleAmount} onChange={setSaleAmount} tvaRate={StorageService.getConfig().fiscal.tvaNormalRate} isTvaRegistered={isTvaRegistered}/>
                <Field label="Client (facultatif)" htmlFor="qa-sale-client"><TextInput id="qa-sale-client" value={saleClient} onChange={setSaleClient} placeholder="Client comptoir" className={inputClass}/></Field>
                <Field label="Bière / conditionnement (facultatif)" htmlFor="qa-sale-beer"><TextInput id="qa-sale-beer" value={saleBeer} onChange={setSaleBeer} placeholder="Carton, fût, bière…" className={inputClass}/></Field>
                <div role="group" aria-label="Mode de règlement" className="space-y-1">
                  <p className="text-xs text-cave-400">Règlement</p>
                  <div className="grid grid-cols-4 gap-1">
                    {(['TWINT', 'Espèces', 'Virement', 'Facture'] as const).map(method => <button key={method} type="button" aria-pressed={salePaymentMethod === method} onClick={() => setSalePaymentMethod(method)} className={'min-h-7 px-1 rounded-control text-[13px] border ' + (salePaymentMethod === method ? 'border-area-finances bg-area-finances/10 text-cave-50' : 'border-cave-700 text-cave-200')}>{method}</button>)}
                  </div>
                  {salePaymentMethod === 'Facture' && <p className="text-xs text-cave-400">La vente restera à encaisser jusqu’au paiement.</p>}
                </div>
                <div className="border-t border-cave-800 pt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <input hidden ref={saleFileInputRef} type="file" aria-label="Justificatif de paiement" accept="image/*,application/pdf" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0]; e.target.value = '';
                    if (file) { try { const data = await GeminiScannerService.fileToDataUrl(file); setSaleProofUrl(data); setSaleProofFileName(file.name); } catch { setSaleError('Ce fichier ne peut pas être lu. Choisis un autre justificatif.'); } }
                  }}/>
                  <button type="button" onClick={() => saleFileInputRef.current?.click()} className="min-h-7 inline-flex items-center gap-1.5 text-[13px] text-cave-200"><UploadCloud size={14}/>{saleProofUrl ? 'Changer le justificatif' : 'Joindre un justificatif (facultatif)'}</button>
                  {saleProofUrl && <><span className="min-w-0 truncate text-xs text-cave-400">{saleProofFileName}</span><button type="button" onClick={() => { setSaleProofUrl(null); setSaleProofFileName(''); }} className="min-h-7 px-1 text-xs text-alert-strong">Retirer</button></>}
                </div>
              </fieldset>
              <div className="space-y-1 [&_button]:min-h-7 [&_button]:py-0.5 [&_button]:text-[13px]">
                <p className="text-xs text-cave-400">Une quittance sera conservée dans ton Drive privé.</p>
                <DriveConnection compact always={Boolean(saleError)}/>
              </div>
              {saleError && <p role="alert" className="text-sm text-alert-strong">{saleError}</p>}
              <div className="sticky bottom-0 flex flex-wrap justify-end items-center gap-2 min-h-9 border-t border-cave-800 bg-cave-900 py-0.5">
                <button type="button" onClick={handleDownloadSaleReceipt} disabled={saleAmount <= 0 || saleSaving} className="min-h-7 px-2 border border-cave-700 rounded-control text-[13px] text-cave-200 inline-flex items-center gap-1 disabled:opacity-50"><FileText size={14}/>Quittance PDF</button>
                <button type="button" onClick={() => void handleSaveSale()} disabled={saleAmount <= 0 || saleSaving} className="min-h-8 px-2 bg-ebc-straw text-cave-950 font-semibold rounded-control text-[13px] inline-flex items-center gap-1 disabled:opacity-50"><Check size={14}/>{saleSaving ? 'Enregistrement…' : pendingSale.current ? 'Reprendre la confirmation' : salePaymentMethod === 'Facture' ? 'Enregistrer à encaisser' : 'Valider l’encaissement'}</button>
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
                  aria-label="Choisir la recette"
                  autoComplete="off"
                  data-form-type="other"
                  value={selectedRecipeId}
                  onChange={(e) => { setSelectedRecipeId(e.target.value); setBrewError(''); }}
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
                      onClick={() => { setBatchVolumeL(vol); setBrewError(''); }}
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

              <div className="p-3 bg-ebc-straw/10 border border-ebc-straw/20 rounded-2xl">
                <div>
                  <span className="font-bold text-ebc-gold block">Ingrédients réservés pour ce brassin</span>
                  <p className="text-sm text-cave-200 mt-1">Le stock sera retiré à la validation des étapes de production, selon les quantités confirmées.</p>
                </div>
              </div>

              {brewError && <p role="alert" className="text-sm text-ebc-straw">{brewError}</p>}

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
