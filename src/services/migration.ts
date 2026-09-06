import { FirestoreRepo, CollectionName } from './firestoreRepo';
import {
  initialCompany,
  initialFinances,
  initialStocks,
  initialProduction,
  initialRecipes,
  initialClients,
  initialPlanning,
  initialTarifs,
  initialBudgetLines,
  initialBrewhouses
} from '../data/seedData';
import { Transaction, FinanceCategory, AppConfig } from '../types';
import { defaultExpenseTemplates, defaultCreativeItems } from './storage';

/**
 * Migration unique localStorage ➔ Firestore.
 *
 * Se déclenche au premier lancement après la bascule. Trois cas :
 *   1. Firestore contient déjà des données  ➔ on ne touche à rien.
 *   2. Firestore est vide, localStorage a des données ➔ on reprend l'existant.
 *   3. Les deux sont vides ➔ on installe le jeu de données initial.
 *
 * Un drapeau de version empêche de rejouer l'opération. localStorage n'est
 * JAMAIS effacé : il reste comme filet de sécurité tant que Gaëtan n'a pas
 * confirmé que tout est bien passé.
 */

const MIGRATION_FLAG = 'laffinee_firestore_migration_v1';

const LEGACY_KEYS = {
  TRANSACTIONS: 'laffinee_transactions',
  STOCKS: 'laffinee_stocks',
  PRODUCTION: 'laffinee_production',
  RECIPES: 'laffinee_recipes',
  CLIENTS: 'laffinee_clients',
  PLANNING: 'laffinee_planning',
  CONFIG: 'laffinee_config',
  TARIFS: 'laffinee_tarifs',
  BUDGET: 'laffinee_budget',
  AUDIT_LOGS: 'laffinee_audit_logs',
  TEMPLATES: 'laffinee_expense_templates',
  CREATIVE: 'laffinee_creative_items'
};

export interface MigrationReport {
  ran: boolean;
  source: 'localStorage' | 'seed' | 'aucune';
  counts: Record<string, number>;
  error?: string;
}

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Aplatit les finances initiales, en ne gardant que les vraies écritures. */
function seedTransactions(): Transaction[] {
  const list: Transaction[] = [];
  Object.keys(initialFinances).forEach((cat) => {
    (initialFinances[cat] || []).forEach((item) => {
      if (typeof item.amountHT === 'number' && item.amountHT > 0) {
        list.push({ ...item, category: cat as FinanceCategory });
      }
    });
  });
  return list;
}

export function hasMigrated(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === 'done';
}

export function markMigrated() {
  try {
    localStorage.setItem(MIGRATION_FLAG, 'done');
  } catch {
    /* le drapeau est un confort, pas une garantie */
  }
}

export function resetMigrationFlag() {
  localStorage.removeItem(MIGRATION_FLAG);
}

/**
 * Construit la liste des documents à écrire, depuis localStorage si possible,
 * sinon depuis le jeu de données initial.
 */
