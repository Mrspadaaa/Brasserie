import { describe, expect, it } from 'vitest';
import type { Batch, CreativeItem } from '../../src/types';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import type { FinancialPlan } from '../../src/domain/finance/types';
import {
  RANGEES, anneeEnMois, choseArgent, choseBrassin, choseCreative, choseSansDate, choseVenteProbable, dateDeSemaine, dimancheDe, duneSemaine, echelleSemaines, ecartSemaines, estMarque, evenementsAgenda,
  evenementsArgent, evenementsBrassins, fenetreSemaines, finDeBrassin, francs, iconesIdees, indexMois, indexSemaine, jalonsBrassin, livraisonsAttendues, lundiDe, numeroSemaine, positionChose,
  retardsDe, semainesDe, totalVoie, budgetBrassin, francsSignes, idChoseArgent, preparerChoses, texteDuree, type Rangee
} from '../../src/domain/calendrier';
import { deplacer } from '../../src/domain/calendrierGestes';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';

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

/* ====================== Port du calendrier retenu (17.11) ====================== */

describe('sept rangées, semaines, année, échelle', () => {
  it('sept rangées, dans l’ordre de la frise, avec leur nom en clair', () => {
    expect(RANGEES.map(r => r.id)).toEqual(['brassins', 'fetes', 'ventes', 'achats', 'travaux', 'activites', 'papiers']);
    expect(RANGEES.map(r => r.nom)).toEqual(['Brassins', 'Fêtes', 'Ventes', 'Achats', 'Travaux', 'Activités', 'Papiers']);
  });
  it('52 semaines, une fenêtre de n semaines bornée, la date d’une semaine (i3)', () => {
    const toutes = semainesDe(AUJOURDHUI, 52);
    expect(toutes).toHaveLength(52);
    expect(toutes[51].debut).toBe('2027-11-08');
    expect(fenetreSemaines(toutes, 10, 13).map(s => s.index)).toEqual(Array.from({ length: 13 }, (_, i) => 10 + i));
    expect(fenetreSemaines(toutes, 99, 13)[0].index).toBe(39);
    expect(fenetreSemaines(toutes, -4, 6)[0].index).toBe(0);
    expect(dateDeSemaine('2026-12-07')).toBe('S50, 7 – 13 déc.');
    expect(dateDeSemaine('2026-11-30')).toBe('S49, 30 nov. – 6 déc.');
    expect(dimancheDe('2026-12-09')).toBe('2026-12-13');
    expect(ecartSemaines('2026-05-14', '2026-09-30')).toBe(20);
    expect(francs(506400)).toBe('5 064');
    expect(francs(-54000)).toBe('−540');
    expect(francs(0)).toBe('0');
  });
  it('l’année en 12 mois, le mois d’un jour', () => {
    const mois = anneeEnMois(AUJOURDHUI);
    expect(mois).toHaveLength(12);
    expect(mois[0]).toMatchObject({ debut: '2026-11-01', fin: '2026-11-30', court: 'nov.' });
    expect(mois[2]).toMatchObject({ debut: '2027-01-01', annee: 2027, mois: 1 });
    expect(mois[11]).toMatchObject({ debut: '2027-10-01', fin: '2027-10-31' });
    expect(indexMois(mois, '2026-12-24')).toBe(1);
    expect(indexMois(mois, '2028-01-01')).toBeNull();
  });
  it('une échelle partagée par la courbe et la frise, et la marque sous 24 px', () => {
    const e = echelleSemaines(13, 390);
    expect(e.largeurColonne).toBe(30);
    expect([e.x(2), e.centre(2)]).toEqual([60, 75]);
    expect([e.indexAuX(0), e.indexAuX(95), e.indexAuX(389), e.indexAuX(9999), e.indexAuX(-5)]).toEqual([0, 3, 12, 12, 0]);
    expect(echelleSemaines(0, 100).nbColonnes).toBe(1);
    expect(estMarque(23.9)).toBe(true);
    expect(estMarque(24)).toBe(false);
    expect(estMarque(0)).toBe(true);
    // une chose d'un jour en 6 mois (26 colonnes sur 390 px = 15 px) est une marque, en 6 semaines (65 px) une barre
    expect(estMarque(echelleSemaines(26, 390).largeurColonne)).toBe(true);
    expect(estMarque(echelleSemaines(6, 390).largeurColonne)).toBe(false);
  });
  it('la position d’une chose dans la fenêtre : coupée aux bords, absente hors fenêtre', () => {
    const six = semainesDe(AUJOURDHUI, 6);
    expect(positionChose(six, { debut: '2026-11-18', fin: '2026-11-18' })).toEqual({ a: 0, b: 0, coupeAGauche: false, coupeADroite: false });
    expect(positionChose(six, { debut: '2026-11-01', fin: '2026-11-25' })).toEqual({ a: 0, b: 1, coupeAGauche: true, coupeADroite: false });
    expect(positionChose(six, { debut: '2026-12-22', fin: '2027-03-01' })).toEqual({ a: 5, b: 5, coupeAGauche: false, coupeADroite: true });
    expect(positionChose(six, { debut: '2026-12-20', fin: '2026-12-20' })).toMatchObject({ a: 4, b: 4 }); // le dimanche appartient à sa semaine
    expect(positionChose(six, { debut: '2027-01-10', fin: '2027-01-11' })).toBeNull();
    expect(positionChose(six, { debut: '', fin: '' })).toBeNull();
  });
});

