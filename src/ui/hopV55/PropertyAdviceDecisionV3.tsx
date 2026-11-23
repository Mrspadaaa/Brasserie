import React, { type ReactNode } from 'react';
import { hopPropertyAdviceViewModelV3 } from '../../domain/hopDecision/propertyAdviceViewModel';
import type {
  HopPropertyAdviceAnswerV3,
  HopPropertyAdviceDossierV3,
  HopPropertyAdviceRequestV3,
} from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type { HopV55PropertyAdviceDossierSaveRequest } from './PropertyAdviceDecision';
import type { PropertyAdviceIntentEditorProps } from './PropertyAdviceIntentEditor';
import { PropertyAdviceIntentEditorCore } from './propertyAdviceIntentEditorCore';
import { PropertyAdviceDecisionCore, type DecisionCoreAdapter } from './propertyAdviceDecisionCore';
import { blockingCompensationIssues } from './propertyAdviceCompensationV3';
import './property-advice-decision.css';

/*
 * Façade V3 stricte : answer/request/dossier/view V3 exacts,
 * projection hopPropertyAdviceViewModelV3 (assertion V3), aucune answerV3 castée en V2.
 * Mêmes références attendues, même commande stable aux retries, mêmes retours discriminés revision/reexamination.
 */
export type HopV55PropertyAdviceAnswerUpdateV3 =
  | { kind: 'revision'; answer: HopPropertyAdviceAnswerV3; answerRecordReference: string }
  | { kind: 'reexamination'; answer: HopPropertyAdviceAnswerV3; answerRecordReference: string;
      source: { answerRecordReference: string; answerReference: string; interpretationReference: string; requestId: string } };

export interface HopV55PropertyAdviceReinterpretRequestV3 {
  request: HopPropertyAdviceRequestV3;
  expectedAnswerRecordReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  reason: string;
}

/** Commande de conservation identique à la V2 (mêmes références attendues); le dossier retourné est V3. */
export type HopV55PropertyAdviceDossierSaveRequestV3 = HopV55PropertyAdviceDossierSaveRequest;

export interface HopV55PropertyAdviceHistoryEntryV3 {
  answer: HopPropertyAdviceAnswerV3;
  answerRecordReference: string;
}

export interface HopV55PropertyAdviceDecisionV3Props {
  answer: HopPropertyAdviceAnswerV3;
  answerRecordReference: string;
  dossiers?: readonly HopPropertyAdviceDossierV3[];
  previousAnswers?: readonly HopV55PropertyAdviceHistoryEntryV3[];
  readOnly?: boolean;
  materialChoices?: readonly HopDecisionMaterial[];
  onSearchMaterials?: PropertyAdviceIntentEditorProps['onSearchMaterials'];
  onSelectMaterials?: PropertyAdviceIntentEditorProps['onSelectMaterials'];
  onReinterpret?(input: HopV55PropertyAdviceReinterpretRequestV3): Promise<HopV55PropertyAdviceAnswerUpdateV3>;
  onSaveDossier?(input: HopV55PropertyAdviceDossierSaveRequestV3): Promise<HopPropertyAdviceDossierV3>;
  renderContextNotice?(entry: HopV55PropertyAdviceHistoryEntryV3, canCorrect: boolean, openCorrection: () => void): ReactNode;
}

const v3Adapter: DecisionCoreAdapter<HopPropertyAdviceAnswerV3, HopPropertyAdviceRequestV3> = {
  versionLabel: 'V3',
  /* Le type `interpretation` est partagé par les requests V2 et V3 : même version d’interprétation que la V2. */
  interpretationVersion: '2',
  viewModel: (answer) => hopPropertyAdviceViewModelV3(answer),
  requestOf: (answer) => structuredClone(answer.requestSnapshot),
  validateDraft: (request) => blockingCompensationIssues(request.propertyIntents).map((issue) => {
    const owner = request.propertyIntents.find((intent) => intent.id === issue.intentId);
    return `« ${owner?.label ?? issue.intentId} » : ${issue.message}`;
  }),
  renderEditor: (bridge) => <PropertyAdviceIntentEditorCore mode="v3" request={bridge.request}
    candidatePolicy={bridge.request.candidatePolicy} materialChoices={bridge.materialChoices}
    onChangeIntent={bridge.onChangeIntent} onAddIntent={bridge.onAddIntent}
    onChangeCandidatePolicy={bridge.onChangeCandidatePolicy} onChangeMaterials={bridge.onChangeMaterials}
    onChangeAccess={bridge.onChangeAccess} onChangeAssertions={bridge.onChangeAssertions}
    onSearchMaterials={bridge.onSearchMaterials} onSelectMaterials={bridge.onSelectMaterials} disabled={bridge.disabled} />,
};

export function HopV55PropertyAdviceDecisionV3(props: HopV55PropertyAdviceDecisionV3Props) {
  return <PropertyAdviceDecisionCore<HopPropertyAdviceAnswerV3, HopPropertyAdviceRequestV3, HopPropertyAdviceDossierV3> adapter={v3Adapter} {...props} />;
}