function buildEntries(): {
  entries: Array<{ name: CollectionName; id: string; data: any }>;
  source: 'localStorage' | 'seed';
  counts: Record<string, number>;
} {
  const entries: Array<{ name: CollectionName; id: string; data: any }> = [];
  const counts: Record<string, number> = {};

  const legacyTx = readLocal<Transaction[]>(LEGACY_KEYS.TRANSACTIONS);
  const legacyStocks = readLocal<typeof initialStocks>(LEGACY_KEYS.STOCKS);
  const source: 'localStorage' | 'seed' =
    (legacyTx && legacyTx.length > 0) || legacyStocks ? 'localStorage' : 'seed';

  const add = (name: CollectionName, id: string, data: any) => {
    entries.push({ name, id, data });
    counts[name] = (counts[name] ?? 0) + 1;
  };

  // --- Écritures comptables ---
  const transactions = legacyTx && legacyTx.length > 0 ? legacyTx : seedTransactions();
  transactions
    .filter((t) => t && t.id && t.amountHT > 0)
    .forEach((t) => add('transactions', t.id, t));

  // --- Stocks : matières premières + nettoyage dans une seule collection,
  //     distinguées par `kind` (ce qui simplifie l'autocomplétion plus tard). ---
  const stocks = legacyStocks || initialStocks;
  (stocks.rawMaterials || []).forEach((s) =>
    add('stockItems', s.ref, { ...s, kind: 'rawMaterials' })
  );
  (stocks.cleaning || []).forEach((s) => add('stockItems', s.ref, { ...s, kind: 'cleaning' }));
  (stocks.equipment || []).forEach((e) => add('equipment', e.ref, e));
  (stocks.kegs || []).forEach((k) => add('kegs', k.id, k));

  // --- Production ---
  const batches = readLocal<typeof initialProduction>(LEGACY_KEYS.PRODUCTION) || initialProduction;
  batches.forEach((b) => add('batches', b.id, b));

  const recipes = readLocal<typeof initialRecipes>(LEGACY_KEYS.RECIPES) || initialRecipes;
  recipes.forEach((r) => add('recipes', r.id, r));

  // --- Clients ---
  const clients = readLocal<typeof initialClients>(LEGACY_KEYS.CLIENTS) || initialClients;
  clients.forEach((c) => add('clients', c.id, c));

  // --- Planning ---
  const planning = readLocal<typeof initialPlanning>(LEGACY_KEYS.PLANNING) || initialPlanning;
  planning.forEach((p) => add('planning', p.id, p));

  // --- Budget : pas d'identifiant naturel, on utilise le numéro de ligne. ---
  const budget = readLocal<typeof initialBudgetLines>(LEGACY_KEYS.BUDGET) || initialBudgetLines;
  budget.forEach((b, i) => add('budgetLines', `LINE-${b.row ?? i}`, b));

  // --- Tarifs : idem, indexés sur le nom de produit assaini. ---
  const tarifs = readLocal<typeof initialTarifs>(LEGACY_KEYS.TARIFS) || initialTarifs;
  tarifs.forEach((t, i) =>
    add('tarifs', slugify(t.product) || `TARIF-${i}`, t)
  );

  // --- Gabarits & atelier R&D ---
  // Les valeurs par défaut sont ÉCRITES en base, pas seulement renvoyées à la
  // volée : sans document réel, supprimer un gabarit par défaut ne faisait rien
  // (la suppression visait un document inexistant, et la valeur par défaut
  // réapparaissait au rechargement).
  const templates = readLocal<any[]>(LEGACY_KEYS.TEMPLATES);
  (templates && templates.length > 0 ? templates : defaultExpenseTemplates).forEach((t) =>
    add('expenseTemplates', t.id, t)
  );

  const creative = readLocal<any[]>(LEGACY_KEYS.CREATIVE);
  (creative && creative.length > 0 ? creative : defaultCreativeItems).forEach((c) =>
    add('creativeItems', c.id, c)
  );

  // --- Journal d'audit (on garde les 300 derniers, comme avant) ---
  const logs = readLocal<any[]>(LEGACY_KEYS.AUDIT_LOGS);
  if (logs) logs.slice(0, 300).forEach((l) => add('auditLogs', l.id, l));

  // --- Configuration : un unique document `app` ---
  const legacyConfig = readLocal<Partial<AppConfig>>(LEGACY_KEYS.CONFIG);
  const config = {
    company: legacyConfig?.company ?? initialCompany,
    fiscal: legacyConfig?.fiscal,
    brewhouses: legacyConfig?.brewhouses ?? initialBrewhouses,
    activeBrewhouseId: legacyConfig?.activeBrewhouseId ?? 'bh-30',
    // ⚠️ `geminiApiKey` n'est volontairement PAS repris : la clé ne doit plus
    // jamais transiter par le navigateur, elle vit désormais dans Secret Manager
    // côté Cloud Function.
    googleDriveFolderId: legacyConfig?.googleDriveFolderId,
    security: { currentUser: legacyConfig?.security?.currentUser ?? 'Gaëtan' }
  };
  add('config', 'app', config);

  return { entries, source, counts };
}

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function buildSeedEntries() {
  return buildEntries();
}

/**
 * Exécute la migration si nécessaire. À appeler une fois l'utilisateur
 * authentifié (les règles Firestore refusent tout accès anonyme).
 */
export async function runMigrationIfNeeded(): Promise<MigrationReport> {
  // En développement local sans Firestore (dev-local), on peuple directement la mémoire
  if (
    import.meta.env.DEV &&
    typeof location !== 'undefined' &&
    new URLSearchParams(location.search).has('dev-local')
  ) {
    const { entries, source, counts } = buildEntries();
    await FirestoreRepo.bulkWrite(entries);
    return { ran: true, source, counts };
  }

  if (hasMigrated()) {
    return { ran: false, source: 'aucune', counts: {} };
  }

  try {
    // Si la base contient déjà des écritures ou des stocks, un autre appareil
    // a déjà fait le travail : on se contente de poser le drapeau.
    const [txEmpty, stockEmpty] = await Promise.all([
      FirestoreRepo.isEmpty('transactions'),
      FirestoreRepo.isEmpty('stockItems')
    ]);

    if (!txEmpty || !stockEmpty) {
      markMigrated();
      return { ran: false, source: 'aucune', counts: {} };
    }

    const { entries, source, counts } = buildEntries();
    await FirestoreRepo.bulkWrite(entries);
    markMigrated();

    console.info(
      `[Migration] ${entries.length} documents écrits dans Firestore (source : ${source}).`,
      counts
    );
    return { ran: true, source, counts };
  } catch (err: any) {
    console.error('[Migration] échec', err);
    return {
      ran: false,
      source: 'aucune',
      counts: {},
      error: err?.message || 'Migration vers Firestore impossible.'
    };
  }
}
