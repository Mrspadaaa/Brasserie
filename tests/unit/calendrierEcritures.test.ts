import { describe, expect, it } from 'vitest';
import type { Batch, CreativeItem } from '../../src/types';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { choseBrassin, choseCreative, preparerChoses, texteDuree, type ChoseCalendrier } from '../../src/domain/calendrier';
import { accepterVente, deplacer, dupliquer, lier, mettreDeCote, noterIdee, retirer, type Collection, type ContexteGestes, type Resolution } from '../../src/domain/calendrierGestes';
import { appliquerPuce, brouillonDepuisProposition, brouillonVide, ecritureDeAjout, puces, toucherSemaine, versEnregistrement } from '../../src/domain/calendrierAjout';
import { creerPortMemoire, etatBanc, type EtatBanc } from '../../src/design/CalendrierPreview';
import { brassinsHabituels } from '../../src/domain/calendrierPropositions';
import { rescheduleBatchPatch } from '../../src/domain/batchSchedule';
import { appliquer, type Document, type PortEcritures } from '../../src/ui/calendrier/ecritures';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';

/** Une mémoire à la place des services : jamais de donnée réelle, jamais de Firestore. `undefined` dans un patch retire le champ. */
function memoire(donnees: Partial<Record<Collection, Document[]>>): PortEcritures & { tout(c: Collection): Document[]; appels: string[] } {
  const bases: Record<Collection, Map<string, Document>> = { batches: new Map(), creativeItems: new Map(), financialPlans: new Map() };
  for (const [c, docs] of Object.entries(donnees)) for (const d of docs ?? []) bases[c as Collection].set(d.id as string, structuredClone(d));
  const appels: string[] = [];
  return {
    appels, tout: c => [...bases[c].values()].map(d => structuredClone(d)),
    lire: (c, id) => bases[c].get(id),
    patcher(c, id, patch) {
      appels.push(`patch ${c}`);
      const courant = bases[c].get(id);
      if (!courant) throw new Error('absent');
      const suivant = { ...courant, ...patch };
      for (const [k, v] of Object.entries(patch)) if (v === undefined) delete suivant[k];
      bases[c].set(id, suivant);
    },
    creer(c, doc) { appels.push(`creer ${c}`); bases[c].set(doc.id, structuredClone(doc)); },
    supprimer(c, id) { appels.push(`supprimer ${c}`); bases[c].delete(id); }
  };
}

const AUJOURDHUI = '2026-11-16';
const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 500000, confirmed: true } };
const modeleDe = (m: ReturnType<typeof memoire>, aujourdhui = AUJOURDHUI) => construireModele({
  aujourdhui, transactions: [], payments: [], plans: m.tout('financialPlans') as unknown as FinancialPlan[], profile, assets: [], batches: m.tout('batches') as unknown as Batch[], stockItems: [],
  items: m.tout('creativeItems') as unknown as CreativeItem[], recettes: [], reglages: REGLAGES_VIDES
});
const ctxDe = (m: ReturnType<typeof memoire>, p: Partial<ContexteGestes> = {}): ContexteGestes => ({
  aujourdhui: AUJOURDHUI, batches: m.tout('batches') as unknown as Batch[], plans: m.tout('financialPlans') as unknown as FinancialPlan[], courbe: modeleDe(m).courbe, nouvelId: x => `${x}-NEW`, idBrassin: () => 'LOT-NEW', ...p
});
const ok = (r: Resolution) => { if (!r.ok) throw new Error(r.raison); return r; };

const fete: CreativeItem = { id: 'CR-1', type: 'event', title: 'Marché de Noël', status: 'todo', date: '2026-12-12' };
const tache: CreativeItem = { id: 'CR-T', type: 'event', title: 'Commander les bouchons', status: 'todo' };
const idee: CreativeItem = { id: 'CR-I', type: 'recipe-idea', title: 'Bière au sapin', status: 'idea' };
const fait: CreativeItem = { id: 'CR-D', type: 'event', title: 'Déjà fait', status: 'done' };
const blonde = (p: Partial<Batch> = {}) => ({
  id: 'LOT-5', name: 'Blonde', style: 'Blonde', volumeL: 30, brewDate: '', plannedBrewDate: '08.12.2026', status: 'planifie',
  recipeSnapshot: { fermentation: [{ kind: 'primaire', name: 'P', tempC: 19, days: 14 }, { kind: 'garde', name: 'G', tempC: 4, days: 21 }] }, ...p
}) as unknown as Batch;

