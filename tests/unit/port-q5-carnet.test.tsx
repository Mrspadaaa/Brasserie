// @vitest-environment jsdom
// q5 (e3gb n° 1, 2, 4) : pictos du dry hop, retour du rangement, puces « éch. » et « cuve ». Rendu statique, aucune écriture, aucun appel réel.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getBatches: () => [], updateBatch: () => undefined } }));

import type { Batch } from '../../src/types';
import { CarnetFil, CarnetPied } from '../../src/ui/production/carnet/CarnetFil';
import { famillesDuHoublon } from '../../src/ui/production/carnet/PictosHoublons';
import { construireFil } from '../../src/ui/production/carnet/carnetModel';
import type { CarnetControleur } from '../../src/ui/production/carnet/useCarnet';
import type { MorceauPropose } from '../../src/ui/production/carnet/rangement';

const NOW = Date.parse('2026-11-14T10:00:00+01:00');
const lot = (over: Record<string, unknown> = {}): Batch => ({
  id: 'ZZ-Q5', name: 'ZZ NEIPA', style: 'NEIPA', status: 'fermentation', volumeL: 24, og: '1,062', brewDate: '09.11.2026',
  brewDay: { pitchedAt: Date.parse('2026-11-09T18:00:00+01:00'), pitchTemperatureC: 19 },
  stockConsumption: { appliedAt: '2026-11-09T18:00:00Z', items: [], pendingItems: [{ stockItemRef: 'h-citra', quantity: 100, unit: 'g' }] },
  gravityLog: [
    { date: '12.11.2026', sg: 1.03, tempC: 19.5, notes: 'Cuve 19,2 °C\nKrausen haut' },
    { date: '13.11.2026', sg: 1.02, tempC: 19.1 }
  ],
  notesCreation: '', notesTasting: '', notesBrewDay: '',
  recipeSnapshot: { volumeL: 24, fermentables: [], hops: [
    { name: 'Citra', alpha: 0, weightG: 100, stage: 'dryHop', dayOffset: 6 },
    { name: 'Mosaic', alpha: 0, weightG: 80, stage: 'dryHop', dayOffset: 6 },
    { name: 'Houblon Maison ZZ', alpha: 0, weightG: 20, stage: 'dryHop', dayOffset: 6 }
  ], fermentation: [{ kind: 'primaire', name: 'p', tempC: 19, days: 7 }] },
  ...over
} as unknown as Batch);

const ctrl = (o: Partial<CarnetControleur> = {}): CarnetControleur => ({
  propositions: null, range: false, message: '', fait: null, composer: false, enAttente: true, enLigne: true, dictee: 'repos', aujourdhui: '14.11.2026',
  ranger: vi.fn(), accepter: vi.fn(), accepterTous: vi.fn(), laisserEnVrac: vi.fn(), corriger: vi.fn(), choisirJour: vi.fn(), annuler: vi.fn(),
  ouvrirComposer: vi.fn(), poser: vi.fn(), dicter: vi.fn(), ecrireVise: vi.fn(), ecrireEssai: vi.fn(), ...o
});
const SANS_JOUR: MorceauPropose = { id: 'p6', type: 'incident', texte: 'Fuite au robinet', jour: null };

describe('q5 e3gb n° 1 : pictos de familles sur le dry hop', () => {
  it('Citra : agrumes et tropicaux ; Mosaic : baies ; houblon hors catalogue : aucun picto', () => {
    expect(famillesDuHoublon(lot(), 'Citra').sort()).toEqual(['citrus', 'tropical']);
    expect(famillesDuHoublon(lot(), 'Mosaic')).toEqual(['berries']);
    expect(famillesDuHoublon(lot(), 'Houblon Maison ZZ')).toEqual([]);
    expect(famillesDuHoublon(lot(), 'Inconnu')).toEqual([]);
  });

  it('la ligne du fil les rend devant chaque nom, texte inchangé', () => {
    const html = renderToStaticMarkup(<CarnetFil batch={lot()} c={ctrl()} now={NOW} />);
    const ligne = html.slice(html.indexOf('data-dry-hop'), html.indexOf('data-dry-hop') + 2500);
    expect(ligne).toContain('data-famille="citrus"');
    expect(ligne).toContain('data-famille="berries"');
    expect(ligne.replace(/<[^>]+>/g, '')).toContain('Dry hop Citra 100 g + Mosaic 80 g + Houblon Maison ZZ 20 g');
  });
});

describe('q5 e3gb n° 2 : le retour du rangement, sans bouton mort', () => {
  const fait = { n: 5, autres: ['Stout · note'], note: '07:40' };

  it('geste : Accepter les N tant que des morceaux ont un jour', () => {
    const pied = renderToStaticMarkup(<CarnetPied c={ctrl({ propositions: [{ id: 'a', type: 'cuve', texte: 'x', jour: '14.11.2026' }, SANS_JOUR] })} />);
    expect(pied).toContain('Accepter les 1');
    expect(pied).toContain('Laisser en vrac');
  });

  it('après « Accepter les 5 » : pied « 5 rangés · 1 envoyé à la Stout » + Annuler ; ni « Accepter les 0 » ni bouton grisé', () => {
    const pied = renderToStaticMarkup(<CarnetPied c={ctrl({ propositions: [SANS_JOUR], fait })} />);
    expect(pied).toContain('5 rangés · 1 envoyé à la Stout');
    expect(pied).toContain('Annuler');
    expect(pied).not.toContain('Accepter les 0');
    expect(pied).not.toContain('disabled');
  });

  it('le titre devient « Carnet à jour » ; le morceau sans jour reste dans le fil, avec ses choix', () => {
    const html = renderToStaticMarkup(<CarnetFil batch={lot({ notesTasting: '14.11.2026 · Cuve : Krausen retombé' })} c={ctrl({ propositions: [SANS_JOUR], fait })} now={NOW} />);
    expect(html).toContain('Carnet à jour');
    expect(html).not.toContain('à placer');
    expect(html).toContain('data-etat="rangement"');
    expect(html).toContain('rangés depuis ta note de 07:40');
    expect(html).toContain('Fuite au robinet');
    expect(html).toContain('aria-label="Quel jour ?"');
  });

  it('geste en cours : « n morceaux à placer » en taille réduite (une ligne à 390)', () => {
    const html = renderToStaticMarkup(<CarnetFil batch={lot()} c={ctrl({ propositions: [{ id: 'a', type: 'cuve', texte: 'x', jour: '14.11.2026' }, SANS_JOUR] })} now={NOW} />);
    expect(html).toContain('2 morceaux à placer');
    expect(html).toContain('text-xl');
    expect(html).toContain('data-etat="geste"');
  });
});

describe('q5 e3gb n° 4 : un nom par mesure', () => {
  it('le relevé dit « éch. » pour l\'échantillon et « cuve » pour la cuve ; la bulle ne montre pas la ligne de cuve', () => {
    const fil = construireFil(lot(), NOW, { vracEnPlace: true, enAttente: true, props: [] });
    const j3 = fil.find(f => f.n === 3)!;
    expect(j3.puces).toEqual(expect.arrayContaining([{ label: 'éch.', valeur: '19,5 °C' }, { label: 'cuve', valeur: '19,2 °C' }]));
    expect(j3.bulles.map(b => b.texte)).toEqual(['Krausen haut']);
    const j4 = fil.find(f => f.n === 4)!;
    expect(j4.puces.map(p => p.label)).toContain('éch.');
    expect(j4.puces.map(p => p.label)).not.toContain('cuve');
  });
});
