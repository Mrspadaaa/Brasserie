import { describe, expect, it } from 'vitest';
import type { Batch, CreativeItem } from '../../src/types';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import {
  duneSemaine, evenementsAgenda, evenementsArgent, evenementsBrassins, indexSemaine, lundiDe, numeroSemaine, semainesDe, totalVoie
} from '../../src/domain/calendrier';

/** Lundi 16 novembre 2026 : semaine ISO 47. */
const AUJOURDHUI = '2026-11-16';
const semaines = semainesDe(AUJOURDHUI);
const lot = (p: Partial<Batch>) => ({ id: 'B-031', name: 'IPA Nelson', status: 'fermentation', brewDate: '12.11.2026', ...p }) as Batch;

describe('semaines du calendrier', () => {
  it('commence au lundi et compte six semaines ISO', () => {
    expect(lundiDe('2026-11-18')).toBe('2026-11-16');
    expect(lundiDe('2026-11-22')).toBe('2026-11-16');
    expect(semaines.map(s => s.numero)).toEqual([47, 48, 49, 50, 51, 52]);
    expect(semaines[0]).toMatchObject({ debut: '2026-11-16', jourMois: '16.11' });
    expect(semaines[5].jourMois).toBe('21.12');
  });
  it('numérote comme l’ISO 8601 aux changements d’année', () => {
    expect(numeroSemaine('2026-01-01')).toBe(1); // jeudi : semaine 1
    expect(numeroSemaine('2027-01-01')).toBe(53); // vendredi : encore 2026-W53
    expect(numeroSemaine('2027-01-04')).toBe(1);
    expect(semainesDe('2026-12-28').map(s => s.numero)).toEqual([53, 1, 2, 3, 4, 5]);
  });
  it('place un jour dans sa semaine, jamais hors des six semaines ni sans date', () => {
    expect(indexSemaine(semaines, '2026-11-16')).toBe(0);
    expect(indexSemaine(semaines, '23.11.2026')).toBe(1);
    expect(indexSemaine(semaines, '2026-12-27')).toBe(5);
    expect(indexSemaine(semaines, '2026-12-28')).toBeNull();
    expect(indexSemaine(semaines, '2026-11-15')).toBeNull();
    expect(indexSemaine(semaines, '')).toBeNull();
    expect(indexSemaine(semaines, 'bientôt')).toBeNull();
  });
});

describe('voie Brassins', () => {
  it('un brassin planifié se pose à sa semaine, un brassin en cuve à la semaine courante avec son âge', () => {
    const sortie = evenementsBrassins([
      lot({ id: 'B-032', name: 'Porter', status: 'planifie', plannedBrewDate: '08.12.2026', brewDate: '' }),
      lot({}),
    ], semaines, AUJOURDHUI, () => 4);
    const porter = sortie.find(e => e.batchId === 'B-032')!;
    expect(porter).toMatchObject({ a: 3, b: 3, voie: 'brassins', detail: 'brassage prévu le 08.12' });
    const ipa = sortie.find(e => e.batchId === 'B-031')!;
    expect(ipa).toMatchObject({ a: 0, b: 0, titre: 'B-031 IPA Nelson' });
    expect(ipa.detail).toContain('en cuve · J+4');
  });
  it('sans date de brassage connue, un brassin planifié ne pose rien (aucune date supposée)', () => {
    expect(evenementsBrassins([lot({ id: 'B-040', status: 'planifie', plannedBrewDate: undefined, brewDate: '' })], semaines, AUJOURDHUI, () => undefined)).toEqual([]);
  });
  it('sans âge connu, pas de « J+ » ; annulés et archivés absents', () => {
    const sortie = evenementsBrassins([lot({}), lot({ id: 'B-1', status: 'annule' }), lot({ id: 'B-2', archivedAt: '2026-11-01' })], semaines, AUJOURDHUI, () => undefined);
    expect(sortie).toHaveLength(1);
    expect(sortie[0].detail).toBe('en cuve');
  });
  it('un brassin conditionné dans les six semaines pose sa date, pas un brassin conditionné à venir', () => {
    const fait = lot({ id: 'B-028', status: 'conditionne', bottlingDate: '2026-11-17' });
    expect(evenementsBrassins([fait], semaines, '2026-11-18', () => 12)[0]).toMatchObject({ a: 0, detail: 'conditionné le 17.11' });
    expect(evenementsBrassins([fait], semaines, '2026-11-16', () => 12)).toEqual([]);
    expect(evenementsBrassins([lot({ id: 'B-027', status: 'conditionne', bottlingDate: '2026-10-02' })], semaines, AUJOURDHUI, () => 40)).toEqual([]);
  });
});

