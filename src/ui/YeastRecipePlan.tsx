import { useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { YeastReference } from '../domain/yeastReferences';
import {
  applyYeastRecipeDesign, calculateYeastCellRequirement, createYeastRecipeDraft, evaluateYeastRecipeDesign,
  YEAST_RECIPE_GOAL_LABELS, YEAST_STYLE_FAMILIES,
  yeastRecipeHopSummary,
  type YeastRecipeDraft, type YeastRecipeEvaluation, type YeastRecipeGoal,
} from '../domain/yeastRecipeDesign';
import { NumberInput } from './NumberInput';
import { Input } from './Input';
import { YeastRangeComparison } from './YeastRangeComparison';
import { proposeYeastFermentationStrategy, type YeastFermentationStrategy } from '../domain/yeastFermentationStrategy';

const number = (value?: number | null, digits = 1) => Number.isFinite(value) ? value!.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';
export const projectionRange = (value: { min: number; max: number } | null | undefined, digits: number) => value
  ? `${value.min.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}${value.min === value.max ? '' : `–${value.max.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`}` : 'À préciser';
const processLabels = {
  unspecified: 'Fermentation alcoolique · procédé à confirmer', preacidified: 'Moût déjà acidifié',
  'acidifying-yeast': 'Levure acidifiante', 'mixed-culture': 'Cultures mixtes / successives',
};
const recipeKey = (recipe: TrialRecipe) => JSON.stringify({ yeast: recipe.yeast, yeastDesign: recipe.yeastDesign,
  fermentation: recipe.fermentation, fermentables: recipe.fermentables, hops: recipe.hops, mash: recipe.mash,
  style: recipe.style, styleRef: recipe.styleRef, volumeL: recipe.volumeL, ogTarget: recipe.ogTarget, efficiencyPct: recipe.efficiencyPct });

export function yeastWarningsForReading(result: YeastRecipeEvaluation): string[] {
  const processExplained = !result.abv.range && result.abv.reasons.some(reason => /acid|culture/i.test(reason));
  const temperatureExplained = result.warnings.some(text => /hors de la plage de conduite/.test(text));
  const wineHypothesisExplained = result.warnings.some(text => text.startsWith('Usage vin/cidre/conditionnement :'));
  return [...new Set([...result.warnings,
    ...result.effects.filter(effect => effect.state === 'warning' && !(effect.id === 'temperature' && temperatureExplained)).map(effect => effect.id === 'dose' ? `Quantité prévue hors du repère fabricant : ${effect.impact}.` : effect.impact)
  ])].filter(text => !text.startsWith('Souche non identifiée') && !text.startsWith('Fenêtre de température absente') && !text.startsWith('Usage non documenté pour cette famille') &&
    !(wineHypothesisExplained && text.startsWith('Usage vin, cidre')) &&
    !(processExplained && /^(Fermentation acidulée ou culture spécialisée|Procédé acidulé à préciser)/.test(text)));
}

export function YeastProjectionReading({ result }: { result: YeastRecipeEvaluation }) {
  const attenuation = result.projection?.attenuation;
  return <section className="yc-projection" aria-label="Aperçu de la fermentation de cette recette">
    <div className="yc-projection-title"><h4>Dans cette recette</h4><span className="yeast-small">Estimation</span></div>
    <dl className="yc-projection-values"><div><dt>Densité finale · SG</dt><dd>{projectionRange(result.fg.range, 3)}</dd></div>
      <div><dt>Alcool · % vol</dt><dd>{projectionRange(result.abv.range, 1)}</dd></div></dl>
    {attenuation && <p className="yeast-small">Atténuation {number(attenuation.range.min, 20)}{attenuation.range.max !== attenuation.range.min ? `–${number(attenuation.range.max, 20)}` : ''} % · {attenuation.basis === 'measured' ? 'retour mesuré' : attenuation.basis === 'recipe' ? 'hypothèse de recette' : 'donnée annoncée'}.</p>}
    {!result.fg.range && <p className="yeast-notice">{result.fg.reasons[0]}</p>}
    {!result.abv.range && result.abv.reasons[0] !== result.fg.reasons[0] && <p className="yeast-notice">{result.abv.reasons[0]}</p>}
  </section>;
}

/** Sequence of known contacts, not a claimed biochemical response or a kinetic curve. */
function Contacts({ recipe }: { recipe: TrialRecipe }) {
  const primary = recipe.fermentation?.find(step => step.kind === 'primaire');
  const contacts = yeastRecipeHopSummary(recipe);
  return <section className="yc-contacts" aria-label="Conduite et contacts des houblons">
    <h4>Levure et houblons dans la recette</h4>
    <ol className="yc-contact-sequence">
      <li><strong>Départ</strong><span>{number(recipe.yeast.pitchTempC)} °C</span></li>
      <li><strong>Fermentation</strong><span>{number(primary?.tempC)} °C · {number(primary?.days)} j</span><span>{number(contacts.activeG)} g à cru</span></li>
      <li><strong>Après</strong><span>{number(contacts.postG)} g à cru</span></li>
    </ol>
    {!!contacts.additions.length && <table className="yc-contact-table"><caption className="sr-only">Contacts de houblon prévus</caption><thead><tr><th>Ajout / phase</th><th>Dose</th><th>Contact</th></tr></thead><tbody>
      {contacts.additions.map((hop, i) => <tr key={i}><th scope="row">{hop.name}<span className="yeast-small">{hop.phase === 'active' ? 'Active' : hop.phase === 'post' ? 'Après fermentation' : 'Phase à préciser'}{hop.dayOffset != null ? ` · J+${number(hop.dayOffset)}` : ''}</span></th><td>{number(hop.doseGL)} g/L</td><td>{number(hop.contactHours)} h<br />{number(hop.temperatureC)} °C</td></tr>)}
    </tbody></table>}
    <p className="yeast-small">Ordre des phases, jours indicatifs. La fin de fermentation se confirme à la densité, après le dernier houblonnage.</p>
  </section>;
}

/** Recipe creation only. Every local setting belongs to a proposal until one atomic apply. */
export function YeastRecipePlan({ recipe, refs, onChange, onCompare, onGoal, initialGoal, initialYeastId }: {
  recipe: TrialRecipe; refs: YeastReference[]; onChange: (value: TrialRecipe) => TrialRecipe | void;
  onCompare: () => void; onGoal: (goal: YeastRecipeGoal) => void; initialGoal?: YeastRecipeGoal; initialYeastId?: string;
}) {
  const id = useId(), key = recipeKey(recipe);
  const launcher = useRef<HTMLButtonElement>(null);
  const goalControl = useRef<HTMLSelectElement>(null);
  const [local, setLocal] = useState(() => {
    const draft = createYeastRecipeDraft(recipe, refs, undefined, initialYeastId);
    return { key, draft: { ...draft, ...(initialGoal ? { goal: initialGoal } : {}) } };
  });
  const [open, setOpen] = useState(!!initialGoal || !!initialYeastId);
  const [edited, setEdited] = useState(!!initialGoal || !!initialYeastId);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [rationale, setRationale] = useState('');
  const [strategy, setStrategy] = useState<YeastFermentationStrategy>();
  const [emptyPhaseFields, setEmptyPhaseFields] = useState<string[]>([]);
  const currentDraft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  // Local reference enrichment may finish on mount. Only a trial the brewer
  // has actually edited needs stale protection; a pristine one follows reality.
  const draft = !edited && local.key !== key ? currentDraft : local.draft;
  const stale = edited && local.key !== key;
  const current = useMemo(() => evaluateYeastRecipeDesign(recipe, currentDraft, refs), [recipe, currentDraft, refs]);
  const result = useMemo(() => evaluateYeastRecipeDesign(recipe, draft, refs), [recipe, draft, refs]);
  const goals = YEAST_STYLE_FAMILIES.find(style => style.id === draft.styleId)?.goals ?? ['balanced' as const];
  const patch = (value: Partial<YeastRecipeDraft>) => { setLocal({ key: edited ? local.key : key, draft: { ...draft, ...value } }); setEdited(true); setNotice(''); setError(''); };
  const propose = (goal = draft.goal) => {
    const base = { ...(stale ? currentDraft : draft), goal };
    const suggestion = proposeYeastFermentationStrategy(recipe, base, refs);
    setLocal({ key, draft: { ...base, ...suggestion.patch } });
    setEdited(true);
    setRationale(suggestion.rationale); setStrategy(suggestion); onGoal(goal);
    setOpen(true); setNotice(''); setError(''); setEmptyPhaseFields([]);
    requestAnimationFrame(() => goalControl.current?.scrollIntoView({ block: 'start' }));
  };
  const reset = () => { setLocal({ key, draft: currentDraft }); setEdited(false); setOpen(false); setNotice('Essai annulé. La recette reste inchangée.'); setError(''); setRationale(''); setStrategy(undefined); setEmptyPhaseFields([]); onGoal(currentDraft.goal); requestAnimationFrame(() => launcher.current?.focus()); };
  const apply = () => {
    try {
      if (stale) throw Error('La recette ou les données de la souche ont changé. Reprends leur état actuel avant d’appliquer.');
      if (emptyPhaseFields.length) throw Error('Complète les températures et durées du programme avant de l’appliquer.');
      const next = applyYeastRecipeDesign(recipe, draft, refs, 'settings');
      const accepted = onChange(next) || next;
      setLocal({ key: recipeKey(accepted), draft: createYeastRecipeDraft(accepted, refs) });
      setEdited(false);
      setStrategy(undefined); setRationale('');
      setOpen(false); setNotice('Conduite appliquée au brouillon. Elle sera conservée avec la recette.'); setError('');
      requestAnimationFrame(() => launcher.current?.focus());
    } catch (e) { setError(e instanceof Error ? e.message : 'Vérifie les valeurs du scénario.'); }
  };
  let preview: TrialRecipe = recipe;
  try { if (!result.errors.length) preview = applyYeastRecipeDesign(recipe, draft, refs, 'settings'); } catch { /* Visible validation below. */ }
  const cells = calculateYeastCellRequirement({ volumeL: recipe.volumeL, og: result.projection?.og ?? recipe.ogTarget,
    pitchRateMillionPerMlPlato: draft.pitchRateMillionPerMlPlato, viableCellsBillion: draft.viableCellsBillion });
  const warnings = yeastWarningsForReading(result);
  const rawProgramme = draft.programme ?? recipe.fermentation ?? [];
  const primaryIndex = rawProgramme.findIndex(phase => phase.kind === 'primaire');
  const programme = rawProgramme.map((phase, index) => index === primaryIndex ? { ...phase, tempC: draft.temperatureC ?? phase.tempC, days: draft.days ?? phase.days } : phase);
  const totalDays = !emptyPhaseFields.some(field => field.endsWith('-days')) && programme.length && programme.every(phase => Number.isFinite(phase.days)) ? programme.reduce((sum, phase) => sum + phase.days, 0) : undefined;
  const changePhase = (index: number, values: { tempC?: number; days?: number }) => {
    const field = `${index}-${Object.keys(values)[0]}`;
    if (Object.values(values).some(value => value === undefined)) { setEmptyPhaseFields(fields => [...new Set([...fields, field])]); return; }
    setEmptyPhaseFields(fields => fields.filter(value => value !== field));
    const next = programme.map((phase, i) => i === index ? { ...phase, tempC: values.tempC ?? phase.tempC, days: values.days ?? phase.days } : phase);
    patch({ programme: next, ...(index === primaryIndex ? { temperatureC: next[index].tempC, days: next[index].days } : {}) });
  };
  return <section className="yc-plan" aria-label="Préparer une conduite de fermentation">
    <div className="yc-goal-row"><label htmlFor={`${id}-goal`}>Profil recherché</label>
      <select ref={goalControl} id={`${id}-goal`} value={draft.goal} onChange={e => propose(e.target.value as YeastRecipeGoal)}>
        {goals.map(goal => <option key={goal} value={goal}>{YEAST_RECIPE_GOAL_LABELS[goal]}</option>)}
      </select><button type="button" onClick={() => propose()}>Proposer une conduite</button>
    </div>
    <p className="yeast-small">{(draft.styleId === 'sour' || currentDraft.process !== 'unspecified') && <>{processLabels[currentDraft.process ?? 'unspecified']} · </>}<button ref={launcher} type="button" className="yeast-link" onClick={() => { setOpen(value => !value); if (!open) setStrategy(undefined); }} aria-expanded={open} aria-controls={`${id}-proposal`}>{open ? 'Replier l’essai' : 'Régler / simuler'}</button></p>
    <div id={`${id}-proposal`} hidden={!open} className="yc-proposal" aria-label="Scénario de levure">
      <div className="yc-projection-title"><h4>{result.candidate?.label || recipe.yeast.name} · {edited ? 'essai' : 'conduite actuelle'}</h4><span className="yc-tag">{edited ? 'Non appliqué' : 'Recette'}</span></div>
      {strategy && <section className="yc-strategy-effects" aria-label="Effets attendus de la stratégie"><h4>{strategy.title}</h4>{strategy.effects.map(effect => <p key={effect.label}><strong>{effect.label}</strong> · {effect.expected}{effect.limit && <span className="yeast-small block">{effect.limit}</span>}</p>)}</section>}
      {stale && <div className="yeast-notice" role="alert">La recette ou la fiche de la souche a changé. <button type="button" onClick={() => { setLocal({ key, draft: currentDraft }); setEdited(false); setRationale(''); setStrategy(undefined); setEmptyPhaseFields([]); onGoal(currentDraft.goal); }}>Reprendre les données actuelles</button></div>}
      {programme.length > 0 && <section className="yc-programme" aria-label="Programme proposé"><div className="yc-projection-title"><h4>Conduite prévue</h4><span className="yc-number">{number(totalDays)} j indicatifs</span></div>
        <p className="yeast-small">Température de la bière · durées de planification</p>
        <ol>{programme.map((phase, index) => { const condition = strategy?.phases[index]?.condition ?? phase.note; return <li key={index}><div className="yc-phase-row"><strong>{phase.name}</strong><label><span className="sr-only">Température de {phase.name}</span><NumberInput aria-label={`Température du palier ${index + 1}`} aria-invalid={emptyPhaseFields.includes(`${index}-tempC`)} value={phase.tempC} emptyValue={undefined} onValue={tempC => changePhase(index, { tempC })} /><span>°C</span></label><label><span className="sr-only">Durée de {phase.name}</span><NumberInput aria-label={`Durée du palier ${index + 1}`} aria-invalid={emptyPhaseFields.includes(`${index}-days`)} value={phase.days} min={0} emptyValue={undefined} onValue={days => changePhase(index, { days })} /><span>j</span></label></div>{condition && <p className="yeast-small">{condition}</p>}</li>; })}</ol>
      </section>}
      {warnings.length > 0 && <ul className="yc-alerts" aria-label="Points à vérifier dans le scénario">{warnings.map(text => <li key={text}>{text}</li>)}</ul>}
      {!!result.activeHopTemperatureConflicts?.length && <label className="yeast-check"><input type="checkbox" checked={draft.alignActiveHopTemperature ?? false} onChange={e => patch({ alignActiveHopTemperature: e.target.checked })} /><span>Aligner les ajouts en fermentation active sur {number(draft.temperatureC)} °C<span className="yeast-small block">Sans cette option, leurs températures restent celles de la recette.</span></span></label>}
      <details className="yc-adjustments" open={result.errors.length > 0 || !programme.length || draft.styleId === 'sour'}><summary>Hypothèses et réglages complémentaires<ChevronDown size={14} aria-hidden="true" /></summary>
      <div className="yc-scenario-inputs">
        <div className="yeast-setting-line"><label htmlFor={`${id}-att`}>Atténuation retenue pour l’essai<span className="yeast-small block">Hypothèse sur ce moût</span></label><NumberInput id={`${id}-att`} aria-label="Atténuation retenue pour le scénario" value={draft.attenuationPct} min={0} max={100} emptyValue={undefined} onValue={attenuationPct => patch({ attenuationPct, attenuationBasis: 'recipe' })} placeholder="Fiche" /><span>%</span></div>
        {result.projection.dossier.documentedAttenuation && draft.attenuationPct !== undefined && <button type="button" className="yeast-link" onClick={() => patch({ attenuationPct: undefined, attenuationBasis: 'declared' })}>Utiliser la plage de la fiche</button>}
        <div className="yeast-setting-line"><label htmlFor={`${id}-temp`}>Consigne de fermentation<span className="yeast-small block">Température de la bière</span></label><NumberInput id={`${id}-temp`} aria-label="Température principale du scénario" value={draft.temperatureC} emptyValue={undefined} onValue={temperatureC => patch({ temperatureC })} /><span>°C</span></div>
      </div>
      {result.candidate?.temperature && <p className="yeast-small">Plage fabricant : {projectionRange(result.candidate.temperature.range, 1)} °C. La température ne modifie pas numériquement l’atténuation dans ce modèle.</p>}
      <div className="yc-preview-pair">
        <YeastRangeComparison label="Densité finale" unit="SG" digits={3} current={current.fg.range} proposed={result.fg.range} />
        <YeastRangeComparison label="Alcool estimé" unit="% vol" current={current.abv.range} proposed={result.abv.range} />
      </div>
      {!result.fg.range && <p className="yeast-notice">{result.fg.reasons[0]}</p>}
      {!result.abv.range && <p className="yeast-notice">{result.abv.reasons[0]}</p>}
      <label className="yc-process-label" htmlFor={`${id}-process`}>Procédé de fermentation<select id={`${id}-process`} value={draft.process ?? 'unspecified'} onChange={e => patch({ process: e.target.value as YeastRecipeDraft['process'] })}>{Object.entries(processLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {(draft.process === 'mixed-culture' || draft.process === 'acidifying-yeast') && <div className="yc-cultures"><p className="yeast-small">Décris les rôles. Le pH et la production d’alcool des cultures ne sont pas déduits d’un nom.</p>
        {(draft.cultureRoles ?? []).map((culture, index) => <div key={index} className="yc-culture-row"><Input aria-label={`Culture ${index + 1}`} value={culture.name} onChange={e => patch({ cultureRoles: draft.cultureRoles!.map((value, i) => i === index ? { ...value, name: e.target.value } : value) })} />
          <select aria-label={`Rôle de la culture ${index + 1}`} value={culture.role} onChange={e => patch({ cultureRoles: draft.cultureRoles!.map((value, i) => i === index ? { ...value, role: e.target.value as typeof culture.role } : value) })}><option value="alcoholic">Alcoolique</option><option value="acidifying">Acidifiante</option><option value="conditioning">Maturation</option><option value="mixed">Mixte</option></select>
          <button type="button" aria-label={`Retirer la culture ${index + 1}`} onClick={() => patch({ cultureRoles: draft.cultureRoles!.filter((_, i) => i !== index) })}>×</button></div>)}
        <button type="button" onClick={() => patch({ cultureRoles: [...draft.cultureRoles ?? [], { name: '', role: 'mixed' }] })}>Ajouter une culture</button>
      </div>}
      <details className="yc-preparation"><summary>Ensemencement, durée et pression<ChevronDown size={14} aria-hidden="true" /></summary><div>
        <div className="yeast-setting-line"><label htmlFor={`${id}-pitch`}>Ensemencement</label><NumberInput id={`${id}-pitch`} aria-label="Température d’ensemencement du scénario" value={draft.pitchTempC} emptyValue={undefined} onValue={pitchTempC => patch({ pitchTempC })} /><span>°C</span></div>
        <div className="yeast-setting-line"><label htmlFor={`${id}-days`}>Durée indicative</label><NumberInput id={`${id}-days`} aria-label="Durée principale du scénario en jours" min={0} value={draft.days} emptyValue={undefined} onValue={days => patch({ days })} /><span>j</span></div>
        <div className="yeast-setting-line"><label htmlFor={`${id}-pressure`}>Contre-pression précoce</label><NumberInput id={`${id}-pressure`} aria-label="Contre-pression du scénario en bar" min={0} value={draft.pressureBar} emptyValue={undefined} onValue={pressureBar => patch({ pressureBar })} /><span>bar rel.</span></div>
        <p className="yeast-small">Vide : inconnue. 0 bar : sans contre-pression. Les jours servent au calendrier, pas à attester la fin de fermentation.</p>
        {(draft.styleId === 'weissbier' || draft.styleId === 'witbier') && <label className="yeast-check"><input type="checkbox" checked={draft.ferulicRest} onChange={e => patch({ ferulicRest: e.target.checked })} /><span>Repos férulique · 44 °C, 15 min si absent</span></label>}
        {recipe.yeast.form === 'sèche' ? <><div className="yeast-setting-line"><label htmlFor={`${id}-grams`}>Masse sèche prévue</label><NumberInput id={`${id}-grams`} aria-label="Masse de levure du scénario en grammes" min={0} value={draft.quantityG} emptyValue={undefined} onValue={quantityG => patch({ quantityG })} /><span>g</span></div><p className="yeast-small">Dose fabricant au volume de la recette : {projectionRange(result.doseG?.range, 1)} g.</p></>
          : <><div className="yeast-setting-line"><label htmlFor={`${id}-rate`}>Taux visé · M cellules/mL/°P</label><NumberInput id={`${id}-rate`} aria-label="Taux de cellules visé par mL et degré Plato" min={0} value={draft.pitchRateMillionPerMlPlato} emptyValue={undefined} onValue={pitchRateMillionPerMlPlato => patch({ pitchRateMillionPerMlPlato })} /></div>
            <div className="yeast-setting-line"><label htmlFor={`${id}-cells`}>Cellules viables disponibles</label><NumberInput id={`${id}-cells`} aria-label="Cellules viables disponibles en milliards" min={0} value={draft.viableCellsBillion} emptyValue={undefined} onValue={viableCellsBillion => patch({ viableCellsBillion })} /><span>Md</span></div>
            <output className="yc-cell-result">{cells.requiredBillion == null ? 'Besoin calculable avec volume, densité et taux visé.' : `${number(cells.requiredBillion)} Md nécessaires${cells.balanceBillion == null ? ' · disponibilité inconnue' : ` · écart ${number(cells.balanceBillion)} Md`}`}</output>
            <p className="yeast-small">Le taux est une hypothèse. Aucun nombre de flacons ni volume de levain sans comptage viable.</p>
          </>}
      </div></details>
      </details>
      <details aria-label="Changements proposés" className="yc-diff"><summary>Recette → proposition · {result.changes.length} changement{result.changes.length > 1 ? 's' : ''}<ChevronDown size={14} aria-hidden="true" /></summary>
        {result.changes.length ? <table><thead><tr><th>Réglage</th><th>Actuel</th><th>Proposé</th></tr></thead><tbody>{result.changes.map(change => <tr key={change.id}><th scope="row">{change.label}</th><td>{change.before}</td><td>{change.after}</td></tr>)}</tbody></table> : <p className="yeast-small">Même conduite. Tu peux conserver l’objectif ou ajuster un réglage.</p>}
      </details>
      {result.errors.map(text => <p key={text} className="yeast-error" role="alert">{text}</p>)}
      {!!emptyPhaseFields.length && <p className="yeast-error" role="alert">Complète les températures et durées du programme avant de l’appliquer.</p>}
      {error && <p className="yeast-error" role="alert">{error}</p>}
      <div className="yc-actions"><button className="yc-apply" type="button" disabled={!edited || stale || result.errors.length > 0 || emptyPhaseFields.length > 0} onClick={apply}>Appliquer les changements</button><button type="button" onClick={reset}>Annuler l’essai</button></div>
      <p className="yeast-small">Seule cette action reprend l’essai dans la recette. Passer à l’étape suivante ne l’applique pas.</p>
      <button type="button" className="yeast-link" onClick={onCompare}>Comparer les souches pour ce profil</button>
      <details><summary>Contacts, calcul et sources<ChevronDown size={14} aria-hidden="true" /></summary><div>
        {rationale && <p className="yc-rationale">{rationale}</p>}
        {strategy && <section><h4>Consignes détaillées du programme</h4>{programme.filter(phase => phase.note).map((phase, i) => <p className="yeast-small" key={i}><strong>{phase.name}</strong> · {phase.note}</p>)}</section>}
        {result.candidate?.preferred && <p className="yeast-small">{result.candidate.reason}</p>}
        <Contacts recipe={preview} />
        {result.effects.filter(effect => effect.state !== 'warning' && ['temperature', 'pressure', 'hop-active', 'hop-post', 'ferulic'].includes(effect.id)).map(effect => <p key={effect.id} className="text-[13px]"><strong>{effect.impact}</strong> · {effect.detail}</p>)}
        {result.fg.reasons.map(reason => <p className="yeast-small" key={reason}>{reason}</p>)}
        {result.projection?.extract && <p className="yeast-small">Extrait : {number(result.projection.extract.totalPoints, 2)} points, dont {number(result.projection.extract.unfermentablePoints, 2)} non fermentescibles et {number(result.projection.extract.sugarPoints, 2)} de sucres.</p>}
        {[...new Map([...result.sources, ...strategy?.sources ?? []].map(source => [source.reference, source])).values()].map((source, i) => <p className="yeast-small" key={i}>{/^https?:\/\//.test(source.reference) ? <a className="yeast-source" href={source.reference} target="_blank" rel="noreferrer">{source.author} · {source.title}</a> : `${source.author} · ${source.title}`}</p>)}
      </div></details>
    </div>
    {notice && <p role="status" className="yeast-small">{notice}</p>}
  </section>;
}
