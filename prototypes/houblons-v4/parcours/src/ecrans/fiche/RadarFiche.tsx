// Le grand radar légendé de la fiche g1 : 12 axes (agrumes en haut), chaque axe nommé avec « 2/4 » (fiches qui la
// citent ; rien quand une seule fiche décrit le houblon, jamais « 1/1 ») ; une famille non décrite garde son axe,
// hachuré, nommée avec « ? » (D65, jamais 0) ; le rayon suit le nombre de fiches (D72) ; une flèche sur les familles
// de sa demande (« plus floral » vers l'extérieur, « moins résineux » vers le centre). Points aux couleurs des familles.
// Toucher un sommet (ou son secteur, au doigt) ouvre la bulle de g1 : « Melon : ses fiches ne le décrivent pas, inconnu
// (ce n'est pas zéro), posé au centre » ; « Tropicaux : 2/4 fiches » ; un toucher hors du radar la referme.
import { useEffect, useRef, useState } from 'react';
import { COULEURS, COURT, ROUE } from '../../commun';
import type { HoublonLu } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';

const W = 340, H = 330, C = { x: W / 2, y: H / 2 }, R = 96;

export function RadarFiche({ h, demande }: { h: HoublonLu; demande: Partial<Record<FamilyId, number | 'banni'>> }) {
  const [bulle, setBulle] = useState<FamilyId | null>(null);
  const boite = useRef<HTMLDivElement | null>(null);
  // Un toucher ailleurs referme la bulle (g1 : « Un toucher hors d'un radar referme sa bulle »).
  useEffect(() => {
    if (!bulle) return;
    const hors = (e: PointerEvent) => { if (!boite.current?.contains(e.target as Node)) setBulle(null); };
    document.addEventListener('pointerdown', hors, true);
    return () => document.removeEventListener('pointerdown', hors, true);
  }, [bulle]);
  const n = ROUE.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [C.x + Math.cos(ang(i)) * r, C.y + Math.sin(ang(i)) * r] as const;
  // Échelle d'au moins 2 fiches (g1) : une famille citée par la seule fiche d'un houblon n'atteint pas le bord.
  const plus = Math.max(2, ...ROUE.map((f) => (h.familles[f].niveau === 'non décrit' ? 0 : h.familles[f].fiches)));
  const inconnue = (f: FamilyId) => h.familles[f].niveau === 'non décrit' || h.familles[f].fiches === 0;
  // L'échelle de g1, de -0,5 à `plus` : une famille inconnue se pose dans le disque du centre, à mi-chemin du zéro (RC),
  // jamais au centre exact ; chaque famille décrite garde ainsi une base et fait un pic, même seule entre deux inconnues
  // (D133 : « le spidergraph doit être en pic pas juste des traits... »).
  const echelle = (v: number) => (v + 0.5) / (plus + 0.5);
  const RC = echelle(-0.25);
  const rayon = (f: FamilyId) => (inconnue(f) ? null : echelle(h.familles[f].fiches));
  const pts = ROUE.map((f, i) => pt(i, (rayon(f) ?? RC) * R));
  const poly = (ps: (readonly [number, number])[]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const compte = (f: FamilyId) => (h.familles[f].sur === 1 ? '' : ` ${h.familles[f].fiches}/${h.familles[f].sur}`);
  const motsBulle = (f: FamilyId) => {
    const x = h.familles[f], v = demande[f];
    const base = inconnue(f) ? 'ses fiches ne le décrivent pas, inconnu (ce n’est pas zéro), posé au centre'
      : x.sur === 1 ? 'une seule fiche' : `${x.fiches}/${x.sur} fiches`;
    return v === 1 || v === -1 ? `${base} ; tu en veux ${v === 1 ? 'plus' : 'moins'}` : base;
  };
  // La bulle se pose au-dessus du sommet (dessous près du haut), dans la largeur du radar.
  const ancre = bulle ? (() => { const i = ROUE.indexOf(bulle); const [x, y] = inconnue(bulle) ? pt(i, R * 0.45) : pts[i]; return { x: x / W, y: y / H }; })() : null;
  const montrer = (f: FamilyId) => setBulle((b) => (b === f ? b : f));
  return (
    <div ref={boite} className="relative w-full max-w-[22rem] mx-auto">
      <svg data-radar="" data-objet="fiche" viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img"
        aria-label={`Silhouette de ${h.nom} selon ses fiches ; les familles non décrites sont inconnues, pas à zéro`}>
        <defs>
          <pattern id="pq-fiche-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="rgb(var(--cave-700))" strokeWidth="1.1" />
          </pattern>
          <marker id="pq-fiche-fleche" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="rgb(var(--cave-50))" />
          </marker>
        </defs>
        {[0.5, 1].map((k) => <polygon key={k} points={poly(ROUE.map((_, i) => pt(i, R * k)))} fill="none" stroke="rgb(var(--cave-700))" strokeWidth="0.8" />)}
        {ROUE.map((f, i) => {
          if (rayon(f) != null) return <line key={f} x1={C.x} y1={C.y} x2={pt(i, R)[0]} y2={pt(i, R)[1]} stroke={COULEURS[f].base} strokeWidth="1.2" opacity="0.8" />;
          const a = pt(i - 0.5, R), b = pt(i + 0.5, R);
          return <path key={f} data-inconnu="" d={`M${C.x},${C.y} L${a[0]},${a[1]} L${b[0]},${b[1]} Z`} fill="url(#pq-fiche-hach)" />;
        })}
        <polygon points={poly(pts)} fill="rgb(var(--cave-700) / 0.35)" stroke="rgb(var(--cave-50))" strokeWidth="2" strokeLinejoin="round" />
        {ROUE.map((f, i) => {
          const r = rayon(f), on = bulle === f;
          return r == null
            ? <circle key={f} cx={pt(i, 5)[0]} cy={pt(i, 5)[1]} r={on ? 4 : 3} fill="rgb(var(--cave-950))" stroke="rgb(var(--cave-400))" strokeWidth="1" />
            : <circle key={f} cx={pts[i][0]} cy={pts[i][1]} r={(h.familles[f].niveau === 'marqué' ? 4.5 : 3.5) + (on ? 1.5 : 0)} fill={h.familles[f].niveau === 'marqué' ? 'rgb(var(--cave-50))' : 'rgb(var(--cave-950))'} stroke="rgb(var(--cave-50))" strokeWidth="1.5" />;
        })}
        {ROUE.map((f, i) => {
          const v = demande[f];
          if (v !== 1 && v !== -1) return null;
          // La flèche dit la demande : vers l'extérieur pour « plus », vers le centre pour « moins ».
          const [x0, y0] = pt(i, R + (v === 1 ? 4 : 30)), [x1, y1] = pt(i, R + (v === 1 ? 30 : 6));
          return <line key={f} data-demande={f} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgb(var(--cave-50))" strokeWidth="2.2" markerEnd="url(#pq-fiche-fleche)" />;
        })}
        {ROUE.map((f, i) => {
          const [x, y] = pt(i, R + (demande[f] === 1 || demande[f] === -1 ? 44 : 22));
          const c = Math.cos(ang(i));
          const ancre_ = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
          const fort = demande[f] === 1 || demande[f] === -1;
          return (
            <text key={f} x={x} y={y + 4} textAnchor={ancre_} fontSize="12" fontWeight={fort ? 700 : 400}
              fill={inconnue(f) ? 'rgb(var(--cave-texte-400))' : 'rgb(var(--cave-texte-200))'}>
              {COURT[f]}{inconnue(f) ? '?' : compte(f)}
            </text>
          );
        })}
        {/* Cibles du doigt : le secteur entier de chaque famille, jusqu'à son nom (un sommet inconnu est posé au centre,
            trop petit sous le doigt). Transparentes : elles ne dessinent rien. */}
        {ROUE.map((f, i) => {
          const a = pt(i - 0.5, R + 34), b = pt(i + 0.5, R + 34);
          return (
            <path key={f} data-sommet={f} {...(f === 'melon' ? { 'data-etat': 'etat-fiche-radar-sommet' } : {})}
              d={`M${C.x},${C.y} L${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)} Z`}
              fill="transparent" pointerEvents="all" className="pq-fiche-cible"
              onPointerDown={() => montrer(f)}
              onPointerEnter={(e) => { if (e.pointerType === 'mouse') montrer(f); }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') setBulle(null); }} />
          );
        })}
      </svg>
      {bulle && ancre && (
        <p role="status" data-role="fiche-bulle"
          className="pq-fiche-bulle absolute z-10 max-w-[92%] w-max px-2 py-1 rounded-lg border border-cave-700 bg-cave-900 text-sm leading-snug text-cave-50 pointer-events-none"
          style={{ left: `${(ancre.x * 100).toFixed(1)}%`, top: `${(ancre.y * 100).toFixed(1)}%`,
            transform: `translate(${ancre.x < 0.36 ? '-16px' : ancre.x > 0.64 ? 'calc(-100% + 16px)' : '-50%'}, ${ancre.y < 0.28 ? '14px' : 'calc(-100% - 12px)'})` }}>
          <b className="font-semibold">{COURT[bulle]}</b> : {motsBulle(bulle)}
        </p>
      )}
    </div>
  );
}
