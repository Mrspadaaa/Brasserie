import React from 'react';
import type { NoloOperation } from '../../functions/src/noloSchema';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { noloOperationFacts } from '../domain/noloPresentation';

export function NoloOperationList({ operations, recipe }: { operations: NoloOperation[]; recipe: TrialRecipe }) {
  return <ol aria-label="Opérations prévues dans le bilan NOLO" className="divide-y divide-cave-800">
    {operations.map((operation, index) => {
      const addition = operation.kind === 'sugar' ? operation.recipeAddition : undefined;
      const ingredient = addition ? recipe.fermentables[addition.index] : undefined;
      const linked = ingredient && addition?.basis === JSON.stringify(ingredient);
      return <li key={operation.id} className="py-1">
        <p className="text-sm text-cave-50">{index + 1}. {operation.name || 'Opération sans nom'}</p>
        <dl className="text-xs text-cave-200">
          {noloOperationFacts(operation).map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-2">
            <dt className="text-cave-400">{label}</dt><dd className="break-words tabular-nums">{value}</dd>
          </div>)}
        </dl>
        {addition && <p className={linked ? 'text-xs text-cave-400' : 'nolo-error'}>{linked ? `Lié à ${ingredient.name} · compté une fois` : 'Lien avec l’ingrédient à vérifier'}</p>}
      </li>;
    })}
  </ol>;
}
