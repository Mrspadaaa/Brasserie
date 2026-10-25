// Le radar r2 de r6a : un seul radar, les houblons superposés. Le houblon retenu est plein, les autres en contour ;
// zone pâle = ta 16D ; trait noir = ta stout. Deux petites améliorations, sans changer sa forme :
//  - il ne sature plus (r6n1, r6n2, D103) : un centre au-delà du domaine s'arrête au bord et une flèche orangée
//    sort au bout de l'axe ; l'intervalle du retenu n'est plus une étoile pâle mais un trait fin par axe
//    (moustache, adoucie comme r6p1), coupé « // » quand il dépasse l'échelle ;
//  - ta demande (h4) : flèche verte vers l'extérieur sur la famille voulue plus, orangée vers le centre sur celle
//    qui est en trop.
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { Picto } from '../../commun';
import { ABSOLU, ORANGE, type ColonneLue } from './calcul';

// r6n2 : « Le radar perd 22 px (rayon 84 au lieu de 100) pour garder tout le tableau au-dessus du dock » ; ici rayon 77 (D128) : les dix rangées de familles de r6a tiennent au premier écran, au-dessus du dock, sous le sélecteur des étapes.
const W = 358, H = 200, CX = W / 2, CY = 100, RR = 77;
const rd = (x: number) => Math.round(x * 10) / 10;

