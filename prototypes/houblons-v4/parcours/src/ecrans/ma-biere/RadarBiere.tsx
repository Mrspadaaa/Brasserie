// Radar m4 de Ma bière, à un toucher des barres (« Radar: m4 h4 très bien ») : 12 axes, agrumes en haut, sans
// légende écrite. Au style : chaque axe va de 0 à deux fois le haut de la bande du style, la zone du style
// remplit la moitié intérieure (comme la barre l5b) ; en absolu : 0 → 110, la zone est la bande brute.
// Ma bière : aplat et points aux couleurs des familles ; « avant » (dernier changement) en pointillé ; une
// famille inconnue garde son axe, hachuré, son nom suivi de « ? », jamais un 0 (D48 bis, D65).
import type { Echelle } from '../../commun';
import { COULEURS, COURT, ROUE } from '../../commun';
import type { ProfilLu } from '../../moteur';

const W = 340, H = 300, C = { x: W / 2, y: H / 2 + 2 }, R = 104;

export function RadarBiere({ profil, avant, echelle }: { profil: ProfilLu; avant?: ProfilLu | null; echelle: Echelle }) {
  const n = ROUE.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [C.x + Math.cos(ang(i)) * r, C.y + Math.sin(ang(i)) * r] as const;
  const rel = (f: (typeof ROUE)[number], v: number) => {
    const haut = profil[f].bande?.[1];
    const k = echelle === 'style' && haut ? v / (2 * haut) : v / 110;
    return Math.max(0, Math.min(1.08, k));
  };
  const zone = ROUE.map((f, i) => {
    const b = profil[f].bande;
    if (!b) return pt(i, 0);
    return pt(i, R * (echelle === 'style' ? 0.5 : b[1] / 110));
  });
  const serie = (p: ProfilLu) => ROUE.map((f, i) => pt(i, R * (p[f].valeur ? rel(f, p[f].valeur.centre) : 0)));
  const maintenant = serie(profil);
  const av = avant ? serie(avant) : null;
  const poly = (ps: (readonly [number, number])[]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg data-radar="" data-objet="biere" data-echelle={echelle} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[22rem] mx-auto block"
      role="img" aria-label={`Profil de ma bière ${echelle === 'style' ? 'au style' : 'en absolu'}`}>
      <defs>
        <pattern id="pq-ma-biere-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgb(var(--cave-700))" strokeWidth="1.2" />
        </pattern>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={poly(ROUE.map((_, i) => pt(i, R * k)))} fill="none" stroke="rgb(var(--cave-800))" strokeWidth={k === 1 ? 1 : 0.6} />
      ))}
      <polygon data-role="zone" points={poly(zone)} fill="rgb(var(--cave-700) / 0.28)" stroke="rgb(var(--cave-600))" strokeWidth="0.8" strokeDasharray="3 2" />
      {ROUE.map((f, i) => {
        if (profil[f].valeur) return <line key={f} x1={C.x} y1={C.y} x2={pt(i, R)[0]} y2={pt(i, R)[1]} stroke="rgb(var(--cave-800))" strokeWidth="0.6" />;
        const a = pt(i - 0.5, R), b = pt(i + 0.5, R);
        return <path key={f} data-inconnu="" d={`M${C.x},${C.y} L${a[0]},${a[1]} L${b[0]},${b[1]} Z`} fill="url(#pq-ma-biere-hach)" opacity="0.7" />;
      })}
      {av && <polygon data-role="avant" points={poly(av)} fill="none" stroke="rgb(var(--cave-400))" strokeWidth="1.4" strokeDasharray="4 3" />}
      <polygon data-role="apres" points={poly(maintenant)} fill="rgb(var(--cave-50) / 0.10)" stroke="rgb(var(--cave-50))" strokeWidth="1.6" strokeLinejoin="round" />
      {ROUE.map((f, i) => {
        const v = profil[f].valeur;
        const [x, y] = maintenant[i];
        const hors = profil[f].horsStyle === 'au-dessus';
        return v
          ? <circle key={f} cx={x} cy={y} r={hors ? 5 : 3.6} fill={hors ? '#c2410c' : COULEURS[f].base} stroke="rgb(var(--cave-900))" strokeWidth="1" />
          : <circle key={f} cx={pt(i, 9)[0]} cy={pt(i, 9)[1]} r="2.6" fill="rgb(var(--cave-900))" stroke="rgb(var(--cave-400))" strokeWidth="1" />;
      })}
      {ROUE.map((f, i) => {
        const [x, y] = pt(i, R + 22);
        const a = Math.cos(ang(i));
        const ancre = Math.abs(a) < 0.2 ? 'middle' : a > 0 ? 'start' : 'end';
        const inconnu = !profil[f].valeur;
        const attendue = profil[f].statut === 'attendue';
        const dx = ancre === 'start' ? -6 : ancre === 'end' ? 6 : 0;
        return (
          <g key={f}>
            <use href={`#p-${f}`} x={x - 7 + dx - (ancre === 'start' ? 2 : ancre === 'end' ? -2 : 0)} y={y - 20} width="13" height="13" opacity={inconnu ? 0.45 : 1} />
            <text x={x + dx} y={y + 6} textAnchor={ancre} fontSize="11.5" fontWeight={attendue ? 700 : 400}
              fill={profil[f].horsStyle === 'au-dessus' ? '#c2410c' : inconnu ? 'rgb(var(--cave-texte-400))' : 'rgb(var(--cave-texte-200))'}>
              {COURT[f]}{inconnu ? ' ?' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
