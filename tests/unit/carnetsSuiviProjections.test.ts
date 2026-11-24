/**
 * D451, voie domaine : les projections du suivi (DOSSIER règles 7 à 12) et la tolérance des lecteurs. Fixture « ZZ TEST — » (`fixtureSuivi`),
 * « aujourd'hui » = mardi 24 nov. 2026 ; exemples seulement, aucune donnée réelle.
 */
import { describe, expect, it } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { arbreDe, coupDOeil } from '../../src/domain/carnets/arbre';
import { filDe, REPLI_MIN } from '../../src/domain/carnets/fil';
import { ANNEE_SUIVI, fixtureSuivi, IDS_SUIVI, MAINTENANT_SUIVI, OPTIONS_VAPEUR } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, lireDonneesCarnet, lireMessage, lireMessages, type CarnetDoc, type MessageDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures, type Resultat } from '../../src/domain/carnets/operations';
import { avantApresDe, dureeDe, fermerParAchat, poserAvantApres, pourquoiDe } from '../../src/domain/carnets/suivi';
import { aFaireDe, notePlanningDe, tachesDe } from '../../src/domain/carnets/taches';

const json = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const etat = fixtureSuivi();
const carnets = lireCarnets(etat, { archives: true });
const messages = lireMessages(etat);
const carnet = (id: string, source: readonly CreativeItem[] = etat): CarnetDoc => lireCarnet(source.find(d => d.id === id))!;
function ok(base: readonly CreativeItem[], r: Resultat): CreativeItem[] {
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.raison);
  return appliquerEcritures(base, r.ecritures);
}

