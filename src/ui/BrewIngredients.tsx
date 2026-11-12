import { Input } from './Input';
import { brewNow } from '../services/brewClock';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Check, Droplet as Droplets, Package } from 'lucide-react';
import { BrewDayState, RecipeSnapshot, StockItem } from '../types';
import {
  actualAmount,
  BrewArea,
  BrewIngredient,
  brewIngredients,
  maltAlternatives,
  effectiveFermentables,
  mineralFeedback,
  boilMinutes
} from '../domain/brewCompanion';
import { BrewUpdate, brewControl, brewInput } from './BrewDayMeasurements';
import { NumberInput } from './NumberInput';
import { Units } from '../services/units';
import { useHoldRepeat } from './numericInput';
import { BrewChoice } from './BrewChoice';
import { BrewTag } from './BrewTag';
import { actualWater } from '../domain/brewAssist';
import type { PitchQuantityChoice } from '../domain/brewDay';
import { amountDecimals, formatAmount, roundAmount } from '../../functions/src/brewAmount';
import './brew-ingredients-ajouts.css';
import { actualQuantityMax, actualQuantityProblem, actualQuantityRounded } from '../domain/brewQuantityBounds';
import { nombreFr } from '../domain/nombreAffiche';
import { phraseRetard } from '../services/brewTimer';
import { BrewPitchJauge, type PitchJaugeInfo } from './BrewPitchJauge';

/** Une quantité à la résolution de l'instrument (`brewAmount`) : 16,5 L et non 16,494 L (BR-54, BE-35, 08.11). Par défaut des litres. */
const f = (n: number, unit = 'L') => new Intl.NumberFormat('fr-CH', { maximumFractionDigits: amountDecimals(unit, n) }).format(roundAmount(n, unit));

