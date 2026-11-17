import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import type { ChoseCalendrier } from '../../src/domain/calendrier';
import {
  appliquerPuce, brouillonDepuisChose, brouillonDepuisProposition, brouillonVide, choisirJours, demandeConfirmation, ecritureDeAjout, enregistrementIdee, nbSemaines, peutMettreDeCote,
  preteLe, puceJours, puces, resumeFenetre, toucherSemaine, valider, versEnregistrement, versModification, type BrouillonAjout, type ContexteAjout, type Enregistrement
} from '../../src/domain/calendrierAjout';
import { brassinsHabituels } from '../../src/domain/calendrierPropositions';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';

const S20 = '2026-05-11', S40 = '2026-09-28';
const ctx = (p: Partial<ContexteAjout> = {}): ContexteAjout => ({
  aujourdhui: '2026-05-11', recettes: [{ id: 'R-IPA', name: 'IPA maison', style: 'IPA', volumeL: 30 }, { id: 'R-STOUT', name: 'Stout', style: 'Stout', volumeL: 25 }],
  clients: [{ id: 'CL-1', name: 'Café du Pont' }, { id: 'CL-2', name: 'Bar Central' }], plans: [], choses: [], nouvelId: p2 => `${p2}-T1`, idBrassin: () => 'LOT-009', maintenant: '2026-05-11T10:00:00.000Z', ...p
});
const travaux = (): BrouillonAjout => ({ ...toucherSemaine(toucherSemaine({ ...brouillonVide('travaux', S20), titre: 'Rénovation des sols' }, S20), S40), signe: '-', centimes: 60000 });
const plan = (e: Enregistrement) => { if (e.cible !== 'plan') throw new Error('plan attendu'); return e.document; };
const reussi = (b: BrouillonAjout, c = ctx()) => { const r = versEnregistrement(b, c); if (!('enregistrement' in r)) throw new Error(r.raison); return r.enregistrement; };

