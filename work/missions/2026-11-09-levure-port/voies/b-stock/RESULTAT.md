OK — b-stock : tout corrigé sauf les « à trancher » demandés ; BE-42 corrigé, captures avant/après 390 et 1280 ouvertes

## SUITE du 09.11 (décisions du pilote) — à lire en premier

| id | issue | preuve | fichiers |
|---|---|---|---|
| BR-75, BE-95 | corrigé | `bStockSousOnglet.test.tsx` (rouge avant) : le sous-onglet « Stock » devient « Articles », l'écran reste « Stocks ». Captures avant/après 390 et 1280, deux thèmes : « Stock (1) » puis « Articles (1) ». Contrôle `scripts/manual_monkey_test.mjs` aligné ; les autres scripts testent `includes('Stock')`, qui reste vrai pour « Stocks » ; `dataEntry.test` « Stock » est la section du récapitulatif de recette, sans rapport | `StocksTab.tsx`, `scripts/manual_monkey_test.mjs` |
| TE-39 | corrigé | `bStockEmpatagePlafonne.test.ts` (rouge avant) : le plan d'eau porte `mashLimitedByKettleL` quand la cuve plafonne l'empâtage (jamais en répartition manuelle ni pour un petit grain) ; `bStockVolumesNoms.test.tsx` : la ligne « Empâtage plafonné par la cuve (35 L utiles). » sous les deux volumes, absente sinon. Un champ ajouté au moteur, aucune règle changée (`brewingWaterPlanning` vert) | `src/services/brewingMath.ts`, `ProductionTab.tsx` |
| AM-47 | corrigé | `bStockMaterielActuel.test.ts` + `bStockMaterielActuelModal.test.tsx` (rouges avant) : à « Préparer un brassin », si le volume dépasse le matériel ACTUEL (fermenteur, cuve), un bandeau « Sur ton matériel actuel (nom) : … » et un bouton « Adapter à N L » (plus grand volume qui tient, pas de 0,5 L). Rien n'est refusé ni changé seul ; matériel inconnu = aucune alerte. `brewCreationBudgetContinuity`, `batchScheduling` verts | `src/domain/materielActuel.ts` (neuf), `src/components/QuickActionModal.tsx` |
| TE-41 | corrigé (lecture à confirmer) | `batchStockFollowUp.test.tsx` (rouge avant) : le bandeau « Stock de ce brassin à confirmer… » n'est plus au-dessus des trois rubriques : complet dans Mesures, une ligne « Stock à confirmer · voir Mesures » dans Carnet et Dossier. Un déstockage refusé (`stockReviewIssues`) reste montré là où le brasseur agit (test AM 4 vert). Ma lecture de « se répète dans… » (ligne du registre coupée) : le bandeau se répétait dans chaque rubrique | `src/ui/BatchDetailSheet.tsx` |
| AM-70 (retouche) | corrigé | capturé avant/après : fiche « Remplir le fût » : le brassin déjà couvert donne l'erreur rouge « Les autres fûts de ce brassin contiennent déjà 20 L pour 20 L produits… », bouton éteint ; « Livrer le fût » sans client : bouton éteint (avant : actif, « facultatif »). Retouche à la vue des captures : « Indique le client… » en aide grise, plus en rouge à l'ouverture (comme TE-48) | `KegBoard.tsx`, `KegSheet.tsx` |
| BR-120, BE-46 | corrigé, capturé | `pastilles-<largeur>-<thème>-avant/apres.png` : au thème cave, « Fermentation », « Garde froide », « Conditionné », « Annulé » étaient en couleur sur teinte (3,8–4,4:1) ; ils sont en texte courant, la teinte reste dans l'aplat et la bordure. Styles calculés relevés dans Chrome : texte rgb(245,240,234) en cave, rgb(17,17,17) en clair | `batchStatus.ts` |
| BE-42 | corrigé | `tests/unit/stock/bStockCourbe.test.tsx` (rouge avant : « 20,5 °C sur son trait de consigne »). Cause : le haut du cadre rabattait l'étiquette sur son propre trait (plage 2–23 °C, trait à 20,5 °C). `setpointLabelBaseline` : au-dessus s'il y a la place, sinon juste dessous, dans le premier creux libre de la grille. Captures `courbe-*-avant/apres` : « 20,5 °C » et « 22 °C » barrés par le trait avant, nets après. Le « + » qui couvre « fin J9 » est le bouton d'action flottant de l'application, qui flotte par-dessus tout contenu ; au bas du défilement il ne couvre rien (capture `courbe-bas`) ; je ne l'ai pas changé | `src/ui/FermentationTemperatureChart.tsx` |
| RJ-14 (pilote) | corrigé, non capturé | voir plus bas ; `data-sans-valeur` + 13 px | `BrewIngredients.tsx`, `brew-day.css` |

