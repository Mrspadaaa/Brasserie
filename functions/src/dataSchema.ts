/** Business collections shared by backups, the client repository and server history. */
export const BUSINESS_COLLECTIONS = [
  'transactions', 'stockItems', 'equipment', 'kegs', 'movements', 'batches',
  'finishedGoods', 'reservations', 'recipes', 'clients', 'planning', 'budgetLines',
  'tarifs', 'creativeItems', 'expenseTemplates', 'auditLogs', 'config',
  'hopVarieties', 'hopLots', 'hopKnowledge', 'hopPredictions', 'hopTastings',
  'financialPlans', 'financialAssets', 'financialClosings', 'financialPayments', 'financialProfiles', 'financeDocuments', 'financialArchives'
] as const;
export type BusinessCollection = typeof BUSINESS_COLLECTIONS[number];
/** Server-only conversations are exported, without loading every chat into the app cache. */
export const BACKUP_COLLECTIONS = [...BUSINESS_COLLECTIONS, 'brewerChats', 'brewerContexts'] as const;
export type BackupCollection = typeof BACKUP_COLLECTIONS[number];
export const IMMUTABLE_COLLECTIONS = new Set<BackupCollection>(['auditLogs', 'movements', 'brewerChats', 'brewerContexts', 'hopPredictions', 'financialPayments', 'financeDocuments']);