describe('A12 : fenêtre à l’ajout, sans clavier (D-8, D-9, E45)', () => {
  it('le premier toucher fixe le début, un toucher plus tard la fin, toucher le début ou avant repart d’une semaine', () => {
    let b = { ...brouillonVide('travaux', '2026-11-16'), titre: 'x' };
    b = toucherSemaine(b, S20);
    expect(b).toMatchObject({ debut: S20, fin: null });
    b = toucherSemaine(b, S40);
    expect(b).toMatchObject({ debut: S20, fin: S40 });
    expect(resumeFenetre(b)).toBe('S20 → S40 · 21 sem.');
    expect(nbSemaines(b)).toBe(21);
    expect(toucherSemaine(b, S20)).toMatchObject({ debut: S20, fin: null });
    expect(toucherSemaine(b, '2026-05-04')).toMatchObject({ debut: '2026-05-04', fin: null });
    expect(resumeFenetre(toucherSemaine(b, S20))).toBeNull();
  });
  it('Travaux « Rénovation des sols », S20 → S40, 5 j actifs, −600 CHF : un plan manuel de catégorie renovation, du lundi S20 au dimanche S40', () => {
    const doc = plan(reussi(choisirJours(travaux(), 5)));
    expect(doc).toMatchObject({ source: 'manual', category: 'renovation', direction: 'out', date: S20, amountCents: 60000, status: 'active', title: 'Rénovation des sols' });
    expect(doc.fenetre).toEqual({ du: S20, au: '2026-10-04', joursActifs: 5 });
  });
  it('avec « Mettre de côté » : la date tombe au dimanche S40, fenetre.miseDeCote', () => {
    const b = { ...choisirJours(travaux(), 5), miseDeCote: true };
    expect(peutMettreDeCote(b)).toBe(true);
    const doc = plan(reussi(b));
    expect(doc.date).toBe('2026-10-04');
    expect(doc.fenetre).toEqual({ du: S20, au: '2026-10-04', joursActifs: 5, miseDeCote: true });
  });
  it('sans fin ni jours actifs : pas de fenetre ; sans puce de jours : la clé joursActifs est absente, jamais 0', () => {
    const seul = plan(reussi({ ...toucherSemaine({ ...brouillonVide('travaux'), titre: 'Pose du sol' }, S20), centimes: 60000 }));
    expect('fenetre' in seul).toBe(false);
    expect(seul.date).toBe(S20);
    const sansJours = plan(reussi(travaux()));
    expect(sansJours.fenetre).toEqual({ du: S20, au: '2026-10-04' });
    expect('joursActifs' in (sansJours.fenetre as object)).toBe(false);
    expect(peutMettreDeCote({ ...toucherSemaine({ ...brouillonVide('travaux'), titre: 'x' }, S20), centimes: 100 })).toBe(false);
  });
  it('une activité de 3 j sur une seule semaine : fenêtre lundi–dimanche de cette semaine ; 10 j sur une semaine refusés', () => {
    const activite = { ...brouillonVide('activites', S20), titre: 'Nettoyage fenêtres', debutChoisi: true, joursActifs: 3 };
    const e = reussi(activite);
    expect(e.cible).toBe('creative');
    if (e.cible === 'creative') {
      expect(e.document).toMatchObject({ type: 'event', activite: true, status: 'todo', date: S20, title: 'Nettoyage fenêtres', fenetre: { du: S20, au: '2026-05-17', joursActifs: 3 } });
      expect('estimatedCost' in e.document).toBe(false);
    }
    expect(valider({ ...activite, joursActifs: 10 })).toMatchObject({ ok: false });
    expect(versEnregistrement({ ...activite, joursActifs: 10 }, ctx())).toMatchObject({ ok: false });
    const grisees = puceJours(activite).filter(p => p.grisee).map(p => p.jours);
    expect(grisees).toEqual([10]);
    expect(choisirJours(activite, 10)).toBe(activite);
    expect(choisirJours(choisirJours(activite, 5), 5).joursActifs).toBeUndefined();
  });
  it('une fête tient sa semaine : un CreativeItem event, sans fenetre ; Ventes et Papiers prennent une date seule', () => {
    const fete = reussi({ ...brouillonVide('fetes', S20), titre: 'Marché de Noël', debutChoisi: true });
    expect(fete.cible === 'creative' && fete.document).toMatchObject({ type: 'event', status: 'todo', date: S20 });
    expect(fete.cible === 'creative' && 'fenetre' in fete.document).toBe(false);
    const vente = toucherSemaine(toucherSemaine({ ...brouillonVide('ventes', S20), titre: 'Café du Pont' }, S20), S40);
    expect(vente).toMatchObject({ debut: S40, fin: null });
  });
  it('relu dans ModeleCalendrier : la chose va de S20 à S40 avec 5 points', () => {
    const doc = plan(reussi(choisirJours(travaux(), 5)));
    const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 1000000, confirmed: true } };
    const modele = construireModele({ aujourdhui: S20, transactions: [], payments: [], plans: [doc], profile, assets: [], batches: [], stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES });
    const chose = modele.choses.find(c => c.rangee === 'travaux')!;
    expect(chose).toMatchObject({ debut: S20, fin: '2026-10-04', joursActifs: 5, titre: 'Rénovation des sols', centimes: -60000 });
  });
});

