/**
 * D451, voie afaire : les règles de « À faire » et de la carte « À ranger » (afaireRegles.ts). Fixture « ZZ TEST — » (`fixtureSuivi`), aujourd'hui = mardi
 * 24 nov. 2026. Cas neufs aussi (fête, assurance, photo seule, texte vague, mois et année qui changent), jamais les seuls exemples de la maquette (B23).
 */
import { describe, expect, it } from 'vitest';
import { fixtureSuivi, IDS_SUIVI, MAINTENANT_SUIVI } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc, type MessageDoc, type Tache } from '../../src/domain/carnets/modele';
import { appliquerEcritures, idPlanDuCarnet } from '../../src/domain/carnets/operations';
import { aFaireDe, poserEcheance } from '../../src/domain/carnets/taches';
import {
  aujourdhuiDe, choixActuel, choixEcheances, coutDeTache, dansAVenir, dernierTouche, libelleGroupe, montantDUnDevis, motsDeLaCarte, planDeLAchat,
  propositionARanger, quandTouche, texteMince
} from '../../src/ui/carnets/afaireRegles';

const etat = fixtureSuivi();
const carnets = lireCarnets(etat, { archives: true });
const messages = lireMessages(etat);
const carnet = (id: string): CarnetDoc => carnets.find(c => c.id === id)!;
const tache = (id: string): Tache => carnets.flatMap(c => c.carnet.taches ?? []).find(t => t.id === id)!;
const avecTaches = (c: CarnetDoc, taches: Tache[]): CarnetDoc => ({ ...c, carnet: { ...c.carnet, taches } });
const t = (id: string, x: Partial<Tache> = {}): Tache => ({ id, texte: id, origine: 'vous', creeeLe: '2026-11-01T10:00:00.000Z', ...x });
const groupesDe = (cs: CarnetDoc[], quand: string) => Object.fromEntries(aFaireDe(cs, quand).groupes.map(g => [g.cle, g.taches.map(x => x.id)]));

describe('groupes : libellés et bornes', () => {
  it('libellés de la maquette, plus « Plus loin » pour les mois suivants', () => {
    expect(['cette-semaine', 'fin-du-mois', 'plus-loin', 'un-jour'].map(k => libelleGroupe(k as never))).toEqual(['Cette semaine', 'Fin du mois', 'Plus loin', 'Un jour']);
  });

  it('la fixture : trois groupes de la maquette, une tâche datée en décembre dans « Plus loin »', () => {
    const l = aFaireDe(carnets, MAINTENANT_SUIVI);
    expect(l.groupes.map(g => g.cle)).toEqual(['cette-semaine', 'fin-du-mois', 'plus-loin', 'un-jour']);
    expect(l.groupes[0].taches.map(x => x.id)).toEqual(expect.arrayContaining(['ZZ-SE-T1', 'ZZ-SE-T2', 'ZZ-SF-T1']));
    expect(l.groupes[1].taches.map(x => x.id)).toEqual(expect.arrayContaining(['ZZ-SV-T1', 'ZZ-SF-T2']));
  });

  it('dimanche et lundi : la semaine change au lundi, une tâche en retard reste « Cette semaine »', () => {
    const base = carnet(IDS_SUIVI.fete);
    const cs = [avecTaches(base, [t('retard', { echeance: '2026-11-09', precision: 'semaine' }), t('lundi', { echeance: '2026-11-30', precision: 'semaine' }), t('suivante', { echeance: '2026-12-07', precision: 'semaine' })])];
    expect(groupesDe(cs, '2026-11-29')).toEqual({ 'cette-semaine': ['retard'], 'fin-du-mois': ['lundi'], 'plus-loin': ['suivante'] });
    expect(groupesDe(cs, '2026-11-30')).toEqual({ 'cette-semaine': ['retard', 'lundi'], 'plus-loin': ['suivante'] });
  });

  it('fin de mois et d\'année : le 31 déc., la semaine du 4 janv. est « Plus loin »', () => {
    const cs = [avecTaches(carnet(IDS_SUIVI.fete), [t('fin', { echeance: '2026-12-28', precision: 'mois' }), t('janv', { echeance: '2027-01-04', precision: 'semaine' })])];
    expect(groupesDe(cs, '2026-12-31')).toEqual({ 'cette-semaine': ['fin'], 'plus-loin': ['janv'] });
    expect(groupesDe(cs, '2026-12-01')).toEqual({ 'fin-du-mois': ['fin'], 'plus-loin': ['janv'] });
  });

  it('fuseau Europe/Zurich : à 00 h 30 le lundi, c\'est déjà la semaine suivante', () => {
    if (Intl.DateTimeFormat().resolvedOptions().timeZone !== 'Europe/Zurich') return; // l'appareil du brasseur ; ailleurs, les bornes ci-dessus suffisent
    expect(aujourdhuiDe('2026-11-29T22:30:00.000Z')).toBe('2026-11-29');
    expect(aujourdhuiDe('2026-11-29T23:30:00.000Z')).toBe('2026-11-30');
    expect(aujourdhuiDe(new Date('2026-07-12T22:30:00.000Z'))).toBe('2026-07-13'); // heure d'été
  });

  it('une tâche faite ou d\'un problème résolu ne se réclame plus', () => {
    const faite = avecTaches(carnet(IDS_SUIVI.fete), [t('faite', { faiteLe: '2026-11-20T10:00:00.000Z' })]);
    expect(aFaireDe([faite], MAINTENANT_SUIVI).total).toBe(0);
    const resolu = carnets.find(c => c.id === IDS_SUIVI.pompe)!;
    expect(aFaireDe([avecTaches(resolu, [t('x')])], MAINTENANT_SUIVI).total).toBe(0);
  });
});

