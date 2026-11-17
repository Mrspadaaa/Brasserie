import React from 'react';
import { Copy, ExternalLink, Filter, Link2, Pin, Star, Trash2 } from 'lucide-react';
import type { ChoseCalendrier } from '../../../domain/calendrier';

/**
 * f5-a (E31) : l'appui long sur une barre ouvre un menu sous elle. Épingler (la chose reste visible si sa rangée est masquée), Étoile (sur la
 * courbe), « <Rangée> seules » (filtre de la visite), Dupliquer avec son effet, Lier à un brassin ou un client, Retirer avec son effet.
 * Retirer enlève la date : la chose reste dans sa source, sans date, et Annuler la remet (L33 : on ne supprime jamais, on ne cascade jamais).
 */

/** Sous cette marge du bas de l'écran vivent les onglets : le menu ne la touche pas. */
export const BAS_RESERVE_PX = 64;
/** Hauteur du menu quand rien ne se mesure (jsdom) : trois boutons, Dupliquer, Lier, Retirer. */
export const HAUTEUR_REPLI_PX = 260;

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
  /** Quand Retirer est refusé (un brassin, une charge fixe) : un bouton ouvre la source, où la chose se règle. */
  onOuvrirSource?: () => void;
  libelleSource?: string;
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

  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const largeur = typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 440 : Math.min(300, vw - 96);
  const [pos, setPos] = React.useState<{ top: number; left: number; cote: 'bas' | 'haut'; maxHeight?: number } | null>(null);
  /* f5-a (CRITIQUE-2 n° 3) : sous la barre ; si la place manque au-dessus des onglets, au-dessus de la barre ; toujours dans l'écran, Retirer
     compris. Le menu passe au-dessus du + volant (z-index de FloatingActions : 51 ; le menu : 60, frise.css). */
  React.useLayoutEffect(() => {
    const rect = ancre?.getBoundingClientRect();
    const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
    const bas = vh - BAS_RESERVE_PX;
    const mh = racine.current?.offsetHeight || HAUTEUR_REPLI_PX;
    const left = rect ? Math.max(8, Math.min(vw - largeur - 8, rect.left + rect.width / 2 - largeur / 2)) : 88;
    if (!rect) { setPos({ top: 120, left, cote: 'bas' }); return; }
    const dessous = rect.bottom + 8, dessus = rect.top - 8 - mh;
    if (dessous + mh <= bas) setPos({ top: dessous, left, cote: 'bas' });
    else if (dessus >= 8) setPos({ top: dessus, left, cote: 'haut' });
    else {
      /* ni dessous ni dessus en entier : le côté le plus grand, avec sa hauteur bornée (le menu défile, l'écran non) */
      const placeBas = bas - dessous, placeHaut = rect.top - 16;
      if (placeBas >= placeHaut) setPos({ top: dessous, left, cote: 'bas', maxHeight: Math.max(120, placeBas) });
      else setPos({ top: 8, left, cote: 'haut', maxHeight: Math.max(120, placeHaut) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancre, lier, largeur, vw]);
  const retirable = 'raison' in retirer ? null : retirer;

  return (
    <div
      ref={racine} role="menu" aria-label={`${chose.titre} : gestes`} className={`cal-menu cal-menu-${pos?.cote ?? 'bas'}`} data-menu data-cote={pos?.cote ?? 'bas'}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: largeur, ...(pos?.maxHeight ? { maxHeight: pos.maxHeight } : {}), visibility: pos ? undefined : 'hidden' }}
    >
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
              <Filter size={20} aria-hidden="true" />{nomRangee}<small>{autresRangees} rangée{autresRangees > 1 ? 's' : ''} masquée{autresRangees > 1 ? 's' : ''}</small>
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
            <>
              <p className="cal-mn">{'raison' in retirer ? retirer.raison : ''}</p>
              {props.onOuvrirSource && (
                <button type="button" role="menuitem" onClick={props.onOuvrirSource} className="cal-ml">
                  <ExternalLink size={20} aria-hidden="true" /><span>{props.libelleSource ?? 'Ouvrir ›'}</span>
                </button>
              )}
            </>
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
