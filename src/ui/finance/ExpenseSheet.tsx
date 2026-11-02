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
import { GeminiScannerService,type ScanOutcome,type ScanFluxOptions } from '../../services/geminiScanner';
import { savePurchaseWithProofReceipt,confirmPurchase,canCloseWithoutAck,watchPurchaseConfirmation,validatePurchase,sansCetteSaisie,purchaseDuplicates,purchaseDuplicateReasons,purchaseProofAttachable,attachProofToPurchase,purchaseSimilarOrders,purchaseSameFile,purchaseSameOrder,proposeMillingSurcharges,confirmMillingSurcharge,type PurchaseDraft,type PurchaseLineDraft } from '../../services/purchaseEntry';
import { STOCK_LINE_PROPOSALS_ENABLED, STOCK_PROPOSAL_KINDS, PROPOSAL_WEIGHT_MARK, matchStockLine, formatUnitLink, isReadableUnit, shortUnit } from '../../services/stockLineMatching';
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
import { retenirNomBrasseur,traduireLignes } from '../../services/nomsFr';
import { lireOptions } from '../depense/optionsDuNom';
import { invoiceTotalProposal,invoiceFieldHints,patchPurchaseDraft,applyScannedDescription,applyScannedPayment } from '../../services/purchasePrefill';
import { formatCHF } from '../../domain/finance/ledger';
import { useCoarsePointer,useKeyboardInset } from '../useViewport';
import { chipsDeLecture,compteLiens,libelleDeLigne,conversionDe,effetStock,etiquetteVoisin,memeProduit,nomAffiche,parentDeLaMouture,phraseRelation,pireStatut,prixAvecMouture,recalculerLecture,sansAlphaDoublon,statutAffiche,voisinEtMarque,type Chip } from '../depense/etat';
import { millingParentIndex,isMillingSurcharge } from '../../services/purchaseEntry';
import { contexteDeArticle } from '../../services/stockLineMatching';
import { vueQr,resumeQr,fr2 as fr2Qr,type ChampTranchable,type ChoixChamps } from '../depense/qrVue';
import { Sceau,SansQr,DuelTotal,TemoinSomme,BoutonPhotoQr,FicheQr } from '../depense/Qr';
import { articleNeufDe,ligneDeBrouillon,type ArticleNeuf } from '../../domain/stock/articleNeuf';
import { nomDeFiche,type Catalogues } from '../../domain/stock/fiche';
import { donneesDeLigne,nomsPris,pliee,type MembreVirtuel } from '../../services/stockLineMatching';
import { ChipsBar,TITRES } from '../depense/Verdict';
import { InvoiceScanReview } from './InvoiceScanReview';
import { Interrupteur } from '../depense/Ticket';
import { Entete,Justificatif } from '../depense/Entete';
import { Pied,BandeauPerdues,type BoutonPied } from '../depense/Pied';
import { Rubriques,type ItemRubrique } from '../depense/Rubriques';
import { Liste,SegmentPlier } from '../depense/Liste';
import { LigneP3c,LignePerdue } from '../depense/Ligne';
import { appliquerFinale,baseDeBrouillon,type CellulesLigne,enteteDeLecture,libelleAvant,lignesDeLecture,prixImprime,provisoireCoupe,rangerLaPerdue,type BaseFusion,type Correction,type Perdue,type Propositions } from '../depense/finale';
import { Comptes,motStatut,type CompteItem,type ItemBarre,type Rang } from '../depense/Recap';
import { bandes as calculerBandes,groupeDe,sousFamilleDeLigne,lignesDePort,portCents,numerosPapier,fr2 as fr2c,texteQte,poserGroupe,etatSegment,toutPlier as plierTout,toutDeplier as deplierTout,pliable,type ChoixGroupes,type GroupeCle,type LigneBande,type SousGroupe } from '../depense/groupes';
import type { LienStock } from '../depense/Pictos';
import { avecUnitesDeduites,confianceLigne,contexteConfiance,libelleLu,ligneConfianceDe,niveauxRangee,optionsEnFrancais,pastilleEtat,texteQuantite } from '../depense/rangees';
import { confianceEntete,pireNiveau,type ChampEntete,type Niveau } from '../depense/confiance';
import { uniteEffective } from '../../services/purchaseEntry';
import { regleProduit,linkUnit } from '../../services/stockLineMatching';
import type { ApercuDepense } from '../depense/types';
import { tenirEnrichissement } from '../../services/enrichissement';
import { EntreeFendue,RangeePages,FrisePages,ResteDeLecture,MiniPages,FilVerification } from '../depense/Pages';
import { assemblerPdf,empreinteDePage,empreinteDesPages,refuserPage,PAGES_MAX,type PageRangee,type PdfAssemble } from '../../services/pagesJustificatif';

export interface ExpenseSheetProps { onClose:()=>void;onSaved:(receipt?:DriveProofReceipt)=>void;initialIntent?:'expense'|'equipment';existingEquipmentId?:string;startWithScan?:boolean;initialPlanId?:string;apercu?:ApercuDepense;
  /** dp-doublon : ouvre la fiche d'une dépense déjà enregistrée (la feuille se ferme d'abord). Absent : « Fermer » seulement. */
  onOpenExpense?:(id:string)=>void }
const kinds:Array<{value:PurchaseLineDraft['kind'];label:string}>=[{value:'ingredient',label:'Ingrédients'},{value:'packaging',label:'Emballages'},{value:'cleaning',label:'Nettoyage'},{value:'equipment',label:'Matériel durable'},{value:'maintenance',label:'Entretien / réparation'},{value:'service',label:'Service'},{value:'shipping',label:'Livraison'},{value:'discount',label:'Remise'},{value:'other',label:'Autre'}];
type PurchaseCategory=Exclude<FinanceCategory,'apports'|'recettes'>;
const categories:Array<{value:PurchaseCategory;label:string}>=[{value:'brassage',label:'Brassage'},{value:'materiel',label:'Matériel'},{value:'nettoyage',label:'Nettoyage'},{value:'chargesFixes',label:'Charges fixes'},{value:'renovation',label:'Local'},{value:'divers',label:'Autre'}];
const money=(n:number)=>formatCHF(Math.round(n*100));
const newLine=(intent='expense'):PurchaseLineDraft=>({id:crypto.randomUUID(),description:'',kind:intent==='equipment'?'equipment':'ingredient',unit:'',stockAction:'none',equipmentAction:intent==='equipment'?'new':'none'});
const button='min-h-7 rounded-control px-2 text-[13px] font-medium border transition-colors';
// D262b : « La date exacte est rarement important. Le mois l'est plus. »
// Le paiement garde « Hier · Aujourd’hui · Demain » (lecture étroite de D262b : sa capture visait la date de l’achat).
const paymentShortcuts=[{label:'Hier',offsetDays:-1},{label:"Aujourd’hui",offsetDays:0},{label:'Demain',offsetDays:1}];
const dayShortcuts=[{label:"Aujourd’hui",offsetDays:0},{label:'Mois passé',offsetDays:0,offsetMonths:-1},{label:'Mois suivant',offsetDays:0,offsetMonths:1}];
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
/** `court` (VERDICT-f3-p2, détail 4) : l'avertissement tient sur une ligne ; le texte entier reste au survol et pour la lecture d'écran. */
function ScanHint({field,message,court}:{field:string;message?:string;court?:boolean}) {
  return message?<p id={`scan-hint-${field}`} title={court?`À confirmer · ${message}`:undefined} className={`text-xs text-attention flex gap-1.5 mt-1.5 ${court?'min-w-0 items-center whitespace-nowrap':'leading-relaxed'}`}><AlertCircle size={14} className={`shrink-0 ${court?'':'mt-0.5'}`}/><span className={court?'min-w-0 truncate':undefined}><strong className="font-medium">À confirmer · </strong>{message}</span></p>:null;
}

