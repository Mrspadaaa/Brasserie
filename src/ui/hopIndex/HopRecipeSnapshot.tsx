import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { analyseHopRecipe } from '../../domain/hopRecipeDesign';
import { HopIbuRange } from './HopIbuRange';
import './hop-recipe.css';

const stageNames = { firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool', dryHop: 'À cru' };
const number = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Read-only step header: the same model and rounding as the scenario workshop. */
export function HopRecipeSnapshot({ recipe }: { recipe: TrialRecipe }) {
  const analysis = analyseHopRecipe(recipe);
  return <section className="hop-workbench hop-recipe-snapshot" aria-label="Bilan de houblonnage de la recette">
    <div className="hop-style-heading"><h3>Amertume et répartition</h3><span className="hop-small">{analysis.style.name || 'Style à préciser'}</span></div>
    {!analysis.style.ibu && !(analysis.hot.total != null && analysis.hot.total > 0)
      ? <p className="hop-snapshot-empty"><span>IBU à chaud · Tinseth</span><strong>{analysis.hot.total == null ? '—' : '0'}</strong></p>
      : <HopIbuRange current={analysis.hot.total} range={analysis.style.ibu} currentDigits={0} />}
    {analysis.phases.some(phase => phase.count > 0) && <dl className="hop-snapshot-phases" aria-label="Quantités par moment d’ajout">
      {analysis.phases.filter(phase => phase.count > 0).map(phase => <div key={phase.stage}><dt>{stageNames[phase.stage]} · {phase.count} {phase.count > 1 ? 'ajouts' : 'ajout'}</dt><dd>{number(phase.grams)} g <span>· {number(phase.doseGL)} g/L</span></dd></div>)}
    </dl>}
    {analysis.hot.missing.length > 0 && <p className="hop-warning" role="status">IBU incomplets : {analysis.hot.missing.join(' · ')}.</p>}
    {analysis.style.role && <p className="hop-small">{analysis.style.role}</p>}
  </section>;
}
