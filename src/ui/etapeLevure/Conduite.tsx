// « Ta conduite » de Ma levure (maquette l5b) : le graphe de conduite de l'app (FermentationTemperatureChart : °C × jours, poignées ↕ et ↔,
// acquis du brasseur, « un peu restylé » permis), avec la plage de la levure en bande derrière les paliers (l4b), un « + » sur chaque
// frontière entre deux paliers pour en couper ou prolonger un, et un × sur le palier touché pour le retirer (le dernier palier n'en a pas).
// Ajout et retrait sont ceux de l'app (`insertFermentationTimelineStep`, `removeFermentationTimelineStep` : `YeastRecipePlan.tsx` 360-372),
// ils ne sont pas réécrits ; seul leur geste change de place, sur le graphe au lieu de la carte du palier.
// Un palier ajouté reste « ? °C · ? j » (rien n'est inféré) : la recette ne s'écrit que quand le programme est complet, comme
// « Appliquer au brouillon » du plan.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Undo2, X } from 'lucide-react';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import type { YeastReference } from '../../domain/yeastReferences';
import {
  applyYeastRecipeDesign, createYeastRecipeDraft, evaluateYeastRecipeDesign, isCompleteYeastRecipeProgramme, yeastRecipeProgramme,
} from '../../domain/yeastRecipeDesign';
import {
  insertFermentationTimelineStep, planFermentationTimeline, removeFermentationTimelineStep, editFermentationTimelineStep,
  type FermentationTimelineStep,
} from '../../domain/fermentationTimeline';
import { FermentationTemperatureChart, joursNominaux, type FermentationChartContact } from '../FermentationTemperatureChart';
import { NumberInput } from '../NumberInput';
import './etapeLevure.css';

const nombre = (n?: number) => (Number.isFinite(n) ? n!.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '?');
/** Les ajouts de houblon à cru posés sur la frise, comme dans le plan de l'app. */
const contacts = (recipe: TrialRecipe): FermentationChartContact[] => recipe.hops.filter(h => h.stage === 'dryHop').map(h => ({
  name: h.name, dayOffset: h.dayOffset, contactHours: h.aromaContactHours, temperatureC: h.aromaTemperatureC,
  phase: h.aromaTiming === 'fermentation' || h.aromaTiming === 'postFermentation' ? h.aromaTiming : undefined,
}));
const PREMIER = { kind: 'primaire' as const, name: 'Fermentation principale' };
const AJOUT = { kind: 'garde' as const, name: 'Garde' };

interface Geo { dx: number; dy: number; left: number; right: number; top: number; fin: number }

