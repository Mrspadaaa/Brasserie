import React, { useLayoutEffect, useRef, useState } from 'react';
import { lectureSemaine, type CourbeCaisse, type MouvementNomme } from '../../../domain/calendrierCaisse';
import { chf, classeRangee, jourCourt, sg } from './Courbe';

/**
 * Lire la courbe au doigt (E11, c2-b) : en glissant, la tête lit la semaine sous le doigt (« 3 801 CHF · S12 · 22 mars −487 ») ; sous la bande,
 * un détail de trois lignes donne ses plus gros mouvements, « +n autres » et « la semaine −487 ». Le même détail sert la grande courbe (E12).
 * Les lignes viennent du domaine (`lectureSemaine`) : l'en-tête ne recompte rien.
 */

const classeMv = (v: number) => (v < 0 ? 'ent-m' : 'ent-p');

export interface LectureProps { courbe: CourbeCaisse; index: number }

/**
 * Les trois formes de la tête, de la plus longue à la plus courte, comme sa maquette (as/cal.html, `lecture`) : « −1 537 CHF · S19 · 4 mai −120 »,
 * puis sans « CHF », puis sans la date. Ce qui est retiré reste pour le lecteur d'écran.
 */
export const FORMES_TETE = ['longue', 'sans-chf', 'courte'] as const;
export type FormeTete = 0 | 1 | 2;

/**
 * « La forme la plus longue qui tient » (as/cal.html l. 1311, CRITIQUE-7 n° 5, E11) : la première forme dont la largeur mesurée tient dans la
 * place laissée par les boutons de tête (4 px d'écart compris par l'appelant). Aucune ne tient : la plus courte. Place inconnue (rien mesuré) :
 * la plus longue, comme sa maquette quand elle ne trouve pas les boutons.
 */
export function formeTete(largeurs: readonly number[], place: number | null): FormeTete {
  if (place === null || !Number.isFinite(place)) return 0;
  const i = largeurs.findIndex(w => w <= place);
  return (i < 0 ? Math.max(0, largeurs.length - 1) : i) as FormeTete;
}

/** La tête, à la place du chiffre clé : libre de la semaine lue, sa date, sa variation. */
export function LectureTete({ courbe, index, boutons }: LectureProps & { boutons?: React.RefObject<HTMLElement | null> }) {
  const l = lectureSemaine(courbe, index);
  const ref = useRef<HTMLSpanElement>(null);
  const [forme, setForme] = useState<FormeTete>(0);
  // Mesurée avant d'être peinte, à chaque semaine lue : chaque forme est posée dans le DOM, sa fin mesurée contre le bord gauche des boutons
  // de tête (ils restent, E11), puis le DOM est rendu à React et la forme retenue devient l'état.
  useLayoutEffect(() => {
    const el = ref.current, bt = boutons?.current;
    if (!el || !bt) { setForme(0); return; }
    const rb = bt.getBoundingClientRect(), re = el.getBoundingClientRect();
    // Les boutons à côté, sur la même ligne (pas dessous, comme en paysage) : sinon, toute la place.
    const memeLigne = rb.width > 0 && rb.top < re.bottom && rb.bottom > re.top;
    const place = rb.width > 0 && re.width > 0 ? (memeLigne ? rb.left - 4 : re.right) - re.left : null;
    const u = el.querySelector<HTMLElement>('[data-lit="u"]'), d = el.querySelector<HTMLElement>('[data-lit="d"]');
    if (place === null || !u || !d) { setForme(0); return; }
    // La fin de la forme : le bord droit du dernier morceau visible (un morceau `sr-only` n'occupe pas la ligne).
    const fin = () => Math.max(...Array.from(el.children).filter(c => !c.classList.contains('sr-only')).map(c => c.getBoundingClientRect().right));
    const avant = [u.className, d.className];
    const largeurs = ([0, 1, 2] as const).map(f => {
      u.className = f >= 1 ? 'sr-only' : 'ent-lit-u';
      d.className = f >= 2 ? 'sr-only' : 'ent-lit-d';
      return fin() - re.left;
    });
    [u.className, d.className] = avant;
    setForme(formeTete(largeurs, place));
  }, [index, l?.libre, l?.variation, boutons]);
  if (!l) return null;
  return (
    <span ref={ref} className="ent-lit" aria-live="polite" data-forme={FORMES_TETE[forme]}>
      <b className={l.libre < 0 ? 'ent-neg' : undefined}>{chf(l.libre)}</b>
      <span data-lit="u" className={forme >= 1 ? 'sr-only' : 'ent-lit-u'}> CHF ·</span> <em>{`S${l.numero}`}</em><span data-lit="d" className={forme >= 2 ? 'sr-only' : 'ent-lit-d'}>{` · ${jourCourt(l.lundi)}`}</span>
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
