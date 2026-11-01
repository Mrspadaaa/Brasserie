import React from 'react';
import { Bandeau, Preuve } from '../depense/Recap';

/**
 * Le verdict de la lecture (p3c-3) : le bandeau (fournisseur, date, total, « dont port », barre, sceau QR) puis la preuve ouverte d'office, avec ses comptes de liens.
 * C'est la région « Vérification du justificatif ». La lecture décrit une transcription proposée, jamais une approbation comptable : le statut vient de
 * `statutAffiche` (jamais « vérifié » sans points) et se dit une seule fois, dans le nom accessible de la pastille « n lignes ».
 */
export function InvoiceScanReview(p: { bandeau: React.ComponentProps<typeof Bandeau>; preuve: Omit<React.ComponentProps<typeof Preuve>, 'children'>; comptes: React.ReactNode; bandeauRef?: React.Ref<HTMLDivElement> }) {
  return <section aria-label="Vérification du justificatif" className="space-y-1.5">
    <div ref={p.bandeauRef}><Bandeau {...p.bandeau}/></div>
    <Preuve {...p.preuve}>{p.comptes}</Preuve>
  </section>;
}
