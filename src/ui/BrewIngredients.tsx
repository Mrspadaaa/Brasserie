import { brewNow } from '../services/brewClock';
import React, { useState } from 'react';
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

const f = (n: number) => new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 3 }).format(n);
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
  const amount = actualAmount(item, state);
  const [alternatives, setAlternatives] = useState(false);
  const [editingDose, setEditingDose] = useState(false);
  const [replacementName, setReplacementName] = useState('');
  const named = actual?.replacement?.name ?? item.name;
  const patch = (p: Partial<NonNullable<BrewDayState['additions']>[string]>) => {
    onInteract();
    update((s) => ({
      ...s,
      additions: {
        ...s.additions,
        [item.id]: {
          amount: actualAmount(item, s),
          ...s.additions?.[item.id],
          ...p
        }
      }
    }));
  };
  const rung = item.kind === 'salt' || item.kind === 'acid' ? 0.1 : item.unit === 'kg' ? 0.1 : 1;
  const press = useHoldRepeat(
    amount,
    (amount: number) => patch({ amount }),
    (v, d) => Math.max(0, Math.min(100000, Math.round((v + d) * 100) / 100))
  );
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
      .reduce((sum, i) => sum + (Units.convert(actualAmount(i, state), i.unit, x.unit) ?? 0), 0);
    return { ...x, currentStock: Math.max(0, x.currentStock - reserved) };
  });
  const choices = fermentable ? maltAlternatives(fermentable, amount, unreserved) : [];
  const available = unreserved.find(
    (s) => s.name.trim().toLowerCase() === named.trim().toLowerCase()
  );
  const availableQty = available
    ? Units.convert(available.currentStock, available.unit, item.unit)
    : null;
  const shortage = availableQty != null && availableQty < amount;
  const changed = Math.abs(amount - item.planned) > 0.001;
  return (
    <div className={`brew-ingredient ${actual?.doneAt != null ? 'is-added' : ''}`}>
      <div className="brew-ingredient-heading">
        <div className="brew-ingredient-name">
          <strong>{named}</strong>
          {changed && (
            <span>
              Prévu {f(item.planned)} {item.unit}
              <em>
                Écart {amount > item.planned ? '+' : ''}
                {f(amount - item.planned)} {item.unit}
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
          onClick={() => setEditingDose((value) => !value)}
        >
          <strong id={`brew-dose-value-${item.id}`}>{f(amount)}</strong>{' '}
          <span id={`brew-dose-unit-${item.id}`}>{item.unit}</span>
        </button>
        <label className="brew-add-check" title="Cocher après l’ajout réel">
          <input
            type="checkbox"
            aria-label={`Ajouté : ${named}`}
            checked={actual?.doneAt != null}
            onChange={(e) => {
              onInteract();
              if (e.target.checked) patch({ doneAt: brewNow() });
              else
                update((s) => {
                  const a = { amount: actualAmount(item, s), ...s.additions?.[item.id] };
                  delete a.doneAt;
                  return { ...s, additions: { ...s.additions, [item.id]: a } };
                });
            }}
          />
          <span className="brew-check-box" aria-hidden="true">
            {actual?.doneAt != null && <Check size={16} />}
          </span>
          <span className="sr-only">{actual?.doneAt != null ? 'Ajouté' : 'À ajouter'}</span>
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
            <div className="brew-dose-value">
              <NumberInput
                value={amount}
                min={0}
                max={100000}
                emptyValue={undefined}
                onValue={(n) => {
                  if (Number.isFinite(n) && n >= 0 && n <= 100000) patch({ amount: n });
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
          <button type="button" className="brew-text-button" onClick={() => setEditingDose(false)}>
            Fermer l’ajustement
          </button>
        </div>
      )}
      {actual?.doneAt != null && (
        <p className="brew-added-time">
          Ajout consigné à{' '}
          {new Date(actual.doneAt).toLocaleTimeString('fr-CH', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}
      {shortage && (
        <p className="brew-stock-hint">
          Stock indiqué : {f(availableQty!)} {item.unit}
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
                  {c.item.name} · {f(c.kg)} kg
                  <span className="block text-2xs text-cave-400">
                    {c.exact ? 'Potentiel d’extrait compensé' : 'Poids égal, potentiel à vérifier'}{' '}
                    · {c.item.colorEbc} EBC · {f(c.availableKg)} kg disponibles
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
            <form
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
              <input
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
        (i.kind === 'grain' && /^mash/.test(stepId)) ||
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
    (i) => forStep(i) && (i.planned > 0 || state.additions?.[i.id] || extra.includes(i.id))
  );
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
              label: 'Grains à l’empâtage',
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
        <span className="brew-count">
          {shown.filter((i) => state.additions?.[i.id]?.doneAt != null).length}/{shown.length}{' '}
          ajoutés
        </span>
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
                    Consigne {recipe.mash?.spargeTempC ?? 76} °C
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
      {area === 'preparation' && stepId !== 'concassage' && !overview && (
        <div className="brew-extra-addition">
          <BrewChoice
            label="Autre sel ou acide à consigner"
            title="Ajouter un sel ou un acide"
            placeholder="Ajouter un produit non prévu"
            value=""
            searchable
            onChange={(value) => setExtra((v) => [...v, value])}
            options={items
              .filter(
                (i) => (i.kind === 'salt' || i.kind === 'acid') && !shown.some((s) => s.id === i.id)
              )
              .map((i) => ({
                value: i.id,
                label: i.name,
                group: i.side === 'mash' ? 'Eau d’empâtage' : 'Eau de rinçage',
                detail: i.side === 'mash' ? 'À l’empâtage' : 'Au rinçage'
              }))}
          />
        </div>
      )}
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
            Dilution théorique : au moins +{extraRO} L d’osmosée pour retrouver les repères
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
