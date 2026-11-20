/**
 * LR1-4, LR2-8, LR3-2 (voie d3) : la même photo BAUHAUS (doc25, réponses ENREGISTRÉES du modèle, anonymisées : `tests/unit/depense/g1/brut/`) doit se ranger pareil à chaque tirage.
 * Mesure du 20.11 : `doc25-ticket-t1` (catégorie lue « renovation ») : 22 lignes en Rénovation ; `doc25-provisoire-t2` (catégorie lue « materiel », 19 lignes de nature « equipment », mots déformés
 * par la tache : BAC A PEIRSURE, BROSSE LATTER AB, SEAU TEI ROUGE…) : 18 lignes en « Matériel de brassage ». `categorieDeLaPiece` ne compte que 1 mot de travaux SANS équivoque (CUTTER) sur 3 exigés :
 * la pièce garde la catégorie lue. Le correctif est un classement de la PIÈCE à partir de toutes ses lignes (vote), donc un algorithme : « état de l'art à faire » (L29, 2e rustine sur ce module).
 * `it.fails` : vert tant que le défaut existe ; il devient rouge quand le défaut est corrigé : retirer alors `.fails`.
 */
import { describe, expect, it } from 'vitest';
import { categorieDeLaPiece, familleDe } from '../../src/ui/depense/familles';
import { lireFixture } from './depense/g1/lire';

const compte = async (nom: string) => {
  const r = await lireFixture(nom);
  const categorie = categorieDeLaPiece(r.category, r.items.map((i: any) => i.name));
  const familles = r.items.map((i: any) => familleDe({ nom: i.name, kind: i.kind, categorie, stockCategory: i.stockCategory }));
  return { lue: r.category, categorie, materiel: familles.filter((f: string) => f === 'materiel').length, renovation: familles.filter((f: string) => f === 'renovation').length };
};

describe('LR1-4 : le rangement de la photo BAUHAUS ne dépend pas du tirage', () => {
  it('tirage où la catégorie lue est « renovation » : Rénovation, aucun matériel de brassage (déjà juste)', async () => {
    const c = await compte('doc25-ticket-t1');
    expect(c.materiel).toBe(0);
    expect(c.renovation).toBe(22);
  });
  it.fails('tirage où la catégorie lue est « materiel » (mots déformés) : aucune ligne de la photo ne devrait être du « Matériel de brassage »', async () => {
    const c = await compte('doc25-provisoire-t2');
    expect(c.materiel).toBe(0);
  });
});
