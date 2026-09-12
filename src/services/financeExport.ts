import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { AnnualReport } from '../domain/finance/types';
import { DEPRECIATION_SOURCE } from '../domain/finance/annual';
import { FRIBOURG_TAX_SOURCE } from '../domain/finance/fribourgTax';

const inventoryLabel = (kind: string) => ({raw: 'Matières premières', packaging: 'Emballages', cleaning: 'Nettoyage', 'work-in-progress': 'Bière en cours', finished: 'Bière conditionnée'}[kind] ?? kind);
const categoryLabel = (category: string) => ({brassage: 'Brassage', matériel: 'Matériel', nettoyage: 'Nettoyage', chargesFixes: 'Charges fixes', renovation: 'Local et travaux', divers: 'Autres frais', recettes: 'Ventes', apports: 'Apports privés'}[category] ?? category);
const francs = (value: number | null) => value == null ? 'À compléter' : value / 100;
const money = (value: number | null) => value == null ? 'À compléter' : `${(value / 100).toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`;
const summaryRows = (report: AnnualReport) => [
  ['Ventes et autres produits', report.revenueCents], ['Charges professionnelles hors immobilisations', report.operatingExpensesCents],
  ['Achats immobilisés (hors résultat)', report.capitalPurchasesCents], ['Variation des inventaires', report.inventoryChangeCents],
  ['Amortissements', report.depreciationCents], ['Résultat sur cessions', report.disposalResultCents], ['Ajustements documentés', report.adjustmentCents], ['Résultat préparatoire', report.resultCents],
  ['Encaissements enregistrés (tous flux)', report.receivedCents], ['Décaissements enregistrés (tous flux)', report.paidCents],
  ['Apports privés', report.contributionsCents], ['Prélèvements privés', report.withdrawalsCents],
  ['Trésorerie en fin d’année', report.cashCents], ['Créances suivies', report.receivablesCents], ['Dettes suivies', report.payablesCents],
  ['Immobilisations nettes', report.depreciation.reduce((sum, row) => sum + row.closingCents, 0)]
] as Array<[string, number | null]>;

