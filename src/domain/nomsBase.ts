/**
 * La clé d'un nom de base (voie f5c-noms-prod, D280) : module pur, sans React, sans réseau, sans Dexie.
 *
 * `cleBase` est la forme canonique du banc mesuré (`scripts/banc-noms-fr.ts`, `cleBase` et `canonMot` de `scripts/banc-lecture-facture.ts`) :
 * minuscules, accents retirés, espaces réduits. Deux bases qui ne diffèrent que par la casse, les accents ou les espaces sont la même désignation.
 * Un test (`tests/unit/depense/noms-fr/cleBase.test.ts`) prouve l'égalité avec le banc sur des bases de toute langue.
 */

/** Minuscules et sans accent (NFD, marques combinantes U+0300 à U+036F retirées). */
export const canonMot = (mot: string): string => mot.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** La clé d'une base : sa forme canonique, espaces réduits. */
export const cleBase = (base: string): string => canonMot(base).replace(/\s+/g, ' ').trim();

/**
 * Le plus grand nombre de noms de base d'un seul appel : celui des lignes qu'une lecture de facture peut rendre (`SCAN_MAX_ITEMS`, 35).
 * Le plafond de sortie de la tâche `traduireNoms` (`functions/src/prompts.ts`) est celui du banc pour ce nombre (600 + 36 × 35) ;
 * un test égale les deux. Les noms au-delà gardent leur nom imprimé.
 */
export const NOMS_MAX_ENTREES = 35;
