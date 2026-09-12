import { AlertCircle, Check, FileText, ChevronDown } from 'lucide-react';
import type { ScannedInvoiceResult } from '../../services/geminiScanner';

const statuses = {
  checked: { title: 'Lecture vérifiée', detail: 'Les lectures du justificatif concordent. Relis les champs avant d’enregistrer.' },
  corrected: { title: 'Corrections proposées', detail: 'Une relecture du document a corrigé des écarts. Confirme ces propositions sur l’original.' },
  disputed: { title: 'Lecture à confirmer', detail: 'Certains points restent à confirmer. Vérifie les points signalés sur l’original.' },
  unavailable: { title: 'Vérification incomplète', detail: 'La lecture reste une proposition. Vérifie les montants et les articles sur l’original.' }
};

const fieldLabels: Record<string, string> = {
  vendor: 'Fournisseur', date: 'Date', currency: 'Devise', invoiceNumber: 'N° de facture',
  amountHT: 'Total HT', tvaRate: 'Taux de TVA', tvaAmount: 'Montant de TVA', amountTTC: 'Total TTC',
  category: 'Catégorie', subcategory: 'Sous-catégorie', description: 'Description', items: 'Articles', documentType: 'Type de document', paymentEvidence: 'Paiement', orderNumber: 'N° de commande'
};
const documentTitles = { invoice: 'Facture', receipt: 'Ticket de caisse', delivery_note: 'Bordereau de livraison', quote: 'Devis', credit_note: 'Avoir', other: 'Justificatif' };

function correctionLabel(field: string): string {
  if (fieldLabels[field]) return fieldLabels[field];
  const line = /^items(?:\[(\d+)\]|\.(\d+))(?:\.|$)/.exec(field);
  return line ? `Article ${Number(line[1] ?? line[2]) + 1}` : 'Détail du document';
}

/** The AI review describes the proposed transcription, never an accounting approval. */
export function InvoiceScanReview({ result, cached, expanded = false, compact = false }: { result: ScannedInvoiceResult; cached?: boolean; expanded?: boolean; compact?: boolean }) {
  const status = result.review?.status ?? 'unavailable';
  const presentation = statuses[status];
  const points = [...new Set([
    ...result.issues,
    ...(result.review?.findings ?? []),
    ...result.items.flatMap(item => item.ambiguity ? [`${item.name || 'Article'} : ${item.ambiguity}`] : [])
  ].map(point => point.trim()).filter(Boolean))];
  const corrections = [...new Set((result.review?.correctedFields ?? []).map(correctionLabel))];
  const clear = status === 'checked' && points.length === 0;
  if (compact) return <section aria-label="Vérification du justificatif" className={`rounded-panel border ${clear?'border-hop/30 bg-hop/5':'border-amber-400/30 bg-amber-400/5'}`}>
    <details open={expanded}>
      <summary aria-label="Détails de la lecture" className={`min-h-14 flex items-center gap-2 p-3 cursor-pointer ${clear?'text-hop':'text-amber-200'}`}>
        {clear?<Check size={17} className="shrink-0"/>:<AlertCircle size={17} className="shrink-0"/>}
        <div className="flex-1 min-w-0"><p className="font-medium text-sm">{documentTitles[result.documentType??'other']} · {result.items.length} article{result.items.length>1?'s':''}</p><p className="text-xs text-cave-200 mt-1"><span className="capitalize">{result.vendor}</span>{result.vendor?' · ':''}<span>{presentation.title}</span></p></div>
        <ChevronDown size={14} className="shrink-0"/>
      </summary>
      <div className="px-3 pb-3 space-y-2">
        <p className="text-xs text-cave-200 leading-relaxed">{presentation.detail}</p>
        {corrections.length?<p className="text-xs text-amber-200">Champs corrigés : {corrections.join(' · ')}.</p>:null}
        {points.length?<ul className="list-disc pl-4 text-xs text-cave-200 space-y-2 leading-relaxed break-words">{points.map(point=><li key={point}>{point}</li>)}</ul>:null}
        {cached?<p className="text-xs text-cave-400">Lecture déjà disponible · aucun nouvel appel IA.</p>:null}
      </div>
    </details>
  </section>;
  return <section aria-label="Vérification du justificatif" className={`rounded-panel border p-3 space-y-2 ${clear ? 'border-hop/30 bg-hop/5' : 'border-amber-400/30 bg-amber-400/5'}`}>
    <div role="status" className={`flex items-start gap-2 ${clear ? 'text-hop' : 'text-amber-200'}`}>
      {clear ? <Check size={18} className="shrink-0 mt-0.5"/> : status === 'corrected' ? <FileText size={18} className="shrink-0 mt-0.5"/> : <AlertCircle size={18} className="shrink-0 mt-0.5"/>}
      <div className="min-w-0"><p className="font-medium text-sm">{compact?`${documentTitles[result.documentType??'other']} · ${result.items.length} article${result.items.length>1?'s':''}`:presentation.title}</p>{compact?<p className="text-xs text-cave-200 mt-1">{presentation.title}</p>:<p className="text-xs text-cave-200 leading-relaxed mt-1">{presentation.detail}</p>}</div>
    </div>
    {!compact && status === 'corrected' && corrections.length > 0 ? <p className="text-xs text-amber-100/80 break-words">Champs corrigés : {corrections.join(' · ')}.</p> : null}
    {points.length > 0 ? <details open={expanded}>
      <summary className="text-sm text-amber-200 min-h-11 cursor-pointer flex items-center">{compact?'Détails de la lecture':`${points.length} point${points.length > 1 ? 's' : ''} à confirmer sur l’original`}</summary>
      <ul className="list-disc pl-5 text-sm text-cave-200 space-y-2 leading-relaxed break-words">{points.map(point => <li key={point}>{point}</li>)}</ul>
    </details> : null}
    {cached ? <p className="text-xs text-cave-400">Lecture déjà disponible · aucun nouvel appel IA.</p> : null}
  </section>;
}