const recette = (primaire: number, garde: number, dry?: number) => ({
  fermentation: [{ kind: 'primaire', name: 'P', tempC: 19, days: primaire }, { kind: 'garde', name: 'G', tempC: 4, days: garde }],
  hops: dry === undefined ? [] : [{ name: 'Citra', alpha: 12, weightG: 30, stage: 'dryHop', dayOffset: dry }]
}) as unknown as Batch['recipeSnapshot'];

describe('jalons d’un brassin (E25) : des écarts à la date de brassage, lus dans la recette figée', () => {
  const planifie = lot({ id: 'LOT-9', name: 'Blonde', status: 'planifie', brewDate: '', plannedBrewDate: '08.12.2026', recipeSnapshot: recette(14, 21, 5) });
  it('brassage, fermentation, dry hop, garde, conditionnement ; seule la barre et la fin se glissent', () => {
    const j = jalonsBrassin(planifie);
    expect(j.map(x => [x.id, x.ecart, x.jour])).toEqual([
      ['brassage', 0, '2026-12-08'], ['fermentation', 1, '2026-12-09'], ['dry-hop', 5, '2026-12-13'], ['garde', 14, '2026-12-22'], ['conditionnement', 35, '2027-01-12']
    ]);
    expect(j.map(x => x.glissable)).toEqual(['barre', false, false, false, 'fin']);
    expect(j.find(x => x.id === 'dry-hop')!.raison).toBe('Le dry hop suit la recette du brassin');
  });
  it('sans jours dans la recette : seulement le brassage, aucune fin inventée ; « commander avant » se pose quand des courses manquent', () => {
    const nu = lot({ id: 'LOT-8', status: 'planifie', brewDate: '', plannedBrewDate: '08.12.2026' });
    expect(jalonsBrassin(nu).map(x => x.id)).toEqual(['brassage']);
    expect(finDeBrassin(nu)).toBeNull();
    expect(jalonsBrassin(planifie, { commanderLe: '2026-12-07' }).map(x => [x.id, x.ecart])[0]).toEqual(['commander', -1]);
    expect(jalonsBrassin(lot({ status: 'planifie', brewDate: '', plannedBrewDate: '' }))).toEqual([]);
  });
  it('une fin écrite (finPrevue) raccourcit la garde : les jalons au-delà disparaissent', () => {
    const court = { ...planifie, finPrevue: '2026-12-20' };
    expect(finDeBrassin(court)).toEqual({ jour: '2026-12-20', origine: 'finPrevue' });
    expect(jalonsBrassin(court).map(x => [x.id, x.ecart])).toEqual([['brassage', 0], ['fermentation', 1], ['dry-hop', 5], ['conditionnement', 12]]);
    expect(finDeBrassin({ ...planifie, finPrevue: '' })).toMatchObject({ origine: 'recette' });
  });
  it('en cuve, le jour de brassage ne se glisse pas ; sans fin écrite nulle part, la barre court jusqu’à aujourd’hui', () => {
    const encuve = lot({ id: 'LOT-3', status: 'fermentation', brewDate: '12.11.2026' });
    const chose = choseBrassin(encuve, AUJOURDHUI)!;
    expect(chose).toMatchObject({ debut: '2026-11-12', fin: AUJOURDHUI, finInconnue: true, rangee: 'brassins' });
    expect(chose.preteLe).toBeUndefined();
    expect(typeof chose.deplacable === 'object' && chose.deplacable.raison).toContain('en cuve');
    expect(chose.jalons![0]).toMatchObject({ id: 'brassage', glissable: false });
  });
});

