import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { TrialRecipe } from '../../src/domain/hopIndex/trials';
import { YeastRecipePlan } from '../../src/ui/YeastRecipePlan';
import '../../src/index.css';
import '../../src/ui/yeast-choice.css';
import { fermentationUxRecipe, fermentationUxRefs } from './fermentation.fixture-data';

function Fixture() {
  const [recipe, setRecipe] = useState<TrialRecipe>(fermentationUxRecipe);
  return <main className="yeast-choice mx-auto max-w-3xl p-3 sm:p-5">
    <header className="mb-3 border-b border-cave-700 pb-2">
      <h1 className="text-lg font-semibold text-cave-50">Essai UX · programme de fermentation</h1>
      <p className="text-xs text-cave-400">Recette QA locale · programme et calculs de l’application.</p>
    </header>
    <YeastRecipePlan recipe={recipe} refs={fermentationUxRefs}
      onChange={next => { setRecipe(next); return next; }} onCompare={() => undefined} onGoal={() => undefined} />
    <output className="sr-only" aria-label="Programme appliqué à la recette">
      {(recipe.fermentation ?? []).map(phase => `${phase.name}: ${phase.days} j, ${phase.tempC} °C`).join(' · ')}
    </output>
  </main>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);
