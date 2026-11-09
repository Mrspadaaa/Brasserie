// Contrôles de robustesse d'une pièce lue (voie c1, mission 2026-11-09-depense-totaux).
//
// Pur : aucune écriture, aucune valeur modifiée, aucun appel réseau. Pour une lecture (celle de `aiTask`, ou le brouillon qui en vient) et ce que
// l'app sait déjà (dépenses saisies, prix connus), rend DIX contrôles, toujours dans le même ordre :
//   comptage-montants · comptage-ean · cle-ean · brut-rabais · tva-par-taux · paiement · doublon · hors-articles · prix-plausible · photo-incomplete
// `ok` : true = concorde, false = ne concorde pas, null = non vérifiable (donnée absente : jamais inventée, jamais 0).
// Chaque contrôle porte son geste : ce que le brasseur peut faire (ajouter, ouvrir une ligne, relire la photo…) ; l'écran y mène au toucher.
//
// État de l'art (L29) : aucun algorithme non trivial écrit à la main. Clé EAN : la formule publiée de GS1 (somme pondérée 3/1 modulo 10), vérifiée sur
// les vecteurs de la spécification ; TVA incluse : total × t / (100 + t), règle suisse ; paiement partagé : somme de sous-ensemble sur quelques
// dépenses du jour (au plus 12 candidates, essai exhaustif) ; écart de somme : `coupablesDeLEcart` du serveur, réemployé, pas refait.
import { chf, coupablesDeLEcart, toCents } from '../../../functions/src/invoiceControls';
import { normalize } from '../../services/search';
import { vendorKey } from './duplicates';

export type ControleId =
  | 'comptage-montants' | 'comptage-ean' | 'cle-ean' | 'brut-rabais' | 'tva-par-taux'
  | 'paiement' | 'doublon' | 'hors-articles' | 'prix-plausible' | 'photo-incomplete';

export type GesteType = 'rien' | 'rechercher' | 'ajouter' | 'ouvrir-ligne' | 'relire-photo' | 'saisir-autre' | 'voir-doublon';
export interface Geste {
  type: GesteType;
  /** Le geste en quelques mots, prêt à afficher dans la pastille. */
  libelle: string;
  /** Rangs (base 1, dans `lecture.items`) des lignes à ouvrir ; absent quand le geste ne vise pas une ligne. */
  lignes?: number[];
}

export interface ControlePiece {
  id: ControleId;
  ok: boolean | null;
  /** Ce que la pièce impose (texte prêt à afficher) ; « — » quand elle ne le donne pas. */
  attendu: string;
  /** Ce que la lecture a trouvé. */
  trouve: string;
  /** L'écart, toujours positif ; son unité est dans `unite`. Absent quand rien ne diverge ou que rien ne se compare. */
  ecart?: number;
  unite?: 'CHF' | 'lignes' | 'codes';
  /** Le sens d'un écart de somme : les lignes lues font MOINS que la pièce (`manque`) ou PLUS (`exces`). */
  sens?: 'manque' | 'exces';
  geste: Geste;
  /** Une phrase de plus quand le verdict mérite d'être expliqué (paiement partagé, TVA par taux…). */
  note?: string;
  /** Rangs (base 1) des lignes concernées. */
  lignes?: number[];
  /** Identifiants des dépenses déjà saisies concernées (doublon, paiement partagé). */
  refs?: string[];
}

