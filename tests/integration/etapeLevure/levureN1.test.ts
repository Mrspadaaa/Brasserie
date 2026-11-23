// N1 levure et Ma levure (21.11) : le nom « SafAle US-05 » sur la carte, la floculation US-05 sourcée (Fermentis, sédimentation moyenne),
// et la ligne du fabricant qui dit lequel compte quand la dose est sous son bas (plainte du 20.11, n° 6, D391).
import { describe, expect, it } from 'vitest';
import { levure } from '../../../src/domain/levure';
import { nomDeCarte } from '../../../src/ui/etapeLevure/MaLevure';
import { ligneFabricant } from '../../../src/ui/etapeLevure/CarteDose';

describe('N1 levure : le nom de la carte', () => {
  it('« SafAle US-05 (Fermentis) » se lit « SafAle US-05 » (le fabricant est dit dessous)', () => {
    expect(nomDeCarte('SafAle US-05 (Fermentis)', true)).toBe('SafAle US-05');
  });
  it('une parenthèse qui n’est pas un fabricant reste', () => {
    expect(nomDeCarte('Kveik (Voss)', true)).toBe('Kveik (Voss)');
  });
  it('sans fabricant dit, le nom reste entier', () => {
    expect(nomDeCarte('SafAle US-05 (Fermentis)', false)).toBe('SafAle US-05 (Fermentis)');
  });
});

describe('Ma levure, point 6 : floculation US-05', () => {
  it('la floculation de SafAle US-05 est connue (moyenne, page Fermentis)', () => {
    const v = levure.valeurAxe(levure.trouver('fermentis-us05')!, 'clarte');
    expect(v?.niveau).toBe('moyen');
  });
});

describe('Ma levure, point 5 : la ligne du fabricant sous son bas (D391)', () => {
  const fab = { min: 15, max: 23, borne: false };
  it('1 sachet (11,5 g) couvre le besoin mais pas le fabricant : la ligne le dit', () => {
    expect(ligneFabricant(fab, 11.5, 10, 1.026)).toBe('sous le fabricant 15–23 g : l’OG 1,026 en demande moins');
  });
  it('sous le fabricant et sous le besoin : « sous le fabricant » seul (le mot de la quantité dit déjà le manque)', () => {
    expect(ligneFabricant(fab, 11.5, 14, 1.05)).toBe('sous le fabricant 15–23 g');
  });
  it('dans la plage : la ligne reste « fabricant 15–23 g »', () => {
    expect(ligneFabricant(fab, 20, 18, 1.05)).toBe('fabricant 15–23 g');
  });
});
