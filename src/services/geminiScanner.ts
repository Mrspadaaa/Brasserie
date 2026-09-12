import type { FinanceCategory } from '../types';
import { AiClient, type AiTier } from './aiClient';

export type ScannedLineKind = 'equipment'|'maintenance'|'stock'|'service'|'packaging'|'shipping'|'discount'|'other'|'unknown';
export type InvoiceReviewStatus = 'checked'|'corrected'|'disputed'|'unavailable';
export interface ScannedInvoiceResult {
  documentType?:'invoice'|'receipt'|'delivery_note'|'quote'|'credit_note'|'other';
  paymentEvidence?:'paid'|'unpaid'|'unknown';
  fieldWarnings?:Array<{field:string;message:string}>;
  orderNumber?:string;
  vendor:string; date:string; currency:string; invoiceNumber:string;
  amountHT:number|null; tvaRate:number|null; tvaAmount:number|null; amountTTC:number|null;
  category:FinanceCategory; subcategory:string; description:string;
  items:Array<{ id:string; name:string; kind:ScannedLineKind; reference?:string; variant?:string; quantity:number|null; unit:string; price?:number|null; amountTTC?:number|null; stockCategory?:string; evidence?:string; ambiguity?:string }>;
  issues:string[]; review?:{ status:InvoiceReviewStatus; findings:string[]; readers?:number; correctedFields?:string[] };
}
export interface ScanOutcome {
  ok:boolean; result?:ScannedInvoiceResult; proofDataUrl:string; fileName:string; mimeType:string;
  model?:string; elapsedMs?:number; error?:string; documentHash?:string; cached?:boolean;
}
const number = (value:any):number|null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const text = (value:any,max=250) => typeof value === 'string' ? value.trim().slice(0,max) : '';
const kinds:ScannedLineKind[]=['equipment','maintenance','stock','service','packaging','shipping','discount','other','unknown'];
const reviewStatuses:InvoiceReviewStatus[]=['checked','corrected','disputed','unavailable'];
const messages=(value:unknown,max=70)=>[...new Set((Array.isArray(value)?value:[]).map(item=>text(item)).filter(Boolean))].slice(0,max);

export const GeminiScannerService = {
  async fileToDataUrl(file:File|Blob):Promise<string> {
    return new Promise((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.onerror=()=>reject(new Error('Le justificatif ne peut pas être lu.')); reader.readAsDataURL(file); });
  },
  normalizeMimeType(file:File):string { return file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''); },
  async scanDocument(file:File,_tier:AiTier='fast'):Promise<ScanOutcome> {
    const mimeType=this.normalizeMimeType(file), base={ proofDataUrl:'',fileName:file.name,mimeType };
    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(mimeType) || file.size>4*1024*1024)
      return { ...base,ok:false,error:'Choisis une image JPG, PNG, WebP ou un PDF de 4 Mo maximum (4 pages).' };
    const proofDataUrl=await this.fileToDataUrl(file);
    const response=await AiClient.run({ task:'scanInvoice',tier:'fast',file });
    if (!response.ok || !response.data) return { ...base,proofDataUrl,ok:false,error:response.error || 'Lecture indisponible. Complète les champs manuellement.' };
    return { ...base,proofDataUrl,ok:true,result:this.normalizeResult(response.data),model:response.model,elapsedMs:response.elapsedMs,documentHash:response.documentHash,cached:response.cached };
  },
  /** Preserve the original amounts, including foreign or mixed VAT and missing quantities. */
  normalizeResult(raw:any):ScannedInvoiceResult {
    return {
      documentType:['invoice','receipt','delivery_note','quote','credit_note','other'].includes(raw?.documentType)?raw.documentType:'other',
      paymentEvidence:['paid','unpaid','unknown'].includes(raw?.paymentEvidence)?raw.paymentEvidence:'unknown',
      fieldWarnings:(Array.isArray(raw?.fieldWarnings)?raw.fieldWarnings:[]).slice(0,25).filter((item:any)=>typeof item?.field==='string'&&typeof item?.message==='string').map((item:any)=>({field:text(item.field,40),message:text(item.message,200)})),
      orderNumber:text(raw?.orderNumber,70),
      vendor:text(raw?.vendor),date:this.normalizeDate(raw?.date),currency:text(raw?.currency,5),invoiceNumber:text(raw?.invoiceNumber,70),
      amountHT:number(raw?.amountHT),tvaRate:number(raw?.tvaRate),tvaAmount:number(raw?.tvaAmount),amountTTC:number(raw?.amountTTC),
      category:['brassage','materiel','nettoyage','chargesFixes','renovation','divers'].includes(raw?.category)?raw.category:'divers',subcategory:text(raw?.subcategory,60),description:text(raw?.description,300),
      items:(Array.isArray(raw?.items)?raw.items:[]).slice(0,35).map((item:any,index:number)=>({ id:`line-${index+1}`,name:text(item?.name),kind:kinds.includes(item?.kind)?item.kind:'unknown',reference:text(item?.reference,70),variant:text(item?.variant,80),quantity:number(item?.quantity),unit:text(item?.unit,30),price:number(item?.price),amountTTC:number(item?.amountTTC),stockCategory:text(item?.stockCategory,60),evidence:text(item?.evidence),ambiguity:text(item?.ambiguity) })),
      issues:messages(raw?.issues),
      review:raw?.review ? {
        status:reviewStatuses.includes(raw.review.status)?raw.review.status:'unavailable',
        findings:messages(raw.review.findings),
        ...(Number.isInteger(raw.review.readers)&&raw.review.readers>=1&&raw.review.readers<=3?{readers:raw.review.readers}:{}),
        ...(Array.isArray(raw.review.correctedFields)?{correctedFields:messages(raw.review.correctedFields,40)}:{})
      } : undefined
    };
  },
  normalizeDate(raw:any):string {
    const value=text(raw), sw=/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value), iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const y=Number(sw?.[3]??iso?.[1]),m=Number(sw?.[2]??iso?.[2]),d=Number(sw?.[1]??iso?.[3]),date=new Date(Date.UTC(y,m-1,d));
    return y>=1900 && date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d ? `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}` : '';
  }
};
