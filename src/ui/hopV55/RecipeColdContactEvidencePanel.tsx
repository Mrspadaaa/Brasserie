import React, { useState } from 'react';
import { HOP_COLD_CONTACT_COMPARISON_LABELS, coldContactUseLabel, describeColdContactComparison,
  type HopColdContactAssessment } from '../../domain/hopDecision/coldIbuContact';
import type { HopV55RecipeColdContactAssociationV1 } from '../../services/hopV55/recipeColdContactAssociation';
import { hopV55RecipeApplicationValueReference } from '../../services/hopV55/recipeDraftApplication';
import { hopV55DoseReading } from './readings';
import './recipe-step.css';

export type HopV55RecipeColdContactEvidencePanelEntryV1 =
  | { status: 'proposed'; association: HopV55RecipeColdContactAssociationV1 }
  | { status: 'current'; association: HopV55RecipeColdContactAssociationV1 }
  /** `mismatches`: exact structured keys of the source comparison, kept out of the visible reason. */
  | { status: 'historical'; association: HopV55RecipeColdContactAssociationV1; reason: string; mismatches?: readonly string[] }
  | { status: 'unsupported'; raw: unknown; reason: string }
  | { status: 'invalid'; raw: unknown; reason: string };

export interface HopV55RecipeColdContactEvidencePanelProps {
  /** Exact service record; this component never assembles or seals an association. */
  entry: HopV55RecipeColdContactEvidencePanelEntryV1;
  /** Host-owned persistence callback. A successful return means only that the host accepted the save. */
  onConserve(association: HopV55RecipeColdContactAssociationV1): void | Promise<void>;
  disabled?: boolean;
}

const numberFr = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? 'inconnu' : value.toLocaleString('fr-CH', { maximumFractionDigits: 4 });

const stageLabel = (status: HopColdContactAssessment['programBinding']['status']) => ({
  bound: 'Contact lié aux lignes sélectionnées',
  incompleteQuantities: 'Quantités incomplètes',
  unsupportedCompositeContact: 'Contact composite non assimilé à une ligne unique',
}[status]);
/** A hot line kept in an older proof is named for what it is; the sealed binding status is not rewritten. */
const bindingLabel = (binding: HopColdContactAssessment['programBinding']) => {
  const hot = [...new Set(binding.selectedAdditions.filter(row => row.use !== 'fermentation' && row.use !== 'postFermentation')
    .map(row => coldContactUseLabel(row.use)))];
  return hot.length ? `Ligne chaude · ${hot.join(', ')} : pas un contact à froid` : stageLabel(binding.status);
};
type ComparisonRow = HopColdContactAssessment['domainComparisons'][number];
const comparisonStatusLabels: Record<ComparisonRow['status'], string> = {
  numericallyComparable: 'Coordonnées comparables', different: 'Écart au protocole publié', unknown: 'Donnée inconnue',
  providedButUnassessed: 'Fourni, non évalué',
};
const bitternessOrigins = { measured: 'mesurée', reported: 'rapportée', modelEstimate: 'estimation du modèle' } as const;
const bitternessTimings = { beforeSelectedContact: 'avant le contact sélectionné', afterSelectedContact: 'après le contact sélectionné', unknown: 'moment inconnu' } as const;
const ownText = (table: Readonly<Record<string, string>>, key: string) =>
  Object.prototype.hasOwnProperty.call(table, key) ? table[key] : null;

// Bounded reading of sealed texts. A snapshot keeps its exact wording; the panel shows current French only for
// these exact texts, or for the pre-A1 forms below when the conserved rows of the same snapshot confirm them.
// Any other text is shown as sealed, and the transfer status always stays the archived one.
const sealedWording: Readonly<Record<string, string>> = {
  'L’emploi déclaré situe le scénario; il ne prouve pas une opération déjà effectuée.':
    'Le moment d’usage déclaré situe le scénario; il ne prouve pas une opération déjà effectuée.',
  'Les statuts planned/performed restent ceux de l’entrée; la courbe ne simule aucune exécution.':
    'Les statuts prévu/effectué restent ceux de l’entrée; la courbe ne simule aucune exécution.',
};
const sealedText = (text: string) => ownText(sealedWording, text) ?? text;
const preA1PropertyForms = [[/^([A-Za-z]+) diffère de la référence publiée\.$/u, 'different'],
  [/^([A-Za-z]+) n’est pas renseigné ou résolu\.$/u, 'unknown']] as const;
const preA1CompositeForm = /^Les lignes diffèrent sur (use|status|dayOffset|contactHours|temperatureC); aucune fusion en un contact unique n’est établie\.$/u;
const compositeFieldLabels = { use: 'le moment d’usage', status: 'le statut prévu ou effectué', dayOffset: 'le jour d’ajout',
  contactHours: 'la durée de contact', temperatureC: 'la température déclarée' } as const;

