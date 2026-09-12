import React, { useCallback, useMemo } from 'react';
import { WaterIons } from '../types';
import { ION_LABEL, ION_ROLE, ION_SYMBOL, radarScaleMax } from '../domain/water';
import { StyleWater, styleIonRange } from '../domain/waterStyles';
import { formatIonReading } from './waterReadings';

/** Profil ionique des deux eaux traitées face aux repères du style. */

interface WaterRadarProps {
  /** L'eau du réseau, coupée d'osmosée : ce qu'on a avant d'ouvrir un sachet. */
  start: WaterIons;
  /** La moyenne des eaux après les sels et les doses d’acide retenues. */
  achieved: WaterIons;
  style: StyleWater;
  /**
   * Les ions déplacés par le sel qu'on manipule.
   *
   * Sans eux, la toile ne répond pas à la question que se pose le brasseur
   * devant sa balance : « ce sel-là, il pousse quoi ? »
   */
  highlight?: Array<keyof WaterIons>;
  /** Prend la hauteur laissée par les commandes de pesée sur mobile. */
  fitToControls?: boolean;
  className?: string;
}

/** Sens de lecture : Cl en haut, puis dans le sens des aiguilles. */
const IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];

const W = 360;
/**
 * Rayon du dernier anneau, et la boîte qui en découle.
 *
 * ⚠️ La géométrie est calculée À L'ENVERS : c'est le rayon qu'on veut le plus
 * grand possible, et la boîte s'ajuste. Les étiquettes du HAUT et du BAS ne
 * portent que deux lignes — symbole et valeur sur la même —, celles des flancs
 * trois : ce sont les premières qui commandent la hauteur, et leur faire tenir
 * la valeur à côté du symbole a rendu vingt pixels de diamètre au cercle.
 */
const R = 133;
/**
 * Deux lignes en haut, deux en bas — et PAS UN PIXEL DE MOINS.
 *
 * ⚠️ Ces deux nombres ne sont pas des marges de confort : ils sont exactement
 * la place que prennent les étiquettes, et ils se DÉDUISENT du placement plus
 * bas — `ly` vaut 16 en haut, `CY + R + 18` en bas, la fourchette suivant
 * 17 dessous.
 *
 *   en haut  : 16 (ligne symbole+valeur) + 17 (fourchette) + 3 (jambages) = 36
 *   en bas   : 18 (descente sous l'anneau) + 17 + 3                       = 38
 *
 * Je les ai rabotés à 32 pour gagner dix pixels sur un écran de téléphone :
 * « 0–20 » sous le magnésium s'est retrouvé coupé en deux, et « Cl⁻ 98 » au
 * ras du bord. La hauteur de la toile se règle par sa LARGEUR — voir la borne
 * `max-w` posée sur le SVG —, jamais en rognant sa boîte.
 */
const CY = 36 + R;
const H = 74 + 2 * R;
const CX = W / 2;
const LABEL_R = R + 12;
/**
 * Demi-ouverture d'un secteur.
 *
 * ⚠️ 24° et non 27 : à la taille précédente les trois degrés d'écart
 * suffisaient, mais sur une toile deux fois plus grande les six quartiers se
 * rejoignaient en un disque vert barré de fentes noires. Douze degrés d'écart,
 * et chaque ion retrouve son quartier.
 */
const HALF = 24;
/** Un anneau tous les 50 ppm — c'est la graduation qu'on lit sur la toile. */
const RING_STEP = 50;

const GREEN = '#6E9B5B'; // hop — la fourchette du style
const STRAW = '#F2C14E'; // ebc-straw — l'eau corrigée
const BLUE = '#5B8AA6'; // water — l'eau de départ
const AMBER = '#C87A2C'; // ebc-amber — hors fourchette
const GRID = '#2C2521'; // cave-800

