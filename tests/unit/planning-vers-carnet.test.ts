import { describe, expect, it } from 'vitest';
import taches from '../../scripts/planning-vers-carnet/fixture-planning.json';
import { carnetDeTache, dateDuPlanning, idCarnetPlanning, idMessagePlanning, planMigration, type TachePlanning } from '../../scripts/planning-vers-carnet/correspondance';
import { filDe, lireCarnet, lireCarnets, lireMessage } from '../../src/domain/carnets/modele';

const LE = '2026-11-20T12:00:00.000Z';
const fixture = taches as TachePlanning[];

describe('Planning → Carnet (20.11)', () => {
  it('lit les dates du Planning, mal formées comprises, et refuse l’invalide', () => {
    expect(dateDuPlanning('08.12.2025')).toBe('2025-12-08');
    expect(dateDuPlanning('01,08,2026')).toBe('2026-08-01');
    expect(dateDuPlanning('1,05,2027')).toBe('2027-05-01');
    expect(dateDuPlanning('')).toBeNull();
    expect(dateDuPlanning('31.02.2026')).toBeNull();
    expect(dateDuPlanning('demain')).toBeNull();
  });

  it('porte les 19 étapes en 19 idées lisibles par le Carnet, avec leur message', () => {
    const plan = planMigration(fixture, new Set(), LE);
    expect(plan.aEcrire).toHaveLength(19);
    expect(plan.conflits).toEqual([]);
    const docs = plan.aEcrire.flatMap(c => c.docs);
    expect(docs).toHaveLength(38);
    const carnets = lireCarnets(docs);
    expect(carnets).toHaveLength(19);
    expect(carnets.every(c => c.status === 'idea' && !c.carnet.archive)).toBe(true);
    for (const t of fixture) {
      const c = lireCarnet(docs.find(d => d.id === idCarnetPlanning(t.id)));
      const m = lireMessage(docs.find(d => d.id === idMessagePlanning(t.id)));
      expect(c, t.id).not.toBeNull();
      expect(m?.carnetMessage.rangement).toBe('locale');
      expect(filDe(docs, c!.id).map(e => e.message.id)).toEqual([idMessagePlanning(t.id)]);
    }
  });

  it('garde le coût en budget prévu (total 12 380 CHF), jamais 0 pour un jalon', () => {
    const plan = planMigration(fixture, new Set(), LE);
    const budgets = plan.aEcrire.map(c => c.budget).filter((b): b is string => !!b);
    expect(budgets).toHaveLength(17);
    expect(budgets.reduce((s, b) => s + Number(b.replace(/[^\d]/g, '')), 0)).toBe(12380);
    const sol = lireCarnet(plan.aEcrire.find(c => c.tacheId === 'T-6')!.docs.find(d => d.type === 'carnet'))!;
    expect(sol.title).toBe('Sol, murs & évacuation (béton, revêtement, peinture food-safe)');
    expect(sol.carnet.criteres.map(k => k.texte)).toEqual(['Budget prévu : 3 500 CHF']);
    expect(sol.carnet.notes).toEqual([expect.objectContaining({ texte: 'À faire du 08.12.2025 au 21.12.2025 (Planning, Structure)', genre: 'a-faire' })]);
    expect(sol.date).toBe('2025-12-08');
  });

  it('lit la date mal formée de « Frigo + congel » et pose l’idée au lundi de son début', () => {
    const frigo = carnetDeTache(fixture.find(t => t.id === 'T-13')!, LE);
    expect(frigo.dates).toBe('À faire du 01.08.2026 au 01.05.2027 (Planning, Équipements)');
    expect(frigo.date).toBe('2026-07-27');
  });

  it('porte les deux jalons sans date ni budget', () => {
    const jalons = planMigration(fixture, new Set(), LE).aEcrire.filter(c => c.jalon);
    expect(jalons.map(c => c.titre)).toEqual(['Jalon — Peut brasser au local (sans autorisation vente)', 'Jalon — Conformité complète — Peut vendre officiellement']);
    for (const j of jalons) {
      const c = lireCarnet(j.docs.find(d => d.type === 'carnet'))!;
      expect(c.date).toBeUndefined();
      expect(c.carnet.criteres).toEqual([]);
      expect(c.carnet.notes.map(n => n.texte)).toEqual(['Jalon du Planning, sans date prévue']);
    }
  });

  it('archive une étape faite', () => {
    const c = carnetDeTache({ ...fixture[0], completed: true }, LE);
    expect(lireCarnet(c.docs.find(d => d.type === 'carnet'))!.carnet.archive).toEqual({ le: LE, raison: 'Fait au Planning' });
  });

  it('est idempotent : relancé, rien n’est réécrit ; un id seul est un conflit', () => {
    const tous = new Set(fixture.flatMap(t => [idCarnetPlanning(t.id), idMessagePlanning(t.id)]));
    const relance = planMigration(fixture, tous, LE);
    expect(relance.aEcrire).toEqual([]);
    expect(relance.dejaLa).toHaveLength(19);
    const moitie = planMigration(fixture.slice(0, 1), new Set([idCarnetPlanning('T-6')]), LE);
    expect(moitie.conflits).toEqual(['T-6']);
    expect(moitie.aEcrire).toEqual([]);
  });
});
