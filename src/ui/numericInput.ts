import React, { useEffect, useRef, useState } from 'react';
import { Units } from '../services/units';

/**
 * La mécanique commune à toute saisie de nombre.
 *
 * Elle vit à part parce que deux composants en dépendent — `NumericField` et
 * `QuantityStepper` — et que la faire diverger, c'est réintroduire d'un côté le
 * bug qu'on a corrigé de l'autre.
 */

/** Espaces séparateurs de milliers, y compris insécable et fin (\s les couvre tous). */
const SPACES = /\s/g;
/** Apostrophes séparatrices de milliers : droite (clavier, « 12'345 ») et typographique (clavier iPhone suisse, « 12’345 »), modificateur ʼ. */
const APOSTROPHES = /['’ʼ]/g;

/**
 * Texte saisi ➔ nombre et nombre de décimales tapées. `null` si ce n'est pas un nombre lisible.
 *
 * État de l'art (L29, 23.11, L-36 et L-38 du Carnet) : lire un nombre dont les séparateurs dépendent du clavier, pas d'une locale fixe
 * (Gboard envoie « . », le clavier iPhone romand « , » et « ’ », un collage anglais « 12,345.67 »). Les analyseurs de locale
 * (CLDR / ICU, `@internationalized/number`) lisent UNE locale à la fois et ne départagent pas ce mélange ; on applique donc la règle
 * usuelle des tableurs et des lecteurs de montants : espaces et apostrophes groupent toujours les milliers ; avec virgule ET point, le
 * DERNIER des deux est la décimale et l'autre groupe ; un séparateur répété groupe ; un seul « , » ou « . » est la décimale (« 12,5 »,
 * « 1.234 » restent ce qu'ils étaient). Tout groupement se vérifie par trois chiffres (« 1'23 », « 1,2,3 » : refusés, jamais devinés).
 */
export function lireDecimal(input: string): { valeur: number; decimales: number } | null {
  let t = input.replace(SPACES, '');
  const negatif = t.startsWith('-');
  if (negatif) t = t.slice(1);
  t = t.replace(APOSTROPHES, "'");
  if (!/^[\d',.]*$/.test(t)) return null;
  const virgules = t.split(',').length - 1, points = t.split('.').length - 1;
  const decimale = virgules && points ? (t.lastIndexOf(',') > t.lastIndexOf('.') ? ',' : '.')
    : virgules === 1 && !points ? ',' : points === 1 && !virgules ? '.' : null;
  const i = decimale ? t.lastIndexOf(decimale) : -1;
  const entier = i < 0 ? t : t.slice(0, i), fraction = i < 0 ? '' : t.slice(i + 1);
  if (!/^\d*$/.test(fraction)) return null;
  // Le groupement des milliers : un seul genre de séparateur (apostrophe, ou le séparateur qui n'est pas la décimale), par trois chiffres.
  if (/[',.]/.test(entier)) {
    const genres = new Set(entier.replace(/\d/g, ''));
    if (genres.size !== 1 || !/^\d{1,3}(?:[',.]\d{3})+$/.test(entier)) return null;
  }
  const chiffres = entier.replace(/[',.]/g, '');
  if (chiffres === '' && fraction === '') return null;
  const n = Number(`${negatif ? '-' : ''}${chiffres || '0'}.${fraction || '0'}`);
  return Number.isFinite(n) ? { valeur: n, decimales: fraction.length } : null;
}

/**
 * Texte saisi ➔ nombre. `null` si ce n'est pas un nombre lisible (règles de `lireDecimal`).
 *
 * ⚠️ Accepte la virgule ET le point. C'est le nœud du problème : sur un clavier
 * de téléphone configuré en français, la touche décimale envoie une virgule,
 * que `<input type="number">` rejette en renvoyant une chaîne VIDE. Combiné aux
 * gestionnaires écrits `parseFloat(v) || 0`, saisir « 12,50 » enregistrait 0.
 */
export function parseDecimal(input: string): number | null {
  return lireDecimal(input)?.valeur ?? null;
}

/** Les décimales tapées, lues comme `lireDecimal` (« 12,345.67 » : 2, pas 3) ; 0 si le texte n'est pas un nombre. */
export const decimalesSaisies = (input: string): number => lireDecimal(input)?.decimales ?? 0;

/** Ce que dit un texte tapé avec une unité (« 0,1 kg ») dans un champ qui a la sienne (« g »). */
export type LectureUnite =
  | { genre: 'valeur'; valeur: number; converti: boolean; saisi: string }
  | { genre: 'attente' }
  | { genre: 'refus'; message: string };

// Débuts d'unités de masse et de volume : « k », « kil » ou « m » en cours de frappe attendent la suite au lieu d'être refusés.
const UNITES_LUES = ['kg', 'mg', 'ml', 'cl', 'dl', 'kilo', 'kilogramme', 'kilogrammes', 'gramme', 'grammes', 'milligramme', 'litre', 'litres', 'millilitre', 'centilitre', 'decilitre', 'lb', 'oz', 'gal'];
const arrondi6 = (x: number) => Math.round(x * 1e6) / 1e6;

/**
 * BR-6 (08.11) : « 0,1 kg » tapé dans un champ en g devenait 0,1 g en silence (IBU 60 → 0). Le texte tapé est lu AVEC son unité :
 * une unité de la même famille est convertie (kg → ×1000), une autre famille ou un texte illisible est refusé (message), jamais deviné.
 * `null` : rien à lire de plus (aucune lettre, ou champ sans unité de masse ni de volume) : la lecture ordinaire de `parseDecimal` s'applique.
 */
export function lireAvecUnite(input: string, unite: string): LectureUnite | null {
  if (!unite || Units.familyOf(unite) === 'piece') return null;
  const brut = input.trim();
  const i = brut.search(/[A-Za-zµ]/);
  if (i < 0) return null;
  const nombre = parseDecimal(brut.slice(0, i));
  if (nombre === null) return { genre: 'refus', message: `« ${brut} » : pas un nombre.` };
  const suffixe = brut.slice(i).trim();
  const converti = Units.convert(nombre, suffixe, unite);
  if (converti !== null) {
    const memeUnite = Units.convert(1, suffixe, unite) === 1;
    return { genre: 'valeur', valeur: arrondi6(converti), converti: !memeUnite, saisi: `${formatDecimal(nombre)} ${suffixe}` };
  }
  const connue = Units.familyOf(suffixe) !== 'piece';
  const bas = suffixe.toLowerCase();
  // Une unité complète d'une autre famille (« L » dans un champ en g) est refusée tout de suite ; seul un début d'unité attend.
  if (!connue && UNITES_LUES.some(u => u.length > bas.length && u.startsWith(bas))) return { genre: 'attente' };
  return { genre: 'refus', message: `« ${formatDecimal(nombre)} ${suffixe} » : ${connue ? 'ce champ est en' : 'unité non reconnue, ce champ est en'} ${unite}.` };
}

/** Nombre ➔ texte affiché, séparateur décimal suisse romand. */
export function formatDecimal(n: number | null | undefined, fractionDigits?: number): string {
  // `fractionDigits` (facultatif) : affichage hors frappe d'un montant (« 86,50 ») ; sans lui, l'affichage est inchangé.
  if (fractionDigits !== undefined && n !== null && n !== undefined && Number.isFinite(n)) return n.toFixed(fractionDigits).replace('.', ',');
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
  /** Décimales affichées hors frappe (un montant : 2). Absent : affichage inchangé. */
  fractionDigits?: number;
  /** L'unité du champ (« g », « kg », « L »…) : un nombre tapé avec une unité de la même famille est converti, une autre est refusée avec un message (BR-6). */
  unite?: string;
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
  const digits = options.fractionDigits;
  const unite = options.unite;
  const [draft, setDraft] = useState(() => formatDecimal(value, digits));
  /** Ce que dit le champ de la dernière saisie lue avec son unité (« 0,1 kg lu comme 100 g. » ou un refus) ; effacé à la frappe suivante. */
  const [avis, setAvis] = useState<string | null>(null);
  /** La valeur du champ avant la saisie en cours : ce que reprend un refus (le « 0,1 » du début de frappe est déjà parti au parent). */
  const base = useRef<number | undefined>(value);

  /*
   * Dernière valeur QUE L'ON A REMONTÉE. Elle distingue un changement venu du
   * parent — qu'il faut refléter — d'un aller-retour de notre propre frappe,
   * qui écraserait la saisie en cours.
   */
  const emitted = useRef<number | undefined>(value);

  /*
   * ⚠️ Pendant la frappe, le parent qui BORNE la valeur reçue ne réécrit plus le champ (BR-80, 08.11). « 99999 » tapé dans un champ dont le
   * parent plafonne à 1000 : la frappe « 9 » à « 9999 » passait, « 99999 » revenait « 1000 » dans le champ, et le « 9 » suivant donnait
   * « 10009 ». La chaîne tapée reste la vérité tant que le champ a le focus ; à la sortie, le champ relit la valeur que le parent a retenue
   * (`onFocusChange(false)`), donc ce qu'on lit est ce qui est gardé. Un champ qui n'appelle pas `onFocusChange` garde l'ancien comportement.
   */
  const focused = useRef(false);
  const [leaves, setLeaves] = useState(0);
  const onFocusChange = (isFocused: boolean) => {
    const wasFocused = focused.current;
    focused.current = isFocused;
    // Une sortie sans entrée (focus jamais reçu) n'a rien retenu pendant la frappe : rien à relire.
    if (!isFocused && wasFocused) setLeaves(n => n + 1);
  };

  useEffect(() => {
    if (focused.current) return;
    if (!Object.is(value, emitted.current)) {
      emitted.current = value;
      base.current = value;
      setDraft(formatDecimal(value, digits));
    }
  }, [value, leaves]);

  /** Reçoit le texte tapé, remonte le nombre s'il est complet. */
  const push = (next: string) => {
    setDraft(next);
    setAvis(null);

    if (next.trim() === '') {
      if (!Object.is(emitted.current, emptyValue)) {
        emitted.current = emptyValue;
        onChange(emptyValue);
      }
      return;
    }

    if (unite) {
      const lue = lireAvecUnite(next, unite);
      if (lue) {
        // Unité complète : la valeur convertie part tout de suite ; unité en cours ou refusée : on attend la sortie du champ.
        if (lue.genre === 'valeur' && lue.valeur !== emitted.current) { emitted.current = lue.valeur; onChange(lue.valeur); }
        return;
      }
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
    const lue = unite ? lireAvecUnite(draft, unite) : null;
    let parsed = lue?.genre === 'valeur' ? lue.valeur : parseDecimal(draft);
    // BR-6 : avec une unité au champ, un texte qu'on ne sait pas lire n'est jamais repris en silence.
    const illisible = unite && draft.trim() !== '' && (lue ? lue.genre !== 'valeur' : parsed === null);
    if (illisible) {
      const raison = lue?.genre === 'refus' ? lue.message : `« ${draft.trim()} » : ${lue ? 'unité à finir de taper' : 'pas un nombre'}.`;
      const avant = base.current;
      const gardee = avant === undefined || !Number.isFinite(avant) ? 'Le champ reste vide.' : `La valeur précédente (${formatDecimal(avant)} ${unite}) est conservée.`;
      setAvis(`${raison} ${gardee}`);
      revert(avant);
      return avant;
    }
    if (parsed === null) {
      setDraft(formatDecimal(emitted.current, digits));
      return emitted.current;
    }
    let next = parsed;
    if (bounds.integer) next = Math.round(next);
    if (bounds.min !== undefined) next = Math.max(bounds.min, next);
    if (bounds.max !== undefined) next = Math.min(bounds.max, next);
    setDraft(formatDecimal(next, digits));
    setAvis(lue?.genre === 'valeur' && lue.converti ? `${lue.saisi} lu comme ${formatDecimal(next)} ${unite}.` : null);
    base.current = next;
    if (next !== emitted.current) {
      emitted.current = next;
      onChange(next);
    }
    return next;
  };

  /** Une saisie refusée (hors bornes) : le champ reprend la valeur d'avant, et le parent aussi (rien d'autre n'a été retenu). */
  const revert = (to: number | undefined) => {
    setDraft(formatDecimal(to, digits));
    if (!Object.is(emitted.current, to)) {
      emitted.current = to;
      onChange(to);
    }
  };

  return { draft, push, settle, revert, onFocusChange, avis };
}

/**
 * La phrase d'un refus (comme VI-9, SaltDoseControl) : ce qui est refusé, pourquoi, et la valeur que le champ garde vraiment.
 * « −5 min : une valeur négative n'existe pas ici. La valeur précédente (10 min) est conservée. »
 */
export function messageRefus(saisi: number, avant: number | undefined, bornes: { min?: number; max?: number; unite?: string }): string {
  const u = bornes.unite ? ` ${bornes.unite}` : '';
  // Les milliers se séparent d'une espace insécable (« 10 000 »), la décimale d'une virgule.
  // Arrondi au millième : une valeur calculée (4,19672131147541 L/kg) ne se dit pas à quatorze décimales.
  const nb = (x: number) => formatDecimal(Math.round(x * 1000) / 1000).replace(/^(-?\d+)/, (entier) => entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
  const raison = bornes.min !== undefined && saisi < bornes.min
    ? (bornes.min === 0 ? 'une valeur négative n’existe pas ici' : `en dessous de ${nb(bornes.min)}${u}`)
    : `au-delà de ${nb(bornes.max ?? 0)}${u}`;
  // BE-98 (rejeu 649bcc54) : une valeur précédente vide (undefined, null, NaN) ne se dit pas « La valeur précédente ( CHF) » : le champ reste vide.
  const gardee = avant === undefined || avant === null || !Number.isFinite(avant) ? 'Le champ reste vide.' : `La valeur précédente (${nb(avant)}${u}) est conservée.`;
  return `${nb(saisi)}${u} : ${raison}. ${gardee}`;
}

/** Pourquoi une valeur est hors bornes, sans parler de valeur gardée : « 99 999 CHF : au-delà de 10 000 CHF. » (BE-98 : le message d'enregistrement). */
export function raisonHorsBornes(saisi: number, bornes: { min?: number; max?: number; unite?: string }): string {
  return messageRefus(saisi, undefined, bornes).replace(/ Le champ reste vide\.$/, '');
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
