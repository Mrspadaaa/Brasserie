import React from 'react';
import { lectureSemaine, type CourbeCaisse, type MouvementNomme } from '../../../domain/calendrierCaisse';
import { chf, classeRangee, jourCourt, sg } from './Courbe';

/**
 * Lire la courbe au doigt (E11, c2-b) : en glissant, la tête lit la semaine sous le doigt (« 3 801 CHF · S12 · 22 mars −487 ») ; sous la bande,
 * un détail de trois lignes donne ses plus gros mouvements, « +n autres » et « la semaine −487 ». Le même détail sert la grande courbe (E12).
 * Les lignes viennent du domaine (`lectureSemaine`) : l'en-tête ne recompte rien.
 */

const classeMv = (v: number) => (v < 0 ? 'ent-m' : 'ent-p');

export interface LectureProps { courbe: CourbeCaisse; index: number }

/** La tête, à la place du chiffre clé : libre de la semaine lue, sa date, sa variation. */
export function LectureTete({ courbe, index, compacte = false }: LectureProps & { compacte?: boolean }) {
  const l = lectureSemaine(courbe, index);
  if (!l) return null;
  return (
    <span className="ent-lit" aria-live="polite">
      <b className={l.libre < 0 ? 'ent-neg' : undefined}>{chf(l.libre)}</b>
      {/* Au téléphone, comme sa maquette (as p-c2b-pendant : « 3 801 S12 −487 ») : le montant, la semaine, sa variation ; « CHF » et la date
          restent pour le lecteur d'écran, et la date se lit dans le détail sous la bande (« S12, 22 – 28 mars »). Plus large : tout (E11). */}
      <span className={compacte ? 'sr-only' : 'ent-lit-u'}> CHF ·</span> <em>{`S${l.numero}`}</em><span className={compacte ? 'sr-only' : 'ent-lit-d'}>{` · ${jourCourt(l.lundi)}`}</span>
      {l.variation !== 0 && <>{' '}<i className={classeMv(l.variation)}>{sg(l.variation)}</i></>}
    </span>
  );
}

export interface LectureDetailProps extends LectureProps {
  /** La rangée d'un mouvement (sa couleur) : vient des choses du modèle, le mouvement n'en porte pas. */
  rangeeDe?: (m: MouvementNomme) => string | undefined;
  /** Montrer le libre de la semaine dans l'entête du détail (grande courbe). */
  libre?: boolean;
}

/** Le détail de la semaine lue : ses plus gros mouvements, « +n autres », « la semaine −487 ». */
export function LectureDetail({ courbe, index, rangeeDe, libre = false }: LectureDetailProps) {
  const l = lectureSemaine(courbe, index);
  const s = courbe.semaines[index];
  if (!l || !s) return null;
  let k = 0;
  const lignes = l.lignes.filter(x => x.genre !== 'semaine');
  const semaine = l.lignes.find(x => x.genre === 'semaine');
  const semaineDite = semaine && semaine.genre === 'semaine' && s.mouvements.length > 0 ? semaine : null;
  return (
    <div className="ent-det" role="group" aria-label={`Détail de ${l.date}`}>
      {/* Sa maquette (as p-c2b-pendant) : « S12 · 22 → 28 mars » à gauche, « la semaine −487 » à droite, sur la même ligne */}
      <div className="ent-det-t"><b>{l.date}</b>{libre ? <span>libre <b>{chf(l.libre)}</b></span> : semaineDite ? <span className="ent-det-s">la semaine <b className={classeMv(semaineDite.centimes)}>{sg(semaineDite.centimes)}</b></span> : null}</div>
      <div className="ent-det-l">
        {lignes.map((ligne, n) => {
          if (ligne.genre === 'autres') return <span key={`a${n}`} className="ent-det-reste">{ligne.texte}</span>;
          const m = s.mouvements[k++];
          return m ? (
            <span key={m.id} className={`ent-det-mv ent-r-${classeRangee(rangeeDe?.(m))}`}><i aria-hidden="true" />{m.nom} <b className={classeMv(m.centimes)}>{sg(m.centimes)}</b></span>
          ) : null;
        })}
        {/* CRITIQUE-5 n° 15 : la tendance de Finances se nomme (« tendance −250 ») ; « rien cette semaine » seulement quand rien ne bouge */}
        {s.tendance !== 0 && <span className="ent-det-reste ent-det-tend" data-tendance>tendance <b className={classeMv(s.tendance)}>{sg(s.tendance)}</b></span>}
        {!s.mouvements.length && s.tendance === 0 && <span className="ent-det-reste">rien cette semaine</span>}
      </div>
      {/* « la semaine » quand il y a des mouvements nommés : seule, la tendance se dit déjà au-dessus (jamais deux fois le même montant) */}
      {libre && semaineDite && <div className="ent-det-s"><span>la semaine</span><b className={classeMv(semaineDite.centimes)}>{sg(semaineDite.centimes)}</b></div>}
    </div>
  );
}
