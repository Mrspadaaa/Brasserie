// Le radar de u4 (géométrie D3 de fils7-radar/p04 : 12 axes fermés, lineRadial + curveLinearClosed = un polygone
// fermé), reproduit en SVG sans d3 : Nugget en contour seul (l'original), les deux remplaçants remplis à 22 % ;
// du centre vers le bord : non décrit, cité, marqué (ronds blancs = cité, pleins = marqué) ; une famille qu'aucune
// des trois fiches ne décrit a son secteur hachuré, un rond pointillé et son nom en italique suivi de « ? » (D65 :
// l'inconnu n'est pas un zéro) ; en gras, les familles attendues au style. Classes préfixées pq-substituer- (L26).
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { COURT } from '../../commun';

export const AXES_U4: FamilyId[] = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];

export interface SerieRadar { nom: string; couleur: string; original: boolean; niveaux: Record<FamilyId, 0 | 1 | 2> }

export function RadarU4({ series, attendues, inconnues, nomStyle }: { series: SerieRadar[]; attendues: Set<FamilyId>; inconnues: Set<FamilyId>; nomStyle: string }) {
  const W = 358, H = 300, CX = 179, CY = 150, R = 98, n = AXES_U4.length, pas = (2 * Math.PI) / n;
  const r = (v: number) => ((v + 0.5) / 2.5) * R;
  const xy = (a: number, rr: number): [number, number] => [rr * Math.sin(a), -rr * Math.cos(a)];
  const poly = (vals: number[]) => vals.map((v, i) => xy(i * pas, r(v)).map((x) => x.toFixed(1)).join(',')).join(' ');
  const rb = R * Math.cos(pas / 2);
  return (
    <svg data-radar="" data-objet="houblons" data-axes={AXES_U4.join(',')} role="img" aria-label={`Radar des citations : ${series.map((s) => s.nom).join(', ')}`}
      width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="pq-substituer-radar">
      <defs>
        <pattern id="pq-substituer-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.15)" />
        </pattern>
      </defs>
      <g transform={`translate(${CX},${CY})`}>
        {AXES_U4.map((f, i) => {
          if (!inconnues.has(f)) return null;
          const a = i * pas;
          const pts = [xy(a - pas / 2, rb), xy(a, R), xy(a + pas / 2, rb)];
          return <path key={'h' + f} d={`M0,0L${pts.map((p) => p.join(',')).join('L')}Z`} fill="url(#pq-substituer-hach)" />;
        })}
        {[0, 1, 2].map((v) => <polygon key={'g' + v} points={poly(Array(n).fill(v))} fill="none" stroke={v === 0 ? '#e4e4e4' : '#c9c9c9'} />)}
        {AXES_U4.map((f, i) => { const [x, y] = xy(i * pas, R); return <line key={'a' + f} x1={0} y1={0} x2={x} y2={y} stroke="#e6e6e6" />; })}
        {series.map((s) => {
          const v = AXES_U4.map((f) => s.niveaux[f]);
          return (
            <g key={s.nom} data-serie={s.nom} data-valeurs={v.join(',')} data-inconnues={AXES_U4.filter((f) => inconnues.has(f)).join(',')}>
              <polygon points={poly(v)} fill={s.original ? 'none' : s.couleur} fillOpacity={s.original ? undefined : 0.22}
                stroke={s.couleur} strokeWidth={s.original ? 2.5 : 2} strokeLinejoin="round" />
              {AXES_U4.map((f, i) => {
                if (!v[i]) return null;
                const [x, y] = xy(i * pas, r(v[i]));
                return <circle key={f} cx={x} cy={y} r={v[i] === 2 ? 3.8 : 3.2} fill={v[i] === 2 ? s.couleur : '#fff'} stroke={s.couleur} strokeWidth={1.6} />;
              })}
            </g>
          );
        })}
        {AXES_U4.map((f, i) => {
          if (!inconnues.has(f)) return null;
          const [x, y] = xy(i * pas, r(0));
          return <circle key={'i' + f} data-inconnu={f} cx={x} cy={y} r={4.2} fill="#fff" stroke="#8a8a8a" strokeWidth={1.4} strokeDasharray="2 1.6"><title>{`${COURT[f]} : aucune fiche ne la décrit`}</title></circle>;
        })}
        {AXES_U4.map((f, i) => {
          const a = i * pas, s = Math.sin(a), c = Math.cos(a);
          const [x, y] = xy(a, R + 10);
          const att = attendues.has(f), u = inconnues.has(f);
          return (
            <text key={'t' + f} x={x} y={c > 0.9 ? y - 2 : c < -0.9 ? y + 11 : y + 4} textAnchor={Math.abs(s) < 0.1 ? 'middle' : s > 0 ? 'start' : 'end'}
              fontSize={12} fontWeight={att ? 700 : 400} fontStyle={u ? 'italic' : 'normal'} fill={u ? '#767676' : '#111'}
              data-statut-style={att ? 'attendue' : 'neutre'}>
              {COURT[f] + (u ? ' ?' : '')}
              {att && <title>{`attendu en ${nomStyle}`}</title>}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
