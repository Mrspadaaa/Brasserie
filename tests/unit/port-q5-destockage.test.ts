import { describe, expect, it } from 'vitest';
import type { Batch, StockItem } from '../../src/types';
import { planDestockageHoublon, refDuHoublon } from '../../src/ui/production/fermentation/destockage';
import { modeleFiche, titreReponse } from '../../src/ui/production/fermentation/modele';
import { cuveDansNotes, notesAvecCuve, notesSansCuve } from '../../src/ui/production/fermentation/cuve';
import { construireReleve, releveDepuisEtat } from '../../src/ui/production/fermentation/modele';

// q5 (gfc n° 3, 5) : « Ajouté auj. » ne sort du stock QUE le houblon touché ; la cuve se range dans les notes du relevé. Stocks ZZ, aucun réel.
const NOW = Date.UTC(2026, 10, 14, 11, 0, 0);
const stock = (ref: string, name: string, g: number): StockItem => ({ id: ref, ref, name, unit: 'g', currentStock: g, category: 'Houblon', minStock: 0, reorder: false } as StockItem);
const STOCKS = [stock('ZZ-CITRA', 'ZZ Citra', 500), stock('ZZ-MOSAIC', 'ZZ Mosaic', 300)];
const CITRA = { name: 'ZZ Citra', weightG: 100, alpha: 12, stage: 'dryHop' as const, dayOffset: 5, stockItemRef: 'ZZ-CITRA' };
const MOSAIC = { name: 'ZZ Mosaic', weightG: 80, alpha: 11, stage: 'dryHop' as const, dayOffset: 6, stockItemRef: 'ZZ-MOSAIC' };

const lot = (): Batch => ({
  id: 'ZZ-Q5', name: 'ZZ NEIPA', status: 'fermentation', volumeL: 24, brewDate: '09.11.2026', og: '1,062',
  brewDay: { pitchedAt: Date.UTC(2026, 10, 9, 11, 0, 0), steps: [], currentIndex: 0 },
  stockConsumption: { appliedAt: '2026-11-09T12:00:00Z', eventId: 'ev', completedStages: ['brewday'], items: [], pendingItems: [{ stockItemRef: 'ZZ-CITRA', quantity: 100, unit: 'g' }, { stockItemRef: 'ZZ-MOSAIC', quantity: 80, unit: 'g' }] },
  recipeSnapshot: { fgTarget: 1.012, fermentation: [{ kind: 'primaire', days: 7, tempC: 19 }], hops: [CITRA, MOSAIC] }
} as unknown as Batch);