/** La phrase d'une fiche liée : « fiche Cascade US · approchée (pas exactement la bonne) ». Le nom se lit dans le catalogue ; sans lui (pas encore chargé), « fiche liée ». */
function phraseFiche(fiche:{id:string;approchee:boolean},catalogues:Catalogues):string {
  const nom=nomDeFiche(fiche.id,catalogues);
  return `fiche ${nom??'liée'}${fiche.approchee?' · approchée (pas exactement la bonne)':''}`;
}
/** Le nom de l'article neuf : pré-rempli (nom proposé), modifiable ; ce qui est tapé n'est jamais écrasé ; vidé, il rend la main au nom proposé. */
/** Un champ du plateau de p3c-3 : compact, chiffres en mono (`[6] Kg × [2,30] = [13,80]`). */
const CHAMP_P3C='min-h-7 h-7 min-w-0 rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-sm text-cave-50 tabular-nums';
function NomArticle({index,line,neuf,prisParAutre,onNom,enLigne}:{index:number;line:PurchaseLineDraft;neuf:ArticleNeuf;prisParAutre:boolean;onNom:(nom:string|undefined)=>void;enLigne?:boolean}) {
  /* Ses chiffres seulement : ce qui sera écrit sur l'article (α, EBC, origine) ; une valeur inconnue ne s'affiche pas. */
  const valeurs=[neuf.alphaPct!==undefined?`α ${fr(neuf.alphaPct)}`:'',neuf.colorEbc!==undefined?`${fr(neuf.colorEbc)} EBC`:'',neuf.origin?`origine ${neuf.origin}`:''].filter(Boolean).join(' · ');
  /* Au plateau de p3c-3 (VERDICT-f3, défaut 1) : le nom se saisit une seule fois, dans la ligne « article « … » · nouvel article ⇄ » ; la fiche est dite par la pastille. */
  if(enLigne)return <>
    <TextInput aria-label={`Nom de l’article, ligne ${index+1}`} value={line.articleName??neuf.name} onChange={nom=>onNom(nom===''?undefined:nom)} placeholder={neuf.name} className={`${CHAMP_P3C} w-36 font-sans font-medium`}/>
    {prisParAutre?<span role="alert" className="basis-full text-xs text-attention">Un article porte déjà ce nom : relie-le ou change le nom.</span>:null}
  </>;
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
  /* p3c-3 : le plateau que le brasseur a ouvert ou fermé (par id) : il survit au changement de bande d'une ligne (la rangée est remontée ailleurs). */
  const ouvertesRef=useRef(new Map<string,boolean>());
  /* VERDICT-f3-p2, détail 3 : la barre d'un bis se fond dans le plateau ouvert ; un toucher d'ouverture rend l'écran (une fois par geste). */
  const [,setPlateaux]=useState(0);
  /* D307 (son choix D) : le choix du brasseur sur chaque sous-groupe d'une bande (`true` ouvert, `false` replié ; rien : replié, sauf une ligne à vérifier). État d'écran seulement ; remis à zéro à chaque lecture. */
  const [choixGroupes,setChoixGroupes]=useState<ChoixGroupes>(()=>new Map());
  /* Lignes dont l'article de stock vient de la lecture : une proposition, montrée comme telle jusqu'au choix du brasseur. */
  const proposedStock=useRef(new Set<string>());
  /* L'article proposé par la lecture pour chaque ligne : l'interrupteur « oui » le repose explicitement (jamais l'ancien `stockRef` resté dans la ligne). */
  const proposedRef=useRef(new Map<string,string>());
  /* Les voisins vus à la lecture (même nom propre, autre α) : une chip qui reste, barrée une fois la ligne traitée. Lecture seule, rien n'est lié. */
  const voisins=useRef(new Map<string,{article:StockItem;marque:string}>());
  /* R6 : les lignes que le choix « Créer un nouvel article » a reliées (nom déjà au stock) : dit sous le choix. */
  const relieAuto=useRef(new Map<string,string>());
  /* D275d : les lignes que la lecture a faites « nouvel article » d'office ; un « bis » reste à confirmer (sa barre) tant que le brasseur n'a pas choisi. */
  const neufDOffice=useRef(new Set<string>());
  /* Voie n1-nom-fr : le brouillon et le stock COURANTS (mis à jour à chaque rendu) pour l'arrivée du français, et la quantité et l'unité de chaque ligne telles que lues : une ligne que le brasseur a retouchée n'est jamais reprise. */
  const draftCourant=useRef<PurchaseDraft|null>(null),existantsCourants=useRef<StockItem[]>([]),lectureLigne=useRef(new Map<string,string>());
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
  const [payeForme,setPayeForme]=useState(false),[laissees,setLaissees]=useState(false);
  /* p3c-3 : états d'écran seulement (rien n'est écrit) : l'ordre des lignes, le filtre des comptes, les lignes en éclair, le panneau du justificatif, le tiroir du port, la preuve visée. */
  const [ordre,setOrdre]=useState<'cat'|'papier'>('cat'),[filtre,setFiltre]=useState<{mot:string;ids:string[]}|null>(null),[garde,setGarde]=useState<string[]>([]),[justifOuvert,setJustifOuvert]=useState(false),[portOuvert,setPortOuvert]=useState(false),[viseePreuve,setViseePreuve]=useState(false);
  const [readCount,setReadCount]=useState(0);
  /* Lenteur D (D308, PLAN § 4 ter) : `verif` dit où en est la vérification (la 3.8) ; il est distinct de `busy`. `aucune` : pas de morceau provisoire (cache, pièce sans 3.8, ancien serveur) ; `attente` : le provisoire est là, le final pas ; `finie` : fusionné ; `echec` : fin de partie. */
  const [verif,setVerifEtat]=useState<'aucune'|'attente'|'finie'|'echec'>('aucune'),verifRef=useRef<'aucune'|'attente'|'finie'|'echec'>('aucune');
  const setVerif=(v:'aucune'|'attente'|'finie'|'echec')=>{verifRef.current=v;setVerifEtat(v);};
  const lectureJeton=useRef(0),lectureAbort=useRef<AbortController|null>(null),provRef=useRef<{base:BaseFusion;scan:ScanOutcome}|null>(null),courantRef=useRef<{reviewedFields:string[];reglees:ReadonlySet<string>;stockItems:StockItem[]}>({reviewedFields:[],reglees:new Set(),stockItems:[]});
  /* Ce que la fusion a corrigé (pour le bleu des cellules, l'ancienne valeur barrée, la puce), les lignes que la 3.8 ne lit plus (hors du brouillon, donc hors des sommes) et le nombre de lignes gardées. */
  const [fusion,setFusion]=useState<{lignes:Record<string,Correction[]>;entete:Record<string,{avant:unknown;apres:unknown}>;ajoutees:ReadonlySet<string>;n:number;avant:Record<string,CellulesLigne>}|null>(null);
  const [perdues,setPerdues]=useState<Perdue[]>([]),[perduesIds,setPerduesIds]=useState<string[]>([]),[nGardees,setNGardees]=useState(0);
  const [driveAuthError,setDriveAuthError]=useState(false);
  const [driveTick,setDriveTick]=useState(0);
  /* L'état Drive ne se dit qu'une fois le jeton vérifié (renouvellement silencieux) : jamais « Drive à connecter » quelques secondes quand Drive est prêt. */
  const [driveVerifie,setDriveVerifie]=useState(()=>Boolean(apercu));
  const [reviewedFields,setReviewedFields]=useState<string[]>([]);
  const [panel,setPanel]=useState<'tva'|'paye'|null>(null);
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
  const qrJeton=useRef(0),qrAvant=useRef<number|undefined>(undefined),qrPhoto=useRef<HTMLInputElement>(null),nomsJeton=useRef(0);
  const [reglees,setReglees]=useState<Set<string>>(new Set());
  const [done,setDone]=useState<DriveProofReceipt|null>(null);
  /* n2-pages (D291) : plusieurs images pour une seule dépense. `pages` = la rangée (gardée après « Lire » pour le panneau et « Relire ») ; `pagesRef` = la même liste, lue par les plafonds
     de chaque ajout (une file d'ajouts : deux choix d'un coup ne dépassent jamais 4 pages ni 12 Mo) ; `pdfRef` = le justificatif PDF assemblé pour ces pages (clé : leurs ids dans l'ordre) ;
     `assemblageEchoue` = le PDF n'a pas pu être assemblé (le lien « Saisir sans justificatif » paraît dans la rangée) ; `nPagesLues` = le nombre que le serveur a confirmé ; `entreeOuverte` = « Changer »
     a rouvert l'entrée au-dessus de la dépense, qui reste intacte tant qu'aucun nouveau fichier n'est choisi. */
  const [pages,setPages]=useState<PageRangee[]>([]),[assemblageEchoue,setAssemblageEchoue]=useState(false),[nPagesLues,setNPagesLues]=useState(0),[entreeOuverte,setEntreeOuverte]=useState(false);
  const pagesRef=useRef<PageRangee[]>([]),pdfRef=useRef<(PdfAssemble&{cle:string})|null>(null),fileAjouts=useRef<Promise<void>>(Promise.resolve()),pagesInput=useRef<HTMLInputElement>(null),etatRef=useRef({attachment:null as File|null,scanOk:false});
  etatRef.current={attachment,scanOk:Boolean(scan?.ok)};
  useEffect(()=>()=>{for(const p of pagesRef.current)if(p.url)URL.revokeObjectURL?.(p.url);},[]);
  const [online,setOnline]=useState(apercu?apercu.reseau:typeof navigator==='undefined'||navigator.onLine!==false);
  const hints=scan?.ok&&scan.result?Object.fromEntries(Object.entries(invoiceFieldHints(scan.result)).filter(([field])=>!reviewedFields.includes(field))):{};
  const reviewed=(field:string)=>setReviewedFields(previous=>previous.includes(field)?previous:[...previous,field]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;lectureAbort.current?.abort();};},[]);
  useEffect(()=>tenirEnrichissement(),[]);
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
  const updateLine=(id:string,value:Partial<PurchaseLineDraft>)=>{setDraft(previous=>({...previous,lines:previous.lines.map(line=>line.id===id?{...line,...value,...(value.unit!==undefined&&value.unit!==line.unit&&linkUnit(value.unit)!==linkUnit(uniteEffective(draftEff.lines.find(l=>l.id===line.id)??line))?{unitPrice:undefined}:{})}:line)}));};
  const simplePurchase=draft.lines.length===1&&!scan?.ok&&draft.lines[0].description===draft.description&&draft.lines[0].amount===draft.amount;
  const selectCategory=(category:PurchaseCategory)=>{
    const line=draft.lines[0];
    const suggestedKind:Record<PurchaseCategory,PurchaseLineDraft['kind']>={brassage:'ingredient',materiel:'equipment',nettoyage:'cleaning',chargesFixes:'service',renovation:'equipment',divers:'other'};
    /* D306 : une ligne devenue Rénovation (la catégorie change après la lecture) repasse à « aucun article » quand son « nouvel article » avait été posé d'office (`neufDOffice`) ; un choix du brasseur ne bouge jamais. */
    const repasse=draft.lines.filter(l=>l.stockAction==='new'&&neufDOffice.current.has(l.id)&&groupeDe(contexteLigne(l),l.kind,l.description,l.stockCategory,articleDe(l)?.category,category)==='renovation').map(l=>l.id);
    repasse.forEach(id=>neufDOffice.current.delete(id));
    patch({category,...(simplePurchase&&!manuallyClassified.current.has(line.id)&&line.stockAction==='none'&&line.equipmentAction==='none'?{lines:[{...line,kind:suggestedKind[category]}]}:repasse.length?{lines:draft.lines.map(l=>repasse.includes(l.id)?{...l,stockAction:'none' as const,stockRef:undefined,articleName:undefined}:l)}:{})});
  };
  /* D277 : le brouillon tel que l'enregistrement le lit, avec l'unité déduite de chaque ligne à l'unité illisible (dérivée du brouillon et du stock courants,
     jamais gardée seule) : ce que l'écran montre est ce qui est validé et écrit. */
  const articlesStock=[...stocks.rawMaterials,...stocks.cleaning];
  const draftEff=avecUnitesDeduites(draft,articlesStock);
  const effParId=new Map(draftEff.lines.map(l=>[l.id,l]));
  /* La ligne avec son unité déduite (même objet que l'enregistrement) ; l'unité que le stock lit. */
  const effDe=(line:PurchaseLineDraft)=>effParId.get(line.id)??line;
  const uniteDe=(line:PurchaseLineDraft)=>uniteEffective(effDe(line));
  const errors=validatePurchase(draftEff,stocks,transactions),duplicates=purchaseDuplicates(draft,transactions);
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
    /* p3c-port (R1, P18) : une ligne se retrouve par son id, jamais par son rang dans le DOM (bandes, moutures au plateau du malt, port au tiroir, filtre). */
    const parId=(id:string)=>root.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`);
    const found=draft.lines.find(l=>l.description.trim()&&message.startsWith(l.description+' :'));
    /* Les messages génériques n'identifient aucune ligne : ils mènent au premier champ « Montant ligne n » (ou « Libellé ligne n ») absent ou invalide, par id. */
    if(!found&&(message.startsWith('Chaque ligne')||message.startsWith('Une remise')||message.startsWith('Le détail des lignes'))){
      const faux=(l:PurchaseLineDraft)=>l.amount===undefined||!Number.isFinite(l.amount)||Math.abs(l.amount*100-Math.round(l.amount*100))>1e-6||(l.kind==='discount'?l.amount>0:l.amount<0);
      const i=draft.lines.findIndex(l=>!l.description.trim()||faux(l));
      if(i>=0){const l=draft.lines[i];return parId(l.id)?.querySelector<HTMLElement>(`[aria-label="${l.description.trim()?'Montant':'Libellé'} ligne ${i+1}"]`)??null;}
      return root.querySelector<HTMLElement>('#purchase-total');
    }
    const index=found?draft.lines.indexOf(found):-1;
    const line=found?parId(found.id):null;
    if(line){
      if(message.includes('quantité'))return line.querySelector<HTMLElement>('[aria-label^="Quantité ligne"]');
      if(message.includes('article de stock'))return line.querySelector<HTMLElement>('[role="combobox"]');
      if(message.includes('matériel existant'))return line.querySelector<HTMLElement>('[role="combobox"]');
      if(message.includes('convertit')||message.includes('unité à préciser'))return line.querySelector<HTMLElement>('[aria-label^="Unité ligne"]');
      return line.querySelector<HTMLElement>('select');
    }
    return root.querySelector<HTMLElement>('[data-purchase-lines] summary')??root.querySelector<HTMLElement>('[data-dp="liste"]');
  };
  const focusIssue=(message:string)=>{
    let target=issueTarget(message);
    /* D233 : la date du paiement n'est plus un champ par défaut ; une erreur qui la vise la fait apparaître avant d'y mettre le focus. */
    if(!target&&/paiement|échéance/.test(message)){flushSync(()=>{setPanel('paye');setPayeForme(true);});target=issueTarget(message);}
    if(!target){errorBox.current?.focus();return;}
    /* p3c-port : la cible peut être masquée par le filtre ou rangée dans le tiroir du port : le filtre est levé, le tiroir ouvert, avant le focus. */
    reveler(target);
    if(target.closest('[hidden]'))flushSync(()=>setFiltre(null));
    if(target.closest('[data-dp="port-tiroir"]'))flushSync(()=>setPortOuvert(true));
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
  /* Le français des noms de base, à part de la lecture, sans l'attendre ; apparié par id (D280). Hors ligne, en échec ou en aperçu : le nom imprimé reste. Lenteur D (M6, R5) : `traduireLignes` rend une `Map<rang, nameFr>` dont le rang est la position
     dans la liste ENVOYÉE ; ce rang est reporté vers l'id. Une traduction du provisoire encore en vol, dont le final est arrivé entre-temps, est jetée par sa garde (`nomsJeton`). */
  const traduire=(lines:PurchaseLineDraft[],jeton:number,stockItems:StockItem[])=>{
    if(apercu||!lines.length)return;
    void traduireLignes(lines.map(l=>({name:l.imprime?.nom??l.description,variant:l.imprime?.variante,unit:l.unit,kind:l.kind,stockCategory:l.stockCategory,stockAction:l.stockAction,stockRef:l.stockRef})),{stock:stockItems,enLigne:online}).then(noms=>{
      if(!mounted.current||nomsJeton.current!==jeton||!noms.size)return;
      const parId=new Map(lines.map((l,rang)=>[l.id,noms.get(rang)]));
      /* Voie n1-nom-fr (choix B) : le français peut relier une ligne `nouvel article` INTACTE (dans `neufDOffice`, sans nom tapé, ni nature changée, ni quantité ni unité retouchées) à un article du
         stock : relié comme à la lecture (D295 : `relieAuto`, cube coché, « nom déjà au stock », sans « Garder » : la facture suivante se relie toute seule, b-suivantes.png) ; plusieurs articles → « choisis », aucun lien. Le calcul se fait ICI, sur le brouillon et le
         stock COURANTS, et les refs sont mutées hors de l'updater (qui se rejoue deux fois en StrictMode). Une ligne retouchée ou déjà choisie par le brasseur n'est jamais reprise. */
      const courant=draftCourant.current,decisions=new Map<string,Partial<PurchaseLineDraft>>();
      for(const l of courant?.lines??[]){
        const fr=parId.get(l.id);
        if(!fr||l.nameFr||l.stockAction!=='new'||!neufDOffice.current.has(l.id)||l.articleName?.trim()||manuallyClassified.current.has(l.id)||lectureLigne.current.get(l.id)!==`${l.quantity}|${l.unit}`)continue;
        const unit=uniteEffective(l),regle=regleProduit(ligneDeBrouillon({...l,unit,nameFr:fr},courant?.vendor||undefined),existantsCourants.current);
        if(regle.cas==='meme'){relieAuto.current.set(l.id,regle.article.name);neufDOffice.current.delete(l.id);decisions.set(l.id,{stockAction:'existing',stockRef:regle.article.ref});}
        else if(regle.cas==='neuf'||regle.cas==='incertain'){const voisin=voisinEtMarque({...l,unit,nameFr:fr},existantsCourants.current,courant?.vendor||undefined);if(voisin)voisins.current.set(l.id,voisin);}
        else if(regle.cas==='ambigu'){const voisin=voisinEtMarque({...l,unit,nameFr:fr},existantsCourants.current,courant?.vendor||undefined);if(voisin)voisins.current.set(l.id,voisin);neufDOffice.current.delete(l.id);decisions.set(l.id,{stockAction:'none',stockRef:undefined});}
      }
      /* Lenteur D (B1) : la traduction est la SEULE écriture du programme entre le provisoire et le final : l'instantané la reprend au même moment (ses cellules, et les « nouvel article » d'office qu'elle a tranchés). */
      const prov=provRef.current;
      if(prov){for(const l of courant?.lines??[]){const fr=parId.get(l.id),b=prov.base.lignes[l.id];if(fr&&b&&!l.nameFr){b.nameFr=fr;const d=decisions.get(l.id);if(d){Object.assign(b,d);prov.base.neufsOffice=prov.base.neufsOffice.filter(x=>x!==l.id);}}}}
      setDraft(previous=>({...previous,lines:previous.lines.map(l=>{const fr=parId.get(l.id);return fr&&!l.nameFr?{...l,nameFr:fr,...(decisions.get(l.id)??{})}:l;})}));
    });
  };
  /**
   * Pose une lecture : le brouillon, les propositions, la traduction. Lenteur D : appelée par le PROVISOIRE (les deux premiers lecteurs : l'écran arrive) puis, sans morceau, par le final comme avant. Rend ce qu'il faut pour l'instantané de la base (B1) :
   * le brouillon tel qu'il est posé, et les propositions de la lecture.
   */
  const applyOutcome=(outcome:ScanOutcome,documentHash?:string):{posee:PurchaseDraft;propositions:Propositions;nLignes:number}|null=>{
    setScan(outcome);
    if(!outcome.ok || !outcome.result){setError(outcome.error||'Le scan n’a pas abouti. Les champs restent modifiables.');return null;}
    const result=outcome.result;
    const stockItems=[...stocks.rawMaterials,...stocks.cleaning];
    proposedStock.current.clear();proposedRef.current.clear();voisins.current.clear();lineStartsOpen.current.clear();neufDOffice.current.clear();relieAuto.current.clear();setChoixGroupes(new Map());setReadCount(count=>count+1);setReglees(new Set());setPanel(null);
    /* D275 : le libellé est la base de la désignation (sans options ni suffixe d'unité), ou sa désignation française lue ; l'imprimé complet reste au brouillon et au plateau. Le calcul des lignes est `lignesDeLecture` (finale.ts) : le même pour le provisoire et le final (B1). */
    const {lines,propositions}=lignesDeLecture(result,stockItems,draft.submissionId);
    for(const x of propositions.proposedStock)proposedStock.current.add(x);
    for(const [id,ref] of propositions.proposedRef)proposedRef.current.set(id,ref);
    for(const [id,v] of propositions.voisins)voisins.current.set(id,v);
    for(const [id,nom] of propositions.relieAuto)relieAuto.current.set(id,nom);
    for(const id of propositions.neufDOffice)neufDOffice.current.add(id);
    manuallyClassified.current.clear();
    const poser=(previous:PurchaseDraft):PurchaseDraft=>{const entete=enteteDeLecture(previous,result,swissToday()),description=entete.description??previous.description;return patchPurchaseDraft(previous,{...entete,lines:lines.length?lines:[{...newLine(),description:description||'Achat',amount:entete.amount}],scanModel:outcome.model,documentHash},swissToday());};
    setDraft(poser);
    const posee=poser(draftCourant.current??draft);
    /* D280 : le français des noms de base ; la quantité et l'unité de chaque ligne telles que lues : une ligne que le brasseur a retouchée n'est jamais reprise. */
    const jeton=++nomsJeton.current;
    lectureLigne.current=new Map(lines.map(l=>[l.id,`${l.quantity}|${l.unit}`]));
    traduire(lines,jeton,stockItems);
    return {posee,propositions,nLignes:result.items.length};
  };
  /* ------- lenteur D (D308) : le provisoire arrive, puis le final se fusionne ------- */
  /** Le morceau provisoire : l'écran arrive (lignes, drapeaux, « Lectures ●●◌ »), « Confirmer » attend (gris, roue). Le verrou de lecture reste : un seul fichier à la fois. */
  const surProvisoire=(provisoire:ScanOutcome,documentHash?:string)=>{
    const posee=applyOutcome(provisoire,documentHash);
    if(!posee||!provisoire.jeton)return;
    provRef.current={base:baseDeBrouillon(posee.posee,provisoire.jeton,posee.propositions,posee.nLignes),scan:provisoire};
    setFusion(null);setPerdues([]);setPerduesIds([]);setNGardees(0);
    setBusy(false);setShowForm(true);setVerif('attente');
  };
  /** La fin de partie (M2, R1) : le final n'arrive pas (délai, erreur, flux fermé) : les valeurs du provisoire restent, avec le point « lecture coupée » (`delai-saute`), comme une 3.8 coupée aujourd'hui. Ses saisies restent. */
  const finDePartie=()=>{
    const prov=provRef.current;if(!prov?.scan.result)return;
    setScan({...prov.scan,result:provisoireCoupe(prov.scan.result)});setVerif('echec');
  };
  /** Le final : la fusion « sa saisie l'emporte » (finale.ts). Elle n'appelle jamais `applyOutcome` : `readCount`, `choixGroupes`, les plateaux ouverts, `manuallyClassified` restent. */
  const surFinal=(final:ScanOutcome,documentHash?:string)=>{
    const prov=provRef.current,courant=draftCourant.current;
    if(!prov?.scan.result||!courant)return;
    if(!final.ok||!final.result){finDePartie();return;}
    const stockItems=courantRef.current.stockItems;
    const focus=(()=>{const el=typeof document!=='undefined'?document.activeElement:null;return el&&form.current?.contains(el)?el.closest<HTMLElement>('[data-dp-ligne]')?.dataset.dpLigne??null:null;})();
    const s=appliquerFinale({base:prov.base,courant,provisoire:prov.scan.result,final:final.result,stockItems,today:swissToday(),ligneVide:newLine,model:final.model,
      registres:{reviewedFields:courantRef.current.reviewedFields,manuallyClassified:manuallyClassified.current,proposes:proposedStock.current,neufsOffice:neufDOffice.current,reglees:courantRef.current.reglees,focus}});
    if(s.etat==='echec'){finDePartie();return;}
    /* Les propositions (article lié, voisin…) des lignes dont il n'a pas touché le lien viennent du final ; les autres gardent les leurs. */
    for(const id of s.reprises){proposedStock.current.delete(id);proposedStock.current.delete(id+PROPOSAL_WEIGHT_MARK);proposedRef.current.delete(id);voisins.current.delete(id);relieAuto.current.delete(id);neufDOffice.current.delete(id);}
    for(const x of s.propositions.proposedStock)proposedStock.current.add(x);
    for(const [id,ref] of s.propositions.proposedRef)proposedRef.current.set(id,ref);
    for(const [id,v] of s.propositions.voisins)voisins.current.set(id,v);
    for(const [id,nom] of s.propositions.relieAuto)relieAuto.current.set(id,nom);
    for(const id of s.propositions.neufDOffice)neufDOffice.current.add(id);
    for(const id of s.reprises){const l=s.draft.lines.find(x=>x.id===id);if(l)lectureLigne.current.set(id,`${l.quantity}|${l.unit}`);}
    const jeton=++nomsJeton.current;
    setDraft(()=>s.draft);
    setScan({...final,result:s.result,...(documentHash?{documentHash}:{})});
    setFusion({lignes:s.corrections.lignes,entete:s.corrections.entete,ajoutees:new Set(s.ajoutees),n:s.nCorrigees,avant:prov.base.lignes});
    setPerdues(s.perdues);setPerduesIds(s.perdues.map(p=>p.ligne.id));setNGardees(0);
    setVerif('finie');
    /* M6 : la traduction du provisoire en vol est jetée (`nomsJeton`) ; les lignes sans français (nom changé, ligne ajoutée, traduction jetée) se traduisent à nouveau, ce seul appel. */
    traduire(s.draft.lines.filter(l=>!l.nameFr),jeton,stockItems);
  };
  /** Ce que l'écran fait de la valeur rendue par `scanDocument` / `scanPages` : un morceau a été reçu → fusion ; sinon (cache, pièce sans 3.8, ancien serveur) → comme avant. */
  const finLecture=(outcome:ScanOutcome,documentHash?:string)=>{
    if(provRef.current){surFinal(outcome,documentHash);return;}
    setVerif('aucune');applyOutcome(outcome,documentHash);
  };
  /** Les options du flux pour `scanDocument` / `scanPages` : le morceau provisoire, et le signal levé quand la feuille se ferme (le serveur finit et met en cache). */
  const optionsFlux=(documentHash:string,pages?:boolean):ScanFluxOptions=>{
    const jeton=++lectureJeton.current;lectureAbort.current?.abort();const ctrl=new AbortController();lectureAbort.current=ctrl;provRef.current=null;
    return {signal:ctrl.signal,onProvisoire:p=>{if(!mounted.current||lectureJeton.current!==jeton||!p.ok||!p.result)return;if(pages)setNPagesLues(p.pagesLues??0);surProvisoire(p,documentHash);}};
  };
  /* D7 : dès qu'un justificatif est parti sous cette saisie (même `submissionId`, donc même `proof-…` dans Drive), un autre fichier n'est ni lu, ni scanné, ni posé :
     il ne serait jamais envoyé (save() saute l'envoi) ou irait contre l'empreinte de la dépense déjà écrite. Défense en profondeur : les boutons sont déjà désactivés. */
  const refusDeFichier=():string|null=>pendingRef.current?'L’enregistrement attend sa confirmation : le fichier ne peut plus être changé. Touche « Vérifier la synchronisation ».':proofAttached.current?'Le justificatif est déjà rattaché à cette dépense : le fichier ne peut plus être changé.':proofSent.current?'Ce fichier est déjà parti pour cette saisie. Pour en joindre un autre, ferme et rouvre : rien n’a été enregistré.':null;
  /* La dépense lue d'avant, remise à zéro quand un nouveau document ou un nouveau lot de pages est choisi (la description tapée est gardée). */
  const remettreLaDepenseAZero=()=>patch({amount:undefined,vendor:'',invoiceNumber:'',...(draft.descriptionSource==='typed'&&draft.description.trim()?{}:{description:'',descriptionSource:undefined}),date:swissToday(),lines:[{...newLine(initialIntent),description:draft.descriptionSource==='typed'?draft.description:''}],sourceCurrency:'CHF',sourceAmount:undefined,sourceNetAmount:undefined,sourceVatRate:undefined,sourceVatAmount:undefined,scanModel:undefined,sourceDocumentType:undefined,sourceOrderNumber:undefined,sourceTotalBasis:undefined});
  /* La lecture d'avant s'efface : erreur, reçu, lecture, QR. */
  const effacerLecture=()=>{setFusion(null);setPerdues([]);setPerduesIds([]);setNGardees(0);setVerif('aucune');provRef.current=null;setError('');setProofSending('');setReceipt(undefined);setAttempted(false);setScan(null);setReviewedFields([]);setSimilarState(null);setDeja(null);qrJeton.current++;setQrRes(undefined);setQrChoix(null);setQrOuvert(undefined);setQrVus(new Set());setQrChoixChamps({});qrAvantChamps.current={};};
  /* Les pages d'avant s'en vont (URL d'objet révoquées), avec leur PDF, leur lecture confirmée et l'entrée rouverte par « Changer ». */
  const libererPages=()=>{for(const p of pagesRef.current)if(p.url)URL.revokeObjectURL?.(p.url);pagesRef.current=[];pdfRef.current=null;setPages([]);setNPagesLues(0);setAssemblageEchoue(false);setEntreeOuverte(false);};
  const attach=async(file:File,lireQuandMeme=false)=>{
    if(scanLocked.current||saveLocked.current)return;
    const refus=refusDeFichier();if(refus){setError(refus);return;}
    if(file.size>4*1024*1024 || !['image/jpeg','image/png','image/webp','application/pdf'].includes(GeminiScannerService.normalizeMimeType(file))){setError('Choisis un JPG, PNG, WebP ou PDF de 4 Mo maximum.');return;}
    if(pagesRef.current.length)libererPages();
    if(attachment&&scan?.ok)remettreLaDepenseAZero();
    scanLocked.current=true;setBusy(true);effacerLecture();
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
      const outcome=await GeminiScannerService.scanDocument(file,'fast',optionsFlux(documentHash));
      if(!mounted.current)return;
      finLecture(outcome,documentHash);
    }catch(e:any){if(mounted.current)setError(e.message||'Lecture indisponible. Saisis les informations manuellement.');}
    finally{scanLocked.current=false;if(mounted.current){setBusy(false);setShowForm(true);if(verifRef.current==='attente')finDePartie();}}
  };
  /* ------- n2-pages : plusieurs images pour une dépense ------- */
  const urlDePage=(file:File)=>typeof URL.createObjectURL==='function'?URL.createObjectURL(file):'';
  /* Une page de plus, dans la file des ajouts : les plafonds (4 pages, 4 Mo la page, 12 Mo en tout, jamais deux fois la même) se lisent sur `pagesRef` au moment où la page passe.
     Quand une dépense est déjà jointe (« Changer » a rouvert l'entrée), la première page d'un nouveau lot remet tout à zéro, comme `attach` pour un document. */
  const ajouterUnePage=async(file:File)=>{
    if(!mounted.current||scanLocked.current||saveLocked.current)return;
    const refus=refusDeFichier();if(refus){setError(refus);return;}
    const nouveauLot=Boolean(etatRef.current.attachment);
    const base=nouveauLot?[]:pagesRef.current;
    const avant=refuserPage(file,base);if(avant){setError(avant);return;}
    const empreinte=await empreinteDePage(file);
    /* « Lire » a pu partir pendant l'empreinte : cette page n'est ni dans le PDF ni dans la lecture, elle n'entre pas non plus dans la pile ni dans « N pages ». */
    if(!mounted.current||scanLocked.current)return;
    const refusEmpreinte=refuserPage(file,nouveauLot?[]:pagesRef.current,empreinte);if(refusEmpreinte){setError(refusEmpreinte);return;}
    if(nouveauLot){
      libererPages();
      if(etatRef.current.scanOk)remettreLaDepenseAZero();
      effacerLecture();setAttachment(null);patch({proofDataUrl:undefined,proofFileName:undefined,proofType:undefined,documentHash:undefined});setJustifOuvert(false);
    }
    const page:PageRangee={id:crypto.randomUUID(),file,url:urlDePage(file),empreinte};
    pagesRef.current=[...pagesRef.current,page];setPages(pagesRef.current);setError('');setAssemblageEchoue(false);setEntreeOuverte(false);setShowForm(false);
  };
  const ajouterPage=(file:File)=>{fileAjouts.current=fileAjouts.current.then(()=>ajouterUnePage(file)).catch(()=>undefined);};
  const retirerPage=(id:string)=>{
    const page=pagesRef.current.find(p=>p.id===id);
    if(page?.url)URL.revokeObjectURL?.(page.url);
    pagesRef.current=pagesRef.current.filter(p=>p.id!==id);setPages(pagesRef.current);setError('');setAssemblageEchoue(false);
  };
  /* Après un échec d'assemblage : saisir à la main, les pages retirées (le formulaire s'ouvre, rien n'est lu). */
  const saisirSansPages=()=>{libererPages();setError('');setShowForm(true);};
  /* Un fichier lâché : un seul = comme aujourd'hui (une page de plus quand la rangée est ouverte) ; plusieurs d'un coup : refusés, jamais la page 2 perdue en silence. */
  const MESSAGE_DEPOT='Dépose un seul document à la fois. Pour plusieurs pages, touche « Plusieurs ».';
  const deposer=(e:React.DragEvent,vers:'document'|'page')=>{
    e.preventDefault();setDropping(false);
    const fichiers=Array.from(e.dataTransfer.files??[]);
    if(fichiers.length>1){setError(MESSAGE_DEPOT);return;}
    if(fichiers[0])vers==='page'?ajouterPage(fichiers[0]):void attach(fichiers[0]);
  };
  /* Le bulletin de versement (QR-facture) est en dernière page : les pages se lisent de la dernière à la première, jusqu'au premier QR lu. */
  const lancerQrPages=(fichiers:File[])=>{
    const jeton=++qrJeton.current;
    setQrRes(null);setQrOuvert(undefined);
    void(async()=>{
      let dernier:ResultatQr={statut:'non-verifie',motif:'lecture impossible'};
      for(const fichier of [...fichiers].reverse()){
        dernier=await lireQrDuFichier(fichier).catch(():ResultatQr=>({statut:'non-verifie',motif:'lecture impossible'}));
        if(dernier.statut==='lu'||qrJeton.current!==jeton)break;
      }
      if(mounted.current&&qrJeton.current===jeton)setQrRes(dernier);
    })();
  };
  /* « Lire N pages » : une seule lecture des N originales ; le justificatif est le PDF assemblé d'abord (un échec s'arrête avant toute lecture payante). Une page seule = « Un document ». */
  const lirePages=async(lireQuandMeme=false)=>{
    const lot=pagesRef.current;
    if(lot.length===1){await attach(lot[0].file,lireQuandMeme);return;}
    if(lot.length<2||scanLocked.current||saveLocked.current)return;
    const refus=refusDeFichier();if(refus){setError(refus);return;}
    scanLocked.current=true;setBusy(true);setAssemblageEchoue(false);setEntreeOuverte(false);
    if(etatRef.current.attachment&&etatRef.current.scanOk)remettreLaDepenseAZero();
    effacerLecture();
    let pose=false;
    try {
      const cle=lot.map(p=>p.id).join('|');
      if(pdfRef.current?.cle!==cle)pdfRef.current={cle,...await assemblerPdf(lot.map(p=>p.file))};
      const pdf=pdfRef.current!;
      const proofDataUrl=await GeminiScannerService.fileToDataUrl(pdf.file);
      const documentHash=await empreinteDesPages(lot.map(p=>p.empreinte));
      if(!mounted.current)return;
      setAttachment(pdf.file);pose=true;
      patch({proofDataUrl,proofFileName:pdf.file.name,proofType:'application/pdf',documentHash});
      /* Les mêmes pages qu'une dépense saisie : certain, donc ni lecture ni coût ; « Lire quand même » le lève. */
      const meme=lireQuandMeme?undefined:purchaseSameFile(documentHash,transactions,draft.submissionId);
      if(meme){setDeja(meme.id);return;}
      lancerQrPages(lot.map(p=>p.file));
      const outcome=await GeminiScannerService.scanPages(lot.map(p=>p.file),optionsFlux(documentHash,true));
      if(!mounted.current)return;
      setNPagesLues(outcome.ok?outcome.pagesLues??0:0);
      finLecture(outcome,documentHash);
    }catch(e:any){if(mounted.current){setError(e.message||'Lecture indisponible. Saisis les informations manuellement.');if(!pose)setAssemblageEchoue(true);}}
    finally{scanLocked.current=false;if(mounted.current){setBusy(false);if(pose)setShowForm(true);if(verifRef.current==='attente')finDePartie();}}
  };
  /* « Changer » sur des pages : l'entrée (« Un document » | « Plusieurs ») s'ouvre au-dessus de la dépense, qui ne bouge pas ; rien n'est remis à zéro avant le premier nouveau fichier. */
  const ouvrirEntree=()=>{const refus=refusDeFichier();if(refus){setError(refus);return;}setEntreeOuverte(true);};
  /* Le justificatif joint est-il le PDF de ces pages ? Alors la pile « N » et le panneau des pages sont dits, lue ou non. */
  const pagesJointes=pages.length>1&&attachment&&pdfRef.current&&attachment===pdfRef.current.file?pages.length:0;
  /* Le banc de développement pose la lecture simulée sans appeler Gemini ni lire de fichier (état 1 : la lecture reste « en cours »). */
  useEffect(()=>{
    if(!apercu)return;
    const file=new File([''],apercu.fichier.name,{type:apercu.fichier.type});
    setAttachment(file);setShowForm(true);
    patch({proofDataUrl:'data:application/pdf;base64,JVBERi0xLjQK',proofFileName:apercu.fichier.name,proofType:apercu.fichier.type,documentHash:'simule'});
    let minuteur:ReturnType<typeof setTimeout>|undefined;
    if(apercu.etat==='1'||apercu.etat==='qr-lecture')setBusy(true);
    else if(apercu.provisoire){
      /* Lenteur D : le provisoire à l'ouverture, puis le final `delaiMs` plus tard (jamais : l'attente reste). Le même chemin que la vraie lecture (`surProvisoire`, `finLecture`). */
      scanLocked.current=true;lectureJeton.current++;surProvisoire(apercu.provisoire,'simule');
      const fin=apercu.final;if(fin&&apercu.delaiMs!==null&&apercu.delaiMs!==undefined)minuteur=setTimeout(()=>{if(!mounted.current)return;scanLocked.current=false;finLecture(fin,'simule');},apercu.delaiMs);
    }
    else applyOutcome(apercu.outcome,'simule');
    /* Le banc du QR : un vrai fichier fictif, lu par le vrai décodeur du navigateur (la lecture Gemini reste simulée). */
    if(apercu.qrSimule){qrJeton.current++;setQrRes(apercu.qrSimule);}
    else if(apercu.qrFichier){const q=apercu.qrFichier;fetch(q.url).then(r=>r.blob()).then(b=>lancerQr(new File([b],q.name,{type:q.type}))).catch(()=>undefined);}
    const t=setTimeout(()=>{document.body.dataset.apercu=apercu.etat;},apercu.provisoire&&apercu.delaiMs?apercu.delaiMs+400:120);
    return()=>{clearTimeout(t);if(minuteur)clearTimeout(minuteur);};
  },[]);
  const save=async()=>{
    if(saveLocked.current||scanLocked.current||verifRef.current==='attente')return;
    if(scan?.ok&&scan.result?.documentType==='credit_note'){setError('Ce document est un avoir. Enregistre-le comme remboursement dans Finances, ou joins la facture de l’achat.');return;}
    // Devant un achat peut-être déjà enregistré, le choix passe avant les champs : « même achat » n'en demande aucun.
    if(errors.length){setAttempted(true);setError('');focusIssue(shownErrors.find(message=>message.includes('doublon'))??shownErrors[0]);return;}
    saveLocked.current=true;setSaving(true);setError('');setProofSending('');
    try {
      let proof=receipt;
      if(apercu){proof=await apercu.enregistrer(draftEff);setReceipt(proof);}
      else{
      /* `proofSent` ne se pose qu'à un signal sûr : le retour du service (original confirmé dans Drive) ou `drive/in-progress` (plus bas). Jamais avant l'appel. */
      let acked=false;
      if(!pendingId){
        const saved=await savePurchaseWithProofReceipt(draftEff);if(draft.proofDataUrl)proofSent.current=true;pendingRef.current=true;setPendingId(saved.transactionId);setReceipt(saved.proof);proof=saved.proof;
        /* Le fichier part au Drive en arrière-plan (file locale) : aucun reçu à l'écran. Hors ligne, l'écriture en file locale suffit à fermer ; son accusé est attendu hors de la feuille (T5). */
        if(saved.queued){queuedRef.current=true;if(canCloseWithoutAck(saved.transactionId)){watchPurchaseConfirmation(draftEff);acked=true;}}
      }
      if(!acked)await confirmPurchase(draftEff);
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
    const target=articleDe(line),unite=uniteEffective(effDe(line));
    /* D213/D214 : la conversion se voit (« 25 kg → 25 000 g »), une unité illisible se dit (« unité à préciser »), le poids d'un sachet non confirmé aussi. */
    const notes=target?[line.quantity!==undefined&&isReadableUnit(unite)?formatUnitLink(line.quantity,unite,target.unit,target.category):'',isReadableUnit(unite)?'':'unité à préciser',proposed&&proposedStock.current.has(line.id+PROPOSAL_WEIGHT_MARK)?'poids du sachet non confirmé':''].filter(Boolean):[];
    return {meta:[kinds.find(kind=>kind.value===line.kind)?.label,line.quantity!==undefined?`${String(line.quantity).replace('.',',')} ${line.unit}`.trim():''].filter(Boolean).join(' · '),linked:[stock||equipment,...notes].filter(Boolean).join(' · '),notes,proposed};
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
  /* D277 : « unité à remplir » seulement quand elle ne se déduit pas (rouge) ; une unité déduite est jaune ou sûre, jamais « ? ». */
  const precisIds=new Set(draft.lines.filter(line=>STOCK_KINDS.includes(line.kind)&&line.stockAction!=='none'&&!isReadableUnit(uniteDe(line))).map(line=>line.id));
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
  /* D277 : le point « unité absente » d'une ligne dont l'unité se déduit n'est plus un point : la rangée la dit (jaune, ou rien si elle est sûre). */
  const uniteDeduiteDe=(c:Chip)=>{const l=c.ligne?draft.lines.find(x=>x.id===`line-${c.ligne}`):undefined;return Boolean(l&&isReadableUnit(uniteDe(l)));};
  const chips=[...chipQr,...chipsDeLecture(points,extras).filter(c=>!(qrContredit&&c.nom==='Total'&&c.source==='point')&&!(c.codes.length>0&&c.codes.every(code=>code==='unite-absente')&&uniteDeduiteDe(c)))].map(c=>c.source==='mouture'?{...c,nom:`${c.nom}${sommeMoutures>0?` +${(sommeMoutures/100).toFixed(2).replace('.',',')}`:''}`}:c.codes.includes('unite-absente')&&c.ligne?{...c,nom:`${premierMot(nomAffiche(draft.lines.find(l=>l.id===`line-${c.ligne}`)?.description??c.nom))} unité`}:c);
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
    /* D275d : un « bis » fait nouvel article d'office n'est réglé qu'au choix du brasseur (son bouton, ⇄ ou le menu). */
    if(chip.source==='voisin'){const l=draft.lines.find(x=>x.id===chip.cible);return (l?.stockAction==='new'&&!neufDOffice.current.has(l.id))||(l?.stockAction==='existing'&&Boolean(l.stockRef));}
    if(chip.codes.includes('unite-absente')){const l=draft.lines.find(x=>x.id===ligneDe(chip));return Boolean(l&&isReadableUnit(uniteDe(l)));}
    return false;
  };
  const reglesSet=new Set(chips.filter(estRegle).map(c=>c.id));
  const tout=chips.length>0&&chips.every(c=>reglesSet.has(c.id));
  const lienDe=(line:PurchaseLineDraft):LienStock=>precisIds.has(line.id)?'precis':line.stockAction==='existing'?(line.stockRef?'relie':'aucun'):line.stockAction==='new'?'neuf':'aucun';
  /* D233 : « y aller » va toujours quelque part. `viser` ouvre les <details> qui contiennent la cible, la fait défiler visible (le défilant réserve la
     hauteur de la bande : scroll-padding-top) et y met le focus sans second défilement. Le panneau (TVA, paiement) ou la preuve s'ouvre d'abord, de façon synchrone. */
  const viser=(el:HTMLElement|null|undefined,opts:{focus?:HTMLElement|null;block?:ScrollLogicalPosition}={}):boolean=>{
    if(!el)return false;
    reveler(el);
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
    if(el){
      reveler(el);
      if(el.closest('[hidden]'))flushSync(()=>setFiltre(null));
      if(el.closest('[data-dp="port-tiroir"]'))flushSync(()=>setPortOuvert(true));
      const d=el.querySelector('details');if(d)d.open=true;viser(el);return;
    }
    if(chip.codes.includes('date-absente')&&viser(q('[data-purchase-date]'),{focus:q('[data-purchase-date] input[type="date"]')}))return;
    if(chip.codes.some(c=>c==='somme-ecart'||c==='somme-incomplete'||c==='total-absent')){const champ=q('#purchase-total');if(viser(champ,{focus:champ,block:'center'}))return;}
    if(chip.codes.some(c=>c==='lignes-perdues'||c==='lignes-annoncees'||c==='lignes-non-rapprochees')&&viser(q('[data-dp="liste"]')??q('[data-purchase-lines]')))return;
    /* Sans cible propre : la preuve de la lecture, ouverte et amenée à l'écran. */
    flushSync(()=>setViseePreuve(true));viser(q('[data-dp="preuve"]'));setTimeout(()=>{if(mounted.current)setViseePreuve(false);},1600);
  };
  const remarques=result?[...new Set([...result.issues,...(result.review?.findings??[]),...result.items.flatMap(item=>item.ambiguity?[`${item.name||'Article'} : ${item.ambiguity}`]:[])].map(p=>p.trim()).filter(Boolean))].filter(p=>!(points??[]).some(pt=>pt.message===p)):[];
  const driveOk=apercu?apercu.drive==='ok':draft.proofDataUrl?FirebaseAuthService.hasDriveAccess():true;void driveTick;
  /* R1 : un prix « avec mouture » seulement si le catalogue l'écrira (latestBrewPrices) : malt relié au stock, mouture de genre service à montant positif, lien confirmé. */
  const eur=(cents:number)=>(cents/100).toFixed(2).replace('.',',');
  const prixMouture=(index:number,confirme:boolean)=>{const malt=draft.lines[index],m=draft.lines[index+1];if(!m||!malt||malt.stockAction==='none'||m.kind!=='service'||!((m.amount??0)>0)||(confirme&&parentDeLaMouture(draft.lines,index+1)!==index))return undefined;const p=prixAvecMouture(malt,m);return p?`${p.exact?'':'≈ '}${eur(p.cents)}/${malt.unit}`:undefined;};
  const kgPrix=(index:number)=>{const p=prixMouture(index,true);return p?`${p} avec mouture`:undefined;};
  const lieAuStock=(description:string,unit:string,quantity?:number,noms?:{nameFr?:string;nomLu?:string})=>memeProduit(description,unit,sansCetteSaisie([...stocks.rawMaterials,...stocks.cleaning],draft.submissionId),quantity,draft.vendor,noms);
  /* S6 (T3, T4) : l'article neuf de chaque ligne non reliée, DÉRIVÉ de la ligne et du stock courants par la fonction même de l'enregistrement : ce qui est montré est ce qui
     est écrit. Seul le nom tapé (`articleName`) est gardé ; les lignes « neuves » plus haut comptent pour le suffixe (« bis », « bis 2 »). Mis en cache par ligne. */
  const existants=sansCetteSaisie([...stocks.rawMaterials,...stocks.cleaning],draft.submissionId);
  existantsCourants.current=existants;draftCourant.current=draft;courantRef.current={reviewedFields,reglees,stockItems:[...stocks.rawMaterials,...stocks.cleaning]};
  const signatureStock=`${draft.vendor}§`+existants.map(item=>`${item.ref}|${item.name}|${item.category}|${item.unit}|${item.supplier??''}|${item.alphaPct??''}|${item.colorEbc??''}|${item.origin??''}|${item.fiche?.id??''}`).join(';');
  const neufParLigne=new Map<string,ArticleNeuf>();
  {
    const virtuels:MembreVirtuel[]=[];
    for(const l of draft.lines){
      if(!STOCK_KINDS.includes(l.kind)||l.stockAction==='existing'||!l.description.trim())continue;
      const sig=[l.description,l.nameFr,l.nomLu,uniteDe(l),l.quantity,l.stockCategory,l.sourceReference,l.kind,l.articleName,virtuels.map(v=>v.nom).join('|'),signatureStock,catalogues.houblons?'c':'-'].join('§');
      let cache=cacheNeuf.current.get(l.id);
      if(!cache||cache.sig!==sig){cache={sig,neuf:articleNeufDe(ligneDeBrouillon({...l,unit:uniteDe(l)},draft.vendor),existants,catalogues,l.articleName,virtuels)};cacheNeuf.current.set(l.id,cache);}
      neufParLigne.set(l.id,cache.neuf);
      if(l.stockAction==='new')virtuels.push({nom:cache.neuf.name});
    }
  }
  const nomPrisParAutre=(id:string,nom:string)=>{const avant:MembreVirtuel[]=[];for(const l of draft.lines){if(l.id===id)break;const n=neufParLigne.get(l.id);if(l.stockAction==='new'&&n)avant.push({nom:n.name});}return nomsPris(existants,avant).has(pliee(nom));};
  const tailleMo=(()=>{const o=attachment?.size||apercu?.fichier.size;return o?Math.round(o/1e5)/10:0;})();
  const nUnite=shownErrors.filter(m=>m.includes('unité à préciser')).length;
  const enSauvegarde=saving&&!pendingId;
  const totalField=<NumberInput id="purchase-total" fractionDigits={2} aria-label="Total TTC en CHF" aria-describedby={[hints.amountTTC?'scan-hint-amountTTC':'',attempted&&shownErrors.some(issue=>issue.includes('total'))?validationId:''].filter(Boolean).join(' ')||undefined} value={draft.amount} onValue={setTotal} emptyValue={undefined} min={0} placeholder="0,00" className={`${inputClass} !text-[32px] !leading-[1.05] font-mono font-semibold tabular-nums !min-h-0 !h-[34px] !py-0 !w-[7ch] min-w-0 !border-0 !border-b !border-dotted !bg-transparent !px-0${qrContredit&&qrChoix===null?' !border-b-2 !border-attention !text-attention':''}`}/>;
  /* ------- p3c-3 : l'ensemble de lignes affiché (R2), le port (P5), les groupes (P10), le filtre ------- */
  const port=lignesDePort(draft.lines);
  const lignesAff=draft.lines.filter(l=>!port.has(l.id));
  const portTexte=(()=>{const c=portCents(draft.lines,port);return c===null?null:fr2c(c);})();
  const parentIdxDe=(i:number)=>i>=0&&i<draft.lines.length?millingParentIndex(draft.lines,i):-1;
  const contexteLigne=(line:PurchaseLineDraft)=>{const a=articleDe(line);return a?contexteDeArticle(a):donneesDeLigne(ligneDeBrouillon(line,draft.vendor)).contexte;};
  const groupeDeLigne=(i:number):GroupeCle=>{const p=parentIdxDe(i),l=draft.lines[p>=0?p:i];return groupeDe(contexteLigne(l),l.kind,l.description,l.stockCategory,articleDe(l)?.category,draft.category);};
  const sousFamilleLigne=(i:number):string|undefined=>{const p=parentIdxDe(i),l=draft.lines[p>=0?p:i];return sousFamilleDeLigne(contexteLigne(l),l.kind,l.description,l.stockCategory,articleDe(l)?.category,draft.category);};
  const numeros=numerosPapier(draft.lines,port);
  const visibles=filtre?new Set(filtre.ids.flatMap(id=>{const i=draft.lines.findIndex(l=>l.id===id);const p=parentIdxDe(i);return p>=0?[id,draft.lines[p].id]:[id];})):null;
  const douteuxIds=new Set<string>();
  /* D307 : les rangées dont le plateau est ouvert (elles ouvrent leur sous-groupe : jamais une rangée ouverte cachée dans un groupe replié). */
  const plateauxOuverts=new Set<string>();
  const basculeMouture=(id:string,liee:boolean)=>{if(liee)updateLine(id,{surchargeOf:undefined});else patch({lines:confirmMillingSurcharge(draft.lines,id)});};
  /* Le tableau « lu → avec mouture » (C16, R1) : monté au plateau du malt de la première mouture proposée ; il ne lie rien (« Laisser en service » non plus). */
  const tableauEl=mouturesPropositions.length&&!laissees?<div data-dp="tableau-moutures" className="w-full rounded-panel border-2 border-cave-50/80 p-2 space-y-1 text-sm">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 gap-y-0.5 text-xs text-cave-400"><span>malt</span><span>lu /kg</span><span/><span>avec mouture</span>
        {mouturesPropositions.map(p=>{const i=draft.lines.findIndex(l=>l.id===p.parentId),malt=draft.lines[i],lu=malt?.unitPrice,apres=prixMouture(i,false);return <React.Fragment key={p.lineId}><span className="text-cave-200">{nomAffiche(malt.description,articleDe(malt))}</span><span className="font-mono text-cave-200">{lu===undefined?'—':eur(Math.round(lu*100))}</span><span>→</span><span className="font-mono text-cave-50">{apres?`${apres.replace('≈ ','')} /${malt.unit}`.replace(`/${malt.unit} /${malt.unit}`,`/${malt.unit}`):'non relié : pas de prix'}</span></React.Fragment>;})}</div>
      <div className="flex gap-1.5"><button type="button" onClick={()=>setLaissees(true)} className="min-h-7 rounded-control border border-cave-600 px-2 text-sm text-cave-200">Laisser en service</button></div></div>:null;
  /* D277 : le contexte de la confiance (toutes les lignes avec leur unité déduite, le stock, le total, les points recalculés : une valeur corrigée baisse son drapeau). */
  const ctxConf=contexteConfiance(draftEff,articlesStock,points);
  /* Lenteur D : les cellules d'une rangée que la 3.8 a corrigées (le bleu, l'ancienne valeur barrée sous le nom). Une correction que le brasseur a retapée depuis n'est plus montrée : la valeur est la sienne. */
  const memeValeur=(a:unknown,b:unknown)=>JSON.stringify(a??null)===JSON.stringify(b??null);
  const corrigeeDe=(line:PurchaseLineDraft)=>{
    const cs=fusion?.lignes[line.id]?.filter(c=>memeValeur((line as unknown as Record<string,unknown>)[c.champ],c.apres));
    if(!fusion||!cs?.length)return undefined;
    const champs=new Set<string>(cs.map(c=>c.champ));
    return {qte:champs.has('quantity')||champs.has('unit'),prix:champs.has('unitPrice'),montant:champs.has('amount'),nom:champs.has('description')||champs.has('imprime')||champs.has('nomLu'),avant:libelleAvant(fusion.avant[line.id]??{},cs,line)};
  };
  const construire=(line:PurchaseLineDraft,index:number,simple:boolean):React.ReactNode=>{
    const mp=mouturesPropositions.find(p=>p.lineId===line.id),parentIdx=parentDeLaMouture(draft.lines,index),neuf=neufParLigne.get(line.id),nomRefuse=line.stockAction==='new'&&Boolean(line.articleName?.trim())&&nomPrisParAutre(line.id,line.articleName!);
    const isMouture=Boolean(mp)||parentIdx>=0;
    /* Les pièces de la ligne : le formulaire simple (saisie sans justificatif) les montre toutes ; le plateau de p3c-3 n'en garde que l'utile au premier plan,
       le reste derrière un seul « plus » (VERDICT-f3, défaut 1). Une pièce n'existe qu'une fois : le nom de l'article, la quantité, l'unité, le montant. */
    const libelleEl=<div className="flex items-center gap-2"><div className="flex-1 min-w-0"><Field label="Libellé de la facture"><TextInput aria-label={`Libellé ligne ${index+1}`} value={line.description} onChange={description=>{updateLine(line.id,{description,nameFr:undefined});if(line.imprime)void retenirNomBrasseur({name:line.imprime.nom,variant:line.imprime.variante,unit:line.unit},description);}} placeholder="Article ou prestation"/></Field></div>{draft.lines.length>1?<button type="button" aria-label={`Retirer la ligne ${index+1}`} onClick={()=>patch({lines:draft.lines.filter(item=>item.id!==line.id)})} className="min-h-7 min-w-7 text-cave-400 flex justify-center items-center"><Trash2 size={17}/></button>:null}</div>;
    const changerNature=(kind:PurchaseLineDraft['kind'])=>{manuallyClassified.current.add(line.id);proposedStock.current.delete(line.id);updateLine(line.id,{kind,stockAction:'none',equipmentAction:'none'});};
    const natureEl=<Field label="Type d’achat"><select aria-label={`Nature ligne ${index+1}`} value={line.kind} onChange={e=>changerNature(e.target.value as PurchaseLineDraft['kind'])} className={inputClass}>{kinds.map(kind=><option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></Field>;
    const ttcEl=<Field label="TTC (CHF)"><NumberInput aria-label={`Montant ligne ${index+1}`} value={line.amount} onValue={amount=>{updateLine(line.id,{amount});if(draft.lines.length===1)patch({amount});}} emptyValue={undefined} className={`${inputClass} tabular-nums`}/></Field>;
    const calculOk=line.quantity!==undefined&&line.unitPrice!==undefined&&line.amount!==undefined?lineMathCheck([{id:line.id,name:line.description,kind:line.kind,quantity:line.quantity,unit:line.unit,price:line.unitPrice,amountTTC:line.amount}]).points.length===0:undefined;
    const mathEl=calculOk!==undefined?<p className={`text-xs ${calculOk?'text-cave-200':'text-attention'}`}>{String(line.quantity).replace('.',',')} × {fr(line.unitPrice!)} {calculOk?'= montant ✓':'≠ montant, écart à vérifier'}</p>:null;
    const extraitEl=line.evidence?<details className="text-xs text-cave-400"><summary className="cursor-pointer min-h-8 flex items-center">Voir l’extrait du document</summary><p className="text-cave-200 leading-relaxed">{line.evidence}</p></details>:null;
    const interrupteurEl=<Interrupteur label={`Mettre en stock, ligne ${index+1}`} actif={line.stockAction!=='none'} onChange={on=>{proposedStock.current.delete(line.id);neufDOffice.current.delete(line.id);if(on)updateLine(line.id,{stockAction:'existing',stockRef:proposedRef.current.get(line.id)??''});else updateLine(line.id,{stockAction:'none'});}}/>;
    const choixStockEl=<select aria-label={`Stock ligne ${index+1}`} value={line.stockAction} onChange={e=>{const v=e.target.value as any;proposedStock.current.delete(line.id);neufDOffice.current.delete(line.id);const meme=v==='new'?lieAuStock(line.description,uniteDe(line),line.quantity,{nameFr:line.nameFr,nomLu:line.nomLu}):undefined;if(meme)relieAuto.current.set(line.id,meme.name);else relieAuto.current.delete(line.id);updateLine(line.id,meme?{stockAction:'existing',stockRef:meme.ref}:{stockAction:v});}} className={inputClass}><option value="none">Aucun mouvement de stock</option><option value="existing">Ajouter à un article existant</option><option value="new">Créer un nouvel article</option></select>;
    const comboArticleEl=<Combobox ariaLabel="Article" value={line.stockRef||''} onChange={stockRef=>{proposedStock.current.delete(line.id);updateLine(line.id,{stockRef});}} options={stockOptions} placeholder="Chercher dans le stock"/>;
    const relieEl=line.stockAction==='existing'?<>{relieAuto.current.has(line.id)?<p className="text-xs text-cave-200">relié à « {relieAuto.current.get(line.id)} », nom déjà au stock</p>:null}{comboArticleEl}{articleDe(line)?.fiche?<p data-dp-fiche className="text-xs text-cave-200">{phraseFiche(articleDe(line)!.fiche!,catalogues)}</p>:null}</>:null;
    const nomEl=line.stockAction==='new'&&neuf?<NomArticle index={index} line={line} neuf={neuf} prisParAutre={nomRefuse} onNom={articleName=>updateLine(line.id,{articleName})}/>:null;
    const champQte=<NumberInput aria-label={`Quantité ligne ${index+1}`} value={line.quantity} onValue={quantity=>updateLine(line.id,{quantity})} emptyValue={undefined} min={0} className={inputClass}/>;
    const champUnite=(cls:string,ph?:string,niv?:Niveau)=><TextInput aria-label={`Unité ligne ${index+1}`} {...(niv&&niv!=='sur'?{'data-dp-niveau':niv}:{})} value={line.unit} onChange={unit=>updateLine(line.id,{unit})} placeholder={ph??effDe(line).uniteDeduite?.unite??"kg, g, L, sachet…"} className={cls}/>;
    const qteUniteEl=line.stockAction!=='none'?<div className="grid grid-cols-2 gap-2"><Field label="Quantité reçue">{champQte}</Field><Field label="Unité lue / reçue">{champUnite('')}</Field></div>:null;
    const materielEl=line.kind==='equipment'||line.kind==='maintenance'?<div className="space-y-2"><Field label={line.kind==='equipment'?'Fiche matériel':'Matériel entretenu'}><select aria-label={`Matériel ligne ${index+1}`} value={line.equipmentAction} onChange={e=>updateLine(line.id,{equipmentAction:e.target.value as any})} className={inputClass}><option value="none">Ne pas lier de matériel</option>{line.kind==='equipment'?<option value="new">Créer la fiche de ce matériel</option>:null}<option value="existing">Lier un matériel déjà présent</option></select></Field>{line.equipmentAction==='existing'?<Combobox ariaLabel="Matériel" value={line.equipmentRef||''} onChange={equipmentRef=>updateLine(line.id,{equipmentRef})} options={equipmentOptions} placeholder="Chercher un matériel"/>:null}{line.equipmentAction==='new'?<p className="text-xs text-cave-400">La fiche reprendra le prix et la date de cet achat. L’amortissement se renseigne dans Finances → Annuel.</p>:null}</div>:null;
    const fields=<>
          {!simple&&libelleEl}
          <div className={simple?'':'grid grid-cols-[1fr_7.5rem] gap-2'}>{natureEl}{!simple&&ttcEl}</div>
          {!simple&&mathEl}
          {extraitEl}
          {STOCK_KINDS.includes(line.kind)?<div className="space-y-2"><label className="text-sm text-cave-200 flex items-center gap-2"><Package size={16}/>Réception en stock</label>
            {interrupteurEl}{choixStockEl}{nomEl}{relieEl}{qteUniteEl}</div>:null}
          {materielEl}
    </>;
    if(simple)return <article data-purchase-line key={line.id} className="border-t border-cave-700 py-2 space-y-2">{fields}</article>;
    const status=lineStatus(line),article=articleDe(line),regle=neuf?.regle,lu=STOCK_KINDS.includes(line.kind)&&line.description.trim()?donneesDeLigne(ligneDeBrouillon(line,draft.vendor)):undefined,alphaLu=lu?.contexte==='Houblon'&&lu.donnees.alpha!==undefined?fr(lu.donnees.alpha):undefined,ebcLu=lu?.contexte==='Malt'&&lu.donnees.ebc!==undefined?fr(lu.donnees.ebc):undefined,existant=regle?.cas==='meme'?regle.article:undefined,voisin=regle?.cas==='neuf'||regle?.cas==='incertain'?regle.voisin:regle?.cas==='ambigu'?regle.candidats[0]:undefined;
    const parent=parentIdx>=0?draft.lines[parentIdx]:mp?draft.lines[draft.lines.findIndex(l=>l.id===mp.parentId)]:undefined;
    const premiereMouture=mp&&mouturesPropositions[0]?.lineId===line.id;
    const relier=(ref:string)=>{proposedStock.current.delete(line.id);updateLine(line.id,{stockAction:'existing',stockRef:ref});};
    /* r2b (`data-autre`) : ⇄ ouvre le plateau de la ligne sur le choix de l'article ; rien n'est relié d'un toucher. L'article se choisit dans le plateau. */
    const choisirAutre=()=>{
      proposedStock.current.delete(line.id);relieAuto.current.delete(line.id);neufDOffice.current.delete(line.id);updateLine(line.id,{stockAction:'existing',stockRef:''});
      requestAnimationFrame(()=>{const el=form.current?.querySelector<HTMLElement>(`[data-dp-ligne="${line.id}"]`),d=el?.querySelector('details');if(d)d.open=true;el?.scrollIntoView?.({block:'start',behavior:'smooth'});el?.querySelector<HTMLElement>('[aria-label="Article"]')?.focus?.();});
    };
    /* ------- D275, D277 : la rangée. Les niveaux viennent de `confiance.ts` (f2) sur la ligne avec son unité déduite ; rien quand c'est sûr. ------- */
    const eff=effDe(line),unite=uniteEffective(eff);
    const horsStock=['service','shipping','discount','other','maintenance'].includes(line.kind);
    const conf=confianceLigne(ligneConfianceDe(eff),ctxConf),nv=niveauxRangee(line,conf);
    const niveaux={...nv,nom:line.description.trim()?nv.nom:'inconnu' as Niveau,raisons:line.description.trim()?nv.raisons:['libellé à remplir',...nv.raisons]};
    /* Un « bis » fait nouvel article d'office (D215, D275d) : sa barre reste, jaune, tant qu'il n'a pas choisi (« Target bis » ou ⇄). */
    const bisAConfirmer=!isMouture&&line.stockAction==='new'&&neufDOffice.current.has(line.id)&&Boolean(voisin);
    const ambigu=!isMouture&&line.kind==='ingredient'&&line.stockAction==='none'&&regle?.cas==='ambigu'&&Boolean(voisin);
    const autre=<button type="button" aria-label="Choisir un autre article" title="Choisir un autre article" onClick={choisirAutre} className="min-h-7 min-w-7 rounded-control border border-cave-600 px-2 text-sm text-cave-200">⇄</button>;
    /* La barre sous la rangée : seulement un rouge (l'unité qui ne se déduit pas : g, kg, Stk) ou un jaune qui demande un geste (un bis, plusieurs articles). Aucun bouton « Créer » au repos. */
    /* VERDICT-f3-p2, détail 3 : plateau ouvert, la barre d’un bis se fond dans la ligne « article » (un seul ⇄) ; fermée, la barre reste. */
    const ouverte=ouvertesRef.current.has(line.id)?Boolean(ouvertesRef.current.get(line.id)):Boolean(startsOpen(line));
    if(ouverte)plateauxOuverts.add(line.id);
    const garderBisEl=bisAConfirmer&&regle&&voisin?<button type="button" aria-label={`Garder le nouvel article « ${neuf?.name??line.description.trim()} »`} onClick={()=>{neufDOffice.current.delete(line.id);proposedStock.current.delete(line.id);updateLine(line.id,{stockAction:'new'});}} className="min-h-7 rounded-control border border-dashed border-attention px-2 text-sm font-semibold text-attention">{neuf?.name??line.description.trim()}</button>:null;
    const stockBisEl=bisAConfirmer&&regle&&voisin?<span data-dp-stock-bis className="inline-flex items-center gap-1 text-xs text-cave-400 opacity-80"><Package size={14}/>stock : {etiquetteVoisin(regle,voisin)}</span>:null;
    const bisFondu=bisAConfirmer&&ouverte;
    const fixNiveau:Niveau|undefined=precisIds.has(line.id)?'inconnu':(bisAConfirmer&&!bisFondu)||ambigu?'repris':undefined;
    const correction=precisIds.has(line.id)?<><span className="text-xs text-alert">imprimé {line.quantity===undefined?'—':fr(line.quantity)} ? ·</span>{['g','kg','Stk'].map(u=><button key={u} type="button" onClick={()=>updateLine(line.id,{unit:u})} className="min-h-7 rounded-control border border-cave-600 px-2 text-sm text-cave-50">{u}</button>)}</>
      :bisAConfirmer&&regle&&voisin?(bisFondu?null:<>{stockBisEl}{garderBisEl}{autre}</>)
      :ambigu?<><span data-dp-ambigu className="text-xs text-attention">plusieurs articles « {voisin!.name} » : choisis</span>{autre}</>
      :null;
    const bis=bisAConfirmer||(!isMouture&&line.kind==='ingredient'&&line.stockAction==='none'&&Boolean(voisin||existant));
    const lien:LienStock=isMouture?'mouture':precisIds.has(line.id)?'precis':bis?'bis':lienDe(line);
    const douteux=Boolean(correction)||bisAConfirmer||Boolean(mp&&!laissees);
    if(douteux)douteuxIds.add(line.id);
    const enfantIdx=!isMouture&&parentIdxDe(index+1)===index?index+1:-1,enfant=enfantIdx>=0?draft.lines[enfantIdx]:undefined;
    const nomParent=parent?parent.description.split(',')[0]:'';
    const pk=prixMouture(index,true);
    const pastille=line.stockAction==='new'&&neuf?.fiche&&neuf.nomFiche?`fiche ${neuf.nomFiche}${neuf.fiche.approchee?' · approchée':''}`:effetStock({...line,unit:unite},article);
    const attention=line.stockAction==='new'&&Boolean(neuf?.fiche?.approchee);
    const cestMoutureEnPastille=ordre==='cat'&&Boolean(scan?.ok);
    const pastilleMouture=enfant&&cestMoutureEnPastille?(()=>{const liee=enfant.surchargeOf===line.id;const m=enfant.amount===undefined?'—':fr2c(Math.round(enfant.amount*100));const nm=line.description.split(',')[0];return {id:enfant.id,montant:m,liee,parent:nm,aria:`Mouture ${enfant.quantity===undefined?'':`${fr(enfant.quantity)} ${enfant.unit} × `}${enfant.unitPrice===undefined?'':fr(enfant.unitPrice)} = ${m}${liee?`, rattachée à ${nm} : détacher`:` : rattacher à ${nm}`}`,onBascule:()=>basculeMouture(enfant.id,liee)};})():undefined;
    const etat=pastilleMouture?undefined:pastilleEtat(line,unite);
    const opts=optionsEnFrancais(line,unite);
    const nomArticle=line.stockAction==='new'?(nomRefuse?neuf?.nomPropose:neuf?.name)??line.description.trim():article?.name;
    /* VERDICT-f3, défaut 1 : le plateau de p3c-3 tel quel (p3c-3-geste-plateau.png). Au premier plan : l'imprimé, l'état, `[q] u × [p] = [m]` et son verdict,
       Ingrédient / Service / Matériel, la ligne « article » (ou la fiche matériel), la mouture. Le reste derrière un seul « plus ». */
    const ud=eff.uniteDeduite;
    const segmentsUnite=ud&&ud.niveau==='repris'?(()=>{const d=shortUnit(ud.unite),choix=[...new Set([d,'g','kg','Stk'])];return <span data-dp-unite-segments role="group" aria-label={`Confirmer l’unité, ligne ${index+1}`} className="ml-1 inline-flex overflow-hidden rounded-control border border-attention align-middle">{choix.map(u=><button key={u} type="button" aria-pressed={u===d} onClick={()=>updateLine(line.id,{unit:u})} className={`min-h-7 px-2 text-sm ${u===d?'bg-attention/15 font-semibold text-cave-50':'text-cave-200'}`}>{u}</button>)}</span>;})():null;
    const calculEl=<div data-dp-calcul className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-cave-200">
      <NumberInput aria-label={`Quantité ligne ${index+1}`} value={line.quantity} onValue={quantity=>updateLine(line.id,{quantity})} emptyValue={undefined} min={0} className={`${CHAMP_P3C} w-16 text-right`}/>
      {(()=>{const vide=!isReadableUnit(uniteEffective(eff))&&!horsStock;return champUnite(`${CHAMP_P3C} w-11 text-center${vide?' !border-dashed !border-alert placeholder:text-alert':''}`,vide?'?':undefined,vide?'inconnu':undefined);})()}<span aria-hidden>×</span>
      <NumberInput aria-label={`Prix ligne ${index+1}`} value={line.unitPrice} onValue={unitPrice=>updateLine(line.id,{unitPrice})} emptyValue={undefined} min={0} className={`${CHAMP_P3C} w-[4.75rem] text-right`}/><span aria-hidden>=</span>
      <NumberInput aria-label={`Montant ligne ${index+1}`} value={line.amount} onValue={amount=>{updateLine(line.id,{amount});if(draft.lines.length===1)patch({amount});}} emptyValue={undefined} className={`${CHAMP_P3C} w-[4.75rem] text-right`}/>
      {calculOk===true?<span data-dp-centime className="inline-flex min-h-6 items-center rounded-control border border-cave-700 px-1.5 text-xs text-hop">✓ au centime</span>
        :calculOk===false?<span data-dp-centime data-dp-niveau="repris" className="text-xs text-attention underline decoration-dotted decoration-attention underline-offset-2">≠ montant, écart à vérifier</span>:null}
    </div>;
    const NATURES:Array<[PurchaseLineDraft['kind'],string]>=[['ingredient','Ingrédient'],['service','Service'],['equipment','Matériel']];
    const natureSegEl=<div data-dp-nature role="group" aria-label={`Type d’achat, ligne ${index+1}`} className="inline-flex overflow-hidden rounded-control border border-cave-600">{NATURES.map(([k,mot])=><button key={k} type="button" aria-pressed={line.kind===k} onClick={()=>{if(line.kind!==k)changerNature(k);}} className={`min-h-7 px-2.5 text-sm ${line.kind===k?'bg-ebc-straw font-semibold text-cave-950':'text-cave-200'}`}>{mot}</button>)}</div>;
    const pastilleEl=pastille?<span data-dp-pastille title={line.stockAction==='new'&&neuf?.fiche?`fiche ${neuf.nomFiche??'liée'}${neuf.fiche.approchee?' · approchée (pas exactement la bonne)':''}`:undefined} className={`rounded-control px-1.5 ${attention?'bg-attention/10 text-attention':'bg-cave-800 text-cave-200'}`}>{pastille}</span>:null;
    const retirerEl=<button type="button" aria-label={`Retirer l’article, ligne ${index+1}`} onClick={()=>{proposedStock.current.delete(line.id);neufDOffice.current.delete(line.id);relieAuto.current.delete(line.id);updateLine(line.id,{stockAction:'none'});}} className="min-h-7 rounded-control border border-cave-600 px-2 text-sm text-cave-200">Retirer</button>;
    const articleEl=STOCK_KINDS.includes(line.kind)&&!isMouture?<div data-dp-stock className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-cave-200">{line.stockAction==='none'?<span>aucun stock</span>
      :line.stockAction==='new'&&neuf?<><span>article «</span><NomArticle enLigne index={index} line={line} neuf={neuf} prisParAutre={nomRefuse} onNom={articleName=>updateLine(line.id,{articleName})}/><span>» · nouvel article</span>{autre}{(()=>{const v=[neuf.alphaPct!==undefined?`α ${fr(neuf.alphaPct)}`:'',neuf.colorEbc!==undefined?`${fr(neuf.colorEbc)} EBC`:'',neuf.origin?`origine ${neuf.origin}`:''].filter(Boolean).join(' · ');return v?<span data-dp-valeurs className="font-mono text-cave-200">{v}</span>:null;})()}</>
      :line.stockAction==='existing'&&!line.stockRef?<><span>article « ? » · à choisir</span><div className="min-w-[12rem] flex-1">{comboArticleEl}</div></>
      :<><span>article « <b className="font-medium text-cave-50">{nomArticle||'à choisir'}</b> » · {line.stockAction==='new'?'nouvel article':status.proposed?<span data-dp-niveau="repris" className="text-attention">proposé</span>:'relié'}{status.notes.length?` · ${status.notes.join(' · ')}`:''}</span>
        {/* D277 (« globalement pour tout ») : un lien proposé par la lecture reste jaune jusqu’à « Garder » ou ⇄. */}
        {status.proposed?<button type="button" aria-label={`Garder l’article « ${nomArticle??''} », ligne ${index+1}`} onClick={()=>{proposedStock.current.delete(line.id);proposedStock.current.delete(line.id+PROPOSAL_WEIGHT_MARK);updateLine(line.id,{stockRef:line.stockRef});}} className="min-h-7 rounded-control border border-dashed border-attention px-2 text-sm font-semibold text-attention">Garder</button>:null}
        {autre}{line.stockAction==='existing'?retirerEl:null}</>}{bisFondu?<>{stockBisEl}{garderBisEl}</>:null}{pastilleEl}</div>:null;
    const plusEl=<details data-dp-plus className="text-xs text-cave-400"><summary className="inline-flex min-h-7 cursor-pointer items-center rounded-control px-1 text-cave-200 underline decoration-dotted underline-offset-2">plus</summary>
      <div className="mt-1 space-y-2">{libelleEl}{natureEl}{extraitEl}
        {STOCK_KINDS.includes(line.kind)?<div className="space-y-2"><label className="text-sm text-cave-200 flex items-center gap-2"><Package size={16}/>Réception en stock</label>{interrupteurEl}{choixStockEl}{line.stockAction==='existing'&&line.stockRef?relieEl:null}</div>:null}</div></details>;
    const plateauEl=<div className="space-y-1.5">
      <p data-dp-imprime className="text-xs text-cave-400">imprimé « <span className="font-mono text-cave-200">{line.imprime?.nom??(line.description||'—')}</span> »{line.sourceReference?` · ${line.sourceReference}`:''}</p>
      {opts.comprises.length||opts.restes.length?<p data-dp-options className="text-xs text-cave-200">{opts.comprises.join(' · ')}{opts.restes.length?<span className="text-cave-400">{opts.comprises.length?' · ':''}tel qu’imprimé : {opts.restes.join(' · ')}</span>:null}</p>:null}
      {ud?<p data-dp-unite-deduite {...(ud.niveau==='repris'?{'data-dp-niveau':'repris'}:{})} className={`text-xs ${ud.niveau==='repris'?'text-attention':'text-cave-200'}`}>unité {shortUnit(ud.unite)} déduite · {ud.raison}{ud.niveau==='repris'?' · à contrôler':''}{segmentsUnite}</p>:null}
      {calculEl}
      {isMouture?null:natureSegEl}
      {articleEl}
      {materielEl}
      {line.id===mouturesPropositions[0]?.parentId?tableauEl:null}
      {plusEl}
    </div>;
    return <LigneP3c key={`${readCount}-${line.id}`} id={line.id} rang={index+1} numeroPapier={ordre==='papier'&&scan?.ok?numeros.get(line.id):undefined}
      nom={isMouture?'mouture':sansAlphaDoublon(line.nameFr&&!article?nomAffiche(line.nameFr):line.stockAction==='new'&&neuf?.derive?(nomRefuse?neuf.nomPropose:neuf.name):nomAffiche(line.description,article),alphaLu)} lien={lien} groupe={groupeDeLigne(index)}
      alpha={alphaLu} ebc={ebcLu} conversion={article?conversionDe({...line,unit:unite},article):undefined}
      qte={{texte:texteQuantite(line,unite,horsStock)}} niveaux={niveaux}
      prix={line.unitPrice!==undefined?prixImprime(line.unitPrice):'—'} montant={line.amount===undefined?'—':fr2c(Math.round(line.amount*100))}
      prixKg={pk?{texte:`✓ ${pk}`,aria:`${pk} avec mouture`}:undefined} pastilleMouture={pastilleMouture} etat={etat}
      boutonMouture={isMouture&&parent?{liee:parentIdx>=0,parent:nomParent,onBascule:()=>basculeMouture(line.id,parentIdx>=0),attr:ordre==='papier'||!cestMoutureEnPastille}:undefined}
      douteux={douteux} garde={garde.includes(line.id)} masquee={Boolean(visibles&&!visibles.has(line.id)&&!(isMouture&&ordre==='cat'))} ouverte={ouverte}
      fix={correction} fixNiveau={fixNiveau} lienNiveau={status.proposed?"repris":undefined} plateau={plateauEl} moutureArticles={enfant&&cestMoutureEnPastille?construire(enfant,enfantIdx,false):undefined}
      onToggle={surToggle} corrigee={corrigeeDe(line)} neuve={fusion?.ajoutees.has(line.id)}/>;
  };
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
  /* z2 : les chips du QR (« ① Total », « ① Date »…) sont des tuiles de CETTE rangée, avant TVA et Règlement ; flex-wrap : sur un écran étroit la dernière tuile passe dessous. */
  const tuiles=<div className="flex flex-wrap items-stretch gap-1.5">
    {chips.some(c=>c.source==='qr')?<ChipsBar chips={chips} reglees={reglesSet} onAller={aller} tout={false} cacher={c=>c.source!=='qr'} enTuiles/>:null}
    {scan?.ok?<button type="button" data-dp="tuile-tva" data-dp-chip="TVA|" data-dp-fait={tvaRegle?'1':undefined} aria-expanded={panel==='tva'} onClick={()=>setPanel(panel==='tva'?null:'tva')} className={`relative min-h-[42px] rounded-panel border px-1.5 pb-1 pt-[3px] ${nTva?'pl-8':'pl-2'} min-w-[80px] flex-1 basis-[80px] text-left ${nTva&&!tvaRegle?'border-dashed border-attention bg-attention/5':'border-cave-800'}`}>{rond(nTva,tvaRegle)}<span className="block text-xs text-cave-400">TVA</span><span className="block font-mono text-sm text-cave-50">{tvaLues.length>1?tvaLues.map((v,i)=><React.Fragment key={v}>{i?' · ':''}<b className={`font-semibold ${tvaRegle&&draft.sourceVatAmount!==v?'text-cave-400 line-through':''}`}>{fr2(v)}</b></React.Fragment>):draft.sourceVatAmount!==undefined?fr2(draft.sourceVatAmount):'—'}{tvaRegle?<small className="ml-1 text-xs text-cave-200">{draft.sourceVatAmount===undefined?'vide':'gardée'}</small>:null}</span></button>:null}
    <button type="button" data-dp="tuile-paye" data-dp-chip={nPaye?'paye':undefined} data-dp-fait={nPaye&&!payeSuppose?'1':undefined} aria-expanded={panel==='paye'} onClick={()=>setPanel(panel==='paye'?null:'paye')} className={`relative min-h-[42px] rounded-panel border px-1.5 pb-1 pt-[3px] ${nPaye?'pl-8':'pl-2'} min-w-[156px] flex-1 basis-[156px] text-left ${payeSuppose?'border-dashed border-attention bg-attention/5':'border-cave-800'}`}>{rond(nPaye,!payeSuppose)}<span className="flex items-center justify-between gap-1 whitespace-nowrap text-xs text-cave-400">Règlement{payeSuppose?<small className="text-xs text-attention">supposée</small>:null}{dateParDefaut&&draft.paymentStatus==='paid'?<small className="text-xs text-cave-400">par défaut</small>:null}</span><span className="block whitespace-nowrap text-[13px] text-cave-50">{draft.paymentStatus==='paid'?(draft.paymentDate?<span className="font-mono">Payé le {draft.paymentDate}</span>:<span>Payé{draft.date?null:<span data-dp-niveau="inconnu" className="font-mono text-alert"> · date ?</span>}</span>):draft.dueDate?<span className="font-mono">Échéance : {draft.dueDate}</span>:<span>À payer</span>}</span></button>
  </div>;
  /* Lenteur D (défaut A, D315) : un champ d'en-tête que la 3.8 a corrigé (et que le brasseur n'a pas retapé depuis) : bleu, l'ancienne valeur barrée. */
  const enteteCorrige=(()=>{const e=fusion?.entete;if(!e)return undefined;const sortie:{total?:string;date?:string;vendor?:string}={};
    if(e.total&&memeValeur(draft.amount,e.total.apres)&&typeof e.total.avant==='number')sortie.total=fr2(e.total.avant);
    if(e.date&&draft.date===e.date.apres&&typeof e.date.avant==='string')sortie.date=e.date.avant;
    if(e.vendor&&draft.vendor===e.vendor.apres&&typeof e.vendor.avant==='string')sortie.vendor=e.vendor.avant;
    return Object.keys(sortie).length?sortie:undefined;})();
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
      <div className={`${payeSuppose&&!payeForme?'hidden':'block'} space-y-2 pb-1`}>{draft.paymentStatus==='paid'?<>{dateSeparee?<DateField label="Date du paiement" value={draft.paymentDate} onChange={paymentDate=>patch({paymentDate})} shortcuts={paymentShortcuts} monthShortcuts/>
        :payeSuppose?null:<div data-dp="paye-suit" className="flex items-center gap-2"><span>Payé le <b className="font-mono font-medium text-cave-50">{draft.paymentDate||draft.date||'…'}</b></span><button type="button" onClick={()=>setPayeForme(true)} className="min-h-7 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">Autre date</button></div>}<Field label="Moyen de paiement" htmlFor="purchase-payment-method"><select id="purchase-payment-method" className={inputClass} value={draft.paymentMethod} onChange={e=>patch({paymentMethod:e.target.value as any})}><option value="bank">Compte bancaire / carte</option><option value="cash">Espèces</option><option value="twint">TWINT</option><option value="other">Autre</option></select></Field></>:<DateField label="Échéance (facultative)" value={draft.dueDate} onChange={dueDate=>patch({dueDate})} shortcuts={paymentShortcuts} monthShortcuts/>}</div>
    </div></div>;
  const restantA_revoir=chips.filter(c=>!reglesSet.has(c.id)).map(c=>c.nom==='TVA'?`TVA ${draft.sourceVatAmount===undefined?'vide':`${fr2(draft.sourceVatAmount)} gardée`}`:c.source==='paiement'?'date de paiement supposée gardée':c.source==='mouture'?`${mouturesPropositions.length} moutures en service`:c.source==='voisin'?`${c.nom} non lié au stock`:c.codes.includes('unite-absente')?`${c.nom} : hors stock`:c.nom);
  /* ------- p3c-3 : un seul plateau ouvert à la fois (les `details` ne sont pas contrôlés : le DOM les ouvre, ceci ferme les autres) ------- */
  const surToggle=(id:string,ouvert:boolean)=>{
    const avant=ouvertesRef.current.get(id);ouvertesRef.current.set(id,ouvert);if(avant!==ouvert)setPlateaux(n=>n+1);
    if(!ouvert)return;
    const cible=form.current?.querySelector(`[data-dp-ligne="${id}"]`);
    form.current?.querySelectorAll<HTMLDetailsElement>('details[data-dp-plateau][open]').forEach(d=>{if(d.closest('[data-dp-ligne]')!==cible&&!(cible&&d.contains(cible)))d.open=false;});
  };
  const ligneEls=new Map<string,React.ReactNode>();
  /* Lenteur D, son choix 2 D : les lignes que la 3.8 ne lit plus : barrées en fin de leur bande, hors des sommes (elles ne sont pas dans le brouillon). « Confirmer » sans trancher : elles partent. */
  const perduesParBande=new Map<string,React.ReactNode[]>();
  for(const p of perdues){const l=p.ligne,g=groupeDe(contexteLigne(l),l.kind,l.description,l.stockCategory,articleDe(l)?.category,draft.category),u=uniteEffective(l);
    perduesParBande.set(g,[...(perduesParBande.get(g)??[]),<LignePerdue key={l.id} id={l.id} groupe={g} nom={nomAffiche(l.nameFr&&!articleDe(l)?l.nameFr:l.description,articleDe(l))} qte={texteQuantite(l,u,false)} prix={l.unitPrice!==undefined?prixImprime(l.unitPrice):'—'} montant={l.amount===undefined?'—':fr2c(Math.round(l.amount*100))} masquee={Boolean(visibles&&!visibles.has(l.id))}/>]);}
  const perdueCourante=perdues[0];
  const garderPerdue=()=>{const p=perdueCourante;if(!p)return;setDraft(previous=>({...previous,lines:rangerLaPerdue(previous.lines,p,p.ligne)}));setPerdues(ps=>ps.filter(x=>x.ligne.id!==p.ligne.id));setNGardees(n=>n+1);};
  const retirerPerdue=()=>{const p=perdueCourante;if(p)setPerdues(ps=>ps.filter(x=>x.ligne.id!==p.ligne.id));};
  const toutValider=()=>setPerdues([]);
  draft.lines.forEach((line,index)=>{ligneEls.set(line.id,construire(line,index,simplePurchase));});
  /* Les bandes, la barre, les comptes : tous sur le même ensemble de lignes (R2). */
  /* D277 : le niveau de chaque rangée (la quantité et son unité, le prix, le montant, le nom), une seule lecture pour les bandes et les comptes. */
  const HORS_STOCK_KINDS=['service','shipping','discount','other','maintenance'];
  const niveauLigne=new Map(draft.lines.map(l=>{const c=confianceLigne(ligneConfianceDe(effDe(l)),ctxConf),n=niveauxRangee(l,c),vide=!l.description.trim();return [l.id,{unite:c.unite.niveau,pire:vide?'inconnu' as Niveau:n.pire}];}));
  const ligneBandes:LigneBande[]=lignesAff.map(l=>{const i=draft.lines.indexOf(l),u=uniteDe(l),art=articleDe(l),cv=art?conversionDe({...l,unit:u},art):undefined,m=cv?/=\s*(\d+)\s*sachet/.exec(cv):null,nu=niveauLigne.get(l.id)?.unite;
    const sf=sousFamilleLigne(i),pire=niveauLigne.get(l.id)?.pire;
    return {id:l.id,groupe:groupeDeLigne(i),...(sf?{sousFamille:sf}:{}),...((pire&&pire!=='sur')||douteuxIds.has(l.id)?{averifier:true}:{}),amount:l.amount,quantity:l.quantity,unit:shortUnit(u),uniteLisible:isReadableUnit(u),mouture:parentIdxDe(i)>=0,sachets:m?Number(m[1]):undefined,...(nu&&nu!=='sur'?{niveau:nu}:{}),...(HORS_STOCK_KINDS.includes(l.kind)&&l.quantity===undefined?{sansQuantite:true}:{})};});
  const bandes=calculerBandes(ligneBandes);
  /* D307 : les rangées qu'on doit voir ouvrent leur sous-groupe, quel que soit le choix (plateau ouvert, filtre des comptes). */
  const forcesGroupes=new Set<string>([...plateauxOuverts,...(visibles??[])]);
  /* D311 (son choix E) : l'état du segment « Plié | Déplié » se calcule sur l'état réel des groupes, il n'est jamais gardé. */
  const etatSeg=etatSegment(bandes,choixGroupes,forcesGroupes);
  /* Replier un sous-groupe ferme les plateaux de ses rangées : sinon une rangée ouverte forcerait le groupe à rester ouvert. */
  const fermerPlateaux=(ids:readonly string[])=>{let change=false;ids.forEach(id=>{if(plateauxOuverts.has(id)){ouvertesRef.current.set(id,false);change=true;}});if(change)setPlateaux(n=>n+1);};
  const basculerGroupe=(cle:string,sg:SousGroupe,ouvrir:boolean)=>{setChoixGroupes(c=>poserGroupe(c,cle,sg.nom,ouvrir));if(!ouvrir)fermerPlateaux(sg.ids);};
  /* « Tout plier, déplier » (toutes les bandes ou une seule) : l'état est prêt ; son contrôle visible est le choix de la voie r3-plier (rien n'est posé à l'écran ici). */
  const toutPlierGroupes=(cle?:string)=>{setChoixGroupes(c=>plierTout(bandes,c,cle));bandes.filter(b=>!cle||b.cle===cle).forEach(b=>b.sousGroupes?.forEach(sg=>{if(pliable(sg)&&!sg.averifier)fermerPlateaux(sg.ids);}));};
  const toutDeplierGroupes=(cle?:string)=>setChoixGroupes(c=>deplierTout(bandes,c,cle));
  /* Une cible (« y aller », une erreur) dans un sous-groupe replié : il s'ouvre d'abord, de façon synchrone, avant le défilement et le focus. */
  const reveler=(el:Element|null|undefined)=>{const corps=el?.closest<HTMLElement>('[data-dp-sg-corps]'),cle=corps?.dataset.dpSgCorps;if(corps&&cle&&corps.hidden)flushSync(()=>setChoixGroupes(c=>new Map(c).set(cle,true)));};
  const barre:ItemBarre[]=lignesAff.map(l=>({id:l.id,cents:l.amount===undefined?0:Math.round(l.amount*100),groupe:groupeDeLigne(draft.lines.indexOf(l)),ouvert:douteuxIds.has(l.id),nom:l.description}));
  const centsAff=lignesAff.reduce((s,l)=>s+(l.amount===undefined?0:Math.round(l.amount*100)),0);
  const papier=ordre==='papier'?{ids:lignesAff.map(l=>l.id),cents:centsAff,incomplet:lignesAff.some(l=>l.amount===undefined),...((()=>{const c=portCents(draft.lines,port);return c&&!lignesAff.some(l=>port.has(l.id))?{port:c}:{};})())}:null;
  const voisinIds=new Set(chips.filter(c=>c.source==='voisin').map(c=>c.cible as string));
  /* Chaque ligne a UNE catégorie de lien (la somme des comptes de liens vaut le nombre de lignes) ; « hors stock » remplace « sans stock » (D275). */
  const categorie=(l:PurchaseLineDraft)=>isMillingSurcharge(l)?'mouture':voisinIds.has(l.id)&&(l.stockAction==='none'||(l.stockAction==='new'&&neufDOffice.current.has(l.id)))?'bis':l.stockAction==='existing'&&l.stockRef?'relie':l.stockAction==='new'?'neuf':'aucun';
  const rondDe=(c:Chip)=>({id:c.id,numero:chips.indexOf(c)+1,nom:c.nom,fait:reglesSet.has(c.id)});
  const idsDe=(k:string)=>lignesAff.filter(l=>categorie(l)===k).map(l=>l.id);
  const compteDe=(cle:string,ids:string[],mot:(n:number)=>string,lien:LienStock,rondsChips:Chip[],extra?:string,niveau?:Niveau):CompteItem=>{const ronds=rondsChips.map(rondDe),m=mot(ids.length);return {cle,n:ids.length,mot:m,lien,ronds,fait:ronds.length>0&&ronds.every(r=>r.fait),ids,extra,actif:filtre?.mot===m,...(niveau?{niveau}:{})};};
  const compte=(cle:string,mot:(n:number)=>string,lien:LienStock,rondsChips:Chip[],extra?:string):CompteItem=>compteDe(cle,idsDe(cle),mot,lien,rondsChips,extra);
  /* D275a : un malt concassé compte avec les moutures (« ↳ 3 moutures +0,71 », le supplément déjà compris dans son prix). */
  const concasses=lignesAff.map(l=>({l,e:pastilleEtat(l,uniteDe(l))})).filter(x=>x.e?.cle==='concasse');
  const centsMoutures=sommeMoutures+concasses.reduce((s,x)=>s+(x.e?.centsCompris??0),0);
  const parNiveau=(n:Niveau)=>lignesAff.filter(l=>niveauLigne.get(l.id)?.pire===n).map(l=>l.id);
  const comptesItems:CompteItem[]=[
    compte('relie',n=>n>1?'reliés':'relié','relie',[]),
    /* D277 (VERDICT-f3-p2, majeur 1) : « n proposé » jaune à côté de « n relié » ; un compte de niveau, hors de la partition des liens, qui tombe à « Garder » ou ⇄. */
    compteDe('propose',idsDe('relie').filter(id=>proposedStock.current.has(id)),n=>n>1?'proposés':'proposé','relie',[],undefined,'repris'),
    compte('neuf',n=>n>1?'nouveaux':'nouveau','neuf',[]),
    compte('bis',()=>'bis','bis',chips.filter(c=>c.source==='voisin')),
    compte('aucun',()=>'hors stock','aucun',[]),
    compteDe('mouture',[...idsDe('mouture'),...concasses.map(x=>x.l.id)],n=>n>1?'moutures':'mouture','mouture',chips.filter(c=>c.source==='mouture'),centsMoutures>0?`+${eur(centsMoutures)}`:undefined),
    compteDe('controler',parNiveau('repris'),()=>'à contrôler','aucun',[],undefined,'repris'),
    compteDe('remplir',parNiveau('inconnu'),()=>'à remplir','precis',chips.filter(c=>c.codes.includes('unite-absente')),undefined,'inconnu'),
    /* Lenteur D (sa maquette `d-lue`) : « ↻ N corrigées », au geste de filtre des autres puces. N compte les CIBLES (une rangée à deux cellules corrigées : 1 ; un champ d'en-tête : 1 ; une ligne ajoutée : 1) et, comme sa maquette `choix-valider`, les lignes pas retrouvées qui attendent encore. */
    ...(()=>{const ids=[...Object.keys(fusion?.lignes??{}).filter(id=>draft.lines.some(l=>l.id===id)),...(fusion?[...fusion.ajoutees]:[]),...perdues.map(p=>p.ligne.id)],n=(fusion?.n??0)+perdues.length,mot=n>1?'corrigées':'corrigée';return n>0?[{cle:'corrigees',n,mot,lien:'aucun' as LienStock,ronds:[],fait:false,ids,actif:filtre?.mot===mot,corrigee:true} as CompteItem]:[];})(),
  ];
  const surCompte=(c:CompteItem)=>{
    if(!c.ids.length)return;
    if(filtre&&filtre.mot===c.mot){setFiltre(null);setGarde([]);return;}
    setFiltre({mot:c.mot,ids:c.ids});setGarde(c.ids);setTimeout(()=>{if(mounted.current)setGarde([]);},1600);
    requestAnimationFrame(()=>form.current?.querySelector('[data-dp="liste"]')?.scrollIntoView?.({block:'start'}));
  };
  const versListe=()=>{viser(form.current?.querySelector<HTMLElement>('[data-dp="liste"]'));};
  const versLigne=(id:string)=>aller({id:'l',nom:'',enjeu:'info',ligne:null,codes:[],source:'voisin',cible:id});
  /* La preuve (rangées chiffrées lues dans `controls` : rien d'affirmé sans contrôle). */
  /* Lenteur D : une ligne gardée (« Garder ») change la somme : les contrôles se lisent alors sur le brouillon (le recalcul), comme sa maquette (« Somme ≠ imprimé 48,10 »). */
  const ctl=(nGardees>0&&recalcul?recalcul.controls:result?.controls) as NonNullable<typeof result>['controls'],lectures=result?.review?.readers;
  /* Lenteur D (ses maquettes `q1-b`, `b-garder`) : une ligne ajoutée ou gardée change la somme : « Somme ≠ imprimé 48,10 » en attention, la somme des lignes à droite (jamais « = imprimé · non vérifiée »). */
  const ecartLenteur=Boolean(ctl&&ctl.sum.statut==='ecart'&&(nGardees>0||(fusion?.ajoutees.size??0)>0));
  const ecartTotalQr=qrContredit&&vue?.duel&&sommeLignesCts!==Math.round(vue.duel.luNombre*100)?{lignes:fr2Qr(sommeLignesCts/100),lu:vue.duel.lu}:undefined;
  const rangees:Rang[]=result?[
    ecartTotalQr?{ok:false,texte:'Somme = imprimé',valeur:`${ecartTotalQr.lignes} ≠ ${ecartTotalQr.lu}`}:ecartLenteur?{ok:false,texte:'Somme ≠ imprimé',valeur:fr2c(sommeLignesCts)}:ctl?{ok:ctl.sum.statut==='ok',texte:'Somme = imprimé',valeur:ctl.sum.statut==="ok"?fr2c(Math.round((result.amountTTC??0)*100)):'non vérifiée'}:{ok:null,texte:'Somme non contrôlée',valeur:''},
    ctl?{ok:ctl.lines.failed===0&&ctl.lines.checked>0&&(ctl.lines.skippedIds??[]).length===ctl.lines.skipped&&(ctl.lines.skippedIds??[]).every(id=>port.has(id)),texte:'Qté × prix',valeur:`${Math.max(0,ctl.lines.checked-[...port].filter(id=>!(ctl.lines.skippedIds??[]).includes(id)).length)}/${lignesAff.length}`}:{ok:null,texte:'Qté × prix non contrôlé',valeur:''},
    /* n2-pages, sa maquette 6 : des lectures d'accord sur une pièce de plusieurs pages (le serveur en a confirmé N) disent « ✓ N pages lues », sans valeur à droite ; en désaccord,
       « Lectures · N pages » et « n lectures » ; un document seul : « Lectures » et « 2/2 », comme avant. Sans lectures annoncées rien n'est inventé. */
    ...(verif==='attente'?[{ok:null,texte:'Lectures',valeur:'',lectures:{faites:2,sur:3}}]:lectures?[(result.points??[]).some(p=>p.origine==='lecture'&&p.pese!==false)?{ok:false,texte:nPagesLues>1?`Lectures · ${nPagesLues} pages`:'Lectures',valeur:`${lectures} lectures`}:nPagesLues>1?{ok:true,texte:`${nPagesLues} pages lues`,valeur:''}:{ok:true,texte:'Lectures',valeur:`${lectures}/${lectures}`}]:[]),
    ...((result.linesLost??0)>0?[{ok:false,texte:'Lignes non gardées',valeur:String(result.linesLost)}]:[]),
  ]:[];
  const corriges=[...new Set((result?.review?.correctedFields??[]).map(f=>f.startsWith('items')?'Articles':f))];
  const maison=(c:Chip)=>c.nom==='TVA'||c.source==='paiement'||c.source==='qr'||c.source==='voisin'||c.source==='mouture'||c.codes.includes('unite-absente');
  /* D277 : la rangée des points part ; chaque point est le niveau du champ qu'il vise (la date au bandeau, une ligne à sa rangée, le total, les lignes).
     Un point sans champ (pro-forma, devis, désaccord d'en-tête…) reste au récap. Le pied dit le pire point restant, le rouge d'abord. */
  const aSaPlace=(c:Chip)=>maison(c)||c.ligne!==null||c.codes.includes('date-absente')||c.nom==='Total'||c.nom==='Lignes';
  const ROUGES=['date-absente','total-absent','lignes-perdues','forme-rejetee','unite-absente'];
  const rougeDe=(c:Chip)=>c.codes.some(k=>ROUGES.includes(k));
  const nonRegles=chips.filter(c=>!reglesSet.has(c.id));
  const courantChip=nonRegles.find(rougeDe)??nonRegles[0];
  const courantIdx=courantChip?chips.indexOf(courantChip):-1;
  const tapes=new Set<ChampEntete>(reviewedFields.flatMap((f):ChampEntete[]=>f==='date'?['date']:f==='vendor'?['fournisseur']:f==='amountTTC'?['total']:f==='tvaAmount'?['tva']:f==='invoiceNumber'?['numero']:[]));
  const entete=result?confianceEntete({points},{date:draft.date,vendor:draft.vendor,invoiceNumber:draft.invoiceNumber,amount:draft.amount,sourceVatAmount:draft.sourceVatAmount,sourceNetAmount:draft.sourceNetAmount,tapes},ctxConf.lignes):undefined;
  const dateChip=chips.find(c=>c.codes.includes('date-absente'));
  const niveauDate:Niveau=dateChip?(reglesSet.has(dateChip.id)?'sur':'inconnu'):entete?.date.niveau??'sur';
  const niveauxEntete={date:niveauDate,lignes:pireNiveau([entete?.lignes.niveau??'sur',...(chips.some(c=>c.nom==='Lignes'&&!reglesSet.has(c.id))?['repris' as Niveau]:[])]),total:pireNiveau([entete?.total.niveau??'sur',...chips.filter(c=>c.nom==='Total'&&!reglesSet.has(c.id)).map(c=>rougeDe(c)?'inconnu' as Niveau:'repris' as Niveau)])};
  /* ------- le pied : le bouton principal garde tous les états d'aujourd'hui ------- */
  const bouton:BoutonPied=done||attached?{texte:'Terminé',aria:'Terminé',icone:'check',disabled:false,onClick:onClose}
    :dejaTx?{texte:onOpenExpense?'Ouvrir la dépense':'Fermer sans rien enregistrer',aria:onOpenExpense?'Ouvrir la dépense':'Fermer sans rien enregistrer',icone:onOpenExpense?'file':'x',disabled:false,onClick:()=>{onClose();onOpenExpense?.(dejaTx.id);}}
    :sameChosen&&existing?{texte:attachable?(saving?'Rattachement…':'Rattacher le justificatif'):'Fermer sans rien enregistrer',aria:attachable?(saving?'Rattachement…':'Rattacher le justificatif'):'Fermer sans rien enregistrer',icone:saving?'spin':attachable?'check':'x',disabled:saving||verif==='attente',onClick:()=>{if(attachable)void attachToExisting(existing.id);else onClose();}}
    :!existing&&similarChoice==='same'&&similar?{texte:similarAttachable?'Rattacher le justificatif':'Fermer sans rien enregistrer',aria:similarAttachable?'Rattacher le justificatif':'Fermer sans rien enregistrer',icone:similarAttachable?'check':'x',disabled:saving||verif==='attente',onClick:()=>{if(similarAttachable)void attachToExisting(similar.tx.id);else onClose();}}
    :{texte:saving?'Enregistrement…':pendingId?'Vérifier la synchronisation':scan?.ok?'Confirmer':'Enregistrer',aria:busy?'Lecture en cours':verif==='attente'?'Vérification en cours':saving?'Enregistrement…':pendingId?'Vérifier la synchronisation':scan?.ok?'Confirmer et enregistrer':'Enregistrer la dépense',icone:saving||verif==='attente'?'spin':'check',disabled:saving||busy||verif==='attente',titre:busy?'Lecture en cours':verif==='attente'?'Vérification en cours':undefined,onClick:()=>void save()};
  const statutPied=done||attached?null:dejaTx?(onOpenExpense?{texte:'Rien n’est enregistré'}:null)
    :saving&&draft.proofDataUrl&&!receipt&&(!proofQueueAvailable()||apercu)?{texte:`Envoi au Drive${tailleMo?` · ${fr(tailleMo)} Mo`:''}`}
    :saving?{texte:pendingId?'Confirmation…':'Enregistrement…'}
    :nUnite&&attempted?{texte:`${nUnite} unité${nUnite>1?'s':''} à préciser`,attention:true}:null;
  const surFichier:{nom:string;url:string;type:string}|null=draft.proofDataUrl&&!busy?{nom:draft.proofFileName??'justificatif',url:draft.proofDataUrl,type:draft.proofType??''}:null;
  const lignesBloc=<details data-purchase-lines {...(scan?.ok?{open:true}:{'data-purchase-options':true,open:initialIntent==='equipment'})} className="order-2 border-t border-cave-800 py-1 lg:col-start-2 lg:row-start-1">
    {scan?.ok?<summary className="list-none cursor-pointer min-h-7 flex flex-wrap items-center gap-x-2 text-xs text-cave-200">Lignes de la facture · {draft.lines.length}{proposedCount?<span className="text-attention">{proposedCount} proposée{proposedCount>1?'s':''} par la lecture, à vérifier</span>:null}{hints.items?<span className="text-attention">À vérifier</span>:null}</summary>
    :<summary className="list-none relative pr-6 min-h-7 cursor-pointer text-sm text-cave-200"><ChevronDown size={14} className="absolute right-0 top-1.5"/><span className="block">Articles, stock et matériel · {draft.lines.length}{hints.items?<span className="ml-2 text-attention text-xs">À vérifier</span>:null}</span><span className="block text-xs text-cave-400 mt-1">{[...new Set(draft.lines.map(line=>kinds.find(kind=>kind.value===line.kind)?.label))].join(' · ')}</span>{linkedSummary?<span className="block mt-1 text-cave-200">{linkedSummary}{proposedCount?<span className="text-attention"> · {proposedCount} proposée{proposedCount>1?'s':''} par la lecture, à vérifier</span>:null}</span>:null}</summary>}
    <ScanHint field="items" message={hints.items}/>
    <div className="space-y-2 pt-2">{!scan?.ok?<div className="flex justify-between gap-2 items-center"><h3 className="font-semibold text-cave-50">Ce que tu achètes</h3>{draft.lines.length>1?<button type="button" className="text-xs text-cave-400 min-h-7" onClick={()=>patch({lines:[{...newLine(),description:draft.description,kind:'other',amount:draft.amount}]})}>Regrouper en une dépense</button>:null}</div>:null}
      {draft.lines.map(l=><React.Fragment key={l.id}>{ligneEls.get(l.id)}</React.Fragment>)}
      <div className="flex gap-2"><button type="button" disabled={draft.lines.length>=35} onClick={()=>patch({lines:[...draft.lines,newLine()]})} className={`${button} border-dashed border-cave-600 text-cave-200 flex-1 flex justify-center items-center gap-2`}><Plus size={17}/>Ajouter une ligne</button>{scan?.ok&&draft.lines.length>1?<button type="button" className={`${button} border-dashed border-cave-600 text-cave-200`} onClick={()=>patch({lines:[{...newLine(),description:draft.description,kind:'other',amount:draft.amount}]})}>Regrouper en une dépense</button>:null}</div>
      {draft.lines.length>1?<p className={`text-sm text-right ${Math.abs(draft.lines.reduce((s,line)=>s+(line.amount||0),0)-(draft.amount||0))>0.005?'text-attention':'text-cave-400'}`}>Détail : {money(draft.lines.reduce((sum,line)=>sum+(line.amount||0),0))} / {money(draft.amount||0)}</p>:null}
    </div></details>;
  /* ------- les rubriques (P16) : mêmes champs, mêmes id ------- */
  const surDate=()=>{const d=form.current?.querySelector<HTMLDetailsElement>('[data-purchase-date]');if(d){d.open=true;viser(d,{focus:d.querySelector<HTMLElement>('input[type="date"]')});}};
  const descriptionChamp=<TextInput id="purchase-description" aria-label="Pour quoi ?" aria-invalid={attempted&&!draft.description.trim()||undefined} aria-describedby={attempted&&!draft.description.trim()?validationId:undefined} value={draft.description} onChange={description=>{patch({description});if(draft.lines.length===1)updateLine(draft.lines[0].id,{description});}} placeholder={scan&&!scan.ok?'À décrire':scan?.ok?'À décrire':initialIntent==='equipment'?'Fermenteur 30 L, pompe de brassage…':'Malt pour la Pale Ale, entretien de la pompe…'}/>;
  const itemsRub:ItemRubrique[]=[
    {cle:'date',titre:'Date de l’achat',valeur:`${draft.date||'…'}${dateParDefaut?' · aujourd’hui, par défaut':''}`,ouvert:false,attention:Boolean(hints.date),attrs:{'data-purchase-date':true,'data-purchase-options':true},
      corps:<><ScanHint field="date" message={hints.date} court/><DateField label="Date de l’achat" value={draft.date} onChange={date=>{reviewed('date');patch({date});}} shortcuts={dayShortcuts} monthShortcuts/></>},
    {cle:'four',titre:'Fournisseur et catégorie',valeur:`${draft.vendor||'Fournisseur facultatif'} · ${categories.find(c=>c.value===draft.category)?.label}`,ouvert:Boolean(hints.vendor||hints.category),attrs:{'data-purchase-options':true},
      corps:<>
        <div className={hints.category?uncertainClass:''}><Field label="Catégorie" htmlFor="purchase-category"><select id="purchase-category" value={draft.category} onChange={e=>{reviewed('category');selectCategory(e.target.value as PurchaseCategory);}} className={inputClass}>{categories.map(category=><option key={category.value} value={category.value}>{category.label}</option>)}</select></Field><ScanHint field="category" message={hints.category}/></div>
        <div className={hints.vendor?uncertainClass:''}><Field label="Fournisseur" htmlFor="purchase-vendor"><TextInput id="purchase-vendor" value={draft.vendor} onChange={vendor=>{reviewed('vendor');patch({vendor});}} placeholder="Nom du fournisseur"/></Field><ScanHint field="vendor" message={hints.vendor}/></div></>},
    ...(plans.length?[{cle:'prevue',titre:'Lier à une dépense prévue',valeur:selectedPlan?.title??'facultatif',ouvert:Boolean(selectedPlan),
      corps:<><Field label="Dépense prévue" htmlFor="purchase-plan"><select id="purchase-plan" className={inputClass} value={draft.planId||''} onChange={e=>patch({planId:e.target.value||undefined,occurrenceId:undefined})}><option value="">Aucune prévision liée</option>{plans.map(plan=><option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></Field>{selectedPlan?.recurrence?<Field label="Échéance concernée" htmlFor="purchase-occurrence"><select id="purchase-occurrence" className={inputClass} value={draft.occurrenceId||''} onChange={e=>patch({occurrenceId:e.target.value||undefined})}><option value="">Choisir l’échéance</option>{occurrences.map(occurrence=><option key={occurrence.id} value={occurrence.id}>{occurrence.date}</option>)}</select></Field>:null}<p className="text-xs text-cave-400">L’achat remplacera le montant prévu correspondant.</p></>}]:[]),
    {cle:'ref',titre:'Référence et TVA du document',valeur:draft.invoiceNumber||'—',attention:Boolean(hints.invoiceNumber||hints.tvaAmount||hints.tvaRate),
      corps:<>{draft.sourceOrderNumber?<p className="text-sm text-cave-200">Commande n° {draft.sourceOrderNumber}</p>:null}<Field label="N° de facture" htmlFor="purchase-invoice-number"><TextInput id="purchase-invoice-number" value={draft.invoiceNumber} onChange={invoiceNumber=>{reviewed('invoiceNumber');patch({invoiceNumber});}}/></Field><ScanHint field="invoiceNumber" message={hints.invoiceNumber}/><div className="grid grid-cols-2 gap-2"><Field label="TVA source (CHF)" htmlFor="purchase-vat"><NumberInput id="purchase-vat" value={draft.sourceVatAmount} onValue={sourceVatAmount=>{reviewed('tvaAmount');patch({sourceVatAmount});}} emptyValue={undefined} className={inputClass}/></Field><Field label="Taux source (%)" htmlFor="purchase-vat-rate"><NumberInput id="purchase-vat-rate" value={draft.sourceVatRate===undefined?undefined:draft.sourceVatRate*100} onValue={value=>patch({sourceVatRate:value===undefined?undefined:value/100})} emptyValue={undefined} className={inputClass}/></Field></div><ScanHint field="tvaAmount" message={hints.tvaAmount}/><ScanHint field="tvaRate" message={hints.tvaRate}/></>},
  ];
  const itemQuoi:ItemRubrique={cle:'quoi',titre:'Pour quoi ?',valeur:draft.description?`${draft.description}${draft.descriptionSource==='scan'?' · proposé':''}`:'à décrire',corps:descriptionChamp,attention:attempted&&!draft.description.trim()};
  const phraseRecu=draft.proofDataUrl?<p className="px-3 pb-2 text-xs text-cave-400">{receipt?<ReceiptLine receipt={receipt}/>:'Le justificatif sera rangé dans ton Drive privé à l’enregistrement.'}</p>:null;
  const portIds=draft.lines.filter(l=>port.has(l.id));
  const tiroirPort=portIds.length?<div data-dp="port-tiroir" className={`${portOuvert?'block':'hidden'} mx-2 mb-2 rounded-panel border border-cave-800 bg-cave-900/40`}><div data-dp-bande-entete className="dp-p3c-bande-entete dp-p3c-t-autres flex items-center gap-1.5 px-2.5 text-sm"><strong className="font-semibold text-cave-50">Port</strong><span className="text-xs text-cave-400">· hors bandes</span>{portTexte?<span className="ml-auto font-mono text-sm font-semibold text-cave-50">{portTexte}</span>:null}</div>{portIds.map(l=><React.Fragment key={l.id}>{ligneEls.get(l.id)}</React.Fragment>)}</div>:null;
  const surPort=()=>{const ouvrir=!portOuvert;flushSync(()=>setPortOuvert(ouvrir));if(ouvrir)viser(form.current?.querySelector<HTMLElement>('[data-dp="port-tiroir"]'),{block:'center'});};
  const doublons=<>
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
  </>;
  /* L'entrée : le bouton noir coupé en deux (« Un document » : le geste d'aujourd'hui | « Plusieurs » : la rangée de pages), puis « Photographier », la note, « Saisir sans justificatif ». */
  const entree=<section
        aria-label="Justificatif de la dépense"
        className={`py-2 px-2 space-y-2 rounded-panel border border-dashed transition-colors ${dropping?'border-ebc-straw bg-ebc-straw/10':'border-cave-700'}`}
        onDragOver={e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();setDropping(true);}}}
        onDragLeave={()=>setDropping(false)}
        onDrop={e=>deposer(e,'document')}
      >
        <EntreeFendue onUn={()=>fileInput.current?.click()} onPlusieurs={()=>pagesInput.current?.click()}/>
        {coarse?<button type="button" onClick={()=>cameraInput.current?.click()} className={`${button} w-full border-cave-600 text-cave-50 flex justify-center items-center gap-2`}><Camera size={18}/>Photographier le ticket</button>:null}
        <p className="text-xs text-center text-cave-400">PDF ou image{coarse?'':', ou dépose le fichier ici'} · lecture automatique · 4 Mo max.</p>
        {!showForm?<button type="button" onClick={()=>setShowForm(true)} className="min-h-7 w-full text-sm text-cave-200 underline underline-offset-4">Saisir sans justificatif</button>:null}
      </section>;
  const capt=<>
      {entreeOuverte?entree:null}
      {!attachment&&!busy?pages.length>0?<>
        <RangeePages pages={pages.map(p=>({id:p.id,url:p.url,nom:p.file.name}))} max={PAGES_MAX} onRetirer={retirerPage} onAjouter={()=>pagesInput.current?.click()} onLire={()=>void lirePages()}
          onDragOver={e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();setDropping(true);}}} onDragLeave={()=>setDropping(false)} onDrop={e=>deposer(e,'page')} depose={dropping} sansJustificatif={assemblageEchoue?saisirSansPages:undefined}/>
        <div className="rounded-panel border border-cave-800 bg-cave-900/40 px-2.5 pb-[7px] pt-[5px]"><FrisePages etat="repos" pages={pages.length}/></div>
        <ResteDeLecture/>
      </>:showForm?<button type="button" disabled={saving||Boolean(pendingId)} onClick={()=>fileInput.current?.click()} className={`${button} w-full border-cave-700 text-cave-200 flex items-center justify-center gap-2`}><FileText size={18}/>Joindre un justificatif</button>:entree:busy?<div data-dp="lecture" className="space-y-1.5">
        {/* p3c-3, état « lecture » : la carte du fichier avec la frise « envoi ✓ · lecture · vérification », le cadre « Les lignes arrivent ici », puis « Pour quoi ? » et « Règlement » (verrouillés tant que la lecture écrit le brouillon). */}
        <div className="rounded-panel border border-cave-800 bg-cave-900/40 px-2.5 pb-[7px] pt-[5px]">
          <div className="flex items-baseline justify-between gap-2"><span className="min-w-0 truncate text-base font-semibold leading-6 text-cave-50">{pages.length>1?(pagesJointes?`${pages.length} pages`:'Préparation des pages…'):attachment?.name||apercu?.fichier.name||'Préparation de la photo…'}</span>{pages.length>1?(pagesJointes&&pdfRef.current?<span className="shrink-0 font-mono text-xs text-cave-400">{fr(Math.round(pdfRef.current.octets/1e5)/10)} Mo{pdfRef.current.reduite?' · réduites':''}</span>:null):(attachment?.size||apercu?.fichier.size)?<span className="shrink-0 font-mono text-xs text-cave-400">{fr(Math.round((attachment?.size||apercu?.fichier.size||0)/1e5)/10)} Mo</span>:null}{sceauQr&&vue?.etat!=='sans'?<div className="shrink-0 self-center">{sceauQr}</div>:null}</div>
          {resumeQr(qrRes)?<p data-dp="qr-lecture" className="break-words font-mono text-xs text-cave-200">{resumeQr(qrRes)}</p>:null}
          <p role="status" className="sr-only">Lecture et vérification…</p>
          {pages.length>1?<MiniPages pages={pages.map(p=>({id:p.id,url:p.url,nom:p.file.name}))}/>:null}
          <FrisePages etat="lecture" pages={pages.length>1?pages.length:undefined}/>
        </div>
        {ficheQr}
        <ResteDeLecture/>
      </div>:dejaTx&&attachment?<PieceDejaSaisie tx={dejaTx} stocks={stocks} payments={FinanceService.getPayments?.()??[]} transactions={transactions} onLire={()=>void(pagesJointes?lirePages(true):attach(attachment,true))}/>
      :scan&&!scan.ok&&attachment?<div data-dp="erreur-lecture" className="flex flex-wrap items-center gap-1.5 border-t border-cave-700 py-2"><span className="min-w-0 flex-1 truncate text-xs text-cave-400">{pagesJointes?`${pagesJointes} pages`:attachment.name}</span>
        <button type="button" disabled={saving||Boolean(pendingId)} onClick={()=>void(pagesJointes?lirePages():attach(attachment))} className={boutonPlein}>Relire</button>
        <button type="button" onClick={()=>{const champ=form.current?.querySelector<HTMLElement>('#purchase-total');champ?.focus();champ?.scrollIntoView?.({block:'center'});}} className="min-h-7 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">Saisir à la main</button></div>:null}
  </>;
  const alertes=<>
    {attempted&&shownErrors.length>0?<div id={validationId} role="alert" className="border border-alert-strong/40 rounded-control bg-alert-strong/5 p-2 text-sm text-alert-strong"><p className="font-medium">À corriger</p><ul>{shownErrors.map(message=><li key={message}><button type="button" onClick={()=>focusIssue(message)} className="min-h-7 text-left underline underline-offset-2">{message}</button></li>)}</ul></div>:null}
    {proofSending?<div role="status" className="rounded-panel border border-hop/40 bg-hop/5 p-2 text-sm text-cave-200 flex gap-2"><Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-hop"/><span>{proofSending}</span></div>:null}
    {error?<div ref={errorBox} tabIndex={-1} role="alert" className="rounded-panel bg-attention/10 border border-attention/25 p-3 text-sm text-attention whitespace-pre-line">{error}</div>:null}
    {attached?<div role="status" className="rounded-panel border border-hop/40 bg-hop/5 p-2 text-sm text-cave-200 flex gap-2"><Check size={16} className="shrink-0 mt-0.5 text-hop"/><span>Justificatif rattaché à « {attached.description} » du {attached.date}. Aucune nouvelle dépense ni entrée en stock.{receipt?<> <ReceiptLine receipt={receipt}/></>:null}</span></div>:null}
    {draft.proofDataUrl&&!busy&&!attached&&!apercu&&!dejaTx?<DriveConnection always={driveAuthError} onConnected={()=>{setDriveAuthError(false);setError('');setDriveTick(t=>t+1);}}/>:null}
  </>;
  const recu=done?<div data-dp="recu" role="status" className="min-w-0 rounded-panel border border-hop/40 bg-hop/5 p-2 text-xs text-cave-200"><p className="flex items-center gap-1.5"><Check size={14} className="shrink-0 text-hop"/><span className="break-words font-mono text-cave-50">{done.fileName??draft.proofFileName}</span></p><p className="flex flex-wrap gap-x-2"><span>{done.folder??'ton Drive'}</span>{receiptSentence(done).link?<a href={receiptSentence(done).link} target="_blank" rel="noopener noreferrer" className="font-semibold text-cave-50 underline underline-offset-2">Ouvrir dans Drive</a>:null}{done.verified===true&&done.bytes?<span>{done.bytes.toLocaleString('fr-CH').replace(/[\s ]/g,' ')} octets · taille vérifiée</span>:null}</p>{restantA_revoir.length?<p className="text-attention">À revoir : {restantA_revoir.join(' · ')}</p>:null}</div>:null;
  const rubriquesScan=<Rubriques items={[itemQuoi,...itemsRub]}/>;
  const detailListe={lignes:fr2c(draft.lines.reduce((s,l)=>s+(l.amount===undefined?0:Math.round(l.amount*100)),0)),total:fr2c(Math.round((draft.amount||0)*100)),ecart:Math.abs(draft.lines.reduce((s,line)=>s+(line.amount||0),0)-(draft.amount||0))>0.005};
  const scanLayout=scan?.ok&&result&&statutFinal?<fieldset disabled={saving||Boolean(pendingId)||Boolean(done)} className="min-w-0">
    {/* 1280 : la colonne de gauche (récap, tuiles, rubriques) est COLLANTE comme `.p3a3-gauche` de la maquette (sticky top 0, hauteur du corps, défilement propre) ; sur téléphone
        l'enveloppe disparaît (`contents`) et `order` garde l'ordre d'avant : récap, liste, rubriques. */}
    <div className="flex flex-col lg:grid lg:grid-cols-[420px_minmax(0,760px)] lg:items-start lg:justify-center lg:gap-x-4 lg:px-3">
      <div data-dp="gauche" className="contents lg:sticky lg:top-0 lg:col-start-1 lg:block lg:max-h-[calc(100dvh-92px)] lg:overflow-y-auto lg:pb-2">
      <div className="order-1 flex flex-col gap-1.5 px-2 pt-1.5 lg:order-none lg:px-0">
        {doublons}
        <InvoiceScanReview bandeauRef={bandeauRef}
          bandeau={{vendor:draft.vendor,date:draft.date,niveaux:niveauxEntete,doutes:{date:qrEcarts.includes('date')&&!qrChoixChamps.date,vendor:qrEcarts.includes('creancier')&&!qrChoixChamps.creancier,devise:qrEcarts.includes('devise')&&!qrChoixChamps.devise},totalField:<>{totalField}<ScanHintTotal message={hints.amountTTC}/></>,sommeDesLignes:draft.sourceTotalBasis==='line_sum',portCents:portTexte,portOuvert,onPort:surPort,statut:statutFinal,nLignes:lignesAff.length,onLignes:versListe,onDate:surDate,barre,onBarre:versLigne,sceau:sceauQr,sousTotal:sousTotalQr,drive:driveVerifie&&!driveOk&&draft.proofDataUrl?'a-connecter':null,onDrive:()=>setDriveAuthError(true),corriges:enteteCorrige}}
          preuve={{rangees,corriges,remarques,cached:Boolean(scan.cached),visee:viseePreuve,onRangee:versListe,propositions:hints.items?"À vérifier":null}}
          comptes={<><Comptes items={comptesItems} onCompte={surCompte}/>{chips.some(c=>!aSaPlace(c))||tout?<ChipsBar chips={chips} reglees={reglesSet} onAller={aller} tout={tout} cacher={aSaPlace}/>:null}</>}/>
        {draft.sourceCurrency&&draft.sourceCurrency!=='CHF'?<p className="text-attention text-sm">Original : {draft.sourceAmount??'montant absent'} {draft.sourceCurrency}. Montants à renseigner en CHF.</p>:null}
        {tuiles}{panneaux}
        {ficheQr}
      </div>
      <div className="order-3 lg:order-none lg:pb-0">{rubriquesScan}{phraseRecu}</div>
      </div>
      <div className="order-2 lg:order-none lg:col-start-2">
        <Liste ordre={ordre} bandes={bandes} papier={papier} lignes={ligneEls} filtre={filtre} visibles={visibles} nAffichees={lignesAff.length} choixGroupes={choixGroupes} forces={forcesGroupes} onBasculeGroupe={basculerGroupe} onToutPlier={toutPlierGroupes} onToutDeplier={toutDeplierGroupes} perdues={perduesParBande} onSansFiltre={()=>{setFiltre(null);setGarde([]);}}
          rattacherTous={mouturesPropositions.length>1?{n:mouturesPropositions.length,onTous:()=>patch({lines:mouturesPropositions.reduce((acc,p)=>confirmMillingSurcharge(acc,p.lineId),draft.lines)})}:null}
          pied={{ajouterOff:draft.lines.length>=35,ajouterTitre:draft.lines.length>=35?'35 lignes au plus, port compris':undefined,regrouper:draft.lines.length>1,detail:draft.lines.length>1?detailListe:null}}
          onAjouter={()=>patch({lines:[...draft.lines,newLine()]})} onRegrouper={()=>patch({lines:[{...newLine(),description:draft.description,kind:'other',amount:draft.amount}]})}>
          {tiroirPort}
        </Liste>
      </div>
    </div>
  </fieldset>:null;
  /* Sans lecture (R5) : la liste et les champs d'aujourd'hui, dans le cadre p3c-3 (en-tête, pied sans bascule). */
  const sansLecture=<fieldset disabled={saving||Boolean(pendingId)||Boolean(done)} className="min-w-0 flex flex-col gap-2 px-2 pt-1.5 pb-2 lg:mx-auto lg:max-w-[760px]">
    {doublons}
    <div className={hints.amountTTC?uncertainClass:''}><Field label="Total TTC en CHF" htmlFor="purchase-total"><NumberInput id="purchase-total" fractionDigits={2} aria-describedby={[hints.amountTTC?'scan-hint-amountTTC':'',attempted&&shownErrors.some(issue=>issue.includes('total'))?validationId:''].filter(Boolean).join(' ')||undefined} value={draft.amount} onValue={setTotal} emptyValue={undefined} min={0} placeholder={scan&&!scan.ok?'—':'0,00'} className={`${inputClass} !text-base font-mono font-semibold tabular-nums min-h-8`}/></Field><ScanHint field="amountTTC" message={hints.amountTTC}/></div>
    {draft.sourceCurrency&&draft.sourceCurrency!=='CHF'?<p className="text-attention text-sm">Original : {draft.sourceAmount??'montant absent'} {draft.sourceCurrency}. Montants à renseigner en CHF.</p>:null}
    {tuiles}{panneaux}
    {lignesBloc}
    <Field label="Pour quoi ?" htmlFor="purchase-description">{descriptionChamp}</Field>
    <Rubriques items={itemsRub}/>
    {phraseRecu}
  </fieldset>;
  const enteteFichier=surFichier;
  return <ModalShell open onClose={()=>{if(!busy&&!saving)onClose();}} dismissible={!busy&&!saving} labelledBy={titleId} size="xl" plein>
    <Entete titleId={titleId} titre={initialIntent==='equipment'?'Acheter du matériel':'Nouvelle dépense'} horsLigne={!online} fichier={enteteFichier} pages={pagesJointes} ouvert={justifOuvert} fermerOff={busy||saving} onFermer={onClose} onBasculer={()=>{if(justifOuvert)setEntreeOuverte(false);setJustifOuvert(o=>!o);}}
      milieu={ordre==='cat'&&etatSeg.visible?<SegmentPlier plie={etatSeg.plie} deplie={etatSeg.deplie} onPlier={()=>toutPlierGroupes()} onDeplier={()=>toutDeplierGroupes()}/>:undefined}/>
    {verif==='attente'?<FilVerification/>:null}
    <div ref={scroller} className="dp-p3c-corps flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pt-10 lg:scroll-pt-0 [&_input:not([type=checkbox])]:min-h-8 [&_input]:py-0.5 [&_select]:min-h-8 [&_select]:py-0.5 [&_[role=textbox]]:min-h-8 [&_[role=textbox]]:py-0.5 [&_label]:text-xs [&_summary]:text-[13px]">
      <div className={justifOuvert&&enteteFichier?'px-2 pt-1.5':''}><Justificatif fichier={enteteFichier} ouvert={justifOuvert} changerOff={saving||Boolean(pendingId)||Boolean(done)||verif==='attente'} pages={pagesJointes?pages.map(p=>({id:p.id,url:p.url,nom:p.file.name})):undefined} onChanger={pagesJointes?ouvrirEntree:()=>fileInput.current?.click()}/></div>
      <div data-dp="alertes" className="space-y-1.5 px-2 pt-1.5 empty:hidden">{recu}{alertes}</div>
      <div ref={form} className="pb-2">
        <input hidden ref={fileInput} aria-label="Importer un justificatif" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void attach(file);e.target.value='';}}/>
        <input hidden ref={cameraInput} aria-label="Photographier un justificatif" type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void attach(file);e.target.value='';}}/>
        <input hidden ref={qrPhoto} aria-label="Photographier le QR" type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)lancerQr(file);e.target.value='';}}/>
        {/* n2-pages : « Plusieurs » et « + page » ouvrent ce sélecteur d'images, SANS capture (le téléphone propose « Prendre une photo » à côté des fichiers). Un fichier à la fois ; placé après les trois d'avant. */}
        <input hidden ref={pagesInput} aria-label="Ajouter une page" type="file" accept="image/*" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)ajouterPage(file);e.target.value='';}}/>
        <div className="space-y-2 px-2 pt-1.5 empty:hidden">{capt}</div>
        {showForm&&!busy&&!attached&&!dejaTx?(scanLayout??sansLecture):null}
      </div>
    </div>
    {showForm&&perdueCourante?<BandeauPerdues nom={nomAffiche(perdueCourante.ligne.description)} montant={perdueCourante.ligne.amount===undefined?'—':fr2c(Math.round(perdueCourante.ligne.amount*100))} rang={perduesIds.indexOf(perdueCourante.ligne.id)+1} total={perduesIds.length} onGarder={garderPerdue} onRetirer={retirerPerdue} onToutValider={toutValider}/>:null}
    {showForm?<Pied ordre={scan?.ok&&statutFinal&&!attached&&!dejaTx&&!done?ordre:null} onOrdre={o=>{setOrdre(o);setFiltre(null);setGarde([]);}} statut={statutPied} courant={courantIdx>=0?{numero:courantIdx+1,nom:chips[courantIdx].nom,niveau:rougeDe(chips[courantIdx])?'inconnu':'repris'}:null} tout={tout} onAllerCourant={()=>{if(courantIdx>=0)aller(chips[courantIdx]);}} bouton={bouton} cible={bandeauRef} racine={scroller} keyboardInset={Boolean(keyboardInset)} aPoints={chips.length>0}/>:null}
  </ModalShell>;
}
const fr2=(n:number)=>(Math.round(n*100)/100).toFixed(2).replace('.',',');
function ScanHintTotal({message}:{message?:string}){return message?<span id="scan-hint-amountTTC" className="sr-only">À confirmer · {message}</span>:null;}
