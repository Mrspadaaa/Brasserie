import React from 'react';
import { Copy, Filter, Link2, Pin, Star, Trash2 } from 'lucide-react';
import type { ChoseCalendrier } from '../../../domain/calendrier';

/**
 * f5-a (E31) : l'appui long sur une barre ouvre un menu sous elle. Épingler (la chose reste visible si sa rangée est masquée), Étoile (sur la
 * courbe), « <Rangée> seules » (filtre de la visite), Dupliquer avec son effet, Lier à un brassin ou un client, Retirer avec son effet.
 * Retirer enlève la date : la chose reste dans sa source, sans date, et Annuler la remet (L33 : on ne supprime jamais, on ne cascade jamais).
 */

export interface LiensPossibles {
  brassins: ReadonlyArray<{ id: string; nom: string }>;
  clients: ReadonlyArray<{ id: string; nom: string }>;
}

export interface MenuAppuiLongProps {
  chose: ChoseCalendrier;
  nomRangee: string;
  ancre: HTMLElement | null;
  epinglee: boolean;
  etoilee: boolean;
  /** Combien de rangées « X seules » masquerait. */
  autresRangees: number;
  /** « S51 » et son effet « +1 180 » ; `null` : on ne duplique pas cette chose d'ici. */
  dupliquer: { libelle: string; effet?: string } | null;
  /** L'effet de Retirer sur la caisse (« S50 : 5 120 → 3 940 ») ; `null` : se retire dans sa source, avec la raison. */
  retirer: { effet?: string } | { raison: string };
  liens: LiensPossibles;
  /** Un brassin se rouvre par sa fiche : jamais retiré d'ici. */
  onEpingler: () => void;
  onEtoile: () => void;
  onSeules: () => void;
  onDupliquer: () => void;
  onLier: (liens: { batchId?: string; clientId?: string }, nom: string) => void;
  onRetirer: () => void;
  onFermer: () => void;
}

export const MenuAppuiLong: React.FC<MenuAppuiLongProps> = props => {
  const { chose, nomRangee, ancre, epinglee, etoilee, autresRangees, dupliquer, retirer, liens } = props;
  const [lier, setLier] = React.useState(false);
  const racine = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const dehors = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && racine.current?.contains(t)) return;
      if (t && ancre?.contains(t)) return;
      props.onFermer();
    };
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onFermer(); };
    document.addEventListener('pointerdown', dehors, true);
    document.addEventListener('keydown', touche);
    return () => { document.removeEventListener('pointerdown', dehors, true); document.removeEventListener('keydown', touche); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancre]);

  const rect = ancre?.getBoundingClientRect();
  const largeur = typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 440 : Math.min(300, (typeof window !== 'undefined' ? window.innerWidth : 390) - 96);
  const gauche = rect ? Math.max(8, Math.min((typeof window !== 'undefined' ? window.innerWidth : 390) - largeur - 8, rect.left + rect.width / 2 - largeur / 2)) : 88;
  const haut = rect ? rect.bottom + 8 : 120;
  const retirable = 'raison' in retirer ? null : retirer;

  return (
    <div ref={racine} role="menu" aria-label={`${chose.titre} : gestes`} className="cal-menu" data-menu style={{ top: haut, left: gauche, width: largeur }}>
      {!lier ? (
        <>
          <div className="cal-m3">
            <button type="button" role="menuitemcheckbox" aria-checked={epinglee} onClick={props.onEpingler} className="cal-m3b">
              <Pin size={20} aria-hidden="true" />Épingler<small>reste visible, rangée masquée</small>
            </button>
            <button type="button" role="menuitemcheckbox" aria-checked={etoilee} onClick={props.onEtoile} className="cal-m3b">
              <Star size={20} aria-hidden="true" />Étoile<small>sur la courbe</small>
            </button>
            <button type="button" role="menuitem" onClick={props.onSeules} className="cal-m3b">
              <Filter size={20} aria-hidden="true" />{nomRangee} seules<small>{autresRangees} rangée{autresRangees > 1 ? 's' : ''} masquée{autresRangees > 1 ? 's' : ''}</small>
            </button>
          </div>
          {dupliquer && (
            <button type="button" role="menuitem" onClick={props.onDupliquer} className="cal-ml">
              <Copy size={20} aria-hidden="true" /><span>Dupliquer en {dupliquer.libelle}</span>{dupliquer.effet && <em>{dupliquer.effet}</em>}
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => setLier(true)} className="cal-ml">
            <Link2 size={20} aria-hidden="true" /><span>Lier à un brassin, un client</span>
          </button>
          {retirable ? (
            <button type="button" role="menuitem" onClick={props.onRetirer} className="cal-ml cal-ml-ret">
              <Trash2 size={20} aria-hidden="true" /><span>Retirer</span>{retirable.effet && <em>{retirable.effet}</em>}
            </button>
          ) : (
            <p className="cal-mn">{'raison' in retirer ? retirer.raison : ''}</p>
          )}
        </>
      ) : (
        <>
          <p className="cal-mn">Lier <b>{chose.titre}</b> à :</p>
          {liens.brassins.filter(b => b.id !== (chose.source.genre === 'batch' ? chose.source.id : '')).map(b => (
            <button key={b.id} type="button" role="menuitem" onClick={() => props.onLier({ batchId: b.id }, b.nom)} className="cal-ml">
              <Link2 size={20} aria-hidden="true" /><span>{b.nom}</span><em>brassin</em>
            </button>
          ))}
          {liens.clients.map(c => (
            <button key={c.id} type="button" role="menuitem" onClick={() => props.onLier({ clientId: c.id }, c.nom)} className="cal-ml">
              <Link2 size={20} aria-hidden="true" /><span>{c.nom}</span><em>client</em>
            </button>
          ))}
          {!liens.brassins.length && !liens.clients.length && <p className="cal-mn">Aucun brassin ni client à lier pour l’instant.</p>}
        </>
      )}
    </div>
  );
};
