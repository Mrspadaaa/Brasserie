// Lot 11 du Carnet (intégration, 23.11) : points hors lot des lots 2, 4 et 6 (INTEGRATION.md). Calcul pur, aucun réseau.
import { describe, expect, it } from 'vitest';
import { lireMontant } from '../../src/ui/saisie/modele';
import { nombreDe } from '../../src/domain/carnets/comparer';
import { iconesIdees } from '../../src/domain/calendrier';
import type { CreativeItem } from '../../src/types';

describe('lot 11 : lireMontant passe par lireDecimal (hors lot du lot 6)', () => {
  it('lit les formats du clavier comme toute saisie de nombre', () => {
    expect(lireMontant('12,50')).toBe(1250);
    expect(lireMontant("1'234.50")).toBe(123450);
    expect(lireMontant('1.234,50')).toBe(123450);
    expect(lireMontant('1 234,5')).toBe(123450);
  });
  it('refuse ce qui n’est pas un montant positif à deux décimales au plus', () => {
    expect(lireMontant('')).toBeUndefined();
    expect(lireMontant('abc')).toBeUndefined();
    expect(lireMontant('0')).toBeUndefined();
    expect(lireMontant('-5')).toBeUndefined();
    expect(lireMontant('1,234')).toBeUndefined();
  });
});

describe('lot 11 : « 1.845 » lu sur une page (hors lot du lot 4)', () => {
  it('un point suivi de trois chiffres groupe les milliers (1.845 mm = 1845)', () => {
    expect(nombreDe('1.845')).toBe(1845);
    expect(nombreDe('12.500')).toBe(12500);
    expect(nombreDe('1.250.000')).toBe(1250000);
  });
  it('les décimales restent des décimales', () => {
    expect(nombreDe('2,5')).toBe(2.5);
    expect(nombreDe('0.125')).toBe(0.125);
    expect(nombreDe('1.85')).toBe(1.85);
    expect(nombreDe('1,845')).toBe(1.845);
    expect(nombreDe(1.845)).toBe(1.845);
  });
});

describe('lot 11 : l’icône du carnet suit son plan au Calendrier (hors lot du lot 2)', () => {
  const carnet = { id: 'CARNET-A', type: 'carnet', title: 'Pompe', status: 'idea', date: '2026-11-23', carnet: { sortie: { planId: 'PLAN-CARNET-CARNET-A' } } } as unknown as CreativeItem;
  it('le plan suivi déplacé emmène l’icône à sa semaine', () => {
    const plans = [{ id: 'PLAN-CARNET-CARNET-A', status: 'draft', date: '2027-02-10' }];
    expect(iconesIdees([carnet], plans).map(i => i.lundi)).toEqual(['2027-02-08']);
  });
  it('sans plan suivi, ou plan réalisé : la date du carnet', () => {
    expect(iconesIdees([carnet]).map(i => i.lundi)).toEqual(['2026-11-23']);
    expect(iconesIdees([carnet], [{ id: 'PLAN-CARNET-CARNET-A', status: 'completed', date: '2027-02-10' }]).map(i => i.lundi)).toEqual(['2026-11-23']);
  });
});
