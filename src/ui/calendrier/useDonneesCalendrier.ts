import { useMemo } from 'react';
import type { Batch, Client, CreativeItem, Recipe, StockItem, Transaction } from '../../types';
import type { FinancialAsset, FinancialPayment, FinancialPlan, FinancialProfile } from '../../domain/finance/types';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { useStorageValue } from '../../hooks/useLiveData';
import { useReglagesFournisseurs } from '../fournisseurs/useReglagesFournisseurs';
import { buildForecast } from '../../domain/finance/forecast';
import { periodeSynthese } from '../../domain/finance/periodeSynthese';
import { isoDate, todayISO, validPayment } from '../../domain/finance/ledger';
import { fermentationReadings } from '../../domain/fermentationReadings';
import { articlesACommander } from '../../domain/stockLevel';
import { etiquetteSemaine, vueHorizon, type LigneHorizon } from '../../domain/stock/horizon';
import type { ReglagesFournisseurs } from '../../domain/fournisseurs';
import { planBrewBatchId, type BudgetRepris } from '../../domain/finance/brewForecast';
import { brewBudgetDemands } from '../../domain/finance/brewBudget';
import { hasBrewStarted } from '../../domain/batchSchedule';
import {
  HORIZON_SEMAINES, NB_SEMAINES_COURBE, SEMAINES_PASSEES_MAX, ajouterJours, ecartJours, anneeEnMois, budgetBrassin, coutRestantInconnu, choseArgent, choseHorsCourbe, choseBrassin, choseCoutAVenir, choseCreative, choseSansDate, choseAchatPrevu, choseVenteProbable, estFactureDeMatieres,
  fournisseurDePiece, francs, francsSignes, fusionnerFacturesLivraisons, iconesIdees, jourLisible,
  livraisonsAttendues, lundiDe, numeroSemaine, positionChose, retardsDe, semainesDe,
  type ChoseCalendrier, type EstimationBudget, type HypotheseCaisse, type IconeSemaine, type ModeleCalendrier
} from '../../domain/calendrier';
import { courbeCaisse, creuxDepuis, type MiseDeCote, type MouvementCaisse } from '../../domain/calendrierCaisse';
import { brassinsHabituels, echeancesProposees } from '../../domain/calendrierPropositions';

/**
 * Lit le stockage et la finance de l'app et rend le `ModeleCalendrier` (MISSION § Données). Rien n'est inventé : chaque chose vient d'une source,
 * l'inconnu reste inconnu (pas de solde de départ : pas de courbe), un brassin se pose avec ses jalons, tout ce qui est daté dans l'app arrive.
 *
 * `construireModele` est pur (le jour est un paramètre) : les tests le jouent sans stockage. Le hook ne fait que le nourrir.
 */

export interface EntreesModele {
  aujourdhui: string;
  transactions: Transaction[];
  payments: FinancialPayment[];
  plans: FinancialPlan[];
  profile: FinancialProfile;
  assets: FinancialAsset[];
  batches: Batch[];
  stockItems: StockItem[];
  items: CreativeItem[];
  recettes: Recipe[];
  reglages: ReglagesFournisseurs;
  /** Les courses datées (`vueHorizon(...).lignes`) : de quoi poser « commander avant le … » sur les brassins dont il manque quelque chose. */
  lignesCourses?: readonly LigneHorizon[];
  /** « Commander pour X avant S49 » (E08), déjà calculé par `vueHorizon`. */
  courses?: { nom: string; nombre: number; avant: string } | null;
}

/** Les mises de côté : une chose avec fenêtre, `miseDeCote` et un montant. Le montant est la valeur absolue du coût connu. */
function misesDe(choses: readonly ChoseCalendrier[]): MiseDeCote[] {
  return choses.filter(c => c.miseDeCote && c.fenetre && c.centimes !== undefined && c.centimes !== 0).map(c => ({ id: c.id, titre: c.titre, du: c.fenetre!.du, au: c.fenetre!.au, centimes: Math.abs(c.centimes as number) }));
}