/** Archived transfer reason as read by the brewer; this never evaluates the contact again. */
function targetReasonText(reason: string, assessment: HopColdContactAssessment): string {
  for (const [form, status] of preA1PropertyForms) {
    const property = form.exec(reason)?.[1];
    const row = property === undefined || ownText(HOP_COLD_CONTACT_COMPARISON_LABELS, property) === null ? undefined
      : assessment.domainComparisons.find(item => item.property === property && item.status === status);
    if (!row) continue;
    const shown = describeColdContactComparison(row);
    if (status === 'unknown') return `${shown.label} : donnée inconnue, non renseignée ou non résolue.`;
    return `${shown.label} : écart au protocole publié${shown.declared !== null && shown.published !== null
      ? ` (déclaré : ${shown.declared}; ${shown.publishedLabel} : ${shown.published})` : ''}.`;
  }
  const field = preA1CompositeForm.exec(reason)?.[1] as keyof typeof compositeFieldLabels | undefined;
  const binding = assessment.programBinding;
  if (field === undefined || !binding.compositeReasons.includes(reason)) return reason;
  const known = new Set(binding.selectedAdditions.map(row => row[field] ?? null).filter(value => value !== null));
  return known.size > 1 ? `Les lignes diffèrent sur ${compositeFieldLabels[field]}; aucune fusion en un contact unique n’est établie.` : reason;
}

// The structured identifier stays in data-property and in the exported JSON, never in the prose.
const comparisonText = (row: ComparisonRow) => {
  const shown = describeColdContactComparison(row);
  const declared = shown.declared !== null ? `déclaré : ${shown.declared}`
    : row.status === 'unknown' ? null : 'valeur déclarée conservée dans le JSON';
  const reason = sealedText(row.reason);
  return { label: shown.label, reason, details: [comparisonStatusLabels[row.status], declared,
    shown.published === null ? null : `${shown.publishedLabel} : ${shown.published}`, reason].filter(Boolean).join(' · ') };
};
const useText = (use: unknown) => {
  const label = coldContactUseLabel(use);
  return label === null ? 'moment d’usage non reconnu' : `moment d’usage déclaré : ${label}`;
};

