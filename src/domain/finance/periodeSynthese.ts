import type { FinanceCategory } from '../../types';
import type { FinanceLine, FinanceTransaction, FinancialAsset, FinancialPayment } from './types';
import { isActiveTransaction, isoDate, paymentState, refundLinkIssue, transactionAmount, transactionDirection, transactionKind } from './ledger';

/**
 * UNE seule définition de « entré », « dépensé », « payé », « à payer » et « matériel à part » pour une période (voie us, 09.11).
 * La Synthèse (g3a) et la barre du mois d'Opérations (v6b) l'appellent toutes deux : jamais un second calcul (problème 2 de l'inventaire).
 * Fonctions pures, centimes entiers, aucune horloge (la date du jour est un paramètre). L'inconnu n'est jamais 0 : un paiement inconnu est
 * compté et nommé (`aVerifier.paiementsAConfirmer`), jamais supposé impayé.
 *
 * RÈGLE DU MATÉRIEL À PART (choix de la maquette g3a : 28,60 de joints « à part »). Une ligne `equipment` non passée en charge
 * (`capitalTreatment !== 'expense'`) ou une ligne rangée `materiel`/`renovation` est « à part » ; une pièce sans ligne l'est si sa catégorie est
 * `materiel` ou `renovation`. ÉCART ASSUMÉ avec l'Annuel (`annual.ts:123-134`) : celui-ci ne compte en capital que les lignes `equipment` ou
 * le registre des immobilisations ; sans ligne ni registre, une pièce `materiel` y reste une charge (alerte `annual.ts:134`), et il applique
 * `businessUsePct`. La Synthèse, elle, dit la pièce à part qui n'a pas de registre (`aVerifier.materielSansRegistre`). Alignement futur : D2.
 */

export const CATEGORIE_MATERIEL = ['materiel', 'renovation'] as const;
const estMateriel = (categorie: string) => (CATEGORIE_MATERIEL as readonly string[]).includes(categorie);

export interface Reste {
  id: string; libelle: string; cents: number;
  /** Échéance ISO, ou null (« échéance à préciser »). */
  echeance: string | null;
  /** Catégorie dominante de la partie non payée (pour la couleur de la hachure) ; `recettes` pour un à encaisser. */
  categorie: string;
  enRetard: boolean;
}
export interface Poste { categorie: string; cents: number; payeCents: number; aPayerCents: number }
export interface AVerifier {
  /** Libellés des pièces sans date (hors de toute période). */
  sansDate: string[];
  /** Ids des pièces dont le paiement est inconnu : comptées pleines, jamais hachurées. */
  paiementsAConfirmer: string[];
  /** Avoirs sans facture valide : exclus (comme `ledger.ts:148-150`). */
  avoirsInvalides: string[];
  /** Part d'avoirs qui dépasse son poste ou la colonne Entré : jamais dessinée en négatif. */
  avoirsNonDessinesCents: number;
  /** Libellés des pièces rangées « à part » sans immobilisation au registre (seulement si le registre est fourni). */
  materielSansRegistre: string[];
}
export interface PeriodeSynthese {
  entreCents: number; depenseCents: number; gainCents: number; materielCents: number;
  /** dépensé − à payer : ce qui est sorti de la caisse (matériel à part exclu). */
  payeCents: number; aPayerCents: number;
  ventes: { nombre: number; libelle: string | null };
  /** Ventes pas encore encaissées, par pièce ; `entreAEncaisserCents` en est la somme. */
  aEncaisser: Reste[]; entreAEncaisserCents: number;
  /** Dans l'ordre de la pile (de haut en bas, charges fixes en dernier). Un poste ≤ 0 n'y figure pas. */
  postes: Poste[];
  /** Hachuré, par pièce, du plus proche au plus lointain. */
  aPayer: Reste[];
  /** Nombre de pièces comptées dans la période (ventes et charges, avoirs valides compris). */
  lignes: number;
  aVerifier: AVerifier;
}

interface Parts { materiel: number; parts: Map<string, number> }

