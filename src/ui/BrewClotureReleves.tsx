import React, { useEffect, useId, useState } from 'react';
import { Check, ChevronDown, ChevronUp, CircleHelp, Pencil, TriangleAlert } from 'lucide-react';
import type { BrewDayStep, RecipeSnapshot } from '../types';
import { parseReading, READING, refroidiParDefaut } from '../domain/brewDay';
import { departCurseur, formatCurseur, pasCurseur } from '../domain/measureSlider';
import { raisonMesure } from '../domain/brewMeasures';
import { Input } from './Input';
import { ecartCible, MeasureSlider, measureScale } from './BrewDayMeasurements';

/**
 * 3C (p3, page v3, choisi le 11.11) : la fenêtre « Confirmer l'ajout de levure ? » porte les deux relevés qui font l'OG et le volume,
 * avec les gestes de la feuille Mesurer (valeur à 28 px et crayon, pas fins, case d'étalonnage, curseur, écart à la cible, Pourquoi maintenant).
 * Une valeur non posée reste `null` (« ? ») : jamais 0. Le brouillon est écrit au journal à la confirmation, par la page.
 */
export interface ClotureReleves {
  densite: number | null;
  densiteRefroidie: boolean;
  volume: number | null;
  volumeRefroidi: boolean;
}
export const CLOTURE_VIDE: ClotureReleves = { densite: null, densiteRefroidie: refroidiParDefaut('densite', 'ensemencement'), volume: null, volumeRefroidi: false };

function Bloc({ kind, titre, quoi, step, recipe, value, refroidi, onValue, onRefroidi }: {
  kind: 'densite' | 'volume';
  titre: string;
  quoi: string;
  step: BrewDayStep;
  recipe?: RecipeSnapshot;
  value: number | null;
  refroidi: boolean;
  onValue: (v: number | null) => void;
  onRefroidi: (v: boolean) => void;
}) {
  const champId = useId();
  const [champ, setChamp] = useState(false);
  const [raw, setRaw] = useState(() => (value != null ? formatCurseur(kind, value) : ''));
  // Une valeur qui change d'ailleurs (relevé déjà au journal, repris à l'ouverture) remet le texte du champ d'accord.
  useEffect(() => {
    if (parseReading(raw, kind) !== value) setRaw(value != null ? formatCurseur(kind, value) : '');
  }, [value]);
  const incomplete = /[.,]$/.test(raw.trim());
  // Une seule source de cible et d'écart (n° 16 de a1) : le volume au fermenteur a la bande de la feuille Mesurer (cible ± 5 %).
  const scale = measureScale(kind, step, recipe, value);
  const depart = departCurseur(kind, scale, null);
  const pas = pasCurseur(kind).pas;
  const pasTexte = String(pas).replace('.', ',');
  const unite = READING[kind].unit;
  const poser = (v: number) => {
    const n = parseReading(formatCurseur(kind, v), kind) ?? v;
    setRaw(formatCurseur(kind, n));
    onValue(n);
  };
  const ecart = value != null ? ecartCible(scale, value) : null;
  const cibleTexte = scale.cible ? `${scale.fmt(scale.bandMin)}–${scale.fmt(scale.bandMax)}` : null;
  return (
    <div role="group" aria-label={titre} className="bz-cl-bloc">
      <div className="bz-lecture" data-champ={champ ? '' : undefined}>
        <div className="bz-cl-titre">
          <strong>{titre}</strong>
          <span>{quoi}</span>
        </div>
        <button
          type="button"
          className="bz-val bz-m"
          data-vide={value == null ? '' : undefined}
          aria-label="Taper la valeur"
          onClick={() => {
            setChamp(true);
            requestAnimationFrame(() => document.getElementById(champId)?.focus());
          }}
        >
          <b>{value != null ? formatCurseur(kind, value) : '?'}</b>
          <span className="bz-u">{unite || 'L'}</span>
          <Pencil size={14} aria-hidden="true" />
        </button>
        <div className="bz-saisie">
          <Input
            id={champId}
            aria-label={`${titre} (${unite})`}
            autoComplete="off"
            inputMode="decimal"
            enterKeyHint="done"
            value={raw}
            aria-invalid={!!raw.trim() && !incomplete && parseReading(raw, kind) == null}
            onChange={(e) => {
              setRaw(e.target.value);
              onValue(/[.,]$/.test(e.target.value.trim()) ? null : parseReading(e.target.value, kind));
            }}
          />
        </div>
        <span className="bz-pas">
          {[-1, 1].map((sens) => (
            <button type="button" key={sens} className="bz-m" aria-label={`${sens < 0 ? 'moins' : 'plus'} ${pasTexte}`} onClick={() => poser((value ?? depart) + sens * pas)}>
              {sens < 0 ? '−' : '+'}{pasTexte}
            </button>
          ))}
        </span>
      </div>
      <label className="bz-refroidi">
        <input type="checkbox" checked={refroidi} onChange={(e) => onRefroidi(e.target.checked)} />
        {kind === 'densite' ? 'Densité refroidie ou corrigée à l’étalonnage' : 'Volume ramené à 20 °C'}
      </label>
      <MeasureSlider scale={scale} kind={kind} value={value} depart={depart} label={READING[kind].label} onPose={poser} />
      <div className="bz-cl-ligne" aria-live="polite">
        {scale.cible && value != null && (ecart != null ? (
          <p className="bz-verdict is-watch bz-ecart" data-k="hors">
            <TriangleAlert size={14} aria-hidden="true" />
            <span><b className="bz-m">{ecart > 0 ? '+' : '−'}{scale.fmt(Math.abs(ecart))}</b> {ecart > 0 ? 'au-dessus de' : 'sous'} la cible{' '}
              <b className="bz-m">{cibleTexte}{unite ? ` ${unite}` : ''}</b></span>
          </p>
        ) : (
          <p className="bz-verdict is-ok" data-k="ok"><Check size={14} aria-hidden="true" /><span>dans la cible</span></p>
        ))}
        {cibleTexte && (
          <p className="bz-ecart bz-cl-cible" data-k="vide">cible <b className="bz-m">{cibleTexte}</b>{unite ? ` ${unite}` : ''}</p>
        )}
      </div>
      {kind === 'densite' && <p className="bz-muet">Densité sur échantillon refroidi ; 1056 est accepté pour 1,056.</p>}
      {value != null && !refroidi && (
        <p className="bz-muet">Sans la case cochée, le relevé reste au journal mais ne compte pas comme {kind === 'densite' ? 'densité initiale' : 'volume au fermenteur'}.</p>
      )}
    </div>
  );
}

