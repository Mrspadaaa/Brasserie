// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { jsPDF } from 'jspdf';
import { createHash } from 'node:crypto';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { createTaxArchive, originalBytes } from '../../src/services/taxArchive';
import type { AnnualDocument, AnnualReport, FinanceTransaction } from '../../src/domain/finance/types';

const makeOriginal = () => { const pdf = new jsPDF(); pdf.text('Facture fictive - test local', 20, 20); const bytes = new Uint8Array(pdf.output('arraybuffer')); return { dataUrl: `data:application/pdf;base64,${Buffer.from(bytes).toString('base64')}`, mimeType: 'application/pdf', fileName: 'exemple.pdf', bytes }; };
function report(): AnnualReport {
  return buildAnnualReport({ year: 2025, transactions: [], payments: [], assets: [], profile: { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' }, generatedAt: '2026-02-01T12:00:00Z' });
}
const row = (id: string, patch: Partial<AnnualDocument> = {}): AnnualDocument => ({ id, date: '2025-06-01', description: 'Facture de malt', category: 'brassage', amountCents: 12345, hasProof: true, vendor: 'Fournisseur', required: true, proofDocumentId: `DOCUMENT-${id}`, proofSource: 'document', ...patch });
describe('Archive fiscale avec originaux, sans réseau ni IA', () => {
  it('interrompt le volume sur une connexion Drive expirée au lieu de livrer un dossier incomplet', async () => {
    const r = report(), original = makeOriginal(); r.documents = [row('A'), row('B'), row('C')];
    const expired = Object.assign(Error('Reconnecte Google Drive.'), { code: 'drive/auth-required' });
    const load = vi.fn().mockResolvedValueOnce(original).mockRejectedValueOnce(expired);
    await expect(createTaxArchive({ report: r, companyName: 'Brasserie test', transactions: [], loadDocument: load })).rejects.toBe(expired);
    expect(load).toHaveBeenCalledTimes(2); // No misleading ZIP and no request for every remaining file.
  });
  it('inclut les vrais octets, une empreinte vérifiable, les comptes et les références antérieures', async () => {
    const r = report(), original = makeOriginal();
    r.documents = [row('SALE')]; r.supportingDocuments = [row('OLD', { date: '2024-02-01', description: '../../Cuve:ancienne' })];
    const load = vi.fn(async () => original);
    const result = await createTaxArchive({ report: r, companyName: 'Brasserie test', transactions: [], loadDocument: load });
    const files = unzipSync(new Uint8Array(await result.blob.arrayBuffer()));
    expect(load).toHaveBeenCalledTimes(2); expect(result.missingCount).toBe(0); expect(result.nextIndex).toBeNull();
    expect(files['Comptes-annuels.pdf']).toBeDefined(); expect(files['Comptes-et-reports.xlsx']).toBeDefined();
    for (const entry of result.entries) {
      expect(Buffer.from(files[entry.path!])).toEqual(Buffer.from(original.bytes));
      expect(entry.sha256).toBe(createHash('sha256').update(original.bytes).digest('hex'));
      expect(entry.path).not.toContain('..');
    }
    const manifest = JSON.parse(strFromU8(files['index-justificatifs.json']));
    expect(manifest.entries[1].source).toBe('anterieur');
    expect(strFromU8(files['LIRE-MOI.txt'])).toContain('ne certifie pas la lisibilité');
  });
  it('signale les liens externes, fichiers absents et fichiers corrompus sans inventer une archive complète', async () => {
    const r = report(); r.documents = [row('MISSING', { hasProof: false }), row('EXTERNAL', { proofDocumentId: undefined, proofSource: 'external', proofUrl: 'https://example.test/proof.pdf' }), row('BROKEN'), row('LOST'), row('PRIVATE', { hasProof: false, required: false })];
    const load = vi.fn(async (id: string) => { if (id === 'DOCUMENT-LOST') throw Error('Document absent.'); return { dataUrl: 'data:application/pdf;base64,QUFBQQ==', mimeType: 'application/pdf', fileName: 'bad.pdf' }; });
    const result = await createTaxArchive({ report: r, companyName: 'Test', transactions: [], loadDocument: load });
    expect(result.missingCount).toBe(4); expect(result.fileName).toContain('a-completer');
    expect(result.entries.map(e => e.status)).toEqual(['missing', 'external', 'unavailable', 'unavailable', 'optional']);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('répartit les originaux en volumes sans omission ni doublon et indique la suite', async () => {
    const r = report(), original = makeOriginal(); r.documents = [row('A'), row('B'), row('C')];
    const load = vi.fn(async () => original);
    const first = await createTaxArchive({ report: r, companyName: 'Test', transactions: [], loadDocument: load, maxOriginalBytes: 1 });
    const second = await createTaxArchive({ report: r, companyName: 'Test', transactions: [], loadDocument: load, maxOriginalBytes: 1, startIndex: first.nextIndex!, volume: 2 });
    const third = await createTaxArchive({ report: r, companyName: 'Test', transactions: [], loadDocument: load, maxOriginalBytes: 1, startIndex: second.nextIndex!, volume: 3 });
    expect(first.nextIndex).toBe(1); expect(second.nextIndex).toBe(2); expect(third.nextIndex).toBeNull();
    expect([...first.entries, ...second.entries, ...third.entries].map(e => e.id)).toEqual(['A', 'B', 'C']);
    const files = unzipSync(new Uint8Array(await first.blob.arrayBuffer()));
    expect(strFromU8(files['LIRE-MOI.txt'])).toContain('SUITE NECESSAIRE');
  });
  it('lit un original historique du brouillon et refuse de substituer le fichier actuel à une ancienne version figée', async () => {
    const r = report(), original = makeOriginal(); r.documents = [row('LEGACY', { proofDocumentId: undefined, proofSource: 'legacy-inline' })];
    const tx: FinanceTransaction = { id: 'LEGACY', date: '2025-06-01', description: 'Malt', amountHT: 123.45, amountTTC: 123.45, tvaAmount: 0, tvaRate: 0, category: 'brassage', subcategory: '', proofUrl: original.dataUrl, proofType: original.mimeType };
    const draft = await createTaxArchive({ report: r, companyName: 'Test', transactions: [tx] });
    expect(draft.entries[0].status).toBe('included');
    const frozen = await createTaxArchive({ report: r, companyName: 'Test', transactions: [tx], frozen: true });
    expect(frozen.entries[0].status).toBe('unavailable');
    expect(frozen.entries[0].detail).toContain('sans original figé');
  });
  it('inclut les pièces complémentaires et annule proprement avant de télécharger', async () => {
    const r = report(), original = makeOriginal(); r.tax!.attachments = [{ id: 'AVS', kind: 'social', documentId: 'DOCUMENT-AVS', label: 'Décompte AVS', fileName: original.fileName, mimeType: original.mimeType }];
    const result = await createTaxArchive({ report: r, companyName: 'Test', transactions: [], loadDocument: async () => original });
    expect(result.entries[0]).toMatchObject({ source: 'complement', status: 'included', required: true });
    const controller = new AbortController(); controller.abort();
    await expect(createTaxArchive({ report: r, companyName: 'Test', transactions: [], signal: controller.signal })).rejects.toThrow('annulé');
  });
  it('refuse un fichier actif ou dont le contenu contredit le type annoncé', () => {
    expect(() => originalBytes({ dataUrl: 'data:text/html;base64,QUFBQQ==', mimeType: 'text/html', fileName: 'invoice.pdf' })).toThrow();
    expect(() => originalBytes({ ...makeOriginal(), mimeType: 'image/png' })).toThrow();
  });
});
