import { describe, expect, it } from 'vitest';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { hopV55QualifiedContentReference } from '../../src/services/hopV55/operationScopedQualifiedValidation';

/** Gros dossier plat façon catalogue complet : ~318 fiches de houblon avec arômes, sources et mesures. */
function bigCatalogue(seed: number) {
  return { reference: `catalogue:${seed}`, hops: Array.from({ length: 318 }, (_, index) => ({
    id: `hop-${index}`, name: `Houblon ${index}`, alpha: { min: 3 + (index % 7), max: 6 + (index % 9), source: { id: `src-${index}`, url: `https://example.test/${index}` } },
    aromas: Array.from({ length: 12 }, (_unused, k) => ({ family: `famille-${k}`, weight: (index + k) % 5, words: [`mot-${index}-${k}`, 'agrume', 'résine'] })),
    notes: { seed, stock: null, unknown: undefined },
  })) };
}

describe('mémoire des références de contenu (#177)', () => {
  it('rend la même référence que la voie d’origine, sur un contenu neuf ou déjà vu', () => {
    const value = bigCatalogue(1);
    const first = hopV55QualifiedContentReference('test-memo', value);
    expect(first).toBe(hopAdviceContentReference('test-memo', value));
    expect(hopV55QualifiedContentReference('test-memo', structuredClone(value))).toBe(first);
  });

  it('ne croit jamais l’identité : un objet modifié après coup change de référence', () => {
    const value = bigCatalogue(2);
    const before = hopV55QualifiedContentReference('test-memo', value);
    value.hops[100]!.aromas[3]!.weight += 1;
    const after = hopV55QualifiedContentReference('test-memo', value);
    expect(after).not.toBe(before);
    expect(after).toBe(hopAdviceContentReference('test-memo', value));
  });

  it('garde le préfixe dans la clé et le refus des nombres non finis', () => {
    const value = bigCatalogue(3);
    const a = hopV55QualifiedContentReference('prefixe-a', value);
    expect(hopV55QualifiedContentReference('prefixe-b', value)).not.toBe(a);
    const broken = { ...bigCatalogue(3), x: Number.NaN };
    expect(() => hopV55QualifiedContentReference('prefixe-a', broken)).toThrow();
    expect(() => hopV55QualifiedContentReference('prefixe-a', broken)).toThrow();
  });

  it('borne le coût d’une relecture à contenu égal sur un catalogue complet (hit au moins 3 fois plus rapide)', () => {
    const value = bigCatalogue(4);
    const timeOf = (work: () => unknown) => { const start = performance.now(); work(); return performance.now() - start; };
    const cold = timeOf(() => hopV55QualifiedContentReference('test-bound', value));
    const warm = Math.min(...Array.from({ length: 5 }, () => timeOf(() => hopV55QualifiedContentReference('test-bound', structuredClone(value)))));
    const clone = Math.min(...Array.from({ length: 5 }, () => timeOf(() => structuredClone(value))));
    // La relecture coûte une copie + une comparaison, jamais une sérialisation canonique et un SHA-256 de plus.
    expect(warm - clone).toBeLessThan(cold / 3 + 5);
    expect(cold).toBeLessThan(5000);
  });
});
