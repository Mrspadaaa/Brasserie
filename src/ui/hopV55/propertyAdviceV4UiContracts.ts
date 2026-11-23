import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type { HopV55PropertyAdviceAnswerRecordV4, HopV55PropertyAdviceDossierRecordV4,
  HopV55PropertyAdviceV4ReadingContext } from '../../services/hopV55/propertyAdviceRecordsV4';
import type {
  HopV55PropertyAdviceLedgerActionV4,
  HopV55PropertyAdviceReexaminationBindingChoiceV1,
  HopV55PropertyAdviceReexaminationPreviewV1,
} from '../../services/hopV55/propertyAdvicePreparationV4';

/** The parent owns preparation, builders, record factories, source freshness and persistence. */
export interface HopV55PropertyAdviceV4CorrectionRequest {
  commandId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  reason: string;
}

export interface HopV55PropertyAdviceV4DossierRequest {
  commandId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
}

export interface HopV55PropertyAdviceV4ReexaminationRequest {
  commandId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  reason: string;
}

/** Exact identity of the version currently open in the panel; contains no answer payload or write command. */
export interface HopV55PropertyAdviceDisplayedRecordIdentityV4 {
  ownerKey: string;
  workspaceId: string;
  recordId: string;
  recordReference: string;
  sourceReadingReference: string;
  ledgerReference: string;
}

export interface HopV55PropertyAdviceReexaminationPrepareV4Request {
  previewId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
}

export interface HopV55PropertyAdviceReexaminationConfirmV4Request {
  commandId: string;
  previewId: string;
  expectedPreviewReference: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  bindingChoices: readonly HopV55PropertyAdviceReexaminationBindingChoiceV1[];
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  reason: string;
}

export interface HopV55PropertyAdviceReexaminationPanelV4Props {
  parentRecord: HopV55PropertyAdviceAnswerRecordV4;
  /** The source archive remains immutable; this flag describes the parent view only. */
  readOnly?: boolean;
  onPrepare?(request: HopV55PropertyAdviceReexaminationPrepareV4Request): Promise<HopV55PropertyAdviceReexaminationPreviewV1>;
  onConfirm?(request: HopV55PropertyAdviceReexaminationConfirmV4Request): Promise<HopV55PropertyAdviceAnswerRecordV4>;
}

export interface HopV55PropertyAdviceDecisionV4Props {
  record: HopV55PropertyAdviceAnswerRecordV4;
  previousRecords?: readonly HopV55PropertyAdviceAnswerRecordV4[];
  dossiers?: readonly HopV55PropertyAdviceDossierRecordV4[];
  materialChoices?: readonly HopDecisionMaterial[];
  readOnly?: boolean;
  onCorrect?(input: HopV55PropertyAdviceV4CorrectionRequest): Promise<HopV55PropertyAdviceAnswerRecordV4>;
  onSaveDossier?(input: HopV55PropertyAdviceV4DossierRequest): Promise<HopV55PropertyAdviceDossierRecordV4>;
  onReexamine?(input: HopV55PropertyAdviceV4ReexaminationRequest): Promise<HopV55PropertyAdviceAnswerRecordV4>;
  /** Notifies the Page which exact version is displayed; never persists or changes the source itself. */
  onDisplayedRecordChange?(identity: HopV55PropertyAdviceDisplayedRecordIdentityV4): void;
  onSearchMaterials?(query: string, exactScopeIds: readonly string[]): Promise<HopDecisionMaterial[]>;
  onSelectMaterials?(ids: string[]): Promise<HopDecisionMaterial[]>;
}
