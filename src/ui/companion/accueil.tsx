/*
 * Accueil, pied de saisie et remise à zéro du compagnon (maquette p2a, cadres `accueil`, `finances`, `zero`) : Accueil, Lit, Modes,
 * Amorces, PiedSaisie, Zero. Props : Accueil {titre?, sousTitre?, origine?, finances?, tuiles, onChoisir, conversations?, limites?,
 * sources, onConversations?, onLimites?, intro?} ; Modes {mode, onMode, disabled?, conseille?} ; PiedSaisie {id, valeur, onValeur,
 * peutEnvoyer, …} ; Zero {portee, onConfirmer, onAnnuler, busy?}. Présentatif : la préférence de mode et l'envoi restent à l'écran.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { BrewerMode } from '../../../functions/src/companionTypes';
import { Textarea } from '../Input';
import { ICONE_DE_QUESTION, ICONE_DE_SOURCE } from './icones';
import { MODES, iconeQuestion, modeConseille, modeInfo } from './derive';
import { Dur, Icone, N, Piste, Tag } from './parts';
import type { NomIcone } from './icones';
import type { Jalon } from './contexte';
import './accueil.css';

export interface TuileQuestion {
  /** La question envoyée telle quelle dans la saisie. Nom accessible de la tuile (le mode est décoratif). */
  question: string;
  /** Texte affiché et nom accessible, si différent de la question envoyée (ex. Finances). */
  label?: string;
  /** Icône imposée (tuiles dérivées du brassin) ; sinon elle vient du sujet de la question. */
  icone?: NomIcone;
}

/** « Je lis à chaque question » : les sources que le serveur recharge (`sourcesLues`). */
export function Lit({ sources, titre }: { sources: string[]; titre?: string }) {
  if (!sources.length) return null;
  return (
    <div className="cmp-lit">
      <span className="cmp-lbl1">{titre ?? 'Je lis à chaque question'}</span>
      {sources.map((s) => (
        <span key={s} className="cmp-puce">
          <Icone nom={ICONE_DE_SOURCE[s] ?? ICONE_DE_SOURCE[s.replace(/ [0-9]+$/, '')] ?? 'livre'} />
          {s}
        </span>
      ))}
    </div>
  );
}

/**
 * Frise du brassin : un trait de J+0 au bout (dernier jalon + 3 jours), le repère « auj. » et un cercle par dry hop daté
 * (nom au-dessus, « J+n » dessous ; cercle plein une fois le jour passé). Les jalons viennent de la recette du brassin.
 */
export function Frise({ jour, jalons }: { jour: number; jalons: Jalon[] }) {
  if (!jalons.length) return null;
  const bout = Math.max(jalons[jalons.length - 1].jour + 3, jour + 1);
  const pct = (j: number) => (j / bout) * 100;
  const decrit = jalons.map((j) => `${j.nom} J+${j.jour}`).join(', ');
  return (
    <div className="cmp-frise" role="img" aria-label={`Brassin : aujourd’hui J+${jour}, ${decrit}`}>
      <span className="cmp-fr-rail" />
      <span className="cmp-fr-fait" style={{ width: `${pct(jour)}%` }} />
      <span className="cmp-fr-auj" style={{ left: `${pct(jour)}%` }}>
        <b>auj.</b>
      </span>
      {jalons.map((j) => (
        <span key={`${j.nom}-${j.jour}`} className={`cmp-fr-pt${j.jour < jour ? ' cmp-fait' : ''}`} style={{ left: `${pct(j.jour)}%` }}>
          <b>{j.nom}</b>
          <small>J+{j.jour}</small>
        </span>
      ))}
      <span className="cmp-fr-bout">
        <small>J+{bout}</small>
      </span>
    </div>
  );
}

export interface CaseVerifiee {
  label: string;
  icone: NomIcone;
}

export interface ResumeConversations {
  prets: number;
  enCours: number;
  echecs: number;
}
export interface ResumeLimites {
  /** « 4/120 » : texte court, déjà formaté. */
  appels: string;
  /** « 2,10/15 CHF » : texte court, déjà formaté. */
  mois: string;
  /** Parts 0 à 100, ou `null` si la limite est inconnue : la piste ne se dessine pas, l'inconnu n'est jamais 0 %. */
  partAppels: number | null;
  partMois: number | null;
}

