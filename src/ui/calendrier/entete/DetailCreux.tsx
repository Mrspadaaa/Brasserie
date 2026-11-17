import React, { useEffect, useRef } from 'react';
import { semaineAvecAn, type HypotheseCaisse } from '../../../domain/calendrier';
import { paliersApres } from '../../../domain/calendrierCaisse';
import { causesDuCreux, chf, jourCourt, type SoldeSemaine } from './Courbe';

/**
 * Le creux et ses causes (E01, q5/z2s) : un toucher sur le chiffre clé déplie « Le creux de S24 : ses causes ». Les sorties qui font le creux,
 * ce qui est mis de côté, les hypothèses avec leur source (le solde de départ, la tendance de Finances : D-179, jamais « exemple » ni réglage
 * inventé), et un lien « Solde et réglages › » vers Finances (D-72).
 * « ensuite… » (D-180, CRITIQUE-5 n° 30) : les paliers suivants, dans la forme de sa base cd1 (`.cd-ens` : « ensuite · 1 782 dès S26 · 28 juin ·
 * 4 359 dès S33 · 16 août ») ; la date seulement en paysage (CHOIX-DU-JOUR, perte 9).
 * La semaine porte son année quand elle n'est pas celle d'aujourd'hui : « Le creux de S44 2027 » (CRITIQUE-5 n° 2).
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
  // La semaine de référence est la première de la courbe : celle d'aujourd'hui.
  const reference = courbe[0]?.lundi ?? s.lundi;
  const sem = (lundi: string) => semaineAvecAn(lundi, reference);
  const paliers = paliersApres({ semaines: courbe }, index);
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
    <section ref={ref} className="ent-pop ent-creux" aria-label={`Le creux de ${sem(s.lundi)} : ses causes`}>
      <h3 className="ent-pop-h">{`Le creux de ${sem(s.lundi)} : ses causes`}</h3>
      <p className="ent-pop-t">
        {causes.length ? `${sem(courbe[debut].lundi)} → ${sem(s.lundi)}` : sem(s.lundi)} · <b className={s.libre < 0 ? 'ent-neg' : undefined}>{chf(s.libre)}</b> à dépenser
      </p>
      {causes.map((c, k) => (
        <div className="ent-pop-l" key={`${c.index}-${k}`}><span className="ent-w">S{c.numero}</span><span className="ent-nm">{c.nom}</span><b className="ent-m">{chf(c.centimes)}</b></div>
      ))}
      {!causes.length && <p className="ent-pop-v">Aucune sortie nommée avant ce creux.</p>}
      {mis > 0 && (
        <div className="ent-pop-l"><span className="ent-w"><i className="ent-hach-ico" aria-hidden="true" /></span><span className="ent-nm">{nomsMisDeCote?.length ? `Mis de côté pour ${nomsMisDeCote.join(', ')}` : 'Mis de côté'}</span><b className="ent-f">{chf(mis)}</b></div>
      )}
      {paliers.length > 0 && (
        <p className="ent-ens" data-ensuite aria-label={`ensuite ${paliers.map(p => `${chf(p.centimes)} dès ${sem(p.lundi)}`).join(', ')}`}>
          <span>ensuite</span>
          {paliers.map(p => (
            <i key={p.index}><b className={p.centimes < 0 ? 'ent-neg' : undefined}>{chf(p.centimes)}</b>{` dès ${sem(p.lundi)}`}{dates ? ` · ${jourCourt(p.lundi)}` : ''}</i>
          ))}
        </p>
      )}
      {hypotheses && hypotheses.length > 0 && (
        <ul className="ent-hyp" aria-label="Hypothèses de la courbe">
          {hypotheses.map(h => <li key={h.id}>{h.texte} · source : {h.source}</li>)}
        </ul>
      )}
      <a className="ent-lien" href="#finances" onClick={e => { e.preventDefault(); onOuvrirFinances?.(); onFermer(); }}>Solde et réglages ›</a>
    </section>
  );
}