export function Conduite({ recipe, refs, onChange, nomLevure }: {
  recipe: TrialRecipe; refs: YeastReference[]; nomLevure?: string;
  /** Écrit la recette (intention « conduct » du wizard) ; peut lever une erreur lisible. */
  onChange: (next: TrialRecipe) => TrialRecipe | void;
}) {
  const draft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  const evaluation = useMemo(() => evaluateYeastRecipeDesign(recipe, draft, refs), [recipe, draft, refs]);
  const base = useMemo(() => yeastRecipeProgramme(recipe, draft), [recipe, draft]);
  const cle = JSON.stringify([recipe.fermentation ?? null, recipe.yeast.hopIndexId ?? recipe.yeast.name]);
  // Le programme en cours de réglage : il suit la recette sauf tant qu'un palier ajouté attend ses valeurs.
  const [local, setLocal] = useState<{ cle: string; steps: FermentationTimelineStep[] }>();
  const programme = local && local.cle === cle ? local.steps : base;
  const [choisi, setChoisi] = useState(Math.max(0, base.findIndex(p => p.kind === 'primaire')));
  const [ouvert, setOuvert] = useState(true);
  const [dit, setDit] = useState('');
  const [erreur, setErreur] = useState('');
  const [annulation, setAnnulation] = useState<{ cle: string; steps: FermentationTimelineStep[] }>();
  const indice = programme.length ? Math.min(Math.max(0, choisi), programme.length - 1) : -1;
  const temperature = evaluation.projection.dossier.temperature;
  const plage = temperature?.qualifier === 'range' ? temperature.range : undefined;
  const complet = isCompleteYeastRecipeProgramme(programme);
  const frise = planFermentationTimeline(programme);
  const dessin = planFermentationTimeline(joursNominaux(programme));   // où le graphe dessine chaque palier (un inconnu a une largeur nominale)

  const ecrire = (suivant: FermentationTimelineStep[]) => {
    setLocal({ cle, steps: suivant });
    if (!isCompleteYeastRecipeProgramme(suivant)) return;
    try {
      const primaire = suivant.find(p => p.kind === 'primaire');
      const appliquee = recipe.yeast.name?.trim()
        ? applyYeastRecipeDesign(recipe, { ...draft, programme: suivant.map(p => ({ ...p })), temperatureC: primaire?.tempC, days: primaire?.days }, refs, 'settings')
        // Sans levure, les paliers restent un champ de la recette, sans conception de levure à appliquer.
        : { ...recipe, fermentation: suivant.map(p => ({ ...p })) };
      onChange(appliquee);
      setErreur('');
    } catch (e) { setErreur(e instanceof Error ? e.message : 'Ce programme ne peut pas être appliqué.'); }
  };
  const valider = (suivant: FermentationTimelineStep[], texte: string) => {
    setAnnulation({ cle, steps: programme.map(p => ({ ...p })) });
    setDit(texte); ecrire(suivant);
  };
  /** « + » : le palier de l'app (`insertFermentationTimelineStep`) à cette frontière. */
  const inserer = (apres: number) => {
    const type = programme.length === 0 ? PREMIER : AJOUT;
    valider(insertFermentationTimelineStep(programme, apres, type),
      `Palier ${apres + 2} · ${type.name} ajouté${apres < 0 ? ' à J0' : ''} : température et durée à renseigner`);
    setChoisi(apres + 1); setOuvert(true);
  };
  /** × : le retrait de l'app (`removeFermentationTimelineStep`), les autres durées sont conservées. */
  const retirer = (index: number) => {
    if (programme.length < 2 || !programme[index]) return;
    const suivant = removeFermentationTimelineStep(programme, index);
    valider(suivant, `Palier ${index + 1} · ${programme[index].name} retiré ; les autres durées sont conservées`);
    setChoisi(Math.max(0, Math.min(index, suivant.length - 1)));
  };
  const regler = (index: number, valeurs: Partial<FermentationTimelineStep>) => ecrire(editFermentationTimelineStep(programme, index, valeurs));
  const annuler = () => { if (!annulation) return; ecrire(annulation.steps); setAnnulation(undefined); setDit('Dernier réglage annulé'); };

  // Les « + » et le × se posent sur les frontières dessinées par le graphe : sa géométrie est lue sur son SVG (data-plot-*).
  const enveloppe = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo>();
  const [, relire] = useState(0);
  useLayoutEffect(() => {
    const boite = enveloppe.current, svg = boite?.querySelector<SVGSVGElement>('svg[data-plot-left]');
    if (!boite || !svg) { if (geo) setGeo(undefined); return; }
    const a = svg.getBoundingClientRect(), b = boite.getBoundingClientRect(), d = svg.dataset;
    const g: Geo = { dx: a.left - b.left, dy: a.top - b.top, left: Number(d.plotLeft), right: Number(d.plotRight), top: Number(d.plotTop), fin: Number(d.scaleEndDay) };
    if (!(g.fin > 0)) { if (geo) setGeo(undefined); return; }
    if (!geo || Object.keys(g).some(k => Math.abs((g as never)[k] - (geo as never)[k]) > 0.5)) setGeo(g);
  });
  useEffect(() => {
    const boite = enveloppe.current;
    if (!boite || typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(() => relire(n => n + 1));
    o.observe(boite); return () => o.disconnect();
  }, []);
  const xDe = (jour: number) => geo ? geo.dx + geo.left + jour / geo.fin * (geo.right - geo.left) : 0;
  const frontieres = [{ jour: 0, apres: -1 }, ...dessin.phases.map((p, i) => ({ jour: p.end, apres: i }))]
    .filter((f): f is { jour: number; apres: number } => f.jour !== null && Number.isFinite(f.jour));
  const palier = indice >= 0 ? frise.phases[indice] : undefined;
  const palierDessine = indice >= 0 ? dessin.phases[indice] : undefined;
  const inconnu = palier && (!Number.isFinite(palier.tempC) || !Number.isFinite(palier.days));
  const fin = frise.endDay;

  return <section className="lv-cond" aria-label="Ta conduite" data-lv="conduite">
    <button type="button" className="lv-cond-tete" aria-expanded={ouvert} onClick={() => setOuvert(o => !o)}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>
      <b>Conduite · température × jours</b><ChevronDown size={16} aria-hidden="true" className="lv-chev" data-ouvert={ouvert} />
    </button>
    <p className="lv-cond-sous"><span className="lv-m">{programme.length}</span> palier{programme.length > 1 ? 's' : ''}
      <span className="lv-pt" />fin {fin === null ? <span className="lv-m">?</span> : <>J<span className="lv-m">{nombre(fin)}</span></>}
      {plage && <span className="lv-cond-leg"><i aria-hidden="true" />{nomLevure ? `${nomLevure} · ` : ''}{nombre(plage.min)}–{nombre(plage.max)} °C</span>}</p>
    {ouvert && <>
      {palier && inconnu && <div className="lv-cond-champs" role="group" aria-label={`Valeurs du palier ${indice + 1}`}>
        <span className="lv-cond-champs-nom">Palier {indice + 1} · {palier.name}</span>
        <label>Température <NumberInput aria-label={`Température du palier ${indice + 1}`} value={palier.tempC} min={0} max={60} emptyValue={undefined}
          onValue={tempC => regler(indice, { tempC })} placeholder="?" className="lv-cond-nb" /> °C</label>
        <label>Durée <NumberInput aria-label={`Durée du palier ${indice + 1}`} value={palier.days} min={0} emptyValue={undefined}
          onValue={days => regler(indice, { days })} placeholder="?" className="lv-cond-nb" /> j</label>
        {programme.length > 1 && <button type="button" className="lv-btn lv-btn-doux" onClick={() => retirer(indice)} aria-label={`Retirer le palier ${indice + 1} · ${palier.name}`}><X size={13} aria-hidden="true" /> Retirer</button>}
      </div>}
      {programme.length === 0
        ? <div className="lv-cond-vide"><p>Aucun palier : la conduite attend son premier palier.</p>
          <button type="button" className="lv-btn lv-btn-doux" onClick={() => inserer(-1)}><Plus size={14} aria-hidden="true" /> Ajouter la fermentation principale à J0</button></div>
        : <div className="lv-cond-graphe" ref={enveloppe}>
          <FermentationTemperatureChart steps={programme} pitchTempC={draft.pitchTempC} contacts={contacts(recipe)}
            bands={programme.map(p => plage && (p.kind === 'primaire' || (Number.isFinite(p.tempC) && p.tempC! >= plage.min - 2 && p.tempC! <= plage.max + 2)) ? plage : undefined)} bandLabel={`plage retenue de ${nomLevure ?? 'la levure'} pour la primaire, non une consigne`}
            onSelectStep={i => setChoisi(i)} selectedStepIndex={indice >= 0 ? indice : undefined}
            onStepsChange={(next, edit) => valider(next, edit.label)} inconnuDessine />
          {geo && <div className="lv-cond-surcouche" data-lv="frontieres">
            {frontieres.map(f => <button key={f.apres} type="button" className="lv-plus"
              style={{ left: Math.max(xDe(f.jour), geo.dx + geo.left + 14), top: geo.dy + geo.top - 14 }}
              aria-label={f.apres < 0 ? 'Ajouter un palier à J0' : `Ajouter un palier après le palier ${f.apres + 1}, à J${nombre(f.jour)}`}
              data-frontiere={f.apres} onClick={() => inserer(f.apres)}><Plus size={13} aria-hidden="true" /></button>)}
            {programme.length > 1 && palierDessine && palierDessine.start !== null && palierDessine.end !== null && palierDessine.end > palierDessine.start &&
              <button type="button" className="lv-moins" data-retire={indice}
                style={{ left: Math.max(xDe(palierDessine.end) - 15, xDe(palierDessine.start) + 15), top: geo.dy + geo.top + 15 }}
                aria-label={`Retirer le palier ${indice + 1} · ${palier.name}`} onClick={() => retirer(indice)}><X size={14} aria-hidden="true" /></button>}
          </div>}
        </div>}
      {(dit || annulation) && <p className="lv-cond-dit" role="status"><span className="sr-only">{dit}</span>
        {annulation && <> <button type="button" className="lv-lien" onClick={annuler}><Undo2 size={13} aria-hidden="true" /> Annuler</button></>}</p>}
      {erreur && <p className="lv-erreur" role="alert">{erreur}</p>}
    </>}
  </section>;
}