/**
 * Accueil de la feuille : titre, tuiles de questions (une icône d'après le sujet, le mode conseillé en pastille),
 * deux mini-cartes (conversations, limites) et les sources lues. En Finances : bandeau d'origine et « Autres questions ».
 * `intro` : contenu propre à l'écran (lecture assistée) affiché sous le titre.
 */
export function Accueil({
  titre,
  sousTitre,
  origine,
  finances = false,
  intro,
  frise,
  portee,
  titreSources,
  tuiles,
  onChoisir,
  conversations,
  onConversations,
  limites,
  onLimites,
  sources
}: {
  titre?: string;
  sousTitre?: ReactNode;
  origine?: string;
  finances?: boolean;
  intro?: ReactNode;
  /** Frise des jalons, sous le titre (portée brassin) : jour courant et dry hops datés. */
  frise?: { jour: number; jalons: Jalon[] };
  /** « Je vérifie · N sur N » : les points de la vérification demandée (libellés fixes de l'origine). */
  portee?: { titre: string; cases: CaseVerifiee[] };
  titreSources?: string;
  tuiles: TuileQuestion[];
  onChoisir: (question: string, modeConseille: BrewerMode) => void;
  conversations?: ResumeConversations;
  onConversations?: () => void;
  limites?: ResumeLimites;
  onLimites?: () => void;
  sources: string[];
}) {
  const total = conversations ? conversations.prets + conversations.enCours + conversations.echecs : 0;
  return (
    <>
      {origine ? (
        <div className="cmp-origine">
          <Icone nom="facture" />
          <span>
            Depuis Finances · <b>{origine}</b>
          </span>
        </div>
      ) : null}
      {titre ? (
        <div className="cmp-pres">
          <h3>{titre}</h3>
          {sousTitre ? <p>{sousTitre}</p> : null}
        </div>
      ) : null}
      {frise && frise.jalons.length ? <Frise jour={frise.jour} jalons={frise.jalons} /> : null}
      {intro}
      {portee ? (
        <div className="cmp-carte cmp-portee">
          <div className="cmp-lbl">
            <span>{portee.titre}</span>
            <span>
              {portee.cases.length} sur {portee.cases.length}
            </span>
          </div>
          <div className="cmp-cases">
            {portee.cases.map((c) => (
              <span key={c.label} className="cmp-cf">
                <Icone nom={c.icone} />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {tuiles.length > 0 && finances ? (
        <div className="cmp-lbl">
          <span>Autres questions</span>
          <span>finances</span>
        </div>
      ) : null}
      {tuiles.length > 0 ? (
        <div className={`cmp-tuiles${finances ? ' cmp-tuiles-fin' : ''}`}>
          {tuiles.map((t) => {
            const mode = modeConseille(t.question);
            const info = modeInfo(mode);
            return (
              <button key={t.question} type="button" className="cmp-tuile" onClick={() => onChoisir(t.question, mode)}>
                <Icone nom={t.icone ?? ICONE_DE_QUESTION[iconeQuestion(t.question)] ?? 'fleche'} />
                <span>{t.label ?? t.question}</span>
                <Tag label={info.label} pips={info.pips} />
              </button>
            );
          })}
        </div>
      ) : null}
      {conversations || limites ? (
        <div className="cmp-duo">
          {conversations ? (
            <button
              type="button"
              className="cmp-mini"
              onClick={onConversations}
              aria-label={`Mes conversations : ${conversations.prets} prêtes, ${conversations.enCours} en cours, ${conversations.echecs} en échec`}
            >
              <Icone nom="fil" />
              {total > 0 ? (
                <span className="cmp-pts">
                  <i className="cmp-pv" />
                  <N>{conversations.prets}</N>
                  <i className="cmp-pa" />
                  <N>{conversations.enCours}</N>
                  <i className="cmp-pr" />
                  <N>{conversations.echecs}</N>
                </span>
              ) : (
                <span className="sr-only">Aucune conversation</span>
              )}
              <Icone nom="droite" className="cmp-chev" />
            </button>
          ) : null}
          {limites && (limites.appels || limites.mois) ? (
            <button type="button" className="cmp-mini cmp-lim" onClick={onLimites} aria-label="Limites IA, régler">
              <span className="cmp-lim-l">
                <span>
                  <N>{limites.appels}</N>
                </span>
                {limites.partAppels === null ? null : <Piste pct={limites.partAppels} />}
              </span>
              <span className="cmp-lim-l">
                <span>
                  <N>{limites.mois}</N>
                </span>
                {limites.partMois === null ? null : <Piste pct={limites.partMois} />}
              </span>
              <Icone nom="droite" className="cmp-chev" />
            </button>
          ) : null}
        </div>
      ) : null}
      <Lit sources={sources} titre={titreSources} />
    </>
  );
}

/**
 * Mode de réponse en segment à jauges (Rapide, Auto, Approfondi). `conseille` : un mode suggéré par une tuile, dit en note ;
 * la note ne change pas la préférence enregistrée.
 */
export function Modes({
  mode,
  onMode,
  disabled = false,
  conseille,
  motif = 'pour cette question'
}: {
  mode: BrewerMode;
  onMode: (mode: BrewerMode) => void;
  disabled?: boolean;
  conseille?: BrewerMode;
  /** « pour cette vérification » depuis Finances ; « pour cette question » sinon. */
  motif?: string;
}) {
  const segment = (
    <div className="cmp-modes" role="radiogroup" aria-label="Mode de réponse">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={mode === m.value}
          disabled={disabled}
          className={`cmp-mode${mode === m.value ? ' cmp-sel' : ''}`}
          onClick={() => onMode(m.value)}
        >
          <Dur n={m.pips} />
          {m.label}
        </button>
      ))}
    </div>
  );
  if (!conseille) return segment;
  return (
    <div className="cmp-modes-w">
      <span className="cmp-mode-cons">
        <Icone nom="ok" />
        {modeInfo(conseille).label} conseillé {motif}
      </span>
      {segment}
    </div>
  );
}

/** Amorces de saisie : de courts débuts de phrase. `suite` : la suite proposée par la dernière réponse, en puce pleine. */
export function Amorces({
  amorces,
  suite,
  onChoisir,
  disabled = false
}: {
  amorces: string[];
  suite?: string;
  onChoisir: (texte: string) => void;
  disabled?: boolean;
}) {
  if (!amorces.length && !suite) return null;
  return (
    <div className="cmp-amorces">
      {suite ? (
        <button type="button" className="cmp-chip cmp-suite" disabled={disabled} onClick={() => onChoisir(suite)}>
          <Icone nom="fleche" />
          <span>{suite}</span>
        </button>
      ) : null}
      {amorces.map((a) => (
        <button key={a} type="button" className="cmp-chip" disabled={disabled} onClick={() => onChoisir(a)}>
          {a}
        </button>
      ))}
    </div>
  );
}

/**
 * Pied de la feuille, à placer dans le `<form>` du compagnon : `avant` (bandeau hors ligne, amorces), `modes`, messages
 * (`children`, ex. états de la lecture assistée), puis la saisie 16 px et le bouton d'envoi (type submit, actif quand `peutEnvoyer`).
 * `haute` : zone de saisie haute, cerclée de l'accent finances.
 */
export function PiedSaisie({
  id,
  etiquette = 'Question au compagnon brasseur',
  valeur,
  onValeur,
  placeholder,
  maxLength,
  readOnly = false,
  peutEnvoyer,
  envoiBloque = false,
  haute = false,
  avant,
  modes,
  children
}: {
  id: string;
  etiquette?: string;
  valeur: string;
  onValeur: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  readOnly?: boolean;
  peutEnvoyer: boolean;
  envoiBloque?: boolean;
  haute?: boolean;
  avant?: ReactNode;
  modes?: ReactNode;
  children?: ReactNode;
}) {
  // Une ligne de 44 px au repos ; la hauteur suit le texte jusqu'à 120 px (la zone haute de Finances garde ses 4 lignes).
  const champ = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const t = champ.current;
    if (!t) return;
    const ajuster = () => {
      t.style.height = '44px';
      // Champ vide : 44 px sans mesure (le placeholder, ou une feuille encore en train de s'ouvrir, ne doit pas le doubler).
      if (!t.value) return;
      t.style.height = `${Math.min(Math.max(t.scrollHeight + 2, 44), 120)}px`;
    };
    ajuster();
    // La largeur change à l'ouverture de la feuille et à la rotation : la hauteur se remesure.
    if (typeof ResizeObserver === 'undefined') return;
    let largeur = t.clientWidth;
    const suivi = new ResizeObserver(() => {
      if (t.clientWidth !== largeur) {
        largeur = t.clientWidth;
        ajuster();
      }
    });
    suivi.observe(t);
    return () => suivi.disconnect();
  }, [valeur, haute]);
  return (
    <div className="cmp-pied">
      {avant}
      {modes}
      {children}
      <div className={`cmp-saisie${haute ? ' cmp-saisie-haute' : ''}`}>
        <label className="sr-only" htmlFor={id}>
          {etiquette}
        </label>
        <Textarea
          ref={champ}
          id={id}
          className={`cmp-champ cmp-plein${haute ? ' cmp-zone' : ''}`}
          value={valeur}
          maxLength={maxLength}
          rows={1}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onValeur(e.target.value)}
        />
        <button
          type="submit"
          className={`cmp-env${peutEnvoyer ? ' cmp-on' : ''}`}
          disabled={envoiBloque || !peutEnvoyer}
          aria-label="Envoyer la question"
        >
          <Icone nom="envoyer" />
        </button>
      </div>
    </div>
  );
}

