/**
 * C68-13 : les problèmes résolus, en tête de Stocks › Matériel › Réalisés (le Résolu dit « ira dans Réalisés »). Une ligne : le titre, la retenue et le jour quand ils sont écrits ;
 * un toucher ouvre le problème. Sans résolu : rien (la vue des projets réalisés reste seule).
 */
import { Check } from 'lucide-react';
import type { ResoluRealise } from '../../domain/carnets/realises';
import { dateCourte } from './EtatIA';
import { titreAffiche } from './titre';
import './carnets.css';
import './carnets-fil.css';

export function ResolusRealises({ resolus, onOuvrir }: { resolus: readonly ResoluRealise[]; onOuvrir?: (id: string) => void }) {
  if (!resolus.length) return null;
  return (
    <section className="cn-page cnp-realises" aria-label="Problèmes résolus" data-resolus-realises>
      <h3 className="cnp-h"><Check size={16} aria-hidden /> Problèmes résolus <span className="cn-mono">{resolus.length}</span></h3>
      {resolus.map(r => {
        const detail = [r.retenue ? `retenu : ${r.retenue}` : null, r.le ? dateCourte(r.le) : null].filter(Boolean).join(' · ');
        return (
          <button key={r.id} type="button" className="cnp-ligne" onClick={() => onOuvrir?.(r.id)} aria-label={`${titreAffiche(r.titre)}, résolu, ouvrir`}>
            <span className="cn-sp"><b>{titreAffiche(r.titre)}</b>{detail && <span className="cn-mut">{detail}</span>}</span>
          </button>
        );
      })}
    </section>
  );
}
