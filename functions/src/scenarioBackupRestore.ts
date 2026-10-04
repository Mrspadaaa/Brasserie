import { createHash } from 'node:crypto';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import type { BackupDocument } from './backupCore.js';

export interface BrewingScenarioDossierApi {
  readBrewingScenarioRecord(dossier: unknown, events: readonly unknown[]): any;
}
export interface BrewingScenarioArchiveApi {
  decodeBrewingScenarioArchive(value: unknown): any;
}

export interface ScenarioBackupGroup {
  key: string;
  ownerKey: string;
  scenarioId: string;
  head: BackupDocument;
  eventRows: BackupDocument[];
  dossier: any;
  events: any[];
}

export interface ScenarioRestoreWrite {
  collection: 'brewerScenarios' | 'brewerScenarioEvents';
  id: string;
  data: Record<string, any>;
  create: boolean;
  scenarioKey: string;
}

export interface ScenarioRestorePlan {
  kind: 'preserve' | 'apply';
  headToWrite?: BackupDocument;
  eventsToWrite: BackupDocument[];
}

const plain = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
const stable = (value: any): string => JSON.stringify(sort(value));
function sort(value: any): any {
  if (Array.isArray(value)) return value.map(sort);
  if (!plain(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, sort(value[key])]));
}
function fail(message: string): never { throw new Error(message); }
function scenarioKey(ownerKey: string, scenarioId: string) { return sha256(`${ownerKey}:${scenarioId}`); }
function eventDocumentId(ownerKey: string, eventId: string) { return sha256(`${ownerKey}:${eventId}`); }

export function preserveCatalogueOnBackupRestore(collection: string, current: Record<string, any> | undefined, incoming: Record<string, any>): boolean {
  return (collection === 'hopVarieties' || collection === 'hopKnowledge')
    && !!current?.catalogueMeta && stable(current) !== stable(incoming);
}

function checkedScenarioGroup(head: BackupDocument, eventRows: BackupDocument[], ownerKey: string, domain: BrewingScenarioDossierApi, archive?: BrewingScenarioArchiveApi): ScenarioBackupGroup {
  const data = head.data;
  if (!plain(data) || !plain(data.dossier) || data.ownerKey !== ownerKey || data.dossier.ownerKey !== ownerKey
    || typeof data.scenarioId !== 'string' || !data.scenarioId.trim() || data.dossier.scenarioId !== data.scenarioId
    || data.id !== head.id || head.id !== scenarioKey(ownerKey, data.scenarioId)
    || typeof data.updatedAt !== 'string' || !Number.isFinite(Date.parse(data.updatedAt))) {
    fail('Dossier de scénario absent, mal formé ou rattaché à un autre compte. Aucun restore scénario effectué.');
  }
  const rows = [...eventRows].sort((a, b) => (a.data.resultingRevision ?? 0) - (b.data.resultingRevision ?? 0) || a.id.localeCompare(b.id));
  const events: any[] = [];
  for (const row of rows) {
    const wrapper = row.data;
    const packedEvent = wrapper?.event;
    if (!plain(wrapper) || wrapper.id !== row.id || wrapper.ownerKey !== ownerKey || wrapper.scenarioId !== data.scenarioId
      || wrapper.dossierKey !== head.id || typeof wrapper.resultingRevision !== 'number'
      || typeof wrapper.commandFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(wrapper.commandFingerprint)) {
      fail(`Événement de scénario incohérent pour ${head.id}; aucun restore scénario effectué.`);
    }
    let event: any;
    try { event = archive ? archive.decodeBrewingScenarioArchive(packedEvent) : packedEvent; }
    catch { fail(`Enveloppe d’événement scénario illisible pour ${head.id}; aucun restore effectué.`); }
    if (!plain(event) || wrapper.resultingRevision !== event.resultingRevision
      || typeof event.eventId !== 'string' || row.id !== eventDocumentId(ownerKey, event.eventId)
    ) {
      fail(`Événement de scénario incohérent pour ${head.id}; aucun restore scénario effectué.`);
    }
    events.push(event);
  }
  const record = domain.readBrewingScenarioRecord(data.dossier, events);
  if (!plain(record) || 'status' in record || !plain(record.dossier) || record.dossier.ownerKey !== ownerKey
    || record.dossier.scenarioId !== data.scenarioId) {
    fail(`Historique de scénario incomplet, divergent ou en format futur pour ${head.id}; aucun restore effectué.`);
  }
  return { key: head.id, ownerKey, scenarioId: data.scenarioId, head, eventRows: rows, dossier: data.dossier, events };
}

