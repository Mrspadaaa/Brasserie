import React,{useState,useRef,useEffect,useId,useMemo} from 'react';
import { flushSync } from 'react-dom';
import { Camera,FileText,Plus,Trash2,Check,Loader2,Package,CalendarDays,ChevronDown,AlertCircle,X } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { Field,inputClass } from '../FormNav';
import { TextInput } from '../TextInput';
import { NumberInput } from '../NumberInput';
import { DateField,swissToday,toIsoDate } from '../DateField';
import { Combobox } from '../Combobox';
import { StorageService } from '../../services/storage';
import { GeminiScannerService,type ScanOutcome,type ScannedLineKind } from '../../services/geminiScanner';
import { savePurchaseWithProofReceipt,confirmPurchase,canCloseWithoutAck,watchPurchaseConfirmation,validatePurchase,sansCetteSaisie,purchaseDuplicates,purchaseDuplicateReasons,purchaseProofAttachable,attachProofToPurchase,purchaseSimilarOrders,purchaseSameFile,purchaseSameOrder,proposeMillingSurcharges,confirmMillingSurcharge,type PurchaseDraft,type PurchaseLineDraft } from '../../services/purchaseEntry';
import { STOCK_LINE_PROPOSALS_ENABLED, STOCK_PROPOSAL_KINDS, PROPOSAL_WEIGHT_MARK, matchStockLine, formatUnitLink, isReadableUnit } from '../../services/stockLineMatching';
import { isConfirmedWriteRejection } from '../../services/firestoreRepo';
import { proofQueueAvailable } from '../../services/proofQueue';
import { FirebaseAuthService } from '../../services/firebaseAuth';
import { normalize } from '../../services/search';
import type { DriveProofReceipt } from '../../services/financeDocuments';
import type { FinanceCategory,StockItem } from '../../types';
import { FinanceService } from '../../services/financeService';
import { planOccurrences } from '../../domain/finance/forecast';
import { lineMathCheck } from '../../domain/finance/invoicePoints';
import { DriveConnection } from './DriveConnection';
import { PieceDejaSaisie,LienDepense } from './PieceDejaSaisie';
import { confronterQr } from '../../services/qrFacture';
import { lireQrDuFichier,type ResultatQr } from '../../services/qrLecture';
import { invoiceTotalProposal,invoiceFieldHints,patchPurchaseDraft,applyScannedDescription,applyScannedPayment } from '../../services/purchasePrefill';
import { formatCHF } from '../../domain/finance/ledger';
import { useCoarsePointer,useKeyboardInset } from '../useViewport';
import { chipsDeLecture,compteLiens,conversionDe,effetStock,etiquetteVoisin,memeProduit,nomAffiche,parentDeLaMouture,phraseRelation,pireStatut,prixAvecMouture,recalculerLecture,statutAffiche,voisinEtMarque,type Chip } from '../depense/etat';
import { vueQr,resumeQr,fr2 as fr2Qr,type ChampTranchable,type ChoixChamps } from '../depense/qrVue';
import { Sceau,SansQr,DuelTotal,TemoinSomme,BoutonPhotoQr,FicheQr } from '../depense/Qr';
import { articleNeufDe,ligneDeBrouillon,type ArticleNeuf } from '../../domain/stock/articleNeuf';
import { nomDeFiche,type Catalogues } from '../../domain/stock/fiche';
import { donneesDeLigne,nomsPris,pliee,type MembreVirtuel } from '../../services/stockLineMatching';
import { ChipsBar,BandeCollante } from '../depense/Verdict';
import { InvoiceScanReview } from './InvoiceScanReview';
import { LigneTicket,Interrupteur } from '../depense/Ticket';
import type { LienStock } from '../depense/Pictos';
import type { ApercuDepense } from '../depense/types';

export interface ExpenseSheetProps { onClose:()=>void;onSaved:(receipt?:DriveProofReceipt)=>void;initialIntent?:'expense'|'equipment';existingEquipmentId?:string;startWithScan?:boolean;initialPlanId?:string;apercu?:ApercuDepense;
  /** dp-doublon : ouvre la fiche d'une dépense déjà enregistrée (la feuille se ferme d'abord). Absent : « Fermer » seulement. */
  onOpenExpense?:(id:string)=>void }
const kinds:Array<{value:PurchaseLineDraft['kind'];label:string}>=[{value:'ingredient',label:'Ingrédients'},{value:'packaging',label:'Emballages'},{value:'cleaning',label:'Nettoyage'},{value:'equipment',label:'Matériel durable'},{value:'maintenance',label:'Entretien / réparation'},{value:'service',label:'Service'},{value:'shipping',label:'Livraison'},{value:'discount',label:'Remise'},{value:'other',label:'Autre'}];
type PurchaseCategory=Exclude<FinanceCategory,'apports'|'recettes'>;
const categories:Array<{value:PurchaseCategory;label:string}>=[{value:'brassage',label:'Brassage'},{value:'materiel',label:'Matériel'},{value:'nettoyage',label:'Nettoyage'},{value:'chargesFixes',label:'Charges fixes'},{value:'renovation',label:'Local'},{value:'divers',label:'Autre'}];
const money=(n:number)=>formatCHF(Math.round(n*100));
const newLine=(intent='expense'):PurchaseLineDraft=>({id:crypto.randomUUID(),description:'',kind:intent==='equipment'?'equipment':'ingredient',unit:'',stockAction:'none',equipmentAction:intent==='equipment'?'new':'none'});
const scanKind=(kind:ScannedLineKind):PurchaseLineDraft['kind']=>kind==='stock'?'ingredient':kind==='unknown'?'other':kind;
const button='min-h-7 rounded-control px-2 text-[13px] font-medium border transition-colors';
const dayShortcuts=[{label:'Hier',offsetDays:-1},{label:"Aujourd’hui",offsetDays:0},{label:'Demain',offsetDays:1}];
/** Une date `JJ.MM.AAAA` qui existe au calendrier (31.02 n'en est pas une). */
const dateValide=(swiss:string):boolean=>{const iso=toIsoDate(swiss);if(!iso)return false;const t=new Date(`${iso}T00:00:00Z`);return !Number.isNaN(t.getTime())&&t.toISOString().slice(0,10)===iso;};
const uncertainClass='rounded-control border border-attention/50 bg-attention/5 p-2';
const STOCK_KINDS=['ingredient','packaging','cleaning'];
const fr=(n:number)=>String(n).replace('.',',');
/**
 * Ce que le reçu de Drive permet de dire du justificatif rangé. Chaque morceau n'est dit que s'il est dans le reçu : le dossier s'il est rendu,
 * le nom s'il est rendu, « empreinte vérifiée » si et seulement si `verified === true`. Le lien n'est gardé que s'il est en https sur drive.google.com.
 */
