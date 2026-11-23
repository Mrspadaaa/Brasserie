import React from 'react';
import { Ban, Beer, CalendarX, Copy, EyeOff, Filter, Link2, PartyPopper, Pin, Star, Trash2, UserRound } from 'lucide-react';
import type { ChoseCalendrier } from '../../../domain/calendrier';
import { libelleRetirer } from '../../../domain/calendrierGestes';
import './feuille.css';
/* `.cal-ml-mots` (CRITIQUE-11 n° 4) vit dans message.css, au lot du domaine des messages ; frise.css est au lot de la frise */
import '../message.css';

/** CRITIQUE-11 n° 4 : un effet en mots (« recette estimée 1 180 · ne change pas la courbe (pas dans Finances) ») passe sous son action, entier ; un effet chiffré reste à côté. */
const enMots = (effet: string | undefined): boolean => !!effet && !effet.includes('→') && effet.length > 14;
/**
 * CRITIQUE-12 n° 2 (E31, D-192) : l'effet en mots tient deux lignes au plus sous son action, à 390. Le montant (« recette estimée 1 180 ») est un
 * bloc insécable et en gras ; l'explication (« ne change pas la courbe (pas dans Finances) ») suit, et passe à la ligne entre ses mots.
 */
function effetVu(effet: string): React.ReactNode {
  const i = effet.indexOf(' · ');
  if (!enMots(effet) || i < 0) return effet;
  return <><b className="cal-ml-m">{effet.slice(0, i)}</b> · <span className="cal-ml-x">{effet.slice(i + 3)}</span></>;
}

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
  /** D386 : les fêtes et activités qui durent (des barres) : la tireuse se lie à la foire. Absent : aucune. */
  evenements?: ReadonlyArray<{ id: string; nom: string }>;
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
  onLier: (liens: { batchId?: string; clientId?: string; evenementId?: string }, nom: string) => void;
  onRetirer: () => void;
  /** L-71 (T11-20) : une chose créée se supprime aussi d'ici (la fiche l'offre déjà), en rouge ; le message garde Annuler. */
  onSupprimer?: () => void;
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
/** CHV-9 : les barres et marques visibles des AUTRES choses (la chose tenue et ce qu'elle contient sont exclus). */
function rectsVoisines(ancre: HTMLElement): Rect[] {
  if (typeof document === 'undefined') return [];
  return [...document.querySelectorAll<HTMLElement>('[data-chose-id]')]
    .filter(e => e !== ancre && !e.contains(ancre) && !ancre.contains(e))
    .map(e => e.getBoundingClientRect())
    .filter(r => r.width > 0 && r.height > 0)
    .map(r => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right }));
}

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
  /* CHV-9 : trois tuiles d'un mot et d'un picto (« Brassins seuls » tient sur une ligne) : 352 px à 390, au lieu de 300 */
  const largeur = paysage ? Math.min(600, vw - 32) : vw > 700 ? 440 : Math.min(352, vw - 32);
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
    /* CHV-9 : sur un grand écran, les barres voisines se voient autour de la chose tenue (la frise est large) : le menu se pose, sous elle ou
       au-dessus, à l'abscisse (à 360 px d'elle au plus) où il couvre le moins de barres ; à égalité, la place d'avant. */
    const voisines = vw >= 700 && !paysage ? rectsVoisines(ancre) : [];
    const gene = (r: Rect): number => voisines.reduce((n, v) => n + (serecouvrent(r, v) ? 1 : 0), 0);
    const meilleureLibre = (): { top: number; left: number; cote: 'bas' | 'haut'; g: number } | null => {
      if (!voisines.length) return null;
      const cx = (barre.left + barre.right) / 2;
      /* toutes les hauteurs entre l'en-tête et les onglets, jamais sur la chose tenue ; le plus près d'elle gagne */
      let meilleur: { top: number; left: number; cote: 'bas' | 'haut'; g: number; d: number } | null = null;
      for (let top = haut; top + mh <= bas; top += 12) {
        const ecart = top >= t.bottom ? top - t.bottom : t.top - (top + mh);
        if (ecart < 6 - 12) continue; // sur la chose tenue
        for (let x = 8; x <= vw - largeur - 8; x += 16) {
          const dx = Math.abs(x + largeur / 2 - cx);
          if (dx > 360) continue;
          const r = { top, bottom: top + mh, left: x, right: x + largeur };
          if (serecouvrent(r, t)) continue;
          const g = gene(r);
          const d = ecart + dx / 2;
          if (!meilleur || g < meilleur.g || (g === meilleur.g && d < meilleur.d)) meilleur = { top, left: x, cote: top >= t.bottom ? 'bas' : 'haut', g, d };
        }
      }
      return meilleur;
    };
    const parDefaut = dessous();
    const libre = meilleureLibre();
    const gDefaut = parDefaut ? gene({ top: parDefaut.top, bottom: parDefaut.top + mh, left: parDefaut.left, right: parDefaut.left + largeur }) : Infinity;
    if (libre && libre.g < gDefaut) { setPos({ top: libre.top, left: libre.left, cote: libre.cote }); return; }
    const place = parDefaut ?? defiler() ?? (paysage ? aCote() ?? dessus() : dessus() ?? aCote());
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
  /* D386 : une fête ne se lie pas à elle-même */
  const evenementsLiables = (liens.evenements ?? []).filter(e => e.id !== (chose.source.genre === 'creative' ? chose.source.id : ''));

  /* CHV-9 (« moins de texte et plus de visuel ») : une tuile = un picto et un mot (sa maquette f5-a). Ce que disait la petite ligne (« reste visible,
     rangée masquée », « 6 rangées masquées ») passe dans le geste vu (picto plein quand c'est posé, nombre de rangées masquées sur le filtre) et dans
     l'étiquette (lecteur d'écran, survol). Aucune fonction ne part. */
  const masquees = `${autresRangees} rangée${autresRangees > 1 ? 's' : ''} masquée${autresRangees > 1 ? 's' : ''}`;
  const dit = { epingler: 'Épingler : reste visible, rangée masquée', etoile: 'Étoile : sur la courbe', seules: `${nomRangee} : ${masquees}` };
  const epingler = (
    <button type="button" role="menuitemcheckbox" aria-checked={epinglee} aria-label={dit.epingler} title={dit.epingler} {...agir(props.onEpingler)} className={paysage ? 'cal-ml' : 'cal-m3b'}>
      <Pin size={20} aria-hidden="true" fill={epinglee ? 'currentColor' : 'none'} /><span>Épingler</span>
    </button>
  );
  const etoile = (
    <button type="button" role="menuitemcheckbox" aria-checked={etoilee} aria-label={dit.etoile} title={dit.etoile} {...agir(props.onEtoile)} className={paysage ? 'cal-ml' : 'cal-m3b'}>
      <Star size={20} aria-hidden="true" fill={etoilee ? 'currentColor' : 'none'} /><span>Étoile</span>
    </button>
  );
  const seules = (
    <button type="button" role="menuitem" aria-label={dit.seules} title={dit.seules} {...agir(props.onSeules)} className={paysage ? 'cal-ml' : 'cal-m3b'}>
      <Filter size={20} aria-hidden="true" /><span>{nomRangee}</span>
      {autresRangees > 0 && <i className="cal-m3b-n" aria-hidden="true"><EyeOff size={14} />{autresRangees}</i>}
    </button>
  );
  const droite = (
    <>
      {dupliquer && (
        <button type="button" role="menuitem" {...agir(props.onDupliquer)} className={`cal-ml${enMots(dupliquer.effet) ? ' cal-ml-mots' : ''}`}>
          <Copy size={20} aria-hidden="true" /><span>Dupliquer en {dupliquer.libelle}</span>{dupliquer.effet && <><span className="sr-only"> · </span><em data-effet-dupliquer>{effetVu(dupliquer.effet)}</em></>}
        </button>
      )}
      <button type="button" role="menuitem" aria-label="Lier à un brassin, un client, une fête" {...agir(() => setLier(true))} className="cal-ml cal-ml-lier">
        <Link2 size={20} aria-hidden="true" /><span>Lier à<span className="sr-only"> un brassin, un client, une fête</span></span>
        <i className="cal-ml-cibles" aria-hidden="true"><Beer size={20} /><UserRound size={20} /><PartyPopper size={20} /></i>
      </button>
      {retirable ? (
        <button type="button" role="menuitem" {...agir(props.onRetirer)} className={`cal-ml${chose.source.genre === 'creative' ? '' : ' cal-ml-ret'}${enMots(retirable.effet) ? ' cal-ml-mots' : ''}`} data-retirer-menu>
          {/* paquet F n° 2 (PC-138) : le libellé dit ce que fait le geste ; ranger n'efface rien, son picto n'est pas une corbeille */}
          {chose.source.genre === 'creative' ? <CalendarX size={20} aria-hidden="true" /> : <Ban size={20} aria-hidden="true" />}<span>{libelleRetirer(chose)}</span>{retirable.effet && <><span className="sr-only"> · </span><em data-effet-retirer>{effetVu(retirable.effet)}</em></>}
        </button>
      ) : (
        <>
          {/* CHV-9 : le paragraphe de trois lignes (« Un brassin ne se retire pas d'ici : on ne supprime rien… ») devient une ligne : le picto
              « interdit » dit que Retirer n'est pas ici, le lien ouvre l'endroit où la chose se règle. La raison entière reste dans l'étiquette, le
              survol et le texte pour lecteur d'écran. Sans lien à ouvrir, elle reste écrite. */}
          {props.onOuvrirSource ? (
            <button type="button" role="menuitem" title={'raison' in retirer ? retirer.raison : undefined} {...agir(props.onOuvrirSource)} className="cal-ml cal-ml-source">
              <Ban size={20} aria-hidden="true" /><span>{props.libelleSource ?? 'Ouvrir ›'}</span>
              <span className="sr-only"> · {'raison' in retirer ? retirer.raison : ''}</span>
            </button>
          ) : <p className="cal-mn">{'raison' in retirer ? retirer.raison : ''}</p>}
        </>
      )}
      {props.onSupprimer && (
        <button type="button" role="menuitem" data-supprimer-menu {...agir(props.onSupprimer)} className="cal-ml cal-ml-ret">
          <Trash2 size={20} aria-hidden="true" /><span>Supprimer</span>
        </button>
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
          {evenementsLiables.length > 0 && (
            <div role="group" aria-label="Fêtes et activités" className="cal-lier-g" data-lier="evenements">
              <span className="cal-lier-t">Fêtes et activités</span>
              {evenementsLiables.map(ev => (
                <button key={ev.id} type="button" role="menuitem" {...agir(() => props.onLier({ evenementId: ev.id }, ev.nom))} className="cal-lier-p" data-lier-id={ev.id}>
                  <Link2 size={16} aria-hidden="true" /><span>{ev.nom}</span>
                </button>
              ))}
            </div>
          )}
          {!brassinsLiables.length && !liens.clients.length && !evenementsLiables.length && <p className="cal-mn">Aucun brassin ni client à lier pour l’instant.</p>}
        </>
      )}
    </div>
  );
};
