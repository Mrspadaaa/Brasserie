import React from 'react';

/**
 * Une pastille qui CHANGE quand on appuie dessus.
 *
 * ⚠️ Demandé mot pour mot : « j'aime beaucoup ces histoires de tag… j'aimerais
 * en plus que si j'appuie dessus ça change et fait une rotation ».
 *
 * Ce qu'elle remplace, et pourquoi c'est mieux au doigt : un `Combobox` ou un
 * `SegmentedControl` pour choisir parmi trois ou quatre valeurs coûte une
 * étiquette, une ligne pleine largeur, et — pour le premier — l'ouverture d'une
 * liste par-dessus l'écran. La pastille, elle, occupe la place de son propre
 * texte, EST la valeur courante, et se change d'un appui là où on la lit. Sur
 * une carte d'ingrédient qu'on répète huit fois, l'écart se compte en écrans.
 *
 * Trois règles tenues :
 *
 *   1. **Elle tourne en boucle**, dans l'ordre déclaré. Après la dernière
 *      valeur on revient à la première : pas d'impasse.
 *   2. **Elle dit qu'elle est cliquable** — au lecteur d'écran par son nom
 *      accessible, à l'œil par le chevron de rotation.
 *   3. **Elle ne remplace pas un choix LONG.** Au-delà de cinq valeurs, faire
 *      défiler devient plus lent que d'ouvrir une liste : la pastille est faite
 *      pour les énumérations courtes qu'un brasseur connaît par cœur.
 */

interface CycleTagProps<T extends string> {
  value: T;
  /** Les valeurs, dans l'ordre où la rotation les traverse. */
  options: readonly T[];
  onChange: (next: T) => void;
  /** Le texte affiché pour une valeur. */
  label: (v: T) => string;
  /** Les classes de couleur d'une valeur — la pastille garde son code visuel. */
  tone?: (v: T) => string;
  /** Ce que la pastille désigne, pour le lecteur d'écran : « Moment », « Famille ». */
  name: string;
  className?: string;
}

export function CycleTag<T extends string>({
  value,
  options,
  onChange,
  label,
  tone,
  name,
  className = ''
}: CycleTagProps<T>) {
  const i = options.indexOf(value);
  const suivant = options[(i + 1) % options.length];

  return (
    <button
      type="button"
      /*
       * ⚠️ Le nom accessible porte la valeur COURANTE et l'action. Sans lui, un
       * lecteur d'écran annonce « bouton Ébullition » — on ne sait ni ce que
       * l'étiquette désigne, ni qu'appuyer la change.
       */
      aria-label={`${name} : ${label(value)} — appuyer pour passer à ${label(suivant)}`}
      onClick={() => onChange(suivant)}
      className={`inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full border
                  text-2xs transition-colors active:scale-[0.97] ${
                    tone ? tone(value) : 'border-cave-700 text-cave-300'
                  } ${className}`}
    >
      {label(value)}
      {/*
        Le chevron de rotation : c'est lui qui distingue une pastille qu'on
        appuie d'une étiquette qu'on lit. Deux traits, pas une icône importée —
        il doit rester lisible à 10 px.
      */}
      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 shrink-0 opacity-70" aria-hidden>
        <path
          d="M2.5 4.5a3.6 3.6 0 0 1 6.4-1.2M9.5 7.5a3.6 3.6 0 0 1-6.4 1.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M8.4 1.4v2h-2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.6 10.6v-2h2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
