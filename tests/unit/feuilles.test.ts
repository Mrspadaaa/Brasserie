import { describe, expect, it } from 'vitest';
import type { AuditLog } from '../../src/types';
import {
  actionCourte, comptesRubriques, etatLienCompagnon, etatVideJournal, filtrerJournal, groupesParJour,
  histogramme14, horodatageConversation, iconeConversation, libelleJour, partsParPersonne, SANS_FILTRE
} from '../../src/components/feuilles/regles';
import { ilYa } from '../../src/components/CloudConfigModal';

/** Samedi 14.11.2026, midi, heure locale : les jours se comptent en jours civils locaux. */
const MAINTENANT = new Date(2026, 10, 14, 12, 0, 0);
const iso = (j: number, mois: number, h: number, m = 0) => new Date(2026, mois - 1, j, h, m).toISOString();
const log = (id: string, user: AuditLog['user'], cat: AuditLog['category'], ts: string, action = 'Modification'): AuditLog =>
  ({ id, user, category: cat, timestamp: ts, action, entityId: `REF-${id}`, summary: `Écriture ${id}` });

const LOGS: AuditLog[] = [
  log('1', 'Gaëtan', 'Production', iso(14, 11, 9, 42)),
  log('2', 'Aricia', 'Finances', iso(14, 11, 8, 10), 'Création'),
  log('3', 'Gaëtan', 'Stocks', iso(13, 11, 17, 25)),
  log('4', 'Aricia', 'Clients', iso(13, 11, 16, 2)),
  log('5', 'Aricia', 'Stocks', iso(13, 11, 11, 30), 'Suppression'),
  log('6', 'Gaëtan', 'Production', iso(20, 10, 7, 58)) // hors des 14 jours
];

describe('Journal : frise de 14 jours', () => {
  it('compte par jour civil et par personne, du plus ancien au plus récent, aujourd’hui à droite', () => {
    const h = histogramme14(LOGS, MAINTENANT);
    expect(h).toHaveLength(14);
    expect(h[13]).toMatchObject({ cle: '2026-11-14', g: 1, a: 1, aujourdhui: true, legende: '14.11' });
    expect(h[12]).toMatchObject({ cle: '2026-11-13', g: 1, a: 2 });
    expect(h[0].cle).toBe('2026-11-01');
    expect(h.reduce((s, j) => s + j.g + j.a, 0)).toBe(5); // l'écriture du 20.10 est hors fenêtre
  });
  it('légende : date au premier jour, au milieu et à aujourd’hui, initiale du jour ailleurs', () => {
    const h = histogramme14(LOGS, MAINTENANT);
    expect(h.map(j => j.legende).slice(0, 3)).toEqual(['01.11', 'l', 'm']);
    expect(h[6].legende).toBe('07.11');
  });
  it('part par personne : arrondie, et « inconnue » (null) quand il n’y a aucune écriture, jamais 0 %', () => {
    expect(partsParPersonne(histogramme14(LOGS, MAINTENANT))).toEqual({ g: 2, a: 3, total: 5, pctG: 40, pctA: 60 });
    expect(partsParPersonne(histogramme14([], MAINTENANT))).toEqual({ g: 0, a: 0, total: 0, pctG: null, pctA: null });
  });
});

