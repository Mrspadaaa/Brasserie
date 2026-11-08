import { Input } from './Input';
import { brewNow } from '../services/brewClock';
import React, { useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  Droplets,
  Wheat,
  Flower2,
  FlaskConical,
  Clock3
} from 'lucide-react';
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
      <input
        type="datetime-local"
        className={`${brewInput} mt-1 max-w-full`}
        aria-label={`Date et heure réelles d’ajout de ${name}`}
        aria-invalid={!!raw && !valid}
        value={raw}
        max={localAdditionTime(brewNow())}
        onChange={(event) => setRaw(event.currentTarget.value)}
      />
    </label>
    {/* VI-8 (rejeu b47cd90b n° 8) : éteint, le bouton était un gris sur gris sans raison lisible ; il dit ce qui manque, et allumé il se lit comme une action. */}
    <button type="button" className={`${brewControl} brew-consign`} disabled={!valid || raw === localAdditionTime(doneAt)}
      onClick={() => { if (valid && at <= brewNow()) onConfirm(at); }}>
      Consigner à cette heure
    </button>
    {!raw && <p className="brew-consign-hint">Choisis d’abord la date et l’heure réelles.</p>}
    {!!raw && !valid && <p role="alert" className="basis-full text-xs text-alert-strong">Choisis une date et une heure valides, au plus tard maintenant.</p>}
  </div>;
}