describe('A5 : Retirer puis Annuler redonne l’objet identique (toEqual)', () => {
  it('une fête retirée perd sa date, puis Annuler la rend à sa semaine ; elle ne quitte jamais sa source', async () => {
    const m = memoire({ creativeItems: [fete] });
    const chose = choseCreative(fete)!;
    const r = ok(retirer(chose, ctxDe(m)));
    const faite = await appliquer(r.ecritures, m);
    expect(m.tout('creativeItems')).toEqual([{ ...fete, date: '' }]);
    expect(m.appels).toEqual(['patch creativeItems']);
    await faite.annuler();
    expect(m.tout('creativeItems')).toEqual([fete]);
    expect(m.tout('creativeItems')[0]).toEqual(fete);
    expect(m.appels.some(a => a.startsWith('supprimer'))).toBe(false);
    await faite.annuler(); // sans effet une deuxième fois
    expect(m.tout('creativeItems')).toEqual([fete]);
  });
  it('un échec en cours d’écriture défait ce qui a déjà été écrit', async () => {
    const m = memoire({ creativeItems: [fete] });
    await expect(appliquer([
      { op: 'patch', collection: 'creativeItems', id: 'CR-1', patch: { date: '' } },
      { op: 'patch', collection: 'creativeItems', id: 'CR-ABSENT', patch: { date: '' } }
    ], m)).rejects.toThrow();
    expect(m.tout('creativeItems')).toEqual([fete]);
  });
});

describe('A9 : annuler un brassin déplacé redonne le Batch identique (toEqual)', () => {
  it('déplacer de 2 semaines par le patch de rescheduleBatchPatch, puis Annuler', async () => {
    const b = blonde();
    const m = memoire({ batches: [b as unknown as Document] });
    const chose = choseBrassin(b, AUJOURDHUI)!;
    const r = ok(deplacer(chose, 2, ctxDe(m)));
    const faite = await appliquer(r.ecritures, m);
    expect(m.tout('batches')[0]).toEqual({ ...b, ...rescheduleBatchPatch(b, '2026-12-22') });
    await faite.annuler();
    expect(m.tout('batches')).toEqual([b]);
  });
  it('allonger écrit finPrevue ; Annuler retire ce champ qui n’existait pas (le Batch redevient identique)', async () => {
    const b = blonde();
    const m = memoire({ batches: [b as unknown as Document] });
    const r = ok(deplacer(choseBrassin(b, AUJOURDHUI)!, 1, ctxDe(m), 'conditionnement'));
    const faite = await appliquer(r.ecritures, m);
    expect(m.tout('batches')[0]).toMatchObject({ finPrevue: '2027-01-19' });
    await faite.annuler();
    expect(m.tout('batches')).toEqual([b]);
    expect('finPrevue' in m.tout('batches')[0]).toBe(false);
  });
});

describe('A10 : la mise de côté n’écrit aucun plan', () => {
  it('poser fenetre.miseDeCote écrit la chose seule ; la liste des plans est identique avant et après ; Annuler rend la chose', async () => {
    const frigo: CreativeItem = { id: 'CR-F', type: 'event', activite: true, title: 'Frigo', status: 'todo', date: '2026-11-16', estimatedCost: 1800, fenetre: { du: '2026-11-16', au: '2027-06-27' } };
    const plan: FinancialPlan = { id: 'P-F', title: 'Frigo', date: '2027-06-27', amountCents: 180000, direction: 'out', category: 'materiel', source: 'manual', status: 'active', createdAt: 'x' };
    const m = memoire({ creativeItems: [frigo as unknown as Document], financialPlans: [plan as unknown as Document] });
    const avant = modeleDe(m);
    const plansAvant = m.tout('financialPlans');
    const chose = avant.choses.find(c => c.rangee === 'activites')!;
    const faite = await appliquer(ok(mettreDeCote(chose, true, ctxDe(m))).ecritures, m);
    expect(m.tout('financialPlans')).toEqual(plansAvant);
    expect(m.appels).toEqual(['patch creativeItems']);
    const apres = modeleDe(m);
    expect(apres.courbe!.semaines.map(s => s.caisse)).toEqual(avant.courbe!.semaines.map(s => s.caisse));
    const i = 20;
    expect(apres.courbe!.semaines[i].libre).toBeLessThan(avant.courbe!.semaines[i].libre);
    await faite.annuler();
    expect(m.tout('creativeItems')).toEqual([frigo]);
  });
});

