# Voie a-entrees — ses choix, codés mais hors des vraies entrées ? (D366)

Agent : `relecteur` (Sonnet). Plafond : 40 tours. Lecture seule du code ; tu n'écris que `voies/a-entrees/RESULTAT.md`.

## Pourquoi
Mots du brasseur (02.11, soir) : « Pourquoi ça a pas été porté ??? », puis « mais aucune des deux entrées réelles ne l'affiche. C'est le cas pour
d'autres chose ??????? ». Le cas trouvé (D366) : son choix B (plusieurs pages, `src/ui/depense/Pages.tsx`) était codé et testé en montant
l'écran sur sa première vue. Mais « Lire un justificatif » ouvrait d'office le sélecteur d'un seul fichier (effet `pickedOnOpen` sur
`startWithScan`), et « Saisir une dépense » ne montrait que « Joindre un justificatif ». Ce cas est déjà corrigé dans le worktree.

## La question
Pour chacun de ses choix, réponds sans croire aucun reçu :
- **où il est codé** : le fichier et la ligne du composant ;
- **comment l'app y arrive depuis une vraie entrée** : la chaîne de rendu, de `src/App.tsx` (menu, onglet, bouton) jusqu'au composant, avec
  chaque condition sur le chemin. Une condition que seul un test, `?dev-local`, `apercu`, `etat=`, un drapeau ou une fixture rend vraie ne
  compte pas comme une vraie entrée ;
- **verdict** : `atteint` (avec le chemin), `codé non atteint` (avec la condition qui bloque), `non codé`, ou `douteux` (avec ce qu'il faudrait
  vérifier dans Chrome).

## Ses choix à passer
1. La Dépense : la table « ## Pages » de `work/missions/2026-10-31-ecran-depense/MISSION.md` (chaque page porte son choix), et les « son choix »
   ou « Son choix » de `work/refonte-frontend/decisions.md` à partir de D250. Parmi eux : la lecture lente D, le plateau pu4d, plié et déplié,
   les sous-familles D, la TVA, le QR, la frise, la valider, les noms, Regrouper et Rétablir, l'arrondi, la famille d'une ligne (D364).
2. Les houblons : `work/refonte-frontend/v4/choix/ecrans.json`, la route de chaque écran. Dis s'il existe dans l'app réelle (`src/`), ou
   seulement dans la maquette jouable (`work/…`).

## Rendre
`voies/a-entrees/RESULTAT.md` :
- ligne 1 : `OK — <n> choix passés : <a> atteints, <b> codés non atteints, <c> non codés, <d> douteux` ;
- puis un tableau `| choix | décision | codé où | chemin depuis l'entrée | verdict | ce qui bloque |` ;
- aucune valeur de ses pièces.
Rends cette ligne 1.
