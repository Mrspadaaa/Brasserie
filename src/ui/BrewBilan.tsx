import React, { useId, useState } from 'react';
import { ArrowLeftRight, ArrowUp, CircleHelp, Clock, Flag, PencilLine } from 'lucide-react';
import { heureCuve } from './BrewIngredients';
import './brew-bilan.css';

/**
 * Le bilan du jour de brassage (port de p2c, « La journée en frise, et le bilan visé », choisie le 12.11).
 *
 * Une grille de tuiles « nom · valeur · cible · quand » : bord vert (dans la cible), ocre (écart), ocre épais (dû), pointillé
 * (non relevé). Au jour du brassage, le titre dit « bilan visé » ; à la clôture, « bilan contre la cible », avec « Pas relevés » et
 * « Heures tenues ». Le composant ne calcule rien : il reçoit des tuiles déjà prêtes (`relevesDuJour`, `zonesDeCible`, rendement) et les met en page.
 *
 * Honnêteté des données : une valeur absente se lit « ? », jamais 0. Une tuile ne porte « ≈ » dans sa valeur que si elle est
 * un calcul (`calcul`), comme le rendement ; sur un relevé, le signe est retiré.
 */

/** Même énumération que `EtatReleve` du contrat A1 (voies/q0/PLAN.md). */
export type EtatTuile = 'ok' | 'ecart' | 'du' | 'afaire' | 'manque';

/**
 * Ce qu'une tuile affiche. Sous-ensemble structurel de `ReleveDuJour` (A1) : un relevé s'y passe tel quel, avec `valeur` déjà
 * mise en forme (« 66,4 °C · pH 5,35 », « ? L · ? », « ≈ 52 % »).
 */
export interface TuileBilan {
  id: string;
  nom: string;
  /** Absente ou vide : « ? ». Jamais 0 à la place d'un relevé manquant. */
  valeur?: string | null;
  cible?: string;
  /** Ligne du bas : « vers 15 h 05 », « ✓ dans la cible », « −2 points ». */
  quand: string;
  etat: EtatTuile;
  /** Valeur calculée par l'app (rendement) : seule à porter « ≈ » dans sa valeur. */
  calcul?: boolean;
  /** Pleine largeur (« Avant ébullition » hors cible, en tête de l'état E3). */
  grand?: boolean;
  /** Nom court dans « Pas relevés » : « eau d'empâtage °C », « coupure », « moût à l'ajout °C ». Défaut : le nom en minuscules. */
  court?: string;
}

/** Une ligne de « Heures tenues » (Z01). `de` et `a` en ms ; `detail` remplace la plage (« 4 sur 4 »). */
export interface HeureTenue {
  id: string;
  nom: string;
  de?: number | null;
  a?: number | null;
  detail?: string;
  /** « 60 min ✓ », « Citra 4 min en retard », « ✓ ». */
  verdict: string;
  ton?: 'ok' | 'ecart' | 'neutre';
}

/** Une ligne de « Au journal ». `at` en ms. */
export interface EntreeJournalBilan {
  at: number;
  texte: string;
}

const ETAT_DIT: Record<EtatTuile, string> = {
  ok: 'Dans la cible. ',
  ecart: 'Écart. ',
  du: 'Relevé dû. ',
  afaire: 'À relever. ',
  manque: 'Non relevé. '
};

/** « 3 relevés sur 9 » : 0 et 1 au singulier. */
export function compteurReleves(faits: number, total: number): string {
  return `${faits} relevé${faits > 1 ? 's' : ''} sur ${total}`;
}

/** Une valeur absente ou vide est « ? », jamais 0 ; « ≈ » n'y reste que pour un calcul. */
export function valeurTuile(t: Pick<TuileBilan, 'valeur' | 'calcul'>): string {
  const brut = (t.valeur ?? '').trim();
  if (!brut) return '?';
  return t.calcul ? brut : brut.replace(/≈\s*/g, '');
}

/**
 * Dans le bilan de clôture, ce qui n'a pas été relevé tient dans une seule tuile « Pas relevés » (B17). Un relevé compte comme pris
 * seulement s'il est dans la cible ou en écart ; les autres états (dû, à faire, non relevé) restent « ? » au journal.
 */
