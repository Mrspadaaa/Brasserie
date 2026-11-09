// Les contrôles croisés de la Dépense (voie t1, mission 2026-11-09-depense-totaux) : pur, aucun React.
// Ses mots (09.11) : « afficher le total d'items attendu, et le total réellement trouvé, pareil pour les chf, le total, total trouvé, total effectif et flaggé si au moins une des
// combinaisons est pas correct, c'est justement ça la robustesse » ; « Il y a déjà cette partie là, mais j'ai l'impression qu'elle fait pas correctement son travail ».
// Règles : l'inconnu n'est jamais 0 (un nombre non imprimé se dit « non imprimé », un règlement sans montant « montant non lu ») ; chaque ligne montre ses deux valeurs, l'écart et son verdict ;
// « Qté × prix » ne passe pas au vert quand la couverture (articles, CHF) a un écart : ce contrôle ne regarde que l'arithmétique de chaque ligne, jamais les lignes absentes.
import type { PurchaseLineDraft } from '../../services/purchaseEntry';
import { normalize } from '../../services/search';

/** `ok` : concorde (✓) ; `ecart` : ne concorde pas (pastille d'erreur) ; `inconnu` : rien à comparer (·), jamais un vert. */
export type Verdict = 'ok' | 'ecart' | 'inconnu';
/** Le geste où mène une pastille d'erreur : chercher puis ajouter la ligne manquante ; ouvrir la ligne fausse ou en trop ; le champ du total (cas rare) ; le règlement ; le désaccord des lectures ; la liste. */
/* d2 : `lignes` (ouvrir les lignes que le contrôle désigne), `photo` (le justificatif), `doublon` (la dépense déjà saisie). */
export type Renvoi = 'manquante' | 'fausse' | 'total' | 'reglement' | 'lectures' | 'liste' | 'perdues' | 'lignes' | 'photo' | 'doublon' | 'montants';

export interface RangControle {
  cle: string;
  verdict: Verdict;
  texte: string;
  /** Les deux valeurs comparées (« 277,60 / 352,05 »), ou la seule valeur connue. */
  valeurs: string;
  /** L'écart signé (« −74,45 », « −2 »). */
  ecart?: string;
  /** Le geste dit en deux ou trois mots sous une pastille d'erreur. */
  geste?: string;
  renvoi?: Renvoi;
  /** La rangée « Lectures ●●◌ » de l'attente (points). */
  lectures?: { faites: number; sur: number };
  /** d2 (contrôles de la pièce, `controlesPieceRangs.ts`) : ce que la lecture a trouvé, en entier, sous une pastille d'erreur. */
  detail?: string;
  /** Une phrase d'explication (règlement partagé entre tickets…), sous la rangée. */
  note?: string;
  /** Les rangs (base 1, dans les lignes du brouillon) que le geste vise ; les identifiants de dépenses déjà saisies (doublon). */
  lignes?: number[];
  refs?: string[];
}

export interface EntreeControles {
  /** La somme des lignes trouvées, arrondi à 5 centimes compris, en centimes. */
  lignesCents: number;
  /** Les lignes du brouillon, celles ajoutées à la main comprises. */
  nLignes: number;
  /** Parmi elles, les lignes ajoutées à la main (pas lues sur la pièce) et leur somme en centimes : elles ne comptent pas comme « trouvées » et expliquent un écart exact (SM, 08.11). */
  nAjoutes: number;
  ajoutsCents: number;
  /** Le total imprimé en centimes ; `null` : non imprimé (total calculé, somme des bulletins). */
  totalCents: number | null;
  /** Le nombre de LIGNES que la lecture annonce (`printedLineCount`). Il vient du même modèle que la transcription : il compte ce qu'il a transcrit (bench b1, tache : 23 annoncées pour 29 imprimées). Un indice, jamais une preuve : il ne fait pas le vert. `null` : non lu. */
  attendus: number | null;
  /** Un comptage INDÉPENDANT de la transcription : `countedAmounts`, les montants que la lecture compte dans la colonne des montants AVANT de transcrire (remises comprises, totaux et TVA exclus ; voie c1, `prompts.ts`). Seul il peut donner le vert aux lignes. `null` : absent. */
  attendusIndependant?: number | null;
  /** Parmi les lignes du brouillon, celles de type remise : un rabais n'est pas un article (bench b1, sunstore-2 : 3 articles et 2 rabais, non 5 articles). */
  nRabais?: number;
  /** Les lignes que PLUSIEURS lectures n'ont pas confirmées (une lecture seule les avait, la retenue non) : leur nombre et leur somme en centimes. Hors du brouillon, donc hors des sommes. */
  vusUneLecture?: { n: number; cents: number } | null;
  /** Le montant effectivement payé lu sur la pièce (règlement), en centimes ; `null` : non lu. */
  payeCents: number | null;
  /** Le moyen de règlement lu (« TWINT »), sans montant ou avec ; `null` : non lu. */
  moyen: string | null;
  /** L'arithmétique `quantité × prix = montant` de chaque ligne : `ok` si toutes passent ; `null` : non contrôlée. */
  qte: { ok: boolean | null; valeur: string; sansPrix?: number } | null;
  /** d2 : les rangées des contrôles de la pièce (`rangsDePiece`), insérées après « Payé » ; la note du paiement est une phrase sous « Payé ». */
  piece?: RangControle[];
  notePaye?: string;
}

