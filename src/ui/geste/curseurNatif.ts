import { useCallback, useEffect, useRef, type MutableRefObject, type Ref } from 'react';
import { arrondir, borner, suivreDeplacement } from './moteur';
import { attacherGlisse, type RappelsGlisse } from './useGlisse';

/**
 * Un `<input type="range">` de l'app porté au geste de la frise B (réglage quantité : R1, R2, R8, R10, R12, R13) sans toucher à son dessin :
 * le doigt ne fait plus sauter la valeur à l'endroit touché, la valeur suit le déplacement depuis la saisie, un toucher ne change rien,
 * Échap ou pointercancel rend la valeur d'avant. Le clavier reste celui du natif (flèches, Pg préc./suiv.).
 * La valeur passe par `onChange` de React comme un geste natif (setter natif + évènement `input`) : l'écran n'a rien à changer.
 * L'échelle d'un curseur natif est son `max` : l'extension vers le haut (R7) reste aux curseurs dessinés (malt, voir `Ligne.tsx`).
 */
const pose = (el: HTMLInputElement, v: number) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  const txt = String(v);
  if (el.value === txt) return;
  if (setter) setter.call(el, txt); else el.value = txt;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};

interface SaisieNative { v0: number; parPx: number; min: number; max: number; pas?: number }

export function rappelsNatif(el: HTMLInputElement): RappelsGlisse<SaisieNative> {
  return {
    saisir: () => {
      if (el.disabled) return null;
      const min = Number(el.min || 0), max = Number(el.max || 100), w = el.getBoundingClientRect().width;
      if (!(w > 0) || !(max > min)) return null;
      const pas = el.step === 'any' || !el.step ? undefined : Number(el.step);
      return { v0: Number(el.value), parPx: (max - min) / w, min, max, pas };
    },
    suivre: (dx, s) => pose(el, borner(arrondir(suivreDeplacement(s.v0, dx, s.parPx), s.pas, s.min), s.min, s.max)),
    annuler: (s) => pose(el, s.v0),
  };
}

/** Hors React : branche le geste sur un input existant ; rend la fonction qui le retire. */
export const attacherCurseurNatif = (el: HTMLInputElement): (() => void) => attacherGlisse(el, () => rappelsNatif(el), { natif: true });

/**
 * Le hook : `<input type="range" ref={useCurseurNatif()} … />`. Rend une `ref` (callback) ; `autre` reçoit aussi l'élément
 * quand l'écran a déjà sa propre ref.
 */
export function useCurseurNatif(autre?: Ref<HTMLInputElement>): (el: HTMLInputElement | null) => void {
  const retirer = useRef<(() => void) | null>(null);
  const autreRef = useRef(autre);
  autreRef.current = autre;
  useEffect(() => () => { retirer.current?.(); retirer.current = null; }, []);
  return useCallback((el: HTMLInputElement | null) => {
    retirer.current?.(); retirer.current = null;
    if (el) retirer.current = attacherCurseurNatif(el);
    const a = autreRef.current;
    if (typeof a === 'function') a(el); else if (a) (a as MutableRefObject<HTMLInputElement | null>).current = el;
  }, []);
}
