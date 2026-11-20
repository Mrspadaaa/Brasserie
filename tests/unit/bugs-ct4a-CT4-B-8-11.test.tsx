// @vitest-environment jsdom
// CT4-B-8 à B-11 (critique tour 4, Recettes et Brassins) : courbe de densité lisible, pleine largeur sans houblons, pouce absent sans valeur, FG de la levure à la saisie.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getBatches: () => [], updateBatch: () => undefined, getUiState: () => null, setUiState: () => undefined, getHopKnowledge: () => [] } }));

import type { Batch } from '../../src/types';
import { modeleFiche, plageFgDeLaLevure } from '../../src/ui/production/fermentation/modele';
import { geometrie, GrapheTemps } from '../../src/ui/production/fermentation/GrapheTemps';
import { FicheFermentation, PanneauMesure } from '../../src/ui/production/fermentation/FicheFermentation';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const NOW = Date.UTC(2026, 10, 14, 11, 0, 0);
const lot = (gravityLog: unknown[], snap: Record<string, unknown> = {}): Batch => ({
  id: 'ZZ-CT4', name: 'ZZ Stout', style: 'Stout', status: 'fermentation', volumeL: 20, volumeBrewedL: 29, brewDate: '10.11.2026', og: '1,064', gravityLog,
  brewDay: { pitchedAt: Date.UTC(2026, 10, 10, 11, 0, 0), steps: [], currentIndex: 0 },
  recipeSnapshot: { fgTarget: 1.012, hops: [], fermentation: [{ kind: 'primaire', days: 5, tempC: 19 }, { kind: 'garde', days: 7, tempC: 2 }], ...snap }
} as unknown as Batch);
const releves = [{ date: '11.11.2026', sg: 1.058 }, { date: '13.11.2026', sg: 1.03 }, { date: '14.11.2026', sg: 1.016, tempC: 19 }];

describe('CT4-B-8 : les valeurs de la courbe restent lisibles', () => {
  const svg = (largeur: number) => {
    const m = modeleFiche(lot(releves), NOW)!;
    return renderToStaticMarkup(<svg><GrapheTemps m={m} g={geometrie(largeur, m.nbJours, false)} /></svg>);
  };
  const etiquette = (html: string, texte: string) => new RegExp(`<text[^>]*>${texte}</text>`).exec(html)?.[0] ?? '';
  it('chaque valeur de densité a un halo de la couleur du fond : le pointillé « auj. » et la courbe ne la coupent plus', () => {
    for (const w of [342, 1000]) {
      const html = svg(w);
      for (const v of ['1,058', '1,030', '1,016']) expect(etiquette(html, v), `${v} à ${w}`).toContain('paint-order="stroke"');
    }
  });
  it('le dernier relevé met sa valeur au-dessus de son point, jamais sur la courbe qui y arrive', () => {
    const html = svg(1000);
    const t = etiquette(html, '1,016');
    const y = Number(/ y="([\d.]+)"/.exec(t)![1]);
    const point = [...html.matchAll(/<circle[^>]* cy="([\d.]+)"[^>]* r="7"/g)].map(x => Number(x[1]));
    expect(point.length).toBe(1);
    expect(y).toBeLessThan(point[0] - 7);
  });
});

describe('CT4-B-9 : sans houblon, la courbe prend toute la largeur', () => {
  const rendu = (large: boolean) => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: large, media: q, addEventListener: () => undefined, removeEventListener: () => undefined }));
    const m = modeleFiche(lot(releves), NOW)!;
    return renderToStaticMarkup(<FicheFermentation m={m} verbe="levuré" reserve={[]} onAjoute={() => undefined} onAcces={() => undefined} onTache={() => undefined} />);
  };
  it('en 1280, aucune colonne de 23 rem n’est réservée aux cartes de houblon qui n’existent pas', () => {
    const html = rendu(true);
    expect(html).toContain('data-graphe');
    expect(html).not.toContain('23rem');
  });
});

describe('CT4-B-10 : un °C non relevé ne pose pas de pouce', () => {
  const etat = (over = {}) => ({ milli: 1016, temp: '', cuve: '', taper: false, saisie: '', erreur: '', ...over });
  const monter = (over: Record<string, unknown>, onChange = vi.fn()) => {
    const m = modeleFiche(lot(releves), NOW)!;
    const r = render(<PanneauMesure m={m} etat={etat(over)} onChange={onChange} />);
    return { ...r, onChange };
  };
  const champ = (c: HTMLElement, label: string) => c.querySelector(`[data-temp="${label}"]`) as HTMLElement;
  it('vide : le champ se marque « sans valeur » (pouce masqué)', () => {
    const { container } = monter({});
    expect(champ(container, 'Température de la cuve').hasAttribute('data-sans-valeur')).toBe(true);
    expect(champ(container, 'Température de l’échantillon').hasAttribute('data-sans-valeur')).toBe(true);
  });
  it('relevé : le pouce est là', () => {
    const { container } = monter({ cuve: '19,5' });
    expect(champ(container, 'Température de la cuve').hasAttribute('data-sans-valeur')).toBe(false);
    expect(champ(container, 'Température de l’échantillon').hasAttribute('data-sans-valeur')).toBe(true);
  });
  it('un toucher au départ (même position) pose la valeur choisie, sinon le geste ne ferait rien', () => {
    const { container, onChange } = monter({});
    const curseur = champ(container, 'Température de la cuve').querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.pointerUp(curseur);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ cuve: expect.stringMatching(/^\d+,\d$/) });
  });
});

describe('CT4-B-11 : la FG de la levure est le repère de la saisie quand la recette n’en écrit pas', () => {
  const sansFg = () => {
    const b = lot(releves);
    delete (b.recipeSnapshot as Record<string, unknown>).fgTarget;
    return b;
  };
  it('la plage de la levure vient du même calcul que la fiche recette (US-05 : 1,0xx–1,0xx)', () => {
    const b = lot(releves, { fgTarget: undefined, volumeL: 20, ogTarget: 1.064, efficiencyPct: 75, yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche' } });
    const plage = plageFgDeLaLevure(b);
    expect(plage).not.toBeNull();
    expect(plage![0]).toBeGreaterThan(1.005);
    expect(plage![1]).toBeLessThan(1.02);
    expect(plage![0]).toBeLessThanOrEqual(plage![1]);
  });
  it('sans levure connue : rien (l’inconnu n’est jamais inventé)', () => {
    expect(plageFgDeLaLevure(lot(releves, { fgTarget: undefined, yeast: undefined }))).toBeNull();
  });
  it('sans FG visée, la saisie dit la plage de la levure, plus « pas de FG visée »', () => {
    const m = modeleFiche(sansFg(), NOW)!;
    const html = renderToStaticMarkup(<PanneauMesure m={m} etat={{ milli: 1016, temp: '', cuve: '', taper: false, saisie: '', erreur: '' }} onChange={() => undefined} fgPlage={[1.012, 1.015]} />);
    expect(html).toContain('1,012–1,015');
    expect(html).toContain('plage de la levure');
    expect(html).not.toContain('pas de FG visée');
  });
  it('ni FG visée ni plage : le dit sans chiffre', () => {
    const m = modeleFiche(sansFg(), NOW)!;
    const html = renderToStaticMarkup(<PanneauMesure m={m} etat={{ milli: 1016, temp: '', cuve: '', taper: false, saisie: '', erreur: '' }} onChange={() => undefined} />);
    expect(html).toContain('pas de FG visée');
  });
});