// -------------------------------------------------------------------------------------------------------------------------------------------
// Entrées
// -------------------------------------------------------------------------------------------------------------------------------------------
export interface LigneControlee {
  name?: string; kind?: string; quantity?: number | null; unit?: string; price?: number | null; amountTTC?: number | null;
  reference?: string; ean?: string; evidence?: string; vatCode?: string;
}
export interface LigneEcartee { label: string; amount: number | null; kind?: 'foreign_currency' | 'payment' | 'subtotal' | 'other' }
export interface LectureControlee {
  vendor?: string;
  /** JJ.MM.AAAA (lecture) ou AAAA-MM-JJ (brouillon). */
  date?: string;
  /** HH:MM, imprimée sur le ticket ; absente = inconnue. */
  printedTime?: string;
  amountTTC?: number | null;
  tvaAmount?: number | null; tvaRate?: number | null;
  vat?: Array<{ code: string; rate: number | null; base?: number | null; amount: number | null }>;
  items: LigneControlee[];
  /** « Montant reçu / Payé » du ticket. */
  amountPaid?: number | null;
  /** Montant du terminal de paiement (Total EFT, TWINT) : information, peut couvrir plusieurs tickets. */
  terminalAmount?: number | null;
  paymentMethod?: string;
  printedLineCount?: number | null; printedItemCount?: number | null;
  countedAmounts?: number | null; countedEans?: number | null;
  ignoredLines?: LigneEcartee[] | null;
  photoIncomplete?: boolean | null; photoIncompleteNote?: string;
}
export interface DepenseConnue { id: string; vendor: string; date: string; heure?: string; total: number | null }
export interface PrixConnu { nom: string; reference?: string; ean?: string; prix: number; unite?: string; source: 'stock' | 'achat' }
export interface ContexteControles {
  depenses?: DepenseConnue[]; prixConnus?: PrixConnu[];
  /**
   * Vrai seulement quand les codes EAN sont lus à `SEUIL_EAN_LUS` au moins, MESURÉ au banc (b1 : 21 codes invalides sur 25 chez BAUHAUS, jamais le bon nombre).
   * Faux par défaut : `cle-ean` et `comptage-ean` restent « non vérifié » (ok: null), sans drapeau ni geste ; ils disent seulement ce qui a été lu.
   */
  eanFiables?: boolean;
}
/** La part de codes EAN lus justes (clé valide, bon nombre) qu'il faut avoir mesurée avant d'afficher ces deux contrôles en drapeau. */
export const SEUIL_EAN_LUS = 0.9;
const EAN_NON_VERIFIE = 'Non vérifié : les codes-barres ne sont pas encore lus assez sûrement (90 % de codes justes attendus, à mesurer au banc).';
/** Un contrôle d'EAN tant que les codes ne sont pas fiables : il garde ce qui a été lu et rend `ok: null`, sans écart, sans ligne, sans geste. */
function sansDrapeauEan(c: ControlePiece): ControlePiece {
  const { ecart: _e, unite: _u, sens: _s, lignes: _l, ...reste } = c;
  return { ...reste, ok: null, geste: rien, note: [c.note, EAN_NON_VERIFIE].filter(Boolean).join(' · ') };
}

/** Tolérance d'arrondi : 5 centimes (règle suisse d'arrondi au 5 centimes, TVA recalculée comprise). */
const TOLERANCE = 5;
const rien: Geste = { type: 'rien', libelle: '' };
const mark = (n: number, un: string, plusieurs = `${un}s`) => `${n} ${n > 1 ? plusieurs : un}`;
const cts = (v: number | null | undefined): number | null => (v === null || v === undefined ? null : toCents(v));

// -------------------------------------------------------------------------------------------------------------------------------------------
// Briques
// -------------------------------------------------------------------------------------------------------------------------------------------
/** Clé de contrôle GS1 d'un code de 8, 12, 13 ou 14 chiffres (EAN-8, UPC-A, EAN-13, GTIN-14) : somme pondérée 3/1 en partant de la droite, modulo 10. */
export function cleGs1Valide(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const chiffres = [...code].map(Number), cle = chiffres.pop()!;
  const somme = chiffres.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (somme % 10)) % 10 === cle;
}
export const ean13Valide = cleGs1Valide;

/**
 * Le code-barres d'une ligne, ou null. Un champ `ean` explicite compte à toute longueur de 8 à 14 chiffres ; une référence ou un extrait imprimé
 * seulement de 12 à 14 chiffres : un numéro d'article de 8 chiffres (BAUHAUS…) n'est jamais pris pour un EAN-8.
 */
export function codeBarresDeLigne(ligne: LigneControlee): string | null {
  const net = (s: string | undefined) => (s ?? '').replace(/[\s.-]/g, '');
  const ean = net(ligne.ean);
  if (/^\d{8,14}$/.test(ean)) return ean;
  const ref = net(ligne.reference);
  if (/^\d{12,14}$/.test(ref)) return ref;
  const dansLExtrait = /(?:^|[^\d])(\d{13})(?!\d)/.exec(ligne.evidence ?? '');
  return dansLExtrait ? dansLExtrait[1] : null;
}

