// 27.10, le brasseur : « SI je fais tropicale, puis ensuite je banis résine. Rien ne se passe. Les bannissement semble pas fonctionner ».
// Bannir (visée 0) une famille que ma bière n'a pas (≈ 0) faisait un écart nul : l'objectif disparaissait, la direction du moteur
// ne changeait pas. Il reste un objectif « faire baisser » d'un cran, et la carte le dit tenu si la meilleure voie ne la fait pas monter.
import { describe, expect, it } from 'vitest';
import type { FamilyId } from '../../../src/domain/hopIndex/v4';
import type { BiereLue } from '../../../src/ui/hopIndex/parcours/adaptateur';
import type { RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';
import { directionDe, objectifsDe, verdict, type Groupe, type Ligne, type Objectif } from '../../../src/ui/hopIndex/suggerer/voies';

const profil = (valeurs: Partial<Record<FamilyId, number>>) => new Proxy({}, {
  get: (_t, f: string) => ({ nom: f, valeur: valeurs[f as FamilyId] == null ? null : { centre: valeurs[f as FamilyId] } }),
});
const biere = { profil: profil({ tropical: 10, resin: 0, floral: 5 }) } as unknown as BiereLue;
const recette = { styleCode: '22A' } as unknown as RecetteParcours;

describe('bannir une famille déjà à 0 (27.10)', () => {
  it('reste un objectif « faire baisser », et la direction du moteur le porte', () => {
    const os = objectifsDe(recette, biere, { tropical: 2.5, resin: 0 });
    const r = os.find((o) => o.f === 'resin');
    expect(r).toBeDefined();
    expect(r!.bannie).toBe(true);
    expect(r!.sens).toBe(-1);
    expect(directionDe(os).resin).toBe(-1);
    expect(directionDe(os).tropical).toBeGreaterThan(0);
  });
  it('une visée non bannie déjà atteinte ne fait toujours pas d’objectif', () => {
    const os = objectifsDe(recette, { profil: profil({ tropical: 10, resin: 0, floral: 50 }) } as unknown as BiereLue, { floral: 1.5 });
    expect(os.find((o) => o.f === 'floral')).toBeUndefined();
  });
  it('la carte dit tenu si la meilleure voie ne fait pas monter la famille bannie, sinon « Aucune »', () => {
    const o: Objectif = { f: 'resin', sens: -1, nom: 'résineux', cran: 8, requis: -8, avant: 0, visee: 0, palier: 0, bannie: true };
    const ligne = (id: string, resin: number) => ({ id, effets: { resin }, hors: [] } as unknown as Ligne);
    const g = (ls: Ligne[]) => [{ id: 'meme-0', lignes: ls } as unknown as Groupe];
    expect(verdict(o, g([ligne('a', 6), ligne('b', 1)])).mot).toBe('Atteint');
    expect(verdict(o, g([ligne('a', 6), ligne('b', 1)])).meilleure?.id).toBe('b');
    expect(verdict(o, g([ligne('a', 6), ligne('b', 5)])).mot).toBe('Aucune');
  });
});
