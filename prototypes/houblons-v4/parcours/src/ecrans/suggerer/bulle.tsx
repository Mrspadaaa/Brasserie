// D110 : « Un peu dur à comprendre ce système de petit bar » (23.10, sur les pictos d'une voie de Suggérer).
// Les traits de q2b restent tels qu'il les a choisis (règle n° 1). Toucher une case (picto et ses traits, son point,
// ses hachures) montre, juste au-dessus d'elle, ce qu'elle dit : la famille et sa valeur (« Agrumes +1,6 cran »), puis
// la clé du signe qu'on touche (« 1 trait = 1 cran du style »). Rien de plus au repos : la bulle n'existe pas tant
// qu'on ne touche pas. Le toucher n'a pas d'autre effet (ni route, ni comparaison, ni fiche) ; un toucher ailleurs
// ou Échap la referment ; au défilement, elle suit sa case. À l'ordinateur, le survol la montre, le clic la fixe.
// Classes préfixées pq-suggerer-bulle- (L26).
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { COURT, Picto } from '../../commun';
import type { FamilyId } from '../../../../src/engine';

/** Ce que dit une case : un effet en crans (traits), un effet non établi (hachures), ou une famille qui ne bouge pas. */
export type SensCase =
  | { genre: 'traits'; f: FamilyId; crans: string; hors: boolean }
  | { genre: 'inconnu'; f: FamilyId }
  | { genre: 'calme'; f: FamilyId };

interface Ouverte { cle: string; sens: SensCase; el: HTMLElement; fixee: boolean }
interface Bulle {
  ouverte: Ouverte | null;
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

export function BulleTraitsProvider({ children }: { children: ReactNode }) {
  const [ouverte, setOuverte] = useState<Ouverte | null>(null);
  const montrer = useCallback((cle: string, sens: SensCase, el: HTMLElement, fixee: boolean) => setOuverte({ cle, sens, el, fixee }), []);
  const fermer = useCallback((cle?: string) => setOuverte((o) => (!o || (cle && o.cle !== cle) ? o : null)), []);
  const valeur = useMemo(() => ({ ouverte, montrer, fermer }), [ouverte, montrer, fermer]);
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
  const [pos, setPos] = useState<{ x: number; y: number; fleche: number; dessous: boolean } | null>(null);
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
    const dessous = r.top - h - 8 < tete + 4;
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
    setPos({ x, y: dessous ? r.bottom + 8 : r.top - h - 8, fleche: Math.max(12, Math.min(w - 12, cx - x)), dessous });
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
  const nom = COURT[s.f];
  return (
    <div ref={ref} id="pq-suggerer-bulle" role="tooltip" data-role="bulle-traits" data-famille-bulle={s.f}
      className={`pq-suggerer-bulle ${pos?.dessous ? 'pq-suggerer-bulle-dessous' : ''}`}
      style={{ left: pos?.x ?? 0, top: pos?.y ?? 0, visibility: pos ? 'visible' : 'hidden', ['--fleche' as string]: `${pos?.fleche ?? 0}px` }}>
      <p className="pq-suggerer-bulle-titre">
        <Picto famille={s.f} taille={14} nomme={false} />
        <span className="pq-suggerer-bulle-nom">{nom}</span>{' '}
        {s.genre === 'traits' && <b className="pq-suggerer-bulle-valeur">{valeurCrans(s.crans)} {unite(s.crans)}</b>}
        {s.genre === 'inconnu' && <b className="pq-suggerer-bulle-valeur">? non établi</b>}
        {s.genre === 'calme' && <b className="pq-suggerer-bulle-valeur pq-suggerer-bulle-muet">ne bouge pas</b>}
      </p>
      <p className="pq-suggerer-bulle-cle">{cle(s)}</p>
    </div>
  );
}

/** La clé du signe touché, en une ligne : ce qu'est un trait, un contour, l'orangé, un point, des hachures. */
function cle(s: SensCase): ReactNode {
  if (s.genre === 'calme') return <><i className="pq-suggerer-calme pq-suggerer-bulle-signe" /> moins d’un demi-point</>;
  if (s.genre === 'inconnu') return <><i className="pq-hachure pq-suggerer-bulle-hachure" /> rien de simulé, jamais 0</>;
  const baisse = Number(s.crans) < 0;
  return (
    <>
      <i className={`pq-suggerer-trait pq-suggerer-bulle-signe ${baisse ? 'pq-suggerer-trait-baisse' : ''} ${s.hors ? 'pq-suggerer-trait-hors' : ''}`} />
      {' 1 trait = 1 cran du style'}
      {baisse && ' · creux : baisse'}
      {s.hors && <span className="pq-suggerer-bulle-hors"> · hors style</span>}
    </>
  );
}
