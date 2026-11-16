import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import type { Transaction } from '../../types';
import type { EquipmentUpgrade, FinancialPlan } from '../../domain/finance/types';
import { upgradeBudget, upgradeDetails, upgradeProgress, upgradeReadiness } from '../../domain/finance/upgrades';
import { isActiveTransaction, todayISO, transactionKind } from '../../domain/finance/ledger';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { Sheet } from '../Sheet';
import { Confirmation, idFor } from './prevision/base';
import { supprimerPlan } from './prevision/supprimerPlan';
import { ProjetPiste } from './projet/ProjetPiste';
import { etatPiste, type StationId } from './projet/piste';
import './upgrade-plan.css';

/**
 * Constats 8 et 27 (jeu en ligne 16.11) : une seule suppression de projet. La question est `Confirmation` (prevision/base, en ligne : sur place,
 * 44 px, « Garder » pris au focus), le geste `supprimerPlan`, qui confie un projet à `StorageService.deleteUpgradePlan` : le projet part,
 * ses achats liés restent dans les comptes. Ce texte est commun à la feuille et à la fiche d'À venir.
 */
export const SUPPRIMER_DETAIL = 'Ses achats liés restent dans les comptes. Pour le garder sans le compter : Archiver.';

/** La saisie d'un achat n'est chargée que si on la demande : la feuille du projet reste légère. */
const ExpenseSheet = lazy(() => import('./ExpenseSheet').then(m => ({ default: m.ExpenseSheet })));

const readPurchases = () => ({ transactions: StorageService.getTransactions(), payments: FinanceService.getPayments() });
/**
 * Projet de matériel, porté sur m3pm-d : une piste verticale (Idée, À étudier, Devis, Prêt à acheter, puis Acheté et En service) ; chaque champ
 * du projet est rangé à sa station (`projet/ProjetPiste.tsx`). Ici : le brouillon, l'enregistrement (`FinanceService.saveUpgrade`, inchangé) et le pied.
 */
