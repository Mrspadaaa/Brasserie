import type { AppConfig, Client, Transaction } from '../../types';
import type { FinancialPayment, FinanceLine } from '../../domain/finance/types';
import { prepareFinanceDocument } from '../../services/financeDocuments';
import type { IncomeEntry } from '../../services/incomeEntry';
import {
  invoiceTotals, libelleFacture, preparerQrFacture, problemesAdresse, adresseDepuisTexte, QrFactureInvalide, SwissQrBillService,
  type AdresseStructuree, type Rasteriseur
} from '../../services/swissQrBill';
import { ReceiptService } from '../../services/receiptService';
import { COMPANY_FALLBACK, adresseBrasserie } from '../../domain/companyDefaults';
import { echeanceFacture } from '../../domain/finance/numeroFacture';
import { encoderLigneVente } from './ligneVente';
import { resumePanier, versArticles, type LignePanier } from './panier';

export type ModeVente = 'qr' | 'paye';
export type Echeance = 'reception' | 10 | 30;

export interface EntreeVente {
  mode: ModeVente; lignes: LignePanier[]; client: Client | null; dateIso: string; echeance: Echeance; moyen?: 'twint' | 'cash';
  config: AppConfig; numero: string; rasteriser?: Rasteriseur;
}

/** Une vente prête à être confirmée : aucune écriture n'a eu lieu. Le pdf se partage après l'enregistrement. */
export interface VentePreparee {
  entry: IncomeEntry; pdf: { doc: { save: (nom: string) => unknown; output?: (type: string) => unknown }; dataUrl: string; fileName: string };
  numero: string; totalCents: number; mode: ModeVente;
}

/** L'adresse structurée d'un client : la saisie structurée prime, sinon la chaîne découpée ; `undefined` si elle n'est pas complète (le nom est exclu du contrôle). */
export function debiteurDe(client: Client | null): AdresseStructuree | undefined {
  if (!client) return undefined;
  const lue = client.adresse ?? adresseDepuisTexte(client.address ?? '');
  if (!lue) return undefined;
  const d: AdresseStructuree = { nom: client.name.trim(), rue: lue.rue ?? '', numero: lue.numero ?? '', npa: lue.npa ?? '', localite: lue.localite ?? '', pays: lue.pays || 'CH' };
  return problemesAdresse(d, 'client').length ? undefined : d;
}

const lignesFinance = (lignes: LignePanier[], numero: string, totaux: ReturnType<typeof invoiceTotals>): FinanceLine[] =>
  lignes.map((l, i) => ({
    id: `${numero}-${i}`, description: l.designation.trim(), kind: 'other', quantity: l.quantite, unit: 'pièce',
    unitPriceCents: Math.round((l.prixHT ?? 0) * 100), amountCents: totaux.lines[i].totalCents,
    ...(l.formatId !== 'libre' ? { sourceReference: encoderLigneVente(l.batchId, l.formatId, l.litresUnite) } : {})
  }));

const memeBrassin = (lignes: LignePanier[]): string | undefined => {
  const ids = new Set(lignes.map(l => l.batchId));
  return ids.size === 1 ? [...ids][0] : undefined;
};

/**
 * Le justificatif de l'écriture (le PDF produit). Son contrôle (`prepareFinanceDocument`) parle d'un « justificatif » que le brasseur n'a jamais joint :
 * ici l'échec est dit avec les mots de la caisse, et rien n'a été enregistré.
 */
const justificatif = (id: string, dataUrl: string, nom: string, quoi: 'facture' | 'quittance'): ReturnType<typeof prepareFinanceDocument> => {
  try { return prepareFinanceDocument(id, dataUrl.replace(/^data:application\/pdf;[^,]*base64,/, 'data:application/pdf;base64,'), nom, 'application/pdf'); }
  catch { throw new Error(`La ${quoi} n’a pas pu être produite (PDF trop lourd ou illisible). Rien n’est enregistré : réessaie, ou signale-le si cela se répète.`); }
};

