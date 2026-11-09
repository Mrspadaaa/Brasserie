import { jsPDF } from 'jspdf';
import type { Data } from 'swissqrbill/types';
import { Client, AppConfig } from '../types';
import { ibanAffiche, ibanCompact, ibanValide } from '../domain/finance/iban';

export interface InvoiceItem { description: string; quantity: number; unitPriceHT: number; tvaRate: number }

/** Adresse structurée (norme SIX IG QR-bill 2.3 : seule l'adresse structurée est permise depuis le 22.11.2025). Pays = code ISO à 2 lettres. */
export interface AdresseStructuree { nom: string; rue: string; numero: string; npa: string; localite: string; pays: string }

/** Une QR-facture prête à poser dans le PDF (voir `preparerQrFacture`). */
export interface QrFacturePrete {
  /** La section paiement 210 × 105 mm en PNG (data URL). */
  png: string;
  svg: string;
  reference: string;
  typeReference: 'QRR' | 'SCOR';
  /** Les données encodées dans le QR (créancier, débiteur, montant, référence). */
  donnees: Data;
}

export interface InvoiceDocumentOptions {
  date?: string; dueDate?: string; download?: boolean;
  /** La section paiement, préparée avant (asynchrone). Sans elle, la facture n'a que l'IBAN en texte et ne prétend rien d'autre. */
  qr?: QrFacturePrete;
  /** Adresses structurées imprimées dans le PDF (brasserie et client). */
  creancier?: AdresseStructuree; debiteur?: AdresseStructuree;
}

/** Erreur de préparation du QR : chaque défaut est un message en français, jamais l'IBAN saisi. */
export class QrFactureInvalide extends Error {
  constructor(public problemes: string[]) { super(problemes.join(' ')); this.name = 'QrFactureInvalide'; }
}

/* ---------- Totaux ---------- */

/** Le net d'une ligne en centimes, arrondi au demi-centime supérieur : le produit flottant est ramené à 6 décimales avant d'arrondir (2,135 CHF = 214 ct, pas 213). */
const centimesNet = (quantite: number, prix: number): number => Math.round(Number((quantite * prix * 100).toFixed(6)));

export function invoiceTotals(items: InvoiceItem[], vatRegistered: boolean) {
  if (!items.length || items.some(item => !item.description.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPriceHT) || item.unitPriceHT < 0 || !Number.isFinite(item.tvaRate) || item.tvaRate < 0 || item.tvaRate > 1)) throw new Error('Chaque ligne doit avoir une désignation, une quantité positive et un prix valide.');
  const lines = items.map(item => { const netCents = centimesNet(item.quantity, item.unitPriceHT); const vatCents = vatRegistered ? Math.round(netCents * item.tvaRate) : 0; return { netCents, vatCents, totalCents: netCents + vatCents }; });
  if (lines.some(l => !Number.isSafeInteger(l.totalCents)) || !Number.isSafeInteger(lines.reduce((n, l) => n + l.totalCents, 0))) throw new Error('Le montant de la facture dépasse la précision autorisée.');
  return { lines, netCents: lines.reduce((n, l) => n + l.netCents, 0), vatCents: lines.reduce((n, l) => n + l.vatCents, 0), totalCents: lines.reduce((n, l) => n + l.totalCents, 0) };
}

/** Le texte du journal : tous les articles (« 24 × Pale Ale 33 cl · 6 × IPA 75 cl »), 140 caractères au plus, « … et N autres » au besoin. */
export function libelleFacture(clientNom: string, items: Pick<InvoiceItem, 'description' | 'quantity'>[]): string {
  const debut = `Facture ${clientNom}`;
  const parts = items.map(i => `${String(i.quantity).replace('.', ',')} × ${i.description.trim()}`);
  if (!parts.length) return debut;
  for (let k = parts.length; k >= 1; k--) {
    const texte = `${debut} — ${parts.slice(0, k).join(' · ')}${k < parts.length ? ` … et ${parts.length - k} autre${parts.length - k > 1 ? 's' : ''}` : ''}`;
    if (texte.length <= 140) return texte;
  }
  return `${debut} — ${parts[0]}`.slice(0, 139) + '…';
}

/* ---------- Adresses ---------- */

/** Valeurs du gabarit de départ (`seedData.initialCompany`) : une adresse bidon lisible par la banque ne doit jamais partir. */
const GABARIT = { localite: /^ville$/i, rue: /exemple/i, nom: /^ma brasserie$/i };

/**
 * Défauts d'une adresse pour la QR-facture, en français. La bibliothèque `swissqrbill` accepte un NPA, une localité ou une rue vides : ce contrôle est le nôtre.
 * Norme 2.3 (§ 4.3.1) : nom, NPA, localité et pays obligatoires ; rue et numéro facultatifs. La brasserie (P7) exige en plus tous les champs et refuse le gabarit.
 */
