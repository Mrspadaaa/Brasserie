import React, { useRef, useState } from 'react';
import {
  Fermentable,
  HopIngredient,
  YeastSpec,
  TempStep,
  FermentationStep,
  WaterIons
} from '../types';
import { AiClient } from '../services/aiClient';
import { RecipeTextParser } from '../services/recipeParser';
import { Units } from '../services/units';
import { HOP_STAGE, describeMoment } from '../domain/hopStage';
import { Sheet } from './Sheet';
import { Sparkles, Loader2, AlertTriangle, Camera, Check } from 'lucide-react';

/**
 * Coller une recette, et qu'elle se remplisse.
 *
 * ⚠️ Ce que ça règle : une recette trouvée sur un site se ressaisissait
 * intégralement à la main — quatre malts, huit ajouts de houblon avec leur
 * moment, la levure, les paliers, le déroulé. Vingt minutes de recopie, et
 * autant d'occasions de se tromper d'un facteur mille sur un grammage.
 *
 * Deux chemins, dans cet ordre :
 *   1. **Gemini**, avec la recherche Google ancrée : il lit la recette ET va
 *      chercher ce qu'elle ne dit pas — l'alpha d'un houblon, la couleur d'un
 *      malt, l'atténuation d'une levure. C'est ce qui évite de rester bloqué à
 *      la fin de la saisie sur des valeurs pourtant publiées.
 *   2. **Le parseur local**, si l'IA ne répond pas. Il lit les unités
 *      américaines et les moments de houblonnage, mais ne complète rien.
 *
 * Dans les deux cas, RIEN n'est écrit sans que Gaëtan ait vu ce qui va l'être.
 */

export interface ImportedRecipe {
  name?: string;
  style?: string;
  volumeL?: number;
  boilMin?: number;
  ogTarget?: number;
  fgTarget?: number;
  abvTarget?: number;
  ibuTarget?: number;
  colorEbc?: number;
  fermentables: Fermentable[];
  hops: HopIngredient[];
  yeast?: YeastSpec;
  mashSteps: TempStep[];
  fermentation: FermentationStep[];
  instructions?: string;
  waterNote?: string;
  /**
   * La cible d'eau CHIFFRÉE, quand la recette en donne une plutôt qu'un style.
   *
   * ⚠️ Partielle par nature : une recette qui n'annonce que le sulfate et le
   * chlorure ne doit pas voir les quatre autres ions arriver à zéro — zéro est
   * une cible, et le solveur la viserait.
   */
  waterTarget?: Partial<WaterIons>;
  waterTargetName?: string;
  /* Le procédé, écrit dans le déroulé et jamais dans la liste d'ingrédients. */
  mashWaterL?: number;
  spargeWaterL?: number;
  preBoilL?: number;
  carboVolumes?: number;
  dryHopNote?: string;
  /** D'où vient chaque chose, et ce qui manque encore. */
  warnings: string[];
  via: 'ia' | 'local';
}

interface RecipeImportSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: (recipe: ImportedRecipe) => void;
}

/** Réponse brute de la passerelle IA, avant normalisation. */
interface AiRecipe {
  name?: string;
  style?: string;
  volumeL?: number;
  boilMin?: number;
  ogTarget?: number;
  fgTarget?: number;
  abvTarget?: number;
  ibuTarget?: number;
  colorEbc?: number;
  fermentables?: Array<Partial<Fermentable>>;
  hops?: Array<Partial<HopIngredient>>;
  yeast?: Partial<YeastSpec>;
  mashSteps?: TempStep[];
  fermentation?: FermentationStep[];
  instructions?: string;
  waterNote?: string;
  waterTarget?: Partial<WaterIons>;
  waterTargetName?: string;
  mashWaterL?: number;
  spargeWaterL?: number;
  preBoilL?: number;
  carboVolumes?: number;
  dryHopNote?: string;
  notes?: string;
}

/** Zéro reste zéro : une valeur absente ne doit pas devenir une valeur plausible. */
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v !== 0 ? v : undefined;

