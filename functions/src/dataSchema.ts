/** Business collections shared by backups, the client repository and server history. */
export const BUSINESS_COLLECTIONS = [
  'transactions', 'stockItems', 'equipment', 'kegs', 'movements', 'batches',
  'finishedGoods', 'reservations', 'recipes', 'clients', 'planning', 'budgetLines',
  'tarifs', 'creativeItems', 'expenseTemplates', 'auditLogs', 'config'
] as const;
export type BusinessCollection = typeof BUSINESS_COLLECTIONS[number];
export const IMMUTABLE_COLLECTIONS = new Set<BusinessCollection>(['auditLogs', 'movements']);