export function problemesAdresse(a: Partial<AdresseStructuree> | undefined, role: 'brasserie' | 'client'): string[] {
  const de = role === 'brasserie' ? 'de la brasserie' : 'du client';
  const aide = role === 'brasserie' ? ' Complète-la dans les Réglages.' : '';
  const p: string[] = [];
  const v = (s?: string) => (s ?? '').trim();
  if (!v(a?.nom)) p.push(`Le nom ${de} manque.${aide}`); else if (v(a?.nom).length > 70) p.push(`Le nom ${de} dépasse 70 caractères.`);
  if (role === 'brasserie' && !v(a?.rue)) p.push(`La rue ${de} manque.${aide}`);
  if (role === 'brasserie' && !v(a?.numero)) p.push(`Le numéro de rue ${de} manque.${aide}`);
  if (v(a?.rue).length > 70) p.push(`La rue ${de} dépasse 70 caractères.`);
  if (v(a?.numero).length > 16) p.push(`Le numéro de rue ${de} dépasse 16 caractères.`);
  if (!v(a?.npa)) p.push(`Le NPA ${de} manque.${aide}`); else if (v(a?.npa).length > 16) p.push(`Le NPA ${de} dépasse 16 caractères.`);
  if (!v(a?.localite)) p.push(`La localité ${de} manque.${aide}`); else if (v(a?.localite).length > 35) p.push(`La localité ${de} dépasse 35 caractères.`);
  if (!/^[A-Za-z]{2}$/.test(v(a?.pays))) p.push(`Le pays ${de} doit être un code à 2 lettres (CH).${aide}`);
  if (role === 'brasserie' && (GABARIT.localite.test(v(a?.localite)) || GABARIT.rue.test(v(a?.rue)) || GABARIT.nom.test(v(a?.nom)))) p.push('L\'adresse de la brasserie est encore celle du modèle de départ (« Ville », « Exemple », « Ma Brasserie »). Saisis la vraie dans les Réglages.');
  return p;
}

const CASE_POSTALE = /^(case postale|postfach|c\.?\s?p\.?\s)/i;
const RUE_NUMERO = /^(.*\D)[ ,]+(\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?)$/;
const NPA_LOCALITE = /^(\d{4})\s+(.+)$/;

/**
 * Repli pour les données existantes (adresse en une chaîne, « 1700 Fribourg ») : découpe sans inventer, `null` si le texte ne se découpe pas
 * (NPA à 4 chiffres seulement, CH et LI). « Case postale 123 » reste entière dans `rue`. Ne remplace pas le contrôle `problemesAdresse`.
 */
export function adresseDepuisTexte(rue: string, npaLocalite?: string): Omit<AdresseStructuree, 'nom'> | null {
  let texteRue = (rue ?? '').trim(), texteLieu = (npaLocalite ?? '').trim();
  if (npaLocalite === undefined) {
    const coupe = /^(.*?)[,\n]+\s*(\d{4}\s+[^,\n]+)$/s.exec(texteRue);
    if (!coupe) return null;
    texteRue = coupe[1].trim(); texteLieu = coupe[2].trim();
  }
  const lieu = NPA_LOCALITE.exec(texteLieu);
  if (!lieu) return null;
  const numero = !CASE_POSTALE.test(texteRue) ? RUE_NUMERO.exec(texteRue) : null;
  return numero ? { rue: numero[1].trim(), numero: numero[2], npa: lieu[1], localite: lieu[2].trim(), pays: 'CH' } : { rue: texteRue, numero: '', npa: lieu[1], localite: lieu[2].trim(), pays: 'CH' };
}

const lignesAdresse = (a: AdresseStructuree): string[] => [`${a.rue} ${a.numero}`.trim(), `${a.npa} ${a.localite}${a.pays.toUpperCase() !== 'CH' ? ` (${a.pays.toUpperCase()})` : ''}`].filter(l => l.trim());

/* ---------- QR-facture ---------- */

/** Transforme le SVG de la section paiement en PNG (data URL). */
export type Rasteriseur = (svg: string, largeurMm: number, hauteurMm: number) => Promise<string>;

/** Rendu par le canvas du navigateur : fond blanc opaque, 300 ppp (2 480 × 1 240 px), contrôle du PNG rendu (iOS rend parfois un PNG vide sans lever). */
export const rasteriserNavigateur: Rasteriseur = (svg, largeurMm, hauteurMm) => new Promise((resolve, reject) => {
  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof Blob === 'undefined') { reject(new Error('Rendu du QR indisponible hors navigateur.')); return; }
  const ppp = 300, largeur = Math.round(largeurMm / 25.4 * ppp), hauteur = Math.round(hauteurMm / 25.4 * ppp);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const image = new Image();
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas'); canvas.width = largeur; canvas.height = hauteur;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Rendu du QR échoué : canvas indisponible.');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, largeur, hauteur);
      ctx.drawImage(image, 0, 0, largeur, hauteur);
      resolve(canvas.toDataURL('image/png'));
    } catch (e) { reject(e); } finally { URL.revokeObjectURL(url); }
  };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Rendu du QR échoué : le dessin n\'a pas pu être lu.')); };
  image.src = url;
});

