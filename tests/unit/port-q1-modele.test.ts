import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { bornesMesure, construireReleve, jourAjout, modeleFiche, phasesDe, releveDepuisEtat, titreReponse, varieteDe } from '../../src/ui/production/fermentation/modele';

// Jeudi 14.11.2026 à midi (Zurich) : J+5 si la levure date du 09.11.
const NOW = Date.UTC(2026, 10, 14, 11, 0, 0);
const PITCH = Date.UTC(2026, 10, 9, 11, 0, 0);

const batch = (sur: Partial<Batch> = {}, hops: unknown[] | null = null): Batch => ({
  id: 'ZZ-001', name: 'NEIPA', style: 'NEIPA', status: 'fermentation', volumeL: 24, brewDate: '09.11.2026', og: '1,062', fg: '',
  brewDay: { pitchedAt: PITCH, steps: [], currentIndex: 0 },
  gravityLog: [{ date: '2026-11-12', sg: 1.03 }, { date: '2026-11-13', sg: 1.018, tempC: 19.1 }],
  recipeSnapshot: {
    fgTarget: 1.012,
    fermentation: [
      { kind: 'primaire', days: 7, tempC: 19 }, { kind: 'reposDiacetyle', days: 3, tempC: 21 }, { kind: 'garde', days: 1, tempC: 2 }
    ],
    hops: hops ?? [
      { name: 'Citra', weightG: 100, alpha: 0, stage: 'dryHop', dayOffset: 6 },
      { name: 'Mosaic', weightG: 80, alpha: 0, stage: 'dryHop', dayOffset: 6 }
    ]
  },
  ...sur
} as unknown as Batch);

