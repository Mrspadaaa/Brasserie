import { useEffect, useState } from 'react';
import { getProofJob, subscribeProofQueue } from '../../services/proofQueue';
import { StorageService } from '../../services/storage';

/** Où en est l'envoi du justificatif d'une vente (la file locale, comme la Dépense) : `null` tant que rien n'est connu. */
export type EnvoiVente = 'en-cours' | 'fait' | 'a-renvoyer' | null;

/** Pure : la ligne de la file (ou son absence) et l'écriture disent l'état. Une ligne absente et un lien posé = envoyé ; absente sans lien = inconnu, jamais « fait ». */
export function etatEnvoi(job: { state: string } | undefined, lie: boolean): EnvoiVente {
  if (job?.state === 'failed') return 'a-renvoyer';
  if (job?.state === 'queued' || job?.state === 'sending') return 'en-cours';
  if (job?.state === 'voided') return null;
  return lie ? 'fait' : null;
}

export function useEnvoiVente(transactionId: string | undefined, actif: boolean): EnvoiVente {
  const [etat, setEtat] = useState<EnvoiVente>(actif ? 'en-cours' : null);
  useEffect(() => {
    if (!actif || !transactionId) { setEtat(null); return; }
    let vivant = true;
    const lire = () => {
      void getProofJob(transactionId).then(job => {
        if (!vivant) return;
        const tx = StorageService.getTransactions().find(t => t.id === transactionId);
        setEtat(etatEnvoi(job, Boolean(tx?.finance?.proofDocumentId)));
      });
    };
    lire();
    const arret = subscribeProofQueue(lire);
    return () => { vivant = false; arret(); };
  }, [transactionId, actif]);
  return etat;
}
