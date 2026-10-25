// D110 : « Un peu dur à comprendre ce système de petit bar » (23.10, sur les pictos d'une voie de Suggérer).
// Les traits de q2b restent tels qu'il les a choisis (règle n° 1). Toucher une case (picto et ses traits, son point,
// ses hachures) montre, juste au-dessus d'elle, ce qu'elle dit : la famille et sa valeur (« Agrumes +1,6 cran »), puis
// la clé du signe qu'on touche (« 1 trait = 1 cran du style »). Rien de plus au repos : la bulle n'existe pas tant
// qu'on ne touche pas. Le toucher n'a pas d'autre effet (ni route, ni comparaison, ni fiche) ; un toucher ailleurs
// ou Échap la referment ; au défilement, elle suit sa case. À l'ordinateur, le survol la montre, le clic la fixe.
// Reprise gr5 b (« Ça c'est top à mettre dans la vraie version », 24.10) : la bulle dit une seule ligne, mot pour mot comme
// sa page gr5 : « Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka » (famille à sa couleur, valeur de data-crans,
// code du style, « ton objectif » sur une case cerclée, les houblons de la voie) ; la case touchée est cernée. La clé
// « 1 trait = 1 cran du style » s'efface : « cran du 16D » la dit. Le signe reste vrai (−0,8 pour une baisse) et
// « hors du style » s'ajoute quand le trait est orangé (encodage de q2b).
// Classes préfixées pq-suggerer-bulle- (L26).
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { COULEURS, COURT } from '../../commun';
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';

/** Ce que dit une case : un effet en crans (traits), un effet non établi (hachures), ou une famille qui ne bouge pas. */
export type SensCase = ({ genre: 'traits'; f: FamilyId; crans: string; hors: boolean } | { genre: 'inconnu'; f: FamilyId } | { genre: 'calme'; f: FamilyId })
  & { /** Les houblons de la voie (« avec Motueka »). */ avec: string; /** Case cerclée : un objectif. */ cible: boolean };

interface Ouverte { cle: string; sens: SensCase; el: HTMLElement; fixee: boolean }
interface Bulle {
  ouverte: Ouverte | null;
  /** Code du style de la recette (« 16D »). */
  code: string;
  montrer: (cle: string, sens: SensCase, el: HTMLElement, fixee: boolean) => void;
  fermer: (cle?: string) => void;
}
const Ctx = createContext<Bulle | null>(null);

/** « +1,6 », « −0,8 » : data-crans arrondi au dixième, virgule décimale, vrai signe moins. */
export function valeurCrans(crans: string): string {
  const v = Number(Number(crans).toFixed(1));
  return `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1).replace('.', ',')}`;
}
const unite = (crans: string) => (Math.abs(Number(crans)) >= 1.95 ? 'crans' : 'cran');

export function BulleTraitsProvider({ children, code }: { children: ReactNode; code: string }) {
  const [ouverte, setOuverte] = useState<Ouverte | null>(null);
  const montrer = useCallback((cle: string, sens: SensCase, el: HTMLElement, fixee: boolean) => setOuverte({ cle, sens, el, fixee }), []);
  const fermer = useCallback((cle?: string) => setOuverte((o) => (!o || (cle && o.cle !== cle) ? o : null)), []);
  const valeur = useMemo(() => ({ ouverte, montrer, fermer, code }), [ouverte, montrer, fermer, code]);
  return <Ctx.Provider value={valeur}>{children}<BulleTraits /></Ctx.Provider>;
}

/** Les gestes d'une case : toucher ou cliquer ouvre (ou referme) sa bulle ; survol à la souris. */
export function useCase(cle: string, sens: SensCase) {
  const b = useContext(Ctx);
  const ouverte = b?.ouverte?.cle === cle;
  if (!b) return { 'data-case': cle };
  return {
    'data-case': cle,
    ...(ouverte ? { 'data-bulle-ouverte': '', 'aria-describedby': 'pq-suggerer-bulle' } : {}),
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (ouverte && b.ouverte?.fixee) b.fermer(cle);
      else b.montrer(cle, sens, e.currentTarget, true);
    },
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => { if (e.pointerType === 'mouse' && !b.ouverte?.fixee) b.montrer(cle, sens, e.currentTarget, false); },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { if (e.pointerType === 'mouse' && !b.ouverte?.fixee) b.fermer(cle); },
  };
}

