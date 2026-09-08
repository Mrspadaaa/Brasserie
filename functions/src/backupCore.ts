import { BACKUP_COLLECTIONS as BUSINESS_COLLECTIONS, BackupCollection as BusinessCollection } from './dataSchema.js';
import { assertHopDocument } from './hopIndexSchema.js';
import { assertHopKnowledge, assertHopTasting } from './hopPredictionSchema.js';
import { assertHopPredictionSnapshot } from './hopPredictionValidation.js';

export interface BackupDocument { id: string; data: Record<string, any> }
export interface BreweryBackup {
  schemaVersion: 3;
  exportedAt: string;
  source: 'server' | 'device' | 'legacy';
  collections: Partial<Record<BusinessCollection, BackupDocument[]>>;
}
const plain = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 &&
  id.length < 1500 && !id.includes('/') && !/^\.{1,2}$/.test(id) && !/^__.*__$/.test(id);

/** Validate the WHOLE file before scheduling any write; arrays keep their positions. */
function checkValue(v: unknown, depth = 0): void {
  if (depth > 35) throw new Error('Sauvegarde trop imbriquée.');
  if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('Nombre invalide.');
  if (Array.isArray(v)) { v.forEach(x => checkValue(x, depth + 1)); return; }
  if (plain(v)) {
    for (const [key, value] of Object.entries(v)) {
      if (['__proto__', 'constructor', 'prototype', '__docId'].includes(key)) throw new Error('Champ technique interdit dans la sauvegarde.');
      checkValue(value, depth + 1);
    }
  }
}
export function parseBackup(json: string): BreweryBackup {
  if (typeof json !== 'string' || json.length > 8_000_000) throw new Error('Sauvegarde trop volumineuse (8 Mo maximum).');
  const raw: unknown = JSON.parse(json);
  if (!plain(raw)) throw new Error('Ce fichier ne contient pas une sauvegarde.');
  let backup: BreweryBackup;
  if (raw.schemaVersion === 3) {
    if (!plain(raw.collections)) throw new Error('Collections absentes de la sauvegarde.');
    backup = raw as BreweryBackup;
  } else if (raw.schemaVersion === 2 || raw.schemaVersion == null) {
    const collections: BreweryBackup['collections'] = {};
    const add = (collection: BusinessCollection, rows: unknown, idOf: (r: any, i: number) => string) => {
      if (rows == null) return;
      if (!Array.isArray(rows)) throw new Error(`Liste ${collection} invalide.`);
      collections[collection] = rows.map((data, i) => ({ id: idOf(data, i), data }));
    };
    const byId = (r: any) => r?.id;
    const mappings = { transactions: 'transactions', production: 'batches', recipes: 'recipes', clients: 'clients',
      planning: 'planning', auditLogs: 'auditLogs', expenseTemplates: 'expenseTemplates', creativeItems: 'creativeItems',
      movements: 'movements', finishedGoods: 'finishedGoods', reservations: 'reservations' } as const;
    for (const [key, col] of Object.entries(mappings)) add(col, raw[key], byId);
    add('budgetLines', raw.budgetLines, (r, i) => `LINE-${r?.row ?? i}`);
    add('tarifs', raw.tarifs, (r, i) => String(r?.product ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `TARIF-${i}`);
    if (raw.stocks != null) {
      if (!plain(raw.stocks)) throw new Error('Stocks invalides.');
      for (const kind of ['rawMaterials', 'cleaning']) {
        const rows = raw.stocks[kind];
        if (rows != null && !Array.isArray(rows)) throw new Error('Articles invalides.');
        collections.stockItems = [...(collections.stockItems ?? []), ...(rows ?? []).map((r: any) => ({ id: r?.ref, data: { ...r, kind } }))];
      }
      add('equipment', raw.stocks.equipment, r => r?.ref);
      add('kegs', raw.stocks.kegs, byId);
    }
    if (raw.config != null) collections.config = [{ id: 'app', data: raw.config }];
    backup = { schemaVersion: 3, source: 'legacy', exportedAt: raw.exportedAt ?? new Date(0).toISOString(), collections };
  } else throw new Error('Version de sauvegarde non prise en charge.');
  if (!Number.isFinite(Date.parse(backup.exportedAt))) throw new Error('Date de sauvegarde invalide.');
  if (!Object.keys(backup.collections).length) throw new Error('Ce fichier ne contient aucune collection à restaurer.');
  for (const [name, rows] of Object.entries(backup.collections)) {
    if (!(BUSINESS_COLLECTIONS as readonly string[]).includes(name) || !Array.isArray(rows)) throw new Error(`Collection invalide : ${name}.`);
    const seen = new Set<string>();
    for (const row of rows) {
      if (!plain(row) || !validId(row.id) || !plain(row.data) || !Object.keys(row.data).length || seen.has(row.id)) throw new Error(`Document invalide ou dupliqué dans ${name}.`);
      seen.add(row.id);
      checkValue(row.data);
      if (name === 'hopVarieties' || name === 'hopLots') assertHopDocument(name, row.data, row.id);
      if (name === 'hopKnowledge') assertHopKnowledge(row.data, row.id);
      if (name === 'hopPredictions') assertHopPredictionSnapshot(row.data, row.id);
      if (name === 'hopTastings') assertHopTasting(row.data, row.id);
      const numericFields: Record<string, string[]> = {
        recipes: ['volumeL', 'boilMin'], batches: ['volumeL'], stockItems: ['currentStock', 'minStock', 'maxStock'],
        transactions: ['amountHT', 'amountTTC', 'tvaRate'], kegs: ['capacityL']
      };
      for (const field of numericFields[name] ?? []) if (row.data[field] != null &&
        (typeof row.data[field] !== 'number' || !Number.isFinite(row.data[field]))) throw new Error(`Valeur ${field} invalide dans ${name}/${row.id}.`);
      if (['recipes', 'batches'].includes(name) && !(row.data.volumeL > 0)) throw new Error(`Volume invalide dans ${name}/${row.id}.`);
      if (['recipes', 'batches', 'transactions', 'clients', 'kegs', 'planning', 'creativeItems', 'expenseTemplates', 'auditLogs', 'movements', 'finishedGoods', 'reservations'].includes(name) && row.data.id !== row.id) throw new Error(`Identifiant incohérent dans ${name}/${row.id}.`);
      if (['stockItems', 'equipment'].includes(name) && row.data.ref !== row.id) throw new Error(`Référence incohérente dans ${name}/${row.id}.`);
      if (JSON.stringify(row.data).length > 700_000) throw new Error(`Document trop volumineux : ${name}/${row.id}.`);
    }
  }
  return backup;
}

/** Canonical key order, also used for integrity digests and no-op detection. */
export function stableJson(value: any): string {
  const sort = (v: any): any => Array.isArray(v) ? v.map(sort) : plain(v) ?
    Object.fromEntries(Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(value));
}