describe('Journal : filtres et groupes', () => {
  it('la personne et le jour touchés filtrent la liste', () => {
    expect(filtrerJournal(LOGS, { ...SANS_FILTRE, personne: 'Aricia' }).map(l => l.id)).toEqual(['2', '4', '5']);
    expect(filtrerJournal(LOGS, { ...SANS_FILTRE, jour: '2026-11-13' }).map(l => l.id)).toEqual(['3', '4', '5']);
  });
  it('les pastilles comptent avec les autres filtres, sans la rubrique elle-même', () => {
    const c = comptesRubriques(LOGS, { ...SANS_FILTRE, rubrique: 'Stocks', personne: 'Aricia' });
    expect(c).toMatchObject({ all: 3, Stocks: 1, Clients: 1, Finances: 1, Production: 0, 'Fûts': 0 });
  });
  it('la recherche porte sur le résumé, la référence et l’horodatage', () => {
    expect(filtrerJournal(LOGS, { ...SANS_FILTRE, mot: 'ref-4' })).toHaveLength(1);
    expect(filtrerJournal(LOGS, { ...SANS_FILTRE, mot: 'écriture 3' })).toHaveLength(1);
  });
  it('groupes par jour, du plus récent au plus ancien, avec « Aujourd’hui » et « Hier » dits avec leur date', () => {
    const g = groupesParJour(LOGS, MAINTENANT);
    expect(g.map(x => x.titre)).toEqual(['Aujourd’hui · sam. 14.11', 'Hier · ven. 13.11', 'mar. 20.10']);
    expect(g[0].entrees.map(l => l.id)).toEqual(['1', '2']);
    expect(g[1].entrees.map(l => l.id)).toEqual(['3', '4', '5']);
  });
  it('un horodatage illisible va à part, jamais dans un jour inventé', () => {
    const g = groupesParJour([log('x', 'Gaëtan', 'Stocks', 'pas une date')], MAINTENANT);
    expect(g).toEqual([{ cle: 'sans-date', titre: 'Sans date lisible', entrees: expect.any(Array) }]);
  });
  it('année ajoutée quand le jour n’est pas de cette année', () => {
    expect(libelleJour(new Date(2025, 11, 31), MAINTENANT)).toBe('mer. 31.12.2025');
  });
  it('actions : Modif., Création, Suppr., Statut', () => {
    expect([actionCourte('Modification').texte, actionCourte('Création').texte, actionCourte('Suppression').texte, actionCourte('Statut').texte]).toEqual(['Modif.', 'Création', 'Suppr.', 'Statut']);
  });
  it('état vide juste : sans écriture il le dit ; avec un filtre qui ne trouve rien, il propose de l’enlever', () => {
    expect(etatVideJournal(0, SANS_FILTRE).titre).toBe('Aucune modification pour l’instant');
    expect(etatVideJournal(0, SANS_FILTRE).effacer).toBe(false);
    expect(etatVideJournal(6, { ...SANS_FILTRE, personne: 'Gaëtan', mot: 'zzz' })).toMatchObject({ titre: 'Aucune modification ne correspond', effacer: true });
  });
});

describe('Conversations', () => {
  it('heure du jour si aujourd’hui, sinon jj.mm ; jamais « hier »', () => {
    expect(horodatageConversation(new Date(2026, 10, 14, 9, 12).getTime(), MAINTENANT)).toBe('09:12');
    expect(horodatageConversation(new Date(2026, 10, 13, 18, 0).getTime(), MAINTENANT)).toBe('13.11');
    expect(horodatageConversation(Number.NaN, MAINTENANT)).toBe('');
  });
  it('picto d’après la portée', () => {
    expect(iconeConversation('batch', 'B-031 IPA')).toEqual({ icone: 'flask', zone: 'prod' });
    expect(iconeConversation('draft', 'Triple')).toEqual({ icone: 'file', zone: 'prod' });
    expect(iconeConversation('app', 'Stocks · Citra T90')).toEqual({ icone: 'box', zone: 'sto' });
    expect(iconeConversation('app', 'Finances · Brouwland')).toEqual({ icone: 'wallet', zone: 'fin' });
    expect(iconeConversation('app', 'Bord')).toEqual({ icone: 'msg', zone: 'hop' });
  });
  it('hors ligne : le fil est coupé et le dit ; en ligne sans erreur, rien n’est coupé', () => {
    expect(etatLienCompagnon(false, '')).toMatchObject({ coupe: true, titre: 'Compagnon hors connexion · mode local' });
    expect(etatLienCompagnon(true, 'Réseau instable')).toMatchObject({ coupe: true, texte: 'Réseau instable' });
    expect(etatLienCompagnon(true, '').coupe).toBe(false);
  });
});

describe('Connexions : « il y a … »', () => {
  it('à la minute près, jamais une heure inventée', () => {
    expect(ilYa(1000, 1000 + 20_000)).toBe('à l’instant');
    expect(ilYa(0, 2 * 60_000)).toBe('il y a 2 min');
    expect(ilYa(0, 3 * 3_600_000)).toBe('il y a 3 h');
  });
});

