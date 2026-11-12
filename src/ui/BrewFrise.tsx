import React, { useLayoutEffect, useRef, useState } from 'react';
import type { BrewArea } from '../domain/brewCompanion';
import './brew-frise.css';

/* La journée en frise (p2c, choisie le 12.11). Elle remplace la barre des 4 phases : les mêmes phases, proportionnelles à l'heure, avec dessous
   « à côté » (rinçage, levure, refroidisseur) et « relevés » (un losange par relevé). Le composant ne calcule aucune heure ni aucun état :
   il reçoit des props déjà prêtes (contrat de voies/q0/PLAN.md : PlanJournee d'A3, ReleveDuJour d'A1). Les types ci-dessous sont les mêmes,
   en structure : un PlanJournee ou un ReleveDuJour s'y glisse sans conversion. */

export type EtatReleve = 'ok' | 'ecart' | 'du' | 'afaire' | 'manque';

/** Un relevé du jour, posé à son heure (ms, prévue ou faite). Les autres champs de ReleveDuJour passent sans gêner. */
export interface ReleveFrise {
  id: string;
  nom: string;
  heure: number;
  etat: EtatReleve;
}

export interface PlanFrise {
  debut: number;
  finEstimee: number | null;
  phases: { area: BrewArea; debut: number; fin: number; ticks: number[] }[];
  /** Préparations « à côté ». Une heure inconnue reste `null` : l'étiquette n'est pas posée à une heure inventée. */
  aCote: { id: string; nom: string; heure: number | null; fait: boolean }[];
  avanceMin?: number | null;
}

export interface BrewFriseProps {
  plan: PlanFrise;
  releves: readonly ReleveFrise[];
  /** Heure courante, en ms. */
  maintenant: number;
  /** Phase réellement en cours (par les étapes faites). Sans elle, l'horloge décide. */
  enCours?: BrewArea | null;
  /** Phase dont la vue est affichée (aria-pressed) ; null quand une autre vue est ouverte. */
  vue?: BrewArea | null;
  /** « Extraire » à la place d'« Empâter » pour une extraction, par exemple. */
  libelles?: Partial<Record<BrewArea, string>>;
  /** Phases sans étape : leur bouton ne répond pas. */
  phasesIndisponibles?: readonly BrewArea[];
  onPhase: (area: BrewArea) => void;
}

export const LIBELLES_PHASES: Record<BrewArea, string> = {
  preparation: 'Préparer',
  mash: 'Empâter',
  boil: 'Ébullition',
  finish: 'Refroidir'
};

const MIN = 60_000;
const ETATS_EN_MOTS: Record<EtatReleve, string> = {
  ok: 'dans la cible',
  ecart: 'écart',
  afaire: 'à relever',
  manque: 'pas relevé',
  du: 'dû maintenant'
};
const COULEUR_PHASE: Record<BrewArea, string> = {
  preparation: 'var(--fr-ph1)',
  mash: 'var(--fr-ph2)',
  boil: 'var(--fr-ph3)',
  finish: 'var(--fr-ph4)'
};
const LARGEUR_PAR_DEFAUT = 320; // la piste d'un téléphone de 390 px
const PX_PAR_CARACTERE = 6; // 14 px Source Sans, mesuré sur p2c (≈ 5,8)
const RAYON_ROND = 14; // rond de 10 px, espace, marge négative

/** Position en % entre `debut` et `fin`, bornée. */
export const positionFrise = (t: number, debut: number, fin: number): number => {
  if (!(fin > debut)) return 0;
  return Math.max(0, Math.min(100, ((t - debut) / (fin - debut)) * 100));
};

