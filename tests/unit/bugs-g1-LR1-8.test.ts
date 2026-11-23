// LR1-8 et LR2-9 (g1 puis al1, 20.11) : doc25 relu en réel (lot 2, la 3.8 tombée au délai : le provisoire est le final). Le 4,25 (AFFRET) était PERDU et un 9,95 en trop entrait.
// Cause : les deux lectures rattachent l'EAN (référence) d'une ligne à la voisine ; `alignLines` rapprochait des lignes par la référence seule (AFFRET 4,25 posé sur « AFFRET / DEBOUCREOR » 7,50),
// puis tout se décalait d'un rang à partir de la ligne 15. (La quantité « 1 » déduite, fc0d78b32, n'était pas la cause entière ; LT-3 l'interdit et elle est retirée.)
// Remède (al1, « ## État de l'art — al1 » de MISSION.md) : alignement de deux séquences (Needleman-Wunsch), la ressemblance des noms et des montants, la référence comme preuve, l'ordre respecté.
// Reste, dit : VITRIFIC lu 69,95 (ou 0,69) par les modèles pour 6,95 imprimé : une erreur de lecture, sur laquelle les deux Flash-Lite s'accordent ; elle reste un point (somme ≠ total) et non une valeur corrigée.
import { describe, expect, it } from 'vitest';
import { lireFixture, montants } from './depense/g1/lire';

// la vérité du ticket (g1-cas.json, hors Git ; montants seuls, ils ne disent rien du magasin)
const VRAI = [6.95, 1.2, 5.2, 9.95, 5.5, 4.95, 5.5, 4.5, 14.5, 4.4, 7.95, 4.5, 4.5, 5.2, 4.25, 7.5, 9.5, 4.25, 3.95, 2.95, 9.5, 9.95];
const sans = (a: number[], x: number) => { const b = [...a]; b.splice(b.indexOf(x), 1); return b.sort((p, q) => p - q); };

describe('LR1-8, LR2-9 : doc25, lot 2 (lecture réelle, 3.8 en délai)', () => {
  it('tirage 1 : les 22 lignes y sont, le 4,25 aussi, aucun 9,95 de trop ; seule la première (VITRIFIC) est fausse', async () => {
    const r = await lireFixture('doc25-provisoire-t1');
    const lus = montants(r);
    expect(lus).toHaveLength(22);
    expect(sans(lus, 69.95)).toEqual(sans(VRAI, 6.95));
    expect(lus.filter(m => m === 4.25)).toHaveLength(2);
    expect(lus.filter(m => m === 9.95)).toHaveLength(2);
  });
  it('tirage 2 : chaque montant reste à son nom, aucun 9,95 de trop ; seule la ligne fondue par les deux lectures (AFFRET 4,25 dans DEBOUCREOR 7,50) manque, la somme ≠ total le dit', async () => {
    const lus = montants(await lireFixture('doc25-provisoire-t2'));
    expect(lus).toHaveLength(21);
    // tout le ticket sauf VITRIFIC (69,95 lu pour 6,95) et sauf AFFRET 4,25, que les deux lectures ont fondue avec la ligne suivante
    expect(sans(lus, 69.95)).toEqual(sans(sans(VRAI, 6.95), 4.25));
    expect(lus.filter(m => m === 9.95)).toHaveLength(2);
    // la fin du ticket, rangée par nom : ROULEAU 9,50, MASKTIUS 4,25, MARKEL 3,95, SEAU 2,95, COMBINAISON 9,50, MASQUE 9,95 (avec l'alignement par la référence, elle se décalait d'un rang)
    expect(lus.slice(-6)).toEqual([9.5, 4.25, 3.95, 2.95, 9.5, 9.95]);
  });
});
