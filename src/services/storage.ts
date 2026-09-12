import { transactionAmount, transactionKind, paidForTransaction, validateFinanceTransaction } from '../domain/finance/ledger';
import type { FinancialPayment } from '../domain/finance/types';
import { prepareBrewStockConsumption } from '../domain/finance/brewStockConsumption';
import {
  Transaction,
  StockItem,
  EquipmentItem,
  KegItem,
  Recipe,
  Batch,
  Client,
  GanttTask,
  PricingItem,
  BudgetLine,
  AppConfig,
  FinanceCategory,
  AuditLog,
  ExpenseTemplate,
  CreativeItem
} from '../types';

import { initialCompany, initialBrewhouses } from '../data/seedData';
import { FirestoreRepo, CollectionName } from './firestoreRepo';
import { writeCatalogOrganization } from './catalogOrganization';
import { deviceBackup, restoreBackup } from './dataBackup';
import { captureSnapshot, normalizeBatch, normalizeRecipe } from '../domain/recipeSnapshot';
import { Units } from './units';
import { HopVariety, HopLot, assertHopDocument } from '../../functions/src/hopIndexSchema';
import { parseBackup } from '../../functions/src/backupCore';
import { HopKnowledge, HopPredictionSnapshot, HopTasting, assertHopKnowledge, assertHopTasting } from '../../functions/src/hopPredictionSchema';
import { assertHopPredictionSnapshot } from '../../functions/src/hopPredictionValidation';

/**
 * Façade de données de l'application.
 *
 * L'interface publique n'a pas changé (`getTransactions()` renvoie toujours un
 * tableau synchrone), mais les données vivent désormais dans **Firestore** et
 * non plus dans `localStorage` :
 *   - plus de plafond de 5 Mo ;
 *   - fonctionnement hors-ligne conservé (cache IndexedDB de Firestore) ;
 *   - les mêmes données sur le téléphone dans la cuverie et sur l'ordinateur.
 *
 * Restent volontairement en `localStorage`, parce que ce sont des préférences
 * PROPRES À CHAQUE APPAREIL et non des données métier : l'état de l'interface
 * (onglet courant, recherches, accordéons) et l'utilisateur sélectionné.
 */

const LOCAL_KEYS = {
  UI_STATE: 'laffinee_ui_state',
  CURRENT_USER: 'laffinee_current_user'
};

export const defaultExpenseTemplates: ExpenseTemplate[] = [
  {
    id: 'TPL-001',
    title: '🌾 Commande Malt & Houblon (Brau-Rauchshop)',
    vendor: 'Brau-Rauchshop',
    category: 'brassage',
    subcategory: 'Malt & Houblon',
    tvaRate: 0.026,
    defaultAmountHT: 110.39,
    description: 'Commande matières premières brassage'
  },
  {
    id: 'TPL-002',
    title: '⚙️ Bacs & Raccords Inox (Bauhaus)',
    vendor: 'Bauhaus',
    category: 'materiel',
    subcategory: 'Quincaillerie & Raccords',
    tvaRate: 0.081,
    defaultAmountHT: 45.0,
    description: 'Bacs alimentaires & raccords inox'
  },
  {
    id: 'TPL-003',
    title: '🏢 Facture Électricité (Groupe E)',
    vendor: 'Groupe E',
    category: 'chargesFixes',
    subcategory: 'Électricité',
    tvaRate: 0.081,
    defaultAmountHT: 20.5,
    description: 'Consommation électrique brasserie'
  },
  {
    id: 'TPL-004',
    title: '🧼 Produits Nettoyage CIP (Brau-Rauchshop)',
    vendor: 'Brau-Rauchshop',
    category: 'nettoyage',
    subcategory: 'CIP & Hygiène',
    tvaRate: 0.081,
    defaultAmountHT: 65.0,
    description: 'Lessive alcaline & désinfectant peracétique'
  },
  {
    id: 'TPL-005',
    title: '🧤 Gants & Masques EPI',
    vendor: 'EPI Suisse',
    category: 'nettoyage',
    subcategory: 'Consommables',
    tvaRate: 0.081,
    defaultAmountHT: 23.0,
    description: 'Équipements de protection individuelle'
  }
];

export const defaultCreativeItems: CreativeItem[] = [
  {
    id: 'CR-001',
    type: 'equipment',
    title: "Système d'embouteillage 4 becs inox",
    description:
      "Remplisseuse à contre-pression ou gravité pour embouteiller 30L en 15 minutes sans oxydation.",
    status: 'research',
    estimatedCost: 1200,
    notes: 'Fournisseurs potentiels : Polsinelli, Brouwland ou occasion Anibis.'
  },
  {
    id: 'CR-002',
    type: 'equipment',
    title: 'Chambre chaude régulée (20-22°C)',
    description:
      'Armoire isolée avec thermostat Inkbird pour refermentation en bouteille constante même en hiver.',
    status: 'idea',
    estimatedCost: 350,
    notes: 'Élément chauffant tubulaire + ventilation douce.'
  },
  {
    id: 'CR-003',
    type: 'event',
    title: "Marché d'Automne de Villars-sur-Glâne",
    description: 'Stand de dégustation et vente directe de cartons 12x 75cl.',
    status: 'todo',
    date: '10.10.2026',
    notes: "Prendre contact avec l'administration communale pour autorisation et emplacement."
  },
  {
    id: 'CR-004',
    type: 'recipe-idea',
    title: "Bière d'Hiver Pain d'Épices & Miel de Fribourg",
    description:
      'Dubbel ou Brown Ale 7.2% avec miel de forêt local et cannelle/anis étoilé au whirlpool.',
    status: 'idea',
    notes: 'Visuel étiquette : dessin kraft montrant les Préalpes fribourgeoises enneigées.'
  },
  {
    id: 'CR-005',
    type: 'prospect',
    title: 'Le Carnotzet Gourmand',
    description:
      'Bistrot du centre intéressé par une bière artisanale locale en bouteille 75cl sur table.',
    status: 'quote',
    contactName: 'Stéphane',
    contactPhone: '+41 79 345 67 89',
    notes:
      'A adoré la Milk Stout lors de la première dégustation. Proposer un tarif pro à 5.50 CHF HT la 75cl.'
  }
];

export const defaultConfig: AppConfig = {
  company: initialCompany,
  fiscal: {
    // L'Affinée démarre : tant que le chiffre d'affaires reste sous le seuil,
    // elle n'est pas assujettie à la TVA. À basculer le jour où elle le franchit.
    isTvaRegistered: false,
    tvaReducedRate: 0.026,
    tvaNormalRate: 0.081,
    tvaThresholdTurnover: 100000,
    // ⚠️ À vérifier contre le tarif OFDF en vigueur avant toute déclaration.
    beerTaxFullRatePerHl: 25.2,
    beerTaxSmallBrewerMaxHl: 55000,
    beerTaxReliefTiersHl: [
      { upToHl: 15000, reductionPct: 40 },
      { upToHl: 22000, reductionPct: 20 },
      { upToHl: 45000, reductionPct: 10 }
    ]
  },
  brewhouses: initialBrewhouses,
  activeBrewhouseId: 'bh-30',
  security: {
    currentUser: 'Gaëtan'
  }
};

