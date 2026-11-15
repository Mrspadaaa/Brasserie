/*
 * Réponse du compagnon (maquette p2a, cadres `reponse` et `urgent`) : Question, Verdict, Urgent, Controle, Pourquoi, Suite.
 * Props : Verdict {advice} ; Urgent {advice} ; Controle {watch, onKeep?, gardee?, disabled?} ; Pourquoi {turn, finance?} ;
 * Suite {question, onChoisir, disabled?}. Présentatif : aucune donnée inventée (pas de geste daté, pas de jalon, pas de rappel).
 */
import type { ReactNode } from 'react';
import type { BrewerAdvice, BrewerTurn } from '../../../functions/src/companionTypes';
import { feuDuNiveau, libellesRelecture, motifRelecture } from './derive';
import { Feu, Icone } from './parts';

/** La question posée, en bulle. `children` : le texte tel qu'il a été envoyé. */
export function Question({ children }: { children: ReactNode }) {
  return <div className="cmp-q">{children}</div>;
}

/** Verdict : feu du niveau, titre, une seule ligne « À faire ». Un niveau « urgent » prend la dalle rouge. */
export function Verdict({ advice }: { advice: Pick<BrewerAdvice, 'level' | 'summary' | 'action'> }) {
  const feu = feuDuNiveau(advice.level);
  if (feu.niveau === 'urgent') return <Urgent advice={advice} />;
  const info = feu.niveau === 'info';
  return (
    <div className={`cmp-verdict ${info ? 'cmp-inf' : 'cmp-att'}`}>
      <Feu feu={feu} />
      <div>
        <span className={`cmp-niv${info ? ' cmp-niv-i' : ''}`}>
          {info ? null : <Icone nom="alerte" />}
          {feu.libelle}
        </span>
        <h3>{advice.summary}</h3>
        {advice.action ? (
          <p className="cmp-geste">
            <span className="cmp-quand">À faire</span>
            <span>{advice.action}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Dalle rouge : le titre lisible de loin, puis l'unique geste dans sa carte. Rien d'autre (ni minuteur ni relevés : pas de donnée). */
export function Urgent({ advice }: { advice: Pick<BrewerAdvice, 'summary' | 'action'> }) {
  return (
    <>
      <div className="cmp-urg" role="alert">
        <span className="cmp-urg-niv">
          <Icone nom="alerte" />
          Urgent
        </span>
        <h3>{advice.summary}</h3>
      </div>
      {advice.action ? (
        <div className="cmp-carte cmp-urg-geste">
          <span className="cmp-urg-ic">
            <Icone nom="fleche" />
          </span>
          <p>{advice.action}</p>
        </div>
      ) : null}
    </>
  );
}

/** Ce qu'il faut surveiller (`advice.watch`) et, si l'écran le permet, le geste « Au journal ». `gardee` : déjà ajouté. */
export function Controle({
  watch,
  onKeep,
  gardee = false,
  disabled = false
}: {
  watch: string;
  onKeep?: () => void;
  gardee?: boolean;
  disabled?: boolean;
}) {
  if (!watch && !onKeep) return null;
  return (
    <div className="cmp-carte cmp-ctl">
      <span className="cmp-lbl1 cmp-ctl-t">
        <Icone nom="horloge" />À surveiller
      </span>
      {watch ? <span className="cmp-ctl-t">{watch}</span> : null}
      {onKeep ? (
        <span className="cmp-ctl-act">
          <button type="button" className="cmp-btn cmp-s" disabled={gardee || disabled} onClick={onKeep}>
            <Icone nom="journal" />
            {gardee ? 'Ajouté au journal' : 'Au journal'}
          </button>
        </span>
      ) : null}
    </div>
  );
}

type TourPourquoi = Pick<BrewerTurn, 'advice' | 'evidence' | 'reviewed' | 'reviewModel' | 'reviewReason' | 'contextLabel' | 'mode'>;

/** « Pourquoi » : en repos, trois puces (relu, calculs, sources) ; au toucher, la raison, le contexte, les calculs et les liens https. */
export function Pourquoi({ turn, finance = false }: { turn: TourPourquoi; finance?: boolean }) {
  const relecture = libellesRelecture(turn);
  const secondePasse = !!turn.reviewModel;
  return (
    <details className="cmp-pourquoi-d">
      <summary className="cmp-plis">
        <Icone nom="bas" />
        <b>Pourquoi</b>
        {relecture.relu ? (
          <span>
            <Icone nom="relu" />
            {relecture.relu}
          </span>
        ) : null}
        {relecture.calculs ? (
          <span>
            <Icone nom="calcul" />
            calculs refaits
          </span>
        ) : null}
        {relecture.sources > 0 ? (
          <span>
            <Icone nom="livre" />
            <span className="cmp-n">{relecture.sources}</span> source{relecture.sources > 1 ? 's' : ''}
          </span>
        ) : null}
      </summary>
      <div className="cmp-carte cmp-detail">
        {turn.advice.why ? <p>{turn.advice.why}</p> : null}
        <small>{turn.contextLabel}</small>
        {turn.mode === 'fast' ? <small>Mode rapide · calculs et relecture conservés.</small> : null}
        {secondePasse ? <small>Relecture : {motifRelecture(turn.reviewReason)}.</small> : null}
        {turn.reviewed ? (
          <small>
            {finance
              ? 'Seconde relecture IA. Vérifie les hypothèses et les montants avant toute décision.'
              : 'Seconde relecture IA. Les estimations restent à confirmer à la cuve.'}
          </small>
        ) : null}
        {turn.evidence.map((e) => {
          const liens = (e.sources ?? []).filter((s) => /^https:\/\//.test(s.url));
          return (
            <div key={e.id} className="cmp-detail">
              <strong>
                <Icone nom="calcul" /> {e.label}
              </strong>
              {e.facts.map((f, i) => (
                <p key={i}>{f}</p>
              ))}
              {e.limits.map((l, i) => (
                <small key={i}>{l}</small>
              ))}
              {liens.length > 0 ? (
                <span className="cmp-sources">
                  {liens.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                      <Icone nom="sortie" />
                    </a>
                  ))}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
}

/** La suite proposée (`advice.question`), en puce pleine : un toucher la met dans la saisie. */
export function Suite({ question, onChoisir, disabled = false }: { question: string; onChoisir: (q: string) => void; disabled?: boolean }) {
  if (!question) return null;
  return (
    <button type="button" className="cmp-chip cmp-suite" disabled={disabled} onClick={() => onChoisir(question)}>
      <Icone nom="fleche" />
      <span>{question}</span>
    </button>
  );
}
