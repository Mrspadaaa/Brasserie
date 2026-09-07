import { Units } from '../services/units';
import React, { useEffect, useState } from 'react';
import { Calculator, ChevronDown, Thermometer } from 'lucide-react';
import { BrewDayState, BrewDayStep, RecipeSnapshot, StockItem, BrewhouseProfile } from '../types';
import { BrewEquipmentSummary } from './BrewEquipmentSummary';
import { ReadingKind } from '../domain/brewDay';
import {
  actualWater,
  boilScenario,
  pitchFeedback,
  rampExposure,
  round,
  thermalEstimate,
  waterScenario,
  wortRescue
} from '../domain/brewAssist';
import {
  boilMinutes,
  changeBoilMinutes,
  effectiveFermentables,
  isBoilStep
} from '../domain/brewCompanion';
import { brewNow } from '../services/brewClock';
import { BrewUpdate, brewControl, brewInput } from './BrewDayMeasurements';
import { BrewChoice } from './BrewChoice';
import { BrewTag } from './BrewTag';
import { NumberInput } from './NumberInput';

function NumberField({
  label,
  value,
  set,
  min = 0,
  max = 1000
}: {
  label: string;
  value: number | undefined;
  set: (v: number | undefined) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="brew-assist-field">
      <span>{label}</span>
      <NumberInput
        aria-label={label}
        value={value}
        onValue={set}
        emptyValue={undefined}
        min={min}
        max={max}
        className={brewInput}
      />
    </label>
  );
}

/** Follow the live journal until a what-if draft is edited, then preserve that draft. */
function useScenarioValue<T>(source: T, scope = ''): [T, (value: T) => void] {
  const [draft, setDraft] = useState({ source, value: source, scope });
  useEffect(() => {
    setDraft((d) =>
      d.scope !== scope || Object.is(d.value, source) || Object.is(d.source, d.value)
        ? { source, value: source, scope }
        : d
    );
  }, [source, scope]);
  const dirty = draft.scope === scope && !Object.is(draft.source, draft.value);
  return [dirty ? draft.value : source, (value: T) => setDraft({ source, value, scope })];
}

