import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { Batch } from '../../types';
import { actualBrewDate, breweryDay, hasBrewStarted, normalizeBrewDate, plannedBrewDate, rescheduleBatchPatch } from '../../domain/batchSchedule';
import { toIsoDate } from '../DateField';
import { BrewScheduleField } from './BrewScheduleField';
import { Button } from '../../components/ui/Button';

/** The intention can be changed until brewing starts. The actual day stays in the measurements. */
export function BatchSchedule({ batch, onSave }: { batch: Batch; onSave: (batch: Batch) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const planned = plannedBrewDate(batch), actual = actualBrewDate(batch), started = hasBrewStarted(batch);
  const rawPlan = batch.plannedBrewDate ?? (batch.status === 'planifie' ? batch.brewDate : undefined);
  const invalidPlan = rawPlan?.trim() && !planned ? rawPlan : undefined;
  const editable = !started && batch.status !== 'annule';
  const overdue = editable && planned && toIsoDate(planned) < toIsoDate(breweryDay(Date.now()));
  async function save() {
    if (busy || date !== undefined && !normalizeBrewDate(date)) return;
    setBusy(true); setError('');
    try { await onSave({ ...batch, ...rescheduleBatchPatch(batch, date ?? '') }); setEditing(false); }
    catch (e) { setError(e instanceof Error ? e.message : 'La date n’a pas pu être enregistrée. Réessaie.'); }
    finally { setBusy(false); }
  }
  return <section aria-label="Planning du brassin" className="space-y-1.5 border-b border-cave-800 pb-2 text-sm">
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <CalendarDays size={15} className="shrink-0 text-area-production" aria-hidden="true" />
      <span className="flex-1 min-w-0 text-cave-50">{started ? `${batch.status === 'planifie' && !batch.brewDay?.finishedAt ? 'Commencé' : 'Brassé'} le ${actual ?? '— date à renseigner'}` : planned ? `${batch.status === 'annule' ? 'Était prévu' : 'Prévu'} le ${planned}` : invalidPlan ? 'Date prévue à corriger' : batch.status === 'annule' ? 'Planning annulé' : 'Date à définir'}</span>
      {overdue && <span className="text-xs text-attention">Date dépassée</span>}
      {editable && !editing && <button type="button" className="min-h-touch px-1 text-xs text-cave-200 underline" onClick={() => { setDate(planned ?? invalidPlan); setError(''); setEditing(true); }}>{planned || invalidPlan ? 'Changer la date' : 'Planifier'}</button>}
    </div>
    {started && planned && <p className="text-xs text-cave-400">Initialement prévu le {planned}.</p>}
    {invalidPlan && <p role="alert" className="text-xs text-alert-strong break-words">Date prévue illisible, conservée : {invalidPlan}</p>}
    {started && batch.brewDate?.trim() && !normalizeBrewDate(batch.brewDate) && <p role="alert" className="text-xs text-alert-strong break-words">Date réelle illisible, conservée : {batch.brewDate}</p>}
    {!started && batch.status === 'annule' && batch.plannedBrewDate === undefined && batch.brewDate && <p className="text-xs text-cave-400">Date historique : {batch.brewDate} · prévue ou réelle à préciser.</p>}
    {editing && editable && <>
      <BrewScheduleField value={date} onChange={setDate} disabled={busy} />
      {error && <p role="alert" className="text-xs text-alert-strong">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button disabled={busy} onClick={() => { setEditing(false); setError(''); }}>Annuler</Button>
        <Button intent="primary" disabled={busy || date !== undefined && !normalizeBrewDate(date)} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer la date'}</Button>
      </div>
    </>}
  </section>;
}
