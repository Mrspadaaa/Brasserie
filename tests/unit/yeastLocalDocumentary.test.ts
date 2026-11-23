import { describe, expect, it } from 'vitest';
import { extractYeastCandidateSheet, readYeastDocumentaryView, tryAdoptYeastDocumentary } from '../../src/services/recipeDraft';
import { readYeastLocalDocumentary, type YeastLocalDocumentary } from '../../functions/src/yeastDocumentarySheet';
import type { YeastSpec } from '../../src/types';

const freeYeast = (patch: Partial<YeastSpec> = {}): YeastSpec => ({
  name: 'Culture libre QA', attenuationPct: 78, attenuationBasis: 'declared',
  technicalSource: 'SOURCE_HISTORIQUE_LIBRE_QA', qty: 23, unit: 'mL', pitchTempC: 18,
  notes: 'Note opérationnelle du lot.', ...patch
});
const localSheet = (patch: Partial<YeastLocalDocumentary> = {}): YeastLocalDocumentary => ({
  version: 1, documentary: { declaredAttenuationPct: 78, technicalSource: 'SOURCE_HISTORIQUE_LIBRE_QA' }, ...patch
});

describe('Documentation locale de levure — recette ou lot', () => {
  it('capture le scalaire libre 78 avant l’hypothèse 73 sans fabriquer d’identité ni de qualification', () => {
    const previous = freeYeast();
    const next = { ...previous, attenuationPct: 73, attenuationBasis: 'recipe' as const };
    const result = tryAdoptYeastDocumentary(previous, next, { intent: 'hypothesis' });

    expect(result.accepted).toBe(true);
    expect(result.yeast).toMatchObject({ name: 'Culture libre QA', attenuationPct: 73, attenuationBasis: 'recipe',
      localDocumentary: { version: 1, documentary: { declaredAttenuationPct: 78, technicalSource: 'SOURCE_HISTORIQUE_LIBRE_QA' } } });
    expect(result.yeast.hopIndexId).toBeUndefined();
    expect(result.yeast.adoptedDocumentary).toBeUndefined();
    expect(result.yeast.localDocumentary).not.toHaveProperty('qty');
    expect(result.yeast.localDocumentary).not.toHaveProperty('unit');
    expect(result.yeast.localDocumentary).not.toHaveProperty('pitchTempC');
    expect(result.yeast.localDocumentary).not.toHaveProperty('notes');
    expect(readYeastDocumentaryView(result.yeast)).toMatchObject({ status: 'valid', scope: 'local',
      body: { documentary: { declaredAttenuationPct: 78, technicalSource: 'SOURCE_HISTORIQUE_LIBRE_QA' } },
      effectiveYeast: { attenuationPct: 73, attenuationBasis: 'recipe' } });
  });

  it('préserve absent, null et tableau vide dans le même corps local', () => {
    const sheet: YeastLocalDocumentary = { version: 1,
      documentary: { declaredAttenuationPct: null, fermTempMaxC: null },
      technicalFacts: [], technicalSelections: { attenuation: null }, documentaryNotes: null };
    const read = readYeastLocalDocumentary(JSON.parse(JSON.stringify(sheet)));
    expect(read).toEqual(sheet);
    expect(Object.prototype.hasOwnProperty.call(read, 'fermentationFacts')).toBe(false);
    expect(read?.technicalFacts).toEqual([]);
    expect(read?.documentaryNotes).toBeNull();

    const effective = readYeastDocumentaryView(freeYeast({ attenuationPct: 73, attenuationBasis: 'recipe', localDocumentary: sheet }));
    const { version: _version, ...body } = sheet;
    expect(effective).toMatchObject({ status: 'valid', scope: 'local', body,
      effectiveYeast: { attenuationPct: 73, attenuationBasis: 'recipe', fermTempMaxC: undefined, documentaryNotes: null, technicalFacts: [] } });
    expect(readYeastLocalDocumentary({ ...sheet, unknown: true } as unknown)).toBeUndefined();
  });

  it('le renommage garde la fiche ; un nouveau libre homonyme part sans elle ; Undo peut restaurer l’objet capturé', () => {
    const previous = freeYeast({ attenuationPct: 73, attenuationBasis: 'recipe', localDocumentary: localSheet({
      documentaryNotes: [{ text: 'Note A', origin: 'personal', source: 'Lot A' }]
    }) });
    const renamed = tryAdoptYeastDocumentary(previous, { ...previous, name: 'Culture corrigée QA' }, { intent: 'documentary' });
    expect(renamed.accepted).toBe(true);
    expect(renamed.yeast.localDocumentary).toEqual(previous.localDocumentary);

    const homonym: YeastSpec = { name: 'Culture corrigée QA' };
    const replacement = tryAdoptYeastDocumentary(renamed.yeast, homonym, { intent: 'replace-selection' });
    expect(replacement.accepted).toBe(true);
    expect(replacement.yeast.localDocumentary).toBeUndefined();
    expect(replacement.yeast.technicalSource).toBeUndefined();
    expect(replacement.yeast.attenuationPct).toBeUndefined();
    expect(renamed.yeast).toEqual({ ...previous, name: 'Culture corrigée QA' });
  });

  it('ne promeut pas un lot homonyme vers le livre catalogue, même avec le même hopIndexId', () => {
    const stockA = freeYeast({ hopIndexId: 'yeast-same-label', stockItemRef: 'LOT-A', localDocumentary: localSheet() });
    const stockB: YeastSpec = { name: stockA.name, hopIndexId: stockA.hopIndexId, stockItemRef: 'LOT-B',
      localDocumentary: { version: 1, documentary: { declaredAttenuationPct: 71, technicalSource: 'SOURCE-LOT-B' } } };
    const result = tryAdoptYeastDocumentary(stockA, stockB, { intent: 'replace-selection' });
    expect(result.accepted).toBe(true);
    expect(result.yeast.localDocumentary?.documentary).toEqual({ declaredAttenuationPct: 71, technicalSource: 'SOURCE-LOT-B' });
    expect(result.yeast.adoptedDocumentary).toBeUndefined();
    expect(extractYeastCandidateSheet(result.yeast)).toBeUndefined();

    const unstockedButLocal = { ...stockB, stockItemRef: undefined };
    expect(extractYeastCandidateSheet(unstockedButLocal)).toBeUndefined();
  });

  it('refuse les doubles enveloppes et permet une sortie explicite depuis une fiche précédente invalide', () => {
    const conflict = freeYeast({ hopIndexId: 'catalogue-a', adoptedDocumentary: { version: 1, hopIndexId: 'catalogue-a' },
      localDocumentary: { version: 1, documentary: { technicalSource: 'SOURCE-LOCALE' } } });
    expect(readYeastDocumentaryView(conflict).status).toBe('conflict');
    const refused = tryAdoptYeastDocumentary(conflict, { ...conflict, attenuationPct: 73, attenuationBasis: 'recipe' }, { intent: 'hypothesis' });
    expect(refused.accepted).toBe(false);
    expect(refused.reason).toBe('scope-conflict');
    expect(refused.yeast.localDocumentary).toEqual(conflict.localDocumentary);
    expect(refused.yeast.adoptedDocumentary).toEqual(conflict.adoptedDocumentary);

    const invalidPrevious = freeYeast({ localDocumentary: { version: 2 } as unknown as YeastLocalDocumentary });
    const sameScope = tryAdoptYeastDocumentary(invalidPrevious, { ...invalidPrevious, attenuationPct: 73, attenuationBasis: 'recipe' }, { intent: 'hypothesis' });
    expect(sameScope.accepted).toBe(false);
    expect(sameScope.yeast.localDocumentary).toEqual(invalidPrevious.localDocumentary);
    const replacement = tryAdoptYeastDocumentary(invalidPrevious, { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' }, { intent: 'replace-selection' });
    expect(replacement.accepted).toBe(true);
    expect(replacement.yeast.localDocumentary).toBeUndefined();
    expect(replacement.yeast.hopIndexId).toBe('fermentis-us05');
  });
});
