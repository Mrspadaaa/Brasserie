import React from 'react';
import { Copy, ExternalLink, Filter, Link2, Pin, Star, Trash2 } from 'lucide-react';
import type { ChoseCalendrier } from '../../../domain/calendrier';
import './feuille.css';

/**
 * f5-a (E31) : l'appui long sur une barre ouvre un menu sous elle. Épingler (la chose reste visible si sa rangée est masquée), Étoile (sur la
 * courbe), « <Rangée> seules » (filtre de la visite), Dupliquer avec son effet, Lier à un brassin ou un client, Retirer avec son effet.
 * Retirer enlève la date : la chose reste dans sa source, sans date, et Annuler la remet (L33 : on ne supprime jamais, on ne cascade jamais).
 *
 * CRITIQUE-3 n° 3 : le doigt qui se lève après l'appui long ne choisit rien. Une action ne s'exécute que sur un appui puis un lâcher, tous
 * deux sur elle, après l'ouverture du menu ; le clavier (Entrée, Espace : un `click` sans pointeur) agit aussi.
 * CRITIQUE-3 n° 4 (D-192) : en paysage, deux colonnes (Épingler, Étoile, « X seules » | Dupliquer, Lier, Retirer), sous la barre ou
 * au-dessus, bornées à l'écran : les six actions se voient sans défiler.
 */

/** Sous cette marge du bas de l'écran vivent les onglets : le menu ne la touche pas. */
export const BAS_RESERVE_PX = 64;
/** Hauteur du menu quand rien ne se mesure (jsdom) : trois boutons, Dupliquer, Lier, Retirer. */
export const HAUTEUR_REPLI_PX = 260;
/** En paysage : trois lignes de 48 px sur deux colonnes, et la marge. */
export const HAUTEUR_REPLI_PAYSAGE_PX = 3 * 48 + 2 * 4 + 18;

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

/** Le bas de l'en-tête collé du calendrier (courbe et bande, `data-entete-zone`) : le menu ne s'y pose jamais. 0 s'il n'est pas à l'écran. */
function basEntete(): number {
  if (typeof document === 'undefined') return 0;
  const r = document.querySelector('[data-entete-zone]')?.getBoundingClientRect();
  return r && r.height > 0 && r.bottom > 0 ? r.bottom : 0;
}
/**
 * Le conteneur qui fait défiler la frise : le premier parent qui défile, sinon la page. `null` si rien ne peut défiler.
 * CRITIQUE-6 n° 5 : `body` et `html` sont laissés à la page (`scrollingElement`) : `body { overflow-x: hidden }` rend son `overflowY` « auto »
 * sans qu'il défile (son débordement passe à la fenêtre) ; le menu y écrivait `scrollTop` sans effet et finissait au-dessus de la barre.
 */
function conteneurDefilant(el: HTMLElement | null): Element | null {
  if (typeof document === 'undefined' || !el) return null;
  for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
  }
  const page = document.scrollingElement;
  return page && page.scrollHeight > page.clientHeight + 1 ? page : null;
}

/** Un rectangle simple (haut, bas, gauche, droite). */
export interface Rect { top: number; bottom: number; left: number; right: number }
/**
 * La chose tenue, telle que le brasseur la voit (CRITIQUE-6 n° 5) : sa barre ou sa marque, et son nom posé à côté (« Hotte −900 », l'étiquette
 * sœur `.cal-lbl`). Le menu ne couvre ni l'une ni l'autre.
 */
