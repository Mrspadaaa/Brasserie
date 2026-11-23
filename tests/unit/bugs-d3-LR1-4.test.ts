/**
 * LR1-4, LR2-8, LR3-2 (voie d3b) : la même photo BAUHAUS (doc25, réponses ENREGISTRÉES du modèle, anonymisées : `tests/unit/depense/g1/brut/`) se range pareil à chaque tirage (Rénovation).
 * Classement de la PIÈCE par le vote de toutes ses lignes (`classerLaPiece`, « ## État de l'art — d3b » de MISSION.md). Le tableau avant/après porte sur CHAQUE lecture enregistrée
 * (« avant » = la règle des 3 mots sans équivoque, seule, `raison === 'regle-sure'`) : aucune pièce déjà juste ne change.
 * Mesure du 20.11 avant correctif (rouge) : doc25-provisoire-t2 (lue « materiel », 19 lignes « equipment », mots déformés par la tache) : 18 lignes en « Matériel de brassage » ; doc25-ticket-t1 (lue « renovation ») : 22 en Rénovation.
 */
import { describe, expect, it } from 'vitest';
import { categorieDeLaPiece, classerLaPiece, familleDe, PART_TRAVAUX, QUORUM_TRAVAUX, voteDeLigne } from '../../src/ui/depense/familles';
import { enteteDeLecture } from '../../src/ui/depense/finale';
import { brut, lireFixture, normaliser } from './depense/g1/lire';

const DOC25 = ['doc25-provisoire-t1', 'doc25-provisoire-t2', 'doc25-ticket-t1'];
const AUTRES = ['doc14-port-en-ligne', 'doc2-sedation'];

const rangement = (r: any, categorie: string | undefined) => {
  const familles = r.items.map((i: any) => familleDe({ nom: i.name, kind: i.kind, categorie, stockCategory: i.stockCategory }));
  return { materiel: familles.filter((f: string) => f === 'materiel').length, renovation: familles.filter((f: string) => f === 'renovation').length };
};
const classer = (nom: string, i: number) => {
  const l = normaliser(nom)[i];
  return { lue: brut(nom).lectures[i].category as string, ...classerLaPiece(brut(nom).lectures[i].category, l.items.map((x: any) => x.name), l.items.map((x: any) => x.amountTTC)) };
};

describe('LR1-4 / LR2-8 / LR3-2 : le rangement de la photo BAUHAUS ne dépend pas du tirage', () => {
  it('le vote des lectures du doc25 (final) : Rénovation, aucune ligne en Matériel de brassage, même pour les deux tirages', async () => {
    for (const nom of ['doc25-ticket-t1', 'doc25-provisoire-t2']) {
      const r = await lireFixture(nom);
      const c = categorieDeLaPiece(r.category, r.items.map((i: any) => i.name), r.items.map((i: any) => i.amountTTC));
      expect(c, nom).toBe('renovation');
      expect(rangement(r, c).materiel, nom).toBe(0);
    }
  });
  it('CHAQUE lecture enregistrée du doc25, catégorie lue « materiel » (mots déformés) ou « renovation » : Rénovation, le vote le dit', () => {
    for (const nom of DOC25) brut(nom).lectures.forEach((_, i) => {
      const c = classer(nom, i);
      expect(c.categorie, `${nom} L${i + 1}`).toBe('renovation');
      expect(['vote', 'lue']).toContain(c.raison);
      if (c.lue === 'materiel') expect(c.raison).toBe('vote');
    });
  });
  it('aucune pièce déjà juste ne change : le brassage et le « divers » gardent leur catégorie lue, avant = après', () => {
    for (const nom of AUTRES) brut(nom).lectures.forEach((_, i) => {
      const c = classer(nom, i);
      expect(c.categorie, `${nom} L${i + 1}`).toBe(c.lue);
      expect(['lue', 'brassage']).toContain(c.raison);
      if (c.part !== undefined) expect(c.part).toBeLessThan(0); // une facture de brasserie : le vote est du côté du brassage, très loin du seuil
    });
  });
  it('l\'en-tête que la lecture propose (finale.ts) range la catégorie du ticket tâché en Rénovation', async () => {
    const r = await lireFixture('doc25-provisoire-t2');
    const e = enteteDeLecture({ lines: [] } as any, r, '2026-11-20');
    expect(e.category).toBe('renovation');
  });
  it('les mots déformés par la tache comptent (distance bornée) ; un mot de brassage vote contre, le reste ne vote pas', () => {
    expect(voteDeLigne('COMBINAIBON JETABLE')).toBeGreaterThan(0);
    expect(voteDeLigne('BAC A PEIRSURE 32266')).toBeGreaterThan(0.5);
    expect(voteDeLigne('Cuve inox 50 L')).toBe(-1);
    expect(voteDeLigne('Houblon Citra 100 g')).toBe(-1);
    expect(voteDeLigne('MARKEL LETNEER')).toBe(0);
    expect(voteDeLigne('')).toBe(0);
  });
  it('un ticket de brasserie qui a quelques outils reste du brassage ; vote faible ou court : la catégorie lue reste, et le dit', () => {
    const outils = ['Brosse', 'Seau', 'Gants', 'Éponge', 'Chiffon', 'Pince', 'Balai', 'Entonnoir', 'Ruban'];
    const brasserie = ['Malt Pilsner 5 kg', 'Houblon Citra 100 g', 'Levure US-05', 'Cuve inox 50 L', 'Fermenteur 30 L', 'Spider bag', 'Sucre candi 1 kg', 'Capsules 100'];
    const c = classerLaPiece('brassage', [...outils, ...brasserie]);
    expect(c.categorie).toBe('brassage');
    expect(c.raison).toBe('brassage');
    expect(classerLaPiece('materiel', outils.slice(0, QUORUM_TRAVAUX - 1)).categorie).toBe('materiel'); // sous le quorum
    expect(PART_TRAVAUX).toBeGreaterThan(0);
    expect(classerLaPiece('divers', outils).categorie).toBe('divers');
    expect(classerLaPiece(undefined, outils).categorie).toBeUndefined();
  });
  it('un montant lu absent ne pèse pas 0 : la médiane des montants lus', () => {
    const noms = ['Brosse', 'Seau', 'Gants', 'Éponge', 'Chiffon', 'Pince', 'Balai', 'Entonnoir', 'Ruban', 'Rouleau'];
    expect(classerLaPiece('materiel', noms, noms.map(() => undefined)).categorie).toBe('renovation');
    expect(classerLaPiece('materiel', noms, noms.map(() => null)).categorie).toBe('renovation');
  });
});