const rad = (d: number) => (d * Math.PI) / 180;
const angle = (i: number) => -90 + i * 60;
const plotPoint = (d: number, r: number, cy = CY): [number, number] => [
  CX + r * Math.cos(rad(d)),
  cy + r * Math.sin(rad(d))
];
const pt = ([x, y]: [number, number]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** De quel côté de la toile l'étiquette se pose. */
const anchorAt = (cos: number): 'start' | 'end' | 'middle' =>
  cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';

/**
 * Le quartier d'un ion : la portion d'anneau comprise entre son minimum et son
 * maximum. Quand le minimum est nul, le secteur part du centre — l'arc
 * intérieur dégénérerait en rayon nul, que les navigateurs traitent chacun à
 * leur façon.
 */
function sector(d: number, r0: number, r1: number, cy = CY): string {
  const xy = (d: number, r: number) => plotPoint(d, r, cy);
  const outer = `A ${r1} ${r1} 0 0 1 ${pt(xy(d + HALF, r1))}`;
  if (r0 < 1) return `M ${CX} ${cy} L ${pt(xy(d - HALF, r1))} ${outer} Z`;
  return [
    `M ${pt(xy(d - HALF, r1))}`,
    outer,
    `L ${pt(xy(d + HALF, r0))}`,
    `A ${r0} ${r0} 0 0 0 ${pt(xy(d - HALF, r0))}`,
    'Z'
  ].join(' ');
}

export const WaterRadar: React.FC<WaterRadarProps> = ({
  start,
  achieved,
  style,
  highlight,
  fitToControls = false,
  className = ''
}) => {
  // The weighing view uses a wider diagram: the labels keep their font sizes,
  // while the radius shrinks. Scaling the entire tall SVG made numbers unreadable.
  const R = fitToControls ? 79 : 133;
  const CY = 36 + R, H = 74 + 2 * R, LABEL_R = R + 12;
  const xy = useCallback((d: number, r: number) => plotPoint(d, r, CY), [CY]);
  const lit = useMemo(() => new Set(highlight ?? []), [highlight]);

  /** Échelle commune fixée par la source et le profil : les zones ne se déplacent pas avec les doses. Les valeurs hors échelle restent chiffrées, au bord du tracé. */
  const scale = useMemo(
    () =>
      radarScaleMax(
        IONS.flatMap((ion) => [style.ions[ion].max, start[ion]])
      ),
    [style, start]
  );

  /*
   * Les anneaux, tous les 50 ppm — 100 quand l'échelle monte haut, sans quoi
   * une eau très calcaire se retrouverait cerclée de huit traits illisibles.
   */
  const rings = useMemo(() => {
    /*
     * ⚠️ Le pas GRANDIT avec l'échelle, et la boucle est bornée en NOMBRE.
     * Deux gardes plutôt qu'une : la première garde la toile lisible, la
     * seconde garantit qu'aucune échelle, même absurde, ne peut faire tourner
     * cette boucle plus de six fois. Le fuzz de saisie l'avait fait exploser en
     * « Invalid array length » — vingt milliards d'anneaux pour une dose de sel
     * à douze chiffres.
     */
    const pas = Math.max(RING_STEP, Math.ceil(scale / 5 / RING_STEP) * RING_STEP);
    const out: number[] = [];
    for (let v = pas; v <= scale + 0.5 && out.length < 6; v += pas) out.push(v);
    return out;
  }, [scale]);

  /**
   * Du ppm au rayon — en RACINE, pas en droite.
   *
   * ⚠️ L'échelle commune était la bonne idée, l'axe linéaire la mauvaise moitié.
   * Sur une échelle 0–250 partagée, la fenêtre du magnésium (5 à 20 ppm) tenait
   * entre 2.7 et 10.6 px de rayon : un point. Celles du sodium et du
   * bicarbonate s'écrasaient au centre avec elle, et les trois sommets
   * correspondants s'y empilaient. Le vert n'était plus lisible et la forme
   * paraissait s'effondrer — « les zones vertes ne semblent toujours pas
   * cohérentes ».
   *
   * La racine carrée étale le bas de l'échelle sans toucher à l'ordre : le
   * magnésium occupe désormais 14 à 28 % du rayon, le chlorure 72 à 94 %. Les
   * six fenêtres redeviennent comparables à l'œil tout en gardant leurs
   * différences réelles, et « dedans ou dehors » se lit exactement pareil — la
   * transformation est monotone.
   *
   * Les anneaux portent leur valeur en ppm : leur espacement inégal dit de
   * lui-même que l'axe est compressé.
   */
  const rayon = useCallback(
    (v: number) => R * Math.sqrt(Math.max(0, Math.min(1, v / scale))),
    [scale, R]
  );

  const axes = useMemo(
    () =>
      IONS.map((ion, i) => {
        const band = styleIonRange(style, ion);
        const targeted = !style.untargetedIons?.includes(ion);
        const r = rayon;
        const value = achieved[ion];
        const reading = formatIonReading(value, targeted ? band : undefined, ion === 'hco3' ? 1 : 0);
        const d = angle(i);
        const [lx, ly] = xy(d, LABEL_R);
        const [ex, ey] = xy(d, R);
        const cos = Math.cos(rad(d));
        const sin = Math.sin(rad(d));
        return {
          ion,
          d,
          band,
          targeted,
          value,
          reading: ion === 'hco3' ? reading.replace(/,0$/, '') : reading,
          ex,
          ey,
          /** −1 sous la fourchette, 1 au-dessus, 0 dedans. */
          out: !targeted ? 0 : value < band.min ? -1 : value > band.max ? 1 : 0,
          alarm: targeted && (value < band.min || value > band.max),
          rStart: r(start[ion]),
          rNow: r(value),
          rMin: r(band.min),
          rMax: r(band.max),
          lx,
          /*
           * En haut et en bas, la place manque : le symbole et la valeur
           * partagent une ligne. Sur les flancs elle ne manque pas, et les
           * trois lignes se centrent sur l'axe. Un décalage proportionnel
           * unique faisait passer la ligne de goût par-dessus l'anneau.
           */
          serre: Math.abs(sin) > 0.7,
          ly: sin < -0.7 ? 16 : sin > 0.7 ? CY + R + 18 : ly - 12,
          anchor: anchorAt(cos)
        };
      }),
    [start, achieved, style, rayon, xy, R, CY, LABEL_R]
  );

  const path = (key: 'rStart' | 'rNow') =>
    axes.map((a) => pt(xy(a.d, a[key]))).join(' ');

  const résumé = axes
    .map(
      (a) =>
        `${ION_LABEL[a.ion]} (${ION_ROLE[a.ion]}) ${a.reading} ppm ${a.targeted ? `pour ${a.band.min} à ${a.band.max}` : 'sans cible renseignée'}`
    )
    .join(', ');

  return (
    <div className={`water-radar ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        /* Sur mobile, la pesée réserve ses commandes et le Spider prend
           toute la place restante. Le viewBox garde les étiquettes intactes. */
        className={`block w-full mx-auto ${fitToControls
          ? 'max-h-[var(--water-radar-max-height,24rem)] sm:max-h-none sm:max-w-[30rem]'
          : 'max-w-[30rem]'}`}
        role="img"
        aria-label={`Profil ionique de l’eau corrigée face à la fourchette du style ${style.name} : ${résumé}. Échelle fixe en racine carrée de 0 à ${scale} ppm ; valeurs supérieures au bord.`}
      >
        {/* Les anneaux et les rayons — le repère, jamais la donnée. */}
        {rings.map((ppm) => (
          <circle
            key={ppm}
            cx={CX}
            cy={CY}
            r={rayon(ppm)}
            fill="none"
            stroke={GRID}
            strokeWidth={ppm === scale ? 1.5 : 1}
          />
        ))}

        {/* La fourchette du style, un quartier par ion. */}
        {axes.filter(a => a.targeted).map((a) => (
          <path
            key={`s-${a.ion}`}
            data-ion-target={a.ion}
            d={sector(a.d, a.rMin, a.rMax, CY)}
            fill={GREEN}
            fillOpacity={lit.has(a.ion) ? 0.5 : lit.size ? 0.14 : 0.28}
          >
            <title>{`${ION_SYMBOL[a.ion]} : ${a.band.min}–${a.band.max} ppm`}</title>
          </path>
        ))}

        {axes.map((a) => (
          <line
            key={`a-${a.ion}`}
            x1={CX}
            y1={CY}
            x2={a.ex}
            y2={a.ey}
            stroke={lit.has(a.ion) ? STRAW : GRID}
            strokeWidth={lit.has(a.ion) ? 1.5 : 1}
            strokeOpacity={lit.has(a.ion) ? 0.7 : 1}
          />
        ))}

        {/* L'eau de départ : un trait tireté, qui ne réclame pas l'attention. */}
        <polygon
          points={path('rStart')}
          fill="none"
          stroke={BLUE}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />

        {/* L'eau corrigée : c'est elle qu'on lit. */}
        <polygon
          points={path('rNow')}
          fill={STRAW}
          fillOpacity={0.12}
          stroke={STRAW}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {axes.map((a) => {
          const [x, y] = xy(a.d, a.rNow);
          return (
            <circle
              key={`d-${a.ion}`}
              cx={x}
              cy={y}
              r={lit.has(a.ion) ? 6 : 4.5}
              fill={!a.targeted ? '#9A8A7E' : a.alarm ? AMBER : GREEN}
              stroke="#12100E"
              strokeWidth={1.5}
            />
          );
        })}

        {/*
          Trois lignes par coin : le symbole, la valeur, et CE QUE ÇA FAIT.
          C'est la ligne du goût qui transforme six symboles chimiques en un
          profil qu'on peut lire sans avoir la table de Kolbach en tête.
        */}
        {/*
          ⚠️ LA GRADUATION EN PPM, posée sur la diagonale entre le chlorure et
          le sulfate — le seul endroit du disque qu'aucune étiquette d'axe ne
          réclame. Sans elle, l'échelle commune ne se lit pas : on voit bien
          qu'une bande est plus large qu'une autre, sans savoir de combien.
        */}
        {rings.map((ppm) => {
          const [tx, ty] = xy(-60, rayon(ppm));
          return (
            <text
              key={`g-${ppm}`}
              x={tx}
              y={ty - 2}
              textAnchor="middle"
              fontSize={10}
              fill="#9A8A7E"
            >
              {ppm}
            </text>
          );
        })}

        {axes.map((a) => {
          /* Le sens de l'écart, en petit : le chiffre reste le sujet. */
          const flèche = (a.out !== 0 || a.value > scale) && (
            <tspan fontSize={10} dy={-1}>
              {a.out === 1 || a.value > scale ? ' ▲' : ' ▼'}
            </tspan>
          );
          const valeur = (
            <tspan fontSize={17} fontWeight={700} fill={a.alarm ? AMBER : '#D8CEC5'}>
              {a.reading}
              {flèche}
            </tspan>
          );
          return (
            <g key={`t-${a.ion}`}>
              <text
                x={a.lx}
                y={a.ly}
                textAnchor={a.anchor}
                fontSize={12.5}
                fill={lit.has(a.ion) ? STRAW : '#9A8A7E'}
              >
                {ION_SYMBOL[a.ion]}
                {a.serre && <> {valeur}</>}
              </text>
              {!a.serre && (
                <text x={a.lx} y={a.ly + 17} textAnchor={a.anchor} fontSize={17}>
                  {valeur}
                </text>
              )}
              {/*
                ⚠️ La FOURCHETTE, et non plus un mot de goût.
                « houblon » sous 43 ppm de sulfate était joli et faux : ni le
                sulfate ni le chlorure ne se goûtent seuls, c'est leur rapport
                qui se goûte — et il a son curseur. « 50–150 » ne raconte rien,
                mais c'est la seule chose qu'on veut savoir devant la balance :
                où il faut tomber. Ce que chaque ion fait pour de vrai est dit
                sous la toile, sur le sel qu'on touche.
              */}
              <text
                x={a.lx}
                y={a.ly + (a.serre ? 17 : 31)}
                textAnchor={a.anchor}
                fontSize={11.5}
                fill={lit.has(a.ion) ? STRAW : '#9A8A7E'}
              >
                {a.targeted ? `${a.band.min}–${a.band.max}` : 'sans cible'}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="water-radar-caption text-center text-2xs text-cave-400 leading-tight pb-0.5">
        Moyenne des eaux après sels et acides
        <span className="block">Avant apports des malts et ébullition</span>
      </p>
      <div className="water-radar-legend flex flex-wrap justify-center gap-x-3 gap-y-1 py-1 text-2xs text-cave-400" aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-water" />Départ</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-ebc-straw" />Corrigée</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-hop/50" />Cible</span>
      </div>
    </div>
  );
};
