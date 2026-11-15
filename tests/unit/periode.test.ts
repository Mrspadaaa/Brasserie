import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  bornes, comptesAnnee, dansPeriode, depuisPlageFinances, enPeriode, etiquetteCourte, jourSaisi, lire, pas, pourFinances, serialiser, titre,
  type Periode
} from '../../src/components/periode/periode';

const NOV = new Date(2026, 10, 15, 12);

describe('période de l’app (ET-PER) : le modèle', () => {
  it('relit les anciennes valeurs gardées sans perte', () => {
    expect(lire('this-month', NOV)).toEqual({ genre: 'mois', annee: 2026, mois: 11 });
    expect(lire('last-month', NOV)).toEqual({ genre: 'mois', annee: 2026, mois: 10 });
    expect(lire('q4', NOV)).toEqual({ genre: 'trimestre', annee: 2026, trimestre: 4 });
    expect(lire('year', NOV)).toEqual({ genre: 'annee', annee: 2026 });
    expect(lire('all', NOV)).toEqual({ genre: 'tout' });
    expect(lire('absurde', NOV)).toEqual({ genre: 'mois', annee: 2026, mois: 11 });
  });

  it('se garde en texte et se relit à l’identique, dates libres comprises', () => {
    const toutes: Periode[] = [
      { genre: 'tout' }, { genre: 'mois', annee: 2026, mois: 3 }, { genre: 'trimestre', annee: 2025, trimestre: 2 },
      { genre: 'annee', annee: 2026 }, { genre: 'dates', du: '2026-10-12', au: '2026-11-03' }
    ];
    for (const p of toutes) expect(lire(serialiser(p), NOV)).toEqual(p);
    expect(lire('range-2026-11-03_2026-10-12', NOV)).toEqual({ genre: 'mois', annee: 2026, mois: 11 });
  });

  it('une date est dans la période par son jour, dates suisses et ISO', () => {
    const t4: Periode = { genre: 'trimestre', annee: 2026, trimestre: 4 };
    expect(dansPeriode('31.12.2026', t4)).toBe(true);
    expect(dansPeriode('2026-09-30', t4)).toBe(false);
    expect(dansPeriode('01.10.2026', t4)).toBe(true);
    const libre: Periode = { genre: 'dates', du: '2026-10-12', au: '2026-11-03' };
    expect(dansPeriode('2026-10-11', libre)).toBe(false);
    expect(dansPeriode('03.11.2026', libre)).toBe(true);
    expect(dansPeriode('04.11.2026', libre)).toBe(false);
    expect(dansPeriode(undefined, libre)).toBe(false);
    expect(dansPeriode(undefined, { genre: 'tout' })).toBe(true);
    expect(bornes({ genre: 'mois', annee: 2028, mois: 2 }).au).toBe('2028-02-29');
  });

  it('les flèches font un pas : un mois, un trimestre, un exercice, en passant l’année', () => {
    expect(pas({ genre: 'mois', annee: 2026, mois: 1 }, -1)).toEqual({ genre: 'mois', annee: 2025, mois: 12 });
    expect(pas({ genre: 'mois', annee: 2026, mois: 12 }, 1)).toEqual({ genre: 'mois', annee: 2027, mois: 1 });
    expect(pas({ genre: 'trimestre', annee: 2026, trimestre: 1 }, -1)).toEqual({ genre: 'trimestre', annee: 2025, trimestre: 4 });
    expect(pas({ genre: 'annee', annee: 2026 }, 1)).toEqual({ genre: 'annee', annee: 2027 });
  });

  it('dit sa pastille et son titre', () => {
    expect(etiquetteCourte({ genre: 'mois', annee: 2026, mois: 11 })).toBe('Nov.');
    expect(etiquetteCourte({ genre: 'trimestre', annee: 2026, trimestre: 4 })).toBe('T4');
    expect(titre({ genre: 'trimestre', annee: 2026, trimestre: 1 })).toBe('1er trimestre 2026');
    expect(titre({ genre: 'mois', annee: 2026, mois: 11 })).toBe('Novembre 2026');
  });

  it('compte les écritures d’une année : une date illisible ou d’une autre année n’est comptée nulle part', () => {
    const c = comptesAnnee(['03.11.2026', '2026-11-20', '2026-10-01', '2025-11-02', undefined, 'n’importe quoi'], 2026);
    expect(c.mois[10]).toBe(2);
    expect(c.mois[9]).toBe(1);
    expect(c.trimestres).toEqual([0, 0, 0, 3]);
  });

  it('lit « jj.mm » avec l’année de la période, refuse une date qui n’existe pas', () => {
    expect(jourSaisi('12.10', 2026)).toBe('2026-10-12');
    expect(jourSaisi('3.11.2025', 2026)).toBe('2025-11-03');
    expect(jourSaisi('31.02', 2026)).toBeNull();
    expect(jourSaisi('abc', 2026)).toBeNull();
  });
});

describe('période de l’app (ET-PER) : Finances n’a plus de période à lui', () => {
  it('Finances reçoit ce que l’app a choisi, au mois, en plage ou « tout »', () => {
    expect(pourFinances({ genre: 'mois', annee: 2026, mois: 11 })).toMatchObject({ month: '2026-11', allDates: false, plage: null });
    expect(pourFinances({ genre: 'trimestre', annee: 2026, trimestre: 4 })).toMatchObject({ allDates: false, plage: { du: '2026-10', au: '2026-12' } });
    expect(pourFinances({ genre: 'tout' }).allDates).toBe(true);
  });

  it('ce que Finances choisit revient à l’app dans sa forme la plus parlante', () => {
    expect(depuisPlageFinances('2026-10', '2026-12')).toEqual({ genre: 'trimestre', annee: 2026, trimestre: 4 });
    expect(depuisPlageFinances('2026-01', '2026-12')).toEqual({ genre: 'annee', annee: 2026 });
    expect(depuisPlageFinances('2026-11', '2026-11')).toEqual({ genre: 'mois', annee: 2026, mois: 11 });
    expect(enPeriode(depuisPlageFinances('2026-09', '2026-11'))).toEqual({ genre: 'dates', du: '2026-09-01', au: '2026-11-30' });
  });

  /* Le contrôle qui échoue sur le tag de départ : deux sources indépendantes. Au départ, Finances gardait son mois dans un
     useState à lui et Brassins gardait un filtre de période à lui (30 j, 90 j, année, dates choisies). */
  it('aucun écran ne garde de période à lui (lecture du code)', () => {
    const finances = readFileSync('src/components/tabs/FinancesTab.tsx', 'utf8');
    expect(finances).not.toMatch(/useState\(todayISO\(\)\.slice\(0,\s*7\)\)/);
    expect(finances).not.toMatch(/setMonth|setAllDates|setPlage/);
    const toolbar = readFileSync('src/ui/production/CatalogToolbar.tsx', 'utf8');
    expect(toolbar).not.toMatch(/<option value="(30|90|year|custom)"/);
    const catalogue = readFileSync('src/ui/production/ProductionCatalog.tsx', 'utf8');
    expect(catalogue).toMatch(/from '\.\.\/\.\.\/components\/periode\/periode'/);
    const app = readFileSync('src/App.tsx', 'utf8');
    expect((app.match(/useState<Periode>/g) ?? []).length).toBe(1);
  });
});