export function Radar({ axes, cols, retenu, absolu, visee, trop }: {
  axes: FamilyId[]; cols: ColonneLue[]; retenu: string; absolu: boolean; visee: FamilyId; trop: FamilyId;
}) {
  const n = axes.length, pas = (2 * Math.PI) / n;
  const pt = (i: number, r: number): [number, number] => [CX + Math.sin(i * pas) * RR * r, CY - Math.cos(i * pas) * RR * r];
  const ech = (f: FamilyId) => (absolu ? ABSOLU : cols[0]?.cellules[f].domaine ?? 100);
  const k = (f: FamilyId, v: number) => Math.max(0, v / ech(f));
  const pts = (rs: number[]) => rs.map((r, i) => pt(i, Math.min(1, r)).map(rd).join(',')).join(' ');
  const anneau = (r: number) => 'M' + axes.map((_, i) => pt(i, r).map(rd).join(',')).join('L') + 'Z';
  const incTous = axes.map((f) => cols.every((c) => c.cellules[f].inconnu));
  const zone = axes.map((f) => { const b = cols[0]?.cellules[f].bandeHaut; return b == null ? 0 : Math.min(1, k(f, b)); });
  const avant = axes.map((f) => { const a = cols[0]?.cellules[f].avant; return a == null ? 0 : k(f, a); });
  const ordre = [...cols.filter((c) => c.cle !== retenu), ...cols.filter((c) => c.cle === retenu)];
  const sel = cols.find((c) => c.cle === retenu);
  return (
    <svg data-radar="" data-objet="houblons" data-axes={axes.join(',')} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="pq-comparer-radar"
      role="img" aria-label={`Radar ${absolu ? 'absolu' : 'au style'} : ${sel?.houblon.nom ?? ''} plein, les autres en contour ; zone pâle : ta 16D ; trait noir : ta stout`}>
      <defs>
        <pattern id="pq-comparer-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" className="pq-comparer-hach-trait" strokeWidth="1.2" />
        </pattern>
      </defs>
      {axes.map((f, i) => {
        if (!incTous[i]) return null;
        const a = pt(i - 0.5, 1), b = pt(i + 0.5, 1);
        return <path key={`h-${f}`} d={`M${CX},${CY}L${a.map(rd).join(',')}L${b.map(rd).join(',')}Z`} fill="url(#pq-comparer-hach)" opacity=".7" />;
      })}
      <path data-role="zone" d={'M' + zone.map((r, i) => pt(i, r).map(rd).join(',')).join('L') + 'Z'} fill="rgba(47,107,79,.10)" stroke="#2f6b4f" strokeWidth="1" />
      {[0.5, 1].map((r) => <path key={r} d={anneau(r)} fill="none" className="pq-comparer-grille" strokeWidth="1" />)}
      {axes.map((f, i) => { const e = pt(i, 1); return <line key={`a-${f}`} x1={CX} y1={CY} x2={rd(e[0])} y2={rd(e[1])} className="pq-comparer-grille" strokeWidth="1" />; })}
      {ordre.map((c) => {
        const plein = c.cle === retenu;
        const ce = axes.map((f) => k(f, c.cellules[f].centre));
        return (
          <g key={c.cle} data-serie={c.houblon.nom} data-couleur={c.couleur} data-valeurs={axes.map((f) => rd(c.cellules[f].centre)).join(',')}
            data-inconnues={axes.filter((f) => c.cellules[f].inconnu).join(',')} className={plein ? 'plein' : 'contour'}>
            <path d={`M${pts(ce).split(" ").join("L")}Z`} fill={plein ? c.couleur : 'none'} fillOpacity={plein ? 0.18 : 0} stroke={c.couleur} strokeWidth={plein ? 3 : 2.5} strokeLinejoin="round" />
            {plein && axes.map((f, i) => {
              // Moustache de l'intervalle (D103) : du bas au haut, coupée au bord ; « // » si elle continue au-delà.
              const cel = c.cellules[f];
              if (cel.inconnu) { const q = pt(i, Math.min(1, ce[i])); return <circle key={f} cx={rd(q[0])} cy={rd(q[1])} r="4" className="pq-comparer-rond-inconnu" strokeWidth="1.5" />; }
              const b = Math.min(1, k(f, cel.bas)), h = k(f, cel.haut), coupe = h > 1;
              const p0 = pt(i, b), p1 = pt(i, Math.min(1, h));
              const ux = Math.sin(i * pas), uy = -Math.cos(i * pas), nx = -uy, ny = ux;
              const barre = (d: number) => { const m = pt(i, Math.min(1, h) - d); return `M${rd(m[0] + nx * 3)},${rd(m[1] + ny * 3)}L${rd(m[0] - nx * 3 + ux * 2)},${rd(m[1] - ny * 3 + uy * 2)}`; };
              return (
                <g key={f} data-role="intervalle" data-famille-axe={f}>
                  <line x1={rd(p0[0])} y1={rd(p0[1])} x2={rd(p1[0])} y2={rd(p1[1])} stroke={c.couleur} strokeOpacity=".35" strokeWidth="1" />
                  {coupe && <path d={barre(0.03) + barre(0.07)} className="pq-comparer-coupe" strokeWidth="1" fill="none" />}
                </g>
              );
            })}
            {plein && ce.map((r, i) => {
              if (c.cellules[axes[i]].inconnu) return null;
              const q = pt(i, Math.min(1, r));
              return <circle key={axes[i]} cx={rd(q[0])} cy={rd(q[1])} r="3.4" fill={r > 1 ? ORANGE : c.couleur} />;
            })}
          </g>
        );
      })}
      <polygon data-role="ta-stout" points={pts(avant)} fill="none" className="pq-comparer-encre-trait" strokeWidth="1.5" strokeLinejoin="round" />
      {axes.map((f, i) => {
        // Pas de saturation : un centre retenu ou en contour au-delà du domaine fait sortir une flèche orangée.
        const depasse = cols.some((c) => !c.cellules[f].inconnu && k(f, c.cellules[f].centre) > 1);
        if (!depasse) return null;
        const a = pt(i, 1.02), b = pt(i, 1.11), ux = Math.sin(i * pas), uy = -Math.cos(i * pas), nx = -uy, ny = ux;
        return (
          <g key={`d-${f}`} data-role="depasse" data-famille-axe={f}>
            <line x1={rd(a[0])} y1={rd(a[1])} x2={rd(b[0])} y2={rd(b[1])} stroke={ORANGE} strokeWidth="2" />
            <path d={`M${rd(b[0] + ux * 5)},${rd(b[1] + uy * 5)}L${rd(b[0] + nx * 3.5)},${rd(b[1] + ny * 3.5)}L${rd(b[0] - nx * 3.5)},${rd(b[1] - ny * 3.5)}Z`} fill={ORANGE} />
          </g>
        );
      })}
      {axes.map((f, i) => {
        const q = pt(i, 1.3);
        const demande = f === visee ? 1 : f === trop ? -1 : 0;
        const ux = Math.sin(i * pas), uy = -Math.cos(i * pas);
        // Flèche de ta demande (h4), posée entre le bord et le picto : vers l'extérieur (plus), vers le centre (trop).
        const fl = demande ? (() => {
          const m = pt(i, 1.12), s = demande, t = [m[0] + ux * 6 * s, m[1] + uy * 6 * s], o = [m[0] - ux * 6 * s, m[1] - uy * 6 * s];
          const nx = -uy, ny = ux;
          return (
            <g data-role="demande" data-sens={s > 0 ? 'plus' : 'moins'} key={`f-${f}`}>
              <line x1={rd(o[0])} y1={rd(o[1])} x2={rd(t[0])} y2={rd(t[1])} stroke={s > 0 ? '#2f6b4f' : ORANGE} strokeWidth="2" />
              <path d={`M${rd(t[0] + ux * 4 * s)},${rd(t[1] + uy * 4 * s)}L${rd(t[0] + nx * 3.5)},${rd(t[1] + ny * 3.5)}L${rd(t[0] - nx * 3.5)},${rd(t[1] - ny * 3.5)}Z`} fill={s > 0 ? '#2f6b4f' : ORANGE} />
            </g>
          );
        })() : null;
        // La flèche de dépassement occupe déjà le bout de l'axe : la demande passe alors à côté du picto.
        return (
          <g key={`p-${f}`}>
            {fl && !cols.some((c) => !c.cellules[f].inconnu && k(f, c.cellules[f].centre) > 1) ? fl : null}
            <svg x={rd(q[0] - 8)} y={rd(q[1] - 8)} width="16" height="16" overflow="visible" opacity={incTous[i] ? 0.45 : 1}><Picto famille={f} taille={16} /></svg>
            {/* inconnu pour tous : secteur hachuré et picto pâle, sans « ? » écrit (r6p3) */}
          </g>
        );
      })}
    </svg>
  );
}