describe('A3 : chaque source tombe dans sa rangée (un cas par ligne du tableau « Données »)', () => {
  const item = (id: string, p: Partial<ForecastItem> = {}): ForecastItem => ({ id, date: '2026-12-03', label: 'Ligne', amountCents: 10000, direction: 'out', source: 'plan', category: 'divers', ...p });
  const plan = (p: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'P', title: 'Plan', date: '2026-12-03', amountCents: 10000, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: 'x', ...p });
  const rangeeDe = (i: ForecastItem, plans: FinancialPlan[] = []): Rangee | null => choseArgent(i, plans)?.rangee ?? null;

  it('Brassins : planifié, en cuve ou en garde, conditionné (et annulé ou archivé : rien)', () => {
    expect(choseBrassin(lot({ id: 'P1', status: 'planifie', brewDate: '', plannedBrewDate: '08.12.2026' }), AUJOURDHUI)).toMatchObject({ rangee: 'brassins', debut: '2026-12-08', fin: '2026-12-08' });
    expect(choseBrassin(lot({ status: 'garde' }), AUJOURDHUI)?.rangee).toBe('brassins');
    expect(choseBrassin(lot({ status: 'conditionne', bottlingDate: '2026-11-20' }), AUJOURDHUI)).toMatchObject({ debut: '2026-11-20', fin: '2026-11-20' });
    expect(choseBrassin(lot({ status: 'conditionne' }), AUJOURDHUI)).toBeNull(); // pas de date de conditionnement connue
    expect(choseBrassin(lot({ status: 'annule' }), AUJOURDHUI)).toBeNull();
    expect(choseBrassin(lot({ archivedAt: '2026-11-01' }), AUJOURDHUI)).toBeNull();
    expect(choseBrassin(lot({ status: 'planifie', brewDate: '', plannedBrewDate: '' }), AUJOURDHUI)).toBeNull();
  });
  it('Fêtes : un event daté, pas fait ; une fête dure un jour sauf avec une fenêtre', () => {
    const f: CreativeItem = { id: 'e', type: 'event', title: 'Marché', status: 'todo', date: '2026-12-12' };
    expect(choseCreative(f)).toMatchObject({ rangee: 'fetes', debut: '2026-12-12', fin: '2026-12-12', id: 'creatif-e' });
    expect(choseCreative({ ...f, date: '12.12.2026' })?.debut).toBe('2026-12-12');
    expect(choseCreative({ ...f, fenetre: { du: '2026-12-07', au: '2026-12-13', joursActifs: 2 } })).toMatchObject({ debut: '2026-12-07', fin: '2026-12-13', joursActifs: 2 });
    expect(choseCreative({ ...f, status: 'done' })).toBeNull();
    expect(choseCreative({ ...f, date: undefined })).toBeNull();
    expect(choseCreative({ ...f, date: 'bientôt' })).toBeNull();
  });
  it('Ventes : une entrée datée de la prévision ; une vente probable (plan in brouillon) en pointillé', () => {
    expect(rangeeDe(item('i', { direction: 'in', source: 'invoice' }))).toBe('ventes');
    expect(rangeeDe(item('p', { direction: 'in', planId: 'PV' }), [plan({ id: 'PV', direction: 'in', category: 'recettes' })])).toBe('ventes');
    const probable = choseVenteProbable(plan({ id: 'PV', title: 'Café du Pont', direction: 'in', status: 'draft', amountCents: 90000, batchId: 'LOT-5', clientId: 'CL-1' }))!;
    expect(probable).toMatchObject({ rangee: 'ventes', probable: true, proposition: 'vente', centimes: 90000, liens: { batchId: 'LOT-5', clientId: 'CL-1' } });
    expect(choseVenteProbable(plan({ direction: 'in', status: 'active' }))).toBeNull();
    expect(choseVenteProbable(plan({ direction: 'out', status: 'draft' }))).toBeNull();
  });
  it('Achats : plan et sortie de brassin hors matériel et rénovation ; la livraison attendue vient du délai appris', () => {
    expect(rangeeDe(item('a', { planId: 'P' }), [plan()])).toBe('achats');
    expect(rangeeDe(item('b', { source: 'brew', batchId: 'LOT-5', category: 'brassage' }))).toBe('achats');
    const reglages = { ...REGLAGES_VIDES, commandes: { weyermann: [{ le: '2026-11-10', recue: '2026-11-17' }, { le: '2026-11-18' }, { le: '2026-11-01', recue: '2026-11-08' }], maltsfr: [{ le: '2026-11-12' }] } };
    const l = livraisonsAttendues(reglages);
    expect(l).toHaveLength(1); // sans délai appris (maltsfr), rien n'est posé
    expect(l[0]).toMatchObject({ rangee: 'achats', titre: 'Livraison Weyermann', debut: '2026-11-25' });
    expect('centimes' in l[0]).toBe(false); // un montant que la commande ne dit pas n'est pas 0
    expect(livraisonsAttendues(REGLAGES_VIDES)).toEqual([]);
  });
  it('Travaux : matériel, rénovation et projet de matériel (D-69)', () => {
    expect(rangeeDe(item('t', { planId: 'P', category: 'renovation' }), [plan({ category: 'renovation' })])).toBe('travaux');
    expect(rangeeDe(item('m', { planId: 'P', category: 'materiel' }), [plan({ category: 'materiel' })])).toBe('travaux');
    expect(choseArgent(item('e', { source: 'equipment', category: 'materiel', planId: 'UP' }))).toMatchObject({ rangee: 'travaux', source: { genre: 'projet-materiel', id: 'UP' }, ouvre: { ecran: 'materiel' } });
  });
  it('Activités : un item daté, pas un event (ou marqué activité), pas fait ; en jours, sans CHF sauf estimatedCost', () => {
    const base: CreativeItem = { id: 'x', type: 'prospect', title: 'Prospection', status: 'todo', date: '2026-12-03' };
    expect(choseCreative(base)).toMatchObject({ rangee: 'activites' });
    expect('centimes' in choseCreative(base)!).toBe(false);
    expect(choseCreative({ ...base, type: 'event', activite: true, fenetre: { du: '2026-12-01', au: '2026-12-13', joursActifs: 3 }, estimatedCost: 120 })).toMatchObject({ rangee: 'activites', joursActifs: 3, centimes: -12000 });
    expect(choseCreative({ ...base, estimatedCost: 0 })!.centimes).toBeUndefined();
    expect(choseCreative({ ...base, type: 'recipe-idea' })).toBeNull();
    expect(choseCreative({ ...base, type: 'equipment' })).toBeNull(); // arrive par son plan (Travaux)
  });
  it('Papiers : factures à payer, récurrentes (toute catégorie), TVA et clôture (plan tax)', () => {
    expect(rangeeDe(item('invoice:T1', { source: 'invoice' }))).toBe('papiers');
    expect(choseArgent(item('invoice:T1', { source: 'invoice' }))).toMatchObject({ source: { genre: 'facture', id: 'T1' }, ouvre: { ecran: 'piece', id: 'T1' } });
    expect(rangeeDe(item('r', { source: 'recurring', planId: 'R', category: 'materiel' }))).toBe('papiers');
    expect(rangeeDe(item('l', { source: 'recurring', planId: 'R', category: 'chargesFixes' }))).toBe('papiers');
    expect(rangeeDe(item('tva', { planId: 'T' }), [plan({ id: 'T', source: 'tax', category: 'chargesFixes' })])).toBe('papiers');
    expect(rangeeDe(item('ch', { planId: 'C', category: 'chargesFixes' }), [plan({ id: 'C', category: 'chargesFixes' })])).toBe('papiers');
  });
  it('Idées datées : une icône de la semaine, jamais une rangée ; sans date ou faite, rien', () => {
    const idee: CreativeItem = { id: 'i', type: 'recipe-idea', title: 'Bière au sapin', status: 'idea', date: '2026-12-10' };
    expect(iconesIdees([idee, { ...idee, id: 'j', date: undefined }, { ...idee, id: 'k', status: 'done' }])).toEqual([
      { id: 'idee-i', lundi: '2026-12-07', numero: 50, genre: 'idee', titre: 'Bière au sapin', ouvre: { ecran: 'atelier', id: 'i' } }
    ]);
    expect(choseCreative(idee)).toBeNull();
  });
  it('R48 : un carnet d’idées daté est une icône de sa semaine qui ouvre Carnets ; sans date, archivé ou fait, rien ; un recipe-idea garde l’Atelier', () => {
    const carnet: CreativeItem = { id: 'c', type: 'carnet', title: 'ZZ TEST — doseur de sucre', status: 'idea', date: '2026-11-16',
      carnet: { version: 1, creeLe: '2026-11-17T10:00:00.000Z', phrase: 'ZZ TEST — doseur de sucre', criteres: [], facons: [], articles: [], notes: [], photos: [] } };
    const recette: CreativeItem = { id: 'r', type: 'recipe-idea', title: 'Bière au sapin', status: 'idea', date: '2026-11-18' };
    expect(iconesIdees([
      carnet, { ...carnet, id: 'sans', date: undefined }, { ...carnet, id: 'fait', status: 'done' },
      { ...carnet, id: 'arch', carnet: { ...carnet.carnet!, archive: { le: '2026-11-17', raison: 'plan réalisé' } } }, recette
    ])).toEqual([
      { id: 'idee-c', lundi: '2026-11-16', numero: 47, genre: 'idee', titre: 'ZZ TEST — doseur de sucre', ouvre: { ecran: 'carnets', id: 'c' } },
      { id: 'idee-r', lundi: '2026-11-16', numero: 47, genre: 'idee', titre: 'Bière au sapin', ouvre: { ecran: 'atelier', id: 'r' } }
    ]);
  });
  it('R48 : un carnet et un message du carnet ne sont jamais une rangée ni la poche « Sans date », datés ou non', () => {
    const carnet: CreativeItem = { id: 'c', type: 'carnet', title: 'Évier', status: 'idea' };
    const message: CreativeItem = { id: 'm', type: 'carnet-message', title: 'Évier', status: 'done' };
    for (const x of [carnet, { ...carnet, date: '2026-11-16' }, { ...carnet, status: 'research' as const, date: '2026-11-16' }, message, { ...message, status: 'todo' as const }]) {
      expect(choseCreative(x)).toBeNull();
      expect(choseSansDate(x)).toBeNull();
    }
  });
  it('Sans date : un CreativeItem sans date, ni idée de recette ni fait', () => {
    const t: CreativeItem = { id: 't', type: 'event', title: 'Commander', status: 'todo' };
    expect(choseSansDate(t)).toMatchObject({ sansDate: true, debut: '', fin: '' });
    expect(choseSansDate({ ...t, type: 'recipe-idea' })).toBeNull();
    expect(choseSansDate({ ...t, status: 'done' })).toBeNull();
    expect(choseSansDate({ ...t, date: '2026-12-01' })).toBeNull();
  });
  it('la tendance n’est jamais une chose ; une ligne à 0 CHF n’a pas de centimes ; une chose sans date n’est pas posée', () => {
    expect(choseArgent(item('t', { source: 'trend' }))).toBeNull();
    const zero = choseArgent(item('z', { amountCents: 0, planId: 'P' }), [plan()])!;
    expect('centimes' in zero).toBe(false);
    expect(zero.detail).toContain('montant non renseigné');
    expect(choseArgent(item('d', { date: '' }))).toBeNull();
    expect(choseArgent(item('p', { partial: ['prix'], planId: 'P' }), [plan()])).toMatchObject({ partiel: true, centimes: -10000 });
  });
  it('les mouvements d’argent portent l’id de la ligne de la prévision ; la chose d’un plan unique a un id sans date (contrat L4)', () => {
    expect(choseArgent(item('PLAN:2026-12-03', { planId: 'PLAN' }), [plan({ id: 'PLAN' })])).toMatchObject({ id: 'argent-PLAN', mouvements: ['PLAN:2026-12-03'] });
  });
});

