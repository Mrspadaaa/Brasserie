/**
 * Voie l3 (10.11) : le moteur (predictionReferences, nolo) lit la bibliothèque de levures dans la porte `yeastLibraryPorte`, que
 * l'application remplit par `chargerBibliothequeLevures()`. Les tests appellent ces fonctions en synchrone, sans écran : on y met ici la
 * même bibliothèque, sans changer un seul résultat. Seuls la porte et la bibliothèque sont importés : le noyau (yeastReferencesCore)
 * reste à charger par chaque test, après ses `vi.mock`.
 */
import { enregistrerBibliothequeLevures } from '../src/domain/yeastLibraryPorte';
import { yeastCatalogueLibrary } from '../src/domain/yeastCatalogueLibrary';

enregistrerBibliothequeLevures(yeastCatalogueLibrary);
