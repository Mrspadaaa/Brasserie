import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../src/types';
import { planifierAnnulation, planifierConsommation, tableDuGeste, traceDeLArticle, gesteIdDe, type Geste, type RegleConsommation } from '../../src/domain/consommation/gestes';

const article = (ref: string, category: string, unit: string, currentStock: number): StockItem =>
  ({ id: ref, ref, name: ref, category, unit, currentStock, minStock: 0, reorder: false } as StockItem);
const stocks = [article('PBW', 'CIP alcalin', 'kg', 2), article('STARSAN', 'Désinfectant', 'L', 1), article('EPI', 'EPI', 'pièce', 10), article('CAPS', 'Emballage', 'pièce', 100)];
const lavage: Geste = { type: 'lavage-fut', objet: 'F7', cycle: 3, libelle: 'Fût F7 lavé', quantites: { unites: 1 } };
const dose = (r: RegleConsommation, quantite: number) => ({ ...r, quantite });

describe('règle « chaque geste décompte ce qu’il use »', () => {
  it('pré-remplit les articles de la catégorie, jamais une dose', () => {
    const table = tableDuGeste('lavage-fut', [], stocks);
    expect(table.map(r => r.stockItemRef)).toEqual(['PBW', 'STARSAN']);
    expect(table.every(r => r.quantite === undefined)).toBe(true);
    expect(table.map(r => r.unite)).toEqual(['g', 'ml']);
  });

  it('une dose inconnue se demande et ne décompte rien', () => {
    const plan = planifierConsommation(lavage, tableDuGeste('lavage-fut', [], stocks), stocks, []);
    expect(plan.mouvements).toEqual([]);
    expect(plan.manquantes.map(r => r.stockItemRef)).toEqual(['PBW', 'STARSAN']);
  });

  it('décompte la dose retenue, convertie dans l’unité du stock', () => {
    const [pbw, star] = tableDuGeste('lavage-fut', [], stocks);
    const plan = planifierConsommation(lavage, [dose(pbw, 30), dose(star, 5)], stocks, []);
    expect(plan.mouvements.map(m => [m.stockItemRef, m.delta, m.newStock])).toEqual([['PBW', -0.03, 1.97], ['STARSAN', -0.005, 0.995]]);
    expect(plan.manquantes).toEqual([]);
    expect(plan.effets[0]).toMatchObject({ nom: 'PBW', avant: 2, apres: 1.97 });
  });

  it('rejouer le même geste ne décompte rien de plus', () => {
    const table = tableDuGeste('lavage-fut', [], stocks).map(r => dose(r, 30));
    const premier = planifierConsommation(lavage, table, stocks, []);
    const rejeu = planifierConsommation(lavage, table, stocks, premier.mouvements);
    expect(rejeu.mouvements).toEqual([]);
    expect(gesteIdDe(lavage)).toBe('GESTE-LAVAGE-FUT-F7-3');
  });

  it('une dose donnée plus tard décompte seulement l’article manquant', () => {
    const [pbw, star] = tableDuGeste('lavage-fut', [], stocks);
    const premier = planifierConsommation(lavage, [dose(pbw, 30), star], stocks, []);
    const suite = planifierConsommation(lavage, [dose(pbw, 30), dose(star, 5)], stocks, premier.mouvements);
    expect(suite.mouvements.map(m => m.stockItemRef)).toEqual(['STARSAN']);
  });

  it('un stock court ne bloque pas : décompte ce qui reste et alerte', () => {
    const [pbw] = tableDuGeste('lavage-fut', [], stocks);
    const plan = planifierConsommation(lavage, [dose(pbw, 3000)], stocks, []);
    expect(plan.mouvements[0]).toMatchObject({ delta: -2, newStock: 0 });
    expect(plan.alertes[0]).toMatch(/PBW .* en stock/);
  });

  it('une dose à 0 vaut « pas utilisé » ; par litre, sans volume, alerte', () => {
    const [pbw, star] = tableDuGeste('lavage-fut', [], stocks);
    expect(planifierConsommation(lavage, [dose(pbw, 0), { ...dose(star, 5), active: false }], stocks, []).mouvements).toEqual([]);
    const [caps] = tableDuGeste('conditionnement', [], stocks);
    const sansVolume = planifierConsommation({ type: 'conditionnement', objet: 'LOT-1', cycle: 'c', libelle: 'LOT-1 conditionné' }, [dose(caps, 3)], stocks, []);
    expect(sansVolume.alertes[0]).toMatch(/volume/);
    const avecVolume = planifierConsommation({ type: 'conditionnement', objet: 'LOT-1', cycle: 'c', libelle: 'x', quantites: { litres: 20 } }, [dose(caps, 3)], stocks, []);
    expect(avecVolume.mouvements[0].delta).toBe(-60);
  });

  it('un geste inconnu sans table ne fait rien', () => {
    expect(tableDuGeste('nettoyer-cuve', [], stocks)).toEqual([]);
  });

  it('annuler rend tout le geste par écriture inverse, une seule fois', () => {
    const table = tableDuGeste('lavage-fut', [], stocks).map(r => dose(r, 30));
    const fait = planifierConsommation(lavage, table, stocks, []);
    const apres = stocks.map(s => ({ ...s, currentStock: fait.mouvements.find(m => m.stockItemRef === s.ref)?.newStock ?? s.currentStock }));
    const annul = planifierAnnulation(fait.gesteId, fait.mouvements, apres);
    expect(annul.mouvements.map(m => [m.stockItemRef, m.delta, m.newStock])).toEqual([['PBW', 0.03, 2], ['STARSAN', 0.03, 1]]);
    expect(planifierAnnulation(fait.gesteId, [...fait.mouvements, ...annul.mouvements], stocks).mouvements).toEqual([]);
    expect(traceDeLArticle('PBW', fait.mouvements)?.texte).toBe('−30 g · Fût F7 lavé');
    expect(traceDeLArticle('PBW', [...fait.mouvements, ...annul.mouvements])).toBeNull();
  });

  it('annuler est refusé si l’article a été compté depuis', () => {
    const [pbw] = tableDuGeste('lavage-fut', [], stocks);
    const fait = planifierConsommation(lavage, [dose(pbw, 30)], stocks, [], '2026-11-16T10:00:00.000Z');
    const annul = planifierAnnulation(fait.gesteId, fait.mouvements, stocks, [{ stockItemRef: 'PBW', at: Date.parse('2026-11-16T11:00:00.000Z') }]);
    expect(annul.mouvements).toEqual([]);
    expect(annul.refus).toMatch(/compté depuis/);
  });

  it('« Tout marquer propre » : un seul geste, la dose compte par fût lavé', () => {
    const [pbw] = tableDuGeste('lavage-fut', [], stocks);
    const lot: Geste = { type: 'lavage-fut', objet: 'lot-1', cycle: 1, libelle: '3 fûts lavés', quantites: { unites: 3 } };
    const plan = planifierConsommation(lot, [dose(pbw, 30)], stocks, []);
    expect(plan.mouvements.map(m => [m.stockItemRef, m.delta])).toEqual([['PBW', -0.09]]);
    expect(planifierConsommation({ ...lot, quantites: undefined }, [dose(pbw, 30)], stocks, []).alertes[0]).toMatch(/nombre du geste inconnu/);
  });
});
