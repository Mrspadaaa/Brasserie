import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { rangeeCreative, type ChoseCalendrier } from '../../src/domain/calendrier';
import {
  achatsPasses, avecNomPose, nomPose, appliquerPuce, brouillonDepuisChose, brouillonDepuisProposition, brouillonVide, choisirJours, demandeConfirmation, ecritureDeAjout, enregistrementIdee, etirerFin, nbSemaines, peutMettreDeCote, poserHorizon,
  preteLe, puceJours, puces, resumeFenetre, toucherSemaine, valider, versEnregistrement, versModification, type BrouillonAjout, type ContexteAjout, type Enregistrement
} from '../../src/domain/calendrierAjout';
import { brassinsHabituels } from '../../src/domain/calendrierPropositions';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { etatBanc } from '../../src/design/CalendrierPreview';

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
    /* CRITIQUE-3 n° 8 : « Ajouter » enregistre une vente confirmée (elle compte), jamais un brouillon de plus en pointillé */
    expect(plan(e)).toMatchObject({ direction: 'in', status: 'active', category: 'recettes', clientId: 'CL-2', amountCents: 12000 });
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

describe('CRITIQUE-4 n° 2 (E23, E24) : un brassin posé par la feuille porte le coût de sa recette', () => {
  const JOUR = '2026-11-16';
  const profil: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-01-01', openingCash: { date: '2026-01-01', amountCents: 403200, confirmed: true } } as FinancialProfile;
  const modeleDe = (e: ReturnType<typeof etatBanc>) => construireModele({ aujourdhui: JOUR, transactions: e.transactions, payments: [], plans: e.plans, profile: profil, assets: [], batches: e.batches, stockItems: [], items: e.items, recettes: e.recettes, reglages: REGLAGES_VIDES, lignesCourses: [] } as never);
  const poser = (e: ReturnType<typeof etatBanc>, recetteId: string, id: string) => {
    const c: ContexteAjout = { aujourdhui: JOUR, recettes: e.recettes, clients: e.clients, plans: e.plans, choses: [], idBrassin: () => id, nouvelId: p => `${p}-T`, maintenant: `${JOUR}T10:00:00.000Z` };
    const r = versEnregistrement({ ...brouillonVide('brassins', JOUR), recetteId, debutChoisi: true, tempsEnCuve: 21 }, c);
    if (!('enregistrement' in r) || r.enregistrement.cible !== 'batch') throw new Error('brassin attendu');
    return { ...e, batches: [...e.batches, r.enregistrement.document] };
  };
  const brassinDe = (m: ReturnType<typeof modeleDe>, id: string) => m.choses.find(c => c.source.genre === 'batch' && c.source.id === id);

  it('la Blonde posée en S47 vaut le budget de LOT-BLONDE (même voie : la prévision), et le chiffre clé baisse de toutes ses sorties', () => {
    const e = etatBanc(JOUR);
    const avant = modeleDe(e);
    const apres = modeleDe(poser(e, 'R-BLONDE', 'LOT-NEUF'));
    const reference = brassinDe(apres, 'LOT-BLONDE');
    const neuve = brassinDe(apres, 'LOT-NEUF');
    expect(reference?.centimes).toBeLessThan(0);
    expect(neuve?.centimes).toBe(reference?.centimes);
    expect(neuve?.coutAVenir).toBeUndefined();
    expect(neuve?.budgetRepris).toMatch(/budget de la recette, repris de Blonde d’automne/);
    /* toutes ses sorties (courses, frais, emballage dans Achats ; impôt dans Papiers) entrent dans la courbe : le chiffre clé baisse d'autant */
    const sorties = apres.choses.filter(c => c.source.genre === 'prevision-brassin' && (c.source.id === 'LOT-NEUF' || (c.ouvre.ecran === 'brassin' && c.ouvre.id === 'LOT-NEUF')))
      .reduce((s, c) => s + (c.centimes ?? 0), 0);
    expect(sorties).toBeLessThanOrEqual(neuve!.centimes!);
    expect(apres.creux!.centimes).toBe(avant.creux!.centimes + sorties);
    expect(apres.creux!.centimes).toBeLessThanOrEqual(avant.creux!.centimes + neuve!.centimes!);
    /* l'hypothèse le dit : Finances ne le compte pas tant que Budget › ne l'a pas enregistré */
    expect(apres.hypotheses.map(h => h.texte).join(' | ')).toMatch(/Blonde d’automne : −\d[\d ]* CHF, budget repris de sa recette, pas encore dans Finances/);
    /* rien n'est écrit : les plans de l'app ne changent pas */
    expect(poser(e, 'R-BLONDE', 'LOT-NEUF').plans).toEqual(e.plans);
  });

  it('CRITIQUE-6, doute −165 / −141 : le Porter posé (état 24) baisse le chiffre clé de son budget (courses, frais) PLUS son impôt sur la bière, rangé dans Papiers', () => {
    const e = etatBanc(JOUR);
    const avant = modeleDe(e);
    const apres = modeleDe(poser(e, 'R-PORTER', 'LOT-NEUF'));
    const neuf = brassinDe(apres, 'LOT-NEUF')!;
    const lignes = apres.choses.filter(c => c.source.genre === 'prevision-brassin' && (c.source.id === 'LOT-NEUF' || (c.ouvre.ecran === 'brassin' && c.ouvre.id === 'LOT-NEUF')));
    const impot = lignes.filter(c => c.posteBrassin === 'impot').reduce((s, c) => s + (c.centimes ?? 0), 0);
    const toutes = lignes.reduce((s, c) => s + (c.centimes ?? 0), 0);
    expect(impot).toBeLessThan(0);
    expect(lignes.filter(c => c.posteBrassin === 'impot').every(c => c.rangee === 'papiers')).toBe(true);
    /* la barre dit le budget (sans l'impôt) ; la courbe baisse de toutes ses sorties : l'écart est exactement l'impôt */
    expect(neuf.centimes).toBe(toutes - impot);
    expect(apres.creux!.centimes - avant.creux!.centimes).toBe(toutes);
    expect(toutes - neuf.centimes!).toBe(impot);
    console.info(`doute-165 : budget ${neuf.centimes} ; impôt ${impot} ; total ${toutes} ; creux ${avant.creux!.centimes} → ${apres.creux!.centimes}`);
  });

  it('une recette sans aucun budget : « coût à venir » en mots, pas de clé centimes (jamais 0), la caisse ne bouge pas', () => {
    const e0 = etatBanc(JOUR);
    const e = { ...e0, recettes: [...e0.recettes, { id: 'R-NEUVE', name: 'Bière neuve', style: 'Pale', volumeL: 100, ingredients: [] } as never] };
    const avant = modeleDe(e);
    const apres = modeleDe(poser(e, 'R-NEUVE', 'LOT-RIEN'));
    const c = brassinDe(apres, 'LOT-RIEN');
    expect(c).toBeDefined();
    expect('centimes' in (c as object)).toBe(false);
    expect(c?.coutAVenir).toBe(true);
    expect(c?.etiquette).toBe('Bière neuve · coût à venir');
    expect(apres.creux!.centimes).toBe(avant.creux!.centimes);
  });

  it('doute IPA −45 : un brassin en cuve n’a plus que son reste à sortir (l’emballage), et la barre le dit « reste »', () => {
    const m = modeleDe(etatBanc(JOUR));
    const ipa = brassinDe(m, 'LOT-IPA');
    expect(ipa?.reste).toBe(true);
    expect(ipa?.etiquette).toBeUndefined();
    expect(ipa?.centimes).toBe(-4500);
  });
});