/** Catégorie d'une ligne : celle saisie, sinon d'après son genre (logique de l'ancien écran Coûts, `FinancesTab.tsx:86`). */
function categorieDeLigne(ligne: FinanceLine, tx: FinanceTransaction): string {
  return ligne.category ?? (ligne.kind === 'equipment' ? 'materiel' : ligne.kind === 'cleaning' ? 'nettoyage' : ['ingredient', 'packaging'].includes(ligne.kind) ? 'brassage' : tx.category);
}
const ligneAPart = (ligne: FinanceLine, categorie: string) =>
  ligne.kind === 'equipment' ? ligne.capitalTreatment !== 'expense' : estMateriel(categorie);

/**
 * Répartit le montant d'une pièce en catégories et en matériel à part, AU CENTIME : la somme des parts = `montant`.
 * Le reliquat (TVA, transport, remise absents des lignes) va à la catégorie de la pièce ; s'il est négatif, il se déduit de la plus grosse part.
 */
function repartir(tx: FinanceTransaction, montant: number): Parts {
  const parts = new Map<string, number>();
  let materiel = 0;
  const ajouter = (cat: string, cents: number) => { parts.set(cat, (parts.get(cat) ?? 0) + cents); };
  const lignes = (tx.finance?.lines ?? []).filter(l => Number.isSafeInteger(l.amountCents) && l.amountCents > 0);
  if (!lignes.length) {
    if (estMateriel(tx.category)) materiel = montant; else ajouter(tx.category, montant);
    return { materiel, parts };
  }
  let somme = 0;
  for (const ligne of lignes) {
    const cat = categorieDeLigne(ligne, tx);
    somme += ligne.amountCents;
    if (ligneAPart(ligne, cat)) materiel += ligne.amountCents; else ajouter(cat, ligne.amountCents);
  }
  const reste = montant - somme;
  if (reste >= 0) {
    if (estMateriel(tx.category)) materiel += reste; else if (reste > 0 || parts.size === 0) ajouter(tx.category, reste);
  } else {
    // Lignes plus grosses que la pièce : la plus grosse part absorbe l'écart, la somme reste exacte.
    const plusGrosse = [...parts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (plusGrosse && plusGrosse[1] + reste >= 0) parts.set(plusGrosse[0], plusGrosse[1] + reste);
    else if (materiel + reste >= 0) materiel += reste;
  }
  return { materiel, parts };
}
const totalParts = (p: Parts) => p.materiel + [...p.parts.values()].reduce((n, v) => n + v, 0);
const categorieDominante = (p: Parts, repli: string): string => [...p.parts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? repli;

/** Répartit `total` au prorata de `poids`, au centime près (plus fort reste) ; ordre stable par clé. */
export function repartirAuProrata(total: number, poids: Map<string, number>): Map<string, number> {
  const somme = [...poids.values()].reduce((n, v) => n + v, 0);
  const sortie = new Map<string, number>();
  if (somme <= 0 || total <= 0) { for (const k of poids.keys()) sortie.set(k, 0); return sortie; }
  const restes: Array<[string, number]> = [];
  let donne = 0;
  for (const [cle, p] of [...poids.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const exact = total * p / somme, plancher = Math.floor(exact);
    sortie.set(cle, plancher); donne += plancher; restes.push([cle, exact - plancher]);
  }
  restes.sort((a, b) => b[1] - a[1]);
  for (let i = 0; donne < total; i = (i + 1) % restes.length) { sortie.set(restes[i][0], sortie.get(restes[i][0])! + 1); donne++; }
  return sortie;
}

export interface PeriodeEntree {
  transactions: FinanceTransaction[];
  payments: FinancialPayment[];
  /** `AAAA-MM`, ou `null` pour toutes les dates. */
  mois: string | null;
  /**
   * `AAAA-MM`, fin incluse d'une plage (CP-9, 10.11) : avec `mois` = début, une pièce compte si son mois est dans [mois, jusqua].
   * Sans `jusqua` (ou avec `mois` nul), rien ne change : Annuel et Opérations restent sur un seul mois.
   */
  jusqua?: string;
  /** Date du jour, ISO : l'état de paiement et le retard sont évalués à cette date. */
  aujourdhui: string;
  /** Registre des immobilisations ; absent : « sans registre » n'est pas évalué. */
  assets?: FinancialAsset[];
}

/**
 * Une date ISO est-elle dans la période ? `mois` nul : toutes les dates ; `jusqua` absent : le seul mois `mois` ; sinon l'intervalle
 * [mois, jusqua] bornes incluses (comparaison de chaînes `AAAA-MM`, sûre car le format est fixe). Une plage inversée ne contient rien.
 */
export function dansPeriode(date: string, mois: string | null, jusqua?: string): boolean {
  if (mois === null) return true;
  if (!jusqua) return date.startsWith(mois);
  const m = date.slice(0, 7);
  return m >= mois && m <= jusqua;
}

export function periodeSynthese(entree: PeriodeEntree): PeriodeSynthese {
  const { transactions, payments, mois, jusqua, aujourdhui } = entree;
  const verifier: AVerifier = { sansDate: [], paiementsAConfirmer: [], avoirsInvalides: [], avoirsNonDessinesCents: 0, materielSansRegistre: [] };
  const totaux = new Map<string, number>(), aPayerParCat = new Map<string, number>();
  const aPayer: Reste[] = [], aEncaisser: Reste[] = [];
  let entreBrut = 0, materielBrut = 0, lignes = 0, ventes = 0, derniereVente = '';

  for (const tx of transactions.filter(isActiveTransaction)) {
    const date = isoDate(tx.date);
    if (!date) { verifier.sansDate.push(tx.description || tx.id); continue; }
    if (!dansPeriode(date, mois, jusqua)) continue;
    const kind = transactionKind(tx);
    if (kind === 'contribution' || kind === 'withdrawal') continue;
    const montant = transactionAmount(tx);
    if (!Number.isSafeInteger(montant) || montant < 0) continue;

    if (kind === 'refund') {
      if (refundLinkIssue(tx, transactions)) { verifier.avoirsInvalides.push(tx.id); continue; }
      lignes++;
      if (transactionDirection(tx, transactions) === 'out') { entreBrut -= montant; continue; }
      // Un avoir fournisseur réduit le poste de sa facture d'origine (ou le matériel si elle en était) : même règle que l'Annuel.
      const origine = transactions.find(t => t.id === tx.finance?.refundOfId);
      const dePropre = repartir(tx, montant);
      const partsOrigine = origine && !(tx.finance?.lines ?? []).length ? repartir(origine, transactionAmount(origine)) : null;
      if (partsOrigine) {
        const partsMat = partsOrigine.materiel > [...partsOrigine.parts.values()].reduce((n, v) => n + v, 0);
        if (partsMat) materielBrut -= montant; else totaux.set(categorieDominante(partsOrigine, tx.category), (totaux.get(categorieDominante(partsOrigine, tx.category)) ?? 0) - montant);
      } else {
        materielBrut -= dePropre.materiel;
        for (const [cat, cents] of dePropre.parts) totaux.set(cat, (totaux.get(cat) ?? 0) - cents);
      }
      continue;
    }

    const etat = paymentState(tx, payments, transactions, aujourdhui);
    const echeance = isoDate(tx.finance?.dueDate);
    if (etat.state === 'unknown') verifier.paiementsAConfirmer.push(tx.id);
    const reste = etat.state === 'unpaid' || etat.state === 'partial' ? etat.remainingCents : 0;

    if (kind === 'income') {
      lignes++; ventes++; derniereVente = tx.description || tx.id;
      entreBrut += montant;
      if (reste > 0) aEncaisser.push({ id: tx.id, libelle: tx.description, cents: Math.min(reste, montant), echeance, categorie: 'recettes', enRetard: !!echeance && echeance < aujourdhui });
      continue;
    }
    if (kind !== 'expense') continue;

    lignes++;
    const p = repartir(tx, montant);
    materielBrut += p.materiel;
    if (p.materiel > 0 && entree.assets && !entree.assets.some(a => a.transactionId === tx.id)) verifier.materielSansRegistre.push(tx.description || tx.id);
    for (const [cat, cents] of p.parts) totaux.set(cat, (totaux.get(cat) ?? 0) + cents);
    const charge = totalParts(p) - p.materiel;
    const hachure = Math.min(reste, charge);
    if (hachure > 0) {
      const partHachure = repartirAuProrata(hachure, p.parts);
      for (const [cat, cents] of partHachure) aPayerParCat.set(cat, (aPayerParCat.get(cat) ?? 0) + cents);
      aPayer.push({ id: tx.id, libelle: tx.description, cents: hachure, echeance, categorie: categorieDominante(p, tx.category), enRetard: !!echeance && echeance < aujourdhui });
    }
  }

  // Rien de négatif dessiné : un poste plus bas que zéro (avoir d'un autre mois) est écrêté, l'excédent est dit dans « À vérifier ».
  let nonDessine = 0;
  const postesBruts: Poste[] = [];
  for (const [categorie, cents] of totaux) {
    if (cents <= 0) { nonDessine += -cents; continue; }
    const aPayerCents = Math.min(aPayerParCat.get(categorie) ?? 0, cents);
    postesBruts.push({ categorie, cents, aPayerCents, payeCents: cents - aPayerCents });
  }
  const materielCents = Math.max(0, materielBrut);
  if (materielBrut < 0) nonDessine += -materielBrut;
  const entreCents = Math.max(0, entreBrut);
  if (entreBrut < 0) nonDessine += -entreBrut;
  verifier.avoirsNonDessinesCents = nonDessine;

  const postes = ordrePile(postesBruts);
  const depenseCents = postes.reduce((n, p) => n + p.cents, 0);
  const aPayerCents = postes.reduce((n, p) => n + p.aPayerCents, 0);
  const parEcheance = (a: Reste, b: Reste) => (a.echeance ?? '9999').localeCompare(b.echeance ?? '9999') || a.id.localeCompare(b.id);
  return {
    entreCents, depenseCents, gainCents: entreCents - depenseCents, materielCents,
    payeCents: depenseCents - aPayerCents, aPayerCents,
    ventes: { nombre: ventes, libelle: ventes === 1 ? derniereVente : ventes > 1 ? `${ventes} ventes` : null },
    aEncaisser: aEncaisser.sort(parEcheance), entreAEncaisserCents: Math.min(entreCents, aEncaisser.reduce((n, r) => n + r.cents, 0)),
    postes, aPayer: aPayer.sort(parEcheance), lignes, aVerifier: verifier,
  };
}

/** Ordre de la pile g3a, de haut en bas : les petits postes d'abord (du plus petit au plus gros), les charges fixes en bas, contre l'à-payer hachuré. */
export function ordrePile(postes: Poste[]): Poste[] {
  const fixes = postes.filter(p => p.categorie === 'chargesFixes');
  const autres = postes.filter(p => p.categorie !== 'chargesFixes').sort((a, b) => a.cents - b.cents || a.categorie.localeCompare(b.categorie));
  return [...autres, ...fixes];
}

/**
 * Regroupe sous « divers » (Autres frais) les postes qui pèsent moins de `seuilPct` % du dépensé : un segment de 3,50 sur 700 ferait moins de
 * 2 px, ni lisible ni touchable. La somme est conservée au centime ; les charges fixes ne sont jamais absorbées.
 */
export function regrouperPetits(postes: Poste[], depenseCents: number, seuilPct = 3): Poste[] {
  if (depenseCents <= 0) return postes;
  const petits = postes.filter(p => p.categorie !== 'chargesFixes' && p.categorie !== 'divers' && p.cents * 100 < seuilPct * depenseCents);
  if (petits.length < 2) return postes;
  const reste = postes.filter(p => !petits.includes(p));
  const divers = reste.find(p => p.categorie === 'divers');
  const cumul = (champ: 'cents' | 'payeCents' | 'aPayerCents') => petits.reduce((n, p) => n + p[champ], 0) + (divers?.[champ] ?? 0);
  const fusion: Poste = { categorie: 'divers', cents: cumul('cents'), payeCents: cumul('payeCents'), aPayerCents: cumul('aPayerCents') };
  return ordrePile([...reste.filter(p => p !== divers), fusion]);
}

export type SigneGain = 'gain' | 'perte' | 'nul';
export interface Echelle {
  signe: SigneGain;
  /** Hauteurs en px, même échelle pour les deux colonnes (la plus haute = `hauteur`). `hEntree` et `hDepense` incluent l'écart posé en haut de la plus courte. */
  hEntree: number; hDepense: number;
  /** L'écart dessiné (gain ou perte), au moins `ecartMin` px : la valeur est écrite, la forme est un signe. Il est posé en haut de la colonne la plus courte. */
  hEcart: number;
  /** Hauteurs des piles seules (sans l'écart). */
  hPileEntree: number; hPileDepense: number;
}
export function echelle(entreCents: number, depenseCents: number, hauteur: number, ecartMin = 10): Echelle {
  const max = Math.max(entreCents, depenseCents);
  if (!(max > 0) || !(hauteur > 0)) return { signe: 'nul', hEntree: 0, hDepense: 0, hEcart: 0, hPileEntree: 0, hPileDepense: 0 };
  const px = (cents: number) => cents * hauteur / max;
  const diff = entreCents - depenseCents;
  if (diff === 0) return { signe: 'nul', hEntree: hauteur, hDepense: hauteur, hEcart: 0, hPileEntree: hauteur, hPileDepense: hauteur };
  const hEcart = Math.min(hauteur, Math.max(ecartMin, px(Math.abs(diff))));
  if (diff > 0) return { signe: 'gain', hEntree: hauteur, hDepense: hauteur, hEcart, hPileEntree: hauteur, hPileDepense: Math.max(0, hauteur - hEcart) };
  return { signe: 'perte', hEntree: hauteur, hDepense: hauteur, hEcart, hPileEntree: Math.max(0, hauteur - hEcart), hPileDepense: hauteur };
}

/** Une catégorie de poste n'a pas toujours un libellé du domaine : le texte vient de l'écran ; ici seulement le type. */
export type CategoriePile = FinanceCategory | string;

/**
 * Le « Pourquoi ? » : une phrase et des parts, par gabarit, sans IA. Les parts sont celles de l'entré ; le gain y figure s'il est positif.
 * Sans entré, ou avec perte, il n'y a pas de parts d'entré à dire : `parts` reste vide et la phrase dit le fait.
 */
export interface Explication {
  signe: SigneGain;
  /** Poste dominant (catégorie du plus gros poste du dépensé) et sa part de l'entré, en %, jamais « 0 % ». */
  dominant: { categorie: string; cents: number; partPct: number } | null;
  second: { categorie: string; cents: number; partPct: number } | null;
  /** Parts de l'entré en % (somme 100 quand l'entré couvre le dépensé), dans l'ordre de la pile, gain en dernier. */
  parts: Array<{ cle: string; cents: number; pct: number }>;
}
const pct = (cents: number, base: number) => base > 0 ? Math.max(1, Math.round(cents * 100 / base)) : 0;
export function explication(p: PeriodeSynthese): Explication {
  const signe: SigneGain = p.gainCents > 0 ? 'gain' : p.gainCents < 0 ? 'perte' : 'nul';
  const classes = [...p.postes].sort((a, b) => b.cents - a.cents || a.categorie.localeCompare(b.categorie));
  const base = p.entreCents;
  const dire = (poste?: Poste) => poste && base > 0 ? { categorie: poste.categorie, cents: poste.cents, partPct: pct(poste.cents, base) } : null;
  const parts: Explication['parts'] = [];
  if (base > 0 && signe !== 'perte') {
    for (const poste of p.postes) parts.push({ cle: poste.categorie, cents: poste.cents, pct: pct(poste.cents, base) });
    if (p.gainCents > 0) parts.push({ cle: 'gain', cents: p.gainCents, pct: pct(p.gainCents, base) });
    // L'arrondi ne doit pas faire dire 101 % ou 99 % : l'écart va au plus gros morceau.
    const ecart = 100 - parts.reduce((n, x) => n + x.pct, 0);
    if (ecart !== 0 && parts.length) { const gros = parts.reduce((a, b) => b.cents > a.cents ? b : a); gros.pct = Math.max(1, gros.pct + ecart); }
  }
  return { signe, dominant: dire(classes[0]), second: dire(classes[1]), parts };
}
