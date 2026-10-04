import React from 'react';
import type {
  HopPropertyAdviceIntentV3,
  HopPropertyAdviceRequestV3,
} from '../../domain/hopDecision/propertyAdviceSchema';
import type { PropertyAdviceIntentEditorProps } from './PropertyAdviceIntentEditor';
import { PropertyAdviceIntentEditorCore } from './propertyAdviceIntentEditorCore';
import './property-advice-intent-editor.css';

/**
 * Façade V3 stricte : DTO V3 exacts en entrée et en sortie (aucun passage par la V2).
 * Elle ajoute la question « comparer des compensations perceptives » (investigation.kind
 * 'comparePerceptualCompensation') et sa garde explicite; les autres questions restent sans ce champ.
 */
export interface PropertyAdviceIntentEditorV3Props extends Omit<PropertyAdviceIntentEditorProps, 'request' | 'onChangeIntent' | 'onAddIntent'> {
  request: HopPropertyAdviceRequestV3;
  onChangeIntent(intentId: string, replacement: HopPropertyAdviceIntentV3): void;
  onAddIntent(intent: HopPropertyAdviceIntentV3): void;
}

export function HopV55PropertyAdviceIntentEditorV3(props: PropertyAdviceIntentEditorV3Props) {
  return <PropertyAdviceIntentEditorCore {...props} mode="v3" />;
}

export {
  COMPENSATION_KIND,
  COMPENSATION_FORBIDDEN_METRICS,
  blockingCompensationIssues,
  compensationIssues,
  type CompensationIssue,
} from './propertyAdviceCompensationV3';
