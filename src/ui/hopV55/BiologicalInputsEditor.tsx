import React, { useId, useState } from 'react';
import type { HopSource, HopSourceKind } from '../../../functions/src/hopIndexSchema';
import type {
  BrewingScenarioAssumption,
  BrewingScenarioBiologicalAmount,
  BrewingScenarioBiologicalInput,
  BrewingScenarioBranchRequest,
  BrewingScenarioFactor,
} from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { formatDecimal, parseDecimal } from '../NumericField';
import { Input, Textarea } from '../Input';
import {
  appendBrewingScenarioBiologicalInput,
  type ScenarioBiologicalConversionRatioDraft,
  type ScenarioBiologicalFactorDraft,
  type ScenarioBiologicalInputDraft,
  type ScenarioBiologicalSourceDraft,
} from '../../services/hopV55/scenarioBiologicalInputs';
import './biological-inputs-editor.css';

type InputKind = ScenarioBiologicalInputDraft['kind'] | '';
type SourceMode = '' | 'personal' | 'bibliography';
type BibliographicKind = Exclude<HopSourceKind, 'judgment' | 'observation'> | '';

interface SourceFormState {
  mode: SourceMode;
  title: string;
  author: string;
  sourceKind: BibliographicKind;
  year: string;
  reference: string;
  locator: string;
}

interface AmountFormState {
  analyte: string;
  unit: string;
  basis: string;
  min: string;
  max: string;
  value: string;
  central: string;
  matrixId: string;
  timepoint: string;
  explanation: string;
  source: SourceFormState;
}

interface FactorFormState {
  min: string;
  max: string;
  central: string;
  unit: string;
  explanation: string;
  source: SourceFormState;
}

interface ProductFormState {
  analyte: string;
  unit: string;
  basis: string;
  matrixId: string;
  timepoint: string;
}

interface EditorFormState {
  amount: AmountFormState;
  precursor: AmountFormState;
  product: ProductFormState;
  conversionFraction: FactorFormState;
  conversionRatio: FactorFormState;
  ratioEnabled: boolean;
  sourceAmount: AmountFormState;
  extractionFraction: FactorFormState;
  retentionFraction: FactorFormState;
  targetMatrixId: string;
  targetTimepoint: string;
  conditions: string;
  limitations: string;
}

export interface BiologicalInputsEditorProps {
  prepared: PreparedBrewingScenarioContext;
  branch?: BrewingScenarioBranchRequest;
  onRevise(branch: BrewingScenarioBranchRequest): void;
}

const sourceKinds: Array<{ value: Exclude<BibliographicKind, ''>; label: string }> = [
  { value: 'coa', label: 'Certificat d’analyse' },
  { value: 'manufacturer', label: 'Fabricant' },
  { value: 'research', label: 'Recherche' },
  { value: 'review', label: 'Revue technique' },
  { value: 'community', label: 'Communauté' },
];

const inputKinds: Array<{ value: Exclude<InputKind, ''>; label: string }> = [
  { value: 'yeastOwnProducts', label: 'Produit propre de la levure' },
  { value: 'hopPrecursorTransformation', label: 'Transformation d’un précurseur de houblon' },
  { value: 'compoundTransferLoss', label: 'Extraction et rétention d’un composé' },
];

const blankSource = (): SourceFormState => ({
  mode: '', title: '', author: '', sourceKind: '', year: '', reference: '', locator: '',
});

const blankAmount = (): AmountFormState => ({
  analyte: '', unit: '', basis: '', min: '', max: '', value: '', central: '',
  matrixId: '', timepoint: '', explanation: '', source: blankSource(),
});

const blankFactor = (): FactorFormState => ({ min: '', max: '', central: '', unit: '', explanation: '', source: blankSource() });

const blankForm = (): EditorFormState => ({
  amount: blankAmount(),
  precursor: blankAmount(),
  product: { analyte: '', unit: '', basis: '', matrixId: '', timepoint: '' },
  conversionFraction: blankFactor(),
  conversionRatio: blankFactor(),
  ratioEnabled: false,
  sourceAmount: blankAmount(),
  extractionFraction: blankFactor(),
  retentionFraction: blankFactor(),
  targetMatrixId: '',
  targetTimepoint: '',
  conditions: '',
  limitations: '',
});

const hasText = (value: string) => !!value.trim();

