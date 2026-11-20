// @vitest-environment jsdom
// ct4a tour 2 (critique k4, 20.11) : CT4-B-8 (pointillé « auj. » et « consigne » ne coupent plus un texte), CT4-B-8 / n° 9 (l'alcool garde sa décimale).
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getBatches: () => [], updateBatch: () => undefined, getUiState: () => null, setUiState: () => undefined, getHopKnowledge: () => [] } }));

import type { Batch } from '../../src/types';
import { modeleFiche } from '../../src/ui/production/fermentation/modele';
import { geometrie, GrapheTemps } from '../../src/ui/production/fermentation/GrapheTemps';
import { FicheFermentation } from '../../src/ui/production/fermentation/FicheFermentation';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const NOW = Date.UTC(2026, 10, 14, 11, 0, 0);
const lot = (gravityLog: unknown[]): Batch => ({
  id: 'ZZ-CT4', name: 'ZZ Stout', style: 'Stout', status: 'fermentation', volumeL: 20, volumeBrewedL: 29, brewDate: '10.11.2026', og: '1,064', gravityLog,
  brewDay: { pitchedAt: Date.UTC(2026, 10, 10, 11, 0, 0), steps: [], currentIndex: 0 },
  recipeSnapshot: { hops: [], fermentation: [{ kind: 'primaire', days: 6, tempC: 19 }, { kind: 'garde', days: 7, tempC: 2 }] }
} as unknown as Batch);
const avant = [{ date: '11.11.2026', sg: 1.058, tempC: 20 }, { date: '12.11.2026', sg: 1.03, tempC: 20 }, { date: '13.11.2026', sg: 1.016, tempC: 20 }];
const avecAuj = [...avant, { date: '14.11.2026', sg: 1.012, tempC: 20 }];

interface Texte { x: number; y: number; ancre: string; taille: number; contenu: string }
const textes = (html: string): Texte[] => [...html.matchAll(/<text ([^>]*)>(.*?)<\/text>/g)].map(([, a, c]) => ({
  x: Number(/ x="([-\d.]+)"/.exec(` ${a}`)?.[1]), y: Number(/ y="([-\d.]+)"/.exec(` ${a}`)?.[1]), ancre: /text-anchor="(\w+)"/.exec(a)?.[1] ?? 'start',
  taille: Number(/font-size="([\d.]+)"/.exec(a)?.[1] ?? 12), contenu: c.replace(/<[^>]+>/g, '')
}));
const boite = (t: Texte) => { const w = t.contenu.length * 0.6 * t.taille; return t.ancre === 'end' ? [t.x - w, t.x] : t.ancre === 'middle' ? [t.x - w / 2, t.x + w / 2] : [t.x, t.x + w]; };

describe('CT4-B-8 (tour 2) : le pointillé de la colonne « auj. » ne coupe aucune valeur de densité', () => {
  for (const [nom, releves] of [['relevé du jour', avecAuj], ['dernier relevé la veille', avant]] as const) {
    for (const w of [342, 1000]) {
      it(`${nom}, ${w} px`, () => {
        const m = modeleFiche(lot(releves), NOW)!;
        const g = geometrie(w, m.nbJours, false);
        const html = renderToStaticMarkup(<svg><GrapheTemps m={m} g={g} /></svg>);
        const bords = [m.n * g.cw + 1, (m.n + 1) * g.cw - 1];
        const valeurs = textes(html).filter(t => /^(DO )?1,\d{3}$/.test(t.contenu));
        expect(valeurs.length).toBeGreaterThanOrEqual(3);
        for (const t of valeurs) {
          const [a, b] = boite(t);
          for (const bord of bords) expect(a < bord - 1 && b > bord + 1, `« ${t.contenu} » [${a.toFixed(0)}, ${b.toFixed(0)}] coupé par le pointillé à ${bord.toFixed(0)}`).toBe(false);
        }
      });
    }
  }
});

describe('CT4-B-8 (tour 2) : « consigne » ne se pose pas sur le titre de la phase', () => {
  for (const w of [342, 1000]) {
    it(`${w} px : aucun texte ne chevauche un autre texte de l'axe`, () => {
      const m = modeleFiche(lot(avecAuj), NOW)!;
      const g = geometrie(w, m.nbJours, false);
      const t = textes(renderToStaticMarkup(<svg><GrapheTemps m={m} g={g} /></svg>));
      const consigne = t.find(x => x.contenu === 'consigne');
      const titres = t.filter(x => /^(Fermenter|Garde)/.test(x.contenu));
      expect(titres.length).toBeGreaterThan(0);
      if (consigne) {
        const [a, b] = boite(consigne);
        for (const titre of titres) {
          const [c, d] = boite(titre);
          const memeLigne = Math.abs(consigne.y - titre.y) < 14;
          expect(memeLigne && a < d && b > c, `« consigne » sur « ${titre.contenu} »`).toBe(false);
        }
      } else {
        // Sans place dans la courbe, le mot passe à la légende « °C cuve ».
        expect(t.some(x => x.contenu.includes('consigne'))).toBe(true);
      }
    });
  }
});

describe('CT4-B-8 / n° 9 (tour 2) : l’alcool garde sa décimale', () => {
  const rendu = (releves: unknown[]) => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener: () => undefined, removeEventListener: () => undefined }));
    const m = modeleFiche(lot(releves), NOW)!;
    return renderToStaticMarkup(<FicheFermentation m={m} verbe="levuré" reserve={[]} onAjoute={() => undefined} onAcces={() => undefined} onTache={() => undefined} />);
  };
  it('1,064 → 1,012 : 6,96 % arrondi au dixième s’écrit « 7,0 % », jamais « 7 % » (même formule que la fiche, `alcoholByVolume`)', () => {
    const html = rendu(avecAuj).replace(/<!-- -->/g, '');
    expect(html).toMatch(/alc\. <span[^>]*>7,0 %<\/span>/);
  });
  it('1,016 : « 6,4 % » inchangé', () => {
    expect(rendu(avant).replace(/<!-- -->/g, '')).toMatch(/alc\. <span[^>]*>6,4 %<\/span>/);
  });
});
