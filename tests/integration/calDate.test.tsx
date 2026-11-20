/**
 * CAL-PASSE (20.11) : « modifier un évènement ne l'update pas à la bonne date, bref c'est une catastrophe ».
 *
 * La date se joue de bout en bout, sur la couche locale réelle (StorageService, FinanceService, FirestoreRepo en `?dev-local`) : pour chaque type
 * de chose (brassin, fête, vente, achat, papier, travaux, idée du Carnet), changer la date PAR LA FEUILLE (Modifier › Enregistrer) et PAR LE GLISSER
 * l'écrit à cette date, et la chose relue (modèle recalculé depuis le stockage, comme après un rechargement) est à cette date.
 * Rien n'est simulé : le port est `portParDefaut()`.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { Batch, CreativeItem } from '../../src/types';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { appliquer, portParDefaut } from '../../src/ui/calendrier/ecritures';
import { brouillonDepuisChose, brouillonVide, toucherSemaine, versModification, enregistrementIdee, ecritureDeAjout } from '../../src/domain/calendrierAjout';
import { deplacer, deplacerJours, type ContexteGestes } from '../../src/domain/calendrierGestes';
import { plannedBrewDate } from '../../src/domain/batchSchedule';
import { isoDate } from '../../src/domain/finance/ledger';
import { ajouterJours, iconesIdees, lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';

/* vendredi 20 novembre 2026 ; sa semaine commence le lundi 16 */
const AUJ = '2026-11-20';
const LUNDI = lundiDe(AUJ);
const PROFIL = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 900_000, confirmed: true } } as FinancialProfile;

const entrees = () => ({
  aujourdhui: AUJ, transactions: [], payments: [], plans: FinanceService.getPlans(), profile: PROFIL, assets: [], batches: StorageService.getBatches(), stockItems: [],
  items: StorageService.getCreativeItems(), recettes: [], reglages: REGLAGES_VIDES
});
/** Recalculé depuis le stockage, comme à l'ouverture de l'onglet après un rechargement. */
const modele = () => construireModele(entrees());
const choseDe = (genre: string, id: string): ChoseCalendrier | undefined => modele().choses.find(c => (c.source as { id?: string }).id === id && c.source.genre === genre);
const ctxGestes = (): ContexteGestes => {
  const m = modele();
  return { aujourdhui: AUJ, batches: StorageService.getBatches(), plans: FinanceService.getPlans(), courbe: m.courbe, choses: m.choses } as unknown as ContexteGestes;
};

const idCree = (() => { let n = 0; return (p: string) => `ZZ-${p}-${++n}`; })();
const fete = (date: string, extra: Partial<CreativeItem> = {}): CreativeItem => ({ id: idCree('FETE'), type: 'event', title: 'ZZ TEST — Fête', status: 'todo', date, ...extra }) as CreativeItem;
const plan = (date: string, direction: 'in' | 'out', category: FinancialPlan['category'], extra: Partial<FinancialPlan> = {}): FinancialPlan => ({
  id: idCree('PLAN'), title: `ZZ TEST — ${category}`, date, amountCents: 12_300, direction, category, source: 'manual', status: 'active', createdAt: '2026-11-01T12:00:00.000Z', ...extra
}) as FinancialPlan;
const brassin = (date: string): Batch => ({ id: idCree('LOT'), name: 'ZZ TEST — Brassin', style: 'IPA', volumeL: 100, brewDate: '', status: 'planifie', gravityLog: [], plannedBrewDate: date, stockAccountingVersion: 1 }) as unknown as Batch;

/** La date ÉCRITE dans la source (couche locale), telle que le rechargement la relira. */
const ecrite = (genre: string, id: string): string | undefined => (genre === 'plan' ? FinanceService.getPlans().find(p => p.id === id)?.date : StorageService.getCreativeItems().find(i => i.id === id)?.date);

/** Modifier › (une autre semaine) › Enregistrer : la feuille ouverte sur la chose, le brouillon réglé, l'écriture de l'app. */
async function modifierParLaFeuille(chose: ChoseCalendrier, semaine?: string, titre?: string) {
  let b = brouillonDepuisChose(chose);
  if (semaine) b = toucherSemaine(b, semaine);
  if (titre) b = { ...b, titre };
  const m = versModification(b, chose, AUJ);
  if (m.ok === false) throw new Error(m.raison);
  await appliquer(m.ecritures, portParDefaut());
}
async function glisser(chose: ChoseCalendrier, semaines: number) {
  const r = deplacer(chose, semaines, ctxGestes());
  if (r.ok === false) throw new Error(r.raison);
  await appliquer(r.ecritures, portParDefaut());
  return r;
}

