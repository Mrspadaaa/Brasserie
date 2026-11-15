// @vitest-environment jsdom
// q3 (e3gb) : le carnet et le dossier d'un brassin en fermentation. Rangement par l'IA SIMULÉ (rangeurSimule) : aucun appel réel.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({ batches: [] as any[], writes: [] as any[] }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getBatches: () => store.batches,
  updateBatch: (b: any) => { store.writes.push(b.id); store.batches = store.batches.map(x => x.id === b.id ? { ...x, ...b } : x); }
} }));

import type { Batch } from '../../src/types';
import { avecEntree, avecEssai, construireFil, ecrireBlocs, essaiDe, lireBlocs, sansVrac, vracDe } from '../../src/ui/production/carnet/carnetModel';
import { RANGEMENT_IA_BRANCHE, brancherRangeur, rangeurSimule } from '../../src/ui/production/carnet/rangement';
import { useCarnet } from '../../src/ui/production/carnet/useCarnet';
import { DossierFil, lignesPlan, lignesTicket, rappelDryHop, titreStock } from '../../src/ui/production/carnet/DossierFil';

const NOW = Date.parse('2026-11-14T10:00:00+01:00');
const brasse = (over: Record<string, unknown> = {}): Batch => ({
  id: 'LOT-019', name: 'ZZ NEIPA', style: 'NEIPA', status: 'fermentation', volumeL: 24, og: '1,062', stockAccountingVersion: 1,
  brewDay: { pitchedAt: Date.parse('2026-11-09T18:00:00+01:00'), pitchTemperatureC: 19 },
  stockConsumption: { appliedAt: '2026-11-09T18:00:00Z', items: [], pendingItems: [{ stockItemRef: 'h-citra', quantity: 100, unit: 'g' }] },
  gravityLog: [{ date: '12.11.2026', sg: 1.03, tempC: 19.5, notes: 'Krausen haut' }],
  notesCreation: 'trouble, juteux, peu amer', notesTasting: '', notesBrewDay: '',
  recipeSnapshot: {
    volumeL: 24, fgTarget: 1.012,
    fermentables: [{ name: 'Pilsner', weightKg: 4.6, kind: 'grain', use: 'empatage' }],
    hops: [
      { name: 'Citra', alpha: 0, weightG: 10, stage: 'boil', timeMin: 60 },
      { name: 'Citra', alpha: 12.5, weightG: 100, stage: 'dryHop', dayOffset: 6 },
      { name: 'Mosaic', alpha: 0, weightG: 80, stage: 'dryHop', dayOffset: 6 }
    ],
    yeast: { name: 'Verdant IPA', qty: 1, unit: 'sachet' },
    mash: { steps: [{ name: 'Sacch.', tempC: 66, durationMin: 60 }] },
    fermentation: [{ kind: 'primaire', name: 'p', tempC: 19, days: 7 }, { kind: 'reposDiacetyle', name: 'r', tempC: 21, days: 3 }, { kind: 'garde', name: 'g', tempC: 2, days: 14 }]
  },
  ...over
} as unknown as Batch);

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); store.writes = []; store.batches = []; brancherRangeur(null); });
afterEach(() => { vi.useRealTimers(); brancherRangeur(null); Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); });

describe('notes en blocs, sans champ neuf', () => {
  it('relit ce qu\'il a écrit, à l\'octet', () => {
    for (const t of ['', 'texte ancien\nsur deux lignes', '14.11.2026 · Cuve : Krausen retombé\n14.11.2026 07:40 · Vrac : jeudi\nsuite\nProchain essai : 67 °C\nVerdict : à refaire']) {
      expect(ecrireBlocs(lireBlocs(t))).toBe(t);
    }
  });
  it('un texte ancien est une note en vrac sans date', () => {
    expect(vracDe({ notesTasting: 'goûté hier, très fruité' })).toEqual([{ texte: 'goûté hier, très fruité', date: null, heure: null }]);
  });
  it('ajouter une entrée garde le verdict et le texte ancien', () => {
    const t = avecEntree('ancien\nVerdict : à corriger', { type: 'cuve', date: '14.11.2026', texte: 'Krausen retombé' });
    expect(t).toContain('ancien');
    expect(t).toContain('14.11.2026 · Cuve : Krausen retombé');
    expect(t).toContain('Verdict : à corriger');
  });
  it('le prochain essai se remplace, se retire, et un vrac rangé disparaît seul', () => {
    const a = avecEssai('x', 'empâter à 67 °C');
    expect(essaiDe(a)).toBe('empâter à 67 °C');
    expect(essaiDe(avecEssai(a, ''))).toBeNull();
    expect(sansVrac('14.11.2026 07:40 · Vrac : jeudi\n14.11.2026 · Cuve : ok', ['jeudi'])).toBe('14.11.2026 · Cuve : ok');
  });
});