/** La bulle, posée en fixe au-dessus de la case touchée (au-dessous s'il n'y a pas la place sous l'en-tête). */
function BulleTraits() {
  const b = useContext(Ctx)!;
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; dessous: boolean } | null>(null);
  // Un défilement ou une police chargée déplace la case : la bulle la suit (et se ferme si la case sort de l'écran).
  const [suivre, setSuivre] = useState(0);
  const o = b.ouverte;

  useLayoutEffect(() => {
    if (!o || !ref.current) { setPos(null); return; }
    const r = o.el.getBoundingClientRect();
    if (!o.el.isConnected || r.bottom < 0 || r.top > window.innerHeight) { b.fermer(); return; }
    const w = ref.current.offsetWidth, h = ref.current.offsetHeight;
    const cx = r.left + r.width / 2;
    const tete = document.querySelector('.pq-outil-suggerer > header')?.getBoundingClientRect().bottom ?? 0;
    // Comme gr5 : au-dessus de la ligne du houblon, pour ne pas cacher son nom (« avec Motueka » se lit sur la ligne).
    const nomLigne = o.el.closest('li')?.querySelector('.pq-sg-l1')?.getBoundingClientRect();
    const x = Math.max(6, Math.min(window.innerWidth - w - 6, cx - w / 2));
    // Au-dessus de la ligne du nom tant que la bulle reste près du picto (110 px au plus, D110) ; sinon (nom sur deux lignes,
    // avec ses mots hors 16D), juste au-dessus de la case : la bulle dit elle-même « avec Motueka ».
    const loin = (y: number) => Math.hypot(x + w / 2 - cx, y + h / 2 - (r.top + r.height / 2));
    const surNom = Math.min(r.top, nomLigne && nomLigne.height > 0 ? nomLigne.top : r.top);
    const haut = loin(surNom - h - 4) <= 110 ? surNom : r.top;
    const dessous = haut - h - 4 < tete + 4;
    setPos({ x, y: dessous ? r.bottom + 8 : haut - h - 4, dessous });
  }, [o, suivre, b]);

  // Un toucher ailleurs ou Échap referment la bulle ; le défilement la fait suivre sa case.
  useEffect(() => {
    if (!o) return;
    const ailleurs = (e: PointerEvent) => {
      const t = e.target as Node;
      if (o.el.contains(t) || ref.current?.contains(t)) return;
      // Une autre case : son clic ouvrira sa bulle.
      if ((t as HTMLElement).closest?.('[data-case]')) return;
      b.fermer();
    };
    const defile = () => setSuivre((n) => n + 1);
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); b.fermer(); } };
    document.addEventListener('pointerdown', ailleurs, true);
    document.addEventListener('scroll', defile, true);
    document.addEventListener('keydown', echap, true);
    return () => {
      document.removeEventListener('pointerdown', ailleurs, true);
      document.removeEventListener('scroll', defile, true);
      document.removeEventListener('keydown', echap, true);
    };
  }, [o, b]);

  if (!o) return null;
  const s = o.sens;
  return (
    <div ref={ref} id="pq-suggerer-bulle" role="tooltip" data-role="bulle-traits" data-famille-bulle={s.f}
      className="pq-suggerer-bulle" style={{ left: pos?.x ?? 0, top: pos?.y ?? 0, visibility: pos ? 'visible' : 'hidden' }}>
      <b className="pq-suggerer-bulle-nom" style={{ color: COULEURS[s.f].texte }}>{COURT[s.f]}</b>
      {' · '}{dit(s, b.code)}
      {s.cible && <>{' · '}<span className="pq-suggerer-bulle-bloc">ton objectif</span></>}
      {s.genre === 'traits' && s.hors && <span className="pq-suggerer-bulle-hors"> · hors du style</span>}
      {' · '}<span className="pq-suggerer-bulle-avec">avec {s.avec}</span>
    </div>
  );
}

/** La valeur de la case, comme gr5 : « +1,6 cran du 16D » ; l'inconnu n'est jamais 0 ; « ne bouge pas » sous ½ point. */
function dit(s: SensCase, code: string): string {
  if (s.genre === 'inconnu') return 'non établi : inconnu, pas zéro';
  if (s.genre === 'calme') return 'ne bouge pas';
  return `${valeurCrans(s.crans)} ${unite(s.crans)} du ${code}`;
}
