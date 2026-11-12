import React, { useId } from 'react';
import { insecables } from './brewNombres';
import { Clock, Thermometer } from 'lucide-react';
import type { ReadingKind } from '../domain/brewDay';
import { bornesCurseur, formatCurseur, pasCurseur, poserSurPas } from '../domain/measureSlider';
import { ecartCible, MeasureSlider, type MeasureScale } from './BrewDayMeasurements';
import type { OptionCorrection, Zone } from '../domain/brewDayCalculs';
import './brew-maintenant.css';

/**
 * La carte « Maintenant » de p2c (« La journée en frise, et le bilan visé »), portée telle quelle : une seule carte, dans la conduite,
 * qui dit ce qui est dû à cet instant. Deux variantes :
 *  - `mesure` (E1) : un relevé dû, la grande valeur « ? », le curseur de la feuille Mesurer posé dans la carte (G4), ±pas, les bandes
 *    « sous · dans · sur » avec leur « Et donc » (la bande lue s'allume), Enregistrer ;
 *  - `paire` (E3) : volume et densité avant ébullition hors cible, et les trois choix qui règlent l'horloge (G4b).
 * Les chiffres arrivent calculés (A1 à A3) ; la carte n'en calcule aucun. Une valeur absente s'écrit « ? », jamais 0.
 *
 * Contrats A2 (PLAN.md) : `Zone` et `OptionCorrection` ont la forme de `brewDayCalculs.ts`.
 */
export type { Zone, OptionCorrection };

export interface MaintenantMesure {
  variante: 'mesure';
  kind: ReadingKind;
  scale: MeasureScale;
  /** « Maische à cœur » */
  titre: string;
  /** « cible 67 °C · palier lancé à 13 h 05 » */
  sousTitre?: string;
  /** Entête avant l'enregistrement ; défaut « Maintenant · relevé dû ». */
  entete?: string;
  /** « °C », « L » ; vide pour une densité. */
  unite: string;
  /** La valeur posée au curseur, `null` tant que rien n'est posé. */
  valeur: number | null;
  /** Où le pouce attend (la cible, ou le dernier relevé) ; un toucher sur le pouce pose cette valeur. */
  depart: number;
  onPose: (v: number) => void;
  onEnregistrer: (v: number) => void;
  /** Les bandes et leur « Et donc » (A2 `zonesDeCible`) ; sans phrase, pas de bloc. */
  zones?: Zone[];
  /** « ≈ calculé par l'app · … » */
  note?: string;
  /** Après l'enregistrement : l'entête devient « ✓ Maische relevée à 13 h 05 » et le verdict « Enregistré · prochain relevé : … ». */
  enregistre?: { entete: string; verdict: string } | null;
}

export interface MaintenantPaire {
  variante: 'paire';
  /** « 15 h 05 » : l'heure du relevé. */
  heure: string;
  volumeL: number | null;
  volumeCibleL: number | null;
  densite: number | null;
  densiteCible: number | null;
  volumeHors?: boolean;
  densiteHors?: boolean;
  options: OptionCorrection[];
  choisi: OptionCorrection['id'] | null;
  onChoix: (id: OptionCorrection['id']) => void;
  note?: string;
  /** Les trois choix chiffrés n'existent pas (pas de référence de température, d'évaporation ou d'OG) : une cible inconnue s'écrit « cible ? ». */
  sansCible?: boolean;
}

export type MaintenantProps = MaintenantMesure | MaintenantPaire;

/** La bande de la valeur lue : la borne est dans la cible (même tolérance que la feuille Mesurer). `null` sans valeur ou sans cible. */
export function zoneDeValeur(scale: MeasureScale, valeur: number | null): Zone['borne'] | null {
  if (valeur == null || !Number.isFinite(valeur) || !scale.cible) return null;
  const ecart = ecartCible(scale, valeur);
  return ecart == null ? 'dans' : ecart > 0 ? 'sur' : 'sous';
}

const fr = (n: number, d: number) => n.toFixed(d).replace('.', ',');

