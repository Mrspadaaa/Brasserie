import React from 'react';

/**
 * Une rangée de préréglages qu'on APPLIQUE d'un appui.
 *
 * ⚠️ Ce qu'elle remplace, et pourquoi le composant précédent était le mauvais.
 * Les programmes d'empâtage et de fermentation passaient par un `Combobox`
 * monté avec `value={''}` — une valeur vide, figée, jamais mise à jour. Le
 * champ affichait donc « Charger un programme… » AVANT le choix, et
 * « Charger un programme… » APRÈS : rien ne disait lequel venait d'être chargé,
 * ni s'il avait pris. Gaëtan, mot pour mot : « les dropdown de programme, ils
 * sont pas sélectionné ».
 *
 * Le défaut était de fond, pas de réglage. Un `Combobox` sert à choisir une
 * VALEUR qu'on garde ; charger un programme est une ACTION qui réécrit des
 * paliers. Les deux ne se représentent pas pareil : la valeur se montre dans un
 * champ, l'action se propose comme un bouton.
 *
 * Trois choix tenus :
 *
 *   1. **Tout est visible d'un coup.** Six programmes tiennent en deux lignes
 *      de pastilles ; la liste déroulante en montrait quatre et demandait de
 *      faire défiler par-dessus l'écran pour voir les autres.
 *   2. **Celui qui est en place est marqué.** C'est la réponse à « il n'est pas
 *      sélectionné » : l'appelant reconnaît le programme courant en comparant
 *      les paliers, et la pastille correspondante s'allume.
 *   3. **Ça n'est PAS une pastille rotative.** Appliquer un programme écrase les
 *      paliers saisis. Un `CycleTag` traverserait les six d'un appui répété et
 *      effacerait le travail du brasseur en passant : ici, chaque programme
 *      demande son propre appui, sur sa propre cible.
 */

interface PresetChipsProps<T> {
  presets: readonly T[];
  id: (p: T) => string;
  label: (p: T) => string;
  /** Ce que le programme cherche à obtenir — lu sous la rangée, pour l'actif. */
  purpose: (p: T) => string;
  /** Le programme actuellement en place, ou `null` si les paliers sont sur mesure. */
  activeId: string | null;
  onApply: (p: T) => void;
  /** Ce que la rangée règle, pour le lecteur d'écran : « Programme d'empâtage ». */
  name: string;
}

export function PresetChips<T>({
  presets,
  id,
  label,
  purpose,
  activeId,
  onApply,
  name
}: PresetChipsProps<T>) {
  const actif = presets.find((p) => id(p) === activeId);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1" role="group" aria-label={name}>
        {presets.map((p) => {
          const on = id(p) === activeId;
          return (
            <button
              key={id(p)}
              type="button"
              aria-pressed={on}
              aria-label={`${name} : ${label(p)}${on ? ' — en place' : ''}`}
              onClick={() => onApply(p)}
              className={`relative min-h-touch-sm px-1.5 py-0.5 rounded-control border text-2xs transition-colors active:scale-[0.97] ${
                on
                  ? 'border-ebc-straw text-ebc-straw bg-ebc-straw/10 font-semibold'
                  : 'border-cave-700 text-cave-200 hover:border-cave-600'
              }`}
            >
              {label(p)}
            </button>
          );
        })}
      </div>
      {/*
        Une seule explication, celle du programme en place. Les six affichées
        ensemble faisaient un pavé que personne ne lit ; affichée seule, celle-ci
        répond à la question qu'on se pose après avoir appuyé : qu'est-ce que je
        viens de charger ?
      */}
      <p className="text-2xs text-cave-400 leading-snug">
        {actif ? purpose(actif) : 'Paliers sur mesure. Un programme les remplace.'}
      </p>
    </div>
  );
}