describe('CRITIQUE-7 n° 4 et décision (a) : un brassin posé cette semaine est prêt depuis aujourd’hui ; un achat posé est de matières', () => {
  const JOUR = '2026-11-18';
  const c = ctx({ aujourdhui: JOUR, maintenant: '2026-11-18T10:00:00.000Z' });

  it('n° 4 : posé en S47 le 18 nov. avec 28 j : « prête le 16 déc. » (feuille et résumé), jamais « 14 déc. » ; plannedBrewDate et finPrevue le disent', () => {
    let b = brouillonVide('brassins', '2026-11-16');
    b = appliquerPuce(b, puces('brassins', c).find(x => x.genre === 'recette')!);
    b = appliquerPuce(b, puces('brassins', c).find(x => x.libelle === '28 j')!);
    /* la feuille, en direct (le lot C passe `aujourdhui`) */
    expect(preteLe(b, JOUR)).toBe('prête le 16 déc.');
    expect(preteLe(b, JOUR)).not.toContain('14 déc.');
    /* le résumé de pose (message après « Ajouter ») */
    const r = versEnregistrement({ ...b, debutChoisi: true }, c);
    if (!('enregistrement' in r)) throw new Error(r.raison);
    expect(r.resume).toBe('IPA maison · S47 · prête le 16 déc.');
    expect(r.enregistrement.document).toMatchObject({ plannedBrewDate: JOUR, finPrevue: '2026-12-16' });
    /* une semaine future : depuis son lundi (S48 : 23 nov. + 28 j = 21 déc.) */
    const futur = { ...b, debut: '2026-11-23' };
    expect(preteLe(futur, JOUR)).toBe('prête le 21 déc.');
    const rf = versEnregistrement({ ...futur, debutChoisi: true }, c);
    expect('resume' in rf && rf.resume).toBe('IPA maison · S48 · prête le 21 déc.');
  });

  it('décision (a) : un achat posé par la feuille est un FinancialPlan manuel de catégorie `brassage` (la rangée Achats le relit)', () => {
    const b: BrouillonAjout = { ...brouillonVide('achats', '2026-11-30'), titre: 'ZZ TEST — houblon Citra', signe: '-', centimes: 24000, debutChoisi: true };
    expect(plan(reussi(b, c))).toMatchObject({ category: 'brassage', source: 'manual', direction: 'out', amountCents: 24000, date: '2026-11-30' });
  });
});

