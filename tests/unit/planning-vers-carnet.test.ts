import { describe, expect, it } from 'vitest';
import taches from '../../scripts/planning-vers-carnet/fixture-planning.json';
import { carnetDeTache, dateDuPlanning, idCarnetPlanning, idMessagePlanning, planMigration, type TachePlanning } from '../../scripts/planning-vers-carnet/correspondance';
import { iconesIdees } from '../../src/domain/calendrier';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { planEtats } from '../../scripts/planning-vers-carnet/etats';
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
    expect(sol.carnet.criteres.map(k => k.texte)).toEqual(['Budget du Planning : 3 500 CHF']);
    expect(sol.carnet.notes).toEqual([expect.objectContaining({ texte: 'À faire du 08.12.2025 au 21.12.2025 (Planning, Structure)', genre: 'a-faire' })]);
    expect(sol.date).toBe('2025-12-08');
  });

  it('lit la date mal formée de « Frigo + congel » ; en cours le 20.11, son idée prend la semaine courante (critique n° 1)', () => {
    const frigo = carnetDeTache(fixture.find(t => t.id === 'T-13')!, LE);
    expect(frigo.dates).toBe('À faire du 01.08.2026 au 01.05.2027 (Planning, Équipements)');
    expect(frigo.date).toBe('2026-11-16');
    expect(carnetDeTache(fixture.find(t => t.id === 'T-19')!, LE).date).toBe('2026-11-16');
    expect(carnetDeTache(fixture.find(t => t.id === 'T-20')!, LE).date).toBe('2027-04-26');
    expect(carnetDeTache(fixture.find(t => t.id === 'T-6')!, LE).date).toBe('2025-12-08');
  });

  it('range les idées dans l’ordre du Planning (ids à deux chiffres, n° 4) et date la création de l’étape, pas la migration (n° 9)', () => {
    const docs = planMigration(fixture.map(t => ({ ...t, creeLe: '2026-09-03T11:40:33.460190Z' })), new Set(), LE).aEcrire.flatMap(c => c.docs);
    const ids = lireCarnets(docs).map(c => c.id).sort();
    expect(ids[0]).toBe('CARNET-PLANNING-T-06');
    expect(ids.slice(-2)).toEqual(['CARNET-PLANNING-T-23', 'CARNET-PLANNING-T-24']);
    expect(lireCarnets(docs).every(c => c.carnet.creeLe === '2026-09-03T11:40:33.460190Z')).toBe(true);
  });

  it('porte les deux jalons sans date ni budget', () => {
    const jalons = planMigration(fixture, new Set(), LE).aEcrire.filter(c => c.jalon);
    expect(jalons.map(c => c.titre)).toEqual(['Jalon — Peut brasser au local (sans autorisation vente)', 'Jalon — Conformité complète — Peut vendre officiellement']);
    for (const j of jalons) {
      const c = lireCarnet(j.docs.find(d => d.type === 'carnet'))!;
      expect(c.date).toBeUndefined();
      expect(c.carnet.criteres).toEqual([]);
      expect(c.carnet.notes.map(n => [n.texte, n.genre])).toEqual([['Jalon du Planning, sans date', 'note']]);
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

  it('pose ses états du 20.11 : 1 à 5 archivées, 6 en cours, 7 à 11 pas encore faites ; dates inchangées ; relancé, rien', () => {
    const docs = planMigration(fixture, new Set(), LE).aEcrire.flatMap(c => c.docs);
    const plan = planEtats(docs, LE);
    expect(plan.absents).toEqual([]);
    const apres = appliquerEcritures(docs, plan.ecritures);
    const c = (t: string) => lireCarnet(apres.find(d => d.id === idCarnetPlanning(t)))!;
    expect(['T-6', 'T-7', 'T-8', 'T-9', 'T-10'].every(t => c(t).carnet.archive?.raison === 'Fait (réponse du brasseur, 20.11)')).toBe(true);
    expect(c('T-11').carnet.archive).toBeUndefined();
    expect(c('T-11').carnet.notes.map(n => n.texte)).toContain('En cours au 20.11.2026');
    expect(['T-12', 'T-14', 'T-16', 'T-17', 'T-18'].every(t => c(t).carnet.notes.some(n => n.texte === 'Pas encore fait au 20.11.2026'))).toBe(true);
    expect(c('T-13').carnet.notes).toHaveLength(1);
    for (const t of fixture) expect(c(t.id).date, t.id).toBe(lireCarnet(docs.find(d => d.id === idCarnetPlanning(t.id)))!.date);
    expect(lireCarnets(apres)).toHaveLength(14);
    const relance = planEtats(apres, LE);
    expect(relance.ecritures).toEqual([]);
    expect(relance.dejaFait).toHaveLength(11);
  });

  it('pose au Calendrier les 17 étapes datées, chacune à la semaine de son début, par le lien existant du Carnet (R48)', () => {
    const docs = planMigration(fixture, new Set(), LE).aEcrire.flatMap(c => c.docs);
    const icones = iconesIdees(docs);
    expect(icones).toHaveLength(17);
    expect(icones.every(i => i.genre === 'idee' && i.ouvre?.ecran === 'carnets')).toBe(true);
    expect(icones.find(i => i.titre === 'Frigo + congel')?.lundi).toBe('2026-11-16');
    expect(icones.find(i => i.titre.startsWith('Embouteillage'))?.lundi).toBe('2027-04-26');
    expect(icones.some(i => i.titre.startsWith('Jalon'))).toBe(false);
  });
});
