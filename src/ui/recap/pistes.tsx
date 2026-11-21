// Les mini formes de la liste m2 (maquette choisie, 15.11) : chaque étape se lit sans mot, sur la piste de son style.
// Toutes les valeurs viennent du moteur (OG, IBU, EBC, FG, eau) ou du style ; une valeur inconnue n'est jamais 0 (pas de repère, « — »).
import React, { useMemo } from 'react';
import type { HopIngredient, TempStep } from '../../types';
import { findRecipeHopMatches, rankDocumentaryHopLeads } from '../../domain/hopIndex/recipeGuide';
import aromaFamilies from '../../data/hopRecipeGuideBootstrap.json';
import { useHopCatalogue } from '../hopIndex/useHopCatalogue';
import { COULEURS, COURT, FAMILIES } from '../hopIndex/familyTokens';
import type { FamilyId } from '../../domain/hopIndex/v4/families';
import { positionDansPlage, texteSuisse } from '../identite/plages';

export interface Plage { min: number; max: number }
const fr = (n: number, d: number) => n.toFixed(d).replace('.', ',');
const borne = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Une piste : la bande du style (verte), la valeur de la recette (point) ou sa plage (barre), et à droite la plage du style ou la valeur.
 * `domaine` : l'échelle de la piste ; elle s'étire pour contenir la valeur, jamais l'inverse.
 */
export function Piste({ nom, aria, domaine, plageStyle, point, plageValeur, droite, droiteStyle = 'plage', teinte, etiquettePoint }: {
  nom: string;
  aria: string;
  domaine: Plage;
  plageStyle?: Plage;
  point?: number | null;
  plageValeur?: Plage | null;
  droite: string;
  droiteStyle?: 'plage' | 'valeur';
  /** Dégradé de teinte du verre (EBC). */
  teinte?: { fond: string; pointCouleur?: string };
  etiquettePoint?: string;
}) {
  const valeurs = [point, plageValeur?.min, plageValeur?.max].filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const d0 = Math.min(domaine.min, ...valeurs), d1 = Math.max(domaine.max, ...valeurs);
  const pos = (v: number) => borne(((v - d0) / (d1 - d0)) * 100);
  const hors = typeof point === 'number' && plageStyle ? positionDansPlage(point, plageStyle) !== 'dedans' : false;
  return (
    <span className="rc2-pi" role="img" aria-label={aria} data-piste={nom}>
      <em>{nom}</em>
      <span className={`rc2-tr${teinte ? ' rc2-ebc' : ''}`}>
        {plageStyle && <u style={{ left: `${pos(plageStyle.min)}%`, width: `${Math.max(2, pos(plageStyle.max) - pos(plageStyle.min))}%` }} />}
        {plageValeur && <s style={{ left: `${pos(plageValeur.min)}%`, width: `${Math.max(3, pos(plageValeur.max) - pos(plageValeur.min))}%` }} />}
        {typeof point === 'number' && Number.isFinite(point) && (
          <>
            <b className={`${hors ? 'rc2-hors' : ''}${teinte ? ' rc2-verre' : ''}`} style={{ left: `${pos(point)}%`, ...(teinte ? { background: teinte.fond } : {}) }} />
            {etiquettePoint && <span className={`rc2-pd${hors ? ' rc2-hors' : ''}`} style={{ left: `calc(${pos(point)}% + 11px)` }}>{etiquettePoint}</span>}
          </>
        )}
      </span>
      <span className={droiteStyle === 'plage' ? 'rc2-pg' : 'rc2-pv'}>{droite}</span>
    </span>
  );
}

/**
 * EAU-6 (19.11) : l'échelle de la piste SO₄ suit la plage du style (une fois et demie son haut, au pas de 50, 150 au moins).
 * Sur 0–400, une plage 40–100 tenait 15 % de la piste et son chiffre recouvrait le point. Sans plage : 0–400.
 */
export const domaineSo4 = (plage?: Plage): Plage =>
  plage ? { min: 0, max: Math.max(150, Math.ceil((plage.max * 1.5) / 50) * 50) } : { min: 0, max: 400 };

