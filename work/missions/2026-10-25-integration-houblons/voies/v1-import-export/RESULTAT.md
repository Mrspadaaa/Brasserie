OK — export et import de recette fonctionnent : houblons, moments, grammes et eau gardés, lecture locale.

Périmètre : vérification du brasseur (26.10), « l'import, export de recette fonctionne toujours ». Aucun code modifié.

Fichiers écrits (dans ce dossier seulement) :
- work/missions/2026-10-25-integration-houblons/voies/v1-import-export/RESULTAT.md
- work/missions/2026-10-25-integration-houblons/voies/v1-import-export/parcours-import-export.mjs
- work/missions/2026-10-25-integration-houblons/voies/v1-import-export/export-1.txt (export de la fixture)
- work/missions/2026-10-25-integration-houblons/voies/v1-import-export/export-2-apres-import.txt (ré-export après import)
- work/missions/2026-10-25-integration-houblons/voies/v1-import-export/journal-run2.txt
- work/missions/2026-10-25-integration-houblons/voies/v1-import-export/img/01 à 05 (390 × 844, png)

1. Tests unitaires et d'intégration (vitest, `--maxWorkers=2`) : 7 fichiers, 43 tests, 43 verts.
- tests/integration/recipeImportRoundTrip.test.tsx : 8 tests, OK
- tests/integration/RecipeTextExport.test.tsx : 4 tests, OK
- tests/unit/d100RecipeImportResult.test.ts : 6 tests, OK
- tests/unit/recipeText.test.ts : 7 tests, OK
- tests/unit/recipeTransfer.test.ts : 8 tests, OK
- tests/unit/recipeWaterExport.test.ts : 7 tests, OK
- tests/unit/fermentationImport.test.ts : 3 tests, OK
Tests lancés sur 7e349464 avec l'arbre de travail sale (122 fichiers modifiés, aucun sur les chemins recette), pas sur un HEAD propre.

2. Parcours Chrome réel (`?dev-local&etape=houblons`, fixture « Stout export », puppeteer-core, Gemini bloqué) : deuxième passage, tous les contrôles OK.
- Export : « Récapitulatif » puis « Texte complet et fichier » ; en-tête « L’AFFINÉE — RECETTE v1 », houblon « Nom : "Nugget" / Masse (g) : 46 / Alpha (%) : 13 / Moment : "boil" / Durée (min) : 60 », section eau présente (Réseau, profil cible, sels).
- Import : « Coller une recette » → texte exporté → « Lire la recette » : « Lue localement » (sans IA), aucun avertissement, « Reprendre » OK.
- Après import, ré-export : houblons identiques à l'export initial (comparaison ligne à ligne).
- Captures regardées : 02 (export), 03 (import lu : Nugget 46 g, Ébullition 60 min · 13 %, eau réseau), 05 (ré-export). Pas de débordement visible.

3. Gestes en échec : passage 1 : un ECHEC sur « 46 g », erreur de mon contrôle (le texte exporté est « Masse (g) : 46 », pas « 46 g »). Corrigé dans le script, passage 2 OK. Aucun geste de l'app n'a échoué.
Console passage 1 : une erreur 500 et un « [vite] Failed to reload …/maBiere/briques.tsx » au démarrage du dev-server, non reproduits au passage 2. Ce fichier est modifié dans l'arbre de travail (hors de cette voie), donc à surveiller.

Essais : 1 sur le parcours (2 passages au total, le premier avec mon contrôle erroné).

Doutes restants :
- HEAD a bougé pendant la voie : 7e349464 puis b355fa86 (D171–D173, documents seulement, aucun chemin recette). Le dev-server a servi l'arbre de travail sale, pas b355fa86 propre.
- La fixture n'a ni fermentescibles ni volumes (grain 0 kg, eau 0 L) : l'import n'a pas été testé sur des malts ni des volumes d'eau. Les tests unitaires couvrent les champs, pas ce parcours.
- L'import depuis une fixture TS du dépôt n'a pas été joué : seul le texte exporté a servi.
- Le bouton « Télécharger .txt » n'est pas testé dans Chrome ; le test vitest RecipeTextExport le couvre.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
