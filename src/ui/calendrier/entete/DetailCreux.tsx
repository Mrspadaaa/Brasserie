import React, { useEffect, useRef } from 'react';
import type { HypotheseCaisse } from '../../../domain/calendrier';
import { paliersApres } from '../../../domain/calendrierCaisse';
import { ajouterJours, aujourdhuiDe, causesDuCreux, chf, jourCourt, semaineCourte, sg, type SoldeSemaine } from './Courbe';

/**
 * Le creux et ses causes (E01, q5/z2s) : un toucher sur le chiffre clé déplie « Le creux de S24 : ses causes ». Les sorties qui font le creux,
 * ce qui est mis de côté, les hypothèses avec leur source (le solde de départ, la tendance de Finances : D-179, jamais « exemple » ni réglage
 * inventé), et un lien « Solde et réglages › » vers Finances (D-72).
 *
 * CRITIQUE-6 n° 8 : les causes sont les sorties de la semaine du creux, puis celles des semaines qui y mènent, dans l'ordre chronologique
 * (`causesDuCreux`) ; chaque semaine porte son année quand elle n'est pas celle d'aujourd'hui, en forme courte comme l'en-tête (« S44 ’27 »).
 * Une semaine du creux sans sortie nommée garde sa ligne : sa tendance de Finances, qui la fait descendre.
 *
 * « ensuite… » (D-180, CRITIQUE-5 n° 30) : les paliers suivants, dans la forme de sa base cd1 (`.cd-ens` : « ensuite · 1 782 dès S26 · 28 juin ·
 * 4 359 dès S33 · 16 août ») ; la date seulement en paysage (CHOIX-DU-JOUR, perte 9). Sans palier (le creux est la dernière semaine de
 * l'horizon, ou la courbe ne remonte plus), la ligne le dit avec la date de fin de l'horizon : aucun palier inventé.
 */
export interface DetailCreuxProps {
  courbe: readonly SoldeSemaine[];
  /** La semaine du creux (index dans la courbe). */
  index: number;
  /** Les hypothèses du modèle (`ModeleCalendrier.hypotheses`) : leur texte et leur source. */
  hypotheses?: readonly HypotheseCaisse[];
  onOuvrirFinances?: () => void;
  onFermer: () => void;
  /** Mis de côté, par nom (le modèle les nomme dans les mouvements de la courbe) : « Mis de côté pour le frigo ». */
  nomsMisDeCote?: readonly string[];
  /** En paysage, chaque palier « ensuite » dit aussi sa date (« · 28 juin »). */
  dates?: boolean;
}

export function DetailCreux({ courbe, index, hypotheses, onOuvrirFinances, onFermer, nomsMisDeCote, dates = false }: DetailCreuxProps) {
  const ref = useRef<HTMLElement>(null);
  const s = courbe[index];
  const { debut, causes } = causesDuCreux(courbe, index);
  const mis = s.reserve;
  // La semaine de référence est celle d'aujourd'hui (CAL-PASSE : la courbe peut commencer au passé, `courbe[0]` n'est plus aujourd'hui).
  const reference = courbe[aujourdhuiDe(courbe)]?.lundi ?? s.lundi;
  const sem = (lundi: string) => semaineCourte(lundi, reference);
  const paliers = paliersApres({ semaines: courbe }, index);
  // La fin de l'horizon : le dimanche de la dernière semaine de la courbe, avec son année si elle n'est pas celle d'aujourd'hui.
  const derniere = courbe[courbe.length - 1];
  const finHorizon = derniere ? (() => {
    const dimanche = ajouterJours(derniere.lundi, 6);
    return dimanche.slice(0, 4) === reference.slice(0, 4) ? jourCourt(dimanche) : `${jourCourt(dimanche)} ${dimanche.slice(0, 4)}`;
  })() : '';
  const avecAn = causes.some(c => sem(c.lundi).includes('’')) || sem(s.lundi).includes('’');
  const sansSortie = !causes.some(c => c.index === index) && s.tendance < 0;
  useEffect(() => {
    const dehors = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t && (ref.current?.contains(t) || t.closest?.('[data-ent-cle]'))) return;
      onFermer();
    };
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    document.addEventListener('pointerdown', dehors, true);
    document.addEventListener('keydown', touche);
    return () => { document.removeEventListener('pointerdown', dehors, true); document.removeEventListener('keydown', touche); };
  }, [onFermer]);
  return (
    <section ref={ref} className={avecAn ? 'ent-pop ent-creux ent-creux--an' : 'ent-pop ent-creux'} aria-label={`Le creux de ${sem(s.lundi)} : ses causes`}>
      <h3 className="ent-pop-h">{`Le creux de ${sem(s.lundi)} : ses causes`}</h3>
      <p className="ent-pop-t">
        {debut < index ? `${sem(courbe[debut].lundi)} → ${sem(s.lundi)}` : sem(s.lundi)} · <b className={s.libre < 0 ? 'ent-neg' : undefined}>{chf(s.libre)}</b> à dépenser
      </p>
      {causes.map((c, k) => (
        <div className="ent-pop-l" key={`${c.index}-${k}`} data-cause-semaine={c.numero} data-cause-index={c.index}>
          <span className="ent-w">{sem(c.lundi)}</span><span className="ent-nm">{c.nom}</span><b className="ent-m">{chf(c.centimes)}</b>
        </div>
      ))}
      {sansSortie && (
        <div className="ent-pop-l" data-cause-semaine={s.numero} data-cause-index={index} data-cause-tendance>
          <span className="ent-w">{sem(s.lundi)}</span><span className="ent-nm">tendance de Finances</span><b className="ent-m">{sg(s.tendance)}</b>
        </div>
      )}
      {!causes.length && !sansSortie && <p className="ent-pop-v">Aucune sortie nommée avant ce creux.</p>}
      {mis > 0 && (
        <div className="ent-pop-l"><span className="ent-w"><i className="ent-hach-ico" aria-hidden="true" /></span><span className="ent-nm">{nomsMisDeCote?.length ? `Mis de côté pour ${nomsMisDeCote.join(', ')}` : 'Mis de côté'}</span><b className="ent-f">{chf(mis)}</b></div>
      )}
      {paliers.length > 0 ? (
        <p className="ent-ens" data-ensuite aria-label={`ensuite ${paliers.map(p => `${chf(p.centimes)} dès ${sem(p.lundi)}`).join(', ')}`}>
          <span>ensuite</span>
          {paliers.map(p => (
            <i key={p.index}><b className={p.centimes < 0 ? 'ent-neg' : undefined}>{chf(p.centimes)}</b>{` dès ${sem(p.lundi)}`}{dates ? ` · ${jourCourt(p.lundi)}` : ''}</i>
          ))}
        </p>
      ) : derniere ? (
        <p className="ent-ens" data-ensuite data-ensuite-fin>
          <span>ensuite</span>{' · '}
          <i>{index === courbe.length - 1 ? `fin de l’horizon, le ${finHorizon}` : `plus de palier jusqu’à la fin de l’horizon, le ${finHorizon}`}</i>
        </p>
      ) : null}
      {hypotheses && hypotheses.length > 0 && (
        <ul className="ent-hyp" aria-label="Hypothèses de la courbe">
          {hypotheses.map(h => <li key={h.id}>{h.texte} · source : {h.source}</li>)}
        </ul>
      )}
      <a className="ent-lien" href="#finances" onClick={e => { e.preventDefault(); onOuvrirFinances?.(); onFermer(); }}>Solde et réglages ›</a>
    </section>
  );
}
