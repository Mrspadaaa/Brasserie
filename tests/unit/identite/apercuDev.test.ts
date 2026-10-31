import { describe, expect, it } from 'vitest';
import { recetteApercuIdentite } from '../../../src/ui/identite/apercuDev';
import { resolveBrewingStyle } from '../../../src/domain/brewingStyles';
import { teinteDuStyle } from '../../../src/ui/identite/teinteStyle';

// La fixture de l'étape Identité (`?dev-local&etape=houblons&recette=identite`) doit pouvoir jouer ce que la série Chrome mesure :
// des grains (donc un plan d'eau, un moût avant ébullition, une cuve qui peut déborder) et un style qui se résout seul (donc des plages).
describe('fixture d’Identité (apercuDev)', () => {
  it('a des grains avec une masse chiffrée', () => {
    const r = recetteApercuIdentite();
    const grains = (r.fermentables ?? []).filter((f) => f.kind === 'grain');
    expect(grains.length).toBeGreaterThan(0);
    expect(grains.every((g) => g.weightKg > 0)).toBe(true);
  });

  it('a un style qui se résout seul, donc des plages, et une famille de couleur', () => {
    const r = recetteApercuIdentite();
    const s = resolveBrewingStyle(r.style);
    expect(s?.code).toBe('16D');
    expect(s?.stats.og).toBeTruthy();
    expect(teinteDuStyle(r.style)).not.toBeNull();
  });

  it('un code seul (« 16D ») ne se résout pas : c’est pourquoi la fixture porte le nom du style', () => {
    expect(resolveBrewingStyle('16D')).toBeUndefined();
  });

  it('ne partage pas l’identifiant de la fixture des Houblons (brouillons séparés)', () => {
    expect(recetteApercuIdentite().id).not.toBe('apercu-etape-houblons');
  });
});
