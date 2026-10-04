import { describe, expect, it } from 'vitest';
import { createBrewerCatalogueStore, type BrewerCatalogueReceipt } from '../../functions/src/brewerCatalogueStore';
import { brewerCatalogueIdentityKeys, type BrewerCatalogueCommand, type BrewerCatalogueKind } from '../../functions/src/brewerCatalogueSchema';
import type { HopVariety, HopSource } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { BrewingStyleGuide } from '../../functions/src/brewingStyleSchema';

type Row = Record<string, any>;
const copy = <T>(value: T): T => structuredClone(value);

class FakeSnapshot {
  readonly exists: boolean;
  readonly id: string;
  readonly ref: FakeDocumentReference;
  constructor(readonly path: string, private readonly value: Row | undefined, database: FakeFirestore) {
    this.exists = value !== undefined;
    this.id = path.split('/').at(-1)!;
    this.ref = new FakeDocumentReference(path, database);
  }
  data() { return this.value === undefined ? undefined : copy(this.value); }
}

class FakeQuerySnapshot {
  readonly size: number;
  readonly empty: boolean;
  constructor(readonly docs: FakeSnapshot[]) {
    this.size = docs.length;
    this.empty = docs.length === 0;
  }
}

class FakeQuery {
  constructor(
    protected readonly database: FakeFirestore,
    protected readonly path: string,
    protected readonly filters: Array<[string, unknown]> = [],
    protected readonly take?: number,
    protected readonly after?: string
  ) {}
  where(field: string, _op: string, value: unknown) { return new FakeQuery(this.database, this.path, [...this.filters, [field, value]], this.take, this.after); }
  limit(take: number) { return new FakeQuery(this.database, this.path, this.filters, take, this.after); }
  startAfter(snapshot: FakeSnapshot) { return new FakeQuery(this.database, this.path, this.filters, this.take, snapshot.id); }
  async get() { return this.snapshot(); }
  snapshot() {
    const prefix = `${this.path}/`;
    let rows = [...this.database.rows.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => ({ path, value, id: path.split('/').at(-1)! }))
      .sort((a, b) => a.id.localeCompare(b.id))
      .filter(({ value }) => this.filters.every(([field, expected]) => value[field] === expected));
    if (this.after) rows = rows.filter(row => row.id > this.after!);
    if (this.take !== undefined) rows = rows.slice(0, this.take);
    return new FakeQuerySnapshot(rows.map(({ path, value }) => new FakeSnapshot(path, value, this.database)));
  }
}

class FakeDocumentReference {
  readonly id: string;
  constructor(readonly path: string, private readonly database: FakeFirestore) { this.id = path.split('/').at(-1)!; }
  async get() { return new FakeSnapshot(this.path, this.database.rows.get(this.path), this.database); }
}

class FakeCollection extends FakeQuery {
  doc(id?: string) {
    return new FakeDocumentReference(`${this.path}/${id ?? this.database.allocateId()}`, this.database);
  }
}

class FakeTransaction {
  private wrote = false;
  readonly writes: Array<{ kind: 'create' | 'set' | 'delete' | 'update'; path: string; value?: Row }> = [];
  constructor(private readonly database: FakeFirestore) {}
  async get(target: FakeDocumentReference | FakeQuery): Promise<any> {
    if (this.wrote) throw Error('Fake Firestore: read after write');
    return target instanceof FakeQuery ? target.snapshot() : new FakeSnapshot(target.path, this.database.rows.get(target.path), this.database);
  }
  create(ref: FakeDocumentReference, value: Row) { this.wrote = true; this.writes.push({ kind: 'create', path: ref.path, value: copy(value) }); return this; }
  set(ref: FakeDocumentReference, value: Row) { this.wrote = true; this.writes.push({ kind: 'set', path: ref.path, value: copy(value) }); return this; }
  update(ref: FakeDocumentReference, value: Row) { this.wrote = true; this.writes.push({ kind: 'update', path: ref.path, value: copy(value) }); return this; }
  delete(ref: FakeDocumentReference) { this.wrote = true; this.writes.push({ kind: 'delete', path: ref.path }); return this; }
  commit() {
    const next = new Map(this.database.rows);
    for (const write of this.writes) {
      if (write.kind === 'create' && next.has(write.path)) throw Error(`already exists: ${write.path}`);
      if (write.kind === 'delete') { next.delete(write.path); continue; }
      if (write.kind === 'update' && !next.has(write.path)) throw Error(`missing: ${write.path}`);
      if (write.kind === 'update') next.set(write.path, { ...next.get(write.path), ...write.value });
      else next.set(write.path, copy(write.value!));
    }
    this.database.rows = next;
  }
}

