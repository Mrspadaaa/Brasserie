/**
 * Pictos d'objet du carnet (critique 5, n° 29 et 30 ; figés p2:g05-1, p2:h05-3, p2:h01-6, p2:i06-2, g5:v06-10 ; R01, R04, D-25, D-78).
 * Une photo si l'objet en a une ; sinon **l'objet dessiné**, déduit de ses mots (nom, façon, carnet) : hotte, extracteur, centrifuge,
 * évier, tireuse, frigo, pompe, moulin, remplisseuse, fût, cuve, densimètre, thermomètre, balance, tuyau, chauffe-eau, filtre,
 * échangeur, bouteille de gaz, étagère, diable. Les figés montrent des objets en couleur (métal gris, moteur bleu, bouteilles brunes),
 * pas des traits fins : chaque dessin est fait de surfaces pleines, lisible à 40 px, teinté par des variables CSS qui changent avec le
 * thème (`carnets.css`, `.cn-picto`). Un objet sans dessin ne reçoit jamais le cube générique refusé (critique 4, P1) : sa vignette
 * porte l'initiale de son nom (`data-picto="objet"`), rien qui prétende le montrer.
 * R30 reste vrai : le picto est un dessin, rien d'autre. Aucun champ, aucun gabarit, aucune caractéristique ne dépend de lui.
 */
import React from 'react';
import { normaliser } from '../../domain/carnets/analyseLocale';

export type PictoNom =
  | 'hotte' | 'ventilateur' | 'centrifuge' | 'evier' | 'tireuse' | 'frigo' | 'pompe' | 'moulin' | 'embouteillage' | 'fut' | 'cuve'
  | 'densimetre' | 'mesure' | 'balance' | 'tuyau' | 'chauffe' | 'filtre' | 'echangeur' | 'gaz' | 'etagere' | 'chariot' | 'objet';

/** Mots (normalisés : minuscules, sans accents) → picto ; le premier qui répond l'emporte, dans cet ordre. */
const REGLES: readonly [PictoNom, RegExp][] = [
  ['hotte', /\bhottes?\b/],
  ['centrifuge', /\b(centrifuges?|gaines?)\b/],
  ['ventilateur', /\b(extracteurs?|ventilateurs?|helicoides?|aerateurs?)\b/],
  ['tireuse', /\b(tireuses?|tirage|robinets? a biere|fontaines? a biere)\b/],
  ['gaz', /\b(co2|gaz|azote|detendeurs?|compresseurs?|manodetendeurs?)\b/],
  ['embouteillage', /\b(embouteill\w*|remplisseuses?|soutireuses?|isobariques?|monobloc\w*|becs?|bouteilles?|capsuleuses?|canettes?|sertisseuses?)\b/],
  ['evier', /\b(eviers?|lavabos?|plonges?|bacs?)\b/],
  ['echangeur', /\b(echangeurs?|refroidisseurs?|serpentins?|plaques?|chillers?)\b/],
  ['frigo', /\b(frigos?|froid|froide|refrigera\w*|vitrines?|congela\w*|groupes? froid|chambres? froides?)\b/],
  ['pompe', /\bpompes?\b/],
  ['moulin', /\b(moulins?|concasseurs?|broyeurs?)\b/],
  ['fut', /\b(futs?|kegs?|tonneaux?)\b/],
  ['cuve', /\b(cuves?|fermenteurs?|unitanks?|cylindro\w*|brassins?|marmites?)\b/],
  ['densimetre', /\b(densim\w*|areom\w*|refracto\w*|saccharom\w*|hydrom\w*)\b/],
  ['mesure', /\b(thermom\w*|ph-?metres?|ph|sondes?|mesures?|oxymetres?)\b/],
  ['balance', /\b(balances?|pesee|bascules?)\b/],
  ['tuyau', /\b(tuyaux?|flexibles?|raccords?|durites?)\b/],
  ['chauffe', /\b(chauffe(-| )?eau|chaudieres?|boilers?|bouilloires?|resistances?|chauffage)\b/],
  ['filtre', /\b(filtres?|filtration|cartouches?)\b/],
  ['gaz', /\bbouteilles? de (co2|gaz)\b/],
  ['etagere', /\b(etageres?|rayonnages?|rangements?|palettes?|stockage)\b/],
  ['chariot', /\b(diables?|chariots?|transpalettes?|roulettes?)\b/],
  ['hotte', /\b(ventilation|buees?|vmc|aspiration|vapeurs?)\b/]
];

