import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';

describe('empreintes des nouveaux dossiers de conseil', () => {
  it('correspond au SHA-256 natif sur du JSON Unicode et plusieurs blocs', () => {
    const values = [null, '', 'Citronné 🍋\u0000', { a: [1, null, false, 'é'], z: 'x'.repeat(100_001) }];
    for (const value of values) {
      const expected = createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
      expect(hopAdviceContentReference('fixture', value)).toBe(`fixture:sha256:${expected}`);
    }
  });

  it('ignore l’ordre des clés mais garde ordre, valeurs et absences des données', () => {
    const value = { z: { y: 3, a: null }, a: ['rose', 'citronné'] };
    expect(hopAdviceContentReference('f', value)).toBe(hopAdviceContentReference('f', { a: value.a, z: { a: null, y: 3 } }));
    for (const changed of [{ ...value, a: [...value.a].reverse() }, { ...value, z: { y: 3, a: 0 } }, { ...value, z: { y: 3 } }]) {
      expect(hopAdviceContentReference('f', changed)).not.toBe(hopAdviceContentReference('f', value));
    }
    expect(() => hopAdviceContentReference('f', { value: NaN })).toThrow();
  });

  it('garde des références bornées quand les reçus se succèdent', () => {
    const snapshot = { raw: 'preuve originale '.repeat(50_000) };
    const study = hopAdviceContentReference('study', snapshot);
    const preference = hopAdviceContentReference('preference', { study, reason: 'Motif explicite' });
    const preview = hopAdviceContentReference('preview', { study, preference, snapshot });
    const application = hopAdviceContentReference('application', { study, preference, preview });
    const restoration = hopAdviceContentReference('restoration', { study, preference, application });
    for (const reference of [study, preference, preview, application, restoration]) expect(reference.length).toBeLessThan(100);
    expect(snapshot.raw.length).toBe(850_000);
  });
});
