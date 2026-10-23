// Le grand radar légendé de la fiche g1 : 12 axes (agrumes en haut), chaque axe nommé avec « 2/4 » (fiches qui la
// citent) ; une famille non décrite garde son axe, hachuré, nommée avec « ? » (D65, jamais 0) ; le rayon suit le nombre
// de fiches (D72) ; une flèche sur les familles de sa demande (« plus floral » vers l'extérieur, « moins résineux »
// vers le centre). Points aux couleurs des familles.
import { COULEURS, COURT, ROUE } from '../../commun';
import type { HoublonLu } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';

const W = 340, H = 330, C = { x: W / 2, y: H / 2 }, R = 96;

export function RadarFiche({ h, demande }: { h: HoublonLu; demande: Partial<Record<FamilyId, number | 'banni'>> }) {
  const n = ROUE.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [C.x + Math.cos(ang(i)) * r, C.y + Math.sin(ang(i)) * r] as const;
  const plus = Math.max(1, ...ROUE.map((f) => (h.familles[f].niveau === 'non décrit' ? 0 : h.familles[f].fiches)));
  const rayon = (f: FamilyId) => (h.familles[f].niveau === 'non décrit' ? null : Math.max(0.2, h.familles[f].fiches / plus));
  const pts = ROUE.map((f, i) => pt(i, (rayon(f) ?? 0) * R));
  const poly = (ps: (readonly [number, number])[]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg data-radar="" data-objet="fiche" viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[22rem] mx-auto block" role="img"
      aria-label={`Silhouette de ${h.nom}`}>
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
        const r = rayon(f);
        return r == null
          ? <circle key={f} cx={pt(i, 5)[0]} cy={pt(i, 5)[1]} r="3" fill="rgb(var(--cave-950))" stroke="rgb(var(--cave-400))" strokeWidth="1" />
          : <circle key={f} cx={pts[i][0]} cy={pts[i][1]} r={h.familles[f].niveau === 'marqué' ? 4.5 : 3.5} fill={h.familles[f].niveau === 'marqué' ? 'rgb(var(--cave-50))' : 'rgb(var(--cave-950))'} stroke="rgb(var(--cave-50))" strokeWidth="1.5" />;
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
        const ancre = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
        const x_ = h.familles[f];
        const inconnu = x_.niveau === 'non décrit';
        const fort = demande[f] === 1 || demande[f] === -1;
        return (
          <text key={f} x={x} y={y + 4} textAnchor={ancre} fontSize="12" fontWeight={fort ? 700 : 400}
            fill={inconnu ? 'rgb(var(--cave-texte-400))' : 'rgb(var(--cave-texte-200))'}>
            {COURT[f]}{inconnu ? '?' : ` ${x_.fiches}/${x_.sur}`}
          </text>
        );
      })}
    </svg>
  );
}