/** « 13 h 05 », heure locale, minutes sur deux chiffres. */
export const heureFrise = (t: number): string => {
  const d = new Date(t);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Les heures pleines de la journée, sans celles que la pastille de l'heure couvre (45 min autour ; 90 min avant quand elle se cale à droite). */
export const heuresDeLaFrise = (debut: number, fin: number, maintenant: number): number[] => {
  const premiere = new Date(debut);
  premiere.setMinutes(0, 0, 0);
  const heures: number[] = [];
  for (let d = new Date(premiere); d.getTime() <= fin; d = new Date(d.getTime() + 60 * MIN)) {
    // pas d'1 h exact : on recale l'heure locale (changement d'heure)
    d.setMinutes(0, 0, 0);
    const t = d.getTime();
    if (t < debut + 5 * MIN || t > fin - 5 * MIN) continue;
    heures.push(t);
  }
  const droite = pastilleADroite(fin, maintenant);
  return heures.filter((t) => (droite ? t > maintenant + 45 * MIN || t < maintenant - 90 * MIN : Math.abs(t - maintenant) > 45 * MIN));
};

const pastilleADroite = (fin: number, maintenant: number) => maintenant > fin - 25 * MIN;

export interface EtatPhase {
  area: BrewArea;
  etat: 'past' | 'cur' | 'fut';
  /** % rempli de la phase (0 à 100). */
  avance: number;
}

/** Passée, en cours ou à venir. Par l'horloge, ou par `enCours` quand les étapes disent où l'on en est (une ébullition qui déborde reste « en cours », pleine). */
export const etatDesPhases = (
  phases: PlanFrise['phases'],
  maintenant: number,
  enCours?: BrewArea | null
): EtatPhase[] => {
  const indice = enCours ? phases.findIndex((p) => p.area === enCours) : -1;
  return phases.map((p, i) => {
    const part = p.fin > p.debut ? Math.max(0, Math.min(100, ((maintenant - p.debut) / (p.fin - p.debut)) * 100)) : 0;
    if (indice >= 0) {
      if (i < indice) return { area: p.area, etat: 'past', avance: 100 };
      if (i === indice) return { area: p.area, etat: 'cur', avance: part };
      return { area: p.area, etat: 'fut', avance: 0 };
    }
    if (maintenant >= p.fin) return { area: p.area, etat: 'past', avance: 100 };
    if (maintenant >= p.debut) return { area: p.area, etat: 'cur', avance: part };
    return { area: p.area, etat: 'fut', avance: 0 };
  });
};

export interface EtiquetteCote {
  id: string;
  texte: string;
  heure: number | null;
}
export interface CoteRangee {
  id: string;
  rangee: number;
  /** Calée à gauche de son heure, quand elle sortirait de la piste à droite. */
  droite: boolean;
  gauche: number;
}

/** Range les étiquettes « à côté » sur le moins de rangées possible, sans qu'aucune en touche une autre.
    Problème d'école : affectation d'intervalles à des rangées (colorier un graphe d'intervalles), glouton par heure croissante,
    optimal pour ce graphe. Largeur du texte estimée (pas de mesure du DOM : pur, testable). Une heure inconnue : pas d'étiquette. */
export const rangerCote = (
  etiquettes: readonly EtiquetteCote[],
  piste: { debut: number; fin: number; largeur: number }
): CoteRangee[] => {
  const posees = etiquettes
    .filter((e): e is EtiquetteCote & { heure: number } => e.heure != null)
    .sort((a, b) => a.heure - b.heure);
  const finDeRangee: number[] = [];
  const marge = 8;
  return posees.map((e) => {
    const gauche = positionFrise(e.heure, piste.debut, piste.fin);
    const x = (gauche / 100) * piste.largeur;
    const l = e.texte.length * PX_PAR_CARACTERE + RAYON_ROND;
    const droite = x - 7 + l > piste.largeur;
    const x0 = droite ? x + 7 - l : x - 7;
    const x1 = x0 + l;
    let rangee = finDeRangee.findIndex((f) => x0 >= f + marge);
    if (rangee < 0) rangee = finDeRangee.length;
    finDeRangee[rangee] = x1;
    return { id: e.id, rangee, droite, gauche };
  });
};

const pct = (n: number) => `${n.toFixed(2)}%`;

export function BrewFrise({
  plan,
  releves,
  maintenant,
  enCours,
  vue,
  libelles,
  phasesIndisponibles = [],
  onPhase
}: BrewFriseProps) {
  const pisteRef = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(LARGEUR_PAR_DEFAUT);
  const [astuce, setAstuce] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = pisteRef.current;
    if (!el) return undefined;
    const mesurer = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setLargeur((avant) => (Math.abs(avant - w) < 1 ? avant : w));
    };
    mesurer();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!plan.phases.length) return null;

  const noms = { ...LIBELLES_PHASES, ...libelles };
  const debut = Math.min(plan.debut, plan.phases[0].debut);
  const finPhases = Math.max(...plan.phases.map((p) => p.fin));
  const fin = Math.max(plan.finEstimee ?? finPhases, finPhases, maintenant);
  const pos = (t: number) => positionFrise(t, debut, fin);
  const maintenantClamp = Math.max(debut, Math.min(fin, maintenant));
  const aDroite = pastilleADroite(fin, maintenant);
  const phases = etatDesPhases(plan.phases, maintenant, enCours);
  const heures = heuresDeLaFrise(debut, fin, maintenant);

  const cote = rangerCote(
    plan.aCote.map((c) => ({ id: c.id, texte: c.nom, heure: c.heure })),
    { debut, fin, largeur }
  );
  const rangees = Math.max(1, ...cote.map((c) => c.rangee + 1));
  const coteSansHeure = plan.aCote.filter((c) => c.heure == null);
  const unReleveDu = releves.some((r) => r.etat === 'du');

  return (
    <section className="brew-frise" aria-label="La journée" style={{ '--fr-rangees': rangees } as React.CSSProperties}>
      <div className="fr-g" aria-hidden="true">
        <span />
        <span />
        <span />
        <span>à côté</span>
        <span>relevés</span>
      </div>
      <div className="fr-tl" ref={pisteRef}>
        <div className="fr-heures">
          {heures.map((t) => (
            <span key={t} style={{ left: pct(pos(t)) }}>
              {new Date(t).getHours()} h
            </span>
          ))}
          <b className={`fr-pastille${aDroite ? ' fr-droite' : ''}`} style={{ left: pct(pos(maintenant)) }}>
            {heureFrise(maintenant)}
          </b>
        </div>
        <div className="fr-barre" aria-hidden="true">
          {plan.phases.map((p, i) => (
            <div
              key={p.area}
              className={`fr-seg ${phases[i].etat}`}
              style={{ left: pct(pos(p.debut)), width: pct(pos(p.fin) - pos(p.debut)), '--fr-c': COULEUR_PHASE[p.area] } as React.CSSProperties}
            >
              <u style={{ width: `${phases[i].avance.toFixed(1)}%` }} />
              {p.ticks.map((t) => (
                <i key={t} style={{ left: `${positionFrise(t, p.debut, p.fin).toFixed(1)}%` }} />
              ))}
            </div>
          ))}
        </div>
        <div className="fr-noms">
          {plan.phases.map((p, i) => {
            const ici = vue === p.area;
            return (
              <button
                key={p.area}
                type="button"
                className={`fr-nom ${phases[i].etat}`}
                style={{ left: pct(pos(p.debut)), '--fr-c': COULEUR_PHASE[p.area] } as React.CSSProperties}
                data-phase={p.area}
                disabled={phasesIndisponibles.includes(p.area)}
                aria-pressed={ici}
                aria-current={ici ? 'step' : undefined}
                onClick={() => onPhase(p.area)}
              >
                {noms[p.area]}
              </button>
            );
          })}
        </div>
        <div className="fr-cote">
          {cote.map((c) => {
            const a = plan.aCote.find((x) => x.id === c.id)!;
            return (
              <button
                key={a.id}
                type="button"
                className={`fr-ch r${c.rangee}${a.fait ? ' fait' : ''}${c.droite ? ' dr' : ''}`}
                style={{ left: pct(c.gauche) }}
                onClick={() => setAstuce(`${a.nom} · ${heureFrise(a.heure as number)}`)}
              >
                <u />
                {a.nom}
              </button>
            );
          })}
        </div>
        <div className="fr-rel">
          {releves.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`fr-dm ${r.etat}`}
              style={{ left: pct(pos(r.heure)) }}
              aria-label={`${r.nom} · ${heureFrise(r.heure)} · ${ETATS_EN_MOTS[r.etat]}`}
              onClick={() => setAstuce(`${r.nom} · ${heureFrise(r.heure)}`)}
            />
          ))}
        </div>
        <div className="fr-now" style={{ left: pct(pos(maintenantClamp)) }} aria-hidden="true" />
      </div>
      {coteSansHeure.length > 0 && (
        <p className="fr-cote-sans">
          {coteSansHeure.map((c) => (
            <span key={c.id} className={`fr-sans${c.fait ? ' fait' : ''}`}>
              <u />
              {c.nom} · ?
            </span>
          ))}
        </p>
      )}
      <p className="fr-legende">
        <span>
          <i className="fr-dm ok" />
          dans la cible
        </span>
        <span>
          <i className="fr-dm ecart" />
          écart
        </span>
        <span>
          <i className="fr-dm afaire" />
          à relever
        </span>
        <span>
          <i className="fr-dm manque" />
          pas relevé
        </span>
        {unReleveDu && (
          <span>
            <i className="fr-dm du" />
            dû maintenant
          </span>
        )}
      </p>
      <p className="fr-tip" role="status" hidden={astuce == null}>
        {astuce}
      </p>
    </section>
  );
}
