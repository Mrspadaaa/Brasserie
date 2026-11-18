import React from 'react';
import { ChevronRight, Undo2 } from 'lucide-react';
import '../message.css';

/**
 * Le message du calendrier (E33, D-200 ; « Trop d'info quand on bouge qqch, ça devient illisible ») : UN seul canal pour tout l'onglet,
 * tenu par `CalendrierTab`. Les gestes de la frise, les refus, les promesses (f6-b) et les messages de l'en-tête (« Tire jusqu'au bout :
 * l'année », « Tourne le téléphone : 13 semaines », par `onMessage`) y passent : un message chasse le précédent, jamais deux à la fois.
 * Il part au premier défilement de 24 px, à un nouveau geste, à l'ouverture d'un détail, d'un menu, d'une feuille, et au changement de vue.
 * Son texte laisse passer le doigt (`pointer-events: none` hors des boutons).
 *
 * CRITIQUE-5 n° 5 (E31, E33, D-114) : le lien n'est jamais coupé. Il passe avec les boutons (« Finances › », forme courte, puis « Annuler ») ;
 * le texte et son effet (« Annulé · S49 : 1 088 → 1 988 ») tiennent la première ligne, les boutons la seconde quand la place manque.
 *
 * CRITIQUE-12 n° 1 (règle n° 1, E33, D-200, D-20) : sa place est celle de sa maquette (`as/src/as-gestes.js`, `toast` ; `as/JOURNAL.md`
 * l. 224 ; `as/cap/p-f1a-apres.png`). Par-dessus la frise (fixe), sans réserver de hauteur : rien ne bouge quand il vient ni quand il part.
 * Près de la chose touchée là où il ne cache aucun texte (sous elle, au-dessus, au bord gauche, au bout de sa rangée, de part et d'autre, à
 * mi-hauteur) ; sinon en bas, au-dessus des onglets, à gauche du + volant (left 8 px, ou à droite du rail au grand écran). Jamais plus haut
 * que la première rangée visible, jamais sur les onglets ni sous le +. La place « sous l'en-tête » (bande collée, CRITIQUE-11 n° 3 et n° 8)
 * est retirée : elle couvrait le titre Brassins et les premières barres.
 * D-126 (Lier) : le message et le détail coexistent ; le détail ouvert est un obstacle comme un nom.
 */

export interface MessageCal {
  /** Change à chaque message : l'ancien est remplacé, jamais empilé. */
  id: number;
  role: 'status' | 'alert';
  /** « S51 : 5 064 → 4 524 » */
  texte: string;
  /** « Sans date › », « dans Finances › », « Ouvrir le brassin › » */
  lien?: { texte: string; agir: () => void };
  annuler?: () => void;
  /** f6-b : [Livrer le 5 janv.]. */
  livrer?: { texte: string; agir: () => void };
  /** Le détail (client, caisse), au toucher de la ligne. */
  detail?: string;
  /** Un message de l'en-tête : son retrait (`onMessage(null)`) ne chasse que lui. */
  origine?: 'entete';
  /** La chose touchée (`data-chose` de la frise) : le message se pose près d'elle (CRITIQUE-12 n° 1). L'alerte f6-b : la vente promise. */
  ancre?: string;
  /** CRITIQUE-11 n° 8 (D-126) : le geste ouvre lui-même son détail (Lier). Marque seulement ; la place suit la règle commune. */
  ouvreSonDetail?: boolean;
}

export interface MessageProps {
  message: MessageCal | null;
  onFermer: () => void;
  dureeMs?: number;
  /** L'id du détail ouvert : le message se replace quand il s'ouvre (le détail est un obstacle, D-126). */
  detailOuvert?: string | null;
  /**
   * CRITIQUE-13 n° 1 (règle n° 1, `as/cap/p-f6b-apres`, `as-gestes.js` `alerte`) : l'alerte f6-b est posée dans la frise, sous la vente promise,
   * dans le flux : elle pousse la suite et ne cache rien. La frise défile alors pour la montrer entière, sans perdre la vente de vue.
   */
  dansLaFrise?: boolean;
  /** Appelé juste avant ce défilement : il n'est pas celui du brasseur et ne chasse pas l'alerte. */
  onDefileSeul?: () => void;
}

export const DUREE_MESSAGE_MS = 7000;

/**
 * CRITIQUE-4 n° 13 b (E33) : l'effet chiffré (« S47 : 3 510 → 3 640 ») n'est jamais coupé. Le texte se sépare en son nom (« Café du Pont, 1 fût ·
 * S47 · vente confirmée »), qui cède le premier (une ligne, points de suite), et son effet, entier.
 */