export const RecipeImportSheet: React.FC<RecipeImportSheetProps> = ({
  open,
  onClose,
  onApply
}) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  /** Repli local : lit les unités et les moments, ne complète rien. */
  const parseLocally = (raw: string): ImportedRecipe => {
    const p = RecipeTextParser.parse(raw);
    return {
      name: p.name || undefined,
      style: p.style || undefined,
      volumeL: p.volumeL ?? undefined,
      boilMin: p.boilMin ?? undefined,
      ogTarget: p.ogTarget ?? undefined,
      fgTarget: p.fgTarget ?? undefined,
      abvTarget: p.abvTarget ?? undefined,
      ibuTarget: p.ibuTarget ?? undefined,
      colorEbc: p.colorEbc ?? undefined,
      fermentables: p.malts.map((m) => ({
        ...m,
        kind: 'grain' as const,
        use: 'empatage' as const
      })),
      hops: p.hops,
      yeast: p.yeast ?? undefined,
      mashSteps: p.mashSteps,
      fermentation: p.fermentation,
      instructions: p.instructions || undefined,
      waterNote: p.waterNote ?? undefined,
      mashWaterL: p.mashWaterL ?? undefined,
      spargeWaterL: p.spargeWaterL ?? undefined,
      preBoilL: p.preBoilL ?? undefined,
      carboVolumes: p.carboVolumes ?? undefined,
      dryHopNote: p.dryHopNote ?? undefined,
      warnings: p.warnings,
      via: 'local'
    };
  };

  const run = async (file?: File) => {
    if (!file && text.trim().length < 20) {
      setError('Colle d’abord la recette — au moins quelques lignes.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);

    const res = await AiClient.run<AiRecipe>({
      task: 'importRecipe',
      tier: 'max',
      instruction: text.trim() || 'Lis la recette sur ce document.',
      file
    });

    if (res.ok && res.data) {
      const d = res.data;
      const warnings: string[] = [];

      const fermentables: Fermentable[] = (d.fermentables ?? [])
        .filter((f) => f.name && f.weightKg)
        .map((f) => ({
          name: f.name!,
          weightKg: f.weightKg!,
          kind: f.kind ?? 'grain',
          use: f.use ?? 'empatage',
          fermentabilityPct:
            f.fermentabilityPct ?? (f.kind === 'lactose' ? 0 : f.kind === 'fruit' ? 90 : 100),
          colorEbc: num(f.colorEbc),
          potentialPpg: num(f.potentialPpg),
          dayOffset: num(f.dayOffset)
        }));

      const hops: HopIngredient[] = (d.hops ?? [])
        .filter((h) => h.name && h.weightG)
        .map((h) => ({
          name: h.name!,
          weightG: h.weightG!,
          // Alpha absent = 0 : `hopIbu` ne compte alors rien, plutôt que
          // d'attribuer une amertume qui n'a pas été mesurée.
          alpha: num(h.alpha) ?? 0,
          stage: h.stage ?? 'boil',
          timeMin: h.timeMin,
          tempC: num(h.tempC),
          dayOffset: h.dayOffset
        }));

      if (fermentables.length === 0) warnings.push('Aucun fermentescible reconnu.');
      if (hops.length === 0) warnings.push('Aucun houblon reconnu.');
      if (!d.yeast?.name) warnings.push('Aucune levure reconnue.');
      const noAlpha = hops.filter((h) => h.stage !== 'dryHop' && !h.alpha).map((h) => h.name);
      if (noAlpha.length) {
        warnings.push(`Alpha absent : ${[...new Set(noAlpha)].join(', ')} — l’IBU sera partiel.`);
      }
      const noColor = fermentables.filter((f) => f.kind === 'grain' && f.colorEbc == null);
      if (noColor.length) {
        warnings.push(`Couleur absente : ${noColor.map((f) => f.name).join(', ')}.`);
      }

      setResult({
        name: d.name,
        style: d.style,
        volumeL: num(d.volumeL),
        boilMin: num(d.boilMin),
        ogTarget: num(d.ogTarget),
        fgTarget: num(d.fgTarget),
        abvTarget: num(d.abvTarget),
        ibuTarget: num(d.ibuTarget),
        colorEbc: num(d.colorEbc),
        fermentables,
        hops,
        yeast: d.yeast?.name
          ? {
              name: d.yeast.name,
              lab: d.yeast.lab,
              strain: d.yeast.strain,
              form: d.yeast.form ?? 'sèche',
              qty: d.yeast.qty ?? 1,
              unit: d.yeast.unit ?? 'sachet',
              pitchTempC: num(d.yeast.pitchTempC),
              fermTempMinC: num(d.yeast.fermTempMinC),
              fermTempMaxC: num(d.yeast.fermTempMaxC),
              attenuationPct: num(d.yeast.attenuationPct),
              fermentDays: num(d.yeast.fermentDays),
              notes: d.yeast.notes
            }
          : undefined,
        mashSteps: d.mashSteps ?? [],
        fermentation: d.fermentation ?? [],
        instructions: d.instructions,
        waterNote: d.waterNote,
        /*
         * ⚠️ On ne garde que les ions RÉELLEMENT chiffrés, et on garde le zéro
         * quand il est écrit. C'est l'inverse de `num()` ailleurs : ici « HCO₃
         * 0 » est une consigne du brasseur — une eau désalcalinisée — alors
         * qu'un ion absent doit le rester, faute de quoi le solveur viserait
         * zéro sur un ion dont la recette ne dit rien.
         */
        waterTarget: d.waterTarget
          ? (Object.fromEntries(
              (['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as Array<keyof WaterIons>)
                .map((ion) => [ion, d.waterTarget?.[ion]])
                .filter(([, v]) => typeof v === 'number' && Number.isFinite(v as number))
            ) as Partial<WaterIons>)
          : undefined,
        waterTargetName: d.waterTargetName,
        mashWaterL: num(d.mashWaterL),
        spargeWaterL: num(d.spargeWaterL),
        preBoilL: num(d.preBoilL),
        carboVolumes: num(d.carboVolumes),
        dryHopNote: d.dryHopNote,
        warnings,
        via: 'ia'
      });
      setBusy(false);
      return;
    }

    // L'IA n'a pas répondu : on lit quand même, sans rien compléter.
    if (text.trim()) {
      const local = parseLocally(text);
      local.warnings = [
        `L’IA n’a pas répondu (${res.error ?? 'erreur inconnue'}). Lecture locale : les valeurs absentes de la recette resteront vides.`,
        ...local.warnings
      ];
      setResult(local);
    } else {
      setError(res.error ?? 'Lecture impossible.');
    }
    setBusy(false);
  };

  const grains = result?.fermentables.filter((f) => f.kind === 'grain') ?? [];
  const others = result?.fermentables.filter((f) => f.kind !== 'grain') ?? [];

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Coller une recette"
      subtitle={result ? `Lue ${result.via === 'ia' ? 'par l’IA' : 'localement'}` : undefined}
      footer={
        result ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 min-h-touch rounded-control border border-cave-700 text-cave-200"
            >
              Recommencer
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(result);
                reset();
                onClose();
              }}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                         font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Reprendre
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              aria-label="Photographier une recette"
              className="touch-target min-w-touch rounded-control border border-cave-700
                         text-cave-200 disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                         font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Lecture…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Lire la recette
                </>
              )}
            </button>
          </div>
        )
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void run(f);
          e.target.value = '';
        }}
      />

      {!result && (
        <div className="space-y-3">
          <p className="text-sm text-cave-400 leading-relaxed">
            Colle la recette telle quelle — site anglophone, forum, carnet photographié.
            Les livres, onces et gallons sont convertis ; le moment de chaque houblon est
            conservé.
          </p>

          <textarea
            name="recipe_import_text_input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            rows={12}
            className="w-full px-3 py-2 rounded-control bg-cave-950 border border-cave-700
                       text-cave-100 text-base leading-relaxed placeholder-cave-600
                       focus:outline-none focus:border-ebc-straw resize-y"
            placeholder={
              'New England IPA\n(5 gallons/19 L, all-grain)\n\nOG = 1.061 FG = 1.012 IBU = 56…'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {error && (
            <p className="flex items-start gap-2 text-sm text-alert leading-snug">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* --- Ce qui a été lu -------------------------------------------- */}
          <div className="panel p-3">
            <h3 className="text-base font-semibold text-cave-50">{result.name || 'Sans nom'}</h3>
            <p className="text-sm text-cave-400">
              {[
                result.style,
                result.volumeL ? `${result.volumeL} L` : null,
                result.boilMin ? `ébullition ${result.boilMin} min` : null
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
            <dl className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
              {[
                ['OG', result.ogTarget?.toFixed(3)],
                ['FG', result.fgTarget?.toFixed(3)],
                ['IBU', result.ibuTarget?.toString()],
                ['EBC', result.colorEbc?.toString()],
                ['ABV', result.abvTarget ? `${result.abvTarget} %` : undefined]
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-sm text-cave-500">{k}</dt>
                  <dd className="reading text-base text-cave-100">{v ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {grains.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">
                Grain — {grains.length}
              </h3>
              <ul className="divide-y divide-cave-850">
                {grains.map((f, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3">
                    <span className="min-w-0 flex-1 text-base text-cave-200 truncate">{f.name}</span>
                    {f.colorEbc != null && (
                      <span className="reading text-sm text-cave-500 shrink-0">{f.colorEbc} EBC</span>
                    )}
                    <span className="reading text-base shrink-0">
                      {Units.format(f.weightKg, 'kg')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">Sucres et ajouts</h3>
              <ul className="divide-y divide-cave-850">
                {others.map((f, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-base text-cave-200 truncate">{f.name}</span>
                      <span className="block text-sm text-cave-500">
                        {f.kind} · {f.fermentabilityPct ?? 100} % fermentescible
                      </span>
                    </span>
                    <span className="reading text-base shrink-0">
                      {Units.format(f.weightKg, 'kg')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.hops.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">
                Houblons — {result.hops.length} ajouts
              </h3>
              <ul className="divide-y divide-cave-850">
                {result.hops.map((h, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-base text-cave-200 truncate">{h.name}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-sm px-1.5 rounded-full border ${HOP_STAGE[h.stage].tone}`}
                        >
                          {HOP_STAGE[h.stage].label}
                        </span>
                        <span className="text-sm text-cave-500 truncate">
                          {describeMoment(h)}
                          {h.alpha ? ` · ${h.alpha} %` : ' · alpha inconnu'}
                        </span>
                      </span>
                    </span>
                    <span className="reading text-base shrink-0">
                      {Units.format(h.weightG, 'g')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.yeast && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">Levure</h3>
              <p className="text-base text-cave-200">
                {result.yeast.lab && <span className="text-cave-400">{result.yeast.lab} </span>}
                {result.yeast.name}
                {result.yeast.strain && (
                  <span className="text-cave-400"> · {result.yeast.strain}</span>
                )}
              </p>
              <p className="text-sm text-cave-500">
                {[
                  result.yeast.form,
                  result.yeast.attenuationPct ? `${result.yeast.attenuationPct} % att.` : null,
                  result.yeast.fermTempMinC != null && result.yeast.fermTempMaxC != null
                    ? `${result.yeast.fermTempMinC}–${result.yeast.fermTempMaxC} °C`
                    : null
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </section>
          )}

          {result.mashSteps.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">Empâtage</h3>
              <ul className="divide-y divide-cave-850">
                {result.mashSteps.map((s, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3 text-base">
                    <span className="flex-1 text-cave-200">{s.name}</span>
                    <span className="reading text-water">{s.tempC} °C</span>
                    <span className="reading text-cave-400 w-16 text-right">
                      {s.durationMin} min
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.fermentation.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">Fermentation</h3>
              <ul className="divide-y divide-cave-850">
                {result.fermentation.map((s, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3 text-base">
                    <span className="flex-1 text-cave-200 truncate">{s.name}</span>
                    <span className="reading text-water">{s.tempC} °C</span>
                    <span className="reading text-cave-400 w-16 text-right">
                      {s.days ? `${s.days} j` : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.waterNote && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">Eau</h3>
              <p className="text-base text-cave-300 leading-relaxed">{result.waterNote}</p>
            </section>
          )}

          {result.instructions && (
            <section>
              <h3 className="text-base font-semibold text-cave-100 mb-1">Déroulé</h3>
              <p className="text-sm text-cave-400 leading-relaxed whitespace-pre-line line-clamp-6">
                {result.instructions}
              </p>
            </section>
          )}

          {/* --- Ce qui manque, dit franchement ----------------------------- */}
          {result.warnings.length > 0 && (
            <ul className="space-y-1.5 pt-2 border-t border-cave-800">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ebc-amber leading-snug">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  );
};
