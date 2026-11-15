import type { Batch, Recipe, StockItem } from '../../types';
import { batchDisplayDate, hasBrewStarted } from '../batchSchedule';
import { ingredientsOf } from '../recipeSnapshot';
import { annualBrewFixedCosts, brewBudgetDateKey, brewBudgetDemands, estimateBrewBudget, resolveBudgetStock, BREW_COST_LABELS, type BrewBudgetSnapshot, type BrewCostKey } from './brewBudget';
import { coutLitre, litresNets, troisNotions, type CoutLitre } from './chaineLitre';
import type { AvertissementCible, ForecastItem } from './forecast';
import { usureAnnuelleLitre } from './materielFutur';
import type { FinanceTransaction, FinancialAsset, FinancialPlan, FinancialProfile } from './types';

/**
 * Prévision DÉRIVÉE des brassins (d2, 09.11) : recalculée à chaque lecture, jamais écrite (P1). Fonctions pures, aucune horloge (`asOf` passé).
 * Les montants viennent de `estimateBrewBudget`, le même calcul que la feuille c3a : Prévisions et la feuille montrent le même 64,26.
 * Argent seulement (TTC) : `cashRequiredTTC` = achats + énergie/nettoyage + emballage + impôt, somme exacte au centime (le reste fait foi).
 */

export interface ReglagesBrewForecast {
  /** Achats : brassage − ce délai (jours). */
  delaiAchatJours: number;
  /** Conditionnement estimé : brassage + ce délai (jours) ; le brassin planifié n'a pas de date de conditionnement. */
  delaiConditionnementJours: number;
  /** Emballage : conditionnement estimé − ce délai (jours). */
  delaiEmballageJours: number;
  /** Impôt : fin de la période du conditionnement + ce délai (jours). */
  delaiPaiementImpotJours: number;
  /** Période de déclaration (directive OFDF : trimestre ou année, selon le régime). Le trimestre est le plus tôt, donc le plus prudent. */
  periodeImpot: 'trimestre' | 'annee';
}
export const REGLAGES_BREW_FORECAST_DEFAUT: ReglagesBrewForecast = { delaiAchatJours: 7, delaiConditionnementJours: 21, delaiEmballageJours: 7, delaiPaiementImpotJours: 30, periodeImpot: 'trimestre' };

export interface LigneOrigine { label: string; amountCents: number; origin: string }
export interface BrassinPrevu {
  batchId: string;
  titre: string;
  /** ISO du jour de brassage (réel pour un brassin commencé). */
  dateBrassage: string;
  items: ForecastItem[];
  /** Ce qui manque pour que le coût soit complet (noms de lignes, « énergie », « impôt (litres nets) »…). */
  partiel: string[];
  litresNets: { litres: number; source: 'conditionne' | 'enregistre' | 'attendu' } | null;
  /** Coût du litre, usure LINÉAIRE comptée une fois (`usureAnnuelleLitre`) ; `null` si un élément manque. Domaine livré, non branché à un écran. */
  coutLitre: CoutLitre | null;
  /** Source de la densité de l'impôt. */
  densite: 'brassin' | 'cible' | null;
}
export interface EntreeBrassinsPlanifies {
  batches: Batch[];
  stockItems: StockItem[];
  transactions: FinanceTransaction[];
  plans: FinancialPlan[];
  profile: FinancialProfile;
  /** Registre des actifs. Absent : l'usure du litre est inconnue (jamais 0). */
  assets?: FinancialAsset[];
  asOf: string;
  /** Dernier jour retenu (inclus) ; au-delà, aucun item. */
  fin?: string;
  reglages?: Partial<ReglagesBrewForecast>;
  /** Réduction petit brasseur : appliquée seulement si `annee` est l'année du brassage (même règle que la feuille c3a). */
  reductionImpot?: { pct?: number; annee?: number };
  /** Coût du litre « hors ce projet de matériel » (D3-7, `mesurerAchat`). */
  ignorerPlanId?: string;
}
export interface SortieBrassinsPlanifies { brassins: BrassinPrevu[]; items: ForecastItem[]; warnings: string[]; /** Les mêmes limites que `warnings`, avec leur cible (CP-18) : ajout seul, les chaînes sont inchangées. */ avertissements: AvertissementCible[]; remplaces: Set<string> }