/** Le picto d'un objet d'après ses mots, dans l'ordre donné (le nom avant la façon, la façon avant le carnet) ; `objet` sinon. */
export function pictoDe(...textes: (string | undefined | null)[]): PictoNom {
  for (const t of textes) {
    if (!t?.trim()) continue;
    const n = normaliser(t.replace(/^ZZ TEST — /, ''));
    for (const [nom, motif] of REGLES) if (motif.test(n)) return nom;
  }
  return 'objet';
}

/* Les teintes : m métal clair, m2 métal ombré, k sombre (moteur, cadran, poignée), a vert de la zone, b bleu (moteur, froid, eau),
   v verre brun, o ambre (bière, eau chaude), f fond clair (cadran, hélice). Le trait `t` cerne chaque surface, finement. */
const DESSINS: Record<Exclude<PictoNom, 'objet'>, React.ReactNode> = {
  hotte: <>
    <rect className="m2" x="19" y="3" width="10" height="13" rx="1" />
    <path className="m" d="M7 30 L17 15 H31 L41 30 Z" />
    <rect className="m2" x="5" y="29" width="38" height="5" rx="1.5" />
    <path className="tl" d="M14 38 l2.5 2.5 -2.5 2.5 M23 38 l2.5 2.5 -2.5 2.5 M32 38 l2.5 2.5 -2.5 2.5" />
  </>,
  ventilateur: <>
    <rect className="m" x="5" y="5" width="38" height="38" rx="5" />
    <rect className="ac" x="5" y="5" width="38" height="38" rx="5" />
    <circle className="f" cx="24" cy="24" r="14" />
    <path className="k" d="M24 24 C22 17 23 12 28 11 C31 14 29 20 24 24 Z" />
    <path className="k" d="M24 24 C30 20 35 20 37 25 C34 29 28 28 24 24 Z" />
    <path className="k" d="M24 24 C25 31 22 36 17 36 C15 32 19 27 24 24 Z" />
    <circle className="a" cx="24" cy="24" r="3" />
  </>,
  centrifuge: <>
    <rect className="m2" x="2" y="19" width="12" height="10" rx="1" />
    <rect className="m2" x="34" y="19" width="12" height="10" rx="1" />
    <circle className="m" cx="24" cy="24" r="12" />
    <circle className="f" cx="24" cy="24" r="6" />
    <circle className="k" cx="24" cy="24" r="2.5" />
  </>,
  evier: <>
    <path className="tg" d="M31 22 V10 H22 V14" />
    <rect className="m2" x="4" y="21" width="40" height="5" rx="1" />
    <path className="m" d="M8 26 H22 V34 A4 4 0 0 1 18 38 H12 A4 4 0 0 1 8 34 Z" />
    <path className="m" d="M26 26 H40 V34 A4 4 0 0 1 36 38 H30 A4 4 0 0 1 26 34 Z" />
    <path className="tg" d="M8 38 V45 M40 38 V45" />
  </>,
  tireuse: <>
    <rect className="m2" x="8" y="41" width="32" height="4" rx="1" />
    <rect className="m" x="20" y="6" width="8" height="35" rx="2" />
    <rect className="k" x="11" y="10" width="9" height="4" rx="1" />
    <rect className="k" x="28" y="10" width="9" height="4" rx="1" />
    <rect className="k" x="12" y="14" width="3" height="5" />
    <path className="o" d="M10 26 H18 L17 39 H11 Z" />
    <rect className="f" x="10" y="26" width="8" height="3" />
  </>,
  frigo: <>
    <rect className="m" x="11" y="3" width="26" height="42" rx="3" />
    <path className="tl" d="M11 17 H37" />
    <rect className="k" x="14" y="8" width="2.5" height="6" rx="1" />
    <rect className="k" x="14" y="21" width="2.5" height="10" rx="1" />
    <rect className="b" x="28" y="7" width="6" height="4" rx="1" />
  </>,
  pompe: <>
    <rect className="k" x="3" y="39" width="42" height="3" rx="1" />
    <rect className="b" x="4" y="19" width="22" height="18" rx="3" />
    <path className="tl" d="M9 22 V34 M13 22 V34 M17 22 V34 M21 22 V34" />
    <rect className="m2" x="30" y="6" width="6" height="15" />
    <rect className="m2" x="28" y="4" width="10" height="3" rx="1" />
    <circle className="m" cx="33" cy="28" r="9" />
    <circle className="k" cx="33" cy="28" r="3" />
  </>,
  moulin: <>
    <path className="o" d="M10 4 H38 L31 16 H17 Z" />
    <rect className="m" x="7" y="16" width="34" height="20" rx="2" />
    <circle className="m2" cx="18" cy="26" r="6" />
    <circle className="m2" cx="30" cy="26" r="6" />
    <circle className="k" cx="18" cy="26" r="2" />
    <circle className="k" cx="30" cy="26" r="2" />
    <path className="tg" d="M11 36 V45 M37 36 V45" />
  </>,
  embouteillage: <>
    <rect className="m" x="5" y="3" width="38" height="13" rx="2" />
    <circle className="o" cx="10" cy="9.5" r="2" />
    <circle className="a" cx="15.5" cy="9.5" r="2" />
    <rect className="k" x="30" y="6.5" width="9" height="6" rx="1" />
    <path className="tg" d="M11 16 V24 M19.5 16 V24 M28.5 16 V24 M37 16 V24" />
    <path className="v" d="M9.5 24 H12.5 V28 L14 30 V41 H8 V30 L9.5 28 Z" />
    <path className="v" d="M18 24 H21 V28 L22.5 30 V41 H16.5 V30 L18 28 Z" />
    <path className="v" d="M27 24 H30 V28 L31.5 30 V41 H25.5 V30 L27 28 Z" />
    <path className="v" d="M35.5 24 H38.5 V28 L40 30 V41 H34 V30 L35.5 28 Z" />
    <rect className="m2" x="4" y="41" width="40" height="3" rx="1" />
  </>,
  fut: <>
    <rect className="k" x="20" y="2" width="8" height="5" rx="1" />
    <rect className="m" x="11" y="6" width="26" height="38" rx="6" />
    <rect className="m2" x="11" y="13" width="26" height="3" />
    <rect className="m2" x="11" y="34" width="26" height="3" />
  </>,
  cuve: <>
    <rect className="m2" x="13" y="2" width="22" height="5" rx="2" />
    <path className="m" d="M12 6 H36 V28 L24 38 L12 28 Z" />
    <rect className="k" x="22" y="38" width="4" height="4" />
    <path className="tg" d="M14 30 L9 46 M34 30 L39 46" />
    <circle className="f" cx="24" cy="16" r="3.5" />
  </>,
  densimetre: <>
    <path className="b" d="M13 18 H35 V42 A3 3 0 0 1 32 45 H16 A3 3 0 0 1 13 42 Z" />
    <path className="tl" d="M13 4 V42 A3 3 0 0 0 16 45 H32 A3 3 0 0 0 35 42 V4" />
    <rect className="k" x="23" y="3" width="2.5" height="22" rx="1" />
    <ellipse className="m" cx="24.2" cy="32" rx="5" ry="8" />
  </>,
  mesure: <>
    <rect className="m" x="19" y="3" width="10" height="32" rx="5" />
    <rect className="o" x="22" y="14" width="4" height="22" />
    <circle className="o" cx="24" cy="39" r="7" />
    <path className="tl" d="M29 9 H33 M29 15 H33 M29 21 H33 M29 27 H33" />
  </>,
  balance: <>
    <rect className="m2" x="7" y="13" width="34" height="4" rx="1" />
    <rect className="k" x="22" y="17" width="4" height="4" />
    <path className="m" d="M10 21 H38 L42 41 H6 Z" />
    <rect className="k" x="17" y="27" width="14" height="7" rx="1" />
    <rect className="a" x="19" y="29" width="5" height="3" />
  </>,
  tuyau: <>
    <circle className="tt" cx="22" cy="24" r="15" />
    <circle className="tt" cx="22" cy="24" r="7" />
    <path className="tt" d="M37 24 H42" />
    <rect className="m2" x="40" y="20" width="6" height="8" rx="1" />
  </>,
  chauffe: <>
    <rect className="m" x="13" y="3" width="22" height="37" rx="9" />
    <circle className="f" cx="24" cy="15" r="5" />
    <path className="tl" d="M24 15 L27 12" />
    <rect className="b" x="17" y="40" width="4" height="6" />
    <rect className="o" x="27" y="40" width="4" height="6" />
  </>,
  filtre: <>
    <rect className="m2" x="13" y="3" width="22" height="6" rx="1.5" />
    <rect className="m" x="15" y="9" width="18" height="34" rx="3" />
    <path className="tl" d="M19 13 V39 M24 13 V39 M29 13 V39" />
    <rect className="k" x="21" y="43" width="6" height="3" />
  </>,
  echangeur: <>
    <rect className="k" x="6" y="7" width="36" height="4" rx="1" />
    <rect className="k" x="6" y="37" width="36" height="4" rx="1" />
    <rect className="m" x="9" y="11" width="5" height="26" />
    <rect className="m2" x="15.5" y="11" width="5" height="26" />
    <rect className="m" x="22" y="11" width="5" height="26" />
    <rect className="m2" x="28.5" y="11" width="5" height="26" />
    <rect className="m" x="35" y="11" width="5" height="26" />
    <circle className="b" cx="4" cy="16" r="3" />
    <circle className="o" cx="44" cy="32" r="3" />
  </>,
  gaz: <>
    <rect className="k" x="20" y="2" width="8" height="5" rx="1" />
    <rect className="m2" x="22" y="7" width="4" height="4" />
    <rect className="m" x="15" y="10" width="18" height="35" rx="8" />
    <rect className="a" x="15" y="20" width="18" height="5" />
  </>,
  etagere: <>
    <path className="tg" d="M7 3 V46 M41 3 V46" />
    <rect className="m2" x="7" y="14" width="34" height="3" />
    <rect className="m2" x="7" y="29" width="34" height="3" />
    <rect className="m2" x="7" y="43" width="34" height="3" />
    <rect className="o" x="10" y="5" width="11" height="9" rx="1" />
    <rect className="m" x="24" y="8" width="13" height="6" rx="1" />
    <rect className="b" x="11" y="21" width="8" height="8" rx="1" />
    <rect className="v" x="22" y="19" width="6" height="10" rx="1" />
    <rect className="o" x="12" y="35" width="18" height="8" rx="1" />
  </>,
  chariot: <>
    <path className="tg" d="M12 3 V38 H38" />
    <rect className="o" x="15" y="20" width="18" height="16" rx="1" />
    <rect className="m" x="16" y="8" width="14" height="12" rx="1" />
    <circle className="k" cx="15" cy="41" r="5" />
    <circle className="f" cx="15" cy="41" r="1.8" />
  </>
};

