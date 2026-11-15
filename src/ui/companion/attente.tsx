/*
 * Attente et échecs du compagnon (maquette p2a, cadres `attente`, `erreur`, `plafond`) : Attente, Etapes, Echec, HorsLigne,
 * BandeauHorsLigne, Plafond. Props : Attente {question?, mode, debut, fin?, stage?, file?, notifier?, onFermer, children?} ;
 * Echec {message, etape?, onRelancer?, onReformuler?, libelleRelancer?, busy?} ; HorsLigne {question?, message?, resume?,
 * onEnvoyer, onReformuler?, libelleEnvoi?, busy?} ; Plafond {question?, onLimits, onLater}. Aucune logique serveur.
 */
import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { BrewerMode } from '../../../functions/src/companionTypes';
import { BrewerBudgetCapView } from '../BrewerBudget';
import {
  BORNE_SERVEUR_S, ETAPES, dureeTexte, etapeIndex, etapeTexte, etatsEtapes, habituelTexte, jaugeDuree, modeInfo
} from './derive';
import type { EtatEtape } from './derive';
import { Icone, N, useSecondes } from './parts';

const CLASSE_ETAPE: Record<EtatEtape, string> = { fait: 'cmp-f', 'en-cours': 'cmp-e', 'a-venir': '', rompu: 'cmp-x' };

/** Les quatre étapes (Lire, Calculer, Sources, Relire) en segments. `courante` : index (0 à 3) ; `rompu` : l'étape courante a échoué. */
export function Etapes({ courante, rompu = false, mini = false }: { courante: number; rompu?: boolean; mini?: boolean }) {
  const etats = etatsEtapes(courante, rompu);
  return (
    <div className={`cmp-etapes${mini ? ' cmp-etapes-mini' : ''}`}>
      {ETAPES.map((nom, i) => (
        <div key={nom} className={CLASSE_ETAPE[etats[i]]} aria-current={etats[i] === 'en-cours' ? 'step' : undefined}>
          <i />
          {mini ? <span className="sr-only">{nom}</span> : nom}
        </div>
      ))}
    </div>
  );
}

/**
 * Attente d'une réponse : chrono mono, jauge de durée (habituel en bande, arrêt serveur à 3:40), étapes, file.
 * `debut` : début du travail en ms ; `fin` l'arrête (réponse reçue). `stage` : `job.stage` ; l'avancement ne recule jamais.
 * `file` : questions suivantes, rang 2…, sans bouton de retrait (aucun appel d'annulation). `notifier` : le bouton dit « me notifier ».
 */
