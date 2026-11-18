// QR-facture suisse (SPC) : lecture du texte du QR, de l'information de facturation Swico S1, et confrontation à la lecture de la facture.
// Module pur : ni dépendance, ni réseau. Le texte vient de zxing (plus tard, dans le téléphone) ; ici on ne décode aucune image.
// Sources : Swiss Implementation Guidelines QR-bill (SIX, version 2.x) et norme Swico S1 (« Rechnungsinformation »). Aucune pièce réelle.
import type { ScannedInvoiceResult } from './geminiScanner';

// ---------------------------------------------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------------------------------------------

/** Adresse du créancier ou du débiteur final. Type K (combiné) : `rue` = ligne 1, `numero` = ligne 2, NPA et lieu restent vides. */
export interface QrAdresse {
  type: 'S' | 'K' | '';
  nom: string;
  rue: string;
  numero: string;
  npa: string;
  lieu: string;
  pays: string;
}

/** Une date de l'information S1 : `debut` en AAAA-MM-JJ, `fin` si c'est une période (AAMMJJAAMMJJ), `brut` tel qu'imprimé. */
export interface DateS1 {
  debut: string | null;
  fin: string | null;
  brut: string;
}

/** Un taux de TVA de l'information S1, avec son montant quand il est donné (`taux:montant`). */
export interface TauxS1 {
  taux: number;
  montant: number | null;
}

/** Une condition de paiement S1 : escompte en pour-cent (0 = net) et délai en jours. */
export interface ConditionS1 {
  escomptePct: number;
  jours: number;
}

export interface SwicoS1 {
  /** /10/ numéro de facture (barres obliques échappées `\/` rendues). */
  numero: string | null;
  /** /11/ date de la facture, ou période. */
  date: DateS1 | null;
  /** /20/ référence du client. */
  referenceClient: string | null;
  /** /30/ numéro IDE du fournisseur (chiffres seuls, sans CHE ni TVA). */
  ide: string | null;
  /** /31/ date ou période de la prestation. */
  prestation: DateS1 | null;
  /** /32/ taux de TVA seul (8.1) ou liste taux:montant;… — vide si absent. */
  tva: TauxS1[];
  /** /33/ même forme que /32/ (taux:montant;…) — champ rendu tel quel, son sens fiscal n'est pas interprété ici. */
  tva33: TauxS1[];
  /** /40/ conditions de paiement escompte:jours;… — vide si absent. */
  conditions: ConditionS1[];
  /** Codes inconnus, gardés bruts (code → valeur). */
  inconnus: Record<string, string>;
}

export type TypeReference = 'QRR' | 'SCOR' | 'NON';

export interface QrFacture {
  version: string;
  iban: string;
  /** IBAN dont l'identifiant d'établissement (positions 5 à 9) va de 30000 à 31999. */
  qrIban: boolean;
  creancier: QrAdresse;
  /** Montant en unités (francs) ; `null` quand le champ est vide (bulletin ouvert). Jamais 0 par défaut. */
  montant: number | null;
  devise: string;
  /** Débiteur final ; `null` quand ses sept champs sont vides. */
  debiteur: QrAdresse | null;
  typeReference: string;
  reference: string;
  message: string;
  epd: string;
  infosFacturation: string;
  procedures: string[];
  /** L'information de facturation lue comme Swico S1, `null` si elle n'en est pas une. */
  s1: SwicoS1 | null;
  /** Vrai si aucun problème n'a été relevé. Un QR invalide ne confirme rien (voir `confronterQr`). */
  valid: boolean;
  problemes: string[];
}

export type StatutChamp = 'confirme' | 'contredit' | 'absent' | 'non-lu';

/** Un champ confronté : le statut et les deux valeurs (null quand une source ne la porte pas). */
export interface ChampConfronte<T> {
  statut: StatutChamp;
  qr: T | null;
  lecture: T | null;
}

export type EtatQr = 'aucun' | 'invalide' | 'valide';

export interface ConfrontationQr {
  /** `aucun` : pas de QR ; `invalide` : QR lu mais non conforme (aucun champ confirmé ni contredit) ; `valide`. */
  etat: EtatQr;
  problemes: string[];
  montant: ChampConfronte<number>;
  devise: ChampConfronte<string>;
  numero: ChampConfronte<string>;
  /** Dates en AAAA-MM-JJ. */
  date: ChampConfronte<string>;
  creancier: ChampConfronte<string>;
  /** IBAN et référence du QR, pour payer ; `null` si le QR n'est pas valide. Jamais remplacés par la lecture. */
  iban: string | null;
  reference: { type: TypeReference; valeur: string } | null;
  /** Conditions de paiement S1 (pour payer plus tard) et le délai net (jours de la condition à 0 %), `null` si non porté. */
  conditions: ConditionS1[];
  delaiNetJours: number | null;
}

