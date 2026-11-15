// @vitest-environment jsdom
// Port de la liste des brassins (e6a) et de sa feuille de filtres (e6c) : règles du modèle et rendu de la liste.
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { batchEntries, DEFAULT_CATALOG_FILTERS, type CatalogFilters } from '../../src/domain/productionCatalog';
import {
  CRITERES_VIDES,
  appliquer,
  bornesAlcool,
  carteModel,
  comptesAvancement,
  comptesChamp,
  comptesSiRetire,
  jjmm,
  phraseListe,
  restaurerCriteres,
  type Contexte,
  type Criteres
} from '../../src/ui/production/liste/listeModel';
import { ListeBrassins } from '../../src/ui/production/liste/ListeBrassins';
import type { Batch } from '../../src/types';

afterEach(cleanup);

const NOW = new Date(2026, 10, 15, 12).getTime();
const lot = (id: string, extra: Partial<Batch> = {}): Batch =>
  ({
    id,
    name: `ZZ ${id}`,
    style: 'IPA',
    volumeL: 24,
    status: 'fermentation',
    brewDate: '2026-11-10',
    volumeBrewedL: 24,
    recipeSnapshot: { name: `ZZ ${id}`, style: extra.style ?? 'IPA', volumeL: 24, hops: [] },
    ...extra
  }) as Batch;

// Deux IPA en cuve, un Stout conditionné, un planifié en retard, un en cuve sans relevé.
const lots: Batch[] = [
  lot('Z1', { og: '1,060', gravityLog: [{ date: '2026-11-11', sg: 1.02 }, { date: '2026-11-13', sg: 1.0195 }] as Batch['gravityLog'] }),
  lot('Z2', { status: 'garde' }),
  lot('Z3', { style: 'Stout', status: 'conditionne', bottlingDate: '2026-11-05', og: '1,060', fg: '1,015', volumePackagedL: 20, packaging: { bottles33: 30 } as Batch['packaging'] }),
  lot('Z4', { status: 'planifie', plannedBrewDate: '2026-11-10', brewDate: undefined as unknown as string }),
  lot('Z5', { status: 'termine', style: 'Pilsner', bottlingDate: '2026-02-01', brewDate: '2026-01-10' })
];
const entries = batchEntries(lots);
const ctx = (criteres: Partial<Criteres> = {}, search = ''): Contexte => ({
  entries,
  criteres: { ...CRITERES_VIDES, periode: TOUTES, ...criteres },
  filtres: { ...DEFAULT_CATALOG_FILTERS, search },
  now: NOW
});
// q6 : la période de départ est « le mois + les en cours » ; ces tests de q2 jugent la liste entière (« Toutes »).
const TOUTES = { mode: 'toutes' as const, de: '', a: '', enCours: true };
const ids = (l: { id: string }[]) => l.map((e) => e.id).sort();

describe('comptes à facettes (e6c)', () => {
  it('Stout + En cuve s’excluent : zéro ; retirer l’un rend l’autre', () => {
    const c = ctx({ styles: ['Stout'], avancement: ['cuve'] });
    expect(appliquer(c)).toHaveLength(0);
    const si = comptesSiRetire(c);
    expect(si.find((x) => x.critere.label === 'Stout')?.n).toBe(2);
    expect(si.find((x) => x.critere.label === 'En cuve')?.n).toBe(1);
  });
  it('le compte d’une puce ignore son propre groupe mais garde les autres', () => {
    const n = comptesAvancement(ctx({ styles: ['IPA'] }));
    expect(n.cuve).toBe(2);
    expect(n.conditionnes).toBe(0);
    expect(n.brasser).toBe(1);
  });
  it('un style n’est compté que sur les autres critères', () => {
    const styles = comptesChamp(ctx({ avancement: ['cuve'] }), 'style');
    expect(styles.find((s) => s.valeur === 'IPA')?.n).toBe(2);
    expect(styles.find((s) => s.valeur === 'Stout')?.n).toBe(0);
  });
  it('OU dans un groupe, ET entre groupes', () => {
    expect(ids(appliquer(ctx({ avancement: ['cuve', 'brasser'] })))).toEqual(['Z1', 'Z2', 'Z4']);
    expect(ids(appliquer(ctx({ avancement: ['cuve', 'brasser'], styles: ['IPA'] })))).toEqual(['Z1', 'Z2', 'Z4']);
    expect(ids(appliquer(ctx({ avancement: ['conditionnes', 'termines'], styles: ['Stout'] })))).toEqual(['Z3']);
  });
});

describe('période et alcool', () => {
  it('« Les en cuve, toujours » : un brassin en cours passe une période étroite', () => {
    const p = { mode: 'dates' as const, de: '2026-01-01', a: '2026-02-28', enCours: true };
    expect(ids(appliquer(ctx({ periode: p })))).toEqual(['Z1', 'Z2', 'Z4', 'Z5']);
    expect(ids(appliquer(ctx({ periode: { ...p, enCours: false } })))).toEqual(['Z5']);
  });
  it('la plage d’alcool écarte ce qui n’a pas de valeur (jamais 0)', () => {
    const b = bornesAlcool(ctx());
    // q6 : Z1, en cuve avec relevés, compte avec sa valeur provisoire (en pointillé) ; Z2, Z4, Z5 restent sans valeur.
    expect(b?.points.map((p) => p.id).sort()).toEqual(['Z1', 'Z3']);
    expect(b?.sansValeur).toBe(3);
    const r = appliquer(ctx({ alcool: [5, 7] }));
    expect(ids(r)).toEqual(expect.arrayContaining(['Z3']));
    expect(ids(r)).not.toContain('Z2');
  });
  it('restaure des critères mal formés sans casser', () => {
    const c = restaurerCriteres({ avancement: ['cuve', 'nimporte'], styles: [3, 'IPA'], alcool: ['a', 2], periode: { mode: 'x' } });
    expect(c.avancement).toEqual(['cuve']);
    expect(c.styles).toEqual(['IPA']);
    expect(c.alcool).toBeUndefined();
    expect(c.periode.mode).toBe('mois');
    expect(c.periode.enCours).toBe(true);
  });
});