describe('V-CAL (21.11) : D401 Travaux sans montant, nom posé (G3), achats passés (D2)', () => {
  it('D401 : des Travaux sans montant sont une activité marquée `travaux`, rangée Travaux, sans aucun montant (jamais 0) ; avec un montant, un plan', () => {
    const b = { ...toucherSemaine(brouillonVide('travaux', S20), S20), titre: 'Repeindre la cave' };
    const e = reussi(b);
    expect(e.cible).toBe('creative');
    if (e.cible !== 'creative') return;
    expect(e.document).toMatchObject({ type: 'event', title: 'Repeindre la cave', travaux: true });
    expect(e.document).not.toHaveProperty('amountCents');
    expect(e.document).not.toHaveProperty('activite');
    expect(rangeeCreative({ type: 'event', travaux: true })).toBe('travaux');
    expect(rangeeCreative({ type: 'event', activite: true })).toBe('activites');
    expect(plan(reussi({ ...b, centimes: 30000 }))).toMatchObject({ amountCents: 30000, category: 'renovation' });
  });
  it('G3 : nom posé « Travaux · S20 » (puis « · 2 » s’il existe), il suit la semaine tant qu’il n’est pas tapé ; rien pour Brassins ni Ventes', () => {
    expect(nomPose('travaux', S20, [])).toBe('Travaux · S20');
    expect(nomPose('activites', S20, [{ titre: 'Activités · S20' }])).toBe('Activités · S20 · 2');
    expect(nomPose('brassins', S20, [])).toBeNull();
    expect(nomPose('ventes', S20, [])).toBeNull();
    const pose = avecNomPose(brouillonVide('travaux', S20), []);
    expect(pose).toMatchObject({ titre: 'Travaux · S20', nomPose: true });
    expect(avecNomPose({ ...pose, debut: S40 }, []).titre).toBe('Travaux · S40');
    expect(avecNomPose({ ...pose, titre: 'Sols', nomPose: false, debut: S40 }, []).titre).toBe('Sols');
  });
  it('le résumé d’un nom posé ne répète pas sa semaine', () => {
    const r = versEnregistrement({ ...avecNomPose(brouillonVide('activites', S20), []), debutChoisi: true }, ctx());
    expect('resume' in r && r.resume).toBe('Activités · S20');
  });
  it('D2 : les achats passés sont les lignes de dépense > 0 ; une rentrée et une ligne à 0 n’en sont pas', () => {
    const t = [
      { date: '2025-01-20', category: 'equipment', finance: { kind: 'expense', lines: [{ description: 'Pompe de brassage', amountCents: 42000 }, { description: 'Port', amountCents: 0 }] } },
      { date: '2025-02-01', category: 'sales', finance: { kind: 'income', lines: [{ description: 'Vente', amountCents: 9000 }] } },
    ];
    expect(achatsPasses(t)).toEqual([{ libelle: 'Pompe de brassage', centimes: 42000, date: '2025-01-20', categorie: 'equipment', ref: undefined }]);
  });
});

