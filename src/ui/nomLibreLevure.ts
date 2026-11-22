import { createContext } from 'react';

/**
 * Le nom tapé dans « Changer de levure » sans résultat (Ma levure, retours du 09.11) : la saisie hors catalogue de
 * YeastIngredientPicker s'ouvre avec lui. Module à part : YeastIngredientPicker reste chargé à la demande.
 */
export const NomLibreInitial = createContext<string | undefined>(undefined);
