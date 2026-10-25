// Silhouette d'un houblon (radar h4 de la fiche g1, sans légende écrite) : 12 axes dans l'ordre de la roue,
// agrumes en haut. Le rayon suit le nombre de fiches qui citent la famille (D72 : « 1/4, 2/4 mais même
// valeur ??? ») ; une famille non décrite n'est pas à 0 : son secteur est hachuré et son point creux (D65).
// Les pictos de la page marquent les axes (mêmes symboles <use href="#p-…">).
import { COULEURS, COURT, ROUE } from './commun';
import type { HoublonLu } from '../parcours/adaptateur';

const C = 70, R = 50, RP = 62;

export function Silhouette({ h, taille = 140 }: { h: HoublonLu; taille?: number }) {
  const n = ROUE.length;
  const ang = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [C + Math.cos(ang(i)) * r, C + Math.sin(ang(i)) * r] as const;
  // Le rayon suit le nombre de fiches, rapporté à la famille la plus citée (la forme se lit ; « 2/4 » est écrit à côté).
  const plus = Math.max(1, ...ROUE.map((f) => (h.familles[f].niveau === 'non décrit' ? 0 : h.familles[f].fiches)));
  const rayon = (f: (typeof ROUE)[number]) => {
    const x = h.familles[f];
    if (x.niveau === 'non décrit' || !x.sur) return null;
    return Math.max(0.25, x.fiches / plus) * (x.niveau === 'marqué' ? 1 : 0.92);
  };
  const pts = ROUE.map((f, i) => { const r = rayon(f); return pt(i, (r ?? 0) * R); });
  const id = `pq-fiche-hach-${h.cle.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg data-radar="" data-objet="fiche" data-houblon-radar={h.cle} viewBox="0 0 140 140" width={taille} height={taille}
      role="img" aria-label={`Silhouette de ${h.nom} : ${ROUE.filter((f) => rayon(f) != null).map((f) => COURT[f]).join(', ')}`}>
      <defs>
        <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="rgb(var(--cave-700))" strokeWidth="1.2" />
        </pattern>
      </defs>
      {[0.5, 1].map((k) => (
        <polygon key={k} points={ROUE.map((_, i) => pt(i, R * k).join(',')).join(' ')} fill="none" stroke="rgb(var(--cave-800))" strokeWidth="0.8" />
      ))}
      {ROUE.map((f, i) => {
        if (rayon(f) != null) return <line key={f} x1={C} y1={C} x2={pt(i, R)[0]} y2={pt(i, R)[1]} stroke="rgb(var(--cave-800))" strokeWidth="0.6" />;
        const a = pt(i - 0.5, R), b = pt(i + 0.5, R);
        return <path key={f} d={`M${C},${C} L${a[0]},${a[1]} L${b[0]},${b[1]} Z`} fill={`url(#${id})`} opacity="0.8" />;
      })}
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="rgb(var(--cave-700) / 0.35)" stroke="rgb(var(--cave-50))" strokeWidth="1.4" strokeLinejoin="round" />
      {ROUE.map((f, i) => {
        const r = rayon(f);
        const [x, y] = pts[i];
        return r == null
          ? null
          : <circle key={f} cx={x} cy={y} r={h.familles[f].niveau === 'marqué' ? 3.4 : 2.6} fill={COULEURS[f].base} stroke="rgb(var(--cave-900))" strokeWidth="0.8" />;
      })}
      {ROUE.map((f, i) => {
        const [x, y] = pt(i, RP);
        const connu = rayon(f) != null;
        return <use key={f} href={`#p-${f}`} x={x - 6} y={y - 6} width="12" height="12" opacity={connu ? 1 : 0.35} />;
      })}
    </svg>
  );
}
