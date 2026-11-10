import React, { useState } from 'react';
import type { Batch } from '../../types';
import { Input } from '../Input';
import { Button } from '../../components/ui/Button';
import { Field, inputClass } from '../FormNav';
import { DateField, swissToday } from '../DateField';
import { parseDecimal } from '../numericInput';
import { actualBrewDate } from '../../domain/batchSchedule';
import { packagingLimitL, validatePackaging } from '../../domain/batchPackaging';
import { todayISO } from '../../domain/finance/ledger';

/**
 * AM n° 6 : le volume conditionné et la date de conditionnement, saisis au passage « Conditionné » (ou corrigés ensuite depuis les mesures).
 * Le plus petit ajout dans la fiche brassin : un encadré de deux champs, pas un écran. Le volume est l'assiette de la taxe sur la bière.
 */
export const BatchPackagingForm: React.FC<{
  batch: Batch;
  /** Étape visée par ce passage ; absente quand on corrige seulement les valeurs. */
  confirmLabel: string;
  onConfirm: (values: { volumePackagedL: number; bottlingDate: string }) => void;
  onCancel: () => void;
}> = ({ batch, confirmLabel, onConfirm, onCancel }) => {
  const [text, setText] = useState(batch.volumePackagedL != null ? String(batch.volumePackagedL).replace('.', ',') : '');
  const [date, setDate] = useState(batch.bottlingDate || swissToday());
  const [tried, setTried] = useState(false);
  const maxL = packagingLimitL(batch);
  const volume = text.trim() ? parseDecimal(text) : null;
  const check = validatePackaging({ volumeL: volume, maxL, date, brewDate: actualBrewDate(batch) ?? undefined, today: todayISO() });
  const confirm = () => {
    setTried(true);
    if (check.ok) onConfirm({ volumePackagedL: Math.round((volume as number) * 100) / 100, bottlingDate: date });
  };
  return <section aria-label="Conditionnement du brassin" data-batch-packaging className="rounded-xl border border-ebc-amber/30 bg-cave-950 p-2 space-y-2">
    <div>
      <h3 className="text-sm font-semibold text-cave-50">Combien as-tu conditionné ?</h3>
      <p className="text-xs text-cave-400">Le volume mis en bouteilles ou en fûts sert à la taxe sur la bière et au bilan de pertes.{maxL !== null ? ` Volume en fermenteur : ${String(maxL).replace('.', ',')} L.` : ''}</p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Field label="Volume conditionné (L)" htmlFor="batch-packaged-volume" error={tried && 'error' in check && check.field === 'volume' ? check.error : undefined}>
        <Input id="batch-packaged-volume" name="batch_sheet_packaged_volume" type="text" inputMode="decimal" autoComplete="off" autoCorrect="off" spellCheck={false}
          data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" className={`${inputClass} font-mono`} placeholder="ex. 19,5"
          value={text} onChange={event => setText(event.target.value)}/>
      </Field>
      <DateField label="Date de conditionnement" value={date} onChange={setDate} shortcuts={[{ label: 'Aujourd’hui', offsetDays: 0 }]}
        error={tried && 'error' in check && check.field === 'date' ? check.error : undefined}/>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Button full onClick={onCancel}>Annuler</Button>
      <Button intent="primary" full onClick={confirm}>{confirmLabel}</Button>
    </div>
  </section>;
};
