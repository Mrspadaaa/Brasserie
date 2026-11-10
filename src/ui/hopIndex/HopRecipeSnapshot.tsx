import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { analyseHopRecipe } from '../../domain/hopRecipeDesign';
import { phraseIbuIncomplet } from '../../domain/hopBitterness';
import { BORNES } from '../../domain/bornesMetier';
import { HopIbuRange } from './HopIbuRange';
import { nombreFr } from '../../domain/nombreAffiche';
import './hop-recipe.css';

const stageNames = { firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool', dryHop: 'À cru' };
const number = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
/** Une masse en grammes, au dixième : 0,004 g n'est pas « 0 g » (une masse saisie, mais minuscule), il s'écrit « < 0,1 g » (BR-41). */
const masseText = (grams: number) => grams > 0 && grams < 0.1 ? '< 0,1 g' : `${number(grams)} g`;
/** Une dose en g/L, au centième : jamais une fraction « exacte » ni une notation scientifique (TE-25, BR-41 : « 4,167 g/L (25/6 g/L exacts) », « 2E-4 g/L »).
 * Au-delà de la borne de houblon, une erreur de saisie probable se lit à 0,1 g/L près (RJ-11, « 4 166,6 g/L »). */
const doseText = (doseGL: number | undefined) => doseGL === undefined ? 'dose inconnue'
  : doseGL > BORNES.houblonGParL.max ? `${number(doseGL)} g/L`
  : doseGL > 0 && doseGL < 0.01 ? '< 0,01 g/L' : `${nombreFr(doseGL, 2)} g/L`;

/** Read-only step header: the same model and rounding as the scenario workshop. */
export function HopRecipeSnapshot({ recipe }: { recipe: TrialRecipe }) {
  const analysis = analyseHopRecipe(recipe);
  return <section className="hop-workbench hop-recipe-snapshot" aria-label="Bilan de houblonnage de la recette">
    <div className="hop-style-heading"><h3>Amertume et répartition</h3><span className="hop-small">{analysis.style.name ? (analysis.style.ibu ? analysis.style.name : `${analysis.style.name} · style non reconnu`) : 'Style à préciser'}</span></div>
    {!analysis.style.ibu && !(analysis.hot.total != null && analysis.hot.total > 0)
      ? <p className="hop-snapshot-empty"><span>IBU à chaud · Tinseth</span><strong>{analysis.hot.total == null ? '—' : '0'}</strong></p>
      : <HopIbuRange current={analysis.hot.total} range={analysis.style.ibu} currentDigits={0} />}
    {analysis.phases.some(phase => phase.count > 0) && <dl className="hop-snapshot-phases" aria-label="Quantités par moment d’ajout">
      {analysis.phases.filter(phase => phase.count > 0).map(phase => <div key={phase.stage}><dt>{stageNames[phase.stage]} · {phase.count} {phase.count > 1 ? 'ajouts' : 'ajout'}</dt><dd>{masseText(phase.grams)} <span>· {doseText(phase.doseGL)}</span></dd></div>)}
    </dl>}
    {analysis.hot.missing.length > 0 && <p className="hop-warning" role="status">IBU incomplets : {phraseIbuIncomplet(analysis.hot.missing)}</p>}
    {analysis.style.role && <p className="hop-small">{analysis.style.role}</p>}
  </section>;
}
