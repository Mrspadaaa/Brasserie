import React, { useState } from 'react';
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
export function FormSheet({ title, subtitle, onClose, onSave, children, saveLabel = 'Enregistrer', className = '' }: { title: string; subtitle?: string; onClose: () => void; onSave: () => void | Promise<void>; children: React.ReactNode; saveLabel?: string; className?: string }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async (e?: React.FormEvent) => { e?.preventDefault(); if (busy) return; setBusy(true); setError(''); try { await onSave(); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.'); } finally { setBusy(false); } };
  return <Sheet open title={title} subtitle={subtitle} onClose={onClose} dismissible={!busy} className={`finance-sheet ${className}`.trim()} footer={<div className="finance-actions"><button className="finance-action secondary" type="button" onClick={onClose} disabled={busy}>Annuler</button><button type="submit" form="finance-form" className="finance-action" disabled={busy}>{busy ? 'Enregistrement…' : saveLabel}</button></div>}><form autoComplete="off" id="finance-form" onSubmit={submit} className="finance-form">{error && <p role="alert" className="finance-error">{error}</p>}{children}</form></Sheet>;
}
