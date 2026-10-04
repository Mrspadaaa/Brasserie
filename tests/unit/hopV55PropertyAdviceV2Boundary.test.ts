import { describe, expect, it } from 'vitest';
import type { EditorCoreIntent } from '../../src/ui/hopV55/propertyAdviceIntentEditorCore';
import { toV2Intent } from '../../src/ui/hopV55/PropertyAdviceIntentEditor';
import { makeHopPropertyCompensationRequestV3 } from '../fixtures/hopPropertyCompensation';

describe('frontière de conversion d’une intention vers V2', () => {
  it('accepte explicitement l’absence du champ V3 et refuse toute présence, même nulle ou falsy', () => {
    const source = makeHopPropertyCompensationRequestV3().propertyIntents.find((row) => row.role === 'reportedObservation')!;
    const noV3Field = structuredClone(source) as EditorCoreIntent;
    expect(Object.prototype.hasOwnProperty.call(noV3Field, 'investigation')).toBe(false);
    expect(toV2Intent(noV3Field)).toEqual(source);

    for (const value of [undefined, null, false, 0, '', {}]) {
      const contaminated = { ...noV3Field, investigation: value } as unknown as EditorCoreIntent;
      expect(Object.prototype.hasOwnProperty.call(contaminated, 'investigation')).toBe(true);
      expect(() => toV2Intent(contaminated), `valeur présente ${String(value)}`).toThrow(/V3/u);
    }
  });
});
