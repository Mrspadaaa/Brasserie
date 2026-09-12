import React,{useState,useRef,useEffect,useId} from 'react';
import { Camera,FileText,Plus,Trash2,Check,Loader2,Package,CalendarDays,ChevronDown,AlertCircle,X } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { Field,inputClass } from '../FormNav';
import { TextInput } from '../TextInput';
import { NumberInput } from '../NumberInput';
import { DateField,swissToday,toIsoDate } from '../DateField';
import { Combobox } from '../Combobox';
import { StorageService } from '../../services/storage';
import { GeminiScannerService,type ScanOutcome,type ScannedLineKind } from '../../services/geminiScanner';
import { savePurchaseWithProof,confirmPurchase,validatePurchase,purchaseDuplicates,type PurchaseDraft,type PurchaseLineDraft } from '../../services/purchaseEntry';
import { isConfirmedWriteRejection } from '../../services/firestoreRepo';
import type { FinanceCategory } from '../../types';
import { FinanceService } from '../../services/financeService';
import { planOccurrences } from '../../domain/finance/forecast';
import { DriveConnection } from './DriveConnection';
import { InvoiceScanReview } from './InvoiceScanReview';
import { invoiceTotalProposal,invoiceFieldHints,invoicePurchaseDescription,patchPurchaseDraft,scannedPayment } from '../../services/purchasePrefill';
import { formatCHF } from '../../domain/finance/ledger';
import { useKeyboardInset } from '../useViewport';

export interface ExpenseSheetProps { onClose:()=>void;onSaved:()=>void;initialIntent?:'expense'|'equipment';existingEquipmentId?:string;startWithScan?:boolean;initialPlanId?:string }
const kinds:Array<{value:PurchaseLineDraft['kind'];label:string}>=[{value:'ingredient',label:'Ingrédients'},{value:'packaging',label:'Emballages'},{value:'cleaning',label:'Nettoyage'},{value:'equipment',label:'Matériel durable'},{value:'maintenance',label:'Entretien / réparation'},{value:'service',label:'Service'},{value:'shipping',label:'Livraison'},{value:'discount',label:'Remise'},{value:'other',label:'Autre'}];
type PurchaseCategory=Exclude<FinanceCategory,'apports'|'recettes'>;
const categories:Array<{value:PurchaseCategory;label:string}>=[{value:'brassage',label:'Brassage'},{value:'materiel',label:'Matériel'},{value:'nettoyage',label:'Nettoyage'},{value:'chargesFixes',label:'Charges fixes'},{value:'renovation',label:'Local'},{value:'divers',label:'Autre'}];
const money=(n:number)=>formatCHF(Math.round(n*100));
const newLine=(intent='expense'):PurchaseLineDraft=>({id:crypto.randomUUID(),description:'',kind:intent==='equipment'?'equipment':'ingredient',unit:'',stockAction:'none',equipmentAction:intent==='equipment'?'new':'none'});
const scanKind=(kind:ScannedLineKind):PurchaseLineDraft['kind']=>kind==='stock'?'ingredient':kind==='unknown'?'other':kind;
const button='min-h-7 rounded-control px-2 text-[13px] font-medium border transition-colors';
const dayShortcuts=[{label:'Hier',offsetDays:-1},{label:"Aujourd’hui",offsetDays:0},{label:'Demain',offsetDays:1}];
const uncertainClass='rounded-control border border-attention/50 bg-attention/5 p-2';
function ScanHint({field,message}:{field:string;message?:string}) {
  return message?<p id={`scan-hint-${field}`} className="text-xs text-attention leading-relaxed flex gap-1.5 mt-1.5"><AlertCircle size={14} className="shrink-0 mt-0.5"/><span><strong className="font-medium">À confirmer · </strong>{message}</span></p>:null;
}