beforeEach(() => { window.history.replaceState(null, '', '/?dev-local'); });

/** Les cinq types qui se règlent par Modifier et par le glisser (une chose du Carnet et un brassin ont leur chemin plus bas). */
const GENRES = [
  { nom: 'fête', rangee: 'fetes', genre: 'creative', poser: (date: string) => { const i = fete(date); StorageService.addCreativeItem(i); return i.id; } },
  { nom: 'vente', rangee: 'ventes', genre: 'plan', poser: (date: string) => { const p = plan(date, 'in', 'recettes'); FinanceService.savePlan(p); return p.id; } },
  { nom: 'achat', rangee: 'achats', genre: 'plan', poser: (date: string) => { const p = plan(date, 'out', 'brassage'); FinanceService.savePlan(p); return p.id; } },
  { nom: 'papier', rangee: 'papiers', genre: 'plan', poser: (date: string) => { const p = plan(date, 'out', 'chargesFixes'); FinanceService.savePlan(p); return p.id; } },
  { nom: 'travaux', rangee: 'travaux', genre: 'plan', poser: (date: string) => { const p = plan(date, 'out', 'renovation'); FinanceService.savePlan(p); return p.id; } }
] as const;

describe.each(GENRES)('CAL-PASSE-date : $nom — la date écrite est celle que la feuille et le glisser annoncent, relue après rechargement', g => {
  it('Modifier sans toucher à la semaine (changer seulement le nom) garde la date : un mercredi reste ce mercredi', async () => {
    const id = g.poser('2026-12-09');
    const avant = choseDe(g.genre, id)!;
    expect(avant.rangee).toBe(g.rangee);
    expect(avant.debut).toBe('2026-12-09');
    await modifierParLaFeuille(avant, undefined, 'ZZ TEST — renommé');
    const apres = choseDe(g.genre, id)!;
    expect(apres.titre).toBe('ZZ TEST — renommé');
    expect(apres.debut).toBe('2026-12-09');
  });

  it('Modifier vers une autre semaine à venir : le jour de la semaine est gardé (un mercredi 9 déc. → le mercredi 13 janv.), relu après rechargement (CAL-PASSE 21.11, n° 2)', async () => {
    const id = g.poser('2026-12-09');
    await modifierParLaFeuille(choseDe(g.genre, id)!, '2027-01-11');
    expect(choseDe(g.genre, id)!.debut).toBe('2027-01-13');
  });

  /* Le passé : ce qui est ÉCRIT (le document de la couche locale), pas ce que le modèle montre — le modèle part de la semaine en cours (52 semaines),
     la prévision ramène une échéance passée à aujourd'hui : c'est la frise (voie G), pas la date, qui doit pouvoir remonter. */
  it('Modifier vers une semaine PASSÉE : la date écrite dans la source est ce jour passé, sans retomber à aujourd’hui', async () => {
    const id = g.poser('2026-12-09');
    await modifierParLaFeuille(choseDe(g.genre, id)!, '2026-10-26');
    expect(ecrite(g.genre, id)).toBe('2026-10-28'); /* le mercredi de cette semaine passée (le jour d'origine est un mercredi) */
  });

  it('Modifier vers la semaine en cours : le jour est dans la semaine en cours', async () => {
    const id = g.poser('2026-12-09');
    await modifierParLaFeuille(choseDe(g.genre, id)!, LUNDI);
    const jour = choseDe(g.genre, id)!.debut;
    expect(lundiDe(jour)).toBe(LUNDI);
  });

  it('Modifier une chose du passé sans toucher à la semaine garde son jour écrit', async () => {
    const id = g.poser('2026-10-28');
    const avant = { id: `x-${id}`, rangee: g.rangee, titre: 'ZZ', debut: '2026-10-28', fin: '2026-10-28', centimes: g.rangee === 'ventes' ? 1000 : -1000, source: g.genre === 'plan' ? { genre: 'plan', id, origine: 'manual', statut: 'active' } : { genre: 'creative', id, type: 'event' }, ouvre: { ecran: 'plan', id }, deplacable: true } as ChoseCalendrier;
    await modifierParLaFeuille(avant, undefined, 'ZZ TEST — passé renommé');
    expect(ecrite(g.genre, id)).toBe('2026-10-28');
  });

  it('glisser de +2 semaines puis de −3 semaines : le jour de la semaine est gardé, relu à chaque fois', async () => {
    const id = g.poser('2026-12-09');
    await glisser(choseDe(g.genre, id)!, 2);
    expect(choseDe(g.genre, id)!.debut).toBe('2026-12-23');
    await glisser(choseDe(g.genre, id)!, -3);
    expect(choseDe(g.genre, id)!.debut).toBe('2026-12-02');
  });

  it('glisser vers le passé (−4 semaines depuis aujourd’hui + 1 semaine) : la date écrite recule de 4 semaines, rien ne la ramène à aujourd’hui', async () => {
    const id = g.poser(ajouterJours(AUJ, 7));
    const r = await glisser(choseDe(g.genre, id)!, -4);
    expect(r.ok).toBe(true);
    expect(ecrite(g.genre, id)).toBe(ajouterJours(AUJ, -21));
  });

  it('glisser une chose d’une fenêtre (3 semaines) : la fenêtre entière suit, la date de début aussi', async () => {
    const id = g.poser('2026-12-07');
    const p = g.genre === 'plan' ? FinanceService.getPlans().find(x => x.id === id)! : undefined;
    const fenetre = { du: '2026-12-07', au: '2026-12-27' };
    if (p) FinanceService.savePlan({ ...p, fenetre } as FinancialPlan);
    else StorageService.updateCreativeItem({ ...StorageService.getCreativeItems().find(x => x.id === id)!, fenetre } as CreativeItem);
    const chose = choseDe(g.genre, id)!;
    expect(chose.fenetre).toMatchObject(fenetre);
    await glisser(chose, 1);
    const apres = choseDe(g.genre, id)!;
    expect(apres.debut).toBe('2026-12-14');
    expect(apres.fin).toBe('2027-01-03');
  });
});