/** Prépare la vente (facture QR ou encaissement). Pure côté données : rien n'est écrit, rien n'est numéroté ailleurs. Lève `QrFactureInvalide` ou une erreur lisible. */
export async function preparerVente(e: EntreeVente): Promise<VentePreparee> {
  const assujetti = e.config.fiscal.isTvaRegistered, taux = e.config.fiscal.tvaNormalRate;
  const items = versArticles(e.lignes, taux);
  const totaux = invoiceTotals(items, assujetti);
  if (totaux.totalCents <= 0) throw new Error('Le total de la vente doit être positif.');
  const resume = resumePanier(e.lignes), nomClient = e.client?.name.trim() || 'Client comptoir';
  const batchId = memeBrassin(e.lignes);
  const base = {
    date: e.dateIso, amountHT: totaux.netCents / 100, amountTTC: totaux.totalCents / 100, tvaAmount: totaux.vatCents / 100,
    tvaRate: assujetti ? taux : 0, category: 'recettes' as const
  };
  const recordedAt = new Date().toISOString();

  if (e.mode === 'qr') {
    if (!e.client) throw new Error('Une facture a besoin d’un client : choisis-en un, ou encaisse ici.');
    const debiteur = debiteurDe(e.client);
    const creancier = adresseBrasserie(e.config.company) ?? { nom: e.config.company.name, rue: '', numero: '', npa: '', localite: '', pays: 'CH' };
    const dueDate = echeanceFacture(e.dateIso, e.echeance);
    const qr = await preparerQrFacture({ iban: e.config.company.iban || COMPANY_FALLBACK.iban, creancier, debiteur, montantCents: totaux.totalCents, numero: e.numero, rasteriser: e.rasteriser });
    const pdf = SwissQrBillService.generateInvoicePdf(e.client, items, e.config, e.numero, { date: e.dateIso, dueDate, download: false, qr, creancier, debiteur });
    const proof = justificatif(`proof-${crypto.randomUUID()}`, pdf.dataUrl, pdf.fileName, 'facture');
    const tx: Transaction = {
      id: e.numero, ...base, description: libelleFacture(e.client.name, items), subcategory: 'Facture client', proofNotes: `Client: ${e.client.name}`,
      proofFileName: pdf.fileName, proofType: 'application/pdf', syncedToDrive: true,
      finance: { version: 1, kind: 'income', amountCents: totaux.totalCents, vendor: e.client.name, invoiceNumber: e.numero, dueDate, paymentStatus: 'unpaid', recordedAt, proofDocumentId: proof.id, ...(batchId ? { batchId } : {}), lines: lignesFinance(e.lignes, e.numero, totaux) }
    };
    return { entry: { transaction: tx, proof }, pdf, numero: e.numero, totalCents: totaux.totalCents, mode: 'qr' };
  }

  if (!e.moyen) throw new Error('Choisis TWINT ou espèces.');
  const id = `REC-${crypto.randomUUID()}`;
  const methode = e.moyen === 'twint' ? 'TWINT' : 'Espèces';
  /* La quittance imprimée porte UNE ligne de résumé et le total (le service A5 ne connaît pas les lignes) ; l'écriture, elle, porte toutes les lignes. */
  const recu = ReceiptService.generateReceiptPdf({ clientName: nomClient, beerName: resume, amountTTC: totaux.totalCents / 100, tvaRate: assujetti ? taux : 0, paymentMethod: methode, date: e.dateIso.split('-').reverse().join('.'), notes: `Règlement : ${methode}`, receiptNumber: id }, e.config);
  const proof = justificatif(`proof-${crypto.randomUUID()}`, recu.dataUrl, recu.fileName, 'quittance');
  const tx: Transaction = {
    id, ...base, description: `Vente ${resume} — ${nomClient}`, subcategory: 'Vente directe', proofNotes: `Client: ${nomClient} · Paiement: ${methode}`,
    proofFileName: proof.fileName, proofType: 'application/pdf', syncedToDrive: true,
    finance: { version: 1, kind: 'income', amountCents: totaux.totalCents, ...(e.client ? { vendor: e.client.name } : {}), paymentStatus: 'paid', recordedAt, proofDocumentId: proof.id, ...(batchId ? { batchId } : {}), lines: lignesFinance(e.lignes, id, totaux) }
  };
  const payment: FinancialPayment = { id: `PAY-${id}`, transactionId: id, date: e.dateIso, amountCents: totaux.totalCents, direction: 'in', method: e.moyen === 'twint' ? 'twint' : 'cash', recordedAt };
  return { entry: { transaction: tx, proof, payment }, pdf: recu, numero: id, totalCents: totaux.totalCents, mode: 'paye' };
}

export { QrFactureInvalide };
