import React, { useRef } from 'react';
import { compte } from '../../../services/plural';
import './archives.css';

/**
 * Archives = m1ar-c (choix du brasseur, 15.11) : la frise des années avec la poignée. Pièces par mois, une colonne par année (ses mois jusqu'à
 * aujourd'hui pour l'année en cours) ; la zone rangée est encadrée, la poignée saute d'une fin d'année à l'autre (pas de mois), le pointillé
 * garde l'ancienne limite. Équivalent au toucher : toucher une année range jusqu'à sa fin ; au clavier : flèches, début, fin.
 * Un mois sans pièce avant la première saisie n'est pas un zéro : pas de barre ; un mois vide après elle laisse un trait.
 */
export interface AnneeFrise {
  annee: number;
  /** Pièces par mois (12 valeurs). */
  mois: number[];
  /** Combien de mois la colonne montre (12, ou le mois courant pour l'année en cours). */
  affiches: number;
  total: number;
  /** Mois portant une facture ouverte qui resterait au suivi une fois l'année rangée (barre rouge). */
  ouverts: boolean[];
  /** Mois avant la première pièce de l'historique : rien à dire, pas de barre. */
  avantDebut: boolean[];
  rangeable: boolean;
}

export function FriseArchives({ annees, limite, stockee, maxMois, suivi, onLimite }: {
  annees: AnneeFrise[]; limite: number | null; stockee: number | null; maxMois: number; suivi: string; onLimite: (annee: number | null) => void;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const totalMois = annees.reduce((n, a) => n + a.affiches, 0) || 1;
  const apres = (annee: number | null): number => annee == null ? 0 : annees.filter(a => a.annee <= annee).reduce((n, a) => n + a.affiches, 0) / totalMois * 100;
  const positions: Array<number | null> = [null, ...annees.filter(a => a.rangeable).map(a => a.annee)];
  const pas = (depart: number | null, sens: -1 | 1) => positions[Math.max(0, Math.min(positions.length - 1, positions.indexOf(depart) + sens))];
  const suivre = (clientX: number) => {
    const boite = cadre.current?.getBoundingClientRect();
    if (!boite || !boite.width) return;
    const f = (clientX - boite.left) / boite.width * 100;
    const proche = positions.reduce((meilleur, p) => Math.abs(apres(p) - f) < Math.abs(apres(meilleur) - f) ? p : meilleur, positions[0]);
    if (proche !== limite) onLimite(proche);
  };
  const touche = (e: React.KeyboardEvent) => {
    const sens = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (sens) { e.preventDefault(); onLimite(pas(limite, sens)); }
    else if (e.key === 'Home') { e.preventDefault(); onLimite(positions[0]); }
    else if (e.key === 'End') { e.preventDefault(); onLimite(positions[positions.length - 1]); }
  };
  const pos = apres(limite);
  return <div className="arc-fr" ref={cadre} data-vaul-no-drag="">
    <div className="arc-row">{annees.map(a => <button type="button" key={a.annee} className="arc-an" style={{ flex: `${a.affiches} 1 0` }}
      data-rangee={limite != null && a.annee <= limite || undefined} disabled={!a.rangeable}
      aria-label={`${a.annee} : ${compte(a.total, 'pièce')}${a.rangeable ? `, ranger jusqu’à fin ${a.annee}` : ', année en cours'}`} onClick={() => onLimite(a.annee)}>
      <span className="arc-bars" aria-hidden="true">{a.mois.slice(0, a.affiches).map((n, i) => a.avantDebut[i] ? <i key={i} className="arc-vide"/>
        : <i key={i} data-ouvert={a.ouverts[i] || undefined} style={{ height: `${n ? Math.max(4, Math.round(n / maxMois * 54)) : 2}px` }}/>)}</span>
      <span className="arc-yl">{a.annee}<small className="arc-m">{a.total}</small></span>
    </button>)}</div>
    {limite != null && <span className="arc-rang" style={{ width: `${pos}%` }} aria-hidden="true"/>}
    {stockee != null && stockee !== limite && <span className="arc-old" style={{ left: `${apres(stockee)}%` }} aria-hidden="true"/>}
    {suivi && <span className="arc-out" style={{ left: `clamp(0px, calc(${pos}% - 150px), calc(100% - 150px))` }}><span className="arc-late">{suivi} ↓</span></span>}
    <span className="arc-hdl" style={{ left: `${pos}%` }} data-bord={pos <= 0 ? 'debut' : undefined} role="slider" tabIndex={0} aria-label="Limite du rangement : ranger jusqu’à la fin de l’année"
      aria-valuemin={0} aria-valuemax={positions.length - 1} aria-valuenow={Math.max(0, positions.indexOf(limite))}
      aria-valuetext={limite == null ? 'rien n’est rangé' : `rangé jusqu’à fin ${limite}`} onKeyDown={touche}
      onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); }}
      onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') suivre(e.clientX); }}><span className="arc-knob">‹›</span></span>
  </div>;
}