function Mesure(p: MaintenantMesure) {
  const idTitre = useId();
  const { kind, scale, valeur, depart, onPose } = p;
  const pose = valeur != null;
  const zone = zoneDeValeur(scale, valeur);
  const { pas } = pasCurseur(kind);
  const pasTexte = formatCurseur(kind, pas);
  const bornes = bornesCurseur(kind, scale.min, scale.max);
  const bouger = (sens: -1 | 1) => onPose(poserSurPas(kind, (valeur ?? depart) + sens * pas, bornes.min, bornes.max));
  const fait = p.enregistre != null;
  const zones = p.zones ?? [];
  const avecDonc = zones.some((z) => z.etDonc);
  const verdict = fait
    ? p.enregistre!.verdict
    : !pose
      ? `Toucher le pouce pose ${formatCurseur(kind, depart)} · ou la piste, puis ±${pasTexte}`
      : zone === 'dans'
        ? '✓ dans la cible · Enregistrer'
        : zone === 'sous'
          ? '▼ hors cible : voir la bande en couleur'
          : zone === 'sur'
            ? '▲ hors cible : voir la bande en couleur'
            : '';
  return (
    <section className="bm-now" data-fait={fait ? '' : undefined} aria-labelledby={idTitre}>
      <div className="bm-k">
        <Clock size={16} aria-hidden="true" />
        <span>{fait ? p.enregistre!.entete : (p.entete ?? 'Maintenant · relevé dû')}</span>
      </div>
      <div className="bm-hd">
        <div>
          <div className="bm-nm" id={idTitre}>{p.titre}</div>
          {p.sousTitre && <div className="bm-sub">{p.sousTitre}</div>}
        </div>
        <span className="bm-big" data-testid="maintenant-valeur" data-vide={pose ? undefined : ''} data-hors={zone === 'sous' || zone === 'sur' ? '' : undefined}>
          {pose ? formatCurseur(kind, valeur) : '?'}
          {p.unite && <small>{p.unite}</small>}
        </span>
      </div>
      <MeasureSlider scale={scale} kind={kind} value={valeur} depart={depart} label={p.titre} onPose={onPose} />
      {verdict && (
        <p className="bm-verd" aria-live="polite" data-ton={fait ? 'fait' : !pose ? 'muet' : zone === 'dans' ? 'ok' : 'hors'}>{verdict}</p>
      )}
      {avecDonc && (
        <div className="bm-donc">
          <div className="bm-t">Et donc, selon ce que tu lis</div>
          {zones.map((z) => (
            <div key={z.borne} className="bm-b" data-borne={z.borne} aria-current={zone === z.borne ? 'true' : undefined}>
              <span className="bm-s bz-m">{z.libelle}</span>
              <span>{z.etDonc ?? ''}</span>
            </div>
          ))}
          {p.note && <div className="bm-nb">{p.note}</div>}
        </div>
      )}
      {!avecDonc && p.note && <div className="bm-nb">{p.note}</div>}
      {!fait && (
        <div className="bm-sv">
          <span className="bm-pm" data-booster="pas">
            {([-1, 1] as const).map((sens) => (
              <button type="button" key={sens} className="bz-m" aria-label={`${sens < 0 ? 'moins' : 'plus'} ${pasTexte}`} onClick={() => bouger(sens)}>
                {sens < 0 ? '−' : '+'}{pasTexte}
              </button>
            ))}
          </span>
          <button type="button" className="bm-act" disabled={!pose} onClick={() => { if (valeur != null) p.onEnregistrer(valeur); }}>
            Enregistrer
          </button>
        </div>
      )}
    </section>
  );
}

function Paire(p: MaintenantPaire) {
  const idTitre = useId();
  const hors = !!(p.volumeHors || p.densiteHors);
  return (
    <section className="bm-now" aria-labelledby={idTitre}>
      <div className="bm-k">
        <Thermometer size={16} aria-hidden="true" />
        <span id={idTitre}>Maintenant · relevé à {p.heure}{hors ? ' · hors cible' : ''}</span>
      </div>
      <div className="bm-pair">
        <div>
          <span className="bm-pnm">Volume</span>
          <b className="bm-big" data-testid="maintenant-volume" data-vide={p.volumeL == null ? '' : undefined} data-hors={p.volumeHors ? '' : undefined}>
            {p.volumeL == null ? '?' : fr(p.volumeL, 1)}<small>L</small>
          </b>
          {p.volumeCibleL != null ? <span className="bm-c">cible {fr(p.volumeCibleL, 1)} L</span> : p.sansCible && <span className="bm-c">cible ?</span>}
        </div>
        <div>
          <span className="bm-pnm">Densité</span>
          <b className="bm-big" data-testid="maintenant-densite" data-vide={p.densite == null ? '' : undefined} data-hors={p.densiteHors ? '' : undefined}>
            {p.densite == null ? '?' : fr(p.densite, 3)}
          </b>
          {p.densiteCible != null ? <span className="bm-c">cible {fr(p.densiteCible, 3)}</span> : p.sansCible && <span className="bm-c">cible ?</span>}
        </div>
      </div>
      {(p.options.length > 0 || p.note) && (
        <div className="bm-donc">
          {p.options.length > 0 && <div className="bm-t">{p.sansCible ? 'Et donc, ce qui reste possible' : 'Et donc, choisis : l’horloge suit'}</div>}
          {p.options.map((o) => (
            <button type="button" key={o.id} className="bm-b bm-ch" data-choix={o.id} aria-pressed={p.choisi === o.id} onClick={() => p.onChoix(o.id)}>
              <span className="bm-s">{o.titre}</span>
              <span>{insecables(o.detail)}</span>
            </button>
          ))}
          {p.note && <div className="bm-nb">{p.note}</div>}
        </div>
      )}
    </section>
  );
}

export function BrewMaintenant(props: MaintenantProps) {
  return props.variante === 'mesure' ? <Mesure {...props} /> : <Paire {...props} />;
}