describe('coût : absent n\'est pas 0, « ≈ » gardé', () => {
  it('estimé : « ≈ 35 CHF » ; ferme : « 540 CHF » ; centimes : virgule', () => {
    expect(coutDeTache(tache('ZZ-SF-T1'))).toEqual({ texte: '≈ 35 CHF', estime: true });
    expect(coutDeTache(tache('ZZ-SV-T1'))).toEqual({ texte: '540 CHF', estime: false });
    expect(coutDeTache({ coutCentimes: 1250 })?.texte).toBe('12,50 CHF');
    expect(coutDeTache({ coutCentimes: 4500, devise: 'EUR' })?.texte).toBe('45 EUR');
    expect(coutDeTache({ coutCentimes: 123400 })?.texte).toBe('1 234 CHF');
  });
  it('sans coût (ou nul) : aucun jeton, jamais « 0 CHF »', () => {
    expect(coutDeTache({})).toBeNull();
    expect(coutDeTache({ coutCentimes: 0 })).toBeNull();
    expect(coutDeTache(tache('ZZ-SM-T1'))).toBeNull();
  });
  it('un montant de devis du fil se dit en sous-ligne ; un estimé ou un coût sans devis reste un jeton', () => {
    const devis = { carnetId: IDS_SUIVI.ecoulement, messageId: 'ZZ-SE-M5', coutCentimes: 85000 };
    expect(montantDUnDevis(devis, messages)).toBe(true);
    expect(montantDUnDevis({ ...devis, coutCentimes: 6000 }, messages)).toBe(false);
    expect(montantDUnDevis({ ...devis, coutEstime: true }, messages)).toBe(false);
    expect(montantDUnDevis({ ...devis, messageId: undefined }, messages)).toBe(false);
    expect(montantDUnDevis({ ...devis, carnetId: IDS_SUIVI.vapeur }, messages)).toBe(false);
  });
});

describe('lien « dans À venir » et plan idempotent', () => {
  const vapeur = carnet(IDS_SUIVI.vapeur);
  const condB = (): any => ({ ...tache('ZZ-SV-T1'), carnetId: vapeur.id, carnetTitre: vapeur.title });
  const planVapeur = (status: string) => ({ id: idPlanDuCarnet(vapeur.id), status: status as never });

  it('l\'achat de l\'option retenue, plan vivant : « dans À venir » ; annulé, payé ou absent : non', () => {
    expect(dansAVenir(condB(), vapeur, [planVapeur('draft')])).toBe(true);
    expect(dansAVenir(condB(), vapeur, [planVapeur('active')])).toBe(true);
    expect(dansAVenir(condB(), vapeur, [planVapeur('cancelled')])).toBe(false);
    expect(dansAVenir(condB(), vapeur, [planVapeur('completed')])).toBe(false);
    expect(dansAVenir(condB(), vapeur, [])).toBe(false);
  });
  it('une autre tâche du même carnet (autre option, aucune option) ne l\'est pas ; un planId propre prime', () => {
    expect(dansAVenir({ ...condB(), optionId: undefined }, vapeur, [planVapeur('draft')])).toBe(false);
    expect(dansAVenir({ ...condB(), planId: 'PLAN-X' }, vapeur, [planVapeur('draft')])).toBe(false);
    expect(dansAVenir({ ...condB(), planId: 'PLAN-X' }, vapeur, [{ id: 'PLAN-X', status: 'draft' }])).toBe(true);
    expect(dansAVenir({ ...condB(), derivee: true }, vapeur, [planVapeur('draft')])).toBe(false);
  });
  it('achat daté → un plan `PLAN-CARNET-<id>`, daté et chiffré comme la tâche, le même à chaque appel', () => {
    const le = '2026-11-24T12:00:00.000Z';
    const p1 = planDeLAchat(vapeur, tache('ZZ-SV-T1'), le)!;
    const p2 = planDeLAchat(vapeur, tache('ZZ-SV-T1'), le)!;
    expect(p1.id).toBe(`PLAN-CARNET-${vapeur.id}`);
    expect(p2).toEqual(p1);
    expect(p1).toMatchObject({ date: '2026-11-30', amountCents: 54000, direction: 'out', status: 'draft' });
    expect(p1.upgrade).toMatchObject({ datePrecision: 'month', sourceCarnetId: vapeur.id });
  });
  it('seul l\'achat de l\'option retenue part en plan : une autre tâche, sans date ou faite, reste une tâche', () => {
    const le = '2026-11-24T12:00:00.000Z';
    expect(planDeLAchat(vapeur, { ...tache('ZZ-SV-T1'), optionId: undefined }, le)).toBeNull();
    expect(planDeLAchat(vapeur, { ...tache('ZZ-SV-T1'), echeance: undefined }, le)).toBeNull();
    expect(planDeLAchat(vapeur, { ...tache('ZZ-SV-T1'), faiteLe: le }, le)).toBeNull();
    expect(planDeLAchat(carnet(IDS_SUIVI.fusible), tache('ZZ-SF-T2'), le)).toBeNull();
  });
});

