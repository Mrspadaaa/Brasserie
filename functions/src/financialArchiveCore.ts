/** UTC timestamps make the archive cutoff deterministic on every device and in backups. */
export function isArchiveTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const at = Date.parse(value);
  return Number.isFinite(at) && new Date(at).toISOString() === (value.includes('.') ? value : value.replace('Z', '.000Z'));
}
export function assertFinancialArchive(value: any, id = value?.id): void {
  if (!value || !Number.isInteger(value.year) || value.year < 1900 || value.year > 2200 || id !== `ARCHIVE-${value.year}` || value.id !== id) throw new Error('Exercice d’archive invalide.');
  if (!['archived', 'open'].includes(value.status) || !isArchiveTimestamp(value.updatedAt) || typeof value.operationId !== 'string' || !/^[A-Za-z0-9-]{8,100}$/.test(value.operationId)) throw new Error('État ou opération d’archive invalide.');
  if (value.archivedAt != null && !isArchiveTimestamp(value.archivedAt) || value.status === 'archived' && !isArchiveTimestamp(value.archivedAt)) throw new Error('Date d’archivage invalide.');
  if (value.archivedAt && Date.parse(value.archivedAt) > Date.parse(value.updatedAt)) throw new Error('La date d’archivage dépasse la dernière modification.');
}