describe('CRITIQUE-2 n° 1 b, 2, 9, 11, 32 : id stable, jamais « J0 / 0 », budget du brassin, courses nommées, « lié à »', () => {
  const item = (id: string, p: Partial<ForecastItem> = {}): ForecastItem => ({ id, date: '2026-12-03', label: 'Ligne', amountCents: 10000, direction: 'out', source: 'plan', category: 'divers', ...p });
  const plan = (p: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'P', title: 'Plan', date: '2026-12-03', amountCents: 10000, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: 'x', ...p });
  const recette = { fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 14 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 14 }] } as unknown as Batch['recipeSnapshot'];

  it('l’id d’un plan manuel est identique après deplacer ; seule l’occurrence d’un récurrent garde sa date', () => {
    const p = plan({ id: 'P-HOTTE', title: 'Hotte', date: '2026-11-30', amountCents: 90000 });
    const avant = choseArgent(item('P-HOTTE:2026-11-30', { planId: 'P-HOTTE', date: '2026-11-30', amountCents: 90000 }), [p])!;
    const r = deplacer(avant, 1, { aujourdhui: AUJOURDHUI, batches: [], plans: [p], courbe: null });
    expect(r.ok).toBe(true);
    const date = r.ok ? (r.ecritures[0] as { patch: { date: string } }).patch.date : '';
    expect(date).toBe('2026-12-07');
    const apres = choseArgent(item(`P-HOTTE:${date}`, { planId: 'P-HOTTE', date, amountCents: 90000 }), [{ ...p, date }])!;
    expect(avant.id).toBe('argent-P-HOTTE');
    expect(apres.id).toBe(avant.id);
    expect(idChoseArgent({ id: 'L:2026-12-03', source: 'recurring', planId: 'L' })).toBe('argent-L:2026-12-03');
  });

  it('aucun « J0 / 0 » : brassin conditionné, en cuve sans recette, planifié sans recette ; avec la recette, « J0 / 28 · prête … »', () => {
    const cond = choseBrassin(lot({ status: 'conditionne', bottlingDate: '2026-11-25' }), AUJOURDHUI)!;
    expect(cond).toMatchObject({ conditionne: true, debut: '2026-11-25', detail: 'conditionné le 25 nov.' });
    const enCuve = choseBrassin(lot({ status: 'fermentation' }), AUJOURDHUI)!;
    const sansRecette = choseBrassin(lot({ id: 'P0', status: 'planifie', brewDate: '', plannedBrewDate: '08.12.2026' }), AUJOURDHUI)!;
    const avecRecette = choseBrassin(lot({ id: 'P1', status: 'planifie', brewDate: '', plannedBrewDate: '08.12.2026', recipeSnapshot: recette }), AUJOURDHUI)!;
    for (const c of [cond, enCuve, sansRecette]) expect(texteDuree(c)).toBeNull();
    expect(texteDuree(avecRecette)).toBe('J0 / 28 · prête 5 janv.');
    for (const c of [cond, enCuve, sansRecette, avecRecette]) expect(texteDuree(c) ?? '').not.toMatch(/J0 \/ 0\b/);
  });

  it('le montant d’un brassin égale la somme de ses lignes brew ; ses courses de la semaine font UN caddie nommé, relié à lui', () => {
    const b = choseBrassin(lot({ id: 'LOT-B', name: 'Blonde d’automne', status: 'planifie', brewDate: '', plannedBrewDate: '23.11.2026', recipeSnapshot: recette }), AUJOURDHUI)!;
    const lignes = [
      item('brew:LOT-B:malt', { source: 'brew', batchId: 'LOT-B', amountCents: 12000, label: 'Blonde d’automne · malt', category: 'brassage', date: '2026-11-20' }),
      item('brew:LOT-B:houblon', { source: 'brew', batchId: 'LOT-B', amountCents: 2800, label: 'Blonde d’automne · houblon', category: 'brassage', date: '2026-11-21' }),
      item('brew:LOT-B:energie', { source: 'brew', batchId: 'LOT-B', amountCents: 0, label: 'Blonde d’automne · énergie', category: 'energie', date: '2026-11-22' })
    ].map(i => choseArgent(i)!);
    expect(budgetBrassin('LOT-B', [b, ...lignes])).toEqual({ centimes: -14800, partiel: true });
    const prets = preparerChoses([b, ...lignes]);
    expect(prets.find(c => c.id === b.id)).toMatchObject({ centimes: -14800, partiel: true });
    /* sa maquette (as/p-repos) : « Blonde d'automne −148 », sans file de caddies ; les courses vivent dans le budget et le détail du brassin */
    expect(prets.filter(c => c.rangee === 'achats' || c.brassinLie)).toHaveLength(0);
    const blonde = prets.find(c => c.id === b.id)!;
    expect(blonde.courses).toBe(`malt le 20 nov. ${francsSignes(-12000)}, houblon le 21 nov. ${francsSignes(-2800)}, énergie le 22 nov. (montant non renseigné)`);
    expect(blonde.mouvements).toEqual(['brew:LOT-B:malt', 'brew:LOT-B:houblon', 'brew:LOT-B:energie']);
    /* le brassin hors de la frise : UN caddie nommé, relié à lui (brassinLie), jamais anonyme */
    const [caddie] = preparerChoses(lignes, { brassins: new Map([['LOT-B', 'Blonde d’automne']]) });
    expect(caddie).toMatchObject({ rangee: 'brassins', brassinLie: 'LOT-B', debut: '2026-11-20', centimes: -14800, titre: 'Malt, houblon, énergie · Blonde d’automne' });
    expect(budgetBrassin('LOT-X', [b])).toBeNull();
    expect(prets.find(c => c.id === b.id)!.centimes).not.toBe(0);
  });

  it('une chose liée porte « lié à La Cigogne » et son aperçu ; sans lien, rien', () => {
    const fete = choseCreative({ id: 'CR', type: 'event', title: 'Marché de Noël', status: 'todo', date: '2026-12-14', liens: { clientId: 'CL' } } as CreativeItem)!;
    const seule = choseCreative({ id: 'CR2', type: 'event', title: 'Fête', status: 'todo', date: '2026-12-14' } as CreativeItem)!;
    const [a, s] = preparerChoses([fete, seule], { clients: new Map([['CL', 'La Cigogne']]) });
    expect(a.lie).toMatchObject({ texte: 'lié à La Cigogne', client: 'La Cigogne' });
    expect(a.lie!.apercu).toContain('La Cigogne · client');
    expect(s.lie).toBeUndefined();
  });
});