class FakeFirestore {
  rows = new Map<string, Row>();
  private nextId = 0;
  private tail: Promise<void> = Promise.resolve();
  collection(path: string) { return new FakeCollection(this, path); }
  doc(path: string) { return new FakeDocumentReference(path, this); }
  allocateId() { this.nextId++; return `server-${String(this.nextId).padStart(4, '0')}`; }
  seed(path: string, value: Row) { this.rows.set(path, copy(value)); }
  async runTransaction<T>(action: (transaction: FakeTransaction) => Promise<T>): Promise<T> {
    let release!: () => void;
    const prior = this.tail;
    this.tail = new Promise<void>(resolve => { release = resolve; });
    await prior;
    try {
      const transaction = new FakeTransaction(this);
      const result = await action(transaction);
      transaction.commit();
      return result;
    } finally { release(); }
  }
}

function db() {
  return new FakeFirestore();
}

const source: HopSource = { title: 'Fiche de test', author: 'Fixture', year: 2025, kind: 'manufacturer', reference: 'fixture://catalogue' };
const hop = (name: string, id = 'fixture-hop'): HopVariety => ({ id, name, aliases: [], form: 'unknown', descriptions: [], analysis: [] });
const yeast = (name: string, id = 'fixture-yeast', manufacturer = 'FixtureCo'): HopYeast => ({
  id, kind: 'yeast', name, betaLyase: 'unknown', source,
  catalogue: { manufacturer, productId: id, productCode: 'YC-1', aliases: [], categories: [], status: 'listed', facts: [], documents: [],
    retrievals: [{ url: 'https://fixture.invalid/yeast', retrievedAt: '2025-01-01T00:00:00.000Z', sha256: 'a'.repeat(64), etag: null, lastModified: null }],
    publishedAt: null, pageUpdatedAt: null, parserVersion: 'fixture-v1', contentSha256: 'b'.repeat(64), gaps: [] }
});
const styleGuide = (name: string, id = 'fixture-guide', styleName = 'Personal Lager', code = 'PERS'): BrewingStyleGuide => ({
  id, kind: 'styleGuide', name, version: 'fixture-v1', enabled: true, edition: 'Personal edition',
  retrievedAt: null, createdAt: '2025-01-01', attribution: 'Fixture only', source,
  styles: [{ id: `${id}-style`, code, name: styleName, aliases: [], family: 'fixture', stats: {}, source }]
});

const createCommand = (name: string, operationId = `create-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`): BrewerCatalogueCommand => ({
  schemaVersion: 1, operationId, operation: 'create',
  entity: { kind: 'hopVariety', value: { name, aliases: [], form: 'unknown', descriptions: [], analysis: [] } },
  claims: [], unmapped: [], projectionChoices: []
});
const identityAlias = (id: string, value: string) => ({
  id, scope: 'identity', property: 'identity.alias', reported: value,
  normalized: { kind: 'text' as const, value }, epistemic: 'researchClaim' as const, source,
  dates: { recordedAt: '2026-10-01T10:00:00.000Z' }
});

const emptyStore = (database: FakeFirestore, extra: Record<string, unknown> = {}) => createBrewerCatalogueStore({
  database: database as any, ownerKey: 'user-fixture-1', namespace: 'job-fixture-1',
  now: () => new Date('2026-10-01T10:00:00.000Z'), ...extra
});

