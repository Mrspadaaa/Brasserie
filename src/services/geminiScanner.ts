import type { FinanceCategory } from '../types';
import { AiClient, type AiTier } from './aiClient';
import { totalAdmis } from './pagesJustificatif';
import { peserPoint, type InvoiceControls, type InvoicePoint } from '../domain/finance/invoicePoints';

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
  items:Array<{ id:string; name:string; kind:ScannedLineKind; reference?:string; variant?:string; quantity:number|null; unit:string; price?:number|null; amountTTC?:number|null; stockCategory?:string; evidence?:string; ambiguity?:string; vatCode?:string; alphaPct?:number|null; alphaPctLu?:number|null;
    /** D275, voie f5 : la désignation en français (marque et nom propre tels quels, sans option ni unité), seulement si la lecture la rend ; jamais exigée. */
    nameFr?:string }>;
  issues:string[]; review?:{ status:InvoiceReviewStatus; findings:string[]; readers?:number; correctedFields?:string[] };
  /** l2 : tout est facultatif. `points`/`controls` absents = « non contrôlé » (jamais « aucun point »). */
  points?:InvoicePoint[]; controls?:InvoiceControls; vat?:Array<{code:string;rate:number|null;base:number|null;amount:number|null}>;
  remarques?:Array<{champ:string;ligne?:number;lectures:number[];message:string}>;
  proForma?:boolean; documentTypeLu?:ScannedInvoiceResult['documentType']; documentTypeRetenu?:ScannedInvoiceResult['documentType'];
  linesLost?:number; printedLineCount?:number|null; rejets?:Array<{champ:string;ligne:number|null;luTexte:string;raison:string}>;
}
export interface ScanOutcome {
  ok:boolean; result?:ScannedInvoiceResult; proofDataUrl:string; fileName:string; mimeType:string;
  model?:string; elapsedMs?:number; error?:string; documentHash?:string; cached?:boolean;
  /** n2-pages : le nombre de pages que le serveur a lues, posé seulement quand il est celui des pages envoyées. */
  pagesLues?:number;
}
/** n2-pages : ce qu'un serveur qui ne lit pas encore plusieurs pages (avant le redéploiement d'`aiTask`) fait dire à l'écran. */
export const PLUSIEURS_PAGES_INDISPONIBLE='La lecture de plusieurs pages n’est pas encore disponible sur le serveur. Lis-les avec « Un document », ou saisis à la main.';
/** Le refus exact de `validateInvoiceFile` quand un serveur d'avant reçoit `files` sans `file` : la signature du vieux serveur (aucun coût, rien n'est lu). */
const REFUS_VIEUX_SERVEUR='Choisis une photo JPG, PNG, WebP ou un PDF de 4 pages maximum.';
const number = (value:any):number|null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const text = (value:any,max=250) => typeof value === 'string' ? value.trim().slice(0,max) : '';
const kinds:ScannedLineKind[]=['equipment','maintenance','stock','service','packaging','shipping','discount','other','unknown'];
const reviewStatuses:InvoiceReviewStatus[]=['checked','corrected','disputed','unavailable'];
const messages=(value:unknown,max=70)=>[...new Set((Array.isArray(value)?value:[]).map(item=>text(item)).filter(Boolean))].slice(0,max);
const documentTypes=['invoice','receipt','delivery_note','quote','credit_note','other'];
const controlStatuses=['ok','ecart','incomplet','non-verifiable'];
const int=(value:any,min=0):number|null=>Number.isInteger(value)&&value>=min?value:null;
const oneOf=<T extends string>(value:any,list:readonly T[],fallback:T):T=>list.includes(value)?value:fallback;
/** Une valeur lue par une lecture : '' et absent deviennent null (jamais 0), un texte est borné. */
const scanValue=(value:any)=>value===null||value===undefined||value===''?null:typeof value==='number'?(Number.isFinite(value)?value:null):typeof value==='boolean'?value:text(String(value),120)||null;
/** Assainit un point reçu du serveur sans en perdre : un code inconnu (serveur plus récent) est conservé tel quel. */
function scanPoint(raw:any):InvoicePoint|null{
  if(!raw||typeof raw!=='object'||typeof raw.code!=='string'||typeof raw.cle!=='string')return null;
  const details=Array.isArray(raw.details)?raw.details.slice(0,10).filter((d:any)=>d&&typeof d.relation==='string').map((d:any)=>({relation:text(d.relation,120),lu:number(d.lu),calcule:number(d.calcule),ecart:number(d.ecart),...(typeof d.code==='string'?{code:text(d.code,40)}:{}),...(d.arrondiPossible===true?{arrondiPossible:true}:{})})):undefined;
  const valeurs=Array.isArray(raw.valeurs)?raw.valeurs.slice(0,40).filter((v:any)=>v&&typeof v==='object').map((v:any)=>({lecture:int(v.lecture,1)??1,valeur:scanValue(v.valeur),retenue:v.retenue===true,...(v.motif==='recoupée'||v.motif==='majorité'?{motif:v.motif}:{}),...(int(v.ligne,1)!==null?{ligne:int(v.ligne,1)!}:{})})):undefined;
  return {
    code:text(raw.code,40) as InvoicePoint['code'],
    gravite:oneOf(raw.gravite,['ecart','inverifiable'] as const,'inverifiable'), origine:oneOf(raw.origine,['controle','forme','lecture'] as const,'controle'),
    enjeu:oneOf(raw.enjeu,['argent','stock','info'] as const,'info'), bloque:raw.bloque===true,
    ...(raw.bloqueLiaison===true?{bloqueLiaison:true}:{}),
    ...(['désaccord','contrôle','modèle'].includes(raw.source)?{source:raw.source}:{}),
    ...(valeurs?{valeurs}:{}), ...(typeof raw.pese==='boolean'?{pese:raw.pese}:{}), ...(typeof raw.signature==='string'?{signature:text(raw.signature,400)}:{}),
    champ:text(raw.champ,40) as InvoicePoint['champ'], champs:(Array.isArray(raw.champs)?raw.champs:[]).slice(0,40).filter((c:any)=>typeof c==='string').map((c:string)=>text(c,60)),
    ligne:int(raw.ligne,1), ...(Array.isArray(raw.lignes)?{lignes:raw.lignes.slice(0,40).filter((n:any)=>Number.isInteger(n))}:{}),
    cle:text(raw.cle,120), regle:text(raw.regle,250), lu:number(raw.lu), calcule:number(raw.calcule), ecart:number(raw.ecart),
    unite:oneOf(raw.unite,['centimes','pourcent','lignes','texte','nombre'] as const,'texte'), ...(typeof raw.luTexte==='string'?{luTexte:text(raw.luTexte,120)}:{}),
    message:text(raw.message,250), ...(details?{details}:{}),
  };
}
const MAX_POINTS=60;
/** Plus de 60 points : les points qui pèsent passent d'abord ; si la coupe en perd un qui pèse, la lecture n'est plus jamais « vérifiée » (relecture l2, point 6). */
function keepWeighingPoints(result:ScannedInvoiceResult,_raw:any):ScannedInvoiceResult{
  const points=result.points;
  if(!points||points.length<=MAX_POINTS)return result;
  const heavy=points.filter(peserPoint),light=points.filter(p=>!peserPoint(p));
  const kept=[...heavy,...light].slice(0,MAX_POINTS),lostHeavy=heavy.length>MAX_POINTS;
  return {...result,points:kept,...(lostHeavy&&result.review&&result.review.status!=='unavailable'?{review:{...result.review,status:'disputed' as const}}:{})};
}
function scanControls(raw:any):InvoiceControls|undefined{
  if(!raw||typeof raw!=='object')return undefined;
  const status=(value:any)=>oneOf(value,controlStatuses as readonly string[],'non-verifiable') as InvoiceControls['sum']['statut'];
  const base=(value:any)=>value==='TTC'||value==='HT'?value:null;
  return {
    lines:{checked:int(raw.lines?.checked)??0,failed:int(raw.lines?.failed)??0,skipped:int(raw.lines?.skipped)??0,skippedIds:(Array.isArray(raw.lines?.skippedIds)?raw.lines.skippedIds:[]).slice(0,40).filter((s:any)=>typeof s==='string').map((s:string)=>text(s,20))},
    sum:{statut:status(raw.sum?.statut),base:base(raw.sum?.base)}, vat:{statut:status(raw.vat?.statut),base:base(raw.vat?.base)}, totals:{statut:status(raw.totals?.statut)},
  };
}

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
  /**
   * n2-pages : les N images d'un même justificatif, lues d'un seul appel (comme le banc). Un serveur qui ne sait pas encore lire des pages n'a jamais le droit
   * de rendre une lecture : `ok:true` sans `pages === N` et le refus exact de `validateInvoiceFile` disent « pas encore disponible » ; toute autre erreur
   * (budget, délai, quota, lecture non exploitable) garde son message.
   */
  async scanPages(files:File[]):Promise<ScanOutcome> {
    const base={ proofDataUrl:'',fileName:`${files.length} pages`,mimeType:files[0]?this.normalizeMimeType(files[0]):'' };
    const types=['image/jpeg','image/png','image/webp'];
    if (files.length<2||files.length>4||files.some(file=>!types.includes(this.normalizeMimeType(file))||file.size>4*1024*1024)||!totalAdmis(files.map(file=>file.size)))
      return { ...base,ok:false,error:'Choisis de 2 à 4 images JPG, PNG ou WebP (4 Mo chacune, 12 Mo en tout).' };
    const response=await AiClient.run({ task:'scanInvoice',tier:'fast',files });
    if (!response.ok) return { ...base,ok:false,error:response.error===REFUS_VIEUX_SERVEUR?PLUSIEURS_PAGES_INDISPONIBLE:response.error||'Lecture indisponible. Complète les champs manuellement.' };
    if (!response.data||response.pages!==files.length) return { ...base,ok:false,error:PLUSIEURS_PAGES_INDISPONIBLE };
    return { ...base,ok:true,result:this.normalizeResult(response.data),model:response.model,elapsedMs:response.elapsedMs,documentHash:response.documentHash,cached:response.cached,pagesLues:response.pages };
  },
  /** Preserve the original amounts, including foreign or mixed VAT and missing quantities. */
  normalizeResult(raw:any):ScannedInvoiceResult {
    const result:ScannedInvoiceResult={
      documentType:['invoice','receipt','delivery_note','quote','credit_note','other'].includes(raw?.documentType)?raw.documentType:'other',
      paymentEvidence:['paid','unpaid','unknown'].includes(raw?.paymentEvidence)?raw.paymentEvidence:'unknown',
      fieldWarnings:(Array.isArray(raw?.fieldWarnings)?raw.fieldWarnings:[]).slice(0,25).filter((item:any)=>typeof item?.field==='string'&&typeof item?.message==='string').map((item:any)=>({field:text(item.field,40),message:text(item.message,200)})),
      orderNumber:text(raw?.orderNumber,70),
      vendor:text(raw?.vendor),date:this.normalizeDate(raw?.date),currency:text(raw?.currency,5),invoiceNumber:text(raw?.invoiceNumber,70),
      amountHT:number(raw?.amountHT),tvaRate:number(raw?.tvaRate),tvaAmount:number(raw?.tvaAmount),amountTTC:number(raw?.amountTTC),
      category:['brassage','materiel','nettoyage','chargesFixes','renovation','divers'].includes(raw?.category)?raw.category:'divers',subcategory:text(raw?.subcategory,60),description:text(raw?.description,300),
      items:(Array.isArray(raw?.items)?raw.items:[]).slice(0,35).map((item:any,index:number)=>({ id:`line-${index+1}`,name:text(item?.name),kind:kinds.includes(item?.kind)?item.kind:'unknown',reference:text(item?.reference,70),variant:text(item?.variant,80),quantity:number(item?.quantity),unit:text(item?.unit,30),price:number(item?.price),amountTTC:number(item?.amountTTC),stockCategory:text(item?.stockCategory,60),evidence:text(item?.evidence),ambiguity:text(item?.ambiguity),
        ...(typeof item?.vatCode==='string'?{vatCode:text(item.vatCode,10)}:{}),
        ...('alphaPct' in (item??{})?{alphaPct:number(item.alphaPct)}:{}), ...('alphaPctLu' in (item??{})?{alphaPctLu:number(item.alphaPctLu)}:{}) })),
      issues:messages(raw?.issues),
      review:raw?.review ? {
        status:reviewStatuses.includes(raw.review.status)?raw.review.status:'unavailable',
        findings:messages(raw.review.findings),
        ...(Number.isInteger(raw.review.readers)&&raw.review.readers>=1&&raw.review.readers<=3?{readers:raw.review.readers}:{}),
        ...(Array.isArray(raw.review.correctedFields)?{correctedFields:messages(raw.review.correctedFields,40)}:{})
      } : undefined,
      // l2 : ce que le serveur a calculé n'est plus jeté. Une clé n'existe que si la réponse la porte (un ancien résultat sort comme avant).
      ...(Array.isArray(raw?.points)?{points:raw.points.map(scanPoint).filter((p:InvoicePoint|null):p is InvoicePoint=>p!==null)}:{}),
      ...(raw?.controls&&typeof raw.controls==='object'?{controls:scanControls(raw.controls)!}:{}),
      ...(Array.isArray(raw?.vat)?{vat:raw.vat.slice(0,6).map((row:any)=>({code:text(row?.code,10),rate:number(row?.rate),base:number(row?.base),amount:number(row?.amount)}))}:{}),
      ...(Array.isArray(raw?.remarques)?{remarques:raw.remarques.slice(0,40).filter((r:any)=>typeof r?.champ==='string'&&typeof r?.message==='string').map((r:any)=>({champ:text(r.champ,40),...(int(r.ligne,1)!==null?{ligne:int(r.ligne,1)!}:{}),lectures:(Array.isArray(r.lectures)?r.lectures:[]).slice(0,3).filter((n:any)=>Number.isInteger(n)),message:text(r.message,200)}))}:{}),
      ...(typeof raw?.proForma==='boolean'?{proForma:raw.proForma}:{}),
      ...(documentTypes.includes(raw?.documentTypeLu)?{documentTypeLu:raw.documentTypeLu}:{}),
      ...(raw?.documentTypeRetenu!==undefined?{documentTypeRetenu:documentTypes.includes(raw.documentTypeRetenu)?raw.documentTypeRetenu:(documentTypes.includes(raw?.documentType)?raw.documentType:'other')}:{}),
      ...(int(raw?.linesLost)!==null?{linesLost:int(raw.linesLost)!}:{}),
      ...(raw?.printedLineCount===null||int(raw?.printedLineCount)!==null?{printedLineCount:raw.printedLineCount}:{}),
      ...(Array.isArray(raw?.rejets)?{rejets:raw.rejets.slice(0,40).filter((r:any)=>typeof r?.champ==='string'&&typeof r?.luTexte==='string').map((r:any)=>({champ:text(r.champ,40),ligne:int(r.ligne,1),luTexte:text(r.luTexte,60),raison:text(r.raison,120)}))}:{}),
    };
    return keepWeighingPoints(result,raw);
  },
  normalizeDate(raw:any):string {
    const value=text(raw), sw=/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value), iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const y=Number(sw?.[3]??iso?.[1]),m=Number(sw?.[2]??iso?.[2]),d=Number(sw?.[1]??iso?.[3]),date=new Date(Date.UTC(y,m-1,d));
    return y>=1900 && date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d ? `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}` : '';
  }
};