const dansLaFenetre = (semaines: ModeleCalendrier['semaines']) => (c: ChoseCalendrier) => positionChose(semaines, c) !== null;

/**
 * Les estimations enregistrées par `BrewBudgetSheet` (« Prévoir » : un plan `brew` qui porte `brewEstimate`), par brassin : l'argent à sortir
 * (`cashRequiredTTC`), sinon le montant du plan. Incomplète (`complete: false`) : partielle. Un plan annulé ne compte pas.
 */
export function estimationsBudget(plans: readonly FinancialPlan[]): Map<string, EstimationBudget> {
  const sortie = new Map<string, EstimationBudget & { le: string }>();
  for (const p of plans) {
    if (p.source !== 'brew' || p.status === 'cancelled' || p.direction !== 'out') continue;
    const batchId = planBrewBatchId(p);
    if (!batchId) continue;
    const snap = p.brewEstimate as { cashRequiredTTC?: number; complete?: boolean; createdAt?: string } | undefined;
    const centimes = typeof snap?.cashRequiredTTC === 'number' && Number.isFinite(snap.cashRequiredTTC) && snap.cashRequiredTTC > 0 ? Math.round(snap.cashRequiredTTC * 100) : p.amountCents > 0 ? p.amountCents : 0;
    if (!centimes) continue;
    const le = snap?.createdAt ?? p.createdAt ?? '';
    const avant = sortie.get(batchId);
    if (avant && avant.le > le) continue;
    sortie.set(batchId, { centimes: -centimes, partiel: snap?.complete === false, le });
  }
  return new Map([...sortie].map(([id, { centimes, partiel }]) => [id, { centimes, partiel }]));
}

/** Un brassin pas encore commencé : planifié, sans brassage réel. */
const pasCommence = (b: Batch): boolean => b.status === 'planifie' && !hasBrewStarted(b);

/**
 * CAL-RETOUR-PASSE (22.11) : la frise montre toujours `SEMAINES_PASSEES_MAX` semaines d'avant la semaine courante, comme elle montre l'année à
 * venir. Le solde de départ ne borne plus le passé (tour 9 : le bord tombait à la date du solde, le cadre ne reculait plus). Avant cette date la
 * caisse reste plate au solde de départ : `mouvementsPasses` ne compte aucun paiement d'avant lui (voir `construireModele`).
 */
export function semainesPassees(): number {
  return SEMAINES_PASSEES_MAX;
}

/** Les paiements réels de la caisse du lundi `depuis` à aujourd'hui inclus : les mouvements des semaines passées de la courbe (les mêmes que `summarizeLedger`). */
export function mouvementsPasses(payments: readonly FinancialPayment[], transactions: readonly Transaction[], depuis: string, aujourdhui: string): MouvementCaisse[] {
  const noms = new Map(transactions.map(t => [t.id, t.description || t.id] as const));
  return payments.filter(p => validPayment(p) && isoDate(p.date)! >= depuis && isoDate(p.date)! <= aujourdhui).map(p => ({
    id: `paiement-${p.id}`, jour: isoDate(p.date)!, centimes: p.direction === 'in' ? p.amountCents : -p.amountCents, nom: noms.get(p.transactionId) ?? 'Paiement'
  }));
}

