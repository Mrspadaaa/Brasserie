/**
 * Voie ecr5 (24.11) : un dépôt Firestore simulé qui se conduit comme le vrai sur ce qui a fait mentir les tests de ecr4 (E43-1) :
 *  - le cache local suit chaque écriture tout de suite (`put` remplace le document entier, `adjustNumber` incrémente) ;
 *  - les écritures d'un même tour synchrone partent en UN lot (microtâche, comme `flushWrites` de firestoreRepo.ts) ;
 *  - un « serveur » applique le lot et refuse ce que les règles de `firestore.rules` refusent pour les pièces et les paiements
 *    (`updatedTransactionGuard`, `matchingPaymentGuard`, `validPaymentReversal`). C'est un modèle : la preuve contre les vraies règles est
 *    `tests/rules/rejouer-paiements.mjs` (émulateur).
 * Une pièce réécrite en entier avec un solde réglé ou un dernier paiement périmés est refusée : c'est la cause de « Missing or insufficient permissions ».
 */
type Doc = Record<string, any>;
interface Op { name: string; id: string; data?: Doc; merge?: boolean; incr?: { field: string; delta: number }; remove?: boolean }

export function creerServeurSimule() {
  const cache = new Map<string, Map<string, Doc>>();
  const serveur = new Map<string, Map<string, Doc>>();
  const refus: string[] = [];
  const lots: Op[][] = [];
  let file: Op[] = [];
  let enVol: Promise<void> = Promise.resolve();

  const table = (m: Map<string, Map<string, Doc>>, nom: string) => { if (!m.has(nom)) m.set(nom, new Map()); return m.get(nom)!; };
  const copie = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  const montantPiece = (d: Doc) => d.finance?.amountCents ?? Math.round((d.amountTTC ?? d.amountHT ?? 0) * 100);
  const sens = (d: Doc) => {
    const kind = d.finance?.kind ?? (d.category === 'recettes' ? 'income' : d.category === 'apports' ? 'contribution' : 'expense');
    return kind === 'refund' ? (d.finance?.refundDirection ?? 'in') : (kind === 'income' || kind === 'contribution') ? 'in' : 'out';
  };

  function appliquer(lot: Op[]): string | null {
    const avant = new Map<string, Doc | undefined>();
    const apres = new Map<string, Doc | undefined>();
    const paiements: Doc[] = [];
    const lire = (cle: string, nom: string, id: string) => (apres.has(cle) ? apres.get(cle) : table(serveur, nom).get(id));
    for (const op of lot) {
      const cle = `${op.name}/${op.id}`;
      if (!avant.has(cle)) avant.set(cle, table(serveur, op.name).get(op.id) ? copie(table(serveur, op.name).get(op.id)!) : undefined);
      const courant = lire(cle, op.name, op.id);
      if (op.remove) { apres.set(cle, undefined); continue; }
      if (op.incr) { const base = courant ? copie(courant) : {}; base[op.incr.field] = (Number(base[op.incr.field]) || 0) + op.incr.delta; Object.assign(base, op.data ?? {}); apres.set(cle, base); continue; }
      apres.set(cle, op.merge ? { ...(courant ?? {}), ...copie(op.data!) } : copie(op.data!));
      if (op.name === 'financialPayments') paiements.push(copie(op.data!));
    }
    // Règles (copie fidèle de firestore.rules, section transactions et financialPayments).
    for (const [cle, apresDoc] of apres) {
      if (!cle.startsWith('transactions/') || !apresDoc) continue;
      const avantDoc = avant.get(cle);
      const id = cle.slice('transactions/'.length);
      const doses = paiements.filter(p => p.transactionId === id);
      const solde = (d: Doc | undefined) => d?.settlementBalanceCents ?? 0;
      const dernier = (d: Doc | undefined) => d?.lastPaymentId ?? '';
      const inchange = !avantDoc || (solde(avantDoc) === solde(apresDoc) && dernier(avantDoc) === dernier(apresDoc));
      if (!avantDoc) {
        if (!(solde(apresDoc) === 0 && dernier(apresDoc) === '')) { if (doses.length !== 1) return `${cle} : création avec un solde sans paiement`; }
        continue;
      }
      if (avantDoc.finance?.voidedAt) return `${cle} : pièce déjà annulée`;
      if (!Number.isInteger(solde(apresDoc)) || solde(apresDoc) < 0 || solde(apresDoc) > montantPiece(apresDoc)) return `${cle} : solde réglé hors de 0..montant`;
      if (dernier(avantDoc) !== '' && sens(avantDoc) !== sens(apresDoc)) return `${cle} : le sens d'une pièce payée ne change pas`;
      if (inchange) {
        if (doses.length) return `${cle} : un paiement sans solde ni dernier paiement changés`;
      } else {
        const touches = new Set<string>();
        for (const k of new Set([...Object.keys(avantDoc), ...Object.keys(apresDoc)])) if (JSON.stringify(avantDoc[k]) !== JSON.stringify(apresDoc[k])) touches.add(k);
        if ([...touches].some(k => k !== 'settlementBalanceCents' && k !== 'lastPaymentId')) return `${cle} : Missing or insufficient permissions (le solde réglé ou le dernier paiement a changé en même temps que d'autres champs, ou la pièce a été réécrite avec un solde périmé : ${[...touches].join(', ')})`;
        if (doses.length !== 1) return `${cle} : le solde change sans exactement un paiement dans le lot`;
        const p = doses[0];
        if (dernier(apresDoc) !== p.id || p.id === dernier(avantDoc)) return `${cle} : lastPaymentId ne désigne pas le paiement du lot`;
        if (table(serveur, 'financialPayments').has(p.id)) return `${cle} : paiement déjà existant`;
        const delta = p.reversalOfId ? -p.amountCents : p.amountCents;
        if (solde(apresDoc) !== solde(avantDoc) + delta) return `${cle} : solde ${solde(avantDoc)} + ${delta} ≠ ${solde(apresDoc)}`;
        if (!Number.isInteger(p.amountCents) || p.amountCents <= 0) return `${p.id} : montant invalide`;
        if (p.reversalOfId) {
          const o = table(serveur, 'financialPayments').get(p.reversalOfId);
          if (!o || p.id !== `CONTRE-${p.reversalOfId}` || o.reversalOfId || o.transactionId !== p.transactionId || o.amountCents !== p.amountCents || o.direction === p.direction || String(p.date) < String(o.date)) return `${p.id} : contre-paiement refusé (Missing or insufficient permissions)`;
        } else if (p.direction !== sens(apresDoc)) return `${p.id} : sens du paiement ≠ sens de la pièce`;
      }
      if (apresDoc.finance?.voidedAt && !(solde(avantDoc) === 0 && solde(apresDoc) === 0 && inchange)) return `${cle} : annuler une pièce au solde non nul`;
    }
    for (const [cle, d] of apres) { const [nom, id] = [cle.slice(0, cle.indexOf('/')), cle.slice(cle.indexOf('/') + 1)]; if (d) table(serveur, nom).set(id, d); else table(serveur, nom).delete(id); }
    return null;
  }

  function envoyer() {
    const lot = file; file = [];
    lots.push(lot);
    enVol = enVol.then(() => { const motif = appliquer(lot); if (motif) refus.push(motif); });
  }
  const mettre = (op: Op) => { if (!file.length) queueMicrotask(envoyer); file.push(op); };

  const depot = {
    all: <T,>(nom: string): T[] => Array.from(cache.get(nom)?.entries() ?? []).map(([__docId, d]) => ({ ...copie(d), __docId }) as T),
    put: (nom: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
      const base = options?.merge ? { ...(cache.get(nom)?.get(id) ?? {}), ...copie(doc as Doc) } : copie(doc as Doc);
      table(cache, nom).set(id, base);
      mettre({ name: nom, id, data: copie(doc as Doc), merge: options?.merge === true });
    },
    adjustNumber: (nom: string, id: string, field: string, delta: number, extra: Doc = {}) => {
      const courant = cache.get(nom)?.get(id) ?? {};
      table(cache, nom).set(id, { ...courant, ...copie(extra), [field]: (Number(courant[field]) || 0) + delta });
      mettre({ name: nom, id, data: copie(extra), incr: { field, delta } });
    },
    remove: (nom: string, id: string) => { cache.get(nom)?.delete(id); mettre({ name: nom, id, remove: true }); },
    startSync: () => undefined, isReady: () => true, subscribe: () => () => undefined, consumeWriteError: () => null,
    clearMemoryCache: () => { cache.clear(); serveur.clear(); refus.length = 0; lots.length = 0; file = []; enVol = Promise.resolve(); }
  };

  return {
    depot, refus, lots,
    /** Attend que tous les lots partis aient été jugés par le serveur simulé. */
    async attendre() { await Promise.resolve(); await new Promise(r => setTimeout(r, 0)); await enVol; },
    piece: (id: string) => serveur.get('transactions')?.get(id),
    paiements: () => Array.from(serveur.get('financialPayments')?.values() ?? [])
  };
}
