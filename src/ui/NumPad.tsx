import React, { useEffect, useRef } from 'react';
import { Delete, Check } from 'lucide-react';

/**
 * Pavé numérique intégré à la page.
 *
 * ⚠️ Ce que ça règle : le clavier du système mange environ 300 px — sur un
 * iPhone SE, c'est plus de la moitié de l'écran. Une feuille de saisie ouverte
 * ne montre alors plus qu'un champ et demi, et le bouton d'enregistrement passe
 * dessous. Or pour saisir « 25 » ou « 12,50 », on n'a besoin ni des lettres, ni
 * de la barre d'espace, ni de la ligne de suggestions.
 *
 * Ce pavé fait 4 rangées de 48 px, soit ~210 px : on garde le champ ET les
 * champs voisins ET le pied de feuille à l'écran.
 *
 * Il s'affiche EN PLACE, juste sous le champ concerné, plutôt qu'ancré en bas :
 * dans une feuille qui défile, un pavé ancré finit par recouvrir le champ qu'il
 * sert à remplir.
 */

interface NumPadProps {
  /** Valeur courante, telle qu'affichée (virgule comprise). */
  value: string;
  onChange: (next: string) => void;
  /** Fermeture demandée par l'utilisateur. */
  onDone: () => void;
  /** Masque la touche décimale pour les grandeurs entières (jours, minutes). */
  allowDecimal?: boolean;
  /** Nombre de décimales acceptées. Au-delà, la frappe est ignorée. */
  maxDecimals?: number;
}

const KEY_BASE =
  'min-h-touch rounded-control border border-cave-700 bg-cave-850 text-cave-50 ' +
  'font-mono text-xl flex items-center justify-center select-none transition-colors ' +
  'active:bg-cave-800 active:border-ebc-straw';

export const NumPad: React.FC<NumPadProps> = ({
  value,
  onChange,
  onDone,
  allowDecimal = true,
  maxDecimals = 2
}) => {
  const append = (ch: string) => {
    if (ch === ',') {
      if (!allowDecimal || value.includes(',')) return;
      // Taper la virgule sur un champ vide donne « 0, » plutôt que « , » :
      // sinon la valeur reste illisible tant qu'on n'a pas tapé le chiffre.
      onChange(value === '' ? '0,' : `${value},`);
      return;
    }

    const [, decimals = ''] = value.split(',');
    if (value.includes(',') && decimals.length >= maxDecimals) return;

    // Pas de zéro en tête : « 025 » n'a jamais voulu dire autre chose que 25.
    if (value === '0' && ch !== ',') {
      onChange(ch);
      return;
    }
    onChange(value + ch);
  };

  const backspace = () => onChange(value.slice(0, -1));

  /*
   * ⚠️ Se ramener soi-même dans le champ de vision.
   *
   * Le pavé se déplie SOUS le champ. Sur un champ situé en bas d'un formulaire,
   * il naissait donc hors de l'écran : on touchait la valeur et il ne se
   * passait visiblement rien. Le clavier du système, lui, se pose par-dessus la
   * page et n'a jamais ce problème — c'est la contrepartie d'un pavé intégré,
   * et elle se règle ici plutôt que dans chaque appelant.
   *
   * `block: 'end'` amène le BAS du pavé, donc le pavé entier, et pas seulement
   * sa première rangée.
   */
  const selfRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    selfRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, []);

  /*
   * `onPointerDown` avec `preventDefault` : le champ ne doit pas perdre le
   * focus, sinon le curseur disparaît et le pavé se referme à la première
   * touche. C'est sans danger ici — contrairement à une liste, un pavé ne se
   * fait jamais défiler.
   */
  const press = (fn: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      fn();
    }
  });

  const digit = (d: string, className = '') => (
    <button key={d} type="button" aria-label={d} className={`${KEY_BASE} ${className}`} {...press(() => append(d))}>
      {d}
    </button>
  );

  return (
    <div
      ref={selfRef}
      role="group"
      aria-label="Pavé numérique"
      // `scroll-mb-3` : sans marge, `scrollIntoView` colle le pavé au ras du
      // pied de page et la dernière rangée semble tronquée.
      className="grid grid-cols-4 gap-1.5 pt-2 scroll-mb-3"
    >
      {['7', '8', '9'].map((d) => digit(d))}
      <button
        type="button"
        aria-label="Effacer le dernier chiffre"
        className={`${KEY_BASE} text-cave-300`}
        {...press(backspace)}
      >
        <Delete className="w-5 h-5" />
      </button>

      {['4', '5', '6'].map((d) => digit(d))}
      <button
        type="button"
        aria-label="Tout effacer"
        className={`${KEY_BASE} text-sm text-cave-300`}
        {...press(() => onChange(''))}
      >
        C
      </button>

      {['1', '2', '3'].map((d) => digit(d))}
      <button
        type="button"
        aria-label="Valider"
        className={`${KEY_BASE} row-span-2 bg-ebc-straw/15 border-ebc-straw text-ebc-straw`}
        {...press(onDone)}
      >
        <Check className="w-6 h-6" />
      </button>

      <button
        type="button"
        aria-label="Virgule"
        disabled={!allowDecimal}
        className={`${KEY_BASE} disabled:opacity-30`}
        {...press(() => append(','))}
      >
        ,
      </button>
      {digit('0', 'col-span-2')}
    </div>
  );
};
