// 27.10, le brasseur : « SI je fais tropicale, puis ensuite je banis résine. Rien ne se passe » (D193), puis : « bannir doit être un
// objectif, on doit avoir aucune suggestions sur ce chemin et si il y en a de base ça suggère des houblons qui l'enlève » (D194).
// Bannir (visée 0) : un objectif « faire baisser », même quand ma bière n'en a pas ; une exclusion des houblons ajoutés qui citent la
// famille ; et une carte tenue quand rien ne l'ajoute, ou quand un remplacement l'enlève.
import { describe, expect, it } from 'vitest';
import type { FamilyId } from '../../../src/domain/hopIndex/v4';
import type { BiereLue, HoublonLu } from '../../../src/ui/hopIndex/parcours/adaptateur';
import type { RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';
import { bannisDe, directionDe, exclue, objectifsDe, verdict, type Groupe, type Ligne, type Objectif } from '../../../src/ui/hopIndex/suggerer/voies';

const profil = (valeurs: Partial<Record<FamilyId, number>>) => new Proxy({}, {
  get: (_t, f: string) => ({ nom: f, valeur: valeurs[f as FamilyId] == null ? null : { centre: valeurs[f as FamilyId] } }),
});
const biere = { profil: profil({ tropical: 10, resin: 0, floral: 5 }) } as unknown as BiereLue;
const recette = { styleCode: '22A' } as unknown as RecetteParcours;
const ligne = (id: string, resin: number, hors: FamilyId[] = []) => ({ id, geste: 'meme', effets: { resin }, hors } as unknown as Ligne);
const g = (ls: Ligne[]) => [{ id: 'meme-0', lignes: ls } as unknown as Groupe];
const banni = (avant: number): Objectif => ({ f: 'resin', sens: -1, nom: 'résineux', cran: 8, requis: -8, avant, visee: 0, palier: 0, bannie: true });

describe('bannir une famille (27.10, D193 et D194)', () => {
  it('reste un objectif « faire baisser » même quand ma bière n’en a pas, et la direction du moteur le porte', () => {
    const os = objectifsDe(recette, biere, { tropical: 2.5, resin: 0 });
    const r = os.find((o) => o.f === 'resin');
    expect(r?.bannie).toBe(true);
    expect(r?.sens).toBe(-1);
    expect(directionDe(os).resin).toBe(-1);
    expect(directionDe(os).tropical).toBeGreaterThan(0);
  });
  it('une visée non bannie déjà atteinte ne fait toujours pas d’objectif', () => {
    const os = objectifsDe(recette, { profil: profil({ tropical: 10, resin: 0, floral: 50 }) } as unknown as BiereLue, { floral: 1.5 });
    expect(os.find((o) => o.f === 'floral')).toBeUndefined();
  });
  it('bannisDe rend les familles à 0, et exclue écarte un houblon ajouté qui cite la famille', () => {
    expect(bannisDe({ tropical: 2.5, resin: 0 })).toEqual(['resin']);
    expect(bannisDe({ tropical: 2.5 })).toEqual([]);
    const h = (niveau: string) => ({ familles: new Proxy({}, { get: (_t, f) => ({ niveau: f === 'resin' ? niveau : 'non décrit' }) }) } as unknown as HoublonLu);
    expect(exclue([h('faible')], ['resin'])).toBe(true);
    expect(exclue([h('non décrit')], ['resin'])).toBe(false);
    expect(exclue([h('faible')], [])).toBe(false);
  });
  it('ma bière n’en a pas : la carte la dit tenue dès qu’une voie houblon est montrée (aucune ne l’ajoute)', () => {
    expect(verdict(banni(0), g([ligne('a', 6), ligne('b', 1)]))).toMatchObject({ mot: 'Atteint', meilleure: { id: 'b' } });
    expect(verdict(banni(0), [])).toMatchObject({ mot: 'Aucune' });
  });
  it('ma bière en a : un remplacement qui l’enlève, même hors du style ailleurs, tient la carte ; sinon « Aucune »', () => {
    expect(verdict(banni(16), g([ligne('ajout', 2), ligne('remplacer', -9, ['green'])])).mot).toBe('Atteint');
    expect(verdict(banni(16), g([ligne('ajout', 2), ligne('ajout2', 1)])).mot).toBe('Aucune');
  });
});
