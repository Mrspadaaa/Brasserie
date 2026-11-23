/** Fictional ledger used to express the client update rule. */
export const catalogueMetaFixture = {
  schemaVersion: 1,
  entityKind: 'hopVariety',
  revision: 2,
  fingerprint: 'a'.repeat(64),
  claims: [{ id: 'claim-fixture-1', property: 'alpha', reported: 'documented claim' }],
  unmapped: [],
  projections: [],
  corrections: [],
  identityResolutions: []
};

export const catalogueDocumentBefore = { id: 'fictional-hop', name: 'Fixture', catalogueMeta: catalogueMetaFixture };
export const legacyOfflinePayload = { id: 'fictional-hop', name: 'Edited offline' };
export const changedLedgerPayload = { ...catalogueDocumentBefore, catalogueMeta: { ...catalogueMetaFixture, revision: 1 } };
export const preservedLedgerPayload = { ...catalogueDocumentBefore, name: 'Edited with ledger preserved' };
