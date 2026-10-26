// Le radar commun, porté du radar de cmc2h, son choix (« C'est quasiment parfait », sur cmc2g, 25.10), et sa demande :
// « Ensuite utiliser ce radar graph comme Baseline et l'utiliser partout dans les vue où il y en a » (voie
// rb-radar-commun). Une seule implémentation pour Comparer, la fiche, Suggérer, Substituer et Ma bière (voie rb2-ma-biere,
// qui l'a déplacé dans l'app : la maquette le réexporte). Il ne calcule rien du moteur : chaque écran lui donne ses
// séries, déjà lues.
//
// Grammaire (Beer Maverick, rdf1 puis rdg5) : anneaux réguliers, zéro sur un petit anneau (jamais au centre), segments
// droits et un point par valeur, remplissage translucide du contour au petit anneau, toutes les séries superposées, la
// retenue en avant, pictos aux 12 axes. L'inconnu n'est jamais une valeur : ni point, ni remplissage, ni trait plein.
//   - inconnu de toutes les séries : les familles sont regroupées en bas, en un seul secteur hachuré « sans donnée »
//     qui porte leurs pictos ;
//   - inconnu d'une série : une pastille « ? » à sa couleur au bord ; son trait l'enjambe en tireté (5 4), à sa
//     couleur et à son épaisseur.
// Normalisation (D68, « SI choisi absolu, plus de normalisation, pour le radar et pour les barre et le reste !! ») :
//   - mode « style » : chaque axe a son échelle, le plus fort des séries (et de la référence) sur cet axe, écrit près
//     du picto ; anneaux en parts (¼, ½, ¾) ; la zone du style en vert pâle ; au-dessus d'elle, le point est orangé ;
//   - mode « absolu » : une échelle fixe et commune (0 à 12,5 crans par défaut), anneaux chiffrés sur l'axe du haut,
//     valeurs brutes ; pas de zone ;
//   - une note sur une échelle de mots (Ma bière : pas senti, faible, moyen, marqué) ne se normalise jamais : au style,
//     `echelleCommune` garde la zone du style et l'orangé, sur des anneaux communs nommés.
// Inconnu en place (`enPlace`, Ma bière) : la zone du style y est connue, l'axe garde sa place ; son secteur est
// hachuré, son picto pâli porte « ? », et aucun point ne s'y pose (pas goûté n'est pas « pas senti »).
// Classes préfixées rb- (L26) ; aucun remplacement de chaîne.
import { useId, type ReactNode } from 'react';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { Picto } from '../Pictos';
import './radar-base.css';

export const ORANGE_HORS = '#c2410c';

/** Le rôle d'une série : la retenue (en avant, remplie), une autre (contour et voile léger), ou un contour seul. */
export type RoleSerie = 'retenu' | 'autre' | 'contour';
export type Valeurs = Partial<Record<FamilyId, number | null>>;

export interface SerieRadar {
  cle: string;
  nom: string;
  couleur: string;
  role: RoleSerie;
  /** Une valeur par famille ; `null` ou absente : inconnue pour cette série (jamais zéro). */
  valeurs: Valeurs;
  /** Hors du style, dit par l'écran (en plus du « au-dessus de la zone » du mode style). */
  hors?: Partial<Record<FamilyId, boolean>>;
}

export interface RadarBaseProps {
  /** L'ordre des axes (celui du style) ; les inconnus de toutes les séries se regroupent en bas. */
  familles: FamilyId[];
  series: SerieRadar[];
  mode: 'style' | 'absolu';
  /** Le moment lu (60′, 10′, dry hop…), écrit sur le radar pour les contrôles. */
  moment?: string;
  /** La zone du style, dans l'unité des valeurs (dessinée en mode style seulement). */
  zone?: Valeurs;
  /** Un trait noir sans point : ta stout, ma bière (dessiné dès qu'il est donné). */
  reference?: { nom: string; valeurs: Valeurs };
  /** L'échelle fixe du mode absolu : nb + 1 anneaux, de 0 à nb × pas ; étiquettes facultatives (une par anneau). */
  echelleAbsolue?: { pas: number; nb: number; etiquettes?: string[] };
  /** Au style, une échelle commune au lieu du maximum de chaque axe (une note en mots ne se normalise pas). */
  echelleCommune?: { pas: number; nb: number; etiquettes?: string[] };
  /** L'inconnu de toutes les séries reste à sa place (hachuré, picto pâli et « ? ») au lieu d'être regroupé en bas. */
  enPlace?: boolean;
  /** Au-dessus de la zone de plus que ce seuil : hors du style (orangé). */
  seuilHors?: number;
  /** data-objet du svg (houblons, fiche, suggerer…), lu par les contrôles existants. */
  objet: string;
  /** Le libellé accessible ; en fonction, il reçoit le haut de l'échelle écrit (« 12,5 »). */
  label: string | ((haut: string) => string);
  className?: string;
  /** Familles marquées (attendues au style) : un cerne sous leur picto. */
  marquees?: FamilyId[];
  /** La demande : +1 (plus), −1 (moins), une flèche près du picto. */
  fleches?: Partial<Record<FamilyId, number | 'banni'>>;
  /** Cibles du doigt, une par secteur d'axe (transparentes). */
  cibles?: { toucher: (f: FamilyId) => void; survol?: (f: FamilyId | null) => void; etats?: Partial<Record<FamilyId, string>> };
  /** Une bulle posée près d'un axe (x, y en fraction du radar). */
  bulle?: { famille: FamilyId; rendu: (ancre: { x: number; y: number }) => ReactNode };
}

