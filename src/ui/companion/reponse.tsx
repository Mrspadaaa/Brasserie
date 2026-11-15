/*
 * Réponse du compagnon (maquette p2a, cadres `reponse`, `urgent` et `bureau`) : Question, Verdict, Urgent, Controle, Pourquoi, Suite.
 * Props : Verdict {advice, viseeC?} ; Urgent {advice, viseeC?} ; Controle {watch, onKeep?, gardee?, disabled?} ; Pourquoi {turn, finance?} ;
 * Suite {question, onChoisir, disabled?}. Tout ce qui est daté ou chiffré vient d'un texte de la réponse (action, watch, summary) ou d'une
 * prop optionnelle du chat ; rien n'est inventé : sans repère, la pièce ne se dessine pas. Le CSS propre à ces cadres est `reponse.css`.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Timer } from 'lucide-react';
import type { BrewerAdvice, BrewerTurn } from '../../../functions/src/companionTypes';
import { NBSP, feuDuNiveau, libellesRelecture, motifRelecture, nombreTexte } from './derive';
import type { NomIcone } from './icones';
import { Feu, Icone, M } from './parts';
import './reponse.css';

// ---------- Règles pures (testées) ----------

/** Typographie française : espace insécable avant « : ; ? ! » et entre un nombre et son unité. */
export function typoFr(texte: string): string {
  return texte
    .replace(/[ \t]+([:;?!])/g, (_m, p: string) => NBSP + p)
    .replace(/(\d) (°C|°|%|g|kg|L|mL|min|h|j|jours?|CHF|EBC|IBU|ppm)(?![\p{L}\d])/gu, (_m, n: string, u: string) => `${n}${NBSP}${u}`);
}

