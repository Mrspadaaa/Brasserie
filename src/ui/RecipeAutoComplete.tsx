import React, { useMemo, useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Fermentable, HopIngredient, YeastSpec } from '../types';
import { AiClient } from '../services/aiClient';
import { IngredientFacts, IngredientKind } from './AiAssist';

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

/** Ce qui manque à un ingrédient, et ce qu'on ira chercher pour lui. */
interface Gap {
  key: string;
  kind: IngredientKind;
  name: string;
  /** Libellés des champs vides, pour la consigne et pour l'affichage. */
  missing: string[];
}

interface Found extends Gap {
  facts: IngredientFacts;
}

interface RecipeAutoCompleteProps {
  fermentables: Fermentable[];
  onFermentables: (v: Fermentable[]) => void;
  hops: HopIngredient[];
  onHops: (v: HopIngredient[]) => void;
  yeast: YeastSpec;
  onYeast: (v: YeastSpec) => void;
}

/**
 * Ce qui manque, ingrédient par ingrédient.
 *
 * Les grains sans couleur rendent l'EBC incalculable ; sans potentiel, c'est
 * l'OG. Un houblon d'ébullition sans alpha ne donne pas d'IBU — mais un houblon
 * à cru n'amérise pas, on ne lui réclame donc rien.
 */
function findGaps(
  fermentables: Fermentable[],
  hops: HopIngredient[],
  yeast: YeastSpec
): Gap[] {
  const gaps: Gap[] = [];

  fermentables.forEach((f, i) => {
    if (!f.name?.trim() || f.kind !== 'grain') return;
    const missing: string[] = [];
    if (f.colorEbc == null) missing.push('couleur EBC');
    if (f.potentialPpg == null) missing.push('potentiel PPG');
    if (missing.length) gaps.push({ key: `f${i}`, kind: 'malt', name: f.name, missing });
  });

  hops.forEach((h, i) => {
    if (!h.name?.trim() || h.stage === 'dryHop') return;
    if (!h.alpha) gaps.push({ key: `h${i}`, kind: 'houblon', name: h.name, missing: ['acides alpha'] });
  });

  if (yeast.name?.trim()) {
    const missing: string[] = [];
    if (!yeast.attenuationPct) missing.push('atténuation');
    if (yeast.fermTempMinC == null) missing.push('plage de température');
    if (!yeast.lab) missing.push('laboratoire');
    if (missing.length) gaps.push({ key: 'y', kind: 'levure', name: yeast.name, missing });
  }

  return gaps;
}

export const RecipeAutoComplete: React.FC<RecipeAutoCompleteProps> = ({
  fermentables,
  onFermentables,
  hops,
  onHops,
  yeast,
  onYeast
}) => {
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Found[] | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const gaps = useMemo(
    () => findGaps(fermentables, hops, yeast),
    [fermentables, hops, yeast]
  );

  const search = async () => {
    setBusy(true);
    setError(null);
    setFound(null);
    setMissed([]);

    /*
     * En parallèle : onze recherches à la file prendraient une minute, et le
     * brasseur regarderait tourner une roue. Elles sont indépendantes, chacune
     * ne concerne qu'un ingrédient.
     */
    const results = await Promise.all(
      gaps.map(async (g) => {
        const res = await AiClient.run<IngredientFacts>({
          task: 'lookupIngredient',
          tier: 'fast',
          instruction: `${g.kind} : ${g.name.trim()}`,
          context: { kind: g.kind, name: g.name.trim(), manquant: g.missing }
        });
        return { gap: g, res };
      })
    );

    setBusy(false);

    const ok: Found[] = [];
    const ko: string[] = [];
    results.forEach(({ gap, res }) => {
      if (res.ok && res.data?.found) ok.push({ ...gap, facts: res.data });
      else ko.push(gap.name);
    });

    if (ok.length === 0) {
      setError(
        results.find((r) => !r.res.ok)?.res.error ??
          'Rien de publié retrouvé pour ces ingrédients.'
      );
      setMissed(ko);
      return;
    }
    setFound(ok);
    setMissed(ko);
  };

  /** N'écrit que dans les cases restées vides. */
  const apply = () => {
    if (!found) return;

    const nextFerms = [...fermentables];
    const nextHops = [...hops];
    let nextYeast = { ...yeast };

    found.forEach((f) => {
      if (f.key === 'y') {
        nextYeast = {
          ...nextYeast,
          lab: nextYeast.lab ?? f.facts.lab,
          strain: nextYeast.strain ?? f.facts.strain,
          form: nextYeast.form ?? f.facts.form,
          attenuationPct: nextYeast.attenuationPct ?? f.facts.attenuationPct,
          fermTempMinC: nextYeast.fermTempMinC ?? f.facts.tempMinC,
          fermTempMaxC: nextYeast.fermTempMaxC ?? f.facts.tempMaxC
        };
        return;
      }
      const i = parseInt(f.key.slice(1), 10);
      if (f.key.startsWith('f') && nextFerms[i]) {
        nextFerms[i] = {
          ...nextFerms[i],
          colorEbc: nextFerms[i].colorEbc ?? f.facts.colorEbc,
          potentialPpg: nextFerms[i].potentialPpg ?? f.facts.potentialPpg
        };
      }
      if (f.key.startsWith('h') && nextHops[i]) {
        nextHops[i] = { ...nextHops[i], alpha: nextHops[i].alpha || (f.facts.alphaPct ?? 0) };
      }
    });

    onFermentables(nextFerms);
    onHops(nextHops);
    onYeast(nextYeast);
    setFound(null);
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
                  <span className="text-sm sm:text-base text-cave-100 truncate">{f.facts.name}</span>
                  <span className="reading text-xs sm:text-sm text-ebc-straw shrink-0">
                    {f.kind === 'malt' &&
                      [
                        f.facts.colorEbc != null ? `${f.facts.colorEbc} EBC` : null,
                        f.facts.potentialPpg != null ? `${f.facts.potentialPpg} PPG` : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    {f.kind === 'houblon' && f.facts.alphaPct != null && `${f.facts.alphaPct} % AA`}
                    {f.kind === 'levure' &&
                      [
                        f.facts.attenuationPct != null ? `${f.facts.attenuationPct} %` : null,
                        f.facts.tempMinC != null && f.facts.tempMaxC != null
                          ? `${f.facts.tempMinC}–${f.facts.tempMaxC} °C`
                          : null
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
