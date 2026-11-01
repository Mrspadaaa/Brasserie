// Ce que le sceau QR dit (z2, D246) : l'état du sceau, son verdict en un mot, les lignes de la feuille « Ce que dit le QR » et le duel du total.
// Fonctions pures : le résultat de la lecture du QR (`qrLecture.ts`) et la confrontation (`qrFacture.ts`) arrivent calculés ; rien n'est écrit, aucun champ n'est changé.
import type { ChampConfronte, ConfrontationQr, ConditionS1, LectureQr, QrFacture } from '../../services/qrFacture';
import type { ResultatQr } from '../../services/qrLecture';

/** Les états dessinés par z2 : attente (lecture…), ok (QR ✓), diff (le montant du QR), partiel, off (illisible), sans (cercle vide « sans QR »). */
export type EtatSceau = 'wait' | 'ok' | 'diff' | 'partiel' | 'off' | 'sans';
export type StatutLigne = 'ok' | 'ko' | 'vide' | 'abs';

export interface LigneFiche {
  cle: 'qr' | 'montant' | 'facture' | 'date' | 'devise' | 'creancier' | 'iban' | 'reference' | 'conditions' | 'lignes' | 'probleme';
  libelle: string;
  valeur: string;
  /** `ok` coche, `ko` écart, `vide` rien de décodé, `abs` « pas dans le QR » (le champ existe, le QR ne le porte pas). */
  statut: StatutLigne | null;
  note: string;
  /** Le texte à copier (IBAN, référence), sans espace. */
  copier?: string;
  /** Mise en forme sur deux lignes (IBAN). */
  surDeuxLignes?: boolean;
}

export interface Duel {
  /** Le total lu sur la page, et celui du QR, tels qu'écrits (« 110,04 », « 110,40 »). */
  lu: string; qr: string;
  /** Le nombre, pour poser le champ quand le brasseur choisit. */
  luNombre: number; qrNombre: number;
  /** Début commun des deux écritures, puis la fin qui diffère (« 110, » + « 04 » / « 40 »). */
  prefixe: string; resteLu: string; resteQr: string;
}

export interface VueQr {
  etat: EtatSceau;
  /** Le mot sous le QR dessiné : « QR ✓ », « 110,40 », « partiel », « illisible », « lecture… », « écart », « invalide », « » pour sans. */
  verdict: string;
  /** Le libellé lu par un lecteur d'écran. */
  aria: string;
  lignes: LigneFiche[];
  duel: Duel | null;
  /** Le montant du QR contredit celui de la page : le total est douteux jusqu'au choix du brasseur. */
  contredit: boolean;
  /** L'illisible propose de photographier le QR. */
  photographier: boolean;
}

export const fr2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
/** AAAA-MM-JJ → JJ.MM.AAAA ; une valeur d'une autre forme est rendue telle quelle. */
const dateSuisse = (iso: string): string => iso.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3.$2.$1');
const groupes = (texte: string, taille: number, depuisLaFin: boolean): string => {
  const morceaux: string[] = [];
  if (depuisLaFin) { for (let fin = texte.length; fin > 0; fin -= taille) morceaux.unshift(texte.slice(Math.max(0, fin - taille), fin)); }
  else for (let i = 0; i < texte.length; i += taille) morceaux.push(texte.slice(i, i + taille));
  return morceaux.join(' ');
};
/** IBAN par groupes de 4 ; référence QRR par groupes de 5 depuis la droite (21 00000 00003 …), SCOR par 4. */
export const ibanLisible = (iban: string): string => groupes(iban, 4, false);
export const referenceLisible = (type: string, reference: string): string => (type === 'QRR' ? groupes(reference, 5, true) : groupes(reference, 4, false));

/** Début commun puis fin qui diffère de deux écritures (la colonne fautive du duel). */
export function ecartMarque(a: string, b: string): { prefixe: string; resteA: string; resteB: string } {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return { prefixe: a.slice(0, i), resteA: a.slice(i), resteB: b.slice(i) };
}

const phraseCondition = (c: ConditionS1): string => (c.escomptePct === 0 ? `net à ${c.jours} jours` : `${String(c.escomptePct).replace('.', ',')} % à ${c.jours} jours`);
const conditionsTexte = (conditions: readonly ConditionS1[], net: number | null): string =>
  conditions.length === 1 && net !== null ? `${net} jours` : conditions.map(phraseCondition).join(' · ');