const cents = (chf: number) => Math.round(chf * 100);
const finiPositif = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const aUtc = (iso: string) => new Date(`${iso}T12:00:00Z`);
export function ajouterJours(iso: string, jours: number): string { const d = aUtc(iso); d.setUTCDate(d.getUTCDate() + jours); return d.toISOString().slice(0, 10); }
/** Dernier jour du trimestre (ou de l'année) qui contient `iso`. */
export function finDePeriode(iso: string, periode: 'trimestre' | 'annee'): string {
  const annee = Number(iso.slice(0, 4)), mois = periode === 'annee' ? 12 : Math.ceil(Number(iso.slice(5, 7)) / 3) * 3;
  return new Date(Date.UTC(annee, mois, 0, 12)).toISOString().slice(0, 10);
}
const jjmmaaaa = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const plusTard = (a: string, b: string) => a > b ? a : b;

/** Identifiant du brassin auquel un plan « brew » se rapporte (champ du plan, sinon son instantané). */
export function planBrewBatchId(plan: FinancialPlan): string | undefined {
  return plan.batchId ?? (plan.brewEstimate as BrewBudgetSnapshot | undefined)?.batchId;
}

interface IndexPieces { rang: Map<FinanceTransaction, number>; parRef: Map<string, FinanceTransaction[]> }
/** Index unique par appel : article de stock → pièces qui en portent une ligne (rang d'origine gardé). */
function indexerParArticle(transactions: FinanceTransaction[]): IndexPieces {
  const rang = new Map<FinanceTransaction, number>(), parRef = new Map<string, FinanceTransaction[]>();
  transactions.forEach((tx, i) => {
    rang.set(tx, i);
    for (const ref of new Set((tx.finance?.lines ?? []).map(l => l.stockItemRef).filter((r): r is string => !!r))) {
      const liste = parRef.get(ref);
      if (liste) liste.push(tx); else parRef.set(ref, [tx]);
    }
  });
  return { rang, parRef };
}
function piecesDesArticles(index: IndexPieces, refs: Set<string>): FinanceTransaction[] {
  const pieces = new Set<FinanceTransaction>();
  for (const ref of refs) for (const tx of index.parRef.get(ref) ?? []) pieces.add(tx);
  return [...pieces].sort((a, b) => index.rang.get(a)! - index.rang.get(b)!);
}

/** Recette d'un brassin : son instantané, jamais la recette vivante (même construction que `brewBudget.ts`, `recipeForBatch`). */
function recetteDuBrassin(batch: Batch): Recipe {
  if (batch.recipeSnapshot) return { ...batch.recipeSnapshot, id: batch.recipeSnapshot.sourceRecipeId ?? batch.recipeRef ?? batch.id } as Recipe;
  const ancien = ingredientsOf(batch);
  return { ...ancien, adjuncts: batch.adjuncts, id: batch.id, name: batch.name, style: batch.style } as unknown as Recipe;
}

/** Argent d'un frais saisi (CHF, TTC) : 0 si désactivé ou compté ailleurs, `null` si le montant manque. */
function fraisEnCaisse(snapshot: BrewBudgetSnapshot, cle: BrewCostKey): number | null {
  const option = snapshot.settings.costs?.[cle];
  if (option?.enabled === false) return 0;
  if (!finiPositif(option?.amountTTC)) return null;
  return option.cashTreatment === 'included-in-recurring' ? 0 : option.amountTTC;
}
/** Argent de l'impôt : calculé (toujours en caisse, comme `operatingCashTTC`), saisi (selon son traitement), désactivé (0), inconnu (null). */
function impotEnCaisse(snapshot: BrewBudgetSnapshot): number | null {
  if (snapshot.beerTaxSource === 'calcule') return snapshot.beerTaxCost ?? 0;
  if (snapshot.beerTaxSource === 'manuel') return fraisEnCaisse(snapshot, 'beerTax');
  if (snapshot.beerTaxSource === 'inconnu') return null;
  return 0;
}