export function ExpenseSheet({onClose,onSaved,initialIntent='expense',existingEquipmentId,startWithScan=false,initialPlanId}:ExpenseSheetProps) {
  const [draft,setDraft]=useState<PurchaseDraft>(()=>{
    const plan=initialPlanId?FinanceService.getPlans().find(p=>p.id===initialPlanId):undefined;
    return {submissionId:crypto.randomUUID(),date:swissToday(),vendor:plan?.vendor??'',invoiceNumber:'',description:plan?.title??'',planId:initialPlanId,category:initialIntent==='equipment'?'materiel':'brassage',lines:[{...newLine(initialIntent),description:plan?.title??'',...(existingEquipmentId?{equipmentAction:'existing' as const,equipmentRef:existingEquipmentId}: {})}],paymentStatus:'paid',paymentMethod:'bank',paymentDate:swissToday(),dueDate:'',sourceCurrency:'CHF'};
  });
  const [scan,setScan]=useState<ScanOutcome|null>(null),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[attachment,setAttachment]=useState<File|null>(null),[pendingId,setPendingId]=useState<string|null>(null);
  const [showForm,setShowForm]=useState(!startWithScan);
  const [attempted,setAttempted]=useState(false);
  const keyboardInset=useKeyboardInset();
  const titleId=useId(),validationId=useId();
  const fileInput=useRef<HTMLInputElement>(null),cameraInput=useRef<HTMLInputElement>(null),scanLocked=useRef(false),mounted=useRef(true),saveLocked=useRef(false),form=useRef<HTMLDivElement>(null),errorBox=useRef<HTMLDivElement>(null);
  const manuallyClassified=useRef(new Set<string>());
  const [driveAuthError,setDriveAuthError]=useState(false);
  const [reviewedFields,setReviewedFields]=useState<string[]>([]);
  const hints=scan?.ok&&scan.result?Object.fromEntries(Object.entries(invoiceFieldHints(scan.result)).filter(([field])=>!reviewedFields.includes(field))):{};
  const reviewed=(field:string)=>setReviewedFields(previous=>previous.includes(field)?previous:[...previous,field]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{if(error)errorBox.current?.scrollIntoView?.({block:'nearest'});},[error]);
  const stocks=StorageService.getStocks(),transactions=StorageService.getTransactions();
  const plans=FinanceService.getPlans().filter(plan=>(plan.status==='active'||plan.source==='equipment'&&plan.status==='draft')&&plan.direction==='out'),selectedPlan=plans.find(plan=>plan.id===draft.planId);
  const occurrences=selectedPlan?.recurrence?planOccurrences(selectedPlan,`${new Date().getFullYear()-1}-01-01`,`${new Date().getFullYear()+2}-12-31`):[];
  const patch=(value:Partial<PurchaseDraft>)=>{setDraft(previous=>patchPurchaseDraft(previous,value,swissToday()));};
  const updateLine=(id:string,value:Partial<PurchaseLineDraft>)=>{setDraft(previous=>({...previous,lines:previous.lines.map(line=>line.id===id?{...line,...value}:line)}));};
  const simplePurchase=draft.lines.length===1&&!scan?.ok&&draft.lines[0].description===draft.description&&draft.lines[0].amount===draft.amount;
  const selectCategory=(category:PurchaseCategory)=>{
    const line=draft.lines[0];
    const suggestedKind:Record<PurchaseCategory,PurchaseLineDraft['kind']>={brassage:'ingredient',materiel:'equipment',nettoyage:'cleaning',chargesFixes:'service',renovation:'service',divers:'other'};
    patch({category,...(simplePurchase&&!manuallyClassified.current.has(line.id)&&line.stockAction==='none'&&line.equipmentAction==='none'?{lines:[{...line,kind:suggestedKind[category]}]}:{})});
  };
  const errors=validatePurchase(draft,stocks,transactions),duplicates=purchaseDuplicates(draft,transactions);
  if(selectedPlan?.recurrence&&!draft.occurrenceId)errors.push('Sélectionne l’échéance de la dépense prévue.');
  // Une ligne simple reprend déjà montant et motif : une seule correction doit
  // être demandée, sans ouvrir les options de stock qui n’y changent rien.
  const shownErrors=errors.filter(message=>!(simplePurchase&&message.startsWith('Chaque ligne')&&errors.some(issue=>issue.startsWith('Décris')||issue.startsWith('Renseigne le total'))));
  const issueTarget=(message:string):HTMLElement|null=>{
    const root=form.current;
    if(!root)return null;
    let selector='';
    if(message.startsWith('Décris'))selector='#purchase-description';
    else if(message.startsWith('Renseigne le total'))selector='#purchase-total';
    else if(message.includes('date valide'))selector='[data-purchase-date] input';
    else if(message.includes('dépense prévue'))selector='#purchase-occurrence';
    else if(message.includes('paiement')||message.includes('paiement est futur')||message.includes('échéance'))selector='[data-purchase-payment] input';
    else if(message.includes('montant de TVA'))selector='#purchase-vat';
    else if(message.includes('taux de TVA'))selector='#purchase-vat-rate';
    else if(message.includes('doublon'))selector='#purchase-duplicate';
    else if(message.startsWith('Chaque ligne')&&simplePurchase)selector=draft.description.trim()?'#purchase-total':'#purchase-description';
    if(selector)return root.querySelector<HTMLElement>(selector);
    const index=draft.lines.findIndex(line=>message.startsWith(line.description+' :'));
    const line=index>=0?root.querySelectorAll<HTMLElement>('[data-purchase-line]')[index]:null;
    if(line){
      if(message.includes('quantité'))return line.querySelector<HTMLElement>('[aria-label^="Quantité ligne"]');
      if(message.includes('article de stock'))return line.querySelector<HTMLElement>('[role="combobox"]');
      if(message.includes('matériel existant'))return line.querySelector<HTMLElement>('[role="combobox"]');
      if(message.includes('convertit'))return line.querySelector<HTMLElement>('[aria-label^="Unité ligne"]');
      return line.querySelector<HTMLElement>('select');
    }
    return root.querySelector<HTMLElement>('[data-purchase-lines] summary');
  };
  const focusIssue=(message:string)=>{
    const target=issueTarget(message);
    if(!target){errorBox.current?.focus();return;}
    for(let ancestor=target.parentElement;ancestor&&ancestor!==form.current;ancestor=ancestor.parentElement){
      if(ancestor instanceof HTMLDetailsElement)ancestor.open=true;
    }
    target.focus();target.scrollIntoView?.({block:'nearest'});
  };
  const attach=async(file:File)=>{
    if(scanLocked.current||saveLocked.current)return;
    if(file.size>4*1024*1024 || !['image/jpeg','image/png','image/webp','application/pdf'].includes(GeminiScannerService.normalizeMimeType(file))){setError('Choisis un JPG, PNG, WebP ou PDF de 4 Mo maximum.');return;}
    if(attachment&&scan?.ok)patch({amount:undefined,vendor:'',invoiceNumber:'',description:'',date:swissToday(),lines:[newLine(initialIntent)],sourceCurrency:'CHF',sourceAmount:undefined,sourceNetAmount:undefined,sourceVatRate:undefined,sourceVatAmount:undefined,scanModel:undefined,sourceDocumentType:undefined,sourceOrderNumber:undefined,sourceTotalBasis:undefined});
    scanLocked.current=true;setBusy(true);setError('');setAttempted(false);setScan(null);setReviewedFields([]);
    try {
      const proofDataUrl=await GeminiScannerService.fileToDataUrl(file);
      const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
      const documentHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      if(!mounted.current)return;
      setAttachment(file);
      patch({proofDataUrl,proofFileName:file.name,proofType:GeminiScannerService.normalizeMimeType(file),documentHash});
      const outcome=await GeminiScannerService.scanDocument(file);
      if(!mounted.current)return;
      setScan(outcome);
      if(!outcome.ok || !outcome.result){setError(outcome.error||'Le scan n’a pas abouti. Les champs restent modifiables.');return;}
      const result=outcome.result;
      const total=invoiceTotalProposal(result);
      const description=invoicePurchaseDescription(result);
      const lines=result.items.map(item=>({id:item.id,description:[item.name,item.variant].filter(Boolean).join(' · '),kind:scanKind(item.kind),amount:result.currency==='CHF'?(item.amountTTC??undefined):undefined,quantity:item.quantity??undefined,unit:item.unit,stockAction:'none' as const,equipmentAction:'none' as const,stockCategory:item.stockCategory,sourceReference:item.reference,evidence:[item.reference?`Réf. ${item.reference}`:'',item.evidence].filter(Boolean).join(' · ')}));
      manuallyClassified.current.clear();
      patch({vendor:result.vendor,date:result.date,...scannedPayment(result,swissToday()),invoiceNumber:result.invoiceNumber,description,category:result.category,amount:total.amount,lines:lines.length?lines:[{...newLine(),description:description||'Achat',amount:total.amount}],sourceCurrency:result.currency,sourceAmount:result.amountTTC??undefined,sourceDocumentType:result.documentType,sourceOrderNumber:result.orderNumber,sourceTotalBasis:total.calculated?'line_sum':result.amountTTC!==null?'printed':undefined,sourceNetAmount:result.amountHT??undefined,sourceVatRate:result.tvaRate??undefined,sourceVatAmount:result.tvaAmount??undefined,scanModel:outcome.model,documentHash});
    }catch(e:any){if(mounted.current)setError(e.message||'Lecture indisponible. Saisis les informations manuellement.');}
    finally{scanLocked.current=false;if(mounted.current){setBusy(false);setShowForm(true);}}
  };
  const save=async()=>{
    if(saveLocked.current||scanLocked.current)return;
    if(scan?.ok&&scan.result?.documentType==='credit_note'){setError('Ce document est un avoir. Enregistre-le comme remboursement dans Finances, ou joins la facture de l’achat.');return;}
    if(errors.length){setAttempted(true);setError('');focusIssue(shownErrors[0]);return;}
    saveLocked.current=true;setSaving(true);setError('');
    try {
      const id=pendingId||await savePurchaseWithProof(draft);setPendingId(id);
      await confirmPurchase(draft);
      if(mounted.current){onSaved();onClose();}
    }catch(e:any){if(mounted.current){if(isConfirmedWriteRejection(e))setPendingId(null);if(e?.code==='drive/auth-required')setDriveAuthError(true);setError(e.message||'L’enregistrement reste à confirmer.');}}
    finally{saveLocked.current=false;if(mounted.current)setSaving(false);}
  };
  const setTotal=(amount:number|undefined)=>{if(amount!==draft.amount)reviewed('amountTTC');setDraft(previous=>({...previous,amount,lines:previous.lines.length===1?[{...previous.lines[0],amount}]:previous.lines,duplicateConfirmed:false}));};
  const stockCount=draft.lines.filter(line=>line.stockAction!=='none').length;
  const equipmentCount=draft.lines.filter(line=>line.equipmentAction!=='none').length;
  const linkedSummary=[stockCount?stockCount+' entrée'+(stockCount>1?'s':'')+' en stock':'',equipmentCount?equipmentCount+' fiche'+(equipmentCount>1?'s':'')+' de matériel':''].filter(Boolean).join(' · ');
  const stockOptions=[...stocks.rawMaterials,...stocks.cleaning].map(item=>({value:item.ref,label:item.name,detail:`${item.currentStock} ${item.unit} · ${item.category}`}));
  const equipmentOptions=stocks.equipment.map(item=>({value:item.ref,label:item.name,detail:item.category}));
  return <ModalShell open onClose={()=>{if(!busy&&!saving)onClose();}} dismissible={!busy&&!saving} labelledBy={titleId}>
    <header className="min-h-9 px-3 py-0.5 border-b border-cave-800 flex items-center gap-2 shrink-0">
      <h2 id={titleId} className="text-lg font-semibold text-cave-50 min-w-0 flex-1">{initialIntent==='equipment'?'Acheter du matériel':'Nouvelle dépense'}</h2>
      <button type="button" disabled={busy||saving} onClick={onClose} aria-label="Fermer" className="min-h-7 min-w-7 flex items-center justify-center rounded-control text-cave-400"><X size={16}/></button>
    </header>
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 space-y-2 [&_input:not([type=checkbox])]:min-h-8 [&_input]:py-0.5 [&_select]:min-h-8 [&_select]:py-0.5 [&_[role=textbox]]:min-h-8 [&_[role=textbox]]:py-0.5 [&_label]:text-xs [&_summary]:text-[13px] [&_summary]:min-h-7 [&_button:not([data-primary])]:min-h-7">
    {attempted&&shownErrors.length>0?<div id={validationId} role="alert" className="border border-alert-strong/40 rounded-control bg-alert-strong/5 p-2 text-sm text-alert-strong"><p className="font-medium">À corriger</p><ul>{shownErrors.map(message=><li key={message}><button type="button" onClick={()=>focusIssue(message)} className="min-h-7 text-left underline underline-offset-2">{message}</button></li>)}</ul></div>:null}
    {error?<div ref={errorBox} tabIndex={-1} role="alert" className="rounded-panel bg-attention/10 border border-attention/25 p-3 text-sm text-attention whitespace-pre-line">{error}</div>:null}
    {draft.proofDataUrl&&!busy?<DriveConnection always={driveAuthError} onConnected={()=>{setDriveAuthError(false);setError('');}}/>:null}
    <div className="space-y-2 pb-1" ref={form}>
      <input hidden ref={fileInput} aria-label="Importer un justificatif" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void attach(file);e.target.value='';}}/>
      <input hidden ref={cameraInput} aria-label="Photographier un justificatif" type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void attach(file);e.target.value='';}}/>
      {!attachment&&!busy?showForm?<button type="button" disabled={saving||Boolean(pendingId)} onClick={()=>fileInput.current?.click()} className={`${button} w-full border-cave-700 text-cave-200 flex items-center justify-center gap-2`}><FileText size={18}/>Joindre un justificatif</button>:<section className="py-1 space-y-2">
        <button data-primary type="button" onClick={()=>cameraInput.current?.click()} className="w-full min-h-8 rounded-control bg-ebc-straw text-cave-950 flex items-center justify-center gap-2 text-[13px] font-semibold"><Camera size={16}/>Prendre une photo</button>
        <button type="button" onClick={()=>fileInput.current?.click()} className={`${button} w-full border-cave-600 text-cave-50 flex justify-center items-center gap-2`}><FileText size={18}/>Importer un fichier</button>
        <p className="text-xs text-center text-cave-400">Photo ou PDF · lecture automatique · 4 Mo max.</p>
        {!showForm?<button type="button" onClick={()=>setShowForm(true)} className="min-h-7 w-full text-sm text-cave-200 underline underline-offset-4">Saisir sans justificatif</button>:null}
      </section>:busy||!scan?.ok?<div className="border-t border-cave-700 py-2 flex gap-3 items-center">
        {busy?<Loader2 size={20} className="animate-spin text-ebc-straw shrink-0"/>:<FileText size={20} className="text-hop shrink-0"/>}
        <div className="min-w-0 flex-1"><p role={busy?'status':undefined} className="text-sm font-medium text-cave-50">{busy?'Lecture et vérification…':'Justificatif prêt'}</p><p className="truncate text-xs text-cave-400">{attachment?.name||'Préparation de la photo…'}</p></div>
        {!busy?<button type="button" disabled={saving||Boolean(pendingId)} onClick={()=>fileInput.current?.click()} className="min-h-7 text-sm text-ebc-straw">Changer</button>:null}
      </div>:null}
      {showForm&&!busy?<fieldset disabled={saving||Boolean(pendingId)} className="space-y-2 min-w-0">
      {scan?.ok&&scan.result?<InvoiceScanReview result={scan.result} cached={scan.cached} compact/>:null}
      {draft.proofDataUrl?<div className="flex items-start gap-3"><details className="text-sm text-cave-200 flex-1 min-w-0"><summary className="min-h-7 cursor-pointer flex items-center gap-2"><FileText size={16}/>Voir le justificatif</summary>{draft.proofType?.startsWith('image/')?<img src={draft.proofDataUrl} alt="Justificatif source" className="w-full rounded-panel"/>:<a href={draft.proofDataUrl} download={draft.proofFileName} className="text-ebc-straw min-h-7 flex items-center">Ouvrir le PDF original</a>}</details>{scan?.ok?<button type="button" onClick={()=>fileInput.current?.click()} className="text-sm text-ebc-straw min-h-7">Changer</button>:null}</div>:null}
      <div className={hints.amountTTC?uncertainClass:''}><Field label="Total TTC en CHF" htmlFor="purchase-total"><NumberInput id="purchase-total" aria-describedby={[hints.amountTTC?'scan-hint-amountTTC':'',attempted&&shownErrors.some(issue=>issue.includes('total'))?validationId:''].filter(Boolean).join(' ')||undefined} value={draft.amount} onValue={setTotal} emptyValue={undefined} min={0} placeholder="0,00" className={`${inputClass} !text-base font-mono font-semibold tabular-nums min-h-8`}/></Field><ScanHint field="amountTTC" message={hints.amountTTC}/></div>
      {draft.sourceCurrency&&draft.sourceCurrency!=='CHF'?<p className="text-attention text-sm">Original : {draft.sourceAmount??'montant absent'} {draft.sourceCurrency}. Montants à renseigner en CHF.</p>:null}
      <Field label="Pour quoi ?" htmlFor="purchase-description"><TextInput id="purchase-description" aria-label="Pour quoi ?" aria-invalid={attempted&&!draft.description.trim()||undefined} aria-describedby={attempted&&!draft.description.trim()?validationId:undefined} value={draft.description} onChange={description=>{patch({description});if(draft.lines.length===1)updateLine(draft.lines[0].id,{description});}} placeholder={initialIntent==='equipment'?'Fermenteur 30 L, pompe de brassage…':'Malt pour la Pale Ale, entretien de la pompe…'}/></Field>
      <details data-purchase-date data-purchase-options open={Boolean(hints.date)} className={`border-t py-1 ${hints.date?'border-attention/50 bg-attention/5':'border-cave-800'}`}><summary className="min-h-7 cursor-pointer flex items-center gap-2 text-sm text-cave-200"><CalendarDays size={18} className="text-cave-400"/><span className="flex-1">Achat du <strong className="font-medium text-cave-50">{draft.date||'…'}</strong></span><ChevronDown size={14}/></summary><ScanHint field="date" message={hints.date}/><div className="pt-2"><DateField label="Date de l’achat" value={draft.date} onChange={date=>{reviewed('date');patch({date});}} shortcuts={dayShortcuts} monthShortcuts/></div></details>
      <section className={hints.paymentEvidence?`${uncertainClass} space-y-2`:'space-y-2'} aria-label="Règlement"><div role="group" aria-label="État du règlement" className="inline-flex gap-1">{([{value:'paid',label:'Déjà payé'},{value:'unpaid',label:'À payer'}] as const).map(status=><button key={status.value} type="button" aria-pressed={draft.paymentStatus===status.value} onClick={()=>{reviewed('paymentEvidence');patch({paymentStatus:status.value,...(status.value==='paid'&&toIsoDate(draft.paymentDate)>toIsoDate(swissToday())?{paymentDate:swissToday()}:{})});}} className={`${button} ${draft.paymentStatus===status.value?status.value==='paid'?'border-area-finances text-cave-50 bg-area-finances/10':'border-area-finances text-cave-50 bg-area-finances/10':'border-cave-700 text-cave-200'}`}>{status.value==='paid'?<Check size={15} className="inline mr-1.5"/>:null}{status.label}</button>)}</div>
        <ScanHint field="paymentEvidence" message={hints.paymentEvidence}/>
        <details data-purchase-payment data-purchase-options className="text-sm text-cave-200"><summary className="min-h-7 cursor-pointer flex items-center justify-between gap-2"><span>{draft.paymentStatus==='paid'?`Payé le ${draft.paymentDate||'…'}`:draft.dueDate?`Échéance : ${draft.dueDate}`:'Ajouter une échéance'}</span><ChevronDown size={14}/></summary><div className="space-y-2 pb-2">{draft.paymentStatus==='paid'?<><DateField label="Date du paiement" value={draft.paymentDate} onChange={paymentDate=>patch({paymentDate})} shortcuts={dayShortcuts} monthShortcuts/><Field label="Moyen de paiement" htmlFor="purchase-payment-method"><select id="purchase-payment-method" className={inputClass} value={draft.paymentMethod} onChange={e=>patch({paymentMethod:e.target.value as any})}><option value="bank">Compte bancaire / carte</option><option value="cash">Espèces</option><option value="twint">TWINT</option><option value="other">Autre</option></select></Field></>:<DateField label="Échéance (facultative)" value={draft.dueDate} onChange={dueDate=>patch({dueDate})} shortcuts={dayShortcuts} monthShortcuts/>}</div></details>
      </section>
      <details data-purchase-options open={Boolean(hints.vendor||hints.category)} className="border-t border-cave-800 py-1"><summary className="list-none relative pr-6 min-h-7 cursor-pointer text-sm text-cave-200"><ChevronDown size={14} className="absolute right-0 top-1.5"/><span className="block">Fournisseur et catégorie</span><span className="block text-xs text-cave-400 mt-1 break-words">{draft.vendor||'Fournisseur facultatif'} · {categories.find(c=>c.value===draft.category)?.label}</span></summary><div className="space-y-2 pt-2">
      <div className={hints.category?uncertainClass:''}><Field label="Catégorie" htmlFor="purchase-category"><select id="purchase-category" value={draft.category} onChange={e=>{reviewed('category');selectCategory(e.target.value as PurchaseCategory);}} className={inputClass}>{categories.map(category=><option key={category.value} value={category.value}>{category.label}</option>)}</select></Field><ScanHint field="category" message={hints.category}/></div>
      <div className={hints.vendor?uncertainClass:''}><Field label="Fournisseur" htmlFor="purchase-vendor"><TextInput id="purchase-vendor" value={draft.vendor} onChange={vendor=>{reviewed('vendor');patch({vendor});}} placeholder="Nom du fournisseur"/></Field><ScanHint field="vendor" message={hints.vendor}/></div>
      </div></details>
      {plans.length?<details className="border-t border-cave-800 py-1" open={Boolean(selectedPlan)}><summary className="min-h-7 flex items-center text-sm text-cave-200 cursor-pointer">Lier à une dépense prévue (facultatif)</summary><div className="space-y-2 pt-2"><Field label="Dépense prévue" htmlFor="purchase-plan"><select id="purchase-plan" className={inputClass} value={draft.planId||''} onChange={e=>patch({planId:e.target.value||undefined,occurrenceId:undefined})}><option value="">Aucune prévision liée</option>{plans.map(plan=><option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></Field>{selectedPlan?.recurrence?<Field label="Échéance concernée" htmlFor="purchase-occurrence"><select id="purchase-occurrence" className={inputClass} value={draft.occurrenceId||''} onChange={e=>patch({occurrenceId:e.target.value||undefined})}><option value="">Choisir l’échéance</option>{occurrences.map(occurrence=><option key={occurrence.id} value={occurrence.id}>{occurrence.date}</option>)}</select></Field>:null}<p className="text-xs text-cave-400">L’achat remplacera le montant prévu correspondant.</p></div></details>:null}
      <details data-purchase-lines data-purchase-options className="border-t border-cave-800 py-1" open={initialIntent==='equipment'}><summary className="list-none relative pr-6 min-h-7 cursor-pointer text-sm text-cave-200"><ChevronDown size={14} className="absolute right-0 top-1.5"/><span className="block">Articles, stock et matériel · {draft.lines.length}{hints.items?<span className="ml-2 text-attention text-xs">À vérifier</span>:null}</span><span className="block text-xs text-cave-400 mt-1">{[...new Set(draft.lines.map(line=>kinds.find(kind=>kind.value===line.kind)?.label))].join(' · ')}</span>{linkedSummary?<span className="block mt-1 text-cave-200">{linkedSummary}</span>:null}</summary><ScanHint field="items" message={hints.items}/><div className="space-y-2 pt-2"><div className="flex justify-between gap-2 items-center"><h3 className="font-semibold text-cave-50">Ce que tu achètes</h3>{draft.lines.length>1?<button type="button" className="text-xs text-cave-400 min-h-7" onClick={()=>patch({lines:[{...newLine(),description:draft.description,kind:'other',amount:draft.amount}]})}>Regrouper en une dépense</button>:null}</div>
        {scan?.ok?<p className="text-xs text-cave-400 leading-relaxed">Les types d’achat sont proposés depuis le justificatif. Tu choisis ensuite les entrées en stock et les fiches matériel.</p>:null}
        {draft.lines.map((line,index)=><article data-purchase-line key={line.id} className="border-t border-cave-700 py-2 space-y-2">
          {!simplePurchase&&<div className="flex items-center gap-2"><span className="text-xs text-cave-400 w-4">{index+1}</span><div className="flex-1 min-w-0"><TextInput aria-label={`Libellé ligne ${index+1}`} value={line.description} onChange={description=>updateLine(line.id,{description})} placeholder="Article ou prestation"/></div>{draft.lines.length>1?<button type="button" aria-label={`Retirer la ligne ${index+1}`} onClick={()=>patch({lines:draft.lines.filter(item=>item.id!==line.id)})} className="min-h-7 min-w-7 text-cave-400 flex justify-center items-center"><Trash2 size={17}/></button>:null}</div>}
          <div className={simplePurchase?'':'grid grid-cols-[1fr_7.5rem] gap-2'}><Field label="Type d’achat"><select aria-label={`Nature ligne ${index+1}`} value={line.kind} onChange={e=>{manuallyClassified.current.add(line.id);updateLine(line.id,{kind:e.target.value as PurchaseLineDraft['kind'],stockAction:'none',equipmentAction:'none'});}} className={inputClass}>{kinds.map(kind=><option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></Field>{!simplePurchase&&<Field label="TTC (CHF)"><NumberInput aria-label={`Montant ligne ${index+1}`} value={line.amount} onValue={amount=>{updateLine(line.id,{amount});if(draft.lines.length===1)patch({amount});}} emptyValue={undefined} className={`${inputClass} tabular-nums`}/></Field>}</div>
          {line.evidence?<details className="text-xs text-cave-400"><summary className="cursor-pointer min-h-8 flex items-center">Voir l’extrait du document</summary><p className="text-cave-200 leading-relaxed">{line.evidence}</p></details>:null}
          {['ingredient','packaging','cleaning'].includes(line.kind)?<div className="space-y-2"><label className="text-sm text-cave-200 flex items-center gap-2"><Package size={16}/>Réception en stock</label><select aria-label={`Stock ligne ${index+1}`} value={line.stockAction} onChange={e=>updateLine(line.id,{stockAction:e.target.value as any})} className={inputClass}><option value="none">Aucun mouvement de stock</option><option value="existing">Ajouter à un article existant</option><option value="new">Créer un nouvel article</option></select>{line.stockAction==='existing'?<Combobox ariaLabel="Article" value={line.stockRef||''} onChange={stockRef=>updateLine(line.id,{stockRef})} options={stockOptions} placeholder="Chercher dans le stock"/>:null}{line.stockAction!=='none'?<div className="grid grid-cols-2 gap-2"><Field label="Quantité reçue"><NumberInput aria-label={`Quantité ligne ${index+1}`} value={line.quantity} onValue={quantity=>updateLine(line.id,{quantity})} emptyValue={undefined} min={0} className={inputClass}/></Field><Field label="Unité lue / reçue"><TextInput aria-label={`Unité ligne ${index+1}`} value={line.unit} onChange={unit=>updateLine(line.id,{unit})} placeholder="kg, g, L, sachet…"/></Field></div>:null}</div>:null}
          {line.kind==='equipment'||line.kind==='maintenance'?<div className="space-y-2"><Field label={line.kind==='equipment'?'Fiche matériel':'Matériel entretenu'}><select aria-label={`Matériel ligne ${index+1}`} value={line.equipmentAction} onChange={e=>updateLine(line.id,{equipmentAction:e.target.value as any})} className={inputClass}><option value="none">Ne pas lier de matériel</option>{line.kind==='equipment'?<option value="new">Créer la fiche de ce matériel</option>:null}<option value="existing">Lier un matériel déjà présent</option></select></Field>{line.equipmentAction==='existing'?<Combobox ariaLabel="Matériel" value={line.equipmentRef||''} onChange={equipmentRef=>updateLine(line.id,{equipmentRef})} options={equipmentOptions} placeholder="Chercher un matériel"/>:null}{line.equipmentAction==='new'?<p className="text-xs text-cave-400">La fiche reprendra le prix et la date de cet achat. L’amortissement se renseigne dans Finances → Annuel.</p>:null}</div>:null}
        </article>)}
        <button type="button" disabled={draft.lines.length>=35} onClick={()=>patch({lines:[...draft.lines,newLine()]})} className={`${button} border-dashed border-cave-600 text-cave-200 w-full flex justify-center items-center gap-2`}><Plus size={17}/>Ajouter une ligne</button>
        {draft.lines.length>1?<p className={`text-sm text-right ${Math.abs(draft.lines.reduce((s,line)=>s+(line.amount||0),0)-(draft.amount||0))>0.005?'text-attention':'text-cave-400'}`}>Détail : {money(draft.lines.reduce((sum,line)=>sum+(line.amount||0),0))} / {money(draft.amount||0)}</p>:null}
      </div></details>
      <details className="border-t border-cave-800 py-1"><summary className="min-h-7 flex items-center text-sm text-cave-400 cursor-pointer">Référence et TVA du document{hints.invoiceNumber||hints.tvaAmount||hints.tvaRate?<span className="ml-2 text-attention text-xs">À vérifier</span>:null}</summary><div className="space-y-2 pt-2">{draft.sourceOrderNumber?<p className="text-sm text-cave-200">Commande n° {draft.sourceOrderNumber}</p>:null}<Field label="N° de facture" htmlFor="purchase-invoice-number"><TextInput id="purchase-invoice-number" value={draft.invoiceNumber} onChange={invoiceNumber=>{reviewed('invoiceNumber');patch({invoiceNumber});}}/></Field><ScanHint field="invoiceNumber" message={hints.invoiceNumber}/><div className="grid grid-cols-2 gap-2"><Field label="TVA source (CHF)" htmlFor="purchase-vat"><NumberInput id="purchase-vat" value={draft.sourceVatAmount} onValue={sourceVatAmount=>{reviewed('tvaAmount');patch({sourceVatAmount});}} emptyValue={undefined} className={inputClass}/></Field><Field label="Taux source (%)" htmlFor="purchase-vat-rate"><NumberInput id="purchase-vat-rate" value={draft.sourceVatRate===undefined?undefined:draft.sourceVatRate*100} onValue={value=>patch({sourceVatRate:value===undefined?undefined:value/100})} emptyValue={undefined} className={inputClass}/></Field></div><ScanHint field="tvaAmount" message={hints.tvaAmount}/><ScanHint field="tvaRate" message={hints.tvaRate}/><p className="text-xs text-cave-400">Sans assujettissement TVA, le montant TTC est la dépense. La TVA lue reste conservée avec la source.</p></div></details>
      {duplicates.length?<label className="flex gap-3 p-3 rounded-panel border border-attention/30 text-sm text-attention"><input id="purchase-duplicate" type="checkbox" className="h-6 w-6 shrink-0" checked={Boolean(draft.duplicateConfirmed)} onChange={e=>setDraft(previous=>({...previous,duplicateConfirmed:e.target.checked}))}/><span>Achat similaire : {duplicates[0].description}, {duplicates[0].date}. J’ai vérifié : il s’agit bien d’un autre achat.</span></label>:null}
      {draft.proofDataUrl?<p className="text-xs text-cave-400">Le justificatif sera rangé dans ton Drive privé à l’enregistrement.</p>:null}
      </fieldset>:null}
    </div>
    </div>
    {showForm&&!busy?<footer className={'shrink-0 min-h-9 px-3 py-0.5 border-t border-cave-800 flex items-center justify-end'+(keyboardInset?'':' pb-safe')}><button type="button" disabled={saving} onClick={()=>void save()} className={button+' min-h-8 bg-ebc-straw border-ebc-straw text-cave-950 disabled:opacity-40 inline-flex items-center justify-center gap-1.5 font-semibold'}>{saving?<Loader2 size={14} className="animate-spin"/>:<Check size={14}/>} {saving?'Enregistrement…':pendingId?'Vérifier la synchronisation':scan?.ok?'Confirmer et enregistrer':'Enregistrer la dépense'}</button></footer>:null}
  </ModalShell>;
}