describe('A11 (D-104, D-121, D-122) : une idée datée, écrite par cette voie, relue en icône de la semaine 50', () => {
  it('Noter une idée en S50 crée un recipe-idea daté du lundi de S50 ; le modèle la montre en icône, sans rangée', async () => {
    const m = memoire({});
    const faite = await appliquer(ok(noterIdee('Bière au sapin', '2026-12-10', ctxDe(m))).ecritures, m);
    expect(m.tout('creativeItems')).toEqual([{ id: 'CR-NEW', type: 'recipe-idea', title: 'Bière au sapin', status: 'idea', date: '2026-12-07' }]);
    const modele = modeleDe(m);
    const icone = modele.icones.find(i => i.genre === 'idee');
    expect(icone).toMatchObject({ numero: 50, lundi: '2026-12-07', titre: 'Bière au sapin' });
    expect(modele.choses).toEqual([]);
    expect(modele.sansDate).toEqual([]);
    await faite.annuler();
    expect(m.tout('creativeItems')).toEqual([]);
    expect(modeleDe(m).icones.filter(i => i.genre === 'idee')).toEqual([]);
  });
});

describe('A13 (D-67, D-93, D-69, E46) : la poche « Sans date »', () => {
  it('contient une tâche todo sans date, ni une idée de recette sans date, ni une chose faite', () => {
    const m = memoire({ creativeItems: [fete, tache, idee, fait] });
    const modele = modeleDe(m);
    expect(modele.sansDate.map(c => c.titre)).toEqual(['Commander les bouchons']);
    expect(modele.sansDate[0]).toMatchObject({ sansDate: true, debut: '', fin: '', rangee: 'fetes' });
    expect(modele.choses.map(c => c.titre)).toEqual(['Marché de Noël']);
  });
  it('Retirer une fête la fait passer des choses posées à sansDate ; Annuler la rend à sa semaine (toEqual)', async () => {
    const m = memoire({ creativeItems: [fete] });
    const avant = modeleDe(m);
    expect(avant.sansDate).toEqual([]);
    const faite = await appliquer(ok(retirer(avant.choses[0], ctxDe(m))).ecritures, m);
    const retire = modeleDe(m);
    expect(retire.choses).toEqual([]);
    expect(retire.sansDate.map(c => c.titre)).toEqual(['Marché de Noël']);
    await faite.annuler();
    expect(modeleDe(m)).toEqual(avant);
    expect(modeleDe(m).choses[0]).toEqual(avant.choses[0]);
  });
  it('un plan manuel retiré passe à cancelled : il n’entre pas dans sansDate et quitte la frise', async () => {
    const plan: FinancialPlan = { id: 'P-1', title: 'Bouchons', date: '2026-12-03', amountCents: 15000, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: 'x' };
    const m = memoire({ financialPlans: [plan as unknown as Document] });
    const avant = modeleDe(m);
    expect(avant.choses.map(c => [c.rangee, c.titre])).toEqual([['achats', 'Bouchons']]);
    const faite = await appliquer(ok(retirer(avant.choses[0], ctxDe(m))).ecritures, m);
    expect(m.tout('financialPlans')[0]).toMatchObject({ status: 'cancelled' });
    expect(modeleDe(m).sansDate).toEqual([]);
    expect(modeleDe(m).choses).toEqual([]);
    await faite.annuler();
    expect(m.tout('financialPlans')).toEqual([plan]);
  });
  it('un projet de matériel (source equipment) tombe dans Travaux (D-69)', () => {
    const projet = { id: 'UPGRADE-PROJET', title: 'Fermenteur conique', date: '2026-12-15', amountCents: 250000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: 'x',
      upgrade: { version: 1, timing: 'next', stage: 'ready', budgetKnown: true, datePrecision: 'day', purchaseCents: 250000, estimateSource: 'quote' } } as unknown as FinancialPlan;
    const modele = construireModele({ aujourdhui: AUJOURDHUI, transactions: [], payments: [], plans: [projet], profile, assets: [], batches: [], stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES });
    const chose = modele.choses.find(c => c.titre.includes('Fermenteur'));
    expect(chose).toBeDefined();
    expect(chose).toMatchObject({ rangee: 'travaux', centimes: -250000, source: { genre: 'projet-materiel' } });
  });
});