function parseNumber(value: string, label: string, optional = false): number | undefined {
  if (!value.trim()) {
    if (optional) return undefined;
    throw new Error(`${label} : saisis une valeur numérique explicite.`);
  }
  const parsed = parseDecimal(value);
  if (parsed === null) throw new Error(`${label} : la saisie n’est pas un nombre lisible.`);
  return parsed;
}

function sourceDraft(form: SourceFormState): ScenarioBiologicalSourceDraft {
  if (!form.mode) throw new Error('Choisis explicitement une déclaration personnelle ou une source bibliographique.');
  if (!hasText(form.title)) throw new Error('Le titre ou libellé de provenance est requis.');
  if (!hasText(form.author)) throw new Error('L’auteur de la provenance est requis.');
  const common = {
    title: form.title,
    author: form.author,
    ...(form.locator ? { locator: form.locator } : {}),
  };
  if (form.mode === 'personal') return { kind: 'personalDeclaration', ...common };
  if (!form.sourceKind) throw new Error('Choisis la nature de la source bibliographique.');
  if (!hasText(form.reference)) throw new Error('La référence bibliographique est requise.');
  const year = form.year.trim() ? parseNumber(form.year, 'Année de la source') : null;
  if (year !== null && !Number.isInteger(year)) throw new Error('L’année de la source doit être un entier ou rester inconnue.');
  return { kind: 'bibliography', sourceKind: form.sourceKind, ...common, year: year ?? null, reference: form.reference };
}

function amountDraft(form: AmountFormState, label: string) {
  if (!hasText(form.analyte)) throw new Error(`${label} : l’analyte est requis.`);
  if (!hasText(form.unit)) throw new Error(`${label} : l’unité est requise.`);
  if (!hasText(form.basis)) throw new Error(`${label} : la base est requise.`);
  if (!hasText(form.explanation)) throw new Error(`${label} : l’explication de l’hypothèse est requise.`);
  const min = parseNumber(form.min, `${label} · minimum`)!;
  const max = parseNumber(form.max, `${label} · maximum`)!;
  return {
    analyte: form.analyte,
    unit: form.unit,
    basis: form.basis,
    range: { min, max },
    ...(form.value.trim() ? { value: parseNumber(form.value, `${label} · valeur déclarée`) } : {}),
    ...(form.central.trim() ? { central: parseNumber(form.central, `${label} · point central`) } : {}),
    ...(form.matrixId.trim() ? { matrixId: form.matrixId } : {}),
    ...(form.timepoint.trim() ? { timepoint: form.timepoint } : {}),
    explanation: form.explanation,
    source: sourceDraft(form.source),
  };
}

function fractionDraft(form: FactorFormState, label: string): ScenarioBiologicalFactorDraft {
  if (!hasText(form.explanation)) throw new Error(`${label} : l’explication du facteur est requise.`);
  return {
    range: { min: parseNumber(form.min, `${label} · minimum`)! , max: parseNumber(form.max, `${label} · maximum`)! },
    ...(form.central.trim() ? { central: parseNumber(form.central, `${label} · point central`) } : {}),
    unit: 'fraction',
    explanation: form.explanation,
    source: sourceDraft(form.source),
  };
}

function ratioDraft(form: FactorFormState, precursor: AmountFormState, product: ProductFormState): ScenarioBiologicalConversionRatioDraft {
  if (!hasText(form.unit)) throw new Error('Le rapport de conversion requiert son unité propre.');
  const amount = amountDraft(precursor, 'Précurseur');
  if (!hasText(product.analyte) || !hasText(product.unit)) throw new Error('Le produit transformé requiert son analyte et son unité.');
  if (!hasText(form.explanation)) throw new Error('Rapport de conversion : l’explication du facteur est requise.');
  return {
    range: {
      min: parseNumber(form.min, 'Rapport de conversion · minimum')!,
      max: parseNumber(form.max, 'Rapport de conversion · maximum')!,
    },
    ...(form.central.trim() ? { central: parseNumber(form.central, 'Rapport de conversion · point central') } : {}),
    unit: form.unit,
    explanation: form.explanation,
    source: sourceDraft(form.source),
    fromAnalyte: amount.analyte,
    fromUnit: amount.unit,
    toAnalyte: product.analyte,
    toUnit: product.unit,
  };
}

function lines(value: string): string[] {
  return value.split(/\r?\n/).map(row => row.trim()).filter(Boolean);
}

