OK — BUGS 32 et 34 corrigés et en ligne : tag en-ligne/2026-11-16-transversaux-2 (43f0ce40), atelier-nuit fusionné

(Passes précédentes : RESULTAT-passe6.md à -passe1.md. Celle-ci : passe 7, matin du 16.11.)

Copie : C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux, branche deploy/transversaux, HEAD 43f0ce40.

## 0. Tags
- `en-ligne/2026-11-16-atelier-nuit` (4067e777) manquait : fusionné sans conflit. Seul `en-ligne/2026-11-10-brassin` (ancien) reste hors HEAD, comme admis.
- Boucle refaite juste avant le déploiement et juste après : même résultat, aucun autre tag.

## 1. Constats 32 et 34 (rouge, correction, vert)
- 32 (liste Brassins) : cause observée au banc (voies/deploiement/repro32.mjs) : le texte tapé dans le champ de la liste revenait à chaque retour sur Brassins (état gardé `catalog-batches-filters`) ; la recherche globale se vide déjà à la fermeture et n'écrit rien dans la liste. Je n'ai pas pu reproduire le chemin exact « recherche globale puis Brassins » du constat : lecture étroite, signalée. Correction : `restoreCatalogFilters('batches')` ne restaure plus `search` (src/domain/catalogPreferences.ts). Recettes inchangé.
  Test : tests/unit/recherche-brassins-effacee.test.ts. Rouge : rouge-32.txt (1 failed). Vert : vert-32.txt. Banc : repro32.mjs, F passe de « ZZ TEST » à vide.
- 34 (« Partout » du +) : le PlusSheet retirait de « Partout » les gestes déjà en tête (`filter(!e.monte)`), d'où des jeux différents par écran. Règle du pilote : le commun est toujours identique, les actions de l'écran en tête. Correction : « Partout » montre toujours Écriture, Facture, Vente, Recette, Brassin, Compagnon (six, pair) ; un geste déjà en tête garde sa case avec un renvoi ↑ (classe `plus-pp--renvoi`, `aria-label` « …, aussi en tête de la pile »). Fichiers : src/components/navigation/PlusSheet.tsx, navigation.css.
  Test : tests/unit/plus-commun-identique.test.ts (14 écrans × 2 formes). Rouge : rouge-34.txt (4 failed). Vert : vert-34.txt.
  Tests adaptés (effet voulu) : plus-ecran-pile.test.ts (six pilules, plus de « seule »), port-p6-bilan-plus.test.tsx (« Brassin↑ »).

## 2. Contrôles
- tsc : 0 erreur (tsc-6.txt).
- `npx vitest run tests/unit --reporter=dot` (tests-6.txt) : 2 failed, 11961 passed ; seuls rouges admis : designTokens, rejeu-649b/virgule-transversale.
- .env et src/data/seedData.ts présents. `VITE_HOP_V4=on npm run build` : vert (build-6.txt). check-no-dev-auth : bundle propre ; check-build-flags : 3 DRAPEAUX OK ; check-firebase-config : CONFIG FIREBASE OK ; `dev-local` dans dist : 0 fichier.

## 3. Test d'écran local (banc4.mjs, ?dev-local, clair, 390 tactile et 1280, serveur 3045 arrêté, 0 erreur de console)
Captures dans voies/deploiement/test-ecran-4/, ouvertes : 390 Finances, Atelier, Stocks, Brassins après recherche ; 1280 Finances et Atelier (les autres lues par le DOM : banc4-journal-390.json, -1280.json).
- Recherche « ZZ TEST » puis Brassins : champ vide, pas de « Rien pour » (390 et 1280).
- Le + sur Bord, Finances, Brassins, Atelier, Stocks : « Partout » = Écriture, Facture, Vente, Recette, Brassin, Compagnon sur les cinq, aux deux largeurs ; renvois ↑ : Bord Écriture ; Finances Écriture, Facture, Vente ; Brassins Recette, Brassin ; Atelier Brassin ; Stocks aucun. Actions de l'écran en tête (zone « Sur … » sous « Partout », action pleine contre le +).
- Limite : le 1280 de Bord, Brassins et Stocks n'a pas été ouvert en image (DOM identique).

## 4. Déploiement
- `npx firebase deploy --only hosting --project brasserie-l-affinee` : « found 313 files in dist », « release complete » (deploy-6.txt).
- Page servie : index-HQFiRTDO.js = celui de dist/index.html ; `dev-local` : 0 dans index et App ; `plus-pp--renvoi` présent dans App-DDvZmPHP.js servi.
- Tag `en-ligne/2026-11-16-transversaux-2` posé sur 43f0ce40 dans la copie (dépôt partagé). Note mise à jour : side-session-notes/…/transversaux-deploiement.md (nouveau tag, retour arrière).
- BUGS.md : 32 et 34 marqués corrigés (commit du dépôt principal par chemin).

## Doutes
- 32 : voir ci-dessus, cause élargie (texte de la liste), pas prouvée pour la recherche globale seule.
- Jeu en ligne non fait (hors périmètre) : à jouer sur « ZZ TEST ».
- Un `git commit` de la copie a affiché des « failed to delete .git/worktrees/… » (nettoyage de vieux worktrees, sans effet sur le commit).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une pile du + à contenu variable (filtre `!monte`) contredit « commun toujours là » ; la règle est testée sur les 14 écrans.
LEÇON PROPOSÉE : aucune.
