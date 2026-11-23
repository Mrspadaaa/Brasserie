import React from 'react';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import type { HopRange } from '../../../functions/src/hopIndexSchema';

/**
 * Les familles aromatiques : une pastille par famille, trois états.
 *
 * ⚠️ CE QUI ÉTAIT DOUBLÉ, ET CE QUE ÇA COÛTAIT À L'ÉCRAN.
 *
 * Les douze familles étaient listées DEUX FOIS : une première série
 * « Agrumes · Fruits tropicaux · … » pour dire ce qu'on cherche, puis une
 * seconde « Éviter agrumes · Éviter fruits tropicaux · … » pour dire ce qu'on
 * refuse. Vingt-quatre pastilles d'environ 48 px, plus un intitulé et une
 * explication — mesuré à ~760 px sur un téléphone, pour douze notions.
 *
 * Or les deux listes portent la MÊME grandeur : la place d'une famille dans la
 * recette. Personne ne coche « agrumes » et « éviter agrumes » en même temps.
 * Deux commandes pour une grandeur, il faut en supprimer une
 * (`DESIGN.md`, « Une grandeur, une commande »).
 *
 * La pastille tourne donc à l'appui — neutre → recherché → évité → neutre. Le
 * projet emploie déjà ce geste ailleurs, et la règle qui l'encadre est
 * respectée ici : trois valeurs, bien en dessous du plafond de cinq, et aucune
 * conséquence destructrice — on revient au neutre en deux appuis.
 *
 * Les couleurs sont celles du système, pas de nouvelles : `ebc-straw` pour ce
 * qu'on cherche, `alert` pour ce qu'on écarte.
 */

export type AromaEtat = 'neutre' | 'recherche' | 'evite';

export function HopAromaTargetPicker({
  axes,
  target,
  avoid,
  disabled,
  onChange,
  onAvoidChange
}: {
  axes: HopAxis[];
  target: Record<string, HopRange>;
  /**
   * Identifiants des familles à écarter.
   *
   * Optionnel : tous les appelants ne portent pas cette notion. Sans
   * `onAvoidChange`, la pastille ne tourne qu'entre deux états — indifférent et
   * recherché — au lieu de trois. Le geste reste le même, il a juste un cran de
   * moins.
   */
  avoid?: string[];
  disabled?: boolean;
  onChange: (target: Record<string, HopRange>, axis: HopAxis) => void;
  onAvoidChange?: (avoid: string[]) => void;
}) {
  const ecarts = avoid ?? [];
  const peutEviter = typeof onAvoidChange === 'function';
  const choose = (axis: HopAxis, level: '' | 'low' | 'medium' | 'high') => {
    const next = { ...target };
    if (!level) delete next[axis.id];
    else
      next[axis.id] =
        level === 'low'
          ? { min: axis.scale.min, max: axis.lowMax }
          : level === 'medium'
            ? { min: axis.lowMax, max: axis.mediumMax }
            : { min: axis.mediumMax, max: axis.scale.max };
    onChange(next, axis);
  };

  const etat = (axis: HopAxis): AromaEtat =>
    target[axis.id] ? 'recherche' : ecarts.includes(axis.id) ? 'evite' : 'neutre';

  /** neutre → recherché → évité → neutre (le cran « évité » saute si l'appelant ne le gère pas). */
  const tourner = (axis: HopAxis) => {
    const courant = etat(axis);
    if (courant === 'neutre') {
      onAvoidChange?.(ecarts.filter((id) => id !== axis.id));
      choose(axis, 'medium');
    } else if (courant === 'recherche') {
      choose(axis, '');
      if (peutEviter && !ecarts.includes(axis.id)) onAvoidChange!([...ecarts, axis.id]);
    } else {
      onAvoidChange?.(ecarts.filter((id) => id !== axis.id));
    }
  };

  const TONS: Record<AromaEtat, string> = {
    neutre: 'border-cave-700 text-cave-200',
    recherche: 'bg-ebc-straw/10 border-ebc-straw text-ebc-straw',
    evite: 'bg-alert/10 border-alert text-cave-50 line-through decoration-alert'
  };
  const DIT: Record<AromaEtat, string> = {
    neutre: 'indifférent',
    recherche: 'recherché',
    evite: 'à éviter'
  };
  const SUITE: Record<AromaEtat, string> = {
    neutre: 'rechercher',
    recherche: peutEviter ? 'écarter' : 'rendre indifférent',
    evite: 'rendre indifférent'
  };

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="font-semibold text-cave-50 mb-2">Quel arôme veux-tu retrouver ?</legend>

      <div className="flex flex-wrap gap-2">
        {axes.map((axis) => {
          const e = etat(axis);
          return (
            <button
              type="button"
              key={axis.id}
              /* Le nom accessible porte la valeur COURANTE et l'action suivante. */
              aria-label={`${axis.name} : ${DIT[e]}. Appuyer pour ${SUITE[e]}.`}
              onClick={() => tourner(axis)}
              className={`min-h-touch rounded-control border px-3 py-2 text-sm transition-colors ${TONS[e]}`}
            >
              {axis.name}
            </button>
          );
        })}
      </div>

      {axes
        .filter((axis) => target[axis.id])
        .map((axis) => {
          const range = target[axis.id];
          const level =
            range.min === axis.scale.min && range.max === axis.lowMax
              ? 'low'
              : range.min === axis.lowMax && range.max === axis.mediumMax
                ? 'medium'
                : range.min === axis.mediumMax && range.max === axis.scale.max
                  ? 'high'
                  : 'custom';
          return (
            <div
              key={axis.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-cave-800 pb-2"
            >
              <span className="text-sm text-cave-50">
                {axis.name}
                {level === 'custom' ? ' · cible personnalisée' : ''}
              </span>
              <span
                role="img"
                aria-label={`${axis.name} : présence souhaitée ${level === 'low' ? 'faible' : level === 'medium' ? 'moyenne' : level === 'high' ? 'forte' : 'personnalisée'}`}
                className="relative block h-3 w-full order-last rounded bg-cave-800 overflow-hidden"
              >
                <span
                  className="absolute inset-y-0 bg-ebc-straw/70 rounded"
                  style={{
                    left: `${(100 * (range.min - axis.scale.min)) / (axis.scale.max - axis.scale.min)}%`,
                    width: `${(100 * (range.max - range.min)) / (axis.scale.max - axis.scale.min)}%`
                  }}
                />
              </span>
              <div
                role="group"
                aria-label={`Présence souhaitée : ${axis.name}`}
                className="flex gap-1"
              >
                {(
                  [
                    ['low', 'Faible'],
                    ['medium', 'Moyenne'],
                    ['high', 'Forte']
                  ] as const
                ).map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    aria-pressed={level === id}
                    onClick={() => choose(axis, id)}
                    className={`min-h-touch rounded-control px-2 text-sm ${level === id ? 'bg-cave-700 text-cave-50' : 'text-cave-400'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
    </fieldset>
  );
}