describe('voie Brassins : la barre court jusqu’à la fin prévue par la recette', () => {
  const etapes = [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 7 }];
  it('brassé le 12.11, 17 jours prévus : fin le 29.11, soit S48', () => {
    const ipa = evenementsBrassins([lot({ recipeSnapshot: { fermentation: etapes } as unknown as Batch['recipeSnapshot'] })], semaines, AUJOURDHUI, () => 4)[0];
    expect(ipa).toMatchObject({ a: 0, b: 1 });
    expect(ipa.detail).toContain('fin prévue le 29.11');
  });
  it('sans jours dans la recette, rien n’est inventé : la barre reste à la semaine courante', () => {
    expect(evenementsBrassins([lot({})], semaines, AUJOURDHUI, () => 4)[0]).toMatchObject({ a: 0, b: 0 });
  });
  it('au-delà des six semaines, la barre va jusqu’au bord', () => {
    const long = [{ kind: 'garde', name: 'Garde', tempC: 4, days: 90 }];
    expect(evenementsBrassins([lot({ recipeSnapshot: { fermentation: long } as unknown as Batch['recipeSnapshot'] })], semaines, AUJOURDHUI, () => 4)[0].b).toBe(5);
  });
});

describe('voie Achats : un titre court, le reste dans le détail', () => {
  it('« Emballage · Triple d’automne » ; « date estimée » et « à compléter » passent au détail', () => {
    const sortie = evenementsArgent([{ id: 'b1', date: '2026-11-24', label: 'Triple d’automne · emballage · date estimée · partiel, à compléter : emballage', amountCents: 5000, direction: 'out', source: 'brew', category: 'packaging', partial: ['emballage'] } as ForecastItem], semaines);
    expect(sortie[0].titre).toBe('Emballage · Triple d’automne');
    expect(sortie[0].detail).toBe('le 24.11 · date estimée · à compléter : emballage');
  });
});

describe('voie Événements', () => {
  const item = (p: Partial<CreativeItem>): CreativeItem => ({ id: 'e1', type: 'event', title: 'Marché de Noël', status: 'todo', date: '2026-12-12', ...p });
  it('seuls les événements datés, dans la fenêtre, pas faits', () => {
    const sortie = evenementsAgenda([
      item({}),
      item({ id: 'e2', status: 'done' }),
      item({ id: 'e3', date: undefined }),
      item({ id: 'e4', date: '2027-03-01' }),
      item({ id: 'e5', type: 'recipe-idea' })
    ], semaines);
    expect(sortie.map(e => e.id)).toEqual(['agenda-e1']);
    expect(sortie[0]).toMatchObject({ a: 3, b: 3, voie: 'evenements' });
  });
});

describe('voies Ventes et Achats', () => {
  const ligne = (p: Partial<ForecastItem>): ForecastItem => ({ id: 'f1', date: '2026-11-24', label: 'Weyermann', amountCents: 42000, direction: 'out', source: 'invoice', category: 'brassage', ...p });
  it('une sortie va aux Achats avec un montant négatif, une entrée aux Ventes', () => {
    const sortie = evenementsArgent([ligne({}), ligne({ id: 'f2', direction: 'in', label: 'Bar du Pont', amountCents: 12000, date: '2026-11-18' })], semaines);
    expect(sortie.find(e => e.voie === 'achats')).toMatchObject({ a: 1, centimes: -42000 });
    expect(sortie.find(e => e.voie === 'ventes')).toMatchObject({ a: 0, centimes: 12000 });
  });
  it('la tendance n’est pas un fait daté ; un montant partiel est signalé', () => {
    const sortie = evenementsArgent([ligne({ source: 'trend' }), ligne({ id: 'f3', partial: ['prix du houblon'] })], semaines);
    expect(sortie).toHaveLength(1);
    expect(sortie[0]).toMatchObject({ partiel: true });
    expect(sortie[0].detail).toContain('montant partiel');
  });
  it('une ligne à 0 CHF est un montant non renseigné : posée sans montant, jamais « +0,00 »', () => {
    const sortie = evenementsArgent([ligne({ id: 'f0', amountCents: 0, label: 'Porter · énergie' }), ligne({ id: 'f1b', amountCents: 8000 })], semaines);
    const zero = sortie.find(e => e.id === 'argent-f0')!;
    expect(zero.centimes).toBeUndefined();
    expect(zero.detail).toContain('montant non renseigné');
    expect(totalVoie(sortie, 'achats')).toBe(-8000);
  });
  it('totalVoie : somme des montants connus, null quand aucun (l’inconnu n’est pas 0)', () => {
    const sortie = evenementsArgent([ligne({}), ligne({ id: 'f4', amountCents: 8000 })], semaines);
    expect(totalVoie(sortie, 'achats')).toBe(-50000);
    expect(totalVoie(sortie, 'ventes')).toBeNull();
    const brassins = evenementsBrassins([lot({})], semaines, AUJOURDHUI, () => 1);
    expect(totalVoie(brassins, 'brassins')).toBeNull();
  });
  it('duneSemaine garde ce qui touche la semaine', () => {
    const sortie = evenementsArgent([ligne({}), ligne({ id: 'f5', date: '2026-12-03' })], semaines);
    expect(duneSemaine(sortie, 1).map(e => e.id)).toEqual(['argent-f1']);
    expect(duneSemaine(sortie, 2).map(e => e.id)).toEqual(['argent-f5']); // 3 déc. : semaine du 30.11
    expect(duneSemaine(sortie, 3)).toHaveLength(0);
  });
});