export function separerEffet(texte: string): { nom: string; effet: string | null } {
  const morceaux = texte.split(' · ');
  const i = morceaux.findIndex(m => /^S\d+ : .+ → .+$/.test(m.trim()));
  if (i < 0 || morceaux.length < 2) return { nom: texte, effet: null };
  return { nom: morceaux.filter((_, k) => k !== i).join(' · '), effet: morceaux[i].trim() };
}

/** N° 5 : la forme courte d'un lien du message (« dans Finances › » devient « Finances › ») : elle tient avec « Annuler » à 390. */
export const lienCourt = (texte: string): string => texte.replace(/^dans\s+/i, '');

/** La boîte du texte d'un titre (le h3 peut être plus large que son mot). */
const texteDe = (t: Element): DOMRect => {
  const g = typeof document.createRange === 'function' ? document.createRange() : null;
  if (!g || typeof g.getBoundingClientRect !== 'function') return t.getBoundingClientRect();
  g.selectNodeContents(t);
  const r = g.getBoundingClientRect();
  return r.width > 0 ? r : t.getBoundingClientRect();
};
/* les noms que le message ne couvre jamais (E33) : titres de rangée, noms et montants des choses, pastilles, renvois */
const TITRES = '[data-nom-rangee], [data-rangee] .cal-nom';
export const NOMS_MESSAGE = `${TITRES}, [data-frise] .cal-lbl-t, [data-frise] .cal-lbl-m, [data-frise] .cal-lbl-j, [data-frise] .cal-duree, [data-frise] .cal-lie, [data-frise] .cal-pastille-p, [data-frise] .cal-renvoi`;

/** Une fois par image (défilement) ; sans `requestAnimationFrame`, au tour suivant. */
function prochaineImage(f: () => void): () => void {
  if (typeof window.requestAnimationFrame === 'function') { const n = window.requestAnimationFrame(f); return () => window.cancelAnimationFrame?.(n); }
  const t = setTimeout(f, 16);
  return () => clearTimeout(t);
}

type Obstacle = { l: number; t: number; r: number; b: number; p: number };
type Place = { x: number; y: number };

const vu = (b: DOMRect) => b.width >= 1 && b.height >= 1 && b.bottom >= 0 && b.top <= window.innerHeight;
/** `rects` du jouable : les boîtes visibles d'un sélecteur, hors du message, avec leur poids. */
function obstacles(sel: string, p: number, hors: Element, boite: (e: Element) => DOMRect = e => e.getBoundingClientRect(), marge = 0): Obstacle[] {
  return [...document.querySelectorAll(sel)].filter(e => !hors.contains(e)).map(boite).filter(vu)
    .map(b => ({ l: b.left - marge, t: b.top - marge, r: b.right + marge, b: b.bottom + marge, p }));
}
/**
 * La première place qui ne cache rien (CRITIQUE-12 n° 1 : « la première place qui ne cache aucun texte gagne ; sinon en bas »). Les places du
 * jouable (`poser`, `as-gestes.js` l. 42), dans son ordre, bornées à l'écran ; une place qui croise un obstacle (nom, titre, barre, détail, +,
 * la chose elle-même) est refusée. Le jouable gardait, faute de mieux, la moins couvrante ; ici, faute de place libre, c'est le bas.
 */
function premiereLibre(w: number, h: number, places: Place[], obs: Obstacle[], xmin: number, xmax: number, ymin: number, ymax: number): (Place & { k: number }) | null {
  for (let k = 0; k < places.length; k++) {
    const x = Math.max(xmin, Math.min(xmax - w, places[k].x)), y = places[k].y;
    if (y < ymin || y + h > ymax) continue;
    if (obs.every(o => Math.min(x + w, o.r) <= Math.max(x, o.l) || Math.min(y + h, o.b) <= Math.max(y, o.t))) return { x, y, k };
  }
  return null;
}

