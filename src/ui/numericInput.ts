import React, { useEffect, useRef, useState } from 'react';

/**
 * La mécanique commune à toute saisie de nombre.
 *
 * Elle vit à part parce que deux composants en dépendent — `NumericField` et
 * `QuantityStepper` — et que la faire diverger, c'est réintroduire d'un côté le
 * bug qu'on a corrigé de l'autre.
 */

/** Espaces séparateurs de milliers, y compris insécable et fin. */
const SPACES = /[\s  ']/g;

/**
 * Texte saisi ➔ nombre. `null` si ce n'est pas un nombre lisible.
 *
 * ⚠️ Accepte la virgule ET le point. C'est le nœud du problème : sur un clavier
 * de téléphone configuré en français, la touche décimale envoie une virgule,
 * que `<input type="number">` rejette en renvoyant une chaîne VIDE. Combiné aux
 * gestionnaires écrits `parseFloat(v) || 0`, saisir « 12,50 » enregistrait 0.
 */
export function parseDecimal(input: string): number | null {
  const cleaned = input.replace(SPACES, '').replace(',', '.');
  if (cleaned === '' || cleaned === '.' || cleaned === '-' || cleaned === '-.') return null;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Nombre ➔ texte affiché, séparateur décimal suisse romand. */
export function formatDecimal(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return String(n).replace('.', ',');
}

interface DraftOptions {
  /**
   * Valeur remontée quand le champ est vidé.
   *
   * `undefined` est un choix légitime : sur un champ facultatif — le taux
   * d'atténuation d'une levure, la couleur EBC d'un malt — « vide » veut dire
   * « non renseigné », pas « zéro ». Le confondre avec 0 ferait calculer une
   * densité finale sur une atténuation nulle.
   */
  emptyValue?: number | undefined;
}

/**
 * Garde une CHAÎNE de saisie à côté du nombre du parent.
 *
 * ⚠️ Pourquoi : un champ qui stocke directement un nombre se réaffiche à chaque
 * frappe. Deux conséquences, toutes deux constatées :
 *   - effacer pour retaper faisait retomber la valeur à 0 instantanément,
 *     donc on ne pouvait plus vider un champ pour saisir autre chose ;
 *   - « 12, » était reconverti en « 12 » avant qu'on ait tapé les décimales.
 *
 * La chaîne est la vérité pendant la frappe ; le nombre n'est remonté que
 * lorsqu'il est lisible.
 */
export function useNumericDraft(
  value: number | undefined,
  onChange: (next: any) => void,
  options: DraftOptions = {}
) {
  const emptyValue = 'emptyValue' in options ? options.emptyValue : 0;
  const [draft, setDraft] = useState(() => formatDecimal(value));

  /*
   * Dernière valeur QUE L'ON A REMONTÉE. Elle distingue un changement venu du
   * parent — qu'il faut refléter — d'un aller-retour de notre propre frappe,
   * qui écraserait la saisie en cours.
   */
  const emitted = useRef<number | undefined>(value);

  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setDraft(formatDecimal(value));
    }
  }, [value]);

  /** Reçoit le texte tapé, remonte le nombre s'il est complet. */
  const push = (next: string) => {
    setDraft(next);

    if (next.trim() === '') {
      if (emitted.current !== emptyValue) {
        emitted.current = emptyValue;
        onChange(emptyValue);
      }
      return;
    }

    const parsed = parseDecimal(next);
    // Frappe intermédiaire (« 12, », « - ») : on attend la suite sans rien dire.
    if (parsed === null || parsed === emitted.current) return;
    emitted.current = parsed;
    onChange(parsed);
  };

  /**
   * Bornes et arrondi, appliqués À LA SORTIE du champ seulement.
   *
   * ⚠️ Les appliquer à la frappe rendait certaines valeurs inatteignables : avec
   * un minimum de 10, taper « 15 » remontait « 1 » à 10 avant qu'on ait saisi
   * le « 5 ».
   */
  const settle = (bounds: { min?: number; max?: number; integer?: boolean } = {}) => {
    const parsed = parseDecimal(draft);
    if (parsed === null) {
      setDraft(formatDecimal(emitted.current));
      return emitted.current;
    }
    let next = parsed;
    if (bounds.integer) next = Math.round(next);
    if (bounds.min !== undefined) next = Math.max(bounds.min, next);
    if (bounds.max !== undefined) next = Math.min(bounds.max, next);
    setDraft(formatDecimal(next));
    if (next !== emitted.current) {
      emitted.current = next;
      onChange(next);
    }
    return next;
  };

  return { draft, push, settle };
}

/**
 * Un bouton ± qui se répète à l'appui long.
 *
 * ⚠️ Extrait de `QuantityStepper` après que Gaëtan a signalé, mot pour mot,
 * « les boutons + et − semblent pas bien fonctionner » et « l'appui prolongé ne
 * fonctionne pas bien ». Trois fautes s'y cumulaient, et la grille des sels,
 * qui avait sa propre paire de boutons, les aurait toutes réintroduites en les
 * recopiant. Une seule mécanique, un seul endroit à corriger.
 *
 *   1. **La valeur figée.** L'intervalle capturait la valeur du moment où il
 *      démarrait : chaque tic repartait du même point et réécrivait le même
 *      résultat. Garder le doigt appuyé ne faisait donc plus rien après le
 *      premier pas. D'où `ref`, mise à jour AVANT `onChange` pour que le tic
 *      suivant ne dépende pas du rendu de React.
 *   2. **Le clic en double.** Le `click` de relâchement partait EN PLUS des
 *      tics. On visait 25 et on obtenait 25.5.
 *   3. **Le doigt qui glisse.** `pointerleave` coupait la répétition au moindre
 *      mouvement. La capture du pointeur règle ça.
 */
export function useHoldRepeat(
  value: number,
  onChange: (next: number) => void,
  /** Ce que vaut un pas, et comment arrondir le résultat. */
  apply: (from: number, delta: number) => number
) {
  const valueRef = useRef(value);
  const repeated = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const repeatTimer = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const bump = (delta: number) => {
    const next = apply(valueRef.current, delta);
    valueRef.current = next;
    onChange(next);
  };

  const stop = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (repeatTimer.current) window.clearInterval(repeatTimer.current);
    holdTimer.current = null;
    repeatTimer.current = null;
  };

  useEffect(() => stop, []);

  /** Le geste complet d'un bouton : à étaler sur le `<button>`. */
  const press = (delta: number) => ({
    onClick: () => {
      if (repeated.current) {
        repeated.current = false;
        return;
      }
      bump(delta);
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      stop();
      repeated.current = false;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* Navigateur sans capture : la répétition marche, sans la protection. */
      }
      holdTimer.current = window.setTimeout(() => {
        let ticks = 0;
        repeatTimer.current = window.setInterval(() => {
          ticks += 1;
          repeated.current = true;
          // L'accélération : sans elle, aller de 0 à 20 g demanderait une minute.
          bump(delta * (ticks > 14 ? 10 : ticks > 6 ? 4 : 1));
        }, 90);
      }, 400);
    },
    onPointerUp: stop,
    onPointerCancel: stop
  });

  return press;
}
