/** @vitest-environment jsdom */
// T3B-10 : balayage du placement des étiquettes de l'escalier (Prévisions). Une bulle ne recouvre ni le solde final, ni un solde de marche,
// ni une graduation, ni « aujourd'hui », ni un autre texte du graphique. Les rectangles sont ceux que l'écran dessine (jsdom ne mesure pas
// les polices : on passe au graphique une mesure de texte plus large que l'estimation (police plus large, graisse), la même pour le placement et pour le contrôle).
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { construireEscalier } from '../../src/ui/finance/previsions/escalier';
import { EscalierSvg } from '../../src/ui/finance/previsions/EscalierSvg';
import { largeurTexte } from '../../src/ui/finance/previsions/placement';

type R = { x: number; y: number; w: number; h: number; nom: string };
const touche = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const num = (e: Element, a: string) => Number(e.getAttribute(a));

const item = (id: string, date: string, cents: number, label: string, source: ForecastItem['source'] = 'plan'): ForecastItem =>
  ({ id, date, label, amountCents: cents, direction: 'out', source, category: 'divers', planId: id });

/** Rend l'escalier et rend, pour chaque bulle, ce qu'elle recouvre parmi les textes du graphique. */
export function conflits(items: ForecastItem[], departCents: number | null, largeur: number, majoration = 1): string[] {
  const asOf = '2026-11-20', fin = '2027-02-18';
  const e = construireEscalier({ departCents, items, debut: asOf, fin });
  const mes = (t: string, corps: number, mono?: boolean) => Math.ceil(largeurTexte(t, corps, mono) * majoration);
  const { container, unmount } = render(<EscalierSvg e={e} largeur={largeur} asOf={asOf} onEtiquette={() => {}} onRestes={() => {}} mesure={mes} />);
  const svg = container.querySelector('svg')!;
  const chips: R[] = [...svg.querySelectorAll('.prv-etq')].map(g => { const c = g.querySelector('.prv-chip')!; return { x: num(c, 'x'), y: num(c, 'y'), w: num(c, 'width'), h: num(c, 'height'), nom: g.querySelector('.prv-tx')?.textContent ?? '' }; });
  const texte = (t: Element, corps: number, mono: boolean): R => {
    const s = t.textContent ?? '', w = mes(s, corps, mono), x = num(t, 'x'), y = num(t, 'y');
    const fin = t.getAttribute('text-anchor') === 'end';
    return { x: fin ? x - w : x, y: y - corps, w, h: corps + 3, nom: `${t.getAttribute('class')} « ${s} »` };
  };
  const textes: R[] = [
    ...[...svg.querySelectorAll('.prv-fin')].map(t => texte(t, 16, true)),
    ...[...svg.querySelectorAll('.prv-solde')].map(t => texte(t, 12, true)),
    ...[...svg.querySelectorAll('.prv-et')].map(t => texte(t, 13, false)),
    ...[...svg.querySelectorAll('.prv-nom-ghost')].map(t => texte(t, 13, false))
  ];
  const res: string[] = [];
  for (const c of chips) for (const t of textes) if (touche(c, t)) res.push(`${c.nom} × ${t.nom}`);
  for (let i = 0; i < chips.length; i++) for (let j = i + 1; j < chips.length; j++) if (touche(chips[i], chips[j])) res.push(`${chips[i].nom} × ${chips[j].nom}`);
  unmount();
  return res;
}

describe('T3B-10 · balayage : aucune bulle sur un texte du graphique', () => {
  it('scénarios du brasseur : solde final autour de −703,68, « TEST −9 » le 25.12, plus ou moins d\'autres marches', () => {
    const autres: ForecastItem[][] = [
      [],
      [item('a', '2026-11-25', 40000, 'Loyer')],
      [item('a', '2026-11-25', 40000, 'Loyer'), item('b', '2026-12-02', 12000, 'Houblons')],
      [item('a', '2026-11-25', 40000, 'Loyer'), item('b', '2026-12-25', 12000, 'Houblons'), item('c', '2027-01-25', 40000, 'Loyer')],
      [item('a', '2026-12-20', 15000, 'Fût'), item('b', '2026-12-26', 700, 'Achat')],
      [item('a', '2026-12-24', 30000, 'Matériel'), item('b', '2026-12-27', 5000, 'Dépense')]
    ];
    const echecs: string[] = [];
    for (const largeur of [300, 390, 640]) for (const [k, base] of autres.entries()) for (const jour of ['2026-12-21', '2026-12-23', '2026-12-25', '2026-12-28', '2027-01-05', '2027-01-20', '2027-02-10']) for (const fin of [-70368, -50000, -9000, 30000, 250000]) {
      const items = [...base, item('zz', jour, 900, 'ZZ TEST — passe 4 achat')];
      const somme = items.reduce((s, i) => s + i.amountCents, 0);
      for (const maj of [1, 1.15, 1.3]) for (const c of conflits(items, fin + somme, largeur, maj)) echecs.push(`l${largeur} base${k} ${jour} fin${fin} ×${maj} : ${c}`);
    }
    console.log(`BALAYAGE ${echecs.length} conflits`); console.log(echecs.slice(0, 40).join('\n'));
    expect(echecs).toEqual([]);
  }, 120000);
});

describe('T3B-10 · scénarios tirés au hasard (graine fixe)', () => {
  it('aucune bulle ne recouvre un texte, solde final négatif ou non, 1 à 9 marches', () => {
    let graine = 20261120;
    const hasard = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; };
    const entre = (a: number, b: number) => a + Math.floor(hasard() * (b - a + 1));
    const jour = (n: number) => new Date(Date.UTC(2026, 10, 20 + n, 12)).toISOString().slice(0, 10);
    const sources: ForecastItem['source'][] = ['plan', 'plan', 'recurring', 'brew', 'invoice', 'equipment'];
    const mots = ['Loyer', 'Houblons', 'Fût', 'ZZ TEST — passe 4 achat', 'Matériel', 'Assurance', 'Levure', 'Impôt'];
    const echecs: string[] = [];
    for (let n = 0; n < 800; n++) {
      const items: ForecastItem[] = Array.from({ length: entre(1, 9) }, (_, k) => {
        const montants = [900, 700, 1230, 5000, 12000, 40000, 75000, 250000];
        return item(`i${k}`, jour(entre(0, 88)), montants[entre(0, montants.length - 1)], mots[entre(0, mots.length - 1)], sources[entre(0, sources.length - 1)]);
      });
      const total = items.reduce((s, i) => s + i.amountCents, 0), fin = [-70368, -9000, 0, 30000, 400000][entre(0, 4)];
      const largeur = [280, 330, 366, 390, 480, 640][entre(0, 5)];
      for (const c of conflits(items, n % 4 === 0 ? null : fin + total, largeur, 1)) echecs.push(`#${n} l${largeur} fin${fin} ${items.map(i => `${i.date}:${i.amountCents}`).join(' ')} : ${c}`);
    }
    console.log(`HASARD ${echecs.length} conflits`); console.log(echecs.slice(0, 25).join('\n'));
    expect(echecs).toEqual([]);
  }, 120000);
});
