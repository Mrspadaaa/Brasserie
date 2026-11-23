// @vitest-environment node
// P1 : un PDF 1.5 (pages dans un /ObjStm compressé) est accepté si ses pages se comptent. Ecrit AVANT la correction (L13).
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { validateInvoiceFile } from '../../../../functions/src/invoiceScanCore';

const enPdf = (octets: Buffer) => ({ mimeType: 'application/pdf', data: octets.toString('base64') });
const clair = (texte: string) => enPdf(Buffer.from(texte, 'latin1'));

/** Un PDF 1.5 : catalogue, arbre de pages et `pages` pages, tous dans un flux d'objets compressé (Flate). */
function pdf15(pages: number, options: { filtre?: string; corps?: Buffer; supplement?: string } = {}) {
  const objets = [`<</Type/Catalog/Pages 2 0 R>>`, `<</Type/Pages/Count ${pages}/Kids[${Array.from({ length: pages }, (_, i) => `${10 + i} 0 R`).join(' ')}]>>`,
    ...Array.from({ length: pages }, () => `<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>`)];
  let decalage = 0;
  const table = objets.map((o, i) => { const ligne = `${i === 0 ? 1 : i === 1 ? 2 : 10 + i - 2} ${decalage} `; decalage += o.length + 1; return ligne; }).join('');
  const decode = Buffer.from(table + objets.join('\n'), 'latin1');
  const corps = options.corps ?? deflateSync(decode);
  const filtre = options.filtre ?? '/Filter/FlateDecode';
  return enPdf(Buffer.concat([
    Buffer.from(`%PDF-1.5\n5 0 obj\n<</Type/ObjStm/N ${objets.length}/First ${table.length}${filtre}/Length ${corps.length}>>\nstream\n`, 'latin1'),
    corps, Buffer.from(`\nendstream\nendobj\n${options.supplement ?? ''}%%EOF`, 'latin1'),
  ]));
}

describe('P1 — PDF 1.5 avec /ObjStm', () => {
  it('une page dans un flux d’objets Flate : accepté', () => {
    const f = pdf15(1);
    expect(validateInvoiceFile(f)).toEqual(f);
  });
  it('quatre pages : accepté', () => { expect(() => validateInvoiceFile(pdf15(4))).not.toThrow(); });
  it('cinq pages dans le flux : refusé, avec la limite de 4 pages', () => {
    expect(() => validateInvoiceFile(pdf15(5))).toThrow(/4 pages maximum/);
  });
  it('flux d’objets non Flate (LZW) : refusé, on ne sait pas compter', () => {
    expect(() => validateInvoiceFile(pdf15(1, { filtre: '/Filter/LZWDecode' }))).toThrow(/compter/);
  });
  it('flux corrompu annoncé Flate : refusé', () => {
    expect(() => validateInvoiceFile(pdf15(1, { corps: Buffer.from('pas du tout du zlib, juste des octets', 'latin1') }))).toThrow(/compter/);
  });
  it('bombe de décompression (10 Mo de zéros dans 10 Ko) : refusé sans tout décompresser', () => {
    expect(() => validateInvoiceFile(pdf15(1, { corps: deflateSync(Buffer.alloc(10 * 1024 * 1024)) }))).toThrow(/compter/);
  });
  it('/ObjStm annoncé sans flux décodable : refusé (cas existant)', () => {
    expect(() => validateInvoiceFile(clair('%PDF-1.5 /Type /ObjStm /Type /Page'))).toThrow();
  });
  it('PDF chiffré : refusé', () => {
    expect(() => validateInvoiceFile(clair('%PDF-1.4 /Encrypt /Type /Pages /Count 1 /Type /Page'))).toThrow(/chiffré/);
  });
});

describe('P1 — le /Count d’un autre dictionnaire n’est pas un nombre de pages', () => {
  const plain = (outlines: number) => clair(`%PDF-1.4\n1 0 obj\n<</Type/Outlines/Count ${outlines}>>\nendobj\n2 0 obj\n<</Type/Pages/Count 1/Kids[3 0 R]>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R>>\nendobj\n%%EOF`);
  it('une page, avec des signets (/Outlines /Count 12) : accepté', () => { expect(() => validateInvoiceFile(plain(12))).not.toThrow(); });
  it('/Pages /Count 5 : refusé', () => {
    expect(() => validateInvoiceFile(clair('%PDF-1.4 /Type /Pages /Count 5 /Type /Page'))).toThrow(/4 pages maximum/);
  });
  it('aucune page : refusé avec le message existant', () => {
    expect(() => validateInvoiceFile(clair('%PDF-1.4 rien'))).toThrow(/limite de 4 pages/);
  });
});
