// @vitest-environment jsdom
// q9 (kq2 : gfc n° 1 et 2, e6a n° 1, e9na n° 2) : toast lisible, bande °C cuve, un seul réglage de période, teinte de la pastille de style.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getBatches: () => [], updateBatch: () => undefined, getUiState: () => null, setUiState: () => undefined } }));

import type { Batch } from '../../src/types';
import { modeleFiche } from '../../src/ui/production/fermentation/modele';
import { geometrie, GrapheTemps } from '../../src/ui/production/fermentation/GrapheTemps';
import { FicheFermentation } from '../../src/ui/production/fermentation/FicheFermentation';
import { PastilleStyle, aplatDuStyle } from '../../src/ui/atelier/PastilleStyle';

const NOW = Date.UTC(2026, 10, 14, 11, 0, 0);
const lot = (gravityLog: unknown[]): Batch => ({
  id: 'ZZ-Q9', name: 'ZZ NEIPA', style: 'NEIPA', status: 'fermentation', volumeL: 24, brewDate: '10.11.2026', og: '1,062', gravityLog,
  brewDay: { pitchedAt: Date.UTC(2026, 10, 10, 11, 0, 0), steps: [], currentIndex: 0 },
  recipeSnapshot: { fgTarget: 1.012, hops: [], fermentation: [{ kind: 'primaire', days: 5, tempC: 19 }, { kind: 'garde', days: 7, tempC: 2 }] }
} as unknown as Batch);

const graphe = (b: Batch) => {
  const m = modeleFiche(b, NOW)!;
  return { m, html: renderToStaticMarkup(<svg><GrapheTemps m={m} g={geometrie(342, m.nbJours, false)} /></svg>) };
};

describe('q9 gfc n° 2 : la bande °C cuve', () => {
  it('sans aucune température : le dit en mots, du premier jour à aujourd’hui', () => {
    const { html } = graphe(lot([{ date: '12.11.2026', sg: 1.03 }]));
    expect(html).toMatch(/cuve non relevée du 10 au 14\.11/);
  });

  it('avec le °C des relevés existants : la trace et les valeurs, sans phrase d’absence', () => {
    const { m, html } = graphe(lot([
      { date: '11.11.2026', sg: 1.04, tempC: 19.3 }, { date: '12.11.2026', sg: 1.03, tempC: 19.6 }, { date: '13.11.2026', sg: 1.02, tempC: 19.4 }
    ]));
    expect(html).not.toMatch(/cuve non relevée du/);
    expect(html).toContain('19,3');
    expect(html).toContain('19,6');
    expect(html).toContain('19,4');
    expect(m.points.filter(p => p.tempC !== undefined)).toHaveLength(3);
  });

  it('la cuve notée prime sur le °C du relevé', () => {
    const { html } = graphe(lot([{ date: '13.11.2026', sg: 1.02, tempC: 15, notes: 'Cuve 19,2 °C' }, { date: '12.11.2026', sg: 1.03, tempC: 14 }]));
    expect(html).toContain('19,2');
    expect(html).not.toContain('15,0');
  });

  it('un relevé du jour avec température : « auj. non relevée » disparaît', () => {
    const { html } = graphe(lot([{ date: '14.11.2026', sg: 1.02, tempC: 19 }]));
    expect(html).not.toMatch(/auj\. <tspan[^>]*>non relevée/);
  });
});

describe('q9 gfc n° 1 : le toast du déstockage', () => {
  it('texte clair sur son fond sombre : la couleur suit le jeton de la page, pas l’encre fixe', () => {
    const m = modeleFiche(lot([]), NOW)!;
    const html = renderToStaticMarkup(<FicheFermentation m={m} verbe="Citra" reserve={[]} onAjoute={() => undefined} onAcces={() => undefined} onTache={() => undefined} toast={{ nom: 'Citra', g: 100, annuler: () => undefined }} />);
    const toast = html.match(/<div role="status" data-toast-stock[^>]*>/)?.[0] ?? '';
    expect(toast).toContain('bg-cave-50');
    expect(toast).not.toContain('text-cave-950');
    expect(toast).toContain('color:rgb(var(--cave-950))');
    expect(html).toContain('Citra −100 g');
    expect(html).toContain('>Annuler<');
  });
});

describe('q9 e9na n° 2 : la teinte de la pastille de style', () => {
  it('Lager jaune, Ambrée forte orange, NEIPA lime : plus un ambre commun', () => {
    expect(aplatDuStyle('Lager')).toBe('bg-yellow-400/40');
    expect(aplatDuStyle('Ambrée forte')).toBe('bg-orange-400/40');
    expect(aplatDuStyle('NEIPA')).toBe('bg-lime-400/40');
    expect(aplatDuStyle('Lager')).not.toBe(aplatDuStyle('Ambrée forte'));
  });
  it('un style inconnu reçoit le gris chaud, le nom reste celui du brasseur', () => {
    const html = renderToStaticMarkup(<PastilleStyle style="Truc maison" />);
    expect(html).toContain('bg-cave-700');
    expect(html).toContain('>Truc maison<');
    expect(html).toContain('data-pastille="style"');
  });
});

/* m3r-a (décision du pilote, 16.11) : UNE seule période dans l'app, celle de l'en-tête. La pastille de l'en-tête reste visible sur Brassins
   (plus de masquage) ; la feuille de la liste lit et écrit la même période ; la liste ne garde plus de période propre. */
describe('q9 e6a n° 1 : une seule source de période', () => {
  it('l’en-tête ne se tait plus sur la liste ; la liste lit la période de l’app et la feuille l’écrit', async () => {
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/ui/production/liste/liste.css', 'utf8');
    expect(css).not.toMatch(/data-periode-entete/);
    expect(fs.readFileSync('src/components/Header.tsx', 'utf8')).not.toContain('data-periode-entete');
    expect(fs.readFileSync('src/ui/production/liste/ListeBrassins.tsx', 'utf8')).toContain('data-liste-brassins');
    // la liste reçoit tous les brassins et la vraie période de l'app ; « Toutes » de sa feuille écrit la période commune
    const prod = fs.readFileSync('src/components/tabs/ProductionTab.tsx', 'utf8');
    expect(prod).toMatch(/batches=\{batches\} globalTimeFilter=\{globalTimeFilter\}/);
    expect(prod).toContain('onChoisirPeriode={onChangeGlobalTimeFilter}');
    expect(fs.readFileSync('src/ui/production/ProductionCatalog.tsx', 'utf8')).toContain('appPeriode={globalTimeFilter}');
    expect(fs.readFileSync('src/ui/production/liste/FeuilleFiltres.tsx', 'utf8')).toContain('p.onPeriode?.');
  });
});