/** Une ligne qui n'est pas un article : montant en devise, règlement, sous-total, total. Détectée sur la désignation, jamais sur le montant. */
const HORS_ARTICLE = /^\s*(?:montant\s+en\s+(?:eur|euro|usd)|betrag\s+in\s+(?:eur|euro|usd)|eur|euro|usd|sous[- ]?total|zwischensumme|zwischentotal|subtotal|total|summe|twint|eft|e[- ]?payment|maestro|visa|mastercard|postcard|v[- ]?pay|especes|espèces|bargeld|cash|r[uü]ckgeld|monnaie\s+rendue|rendu|pay[ée]|bezahlt|zahlung)(?![a-zà-ÿ])/i;
export const estHorsArticle = (ligne: LigneControlee): boolean => HORS_ARTICLE.test(ligne.name ?? '');

/** Le montant d'une ligne en centimes : le montant lu, sinon le prix quand la quantité est 1 ou absente ; null sinon (jamais 0). */
export function montantDeLigneCts(ligne: LigneControlee): number | null {
  const m = cts(ligne.amountTTC);
  if (m !== null) return m;
  const p = cts(ligne.price);
  return p !== null && (ligne.quantity === null || ligne.quantity === undefined || ligne.quantity === 1) ? p : null;
}
/** Une remise : lue comme telle, ou de montant négatif (arrondi compris). Jamais un article. */
export const estRemise = (ligne: LigneControlee): boolean => ligne.kind === 'discount' || (montantDeLigneCts(ligne) ?? 0) < 0;

/** Articles (hors remises, hors lignes qui n'en sont pas) et remises d'une lecture, avec leurs rangs (base 1). */
export function compterArticles(items: LigneControlee[]): { articles: number; remises: number; horsArticles: number; rangsHors: number[] } {
  let articles = 0, remises = 0; const rangsHors: number[] = [];
  items.forEach((l, i) => { if (estHorsArticle(l)) rangsHors.push(i + 1); else if (estRemise(l)) remises++; else articles++; });
  return { articles, remises, horsArticles: rangsHors.length, rangsHors };
}

export interface ArticleAvecRemises {
  /** Rang (base 1) de l'article dans `lecture.items`. */
  rang: number;
  /** Rangs des remises rendues juste sous lui : ses sous-lignes. */
  remises: number[];
  /** Montant de l'article moins ses remises, en centimes ; null quand l'article n'a pas de montant lu (jamais 0). */
  netCts: number | null;
}
/**
 * Rabais : une remise est une SOUS-LIGNE de l'article qui la précède, jamais un article (décision du pilote, 09.11, option b). La liste rend chaque article
 * avec ses remises, et les remises sans article au-dessus (`orphelines` : une remise globale du ticket). Les lignes qui ne sont pas des articles sont ignorées.
 * Le nombre d'articles « trouvés » à comparer à `printedItemCount` est `articles.length`.
 */
export function rattacherRemises(items: LigneControlee[]): { articles: ArticleAvecRemises[]; orphelines: number[] } {
  const articles: ArticleAvecRemises[] = [], orphelines: number[] = [];
  items.forEach((l, i) => {
    if (estHorsArticle(l)) return;
    const m = montantDeLigneCts(l);
    if (estRemise(l)) {
      const haut = articles[articles.length - 1];
      if (!haut) { orphelines.push(i + 1); return; }
      haut.remises.push(i + 1);
      if (haut.netCts !== null && m !== null) haut.netCts += m;
      else haut.netCts = null;
    } else articles.push({ rang: i + 1, remises: [], netCts: m });
  });
  return { articles, orphelines };
}

