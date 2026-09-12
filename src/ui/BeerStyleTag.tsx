import React from 'react';

/**
 * La pastille de style d'une bière.
 *
 * Son rôle est de DISTINGUER des styles dans une liste d'un coup d'œil — pas de
 * peindre la couleur du moût. C'est pour ça qu'elle n'utilise pas l'échelle
 * `ebc-*` : cette échelle décrit la teinte d'une bière finie, et elle écraserait
 * justement les distinctions utiles ici — une NEIPA et une saison tomberaient
 * toutes deux dans « or ». Une palette CATÉGORIELLE répond à la question qu'on
 * se pose en parcourant le catalogue : « laquelle est-ce ? »
 *
 * ⚠️ CE QUI A ÉTÉ MESURÉ, ET POURQUOI LES TEINTES ONT CHANGÉ.
 *
 * Les huit familles d'origine étaient posées en `bg-X-400/15`. À 15 % sur
 * `cave-900`, l'écart perceptuel (ΔE, CIE-Lab) entre pastilles tombait très bas :
 *
 *     ambrée / pils        ΔE  5.0   quasi identiques
 *     saison / ambrée      ΔE  5.7   quasi identiques
 *     blanche / inconnu    ΔE  8.2   confusables
 *     saison / pils        ΔE  9.8   confusables
 *     stout / inconnu      ΔE  9.8   confusables
 *
 * En dessous de ΔE 10 on ne distingue pas deux pastilles d'un coup d'œil ; en
 * dessous de 5, pas du tout. Les trois familles chaudes — saison 27°,
 * ambrée 38°, pils 48° — tenaient sur 21 degrés de teinte : à l'écran elles ne
 * formaient qu'une seule couleur.
 *
 * Deux corrections, et il fallait les deux :
 *
 *   · L'aplat passe de 15 % à 40 %. Plus franc, et l'écart double à lui seul.
 *   · Les teintes sont réparties sur toute la roue. Le choix n'est pas fait à
 *     l'œil : pour chaque nombre de paliers, un glouton a cherché le jeu qui
 *     MAXIMISE le plus petit écart. Au-delà de 12 paliers la roue sature et les
 *     familles redeviennent confusables (ΔE 8.7 à 13 paliers).
 *
 * Résultat : 11 familles au lieu de 8, ΔE minimum **12.3** au lieu de 5.0, et
 * chaque texte tient AA (le pire vaut 5.29:1).
 *
 * Le nom de style saisi par le brasseur est TOUJOURS affiché tel quel : la
 * famille ne sert qu'à choisir la teinte, jamais à réécrire son vocabulaire.
 */

/**
 * ⚠️ L'ORDRE EST SIGNIFIANT — le premier motif qui accroche gagne.
 *
 * Les styles composés passent avant les styles simples : une « black IPA » est
 * une bière houblonnée, pas une noire, donc les motifs houblonnés passent avant
 * les sombres. « NEIPA » a son propre motif parce que `\bipa\b` ne l'accroche
 * pas — il n'y a pas de frontière de mot au milieu du mot.
 */
