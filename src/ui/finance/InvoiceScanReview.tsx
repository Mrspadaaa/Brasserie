import React from 'react';
import type { StatutLecture } from '../../domain/finance/invoicePoints';
import type { ScannedInvoiceResult } from '../../services/geminiScanner';
import type { PurchaseLineDraft } from '../../services/purchaseEntry';
import { Bandeau, Preuve } from '../depense/Verdict';
import type { CompteLiens } from '../depense/etat';
import type { LienStock } from '../depense/Pictos';

/**
 * Le verdict de la lecture (r2b) : le bandeau (fournisseur, date, total, « n lignes », barre) et la preuve. C'est la région « Vérification du justificatif ».
 * La lecture décrit une transcription proposée, jamais une approbation comptable : le statut vient de `statutAffiche` (jamais « vérifié » sans points).
 */
export function InvoiceScanReview(p: {
  result: ScannedInvoiceResult; cached?: boolean; statut: StatutLecture; vendor: string; date: string; totalField: React.ReactNode; calcule: boolean;
  lines: readonly PurchaseLineDraft[]; comptes: CompteLiens; remarques: string[]; preuveOuverte: boolean; onPreuve: () => void;
  liens: Readonly<Record<string, LienStock>>; drive: 'ok' | 'a-connecter' | null; onDrive: () => void; onLigne: (id: string) => void; bandeauRef?: React.Ref<HTMLDivElement>;
  /** z2 (QR-facture) : le sceau à droite du total, ce qui se pose sous le total (duel, témoin, photo), et l'écart de somme dit par la preuve. Tous facultatifs : absents, rien ne change. */
  sceau?: React.ReactNode; sousTotal?: React.ReactNode; ecartTotal?: { lignes: string; lu: string }; doutes?: { date?: boolean; vendor?: boolean; devise?: boolean };
}) {
  return <section aria-label="Vérification du justificatif" className="space-y-2">
    <div ref={p.bandeauRef}><Bandeau liens={p.liens} vendor={p.vendor} date={p.date} totalField={p.totalField} calcule={p.calcule} statut={p.statut} lines={p.lines} preuveOuverte={p.preuveOuverte} onPreuve={p.onPreuve} drive={p.drive} onDrive={p.onDrive} onLigne={p.onLigne} sceau={p.sceau} sousTotal={p.sousTotal} doutes={p.doutes}/></div>
    <Preuve ouverte={p.preuveOuverte} statut={p.statut} result={p.result} lignes={p.lines.length} comptes={p.comptes} remarques={p.remarques} cached={p.cached} ecartTotal={p.ecartTotal}/>
  </section>;
}