/** Ce que `confronterQr` lit de la lecture de la facture. */
export type LectureQr = Pick<ScannedInvoiceResult, 'vendor' | 'date' | 'currency' | 'invoiceNumber' | 'amountTTC'>;

// ---------------------------------------------------------------------------------------------------------------------------------
// Contrôles de clé
// ---------------------------------------------------------------------------------------------------------------------------------

/** Reste modulo 97 d'une chaîne alphanumérique (A = 10 … Z = 35), par tranches pour ne pas dépasser les entiers sûrs. */
function modulo97(texte: string): number {
  let reste = 0;
  for (const c of texte) {
    const valeur = c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c;
    for (const chiffre of valeur) reste = (reste * 10 + Number(chiffre)) % 97;
  }
  return reste;
}

/** IBAN suisse ou liechtensteinois : forme (21 caractères) et clé modulo 97 (ISO 13616). */
export function ibanValide(iban: string): boolean {
  if (!/^(CH|LI)\d{2}\d{5}[0-9A-Z]{12}$/.test(iban)) return false;
  return modulo97(iban.slice(4) + iban.slice(0, 4)) === 1;
}

/** QR-IBAN : identifiant d'établissement (positions 5 à 9) entre 30000 et 31999. */
export function estQrIban(iban: string): boolean {
  const iid = Number(iban.slice(4, 9));
  return /^\d{5}$/.test(iban.slice(4, 9)) && iid >= 30000 && iid <= 31999;
}

const TABLE_MODULO_10 = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];

/** Référence QRR : 27 chiffres, le dernier est la clé modulo 10 récursif des 26 premiers. */
export function referenceQrrValide(reference: string): boolean {
  if (!/^\d{27}$/.test(reference)) return false;
  let report = 0;
  for (const c of reference.slice(0, 26)) report = TABLE_MODULO_10[(report + Number(c)) % 10];
  return (10 - report) % 10 === Number(reference[26]);
}

/** Référence créancier SCOR (ISO 11649) : `RF`, deux chiffres de clé, 1 à 21 caractères alphanumériques ; clé modulo 97. */
export function referenceScorValide(reference: string): boolean {
  if (!/^RF\d{2}[0-9A-Z]{1,21}$/.test(reference)) return false;
  return modulo97(reference.slice(4) + reference.slice(0, 4)) === 1;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// QR-facture (SPC)
// ---------------------------------------------------------------------------------------------------------------------------------

// Positions (0 = première ligne) des éléments dans la charge utile. 12 à 18 : créancier final, réservé (vide).
const L = { type: 0, version: 1, codage: 2, iban: 3, cdtr: 4, montant: 18, devise: 19, dbtr: 20, refType: 27, ref: 28, msg: 29, epd: 30, bkg: 31, alt1: 32, alt2: 33 };
const LIGNES_MINIMALES = L.epd + 1;

function adresse(lignes: string[], debut: number): QrAdresse {
  const [type, nom, rue, numero, npa, lieu, pays] = lignes.slice(debut, debut + 7).map(l => (l ?? '').trim());
  return { type: type === 'S' || type === 'K' ? type : '', nom, rue, numero, npa, lieu, pays };
}

const adresseVide = (lignes: string[], debut: number) => lignes.slice(debut, debut + 7).every(l => !(l ?? '').trim());

/** Problèmes d'une adresse (créancier : nom obligatoire ; débiteur : seulement si renseigné). */
function problemesAdresse(a: QrAdresse, brut: string, etiquette: string): string[] {
  const p: string[] = [];
  if (!a.type) p.push(`${etiquette} : type d'adresse « ${brut} » inconnu (S ou K attendu)`);
  if (!a.nom) p.push(`${etiquette} : nom absent`);
  if (!/^[A-Z]{2}$/.test(a.pays)) p.push(`${etiquette} : pays « ${a.pays} » invalide`);
  if (a.type === 'S' && (!a.npa || !a.lieu)) p.push(`${etiquette} : NPA ou lieu absent (adresse structurée)`);
  if (a.type === 'K' && (!a.numero || a.npa || a.lieu)) p.push(`${etiquette} : adresse combinée mal formée (ligne 2 obligatoire, NPA et lieu vides)`);
  return p;
}

/** Montant du QR : `null` si vide, sinon un nombre à 2 décimales au plus, sans séparateur de milliers. `undefined` si illisible. */
function lireMontant(brut: string): number | null | undefined {
  if (!brut) return null;
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(brut)) return undefined;
  return Number(brut);
}

