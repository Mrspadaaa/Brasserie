import React from 'react';
import { Clock } from 'lucide-react';
import { Sheet } from '../../Sheet';
import { jourLisible, type Retard } from '../../../domain/calendrier';

/**
 * « Maintenant : 2 en retard » (E08, i6) : le toucher sur la pastille ouvre le détail. Chaque ligne dit une DATE (« échéance le 3 nov. »), jamais
 * « en retard de 7 j » ni « depuis N jours » (D-19, LIENS-APP « Jamais »). Les retards viennent du domaine (`retardsDe` : tâches datées passées,
 * brassins planifiés passés, ce qui est dû et non payé, densité non relevée, courses) ; ce composant ne compte aucun jour.
 */

/** Un compteur de jours dans un texte de la source : il est écarté, la date seule reste. */
const COMPTEUR = /\b(depuis|de|en retard de)\s+\d+\s*j(ours?)?\b/i;

/** Le texte d'une ligne : le détail de la source, sans compteur, avec la date du retard quand le détail ne la dit pas. */
export function texteRetard(r: Retard): string {
  const detail = r.detail && !COMPTEUR.test(r.detail) ? r.detail : '';
  if (!r.jour) return detail;
  const date = jourLisible(r.jour);
  return detail.includes(date) ? detail : [detail, date].filter(Boolean).join(' · ');
}

export const titreRetards = (n: number) => `Maintenant : ${n} en retard`;

export interface RetardsProps {
  retards: readonly Retard[];
  onOuvrir?: (r: Retard) => void;
  onFermer: () => void;
}

export function Retards({ retards, onOuvrir, onFermer }: RetardsProps) {
  // Par date ; ce qui n'a pas de date (densité, courses) à la fin.
  const tries = [...retards].sort((a, b) => (a.jour ?? '9999').localeCompare(b.jour ?? '9999'));
  return (
    <Sheet open onClose={onFermer} title={titreRetards(retards.length)}>
      <ul className="ent-ret" aria-label="Ce qui est en retard, par date">
        {tries.map(r => {
          const corps = (
            <>
              <span className="ent-ret-i" aria-hidden="true"><Clock size={18} /></span>
              <span className="ent-ret-t"><b>{r.titre}</b><small>{texteRetard(r)}</small></span>
            </>
          );
          return (
            <li key={r.id}>
              {onOuvrir ? <button type="button" className="ent-ret-l" onClick={() => onOuvrir(r)}>{corps}</button> : <div className="ent-ret-l">{corps}</div>}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