describe('règle 7 : aFaireDe', () => {
  const liste = aFaireDe(carnets, MAINTENANT_SUIVI);
  const ids = (cle: string) => liste.groupes.find(g => g.cle === cle)?.taches.map(t => t.id) ?? [];

  it('Cette semaine, Fin du mois, Plus loin, Un jour ; les groupes vides sont omis', () => {
    expect(liste.groupes.map(g => g.cle)).toEqual(['cette-semaine', 'fin-du-mois', 'plus-loin', 'un-jour']);
    expect(ids('cette-semaine')).toEqual(['ZZ-SE-T1', 'ZZ-SE-T2', 'ZZ-SM-T1', 'ZZ-SF-T1']);
    expect(ids('fin-du-mois')).toEqual(['planning:ZZ-SPL-N1', 'ZZ-SV-T1', 'ZZ-SF-T2']);
    expect(ids('plus-loin')).toEqual(['ZZ-SA-T1']);
    expect(ids('un-jour')).toEqual(['ZZ-SC-T1']);
    expect(liste.total).toBe(9);
    expect(aFaireDe([carnet(IDS_SUIVI.moisissure)], MAINTENANT_SUIVI)).toEqual({ groupes: [], total: 0, cout: null });
  });

  it('une tâche en retard est dans Cette semaine, sans aucune marque de reproche', () => {
    const base = ok(etat, { ok: true, ecritures: [], inverse: [], avis: '' });
    const ancien = json(carnet(IDS_SUIVI.moisissure));
    ancien.carnet.taches = [{ id: 'ZZ-T-RETARD', texte: 'Traiter le coin moisi', echeance: '2026-11-09', precision: 'semaine', origine: 'exemple', creeeLe: '2026-11-01T12:00:00.000Z' }];
    const l = aFaireDe([...carnets.filter(c => c.id !== IDS_SUIVI.moisissure), ancien], MAINTENANT_SUIVI);
    const g = l.groupes.find(x => x.cle === 'cette-semaine')!;
    expect(g.taches[0].id).toBe('ZZ-T-RETARD');
    expect(Object.keys(g.taches[0]).some(k => /retard|late|overdue/i.test(k))).toBe(false);
    expect(base.length).toBe(etat.length);
  });

  it('le coût absent n’est jamais 0 : le total « ≈ » ne porte que sur les coûts connus, avec leur nombre', () => {
    const g = liste.groupes.find(x => x.cle === 'cette-semaine')!;
    expect(g.cout).toEqual({ centimes: 85000 + 6000 + 3500, connus: 3, sur: 4, estime: true });
    expect(liste.groupes.find(x => x.cle === 'fin-du-mois')!.cout).toEqual({ centimes: 54000 + 2500, connus: 2, sur: 3, estime: true });
    expect(liste.groupes.find(x => x.cle === 'plus-loin')!.cout).toBeNull();
    expect(liste.cout).toEqual({ centimes: 94500 + 56500 + 1200, connus: 6, sur: 9, estime: true });
    const t = g.taches.find(x => x.id === 'ZZ-SM-T1')!;
    expect('coutCentimes' in t).toBe(false);
  });

  it('un coût connu et non estimé sur toutes les tâches du groupe : pas de « ≈ » ; une autre devise n’est pas additionnée', () => {
    const c = json(carnet(IDS_SUIVI.moisissure));
    c.carnet.taches = [
      { id: 'A', texte: 'a', echeance: '2026-11-23', precision: 'semaine', coutCentimes: 1000, devise: 'CHF', origine: 'exemple', creeeLe: 'x1' },
      { id: 'B', texte: 'b', echeance: '2026-11-23', precision: 'semaine', coutCentimes: 500, devise: 'CHF', origine: 'exemple', creeeLe: 'x2' },
      { id: 'C', texte: 'c', echeance: '2026-11-23', precision: 'semaine', coutCentimes: 900, devise: 'EUR', origine: 'exemple', creeeLe: 'x3' }
    ];
    const g = aFaireDe([c], MAINTENANT_SUIVI).groupes[0];
    expect(g.cout).toEqual({ centimes: 1500, connus: 2, sur: 3, estime: true });
    c.carnet.taches.pop();
    expect(aFaireDe([c], MAINTENANT_SUIVI).groupes[0].cout).toEqual({ centimes: 1500, connus: 2, sur: 2, estime: false });
  });

  it('une tâche faite, ou d’un carnet résolu, n’est plus à faire', () => {
    const resolu = ok(etat, fermerParAchat(etat, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T12:00:00.000Z' }));
    expect(aFaireDe(lireCarnets(resolu, { archives: true }), MAINTENANT_SUIVI).groupes.flatMap(g => g.taches.map(t => t.id))).not.toContain('ZZ-SV-T1');
    const c = json(carnet(IDS_SUIVI.co2));
    c.carnet.taches![0].faiteLe = '2026-11-24T08:00:00.000Z';
    expect(aFaireDe([c], MAINTENANT_SUIVI).total).toBe(0);
  });

  it('la semaine change avec « maintenant » : le dimanche compte encore dans la semaine, le lundi non', () => {
    expect(ids('cette-semaine')).not.toContain('ZZ-SV-T1');
    const dimanche = aFaireDe(carnets, '2026-11-29T20:00:00.000Z');
    expect(dimanche.groupes.find(g => g.cle === 'fin-du-mois')?.taches.map(t => t.id)).toContain('ZZ-SV-T1');
    const lundi = aFaireDe(carnets, '2026-11-30T09:00:00.000Z');
    expect(lundi.groupes.find(g => g.cle === 'cette-semaine')!.taches.map(t => t.id)).toContain('ZZ-SV-T1');
    expect(aFaireDe(carnets, new Date('2026-11-24T12:00:00.000Z')).total).toBe(9);
    expect(aFaireDe(carnets, Date.parse('2026-11-24T12:00:00.000Z')).total).toBe(9);
  });

  it('une note du Planning « À faire du … au … » devient une tâche dérivée, lecture seule', () => {
    expect(notePlanningDe('À faire du 01.08.2026 au 01.05.2027 (Planning, Équipements)')).toEqual({ du: '2026-08-01', au: '2027-05-01', categorie: 'Équipements' });
    expect(notePlanningDe('À faire du 08.12.2025 (Planning, Structure)')).toEqual({ du: '2025-12-08', categorie: 'Structure' });
    expect(notePlanningDe('À faire demain')).toBeNull();
    expect(notePlanningDe('Jalon du Planning, sans date')).toBeNull();
    const t = tachesDe(carnet(IDS_SUIVI.planning));
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ id: 'planning:ZZ-SPL-N1', echeance: '2026-11-30', precision: 'semaine', derivee: true, carnetId: IDS_SUIVI.planning });
    expect(carnet(IDS_SUIVI.planning).carnet.taches).toBeUndefined();
  });
});