describe('E08 : « en retard » se dit avec des dates, jamais « en retard de 7 j »', () => {
  it('factures, brassins planifiés passés, tâches passées, densité et courses : une date ou rien', () => {
    const r = retardsDe({
      aujourdhui: AUJOURDHUI,
      restes: [{ id: 'F1', libelle: 'Weyermann', cents: 42000, echeance: '2026-11-03', enRetard: true }, { id: 'F2', libelle: 'Futur', cents: 1000, echeance: '2026-12-03', enRetard: false }, { id: 'F3', libelle: 'Sans échéance', cents: 1000, echeance: null, enRetard: true }],
      batches: [lot({ id: 'LOT-P', name: 'Porter', status: 'planifie', brewDate: '', plannedBrewDate: '05.11.2026' }), lot({ id: 'LOT-OK', status: 'planifie', brewDate: '', plannedBrewDate: '08.12.2026' })],
      items: [{ id: 'CR', type: 'event', title: 'Appeler la commune', status: 'todo', date: '2026-11-09' }, { id: 'CR2', type: 'event', title: 'Fait', status: 'done', date: '2026-11-01' }],
      sansDensite: [lot({ id: 'LOT-D', name: 'IPA' })], courses: { nom: 'Porter', nombre: 3, avant: 'S49' }
    });
    expect(r.map(x => x.genre)).toEqual(['facture', 'brassin', 'tache', 'densite', 'courses']);
    expect(r[0].detail).toContain('échéance le 3 nov.');
    expect(r[1].detail).toBe('brassage prévu le 5 nov.');
    expect(r[4]).toMatchObject({ titre: 'Commander pour Porter', detail: '3 articles avant S49', jour: null });
    for (const x of r) expect(`${x.titre} ${x.detail}`).not.toMatch(/depuis \d+ ?j|de \d+ ?j\b|retard de/i);
    expect(retardsDe({ aujourdhui: AUJOURDHUI, restes: [], batches: [], items: [] })).toEqual([]);
  });
});
