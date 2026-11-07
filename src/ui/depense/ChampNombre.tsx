// Le champ de nombre du plateau (quantité, prix, montant) : le `NumberInput` de l'app, avec en plus deux refus VISIBLES (B2 n° 13).
// Un nombre négatif n'existe pas ici (« −1 » devenait « 0 » en silence) ; au-delà du plafond, la valeur ne part pas (99999999 était acceptée sans borne). Dans les deux cas :
// rien n'est retenu, le champ reste lisible tel que tapé, marqué rouge (`aria-invalid`, bord plein, `title` qui dit pourquoi) ; en quittant le champ, la valeur d'avant revient.
import React, { useRef, useState } from 'react';
import { Input } from '../Input';
import { formatDecimal, parseDecimal } from '../numericInput';

type Refus = 'negatif' | 'plafond' | 'illisible' | null;
export interface ChampNombreProps {
  value: number | undefined; onValue: (next: number | undefined) => void; max: number; fractionDigits?: number; className?: string; placeholder?: string; 'aria-label'?: string; id?: string;
}

export const ChampNombre: React.FC<ChampNombreProps> = ({ value, onValue, max, fractionDigits, className = '', placeholder, 'aria-label': ariaLabel, id }) => {
  const [texte, setTexte] = useState<string | null>(null);
  const [refus, setRefus] = useState<Refus>(null);
  const debut = useRef<number | undefined>(value);
  const affiche = texte ?? formatDecimal(value, fractionDigits);
  const motif = refus === 'negatif' ? 'Pas de valeur négative' : refus === 'illisible' ? 'Pas un nombre' : refus === 'plafond' ? `Au plus ${formatDecimal(max)}` : undefined;
  return <Input
    id={id} aria-label={ariaLabel} aria-invalid={refus ? true : undefined} title={motif} data-dp-refus={refus ?? undefined}
    type="text" inputMode="decimal" enterKeyHint="next" autoComplete="off" autoCorrect="off" spellCheck={false}
    data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
    placeholder={placeholder} value={affiche} className={`${className}${refus ? ' !border-solid !border-alert !text-alert' : ''}`}
    onFocus={e => { debut.current = value; e.currentTarget.select(); }}
    onChange={e => {
      const t = e.target.value;
      setTexte(t);
      if (t.trim() === '') { setRefus(null); if (value !== undefined) onValue(undefined); return; }
      if (/^\s*[-−–]/.test(t)) { setRefus('negatif'); return; }
      const n = parseDecimal(t);
      if (n === null) { setRefus(/[^\d\s.,]/.test(t) ? 'illisible' : null); return; } // « 12, » et « . » : frappe intermédiaire ; « abc » : refusé, visible
      if (n > max) { setRefus('plafond'); return; }
      setRefus(null);
      if (n !== value) onValue(n);
    }}
    // Un refus rend la valeur d'avant la frappe (« 99999999 » a pu retenir « 99999 » en route : elle ne reste pas).
    onBlur={() => { if (refus && !Object.is(value, debut.current)) onValue(debut.current); setTexte(null); setRefus(null); }}
  />;
};