export function receiptSentence(receipt:DriveProofReceipt):{text:string;link?:string} {
  const text=`Justificatif rangé ${receipt.folder?`dans « ${receipt.folder} »`:'sur ton Drive'}${receipt.fileName?` sous « ${receipt.fileName} »`:''}${receipt.verified===true?', empreinte vérifiée':''}.`;
  let link:string|undefined;
  try{const url=new URL(receipt.webViewLink??'');if(url.protocol==='https:'&&url.hostname==='drive.google.com')link=url.href;}catch{/* adresse illisible : aucun lien */}
  return link?{text,link}:{text};
}
function ReceiptLine({receipt}:{receipt:DriveProofReceipt}) {
  const {text,link}=receiptSentence(receipt);
  return <>{text}{link?<> <a href={link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-ebc-straw">Ouvrir dans Drive</a></>:null}</>;
}
function ScanHint({field,message}:{field:string;message?:string}) {
  return message?<p id={`scan-hint-${field}`} className="text-xs text-attention leading-relaxed flex gap-1.5 mt-1.5"><AlertCircle size={14} className="shrink-0 mt-0.5"/><span><strong className="font-medium">À confirmer · </strong>{message}</span></p>:null;
}

/** La phrase d'une fiche liée : « fiche Cascade US · approchée (pas exactement la bonne) ». Le nom se lit dans le catalogue ; sans lui (pas encore chargé), « fiche liée ». */
function phraseFiche(fiche:{id:string;approchee:boolean},catalogues:Catalogues):string {
  const nom=nomDeFiche(fiche.id,catalogues);
  return `fiche ${nom??'liée'}${fiche.approchee?' · approchée (pas exactement la bonne)':''}`;
}
/** Le nom de l'article neuf : pré-rempli (nom proposé), modifiable ; ce qui est tapé n'est jamais écrasé ; vidé, il rend la main au nom proposé. */
function NomArticle({index,line,neuf,prisParAutre,onNom}:{index:number;line:PurchaseLineDraft;neuf:ArticleNeuf;prisParAutre:boolean;onNom:(nom:string|undefined)=>void}) {
  /* Ses chiffres seulement : ce qui sera écrit sur l'article (α, EBC, origine) ; une valeur inconnue ne s'affiche pas. */
  const valeurs=[neuf.alphaPct!==undefined?`α ${fr(neuf.alphaPct)}`:'',neuf.colorEbc!==undefined?`${fr(neuf.colorEbc)} EBC`:'',neuf.origin?`origine ${neuf.origin}`:''].filter(Boolean).join(' · ');
  return <div className="space-y-1">
    <Field label="Nom de l’article"><TextInput aria-label={`Nom de l’article, ligne ${index+1}`} value={line.articleName??neuf.name} onChange={nom=>onNom(nom===''?undefined:nom)} placeholder={neuf.name}/></Field>
    {prisParAutre?<p role="alert" className="text-xs text-attention">Un article porte déjà ce nom : relie-le ou change le nom.</p>:null}
    {valeurs||neuf.fiche?<p className="flex flex-wrap gap-x-2 text-xs text-cave-200">{valeurs?<span data-dp-valeurs className="font-mono text-cave-200">{valeurs}</span>:null}{neuf.fiche?<span data-dp-fiche>{`fiche ${neuf.nomFiche??'liée'}${neuf.fiche.approchee?' · approchée (pas exactement la bonne)':''}`}</span>:null}</p>:null}
  </div>;
}

export function ExpenseSheet({onClose,onSaved,initialIntent='expense',existingEquipmentId,startWithScan=false,initialPlanId,apercu:apercuProp,onOpenExpense}:ExpenseSheetProps) {
  /* Le banc de développement : la prop n'existe qu'en développement (éliminée du bundle de production) ; elle remplace la lecture et l'enregistrement. */
  const apercu=import.meta.env.DEV?apercuProp:undefined;
  const [draft,setDraft]=useState<PurchaseDraft>(()=>{
    const plan=initialPlanId?FinanceService.getPlans().find(p=>p.id===initialPlanId):undefined;
    return {submissionId:crypto.randomUUID(),date:swissToday(),vendor:plan?.vendor??'',invoiceNumber:'',description:plan?.title??'',planId:initialPlanId,category:initialIntent==='equipment'?'materiel':'brassage',lines:[{...newLine(initialIntent),description:plan?.title??'',...(existingEquipmentId?{equipmentAction:'existing' as const,equipmentRef:existingEquipmentId}: {})}],paymentStatus:'paid',paymentMethod:'bank',paymentDate:swissToday(),dueDate:'',sourceCurrency:'CHF'};
  });
  const [scan,setScan]=useState<ScanOutcome|null>(null),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[attachment,setAttachment]=useState<File|null>(null),[pendingId,setPendingId]=useState<string|null>(null);
  const [showForm,setShowForm]=useState(!startWithScan);
  /* Le survol d’un fichier au-dessus de la zone, sur ordinateur. */
  const [dropping,setDropping]=useState(false);
  const coarse=useCoarsePointer();
  const [attempted,setAttempted]=useState(false);
  const keyboardInset=useKeyboardInset();
  const titleId=useId(),validationId=useId();
  const fileInput=useRef<HTMLInputElement>(null),cameraInput=useRef<HTMLInputElement>(null),scanLocked=useRef(false),mounted=useRef(true),saveLocked=useRef(false),pendingRef=useRef(false),proofSent=useRef(false),proofAttached=useRef(false),queuedRef=useRef(false),form=useRef<HTMLDivElement>(null),errorBox=useRef<HTMLDivElement>(null);
  const scroller=useRef<HTMLDivElement>(null),bandeauRef=useRef<HTMLDivElement>(null);
  const manuallyClassified=useRef(new Set<string>());
  /* Lignes dont l'article de stock vient de la lecture : une proposition, montrée comme telle jusqu'au choix du brasseur. */
  const proposedStock=useRef(new Set<string>());
  /* L'article proposé par la lecture pour chaque ligne : l'interrupteur « oui » le repose explicitement (jamais l'ancien `stockRef` resté dans la ligne). */
  const proposedRef=useRef(new Map<string,string>());
  /* Les voisins vus à la lecture (même nom propre, autre α) : une chip qui reste, barrée une fois la ligne traitée. Lecture seule, rien n'est lié. */
  const voisins=useRef(new Map<string,{article:StockItem;marque:string}>());
  /* R6 : les lignes que le choix « Créer un nouvel article » a reliées (nom déjà au stock) : dit sous le choix. */
  const relieAuto=useRef(new Map<string,string>());
  /* Une ligne s'ouvre d'elle-même seulement à sa création si elle est à compléter ; ensuite le brasseur décide. */
  const lineStartsOpen=useRef(new Map<string,boolean>());
  const [attachedTo,setAttachedTo]=useState<string|null>(null);
  /* Le reçu que Drive a rendu pour le justificatif rangé (dossier, nom, empreinte, lien) : seul ce qu'il dit est affiché. */
  const [receipt,setReceipt]=useState<DriveProofReceipt|undefined>();
  /* Un envoi de plus de 15 s continue : un état à dire (son texte), pas une erreur. */
  const [proofSending,setProofSending]=useState('');
  /* « Même achat » choisi pour cette dépense et ce document : le choix n'agit pas seul, l'action du pied dit ce qui va se
     passer ; un autre justificatif demande un nouveau choix. */
  const [sameAs,setSameAs]=useState<string|null>(null);
  /* S8 : un signal (autre numéro, même commande, même total). État d'écran à part : il ne touche jamais `duplicateConfirmed` et ne bloque jamais. */
  const [similarState,setSimilarState]=useState<{id:string;choix:'same'|'other'}|null>(null);
  /* dp-doublon : l'id de la dépense dont ce fichier est l'original (même empreinte) : dit sans lecture ; « Lire quand même » le lève. */
  const [deja,setDeja]=useState<string|null>(null);
  const [payeForme,setPayeForme]=useState(false),[tableauMoutures,setTableauMoutures]=useState(false),[laissees,setLaissees]=useState(false);
  const [readCount,setReadCount]=useState(0);
  const [driveAuthError,setDriveAuthError]=useState(false);
  const [driveTick,setDriveTick]=useState(0);
  /* L'état Drive ne se dit qu'une fois le jeton vérifié (renouvellement silencieux) : jamais « Drive à connecter » quelques secondes quand Drive est prêt. */
  const [driveVerifie,setDriveVerifie]=useState(()=>Boolean(apercu));
  const [reviewedFields,setReviewedFields]=useState<string[]>([]);
  const [panel,setPanel]=useState<'tva'|'paye'|null>(null);
  const [preuveOuverte,setPreuveOuverte]=useState(false);
  /* z2 (D246) : le QR-facture lu dans le téléphone. `undefined` : aucune lecture lancée ; `null` : elle court ; sinon son résultat. Rien n'est écrit : le contrôle vit dans l'écran. */
  const [qrRes,setQrRes]=useState<ResultatQr|null|undefined>(undefined);
  /* Le choix du brasseur devant un total contredit : `lu` (la page) ou `qr`. Le champ ne change qu'à ce geste. */
  const [qrChoix,setQrChoix]=useState<'lu'|'qr'|null>(null);
  const [qrOuvert,setQrOuvert]=useState<boolean|undefined>(undefined);
  const [qrSurligne,setQrSurligne]=useState(false);
  /* z2 (champ contredit hors total) : les champs dont le brasseur a ouvert la rangée (chip réglée) et la rangée surlignée un instant. */
  const [qrVus,setQrVus]=useState<Set<string>>(new Set());
  /* Le choix du brasseur sur chaque champ en écart (date, devise, créancier) : seul geste qui règle la chip, efface la marque et écrit dans la dépense. Ouvrir la feuille ou toucher la chip ne choisit rien. */
  const [qrChoixChamps,setQrChoixChamps]=useState<ChoixChamps>({});
  const qrAvantChamps=useRef<Partial<Record<ChampTranchable,string>>>({});
  const [qrLigne,setQrLigne]=useState<string|null>(null);
  const qrJeton=useRef(0),qrAvant=useRef<number|undefined>(undefined),qrPhoto=useRef<HTMLInputElement>(null);
  const [reglees,setReglees]=useState<Set<string>>(new Set());
  const [done,setDone]=useState<DriveProofReceipt|null>(null);
  const [online,setOnline]=useState(apercu?apercu.reseau:typeof navigator==='undefined'||navigator.onLine!==false);
  const hints=scan?.ok&&scan.result?Object.fromEntries(Object.entries(invoiceFieldHints(scan.result)).filter(([field])=>!reviewedFields.includes(field))):{};
  const reviewed=(field:string)=>setReviewedFields(previous=>previous.includes(field)?previous:[...previous,field]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{const up=()=>setOnline(true),down=()=>setOnline(false);window.addEventListener('online',up);window.addEventListener('offline',down);return()=>{window.removeEventListener('online',up);window.removeEventListener('offline',down);};},[]);
  /*
   * ⚠️ Une facture est d'abord un DOCUMENT, pas une photo. Arriver ici depuis le
   * bouton d'action ouvre donc le sélecteur de fichiers — l'explorateur sur
   * Android, la fenêtre d'ouverture sur ordinateur — et jamais l'appareil photo.
   * Si le navigateur refuse cette ouverture automatique, la zone de dépôt et son
   * bouton restent en place : on ne perd aucun chemin.
   */
  const pickedOnOpen=useRef(false);
  useEffect(()=>{
    if(!draft.proofDataUrl||driveVerifie)return;
    let actif=true;
    FirebaseAuthService.ensureDriveAccessToken().catch(()=>null).finally(()=>{if(actif){setDriveVerifie(true);setDriveTick(t=>t+1);}});
    return()=>{actif=false;};
  },[draft.proofDataUrl,driveVerifie]);
  useEffect(()=>{
    if(!startWithScan||pickedOnOpen.current||apercu)return;
    pickedOnOpen.current=true;
    fileInput.current?.click();
  },[startWithScan]);
  useEffect(()=>{if(error)errorBox.current?.scrollIntoView?.({block:'nearest'});},[error]);
  /* S6 (T8) : le catalogue plein des houblons, chargé à la demande (fonction existante `chargerCataloguePlein` de l'index) dès qu'une ligne crée un article ; hors
     ligne ou échec : aucune fiche (le nom est proposé quand même). Jamais Gemini, jamais le réseau. */
  const [catalogues,setCatalogues]=useState<Catalogues>({});
  const cacheNeuf=useRef(new Map<string,{sig:string;neuf:ArticleNeuf}>());
  const creeUnArticle=draft.lines.some(l=>l.stockAction==='new');
  useEffect(()=>{
    if(!creeUnArticle||catalogues.houblons)return;
    let vivant=true;
    import('../../domain/hopIndex/v4/data').then(data=>data.chargerCataloguePlein()).then(houblons=>{if(vivant&&mounted.current)setCatalogues({houblons});}).catch(()=>undefined);
    return()=>{vivant=false;};
  },[creeUnArticle,catalogues.houblons]);
  const stocks=apercu?.stocks??StorageService.getStocks(),transactions=apercu?.transactions??StorageService.getTransactions();
  const plans=FinanceService.getPlans().filter(plan=>(plan.status==='active'||plan.source==='equipment'&&plan.status==='draft')&&plan.direction==='out'),selectedPlan=plans.find(plan=>plan.id===draft.planId);
  const occurrences=selectedPlan?.recurrence?planOccurrences(selectedPlan,`${new Date().getFullYear()-1}-01-01`,`${new Date().getFullYear()+2}-12-31`):[];
  const patch=(value:Partial<PurchaseDraft>)=>{setDraft(previous=>patchPurchaseDraft(previous,value,swissToday()));};
  /* Le prix unitaire lu vaut pour l'unité imprimée : une autre unité tapée le retire (la même, non). */
  const updateLine=(id:string,value:Partial<PurchaseLineDraft>)=>{setDraft(previous=>({...previous,lines:previous.lines.map(line=>line.id===id?{...line,...value,...(value.unit!==undefined&&value.unit!==line.unit?{unitPrice:undefined}:{})}:line)}));};
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
    else if(message.includes('doublon'))selector='#purchase-duplicate button';
    else if(message.startsWith('Chaque ligne')&&simplePurchase)selector=draft.description.trim()?'#purchase-total':'#purchase-description';
    if(selector)return root.querySelector<HTMLElement>(selector);
    const index=draft.lines.findIndex(line=>message.startsWith(line.description+' :'));
    const line=index>=0?root.querySelectorAll<HTMLElement>('[data-purchase-line]')[index]:null;
    if(line){
      if(message.includes('quantité'))return line.querySelector<HTMLElement>('[aria-label^="Quantité ligne"]');
      if(message.includes('article de stock'))return line.querySelector<HTMLElement>('[role="combobox"]');
      if(message.includes('matériel existant'))return line.querySelector<HTMLElement>('[role="combobox"]');
      if(message.includes('convertit')||message.includes('unité à préciser'))return line.querySelector<HTMLElement>('[aria-label^="Unité ligne"]');
      return line.querySelector<HTMLElement>('select');
    }
    return root.querySelector<HTMLElement>('[data-purchase-lines] summary');
  };
  const focusIssue=(message:string)=>{
    let target=issueTarget(message);
    /* D233 : la date du paiement n'est plus un champ par défaut ; une erreur qui la vise la fait apparaître avant d'y mettre le focus. */
    if(!target&&/paiement|échéance/.test(message)){flushSync(()=>{setPanel('paye');setPayeForme(true);});target=issueTarget(message);}
    if(!target){errorBox.current?.focus();return;}
    for(let ancestor=target.parentElement;ancestor&&ancestor!==form.current;ancestor=ancestor.parentElement){
      if(ancestor instanceof HTMLDetailsElement)ancestor.open=true;
    }
    if(target.closest('[data-purchase-payment]'))setPanel('paye');
    target.focus();target.scrollIntoView?.({block:'nearest'});
  };
  /* Le bloc qui suit la lecture : le brouillon se pose sur l'état courant (une description ou une date de paiement tapée n'est jamais écrasée). */
  /* Lit le QR-facture du fichier DANS le téléphone, à côté de Gemini : jamais attendue, jamais bloquante (`lireQrDuFichier` ne lève pas). Un résultat périmé (autre fichier) est jeté. */
  const lancerQr=(file:File)=>{
    const jeton=++qrJeton.current;
    setQrRes(null);setQrOuvert(undefined);
    lireQrDuFichier(file).catch(():ResultatQr=>({statut:'non-verifie',motif:'lecture impossible'})).then(res=>{if(mounted.current&&qrJeton.current===jeton)setQrRes(res);});
  };
  const applyOutcome=(outcome:ScanOutcome,documentHash?:string)=>{
    setScan(outcome);
    if(!outcome.ok || !outcome.result){setError(outcome.error||'Le scan n’a pas abouti. Les champs restent modifiables.');return;}
    const result=outcome.result;
    const total=invoiceTotalProposal(result);
    const stockItems=[...stocks.rawMaterials,...stocks.cleaning];
    proposedStock.current.clear();proposedRef.current.clear();voisins.current.clear();lineStartsOpen.current.clear();setReadCount(count=>count+1);setReglees(new Set());setPanel(null);
    const lines=result.items.map(item=>({id:item.id,description:[item.name,item.variant].filter(Boolean).join(' · '),kind:scanKind(item.kind),amount:result.currency==='CHF'?(item.amountTTC??undefined):undefined,quantity:item.quantity??undefined,unit:item.unit,unitPrice:result.currency==='CHF'?(item.price??undefined):undefined,stockAction:'none' as const,equipmentAction:'none' as const,stockCategory:item.stockCategory,sourceReference:item.reference,evidence:[item.reference?`Réf. ${item.reference}`:'',item.evidence].filter(Boolean).join(' · ')})).map(line=>{
      /* S1 : une proposition, jamais une écriture. Le libellé brut reste la description et l'unité imprimée reste celle de la ligne
         (jamais réécrite, D213) ; ce que l'identité a lu (α, récolte, poids du sachet) va dans l'extrait, avec sa source. */
      const match=STOCK_LINE_PROPOSALS_ENABLED&&(STOCK_PROPOSAL_KINDS as readonly string[]).includes(line.kind)?matchStockLine({description:line.description,unit:line.unit,quantity:line.quantity,vendor:result.vendor??undefined,stockCategory:line.stockCategory,reference:line.sourceReference,kind:line.kind},stockItems):undefined;
      if(!match){const voisin=(STOCK_PROPOSAL_KINDS as readonly string[]).includes(line.kind)?voisinEtMarque(line,stockItems,result.vendor??undefined):undefined;if(voisin)voisins.current.set(line.id,voisin);return line;}
      proposedStock.current.add(line.id);proposedRef.current.set(line.id,match.item.ref);
      if(match.weightUnconfirmed)proposedStock.current.add(line.id+PROPOSAL_WEIGHT_MARK);
      return {...line,stockAction:'existing' as const,stockRef:match.item.ref,evidence:[line.evidence,...(match.deduced.length?[`Libellé : ${line.description}`,...match.deduced]:[])].filter(Boolean).join(' · ')};
    });
    manuallyClassified.current.clear();
    setDraft(previous=>{const proposed=applyScannedDescription(previous,result),description=proposed.description??previous.description;return patchPurchaseDraft(previous,{vendor:result.vendor,date:result.date,...applyScannedPayment(previous,result,swissToday()),invoiceNumber:result.invoiceNumber,...proposed,category:result.category,amount:total.amount,lines:lines.length?lines:[{...newLine(),description:description||'Achat',amount:total.amount}],sourceCurrency:result.currency,sourceAmount:result.amountTTC??undefined,sourceDocumentType:result.documentType,sourceOrderNumber:result.orderNumber,sourceTotalBasis:total.calculated?'line_sum':result.amountTTC!==null?'printed':undefined,sourceNetAmount:result.amountHT??undefined,sourceVatRate:result.tvaRate??undefined,sourceVatAmount:result.tvaAmount??undefined,scanModel:outcome.model,documentHash},swissToday());});
  };
  const attach=async(file:File,lireQuandMeme=false)=>{
    if(scanLocked.current||saveLocked.current)return;
    /* D7 : dès qu'un justificatif est parti sous cette saisie (même `submissionId`, donc même `proof-…` dans Drive), un autre fichier n'est ni lu, ni scanné, ni posé :
       il ne serait jamais envoyé (save() saute l'envoi) ou irait contre l'empreinte de la dépense déjà écrite. Défense en profondeur : les boutons sont déjà désactivés. */
    if(pendingRef.current){setError('L’enregistrement attend sa confirmation : le fichier ne peut plus être changé. Touche « Vérifier la synchronisation ».');return;}
    if(proofAttached.current){setError('Le justificatif est déjà rattaché à cette dépense : le fichier ne peut plus être changé.');return;}
    if(proofSent.current){setError('Ce fichier est déjà parti pour cette saisie. Pour en joindre un autre, ferme et rouvre : rien n’a été enregistré.');return;}
    if(file.size>4*1024*1024 || !['image/jpeg','image/png','image/webp','application/pdf'].includes(GeminiScannerService.normalizeMimeType(file))){setError('Choisis un JPG, PNG, WebP ou PDF de 4 Mo maximum.');return;}
    if(attachment&&scan?.ok)patch({amount:undefined,vendor:'',invoiceNumber:'',...(draft.descriptionSource==='typed'&&draft.description.trim()?{}:{description:'',descriptionSource:undefined}),date:swissToday(),lines:[{...newLine(initialIntent),description:draft.descriptionSource==='typed'?draft.description:''}],sourceCurrency:'CHF',sourceAmount:undefined,sourceNetAmount:undefined,sourceVatRate:undefined,sourceVatAmount:undefined,scanModel:undefined,sourceDocumentType:undefined,sourceOrderNumber:undefined,sourceTotalBasis:undefined});
    scanLocked.current=true;setBusy(true);setError('');setProofSending('');setReceipt(undefined);setAttempted(false);setScan(null);setReviewedFields([]);setSimilarState(null);setDeja(null);qrJeton.current++;setQrRes(undefined);setQrChoix(null);setQrOuvert(undefined);setQrVus(new Set());setQrChoixChamps({});qrAvantChamps.current={};
    try {
      const proofDataUrl=await GeminiScannerService.fileToDataUrl(file);
      const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
      const documentHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      if(!mounted.current)return;
      setAttachment(file);
      patch({proofDataUrl,proofFileName:file.name,proofType:GeminiScannerService.normalizeMimeType(file),documentHash});
      /* Le même fichier qu'une dépense saisie : certain, donc ni lecture ni coût ; le brasseur peut lire quand même. Hors ligne : les dépenses déjà chargées. */
      const meme=lireQuandMeme?undefined:purchaseSameFile(documentHash,transactions,draft.submissionId);
      if(meme){setDeja(meme.id);return;}
      lancerQr(file);
      const outcome=await GeminiScannerService.scanDocument(file);
      if(!mounted.current)return;
      applyOutcome(outcome,documentHash);
    }catch(e:any){if(mounted.current)setError(e.message||'Lecture indisponible. Saisis les informations manuellement.');}
    finally{scanLocked.current=false;if(mounted.current){setBusy(false);setShowForm(true);}}
  };
  /* Le banc de développement pose la lecture simulée sans appeler Gemini ni lire de fichier (état 1 : la lecture reste « en cours »). */
  useEffect(()=>{
    if(!apercu)return;
    const file=new File([''],apercu.fichier.name,{type:apercu.fichier.type});
    setAttachment(file);setShowForm(true);
    patch({proofDataUrl:'data:application/pdf;base64,JVBERi0xLjQK',proofFileName:apercu.fichier.name,proofType:apercu.fichier.type,documentHash:'simule'});
    if(apercu.etat==='1'||apercu.etat==='qr-lecture')setBusy(true);
    else applyOutcome(apercu.outcome,'simule');
    /* Le banc du QR : un vrai fichier fictif, lu par le vrai décodeur du navigateur (la lecture Gemini reste simulée). */
    if(apercu.qrSimule){qrJeton.current++;setQrRes(apercu.qrSimule);}
    else if(apercu.qrFichier){const q=apercu.qrFichier;fetch(q.url).then(r=>r.blob()).then(b=>lancerQr(new File([b],q.name,{type:q.type}))).catch(()=>undefined);}
    const t=setTimeout(()=>{document.body.dataset.apercu=apercu.etat;},120);
    return()=>clearTimeout(t);
  },[]);
  const save=async()=>{
    if(saveLocked.current||scanLocked.current)return;
    if(scan?.ok&&scan.result?.documentType==='credit_note'){setError('Ce document est un avoir. Enregistre-le comme remboursement dans Finances, ou joins la facture de l’achat.');return;}
    // Devant un achat peut-être déjà enregistré, le choix passe avant les champs : « même achat » n'en demande aucun.
    if(errors.length){setAttempted(true);setError('');focusIssue(shownErrors.find(message=>message.includes('doublon'))??shownErrors[0]);return;}
    saveLocked.current=true;setSaving(true);setError('');setProofSending('');
    try {
      let proof=receipt;
      if(apercu){proof=await apercu.enregistrer(draft);setReceipt(proof);}
      else{
      /* `proofSent` ne se pose qu'à un signal sûr : le retour du service (original confirmé dans Drive) ou `drive/in-progress` (plus bas). Jamais avant l'appel. */
      let acked=false;
      if(!pendingId){
        const saved=await savePurchaseWithProofReceipt(draft);if(draft.proofDataUrl)proofSent.current=true;pendingRef.current=true;setPendingId(saved.transactionId);setReceipt(saved.proof);proof=saved.proof;
        /* Le fichier part au Drive en arrière-plan (file locale) : aucun reçu à l'écran. Hors ligne, l'écriture en file locale suffit à fermer ; son accusé est attendu hors de la feuille (T5). */
        if(saved.queued){queuedRef.current=true;if(canCloseWithoutAck(saved.transactionId)){watchPurchaseConfirmation(draft);acked=true;}}
      }
      if(!acked)await confirmPurchase(draft);
      }
      /* Envoi en arrière-plan : la feuille se ferme, le reçu se lit dans la fiche. Chemin synchrone (repli) : le reçu reste affiché jusqu'à « Terminé » ; sans reçu Drive à montrer, la feuille se ferme comme avant. */
      if(mounted.current){if(queuedRef.current){onSaved();onClose();}else{onSaved(proof);if(proof)setDone(proof);else onClose();}}
    }catch(e:any){if(mounted.current){if(isConfirmedWriteRejection(e)){pendingRef.current=false;setPendingId(null);setReceipt(undefined);}if(e?.code==='drive/auth-required')setDriveAuthError(true);if(e?.code==='drive/in-progress'){proofSent.current=true;setProofSending(e.message);}else setError(e.message||'L’enregistrement reste à confirmer.');}}
    finally{saveLocked.current=false;if(mounted.current)setSaving(false);}
  };
  const attachToExisting=async(id:string)=>{
    if(saveLocked.current||scanLocked.current)return;
    saveLocked.current=true;setSaving(true);setError('');setProofSending('');
    try{const proof=await attachProofToPurchase(draft,id);proofAttached.current=true;if(mounted.current){setReceipt(proof);setAttachedTo(id);}}
    catch(e:any){if(mounted.current){if(e?.code==='drive/auth-required')setDriveAuthError(true);if(e?.code==='drive/in-progress'){proofSent.current=true;setProofSending(e.message);}else setError(e.message||'Le justificatif n’a pas été rattaché.');}}
    finally{saveLocked.current=false;if(mounted.current)setSaving(false);}
  };
  const setTotal=(amount:number|undefined)=>{if(amount!==draft.amount)reviewed('amountTTC');setDraft(previous=>({...previous,amount,lines:previous.lines.length===1?[{...previous.lines[0],amount}]:previous.lines,duplicateConfirmed:false}));};
  const stockCount=draft.lines.filter(line=>line.stockAction!=='none').length;
  const equipmentCount=draft.lines.filter(line=>line.equipmentAction!=='none').length;
  const proposedCount=draft.lines.filter(line=>line.stockAction==='existing'&&proposedStock.current.has(line.id)).length;
  const linkedSummary=[stockCount?stockCount+' entrée'+(stockCount>1?'s':'')+' en stock':'',equipmentCount?equipmentCount+' fiche'+(equipmentCount>1?'s':'')+' de matériel':''].filter(Boolean).join(' · ');
  // La candidate la plus forte vient en tête (règle exacte, puis date la plus proche).
  const existing=duplicates[0],existingReasons=existing?purchaseDuplicateReasons(draft,existing):[],attachable=Boolean(existing&&purchaseProofAttachable(draft,existing));
  const sameChosen=Boolean(existing&&sameAs===`${existing.id}|${draft.documentHash??''}`);
  const similar=useMemo(()=>{const id=existing?.id;const order=purchaseSimilarOrders(draft,transactions).find(item=>item.tx.id!==id);if(order)return {...order,gapCents:0};return purchaseSameOrder(draft,transactions).find(item=>item.tx.id!==id);},[draft,transactions,existing?.id]);
  const dejaTx=deja?transactions.find(tx=>tx.id===deja):undefined;
  /* Rang 0 (même fichier) : certain, le titre ne dit pas « peut-être » (critique, 01.11). */
  const memeFichier=existingReasons[0]==='Même fichier déjà joint';
  /* L'écart de dates de la même commande, signé (ce document moins la dépense enregistrée), écrit « +2 j » à côté de la date. */
  const joursEcart=(()=>{if(!similar)return 0;const a=toIsoDate(draft.date),b=toIsoDate(similar.tx.date);return a&&b?Math.round((Date.parse(a)-Date.parse(b))/86_400_000):0;})();
  const similarChoice=similar&&similarState?.id===similar.tx.id?similarState.choix:null;
  const numCourt=(n?:string)=>n?(n.match(/(\d{4,})\D*$/)?.[1]??n):'—';
  const similarAttachable=Boolean(similar&&purchaseProofAttachable(draft,similar.tx));
  const comparison=existing?[{label:'Facture',read:draft.invoiceNumber.trim(),recorded:existing.finance?.invoiceNumber,missing:'sans n°'},{label:'Date',read:draft.date,recorded:existing.date,missing:'absente'},{label:'Total',read:draft.amount===undefined?'':money(draft.amount),recorded:money(existing.amountTTC),missing:'—'}]:[];
  const sameOutcome=attachable?'le justificatif rejoint la dépense existante, sans dépense, stock ni paiement en plus':'rien n’est enregistré, la dépense existante reste telle quelle';
  const attached=attachedTo?transactions.find(tx=>tx.id===attachedTo):undefined;
  const startsOpen=(line:PurchaseLineDraft)=>{if(!lineStartsOpen.current.has(line.id))lineStartsOpen.current.set(line.id,!line.description.trim()||line.amount===undefined);return lineStartsOpen.current.get(line.id);};
  const stockOptions=[...stocks.rawMaterials,...stocks.cleaning].map(item=>({value:item.ref,label:item.name,detail:`${item.currentStock} ${item.unit} · ${item.category}`}));
  const equipmentOptions=stocks.equipment.map(item=>({value:item.ref,label:item.name,detail:item.category}));
  const articleDe=(line:PurchaseLineDraft)=>line.stockAction==='existing'?[...stocks.rawMaterials,...stocks.cleaning].find(item=>item.ref===line.stockRef):undefined;
  const lineStatus=(line:PurchaseLineDraft)=>{
    const stock=line.stockAction==='existing'?stockOptions.find(option=>option.value===line.stockRef)?.label??'article à choisir':line.stockAction==='new'?'nouvel article':'';
    const equipment=line.equipmentAction==='existing'?equipmentOptions.find(option=>option.value===line.equipmentRef)?.label??'matériel à choisir':line.equipmentAction==='new'?'fiche matériel à créer':'';
    const proposed=line.stockAction==='existing'&&proposedStock.current.has(line.id);
    const target=articleDe(line);
    /* D213/D214 : la conversion se voit (« 25 kg → 25 000 g »), une unité illisible se dit (« unité à préciser »), le poids d'un sachet non confirmé aussi. */
    const notes=target?[line.quantity!==undefined&&isReadableUnit(line.unit)?formatUnitLink(line.quantity,line.unit,target.unit,target.category):'',isReadableUnit(line.unit)?'':'unité à préciser',proposed&&proposedStock.current.has(line.id+PROPOSAL_WEIGHT_MARK)?'poids du sachet non confirmé':''].filter(Boolean):[];
    return {meta:[kinds.find(kind=>kind.value===line.kind)?.label,line.quantity!==undefined?`${String(line.quantity).replace('.',',')} ${line.unit}`.trim():''].filter(Boolean).join(' · '),linked:[stock||equipment,...notes].filter(Boolean).join(' · '),proposed};
  };
  /* ------- r2b : le statut, les chips, les liens ------- */
  const result=scan?.ok?scan.result:undefined;
  const recalcul=useMemo(()=>result?recalculerLecture(result,draft):undefined,[result,draft]);
  const statut=result?statutAffiche(result,recalcul):null;
  const points=recalcul?.points??result?.points;
  /* ------- z2 : le QR-facture face à la lecture. La confrontation lit la lecture TELLE QUE REÇUE (jamais le champ tapé) ; elle ne change aucun champ. ------- */
  const confrontation=useMemo(()=>result&&qrRes?.statut==='lu'?confronterQr(qrRes.qr,result):null,[result,qrRes]);
  const vue=qrRes===undefined?null:vueQr(qrRes,confrontation,result??null,qrChoix,{champs:qrChoixChamps,factureVue:qrVus.has('facture')});
  const qrContredit=Boolean(vue?.contredit);
  const qrEcarts=vue?.ecarts??[];
  const statutFinal=statut&&(qrContredit||qrEcarts.length>0)?pireStatut(statut,'disputed'):statut;
  const grandEcran=typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(min-width:1024px)').matches;
  const qrFicheOuverte=Boolean(vue&&vue.lignes.length>0&&(qrOuvert??grandEcran));
  const sommeLignesCts=Math.round(draft.lines.reduce((s,l)=>s+(l.amount??0)*100,0));
  const choisirQr=(source:'lu'|'qr')=>{
    const duel=vue?.duel;
    if(!duel)return;
    if(source==='qr'){if(qrChoix!=='qr')qrAvant.current=draft.amount;setTotal(duel.qrNombre);}
    else{if(qrChoix==='qr')setTotal(qrAvant.current);else reviewed('amountTTC');}
    setQrChoix(source);
  };
  /* Un champ en écart (date, devise, créancier) : « prendre le QR » écrit sa valeur dans la dépense (la date de paiement suit la date comme à la main) et garde l'ancienne ; « garder » ne change rien,
     ou la remet si le QR avait été pris. Ouvrir la feuille ou toucher la chip ne passe jamais par ici. */
  const choisirChamp=(cle:ChampTranchable,source:'lu'|'qr')=>{
    const duelK=vue?.champs?.[cle];
    if(!duelK)return;
    const courant=cle==='date'?draft.date:cle==='creancier'?draft.vendor:(draft.sourceCurrency??'');
    const ecrire=(valeur:string)=>{
      if(cle==='date'){reviewed('date');patch({date:valeur});}
      else if(cle==='creancier'){reviewed('vendor');patch({vendor:valeur});}
      else{reviewed('currency');patch({sourceCurrency:valeur});}
    };
    if(source==='qr'){if(courant!==duelK.qr){qrAvantChamps.current[cle]=courant;ecrire(duelK.qr);}}
    else if(qrChoixChamps[cle]==='qr'&&courant===duelK.qr)ecrire(qrAvantChamps.current[cle]??duelK.lu);
    else reviewed(cle==='creancier'?'vendor':cle==='devise'?'currency':'date');
    setQrChoixChamps(s=>({...s,[cle]:source}));
  };
  const sceauQr=vue?(vue.etat==='sans'?<SansQr/>:<Sceau vue={vue} ouvert={qrFicheOuverte} onClick={()=>setQrOuvert(!qrFicheOuverte)}/>):undefined;
  const photographierQr=()=>qrPhoto.current?.click();
  const sousTotalQr=vue?.duel?<><div className={qrSurligne?'rounded-control outline outline-2 outline-offset-1 outline-attention':''}><DuelTotal duel={vue.duel} choix={qrChoix} onChoix={choisirQr}/></div>{sommeLignesCts===Math.round(vue.duel.qrNombre*100)&&draft.lines.length>1?<TemoinSomme somme={fr2Qr(sommeLignesCts/100)}/>:null}</>:vue?.photographier?<BoutonPhotoQr onClick={photographierQr}/>:undefined;
  const ficheQr=vue?<FicheQr vue={vue} ouvert={qrFicheOuverte} onFermer={()=>setQrOuvert(false)} onPhoto={photographierQr} surligne={qrLigne} choixChamps={qrChoixChamps} onChoixChamp={choisirChamp}/>:null;
  const mouturesPropositions=proposeMillingSurcharges(draft.lines);
  const mouturesLiees=draft.lines.filter((_,i)=>parentDeLaMouture(draft.lines,i)>=0).length;
  const precisIds=new Set(draft.lines.filter(line=>STOCK_KINDS.includes(line.kind)&&line.stockAction!=='none'&&!isReadableUnit(line.unit)).map(line=>line.id));
  const stockKind=(line:PurchaseLineDraft)=>STOCK_KINDS.includes(line.kind);
  const extras:Chip[]=[];
  if(result?.date&&draft.paymentStatus==='paid')extras.push({id:'paye',nom:'Payé le',enjeu:'argent',ligne:null,codes:[],source:'paiement'});
  if(mouturesPropositions.length||mouturesLiees)extras.push({id:'mouture',nom:`mouture ×${mouturesPropositions.length+mouturesLiees}`,enjeu:'stock',ligne:null,codes:[],source:'mouture'});
  const premierMot=(d:string)=>d.trim().split(/[\s,]+/)[0]??d;
  for(const [id,voisinLu] of voisins.current)extras.push({id:`voisin:${id}`,nom:`${premierMot(nomAffiche(draft.lines.find(l=>l.id===id)?.description??'article'))} ${voisinLu.marque}`,enjeu:'stock',ligne:null,codes:[],source:'voisin',cible:id});
  const sommeMoutures=Math.round(mouturesPropositions.reduce((a,p)=>a+(draft.lines.find(l=>l.id===p.lineId)?.amount??0),0)*100);
  /* z2 : devant un total contredit par le QR, la chip ① « Total » vient en tête et renvoie au duel ; elle remplace la chip « Total » du point de somme (même question). */
  const NOM_ECART={facture:'Facture',date:'Date',devise:'Devise',creancier:'Créancier'} as const;
  const chipQr:Chip[]=[...(qrContredit?[{id:'qr',nom:'Total',enjeu:'argent',ligne:null,codes:[],source:'qr'} as Chip]:[]),...qrEcarts.map((k):Chip=>({id:`qr:${k}`,nom:NOM_ECART[k],enjeu:'argent',ligne:null,codes:[],source:'qr',cible:k}))];
  const chips=[...chipQr,...chipsDeLecture(points,extras).filter(c=>!(qrContredit&&c.nom==='Total'&&c.source==='point'))].map(c=>c.source==='mouture'?{...c,nom:`${c.nom}${sommeMoutures>0?` +${(sommeMoutures/100).toFixed(2).replace('.',',')}`:''}`}:c.codes.includes('unite-absente')&&c.ligne?{...c,nom:`${premierMot(nomAffiche(draft.lines.find(l=>l.id===`line-${c.ligne}`)?.description??c.nom))} unité`}:c);
  const ligneDe=(chip:Chip)=>chip.cible??(chip.ligne?`line-${chip.ligne}`:undefined);
  const estRegle=(chip:Chip):boolean=>{
    if(reglees.has(chip.id))return true;
    /* z2 : une chip du QR ne se règle que par un CHOIX (le duel du total, la rangée du champ) ; « Facture » (aucun champ au bandeau) se règle à l'ouverture de sa rangée. */
    if(chip.source==='qr')return chip.cible==='facture'?qrVus.has('facture'):chip.cible?qrChoixChamps[chip.cible as ChampTranchable]!==undefined:(vue?.duel?qrChoix!==null:qrChoixChamps.devise!==undefined);
    if(chip.source==='paiement')return draft.paymentDateBasis!=='document_date';
    /* D233 : le point « Date » se règle quand le brasseur a posé une date valide (jamais par défaut ni par le temps). */
    if(chip.codes.includes('date-absente'))return reviewedFields.includes('date')&&dateValide(draft.date);
    if(chip.source==='mouture')return mouturesPropositions.length===0;
    /* Réglée par un article créé ou choisi ; ⇄ seul (« existing » sans article) la laisse ouverte, comme r2b. */
    if(chip.source==='voisin'){const l=draft.lines.find(x=>x.id===chip.cible);return l?.stockAction==='new'||(l?.stockAction==='existing'&&Boolean(l.stockRef));}
    if(chip.codes.includes('unite-absente')){const l=draft.lines.find(x=>x.id===ligneDe(chip));return Boolean(l&&isReadableUnit(l.unit));}
    return false;
  };
  const reglesSet=new Set(chips.filter(estRegle).map(c=>c.id));
  const tout=chips.length>0&&chips.every(c=>reglesSet.has(c.id));
  const lienDe=(line:PurchaseLineDraft):LienStock=>precisIds.has(line.id)?'precis':line.stockAction==='existing'?(line.stockRef?'relie':'aucun'):line.stockAction==='new'?'neuf':'aucun';
  /* D233 : « y aller » va toujours quelque part. `viser` ouvre les <details> qui contiennent la cible, la fait défiler visible (le défilant réserve la
     hauteur de la bande : scroll-padding-top) et y met le focus sans second défilement. Le panneau (TVA, paiement) ou la preuve s'ouvre d'abord, de façon synchrone. */
  const viser=(el:HTMLElement|null|undefined,opts:{focus?:HTMLElement|null;block?:ScrollLogicalPosition}={}):boolean=>{
    if(!el)return false;
    for(let ancestor:HTMLElement|null=el;ancestor&&ancestor!==form.current;ancestor=ancestor.parentElement){
      if(ancestor instanceof HTMLDetailsElement)ancestor.open=true;
    }
    el.scrollIntoView?.({block:opts.block??'start',behavior:'smooth'});
    opts.focus?.focus({preventScroll:true});
    return true;
  };
  const aller=(chip:Chip)=>{
    const q=(sel:string)=>form.current?.querySelector<HTMLElement>(sel)??null;
    /* z2 : la chip « Total » du QR saute au duel et le surligne 0,8 s. */
    if(chip.source==='qr'&&chip.cible){const k=chip.cible;flushSync(()=>{setQrOuvert(true);setQrLigne(k);if(k==='facture')setQrVus(s=>new Set(s).add(k));});viser(q(`[data-dp-qr-ligne="${k}"]`),{block:'center'});setTimeout(()=>{if(mounted.current)setQrLigne(null);},1800);return;}
    if(chip.source==='qr'){if(viser(q('[data-dp="duel"]'),{block:'center'})){setQrSurligne(true);setTimeout(()=>{if(mounted.current)setQrSurligne(false);},800);}return;}
    if(chip.nom==='TVA'){flushSync(()=>setPanel('tva'));viser(q('[data-dp="panneau-tva"]'));return;}
    if(chip.source==='paiement'){flushSync(()=>setPanel('paye'));viser(q('[data-dp="panneau-paye"]'));return;}
    const id=chip.source==='mouture'?mouturesPropositions[0]?.lineId:ligneDe(chip);
    const el=id?q(`[data-dp-ligne="${id}"]`):null;
    if(el){const d=el.querySelector('details');if(d)d.open=true;viser(el);return;}
    if(chip.codes.includes('date-absente')&&viser(q('[data-purchase-date]'),{focus:q('[data-purchase-date] input[type="date"]')}))return;
    if(chip.codes.some(c=>c==='somme-ecart'||c==='somme-incomplete'||c==='total-absent')){const champ=q('#purchase-total');if(viser(champ,{focus:champ,block:'center'}))return;}
    if(chip.codes.some(c=>c==='lignes-perdues'||c==='lignes-annoncees'||c==='lignes-non-rapprochees')&&viser(q('[data-purchase-lines]')))return;
    /* Sans cible propre : la preuve de la lecture, ouverte et amenée à l'écran. */
    flushSync(()=>setPreuveOuverte(true));viser(q('[data-dp="preuve"]'));
  };
  const remarques=result?[...new Set([...result.issues,...(result.review?.findings??[]),...result.items.flatMap(item=>item.ambiguity?[`${item.name||'Article'} : ${item.ambiguity}`]:[])].map(p=>p.trim()).filter(Boolean))].filter(p=>!(points??[]).some(pt=>pt.message===p)):[];
  const driveOk=apercu?apercu.drive==='ok':draft.proofDataUrl?FirebaseAuthService.hasDriveAccess():true;void driveTick;
  /* R1 : un prix « avec mouture » seulement si le catalogue l'écrira (latestBrewPrices) : malt relié au stock, mouture de genre service à montant positif, lien confirmé. */
  const eur=(cents:number)=>(cents/100).toFixed(2).replace('.',',');
  const prixMouture=(index:number,confirme:boolean)=>{const malt=draft.lines[index],m=draft.lines[index+1];if(!m||!malt||malt.stockAction==='none'||m.kind!=='service'||!((m.amount??0)>0)||(confirme&&parentDeLaMouture(draft.lines,index+1)!==index))return undefined;const p=prixAvecMouture(malt,m);return p?`${p.exact?'':'≈ '}${eur(p.cents)}/${malt.unit}`:undefined;};
  const kgPrix=(index:number)=>{const p=prixMouture(index,true);return p?`${p} avec mouture`:undefined;};
  const lieAuStock=(description:string,unit:string,quantity?:number)=>memeProduit(description,unit,sansCetteSaisie([...stocks.rawMaterials,...stocks.cleaning],draft.submissionId),quantity,draft.vendor);
  /* S6 (T3, T4) : l'article neuf de chaque ligne non reliée, DÉRIVÉ de la ligne et du stock courants par la fonction même de l'enregistrement : ce qui est montré est ce qui
     est écrit. Seul le nom tapé (`articleName`) est gardé ; les lignes « neuves » plus haut comptent pour le suffixe (« bis », « bis 2 »). Mis en cache par ligne. */
  const existants=sansCetteSaisie([...stocks.rawMaterials,...stocks.cleaning],draft.submissionId);
  const signatureStock=`${draft.vendor}§`+existants.map(item=>`${item.ref}|${item.name}|${item.category}|${item.unit}|${item.supplier??''}|${item.alphaPct??''}|${item.colorEbc??''}|${item.origin??''}|${item.fiche?.id??''}`).join(';');
  const neufParLigne=new Map<string,ArticleNeuf>();
  {
    const virtuels:MembreVirtuel[]=[];
    for(const l of draft.lines){
      if(!STOCK_KINDS.includes(l.kind)||l.stockAction==='existing'||!l.description.trim())continue;
      const sig=[l.description,l.unit,l.quantity,l.stockCategory,l.sourceReference,l.kind,l.articleName,virtuels.map(v=>v.nom).join('|'),signatureStock,catalogues.houblons?'c':'-'].join('§');
      let cache=cacheNeuf.current.get(l.id);
      if(!cache||cache.sig!==sig){cache={sig,neuf:articleNeufDe(ligneDeBrouillon(l,draft.vendor),existants,catalogues,l.articleName,virtuels)};cacheNeuf.current.set(l.id,cache);}
      neufParLigne.set(l.id,cache.neuf);
      if(l.stockAction==='new')virtuels.push({nom:cache.neuf.name});
    }
  }
  const nomPrisParAutre=(id:string,nom:string)=>{const avant:MembreVirtuel[]=[];for(const l of draft.lines){if(l.id===id)break;const n=neufParLigne.get(l.id);if(l.stockAction==='new'&&n)avant.push({nom:n.name});}return nomsPris(existants,avant).has(pliee(nom));};
  const tailleMo=(()=>{const o=attachment?.size||apercu?.fichier.size;return o?Math.round(o/1e5)/10:0;})();
  const nUnite=shownErrors.filter(m=>m.includes('unité à préciser')).length;
  const enSauvegarde=saving&&!pendingId;
  const totalField=<NumberInput id="purchase-total" fractionDigits={2} aria-label="Total TTC en CHF" aria-describedby={[hints.amountTTC?'scan-hint-amountTTC':'',attempted&&shownErrors.some(issue=>issue.includes('total'))?validationId:''].filter(Boolean).join(' ')||undefined} value={draft.amount} onValue={setTotal} emptyValue={undefined} min={0} placeholder="0,00" className={`${inputClass} !text-[32px] !leading-tight font-mono font-semibold tabular-nums min-h-10 !w-40 !border-0 !border-b !border-dotted !bg-transparent !px-0${qrContredit&&qrChoix===null?' !border-b-2 !border-attention !text-attention':''}`}/>;
  const ticket=(simple:boolean)=>draft.lines.map((line,index)=>{
    const mp=mouturesPropositions.find(p=>p.lineId===line.id),parentIdx=parentDeLaMouture(draft.lines,index),neuf=neufParLigne.get(line.id),nomRefuse=line.stockAction==='new'&&Boolean(line.articleName?.trim())&&nomPrisParAutre(line.id,line.articleName!);
    const isMouture=Boolean(mp)||parentIdx>=0;
    const fields=<>
          {!simple&&<div className="flex items-center gap-2"><div className="flex-1 min-w-0"><Field label="Libellé de la facture"><TextInput aria-label={`Libellé ligne ${index+1}`} value={line.description} onChange={description=>updateLine(line.id,{description})} placeholder="Article ou prestation"/></Field></div>{draft.lines.length>1?<button type="button" aria-label={`Retirer la ligne ${index+1}`} onClick={()=>patch({lines:draft.lines.filter(item=>item.id!==line.id)})} className="min-h-7 min-w-7 text-cave-400 flex justify-center items-center"><Trash2 size={17}/></button>:null}</div>}
          <div className={simple?'':'grid grid-cols-[1fr_7.5rem] gap-2'}><Field label="Type d’achat"><select aria-label={`Nature ligne ${index+1}`} value={line.kind} onChange={e=>{manuallyClassified.current.add(line.id);proposedStock.current.delete(line.id);updateLine(line.id,{kind:e.target.value as PurchaseLineDraft['kind'],stockAction:'none',equipmentAction:'none'});}} className={inputClass}>{kinds.map(kind=><option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></Field>{!simple&&<Field label="TTC (CHF)"><NumberInput aria-label={`Montant ligne ${index+1}`} value={line.amount} onValue={amount=>{updateLine(line.id,{amount});if(draft.lines.length===1)patch({amount});}} emptyValue={undefined} className={`${inputClass} tabular-nums`}/></Field>}</div>
          {!simple&&line.quantity!==undefined&&line.unitPrice!==undefined&&line.amount!==undefined?(()=>{const m=lineMathCheck([{id:line.id,name:line.description,kind:line.kind,quantity:line.quantity,unit:line.unit,price:line.unitPrice,amountTTC:line.amount}]);const ok=m.points.length===0;return <p className={`text-xs ${ok?'text-cave-200':'text-attention'}`}>{String(line.quantity).replace('.',',')} × {fr(line.unitPrice)} {ok?'= montant ✓':'≠ montant, écart à vérifier'}</p>;})():null}
          {line.evidence?<details className="text-xs text-cave-400"><summary className="cursor-pointer min-h-8 flex items-center">Voir l’extrait du document</summary><p className="text-cave-200 leading-relaxed">{line.evidence}</p></details>:null}
          {STOCK_KINDS.includes(line.kind)?<div className="space-y-2"><label className="text-sm text-cave-200 flex items-center gap-2"><Package size={16}/>Réception en stock</label>
            <Interrupteur label={`Mettre en stock, ligne ${index+1}`} actif={line.stockAction!=='none'} onChange={on=>{proposedStock.current.delete(line.id);if(on)updateLine(line.id,{stockAction:'existing',stockRef:proposedRef.current.get(line.id)??''});else updateLine(line.id,{stockAction:'none'});}}/>
            <select aria-label={`Stock ligne ${index+1}`} value={line.stockAction} onChange={e=>{const v=e.target.value as any;proposedStock.current.delete(line.id);const meme=v==='new'?lieAuStock(line.description,line.unit,line.quantity):undefined;if(meme)relieAuto.current.set(line.id,meme.name);else relieAuto.current.delete(line.id);updateLine(line.id,meme?{stockAction:'existing',stockRef:meme.ref}:{stockAction:v});}} className={inputClass}><option value="none">Aucun mouvement de stock</option><option value="existing">Ajouter à un article existant</option><option value="new">Créer un nouvel article</option></select>{line.stockAction==='new'&&neuf?<NomArticle index={index} line={line} neuf={neuf} prisParAutre={nomRefuse} onNom={articleName=>updateLine(line.id,{articleName})}/>:null}{line.stockAction==='existing'?<>{relieAuto.current.has(line.id)&&line.stockAction==='existing'?<p className="text-xs text-cave-200">relié à « {relieAuto.current.get(line.id)} », nom déjà au stock</p>:null}<Combobox ariaLabel="Article" value={line.stockRef||''} onChange={stockRef=>{proposedStock.current.delete(line.id);updateLine(line.id,{stockRef});}} options={stockOptions} placeholder="Chercher dans le stock"/>{articleDe(line)?.fiche?<p data-dp-fiche className="text-xs text-cave-200">{phraseFiche(articleDe(line)!.fiche!,catalogues)}</p>:null}</>:null}{line.stockAction!=='none'?<div className="grid grid-cols-2 gap-2"><Field label="Quantité reçue"><NumberInput aria-label={`Quantité ligne ${index+1}`} value={line.quantity} onValue={quantity=>updateLine(line.id,{quantity})} emptyValue={undefined} min={0} className={inputClass}/></Field><Field label="Unité lue / reçue"><TextInput aria-label={`Unité ligne ${index+1}`} value={line.unit} onChange={unit=>updateLine(line.id,{unit})} placeholder="kg, g, L, sachet…"/></Field></div>:null}</div>:null}
          {line.kind==='equipment'||line.kind==='maintenance'?<div className="space-y-2"><Field label={line.kind==='equipment'?'Fiche matériel':'Matériel entretenu'}><select aria-label={`Matériel ligne ${index+1}`} value={line.equipmentAction} onChange={e=>updateLine(line.id,{equipmentAction:e.target.value as any})} className={inputClass}><option value="none">Ne pas lier de matériel</option>{line.kind==='equipment'?<option value="new">Créer la fiche de ce matériel</option>:null}<option value="existing">Lier un matériel déjà présent</option></select></Field>{line.equipmentAction==='existing'?<Combobox ariaLabel="Matériel" value={line.equipmentRef||''} onChange={equipmentRef=>updateLine(line.id,{equipmentRef})} options={equipmentOptions} placeholder="Chercher un matériel"/>:null}{line.equipmentAction==='new'?<p className="text-xs text-cave-400">La fiche reprendra le prix et la date de cet achat. L’amortissement se renseigne dans Finances → Annuel.</p>:null}</div>:null}
    </>;
    if(simple)return <article data-purchase-line key={line.id} className="border-t border-cave-700 py-2 space-y-2">{fields}</article>;
    const status=lineStatus(line),article=articleDe(line),regle=neuf?.regle,lu=STOCK_KINDS.includes(line.kind)&&line.description.trim()?donneesDeLigne(ligneDeBrouillon(line,draft.vendor)):undefined,alphaLu=lu?.contexte==='Houblon'&&lu.donnees.alpha!==undefined?fr(lu.donnees.alpha):undefined,ebcLu=lu?.contexte==='Malt'&&lu.donnees.ebc!==undefined?fr(lu.donnees.ebc):undefined,existant=regle?.cas==='meme'?regle.article:undefined,voisin=regle?.cas==='neuf'||regle?.cas==='incertain'?regle.voisin:regle?.cas==='ambigu'?regle.candidats[0]:undefined;
    const parent=parentIdx>=0?draft.lines[parentIdx]:mp?draft.lines[draft.lines.findIndex(l=>l.id===mp.parentId)]:undefined;
    const premiereMouture=mp&&mouturesPropositions[0]?.lineId===line.id;
    const relier=(ref:string)=>{proposedStock.current.delete(line.id);updateLine(line.id,{stockAction:'existing',stockRef:ref});};
    /* r2b (`data-autre`) : ⇄ ouvre le plateau de la ligne sur le choix de l'article ; rien n'est relié d'un toucher. L'article se choisit dans le plateau. */
    const choisirAutre=()=>{
      proposedStock.current.delete(line.id);relieAuto.current.delete(line.id);updateLine(line.id,{stockAction:'existing',stockRef:''});
      requestAnimationFrame(()=>{const el=form.current?.querySelector<HTMLElement>(`[data-dp-ligne="${line.id}"]`),d=el?.querySelector('details');if(d)d.open=true;el?.scrollIntoView?.({block:'start',behavior:'smooth'});el?.querySelector<HTMLElement>('[aria-label="Article"]')?.focus?.();});
    };
    const tableau=premiereMouture&&tableauMoutures?<div data-dp="tableau-moutures" className="w-full rounded-panel border-2 border-cave-50/80 p-2 space-y-1 text-sm">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 gap-y-0.5 text-xs text-cave-400"><span>malt</span><span>lu /kg</span><span/><span>avec mouture</span>
        {mouturesPropositions.map(p=>{const i=draft.lines.findIndex(l=>l.id===p.parentId),malt=draft.lines[i],lu=malt?.unitPrice,apres=prixMouture(i,false);return <React.Fragment key={p.lineId}><span className="text-cave-200">{nomAffiche(malt.description,articleDe(malt))}</span><span className="font-mono text-cave-200">{lu===undefined?'—':eur(Math.round(lu*100))}</span><span>→</span><span className="font-mono text-cave-50">{apres?`${apres.replace('≈ ','')} /${malt.unit}`.replace(`/${malt.unit} /${malt.unit}`,`/${malt.unit}`):'non relié : pas de prix'}</span></React.Fragment>;})}</div>
      <div className="flex gap-1.5"><button type="button" onClick={()=>{setTableauMoutures(false);patch({lines:mouturesPropositions.reduce((acc,x)=>confirmMillingSurcharge(acc,x.lineId),draft.lines)});}} className="min-h-7 rounded-control border border-ebc-straw bg-ebc-straw px-2 text-sm font-semibold text-cave-950">Rattacher les {mouturesPropositions.length}</button><button type="button" onClick={()=>{setLaissees(true);setTableauMoutures(false);}} className="min-h-7 rounded-control border border-cave-600 px-2 text-sm text-cave-200">Laisser en service</button></div></div>:null;
    const correction=precisIds.has(line.id)?<><span className="text-xs text-attention">Unité imprimée illisible :</span>{['g','kg','Stk'].map(u=><button key={u} type="button" onClick={()=>updateLine(line.id,{unit:u})} className="min-h-7 rounded-control border border-cave-600 px-2 text-sm text-cave-50">{u}</button>)}</>
      :(voisin||existant)&&line.stockAction==='none'?<><span className="inline-flex items-center gap-1 text-xs text-cave-400 opacity-80"><Package size={14}/>{existant?existant.name:etiquetteVoisin(regle!,voisin!)}</span>{existant
        ?<button type="button" onClick={()=>relier(existant.ref)} className="min-h-7 rounded-control border border-dashed border-attention px-2 text-sm font-semibold text-attention">Relier à « {existant.name} »</button>
        :regle?.cas==='ambigu'?<span data-dp-ambigu className="text-xs text-attention">plusieurs articles « {voisin!.name} » : choisis</span>
        :<span data-dp-creer className="inline-flex items-center gap-1.5 whitespace-nowrap"><button type="button" aria-label={`Créer « ${neuf?.name??line.description.trim()} »`} onClick={()=>{proposedStock.current.delete(line.id);updateLine(line.id,{stockAction:'new'});}} className="min-h-7 rounded-control border border-dashed border-attention px-2 text-sm font-semibold text-attention">{regle?.cas==='neuf'&&regle.motif==='origine'&&neuf?.origin?`Créer ${neuf.origin}`:neuf?.name??line.description.trim()}</button><button type="button" aria-label="Choisir un autre article" title="Choisir un autre article" onClick={choisirAutre} className="min-h-7 min-w-7 rounded-control border border-cave-600 px-2 text-sm text-cave-200">⇄</button></span>}</>
      :line.stockAction==='none'&&regle?.cas==='inconnu'&&neuf?<button type="button" data-dp-creer aria-label={`Créer « ${neuf.name} »`} onClick={()=>{proposedStock.current.delete(line.id);updateLine(line.id,{stockAction:'new'});}} className="min-h-7 rounded-control border border-dashed border-attention px-2 text-sm font-semibold text-attention">Créer « {neuf.name} »</button>
      :tableau;
    return <LigneTicket key={`${readCount}-${line.id}`} id={line.id} index={index} description={line.stockAction==='new'&&neuf?.derive?(nomRefuse?neuf.nomPropose:neuf.name):nomAffiche(line.description,article)} amount={line.amount} lien={isMouture?'mouture':lienDe(line)} pastille={line.stockAction==='new'&&neuf?.fiche&&neuf.nomFiche?`fiche ${neuf.nomFiche}${neuf.fiche.approchee?' · approchée':''}`:effetStock(line,article)}
      conversion={article?conversionDe(line,article):undefined} quantite={line.quantity!==undefined?`${String(line.quantity).replace('.',',')} ${line.unit}`.trim():'—'} alpha={alphaLu} ebc={ebcLu} pastilleAttention={line.stockAction==='new'&&Boolean(neuf?.fiche?.approchee)}
      sr={`${line.description} ${status.meta} ${status.linked?`${status.proposed?'proposé : ':''}${status.linked}`:''}`} prixKg={kgPrix(index)} douteux={precisIds.has(line.id)||Boolean((voisin||existant)&&line.stockAction==='none')||Boolean(mp&&!laissees)} ouverte={Boolean(startsOpen(line))}
      mouture={isMouture&&parent?{liee:parentIdx>=0,parent:parent.description.split(',')[0],onBascule:()=>{if(parentIdx>=0)updateLine(line.id,{surchargeOf:undefined});else patch({lines:confirmMillingSurcharge(draft.lines,line.id)});},onTableau:premiereMouture?()=>setTableauMoutures(o=>!o):undefined,tous:premiereMouture&&mouturesPropositions.length>1?{n:mouturesPropositions.length,onTous:()=>patch({lines:mouturesPropositions.reduce((acc,p)=>confirmMillingSurcharge(acc,p.lineId),draft.lines)})}:undefined}:undefined}
      correction={correction}>{fields}</LigneTicket>;
  });
  const lignesBloc=<details data-purchase-lines {...(scan?.ok?{open:true}:{'data-purchase-options':true,open:initialIntent==='equipment'})} className="order-2 border-t border-cave-800 py-1 lg:col-start-2 lg:row-start-1">
    {scan?.ok?<summary className="list-none cursor-pointer min-h-7 flex flex-wrap items-center gap-x-2 text-xs text-cave-200">Lignes de la facture · {draft.lines.length}{proposedCount?<span className="text-attention">{proposedCount} proposée{proposedCount>1?'s':''} par la lecture, à vérifier</span>:null}{hints.items?<span className="text-attention">À vérifier</span>:null}</summary>
    :<summary className="list-none relative pr-6 min-h-7 cursor-pointer text-sm text-cave-200"><ChevronDown size={14} className="absolute right-0 top-1.5"/><span className="block">Articles, stock et matériel · {draft.lines.length}{hints.items?<span className="ml-2 text-attention text-xs">À vérifier</span>:null}</span><span className="block text-xs text-cave-400 mt-1">{[...new Set(draft.lines.map(line=>kinds.find(kind=>kind.value===line.kind)?.label))].join(' · ')}</span>{linkedSummary?<span className="block mt-1 text-cave-200">{linkedSummary}{proposedCount?<span className="text-attention"> · {proposedCount} proposée{proposedCount>1?'s':''} par la lecture, à vérifier</span>:null}</span>:null}</summary>}
    <ScanHint field="items" message={hints.items}/>
    <div className="space-y-2 pt-2">{!scan?.ok?<div className="flex justify-between gap-2 items-center"><h3 className="font-semibold text-cave-50">Ce que tu achètes</h3>{draft.lines.length>1?<button type="button" className="text-xs text-cave-400 min-h-7" onClick={()=>patch({lines:[{...newLine(),description:draft.description,kind:'other',amount:draft.amount}]})}>Regrouper en une dépense</button>:null}</div>:null}
      {ticket(simplePurchase)}
      <div className="flex gap-2"><button type="button" disabled={draft.lines.length>=35} onClick={()=>patch({lines:[...draft.lines,newLine()]})} className={`${button} border-dashed border-cave-600 text-cave-200 flex-1 flex justify-center items-center gap-2`}><Plus size={17}/>Ajouter une ligne</button>{scan?.ok&&draft.lines.length>1?<button type="button" className={`${button} border-dashed border-cave-600 text-cave-200`} onClick={()=>patch({lines:[{...newLine(),description:draft.description,kind:'other',amount:draft.amount}]})}>Regrouper en une dépense</button>:null}</div>
      {draft.lines.length>1?<p className={`text-sm text-right ${Math.abs(draft.lines.reduce((s,line)=>s+(line.amount||0),0)-(draft.amount||0))>0.005?'text-attention':'text-cave-400'}`}>Détail : {money(draft.lines.reduce((sum,line)=>sum+(line.amount||0),0))} / {money(draft.amount||0)}</p>:null}
    </div></details>;
  const tvaLues=[...new Set((points??[]).filter(p=>p.code==='lectures-divergentes'&&/tva/i.test(p.champ)).flatMap(p=>(p.valeurs??[]).map(v=>v.valeur).filter((v):v is number=>typeof v==='number')))];
  const tvaPoint=(points??[]).find(p=>p.code==='tva-incoherente');
  const tvaDet=tvaPoint?.details??[];
  const tvaRegle=reglees.has('TVA|');
  const numero=(pred:(c:Chip)=>boolean)=>{const i=chips.findIndex(pred);return i>=0?i+1:null;};
  const nTva=numero(c=>c.nom==='TVA'),nPaye=numero(c=>c.source==='paiement');
  const payeSuppose=draft.paymentStatus==='paid'&&draft.paymentDateBasis==='document_date';
  /* D233 : une seule date par défaut, celle de l'achat ; la date du paiement la suit. Son champ n'apparaît que sur « Autre date », ou quand une autre date est déjà là (tapée, ou différente de l'achat). */
  const dateSeparee=payeForme||draft.paymentDateBasis==='typed'||(Boolean(draft.paymentDate)&&Boolean(draft.date)&&draft.paymentDate!==draft.date);
  /* Une date jamais touchée par le brasseur et jamais lue : c'est la date du jour par défaut, dite comme telle (drapeau, pas une comparaison avec aujourd'hui). */
  const dateParDefaut=!scan?.ok&&!reviewedFields.includes('date')&&draft.paymentDateBasis!=='typed';
  const court=(date:string)=>date.replace(/^(\d{2}\.\d{2})\.\d{4}$/,(_m,jm)=>jm);
  const rond=(n:number|null,fait:boolean)=>n?<span className={`absolute left-1.5 top-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full font-mono text-xs ${fait?'bg-hop text-cave-950':'border border-dashed border-attention text-attention bg-cave-950'}`}>{n}</span>:null;
  const tuiles=<div className="grid grid-cols-2 gap-2">
    {scan?.ok?<button type="button" data-dp="tuile-tva" data-dp-chip="TVA|" data-dp-fait={tvaRegle?'1':undefined} aria-expanded={panel==='tva'} onClick={()=>setPanel(panel==='tva'?null:'tva')} className={`relative min-h-[52px] rounded-panel border p-1.5 ${nTva?'pl-8':'pl-2'} text-left ${nTva&&!tvaRegle?'border-dashed border-attention bg-attention/5':'border-cave-800'}`}>{rond(nTva,tvaRegle)}<span className="block text-xs text-cave-400">TVA</span><span className="block font-mono text-sm text-cave-50">{tvaLues.length>1?tvaLues.map((v,i)=><React.Fragment key={v}>{i?' · ':''}<b className={`font-semibold ${tvaRegle&&draft.sourceVatAmount!==v?'text-cave-400 line-through':''}`}>{fr2(v)}</b></React.Fragment>):draft.sourceVatAmount!==undefined?fr2(draft.sourceVatAmount):'—'}{tvaRegle?<small className="ml-1 text-xs text-cave-200">{draft.sourceVatAmount===undefined?'vide':'gardée'}</small>:null}</span></button>:<span/>}
    <button type="button" data-dp="tuile-paye" data-dp-chip={nPaye?'paye':undefined} data-dp-fait={nPaye&&!payeSuppose?'1':undefined} aria-expanded={panel==='paye'} onClick={()=>setPanel(panel==='paye'?null:'paye')} className={`relative min-h-[52px] rounded-panel border p-1.5 ${nPaye?'pl-8':'pl-2'} text-left ${payeSuppose?'border-dashed border-attention bg-attention/5':'border-cave-800'}`}>{rond(nPaye,!payeSuppose)}<span className="block text-xs text-cave-400">Règlement</span><span className="block text-sm text-cave-50">{draft.paymentStatus==='paid'?<span className="font-mono">Payé le {draft.paymentDate||'…'}</span>:draft.dueDate?<span className="font-mono">Échéance : {draft.dueDate}</span>:<span>À payer</span>}{payeSuppose?<small className="ml-1 text-xs text-attention">supposée</small>:null}{dateParDefaut&&draft.paymentStatus==='paid'?<small className="ml-1 text-xs text-cave-400">par défaut</small>:null}</span></button>
  </div>;
  const boutonPlein='min-h-7 rounded-control border border-ebc-straw bg-ebc-straw px-2.5 text-sm font-semibold text-cave-950';
  const panneaux=<div className="space-y-2">
    {scan?.ok?<div data-dp="panneau-tva" className={`${panel==='tva'?'block':'hidden'} rounded-panel border-2 border-cave-50/80 p-2 space-y-1.5`}>
      <div className="flex flex-wrap gap-1.5">{tvaLues.map((v,i)=>{const col=tvaDet.find(d=>d.relation==='somme-tva'),cents=Math.round(v*100);const prov=col&&col.lu===cents?'colonne MWST · lu':col&&col.calcule===cents?'N + R':`lecture ${i+1}`;return <button key={v} type="button" onClick={()=>{patch({sourceVatAmount:v});setReglees(s=>new Set(s).add('TVA|'));setPanel(null);}} className="min-h-9 rounded-control border border-cave-600 px-3 text-left"><small className="block text-xs text-cave-400">{prov}</small><b className="font-mono text-lg text-cave-50">{fr2(v)}</b></button>;})}
        <button type="button" onClick={()=>{patch({sourceVatAmount:undefined});setReglees(s=>new Set(s).add('TVA|'));setPanel(null);}} className="min-h-9 rounded-control border border-hop px-3 text-left"><small className="block text-xs text-hop">proposé · HT vide</small><b className="font-mono text-lg text-cave-50">—</b></button></div>
      {tvaDet.length?<ul className="text-xs text-cave-200 space-y-0.5">{tvaDet.slice(0,4).map((d,i)=><li key={i}>{phraseRelation(d)}</li>)}</ul>:null}
      <p className="text-xs text-cave-400">— HT non imprimé{draft.sourceNetAmount!==undefined?` : ${fr2(draft.sourceNetAmount)}`:''}. Aucune valeur n’est déduite.</p></div>:null}
    <div data-purchase-payment data-dp="panneau-paye" className={`${panel==='paye'?'block':'hidden'} rounded-panel border-2 border-cave-50/80 p-2 space-y-2 text-sm text-cave-200`}>
      {payeSuppose?<><div className="grid grid-cols-2 gap-1.5"><div className="rounded-control border border-cave-700 p-1.5"><small className="block text-xs text-attention">payé le · supposée</small><b className="font-mono text-lg text-attention">{court(draft.paymentDate)}</b></div><div className="rounded-control border border-cave-700 p-1.5"><small className="block text-xs text-cave-400">facture</small><b className="font-mono text-lg text-cave-50">{court(draft.date)}</b></div></div>
        <p className="text-xs text-cave-200">Date de paiement non imprimée{result?.paymentEvidence==='paid'?' · paiement lu sur le document':''}.</p></>:null}
      <div role="group" aria-label="État du règlement" className="inline-flex gap-1">{([{value:'paid',label:'Déjà payé'},{value:'unpaid',label:'À payer'}] as const).map(status=><button key={status.value} type="button" aria-pressed={draft.paymentStatus===status.value} onClick={()=>{reviewed('paymentEvidence');patch({paymentStatus:status.value,...(status.value==='paid'&&toIsoDate(draft.paymentDate)>toIsoDate(swissToday())?{paymentDate:swissToday()}:{})});}} className={`${button} ${draft.paymentStatus===status.value?'border-area-finances text-cave-50 bg-area-finances/10':'border-cave-700 text-cave-200'}`}>{status.value==='paid'?<Check size={15} className="inline mr-1.5"/>:null}{status.label}</button>)}</div>
      <ScanHint field="paymentEvidence" message={hints.paymentEvidence}/>
      {draft.paymentStatus==='paid'?<p className="text-xs text-cave-200">Moyen · {({bank:'Compte bancaire / carte',cash:'Espèces',twint:'TWINT',other:'Autre'} as Record<string,string>)[draft.paymentMethod]??draft.paymentMethod}</p>:null}
      {payeSuppose?<div className="flex flex-wrap gap-1.5"><button type="button" onClick={()=>{patch({paymentDate:draft.paymentDate});setPanel(null);}} className={boutonPlein}>C’est la date</button><button type="button" onClick={()=>setPayeForme(true)} className="min-h-7 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">Autre date</button></div>:null}
      <div className={`${payeSuppose&&!payeForme?'hidden':'block'} space-y-2 pb-1`}>{draft.paymentStatus==='paid'?<>{dateSeparee?<DateField label="Date du paiement" value={draft.paymentDate} onChange={paymentDate=>patch({paymentDate})} shortcuts={dayShortcuts} monthShortcuts/>
        :payeSuppose?null:<div data-dp="paye-suit" className="flex items-center gap-2"><span>Payé le <b className="font-mono font-medium text-cave-50">{draft.paymentDate||draft.date||'…'}</b></span><button type="button" onClick={()=>setPayeForme(true)} className="min-h-7 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">Autre date</button></div>}<Field label="Moyen de paiement" htmlFor="purchase-payment-method"><select id="purchase-payment-method" className={inputClass} value={draft.paymentMethod} onChange={e=>patch({paymentMethod:e.target.value as any})}><option value="bank">Compte bancaire / carte</option><option value="cash">Espèces</option><option value="twint">TWINT</option><option value="other">Autre</option></select></Field></>:<DateField label="Échéance (facultative)" value={draft.dueDate} onChange={dueDate=>patch({dueDate})} shortcuts={dayShortcuts} monthShortcuts/>}</div>
    </div></div>;
  const restantA_revoir=chips.filter(c=>!reglesSet.has(c.id)).map(c=>c.nom==='TVA'?`TVA ${draft.sourceVatAmount===undefined?'vide':`${fr2(draft.sourceVatAmount)} gardée`}`:c.source==='paiement'?'date de paiement supposée gardée':c.source==='mouture'?`${mouturesPropositions.length} moutures en service`:c.source==='voisin'?`${c.nom} non lié au stock`:c.codes.includes('unite-absente')?`${c.nom} : hors stock`:c.nom);
  return <ModalShell open onClose={()=>{if(!busy&&!saving)onClose();}} dismissible={!busy&&!saving} labelledBy={titleId} size="xl">
    <header className="min-h-9 px-3 py-0.5 border-b border-cave-800 flex items-center gap-2 shrink-0">
      <h2 id={titleId} className="text-lg font-semibold text-cave-50 min-w-0 flex-1">{initialIntent==='equipment'?'Acheter du matériel':'Nouvelle dépense'}</h2>
      {draft.proofDataUrl&&!busy?<button type="button" aria-label="Changer" title="Changer le fichier" disabled={saving||Boolean(pendingId)||Boolean(done)} onClick={()=>fileInput.current?.click()} className="min-h-7 min-w-7 flex items-center justify-center rounded-control text-cave-200 disabled:opacity-40"><FileText size={16}/></button>:null}
      <button type="button" disabled={busy||saving} onClick={onClose} aria-label="Fermer" className="min-h-7 min-w-7 flex items-center justify-center rounded-control text-cave-400"><X size={16}/></button>
    </header>
    <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pt-10 lg:scroll-pt-0 px-3 py-2 space-y-2 [&_input:not([type=checkbox])]:min-h-8 [&_input]:py-0.5 [&_select]:min-h-8 [&_select]:py-0.5 [&_[role=textbox]]:min-h-8 [&_[role=textbox]]:py-0.5 [&_label]:text-xs [&_summary]:text-[13px] [&_summary]:min-h-7 [&_button:not([data-primary])]:min-h-7">
    {scan?.ok&&statut&&!attached?<BandeCollante cible={bandeauRef} racine={scroller} chips={chips} reglees={reglesSet} onAller={aller}/>:null}
    {attempted&&shownErrors.length>0?<div id={validationId} role="alert" className="border border-alert-strong/40 rounded-control bg-alert-strong/5 p-2 text-sm text-alert-strong"><p className="font-medium">À corriger</p><ul>{shownErrors.map(message=><li key={message}><button type="button" onClick={()=>focusIssue(message)} className="min-h-7 text-left underline underline-offset-2">{message}</button></li>)}</ul></div>:null}
    {proofSending?<div role="status" className="rounded-panel border border-hop/40 bg-hop/5 p-2 text-sm text-cave-200 flex gap-2"><Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-hop"/><span>{proofSending}</span></div>:null}
    {error?<div ref={errorBox} tabIndex={-1} role="alert" className="rounded-panel bg-attention/10 border border-attention/25 p-3 text-sm text-attention whitespace-pre-line">{error}</div>:null}
    {attached?<div role="status" className="rounded-panel border border-hop/40 bg-hop/5 p-2 text-sm text-cave-200 flex gap-2"><Check size={16} className="shrink-0 mt-0.5 text-hop"/><span>Justificatif rattaché à « {attached.description} » du {attached.date}. Aucune nouvelle dépense ni entrée en stock.{receipt?<> <ReceiptLine receipt={receipt}/></>:null}</span></div>:null}
    {draft.proofDataUrl&&!busy&&!attached&&!apercu&&!dejaTx?<DriveConnection always={driveAuthError} onConnected={()=>{setDriveAuthError(false);setError('');setDriveTick(t=>t+1);}}/>:null}
    <div className="space-y-2 pb-1" ref={form}>
      <input hidden ref={fileInput} aria-label="Importer un justificatif" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void attach(file);e.target.value='';}}/>
      <input hidden ref={cameraInput} aria-label="Photographier un justificatif" type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void attach(file);e.target.value='';}}/>
      <input hidden ref={qrPhoto} aria-label="Photographier le QR" type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)lancerQr(file);e.target.value='';}}/>
      {!attachment&&!busy?showForm?<button type="button" disabled={saving||Boolean(pendingId)} onClick={()=>fileInput.current?.click()} className={`${button} w-full border-cave-700 text-cave-200 flex items-center justify-center gap-2`}><FileText size={18}/>Joindre un justificatif</button>:<section
        aria-label="Justificatif de la dépense"
        className={`py-2 px-2 space-y-2 rounded-panel border border-dashed transition-colors ${dropping?'border-ebc-straw bg-ebc-straw/10':'border-cave-700'}`}
        onDragOver={e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();setDropping(true);}}}
        onDragLeave={()=>setDropping(false)}
        onDrop={e=>{e.preventDefault();setDropping(false);const file=e.dataTransfer.files?.[0];if(file)void attach(file);}}
      >
        <button data-primary type="button" onClick={()=>fileInput.current?.click()} className="w-full min-h-8 rounded-control bg-ebc-straw text-cave-950 flex items-center justify-center gap-2 text-[13px] font-semibold"><FileText size={16}/>Choisir le document</button>
        {coarse?<button type="button" onClick={()=>cameraInput.current?.click()} className={`${button} w-full border-cave-600 text-cave-50 flex justify-center items-center gap-2`}><Camera size={18}/>Photographier le ticket</button>:null}
        <p className="text-xs text-center text-cave-400">PDF ou image{coarse?'':', ou dépose le fichier ici'} · lecture automatique · 4 Mo max.</p>
        {!showForm?<button type="button" onClick={()=>setShowForm(true)} className="min-h-7 w-full text-sm text-cave-200 underline underline-offset-4">Saisir sans justificatif</button>:null}
      </section>:busy?<div data-dp="lecture" className="border-t border-cave-700 py-2 space-y-2">
        <div className="flex items-center gap-2"><Loader2 size={18} className="animate-spin text-ebc-straw shrink-0"/><div className="min-w-0 flex-1"><p role="status" className="text-sm font-medium text-cave-50">Lecture et vérification…</p><p className="truncate font-mono text-xs text-cave-400">{attachment?.name||apercu?.fichier.name||'Préparation de la photo…'}{(attachment?.size||apercu?.fichier.size)?` · ${fr(Math.round((attachment?.size||apercu?.fichier.size||0)/1e5)/10)} Mo`:''}</p>{resumeQr(qrRes)?<p data-dp="qr-lecture" className="mt-0.5 break-words font-mono text-xs text-cave-200">{resumeQr(qrRes)}</p>:null}</div>{sceauQr&&vue?.etat!=='sans'?<div className="shrink-0">{sceauQr}</div>:null}</div>{ficheQr}
        <div className="grid grid-cols-2 gap-2 opacity-80"><div className="rounded-panel border border-cave-800 p-1.5"><span className="block text-xs text-cave-400">Règlement</span><span className="block text-sm text-cave-200">verrouillé pendant la lecture</span></div><div className="rounded-panel border border-cave-800 p-1.5"><span className="block text-xs text-cave-400">Pour quoi ?</span><span className="block text-sm text-cave-200">verrouillé pendant la lecture</span></div></div>
        {[0,1,2,3,4].map(i=><div key={i} aria-hidden className="grid grid-cols-[24px_1fr_40px] items-center gap-2"><span className="h-5 w-5 rounded bg-cave-800"/><span className="space-y-1"><span className="block h-3 w-3/5 rounded-full bg-cave-800"/><span className="block h-2.5 w-1/3 rounded-full bg-cave-800"/></span><span className="h-3 rounded-full bg-cave-800"/></div>)}
      </div>:dejaTx&&attachment?<PieceDejaSaisie tx={dejaTx} stocks={stocks} payments={FinanceService.getPayments?.()??[]} transactions={transactions} onLire={()=>void attach(attachment,true)}/>
      :scan&&!scan.ok&&attachment?<div data-dp="erreur-lecture" className="flex flex-wrap items-center gap-1.5 border-t border-cave-700 py-2"><span className="min-w-0 flex-1 truncate text-xs text-cave-400">{attachment.name}</span>
        <button type="button" disabled={saving||Boolean(pendingId)} onClick={()=>void attach(attachment)} className={boutonPlein}>Relire</button>
        <button type="button" onClick={()=>{const champ=form.current?.querySelector<HTMLElement>('#purchase-total');champ?.focus();champ?.scrollIntoView?.({block:'center'});}} className="min-h-7 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">Saisir à la main</button></div>:null}
      {showForm&&!busy&&!attached&&!dejaTx?<fieldset disabled={saving||Boolean(pendingId)||Boolean(done)} className="min-w-0 flex flex-col gap-2 lg:grid lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-x-5 lg:items-start">
      <div className={`contents lg:col-start-1 lg:row-start-1 lg:block lg:sticky lg:top-0 ${done?'lg:max-h-[calc(100vh-12.5rem)]':'lg:max-h-[calc(100vh-9.5rem)]'} lg:space-y-2 lg:self-start lg:overflow-y-auto`}>
      <div className="order-1 flex flex-col gap-2">
      {existing?<section id="purchase-duplicate" aria-label={memeFichier?'Achat déjà enregistré · même fichier':'Achat peut-être déjà enregistré'} className={`${uncertainClass} space-y-1.5 lg:col-start-1`}>
        <p className="text-sm font-medium text-attention flex items-center gap-1.5"><AlertCircle size={14} className="shrink-0"/>{memeFichier?'Achat déjà enregistré · même fichier':'Achat peut-être déjà enregistré'}</p>
        <div className="min-w-0 text-[13px] text-cave-200"><p className="truncate font-medium text-cave-50">{existing.description}</p>
          <p className="text-xs text-cave-400 break-words">{[existing.finance?.vendor,existing.finance?.proofDocumentId||existing.proofUrl?'justificatif joint':'sans justificatif'].filter(Boolean).join(' · ')}</p></div>
        <LienDepense tx={existing} stocks={stocks}/>
        {/* Les deux documents côte à côte : deux n° de facture différents disent deux achats. */}
        <table className="w-full table-fixed text-xs">
          <thead><tr className="text-cave-400"><td className="w-14"/><th scope="col" className="py-0.5 text-left font-normal">Document lu</th><th scope="col" className="py-0.5 text-left font-normal">Déjà enregistré</th></tr></thead>
          <tbody>{comparison.map(row=><tr key={row.label} className="border-t border-cave-800"><th scope="row" className="py-0.5 pr-1 text-left font-normal text-cave-400">{row.label}</th>{[row.read,row.recorded].map((value,index)=><td key={index} className={`py-0.5 pr-1 truncate ${value?'font-mono tabular-nums text-cave-50':'text-cave-400'}`}>{value||row.missing}</td>)}</tr>)}</tbody>
        </table>
        <p className="text-xs text-cave-400">{existingReasons.join(' · ')}{duplicates.length>1?` · ${duplicates.length-1} autre${duplicates.length>2?'s':''} achat${duplicates.length>2?'s':''} proche${duplicates.length>2?'s':''}`:''}</p>
        <div role="group" aria-labelledby="purchase-duplicate-choice" className="flex flex-wrap items-center gap-1.5"><span id="purchase-duplicate-choice" className="text-xs text-cave-400">Ce document est :</span>
          {([{same:true,label:'Même achat'},{same:false,label:'Autre achat'}] as const).map(choice=>{const chosen=choice.same?sameChosen:Boolean(draft.duplicateConfirmed);return <button key={choice.label} type="button" aria-pressed={chosen} onClick={()=>{setSameAs(choice.same?`${existing.id}|${draft.documentHash??''}`:null);setDraft(previous=>({...previous,duplicateConfirmed:!choice.same}));}} className={`${button} ${chosen?'border-area-finances bg-area-finances/10 text-cave-50':'border-cave-700 text-cave-200'}`}>{chosen?<Check size={14} className="inline mr-1"/>:null}{choice.label}</button>;})}</div>
        <p className="text-xs text-cave-400">{sameChosen?`Même achat : ${sameOutcome}.`:draft.duplicateConfirmed?'Autre achat : une seconde dépense est enregistrée avec ce document.':`Même achat : ${sameOutcome}. Autre achat : une seconde dépense est enregistrée.`}</p>
      </section>:null}
      {similar?<section aria-label="Même commande sous un autre numéro" className={`${uncertainClass} space-y-1.5 lg:col-start-1`}>
        <p className="text-sm font-medium text-attention flex items-center gap-1.5"><AlertCircle size={14} className="shrink-0"/>{similar.gapCents?`Même commande ${numCourt(similar.tx.finance?.sourceOrderNumber)}, autre total`:`Même commande, autre numéro : ${similar.tx.finance?.invoiceNumber||'sans n°'}`}</p>
        <LienDepense tx={similar.tx} stocks={stocks}/>
        <table className="w-full table-fixed text-xs"><thead><tr className="text-cave-400"><td className="w-16"/><th scope="col" className="py-0.5 text-left font-normal">Ce document</th><th scope="col" className="py-0.5 text-left font-normal">Déjà au registre</th></tr></thead>
          <tbody>{[{l:'N°',a:draft.invoiceNumber.trim()||'sans n°',b:similar.tx.finance?.invoiceNumber||'sans n°',same:false},{l:'Date',a:draft.date,b:similar.tx.date,same:draft.date===similar.tx.date},{l:'Commande',a:numCourt(draft.sourceOrderNumber),b:numCourt(similar.tx.finance?.sourceOrderNumber),same:Boolean(draft.sourceOrderNumber)&&draft.sourceOrderNumber===similar.tx.finance?.sourceOrderNumber},{l:'Total',a:draft.amount===undefined?'—':money(draft.amount),b:money(similar.tx.amountTTC),same:!similar.gapCents}].map(row=><tr key={row.l} className="border-t border-cave-800"><th scope="row" className="py-0.5 text-left font-normal text-cave-400">{row.l}</th><td className={`py-0.5 truncate font-mono ${row.same?'font-semibold text-attention':'text-cave-50'}`}>{row.a}{row.l==='Total'&&similar.gapCents?<> <strong data-dp-ecart aria-label={`écart de ${money(Math.abs(similar.gapCents)/100)}`} className="font-semibold tabular-nums text-attention underline decoration-attention/60 underline-offset-2">{similar.gapCents>0?'+':'−'}{fr2(Math.abs(similar.gapCents)/100)}</strong></>:null}{row.l==='Date'&&joursEcart?<> <strong data-dp-jours aria-label={`${Math.abs(joursEcart)} jour${Math.abs(joursEcart)>1?'s':''} d’écart`} className="font-semibold tabular-nums text-attention">{joursEcart>0?'+':'−'}{Math.abs(joursEcart)} j</strong></>:null}</td><td className={`py-0.5 truncate font-mono ${row.same?'font-semibold text-attention':'text-cave-50'}`}>{row.b}</td></tr>)}</tbody></table>
        <div role="group" aria-label="Choix pour la même commande" className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={similarChoice==='same'} onClick={()=>setSimilarState({id:similar.tx.id,choix:'same'})} className={`${button} ${similarChoice==='same'?'border-area-finances bg-area-finances/10 text-cave-50':'border-cave-700 text-cave-200'}`}>{similarAttachable?'Même achat : rattacher le justificatif':'Même achat · ne rien enregistrer'}</button>
          <button type="button" aria-pressed={similarChoice==='other'} onClick={()=>setSimilarState({id:similar.tx.id,choix:'other'})} className={`${button} ${similarChoice==='other'?'border-area-finances bg-area-finances/10 text-cave-50':'border-cave-700 text-cave-200'}`}>Autre achat</button></div>
        <p className="text-xs text-cave-400">{similarChoice==='same'?(similarAttachable?'Même achat : le justificatif rejoint la dépense existante, sans dépense, stock ni paiement en plus.':'Même achat : rien n’est enregistré, la dépense existante reste telle quelle.'):'Ce n’est qu’un signal : sans choix, l’achat s’enregistre normalement.'}</p>
      </section>:null}
      {draft.proofDataUrl?<details className="text-sm text-cave-200 min-w-0 lg:col-start-1"><summary className="min-h-7 cursor-pointer flex items-center gap-2"><FileText size={16}/>Voir le justificatif</summary>{draft.proofType?.startsWith('image/')?<img src={draft.proofDataUrl} alt="Justificatif source" className="w-full rounded-panel"/>:<a href={draft.proofDataUrl} download={draft.proofFileName} className="text-ebc-straw min-h-7 flex items-center">Ouvrir le PDF original</a>}</details>:null}
      {scan?.ok&&result&&statutFinal?<div className="lg:col-start-1"><InvoiceScanReview liens={Object.fromEntries(draft.lines.map((l,i)=>[l.id,mouturesPropositions.some(p=>p.lineId===l.id)||parentDeLaMouture(draft.lines,i)>=0?'mouture':lienDe(l)]))} result={result} cached={scan.cached} statut={statutFinal} vendor={draft.vendor} date={draft.date} calcule={draft.sourceTotalBasis==='line_sum'} lines={draft.lines} comptes={compteLiens(draft.lines,precisIds)} remarques={remarques}
        preuveOuverte={preuveOuverte} onPreuve={()=>setPreuveOuverte(o=>!o)} drive={driveVerifie&&!driveOk&&draft.proofDataUrl?'a-connecter':null} onDrive={()=>setDriveAuthError(true)} onLigne={id=>aller({id:'l',nom:'',enjeu:'info',ligne:null,codes:[],source:'voisin',cible:id})} bandeauRef={bandeauRef}
        sceau={sceauQr} sousTotal={sousTotalQr} doutes={{date:qrEcarts.includes('date')&&!qrChoixChamps.date,vendor:qrEcarts.includes('creancier')&&!qrChoixChamps.creancier,devise:qrEcarts.includes('devise')&&!qrChoixChamps.devise}} ecartTotal={qrContredit&&vue?.duel&&sommeLignesCts!==Math.round(vue.duel.luNombre*100)?{lignes:fr2Qr(sommeLignesCts/100),lu:vue.duel.lu}:undefined}
        totalField={<>{totalField}<ScanHintTotal message={hints.amountTTC}/></>}/></div>
      :<div className={hints.amountTTC?`${uncertainClass} lg:col-start-1`:'lg:col-start-1'}><Field label="Total TTC en CHF" htmlFor="purchase-total"><NumberInput id="purchase-total" fractionDigits={2} aria-describedby={[hints.amountTTC?'scan-hint-amountTTC':'',attempted&&shownErrors.some(issue=>issue.includes('total'))?validationId:''].filter(Boolean).join(' ')||undefined} value={draft.amount} onValue={setTotal} emptyValue={undefined} min={0} placeholder={scan&&!scan.ok?'—':'0,00'} className={`${inputClass} !text-base font-mono font-semibold tabular-nums min-h-8`}/></Field><ScanHint field="amountTTC" message={hints.amountTTC}/></div>}
      {draft.sourceCurrency&&draft.sourceCurrency!=='CHF'?<p className="text-attention text-sm lg:col-start-1">Original : {draft.sourceAmount??'montant absent'} {draft.sourceCurrency}. Montants à renseigner en CHF.</p>:null}
      {chips.some(c=>c.source==='qr')?<div className="lg:col-start-1"><ChipsBar chips={chips} reglees={reglesSet} onAller={aller} tout={false} cacher={c=>c.source!=='qr'}/></div>:null}
      {tuiles}{panneaux}
      {scan?.ok?<div className="lg:col-start-1"><ChipsBar chips={chips} reglees={reglesSet} onAller={aller} tout={tout} cacher={c=>c.nom==='TVA'||c.source==='paiement'||c.source==='qr'}/></div>:null}
      {ficheQr}
      </div>
      <div className="order-3 space-y-0">
      {scan?.ok?<details className="border-t border-cave-800 py-1"><summary className="min-h-7 flex items-center justify-between gap-2 text-sm text-cave-200 cursor-pointer"><span>Pour quoi ?{draft.descriptionSource==='scan'?<span className="ml-2 rounded-control border border-cave-600 px-1.5 text-xs text-cave-200">proposé</span>:null}</span></summary><div className="pt-2"><TextInput id="purchase-description" aria-label="Pour quoi ?" aria-invalid={attempted&&!draft.description.trim()||undefined} aria-describedby={attempted&&!draft.description.trim()?validationId:undefined} value={draft.description} onChange={description=>{patch({description});if(draft.lines.length===1)updateLine(draft.lines[0].id,{description});}} placeholder="À décrire"/></div></details>
      :<Field label="Pour quoi ?" htmlFor="purchase-description"><TextInput id="purchase-description" aria-label="Pour quoi ?" aria-invalid={attempted&&!draft.description.trim()||undefined} aria-describedby={attempted&&!draft.description.trim()?validationId:undefined} value={draft.description} onChange={description=>{patch({description});if(draft.lines.length===1)updateLine(draft.lines[0].id,{description});}} placeholder={scan&&!scan.ok?'À décrire':initialIntent==='equipment'?'Fermenteur 30 L, pompe de brassage…':'Malt pour la Pale Ale, entretien de la pompe…'}/></Field>}
      <details data-purchase-date data-purchase-options open={Boolean(hints.date)} className={`border-t py-1 ${hints.date?'border-attention/50 bg-attention/5':'border-cave-800'}`}><summary className="min-h-7 cursor-pointer flex items-center gap-2 text-sm text-cave-200"><CalendarDays size={18} className="text-cave-400"/><span className="flex-1">Achat du <strong className="font-medium text-cave-50">{draft.date||'…'}</strong>{dateParDefaut?<span className="ml-1.5 text-xs text-cave-400">aujourd’hui · par défaut</span>:null}</span><ChevronDown size={14}/></summary><ScanHint field="date" message={hints.date}/><div className="pt-2"><DateField label="Date de l’achat" value={draft.date} onChange={date=>{reviewed('date');patch({date});}} shortcuts={dayShortcuts} monthShortcuts/></div></details>
      <details data-purchase-options open={Boolean(hints.vendor||hints.category)} className="border-t border-cave-800 py-1"><summary className="list-none relative pr-6 min-h-7 cursor-pointer text-sm text-cave-200"><ChevronDown size={14} className="absolute right-0 top-1.5"/><span className="block">Fournisseur et catégorie</span><span className="block text-xs text-cave-400 mt-1 break-words">{draft.vendor||'Fournisseur facultatif'} · {categories.find(c=>c.value===draft.category)?.label}</span></summary><div className="space-y-2 pt-2">
      <div className={hints.category?uncertainClass:''}><Field label="Catégorie" htmlFor="purchase-category"><select id="purchase-category" value={draft.category} onChange={e=>{reviewed('category');selectCategory(e.target.value as PurchaseCategory);}} className={inputClass}>{categories.map(category=><option key={category.value} value={category.value}>{category.label}</option>)}</select></Field><ScanHint field="category" message={hints.category}/></div>
      <div className={hints.vendor?uncertainClass:''}><Field label="Fournisseur" htmlFor="purchase-vendor"><TextInput id="purchase-vendor" value={draft.vendor} onChange={vendor=>{reviewed('vendor');patch({vendor});}} placeholder="Nom du fournisseur"/></Field><ScanHint field="vendor" message={hints.vendor}/></div>
      </div></details>
      {plans.length?<details className="border-t border-cave-800 py-1" open={Boolean(selectedPlan)}><summary className="min-h-7 flex items-center text-sm text-cave-200 cursor-pointer">Lier à une dépense prévue (facultatif)</summary><div className="space-y-2 pt-2"><Field label="Dépense prévue" htmlFor="purchase-plan"><select id="purchase-plan" className={inputClass} value={draft.planId||''} onChange={e=>patch({planId:e.target.value||undefined,occurrenceId:undefined})}><option value="">Aucune prévision liée</option>{plans.map(plan=><option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></Field>{selectedPlan?.recurrence?<Field label="Échéance concernée" htmlFor="purchase-occurrence"><select id="purchase-occurrence" className={inputClass} value={draft.occurrenceId||''} onChange={e=>patch({occurrenceId:e.target.value||undefined})}><option value="">Choisir l’échéance</option>{occurrences.map(occurrence=><option key={occurrence.id} value={occurrence.id}>{occurrence.date}</option>)}</select></Field>:null}<p className="text-xs text-cave-400">L’achat remplacera le montant prévu correspondant.</p></div></details>:null}
      <details className="border-t border-cave-800 py-1"><summary className="min-h-7 flex items-center text-sm text-cave-400 cursor-pointer">Référence et TVA du document{hints.invoiceNumber||hints.tvaAmount||hints.tvaRate?<span className="ml-2 text-attention text-xs">À vérifier</span>:null}</summary><div className="space-y-2 pt-2">{draft.sourceOrderNumber?<p className="text-sm text-cave-200">Commande n° {draft.sourceOrderNumber}</p>:null}<Field label="N° de facture" htmlFor="purchase-invoice-number"><TextInput id="purchase-invoice-number" value={draft.invoiceNumber} onChange={invoiceNumber=>{reviewed('invoiceNumber');patch({invoiceNumber});}}/></Field><ScanHint field="invoiceNumber" message={hints.invoiceNumber}/><div className="grid grid-cols-2 gap-2"><Field label="TVA source (CHF)" htmlFor="purchase-vat"><NumberInput id="purchase-vat" value={draft.sourceVatAmount} onValue={sourceVatAmount=>{reviewed('tvaAmount');patch({sourceVatAmount});}} emptyValue={undefined} className={inputClass}/></Field><Field label="Taux source (%)" htmlFor="purchase-vat-rate"><NumberInput id="purchase-vat-rate" value={draft.sourceVatRate===undefined?undefined:draft.sourceVatRate*100} onValue={value=>patch({sourceVatRate:value===undefined?undefined:value/100})} emptyValue={undefined} className={inputClass}/></Field></div><ScanHint field="tvaAmount" message={hints.tvaAmount}/><ScanHint field="tvaRate" message={hints.tvaRate}/></div></details>
      {draft.proofDataUrl?<p className="pt-1 text-xs text-cave-400">{receipt?<ReceiptLine receipt={receipt}/>:'Le justificatif sera rangé dans ton Drive privé à l’enregistrement.'}</p>:null}
      </div>
      </div>
      {lignesBloc}
      </fieldset>:null}
    </div>
    </div>
    {showForm&&!busy?<footer className={'shrink-0 min-h-9 px-3 py-0.5 border-t border-cave-800 flex items-center justify-between gap-2'+(keyboardInset?'':' pb-safe')}>
      {done?<div className="min-w-0 flex-1 text-xs text-cave-200"><p className="flex items-center gap-1.5"><Check size={14} className="shrink-0 text-hop"/><span className="break-words font-mono text-cave-50">{done.fileName??draft.proofFileName}</span></p><p className="flex flex-wrap gap-x-2"><span>{done.folder??'ton Drive'}</span>{receiptSentence(done).link?<a href={receiptSentence(done).link} target="_blank" rel="noopener noreferrer" className="font-semibold text-cave-50 underline underline-offset-2">Ouvrir dans Drive</a>:null}{done.verified===true&&done.bytes?<span>{done.bytes.toLocaleString('fr-CH').replace(/[\s ]/g,' ')} octets · taille vérifiée</span>:null}</p>{restantA_revoir.length?<p className="text-attention">À revoir : {restantA_revoir.join(' · ')}</p>:null}</div>
      :<div className="min-w-0 flex-1 text-xs text-cave-200">{dejaTx?(onOpenExpense?<span>Rien n’est enregistré</span>:null):saving&&draft.proofDataUrl&&!receipt&&(!proofQueueAvailable()||apercu)?<span>Envoi au Drive{tailleMo?` · ${fr(tailleMo)} Mo`:''}</span>:saving?<span>{pendingId?'Confirmation…':'Enregistrement…'}</span>:!online?<span className="text-attention">Hors ligne · brouillon gardé</span>:nUnite&&attempted?<span className="text-attention">{nUnite} unité{nUnite>1?'s':''} à préciser</span>:draft.proofDataUrl&&!attached?<span>{driveOk?'Drive prêt':driveVerifie?'Drive à connecter':''}</span>:null}</div>}
      {done?<button type="button" onClick={onClose} className={button+' min-h-8 bg-ebc-straw border-ebc-straw text-cave-950 inline-flex items-center gap-1.5 font-semibold'}><Check size={14}/>Terminé</button>
      :attached?<button type="button" onClick={onClose} className={button+' min-h-8 bg-ebc-straw border-ebc-straw text-cave-950 inline-flex items-center gap-1.5 font-semibold'}><Check size={14}/>Terminé</button>
      :dejaTx?<button type="button" onClick={()=>{onClose();onOpenExpense?.(dejaTx.id);}} className={button+' min-h-8 bg-ebc-straw border-ebc-straw text-cave-950 inline-flex items-center gap-1.5 font-semibold'}>{onOpenExpense?<FileText size={14}/>:<X size={14}/>}{onOpenExpense?'Ouvrir la dépense':'Fermer sans rien enregistrer'}</button>:sameChosen&&existing?<button type="button" disabled={saving} onClick={()=>{if(attachable)void attachToExisting(existing.id);else onClose();}} className={button+' min-h-8 bg-ebc-straw border-ebc-straw text-cave-950 disabled:opacity-40 inline-flex items-center justify-center gap-1.5 font-semibold'}>{saving?<Loader2 size={14} className="animate-spin"/>:attachable?<Check size={14}/>:<X size={14}/>} {attachable?saving?'Rattachement…':'Rattacher le justificatif':'Fermer sans rien enregistrer'}</button>
      :!existing&&similarChoice==='same'&&similar?<button type="button" disabled={saving} onClick={()=>{if(similarAttachable)void attachToExisting(similar.tx.id);else onClose();}} className={button+' min-h-8 bg-ebc-straw border-ebc-straw text-cave-950 disabled:opacity-40 inline-flex items-center gap-1.5 font-semibold'}>{similarAttachable?<Check size={14}/>:<X size={14}/>}{similarAttachable?'Rattacher le justificatif':'Fermer sans rien enregistrer'}</button>
      :<button type="button" disabled={saving} aria-label={saving?'Enregistrement…':pendingId?'Vérifier la synchronisation':scan?.ok?'Confirmer et enregistrer':'Enregistrer la dépense'} onClick={()=>void save()} className={button+' min-h-8 bg-ebc-straw border-ebc-straw text-cave-950 disabled:opacity-40 inline-flex items-center justify-center gap-1.5 font-semibold'}>{saving?<Loader2 size={14} className="animate-spin"/>:<Check size={14}/>} {saving?'Enregistrement…':pendingId?'Vérifier la synchronisation':scan?.ok?'Confirmer':'Enregistrer'}</button>}
    </footer>:null}
  </ModalShell>;
}
const fr2=(n:number)=>(Math.round(n*100)/100).toFixed(2).replace('.',',');
function ScanHintTotal({message}:{message?:string}){return message?<span id="scan-hint-amountTTC" className="sr-only">À confirmer · {message}</span>:null;}