describe('brewerCatalogueStore', () => {
  it('attribue une identité serveur, projette dans la collection consommée et relit le document commis', async () => {
    const database = db(), store = emptyStore(database);
    const result = await store.write(createCommand('Nouveau houblon'));
    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.id).toMatch(/^server-/);
    expect(result.record).toMatchObject({ id: result.id, name: 'Nouveau houblon', catalogueMeta: { schemaVersion: 1, revision: 1, fingerprint: result.fingerprint } });
    expect(database.rows.get(`hopVarieties/${result.id}`)).toEqual(result.record);
    expect(result.receipt).toMatchObject({ status: 'committed', ownerKey: 'user-fixture-1', namespace: 'job-fixture-1', revision: 1, fingerprint: result.fingerprint });
    await expect(store.lookup({ kind: 'hopVariety', query: 'nouveau houblon' })).resolves.toMatchObject({ truncated: false, records: [{ id: result.id, origin: 'persisted' }] });
  });

  it('récupère un reçu perdu sans second effet et refuse la réutilisation de operationId avec un autre contenu', async () => {
    const database = db(), attached: BrewerCatalogueReceipt[] = [];
    const store = emptyStore(database, { attachReceipt: (_tx: unknown, receipt: BrewerCatalogueReceipt) => { attached.push(receipt); } });
    const command = createCommand('Retry hop', 'operation-stable-1');
    const first = await store.write(command);
    const replay = await store.write(command);
    expect(first.status).toBe('applied');
    expect(replay.status).toBe('duplicate');
    if (first.status !== 'applied' || replay.status !== 'duplicate') return;
    expect(replay.id).toBe(first.id);
    expect(database.rows.has(`hopVarieties/${first.id}`)).toBe(true);
    expect(attached).toHaveLength(2);
    expect(await store.readReceipts()).toEqual([{ operationId: 'operation-stable-1', kind: 'hopVariety', targetId: first.id }]);
    expect(await store.write(createCommand('Payload différent', 'operation-stable-1'))).toMatchObject({ status: 'conflict', reason: expect.stringContaining('contenu différent') });
  });

  it('sérialise deux nouvelles soumissions concurrentes du même operationId et n’applique qu’une fois', async () => {
    const database = db(), store = emptyStore(database), command = createCommand('Même effet concurrent', 'same-operation-concurrent');
    const results = await Promise.all([store.write(command), store.write(command)]);
    expect(results.map(result => result.status).sort()).toEqual(['applied', 'duplicate']);
    expect([...database.rows.keys()].filter(path => path.startsWith('hopVarieties/'))).toHaveLength(1);
    expect([...database.rows.keys()].filter(path => path.includes('/catalogueMutations/'))).toHaveLength(1);
  });

  it('compare les identités normalisées, exige les candidats exacts et conserve la création distincte décidée', async () => {
    const database = db();
    database.seed('hopVarieties/legacy-1', hop('Châtaigne', 'legacy-1'));
    const store = emptyStore(database);
    const command = createCommand('Chataigne', 'distinct-hop-1');
    const conflict = await store.write(command);
    expect(conflict.status).toBe('conflict');
    if (conflict.status !== 'conflict') return;
    expect(conflict.identityCandidates).toEqual([{ kind: 'hopVariety', id: 'legacy-1', fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) }]);
    const distinct: BrewerCatalogueCommand = { ...command, identityResolution: { decision: 'distinct', candidates: conflict.identityCandidates!, reason: 'Deux cultivars documentés distincts.' } };
    const result = await store.write(distinct);
    expect(result.status).toBe('applied');
    if (result.status === 'applied') expect((result.record as HopVariety).catalogueMeta?.identityResolutions).toHaveLength(1);
    const stale: BrewerCatalogueCommand = { ...distinct, operationId: 'distinct-hop-stale', identityResolution: { ...distinct.identityResolution!, candidates: conflict.identityCandidates!.map(candidate => ({ ...candidate, fingerprint: 'f'.repeat(64) })) } };
    expect(await store.write(stale)).toMatchObject({ status: 'conflict' });
  });

  it('permet l’enrichissement d’une identité legacy ambiguë choisie par ID, mais refuse un nouvel alias déjà attribué', async () => {
    const database = db(), store = emptyStore(database);
    const first = { ...hop('First', 'legacy-first'), aliases: ['Shared legacy alias'] };
    const second = { ...hop('Second', 'legacy-second'), aliases: ['Shared legacy alias', 'New alias'] };
    database.seed('hopVarieties/legacy-first', first);
    database.seed('hopVarieties/legacy-second', second);
    const firstLookup = (await store.lookup({ kind: 'hopVariety', query: 'legacy-first' })).records.find(row => row.id === 'legacy-first')!;
    const enrich: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-legacy-id', operation: 'enrich',
      target: { kind: 'hopVariety', id: first.id, expectedRevision: 0, expectedFingerprint: firstLookup.fingerprint }, claims: [], unmapped: [], projectionChoices: [] };
    const accepted = await store.write(enrich);
    expect(accepted).toMatchObject({ status: 'applied', id: first.id, revision: 1 });
    if (accepted.status !== 'applied') return;
    const alias = identityAlias('claim-alias-new', 'New alias');
    const collision: BrewerCatalogueCommand = { ...enrich, operationId: 'enrich-colliding-alias', target: {
      kind: 'hopVariety', id: first.id, expectedRevision: accepted.revision, expectedFingerprint: accepted.fingerprint
    }, claims: [alias], projectionChoices: [{ id: 'projection-alias-new', claimId: alias.id, targetField: 'identity.alias', mode: 'legacy', reason: 'Alias exact sourcé' }] };
    expect(await store.write(collision)).toMatchObject({ status: 'conflict', identityCandidates: [{ kind: 'hopVariety', id: 'legacy-second' }] });
  });

  it('ne réserve pas une assertion d’alias descriptive avant sa projection legacy explicite', async () => {
    const database = db(), store = emptyStore(database);
    database.seed('hopVarieties/alias-owner', hop('Alpha', 'alias-owner'));
    const alias = identityAlias('claim-alpha-alias', 'Alpha');
    const unselected: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'unselected-alias', operation: 'create',
      entity: { kind: 'hopVariety', value: { name: 'Unselected descriptive record', aliases: [], form: 'unknown', descriptions: [], analysis: [] } },
      claims: [alias], unmapped: [], projectionChoices: [] };
    const stored = await store.write(unselected);
    expect(stored.status).toBe('applied');
    if (stored.status !== 'applied') return;
    expect((stored.record as HopVariety).aliases).toEqual([]);
    expect((stored.record as HopVariety).catalogueMeta?.projections).toEqual([]);
    expect(brewerCatalogueIdentityKeys(stored.record)).not.toContain('hopVariety:alpha');
    const selected: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'selected-alias', operation: 'create',
      entity: { kind: 'hopVariety', value: { name: 'Selected alias record', aliases: [], form: 'unknown', descriptions: [], analysis: [] } },
      claims: [alias], unmapped: [], projectionChoices: [
        { id: 'projection-alpha-alias', claimId: alias.id, targetField: 'identity.alias', mode: 'legacy', reason: 'Alias exact sourcé' }
      ] };
    const conflict = await store.write(selected);
    expect(conflict).toMatchObject({ status: 'conflict', identityCandidates: [{ kind: 'hopVariety', id: 'alias-owner' }] });
  });

  it('applique CAS revision+empreinte et garde l’ancien effet lisible après un enrichissement concurrent', async () => {
    const database = db(), store = emptyStore(database);
    const created = await store.write(createCommand('CAS hop', 'create-cas-hop'));
    expect(created.status).toBe('applied');
    if (created.status !== 'applied') return;
    const stale: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-stale', operation: 'enrich',
      target: { kind: 'hopVariety', id: created.id, expectedRevision: 0, expectedFingerprint: created.fingerprint }, claims: [], unmapped: [], projectionChoices: [] };
    const currentLookup = await store.lookup({ kind: 'hopVariety', query: created.id });
    const current = currentLookup.records[0];
    expect(current).toBeDefined();
    if (!current) return;
    const fresh: BrewerCatalogueCommand = { ...stale, operationId: 'enrich-fresh', target: { kind: 'hopVariety', id: created.id, expectedRevision: current.revision, expectedFingerprint: current.fingerprint } };
    expect(await store.write(fresh)).toMatchObject({ status: 'applied', revision: 2 });
    expect(await store.write(stale)).toMatchObject({ status: 'conflict', reason: expect.stringContaining('a changé') });
  });

  it('réconcilie l’index d’identité après une édition legacy qui préserve le ledger', async () => {
    const database = db(), store = emptyStore(database);
    const created = await store.write(createCommand('Original name', 'create-original-name'));
    expect(created.status).toBe('applied');
    if (created.status !== 'applied') return;

    // Mirrors the already-approved Firestore client edit: legacy field changes,
    // catalogueMeta itself is preserved, so its old fingerprint is now stale.
    const legacyEdited = { ...created.record, name: 'Manual renamed name' };
    database.seed(`hopVarieties/${created.id}`, legacyEdited as unknown as Row);
    const latest = (await store.lookup({ kind: 'hopVariety', query: 'manual renamed name' })).records.find(row => row.id === created.id);
    expect(latest).toBeDefined();
    if (!latest) return;
    expect(latest.fingerprint).not.toBe(created.fingerprint);

    const enrich: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-after-manual-edit', operation: 'enrich',
      target: { kind: 'hopVariety', id: created.id, expectedRevision: latest.revision, expectedFingerprint: latest.fingerprint },
      claims: [], unmapped: [], projectionChoices: [] };
    const enriched = await store.write(enrich);
    expect(enriched).toMatchObject({ status: 'applied', id: created.id, revision: 2 });
    if (enriched.status !== 'applied') return;
    expect(enriched.record.catalogueMeta?.fingerprint).toBe(enriched.fingerprint);

    // The stale reservation on the previous name is derived data. A new record
    // may reuse it after the old document no longer carries that identity.
    const reuseFormerName = await store.write(createCommand('Original name', 'reuse-original-name'));
    expect(reuseFormerName).toMatchObject({ status: 'applied', kind: 'hopVariety' });
  });

  it('revalide dans la transaction une création apparue après le lookup et une fiche modifiée depuis sa lecture', async () => {
    const database = db(), store = emptyStore(database);
    expect((await store.lookup({ kind: 'hopVariety', query: 'Race hop' })).records).toEqual([]);
    database.seed('hopVarieties/legacy-race', hop('Race hop', 'legacy-race'));
    const racedCreate = await store.write(createCommand('Race hop', 'create-after-lookup'));
    expect(racedCreate).toMatchObject({ status: 'conflict', identityCandidates: [{ kind: 'hopVariety', id: 'legacy-race' }] });

    const initial = hop('Before edit', 'legacy-edit');
    database.seed('hopVarieties/legacy-edit', initial);
    const read = (await store.lookup({ kind: 'hopVariety', query: 'legacy-edit' })).records[0];
    const staleEnrich: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-after-lookup-edit', operation: 'enrich',
      target: { kind: 'hopVariety', id: initial.id, expectedRevision: read.revision, expectedFingerprint: read.fingerprint }, claims: [], unmapped: [], projectionChoices: [] };
    database.seed('hopVarieties/legacy-edit', { ...initial, name: 'Changed before transaction' });
    expect(await store.write(staleEnrich)).toMatchObject({ status: 'conflict', reason: expect.stringContaining('a changé') });
  });

  it('refuse de conclure à l’absence lorsque la pagination ne permet pas le scan complet', async () => {
    const database = db();
    database.seed('hopVarieties/a', hop('A', 'a'));
    database.seed('hopVarieties/b', hop('B', 'b'));
    const store = emptyStore(database, { pageSize: 1, maxIdentityScanDocs: 1 });
    expect(await store.write(createCommand('Nouveau', 'scan-limited'))).toMatchObject({ status: 'conflict', reason: expect.stringContaining('identity-check-incomplete') });
    expect([...database.rows.keys()].filter(path => path.startsWith('hopVarieties/'))).toHaveLength(2);
    expect([...database.rows.keys()].some(path => path.includes('/catalogueMutations/'))).toBe(false);
  });

  it('ne confond pas les codes de style seuls ni les codes produit entre fabricants', async () => {
    expect(brewerCatalogueIdentityKeys(styleGuide('Guide A', 'new-a', 'Lager A', '21C'))).not.toContain('brewingStyle:21c');

    const database = db(), store = emptyStore(database);
    database.seed('hopKnowledge/yeast-one', yeast('Strain A', 'yeast-one', 'Maker A') as unknown as Row);
    database.seed('hopKnowledge/yeast-two', yeast('Strain B', 'yeast-two', 'Maker B') as unknown as Row);
    database.seed('hopKnowledge/guide-existing', styleGuide('Existing Guide', 'guide-existing', 'Existing Lager', '21C') as unknown as Row);
    const { id: _newYeastId, ...newYeast } = yeast('Strain C', 'new-yeast', 'Maker C');
    const result: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'new-yeast', operation: 'create',
      entity: { kind: 'yeastStrain', value: newYeast },
      claims: [], unmapped: [], projectionChoices: [] };
    expect(await store.write(result)).toMatchObject({ status: 'applied', kind: 'yeastStrain' });

    const secondStyle: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'new-style-code', operation: 'create',
      entity: { kind: 'brewingStyle', value: { kind: 'styleGuide', name: 'Another Guide', version: 'v1', enabled: true, edition: 'Edition B', retrievedAt: null,
        createdAt: '2025-01-01', attribution: 'Fixture', source, styles: [{ code: '21C', name: 'Lager B', aliases: [], family: 'fixture', stats: {}, source }] } },
      claims: [], unmapped: [], projectionChoices: [] };
    const createdStyle = await store.write(secondStyle);
    expect(createdStyle.status, JSON.stringify(createdStyle)).toBe('applied');
    expect(createdStyle).toMatchObject({ kind: 'brewingStyle' });
  });

  it('inclut les références bundlées dans la recherche et matérialise un enrichissement sous le même ID', async () => {
    const database = db();
    const bundled = hop('Bundle only', 'bundled-hop');
    const store = emptyStore(database, { loadReferences: async () => ({ varieties: [bundled], knowledge: [] }) });
    await expect(store.lookup({ kind: 'hopVariety', query: 'bundle only' })).resolves.toMatchObject({ records: [{ id: 'bundled-hop', origin: 'bundled', revision: 0 }] });
    expect(await store.write(createCommand('Bundle only', 'duplicate-bundle'))).toMatchObject({ status: 'conflict' });
    const ref = (await store.lookup({ kind: 'hopVariety', query: 'bundled-hop' })).records[0];
    const enrich: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'persist-bundle', operation: 'enrich',
      target: { kind: 'hopVariety', id: 'bundled-hop', expectedRevision: 0, expectedFingerprint: ref.fingerprint }, claims: [], unmapped: [], projectionChoices: [] };
    expect(await store.write(enrich)).toMatchObject({ status: 'applied', id: 'bundled-hop', revision: 1 });
    expect(database.rows.get('hopVarieties/bundled-hop')).toMatchObject({ id: 'bundled-hop', catalogueMeta: { revision: 1 } });
  });

  it('refuse un owner partagé/anonyme avant tout accès à la base', () => {
    expect(() => createBrewerCatalogueStore({ database: db() as any, ownerKey: 'anonymous', namespace: 'fixture' })).toThrow(/ownerKey authentifié/);
  });
});