// --- Préférences locales (non synchronisées) ---------------------------------

const localCache: Record<string, any> = {};
let lastWriteError: string | null = null;

function safeWriteLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err: any) {
    lastWriteError = `Préférence d'affichage non sauvegardée : ${err?.message || 'erreur inconnue'}`;
    console.error('[Storage] écriture locale impossible', key, err);
    return false;
  }
}

// --- Aides Firestore ---------------------------------------------------------

/**
 * Écrit un tableau complet en ne poussant QUE les différences.
 *
 * Les composants appellent volontiers `saveStocks(toutLeStock)` alors qu'un
 * seul article a bougé. Réécrire les 30 documents à chaque fois brûlerait le
 * quota d'écritures pour rien : on compare avec le cache et on n'écrit que ce
 * qui a réellement changé.
 */
function syncCollection<T>(
  name: CollectionName,
  items: T[],
  idOf: (item: T, index: number) => string
): void {
  const current = FirestoreRepo.all<any>(name);
  const currentById = new Map(current.map((d) => [d.__docId as string, d]));
  const nextIds = new Set<string>();

  items.forEach((item, i) => {
    const id = idOf(item, i);
    if (!id) return;
    nextIds.add(id);
    const existing = currentById.get(id);
    if (!existing || !sameDoc(existing, item)) {
      FirestoreRepo.put(name, id, item);
    }
  });

  currentById.forEach((_, id) => {
    if (!nextIds.has(id)) FirestoreRepo.remove(name, id);
  });
}

/** Comparaison de documents en ignorant l'identifiant technique interne. */
function sameDoc(a: any, b: any): boolean {
  const { __docId: _ignored, ...clean } = a ?? {};
  return JSON.stringify(sortKeys(clean)) === JSON.stringify(sortKeys(b ?? {}));
}

function sortKeys(v: any): any {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    return Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = sortKeys(v[k]);
        return acc;
      }, {});
  }
  return v;
}

/** Retire le champ technique `__docId` avant de rendre les données au reste de l'app. */
function clean<T>(docs: any[]): T[] {
  return docs.map(({ __docId, ...rest }) => rest as T);
}

/**
 * Motifs d'une correction d'inventaire. Obligatoire : un écart sans raison
 * n'apprend rien, et c'est justement l'écart qui est l'information.
 */
export const INVENTORY_REASONS = {
  comptage: 'Inventaire physique',
  casse: 'Casse',
  perte: 'Perte ou péremption',
  saisie: 'Erreur de saisie',
  don: 'Don ou dégustation'
} as const;

export type InventoryReason = keyof typeof INVENTORY_REASONS;

/**
 * Compteur d'écritures au journal, monotone sur la durée de vie de l'onglet.
 * Il départage deux entrées écrites dans la même milliseconde.
 */
let auditSequence = 0;

// --- Service -----------------------------------------------------------------

