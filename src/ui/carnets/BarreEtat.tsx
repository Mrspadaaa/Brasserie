/**
 * D451 (maquettes3/v01) : la barre d'état d'un problème : la jauge à 4 pastilles et les 4 mots, l'actif coloré (Noté, Je cherche, Décidé, Résolu).
 * Les quatre états se touchent dans les deux sens, sans garde (CADRAGE) ; la jauge n'est pas une « étape n sur m » (K4) : l'état reste écrit à côté,
 * en toutes lettres, et c'est lui qu'on touche. Sans rappel, la barre se lit seulement (rien qui ne fasse rien).
 */
import type { EtatSuivi } from '../../domain/carnets/modele';
import { ETATS_SUIVI } from '../../domain/carnets/modele';
import { LIBELLE_ETAT } from '../../domain/carnets/suivi';

export function BarreEtat({ etat, onEtat, droite }: { etat: EtatSuivi; onEtat?: (vers: EtatSuivi) => void; droite?: React.ReactNode }) {
  const rang = ETATS_SUIVI.indexOf(etat);
  return (
    <div className="cnp-etat" data-etat={etat} role="group" aria-label={`État : ${LIBELLE_ETAT[etat]}`}>
      <span className="cnp-jauge" aria-hidden>{ETATS_SUIVI.map((k, i) => <i key={k} data-on={i <= rang ? k === etat ? 'actif' : 'oui' : undefined} data-etat={etat} />)}</span>
      {ETATS_SUIVI.map(k => {
        const actif = k === etat;
        return onEtat
          ? <button key={k} type="button" className="cnp-etat-mot" data-k={k} aria-pressed={actif} onClick={() => { if (!actif) onEtat(k); }}>{LIBELLE_ETAT[k]}</button>
          : <span key={k} className="cnp-etat-mot" data-k={k} aria-current={actif ? 'true' : undefined}>{LIBELLE_ETAT[k]}</span>;
      })}
      <span className="cn-sp" />
      {droite}
    </div>
  );
}