describe('le fil jour par jour', () => {
  it('pose J0, les relevés, aujourd\'hui, et le dry hop « demain » tant que des ajouts sont réservés', () => {
    const fil = construireFil(brasse({ notesTasting: '14.11.2026 07:40 · Vrac : jeudi' }), NOW, { vracEnPlace: true, enAttente: true });
    const parN = new Map(fil.map(f => [f.n, f]));
    expect(parN.get(0)!.puces.map(p => p.label)).toEqual(['OG', 'levuré']);
    expect(parN.get(3)!.puces.some(p => p.label === 'densité' && p.valeur === '1,030')).toBe(true);
    expect(parN.get(3)!.bulles[0]).toMatchObject({ type: 'cuve', texte: 'Krausen haut' });
    expect(parN.get(5)!.auj).toBe(true);
    expect(parN.get(5)!.vrac).toHaveLength(1);
    expect(parN.get(6)!.dryHop?.quand).toBe('demain');
    expect(parN.get(6)!.dryHop?.lignes.map(l => l.nom)).toEqual(['Citra', 'Mosaic']);
  });
  it('sans ajout réservé, aucun rappel de dry hop', () => {
    expect(construireFil(brasse(), NOW, { vracEnPlace: true, enAttente: false }).some(f => f.dryHop)).toBe(false);
  });
});

describe('le rangement (IA simulée)', () => {
  const avecVrac = () => {
    store.batches = [brasse({ notesTasting: '14.11.2026 07:40 · Vrac : jeudi krausen très haut, aujourd\'hui retombé' }), { id: 'LOT-015', name: 'ZZ Stout', style: 'Stout', status: 'conditionne', notesTasting: 'avant' }];
    const appliquees: any[] = [];
    const r = renderHook(() => useCarnet(store.batches[0], p => appliquees.push(p)));
    return { r, appliquees };
  };

  it('le drapeau est éteint, sans appel réel : Ranger le dit et la note reste en vrac', async () => {
    expect(RANGEMENT_IA_BRANCHE).toBe(false);
    const { r } = avecVrac();
    expect(store.writes).toEqual([]);
    await act(async () => { r.result.current.ranger(); });
    expect(r.result.current.message).toMatch(/pas encore branché/);
    expect(r.result.current.propositions).toBeNull();
    expect(store.writes).toEqual([]);
  });

  it('une proposition n\'écrit rien avant son geste ; Accepter les 5 range, envoie un morceau à la Stout ; Annuler restaure tout', async () => {
    brancherRangeur(rangeurSimule);
    const { r, appliquees } = avecVrac();
    const avant = store.batches[0].notesTasting;
    await act(async () => { r.result.current.ranger(); });
    expect(r.result.current.propositions).toHaveLength(6);
    expect(store.writes).toEqual([]);
    await act(async () => { r.result.current.accepterTous(); });
    const moi = store.batches[0], stout = store.batches[1];
    expect(r.result.current.fait).toMatchObject({ n: 5 });
    expect(r.result.current.fait!.autres).toHaveLength(1);
    expect(moi.notesTasting).toContain('Cuve : Krausen retombé');
    expect(essaiDe(moi.notesTasting)).toMatch(/67 °C/);
    expect(stout.notesTasting).toMatch(/avant[\s\S]*Dégustation : En bouteille/);
    // « Robinet » n'a pas de jour : il reste proposé, la note en vrac reste donc en place.
    expect(r.result.current.propositions).toHaveLength(1);
    expect(vracDe(moi)).toHaveLength(1);
    await act(async () => { r.result.current.annuler(); });
    expect(store.batches[0].notesTasting).toBe(avant);
    expect(store.batches[1].notesTasting).toBe('avant');
    expect(appliquees.length).toBeGreaterThan(0);
  });

  it('choisir le jour d\'un morceau le rend acceptable ; ✓ range un seul morceau', async () => {
    brancherRangeur(rangeurSimule);
    const { r } = avecVrac();
    await act(async () => { r.result.current.ranger(); });
    expect(r.result.current.propositions!.find(p => p.id === 'p2')!.jour).toBeNull();
    await act(async () => { r.result.current.accepter('p2'); });
    expect(store.writes).toEqual([]);
    await act(async () => { r.result.current.choisirJour('p2', '13.11.2026'); });
    await act(async () => { r.result.current.accepter('p2'); });
    expect(store.batches[0].notesTasting).toContain('13.11.2026 · Incident : Robinet');
    expect(r.result.current.propositions).toHaveLength(5);
  });

  it('hors ligne : la note reste intacte, en attente du réseau', async () => {
    brancherRangeur(rangeurSimule);
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { r } = avecVrac();
    const avant = store.batches[0].notesTasting;
    await act(async () => { r.result.current.ranger(); });
    expect(r.result.current.enAttente).toBe(true);
    expect(r.result.current.message).toMatch(/Hors ligne/);
    expect(store.writes).toEqual([]);
    expect(store.batches[0].notesTasting).toBe(avant);
  });

  it('Écrire pose une note en vrac datée, sans toucher au verdict', async () => {
    store.batches = [brasse({ notesTasting: 'Verdict : à refaire' })];
    const r = renderHook(() => useCarnet(store.batches[0], () => undefined));
    await act(async () => { r.result.current.poser('pellicule fine sur la bière'); });
    expect(store.batches[0].notesTasting).toMatch(/Verdict : à refaire\n14\.11\.2026 \d{2}:\d{2} · Vrac : pellicule fine/);
  });
});

