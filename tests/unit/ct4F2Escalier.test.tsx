/** @vitest-environment jsdom */
// CT4-A-8 (critique tour 4) : à 390, la courbe des Prévisions montrait « Fermenteur su… » et « sans Fermenteur supplé… 2 857,34 » (noms coupés par la fin) et
// le pointillé de l'autre scénario traversait « sans Fermenteur ». Le nom du projet est écrit en entier, et le nom du pointillé ne touche ni son trait ni la courbe.
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { construireEscalier } from '../../src/ui/finance/previsions/escalier';
import { EscalierSvg } from '../../src/ui/finance/previsions/EscalierSvg';
import { largeurTexte } from '../../src/ui/finance/previsions/placement';

type R = { x: number; y: number; w: number; h: number };
const touche = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const num = (e: Element, a: string) => Number(e.getAttribute(a));
const out = (id: string, date: string, cents: number, label: string, source: ForecastItem['source'] = 'plan', planId = id): ForecastItem => ({ id, date, label, amountCents: cents, direction: 'out', source, category: 'divers', planId });

const NOM = 'Fermenteur supplémentaire';
const communs = [out('a', '2026-11-20', 6000, 'Atelier', 'invoice'), out('b', '2026-11-20', 6426, 'Gaz', 'invoice'), out('l1', '2026-11-25', 40000, 'Loyer', 'recurring', 'LOYER'), out('l2', '2026-12-25', 40000, 'Loyer', 'recurring', 'LOYER'), out('l3', '2027-01-25', 40000, 'Loyer', 'recurring', 'LOYER')];
const ferm = out('f', '2027-01-01', 75000, NOM, 'equipment', 'FERM');
const asOf = '2026-11-20', fin = '2027-02-18', depart = 418_160;

/** Les traits d'un chemin « M x y H x V y … » (l'escalier n'a que des horizontales et des verticales), épaissis de 3 px. */
function traits(d: string): R[] {
  const jetons = d.match(/[MHV]|-?\d+(?:\.\d+)?/g) ?? [], r: R[] = [];
  let x = 0, y = 0;
  for (let i = 0; i < jetons.length;) {
    const c = jetons[i++];
    if (c === 'M') { x = Number(jetons[i++]); y = Number(jetons[i++]); }
    else if (c === 'H') { const nx = Number(jetons[i++]); r.push({ x: Math.min(x, nx) - 1.5, y: y - 1.5, w: Math.abs(nx - x) + 3, h: 3 }); x = nx; }
    else if (c === 'V') { const ny = Number(jetons[i++]); r.push({ x: x - 1.5, y: Math.min(y, ny) - 1.5, w: 3, h: Math.abs(ny - y) + 3 }); y = ny; }
  }
  return r;
}

function rendre(largeur: number, majoration: number, sansMode = false) {
  const mes = (t: string, corps: number, mono?: boolean) => Math.ceil(largeurTexte(t, corps, mono) * majoration);
  const avec = construireEscalier({ departCents: depart, items: [...communs, ferm], debut: asOf, fin }), sans = construireEscalier({ departCents: depart, items: communs, debut: asOf, fin });
  const { container } = render(<EscalierSvg e={sansMode ? sans : avec} fantome={sansMode ? avec : sans} nomFantome={`${sansMode ? 'avec' : 'sans'} ${NOM}`} largeur={largeur} testeId={sansMode ? null : 'FERM'} sousLignes={{ f: 'usure ?' }} asOf={asOf} onEtiquette={() => {}} onRestes={() => {}} mesure={mes} />);
  return { svg: container.querySelector('svg')!, mes };
}

describe('CT4-A-8 : la courbe des Prévisions n’abrège plus le nom du projet et ne passe plus sur son texte', () => {
  it.each([[330, 1], [370, 1], [370, 1.15], [560, 1]])('largeur %i, mesure ×%s : aucun texte coupé par « … », nom du projet entier', (largeur, maj) => {
    const { svg } = rendre(largeur, maj);
    const coupes = [...svg.querySelectorAll('text')].map(t => t.textContent ?? '').filter(t => t.includes('…'));
    expect(coupes).toEqual([]);
    expect([...svg.querySelectorAll('.prv-tx')].map(t => t.textContent).join(' | ')).toContain(NOM);
  });
  it.each([[330, 1, false], [370, 1, false], [370, 1.15, false], [370, 1, true]])('largeur %i, ×%s, sans=%s : le nom du pointillé ne touche ni le pointillé ni la courbe', (largeur, maj, sansMode) => {
    const { svg, mes } = rendre(largeur, maj, sansMode);
    const obstacles = [...traits(svg.querySelector('.prv-ghost')!.getAttribute('d')!), ...traits(svg.querySelector('.prv-step')!.getAttribute('d')!)];
    const noms = [...svg.querySelectorAll('.prv-nom-ghost')];
    expect(noms.length).toBeGreaterThan(0);
    for (const t of noms) {
      const s = t.textContent ?? '', w = mes(s, 13, false), x = num(t, 'x'), y = num(t, 'y');
      const rect: R = { x: t.getAttribute('text-anchor') === 'end' ? x - w : x, y: y - 11, w, h: 13 };
      expect(obstacles.filter(o => touche(rect, o)).length, `« ${s} » touche un trait`).toBe(0);
    }
  });
});