describe('A14 : accepter un brassin habituel, puis Annuler le retire', () => {
  it('« Ajouter » écrit un brassin planifié avec la recette et le lundi proposé ; l’inverse retire ce brassin', async () => {
    const lot = (id: string, brewDate: string) => ({ id, name: 'IPA maison', style: 'IPA', volumeL: 30, brewDate, status: 'termine', recipeRef: 'R-IPA' }) as unknown as Batch;
    const historique = [lot('L1', '2026-01-06'), lot('L2', '2026-03-03'), lot('L3', '2026-04-28')];
    const m = memoire({ batches: historique as unknown as Document[] });
    const proposition = brassinsHabituels(historique, '2026-05-15')[0];
    const conv = versEnregistrement(brouillonDepuisProposition(proposition)!, {
      aujourdhui: '2026-05-15', recettes: [{ id: 'R-IPA', name: 'IPA maison', style: 'IPA', volumeL: 30 }], clients: [], plans: [], choses: [], idBrassin: () => 'LOT-009'
    });
    if (!('enregistrement' in conv)) throw new Error(conv.raison);
    const faite = await appliquer([ecritureDeAjout(conv.enregistrement)], m);
    expect(m.tout('batches')).toHaveLength(4);
    expect(m.tout('batches').find(b => b.id === 'LOT-009')).toMatchObject({ recipeRef: 'R-IPA', plannedBrewDate: '2026-06-22', status: 'planifie' });
    // après « Ajouter », la proposition n'est plus là : le brassin est posé
    expect(brassinsHabituels(m.tout('batches') as unknown as Batch[], '2026-05-15')).toEqual([]);
    await faite.annuler();
    expect(m.tout('batches').map(b => b.id)).toEqual(['L1', 'L2', 'L3']);
    expect(brassinsHabituels(m.tout('batches') as unknown as Batch[], '2026-05-15')).toHaveLength(1);
  });
});

describe('dupliquer : l’inverse retire la copie, jamais l’original', () => {
  it('une fête dupliquée en S51 ; Annuler retire seulement la copie', async () => {
    const m = memoire({ creativeItems: [fete] });
    const chose: ChoseCalendrier = choseCreative(fete)!;
    const faite = await appliquer(ok(dupliquer(chose, '2026-12-14', ctxDe(m))).ecritures, m);
    expect(m.tout('creativeItems').map(i => i.id)).toEqual(['CR-1', 'CR-NEW']);
    expect(m.tout('creativeItems')[1]).toMatchObject({ date: '2026-12-19', title: 'Marché de Noël', status: 'todo' }); // même jour de la semaine, une semaine plus tard
    await faite.annuler();
    expect(m.tout('creativeItems')).toEqual([fete]);
  });
});

