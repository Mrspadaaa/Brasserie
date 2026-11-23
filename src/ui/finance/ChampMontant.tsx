// Un montant de Finances à l'affichage de la maquette : « 3 250,00 », « 1 800 » (espace insécable entre les milliers, virgule décimale) quand le champ est au repos,
// le nombre brut « 3250,5 » pendant la frappe. Même lecture que `ChampNombre` (virgule ou point, espaces ignorés) et mêmes refus visibles : négatif, illisible, plafond, trop de décimales.
// Le champ de l'app (`ChampNombre`, `NumberInput`) n'affiche pas les milliers ; on ne le change pas pour tous les écrans (t1, problème 4).
import React, { useEffect, useId, useRef, useState } from 'react';
import { Input, type ActionEntree } from '../Input';
import { decimalesSaisies, formatDecimal, parseDecimal } from '../numericInput';

type Refus = 'negatif' | 'plafond' | 'illisible' | 'decimales' | null;

const CHAMPS_TEXTE = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([disabled]), textarea:not([disabled]), select:not([disabled])';

/** F-ENTREE (PI-2) : Entrée prend le champ de saisie suivant de la même feuille ou du même formulaire (celui que « suivant » annonce) ; sans suivant, le clavier se ferme. */
const champSuivant: ActionEntree = (champ) => {
  const racine: ParentNode = champ.closest('[role=dialog], form') ?? document;
  const suivant = [...racine.querySelectorAll<HTMLElement>(CHAMPS_TEXTE)]
    .find(e => (champ.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 && e.getClientRects().length > 0);
  if (suivant) suivant.focus(); else champ.blur();
};

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
  /** Ce que fait Entrée (valider la feuille). Par défaut : le champ de saisie suivant, ou fermer le clavier s'il n'y en a pas. */
  onEntree?: ActionEntree;
}

export const ChampMontant: React.FC<ChampMontantProps> = ({ value, onValue, max, fractionDigits, maxDecimales, className = '', placeholder, 'aria-label': ariaLabel, id, dire = false, integer = false, min, negatif = false, onEntree }) => {
  const [texte, setTexte] = useState<string | null>(null);
  const [refus, setRefus] = useState<Refus>(null);
  const debut = useRef<number | undefined>(value);
  const enFocus = useRef(false);
  const retard = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(retard.current), []);
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
      type="text" inputMode={integer ? 'numeric' : 'decimal'} enterKeyHint={onEntree ? 'done' : 'next'} onEntree={onEntree ?? champSuivant} autoComplete="off" autoCorrect="off" spellCheck={false}
      data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
      placeholder={placeholder} value={affiche} className={`${className}${refus ? ' !border-solid !border-alert !text-alert' : ''}`}
      // Au toucher le champ montre le nombre brut, prêt à retaper (« 3250,5 »), sans les espaces des milliers.
      onFocus={e => { enFocus.current = true; window.clearTimeout(retard.current); debut.current = value; setDit(null); setTexte(value == null ? '' : formatDecimal(value, fractionDigits)); const champ = e.currentTarget; requestAnimationFrame(() => champ.select?.()); }}
      onChange={e => {
        const t = e.target.value;
        setTexte(t);
        if (t.trim() === '') { setRefus(null); if (value !== undefined) onValue(undefined); return; }
        if (!negatif && /^\s*[-−–]/.test(t)) { refuser('negatif', t); return; }
        const n = parseDecimal(t.replace(/^(\s*)[−–]/, '$1-'));
        if (n === null) { if (/[^\d\s.,'’ʼ]/.test(t.replace(/^\s*[-−–]/, ''))) refuser('illisible', t); else setRefus(null); return; }
        if (maxDecimales !== undefined && decimalesSaisies(t) > maxDecimales) { refuser('decimales', t); return; }
        if (n > max) { refuser('plafond', t); return; }
        setRefus(null); setDit(null);
        const retenu = integer ? Math.round(n) : n;
        if (retenu !== value) onValue(retenu);
      }}
      // Un refus rend la valeur d'avant la frappe ; un minimum non atteint ramène à ce minimum.
      onBlur={() => {
        // L-36 : un texte resté illisible à la sortie (« 12’34,5 ») ne garde jamais le morceau lu en route : refusé, la valeur d'avant revient.
        const illisible = !refus && texte !== null && texte.trim() !== '' && parseDecimal(texte.replace(/^(\s*)[−–]/, '$1-')) === null;
        if (illisible) refuser('illisible', texte!);
        if ((refus || illisible) && !Object.is(value, debut.current)) onValue(debut.current);
        else if (min !== undefined && value !== undefined && value < min) onValue(min);
        setRefus(null);
        // CHE-3 : « 1000 » devient « 1 000 » : le texte du champ change DANS l'événement de sortie, pendant que le doigt prend déjà le champ voisin.
        // Le piège du focus (Radix) voit alors le focus sur rien et un nœud remplacé, le rend à la feuille : le premier toucher sur Nom est perdu.
        // Le texte au repos se redessine donc après l'événement, une fois le focus arrivé (sauf si le champ a été repris entre-temps).
        enFocus.current = false;
        window.clearTimeout(retard.current);
        retard.current = window.setTimeout(() => { if (!enFocus.current) setTexte(null); }, 0);
      }}
    />
    {dit && <span id={idDit} role="alert" className="block text-xs text-alert leading-snug">{dit}</span>}
  </>;
};
