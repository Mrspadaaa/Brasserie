import React, { useEffect, useId, useRef } from 'react';
import { Check, BellRing, ArrowLeftRight, VolumeX } from 'lucide-react';
import { phraseRetard } from '../services/brewTimer';
import './brew-appel.css';

/**
 * La carte d'appel du jour de brassage (p2c, « La journée en frise, et le bilan visé », avec les greffes G1 de s2b) :
 * l'ajout dû, en rouge, avec un seul geste évident (« Ajouté · heure »), ses issues (Remplacer, Autre dose, Sauter,
 * Dans 1 min) et l'ajout d'après. Deux surfaces : `BrewAppel` (la carte dans la conduite) et `BrewAppelPlein` (plein écran
 * pendant la sonnerie). Composant sans état métier : tout geste remonte par un rappel, la page écrit.
 *
 * Contrat de la page (I1) :
 *  - un toucher sur « Ajouté » appelle `onAjoute(heureDuToucher)` une seule fois ; la page écrit `additions[id].doneAt` ;
 *  - tant que `ajoute` (= `doneAt`) n'est pas nul, la carte montre « Ajouté · heure » et « Annuler » pendant 10 s, puis appelle `onFini`
 *    (la page cesse alors d'afficher la carte) ; `onAnnule` remet l'ajout à faire (la page efface `doneAt`) : la carte redevient l'appel.
 *    La page garde donc la carte affichée entre `onAjoute` et `onFini`/`onAnnule`, même si l'ajout n'est plus « dû » ;
 *  - `onReporte(1)` : report d'une minute, la page ne coche rien ; `onRemplace`, `onAutreDose`, `onSaute` ouvrent chacun leur geste ;
 *  - `sonneDepuis` : début de la sonnerie (ms), `null` si le son est coupé ou n'a pas encore sonné ; `onCoupeSon` coupe le son, ne coche rien.
 */

/** Fenêtre pendant laquelle un « Ajouté » reste annulable (G1d : « annulable 10 s »). */
export const APPEL_ANNULATION_MS = 10_000;

export interface BrewAppelAjout {
  id: string;
  nom: string;
  /** « 25 g », déjà formatée par la page (dose réelle, unité comprise). */
  dose: string;
  /** Minutes avant la fin de l'ébullition (5 → « 5′ ») ; 0 : à la fin ; `null` : inconnu. */
  avantFinMin: number | null;
  /** Heure prévue, en millisecondes. */
  prevu: number;
}

export interface BrewAppelSuivant {
  /** « Amarillo 43 g ». */
  texte: string;
  /** Heure prévue (ms) ; `null` = inconnue, dite « ? ». */
  heure: number | null;
  /** Ce que dit le plein écran à la fin de la ligne : « coupure du feu ». */
  moment?: string;
}

export interface BrewAppelProps {
  ajout: BrewAppelAjout;
  /** L'heure de la page (ms), pour « il est 16 h 19 » et le retard. */
  maintenant: number;
  sonneDepuis: number | null;
  suivant: BrewAppelSuivant | null;
  /** Heure à laquelle l'ajout a été coché (ms), `null` tant qu'il est à faire. */
  ajoute: number | null;
  onAjoute: (heure: number) => void;
  onAnnule: () => void;
  onFini: () => void;
  onReporte: (minutes: number) => void;
  onRemplace: () => void;
  onAutreDose: () => void;
  onSaute: () => void;
  onCoupeSon: () => void;
}

/** « 16 h 19 » (sans zéro devant l'heure, comme la cuve) ; « ? » si l'heure est inconnue, jamais 0. */
export function heureAppel(at: number | null | undefined): string {
  if (at == null || !Number.isFinite(at)) return '?';
  const d = new Date(at);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}

/** « en retard de 4 min » ; « maintenant » avant la première minute ou si l'échéance n'est pas encore passée. */
function phraseDuRetard(prevu: number, maintenant: number): { court: string; retard: boolean } {
  return phraseRetard(prevu - maintenant) ?? { court: 'maintenant', retard: false };
}

function dansMinutes(heure: number | null, maintenant: number): string | null {
  if (heure == null || !Number.isFinite(heure)) return null;
  const min = Math.ceil((heure - maintenant) / 60000);
  if (min <= 0) return 'maintenant';
  return min <= 60 ? `dans ${min} min` : null;
}

/** Le geste « Ajouté » et sa fenêtre d'annulation, communs à la carte et au plein écran. */
function useAjoute(p: BrewAppelProps) {
  const envoye = useRef(false);
  const fini = useRef(p.onFini);
  fini.current = p.onFini;
  useEffect(() => {
    if (p.ajoute == null) {
      envoye.current = false;
      return;
    }
    envoye.current = true;
    const t = setTimeout(() => fini.current(), APPEL_ANNULATION_MS);
    return () => clearTimeout(t);
  }, [p.ajoute]);
  const toucher = () => {
    if (envoye.current || p.ajoute != null) return; // doigt mouillé : un second toucher ne réécrit pas
    envoye.current = true;
    p.onAjoute(Date.now());
  };
  return { toucher };
}

function AjouteOuAnnule({ p, toucher, bouton }: { p: BrewAppelProps; toucher: () => void; bouton: React.Ref<HTMLButtonElement> }) {
  if (p.ajoute == null)
    return (
      <>
        <button type="button" ref={bouton} className="bap-ok" onClick={toucher}>
          <Check size={28} strokeWidth={2.6} aria-hidden="true" />
          {`Ajouté · ${heureAppel(p.maintenant)}`}
        </button>
        <div className="bap-aide">un toucher, même mouillé · annulable 10 s</div>
      </>
    );
  return (
    <div className="bap-fait-bloc">
      <div className="bap-fait" role="status">
        <Check size={28} strokeWidth={2.6} aria-hidden="true" />
        <span>{`Ajouté · ${heureAppel(p.ajoute)}`}</span>
      </div>
      <button type="button" ref={bouton} className="bap-annule" onClick={p.onAnnule} aria-label={`Annuler l’ajout de ${p.ajout.nom}`}>
        Annuler
        <i className="bap-fenetre" aria-hidden="true" />
      </button>
    </div>
  );
}

