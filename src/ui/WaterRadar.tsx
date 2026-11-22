import React, { useCallback, useMemo } from 'react';
import { WaterIons } from '../types';
import { ION_LABEL, ION_ROLE, ION_SYMBOL, radarScaleMax } from '../domain/water';
import { StyleWater, styleIonRange } from '../domain/waterStyles';
import { formatIonReading } from './waterReadings';
import { nombreFr } from '../domain/nombreAffiche';

/** Profil ionique des deux eaux traitées face aux repères du style. */

/** La place que la pesée laisse à la toile sur le téléphone, en pixels CSS (mesurée par `useWaterControlsLayout`). */
export interface RadarBoite { w: number; h: number }

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
  /**
   * EAU-SELS-UN-ECRAN (22.11) : « maximiser la grandeur du spidergraph ». Avec la boîte mesurée, la toile de pesée prend
   * toute la largeur et toute la hauteur laissée par les sels et les acides : le cercle est borné par la hauteur, les
   * étiquettes vont dans les coins. Sans boîte (bureau, récapitulatif), la géométrie d'origine.
   */
  boite?: RadarBoite | null;
  /** Potassium apporté par les sels (ppm), hors des six axes : pastille dans la toile dès qu'il dépasse 0. */
  potassium?: number | null;
  className?: string;
}

/** Sens de lecture : Cl en haut, puis dans le sens des aiguilles. */
const IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];

const W = 360;
/**
 * Rayon du dernier anneau, et la boîte qui en découle (géométrie d'origine, hors pesée sur téléphone).
 *
 * ⚠️ La géométrie est calculée À L'ENVERS : c'est le rayon qu'on veut le plus
 * grand possible, et la boîte s'ajuste. Les étiquettes du HAUT et du BAS ne
 * portent que deux lignes — symbole et valeur sur la même —, celles des flancs
 * trois.
 *
 *   en haut  : 16 (ligne symbole+valeur) + 17 (fourchette) + 3 (jambages) = 36
 *   en bas   : 18 (descente sous l'anneau) + 17 + 3                       = 38
 */
const R0 = 133;
/**
 * Demi-ouverture d'un secteur.
 *
 * ⚠️ 24° et non 27 : sur une grande toile les six quartiers se rejoignaient en
 * un disque vert barré de fentes noires. Douze degrés d'écart, et chaque ion
 * retrouve son quartier.
 */
const HALF = 24;
/** Un anneau tous les 50 ppm — c'est la graduation qu'on lit sur la toile. */
const RING_STEP = 50;
/** Pesée : largeur réservée à une étiquette de coin (« HCO₃⁻ moy. 12,5 ▲ »), et à la légende du flanc. */
const COIN = 64;
/** Pesée : hauteur de la ligne de légende posée sous la toile quand le disque prend toute la largeur. */
export const LEGENDE_H = 18;

const GREEN = 'rgb(var(--hop))'; // hop — la fourchette du style
const STRAW = 'rgb(var(--ebc-straw))'; // ebc-straw — l'eau corrigée
const BLUE = 'rgb(var(--water))'; // water — l'eau de départ
const AMBER = '#C87A2C'; // ebc-amber — hors fourchette
const GRID = 'rgb(var(--cave-800))'; // cave-800
const FOND = 'rgb(var(--cave-900))'; // fond du panneau : le halo des étiquettes posées sur la toile

