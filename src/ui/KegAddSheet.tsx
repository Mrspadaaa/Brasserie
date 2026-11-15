import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { KegItem } from '../types';
import { Sheet } from './Sheet';
import { Button } from '../components/ui/Button';
import { Field, FormNav, TextInput } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { creerFuts, lireCapacite, numerosSuivants, resumeNumeros } from '../domain/stock/futsFiche';
import './equipment-compact.css';
import './keg-fiche.css';

interface Props {
  existants: string[];
  today: string;
  onClose: () => void;
  onAdd: (kegs: KegItem[]) => void;
}

type Capacite = '20' | '30' | '50' | 'autre';
const MAX = 20;

/**
 * Ajouter des fûts (le bouton rond « + », 15.11) : une capacité, un nombre, des numéros donnés à la suite du parc.
 * La capacité « Autre » se saisit en texte (jamais type="number" : saisie-mobile).
 */
export const KegAddSheet: React.FC<Props> = ({ existants, today, onClose, onAdd }) => {
  const [cap, setCap] = useState<Capacite>('30');
  const [autre, setAutre] = useState('');
  const [combien, setCombien] = useState(1);
  const [note, setNote] = useState('');

  const capacityL = cap === 'autre' ? lireCapacite(autre) : Number(cap);
  const numeros = useMemo(() => numerosSuivants(existants, combien), [existants, combien]);
  const ok = capacityL !== undefined;
  const valider = () => { if (ok) { onAdd(creerFuts({ capacityL, combien, existants, date: today, notes: note })); onClose(); } };

  return (
    <Sheet open onClose={onClose} title="Ajouter des fûts" subtitle="Numéros donnés à la suite du parc" className="equipment-sheet"
      footer={<div className="equipment-footer"><Button intent="secondary" onClick={onClose}>Annuler</Button>
        <Button intent="primary" disabled={!ok} onClick={valider}>{combien > 1 ? `Ajouter ${combien} fûts` : 'Ajouter 1 fût'}</Button></div>}>
      <FormNav className="equipment-form" onSubmit={valider}>
        <Field label="Capacité">
          <SegmentedControl label="Capacité des fûts" className="equipment-choice keg-choice" value={cap} onChange={setCap}
            options={[{ value: '20', label: '20 L' }, { value: '30', label: '30 L' }, { value: '50', label: '50 L' }, { value: 'autre', label: 'Autre' }]}/>
        </Field>
        {cap === 'autre' && (
          <Field label="Capacité en litres" htmlFor="keg-add-cap" error={autre.trim() && !ok ? 'Un nombre de litres, de 1 à 200.' : undefined}>
            <TextInput id="keg-add-cap" name="keg_add_capacity" inputMode="decimal" value={autre} onChange={setAutre} placeholder="Ex. 25"/>
          </Field>
        )}
        <Field label="Combien">
          <div className="keg-step">
            <button type="button" aria-label="Un fût de moins" disabled={combien <= 1} onClick={() => setCombien((n) => Math.max(1, n - 1))}><Minus size={14} aria-hidden="true" className="mx-auto"/></button>
            <output aria-live="polite" aria-label="Nombre de fûts">{combien}</output>
            <button type="button" aria-label="Un fût de plus" disabled={combien >= MAX} onClick={() => setCombien((n) => Math.min(MAX, n + 1))}><Plus size={14} aria-hidden="true" className="mx-auto"/></button>
          </div>
        </Field>
        <p className="keg-preview">{resumeNumeros(numeros)} · {combien > 1 ? 'propres' : 'propre'}</p>
        <details className="equipment-disclosure">
          <summary>Note commune <span>· {note.trim() || 'aucune'}</span></summary>
          <Field label="Note sur ces fûts" htmlFor="keg-add-note">
            <TextInput id="keg-add-note" name="keg_add_common_note" value={note} onChange={setNote} placeholder="Joints neufs, achat Landi…"/>
          </Field>
        </details>
      </FormNav>
    </Sheet>
  );
};
