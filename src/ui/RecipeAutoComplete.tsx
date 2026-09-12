import { completeFromLocalReferences } from '../domain/localIngredientFacts';
import { resolveFermentationYeast } from '../domain/fermentationScenario';
import { yeastReferences } from '../domain/yeastReferences';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import { guideFermentations } from './hopIndex/guideData';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Fermentable, HopIngredient, YeastSpec, StockItem } from '../types';
import { AiClient } from '../services/aiClient';
import {
  IngredientFacts,
  IngredientGap,
  IngredientKind,
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

const EMPTY_STOCK: StockItem[] = [];

interface Found extends IngredientGap {
  facts: IngredientFacts;
}
interface RecipeAutoCompleteProps {
  active?: boolean;
  /** Une recherche dédiée dans une étape ; tous les ingrédients au récapitulatif. */
  scope?: IngredientKind;
  nolo?: boolean;
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
  stockItems = EMPTY_STOCK,
  active = true,
  scope,
  nolo = false
}) => {
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Found[] | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const saved = useStorageValue(StorageService.getHopKnowledge);
  const documentedAttenuation = useMemo(() => {
    const reference = resolveFermentationYeast({ yeast } as TrialRecipe, yeastReferences(saved));
    if (!reference) return undefined;
    return guideFermentations(saved).find(g => g.yeastId === reference.id)?.attenuationPct
      ?? agreedFermentationFact(reference, 'attenuation', '%');
  }, [yeast.name, yeast.hopIndexId, saved]);
  const gaps = useMemo(
    () => ingredientGaps(fermentables, hops, yeast, nolo).filter(gap => !scope || gap.kind === scope).map(gap => ({ ...gap,
      // A published interval is already documented. Do not ask AI for a
      // pseudo-exact percentage to fill the deliberately empty manual field.
      missing: gap.missing.filter(field => !(gap.kind === 'levure' && field === 'atténuation' && documentedAttenuation))
    })).filter(gap => gap.missing.length),
    [fermentables, hops, yeast, nolo, scope, documentedAttenuation]
  );

  const request = useRef(0);
  const basis = JSON.stringify([fermentables, hops, yeast, nolo, scope, !!documentedAttenuation]);
  const latest = useRef(basis); latest.current = basis;
  const cache = useRef(new Map<string, IngredientFacts>());
  useEffect(() => {
    request.current += 1; setBusy(false); setFound(null); setError(null); setMissed([]);
  }, [basis]);
  // Une notification Firestore renouvelle les tableaux même sans changement.
  // Seule une modification effective de la recette invalide sa proposition IA.
  useEffect(() => {
    const local = completeFromLocalReferences(fermentables, hops, yeast, stockItems, saved);
    if (JSON.stringify(local.fermentables) !== JSON.stringify(fermentables)) onFermentables(local.fermentables);
    if (JSON.stringify(local.hops) !== JSON.stringify(hops)) onHops(local.hops);
    if (JSON.stringify(local.yeast) !== JSON.stringify(yeast)) onYeast(local.yeast);
  }, [basis, stockItems, saved]);
  useEffect(() => () => { request.current += 1; }, []);

  const search = async () => {
    const id = ++request.current;
    const started = basis;
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
              const cached = cache.current.get(gap.key) ?? (item && factsFromStock(item));
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
                    : ({ name: '' } as YeastSpec),
                  nolo
                );
              if (cached && !remaining?.some(g => g.missing.some(field => gap.missing.includes(field)))) {
                ok.push({ ...gap, facts: cached });
                continue;
              }
              const res = await AiClient.run<IngredientFacts>({
                task: 'lookupIngredient',
                tier: 'fast',
                instruction: gap.kind + ' : ' + gap.name.trim(),
                context: { kind: gap.kind, name: gap.name.trim(), manquant: gap.missing, nolo, known: gap.kind === 'levure' ? yeast : undefined }
              });
              // Une réponse annulée ou périmée ne doit pas non plus peupler le cache.
              if (request.current !== id || latest.current !== started) return;
              if (res.ok && res.data?.found && res.data.source?.trim() && fillsGap(gap, res.data)) {
                const facts = sanitizeFacts(res.data);
                // Identity belongs to the local catalogue, never to model output.
                delete facts.hopIndexId;
                if (gap.kind === 'levure' && !gap.missing.includes('atténuation')) delete facts.attenuationPct;
                cache.current.set(gap.key, facts);
                ok.push({ ...gap, facts });
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
      if (request.current !== id || latest.current !== started) return;
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
  if (!active || gaps.length === 0 && !found && !error) return null;

  return (
    <section aria-label="Autocomplétion des ingrédients" aria-busy={busy} className="panel p-2 space-y-2">
      {!found && (
        <>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-ebc-straw shrink-0 mt-0.5" />
            <p className="text-sm text-cave-200 leading-snug">
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
            className="max-w-full min-h-7 rounded-control border border-cave-700 bg-cave-850 text-cave-50
                       text-2xs font-semibold flex items-center justify-center gap-2
                       px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recherche des fiches…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {scope === 'levure' ? 'Compléter la levure avec l’IA' : 'Compléter les données manquantes avec l’IA'}
              </>
            )}
          </button>
        </>
      )}

      {busy && <button type="button" className="min-h-7 px-2 text-2xs text-cave-200 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw" onClick={() => { request.current += 1; setBusy(false); }}>Annuler la recherche</button>}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-cave-200 leading-snug">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error} — à saisir à la main.</span>
        </p>
      )}

      {found && (
        <div className="space-y-2">
          <p role="status" className="text-sm text-cave-200">
            {found.length} fiche{found.length > 1 ? 's' : ''} retrouvée
            {found.length > 1 ? 's' : ''}. Rien n’est écrit avant validation ; les valeurs déjà
            saisies ne bougent pas.
          </p>

          <ul className="divide-y divide-cave-850">
            {found.map((f) => (
              <li key={f.key} className="py-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <span className="min-w-0 text-sm text-cave-50 break-words [overflow-wrap:anywhere]">
                    {f.facts.name}
                  </span>
                  <span className="max-w-full reading text-sm text-ebc-straw break-words">
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
                {f.facts.fermentation && <details><summary className="min-h-touch cursor-pointer text-sm text-water">Assimilation, ensemencement et domaine publié</summary><p className="text-sm text-cave-200 break-words">{Object.entries(f.facts.fermentation.sugars).map(([k,v])=>k+': '+({yes:'oui',no:'non',unknown:'inconnu'})[v]).join(' · ')} · POF {f.facts.fermentation.pof}</p><p className="text-sm text-cave-400">{f.facts.fermentation.conditions} · {f.facts.fermentation.source.year ?? 'Année inconnue'} · {f.facts.fermentation.source.reference}</p></details>}
                <p className="text-2xs text-cave-400 leading-snug break-words [overflow-wrap:anywhere]">
                  {f.facts.source}
                </p>
              </li>
            ))}
          </ul>

          {missed.length > 0 && (
            <p className="text-sm text-cave-200 leading-snug">
              Rien trouvé pour : {missed.join(', ')}. À saisir à la main.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setFound(null)}
              className="min-h-7 px-2 py-1 rounded-control border border-cave-700
                         text-cave-200 text-2xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw"
            >
              Ignorer
            </button>
            <button
              type="button"
              onClick={apply}
              className="min-h-7 px-2 py-1 rounded-control border border-cave-700 bg-cave-850 text-cave-50
                         text-2xs font-semibold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw"
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