export type PorteeZero = 'batch' | 'recipe' | 'draft' | 'finances' | 'ecran';
/** Ce qui s'efface : les échanges de la portée (ce brassin, cette recette…). */
const ECHANGES: Record<PorteeZero, string> = {
  batch: 'Les échanges de ce brassin',
  recipe: 'Les échanges de cette recette',
  draft: 'Les échanges de ce brouillon',
  finances: 'Les échanges de cette conversation',
  ecran: 'Les échanges de cette conversation'
};
/** Ce qui reste, avec le nom de la recette et le numéro du brassin quand on les connaît (sinon sans eux, jamais inventés). */
function resteDe(portee: PorteeZero, nom?: string, numero?: string): string[] {
  const recette = nom ? `Recette ${nom}` : 'La recette';
  switch (portee) {
    case 'batch':
      return [recette, numero ? `Brassin ${numero} et son journal` : 'Le brassin et son journal', 'Notes déjà gardées'];
    case 'recipe':
      return [recette, 'Notes déjà gardées'];
    case 'draft':
      return [nom ? `Brouillon ${nom}` : 'Le brouillon de recette', 'Notes déjà gardées'];
    case 'finances':
      return ['Opérations, paiements et budgets'];
    default:
      return ['Les données de l’écran', 'Notes déjà gardées'];
  }
}

