import React, { useEffect, useId, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Sheet } from '../../Sheet';
import { NumberInput } from '../../NumberInput';
import { ChampNombre } from '../../depense/ChampNombre';
import { BORNES_FINANCE } from '../../../domain/finance/bornesFinance';
import type { FinanceCategory } from '../../../types';
import './prevision.css';

/**
 * Les briques communes des feuilles de saisie de Finances (montant, champ, feuille à pied Annuler / Enregistrer).
 * Elles vivent ici, et non dans FinanceForms, pour que les quatre feuilles portées (prévision, projet, bien, profil) les importent sans cycle ;
 * FinanceForms les ré-exporte : aucun importeur existant ne change.
 */
export const CATEGORY_LABELS: Record<FinanceCategory, string> = { brassage: 'Brassage', materiel: 'Matériel', nettoyage: 'Nettoyage', chargesFixes: 'Charges fixes', renovation: 'Local et travaux', divers: 'Autres frais', recettes: 'Ventes', apports: 'Apports privés' };
export const idFor = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export function MoneyInput({ label, value, onChange, required = false, signed = false, maxCents = BORNES_FINANCE.operationCents.valeur }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; required?: boolean; signed?: boolean; /** Borne du champ en centimes ; par défaut celle d'une écriture. */ maxCents?: number }) {
  /* BE-64, BE-71 : un montant non signé refuse VISIBLEMENT un négatif (« −1 » devenait 0 en silence), un millième (« 0,004 ») et ce qui dépasse la borne d'une écriture. Le solde de départ, signé, garde la saisie libre. */
  if (!signed) return <label className="finance-field">{label}<ChampNombre aria-label={label} value={value == null ? undefined : value / 100} onValue={v => onChange(v == null ? undefined : Math.round(v * 100))} max={maxCents / 100} maxDecimales={2} dire /></label>;
  return <label className="finance-field">{label}<NumberInput aria-label={label} value={value == null ? undefined : value / 100} onValue={v => onChange(v == null ? undefined : Math.round(v * 100))} emptyValue={undefined} required={required} /></label>;
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="finance-field">{label}{children}</label>; }
/**
 * u2 (21, 27) : une question avant un geste qui retire ou range (supprimer, archiver). « Garder » referme sans rien faire ; le refus du service s'écrit ici, à portée du pouce.
 * Même brique pour la feuille de la prévision et celle du projet de matériel.
 */
export function Confirmation({ question, detail, oui, onOui, onGarder, busy = false, erreur = '', danger = true }: { question: string; detail?: string; oui: string; onOui: () => void; onGarder: () => void; busy?: boolean; erreur?: string; danger?: boolean }) {
  const id = useId(), garder = useRef<HTMLButtonElement>(null);
  /* Fusion fix-materiel (16.11) : la question remplace le bouton touché ; le focus va au geste sûr, « Garder », au lieu de tomber sur la page. */
  useEffect(() => { garder.current?.focus?.(); }, []);
  return <div className="fin-conf" role="alertdialog" aria-labelledby={id} aria-describedby={detail ? `${id}d` : undefined}>
    <p id={id} className="fin-conf-q">{question}</p>{detail && <p id={`${id}d`} className="fin-conf-d">{detail}</p>}
    {erreur && <p role="alert" className="finance-error">{erreur}</p>}
    <div className="finance-actions"><button type="button" ref={garder} className="finance-action secondary" onClick={onGarder} disabled={busy}>Garder</button>
      <button type="button" className={`finance-action${danger ? ' danger' : ''}`} onClick={onOui} disabled={busy}>{oui}</button></div>
  </div>;
}
/** `suppression` : le geste « Supprimer » du pied (prévision déjà enregistrée seulement) ; `etiquette` est son nom lu, `question` ce qu'on demande, `faire` l'écriture (un refus du service s'écrit dans la question). */
export interface SuppressionFeuille { etiquette: string; question: string; detail?: string; faire: () => void | Promise<void> }
export function FormSheet({ title, subtitle, onClose, onSave, children, saveLabel = 'Enregistrer', className = '', suppression }: { title: string; subtitle?: string; onClose: () => void; onSave: () => void | Promise<void>; children: React.ReactNode; saveLabel?: string; className?: string; suppression?: SuppressionFeuille }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [demande, setDemande] = useState(false), [refus, setRefus] = useState('');
  const submit = async (e?: React.FormEvent) => { e?.preventDefault(); if (busy) return; setBusy(true); setError(''); try { await onSave(); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.'); } finally { setBusy(false); } };
  const supprimer = async () => { if (busy || !suppression) return; setBusy(true); setRefus(''); try { await suppression.faire(); onClose(); } catch (err) { setRefus(err instanceof Error ? err.message : 'Suppression impossible.'); } finally { setBusy(false); } };
  const pied = demande && suppression
    ? <Confirmation question={suppression.question} detail={suppression.detail} oui="Oui, supprimer" onOui={() => void supprimer()} onGarder={() => { setDemande(false); setRefus(''); }} busy={busy} erreur={refus} />
    : <div className="finance-actions"><button className="finance-action secondary" type="button" onClick={onClose} disabled={busy}>Annuler</button><button type="submit" form="finance-form" className="finance-action" disabled={busy}>{busy ? 'Enregistrement…' : saveLabel}</button>
      {suppression && <button type="button" className="finance-action danger fin-suppr" aria-label={suppression.etiquette} disabled={busy} onClick={() => setDemande(true)}><Trash2 size={14} aria-hidden="true" />Supprimer</button>}</div>;
  return <Sheet open title={title} subtitle={subtitle} onClose={onClose} dismissible={!busy} className={`finance-sheet ${className}`.trim()} footer={pied}><form autoComplete="off" id="finance-form" onSubmit={submit} className="finance-form">{error && <p role="alert" className="finance-error">{error}</p>}{children}</form></Sheet>;
}