export function separerPasReleves(tuiles: TuileBilan[]): { prises: TuileBilan[]; pasReleves: TuileBilan | null } {
  // Une valeur lue sans cible (rendement, « visé ? ») reste dans la grille : elle est connue, seul le verdict manque.
  const prise = (t: TuileBilan) => t.etat === 'ok' || t.etat === 'ecart' || (t.etat === 'afaire' && /\d/.test(t.valeur ?? ''));
  const prises = tuiles.filter(prise);
  const absentes = tuiles.filter((t) => !prise(t));
  if (!absentes.length) return { prises, pasReleves: null };
  return {
    prises,
    pasReleves: {
      id: 'pas-releves',
      nom: 'Pas relevés',
      valeur: absentes.map(() => '?').join(' '),
      cible: absentes.map((t) => t.court ?? t.nom.toLowerCase()).join(' · '),
      quand: 'restent « ? » au journal',
      etat: 'manque'
    }
  };
}

/** Les nombres et les « ? » en gras, l'unité et les mots en clair : 27,9 L · 1,048 ; pH 5,35 ; ≈ 52 %. */
function Valeur({ texte }: { texte: string }) {
  const morceaux = texte.split(/(≈\s*\d+(?:[.,]\d+)?\s*%|\d+(?:[.,]\d+)?|\?)/);
  return (
    <>
      {morceaux.map((m, i) =>
        i % 2 === 1 ? (
          <b key={i} className={m === '?' ? 'is-q' : undefined}>
            {m}
          </b>
        ) : (
          m
        )
      )}
    </>
  );
}

function Tuile({ t }: { t: TuileBilan }) {
  const valeur = valeurTuile(t);
  return (
    <li
      className={`bz-bilan-t is-${t.etat}${t.grand ? ' is-grand' : ''}`}
      data-etat={t.etat}
      data-tuile={t.id}
    >
      <span className="bz-bilan-nm">{t.nom}</span>
      <span className="bz-bilan-v">
        <Valeur texte={valeur} />
      </span>
      {t.cible ? <span className="bz-bilan-c">{t.cible}</span> : null}
      <span className="bz-bilan-w">
        <span className="bz-bilan-sr">{t.etat === 'afaire' && /\d/.test(valeur) ? 'Relevé, sans cible. ' : ETAT_DIT[t.etat]}</span>
        {t.quand}
      </span>
    </li>
  );
}

const heure = (at: number | null | undefined) => (at == null ? '?' : heureCuve(at));

