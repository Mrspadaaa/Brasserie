import React, { useState } from 'react';
import { BrewDayState, RecipeSnapshot, StockItem } from '../types';
import {
  actualAmount,
  BrewArea,
  BrewIngredient,
  brewIngredients,
  maltAlternatives,
  effectiveFermentables,
  mineralFeedback
} from '../domain/brewCompanion';
import { BrewUpdate, brewControl, brewInput } from './BrewDayMeasurements';
import { NumberInput } from './NumberInput';
import { Units } from '../services/units';
import { useHoldRepeat } from './numericInput';

const f = (n: number) => new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 2 }).format(n);
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
  const [replacementName, setReplacementName] = useState('');
  const named = actual?.replacement?.name ?? item.name;
  const patch = (p: Partial<NonNullable<BrewDayState['additions']>[string]>) => {
    onInteract();
    update((s) => ({
      ...s,
      additions: {
        ...s.additions,
        [item.id]: { amount: actualAmount(item, s), ...s.additions?.[item.id], ...p }
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
  return (
    <div className="py-1.5 border-b border-cave-800 last:border-0">
      <div className="flex gap-2 items-start">
        <label
          className="min-h-11 w-8 shrink-0 flex items-center justify-center"
          title="Cocher après l’ajout réel"
        >
          <input
            type="checkbox"
            aria-label={`Ajouté : ${named}`}
            checked={actual?.doneAt != null}
            onChange={(e) => {
              onInteract();
              if (e.target.checked) patch({ doneAt: Date.now() });
              else
                update((s) => {
                  const a = { amount: actualAmount(item, s), ...s.additions?.[item.id] };
                  delete a.doneAt;
                  return { ...s, additions: { ...s.additions, [item.id]: a } };
                });
            }}
            className="accent-ebc-straw w-5 h-5"
          />
        </label>
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-semibold leading-tight ${actual?.doneAt != null ? 'text-cave-400' : 'text-cave-50'}`}
          >
            {named}
          </div>
          <p className="text-2xs text-cave-400">
            Prévu {f(item.planned)} {item.unit}
            {item.side ? ` · ${item.side === 'mash' ? 'empâtage' : 'rinçage'}` : ''}
            {item.beforeEndMin != null
              ? ` · ${item.beforeEndMin} min avant la fin`
              : item.kind === 'hop'
                ? ` · ${item.stepId === 'fwh' ? 'premier moût' : 'whirlpool'}`
                : ''}
            {actual?.doneAt != null ? ' · ajouté' : ''}
            {fermentable?.kind === 'grain' && (
              <button
                type="button"
                className="min-h-8 text-2xs text-water underline ml-2"
                onClick={() => setAlternatives((v) => !v)}
              >
                Remplacer ce malt
              </button>
            )}
          </p>
          {item.kind === 'water' && recipe.waterPlan && (
            <p className="text-2xs text-cave-200">
              {(() => {
                const pct =
                  item.side === 'mash'
                    ? recipe.waterPlan.diRatioPct
                    : (recipe.waterPlan.spargeDiRatioPct ?? recipe.waterPlan.diRatioPct);
                return (
                  f(amount * (1 - (pct ?? 0) / 100)) +
                  ' L réseau + ' +
                  f((amount * (pct ?? 0)) / 100) +
                  ' L osmosée'
                );
              })()}
            </p>
          )}
          {shortage && (
            <p className="text-2xs text-ebc-straw">
              Stock indiqué : {f(availableQty!)} {item.unit}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center">
            {(item.kind === 'salt' || item.kind === 'acid') && (
              <button
                type="button"
                {...press(-rung)}
                aria-label={`Diminuer ${named}`}
                className="w-7 h-11 text-cave-200 bg-cave-850 rounded-l-control"
              >
                −
              </button>
            )}
            <NumberInput
              value={amount}
              min={0}
              max={100000}
              onValue={(n: number) => {
                if (Number.isFinite(n) && n >= 0 && n <= 100000) patch({ amount: n });
              }}
              aria-label={`Quantité réelle de ${named}${item.side ? ' au ' + item.side : ''}`}
              className={`${brewInput} !w-16 !px-1 text-center`}
            />
            {(item.kind === 'salt' || item.kind === 'acid') && (
              <button
                type="button"
                {...press(rung)}
                aria-label={`Augmenter ${named}`}
                className="w-7 h-11 text-cave-200 bg-cave-850 rounded-r-control"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>
      {fermentable?.kind === 'grain' && (
        <div className="pl-10">
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
  overview = false
}: {
  recipe: RecipeSnapshot;
  state: BrewDayState;
  stock?: StockItem[];
  area: BrewArea;
  update: BrewUpdate;
  overview?: boolean;
}) {
  const [extra, setExtra] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const items = brewIngredients(recipe);
  const shown = items.filter(
    (i) =>
      (overview || i.area === area || (area === 'mash' && i.kind === 'grain')) &&
      (i.planned > 0 || state.additions?.[i.id] || extra.includes(i.id))
  );
  const inlineImpact = shown.some(
    (i) => i.id === activeItem && ['salt', 'acid', 'water'].includes(i.kind)
  );
  return (
    <section
      aria-label="Ingrédients à ajouter"
      className="rounded-panel border border-cave-700 bg-cave-900 px-2 sm:px-3"
    >
      <div className="flex items-center justify-between py-2">
        <h2 className="text-base font-semibold text-cave-50">
          {overview ? 'Tous les ingrédients' : 'À peser · à ajouter'}
        </h2>
        <span className="text-2xs text-cave-400">Cocher après ajout</span>
      </div>
      {(area === 'preparation' || overview) && !inlineImpact && (
        <BrewMinerals recipe={recipe} state={state} />
      )}
      {shown.map((i) => (
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
          {inlineImpact && i.id === activeItem && <BrewMinerals recipe={recipe} state={state} />}
        </React.Fragment>
      ))}
      {area === 'preparation' && !overview && (
        <label className="block text-2xs text-cave-200 py-2">
          Ajout non prévu
          <select
            aria-label="Autre sel ou acide à consigner"
            value=""
            onChange={(e) => setExtra((v) => [...v, e.target.value])}
            className={`${brewInput} mt-1`}
          >
            <option value="">Choisir un ajout…</option>
            {items
              .filter(
                (i) => (i.kind === 'salt' || i.kind === 'acid') && !shown.some((s) => s.id === i.id)
              )
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · {i.side === 'mash' ? 'empâtage' : 'rinçage'}
                </option>
              ))}
          </select>
        </label>
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
            {{ ca: 'Ca', mg: 'Mg', na: 'Na', so4: 'SO₄', cl: 'Cl', hco3: 'HCO₃' }[k]}{' '}
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