function buildInputDraft(kind: Exclude<InputKind, ''>, form: EditorFormState): ScenarioBiologicalInputDraft {
  const conditions = lines(form.conditions);
  const limitations = lines(form.limitations);
  if (!conditions.length) throw new Error('Ajoute au moins une condition pour cette contribution.');
  if (!limitations.length) throw new Error('Ajoute au moins une limite pour cette contribution.');

  if (kind === 'yeastOwnProducts') return {
    kind,
    amount: amountDraft(form.amount, 'Produit propre de la levure'),
    conditions,
    limitations,
  };
  if (kind === 'hopPrecursorTransformation') {
    if (!hasText(form.product.analyte)) throw new Error('Produit transformé : l’analyte est requis.');
    if (!hasText(form.product.unit)) throw new Error('Produit transformé : l’unité est requise.');
    if (!hasText(form.product.basis)) throw new Error('Produit transformé : la base est requise.');
    return {
      kind,
      precursor: amountDraft(form.precursor, 'Précurseur'),
      product: {
        analyte: form.product.analyte,
        unit: form.product.unit,
        basis: form.product.basis,
        ...(form.product.matrixId.trim() ? { matrixId: form.product.matrixId } : {}),
        ...(form.product.timepoint.trim() ? { timepoint: form.product.timepoint } : {}),
      },
      conversionFraction: fractionDraft(form.conversionFraction, 'Fraction de conversion'),
      ...(form.ratioEnabled ? { conversionRatio: ratioDraft(form.conversionRatio, form.precursor, form.product) } : {}),
      conditions,
      limitations,
    };
  }
  if (!hasText(form.targetMatrixId)) throw new Error('Matrice cible : indique où se trouve le composé transféré.');
  if (!hasText(form.targetTimepoint)) throw new Error('Point temporel cible : précise quand la quantité est évaluée.');
  return {
    kind,
    sourceAmount: amountDraft(form.sourceAmount, 'Quantité à transférer'),
    extractionFraction: fractionDraft(form.extractionFraction, 'Fraction d’extraction'),
    retentionFraction: fractionDraft(form.retentionFraction, 'Fraction de rétention'),
    targetMatrixId: form.targetMatrixId,
    targetTimepoint: form.targetTimepoint,
    conditions,
    limitations,
  };
}