export interface EntreeQrFacture {
  iban: string; creancier: AdresseStructuree; debiteur?: AdresseStructuree;
  /** Total TTC en centimes (entier, 1 à 99 999 999 999). */
  montantCents: number; numero: string; langue?: 'FR' | 'DE' | 'IT' | 'EN'; rasteriser?: Rasteriseur;
}

const MONTANT_MAX_CENTS = 99_999_999_999; // 999 999 999,99 : `amount.toFixed(2)` tient en 12 caractères (validateur de swissqrbill)
const MOTIF_NUMERO = /^FAC-(\d{4})-(\d{4,6})$/;

const sansIban = (texte: string, iban: string): string => [iban, ibanAffiche(iban), iban.replace(/^(.{4}).*$/, '$1')].filter(s => s.length >= 4).reduce((t, s) => t.split(s).join('…'), texte);

/**
 * Prépare la section paiement d'une QR-facture suisse. Pure, sans effet : l'appeler deux fois donne le même résultat.
 * Le QR vient de `swissqrbill` (jamais dessiné à la main). Référence : QRR (27 chiffres) avec un QR-IBAN, SCOR (ISO 11649) sinon.
 * Lève `QrFactureInvalide` avec la liste des défauts. Sans débiteur : permis (zone à remplir à la main) ; débiteur incomplet : refusé.
 */
export async function preparerQrFacture(entree: EntreeQrFacture): Promise<QrFacturePrete> {
  const iban = ibanCompact(entree.iban) ?? '';
  const p: string[] = [];
  if (!iban) p.push('IBAN à renseigner dans les Réglages.'); else if (!ibanValide(iban) || !/^(CH|LI)/.test(iban)) p.push('L\'IBAN de la brasserie n\'est pas valide (un IBAN suisse ou liechtensteinois de 21 caractères est attendu).');
  p.push(...problemesAdresse(entree.creancier, 'brasserie'));
  if (entree.debiteur) p.push(...problemesAdresse(entree.debiteur, 'client'));
  if (!Number.isSafeInteger(entree.montantCents) || entree.montantCents < 1 || entree.montantCents > MONTANT_MAX_CENTS) p.push('Le montant doit être un nombre entier de centimes, de 0,01 à 999 999 999,99 CHF.');
  const numero = MOTIF_NUMERO.exec(entree.numero);
  let utils: typeof import('swissqrbill/utils'), svg: typeof import('swissqrbill/svg');
  try { [utils, svg] = await Promise.all([import('swissqrbill/utils'), import('swissqrbill/svg')]); }
  catch { throw new QrFactureInvalide([...p, 'Hors ligne : QR indisponible. Aucune facture sans QR n\'est enregistrée.']); }
  const estQrIban = p.length === 0 && utils.isQRIBAN(iban);
  if (estQrIban && !numero) p.push(`Avec un QR-IBAN, le numéro de facture doit être du type FAC-2026-0001 (chiffres seuls) : « ${entree.numero} » ne convient pas.`);
  if (p.length) throw new QrFactureInvalide(p);

  let reference: string, typeReference: 'QRR' | 'SCOR';
  if (estQrIban) {
    const corps = `${numero![1]}${numero![2]}`.padStart(26, '0');
    reference = corps + utils.calculateQRReferenceChecksum(corps); typeReference = 'QRR';
  } else {
    const corps = entree.numero.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 21);
    reference = `RF${utils.calculateSCORReferenceChecksum(corps)}${corps}`; typeReference = 'SCOR';
  }
  const adresse = (a: AdresseStructuree) => ({ name: a.nom.trim(), address: a.rue.trim(), buildingNumber: a.numero.trim() || undefined, zip: a.npa.trim(), city: a.localite.trim(), country: a.pays.trim().toUpperCase() });
  const donnees: Data = {
    currency: 'CHF', amount: entree.montantCents / 100, reference, message: entree.numero,
    creditor: { account: iban, ...adresse(entree.creancier) },
    ...(entree.debiteur ? { debtor: adresse(entree.debiteur) } : {})
  };
  let image: string;
  try { image = new svg.SwissQRBill(donnees, { language: entree.langue ?? 'FR' }).toString(); }
  catch (e) { throw new QrFactureInvalide([`Données de la QR-facture refusées : ${sansIban((e as Error).message, iban)}`]); }
  const png = await (entree.rasteriser ?? rasteriserNavigateur)(image, 210, 105);
  if (!png.startsWith('data:image/png;base64,') || png.length < 1000) throw new Error('Rendu du QR échoué : image vide.');
  return { png, svg: image, reference, typeReference, donnees };
}

