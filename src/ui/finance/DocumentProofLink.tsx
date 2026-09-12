import React,{useState,useEffect,useRef} from 'react';
import { FileText,Download,Loader2 } from 'lucide-react';
import type { FinanceTransaction } from '../../domain/finance/types';
import { loadFinanceDocument } from '../../services/financeDocuments';
import { Sheet } from '../Sheet';
import { DriveConnection } from './DriveConnection';

export function DocumentProofLink({transaction,className=''}:{transaction:FinanceTransaction;className?:string}) {
  const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[proof,setProof]=useState<{url:string;name:string;mime:string}|null>(null);
  const request=useRef(0);
  const [driveAuthError,setDriveAuthError]=useState(false);
  useEffect(()=>{
    request.current+=1;
    setOpen(false);setLoading(false);setError('');setProof(null);setDriveAuthError(false);
    return()=>{request.current+=1;};
  },[transaction.id,transaction.finance?.proofDocumentId,transaction.proofUrl]);
  useEffect(()=>()=>{if(proof?.url.startsWith('blob:'))URL.revokeObjectURL(proof.url);},[proof]);
  if (!transaction.proofUrl && !transaction.finance?.proofDocumentId) return null;
  const show=async()=>{
    setOpen(true);if(proof||loading)return;setLoading(true);setError('');setDriveAuthError(false);
    const current=++request.current;
    try {
      const original=transaction.finance?.proofDocumentId ? await loadFinanceDocument(transaction.finance.proofDocumentId) : {dataUrl:transaction.proofUrl,fileName:transaction.proofFileName||'Justificatif',mimeType:transaction.proofType||''};
      if(current!==request.current)return;
      let url=original.dataUrl;
      if(url.startsWith('data:')) { const binary=atob(url.split(',')[1]); const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)); url=URL.createObjectURL(new Blob([bytes],{type:original.mimeType})); }
      setProof({url,name:original.fileName,mime:original.mimeType});
    } catch(e:any){if(current===request.current){setError(e.message||'Justificatif indisponible.');setDriveAuthError(e?.code==='drive/auth-required');}} finally{if(current===request.current)setLoading(false);}
  };
  return <><button type="button" onClick={show} className={`inline-flex items-center gap-2 min-h-11 text-ebc-straw ${className}`}><FileText size={16}/>Justificatif</button>
    {open?<Sheet open onClose={()=>setOpen(false)} title="Justificatif" subtitle={proof?.name} footer={proof?<a href={proof.url} download={proof.name} target="_blank" rel="noreferrer" className="flex gap-2 items-center justify-center min-h-12 rounded-control bg-ebc-straw text-cave-950 font-semibold"><Download size={18}/>Ouvrir ou télécharger</a>:undefined}>
      {loading?<div role="status" className="py-12 flex gap-2 justify-center"><Loader2 className="animate-spin"/>Chargement du document…</div>:null}
      {error?<div className="space-y-3 py-4"><p role="alert" className="text-amber-300">{error}</p>{driveAuthError?<DriveConnection always onConnected={()=>void show()}/>:null}<button type="button" onClick={()=>void show()} className="min-h-11 text-ebc-straw underline">Réessayer le chargement</button></div>:null}
      {proof?.mime.startsWith('image/')?<img src={proof.url} alt={proof.name} className="w-full rounded-panel"/>:proof?.mime==='application/pdf'?<iframe src={proof.url} title={proof.name} className="w-full h-[65dvh] rounded-panel bg-white"/>:null}
    </Sheet>:null}</>;
}
