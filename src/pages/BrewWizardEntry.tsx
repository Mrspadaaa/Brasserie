import React from 'react';
import { BrewWizard } from './BrewWizard';
import { Suggestions } from '../services/suggestions';
import { useStorageValue } from '../hooks/useLiveData';
const readStyles = () => Suggestions.recipeStyles();

/** Load the full style catalogue only with the recipe editor. */
export default function BrewWizardEntry(props: Omit<React.ComponentProps<typeof BrewWizard>, 'knownStyles'>) {
  const knownStyles = useStorageValue(readStyles);
  return <BrewWizard {...props} knownStyles={knownStyles} />;
}