/** Kept public for verification without writing a file or changing business data. */
export function createAnnualWorkbook(report: AnnualReport, companyName = 'Brasserie'): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const add = (name: string, rows: unknown[][], widths: number[]) => {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = widths.map(wch => ({ wch }));
    if (rows.length > 1 && sheet['!ref']) sheet['!autofilter'] = { ref: sheet['!ref'] };
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };
  add('Synthèse', [['Dossier comptable préparatoire', companyName], ['Exercice', report.year], ['Généré le', report.generatedAt], ['Base', 'Pièces comptables + inventaires et amortissements'], [], ['Poste', 'Montant CHF'], ...summaryRows(report).map(([label, value]) => [label, francs(value)])], [55, 45]);
  add('Journal', [['Pièce', 'Date', 'Description', 'Fournisseur ou client', 'Catégorie', 'Montant TTC CHF', 'Justificatif', 'Référence du document', 'Fichier', 'Origine', 'Lien externe'], ...report.documents.map(row => [row.id, row.date, row.description, row.vendor, categoryLabel(row.category), francs(row.amountCents), row.hasProof ? 'Référencé' : 'Manquant', row.proofDocumentId ?? row.id, row.proofFileName ?? '', row.proofSource ?? '', row.proofUrl ?? ''])], [22, 13, 65, 28, 20, 18, 15, 40, 40, 20, 60]);
  add('Charges', [['Catégorie', 'Charge CHF'], ...report.categories.map(row => [categoryLabel(row.category), francs(row.amountCents)])], [28, 20]);
  add('Amortissements', [['Matériel', 'ID', 'Méthode', 'Taux %', 'Ouverture CHF', 'Acquisitions CHF', 'Dotation CHF', 'Valeur cédée CHF', 'Clôture CHF', 'À vérifier'], ...report.depreciation.map(row => [row.name, row.assetId, row.method === 'linear' ? 'Valeur d’acquisition' : 'Valeur comptable', row.ratePct, francs(row.openingCents), francs(row.additionCents), francs(row.depreciationCents), francs(row.disposalBookValueCents), francs(row.closingCents), row.missing.join(' / ')])], [38, 24, 25, 12, 18, 18, 18, 18, 18, 55]);
  const inventoryRows = (rows: AnnualReport['openingInventory']) => rows.map(row => [row.id, row.name, inventoryLabel(row.kind), row.quantity, row.unit, francs(row.valueCents), row.stockItemRef ?? row.batchId ?? '', row.note ?? '']);
  const headers = ['ID', 'Désignation', 'Nature', 'Quantité', 'Unité', 'Valeur CHF', 'Référence', 'Justification'];
  add('Inventaire ouverture', [headers, ...inventoryRows(report.openingInventory)], [24, 45, 22, 15, 12, 18, 22, 55]);
  add('Inventaire clôture', [headers, ...inventoryRows(report.closingInventory)], [24, 45, 22, 15, 12, 18, 22, 55]);
  add('Ajustements comptables', [['Motif', 'Effet sur résultat CHF', 'Justification'], ...(report.adjustments ?? []).map(a => [a.label, francs(a.amountCents), a.note])], [40, 25, 100]);
  if (report.tax) {
    const tax = report.tax;
    add('Report FriTax', [['Exercice', report.year], ['Instructions vérifiées', tax.sourceYear], ['Source', tax.sourceUrl], ['Périmètre', 'Activité de la brasserie uniquement. Compléter la déclaration personnelle et les annexes officielles.'], [],
      ['Rubrique', 'Code vérifié', 'Montant CHF', 'Destination', 'État', 'Calcul / provenance'], ...tax.fields.map(f => [f.label, f.code ?? 'Non vérifié pour cet exercice', francs(f.amountCents), f.destination, f.ready ? 'Contrôles renseignés — à relire' : 'À compléter avant report', f.explanation])], [45, 25, 20, 80, 40, 100]);
    add('Corrections fiscales', [['Résultat comptable CHF', francs(report.resultCents)], ['Corrections fiscales CHF', francs(tax.correctionCents)], ['Revenu préparé CHF', francs(tax.taxableResultCents)], [], ['Motif', 'Montant CHF', 'Traitement', 'Effet CHF', 'Référence', 'Justification'], ...tax.corrections.map(c => [c.label, francs(c.amountCents), c.treatment === 'included' ? 'Déjà pris en compte' : c.treatment === 'add' ? 'Ajouter' : 'Déduire', francs(c.treatment === 'included' ? 0 : c.amountCents * (c.treatment === 'deduct' ? -1 : 1)), c.sourceId ?? '', c.note])], [45, 22, 26, 22, 30, 100]);
    add('Actifs et passifs', [['État au', `31.12.${report.year}`], ['Total actifs CHF', francs(tax.totalAssetsCents)], ['Total dettes CHF', francs(tax.totalLiabilitiesCents)], ['Patrimoine net comptable CHF', francs(tax.netAssetsCents)], ['Attention', 'Ce patrimoine net ne remplace pas le montant fiscal de l’annexe 05. Un découvert bancaire est classé dans les dettes.'], ['Créances du journal CHF', francs(report.receivablesCents)], ['Dettes du journal CHF', francs(report.payablesCents)], ['Stocks CHF', francs(report.closingInventory.reduce((n, r) => n + r.valueCents, 0))], ['Matériel net CHF', francs(report.depreciation.reduce((n, r) => n + r.closingCents, 0))], [], ['Nature', 'Compte ou tiers', 'Adresse', 'Référence', 'Solde CHF', 'Note'], ...tax.balances.map(b => [balanceLabel(b.kind), b.label, b.address ?? '', b.reference ?? '', francs(b.amountCents), b.note ?? ''])], [35, 40, 55, 35, 25, 100]);
    add('Tiers ouverts', [['Pièce', 'Date', 'Client / fournisseur', 'Adresse', 'Nature', 'Solde CHF', 'Description'], ...tax.outstanding.map(r => [r.id, r.date, r.counterparty, r.address, r.direction === 'in' ? 'Créance' : 'Dette', francs(r.amountCents), r.description])], [25, 15, 40, 60, 20, 20, 70]);
    add('Pièces complémentaires', [['Motif', 'Nature', 'Fichier', 'Document'], ...tax.attachments.map(a => [a.label, a.kind, a.fileName, a.documentId])], [55, 25, 65, 45]);
    add('Contrôles fiscaux', [['Point à compléter'], ...tax.missing.map(s => [s]), ['Situations particulières'], [tax.specialCaseNote ?? 'Aucune note renseignée.'], ['Les fichiers originaux sont disponibles dans le téléchargement du dossier ZIP, sous réserve des erreurs listées dans son index.']], [130]);
  }
  add('Pièces antérieures', [['Référence', 'Date', 'Description', 'Montant CHF', 'Document', 'Fichier', 'Lien'], ...(report.supportingDocuments ?? []).map(r => [r.id, r.date, r.description, francs(r.amountCents), r.proofDocumentId ?? '', r.proofFileName ?? '', r.proofUrl ?? ''])], [25, 15, 60, 25, 45, 60, 70]);
  add('Contrôles et sources', [['Nature', 'Détail'], ...report.missing.map(text => ['À compléter', text]), ...report.notes.map(text => ['Note', text]), ['AFC — amortissements', DEPRECIATION_SOURCE], ['Fribourg — indépendant', 'https://www.fr.ch/impots/personnes-physiques/activite-independante'], ['Conservation', 'Conserver comptes et justificatifs pendant 10 ans. Ce fichier est un dossier préparatoire, pas une déclaration transmise.']], [25, 120]);
  return workbook;
}

