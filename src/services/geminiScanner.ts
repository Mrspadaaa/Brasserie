import type { FinanceCategory } from '../types';
import { AiClient, type AiFluxEtape, type AiRequest, type AiResponse, type AiTier } from './aiClient';
import { totalAdmis } from './pagesJustificatif';
import { peserPoint, type InvoiceControls, type InvoicePoint } from '../domain/finance/invoicePoints';
import { lignesHtAuTtc } from './lignesHt';
import type { Decoupe } from './decoupe';
import { lireEnMorceaux } from './lectureMorceaux';

export type ScannedLineKind = 'equipment'|'maintenance'|'stock'|'service'|'packaging'|'shipping'|'discount'|'other'|'unknown';
export type InvoiceReviewStatus = 'checked'|'corrected'|'disputed'|'unavailable';
export interface ScannedInvoiceResult {
  documentType?:'invoice'|'receipt'|'delivery_note'|'quote'|'credit_note'|'other';
  paymentEvidence?:'paid'|'unpaid'|'unknown';
  /** RL-8 : le moyen de paiement IMPRIMÉ (« TWINT CHF 165.20 Paye ») ; absent ou `unknown` : jamais deviné. */
  paymentMethod?:'twint'|'cash'|'card'|'bank_transfer'|'other'|'unknown';
  fieldWarnings?:Array<{field:string;message:string}>;
  orderNumber?:string;
  vendor:string; date:string; currency:string; invoiceNumber:string;
  amountHT:number|null; tvaRate:number|null; tvaAmount:number|null; amountTTC:number|null;
  category:FinanceCategory; subcategory:string; description:string;
  /** Lenteur D : le jeton du morceau provisoire envoyé dans l'appel qui a calculé ce final ; absent d'un final seul (cache, ancien serveur, pièce sans 3.8). */
  provisoireJeton?:string;
  /** p2 : ce que la 3.8 a retiré aux deux premières lectures (lignes, total et TVA d'avant), écrit par le serveur dans le résultat lui-même, donc aussi servi du cache. Absent : rien n'a été retiré (ou ancien serveur). */
  retirees?:{ lignes:Array<{ rang:number; ligne:ScannedInvoiceResult['items'][number] }>; amountTTC?:number|null; tvaAmount?:number|null };
  items:Array<{ id:string; name:string; kind:ScannedLineKind; reference?:string; variant?:string; quantity:number|null; unit:string; price?:number|null; amountTTC?:number|null; stockCategory?:string; evidence?:string; ambiguity?:string; vatCode?:string; alphaPct?:number|null; alphaPctLu?:number|null;
    /** Lenteur D : le rang de la ligne provisoire d'où vient cette ligne finale ; `null` = ajoutée par la 3.8 ; absent = le serveur ne le dit pas (jamais fabriqué). */
    rangProvisoire?:number|null;
    /** D275, voie f5 : la désignation en français (marque et nom propre tels quels, sans option ni unité), seulement si la lecture la rend ; jamais exigée. */
    nameFr?:string }>;
  issues:string[]; review?:{ status:InvoiceReviewStatus; findings:string[]; readers?:number; correctedFields?:string[] };
  /** l2 : tout est facultatif. `points`/`controls` absents = « non contrôlé » (jamais « aucun point »). */
  points?:InvoicePoint[]; controls?:InvoiceControls; vat?:Array<{code:string;rate:number|null;base:number|null;amount:number|null}>;
  remarques?:Array<{champ:string;ligne?:number;lectures:number[];message:string}>;
  /** n3-ht : posé seulement quand les lignes, imprimées hors taxe, ont été passées au TTC par `lignesHtAuTtc` (les montants lus du pied restent ceux de la pièce). */
  lignesPasseesAuTtc?:boolean;
  proForma?:boolean; documentTypeLu?:ScannedInvoiceResult['documentType']; documentTypeRetenu?:ScannedInvoiceResult['documentType'];
  linesLost?:number; printedLineCount?:number|null; rejets?:Array<{champ:string;ligne:number|null;luTexte:string;raison:string}>;
  /** d2 (champs de la voie c1, mêmes noms que le schéma serveur) : chacun n'existe que si la lecture le porte ; absent = inconnu, jamais 0. */
  /** « Montant reçu / Payé » du ticket ; `terminalAmount` : le montant du terminal (EFT, TWINT), une information qui peut couvrir plusieurs tickets. */
  amountPaid?:number; terminalAmount?:number;
  /** Le nombre d'articles IMPRIMÉ par la pièce ; `countedAmounts` / `countedEans` : comptages indépendants faits avant la transcription ; `printedTime` : HH:MM imprimée. */
  /** `countedAmountsConfirmed` : la 3.8 a confirmé le comptage des montants (sans lui, un comptage discordant n'est pas un drapeau). */
  countedAmountsConfirmed?:true;
  printedItemCount?:number; countedAmounts?:number; countedEans?:number; printedTime?:string;
  /** Les lignes que la lecture a écartées des articles (montant en devise, règlement, sous-total). */
  ignoredLines?:Array<{label:string;amount:number|null;kind:'foreign_currency'|'payment'|'subtotal'|'other'}>;
  photoIncomplete?:boolean; photoIncompleteNote?:string;
}
export interface ScanOutcome {
  ok:boolean; result?:ScannedInvoiceResult; proofDataUrl:string; fileName:string; mimeType:string;
  model?:string; elapsedMs?:number; error?:string; documentHash?:string; cached?:boolean;
  /** n2-pages : le nombre de pages que le serveur a lues, posé seulement quand il est celui des pages envoyées. */
  pagesLues?:number;
  /** Lenteur D : posé seulement sur un résultat provisoire (le morceau du flux) ; le final le retrouve dans `result.provisoireJeton`. */
  jeton?:string;
}
/** Lenteur D : ce que l'écran donne à `scanDocument` et `scanPages` pour lire le flux. Sans option, la lecture est celle d'aujourd'hui, un seul appel. */
export interface ScanFluxOptions {
  /** Appelé une fois, au plus tard avant le final, avec la lecture des deux premiers lecteurs ; jamais appelé quand le serveur n'envoie aucun morceau. */
  onProvisoire?:(provisoire:ScanOutcome)=>void;
  /** Levé quand la feuille se ferme : coupe l'attente, le serveur finit et met en cache. */
  signal?:AbortSignal;
}
/** n2-pages : ce qu'un serveur qui ne lit pas encore plusieurs pages (avant le redéploiement d'`aiTask`) fait dire à l'écran. */
export const PLUSIEURS_PAGES_INDISPONIBLE='La lecture de plusieurs pages n’est pas encore disponible sur le serveur. Lis-les avec « Un document », ou saisis à la main.';
/** Le refus exact de `validateInvoiceFile` quand un serveur d'avant reçoit `files` sans `file` : la signature du vieux serveur (aucun coût, rien n'est lu). */
/** D381 : une longue pièce lue en morceaux qui échoue (brasseur, 03.11 : « documents illisible, entrer valeur à la main ou meilleure qualité de documents »). */
export const PIECE_DIFFICILE='Pièce peu lisible ? Reprends une photo plus nette, ou saisis les valeurs à la main.';
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
/** d2 : les champs des contrôles de la pièce (c1). Une clé n'existe que si la lecture la porte et qu'elle est valide : un montant négatif, un comptage non entier, une heure impossible sont écartés, un 0 lu reste un 0. */
function champsControlesPiece(raw:any):Partial<ScannedInvoiceResult>{
  const montant=(v:any)=>{const n=number(v);return n!==null&&n>=0?n:null;};
  const heure=/^([01]?\d|2[0-3])[:h.]([0-5]\d)$/.exec(text(raw?.printedTime,8));
  const ecartees=Array.isArray(raw?.ignoredLines)?raw.ignoredLines.slice(0,20).filter((l:any)=>text(l?.label)).map((l:any)=>({label:text(l.label,80),amount:number(l.amount),kind:oneOf(l?.kind,['foreign_currency','payment','subtotal','other'] as const,'other')})):null;
  return {
    ...(montant(raw?.amountPaid)!==null?{amountPaid:montant(raw.amountPaid)!}:{}),
    ...(montant(raw?.terminalAmount)!==null?{terminalAmount:montant(raw.terminalAmount)!}:{}),
    ...(int(raw?.printedItemCount)!==null?{printedItemCount:int(raw.printedItemCount)!}:{}),
    ...(int(raw?.countedAmounts)!==null?{countedAmounts:int(raw.countedAmounts)!}:{}),
    ...(int(raw?.countedAmounts)!==null&&raw?.countedAmountsConfirmed===true?{countedAmountsConfirmed:true as const}:{}),
    ...(int(raw?.countedEans)!==null?{countedEans:int(raw.countedEans)!}:{}),
    ...(heure?{printedTime:`${heure[1].padStart(2,'0')}:${heure[2]}`}:{}),
    ...(ecartees?{ignoredLines:ecartees}:{}),
    ...(typeof raw?.photoIncomplete==='boolean'?{photoIncomplete:raw.photoIncomplete}:{}),
    ...(text(raw?.photoIncompleteNote,120)?{photoIncompleteNote:text(raw.photoIncompleteNote,120)}:{}),
  };
}
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
/** D381, déclencheur « après » : la lecture a été coupée (point `lecture-coupee`), ou la pièce imprime plus de lignes de plus de 2 que la lecture n'en rend. */
export function lectureIncomplete(data:any):boolean{
  if(Array.isArray(data?.points)&&data.points.some((p:any)=>p?.code==='lecture-coupee'))return true;
  return typeof data?.printedLineCount==='number'&&Array.isArray(data?.items)&&data.printedLineCount>data.items.length+2;
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
  /**
   * Lenteur D : sans option, un seul appel comme avant. Avec `onProvisoire` ou `signal`, la lecture passe par le flux d'`aiTask` : le morceau
   * provisoire est rendu à `onProvisoire` (même forme qu'un `ScanOutcome`, plus `jeton`), le final est la valeur rendue, comme sans flux.
   */
  async appeler(req:AiRequest,options:ScanFluxOptions|undefined,provisoire:(etape:AiFluxEtape)=>ScanOutcome):Promise<AiResponse> {
    if (!options?.onProvisoire && !options?.signal) return AiClient.run(req);
    const onProvisoire=options.onProvisoire;
    return AiClient.runFlux(req,etape=>{ if (onProvisoire) onProvisoire(provisoire(etape)); },options.signal);
  },
  async scanDocument(file:File,_tier:AiTier='fast',options?:ScanFluxOptions):Promise<ScanOutcome> {
    const mimeType=this.normalizeMimeType(file), base={ proofDataUrl:'',fileName:file.name,mimeType };
    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(mimeType) || file.size>4*1024*1024)
      return { ...base,ok:false,error:'Choisis une image JPG, PNG, WebP ou un PDF de 4 Mo maximum.' };
    const proofDataUrl=await this.fileToDataUrl(file);
    // D381, déclencheur « avant » : une pièce très haute ou un PDF de plus de 4 pages se lit en morceaux (un PDF de 1 à 4 pages, jamais : lu entier, couche de
    // texte comprise ; 08.11). Les autres gardent la lecture d'aujourd'hui, au même appel.
    const avant=await this.decouper(file,false);
    if (avant) return this.lireMorceaux(avant,file,base,proofDataUrl,options?.signal);
    const response=await this.appeler({ task:'scanInvoice',tier:'fast',file },options,etape=>({ ...base,proofDataUrl,ok:true,jeton:etape.jeton,result:this.normalizeResult(etape.data),model:etape.model,elapsedMs:etape.elapsedMs }));
    if (!response.ok || !response.data) return { ...base,proofDataUrl,ok:false,error:response.error || 'Lecture indisponible. Complète les champs manuellement.' };
    // D381, déclencheur « après » : la lecture a été coupée ou a laissé des lignes imprimées → relue en morceaux, sans geste. Si cette relecture échoue, la première lecture (ses points disent ce qui manque) reste.
    if (lectureIncomplete(response.data)) {
      const apres=await this.decouper(file,true);
      if (apres) { const relue=await this.lireMorceaux(apres,file,base,proofDataUrl,options?.signal); if (relue.ok) return relue; }
    }
    return { ...base,proofDataUrl,ok:true,result:this.normalizeResult(response.data),model:response.model,elapsedMs:response.elapsedMs,documentHash:response.documentHash,cached:response.cached };
  },
  /** D381 : les morceaux de la pièce, ou `null` (lecture d'aujourd'hui). Une découpe qui échoue (image illisible, pdf.js absent) ne bloque jamais la lecture : `null`. */
  async decouper(file:File,force:boolean):Promise<Decoupe|null> {
    // Chargé à la demande : le module de découpe (canvas, pdf.js) ne pèse pas sur le morceau principal.
    try { return await (await import('./decoupeHorsFil')).decouperPiece(file,{ force }); } catch { return null; }
  },
  /** L'empreinte SHA-256 du fichier d'origine, celle que le serveur calcule pour une lecture entière (« même fichier déjà joint ») ; `undefined` si le navigateur ne peut pas. */
  async empreinte(file:File):Promise<string|undefined> {
    try { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join(''); } catch { return undefined; }
  },
  /** D381 : lit les morceaux puis les recolle ; même conversion en `ScanOutcome` qu'une lecture entière. Un morceau non lu = une erreur, jamais une lecture partielle. */
  async lireMorceaux(decoupe:Decoupe,file:File,base:Pick<ScanOutcome,'proofDataUrl'|'fileName'|'mimeType'>,proofDataUrl:string,signal?:AbortSignal):Promise<ScanOutcome> {
    try {
      const response=await lireEnMorceaux(decoupe.parties,undefined,{ signal,jonctions:decoupe.jonctions });
      if (!response.ok || !response.data) return { ...base,proofDataUrl,ok:false,error:`${response.error || 'Lecture indisponible.'} ${PIECE_DIFFICILE}` };
      return { ...base,proofDataUrl,ok:true,result:this.normalizeResult(response.data),model:response.model,elapsedMs:response.elapsedMs,documentHash:await this.empreinte(file),cached:response.cached };
    } catch (erreur) {
      return { ...base,proofDataUrl,ok:false,error:`${erreur instanceof Error && erreur.message ? erreur.message : 'Lecture indisponible.'} ${PIECE_DIFFICILE}` };
    }
  },
  /**
   * n2-pages : les N images d'un même justificatif, lues d'un seul appel (comme le banc). Un serveur qui ne sait pas encore lire des pages n'a jamais le droit
   * de rendre une lecture : `ok:true` sans `pages === N` et le refus exact de `validateInvoiceFile` disent « pas encore disponible » ; toute autre erreur
   * (budget, délai, quota, lecture non exploitable) garde son message.
   */
  async scanPages(files:File[],options?:ScanFluxOptions):Promise<ScanOutcome> {
    const base={ proofDataUrl:'',fileName:`${files.length} pages`,mimeType:files[0]?this.normalizeMimeType(files[0]):'' };
    const types=['image/jpeg','image/png','image/webp'];
    if (files.length<2||files.length>4||files.some(file=>!types.includes(this.normalizeMimeType(file))||file.size>4*1024*1024)||!totalAdmis(files.map(file=>file.size)))
      return { ...base,ok:false,error:'Choisis de 2 à 4 images JPG, PNG ou WebP (4 Mo chacune, 12 Mo en tout).' };
    // La règle `pages === N` ne vaut que pour le final : un morceau qui dit un autre nombre de pages ne pose simplement pas `pagesLues`.
    const response=await this.appeler({ task:'scanInvoice',tier:'fast',files },options,etape=>({ ...base,ok:true,jeton:etape.jeton,result:this.normalizeResult(etape.data),model:etape.model,elapsedMs:etape.elapsedMs,...(etape.pages===files.length?{pagesLues:etape.pages}:{}) }));
    if (!response.ok) return { ...base,ok:false,error:response.error===REFUS_VIEUX_SERVEUR?PLUSIEURS_PAGES_INDISPONIBLE:response.error||'Lecture indisponible. Complète les champs manuellement.' };
    if (!response.data||response.pages!==files.length) return { ...base,ok:false,error:PLUSIEURS_PAGES_INDISPONIBLE };
    return { ...base,ok:true,result:this.normalizeResult(response.data),model:response.model,elapsedMs:response.elapsedMs,documentHash:response.documentHash,cached:response.cached,pagesLues:response.pages };
  },
  /** Preserve the original amounts, including foreign or mixed VAT and missing quantities. */
  normalizeResult(raw:any):ScannedInvoiceResult {
    const result:ScannedInvoiceResult={
      documentType:['invoice','receipt','delivery_note','quote','credit_note','other'].includes(raw?.documentType)?raw.documentType:'other',
      paymentEvidence:['paid','unpaid','unknown'].includes(raw?.paymentEvidence)?raw.paymentEvidence:'unknown',
      paymentMethod:['twint','cash','card','bank_transfer','other','unknown'].includes(raw?.paymentMethod)?raw.paymentMethod:'unknown',
      fieldWarnings:(Array.isArray(raw?.fieldWarnings)?raw.fieldWarnings:[]).slice(0,25).filter((item:any)=>typeof item?.field==='string'&&typeof item?.message==='string').map((item:any)=>({field:text(item.field,40),message:text(item.message,200)})),
      orderNumber:text(raw?.orderNumber,70),
      vendor:text(raw?.vendor),date:this.normalizeDate(raw?.date),currency:text(raw?.currency,5),invoiceNumber:text(raw?.invoiceNumber,70),
      amountHT:number(raw?.amountHT),tvaRate:number(raw?.tvaRate),tvaAmount:number(raw?.tvaAmount),amountTTC:number(raw?.amountTTC),
      category:['brassage','materiel','nettoyage','chargesFixes','renovation','divers'].includes(raw?.category)?raw.category:'divers',subcategory:text(raw?.subcategory,60),description:text(raw?.description,300),
      ...(typeof raw?.provisoireJeton==='string'&&raw.provisoireJeton?{provisoireJeton:text(raw.provisoireJeton,80)}:{}),
      items:(Array.isArray(raw?.items)?raw.items:[]).map((item:any,index:number)=>({ id:`line-${index+1}`,name:text(item?.name),kind:kinds.includes(item?.kind)?item.kind:'unknown',reference:text(item?.reference,70),variant:text(item?.variant,80),quantity:number(item?.quantity),unit:text(item?.unit,30),price:number(item?.price),amountTTC:number(item?.amountTTC),stockCategory:text(item?.stockCategory,60),evidence:text(item?.evidence),ambiguity:text(item?.ambiguity),
        ...(typeof item?.vatCode==='string'?{vatCode:text(item.vatCode,10)}:{}),
        ...('alphaPct' in (item??{})?{alphaPct:number(item.alphaPct)}:{}), ...('alphaPctLu' in (item??{})?{alphaPctLu:number(item.alphaPctLu)}:{}),
        // Lenteur D : un rang entier, ou null (ligne ajoutée par la 3.8). Une valeur invalide n'est pas lue comme « ajoutée » : la clé est omise.
        ...(item?.rangProvisoire===null?{rangProvisoire:null}:int(item?.rangProvisoire)!==null?{rangProvisoire:int(item.rangProvisoire)!}:{}) })),
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
      ...champsControlesPiece(raw),
      ...(Array.isArray(raw?.rejets)?{rejets:raw.rejets.slice(0,40).filter((r:any)=>typeof r?.champ==='string'&&typeof r?.luTexte==='string').map((r:any)=>({champ:text(r.champ,40),ligne:int(r.ligne,1),luTexte:text(r.luTexte,60),raison:text(r.raison,120)}))}:{}),
    };
    // p2 : les lignes que la 3.8 a retirées, lues comme n'importe quelle ligne ; une clé n'existe que si le serveur la porte.
    if(raw?.retirees&&typeof raw.retirees==='object'&&Array.isArray(raw.retirees.lignes)){
      const lignes=raw.retirees.lignes.slice(0,40).filter((x:any)=>x&&typeof x==='object'&&int(x.rang)!==null&&x.ligne&&typeof x.ligne==='object');
      const lues=lignes.length?this.normalizeResult({items:lignes.map((x:any)=>x.ligne)}).items:[];
      const re={lignes:lignes.map((x:any,i:number)=>({rang:int(x.rang)!,ligne:{...lues[i],id:`retiree-${i+1}`}})),...(raw.retirees.amountTTC===null||number(raw.retirees.amountTTC)!==null?{amountTTC:number(raw.retirees.amountTTC)}:{}),...(raw.retirees.tvaAmount===null||number(raw.retirees.tvaAmount)!==null?{tvaAmount:number(raw.retirees.tvaAmount)}:{})};
      if(re.lignes.length||'amountTTC' in re||'tvaAmount' in re)result.retirees=re;
    }
    // n3-ht (D304, D317) : des lignes imprimées hors taxe passent au TTC, ici, pour que le provisoire du flux et le final (tous deux assainis par cette fonction) donnent les mêmes montants.
    return keepWeighingPoints(lignesHtAuTtc(result),raw);
  },
  normalizeDate(raw:any):string {
    const value=text(raw), sw=/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value), iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const y=Number(sw?.[3]??iso?.[1]),m=Number(sw?.[2]??iso?.[2]),d=Number(sw?.[1]??iso?.[3]),date=new Date(Date.UTC(y,m-1,d));
    return y>=1900 && date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d ? `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}` : '';
  }
};
