import React from 'react';
import { ChevronDown } from 'lucide-react';
import { yeastRecipeHopSummary } from '../domain/yeastRecipeDesign';
import type { RecipeSnapshot } from '../types';

/**
 * p3 / 2C : à l'ensemencement, les houblons à cru (dry hop) en une ligne : le total (g et g/L), une puce par houblon, la phase.
 * Aucun jour inventé : un jour de dry hop ne dit pas une phase biologique. « phase ? » tant que la recette ne la nomme pas ;
 * dépliée, une ligne par houblon. Rien quand la recette n'a pas de dry hop. L'inconnu n'est jamais 0 (poids absent : sans g).
 */
const fr = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',').replace(/,0$/, '');
const PHASE = { active: 'pendant la fermentation', post: 'après la fermentation', unknown: 'phase ?' } as const;

export function BrewACru({ recipe }: { recipe: Pick<RecipeSnapshot, 'hops' | 'volumeL'> }) {
  const resume = yeastRecipeHopSummary(recipe as Parameters<typeof yeastRecipeHopSummary>[0]);
  if (!resume.additions.length) return null;
  const total = resume.totalG !== undefined
    ? `${fr(resume.totalG)} g${resume.doseGL !== undefined ? ` · ${fr(resume.doseGL)} g/L` : ''}`
    : null;
  const phases = new Set(resume.additions.map((h) => h.phase));
  const phaseDite = resume.unknownCount === 0 && phases.size === 1 ? PHASE[[...phases][0]] : resume.unknownCount === 0 ? 'phases dites' : 'phase ?';
  return (
    <details className="bz-acru" role="group" aria-label="À cru">
      <summary>
        <span className="bz-acru-lib">À cru{total && <small>{total}</small>}</span>
        <span className="bz-acru-puces">
          {resume.additions.map((h, i) => (
            <span key={`${h.name}-${i}`}>{h.weightG !== undefined ? `${h.name} ${fr(h.weightG)}` : h.name}</span>
          ))}
        </span>
        <span className="bz-acru-phase" data-inconnue={resume.unknownCount > 0 || undefined}>{phaseDite}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <ul className="bz-acru-detail">
        {resume.additions.map((h, i) => (
          <li key={`${h.name}-${i}`}>
            {[
              h.name,
              h.weightG !== undefined ? `${fr(h.weightG)} g` : 'dose ?',
              h.doseGL !== undefined ? `${fr(h.doseGL)} g/L` : null,
              PHASE[h.phase]
            ].filter(Boolean).join(' · ')}
          </li>
        ))}
      </ul>
    </details>
  );
}
