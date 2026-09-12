import { jsPDF } from 'jspdf';
import { Client, AppConfig } from '../types';

export interface InvoiceItem { description: string; quantity: number; unitPriceHT: number; tvaRate: number }
export interface InvoiceDocumentOptions { date?: string; dueDate?: string; download?: boolean }
export function invoiceTotals(items: InvoiceItem[], vatRegistered: boolean) {
  if (!items.length || items.some(item => !item.description.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPriceHT) || item.unitPriceHT < 0 || !Number.isFinite(item.tvaRate) || item.tvaRate < 0 || item.tvaRate > 1)) throw new Error('Chaque ligne doit avoir une désignation, une quantité positive et un prix valide.');
  const lines = items.map(item => { const netCents = Math.round(item.quantity * item.unitPriceHT * 100); const vatCents = vatRegistered ? Math.round(netCents * item.tvaRate) : 0; return { netCents, vatCents, totalCents: netCents + vatCents }; });
  if (lines.some(l => !Number.isSafeInteger(l.totalCents)) || !Number.isSafeInteger(lines.reduce((n, l) => n + l.totalCents, 0))) throw new Error('Le montant de la facture dépasse la précision autorisée.');
  return { lines, netCents: lines.reduce((n, l) => n + l.netCents, 0), vatCents: lines.reduce((n, l) => n + l.vatCents, 0), totalCents: lines.reduce((n, l) => n + l.totalCents, 0) };
}
/** Plain invoice with bank-transfer instructions. No decorative or non-functional payment QR. */
export const SwissQrBillService = {
  generateInvoicePdf(client: Client, items: InvoiceItem[], config: AppConfig, invoiceNumber = `FAC-${crypto.randomUUID().slice(0, 8)}`, options: InvoiceDocumentOptions = {}) {
    const totals = invoiceTotals(items, config.fiscal.isTvaRegistered);
    const doc = new jsPDF(), clean = (s: string) => s.replace(/[’‘]/g, "'").replace(/[–—]/g, '-');
    let y = 24;
    const line = (text: string, size = 10) => { doc.setFontSize(size); for (const part of doc.splitTextToSize(clean(text), 178)) { if (y > 274) { doc.addPage(); y = 20; } doc.text(part, 16, y); y += size > 13 ? 9 : 5; } };
    doc.setFont('helvetica', 'bold'); line(config.company.name, 21); doc.setFont('helvetica', 'normal');
    line(`${config.company.address}, ${config.company.npa}`); if (config.company.uid) line(`UID : ${config.company.uid}`);
    y += 7; doc.setFont('helvetica', 'bold'); line(`FACTURE ${invoiceNumber}`, 15); doc.setFont('helvetica', 'normal');
    line(`Émission : ${options.date ?? new Date().toLocaleDateString('fr-CH')}`); if (options.dueDate) line(`À payer avant le : ${options.dueDate}`);
    y += 5; line(`Destinataire : ${client.name}`, 12); if (client.contact) line(client.contact); if (client.email) line(client.email); y += 7;
    items.forEach((item, index) => { line(`${index + 1}. ${item.description}`, 11); line(`${item.quantity} x ${item.unitPriceHT.toFixed(2)} CHF${config.fiscal.isTvaRegistered ? ` HT, TVA ${(item.tvaRate * 100).toFixed(1)} %` : ''}    Total ${(totals.lines[index].totalCents / 100).toFixed(2)} CHF`); y += 3; });
    y += 5;
    if (config.fiscal.isTvaRegistered) { line(`Total HT : ${(totals.netCents / 100).toFixed(2)} CHF`); line(`TVA : ${(totals.vatCents / 100).toFixed(2)} CHF`); }
    else line('Entreprise non assujettie : aucune TVA facturée.');
    y += 3; doc.setFont('helvetica', 'bold'); line(`TOTAL À PAYER : ${(totals.totalCents / 100).toFixed(2)} CHF`, 14); doc.setFont('helvetica', 'normal');
    y += 7; line('Règlement par virement bancaire', 12);
    line(config.company.iban?.trim() ? `IBAN : ${config.company.iban.trim()}` : 'Coordonnées bancaires à communiquer au client.');
    line(`Bénéficiaire : ${config.company.name}`); line(`Motif : ${invoiceNumber}`);
    const fileName = `Facture_${invoiceNumber.replace(/[^\w-]/g, '_')}.pdf`;
    const dataUrl = doc.output('datauristring');
    if (options.download !== false) doc.save(fileName);
    return { doc, dataUrl, fileName, totals };
  }
};