describe('D404 : l’horizon pose le début, la durée s’étire (frise B)', () => {
  const MAI = '2027-05-10'; // S19 ’27, lundi
  it('poserHorizon ramène au lundi, marque le début choisi et « par horizon », sans fenêtre au départ', () => {
    const b = poserHorizon(brouillonVide('travaux'), '2027-05-12');
    expect(b).toMatchObject({ debut: MAI, fin: null, debutChoisi: true, parHorizon: true });
    expect(nbSemaines(b)).toBe(1);
  });

  it('un autre horizon garde la durée étirée : la fenêtre glisse avec le début', () => {
    const b = etirerFin(poserHorizon(brouillonVide('travaux'), MAI), '2027-10-04');
    expect(nbSemaines(b)).toBe(22);
    expect(resumeFenetre(b)).toBe('S19 → S40 · 22 sem.');
    const c = poserHorizon(b, '2027-11-15');
    expect(c.debut).toBe('2027-11-15');
    expect(nbSemaines(c)).toBe(22);
  });

  it('poserHorizon retire le jour choisi d’une chose rouverte (la semaine change)', () => {
    const b = poserHorizon({ ...brouillonVide('achats', '2026-11-16'), jour: '2026-11-18', jourChoisi: true }, MAI);
    expect(b.jour).toBeUndefined();
    expect(b.jourChoisi).toBeUndefined();
  });

  it('etirerFin : jamais avant le début (ou sur lui) : une seule semaine ; sans fenêtre (vente) ni début : rien ne change', () => {
    const b = poserHorizon(brouillonVide('travaux'), MAI);
    expect(etirerFin(b, '2027-04-05').fin).toBeNull();
    expect(etirerFin(b, MAI).fin).toBeNull();
    expect(etirerFin(b, '2027-05-20').fin).toBe('2027-05-17');
    const vente = poserHorizon(brouillonVide('ventes'), MAI);
    expect(etirerFin(vente, '2027-10-04')).toBe(vente);
    const sansDebut = brouillonVide('travaux');
    expect(etirerFin(sansDebut, '2027-10-04')).toBe(sansDebut);
  });

  it('etirerFin : des jours actifs qui ne tiennent plus partent (l’inconnu n’est pas 0) ; ceux qui tiennent restent', () => {
    const large = choisirJours(etirerFin(poserHorizon(brouillonVide('travaux'), MAI), '2027-05-24'), 10);
    expect(large.joursActifs).toBe(10);
    expect(etirerFin(large, '2027-05-17').joursActifs).toBe(10);
    expect('joursActifs' in etirerFin(large, MAI)).toBe(false);
  });
});