export function BrewClotureReleves({ step, recipe, draft, onChange }: {
  step: BrewDayStep;
  recipe?: RecipeSnapshot;
  draft: ClotureReleves;
  onChange: (next: ClotureReleves) => void;
}) {
  const [raison, setRaison] = useState(false);
  return (
    <div className="brew-page bz bz-cl">
      <Bloc
        kind="densite"
        titre="Densité initiale"
        quoi="moût refroidi"
        step={step}
        recipe={recipe}
        value={draft.densite}
        refroidi={draft.densiteRefroidie}
        onValue={(densite) => onChange({ ...draft, densite })}
        onRefroidi={(densiteRefroidie) => onChange({ ...draft, densiteRefroidie })}
      />
      <Bloc
        kind="volume"
        titre="Au fermenteur"
        quoi="au transfert"
        step={step}
        recipe={recipe}
        value={draft.volume}
        refroidi={draft.volumeRefroidi}
        onValue={(volume) => onChange({ ...draft, volume })}
        onRefroidi={(volumeRefroidi) => onChange({ ...draft, volumeRefroidi })}
      />
      <button type="button" className="bz-pourquoi" aria-expanded={raison} onClick={() => setRaison((r) => !r)}>
        <CircleHelp size={14} aria-hidden="true" />
        Pourquoi maintenant
        {raison ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </button>
      {raison && (
        <>
          <p className="bz-raison">{raisonMesure('densite', step)}</p>
          <p className="bz-raison">{raisonMesure('volume', step)}</p>
        </>
      )}
    </div>
  );
}

/** Le relevé d'un lot à la réouverture de la fenêtre : la valeur déjà au journal et si elle porte sa case, sinon rien (« ? »). */
export function cloturePartirDe(
  brut: { densite?: { value: number; roomTemp?: boolean }; volume?: { value: number; roomTemp?: boolean; volumeBasis?: string } }
): ClotureReleves {
  return {
    densite: brut.densite?.value ?? null,
    // 3 : sans relevé, la case est cochée d'office (le moût est à la température d'ensemencement) ; un relevé déjà noté garde son choix.
    densiteRefroidie: refroidiParDefaut('densite', 'ensemencement', brut.densite ? brut.densite.roomTemp === true : undefined),
    volume: brut.volume?.value ?? null,
    volumeRefroidi: brut.volume ? brut.volume.volumeBasis === 'cold' || (!brut.volume.volumeBasis && brut.volume.roomTemp === true) : false
  };
}
