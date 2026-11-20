// @vitest-environment jsdom
/* Voie g2, tour 2 (critique CT4C, n° 6 et 7) : Clients › Prix, coût connu.
   6 : « Bière Pale Ale » garde son espace (aucun mot collé, ni au texte lu ni à l'écran).
   7 : en cave, les tuiles de format absentes (« 75 cl / prix ? / ≤ ? ») tiennent 4,5:1 : l'absence ne passe plus par une opacité sur le texte. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PrixEcran } from '../../src/ui/prix/PrixEcran';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import type { Batch, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));

const css = readFileSync('src/ui/prix/prix.css', 'utf8');
const themes = readFileSync('src/theme/themes.css', 'utf8');
const annee = new Date().getFullYear();
const brassin = { id: 'B1', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, volumePackagedL: 27, brewDate: `15.09.${annee}`, status: 'conditionne', og: '1.048', abv: '4,8%',
  packaging: { bottles33: 81, bottles75: 0, kegIds: [] }, recipeSnapshot: { name: 'Pale Ale', ogTarget: 1.048 } as never } as unknown as Batch;
const tarif: PricingItem = { product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 }, priceHT: 5, emballageUnite: 0.3 };

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const monter = () => {
  vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile: { annualProductionL: 1200 }, plans: [], payments: [], assets: [], closings: [] }) as never);
  vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => [brassin]);
  vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => [tarif]);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
  return render(<PrixEcran config={defaultConfig} tarifs={[tarif]} batches={[brassin]} />);
};

describe('CT4C n° 6 : « Bière Pale Ale » avec son espace', () => {
  it('le texte de l’étiquette est « Bière Pale Ale »', () => {
    const { container } = monter();
    const etiquette = container.querySelector('.prx-biere') as HTMLElement;
    expect(etiquette.textContent).toBe('Bière Pale Ale');
  });
  it('l’écart visuel entre le mot et le nom vaut au moins 4 px (si le mot est visible)', () => {
    const m = css.match(/\.prx-biere\s*\{[^}]*\bgap:\s*(\d+)px/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(4);
  });
});

/* Contraste WCAG (valeurs `r g b` des jetons de themes.css). */
const jeton = (bloc: string, nom: string): [number, number, number] => {
  const m = bloc.match(new RegExp(`--${nom}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`));
  if (!m) throw new Error(`jeton ${nom} absent`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
};
const lum = ([r, g, b]: number[]) => { const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const rapport = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const melange = (texte: number[], fond: number[], opacite: number) => texte.map((c, i) => c * opacite + fond[i] * (1 - opacite));
const blocClair = themes.slice(themes.indexOf(':root,'), themes.indexOf("[data-theme='cave'] {"));
const blocCave = themes.slice(themes.indexOf("[data-theme='cave'] {"));

describe('CT4C n° 7 : tuiles de format absentes lisibles en cave', () => {
  /** Opacité réellement posée sur le TEXTE d'une tuile ou d'un bouton de format absent (1 si aucune). */
  const opacite = (): number => {
    const regles = [...css.matchAll(/([^{}]*\[data-absent\][^{}]*)\{([^}]*)\}/g)].filter(r => /prx-tuile|prx-fmt/.test(r[1]) && !/svg/.test(r[1]));
    expect(regles.length).toBeGreaterThan(0);
    const o = regles.map(r => r[2].match(/(?:^|;|\s)opacity:\s*([\d.]+)/)).filter(Boolean).map(m => Number(m![1]));
    return o.length ? Math.min(...o) : 1;
  };
  for (const [nom, bloc] of [['clair', blocClair], ['cave', blocCave]] as const) {
    it(`${nom} : « prix ? » (cave-400), « 75 cl » (cave-200) et « ≤ ? » (cave-400) tiennent 4,5:1 sur le fond de la page`, () => {
      const fond = jeton(bloc, 'cave-950'); const o = opacite();
      for (const t of ['cave-400', 'cave-200']) expect(rapport(melange(jeton(bloc, t), fond, o), fond), `${nom} ${t}`).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('l’absence se dit autrement que par l’opacité du texte (bordure pointillée)', () => {
    expect(css).toMatch(/\.prx-tuile\[data-absent\][^{]*\{[^}]*dashed/);
  });
});

describe('CT4C tour 2 (vu au doute 1) : « 7,51 CHF/L › » ne recouvre plus « coût ≥ 2,18 » à 390', () => {
  it('sous 1000 px le bouton du coût du litre commence à 44 % de la largeur ou plus (le « coût » du graphe finit vers 42 %)', () => {
    const m = css.match(/@media \(max-width: 999px\)\s*\{[\s\S]*?\.prx-cout\s*\{[^}]*\bleft:\s*(\d+)%/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(44);
  });
});
