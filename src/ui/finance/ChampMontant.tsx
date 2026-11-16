// Un montant de Finances à l'affichage de la maquette : « 3 250,00 », « 1 800 » (espace insécable entre les milliers, virgule décimale) quand le champ est au repos,
// le nombre brut « 3250,5 » pendant la frappe. Même lecture que `ChampNombre` (virgule ou point, espaces ignorés) et mêmes refus visibles : négatif, illisible, plafond, trop de décimales.
// Le champ de l'app (`ChampNombre`, `NumberInput`) n'affiche pas les milliers ; on ne le change pas pour tous les écrans (t1, problème 4).
import React, { useId, useRef, useState } from 'react';
import { Input } from '../Input';
import { formatDecimal, parseDecimal } from '../numericInput';

type Refus = 'negatif' | 'plafond' | 'illisible' | 'decimales' | null;

/** « 1 800,00 » : espace insécable pleine entre les milliers (la même que `montant` de Prévisions), virgule décimale ; `fractionDigits` absent : les décimales utiles seulement. */
export function montantGroupe(n: number | null | undefined, fractionDigits?: number): string {
  if (n == null || !Number.isFinite(n)) return '';
  const [entier, decimales] = formatDecimal(Math.abs(n), fractionDigits).split(',');
  return `${n < 0 ? '−' : ''}${entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${decimales !== undefined ? `,${decimales}` : ''}`;
}

export interface ChampMontantProps {
  value: number | undefined; onValue: (next: number | undefined) => void; max: number; fractionDigits?: number;
  /** Au plus ce nombre de décimales saisies (un montant en francs : 2). Au-delà : refus visible. */
  maxDecimales?: number; className?: string; placeholder?: string; 'aria-label'?: string; id?: string;
  /** Le refus se dit aussi en texte (role="alert"). */
  dire?: boolean;
  /** Grandeur entière (litres par an) : la saisie est arrondie à la sortie du champ. */
  integer?: boolean;
  /** Vider le champ remonte `undefined` (« non renseigné », jamais 0). `min` : ramène une valeur trop basse à la sortie du champ. */
  min?: number;
  /** Un solde peut être négatif (découvert) : le signe moins est lu, pas refusé. */
  negatif?: boolean;
}

export const ChampMontant: React.FC<ChampMontantProps> = ({ value, onValue, max, fractionDigits, maxDecimales, className = '', placeholder, 'aria-label': ariaLabel, id, dire = false, integer = false, min, negatif = false }) => {
  const [texte, setTexte] = useState<string | null>(null);
  const [refus, setRefus] = useState<Refus>(null);
  const debut = useRef<number | undefined>(value);
  const [dit, setDit] = useState<string | null>(null);
  const idDit = useId();
  const phrase = (r: Exclude<Refus, null>, t: string) => {
    const raison = r === 'negatif' ? 'une valeur négative n’existe pas ici' : r === 'illisible' ? 'ce n’est pas un nombre' : r === 'plafond' ? `au plus ${montantGroupe(max)}` : `au plus ${maxDecimales} décimales`;
    const avant = debut.current;
    return `« ${t.trim()} » : ${raison}. ${avant === undefined ? 'Le champ reste vide.' : `La valeur précédente (${montantGroupe(avant, fractionDigits)}) est conservée.`}`;
  };
  const refuser = (r: Exclude<Refus, null>, t: string) => { setRefus(r); if (dire) setDit(phrase(r, t)); };
  const affiche = texte ?? montantGroupe(value, fractionDigits);
  const motif = refus === 'negatif' ? 'Pas de valeur négative' : refus === 'illisible' ? 'Pas un nombre' : refus === 'plafond' ? `Au plus ${montantGroupe(max)}` : refus === 'decimales' ? `Au plus ${maxDecimales} décimales` : undefined;
  return <>
    <Input
      id={id} aria-label={ariaLabel} aria-invalid={refus || dit ? true : undefined} aria-describedby={dit ? idDit : undefined} title={motif} data-dp-refus={refus ?? undefined}
      type="text" inputMode={integer ? 'numeric' : 'decimal'} enterKeyHint="next" autoComplete="off" autoCorrect="off" spellCheck={false}
      data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
      placeholder={placeholder} value={affiche} className={`${className}${refus ? ' !border-solid !border-alert !text-alert' : ''}`}
      // Au toucher le champ montre le nombre brut, prêt à retaper (« 3250,5 »), sans les espaces des milliers.
      onFocus={e => { debut.current = value; setDit(null); setTexte(value == null ? '' : formatDecimal(value, fractionDigits)); const champ = e.currentTarget; requestAnimationFrame(() => champ.select?.()); }}
      onChange={e => {
        const t = e.target.value;
        setTexte(t);
        if (t.trim() === '') { setRefus(null); if (value !== undefined) onValue(undefined); return; }
        if (!negatif && /^\s*[-−–]/.test(t)) { refuser('negatif', t); return; }
        const n = parseDecimal(t.replace(/^(\s*)[−–]/, '$1-'));
        if (n === null) { if (/[^\d\s.,]/.test(t.replace(/^\s*[-−–]/, ''))) refuser('illisible', t); else setRefus(null); return; }
        if (maxDecimales !== undefined && (t.trim().replace(',', '.').split('.')[1] ?? '').length > maxDecimales) { refuser('decimales', t); return; }
        if (n > max) { refuser('plafond', t); return; }
        setRefus(null); setDit(null);
        const retenu = integer ? Math.round(n) : n;
        if (retenu !== value) onValue(retenu);
      }}
      // Un refus rend la valeur d'avant la frappe ; un minimum non atteint ramène à ce minimum.
      onBlur={() => {
        if (refus && !Object.is(value, debut.current)) onValue(debut.current);
        else if (min !== undefined && value !== undefined && value < min) onValue(min);
        setTexte(null); setRefus(null);
      }}
    />
    {dit && <span id={idDit} role="alert" className="block text-xs text-alert leading-snug">{dit}</span>}
  </>;
};