const FAMILLES: Array<{ motif: RegExp; teinte: string }> = [
  // — Houblonnées —————————————————————————————————————————
  { motif: /neipa|hazy|juicy|troubl|new england/, teinte: 'lime' },
  { motif: /\bipa\b|i\.p\.a|india pale|west coast|\bdipa\b/, teinte: 'teal' },
  { motif: /pale ale|\bapa\b|bitter|\besb\b|hoppy|houblon/, teinte: 'green' },

  // — Sombres —————————————————————————————————————————————
  { motif: /stout|imperial|schwarz|noire|\bblack\b/, teinte: 'violet' },
  // `\balt\b` ratait « Altbier », soudé en un mot : la frontière n'existe qu'avant.
  { motif: /porter|brune|brown|dunkel|\balt(?:bier)?\b|mild/, teinte: 'fuchsia' },

  // — Belges ——————————————————————————————————————————————
  { motif: /tripel|triple|dubbel|quadrupel|\bquad\b|abbaye|trappist|belg/, teinte: 'blue' },
  { motif: /saison|farmhouse|grisette|biere de garde/, teinte: 'orange' },

  // — Acidulées, PUIS blanches ————————————————————————————
  //
  // ⚠️ L'acidité passe avant le froment, et pas l'inverse. Une Berliner Weisse
  // et une gose sont des bières de BLÉ acidulées : classées sur le froment,
  // elles rejoignaient la witbier alors que ce qui les distingue en bouche —
  // et dans la conduite de fermentation — c'est l'acidité.
  { motif: /sour|gose|lambic|gueuze|kriek|berliner|acidul|fruit/, teinte: 'pink' },
  { motif: /\bwit\b|witbier|weiz|weiss|hefe|wheat|blanche|\bble\b/, teinte: 'cyan' },

  // — Ambrées et pâles ————————————————————————————————————
  { motif: /amber|ambree|red ale|rousse|\bbock\b|marzen|vienn|oktober/, teinte: 'red' },
  { motif: /pils|lager|helles|blond|kolsch|\bgold\b|cream ale/, teinte: 'yellow' }
];

/**
 * Aplat à 40 %, texte au degré 200, bord au degré 300.
 *
 * ⚠️ Écrit en toutes lettres, jamais assemblé à la volée. Tailwind ne génère que
 * les classes qu'il TROUVE dans les sources : une classe construite par
 * `` `bg-${teinte}-400/40` `` n'existerait pas dans le bundle, la règle serait
 * muette et la pastille prendrait la couleur de son parent. C'est exactement le
 * piège des 380 classes de couleur mortes corrigées ailleurs dans l'application.
 */
const TEINTES: Record<string, string> = {
  red: 'bg-red-400/40 text-red-200 border-red-300/40',
  orange: 'bg-orange-400/40 text-orange-200 border-orange-300/40',
  yellow: 'bg-yellow-400/40 text-yellow-200 border-yellow-300/40',
  lime: 'bg-lime-400/40 text-lime-200 border-lime-300/40',
  green: 'bg-green-400/40 text-green-200 border-green-300/40',
  teal: 'bg-teal-400/40 text-teal-200 border-teal-300/40',
  cyan: 'bg-cyan-400/40 text-cyan-200 border-cyan-300/40',
  blue: 'bg-blue-400/40 text-blue-200 border-blue-300/40',
  violet: 'bg-violet-400/40 text-violet-200 border-violet-300/40',
  fuchsia: 'bg-fuchsia-400/40 text-fuchsia-200 border-fuchsia-300/40',
  pink: 'bg-pink-400/40 text-pink-200 border-pink-300/40'
};

/**
 * Un style qu'on ne reconnaît pas ne reçoit pas une teinte au hasard.
 *
 * Le neutre est `cave-700`, le gris CHAUD du système — et non le `slate` de
 * Tailwind, qui est un gris BLEU : à 215° il se confondait avec la blanche
 * (198°), mesuré à ΔE 8.2.
 */
const INCONNU = 'bg-cave-700 text-cave-200 border-cave-600';

/** La famille visuelle d'un style, ou `null` si aucun motif ne l'accroche. */
export function familleDuStyle(style: string): string | null {
  const nom = style
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  return FAMILLES.find((f) => f.motif.test(nom))?.teinte ?? null;
}

export function BeerStyleTag({ style }: { style?: string }) {
  const label = style?.trim() || 'Style à préciser';
  const famille = style?.trim() ? familleDuStyle(label) : null;

  return (
    <span
      title={label}
      className={`inline-block max-w-full truncate align-middle rounded-control border px-2
                  text-sm font-medium leading-5 ${famille ? TEINTES[famille] : INCONNU}`}
    >
      {label}
    </span>
  );
}
