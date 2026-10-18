// Lentilles Barres et Radar (booster C1) : mêmes données, autre forme. Chaque famille a sa
// piste zoomée sur la bande du style (trackPosition du moteur v4) ; la cible de la
// direction est un repère d'accent. Contenu d'essai : l'écran viendra du fil de fer consolidé.
import { trackPosition, type FamilyId, type StyleScale } from '../../src/engine';
import { FAMILY_NAMES, nombre } from './donnees';

export type LentilleId = 'barres' | 'radar';
export type Cibles = Partial<Record<FamilyId, number>>;

const COURT: Record<FamilyId, string> = {
  citrus: 'Agrumes', tropical: 'Tropical', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon',
  floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Vert', earthy: 'Terreux',
};
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function bande(style: StyleScale, f: FamilyId): [number, number] {
  const fs = style.families[f];
  return fs.band ? [trackPosition(fs.band[0], fs).x, trackPosition(fs.band[1], fs).x] : [0, 1];
}
function libelle(style: StyleScale, f: FamilyId, cibles: Cibles): string {
  const b = style.families[f].band;
  const c = cibles[f];
  return `${FAMILY_NAMES[f]} : style ${b ? `${b[0]}–${b[1]}` : 'sans bande'}${c != null ? `, cible ${nombre(c)}` : ''}`;
}

export function Barres({ style, cibles }: { style: StyleScale; cibles: Cibles }) {
  return (
    <ul className="space-y-1" aria-label={`Familles au style ${style.code}`}>
      {style.order.map((f) => {
        const [x0, x1] = bande(style, f);
        const c = cibles[f];
        return (
          <li key={f} className="grid grid-cols-[8.75rem_minmax(0,1fr)] items-center gap-2">
            <span className={`text-2xs truncate ${style.families[f].status === 'attendue' ? 'text-cave-50 font-semibold' : 'text-cave-400'}`}>
              {FAMILY_NAMES[f]}
            </span>
            <span role="img" aria-label={libelle(style, f, cibles)} className="relative h-2.5 rounded-full bg-cave-800">
              <span className="absolute inset-y-0 rounded-full bg-marque" style={{ left: pct(x0), width: pct(x1 - x0) }} />
              {c != null && (
                <span className="absolute -inset-y-1 w-1 -ml-0.5 rounded-full bg-repere" style={{ left: pct(trackPosition(c, style.families[f]).x) }} />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Radar({ style, cibles }: { style: StyleScale; cibles: Cibles }) {
  const n = style.order.length, cx = 170, cy = 124, r0 = 16, R = 92;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, x: number) => {
    const r = r0 + x * (R - r0);
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))] as const;
  };
  const anneau = (k: 0 | 1) => 'M' + style.order.map((f, i) => pt(i, bande(style, f)[k]).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z';
  return (
    <svg viewBox="0 0 340 248" className="block w-full max-w-[340px] mx-auto" role="img"
      aria-label={`Radar au style ${style.code} : ${style.order.map((f) => libelle(style, f, cibles)).join(' ; ')}`}>
      {style.order.map((f, i) => {
        const [x1, y1] = pt(i, 0), [x2, y2] = pt(i, 1), [lx, ly] = pt(i, 1.17);
        const cos = Math.cos(angle(i));
        return (
          <g key={f}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(var(--cave-800))" strokeWidth={1} />
            <text x={lx} y={ly} dy="0.35em" textAnchor={cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'}
              // Encre de texte du thème (variable texte, pas la teinte d'aplat) : ≥ 4,5:1.
              className={style.families[f].status === 'attendue' ? 'font-semibold' : undefined}
              style={{ fill: `rgb(var(--cave-texte-${style.families[f].status === 'attendue' ? '50' : '400'}))`, fontSize: '0.8125rem' }}>
              {COURT[f]}
            </text>
          </g>
        );
      })}
      {/* Bande du style : anneau entre bord bas et bord haut de chaque piste zoomée. */}
      <path d={anneau(1) + anneau(0)} fillRule="evenodd" fill="rgb(var(--marque) / 0.3)" stroke="rgb(var(--marque))" strokeWidth={2} strokeLinejoin="round" />
      {style.order.map((f, i) => {
        const c = cibles[f];
        if (c == null) return null;
        const [x, y] = pt(i, trackPosition(c, style.families[f]).x);
        return <circle key={f} cx={x} cy={y} r={5} fill="rgb(var(--repere))" stroke="rgb(var(--cave-900))" strokeWidth={1.5} />;
      })}
    </svg>
  );
}