/** « Heures tenues » (Z01) : ce qui a été tenu, heure par heure, d'après les horodatages de la journée. */
export function BrewHeuresTenues({ lignes }: { lignes: HeureTenue[] }) {
  if (!lignes.length) return null;
  return (
    <div className="bz-bilan-heures">
      <h4 className="bz-bilan-gh">Heures tenues</h4>
      <ul>
        {lignes.map((l) => {
          const plage = l.detail ?? (l.de != null && l.a != null ? `${heure(l.de)}–${heure(l.a)}` : heure(l.de ?? l.a));
          return (
            <li key={l.id} className="bz-bilan-tn" data-ton={l.ton ?? 'neutre'}>
              <span className="bz-bilan-tn-nm">{l.nom}</span>
              <span className="bz-bilan-tn-h">{plage}</span>
              <span className={`bz-bilan-tn-v is-${l.ton ?? 'neutre'}`}>{l.verdict}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** « Au journal · tout est daté » (Z03) : l'extrait des faits saillants du jour. Rien à dire : rien d'affiché. */
export function BrewJournalExtrait({ entrees }: { entrees: EntreeJournalBilan[] }) {
  if (!entrees.length) return null;
  return (
    <section className="bz-bilan-journal" aria-label="Au journal">
      <div className="bz-bilan-tete">
        <PencilLine size={20} aria-hidden="true" />
        <h3>Au journal</h3>
        <span className="bz-bilan-r">tout est daté</span>
      </div>
      <ul className="bz-bilan-jn">
        {entrees.map((e, i) => (
          <li key={`${e.at}-${i}`}>
            <span className="bz-bilan-jn-h">{heureCuve(e.at)}</span> {e.texte}
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface BrewBilanProps {
  /** `vise` : la journée en cours, titre « bilan visé » ; `reel` : la clôture, « bilan contre la cible ». */
  mode?: 'vise' | 'reel';
  tuiles: TuileBilan[];
  /** Relevés pris dans la journée (A1) et leur total (9 au scénario). */
  faits: number;
  total?: number;
  /** Fin de journée estimée, en ms (A3) ; `null` : « fin ? ». */
  fin?: number | null;
  /** Clôture : « Heures tenues » sous la grille (Z01). */
  heures?: HeureTenue[];
  /** « Au jour J » (N12) : chaque porte n'apparaît que si son éditeur est branché. */
  onDuree?: () => void;
  onDose?: () => void;
  onHoublonManquant?: () => void;
  /** G3 : la porte « Aide » à un toucher. Le contenu (Compagnon, aides du jour J) vient de la page ; rien d'autre n'y entre. */
  aide?: React.ReactNode;
  className?: string;
}

export function BrewBilan({
  mode = 'vise',
  tuiles,
  faits,
  total = 9,
  fin,
  heures,
  onDuree,
  onDose,
  onHoublonManquant,
  aide,
  className = ''
}: BrewBilanProps) {
  const [aideOuverte, setAideOuverte] = useState(false);
  const idAide = useId();
  const reel = mode === 'reel';
  const { prises, pasReleves } = reel ? separerPasReleves(tuiles) : { prises: tuiles, pasReleves: null };
  const visibles = pasReleves ? [...prises, pasReleves] : prises;
  const titre = reel ? 'Relevés du jour · bilan contre la cible' : 'Relevés du jour · bilan visé';
  // L'estimation seule porte « estimé » : tant qu'aucun relevé n'est pris, la fin ne vient que du plan.
  const finTexte = reel ? null : fin == null ? 'fin ?' : `fin ~${heureCuve(fin)}${faits === 0 ? ' estimé' : ''}`;
  const compte = [compteurReleves(faits, total), finTexte].filter(Boolean).join(' · ');
  const portes = onDuree || onDose || onHoublonManquant || aide;
  return (
    <section
      className={`bz-bilan is-${mode}${className ? ` ${className}` : ''}`}
      aria-label={titre}
      data-mode={mode}
    >
      <div className="bz-bilan-tete">
        <Flag size={20} aria-hidden="true" />
        <h3>{titre}</h3>
        <span className="bz-bilan-r">{compte}</span>
      </div>
      <ul className="bz-bilan-grille">
        {visibles.map((t) => (
          <Tuile key={t.id} t={t} />
        ))}
      </ul>
      {reel && heures?.length ? <BrewHeuresTenues lignes={heures} /> : null}
      {!reel && portes ? (
        <div className="bz-bilan-dv" role="group" aria-label="Au jour J">
          <span>Au jour J</span>
          {onDuree ? (
            <button type="button" onClick={onDuree}>
              <Clock size={16} aria-hidden="true" />
              durée ±
            </button>
          ) : null}
          {onDose ? (
            <button type="button" onClick={onDose}>
              <ArrowUp size={16} aria-hidden="true" />
              dose
            </button>
          ) : null}
          {onHoublonManquant ? (
            <button type="button" onClick={onHoublonManquant}>
              <ArrowLeftRight size={16} aria-hidden="true" />
              houblon manquant
            </button>
          ) : null}
          {aide ? (
            <button
              type="button"
              className="bz-bilan-aide-porte"
              aria-expanded={aideOuverte}
              aria-controls={idAide}
              onClick={() => setAideOuverte((o) => !o)}
            >
              <CircleHelp size={16} aria-hidden="true" />
              Aide
            </button>
          ) : null}
        </div>
      ) : null}
      {!reel && aide ? (
        <div id={idAide} className="bz-bilan-aide" role="region" aria-label="Aide du jour J" hidden={!aideOuverte}>
          {aide}
        </div>
      ) : null}
    </section>
  );
}
