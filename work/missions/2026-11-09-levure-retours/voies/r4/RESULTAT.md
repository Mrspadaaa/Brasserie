OK — article du stock relié à sa fiche catalogue (unique et sûr), une puce par levure ; rôle houblon dit « double » partout

## Fichiers écrits
- `src/domain/levure/relier.ts` (neuf) : `relierAuCatalogue` ; bruit retiré (Levure, sachet, 11 g, parenthèse), tous les mots en identité exacte (`yeastSearchScore` ≥ 1000, `catalogueMatches`), un mot au moins hors fabricant, laboratoire de l'article = celui de la fiche, une seule fiche sinon rien.
- `src/ui/etapeLevure/EtapeLevure.tsx` : `levure` = fiche déclarée, sinon fiche reliée ; `recipeVue` (hopIndexId posé à l'écran seulement) passé à Ma levure ; `stockIds` inclut les articles reliés ; les levures proposées excluent celles du stock.
- `src/ui/etapeLevure/MaLevure.tsx` : table article → fiche ; la tuile du catalogue d'une levure déjà en stock disparaît (une tuile par levure) ; pas de puce « proposée » en double d'une puce du stock.
- `src/ui/hopIndex/rechercheAvancee/catalogue.tsx` : `motDuRole` (« mixte » → « double », le mot de `Usage` de l'étape) dans la ligne, le filtre Rôle, ses comptes ; rôle inconnu « usage ? » comme l'étape (avant « rôle ? »).
- Tests : `tests/unit/levure/relier.test.ts` (7), `tests/integration/etapeLevure/etapeStockCatalogue.test.tsx` (4), `tests/unit/hopIndexV4/rechercheAvancee-role.test.tsx` (3) ; `rechercheAvancee-houblons.test.tsx` adapté (mixte → double).
- `voies/r4/capturer.mjs`, `captures/` (19 PNG + journal.json), `tests.txt`, `sortie-captures.txt`.

## Critères
- Test qui échoue avant : sur la version d'avant, 3 des 4 tests de `etapeStockCatalogue` (FG « ? » et 5 × non documenté ; deux puces Verdant ; deux tuiles Verdant) et 2 des 3 de `rechercheAvancee-role` (ligne « mixte », filtre « mixte ») échouaient. Le 4e test (article inconnu : carte honnête « ? », jamais une fiche approchée) passe avant et après, voulu.
- `npx tsc --noEmit -p .` : code 0.
- `npx vitest run tests/integration/etapeLevure tests/unit/levure tests/unit/hopIndexV4/rechercheAvancee* --reporter=dot` : 19 fichiers, 179 tests verts (`tests.txt`).
- Captures Chrome (banc `?dev-local`, article du stock « Levure LALLEMAND Verdant IPA », 4 sachets, semé simulé) : 390 cave, 390 clair, 1280 clair, toutes ouvertes. Mesures (`journal.json`) : carte Verdant du stock = FG 1,012–1,017, floculation moyen, esters/phénols/thiols/terpènes/rondeur renseignés, 0 « non documenté » (avant en ligne : FG ?, 5 × non documenté) ; tuiles en tapant « verdant » : une seule (stock) ; puce Verdant : une ; Nelson Sauvin « double » dans la recherche (ligne), le filtre Rôle (amérisant 13 · aromatique 142 · double 329) et la ligne de l'étape. Aucun appel réseau hors localhost, aucune erreur de page.

## Essais utilisés
Un essai par critère (aucune retouche après échec).

## Doutes et limites
- « Avant » en capture : pas de second serveur sur HEAD ; l'avant est prouvé par les tests qui échouaient et par les captures en ligne du critique (`critique/en-ligne/l3-verdant-choisie-*`, `h5-nelson-ouvert-*`, `h6-nelson-ajoute-*`).
- Le lien se lit à l'écran. La recette ne reçoit `hopIndexId` qu'au premier geste de conduite (palier touché) ; la recette n'est pas modifiée au simple choix de l'article. Le wizard (`BrewWizard.selectYeast`, hors de ma voie) pourrait le poser au choix ; non fait.
- Un article déjà lié à une autre fiche par `fiche.id` garde celle-là ; une recette à `localDocumentary` (levure personnelle) n'est jamais reliée.
- À 390, la rangée de puces tient une ligne : avec deux levures proposées devant, la puce du stock Verdant passe hors rangée (comportement d'avant ; la tuile du stock s'obtient en tapant). Ordre des puces non touché.
- « Double » : 329 houblons sur 484 documentés, par la règle rôle-α actuelle (hors voie). « Mixte » reste dit sur d'autres écrans (Comparer, fiche, Suggérer : `src/ui/hopIndex/{comparer,fiche,suggerer}`, hors Possède). Le pilote tranche s'il faut les aligner.

DÉCISION À PRENDRE : aligner « mixte » → « double » dans Comparer, la fiche (`fiche/SourcesFiche`) et Suggérer (`suggerer/briques.tsx`, qui dit « mixte » en mot court) ? Recommandation : oui, même mot partout (« double »), voie dédiée car hors de mon périmètre.

CONNAISSANCE : un article du stock de levure ne porte pas `hopIndexId` (le wizard l'efface au choix) ; seul son nom le relie au catalogue, d'où `relierAuCatalogue` (identité exacte, unique, laboratoire cohérent).
LEÇON PROPOSÉE : aucune