function ligneChamp<T extends string | number>(cle: LigneFiche['cle'], libelle: string, champ: ChampConfronte<T>, formate: (v: T) => string, suffixe = ''): LigneFiche {
  const qr = champ.qr, lu = champ.lecture;
  if (champ.statut === 'confirme') return { cle, libelle, valeur: formate(qr as T) + suffixe, statut: 'ok', note: '= lu' };
  if (champ.statut === 'contredit') return { cle, libelle, valeur: formate(qr as T) + suffixe, statut: 'ko', note: `lu ${formate(lu as T)}` };
  if (champ.statut === 'absent') return { cle, libelle, valeur: 'pas dans le QR', statut: 'abs', note: lu === null ? '' : `lu ${formate(lu)}` };
  return { cle, libelle, valeur: formate(qr as T) + suffixe, statut: 'vide', note: 'non lu' };
}

/** Les lignes que le QR porte pour payer, jamais remplacées par la lecture : IBAN, référence, conditions. */
function lignesPaiement(c: ConfrontationQr, qr: QrFacture): LigneFiche[] {
  const sortie: LigneFiche[] = [];
  // L'IBAN tient sur deux lignes (quatre groupes, puis le reste) : rien n'est rogné à 390 px.
  if (c.iban) sortie.push({ cle: 'iban', libelle: 'IBAN', valeur: ibanLisible(c.iban).replace(/^((?:\S{4} ){3}\S{4}) /, (_tout, quatre: string) => `${quatre}\n`), statut: null, note: '', copier: c.iban, surDeuxLignes: true });
  if (c.reference) sortie.push({ cle: 'reference', libelle: 'Référence', valeur: referenceLisible(c.reference.type, c.reference.valeur), statut: null, note: '', copier: c.reference.valeur });
  if (c.conditions.length) sortie.push({ cle: 'conditions', libelle: 'Conditions', valeur: conditionsTexte(c.conditions, c.delaiNetJours), statut: null, note: '' });
  void qr;
  return sortie;
}

/** Les lignes de la feuille pour un QR valide confronté à la lecture. */
function lignesConfrontees(c: ConfrontationQr, qr: QrFacture): LigneFiche[] {
  const devise = qr.devise;
  const sortie: LigneFiche[] = [
    ligneChamp('montant', 'Montant', c.montant, fr2, ` ${devise}`),
    ligneChamp('facture', 'Facture', c.numero, v => v),
    ligneChamp('date', 'Date', c.date, dateSuisse),
  ];
  // La devise ne s'ajoute que si le montant ne la dit pas déjà, d'accord (montant absent du QR, ou devise en désaccord).
  if (c.devise.statut !== 'confirme' || c.montant.statut === 'absent') sortie.push(ligneChamp('devise', 'Devise', c.devise, v => v));
  sortie.push(ligneChamp('creancier', 'Créancier', c.creancier, v => v));
  // Un montant absent du QR : la ligne « montant » n'a pas de suffixe de devise.
  return [...sortie, ...lignesPaiement(c, qr)];
}

/** Les lignes avant que la lecture de la facture ne soit là : ce que le QR dit seul, « lu en 0,5 s ». */
function lignesSeules(qr: QrFacture, ms: number): LigneFiche[] {
  const sortie: LigneFiche[] = [];
  const temps = `lu en ${(ms / 1000).toFixed(1).replace('.', ',')} s`;
  sortie.push(qr.montant === null ? { cle: 'montant', libelle: 'Montant', valeur: 'pas dans le QR', statut: 'abs', note: '' } : { cle: 'montant', libelle: 'Montant', valeur: `${fr2(qr.montant)} ${qr.devise}`, statut: 'ok', note: temps });
  sortie.push(qr.s1?.numero ? { cle: 'facture', libelle: 'Facture', valeur: qr.s1.numero, statut: 'ok', note: '' } : { cle: 'facture', libelle: 'Facture', valeur: 'pas dans le QR', statut: 'abs', note: '' });
  sortie.push(qr.s1?.date?.debut ? { cle: 'date', libelle: 'Date', valeur: dateSuisse(qr.s1.date.debut), statut: 'ok', note: '' } : { cle: 'date', libelle: 'Date', valeur: 'pas dans le QR', statut: 'abs', note: '' });
  sortie.push({ cle: 'lignes', libelle: 'Lignes', valeur: 'lecture en cours…', statut: 'vide', note: '' });
  return sortie;
}

/** Ce que la lecture de la facture dit seule, quand le QR n'a rien décodé (illisible) : une aide, jamais une confirmation. */
function lignesIllisible(lecture: LectureQr | null): LigneFiche[] {
  const sortie: LigneFiche[] = [{ cle: 'qr', libelle: 'QR', valeur: 'vu, rien décodé', statut: 'vide', note: '' }];
  if (!lecture) return sortie;
  sortie.push({ cle: 'montant', libelle: 'Montant', valeur: typeof lecture.amountTTC === 'number' ? `lu ${fr2(lecture.amountTTC)} · à vérifier sur la page` : 'non lu', statut: 'vide', note: '' });
  if (lecture.invoiceNumber?.trim()) sortie.push({ cle: 'facture', libelle: 'Facture', valeur: `lu ${lecture.invoiceNumber.trim()}`, statut: 'vide', note: '' });
  if (lecture.date?.trim()) sortie.push({ cle: 'date', libelle: 'Date', valeur: `lu ${lecture.date.trim()}`, statut: 'vide', note: '' });
  return sortie;
}