describe('port q1 : modèle de la fiche en fermentation (gfc)', () => {
  it('J+n, départ, points DO et relevés, bande FG', () => {
    const m = modeleFiche(batch(), NOW)!;
    expect(m.n).toBe(5);
    expect(m.depart).toBe('09.11.2026');
    expect(m.points.map(p => [p.jour, p.sg])).toEqual([[0, 1.062], [3, 1.03], [4, 1.018]]);
    expect(m.points[2].tempC).toBe(19.1);
    expect(m.points[1].tempC).toBeUndefined();
    expect(m.fg).toEqual([1.01, 1.014]);
    expect(m.fgConfirmee).toBe(false);
  });

  it('atténuation et alcool provisoires, jamais 0 quand rien n’est mesuré', () => {
    const m = modeleFiche(batch(), NOW)!;
    expect(m.attenuation).toBe(71);
    expect(m.alcool).not.toBeNull();
    const vide = modeleFiche(batch({ og: '', gravityLog: [] }), NOW)!;
    expect(vide.attenuation).toBeNull();
    expect(vide.alcool).toBeNull();
    expect(vide.dernier).toBeNull();
  });

  it('phases et tâches tirées de la recette (7 j à 19 °C, 3 j à 21 °C, 1 j à 2 °C)', () => {
    const phases = phasesDe(batch());
    expect(phases.map(p => [p.de, p.a, p.tempC])).toEqual([[0, 7, 19], [7, 10, 21], [10, 11, 2]]);
    expect(phases.map(p => p.ton)).toEqual(['hop', 'attention', 'water']);
    const m = modeleFiche(batch(), NOW)!;
    expect(m.taches.map(t => [t.jour, t.titre])).toEqual([[7, 'Cuve à 21 °C'], [10, 'Garde 2 °C si stable']]);
    expect(m.taches[0].date).toBe('16.11');
  });

  it('le jour du dry hop vient de la recette ; sans lui, « jour à fixer »', () => {
    const m = modeleFiche(batch(), NOW)!;
    expect(m.houblons.map(h => [h.nom, h.doseG, h.jour])).toEqual([['Citra', 100, 6], ['Mosaic', 80, 6]]);
    expect(titreReponse(m).repos).toBe('Dry hop demain');
    const sans = modeleFiche(batch({}, [{ name: 'Citra', weightG: 100, alpha: 0, stage: 'dryHop' }]), NOW)!;
    expect(sans.houblons[0].jour).toBeNull();
    expect(titreReponse(sans).repos).toBe('Dry hop : jour à fixer');
  });

  it('familles du catalogue : Citra agrumes et tropicaux pleins, Mosaic baies ; α du lot absent = null', () => {
    const [citra, mosaic] = modeleFiche(batch(), NOW)!.houblons;
    expect(citra.associe).toBe(true);
    expect(citra.alpha).toBeNull();
    expect(citra.plage).toEqual([10, 15]);
    expect(citra.familles.slice(0, 2).map(f => f.id).sort()).toEqual(['citrus', 'tropical']);
    expect(citra.familles.find(f => f.id === 'citrus')).toMatchObject({ sources: 7, sur: 7 });
    expect(mosaic.familles.map(f => f.id)).toContain('berries');
    expect(mosaic.signature).toBe('berries');
  });

  it('variété hors catalogue : dite telle quelle, sans famille ni plage', () => {
    const h = modeleFiche(batch({}, [{ name: 'Houblon Maison ZZ', weightG: 50, alpha: 7.5, stage: 'dryHop', dayOffset: 4 }]), NOW)!.houblons[0];
    expect(h.associe).toBe(false);
    expect(h.familles).toEqual([]);
    expect(h.plage).toBeNull();
    expect(h.role).toBeNull();
    expect(h.alpha).toBe(7.5);
    expect(varieteDe({ name: 'Houblon Maison ZZ' })).toBeNull();
  });

  it('ajouts : réservés à faire, puis faits ; le titre suit', () => {
    const pendant = batch({ stockConsumption: { appliedAt: 'x', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [{ stockItemRef: 'S1', quantity: 180, unit: 'g' }] } } as Partial<Batch>);
    const m = modeleFiche(pendant, NOW)!;
    expect(m.ajoutsAFaire).toBe(true);
    expect(m.ajoutsFaits).toBe(false);
    const fait = modeleFiche(batch({ stockConsumption: { appliedAt: 'x', eventId: 'e', completedStages: ['brewday', 'remaining'], items: [], pendingItems: [] } } as Partial<Batch>), NOW)!;
    expect(fait.ajoutsFaits).toBe(true);
    expect(titreReponse(fait).repos).toBe('Dry hop ajouté');
  });

  it('jour du déstockage : lu dans les mouvements du lot, sinon rien', () => {
    const mv = [{ id: 'BREW-STOCK-ZZ-001-remaining-S1', timestamp: new Date(NOW).toISOString() }, { id: 'BREW-STOCK-ZZ-002-remaining-S1', timestamp: '2026-01-01T10:00:00Z' }];
    expect(jourAjout(mv, { id: 'ZZ-001' }, '09.11.2026')).toEqual({ jour: 5, date: '14.11' });
    expect(jourAjout(mv, { id: 'ZZ-009' }, '09.11.2026')).toBeNull();
  });

  it('pas de date de départ : pas de fiche (null, jamais un J+0)', () => {
    expect(modeleFiche(batch({ brewDate: '', brewDay: undefined }), NOW)).toBeNull();
  });

  it('Mesurer : bornes, validation de la densité et de la température facultative', () => {
    const m = modeleFiche(batch(), NOW)!;
    expect(bornesMesure(m)).toEqual([1000, 1070]);
    expect(construireReleve(1016, '', '2026-11-14')).toEqual({ reading: { date: '2026-11-14', sg: 1.016 } });
    expect(construireReleve(1016, '19,5', '2026-11-14')).toEqual({ reading: { date: '2026-11-14', sg: 1.016, tempC: 19.5 } });
    expect(construireReleve(1016, 'abc', '2026-11-14')).toHaveProperty('erreur');
    expect(construireReleve(1016, '80', '2026-11-14')).toHaveProperty('erreur');
    expect(construireReleve(800, '', '2026-11-14')).toHaveProperty('erreur');
    const etat = { milli: 1010, temp: '', taper: true, saisie: '1,016', erreur: '' };
    expect(releveDepuisEtat(etat, '2026-11-14')).toEqual({ reading: { date: '2026-11-14', sg: 1.016 } });
    expect(releveDepuisEtat({ ...etat, saisie: 'xx' }, '2026-11-14')).toHaveProperty('erreur');
  });
});
