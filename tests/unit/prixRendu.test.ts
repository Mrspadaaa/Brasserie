import { describe, expect, it } from 'vitest';
import { prixRendu, tauxDeLaDerniereFactureEur, tauxLu } from '../../src/domain/carnets/prixRendu';

describe('prixRendu (D421 : aucun chiffre inventé)', () => {
  it('sans taux : aucun rendu, le taux, le port et les frais manquent', () => {
    const r = prixRendu({ eurCentimes: 251300 });
    expect(r.totalChf).toBeUndefined();
    expect(r.manque).toEqual(['taux', 'port', 'frais']);
  });
  it('avec taux seul : base × 1,081, port et frais restent inconnus (jamais 60)', () => {
    const r = prixRendu({ eurCentimes: 251300, taux: 0.94 });
    expect(r.baseChf).toBe(236222);
    expect(r.tvaChf).toBe(19134);
    expect(r.totalChf).toBe(255356);
    expect(r.fraisChf).toBeUndefined();
    expect(r.portChf).toBeUndefined();
    expect(r.manque).toEqual(['port', 'frais']);
  });
  it('port et frais connus : ils entrent dans le rendu, plus rien ne manque', () => {
    const r = prixRendu({ eurCentimes: 251300, taux: 0.94, portEurCentimes: 38000, fraisChfCentimes: 6000 });
    expect(r.manque).toEqual([]);
    expect(r.portChf).toBe(35720);
    expect(r.totalChf).toBe(Math.round((251300 + 38000) * 0.94 * 1.081 + 6000));
  });
  it('un taux illisible ou hors bornes est refusé', () => {
    expect(tauxLu('0,94')).toBe(0.94);
    expect(tauxLu('0.94')).toBe(0.94);
    expect(tauxLu('abc')).toBeNull();
    expect(tauxLu('94')).toBeNull();
  });
  it('le taux est celui de la facture en EUR la plus récente', () => {
    const t = [
      { date: '2026-03-01', finance: { sourceCurrency: 'EUR', exchangeRate: 0.95 } },
      { date: '2026-09-01', finance: { sourceCurrency: 'EUR', exchangeRate: 0.93 } },
      { date: '2026-10-01', finance: { sourceCurrency: 'CHF' } }
    ];
    expect(tauxDeLaDerniereFactureEur(t)).toBe(0.93);
    expect(tauxDeLaDerniereFactureEur([])).toBeUndefined();
  });
});
