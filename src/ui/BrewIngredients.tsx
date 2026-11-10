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
import { amountDecimals, roundAmount } from '../../functions/src/brewAmount';
import { actualQuantityMax, actualQuantityProblem, actualQuantityRounded } from '../domain/brewQuantityBounds';
import { nombreFr } from '../domain/nombreAffiche';

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

/** Ce que la ligne d'ajout de l'ébullition porte en plus : minute, heure, et son rang (prochain, dû). */
interface AjoutLigne {
  minute: number;
  quand: React.ReactNode;
  prochain: boolean;
  du: boolean;
}

/**
 * p3 (n° 4) : le choix explicite de la quantité de levure réellement ajoutée, dans l'éditeur de la ligne Levure (colonne principale).
 * `token` change à chaque toucher du pied « J'ai ajouté la levure » sans choix : l'éditeur s'ouvre alors, sous les yeux.
 */
export interface PitchEditor {
  mode?: PitchQuantityChoice['mode'];
  options: { mode: PitchQuantityChoice['mode']; label: string }[];
  onMode: (mode: PitchQuantityChoice['mode']) => void;
  token: number;
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
  const [editingDose, setEditingDose] = useState(false);
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
  const changed = amount != null && Math.abs(amount - item.planned) > 0.001;
  const checked = actual?.doneAt != null || (item.id === 'yeast' && state.pitchedAt != null);
  const doseLabel = pitchActualUnknown ? 'Non renseignée' : pitchPlannedUnknown ? 'À préciser' : f(amount ?? 0, item.unit);
  const doseUnit = `${pitchActualUnknown || (pitchPlannedUnknown && !item.unit) ? '' : item.unit}${item.kind === 'water' ? ' à froid' : ''}`;
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
      {doseUnit && ' '}
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
      data-du={ajout?.du ? '' : undefined}
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
          : pitchPlannedUnknown
            ? <small>Quantité prévue absente ou nulle · saisis le réel dans le guide Levure</small>
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
      <label className="bz-case" title="Cocher après l’ajout réel">
        <input
          type="checkbox"
          aria-label={`Ajouté : ${nom}`}
          checked={checked}
          disabled={item.id === 'yeast' && state.pitchedAt != null}
          onChange={(e) => {
            onInteract();
            // Cocher une levure dont la quantité est inconnue ouvre la saisie de la quantité (Mesurée / Sans mesure) au lieu d'envoyer un ajout invalide.
            if (e.target.checked && (pitchPlannedUnknown || !Number.isFinite(actual?.amount ?? actualAmount(item, state)))) { setEditingDose(true); return; }
            if (e.target.checked) patch({ doneAt: brewNow(), ...(item.kind === 'water' ? { volumeBasis: 'cold' as const } : {}) });
            else
              update((s) => {
                const a = { amount: actualAmount(item, s) ?? item.planned, ...s.additions?.[item.id] };
                delete a.doneAt;
                return { ...s, additions: { ...s.additions, [item.id]: a } };
              });
          }}
        />
        <span className="bz-case-boite" aria-hidden="true">{checked && <Check size={18} strokeWidth={3} />}</span>
        <span className="sr-only">{checked ? 'Ajout consigné' : 'À ajouter'}</span>
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
            <div className="bz-levure-choix" role="radiogroup" aria-label="Quantité de levure réellement ajoutée" data-sans-choix={pitch!.mode ? undefined : ''}>
              {pitch!.options.map((o) => (
                <button
                  key={o.mode}
                  type="button"
                  role="radio"
                  aria-checked={pitch!.mode === o.mode}
                  onClick={() => { onInteract(); pitch!.onMode(o.mode); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
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
          <div className="brew-dose" data-changed={changed || undefined}>
            <button type="button" {...press(-rung)} aria-label={`Diminuer ${nom}`}>
              −
            </button>
            <div className="brew-dose-value" onBlur={() => { seance.current = null; }}>
              <NumberInput
                // « Mesurée » : le champ reste vide tant que rien n'a été mesuré (la dose prévue n'est jamais présentée comme mesurée).
                value={pitchChoosing && pitch!.mode === 'measured' && actual?.amount == null ? undefined : amount}
                placeholder={pitchChoosing && pitch!.mode === 'measured' ? 'Mesure' : undefined}
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
              <span>{item.unit}</span>
            </div>
            <button type="button" {...press(rung)} aria-label={`Augmenter ${nom}`}>
              +
            </button>
          </div>
          {quantityProblem && <p role="alert" className="text-xs text-alert-strong">{quantityProblem}</p>}
          {item.id === 'yeast' && !item.unit && <label className="block space-y-1 text-xs text-cave-400">Unité réelle
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
      (i.kind === 'grain' && (/^mash/.test(stepId) || stepId === 'nolo-extraction')) ||
      (i.side === 'sparge' && stepId === 'sparge') ||
      (i.area === 'mash' && (i.stepId === 'fwh' ? stepId === 'fwh' : /^mash/.test(stepId)))
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
  pitch
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
        const allAdded = group.items.every((i) => state.additions?.[i.id]?.doneAt != null);
        const due =
          !allAdded && group.at != null && group.at <= now && state.boilFinishedAt == null;
        const Icon = group.icon;
        const done = group.items.filter(isDone).length;
        const sideOptions = group.side && canAddExtra ? extraSaltOptions.filter((o) => o.side === group.side) : [];
        const prochain = group.ajouts ? group.items.find((i) => !isDone(i)) : undefined;
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
                {done}/{group.items.length}
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
                const at = end != null ? Math.max(state.boilStartedAt!, end - i.beforeEndMin * 60000) : undefined;
                const finished = isDone(i);
                const next = prochain?.id === i.id;
                const doneAt = state.additions?.[i.id]?.doneAt;
                // Plancher, comme l'horloge (1 h 14) et le bandeau : une échéance ne s'écrit pas avec deux arrondis.
                const reste = at != null ? at - now : undefined;
                const minutes = reste != null ? Math.floor(reste / 60000) : undefined;
                ajout = {
                  minute: i.beforeEndMin,
                  prochain: next && boilRunning,
                  du: next && boilRunning && reste != null && reste <= 0,
                  quand: finished
                    ? doneAt != null ? <span className="bz-m">{heureCuve(doneAt)}</span> : null
                    : !boilRunning || at == null
                      ? null
                      : next
                        ? reste! <= 0
                          ? <b>maintenant</b>
                          : minutes === 0
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
export function boilAdditionPoints(recipe: RecipeSnapshot, state: BrewDayState): { id: string; minute: number; done: boolean }[] {
  const duree = boilMinutes(state, recipe);
  return brewIngredients(recipe)
    .filter((i) => i.area === 'boil' && i.beforeEndMin != null && i.stepId !== 'whirlpool' && (i.planned > 0 || state.additions?.[i.id]))
    .map((i) => ({
      id: i.id,
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
