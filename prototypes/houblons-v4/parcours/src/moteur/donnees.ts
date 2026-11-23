// Venu dans l'app (T12, #170) : une seule copie, src/ui/hopIndex/parcours/donnees.ts. La maquette y pose sa dégustation par défaut :
// la fixture S1 du 18.10 et la recette dégustée (l'app n'en a pas : null, tout simulé).
import { poserDegustationParDefaut } from '../../../../../src/ui/hopIndex/parcours/donnees';
import { DEGUSTATION, recetteDegustee } from '../donnees/cas';

poserDegustationParDefaut({ tasting: DEGUSTATION, recette: recetteDegustee });
export * from '../../../../../src/ui/hopIndex/parcours/donnees';