const rad = (d: number) => (d * Math.PI) / 180;
const angle = (i: number) => -90 + i * 60;
const pt = ([x, y]: [number, number]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** De quel côté de la toile l'étiquette se pose. */
const anchorAt = (cos: number): 'start' | 'end' | 'middle' =>
  cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';

/** Halo couleur du fond : une étiquette qui chevauche un anneau ou un secteur reste lisible. */
const HALO = { paintOrder: 'stroke', stroke: FOND, strokeWidth: 3, strokeLinejoin: 'round' } as const;

export const WaterRadar: React.FC<WaterRadarProps> = ({
  start,
  achieved,
  style,
  highlight,
  fitToControls = false,
  boite = null,
  potassium = null,
  className = ''
}) => {
  const pese = fitToControls && boite != null && boite.w > 0 && boite.h > 0;
  /*
   * Pesée sur téléphone : la boîte est celle de l'écran, unité SVG = pixel CSS (les tailles de police sont celles qu'on lit).
   * Le cercle est borné par la hauteur, et par la largeur moins six pixels : les quatre étiquettes de flanc vont dans les
   * COINS de la boîte, là où le disque ne passe pas ; Cl et Mg se posent à côté de leur pointe.
   */
  const geo = useMemo(() => {
    if (!pese) return { VW: W, VH: 74 + 2 * R0, R: R0, CX: W / 2, CY: 36 + R0, LABEL_R: R0 + 12, top: -14, dedans: false };
    /* La légende tient dans le flanc gauche quand le cercle est borné par la hauteur ; sinon, une ligne de 18 px sous la toile (la boîte la compte). */
    const w = boite!.w;
    let h = boite!.h;
    let R = Math.max(40, Math.min((h - 10) / 2, w / 2 - 6));
    const dedans = w / 2 - R >= COIN;
    if (!dedans) { h -= LEGENDE_H; R = Math.max(40, Math.min((h - 10) / 2, w / 2 - 6)); }
    h = Math.min(h, Math.ceil(2 * R + 10)); // une boîte plus haute que le disque laisserait un cadre vide
    return { VW: w, VH: h, R, CX: w / 2, CY: h / 2, LABEL_R: R + 12, top: 0, dedans };
  }, [pese, boite]);
  const { VW, VH, R, CX, CY, LABEL_R } = geo;
  const xy = useCallback((d: number, r: number): [number, number] => [CX + r * Math.cos(rad(d)), CY + r * Math.sin(rad(d))], [CX, CY]);
  const sector = useCallback((d: number, r0: number, r1: number): string => {
    const outer = `A ${r1} ${r1} 0 0 1 ${pt(xy(d + HALF, r1))}`;
    if (r0 < 1) return `M ${CX} ${CY} L ${pt(xy(d - HALF, r1))} ${outer} Z`;
    return [`M ${pt(xy(d - HALF, r1))}`, outer, `L ${pt(xy(d + HALF, r0))}`, `A ${r0} ${r0} 0 0 0 ${pt(xy(d - HALF, r0))}`, 'Z'].join(' ');
  }, [xy, CX, CY]);
  const lit = useMemo(() => new Set(highlight ?? []), [highlight]);

  /*
   * Échelle commune en racine (son choix du 05.09).
   * Hors pesée : fixée par la source et le profil. Pesée (EAU-SELS-UN-ECRAN, 22.11) : par les plages du style SEULES — une eau
   * de départ à 125 ppm de HCO₃ écrasait Mg, Na et HCO₃ au centre (« polygone écrasé »). Elle ne bouge pas pendant la
   * pesée ; une valeur au-delà est coupée au bord, chiffrée, et marquée ▲ (obtenu) ou d'un repère (départ).
   */
  const scale = useMemo(
    () => radarScaleMax(IONS.flatMap((ion) => pese ? [style.ions[ion].max] : [style.ions[ion].max, start[ion]])),
    [style, start, pese]
  );

  /*
   * Les anneaux, tous les 50 ppm — 100 quand l'échelle monte haut.
   * ⚠️ Le pas GRANDIT avec l'échelle, et la boucle est bornée en NOMBRE (le fuzz de saisie l'avait fait exploser).
   */
  const rings = useMemo(() => {
    const pas = Math.max(RING_STEP, Math.ceil(scale / 5 / RING_STEP) * RING_STEP);
    const out: number[] = [];
    for (let v = pas; v <= scale + 0.5 && out.length < 6; v += pas) out.push(v);
    return out;
  }, [scale]);

  /**
   * Du ppm au rayon — en RACINE, pas en droite : la racine étale le bas de l'échelle sans toucher à l'ordre ; « dedans ou
   * dehors » se lit exactement pareil. Les anneaux portent leur valeur en ppm.
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
        const value = achieved[ion];
        const reading = formatIonReading(value, targeted ? band : undefined, ion === 'hco3' ? 1 : 0);
        const d = angle(i);
        const [lx, ly] = xy(d, LABEL_R);
        const [ex, ey] = xy(d, R);
        const cos = Math.cos(rad(d));
        const sin = Math.sin(rad(d));
        /*
         * Pesée : Cl et Mg À CÔTÉ de leur pointe (ancre start, deux lignes) ; SO₄, Ca à droite, Na, HCO₃ à gauche, dans les
         * coins de la boîte (symbole et valeur sur une ligne, plage dessous).
         */
        const haut = sin < -0.7, bas = sin > 0.7;
        const coin = pese ? (haut ? { x: CX + 10, y: CY - R + 12, a: 'start' as const }
          : bas ? { x: CX + 10, y: CY + R - 16, a: 'start' as const }
            : { x: cos > 0 ? VW - 2 : 2, y: sin < 0 ? 14 : VH - 17, a: cos > 0 ? 'end' as const : 'start' as const }) : null;
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
          rStart: rayon(start[ion]),
          startBeyond: Number.isFinite(start[ion]) && start[ion] > scale,
          rNow: rayon(value),
          rMin: rayon(band.min),
          rMax: rayon(band.max),
          lx: coin?.x ?? lx,
          /*
           * Hors pesée : en haut et en bas, la place manque, le symbole et la valeur partagent une ligne. Sur les flancs elle
           * ne manque pas, et les trois lignes se centrent sur l'axe.
           */
          serre: pese || Math.abs(sin) > 0.7,
          ly: coin?.y ?? (haut ? 16 : bas ? CY + R + 18 : ly - 12),
          anchor: coin?.a ?? anchorAt(cos)
        };
      }),
    [start, achieved, style, rayon, xy, R, CX, CY, VW, VH, LABEL_R, pese, scale]
  );

  const path = (key: 'rStart' | 'rNow') =>
    axes.map((a) => pt(xy(a.d, a[key]))).join(' ');

  const résumé = axes
    .map(
      (a) =>
        `${ION_LABEL[a.ion]} (${ION_ROLE[a.ion]}) ${a.reading} ppm ${a.targeted ? `pour ${a.band.min} à ${a.band.max}` : 'sans cible renseignée'}` // virgule-ok : reading est le texte déjà formaté par formatIonReading
    )
    .join(', ');
  const kppm = potassium != null && Number.isFinite(potassium) && potassium > 0 ? Math.round(potassium) : null;
  /* La légende tient dans le flanc gauche quand le cercle est borné par la hauteur ; sinon, une ligne sous la toile. */
  const legendeDedans = pese && geo.dedans;
  const symboleTaille = pese ? 12 : fitToControls ? 14 : 12.5;
  const valeurTaille = pese ? 16 : fitToControls ? 19 : 17;
  const plageTaille = pese ? 11 : fitToControls ? 13 : 11.5;

  return (
    <div className={`water-radar ${className}`}>
      <svg
        /* BR-105 : l'étiquette du sommet dépassait le haut du cadre : 14 unités de marge en haut (géométrie d'origine). */
        viewBox={`0 ${geo.top} ${VW} ${VH - geo.top}`}
        {...(pese ? { width: VW, height: VH } : {})}
        className={pese ? 'block mx-auto' : `block w-full mx-auto ${fitToControls ? 'sm:max-w-[30rem]' : 'max-w-[30rem]'}`}
        data-radar-pesee={pese || undefined}
        role="img"
        aria-label={`Profil ionique de l’eau corrigée face à la fourchette du style ${style.name} : ${résumé}${kppm != null ? `, potassium ${kppm} ppm hors des six axes` : ''}. Moyenne des eaux après sels et acides, avant apports des malts. Échelle fixe en racine carrée de 0 à ${nombreFr(scale, 1)} ppm ; valeurs supérieures au bord.`}
      >
        {/* Les anneaux et les rayons — le repère, jamais la donnée. */}
        {rings.map((ppm) => (
          <circle key={ppm} cx={CX} cy={CY} r={rayon(ppm)} fill="none" stroke={GRID} strokeWidth={ppm === scale ? 1.5 : 1} />
        ))}

        {/* La fourchette du style, un quartier par ion. */}
        {axes.filter(a => a.targeted).map((a) => (
          <path
            key={`s-${a.ion}`}
            data-ion-target={a.ion}
            d={sector(a.d, a.rMin, a.rMax)}
            fill={GREEN}
            fillOpacity={lit.has(a.ion) ? 0.5 : lit.size ? 0.14 : 0.28}
          >
            <title>{`${ION_SYMBOL[a.ion]} : ${a.band.min}–${nombreFr(a.band.max, 1)} ppm`}</title>
          </path>
        ))}

        {/* P12 : l'axe mis en avant ne se dessine plus en trait foncé — le secteur et l'étiquette le disent. */}
        {axes.map((a) => (
          <line key={`a-${a.ion}`} x1={CX} y1={CY} x2={a.ex} y2={a.ey} stroke={GRID}
            strokeWidth={lit.has(a.ion) && !pese ? 1.5 : 1} />
        ))}

        {/* L'eau de départ : un trait tireté, qui ne réclame pas l'attention. */}
        <polygon points={path('rStart')} fill="none" stroke={BLUE} strokeWidth={1.5} strokeDasharray="5 4" strokeLinejoin="round" />
        {pese && axes.filter(a => a.startBeyond).map((a) => {
          /* Départ au-delà de l'échelle : coupé au bord, un chevron dit « plus loin ». */
          const [x0, y0] = xy(a.d, R - 1);
          const [x1, y1] = xy(a.d - 5, R - 7);
          const [x2, y2] = xy(a.d + 5, R - 7);
          return <polyline key={`b-${a.ion}`} data-depart-au-dela={a.ion} points={`${x1.toFixed(1)},${y1.toFixed(1)} ${x0.toFixed(1)},${y0.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`}
            fill="none" stroke={BLUE} strokeWidth={1.5} />;
        })}

        {/* L'eau corrigée : c'est elle qu'on lit. */}
        <polygon points={path('rNow')} fill={STRAW} fillOpacity={0.12} stroke={STRAW} strokeWidth={2.5} strokeLinejoin="round" />

        {axes.map((a) => {
          const [x, y] = xy(a.d, a.rNow);
          return (
            <circle
              key={`d-${a.ion}`}
              cx={x}
              cy={y}
              r={lit.has(a.ion) ? 6 : 4.5}
              fill={!a.targeted ? 'rgb(var(--cave-texte-400))' : a.alarm ? AMBER : GREEN}
              stroke="rgb(var(--cave-950))"
              strokeWidth={1.5}
            />
          );
        })}

        {/*
          ⚠️ LA GRADUATION EN PPM, posée sur la diagonale entre le chlorure et le sulfate — le seul endroit du disque
          qu'aucune étiquette d'axe ne réclame.
        */}
        {rings.map((ppm) => {
          const [tx, ty] = xy(-60, rayon(ppm));
          return (
            <text key={`g-${ppm}`} x={tx} y={ty - 2} textAnchor="middle" fontSize={pese ? 11 : 10}
              fill={pese ? 'rgb(var(--cave-texte-200))' : 'rgb(var(--cave-texte-400))'} style={pese ? HALO : undefined}>
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
            <tspan fontSize={valeurTaille} fontWeight={700} fill={a.alarm ? AMBER : 'rgb(var(--cave-texte-200))'}>
              {a.reading}
              {flèche}
            </tspan>
          );
          const teinte = lit.has(a.ion) ? STRAW : pese ? 'rgb(var(--cave-texte-200))' : 'rgb(var(--cave-texte-400))';
          return (
            <g key={`t-${a.ion}`} data-radar-etiquette={a.ion}>
              <text x={a.lx} y={a.ly} textAnchor={a.anchor} fontSize={symboleTaille} fill={teinte}
                fontWeight={lit.has(a.ion) && pese ? 700 : undefined} style={pese ? HALO : undefined}>
                {ION_SYMBOL[a.ion]}{pese && a.ion === 'hco3' ? ' moy.' : ''}
                {a.serre && <> {valeur}</>}
              </text>
              {!a.serre && (
                <text x={a.lx} y={a.ly + 17} textAnchor={a.anchor} fontSize={17}>
                  {valeur}
                </text>
              )}
              {/*
                ⚠️ La FOURCHETTE, et non plus un mot de goût : c'est la seule chose qu'on veut savoir devant la balance — où il
                faut tomber.
              */}
              <text x={a.lx} y={a.ly + (pese ? 14 : a.serre ? 17 : 31)} textAnchor={a.anchor} fontSize={plageTaille} fill={teinte}
                style={pese ? HALO : undefined}>
                {a.targeted ? `${a.band.min}–${a.band.max}` : 'sans cible'}
              </text>
            </g>
          );
        })}

        {legendeDedans && (
          <g data-radar-legende aria-hidden fontSize={11} fill="rgb(var(--cave-texte-200))">
            <line x1={4} x2={18} y1={CY - 15} y2={CY - 15} stroke={BLUE} strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={22} y={CY - 11}>départ</text>
            <line x1={4} x2={18} y1={CY + 1} y2={CY + 1} stroke={STRAW} strokeWidth={2.5} />
            <text x={22} y={CY + 5}>obtenu</text>
            <rect x={5} y={CY + 12} width={12} height={8} rx={1.5} fill={GREEN} fillOpacity={0.4} />
            <text x={22} y={CY + 20}>style</text>
          </g>
        )}
        {pese && kppm != null && (
          <text data-radar-potassium x={VW - 2} y={CY + 4} textAnchor="end" fontSize={12} fill="rgb(var(--cave-texte-200))" style={HALO}>
            K⁺ <tspan fontWeight={700}>{kppm}</tspan> ppm
          </text>
        )}
      </svg>
      {!pese && <p className="water-radar-caption text-center text-2xs text-cave-400 leading-tight pb-0.5">
        Moyenne des eaux après sels et acides
        <span className="block">Avant apports des malts et ébullition</span>
      </p>}
      {!legendeDedans && <div className={`water-radar-legend flex flex-wrap justify-center gap-x-3 gap-y-1 py-1 text-2xs text-cave-400 ${pese ? 'water-radar-legend-pesee' : ''}`} style={pese ? { height: LEGENDE_H } : undefined} aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-water" />{pese ? 'départ' : 'Départ'}</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-ebc-straw" />{pese ? 'obtenu' : 'Après sels et acide'}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-hop/50" />{pese ? 'style' : 'Cible'}</span>
        {pese && kppm != null && <span>K⁺ <strong>{kppm}</strong> ppm</span>}
      </div>}
    </div>
  );
};
