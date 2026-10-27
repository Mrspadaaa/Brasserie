// @vitest-environment jsdom
// r3-radar-echelles (27.10) : les deux échelles du radar de Comparer, sur le vrai écran (EcranApp) et sur le radar commun.
//  D189 : au style, le bord de chaque axe est le même à tous les moments (60′ … dry hop) ; les valeurs, elles, bougent.
//  D187 : en Absolu, la plage type du style est dessinée en bande et l'échelle va du 0 au plus fort de ce qui est montré
//         (plus de 12,5 crans fixes : les séries n'étaient plus tassées sous la plage).
// Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EcranComparerApp from '../../../src/ui/hopIndex/comparer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import { RadarBase, echelle } from '../../../src/ui/hopIndex/commun/RadarBase';
import { bordsAuStyle } from '../../../src/ui/hopIndex/comparer/Radar';
import type { ColonneLue } from '../../../src/ui/hopIndex/comparer/calcul';

const RECETTE = {
  id: 'REC-R3', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const HOUBLONS = ['beermaverick-citra', 'beermaverick-nectaron'];
const MOMENTS = ['60', '10', 'whirlpool', 'dryhop-actif', 'dryhop-apres'];

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserOuvreurCouche(null); });

const monter = async () => {
  poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-R3', onChange: () => {} });
  const r = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
  await waitFor(() => expect(r.container.querySelector('svg[data-radar="base"][data-objet="houblons"]')).not.toBeNull());
  return r;
};
const svgDe = (c: HTMLElement) => c.querySelector('svg[data-radar="base"][data-objet="houblons"]')!;
const maxAxe = (c: HTMLElement) => Object.fromEntries([...svgDe(c).querySelectorAll('[data-axe] [data-role="max-axe"]')].map((t) => [t.parentElement!.getAttribute('data-axe')!, t.textContent!]));
const choisir = async (c: HTMLElement, dm: string) => {
  fireEvent.click(c.querySelector(`[data-role="quand-comparer"] [data-moment="${dm}"]`)!);
  await waitFor(() => expect(c.querySelector(`[data-moment="${dm}"][aria-checked="true"]`)).not.toBeNull());
};

describe('D189 : au style, l\'échelle de chaque axe ne change pas avec le moment', () => {
  it('le maximum écrit près de chaque picto est le même aux cinq moments ; la retenue, elle, change', async () => {
    const { container } = await monter();
    const vues: Record<string, { max: Record<string, string>; valeurs: string }> = {};
    for (const dm of MOMENTS) {
      await choisir(container, dm);
      const plein = svgDe(container).querySelector('g.plein')!;
      vues[dm] = { max: maxAxe(container), valeurs: plein.getAttribute('data-valeurs')! };
    }
    const ref = vues['dryhop-apres'].max;
    expect(Object.keys(ref).length).toBeGreaterThanOrEqual(3);
    for (const dm of MOMENTS) for (const f of Object.keys(ref)) if (f in vues[dm].max) expect(`${dm} ${f} ${vues[dm].max[f]}`).toBe(`${dm} ${f} ${ref[f]}`);
    expect(vues['60'].valeurs).not.toBe(vues['dryhop-apres'].valeurs);
  });
});

describe('D187 : en Absolu, la plage type du style est une bande et l\'échelle suit ce qui est montré', () => {
  it('la bande existe, au style elle n\'y est pas, et l\'échelle ne reste pas à 12,5 crans', async () => {
    const { container } = await monter();
    expect(svgDe(container).querySelector('[data-role="bande-style"]')).toBeNull();
    fireEvent.click(container.querySelector('[data-e="absolu"]')!);
    await waitFor(() => expect(svgDe(container).getAttribute('data-mode')).toBe('absolu'));
    const svg = svgDe(container);
    expect(svg.querySelector('[data-role="bande-style"]')).not.toBeNull();
    expect(svg.getAttribute('data-echelle')).not.toBe('0–12,5');
    // ta bière (le trait noir) et la bande sont dans la même échelle que les séries.
    expect(svg.querySelector('polygon[data-role="reference"]')).not.toBeNull();
    await act(async () => {});
  });
});

describe('bordsAuStyle : le plus fort apport de chaque famille sur tous les moments et tous les houblons', () => {
  // Une colonne réduite à ce que bordsAuStyle lit : le dCran (crans gagnés sur ta stout) de chaque famille.
  const col = (d: Record<string, number | null>) => ({ cellules: Object.fromEntries(Object.entries(d).map(([f, dCran]) => [f, { dCran }])) }) as unknown as ColonneLue;
  const parMoment = [
    [col({ floral: 0.2, citrus: null }), col({ floral: 0, citrus: 0.3 })],
    [col({ floral: 0.5, citrus: 1 }), col({ floral: 0, citrus: 0.3 })],
    [col({ floral: 1.5, citrus: 2 }), col({ floral: 3, citrus: 0.3 })],
    [col({ floral: 1.2, citrus: 2.5 }), col({ floral: 0, citrus: 0.3 })],
  ];
  it('prend le maximum sur les moments et les houblons, et laisse l\'inconnu à null (jamais 0)', () => {
    expect(bordsAuStyle(['floral', 'citrus', 'resin'], parMoment)).toEqual({ floral: 3, citrus: 2.5, resin: null });
    expect(bordsAuStyle(['floral'], [parMoment[0]])).toEqual({ floral: 0.2 });
  });
});

describe('RadarBase : echellesAxe et bande', () => {
  const FAM = ['citrus', 'tropical', 'floral'] as const;
  const serie = (v: number) => ({ cle: 's', nom: 'S', couleur: '#1d5bd8', role: 'retenu' as const, valeurs: { citrus: v, tropical: v, floral: v } });
  const bords = (c: HTMLElement) => [...c.querySelectorAll('[data-role="max-axe"]')].map((t) => t.textContent);
  it('au style, echellesAxe fixe le bord ; une valeur plus grande le repousse ; sans lui, le bord suit la série', () => {
    const a = render(<RadarBase familles={[...FAM]} series={[serie(1)]} mode="style" objet="t" label="t" echellesAxe={{ citrus: 4, tropical: 4, floral: 4 }} />);
    expect(bords(a.container)).toEqual(['4', '4', '4']);
    a.unmount();
    const b = render(<RadarBase familles={[...FAM]} series={[serie(6)]} mode="style" objet="t" label="t" echellesAxe={{ citrus: 4, tropical: 4, floral: 4 }} />);
    expect(bords(b.container)).toEqual(['6', '6', '6']);
    b.unmount();
    const c = render(<RadarBase familles={[...FAM]} series={[serie(1)]} mode="style" objet="t" label="t" />);
    expect(bords(c.container)).toEqual(['1', '1', '1']);
  });
  it('en Absolu, la bande se dessine (haut puis bas) ; au style, elle n\'existe pas', () => {
    const bande = { bas: { citrus: 1, tropical: 1, floral: 0 }, haut: { citrus: 3, tropical: 3, floral: 2 } };
    const a = render(<RadarBase familles={[...FAM]} series={[serie(2)]} mode="absolu" objet="t" label="t" echelleAbsolue={echelle(3)} bande={bande} />);
    const d = a.container.querySelector('[data-role="bande-style"]')!.getAttribute('d')!;
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
    a.unmount();
    const b = render(<RadarBase familles={[...FAM]} series={[serie(2)]} mode="style" objet="t" label="t" bande={bande} />);
    expect(b.container.querySelector('[data-role="bande-style"]')).toBeNull();
  });
});
