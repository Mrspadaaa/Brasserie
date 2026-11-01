ECHEC — recette remplie impossible : aucun malt ni sucre en stock de ?dev-local, fixture sans fermentescibles ; captures faites sur l'état vide

## Fichiers écrits
- `work/missions/2026-10-31-ecran-fermentescibles/inventaire/inventaire-fermentescibles.md`
- `work/missions/2026-10-31-ecran-fermentescibles/inventaire/capturer-fermentescibles.mjs` (outil adapté de e2, copie)
- `work/missions/2026-10-31-ecran-fermentescibles/inventaire/captures/` : `fermentescibles-vide-390.png`, `fermentescibles-ajout-390.png`, `fermentescibles-pleine-390.png`, `fermentescibles-pleine-1280.png`, `journal.json`
- Supprimés (mes fichiers de travail) : `sonde-temp.mjs`, `captures/diagnostic.png` (ce dernier encore présent à la suite de l'essai ; à retirer par le pilote si besoin)

## Critères (GATES.md absent du dossier : critères relus dans VOIE.md)
- Inventaire `inventaire-fermentescibles.md` : écrit, structure de l'inventaire Identité, lignes citées ; doutes marqués « ? ».
- Captures ouvertes (L12) : vide-390, ajout-390, pleine-390, pleine-1280, chacune ouverte et décrite.
  - vide-390 : « Ajouter — grain… », « Rien encore. », pas de bandeau.
  - ajout-390 : famille Sucre, liste ouverte « Aucune option ».
  - pleine-390 : identique au vide (« Grain 0 kg », pas de fermentescible) ; état réel de stock vide.
  - pleine-1280 : titre « Modifier « Stout export » », bandeau Grain 0 kg / OG — / IBU 60 / EBC —, liste « Aucune option ».
- Recette remplie avec malts et sucre : NON réalisée. Aucune donnée de démo ni de stock de malts dans `?dev-local` ; la recette « Stout export » (`apercuDev.ts`) n'a que le houblon Nugget.
- Lancement : `with_server.mjs` depuis `atelier-ecrans`, port 5631, erreurs page 0, requêtes bloquées 0.

## Essais utilisés
5 relances (sélecteurs du picker corrigés, sonde de temps). Le picker n'a pas d'attributs `placeholder` ni `aria-label` dans le DOM : repéré par son bouton « Ouvrir la liste ».

## Douteux
- Recette remplie : bloquée par le stock vide. Demande au pilote : un stock de démo, ou accord pour une recette-fixture à malts (sans écriture de données réelles).
- Tests couvrant l'étape : non recensés. Hors ligne, valeur inconnue, Gemini : non vérifiés.
- `journal.json` contient encore des notes « DIAGNOSTIC » de l'essai précédent, réécrites à chaque run.

CONNAISSANCE : aucune

LEÇON PROPOSÉE : aucune