describe('règle 8 : arbreDe', () => {
  const arbre = arbreDe(carnets);
  const ids = (l: readonly CarnetDoc[]) => l.map(c => c.id);

  it('domaine › sous-domaine : les problèmes ouverts à plat, les autres genres repliés, « À ranger », « Résolus 2026 »', () => {
    expect(arbre.domaines.map(d => d.domaine)).toEqual(['local', 'brasserie', 'meuble', 'papiers']);
    const local = arbre.domaines[0], brasserie = arbre.domaines[1], meuble = arbre.domaines[2], papiers = arbre.domaines[3];
    expect(ids(local.ouverts)).toEqual([IDS_SUIVI.fusible, IDS_SUIVI.fenetre, IDS_SUIVI.moisissure, IDS_SUIVI.ecoulement]);
    expect(local.groupes).toEqual([]);
    expect(local.n).toBe(4);
    /* le projet du Planning « Rangement et étagères inox » : sa catégorie Structure et ses mots le rangent dans Meuble */
    expect(meuble.groupes).toEqual([{ chemin: null, carnets: [expect.objectContaining({ id: IDS_SUIVI.planning })] }]);
    expect(ids(brasserie.ouverts)).toEqual([IDS_SUIVI.malt, IDS_SUIVI.co2, IDS_SUIVI.vapeur]);
    expect(brasserie.groupes.map(g => g.chemin)).toEqual(['Événements', null]);
    expect(ids(brasserie.groupes[0].carnets)).toEqual([IDS_SUIVI.fete]);
    expect(ids(brasserie.groupes[1].carnets)).toEqual([IDS_SUIVI.chambreFroide]);
    expect(papiers.groupes.map(g => g.chemin)).toEqual(['Assurances']);
    expect(ids(arbre.aRanger)).toEqual([IDS_SUIVI.photo]);
    expect(arbre.resolus).toEqual([{ annee: 2026, carnets: [expect.objectContaining({ id: IDS_SUIVI.joint }), expect.objectContaining({ id: IDS_SUIVI.pompe })] }]);
  });

  it('un résolu quitte son domaine ; un carnet sans domaine ni chemin va dans « À ranger » ; l’ordre est stable', () => {
    const r = ok(etat, fermerParAchat(etat, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T12:00:00.000Z' }));
    const a = arbreDe(lireCarnets(r, { archives: true }));
    expect(ids(a.domaines.find(d => d.domaine === 'brasserie')!.ouverts)).toEqual([IDS_SUIVI.malt, IDS_SUIVI.co2]);
    expect(a.resolus[0].carnets.map(c => c.id)).toEqual([IDS_SUIVI.vapeur, IDS_SUIVI.joint, IDS_SUIVI.pompe]);
    expect(JSON.stringify(arbreDe([...carnets].reverse()))).toBe(JSON.stringify(arbre));
  });

  it('les mots du titre rangent un carnet sans domaine posé (parMots) ; sans mot, « À ranger »', () => {
    const a = arbreDe(carnets, t => (/photo/i.test(t) ? 'outils' : null));
    expect(a.domaines.find(d => d.domaine === 'outils')!.groupes[0].carnets.map(c => c.id)).toEqual([IDS_SUIVI.photo]);
    expect(a.aRanger).toEqual([]);
  });
});

describe('règle 9 : coupDOeil', () => {
  it('je cherche, décidés, notés (genre problème seulement), résolus dans l’année', () => {
    expect(coupDOeil(carnets, ANNEE_SUIVI)).toEqual({ annee: 2026, cherche: 4, decides: 4, notes: 2, resolus: 2 });
    expect(coupDOeil(carnets, 2025).resolus).toBe(0);
    expect(coupDOeil([], 2026)).toEqual({ annee: 2026, cherche: 0, decides: 0, notes: 0, resolus: 0 });
  });

  it('la photo seule et le projet du Planning (genre idée) ne comptent pas parmi les notés', () => {
    expect(coupDOeil([carnet(IDS_SUIVI.photo), carnet(IDS_SUIVI.planning)], 2026).notes).toBe(0);
  });
});

describe('règle 10 : filDe', () => {
  const vapeur = carnet(IDS_SUIVI.vapeur);

  it('messages, événements, tri par date, regroupés par jour ; les plus anciens repliés (« ▴ n notes du … au … »)', () => {
    const fil = filDe(vapeur, messages);
    expect(fil.total).toBe(17);
    expect(fil.replie).toMatchObject({ n: 3, du: '2026-11-03', au: '2026-11-06' });
    expect(fil.replie!.n).toBeGreaterThanOrEqual(REPLI_MIN);
    expect(fil.jours.map(j => j.jour)).toEqual(['2026-11-08', '2026-11-12', '2026-11-20', '2026-11-21', '2026-11-22']);
    const dates = fil.jours.flatMap(j => j.entrees.map(e => e.le));
    expect([...dates].sort()).toEqual(dates);
    const tout = [...fil.replie!.jours, ...fil.jours].flatMap(j => j.entrees);
    expect(tout.filter(e => e.sorte === 'message')).toHaveLength(10);
    expect(tout.filter(e => e.sorte === 'evenement')).toHaveLength(7);
    const retenu = tout.find(e => e.sorte === 'message' && e.id === 'ZZ-SV-M8');
    expect(retenu && retenu.sorte === 'message' && retenu.etiquettes.map(x => x.sorte)).toEqual(['retenu']);
  });

  it('sans repli quand le fil est court ; tout le fil quand on le déplie', () => {
    const tout = filDe(vapeur, messages, { garde: 100 });
    expect(tout.replie).toBeNull();
    expect(tout.jours.flatMap(j => j.entrees)).toHaveLength(17);
    expect(filDe(carnet(IDS_SUIVI.ecoulement), messages).replie).toBeNull();
  });

  it('un message reste dans son carnet : il n’entre pas dans le fil d’un autre ; une étiquette qui vise un carnet l’y fait entrer', () => {
    const ecoul = filDe(carnet(IDS_SUIVI.ecoulement), messages, { garde: 100 });
    const idsEcoul = ecoul.jours.flatMap(j => j.entrees).filter(e => e.sorte === 'message').map(e => e.id);
    expect(idsEcoul).toEqual(['ZZ-SE-M1', 'ZZ-SE-M2', 'ZZ-SE-M3', 'ZZ-SE-M4', 'ZZ-SE-M5']);
    const dehors: MessageDoc = {
      id: 'ZZ-MSG-AILLEURS', type: 'carnet-message', title: 'x', status: 'done',
      carnetMessage: { texte: 'Le condenseur A coûte 690 CHF.', le: '2026-11-23T10:00:00.000Z', depuis: IDS_SUIVI.fusible, rangement: 'simulee', effets: [], etiquettes: [{ carnetId: IDS_SUIVI.vapeur, sorte: 'cout', montantCentimes: 69000, devise: 'CHF', origine: 'locale' }, { carnetId: IDS_SUIVI.fusible, sorte: 'cout', origine: 'locale' }] }
    };
    const fil = filDe(vapeur, [...messages, dehors], { garde: 100 });
    const e = fil.jours.flatMap(j => j.entrees).find(x => x.id === 'ZZ-MSG-AILLEURS');
    expect(e && e.sorte === 'message' && e.etiquettes).toEqual([{ carnetId: IDS_SUIVI.vapeur, sorte: 'cout', montantCentimes: 69000, devise: 'CHF', origine: 'locale' }]);
    expect(filDe(carnet(IDS_SUIVI.malt), [dehors], { garde: 100 }).total).toBe(carnet(IDS_SUIVI.malt).carnet.suivi!.evenements.length + carnet(IDS_SUIVI.malt).carnet.notes.length);
  });

  it('une note sans message se date par modifieeLe, sinon à la création du carnet (date inconnue dite) ; une note du Planning garde ses dates', () => {
    const fil = filDe(carnet(IDS_SUIVI.planning), []);
    const e = fil.jours[0].entrees[0];
    expect(e.sorte === 'note' && e.dateConnue).toBe(false);
    expect(e.sorte === 'note' && e.planning).toEqual({ du: '2026-12-01', au: '2027-01-15', categorie: 'Structure' });
    expect(e.le).toBe('2026-11-01T12:00:00.000Z');
    const c = json(carnet(IDS_SUIVI.planning));
    c.carnet.notes.push({ id: 'ZZ-N-DATEE', texte: 'une note datée', genre: 'note', modifieeLe: '2026-11-12T12:00:00.000Z' });
    const n = filDe(c, []).jours.flatMap(j => j.entrees).find(x => x.id === 'ZZ-N-DATEE');
    expect(n && n.sorte === 'note' && n.dateConnue).toBe(true);
  });
});

describe('règle 11 : pourquoiDe', () => {
  it('ses mots, mot pour mot : le message retenu et la veille « de nouveau en stock » (2 au plus, dans l’ordre du temps)', () => {
    const c = pourquoiDe(carnet(IDS_SUIVI.vapeur), messages)!;
    expect(c.map(x => x.texte)).toEqual(['de nouveau en stock', 'Je le prends fin du mois']);
    expect(c.map(x => x.sorte)).toEqual(['veille', 'retenu']);
    for (const x of c) expect(messages.find(m => m.id === x.messageId)!.carnetMessage.texte.includes(x.texte)).toBe(true);
  });

  it('aucune parole liée à l’option retenue : null (la question honnête s’affiche), jamais un texte inventé', () => {
    expect(pourquoiDe(carnet(IDS_SUIVI.ecoulement), messages)).toBeNull();
    expect(pourquoiDe(carnet(IDS_SUIVI.fete), messages)).toBeNull();
    expect(pourquoiDe(carnet(IDS_SUIVI.vapeur), [])).toBeNull();
  });

  it('une étiquette sans phrase cite la première phrase du message ; une étiquette d’une autre option est ignorée', () => {
    const m: MessageDoc = {
      id: 'ZZ-MSG-PQ', type: 'carnet-message', title: 'x', status: 'done',
      carnetMessage: { texte: 'Pris pour sa taille. Et il est dispo vite.', le: '2026-11-21T12:00:00.000Z', depuis: IDS_SUIVI.vapeur, rangement: 'simulee', effets: [],
        etiquettes: [{ carnetId: IDS_SUIVI.vapeur, sorte: 'pourquoi', origine: 'vous' }, { carnetId: IDS_SUIVI.vapeur, sorte: 'retenu', texte: 'jamais vu', optionId: OPTIONS_VAPEUR.condA, origine: 'vous' }] }
    };
    const c = pourquoiDe(carnet(IDS_SUIVI.vapeur), [m])!;
    expect(c).toEqual([{ texte: 'Pris pour sa taille.', sorte: 'pourquoi', messageId: 'ZZ-MSG-PQ', le: '2026-11-21T12:00:00.000Z' }]);
    expect(m.carnetMessage.texte.includes(c[0].texte)).toBe(true);
  });

  it('le « pourquoi » du choix posé (ADR) passe avant ; deux citations au plus', () => {
    const c = json(carnet(IDS_SUIVI.vapeur));
    c.carnet.choix = { articleId: 'ZZ-SV-A1', pourquoi: 'le plus petit', ecartes: [], le: '2026-11-20T12:00:00.000Z', remplaces: [] };
    const r = pourquoiDe(c, messages)!;
    expect(r).toHaveLength(2);
    expect(r.map(x => x.sorte)).toEqual(['retenu', 'choix']);
    expect(r[1]).toMatchObject({ texte: 'le plus petit' });
  });
});

describe('règle 12 : dureeDe et avantApresDe', () => {
  it('durée : jours entre la création et la résolution ; null tant que ce n’est pas résolu', () => {
    expect(dureeDe(carnet(IDS_SUIVI.vapeur))).toBeNull();
    const r = ok(etat, fermerParAchat(etat, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T12:00:00.000Z' }));
    expect(dureeDe(carnet(IDS_SUIVI.vapeur, r))).toBe(27);
    expect(dureeDe(carnet(IDS_SUIVI.pompe))).toBe(12);
    const ancien = json(carnet(IDS_SUIVI.chambreFroide));
    ancien.carnet.archive = { le: '2026-10-30T12:00:00.000Z', raison: 'plan réalisé' };
    expect(dureeDe(ancien)).toBe(10);
    ancien.carnet.archive = { le: '2026-10-01T12:00:00.000Z', raison: 'dates qui se contredisent' };
    expect(dureeDe(ancien)).toBeNull();
  });

  it('avant = la 1re photo du fil ; après = la dernière photo prise après la décision (la date d’une photo est celle de son message)', () => {
    const aa = avantApresDe(carnet(IDS_SUIVI.vapeur), messages)!;
    expect(aa.avant!.id).toBe('ZZ-SV-M1-P');
    expect(aa.apres!.id).toBe('ZZ-SV-M10-P');
    expect(avantApresDe(carnet(IDS_SUIVI.vapeur), [])).toEqual({ avant: expect.objectContaining({ id: 'ZZ-SV-M1-P' }) });
  });

  it('une photo seule : avant sans après ; aucune photo : null (le picto de la catégorie la remplace) ; son choix prime', () => {
    expect(avantApresDe(carnet(IDS_SUIVI.photo), messages)).toEqual({ avant: expect.objectContaining({ id: 'ZZ-SP-P1' }) });
    expect(avantApresDe(carnet(IDS_SUIVI.moisissure), messages)).toBeNull();
    const choisi = ok(etat, poserAvantApres(etat, { carnetId: IDS_SUIVI.vapeur, avantPhotoId: 'ZZ-SV-M10-P', apresPhotoId: 'ZZ-SV-M1-P' }));
    const aa = avantApresDe(carnet(IDS_SUIVI.vapeur, choisi), messages)!;
    expect([aa.avant!.id, aa.apres!.id]).toEqual(['ZZ-SV-M10-P', 'ZZ-SV-M1-P']);
  });
});

describe('lecteurs tolérants du suivi : une forme inconnue est absente, jamais inventée', () => {
  const base = { version: 1, creeLe: '2026-11-20T08:00:00.000Z', phrase: 'exemple', criteres: [], facons: [], articles: [], notes: [], photos: [] };

  it('un suivi, un genre, une catégorie ou une tâche mal formés sont écartés ; le reste du carnet se lit', () => {
    const d = lireDonneesCarnet({
      ...base, genre: { valeur: 'inconnu', origine: 'vous' }, categorie: { chemin: [], origine: 'ia' }, suivi: { etat: 'fini', evenements: [] },
      taches: [{ id: 'T', texte: 'sans date de création' }, { texte: 'sans id', creeeLe: 'x' }, 'pas un objet']
    })!;
    expect(d.genre).toBeUndefined();
    expect(d.categorie).toBeUndefined();
    expect(d.suivi).toBeUndefined();
    expect(d.taches).toBeUndefined();
  });

  it('une catégorie à 3 niveaux se lit sur 2 ; un événement de sorte inconnue est écarté ; un coût négatif ou NaN est absent (jamais 0)', () => {
    const d = lireDonneesCarnet({
      ...base, categorie: { chemin: ['Local', ' Eau ', 'Robinet'], origine: 'ia' },
      suivi: { etat: 'cherche', evenements: [{ id: 'E1', le: '2026-11-20T08:00:00.000Z', sorte: 'etat' }, { id: 'E2', le: '2026-11-20T08:00:00.000Z', sorte: 'danse' }] },
      taches: [
        { id: 'T1', texte: 'a', creeeLe: 'x', coutCentimes: -5, devise: 'CHF', coutEstime: true }, { id: 'T2', texte: 'b', creeeLe: 'x', coutCentimes: Number.NaN },
        { id: 'T3', texte: 'c', creeeLe: 'x', echeance: 'demain', precision: 'mois' }, { id: 'T4', texte: 'd', creeeLe: 'x', coutCentimes: 0, devise: 'CHF' }
      ]
    })!;
    expect(d.categorie!.chemin).toEqual(['Local', 'Eau']);
    expect(d.suivi!.evenements.map(e => e.id)).toEqual(['E1']);
    const [t1, t2, t3, t4] = d.taches!;
    for (const t of [t1, t2]) { expect(t.coutCentimes).toBeUndefined(); expect(t.devise).toBeUndefined(); expect(t.coutEstime).toBeUndefined(); }
    expect(t3.echeance).toBeUndefined();
    expect(t3.precision).toBeUndefined();
    expect(t4.coutCentimes).toBe(0);
  });

  it('étiquettes, rattachement et propositions d’un message : forme inconnue écartée', () => {
    const m = lireMessage({
      id: 'M', type: 'carnet-message', title: 'x', status: 'done',
      carnetMessage: {
        texte: 'x', le: '2026-11-20T08:00:00.000Z', depuis: 'liste', rangement: 'ia', effets: [],
        etiquettes: [{ carnetId: 'C', sorte: 'cout', montantCentimes: 100, devise: 'CHF', estime: true }, { carnetId: 'C', sorte: 'inconnue' }, { sorte: 'cout' }],
        rattache: { carnetId: 'C', citation: '' }, propositionsSuivi: [{ sorte: 'tache', carnetId: 'C', texte: 'a' }, { sorte: 'danse', carnetId: 'C' }, { sorte: 'retenir' }]
      }
    } as unknown as CreativeItem)!;
    expect(m.carnetMessage.etiquettes).toEqual([{ carnetId: 'C', sorte: 'cout', montantCentimes: 100, devise: 'CHF', estime: true, origine: 'vous' }]);
    expect(m.carnetMessage.rattache).toBeUndefined();
    expect(m.carnetMessage.propositionsSuivi).toEqual([{ sorte: 'tache', carnetId: 'C', texte: 'a', origine: 'vous' }]);
  });

  it('un carnet d’avant le suivi (aucun champ neuf) se relit sans en gagner un : aucune réécriture', () => {
    const ancien = etat.find(d => d.id === IDS_SUIVI.chambreFroide)!;
    const relu = lireCarnet(ancien)!;
    for (const cle of ['genre', 'categorie', 'suivi', 'taches']) expect(relu.carnet).not.toHaveProperty(cle);
    expect(carnet(IDS_SUIVI.chambreFroide).carnet.facons[0]).not.toHaveProperty('suivi');
  });
});
