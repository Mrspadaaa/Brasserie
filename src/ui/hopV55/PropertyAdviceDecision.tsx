import React from 'react';
import { hopPropertyAdviceViewModel } from '../../domain/hopDecision/propertyAdviceViewModel';
import type {
  HopPropertyAdviceAnswer,
  HopPropertyAdviceDossier,
  HopPropertyAdviceRequest,
} from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import { type PropertyAdviceIntentEditorProps, toV2Intent } from './PropertyAdviceIntentEditor';
import { PropertyAdviceIntentEditorCore } from './propertyAdviceIntentEditorCore';
import { PropertyAdviceDecisionCore, type DecisionCoreAdapter } from './propertyAdviceDecisionCore';
import './property-advice-decision.css';

/* ---------- API publique V2 inchangée ---------- */
export type HopV55PropertyAdviceAnswerUpdate =
  | { kind: 'revision'; answer: HopPropertyAdviceAnswer; answerRecordReference: string }
  | { kind: 'reexamination'; answer: HopPropertyAdviceAnswer; answerRecordReference: string;
      source: { answerRecordReference: string; answerReference: string; interpretationReference: string; requestId: string } };

export interface HopV55PropertyAdviceReinterpretRequest {
  request: HopPropertyAdviceRequest;
  expectedAnswerRecordReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  reason: string;
}

export interface HopV55PropertyAdviceDossierSaveRequest {
  commandId: string;
  expectedAnswerRecordReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
}

export interface HopV55PropertyAdviceHistoryEntry {
  answer: HopPropertyAdviceAnswer;
  answerRecordReference: string;
}

export interface HopV55PropertyAdviceDecisionProps {
  /** Canonical persisted answer; the display projection is pure and never rebuilds evidence. */
  answer: HopPropertyAdviceAnswer;
  answerRecordReference: string;
  dossiers?: readonly HopPropertyAdviceDossier[];
  previousAnswers?: readonly HopV55PropertyAdviceHistoryEntry[];
  readOnly?: boolean;
  materialChoices?: readonly HopDecisionMaterial[];
  onSearchMaterials?: PropertyAdviceIntentEditorProps['onSearchMaterials'];
  onSelectMaterials?: PropertyAdviceIntentEditorProps['onSelectMaterials'];
  onReinterpret?(input: HopV55PropertyAdviceReinterpretRequest): Promise<HopV55PropertyAdviceAnswerUpdate>;
  onSaveDossier?(input: HopV55PropertyAdviceDossierSaveRequest): Promise<HopPropertyAdviceDossier>;
}

/** Adaptateur V2 : projection hopPropertyAdviceViewModel, requestSnapshot V2 exact, aucune question V3 produite. */
const v2Adapter: DecisionCoreAdapter<HopPropertyAdviceAnswer, HopPropertyAdviceRequest> = {
  versionLabel: 'V2',
  interpretationVersion: '2',
  viewModel: (answer) => hopPropertyAdviceViewModel(answer),
  requestOf: (answer) => structuredClone(answer.requestSnapshot),
  renderEditor: (bridge) => <PropertyAdviceIntentEditorCore mode="v2" request={bridge.request}
    candidatePolicy={bridge.request.candidatePolicy} materialChoices={bridge.materialChoices}
    onChangeIntent={(intentId, replacement) => bridge.onChangeIntent(intentId, toV2Intent(replacement))}
    onAddIntent={(intent) => bridge.onAddIntent(toV2Intent(intent))}
    onChangeCandidatePolicy={bridge.onChangeCandidatePolicy} onChangeMaterials={bridge.onChangeMaterials}
    onChangeAccess={bridge.onChangeAccess} onChangeAssertions={bridge.onChangeAssertions}
    onSearchMaterials={bridge.onSearchMaterials} onSelectMaterials={bridge.onSelectMaterials} disabled={bridge.disabled} />,
};

export function HopV55PropertyAdviceDecision(props: HopV55PropertyAdviceDecisionProps) {
  return <PropertyAdviceDecisionCore<HopPropertyAdviceAnswer, HopPropertyAdviceRequest, HopPropertyAdviceDossier> adapter={v2Adapter} {...props} />;
}
