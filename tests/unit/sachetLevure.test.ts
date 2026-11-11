import { describe, expect, it } from 'vitest';
import supply from '../../src/data/yeastSupplyBootstrap.json';
import {
  echelleMaxG, fourchetteG, gParHl, grammesDuChoix, libelleSource, sachetDeLaLevure, statutDose
} from '../../src/domain/levure/sachet';
import type { YeastSpec } from '../../src/types';

/**
 * p3 / 1C : le poids du sachet ne vient que du catalogue (`yeastSupplyBootstrap.json`, avec sa source) ; sans produit sûr : aucun poids,
 * jamais un chiffre inventé. Les grammes, les g/hL et la plage en découlent.
 */
const produits = supply.products;
const US05: YeastSpec = { name: 'SafAle US-05', lab: 'Fermentis', strain: 'US-05', form: 'sèche' };

describe('sachetDeLaLevure : le produit du catalogue, sinon rien', () => {
  it('retrouve US-05 par son nom (levure du banc, sans hopIndexId) : 11,5 g, plage 50–80 g/hL, source datée', () => {
    const s = sachetDeLaLevure(US05, produits);
    expect(s).toMatchObject({ grammes: 11.5, plageGHl: { min: 50, max: 80 }, fabricant: 'Fermentis', verifieLe: '2026-09-27' });
    expect(libelleSource(s!)).toBe('sachet 11,5 g · Fermentis · vu le 27.09.2026');
  });
  it('retrouve le produit par hopIndexId et forme, avant le nom', () => {
    expect(sachetDeLaLevure({ name: 'Verdant', hopIndexId: 'lalbrew-verdant-ipa', form: 'sèche' }, produits)?.grammes).toBe(11);
  });
  it('une levure inconnue, ou un nom ambigu : aucun poids', () => {
    expect(sachetDeLaLevure({ name: 'Levure maison', form: 'sèche' }, produits)).toBeNull();
    expect(sachetDeLaLevure({ name: 'LalBrew', form: 'sèche' }, produits)).toBeNull();
  });
  it('une levure liquide en mL n’a pas de poids en grammes : aucun sachet', () => {
    expect(sachetDeLaLevure({ name: 'Wyeast 1056 American Ale', hopIndexId: 'wyeast-1056', form: 'liquide' }, produits)).toBeNull();
  });
  it('un produit sans plage de dose garde son poids mais n’a pas de plage', () => {
    const s = sachetDeLaLevure(US05, [{ ...produits[0], dose: undefined }]);
    expect(s?.grammes).toBe(11.5);
    expect(s?.plageGHl).toBeUndefined();
  });
});

describe('les nombres de la jauge', () => {
  const s = sachetDeLaLevure(US05, produits)!;
  it('grammes du choix : 2 sachets = 23 g ; des grammes tels quels ; une unité inconnue = inconnu', () => {
    expect(grammesDuChoix({ amount: 2, unit: 'sachet' }, s)).toBe(23);
    expect(grammesDuChoix({ amount: 14, unit: 'g' }, s)).toBe(14);
    expect(grammesDuChoix({ amount: 3, unit: 'mL' }, s)).toBeNull();
    expect(grammesDuChoix(undefined, s)).toBeNull();
    expect(grammesDuChoix({ amount: 2, unit: 'sachet' }, null)).toBeNull();
  });
  it('g/hL = g ÷ (L/100) : 23 g pour 19 L = 121 g/hL ; volume inconnu = inconnu', () => {
    expect(Math.round(gParHl(23, 19)!)).toBe(121);
    expect(gParHl(23, 0)).toBeNull();
    expect(gParHl(23, undefined)).toBeNull();
  });
  it('statut : dans, sous et au-dessus de la plage ; sans plage rien', () => {
    expect(statutDose(60, { min: 50, max: 80 })).toBe('dans');
    expect(statutDose(40, { min: 50, max: 80 })).toBe('sous');
    expect(statutDose(121, { min: 50, max: 80 })).toBe('au-dessus');
    expect(statutDose(60, undefined)).toBeNull();
  });
  it('la plage en grammes pour 19 L : 9,5 à 15,2 g ; l’échelle monte par 5 g au-delà de la plage et du choix', () => {
    const f = fourchetteG({ min: 50, max: 80 }, 19)!;
    expect(f.min).toBeCloseTo(9.5, 5);
    expect(f.max).toBeCloseTo(15.2, 5);
    expect(echelleMaxG(f, 11.5)).toBe(25); // 15,2 × 1,6 = 24,3 → 25
    expect(echelleMaxG(f, 30)).toBe(35); // 30 × 1,1 = 33 → 35
    expect(echelleMaxG(f, null)).toBe(25);
  });
});