const rd = (x: number) => Math.round(x * 10) / 10;
type P2 = [number, number];

/** Le pas rond le plus fin qui contient la plus forte valeur, en 3 à 5 anneaux. */
function echelle(max: number) {
  for (const pas of [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5]) {
    const n = Math.ceil(max / pas - 1e-9);
    if (n <= 5) return { pas, nb: Math.max(3, n) };
  }
  return { pas: 10, nb: Math.max(3, Math.ceil(max / 10)) };
}
export const chiffreRadar = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');

export function RadarBase({ familles, series, mode, moment, zone: zoneP, reference, echelleAbsolue, echelleCommune, enPlace, seuilHors = 1e-6, objet, label, className, marquees, fleches, cibles, bulle }: RadarBaseProps) {
  const absolu = mode === 'absolu';
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const brut = (s: { valeurs: Valeurs }, f: FamilyId): number | null => { const v = s.valeurs[f]; return v == null || !Number.isFinite(v) ? null : Math.max(0, v); };
  const toutInconnu = (f: FamilyId) => series.every((s) => brut(s, f) == null);
  // L'ordre des axes : celui du style ; les inconnus de tous rassemblés en bas.
  let axes = familles;
  {
    const U = familles.filter(toutInconnu), K = familles.filter((f) => !toutInconnu(f)), n = familles.length;
    if (!enPlace && U.length && K.length) {
      const debut = Math.round(n / 2) - Math.floor((U.length - 1) / 2);
      let k = 0; axes = [];
      for (let i = 0; i < n; i++) axes.push(i >= debut && i < debut + U.length ? U[i - debut] : K[k++]);
    }
  }
  const N = axes.length, PAS = (2 * Math.PI) / N;
  const inc = axes.map(toutInconnu);
  const zone = (f: FamilyId): number | null => { const z = zoneP?.[f]; return z == null ? null : Math.max(0, z); };
  const ref = (f: FamilyId): number | null => (reference ? brut(reference, f) : null);
  const hors = (s: SerieRadar, f: FamilyId) => { const v = brut(s, f), z = zone(f); return !!s.hors?.[f] || (!absolu && v != null && v > 0 && z != null && v > z + seuilHors); };

  let max = 0;
  for (const s of series) for (const f of axes) { const v = brut(s, f); if (v != null && v > max) max = v; }
  for (const f of axes) { const r = ref(f); if (r != null && r > max) max = r; }
  const fixe = absolu ? (echelleAbsolue ?? { pas: 2.5, nb: 5 }) : echelleCommune;
  const { pas, nb } = fixe ?? echelle(max || 0.1);
  const etiquette = (a: number) => fixe?.etiquettes?.[a] ?? chiffreRadar(a * pas);

  const W = 358, RR = 124, PICTO = 18, CX = W / 2, CY = RR + 32, H = 2 * RR + 64;
  const rvC = (v: number) => (RR * (1 + Math.min(v, nb * pas) / pas)) / (nb + 1);
  // Au style : le bord de chaque axe vaut le plus fort des séries (et de la référence) sur cet axe, écrit près du picto ;
  // anneaux en parts. En absolu : l'échelle commune, brute.
  const R0 = RR / 5, parAxe = !absolu && !echelleCommune;
  const maxAxe = axes.map((f) => { let m = 0; for (const s of series) { const v = brut(s, f); if (v != null && v > m) m = v; } const r = ref(f); if (r != null && r > m) m = r; return m; });
  const rvA = (i: number, v: number) => (parAxe ? (maxAxe[i] >= 0.05 ? R0 + (RR - R0) * Math.min(1, v / maxAxe[i]) : R0) : rvC(v));
  const cote = (i: number) => (Math.sin(i * PAS) < -0.2 ? -1 : 1);
  const pt = (i: number, r: number): P2 => [CX + Math.sin(i * PAS) * r, CY - Math.cos(i * PAS) * r];
  const mil = (i: number, r: number): P2 => { const a = pt(i, r), b = pt(i + 1, r); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  const xy = (p: P2) => `${rd(p[0])},${rd(p[1])}`;
  const secteur = (i: number, j: number, r: number) => { const s: P2[] = [[CX, CY], mil(i - 1, r)]; for (let a = i; a <= j; a++) s.push(pt(a, r)); s.push(mil(j, r)); return s.map(xy).join(' '); };
  const id = `rb-h-${uid}`;

  // Les séries : les autres d'abord, la retenue par-dessus, et le contour seul (l'original) tout en haut. Un remplaçant
  // décrit souvent la même famille au même niveau que l'original (échelle à trois crans) : dessiné dessous, le contour
  // disparaissait sous son trait et ses points (D156 : « sur le radargraph, on voit pas Galaxy »). Dessus, il reste visible :
  // son trait fin laisse voir la couleur du remplaçant de part et d'autre, et ses sommets sont des anneaux creux.
  const rang = (s: SerieRadar) => (s.role === 'contour' ? 2 : s.role === 'autre' ? 0 : 1);
  const ordre = [...series].sort((a, b) => rang(a) - rang(b));
  const groupe = enPlace ? [] : inc.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
  const marque = new Set(marquees ?? []);

  const ancreBulle = bulle ? (() => {
    const i = axes.indexOf(bulle.famille); if (i < 0) return null;
    const s = series.find((x) => x.role === 'retenu') ?? series[0];
    const v = s ? brut(s, bulle.famille) : null;
    // L'inconnu de tous : la bulle se pose sur le secteur « sans donnée », au milieu (elle tient dans la largeur).
    const m = groupe.length ? (groupe[0] + groupe[groupe.length - 1]) / 2 : i;
    const p = inc[i] && enPlace ? pt(i, RR * 0.62) : inc[i] ? pt(m,RR * (groupe.length > 4 ? 0.56 : 0.66) - 14) : pt(i, v == null ? RR - 3 : rvA(i, v));
    return { x: p[0] / W, y: p[1] / H };
  })() : null;

  const echelleTexte = (
    <g data-role="echelle" textAnchor="end">
      {!parAxe && Array.from({ length: nb + 1 }, (_, a) => <text key={`e${a}`} x={CX - 5} y={rd(CY - (RR * (a + 1)) / (nb + 1) + 4)} className="rb-ech">{etiquette(a)}</text>)}
    </g>
  );

  return (
    <div className="rb-boite">
      <svg data-radar="base" data-objet={objet} data-mode={mode} data-moment={moment ?? ''} data-centre={`${CX},${CY}`} data-axes={axes.join(',')} data-echelle={`${chiffreRadar(0)}–${chiffreRadar(nb * pas)}`} data-echelle-axe={parAxe ? 'axe' : 'commune'}
        width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={`rb-radar ${className ?? ''}`} role="img"
        aria-label={`${typeof label === 'function' ? label(chiffreRadar(nb * pas)) : label}${groupe.length ? ` ; sans donnée : ${groupe.length} familles` : ''}`}>
        <defs>
          <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="rb-hach-fond" /><line x1="0" y1="0" x2="0" y2="6" className="rb-hach-trait" strokeWidth="1.6" />
          </pattern>
        </defs>
        {/* La zone du style, au style seulement : vert très pâle, sous l'inconnu. */}
        {!absolu && zoneP && <polygon data-role="zone" points={axes.map((f, i) => xy(pt(i, rvA(i, zone(f) ?? 0)))).join(' ')} fill="rgba(47,107,79,.11)" stroke="rgba(47,107,79,.35)" strokeWidth="1" />}
        {/* L'inconnu de tous, sous la grille : un seul secteur « sans donnée ». */}
        {groupe.length > 0 && <polygon data-inconnu={groupe.map((i) => axes[i]).join(' ')} data-role="secteur-sans-donnee" points={secteur(groupe[0], groupe[groupe.length - 1], RR)} fill={`url(#${id})`} />}
        {/* En place : un secteur hachuré par axe inconnu de tous, sous la grille. */}
        {enPlace && axes.map((f, i) => (inc[i] ? <polygon key={`h${f}`} data-inconnu={f} data-role="secteur-inconnu" points={secteur(i, i, RR)} fill={`url(#${id})`} className="rb-secteur-pale" /> : null))}
        {/* La grille : anneaux réguliers, rayons. */}
        <g className="rb-grille" data-role="anneaux" data-anneaux={parAxe ? 5 : nb + 1} fill="none" strokeWidth="1">
          {axes.map((f, i) => { if (inc[i] && !enPlace) return null; const e = pt(i, RR); return <line key={`a${f}`} x1={CX} y1={CY} x2={rd(e[0])} y2={rd(e[1])} />; })}
          {parAxe ? [0, 0.25, 0.5, 0.75, 1].map((k, a) => <polygon key={`r${a}`} data-anneau={a} fill="none" points={axes.map((_f, i) => xy(pt(i, R0 + (RR - R0) * k))).join(' ')} />)
            : Array.from({ length: nb + 1 }, (_, a) => <polygon key={`r${a}`} data-anneau={a} fill="none" points={axes.map((_f, i) => xy(pt(i, (RR * (a + 1)) / (nb + 1)))).join(' ')} />)}
        </g>
        {/* L'échelle : en absolu, chiffrée sur l'axe du haut ; au style, le maximum de chaque axe près de son picto. */}
        {!echelleCommune && echelleTexte}
        {/* La référence (ta stout, ma bière) : le trait noir, coupé là où elle est inconnue. */}
        {reference && (() => {
          const P = axes.map((f, i) => { const s = ref(f); return s == null ? null : pt(i, rvA(i, s)); }).filter((p): p is P2 => p != null);
          return P.length >= 2 ? <polygon data-reference={reference.nom} data-role="reference" points={P.map(xy).join(' ')} className="rb-stout" fill="none" /> : null;
        })()}
        {ordre.map((s) => {
          const lui = s.role === 'retenu', seul = s.role === 'contour';
          const v = axes.map((f) => brut(s, f));
          const voile = lui ? 0.22 : seul ? 0 : 0.07;
          return (
            <g key={s.cle} data-serie={s.nom} data-couleur={s.couleur} data-valeurs={v.map((x) => (x == null ? '' : chiffreRadar(x))).join(',')} className={lui ? 'plein' : 'contour'}>
              {/* Les points connus reliés à la suite : entre deux axes voisins connus, trait plein ; un segment qui enjambe un
                  inconnu (ou le secteur « sans donnée ») est tireté. Le remplissage ne suit que les tronçons pleins, du
                  contour au petit anneau du zéro. */}
              {(() => {
                const K = v.map((x, i) => (x == null ? -1 : i)).filter((i) => i >= 0);
                const P = (i: number) => pt(i, rvA(i, v[i]!)), Z = (i: number) => pt(i, rvA(i, 0));
                const trait = { stroke: s.couleur, strokeWidth: lui ? 3 : seul ? (series.length > 1 ? 2.2 : 2.5) : 1.8, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
                // Une seule valeur connue : un rayon du petit anneau du zéro à son point, sans voile (rien d'inventé à côté).
                if (K.length === 1) { const p = P(K[0]), z = Z(K[0]); return <line data-role="rayon" x1={rd(z[0])} y1={rd(z[1])} x2={rd(p[0])} y2={rd(p[1])} {...trait} />; }
                if (K.length < 2) return null;
                if (K.length === N) return <>{voile > 0 && <path data-role="voile" d={`M${K.map((i) => xy(P(i))).join('L')}Z M${K.map((i) => xy(Z(i))).join('L')}Z`} fill={s.couleur} fillOpacity={voile} fillRule="evenodd" stroke="none" />}
                  <polygon data-role="contour" points={K.map((i) => xy(P(i))).join(' ')} fill="none" {...trait} /></>;
                const dep = v.findIndex((x) => x == null), suites: number[][] = []; let cur: number[] | null = null;
                for (let s2 = 1; s2 <= N; s2++) { const i = (dep + s2) % N; if (v[i] != null) { if (!cur) { cur = []; suites.push(cur); } cur.push(i); } else cur = null; }
                const voisins = (i: number, j: number) => (j - i + N) % N === 1 || (i - j + N) % N === 1;
                const segs = (K.length === 2 ? [[K[0], K[1]]] : K.map((i, n) => [i, K[(n + 1) % K.length]])).map(([i, j]) => ({ i, j, plein: voisins(i, j) }));
                return <>
                  {voile > 0 && suites.map((sx) => (sx.length < 2 ? null : <polygon key={`f${sx[0]}`} data-role="voile" points={[...sx.map(P), ...sx.slice().reverse().map(Z)].map(xy).join(' ')} fill={s.couleur} fillOpacity={voile} stroke="none" />))}
                  {segs.map((sg) => { const p = P(sg.i), q = P(sg.j);
                    return <line key={`t${sg.i}`} data-role={sg.plein ? 'trait' : 'tirete'} x1={rd(p[0])} y1={rd(p[1])} x2={rd(q[0])} y2={rd(q[1])} {...trait} {...(sg.plein ? {} : { strokeDasharray: '5 4', strokeLinecap: 'butt' as const })} />; })}
                </>;
              })()}
              {v.map((x, i) => {
                if (x == null) return null;
                const p = pt(i, rvA(i, x)), h = hors(s, axes[i]);
                // Le contour seul : un anneau creux autour du sommet (la légende de Substituer : disque blanc cerclé), pour que
                // le point plein d'un remplaçant au même niveau reste visible au centre.
                if (seul && series.length > 1) return <circle key={axes[i]} data-valeur={chiffreRadar(x)} data-point={axes[i]} cx={rd(p[0])} cy={rd(p[1])} r={6.2}
                  fill="none" stroke={h ? ORANGE_HORS : s.couleur} strokeWidth={2} />;
                return <circle key={axes[i]} data-valeur={chiffreRadar(x)} data-point={axes[i]} cx={rd(p[0])} cy={rd(p[1])} r={lui ? (h ? 4.8 : 4) : h ? 3.8 : 3}
                  fill={h ? ORANGE_HORS : s.couleur} stroke={h || lui ? '#fff' : 'none'} strokeWidth={h || lui ? 1.2 : 0} />;
              })}
            </g>
          );
        })}
        {/* Une échelle de mots (pas senti… marqué) passe au-dessus des séries : son halo la garde lisible. */}
        {echelleCommune && echelleTexte}
        {/* Les pictos des familles au bout des axes, et au style le maximum de chaque axe. */}
        {axes.map((f, i) => {
          if (inc[i] && !enPlace) return null;
          const q = pt(i, RR + PICTO / 2 + 7);
          if (inc[i]) return (
            // En place : le picto pâli et « ? » ; ni maximum, ni flèche (rien n'est connu sur cet axe).
            <g key={`p${f}`} data-axe-inconnu={f} {...(marque.has(f) ? { 'data-statut-style': 'attendue' } : {})}>
              {marque.has(f) && <circle cx={rd(q[0])} cy={rd(q[1])} r={PICTO / 2 + 3} className="rb-marque rb-marque-pale" />}
              <svg x={rd(q[0] - PICTO / 2)} y={rd(q[1] - PICTO / 2)} width={PICTO} height={PICTO} overflow="visible" opacity=".5"><Picto famille={f} taille={PICTO} /></svg>
              <text x={rd(q[0] + cote(i) * (PICTO / 2 + 3))} y={rd(q[1] + 4)} textAnchor={cote(i) > 0 ? 'start' : 'end'} className="rb-qi">?</text>
            </g>
          );
          const sous = Math.cos(i * PAS) > 0.6 && Math.sin(i * PAS) > 0.2; // sous le picto : une bascule couvre souvent le haut droit
          const fl = fleches?.[f];
          return (
            <g key={`p${f}`} data-axe={f} {...(marque.has(f) ? { 'data-statut-style': 'attendue' } : {})}>
              {marque.has(f) && <circle cx={rd(q[0])} cy={rd(q[1])} r={PICTO / 2 + 3} className="rb-marque" />}
              <svg x={rd(q[0] - PICTO / 2)} y={rd(q[1] - PICTO / 2)} width={PICTO} height={PICTO} overflow="visible"><Picto famille={f} taille={PICTO} /></svg>
              {parAxe && <text data-role="max-axe" x={rd(sous ? q[0] : q[0] + cote(i) * (PICTO / 2 + 2))} y={rd(sous ? q[1] + PICTO / 2 + 11 : q[1] + 4)} textAnchor={sous ? 'middle' : cote(i) > 0 ? 'start' : 'end'} className="rb-max">{maxAxe[i] < 0.05 ? '~0' : chiffreRadar(Math.max(0.1, Math.round(maxAxe[i] * 10) / 10))}</text>}
              {(fl === 1 || fl === -1) && (() => {
                // La demande : une courte flèche le long de l'axe, à côté du picto ; vers l'extérieur pour « plus ».
                const u: P2 = [Math.sin(i * PAS), -Math.cos(i * PAS)], c: P2 = [q[0] + cote(i) * (PICTO / 2 + 9), q[1]];
                const a: P2 = [c[0] - u[0] * 6 * fl, c[1] - u[1] * 6 * fl], b: P2 = [c[0] + u[0] * 6 * fl, c[1] + u[1] * 6 * fl];
                return <line data-demande={f} x1={rd(a[0])} y1={rd(a[1])} x2={rd(b[0])} y2={rd(b[1])} className={fl === 1 ? 'rb-fl-plus' : 'rb-fl-moins'} strokeWidth="2.2" markerEnd={`url(#${id}-f${fl === 1 ? 'p' : 'm'})`} />;
              })()}
            </g>
          );
        })}
        {fleches && <defs>
          <marker id={`${id}-fp`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" className="rb-fl-tete-plus" /></marker>
          <marker id={`${id}-fm`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" className="rb-fl-tete-moins" /></marker>
        </defs>}
        {/* L'inconnu d'une seule série : une pastille « ? » à sa couleur, au bord, sur l'axe. */}
        {axes.map((f, i) => {
          if (inc[i]) return null;
          const manq = series.filter((s) => brut(s, f) == null);
          return manq.map((s, k) => {
            const d = (k - (manq.length - 1) / 2) * 14, u: P2 = [Math.cos(i * PAS), Math.sin(i * PAS)], b = pt(i, RR - 3), pp = pt(i, RR + PICTO / 2 + 7);
            const x = parAxe ? pp[0] - cote(i) * (PICTO / 2 + 9) : b[0] + u[0] * d, y = parAxe ? pp[1] + d : b[1] + u[1] * d;
            return <g key={`q${f}${s.cle}`} data-inconnu={`${f} ${s.nom}`}><circle cx={rd(x)} cy={rd(y)} r="6.5" fill={s.couleur} stroke="#fff" strokeWidth="1.5" />
              <text x={rd(x)} y={rd(y + 3.6)} textAnchor="middle" className="rb-qp">?</text></g>;
          });
        })}
        {groupe.length > 0 && (() => {
          const m = (groupe[0] + groupe[groupe.length - 1]) / 2, q = pt(m, RR * (groupe.length > 4 ? 0.56 : 0.66));
          const lignes: FamilyId[][] = [];
          groupe.forEach((i, k) => { if (k % 4 === 0) lignes.push([]); lignes[lignes.length - 1].push(axes[i]); });
          return (
            <g data-role="sans-donnee">
              <text x={rd(q[0])} y={rd(q[1] - 8)} textAnchor="middle" className="rb-sd">sans donnée</text>
              {lignes.map((l, li) => l.map((f, k) => {
                const x = q[0] - (l.length * 20 - 4) / 2 + k * 20, y = q[1] + li * 20;
                return <g key={f}><rect x={rd(x - 1)} y={rd(y - 1)} width="18" height="18" rx="4" className="rb-sd-fond" />
                  <svg x={rd(x)} y={rd(y)} width="16" height="16" overflow="visible" opacity=".55"><Picto famille={f} taille={16} /></svg></g>;
              }))}
            </g>
          );
        })()}
        {/* Les cibles du doigt : le secteur entier de chaque axe, jusqu'à son picto. Transparentes. */}
        {cibles && axes.map((f, i) => {
          const a = pt(i - 0.5, RR + 30), b = pt(i + 0.5, RR + 30), e = cibles.etats?.[f];
          return <path key={`c${f}`} data-sommet={f} {...(e ? { 'data-etat': e } : {})} d={`M${CX},${CY} L${xy(a)} L${xy(b)} Z`} fill="transparent" pointerEvents="all" className="rb-cible"
            onPointerDown={() => cibles.toucher(f)}
            onPointerEnter={(ev) => { if (ev.pointerType === 'mouse') cibles.survol?.(f); }}
            onPointerLeave={(ev) => { if (ev.pointerType === 'mouse') cibles.survol?.(null); }} />;
        })}
      </svg>
      {bulle && ancreBulle && bulle.rendu(ancreBulle)}
    </div>
  );
}
