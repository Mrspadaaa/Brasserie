// L'effet d'un houblon à un moment, en cache dans le moteur (#178) : la prédiction V5.5 d'un triplet est calculée une fois
// par moteur, partagée entre proposer (proposeVoies) et les leviers levure (même fonction, autres options), bornée, propre à
// chaque moteur, et sans effet sur les résultats (l'ordre des appels ne change rien).
import { describe, expect, it } from 'vitest';
import { DONNEES_FIXTURE, creerMoteur, type Direction, type StockHop } from '../../../src/domain/hopIndex/v4';
import { CHARACTERIZED_YEASTS, bornePredictions, predictionsEnCache } from '../../../src/domain/hopIndex/v4/yeast';
import { recetteDegustee } from '../parcours/src/donnees/cas';

// Un moteur neuf : des tableaux neufs et un contenu propre (une ligne de stock vide, hors catalogue, que proposeVoies écarte),
// pour qu'aucun partage de contexte entre données identiques (moteur.ts, #169) ne lui donne un cache déjà rempli.
let n = 0;
const vide = (): StockHop => ({ key: `essai-cache-${++n}`, varietyId: `essai-cache-${n}`, form: 'unknown', grams: 0, alpha: null, alphaFrom: null, items: [] } as unknown as StockHop);
const neuf = () => creerMoteur({ catalogue: [...DONNEES_FIXTURE.catalogue], stock: [...DONNEES_FIXTURE.stock, vide()] });
const recette = recetteDegustee();
const DIRECTION: Direction = { floral: 1, resin: -1 };
const proposer = { assemblages: true } as const;
const leviers = { assemblages: false, leviersLevure: true } as const;

describe('proposeVoies : prédictions en cache par moteur (#178)', () => {
  it('les leviers levure relisent les prédictions de proposer : seules celles de la levure seule sont nouvelles', () => {
    const m = neuf();
    expect(m.dans(predictionsEnCache)).toBe(0);
    m.proposeVoies(recette, DIRECTION, proposer);
    const apresProposer = m.dans(predictionsEnCache);
    expect(apresProposer).toBeGreaterThan(100);
    m.proposeVoies(recette, DIRECTION, leviers);
    // Les voies des leviers sont celles de proposer (mêmes ajouts, mêmes doses) ; s'y ajoutent au plus la levure seule
    // de la recette et celle de chaque souche caractérisée.
    expect(m.dans(predictionsEnCache) - apresProposer).toBeLessThanOrEqual(CHARACTERIZED_YEASTS.length + 1);
  });

  it('mêmes résultats, quel que soit l’ordre des appels et le cache déjà rempli', () => {
    const a = neuf(), b = neuf();
    const pa = a.proposeVoies(recette, DIRECTION, proposer), la = a.proposeVoies(recette, DIRECTION, leviers);
    const lb = b.proposeVoies(recette, DIRECTION, leviers), pb = b.proposeVoies(recette, DIRECTION, proposer);
    expect(JSON.stringify(pb.voies)).toBe(JSON.stringify(pa.voies));
    expect(JSON.stringify(lb.voies)).toBe(JSON.stringify(la.voies));
    expect(pb.evaluated).toBe(pa.evaluated);
  });

  it('borné, et propre à chaque moteur (aucun état global)', () => {
    const m = neuf();
    m.proposeVoies(recette, DIRECTION, proposer);
    const borne = m.dans(bornePredictions);
    expect(borne).toBeGreaterThanOrEqual(8 * 1024);
    expect(m.dans(predictionsEnCache)).toBeLessThanOrEqual(borne);
    // Un autre moteur (autres tableaux) part d'un cache vide ; le premier garde le sien.
    const autre = neuf();
    expect(autre.dans(predictionsEnCache)).toBe(0);
    expect(m.dans(predictionsEnCache)).toBeGreaterThan(0);
  });
});
