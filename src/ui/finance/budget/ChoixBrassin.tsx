import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Batch, Recipe } from '../../../types';
import { batchDisplayDate } from '../../../domain/batchSchedule';
import { brewBudgetDateKey } from '../../../domain/finance/brewBudget';
import { nombreFr } from '../../../domain/nombreAffiche';
import '../operations.css';
import './budget.css';

const jourCourt = (cle?: string) => cle ? new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short' }).format(new Date(`${cle}T12:00:00`)) : '';
const litres = (v?: number) => v != null && Number.isFinite(v) ? `${nombreFr(v, 1)} L` : '? L';

/**
 * m4bb-a, « Quel brassin veux-tu estimer ? » : d'abord les brassins prévus (nom, numéro · brassage, litres), puis les recettes.
 * Une recette déjà prévue en brassin n'est pas listée deux fois (passe 2 : « Pale Ale une seule fois dans le choix »).
 */
export function ChoixBrassin({ batches, recipes, onBatch, onRecipe }: { batches: Batch[]; recipes: Recipe[]; onBatch: (b: Batch) => void; onRecipe: (r: Recipe) => void }) {
  const prevus = batches.filter(b => b.status === 'planifie');
  const dejaPrevues = new Set(prevus.map(b => b.recipeSnapshot?.sourceRecipeId ?? b.recipeRef).filter(Boolean));
  const seules = recipes.filter(r => !dejaPrevues.has(r.id));
  return <div className="ops bbx bbx-choix">
    {prevus.length > 0 && <section aria-label="Prévus"><p className="bbx-k">Prévus</p>
      {prevus.map(b => { const jour = jourCourt(brewBudgetDateKey(batchDisplayDate(b) ?? '')); return <button key={b.id} type="button" className="bbx-row" onClick={() => onBatch(b)}>
        <span className="bbx-bar" style={{ background: '#2F6EA8' }} aria-hidden="true" />
        <span className="bbx-q2"><b>{b.name}</b><small>{b.id}{jour ? ` · brassage ${jour}` : ''}</small></span>
        <span className="ops-m">{litres(b.volumeL)}</span><ChevronRight size={14} aria-hidden="true" />
      </button>; })}
    </section>}
    {seules.length > 0 && <section aria-label="Recettes"><p className="bbx-k">Recettes</p>
      {seules.map(r => <button key={r.id} type="button" className="bbx-row" onClick={() => onRecipe(r)}>
        <span className="bbx-bar" style={{ background: 'rgb(var(--c-d2b356))' }} aria-hidden="true" />
        <span className="bbx-q2"><b>{r.name}</b><small>Recette</small></span>
        <span className="ops-m">{litres(r.volumeL)}</span><ChevronRight size={14} aria-hidden="true" />
      </button>)}
    </section>}
    {!recipes.length && !prevus.length && <p className="bbx-vide-msg" role="status">Crée d’abord une recette dans Brassins pour calculer ses besoins.</p>}
  </div>;
}
