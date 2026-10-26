// @vitest-environment jsdom
// Voie m3-listes-u4 : l'ordre imposé de l'écran Substituer (développement seulement), et son contrôle de capture fidèle.
//  - `window.__hopSubstituerOrdre` remplace le classement du moteur, sans rien changer d'autre à ce que l'écran lit ;
//  - sans lui, le classement du moteur revient (la mémoire de calcul ne garde pas l'ordre imposé) ;
//  - le contrôle `controle-capture-fidele.mjs` refuse un script qui masque l'écran de l'app (m2) et en accepte un qui n'y touche pas.
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { lireRemplacants } from '../../../src/ui/hopIndex/substituer/donnees';
import type { AjoutParcours, RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';
// @ts-expect-error module .mjs sans types
import { mesurePerdante, nodesCaches, sansCommentaires } from '../../../work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs';

const ORIGINAL = 'beermaverick-nelson-sauvin';
const moteur = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const res = moteur.substitutes(ORIGINAL, { moment: 'dryActive' });
const ajout = { id: 'a1', hopKey: ORIGINAL, grams: 10, moment: 'dryhop' } as unknown as AjoutParcours;
const recette = { styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, additions: [ajout] } as unknown as RecetteParcours;
afterEach(() => { delete window.__hopSubstituerOrdre; vi.restoreAllMocks(); });

describe('ordre imposé de Substituer (développement)', () => {
  it('sans ordre imposé : le classement du moteur, avec ses plages', () => {
    const l = lireRemplacants(recette, ajout, res);
    expect(l.candidats.length).toBeGreaterThan(0);
    expect(l.candidats.length).toBeLessThanOrEqual(8);
  });

  it('un ordre imposé remplace le classement : même ordre, score de la colonne en point, le reste du moteur', () => {
    const l0 = lireRemplacants(recette, ajout, res);
    const choix = res.remplacants.filter((s) => s.stock.etat !== 'en stock').slice(20, 30);
    expect(choix).toHaveLength(10);
    window.__hopSubstituerOrdre = choix.map((s, i) => ({ id: s.key, score: 60 - i }));
    const l = lireRemplacants(recette, ajout, res);
    expect(l.candidats.map((c) => c.cle)).toEqual(choix.map((s) => s.key));
    expect(l.candidats.map((c) => [c.min, c.max])).toEqual(choix.map((_, i) => [60 - i, 60 - i]));
    // Ce que le moteur dit de chaque candidat reste le sien : son score réel, sa dose, son stock, ses familles.
    choix.forEach((s, i) => {
      expect(l.candidats[i].moteur).toBe(s.score);
      expect(l.candidats[i].stock).not.toBe('suffisant');
      expect(l.candidats[i].dose.regle).toBe(s.dose.regle);
    });
    expect(l.total).toBe(l0.total);
    expect(l.poids).toEqual(l0.poids);
    // Sorti de l'ordre imposé, le moteur reprend : la mémoire n'a pas gardé la liste imposée.
    delete window.__hopSubstituerOrdre;
    expect(lireRemplacants(recette, ajout, res).candidats.map((c) => c.cle)).toEqual(l0.candidats.map((c) => c.cle));
  });

  it('un id que le moteur ne propose pas est ignoré et signalé, pas inventé', () => {
    const avert = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bon = res.remplacants[0].key;
    window.__hopSubstituerOrdre = [{ id: 'beermaverick-nexiste-pas', score: 80 }, { id: bon, score: 70 }];
    const l = lireRemplacants(recette, ajout, res);
    expect(l.candidats.map((c) => c.cle)).toEqual([bon]);
    expect(avert).toHaveBeenCalledWith(expect.stringContaining('beermaverick-nexiste-pas'));
  });

  it('une liste vide n\'impose rien', () => {
    window.__hopSubstituerOrdre = [];
    const l = lireRemplacants(recette, ajout, res);
    expect(l.candidats.length).toBeLessThanOrEqual(8);
  });

  it('le code source garde l\'ordre imposé derrière import.meta.env.DEV (aucune lecture hors de ce garde)', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../../src/ui/hopIndex/substituer/donnees.ts'), 'utf8');
    const lectures = [...src.matchAll(/=\s*window\.__hopSubstituerOrdre;/g)];
    expect(lectures.length).toBe(1);
    const i = src.indexOf('= window.__hopSubstituerOrdre;');
    expect(src.slice(src.lastIndexOf('function ordreImpose', i), i)).toMatch(/if \(import\.meta\.env\.DEV\) \{/);
  });
});

describe('controle-capture-fidele : F1 (rien de caché) et F2 (mesure)', () => {
  const m2 = fs.readFileSync(path.resolve(__dirname, '../../../work/missions/2026-10-25-integration-houblons/voies/m2-listes-substituts/capturer.mjs'), 'utf8');
  const m3 = fs.readFileSync(path.resolve(__dirname, '../../../work/missions/2026-10-25-integration-houblons/voies/m3-listes-u4/capturer.mjs'), 'utf8');

  it('F1 : le script de m2 est refusé (:not(...) { display: none }, bloc du dock)', () => {
    const d = nodesCaches(m2) as string[];
    expect(d.length).toBeGreaterThanOrEqual(2);
    expect(d.join('\n')).toMatch(/:not\(\.m2l-ajout\)/);
    expect(d.join('\n')).toMatch(/choix-dock/);
  });
  it('F1 : le script de m3 passe', () => { expect(nodesCaches(m3)).toEqual([]); });

  it.each([
    ['.pq-substituer > :not(.x) { display: none; }', 1],
    ['.pq-substituer-moments { visibility: hidden }', 1],
    ['[data-ecran="substituer"] h2 { opacity: 0 }', 1],
    ['.pq-substituer-r { height: 0px !important; }', 1],
    ['.m3-mien { display: none }', 0],
    ['.pq-substituer-r { opacity: 0.5 }', 0],
    ['.pq-substituer-r { display: flex; }', 0],
    ['x.style.display = "none"', 1],
    ['n.setAttribute("hidden", "")', 1],
    ['// .pq-substituer > :not(.x) { display: none }', 0],
    ['/* .pq-substituer * { visibility: hidden } */ const a = 1;', 0],
  ])('F1 : « %s » → %i défaut(s)', (texte, n) => { expect(nodesCaches(texte)).toHaveLength(n); });

  it('sansCommentaires garde une URL et retire un commentaire de ligne', () => {
    expect(sansCommentaires('a("http://x.y"); // c\nb')).toContain('http://x.y');
    expect(sansCommentaires('a; // c\nb')).not.toContain('// c');
  });

  it('F2 : moins de nœuds visibles hors rangées ou un bloc perdu : refusé ; égal ou plus : accepté', () => {
    const mesure = (avant: object, apres: object) => ({ mesures: [{ image: 'x.png', avant, apres }] });
    expect(mesurePerdante(mesure({ noeudsHorsRangs: 800, blocs: ['h2:Face à face'] }, { noeudsHorsRangs: 12, blocs: [] }))).toHaveLength(2);
    expect(mesurePerdante(mesure({ noeudsHorsRangs: 800, blocs: ['a', 'b'] }, { noeudsHorsRangs: 900, blocs: ['a'] }))[0]).toMatch(/blocs perdus.*b/);
    expect(mesurePerdante(mesure({ noeudsHorsRangs: 800, blocs: ['a'] }, { noeudsHorsRangs: 800, blocs: ['a', 'c'] }))).toEqual([]);
    // La colonne A est la référence des blocs (pas des nœuds : ils suivent les données).
    const avecA = (blocsA: string[], blocs: string[]) => ({ mesures: [{ image: 'b.png', avant: { noeudsHorsRangs: 800, blocs }, apres: { noeudsHorsRangs: 800, blocs }, referenceA: { noeudsHorsRangs: 950, blocs: blocsA } }] });
    expect(mesurePerdante(avecA(['a', 'b'], ['a', 'b']))).toEqual([]);
    expect(mesurePerdante(avecA(['a', 'b'], ['a']))[0]).toMatch(/colonne A absents.*b/);
    expect(mesurePerdante({ mesures: [] })).toHaveLength(1);
    expect(mesurePerdante(mesure({ noeudsHorsRangs: null, blocs: [] }, { noeudsHorsRangs: 5, blocs: [] }))[0]).toMatch(/incomplète/);
  });
});