const LIBELLE: Record<PictoNom, string> = {
  hotte: 'hotte', ventilateur: 'extracteur', centrifuge: 'centrifuge', evier: 'évier', tireuse: 'tireuse', frigo: 'frigo', pompe: 'pompe',
  moulin: 'moulin', embouteillage: 'remplisseuse', fut: 'fût', cuve: 'cuve', densimetre: 'densimètre', mesure: 'thermomètre',
  balance: 'balance', tuyau: 'tuyau', chauffe: 'chauffe-eau', filtre: 'filtre', echangeur: 'échangeur', gaz: 'bouteille de gaz',
  etagere: 'étagère', chariot: 'diable', objet: 'objet'
};

/** L'initiale d'un objet sans dessin (« T » pour « Tuyau… » s'il n'avait pas de dessin) ; « ? » si rien n'est nommé. */
export function initialeDe(...textes: (string | undefined | null)[]): string {
  const t = textes.find(x => x?.trim())?.replace(/^ZZ TEST — /, '').trim() ?? '';
  const l = /[\p{L}\p{N}]/u.exec(t)?.[0];
  return l ? l.toLocaleUpperCase('fr-CH') : '?';
}

/** Le picto seul ; `data-picto` le nomme pour les contrôles. `objet` : l'initiale (`lettre`), jamais un cube. */
export function PictoObjet({ nom, taille = 24, lettre }: { nom: PictoNom; taille?: number; lettre?: string }) {
  if (nom === 'objet') {
    return (
      <svg className="cn-picto cn-picto-initiale" data-picto="objet" width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
        <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="700">{lettre ?? '?'}</text>
      </svg>
    );
  }
  return (
    <svg className="cn-picto" data-picto={nom} width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
      {DESSINS[nom]}
    </svg>
  );
}

export const libellePicto = (nom: PictoNom): string => LIBELLE[nom];

/**
 * La vignette d'un objet : sa photo s'il en a une, sinon l'objet dessiné dans un carré clair (initiale s'il n'a pas de dessin).
 * `mots` : du plus précis au plus large (nom de l'article, façon, titre du carnet). `classe` ajoute une taille
 * (`cn-vignette-petite`, `cn-vignette-grande`, `cn-vignette-fiche`).
 */
export function VignetteObjet({ photo, mots, classe, taille }: { photo?: string; mots: (string | undefined | null)[]; classe?: string; taille?: number }) {
  if (photo) return <img className={`cn-vignette${classe ? ` ${classe}` : ''}`} src={photo} alt="" loading="lazy" />;
  const nom = pictoDe(...mots);
  return (
    <span className={`cn-vignette cn-vignette-vide${classe ? ` ${classe}` : ''}`} data-picto={nom} aria-hidden>
      <PictoObjet nom={nom} taille={taille ?? 40} lettre={initialeDe(...mots)} />
    </span>
  );
}