export interface ControlesCroises {
  rangs: RangControle[];
  /** Au moins un contrôle ne concorde pas. */
  drapeau: boolean;
  /** Lignes − total, en centimes ; `null` si le total n'est pas imprimé. */
  ecartCents: number | null;
  /** Trouvés − attendus ; `null` si le nombre n'est pas imprimé. */
  ecartArticles: number | null;
  /** « 74,45 CHF · 2 articles » : ce qui ne concorde pas, pour l'en-tête du drapeau. */
  resume: string;
}

/** Un montant en centimes : « 1 234,50 » (sans unité). */
export const montant = (cents: number): string => {
  const n = Math.abs(Math.round(cents)), e = Math.floor(n / 100), c = String(n % 100).padStart(2, '0');
  return `${String(e).replace(/\B(?=(\d{3})+$)/g, ' ')},${c}`;
};
const signe = (n: number) => (n < 0 ? '−' : '+');
const ecartTexte = (cents: number) => `${signe(cents)}${montant(cents)}`;

export function controlesCroises(e: EntreeControles): ControlesCroises {
  const ecartCents = e.totalCents === null ? null : e.lignesCents - e.totalCents;
  const nRabais = e.nRabais ?? 0, nLignesLues = e.nLignes - e.nAjoutes, nLus = nLignesLues - nRabais;
  const independant = e.attendusIndependant ?? null;
  /* Les deux comptages (colonne des montants, annonce) comptent des LIGNES, remises comprises : ils se comparent aux lignes lues ; l'affichage dit les articles et les rabais. */
  const reference = independant ?? e.attendus;
  const ecartArticles = reference === null ? null : nLignesLues - reference;
  const rabais = nRabais ? ` · ${nRabais} rabais` : '';
  const ajoutExplique = ecartCents !== null && ecartCents > 0 && e.ajoutsCents > 0 && ecartCents === e.ajoutsCents;
  const rangs: RangControle[] = [];

  /* 1. Articles : trouvés contre attendus. Un nombre non imprimé n'est jamais deviné. */
  /* Pas de vert sans comptage indépendant concordant (P2, banc b1) : l'annonce du modèle qui transcrit ne prouve rien quand elle égale ce qu'il a transcrit. */
  if (ecartArticles === null) rangs.push({ cle: 'articles', verdict: 'inconnu', texte: 'Articles', valeurs: `${nLus} lus${rabais} · non imprimé` });
  else if (ecartArticles === 0 && independant !== null) rangs.push({ cle: 'articles', verdict: 'ok', texte: 'Articles lus = comptés', valeurs: `${nLus}${rabais}` });
  else if (ecartArticles === 0) rangs.push({ cle: 'articles', verdict: 'inconnu', texte: 'Articles lus', valeurs: `${nLus}${rabais} · annoncé par la lecture` });
  else rangs.push({ cle: 'articles', verdict: 'ecart', texte: independant !== null ? 'Articles lus ≠ comptés' : 'Articles lus ≠ annoncés', valeurs: `${nLignesLues} / ${reference}`, ecart: `${signe(ecartArticles)}${Math.abs(ecartArticles)}`,
    geste: ecartArticles < 0 ? 'Chercher la ligne manquante' : 'Voir la ligne en trop', renvoi: ecartArticles < 0 ? 'manquante' : 'fausse' });

  /* 2. CHF : la somme des lignes trouvées contre le total imprimé. */
  /* Le payé donne raison aux lignes quand il leur est égal : c'est alors le total imprimé qui est douteux (cas rare). */
  const payeRaisonAuxLignes = e.payeCents !== null && e.payeCents === e.lignesCents && e.totalCents !== null && e.payeCents !== e.totalCents;
  if (e.totalCents === null) rangs.push({ cle: 'somme', verdict: 'inconnu', texte: 'Total non imprimé', valeurs: `lignes ${montant(e.lignesCents)}` });
  else if (ecartCents === 0) rangs.push({ cle: 'somme', verdict: 'ok', texte: 'Somme = imprimé', valeurs: montant(e.totalCents) });
  else if (ajoutExplique) rangs.push({ cle: 'somme', verdict: 'ok', texte: 'Somme = imprimé + ajouté', valeurs: `${montant(e.totalCents)} + ${montant(e.ajoutsCents)}` });
  else rangs.push({ cle: 'somme', verdict: 'ecart', texte: 'Somme ≠ imprimé', valeurs: `${montant(e.lignesCents)} / ${montant(e.totalCents)}`, ecart: ecartTexte(ecartCents!),
    ...(payeRaisonAuxLignes ? { geste: 'Total imprimé douteux ? (rare)', renvoi: 'total' as const } : ecartCents! < 0 && ecartArticles === 0 && independant !== null ? { geste: 'Vérifier les montants', renvoi: 'montants' as const } : ecartCents! < 0 ? { geste: 'Chercher la ligne manquante', renvoi: 'manquante' as const } : { geste: 'Voir la ligne en trop', renvoi: 'fausse' as const }) });

  /* P3 (banc b1) : des lignes que seule une lecture a vues et qui comblent une part du manque : à part, avec le geste et ce qu'il resterait. */
  const manque = ecartCents !== null && ecartCents < 0 ? -ecartCents : 0, vus = e.vusUneLecture ?? null;
  const vusComblent = Boolean(vus && vus.n > 0 && vus.cents > 0 && vus.cents <= manque);
  if (vus && vusComblent) rangs.push({ cle: 'une-lecture', verdict: 'ecart', texte: 'Vues par une seule lecture', valeurs: `${vus.n} · +${montant(vus.cents)}`, geste: `Les garder · il resterait ${montant(manque - vus.cents)}`, renvoi: 'perdues' });

  /* 3. Payé : le règlement lu contre le total imprimé (à défaut, la somme des lignes). Sans montant lu : « — », jamais 0. */
  const refCents = e.totalCents ?? e.lignesCents;
  if (e.payeCents === null) rangs.push({ cle: 'paye', verdict: 'inconnu', texte: e.moyen ? `Payé · ${e.moyen}` : 'Payé', valeurs: e.moyen ? 'montant non lu' : '—' });
  else if (e.payeCents === refCents) rangs.push({ cle: 'paye', verdict: 'ok', texte: e.moyen ? `Payé · ${e.moyen}` : 'Payé = imprimé', valeurs: montant(e.payeCents) });
  else rangs.push({ cle: 'paye', verdict: 'ecart', texte: e.moyen ? `Payé · ${e.moyen} ≠ imprimé` : 'Payé ≠ imprimé', valeurs: `${montant(e.payeCents)} / ${montant(refCents)}`, ecart: ecartTexte(e.payeCents - refCents),
    geste: payeRaisonAuxLignes ? 'Total imprimé douteux ? (rare)' : 'Voir le règlement', renvoi: payeRaisonAuxLignes ? 'total' : 'reglement' });

  for (const r of e.piece ?? []) rangs.push(r);
  if (e.notePaye) { const p = rangs.find(r => r.cle === 'paye'); if (p) p.note = e.notePaye; }

  /* 4. Qté × prix : l'arithmétique de chaque ligne, rien d'autre. Vert seulement si la couverture (articles, CHF) n'a aucun écart : sinon neutre, « incomplet ». */
  const couvertureEcart = rangs.some(r => r.verdict === 'ecart' && (r.cle === 'articles' || r.cle === 'somme'));
  if (!e.qte) rangs.push({ cle: 'qte', verdict: 'inconnu', texte: 'Qté × prix non contrôlé', valeurs: '' });
  /* Des lignes sans prix ou sans montant (à remplir) : l'arithmétique n'est pas prouvée sur toutes (6/7), sans qu'aucune soit fausse : neutre, jamais vert. */
  else if (e.qte.ok === null) rangs.push({ cle: 'qte', verdict: 'inconnu', texte: 'Qté × prix', valeurs: `${e.qte.valeur}${e.qte.sansPrix ? ` · ${e.qte.sansPrix} sans prix unitaire` : ''}` });
  else if (e.qte.ok === false) rangs.push({ cle: 'qte', verdict: 'ecart', texte: 'Qté × prix', valeurs: e.qte.valeur, geste: 'Ouvrir la ligne fausse', renvoi: 'fausse' });
  else rangs.push({ cle: 'qte', verdict: couvertureEcart ? 'inconnu' : 'ok', texte: 'Qté × prix', valeurs: `${e.qte.valeur} justes${e.qte.sansPrix ? ` · ${e.qte.sansPrix} sans prix unitaire` : ''}` });

  const manques: string[] = [];
  if (ecartCents && !ajoutExplique) manques.push(`${montant(ecartCents)} CHF`);
  if (ecartArticles) manques.push(`${Math.abs(ecartArticles)} article${Math.abs(ecartArticles) > 1 ? 's' : ''}`);
  if (vus && vusComblent) manques.push(`dont ${montant(vus.cents)} vus par une seule lecture`);
  return { rangs, drapeau: rangs.some(r => r.verdict === 'ecart'), ecartCents, ecartArticles, resume: manques.join(' · ') };
}

