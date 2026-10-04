import { describe, expect, it } from 'vitest';
import { decodeBrewingScenarioArchive, encodeBrewingScenarioArchive, readBrewingScenarioEvidence, scenarioEvidenceForModel } from '../../src/domain/brewingScenarioArchive';
import { compactHopEvidence } from '../../src/domain/hopIndex/companionPrediction';

describe('Archives et preuves de scénario bornées sans perte', () => {
  it('relit exactement un gros document UTF-8, valeurs et sources comprises', () => {
    const value = { formatVersion: 1, amounts: [0, null, 0.30000000000000004, 1e-200],
      notes: Array.from({ length: 3500 }, (_, id) => ({ id, text: 'Hypothèse · β-citronellol — µg/L, source opposée conservée. '.repeat(8) })) };
    const archive = encodeBrewingScenarioArchive(value);
    expect(archive.decodedBytes).toBeGreaterThan(900_000);
    expect(archive.payload.length).toBeLessThan(900_000);
    expect(decodeBrewingScenarioArchive(archive)).toEqual(value);
    expect(() => decodeBrewingScenarioArchive({ ...archive, reference: 'wrong' })).toThrow(/Empreinte/);
    expect(() => decodeBrewingScenarioArchive({ ...archive, decodedBytes: 80_000_000 })).toThrow();
  });
  it('ne convertit pas un nombre invalide en null et garde les anciennes lignes plain', () => {
    expect(() => encodeBrewingScenarioArchive({ value: NaN })).toThrow();
    expect(() => encodeBrewingScenarioArchive([undefined])).toThrow();
    const old = { eventFormatVersion: 1, source: 'Ancienne ligne JSON' };
    expect(decodeBrewingScenarioArchive(old)).toBe(old);
    expect(() => decodeBrewingScenarioArchive({ format: 'brewing-scenario-archive-v9' })).toThrow(/Format/);
  });
  it('partage la source et les raisons du résumé sans modifier les nombres', () => {
    const source = { title: 'Source fictive', author: 'Fixture', year: null, kind: 'judgment', reference: 'fixture:archive' };
    const original = { a: { range: { min: 1.25, max: 6 }, sources: [source], reasons: ['Condition explicite'] },
      b: { range: null, sources: [source], reasons: ['Condition explicite'] } };
    const compact = compactHopEvidence(original);
    expect(compact.a.range).toEqual(original.a.range); expect(compact.b.range).toBeNull();
    expect(compact.a.sources).toEqual(compact.b.sources); expect(compact.a.reasons).toEqual(compact.b.reasons);
    expect(Object.values(compact.sourceDictionary)).toEqual([source]);
    expect(compactHopEvidence({ source: 'Texte brut conservé', sources: [12], reasons: null })).toMatchObject({ source: 'Texte brut conservé', sources: [12], reasons: null });
  });
  it('ne transmet pas le base64 au modèle et résout une archive commune avec la même référence', () => {
    const result = { reference: 'fixture-result', values: [1, null, 2] };
    const data = { format: 'brewing-scenario-evidence-v1', resultReference: result.reference, resultSummary: { values: result.values }, archive: encodeBrewingScenarioArchive({ result }) };
    const forModel = scenarioEvidenceForModel({ id: 'E2', data });
    expect((forModel.data as any).archive).toBeUndefined();
    expect((forModel.data as any).fullArchiveAvailable).toBe(true);
    const linked = { ...data, archive: undefined, archiveReference: { evidenceId: 'E2' } };
    expect(readBrewingScenarioEvidence(linked, id => id === 'E2' ? data : undefined).result).toEqual(result);
    expect(() => readBrewingScenarioEvidence(linked)).toThrow();
  });
});