Restent « à trancher » comme demandé : AM-49 (b-divers), TE-35 et TE-36 (b-dep), AM-56 (après le port Levure), AM-NOTE-3 (accord du brasseur), GE-NOTE-1 (goût).

### Captures (dossier `captures/`, 134 fichiers, script `capturer.mjs`, banc `?dev-local`, données « ZZ »)
Avant = copie de HEAD (`git archive`, port 5653) ; après = l'arbre de travail (port 5652, `vite.banc.config.mjs`, cache Vite à part). Serveurs arrêtés. Ouvertes en image et jugées :
- Articles : `articles-1280-clair-apres` (sous-onglet « Articles 1 », écran « Stocks ») ; `articles-recherche-90-1280-clair-apres` (90 lettres : le message passe à la ligne, aucun défilement latéral, largeur page 1280 = fenêtre 1280). Avant : « Stock » (relevé des libellés).
- TE-39 : `volumes-te39-390-clair-apres` : « Empâtage plafonné par la cuve (35 L utiles). » sous Empâtage 26,1 L / Rinçage 19,8 L ; le texte « mention » relevé vrai dans les 4 combinaisons ; avant : pas de mention.
- TE-41 : `te41-dossier-390-clair-avant/apres` (bandeau complet de 8 lignes, puis une ligne « Stock à confirmer · voir Mesures ») et `te41-mesures-1280-clair-apres` (bandeau complet dans Mesures).
- AM-47 : `am47-modal-1280-clair-avant` (aucun avertissement pour 60 L sur un fermenteur de 30 L), `am47-modal-390-clair-apres` et `1280-cave-apres` (« Sur ton matériel actuel (Système 30L) : Le fermenteur (30 L) est plein avant 60 L… » et bouton « Adapter à 29 L »). Retouche à la vue de la première capture : message de 5 phrases en gras ramené à 2, en graisse normale.
- AM-70 : `futs-couvert-390-clair-avant/apres`, `futs-livrer-sans-client-1280-cave-avant/apres`.
- RJ-14 : `rj14-ensemencement-390-clair-avant` (« À préciser » en 20 px, sur deux lignes dans son cadre de 106 px) et `-apres` (petit bouton « À préciser » d'une ligne) ; `journal-vide-1280-clair-apres` : « Exporter .txt » éteint.
- BE-42 : `courbe-390-clair-avant/apres`, `courbe-1280-cave-avant/apres`.
- BR-120 : `pastilles-390-cave-avant/apres`, `pastilles-1280-clair-apres`.
Non rejouées après des chargements ratés du banc (page « Chargement de la brasserie » ou état intermédiaire) : certaines vues du thème cave à 390 (AM-47 cave, RJ-14 cave) ; les autres combinaisons de chaque scène sont dans le dossier et n'ont pas été ouvertes une à une.

## Tableau (première passe)

Les ids jumeaux (BR-xx / BE-xx) portent la même issue. Là où cette première passe dit « à trancher », la SUITE ci-dessus fait foi pour BR-75, BE-95, TE-39, AM-47, BE-42, TE-41.

| id | issue | preuve | fichiers |
|---|---|---|---|
| AM-70 | corrigé (3 volets) | `bStockFuts.test.tsx` (14 tests, rouges avant sur la fiche et sur le tableau) : fût rempli seulement d'un brassin fermentation/garde/conditionné (planifié, annulé, terminé refusés) ; contenance des AUTRES fûts du brassin ≥ volume produit ⇒ refus avec motif (un fût en partie vide reste permis) ; fût livré sans client ⇒ Enregistrer éteint. Fiche ET tableau des fûts (KegBoard) | `src/domain/stock/futs.ts` (neuf), `src/ui/KegSheet.tsx`, `src/ui/KegBoard.tsx`, `src/components/tabs/StocksTab.tsx` |
| BR-60, BE-41 | corrigé | `bStockJourBrassage.test.tsx` : « Exporter .txt » éteint (title « Rien à exporter : le journal est vide. ») quand il n'y a aucune entrée, actif dès une mesure ; rouge avant | `src/ui/BrewJournal.tsx` |
| BE-37 | corrigé | même fichier de test : « Volume : 2.5 L » et « Dernier relevé · … 2.5 L » devenaient « 2,5 L » ; le reste de BE-37 (en-tête 19,75 L, Consigne 78,5 °C, « L au total », Ca/SO₄) était déjà à la virgule (`roundFr`, BR-56, test `brewDayDefautsB`) ; `controle-virgule.mjs` : VIRGULE OK | `src/domain/brewDay.ts` (`readingFeedback`), `src/ui/BrewDayMeasurements.tsx` |
| BR-120, BE-46 | corrigé | `tests/unit/stock/bStockPastilles.test.ts` : contraste calculé depuis `themes.css`, 6 statuts × 2 thèmes × 3 surfaces ≥ 4,5:1 (rouge avant : water/cuivre/alerte/vert 3,8–4,4 au thème cave, vert et cuivre 4,4 en clair sur cave-850). Pastilles en texte courant + teinte dans l'aplat et la bordure. Compteur de filtre de la liste sans `opacity-75`. Limite : l'autre « compteur sur #ddd » n'est pas localisé sans capture ; le compteur de filtre a été corrigé sans test rouge préalable (test posé après) | `src/domain/batchStatus.ts`, `src/ui/production/CatalogToolbar.tsx` |
| RJ-14 (ajouté par le pilote) | corrigé | test `bStockPastilles.test.ts` (rouge avant) : « À préciser » / « Non renseignée » marqués `data-sans-valeur` et rendus en texte 13 px qui passe à la ligne (`overflow-wrap:anywhere`) au lieu de 20 px mono dans 106 px. Rendu non capturé : voir DEMANDE EXECUTANT | `src/ui/BrewIngredients.tsx`, `src/pages/brew-day.css` |
| BR-51, BE-32 | déjà corrigé | commit 5195a6b2 : `READING.volume.max = 2000` ; test neuf : « 99999 » ⇒ Noter éteint, « Saisis 0,1 à 2000 L. », rien au journal | `tests/integration/bStockJourBrassage.test.tsx` |
| BR-69, BE-89 | déjà corrigé | 8c1490eb (ligne qui ne bouge qu'après 1,2 s, `toggleFavorite` en fusion) ; test `defautsStocksEcrans` « épingler change l'étoile tout de suite… » vert | — |
| BR-70, BE-90 | déjà corrigé | 8c1490eb (`resetKey` : liste remise en haut au changement de filtre) ; jsdom seulement, « à confirmer » reste : Chrome demandé | — |
| BR-71, BE-91 | déjà corrigé | fa57b7b9 / 9c5b20d5, test « BR-71 : la virgule suisse dans Caractéristiques techniques » vert | — |
| BR-72, BE-92 | déjà corrigé | fa57b7b9 `quantiteLue`, test « BR-72 » vert | — |
| BR-73, BE-93 | déjà corrigé | 9c5b20d5 (Combobox bornée au conteneur) ; jsdom seulement : Chrome demandé. Le texte tapé dans Nom ne filtre pas la liste : champ distinct, non retenu comme défaut | — |
| BR-74, BE-94, BR-93 | déjà corrigé | 8c1490eb (`break-words`, `overflow-wrap:anywhere` dans `EntityList`, que `KegBoard` et la liste Matériel réemploient) ; test de classes seulement, mesure 390 : Chrome demandé | — |
| BR-76, BE-96 | déjà corrigé | 8c1490eb `verifierSeuil` (plafond 1 000 kg), test vert | — |
| BR-111 | déjà corrigé | 5b5132a0, `productionVolumeBornes.test.tsx` « 99 999 L : refusé avec la borne » vert | — |
| BR-112 | déjà corrigé | 5b5132a0 : « 0 » dit la borne et « 0,5 L retenu » (`volumeNote`), même fichier de test. L'écran est `ProductionTab` (Volumes), pas BrewWizard | — |
| BR-113 | déjà corrigé | 5b5132a0, test « la recette source s'écrit à la virgule » vert | — |
| TE-38 | non jouable | accents jamais perdus dans le code : `bStockVolumesNoms.test.tsx` (Röstgerste, Caramünch à 30 L) vert ; aucune occurrence de « Rstgerste » dans `src` ni les fixtures ; la perte vient de la donnée saisie au banc | `tests/integration/bStockVolumesNoms.test.tsx` |
| TE-48 | déjà corrigé | 9c5b20d5, test « Matériel déjà possédé s'ouvre sans reproche » vert | — |
| TE-37 | déjà corrigé | 603e7c37 (« Convertir en client », « Passer dans mes recettes »). Reste le bouton « Réfléchir à mes projets · Avec Gemini » : Gemini, non joué ⇒ non jouable | — |
| GE-NOTE-3 | déjà corrigé | TL-33/TL-34 sont « vérifié en ligne ff0f822e » dans le registre ; la note est caduque | — |
| PD-5, PD-13 | non jouable | la bulle « Compagnon hors connexion · mode local » (`BrewerActivity`, `fixed top-1`) ne s'affiche que si `isDevLocal` (`App.tsx`) : artefact du banc `?dev-local`, jamais en ligne ; fichiers hors Possède | — |
| BR-75, BE-95 | à trancher : le sous-onglet « Stock » (`StocksTab.tsx` l. 310) devient-il « Articles » (ma recommandation, le nom de l'écran restant « Stocks ») ou « Stocks » ? La palette de commandes de `App.tsx` (interdit) dit aussi « Stock ». Un mot, réversible, mais le registre le classe goût | — | — |
| BE-42 | à trancher : courbe des consignes de température (étiquette 20,5 °C sur le trait 20 °C, « + » sur « fin J9 ») est dans `FermentationTemperatureChart.tsx` / `YeastBrewDayGuide.tsx`, partagés avec les écrans levure (u1/u2), hors Possède | — | — |
| TE-35, TE-36 | à trancher : écran Finances (`UpgradeSheet`, `UpgradeWorkspace`), voie b-dep | — | — |
| TE-39 | à trancher : empâtage qui baisse quand le volume monte = `BrewingMath.waterVolumes` (empâtage plafonné par la cuve utile) ; règle de calcul d'une autre voie ; question : plafond voulu ou à afficher ? | — | — |
| AM-47 | à trancher : volume repris de la recette sans contrôle du matériel actuel ⇒ adapter ou refuser ? (choix de règle) | — | — |
| AM-49 | à trancher : bornes de capacité à 10 000 L (Réglages, voie b-divers) ; l'évaporation est déjà bornée à 30 L/h (55c25391) | — | — |
| AM-56 | à trancher : l'alerte « sachet périmé » au moment de brasser demande le lot choisi à l'étape Levure (`BrewWizard` bloc levure, `etapeLevure/**`, `YeastPitchingPanel`), interdits ici ; `statutDurabilite` est prête dans `domain/stock/regles.ts` | — | — |
| AM-NOTE-3 | à trancher : `AddStockItemModal`, `EditStockItemModal`, `EditBatchModal` restent du code mort ; suppression interdite sans accord | — | — |
| GE-NOTE-1 | à trancher : seuil exact ⇒ « À commander » avec « à définir » (goût du brasseur) | — | — |

## Fichiers modifiés
`src/domain/stock/futs.ts` (neuf), `src/ui/KegSheet.tsx`, `src/ui/KegBoard.tsx`, `src/components/tabs/StocksTab.tsx`, `src/ui/BrewJournal.tsx`, `src/ui/BrewDayMeasurements.tsx`, `src/ui/BrewIngredients.tsx`, `src/domain/brewDay.ts`, `src/domain/batchStatus.ts`, `src/ui/production/CatalogToolbar.tsx`, `src/pages/brew-day.css`.
Hors Possède lu à la lettre mais rattaché à mes écrans (à valider au `git status`) : `KegSheet`, `KegBoard`, `BrewJournal`, `BrewIngredients`, `BrewDayMeasurements`, `CatalogToolbar`, `domain/brewDay.ts`, `domain/batchStatus.ts`.

## Tests ajoutés
`tests/integration/bStockFuts.test.tsx`, `tests/integration/bStockJourBrassage.test.tsx`, `tests/integration/bStockVolumesNoms.test.tsx`, `tests/unit/stock/bStockPastilles.test.ts`.

## Contrôles
- Tests : `npx vitest run` sur mes 4 fichiers + stock, jour de brassage, fûts, production, matériel : 42 fichiers, 373 tests verts (puis 9 fichiers, 227 tests verts après RJ-14).
- `npx tsc --noEmit -p .` : 2 erreurs, aucune dans mes fichiers (`etapeLevure/Chercher.tsx` useRef, `identite/ChampNombre.tsx` : voies u1 / b-assistant).
- `controle-virgule.mjs` : VIRGULE OK.
- `git status --short` : mes fichiers ci-dessus ; les autres `M` / `??` viennent des autres voies.
- Essais : aucun critère au-delà de 3 ; le test des pastilles a dû être corrigé une fois (aplat cuivre fixe dans `tailwind.config.js`).

## DEMANDE EXECUTANT
Aucune capture prise par moi (série à refaire sur deux thèmes et deux largeurs). Serveur : `PORT=5652 npm run dev`, ouvrir `http://localhost:5652/?dev-local`, fixtures simulées seulement, jamais l'app en ligne.
1. Brassins, liste, 390 et 1280, thèmes clair et cave : une pastille de chaque statut (Planifié, Fermentation, Garde froide, Conditionné, Terminé, Annulé) et la rangée des filtres avec leurs compteurs. À ouvrir : texte lisible, teinte encore reconnaissable.
2. Stocks › Fûts : fiche d'un fût ⇒ « Plein » ⇒ liste des brassins (pas de planifié) ; deux fûts du même brassin ; « Livré » sans client. 390 et 1280.
3. Jour de brassage, étape Ensemencement avec levure sans quantité : la case « À préciser » (RJ-14), 390 ; journal vide : « Exporter .txt » éteint.
4. Stock 390 : mot de 90 lettres dans la recherche (pas de défilement latéral, BR-74), « Nouvel article » liste de catégories (BR-73), filtre « À commander » après défilement (BR-70).
Sorties attendues : captures nommées `b-stock-<sujet>-<largeur>-<thème>.png` dans `work/missions/2026-11-09-levure-port/voies/b-stock/captures/`, toutes ouvertes en image.

## DÉCISIONS À PRENDRE
- AM-70, fermentation : j'ai gardé « fermentation » parmi les brassins qui remplissent un fût, car le tableau des fûts disait déjà « au moins en fermentation ». Si le brasseur veut « fini seulement », retirer `'fermentation'` de `STATUTS_FUTABLES` (une ligne).
- AM-70, client : l'ancien champ « Client de livraison (facultatif) » du tableau devient obligatoire pour « Livrer le fût ».
- BR-75 : recommandation « Articles » pour le sous-onglet.

CONNAISSANCE : une règle de fût (statuts qui le remplissent, contenance des autres fûts, client de livraison) vit dans `src/domain/stock/futs.ts` ; la fiche et le tableau des fûts l'appellent tous deux.
LEÇON PROPOSÉE : sur une liste de bugs ouverts, rejouer d'abord chaque cas sur HEAD avant de coder : 20 des 44 étaient déjà corrigés par des commits que le registre ne citait pas (`git log -S` sur l'id).

## Fichiers de la suite hors Possède à valider au `git status`
`src/services/brewingMath.ts` (un champ optionnel), `src/components/QuickActionModal.tsx` (bandeau AM-47), `src/domain/materielActuel.ts` (neuf), `src/ui/BatchDetailSheet.tsx`, `src/ui/FermentationTemperatureChart.tsx` (non touché). Tests de la suite : 32 fichiers, 369 verts ; `tsc` : aucune erreur dans ces fichiers.
LEÇON PROPOSÉE : un banc « avant » se fait en copiant HEAD (`git archive`) avec le `.env` et `seedData.ts` ignorés, et deux serveurs Vite sur le même `node_modules` demandent chacun leur `cacheDir`.