describe('le dossier', () => {
  it('le titre répond à la question du stock', () => {
    expect(titreStock(brasse())).toBe('Tout est sorti du stock, sauf le dry hop.');
    expect(titreStock(brasse({ stockConsumption: { appliedAt: 'x', items: [], pendingItems: [] } }))).toBe('Tout est sorti du stock.');
    expect(titreStock(brasse({ stockAccountingVersion: 0 }))).toMatch(/à confirmer/);
  });
  it('le ticket dit « α non saisi » (jamais 0) et réserve les dry hops', () => {
    const l = lignesTicket(brasse());
    expect(l.find(x => x.cle === 'h0')).toMatchObject({ detail: 'α non saisi · 60′', etat: 'sorti' });
    expect(l.find(x => x.cle === 'h1')).toMatchObject({ detail: 'α 12,5 % · J+6', etat: 'reserve', quantite: '100 g' });
    expect(l.find(x => x.cle === 'y')!.quantite).toBe('1 sachet');
  });
  it('le plan : périodes J0 → J+n, garde « dès »', () => {
    expect(lignesPlan(brasse()).map(p => `${p.label} = ${p.valeur}`)).toEqual(['Fermentation · J0 → J+6 = 19 °C', 'Repos · J+7 → J+9 = 21 °C', 'Garde · dès J+10 = 2 °C']);
  });
  it('le rappel : demain, puis le jour J le geste « Dry hop ajouté »', () => {
    expect(rappelDryHop(brasse(), NOW)).toEqual({ texte: 'Demain · dry hop Citra 100 g + Mosaic 80 g · réservés', jour: false });
    expect(rappelDryHop(brasse(), NOW + 86400000)).toEqual({ texte: 'Dry hop ajouté · Citra 100 g + Mosaic 80 g', jour: true });
    expect(rappelDryHop(brasse({ stockConsumption: { appliedAt: 'x', items: [], pendingItems: [] } }), NOW)).toBeNull();
  });
  it('le rendu porte le titre, le ticket, « pas stable » et les gestes', () => {
    const html = renderToStaticMarkup(<DossierFil batch={brasse()} now={NOW} suivant="garde" options={[{ status: 'planifie', kind: 'back' }, { status: 'annule', kind: 'cancel' }]} blocage={null}
      onStatut={() => undefined} onSupprimer={() => undefined} budget={cls => <button className={cls}>Budget</button>} compagnon={<i />} />);
    for (const t of ['Tout est sorti du stock, sauf le dry hop.', 'Recette figée', 'α non saisi', 'FG visée', '1,010 à 1,014', 'Passer en garde', 'pas stable', 'Revenir · abandon', 'Budget', 'Compagnon', 'Supprimer le brassin']) expect(html).toContain(t);
  });
});
