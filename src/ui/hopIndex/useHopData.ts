// useHopData (T8, #169, D65) : la SEULE source des données du moteur v4 dans l'app. Il lit le stock (articles « Houblon »
// reliés à une variété du catalogue du moteur), la dégustation de la recette et le catalogue du moteur, et rend un moteur
// créé par `creerMoteur` dans le chunk des outils (T9). Rien n'est lu en double : un écran qui a besoin du moteur passe
// ici, pour que le stock ne soit jamais lu à deux endroits (D139 : « un choix sur un endroit, semble pas toujours être reporté
// partout »).
//
// Un snapshot Firestore qui ne change pas ces données ne relance aucun calcul :
// - le stock converti garde la MÊME identité tant que son contenu ne change pas (signature, pas référence) ;
// - le moteur est réutilisé par empreinte des données (moteur.ts : un ou deux contextes, caches conservés) ;
// - la dégustation garde la même identité tant que ses niveaux ne changent pas.
// Hors ligne : on lit les mêmes StorageService (cache Firestore existant) ; rien n'est ajouté au démarrage (le chunk des
// outils est tiré à la demande, jamais importé statiquement ici).
// Le catalogue du moteur (Beer Maverick) et l'index de l'app NE sont PAS fusionnés (décision de l'utilisateur) : un article
// de stock non relié reste dans `nonRelies` (`inconnu:<nom>`, avec sa raison), jamais compté, jamais 0.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Recipe } from '../../types';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import type { CatalogueHop, StockHop } from '../../domain/hopIndex/v4/data';
import type { Moteur } from '../../domain/hopIndex/v4/moteur';
import type { Tasting } from '../../domain/hopIndex/v4/tasting';
import { degustationDeRecette, niveauxDegustes, relierStock, type ArticleNonRelie, type ArticleRelie, type ArticleHoublon } from '../../domain/hopIndex/v4/donneesApp';
import { chargerOutils, outilsCharges, type Outils } from './chargement';

export interface DonneesHop {
  /** Le moteur sur les données de l'app ; null tant que le chunk des outils n'est pas arrivé (aucun écran d'attente : le
   * chunk est préchargé au repos, T9). */
  moteur: Moteur | null;
  /** Le catalogue du moteur (Beer Maverick), tel quel ; null avec le moteur. */
  catalogue: CatalogueHop[] | null;
  /** Le stock relié au moteur, même identité tant que son contenu ne change pas. */
  stock: StockHop[];
  /** Les articles reliés, avec le lien (nom, alias, préfixe). */
  relies: ArticleRelie[];
  /** Les articles de stock que le moteur ne connaît pas : visibles, jamais comptés ni mis à 0. */
  nonRelies: ArticleNonRelie[];
  /** La dégustation de la recette ; null = aucune (le profil de Ma bière est alors tout simulé). */
  degustation: Tasting | null;
  /** Empreinte du contenu des données du moteur (null avant le moteur). */
  empreinte: string | null;
}

/** Garde la valeur précédente tant que la signature ne change pas (un snapshot identique ne change pas l'identité). */
function stable<T>(valeur: T, signature: string): T {
  const ref = useRef<{ signature: string; valeur: T } | null>(null);
  if (!ref.current || ref.current.signature !== signature) ref.current = { signature, valeur };
  return ref.current.valeur;
}

// Lecteurs au niveau du module : `useStorageValue(read)` se réabonne quand `read` change d'identité.
const lireArticles = (): ArticleHoublon[] => StorageService.getStocks().rawMaterials.filter((s) => s.category === 'Houblon');
const lireBrassins = () => StorageService.getBatches();
const lireDegustations = () => StorageService.getHopTastings();

function useOutils(): Outils | null {
  const [outils, setOutils] = useState<Outils | null>(() => outilsCharges());
  useEffect(() => {
    if (outils) return;
    let actif = true;
    chargerOutils().then((o) => { if (actif) setOutils(o); }, () => { /* hors ligne sans chunk : l'écran réessaiera à l'ouverture */ });
    return () => { actif = false; };
  }, [outils]);
  return outils;
}

/** Les données du moteur pour une recette (ou aucune : stock et catalogue seuls). */
export function useHopData(recette?: Pick<Recipe, 'id' | 'batchRef'> | null): DonneesHop {
  const outils = useOutils();
  const articles = useStorageValue(lireArticles);
  const brassins = useStorageValue(lireBrassins);
  const degustations = useStorageValue(lireDegustations);
  const catalogue = outils ? outils.moteur.CATALOGUE : null;

  const reliure = useMemo(() => (catalogue ? relierStock(articles, catalogue) : null), [articles, catalogue]);
  const signatureStock = reliure ? JSON.stringify(reliure.stock) : '';
  const stock = stable(reliure?.stock ?? ([] as StockHop[]), signatureStock);
  const relies = stable(reliure?.relies ?? [], reliure ? JSON.stringify(reliure.relies) : '');
  const nonRelies = stable(reliure?.nonRelies ?? [], reliure ? JSON.stringify(reliure.nonRelies) : '');

  const moteur = useMemo(() => (outils ? outils.moteur.creerMoteur({ catalogue: outils.moteur.CATALOGUE, stock }) : null), [outils, stock]);

  const trouvee = degustationDeRecette(recette, brassins, degustations);
  const niveaux = trouvee ? niveauxDegustes(trouvee.degustation) : null;
  const signatureDeg = trouvee && niveaux ? JSON.stringify([trouvee.degustation.id, trouvee.degustation.date, trouvee.brassin.id, trouvee.brassin.brewDate ?? null, trouvee.degustation.notes ?? null, niveaux]) : '';
  const degustation = stable<Tasting | null>(
    trouvee && niveaux && outils ? outils.moteur.tastingFrom(niveaux, {
      origin: 'dégustation du brasseur', date: trouvee.degustation.date, quote: trouvee.degustation.notes?.trim() || null,
      source: `Dégustation « ${trouvee.degustation.name} » du ${trouvee.degustation.date} (hopTastings/${trouvee.degustation.id}), brassin ${trouvee.brassin.id}.`,
    }) : null,
    outils ? signatureDeg : `sans-outils:${signatureDeg}`,
  );
  const avecBrassin = useMemo<Tasting | null>(() => (degustation && trouvee && trouvee.brassin.brewDate
    ? { ...degustation, batch: { id: trouvee.brassin.id, date: trouvee.brassin.brewDate } } : degustation), [degustation]); // eslint-disable-line react-hooks/exhaustive-deps

  return { moteur, catalogue, stock, relies, nonRelies, degustation: avecBrassin, empreinte: moteur?.empreinte ?? null };
}
