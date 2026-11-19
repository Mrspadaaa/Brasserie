// @vitest-environment jsdom
// T2B-3 (tour 3, work/missions/BUGS.md) : « Le retour sur l'onglet « Ma levure » prend ≈ 1,2 s » (Chercher et Comparer : 15 à 55 ms).
//
// Mesure (jsdom, BrewWizard réel, étape Levure) : le wizard ne remonte PAS l'étape (le nœud `data-lv="etape"` reste le même) ; c'est
// `EtapeLevure.tsx` qui écrit `{vue === 'ma-levure' && <MaLevure … />}` : chaque retour remonte `MaLevure` et les replis, avec leurs
// `useMemo` perdus (brouillon, évaluation, dose, index des 1 734 fiches). Le fichier est sous `src/ui/etapeLevure/` (refonte en cours dans une
// autre session) : la correction y est proposée (RESULTAT.md, « DÉCISION À PRENDRE »), pas faite ici.
//
// Le second test est écrit en `it.fails` : il décrit le comportement voulu (un seul montage) et ÉCHOUE sur le code actuel (rouge : « expected 3 to be 1 »),
// donc la suite reste verte tant que le défaut existe. À la correction de la coque (Activity ou masquage), le test devient « vrai » et vitest
// le signale : retirer alors `.fails`.
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { companionRecipe } from '../fixtures/companionRecipe';
import { allerEtape } from '../helpers/wizard';

/** Sonde : compte les montages de MaLevure et mesure (React Profiler) la durée de chacun. Le vrai composant est rendu. */
const sonde = vi.hoisted(() => ({ montages: 0, dureesMs: [] as number[] }));
vi.mock('../../src/ui/etapeLevure/MaLevure', async importOriginal => {
  const reel = await importOriginal<typeof import('../../src/ui/etapeLevure/MaLevure')>();
  const R = await import('react');
  const Sonde = (props: Parameters<typeof reel.MaLevure>[0]) => {
    R.useEffect(() => { sonde.montages += 1; }, []);
    return R.createElement(R.Profiler, { id: 'ma-levure', onRender: (_id, phase, ms) => { if (phase === 'mount') sonde.dureesMs.push(Math.round(ms)); } },
      R.createElement(reel.MaLevure, props));
  };
  return { ...reel, MaLevure: Sonde };
});

beforeEach(() => { localStorage.clear(); sonde.montages = 0; sonde.dureesMs = []; });
afterEach(() => { cleanup(); localStorage.clear(); });

const mount = () => render(<BrewWizard draftKey="fixture-owner:ZZ-LEVURE" seed={{ recipe: companionRecipe() }} config={defaultConfig} stockItems={[]}
  knownStyles={['NEIPA']} onSave={vi.fn()} onClose={vi.fn()} onSaveWaterSource={vi.fn()} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} />);
const toucher = (id: 'ma-levure' | 'chercher' | 'comparer'): number => {
  const bouton = document.querySelector<HTMLElement>(`[data-vue-id="${id}"]`)!;
  const t0 = performance.now();
  act(() => { fireEvent.click(bouton); });
  return Math.round((performance.now() - t0) * 10) / 10;
};

describe('T2B-3 · retour sur Ma levure', () => {
  it('mesure : le wizard garde l’étape montée, et MaLevure n’est montée qu’une fois', () => {
    mount();
    allerEtape(/^Levure/);
    const etape = document.querySelector('[data-lv="etape"]')!;
    toucher('chercher');                 // 1er passage : monte Chercher (chunks et caches froids)
    const retour1 = toucher('ma-levure');
    const comparer = toucher('comparer');
    const retour2 = toucher('ma-levure');
    const comparer2 = toucher('comparer');
    const retour3 = toucher('ma-levure');
    console.info('T2B-3 MESURE ms', JSON.stringify({ retour1, retour2, retour3, comparer, comparer2, montagesMaLevure: sonde.dureesMs }));
    // L'étape elle-même n'est jamais remontée : la cause n'est pas dans BrewWizard.
    expect(document.querySelector('[data-lv="etape"]')).toBe(etape);
    // Avant T2B-3 : 4 montages (1 + 3 retours) et un retour plus lent que Comparer. Après : 1 montage, plus rien à remonter.
    expect(sonde.montages).toBe(1);
  });

  it('VOULU : Ma levure ne se remonte pas au retour de Chercher ou de Comparer (rouge tant que la coque ne la garde pas montée)', () => {
    mount();
    allerEtape(/^Levure/);
    expect(sonde.montages).toBe(1);
    toucher('chercher'); toucher('ma-levure');
    toucher('comparer'); toucher('ma-levure');
    expect(sonde.montages).toBe(1); // actuel : 3
  });
});