/** L'élément de la chose annoncée dans la frise (une échéance récurrente porte un id daté qui commence par celui de la chose). */
function chose(ancre: string | undefined): Element | null {
  if (!ancre) return null;
  const id = ancre.replace(/["\\]/g, '');
  return document.querySelector(`[data-frise] [data-chose="${id}"]`) ?? document.querySelector(`[data-frise] [data-chose^="${id}"]`);
}

/**
 * La place du message (CRITIQUE-12 n° 1), portée de `toast` (`as-gestes.js` l. 133-150). Pose `left`, `top`, `max-width` (et `width` pour
 * l'alerte au téléphone en hauteur, qui prend la largeur) ; rend « pres » (près de la chose) ou « bas ».
 */
export function placerMessage(el: HTMLElement, ancre: string | undefined): 'pres' | 'bas' | null {
  const vw = window.innerWidth, vh = window.innerHeight;
  /* le + volant, et les onglets : en barre basse (téléphone), ou en rail à gauche (grand écran) */
  const fabEl = document.querySelector('.floating-actions button');
  const fab = fabEl && vu(fabEl.getBoundingClientRect()) ? fabEl.getBoundingClientRect() : null;
  const navEl = document.querySelector('nav.nav-principale');
  const nav = navEl ? navEl.getBoundingClientRect() : null;
  let gauche = 8, bas = vh - 8;
  if (nav && vu(nav)) { if (nav.width >= nav.height) bas = nav.top - 8; else gauche = nav.right + 8; }
  /* l'alerte f6-b au téléphone en hauteur : toute la largeur (son texte, puis Livrer et Annuler), au-dessus du + en bas ; ailleurs, à gauche du + */
  const alerte = el.getAttribute('role') === 'alert';
  const large = alerte && vw < 1024 && !(vw > vh && vh <= 520);
  const largeur = large ? vw - gauche - 8 : Math.min(560, (fab ? fab.left - 8 : vw - 8) - gauche);
  el.style.right = 'auto'; el.style.bottom = 'auto';
  el.style.maxWidth = `${Math.max(120, Math.round(largeur))}px`;
  /* sa largeur propre (texte et boutons sur une ligne s'ils tiennent), bornée à gauche du + ; l'alerte large : toute la largeur */
  el.style.left = `${gauche}px`; el.style.top = '0px';
  if (large) el.style.width = `${Math.round(largeur)}px`;
  else {
    /* sa largeur d'une ligne : le texte (mesuré par une Range : la largeur propre d'un `-webkit-box` à deux lignes est fausse dans Chrome),
       ses boutons, l'écart et ses marges ; + 4 px pour les sous-pixels, sans quoi Annuler repasse à la ligne. Plus large que la place : il
       garde la place, et ses boutons passent dessous (CRITIQUE-5 n° 5). */
    el.style.width = '';
    const cs = getComputedStyle(el);
    const px = (v: string) => parseFloat(v) || 0;
    const ligne = el.querySelector('.cal-msg-ligne');
    let texte = 0;
    if (ligne && typeof document.createRange === 'function') {
      const g = document.createRange(); g.selectNodeContents(ligne);
      texte = typeof g.getBoundingClientRect === 'function' ? g.getBoundingClientRect().width : 0;
    }
    const bt = el.querySelector<HTMLElement>('.cal-msg-bt');
    const boutons = bt ? bt.scrollWidth : 0;
    /* le texte occupe au moins sa base flex (`.cal-msg-l` : 8rem) : c'est elle qui décide du passage à la ligne */
    const bloc = el.querySelector('.cal-msg-l');
    if (bloc) texte = Math.max(texte, px(getComputedStyle(bloc).flexBasis));
    const naturelle = texte + boutons + px(cs.paddingLeft) + px(cs.paddingRight) + px(cs.borderLeftWidth) + px(cs.borderRightWidth) + (bt ? px(cs.columnGap) || 8 : 0) + 4;
    el.style.width = texte > 0 ? `${Math.ceil(Math.min(naturelle, largeur))}px` : '';
  }
  const m = el.getBoundingClientRect();
  const w = m.width, h = m.height;
  if (h === 0) return null;
  /* jamais plus haut que la première rangée visible : sous l'en-tête collé (courbe et bande des semaines) */
  const entete = document.querySelector('[data-entete-zone]')?.getBoundingClientRect();
  let haut = entete && entete.height > 0 ? Math.max(8, entete.bottom + 6) : 8;
  const premiere = [...document.querySelectorAll('[data-frise] [data-rangee]')].map(r => r.getBoundingClientRect()).find(r => r.height > 0 && r.bottom > haut);
  if (premiere) haut = Math.max(haut, Math.min(premiere.top, bas - h));
  /* les obstacles du jouable : noms et titres (1), barres (0,25), le détail ouvert (D-126), le + avec 6 px de marge (50), la chose annoncée (400) */
  const obs: Obstacle[] = [
    ...obstacles(NOMS_MESSAGE, 1, el, texteDe),
    ...obstacles('[data-frise] [data-chose]', 0.25, el),
    ...obstacles('[data-detail]', 50, el)
  ];
  if (fab) obs.push({ l: fab.left - 6, t: fab.top - 6, r: fab.right + 6, b: fab.bottom + 6, p: 50 });
  const places: Place[] = [];
  const a = chose(ancre);
  const r = a ? a.getBoundingClientRect() : null;
  if (r && r.width > 0 && r.height > 0) {
    const rangee = a!.closest('[data-rangee]')?.getBoundingClientRect() ?? r;
    obs.push({ l: r.left - 4, t: r.top - 4, r: r.right + 4, b: r.bottom + 4, p: 400 });
    places.push(
      { x: r.left, y: r.bottom + 6 }, { x: gauche, y: r.bottom + 6 }, { x: r.right - w, y: r.bottom + 6 },
      { x: r.left, y: r.top - 6 - h }, { x: gauche, y: r.top - 6 - h }, { x: gauche, y: rangee.bottom - h - 4 }
    );
    /* passe 9 du jouable : plus de places le long de la rangée (en largeur surtout) */
    for (const x of [r.right + 8, r.left - w - 8, (vw - w) / 2, (fab ? fab.left : vw) - w - 12]) {
      for (const y of [r.top + (r.height - h) / 2, r.bottom + 6, r.top - 6 - h]) places.push({ x, y });
    }
  }
  const libre = premiereLibre(w, h, places, obs, gauche, vw - 8, haut, bas + 1);
  /* sinon en bas, au-dessus des onglets, à gauche du + (l'alerte large : au-dessus du + qu'elle croiserait) */
  const fond = large && fab && fab.left < gauche + w ? Math.min(bas, fab.top - 10) : bas;
  const p = libre ?? { x: gauche, y: fond - h };
  el.style.left = `${Math.round(p.x)}px`;
  el.style.top = `${Math.round(p.y)}px`;
  return libre ? 'pres' : 'bas';
}

/** Le premier ancêtre qui défile en hauteur ; sinon la page (le `overflow` de body passe à la fenêtre : body n'est jamais le défilant). */
function defilant(el: Element): Element | null {
  for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

/**
 * CRITIQUE-13 n° 1 : l'alerte posée dans la frise se montre entière, au-dessus des onglets et du + volant ; le défilement s'arrête avant que la
 * vente promise passe sous l'en-tête (le jouable : `scrollBy` de l'alerte, borné par la barre bougée). Rend vrai s'il a défilé.
 */
export function montrerEntiere(el: HTMLElement, ancre: string | undefined, avant?: () => void): boolean {
  const r = el.getBoundingClientRect();
  if (r.height === 0) return false;
  let bas = window.innerHeight - 8;
  const nav = document.querySelector('nav.nav-principale')?.getBoundingClientRect();
  if (nav && vu(nav) && nav.width >= nav.height) bas = nav.top - 8;
  const fab = document.querySelector('.floating-actions button, button[aria-label^="Actions rapides"]')?.getBoundingClientRect();
  if (fab && vu(fab) && fab.left < r.right && fab.right > r.left) bas = Math.min(bas, fab.top - 8);
  const besoin = r.bottom - bas;
  if (besoin <= 0) return false;
  const entete = document.querySelector('[data-entete-zone]')?.getBoundingClientRect();
  const haut = entete && entete.height > 0 ? entete.bottom + 6 : 8;
  const a = chose(ancre)?.getBoundingClientRect();
  const dy = Math.round(Math.max(0, Math.min(besoin, (a && a.height > 0 ? a.top : r.top) - haut)));
  if (dy < 1) return false;
  avant?.();
  const d = defilant(el);
  if (d) d.scrollBy({ top: dy }); else window.scrollBy({ top: dy });
  return true;
}

export const Message: React.FC<MessageProps> = ({ message, onFermer, dureeMs = DUREE_MESSAGE_MS, detailOuvert = null, dansLaFrise = false, onDefileSeul }) => {
  const [detailOuvertLigne, setDetailOuvertLigne] = React.useState(false);
  const racine = React.useRef<HTMLDivElement>(null);
  const fermer = React.useRef(onFermer);
  fermer.current = onFermer;
  const defileSeul = React.useRef(onDefileSeul);
  defileSeul.current = onDefileSeul;
  const id = message?.id;
  const ancre = message?.ancre;
  /* CRITIQUE-4 n° 20 : une alerte qui attend une décision (« Livrer le 5 janv. ») ne part pas seule au bout de 7 s ; elle part au défilement,
     à un toucher ailleurs, à l'ouverture d'un détail (E33) ou par ses boutons. Le bandeau Annuler, lui, part seul. */
  const attend = !!message?.livrer;
  React.useEffect(() => {
    setDetailOuvertLigne(false);
    if (id === undefined || attend) return;
    const t = setTimeout(() => fermer.current(), dureeMs);
    return () => clearTimeout(t);
  }, [id, dureeMs, attend]);

  /* La place (CRITIQUE-12 n° 1), avant le premier rendu à l'écran ; recalculée à la rotation, au redimensionnement, après le rendu d'une
     écriture (la frise se remet en page après le message), à l'ouverture du détail, et à chaque image d'un défilement de moins de 24 px
     (CRITIQUE-10, doute m38 : jamais posé sur un nom qui arrive). Au-delà de 24 px, `CalendrierTab` le chasse. */
  React.useLayoutEffect(() => {
    const el = racine.current;
    if (!el || id === undefined) return undefined;
    if (dansLaFrise) {
      /* dans le flux de la frise : aucune place à calculer ; la frise défile pour la montrer entière, puis encore une fois après la remise en
         page qui suit l'écriture (le jouable attend 30 ms) */
      const avant = () => defileSeul.current?.();
      montrerEntiere(el, ancre, avant);
      const t = [150, 500, 900].map(ms => setTimeout(() => { if (el.isConnected) montrerEntiere(el, ancre, avant); }, ms));
      return () => t.forEach(clearTimeout);
    }
    const placer = () => {
      if (!el.isConnected) return;
      const place = placerMessage(el, ancre);
      if (place) el.dataset.place = place; else delete el.dataset.place;
    };
    const minuteries: Array<ReturnType<typeof setTimeout>> = [];
    placer();
    minuteries.push(setTimeout(placer, 150), setTimeout(placer, 500));
    const surTaille = () => { placer(); minuteries.push(setTimeout(placer, 150)); };
    window.addEventListener('resize', surTaille);
    let image: (() => void) | null = null;
    const surDefilement = () => { if (image === null) image = prochaineImage(() => { image = null; placer(); }); };
    window.addEventListener('scroll', surDefilement, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', surTaille); window.removeEventListener('scroll', surDefilement, { capture: true });
      minuteries.forEach(clearTimeout); image?.();
    };
  }, [id, ancre, detailOuvert, dansLaFrise]);

  if (!message) return null;
  const { role, texte, lien, annuler, livrer, detail } = message;
  const { nom, effet } = separerEffet(texte);
  /* avec un effet chiffré : le nom cède (points de suite), « · S49 : 1 088 → 1 988 » reste entier ; sinon le texte, deux lignes au plus */
  const corps = effet ? (
    <>
      <span className="cal-msg-t cal-msg-nom" data-msg-texte>{nom}</span>
      <span className="cal-msg-sep-v"> · </span>
      <span className="cal-msg-effet" data-msg-effet>{effet}</span>
    </>
  ) : <span className="cal-msg-t" data-msg-texte>{texte}</span>;
  return (
    <div
      ref={racine} role={role} className={`cal-msg${role === 'alert' ? ' cal-msg-alerte' : ''}`} data-message
      data-msg-origine={message.origine ?? 'calendrier'}
      {...(dansLaFrise ? { 'data-flux': '' } : {})}
      {...(message.ancre ? { 'data-ancre': message.ancre } : {})}
      {...(message.ouvreSonDetail ? { 'data-ouvre-son-detail': '' } : {})}
    >
      <div className={`cal-msg-l${effet ? ' cal-msg-l-effet' : ''}`}>
        {detail ? (
          <button type="button" className={`cal-msg-ligne${effet ? ' cal-msg-2l' : ''}`} aria-expanded={detailOuvertLigne} onClick={() => setDetailOuvertLigne(o => !o)}>
            {corps}
            <ChevronRight size={16} aria-hidden="true" className={detailOuvertLigne ? 'cal-msg-ch cal-msg-ch-o' : 'cal-msg-ch'} />
          </button>
        ) : <p className={`cal-msg-ligne${effet ? ' cal-msg-2l' : ''}`}>{corps}</p>}
        {detail && detailOuvertLigne && <small className="cal-msg-detail">{detail}</small>}
      </div>
      {(lien || livrer || annuler) && (
        <div className="cal-msg-bt" data-msg-boutons>
          {lien && (
            <>
              <span className="sr-only"> · </span>
              <button type="button" className="cal-msg-lien" data-msg-lien aria-label={lien.texte} onClick={e => { e.stopPropagation(); lien.agir(); }}>{lienCourt(lien.texte)}</button>
            </>
          )}
          {livrer && <button type="button" className="cal-msg-b cal-msg-b-pri" onClick={livrer.agir}>{livrer.texte}</button>}
          {annuler && (
            <>
              <span className="sr-only"> · </span>
              <button type="button" className="cal-msg-b" onClick={annuler}><Undo2 size={16} aria-hidden="true" />Annuler</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
