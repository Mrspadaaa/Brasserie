import { Zip, ZipPassThrough, strToU8 } from 'fflate';
import * as XLSX from 'xlsx';
import type { AnnualDocument, AnnualReport, FinanceTransaction } from '../domain/finance/types';
import { isoDate, transactionAmount } from '../domain/finance/ledger';
import { FRIBOURG_TAX_SOURCE } from '../domain/finance/fribourgTax';
import { createAnnualPdf, createAnnualWorkbook } from './financeExport';
import { prepareFinanceDocument } from './financeDocuments';

type Original = { dataUrl: string; fileName: string; mimeType: string };
export interface TaxManifestEntry {
  id: string; label: string; source: string; required: boolean;
  status: 'included' | 'missing' | 'external' | 'unavailable' | 'optional';
  path?: string; bytes?: number; sha256?: string; detail?: string;
}
export interface TaxArchiveResult {
  blob: Blob; fileName: string; entries: TaxManifestEntry[];
  totalDocuments: number; nextIndex: number | null; missingCount: number;
}
const extensions: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export function originalBytes(original: Original): Uint8Array {
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(original.dataUrl);
  if (!match || match[1] !== original.mimeType || !extensions[original.mimeType]) throw Error('Format du fichier non reconnu.');
  const binary = atob(match[2]);
  if (binary.length > 4 * 1024 * 1024) throw Error('Le fichier dépasse 4 Mo.');
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const start = String.fromCharCode(...bytes.slice(0, 12));
  const recognized = original.mimeType === 'application/pdf' ? start.startsWith('%PDF-') && new TextDecoder().decode(bytes.slice(-2048)).includes('%%EOF')
    : original.mimeType === 'image/png' ? bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
    : original.mimeType === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217
    : start.startsWith('RIFF') && start.slice(8, 12) === 'WEBP';
  if (!recognized) throw Error('Le contenu ne correspond pas à un PDF ou une image reconnus. Ouvrir et remplacer le justificatif.');
  return bytes;
}
export async function prepareTaxAttachment(file: File) {
  if (file.size > 4 * 1024 * 1024) throw Error('Choisis un justificatif de 4 Mo maximum.');
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(Error('Lecture du fichier impossible.')); reader.readAsDataURL(file); });
  originalBytes({ dataUrl, fileName: file.name, mimeType: file.type });
  return prepareFinanceDocument(`TAXDOC-${crypto.randomUUID()}`, dataUrl, file.name, file.type);
}
function safeName(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'piece';
}
export async function createTaxArchive(input: {
  report: AnnualReport; companyName: string; transactions: FinanceTransaction[]; frozen?: boolean;
  startIndex?: number; volume?: number; maxOriginalBytes?: number;
  loadDocument?: (id: string) => Promise<Original>;
  onProgress?: (done: number, total: number) => void; signal?: AbortSignal;
}): Promise<TaxArchiveResult> {
  const { report } = input, startIndex = input.startIndex ?? 0, volume = input.volume ?? 1;
  const all: Array<{ row: AnnualDocument; source: string }> = [...report.documents.map(row => ({ row, source: 'journal' })), ...(report.supportingDocuments ?? []).map(row => ({ row, source: 'anterieur' })),
    ...(report.tax?.attachments ?? []).map(a => ({ row: { id: a.id, description: a.label, date: '', amountCents: 0, category: a.kind, vendor: '', hasProof: true, required: true, proofDocumentId: a.documentId, proofFileName: a.fileName, proofSource: 'document' as const }, source: 'complement' }))];
  if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex > all.length) throw Error('Volume de justificatifs invalide.');
  const entries: TaxManifestEntry[] = [], chunks: BlobPart[] = [];
  let zipError: Error | null = null;
  const zip = new Zip((error, data) => { if (error) zipError = error; else chunks.push(data.slice().buffer as ArrayBuffer); });
  const add = (path: string, bytes: Uint8Array) => { const entry = new ZipPassThrough(path); zip.add(entry); entry.push(bytes, true); };
  const load = input.loadDocument ?? (async id => (await import('./financeDocuments')).loadFinanceDocument(id));
  const maximum = input.maxOriginalBytes ?? 64 * 1024 * 1024;
  if (!Number.isFinite(maximum) || maximum <= 0) throw Error('Taille de volume invalide.');
  let size = 0, nextIndex: number | null = null;
  for (let index = startIndex; index < all.length; index++) {
    if (input.signal?.aborted) throw Error('Téléchargement annulé.');
    // Volumes keep memory bounded on a phone. Every remaining reference is resumed explicitly.
    if (size >= maximum) { nextIndex = index; break; }
    const { row, source } = all[index];
    const item: TaxManifestEntry = { id: row.id, label: row.description, source, required: row.required !== false, status: 'missing' };
    try {
      if (!row.hasProof) { item.status = item.required ? 'missing' : 'optional'; item.detail = item.required ? 'Aucun justificatif lié.' : 'Mouvement privé : justificatif éventuel dans les relevés bancaires.'; }
      else if (row.proofSource === 'external' || row.proofUrl && !row.proofDocumentId) { item.status = 'external'; item.detail = row.proofUrl || 'Lien externe : ajouter le fichier original dans l’app.'; }
      else {
        let original: Original;
        if (row.proofDocumentId) original = await load(row.proofDocumentId);
        else {
          if (input.frozen) throw Error('Ancienne version sans original figé. Préparer une nouvelle version pour joindre le fichier actuel.');
          const tx = input.transactions.find(t => t.id === row.id);
          if (!tx?.proofUrl?.startsWith('data:') || isoDate(tx.date) !== row.date || transactionAmount(tx) !== row.amountCents) throw Error('La pièce a changé ou son original est indisponible. Actualiser le dossier.');
          original = { dataUrl: tx.proofUrl, fileName: tx.proofFileName ?? row.id, mimeType: /^data:([^;]+)/.exec(tx.proofUrl)?.[1] ?? '' };
        }
        const bytes = originalBytes(original);
        const hash = await crypto.subtle.digest('SHA-256', bytes.slice().buffer as ArrayBuffer);
        item.sha256 = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
        item.path = `justificatifs/${source}/${String(index + 1).padStart(5, '0')}-${safeName(row.date)}-${safeName(row.description)}.${extensions[original.mimeType]}`;
        item.bytes = bytes.length; item.status = 'included';
        add(item.path, bytes); size += bytes.length;
      }
    } catch (error) {
      // An expired login affects every Drive file. Let the user reconnect and
      // retry this volume instead of downloading a misleading empty dossier.
      if ((error as { code?: string })?.code === 'drive/auth-required') throw error;
      item.status = 'unavailable'; item.detail = error instanceof Error ? error.message : 'Fichier indisponible.';
    }
    entries.push(item); input.onProgress?.(index + 1, all.length);
  }
  if (input.signal?.aborted) throw Error('Téléchargement annulé.');
  const missingCount = entries.filter(e => e.required && e.status !== 'included').length;
  const checkList = report.tax?.missing ?? report.missing;
  const notice = [
    `${input.companyName} - exercice ${report.year} - volume ${volume}`,
    `Chiffres établis le ${report.generatedAt}. ${input.frozen ? 'Version figée.' : 'Brouillon : les chiffres peuvent encore changer.'}`,
    `${entries.filter(e => e.status === 'included').length} fichier(s) joint(s). ${missingCount} pièce(s) requise(s) non jointe(s) dans ce volume.`,
    nextIndex != null ? `SUITE NECESSAIRE : ${all.length - nextIndex} référence(s) restante(s). Télécharger le volume suivant dans l’app.` : 'Fin des références de cette année.',
    'Ce ZIP est votre archive. Extraire les PDF et justificatifs demandés avant de les joindre dans FriTax ; le ZIP ne se transmet pas comme une déclaration.',
    'Le contrôle vérifie la récupération, le format et une empreinte SHA-256. Il ne certifie pas la lisibilité, le contenu fiscal ni l’exhaustivité des documents que vous détenez.',
    'La FAQ FriTax indique une limite de 3 Mo par pièce jointe. Conserver les originaux ; préparer une copie adaptée si nécessaire.',
    'Vérifier et signer les comptes selon le mode de dépôt. Conserver comptes et justificatifs pendant 10 ans.',
    'La déclaration personnelle (autres revenus, famille, patrimoine privé, prévoyance) reste à compléter. Aucun envoi fiscal n’est effectué par cette archive.',
    `Instructions : ${FRIBOURG_TAX_SOURCE.url}`, `Pièces à joindre : ${FRIBOURG_TAX_SOURCE.attachments}`,
    '', 'POINTS A COMPLETER', ...checkList.map(s => `- ${s}`), '', 'JUSTIFICATIFS NON JOINTS', ...entries.filter(e => e.status !== 'included').map(e => `- ${e.id} : ${e.label} : ${e.detail}`)
  ].join('\r\n');
  add('LIRE-MOI.txt', strToU8(notice));
  add('Comptes-annuels.pdf', new Uint8Array(createAnnualPdf(report, input.companyName).output('arraybuffer')));
  add('Comptes-et-reports.xlsx', new Uint8Array(XLSX.write(createAnnualWorkbook(report, input.companyName), { type: 'array', bookType: 'xlsx' })));
  add('rapport.json', strToU8(JSON.stringify(report, null, 2)));
  add('index-justificatifs.json', strToU8(JSON.stringify({ year: report.year, generatedAt: report.generatedAt, volume, startIndex, nextIndex, totalReferences: all.length, missingCount, entries }, null, 2)));
  const csv = (value: unknown) => `"${String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
  add('index-justificatifs.csv', strToU8('\ufeff' + [['Reference', 'Description', 'Origine', 'Etat', 'Fichier', 'Octets', 'SHA-256', 'Detail'], ...entries.map(e => [e.id, e.label, e.source, e.status, e.path, e.bytes, e.sha256, e.detail])].map(row => row.map(csv).join(';')).join('\r\n')));
  zip.end();
  if (zipError) throw zipError;
  return { blob: new Blob(chunks, { type: 'application/zip' }), fileName: `Brasserie-impots-${report.year}-volume-${volume}${missingCount ? '-a-completer' : ''}.zip`, entries, totalDocuments: all.length, nextIndex, missingCount };
}
export function downloadTaxArchive(result: TaxArchiveResult): void {
  const url = URL.createObjectURL(result.blob), a = document.createElement('a');
  a.href = url; a.download = result.fileName; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