describe('changer l\'échéance', () => {
  it('depuis le mardi 24 nov. : cinq choix, chacun avec son lundi', () => {
    const c = choixEcheances(MAINTENANT_SUIVI);
    expect(c.map(x => [x.cle, x.echeance, x.precision])).toEqual([
      ['cette-semaine', '2026-11-23', 'semaine'], ['semaine-prochaine', '2026-11-30', 'semaine'], ['fin-du-mois', '2026-11-30', 'mois'], ['mois-prochain', '2026-12-28', 'mois'], ['un-jour', null, 'semaine']
    ]);
  });
  it('dans la dernière semaine du mois, « Fin du mois » disparaît (même échéance que « Cette semaine »)', () => {
    expect(choixEcheances('2026-11-30').map(x => x.cle)).toEqual(['cette-semaine', 'semaine-prochaine', 'mois-prochain', 'un-jour']);
    expect(choixEcheances('2026-12-31').map(x => x.cle)).not.toContain('fin-du-mois');
  });
  it('fin d\'année : « le mois prochain » est janvier', () => {
    expect(choixEcheances('2026-12-10').find(x => x.cle === 'mois-prochain')).toMatchObject({ echeance: '2027-01-25', precision: 'mois' });
  });
  it('le choix actuel d\'une tâche se lit (sans date : « Un jour ») ; une date posée ailleurs : aucun', () => {
    const c = choixEcheances(MAINTENANT_SUIVI);
    expect(choixActuel(tache('ZZ-SV-T1'), c)?.cle).toBe('fin-du-mois');
    expect(choixActuel(tache('ZZ-SM-T1'), c)?.cle).toBe('cette-semaine');
    expect(choixActuel(t('libre'), c)?.cle).toBe('un-jour');
    expect(choixActuel(t('ailleurs', { echeance: '2027-03-01' }), c)).toBeUndefined();
  });
  it('chaque choix, passé à `poserEcheance`, range la tâche dans le bon groupe', () => {
    for (const x of choixEcheances(MAINTENANT_SUIVI)) {
      const r = poserEcheance(etat, { carnetId: IDS_SUIVI.fusible, tacheId: 'ZZ-SF-T1', echeance: x.date, precision: x.precision });
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      const apres = lireCarnets(appliquerEcritures(etat, r.ecritures), { archives: true });
      const g = aFaireDe(apres, MAINTENANT_SUIVI).groupes.find(gr => gr.taches.some(y => y.id === 'ZZ-SF-T1'))!.cle;
      expect(g).toBe({ 'cette-semaine': 'cette-semaine', 'semaine-prochaine': 'fin-du-mois', 'fin-du-mois': 'fin-du-mois', 'mois-prochain': 'plus-loin', 'un-jour': 'un-jour' }[x.cle]);
    }
  });
});

describe('carte « À ranger » : texte mince', () => {
  it('des mots vides seuls ne disent rien (cas de la maquette et cas neufs)', () => {
    for (const s of ['truc à voir', 'machin à regarder', 'chose à vérifier', 'À voir', 'un bidule', '', '   ', '…']) expect(texteMince(s), s).toBe(true);
    expect(texteMince(undefined)).toBe(true);
  });
  it('un mot du sujet ou un chiffre suffit', () => {
    for (const s of ['tuyau à voir', 'fête 14 juin', 'assurance', 'tireuse, 4 fûts', 'chambre froide', '12']) expect(texteMince(s), s).toBe(false);
  });
});