export function rectTenue(ancre: HTMLElement): Rect {
  const r = ancre.getBoundingClientRect();
  const u: Rect = { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  const lbl = ancre.nextElementSibling;
  if (lbl instanceof HTMLElement && lbl.classList.contains('cal-lbl')) {
    const l = lbl.getBoundingClientRect();
    if (l.width > 0 && l.height > 0) { u.top = Math.min(u.top, l.top); u.bottom = Math.max(u.bottom, l.bottom); u.left = Math.min(u.left, l.left); u.right = Math.max(u.right, l.right); }
  }
  return u;
}
/** Deux rectangles se recouvrent-ils ? (bords qui se touchent : non) */
export const serecouvrent = (a: Rect, b: Rect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Le téléphone tourné (844 × 390) : plus large que haut, et bas (comme la règle `orientation: landscape and max-height: 520px` de la feuille). */
const enPaysage = (): boolean => typeof window !== 'undefined' && window.innerWidth > window.innerHeight && window.innerHeight <= 520;

export const MenuAppuiLong: React.FC<MenuAppuiLongProps> = props => {
  const { chose, nomRangee, ancre, epinglee, etoilee, autresRangees, dupliquer, retirer, liens } = props;
  const [lier, setLier] = React.useState(false);
  const racine = React.useRef<HTMLDivElement | null>(null);
  /* l'action « armée » : celle sur laquelle un doigt s'est posé APRÈS l'ouverture du menu (n° 3) */
  const arme = React.useRef<Element | null>(null);
  const faitAuPointeur = React.useRef(0);

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

  /** Les gestes d'une action : appui puis lâcher sur elle (le lâcher de l'appui long ne compte pas), ou le clavier. */
  const agir = (faire: () => void) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { if (e.button <= 0) arme.current = e.currentTarget; },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      const ok = arme.current === e.currentTarget;
      arme.current = null;
      if (!ok) return;
      faitAuPointeur.current = Date.now();
      faire();
    },
    onPointerCancel: () => { arme.current = null; },
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      /* un `click` de pointeur (detail ≥ 1) a déjà agi au lâcher, ou vient du lâcher de l'appui long : il ne fait rien */
      if (e.detail > 0) return;
      if (Date.now() - faitAuPointeur.current < 400) return;
      faire();
    }
  });

  const paysage = enPaysage();
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const largeur = paysage ? Math.min(600, vw - 32) : vw > 700 ? 440 : Math.min(300, vw - 96);
  const [pos, setPos] = React.useState<{ top: number; left: number; cote: 'bas' | 'haut' | 'cote'; maxHeight?: number; largeur?: number; une?: boolean } | null>(null);
  /* sous la barre ; si la place manque au-dessus des onglets, au-dessus de la barre ; sinon borné à l'écran, au plus près de la barre.
     Jamais une hauteur fixe (n° 4). Le menu passe au-dessus du + volant (z-index de FloatingActions : 51 ; le menu : 60, frise.css). */
  /* CRITIQUE-4 n° 12 (E31, D-192) : sous la barre tenue ; sans la place, au-dessus d'elle ; jamais sur l'en-tête collé (courbe, bande) ni sur
     la chose tenue. Si ni dessous ni dessus ne tiennent (le paysage n'a que 390 px), la page défile pour poser la barre juste sous l'en-tête,
     comme sa maquette (as/cap/l-f5a-apres) ; sinon le menu se pose à côté de la barre ; en dernier recours, borné entre l'en-tête et les onglets. */
  React.useLayoutEffect(() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
    const bas = vh - BAS_RESERVE_PX;
    const mh = racine.current?.offsetHeight || (paysage && !lier ? HAUTEUR_REPLI_PAYSAGE_PX : HAUTEUR_REPLI_PX);
    const haut = Math.max(8, basEntete() + 6);
    const centre = (r: DOMRect) => Math.max(8, Math.min(vw - largeur - 8, r.left + r.width / 2 - largeur / 2));
    if (!ancre) { setPos({ top: Math.max(haut, bas - mh), left: Math.max(8, (vw - largeur) / 2), cote: 'haut', maxHeight: bas - haut }); return; }
    /* CRITIQUE-5 n° 12 et CRITIQUE-6 n° 5 (E31 « un menu sous elle », D-192) : le menu ne recouvre jamais la chose tenue, sa barre ET son nom
       (« Hotte −900 », `rectTenue`). Ordre : sous elle ; la page défile pour la poser juste sous l'en-tête, le menu dessous (sa maquette,
       p-f5a-apres et l-f5a-apres) ; en paysage, à côté d'elle (ses voisines du dessus et du dessous restent visibles), puis au-dessus ; en
       portrait, au-dessus, puis à côté ; en dernier recours, dans la plus grande bande libre au-dessus ou au-dessous (le menu défile en lui-même).
       À côté, à droite d'abord (la colonne des noms de rangée est à gauche). */
    let barre = ancre.getBoundingClientRect();
    let t = rectTenue(ancre);
    const dessous = () => (t.bottom + 6 >= haut && t.bottom + 6 + mh <= bas ? { top: t.bottom + 6, left: centre(barre), cote: 'bas' as const } : null);
    const dessus = () => (t.top - 6 - mh >= haut ? { top: t.top - 6 - mh, left: centre(barre), cote: 'haut' as const } : null);
    const aCote = () => {
      /* en paysage, deux colonnes (400 px au moins, l'effet passe sous son action) : les six actions sans défiler (D-192) ; sinon une colonne
         de 220 px au moins, qui défile en elle-même ; en portrait, la mise en page du menu, 220 px au moins */
      const formats = paysage && !lier ? [{ min: 400, w: 440, une: false }, { min: 220, w: 280, une: true }] : [{ min: 220, w: Math.min(largeur, 300), une: false }];
      const libreD = vw - t.right - 16, libreG = t.left - 16;
      for (const f of formats) {
        const hauteur = f.une ? Math.min(bas - haut, 6 * 46 + 16) : mh;
        const top = Math.max(haut, Math.min(bas - hauteur, (t.top + t.bottom) / 2 - hauteur / 2));
        const base = { top, cote: 'cote' as const, maxHeight: bas - top, une: f.une };
        if (libreD >= f.min) return { ...base, left: t.right + 8, largeur: Math.min(f.w, libreD) };
        if (libreG >= f.min) { const w = Math.min(f.w, libreG); return { ...base, left: t.left - 8 - w, largeur: w }; }
      }
      return null;
    };
    const defiler = () => {
      /* la chose tenue juste sous l'en-tête : le menu se pose dessous ; sans place même ainsi, la page revient où elle était */
      const conteneur = conteneurDefilant(ancre);
      const delta = Math.round(t.top - haut);
      if (!conteneur || delta === 0) return null;
      const avant = conteneur.scrollTop;
      conteneur.scrollTop = avant + delta;
      barre = ancre.getBoundingClientRect(); t = rectTenue(ancre);
      const ici = dessous();
      if (ici) return ici;
      conteneur.scrollTop = avant;
      barre = ancre.getBoundingClientRect(); t = rectTenue(ancre);
      return null;
    };
    const place = dessous() ?? defiler() ?? (paysage ? aCote() ?? dessus() : dessus() ?? aCote());
    if (place) { setPos(place); return; }
    /* la plus grande bande libre, au-dessus ou au-dessous de la chose tenue, jamais sur elle */
    const placeBas = bas - (t.bottom + 6), placeHaut = t.top - 6 - haut;
    if (placeBas >= placeHaut) setPos({ top: Math.max(haut, t.bottom + 6), left: centre(barre), cote: 'bas', maxHeight: Math.max(0, placeBas) });
    else setPos({ top: Math.max(haut, t.top - 6 - Math.min(mh, placeHaut)), left: centre(barre), cote: 'haut', maxHeight: Math.max(0, placeHaut) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancre, lier, largeur, vw, paysage]);
  const retirable = 'raison' in retirer ? null : retirer;
  /* un brassin ne se lie pas à lui-même ; deux brassins du même nom (« Stout maison » brassée quatre fois) : un seul bouton, le dernier de la
     liste, le plus récent dans l'ordre de l'app (demande au lot 4 : ne passer que les brassins planifiés ou en cuve) */
  const brassinsLiables = liens.brassins
    .filter(b => b.id !== (chose.source.genre === 'batch' ? chose.source.id : ''))
    .filter((b, i, l) => l.map(x => x.nom).lastIndexOf(b.nom) === i);

  const epingler = (
    <button type="button" role="menuitemcheckbox" aria-checked={epinglee} {...agir(props.onEpingler)} className={paysage ? 'cal-ml' : 'cal-m3b'}>
      <Pin size={20} aria-hidden="true" />{paysage ? <span>Épingler <small>reste visible</small></span> : <>Épingler<small>reste visible, rangée masquée</small></>}
    </button>
  );
  const etoile = (
    <button type="button" role="menuitemcheckbox" aria-checked={etoilee} {...agir(props.onEtoile)} className={paysage ? 'cal-ml' : 'cal-m3b'}>
      <Star size={20} aria-hidden="true" />{paysage ? <span>Étoile <small>sur la courbe</small></span> : <>Étoile<small>sur la courbe</small></>}
    </button>
  );
  const masquees = `${autresRangees} rangée${autresRangees > 1 ? 's' : ''} masquée${autresRangees > 1 ? 's' : ''}`;
  const seules = (
    <button type="button" role="menuitem" {...agir(props.onSeules)} className={paysage ? 'cal-ml' : 'cal-m3b'}>
      <Filter size={20} aria-hidden="true" />{paysage ? <span>{nomRangee} <small>{masquees}</small></span> : <>{nomRangee}<small>{masquees}</small></>}
    </button>
  );
  const droite = (
    <>
      {dupliquer && (
        <button type="button" role="menuitem" {...agir(props.onDupliquer)} className="cal-ml">
          <Copy size={20} aria-hidden="true" /><span>Dupliquer en {dupliquer.libelle}</span>{dupliquer.effet && <em>{dupliquer.effet}</em>}
        </button>
      )}
      <button type="button" role="menuitem" {...agir(() => setLier(true))} className="cal-ml">
        <Link2 size={20} aria-hidden="true" /><span>Lier à un brassin, un client</span>
      </button>
      {retirable ? (
        <button type="button" role="menuitem" {...agir(props.onRetirer)} className="cal-ml cal-ml-ret">
          <Trash2 size={20} aria-hidden="true" /><span>Retirer</span>{retirable.effet && <em>{retirable.effet}</em>}
        </button>
      ) : (
        <>
          <p className="cal-mn">{'raison' in retirer ? retirer.raison : ''}</p>
          {props.onOuvrirSource && (
            <button type="button" role="menuitem" {...agir(props.onOuvrirSource)} className="cal-ml">
              <ExternalLink size={20} aria-hidden="true" /><span>{props.libelleSource ?? 'Ouvrir ›'}</span>
            </button>
          )}
        </>
      )}
    </>
  );

  return (
    <div
      ref={racine} role="menu" aria-label={`${chose.titre} : gestes`} className={`cal-menu cal-menu-${pos?.cote ?? 'bas'}${paysage ? ' cal-menu-l' : ''}${pos?.largeur && pos.largeur < largeur ? ' cal-menu-etroit' : ''}`} data-menu
      data-cote={pos?.cote ?? 'bas'} data-colonnes={paysage && !lier && !pos?.une ? '2' : '1'}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.largeur ?? largeur, ...(pos?.maxHeight ? { maxHeight: pos.maxHeight } : {}), visibility: pos ? undefined : 'hidden' }}
    >
      {!lier ? (
        paysage && pos?.une ? (
          /* à côté de la chose tenue, sans la place de deux colonnes : une colonne qui défile en elle-même (CRITIQUE-6 n° 5) */
          <div className="cal-m2c">{epingler}{etoile}{seules}{droite}</div>
        ) : paysage ? (
          <div className="cal-m2">
            <div className="cal-m2c">{epingler}{etoile}{seules}</div>
            <div className="cal-m2c">{droite}</div>
          </div>
        ) : (
          <>
            <div className="cal-m3">{epingler}{etoile}{seules}</div>
            {droite}
          </>
        )
      ) : (
        <>
          {/* CRITIQUE-5 n° 6 (D-126, E37) : des puces, sans clavier, groupées (brassins, puis clients) ; un toucher pose la liaison, la pastille
              « lié à … » vient sur la barre et le message dit « Liée à … · Annuler » */}
          <p className="cal-mn">Lier <b>{chose.titre}</b> à :</p>
          {brassinsLiables.length > 0 && (
            <div role="group" aria-label="Brassins" className="cal-lier-g" data-lier="brassins">
              <span className="cal-lier-t">Brassins</span>
              {brassinsLiables.map(b => (
                <button key={b.id} type="button" role="menuitem" {...agir(() => props.onLier({ batchId: b.id }, b.nom))} className="cal-lier-p" data-lier-id={b.id}>
                  <Link2 size={16} aria-hidden="true" /><span>{b.nom}</span>
                </button>
              ))}
            </div>
          )}
          {liens.clients.length > 0 && (
            <div role="group" aria-label="Clients" className="cal-lier-g" data-lier="clients">
              <span className="cal-lier-t">Clients</span>
              {liens.clients.map(c => (
                <button key={c.id} type="button" role="menuitem" {...agir(() => props.onLier({ clientId: c.id }, c.nom))} className="cal-lier-p" data-lier-id={c.id}>
                  <Link2 size={16} aria-hidden="true" /><span>{c.nom}</span>
                </button>
              ))}
            </div>
          )}
          {!brassinsLiables.length && !liens.clients.length && <p className="cal-mn">Aucun brassin ni client à lier pour l’instant.</p>}
        </>
      )}
    </div>
  );
};