/**
 * La vue du sceau. `resultat` : ce que la lecture du QR a rendu (`null` : elle court encore). `confrontation` : le QR face à la lecture de la facture
 * (`null` : la lecture de la facture n'est pas là). Rend `null` quand il n'y a rien à dire : lecture non vérifiée (hors ligne, erreur) ou pas de fichier.
 * « Sans QR » (`sans`) et « pas vérifié » (`null`) ne se confondent jamais.
 */
export function vueQr(resultat: ResultatQr | null, confrontation: ConfrontationQr | null, lecture: LectureQr | null, choix: 'lu' | 'qr' | null = null): VueQr | null {
  if (resultat === null) return { etat: 'wait', verdict: 'lecture…', aria: 'QR-facture : lecture en cours', lignes: [], duel: null, contredit: false, photographier: false };
  if (resultat.statut === 'non-verifie') return null;
  if (resultat.statut === 'sans') return { etat: 'sans', verdict: '', aria: 'Aucun QR-facture sur ce document', lignes: [], duel: null, contredit: false, photographier: false };
  if (resultat.statut === 'illisible') {
    return { etat: 'off', verdict: 'illisible', aria: 'QR-facture : illisible', lignes: lignesIllisible(lecture), duel: null, contredit: false, photographier: true };
  }
  const qr = resultat.qr;
  if (!qr.valid) {
    const problemes = qr.problemes.slice(0, 3).map((p): LigneFiche => ({ cle: 'probleme', libelle: '', valeur: p, statut: 'vide', note: '' }));
    return { etat: 'off', verdict: 'invalide', aria: 'QR-facture : lu, mais non conforme', lignes: [{ cle: 'qr', libelle: 'QR', valeur: 'lu, mais non conforme : il ne confirme rien', statut: 'vide', note: '' }, ...problemes], duel: null, contredit: false, photographier: true };
  }
  if (!confrontation || confrontation.etat !== 'valide') {
    return { etat: 'wait', verdict: 'lecture…', aria: 'QR-facture : lu, en attente de la lecture de la facture', lignes: lignesSeules(qr, resultat.ms), duel: null, contredit: false, photographier: false };
  }
  const c = confrontation;
  const lignes = lignesConfrontees(c, qr);
  const montantContredit = c.montant.statut === 'contredit';
  const autreContredit = [c.numero, c.date, c.creancier, c.devise].some(champ => champ.statut === 'contredit');
  const deviseContredite = c.devise.statut === 'contredit';
  if (montantContredit || autreContredit) {
    let duel: Duel | null = null;
    if (montantContredit && !deviseContredite && c.montant.qr !== null && c.montant.lecture !== null) {
      const lu = fr2(c.montant.lecture), q = fr2(c.montant.qr), e = ecartMarque(lu, q);
      duel = { lu, qr: q, luNombre: c.montant.lecture, qrNombre: c.montant.qr, prefixe: e.prefixe, resteLu: e.resteA, resteQr: e.resteB };
    }
    // Le choix du brasseur devant le duel (z2) : « pris » (le QR, « QR ✓ ») ou « lu gardé » (la page). Le sceau le dit ; rien d'autre ne change ici.
    const montant = lignes.find(l => l.cle === 'montant');
    if (duel && montant && choix === 'qr') {
      montant.statut = 'ok'; montant.note = 'pris';
      return { etat: 'ok', verdict: 'QR ✓', aria: `QR-facture : le montant du QR (${duel.qr}) est pris`, lignes, duel, contredit: true, photographier: false };
    }
    if (duel && montant && choix === 'lu') {
      montant.note = `lu ${duel.lu} gardé`;
      return { etat: 'diff', verdict: 'lu gardé', aria: `QR-facture : la lecture de la page (${duel.lu}) est gardée`, lignes, duel, contredit: true, photographier: false };
    }
    return {
      etat: 'diff', verdict: duel ? duel.qr : deviseContredite ? 'devise' : 'écart', aria: duel ? `QR-facture : le montant du QR est ${duel.qr}, la page dit ${duel.lu}` : 'QR-facture : écart avec la lecture',
      lignes, duel, contredit: montantContredit, photographier: false,
    };
  }
  if (c.montant.statut === 'confirme') return { etat: 'ok', verdict: 'QR ✓', aria: 'QR-facture : confirme la lecture', lignes, duel: null, contredit: false, photographier: false };
  return { etat: 'partiel', verdict: 'partiel', aria: 'QR-facture : confirme en partie la lecture', lignes, duel: null, contredit: false, photographier: false };
}