export function construireModele(e: EntreesModele): ModeleCalendrier {
  const { aujourdhui } = e;
  const prevoir = (plans: FinancialPlan[], batches: Batch[]) => buildForecast({
    transactions: e.transactions, payments: e.payments, plans, profile: e.profile, assets: e.assets, asOf: aujourdhui, months: 13,
    batches, stockItems: e.stockItems, includeEquipmentProjects: true
  });
  const prevision = prevoir(e.plans, e.batches);
  /* n° 2 (CRITIQUE-4), D405 : un brassin sans budget chiffré reprend celui de sa recette ; buildForecast l'applique (une seule caisse) et
     marque ses sorties `repriseRecette` : le calendrier lit cette marque, sans refaire le calcul */
  const repris = new Map<string, BudgetRepris>();
  for (const i of prevision.items) if (i.batchId && i.repriseRecette && !repris.has(i.batchId)) repris.set(i.batchId, i.repriseRecette);
  /* CHD-1 (21.11) : « une seule caisse » (K4) : le solde est connu comme Finances et le Bord le disent, la caisse COMPLÈTE (`cashComplete`, `pointBasAVenir`) ;
     une pièce payée sans paiement le rend inconnu : pas de courbe ni de « CHF à dépenser » chiffré, jamais un solde posé comme sûr */
  const soldeConnu = prevision.cashComplete && prevision.openingCashCents !== null;
  const passe = semainesPassees();
  const semaines = semainesDe(aujourdhui, HORIZON_SEMAINES + passe, passe);
  const lundi0 = semaines[0].debut;
  const marques = new Set(echeancesProposees(prevision.items).filter(i => i.proposition === 'echeance').map(i => `argent-${i.id}`));

  /* les articles qui manquent pour chaque brassin, lus dans les courses de l'app (`vueHorizon`) : leurs noms, jamais inventés (n° 2, n° 19) */
  const manques = new Map<string, string[]>();
  for (const l of e.lignesCourses ?? []) {
    if (l.semaine === null) continue;
    const nom = l.item?.name?.trim();
    for (const s of l.sources) if (s.genre === 'brassin') manques.set(s.id, [...(manques.get(s.id) ?? []), ...(nom ? [nom] : [])]);
  }
  const commandes: Array<{ batchId: string; nom: string; avantLe: string; articles: string[] }> = [];
  const brassins = e.batches.flatMap(b => {
    const chose = choseBrassin(b, aujourdhui);
    if (!chose || chose.pasBrassee || !manques.has(b.id)) return chose ? [chose] : [];
    const avant = chose.jalons?.find(j => j.id === 'brassage')?.jour;
    const articles = [...new Set(manques.get(b.id) ?? [])];
    const commanderLe = avant ? ajouterJours(avant, -1) : null;
    if (commanderLe) commandes.push({ batchId: b.id, nom: b.name || b.id, avantLe: commanderLe, articles });
    const avecCourses = choseBrassin(b, aujourdhui, { commanderLe, articles });
    return avecCourses ? [avecCourses] : [];
  });
  /* CRITIQUE-5 n° 4 : la vraie échéance de chaque facture, pour qu'une facture échue garde sa date (la prévision la compte à aujourd'hui) */
  const echeances = new Map(e.transactions.flatMap(t => (t.finance?.dueDate ? [[t.id, t.finance.dueDate] as [string, string]] : [])));
  /* CRITIQUE-6 n° 7 : les factures de matières (lignes, entrée en stock, fournisseur des matières du stock, catégorie) vont dans Achats */
  const matieres = new Set(e.transactions.filter(t => estFactureDeMatieres(t, e.stockItems)).map(t => t.id));
  const fournisseurs = new Map(e.transactions.map(t => [t.id, fournisseurDePiece(t)] as [string, string]));
  const argent = prevision.items.flatMap(i => { const c = choseArgent(i, e.plans, echeances, matieres); return c ? [marques.has(c.id) ? { ...c, proposition: 'echeance' as const } : c] : []; });
  const creatives = e.items.flatMap(i => { const c = choseCreative(i); return c ? [c] : []; });
  const probables = e.plans.flatMap(p => { const c = choseVenteProbable(p); return c ? [c] : []; });
  const achatsPrevus = e.plans.flatMap(p => { const c = choseAchatPrevu(p); return c ? [c] : []; });
  const propositionsBrassin = brassinsHabituels(e.batches, aujourdhui);
  /* CRITIQUE-7 n° 8 : la facture d'un fournisseur se pose sur la livraison qu'elle règle (émise ou due dans le délai appris) : une chose dans Achats */
  const emises = new Map(e.transactions.flatMap(t => (t.date ? [[t.id, t.date] as [string, string]] : [])));
  /* B11 (WFV-3, 21.11) : la vente encaissée (caisse : pièce de recette payée et son paiement) est une chose de la rangée Ventes, à son jour ;
     la prévision n'a que l'à venir. Une pièce encore attendue dans la prévision (reste à encaisser) y est déjà : pas deux fois. */
  const attendues = new Set(prevision.items.filter(i => i.source === 'invoice').map(i => i.id.replace(/^invoice:/, '')));
  const pieces = new Map(e.transactions.map(t => [t.id, t] as const));
  const encaissees = e.payments.flatMap((pay): ChoseCalendrier[] => {
    const t = pay.transactionId ? pieces.get(pay.transactionId) : undefined;
    const jour = isoDate(pay.date);
    if (!t || !jour || pay.direction !== 'in' || t.finance?.kind !== 'income' || attendues.has(t.id) || !validPayment(pay) || jour < lundi0 || jour > aujourdhui) return [];
    return [{ id: `paiement-${pay.id}`, rangee: 'ventes', titre: t.description || t.id, debut: jour, fin: jour, centimes: pay.amountCents, detail: `encaissée le ${jourLisible(jour)}`,
      source: { genre: 'facture', id: t.id }, ouvre: { ecran: 'piece', id: t.id }, deplacable: { raison: 'Vente encaissée : sa date est un fait. Elle se corrige dans la pièce (Finances › Opérations).' } }];
  });
  const posees = fusionnerFacturesLivraisons([...brassins, ...creatives, ...argent, ...encaissees, ...probables, ...achatsPrevus, ...livraisonsAttendues(e.reglages), ...propositionsBrassin], fournisseurs, emises).filter(dansLaFenetre(semaines));
  /* n° 9 : chaque brassin porte son budget (courses et frais de la prévision ; à défaut, l'estimation enregistrée de BrewBudgetSheet) */
  const estimations = estimationsBudget(e.plans);
  const batchDe = new Map(e.batches.map(b => [b.id, b] as const));
  const chosesBudget = posees.map((c): ChoseCalendrier => {
    if (c.source.genre !== 'batch' || c.conditionne || c.proposition) return c;
    const batch = batchDe.get(c.source.id);
    const commence = !!batch && !pasCommence(batch);
    const b = budgetBrassin(c.source.id, posees, estimations);
    /* CRITIQUE-4 n° 2 : sans budget, un brassin à venir dit « coût à venir » en mots, sans `centimes` (jamais 0) ; un brassin commencé n'a rien à
       dire, sauf CHD-11 (21.11) : sa prévision a un emballage ou des courses sans montant, l'inconnu se dit aussi (jamais 0) */
    if (!b) return commence && !coutRestantInconnu(c.source.id, posees) ? c : choseCoutAVenir(c);
    const r = repris.get(c.source.id);
    return {
      ...c, centimes: b.centimes, ...(b.partiel ? { partiel: true as const } : {}),
      /* doute IPA −45 : en cuve, les courses sont faites ; le montant est ce qui RESTE à sortir (emballage), et la barre le dit */
      /* le mot « reste » est dit dans le détail et la Liste ; sur la barre, à côté du montant, par Barre.tsx (demandé au lot q2-frise) :
         ajouté au nom, il tronquait le nom à 390 (« IPA de … −45 », capture m390-blonde-posee) */
      ...(commence ? { reste: true as const } : {}),
      ...(r ? { budgetRepris: `budget de la recette, repris de ${r.depuis}${r.le ? ` (estimé le ${jourLisible(r.le)})` : ''}` } : {})
    };
  });

  const titreDe = new Map(chosesBudget.map(c => [c.id, c.titre]));
  const mouvements: MouvementCaisse[] = prevision.items.map(i => ({
    id: i.id, jour: i.date, centimes: i.direction === 'in' ? i.amountCents : -i.amountCents, nom: titreDe.get(`argent-${i.id}`) ?? i.label,
    choseId: `argent-${i.id}`, ...(i.source === 'trend' ? { tendance: true } : {})
  }));
  /* T11-1 (L-26 : « on peut aussi lui donner ou estimer directement un prix ») : l'achat prévu d'un carnet, chiffré (prix de l'article ou estimé),
     entre dans « à dépenser » à sa semaine ; il se déplace avec sa barre (choseId). Sans montant : rien (jamais 0 inventé). */
  for (const c of achatsPrevus) if (c.centimes) mouvements.push({ id: c.id, jour: c.debut, centimes: c.centimes, nom: c.titre, choseId: c.id });
  const mises = misesDe(chosesBudget);
  /* le passé : le départ de la courbe est la caisse d'aujourd'hui moins les paiements réels d'entre-temps (même formule que le solde de Finances) */
  const ouvertureLe = soldeConnu ? isoDate(e.profile.openingCash?.date) : null; // avant lui, la caisse est plate : aucun paiement ne s'y compte
  const reels = (passe ? mouvementsPasses(e.payments, e.transactions, ouvertureLe && ouvertureLe > lundi0 ? ouvertureLe : lundi0, aujourdhui) : []).map(m => (chosesBudget.some(c => c.id === m.id) ? { ...m, choseId: m.id } : m));
  const depart = !soldeConnu || prevision.openingCashCents === null ? null : prevision.openingCashCents - reels.reduce((s, m) => s + m.centimes, 0);
  const courbe = courbeCaisse({ depart, lundi0, nbSemaines: HORIZON_SEMAINES + passe, passe, mouvements: [...reels, ...mouvements], mises });
  /* CRITIQUE-12 n° 2 (E23, A2) : la règle de l'effet en mots (`effetEnMots`) posée sur la chose : une fête ou une activité chiffrée que la
     courbe ne compte pas est « hors courbe » ; sa rangée la dit « estimé », jamais « confirmé ». Les mouvements, pas la courbe : le marquage
     ne dépend pas du solde de départ. Elle n'entre pas dans la courbe (vérité croisée A2 : la courbe = `buildForecast`). */
  const comptees = new Set<string>([...mouvements.map(m => m.choseId).filter((x): x is string => !!x), ...mises.map(m => m.id)]);
  const choses = chosesBudget.map(c => (choseHorsCourbe(c, comptees) ? { ...c, horsCourbe: true as const } : c));

  const synthese = periodeSynthese({ transactions: e.transactions, payments: e.payments, mois: null, aujourdhui, assets: e.assets });
  const sansDensite = e.batches.filter(b => b.status === 'fermentation' && !b.archivedAt && fermentationReadings(b).latest === undefined);
  /* n° 34 : seulement ce qui est vraiment en retard, nommé et daté ; les courses comptent quand le jour où il fallait commander est passé */
  const retards = retardsDe({ aujourdhui, restes: [...synthese.aPayer, ...synthese.aEncaisser], batches: e.batches, items: e.items, sansDensite, commandes, courses: e.courses ?? null });

  const hypotheses: HypotheseCaisse[] = [];
  if (soldeConnu && prevision.openingCashCents !== null) hypotheses.push({ id: 'depart', texte: `Solde de départ : ${francs(prevision.openingCashCents)} CHF`, source: 'Finances › Solde', ouvre: { ecran: 'solde' } });
  /* n° 32, E01 : la tendance de Finances (lignes `trend` de la prévision), par mois, avec sa source ; sans tendance, rien */
  const tendance = new Map<string, number>();
  for (const i of prevision.items) if (i.source === 'trend') tendance.set(i.date.slice(0, 7), (tendance.get(i.date.slice(0, 7)) ?? 0) + (i.direction === 'in' ? i.amountCents : -i.amountCents));
  for (const [id] of repris) {
    const c = choses.find(x => x.source.genre === 'batch' && x.source.id === id);
    if (c?.centimes === undefined) continue;
    hypotheses.push({ id: `budget-repris-${id}`, texte: `${c.titre} : ${francsSignes(c.centimes)} CHF, budget repris de sa recette, estimé`, source: 'Budget › du brassin', ouvre: { ecran: 'brassin', id } });
  }
  if (tendance.size) {
    const parMois = Math.round([...tendance.values()].reduce((s, n) => s + n, 0) / tendance.size);
    /*
     * CRITIQUE-10, doute m04 : la tendance est la médiane des charges payées MOINS les charges déjà prévues (le loyer récurrent, compté à part dans
     * la courbe) : « moyenne des mois passés » se lisait comme un double compte (−400 de loyer et −250 de moyenne, alors que 650 sont payés).
     */
    if (parMois !== 0) hypotheses.push({ id: 'tendance', texte: `Tendance de Finances : ${francsSignes(parMois)} CHF/mois`, source: 'Finances › Prévision (médiane des charges payées, moins les charges déjà prévues)', ouvre: { ecran: 'finances' } });
  }

  const icones: IconeSemaine[] = [
    ...iconesIdees(e.items, e.plans),
    ...retards.filter(r => r.jour).map<IconeSemaine>(r => {
      const lundi = lundiDe(r.jour as string) < lundi0 ? lundi0 : lundiDe(r.jour as string);
      return { id: `retard-${r.id}`, lundi, numero: numeroSemaine(lundi), genre: 'retard', titre: r.titre, ouvre: r.ouvre };
    })
  ];

  return {
    aujourdhui, semaines, passe, mois: anneeEnMois(aujourdhui, HORIZON_SEMAINES + passe, passe), choses, courbe, soldeDepartInconnu: courbe === null, causeSoldeInconnu: courbe === null ? (prevision.cashCause ?? null) : null, creux: courbe ? creuxDepuis(courbe, passe) : null, hypotheses, retards,
    propositions: choses.filter(c => c.proposition), sansDate: e.items.flatMap(i => { const c = choseSansDate(i); return c ? [c] : []; }), icones
  };
}