describe('CRITIQUE-3 n° 8 et 13 : une vente posée compte une fois ; Lier écrit, se relit, s’annule', () => {
  const ventes = (mod: ReturnType<typeof modeleDe>) => mod.choses.filter(c => c.rangee === 'ventes');
  const ctxAjout = (m: ReturnType<typeof memoire>) => ({ aujourdhui: AUJOURDHUI, recettes: [], clients: [{ id: 'CL-PONT', name: 'Café du Pont' }], plans: m.tout('financialPlans') as unknown as FinancialPlan[], choses: modeleDe(m).choses, nouvelId: (x: string) => `${x}-NEW`, maintenant: '2026-11-16T10:00:00.000Z' });
  const probable: FinancialPlan = { id: 'P-CAFE', title: 'Café du Pont, 1 fût', date: '2026-12-07', amountCents: 13000, direction: 'in', category: 'recettes', source: 'manual', status: 'draft', createdAt: 'x', clientId: 'CL-PONT' };

  it('t5 : Ajouter une vente puis relire le modèle : une seule chose Ventes, pleine, comptée ; Annuler la retire', async () => {
    const m = memoire({});
    const b = { ...appliquerPuce(brouillonVide('ventes', '2026-12-07'), puces('ventes', ctxAjout(m)).find(p => p.genre === 'client')!), centimes: 13000, debutChoisi: true };
    const conv = versEnregistrement(b, ctxAjout(m));
    if (!('enregistrement' in conv)) throw new Error(conv.raison);
    const faite = await appliquer([ecritureDeAjout(conv.enregistrement)], m);
    const apres = ventes(modeleDe(m));
    expect(apres).toHaveLength(1);
    expect(apres[0]).toMatchObject({ titre: 'Café du Pont', centimes: 13000 });
    expect(apres[0].probable).toBeUndefined();
    await faite.annuler();
    expect(ventes(modeleDe(m))).toHaveLength(0);
  });

  it('t5 : choisir la puce d’une vente probable l’ACCEPTE (même id, pleine, comptée) au lieu d’en créer une autre ; Annuler la remet en pointillé', async () => {
    const m = memoire({ financialPlans: [probable as unknown as Document] });
    expect(ventes(modeleDe(m))).toMatchObject([{ id: 'plan-P-CAFE', probable: true }]);
    const puce = puces('ventes', ctxAjout(m)).find(p => p.genre === 'vente-probable')!;
    const conv = versEnregistrement(toucherSemaine(appliquerPuce(brouillonVide('ventes', '2026-12-07'), puce), '2026-12-07'), ctxAjout(m));
    if (!('enregistrement' in conv)) throw new Error(conv.raison);
    expect(conv.enregistrement.document.id).toBe('P-CAFE');
    /* la même écriture que CalendrierTab : une création, qui remplace le brouillon de même id */
    const faite = await appliquer([{ op: 'creer', collection: 'financialPlans', document: conv.enregistrement.document as unknown as Document & { id: string } }], m);
    expect(m.tout('financialPlans')).toHaveLength(1);
    expect(m.tout('financialPlans')[0]).toMatchObject({ id: 'P-CAFE', status: 'active' });
    const apres = ventes(modeleDe(m));
    expect(apres).toHaveLength(1);
    expect(apres[0]).toMatchObject({ id: 'argent-P-CAFE', centimes: 13000 });
    expect(apres[0].probable).toBeUndefined();
    /* la vente acceptée n'est plus proposée en puce : on ne peut pas la poser deux fois */
    expect(puces('ventes', ctxAjout(m)).some(p => p.genre === 'vente-probable')).toBe(false);
    await faite.annuler();
    expect(m.tout('financialPlans')).toEqual([probable]);
  });

  it('t5 : toucher la pointillée (accepterVente) la rend pleine, même id ; Annuler la remet en brouillon', async () => {
    const m = memoire({ financialPlans: [probable as unknown as Document] });
    const chose = ventes(modeleDe(m))[0];
    const faite = await appliquer(ok(accepterVente(chose, ctxDe(m))).ecritures, m);
    expect(m.tout('financialPlans')).toEqual([{ ...probable, status: 'active' }]);
    expect(ventes(modeleDe(m))).toMatchObject([{ id: 'argent-P-CAFE', centimes: 13000 }]);
    expect(ventes(modeleDe(m))[0].probable).toBeUndefined();
    await faite.annuler();
    expect(m.tout('financialPlans')).toEqual([probable]);
  });

  it('t9 : Lier une fête à La Cigogne, puis Annuler : « lié à La Cigogne » présent puis absent, l’objet identique (toEqual)', async () => {
    const m = memoire({ creativeItems: [fete as unknown as Document], financialPlans: [{ ...probable, status: 'active' } as unknown as Document] });
    const noms = { clients: new Map([['CL-CIGOGNE', 'La Cigogne']]) };
    const lu = () => preparerChoses(modeleDe(m).choses, noms);
    const chose = lu().find(c => c.id === 'creatif-CR-1')!;
    expect(chose.lie).toBeUndefined();
    const faite = await appliquer(ok(lier(chose, { clientId: 'CL-CIGOGNE' }, ctxDe(m))).ecritures, m);
    expect(m.tout('creativeItems')[0]).toMatchObject({ liens: { clientId: 'CL-CIGOGNE' } });
    expect(lu().find(c => c.id === 'creatif-CR-1')!.lie).toMatchObject({ texte: 'lié à La Cigogne' });
    await faite.annuler();
    expect(m.tout('creativeItems')).toEqual([fete]);
    expect(lu().find(c => c.id === 'creatif-CR-1')!.lie).toBeUndefined();
    /* un plan manuel porte clientId, et son inverse le retire */
    const vente = lu().find(c => c.id === 'argent-P-CAFE')!;
    const f2 = await appliquer(ok(lier(vente, { clientId: 'CL-CIGOGNE' }, ctxDe(m))).ecritures, m);
    expect(lu().find(c => c.id === 'argent-P-CAFE')!.lie).toMatchObject({ texte: 'lié à La Cigogne' });
    await f2.annuler();
    expect(m.tout('financialPlans')).toEqual([{ ...probable, status: 'active' }]);
  });
});

