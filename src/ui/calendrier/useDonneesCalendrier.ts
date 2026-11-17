import { useMemo } from 'react';
import type { Batch, Client, CreativeItem, Recipe, StockItem, Transaction } from '../../types';
import type { FinancialAsset, FinancialPayment, FinancialPlan, FinancialProfile } from '../../domain/finance/types';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { useStorageValue } from '../../hooks/useLiveData';
import { useReglagesFournisseurs } from '../fournisseurs/useReglagesFournisseurs';
import { buildForecast } from '../../domain/finance/forecast';
import { periodeSynthese } from '../../domain/finance/periodeSynthese';
import { todayISO } from '../../domain/finance/ledger';
import { fermentationReadings } from '../../domain/fermentationReadings';
import { articlesACommander } from '../../domain/stockLevel';
import { etiquetteSemaine, vueHorizon, type LigneHorizon } from '../../domain/stock/horizon';
import type { ReglagesFournisseurs } from '../../domain/fournisseurs';
import {
  NB_SEMAINES_COURBE, ajouterJours, anneeEnMois, choseArgent, choseBrassin, choseCreative, choseSansDate, choseVenteProbable, francs, iconesIdees, livraisonsAttendues,
  lundiDe, numeroSemaine, positionChose, retardsDe, semainesDe,
  type ChoseCalendrier, type HypotheseCaisse, type IconeSemaine, type ModeleCalendrier
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

export function construireModele(e: EntreesModele): ModeleCalendrier {
  const { aujourdhui } = e;
  const lundi0 = lundiDe(aujourdhui);
  const semaines = semainesDe(aujourdhui, NB_SEMAINES_COURBE);
  const prevision = buildForecast({
    transactions: e.transactions, payments: e.payments, plans: e.plans, profile: e.profile, assets: e.assets, asOf: aujourdhui, months: 13,
    batches: e.batches, stockItems: e.stockItems, includeEquipmentProjects: true
  });
  const marques = new Set(echeancesProposees(prevision.items).filter(i => i.proposition === 'echeance').map(i => `argent-${i.id}`));

  const manques = new Map<string, number>();
  for (const l of e.lignesCourses ?? []) {
    if (l.semaine === null) continue;
    for (const s of l.sources) if (s.genre === 'brassin') manques.set(s.id, (manques.get(s.id) ?? 0) + 1);
  }
  const brassins = e.batches.flatMap(b => {
    const chose = choseBrassin(b, aujourdhui);
    if (!chose || !(manques.get(b.id) ?? 0)) return chose ? [chose] : [];
    const avant = chose.jalons?.find(j => j.id === 'brassage')?.jour;
    const avecCourses = choseBrassin(b, aujourdhui, { commanderLe: avant ? ajouterJours(avant, -1) : null });
    return avecCourses ? [avecCourses] : [];
  });
  const argent = prevision.items.flatMap(i => { const c = choseArgent(i, e.plans); return c ? [marques.has(c.id) ? { ...c, proposition: 'echeance' as const } : c] : []; });
  const creatives = e.items.flatMap(i => { const c = choseCreative(i); return c ? [c] : []; });
  const probables = e.plans.flatMap(p => { const c = choseVenteProbable(p); return c ? [c] : []; });
  const propositionsBrassin = brassinsHabituels(e.batches, aujourdhui);
  const choses = [...brassins, ...creatives, ...argent, ...probables, ...livraisonsAttendues(e.reglages), ...propositionsBrassin].filter(dansLaFenetre(semaines));

  const titreDe = new Map(choses.map(c => [c.id, c.titre]));
  const mouvements: MouvementCaisse[] = prevision.items.map(i => ({
    id: i.id, jour: i.date, centimes: i.direction === 'in' ? i.amountCents : -i.amountCents, nom: titreDe.get(`argent-${i.id}`) ?? i.label,
    choseId: `argent-${i.id}`, ...(i.source === 'trend' ? { tendance: true } : {})
  }));
  const courbe = courbeCaisse({ depart: prevision.openingCashCents, lundi0, mouvements, mises: misesDe(choses) });

  const synthese = periodeSynthese({ transactions: e.transactions, payments: e.payments, mois: null, aujourdhui, assets: e.assets });
  const sansDensite = e.batches.filter(b => b.status === 'fermentation' && !b.archivedAt && fermentationReadings(b).latest === undefined);
  const retards = retardsDe({ aujourdhui, restes: [...synthese.aPayer, ...synthese.aEncaisser], batches: e.batches, items: e.items, sansDensite, courses: e.courses });

  const hypotheses: HypotheseCaisse[] = [];
  if (prevision.openingCashCents !== null) hypotheses.push({ id: 'depart', texte: `Solde de départ : ${francs(prevision.openingCashCents)} CHF`, source: 'Finances › Solde', ouvre: { ecran: 'solde' } });
  const mensuelles = prevision.months.map(m => m.projectedCents).filter(n => n > 0);
  if (mensuelles.length) hypotheses.push({ id: 'tendance', texte: `Autres dépenses : −${francs(Math.round(mensuelles.reduce((s, n) => s + n, 0) / mensuelles.length))} par mois (tendance de Finances)`, source: 'Finances', ouvre: { ecran: 'finances' } });

  const icones: IconeSemaine[] = [
    ...iconesIdees(e.items),
    ...retards.filter(r => r.jour).map<IconeSemaine>(r => {
      const lundi = lundiDe(r.jour as string) < lundi0 ? lundi0 : lundiDe(r.jour as string);
      return { id: `retard-${r.id}`, lundi, numero: numeroSemaine(lundi), genre: 'retard', titre: r.titre, ouvre: r.ouvre };
    })
  ];

  return {
    aujourdhui, semaines, mois: anneeEnMois(aujourdhui), choses, courbe, soldeDepartInconnu: courbe === null, creux: courbe ? creuxDepuis(courbe, 0) : null, hypotheses, retards,
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
