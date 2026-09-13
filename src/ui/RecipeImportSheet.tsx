import { Textarea } from './Input';
import React, { useEffect, useRef, useState } from 'react';
import { AiClient } from '../services/aiClient';
import { ImportedRecipe, normalizeRecipeImport, parseLocalRecipe } from '../domain/recipeImport';
import { readRecipeText } from '../domain/recipeTransfer';
import { ACIDS, SALTS } from '../domain/water';
export type { ImportedRecipe } from '../domain/recipeImport';
import { Units } from '../services/units';
import { formatDecimal } from './numericInput';
import { HOP_STAGE, describeMoment } from '../domain/hopStage';
import { Sheet } from './Sheet';
import { Sparkles, Loader2, AlertTriangle, Camera, Check } from 'lucide-react';
import { NoloRecipeOverview } from './NoloRecipeOverview';
import { noloDecimal, noloProcessLabels } from '../domain/noloPresentation';
import type { Recipe } from '../types';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { YEAST_RECIPE_GOAL_LABELS } from '../domain/yeastRecipeDesign';
import { normalizedYeastText } from '../domain/yeastCatalogue';

/**
 * Coller une recette, et qu'elle se remplisse.
 *
 * ⚠️ Ce que ça règle : une recette trouvée sur un site se ressaisissait
 * intégralement à la main — quatre malts, huit ajouts de houblon avec leur
 * moment, la levure, les paliers, le déroulé. Vingt minutes de recopie, et
 * autant d'occasions de se tromper d'un facteur mille sur un grammage.
 *
 * Une copie L’Affinée se relit exactement, en local. Les autres textes passent
 * par l’IA, puis par le lecteur local si elle est indisponible. Le texte que ce
 * dernier ne sait pas structurer reste conservé dans les notes de création.
 *
 * Dans les deux cas, RIEN n'est écrit sans que Gaëtan ait vu ce qui va l'être.
 */

interface RecipeImportSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: (recipe: ImportedRecipe) => void;
}

