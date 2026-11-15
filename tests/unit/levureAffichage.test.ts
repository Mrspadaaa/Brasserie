import { describe, expect, it } from 'vitest';
import { identiteLevure, noteLevureAJour, reglageQuantiteLevure, densiteDebutEbullition } from '../../src/domain/levure/affichage';

/** Recette en ligne 15.11 : RL-1 à RL-4, les règles pures. */
describe('identiteLevure (RL-3 : « Wyeast Wyeast · 1056 American Ale® · 1056 »)', () => {
  it('le nom du catalogue porte déjà le fabricant et le code : rien n’est doublé', () => {
    expect(identiteLevure({ name: 'Wyeast · 1056 American Ale®', lab: 'Wyeast', strain: '1056' })).toBe('Wyeast · 1056 American Ale®');
  });
  it('un nom court garde son fabricant et son code, chacun une fois', () => {
    expect(identiteLevure({ name: 'American Ale', lab: 'Wyeast', strain: '1056' })).toBe('Wyeast · American Ale · 1056');
    expect(identiteLevure({ name: 'SafAle US-05' })).toBe('SafAle US-05');
  });
  it('la comparaison ignore casse, accents et ponctuation', () => {
    expect(identiteLevure({ name: 'Fermentis SafAle™ US-05', lab: 'fermentis', strain: 'us 05' })).toBe('Fermentis SafAle™ US-05');
  });
});

describe('noteLevureAJour (RL-3 : « Quantité et conduite à définir » alors que tout est saisi)', () => {
  const note = 'Référence fabricant : Wyeast 1056. Quantité et conduite à définir pour le moût.';
  it('quantité et conduite saisies : la phrase part, la référence reste', () => {
    expect(noteLevureAJour(note, { quantiteSaisie: true, conduiteSaisie: true })).toBe('Référence fabricant : Wyeast 1056.');
  });
  it('seul ce qui manque encore est nommé', () => {
    expect(noteLevureAJour(note, { quantiteSaisie: true, conduiteSaisie: false })).toContain('Conduite à définir pour le moût.');
    expect(noteLevureAJour(note, { quantiteSaisie: false, conduiteSaisie: true })).toContain('Quantité à définir pour le moût.');
    expect(noteLevureAJour(note, { quantiteSaisie: false, conduiteSaisie: false })).toBe(note);
  });
  it('une note libre n’est jamais touchée', () => {
    expect(noteLevureAJour('Starter de 1 L.', { quantiteSaisie: true, conduiteSaisie: true })).toBe('Starter de 1 L.');
    expect(noteLevureAJour(undefined, { quantiteSaisie: true, conduiteSaisie: true })).toBe('');
  });
});

describe('reglageQuantiteLevure (RL-2 : « sachet / g » pour une levure liquide)', () => {
  it('liquide : sachet ou mL, pas de g ; sèche : sachet ou g', () => {
    expect(reglageQuantiteLevure('liquide', 'sachet', 1).unites).toEqual(['sachet', 'mL']);
    expect(reglageQuantiteLevure('sèche', 'g', 11).unites).toEqual(['sachet', 'g']);
  });
  it('l’unité déjà saisie reste dans le sélecteur : il ne ment jamais', () => {
    expect(reglageQuantiteLevure('liquide', 'L', 0.125).unites).toEqual(['sachet', 'mL', 'L']);
  });
  it('la plage du curseur suit l’unité, et contient toujours la valeur en place', () => {
    expect(reglageQuantiteLevure('liquide', 'mL', 125)).toMatchObject({ max: 500, step: 5 });
    expect(reglageQuantiteLevure('liquide', 'mL', 900).max).toBe(900);
    expect(reglageQuantiteLevure('sèche', 'sachet', 2)).toMatchObject({ max: 6, step: 0.5 });
  });
});

describe('densiteDebutEbullition (RL-4 : 1,048 = OG pour 29,7 L avant ébullition et 24 L en fermenteur)', () => {
  const equipement = { boilOffLPerHour: 5.7, coolingShrinkagePct: 4 };
  it('pré = 1 + (OG − 1) × V après / V avant : plus basse que l’OG', () => {
    // 33 L à chaud avant, 5,7 L évaporés en 60 min : 27,3 / 33 = 0,827 → 1 + 0,048 × 0,827 = 1,0397
    const pre = densiteDebutEbullition({ ogTarget: 1.048, boilMin: 60, preBoilHotL: 33, brewhouse: { equipment: equipement } } as never);
    expect(pre).toBe(1.04);
    expect(pre!).toBeLessThan(1.048);
  });
  it('une donnée manque : rien, jamais l’OG à la place', () => {
    expect(densiteDebutEbullition({ ogTarget: 1.048, boilMin: 60, brewhouse: { equipment: equipement } } as never)).toBeUndefined();
    expect(densiteDebutEbullition({ ogTarget: 1.048, boilMin: 60, preBoilHotL: 33 } as never)).toBeUndefined();
  });
});
