/**
 * Pictos d'objet du carnet (P1, critique 4 ; figés p2:g05-1, p2:h05-3, g5:v06-10 ; R01, R04, D-25, D-78). Une photo si l'objet en a
 * une ; sinon un picto déduit de ses mots (titre, nom, façon, phrase) : hotte, ventilateur, évier, tireuse, frigo, pompe, moulin,
 * embouteillage, fût, cuve, mesure ; le picto générique (une caisse) seulement en dernier recours.
 * R30 reste vrai : le picto est un dessin, rien d'autre. Aucun champ, aucun gabarit, aucune caractéristique ne dépend de lui.
 * Dessins au trait (24 × 24, `currentColor`), dans l'esprit des vignettes des figés ; exportés pour Comparer et Choisir (lots C et D).
 */
import React from 'react';
import { normaliser } from '../../domain/carnets/analyseLocale';

export type PictoNom =
  | 'hotte' | 'ventilateur' | 'evier' | 'tireuse' | 'frigo' | 'pompe' | 'moulin' | 'embouteillage' | 'fut' | 'cuve' | 'mesure' | 'objet';

/** Mots (normalisés : minuscules, sans accents) → picto ; le premier qui répond l'emporte, dans cet ordre. */
const REGLES: readonly [PictoNom, RegExp][] = [
  ['hotte', /\bhottes?\b/],
  ['ventilateur', /\b(extracteurs?|ventilateurs?|helicoides?|centrifuges?|aerateurs?)\b/],
  ['tireuse', /\b(tireuses?|tirage|robinets? a biere|fontaines? a biere)\b/],
  ['embouteillage', /\b(embouteill\w*|remplisseuses?|soutireuses?|isobariques?|monobloc\w*|becs?|bouteilles?|capsuleuses?)\b/],
  ['evier', /\b(eviers?|lavabos?|plonges?|bacs?)\b/],
  ['frigo', /\b(frigos?|froid|froide|refrigera\w*|vitrines?|congela\w*|groupes? froid|chambres? froides?)\b/],
  ['pompe', /\bpompes?\b/],
  ['moulin', /\b(moulins?|concasseurs?|broyeurs?)\b/],
  ['fut', /\b(futs?|kegs?|tonneaux?)\b/],
  ['cuve', /\b(cuves?|fermenteurs?|unitanks?|cylindro\w*|brassins?)\b/],
  ['mesure', /\b(densim\w*|areom\w*|refracto\w*|thermom\w*|ph-?metres?|sondes?|balances?|mesures?)\b/],
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

const TRAITS: Record<PictoNom, React.ReactNode> = {
  hotte: <><path d="M10 3h4v5h-4z" /><path d="M4 14l5-6h6l5 6z" /><path d="M8 17c.6.8.6 1.7 0 2.5M12 17c.6.8.6 1.7 0 2.5M16 17c.6.8.6 1.7 0 2.5" /></>,
  ventilateur: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="12" cy="12" r="1.5" /><path d="M12 10.5c0-3 1-4.5 3-4.5M13.3 12.8c2.6 1.5 3.4 3.1 2.4 4.8M10.7 12.8c-2.6 1.5-4.4 1.4-5.4-.3" /></>,
  evier: <><path d="M3 11h18v2.5A4.5 4.5 0 0 1 16.5 18h-9A4.5 4.5 0 0 1 3 13.5z" /><path d="M12 11V5h4v2" /><path d="M12 11v7" /></>,
  tireuse: <><rect x="4" y="5" width="16" height="4" rx="1" /><path d="M8 2v3M16 2v3M8 9v3M16 9v3" /><path d="M10 14h4l-.6 6h-2.8z" /><path d="M3 21h18" /></>,
  frigo: <><rect x="6" y="2.5" width="12" height="19" rx="2" /><path d="M6 9.5h12" /><path d="M9 5.5v2M9 12.5v3.5" /></>,
  pompe: <><rect x="2.5" y="9" width="10" height="8" rx="1.5" /><path d="M5.5 9v8M8.5 9v8" /><circle cx="17" cy="13" r="3.5" /><path d="M17 9.5V5h3" /><path d="M3 20h17" /></>,
  moulin: <><path d="M6 3h12l-4 5h-4z" /><rect x="4" y="8" width="16" height="9" rx="1.5" /><circle cx="9.5" cy="12.5" r="2" /><circle cx="14.5" cy="12.5" r="2" /><path d="M7 17v4M17 17v4" /></>,
  embouteillage: <><rect x="3" y="3" width="18" height="4" rx="1" /><path d="M7 7v3M12 7v3M17 7v3" /><rect x="5.5" y="10" width="3" height="9" rx="1" /><rect x="10.5" y="10" width="3" height="9" rx="1" /><rect x="15.5" y="10" width="3" height="9" rx="1" /><path d="M3 21.5h18" /></>,
  fut: <><rect x="6" y="3" width="12" height="18" rx="3" /><path d="M6 8h12M6 16h12" /><path d="M11 3v-1h2v1" /></>,
  cuve: <><path d="M6 3h12v10l-6 5-6-5z" /><path d="M7 14l-2 7M17 14l2 7" /><path d="M10 6h4" /></>,
  mesure: <><path d="M4 16a8 8 0 1 1 16 0" /><path d="M12 16l4-5" /><path d="M4 19h16" /></>,
  objet: <><path d="M3 8l9-5 9 5v8l-9 5-9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>
};

const LIBELLE: Record<PictoNom, string> = {
  hotte: 'hotte', ventilateur: 'ventilateur', evier: 'évier', tireuse: 'tireuse', frigo: 'frigo', pompe: 'pompe', moulin: 'moulin',
  embouteillage: 'embouteillage', fut: 'fût', cuve: 'cuve', mesure: 'mesure', objet: 'objet'
};

/** Le picto seul (trait, `currentColor`) ; `data-picto` le nomme pour les contrôles. */
export function PictoObjet({ nom, taille = 24 }: { nom: PictoNom; taille?: number }) {
  return (
    <svg className="cn-picto" data-picto={nom} width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {TRAITS[nom]}
    </svg>
  );
}

export const libellePicto = (nom: PictoNom): string => LIBELLE[nom];

/**
 * La vignette d'un objet : sa photo s'il en a une, sinon son picto dans un carré teinté. `mots` : du plus précis au plus large
 * (nom de l'article, façon, titre du carnet). `classe` ajoute une taille (`cn-vignette-petite`, `cn-vignette-grande`).
 */
export function VignetteObjet({ photo, mots, classe, taille }: { photo?: string; mots: (string | undefined | null)[]; classe?: string; taille?: number }) {
  if (photo) return <img className={`cn-vignette${classe ? ` ${classe}` : ''}`} src={photo} alt="" loading="lazy" />;
  const nom = pictoDe(...mots);
  return (
    <span className={`cn-vignette cn-vignette-vide${classe ? ` ${classe}` : ''}`} data-picto={nom} aria-hidden>
      <PictoObjet nom={nom} taille={taille ?? 28} />
    </span>
  );
}