function TextField({
  label, value, onChange, required = false, hint, placeholder, inputMode,
}: {
  label: string; value: string; onChange(value: string): void; required?: boolean;
  hint?: string; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const id = useId();
  return <label className="hv-bio-field" htmlFor={id}>
    <span>{label}{required ? <small> · requis</small> : null}</span>
    <Input id={id} value={value} onChange={event => onChange(event.currentTarget.value)} placeholder={placeholder}
      inputMode={inputMode} className="hv-bio-control" aria-required={required || undefined} />
    {hint ? <small className="hv-bio-hint">{hint}</small> : null}
  </label>;
}

function DecimalField({
  label, value, onChange, required = false, hint,
}: {
  label: string; value: string; onChange(value: string): void; required?: boolean; hint?: string;
}) {
  const id = useId();
  return <label className="hv-bio-field" htmlFor={id}>
    <span>{label}{required ? <small> · requis</small> : null}</span>
    <Input id={id} value={value} onChange={event => onChange(event.currentTarget.value)}
      inputMode="decimal" className="hv-bio-control" aria-label={label} />
    {hint ? <small className="hv-bio-hint">{hint}</small> : null}
  </label>;
}

function TextAreaField({
  label, value, onChange, required = false, hint,
}: {
  label: string; value: string; onChange(value: string): void; required?: boolean; hint?: string;
}) {
  const id = useId();
  return <label className="hv-bio-field hv-bio-field--wide" htmlFor={id}>
    <span>{label}{required ? <small> · requis</small> : null}</span>
    <Textarea id={id} value={value} onChange={event => onChange(event.currentTarget.value)}
      className="hv-bio-control hv-bio-control--multiline" rows={2} aria-required={required || undefined} />
    {hint ? <small className="hv-bio-hint">{hint}</small> : null}
  </label>;
}

function SourceFields({
  node, value, onChange,
}: {
  node: string; value: SourceFormState; onChange(value: SourceFormState): void;
}) {
  const groupId = useId();
  const update = (patch: Partial<SourceFormState>) => onChange({ ...value, ...patch });
  return <fieldset className="hv-bio-source hv-bio-field--wide">
    <legend>Provenance · {node}</legend>
    <div className="hv-bio-source__modes" role="group" aria-label={`Nature de la provenance · ${node}`} aria-required="true">
      <label><input type="radio" name={groupId} checked={value.mode === 'personal'} onChange={() => update({ mode: 'personal' })} /> Déclaration personnelle · {node}</label>
      <label><input type="radio" name={groupId} checked={value.mode === 'bibliography'} onChange={() => update({ mode: 'bibliography' })} /> Source bibliographique · {node}</label>
    </div>
    {value.mode ? <div className="hv-biological-inputs__grid">
      <TextField label={`${value.mode === 'personal' ? 'Libellé de la déclaration' : 'Titre de la source'} · ${node}`} value={value.title}
        onChange={title => update({ title })} required />
      <TextField label={`${value.mode === 'personal' ? 'Auteur de la déclaration' : 'Auteur'} · ${node}`} value={value.author}
        onChange={author => update({ author })} required />
      {value.mode === 'bibliography' ? <>
        <label className="hv-bio-field">
          <span>Nature de la source · {node} · requise</span>
          <select aria-label={`Nature de la source · ${node}`} value={value.sourceKind}
            onChange={event => update({ sourceKind: event.currentTarget.value as BibliographicKind })} aria-required="true">
            <option value="">Choisir une nature…</option>
            {sourceKinds.map(row => <option value={row.value} key={row.value}>{row.label}</option>)}
          </select>
        </label>
        <TextField label={`Référence exacte · ${node}`} value={value.reference} onChange={reference => update({ reference })}
          required hint="URL, DOI, référence ou identifiant tel que fourni." />
        <DecimalField label={`Année de publication · ${node}`} value={value.year} onChange={year => update({ year })}
          hint="Facultative si l’année n’est pas connue; elle reste alors vide." />
      </> : <p className="hv-bio-local-source hv-bio-field--wide">Source enregistrée comme jugement et hypothèse personnelle. Une référence locale à cette déclaration sera créée; aucune observation de brassin n’est ajoutée.</p>}
      <TextField label={`Emplacement dans la source · ${node}`} value={value.locator} onChange={locator => update({ locator })}
        hint="Facultatif : page, tableau ou passage." />
    </div> : <p className="hv-bio-hint">Choisis une provenance avant de saisir ses détails. Rien n’est prérempli comme mesure.</p>}
  </fieldset>;
}

function AmountFields({
  label, node, value, onChange,
}: {
  label: string; node: string; value: AmountFormState; onChange(value: AmountFormState): void;
}) {
  const update = (patch: Partial<AmountFormState>) => onChange({ ...value, ...patch });
  return <fieldset className="hv-bio-node">
    <legend>{label} · quantité déclarée</legend>
    <div className="hv-biological-inputs__grid">
      <TextField label={`Analyte · ${label}`} value={value.analyte} onChange={analyte => update({ analyte })} required />
      <TextField label={`Unité · ${label}`} value={value.unit} onChange={unit => update({ unit })} required />
      <TextField label={`Base · ${label}`} value={value.basis} onChange={basis => update({ basis })} required
        hint="Base chimique exacte; elle reste distincte de la matrice." />
      <div className="hv-bio-range hv-bio-field--wide">
        <div className="hv-bio-range__fields">
          <DecimalField label={`Minimum · ${label}`} value={value.min} onChange={min => update({ min })} required />
          <DecimalField label={`Maximum · ${label}`} value={value.max} onChange={max => update({ max })} required />
        </div>
        <small className="hv-bio-hint">Plage en {value.unit || 'unité à préciser'} · base {value.basis || 'à préciser'}.</small>
      </div>
      <DecimalField label={`Valeur explicitement rapportée · ${label}`} value={value.value} onChange={reported => update({ value: reported })}
        hint="Facultative; vide signifie aucune valeur ponctuelle déclarée." />
      <DecimalField label={`Point central explicitement choisi · ${label}`} value={value.central} onChange={central => update({ central })}
        hint="Facultatif; aucun milieu n’est calculé automatiquement." />
      <TextField label="Matrice" value={value.matrixId} onChange={matrixId => update({ matrixId })}
        hint="Facultative; ne pas la déduire de la base." />
      <TextField label="Point temporel" value={value.timepoint} onChange={timepoint => update({ timepoint })}
        hint="Facultatif; ne pas le déduire du stade courant." />
      <TextAreaField label="Pourquoi cette quantité ?" value={value.explanation} onChange={explanation => update({ explanation })}
        required hint="Le motif est lié à cette quantité uniquement." />
      <SourceFields node={node} value={value.source} onChange={source => update({ source })} />
    </div>
  </fieldset>;
}

function FractionFields({
  label, node, value, onChange, scope,
}: {
  label: string; node: string; value: FactorFormState; onChange(value: FactorFormState): void;
  scope?: string;
}) {
  const update = (patch: Partial<FactorFormState>) => onChange({ ...value, ...patch });
  return <fieldset className="hv-bio-node">
    <legend>{label} · facteur fractionnaire</legend>
    <p className="hv-bio-inline-unit">Unité : <strong>fraction</strong> · bornes permises : 0 à 1.</p>
    {scope ? <p className="hv-bio-inline-unit">Portée exacte : <strong>{scope}</strong></p> : null}
    <div className="hv-biological-inputs__grid">
      <DecimalField label={`Minimum · ${label}`} value={value.min} onChange={min => update({ min })} required />
      <DecimalField label={`Maximum · ${label}`} value={value.max} onChange={max => update({ max })} required />
      <DecimalField label={`Point central explicitement choisi · ${label}`} value={value.central} onChange={central => update({ central })}
        hint="Facultatif; aucun point central n’est inventé." />
      <TextAreaField label="Pourquoi cette fraction ?" value={value.explanation} onChange={explanation => update({ explanation })}
        required hint="La justification est liée à ce facteur." />
      <SourceFields node={node} value={value.source} onChange={source => update({ source })} />
    </div>
  </fieldset>;
}

function RatioFields({
  node, value, onChange, precursor, product,
}: {
  node: string; value: FactorFormState; onChange(value: FactorFormState): void;
  precursor: AmountFormState; product: ProductFormState;
}) {
  const update = (patch: Partial<FactorFormState>) => onChange({ ...value, ...patch });
  const fromLabel = precursor.analyte && precursor.unit ? `${precursor.analyte} (${precursor.unit})` : 'précurseur à préciser';
  const toLabel = product.analyte && product.unit ? `${product.analyte} (${product.unit})` : 'produit à préciser';
  return <fieldset className="hv-bio-node">
    <legend>Rapport de conversion · analyte et unité</legend>
    <p className="hv-bio-inline-unit">Sens exact : <strong>{fromLabel}</strong> → <strong>{toLabel}</strong>. La formule d’unité reste à déclarer.</p>
    <div className="hv-biological-inputs__grid">
      <TextField label="Unité du rapport" value={value.unit} onChange={unit => update({ unit })} required
        hint="Ex. mg/L par mg/kg, selon la provenance réellement fournie." />
      <div className="hv-bio-range">
        <div className="hv-bio-range__fields">
          <DecimalField label="Minimum · rapport de conversion" value={value.min} onChange={min => update({ min })} required />
          <DecimalField label="Maximum · rapport de conversion" value={value.max} onChange={max => update({ max })} required />
        </div>
      </div>
      <DecimalField label="Point central explicitement choisi · rapport de conversion" value={value.central} onChange={central => update({ central })}
        hint="Facultatif; aucun ratio de 1 n’est supposé." />
      <TextAreaField label="Pourquoi ce rapport ?" value={value.explanation} onChange={explanation => update({ explanation })}
        required hint="La source doit couvrir ce sens analyte/unité." />
      <SourceFields node={node} value={value.source} onChange={source => update({ source })} />
    </div>
  </fieldset>;
}

type BiologicalSummaryNode = { label: string; amount?: BrewingScenarioBiologicalAmount; factor?: BrewingScenarioFactor };

function linesForInput(input: BrewingScenarioBiologicalInput): BiologicalSummaryNode[] {
  if (input.kind === 'yeastOwnProducts') return [{ label: 'Produit propre de la levure', amount: input.amount }];
  if (input.kind === 'hopPrecursorTransformation') return [
    { label: 'Précurseur', amount: input.precursor },
    { label: 'Fraction de conversion', factor: input.conversionFraction },
    ...(input.conversionRatio ? [{ label: 'Rapport de conversion', factor: input.conversionRatio }] : []),
  ];
  return [
    { label: 'Quantité à transférer', amount: input.sourceAmount },
    { label: 'Fraction d’extraction', factor: input.extractionFraction },
    { label: 'Fraction de rétention', factor: input.retentionFraction },
  ];
}

function amountSummary(value: BrewingScenarioBiologicalAmount): string {
  const points = [
    `${formatDecimal(value.range.min)}–${formatDecimal(value.range.max)} ${value.unit}`,
    `base ${value.basis}`,
    ...(value.value !== undefined ? [`valeur ${formatDecimal(value.value)}`] : []),
    ...(value.central !== undefined ? [`central ${formatDecimal(value.central)}`] : []),
    ...(value.matrixId ? [`matrice ${value.matrixId}`] : []),
    ...(value.timepoint ? [`temps ${value.timepoint}`] : []),
  ];
  return `${value.analyte} · ${points.join(' · ')}`;
}

function factorSummary(value: BrewingScenarioFactor): string {
  return [
    `${formatDecimal(value.range.min)}–${formatDecimal(value.range.max)} ${value.unit}`,
    ...(value.central !== undefined ? [`central ${formatDecimal(value.central)}`] : []),
    ...(value.fromAnalyte ? [`${value.fromAnalyte} (${value.fromUnit ?? 'unité inconnue'})`] : []),
    ...(value.toAnalyte ? [`→ ${value.toAnalyte} (${value.toUnit ?? 'unité inconnue'})`] : []),
  ].join(' · ');
}

function sourceSummary(source: HopSource): string {
  const reference = source.reference.startsWith('local:scenario-hypothesis:')
    ? 'déclaration locale · jugement'
    : source.reference;
  return [source.title, source.author, reference, source.locator].filter(Boolean).join(' · ');
}

function kindLabel(kind: BrewingScenarioBiologicalInput['kind']): string {
  return inputKinds.find(row => row.value === kind)?.label ?? kind;
}

function originLabel(origin: BrewingScenarioBiologicalAmount['origin'] | BrewingScenarioFactor['origin']) {
  if (origin === 'userHypothesis') return 'Hypothèse utilisateur';
  if (origin === 'observed') return 'Observation';
  if (origin === 'sourceRange') return 'Plage de source';
  if (origin === 'analogy') return 'Analogie';
  if (origin === 'calculated') return 'Calcul';
  if (origin === 'assistantHypothesis') return 'Hypothèse assistée';
  return 'Hypothèse de modèle';
}

function ExistingDeclarations({ inputs, assumptions }: { inputs: BrewingScenarioBiologicalInput[]; assumptions: BrewingScenarioAssumption[] }) {
  if (!inputs.length) return <p className="hv-bio-empty">Aucune entrée biologique déclarée dans cette branche.</p>;
  return <ul className="hv-bio-existing">
    {inputs.map(input => <li key={input.id}>
      <div className="hv-bio-existing__heading"><strong>{kindLabel(input.kind)}</strong><span>Entrée conservée · {input.id}</span></div>
      {linesForInput(input).map((line, index) => {
        const parameter = line.amount ?? line.factor;
        const assumption = parameter?.assumptionId ? assumptions.find(row => row.id === parameter.assumptionId) : undefined;
        return <div className="hv-bio-existing__node" key={`${input.id}-${index}`}>
          <p><strong>{line.label} · {parameter ? originLabel(parameter.origin) : 'Origine inconnue'} :</strong> {line.amount ? amountSummary(line.amount) : line.factor ? factorSummary(line.factor) : ''}</p>
          {assumption?.explanation ? <p><strong>Explication :</strong> {assumption.explanation}</p> : null}
          {parameter?.sourceRefs.length ? <p><strong>Source :</strong> {parameter.sourceRefs.map(sourceSummary).join(' ; ')}</p> : <p><strong>Source :</strong> non renseignée dans cette entrée.</p>}
        </div>;
      })}
      {input.kind === 'hopPrecursorTransformation' ? <>
        <p><strong>Produit :</strong> {input.productAnalyte} · {input.productUnit} · base {input.productBasis}{input.productMatrixId ? ` · matrice ${input.productMatrixId}` : ''}{input.productTimepoint ? ` · temps ${input.productTimepoint}` : ''}</p>
        {!input.conversionRatio ? <p className="hv-bio-inline-note">Rapport analyte/unité absent; la sortie calculée reste inconnue.</p> : null}
      </> : null}
      {input.kind === 'compoundTransferLoss' ? <p><strong>Cible :</strong> {input.targetMatrixId} · {input.targetTimepoint}</p> : null}
      <p><strong>Conditions :</strong> {input.conditions.join(' · ')}</p>
      <p><strong>Limites :</strong> {input.limitations.join(' · ')}</p>
    </li>)}
  </ul>;
}

export function BiologicalInputsEditor({ prepared, branch, onRevise }: BiologicalInputsEditorProps) {
  const id = useId();
  const [kind, setKind] = useState<InputKind>('');
  const [draft, setDraft] = useState<EditorFormState>(() => blankForm());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const chooseKind = (next: InputKind) => {
    setKind(next);
    setDraft(blankForm());
    setError('');
    setNotice('');
  };

  const updateAmount = (key: 'amount' | 'precursor' | 'sourceAmount', patch: Partial<AmountFormState>) => {
    setDraft(current => ({ ...current, [key]: { ...current[key], ...patch } }));
  };
  const updateFactor = (key: 'conversionFraction' | 'conversionRatio' | 'extractionFraction' | 'retentionFraction', patch: Partial<FactorFormState>) => {
    setDraft(current => ({ ...current, [key]: { ...current[key], ...patch } }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!kind) {
      setError('Choisis le type de contribution à déclarer.');
      return;
    }
    try {
      const next = appendBrewingScenarioBiologicalInput(branch, buildInputDraft(kind, draft));
      onRevise(next);
      setError('');
      setNotice('Révision de prévision transmise au scénario. Aucune recette ni observation n’a été écrite ici.');
      setKind('');
      setDraft(blankForm());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La contribution n’a pas pu être préparée.');
      setNotice('');
    }
  };

  return <section className="hv-biological-inputs" aria-labelledby={`${id}-heading`}>
    <header className="hv-biological-inputs__header">
      <div>
        <h3 id={`${id}-heading`}>Entrées chimiques et biologiques de la branche</h3>
        <p>{prepared.runtime.current
          ? 'Le contexte recette préparé sert à la comparaison; ces entrées restent des hypothèses de branche.'
          : 'Ces entrées restent des hypothèses du scénario et ne deviennent pas des faits de recette.'}</p>
      </div>
      <span className="hv-biological-inputs__count">{branch?.biologicalInputs?.length ?? 0} déclarée{(branch?.biologicalInputs?.length ?? 0) === 1 ? '' : 's'}</span>
    </header>

    <ExistingDeclarations inputs={branch?.biologicalInputs ?? []} assumptions={branch?.assumptions ?? []} />

    <form className="hv-biological-inputs__form" autoComplete="off" onSubmit={submit}>
      <label className="hv-bio-field" htmlFor={`${id}-kind`}>
        <span>Nouvelle entrée · type</span>
        <select id={`${id}-kind`} aria-label="Type de contribution biologique" value={kind} onChange={event => chooseKind(event.currentTarget.value as InputKind)} aria-required="true">
          <option value="">Choisir une entrée…</option>
          {inputKinds.map(row => <option value={row.value} key={row.value}>{row.label}</option>)}
        </select>
      </label>

      {kind === 'yeastOwnProducts' ? <>
        <AmountFields label="Produit propre de la levure" node="Produit propre" value={draft.amount}
          onChange={amount => setDraft(current => ({ ...current, amount }))} />
        <CommonScopeFields draft={draft} setDraft={setDraft} />
      </> : null}

      {kind === 'hopPrecursorTransformation' ? <>
        <AmountFields label="Quantité du précurseur" node="Précurseur" value={draft.precursor}
          onChange={precursor => setDraft(current => ({ ...current, precursor }))} />
        <fieldset className="hv-bio-node">
          <legend>Produit transformé</legend>
          <div className="hv-biological-inputs__grid">
            <TextField label="Analyte produit" value={draft.product.analyte} onChange={analyte => setDraft(current => ({ ...current, product: { ...current.product, analyte } }))} required />
            <TextField label="Unité produit" value={draft.product.unit} onChange={unit => setDraft(current => ({ ...current, product: { ...current.product, unit } }))} required />
            <TextField label="Base produit" value={draft.product.basis} onChange={basis => setDraft(current => ({ ...current, product: { ...current.product, basis } }))} required />
            <TextField label="Matrice produit" value={draft.product.matrixId} onChange={matrixId => setDraft(current => ({ ...current, product: { ...current.product, matrixId } }))} hint="Facultative; aucune matrice n’est supposée." />
            <TextField label="Point temporel du produit" value={draft.product.timepoint} onChange={timepoint => setDraft(current => ({ ...current, product: { ...current.product, timepoint } }))} hint="Facultatif; aucun temps n’est supposé." />
          </div>
        </fieldset>
        <FractionFields label="Fraction de conversion" node="Fraction de conversion" value={draft.conversionFraction}
          onChange={conversionFraction => updateFactor('conversionFraction', conversionFraction)}
          scope={draft.precursor.analyte && draft.precursor.unit && draft.product.analyte && draft.product.unit
            ? `${draft.precursor.analyte} (${draft.precursor.unit}) → ${draft.product.analyte} (${draft.product.unit})`
            : undefined} />
        <fieldset className="hv-bio-node hv-bio-node--option">
          <legend>Rapport analyte/unité</legend>
          <label className="hv-bio-check"><input type="checkbox" checked={draft.ratioEnabled} onChange={event => setDraft(current => ({ ...current, ratioEnabled: event.currentTarget.checked }))} /> Déclarer un rapport explicite</label>
          {draft.ratioEnabled ? <RatioFields node="Rapport de conversion" value={draft.conversionRatio}
            onChange={conversionRatio => updateFactor('conversionRatio', conversionRatio)} precursor={draft.precursor} product={draft.product} />
            : <p className="hv-bio-inline-note">Sans rapport exact entre les deux analytes/unités, la projection J5 restera inconnue. Aucun rapport de 1 n’est supposé.</p>}
        </fieldset>
        <CommonScopeFields draft={draft} setDraft={setDraft} />
      </> : null}

      {kind === 'compoundTransferLoss' ? <>
        <AmountFields label="Quantité à transférer" node="Quantité source" value={draft.sourceAmount}
          onChange={sourceAmount => updateAmount('sourceAmount', sourceAmount)} />
        <fieldset className="hv-bio-node">
          <legend>Cible du transfert</legend>
          <div className="hv-biological-inputs__grid">
            <TextField label="Matrice cible" value={draft.targetMatrixId} onChange={targetMatrixId => setDraft(current => ({ ...current, targetMatrixId }))} required hint="Distincte de la base chimique de la quantité source." />
            <TextField label="Point temporel cible" value={draft.targetTimepoint} onChange={targetTimepoint => setDraft(current => ({ ...current, targetTimepoint }))} required />
          </div>
        </fieldset>
        <FractionFields label="Fraction d’extraction" node="Extraction" value={draft.extractionFraction}
          onChange={extractionFraction => updateFactor('extractionFraction', extractionFraction)}
          scope={draft.sourceAmount.analyte && draft.sourceAmount.unit
            ? `${draft.sourceAmount.analyte} (${draft.sourceAmount.unit}) · ${draft.sourceAmount.matrixId || 'matrice source non déclarée'} / ${draft.sourceAmount.timepoint || 'temps source non déclaré'} → même analyte/unité · ${draft.targetMatrixId || 'matrice cible à déclarer'} / ${draft.targetTimepoint || 'temps cible à déclarer'}`
            : undefined} />
        <FractionFields label="Fraction de rétention" node="Rétention" value={draft.retentionFraction}
          onChange={retentionFraction => updateFactor('retentionFraction', retentionFraction)}
          scope={draft.sourceAmount.analyte && draft.sourceAmount.unit
            ? `${draft.sourceAmount.analyte} (${draft.sourceAmount.unit}) · ${draft.sourceAmount.matrixId || 'matrice source non déclarée'} / ${draft.sourceAmount.timepoint || 'temps source non déclaré'} → même analyte/unité · ${draft.targetMatrixId || 'matrice cible à déclarer'} / ${draft.targetTimepoint || 'temps cible à déclarer'}`
            : undefined} />
        <CommonScopeFields draft={draft} setDraft={setDraft} />
      </> : null}

      {error ? <p className="hv-biological-inputs__error" role="alert">{error}</p> : null}
      {notice ? <p className="hv-biological-inputs__notice" role="status">{notice}</p> : null}
      <div className="hv-biological-inputs__actions">
        <button type="submit" disabled={!kind}>Ajouter et recalculer la branche</button>
        <small>Ajout par hypothèse sélectionnée · aucun fait de brassin, recette ou catalogue n’est modifié.</small>
      </div>
    </form>
  </section>;
}

function CommonScopeFields({ draft, setDraft }: {
  draft: EditorFormState;
  setDraft(update: (draft: EditorFormState) => EditorFormState): void;
}) {
  return <fieldset className="hv-bio-node">
    <legend>Conditions de portée</legend>
    <div className="hv-biological-inputs__grid">
      <TextAreaField label="Conditions d’application" value={draft.conditions}
        onChange={conditions => setDraft(current => ({ ...current, conditions }))} required
        hint="Une condition par ligne; ces conditions accompagnent cette entrée." />
      <TextAreaField label="Limites de l’hypothèse" value={draft.limitations}
        onChange={limitations => setDraft(current => ({ ...current, limitations }))} required
        hint="Une limite par ligne; aucune valeur manquante n’est complétée." />
    </div>
  </fieldset>;
}
