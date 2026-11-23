import React, { useId } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { AdjunctIngredient, Fermentable, StockItem } from '../../types';
import { ADDITIF_MOMENTS, ADDITIF_UNITES } from '../../domain/bornesProcede';
import { estEpice } from '../../domain/fermentables/moments';
import { Input } from '../Input';
import { inputClass } from '../FormNav';
import { NumberInput } from '../NumberInput';

/**
 * BK2-5 : la section « Additifs » de l'assistant (épices, clarifiants, sels de brasserie, tout ce qui n'est ni malt ni houblon ni levure).
 * Le modèle de recette la portait déjà (`adjuncts`, lu par la fiche, le budget, le stock et l'export) ; seul l'assistant ne savait pas la saisir.
 * Un dépliant fermé sous les fermentescibles : l'écran choisi de l'étape n'est pas touché. Une épice rangée parmi les fermentescibles
 * (« 0 kg ») s'y note en grammes, en un geste, et quitte le décompte du grain.
 */
const MOMENT_PAR_DEFAUT = 'Ébullition';

export interface EtapeAdditifsProps {
  adjuncts: AdjunctIngredient[];
  onAdjuncts: (next: AdjunctIngredient[]) => void;
  fermentables: Fermentable[];
  onFermentables: (next: Fermentable[]) => void;
  stockItems?: StockItem[];
  /** Message de validation d'un champ (`wz-adjunct-<i>`), dit au champ. */
  erreur?: (field: string) => string | undefined;
}

export function EtapeAdditifs({ adjuncts, onAdjuncts, fermentables, onFermentables, stockItems = [], erreur }: EtapeAdditifsProps) {
  const listeId = useId();
  const epices = fermentables.map((f, i) => ({ f, i })).filter(({ f }) => estEpice(f.name));
  const articles = stockItems.filter(s => s.category === 'Additif');
  const patch = (i: number, p: Partial<AdjunctIngredient>) => onAdjuncts(adjuncts.map((a, j) => (j === i ? { ...a, ...p } : a)));
  const nommer = (i: number, name: string) => {
    const article = articles.find(s => s.name.trim().toLowerCase() === name.trim().toLowerCase());
    const { stockItemRef: _ancien, ...sansLien } = adjuncts[i];
    onAdjuncts(adjuncts.map((a, j) => (j === i ? { ...sansLien, name, ...(article ? { stockItemRef: article.ref } : {}) } : a)));
  };
  const noterEnAdditif = (i: number) => {
    const f = fermentables[i];
    const grammes = Math.round(f.weightKg * 1000 * 100) / 100;
    onAdjuncts([...adjuncts, { name: f.name, amount: grammes, unit: 'g', step: f.use === 'fermentation' ? 'Fermenteur' : MOMENT_PAR_DEFAUT,
      ...(f.stockItemRef ? { stockItemRef: f.stockItemRef } : {}) }]);
    onFermentables(fermentables.filter((_, j) => j !== i));
  };
  const resume = adjuncts.length === 0 ? 'aucun' : String(adjuncts.length);
  return (
    <details data-role="additifs" className="recipe-disclosure group/recipe panel p-0 min-w-0">
      <summary className="list-none cursor-pointer min-h-touch px-2 py-1 flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-water rounded-control">
        <span className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-cave-50">Additifs · {resume}</span>
          <span className="text-xs text-cave-400">épices, clarifiants, divers</span>
          {epices.length > 0 && <span className="text-xs text-ebc-amber" data-role="epices-a-noter">{epices.length === 1 ? '1 épice' : `${epices.length} épices`} à y noter</span>}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-cave-400 group-open/recipe:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-1 px-2 pb-2 min-w-0 space-y-2">
        {epices.map(({ f, i }) => (
          <p key={`epice-${i}`} className="flex flex-wrap items-center gap-2 text-sm text-cave-200" data-role="epice-a-noter">
            <span className="min-w-0 flex-1">{f.name} est comptée parmi les fermentescibles{f.weightKg > 0 ? ` (${f.weightKg.toLocaleString('fr-CH', { maximumFractionDigits: 3 })} kg)` : ''}.</span>
            <button type="button" className="min-h-touch px-2 rounded-control border border-cave-700 text-sm text-cave-50" aria-label={`Noter ${f.name} en additif`}
              onClick={() => noterEnAdditif(i)}>Noter en additif (g)</button>
          </p>
        ))}
        {adjuncts.length > 0 && (
          <ul className="divide-y divide-cave-850">
            {adjuncts.map((a, i) => {
              const nom = a.name.trim() || `additif ${i + 1}`;
              const message = erreur?.(`wz-adjunct-${i}`);
              return (
                <li key={i} className="py-1.5 space-y-1" data-additif={i}>
                  <div className="flex items-center gap-1.5">
                    <Input className={`${inputClass} min-w-0 flex-1`} aria-label={`Nom de l’additif ${i + 1}`} list={listeId} value={a.name} maxLength={80}
                      placeholder="Nom (coriandre, Irish moss…)" onChange={event => nommer(i, event.target.value)} />
                    <button type="button" aria-label={`Retirer ${nom}`} className="shrink-0 w-8 h-8 flex items-center justify-center text-cave-400 hover:text-cave-50"
                      onClick={() => onAdjuncts(adjuncts.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                  </div>
                  {/* k3 n° 6 et 7 : `inputClass` porte `w-full` ; avec `w-20` à côté, les trois champs se disputaient la largeur et le moment tombait
                      à une flèche de 16 px. Une grille donne les parts : quantité 5 rem, unité 4,5 rem, moment le reste (jamais moins de 7 rem). */}
                  <div className="grid grid-cols-[5rem_4.5rem_minmax(7rem,1fr)] items-center gap-1.5" data-role="additif-ligne">
                    {/* Une quantité à 0 se lit « à renseigner » : le champ reste vide, l'inconnu n'est pas écrit 0 à l'écran. */}
                    <NumberInput id={`wz-adjunct-${i}`} pad aria-label={`Quantité de ${nom}`} className={`${inputClass} min-w-0`} value={a.amount > 0 ? a.amount : undefined}
                      emptyValue={0} min={0} placeholder="0" aria-invalid={!!message || undefined} onValue={(n: number) => patch(i, { amount: n })} />
                    <select aria-label={`Unité de ${nom}`} className={`${inputClass} min-w-0`} value={a.unit} onChange={event => patch(i, { unit: event.target.value })}>
                      {[...new Set([...ADDITIF_UNITES, a.unit])].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select aria-label={`Moment de ${nom}`} className={`${inputClass} min-w-0`} value={a.step} onChange={event => patch(i, { step: event.target.value })}>
                      {[...new Set([...ADDITIF_MOMENTS, a.step])].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  {a.amount <= 0 && <p className="text-xs text-ebc-amber" data-role="additif-a-renseigner">Quantité à renseigner.</p>}
                  {message && <p role="alert" className="text-xs text-alert-strong">{message}</p>}
                </li>
              );
            })}
          </ul>
        )}
        <datalist id={listeId}>{articles.map(s => <option key={s.id} value={s.name} />)}</datalist>
        <button type="button" className="min-h-touch px-2 inline-flex items-center gap-1.5 rounded-control border border-cave-700 text-sm text-cave-50"
          onClick={() => onAdjuncts([...adjuncts, { name: '', amount: 0, unit: 'g', step: MOMENT_PAR_DEFAUT }])}>
          <Plus className="w-4 h-4" aria-hidden="true" />Ajouter un additif
        </button>
      </div>
    </details>
  );
}
