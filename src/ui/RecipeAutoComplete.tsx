import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Fermentable, HopIngredient, YeastSpec, StockItem } from '../types';
import { AiClient } from '../services/aiClient';
import {
  IngredientFacts,
  IngredientGap,
  LearnIngredient,
  ingredientGaps,
  ingredientKey,
  applyMaltFacts,
  applyHopFacts,
  applyYeastFacts,
  factsForStock,
  factsFromStock,
  sanitizeFacts,
  fillsGap
} from '../domain/ingredientFacts';

/**
 * Compléter TOUTE la fiche d'un coup, avec l'IA.
 *
 * ⚠️ Ce que ça règle : `AiAssist` existe déjà, mais un bouton par ingrédient.
 * Sur une recette de quatre malts, six houblons et une levure, c'est onze
 * recherches à lancer une par une, en remontant le fil d'étapes entre chaque —
 * et il suffit d'en oublier une pour que l'OG ou la couleur restent
 * « incalculables » jusqu'à la fin.
 *
 * Trois règles reprises telles quelles d'`AiAssist`, parce que ce sont elles qui
 * séparent une donnée RETROUVÉE d'une donnée inventée :
 *
 *   1. la recherche est **ancrée sur Google** côté serveur — les valeurs
 *      viennent des fiches des fabricants ;
 *   2. la **source est affichée**, ligne par ligne ;
 *   3. **rien n'est écrit** avant que Gaëtan ait vu ce qui va l'être.
 *
 * ⚠️ On ne remplit QUE les cases vides. Un chiffre saisi à la main gagne toujours
 * contre un chiffre retrouvé : le brasseur a le lot devant lui, le modèle a une
 * fiche produit générique. Un houblon a l'alpha de SON sachet, pas celui de la
 * variété.
 */

interface Found extends IngredientGap {
  facts: IngredientFacts;
}
interface RecipeAutoCompleteProps {
  fermentables: Fermentable[];
  onFermentables: (v: Fermentable[]) => void;
  hops: HopIngredient[];
  onHops: (v: HopIngredient[]) => void;
  yeast: YeastSpec;
  onYeast: (v: YeastSpec) => void;
  onLearnIngredient?: LearnIngredient;
  stockItems?: StockItem[];
}