function Sub({ ajout, plein, maintenant }: { ajout: BrewAppelAjout; plein: boolean; maintenant: number }) {
  const avant = ajout.avantFinMin;
  const prevu = `prévu à ${heureAppel(ajout.prevu)}`;
  if (plein) return <div className="bap-sub">{avant != null && avant > 0 ? `${avant}′ avant la fin · ${prevu}` : avant === 0 ? `à la fin · ${prevu}` : prevu}</div>;
  const pre = avant != null && avant > 0 ? `${avant}′ · ` : avant === 0 ? 'à la fin · ' : '';
  return <div className="bap-sub">{`${pre}${prevu} · il est ${heureAppel(maintenant)}`}</div>;
}

function Suivant({ suivant, maintenant, plein }: { suivant: BrewAppelSuivant | null; maintenant: number; plein: boolean }) {
  if (!suivant) return null;
  const fin = plein ? suivant.moment ?? dansMinutes(suivant.heure, maintenant) : dansMinutes(suivant.heure, maintenant);
  return (
    <div className="bap-suiv" data-testid="appel-suivant">
      ensuite <b>{suivant.texte}</b>
      {' · '}
      {heureAppel(suivant.heure)}
      {fin ? <>{' · '}<b>{fin}</b></> : null}
    </div>
  );
}

/** La carte rouge dans la conduite (p2c-e2-390). */
export function BrewAppel(p: BrewAppelProps) {
  const { toucher } = useAjoute(p);
  const retard = phraseDuRetard(p.ajout.prevu, p.maintenant);
  const k = retard.retard ? `En retard de ${retard.court.replace('en retard de ', '')}` : 'À faire maintenant';
  return (
    <section className="bap" role="group" aria-label={`Ajout ${retard.retard ? 'en retard' : 'à faire'} : ${p.ajout.nom} ${p.ajout.dose}`} data-booster="appel">
      <div className="bap-k">
        <BellRing size={20} aria-hidden="true" />
        <span>{`${k} · sonne chaque minute`}</span>
      </div>
      {p.sonneDepuis != null && (
        <div className="bap-son">
          <span>{`Sonne depuis ${heureAppel(p.sonneDepuis)}`}</span>
          <button type="button" onClick={p.onCoupeSon}>
            <VolumeX size={20} aria-hidden="true" />
            Couper le son
          </button>
        </div>
      )}
      <div className="bap-tete">
        <div className="bap-nomdose">
          <span className="bap-nom">{p.ajout.nom}</span> <span className="bap-dose bap-m">{p.ajout.dose}</span>
        </div>
        <Sub ajout={p.ajout} plein={false} maintenant={p.maintenant} />
      </div>
      <AjouteOuAnnule p={p} toucher={toucher} bouton={null} />
      <div className="bap-alt bap-rempl">
        <span className="bap-pas">{`Pas de ${p.ajout.nom} ?`}</span>
        <button type="button" onClick={p.onRemplace}>
          <ArrowLeftRight size={20} aria-hidden="true" />
          Remplacer
        </button>
      </div>
      <div className="bap-alt">
        <button type="button" onClick={p.onAutreDose}>Autre dose</button>
        <button type="button" onClick={p.onSaute}>Sauter</button>
        <button type="button" onClick={() => p.onReporte(1)}>Dans 1 min</button>
      </div>
      <Suivant suivant={p.suivant} maintenant={p.maintenant} plein={false} />
    </section>
  );
}

/** L'appel plein écran pendant la sonnerie (p2c-e2-appel-390). La page rend le reste de l'écran inerte (`inert`) tant qu'il est monté. */
export function BrewAppelPlein(p: BrewAppelProps) {
  const { toucher } = useAjoute(p);
  const titre = useId();
  const bouton = useRef<HTMLButtonElement>(null);
  const retard = phraseDuRetard(p.ajout.prevu, p.maintenant);
  useEffect(() => {
    bouton.current?.focus();
  }, [p.ajoute == null]);
  return (
    <div className="bap-plein" role="alertdialog" aria-modal="true" aria-labelledby={titre} data-booster="appel-plein-ecran">
      <div className="bap-in">
        <div className="bap-k">
          <BellRing size={20} aria-hidden="true" />
          <span>{`Il est ${heureAppel(p.maintenant)} · ${retard.court}`}</span>
        </div>
        <div className="bap-nom" id={titre}>{p.ajout.nom}</div>
        <div className="bap-dose bap-m">{p.ajout.dose}</div>
        <Sub ajout={p.ajout} plein maintenant={p.maintenant} />
        <AjouteOuAnnule p={p} toucher={toucher} bouton={bouton} />
        <div className="bap-alt bap-rempl">
          <span className="bap-pas">{`Pas de ${p.ajout.nom} ?`}</span>
          <button type="button" onClick={p.onRemplace}>
            <ArrowLeftRight size={20} aria-hidden="true" />
            Remplacer
          </button>
        </div>
        <div className="bap-alt">
          <button type="button" onClick={() => p.onReporte(1)}>Rappel dans 1 min</button>
        </div>
        <Suivant suivant={p.suivant} maintenant={p.maintenant} plein />
      </div>
    </div>
  );
}
