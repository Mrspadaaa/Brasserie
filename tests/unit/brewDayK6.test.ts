import { describe, expect, it } from 'vitest';
import { momentHoublonEnsuite } from '../../src/domain/brewDayEnsuite';
import { insecables } from '../../src/ui/brewNombres';

describe('K6 n° 18 : le moment d’un houblon dit dans « Ensuite » (p2c : « 60′ · au premier bouillon »)', () => {
  it('premier moût, premier bouillon, minute, coupure du feu', () => {
    expect(momentHoublonEnsuite({ stepId: 'fwh' }, 60)).toBe('au premier moût');
    expect(momentHoublonEnsuite({ stepId: 'hop-0', beforeEndMin: 60 }, 60)).toBe('60′ · au premier bouillon');
    expect(momentHoublonEnsuite({ stepId: 'hop-45', beforeEndMin: 15 }, 60)).toBe('15′ avant la fin');
    expect(momentHoublonEnsuite({ stepId: 'hop-60', beforeEndMin: 0 }, 60)).toBe('coupure du feu');
  });
  it('le whirlpool a sa ligne ; un moment inconnu ne s’écrit pas', () => {
    expect(momentHoublonEnsuite({ stepId: 'whirlpool', beforeEndMin: 20 }, 60)).toBeNull();
    expect(momentHoublonEnsuite({ stepId: 'hop-10' }, 60)).toBeNull();
    expect(momentHoublonEnsuite({ stepId: 'hop-10', beforeEndMin: Number.NaN }, 60)).toBeNull();
  });
});

describe('K6 n° 26 : une heure et une mesure avec son unité ne se coupent pas (espaces insécables à l’affichage, mots inchangés)', () => {
  const N = ' ';
  it('les cas du test c7 : heure estimée, dose, litres, degrés', () => {
    expect(insecables('ensemencement ~14 h 45')).toBe(`ensemencement ~14${N}h${N}45`);
    expect(insecables('Citra 35,4 g · Mosaic 35,4 g')).toBe(`Citra 35,4${N}g · Mosaic 35,4${N}g`);
    expect(insecables('≈ 18,3 L à 1,061 · fin ~19 h 49')).toBe(`≈ 18,3${N}L à 1,061 · fin ~19${N}h${N}49`);
    expect(insecables('cible 18 °C · 1 sachet')).toBe(`cible 18${N}°C · 1 sachet`);
  });
  it('une unité qui commence un mot ne compte pas (« 5 gros » non, « 3 min » oui) ; sans nombre, la chaîne revient telle quelle ; les mots sont les mêmes une fois les espaces normalisés', () => {
    expect(insecables('5 gros')).toBe('5 gros');
    expect(insecables('dû dans 3 min')).toBe(`dû dans 3${N}min`);
    expect(insecables('à choisir')).toBe('à choisir');
    expect(insecables('fin ~19 h 49 · 35,4 g').replace(/\s/g, ' ')).toBe('fin ~19 h 49 · 35,4 g');
  });
  it('K7 n° 26 et 30 : le verdict « prochain relevé : pH d’empâtage dès 11 h 51 » et le retard « en retard de 2 min » gardent nombre et unité ensemble', () => {
    expect(insecables('Enregistré · prochain relevé : pH d’empâtage dès 11 h 51')).toBe(`Enregistré · prochain relevé : pH d’empâtage dès 11${N}h${N}51`);
    expect(insecables(' · en retard de 2 min')).toBe(` · en retard de 2${N}min`);
    expect(insecables('maintien 82 °C')).toBe(`maintien 82${N}°C`);
  });
});