export const RecipeImportSheet: React.FC<RecipeImportSheetProps> = ({ open, onClose, onApply }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const knowledge = useStorageValue(StorageService.getHopKnowledge);
  const fileRef = useRef<HTMLInputElement>(null);
  const yeastNameIncludes = (part: string) => ` ${normalizedYeastText(result?.yeast?.name ?? '')} `.includes(` ${normalizedYeastText(part)} `);

  const request = useRef(0);
  useEffect(() => {
    if (!open) {
      request.current++;
      setBusy(false);
    }
    return () => {
      request.current++;
    };
  }, [open]);
  const reset = () => {
    request.current++;
    setBusy(false);
    setText('');
    setResult(null);
    setError(null);
  };

  const run = async (file?: File) => {
    const raw = text.trim();
    if (!file && raw.length < 20) {
      setError('Colle d’abord la recette — au moins quelques lignes.');
      return;
    }
    const token = ++request.current;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const own = !file && readRecipeText(raw);
      if (own) {
        setResult(normalizeRecipeImport(own, 'local', true));
        return;
      }
      let res;
      try {
        res = await AiClient.run<unknown>({
          task: 'importRecipe',
          tier: 'max',
          instruction: raw || 'Lis la recette sur ce document.',
          file
        });
      } catch (e) {
        res = { ok: false, error: e instanceof Error ? e.message : 'Lecture indisponible' };
      }
      if (token !== request.current) return;
      if (res.ok && res.data) setResult(normalizeRecipeImport(res.data, 'ia'));
      else if (raw) {
        const local = parseLocalRecipe(raw);
        local.warnings.unshift(
          'Lecture locale : seules les valeurs reconnues sont structurées. Le texte complet est conservé dans les notes de création.'
        );
        setResult(local);
      } else setError(res.error ?? 'Lecture impossible.');
    } catch (e) {
      if (token === request.current)
        setError(e instanceof Error ? e.message : 'Recette illisible.');
    } finally {
      if (token === request.current) setBusy(false);
    }
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
            Colle la recette telle quelle — site anglophone, forum, carnet photographié. Les livres,
            onces et gallons sont convertis ; le moment de chaque houblon est conservé.
          </p>

          <Textarea
            aria-label="Texte de la recette"
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
                       text-cave-50 text-base leading-relaxed placeholder-cave-400
                       focus:outline-none focus:border-ebc-straw resize-y"
            placeholder={
              'New England IPA\n(5 gallons/19 L, all-grain)\n\nOG = 1.061 FG = 1.012 IBU = 56…'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-alert-strong leading-snug">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          {/* --- Ce qui a été lu -------------------------------------------- */}
          <div className="panel p-2">
            <h3 className="text-base font-semibold text-cave-50">{result.name || 'Sans nom'}</h3>
            <p className="text-sm text-cave-400">
              {[
                result.style,
                result.volumeL != null ? `${formatDecimal(result.volumeL)} L` : null,
                result.boilMin != null ? `ébullition ${formatDecimal(result.boilMin)} min` : null
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
            {result.nolo?.enabled && <div className="mt-2 border-t border-cave-800 pt-2">
              {result.yeast && result.volumeL != null && result.volumeL > 0
                ? <NoloRecipeOverview recipe={{...result,id:'import-preview'} as Recipe} saved={knowledge}/>
                : <p className="text-sm text-cave-200">{noloProcessLabels[result.nolo.process]} · cible ≤ {noloDecimal(result.nolo.targetAbvPct)} % vol. · Volume et levure à renseigner pour la projection.</p>}
            </div>}
            <dl className="grid gap-2 mt-2" style={{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,3.5rem),1fr))'}}>
              {[
                ['OG', result.ogTarget?.toFixed(3).replace('.', ',')],
                ['FG', result.fgTarget?.toFixed(3).replace('.', ',')],
                ['IBU', result.ibuTarget == null ? undefined : formatDecimal(result.ibuTarget)],
                ['EBC', result.colorEbc == null ? undefined : formatDecimal(result.colorEbc)],
                ...(result.nolo?.enabled ? [] : [['ABV', result.abvTarget != null ? `${formatDecimal(result.abvTarget)} %` : undefined]])
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-sm text-cave-400">{k}</dt>
                  <dd className="reading text-base text-cave-50">{v ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {grains.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-50 mb-1">
                Grain — {grains.length}
              </h3>
              <ul className="divide-y divide-cave-850">
                {grains.map((f, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3">
                    <span className="min-w-0 flex-1 text-base text-cave-200 truncate">
                      {f.name}
                    </span>
                    {f.colorEbc != null && (
                      <span className="reading text-sm text-cave-400 shrink-0">
                        {formatDecimal(f.colorEbc)} EBC
                      </span>
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
              <h3 className="text-base font-semibold text-cave-50 mb-1">Sucres et ajouts</h3>
              <ul className="divide-y divide-cave-850">
                {others.map((f, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-base text-cave-200 truncate">{f.name}</span>
                      <span className="block text-sm text-cave-400">
                        {f.kind} · {result.nolo?.enabled && f.use === 'fermentation' ? 'sucres suivis dans le bilan NOLO' : f.fermentabilityPct != null ? `${formatDecimal(f.fermentabilityPct)} % fermentescible` : 'fermentescibilité à préciser'}
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
              <h3 className="text-base font-semibold text-cave-50 mb-1">
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
                        <span className="text-sm text-cave-400 truncate">
                          {describeMoment(h)}
                          {h.alpha ? ` · ${formatDecimal(h.alpha)} %` : ' · alpha inconnu'}
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
              <h3 className="text-base font-semibold text-cave-50 mb-1">Levure</h3>
              <p className="text-base text-cave-200">
                {result.yeast.lab && !yeastNameIncludes(result.yeast.lab) && <span className="text-cave-400">{result.yeast.lab} </span>}
                {result.yeast.name}
                {result.yeast.strain && !yeastNameIncludes(result.yeast.strain) && (
                  <span className="text-cave-400"> · {result.yeast.strain}</span>
                )}
              </p>
              <p className="text-sm text-cave-400">
                {[
                  result.yeast.qty > 0 && result.yeast.unit ? `${formatDecimal(result.yeast.qty)} ${result.yeast.unit}` : 'Quantité à préciser',
                  result.yeast.form || 'forme à préciser',
                  result.yeast.attenuationPct ? `${formatDecimal(result.yeast.attenuationPct)} % att.` : null,
                  result.yeast.fermTempMinC != null && result.yeast.fermTempMaxC != null
                    ? `${formatDecimal(result.yeast.fermTempMinC)}–${formatDecimal(result.yeast.fermTempMaxC)} °C`
                    : null
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {!result.nolo?.enabled && result.yeastDesign && <p className="text-xs text-cave-200 mt-1">
                Objectif adopté : <strong>{YEAST_RECIPE_GOAL_LABELS[result.yeastDesign.goal]}</strong> · pression précoce {result.yeastDesign.pressureBar == null ? 'inconnue' : `${result.yeastDesign.pressureBar.toLocaleString('fr-FR')} bar rel.`}
              </p>}
              {result.hops.some(h => h.stage === 'dryHop') && <details className="mt-1 border-t border-cave-800 pt-1">
                <summary className="min-h-touch cursor-pointer text-xs text-cave-200">Contacts des houblons à cru</summary>
                <ul className="text-xs text-cave-400 space-y-1">{result.hops.filter(h => h.stage === 'dryHop').map((h, i) => <li key={i}>
                  <strong className="text-cave-200">{h.name}</strong> · {h.aromaTiming === 'fermentation' ? 'fermentation active' : h.aromaTiming === 'postFermentation' ? 'après fermentation' : 'phase à préciser'} · {h.aromaContactHours == null ? '—' : formatDecimal(h.aromaContactHours)} h · {h.aromaTemperatureC == null && h.tempC == null ? '—' : formatDecimal(h.aromaTemperatureC ?? h.tempC)} °C
                </li>)}</ul>
              </details>}
            </section>
          )}

          {result.mashSteps.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-50 mb-1">Empâtage</h3>
              <ul className="divide-y divide-cave-850">
                {result.mashSteps.map((s, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3 text-base">
                    <span className="flex-1 text-cave-200">{s.name}</span>
                    <span className="reading text-water">{formatDecimal(s.tempC)} °C</span>
                    <span className="reading text-cave-400 w-20 shrink-0 whitespace-nowrap text-right">
                      {formatDecimal(s.durationMin)} min
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.fermentation.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-cave-50 mb-1">Fermentation</h3>
              <ul className="divide-y divide-cave-850">
                {result.fermentation.map((s, i) => (
                  <li key={i} className="py-1.5 flex items-baseline gap-3 text-base">
                    <span className="flex-1 text-cave-200 truncate">{s.name}</span>
                    <span className="reading text-water">{formatDecimal(s.tempC)} °C</span>
                    <span className="reading text-cave-400 w-16 text-right">
                      {s.days != null ? `${formatDecimal(s.days)} j` : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.waterNote && (
            <section>
              <h3 className="text-base font-semibold text-cave-50 mb-1">Eau</h3>
              <p className="text-base text-cave-200 leading-relaxed">{result.waterNote}</p>
            </section>
          )}

          {result.adjuncts?.length > 0 && (
            <section aria-label="Autres ajouts importés">
              <h3 className="text-base font-semibold text-cave-50 mb-1">Autres ajouts</h3>
              {result.adjuncts.map((a, i) => (
                <p key={i} className="text-sm text-cave-200 py-1">
                  {a.name} · {formatDecimal(a.amount)} {a.unit} · {a.step}
                  {a.notes && ` — ${a.notes}`}
                </p>
              ))}
            </section>
          )}
          {result.waterPlan && (
            <section
              aria-label="Traitement d’eau importé"
              className="panel p-3 space-y-1 text-sm text-cave-200"
            >
              <h3 className="font-semibold text-cave-50">Eau, sels et acides</h3>
              {result.waterPlan.sourceSnapshot && <p>{result.waterPlan.sourceSnapshot.name}</p>}
              {(['mash', 'sparge'] as const).map((side) => (
                <div key={side}>
                  <p className="text-cave-50">
                    {side === 'mash' ? 'Empâtage' : 'Rinçage'}
                    {result.waterPlan[`${side}WaterL`] != null &&
                      ` · ${formatDecimal(result.waterPlan[`${side}WaterL`])} L`}
                  </p>
                  {Object.entries(result.waterPlan[side] ?? {}).map(([id, g]) => (
                    <p key={id}>
                      {SALTS[id].name} · {formatDecimal(g)} g
                    </p>
                  ))}
                  {result.waterPlan.acid?.[side] != null && (
                    <p>
                      {ACIDS[result.waterPlan.acid.id]?.name} · {formatDecimal(result.waterPlan.acid[side])}{' '}
                      {ACIDS[result.waterPlan.acid.id]?.unit}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
          {result.waterTarget && (
            <p className="text-sm text-cave-200">
              Cible d’eau :{' '}
              {Object.entries(result.waterTarget)
                .map(([k, v]) => `${k} ${formatDecimal(v)}`)
                .join(' · ')}{' '}
              ppm
            </p>
          )}
          {(result.notes?.length > 0 ||
            result.notesCreation ||
            result.mash?.mashoutTempC != null ||
            result.carboTarget) && (
            <details className="text-sm text-cave-200">
              <summary className="cursor-pointer py-2 text-cave-50">
                Consignes et notes importées
              </summary>
              {result.carboTarget && <p>Carbonatation : {result.carboTarget}</p>}
              {result.mash?.mashoutTempC != null && <p>Mash-out : {formatDecimal(result.mash.mashoutTempC)} °C</p>}
              {result.mash?.spargeTempC != null && <p>Rinçage : {formatDecimal(result.mash.spargeTempC)} °C</p>}
              {result.notes?.map((note, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {note}
                </p>
              ))}
              {result.notesCreation && (
                <p className="whitespace-pre-wrap">{result.notesCreation}</p>
              )}
            </details>
          )}

          {result.instructions && (
            <section>
              <h3 className="text-base font-semibold text-cave-50 mb-1">Déroulé</h3>
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