function evidenceContent(entry: HopV55RecipeColdContactEvidencePanelEntryV1): React.ReactNode {
  if (entry.status === 'unsupported' || entry.status === 'invalid') return <>
    <div className="hv-section-title"><h3>Référence de contact à froid</h3>
      <strong>{entry.status === 'unsupported' ? 'Format futur · lecture seule' : 'Preuve non validée'}</strong></div>
    <p>{entry.reason}</p>
  </>;

  const { association } = entry;
  const evidence = association.evidenceSnapshot;
  const assessment = evidence.assessment;
  const result = assessment.referenceResult;
  const target = assessment.targetAssessment;
  const source = result.source;
  // Only the calibration that published these conditions carries them; another calibration has none.
  const protocol = evidence.protocolSupplement;
  const protocolText = protocol ? (() => {
    const { hopStorage, beerSampling: { dissolvedOxygen, stage } } = protocol;
    const oxygenRelation = dissolvedOxygen.relation === 'lessThan' ? '<' : dissolvedOxygen.relation;
    const samplingMoment = stage === 'beforeSampling' ? 'avant le prélèvement de bière filtrée' : stage;
    return `houblon stocké sous ${hopStorage.atmosphere === 'nitrogen' ? 'azote' : hopStorage.atmosphere} à ${numberFr(hopStorage.temperatureC)}\u00a0°C; durée de stockage ${hopStorage.durationHours === null ? 'non précisée dans la source' : `${numberFr(hopStorage.durationHours)}\u00a0h`}. Le protocole exige O₂ dissous ${oxygenRelation} ${numberFr(dissolvedOxygen.value)}\u00a0${dissolvedOxygen.unit} ${samplingMoment}. La teneur en O₂ de la bière de cette recette n’est pas renseignée.`;
  })() : 'aucun pour cette calibration; les conditions de stockage et d’oxygène publiées avec Lafontaine 2018 ne lui sont pas attribuées.';
  const originLabel = association.origin.kind === 'localCalculation'
    ? 'Calcul local V5.5' : `Tour d’assistance · preuve ${association.origin.evidenceId}`;
  const statusLabel = entry.status === 'proposed' ? 'À conserver explicitement'
    : entry.status === 'current' ? 'Source actuelle vérifiée' : 'Historique · source actuelle non vérifiée';
  const resultLabel = result.valueBU === null ? 'Aucune valeur BU imputée'
    : result.status === 'publishedObservation' ? `Observation de référence · ${numberFr(result.valueBU)}\u00a0${result.calibrationSnapshot.output.unit}`
      : result.status === 'interpolation' ? `Interpolation de référence · ${numberFr(result.valueBU)}\u00a0${result.calibrationSnapshot.output.unit}`
        : 'Dose hors domaine · aucune valeur BU';
  // #75: the dose reads like every V5.5 dose (3 decimals), followed by the sealed exact coordinate of the curve.
  const exact = result.doseExactGPerHL;
  const doseExact = exact
    ? `${exact.numerator.toString()}${exact.denominator.toString() === '1' ? '' : `/${exact.denominator.toString()}`}\u00a0g/hL exacts`
    : 'coordonnée exacte non disponible';
  const materialById = new Map(assessment.programBinding.materials.map(material => [material.id, material]));
  const base = assessment.inputSnapshot.context?.initialBitterness;
  const targetReasons = target.reasons.map(sealed => ({ sealed, shown: targetReasonText(sealed, assessment) }));
  const limitations = [...assessment.limitations, ...protocol?.limitations ?? []].map(sealed => ({ sealed, shown: sealedText(sealed) }));
  const comparisons = assessment.domainComparisons.map(row => ({ row, ...comparisonText(row) }));
  // Texts shown in current French; their exact snapshot wording stays listed with the exact references.
  const reworded = [...new Set([...targetReasons, ...limitations, ...comparisons.map(({ row, reason }) => ({ sealed: row.reason, shown: reason }))]
    .filter(text => text.shown !== text.sealed).map(text => text.sealed))];

  return <>
    <div className="hv-section-title"><h3>Référence de contact à froid</h3><strong>{statusLabel}</strong></div>
    <p>{originLabel} · {bindingLabel(assessment.programBinding)}</p>
    {entry.status === 'historical' ? <p role="status" data-mismatches={entry.mismatches?.join(' ')}>Cette preuve reste liée à son ancien instantané; elle n’est pas présentée comme le contact actuel. {entry.reason}</p> : null}
    {entry.status === 'proposed' ? <p>La conservation de cette preuve n’applique pas le programme, ne change pas les houblons et ne modifie pas les IBU de la recette.</p> : null}

    <dl className="hv-reading">
      <div><dt>Contact sélectionné</dt><dd>{assessment.programBinding.selectedAdditions.map(row => {
        const material = materialById.get(row.materialId);
        const conditions = [useText(row.use), row.status === 'performed' ? 'effectué selon le programme' : 'prévu',
          row.grams === null ? 'masse inconnue' : `${numberFr(row.grams)}\u00a0g`,
          row.contactHours == null ? 'durée inconnue' : `${numberFr(row.contactHours)}\u00a0h`,
          row.temperatureC == null ? 'température inconnue' : `${numberFr(row.temperatureC)}\u00a0°C`].filter(Boolean);
        return `${material?.name ?? row.materialId} · ${conditions.join(' · ')}`;
      }).join(' ; ') || 'Aucune ligne sélectionnée'}</dd></div>
      <div><dt>Masse totale</dt><dd>{assessment.programBinding.totalMassGrams === null
        ? `inconnue · sous-total connu ${numberFr(assessment.programBinding.knownMassSubtotalGrams)}\u00a0g`
        : `${numberFr(assessment.programBinding.totalMassGrams)}\u00a0g`}</dd></div>
      <div><dt>{assessment.inputSnapshot.context?.volumeBasis === 'beerAtContact' ? 'Volume au contact' : 'Volume du programme'}</dt><dd>{assessment.programBinding.volumeL === null ? 'inconnu' : `${numberFr(assessment.programBinding.volumeL)}\u00a0L`}
        {' · '}{assessment.inputSnapshot.context?.volumeBasis === 'beerAtContact' ? 'base déclarée : bière au contact' : 'volume de bière au contact non attesté'}</dd></div>
      <div><dt>Dose dans la référence</dt><dd>{result.doseInput.value === null ? 'inconnue'
        : `${hopV55DoseReading(result.doseInput.value)}\u00a0${result.doseInput.unit} (${doseExact})`}</dd></div>
      <div><dt>BU de référence</dt><dd>{resultLabel}</dd></div>
      <div><dt>BU cible de la bière</dt><dd>{target.valueBU === null ? 'Aucune valeur cible calculée' : `${numberFr(target.valueBU)}\u00a0${target.unit}`}</dd></div>
      {base ? <div><dt>Base d’amertume fournie</dt><dd>{base.value === null ? 'inconnue' : `${numberFr(base.value)}\u00a0${base.unit}`}
        · {bitternessOrigins[base.origin]} · {bitternessTimings[base.timing]}{base.method ? ` · ${base.method}` : ''}</dd></div> : null}
    </dl>

    <p className="hv-muted">La courbe est un repère documentaire pour son protocole; elle ne prédit pas l’IBU de cette bière et son contraste au témoin ne s’ajoute pas aux IBU chauds.</p>
    <details className="hv-details">
      <summary>Protocole, source et limites</summary>
      <p><strong>{source.title}</strong> · {source.author}{source.year == null ? '' : ` · ${source.year}`}</p>
      {source.locator ? <p>Localisation · {source.locator}</p> : null}<p>Référence publiée · {source.reference}</p>
      <p>Méthode publiée · {result.method}</p>
      <p>Motif du regroupement · {assessment.inputSnapshot.contact.grouping.reason}</p>
      <p>Supplément de protocole · {protocolText}</p>
      <p>Transfert à la bière · {target.status === 'transferNotEstablished' ? 'non établi' : target.status === 'conditionsDiffer' ? 'conditions différentes' : 'données insuffisantes'}</p>
      <ul>{targetReasons.map(({ shown }, index) => <li key={`target:${index}`}>{shown}</li>)}</ul>
      <ul>{limitations.map(({ shown }, index) => <li key={`${index}:${shown}`}>{shown}</li>)}</ul>
      {comparisons.length ? <ul aria-label="Comparaisons de conditions">
        {comparisons.map(({ row, label, details }, index) =>
          <li key={`${row.property}:${index}`} data-property={row.property}><strong>{label}</strong>{` · ${details}`}</li>)}
      </ul> : null}
      {reworded.length ? <p className="hv-muted">Présentation actuelle · {reworded.length === 1 ? 'un texte de l’instantané est formulé'
        : `${reworded.length} textes de l’instantané sont formulés`} ici en français à partir des propriétés et valeurs conservées.
        Le statut de transfert, les valeurs et les empreintes restent ceux de l’instantané; ce n’est pas une nouvelle évaluation.
        Leur formulation exacte reste listée avec les références, sans modification.</p> : null}
    </details>

    <details className="hv-details">
      <summary>Origine et références exactes</summary>
      <p>Valeurs canoniques conservées telles quelles, sans traduction.</p>
      <p>Recette · {association.recipeId} · empreinte de la source d’origine {hopV55RecipeApplicationValueReference('sourceRecipe', association.sourceRecipeReference)}</p>
      <p>Le JSON complet conserve le snapshot et la référence brute de la recette d’origine.</p>
      <p>Preuve froide · {association.evidenceReference}</p>
      <p>Programme · {evidence.sourceBinding.programReference} · contact {evidence.sourceBinding.contactReference}</p>
      <p>Qualification · {evidence.sourceBinding.qualificationReference} · contexte {evidence.sourceBinding.contextReference}</p>
      <p>Portée · {evidence.sourceBinding.scopeReference} · profil {evidence.sourceBinding.ownerKey}</p>
      <p>Association · {association.reference} · {association.recordedAt}</p>
      <p>{association.applicationRecordReference === null ? 'Aucune application de recette liée.'
        : `Reçu d’application exact · ${association.applicationRecordReference}`}</p>
      {association.applicationWitness ? <p>Témoin hôte · scénario {association.applicationWitness.scenarioId} · branche {association.applicationWitness.branchId} · programme {association.applicationWitness.programReference}</p> : null}
      {reworded.length ? <>
        <p>Formulation exacte des textes présentés plus haut en français actuel :</p>
        <ul aria-label="Formulation exacte de l’instantané">{reworded.map(text => <li key={text}><code>{text}</code></li>)}</ul>
      </> : null}
    </details>
  </>;
}

/** Presentation-only panel. Persistence, source freshness and application receipts remain host-owned. */
export function HopV55RecipeColdContactEvidencePanel({ entry, onConserve, disabled = false }: HopV55RecipeColdContactEvidencePanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const canConserve = entry.status === 'proposed' && !disabled && !busy;
  const save = async () => {
    if (!canConserve || entry.status !== 'proposed') return;
    setBusy(true); setError(''); setNotice('');
    try {
      await onConserve(entry.association);
      setNotice('La preuve a été transmise à l’hôte pour conservation.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La preuve reste inchangée; la conservation n’a pas abouti.');
    } finally { setBusy(false); }
  };
  return <section className="hv-copy hv-cold-contact-evidence" aria-label="Preuve de contact à froid">
    {evidenceContent(entry)}
    {busy ? <p role="status">Conservation de la référence exacte…</p> : null}
    {error ? <p role="alert" className="hv-error">{error}</p> : null}
    {notice ? <p role="status">{notice}</p> : null}
    {entry.status === 'proposed' ? <div className="hv-actions">
      <button type="button" className="hv-primary" disabled={disabled || busy} onClick={() => void save()}>
        Conserver cette preuve avec la recette
      </button>
    </div> : null}
  </section>;
}