export function estimerBrassinsPlanifies(input: EntreeBrassinsPlanifies): SortieBrassinsPlanifies {
  const { batches, stockItems, transactions, plans, profile, asOf } = input;
  const reglages = { ...REGLAGES_BREW_FORECAST_DEFAUT, ...input.reglages };
  const warnings: string[] = [], avertissements: AvertissementCible[] = [], items: ForecastItem[] = [], brassins: BrassinPrevu[] = [], remplaces = new Set<string>();
  const noter = (a: AvertissementCible) => { warnings.push(a.texte); avertissements.push(a); };
  const now = `${asOf}T12:00:00Z`;
  const instantanes = plans.filter(p => p.brewEstimate).map(p => p.brewEstimate as BrewBudgetSnapshot);
  const fixes = annualBrewFixedCosts(plans);
  const parArticle = indexerParArticle(transactions);
  const cle = (b: Batch) => brewBudgetDateKey(batchDisplayDate(b) ?? '') ?? '';
  const ordre = [...batches].sort((a, b) => cle(a).localeCompare(cle(b)) || a.id.localeCompare(b.id));
  const garde = (iso: string) => !input.fin || iso <= input.fin;

  for (const batch of ordre) {
    const statut = batch.status;
    // Terminé, conditionné, annulé : la dépense est devenue factures ou stock ; ses anciens plans « Prévoir » restent lisibles, jamais comptés.
    if (statut === 'annule' || statut === 'termine') { remplaces.add(batch.id); continue; }
    if (statut === 'conditionne') {
      remplaces.add(batch.id);
      // Un impôt qui devient certain ne disparaît pas en silence : dit, sans montant inventé (pas de suivi de paiement par brassin).
      const cond = brewBudgetDateKey(batch.bottlingDate ?? '');
      if (cond) {
        const echeance = ajouterJours(finDePeriode(cond, reglages.periodeImpot), reglages.delaiPaiementImpotJours);
        if (echeance >= asOf) noter({ texte: `Impôt sur la bière des brassins conditionnés non prévu : « ${batch.name} », échéance estimée le ${jjmmaaaa(echeance)}.`, cible: { kind: 'brassin', batchId: batch.id, rubrique: 'argent' }, batchId: batch.id, titre: batch.name, sujet: 'Impôt sur la bière',
          detail: `échéance estimée le ${jjmmaaaa(echeance)} : l’impôt de ce brassin n’est pas dans la prévision` });
      }
      continue;
    }
    const titre = batch.name || batch.recipeSnapshot?.name || 'Brassin';
    const jour = brewBudgetDateKey(batchDisplayDate(batch) ?? '');
    if (!jour) { noter({ texte: `${titre} : date de brassage illisible, aucune sortie prévue.`, cible: { kind: 'brassin', batchId: batch.id, rubrique: 'date' }, batchId: batch.id, titre, sujet: 'Date de brassage', detail: 'date de brassage illisible : aucune sortie prévue' }); continue; }
    const commence = statut !== 'planifie' || hasBrewStarted(batch);
    if (!commence && jour < asOf) noter({ texte: `${titre} : brassage planifié le ${jjmmaaaa(jour)}, déjà passé ; sorties ramenées à aujourd’hui.`, cible: { kind: 'brassin', batchId: batch.id, rubrique: 'date' }, batchId: batch.id, titre, sujet: 'Date de brassage',
      detail: `brassage planifié le ${jjmmaaaa(jour)}, déjà passé : date à corriger, sorties ramenées à aujourd’hui` });

    const recette = recetteDuBrassin(batch);
    const propre = instantanes.filter(e => e.batchId === batch.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    // Litres nets : conditionné réel > net SAISI d'un instantané. Un instantané sans `netVolumeSource === 'saisi'` porte le volume à brasser : refusé.
    const net = litresNets({ conditionneL: batch.volumePackagedL, netEnregistreL: propre?.netVolumeSource === 'saisi' ? propre.netVolumeL : undefined });
    // Densité : celle du brassin, sinon la cible de la recette (estimé). Sans litres nets, pas d'impôt calculé (jamais sur le volume à brasser).
    const ogBrassin = typeof batch.og === 'string' && batch.og.trim() ? batch.og : undefined;
    const ogCible = typeof recette.ogTarget === 'number' && recette.ogTarget > 1 ? recette.ogTarget : undefined;
    const og = net ? ogBrassin ?? ogCible : undefined;
    const densite: BrassinPrevu['densite'] = og === undefined ? null : ogBrassin ? 'brassin' : 'cible';
    const reduction = input.reductionImpot?.annee === Number(jour.slice(0, 4)) ? input.reductionImpot?.pct : undefined;

    // Coût (L20) : chaque estimation retrie et reparcourt tout le grand livre pour ses prix. Seules les pièces qui portent une ligne d'un article
    // de CE brassin peuvent changer son prix : on ne passe que celles-là (résultat identique, ordre d'origine gardé).
    const refs = new Set<string>();
    for (const demande of brewBudgetDemands(recette)) { const trouve = resolveBudgetStock(demande, stockItems, propre?.bindings[demande.key]).item; if (trouve) refs.add(trouve.ref); }
    const pertinentes = piecesDesArticles(parArticle, refs);

    // Usure du litre : linéaire, une seule fois ; registre vide, projet sans durée ou registre inconnu : inconnue, jamais 0.
    let usure: number | undefined;
    if (propre?.settings.includeDepreciation !== false && input.assets) {
      const u = usureAnnuelleLitre({ plans, assets: input.assets, transactions, moisReference: jour.slice(0, 7), ignorerPlanId: input.ignorerPlanId });
      usure = u.lignes.length > 0 && u.complet ? u.totalCents / 100 : undefined;
    }
    const snapshot = estimateBrewBudget({
      recipe: recette, stockItems, batches, brewDate: jour, batchId: batch.id, now, transactions: pertinentes, savedEstimates: instantanes,
      isTvaRegistered: profile.vatRegistered, netVolumeL: net?.litres, og, abv: batch.abv, beerTaxReductionPct: reduction,
      ...(propre ? { bindings: propre.bindings, prices: propre.prices, cashTreatments: propre.cashTreatments } : {}),
      settings: { ...propre?.settings, annualVolumeL: profile.annualProductionL, annualFixedCHF: fixes.amountCHF ?? propre?.settings.annualFixedCHF, annualDepreciationCHF: usure }
    });

    // Découpe en quatre sorties ; l'énergie et le nettoyage sont le reste : la somme égale `cashRequiredTTC` au centime.
    const emballage = fraisEnCaisse(snapshot, 'packaging'), impot = impotEnCaisse(snapshot);
    const energie = fraisEnCaisse(snapshot, 'energy'), nettoyage = fraisEnCaisse(snapshot, 'cleaning');
    const achatsC = cents(snapshot.purchasesTTC);
    const fraisC = Math.max(0, cents(snapshot.operatingCashTTC) - cents(emballage ?? 0) - cents(impot ?? 0));
    const manqueAchats = snapshot.lines.filter(l => l.purchaseTTC === null && l.cashTreatment !== 'included-in-recurring').map(l => l.name);
    const manqueFrais = [energie === null ? 'énergie' : '', nettoyage === null ? 'nettoyage' : ''].filter(Boolean);
    const manqueEmballage = emballage === null ? ['emballage'] : [];
    const manqueImpot = impot === null ? [net ? 'impôt (densité)' : 'impôt (litres nets)'] : [];

    const conditionnement = brewBudgetDateKey(batch.bottlingDate ?? '') ?? ajouterJours(jour, reglages.delaiConditionnementJours);
    const dateConditionnementEstimee = !brewBudgetDateKey(batch.bottlingDate ?? '');
    const dateAchats = ajouterJours(jour, -reglages.delaiAchatJours);
    const dateEmballage = ajouterJours(conditionnement, -reglages.delaiEmballageJours);
    const dateImpot = ajouterJours(finDePeriode(conditionnement, reglages.periodeImpot), reglages.delaiPaiementImpotJours);

    const mesItems: ForecastItem[] = [];
    const ajouter = (suffixe: string, nom: string, date: string, montantC: number, manque: string[], lines: LigneOrigine[], estimee: boolean) => {
      if (montantC <= 0 && !manque.length) return;
      const d = plusTard(asOf, date);
      if (!garde(d)) return;
      const label = `${titre} · ${nom}${estimee ? ' · date estimée' : ''}${manque.length ? ` · partiel, à compléter : ${manque.join(', ')}` : ''}`;
      mesItems.push({ id: `brew:${batch.id}:${suffixe}`, date: d, label, amountCents: montantC, direction: 'out', source: 'brew', category: 'brassage', batchId: batch.id,
        ...(manque.length ? { partial: manque } : {}), ...(lines.length ? { lines } : {}) });
    };
    const origine = (p?: { source: string; note?: string }) => p?.source === 'invoice' ? `dernier prix de facture${p.note ? ` (${p.note})` : ''}` : p?.source === 'quote' ? 'devis' : 'prix saisi';
    if (!commence) {
      ajouter('achats', 'achats', dateAchats, achatsC, manqueAchats,
        snapshot.lines.filter(l => (l.purchaseTTC ?? 0) > 0).map(l => ({ label: l.name, amountCents: cents(l.purchaseTTC!), origin: `${origine(l.price)} · manque ${Math.round(l.missing * 1000) / 1000} ${l.unit} au stock` })), false);
      const lignesFrais: LigneOrigine[] = [];
      if (energie) lignesFrais.push({ label: BREW_COST_LABELS.energy, amountCents: cents(energie), origin: 'réglage du brassin' });
      if (nettoyage) lignesFrais.push({ label: BREW_COST_LABELS.cleaning, amountCents: cents(nettoyage), origin: 'réglage du brassin' });
      ajouter('frais', 'énergie et nettoyage', jour, fraisC, manqueFrais, lignesFrais, false);
    }
    ajouter('emballage', 'emballage', dateEmballage, cents(emballage ?? 0), manqueEmballage,
      emballage ? [{ label: BREW_COST_LABELS.packaging, amountCents: cents(emballage), origin: 'réglage du brassin' }] : [], dateConditionnementEstimee);
    ajouter('impot', 'impôt sur la bière', dateImpot, cents(impot ?? 0), manqueImpot,
      impot ? [{ label: BREW_COST_LABELS.beerTax, amountCents: cents(impot), origin: snapshot.beerTaxSource === 'calcule' ? (densite === 'cible' ? 'calculé sur la densité cible de la recette (estimé)' : 'calculé sur la densité du brassin') : 'montant saisi' }] : [], true);

    const partiel = [...(commence ? [] : [...manqueAchats, ...manqueFrais]), ...manqueEmballage, ...manqueImpot];
    if (partiel.length) {
      const sansPrix = commence ? [] : manqueAchats, autres = partiel.filter(m => !sansPrix.includes(m));
      // Une petite ligne : les noms quand il y en a deux au plus, sinon leur nombre (la liste est dans le coût du brassin).
      const dits = [sansPrix.length > 2 ? `${sansPrix.length} ingrédients sans prix` : sansPrix.length ? `sans prix : ${sansPrix.join(', ')}` : '', autres.length > 2 ? `${autres.length} frais à compléter` : autres.length ? `à compléter : ${autres.join(', ')}` : ''].filter(Boolean);
      noter({ texte: `${titre} : à compléter pour une prévision entière : ${partiel.join(', ')}.`, cible: { kind: 'brassin', batchId: batch.id, rubrique: 'cout' }, batchId: batch.id, titre, sujet: sansPrix.length && !autres.length ? 'Prix des ingrédients' : 'Coût à compléter',
        detail: `${dits.join(' ; ')} : prévision partielle`, manque: partiel });
    }
    if (mesItems.length) remplaces.add(batch.id);
    const notions = troisNotions(snapshot);
    brassins.push({ batchId: batch.id, titre, dateBrassage: jour, items: mesItems, partiel, litresNets: net, densite,
      coutLitre: coutLitre({ notions, litres: net?.litres }) });
    items.push(...mesItems);
  }
  items.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { brassins, items, warnings: [...new Set(warnings)], avertissements: [...new Map(avertissements.map(a => [a.texte, a])).values()], remplaces };
}