function dateIso(date: string | undefined): string {
  const s = (date ?? '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s), suisse = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  if (suisse) return `${suisse[3]}-${suisse[2].padStart(2, '0')}-${suisse[1].padStart(2, '0')}`;
  return '';
}
const heureNet = (h: string | undefined): string => {
  const m = /^(\d{1,2})[:h.](\d{2})/.exec((h ?? '').trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
};

// -------------------------------------------------------------------------------------------------------------------------------------------
// Les dix contrôles
// -------------------------------------------------------------------------------------------------------------------------------------------
function comptageMontants(l: LectureControlee): ControlePiece {
  const attendu = l.countedAmounts ?? null;
  const lues = l.items.filter(i => !estHorsArticle(i) && montantDeLigneCts(i) !== null).length;
  const base = { id: 'comptage-montants' as const, attendu: attendu === null ? '—' : mark(attendu, 'montant'), trouve: mark(lues, 'ligne') + ' avec montant' };
  if (attendu === null) return { ...base, ok: null, geste: rien };
  if (attendu === lues) return { ...base, ok: true, geste: rien };
  const manque = attendu > lues;
  return {
    ...base, ok: false, ecart: Math.abs(attendu - lues), unite: 'lignes', sens: manque ? 'manque' : 'exces',
    geste: manque ? { type: 'ajouter', libelle: `Ajouter ${mark(attendu - lues, 'ligne')} : la colonne des montants en compte plus` }
      : { type: 'ouvrir-ligne', libelle: `${mark(lues - attendu, 'ligne')} de trop : ouvrir, modifier ou retirer` },
  };
}

function comptageEanBrut(l: LectureControlee): ControlePiece {
  const attendu = l.countedEans ?? null;
  const codes = l.items.map((it, i) => ({ rang: i + 1, code: codeBarresDeLigne(it) })).filter(c => c.code !== null);
  const base = { id: 'comptage-ean' as const, attendu: attendu === null ? '—' : mark(attendu, 'code EAN', 'codes EAN'), trouve: mark(codes.length, 'code EAN', 'codes EAN') + ' lus sur les lignes' };
  if (attendu === null) return { ...base, ok: null, geste: rien };
  if (attendu === codes.length) return { ...base, ok: true, geste: rien };
  const manque = attendu > codes.length;
  return {
    ...base, ok: false, ecart: Math.abs(attendu - codes.length), unite: 'codes', sens: manque ? 'manque' : 'exces',
    geste: manque ? { type: 'rechercher', libelle: 'Un code est imprimé sans ligne lue : chercher la ligne, ou relire la photo' } : { type: 'relire-photo', libelle: 'Plus de codes lus que de codes imprimés : relire la photo' },
  };
}

function cleEanBrut(l: LectureControlee): ControlePiece {
  const codes = l.items.map((it, i) => ({ rang: i + 1, code: codeBarresDeLigne(it) })).filter((c): c is { rang: number; code: string } => c.code !== null);
  if (!codes.length) return { id: 'cle-ean', ok: null, attendu: 'clé de contrôle valide', trouve: 'aucun code EAN lu', geste: rien };
  const faux = codes.filter(c => !cleGs1Valide(c.code));
  const base = { id: 'cle-ean' as const, attendu: 'clé de contrôle valide', trouve: `${mark(codes.length, 'code lu', 'codes lus')}, ${faux.length ? `${faux.length} invalide${faux.length > 1 ? 's' : ''}` : 'tous valides'}` };
  if (!faux.length) return { ...base, ok: true, geste: rien };
  return {
    ...base, ok: false, ecart: faux.length, unite: 'codes', lignes: faux.map(c => c.rang),
    note: faux.map(c => `ligne ${c.rang} : ${c.code}`).join(' · '),
    geste: { type: 'ouvrir-ligne', libelle: faux.length > 1 ? 'Codes mal lus : relire chaque chiffre sur la photo' : 'Code mal lu : relire chaque chiffre sur la photo', lignes: faux.map(c => c.rang) },
  };
}

const comptageEan = (l: LectureControlee, ctx: ContexteControles): ControlePiece => (ctx.eanFiables ? comptageEanBrut(l) : sansDrapeauEan(comptageEanBrut(l)));
const cleEan = (l: LectureControlee, ctx: ContexteControles): ControlePiece => (ctx.eanFiables ? cleEanBrut(l) : sansDrapeauEan(cleEanBrut(l)));

function brutRabais(l: LectureControlee): ControlePiece {
  const total = cts(l.amountTTC);
  let brut = 0, rabais = 0, sansMontant = 0;
  const articlesRangs: number[] = [];
  l.items.forEach((it, i) => {
    if (estHorsArticle(it)) return;
    const m = montantDeLigneCts(it);
    if (m === null) { sansMontant++; return; }
    if (estRemise(it)) rabais += m; else { brut += m; articlesRangs.push(i + 1); }
  });
  const { articles, remises } = compterArticles(l.items);
  const { orphelines } = rattacherRemises(l.items);
  const net = brut + rabais;
  const base = {
    id: 'brut-rabais' as const, attendu: total === null ? '—' : `total ${chf(total)}`,
    trouve: `brut ${chf(brut)}${rabais !== 0 ? ` − rabais ${chf(-rabais)}` : ''} = ${chf(net)}`,
    note: `${mark(articles, 'article')}${remises ? `, ${mark(remises, 'remise')} (sous-lignes de leur article, jamais comptées comme articles)${orphelines.length ? ` dont ${mark(orphelines.length, 'sans article au-dessus', 'sans article au-dessus')}` : ''}` : ''}${sansMontant ? ` ; ${mark(sansMontant, 'ligne')} sans montant non comptée${sansMontant > 1 ? 's' : ''}` : ''}`,
  };
  if (total === null || !l.items.length) return { ...base, ok: null, geste: rien };
  const ecart = total - net;
  if (Math.abs(ecart) <= TOLERANCE && sansMontant === 0) return { ...base, ok: true, geste: rien };
  if (Math.abs(ecart) <= TOLERANCE) return { ...base, ok: null, geste: { type: 'ouvrir-ligne', libelle: 'Une ligne n’a pas de montant : l’ouvrir' } };
  const manque = ecart > 0;
  const coupables = manque ? { enTrop: [] as number[], signe: [] as number[] } : coupablesDeLEcart(l.items.map(i => ({ amountTTC: montantDeLigneCts(i) === null ? null : montantDeLigneCts(i)! / 100, name: i.name })), ecart);
  const lignes = manque ? undefined : [...coupables.enTrop, ...coupables.signe];
  return {
    ...base, ok: false, ecart: Math.abs(ecart) / 100, unite: 'CHF', sens: manque ? 'manque' : 'exces',
    ...(lignes?.length ? { lignes } : {}),
    geste: manque
      ? { type: 'ajouter', libelle: `${chf(ecart)} CHF non retrouvés dans les lignes : chercher, ajouter la ligne manquante ou relire la photo` }
      : lignes?.length ? { type: 'ouvrir-ligne', libelle: `${chf(-ecart)} CHF de trop : ouvrir la ligne en cause`, lignes }
        : { type: 'ouvrir-ligne', libelle: `${chf(-ecart)} CHF de trop : une ligne en double ou de signe faux ?` },
  };
}

function tvaParTaux(l: LectureControlee): ControlePiece {
  const attendu = 'TVA imprimée par taux';
  let lignesTva = (l.vat ?? []).filter(r => r.rate !== null && r.rate >= 0);
  if (!lignesTva.length && l.tvaRate !== null && l.tvaRate !== undefined && l.tvaAmount !== null && l.tvaAmount !== undefined) lignesTva = [{ code: '', rate: l.tvaRate, amount: l.tvaAmount }];
  const total = cts(l.amountTTC);
  const montants = l.items.map(i => ({ code: (i.vatCode ?? '').trim(), m: montantDeLigneCts(i), hors: estHorsArticle(i) })).filter(x => !x.hors);
  const comparaisons: Array<{ taux: number; imprimee: number; calculee: number }> = [];
  for (const row of lignesTva) {
    const imprimee = cts(row.amount); if (imprimee === null) continue;
    let ttc: number | null = null;
    if (lignesTva.length === 1) ttc = total;
    else if (lignesTva.every(r => r.code) && montants.every(x => x.code && x.m !== null)) ttc = montants.filter(x => x.code === row.code).reduce((s, x) => s + x.m!, 0);
    if (ttc === null) continue;
    const t = row.rate! * 100;
    comparaisons.push({ taux: t, imprimee, calculee: Math.round((ttc * t) / (100 + t)) });
  }
  if (!comparaisons.length) return { id: 'tva-par-taux', ok: null, attendu, trouve: 'non vérifiable (TVA ou total non lus)', geste: rien };
  const pct = (t: number) => `${(Math.round(t * 100) / 100).toString().replace('.', ',')} %`;
  const faux = comparaisons.filter(c => Math.abs(c.imprimee - c.calculee) > TOLERANCE);
  const base = {
    id: 'tva-par-taux' as const, attendu,
    trouve: comparaisons.map(c => `${pct(c.taux)} : ${chf(c.imprimee)} imprimée, ${chf(c.calculee)} recalculée`).join(' · '),
  };
  if (!faux.length) return { ...base, ok: true, geste: rien };
  return {
    ...base, ok: false, ecart: Math.max(...faux.map(c => Math.abs(c.imprimee - c.calculee))) / 100, unite: 'CHF',
    geste: { type: 'relire-photo', libelle: 'TVA qui ne se recoupe pas : relire le pied de la pièce (montants ou taux mal lus)' },
  };
}

/** Une dépense du même fournisseur le même jour : le contexte la porte, la clé de fournisseur est celle du registre (forme juridique ignorée). */
function memeJour(l: LectureControlee, d: DepenseConnue): boolean {
  const v = vendorKey(l.vendor ?? ''), jour = dateIso(l.date);
  return v !== '' && jour !== '' && vendorKey(d.vendor) === v && dateIso(d.date) === jour;
}

/**
 * Payé contre total. Le payé du TICKET est `amountPaid` (« Montant reçu / Payé ») ; le montant du terminal (EFT, TWINT) est une INFORMATION, `terminalAmount` :
 * un seul paiement peut couvrir plusieurs tickets (Sun Store : 14,60 + 149,25 = 163,85). Il ne lève jamais seul un drapeau ; il est expliqué par les autres dépenses du même
 * fournisseur, du même jour, quand il y en a. Sans `amountPaid`, un terminal égal au total vaut paiement ; différent, le contrôle reste non vérifiable.
 */
function paiement(l: LectureControlee, ctx: ContexteControles): ControlePiece {
  const total = cts(l.amountTTC), payeLu = cts(l.amountPaid), terminal = cts(l.terminalAmount);
  const moyen = l.paymentMethod && l.paymentMethod !== 'unknown' ? ` (${({ twint: 'TWINT', cash: 'espèces', card: 'carte', bank_transfer: 'virement', other: 'autre' } as Record<string, string>)[l.paymentMethod] ?? l.paymentMethod})` : '';
  const paye = payeLu ?? (terminal !== null && total !== null && Math.abs(terminal - total) <= TOLERANCE ? terminal : null);
  const base = {
    id: 'paiement' as const, attendu: total === null ? '—' : `total ${chf(total)}`,
    trouve: paye !== null ? `payé ${chf(paye)}${moyen}` : terminal !== null ? `montant payé non lu ; terminal ${chf(terminal)}${moyen}` : 'montant payé non lu',
  };
  // Le règlement commun : le montant du terminal est la somme de ce ticket et d'autres dépenses du même fournisseur, du même jour.
  const partage = (() => {
    if (total === null || terminal === null || terminal <= total + TOLERANCE) return null;
    const candidates = (ctx.depenses ?? []).filter(d => memeJour(l, d) && cts(d.total) !== null && cts(d.total)! > 0).slice(0, 12);
    for (let masque = 1; masque < (1 << candidates.length); masque++) {
      const choix = candidates.filter((_, i) => masque & (1 << i));
      if (Math.abs(total + choix.reduce((s, d) => s + cts(d.total)!, 0) - terminal) <= TOLERANCE) return choix;
    }
    return null;
  })();
  const noteTerminal = terminal === null || total === null || Math.abs(terminal - total) <= TOLERANCE ? undefined
    : partage ? `Paiement partagé : ${chf(terminal)} au terminal = ${chf(total)} + ${partage.map(d => chf(cts(d.total)!)).join(' + ')} (${mark(partage.length, 'autre dépense')} du même fournisseur, même jour)`
      : `Le terminal affiche ${chf(terminal)}, plus que le total : un règlement commun à plusieurs tickets ? Aucune autre dépense du même fournisseur, du même jour, ne l'explique.`;
  const extra = { ...(noteTerminal ? { note: noteTerminal } : {}), ...(partage ? { refs: partage.map(d => d.id) } : {}) };
  if (total === null || paye === null) {
    // Terminal différent du total, sans montant reçu : une information, jamais un drapeau.
    return { ...base, ok: null, ...(terminal !== null && total !== null ? { ecart: Math.abs(terminal - total) / 100, unite: 'CHF' as const } : {}), ...extra, geste: rien };
  }
  if (Math.abs(paye - total) <= TOLERANCE) {
    return { ...base, ok: true, ...(partage ? { ecart: (terminal! - total) / 100, unite: 'CHF' as const } : {}), ...extra, geste: rien };
  }
  const ecart = Math.abs(paye - total) / 100;
  if (paye > total) {
    return {
      ...base, ok: false, ecart, unite: 'CHF' as const, sens: 'exces' as const, ...extra,
      geste: { type: 'saisir-autre' as const, libelle: `${chf(paye - total)} CHF reçus de plus que le total : relire le total ou le montant reçu` },
    };
  }
  return {
    ...base, ok: false, ecart, unite: 'CHF' as const, sens: 'manque' as const, ...extra,
    geste: { type: 'relire-photo' as const, libelle: 'Reçu moins que le total : paiement partiel, ou total ou montant reçu mal lu ?' },
  };
}

function doublon(l: LectureControlee, ctx: ContexteControles): ControlePiece {
  const total = cts(l.amountTTC), jour = dateIso(l.date), v = vendorKey(l.vendor ?? ''), heure = heureNet(l.printedTime);
  const base = { id: 'doublon' as const, attendu: 'pièce jamais saisie' };
  if (total === null || jour === '' || v === '') return { ...base, ok: null, trouve: 'fournisseur, date ou total non lus', geste: rien };
  const memes = (ctx.depenses ?? []).filter(d => memeJour(l, d) && cts(d.total) === total);
  const pareils = memes.filter(d => { const h = heureNet(d.heure); return !(h && heure && h !== heure); });
  if (!pareils.length) return { ...base, ok: true, trouve: 'aucune dépense identique', geste: rien };
  const certains = pareils.filter(d => heureNet(d.heure) && heure);
  return {
    ...base, ok: false, refs: pareils.map(d => d.id),
    trouve: `${mark(pareils.length, 'dépense identique', 'dépenses identiques')} : même fournisseur, même jour${certains.length ? `, même heure ${heure}` : ' (heure non comparable)'}, même total ${chf(total)}`,
    geste: { type: 'voir-doublon', libelle: certains.length ? 'Déjà saisie : ne pas l’enregistrer deux fois' : 'Probablement déjà saisie : comparer avant d’enregistrer' },
  };
}

function horsArticles(l: LectureControlee): ControlePiece {
  const attendu = 'aucune de ces lignes parmi les articles';
  const { rangsHors } = compterArticles(l.items);
  const ecartees = l.ignoredLines ?? null;
  const resume = (e: LigneEcartee[]) => e.map(x => `${x.label}${x.amount === null ? '' : ` ${chf(Math.round(x.amount * 100))}`}`).join(' · ');
  if (rangsHors.length) {
    return {
      id: 'hors-articles', ok: false, attendu, ecart: rangsHors.length, unite: 'lignes', lignes: rangsHors,
      trouve: `${mark(rangsHors.length, 'ligne')} qui n’est pas un article dans les lignes : ${rangsHors.map(r => `« ${(l.items[r - 1].name ?? '').trim().slice(0, 28)} »`).join(', ')}`,
      geste: { type: 'ouvrir-ligne', libelle: rangsHors.length > 1 ? 'Montant en devise, règlement ou sous-total : retirer ces lignes' : 'Montant en devise, règlement ou sous-total : retirer cette ligne', lignes: rangsHors },
    };
  }
  if (ecartees === null) return { id: 'hors-articles', ok: null, attendu, trouve: 'la lecture ne dit pas ce qu’elle a écarté', geste: rien };
  return {
    id: 'hors-articles', ok: true, attendu,
    trouve: ecartees.length ? `${mark(ecartees.length, 'ligne écartée', 'lignes écartées')} : ${resume(ecartees)}` : 'aucune ligne hors articles',
    geste: rien,
  };
}

function prixPlausible(l: LectureControlee, ctx: ContexteControles): ControlePiece {
  const attendu = 'prix du même article, à ×2 près';
  const connus = ctx.prixConnus ?? [];
  if (!connus.length) return { id: 'prix-plausible', ok: null, attendu, trouve: 'aucun prix connu à comparer', geste: rien };
  const nom = (s: string | undefined) => normalize(s ?? '').replace(/[^a-z0-9]+/g, ' ').trim();
  const code = (s: string | undefined) => (s ?? '').replace(/[\s.-]/g, '');
  const ecarts: Array<{ rang: number; nom: string; lu: number; connu: number; rapport: number }> = [];
  let compares = 0;
  l.items.forEach((it, i) => {
    if (estHorsArticle(it) || estRemise(it)) return;
    let lu = cts(it.price);
    if (lu === null) { const m = montantDeLigneCts(it); lu = m !== null && it.quantity && it.quantity > 0 ? Math.round(m / it.quantity) : m !== null && it.quantity === undefined ? m : null; }
    if (lu === null || lu <= 0) return;
    const ean = codeBarresDeLigne(it), ref = code(it.reference), n = nom(it.name);
    const memes = connus.filter(k => {
      const unitesDiffer = nom(it.unit) && nom(k.unite) && nom(it.unit) !== nom(k.unite);
      if (unitesDiffer || !(k.prix > 0)) return false;
      return (ean !== null && (code(k.ean) === ean || code(k.reference) === ean)) || (ref !== '' && (code(k.reference) === ref || code(k.ean) === ref)) || (n !== '' && nom(k.nom) === n);
    });
    if (!memes.length) return;
    compares++;
    // Le prix connu le plus proche : le doute profite à la lecture.
    const rapports = memes.map(k => { const c = Math.round(k.prix * 100); return { c, r: lu! > c ? lu! / c : c / lu! }; }).sort((a, b) => a.r - b.r);
    if (rapports[0].r > 2) ecarts.push({ rang: i + 1, nom: (it.name ?? '').trim().slice(0, 28), lu, connu: rapports[0].c, rapport: rapports[0].r });
  });
  if (!compares) return { id: 'prix-plausible', ok: null, attendu, trouve: 'aucune ligne ne retrouve un prix connu', geste: rien };
  if (!ecarts.length) return { id: 'prix-plausible', ok: true, attendu, trouve: `${mark(compares, 'prix comparé')} au stock ou aux achats : aucun écart de plus de ×2`, geste: rien };
  return {
    id: 'prix-plausible', ok: false, attendu, ecart: ecarts.length, unite: 'lignes', lignes: ecarts.map(e => e.rang),
    trouve: ecarts.map(e => `« ${e.nom} » ${chf(e.lu)} contre ${chf(e.connu)} connu (×${(Math.round(e.rapport * 10) / 10).toString().replace('.', ',')})`).join(' · '),
    geste: { type: 'ouvrir-ligne', libelle: 'Prix très éloigné de l’habitude : relire le prix et la quantité (virgule déplacée ?)', lignes: ecarts.map(e => e.rang) },
  };
}

function photoIncomplete(l: LectureControlee): ControlePiece {
  const attendu = 'zone des montants entière et lisible';
  if (l.photoIncomplete === null || l.photoIncomplete === undefined) return { id: 'photo-incomplete', ok: null, attendu, trouve: 'la lecture ne le dit pas', geste: rien };
  if (!l.photoIncomplete) return { id: 'photo-incomplete', ok: true, attendu, trouve: 'zone des montants lisible', geste: rien };
  return {
    id: 'photo-incomplete', ok: false, attendu,
    trouve: `zone des montants coupée, pliée ou tachée${l.photoIncompleteNote ? ` : ${l.photoIncompleteNote}` : ''}`,
    geste: { type: 'relire-photo', libelle: 'Photo incomplète : reprendre une photo bien à plat, ou ajouter les lignes cachées à la main' },
  };
}

/** Les dix contrôles de la pièce, dans l'ordre fixe de l'en-tête. Le contexte est facultatif : sans lui, doublon, paiement partagé et prix restent non vérifiables, jamais « bons ». */
export function controlesPiece(lecture: LectureControlee, contexte: ContexteControles = {}): ControlePiece[] {
  return [
    comptageMontants(lecture), comptageEan(lecture, contexte), cleEan(lecture, contexte), brutRabais(lecture), tvaParTaux(lecture),
    paiement(lecture, contexte), doublon(lecture, contexte), horsArticles(lecture), prixPlausible(lecture, contexte), photoIncomplete(lecture),
  ];
}
/** Les contrôles qui ne concordent pas (`ok === false`) : le drapeau se lève dès qu'il y en a un. Un contrôle non vérifiable (null) ne lève rien et ne rassure pas. */
export const controlesEnEchec = (liste: ControlePiece[]): ControlePiece[] => liste.filter(c => c.ok === false);
