import React from 'react';
import { WaterIons } from '../types';
import { ION_LABEL, ION_SYMBOL } from '../domain/water';
import { StyleWater, positionInRange, styleIonRange, isIndicativeIon } from '../domain/waterStyles';

/**
 * L'eau de départ face à l'eau corrigée, ion par ion.
 *
 * ⚠️ CE QUE ÇA DIT ET QUE LA TOILE NE DIT PAS. J'avais supprimé ce bloc en le
 * prenant pour un doublon du graphe. C'était faux, et Gaëtan l'a vu tout de
 * suite : « j'ai perdu cette info ». La toile donne une FORME — on voit d'un
 * coup d'œil si le profil penche vers le sulfate ou le chlorure. Ce bloc donne
 * des NOMBRES, et surtout l'ÉCART entre ce qu'on avait et ce qu'on aura. Devant
 * la balance, c'est le second qu'on lit : 15 → 52, ça veut dire que les sels
 * font le travail. La forme ne se pèse pas.
 *
 * ⚠️ EN RANGS, PAS EN COLONNES — et c'est tout le problème d'origine. Les six
 * ions étaient six COLONNES d'un tableau : sur un téléphone, la sixième tombait
 * hors écran et le conteneur défilait latéralement. Sur la capture qui a servi
 * à signaler la perte, l'en-tête « HCO₃ » est lui-même coupé au bord droit et
 * ses valeurs sont tronquées. Six colonnes ne tiendront jamais dans 320 px ;
 * six rangs y tiennent toujours, quelle que soit la largeur.
 *
 * Chaque rang répond aux trois questions du brasseur, dans l'ordre où il se les
 * pose : où j'en suis, où je vais, et est-ce que c'est dans la fourchette.
 */

interface IonComparisonProps {
  start: WaterIons;
  achieved: WaterIons;
  style: StyleWater;
}

const IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];

/**
 * ⚠️ « éq. » : la chaux apporte des OH⁻, pas des HCO₃⁻. Le rang mesure
 * l'alcalinité, exprimée en équivalent bicarbonate. Le reste des symboles vient
 * du domaine — la toile les écrit aussi, et deux listes divergent.
 */
const SYMBOL = (ion: keyof WaterIons) =>
  ion === 'hco3' ? `${ION_SYMBOL.hco3} éq.` : ION_SYMBOL[ion];

/**
 * L'échelle d'un rang, choisie pour que le HAUT de la fourchette tombe toujours
 * aux deux tiers de la barre.
 *
 * ⚠️ C'est une échelle PAR ION, et c'est voulu — contrairement à la toile, où
 * une échelle par secteur rendait les six zones vertes identiques et illisibles.
 * La différence tient à ce qu'on compare : sur la toile, les six secteurs
 * forment UNE figure, donc leurs rayons doivent partager une échelle. Ici, les
 * six rangs sont indépendants ; personne ne compare la longueur du rang sodium
 * à celle du bicarbonate. Placer la zone verte au même endroit sur les six rend
 * au contraire la colonne SCANNABLE : l'œil apprend où est « bon », et la
 * position du point se lit sans relire les chiffres.
 */
function echelle(max: number, ...valeurs: number[]): number {
  return Math.max(max / 0.66, ...valeurs.map((v) => v * 1.08), 1);
}

/** Un rang : symbole, départ → corrigé, barre de position, fourchette. */
const Rang: React.FC<{
  ion: keyof WaterIons;
  start: number;
  achieved: number;
  style: StyleWater;
}> = ({ ion, start, achieved, style }) => {
  const range = styleIonRange(style, ion);
  const targeted = !style.untargetedIons?.includes(ion);
  const indicative = isIndicativeIon(style, ion);
  const dehors = !targeted || indicative ? 0 : positionInRange(achieved, range);
  const max = echelle(range.max, start, achieved);
  const pct = (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const bouge = Math.round(achieved) !== Math.round(start);

  return (
    <li className="flex items-center gap-2 py-1">
      {/* ⚠️ `w-16` et non `w-12` : « HCO₃⁻ éq. » est le plus long des six
          symboles et se coupait en « HCO₃⁻… ». La colonne se règle sur le
          symbole le plus large, pas sur le plus courant. */}
      <span className="w-16 shrink-0 text-2xs text-cave-400 truncate" title={ION_LABEL[ion]}>
        {SYMBOL(ion)}
      </span>

      {/*
        Départ → corrigé. La flèche ne s'affiche QUE si les sels ont bougé cet
        ion : sur un ion que rien ne touche, « 10 → 10 » ferait croire à une
        action là où il n'y en a aucune.
      */}
      <span className="w-[4.5rem] shrink-0 text-right whitespace-nowrap">
        {bouge && (
          <>
            <span className="reading text-2xs text-cave-500">{Math.round(start)}</span>
            <span className="text-2xs text-cave-600"> → </span>
          </>
        )}
        <span
          className={`reading text-sm font-semibold ${
            dehors === 0 ? 'text-cave-100' : 'text-ebc-amber'
          }`}
        >
          {Math.round(achieved)}
        </span>
      </span>

      {/*
        La barre. La zone verte est la fourchette du style ; le trait pâle
        marque le départ, le point vif l'arrivée. C'est la même grammaire que la
        toile — vert = dans la fourchette, ambre = dehors — pour qu'on n'ait pas
        à apprendre deux codes.
      */}
      <span className="relative flex-1 min-w-0 h-1.5 rounded-full bg-cave-850" aria-hidden>
        <span
          className="absolute inset-y-0 rounded-full bg-hop/25"
          style={{ left: `${pct(range.min)}%`, right: `${100 - pct(range.max)}%`, opacity: targeted ? 1 : 0 }}
        />
        {bouge && (
          <span
            className="absolute inset-y-0 w-0.5 bg-cave-600"
            style={{ left: `${pct(start)}%` }}
          />
        )}
        <span
          className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-cave-950 ${
            !targeted ? 'bg-cave-400' : indicative ? 'bg-ebc-straw' : dehors === 0 ? 'bg-hop' : 'bg-ebc-amber'
          }`}
          style={{ left: `calc(${pct(achieved)}% - 4px)` }}
        />
      </span>

      <span className="w-14 shrink-0 reading text-2xs text-cave-400 text-right whitespace-nowrap"
        title={!targeted ? 'Aucune cible renseignée pour cet ion.' : indicative ? 'Repère HCO₃ du profil ; dosage selon le pH d’empâtage.' : undefined}>
        {targeted ? `${range.min}–${range.max}` : '—'}
      </span>
    </li>
  );
};

export const IonComparison: React.FC<IonComparisonProps> = ({ start, achieved, style }) => (
  /*
    Le nom porté par la liste elle-même, et non par un `<li>` masqué : un rang
    invisible glissé parmi six rangs réels fausse le comptage au lecteur
    d'écran, et n'offre aucune prise pour cibler le bloc.
  */
  <ul
    className="panel px-2.5 py-1.5"
    aria-label="Eau de départ et eau corrigée, face à la fourchette du style, en ppm"
  >
    {IONS.map((ion) => (
      <Rang key={ion} ion={ion} start={start[ion]} achieved={achieved[ion]} style={style} />
    ))}
  </ul>
);
