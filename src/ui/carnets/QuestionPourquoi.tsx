/**
 * D451 (maquettes3/v03) : les deux questions honnêtes de la décision.
 * « Pourquoi B plutôt que A ? Tes notes ne le disent pas. · Ajouter » : seulement quand aucune de ses notes ne dit pourquoi (`pourquoiDe` rend `null`,
 * `questionPourquoi` le dit) ; aucune citation inventée. « Ajouter » amorce le champ du bas : le message reste dans ce carnet.
 * « Toujours le bon choix ? · Oui · Pas sûr » : la relecture d'une décision ; la réponse se garde (`suivi.relu`), rien d'autre ne change.
 */
import { Sparkles } from 'lucide-react';
import type { CarnetDoc, MessageDoc } from '../../domain/carnets/modele';
import { suiviDe } from '../../domain/carnets/suivi';
import { questionPourquoi } from './filRegles';
import { libelleJour } from './filRegles';

export function QuestionPourquoi({ c, messages, onEcrire }: { c: CarnetDoc; messages: readonly MessageDoc[]; onEcrire?: (amorce: string) => void }) {
  const q = questionPourquoi(c, messages);
  if (!q) return null;
  return (
    <div className="cnp-question" data-question="pourquoi">
      <Sparkles size={18} aria-hidden />
      <span className="cn-sp"><b>{q.titre}</b> Tes notes ne le disent pas.</span>
      {onEcrire && <button type="button" className="cnp-lien" onClick={() => onEcrire(q.amorce)}>Ajouter</button>}
    </div>
  );
}

export function QuestionRelu({ c, onRelu }: { c: CarnetDoc; onRelu?: (reponse: 'oui' | 'pas-sur') => void }) {
  const relu = suiviDe(c).relu;
  if (!onRelu && !relu) return null;
  return (
    <div className="cnp-relu" data-question="relu" role="group" aria-label="Toujours le bon choix ?">
      <span className="cn-sp">{relu ? <>Relu le {libelleJour(relu.le.slice(0, 10))} : <b>{relu.reponse === 'oui' ? 'oui, toujours' : 'pas sûr'}</b></> : 'Toujours le bon choix ?'}</span>
      {onRelu && (
        <>
          <button type="button" className="cnp-btn" aria-pressed={relu?.reponse === 'oui'} onClick={() => onRelu('oui')}>Oui</button>
          <button type="button" className="cnp-btn" aria-pressed={relu?.reponse === 'pas-sur'} onClick={() => onRelu('pas-sur')}>Pas sûr</button>
        </>
      )}
    </div>
  );
}
