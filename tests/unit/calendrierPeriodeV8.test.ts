// V8 chasse Calendrier (21.11) : période et An cohérents. CHG-7 (une semaine dite une fois, bulle à côté du bout tiré), CHN-1 (flèches bornées).
import { describe, expect, it, vi, afterEach } from 'vitest';
import { boiteTirage, etiquetteCadre, fenetreDePeriode } from '../../src/ui/calendrier/entete/Fenetre';
import { pas, peutPasser, type Periode } from '../../src/components/periode/periode';

afterEach(() => { vi.useRealTimers(); });

describe('CHG-7 : la bulle du tirage', () => {
  const numeros = [40, 41, 42, 43];
  it('une semaine se dit une fois : « S40 », jamais « S40 – S40 »', () => {
    expect(etiquetteCadre(numeros, 0, 1, false)).toBe('S40');
    expect(etiquetteCadre(numeros, 0, 2, false)).toBe('S40 – S41');
  });
  it('début tiré : la bulle est à droite du bout, au-delà de sa prise ; fin tirée : à gauche ; corps : centrée', () => {
    const a = boiteTirage('S40', 60, 390, 'a');
    expect(a.l).toBeGreaterThanOrEqual(60 + 10);
    const b = boiteTirage('S40', 300, 390, 'b');
    expect(b.r).toBeLessThanOrEqual(300 - 10);
    const c = boiteTirage('S40', 200, 390);
    expect(Math.abs((c.l + c.r) / 2 - 200)).toBeLessThan(1);
  });
});

describe('CHN-1 : les flèches de période butent aux bornes et s’éteignent', () => {
  it('un mois n’avance pas au-delà d’aujourd’hui + 366 j ; la flèche s’éteint', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-21T10:00:00'));
    let p: Periode = { genre: 'mois', annee: 2026, mois: 11 };
    for (let i = 0; i < 40; i++) p = pas(p, 1);
    expect(p).toEqual({ genre: 'mois', annee: 2027, mois: 11 });
    expect(peutPasser(p, 1)).toBe(false);
    expect(peutPasser(p, -1)).toBe(true);
  });
  it('une plage butée au bout : la flèche s’éteint (plus de pas muet)', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-21T10:00:00'));
    let p: Periode = { genre: 'dates', du: '2026-10-26', au: '2027-10-24' };
    for (let i = 0; i < 10; i++) p = pas(p, 1);
    expect(peutPasser(p, 1)).toBe(false);
  });
});

describe('CHV-4 : une plage tirée avant l’horizon garde sa durée, la barre dit ce que le cadre montre', () => {
  it('l’An reculé avant le premier lundi se pose au premier lundi, sur 52 semaines', () => {
    const f = fenetreDePeriode({ genre: 'dates', du: '2025-11-17', au: '2026-11-15' }, '2026-01-05', 60);
    expect(f).toEqual({ du: '2026-01-05', semaines: 52 });
  });
  it('une plage entièrement avant l’horizon ne se lit pas', () => {
    expect(fenetreDePeriode({ genre: 'dates', du: '2025-01-06', au: '2025-12-28' }, '2026-01-05', 60)).toBeNull();
  });
});