describe('CAL-PASSE-date : une chose à fenêtre (fête, achat, travaux) et « Sans date › Poser »', () => {
  it('Modifier une fenêtre de 3 semaines (S50 à S52) vers S2 : la fenêtre se déplace entière, sa longueur gardée, relue après rechargement', async () => {
    const i = fete('2026-12-07', { fenetre: { du: '2026-12-07', au: '2026-12-27' } });
    StorageService.addCreativeItem(i);
    await modifierParLaFeuille(choseDe('creative', i.id)!, '2027-01-11');
    const apres = choseDe('creative', i.id)!;
    expect(apres.debut).toBe('2027-01-11');
    expect(apres.fin).toBe('2027-01-31');
  });

  it('Modifier : après le déplacement, un toucher plus tard règle la fin (comme à l’ajout), un toucher du début revient à une semaine', async () => {
    const i = fete('2026-12-09');
    StorageService.addCreativeItem(i);
    const chose = choseDe('creative', i.id)!;
    let b = toucherSemaine(brouillonDepuisChose(chose), '2027-01-11');
    expect(b).toMatchObject({ debut: '2027-01-11', fin: null });
    b = toucherSemaine(b, '2027-01-25');
    expect(b).toMatchObject({ debut: '2027-01-11', fin: '2027-01-25' });
    b = toucherSemaine(b, '2027-01-11');
    expect(b).toMatchObject({ debut: '2027-01-11', fin: null });
  });

  it('un achat à fenêtre enregistré sans toucher à la semaine garde sa fenêtre et son jour d’origine', async () => {
    const p = plan('2026-12-09', 'out', 'brassage', { fenetre: { du: '2026-12-09', au: '2026-12-27' } });
    FinanceService.savePlan(p);
    await modifierParLaFeuille(choseDe('plan', p.id)!, undefined, 'ZZ TEST — achat renommé');
    const apres = FinanceService.getPlans().find(x => x.id === p.id)!;
    expect(apres.fenetre).toMatchObject({ du: '2026-12-09', au: '2026-12-27' });
    expect(apres.date).toBe('2026-12-09');
  });

  it('« Sans date › Poser » une fête en S2 : la semaine touchée est la semaine posée (pas « de cette semaine à S2 »)', async () => {
    const i = { ...fete('2026-12-09'), date: undefined } as unknown as CreativeItem;
    delete (i as { date?: string }).date;
    StorageService.addCreativeItem(i);
    const sans = modele().sansDate.find(c => (c.source as { id?: string }).id === i.id)!;
    expect(sans).toBeDefined();
    let b = { ...brouillonDepuisChose(sans), debut: LUNDI, debutChoisi: true };
    b = toucherSemaine(b, '2027-01-11');
    expect(b).toMatchObject({ debut: '2027-01-11', fin: null });
    const m = versModification(b, sans, AUJ);
    expect(m.ok).toBe(true);
    if (m.ok) await appliquer(m.ecritures, portParDefaut());
    expect(choseDe('creative', i.id)!.debut).toBe('2027-01-11');
  });
});