function localAdditionTime(at?: number) {
  if (at == null || !Number.isFinite(at)) return '';
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AdditionTime({ name, doneAt, onConfirm }: {
  name: string;
  doneAt?: number;
  onConfirm: (at: number) => void;
}) {
  const [raw, setRaw] = useState(() => localAdditionTime(doneAt));
  const at = new Date(raw).getTime();
  const valid = !!raw && Number.isFinite(at) && localAdditionTime(at) === raw && at <= brewNow();
  return <div className="flex min-w-0 basis-full flex-wrap items-end gap-1">
    <label className="min-w-0 basis-full text-xs text-cave-400">
      Date et heure réelles (facultatif)
      <span className="bz-heure-reelle">
        <input
          type="datetime-local"
          className={`${brewInput} mt-1 max-w-full`}
          aria-label={`Date et heure réelles d’ajout de ${name}`}
          aria-invalid={!!raw && !valid}
          value={raw}
          max={localAdditionTime(brewNow())}
          onChange={(event) => setRaw(event.currentTarget.value)}
        />
        {/* p3 (n° 6) : « Maintenant » consigne en un geste, sans passer par « Consigner à cette heure ». */}
        <button type="button" className="bz-maintenant" onClick={() => onConfirm(brewNow())}>Maintenant</button>
      </span>
    </label>
    {/* VI-8 (rejeu b47cd90b n° 8) : éteint, le bouton était un gris sur gris sans raison lisible ; il dit ce qui manque, et allumé il se lit comme une action. */}
    <button type="button" className={`${brewControl} brew-consign`} disabled={!valid || raw === localAdditionTime(doneAt)}
      onClick={() => { if (valid && at <= brewNow()) onConfirm(at); }}>
      Consigner à cette heure
    </button>
    {!!raw && !valid && <p role="alert" className="basis-full text-xs text-alert-strong">Choisis une date et une heure valides, au plus tard maintenant.</p>}
  </div>;
}

/** « 14 h 38 » : une heure de la cuve, sans zéro devant l'heure (z1). */
export const heureCuve = (at: number) => {
  const d = new Date(at);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Ce que la ligne d'ajout de l'ébullition porte en plus : minute, heure, et son rang (prochain, dû, en retard). */
interface AjoutLigne {
  minute: number;
  quand: React.ReactNode;
  prochain: boolean;
  /** Échéance passée et ajout pas fait : ligne rose, case « Fait » rouge (p2c, E2). */
  du: boolean;
}

/**
 * Un ajout sauté (A06) : sa dose est posée à 0 et il n'est pas coché. « 0 » est ici une dose connue (« je ne le verse pas »), pas une valeur
 * inconnue ; `brewAlarms` ne sonne plus un ajout dont la dose est 0.
 */
export const estSaute = (s: BrewDayState, id: string) => {
  const a = s.additions?.[id];
  return !!a && a.amount === 0 && a.doneAt == null;
};

type AjoutIdentite = Pick<BrewIngredient, 'id' | 'name' | 'planned' | 'unit' | 'stepId'>;
const idNonVerse = (id: string) => `non-verse-${id}`;

/** Sauter : dose 0 posée, ligne de journal « Citra 25 g · non versé » (une seule, même après deux touchers). */
export function sauterAjout(s: BrewDayState, item: AjoutIdentite, at: number): BrewDayState {
  const existing = s.additions?.[item.id];
  const { doneAt: _doneAt, ...reste } = existing ?? { amount: 0 };
  const nom = existing?.replacement?.name ?? item.name;
  const notes = s.notes ?? [];
  return {
    ...s,
    additions: { ...s.additions, [item.id]: { ...reste, amount: 0 } },
    notes: notes.some((n) => n.id === idNonVerse(item.id))
      ? notes
      : [...notes, { id: idNonVerse(item.id), at, stepId: item.stepId, text: `${nom} ${formatAmount(item.planned, item.unit)} · non versé` }]
  };
}

/** Annuler un saut : la dose prévue revient et la ligne « non versé » du journal s'efface (elle ne dirait plus vrai). */
export function remettreAjout(s: BrewDayState, item: AjoutIdentite): BrewDayState {
  return {
    ...s,
    additions: { ...s.additions, [item.id]: { ...s.additions?.[item.id], amount: item.planned } },
    notes: (s.notes ?? []).filter((n) => n.id !== idNonVerse(item.id))
  };
}

/** Remplacer un ajout (A04, G1e) : le nom change, la dose et le moment restent (le moment vient de la recette, pas de la substitution). */
export function remplacerAjout(
  s: BrewDayState,
  item: AjoutIdentite,
  replacement: NonNullable<NonNullable<BrewDayState['additions']>[string]['replacement']>
): BrewDayState {
  const existing = s.additions?.[item.id];
  const amount = estSaute(s, item.id) ? item.planned : existing?.amount ?? item.planned;
  return { ...s, additions: { ...s.additions, [item.id]: { ...existing, amount, replacement } } };
}

/**
 * Dose qui garde les mêmes grammes d'acides alpha : dose · α du prévu ÷ α du remplaçant. `null` dès qu'un α est inconnu ou nul
 * (jamais 0, jamais une dose inventée). Elle ne s'impose pas : le remplacement garde la dose prévue, c'est une aide.
 */
export function doseAlphaEquivalente(dose: number, alphaPrevu: number | undefined, alphaRemplacant: number | undefined, unit: string): number | null {
  if (![dose, alphaPrevu, alphaRemplacant].every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0)) return null;
  return roundAmount((dose * alphaPrevu!) / alphaRemplacant!, unit);
}

/**
 * p3 (n° 4) : le choix explicite de la quantité de levure réellement ajoutée, dans l'éditeur de la ligne Levure (colonne principale).
 * `token` change à chaque toucher du pied « J'ai ajouté la levure » sans choix : l'éditeur s'ouvre alors, sous les yeux.
 */
export interface PitchEditor {
  mode?: PitchQuantityChoice['mode'];
  /** `preset` : une quantité toute faite, un seul toucher (une levure sèche : « 1 sachet »). */
  options: { mode: PitchQuantityChoice['mode']; label: string; preset?: { amount: number; unit: string } }[];
  onMode: (mode: PitchQuantityChoice['mode'], preset?: { amount: number; unit: string }) => void;
  token: number;
  /** p3 / 1C : le poids du sachet (catalogue) et le volume, pour dire la dose en g et en g/hL ; absent = pas de jauge. */
  jauge?: PitchJaugeInfo;
}

function IngredientRow({
  item,
  recipe,
  state,
  stock,
  update,
  onInteract,
  ajout,
  pitch
}: {
  item: BrewIngredient;
  recipe: RecipeSnapshot;
  state: BrewDayState;
  stock: StockItem[];
  update: BrewUpdate;
  onInteract: () => void;
  ajout?: AjoutLigne;
  pitch?: PitchEditor;
}) {
  const actual = state.additions?.[item.id];
  const pitchActualUnknown = item.id === 'yeast' && state.pitchedAt != null &&
    (actual?.amount == null || !(actual.unit ?? item.unit));
  const pitchPlannedUnknown = item.id === 'yeast' && state.pitchedAt == null && !(item.planned > 0) && !(Number.isFinite(actual?.amount) && actual!.amount > 0);
  const pitchChoosing = item.id === 'yeast' && state.pitchedAt == null && !!pitch;
  const amount = pitchActualUnknown || pitchPlannedUnknown ? undefined : actualAmount(item, state);
  const controlAmount = amount ?? (item.planned > 0 ? item.planned : 0);
  const [alternatives, setAlternatives] = useState(false);
  // c1c : une levure sans quantité prévue ouvre d'emblée son ajustement (jauge, « 1 sachet · Mesurée · Sans mesure ») ; « Fermer l'ajustement » le replie.
  const [editingDose, setEditingDose] = useState(pitchChoosing && pitchPlannedUnknown);
  const [replacementName, setReplacementName] = useState('');
  const rowRef = useRef<HTMLDivElement>(null);
  const lastToken = useRef(pitch?.token ?? 0);
  useEffect(() => {
    if (!pitch || pitch.token === lastToken.current) return;
    lastToken.current = pitch.token;
    setEditingDose(true);
    requestAnimationFrame(() => rowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }, [pitch?.token]);
  const named = actual?.replacement?.name ?? item.name;
  // Nom lisible par les lecteurs d'écran même quand la levure n'a pas de nom : « Quantité réelle de  » n'est pas un nom.
  const nom = named.trim() ? named : item.id === 'yeast' ? 'Levure' : item.id;
  const patch = (p: Partial<NonNullable<BrewDayState['additions']>[string]>) => {
    onInteract();
    // Toucher la quantité d'une levure à ajouter, c'est la mesurer : le choix passe à « Mesurée ».
    if (pitchChoosing && p.amount != null && pitch!.mode !== 'measured') pitch!.onMode('measured');
    update((s) => {
      const existing = s.additions?.[item.id];
      if (item.id === 'yeast' && s.pitchedAt != null) {
        if (p.amount != null && Number.isFinite(p.amount) && p.amount > 0) {
          const unit = p.unit ?? existing?.unit ?? item.unit;
          if (!unit?.trim()) return s;
          return { ...s, pitchQuantityConfirmation: 'measured', additions: { ...s.additions,
            yeast: { ...existing, ...p, amount: p.amount, unit, doneAt: s.pitchedAt } } };
        }
        if (p.unit && existing?.amount != null) return { ...s, pitchQuantityConfirmation: 'measured', additions: {
          ...s.additions, yeast: { ...existing, ...p, unit: p.unit, doneAt: s.pitchedAt }
        } };
        return s;
      }
      const entry = { amount: actualAmount(item, s) ?? item.planned, ...existing, ...p };
      // PC-2 : le serveur exige un `amount` fini (400 « Quantité invalide »). Une quantité inconnue ne s'écrit pas, ni comme 0.
      if (!Number.isFinite(entry.amount)) return s;
      return { ...s, additions: { ...s.additions, [item.id]: entry } };
    });
  };
  const rung = item.kind === 'salt' || item.kind === 'acid' ? 0.1 : item.unit === 'kg' ? 0.1 : 1;
  const press = useHoldRepeat(
    controlAmount,
    (amount: number) => patch({ amount }),
    (v, d) => Math.max(0, Math.min(actualQuantityMax(item.planned, item.unit), Math.round((v + d) * 100) / 100))
  );
  // BR-50, BR-53 (08.11) : une quantité hors bornes (négative, ou 99 999 g) ne s'enregistre pas ET le dit ; avant, « -1 » restait tapé sans un mot.
  const [quantityProblem, setQuantityProblem] = useState<string | null>(null);
  // VI-9 (rejeu b47cd90b n° 9) : chaque chiffre tapé s'enregistre au vol (« 9 », « 99 »…). Quand la frappe finit hors bornes (« 99999 »), le message
  // annonce « la valeur précédente est conservée » : il faut donc revenir à celle d'avant la frappe, pas à l'avant-dernier chiffre. On la note à la
  // première frappe d'une séance de saisie (jusqu'à la sortie du champ) ; `avant` vaut undefined quand rien n'était consigné pour cet ingrédient.
  const seance = useRef<{ avant: NonNullable<BrewDayState['additions']>[string] | undefined; valeur: number | undefined } | null>(null);
  const retablirAvantFrappe = () => {
    const base = seance.current;
    if (!base) return;
    onInteract();
    update((s) => {
      const courant = s.additions?.[item.id];
      if (!courant) return s;
      const additions = { ...s.additions };
      if (base.avant) additions[item.id] = { ...courant, amount: base.avant.amount };
      else delete additions[item.id];
      return { ...s, additions };
    });
  };
  const fermentable =
    item.fermentableIndex != null
      ? effectiveFermentables(recipe, state)[item.fermentableIndex]
      : undefined;
  const unreserved = stock.map((x) => {
    const reserved = brewIngredients(recipe)
      .filter(
        (i) =>
          i.id !== item.id &&
          (state.additions?.[i.id]?.replacement?.name ?? i.name).trim().toLowerCase() ===
            x.name.trim().toLowerCase()
      )
      .reduce((sum, i) => sum + (Units.convert(actualAmount(i, state) ?? i.planned, i.unit, x.unit) ?? 0), 0);
    return { ...x, currentStock: Math.max(0, x.currentStock - reserved) };
  });
  const choices = fermentable ? maltAlternatives(fermentable, controlAmount, unreserved) : [];
  const available = unreserved.find(
    (s) => s.name.trim().toLowerCase() === named.trim().toLowerCase()
  );
  const availableQty = available
    ? Units.convert(available.currentStock, available.unit, item.unit)
    : null;
  const shortage = availableQty != null && amount != null && availableQty < amount;
  const saute = item.kind === 'hop' && estSaute(state, item.id);
  const changed = !saute && amount != null && Math.abs(amount - item.planned) > 0.001;
  const checked = actual?.doneAt != null || (item.id === 'yeast' && state.pitchedAt != null);
  const retard = !!ajout?.du && !checked && !saute;
  // Un houblon à remplacer (A04, G1e) : le stock en houblons (hors rupture), et l'α prévu pour une dose à α égal.
  const houblon = item.kind === 'hop';
  const alphaPrevu = houblon && item.hopIndex != null ? recipe.hops?.[item.hopIndex]?.alpha : undefined;
  const houblonsStock = houblon
    ? stock
        .filter((x) => x.category === 'Houblon' && x.currentStock > 0 && x.name.trim().toLowerCase() !== named.trim().toLowerCase())
        .sort((a, b) => b.currentStock - a.currentStock)
        .slice(0, 6)
    : [];
  // c1c : la pastille d'une levure sans quantité dit « à choisir » ; posée, « 2 sachets » (pluriel), pas « 2 sachet ».
  const uniteLue = item.unit === 'sachet' && (amount ?? 0) >= 2 ? 'sachets' : item.unit;
  const doseLabel = pitchActualUnknown ? 'Non renseignée' : pitchPlannedUnknown ? (pitchChoosing ? 'à choisir' : 'À préciser') : f(saute ? item.planned : amount ?? 0, item.unit);
  const doseUnit = `${pitchActualUnknown || (pitchPlannedUnknown && !item.unit) ? '' : uniteLue}${item.kind === 'water' ? ' à froid' : ''}`;
  const doseProps = {
    type: 'button' as const,
    'aria-label': `Modifier la quantité de ${nom}${item.side ? ' au ' + item.side : ''}`,
    'aria-describedby': `brew-dose-value-${item.id} brew-dose-unit-${item.id}`,
    'aria-expanded': editingDose,
    disabled: pitchActualUnknown,
    onClick: () => setEditingDose((value) => !value)
  };
  const doseText = (
    <>
      <strong id={`brew-dose-value-${item.id}`} data-sans-valeur={pitchActualUnknown || pitchPlannedUnknown ? '' : undefined}>{doseLabel}</strong>
      {doseUnit && '\u00a0'}
      {doseUnit &&<small id={`brew-dose-unit-${item.id}`}>{doseUnit}</small>}
    </>
  );
  const split = item.kind === 'water' && recipe.waterPlan ? actualWater(recipe, state, item.side ?? 'mash') : null;
  const splitTotal = split ? split.tapL + split.roL : 0;
  return (
    <div
      ref={rowRef}
      className={`bz-row brew-ingredient ${checked ? 'is-added' : ''} ${ajout ? 'is-ajout' : ''}`}
      data-prochain={ajout?.prochain ? '' : undefined}
      data-du={retard ? '' : undefined}
      data-saute={saute ? '' : undefined}
      data-fait={checked ? '' : undefined}
    >
      {ajout && <span className="bz-min">{ajout.minute}′</span>}
      <div className="bz-nom">
        {item.kind === 'water'
          ? <strong><span aria-hidden="true">Eau</span><span className="sr-only">{named}</span></strong>
          : <strong>{named}{shortage && (
          <span
            className="brew-stock-hint bz-stock-ico"
            role="img"
            aria-label={`Stock indiqué : ${f(availableQty!, item.unit)} ${item.unit}`}
            title={`Stock indiqué : ${f(availableQty!, item.unit)} ${item.unit}`}
          >
            <Package size={13} aria-hidden="true" />
          </span>
        )}</strong>}
        {item.id === 'yeast' && (pitchActualUnknown
          ? <small>{state.pitchQuantityConfirmation === 'unmeasured' ? 'Réel non mesuré' : state.pitchQuantityConfirmation === 'starter-transferred' ? 'Starter transféré · volume non relevé' : 'Réel non renseigné'} · prévu {item.planned > 0 ? `${f(item.planned, item.unit)} ${item.unit}` : 'absent'}</small>
          : pitchPlannedUnknown && !editingDose
            ? <small>Pas de dose prévue · à choisir à l’ajout</small>
            : null)}
        {changed && (
          <small>
            Prévu {f(item.planned, item.unit)} {item.unit}
            <em>
              Écart {amount > item.planned ? '+' : ''}
              {f(amount - item.planned, item.unit)} {item.unit}
            </em>
          </small>
        )}
        {ajout && <button {...doseProps} className="bz-dose-texte">{doseText}{ajout.minute === 0 && <span className="bz-coupure"> · coupure du feu</span>}</button>}
      </div>
      {ajout ? <span className="bz-quand">{ajout.quand}</span> : <button {...doseProps} className="bz-dose brew-amount">{doseText}</button>}
      <label className={`bz-case${retard ? ' is-retard' : ''}`} title={checked && actual?.doneAt != null ? `Ajouté · ${heureCuve(actual.doneAt)}` : 'Cocher après l’ajout réel'}>
        <input
          type="checkbox"
          aria-label={`Ajouté : ${nom}`}
          checked={checked}
          disabled={item.id === 'yeast' && state.pitchedAt != null}
          onChange={(e) => {
            onInteract();
            // Cocher une levure dont la quantité est inconnue ouvre la saisie de la quantité (Mesurée / Sans mesure) au lieu d'envoyer un ajout invalide.
            if (e.target.checked && (pitchPlannedUnknown || !Number.isFinite(actual?.amount ?? actualAmount(item, state)))) { setEditingDose(true); return; }
            // Cocher un ajout sauté, c'est l'avoir finalement versé : la dose prévue revient (et le « non versé » du journal s'efface) avant l'heure du toucher.
            if (e.target.checked && saute) update((s) => { const r = remettreAjout(s, item); return { ...r, additions: { ...r.additions, [item.id]: { ...r.additions![item.id], doneAt: brewNow() } } }; });
            else if (e.target.checked) patch({ doneAt: brewNow(), ...(item.kind === 'water' ? { volumeBasis: 'cold' as const } : {}) });
            else
              update((s) => {
                const a = { amount: actualAmount(item, s) ?? item.planned, ...s.additions?.[item.id] };
                delete a.doneAt;
                return { ...s, additions: { ...s.additions, [item.id]: a } };
              });
          }}
        />
        <span className="bz-case-boite" aria-hidden="true">
          {checked ? <Check size={18} strokeWidth={3} /> : retard ? <span className="bz-case-fait">Fait</span> : saute ? <span className="bz-case-tiret">–</span> : null}
        </span>
        <span className="sr-only">{checked ? 'Ajout consigné' : saute ? 'Non versé' : 'À ajouter'}</span>
      </label>
      {split && (
        <div className="bz-eaux">
          {split.invalidMix ? (
            <span className="brew-feedback">
              Coupe à revoir : {f(split.roL)} L d’osmosée dépassent le total de {f(split.litres)} L. Corrige la coupe dans l’aide.
            </span>
          ) : (
            <>
              <span><b>{f(split.tapL)}</b> réseau</span>
              <i className="bz-eaux-barre" aria-hidden="true">
                <i style={{ width: `${splitTotal > 0 ? (split.tapL / splitTotal) * 100 : 50}%` }} />
                <i style={{ width: `${splitTotal > 0 ? (split.roL / splitTotal) * 100 : 50}%` }} />
              </i>
              <span><b>{f(split.roL)}</b> osmosée</span>
            </>
          )}
        </div>
      )}
      {editingDose && (
        <div className="brew-dose-edit bz-edition" aria-label={`Ajuster ${nom}`}>
          {pitchChoosing && (
            <>
              {pitch!.jauge && <BrewPitchJauge info={pitch!.jauge} choix={pitch!.mode === 'measured' ? actual : undefined} />}
              <div className="bz-levure-choix" role="radiogroup" aria-label="Quantité de levure réellement ajoutée" data-sans-choix={pitch!.mode ? undefined : ''}>
                {pitch!.options.map((o) => {
                  // p3 / 1C : la pastille du préréglage suit la quantité (« 2 sachets » enfoncée à 2), pas un « 1 sachet » figé.
                  const estPose = (p?: { amount: number; unit: string }) => !!p && pitch!.mode === 'measured' && actual?.unit === p.unit && typeof actual?.amount === 'number' && actual.amount > 0;
                  const presetPose = pitch!.options.some((x) => estPose(x.preset));
                  const coche = o.preset ? estPose(o.preset) : pitch!.mode === o.mode && !(o.mode === 'measured' && presetPose);
                  const label = o.preset && coche && o.preset.unit === 'sachet'
                    ? `${String(actual!.amount).replace('.', ',')} sachet${actual!.amount >= 2 ? 's' : ''}`
                    : o.label;
                  return (
                    <button
                      key={o.label}
                      type="button"
                      role="radio"
                      aria-checked={coche}
                      onClick={() => { onInteract(); if (!(o.preset && coche)) pitch!.onMode(o.mode, o.preset); }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {fermentable?.kind === 'grain' && (
            <button
              type="button"
              className="brew-replace-button"
              aria-label="Remplacer ce malt"
              title="Remplacer ce malt"
              aria-expanded={alternatives}
              onClick={() => setAlternatives((v) => !v)}
            >
              <ArrowLeftRight size={14} />
              <span>Remplacer</span>
            </button>
          )}
          {houblon && (
            <button
              type="button"
              className="brew-replace-button"
              aria-label="Remplacer ce houblon"
              title="Remplacer ce houblon"
              aria-expanded={alternatives}
              onClick={() => setAlternatives((v) => !v)}
            >
              <ArrowLeftRight size={14} />
              <span>Remplacer</span>
            </button>
          )}
          {/* A06 : « Sauter » pose la dose à 0 et le journal dit « non versé » ; « Remettre » défait le saut. */}
          {houblon && !checked && (saute
            ? <button type="button" className="brew-replace-button" aria-label="Remettre cet ajout"
                onClick={() => { onInteract(); update((s) => remettreAjout(s, item)); }}>Remettre</button>
            : <button type="button" className="brew-replace-button" aria-label="Sauter"
                onClick={() => { onInteract(); setEditingDose(false); update((s) => sauterAjout(s, item, brewNow())); }}>Sauter</button>)}
          <div className="brew-dose" data-changed={changed || undefined}>
            <button type="button" {...press(-rung)} aria-label={`Diminuer ${nom}`}>
              −
            </button>
            <div className="brew-dose-value" onBlur={() => { seance.current = null; }}>
              <NumberInput
                // « Mesurée » : le champ reste vide tant que rien n'a été mesuré (la dose prévue n'est jamais présentée comme mesurée).
                value={pitchChoosing && pitch!.mode === 'measured' && actual?.amount == null ? undefined : amount}
                placeholder={pitchChoosing && pitch!.mode === 'measured' ? 'Mesure' : pitchChoosing && amount == null ? '?' : undefined}
                emptyValue={undefined}
                aria-invalid={quantityProblem ? true : undefined}
                onValue={(saisi) => {
                  if (saisi === undefined) { setQuantityProblem(null); return; }
                  // RL-10 : la dose s'arrondit à la précision de l'unité avant tout contrôle (le champ la montre ainsi à la sortie).
                  const n = actualQuantityRounded(saisi, item.unit);
                  if (!seance.current) seance.current = { avant: actual, valeur: amount };
                  const problem = actualQuantityProblem(n, item.planned, item.unit, seance.current.valeur);
                  setQuantityProblem(problem);
                  if (problem) retablirAvantFrappe();
                  else patch({ amount: n });
                }}
                aria-label={`Quantité réelle de ${nom}${item.side ? ' au ' + item.side : ''}`}
              />
              <span>{uniteLue || (pitchChoosing && pitch!.options.some((o) => o.preset?.unit === 'sachet') ? 'sachet' : '')}</span>
            </div>
            <button type="button" {...press(rung)} aria-label={`Augmenter ${nom}`}>
              +
            </button>
          </div>
          {quantityProblem && <p role="alert" className="text-xs text-alert-strong">{quantityProblem}</p>}
          {/* c1c (11.11) : avant tout choix, ou sur un sachet posé, l'unité va de soi : le champ « Unité réelle » ne paraît que pour « Mesurée ». */}
          {item.id === 'yeast' && !item.unit && (!pitchChoosing || (pitch!.mode === 'measured' && !(actual?.unit === 'sachet' && typeof actual.amount === 'number' && actual.amount > 0))) && <label className="block space-y-1 text-xs text-cave-400">Unité réelle
            <select aria-label="Unité de la quantité réelle de levure" value={actual?.unit ?? ''} onChange={event => patch({ unit: event.target.value })} className="min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
              <option value="">À choisir</option>{['g', 'kg', 'mL', 'L', 'sachet', 'flacon', 'paquet'].map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>}
          <button type="button" className="brew-text-button" onClick={() => setEditingDose(false)}>
            Fermer l’ajustement
          </button>
          {/* La levure à ajouter prend son heure au pied (recordPitch), pas ici : son choix est la quantité. */}
          {!pitchChoosing && <AdditionTime key={actual?.doneAt ?? 'unconfirmed'} name={named} doneAt={actual?.doneAt}
            onConfirm={(doneAt) => patch({ doneAt, ...(item.kind === 'water' ? { volumeBasis: 'cold' as const } : {}) })} />}
          {actual?.doneAt != null && !pitchChoosing && (
            <p className="brew-added-time">
              Ajout consigné le{' '}
              {new Date(actual.doneAt).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          )}
          {houblon && (
            <div className="brew-alternatives bz-houblon-alt">
              {actual?.replacement && (
                <button
                  type="button"
                  className="min-h-8 text-2xs text-cave-400 underline ml-2"
                  onClick={() =>
                    update((s) => {
                      const a = { ...s.additions?.[item.id], amount: estSaute(s, item.id) ? 0 : item.planned };
                      delete a.replacement;
                      return { ...s, additions: { ...s.additions, [item.id]: a } };
                    })
                  }
                >
                  Revenir à {item.name}
                </button>
              )}
              {alternatives && (
                <div className="space-y-1 pb-1">
                  <p className="text-2xs text-cave-200 bz-pas-de">Pas de {item.name} ?</p>
                  {houblonsStock.map((x) => {
                    const equiv = doseAlphaEquivalente(item.planned, alphaPrevu, x.alphaPct, item.unit);
                    const enStock = Units.convert(x.currentStock, x.unit, item.unit);
                    return (
                      <button
                        key={x.id}
                        type="button"
                        className={`${brewControl} w-full !whitespace-normal text-left py-1`}
                        onClick={() => {
                          onInteract();
                          update((s) => remplacerAjout(s, item, { name: x.name }));
                          setAlternatives(false);
                        }}
                      >
                        {x.name}
                        <span className="block text-2xs text-cave-400">
                          {[
                            x.alphaPct != null && x.alphaPct > 0 ? `α ${nombreFr(x.alphaPct, 1)} %` : null,
                            equiv != null && Math.abs(equiv - item.planned) > 0.001 ? `α égal : ${f(equiv, item.unit)} ${item.unit}` : null,
                            enStock != null ? `${f(enStock, item.unit)} ${item.unit} en stock` : null
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </button>
                    );
                  })}
                  {!houblonsStock.length && (
                    <p className="text-2xs text-cave-200">Aucun autre houblon en stock. Note celui que tu as.</p>
                  )}
                  <p className="text-2xs text-cave-400">Dose et moment gardés ; l’α du remplaçant change l’amertume, à vérifier.</p>
                  <form autoComplete="off"
                    className="flex flex-wrap gap-1 pt-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = replacementName.trim();
                      if (!name) return;
                      onInteract();
                      update((s) => remplacerAjout(s, item, { name }));
                      setReplacementName('');
                      setAlternatives(false);
                    }}
                  >
                    <Input
                      aria-label="Autre houblon utilisé"
                      placeholder="Autre houblon utilisé"
                      value={replacementName}
                      maxLength={160}
                      onChange={(e) => setReplacementName(e.target.value)}
                      className={brewInput + ' flex-1'}
                    />
                    <button type="submit" disabled={!replacementName.trim()} className={brewControl + ' !px-2'}>
                      Utiliser
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
          {fermentable?.kind === 'grain' && (
            <div className="brew-alternatives">
              {alternatives && (
                <div className="space-y-1 pb-1">
                  {choices.map((c) => (
                    <button
                      key={c.item.id}
                      type="button"
                      className={`${brewControl} w-full !whitespace-normal text-left py-1`}
                      onClick={() => {
                        patch({
                          amount: c.kg,
                          replacement: {
                            name: c.item.name,
                            ...(c.item.potentialPpg ? { potentialPpg: c.item.potentialPpg } : {}),
                            ...(c.item.colorEbc != null ? { colorEbc: c.item.colorEbc } : {})
                          }
                        });
                        setAlternatives(false);
                      }}
                    >
                      {c.item.name} · {f(c.kg, 'kg')} kg
                      <span className="block text-2xs text-cave-400">
                        {c.exact ? 'Potentiel d’extrait compensé' : 'Poids égal, potentiel à vérifier'}{' '}
                        · {nombreFr(c.item.colorEbc, 1)} EBC · {f(c.availableKg, 'kg')} kg disponibles
                      </span>
                    </button>
                  ))}
                  {!choices.length && (
                    <p className="text-2xs text-cave-200">
                      Aucun équivalent documenté et disponible dans le stock. Note le malt que tu as :
                      le conseil IA peut étudier ce remplacement.
                    </p>
                  )}
                  {choices.length > 0 && (
                    <p className="text-2xs text-cave-400">
                      Même famille et classe de couleur ; goût et pouvoir enzymatique restent à vérifier
                      sur la fiche.
                    </p>
                  )}
                </div>
              )}
              {actual?.replacement && (
                <button
                  type="button"
                  className="min-h-8 text-2xs text-cave-400 underline ml-2"
                  onClick={() =>
                    update((s) => {
                      const a = { ...s.additions?.[item.id], amount: item.planned };
                      delete a.replacement;
                      return { ...s, additions: { ...s.additions, [item.id]: a } };
                    })
                  }
                >
                  Revenir à {item.name}
                </button>
              )}
              {alternatives && (
                <form autoComplete="off"
                  className="flex flex-wrap gap-1 pt-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = replacementName.trim();
                    if (!name) return;
                    const known = stock.find(
                      (s) => s.category === 'Malt' && s.name.toLowerCase() === name.toLowerCase()
                    );
                    patch({
                      replacement: {
                        name,
                        ...(known?.colorEbc != null ? { colorEbc: known.colorEbc } : {}),
                        ...(known?.potentialPpg ? { potentialPpg: known.potentialPpg } : {})
                      }
                    });
                    setReplacementName('');
                    setAlternatives(false);
                  }}
                >
                  <Input
                    aria-label="Autre malt utilisé"
                    placeholder="Autre malt utilisé"
                    value={replacementName}
                    maxLength={160}
                    onChange={(e) => setReplacementName(e.target.value)}
                    className={brewInput + ' flex-1'}
                  />
                  <button
                    type="submit"
                    disabled={!replacementName.trim()}
                    className={brewControl + ' !px-2'}
                  >
                    Utiliser
                  </button>
                  <p className="w-full text-2xs text-cave-400">
                    Saisie libre : quantité pesée conservée, caractéristiques inconnues à compléter.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Les ingrédients que cette étape fait manipuler (la liste de la vue Conduite, et de « Ensuite · … »). */
export function ingredientAppliesToStep(
  i: BrewIngredient,
  { area, stepId, overview = false }: { area: BrewArea; stepId?: string; overview?: boolean }
) {
  if (overview) return true;
  if (!stepId) return i.area === area || (area === 'mash' && i.kind === 'grain');
  if (area === 'preparation')
    return (
      i.area === area &&
      (stepId === 'concassage' ? i.stepId === 'concassage' : i.stepId !== 'concassage')
    );
  if (area === 'mash')
    return (
      // n° 21 : les grains se cochent une fois, au premier palier (ou à l'extraction à froid) ; le Mashout ne les réaffiche pas.
      (i.kind === 'grain' && (stepId === 'mash-0' || stepId === 'nolo-extraction')) ||
      (i.side === 'sparge' && stepId === 'sparge') ||
      (i.kind !== 'grain' && i.area === 'mash' && (i.stepId === 'fwh' ? stepId === 'fwh' : /^mash/.test(stepId)))
    );
  if (area === 'boil')
    return (
      i.area === area &&
      (stepId === 'whirlpool' ? i.stepId === 'whirlpool' : i.stepId !== 'whirlpool')
    );
  return i.area === area && (i.id !== 'yeast' || stepId === 'ensemencement');
}

type Matiere = 'eau' | 'grain' | 'houblon' | 'autre';

export function BrewIngredients({
  recipe,
  state,
  stock = [],
  area,
  update,
  overview = false,
  now = brewNow(),
  stepId,
  pitch,
  finEbullitionEstimee = null
}: {
  recipe: RecipeSnapshot;
  state: BrewDayState;
  stock?: StockItem[];
  area: BrewArea;
  update: BrewUpdate;
  overview?: boolean;
  now?: number;
  stepId?: string;
  pitch?: PitchEditor;
  /** K4 n° 19 : la fin d'ébullition du plan (A3), pour dire l'heure estimée des ajouts avant le premier bouillon (« ~15 h 20 »). Absente : pas d'heure inventée. */
  finEbullitionEstimee?: number | null;
}) {
  const [extra, setExtra] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const items = brewIngredients(recipe);
  const forStep = (i: BrewIngredient) => ingredientAppliesToStep(i, { area, stepId, overview });
  const shown = items.filter(
    (i) => forStep(i) && (i.planned > 0 || state.additions?.[i.id] || extra.includes(i.id) || i.id === 'yeast' && (overview || area === 'finish' && stepId === 'ensemencement'))
  );
  const extraSaltOptions = items
    .filter((i) => (i.kind === 'salt' || i.kind === 'acid') && !shown.some((s) => s.id === i.id))
    .map((i) => ({
      value: i.id,
      label: i.name,
      side: i.side,
      detail: i.side === 'mash' ? 'À l’empâtage' : 'Au rinçage'
    }));
  const canAddExtra = area === 'preparation' && stepId !== 'concassage' && !overview;
  const inlineImpact = shown.some(
    (i) => i.id === activeItem && ['salt', 'acid', 'water'].includes(i.kind)
  );
  const boilMin = boilMinutes(state, recipe);
  const boilRunning = state.boilStartedAt != null && state.boilFinishedAt == null;
  const end = state.boilStartedAt != null ? state.boilStartedAt + boilMin * 60000 : undefined;
  /** Conduite d'une étape de l'ébullition : tous les ajouts minutés en une seule liste (z1), du premier au dernier. */
  const ajoutsEnListe = area === 'boil' && !overview && stepId !== 'whirlpool';
  const groups = new Map<
    string,
    {
      label: string;
      matiere: Matiere;
      icon?: typeof Droplets;
      side?: 'mash' | 'sparge';
      ajouts?: boolean;
      items: BrewIngredient[];
      at?: number;
    }
  >();
  const areaOrder = { preparation: 0, mash: 1, boil: 2, finish: 3 };
  const ordered = shown
    .map((i) =>
      i.beforeEndMin != null && state.hopElapsedMin?.[i.id] != null
        ? {
            ...i,
            beforeEndMin: Math.max(0, boilMin - state.hopElapsedMin[i.id])
          }
        : i
    )
    .sort(
      (a, b) =>
        (overview ? areaOrder[a.area] - areaOrder[b.area] : 0) ||
        (b.beforeEndMin ?? -1) - (a.beforeEndMin ?? -1)
    );
  for (const i of ordered) {
    const group: { key: string; label: string; matiere: Matiere; icon?: typeof Droplets; side?: 'mash' | 'sparge'; ajouts?: boolean } = i.side
      ? {
          key: i.side,
          label: i.side === 'mash' ? 'Eau d’empâtage' : 'Eau de rinçage',
          matiere: 'eau',
          icon: Droplets,
          side: i.side
        }
      : i.beforeEndMin != null
        ? ajoutsEnListe
          ? { key: 'ajouts', label: 'Ajouts', matiere: 'houblon', ajouts: true }
          : {
              key: `boil-${i.beforeEndMin}`,
              label: i.beforeEndMin === 0 ? 'À la coupure du feu' : `${i.beforeEndMin} min avant la fin`,
              matiere: 'houblon'
            }
        : i.kind === 'grain'
          ? { key: 'grain', label: recipe.nolo?.process === 'coldExtraction' ? 'Grains à extraire' : 'Grains', matiere: 'grain' }
          : i.kind === 'hop'
            ? { key: i.stepId, label: i.stepId === 'fwh' ? 'Premier moût' : 'Whirlpool', matiere: 'houblon' }
            : {
                key: i.area,
                label: i.id === 'yeast' ? 'Levure' : 'Autres ingrédients',
                matiere: 'autre'
              };
    if (!groups.has(group.key))
      groups.set(group.key, {
        ...group,
        items: [],
        ...(end != null && i.beforeEndMin != null
          ? { at: Math.max(state.boilStartedAt!, end - i.beforeEndMin * 60000) }
          : {})
      });
    groups.get(group.key)!.items.push(i);
  }
  const isDone = (i: BrewIngredient) =>
    state.additions?.[i.id]?.doneAt != null || (i.id === 'yeast' && state.pitchedAt != null);
  /** Un houblon sauté (A06) est traité : il ne reste pas « prochain » et ne tient plus la case du groupe. */
  const isSaute = (i: BrewIngredient) => i.kind === 'hop' && estSaute(state, i.id);
  const heading = overview ? 'Tous les ingrédients' : null;
  return (
    <section aria-label="Ingrédients à ajouter" className="brew-ingredients bz-ingredients">
      {heading && (
        <div className="brew-section-heading">
          <h2>{heading}</h2>
          {shown.length > 0 && (
            <span className="brew-count">
              {shown.filter(isDone).length}/{shown.length}
            </span>
          )}
        </div>
      )}
      {(area === 'preparation' || overview) && !inlineImpact && (
        <BrewMinerals recipe={recipe} state={state} />
      )}
      {[...groups.entries()].map(([key, group]) => {
        const allAdded = group.items.every((i) => state.additions?.[i.id]?.doneAt != null || isSaute(i));
        const due =
          !allAdded && group.at != null && group.at <= now && state.boilFinishedAt == null;
        const Icon = group.icon;
        const done = group.items.filter(isDone).length;
        const sideOptions = group.side && canAddExtra ? extraSaltOptions.filter((o) => o.side === group.side) : [];
        const prochain = group.ajouts ? group.items.find((i) => !isDone(i) && !isSaute(i)) : undefined;
        const aVerser = group.items.filter((i) => !isSaute(i)).length;
        return (
          <div
            key={key}
            className={`brew-ingredient-group bz-groupe ${due ? 'is-due' : ''}`}
            data-matiere={group.matiere}
          >
            <header className="bz-groupe-tete">
              {Icon && <Icon size={14} aria-hidden="true" />}
              <h3>{group.label}</h3>
              {key === 'sparge' && (
                <span className="brew-water-temperature">
                  Consigne {String(recipe.mash?.spargeTempC ?? 76).replace('.', ',')} °C
                </span>
              )}
              <span className="bz-compte">
                {done}/{aVerser}
              </span>
              {sideOptions.length > 0 && (
                <BrewChoice
                  plus
                  label={`Ajouter un produit à ${group.side === 'mash' ? 'l’eau d’empâtage' : 'l’eau de rinçage'}`}
                  title="Ajouter un sel ou un acide"
                  value=""
                  searchable
                  onChange={(value) => setExtra((v) => [...v, value])}
                  options={sideOptions}
                />
              )}
            </header>
            {group.items.map((i) => {
              let ajout: AjoutLigne | undefined;
              if (group.ajouts && i.beforeEndMin != null) {
                const at = end != null ? Math.max(state.boilStartedAt!, end - i.beforeEndMin * 60000) : finEbullitionEstimee != null && state.boilStartedAt == null ? finEbullitionEstimee - i.beforeEndMin * 60000 : undefined;
                const estime = end == null && at != null;
                const finished = isDone(i);
                const sauteLigne = isSaute(i);
                const next = prochain?.id === i.id;
                const doneAt = state.additions?.[i.id]?.doneAt;
                // Plancher, comme l'horloge (1 h 14) et le bandeau : une échéance ne s'écrit pas avec deux arrondis.
                const reste = at != null ? at - now : undefined;
                const minutes = reste != null ? Math.floor(reste / 60000) : undefined;
                // p2c E2 : tout ajout dont l'échéance est passée et qui n'est ni fait ni sauté est en retard (ligne rose, « Fait » rouge), pas seulement le prochain.
                const enRetard = !finished && !sauteLigne && boilRunning && reste != null && reste <= 0;
                ajout = {
                  minute: i.beforeEndMin,
                  prochain: next && boilRunning,
                  du: enRetard,
                  quand: finished
                    ? doneAt != null ? <span className="bz-m">{heureCuve(doneAt)}</span> : null
                    : sauteLigne
                      ? <b className="bz-non-verse">non versé</b>
                      : estime
                        ? <span className="bz-m">~{heureCuve(at!)}</span>
                        : !boilRunning || at == null
                        ? null
                        : enRetard
                          ? <><b>{phraseRetard(reste!)!.court}</b><span className="sr-only"> · prévu à {heureCuve(at)}</span></>
                          : next
                            ? minutes === 0
                              ? <>dans <span className="bz-m">&lt;1</span> min</>
                              : <>dans <span className="bz-m">{minutes}</span> min</>
                            : <span className="bz-m">{heureCuve(at)}</span>
                };
              }
              return (
                <React.Fragment key={i.id}>
                  <IngredientRow
                    key={i.id}
                    item={i}
                    recipe={recipe}
                    state={state}
                    stock={stock}
                    update={update}
                    onInteract={() => setActiveItem(i.id)}
                    ajout={ajout}
                    pitch={i.id === 'yeast' ? pitch : undefined}
                  />
                  {inlineImpact && i.id === activeItem && (
                    <BrewMinerals recipe={recipe} state={state} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}

/** Une dose à la résolution de l'instrument, avec la virgule (« 25,8 », « 3,2 »). */
export const doseFr = f;

/**
 * Les ajouts de l'ébullition, du premier au dernier, pour la piste de l'horloge (z1) : la minute avant la fin, et s'ils sont versés.
 * Même règle que la liste (`BrewIngredients`) : un ajout dont l'heure réelle a été consignée suit l'horloge du brassin.
 */
export function boilAdditionPoints(recipe: RecipeSnapshot, state: BrewDayState): { id: string; nom: string; dose: number; unit: string; minute: number; done: boolean }[] {
  const duree = boilMinutes(state, recipe);
  return brewIngredients(recipe)
    .filter((i) => i.area === 'boil' && i.beforeEndMin != null && i.stepId !== 'whirlpool' && (i.planned > 0 || state.additions?.[i.id]))
    .map((i) => ({
      id: i.id,
      nom: i.name,
      dose: state.additions?.[i.id]?.amount ?? i.planned,
      unit: i.unit,
      minute: state.hopElapsedMin?.[i.id] != null ? Math.max(0, duree - state.hopElapsedMin[i.id]) : i.beforeEndMin!,
      done: state.additions?.[i.id]?.doneAt != null
    }))
    .sort((a, b) => b.minute - a.minute);
}

export function BrewMinerals({ recipe, state }: { recipe: RecipeSnapshot; state: BrewDayState }) {
  const result = mineralFeedback(recipe, state);
  if (!result || (!result.changed.length && !result.warnings.length)) return null;
  const { ions, warnings, added, extraRO, outside } = result;
  return (
    <aside
      aria-label="Impact des quantités réelles"
      className={`p-3 rounded-control border ${warnings.length ? 'border-ebc-straw/50 bg-ebc-straw/5' : 'border-hop/40 bg-cave-900'}`}
      aria-live="polite"
    >
      <h3
        className={`text-sm font-semibold ${warnings.length ? 'text-ebc-straw' : 'text-cave-50'}`}
      >
        {warnings.length
          ? 'Écart à examiner'
          : outside.length
            ? 'Écart au profil visé'
            : 'Profil minéral recalculé'}
      </h3>
      <p className="text-2xs text-cave-400">
        {result.knownBase
          ? 'Projection avec tous les ajouts de la liste'
          : 'Apports des sels seuls : analyse de départ absente, les teneurs totales seront plus élevées'}
        {added ? ' · écart déjà versé' : ''}.
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-2xs reading text-cave-200 my-1">
        {(['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const).map((k) => (
          <span key={k}>
            {
              {
                ca: 'Ca',
                mg: 'Mg',
                na: 'Na',
                so4: 'SO₄',
                cl: 'Cl',
                hco3: 'HCO₃'
              }[k]
            }{' '}
            {Math.round(ions[k])} ppm
          </span>
        ))}
      </div>
      {warnings.map((w) => (
        <p key={w} className="text-2xs text-ebc-straw">
          {w}
        </p>
      ))}
      <details className="text-2xs">
        <summary className="min-h-9 flex items-center cursor-pointer text-cave-200">
          Repères et options à la cuve ⌄
        </summary>
        {outside.length > 0 && (
          <p className="text-2xs text-cave-200">
            Hors cible :{' '}
            {outside
              .map((k) => ({ ca: 'Ca', mg: 'Mg', na: 'Na', so4: 'SO₄', cl: 'Cl' })[k])
              .join(', ')}
            . Un écart de style ne signifie pas un défaut certain.
          </p>
        )}
        {result.changed.length > 0 && (
          <p className="text-2xs text-cave-200 mt-1">
            {warnings.length
              ? 'Le profil dérive ; ces chiffres ne suffisent pas à déclarer le brassin perdu.'
              : 'Ces quantités seules ne signalent pas un brassin perdu.'}{' '}
            {added
              ? 'Les sels déjà versés ne se retirent pas avec de l’acide.'
              : 'Si ce n’est pas encore versé, corrige la pesée.'}
          </p>
        )}
        {added && extraRO > 0 && result.knownBase && (
          <p className="text-2xs text-cave-200 mt-1">
            Dilution théorique : au moins +{nombreFr(extraRO, 1)} L d’osmosée pour retrouver les repères
            indiqués. Cela dilue aussi le moût : vérifie capacité, densité et saveur avant d’agir.
          </p>
        )}
        {result.style && (
          <p className="text-2xs text-cave-400 mt-1">
            Profil {result.style.name} · Mg {result.style.ions.mg.min}–{result.style.ions.mg.max}{' '}
            ppm · SO₄ {result.style.ions.so4.min}–{result.style.ions.so4.max} · Cl{' '}
            {result.style.ions.cl.min}–{result.style.ions.cl.max}
          </p>
        )}
      </details>
    </aside>
  );
}
