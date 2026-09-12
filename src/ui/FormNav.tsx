import React, { useRef, useCallback } from 'react';
import { NumberInput } from './NumberInput';

/**
 * Navigation au clavier dans un formulaire.
 *
 * ⚠️ Ce que ça règle : l'application compte 112 champs de saisie et **aucune**
 * gestion clavier. Sur ordinateur, remplir une réception de marchandise
 * obligeait à attraper la souris entre chaque champ.
 *
 * Comportement, calé sur ce qu'on attend d'un formulaire de saisie :
 *
 *   Entrée          → champ suivant (comme Tab)
 *   Entrée (dernier)→ valide le formulaire
 *   Maj + Entrée    → champ précédent
 *   Ctrl/⌘ + Entrée → valide depuis n'importe où, y compris dans une zone de texte
 *   Échap           → rend le focus sans valider
 *
 * Deux exceptions volontaires :
 *   - dans un `<textarea>`, Entrée insère une ligne (c'est son rôle) ;
 *   - sur un bouton ou une case à cocher, Entrée les active.
 *
 * Tab continue de fonctionner nativement : l'ordre du DOM suit l'ordre visuel,
 * il n'y a donc aucun `tabIndex` à poser.
 */

const FOCUSABLE = [
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]'
].join(',');

export { TextInput, type TextInputProps } from './TextInput';

/** Attributs anti-autocomplétion / anti-Gboard strip universels */
export const noAutofillProps = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  'data-form-type': 'other',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true'
} as const;

interface FormNavProps {
  children: React.ReactNode;
  /** Appelé par Entrée sur le dernier champ, et par Ctrl/⌘+Entrée partout. */
  onSubmit?: () => void;
  className?: string;
}

export const FormNav: React.FC<FormNavProps> = ({ children, onSubmit, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  const fields = useCallback((): HTMLElement[] => {
    if (!ref.current) return [];
    return Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      // Un champ masqué ou replié ne doit pas capter le focus.
      (el) => el.offsetParent !== null || el.getClientRects().length > 0
    );
  }, []);

  const move = useCallback(
    (from: HTMLElement, direction: 1 | -1) => {
      const list = fields();
      const i = list.indexOf(from);
      if (i === -1) return false;

      const next = list[i + direction];
      if (!next) return false;

      next.focus();
      // Sélectionner le contenu permet de retaper directement par-dessus,
      // ce qui est le geste courant sur une valeur déjà renseignée.
      if (next instanceof HTMLInputElement && /text|number|search|tel|email/.test(next.type)) {
        next.select();
      }
      return true;
    },
    [fields]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;

    if (e.key === 'Enter') {
      const isTextarea = target.tagName === 'TEXTAREA';
      const isButton = target.tagName === 'BUTTON' || target.getAttribute('role') === 'button';

      // Ctrl/⌘ + Entrée valide depuis n'importe où, zone de texte comprise.
      if ((e.metaKey || e.ctrlKey) && onSubmit) {
        e.preventDefault();
        onSubmit();
        return;
      }

      // Dans une zone de texte, Entrée insère une ligne. Sur un bouton, il l'active.
      if (isTextarea || isButton) return;

      e.preventDefault();
      const moved = move(target, e.shiftKey ? -1 : 1);
      // Entrée sur le dernier champ vaut validation : c'est ce qu'on attend
      // après avoir rempli la dernière valeur.
      if (!moved && !e.shiftKey && onSubmit) onSubmit();
    }
  };

  return (
    <div ref={ref} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};

/**
 * Champ étiqueté, uniforme dans toute l'application.
 *
 * L'étiquette est liée au champ (`htmlFor`), ce qui la rend cliquable et lisible
 * par les lecteurs d'écran — les 101 `<label>` existants ne l'étaient pas tous.
 */
interface FieldProps {
  label: string;
  /** Précision affichée sous l'étiquette, pour ce qui n'est pas évident. */
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = ''
}) => (
  <div className={`space-y-1 ${className}`}>
    <label htmlFor={htmlFor} className="block text-2xs sm:text-sm text-cave-400 font-medium">
      {label}
    </label>
    {children}
    {hint && !error && <p className="text-2xs text-cave-400 leading-snug">{hint}</p>}
    {error && (
      <p role="alert" className="text-2xs sm:text-sm text-alert leading-snug">
        {error}
      </p>
    )}
  </div>
);

/** Classe commune des champs de saisie — un seul endroit à ajuster. */
export const inputClass =
  'w-full min-h-touch px-3 py-1.5 rounded-control bg-cave-950 border border-cave-700 ' +
  'text-cave-50 text-base placeholder-cave-400 ' +
  'focus:outline-none focus:border-ebc-straw focus:ring-1 focus:ring-ebc-straw/40 ' +
  'transition-colors disabled:opacity-50';

/**
 * Un champ numérique COUCHÉ : l'étiquette à gauche, l'unité à droite.
 *
 * ⚠️ `Field` empile étiquette, champ et indication sur trois lignes. C'est juste
 * pour un formulaire qu'on remplit une fois, ruineux pour les valeurs qui
 * accompagnent un ingrédient — l'alpha d'un houblon, sa durée, sa température.
 * Trois de ces champs occupaient neuf lignes sur une carte qui en mérite une.
 *
 * Couché, on en met trois côte à côte : « α 8.6 % · 20 min · 82 °C » se lit
 * comme une phrase de brasseur et tient sur une ligne de téléphone.
 *
 * L'étiquette courte est visible ; le nom complet reste dans `aria-label`, pour
 * que « α » ne soit pas une énigme au lecteur d'écran.
 */
export const InlineNum: React.FC<{
  /** Ce qui s'affiche à gauche — court, un ou deux caractères de préférence. */
  label: React.ReactNode;
  /** Le nom complet, pour l'accessibilité. */
  name: string;
  unit?: string;
  value: number | undefined;
  onValue: (v: any) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  /** Signale une valeur manquante qui bloque un calcul. */
  missing?: boolean;
  /** Explicit undefined keeps an optional value unknown when cleared. */
  emptyValue?: number | undefined;
}> = ({ label, name, unit, value, onValue, min, max, integer, missing, ...emptyOption }) => (
  <label className="flex items-center gap-1 min-w-0">
    <span className={`text-2xs shrink-0 ${missing ? 'text-ebc-amber' : 'text-cave-400'}`}>
      {label}
    </span>
    <NumberInput
      {...emptyOption}
      aria-label={name}
      value={value}
      onValue={onValue}
      min={min}
      max={max}
      integer={integer}
      pad
      className={`w-14 shrink-0 min-h-touch-sm px-1 rounded-control bg-cave-950 border
                  reading text-2xs text-center text-cave-50 focus:outline-none focus:border-ebc-straw
                  ${missing ? 'border-ebc-amber/60' : 'border-cave-700'}`}
    />
    {unit && <span className="reading-unit text-2xs shrink-0">{unit}</span>}
  </label>
);
