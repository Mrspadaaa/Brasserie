import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { FermentationStep, YeastSpec } from '../types';
import type { TrialRecipe } from './hopIndex/trials';
import type { YeastReference } from './yeastReferences';
import { planFermentationTimeline, type FermentationTimelineStep } from './fermentationTimeline';
import { resolveFermentationYeast } from './fermentationScenario';
import { resolveYeastDossier } from './yeastProjection';
import { yeastStyleEvidence } from './yeastStyleEvidence';
import { isCompleteYeastRecipeProgramme, proposeYeastGoalSettings, yeastRecipeHopSummary, type YeastRecipeDraft } from './yeastRecipeDesign';
import { YEAST_RECIPE_GOAL_LABELS, YEAST_RECIPE_PROFILES, YEAST_RECIPE_SOURCES } from '../data/yeastRecipeProfiles';

export interface YeastFermentationStrategyPhase {
  kind: FermentationStep['kind']; name: string; tempC?: number; days?: number;
  condition: string; preserved?: boolean;
}
export interface YeastFermentationStrategy {
  outcome: 'proposed' | 'unchanged' | 'insufficient-data';
  reasons: string[];
  patch: Partial<YeastRecipeDraft>;
  title: string;
  effects: { label: string; expected: string; limit?: string }[];
  phases: YeastFermentationStrategyPhase[];
  sources: HopSource[];
  rationale: string;
  /** Planning sum, never a prediction of biological completion. */
  totalDays?: number;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: unknown): n is number => finite(n) && n > 0;
const number = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
const sourcesOf = (sources: (HopSource | undefined)[]) => [...new Map(sources.filter((s): s is HopSource => !!s).map(s => [s.reference, { ...s }])).values()];
const cooling = (s: FermentationTimelineStep) => s.kind === 'garde' && /refroid|cold[ -]?crash/i.test(s.name);
const note = (existing: string | undefined, condition: string) => existing && !existing.includes(condition) ? `${existing}\n${condition}` : existing || condition;
const planPhase = (step: FermentationTimelineStep, condition: string, preserved = false): YeastFermentationStrategyPhase => ({
  kind: step.kind, name: step.name, ...(finite(step.tempC) ? { tempC: step.tempC } : {}), ...(finite(step.days) ? { days: step.days } : {}), condition, ...(preserved ? { preserved: true } : {})
});
const totalDays = (phases: YeastFermentationStrategyPhase[]) => phases.length && phases.every(p => finite(p.days) && p.days >= 0)
  ? phases.reduce((sum, p) => sum + p.days!, 0) : undefined;
const currentPhases = (steps: readonly FermentationTimelineStep[]) => steps.map(p => planPhase(p, p.note || 'Phase existante conservée ; contrôler la densité avant la suite.', true));
const effectiveProgramme = (recipe: TrialRecipe, draft: YeastRecipeDraft): FermentationTimelineStep[] =>
  (draft.programme !== undefined ? draft.programme : recipe.fermentation ?? []).map(step => ({ ...step }));
const hasPlanningDuration = (value: unknown): value is number => finite(value) && value >= 0;
const inRange = (value: unknown, min: number, max: number): value is number => finite(value) && value >= min && value <= max;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const timelineTotal = (steps: readonly FermentationTimelineStep[]) => planFermentationTimeline(steps).endDay ?? undefined;
const programmeSettings = (steps: readonly FermentationTimelineStep[]) => steps.map(step => ({
  kind: step.kind, name: step.name, tempC: step.tempC, days: step.days,
}));

/** Prepare a recipe-specific proposal. Only applyYeastRecipeDesign commits it.
 * Goal labels never change attenuation, ingredients, viable cells or hop timing. */