/* ---------- PDF ---------- */

/** Facture PDF (jsPDF). Avec `options.qr`, la section paiement SIX (210 × 105 mm) occupe le bas de la dernière page, ou sa propre page. Sans elle : IBAN en texte seulement. */
export const SwissQrBillService = {
  generateInvoicePdf(client: Client, items: InvoiceItem[], config: AppConfig, invoiceNumber: string, options: InvoiceDocumentOptions = {}) {
    const totals = invoiceTotals(items, config.fiscal.isTvaRegistered);
    /* AM-66 : la facture d'un assujetti porte son numéro de TVA (le numéro UID de la brasserie) ; sans lui elle n'est pas conforme, on ne la fabrique pas. */
    if (config.fiscal.isTvaRegistered && !config.company.uid?.trim()) throw new Error('Brasserie assujettie à la TVA : renseigne son numéro UID (CHE-…) dans les Réglages avant de facturer.');
    const doc = new jsPDF(), clean = (s: string) => s.replace(/[’‘]/g, "'").replace(/[–—]/g, '-');
    let y = 24;
    const line = (text: string, size = 10) => { doc.setFontSize(size); for (const part of doc.splitTextToSize(clean(text), 178)) { if (y > 274) { doc.addPage(); y = 20; } doc.text(part, 16, y); y += size > 13 ? 9 : 5; } };
    doc.setFont('helvetica', 'bold'); line(config.company.name, 21); doc.setFont('helvetica', 'normal');
    if (options.creancier) lignesAdresse(options.creancier).forEach(l => line(l)); else line(`${config.company.address}, ${config.company.npa}`);
    if (config.company.uid) line(config.fiscal.isTvaRegistered ? `N° TVA : ${config.company.uid.trim()} TVA` : `UID : ${config.company.uid}`);
    y += 7; doc.setFont('helvetica', 'bold'); line(`FACTURE ${invoiceNumber}`, 15); doc.setFont('helvetica', 'normal');
    line(`Émission : ${options.date ?? new Date().toLocaleDateString('fr-CH')}`); if (options.dueDate) line(`À payer avant le : ${options.dueDate}`);
    y += 5; line(`Destinataire : ${client.name}`, 12);
    if (options.debiteur) lignesAdresse(options.debiteur).forEach(l => line(l)); else if (client.address?.trim()) line(client.address.trim());
    if (client.contact) line(client.contact); if (client.email) line(client.email); y += 7;
    items.forEach((item, index) => { line(`${index + 1}. ${item.description}`, 11); line(`${item.quantity} x ${item.unitPriceHT.toFixed(2)} CHF${config.fiscal.isTvaRegistered ? ` HT, TVA ${(item.tvaRate * 100).toFixed(1)} %` : ''}    Total ${(totals.lines[index].totalCents / 100).toFixed(2)} CHF`); y += 3; });
    y += 5;
    if (config.fiscal.isTvaRegistered) { line(`Total HT : ${(totals.netCents / 100).toFixed(2)} CHF`); line(`TVA : ${(totals.vatCents / 100).toFixed(2)} CHF`); }
    else line('Entreprise non assujettie : aucune TVA facturée.');
    y += 3; doc.setFont('helvetica', 'bold'); line(`TOTAL À PAYER : ${(totals.totalCents / 100).toFixed(2)} CHF`, 14); doc.setFont('helvetica', 'normal');
    y += 7; line('Règlement par virement bancaire', 12);
    /* Un IBAN illisible ne s'imprime pas : un document d'apparence valable et impayable (voir companyDefaults). */
    line(ibanValide(config.company.iban) ? `IBAN : ${ibanAffiche(config.company.iban)}` : 'Coordonnées bancaires à communiquer au client.');
    line(`Bénéficiaire : ${config.company.name}`); line(`Motif : ${options.qr ? options.qr.reference : invoiceNumber}`);
    if (options.qr) {
      /* Section paiement SIX : 210 × 105 mm au bas de la page (297 - 105 = 192) ; si le texte la recouvrirait, elle prend sa propre page. */
      if (y > 187) doc.addPage();
      doc.addImage(options.qr.png, 'PNG', 0, 192, 210, 105);
    }
    const fileName = `Facture_${invoiceNumber.replace(/[^\w-]/g, '_')}.pdf`;
    const dataUrl = doc.output('datauristring');
    if (options.download !== false) doc.save(fileName);
    return { doc, dataUrl, fileName, totals };
  }
};
