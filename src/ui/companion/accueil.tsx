/*
 * Accueil, pied de saisie et remise à zéro du compagnon (maquette p2a, cadres `accueil`, `finances`, `zero`) : Accueil, Lit, Modes,
 * Amorces, PiedSaisie, Zero. Props : Accueil {titre?, sousTitre?, origine?, finances?, tuiles, onChoisir, conversations?, limites?,
 * sources, onConversations?, onLimites?, intro?} ; Modes {mode, onMode, disabled?, conseille?} ; PiedSaisie {id, valeur, onValeur,
 * peutEnvoyer, …} ; Zero {portee, onConfirmer, onAnnuler, busy?}. Présentatif : la préférence de mode et l'envoi restent à l'écran.
 */
import type { ReactNode } from 'react';
import type { BrewerMode } from '../../../functions/src/companionTypes';
import { Textarea } from '../Input';
import { ICONE_DE_QUESTION, ICONE_DE_SOURCE } from './icones';
import { MODES, iconeQuestion, modeConseille, modeInfo } from './derive';
import { Dur, Icone, N, Piste, Tag } from './parts';

export interface TuileQuestion {
  /** La question envoyée telle quelle dans la saisie. Nom accessible de la tuile (le mode est décoratif). */
  question: string;
}

/** « Je lis à chaque question » : les sources que le serveur recharge (`sourcesLues`). */
export function Lit({ sources, titre = 'Je lis à chaque question' }: { sources: string[]; titre?: string }) {
  if (!sources.length) return null;
  return (
    <div className="cmp-lit">
      <span className="cmp-lbl1">{titre}</span>
      {sources.map((s) => (
        <span key={s} className="cmp-puce">
          <Icone nom={ICONE_DE_SOURCE[s] ?? 'livre'} />
          {s}
        </span>
      ))}
    </div>
  );
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
      {intro}
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
                <Icone nom={ICONE_DE_QUESTION[iconeQuestion(t.question)] ?? 'fleche'} />
                <span>{t.question}</span>
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
                <span>Aucune conversation</span>
              )}
              <Icone nom="droite" className="cmp-chev" />
            </button>
          ) : null}
          {limites ? (
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
      <Lit sources={sources} />
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
  conseille
}: {
  mode: BrewerMode;
  onMode: (mode: BrewerMode) => void;
  disabled?: boolean;
  conseille?: BrewerMode;
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
        {modeInfo(conseille).label} conseillé pour cette question
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
          id={id}
          className={`cmp-champ cmp-plein${haute ? ' cmp-zone' : ''}`}
          value={valeur}
          maxLength={maxLength}
          rows={haute ? 4 : 2}
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
const RESTE: Record<PorteeZero, string[]> = {
  batch: ['Ta recette', 'Ton brassin et son journal', 'Tes notes déjà gardées'],
  recipe: ['Ta recette', 'Tes notes déjà gardées'],
  draft: ['Ton brouillon de recette', 'Tes notes déjà gardées'],
  finances: ['Tes opérations, paiements et budgets'],
  ecran: ['Les données de l’écran', 'Tes notes déjà gardées']
};

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
  enFile = 0
}: {
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
              Les échanges de cette conversation
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
            {RESTE[portee].map((r) => (
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
