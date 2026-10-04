import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import type {
  HopV55PropertyAdviceAnnotationLedgerV1,
  HopV55PropertyAdviceLedgerEntryV1,
  HopV55PropertyAdviceV4ReadingContext,
} from '../../src/services/hopV55/propertyAdviceRecordsV4';
import {
  DraftBlockersV4,
  HopV55PropertyAdviceAnnotationEditorV4,
  accessDeclarationV4,
  annotationActionsV4,
  annotationRowsV4,
  applyAccessDeclarationV4,
  changeItemsV4,
  draftBlockersV4,
  emptyAnnotationDraftV4,
  ledgerAnnotationsV4,
  pendingLinksV4,
  projectedActiveV4,
  projectionDiffV4,
  resetAccessV4,
  restoreV4,
  unlinkV4,
  withoutUndefinedV4,
  type V4AnnotationDraft,
} from '../../src/ui/hopV55/PropertyAdviceAnnotationEditorV4';

/* Registre et brouillon V4 : aucune écriture du registre, une action par terme, aucun lien retiré en silence. */
type Intent = HopPropertyAdviceIntentV3;
type Entry = HopV55PropertyAdviceLedgerEntryV1;

const Q = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
const AT = '2026-10-03T10:00:00.000Z';
const USER = { origin: 'user' as const, label: 'Brasseur' };
const PROPOSAL = { origin: 'proposal' as const, label: 'Lecteur de la question' };
const PRESET_LIAISON = 'Mot de liaison ou de construction, pas un terme de ma bière';

function span(text: string) {
  const start = Q.indexOf(text);
  if (start < 0) throw new Error(`Fragment absent : ${text}`);
  return { start, end: start + text.length, text };
}
function intent(id: string, label: string, patch: Partial<Intent> = {}): Intent {
  return { id, property: 'unresolved', label, role: 'investigation', direction: 'investigate', qualification: null, required: true,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified',
    subject: { kind: 'beer', label: 'Ma bière', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [span(label)], interpretationOrigin: 'proposal', basis: `Lu dans « ${label} ».`, relatedIntentIds: [], ...patch };
}

const douce = intent('a-douce', 'douce', { property: 'sweetness', role: 'reportedObservation', direction: null, metric: 'sensory',
  comparisonBasis: { kind: 'current', assertionIds: [] } });
const si = intent('a-si', 'si');
const compenser = intent('a-compenser', 'compenser', { property: 'sweetness', metric: 'sensory', relatedIntentIds: ['a-douce'],
  investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: ['a-douce'] } });
const augmenter = intent('a-augmenter', 'augmenter', { property: 'bitterness', role: 'constraint', direction: 'exclude', metric: 'sensory' });
const poire = intent('a-poire', 'poire', { property: 'aroma', role: 'constraint', direction: 'keep', metric: 'sensory',
  comparisonBasis: { kind: 'current', assertionIds: [] } });
