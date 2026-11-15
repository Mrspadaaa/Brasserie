import React, { useLayoutEffect, useRef, useState } from 'react';
import type { PointPiste } from '../domain/brewDayPiste';
import { rangerCote } from './BrewFrise';
import './brew-piste.css';

/* La piste de l'horloge (p2c) : un rail, des ronds (rendez-vous, ajouts), un carré de fin, et dessous les mots, rangés sans se couvrir
   (`rangerCote` de la frise : même problème de rangement d'étiquettes). Aucune heure ici : les mots arrivent prêts. */

const LARGEUR_PAR_DEFAUT = 320;

export function BrewPiste({ points, avance, nom, booster, ton }: { points: readonly PointPiste[]; avance: number; nom: string; booster?: string; ton?: Record<string, 'ocre' | 'red'> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(LARGEUR_PAR_DEFAUT);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const mesurer = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setLargeur((a) => (Math.abs(a - w) < 1 ? a : w));
    };
    mesurer();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  if (!points.length) return null;
  const mots = points.filter((p) => p.texte);
  // les mots se rangent par position (0–100) : on passe la position comme « heure » d'une piste de 0 à 100
  const rangs = rangerCote(mots.map((p) => ({ id: p.id, texte: p.texte, heure: p.pos })), { debut: 0, fin: 100, largeur });
  const lignes = Math.max(1, ...rangs.map((r) => r.rangee + 1));
  return (
    <div className="bz-pi" data-booster={booster} aria-label={nom} role="group">
      <div className="bz-pi-pistes" ref={ref}>
        <div className="bz-pi-tr"><u style={{ width: `${avance.toFixed(1)}%` }} /></div>
        {points.map((p) => (
          <span key={p.id} className={`bz-pi-pt ${p.etat}`} data-point={p.id} style={{ left: `${p.pos.toFixed(2)}%` }} />
        ))}
      </div>
      <div className="bz-pi-pl" style={{ '--bz-pi-l': lignes } as React.CSSProperties}>
        {rangs.map((r) => {
          const p = mots.find((m) => m.id === r.id)!;
          return (
            <span key={r.id} className={`bz-pi-mot r${r.rangee}${r.droite ? ' dr' : ''}${ton?.[r.id] ? ` ${ton[r.id]}` : ''}`} style={{ left: `${r.gauche.toFixed(2)}%` }}>
              {p.texte}
            </span>
          );
        })}
      </div>
    </div>
  );
}