export const StorageService = {
  listeners: new Set<() => void>(),

  // Les erreurs viennent maintenant de Firestore (règles de sécurité, réseau)
  // autant que du stockage local.
  consumeWriteError(): string | null {
    const firestoreErr = FirestoreRepo.consumeError();
    const localErr = lastWriteError;
    lastWriteError = null;
    return firestoreErr || localErr;
  },

  hasWriteError(): boolean {
    return lastWriteError !== null;
  },

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    const unsubRepo = FirestoreRepo.subscribe(callback);
    return () => {
      this.listeners.delete(callback);
      unsubRepo();
    };
  },

  notify() {
    this.listeners.forEach((cb) => cb());
  },

  /** Coupe la synchronisation Firestore (déconnexion). */
  clearMemoryCache(): void {
    FirestoreRepo.stopSync();
    Object.keys(localCache).forEach((k) => delete localCache[k]);
  },

  startSync(): void {
    FirestoreRepo.startSync();
  },

  isReady(): boolean {
    return FirestoreRepo.isReady();
  },

  // 0. JOURNAL D'AUDIT
  getAuditLogs(): AuditLog[] {
    return clean<AuditLog>(FirestoreRepo.all('auditLogs')).sort((a, b) =>
      (b.id || '').localeCompare(a.id || '')
    );
  },

  logAction(
    action: string,
    category: AuditLog['category'],
    entityId: string,
    summary: string,
    details?: string
  ) {
    const user = this.getCurrentUser();
    /*
     * ⚠️ L'identifiant sert AUSSI de clé de tri : `getAuditLogs()` classe par
     * `id` décroissant. Le suffixe était ALÉATOIRE — deux écritures dans la
     * même milliseconde s'ordonnaient donc au hasard, et une création suivie
     * de sa suppression pouvait s'afficher à l'envers dans le journal.
     *
     * Un compteur monotone, complété à six chiffres pour que la comparaison
     * lexicale corresponde à la comparaison numérique, rend l'ordre certain.
     */
    auditSequence += 1;
    const id = `LOG-${String(Date.now()).padStart(14, '0')}-${String(auditSequence).padStart(6, '0')}-${crypto.randomUUID().slice(0, 8)}`;
    const newLog: AuditLog = {
      id,
      timestamp: new Date().toLocaleString('fr-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      user,
      action,
      category,
      entityId,
      summary,
      details
    };
    FirestoreRepo.put('auditLogs', id, newLog);
  },

  clearAuditLogs() {
    FirestoreRepo.all<any>('auditLogs').forEach((l) =>
      FirestoreRepo.remove('auditLogs', l.__docId)
    );
  },

  // 0.1 ÉTAT D'INTERFACE (local, propre à l'appareil)
  getUiState<T>(key: string, fallback: T): T {
    if (!localCache[LOCAL_KEYS.UI_STATE]) {
      try {
        const raw = localStorage.getItem(LOCAL_KEYS.UI_STATE);
        localCache[LOCAL_KEYS.UI_STATE] = raw ? JSON.parse(raw) : {};
      } catch {
        localCache[LOCAL_KEYS.UI_STATE] = {};
      }
    }
    const state = localCache[LOCAL_KEYS.UI_STATE];
    return state[key] !== undefined ? state[key] : fallback;
  },

  setUiState<T>(key: string, val: T): void {
    if (!localCache[LOCAL_KEYS.UI_STATE]) {
      try {
        const raw = localStorage.getItem(LOCAL_KEYS.UI_STATE);
        localCache[LOCAL_KEYS.UI_STATE] = raw ? JSON.parse(raw) : {};
      } catch {
        localCache[LOCAL_KEYS.UI_STATE] = {};
      }
    }
    localCache[LOCAL_KEYS.UI_STATE][key] = val;
    safeWriteLocal(LOCAL_KEYS.UI_STATE, localCache[LOCAL_KEYS.UI_STATE]);
  },

  // 0.2 UTILISATEUR COURANT (local — qui saisit sur CET appareil)
  getCurrentUser(): 'Gaëtan' | 'Aricia' {
    return (localStorage.getItem(LOCAL_KEYS.CURRENT_USER) as any) || 'Gaëtan';
  },

  setCurrentUser(user: 'Gaëtan' | 'Aricia') {
    try {
      localStorage.setItem(LOCAL_KEYS.CURRENT_USER, user);
    } catch (err) {
      console.error('[Storage] utilisateur non persisté', err);
    }
    this.notify();
  },

  // 1. ÉCRITURES COMPTABLES
  getTransactions(): Transaction[] {
    return clean<Transaction>(FirestoreRepo.all('transactions')).filter((t) =>
      Number.isFinite(t.amountTTC ?? t.amountHT) && (t.amountTTC ?? t.amountHT) !== 0);
  },

  saveTransactions(transactions: Transaction[]) {
    syncCollection('transactions', transactions, (t) => t.id);
  },

  addTransaction(tx: Transaction) {
    FirestoreRepo.put('transactions', tx.id, tx);
    this.logAction(
      'Création',
      'Finances',
      tx.id,
      `Nouvelle écriture : ${tx.description} (${tx.amountTTC.toFixed(2)} CHF)`,
      `Catégorie : ${tx.category} · TVA : ${(tx.tvaRate * 100).toFixed(1)}%`
    );
  },

  updateTransaction(tx: Transaction) {
    const old = this.getTransactions().find((t) => t.id === tx.id);
    if (old?.finance?.voidedAt) throw new Error('Cette écriture est annulée. Crée une nouvelle opération pour la remplacer.');
    if (tx.finance) validateFinanceTransaction(tx);
    FirestoreRepo.put('transactions', tx.id, tx);
    this.logAction(
      'Modification',
      'Finances',
      tx.id,
      `Écriture ${tx.id} modifiée : ${tx.description} (${tx.amountTTC.toFixed(2)} CHF)`,
      old
        ? `Ancien : ${old.description} (${old.amountTTC.toFixed(2)} CHF) [${old.category}] ➔ Nouveau : [${tx.category}]`
        : undefined
    );
  },

  /** An erroneous entry is retained, with its reversal trace. */
  deleteTransaction(id: string) {
    const result = this.revertTransaction(id);
    if (!result.success) throw new Error(result.message);
  },

  revertTransaction(id: string): { success: boolean; message: string } {
    const target = this.getTransactions().find(t => t.id === id);
    if (!target) return { success: false, message: 'Écriture introuvable.' };
    if (target.finance?.voidedAt) return { success: true, message: 'Écriture déjà annulée ; aucun stock modifié.' };
    if (this.getTransactions().some(t => !t.finance?.voidedAt && t.finance?.refundOfId === id)) return { success: false, message: 'Un avoir est lié à cette pièce. Corrige d’abord cet avoir pour conserver des comptes cohérents.' };
    const payments = clean<FinancialPayment>(FirestoreRepo.all('financialPayments'));
    if (paidForTransaction(target, payments, this.getTransactions()) !== 0) return { success: false, message: 'Annule d’abord le paiement erroné, ou enregistre un remboursement si l’argent a réellement circulé.' };
    if (FirestoreRepo.all<any>('financialAssets').some(a => a.transactionId === id)) return { success: false, message: 'Cet achat est lié à un amortissement. Corrige sa fiche avant d’annuler l’achat.' };
    const receipts = FirestoreRepo.all<any>('movements').filter(m => m.type === 'receipt' && m.transactionId === id);
    const impact = new Map<string, number>();
    if (receipts.length) for (const m of receipts) impact.set(m.stockItemRef, (impact.get(m.stockItemRef) ?? 0) + m.quantity);
    else for (const item of target.stockImpact ?? []) impact.set(item.itemRef, (impact.get(item.itemRef) ?? 0) + item.addedQty);
    const stocks = this.getStocks(), all = [...stocks.rawMaterials, ...stocks.cleaning];
    for (const [ref, qty] of impact) {
      const item = all.find(s => s.ref === ref);
      if (!Number.isFinite(qty) || qty < 0 || !item || item.currentStock + 1e-8 < qty) return { success: false, message: 'Le stock de cet achat a été consommé ou corrigé. Vérifie l’inventaire avant d’annuler ; aucune quantité ne sera effacée.' };
    }
    const at = new Date().toISOString();
    for (const [ref, qty] of impact) {
      const item = all.find(s => s.ref === ref)!;
      FirestoreRepo.adjustNumber('stockItems', ref, 'currentStock', -qty, { reorder: item.currentStock - qty <= item.minStock });
      const movementId = 'VOID-STOCK-' + id + '-' + ref;
      FirestoreRepo.put('movements', movementId, { id: movementId, type: 'receipt-reversal', transactionId: id, stockItemRef: ref, delta: -qty, unit: item.unit, createdAt: at });
    }
    const finance = { version: 1 as const, kind: transactionKind(target), amountCents: transactionAmount(target), lines: [], ...target.finance, voidedAt: at };
    FirestoreRepo.put('transactions', id, { ...target, finance });
    FirestoreRepo.put('movements', 'VOID-' + id, { id: 'VOID-' + id, type: 'transaction-void', transactionId: id, createdAt: at });
    this.logAction('Annulation', 'Finances', id, 'Annulation conservée : ' + target.description, 'Le justificatif et les mouvements antérieurs sont conservés.');
    return { success: true, message: 'Écriture annulée. Son justificatif et son historique sont conservés.' };
  },

  // Documentary hop index. Upserts never replace a filtered collection or copy inherited facts.
  getHopVarieties(): HopVariety[] {
    return clean<HopVariety>(FirestoreRepo.all('hopVarieties'));
  },
  getHopLots(): HopLot[] {
    return clean<HopLot>(FirestoreRepo.all('hopLots'));
  },
  getHopKnowledge(): HopKnowledge[] { return clean<HopKnowledge>(FirestoreRepo.all('hopKnowledge')); },
  getHopPredictions(): HopPredictionSnapshot[] { return clean<HopPredictionSnapshot>(FirestoreRepo.all('hopPredictions')); },
  getHopTastings(): HopTasting[] { return clean<HopTasting>(FirestoreRepo.all('hopTastings')); },
  saveHopKnowledge(item: HopKnowledge): void {
    assertHopKnowledge(item);
    const previous = this.getHopKnowledge().find(row => row.id === item.id);
    if (previous && sameDoc(previous, item)) return;
    if (previous && previous.kind !== item.kind) throw Error('Le type d’une connaissance existante ne peut pas changer.');
    if (previous && 'version' in previous && 'version' in item && previous.version === item.version) throw Error('Changer la version du modèle pour conserver une révision identifiable.');
    if (previous && previous.kind === 'axis' && item.kind === 'axis' && previous.version === item.version) throw Error('Changer la version de l’axe pour conserver son échelle historique.');
    FirestoreRepo.put('hopKnowledge', item.id, item);
  },
  saveHopPrediction(item: HopPredictionSnapshot): void {
    assertHopPredictionSnapshot(item);
    const previous = this.getHopPredictions().find(row => row.id === item.id);
    if (previous) { if (!sameDoc(previous, item)) throw Error('Une prédiction figée ne peut pas être remplacée.'); return; }
    FirestoreRepo.put('hopPredictions', item.id, item);
  },
  saveHopTasting(item: HopTasting): void {
    assertHopTasting(item);
    const previous = this.getHopTastings().find(row => row.id === item.id);
    if (!previous || !sameDoc(previous, item)) FirestoreRepo.put('hopTastings', item.id, item);
  },
  saveHopVariety(item: HopVariety): void {
    assertHopDocument('hopVarieties', item);
    const previous = FirestoreRepo.all<any>('hopVarieties').find(row => row.id === item.id || row.__docId === item.id);
    if (!previous || !sameDoc(previous, item)) FirestoreRepo.put('hopVarieties', item.id, item);
  },
  saveHopLot(item: HopLot): void {
    assertHopDocument('hopLots', item);
    const previous = FirestoreRepo.all<any>('hopLots').find(row => row.id === item.id || row.__docId === item.id);
    if (!previous || !sameDoc(previous, item)) FirestoreRepo.put('hopLots', item.id, item);
  },
  /** A backup or a documentary pack; both pass the same full validation before any write. */
  async importHopIndex(json: string): Promise<number> {
    const indexCollections = ['hopVarieties', 'hopLots', 'hopKnowledge', 'hopPredictions', 'hopTastings'];
    const input = JSON.parse(json), raw = Array.isArray(input) ? { hopKnowledge: input } : input;
    const isPack = raw && typeof raw === 'object' && !raw.schemaVersion && Object.keys(raw).length > 0 && Object.keys(raw).every(name => indexCollections.includes(name));
    const normalized = isPack ? JSON.stringify({ schemaVersion: 3, source: 'device', exportedAt: new Date().toISOString(), collections: Object.fromEntries(Object.entries(raw).map(([name, rows]) => {
      if (!Array.isArray(rows) || rows.some(row => !row || typeof row.id !== 'string')) throw Error('Pack documentaire : chaque collection doit contenir des fiches identifiées.');
      return [name, rows.map(data => ({ id: data.id, data }))];
    })) }) : json;
    const backup = parseBackup(normalized);
    const entries = Object.entries(backup.collections);
    if (entries.some(([name]) => !indexCollections.includes(name))) throw Error('Ce fichier doit contenir seulement les collections de l’index houblon.');
    const changes: Array<{ name: CollectionName; id: string; data: unknown }> = [];
    for (const [name, rows] of entries) {
      const current = new Map(FirestoreRepo.all<any>(name as CollectionName).map(d => [d.__docId || d.id, d]));
      for (const row of rows ?? []) {
        const previous = current.get(row.id), unchanged = previous && sameDoc(previous, row.data);
        if (previous && !unchanged && name === 'hopPredictions') throw Error('Une prédiction figée différente existe déjà. Aucun import effectué.');
        if (previous && !unchanged && name === 'hopKnowledge') {
          if (previous.kind !== row.data.kind) throw Error('Le type d’une connaissance existante ne peut pas changer.');
          if (['model', 'axis', 'extrapolation', 'solver', 'fermentation', 'fermentationScience'].includes(previous.kind) && previous.version === row.data.version) throw Error('La connaissance importée doit porter une nouvelle version.');
        }
        if (!unchanged) changes.push({ name: name as CollectionName, ...row });
      }
    }
    if (changes.length) await FirestoreRepo.bulkWrite(changes);
    return changes.length;
  },
  exportHopIndex(): string {
    return JSON.stringify({ schemaVersion: 3, source: 'device', exportedAt: new Date().toISOString(), collections: {
      hopVarieties: this.getHopVarieties().map(data => ({ id: data.id, data })),
      hopLots: this.getHopLots().map(data => ({ id: data.id, data })),
      hopKnowledge: this.getHopKnowledge().map(data => ({ id: data.id, data })),
      hopPredictions: this.getHopPredictions().map(data => ({ id: data.id, data })),
      hopTastings: this.getHopTastings().map(data => ({ id: data.id, data }))
    } }, null, 2);
  },

  // 2. STOCKS
  getStocks(): {
    rawMaterials: StockItem[];
    cleaning: StockItem[];
    equipment: EquipmentItem[];
    kegs: KegItem[];
  } {
    const items = FirestoreRepo.all<any>('stockItems');
    const strip = (d: any): StockItem => {
      const { __docId, kind, ...rest } = d;
      return rest as StockItem;
    };
    return {
      rawMaterials: items.filter((i) => i.kind !== 'cleaning').map(strip),
      cleaning: items.filter((i) => i.kind === 'cleaning').map(strip),
      equipment: clean<EquipmentItem>(FirestoreRepo.all('equipment')),
      kegs: clean<KegItem>(FirestoreRepo.all('kegs'))
    };
  },

  saveStocks(stocks: {
    rawMaterials: StockItem[];
    cleaning: StockItem[];
    equipment: EquipmentItem[];
    kegs: KegItem[];
  }) {
    const tagged = [
      ...(stocks.rawMaterials || []).map((s) => ({ ...s, kind: 'rawMaterials' as const })),
      ...(stocks.cleaning || []).map((s) => ({ ...s, kind: 'cleaning' as const }))
    ];
    syncCollection('stockItems', tagged, (s) => s.ref);
    syncCollection('equipment', stocks.equipment || [], (e) => e.ref);
    syncCollection('kegs', stocks.kegs || [], (k) => k.id);
  },

  addStockItem(type: 'rawMaterials' | 'cleaning', item: StockItem) {
    FirestoreRepo.put('stockItems', item.ref, { ...item, kind: type });
    this.logAction(
      'Création',
      'Stocks',
      item.ref,
      `Nouvel article créé : ${item.name} (${item.currentStock} ${item.unit})`,
      `Catégorie : ${item.category} · Min : ${item.minStock} · Max : ${item.maxStock || 'illimité'}`
    );
  },

  /** Persist accepted technical facts without replacing quantities or other stock fields. */
  learnIngredient(name: string, facts: Partial<StockItem>) {
    const key = name.trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ');
    if (!key) return;
    const item = this.getStocks().rawMaterials.find(s =>
      s.name.trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ') === key &&
      (!facts.category || s.category.toLocaleLowerCase('fr') === facts.category.toLocaleLowerCase('fr')));
    const fields: Array<keyof StockItem> = ['colorEbc', 'potentialPpg', 'alphaPct', 'yeastLab',
      'yeastStrain', 'yeastForm', 'yeastAttenuationPct', 'yeastTempMinC', 'yeastTempMaxC'];
    const patch: Partial<StockItem> = {};
    for (const field of fields) {
      const value = facts[field];
      if (value == null || value === '' || (typeof value === 'number' && !Number.isFinite(value))) continue;
      const missing = item?.[field] == null || item[field] === '' ||
        (item[field] === 0 && ['potentialPpg', 'alphaPct', 'yeastAttenuationPct'].includes(field));
      if (!missing) continue;
      (patch as Record<string, unknown>)[field] = value;
    }
    if (!Object.keys(patch).length) return;
    if (facts.technicalSource) patch.technicalSource = facts.technicalSource;
    if (item) {
      FirestoreRepo.put('stockItems', item.ref, patch, { merge: true });
    } else if (['Malt', 'Houblon', 'Levure'].includes(facts.category)) {
      // Stable key prevents duplicate catalogue entries while the Firestore snapshot catches up.
      const ref = `FICHE-${encodeURIComponent(facts.category + ':' + key)}`;
      FirestoreRepo.put('stockItems', ref, { id: ref, ref, name: name.trim(), category: facts.category,
        unit: facts.category === 'Levure' ? 'sachet' : facts.category === 'Houblon' ? 'g' : 'kg',
        currentStock: 0, minStock: 0, reorder: false, kind: 'rawMaterials', ...patch }, { merge: true });
    }
  },

  deleteStockItem(type: 'rawMaterials' | 'cleaning', ref: string) {
    const target = this.getStocks()[type].find((s) => s.ref === ref);
    FirestoreRepo.remove('stockItems', ref);
    if (target) {
      this.logAction('Suppression', 'Stocks', ref, `Article supprimé du stock : ${target.name}`);
    }
  },

  updateStockItem(type: 'rawMaterials' | 'cleaning', item: StockItem) {
    const old = this.getStocks()[type].find((s) => s.ref === item.ref);
    FirestoreRepo.put('stockItems', item.ref, { ...item, kind: type });
    this.logAction(
      'Modification',
      'Stocks',
      item.ref,
      `Ajustement stock ${item.name} : ${item.currentStock} ${item.unit} (Min: ${item.minStock}, Max: ${item.maxStock || '—'})`,
      old ? `Précédent : ${old.currentStock} ${old.unit}` : undefined
    );
  },

  /**
   * Correction d'inventaire — le SEUL moyen de modifier un stock à la main.
   *
   * ⚠️ Pourquoi c'est séparé : les listes portaient des boutons `+/−` directs.
   * Or un stock de malt ne baisse qu'en brassant, et ne monte qu'à la
   * réception d'un achat. Retoucher la quantité d'un doigt qui glisse
   * détruisait silencieusement la traçabilité — et l'écart n'apparaissait
   * nulle part.
   *
   * On saisit désormais le stock RÉELLEMENT COMPTÉ, et un motif. L'écart entre
   * le théorique et le compté est calculé, journalisé, et c'est lui
   * l'information : un écart récurrent sur un article dit qu'il se casse, se
   * perd, ou que les réceptions sont mal saisies.
   */
  adjustInventory(
    type: 'rawMaterials' | 'cleaning',
    ref: string,
    countedQty: number,
    reason: InventoryReason,
    note?: string
  ): { delta: number } | null {
    const item = this.getStocks()[type].find((s) => s.ref === ref);
    if (!item) return null;

    const delta = Units.round(countedQty - item.currentStock, item.unit);
    FirestoreRepo.put('stockItems', ref, {
      ...item,
      currentStock: Units.round(countedQty, item.unit),
      kind: type
    });

    this.logAction(
      'Modification',
      'Stocks',
      ref,
      `Inventaire ${item.name} : ${Units.format(item.currentStock, item.unit)} ➔ ${Units.format(countedQty, item.unit)} (${delta >= 0 ? '+' : ''}${Units.format(delta, item.unit)})`,
      `Motif : ${INVENTORY_REASONS[reason]}${note ? ` — ${note}` : ''}`
    );

    return { delta };
  },

  /*
   * Matériel et fûts.
   *
   * ⚠️ Ils n'avaient AUCUNE méthode d'écriture individuelle : ni création, ni
   * modification, ni suppression. Un fût cassé restait dans la liste pour
   * toujours, et un nouvel appareil ne pouvait entrer que par une réécriture
   * complète du tableau depuis `saveStocks`.
   */

  addEquipment(item: EquipmentItem) {
    FirestoreRepo.put('equipment', item.ref, item);
    this.logAction(
      'Création',
      'Stocks',
      item.ref,
      `Matériel ajouté : ${item.name}`,
      `Catégorie : ${item.category} · État : ${item.state}`
    );
  },

  updateEquipment(item: EquipmentItem) {
    const old = this.getStocks().equipment.find((e) => e.ref === item.ref);
    FirestoreRepo.put('equipment', item.ref, item);
    this.logAction(
      'Modification',
      'Stocks',
      item.ref,
      `Matériel ${item.name} : état [${item.state}]`,
      old ? `Ancien état : [${old.state}]` : undefined
    );
  },

  deleteEquipment(ref: string) {
    const target = this.getStocks().equipment.find((e) => e.ref === ref);
    FirestoreRepo.remove('equipment', ref);
    if (target) {
      this.logAction('Suppression', 'Stocks', ref, `Matériel supprimé : ${target.name}`);
    }
  },

  addKeg(keg: KegItem) {
    FirestoreRepo.put('kegs', keg.id, keg);
    this.logAction(
      'Création',
      'Fûts',
      keg.id,
      `Fût ajouté : ${keg.id} (${keg.capacityL} L)`,
      `État initial : [${keg.state}]`
    );
  },

  updateKeg(keg: KegItem) {
    const old = this.getStocks().kegs.find((k) => k.id === keg.id);
    FirestoreRepo.put('kegs', keg.id, keg);
    this.logAction(
      'Statut',
      'Fûts',
      keg.id,
      `Fût ${keg.id} : état passé à [${keg.state.toUpperCase()}]`,
      old ? `Ancien état : [${old.state}] · Bière : ${keg.beerName || 'aucune'}` : undefined
    );
  },

  // 3. PRODUCTION
  /**
   * Les brassins, ramenés à la forme courante À LA LECTURE.
   *
   * Les enregistrements antérieurs à la refonte portent `step: '60 min'` et
   * `yeastName: 'US-05'`. On les traduit ici plutôt que de réécrire la base :
   * une migration qui touche de vraies données ne se rejoue pas.
   */
  getBatches(): Batch[] {
    return clean<Batch>(FirestoreRepo.all('batches')).map(normalizeBatch);
  },

  saveBatches(batches: Batch[]) {
    syncCollection('batches', batches, (b) => b.id);
  },

  addBatch(batch: Batch) {
    FirestoreRepo.put('batches', batch.id, batch);
    this.logAction(
      'Création',
      'Production',
      batch.id,
      `Nouveau lot créé : ${batch.id} - ${batch.name} (${batch.volumeL}L)`,
      `Style : ${batch.style} · Statut : ${batch.status}`
    );
  },

  updateBatch(batch: Batch, stockCommit?: { previous: Batch['stockConsumption'] }) {
    if(batch.nolo) assertNoloConfig(batch.nolo);
    if(batch.recipeSnapshot?.nolo) assertNoloConfig(batch.recipeSnapshot.nolo);
    const old = this.getBatches().find((b) => b.id === batch.id);
    if (stockCommit && !sameDoc(old?.stockConsumption, stockCommit.previous)) throw new Error('Le stock de ce brassin a changé. Recharge sa fiche avant de confirmer.');
    // An ordinary form may be hours old or offline. Omit the stock marker entirely,
    // so merging on the server cannot erase or regress a completed consumption.
    const { stockConsumption: _stockConsumption, ...ordinary } = batch;
    FirestoreRepo.put('batches', batch.id, stockCommit ? batch : ordinary, { merge: true });
    this.logAction(
      'Modification',
      'Production',
      batch.id,
      `Brassin ${batch.id} mis à jour : Statut [${batch.status}] · OG ${batch.og || '—'} · FG ${batch.fg || '—'}`,
      old ? `Ancien statut : ${old.status} · Vol : ${batch.volumeL}L` : undefined
    );
  },

  /**
   * Lance un brassin depuis une recette et déduit les ingrédients.
   *
   * Le rapprochement se fait sur le nom complet, catégorie par catégorie, et la
   * conversion d'unités passe par `Units` : la version précédente cherchait le
   * premier article contenant le premier mot du nom (« Malt Pale Ale » ➔ jeton
   * « malt »), ce qui pouvait débiter silencieusement le mauvais malt.
   */
  /** Compatibility name: planning never consumes ingredients. */
  brewRecipeAndDeductStocks(recipe: Recipe, batchId: string): Batch {
    const existing = this.getBatches().find(b => b.id === batchId);
    if (existing) return existing;
    const batch: Batch = {
      id: batchId, brewDate: recipe.brewDate ?? new Date().toLocaleDateString('fr-CH'),
      name: recipe.name, style: recipe.style, volumeL: recipe.volumeL,
      status: 'planifie', stockAccountingVersion: 1,
      recipeRef: recipe.id, recipeSnapshot: captureSnapshot(recipe), gravityLog: []
    };
    this.addBatch(batch);
    return batch;
  },

  /** Save production progress and consume verified ingredients once, in the same batch. */
  completeBrewStock(updated: Batch, stage: 'brewday' | 'remaining' | 'historical-already' | 'historical-unconsumed' = 'brewday', confirmHistorical = false): { success: boolean; issues: string[] } {
    const live = this.getBatches().find(b => b.id === updated.id);
    const batch = { ...updated, stockAccountingVersion: live ? live.stockAccountingVersion : updated.stockAccountingVersion, stockConsumption: live?.stockConsumption };
    if (stage === 'historical-already' || stage === 'historical-unconsumed') {
      if (!confirmHistorical) return { success: false, issues: ['Confirme explicitement le suivi historique du stock.'] };
      if (live?.stockConsumption) return { success: false, issues: ['Une consommation est déjà enregistrée. Recharge le dossier pour voir le suivi actuel.'] };
      const now = new Date().toISOString();
      const marker: Batch['stockConsumption'] = stage === 'historical-already' ? { appliedAt: now, eventId: `HISTORICAL-CONFIRMED-${batch.id}`, items: [], pendingItems: [], completedStages: ['brewday', 'remaining'], historicalConfirmation: { choice: 'already-consumed', confirmedAt: now } } : undefined;
      this.updateBatch({ ...batch, stockAccountingVersion: 1, stockReviewIssues: [], ...(marker ? { stockConsumption: marker } : {}) }, { previous: live?.stockConsumption });
      return { success: true, issues: [] };
    }
    if (batch.stockAccountingVersion !== 1 && !confirmHistorical) {
      const issues = ['Brassin historique : confirmer si les ingrédients ont déjà été retirés avant de modifier le stock.'];
      this.updateBatch({ ...batch, stockReviewIssues: issues });
      return { success: false, issues };
    }
    const stocks = this.getStocks();
    const all = [...stocks.rawMaterials, ...stocks.cleaning];
    const plan = FirestoreRepo.all<any>('financialPlans').filter(p => p.brewEstimate?.batchId === batch.id)
      .sort((a,b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
    const proposal = prepareBrewStockConsumption(batch, all, { stage, bindings: plan?.brewEstimate?.bindings });
    if (proposal.status === 'needs-review') {
      this.updateBatch({ ...batch, stockReviewIssues: proposal.issues });
      return { success: false, issues: proposal.issues };
    }
    if (proposal.status === 'ready') {
      for (const movement of proposal.movements) {
        const stock = proposal.stockUpdates.find(s => s.ref === movement.itemRef);
        FirestoreRepo.adjustNumber('stockItems', movement.itemRef, 'currentStock', movement.delta, stock ? { reorder: stock.reorder } : {});
        FirestoreRepo.put('movements', movement.id, movement);
      }
    }
    this.updateBatch({ ...proposal.batch, stockAccountingVersion: 1, stockReviewIssues: [] }, { previous: live?.stockConsumption });
    return { success: true, issues: [] };
  },

  /**
   * Supprime un brassin.
   *
   * ⚠️ Ne restaure PAS les ingrédients consommés : supprimer n'est pas annuler.
   * Pour rendre les ingrédients au stock, passer le brassin en « annulé », qui
   * conserve la trace de ce qui s'est passé. La suppression est faite pour les
   * saisies erronées, pas pour les brassins ratés.
   */
  deleteBatch(id: string) {
    const target = this.getBatches().find((b) => b.id === id);
    FirestoreRepo.remove('batches', id);
    if (target) {
      this.logAction(
        'Suppression',
        'Production',
        id,
        `Brassin supprimé : ${target.id} — ${target.name}`,
        `Statut au moment de la suppression : ${target.status}`
      );
    }
  },

  // 4. RECETTES
  getRecipes(): Recipe[] {
    return clean<Recipe>(FirestoreRepo.all('recipes')).map(normalizeRecipe);
  },

  /**
   * Met à jour UNE recette.
   *
   * ⚠️ Cette méthode manquait : `saveRecipes()` réécrivait tout le tableau,
   * donc éditer une recette rejouait l'écriture de toutes les autres — et deux
   * onglets ouverts pouvaient s'écraser mutuellement.
   */
  updateRecipe(recipe: Recipe) {
    if(recipe.nolo){assertNoloConfig(recipe.nolo);recipe={...recipe,nolo:{...recipe.nolo,scienceSnapshot:recipe.nolo.scienceSnapshot??noloScience(this.getHopKnowledge())}};}
    const old = this.getRecipes().find((r) => r.id === recipe.id);
    FirestoreRepo.put('recipes', recipe.id, recipe);
    this.logAction(
      'Modification',
      'Production',
      recipe.id,
      `Recette « ${recipe.name} » mise à jour`,
      // ⚠️ Lire `malts` ici LEVAIT sur toute recette créée depuis la refonte :
      // le champ est déprécié et absent, seul `fermentables` existe. Modifier
      // une recette récente plantait donc au moment d'écrire le journal.
      old
        ? `${(old.fermentables ?? []).length} ➔ ${(recipe.fermentables ?? []).length} fermentescibles · ` +
          `${(old.hops ?? []).length} ➔ ${(recipe.hops ?? []).length} houblons`
        : undefined
    );
  },

  saveRecipes(recipes: Recipe[]) {
    recipes=recipes.map(recipe=>{if(!recipe.nolo)return recipe;assertNoloConfig(recipe.nolo);return {...recipe,nolo:{...recipe.nolo,scienceSnapshot:recipe.nolo.scienceSnapshot??noloScience(this.getHopKnowledge())}};});
    syncCollection('recipes', recipes, (r) => r.id);
  },

  addRecipe(recipe: Recipe) {
    if(recipe.nolo){assertNoloConfig(recipe.nolo);recipe={...recipe,nolo:{...recipe.nolo,scienceSnapshot:recipe.nolo.scienceSnapshot??noloScience(this.getHopKnowledge())}};}
    FirestoreRepo.put('recipes', recipe.id, recipe);
    this.logAction(
      'Création',
      'Production',
      recipe.id,
      `Nouvelle fiche recette : ${recipe.name} (${recipe.volumeL}L)`
    );
  },

  deleteRecipe(id: string) {
    const target = this.getRecipes().find((r) => r.id === id);
    FirestoreRepo.remove('recipes', id);
    if (target) {
      this.logAction('Suppression', 'Production', id, `Recette supprimée : ${target.name}`);
    }
  },

  // 5. CLIENTS
  getClients(): Client[] {
    return clean<Client>(FirestoreRepo.all('clients'));
  },

  saveClients(clients: Client[]) {
    syncCollection('clients', clients, (c) => c.id);
  },

  updateClient(client: Client) {
    FirestoreRepo.put('clients', client.id, client);
    this.logAction(
      'Modification',
      'Clients',
      client.id,
      `Fiche client ${client.name} modifiée`,
      `Contact : ${client.contact} · Tél : ${client.phone} · Email : ${client.email}`
    );
  },

  deleteClient(id: string) {
    const target = this.getClients().find((c) => c.id === id);
    FirestoreRepo.remove('clients', id);
    if (target) {
      this.logAction('Suppression', 'Clients', id, `Client supprimé : ${target.name}`);
    }
  },

  deleteKeg(id: string) {
    const target = this.getStocks().kegs.find((k) => k.id === id);
    FirestoreRepo.remove('kegs', id);
    if (target) {
      this.logAction(
        'Suppression',
        'Fûts',
        id,
        `Fût supprimé : ${target.id} (${target.capacityL} L)`,
        target.beerName ? `Contenait : ${target.beerName}` : undefined
      );
    }
  },

  // 6. PLANNING
  getPlanning(): GanttTask[] {
    return clean<GanttTask>(FirestoreRepo.all('planning'));
  },

  savePlanning(planning: GanttTask[]) {
    syncCollection('planning', planning, (p) => p.id);
  },

  // 7. BUDGET
  getBudgetLines(): BudgetLine[] {
    return clean<BudgetLine>(FirestoreRepo.all('budgetLines'));
  },

  saveBudgetLines(lines: BudgetLine[]) {
    syncCollection('budgetLines', lines, (l, i) => `LINE-${l.row ?? i}`);
  },

  // 8. TARIFS
  getTarifs(): PricingItem[] {
    return clean<PricingItem>(FirestoreRepo.all('tarifs'));
  },

  /*
   * Tarifs et planning.
   *
   * ⚠️ Ils s'affichaient mais ne se modifiaient pas : aucune méthode d'écriture
   * ligne à ligne n'existait. Un prix devenu faux restait affiché, une tâche
   * terminée restait ouverte.
   *
   * Ni l'un ni l'autre ne porte d'identifiant : on adresse donc par le libellé
   * (`product`, `description`), qui est ce que Gaëtan lit à l'écran.
   */

  updateTarif(tarif: PricingItem) {
    const all = this.getTarifs();
    const i = all.findIndex((t) => t.product === tarif.product);
    const next = i >= 0 ? all.map((t, j) => (j === i ? tarif : t)) : [...all, tarif];
    this.saveTarifs(next);
    this.logAction(
      i >= 0 ? 'Modification' : 'Création',
      'Clients',
      tarif.product,
      `Tarif ${tarif.product} : ${tarif.priceHT.toFixed(2)} CHF HT · marge ${tarif.marginPercent.toFixed(1)} %`
    );
  },

  deleteTarif(product: string) {
    const target = this.getTarifs().find((t) => t.product === product);
    this.saveTarifs(this.getTarifs().filter((t) => t.product !== product));
    if (target) {
      this.logAction('Suppression', 'Clients', product, `Tarif supprimé : ${product}`);
    }
  },

  updatePlanningTask(task: GanttTask) {
    const all = this.getPlanning();
    const i = all.findIndex((t) => t.id === task.id);
    this.savePlanning(i >= 0 ? all.map((t, j) => (j === i ? task : t)) : [...all, task]);
    this.logAction(
      i >= 0 ? 'Modification' : 'Création',
      'Configuration',
      task.id,
      `Tâche ${task.description}${task.completed ? ' — terminée' : ''}`
    );
  },

  deletePlanningTask(id: string) {
    const target = this.getPlanning().find((t) => t.id === id);
    this.savePlanning(this.getPlanning().filter((t) => t.id !== id));
    if (target) {
      this.logAction('Suppression', 'Configuration', id, `Tâche supprimée : ${target.description}`);
    }
  },

  saveTarifs(tarifs: PricingItem[]) {
    syncCollection('tarifs', tarifs, (t, i) => slugify(t.product) || `TARIF-${i}`);
  },

  // 9. CONFIGURATION
  getConfig(): AppConfig {
    const docs = FirestoreRepo.all<any>('config');
    const stored = docs.find((d) => d.__docId === 'app');
    if (!stored) return defaultConfig;
    const { __docId, ...rest } = stored;
    return {
      ...defaultConfig,
      ...rest,
      company: { ...defaultConfig.company, ...(rest.company || {}) },
      fiscal: { ...defaultConfig.fiscal, ...(rest.fiscal || {}) },
      security: { ...defaultConfig.security, ...(rest.security || {}) }
    };
  },

  saveConfig(config: AppConfig) {
    FirestoreRepo.put('config', 'app', config);
  },

  confirmPendingWrites() { return FirestoreRepo.waitForWrites(); },

  // 10. GABARITS DE DÉPENSE
  getExpenseTemplates(): ExpenseTemplate[] {
    const stored = clean<ExpenseTemplate>(FirestoreRepo.all('expenseTemplates'));
    return stored;
  },

  saveExpenseTemplates(templates: ExpenseTemplate[]) {
    syncCollection('expenseTemplates', templates, (t) => t.id);
  },

  addExpenseTemplate(tpl: ExpenseTemplate) {
    FirestoreRepo.put('expenseTemplates', tpl.id, tpl);
  },

  deleteExpenseTemplate(id: string) {
    FirestoreRepo.remove('expenseTemplates', id);
  },

  /**
   * Fournisseurs récurrents, déduits UNIQUEMENT des écritures réelles.
   * Pour chaque fournisseur on retient la catégorie et le taux de TVA les plus
   * fréquemment utilisés, afin de pré-remplir la saisie suivante.
   */
  getFrequentVendors(): Array<{
    name: string;
    category: FinanceCategory;
    tvaRate: number;
    count: number;
  }> {
    const txs = this.getTransactions();
    const vendorMap = new Map<
      string,
      { count: number; categories: Map<FinanceCategory, number>; rates: Map<number, number> }
    >();

    txs.forEach((t) => {
      if (t.category === 'recettes' || t.category === 'apports') return;

      const name = (t.proofNotes?.replace(/^Fournisseur:\s*/i, '') || '').split('·')[0].trim();
      if (!name || name.length < 3) return;

      const entry = vendorMap.get(name) ?? {
        count: 0,
        categories: new Map<FinanceCategory, number>(),
        rates: new Map<number, number>()
      };
      entry.count += 1;
      entry.categories.set(t.category, (entry.categories.get(t.category) ?? 0) + 1);
      entry.rates.set(t.tvaRate, (entry.rates.get(t.tvaRate) ?? 0) + 1);
      vendorMap.set(name, entry);
    });

    const mostFrequent = <T,>(m: Map<T, number>, fallback: T): T => {
      let best = fallback;
      let bestCount = 0;
      m.forEach((count, key) => {
        if (count > bestCount) {
          bestCount = count;
          best = key;
        }
      });
      return best;
    };

    return Array.from(vendorMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        category: mostFrequent<FinanceCategory>(data.categories, 'divers'),
        tvaRate: mostFrequent<number>(data.rates, 0.081)
      }))
      .sort((a, b) => b.count - a.count);
  },

  // 11. ATELIER R&D
  getCreativeItems(): CreativeItem[] {
    const stored = clean<CreativeItem>(FirestoreRepo.all('creativeItems'));
    return stored;
  },

  saveCreativeItems(items: CreativeItem[]) {
    syncCollection('creativeItems', items, (i) => i.id);
  },

  addCreativeItem(item: CreativeItem) {
    FirestoreRepo.put('creativeItems', item.id, item);
  },

  updateCreativeItem(item: CreativeItem) {
    FirestoreRepo.put('creativeItems', item.id, item);
  },

  deleteCreativeItem(id: string) {
    FirestoreRepo.remove('creativeItems', id);
  },

  /**
   * Épingle ou dépingle une entité.
   *
   * Un seul point d'entrée pour les quatre types concernés : les favoris
   * remontent ensuite automatiquement en tête des listes, des autocomplétions
   * et de la palette de recherche.
   */
  toggleFavorite(kind: 'stockItem' | 'recipe' | 'batch' | 'client' | 'template', id: string) {
    switch (kind) {
      case 'stockItem': {
        const stocks = this.getStocks();
        const item =
          stocks.rawMaterials.find((s) => s.ref === id) ||
          stocks.cleaning.find((s) => s.ref === id);
        if (!item) return;
        const type = stocks.cleaning.some((s) => s.ref === id) ? 'cleaning' : 'rawMaterials';
        FirestoreRepo.put('stockItems', id, { ...item, kind: type, favorite: !item.favorite });
        break;
      }
      case 'recipe': {
        const r = this.getRecipes().find((x) => x.id === id);
        if (r) this.setCatalogFavorite('recipe', id, !r.favorite);
        break;
      }
      case 'batch': {
        const b = this.getBatches().find((x) => x.id === id);
        if (b) this.setCatalogFavorite('batch', id, !b.favorite);
        break;
      }
      case 'client': {
        const c = this.getClients().find((x) => x.id === id);
        if (c) FirestoreRepo.put('clients', id, { ...c, favorite: !c.favorite });
        break;
      }
      case 'template': {
        const t = this.getExpenseTemplates().find((x) => x.id === id);
        if (t) FirestoreRepo.put('expenseTemplates', id, { ...t, favorite: !t.favorite });
        break;
      }
    }
  },

  // ORGANISATION DU CARNET — ne modifie ni les recettes ni le journal de brassage.
  setCatalogFavorite(kind: 'recipe' | 'batch', id: string, favorite: boolean): boolean {
    return !!writeCatalogOrganization(kind, id, { favorite });
  },

  setCatalogArchived(kind: 'recipe' | 'batch', id: string, archived: boolean): boolean {
    const changed = writeCatalogOrganization(kind, id, {
      archivedAt: archived ? new Date().toISOString() : null
    });
    if (!changed) return false;
    this.logAction(
      'Modification', 'Production', id,
      `${kind === 'recipe' ? 'Recette' : 'Brassin'} « ${changed.name} » ${archived ? 'classé dans les archives' : 'remis dans le carnet courant'}`
    );
    return true;
  },

  // SAUVEGARDE & RESTAURATION
  exportAllData(): string {
    return deviceBackup();
  },

  importAllData(jsonStr: string) {
    return restoreBackup(jsonStr);
  },

  /**
   * Efface les préférences locales. Ne touche PAS aux données Firestore :
   * supprimer la comptabilité doit être une action délibérée et explicite,
   * pas un effet de bord d'un bouton « réinitialiser ».
   */
  resetToInitial() {
    localStorage.removeItem(LOCAL_KEYS.UI_STATE);
    Object.keys(localCache).forEach((k) => delete localCache[k]);
    this.notify();
  }
};

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
import { assertNoloConfig } from '../../functions/src/noloSchema';
import { noloScience } from '../domain/noloScience';
