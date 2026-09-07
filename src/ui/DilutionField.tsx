import React, { useId } from 'react';
import { NumberInput } from './NumberInput';
import { SliderField } from './SliderField';

/**
 * Part d'eau osmosée — en POURCENTAGE et en LITRES, sur la même valeur.
 *
 * ⚠️ Ce que ça règle, mot pour mot : « pour le calcul de l'eau robinet osmosé je
 * veux un litrage ». L'atelier ne montrait qu'un curseur de 0 à 100 %. Or on ne
 * verse pas un pourcentage dans une cuve : on remplit un bidon. Lire « 50 % »
 * obligeait à faire `0,5 × 22,4` de tête, deux fois — une fois pour l'empâtage,
 * une fois pour le rinçage — et c'est exactement le genre de calcul qu'on rate
 * debout devant la cuve, les mains mouillées.
 *
 * Les deux entrées commandent la même grandeur :
 *
 *   litres → %  = litres ÷ volume × 100, borné à [0, 100]
 *   % → litres  = volume × % ÷ 100
 *
 * ⚠️ Le pas du curseur reste 5 %, mais le champ litres, lui, ne s'y aligne PAS :
 * poser 15 L sur 22.4 L donne 67 %, une valeur que le curseur ne peut pas
 * atteindre. C'est voulu — le brasseur mesure des litres, le curseur n'est
 * qu'une façon rapide de viser.
 */

interface DilutionFieldProps {
  label: string;
  /** Part d'osmosée, en %. */
  value: number;
  onChange: (pct: number) => void;
  /** Volume de l'eau concernée, en litres. Sert à convertir le pourcentage. */
  volumeL: number;
  hint?: string;
  disabled?: boolean;
}

/** Arrondi au dixième de litre : on ne pèse pas l'eau au gramme. */
const round1 = (n: number) => Math.round(n * 10) / 10;

export const DilutionField: React.FC<DilutionFieldProps> = ({
  label,
  value,
  onChange,
  volumeL,
  hint,
  disabled = false
}) => {
  const litresId = useId();

  const osmoseeL = round1((volumeL * value) / 100);
  const reseauL = round1(volumeL - osmoseeL);

  /*
   * Sans volume posé, la conversion diviserait par zéro. Le champ litres se
   * désactive alors plutôt que d'afficher `NaN` ou `Infinity` : le curseur
   * reste utilisable, et la ligne dit pourquoi.
   */
  const hasVolume = volumeL > 0;

  return (
    <div className="space-y-1">
      {/*
        ⚠️ LE LITRAGE D'ABORD, sur la même ligne que le titre.

        Ce bloc occupait quatre étages : titre, curseur, repères chiffrés, cinq
        boutons de raccourci, puis la ligne des litres. Gaëtan : « 90 % des info
        sont toujours inutiles, le choix des boutons pour 25, 50, 75 inutile ».

        Il avait raison sur les boutons pour une raison précise : ils faisaient
        doublon avec le curseur juste au-dessus, qui atteint les mêmes valeurs
        d'un glissement — et avec le champ litres juste en dessous, qui est le
        seul des trois à répondre à la question qu'on se pose devant la cuve
        (combien j'en verse). Trois commandes pour une grandeur, dont deux
        redondantes. Ne reste que le curseur, pour viser vite, et les litres,
        pour verser juste.

        Les repères 0/50/90/100 sont partis avec eux : le pourcentage est déjà
        écrit en clair au bout de la ligne.
      */}
      {/*
        ⚠️ TROIS RANGS RAMENÉS À DEUX, ET CINQ NOMBRES À TROIS.

        La coupe s'affichait ainsi : intitulé, puis « 70 % » avec « 30 % réseau »
        au bout de la ligne, puis la piste, puis « 13 L osm. + 5.5 L réseau =
        18.5 L ». Soit CINQ expressions d'un seul partage. Trois d'entre elles
        n'étaient que de l'arithmétique sur la quatrième :

          • « 30 % réseau » vaut 100 moins le pourcentage affiché deux
            centimètres à sa gauche ;
          • « = 18.5 L » est le volume d'empâtage, déjà posé plus haut dans la
            feuille — et c'est justement le total dont on part ;
          • le pourcentage et le litrage disent la même chose dans deux unités.

        Ne restent que les deux gestes réels — viser au pourcentage, verser au
        litre — et le complément en réseau, qui est l'autre bidon à remplir.
        Les deux commandes tiennent maintenant sur la ligne de la valeur.
      */}
      <SliderField
        label={label}
        value={value}
        onChange={onChange}
        min={0}
        max={100}
        step={5}
        unit="%"
        displayDigits={2}
        hint={hint}
        disabled={disabled}
        /*
         * ⚠️ Un seul `ml-auto` sur la ligne. En donner un au litrage ET au
         * complément, les deux se poussaient l'un l'autre : « + 5.5 L réseau »
         * finissait tronqué en « + 5.5 L ré… » et le « L osm. » se collait au
         * « + ». Le complément est donc rendu ICI, dans la même travée que le
         * litrage auquel il se rapporte, et `readout` reste vide.
         */
        after={
          <span className="flex items-baseline gap-1 ml-auto min-w-0 shrink">
            <NumberInput
              id={litresId}
              /*
               * ⚠️ Le bassin entre PARENTHÈSES, pas après un tiret. Écrit
               * « Litres d'osmosée — Osmosée — empâtage », le nom se terminait
               * par celui du curseur : toute recherche ancrée sur la fin du
               * libellé ramassait les deux champs.
               */
              aria-label={`Litres d’osmosée (${label})`}
              min={0}
              max={hasVolume ? volumeL : undefined}
              value={osmoseeL}
              onValue={(litres: number) => {
                if (!hasVolume) return;
                const pct = Math.max(0, Math.min(100, (litres / volumeL) * 100));
                onChange(pct);
              }}
              disabled={disabled || !hasVolume}
              pad
              className="w-14 shrink-0 min-h-[38px] px-1 rounded-control
                         bg-cave-950 border border-cave-700
                         reading text-base font-semibold text-water text-center
                         focus:outline-none focus:border-ebc-straw disabled:opacity-40"
            />
            <span className="reading-unit shrink-0 text-2xs">L</span>
            <span className="text-2xs text-cave-500 shrink-0">
              {hasVolume ? (
                <>
                  + <span className="reading text-cave-400">{reseauL}</span> réseau
                </>
              ) : (
                '— volume non posé'
              )}
            </span>
          </span>
        }
      />
    </div>
  );
};
