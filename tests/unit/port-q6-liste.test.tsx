// @vitest-environment jsdom
// q6 : corrections du port de la liste des brassins (e6a) et de sa feuille (e6c), défaut par défaut.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { batchEntries, DEFAULT_CATALOG_FILTERS } from '../../src/domain/productionCatalog';
import {
  CRITERES_VIDES,
  abvDe,
  abvFr,
  appliquer,
  bornesAlcool,
  carteModel,
  comptesSiRetire,
  criteresPoses,
  styleCourt,
  titreExclusion,
  type Contexte,
  type Criteres
} from '../../src/ui/production/liste/listeModel';
import { FeuilleFiltres } from '../../src/ui/production/liste/FeuilleFiltres';
import type { PeriodeEntree } from '../../src/components/periode/periode';
import type { Batch, KegItem } from '../../src/types';

afterEach(cleanup);

const NOW = new Date(2026, 10, 15, 12).getTime();
const lot = (id: string, extra: Partial<Batch> = {}): Batch =>
  ({
    id, name: `ZZ ${id}`, style: 'New England IPA', volumeL: 24, status: 'fermentation', brewDate: '2026-11-10', volumeBrewedL: 24,
    recipeSnapshot: { name: `ZZ ${id}`, style: extra.style ?? 'New England IPA', volumeL: 24, hops: [] }, ...extra
  }) as Batch;
const lots: Batch[] = [
  lot('N1', { og: '1,062', gravityLog: [{ date: '2026-11-13', sg: 1.018 }] as Batch['gravityLog'] }),
  lot('N2', { status: 'garde', style: 'Pilsner' }),
  lot('N3', { style: 'Stout', status: 'conditionne', bottlingDate: '2026-11-05', og: '1,060', fg: '1,015', abv: '6' as unknown as number, packaging: { bottles33: 30, bottles75: 0, kegIds: ['F-001'] } }),
  lot('N4', { status: 'planifie', style: 'American Pale Ale', plannedBrewDate: '2026-11-09', brewDate: undefined as unknown as string }),
  lot('N5', { status: 'termine', style: 'Saison', bottlingDate: '2026-02-01', brewDate: '2026-01-10' })
];
const entries = batchEntries(lots);
// m3r-a : la période est celle de l'application (l'en-tête), au départ « le mois » (novembre 2026 ici) ; `TOUTES` = « Toutes ».
const MOIS: PeriodeEntree = { genre: 'mois', annee: 2026, mois: 11 };
const TOUTES: PeriodeEntree = { genre: 'tout' };
const ctx = (criteres: Partial<Criteres> = {}, sort: Contexte['filtres']['sort'] = 'work', periode: PeriodeEntree = MOIS): Contexte => ({
  entries, criteres: { ...CRITERES_VIDES, ...criteres }, filtres: { ...DEFAULT_CATALOG_FILTERS, sort }, periode, now: NOW
});
const ids = (l: { id: string }[]) => l.map((e) => e.id);

describe('e6a : période de départ « le mois + les en cours »', () => {
  it('par défaut, le terminé de février est écarté, les brassins en cours jamais', () => {
    const r = ids(appliquer(ctx()));
    expect(r).not.toContain('N5');
    expect(r).toEqual(expect.arrayContaining(['N1', 'N2', 'N4']));
  });
  it('« Toutes » les rend tous ; ni l’un ni l’autre ne compte comme critère posé', () => {
    expect(ids(appliquer(ctx({}, 'work', TOUTES)))).toContain('N5');
    // La période se règle dans l'en-tête (ou la feuille, qui l'écrit là) : jamais un critère posé de la liste.
    expect(criteresPoses(CRITERES_VIDES, '')).toHaveLength(0);
    expect(criteresPoses({ ...CRITERES_VIDES, periode: { enCours: false } }, '')).toHaveLength(0);
  });
  it('la période de l’app juge la date : cette année garde février, « les en cours, toujours » reste réglable', () => {
    const annee: PeriodeEntree = { genre: 'annee', annee: 2026 };
    expect(ids(appliquer(ctx({}, 'work', annee)))).toContain('N5');
    const hiver: PeriodeEntree = { genre: 'dates', du: '2026-01-01', au: '2026-02-28' };
    expect(ids(appliquer(ctx({}, 'work', hiver)))).toEqual(expect.arrayContaining(['N1', 'N2', 'N4', 'N5']));
    expect(ids(appliquer(ctx({ periode: { enCours: false } }, 'work', hiver)))).toEqual(['N5']);
  });
});

describe('e6a : tri « À suivre d’abord »', () => {
  it('le planifié en retard passe avant la garde', () => {
    const r = ids(appliquer(ctx({}, 'work', TOUTES)));
    expect(r.indexOf('N4')).toBeLessThan(r.indexOf('N2'));
  });
});

