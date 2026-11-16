ECHEC — G1 : 12 fichiers sur 13 verts (136/138 tests), loupe.test.tsx échoue seul (deux copies de React, hors du port) ; G2 TSC OK

## Fait (tests verts un par un, `npx vitest run <fichier> --reporter=dot`)
- batchAm4Am5 : test adapté (e1a/e2a/e4c ont retiré le sélecteur « Étape du brassin » du planifié et des étapes d'après ; mêmes règles jouées par l'échelle des étapes, « Plus » pour Terminé→Conditionné ; fermentation garde son sélecteur).
- batchFollowUp : test adapté (« Brassé le » / « Était prévu le » n'existent plus dans e2a : on vérifie le bloc d'état et l'écriture des dates, qui restent).
- batchPackagingVolume : test adapté (le formulaire de volume est remplacé par l'échelle e4c : bouteilles au curseur, volume réparti, plafond = cuve 22 L ; 0 refusé et dit).
- batchStockFollowUp : test adapté (annulé s'ouvre sur Dossier : renvoi « Stock à confirmer » ; conditionner et fermentation par l'échelle ; En attente d'ensemencement lu dans la pastille du Dossier).
- tests/unit/depense/loupe.test.tsx : échoue SEUL aussi (« Cannot read properties of null (reading 'useRef') » : `react-zoom-pan-pinch` résolu dans `../jolly-mahavira-cc0cc2/node_modules`, deux copies de React). Hors du port, non touché. À rejouer par l'exécutant ; si repasse sous charge faible : « instable sous charge ».

## Régressions corrigées dans src (3)
1. `fiche/StageLadder.tsx` : l'échelle offrait « Passer en fermentation » à un planifié sans levure ajoutée (permission perdue de AM 4). Maintenant le bouton n'existe que si `statusOptions` l'offre ; sinon la raison (`fermentationBlockedReason`).
2. `BatchDetailSheet.tsx`, panneau « ⋯ » : geste perdu « Terminé → revenir à Conditionné » (plus aucun chemin dans e2a). Ajout de « Revenir à « Conditionné » » (confirmation dans la page habituelle), seulement pour un brassin terminé.
3. `fiche/PostFiche.tsx` (HeroEtat annulé) : « Abandonnée, jamais brassée » s'affichait pour un lot hérité avec `brewDate` réelle. `brasse` utilise maintenant aussi `hasBrewStarted(batch)`.
Écart connu maquette : la date de brassage / prévue d'un brassin annulé n'est plus affichée (e2a), elle reste écrite.

## Reprise 2 (15.11) — faits en plus (tests verts un par un)
- bStockVolumesNoms : test adapté (le tableau est remplacé par [data-role="etapes"] de e10c ; mêmes noms accentués vérifiés).
- productionVolumeBornes : test adapté (« Taper le volume » + blur/Entrée ; 99 999 → alerte « au plus 2 000 L » et totaux « — », 0 → « 0,5 L ou plus » ; « recette 19,75 L » à la virgule).
- brewCreationBudgetContinuity : test adapté (volume tapé par « Taper le volume » ; Vanille 4,00 gousse lue dans l'étape Levurage, Rinçage 29,6 puis le rinçage scientifique à 300 L lus dans l'étape ; plus de « Eaux adaptées »).
- compactProduction : test adapté, réécrit sur e10c (effacement + Tab → refus dit et totaux « — » ; 12,5 + Entrée → 2,50 kg ; le curseur remplace Ajouter/Retirer 0,5 L et Rétablir 30 L ; champ texte décimal, jamais number ; recette source nulle → alerte « recette source » après choix au curseur). Écart noté : 25,5 g d'écorce s'affichent « 26 g » (décimales fixes de la maquette, écart −4 g), la valeur calculée reste 25,5.
- dashboardNavigation : test adapté (règle voulue par p3 : la période ne juge que les brassins finis, un brassin en garde reste listé). Ajout du lot fini « DASHBOARD-DONE » pour garder l'intention « la période n'est pas élargie par l'ouverture directe ».
- liveDataViews : test adapté (e1a : un planifié n'a plus de saisie de densité ; la lecture en cours de frappe survit à la mise à jour serveur, jouée sur un brassin en fermentation).
- productionCatalog : test adapté (bilan p2 : plus de bouton « Explorer les profils », puces « Filtrer : Citra » à « 2 fiches » ; analyses « 23 L brassés », « IPA 1 » ; écart OG −0,005 ; l'alcool sans FG mesurée n'est plus inventé : « — » au lieu de −4,7 pts). Fichier passé de CRLF à LF.
- loupe.test.tsx : échoue seul (deux copies de React). Hors du port, non touché.
- yeastPitchingExecution (fait, voir plus bas) :  (5 échecs : région « Préparation de levure » introuvable dans la fiche d'un brassin prévu, à lire dans e2a/p1 : geste perdu ou renommé ?), puis tests.txt, tsc (G2), git status.

## Fin (15.11)
- yeastPitchingExecution : test adapté (e1a/e7a : sur un planifié la préparation de levure vit dans la carte de l'onglet « Préparer » ; titre « Starter Culture liquide A · 1,5 L » ; le détail (produit, inoculum, régularisation) est replié sous « Produit, inoculum, régularisation » et s'ouvre au toucher ; la dernière étape est listée dans la carte et dans la notice ; le changement de date passe par Dossier → « Reporter » → curseur « Jour de brassage » → « Enregistrer lu … » à la place de « Changer la date / Autre date »). Même règle vérifiée : copie figée, comptage explicite, date changée → plan conservé et alerte de révision.
- G1 (tests.txt) : 15 fichiers verts, loupe.test.tsx seul rouge. Il échoue aussi isolé : « Cannot read properties of null (reading 'useRef') », react-zoom-pan-pinch résolu dans ../jolly-mahavira-cc0cc2/node_modules (deux React). Non touché. À rejouer par l'exécutant hors de ce worktree ; il ne dépend pas du port.
- G2 : TSC OK (aucune erreur hors functions/).
- git status (hors work/) : seuls les 13 tests de echecs.txt (+ ceux déjà listés), les src/ des ports et tests/unit/port-* ; rien d'autre.
- Doutes : (1) 25,5 g d'écorce affichés « 26 g » (décimales de la maquette) ; (2) un planifié n'a plus de saisie de densité (e1a, voulu) ; (3) l'écart ABV sans FG n'est plus affiché (p2, plus honnête) ; (4) « Commencer la préparation du starter » est replié dans le détail ; le geste visible est la case de la 1re étape (même effet, begin()).
DÉCISION À PRENDRE : loupe.test.tsx — corriger la résolution de react-zoom-pan-pinch (node_modules du worktree) ou l'exclure de G1 ; recommandation : retirer ce fichier de G1 (hors du port, hors de mon périmètre).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

## Reste à faire (8 fichiers)
Constat : p3 a remplacé l'écran Volumes. « Volume cible » n'est plus un champ visible : on clique le bouton « Taper le volume », puis `getByRole('textbox', { name: 'Volume cible' })` ; la valeur se valide au blur ou Entrée (pas à chaque frappe). Plus de `table` ni de boutons « Ajouter/Retirer 0,5 L » / « Rétablir 30 L » ; le curseur est `getByRole('slider', {name:'Volume cible, curseur'})` ; `<select name=production_scale_recipe_select>` nom « Recette source » (option = le nom seul, sans « · 19,75 L ») ; `<output>` « recette 19,75 L · × 1,00 » ; totaux dans `aria-label="Totaux"` (eau/grain/houblon, « — » si refusé) ; étapes dans `[data-role="etapes"]` ; refus = `role=alert` (« Indique un volume cible de 0,5 L ou plus. » ; « Au plus 2 000 L … ») ; valeurs en décimales fixes (« 5,10 kg »). Le refus ne « retient » plus 0,5 L : il dit la borne (règle gardée, geste changé).
- bStockVolumesNoms (TE-38) : remplacer `getByRole('table')` par `[data-role="etapes"]`.
- productionVolumeBornes (4) : ouvrir « Taper le volume », change + blur ; 99 999 → alerte « au plus 2 000 L » et totaux « — » (pas de 18 000 kg) ; 0 → « 0,5 L ou plus » ; l'option « Hazy · 19,75 L » → texte « recette 19,75 L » (jamais « 19.75 L »).
- brewCreationBudgetContinuity (1) : lignes 95 et 98, ouvrir « Taper le volume » avant `getByRole('textbox', …)`, ajouter blur ; la ligne `row Vanille Fermenteur 4 gousse` et « Eaux adaptées » sont à revérifier sur le nouvel écran (sinon lire la même quantité dans `[data-role="etapes"]`).
- compactProduction (6 + peut-être 'permet de changer de source') : réécrire sur le nouvel écran (user-event : clic « Taper le volume », `clear`, Tab → « — » et totaux « — » ; saisie « 12,5 » + Entrée → totaux ; slider pour revenir ; matchMedia coarse sans effet : le champ est un `<input type=text inputMode=decimal>`). Les stepper (Ajouter/Retirer 0,5 L, Rétablir 30 L) sont retirés par la maquette e10c : remplacer par le curseur.
- dashboardNavigation (2), liveDataViews (1), productionCatalog (3) : causes non encore lues. Pistes : liveDataViews « Unable to fire a change event » = champ densité de la fiche (section par défaut `measurements` ; en fermentation le relevé est dans le repli ; chercher le label) ; productionCatalog « Explorer les profils et ingrédients » = bouton du bilan p2 (voir p2/RESULTAT.md) ; dashboardNavigation = fiche ouverte depuis le tableau de bord (lire le message d'échec).
- Ensuite : écrire `tests.txt` avec la commande de VOIE.md, `npx tsc --noEmit` (G2), `git status --short`.

## Notes
- Le fichier `tests/integration/batchStockFollowUp.test.tsx` est passé de CRLF à LF (script Node) : cosmétique.
- Aucun commit, stash, déploiement.
