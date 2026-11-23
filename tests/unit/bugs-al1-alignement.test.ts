// al1 (bugs-ecrans, 20.11) : LR1-8 et LR2-9. Alignement de deux lectures d'un même justificatif, ligne à ligne (Needleman-Wunsch sur la ressemblance du nom, du montant, de la référence ;
// « ## État de l'art — al1 » de MISSION.md). Avant : `alignLines` rapprochait des lignes par la référence seule ; doc25, dont les deux lectures rattachent l'EAN à la ligne voisine, se décalait d'un rang.
// Les réponses sont les VRAIES réponses enregistrées du modèle (tests/unit/depense/g1/brut), aucun appel.
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { alignerLignes } from '../../functions/src/invoiceVisionReview';
import { normaliser } from './depense/g1/lire';

const lignes = (...l: Array<[string, string, number | null]>) => normalizeInvoiceScan({ items: l.map(([name, reference, amountTTC]) => ({ name, reference, amountTTC, quantity: null, unit: '', kind: 'other' })) }).items;
const paires = (p: { match: Map<number, number> }) => [...p.match].sort((a, b) => a[0] - b[0]);

describe('al1 : alignement de lignes, doc25 (vraies réponses)', () => {
  it('tirage 1 : DEBOUCREOR (7,50) est rapprochée de la ligne fusionnée de l\'autre lecture, AFFRET (4,25) reste sans vis-à-vis, aucun décalage ensuite', () => {
    const [a, b] = normaliser('doc25-provisoire-t1');
    const p = alignerLignes(a.items, b.items);
    expect(p.orphansBase).toEqual([14]); // AFFRET 4,25 : l'autre lecture l'a fondue dans « AFFRET … / DEBOUCREOR … »
    expect(p.orphansOther).toEqual([]);
    expect(p.match.get(15)).toBe(14);
    for (let i = 16; i <= 21; i++) expect(p.match.get(i)).toBe(i - 1); // ROULEAU … MASQUE : chacune retrouve son nom, malgré des EAN rattachés à la voisine
    for (let i = 0; i <= 13; i++) expect(p.match.get(i)).toBe(i);
  });
  it('tirage 2 : les mêmes noms de part et d\'autre, 21 lignes rapprochées une à une, aucune orpheline', () => {
    const [a, b] = normaliser('doc25-provisoire-t2');
    const p = alignerLignes(a.items, b.items);
    expect(p.orphansBase).toEqual([]);
    expect(p.orphansOther).toEqual([]);
    expect(paires(p).every(([i, j]) => i === j)).toBe(true);
  });
  it('ticket (trois lectures) : lecture 1 contre la 3.8, les 21 et 22 lignes se rapprochent par leurs noms malgré les EAN décalés', () => {
    const [a, , c] = normaliser('doc25-ticket-t1');
    const p = alignerLignes(a.items, c.items);
    expect(p.orphansOther).toEqual([15]); // DEBOUCREOR : la lecture 1 l'a fondue dans « AFFRET … / DEBOUCREOR … »
    expect(p.orphansBase).toEqual([]);
    expect(p.match.get(14)).toBe(14); // la ligne fusionnée ↔ AFFRET : le nom et le montant (4,25) y sont
    expect(p.match.get(15)).toBe(16); // ROULEAU : par son nom, pas par un montant que la lecture 1 a posé une ligne plus haut
    expect(p.match.get(20)).toBe(21);
  });
});

describe('al1 : ce qui compte comme preuve', () => {
  it('une référence égale rapproche deux lignes dont le nom est lu autrement, si le montant concorde aussi', () => {
    const p = alignerLignes(lignes(['PIRCE LUPULIN', '4005556899657', 6.95]), lignes(['PIECE LUPLIN X', 'EAN: 4005556899657', 6.95]));
    expect(paires(p)).toEqual([[0, 0]]);
  });
  it('une référence égale seule ne suffit pas : ni le nom ni le montant ne concordent (EAN rattaché à la ligne voisine)', () => {
    const p = alignerLignes(lignes(['DEBOUCREOR POMER', '4015307F60374', 7.5]), lignes(['ROULEAU 12CHTUBEEQ', '4015307F60374', 9.5]));
    expect(p.match.size).toBe(0);
    expect(p.orphansBase).toEqual([0]);
    expect(p.orphansOther).toEqual([0]);
  });
  it('un montant égal seul ne suffit pas : deux lignes à 4,50 de noms et de références différents restent séparées', () => {
    const p = alignerLignes(lignes(['BROSSE LATTER', '', 4.5]), lignes(['LANE DE GABRAGE', '', 4.5]));
    expect(p.match.size).toBe(0);
  });
  it('un montant inconnu (null) n\'est jamais un montant égal', () => {
    const p = alignerLignes(lignes(['BROSSE LATTER', '1', null]), lignes(['LANE DE GABRAGE', '2', null]));
    expect(p.match.size).toBe(0);
  });
});

describe('al1 : l\'ordre des lignes est respecté', () => {
  it('deux lignes identiques (même nom, même montant) se rapprochent dans l\'ordre ; l\'une absente de l\'autre lecture reste orpheline', () => {
    const p = alignerLignes(lignes(['VIS 600', '', 4.5], ['CUTTER', '', 5.2], ['VIS 600', '', 4.5]), lignes(['VIS 600', '', 4.5], ['CUTTER', '', 5.2]));
    expect(paires(p)).toEqual([[0, 0], [1, 1]]);
    expect(p.orphansBase).toEqual([2]);
  });
  it('une ligne en plus au milieu ne décale pas la suite', () => {
    const p = alignerLignes(lignes(['A BROSSE', '', 4.95], ['B PLATRE', '', 14.5], ['C LANE', '', 4.4]), lignes(['A BROSSE', '', 4.95], ['EXTRA SAC', '', 1.2], ['B PLATRE', '', 14.5], ['C LANE', '', 4.4]));
    expect(paires(p)).toEqual([[0, 0], [1, 2], [2, 3]]);
    expect(p.orphansOther).toEqual([1]);
  });
});