describe('e6a : style abrégé, alcool à une décimale, fût', () => {
  it('sigles usuels ; un autre style reste tel quel', () => {
    expect(styleCourt('New England IPA')).toBe('NEIPA');
    expect(styleCourt('american pale ale')).toBe('APA');
    expect(styleCourt('Imperial IPA')).toBe('DIPA');
    expect(styleCourt('Pilsner')).toBe('Pilsner');
    expect(styleCourt('Berliner Weisse')).toBe('Berliner Weisse');
  });
  it('« 6,0 % », jamais « 6 % »', () => {
    expect(abvFr(6)).toBe('6,0');
    expect(abvFr(5.84)).toBe('5,8');
    const c = carteModel(entries.find((e) => e.id === 'N3')!, NOW);
    expect(c.cle).toMatch(/^\d,\d %$/);
  });
  it('fût : sa taille quand le stock la connaît, sinon « taille non notée »', () => {
    const e = entries.find((x) => x.id === 'N3')!;
    const f20: KegItem[] = [{ id: 'F-001', capacityL: 20, state: 'plein' } as KegItem];
    expect(carteModel(e, NOW, f20).cleUnite).toBe('30 × 33 cl · fût 20 L');
    expect(carteModel(e, NOW, []).cleUnite).toBe('30 × 33 cl · fût, taille non notée');
  });
});

describe('e6c : alcool provisoire d’un brassin en cuve', () => {
  it('même valeur que la fiche : OG et dernier relevé, marquée provisoire', () => {
    const a = abvDe(entries.find((e) => e.id === 'N1')!, NOW);
    expect(a?.provisoire).toBe(true);
    expect(a?.v).toBeGreaterThan(5.5);
    expect(a?.v).toBeLessThan(6.2);
    expect(abvDe(entries.find((e) => e.id === 'N2')!, NOW)).toBeUndefined();
  });
  it('sortie du décompte « sans valeur » ; étendue et bornes élargies d’un cran', () => {
    const b = bornesAlcool(ctx({}, 'work', TOUTES))!;
    const prov = b.points.find((p) => p.id === 'N1');
    expect(prov?.provisoire).toBe(true);
    expect(b.sansValeur).toBe(3);
    expect(b.etendue[0]).toBeLessThan(b.etendue[1]);
    expect(b.min).toBe(Math.floor(b.etendue[0]) - 1);
    expect(b.max).toBe(Math.ceil(b.etendue[1] + 0.5));
  });
});

describe('e6c : le panneau « Ces critères s’excluent »', () => {
  it('dit l’état du brassin filtré', () => {
    expect(titreExclusion(ctx({ styles: ['Stout'], avancement: ['cuve'] }))).toBe('Le Stout est conditionné : retire un critère');
  });
  it('retomber sur la phrase générale quand la cause n’est pas simple', () => {
    expect(titreExclusion(ctx({ avancement: ['cuve', 'termines'] }))).toBe('Ces critères s’excluent : retire-en un');
  });
  it('le critère qui rend le plus passe d’abord', () => {
    const r = comptesSiRetire(ctx({ styles: ['Stout'], avancement: ['cuve'] }, 'work', TOUTES));
    expect(r[0].critere.label).toBe('Stout');
    expect(r.map((x) => x.n)).toEqual([...r.map((x) => x.n)].sort((a, b) => b - a));
  });
});

describe('e6c : la feuille', () => {
  const rendu = (criteres: Partial<Criteres> = {}) =>
    render(
      <FeuilleFiltres
        open
        onClose={vi.fn()}
        ctx={ctx(criteres, 'work', TOUTES)}
        resultats={appliquer(ctx(criteres, 'work', TOUTES))}
        onCriteres={vi.fn()}
        onFiltres={vi.fn()}
        onToutEffacer={vi.fn()}
        onOuvrir={vi.fn()}
        couleursHoublon={{}}
        onBilan={vi.fn()}
      />
    );
  it('six tuiles d’avancement ; « Notes à compléter » se loge sous les autres critères', () => {
    rendu();
    expect(document.querySelectorAll('.lst-tile')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /Notes à compléter/ })).toBeNull();
  });
  it('la phrase nomme le filtre posé : « 2 en cuve, sur 5 »', () => {
    rendu({ avancement: ['cuve'] });
    expect(screen.getByText(/en cuve, sur 5/)).toBeTruthy();
  });
  it('les styles s’abrègent en puces', () => {
    rendu();
    expect(screen.getByRole('button', { name: /^NEIPA/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^APA/ })).toBeTruthy();
  });
  it('les analyses se rangent dans la feuille', () => {
    rendu();
    expect(screen.getByRole('button', { name: /analyses des brassins/ })).toBeTruthy();
  });
});
