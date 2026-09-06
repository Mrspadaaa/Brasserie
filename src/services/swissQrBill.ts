import { jsPDF } from 'jspdf';
import { ibanOrNotice } from '../domain/companyDefaults';
import { Client, AppConfig } from '../types';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number; // 0.026
}

export const SwissQrBillService = {
  generateInvoicePdf(
    client: Client,
    items: InvoiceItem[],
    config: AppConfig,
    invoiceNumber: string = `FAC-${Date.now().toString().slice(-5)}`
  ) {
    const doc = new jsPDF();

    // Même règle que sur la quittance : pas de ventilation TVA si la brasserie
    // n'est pas assujettie (voir receiptService).
    const assujetti = config?.fiscal?.isTvaRegistered === true;

    // 1. Header
    doc.setFontSize(20);
    doc.setTextColor(217, 119, 6); // Amber brew color
    doc.text("L'Affinée", 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Micro-Brasserie Artisanale", 20, 31);
    doc.text(`${config.company.address}, ${config.company.npa}`, 20, 36);
    doc.text(`UID: ${config.company.uid || 'CHE-xxx.xxx.xxx'}`, 20, 41);

    // 2. Client Box
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.rect(120, 20, 70, 30);
    doc.text(`Client : ${client.name}`, 125, 27);
    if (client.contact) doc.text(`Attn : ${client.contact}`, 125, 33);
    if (client.phone) doc.text(`Tél : ${client.phone}`, 125, 39);
    if (client.email) doc.text(`Email : ${client.email}`, 125, 45);

    // 3. Invoice Meta
    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.text(`FACTURE N° ${invoiceNumber}`, 20, 60);

    const todayStr = new Date().toLocaleDateString('fr-CH');
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Date d'émission : ${todayStr}`, 20, 66);
    doc.text(`Échéance : 30 jours net`, 20, 71);

    // 4. Table Header
    let y = 85;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 5, 170, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(40);
    doc.text('Désignation', 25, y);
    doc.text('Quantité', 105, y);
    doc.text('Prix unitaire HT', 125, y);
    if (assujetti) doc.text('TVA', 155, y);
    doc.text('Total HT', 170, y);

    // 5. Items
    y += 10;
    let totalHT = 0;
    let totalTVA = 0;

    items.forEach((item) => {
      const lineHT = item.quantity * item.unitPriceHT;
      const lineTVA = assujetti ? lineHT * item.tvaRate : 0;
      totalHT += lineHT;
      totalTVA += lineTVA;

      doc.text(item.description, 25, y);
      doc.text(item.quantity.toString(), 110, y);
      doc.text(`${item.unitPriceHT.toFixed(2)} CHF`, 125, y);
      if (assujetti) doc.text(`${(item.tvaRate * 100).toFixed(1)}%`, 155, y);
      doc.text(`${lineHT.toFixed(2)} CHF`, 170, y);
      y += 8;
    });

    const totalTTC = totalHT + totalTVA;

    // 6. Totals Box
    y += 10;
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(10);
    if (assujetti) {
      doc.text('Sous-total HT :', 125, y);
      doc.text(`${totalHT.toFixed(2)} CHF`, 170, y);
      y += 6;
      const tauxAffiche = items[0] ? (items[0].tvaRate * 100).toFixed(1) : '2.6';
      doc.text(`TVA (${tauxAffiche}%) :`, 125, y);
      doc.text(`${totalTVA.toFixed(2)} CHF`, 170, y);
      y += 8;
    } else {
      doc.setFontSize(8);
      doc.text("TVA non applicable (art. 10 al. 2 LTVA)", 125, y);
      doc.setFontSize(10);
      y += 8;
    }
    doc.setFontSize(12);
    doc.setTextColor(217, 119, 6);
    doc.text('TOTAL TTC :', 125, y);
    doc.text(`${totalTTC.toFixed(2)} CHF`, 170, y);

    // 7. Swiss QR-Bill Section (Footer)
    y = 210;
    doc.setDrawColor(180);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(10, y, 200, y); // Tear-off perforated line
    doc.setLineDashPattern([], 0);

    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text('Section paiement (QR-Facture Suisse)', 20, y + 10);

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Compte / Payable à :', 20, y + 20);
    doc.setTextColor(20);
    doc.text(ibanOrNotice(config.company.iban), 20, y + 25);
    doc.text(config.company.name, 20, y + 30);
    doc.text(`${config.company.address}, ${config.company.npa}`, 20, y + 35);

    doc.setTextColor(80);
    doc.text('Payable par :', 20, y + 45);
    doc.setTextColor(20);
    doc.text(client.name, 20, y + 50);

    // Amount box on receipt
    doc.rect(130, y + 20, 60, 25);
    doc.setFontSize(9);
    doc.text('Monnaie   Montant', 135, y + 27);
    doc.setFontSize(13);
    doc.text(`CHF   ${totalTTC.toFixed(2)}`, 135, y + 38);

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("L'Affinée — Villars-sur-Glâne — Santé !", 20, 285);

    // Download
    doc.save(`Facture_${client.name.replace(/\s+/g, '_')}_${invoiceNumber}.pdf`);
  }
};