const pdfText = (value: unknown) => String(value ?? '').replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/\u202f|\u00a0/g, ' ');
const balanceLabel = (kind: string) => ({ bank: 'Banque', cash: 'Caisse', 'other-asset': 'Autre actif', loan: 'Emprunt', 'other-liability': 'Autre dette' }[kind] ?? kind);
export function createAnnualPdf(report: AnnualReport, companyName = 'Brasserie'): jsPDF {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' }), margin = 15, width = 180;
  let y = 20;
  const newPage = () => { pdf.addPage(); y = 20; };
  const ensure = (height: number) => { if (y + height > 277) newPage(); };
  const paragraph = (text: string, fontSize = 9) => {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(fontSize); pdf.setTextColor(45, 50, 48);
    const lines = pdf.splitTextToSize(pdfText(text), width) as string[];
    for (const line of lines) { ensure(5); pdf.text(line, margin, y); y += 4.8; }
    y += 2;
  };
  const heading = (text: string) => { ensure(28); y += 4; pdf.setTextColor(30, 62, 51); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.text(pdfText(text), margin, y); y += 8; };
  const table = (headers: string[], rows: Array<Array<string | number>>, widths: number[]) => {
    const header = () => {
      ensure(10); pdf.setFillColor(234, 240, 235); pdf.rect(margin, y - 4, width, 8, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(30, 62, 51);
      let x = margin + 2; headers.forEach((text, i) => { pdf.text(pdfText(text), x, y + 1); x += widths[i]; }); y += 9;
    };
    header();
    for (const row of rows) {
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      const cells = row.map((text, i) => pdf.splitTextToSize(pdfText(text), widths[i] - 4) as string[]);
      const lineCount = Math.max(...cells.map(lines => lines.length), 1);
      if (lineCount * 4 + 3 <= 230 && y + lineCount * 4 + 3 > 277) { newPage(); header(); }
      for (let offset = 0; offset < lineCount;) {
        if (y + 7 > 277) { newPage(); header(); }
        const count = Math.min(lineCount - offset, Math.max(1, Math.floor((277 - y - 3) / 4)));
        pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(45, 50, 48);
        let x = margin + 2; cells.forEach((lines, i) => { pdf.text(lines.slice(offset, offset + count), x, y); x += widths[i]; });
        y += count * 4 + 3; offset += count;
        if (offset < lineCount) { newPage(); header(); }
      }
      pdf.setDrawColor(228, 232, 228); pdf.line(margin, y - 3.5, margin + width, y - 3.5);
    }
    y += 3;
  };
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(21); pdf.setTextColor(30, 62, 51); pdf.text(pdfText(companyName).slice(0, 65), margin, y); y += 10;
  paragraph(`Dossier comptable de l'activité indépendante - Exercice ${report.year}`, 12);
  paragraph(`Fribourg | Raison individuelle | Préparé le ${report.generatedAt.slice(0, 10)}`);
  paragraph((report.tax?.missing ?? report.missing).length ? `Dossier à compléter : ${(report.tax?.missing ?? report.missing).length} point(s) signalé(s) dans les contrôles.` : 'Dossier préparatoire à vérifier et signer avant transmission.');
  heading('Compte de résultat et flux');
  table(['Poste', 'CHF'], summaryRows(report).map(([label, value]) => [label, money(value)]), [133, 47]);
  heading('Méthode et limites'); report.notes.forEach(note => paragraph(note));
  if (report.tax) {
    const tax = report.tax;
    newPage();
    heading('Montants à reporter dans FriTax');
    paragraph(`Exercice ${report.year}. Instructions vérifiées : ${tax.sourceYear}. ${tax.mappingVerified ? '' : 'Codes non vérifiés pour cet exercice : ne pas les reprendre automatiquement.'}`);
    table(['Rubrique / destination', 'CHF', 'État'], tax.fields.map(f => [`${f.code ? `Code ${f.code} - ` : ''}${f.label}\n${f.destination}\n${f.explanation}`, money(f.amountCents), f.ready ? 'Contrôles renseignés, à relire' : 'À compléter avant report']), [113, 30, 37]);
    paragraph('La déclaration personnelle et les annexes officielles restent à compléter. Ce document ne transmet aucune déclaration.');
    heading('Passage du résultat comptable au revenu préparé');
    table(['Poste', 'CHF'], [['Résultat comptable', money(report.resultCents)], ['Corrections fiscales documentées', money(tax.correctionCents)], ['Revenu préparé', money(tax.taxableResultCents)]], [138, 42]);
    if (tax.corrections.length) table(['Correction et justification', 'Effet CHF'], tax.corrections.map(c => [`${c.label}\n${c.note}${c.sourceId ? `\nReference : ${c.sourceId}` : ''}${c.treatment === 'included' ? '\nDeja pris en compte dans les comptes' : ''}`, money(c.treatment === 'included' ? 0 : c.amountCents * (c.treatment === 'deduct' ? -1 : 1))]), [138, 42]);
    heading(`État des actifs et passifs au 31.12.${report.year}`);
    table(['Poste', 'CHF'], [['Comptes et caisse (avoirs positifs)', money(tax.balances.filter(b => b.kind === 'cash' || b.kind === 'bank').reduce((n, b) => n + Math.max(0, b.amountCents), 0))], ['Créances du journal', money(report.receivablesCents)], ['Stocks (detail dans les inventaires)', money(report.closingInventory.reduce((n, r) => n + r.valueCents, 0))], ['Matériel net', money(report.depreciation.reduce((n, r) => n + r.closingCents, 0))], ['Total actifs, autres actifs inclus', money(tax.totalAssetsCents)], ['Total dettes, emprunts et découverts inclus', money(tax.totalLiabilitiesCents)], ['Patrimoine net comptable', money(tax.netAssetsCents)]], [138, 42]);
    paragraph('Le patrimoine net comptable ne remplace pas le montant de fortune mobiliere déterminé dans l’annexe 05. Ne pas declarer deux fois un compte, un titre ou une dette.');
    if (tax.balances.length) table(['Compte / tiers et reference', 'Nature', 'CHF'], tax.balances.map(b => [`${b.label}\n${b.address ?? ''}\n${b.reference ?? ''}\n${b.note ?? ''}`, balanceLabel(b.kind), money(b.amountCents)]), [105, 33, 42]);
    heading('Clients et fournisseurs encore ouverts');
    if (tax.outstanding.length) table(['Tiers et piece', 'Nature', 'Solde CHF'], tax.outstanding.map(r => [`${r.counterparty || 'Nom à compléter'}\n${r.address || 'Adresse à compléter'}\n${r.date} - ${r.id}\n${r.description}`, r.direction === 'in' ? 'Créance' : 'Dette', money(r.amountCents)]), [105, 33, 42]);
    else paragraph('Aucune créance ni dette suivie dans le journal. Les paiements inconnus restent signales dans les controles.');
    heading('Contrôles fiscaux et pieces complémentaires');
    if (tax.missing.length) tax.missing.forEach(s => paragraph(s)); else paragraph('Contrôles renseignés. Relire et signer les comptes ; verifier les originaux et les pieces demandees dans FriTax.');
    if (tax.specialCaseNote) paragraph(`Situations particulières : ${tax.specialCaseNote}`);
    if (tax.attachments.length) table(['Piece', 'Fichier et reference'], tax.attachments.map(a => [a.label, `${a.fileName}\n${a.documentId}`]), [65, 115]);
  }
  heading('Contrôles comptables');
  if (report.missing.length) report.missing.forEach((text, index) => paragraph(`${index + 1}. ${text}`)); else paragraph('Aucune anomalie comptable détectée par ces contrôles. Les contrôles fiscaux figurent séparément.');
  heading('Tableau des amortissements');
  if (report.depreciation.length) table(['Matériel', 'Ouverture + achats', 'Dotation', 'Clôture'], report.depreciation.map(row => [`${row.name.slice(0, 100)}\n${row.method === 'linear' ? 'Linéaire' : 'Dégressif'} - ${row.ratePct}%`, money(row.openingCents + row.additionCents), money(row.depreciationCents), money(row.closingCents)]), [69, 37, 37, 37]);
  else paragraph('Aucune immobilisation enregistrée.');
  for (const [label, rows] of [['Inventaire au début de l’exercice', report.openingInventory], ['Inventaire au terme de l’exercice', report.closingInventory]] as const) {
    heading(label);
    if (rows.length) table(['Désignation', 'Nature', 'Quantité', 'Valeur CHF'], rows.map(row => [row.name.slice(0, 100), inventoryLabel(row.kind), `${row.quantity} ${row.unit}`, money(row.valueCents)]), [70, 38, 32, 40]);
    else paragraph('Inventaire vide. Sa confirmation explicite figure dans les contrôles du dossier.');
  }
  heading('Index des pièces');
  const indexed = [...report.documents, ...(report.supportingDocuments ?? [])];
  if (indexed.length) {
    paragraph('Les originaux sont conservés dans l’app ou à l’adresse indiquée. Cet index en fige les références ; il ne joint pas les fichiers au PDF.');
    table(['Date / pièce', 'Description et justificatif', 'TTC CHF'], indexed.map(row => [`${row.date}\n${row.id}`, `${row.description}\n${row.hasProof ? `Document : ${row.proofDocumentId ?? row.id}\n${row.proofFileName ?? 'Fichier lié à la pièce'}${row.proofUrl ? `\n${row.proofUrl}` : ''}` : row.required === false ? 'Voir les relevés de compte' : 'Justificatif manquant'}`, money(row.amountCents)]), [44, 97, 39]);
  }
  else paragraph('Aucune pièce comptable pour cet exercice.');
  if (report.adjustments?.length) { heading('Justification des ajustements comptables'); table(['Motif et justification', 'Effet CHF'], report.adjustments.map(a => [`${a.label}\n${a.note}`, money(a.amountCents)]), [138, 42]); }
  heading('Sources et signature');
  paragraph(`Instructions FriTax : ${FRIBOURG_TAX_SOURCE.url} (période vérifiée : ${FRIBOURG_TAX_SOURCE.year}). Pieces : ${FRIBOURG_TAX_SOURCE.attachments}`);
  paragraph('AFC, notice A/1995 : catégories et taux usuels d’amortissement, à qualifier selon le bien. Fribourg : activité indépendante, comptes et annexe 05. Conserver les comptes et justificatifs pendant 10 ans.');
  ensure(10); pdf.setTextColor(30, 62, 51); pdf.setFontSize(9); pdf.textWithLink('Notice AFC sur les amortissements', margin, y, { url: DEPRECIATION_SOURCE }); y += 6;
  pdf.textWithLink('Fribourg : activité indépendante', margin, y, { url: 'https://www.fr.ch/impots/personnes-physiques/activite-independante' }); y += 12;
  paragraph('Lieu et date : _______________________    Signature : _______________________');
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) { pdf.setPage(page); pdf.setFontSize(8); pdf.setTextColor(105); pdf.text(`Dossier preparatoire ${report.year} - ${page} / ${pages}`, margin, 289); }
  return pdf;
}
export function exportAnnualReport(report: AnnualReport, companyName = 'Brasserie', format: 'pdf' | 'xlsx' = 'pdf'): void {
  const filename = `Comptabilite_${report.year}_${report.generatedAt.slice(0, 10)}`;
  if (format === 'xlsx') XLSX.writeFile(createAnnualWorkbook(report, companyName), `${filename}.xlsx`);
  else createAnnualPdf(report, companyName).save(`${filename}.pdf`);
}
export const FinanceExport = { exportAnnualReport, createAnnualWorkbook, createAnnualPdf };
