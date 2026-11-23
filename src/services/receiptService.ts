import { jsPDF } from 'jspdf';
import { COMPANY_FALLBACK, ibanOrNotice } from '../domain/companyDefaults';
import { Transaction, AppConfig } from '../types';

export interface ReceiptOptions {
  clientName: string;
  beerName: string;
  amountTTC: number;
  tvaRate: number; // Authoritative document rate; normal rate for a new alcoholic beer sale.
  paymentMethod: 'TWINT' | 'Espèces' | 'Virement' | 'Facture';
  date?: string;
  notes?: string;
  receiptNumber?: string;
}

export const ReceiptService = {
  generateReceiptPdf(
    options: ReceiptOptions,
    config?: AppConfig
  ): { doc: jsPDF; dataUrl: string; fileName: string } {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5' // A5 is standard professional receipt/quittance format in Switzerland
    });

    // ⚠️ Ces replis étaient écrits en clair — nom légal, numéro CHE et IBAN.
    // Ils vivent désormais hors du code : voir `domain/companyDefaults.ts`.
    const companyName = config?.company?.name || COMPANY_FALLBACK.name;
    const companyOwner = config?.company?.owner || COMPANY_FALLBACK.owner;
    const address = config?.company?.address || COMPANY_FALLBACK.address;
    const npa = config?.company?.npa || COMPANY_FALLBACK.npa;
    const uid = config?.company?.uid || COMPANY_FALLBACK.uid;
    const iban = ibanOrNotice(config?.company?.iban);

    const dateStr = options.date || new Date().toLocaleDateString('fr-CH');
    const receiptNum = options.receiptNumber || `QUITTANCE-${Date.now().toString().slice(-6)}`;
    const fileName = `Quittance_${options.clientName.replace(/\s+/g, '_')}_${options.amountTTC.toFixed(2)}CHF.pdf`;

    // Assujettissement TVA : sous le seuil de chiffre d'affaires, la brasserie
    // n'est PAS assujettie. Faire figurer une ventilation TVA sur une quittance
    // dans ce cas laisse croire au client qu'il peut la récupérer, et expose la
    // brasserie à devoir verser une taxe qu'elle a facturée sans y être tenue.
    const assujetti = config?.fiscal?.isTvaRegistered === true;
    const effectiveTvaRate = assujetti ? options.tvaRate : 0;
    const ht = assujetti
      ? Math.round((options.amountTTC / (1 + effectiveTvaRate)) * 100) / 100
      : options.amountTTC;
    const tva = Math.round((options.amountTTC - ht) * 100) / 100;

    // --- 1. HEADER & LOGO ---
    doc.setFillColor(245, 158, 11); // Amber 500
    doc.rect(0, 0, 148, 6, 'F');

    doc.setFontSize(18);
    doc.setTextColor(217, 119, 6); // Amber 600
    doc.text("L'Affinée", 15, 20);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Micro-Brasserie Artisanale", 15, 25);
    doc.text(`${address} · ${npa}`, 15, 29);
    doc.text(`UID : ${uid} · Tél : +41 79 000 00 00`, 15, 33);

    // --- 2. QUITTANCE BADGE ---
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(88, 14, 45, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("JUSTIFICATIF DE VENTE", 92, 20);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(receiptNum, 92, 26);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Date : ${dateStr}`, 92, 31);

    // --- 3. CLIENT & RÈGLEMENT BOX ---
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 42, 118, 20, 2, 2, 'D');

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Bénéficiaire / Client :", 20, 49);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(options.clientName || 'Client Comptoir', 55, 49);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Mode de règlement :", 20, 56);
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(options.paymentMethod === 'Facture' ? 'Facture (À régler)' : `✓ ${options.paymentMethod} (Encaissé)`, 55, 56);

    // --- 4. ARTICLES TABLE ---
    let y = 72;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 118, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("DÉSIGNATION", 18, y + 5);
    if (assujetti) doc.text("TAUX TVA", 85, y + 5);
    doc.text(assujetti ? "TOTAL TTC" : "MONTANT", 112, y + 5);

    y += 12;
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Bière artisanale : ${options.beerName}`, 18, y);
    doc.setFontSize(9);
    doc.setTextColor(100);
    if (assujetti) doc.text(`${(effectiveTvaRate * 100).toFixed(1)}%`, 85, y);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${options.amountTTC.toFixed(2)} CHF`, 112, y);

    if (options.notes) {
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(options.notes, 18, y);
    }

    // --- 5. TOTALS SUMMARY ---
    y += 15;
    doc.line(15, y, 133, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(100);
    if (assujetti) {
      doc.text("Montant Hors Taxe (HT) :", 75, y);
      doc.text(`${ht.toFixed(2)} CHF`, 112, y);
      y += 5;
      doc.text(`TVA suisse (${(effectiveTvaRate * 100).toFixed(1)}%) :`, 75, y);
      doc.text(`${tva.toFixed(2)} CHF`, 112, y);
    } else {
      doc.text("Montant total :", 75, y);
      doc.text(`${options.amountTTC.toFixed(2)} CHF`, 112, y);
      y += 5;
      doc.setFontSize(7.5);
      doc.text("TVA non applicable (art. 10 al. 2 LTVA)", 75, y);
    }

    y += 7;
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.roundedRect(72, y - 4, 61, 9, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text(options.paymentMethod === 'Facture' ? 'TOTAL À RÉGLER :' : 'TOTAL ENCAISSÉ :', 75, y + 2);
    doc.text(`${options.amountTTC.toFixed(2)} CHF`, 112, y + 2);

    // --- 6. FOOTER LEGAL & SWISS QR READY ---
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text(
      options.paymentMethod === 'Facture' ? 'Justificatif de vente à régler. Le paiement reste à confirmer.' : assujetti
        ? "Quittance de paiement pour les articles et les montants indiqués."
        : "Quittance de paiement. Entreprise non assujettie à la TVA — aucune TVA n'est facturée ni récupérable.",
      74,
      175,
      { align: 'center' }
    );
    doc.text(
      `Brasserie L'Affinée · ${companyOwner} · IBAN : ${iban}`,
      74,
      179,
      { align: 'center' }
    );

    const dataUrl = doc.output('dataurlstring');
    return { doc, dataUrl, fileName };
  },

  downloadReceipt(options: ReceiptOptions, config?: AppConfig) {
    const { doc, fileName } = this.generateReceiptPdf(options, config);
    doc.save(fileName);
  },

  createSaleTransactionWithReceipt(
    options: ReceiptOptions,
    config?: AppConfig,
    uploadedProofUrl?: string
  ): Transaction {
    const newSaleOptions = { ...options, tvaRate: config?.fiscal?.isTvaRegistered ? config.fiscal.tvaNormalRate : 0 };
    const { dataUrl, fileName } = this.generateReceiptPdf(newSaleOptions, config);
    // L'écriture comptable doit refléter EXACTEMENT ce qui est imprimé sur la
    // quittance : sans assujettissement, ni TVA sur le papier ni TVA en compta.
    const assujetti = config?.fiscal?.isTvaRegistered === true;
    const rate = assujetti ? newSaleOptions.tvaRate : 0;
    const ht = assujetti
      ? Math.round((options.amountTTC / (1 + rate)) * 100) / 100
      : options.amountTTC;
    const tva = Math.round((options.amountTTC - ht) * 100) / 100;

    return {
      id: `REC-${Date.now()}`,
      date: options.date || new Date().toLocaleDateString('fr-CH'),
      description: `Vente ${options.beerName} — ${options.clientName}`,
      amountHT: ht,
      tvaRate: rate,
      tvaAmount: tva,
      amountTTC: options.amountTTC,
      category: 'recettes',
      subcategory: 'Vente directe',
      proofNotes: `Client: ${options.clientName} · Paiement: ${options.paymentMethod}`,
      proofUrl: uploadedProofUrl || dataUrl, // uses uploaded image or generated PDF receipt
      proofFileName: uploadedProofUrl ? 'justificatif_paiement.jpg' : fileName,
      proofType: uploadedProofUrl ? 'image/jpeg' : 'application/pdf',
      syncedToDrive: false
    };
  }
};