export function Attente({
  question,
  mode,
  debut,
  fin,
  stage,
  file = [],
  notifier = true,
  onFermer,
  children
}: {
  question?: string;
  mode: BrewerMode;
  debut: number | undefined;
  fin?: number;
  stage?: string;
  file?: Array<{ id: string; question: string }>;
  notifier?: boolean;
  onFermer?: () => void;
  children?: ReactNode;
}) {
  const secondes = useSecondes(debut, fin);
  const jauge = jaugeDuree(mode, secondes);
  const maximum = useRef(0);
  const lu = etapeIndex(stage);
  if (lu > maximum.current) maximum.current = lu;
  const borne = dureeTexte(BORNE_SERVEUR_S);
  return (
    <>
      {question ? <div className="cmp-q">{question}</div> : null}
      <div className="cmp-carte cmp-chrono">
        <div className="cmp-chrono-h">
          <N>{jauge.texte}</N>
          <span>
            en {modeInfo(mode).label} · {jauge.statut}
          </span>
        </div>
        <div
          className="cmp-duree"
          role="img"
          aria-label={`${jauge.texte} écoulées ; habituel ${habituelTexte(mode)} ; arrêt à ${borne}`}
        >
          <span className="cmp-rail" />
          <span className="cmp-hab" style={{ left: `${jauge.habituelDebut}%`, width: `${jauge.habituelLargeur}%` }} />
          <span className="cmp-fait" style={{ width: `${jauge.fait}%` }} />
          <span className="cmp-aig" style={{ left: `${jauge.fait}%` }} />
        </div>
        <div className="cmp-grad">
          <N>0:00</N>
          <span>
            habituel <N>{habituelTexte(mode)}</N>
          </span>
          <span>
            arrêt <N>{borne}</N>
          </span>
        </div>
        <Etapes courante={maximum.current} />
        <p className="cmp-etape-t">{etapeTexte(stage)}</p>
        {children}
        {onFermer ? (
          <div className="cmp-act">
            <button type="button" className="cmp-btn cmp-p" onClick={onFermer}>
              <Icone nom="cloche" />
              {notifier ? 'Fermer · me notifier' : 'Fermer'}
            </button>
          </div>
        ) : null}
      </div>
      {file.map((f, i) => (
        <div key={f.id} className="cmp-file">
          <span className="cmp-rang">{i + 2}</span>
          <div>
            {f.question}
            <small>En file · partira après la réponse</small>
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Réponse interrompue (le réseau est là, le serveur a échoué) : message du serveur (déjà sans nom de modèle), étape rompue,
 * Relancer / Reformuler. `etape` : dernière étape atteinte (0 à 3), inconnue si absente : rien n'est dit de ce qui a été compté.
 */
export function Echec({
  message,
  etape,
  onRelancer,
  onReformuler,
  libelleRelancer = 'Relancer l’analyse',
  busy = false
}: {
  message: string;
  etape?: number;
  onRelancer?: () => void;
  onReformuler?: () => void;
  libelleRelancer?: string;
  busy?: boolean;
}) {
  const connue = etape !== undefined && etape >= 0 && etape < ETAPES.length;
  return (
    <div className="cmp-serveur">
      <span className="cmp-srv-ic">
        <Icone nom="serveur" />
      </span>
      <div>
        <b>Réponse interrompue</b>
        {connue ? <small>À l’étape {ETAPES[etape!]}</small> : null}
        <p role="alert" className="cmp-srv-msg">
          {message}
        </p>
        {connue ? <Etapes courante={etape!} rompu mini /> : null}
      </div>
      {onRelancer || onReformuler ? (
        <div className="cmp-srv-act">
          {onRelancer ? (
            <button type="button" className="cmp-btn cmp-s" disabled={busy} onClick={onRelancer}>
              <Icone nom="zero" />
              {libelleRelancer}
            </button>
          ) : null}
          {onReformuler ? (
            <button type="button" className="cmp-btn cmp-g" disabled={busy} onClick={onReformuler}>
              Reformuler
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Hors ligne, ou envoi non confirmé (`job.sendError`) : la question est gardée, le chemin est coupé, elle ne part qu'une fois, sur confirmation.
 * `message` : texte d'alerte (par défaut : pas de réseau). `resume` : ligne du budget (`budgetResume`), omise si inconnue.
 */
export function HorsLigne({
  question,
  message = 'Pas de réseau. Elle part une seule fois, quand tu confirmes.',
  resume,
  onEnvoyer,
  onReformuler,
  libelleEnvoi = 'Envoyer au retour du réseau',
  busy = false
}: {
  question?: string;
  message?: string;
  resume?: string;
  onEnvoyer: () => void;
  onReformuler?: () => void;
  libelleEnvoi?: string;
  busy?: boolean;
}) {
  return (
    <>
      {question ? (
        <div className="cmp-q cmp-q-garde">
          {question}
          <small>
            <Icone nom="telephone" />
            Gardée sur ce téléphone
          </small>
        </div>
      ) : null}
      <div className="cmp-carte cmp-chemin">
        <div className="cmp-noeuds">
          <span className="cmp-nd">
            <span className="cmp-rd">
              <Icone nom="telephone" />
            </span>
            Gardée ici
          </span>
          <span className="cmp-lien" />
          <span className="cmp-coupure">
            <Icone nom="horsligne" />
          </span>
          <span className="cmp-lien cmp-coupe" />
          <span className="cmp-nd cmp-loin">
            <span className="cmp-rd">
              <Icone nom="fil" />
            </span>
            Pas encore partie
          </span>
        </div>
        <h3>Envoi à confirmer</h3>
        <p role="alert">{message}</p>
        <div className="cmp-act cmp-gauche">
          <button type="button" className="cmp-btn cmp-p" disabled={busy} onClick={onEnvoyer}>
            <Icone nom="envoyer" />
            {libelleEnvoi}
          </button>
          {onReformuler ? (
            <button type="button" className="cmp-btn cmp-s" disabled={busy} onClick={onReformuler}>
              <Icone nom="crayon" />
              Reformuler
            </button>
          ) : null}
        </div>
      </div>
      <div className="cmp-garde">
        <Icone nom="verrou" />
        <div>
          Rien n’est perdu : recette, brassin et notes restent ici.
          {resume ? <small>{resume}</small> : null}
        </div>
      </div>
    </>
  );
}

/** Bandeau du pied quand le téléphone n'a pas de réseau. */
export function BandeauHorsLigne() {
  return (
    <p className="cmp-bandeau">
      <Icone nom="horsligne" />
      Hors ligne · une nouvelle question attendra ici
    </p>
  );
}

/** Budget du mois atteint : la question gardée, puis la vue du plafond de port-b (`BrewerBudgetCapView`). */
export function Plafond({ question, onLimits, onLater }: { question?: string; onLimits: () => void; onLater: () => void }) {
  return (
    <>
      {question ? (
        <div className="cmp-q cmp-q-garde">
          {question}
          <small>
            <Icone nom="telephone" />
            Gardée · partira quand tu relèves la limite
          </small>
        </div>
      ) : null}
      <BrewerBudgetCapView onLimits={onLimits} onLater={onLater} />
    </>
  );
}