/**
 * Lit le texte d'un QR-facture suisse. Rend `null` si ce n'est pas un SPC. Sinon l'objet, avec `valid` et `problemes` :
 * un QR dont la clé IBAN, la référence ou la forme ne tient pas est `valid: false` et ne confirme rien.
 * Fins de ligne `\n` ou `\r\n`, lignes vides finales tolérées (les lignes vides du milieu sont significatives).
 */
export function parseSwissQr(texte: string): QrFacture | null {
  if (typeof texte !== 'string') return null;
  const lignes = texte.replace(/^﻿/, '').split(/\r?\n/);
  if ((lignes[L.type] ?? '').trim() !== 'SPC') return null;
  while (lignes.length < LIGNES_MINIMALES) lignes.push('');
  const ligne = (i: number) => (lignes[i] ?? '').trim();
  const problemes: string[] = [];

  const version = ligne(L.version);
  if (!/^02\d\d$/.test(version)) problemes.push(`version « ${version} » non prise en charge (02xx attendu)`);
  if (ligne(L.codage) !== '1') problemes.push(`codage « ${ligne(L.codage)} » non pris en charge (1 attendu)`);
  if (texte.split(/\r?\n/).length < LIGNES_MINIMALES) problemes.push(`charge incomplète : ${texte.split(/\r?\n/).length} lignes, ${LIGNES_MINIMALES} au moins`);

  const iban = ligne(L.iban).replace(/\s+/g, '');
  const qrIban = estQrIban(iban);
  if (!ibanValide(iban)) problemes.push(`IBAN « ${iban} » invalide (forme ou clé modulo 97)`);

  const creancier = adresse(lignes, L.cdtr);
  problemes.push(...problemesAdresse(creancier, ligne(L.cdtr), 'créancier'));

  const montant = lireMontant(ligne(L.montant));
  if (montant === undefined) problemes.push(`montant « ${ligne(L.montant)} » illisible`);
  else if (montant !== null && montant <= 0) problemes.push('montant nul ou négatif');

  const devise = ligne(L.devise);
  if (devise !== 'CHF' && devise !== 'EUR') problemes.push(`devise « ${devise} » invalide (CHF ou EUR)`);

  const debiteur = adresseVide(lignes, L.dbtr) ? null : adresse(lignes, L.dbtr);
  if (debiteur) problemes.push(...problemesAdresse(debiteur, ligne(L.dbtr), 'débiteur'));

  const typeReference = ligne(L.refType), reference = ligne(L.ref).replace(/\s+/g, '');
  if (typeReference === 'QRR') {
    if (!qrIban) problemes.push('référence QRR avec un IBAN qui n\'est pas un QR-IBAN');
    if (!referenceQrrValide(reference)) problemes.push(`référence QRR « ${reference} » invalide (27 chiffres, clé modulo 10)`);
  } else if (typeReference === 'SCOR') {
    if (qrIban) problemes.push('référence SCOR avec un QR-IBAN (QRR attendu)');
    if (!referenceScorValide(reference)) problemes.push(`référence SCOR « ${reference} » invalide (ISO 11649)`);
  } else if (typeReference === 'NON') {
    if (qrIban) problemes.push('sans référence (NON) avec un QR-IBAN (QRR attendu)');
    if (reference) problemes.push('type NON mais une référence est donnée');
  } else problemes.push(`type de référence « ${typeReference} » invalide (QRR, SCOR ou NON)`);

  const epd = ligne(L.epd);
  if (epd !== 'EPD') problemes.push(`fin de charge « ${epd} » (EPD attendu)`);

  const infosFacturation = ligne(L.bkg);
  const procedures = [ligne(L.alt1), ligne(L.alt2)].filter(Boolean);

  return {
    version, iban, qrIban, creancier, montant: montant ?? null, devise, debiteur, typeReference, reference,
    message: ligne(L.msg), epd, infosFacturation, procedures, s1: parseSwicoS1(infosFacturation),
    valid: problemes.length === 0, problemes,
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Information de facturation Swico S1
// ---------------------------------------------------------------------------------------------------------------------------------

/** Découpe sur les barres obliques non échappées ; `\x` rend `x` (donc `\/` rend `/` et `\\` rend `\`). */
function decouperS1(texte: string): string[] {
  const morceaux: string[] = [];
  let courant = '';
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (c === '\\' && i + 1 < texte.length) { courant += texte[++i]; continue; }
    if (c === '/') { morceaux.push(courant); courant = ''; continue; }
    courant += c;
  }
  morceaux.push(courant);
  return morceaux;
}

/** AAMMJJ → AAAA-MM-JJ (20AA), `null` si la date du calendrier n'existe pas. */
function dateAammjj(six: string): string | null {
  if (!/^\d{6}$/.test(six)) return null;
  const annee = 2000 + Number(six.slice(0, 2)), mois = Number(six.slice(2, 4)), jour = Number(six.slice(4, 6));
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  if (d.getUTCFullYear() !== annee || d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) return null;
  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

/** Date S1 : 6 chiffres (jour) ou 12 chiffres (période). Une valeur d'une autre forme garde `debut: null` et son brut. */
function dateS1(brut: string): DateS1 {
  if (/^\d{6}$/.test(brut)) return { debut: dateAammjj(brut), fin: null, brut };
  if (/^\d{12}$/.test(brut)) return { debut: dateAammjj(brut.slice(0, 6)), fin: dateAammjj(brut.slice(6)), brut };
  return { debut: null, fin: null, brut };
}

const nombre = (texte: string): number | null => (/^\d+(\.\d+)?$/.test(texte.trim()) ? Number(texte) : null);

/** `8.1` ou `8.1:12.40;2.6:3.00` → liste de taux avec montant éventuel. Une paire illisible est écartée. */
function tauxS1(brut: string): TauxS1[] {
  const sortie: TauxS1[] = [];
  for (const paire of brut.split(';')) {
    const [t, m] = paire.split(':');
    const taux = nombre(t ?? '');
    if (taux === null) continue;
    sortie.push({ taux, montant: m === undefined ? null : nombre(m) });
  }
  return sortie;
}

/** `2:10;0:30` → escompte 2 % à 10 jours, net à 30 jours. Une paire illisible est écartée. */
function conditionsS1(brut: string): ConditionS1[] {
  const sortie: ConditionS1[] = [];
  for (const paire of brut.split(';')) {
    const [e, j] = paire.split(':');
    const escomptePct = nombre(e ?? ''), jours = nombre(j ?? '');
    if (escomptePct !== null && jours !== null && Number.isInteger(jours)) sortie.push({ escomptePct, jours });
  }
  return sortie;
}

/**
 * Lit une information de facturation `//S1/10/…/11/…/20/…/30/…/31/…/32/…/33/…/40/…`. Rend `null` si elle ne commence pas par `//S1`.
 * Les codes inconnus sont gardés bruts dans `inconnus` ; un code répété garde sa première valeur.
 */
export function parseSwicoS1(info: string): SwicoS1 | null {
  if (typeof info !== 'string') return null;
  const texte = info.trim();
  if (!/^\/\/S1(\/|$)/.test(texte)) return null;
  const morceaux = decouperS1(texte.slice(4));
  // « /10/x/11/y » → ['', '10', 'x', '11', 'y'] : le premier morceau est vide, puis code / valeur par paires.
  const champs = new Map<string, string>();
  for (let i = 1; i < morceaux.length; i += 2) {
    const code = morceaux[i];
    if (code && !champs.has(code)) champs.set(code, morceaux[i + 1] ?? '');
  }
  const brut = (code: string) => (champs.has(code) && champs.get(code) !== '' ? champs.get(code)! : null);
  const connus = new Set(['10', '11', '20', '30', '31', '32', '33', '40']);
  const inconnus: Record<string, string> = {};
  for (const [code, valeur] of champs) if (!connus.has(code)) inconnus[code] = valeur;
  const date = brut('11'), prestation = brut('31'), t32 = brut('32'), t33 = brut('33'), c40 = brut('40');
  return {
    numero: brut('10'),
    date: date === null ? null : dateS1(date),
    referenceClient: brut('20'),
    ide: brut('30'),
    prestation: prestation === null ? null : dateS1(prestation),
    tva: t32 === null ? [] : tauxS1(t32),
    tva33: t33 === null ? [] : tauxS1(t33),
    conditions: c40 === null ? [] : conditionsS1(c40),
    inconnus,
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Confrontation à la lecture
// ---------------------------------------------------------------------------------------------------------------------------------

const TOLERANCE_MONTANT = 0.005;

/** Sans casse, accents, espaces ni ponctuation. */
const sansBruit = (texte: string) => (texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** JJ.MM.AAAA (ou AAAA-MM-JJ) → AAAA-MM-JJ ; `null` si illisible ou inexistante. */
function dateLecture(brut: string | undefined): string | null {
  const t = (brut ?? '').trim();
  let m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t), annee: number, mois: number, jour: number;
  if (m) { jour = Number(m[1]); mois = Number(m[2]); annee = Number(m[3]); }
  else if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t))) { annee = Number(m[1]); mois = Number(m[2]); jour = Number(m[3]); }
  else return null;
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  if (d.getUTCFullYear() !== annee || d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) return null;
  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

/** Le début du plus court nom (10 caractères au plus, 3 au moins) se retrouve dans l'autre. */
function nomsCompatibles(a: string, b: string): boolean {
  const [court, long] = a.length <= b.length ? [a, b] : [b, a];
  if (court.length < 3) return false;
  return long.includes(court.slice(0, Math.min(10, court.length)));
}

function champ<T>(qr: T | null, lecture: T | null, egal: (a: T, b: T) => boolean): ChampConfronte<T> {
  if (qr === null) return { statut: 'absent', qr, lecture };
  if (lecture === null) return { statut: 'non-lu', qr, lecture };
  return { statut: egal(qr, lecture) ? 'confirme' : 'contredit', qr, lecture };
}

const absent = <T>(): ChampConfronte<T> => ({ statut: 'absent', qr: null, lecture: null });

/**
 * Dit, champ par champ, ce que le QR confirme ou contredit dans la lecture : `confirme`, `contredit`, `absent` (le QR ne porte pas le
 * champ) ou `non-lu` (la lecture ne l'a pas). Rien n'est remplacé. Un QR absent ou invalide ne confirme ni ne contredit rien.
 * Le montant du QR se compare au TTC lu, et il n'est confirmé que si les devises ne se contredisent pas.
 */
export function confronterQr(qr: QrFacture | null, lecture: LectureQr): ConfrontationQr {
  if (!qr || !qr.valid) {
    return {
      etat: qr ? 'invalide' : 'aucun', problemes: qr ? qr.problemes : [], montant: absent(), devise: absent(), numero: absent(), date: absent(),
      creancier: absent(), iban: null, reference: null, conditions: [], delaiNetJours: null,
    };
  }
  const s1 = qr.s1;
  const deviseLue = sansBruit(lecture.currency ?? '').toUpperCase() || null;
  const devise = champ<string>(qr.devise, deviseLue, (a, b) => a === b);

  const montantLu: number | null = typeof lecture.amountTTC === 'number' && Number.isFinite(lecture.amountTTC) ? lecture.amountTTC : null;
  const montant = champ<number>(qr.montant, montantLu, (a, b) => Math.abs(a - b) < TOLERANCE_MONTANT);
  // Une même somme dans une autre devise n'est pas le même montant.
  if (montant.statut === 'confirme' && devise.statut === 'contredit') montant.statut = 'contredit';

  const numeroQr = s1?.numero ? sansBruit(s1.numero) : null, numeroLu = sansBruit(lecture.invoiceNumber ?? '') || null;
  const numero = champ<string>(numeroQr || null, numeroLu, (a, b) => a === b);
  // Les valeurs rendues gardent leur forme imprimée, la comparaison se fait sur la forme nettoyée.
  numero.qr = numero.statut === 'absent' ? null : s1!.numero;
  numero.lecture = numeroLu === null ? null : lecture.invoiceNumber.trim();

  const dateQr = s1?.date?.debut ?? null, dateLue = dateLecture(lecture.date);
  const date = champ<string>(dateQr, dateLue, (a, b) => a === b);

  const nomQr = sansBruit(qr.creancier.nom) || null, nomLu = sansBruit(lecture.vendor ?? '') || null;
  const creancier = champ<string>(nomQr, nomLu, nomsCompatibles);
  creancier.qr = nomQr === null ? null : qr.creancier.nom;
  creancier.lecture = nomLu === null ? null : lecture.vendor.trim();

  const conditions = s1?.conditions ?? [];
  const net = conditions.find(c => c.escomptePct === 0);
  const type = qr.typeReference as TypeReference;
  return {
    etat: 'valide', problemes: [], montant, devise, numero, date, creancier, iban: qr.iban,
    reference: type !== 'NON' ? { type, valeur: qr.reference } : null, conditions, delaiNetJours: net ? net.jours : null,
  };
}