export interface DonneesCalendrier {
  modele: ModeleCalendrier;
  plans: FinancialPlan[];
  batches: Batch[];
  recettes: Recipe[];
  clients: Client[];
  items: CreativeItem[];
  aujourdhui: string;
}

const lireFinance = () => FinanceService.snapshot();
const lireItems = () => StorageService.getCreativeItems();
const lireRecettes = () => StorageService.getRecipes();
const lireClients = () => StorageService.getClients();

/** Le modèle du calendrier, recalculé quand le stockage ou la finance change. `batches`, `transactions` et `stockItems` viennent de l'application (props de l'onglet). */
export function useDonneesCalendrier(entree: { transactions: Transaction[]; batches: Batch[]; stockItems: StockItem[]; aujourdhui?: string }): DonneesCalendrier {
  const aujourdhui = entree.aujourdhui ?? todayISO();
  const finance = useStorageValue(lireFinance);
  const items = useStorageValue(lireItems);
  const recettes = useStorageValue(lireRecettes);
  const clients = useStorageValue(lireClients);
  const [reglages] = useReglagesFournisseurs();
  const { transactions, batches, stockItems } = entree;
  const modele = useMemo(() => {
    const vue = vueHorizon(articlesACommander(stockItems, batches, recettes), batches, aujourdhui);
    const courses = vue.brassin && vue.comptes.brassin > 0 ? { nom: vue.brassin.nom, nombre: vue.comptes.brassin, avant: etiquetteSemaine(vue.limiteBrassin) } : null;
    return construireModele({
      aujourdhui, transactions, payments: finance.payments, plans: finance.plans, profile: finance.profile, assets: finance.assets, batches, stockItems, items, recettes, reglages,
      lignesCourses: vue.lignes, courses
    });
  }, [aujourdhui, transactions, finance, batches, stockItems, items, recettes, reglages]);
  return { modele, plans: finance.plans, batches, recettes, clients, items, aujourdhui };
}