describe('A7 : puces proposées, garde ×10 (E34)', () => {
  it('la feuille d’un brassin propose les recettes de l’app et 21, 28, 35 et 42 j ; « prête le … » en direct', () => {
    const p = puces('brassins', ctx());
    expect(p.filter(x => x.genre === 'recette').map(x => x.libelle)).toEqual(['IPA maison', 'Stout']);
    expect(p.filter(x => x.genre === 'temps').map(x => x.libelle)).toEqual(['21 j', '28 j', '35 j', '42 j']);
    let b = brouillonVide('brassins', S20);
    b = appliquerPuce(b, p.find(x => x.genre === 'recette')!);
    b = appliquerPuce(b, p.find(x => x.libelle === '35 j')!);
    expect(b).toMatchObject({ recetteId: 'R-IPA', tempsEnCuve: 35 });
    expect(preteLe(b)).toBe('prête le 15 juin');
    expect(appliquerPuce(b, p.find(x => x.libelle === '35 j')!).tempsEnCuve).toBeUndefined();
    const doc = reussi({ ...b, debutChoisi: true });
    expect(doc.cible === 'batch' && doc.document).toMatchObject({ recipeRef: 'R-IPA', plannedBrewDate: S20, finPrevue: '2026-06-15', status: 'planifie' });
  });
  it('une vente propose les clients et les plans brouillons', () => {
    const brouillon: FinancialPlan = { id: 'PV', title: '3 fûts La Cigogne', date: '2026-12-15', amountCents: 90000, direction: 'in', category: 'recettes', source: 'manual', status: 'draft', createdAt: 'x', clientId: 'CL-3' };
    const active: FinancialPlan = { ...brouillon, id: 'PA', title: 'Déjà confirmée', status: 'active' };
    const p = puces('ventes', ctx({ plans: [brouillon, active] }));
    expect(p.map(x => x.libelle)).toEqual(['3 fûts La Cigogne', 'Bar Central', 'Café du Pont']);
    const b = appliquerPuce(brouillonVide('ventes', S20), p[0]);
    expect(b).toMatchObject({ titre: '3 fûts La Cigogne', centimes: 90000, signe: '+', clientId: 'CL-3' });
    const e = reussi(toucherSemaine({ ...appliquerPuce(brouillonVide('ventes', S20), p[1]), centimes: 12000 }, S20));
    expect(plan(e)).toMatchObject({ direction: 'in', status: 'draft', category: 'recettes', clientId: 'CL-2', amountCents: 12000 });
  });
  it('les noms récents de la rangée viennent des choses posées ; rien n’est inventé quand l’historique est vide', () => {
    const chose = (id: string, titre: string, debut: string): ChoseCalendrier => ({ id, rangee: 'achats', titre, debut, fin: debut, source: { genre: 'plan', id, origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan' }, deplacable: true });
    expect(puces('achats', ctx({ choses: [chose('1', 'Malt', '2026-06-01'), chose('2', 'Malt', '2026-07-01'), chose('3', 'Bouchons', '2026-08-01')] })).map(p => p.libelle)).toEqual(['Bouchons', 'Malt']);
    expect(puces('achats', ctx())).toEqual([]);
    expect(puces('fetes', ctx())).toEqual([]);
    expect(puces('ventes', ctx({ clients: [], plans: [] }))).toEqual([]);
  });
  it('une somme au-delà de 10 fois la plus grosse de la rangée demande confirmation, une fois confirmée elle passe', () => {
    const posee: ChoseCalendrier = { id: 'a', rangee: 'achats', titre: 'Malt', debut: S20, fin: S20, centimes: -5000, source: { genre: 'plan', id: 'a', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan' }, deplacable: true };
    const c = ctx({ choses: [posee] });
    const base = { ...toucherSemaine({ ...brouillonVide('achats'), titre: 'Cuve' }, S20), signe: '-' as const };
    expect(demandeConfirmation({ ...base, centimes: 50000 }, c)).toBeNull();
    const g = demandeConfirmation({ ...base, centimes: 50001 }, c);
    expect(g).toMatchObject({ confirmer: true, plafond: 50000 });
    const refus = versEnregistrement({ ...base, centimes: 500000 }, c);
    expect(refus).toMatchObject({ ok: false, confirmer: { confirmer: true } });
    expect(versEnregistrement({ ...base, centimes: 500000, confirmeGrosseSomme: true }, c)).toMatchObject({ ok: true });
    // rien à comparer : pas de garde
    expect(demandeConfirmation({ ...base, centimes: 99999999 }, ctx())).toBeNull();
  });
  it('un montant inconnu n’est pas 0 : une prévision d’argent sans montant est refusée ; sans date, rien n’est posé', () => {
    expect(versEnregistrement(toucherSemaine({ ...brouillonVide('papiers'), titre: 'Assurance' }, S20), ctx())).toMatchObject({ ok: false });
    expect(valider({ ...brouillonVide('fetes'), titre: 'x' })).toMatchObject({ ok: false });
    expect(valider({ ...brouillonVide('brassins', S20) })).toMatchObject({ ok: false });
  });
});

describe('A14 : accepter un brassin habituel d’un toucher (E47 b)', () => {
  const lot = (id: string, brewDate: string) => ({ id, name: 'IPA maison', style: 'IPA', volumeL: 30, brewDate, status: 'termine', recipeRef: 'R-IPA' }) as Batch;
  const proposition = () => brassinsHabituels([lot('1', '2026-01-06'), lot('2', '2026-03-03'), lot('3', '2026-04-28')], '2026-05-15')[0];
  it('le brouillon est de la rangée Brassins avec la recette et le lundi 2026-06-22 ; sa conversion est un Batch planifié', () => {
    const b = brouillonDepuisProposition(proposition())!;
    expect(b).toMatchObject({ rangee: 'brassins', recetteId: 'R-IPA', debut: '2026-06-22', debutChoisi: true });
    const e = reussi(b);
    expect(e.cible).toBe('batch');
    if (e.cible === 'batch') {
      expect(e.document).toMatchObject({ recipeRef: 'R-IPA', plannedBrewDate: '2026-06-22', status: 'planifie', id: 'LOT-009', name: 'IPA maison' });
      const w = ecritureDeAjout(e);
      expect(w).toMatchObject({ op: 'creer', collection: 'batches', recetteId: 'R-IPA' });
    }
  });
  it('seule une proposition de brassin habituel s’accepte ainsi', () => {
    expect(brouillonDepuisProposition({ rangee: 'achats', titre: 'x', debut: S20, proposition: 'echeance' })).toBeNull();
  });
});

describe('E36 et Modifier', () => {
  it('R48 : une idée datée est un carnet d’idées (état Idée), daté du lundi de sa semaine, sa phrase en titre ; jamais un recipe-idea', () => {
    const r = enregistrementIdee('ZZ TEST — doseur de sucre', '2026-11-18', { nouvelId: p => `${p}-I` });
    expect(r.ok && r.enregistrement.cible === 'creative' && r.enregistrement.collection).toBe('creativeItems');
    const doc = r.ok ? (r.enregistrement.document as unknown as Record<string, unknown> & { carnet: Record<string, unknown> }) : null;
    expect(doc).toMatchObject({ id: 'CARNET-I', type: 'carnet', status: 'idea', date: '2026-11-16', title: 'ZZ TEST — doseur de sucre' });
    expect(doc!.carnet).toMatchObject({ phrase: 'ZZ TEST — doseur de sucre', criteres: [], facons: [], articles: [], notes: [], photos: [] });
    expect(doc!.type).not.toBe('recipe-idea');
    expect(enregistrementIdee('  ', '2026-12-07', {})).toMatchObject({ ok: false });
  });
  it('Modifier rouvre la feuille avec la fenêtre posée, puis écrit dans la source existante', () => {
    const chose: ChoseCalendrier = { id: 'argent-P:1', rangee: 'travaux', titre: 'Sols', debut: S20, fin: '2026-10-04', centimes: -60000, joursActifs: 5, fenetre: { du: S20, au: '2026-10-04', joursActifs: 5 }, source: { genre: 'plan', id: 'P', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan', id: 'P' }, deplacable: true };
    const b = brouillonDepuisChose(chose);
    expect(b).toMatchObject({ rangee: 'travaux', debut: S20, fin: S40, centimes: 60000, signe: '-', joursActifs: 5 });
    const m = versModification({ ...b, titre: 'Sols et murs', centimes: 70000 }, chose);
    expect(m).toMatchObject({ ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: 'P', patch: { title: 'Sols et murs', amountCents: 70000, date: S20 } }] });
    expect(versModification(b, { ...chose, source: { genre: 'facture', id: 'T' } })).toMatchObject({ ok: false });
  });
});

describe('E34, D-39 (CRITIQUE-2 n° 16) : le montant se choisit par puces, sans clavier', () => {
  const fete = (id: string, titre: string, debut: string, centimes?: number): ChoseCalendrier => ({
    id, rangee: 'fetes', titre, debut, fin: debut, source: { genre: 'creative', id, type: 'event' }, ouvre: { ecran: 'agenda' }, deplacable: true,
    ...(centimes !== undefined ? { centimes } : {})
  } as ChoseCalendrier);

  it('la puce « Marché de Noël » propose 118000 centimes (+1 180) et les pose avec son nom ; une puce de montant récent pose le sien', () => {
    const c = ctx({ choses: [fete('N', 'Marché de Noël', '2026-12-14', 118000), fete('V', 'Fête de village', '2026-06-01', 45000), fete('A', 'Apéro des voisins', '2026-05-25')] });
    const liste = puces('fetes', c);
    const noel = liste.find(p => p.genre === 'nom' && p.libelle === 'Marché de Noël');
    expect(noel).toMatchObject({ centimes: 118000, signe: '+' });
    const b = appliquerPuce({ ...brouillonVide('fetes', '2026-12-14'), signe: '-' }, noel!);
    expect(b).toMatchObject({ titre: 'Marché de Noël', centimes: 118000, signe: '+' });
    /* un nom sans montant connu ne pose rien : l'inconnu n'est pas 0 */
    const apero = liste.find(p => p.libelle === 'Apéro des voisins')!;
    expect(apero).not.toHaveProperty('centimes');
    expect(appliquerPuce(brouillonVide('fetes'), apero)).not.toHaveProperty('centimes');
    const montants = liste.filter(p => p.genre === 'montant');
    expect(montants.map(p => p.libelle)).toEqual(['+1 180', '+450']);
    expect(appliquerPuce(brouillonVide('fetes'), montants[1])).toMatchObject({ centimes: 45000, signe: '+' });
  });

  it('une dépense récente garde son signe ; un client pose son dernier montant ; sans historique, aucune puce de montant', () => {
    const achat: ChoseCalendrier = { id: 'H', rangee: 'achats', titre: 'Hotte', debut: '2026-06-01', fin: '2026-06-01', centimes: -90000, source: { genre: 'plan', id: 'H', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan' }, deplacable: true };
    expect(puces('achats', ctx({ choses: [achat] })).find(p => p.genre === 'montant')).toMatchObject({ centimes: 90000, signe: '-', libelle: '−900' });
    const vendu = { id: 'P1', title: 'Fûts', date: '2026-04-01', amountCents: 26000, direction: 'in', category: 'recettes', source: 'manual', status: 'active', createdAt: '2026-04-01T00:00:00Z', clientId: 'CL-2' } as FinancialPlan;
    const client = puces('ventes', ctx({ plans: [vendu] })).find(p => p.genre === 'client' && p.clientId === 'CL-2');
    expect(client).toMatchObject({ centimes: 26000 });
    expect(appliquerPuce(brouillonVide('ventes'), client!)).toMatchObject({ titre: 'Bar Central', centimes: 26000, signe: '+', clientId: 'CL-2' });
    expect(puces('papiers', ctx()).filter(p => p.genre === 'montant')).toEqual([]);
  });

  it('« Mettre de côté » ne se propose qu’à une dépense avec fenêtre et montant', () => {
    expect(peutMettreDeCote(travaux())).toBe(true);
    expect(peutMettreDeCote({ ...travaux(), signe: '+' })).toBe(false);
  });
});