describe('carte « À ranger » : proposition (option B, jamais une description de la photo)', () => {
  const photo = 'data:image/svg+xml;utf8,<svg/>';
  const el = { carnetId: IDS_SUIVI.photo, photo, le: MAINTENANT_SUIVI };

  it('photo seule : le problème ouvert touché en dernier, sa raison dite, rien d\'inventé', () => {
    const p = propositionARanger(el, carnets, messages, MAINTENANT_SUIVI);
    expect(p).toMatchObject({ sorte: 'rattacher', carnetId: IDS_SUIVI.fusible, titre: carnet(IDS_SUIVI.fusible).title, raison: 'dernier touché : aujourd’hui' });
    expect(Object.keys(p).sort()).toEqual(['carnetId', 'le', 'raison', 'sorte', 'titre']);
  });
  it('ce qui est proposé est toujours un problème ouvert : jamais le carnet de la photo, un résolu, un autre genre', () => {
    expect(propositionARanger(el, [carnet(IDS_SUIVI.photo), carnet(IDS_SUIVI.pompe), carnet(IDS_SUIVI.fete), carnet(IDS_SUIVI.assurance)], messages, MAINTENANT_SUIVI)).toEqual({ sorte: 'aucune' });
    expect(propositionARanger(el, [], messages, MAINTENANT_SUIVI)).toEqual({ sorte: 'aucune' });
  });
  it('le plus récent l\'emporte, sa date se dit avec le recul : « il y a 6 jours »', () => {
    const p = propositionARanger(el, [carnet(IDS_SUIVI.ecoulement), carnet(IDS_SUIVI.moisissure)], messages, MAINTENANT_SUIVI);
    expect(p).toMatchObject({ sorte: 'rattacher', carnetId: IDS_SUIVI.ecoulement, raison: 'dernier touché : il y a 6 jours' });
  });
  it('un message du fil compte comme une écriture', () => {
    const tard: MessageDoc = { ...messages.find(m => m.id === 'ZZ-SE-M5')!, id: 'ZZ-TARD', carnetMessage: { ...messages.find(m => m.id === 'ZZ-SE-M5')!.carnetMessage, le: '2026-11-23T08:00:00.000Z' } };
    expect(dernierTouche(carnet(IDS_SUIVI.ecoulement), messages)).toBe('2026-11-18T12:00:00.000Z');
    expect(dernierTouche(carnet(IDS_SUIVI.ecoulement), [...messages, tard])).toBe('2026-11-23T08:00:00.000Z');
  });
  it('« truc à voir » sans photo : rien d\'autre écrit, reste ici ; avec mots du sujet, pas de proposition', () => {
    expect(propositionARanger({ texte: 'truc à voir', le: MAINTENANT_SUIVI }, carnets, messages, MAINTENANT_SUIVI)).toEqual({ sorte: 'rien-d-autre' });
    expect(propositionARanger({ texte: 'machin à regarder', le: MAINTENANT_SUIVI }, carnets, messages, MAINTENANT_SUIVI)).toEqual({ sorte: 'rien-d-autre' });
    expect(propositionARanger({ texte: 'tireuse, 4 fûts', le: MAINTENANT_SUIVI }, carnets, messages, MAINTENANT_SUIVI)).toEqual({ sorte: 'aucune' });
  });
  it('une photo avec des mots vides se range comme une photo seule', () => {
    expect(propositionARanger({ ...el, texte: 'truc à voir' }, carnets, messages, MAINTENANT_SUIVI).sorte).toBe('rattacher');
    expect(propositionARanger({ ...el, texte: 'raccord du frigo' }, carnets, messages, MAINTENANT_SUIVI)).toEqual({ sorte: 'aucune' });
  });
  it('la date se dit : aujourd\'hui, hier, il y a n jours, puis le jour', () => {
    expect([ '2026-11-24T08:00:00.000Z', '2026-11-23T08:00:00.000Z', '2026-11-21T08:00:00.000Z', '2026-11-12T08:00:00.000Z', '2026-11-26T08:00:00.000Z' ].map(d => quandTouche(d, MAINTENANT_SUIVI)))
      .toEqual(['aujourd’hui', 'hier', 'il y a 3 jours', 'le 12 nov.', 'aujourd’hui']);
  });
  it('les mots de la carte : photo seule, rien d\'autre écrit, sans problème ouvert', () => {
    expect(motsDeLaCarte(el, { sorte: 'aucune' })).toEqual({ tete: 'photo seule, sans texte', corps: 'Aucun problème ouvert où la ranger.' });
    expect(motsDeLaCarte({ texte: 'truc à voir', le: '' }, { sorte: 'rien-d-autre' })).toEqual({ tete: 'à ranger', corps: 'rien d’autre écrit : reste ici' });
    expect(motsDeLaCarte(el, { sorte: 'rattacher', carnetId: 'x', titre: 'X', raison: 'r', le: '' }).corps).toBeNull();
  });
});