/**
 * Remise à zéro : ce qui s'efface (les échanges ; la réponse et la file seulement s'il y en a), ce qui reste (selon la portée).
 * Dialogue bas posé sur la feuille ; `role="group"` et son nom sont ceux du formulaire de confirmation existant.
 */
export function Zero({
  portee,
  onConfirmer,
  onAnnuler,
  busy = false,
  reponseEnCours = false,
  enFile = 0,
  nom,
  numero
}: {
  /** Nom de la recette et numéro du brassin, pour la colonne « Reste ». */
  nom?: string;
  numero?: string;
  portee: PorteeZero;
  onConfirmer: () => void;
  onAnnuler: () => void;
  busy?: boolean;
  reponseEnCours?: boolean;
  enFile?: number;
}) {
  return (
    <>
      <div className="cmp-voile2" aria-hidden="true" />
      <section className="cmp-dialogue" role="group" aria-label="Confirmer la remise à zéro">
        <h3>
          <Icone nom="zero" />
          Repartir à zéro ?
        </h3>
        <div className="cmp-colonnes">
          <div className="cmp-col cmp-col-efface">
            <span className="cmp-lbl1">S’efface</span>
            <p>
              <Icone nom="x" />
              {ECHANGES[portee]}
            </p>
            {reponseEnCours ? (
              <p>
                <Icone nom="x" />
                La réponse en cours
              </p>
            ) : null}
            {enFile > 0 ? (
              <p>
                <Icone nom="x" />
                {enFile > 1 ? 'Les questions en file' : 'La question en file'}
              </p>
            ) : null}
          </div>
          <div className="cmp-col cmp-col-reste">
            <span className="cmp-lbl1">Reste</span>
            {resteDe(portee, nom, numero).map((r) => (
              <p key={r}>
                <Icone nom="ok" />
                {r}
              </p>
            ))}
          </div>
        </div>
        <div className="cmp-act">
          <button type="button" className="cmp-btn cmp-s" disabled={busy} onClick={onAnnuler}>
            Annuler
          </button>
          <button type="button" className="cmp-btn cmp-d cmp-d-plein" disabled={busy} onClick={onConfirmer}>
            <Icone nom="zero" />
            {busy ? 'Remise à zéro…' : 'Effacer les échanges'}
          </button>
        </div>
      </section>
    </>
  );
}
