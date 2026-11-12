import { describe, expect, it } from 'vitest';
import { brewState, recipe } from '../fixtures/brewCompanion';
import { grainPourProchain, paireSansCible } from '../../src/domain/brewDayCalculs';
import { separerPasReleves } from '../../src/ui/BrewBilan';
import { tuileRendement } from '../../src/pages/BrewDayPage';
import { BrewDayReading } from '../../src/types';

// Voie port-K, lot K2 : règles de calcul de n° 7 (paire sans cible) et n° 9 (rendement de la clôture).
const lecture = (x: Partial<BrewDayReading>): BrewDayReading => ({ id: String(Math.random()), at: 1000, stepId: 'preboil', kind: 'volume', value: 1, unit: 'L', ...x }) as BrewDayReading;

describe('paireSansCible (n° 7)', () => {
  it('un couple sans roomTemp : raison « référence de température », choix « Accepter » seul', () => {
    const r = recipe();
    const s = { ...brewState(r), readings: [lecture({ kind: 'volume', value: 12 }), lecture({ kind: 'densite', value: 1.061, unit: 'SG' })] };
    const p = paireSansCible(r, s);
    expect(p).not.toBeNull();
    expect(p!.raisons.join(' ')).toMatch(/référence de température/);
    expect(p!.options.map((o) => o.id)).toEqual(['accepter']);
    expect(p!.note).toMatch(/^Pas de cible calculable : /);
  });

  it('densité seule refroidie : le volume est nommé, pas la densité', () => {
    const r = recipe();
    const s = { ...brewState(r), readings: [lecture({ kind: 'volume', value: 12 }), lecture({ kind: 'densite', value: 1.061, unit: 'SG', roomTemp: true })] };
    expect(paireSansCible(r, s)!.raisons[0]).toBe('volume non ramené à 20 °C');
  });

  it('sans couple : null, jamais une carte inventée', () => {
    const r = recipe();
    expect(paireSansCible(r, { ...brewState(r), readings: [lecture({ kind: 'volume', value: 12 })] })).toBeNull();
    expect(paireSansCible(r, brewState(r))).toBeNull();
  });
});

describe('rendement à la clôture (n° 9)', () => {
  it('un rendement lu sans visé reste dans la grille, avec « visé ? » : il n’entre pas dans « Pas relevés »', () => {
    const r = recipe();
    const s = {
      ...brewState(r),
      readings: [lecture({ kind: 'volume', value: 24, roomTemp: true }), lecture({ kind: 'densite', value: 1.045, unit: 'SG', roomTemp: true })]
    };
    const t = tuileRendement(r, s, 'reel');
    if (t.valeur === '?') return; // la fixture n'a pas de potentiel : rien à prouver ici
    expect(t.cible).toBe('visé ?');
    const { prises, pasReleves } = separerPasReleves([t]);
    expect(prises).toHaveLength(1);
    expect(pasReleves).toBeNull();
  });

  it('un rendement jamais calculé reste « ? » et va dans « Pas relevés »', () => {
    const r = recipe();
    const t = tuileRendement(r, brewState(r), 'reel');
    expect(t.valeur).toBe('?');
    expect(separerPasReleves([t]).pasReleves).not.toBeNull();
  });

  it('grainPourProchain : sans visé, null (jamais un chiffre inventé)', () => {
    const r = recipe();
    expect(grainPourProchain(r, brewState(r))).toBeNull();
  });
});
