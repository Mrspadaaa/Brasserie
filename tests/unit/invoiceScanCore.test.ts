import {describe,it,expect} from 'vitest';
import {invoiceScanId,validateInvoiceFile,normalizeInvoiceScan,needsInvoiceReview,invoiceDate} from '../../functions/src/invoiceScanCore';

const file={mimeType:'image/jpeg',data:Buffer.from([255,216,255,217]).toString('base64')};
describe('Lecture de facture : chiffres source, aucune invention',()=>{
  it('préserve TVA étrangère et quantité inconnue',()=>{
    const value=normalizeInvoiceScan({currency:'EUR',date:'31.02.2026',amountHT:100,tvaRate:0.19,tvaAmount:19,amountTTC:119,items:[{name:'Fermenteur',kind:'equipment',quantity:null,unit:'',amountTTC:119}]});
    expect(value.tvaRate).toBe(.19);expect(value.items[0].quantity).toBeNull();expect(value.items[0].unit).toBe('');expect(value.date).toBe('');
    expect(value.issues.join(' ')).toContain('EUR');expect(needsInvoiceReview(value)).toBe(true);
  });
  it('garde les totaux contradictoires et rend l’écart explicite',()=>{
    const value=normalizeInvoiceScan({amountHT:100,tvaAmount:8.1,amountTTC:109,currency:'CHF',date:'09.09.2026'});
    expect(value.amountTTC).toBe(109);expect(value.tvaAmount).toBe(8.1);expect(value.issues.join(' ')).toContain('ne correspondent');
  });
  it('ne convertit pas null, chaîne vide ou NaN en zéro',()=>{
    const value=normalizeInvoiceScan({amountHT:null,amountTTC:'',tvaRate:NaN,items:[{name:'Malt',kind:'stock',quantity:null,unit:null}]});
    expect(value.amountHT).toBeNull();expect(value.amountTTC).toBeNull();expect(value.tvaRate).toBeNull();expect(value.issues.join(' ')).toContain('aucun stock automatique');
  });
  it('conserve les lignes de livraison et remises',()=>{
    const value=normalizeInvoiceScan({items:[{name:'Port',kind:'shipping',amountTTC:5},{name:'Rabais',kind:'discount',amountTTC:-2}]});
    expect(value.items.map(item=>item.amountTTC)).toEqual([5,-2]);expect(needsInvoiceReview(value)).toBe(false);
  });
  it.each([['2024-02-29','29.02.2024'],['29.02.2025',''],['01/09/2026','01.09.2026'],['1/9/26','']])('valide réellement la date %s',(input,output)=>expect(invoiceDate(input)).toBe(output));
  it('borne format, signature, taille et pages avant génération',()=>{
    expect(validateInvoiceFile(file)).toEqual(file);
    expect(()=>validateInvoiceFile({...file,mimeType:'image/png'})).toThrow();
    expect(()=>validateInvoiceFile({...file,data:'a'.repeat(6_000_000)})).toThrow();
    const pdf=(text:string)=>({mimeType:'application/pdf',data:Buffer.from(`%PDF-1.7 ${text}`).toString('base64')});
    expect(validateInvoiceFile(pdf('/Type /Pages /Count 2 /Type /Page /Type /Page'))).toBeTruthy();
    expect(()=>validateInvoiceFile(pdf('/Type /Pages /Count 5 /Type /Page'))).toThrow();
    expect(()=>validateInvoiceFile(pdf('/Type /ObjStm /Type /Page'))).toThrow();
  });
  it('identifie les octets et isole les comptes',()=>{
    expect(invoiceScanId('one',file)).toBe(invoiceScanId('one',{...file}));
    expect(invoiceScanId('one',file)).not.toBe(invoiceScanId('two',file));
  });
});