describe('Banc (?preview=calendrier) : la fixture et son port disent la même chose que l’app (CRITIQUE-3 n° 1, 2, 8, 9, 18, 19)', () => {
  const modeleBanc = (e: EtatBanc) => construireModele({
    aujourdhui: AUJOURDHUI, transactions: e.transactions, payments: [], plans: e.plans, profile, assets: [], batches: e.batches, stockItems: [],
    items: e.items, recettes: e.recettes, reglages: e.reglages ?? REGLAGES_VIDES, lignesCourses: e.lignesCourses ?? []
  });

  it('la rangée Brassins au repos : IPA « J7 / 28 », Saison « pas brassée », Stout en barre, un montant sur chaque brassin, aucune proposition de Stout', () => {
    const mod = modeleBanc(etatBanc(AUJOURDHUI));
    const prets = preparerChoses(mod.choses);
    const de = (id: string) => prets.find(c => c.id === id)!;
    expect(texteDuree(de('brassin-LOT-IPA'))).toBe('J7 / 28 · prête 7 déc.');
    expect(texteDuree(de('brassin-LOT-SAISON'))).toBe('pas brassée · prévue le 10 nov.');
    const stout = de('brassin-LOT-STOUT-4');
    expect(stout).toMatchObject({ debut: '2026-11-25', preteLe: '2026-12-23' });
    expect(texteDuree(stout)).toBe('J0 / 28 · prête 23 déc.');
    expect(prets.some(c => c.proposition === 'brassin-habituel' && c.recipeRef === 'R-STOUT')).toBe(false);
    expect(prets.filter(c => c.proposition === 'brassin-habituel').map(c => c.recipeRef)).toEqual(['R-AMBREE']);
    for (const id of ['LOT-BLONDE', 'LOT-PORTER', 'LOT-IPA', 'LOT-SAISON', 'LOT-STOUT-4']) expect(de(`brassin-${id}`).centimes ?? 0).toBeLessThan(0);
    /* les étapes de la Blonde : brassage, fermentation, dry hop, garde, conditionnement, et « commander » avec ses articles */
    const blonde = de('brassin-LOT-BLONDE');
    expect(blonde.jalons!.map(j => j.id)).toEqual(['commander', 'brassage', 'fermentation', 'dry-hop', 'garde', 'conditionnement']);
    expect(blonde.jalons!.find(j => j.id === 'commander')!.articles).toEqual(['Malt pilsner', 'Saaz']);
    expect(blonde.courses).toMatch(/Malt pilsner/);
    expect(blonde.courses).not.toMatch(/énergie|emballage|impôt/);
    expect(blonde.frais).toMatch(/énergie et nettoyage/);
    expect(blonde.frais).toMatch(/emballage/);
    /* l'impôt sur la bière : dans Papiers, jamais dans les courses ni le budget */
    const impots = prets.filter(c => c.posteBrassin === 'impot');
    expect(impots.length).toBeGreaterThan(0);
    for (const i of impots) expect(i.rangee).toBe('papiers');
    /* retards : la Saison pas brassée et la facture Hopfen, nommés et datés ; rien sans date */
    expect(mod.retards.map(r => r.id).sort()).toEqual(['brassin-LOT-SAISON', 'reste-F-HOPFEN']);
  });

  it('le port du banc : Ajouter une vente probable l’accepte (une seule vente, pleine) ; Annuler la remet', async () => {
    let etat = etatBanc(AUJOURDHUI);
    const port = creerPortMemoire(() => etat, s => { etat = s; });
    const ctx = { aujourdhui: AUJOURDHUI, recettes: etat.recettes, clients: etat.clients.map(c => ({ id: c.id, name: c.name })), plans: etat.plans, choses: modeleBanc(etat).choses, nouvelId: (x: string) => `${x}-NEW` };
    const puce = puces('ventes', ctx).find(p => p.genre === 'vente-probable' && p.planId === 'P-CAFE')!;
    const conv = versEnregistrement(toucherSemaine(appliquerPuce(brouillonVide('ventes', '2026-12-07'), puce), '2026-12-07'), ctx);
    if (!('enregistrement' in conv)) throw new Error(conv.raison);
    const faite = await appliquer([ecritureDeAjout(conv.enregistrement)], port);
    const cafe = preparerChoses(modeleBanc(etat).choses).filter(c => c.titre.startsWith('Café du Pont'));
    expect(cafe).toHaveLength(1);
    expect(cafe[0]).toMatchObject({ id: 'argent-P-CAFE', centimes: 13000 });
    expect(cafe[0].probable).toBeUndefined();
    expect(etat.plans.filter(p => p.id === 'P-CAFE')).toHaveLength(1);
    await faite.annuler();
    expect(etat.plans.find(p => p.id === 'P-CAFE')!.status).toBe('draft');
  });

  it('CRITIQUE-6 n° 7 et D-76 : Brouwland et Hopfen dans Achats, aucune chose Papiers ne les porte ; la TVA T4 dans Papiers avec son titre', () => {
    const prets = preparerChoses(modeleBanc(etatBanc(AUJOURDHUI)).choses);
    const achats = prets.filter(c => c.rangee === 'achats').map(c => c.titre);
    expect(achats).toEqual(expect.arrayContaining(['Brouwland · malt', 'Hopfen · Hallertau Blanc']));
    expect(prets.filter(c => c.rangee === 'papiers' && /Brouwland|Hopfen/.test(c.titre))).toEqual([]);
    /* le harnais touche la facture par son titre, « Payé » d'un toucher : la pièce reste sa source */
    expect(prets.find(c => c.titre.startsWith('Brouwland'))).toMatchObject({ source: { genre: 'facture', id: 'F-BROUWLAND' }, ouvre: { ecran: 'piece', id: 'F-BROUWLAND' }, centimes: -42000 });
    /* la facture d'entrée reste une vente */
    expect(prets.find(c => c.titre === 'Facture Café du Lac')!.rangee).toBe('ventes');
    /* D-76 : la TVA T4 (plan fiscal) tombe dans Papiers, avec son titre */
    expect(prets.find(c => c.titre === 'TVA T4')).toMatchObject({ rangee: 'papiers', source: { genre: 'plan', origine: 'tax' }, centimes: -30000 });
    /* le loyer (récurrent) reste dans Papiers */
    expect(prets.filter(c => c.titre === 'Loyer du local').every(c => c.rangee === 'papiers')).toBe(true);
  });

  it('CRITIQUE-6 n° 7 : la facture Brouwland due la semaine de sa livraison est posée SUR la « Livraison Brouwland » : une chose, −420, la pièce', () => {
    const e = etatBanc(AUJOURDHUI);
    /* la livraison attendue tombe le 21 nov. (commande du 14 nov. + 7 j appris) : la facture due le 20 nov. est de la même semaine */
    const memeSemaine = { ...e, transactions: e.transactions.map(t => (t.id === 'F-BROUWLAND' ? { ...t, finance: { ...t.finance!, dueDate: '2026-11-20' } } : t)) };
    const prets = preparerChoses(modeleBanc(memeSemaine).choses);
    const brouwland = prets.filter(c => /Brouwland/.test(c.titre));
    expect(brouwland).toHaveLength(1);
    expect(brouwland[0]).toMatchObject({ rangee: 'achats', titre: 'Livraison Brouwland · malt', centimes: -42000, debut: '2026-11-20', source: { genre: 'facture', id: 'F-BROUWLAND' } });
    expect(brouwland[0].detail).toMatch(/délai appris 7 j/);
    /* la courbe porte la facture une fois, sous ce nom */
    const m = modeleBanc(memeSemaine);
    expect(m.courbe!.mouvements.filter(x => x.id === 'invoice:F-BROUWLAND').map(x => x.nom)).toEqual(['Livraison Brouwland · malt']);
  });

  it('CRITIQUE-6 n° 15 : la Cigogne liée à la Blonde dit « lié à Blonde d’automne » ; l’Épicerie, déjà nommée, n’a pas de pastille', () => {
    const prets = preparerChoses(modeleBanc(etatBanc(AUJOURDHUI)).choses, { clients: new Map(etatBanc(AUJOURDHUI).clients.map(c => [c.id, c.name])) });
    expect(prets.find(c => c.id === 'argent-P-CIGOGNE')!.lie).toMatchObject({ texte: 'lié à Blonde d’automne' });
    expect(prets.find(c => c.id === 'argent-P-CIGOGNE')!.lie!.client).toBeUndefined();
    expect(prets.find(c => c.id === 'argent-P-EPICERIE')!.lie).toBeUndefined();
  });

  it('CRITIQUE-6 n° 15 : poser une vente à La Cigogne reprend « 3 fûts » de sa vente habituelle : « 3 fûts La Cigogne +900 », sans pastille qui répète le nom', async () => {
    let etat = etatBanc(AUJOURDHUI);
    const port = creerPortMemoire(() => etat, s => { etat = s; });
    const ctx = { aujourdhui: AUJOURDHUI, recettes: etat.recettes, clients: etat.clients.map(c => ({ id: c.id, name: c.name })), plans: etat.plans, choses: modeleBanc(etat).choses, nouvelId: (x: string) => `${x}-NEW` };
    const puce = puces('ventes', ctx).find(p => p.genre === 'client' && p.clientId === 'CL-CIGOGNE')!;
    expect(puce).toMatchObject({ libelle: 'La Cigogne', quoi: '3 fûts', titreHabituel: '3 fûts La Cigogne', centimes: 90000 });
    const conv = versEnregistrement(toucherSemaine(appliquerPuce(brouillonVide('ventes', '2026-12-07'), puce), '2026-12-07'), ctx);
    if (!('enregistrement' in conv)) throw new Error(conv.raison);
    await appliquer([ecritureDeAjout(conv.enregistrement)], port);
    const posee = preparerChoses(modeleBanc(etat).choses, { clients: new Map(etat.clients.map(c => [c.id, c.name])) }).find(c => c.id === 'argent-PLAN-NEW')!;
    expect(posee).toMatchObject({ titre: '3 fûts La Cigogne', centimes: 90000, rangee: 'ventes' });
    expect(posee.lie).toBeUndefined();
    /* un client sans vente habituelle chiffrée : son nom seul, aucune quantité inventée */
    const avecNeuf = { ...ctx, clients: [...ctx.clients, { id: 'CL-NEUF', name: 'Bar Neuf' }] };
    expect(puces('ventes', avecNeuf).find(p => p.genre === 'client' && p.clientId === 'CL-PONT')).toMatchObject({ quoi: '1 fût' });
    const neuf = puces('ventes', avecNeuf).find(p => p.genre === 'client' && p.clientId === 'CL-NEUF')!;
    expect(neuf).not.toHaveProperty('quoi');
    expect(neuf).not.toHaveProperty('centimes');
  });
});