function IngredientRow({
  item,
  recipe,
  state,
  stock,
  update,
  onInteract
}: {
  item: BrewIngredient;
  recipe: RecipeSnapshot;
  state: BrewDayState;
  stock: StockItem[];
  update: BrewUpdate;
  onInteract: () => void;
}) {
  const actual = state.additions?.[item.id];
  const pitchActualUnknown = item.id === 'yeast' && state.pitchedAt != null &&
    (actual?.amount == null || !(actual.unit ?? item.unit));
  const pitchPlannedUnknown = item.id === 'yeast' && state.pitchedAt == null && !(item.planned > 0) && !(Number.isFinite(actual?.amount) && actual!.amount > 0);
  const amount = pitchActualUnknown || pitchPlannedUnknown ? undefined : actualAmount(item, state);
  const controlAmount = amount ?? (item.planned > 0 ? item.planned : 0);
  const [alternatives, setAlternatives] = useState(false);
  const [editingDose, setEditingDose] = useState(false);
  const [replacementName, setReplacementName] = useState('');
  const named = actual?.replacement?.name ?? item.name;
  const patch = (p: Partial<NonNullable<BrewDayState['additions']>[string]>) => {
    onInteract();
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
      return { ...s, additions: { ...s.additions, [item.id]: { amount: actualAmount(item, s) ?? item.planned, ...existing, ...p } } };
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
  return (
    <div className={`brew-ingredient ${actual?.doneAt != null ? 'is-added' : ''}`}>
      <div className="brew-ingredient-heading">
        <div className="brew-ingredient-name">
          <strong>{named}</strong>
          {item.id === 'yeast' && (pitchActualUnknown
            ? <span>{state.pitchQuantityConfirmation === 'unmeasured' ? 'Réel non mesuré' : state.pitchQuantityConfirmation === 'starter-transferred' ? 'Starter transféré · volume non relevé' : 'Réel non renseigné'} · prévu {item.planned > 0 ? `${f(item.planned, item.unit)} ${item.unit}` : 'absent'}</span>
            : pitchPlannedUnknown
              ? <span>Quantité prévue absente ou nulle · saisis le réel dans le guide Levure</span>
              : null)}
          {changed && (
            <span>
              Prévu {f(item.planned, item.unit)} {item.unit}
              <em>
                Écart {amount > item.planned ? '+' : ''}
                {f(amount - item.planned, item.unit)} {item.unit}
              </em>
            </span>
          )}
        </div>
        {fermentable?.kind === 'grain' && (
          <button
            type="button"
            className="brew-replace-button"
            aria-label="Remplacer ce malt"
            title="Remplacer ce malt"
            aria-expanded={alternatives}
            onClick={() => setAlternatives((v) => !v)}
          >
            <ArrowLeftRight size={17} />
            <span>Remplacer</span>
          </button>
        )}
      </div>
      {item.kind === 'water' && recipe.waterPlan && (
        <div className="brew-water-split">
          <Droplets size={15} />
          {(() => {
            const split = actualWater(recipe, state, item.side ?? 'mash');
            if (split.invalidMix)
              return (
                <span className="brew-feedback">
                  Coupe à revoir : {f(split.roL)} L d’osmosée dépassent le total de{' '}
                  {f(split.litres)} L. Corrige la coupe dans l’aide.
                </span>
              );
            return (
              <>
                <span>
                  <strong>{f(split.tapL)} L</strong> réseau
                </span>
                <span>+</span>
                <span>
                  <strong>{f(split.roL)} L</strong> osmosée
                </span>
              </>
            );
          })()}
        </div>
      )}
      <div className="brew-ingredient-controls">
        <button
          type="button"
          className="brew-amount"
          aria-label={`Modifier la quantité de ${named}${item.side ? ' au ' + item.side : ''}`}
          aria-describedby={`brew-dose-value-${item.id} brew-dose-unit-${item.id}`}
          aria-expanded={editingDose}
          disabled={pitchActualUnknown}
          onClick={() => setEditingDose((value) => !value)}
        >
          <strong id={`brew-dose-value-${item.id}`}>{pitchActualUnknown ? 'Non renseignée' : pitchPlannedUnknown ? 'À préciser' : f(amount ?? 0, item.unit)}</strong>{' '}
          <span id={`brew-dose-unit-${item.id}`}>{pitchActualUnknown || pitchPlannedUnknown && !item.unit ? '' : item.unit}{item.kind === 'water' ? ' à froid' : ''}</span>
        </button>
        <label className="brew-add-check" title="Cocher après l’ajout réel">
          <input
            type="checkbox"
            aria-label={`Ajouté : ${named}`}
            checked={actual?.doneAt != null || item.id === 'yeast' && state.pitchedAt != null}
            disabled={item.id === 'yeast' && state.pitchedAt != null}
            onChange={(e) => {
              onInteract();
              if (e.target.checked) patch({ doneAt: brewNow(), ...(item.kind === 'water' ? { volumeBasis: 'cold' as const } : {}) });
              else
                update((s) => {
                  const a = { amount: actualAmount(item, s) ?? item.planned, ...s.additions?.[item.id] };
                  delete a.doneAt;
                  return { ...s, additions: { ...s.additions, [item.id]: a } };
                });
            }}
          />
          <span className="brew-check-box" aria-hidden="true">
            {(actual?.doneAt != null || item.id === 'yeast' && state.pitchedAt != null) && <Check size={16} />}
          </span>
          <span className="sr-only">{state.pitchedAt != null && item.id === 'yeast' || actual?.doneAt != null ? 'Ajout consigné' : 'À ajouter'}</span>
        </label>
      </div>
      {editingDose && (
        <div className="brew-dose-edit" aria-label={`Ajuster ${named}`}>
          <div className="brew-dose" data-changed={changed || undefined}>
            {(item.kind === 'salt' || item.kind === 'acid') && (
              <button type="button" {...press(-rung)} aria-label={`Diminuer ${named}`}>
                −
              </button>
            )}
            <div className="brew-dose-value" onBlur={() => { seance.current = null; }}>
              <NumberInput
                value={amount}
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
                aria-label={`Quantité réelle de ${named}${item.side ? ' au ' + item.side : ''}`}
              />
              <span>{item.unit}</span>
            </div>
            {(item.kind === 'salt' || item.kind === 'acid') && (
              <button type="button" {...press(rung)} aria-label={`Augmenter ${named}`}>
                +
              </button>
            )}
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
          <AdditionTime key={actual?.doneAt ?? 'unconfirmed'} name={named} doneAt={actual?.doneAt}
            onConfirm={(doneAt) => patch({ doneAt, ...(item.kind === 'water' ? { volumeBasis: 'cold' as const } : {}) })} />
        </div>
      )}
      {actual?.doneAt != null && (
        <p className="brew-added-time">
          Ajout consigné le{' '}
          {new Date(actual.doneAt).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      )}
      {shortage && (
        <p className="brew-stock-hint">
          Stock indiqué : {f(availableQty!, item.unit)} {item.unit}
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
  );
}

export function BrewIngredients({
  recipe,
  state,
  stock = [],
  area,
  update,
  overview = false,
  now = brewNow(),
  stepId
}: {
  recipe: RecipeSnapshot;
  state: BrewDayState;
  stock?: StockItem[];
  area: BrewArea;
  update: BrewUpdate;
  overview?: boolean;
  now?: number;
  stepId?: string;
}) {
  const [extra, setExtra] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const items = brewIngredients(recipe);
  const forStep = (i: BrewIngredient) => {
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
  };
  const shown = items.filter(
    (i) => forStep(i) && (i.planned > 0 || state.additions?.[i.id] || extra.includes(i.id) || i.id === 'yeast' && (overview || area === 'finish' && stepId === 'ensemencement'))
  );
  const extraSaltOptions = items
    .filter((i) => (i.kind === 'salt' || i.kind === 'acid') && !shown.some((s) => s.id === i.id))
    .map((i) => ({
      value: i.id,
      label: i.name,
      group: i.side === 'mash' ? 'Eau d’empâtage' : 'Eau de rinçage',
      detail: i.side === 'mash' ? 'À l’empâtage' : 'Au rinçage'
    }));
  const inlineImpact = shown.some(
    (i) => i.id === activeItem && ['salt', 'acid', 'water'].includes(i.kind)
  );
  const groups = new Map<
    string,
    {
      label: string;
      hint: string;
      icon: typeof Droplets;
      items: BrewIngredient[];
      at?: number;
    }
  >();
  const end =
    state.boilStartedAt != null
      ? state.boilStartedAt + boilMinutes(state, recipe) * 60000
      : undefined;
  const areaOrder = { preparation: 0, mash: 1, boil: 2, finish: 3 };
  const ordered = shown
    .map((i) =>
      i.beforeEndMin != null && state.hopElapsedMin?.[i.id] != null
        ? {
            ...i,
            beforeEndMin: Math.max(0, boilMinutes(state, recipe) - state.hopElapsedMin[i.id])
          }
        : i
    )
    .sort(
      (a, b) =>
        (overview ? areaOrder[a.area] - areaOrder[b.area] : 0) ||
        (b.beforeEndMin ?? -1) - (a.beforeEndMin ?? -1)
    );
  for (const i of ordered) {
    const group = i.side
      ? {
          key: i.side,
          label: i.side === 'mash' ? 'Eau d’empâtage' : 'Eau de rinçage',
          hint: 'Eau et traitement à préparer ensemble',
          icon: Droplets
        }
      : i.beforeEndMin != null
        ? {
            key: `boil-${i.beforeEndMin}`,
            label:
              i.beforeEndMin === 0 ? 'À la coupure du feu' : `${i.beforeEndMin} min avant la fin`,
            hint: 'Ébullition',
            icon: Clock3
          }
        : i.kind === 'grain'
          ? {
              key: 'grain',
              label: recipe.nolo?.process === 'coldExtraction' ? 'Grains à extraire' : 'Grains à l’empâtage',
              hint: 'Pesée et concassage',
              icon: Wheat
            }
          : i.kind === 'hop'
            ? {
                key: i.stepId,
                label: i.stepId === 'fwh' ? 'Premier moût' : 'Whirlpool',
                hint:
                  i.stepId === 'fwh'
                    ? 'Avant de recueillir le moût'
                    : 'À la température de consigne',
                icon: Flower2
              }
            : {
                key: i.area,
                label: i.id === 'yeast' ? 'Levure et ensemencement' : 'Autres ingrédients',
                hint: 'Selon la recette',
                icon: FlaskConical
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
  return (
    <section aria-label="Ingrédients à ajouter" className="brew-ingredients">
      <div className="brew-section-heading">
        <h2>
          {overview
            ? 'Tous les ingrédients'
            : area === 'boil' && stepId !== 'whirlpool'
              ? 'Programme des ajouts'
              : 'Ingrédients'}
        </h2>
        {/*
          « 0/0 ajoutés » ne dit rien. Un compteur de zéro sur zéro occupe une
          pastille pour annoncer l'absence de sujet, alors que le message
          « Pas d'ingrédient prévu à cette phase » le dit déjà, en français.
          Le compteur n'apparaît que s'il y a quelque chose à compter.
        */}
        {shown.length > 0 && (
          <span className="brew-count">
            {shown.filter((i) => state.additions?.[i.id]?.doneAt != null || i.id === 'yeast' && state.pitchedAt != null).length}/{shown.length}{' '}
            ajoutés
          </span>
        )}
      </div>
      {shown.length > 0 && <p className="brew-ingredient-help">Cocher après ajout en cuve.</p>}
      {(area === 'preparation' || overview) && !inlineImpact && (
        <BrewMinerals recipe={recipe} state={state} />
      )}
      {[...groups.entries()].map(([key, group]) => {
        const allAdded = group.items.every((i) => state.additions?.[i.id]?.doneAt != null);
        const due =
          !allAdded && group.at != null && group.at <= now && state.boilFinishedAt == null;
        const Icon = group.icon;
        return (
          <div key={key} className={`brew-ingredient-group ${due ? 'is-due' : ''}`}>
            <div className="brew-ingredient-group-heading">
              <Icon size={19} />
              <div>
                <h3>{group.label}</h3>
                {key === 'sparge' && (
                  <span className="brew-water-temperature">
                    Consigne {String(recipe.mash?.spargeTempC ?? 76).replace('.', ',')} °C
                  </span>
                )}
                {group.label === 'Premier moût' && <span>{group.hint}</span>}
              </div>
              {allAdded ? (
                <BrewTag tone="done">{group.items.length > 1 ? 'Ajoutés' : 'Ajouté'}</BrewTag>
              ) : group.at != null && state.boilFinishedAt == null ? (
                <BrewTag tone={due ? 'due' : 'info'}>
                  {due
                    ? 'Maintenant'
                    : new Date(group.at).toLocaleTimeString('fr-CH', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                </BrewTag>
              ) : null}
            </div>
            {group.items.map((i) => (
              <React.Fragment key={i.id}>
                <IngredientRow
                  key={i.id}
                  item={i}
                  recipe={recipe}
                  state={state}
                  stock={stock}
                  update={update}
                  onInteract={() => setActiveItem(i.id)}
                />
                {inlineImpact && i.id === activeItem && (
                  <BrewMinerals recipe={recipe} state={state} />
                )}
              </React.Fragment>
            ))}
          </div>
        );
      })}
      {area === 'preparation' && stepId !== 'concassage' && !overview && (extraSaltOptions.length ? (
        <div className="brew-extra-addition">
          <BrewChoice
            label="Autre sel ou acide à consigner"
            title="Ajouter un sel ou un acide"
            placeholder="Ajouter un produit non prévu"
            value=""
            searchable
            onChange={(value) => setExtra((v) => [...v, value])}
            options={extraSaltOptions}
          />
        </div>
      ) : (
        // BR-52, BE-33 (08.11) : sans sel ni acide au plan, le sélecteur s'ouvrait sur « Aucun ingrédient correspondant » : une impasse. On le dit au lieu de l'offrir.
        <p className="text-sm text-cave-400">Aucun autre sel ni acide à ajouter : le plan d’eau de cette recette n’en prévoit pas.</p>
      ))}
      {!shown.length && (
        <p className="text-sm text-cave-400 pb-2">Pas d’ingrédient prévu à cette phase.</p>
      )}
    </section>
  );
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
