// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { semainesDe } from '../../src/domain/calendrier';
import { etatInitial, lire, reduire, type EtatCadre, type Horizon } from '../../src/ui/calendrier/cadre/etat';
import { useCadre, type Cadre } from '../../src/ui/calendrier/cadre/useCadre';
import { libelleDuree } from '../../src/ui/calendrier/entete/Fenetre';
import { periodesBande } from '../../src/ui/calendrier/entete/BandeSemaines';
import type { Periode } from '../../src/components/periode/periode';

/* Voie modele (23.11 soir) : le test par modèle (e2e/calendrier/etat-coherent.spec.ts) rouge sur « 5 ans » pour un cadre de 269,6 sem. ; T29-8 ;
   T32-1 (re-régler la même période de l'app) ; la période de l'app changée en paysage. Un test unitaire par constat, rouge avant le correctif. */

const H: Horizon = { premier: '2025-11-24', total: 5 * 52 + 1 + 52, lundiAuj: '2026-11-23' };
const dates = (du: string, au: string): Periode => ({ genre: 'dates', du, au });
const depart = (o: Partial<Parameters<typeof etatInitial>[0]> = {}): EtatCadre => etatInitial({ app: dates('2026-11-23', '2027-01-03'), gardee: null, echelle: 'semaine', paysage: false, ...o }, H);

describe('le libellé de durée en années : le contrat du test par modèle', () => {
  /** Ce que lit le test e2e (`lireDuree`) : « 5 ans » = 5 × 52,18 sem., « 2 ans ½ » = 2,5 × 52,18. */
  const lu = (t: string): number | null => { const m = /^(\d+) ans( ½)?$/.exec(t); return m ? (Number(m[1]) + (m[2] ? 0.5 : 0)) * 52.18 : null; };
  it('de 2 à 10 ans, le libellé est bien formé et reste à ¼ d\'an (14,5 sem.) du cadre', () => {
    fc.assert(fc.property(fc.integer({ min: 105, max: 520 }), (sem) => {
      const t = libelleDuree(sem, false);
      expect(t, `${sem} sem.`).toMatch(/^(?:[2-9]|10) ans(?: ½)?$/);
      expect(Math.abs((lu(t) as number) - sem), `${sem} sem. → « ${t} »`).toBeLessThanOrEqual(14.5);
    }));
  });
  it('la graine -2119159308 : 269,6 sem. (mai 2026 – juin 2031) se dit « 5 ans », écart 9,6 sem. toléré', () => {
    expect(libelleDuree(270, false)).toBe('5 ans');
    expect(Math.abs((lu('5 ans') as number) - 269.6)).toBeLessThan(14.5);
  });
});

describe('T29-8 : l\'année à janvier sur la bande de l\'An (390 px : un mois = 30 px, « S53 » = 28 px)', () => {
  const noms = (debut: string, n: number, l: number, w: number) => {
    const s = semainesDe(debut, n);
    const a = s.map((_, k) => k * l).concat([n * l]);
    return periodesBande(s, a, 'mois', l, w).noms;
  };
  it('« 2027 » ne tient pas : janvier dit « ’27 », les autres mois leur initiale', () => {
    const n = noms('2026-10-26', 53, 6.9, 28);
    expect(n.map((x) => x.texte).join(' ')).toMatch(/’27/);
    expect(n.filter((x) => x.texte.length === 1).length).toBeGreaterThan(8);
  });
  it('« ’27 » ne déborde pas sur ses voisins (une initiale = 14 px, le nom = 24 px, 4 px d\'écart)', () => {
    const n = noms('2026-10-26', 53, 6.9, 28);
    for (let k = 1; k < n.length; k++) {
      const w = (t: string) => (t.length === 1 ? 14 : t.length === 3 ? 24 : 39);
      expect(n[k].x - n[k - 1].x, `${n[k - 1].texte} ${n[k].texte}`).toBeGreaterThanOrEqual((w(n[k].texte) + w(n[k - 1].texte)) / 2 + 4);
    }
    expect(n[0].x - 14 / 2).toBeGreaterThanOrEqual(0);
  });
  it('« 2027 » entier quand il tient (maquette à 7,5 px la semaine, étiquette de 14 px)', () => {
    expect(noms('2026-10-26', 70, 7.5, 14).map((x) => x.texte)).toContain('2027');
  });
});

describe('E10 : la période de l\'app changée pendant la rotation en paysage', () => {
  it('le retour en portrait rend la période de l\'app choisie en paysage, pas l\'ancienne', () => {
    const portrait = depart();
    let e = reduire(portrait, { type: 'orientation', paysage: true }, H);
    e = reduire(e, { type: 'app', periode: dates('2027-02-01', '2027-02-28') }, H);
    e = reduire(e, { type: 'orientation', paysage: false }, H);
    expect(lire(e, H).du).toBe('2027-02-01');
    expect(lire(e, H).au).toBe('2027-02-28');
  });
});

describe('T32-1 : régler à nouveau la même période de l\'app recadre la frise', () => {
  afterEach(cleanup);
  function Sonde({ app, sortie }: { app: Periode; sortie: { cadre?: Cadre } }) {
    sortie.cadre = useCadre({ app, paysage: false, horizon: H });
    return null;
  }
  it('après un geste, la même période (une nouvelle valeur de l\'App) repose le cadre sur elle', () => {
    localStorage.clear();
    const sortie: { cadre?: Cadre } = {};
    const app = dates('2026-12-14', '2026-12-27');
    const { rerender } = render(<Sonde app={app} sortie={sortie} />);
    expect(sortie.cadre!.du).toBe('2026-12-14');
    act(() => sortie.cadre!.agir({ type: 'poser', fenetre: { du: '2027-03-01', semaines: 8 } }));
    expect(sortie.cadre!.du).toBe('2027-03-01');
    /* le même rendu de l'App (même objet) ne bouge rien */
    rerender(<Sonde app={app} sortie={sortie} />);
    expect(sortie.cadre!.du).toBe('2027-03-01');
    /* le brasseur règle la même période : une nouvelle valeur, même contenu */
    rerender(<Sonde app={dates('2026-12-14', '2026-12-27')} sortie={sortie} />);
    expect(sortie.cadre!.du).toBe('2026-12-14');
    expect(sortie.cadre!.fenetre.semaines).toBe(2);
  });
});