describe('phrase de tête (e6a)', () => {
  it('au repos : ce qui est en cuve et à brasser, et le total', () => {
    const c = ctx();
    const p = phraseListe(c, appliquer(c));
    expect(p.lignes.map((l) => l.texte)).toEqual(['2 en cuve', '1 à brasser']);
    expect(p.compteurN).toBe('5');
  });
  it('filtrée : le nombre et « sur N »', () => {
    const c = ctx({ avancement: ['cuve'] });
    const p = phraseListe(c, appliquer(c));
    expect(p.lignes[0].texte).toBe('2 en cuve');
    expect(p.compteurLabel).toBe('sur 5');
  });
  it('zéro avec une recherche : « Rien pour » et la recherche', () => {
    const c = ctx({}, 'Galaxy');
    const p = phraseListe(c, appliquer(c));
    expect(p.lignes.map((l) => l.texte)).toEqual(['Rien pour', '« Galaxy »']);
    expect(p.compteurN).toBe('0');
  });
});

describe('carte (e6a)', () => {
  const carte = (id: string) => carteModel(entries.find((e) => e.id === id)!, NOW);
  it('un planifié dont la date est passée : en retard, bouton Brasser', () => {
    const c = carte('Z4');
    expect(c.ton).toBe('retard');
    expect(c.pastille).toBe('En retard · 5 j');
    expect(c.ou).toBe('prévue le 10.11');
    expect(c.action).toMatchObject({ label: 'Brasser', brew: true });
  });
  it('en cuve sans relevé : « — » et « aucun relevé », jamais 0', () => {
    const c = carte('Z2');
    expect(c.cle).toBe('—');
    expect(c.cleUnite).toContain('aucun relevé');
    expect(c.cleUnite).toContain('J+5');
  });
  it('densité stable : FG à confirmer', () => {
    const c = carte('Z1');
    expect(c.cle).toBe('1,020');
    expect(c.cleUnite).toContain('stable');
    expect(c.action.label).toBe('Confirmer FG');
  });
  it('conditionné : alcool, embouteillage, jour.mois ; action Déguster sans note', () => {
    const c = carte('Z3');
    expect(c.ou).toBe('05.11');
    expect(c.cle).toMatch(/ %$/);
    expect(c.cleUnite).toBe('30 × 33 cl');
    expect(c.action).toMatchObject({ label: 'Déguster', section: 'tasting' });
  });
  it('jjmm lit les deux formats de date', () => {
    expect(jjmm('2026-11-05')).toBe('05.11');
    expect(jjmm('05.11.2026')).toBe('05.11');
    expect(jjmm(undefined)).toBe('');
  });
});

function Banc({ search = '', toutes = true }: { search?: string; toutes?: boolean }) {
  const [criteres, setCriteres] = useState<Criteres>(toutes ? { ...CRITERES_VIDES, periode: TOUTES } : CRITERES_VIDES);
  const [filtres, setFiltres] = useState<CatalogFilters>({ ...DEFAULT_CATALOG_FILTERS, search });
  return (
    <ListeBrassins
      entries={entries}
      filtres={filtres}
      onFiltres={setFiltres}
      criteres={criteres}
      onCriteres={setCriteres}
      appPeriode="all"
      now={NOW}
      onOpenBatch={vi.fn()}
      onBrew={vi.fn()}
      onFavorite={vi.fn()}
      onArchive={vi.fn()}
      onBilan={vi.fn()}
    />
  );
}

describe('rendu de la liste', () => {
  it('au repos : les cinq cartes, la phrase, les puces', () => {
    render(<Banc />);
    expect(screen.getByRole('group', { name: 'Avancement' })).toBeTruthy();
    expect(screen.getAllByText(/ZZ Z[1-5]/).length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText('2 en cuve')).toBeTruthy();
  });
  it('geste : une puce posée filtre, Tout effacer la retire', () => {
    render(<Banc />);
    fireEvent.click(screen.getByRole('button', { name: 'En cuve' }));
    expect(screen.getByRole('button', { name: 'En cuve' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelectorAll('.lst-card')).toHaveLength(2);
    expect(document.querySelectorAll('.lst-mini').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Tout effacer/ }));
    expect(screen.getByRole('button', { name: 'En cuve' }).getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelectorAll('.lst-card')).toHaveLength(5);
  });
  it('état vide : la recherche sans résultat se dit et s’efface', () => {
    render(<Banc search="Galaxy" />);
    expect(screen.getByText('Rien pour')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /Effacer la recherche/ })[0]);
    expect(screen.getAllByText('ZZ Z1').length).toBeGreaterThan(0);
  });
});