/** Texte d'une plage du style, ou « — » : l'absence de plage se dit. */
export const texteHorsPlage = (position: ReturnType<typeof positionDansPlage>) =>
  position === 'sous' ? 'sous la plage' : position === 'au-dessus' ? 'au-dessus de la plage' : position === 'dedans' ? 'dans la plage' : 'plage du style inconnue';
export { texteSuisse, fr };

/** Familles d'arôme citées par les fiches du catalogue pour chaque variété (même lecture que le tableau de la recette). Hors catalogue : aucune barre, jamais zéro. */
function aromesDesVarietes(noms: string[], varieties: ReturnType<typeof useHopCatalogue>['varieties']) {
  const sortie = new Map<string, FamilyId[]>();
  for (const nom of noms) {
    const trouvees = findRecipeHopMatches(nom, varieties).map((m) => m.item);
    const leads = rankDocumentaryHopLeads(trouvees, FAMILIES as unknown as string[], aromaFamilies as Parameters<typeof rankDocumentaryHopLeads>[2]);
    const evidence = leads.flatMap((l) => l.evidence);
    if (!evidence.length) continue;
    const parFamille = new Map<string, number>();
    for (const e of evidence) parFamille.set(e.familyId, (parFamille.get(e.familyId) ?? 0) + 1);
    sortie.set(nom, [...parFamille].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([f]) => f as FamilyId));
  }
  return sortie;
}

/** Les barres d'arômes en couleur du houblon de tête (L04 : le brasseur lit d'abord le nom, l'α, l'arôme). */
export function Aromes({ hops }: { hops: readonly HopIngredient[] }) {
  const { varieties } = useHopCatalogue();
  const tete = hops.find((h) => h.name.trim());
  const familles = useMemo(() => (tete ? aromesDesVarietes([tete.name], varieties).get(tete.name) : undefined), [tete, varieties]);
  if (!tete || !familles?.length) return null;
  return (
    <span className="rc2-aro" role="img" aria-label={`arômes de ${tete.name} : ${familles.map((f) => COURT[f].toLowerCase()).join(', ')}`}>
      {familles.map((f) => <i key={f} style={{ background: COULEURS[f].base }} />)}
    </span>
  );
}

/** La mini-courbe d'empâtage : température au fil des paliers (durées réelles, montées en rampe). Sans palier chiffré : rien. */
export function MiniCourbe({ paliers }: { paliers: readonly TempStep[] }) {
  const pts = paliers.filter((p) => Number.isFinite(p.tempC));
  if (pts.length === 0) return null;
  const W = 56, H = 18;
  const temps = pts.map((p) => p.tempC);
  const t0 = Math.min(...temps) - 4, t1 = Math.max(...temps) + 4;
  const dur = pts.map((p) => (Number.isFinite(p.durationMin) && p.durationMin > 0 ? p.durationMin : 10));
  const montee = 6;
  const total = dur.reduce((a, b) => a + b, 0) + montee * pts.length;
  const x = (min: number) => 1 + (min / total) * (W - 2);
  const y = (t: number) => H - 2 - ((t - t0) / (t1 - t0)) * (H - 4);
  let cur = 0;
  const d: string[] = [`M${x(0).toFixed(1)} ${(H - 2).toFixed(1)}`];
  pts.forEach((p, i) => {
    cur += montee; d.push(`L${x(cur).toFixed(1)} ${y(p.tempC).toFixed(1)}`);
    cur += dur[i]; d.push(`L${x(cur).toFixed(1)} ${y(p.tempC).toFixed(1)}`);
  });
  const texte = pts.map((p) => `${p.name || 'palier'} ${fr(p.tempC, p.tempC % 1 ? 1 : 0)} °C`).join(', puis ');
  return (
    <svg role="img" aria-label={`courbe d'empâtage : ${texte}`} viewBox={`0 0 ${W} ${H}`} width="64" height="26" preserveAspectRatio="none">
      <path d={d.join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Dégradé du verre pour la piste EBC : paille → brun. */
export const DEGRADE_EBC = 'linear-gradient(90deg,#F6E7A8,#F2C14E 20%,#D98B2B 45%,#9B4A1E 75%,#4A2010)';
