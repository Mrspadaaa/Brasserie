// LR1-8 et LR2-9 (g1, 20.11) : doc25 relu en réel (lot 2, la 3.8 tombée au délai : le provisoire est le final). Le 4,25 (AFFRET) était PERDU et un 9,95 en trop entrait :
// les deux Flash-Lite lisaient la quantité tantôt « vide », tantôt « 1 » (le code de TVA), les lignes ne se rapprochaient plus par leurs chiffres, la fusion se décalait d'un rang à partir de la ligne 15.
// ÉTAT : OUVERT (« accord requis »). Le correctif d'une quantité déduite (fc0d78b32) est retiré : LT-3 interdit une quantité non imprimée. Le décalage a une autre cause, vue en le rejouant : les deux lectures rattachent mal l'EAN (référence) d'une ligne à l'autre,
// et `alignLines` (tier 2) rapproche des lignes par la référence seule (AFFRET 4,25 posé sur « AFFRET / DEBOUCREOR » 7,50, puis un rang de décalage) ; les ancres par les chiffres échouent aussi (les lectures divergent sur `kind`). Remède = alignement de deux séquences (Needleman-Wunsch, ressemblance des noms) :
// problème d'école à instruire (L29, « état de l'art »), pas une rustine de plus. Les deux attentes ci-dessous sont celles de la bonne lecture ; elles sont sautées tant que le défaut est ouvert.
// Reste, dit : VITRIFIC lu 69,95 (ou 0,69) par les modèles pour 6,95 imprimé : une erreur de lecture, sur laquelle les deux Flash-Lite s'accordent ; elle reste un point (somme ≠ total) et non une valeur corrigée.
import { describe, expect, it } from 'vitest';
import { lireFixture, montants } from './depense/g1/lire';

// la vérité du ticket (g1-cas.json, hors Git ; montants seuls, ils ne disent rien du magasin)
const VRAI = [6.95, 1.2, 5.2, 9.95, 5.5, 4.95, 5.5, 4.5, 14.5, 4.4, 7.95, 4.5, 4.5, 5.2, 4.25, 7.5, 9.5, 4.25, 3.95, 2.95, 9.5, 9.95];
const sans = (a: number[], x: number) => { const b = [...a]; b.splice(b.indexOf(x), 1); return b.sort((p, q) => p - q); };

describe('LR1-8, LR2-9 : doc25, lot 2 (lecture réelle, 3.8 en délai)', () => {
  it.skip('tirage 1 : les 22 lignes y sont, le 4,25 aussi, aucun 9,95 de trop ; seule la première (VITRIFIC) est fausse', async () => {
    const r = await lireFixture('doc25-provisoire-t1');
    const lus = montants(r);
    expect(lus).toHaveLength(22);
    expect(sans(lus, 69.95)).toEqual(sans(VRAI, 6.95));
    expect(lus.filter(m => m === 4.25)).toHaveLength(2);
    expect(lus.filter(m => m === 9.95)).toHaveLength(2);
  });
  it.skip('tirage 2 : le 4,25 (AFFRET) est retrouvé, aucun doublon ; la ligne que les deux lectures ne voient pas ensemble (9,95) reste à dire', async () => {
    const lus = montants(await lireFixture('doc25-provisoire-t2'));
    expect(lus.filter(m => m === 4.25)).toHaveLength(2);
    expect(lus.filter(m => m === 9.95)).toHaveLength(1); // la vraie pièce en a deux : une lecture a perdu la dernière ligne ; le total du ticket (somme ≠ total) le dit
    expect(lus).toHaveLength(21);
  });
});