/**
 * Ce que dit le pied de la liste quand l'écart n'est pas une ligne ajoutée à la main (remplace « Lignes 277,60 · total 352,05 · 74,45 de moins », qui ne disait rien) :
 * ce qui manque, en CHF, et ce que ça peut être ; les gestes sont les boutons du bandeau de recherche.
 */
export function phraseDuManque(lignesCents: number, totalCents: number): string {
  const ecart = lignesCents - totalCents;
  return ecart < 0 ? `${montant(ecart)} CHF non retrouvés dans les lignes` : `${montant(ecart)} CHF de plus que le total`;
}

/** Les mots qui disent ce que peut être un manque, sans phrase longue. */
export const CAUSES_DU_MANQUE = 'ligne illisible, cachée ou rabais ?';

const nombreFr = (n: number | undefined) => (n === undefined || !Number.isFinite(n) ? '' : [montant(Math.round(n * 100)), String(n).replace('.', ',')].join(' '));

/**
 * La mini recherche dans les lignes lues : le nom imprimé et le français, la référence ou l'EAN, le montant (« 14,90 » trouve sa ligne, « 14.90 » aussi) et l'étiquette de groupe que l'écran donne à la ligne
 * (s1, jeu en ligne : « peinture » trouve les lignes du sous-groupe « Peinture et sols » même quand l'OCR a abîmé leur nom).
 * Tous les mots tapés doivent se trouver dans la même ligne ; les accents et la casse ne comptent pas. Ne change aucune donnée.
 */
export function chercherLignes(lignes: readonly PurchaseLineDraft[], saisie: string, etiquette?: (ligne: PurchaseLineDraft, index: number) => string | undefined): string[] {
  const mots = normalize(saisie).split(/\s+/).filter(Boolean).map(m => (/^[\d.,]+$/.test(m) ? m.replace(/\./g, ',') : m));
  if (!mots.length) return lignes.map(l => l.id);
  return lignes.filter((l, i) => {
    const foin = normalize([l.description, l.nomLu, l.imprime?.nom, l.imprime?.variante, l.nameFr, l.sourceReference, nombreFr(l.amount), nombreFr(l.unitPrice), etiquette?.(l, i)].filter(Boolean).join(' ')).replace(/ /g, '');
    return mots.every(m => foin.includes(m));
  }).map(l => l.id);
}