const majuscule = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const finDePhrase = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`);

export interface Geste {
  /** Le moment lu dans le texte (« Ce soir », « J+9 ») ; « À faire » à défaut sur la première ligne ; vide sur les suivantes. */
  quand: string;
  texte: string;
}
const MOMENT_DEBUT = /^(ce soir|ce matin|aujourd['’]hui|auj\.|demain matin|demain|maintenant|tout de suite|[àa]\s+J\+\d+|J\+\d+)\b[\s,:–-]*/i;
const MOMENT_LIBRE = /\s*\b(ce soir|ce matin|demain matin|demain|maintenant|tout de suite)\b/i;
const JOUR_LIBRE = /\s*\bJ\+(\d+)\b/;

/**
 * `advice.action` en gestes datés : une ligne par proposition (séparées par « ; » ou une fin de phrase). Le moment vient du texte
 * même (début, « ce soir » ou « J+n » dans la phrase) : le schéma de réponse n'a pas de champ `quand`, donc sans mot de moment, la
 * première ligne se dit « À faire » et rien d'autre n'est inventé.
 */
export function gestesDatés(action: string): Geste[] {
  const parties = action
    .split(/\s*;\s+|(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/)
    .map((p) => p.trim().replace(/[.;]+$/, ''))
    .filter(Boolean);
  const gestes = parties.map((p, i): Geste => {
    const debut = MOMENT_DEBUT.exec(p);
    if (debut) {
      const brut = debut[1].replace(/^[àa]\s+/i, '');
      const quand = /^auj\.$/i.test(brut) ? 'Auj.' : /^j\+/i.test(brut) ? brut.toUpperCase() : majuscule(brut.toLowerCase());
      return { quand, texte: finDePhrase(majuscule(p.slice(debut[0].length))) };
    }
    const libre = MOMENT_LIBRE.exec(p);
    if (libre) return { quand: majuscule(libre[1].toLowerCase()), texte: finDePhrase(majuscule(p.replace(MOMENT_LIBRE, '').replace(/\s+([,.])/g, '$1').trim())) };
    const jour = JOUR_LIBRE.exec(p);
    if (jour) {
      // Le repère sort du texte seulement s'il se détache (« Mosaic J+9, … », « à J+9 ») ; au milieu d'un groupe (« le Citra de J+2 se fait »), il reste.
      const detache = /\s*\b(?:[àa]|au|d[èe]s|vers)\s+J\+\d+\b|\s*\bJ\+\d+\b(?=\s*[,:]|$)/i;
      const texte = detache.test(p) ? p.replace(detache, '').replace(/\s+([,.:])/g, '$1').trim() : p;
      return { quand: `J+${jour[1]}`, texte: finDePhrase(majuscule(texte)) };
    }
    return { quand: i === 0 ? 'À faire' : '', texte: finDePhrase(majuscule(p)) };
  });
  return gestes.length ? gestes : [];
}

/** Rythme d'un suivi lu dans un texte : « toutes les 30 min pendant 2 h » → { intervalleMin: 30, dureeMin: 120 }. */
export function rythmeDe(texte: string | undefined): { intervalleMin: number; dureeMin?: number } | null {
  if (!texte) return null;
  const minutes = (n: string, u: string) => Number(n.replace(',', '.')) * (/^h/i.test(u) ? 60 : 1);
  const chaque = /toutes les\s+(\d+(?:[.,]\d+)?)\s*(min(?:ute)?s?|h(?:eures?)?)\b/i.exec(texte);
  if (!chaque) return null;
  const intervalleMin = minutes(chaque[1], chaque[2]);
  if (!(intervalleMin > 0)) return null;
  const pendant = /pendant\s+(\d+(?:[.,]\d+)?)\s*(min(?:ute)?s?|h(?:eures?)?)\b/i.exec(texte);
  const dureeMin = pendant ? minutes(pendant[1], pendant[2]) : undefined;
  return { intervalleMin, ...(dureeMin && dureeMin > 0 ? { dureeMin } : {}) };
}

const dureeCourte = (min: number): string => (min < 60 ? `${nombreTexte(min)}${NBSP}min` : `${nombreTexte(min / 60)}${NBSP}h`);

/** Créneaux de relevé : « maintenant », puis un par intervalle tant qu'on est avant la durée (sans durée connue : le premier seul). */
export function creneauxReleves(r: { intervalleMin: number; dureeMin?: number }): string[] {
  const fin = r.dureeMin ?? r.intervalleMin * 2;
  const creneaux = ['maintenant'];
  for (let t = r.intervalleMin; t < fin && creneaux.length < 6; t += r.intervalleMin) creneaux.push(`+${dureeCourte(t)}`);
  return creneaux;
}

/** « Goût à J+10, avant la garde : … » → { jalon: 'J+10', texte: 'Goût avant la garde : …' } ; sans « J+n » dans le texte, pas de jalon. */
export function jalonDe(watch: string): { jalon: string | null; texte: string } {
  const m = /\bJ\+(\d+)\b/.exec(watch);
  if (!m) return { jalon: null, texte: watch };
  let texte = watch.replace(/\s+(?:à|au|vers|dès)\s+J\+\d+\s*,?/i, '');
  if (texte === watch) texte = watch.replace(/^\s*J\+\d+\s*[:,–-]?\s*/, '');
  if (texte === watch) return { jalon: `J+${m[1]}`, texte: watch };
  return { jalon: `J+${m[1]}`, texte: majuscule(texte.trim()) };
}

/** Premier nombre suivi de « °C » dans un texte (« dépasse 24 °C » → 24) ; `null` si aucun. */
export function degreDe(texte: string): number | null {
  const m = /(-?\d+(?:[.,]\d+)?)\s*°\s*C/i.exec(texte);
  return m ? Number(m[1].replace(',', '.')) : null;
}

/** Position de l'échelle du thermomètre : 12 °C de large, la visée 3 °C au-dessus du bas ; sans visée, la mesure aux deux tiers. */
export function echelleThermo(mesure: number, visee?: number): { bas: number; haut: number; pos: (v: number) => number } {
  const bas = visee !== undefined ? visee - 3 : mesure - 8;
  const haut = Math.max(bas + 12, mesure + 2);
  return { bas, haut, pos: (v) => Math.min(100, Math.max(0, ((v - bas) / (haut - bas)) * 100)) };
}

/** Icône du geste urgent, d'après ce que dit l'action. */
export function iconeAction(action: string): NomIcone {
  if (/glycol|refroid|froid|frigo|r[ée]frig/i.test(action)) return 'flocon';
  if (/pression|purge|soupape|d[ée]gaz/i.test(action)) return 'pression';
  if (/temp[ée]rature|chauff/i.test(action)) return 'thermo';
  return 'outil';
}

/** Libellé du bouton de rappel : « C'est ouvert » après « Ouvre… », « C'est fait » sinon. */
export function verbeFait(action: string): string {
  if (/^\s*ouvre/i.test(action)) return 'C’est ouvert';
  if (/^\s*ferme/i.test(action)) return 'C’est fermé';
  return 'C’est fait';
}

// ---------- Cadres ----------

/** La question posée, en bulle. `children` : le texte tel qu'il a été envoyé. */
export function Question({ children }: { children: ReactNode }) {
  return <div className="cmp-q">{children}</div>;
}

/** Verdict : feu du niveau, titre, une ligne par geste daté. Un niveau « urgent » prend la dalle rouge. */
export function Verdict({
  advice,
  viseeC
}: {
  advice: Pick<BrewerAdvice, 'level' | 'summary' | 'action'> & Partial<Pick<BrewerAdvice, 'watch'>>;
  /** Température visée de la recette (°C), si le chat la connaît : repère du thermomètre de l'urgence. */
  viseeC?: number;
}) {
  const feu = feuDuNiveau(advice.level);
  if (feu.niveau === 'urgent') return <Urgent advice={advice} viseeC={viseeC} />;
  const info = feu.niveau === 'info';
  const gestes = gestesDatés(advice.action);
  return (
    <div className={`cmp-verdict ${info ? 'cmp-inf' : 'cmp-att'}`}>
      <Feu feu={feu} />
      <div>
        <span className={`cmp-niv${info ? ' cmp-niv-i' : ''}`}>
          {info ? null : <Icone nom="alerte" />}
          {feu.libelle}
        </span>
        <h3>{typoFr(advice.summary)}</h3>
        {gestes.map((g, i) => (
          <p key={i} className="cmp-geste">
            <span className="cmp-quand" aria-hidden={g.quand ? undefined : true}>
              {g.quand}
            </span>
            <span>{typoFr(g.texte)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function Thermometre({ mesure, visee }: { mesure: number; visee?: number }) {
  const { pos } = echelleThermo(mesure, visee);
  return (
    <>
      <div
        className="cmp-thermo"
        role="img"
        aria-label={`Au-dessus de ${nombreTexte(mesure)} °C${visee !== undefined ? ` ; visée ${nombreTexte(visee)} °C` : ''}`}
      >
        <span className="cmp-th-rail" />
        {visee !== undefined ? <span className="cmp-th-vise" style={{ left: `${pos(visee)}%` }} /> : null}
        <span className="cmp-th-rouge" style={{ left: `${pos(mesure)}%` }} />
        <span className="cmp-th-val" style={{ left: `${pos(mesure)}%` }} />
      </div>
      <div className="cmp-th-grad" aria-hidden="true">
        {visee !== undefined ? (
          <span style={{ left: `${pos(visee)}%` }}>
            visée <M n={nombreTexte(visee)} u="°C" />
          </span>
        ) : null}
        <span style={{ left: `${pos(mesure)}%` }}>
          <M n={nombreTexte(mesure)} u="°C" />
        </span>
      </div>
    </>
  );
}

/** Minuteurs de rappel armés, par réponse : ils survivent à la fermeture de la feuille, pas au rechargement de la page. */
const MINUTEURS = new Map<string, number>();

/** Bouton de rappel local : l'écran seul le porte (l'app n'a pas de notification programmée) ; arrivé à l'échéance, il le dit. */
function Rappel({ cle, minutes, verbe }: { cle: string; minutes: number; verbe: string }) {
  const [fin, setFin] = useState<number | undefined>(() => MINUTEURS.get(cle));
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    if (!fin) return;
    setMaintenant(Date.now());
    const id = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [fin]);
  const arme = () => {
    const f = Date.now() + minutes * 60000;
    MINUTEURS.set(cle, f);
    setFin(f);
  };
  const reste = fin ? Math.max(0, Math.ceil((fin - maintenant) / 1000)) : 0;
  const echu = !!fin && reste === 0;
  const compteur = `${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, '0')}`;
  return (
    <button type="button" className="cmp-gros" onClick={arme} aria-live={fin ? 'polite' : undefined}>
      <Timer className="cmp-i" aria-hidden="true" />
      {!fin ? (
        <span>
          {verbe} · rappel dans <M n={nombreTexte(minutes)} u="min" />
        </span>
      ) : echu ? (
        <span>
          Relève la température · puis rappel dans <M n={nombreTexte(minutes)} u="min" />
        </span>
      ) : (
        <span>
          Rappel dans <span className="cmp-n">{compteur}</span> · toucher pour repartir
        </span>
      )}
    </button>
  );
}

/** Dalle rouge : le titre lisible de loin, le thermomètre (mesure lue dans le titre), l'unique geste, puis le rappel local. */
export function Urgent({
  advice,
  viseeC
}: {
  advice: Pick<BrewerAdvice, 'summary' | 'action'> & Partial<Pick<BrewerAdvice, 'watch'>>;
  viseeC?: number;
}) {
  const mesure = degreDe(advice.summary);
  const rythme = rythmeDe(advice.action) ?? rythmeDe(advice.watch);
  return (
    <>
      <div className="cmp-urg" role="alert">
        <span className="cmp-urg-niv">
          <Icone nom="alerte" />
          Urgent
        </span>
        <h3>{typoFr(advice.summary)}</h3>
        {mesure !== null ? <Thermometre mesure={mesure} visee={viseeC} /> : null}
      </div>
      {advice.action ? (
        <div className="cmp-carte cmp-urg-geste">
          <span className="cmp-urg-ic">
            <Icone nom={iconeAction(advice.action)} />
          </span>
          <p>{typoFr(advice.action)}</p>
        </div>
      ) : null}
      {rythme ? <Rappel cle={`${advice.summary}|${advice.action}`} minutes={rythme.intervalleMin} verbe={verbeFait(advice.action)} /> : null}
    </>
  );
}

/**
 * Le prochain contrôle (`advice.watch`) : une pastille (le jalon « J+10 » ou le rythme « 30 min » lu dans le texte), la phrase sur la
 * même ligne, les créneaux d'un suivi régulier, et si l'écran le permet le geste « Au journal ». `gardee` : déjà ajouté.
 */
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
  const rythme = rythmeDe(watch);
  const { jalon, texte } = rythme ? { jalon: dureeCourte(rythme.intervalleMin), texte: watch } : jalonDe(watch);
  const creneaux = rythme ? creneauxReleves(rythme) : [];
  return (
    <div className="cmp-carte cmp-ctl">
      {watch ? (
        <>
          <span className="cmp-jalon">
            <Icone nom="horloge" />
            {jalon}
          </span>
          <span className="cmp-ctl-t">{typoFr(texte)}</span>
        </>
      ) : null}
      {creneaux.length ? (
        <div className="cmp-releves" aria-label="Relevés à prévoir">
          {creneaux.map((c, i) => (
            <i key={c} className={i === 0 ? 'cmp-rl-on' : undefined}>
              {c}
            </i>
          ))}
        </div>
      ) : null}
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

/** Vrai au bureau (≥ 1024 px) : le « Pourquoi » s'y montre déplié, comme dans le cadre `bureau` de la maquette. */
function useBureau(): boolean {
  const requete = '(min-width: 1024px)';
  const lire = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(requete).matches;
  const [bureau, setBureau] = useState(lire);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const m = window.matchMedia(requete);
    const maj = () => setBureau(m.matches);
    maj();
    m.addEventListener?.('change', maj);
    return () => m.removeEventListener?.('change', maj);
  }, []);
  return bureau;
}

/** « Pourquoi » : en repos, trois puces (relu, calculs, sources) ; au toucher, la raison, le contexte, les calculs et les liens https. */
export function Pourquoi({ turn, finance = false }: { turn: TourPourquoi; finance?: boolean }) {
  const relecture = libellesRelecture(turn);
  const secondePasse = !!turn.reviewModel;
  const bureau = useBureau();
  const marques = (
    <>
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
    </>
  );
  const detail = (avecRaison: boolean) => (
    <div className="cmp-carte cmp-detail">
      {avecRaison && turn.advice.why ? <p>{typoFr(turn.advice.why)}</p> : null}
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
  );
  if (bureau) {
    return (
      <div className="cmp-carte cmp-pourquoi">
        <span className="cmp-lbl1">
          <Icone nom="bas" />
          Pourquoi
        </span>
        {turn.advice.why ? <p>{typoFr(turn.advice.why)}</p> : null}
        <details className="cmp-pourquoi-d">
          <summary className="cmp-plis cmp-plis-in">
            <Icone nom="bas" />
            <b>Détails</b>
            {marques}
          </summary>
          {detail(false)}
        </details>
      </div>
    );
  }
  return (
    <details className="cmp-pourquoi-d">
      <summary className="cmp-plis">
        <Icone nom="bas" />
        <b>Pourquoi</b>
        {marques}
      </summary>
      {detail(true)}
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
