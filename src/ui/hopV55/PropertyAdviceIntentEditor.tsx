import React from 'react';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import type { HopDocumentaryAccess } from '../../domain/hopDecision/documentaryAnswerSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type {
  HopPropertyAdviceCandidatePolicy,
  HopPropertyAdviceIntent,
  HopPropertyAdviceRequest,
} from '../../domain/hopDecision/propertyAdviceSchema';
import { PropertyAdviceIntentEditorCore, type EditorCoreIntent } from './propertyAdviceIntentEditorCore';
import './property-advice-intent-editor.css';

type AccessScope = keyof HopPropertyAdviceRequest['context']['access'];

/** API publique V2 inchangée. */
export interface PropertyAdviceIntentEditorProps {
  request: HopPropertyAdviceRequest;
  candidatePolicy: HopPropertyAdviceCandidatePolicy;
  /** Canonical material rows supplied by the parent; labels are never identities. */
  materialChoices: readonly HopDecisionMaterial[];
  onChangeIntent(intentId: string, replacement: HopPropertyAdviceIntent): void;
  onChangeCandidatePolicy(policy: HopPropertyAdviceCandidatePolicy): void;
  onSearchMaterials(query: string, exactScopeIds: readonly string[]): Promise<HopDecisionMaterial[]>;
  onSelectMaterials(ids: string[]): Promise<HopDecisionMaterial[]>;
  onChangeMaterials(materials: HopDecisionMaterial[]): void;
  onChangeAccess(scope: AccessScope, value: HopDocumentaryAccess): void;
  onChangeAssertions(assertions: HopAdviceAssertion[]): void;
  /** Appends a complete user-corrected DTO to the request draft; persistence remains in the parent. */
  onAddIntent(intent: HopPropertyAdviceIntent): void;
  disabled?: boolean;
}

/**
 * Une intention V2 ne porte jamais de question V3. Le noyau en mode 'v2' n’en produit pas; si une valeur
 * en portait une malgré tout, elle est refusée plutôt que retirée en silence (aucun champ V3 dans une requestV2).
 */
export function toV2Intent(intent: EditorCoreIntent): HopPropertyAdviceIntent {
  if (Object.prototype.hasOwnProperty.call(intent, 'investigation')) {
    throw new Error('Une question de comparaison V3 ne peut pas être envoyée dans une requête V2.');
  }
  const { investigation, ...rest } = intent;
  void investigation;
  return rest;
}

export function HopV55PropertyAdviceIntentEditor(props: PropertyAdviceIntentEditorProps) {
  const { onChangeIntent, onAddIntent, ...rest } = props;
  return <PropertyAdviceIntentEditorCore {...rest} mode="v2"
    onChangeIntent={(intentId, replacement) => onChangeIntent(intentId, toV2Intent(replacement))}
    onAddIntent={(intent) => onAddIntent(toV2Intent(intent))} />;
}