const amertume = intent('a-amertume', 'amertume', { property: 'bitterness', role: 'target', direction: 'increase', metric: 'sensory',
  comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
const jardin = intent('a-jardin', 'mon houblon de jardin', { property: 'materialCharacter', interpretationOrigin: 'user',
  subject: { kind: 'material', label: 'Houblon de jardin', materialId: null, sensoryContext: 'rawHop' }, basis: 'Caractériser avant de choisir.' });
const SOURCES = [douce, si, compenser, augmenter, poire, amertume];

function entry(source: Intent, kind: Entry['decision']['kind'], actId: string, reason: string, prior?: Entry, active?: Intent): Entry {
  const entryId = `entry:${source.id}:${kind}:${actId}`;
  return { entryId, annotationId: source.id, sourceAnnotation: source, sourceKind: 'initial', disposition: kind === 'reject' ? 'rejected' : 'active',
    decision: { kind, actId, reason, recordedAt: AT, recordedBy: kind === 'initialize' ? PROPOSAL : USER,
      ...(prior ? { predecessorEntryReference: prior.reference } : {}) },
    ...(kind === 'reject' ? {} : { activeIntent: active ?? source }), reference: `ref:${entryId}` };
}

function ledgerOf(sources: Intent[], entries: Entry[]): HopV55PropertyAdviceAnnotationLedgerV1 {
  return { format: 'hop-v55-property-advice-annotation-ledger-v1', sourceAnnotations: sources, entries, reference: 'ledger-a' };
}

const initial = SOURCES.map((source) => entry(source, 'initialize', 'act-create', 'Lecture initiale proposée.'));
const ledger = ledgerOf(SOURCES, [...initial, entry(amertume, 'reject', 'act-r1', 'Cible fabriquée : je ne demande pas plus d’amertume', initial[5])]);
const unknownAccess = { state: 'unknown' as const, basis: 'Accès non déclaré.', assertionIds: [] as string[] };
const EXCLUSION = { id: 'excl-bitterness', intervention: 'changeBitterness' as const, certainty: 'certain' as const,
  intentIds: ['a-augmenter'], reason: 'Sans décider d’augmenter l’amertume.' };
const rc = {
  interpretation: { id: 'interp-1', version: 'hop-v55-property-advice-reading-v4', origin: 'proposal', text: 'Constat de douceur et garde poire.' },
  candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière demandée explicitement.' },
  context: { stage: 'conditioning', stageBasis: 'Stade fourni par le brassin source.',
    access: { bulkBeer: unknownAccess, sampling: unknownAccess, separatePortion: unknownAccess }, assertions: [] },
  exclusions: [EXCLUSION],
} as unknown as HopV55PropertyAdviceV4ReadingContext;
const annotations = ledgerAnnotationsV4(ledger);
const annotationIds = new Set(annotations.map((row) => row.annotationId));

afterEach(() => cleanup());

describe('registre V4 et brouillon de gestes', () => {
  it('partitionne par dernière entrée et garde la projection d’avant l’écart', () => {
    expect(annotations.map((row) => [row.annotationId, row.disposition])).toEqual([
      ['a-douce', 'active'], ['a-si', 'active'], ['a-compenser', 'active'], ['a-augmenter', 'active'], ['a-poire', 'active'], ['a-amertume', 'rejected']]);
    const rejected = annotations[5];
    expect(rejected.active).toBeUndefined();
    expect(rejected.lastActive).toEqual(amertume);
    expect(rejected.entries.map((row) => row.decision.kind)).toEqual(['initialize', 'reject']);
    const revised: Intent = { ...douce, qualification: 'trop douce', interpretationOrigin: 'user' };
    const first = entry(douce, 'initialize', 'act-create', 'Lecture initiale proposée.');
    const second = entry(douce, 'revise', 'act-r1', 'Préciser.', first, revised);
    const [only] = ledgerAnnotationsV4(ledgerOf([douce], [first, second, entry(douce, 'reject', 'act-r2', 'Écarter.', second)]));
    expect(only.source).toEqual(douce);
    expect(only.lastActive).toEqual(revised);
  });

  it('dérive une action par terme, origine user et motifs exacts; un changement d’origine seul n’est pas une révision', () => {
    const draft = emptyAnnotationDraftV4('record-ref-a', rc);
    draft.edits['a-poire'] = { ...poire, interpretationOrigin: 'user' };
    expect(annotationActionsV4(annotations, draft, 'Motif global')).toEqual([]);
    draft.edits['a-poire'] = { ...poire, role: 'preference' };
    draft.rejections['a-si'] = 'Mot outil';
    const next = restoreV4(draft, annotations[5], 'Écarté par erreur');
    next.additions.push(jardin);
    expect(annotationActionsV4(annotations, next, 'Motif global')).toEqual([
      { kind: 'reject', annotationId: 'a-si', reason: 'Mot outil' },
      { kind: 'revise', annotationId: 'a-poire', activeIntent: { ...poire, role: 'preference', interpretationOrigin: 'user' }, reason: 'Motif global' },
      { kind: 'restore', annotationId: 'a-amertume', activeIntent: { ...amertume, interpretationOrigin: 'user' }, reason: 'Écarté par erreur' },
      { kind: 'add', sourceAnnotation: jardin, activeIntent: jardin, reason: 'Caractériser avant de choisir.' },
    ]);
    expect(ledger.entries).toHaveLength(7);
  });

  it('signale les liens pendants (relation, constat comparé, partenaire, exclusion) sans jamais les retirer', () => {
    const draft = { ...emptyAnnotationDraftV4('record-ref-a', rc), rejections: { 'a-douce': 'x', 'a-augmenter': 'y' } };
    const active = projectedActiveV4(annotationRowsV4(annotations, draft));
    expect(pendingLinksV4(active, rc, annotationIds)).toEqual([
      { kind: 'intent', ownerId: 'a-compenser', targetId: 'a-douce', via: ['related', 'observation'] },
      { kind: 'exclusion', exclusionId: 'excl-bitterness', targetId: 'a-augmenter' },
    ]);
    const partnered = { ...poire, partner: { kind: 'observation', id: 'a-si' } } as Intent;
    const external = { ...poire, partner: { kind: 'observation', id: 'observation-externe' } } as Intent;
    const noExclusion = { ...rc, exclusions: [] };
    expect(pendingLinksV4([partnered], noExclusion, annotationIds)).toEqual([{ kind: 'intent', ownerId: 'a-poire', targetId: 'a-si', via: ['partner'] }]);
    expect(pendingLinksV4([external], noExclusion, annotationIds)).toEqual([]);
    expect(pendingLinksV4([], rc, annotationIds)).toEqual([]);
    const blockers = draftBlockersV4(annotationRowsV4(annotations, draft), draft.readingContext);
    expect(blockers.links).toHaveLength(2);
    expect(blockers.compensation).toEqual([]);
    expect(draft.edits).toEqual({});
  });

  it('délier retire seulement la cible choisie, sans propriété indéfinie envoyée', () => {
    const owner = { ...compenser, relatedIntentIds: ['a-douce', 'a-poire'], partner: { kind: 'observation', id: 'a-douce' } } as Intent;
    const next = unlinkV4(emptyAnnotationDraftV4('record-ref-a', rc), owner, 'a-douce').edits['a-compenser'];
    expect(next.relatedIntentIds).toEqual(['a-poire']);
    expect(next.investigation).toEqual({ kind: 'comparePerceptualCompensation', observationIntentIds: [] });
    expect('partner' in next).toBe(false);
    expect(next.sourceSpans).toEqual(compenser.sourceSpans);
    expect(withoutUndefinedV4({ ...poire, partner: undefined })).not.toHaveProperty('partner');
  });

  it('attestation d’accès : un constat sert la déclaration, le motif et la source locale; inconnu ne crée rien', () => {
    expect(accessDeclarationV4('sampling', { state: 'unknown', statement: '', title: 'T', author: 'A' }, 'as-1')).toEqual({
      access: { state: 'unknown', basis: 'Accès déclaré inconnu par le brasseur.', assertionIds: [] }, note: 'échantillon : inconnu' });
    expect(() => accessDeclarationV4('sampling', { state: 'yes', statement: '  ', title: 'T', author: 'A' }, 'as-2')).toThrow();
    const yes = accessDeclarationV4('sampling', { state: 'yes', statement: 'Je peux prélever.', title: 'Accès déclaré · Échantillon', author: 'Brasseur' }, 'as-3');
    expect(yes.assertion).toEqual({ id: 'as-3', subject: 'sampling', statement: 'Je peux prélever.', state: 'reported', value: true, dimension: 'process',
      source: { title: 'Accès déclaré · Échantillon', author: 'Brasseur', year: null, kind: 'observation', reference: 'local-declaration:as-3',
        locator: 'Motif déclaré : Je peux prélever.' } });
    expect(yes.access).toEqual({ state: 'yes', basis: 'Je peux prélever.', assertionIds: ['as-3'] });
    const external = accessDeclarationV4('bulkBeer', { state: 'no', statement: 'Lot déjà embouteillé.', title: 'Fiche de lot', author: 'Cave',
      external: { kind: 'observation', reference: 'lot-42', year: 2026 } }, 'as-4');
    expect(external.assertion?.source).toEqual({ title: 'Fiche de lot', author: 'Cave', year: 2026, kind: 'observation', reference: 'lot-42' });
    let draft = applyAccessDeclarationV4(emptyAnnotationDraftV4('record-ref-a', rc), 'sampling', yes);
    draft = applyAccessDeclarationV4(draft, 'sampling', accessDeclarationV4('sampling',
      { state: 'no', statement: 'Plus de prélèvement possible.', title: 'Accès déclaré · Échantillon', author: 'Brasseur' }, 'as-5'));
    expect(draft.readingContext.context.assertions.map((row) => row.id)).toEqual(['as-5']);
    draft = resetAccessV4(draft, 'sampling', rc);
    expect(draft.readingContext.context.assertions).toEqual([]);
    expect(draft.readingContext.context.access.sampling).toEqual(rc.context.access.sampling);
    expect(draft.accessNotes).toEqual({});
    expect(rc.context.assertions).toEqual([]);
  });

  it('avant/après : rôle, direction et relations nommés; le motif prérempli les reprend', () => {
    const labelOf = (id: string) => (id === 'a-douce' ? 'douce' : id);
    expect(projectionDiffV4(poire, { ...poire, role: 'preference', direction: null }, labelOf)).toEqual([
      { field: 'Rôle', before: 'Garde', after: 'Préférence' }, { field: 'Direction', before: 'garder tel quel', after: 'aucune' }]);
    expect(projectionDiffV4(compenser, { ...compenser, relatedIntentIds: [] }, labelOf)).toEqual([{ field: 'Liens', before: '« douce »', after: 'aucun' }]);
    expect(projectionDiffV4(poire, { ...poire, interpretationOrigin: 'user' }, labelOf)).toEqual([]);
    const draft = { ...emptyAnnotationDraftV4('record-ref-a', rc), edits: { 'a-poire': { ...poire, role: 'preference' as const } }, rejections: { 'a-si': 'Mot outil' } };
    const items = changeItemsV4(annotationRowsV4(annotations, draft), draft, rc);
    expect(items.map((item) => item.line)).toEqual(['Écarter « si » : Mot outil.', 'Corriger « poire » (rôle : Garde → Préférence).']);
    expect(items[0].changes).toEqual([{ field: 'Lecture', before: 'Question · à qualifier', after: 'écartée, trace conservée' }]);
  });
});

describe('HopV55PropertyAdviceAnnotationEditorV4 — composant', () => {
  it('lecture seule : question exacte, passages marqués, écart tracé avec motif et aucun geste', () => {
    const { container } = render(<HopV55PropertyAdviceAnnotationEditorV4 rootId="t" question={Q} annotations={annotations} readingContext={rc} materials={[]} />);
    expect(screen.getByLabelText('Question originale, mot pour mot').textContent).toBe(Q);
    expect([...container.querySelectorAll('mark.hv4-frag.is-rejected')].map((mark) => mark.textContent)).toEqual(['amertume']);
    expect(screen.getByText('5 termes retenus · 1 écarté')).toBeTruthy();
    expect(screen.getAllByText(/Cible fabriquée : je ne demande pas plus d’amertume/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Lu dans la question', { selector: 'li > b' })).toHaveLength(6);
    expect(screen.getAllByText('Écarté', { selector: 'li > b' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /^Écarter/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restaurer « amertume »' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Préciser l’accès/ })).toBeNull();
  });

  it('écarter avec motif puis garder, restaurer : seul le brouillon change, jamais le registre reçu', () => {
    const latest: { draft?: V4AnnotationDraft } = {};
    function Harness() {
      const [draft, setDraft] = React.useState<V4AnnotationDraft>();
      latest.draft = draft;
      return <HopV55PropertyAdviceAnnotationEditorV4 rootId="t" question={Q} annotations={annotations} readingContext={rc} draft={draft}
        onUpdateDraft={(update) => setDraft((current) => update(current ?? emptyAnnotationDraftV4('record-ref-a', rc)))} materials={[]} />;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Écarter « si »' }));
    expect((screen.getByRole('button', { name: 'Écarter ce terme' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: PRESET_LIAISON }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Précision du motif · « si »' }), { target: { value: 'simple conjonction' } });
    fireEvent.click(screen.getByRole('button', { name: 'Écarter ce terme' }));
    expect(latest.draft?.rejections).toEqual({ 'a-si': `${PRESET_LIAISON} — simple conjonction` });
    expect(screen.getByText('À écarter')).toBeTruthy();
    expect(annotations[1].disposition).toBe('active');
    fireEvent.click(screen.getByRole('button', { name: 'Garder « si »' }));
    expect(latest.draft?.rejections).toEqual({});
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer « amertume »' }));
    expect(screen.queryByRole('radio', { name: 'Comme avant l’écart' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Écarté par erreur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer ce terme' }));
    expect(latest.draft?.restorations).toEqual({ 'a-amertume': 'Écarté par erreur' });
    expect(latest.draft?.edits['a-amertume']).toEqual(amertume);
    expect(screen.getByText('Restauré · à confirmer')).toBeTruthy();
    expect(ledger.entries).toHaveLength(7);
  });

  it('les blocages proposent des gestes explicites; « ne pas écarter » ne délie rien en douce', () => {
    const draft = { ...emptyAnnotationDraftV4('record-ref-a', rc), rejections: { 'a-douce': 'Hors sujet' } };
    const rows = annotationRowsV4(annotations, draft);
    const blockers = draftBlockersV4(rows, draft.readingContext);
    let applied: V4AnnotationDraft = draft;
    render(<DraftBlockersV4 blockers={blockers} rows={rows} readingContext={draft.readingContext} onUpdateDraft={(update) => { applied = update(applied); }} />);
    expect(screen.getByRole('button', { name: 'Délier « douce » de « compenser »' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ne pas écarter « douce »' }));
    expect(applied.rejections).toEqual({});
    expect(applied.edits).toEqual({});
  });
});
