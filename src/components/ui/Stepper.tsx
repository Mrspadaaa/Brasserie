import React from 'react';
import { Units } from '../../services/units';
import { QuantityStepper } from '../../ui/QuantityStepper';

interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
}

/** Le compteur simple partage la saisie décimale et l'appui long du compteur complet. */
export const Stepper: React.FC<StepperProps> = ({ step, ...props }) => (
  <QuantityStepper {...props} customStep={step ?? Units.stepFor(props.unit)} compact />
);