describe('q5 : « Ajouté auj. » déstocke un seul houblon (gfc n° 3)', () => {
  it('retrouve l\'article de chaque houblon', () => {
    expect(refDuHoublon(CITRA, STOCKS)).toBe('ZZ-CITRA');
    expect(refDuHoublon(MOSAIC, STOCKS)).toBe('ZZ-MOSAIC');
  });

  it('Citra seul sort : Mosaic reste réservé, son stock est intact, l\'étape « remaining » n\'est pas close', () => {
    const p = planDestockageHoublon(lot(), CITRA, STOCKS, undefined, '2026-11-14T10:00:00Z');
    expect(p.issues).toEqual([]);
    expect(p.ok).toBe(true);
    expect(p.stockUpdates.map(s => s.ref)).toEqual(['ZZ-CITRA']);
    expect(p.stockUpdates[0].currentStock).toBe(400);
    expect(p.mouvements).toHaveLength(1);
    const sc = p.batch!.stockConsumption!;
    expect(sc.pendingItems).toEqual([{ stockItemRef: 'ZZ-MOSAIC', quantity: 80, unit: 'g' }]);
    expect(sc.completedStages).not.toContain('remaining');
    expect(STOCKS[1].currentStock).toBe(300);
  });

  it('le second houblon ferme l\'étape : plus rien n\'attend', () => {
    const premier = planDestockageHoublon(lot(), CITRA, STOCKS, undefined, '2026-11-14T10:00:00Z');
    const stocks2 = STOCKS.map(s => premier.stockUpdates.find(u => u.ref === s.ref) ?? s);
    const second = planDestockageHoublon(premier.batch!, MOSAIC, stocks2, undefined, '2026-11-14T11:00:00Z');
    expect(second.ok).toBe(true);
    expect(second.stockUpdates.map(s => s.ref)).toEqual(['ZZ-MOSAIC']);
    expect(second.stockUpdates[0].currentStock).toBe(220);
    expect(second.batch!.stockConsumption!.pendingItems).toEqual([]);
    expect(second.batch!.stockConsumption!.completedStages).toContain('remaining');
  });

  it('un houblon sans ligne réservée : refus, rien n\'est écrit', () => {
    const premier = planDestockageHoublon(lot(), CITRA, STOCKS, undefined, '2026-11-14T10:00:00Z');
    const encore = planDestockageHoublon(premier.batch!, CITRA, STOCKS, undefined, '2026-11-14T10:05:00Z');
    expect(encore.ok).toBe(false);
    expect(encore.stockUpdates).toEqual([]);
    expect(encore.mouvements).toEqual([]);
  });

  it('le titre suit : « ZZ Citra ajouté, » puis « ZZ Mosaic demain »', () => {
    const premier = planDestockageHoublon(lot(), CITRA, STOCKS, undefined, '2026-11-14T10:00:00Z');
    const m = modeleFiche(premier.batch!, NOW, { stocks: STOCKS.map(s => premier.stockUpdates.find(u => u.ref === s.ref) ?? s), mouvements: premier.mouvements as never })!;
    expect(m.houblons.map(h => h.statut)).toEqual(['fait', 'afaire']);
    const t = titreReponse(m);
    expect(t.repos).toContain('ZZ Citra ajouté,');
    expect(t.accent).toBe('ZZ Mosaic demain');
  });
});

describe('q5 : la cuve se range dans les notes du relevé (gfc n° 5)', () => {
  it('lit, écrit et retire la ligne « Cuve 19,2 °C », sans toucher au reste', () => {
    expect(cuveDansNotes('Cuve 19,2 °C\nKrausen haut')).toBe(19.2);
    expect(notesSansCuve('Cuve 19,2 °C\nKrausen haut')).toBe('Krausen haut');
    expect(notesAvecCuve('Krausen haut', 19.2)).toBe('Cuve 19,2 °C\nKrausen haut');
    expect(notesAvecCuve('Cuve 18,0 °C\nKrausen haut', 19.2)).toBe('Cuve 19,2 °C\nKrausen haut');
    expect(cuveDansNotes('Krausen haut')).toBeNull();
    expect(cuveDansNotes('')).toBeNull();
    expect(cuveDansNotes(undefined)).toBeNull();
  });

  it('un relevé avec cuve : tempC reste l\'échantillon, la cuve va dans les notes', () => {
    expect(construireReleve(1016, '', '2026-11-14', '19,2')).toEqual({ reading: { date: '2026-11-14', sg: 1.016, notes: 'Cuve 19,2 °C' } });
    expect(construireReleve(1016, '20,1', '2026-11-14', '19,2')).toEqual({ reading: { date: '2026-11-14', sg: 1.016, tempC: 20.1, notes: 'Cuve 19,2 °C' } });
    expect(construireReleve(1016, '', '2026-11-14', '80')).toHaveProperty('erreur');
    expect(releveDepuisEtat({ milli: 1016, temp: '', cuve: '19,2', taper: false, saisie: '', erreur: '' }, '2026-11-14')).toEqual({ reading: { date: '2026-11-14', sg: 1.016, notes: 'Cuve 19,2 °C' } });
  });

  it('la courbe de cuve lit la cuve, pas l\'échantillon', () => {
    const b = { ...lot(), gravityLog: [{ date: '2026-11-13', sg: 1.02, tempC: 20.1, notes: 'Cuve 19,2 °C\nKrausen' }, { date: '2026-11-12', sg: 1.03, tempC: 19.5 }] } as unknown as Batch;
    const pts = modeleFiche(b, NOW)!.points.filter(p => !p.og);
    expect(pts.find(p => p.sg === 1.02)).toMatchObject({ tempC: 20.1, cuveC: 19.2 });
    expect(pts.find(p => p.sg === 1.03)?.cuveC).toBeUndefined();
  });
});