export const RecipeAutoComplete: React.FC<RecipeAutoCompleteProps> = ({
  fermentables,
  onFermentables,
  hops,
  onHops,
  yeast,
  onYeast,
  onLearnIngredient,
  stockItems = []
}) => {
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Found[] | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const gaps = useMemo(
    () => ingredientGaps(fermentables, hops, yeast),
    [fermentables, hops, yeast]
  );

  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
    },
    []
  );

  const search = async () => {
    const id = ++request.current;
    setBusy(true);
    setError(null);
    setFound(null);
    setMissed([]);
    // Three requests at most at once; identical names share one lookup.
    const queue = [...gaps];
    const ok: Found[] = [];
    const ko: string[] = [];
    let failure: string | undefined;
    try {
      await Promise.all(
        Array.from({ length: Math.min(3, queue.length) }, async () => {
          while (queue.length && request.current === id) {
            const gap = queue.shift()!;
            try {
              const item = stockItems.find(
                (s) =>
                  ingredientKey(gap.kind, s.name) === gap.key &&
                  s.category.toLocaleLowerCase('fr') === gap.kind
              );
              const cached = item && factsFromStock(item);
              const remaining =
                cached &&
                ingredientGaps(
                  gap.kind === 'malt'
                    ? fermentables
                        .filter((f) => ingredientKey('malt', f.name) === gap.key)
                        .map((f) => applyMaltFacts(f, cached))
                    : [],
                  gap.kind === 'houblon'
                    ? hops
                        .filter((h) => ingredientKey('houblon', h.name) === gap.key)
                        .map((h) => applyHopFacts(h, cached))
                    : [],
                  gap.kind === 'levure'
                    ? applyYeastFacts(yeast, cached)
                    : ({ name: '' } as YeastSpec)
                );
              if (cached && remaining?.length === 0) {
                ok.push({ ...gap, facts: cached });
                continue;
              }
              const res = await AiClient.run<IngredientFacts>({
                task: 'lookupIngredient',
                tier: 'fast',
                instruction: gap.kind + ' : ' + gap.name.trim(),
                context: { kind: gap.kind, name: gap.name.trim(), manquant: gap.missing }
              });
              if (res.ok && res.data?.found && fillsGap(gap, res.data)) {
                ok.push({ ...gap, facts: sanitizeFacts(res.data) });
              } else {
                ko.push(gap.name);
                failure ||= res.error;
              }
            } catch {
              ko.push(gap.name);
              failure = 'Recherche interrompue. Tu peux réessayer.';
            }
          }
        })
      );
      if (request.current !== id) return;
      setMissed(ko);
      if (ok.length) setFound(ok);
      else setError(failure ?? 'Rien de publié retrouvé pour ces ingrédients.');
    } finally {
      if (request.current === id) setBusy(false);
    }
  };

  const apply = () => {
    if (!found) return;
    const byKey = new Map(found.map((f) => [f.key, f]));
    const accepted = new Set<string>();
    const nextFerms = fermentables.map((f) => {
      const result = byKey.get(ingredientKey('malt', f.name));
      if (!result || f.kind !== 'grain') return f;
      accepted.add(result.key);
      return applyMaltFacts(f, result.facts);
    });
    const nextHops = hops.map((h) => {
      const result = byKey.get(ingredientKey('houblon', h.name));
      if (!result) return h;
      accepted.add(result.key);
      return applyHopFacts(h, result.facts);
    });
    const yeastResult = byKey.get(ingredientKey('levure', yeast.name));
    if (yeastResult) accepted.add(yeastResult.key);
    onFermentables(nextFerms);
    onHops(nextHops);
    onYeast(yeastResult ? applyYeastFacts(yeast, yeastResult.facts) : yeast);
    found
      .filter((f) => accepted.has(f.key))
      .forEach((f) => onLearnIngredient?.(f.name, factsForStock(f.kind, f.facts)));
    setFound(null);
    setError(null);
  };

  // Rien à compléter : le bouton n'a pas lieu d'être. C'est aussi le signal que
  // la fiche est prête.
  if (gaps.length === 0 && !found && !error) return null;

  return (
    <section className="panel p-2.5 sm:p-3 space-y-2 border-ebc-straw/30">
      {!found && (
        <>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-ebc-straw shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-cave-300 leading-snug">
              {gaps.length} ingrédient{gaps.length > 1 ? 's' : ''} incomplet
              {gaps.length > 1 ? 's' : ''} :{' '}
              <span className="text-cave-400">
                {gaps.map((g) => `${g.name} (${g.missing.join(', ')})`).join(' · ')}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={search}
            disabled={busy || gaps.length === 0}
            className="w-full min-h-[36px] sm:min-h-touch rounded-control bg-ebc-straw text-cave-950
                       text-xs sm:text-sm font-semibold flex items-center justify-center gap-2
                       disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recherche des fiches…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Tout compléter avec l’IA
              </>
            )}
          </button>
        </>
      )}

      {error && (
        <p className="flex items-start gap-2 text-xs sm:text-sm text-ebc-amber leading-snug">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error} — à saisir à la main.</span>
        </p>
      )}

      {found && (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-cave-300">
            {found.length} fiche{found.length > 1 ? 's' : ''} retrouvée
            {found.length > 1 ? 's' : ''}. Rien n’est écrit avant validation ; les valeurs déjà
            saisies ne bougent pas.
          </p>

          <ul className="divide-y divide-cave-850">
            {found.map((f) => (
              <li key={f.key} className="py-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm sm:text-base text-cave-100 truncate">
                    {f.facts.name}
                  </span>
                  <span className="reading text-xs sm:text-sm text-ebc-straw shrink-0">
                    {f.kind === 'malt' &&
                      [
                        f.missing.includes('couleur EBC') && f.facts.colorEbc != null
                          ? `${f.facts.colorEbc} EBC`
                          : null,
                        f.missing.includes('potentiel PPG') && f.facts.potentialPpg != null
                          ? `${f.facts.potentialPpg} PPG`
                          : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    {f.kind === 'houblon' && f.facts.alphaPct != null && `${f.facts.alphaPct} % AA`}
                    {f.kind === 'levure' &&
                      [
                        f.missing.includes('atténuation') && f.facts.attenuationPct != null
                          ? `${f.facts.attenuationPct} %`
                          : null,
                        f.missing.includes('température minimale') && f.facts.tempMinC != null
                          ? `mini ${f.facts.tempMinC} °C`
                          : null,
                        f.missing.includes('température maximale') && f.facts.tempMaxC != null
                          ? `maxi ${f.facts.tempMaxC} °C`
                          : null,
                        f.missing.includes('laboratoire') ? f.facts.lab : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                  </span>
                </div>
                {/* La source est le cœur du dispositif : sans elle, on ne
                    distinguerait pas une donnée retrouvée d'une inventée. */}
                <p className="text-2xs sm:text-sm text-cave-500 leading-snug truncate">
                  {f.facts.source}
                </p>
              </li>
            ))}
          </ul>

          {missed.length > 0 && (
            <p className="text-2xs sm:text-sm text-ebc-amber leading-snug">
              Rien trouvé pour : {missed.join(', ')}. À saisir à la main.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFound(null)}
              className="flex-1 min-h-[36px] sm:min-h-touch rounded-control border border-cave-700
                         text-cave-200 text-xs sm:text-sm"
            >
              Ignorer
            </button>
            <button
              type="button"
              onClick={apply}
              className="flex-1 min-h-[36px] sm:min-h-touch rounded-control bg-ebc-straw text-cave-950
                         text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Reprendre ces valeurs
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
