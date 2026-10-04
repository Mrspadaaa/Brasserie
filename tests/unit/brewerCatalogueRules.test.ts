import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { describe, expect, it } from 'vitest';
import {
  catalogueDocumentBefore, changedLedgerPayload, legacyOfflinePayload, preservedLedgerPayload
} from '../fixtures/catalogueMetaIntegrity';

const rulesTemplate = readFileSync(new URL('../../firestore.rules.template', import.meta.url), 'utf8');
const rulesGenerator = readFileSync(new URL('../../scripts/build-rules.mjs', import.meta.url), 'utf8');
const clientUpdatePreservesCatalogueMeta = (before: any, after: any) =>
  before.catalogueMeta == null || isDeepStrictEqual(after.catalogueMeta, before.catalogueMeta);
const clientDeleteAllowed = (before: any) => before.catalogueMeta == null;

describe('garde Firestore du ledger catalogue client', () => {
  it('attache la garde aux mises à jour et suppressions des deux collections catalogue', () => {
    expect(rulesTemplate).toContain('function preservesHopCatalogueMeta(before, after)');
    expect(rulesTemplate).toContain("after.get('catalogueMeta', null) == previous");
    expect(rulesTemplate).toContain('preservesHopCatalogueMeta(resource.data, request.resource.data)');
    expect(rulesTemplate).toContain("resource.data.get('catalogueMeta', null) == null");
    expect(rulesGenerator).toContain("function preservesHopCatalogueMeta(before, after)");
    expect(rulesGenerator).toContain('catalogueMetaGuardPresent');
  });

  it('refuse une ancienne payload hors ligne sans ledger et un remplacement de ledger', () => {
    expect(clientUpdatePreservesCatalogueMeta(catalogueDocumentBefore, legacyOfflinePayload)).toBe(false);
    expect(clientUpdatePreservesCatalogueMeta(catalogueDocumentBefore, changedLedgerPayload)).toBe(false);
    expect(clientUpdatePreservesCatalogueMeta(catalogueDocumentBefore, preservedLedgerPayload)).toBe(true);
    expect(clientUpdatePreservesCatalogueMeta(catalogueDocumentBefore, { ...preservedLedgerPayload, catalogueMeta: { ...catalogueDocumentBefore.catalogueMeta, claims: [...catalogueDocumentBefore.catalogueMeta.claims] } })).toBe(true);
    expect(clientUpdatePreservesCatalogueMeta({ id: 'new-document' }, { id: 'new-document', name: 'Classic create' })).toBe(true);
    expect(clientDeleteAllowed(catalogueDocumentBefore)).toBe(false);
    expect(clientDeleteAllowed({ id: 'legacy-document' })).toBe(true);
  });
});