/** One collapsed, contextual workbench. A simulation never records a physical action. */
export function BrewAssist({
  recipe,
  state,
  step,
  now,
  update,
  onMeasure,
  stock = [],
  brewhouse
}: {
  recipe: RecipeSnapshot;
  state: BrewDayState;
  step: BrewDayStep;
  now: number;
  update: BrewUpdate;
  onMeasure: (kind: ReadingKind) => void;
  stock?: StockItem[];
  brewhouse?: BrewhouseProfile;
}) {
  const boil = isBoilStep(step) || step.id === 'preboil' || step.id === 'fwh';
  const cooling = ['refroidissement', 'whirlpool', 'ensemencement'].includes(step.id);
  const heating = /^mash/.test(step.id);
  const water = step.id === 'eau' || step.id === 'sparge';
  const [side, setSide] = useState<'mash' | 'sparge'>(step.id === 'sparge' ? 'sparge' : 'mash');
  const [ro, setRo] = useScenarioValue<number | undefined>(
    actualWater(recipe, state, side).roL,
    side
  );
  const [minutes, setMinutes] = useScenarioValue<number | undefined>(boilMinutes(state, recipe));
  const hops = (recipe.hops ?? [])
    .map((h, i) => ({ ...h, id: `hop-${i}` }))
    .filter((h) => h.stage === 'boil');
  const [hopId, setHopId] = useState(hops[0]?.id ?? '');
  const hop = hops.find((h) => h.id === hopId);
  const elapsedOf = (id: string) => {
    const h = hops.find((x) => x.id === id),
      done = state.additions?.[id]?.doneAt;
    return done != null && state.boilStartedAt != null
      ? round((done - state.boilStartedAt) / 60000)
      : (state.hopElapsedMin?.[id] ?? Math.max(0, boilMinutes(state, recipe) - (h?.timeMin ?? 0)));
  };
  const [elapsed, setElapsed] = useScenarioValue<number | undefined>(
    hop ? elapsedOf(hop.id) : undefined,
    hopId
  );
  const [evap, setEvap] = useScenarioValue<number | undefined>(
    state.boilOffLPerHour ?? recipe.brewhouse?.equipment?.boilOffLPerHour
  );
  const [coolant, setCoolant] = useScenarioValue<number | undefined>(state.coolingWaterC);
  const [notice, setNotice] = useState('');
  const w = waterScenario(recipe, state, side, ro!);
  const simulation = boilScenario(recipe, state, minutes!, hopId || undefined, elapsed, evap);
  const target = step.tempC ?? recipe.fermentation?.[0]?.tempC ?? recipe.yeast?.pitchTempC;
  const thermal =
    (heating || cooling || step.id === 'sparge') && target != null
      ? thermalEstimate(state, step, target, now, coolant, recipe.mash?.heatingRateCPerMin)
      : null;
  const exposure = heating ? rampExposure(state, step) : 0;
  const thermalAttention =
    thermal && ['overshoot', 'below', 'stalled', 'unreachable'].includes(thermal.status);
  const rescue = wortRescue(state, step.id, recipe.ogTarget, recipe);
  const grist = effectiveFermentables(recipe, state)
    .filter((f) => f.kind === 'grain' && f.use === 'empatage')
    .reduce((sum, f) => sum + f.weightKg, 0);
  const ratio = grist > 0 ? actualWater(recipe, state, 'mash').litres / grist : null;
  const save = (fn: Parameters<BrewUpdate>[0], message: string) => {
    update(fn);
    setNotice(message);
  };
  return (
    <details className="brew-assist">
      <summary>
        <span>
          <Calculator size={18} /> Aide à cette étape
        </span>
        <span className="brew-assist-summary">
          <BrewTag
            tone={
              thermalAttention
                ? 'due'
                : thermal?.status === 'reached'
                  ? 'done'
                  : thermal?.status === 'estimate'
                    ? 'active'
                    : cooling
                      ? 'info'
                      : water
                        ? 'info'
                        : 'pause'
            }
          >
            {thermalAttention
              ? 'À ajuster'
              : thermal?.status === 'reached'
                ? 'À consigne'
                : cooling
                  ? 'Refroidir'
                  : heating
                    ? 'Chauffer'
                    : water
                      ? 'Ajuster l’eau'
                      : boil
                        ? 'Simuler'
                        : 'Rattraper'}
          </BrewTag>
          <ChevronDown size={16} />
        </span>
      </summary>
      <div className="brew-assist-body">
        <BrewEquipmentSummary recipe={recipe} profile={brewhouse} state={state} stepId={step.id} />
        {water && (
          <section aria-label="Ajuster la coupe d’eau">
            <h3>La bonne eau, avec ce que tu as</h3>
            <div className="brew-assist-pills" role="group" aria-label="Eau à ajuster">
              {(['mash', 'sparge'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  aria-pressed={side === s}
                  onClick={() => {
                    setSide(s);
                    setRo(actualWater(recipe, state, s).roL);
                    setNotice('');
                  }}
                >
                  {s === 'mash' ? 'Empâtage' : `Rinçage · ${recipe.mash?.spargeTempC ?? 76} °C`}
                </button>
              ))}
            </div>
            <p className="brew-muted">
              {round(actualWater(recipe, state, side).litres)} L au total · coupe prévue{' '}
              {actualWater(recipe, state, side).plannedPct} % osmosée. Modifie le volume total dans
              les ingrédients si nécessaire.
            </p>
            <NumberField
              label="Osmosée réellement disponible (L)"
              value={ro}
              set={setRo}
              max={actualWater(recipe, state, side).litres}
            />
            {w ? (
              <>
                <div className="brew-assist-result">
                  <strong>
                    {round(w.roL)} L osmosée + {round(w.tapL)} L réseau
                  </strong>
                  <p>{w.message}</p>
                </div>
                {w.ions && (
                  <p className="brew-muted">
                    Avec les doses renseignées : Ca {round(w.ions.ca)} · SO₄ {round(w.ions.so4)} ·
                    Cl {round(w.ions.cl)} · HCO₃ {round(w.ions.hco3)} mg/L.{' '}
                    {w.sourceInferred
                      ? 'Source reconstituée depuis l’analyse diluée de la recette.'
                      : 'Selon l’analyse de la source.'}
                  </p>
                )}
                {w.replaceL > 0.01 && (
                  <p>
                    {!w.treated && !(side === 'mash' && w.grainIn)
                      ? `Avant tout sel, acide ou grain : pour retrouver la coupe sans changer le volume, remplace ${round(w.replaceL)} L du mélange homogène par de l’eau ${w.replacement}.`
                      : 'Eau déjà versée ou traitée : ne retire pas le mélange pour appliquer cette correction. Mesure le pH et recalcule le traitement sur la coupe réelle.'}{' '}
                    {w.addL != null && w.addL > 0.01 && !w.treated && !w.grainIn
                      ? `Un simple ajout demanderait ${round(w.addL)} L d’eau ${w.replacement} en plus : cela change aussi le volume et les dosages.`
                      : ''}
                  </p>
                )}
                <button
                  type="button"
                  className={brewControl}
                  onClick={() =>
                    save(
                      (s) => ({
                        ...s,
                        waterMix: { ...s.waterMix, [side]: { roL: w.roL } }
                      }),
                      'Coupe réelle consignée. Les quantités réseau / osmosée sont actualisées.'
                    )
                  }
                >
                  Consigner cette coupe
                </button>
              </>
            ) : (
              <p className="brew-muted">
                Renseigne une quantité comprise dans le volume total prévu.
              </p>
            )}
          </section>
        )}
        {(heating || cooling || step.id === 'sparge') && (
          <section aria-label="Aide température">
            <h3>
              <Thermometer size={17} />{' '}
              {cooling
                ? 'Estimer l’arrivée à la consigne'
                : heating
                  ? 'Montée, puis maintien'
                  : 'Chauffer l’eau de rinçage'}
            </h3>
            {cooling && (
              <NumberField
                label="Eau de refroidissement (°C)"
                value={coolant}
                set={setCoolant}
                min={0}
                max={60}
              />
            )}
            {['refroidissement', 'ensemencement'].includes(step.id) &&
              recipe.fermentation?.[0]?.tempC != null &&
              target != null &&
              target > recipe.fermentation[0].tempC + 2 && (
                <div className="brew-feedback">
                  <p>
                    La fermentation est prévue à {recipe.fermentation[0].tempC} °C, mais cette étape
                    vise {target} °C. Pour un départ maîtrisé, termine le refroidissement à la
                    température de fermentation en vérifiant la fiche levure.
                  </p>
                  <button
                    type="button"
                    className={brewControl}
                    onClick={() =>
                      save(
                        (s) => ({
                          ...s,
                          steps: s.steps.map((x) =>
                            x.id === step.id ? { ...x, tempC: recipe.fermentation![0].tempC } : x
                          ),
                          notes: [
                            ...(s.notes ?? []),
                            {
                              id: crypto.randomUUID(),
                              at: brewNow(),
                              stepId: step.id,
                              text: `Consigne du jour ajustée de ${target} à ${recipe.fermentation![0].tempC} °C pour correspondre à la fermentation.`
                            }
                          ]
                        }),
                        'Consigne du jour ajustée ; recette originale conservée.'
                      )
                    }
                  >
                    Viser {recipe.fermentation[0].tempC} °C
                  </button>
                </div>
              )}
            {thermal && (
              <div
                className={`brew-assist-result ${thermalAttention ? 'is-attention' : thermal.status === 'reached' ? '' : 'is-info'}`}
              >
                <strong>
                  {thermal.status === 'estimate'
                    ? `Encore ≈ ${thermal.low}–${thermal.high} min vers ${target} °C`
                    : `${target} °C · ${thermal.status === 'reached' ? 'relevé conforme' : thermal.status === 'below' ? 'sous la consigne' : 'à confirmer'}`}
                </strong>
                <p>{thermal.message}</p>
                {thermal.status === 'estimate' && (
                  <small>
                    {thermal.model} · {thermal.points.length} relevé
                    {thermal.points.length > 1 ? 's' : ''}
                  </small>
                )}
              </div>
            )}
            {step.rampStartedAt == null && step.startedAt == null && (
              <button
                type="button"
                className={brewControl}
                onClick={() => {
                  save(
                    (s) => ({
                      ...s,
                      steps: s.steps.map((x) =>
                        x.id === step.id ? { ...x, rampStartedAt: brewNow() } : x
                      )
                    }),
                    cooling
                      ? 'Suivi commencé. Relève la température de départ.'
                      : 'Montée commencée. Le maintien reste à démarrer à la consigne.'
                  );
                  onMeasure('temperature');
                }}
              >
                {cooling ? 'Commencer le suivi' : 'Commencer la montée'}
              </button>
            )}
            <button
              type="button"
              className={brewControl}
              onClick={() => {
                if (cooling && coolant != null && coolant >= 0 && coolant <= 60)
                  update((s) => ({ ...s, coolingWaterC: coolant }));
                onMeasure('temperature');
              }}
            >
              Relever la température
            </button>
            {heating && (
              <>
                <p>
                  Le maintien de {step.durationMin} min commence quand la maische homogène atteint{' '}
                  {target} °C. Une montée lente prolonge l’activité de certaines enzymes et peut
                  changer la fermentescibilité ; on ne retranche pas ces minutes du palier
                  automatiquement.
                </p>
                {step.rampStartedAt != null &&
                  (step.holdStartedAt ?? step.startedAt ?? now) - step.rampStartedAt >=
                    20 * 60000 && (
                    <p className="brew-feedback">
                      Montée de plus de 20 min : vérifie la chauffe et confirme la conversion avant
                      le mash-out. Si la consigne reste inaccessible, consigne la température
                      réellement tenue et demande un conseil sur ce profil.
                    </p>
                  )}
                {exposure > 0 && (
                  <p className="brew-muted">
                    ≈ {exposure} min observées entre 58 et 72 °C pendant la montée. Ce repère ne
                    prédit pas l’atténuation.
                  </p>
                )}
              </>
            )}
            {cooling && step.id !== 'whirlpool' && thermal?.last && (
              <p>{pitchFeedback(recipe, thermal.last.value)}</p>
            )}
            {cooling && (
              <p className="brew-muted">
                Le refroidissement ralentit près de la température de l’eau. Mesure au même endroit,
                mélange doucement et reprends un relevé après 5–10 min. En dessous de la consigne de
                whirlpool, le contact extrait différemment ; attends la consigne de levure avant
                d’ensemencer.
              </p>
            )}
          </section>
        )}
        {boil && (
          <section aria-label="Simulateur d’ébullition">
            <h3>Et si je change le programme ?</h3>
            <BrewTag tone="pause">Simulation</BrewTag>
            <div className="brew-assist-grid">
              <NumberField
                label="Ébullition totale (min)"
                value={minutes}
                set={setMinutes}
                min={1}
                max={480}
              />
              <NumberField
                label={
                  recipe.brewhouse?.equipment
                    ? 'Évaporation à chaud (L/h)'
                    : 'Évaporation mesurée (L/h)'
                }
                value={evap}
                set={setEvap}
                min={0}
                max={100}
              />
            </div>
            {hops.length > 0 && (
              <>
                <BrewChoice
                  label="Houblon à simuler"
                  value={hopId}
                  options={hops.map((h) => ({
                    value: h.id,
                    label: h.name,
                    detail: `${Units.format(h.weightG, 'g')} · recette : ${h.timeMin ?? 0} min avant la fin`
                  }))}
                  onChange={(id) => {
                    setHopId(id);
                    setElapsed(elapsedOf(id));
                  }}
                />
                <NumberField
                  label="Ajout à +… min depuis le début"
                  value={elapsed}
                  set={setElapsed}
                  max={minutes ?? 480}
                />
                {minutes != null && elapsed != null && elapsed <= minutes && (
                  <p className="brew-muted">
                    +{elapsed} min écoulées = {round(minutes - elapsed)} min de contact avant la
                    fin. La notation de la recette exprime les minutes restantes.
                  </p>
                )}
              </>
            )}
            {simulation ? (
              <>
                <div className="brew-assist-result">
                  <strong>
                    {simulation.bitterness
                      ? `≈ ${simulation.bitterness.projected} IBU · recette ${simulation.bitterness.planned}`
                      : 'Volume et OG cibles requis pour estimer les IBU'}
                  </strong>
                  <p>{simulation.message}</p>
                  {simulation.finalL != null &&
                  simulation.finalL > 0 &&
                  simulation.finalOg != null ? (
                    <p>
                      Après évaporation : ≈ {round(simulation.finalL)} L · OG{' '}
                      {simulation.finalOg.toFixed(3)}, avant pertes de transfert. Calcul à partir du
                      volume et de la densité avant ébullition, ramenés à 20 °C.
                      {simulation.extract.names.length > 0 &&
                        ` Apport dissous inclus après ce relevé : ${simulation.extract.names.join(', ')}. Confirme le volume final après dissolution.`}
                    </p>
                  ) : (
                    <p>
                      Pour projeter volume et OG : relève le volume et la densité avant ébullition à
                      20 °C, puis renseigne l’évaporation de ton matériel.
                      {simulation.extract.names.length > 0 &&
                        simulation.extract.pointsLitres == null &&
                        ` Potentiel ou usage à préciser : ${simulation.extract.names.join(', ')}. Leur extrait ne peut pas être ignoré.`}
                    </p>
                  )}
                  {simulation.extraEvapL != null && (
                    <small>
                      Écart d’évaporation : {simulation.extraEvapL >= 0 ? '+' : ''}
                      {round(simulation.extraEvapL)} L par rapport à la durée de la recette.
                    </small>
                  )}
                </div>
                <p className="brew-muted">
                  Les IBU restent une estimation Tinseth.{' '}
                  {simulation.finalL != null && simulation.finalL > 0 && simulation.finalOg != null
                    ? 'Le volume et l’OG projetés sont pris en compte.'
                    : 'Le calcul utilise le volume et l’OG de la recette.'}{' '}
                  Un houblon déjà ajouté conserve son heure réelle, sauf correction explicite du
                  journal.
                </p>
                <button
                  type="button"
                  className={brewControl}
                  disabled={!!state.finishedAt || state.boilFinishedAt != null}
                  onClick={() =>
                    save(
                      (s) => ({
                        ...changeBoilMinutes(
                          s,
                          recipe,
                          simulation.minutes - boilMinutes(s, recipe)
                        ),
                        ...(hopId && elapsed != null && s.additions?.[hopId]?.doneAt == null
                          ? {
                              hopElapsedMin: {
                                ...s.hopElapsedMin,
                                [hopId]: elapsed
                              }
                            }
                          : {}),
                        ...(evap != null && evap >= 0 ? { boilOffLPerHour: evap } : {})
                      }),
                      'Programme et prochaines alertes ajustés. Un houblon déjà versé conserve son heure réelle.'
                    )
                  }
                >
                  {state.additions?.[hopId]?.doneAt != null
                    ? 'Appliquer la durée, garder l’ajout réel'
                    : 'Appliquer au programme'}
                </button>
                {hop &&
                  state.boilStartedAt != null &&
                  elapsed != null &&
                  elapsed >= 0 &&
                  state.boilStartedAt + elapsed * 60000 <= now && (
                    <button
                      type="button"
                      className={brewControl}
                      onClick={() =>
                        save(
                          (s) => ({
                            ...s,
                            additions: {
                              ...s.additions,
                              [hop.id]: {
                                amount: hop.weightG,
                                ...s.additions?.[hop.id],
                                doneAt: s.boilStartedAt! + elapsed * 60000
                              }
                            }
                          }),
                          'Heure réelle du houblon consignée. L’estimation d’amertume est mise à jour.'
                        )
                      }
                    >
                      Consigner l’ajout réel à +{elapsed} min
                    </button>
                  )}
              </>
            ) : (
              <p className="brew-feedback">
                La durée doit être positive et l’ajout compris entre le début et la fin.
              </p>
            )}
          </section>
        )}
        {['preboil', 'ensemencement'].includes(step.id) && (
          <section aria-label="Rattraper volume et densité">
            <h3>Volume ou densité hors cible</h3>
            {rescue ? (
              <div className="brew-assist-result">
                <strong>
                  Volume final théorique : {round(rescue.targetL)} L pour OG{' '}
                  {recipe.ogTarget?.toFixed(3)}
                </strong>
                <p>
                  {rescue.actionDeltaL == null
                    ? ''
                    : rescue.actionDeltaL < -0.05
                      ? `Évaporer environ ${round(-rescue.actionDeltaL)} L${rescue.evaporationL != null ? ' en plus de l’ébullition prévue' : ''}.`
                      : rescue.actionDeltaL > 0.05
                        ? `Appoint théorique de ${round(rescue.actionDeltaL)} L${rescue.evaporationL != null ? ' avant l’ébullition' : ''}.`
                        : 'Le volume suit la cible avec les hypothèses renseignées.'}{' '}
                  {rescue.evaporationL != null &&
                    `Évaporation prévue prise en compte : ${round(rescue.evaporationL)} L. `}
                  {rescue.message}
                </p>
              </div>
            ) : (
              <p>
                Relève volume et densité du même moût, ramenés à 20 °C : le calcul conserve la
                quantité de sucre pour estimer l’appoint ou l’évaporation. Si le sucre total manque,
                réduire le volume cible est une option ; le conseil IA peut examiner les
                fermentescibles disponibles.
              </p>
            )}
            <button type="button" className={brewControl} onClick={() => onMeasure('volume')}>
              Relever volume et densité
            </button>
          </section>
        )}
        {step.id === 'concassage' && (
          <section>
            <h3>Une pesée ou un malt à remplacer</h3>
            <p>
              {grist > 0 ? `${round(grist, 2)} kg de grain · ` : ''}
              {ratio != null ? `${round(ratio, 2)} L/kg avec l’eau renseignée. ` : ''}
              Ajuste les doses dans les ingrédients pour recalculer le ratio. « Remplacer » compare
              les malts disponibles ; couleur proche ne signifie pas goût identique.
            </p>
            <p className="brew-muted">
              Un concassage plus fin peut aider l’extraction mais freiner le rinçage. Vérifie le
              débit avant d’accélérer ou de compacter le lit.
            </p>
          </section>
        )}
        {notice && (
          <p className="brew-feedback" role="status">
            {notice}
          </p>
        )}
      </div>
    </details>
  );
}