describe('CAL-PASSE-date : brassin — glisser, relu', () => {
  it('un brassin glissé de +2 semaines : sa fin prévue écrite suit de 14 jours, la longueur reste', async () => {
    const b = { ...brassin('2026-12-14'), finPrevue: '2027-01-11' } as Batch;
    StorageService.addBatch(b);
    await glisser(choseDe('batch', b.id)!, 2);
    const relu = StorageService.getBatches().find(x => x.id === b.id)!;
    expect(relu.finPrevue).toBe('2027-01-25');
  });

  it('un brassin planifié (lundi) glissé de +2 semaines puis de −1 : sa date prévue relue suit', async () => {
    const b = brassin('2026-12-14');
    StorageService.addBatch(b);
    const lire = () => choseDe('batch', b.id)!;
    expect(lire().debut).toBe('2026-12-14');
    await glisser(lire(), 2);
    expect(lire().debut).toBe('2026-12-28');
    await glisser(lire(), -1);
    expect(lire().debut).toBe('2026-12-21');
  });

  it('un brassin planifié un mercredi garde son mercredi', async () => {
    const b = brassin('2026-12-16');
    StorageService.addBatch(b);
    await glisser(choseDe('batch', b.id)!, 1);
    expect(choseDe('batch', b.id)!.debut).toBe('2026-12-23');
  });

  it('un brassin pas brassé, prévu dans le passé : ce que le geste écrit (plannedBrewDate) est ce que la couche locale relit', async () => {
    const b = brassin('2026-11-02');
    StorageService.addBatch(b);
    const r = await glisser(choseDe('batch', b.id)!, 1);
    const ecrit = isoDate((r.ecritures[0] as { patch: { plannedBrewDate: string } }).patch.plannedBrewDate);
    expect(isoDate(plannedBrewDate(StorageService.getBatches().find(x => x.id === b.id)!))).toBe(ecrit);
  });

  it('au jour (vue Jour) : un brassin glissé de +3 jours est écrit +3 jours', async () => {
    const b = brassin('2026-12-14');
    StorageService.addBatch(b);
    const r = deplacerJours(choseDe('batch', b.id)!, 3, ctxGestes());
    expect(r.ok).toBe(true);
    if (r.ok) await appliquer(r.ecritures, portParDefaut());
    expect(choseDe('batch', b.id)!.debut).toBe('2026-12-17');
  });
});

describe('CAL-PASSE-date : idée du Carnet — notée à une semaine, relue à cette semaine', () => {
  it('« Noter une idée » en S50 : relue sur l’icône de S50 (lundi 7 déc.), puis après un rechargement', async () => {
    const e = enregistrementIdee('ZZ TEST — idée de saison', '2026-12-09', { nouvelId: p => `${p}-ZZ-IDEE` });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    await appliquer([ecritureDeAjout(e.enregistrement)], portParDefaut());
    const icones = iconesIdees(StorageService.getCreativeItems()).filter(i => i.titre.includes('idée de saison'));
    expect(icones).toHaveLength(1);
    expect(icones[0].lundi).toBe('2026-12-07');
  });
});

/* le brouillon d'une chose posée : sa semaine préréglée est celle de son jour, sans changer la date quand on n'y touche pas */
describe('CAL-PASSE-date : le brouillon d’une chose porte son jour', () => {
  it('brouillonDepuisChose garde la semaine ; versModification sans changement de semaine n’écrit pas un autre jour', () => {
    const chose = { id: 'argent-P', rangee: 'achats', titre: 'T', debut: '2026-12-09', fin: '2026-12-09', centimes: -1000, source: { genre: 'plan', id: 'P', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan', id: 'P' }, deplacable: true } as ChoseCalendrier;
    const b = brouillonDepuisChose(chose);
    expect(b.debut).toBe('2026-12-07');
    const m = versModification({ ...b, titre: 'T2' }, chose);
    expect(m.ok).toBe(true);
    if (m.ok) expect((m.ecritures[0] as { patch: { date: string } }).patch.date).toBe('2026-12-09');
    void brouillonVide;
  });
});