export function UpgradeSheet({ plan, onClose, onSaved, onOpenTransaction }: { plan?: FinancialPlan; onClose: () => void; onSaved?: () => void; onOpenTransaction?: (transaction: Transaction) => void }) {
  const purchases = useStorageValue(readPurchases);
  const [draft, setDraft] = useState<FinancialPlan>(() => plan ? { ...plan, upgrade: upgradeDetails(plan) } : {
    id: idFor('UPGRADE'), title: '', date: '', amountCents: 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: new Date().toISOString(),
    upgrade: { version: 1, timing: 'later', stage: 'idea', budgetKnown: false, datePrecision: 'month', estimateSource: 'estimate' },
  });
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [achat, setAchat] = useState(false);
  /* u2 (27) : « Archiver » et « Supprimer » demandent d'abord ; un refus du service s'écrit dans la question. */
  const [demande, setDemande] = useState<'archiver' | 'supprimer' | null>(null), [refus, setRefus] = useState('');
  const invoices = purchases.transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && tx.finance?.planId === draft.id);
  const [ouvert, setOuvert] = useState<StationId | null>(() => etatPiste(draft, invoices.length, todayISO().slice(0, 7)).actuelle);
  const locked = useRef(false), erreurRef = useRef<HTMLParagraphElement>(null);
  /* TE-35 : le refus de l'enregistrement s'écrit en haut de la feuille ; qui vient de cocher « Dans mes prévisions » plus bas ne le voyait pas : il est amené dans la vue. */
  useEffect(() => { if (error) erreurRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [error]);
  const patch = (value: Partial<EquipmentUpgrade>) => setDraft(previous => {
    const upgrade = { ...previous.upgrade!, ...value }, total = upgradeBudget(upgrade);
    return { ...previous, upgrade: { ...upgrade, budgetKnown: total !== null }, amountCents: total ?? 0 };
  });
  const setMonth = (value: string) => setDraft(previous => ({ ...previous, date: value ? `${value}-01` : '', upgrade: { ...previous.upgrade!, datePrecision: 'month' } }));
  const save = async (status = draft.status) => {
    if (locked.current) return;
    if (!draft.title.trim()) { setError('Nomme le matériel ou l’aménagement à prévoir.'); return; }
    locked.current = true; setBusy(true); setError('');
    try { await FinanceService.saveUpgrade({ ...draft, title: draft.title.trim(), status }); onSaved?.(); onClose(); }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Le projet n’a pas pu être enregistré.');
      // Le refus nomme un champ rangé à une station : on ouvre celle-ci.
      if (status === 'active' && upgradeReadiness(draft).length) setOuvert(upgradeReadiness(draft).some(m => /budget/i.test(m)) ? 'research' : 'ready');
    }
    finally { locked.current = false; setBusy(false); }
  };
  const archiver = async () => { await save('cancelled'); setDemande(null); };
  /** Supprimer : le projet part (Dexie et Firestore, hors ligne compris) ; les achats liés ne sont jamais touchés. */
  const supprimer = async () => {
    if (locked.current || !plan) return;
    locked.current = true; setBusy(true); setRefus('');
    try { supprimerPlan(plan.id); onSaved?.(); onClose(); }
    catch (e) { setRefus(e instanceof Error ? e.message : 'Le projet n’a pas pu être supprimé.'); }
    finally { locked.current = false; setBusy(false); }
  };
  const missing = upgradeReadiness(draft);
  const progress = upgradeProgress(draft, purchases.transactions, purchases.payments);
  const ferme = plan && ['cancelled', 'completed'].includes(plan.status);
  return <>
    <Sheet open title={plan ? 'Mon projet de matériel' : 'Prévoir du matériel'} subtitle="Du besoin à l’achat" className="finance-sheet pjd-sheet" dismissible={!busy} onClose={onClose}
      footer={demande === 'supprimer'
        ? <Confirmation question={`Supprimer « ${draft.title.trim() || 'ce projet'} » ?`} detail={SUPPRIMER_DETAIL} oui="Oui, supprimer" onOui={() => void supprimer()} onGarder={() => { setDemande(null); setRefus(''); }} busy={busy} erreur={refus} />
        : demande === 'archiver'
        ? <Confirmation question={`Archiver « ${draft.title.trim() || 'ce projet'} » ?`} detail="Il sort de tes prévisions et reste dans Archives, où « Reprendre ce projet » le remet." oui="Oui, archiver" onOui={() => void archiver()} onGarder={() => setDemande(null)} busy={busy} danger={false} />
        : <div className="pjd-pied fm-pied">
        {/* Déclencheur de fix-materiel (lien rouge de 44 px en tête du pied, mesuré au banc) ; celui en ligne, `pjd-suppr`, n'avait pas de style. */}
        {plan && <button type="button" className="fm-sup" aria-label="Supprimer ce projet" disabled={busy} onClick={() => setDemande('supprimer')}><Trash2 aria-hidden="true" />Supprimer</button>}
        {!plan ? <button type="button" className="pjd-btn" disabled={busy} onClick={onClose}>Annuler</button>
          : ferme ? <button type="button" className="pjd-btn" disabled={busy} onClick={() => void save('draft')}><RotateCcw aria-hidden="true" />Reprendre ce projet</button>
          : <button type="button" className="pjd-btn" aria-label="Archiver ce projet" disabled={busy} onClick={() => setDemande('archiver')}><Archive aria-hidden="true" />Archiver</button>}
        <button type="button" className="pjd-btn pjd-pri" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer le projet'}</button>
      </div>}>
      <ProjetPiste draft={draft} plan={plan} setDraft={setDraft} patch={patch} setMonth={setMonth} ouvert={ouvert} setOuvert={setOuvert} progress={progress} invoices={invoices} missing={missing}
        busy={busy} error={error} erreurRef={erreurRef} onClose={onClose} onRealise={() => void save('completed')} onNoterAchat={plan ? () => setAchat(true) : undefined} onOpenTransaction={onOpenTransaction} />
    </Sheet>
    {achat && plan && <Suspense fallback={null}><ExpenseSheet initialIntent="equipment" initialPlanId={plan.id} onSaved={() => {}} onClose={() => setAchat(false)} /></Suspense>}
  </>;
}