export function proposeYeastFermentationStrategy(recipe: TrialRecipe, draft: YeastRecipeDraft, refs: YeastReference[], trialYeast?: YeastSpec): YeastFermentationStrategy {
  const existing = effectiveProgramme(recipe, draft);
  const currentTotal = totalDays(currentPhases(existing));
  if (recipe.nolo?.enabled) return { outcome: 'unchanged', reasons: ['La conduite NOLO conserve son parcours dédié.'], patch: {}, title: 'Conduite NOLO', effects: [{ label: 'NOLO', expected: 'Utiliser la conduite et le bilan des sucres du panneau NOLO.', limit: 'Aucun programme de bière alcoolisée n’est substitué.' }],
    phases: currentPhases(existing), totalDays: currentTotal, sources: [], rationale: 'La conduite NOLO reste séparée ; température, durées et analyses ne sont pas remplacées par une stratégie lager ordinaire.' };
  const incomplete = draft.programme !== undefined && !isCompleteYeastRecipeProgramme(draft.programme);
  if (incomplete) {
    const missingPrimary = !existing.some(phase => phase.kind === 'primaire');
    const missingTemperature = existing.some(phase => !finite(phase.tempC) || phase.tempC < 0 || phase.tempC > 60);
    const missingDays = existing.some(phase => !hasPlanningDuration(phase.days));
    const reasons = [missingPrimary ? 'Aucune primaire dans le brouillon ; elle ne sera pas recréée par la proposition.' : undefined,
      missingTemperature ? 'Au moins une température reste inconnue ou invalide.' : undefined,
      missingDays ? 'Au moins une durée reste inconnue ou invalide ; le total du programme reste inconnu.' : undefined].filter((reason): reason is string => !!reason);
    return { outcome: 'insufficient-data', reasons, patch: {}, title: 'Programme à compléter', effects: [{ label: 'Conduite', expected: 'Compléter les champs inconnus du programme local.', limit: 'Application bloquée jusqu’à une primaire complète et des phases valides.' }],
      phases: currentPhases(existing), totalDays: timelineTotal(existing), sources: [], rationale: `Programme local conservé comme saisi. ${reasons.join(' ')}` };
  }
  // An explicit programme is the authoritative source for its primary fields.
  const primaryAtStart = existing.find(phase => phase.kind === 'primaire');
  if (draft.programme !== undefined) draft = { ...draft, temperatureC: primaryAtStart?.tempC, days: primaryAtStart?.days };
  if (draft.goalExplicit === false) return { outcome: 'insufficient-data', reasons: ['Aucun objectif de conduite n’a été exprimé ; un objectif par défaut ne déclenche pas de proposition.'],
    patch: {}, title: 'Objectif à préciser', effects: [{ label: 'Profil recherché', expected: 'Choisir explicitement un objectif avant de proposer une conduite.', limit: 'Le style ou l’objectif par défaut ne suffit pas.' }],
    phases: currentPhases(existing), totalDays: currentTotal, sources: [], rationale: 'Aucun objectif n’est exprimé dans le brouillon ; les réglages actuels restent à leur place.' };
  const reference = refs.find(r => r.id === draft.yeastId);
  const currentId = recipe.yeast.hopIndexId ?? resolveFermentationYeast(recipe, refs)?.id ?? '';
  const dossier = resolveYeastDossier(trialYeast?.hopIndexId === draft.yeastId ? trialYeast : draft.yeastId === currentId ? recipe.yeast : { name: reference?.name ?? '' }, reference);
  const window = dossier.temperature?.qualifier === 'range' ? dossier.temperature : undefined;
  const evidence = reference ? yeastStyleEvidence(reference) : undefined;
  const profile = YEAST_RECIPE_PROFILES.find(p => p.yeastId === draft.yeastId);
  const goalEvidence = evidence?.goalReasons[draft.goal];
  const primaryExisting = existing.find(p => p.kind === 'primaire');
  const lagerFinishGoal = ['clean', 'low-sulfur', 'hops', 'dry'].includes(draft.goal);
  const title = `${draft.styleId === 'lager' && lagerFinishGoal ? 'Lager · ' : ''}${YEAST_RECIPE_GOAL_LABELS[draft.goal]}`;
  const ordinary = draft.process !== 'acidifying-yeast' && draft.process !== 'mixed-culture' && evidence?.culture !== 'bacteria' && evidence?.culture !== 'mixed' &&
    !draft.cultureRoles?.some(c => c.role === 'acidifying' || c.role === 'mixed') && !dossier.facts.some(f => f.key === 'species' && /\blachancea\s+thermotolerans\b/i.test(f.reported));
  const lagerDocumented = evidence?.styles.includes('lager') === true || profile?.styles.includes('lager') === true;
  const lagerRequested = draft.styleId === 'lager' && lagerFinishGoal;
  // The family filter alone cannot assert a lager-capable culture. A documented
  // lager use/property, a compatible goal and an ordinary beer process are all required.
  if (lagerRequested && lagerDocumented && window && ordinary) {
    const range = window.range;
    const localTemp = draft.programme !== undefined ? primaryExisting?.tempC : draft.temperatureC ?? primaryExisting?.tempC;
    const primaryT = finite(localTemp) ? clamp(localTemp, range.min, range.max) : (range.min + range.max) / 2;
    // The source supports +2–4 °C. If +2 cannot fit, do not invent a smaller effective rise.
    const canRaise = primaryT + 2 <= range.max;
    const oldCleanup = existing.find(p => p.kind === 'reposDiacetyle');
    const oldCooling = existing.find(cooling), oldLager = existing.find(p => p.kind === 'garde' && !cooling(p));
    const oldCleanupT = oldCleanup?.tempC;
    const cleanupT = inRange(oldCleanupT, range.min, range.max) && oldCleanupT - primaryT >= 2 && oldCleanupT - primaryT <= 4
      ? oldCleanupT : canRaise ? primaryT + 2 : primaryT;
    const localDays = draft.programme !== undefined ? primaryExisting?.days : draft.days ?? primaryExisting?.days;
    const primaryDays = hasPlanningDuration(localDays) ? localDays : 10;
    const cleanupDays = hasPlanningDuration(oldCleanup?.days) ? oldCleanup.days : draft.goal === 'low-sulfur' ? 5 : 3;
    const coolingDays = hasPlanningDuration(oldCooling?.days) ? oldCooling.days : 2;
    const lagerDays = hasPlanningDuration(oldLager?.days) ? oldLager.days : 21;
    const lagerT = inRange(oldLager?.tempC, 1, 2) ? oldLager!.tempC : 2;
    const primaryCondition = 'Suivre la densité ; préparer le repos vers 65–75 % de l’atténuation complète, levure encore active. Jours indicatifs.';
    const cleanupCondition = 'Repère documentaire : hausse de 2–4 °C en fin de fermentation active, si la fenêtre de la souche le permet. Attendre la densité stabilisée et un test forcé du diacétyle négatif avant le froid.' +
      (draft.goal === 'low-sulfur' ? ' Vérifier aussi le soufre ; conserver suffisamment de contact avec la levure, sans oxygénation tardive.' : '') + ' Durée réservée, à prolonger si les contrôles l’exigent.';
    const coolingCondition = 'Refroidir vers la consigne de garde seulement après densité stabilisée et test forcé du diacétyle négatif ; adapter la descente à l’installation.';
    const lagerCondition = 'Durée et température réservées pour planifier, à ajuster selon la bière. Le repère documentaire de 1–4 semaines à 1–2 °C ne garantit pas la fin de maturation.';
    const generated: { step: FermentationStep; condition: string; match: (p: FermentationTimelineStep) => boolean }[] = [
      { step: { name: primaryExisting?.name || 'Fermentation principale', kind: 'primaire', tempC: primaryT, days: primaryDays, note: note(primaryExisting?.note, primaryCondition) }, condition: 'Vers 65–75 % de l’atténuation complète, levure encore active.', match: p => p.kind === 'primaire' },
      { step: { name: oldCleanup?.name || (draft.goal === 'low-sulfur' ? 'Repos · diacétyle et soufre' : 'Repos de fin de fermentation'), kind: 'reposDiacetyle', tempC: cleanupT, days: cleanupDays, note: note(oldCleanup?.note, cleanupCondition) }, condition: `Densité stabilisée, test forcé du diacétyle négatif${draft.goal === 'low-sulfur' ? ' et soufre contrôlé' : ''} avant le froid.`, match: p => p.kind === 'reposDiacetyle' },
      { step: { name: oldCooling?.name || 'Refroidissement progressif', kind: 'garde', tempC: lagerT, days: coolingDays, note: note(oldCooling?.note, coolingCondition) }, condition: 'Après les contrôles de fin ; descente adaptée à l’installation.', match: cooling },
      { step: { name: oldLager?.name || 'Garde lager', kind: 'garde', tempC: lagerT, days: lagerDays, note: note(oldLager?.note, lagerCondition) }, condition: 'Garde indicative ; vérifier le profil avant conditionnement.', match: p => p.kind === 'garde' && !cooling(p) }
    ];
    // Replace only the first matching stage. Keep extra ramps, additions and
    // refermentation exactly as recorded, including their order and notes.
    const programme = existing.map(phase => ({ ...phase }));
    for (const [index, phase] of generated.entries()) {
      const found = programme.findIndex(phase.match);
      if (found >= 0) programme[found] = phase.step;
      else {
        const later = index === 0 ? 0 : programme.findIndex(p => index === 1 ? p.kind === 'garde' || p.kind === 'refermentation' : index === 2 ? p.kind === 'garde' || p.kind === 'refermentation' : p.kind === 'refermentation');
        programme.splice(later < 0 ? programme.length : later, 0, phase.step);
      }
    }
    const phases = programme.map(p => {
      const own = generated.find(g => g.step === p);
      return planPhase(p, own?.condition ?? p.note ?? 'Phase existante conservée ; recontrôler la densité après un ajout.', !own);
    });
    const effects: YeastFermentationStrategy['effects'] = [
      draft.goal === 'low-sulfur'
        ? { label: 'Soufre', expected: 'Favoriser la réduction du H₂S avant le froid.', limit: 'Contact et conduite à confirmer ; aucun résultat garanti.' }
        : draft.goal === 'hops'
          ? { label: 'Houblons', expected: 'Conserver les ajouts et contrôler la densité après le dernier contact.', limit: 'Aucun gain aromatique déduit du calendrier.' }
          : draft.goal === 'dry'
            ? { label: 'Finale', expected: 'Laisser finir la fermentation avant de refroidir.', limit: 'La fermentescibilité du moût limite la DF ; aucun abaissement automatique.' }
            : { label: 'Profil', expected: goalEvidence ? 'Profil de la souche documenté ; préparer sa finition avant la garde.' : 'Préparer la fin de fermentation avant la garde.', limit: 'La température seule ne garantit pas un profil neutre.' },
      { label: 'Diacétyle', expected: 'Préparer le repos de fin de fermentation.', limit: 'Densité stabilisée et test forcé négatif avant le froid.' },
      { label: 'Garde', expected: 'Préparer la maturation à froid.', limit: 'Durée à ajuster aux contrôles de la bière.' }
    ];
    const changed = JSON.stringify(programme) !== JSON.stringify(existing);
    const settingsChanged = JSON.stringify(programmeSettings(programme)) !== JSON.stringify(programmeSettings(existing));
    return { outcome: settingsChanged ? 'proposed' : 'unchanged', reasons: settingsChanged
        ? ['Proposition fondée sur une capacité ou un usage lager documenté et un objectif explicite.']
        : ['Les phases documentées sont déjà en place ; leurs durées, y compris 0 j, sont conservées.'],
      patch: changed ? { temperatureC: primaryT, days: primaryDays, programme } : {}, title, effects, phases, totalDays: totalDays(phases),
      sources: sourcesOf([...window.sources, YEAST_RECIPE_SOURCES.lagerCleanup, YEAST_RECIPE_SOURCES.lagering, goalEvidence?.source, draft.goal === 'hops' ? YEAST_RECIPE_SOURCES.hopCreep : undefined]),
      rationale: `Consignes dans la plage retenue (${number(range.min)}–${number(range.max)} °C). Durées réservées : ${number(primaryDays)} j de primaire, ${number(cleanupDays)} j de repos, ${number(coolingDays)} j de descente et ${number(lagerDays)} j de garde ; choix de planification, sans date de fin garantie. ${draft.goal === 'low-sulfur' ? 'Le repos prolongé est un choix éditorial pour laisser du temps aux contrôles du soufre. Vérifier inoculum sain, nutriments et absence d’oxygénation tardive. ' : ''}${canRaise ? 'Le repos peut se poursuivre après atténuation complète selon le test, pas selon la date seule.' : 'La fenêtre ne permet pas la hausse documentée de 2–4 °C : son efficacité n’est pas supposée.'}` };
  }

  if (lagerRequested && (!lagerDocumented || !window || !ordinary)) {
    const localTemp = draft.programme !== undefined ? primaryExisting?.tempC : draft.temperatureC ?? primaryExisting?.tempC;
    const lagerProblem = [!lagerDocumented ? 'Aucun usage ou protocole lager n’est documenté pour cette identité.' : undefined,
      !window ? 'Une plage de température ne peut pas être établie à partir des données disponibles.' : undefined,
      !ordinary ? 'Le procédé et les cultures doivent être précisés avant une conduite lager ordinaire.' : undefined]
      .filter((reason): reason is string => !!reason).join(' ');
    if (window && finite(localTemp) && (localTemp < window.range.min || localTemp > window.range.max)) {
      const corrected = clamp(localTemp, window.range.min, window.range.max);
      if (primaryExisting) {
        const programme = existing.map(phase => phase.kind === 'primaire' ? { ...phase, tempC: corrected } : { ...phase });
        const phases = programme.map(phase => planPhase(phase, phase.kind === 'primaire' ? 'Correction minimale pour rentrer dans la plage ; ce n’est pas un optimum aromatique.' : phase.note || 'Phase existante conservée.', phase.kind !== 'primaire'));
        const patch: Partial<YeastRecipeDraft> = draft.programme !== undefined ? { temperatureC: corrected, programme } : { temperatureC: corrected };
        return { outcome: 'proposed', reasons: [`${lagerProblem} Seule la conformité thermique est corrigée par le déplacement minimal de ${number(Math.abs(corrected - localTemp))} °C ; aucun repos ni programme froid n’est ajouté.`],
          patch, title, effects: [{ label: 'Conformité thermique', expected: `Rentrer dans la plage publiée (${number(window.range.min)}–${number(window.range.max)} °C).`, limit: 'Correction de conformité, pas choix aromatique ni protocole lager.' }], phases,
          totalDays: totalDays(phases), sources: sourcesOf(window.sources), rationale: `${lagerProblem} La consigne est déplacée au minimum jusqu’à ${number(corrected)} °C ; les autres phases restent conservées.` };
      }
    }
    return { outcome: 'insufficient-data', reasons: [lagerProblem, 'Les phases existantes sont conservées ; aucun repos ou refroidissement lager n’est inventé.'], patch: {}, title,
      effects: [{ label: 'Conduite lager', expected: 'Confirmer une capacité ou un protocole compatible.', limit: 'Le style demandé seul ne justifie pas un repos chaud/froid.' }],
      phases: currentPhases(existing), totalDays: currentTotal, sources: sourcesOf([goalEvidence?.source, ...evidence?.styleMatches.map(match => match.source) ?? []]),
      rationale: `${lagerProblem} Les phases existantes et leur ordre sont conservés ; aucun programme lager n’est créé.` };
  }

  const proposal = proposeYeastGoalSettings(recipe, draft, refs, trialYeast);
  const patch: Partial<YeastRecipeDraft> = { ...proposal?.patch };
  const proposedT = finite(patch.temperatureC) ? patch.temperatureC : draft.temperatureC ?? primaryExisting?.tempC;
  const validT = window && finite(proposedT) && proposedT >= window.range.min && proposedT <= window.range.max;
  const primaryCondition = draft.goal === 'hops' ? 'Conserver les ajouts prévus ; recontrôler densité et diacétyle après le dernier houblonnage à cru avant le froid.'
    : draft.goal === 'dry' ? 'Attendre la densité stabilisée avant le froid ; comparer à l’atténuation choisie et à la fermentescibilité du moût.'
      : 'Suivre la densité et vérifier la fin de fermentation avant le froid ; la durée sert à planifier.';
  let programme = existing.map(phase => ({ ...phase }));
  if (validT) {
    const localDays = draft.programme !== undefined ? primaryExisting?.days : draft.days ?? primaryExisting?.days;
    const days = hasPlanningDuration(patch.days) ? patch.days : hasPlanningDuration(localDays) ? localDays : undefined;
    if (days !== undefined) {
      const nextPrimary: FermentationStep = { name: primaryExisting?.name || 'Fermentation principale', kind: 'primaire', tempC: proposedT!, days, note: note(primaryExisting?.note, primaryCondition) };
      const index = programme.findIndex(p => p.kind === 'primaire');
      if (index >= 0) programme[index] = nextPrimary; else if (draft.programme === undefined) programme.unshift(nextPrimary);
      const programChanged = JSON.stringify(programme) !== JSON.stringify(existing);
      if (programChanged) { patch.programme = programme; patch.temperatureC = proposedT; patch.days = days; }
    } else if (!primaryExisting && draft.programme === undefined) {
      return { outcome: 'insufficient-data', reasons: ['Une température peut être choisie, mais aucune durée connue ne permet de créer la primaire.'], patch: {}, title,
        effects: [{ label: 'Durée primaire', expected: 'Renseigner une durée indicative avant de préparer la primaire.', limit: 'Aucune durée n’est estimée.' }],
        phases: currentPhases(existing), totalDays: currentTotal, sources: sourcesOf([proposal?.source, ...window?.sources ?? []]),
        rationale: 'La plage thermique permettrait une consigne, mais la durée de la primaire manque. Le programme reste inchangé.' };
    }
  }
  const phases = programme.map(phase => planPhase(phase, phase.kind === 'primaire' && patch.programme ? primaryCondition : phase.note || 'Phase existante conservée.', !(phase.kind === 'primaire' && patch.programme)));
  const effects: YeastFermentationStrategy['effects'] = [];
  if (draft.goal === 'dry') effects.push({ label: 'Finale', expected: 'Vérifier l’atténuation et la fermentescibilité du moût.', limit: 'Aucune hausse de température ne garantit une DF plus basse.' });
  else if (draft.goal === 'hops') {
    const hops = yeastRecipeHopSummary(recipe);
    effects.push({ label: 'Houblons', expected: hops.additions.length ? 'Conserver les ajouts et leur contexte actif ou après fermentation.' : 'Prévoir les ajouts dans l’étape Houblons.', limit: 'Aucun gain de thiols ou de fruité garanti.' });
    if (hops.additions.length) effects.push({ label: 'Fin de fermentation', expected: 'Recontrôler densité et diacétyle après le dernier ajout.', limit: 'Le hop creep peut relancer la fermentation.' });
  } else if (draft.goal === 'clove') effects.push({ label: 'Girofle', expected: patch.ferulicRest ? 'Préparer le repos férulique avec une souche phénolique documentée.' : goalEvidence ? 'Caractère épicé documenté pour cette souche.' : 'Capacité phénolique à documenter avant de cibler le girofle.', limit: 'Aucune intensité de 4-VG prédite.' });
  else if (draft.goal === 'fruit' || draft.goal === 'banana') effects.push({ label: draft.goal === 'banana' ? 'Banane' : 'Fruité', expected: goalEvidence ? profile?.temperatureEsters && validT ? 'Explorer l’expression des esters de cette souche.' : 'Caractère fruité documenté pour cette souche.' : 'Caractère fruité de cette souche à documenter.', limit: 'Aucun gain d’intensité calculé pour ce moût.' });
  else if (draft.goal === 'low-sulfur') effects.push({ label: 'Soufre', expected: 'Documenter la plage avant de proposer un repos plus chaud.', limit: 'Aucune consigne ni baisse de H₂S inventée.' });
  else effects.push({ label: 'Profil', expected: goalEvidence ? 'Profil documenté de cette souche ; surveiller la fin de fermentation.' : 'Conserver la conduite et observer le profil de la souche.', limit: 'Aucun profil neutre ou équilibré garanti.' });
  if (effects.length < 3) effects.push({ label: 'Conduite', expected: validT ? 'Choisir une consigne dans la plage renseignée.' : 'Confirmer la plage et le protocole de cette souche.', limit: !ordinary ? 'Culture spécialisée : pas de programme lager ordinaire déduit.' : 'Durée indicative ; la densité commande la suite.' });
  // A follow-up note can be retained without claiming a new setting. Compare
  // the effective programme and direct settings, rather than the patch's size.
  const programmeChanged = JSON.stringify(programmeSettings(programme)) !== JSON.stringify(programmeSettings(existing));
  const directChanged = Object.entries(patch).some(([key, value]) => key !== 'programme' &&
    JSON.stringify(value) !== JSON.stringify(draft[key as keyof YeastRecipeDraft]));
  const settingsChanged = programmeChanged || directChanged;
  const outcome = proposal?.outcome === 'insufficient-data' && !settingsChanged ? 'insufficient-data' as const
    : settingsChanged ? 'proposed' as const : 'unchanged' as const;
  const reason = proposal?.reasons[0] ?? (!window
    ? 'Aucune plage de fermentation exploitable : point, borne ou donnée absente ne devient pas une plage.'
    : validT ? 'La conduite dans la plage documentée ne reçoit pas d’autre réglage thermique spécifique à cet objectif.'
      : 'Aucun changement justifié pour les réglages renseignés.');
  return { outcome, reasons: proposal?.reasons.length ? proposal.reasons : [reason], patch, title, effects, phases, totalDays: totalDays(phases),
    sources: sourcesOf([proposal?.source, goalEvidence?.source, ...window?.sources ?? [], draft.goal === 'hops' ? YEAST_RECIPE_SOURCES.hopContact : undefined, draft.goal === 'hops' ? YEAST_RECIPE_SOURCES.hopCreep : undefined]),
    rationale: `${proposal?.rationale ?? 'Réglages actuels conservés.'} ${draft.styleId === 'lager' && !window ? 'Plage de fermentation absente, ponctuelle ou contradictoire : aucun programme chaud/froid n’est inventé.' : !ordinary ? 'Le procédé et les cultures doivent être précisés avant une stratégie de finition.' : 'Ajouts, refermentation et autres phases sont conservés. Les objectifs ne changent ni l’atténuation ni les quantités.'}` };
}
