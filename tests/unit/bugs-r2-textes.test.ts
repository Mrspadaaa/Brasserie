import { describe, expect, it } from 'vitest';
import { HOP_STAGE } from '../../src/domain/hopStage';
import { yeastPitchingSummary } from '../../src/ui/YeastPitchingPanel';
import type { YeastSpec } from '../../src/types';

// Voie r2, 20.11 : textes de la fiche de recette que le critique k2 a relevés.
describe('bugs r2 : textes', () => {
  it('BK2-3 : l’aide de l’ébullition n’écrit pas « AVANT » en capitales au milieu d’une phrase', () => {
    for (const style of Object.values(HOP_STAGE)) expect(style.hint).not.toMatch(/\b[A-ZÉ]{4,}\b/);
    expect(HOP_STAGE.boil.hint).toMatch(/avant la fin de l’ébullition/);
  });

  it('BK2-2 : sans produit choisi, la ligne de levure ne se lit pas comme une contradiction avec le produit nommé au-dessus', () => {
    const yeast = { name: 'Wyeast 3068', form: 'liquide', qty: 125, unit: 'mL' } as unknown as YeastSpec;
    expect(yeastPitchingSummary(yeast)).not.toMatch(/non choisi/i);
    expect(yeastPitchingSummary(yeast)).toMatch(/conditionnement/i);
  });
});