/** Validate and group all scenario rows from one complete backup, never one upload page. */
export function readScenarioBackupGroups(
  heads: BackupDocument[], eventRows: BackupDocument[], ownerKey: string, domain: BrewingScenarioDossierApi, archive?: BrewingScenarioArchiveApi
): ScenarioBackupGroup[] {
  if (!ownerKey.trim()) fail('Compte de scénario requis pour restaurer cette sauvegarde.');
  const byKey = new Map<string, BackupDocument[]>();
  for (const row of eventRows) {
    const key = row.data?.dossierKey;
    if (typeof key !== 'string' || !key) fail('Un événement scénario ne référence pas son dossier.');
    byKey.set(key, [...(byKey.get(key) ?? []), row]);
  }
  const seen = new Set<string>();
  const groups = heads.map(head => {
    if (seen.has(head.id)) fail('Dossier scénario répété dans la sauvegarde.');
    seen.add(head.id);
    const rows = byKey.get(head.id) ?? [];
    byKey.delete(head.id);
    return checkedScenarioGroup(head, rows, ownerKey, domain, archive);
  });
  if (byKey.size) fail('La sauvegarde contient des événements scénario sans projection de dossier. Aucun restore effectué.');
  return groups;
}

export function reconcileScenarioBackup(incoming: ScenarioBackupGroup, current: ScenarioBackupGroup | null): ScenarioRestorePlan {
  if (!current) return { kind: 'apply', headToWrite: incoming.head, eventsToWrite: incoming.eventRows };
  if (incoming.key !== current.key || incoming.ownerKey !== current.ownerKey || incoming.scenarioId !== current.scenarioId) {
    fail('Les deux projections scénario ne correspondent pas à la même identité. Aucun restore effectué.');
  }
  const overlaps = Math.min(incoming.events.length, current.events.length);
  for (let index = 0; index < overlaps; index++) {
    if (incoming.events[index].eventId !== current.events[index].eventId
      || incoming.events[index].contentReference !== current.events[index].contentReference
      || stable(incoming.events[index]) !== stable(current.events[index])) {
      fail(`Historique scénario divergent à la révision ${index + 1} pour ${incoming.key}. Aucun restore effectué.`);
    }
  }
  if (incoming.events.length <= current.events.length) return { kind: 'preserve', eventsToWrite: [] };
  return {
    kind: 'apply', headToWrite: incoming.head,
    eventsToWrite: incoming.eventRows.slice(current.events.length)
  };
}

/** Read, compare and prepare head+append-only event writes under one Firestore transaction. */
export async function prepareScenarioRestoreWrites(
  transaction: Transaction,
  database: Firestore,
  groups: ScenarioBackupGroup[],
  ownerKey: string,
  domain: BrewingScenarioDossierApi,
  archive?: BrewingScenarioArchiveApi
): Promise<ScenarioRestoreWrite[]> {
  const planned = await Promise.all(groups.map(async incoming => {
    const headRef = database.doc(`brewerScenarios/${incoming.key}`);
    const eventsQuery = database.collection('brewerScenarioEvents').where('dossierKey', '==', incoming.key);
    const [headSnapshot, eventSnapshot] = await Promise.all([transaction.get(headRef), transaction.get(eventsQuery)]);
    const currentRows = eventSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    if (!headSnapshot.exists && currentRows.length) fail(`Historique scénario orphelin pour ${incoming.key}; aucun restore effectué.`);
    const current = headSnapshot.exists
      ? checkedScenarioGroup({ id: headSnapshot.id, data: headSnapshot.data()! }, currentRows, ownerKey, domain, archive)
      : null;
    return { incoming, plan: reconcileScenarioBackup(incoming, current), headExists: headSnapshot.exists };
  }));

  const newEvents = planned.flatMap(item => item.plan.eventsToWrite);
  const refs = newEvents.map(row => database.doc(`brewerScenarioEvents/${row.id}`));
  const existingEvents = refs.length ? await transaction.getAll(...refs) : [];
  if (existingEvents.some(snapshot => snapshot.exists)) {
    fail('Un identifiant d’événement scénario est déjà utilisé hors de son préfixe historique. Aucun restore effectué.');
  }

  const writes: ScenarioRestoreWrite[] = [];
  for (const item of planned) {
    const groupWrites: ScenarioRestoreWrite[] = [];
    for (const row of item.plan.eventsToWrite) groupWrites.push({ scenarioKey: item.incoming.key, collection: 'brewerScenarioEvents', id: row.id, data: row.data, create: true });
    if (item.plan.headToWrite) groupWrites.push({ scenarioKey: item.incoming.key, collection: 'brewerScenarios', id: item.plan.headToWrite.id, data: item.plan.headToWrite.data, create: !item.headExists });
    if (groupWrites.length > 450 || Buffer.byteLength(JSON.stringify(groupWrites.map(write => write.data))) > 7_000_000) {
      fail(`Dossier scénario ${item.incoming.key} dépasse la taille ou le nombre d’écritures d’une transaction atomique.`);
    }
    writes.push(...groupWrites);
  }
  return writes;
}
