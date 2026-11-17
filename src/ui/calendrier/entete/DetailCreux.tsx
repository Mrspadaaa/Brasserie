import React, { useEffect, useRef } from 'react';
import type { HypotheseCaisse } from '../../../domain/calendrier';
import { causesDuCreux, chf, type SoldeSemaine } from './Courbe';

/**
 * Le creux et ses causes (E01, q5/z2s) : un toucher sur le chiffre clé déplie « Le creux de S24 : ses causes ». Les sorties qui font le creux,
 * ce qui est mis de côté, les hypothèses avec leur source (le solde de départ, la tendance de Finances : D-179, jamais « exemple » ni réglage
 * inventé), et un lien « Solde et réglages › » vers Finances (D-72). Le « ensuite… » de z2s reste caché, comme dans la maquette (D-180).
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
}

export function DetailCreux({ courbe, index, hypotheses, onOuvrirFinances, onFermer, nomsMisDeCote }: DetailCreuxProps) {
  const ref = useRef<HTMLElement>(null);
  const s = courbe[index];
  const { debut, causes } = causesDuCreux(courbe, index);
  const mis = s.reserve;
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
    <section ref={ref} className="ent-pop ent-creux" aria-label={`Le creux de S${s.numero} : ses causes`}>
      <p className="ent-pop-t">
        {causes.length ? `S${courbe[debut].numero} → S${s.numero}` : `S${s.numero}`} · <b className={s.libre < 0 ? 'ent-neg' : undefined}>{chf(s.libre)}</b> à dépenser
      </p>
      {causes.map((c, k) => (
        <div className="ent-pop-l" key={`${c.index}-${k}`}><span className="ent-w">S{c.numero}</span><span className="ent-nm">{c.nom}</span><b className="ent-m">{chf(c.centimes)}</b></div>
      ))}
      {!causes.length && <p className="ent-pop-v">Aucune sortie nommée avant ce creux.</p>}
      {mis > 0 && (
        <div className="ent-pop-l"><span className="ent-w"><i className="ent-hach-ico" aria-hidden="true" /></span><span className="ent-nm">{nomsMisDeCote?.length ? `Mis de côté pour ${nomsMisDeCote.join(', ')}` : 'Mis de côté'}</span><b className="ent-f">{chf(mis)}</b></div>
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
